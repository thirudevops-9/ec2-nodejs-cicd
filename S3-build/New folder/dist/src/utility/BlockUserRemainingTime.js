"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remainingTime = void 0;
const remainingTime = async (blockedAt) => {
    const unblockTime = new Date(blockedAt.getTime() + 30 * 60 * 1000);
    const timeRemaining = unblockTime.getTime() - new Date().getTime();
    const error = {
        message: "This user has been blocked",
        timeRemaining: Math.ceil(timeRemaining / (1000 * 60)),
        timeUnit: "minutes",
        isUserBlocked: true,
    };
    return error;
};
exports.remainingTime = remainingTime;
//# sourceMappingURL=BlockUserRemainingTime.js.map