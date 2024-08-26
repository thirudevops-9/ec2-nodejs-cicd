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
exports.verifyUserToken = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
const BlockUserRemainingTime_1 = require("../utility/BlockUserRemainingTime");
dotenv.config();
const verifyUserToken = async (req, res, next) => {
    try {
        // 1. Extract and Validate Authorization Header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new HttpError_1.default("Invalid authorization header format.", 401);
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new HttpError_1.default("No token provided.", 401);
        }
        const decodedToken = jsonwebtoken_1.default.decode(token);
        if (!decodedToken)
            throw new HttpError_1.default("Invalid Token.", 401);
        // 3. Find User
        const user = await prisma_1.default.users.findUnique({
            where: { id: decodedToken["id"] },
        });
        if (!user) {
            throw new HttpError_1.default("User not found.", 404);
        }
        //check if user is blocked and return the time remaining
        if (user.isBlocked == true && user.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(user.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 403);
        }
        //check if active session
        if (user.currentSessionId !== decodedToken.currentSessionId &&
            user.currentSessionId === null) {
            throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
        }
        if (user.currentSessionId !== decodedToken.currentSessionId ||
            user.currentSessionId === null ||
            decodedToken.currentSessionId === null) {
            throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
        }
        //check if access token is expired or not
        if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
            req.expiredToken = {
                accessToken: token,
            };
            throw new HttpError_1.default("Access Token is expired. Generate a new one using /api/user/refresh-token", 401);
        }
        else {
            // Access token still valid
            req.user = {
                id: user?.id,
                fullName: user.fullName,
                emailId: user?.emailId,
                phoneNumber: user?.phoneNumber,
                isSync: user.isSync,
                subscription: user.subscription,
                accessToken: token,
            };
        }
        next();
    }
    catch (err) {
        console.error("Error caught in errorHandler:", err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.verifyUserToken = verifyUserToken;
//# sourceMappingURL=user.middleware.js.map