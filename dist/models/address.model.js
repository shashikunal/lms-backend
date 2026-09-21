"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const addressSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    fullName: {
        type: String,
        required: [true, "Recipient full name is required"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Phone number is required"],
        trim: true,
    },
    alternatePhone: {
        type: String,
        trim: true,
    },
    addressLine1: {
        type: String,
        required: [true, "Address line 1 is required"],
        trim: true,
    },
    addressLine2: {
        type: String,
        trim: true,
    },
    landmark: {
        type: String,
        trim: true,
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
    },
    state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
    },
    postalCode: {
        type: String,
        required: [true, "Postal/Pin code is required"],
        trim: true,
    },
    country: {
        type: String,
        required: [true, "Country is required"],
        default: "India",
        trim: true,
    },
    addressType: {
        type: String,
        enum: ["home", "work", "other", "Home", "Work", "Other"],
        default: "home",
        set: (v) => (v ? v.toLowerCase() : "home"),
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
addressSchema.index({ userId: 1 });
const AddressModel = mongoose_1.default.model("EcommerceAddress", addressSchema);
exports.default = AddressModel;
//# sourceMappingURL=address.model.js.map