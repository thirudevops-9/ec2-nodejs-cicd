"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseMinorVerifyOtp = exports.releaseMinorGenerateOtp = exports.detachFamilyMember = exports.changeFamilyAccess = exports.getAllFamily = exports.createDependant = exports.createExistingUser = exports.existingUserSendOtp = exports.fcAddNewUser = exports.checkSubscription = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const familyCare_services_1 = require("../services/familyCare.services");
const familyCareValidations_1 = require("../utility/Validation/familyCareValidations");
const AuthValidation_1 = require("../utility/Validation/AuthValidation");
const checkSubscription = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const checkResponse = await (0, familyCare_services_1.checkSubsriptionStatus)(user);
        if (!checkResponse)
            throw new HttpError_1.default(`Could Not Create New Dependant`, 204);
        const code = checkResponse.success ? 200 : 400;
        res.status(code).json({ data: checkResponse });
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
exports.checkSubscription = checkSubscription;
// export const generateOtpForDependant = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const user = req.user
//     if(!user){
//       throw new HTTPError("Unauthorised", 401)
//     }
//     const data =
//       req.body ??
//       (() => {
//         throw new HTTPError("API Missing body", 422);
//       });
//     if (!data) throw new HTTPError("API Missing body", 422);
//     const validationResponse = registrationValidation.safeParse(data);
//     if (!validationResponse.success) {
//       const errorObj = validationResponse.error.issues
//         .map((issue) => `${issue.path[0]}: ${issue.message}`)
//         .join(" // ");
//       throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
//     }
//     const newUser = await generatedOtpDependant(data,user);
//     if (!newUser)
//       throw new HTTPError("Could Not Generate OTP for minor", 204);
//     const code = newUser.success ? 200 : 400;
//     res.status(code).json(newUser);
//   } catch (err) {
//     if (err instanceof HTTPError) {
//       res.status(err.code).json({ error: { message: err.message } });
//     } else {
//       res.status(500).json({ error: { message: "Internal server error" } });
//     }
//   }
// };
const fcAddNewUser = async (req, res) => {
    try {
        const user = req.user;
        const linkFromUserid = user?.id;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = familyCareValidations_1.addNewUserFamilyCareValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.id || !data.pincode || !data.bloodGroup || !data.relation) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const finalData = {
            ...data,
            linkFromUserid,
        };
        const { id, relation } = data;
        if (!id || !relation || !linkFromUserid)
            throw new HttpError_1.default("Missing Required Fields", 422);
        const addedNewFamilyCareUser = await (0, familyCare_services_1.createNewUserFamilyCare)(finalData);
        if (!addedNewFamilyCareUser) {
            throw new HttpError_1.default("could not create new family care user", 204);
        }
        const code = addedNewFamilyCareUser.success ? 200 : 400;
        res.status(code).json({ data: addedNewFamilyCareUser });
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
exports.fcAddNewUser = fcAddNewUser;
const existingUserSendOtp = async (req, res) => {
    try {
        const user = req.user;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const linkFromUserId = user?.id;
        const linkFromUserName = user?.fullName;
        const validationResponse = familyCareValidations_1.existingUserValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const finalData = {
            ...data,
            userData: user,
            linkFromUserName,
        };
        if (!data.uuid || !data.relation) {
            throw new HttpError_1.default("missing required fields", 422);
        }
        const addedExistingUser = await (0, familyCare_services_1.generateOtpExistingAccount)(finalData);
        if (!addedExistingUser) {
            throw new HttpError_1.default("could not create a link for existing user", 204);
        }
        const code = addedExistingUser.success ? 200 : 400;
        res.status(code).json({ data: addedExistingUser });
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
exports.existingUserSendOtp = existingUserSendOtp;
const createExistingUser = async (req, res) => {
    try {
        const user = req.user;
        const linkFromUserId = user?.id;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = familyCareValidations_1.existingUserOtpValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const finalData = {
            ...data,
            linkFromUserId,
        };
        if (!data.uuid || !data.relation || !data.otp) {
            throw new HttpError_1.default("missing required fiels", 422);
        }
        const user_linked = await (0, familyCare_services_1.verifyCreateExistingUser)(finalData);
        if (!user_linked) {
            throw new HttpError_1.default("could not create a link for existing user", 204);
        }
        const code = user_linked.success ? 200 : 400;
        res.status(code).json({ data: user_linked });
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
exports.createExistingUser = createExistingUser;
const createDependant = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = familyCareValidations_1.dependantRegisterValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const { fullName, gender, dob, pincode, bloodGroup, relation } = data;
        if (!fullName || !gender || !dob || !pincode || !bloodGroup || !relation) {
            throw new HttpError_1.default("Please provide all required fields", 422);
        }
        // if (!declaration)
        //   throw new HTTPError(
        //     "Declaration for managing minor account is required",
        //     412
        //   );
        const new_dependant = await (0, familyCare_services_1.createNewDependant)(data, user);
        if (!new_dependant)
            throw new HttpError_1.default(`Could Not Create New Dependant`, 204);
        const code = new_dependant.success ? 200 : 400;
        res.status(code).json({ data: new_dependant });
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
exports.createDependant = createDependant;
const getAllFamily = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        if (!user.id) {
            throw new HttpError_1.default("user id missing", 401);
        }
        const queryParams = req.query;
        const allfamily = await (0, familyCare_services_1.getFamilyMembers)(user.id, queryParams);
        if (!allfamily)
            throw new HttpError_1.default(`Could Not find any family`, 204);
        const code = allfamily.success ? 200 : 400;
        res.status(code).json({ data: allfamily });
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
exports.getAllFamily = getAllFamily;
const changeFamilyAccess = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Missing fields", 422);
        const validationResponse = familyCareValidations_1.changeAccessValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { memberId, access } = data;
        if (!memberId || !access)
            throw new HttpError_1.default("Missing Required Fields", 422);
        const ChangeAccess = await (0, familyCare_services_1.EditFamilyAccess)(user, data);
        if (!ChangeAccess)
            throw new HttpError_1.default(`Could Not change access`, 204);
        const code = ChangeAccess.success ? 200 : 400;
        res.status(code).json({ data: ChangeAccess });
    }
    catch (err) {
        console.log("error", err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.changeFamilyAccess = changeFamilyAccess;
const detachFamilyMember = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const { famCareMemberId } = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!famCareMemberId)
            throw new HttpError_1.default("Missing fields", 422);
        if (!user.id || !famCareMemberId) {
            throw new HttpError_1.default("Required fields missing", 422);
        }
        const detachUser = await (0, familyCare_services_1.UnlinkFamilyMember)(user.id, famCareMemberId);
        if (!detachUser)
            throw new HttpError_1.default(`Could Not Detach User from Family Care`, 204);
        const code = detachUser.success ? 200 : 400;
        res.status(code).json({ data: detachUser });
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
exports.detachFamilyMember = detachFamilyMember;
const releaseMinorGenerateOtp = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = familyCareValidations_1.releaseMinorInputValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { minorId, phoneNumber, emailId } = data;
        if ((!minorId && !phoneNumber) || (!minorId && !emailId))
            throw new HttpError_1.default("Missing required fields", 422);
        const detachUser = await (0, familyCare_services_1.releaseMinorGenerateOTP)(user, {
            id: minorId,
            phoneNumber: phoneNumber,
            emailId: emailId,
        });
        if (!detachUser)
            throw new HttpError_1.default(`Could Not Detach User from Family Care`, 204);
        const code = detachUser.success ? 200 : 400;
        res.status(code).json({ data: detachUser });
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
exports.releaseMinorGenerateOtp = releaseMinorGenerateOtp;
const releaseMinorVerifyOtp = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("API Missing body", 422);
        const validationResponse = AuthValidation_1.minorOtpLoginVerificationValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { userId, verifiedContact, otp } = data;
        if (!userId || !verifiedContact || !otp)
            throw new HttpError_1.default("Missing Required Fields", 422);
        const otpverifyResponse = await (0, familyCare_services_1.migrateDependantToUser)(user, data);
        if (!otpverifyResponse)
            throw new HttpError_1.default("Could not migrate minor", 204);
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
exports.releaseMinorVerifyOtp = releaseMinorVerifyOtp;
//# sourceMappingURL=familyCareController.js.map