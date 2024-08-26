"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.refreshToken = exports.userResetPassword = exports.verifiedOtpForResetPassword = exports.generateOtpForResetPassword = exports.logout = exports.loginWithOtpVerify = exports.loginWithOtpGenerate = exports.checkSession = exports.loginWithPassword = exports.createUser = exports.verifyOtpForRegistration = exports.resendOtpRegistration = exports.generateOtpForRegistration = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const auth_services_1 = require("../services/auth.services");
const AuthValidation_1 = require("../utility/Validation/AuthValidation");
const generateOtpForRegistration = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.registrationValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const newUser = await (0, auth_services_1.generatedOtpRegistration)(data);
        if (!newUser)
            throw new HttpError_1.default("Could Not Generate OTP for new User", 204);
        const code = newUser.success ? 200 : 400;
        res.status(code).json(newUser);
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
exports.generateOtpForRegistration = generateOtpForRegistration;
const resendOtpRegistration = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.ResendOtpValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { id } = data;
        if (!id) {
            throw new HttpError_1.default("Please provide all required fields", 422);
        }
        const newUser = await (0, auth_services_1.resendOtp)(data);
        if (!newUser)
            throw new HttpError_1.default("Could Not Resend OTP for new User", 204);
        const code = newUser.success ? 200 : 400;
        res.status(code).json(newUser);
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
exports.resendOtpRegistration = resendOtpRegistration;
const verifyOtpForRegistration = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.verifyOtpForRegistrationValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { id, otp, consent } = data;
        if (!id || !otp) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        if (!consent) {
            throw new HttpError_1.default("Please provide your consent", 600);
        }
        const otp_data = await (0, auth_services_1.verifiedOtpRegistration)(data);
        if (!otp_data)
            throw new HttpError_1.default("Could Not Verify OTP for new User", 204);
        const code = otp_data.success ? 200 : 400;
        res.status(code).json(otp_data);
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
exports.verifyOtpForRegistration = verifyOtpForRegistration;
const createUser = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.createUserRegistration.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        //validations
        if (!data.id || !data.pincode || !data.bloodGroup || !data.deviceToken) {
            throw new HttpError_1.default("Missing required fields", 400);
        }
        const newUserData = await (0, auth_services_1.createNewUser)(data);
        if (!newUserData)
            throw new HttpError_1.default("Could Not create new User", 204);
        const code = newUserData.success ? 200 : 400;
        res.status(code).json(newUserData);
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
exports.createUser = createUser;
const loginWithPassword = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.loginWithPasswordValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { userId, password, language, deviceToken } = data;
        if (!userId || !password || !language || !deviceToken)
            throw new HttpError_1.default("Missing Required Fields", 422);
        const loginData = await (0, auth_services_1.passwordLogin)(data);
        if (!loginData)
            throw new HttpError_1.default("Could Not Log in user", 204);
        const code = loginData.success ? 200 : 400;
        res.status(code).json(loginData);
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
exports.loginWithPassword = loginWithPassword;
const checkSession = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.sessionInputValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { userId } = data;
        if (!userId) {
            throw new HttpError_1.default("missing required field", 422);
        }
        const sessionData = await (0, auth_services_1.checkUserSession)(data);
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
const loginWithOtpGenerate = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.otpLoginGenerateValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { userId } = data;
        if (!userId) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        const loginData = await (0, auth_services_1.otpLoginGenerate)(data);
        if (!loginData)
            throw new HttpError_1.default("Could Not Generate OTP for logging in user", 204);
        const code = loginData.success ? 200 : 400;
        res.status(code).json(loginData);
    }
    catch (err) {
        // console.log(err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.loginWithOtpGenerate = loginWithOtpGenerate;
const loginWithOtpVerify = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.otpLoginVerificationValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { userId, verifiedContact, otp, language, deviceToken } = data;
        if (!userId || !verifiedContact || !otp || !language || !deviceToken) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        const loginData = await (0, auth_services_1.otpLoginVerify)(data);
        if (!loginData)
            throw new HttpError_1.default("Could Not Log in User", 204);
        const code = loginData.success ? 200 : 400;
        res.status(code).json(loginData);
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
exports.loginWithOtpVerify = loginWithOtpVerify;
const logout = async (req, res) => {
    try {
        // res.clearCookie("sessionToken");
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const logoutData = await (0, auth_services_1.userLogout)(user);
        if (!logoutData || !logoutData.success)
            throw new HttpError_1.default("Could Not Log Out User", 204);
        const code = logoutData.success ? 200 : 400;
        res.clearCookie("sessionToken");
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
exports.logout = logout;
const generateOtpForResetPassword = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.generateOtpForResetPasswordValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.userId) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        const generatedOtpData = await (0, auth_services_1.forgotPasswordGenerateOtp)(data.userId);
        if (!generatedOtpData)
            throw new HttpError_1.default("Could Not Generate OTP for Password Reset", 204);
        const code = generatedOtpData.success ? 200 : 400;
        res.status(code).json(generatedOtpData);
    }
    catch (err) {
        // console.log("error", err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.generateOtpForResetPassword = generateOtpForResetPassword;
const verifiedOtpForResetPassword = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.verifyOtpForResetPasswordValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { verifiedContact, otp } = data;
        if (!verifiedContact || !otp) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const otp_data = await (0, auth_services_1.forgotPasswordVerifyOtp)(data);
        if (!otp_data)
            throw new HttpError_1.default("Could Not Verify OTP for Password Reset", 204);
        const code = otp_data.success ? 200 : 400;
        res.status(code).json(otp_data);
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
exports.verifiedOtpForResetPassword = verifiedOtpForResetPassword;
const userResetPassword = async (req, res) => {
    try {
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.ResetPasswordValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { userId, newpassword } = data;
        if (!userId || !newpassword) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        const updated_user = await (0, auth_services_1.resetPassword)(data);
        if (!updated_user)
            throw new HttpError_1.default("Could Not Reset User Password", 204);
        const code = updated_user.success ? 200 : 400;
        res.status(code).json(updated_user);
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
exports.userResetPassword = userResetPassword;
const refreshToken = async (req, res) => {
    try {
        const data = req.headers.authorization;
        if (!data)
            throw new HttpError_1.default("Access Token Missing", 400);
        const refreshToken = await (0, auth_services_1.generateUserRefreshToken)(data);
        if (!refreshToken)
            throw new HttpError_1.default("could not generate refresh", 204);
        const code = refreshToken.success ? 200 : 400;
        res.status(code).json(refreshToken);
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
exports.refreshToken = refreshToken;
// Error handling middleware
const errorHandler = (err, req, res) => {
    console.error("Error caught in errorHandler:", err);
    if (err instanceof HttpError_1.default) {
        res.status(err.code).json({ error: { message: err.message } });
    }
    else {
        res.status(500).json({ error: { message: "Internal server error" } });
    }
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=authController.js.map