"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreOtpInDb = exports.verifyOTPFromDb = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("./HttpError"));
const emailService_1 = require("./emailService");
const generateOTP_1 = require("./generateOTP");
const verifyOTP_1 = require("./verifyOTP");
const verifyOTPFromDb = async (emailId, otp) => {
    const verifyUser = await prisma_1.default.dashboardUserOtpStore.findFirst({
        where: {
            emailId,
        },
    });
    if (!verifyUser) {
        throw new HttpError_1.default(`Please generate the otp `, 401); // user already exist throw error
    }
    const { hashedOTP } = verifyUser;
    const verifyOtp = await (0, verifyOTP_1.verifyOTP)(hashedOTP, otp, emailId);
    if (!verifyOtp) {
        throw new HttpError_1.default("Invalid otp", 401);
    }
    return {
        success: true,
        fullName: verifyUser.fullName,
        position: verifyUser.position,
        role: verifyUser.role,
    };
};
exports.verifyOTPFromDb = verifyOTPFromDb;
const StoreOtpInDb = async (emailId, position, role, fullName, template, subject) => {
    const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId, "15m");
    const response = await (0, emailService_1.OTPmailServiceDashboardUser)(emailId, otp, fullName, template, subject);
    if (!response)
        throw new HttpError_1.default("Invalid Email Address", 612);
    const storeOtp = await prisma_1.default.dashboardUserOtpStore.upsert({
        where: {
            emailId: emailId,
        },
        update: {
            hashedOTP: hashedotp,
        },
        create: {
            emailId,
            hashedOTP: hashedotp,
            position,
            role,
            fullName,
        },
    });
    if (!storeOtp) {
        throw new HttpError_1.default("cannot store otp", 500);
    }
    return {
        success: true,
    };
};
exports.StoreOtpInDb = StoreOtpInDb;
//# sourceMappingURL=OtpStorageInDb.js.map