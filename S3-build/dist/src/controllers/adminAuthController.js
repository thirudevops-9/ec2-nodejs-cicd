"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboard = exports.adminLogout = exports.deleteAdminAuditor = exports.getAdminAuditor = exports.updateAdmin = exports.deleteSuperAdmins = exports.updateSuperAdmins = exports.getSuperAdmins = exports.refreshAdminToken = exports.verifyOtpLogin = exports.createOtpLogin = exports.registerAdminAuditor = exports.registerSuperAdmin = exports.resendOtpAdminAuditor = exports.sendOtpAdminAuditor = exports.sendOtp = exports.checkSession = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const admin_auth_service_1 = require("../services/admin.auth.service");
const adminValidation_1 = require("../utility/Validation/adminValidation");
const AuthValidation_1 = require("../utility/Validation/AuthValidation");
//check session
const checkSession = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.adminSessionValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { emailId } = data;
        if (!emailId) {
            throw new HttpError_1.default("missing required field", 400);
        }
        const sessionData = await (0, admin_auth_service_1.checkUserSession)(data);
        if (!sessionData)
            throw new HttpError_1.default("Could Not Log in user", 204);
        const code = sessionData.success ? 200 : 400;
        res.status(code).json(sessionData);
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
exports.checkSession = checkSession;
const sendOtp = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = adminValidation_1.createSuperAdminValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.fullName || !data.emailId || !data.position) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId, fullName, position } = data;
        if (!emailId || !fullName || !position) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const createdAdmin = await (0, admin_auth_service_1.createOtpforSuperAdminRegistration)(data);
        if (!createdAdmin) {
            throw new HttpError_1.default("could not send otp ", 204);
        }
        const code = createdAdmin.success ? 200 : 400;
        res.status(code).json({ data: createdAdmin });
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
exports.sendOtp = sendOtp;
//admin and auditor send otp
const sendOtpAdminAuditor = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only super admins can create auditors and admin", 401);
        }
        const validationResponse = adminValidation_1.createAdminAndAuditor.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.fullName || !data.emailId || !data.position || !data.role) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId, fullName, position, role } = data;
        if (!emailId || !fullName || !position || !role) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const createdAdmin = await (0, admin_auth_service_1.createOtpforAdminAuditor)(data);
        if (!createdAdmin) {
            throw new HttpError_1.default("could not send otp ", 204);
        }
        const code = createdAdmin.success ? 200 : 400;
        res.status(code).json({ data: createdAdmin });
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
exports.sendOtpAdminAuditor = sendOtpAdminAuditor;
//admin and auditor re-send otp
const resendOtpAdminAuditor = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only super admins can create auditors and admin", 401);
        }
        const validationResponse = adminValidation_1.emailStringValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.emailId) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId } = data;
        const createdAdmin = await (0, admin_auth_service_1.resendOtpforAdminAuditor)(emailId);
        if (!createdAdmin) {
            throw new HttpError_1.default("could not send otp ", 204);
        }
        const code = createdAdmin.success ? 200 : 400;
        res.status(code).json({ data: createdAdmin });
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
exports.resendOtpAdminAuditor = resendOtpAdminAuditor;
//verify otp and create superadmin
const registerSuperAdmin = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = adminValidation_1.verifyOtp.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.emailId || !data.otp) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId, otp } = data;
        if (!emailId || !otp) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const createdAdmin = await (0, admin_auth_service_1.verifyOtpSuperAdmin)(data);
        if (!createdAdmin) {
            throw new HttpError_1.default("could not send otp ", 204);
        }
        const code = createdAdmin.success ? 200 : 400;
        res.status(code).json({ data: createdAdmin });
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
exports.registerSuperAdmin = registerSuperAdmin;
//verifyotp and create admin auditor
const registerAdminAuditor = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only super admins can create auditors and admin", 401);
        }
        const validationResponse = adminValidation_1.verifyOtp.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.emailId || !data.otp) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId, otp } = data;
        if (!emailId || !otp) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const createdAdmin = await (0, admin_auth_service_1.verifyOtpAdminAuditor)(data);
        if (!createdAdmin) {
            throw new HttpError_1.default("could not send otp ", 204);
        }
        const code = createdAdmin.success ? 200 : 400;
        res.status(code).json({ data: createdAdmin });
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
exports.registerAdminAuditor = registerAdminAuditor;
//create otp login
const createOtpLogin = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = adminValidation_1.emailStringValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.emailId) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId } = data;
        if (!emailId) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const loggedinDashboardUser = await (0, admin_auth_service_1.createOtpforLogin)(data);
        if (!loggedinDashboardUser) {
            throw new HttpError_1.default("could not create admin", 204);
        }
        const code = loggedinDashboardUser.success ? 200 : 400;
        res.status(code).json({ data: loggedinDashboardUser });
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
exports.createOtpLogin = createOtpLogin;
//verify otp login
const verifyOtpLogin = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = adminValidation_1.verifyOtp.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.emailId || !data.otp) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const { emailId, otp } = data;
        if (!emailId || !otp) {
            throw new HttpError_1.default("missing required fields", 400);
        }
        const createdAdmin = await (0, admin_auth_service_1.loginDashboardUser)(data);
        if (!createdAdmin) {
            throw new HttpError_1.default("could not send otp ", 204);
        }
        const code = createdAdmin.success ? 200 : 400;
        res.status(code).json({ data: createdAdmin });
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
exports.verifyOtpLogin = verifyOtpLogin;
const refreshAdminToken = async (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token || !token?.startsWith("Bearer")) {
            throw new HttpError_1.default("Unauthorized user or invalid format", 401);
        }
        const refreshedToken = await (0, admin_auth_service_1.generateNewAccessToken)(token);
        if (!refreshedToken) {
            throw new HttpError_1.default("error while refreshing the token", 204);
        }
        const code = refreshedToken.success ? 200 : 500;
        res.status(code).json({ data: refreshedToken });
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
exports.refreshAdminToken = refreshAdminToken;
const getSuperAdmins = async (req, res) => {
    try {
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only superadmin can access the data ", 401);
        }
        const params = req.query;
        const superAdmins = await (0, admin_auth_service_1.getSuperAdmin)(admin, params);
        if (!superAdmins) {
            throw new HttpError_1.default("could not create admin", 204);
        }
        const code = superAdmins.success ? 200 : 400;
        res.status(code).json({ data: superAdmins });
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
exports.getSuperAdmins = getSuperAdmins;
const updateSuperAdmins = async (req, res) => {
    try {
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only superadmin can access the data ", 401);
        }
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = adminValidation_1.updateSuperAdminValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const updatedsuperAdmins = await (0, admin_auth_service_1.updateSuperAdmin)(data, admin);
        if (!updatedsuperAdmins) {
            throw new HttpError_1.default("could not update admin", 204);
        }
        const code = updatedsuperAdmins.success ? 200 : 400;
        res.status(code).json({ data: updatedsuperAdmins });
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
exports.updateSuperAdmins = updateSuperAdmins;
const deleteSuperAdmins = async (req, res) => {
    try {
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only superadmin can access the data ", 401);
        }
        const deletedsuperAdmins = await (0, admin_auth_service_1.deleteSuperAdmin)(admin);
        if (!deletedsuperAdmins) {
            throw new HttpError_1.default("could not delete admin", 204);
        }
        const code = deletedsuperAdmins.success ? 200 : 400;
        res.status(code).json({ data: deletedsuperAdmins });
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
exports.deleteSuperAdmins = deleteSuperAdmins;
// export const registerAdminAuditor = async (req: Request, res: Response) => {
//   try {
//     const admin = req.admin;
//     console.log(admin?.role);
//     if (admin?.role !== "SUPERADMIN") {
//       throw new HTTPError(
//         "Only super admins can create auditors and admin",
//         401
//       );
//     }
//     const data = req.body ?? (() => { throw new HTTPError("API Missing body", 422); });
//     const validationResponse = createSuperAdminValidation.safeParse(data);
//     if (!validationResponse.success) {
//       const errorObj = validationResponse.error.issues
//         .map((issue) => `${issue.path[0]}: ${issue.message}`)
//         .join(" // ");
//       throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
//     }
//     if (!data.fullName || !data.emailId || !data.password) {
//       throw new HTTPError("missing required fields", 400);
//     }
//     const createdAdmin = await createAdminAuditor(data);
//     if (!createdAdmin) {
//       throw new HTTPError("could not create admin", 204);
//     }
//     const code = createdAdmin.success ? 200 : 400;
//     res.status(code).json({ data: createdAdmin });
//   } catch (err) {
//     if (err instanceof HTTPError) {
//       res.status(err.code).json({ error: { message: err.message } });
//     } else {
//       res.status(500).json({ error: { message: "Internal server error" } });
//     }
//   }
// };
const updateAdmin = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        if (admin?.role == "AUDITOR") {
            throw new HttpError_1.default("Not authorised to make this change ", 401);
        }
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const params = req.query;
        const validationResponse = adminValidation_1.updateSuperAdminValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const updatedsuperAdmins = await (0, admin_auth_service_1.updateAdminData)(admin, data, params);
        if (!updatedsuperAdmins) {
            throw new HttpError_1.default("could not update admin", 204);
        }
        const code = updatedsuperAdmins.success ? 200 : 400;
        res.status(code).json({ data: updatedsuperAdmins });
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
exports.updateAdmin = updateAdmin;
const getAdminAuditor = async (req, res) => {
    try {
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only superadmin can access the data ", 401);
        }
        const params = req.query ??
            (() => {
                throw new HttpError_1.default("API Missing query parameter", 400);
            });
        const fetchedAdminAuditor = await (0, admin_auth_service_1.fetchAdminAuditor)(params);
        if (!fetchedAdminAuditor) {
            throw new HttpError_1.default("could not fetch admin", 204);
        }
        const code = fetchedAdminAuditor.success ? 200 : 400;
        res.status(code).json(fetchedAdminAuditor);
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
exports.getAdminAuditor = getAdminAuditor;
const deleteAdminAuditor = async (req, res) => {
    try {
        const admin = req.admin;
        if (admin?.role !== "SUPERADMIN") {
            throw new HttpError_1.default("Only superadmin can access the data ", 401);
        }
        const params = req.query;
        const deletedAdminAuditor = await (0, admin_auth_service_1.deleteAdminAuditors)(params);
        if (!deletedAdminAuditor) {
            throw new HttpError_1.default("could not update admin", 204);
        }
        const code = deletedAdminAuditor.success ? 200 : 400;
        res.status(code).json({ data: deletedAdminAuditor });
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
exports.deleteAdminAuditor = deleteAdminAuditor;
const adminLogout = async (req, res) => {
    try {
        // res.clearCookie("sessionToken");
        const admin = req.admin; // access user object attached in the middleware
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        const logoutData = await (0, admin_auth_service_1.logoutAdmin)(admin);
        if (!logoutData || !logoutData.success)
            throw new HttpError_1.default("Could Not Log Out User", 204);
        const code = logoutData.success ? 200 : 400;
        res.status(code).json(logoutData);
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
exports.adminLogout = adminLogout;
const adminDashboard = async (req, res) => {
    try {
        // res.clearCookie("sessionToken");
        const admin = req.admin; // access user object attached in the middleware
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        if (admin?.role !== "AUDITOR" &&
            admin?.role !== "SUPERADMIN" &&
            admin?.role !== "ADMIN") {
            throw new HttpError_1.default("You dont have access to view this data ", 401);
        }
        const fetchedData = await (0, admin_auth_service_1.getSuperAdminDashboardData)();
        if (!fetchedData || !fetchedData.success)
            throw new HttpError_1.default("Could Not Log Out User", 204);
        const code = fetchedData.success ? 200 : 400;
        res.status(code).json(fetchedData);
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
exports.adminDashboard = adminDashboard;
//# sourceMappingURL=adminAuthController.js.map