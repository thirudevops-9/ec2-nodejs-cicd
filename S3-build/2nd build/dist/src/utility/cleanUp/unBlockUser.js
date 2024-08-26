"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblockUsers = void 0;
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../prisma"));
// Function to unblock the user after 30 minutes
async function unblockUsers() {
    try {
        const users = await prisma_1.default.users.findMany({
            where: {
                isBlocked: true,
            },
            include: {
                blockReasons: {
                    where: {
                        blockReason: "auto-block",
                        blockedBy: "app",
                    },
                },
            },
        });
        const now = new Date();
        for (const user of users) {
            if (user.blockedAt && (0, date_fns_1.isAfter)(now, (0, date_fns_1.addMinutes)(user.blockedAt, 30))) {
                await prisma_1.default.users.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        isBlocked: false,
                        blockedAt: null, // Clear the blocked timestamp
                        wrongLoginAttempts: 0,
                    },
                });
            }
        }
    }
    catch (error) {
        console.error("Error deleting old non-registered users:", error);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
}
exports.unblockUsers = unblockUsers;
//# sourceMappingURL=unBlockUser.js.map