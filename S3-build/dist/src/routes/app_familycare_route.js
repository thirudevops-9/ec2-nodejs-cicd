"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_middleware_1 = require("../middleware/user.middleware");
const familyCareController_1 = require("../controllers/familyCareController");
const userController_1 = require("../controllers/userController");
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
//FAMILY CARE
//Check if user can add a new family member(5 for paid, 2 for free)
router.get("/subscription-check", user_middleware_1.verifyUserToken, familyCareController_1.checkSubscription);
//Add new dependant
// router.post("/generateOtpDependant", verifyUserToken, generateOtpForDependant);
router.post("/dependant", user_middleware_1.verifyUserToken, familyCareController_1.createDependant);
//add new user
router.post("/generate-otp/sub-account", user_middleware_1.verifyUserToken, authController_1.generateOtpForRegistration); //done
router.post("/otp-verify/sub-account", user_middleware_1.verifyUserToken, authController_1.verifyOtpForRegistration); //done
router.post("/otp-resend/sub-account", user_middleware_1.verifyUserToken, authController_1.resendOtpRegistration); //done
router.post("/add_new_user", user_middleware_1.verifyUserToken, familyCareController_1.fcAddNewUser); //done
//Linking to existing user
router.post("/existingUserSendOTP", user_middleware_1.verifyUserToken, familyCareController_1.existingUserSendOtp); //done
router.post("/existing_user", user_middleware_1.verifyUserToken, familyCareController_1.createExistingUser); //done
//Delete dependent
//GENERAL FAMILY CARE FUNCTIONS
//Get data of all family care members
router.get("/family-members/all", user_middleware_1.verifyUserToken, familyCareController_1.getAllFamily); //done
//Change access
router.put("/change-access", user_middleware_1.verifyUserToken, familyCareController_1.changeFamilyAccess); //done
//detach from family member
//1. verify password
router.post("/password-verify", user_middleware_1.verifyUserToken, userController_1.userPasswordVerify); //done
//2. detach user
router.delete("/detach-member", user_middleware_1.verifyUserToken, familyCareController_1.detachFamilyMember); //done
//Release Minor Account
//1. Add new phone number + generate OTP
router.post("/release-minor/generate-otp", user_middleware_1.verifyUserToken, familyCareController_1.releaseMinorGenerateOtp); //done
//2. Verify OTP and release account
router.delete("/release-minor/verify-otp", user_middleware_1.verifyUserToken, familyCareController_1.releaseMinorVerifyOtp);
exports.default = router;
//# sourceMappingURL=app_familycare_route.js.map