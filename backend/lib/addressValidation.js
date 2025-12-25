/**
 * Address Validation Utility
 * Validates that addresses are from India only
 */

// List of all Indian states and union territories
const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry"
];

/**
 * Validate if state is an Indian state
 * @param {string} state - State name
 * @returns {boolean} - True if valid Indian state
 */
export function isValidIndianState(state) {
  if (!state || typeof state !== 'string') {
    return false;
  }
  
  const normalizedState = state.trim();
  return INDIAN_STATES.some(
    indianState => indianState.toLowerCase() === normalizedState.toLowerCase()
  );
}

/**
 * Validate if pincode is a valid Indian pincode format
 * Indian pincodes are 6 digits
 * @param {string} pincode - Pincode
 * @returns {boolean} - True if valid format
 */
export function isValidIndianPincode(pincode) {
  if (!pincode || typeof pincode !== 'string') {
    return false;
  }
  
  // Indian pincodes are exactly 6 digits
  return /^\d{6}$/.test(pincode.trim());
}

/**
 * Validate if phone number is a valid Indian phone number format
 * Indian phone numbers are 10 digits
 * @param {string} phoneNumber - Phone number
 * @returns {boolean} - True if valid format
 */
export function isValidIndianPhoneNumber(phoneNumber) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }
  
  // Indian phone numbers are exactly 10 digits
  return /^\d{10}$/.test(phoneNumber.trim());
}

/**
 * Validate if address is from India
 * @param {Object} address - Address object with state, pincode, phoneNumber
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateIndianAddress(address) {
  const errors = [];
  
  if (!address) {
    return { isValid: false, errors: ['Address is required'] };
  }
  
  // Validate state
  if (!isValidIndianState(address.state)) {
    errors.push('State must be a valid Indian state or union territory');
  }
  
  // Validate pincode
  if (!isValidIndianPincode(address.pincode)) {
    errors.push('Pincode must be a valid 6-digit Indian pincode');
  }
  
  // Validate phone number (if provided)
  if (address.phoneNumber && !isValidIndianPhoneNumber(address.phoneNumber)) {
    errors.push('Phone number must be a valid 10-digit Indian phone number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get list of valid Indian states
 * @returns {string[]} - Array of Indian state names
 */
export function getIndianStates() {
  return [...INDIAN_STATES];
}

