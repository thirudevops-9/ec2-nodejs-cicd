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
exports.verifyAdminToken = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv = __importStar(require("dotenv"));
const prisma_1 = __importDefault(require("../prisma"));
const data_1 = require("../constants/data");
dotenv.config();
const verifyAdminToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            throw new HttpError_1.default("Missing token or invalid format of token ", 401);
        }
        const token = authHeader.split(" ")[1];
        const decodedToken = jsonwebtoken_1.default.decode(token);
        if (!decodedToken) {
            throw new HttpError_1.default("invalid decoded token or could not decode the token", 401);
        }
        const dashboardUser = await prisma_1.default.dashboardUser.findUnique({
            where: {
                emailId: decodedToken.emailId,
            },
        });
        if (!dashboardUser) {
            throw new HttpError_1.default(`Unauthorized`, 401);
        }
        if (!data_1.enums.includes(decodedToken.role)) {
            throw new HttpError_1.default("Unauthorized. This endpoint requires an administrator,auditor or superadmin sigin.", 401);
        }
        if (dashboardUser.currentSessionId !== decodedToken.currentSessionId &&
            dashboardUser.currentSessionId === null) {
            throw new HttpError_1.default("User logged out. Please log in again.", 403);
        }
        if (dashboardUser.currentSessionId !== decodedToken.currentSessionId ||
            dashboardUser.currentSessionId === null ||
            decodedToken.currentSessionId === null) {
            throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
        }
        if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
            throw new HttpError_1.default("Access Token is expired. Generate a new one using /api/admin/refreshToken", 401);
        }
        else {
            req.admin = {
                id: decodedToken.id,
                emailId: decodedToken.emailId,
                role: decodedToken.role,
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
exports.verifyAdminToken = verifyAdminToken;
//# sourceMappingURL=admin.middleware.js.map