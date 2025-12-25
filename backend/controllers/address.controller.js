import User from "../models/user.model.js";
import { validateIndianAddress } from "../lib/addressValidation.js";

// Get all addresses for the authenticated user
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("addresses");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user.addresses || []);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Failed to fetch addresses", error: error.message });
  }
};

// Add a new address
export const addAddress = async (req, res) => {
  try {
    const { name, phoneNumber, email, pincode, houseNumber, streetAddress, landmark, city, state } = req.body;

    // Validate required fields
    if (!name || !phoneNumber || !pincode || !houseNumber || !streetAddress || !city || !state) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Validate that address is from India
    const addressData = { name, phoneNumber, pincode, houseNumber, streetAddress, city, state };
    const validation = validateIndianAddress(addressData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Invalid address. Only Indian addresses are allowed.",
        errors: validation.errors 
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user already has 5 addresses
    if (user.addresses && user.addresses.length >= 5) {
      return res.status(400).json({ message: "Maximum 5 addresses allowed. Please delete an address to add a new one." });
    }

    // Create new address object
    const newAddress = {
      name,
      phoneNumber,
      email: email || undefined,
      pincode,
      houseNumber,
      streetAddress,
      landmark: landmark || undefined,
      city,
      state,
      createdAt: new Date(),
    };

    // Add address to user's addresses array
    user.addresses.push(newAddress);
    await user.save();

    // Return the newly added address (last one in array)
    const addedAddress = user.addresses[user.addresses.length - 1];
    
    res.status(201).json(addedAddress);
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Failed to add address", error: error.message });
  }
};

// Delete an address
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter out the address with the given ID
    const initialLength = user.addresses.length;
    user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);

    if (user.addresses.length === initialLength) {
      return res.status(404).json({ message: "Address not found" });
    }

    await user.save();

    res.json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Failed to delete address", error: error.message });
  }
};

// Update an address
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, phoneNumber, email, pincode, houseNumber, streetAddress, landmark, city, state } = req.body;

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the address to update
    const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Prepare updated address data
    const updatedAddressData = {
      name: name || user.addresses[addressIndex].name,
      phoneNumber: phoneNumber || user.addresses[addressIndex].phoneNumber,
      pincode: pincode || user.addresses[addressIndex].pincode,
      city: city || user.addresses[addressIndex].city,
      state: state || user.addresses[addressIndex].state,
    };

    // Validate that updated address is from India
    const validation = validateIndianAddress(updatedAddressData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Invalid address. Only Indian addresses are allowed.",
        errors: validation.errors 
      });
    }

    // Update the address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      name: name || user.addresses[addressIndex].name,
      phoneNumber: phoneNumber || user.addresses[addressIndex].phoneNumber,
      email: email !== undefined ? email : user.addresses[addressIndex].email,
      pincode: pincode || user.addresses[addressIndex].pincode,
      houseNumber: houseNumber || user.addresses[addressIndex].houseNumber,
      streetAddress: streetAddress || user.addresses[addressIndex].streetAddress,
      landmark: landmark !== undefined ? landmark : user.addresses[addressIndex].landmark,
      city: city || user.addresses[addressIndex].city,
      state: state || user.addresses[addressIndex].state,
    };

    await user.save();

    res.json(user.addresses[addressIndex]);
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Failed to update address", error: error.message });
  }
};   