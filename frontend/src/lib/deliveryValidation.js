/**
 * Frontend Delivery Validation Utility
 * Checks whether products can be delivered to a given PIN code and/or location (state, city/district).
 */

// In-memory cache for resolved PIN code locations
const pincodeLocationCache = new Map();

/**
 * Common known Indian / J&K PIN code to District/State mappings
 * Provides instant 0ms resolution for local areas
 */
export const getPincodeLocation = (pincode) => {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) return null;

  if (pincodeLocationCache.has(pin)) {
    return pincodeLocationCache.get(pin);
  }

  const num = parseInt(pin, 10);

  // Srinagar: 190001 - 190029, 191121, 191122, 191123
  if (
    (num >= 190001 && num <= 190029) ||
    pin === "191121" || pin === "191122" || pin === "191123"
  ) {
    const loc = { district: "Srinagar", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Kupwara: 193221 - 193237, 193401, 193303, and all 1932xx
  if (pin.startsWith("1932") || pin === "193401" || pin === "193303") {
    const loc = { district: "Kupwara", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Baramulla: 193101 - 193198, 193301, 193302, 193402, and all 1931xx
  if (pin.startsWith("1931") || pin.startsWith("1933") || pin.startsWith("1934")) {
    const loc = { district: "Baramulla", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Bandipora: 193501 - 193504, and all 1935xx
  if (pin.startsWith("1935")) {
    const loc = { district: "Bandipora", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Ganderbal: 191201 - 191204
  if (pin === "191201" || pin === "191202" || pin === "191203" || pin === "191204") {
    const loc = { district: "Ganderbal", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Budgam: 191111 - 191113, and other 1911xx
  if (pin.startsWith("1911") || pin.startsWith("1912")) {
    const loc = { district: "Budgam", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Pulwama: 192301, 192302, 192305, 192306
  if (pin === "192301" || pin === "192302" || pin === "192305" || pin === "192306") {
    const loc = { district: "Pulwama", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Shopian: 192303, 192304
  if (pin === "192303" || pin === "192304") {
    const loc = { district: "Shopian", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Anantnag & Kulgam: 1921xx, 1922xx
  if (pin.startsWith("1921") || pin.startsWith("1922")) {
    if (pin === "192231" || pin === "192232" || pin === "192233" || pin === "192211") {
      const loc = { district: "Kulgam", state: "Jammu & Kashmir" };
      pincodeLocationCache.set(pin, loc);
      return loc;
    }
    const loc = { district: "Anantnag", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Jammu: 180001 - 180020, 181121, etc.
  if (pin.startsWith("180") || pin.startsWith("181")) {
    const loc = { district: "Jammu", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Udhampur / Reasi / Ramban / Doda / Kishtwar (182xxx)
  if (pin.startsWith("182")) {
    const loc = { district: "Udhampur", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Kathua / Samba (184xxx)
  if (pin.startsWith("184")) {
    const loc = { district: "Kathua", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  // Rajouri / Poonch (185xxx)
  if (pin.startsWith("185")) {
    const loc = { district: "Rajouri", state: "Jammu & Kashmir" };
    pincodeLocationCache.set(pin, loc);
    return loc;
  }

  return null;
};

/**
 * Dynamically fetch PIN code location details from India Post API
 * @param {string} pincode
 * @returns {Promise<{ district: string, state: string, city: string } | null>}
 */
export const fetchPincodeLocation = async (pincode) => {
  const pin = String(pincode || "").trim();
  if (!/^\d{6}$/.test(pin)) return null;

  // 1. Check local instant mapping
  const local = getPincodeLocation(pin);
  if (local) return local;

  // 2. Fetch from India Post API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data = await response.json();
    if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      const loc = {
        district: po.District || "",
        state: po.State || "",
        city: po.District || po.Name || "",
      };
      pincodeLocationCache.set(pin, loc);
      return loc;
    }
  } catch {
    // Silently continue
  }

  return null;
};

/**
 * Check if a product has regional / area delivery restrictions
 * Returns true ONLY if product is NOT deliverable all over India
 * @param {Object} product
 * @returns {boolean}
 */
export const isProductRestricted = (product) => {
  if (!product) return false;
  return Boolean(
    product.isRestricted &&
    product.restrictionType &&
    product.restrictionType !== "none" &&
    ((Array.isArray(product.restrictedPincodes) && product.restrictedPincodes.length > 0) ||
     (Array.isArray(product.restrictedLocations) && product.restrictedLocations.length > 0))
  );
};

/**
 * Get a short human-readable summary of the restriction
 * @param {Object} product
 * @returns {string}
 */
export const getDeliveryRestrictionSummary = (product) => {
  if (!isProductRestricted(product)) {
    return "All India delivery available";
  }

  const { restrictionType, restrictedPincodes = [], restrictedLocations = [] } = product;

  if (restrictionType === "pincodes") {
    const count = restrictedPincodes.length;
    return `Deliverable to ${count} selected PIN code${count === 1 ? "" : "s"} only`;
  }

  if (restrictionType === "districts") {
    const stateCount = restrictedLocations.length;
    const states = restrictedLocations.map((l) => l.state).join(", ");
    if (stateCount === 1) {
      const distCount = restrictedLocations[0].districts?.length || 0;
      return `Deliverable to ${restrictedLocations[0].state} (${distCount} district${distCount === 1 ? "" : "s"}) only`;
    }
    return `Deliverable to ${stateCount} selected state${stateCount === 1 ? "" : "s"} (${states})`;
  }

  if (restrictionType === "both") {
    return "Deliverable to selected PIN codes and districts only";
  }

  return "Deliverable in selected regions only";
};

/**
 * Check deliverability of a single product against an address or pincode/location info
 * Synchronous function that checks PIN code, state, city/district, and resolves known PIN codes.
 * @param {Object} product - Product object
 * @param {Object} location - { pincode, state, city, district }
 * @returns {{ isDeliverable: boolean, reason?: string, locationInfo?: { district: string, state: string } }}
 */
export const checkProductDeliverability = (
  product,
  { pincode = "", state = "", city = "", district = "" } = {}
) => {
  if (!isProductRestricted(product)) {
    return { isDeliverable: true };
  }

  const cleanPin = String(pincode || "").trim();
  let cleanState = String(state || "").trim().toLowerCase();
  let cleanDistrict = String(district || city || "").trim().toLowerCase();

  // If state or district is not supplied or doesn't match, check if PIN code resolves to a known location
  const resolved = cleanPin ? getPincodeLocation(cleanPin) : null;
  const resolvedState = resolved?.state ? resolved.state.trim().toLowerCase() : "";
  const resolvedDistrict = resolved?.district ? resolved.district.trim().toLowerCase() : "";

  const effectiveState = cleanState || resolvedState;
  const effectiveDistrict = cleanDistrict || resolvedDistrict;

  const { restrictionType, restrictedPincodes = [], restrictedLocations = [] } = product;

  // 1. PIN code check
  const pinMatches = Boolean(
    cleanPin &&
    /^\d{6}$/.test(cleanPin) &&
    restrictedPincodes.some((p) => String(p).trim() === cleanPin)
  );

  // 2. District & State check
  const locationMatches = restrictedLocations.some((loc) => {
    if (!loc || !loc.state) return false;
    const locState = loc.state.trim().toLowerCase();

    // Check if state matches (user entered state or resolved state from PIN)
    const stateMatches = Boolean(
      (effectiveState && (locState === effectiveState || locState.includes(effectiveState) || effectiveState.includes(locState))) ||
      (resolvedState && (locState === resolvedState || locState.includes(resolvedState) || resolvedState.includes(locState)))
    );

    if (stateMatches) {
      // If no specific districts listed under this state, the whole state is deliverable
      if (!Array.isArray(loc.districts) || loc.districts.length === 0) {
        return true;
      }
      
      // Check district match (from user input OR resolved from PIN code)
      return loc.districts.some((d) => {
        const dLower = String(d).trim().toLowerCase();
        return Boolean(
          (cleanDistrict && (dLower === cleanDistrict || dLower.includes(cleanDistrict) || cleanDistrict.includes(dLower))) ||
          (resolvedDistrict && (dLower === resolvedDistrict || dLower.includes(resolvedDistrict) || resolvedDistrict.includes(dLower)))
        );
      });
    }
    return false;
  });

  if (restrictionType === "pincodes") {
    if (pinMatches) {
      return { isDeliverable: true, locationInfo: resolved || undefined };
    }
    return {
      isDeliverable: false,
      locationInfo: resolved || undefined,
      reason: cleanPin
        ? `PIN code ${cleanPin} is not eligible. This product is deliverable to selected PIN codes only.`
        : "This product is deliverable to selected PIN codes only.",
    };
  }

  if (restrictionType === "districts") {
    if (locationMatches) {
      return { isDeliverable: true, locationInfo: resolved || undefined };
    }
    const locStr = [cleanDistrict || resolved?.district, cleanState || resolved?.state].filter(Boolean).join(", ");
    return {
      isDeliverable: false,
      locationInfo: resolved || undefined,
      reason: locStr
        ? `Delivery is not available to ${locStr}. This product is deliverable to selected districts only.`
        : cleanPin
        ? `PIN code ${cleanPin} is not eligible for delivery. This product is deliverable to selected districts only.`
        : "This product is deliverable to selected districts only.",
    };
  }

  if (restrictionType === "both") {
    if (pinMatches || locationMatches) {
      return { isDeliverable: true, locationInfo: resolved || undefined };
    }
    return {
      isDeliverable: false,
      locationInfo: resolved || undefined,
      reason: cleanPin
        ? `PIN code ${cleanPin} is not eligible. This product is deliverable to selected regions or PIN codes only.`
        : "This product is deliverable to selected regions or PIN codes only.",
    };
  }

  return { isDeliverable: true, locationInfo: resolved || undefined };
};

/**
 * Asynchronous deliverability check that resolves ANY Indian PIN code via India Post API if not locally cached
 * @param {Object} product
 * @param {Object} location - { pincode, state, city, district }
 * @returns {Promise<{ isDeliverable: boolean, reason?: string, locationInfo?: { district: string, state: string } }>}
 */
export const checkProductDeliverabilityAsync = async (product, location = {}) => {
  if (!isProductRestricted(product)) {
    return { isDeliverable: true };
  }

  const pin = String(location.pincode || "").trim();

  // Try synchronous check first (using local table & cache)
  const syncResult = checkProductDeliverability(product, location);
  if (syncResult.isDeliverable) {
    const loc = syncResult.locationInfo || getPincodeLocation(pin);
    return { ...syncResult, locationInfo: loc || undefined };
  }

  // If not eligible synchronously, attempt fetching online from India Post API
  if (pin && /^\d{6}$/.test(pin)) {
    const fetched = await fetchPincodeLocation(pin);
    if (fetched) {
      const asyncResult = checkProductDeliverability(product, {
        pincode: pin,
        state: location.state || fetched.state,
        district: location.district || fetched.district,
        city: location.city || fetched.city || fetched.district,
      });
      return { ...asyncResult, locationInfo: fetched };
    }
  }

  return syncResult;
};

/**
 * Check deliverability for multiple products (e.g., cart items)
 * @param {Array} products - Array of product objects or cart items (with .product or flat)
 * @param {Object} location - { pincode, state, city, district }
 * @returns {{ isDeliverable: boolean, nonDeliverableItems: Array<{ product: Object, reason: string }> }}
 */
export const checkProductsDeliverability = (products = [], location = {}) => {
  if (!Array.isArray(products) || products.length === 0) {
    return { isDeliverable: true, nonDeliverableItems: [] };
  }

  const nonDeliverableItems = [];

  for (const item of products) {
    const prod = item.product || item;
    const res = checkProductDeliverability(prod, location);
    if (!res.isDeliverable) {
      nonDeliverableItems.push({
        product: prod,
        reason: res.reason || "Not deliverable to this address.",
      });
    }
  }

  return {
    isDeliverable: nonDeliverableItems.length === 0,
    nonDeliverableItems,
  };
};
