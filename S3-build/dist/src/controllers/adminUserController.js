"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUnblockUser = exports.adminBlockUser = exports.adminDeleteUserById = exports.adminEditUserById = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const user_services_1 = require("../services/user.services");
const userValidation_1 = require("../utility/Validation/userValidation");
const admin_auth_service_1 = require("../services/admin.auth.service");
const adminEditUserById = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing required Data", 422);
        const validationResponse = userValidation_1.updateUserValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const userId = req.params.id;
        const updatedData = await (0, admin_auth_service_1.adminUpdateUserById)(data, userId);
        if (!updatedData)
            throw new HttpError_1.default(`Could Not update details for user ${req.params.id}`, 204);
        const code = updatedData.success ? 200 : 400;
        res.status(code).json({ data: updatedData });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.adminEditUserById = adminEditUserById;
const adminDeleteUserById = async (req, res) => {
    try {
        const admin = req.admin;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role !== "SUPERADMIN")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const validationResponse = userValidation_1.deleteUserValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const userId = req.params.id;
        const deleteData = {
            reason: data.reason,
            role: admin.role,
            email: admin.emailId,
        };
        const userData = await (0, user_services_1.removeUserById)(userId, deleteData);
        if (!userData)
            throw new HttpError_1.default(`Could Not delete user ${req.params.id}`, 204);
        const code = userData.success ? 200 : 400;
        res.status(code).json({ data: userData });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.adminDeleteUserById = adminDeleteUserById;
//block user
const adminBlockUser = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR" || admin.role == "ADMIN")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("userId and block reason is needed", 422);
        const validationResponse = userValidation_1.blockUserValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const blockUserResponse = await (0, user_services_1.blockUserWithReason)(data, admin);
        if (!blockUserResponse)
            throw new HttpError_1.default(`Could Not block User`, 204);
        const code = blockUserResponse.success ? 200 : 400;
        res.status(code).json({ data: blockUserResponse });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.adminBlockUser = adminBlockUser;
//unblock user
const adminUnblockUser = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR" || admin.role == "ADMIN")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const userId = req.params.id;
        if (!userId)
            throw new HttpError_1.default("userId is needed", 422);
        const blockUserResponse = await (0, user_services_1.unblockUser)(userId);
        if (!blockUserResponse)
            throw new HttpError_1.default(`Could Not un-block User`, 204);
        const code = blockUserResponse.success ? 200 : 400;
        res.status(code).json({ data: blockUserResponse });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.adminUnblockUser = adminUnblockUser;
//# sourceMappingURL=adminUserController.js.map