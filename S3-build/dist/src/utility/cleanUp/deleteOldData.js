"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOldOtpStoreData = exports.deleteOldNonRegisteredUsers = void 0;
const prisma_1 = __importDefault(require("../../prisma"));
const deleteOldNonRegisteredUsers = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    try {
        const result = await prisma_1.default.verifiedUsers.deleteMany({
            where: {
                updatedAt: {
                    lt: thirtyDaysAgo,
                },
                isVerified: false,
            },
        });
    }
    catch (error) {
        console.error("Error deleting old non-registered users:", error);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
};
exports.deleteOldNonRegisteredUsers = deleteOldNonRegisteredUsers;
const deleteOldOtpStoreData = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    try {
        const result = await prisma_1.default.otpStore.deleteMany({
            where: {
                updatedAt: {
                    lt: thirtyDaysAgo,
                },
            },
        });
    }
    catch (error) {
        console.error("Error deleting old OTP Store Data:", error);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
};
exports.deleteOldOtpStoreData = deleteOldOtpStoreData;
//# sourceMappingURL=deleteOldData.js.map