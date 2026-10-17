/**
 * Delivery Restriction Validation Utility (Backend)
 */

/**
 * Common known Indian / J&K PIN code to District/State mappings
 */
export function getPincodeLocation(pincode) {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) return null;

  const num = parseInt(pin, 10);

  // Srinagar: 190001 - 190029, 191121, 191122, 191123
  if (
    (num >= 190001 && num <= 190029) ||
    pin === "191121" || pin === "191122" || pin === "191123"
  ) {
    return { district: "Srinagar", state: "Jammu & Kashmir" };
  }

  // Kupwara: 193221 - 193237, 193401, 193303, and all 1932xx
  if (pin.startsWith("1932") || pin === "193401" || pin === "193303") {
    return { district: "Kupwara", state: "Jammu & Kashmir" };
  }

  // Baramulla: 193101 - 193198, 193301, 193302, 193402, and all 1931xx
  if (pin.startsWith("1931") || pin.startsWith("1933") || pin.startsWith("1934")) {
    return { district: "Baramulla", state: "Jammu & Kashmir" };
  }

  // Bandipora: 193501 - 193504, and all 1935xx
  if (pin.startsWith("1935")) {
    return { district: "Bandipora", state: "Jammu & Kashmir" };
  }

  // Ganderbal: 191201 - 191204
  if (pin === "191201" || pin === "191202" || pin === "191203" || pin === "191204") {
    return { district: "Ganderbal", state: "Jammu & Kashmir" };
  }

  // Budgam: 191111 - 191113, and other 1911xx
  if (pin.startsWith("1911") || pin.startsWith("1912")) {
    return { district: "Budgam", state: "Jammu & Kashmir" };
  }

  // Pulwama: 192301, 192302, 192305, 192306
  if (pin === "192301" || pin === "192302" || pin === "192305" || pin === "192306") {
    return { district: "Pulwama", state: "Jammu & Kashmir" };
  }

  // Shopian: 192303, 192304
  if (pin === "192303" || pin === "192304") {
    return { district: "Shopian", state: "Jammu & Kashmir" };
  }

  // Anantnag & Kulgam: 1921xx, 1922xx
  if (pin.startsWith("1921") || pin.startsWith("1922")) {
    if (pin === "192231" || pin === "192232" || pin === "192233" || pin === "192211") {
      return { district: "Kulgam", state: "Jammu & Kashmir" };
    }
    return { district: "Anantnag", state: "Jammu & Kashmir" };
  }

  // Jammu: 180001 - 180020, 181121, etc.
  if (pin.startsWith("180") || pin.startsWith("181")) {
    return { district: "Jammu", state: "Jammu & Kashmir" };
  }

  // Udhampur / Reasi / Ramban / Doda / Kishtwar (182xxx)
  if (pin.startsWith("182")) {
    return { district: "Udhampur", state: "Jammu & Kashmir" };
  }

  // Kathua / Samba (184xxx)
  if (pin.startsWith("184")) {
    return { district: "Kathua", state: "Jammu & Kashmir" };
  }

  // Rajouri / Poonch (185xxx)
  if (pin.startsWith("185")) {
    return { district: "Rajouri", state: "Jammu & Kashmir" };
  }

  return null;
}

/**
 * Check if a product is restricted to specific regions
 * @param {Object} product
 * @returns {boolean}
 */
export function isProductRestricted(product) {
  if (!product) return false;
  return Boolean(
    product.isRestricted &&
    product.restrictionType &&
    product.restrictionType !== "none" &&
    ((product.restrictedPincodes && product.restrictedPincodes.length > 0) ||
     (product.restrictedLocations && product.restrictedLocations.length > 0))
  );
}

/**
 * Check if an address is deliverable for a product
 * @param {Object} product - Product document
 * @param {Object} address - Address object { pincode, state, city }
 * @returns {{ isDeliverable: boolean, message?: string }}
 */
export function validateProductDelivery(product, address) {
  if (!isProductRestricted(product)) {
    return { isDeliverable: true };
  }

  if (!address || !address.pincode) {
    return {
      isDeliverable: false,
      message: `Delivery address is required for ${product.name}.`
    };
  }

  const cleanPin = String(address.pincode).trim();
  let cleanState = String(address.state || "").trim().toLowerCase();
  let cleanCity = String(address.city || "").trim().toLowerCase();

  const resolved = cleanPin ? getPincodeLocation(cleanPin) : null;
  const resolvedState = resolved?.state ? resolved.state.trim().toLowerCase() : "";
  const resolvedDistrict = resolved?.district ? resolved.district.trim().toLowerCase() : "";

  const effectiveState = cleanState || resolvedState;

  const { restrictionType, restrictedPincodes = [], restrictedLocations = [] } = product;

  // 1. PIN code check
  const pinMatches = cleanPin && restrictedPincodes.some(p => String(p).trim() === cleanPin);

  // 2. District & State check
  const locationMatches = restrictedLocations.some(loc => {
    if (!loc || !loc.state) return false;
    const locState = loc.state.trim().toLowerCase();

    // Check state match
    const stateMatches = Boolean(
      (effectiveState && (locState === effectiveState || locState.includes(effectiveState) || effectiveState.includes(locState))) ||
      (resolvedState && (locState === resolvedState || locState.includes(resolvedState) || resolvedState.includes(locState)))
    );

    if (stateMatches) {
      // If no specific districts listed under this state, the whole state is deliverable
      if (!loc.districts || loc.districts.length === 0) {
        return true;
      }
      // If city / district is provided, check if it matches any allowed district (or resolved district from PIN)
      return loc.districts.some(d => {
        const dLower = String(d).trim().toLowerCase();
        return Boolean(
          (cleanCity && (dLower === cleanCity || dLower.includes(cleanCity) || cleanCity.includes(dLower))) ||
          (resolvedDistrict && (dLower === resolvedDistrict || dLower.includes(resolvedDistrict) || resolvedDistrict.includes(dLower)))
        );
      });
    }
    return false;
  });

  if (restrictionType === "pincodes") {
    if (pinMatches) return { isDeliverable: true };
    return {
      isDeliverable: false,
      message: `${product.name || 'This product'} is deliverable to selected PIN codes only. PIN code ${cleanPin} is not eligible.`
    };
  }

  if (restrictionType === "districts") {
    if (locationMatches) return { isDeliverable: true };
    const locName = [address.city || resolved?.district, address.state || resolved?.state].filter(Boolean).join(", ");
    return {
      isDeliverable: false,
      message: `${product.name || 'This product'} is deliverable to selected regions/districts only.${locName ? ` The address location (${locName}) is not eligible.` : ''}`
    };
  }

  if (restrictionType === "both") {
    if (pinMatches || locationMatches) return { isDeliverable: true };
    return {
      isDeliverable: false,
      message: `${product.name || 'This product'} is deliverable to selected regions or PIN codes only. PIN code ${cleanPin} is not eligible.`
    };
  }

  return { isDeliverable: true };
}
