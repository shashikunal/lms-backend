import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import AddressModel from "../models/address.model";

// Add Address
export const addAddress = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const fullName = req.body.fullName;
      const phone = req.body.phone || req.body.phoneNumber;
      const alternatePhone = req.body.alternatePhone;
      const addressLine1 = req.body.addressLine1 || req.body.street;
      const addressLine2 = req.body.addressLine2;
      const landmark = req.body.landmark;
      const city = req.body.city;
      const state = req.body.state;
      const postalCode = req.body.postalCode || req.body.zipCode;
      const country = req.body.country || "India";
      const addressType = (req.body.addressType || "home").toLowerCase();
      const isDefault = req.body.isDefault;

      if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
        return next(new ErrorHandler("Please provide all required address fields", 400));
      }

      // If set as default, reset other addresses
      if (isDefault) {
        await AddressModel.updateMany({ userId }, { isDefault: false });
      } else {
        // If this is the user's first address, make it default automatically
        const existingCount = await AddressModel.countDocuments({ userId });
        if (existingCount === 0) {
          req.body.isDefault = true;
        }
      }

      const address = await AddressModel.create({
        userId,
        fullName,
        phone,
        alternatePhone,
        addressLine1,
        addressLine2,
        landmark,
        city,
        state,
        postalCode,
        country: country || "India",
        addressType: addressType || "home",
        isDefault: req.body.isDefault || false,
      });

      res.status(201).json({
        success: true,
        message: "Address saved successfully",
        address,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get User's Addresses
export const getMyAddresses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const addresses = await AddressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        count: addresses.length,
        addresses,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update Address
export const updateAddress = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      const address = await AddressModel.findOne({ _id: id, userId });
      if (!address) {
        return next(new ErrorHandler("Address not found", 404));
      }

      if (req.body.isDefault) {
        await AddressModel.updateMany({ userId }, { isDefault: false });
      }

      const updated = await AddressModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        message: "Address updated successfully",
        address: updated,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete Address
export const deleteAddress = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      const address = await AddressModel.findOneAndDelete({ _id: id, userId });
      if (!address) {
        return next(new ErrorHandler("Address not found", 404));
      }

      // If deleted address was default, set the next one as default
      if (address.isDefault) {
        const nextAddress = await AddressModel.findOne({ userId });
        if (nextAddress) {
          nextAddress.isDefault = true;
          await nextAddress.save();
        }
      }

      res.status(200).json({
        success: true,
        message: "Address deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Set Default Address
export const setDefaultAddress = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { id } = req.params;

      await AddressModel.updateMany({ userId }, { isDefault: false });
      const address = await AddressModel.findOneAndUpdate(
        { _id: id, userId },
        { isDefault: true },
        { new: true }
      );

      if (!address) {
        return next(new ErrorHandler("Address not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Default address set successfully",
        address,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
