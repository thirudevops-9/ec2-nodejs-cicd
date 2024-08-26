"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateContact = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("./HttpError"));
const validateContact = async (uuid, verifiedContact, contact) => {
    try {
        const allUsers = await prisma_1.default.users.findMany();
        for (const user of allUsers) {
            if (user[verifiedContact] === contact && user.id !== uuid) {
                return {
                    success: false,
                    message: "This Contact detail already exists for a different user",
                };
            }
            if (user[verifiedContact] === contact && user.id == uuid) {
                return {
                    success: false,
                    message: "Contact cannot be the same as previous one",
                };
            }
        }
        return {
            success: true,
            message: "Contact is valid",
        };
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
exports.validateContact = validateContact;
//# sourceMappingURL=ValidateNewContact.js.map