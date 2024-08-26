"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userFeedbackComplaint = exports.getFacilitiesUser = exports.getAdvertisementsUser = exports.getVideosUser = exports.splashUserData = exports.deleteUserById = exports.userOtpVerify = exports.userNewContact = exports.userPasswordVerify = exports.syncUserChanges = exports.protectedUserResetPassword = exports.protectedVerifiedOtpForResetPassword = exports.protectedGenerateOtpForResetPassword = exports.updateUserById = exports.getUserById = exports.updateUserSettings = exports.getUserSettings = exports.getAllUsers = exports.testRoute = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const user_services_1 = require("../services/user.services");
const userValidation_1 = require("../utility/Validation/userValidation");
const AuthValidation_1 = require("../utility/Validation/AuthValidation");
const contentManagement_services_1 = require("../services/contentManagement.services");
const auth_services_1 = require("../services/auth.services");
//test controller
const testRoute = async (req, res) => {
    try {
        res.status(200).json({ msg: "success!!" });
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
exports.testRoute = testRoute;
//User functions
//!Admin Function
const getAllUsers = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const allUser = await (0, user_services_1.getAllAppUsers)(queryParams);
        if (!allUser)
            throw new HttpError_1.default("Could Not Fetch User data", 204);
        const code = allUser.success ? 200 : 400;
        res.status(code).json(allUser);
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
exports.getAllUsers = getAllUsers;
const getUserSettings = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        if (!user.id)
            throw new HttpError_1.default("Required Data missing", 422);
        const getSettingsData = await (0, user_services_1.getUserSetting)(user.id);
        if (!getSettingsData)
            throw new HttpError_1.default(`Could Not update details for user ${req.params.id}`, 204);
        const code = getSettingsData.success ? 200 : 400;
        res.status(code).json({ data: getSettingsData });
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
exports.getUserSettings = getUserSettings;
const updateUserSettings = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing required Data", 422);
        const validationResponse = userValidation_1.updateUserSettingValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data || !user.id)
            throw new HttpError_1.default("Required Data missing", 422);
        const updatedData = await (0, user_services_1.updateUserSetting)(data, user.id);
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
exports.updateUserSettings = updateUserSettings;
const getUserById = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const admin = req.admin;
        const type = req.query.type;
        if (!user && !admin)
            throw new HttpError_1.default("Unauthorised", 401);
        if (user && user.id !== req.params.id)
            throw new HttpError_1.default("Id not matching authorised user", 401);
        const userId = req.params.id;
        if (!type || !userId)
            throw new HttpError_1.default("Required Data missing", 422);
        const userData = await (0, user_services_1.getUserDataById)(userId, type);
        if (!userData)
            throw new HttpError_1.default(`Could Not Fetch Data for user ${req.params.id}`, 204);
        const code = userData.success ? 200 : 400;
        res.status(code).json(userData);
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
exports.getUserById = getUserById;
const updateUserById = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing required Data", 422);
        const queryParams = req.query;
        const validationResponse = userValidation_1.updateUserValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (req.body.password || req.body.password == "")
            throw new HttpError_1.default("Validation Error: Password is not subject to change using this API", 400);
        const updatedData = await (0, user_services_1.editUserById)(data, user.id, queryParams);
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
exports.updateUserById = updateUserById;
//reset password flow
//1. Generate OTP
const protectedGenerateOtpForResetPassword = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        if (!user.id) {
            throw new HttpError_1.default("please provide all required fields", 401);
        }
        const generatedOtpData = await (0, auth_services_1.forgotPasswordGenerateOtp)(user.id);
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
exports.protectedGenerateOtpForResetPassword = protectedGenerateOtpForResetPassword;
//2. Verify OTP
const protectedVerifiedOtpForResetPassword = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const input = {
            ...data,
            userId: user.id,
        };
        const validationResponse = AuthValidation_1.verifyOtpForResetPasswordValidation.safeParse(input);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { verifiedContact, otp } = data;
        if (!verifiedContact || !otp || !user.id) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const otp_data = await (0, auth_services_1.forgotPasswordVerifyOtp)(input);
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
exports.protectedVerifiedOtpForResetPassword = protectedVerifiedOtpForResetPassword;
//3. Reset Password
const protectedUserResetPassword = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const input = {
            userId: user.id,
            newpassword: data.newpassword,
        };
        const validationResponse = AuthValidation_1.ResetPasswordValidation.safeParse(input);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!user.id || !data.newpassword) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        const updated_user = await (0, auth_services_1.resetPassword)(input);
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
exports.protectedUserResetPassword = protectedUserResetPassword;
//sync changes
const syncUserChanges = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const queryParams = req.query;
        const syncedData = await (0, user_services_1.getUserSyncedData)(user, queryParams);
        if (!syncedData)
            throw new HttpError_1.default(`Could Not get updated data for user`, 204);
        const code = syncedData.success ? 200 : 400;
        res.status(code).json({ data: syncedData });
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
exports.syncUserChanges = syncUserChanges;
//password verify -> new details -> OTP verify
//1. Verify User Password
const userPasswordVerify = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing required Data", 422);
        const input = {
            ...data,
            userId: user.id,
        };
        const validationResponse = AuthValidation_1.detachloginWithPasswordValidation.safeParse(input);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!user.id || !data.password)
            throw new HttpError_1.default("Missing required fields", 422);
        const verifyPasswordResponse = await (0, user_services_1.verifyUserPassword)(input);
        if (!verifyPasswordResponse)
            throw new HttpError_1.default(`Could Not verify passowrd of user ${user.id}`, 204);
        const code = verifyPasswordResponse.success ? 200 : 400;
        res.status(code).json({ data: verifyPasswordResponse });
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
exports.userPasswordVerify = userPasswordVerify;
//2. Take new details and generate otp
const userNewContact = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing required Data", 422);
        const input = {
            ...data,
            id: user.id,
        };
        const validationResponse = userValidation_1.NewContactDetailsValidations.safeParse(input);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if ((!user.id && !data.emailId) || (!user.id && !data.phoneNumber))
            throw new HttpError_1.default("Missing required fields", 422);
        const newContactDetails = await (0, user_services_1.newUserContactDetails)(input);
        if (!newContactDetails)
            throw new HttpError_1.default(`Could Not verify passowrd of user ${user.id}`, 204);
        const code = newContactDetails.success ? 200 : 400;
        res.status(code).json({ data: newContactDetails });
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
exports.userNewContact = userNewContact;
//3. Verify OTP and change details
const userOtpVerify = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing required Data", 422);
        const input = {
            ...data,
            userId: user.id,
        };
        const validationResponse = AuthValidation_1.verifyOtpForDetailsChangeValidation.safeParse(input);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!user.id ||
            !data.verifiedContact ||
            !data.otp ||
            !data.verifiedContactId) {
            throw new HttpError_1.default("please provide all required fields", 422);
        }
        const otpverifyResponse = await (0, user_services_1.changeContactOtpVerify)(input);
        if (!otpverifyResponse)
            throw new HttpError_1.default("Could Not Log in User", 204);
        const code = otpverifyResponse.success ? 200 : 400;
        res.status(code).json(otpverifyResponse);
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
exports.userOtpVerify = userOtpVerify;
const deleteUserById = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = userValidation_1.deleteUserValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.reason)
            throw new HttpError_1.default("Required fields missing", 422);
        const deleteData = {
            reason: data.reason,
            role: "SELF",
            email: "",
        };
        const userData = await (0, user_services_1.removeUserById)(user.id, deleteData);
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
exports.deleteUserById = deleteUserById;
const splashUserData = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const userData = await (0, user_services_1.getHomePageData)(user, queryParams);
        if (!userData)
            throw new HttpError_1.default(`Could Not Redirect User`, 204);
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
exports.splashUserData = splashUserData;
//CONTENT MANAGEMENT
//videos
const getVideosUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const getVideos = await (0, contentManagement_services_1.getAllVideos)(user, queryParams);
        if (!getVideos) {
            throw new HttpError_1.default("could not get videos", 204);
        }
        const code = getVideos.success ? 200 : 400;
        res.status(code).json({ data: getVideos });
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
exports.getVideosUser = getVideosUser;
//advertisements
const getAdvertisementsUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const getAdvertisements = await (0, contentManagement_services_1.getAllAdvertisements)(user, {});
        if (!getAdvertisements) {
            throw new HttpError_1.default("could not get advertisements", 204);
        }
        const code = getAdvertisements.success ? 200 : 400;
        res.status(code).json({ data: getAdvertisements });
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
exports.getAdvertisementsUser = getAdvertisementsUser;
//facilities
const getFacilitiesUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const getFacilities = await (0, contentManagement_services_1.getAllFacilities)(user, queryParams);
        if (!getFacilities) {
            throw new HttpError_1.default("could not get facilities", 204);
        }
        const code = getFacilities.success ? 200 : 400;
        res.status(code).json({ data: getFacilities });
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
exports.getFacilitiesUser = getFacilitiesUser;
//Feedback and Complaints
const userFeedbackComplaint = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("missing api body", 422);
        if (data.type == "complaint") {
            const validationResponse = userValidation_1.userComplaintValidation.safeParse(data);
            if (!validationResponse.success) {
                const errorObj = validationResponse.error.issues
                    .map((issue) => `${issue.path[0]}: ${issue.message}`)
                    .join(" // ");
                throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
            }
        }
        else {
            const validationResponse = userValidation_1.userFeedbackValidation.safeParse(data);
            if (!validationResponse.success) {
                const errorObj = validationResponse.error.issues
                    .map((issue) => `${issue.path[0]}: ${issue.message}`)
                    .join(" // ");
                throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
            }
        }
        if (!data.message || !data.type || !user.id)
            throw new HttpError_1.default("Required Data missing", 422);
        const feedbackData = await (0, user_services_1.addUserMessage)(user.id, data);
        if (!feedbackData)
            throw new HttpError_1.default(`Could Not add ${data.type}`, 204);
        const code = feedbackData.success ? 200 : 400;
        res.status(code).json({ data: feedbackData });
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
exports.userFeedbackComplaint = userFeedbackComplaint;
// //auto-block user
// export const blockUser = async (req: Request, res: Response) => {
//   try {
//     const data =
//       req.body ??
//       (() => {
//         throw new HTTPError("API Missing body", 422);
//       });
//     const { userId, reason } = data;
//     if (!userId || !reason)
//       throw new HTTPError("userId and block reason is needed", 400);
//     const blockUserResponse = await blockUserWithReason(data);
//     if (!blockUserResponse) throw new HTTPError(`Could Not block User`, 204);
//     const code = blockUserResponse.success ? 200 : 400;
//     res.status(code).json({ data: blockUserResponse });
//   } catch (err) {
//     if (err instanceof HTTPError) {
//       res.status(err.code).json({ error: { message: err.message } });
//     } else {
//       res.status(500).json({ error: { message: "Internal server error" } });
//     }
//   }
// };
//# sourceMappingURL=userController.js.map