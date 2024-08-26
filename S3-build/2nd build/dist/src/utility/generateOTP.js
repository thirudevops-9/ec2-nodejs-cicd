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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOTP = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dotenv = __importStar(require("dotenv"));
const HttpError_1 = __importDefault(require("./HttpError"));
const data_1 = require("../constants/data");
dotenv.config();
const key = process.env.KEY;
const createOTP = async (userId, expiryTime) => {
    try {
        //generating 4 digit otp
        const otp = Math.floor(1000 + Math.random() * 9000);
        //expiry in milliseconds
        const keys = Object.keys(data_1.otpExipry);
        const expiry = keys.find((key) => key == expiryTime) ?? "5m";
        const otpExpiryTime = new Date(Date.now() + data_1.otpExipry[expiry]);
        const otp_data = `${userId}.${otp}.${otpExpiryTime}`; //email.otp.expiry_timestamp
        const hashotp = crypto_1.default
            .createHmac("sha256", key)
            .update(otp_data)
            .digest("hex");
        const hashedotp = `${hashotp}.${otpExpiryTime}`;
        const retData = {
            hashedotp,
            otp,
        };
        return retData;
    }
    catch (error) {
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            console.log(error);
            throw new HttpError_1.default("Internal Server Error", 500);
        }
    }
};
exports.createOTP = createOTP;
//# sourceMappingURL=generateOTP.js.map