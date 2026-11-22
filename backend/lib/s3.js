import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || process.env.AWS_SES_REGION || "ap-south-1";
const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;

const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

export const s3Client = new S3Client({
	region,
	credentials: {
		accessKeyId: accessKeyId || "",
		secretAccessKey: secretAccessKey || "",
	},
});

/**
 * Extract MIME type and Buffer from a base64 string or Data URL
 */
function parseBase64Image(base64String) {
	let mimeType = "image/jpeg";
	let extension = "jpg";
	let base64Data = base64String;

	const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
	if (matches && matches.length === 3) {
		mimeType = matches[1];
		base64Data = matches[2];

		if (mimeType.includes("png")) extension = "png";
		else if (mimeType.includes("webp")) extension = "webp";
		else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) extension = "jpg";
		else if (mimeType.includes("gif")) extension = "gif";
		else if (mimeType.includes("svg")) extension = "svg";
	}

	const buffer = Buffer.from(base64Data, "base64");
	return { buffer, mimeType, extension };
}

/**
 * Upload an image (base64 or buffer) to AWS S3
 * @param {string|Buffer} image - base64 Data URL, base64 string, or Buffer
 * @param {string} folder - folder path inside bucket (e.g., 'products')
 * @param {string} [customMimeType] - optional mimeType when passing raw Buffer
 * @returns {Promise<{ secure_url: string, key: string }>}
 */
export async function uploadToS3(image, folder = "products", customMimeType = "image/jpeg") {
	if (!bucketName) {
		throw new Error("AWS_S3_BUCKET_NAME is not configured in .env");
	}

	let buffer;
	let mimeType;
	let extension;

	if (Buffer.isBuffer(image)) {
		buffer = image;
		mimeType = customMimeType;
		extension = mimeType.split("/")[1] || "jpg";
	} else if (typeof image === "string") {
		const parsed = parseBase64Image(image);
		buffer = parsed.buffer;
		mimeType = parsed.mimeType;
		extension = parsed.extension;
	} else {
		throw new Error("Invalid image format. Expected base64 string or Buffer.");
	}

	const randomId = crypto.randomBytes(8).toString("hex");
	const key = `${folder}/${Date.now()}-${randomId}.${extension}`;

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		Body: buffer,
		ContentType: mimeType,
	});

	await s3Client.send(command);

	const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/+$/, "");
	const publicUrl = cloudfrontDomain
		? `https://${cloudfrontDomain}/${key}`
		: `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

	return {
		secure_url: publicUrl,
		key,
	};
}

/**
 * Check if a URL points to S3 / CloudFront
 */
export function isS3Url(url) {
	if (!url || typeof url !== "string") return false;
	const s3Pattern = new RegExp(`s3[.-]${region}\\.amazonaws\\.com|${bucketName}\\.s3|amazonaws\\.com`);
	const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
	if (cloudfrontDomain && url.includes(cloudfrontDomain)) return true;
	return s3Pattern.test(url);
}

/**
 * Extract S3 Object Key from a full URL
 */
export function extractS3Key(url) {
	if (!url || typeof url !== "string") return null;

	try {
		const parsedUrl = new URL(url);
		// Pathname starts with '/', slice it off
		let key = parsedUrl.pathname.replace(/^\/+/, "");

		// If URL is in path style (s3.region.amazonaws.com/bucket-name/key)
		if (bucketName && key.startsWith(`${bucketName}/`)) {
			key = key.replace(`${bucketName}/`, "");
		}

		return key || null;
	} catch {
		return null;
	}
}

/**
 * Delete an image from AWS S3 using its key or full URL
 * @param {string} imageKeyOrUrl
 */
export async function deleteFromS3(imageKeyOrUrl) {
	if (!imageKeyOrUrl || !bucketName) return;

	let key = imageKeyOrUrl;
	if (imageKeyOrUrl.startsWith("http://") || imageKeyOrUrl.startsWith("https://")) {
		key = extractS3Key(imageKeyOrUrl);
	}

	if (!key) return;

	try {
		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: key,
		});
		await s3Client.send(command);
		console.log(`Deleted S3 object: ${key}`);
	} catch (error) {
		console.error(`Error deleting S3 object ${key}:`, error.message);
	}
}

export default {
	s3Client,
	uploadToS3,
	deleteFromS3,
	isS3Url,
	extractS3Key,
};
