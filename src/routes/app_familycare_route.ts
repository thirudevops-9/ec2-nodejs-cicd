import express from "express";

import { verifyUserToken } from "../middleware/user.middleware";
import {
  changeFamilyAccess,
  checkSubscription,
  createDependant,
  createExistingUser,
  detachFamilyMember,
  existingUserSendOtp,
  fcAddNewUser,
  // generateOtpForDependant,
  getAllFamily,
  // get_family_member_by_id,
  releaseMinorGenerateOtp,
  releaseMinorVerifyOtp,
} from "../controllers/familyCareController";
import { userPasswordVerify } from "../controllers/userController";
import {
  generateOtpForRegistration,
  resendOtpRegistration,
  verifyOtpForRegistration,
} from "../controllers/authController";

const router = express.Router();

//FAMILY CARE
//Check if user can add a new family member(5 for paid, 2 for free)
router.get("/subscription-check", verifyUserToken, checkSubscription);

//Add new dependant
// router.post("/generateOtpDependant", verifyUserToken, generateOtpForDependant);
router.post("/dependant", verifyUserToken, createDependant);

//add new user
router.post(
  "/generate-otp/sub-account",
  verifyUserToken,
  generateOtpForRegistration
); //done

router.post(
  "/otp-verify/sub-account",
  verifyUserToken,
  verifyOtpForRegistration
);//done
router.post("/otp-resend/sub-account", verifyUserToken, resendOtpRegistration); //done
router.post("/add_new_user", verifyUserToken, fcAddNewUser);//done

//Linking to existing user
router.post("/existingUserSendOTP", verifyUserToken, existingUserSendOtp); //done
router.post("/existing_user", verifyUserToken, createExistingUser);//done

//Delete dependent
//GENERAL FAMILY CARE FUNCTIONS
//Get data of all family care members
router.get("/family-members/all", verifyUserToken, getAllFamily); //done

//Change access
router.put("/change-access", verifyUserToken, changeFamilyAccess); //done

//detach from family member
//1. verify password
router.post("/password-verify", verifyUserToken, userPasswordVerify);//done
//2. detach user
router.delete("/detach-member", verifyUserToken, detachFamilyMember);//done

//Release Minor Account
//1. Add new phone number + generate OTP
router.post(
  "/release-minor/generate-otp",
  verifyUserToken,
  releaseMinorGenerateOtp
); //done

//2. Verify OTP and release account
router.delete(
  "/release-minor/verify-otp",
  verifyUserToken,
  releaseMinorVerifyOtp
);

export default router;
