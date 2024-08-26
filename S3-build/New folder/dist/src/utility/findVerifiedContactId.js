"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findVerifedContactId = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const findVerifedContactId = async (userId) => {
    const data = await prisma_1.default.users.findFirst({
        where: {
            id: userId,
        },
        select: {
            verifiedContactId: true,
        },
    });
    return data;
};
exports.findVerifedContactId = findVerifedContactId;
//# sourceMappingURL=findVerifiedContactId.js.map