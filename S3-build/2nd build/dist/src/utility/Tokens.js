"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshTokenAdmin = exports.generateAccessTokenAdmin = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_1 = require("../constants/data");
const HttpError_1 = __importDefault(require("./HttpError"));
dotenv_1.default.config();
const generateAccessToken = (userData) => {
    try {
        const accessToken = jsonwebtoken_1.default.sign(userData, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: data_1.access_token_expiry,
            // expiresIn:"5m"
        });
        return accessToken;
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userData) => {
    try {
        const refreshToken = jsonwebtoken_1.default.sign(userData, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: data_1.refreshToken_expiry,
            // expiresIn:"10m"
        });
        return refreshToken;
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.generateRefreshToken = generateRefreshToken;
//admin token
const generateAccessTokenAdmin = (adminData) => {
    const accessToken = jsonwebtoken_1.default.sign(adminData, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: data_1.access_token_expiry,
        // expiresIn: "10m",
    });
    return accessToken;
};
exports.generateAccessTokenAdmin = generateAccessTokenAdmin;
const generateRefreshTokenAdmin = (adminData) => {
    const refreshToken = jsonwebtoken_1.default.sign(adminData, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: data_1.refreshToken_expiry,
        // expiresIn: "15m",
    });
    return refreshToken;
};
exports.generateRefreshTokenAdmin = generateRefreshTokenAdmin;
//# sourceMappingURL=Tokens.js.map