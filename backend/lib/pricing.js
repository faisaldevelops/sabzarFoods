/**
 * Pricing Utility
 * Handles delivery charges and platform fee calculations based on YAML config
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pricingConfig = null;

/**
 * Load pricing configuration from YAML file
 */
function loadPricingConfig() {
  if (pricingConfig) {
    return pricingConfig;
  }

  try {
    const configPath = path.join(__dirname, '../config/pricing.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    pricingConfig = yaml.load(fileContents);
    return pricingConfig;
  } catch (error) {
    console.error('Error loading pricing config:', error);
    // Return default config if file not found
    return {
      delivery: {
        local: { price: 50 },
        national: { price: 150 },
        usePincodeLogic: true,
        localPincodePrefixes: ['180', '190', '191', '192', '193', '194'],
        localCities: []
      },
      platformFee: {
        constant: 5,
        razorpayPercentage: 2.0
      }
    };
  }
}

/**
 * Determine if address is local or national
 * @param {Object} address - Address object with pincode, city, and state
 * @returns {string} - 'local' or 'national'
 */
export function getDeliveryType(address) {
  const config = loadPricingConfig();
  const { pincode, city, state } = address || {};
  
  // Use pincode-based logic if configured
  if (config.delivery?.usePincodeLogic && pincode) {
    const pincodeStr = String(pincode).trim();
    
    // Check if pincode starts with any of the configured local prefixes
    const localPincodePrefixes = config.delivery?.localPincodePrefixes || [];
    const isLocal = localPincodePrefixes.some(prefix => 
      pincodeStr.startsWith(prefix)
    );
    
    if (isLocal) {
      return 'local';
    }
  }
  
  // Fallback to city-based logic if pincode logic is not used or pincode not available
  if (!config.delivery?.usePincodeLogic && city) {
    const localCities = config.delivery?.localCities || [];
    const normalizedCity = city.trim().toLowerCase();
    
    // Check if city matches any local city (case-insensitive)
    const isLocal = localCities.some(localCity => 
      localCity.trim().toLowerCase() === normalizedCity
    );

    if (isLocal) {
      return 'local';
    }
  }

  // Alternative: Check by state if localState is configured
  if (config.delivery?.localState && state) {
    const normalizedState = state.trim().toLowerCase();
    const localState = config.delivery.localState.trim().toLowerCase();
    if (normalizedState === localState) {
      return 'local';
    }
  }

  // Default to national
  return 'national';
}

/**
 * Calculate delivery charges based on address
 * @param {Object} address - Address object
 * @returns {number} - Delivery charge in rupees
 */
export function calculateDeliveryCharge(address) {
  const config = loadPricingConfig();
  const deliveryType = getDeliveryType(address);
  
  if (deliveryType === 'local') {
    return config.delivery?.local?.price || 50;
  } else {
    return config.delivery?.national?.price || 150;
  }
}

/**
 * Calculate platform fee
 * @param {number} subtotal - Subtotal amount in rupees
 * @returns {Object} - { constant: number, razorpayFee: number, total: number }
 */
export function calculatePlatformFee(subtotal) {
  const config = loadPricingConfig();
  const constant = config.platformFee?.constant || 5;
  const razorpayPercentage = config.platformFee?.razorpayPercentage || 2.0;
  
  // Razorpay fee is calculated on the subtotal (before adding platform fee)
  const razorpayFee = (subtotal * razorpayPercentage) / 100;
  const total = constant + razorpayFee;
  
  return {
    constant,
    razorpayFee,
    razorpayPercentage,
    total: Math.round(total * 100) / 100 // Round to 2 decimal places
  };
}

/**
 * Calculate complete pricing breakdown
 * @param {number} subtotal - Subtotal amount in rupees
 * @param {Object} address - Address object
 * @returns {Object} - Complete pricing breakdown
 */
export function calculatePricingBreakdown(subtotal, address) {
  const deliveryCharge = calculateDeliveryCharge(address);
  const platformFee = calculatePlatformFee(subtotal);
  const total = subtotal + deliveryCharge + platformFee.total;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryCharge: Math.round(deliveryCharge * 100) / 100,
    deliveryType: getDeliveryType(address),
    platformFee: {
      constant: platformFee.constant,
      razorpayFee: Math.round(platformFee.razorpayFee * 100) / 100,
      razorpayPercentage: platformFee.razorpayPercentage,
      total: platformFee.total
    },
    total: Math.round(total * 100) / 100
  };
}

/**
 * Reload pricing config (useful for hot-reloading in development)
 */
export function reloadPricingConfig() {
  pricingConfig = null;
  return loadPricingConfig();
}

