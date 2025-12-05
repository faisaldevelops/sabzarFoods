/**
 * Extract public_id from a Cloudinary URL
 * Handles various Cloudinary URL formats
 * @param {string} cloudinaryUrl - The Cloudinary image URL
 * @param {string} folder - The folder name (e.g., 'products')
 * @returns {string|null} - The full public_id including folder, or null if extraction fails
 */
export const extractCloudinaryPublicId = (cloudinaryUrl, folder = 'products') => {
	if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
		return null;
	}

	try {
		// Try regex pattern first (for URLs with folder structure)
		const folderPattern = new RegExp(`\/${folder}\/([^/.]+)`);
		const match = cloudinaryUrl.match(folderPattern);
		
		if (match && match[1]) {
			return `${folder}/${match[1]}`;
		}

		// Fallback: extract from filename (for simple URLs)
		const urlParts = cloudinaryUrl.split('/');
		const fileNameWithExt = urlParts[urlParts.length - 1];
		const fileName = fileNameWithExt.split('.')[0];
		
		if (fileName) {
			return `${folder}/${fileName}`;
		}

		return null;
	} catch (error) {
		console.error('Error extracting Cloudinary public_id:', error);
		return null;
	}
};
