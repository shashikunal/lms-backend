"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.getMyAddresses = exports.addAddress = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const address_model_1 = __importDefault(require("../models/address.model"));
// Add Address
exports.addAddress = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
            return next(new ErrorHandler_1.default("Please provide all required address fields", 400));
        }
        // If set as default, reset other addresses
        if (isDefault) {
            yield address_model_1.default.updateMany({ userId }, { isDefault: false });
        }
        else {
            // If this is the user's first address, make it default automatically
            const existingCount = yield address_model_1.default.countDocuments({ userId });
            if (existingCount === 0) {
                req.body.isDefault = true;
            }
        }
        const address = yield address_model_1.default.create({
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get User's Addresses
exports.getMyAddresses = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const addresses = yield address_model_1.default.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
        res.status(200).json({
            success: true,
            count: addresses.length,
            addresses,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Update Address
exports.updateAddress = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const { id } = req.params;
        const address = yield address_model_1.default.findOne({ _id: id, userId });
        if (!address) {
            return next(new ErrorHandler_1.default("Address not found", 404));
        }
        if (req.body.isDefault) {
            yield address_model_1.default.updateMany({ userId }, { isDefault: false });
        }
        const updated = yield address_model_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        res.status(200).json({
            success: true,
            message: "Address updated successfully",
            address: updated,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Delete Address
exports.deleteAddress = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        const { id } = req.params;
        const address = yield address_model_1.default.findOneAndDelete({ _id: id, userId });
        if (!address) {
            return next(new ErrorHandler_1.default("Address not found", 404));
        }
        // If deleted address was default, set the next one as default
        if (address.isDefault) {
            const nextAddress = yield address_model_1.default.findOne({ userId });
            if (nextAddress) {
                nextAddress.isDefault = true;
                yield nextAddress.save();
            }
        }
        res.status(200).json({
            success: true,
            message: "Address deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Set Default Address
exports.setDefaultAddress = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        const { id } = req.params;
        yield address_model_1.default.updateMany({ userId }, { isDefault: false });
        const address = yield address_model_1.default.findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { new: true });
        if (!address) {
            return next(new ErrorHandler_1.default("Address not found", 404));
        }
        res.status(200).json({
            success: true,
            message: "Default address set successfully",
            address,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=address.controller.js.map