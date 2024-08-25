import express from "express";
import {
  checkSession,
  createUser,
  generateOtpForRegistration,
  generateOtpForResetPassword,
  loginWithOtpGenerate,
  loginWithOtpVerify,
  loginWithPassword,
  logout,
  refreshToken,
  resendOtpRegistration,
  userResetPassword,
  verifiedOtpForResetPassword,
  verifyOtpForRegistration,
} from "../controllers/authController";
import { verifyUserToken } from "../middleware/user.middleware";
import {
  createAppointment,
  deleteAppointmentById,
  getAppointments,
  updateAppointmentById,
} from "../controllers/appointmentController";
import {
  deleteUserById,
  getAdvertisementsUser,
  getFacilitiesUser,
  getUserById,
  getUserSettings,
  getVideosUser,
  protectedGenerateOtpForResetPassword,
  protectedUserResetPassword,
  protectedVerifiedOtpForResetPassword,
  splashUserData,
  syncUserChanges,
  testRoute,
  updateUserById,
  updateUserSettings,
  userFeedbackComplaint,
  userNewContact,
  userOtpVerify,
  userPasswordVerify,
} from "../controllers/userController";
import { upload } from "../../config/multerConfig";
import {
  deleteUploadFile,
  editUploadFile,
  getDocuments,
  userUploadFile,
} from "../controllers/documentsController";
import {
  createMedicineReminder,
  deleteMedicineById,
  getAllReminders,
  getMedicines,
  updateMedicineById,
} from "../controllers/medicineController";
import {
  createNotes,
  deleteNotes,
  getAllNotes,
  updateNotes,
} from "../controllers/notes.controller";
import {
  createPolicy,
  deletePolicies,
  getAllPolicies,
  getNotification,
  updatePolicyById,
} from "../controllers/insuranceController";

const router = express.Router();

//REGISTER
//generating otp
router.post("/user/generate-otp", generateOtpForRegistration); //done

//OTP verification
router.post("/user/otp-verify", verifyOtpForRegistration); //done

//resend OTP
router.post("/user/otp-resend", resendOtpRegistration); //done

// Registering user
router.post("/user", createUser); //done

//LOGIN
//1.check if the user is already logged in
router.post("/check-session", checkSession); //done
//with userId and password
router.post("/user/login-password", loginWithPassword); //done

//with otp
router.post("/user/login-otp/generate", loginWithOtpGenerate); //done

router.post("/user/login-otp/verify", loginWithOtpVerify); //done

//LOGOUT
router.post("/user/logout", verifyUserToken, logout); //done

//FORGOT PASSWORD - Auth module
router.post("/user/forgot-password-otp/generate", generateOtpForResetPassword); //done

router.post("/user/forgot-password-otp/verify", verifiedOtpForResetPassword); //done

router.patch("/user/forgot-password", userResetPassword); //done

//SESSION MANAGEMENT
//Splash screen
router.get("/user/session", verifyUserToken, splashUserData); //done

//Refresh token
router.post("/user/refresh-token", refreshToken); //done

//USER-DATA ROUTES
//settings - change settings
router.patch("/user/settings", verifyUserToken, updateUserSettings); //done

//get settings data
router.get("/user/settings", verifyUserToken, getUserSettings); //done

//user by id (profile data)
router.get("/user/:id", verifyUserToken, getUserById); // not in use

//Sync Changes
router.get("/user/sync/changes", verifyUserToken, syncUserChanges); //done

//APPOINTMENTS
//Create an appointment
router.post("/appointment", verifyUserToken, createAppointment); //done

//Read Appointments
router.get("/appointment", verifyUserToken, getAppointments); //done

//Update an Appointment
router.patch("/appointment/:id", verifyUserToken, updateAppointmentById); //done

//Delete an Appointment
router.delete("/appointment", verifyUserToken, deleteAppointmentById); //done

//PROFILE
//password verify -> new details -> OTP verify
//1. Verify User Password
router.post(
  "/user/contact-change/password-verify",
  verifyUserToken,
  userPasswordVerify
); //done

//2. Take new details and generate otp
router.post(
  "/user/contact-change/new-contact",
  verifyUserToken,
  userNewContact
); //done

//3. Verify OTP and change details
router.put("/user/contact-change/otp-verify", verifyUserToken, userOtpVerify); //done

//update details: others
router.put("/user", verifyUserToken, updateUserById); //done

//DELETE USER FLOW
//1. Verify password
router.post(
  "/user/delete-account/password-verify",
  verifyUserToken,
  userPasswordVerify
); //done

//2. Delete user
router.delete("/user", verifyUserToken, deleteUserById); //done

//RESET-PASSWORD (Protected Route)
router.post(
  "/user/reset-password-otp/generate",
  verifyUserToken,
  protectedGenerateOtpForResetPassword
);

router.post(
  "/user/reset-password-otp/verify",
  verifyUserToken,
  protectedVerifiedOtpForResetPassword
);

router.patch(
  "/user/reset-password",
  verifyUserToken,
  protectedUserResetPassword
);

//documents
//upload
router.post(
  "/documents",
  verifyUserToken,
  upload.single("document"),
  userUploadFile
); //done

//Get documents
router.get("/documents", verifyUserToken, getDocuments); //done

//edit
router.put(
  "/documents/:doc_id",
  verifyUserToken,
  upload.single("document"),
  editUploadFile
); //done

//delete
router.delete(
  "/documents",
  verifyUserToken,
  upload.single("document"),
  deleteUploadFile
); //done

//MEDICINES
// Add new medicine reminder
router.post("/medicine", verifyUserToken, createMedicineReminder); //done

// Get all medicine reminders
router.get("/medicine", verifyUserToken, getMedicines); //done

// Edit medicine reminder
// Deactivate medicine reminder
router.put("/medicine/:id", verifyUserToken, updateMedicineById); //done

// Delete medicine reminder
router.delete("/medicine", verifyUserToken, deleteMedicineById); //done

router.get("/reminders", verifyUserToken, getAllReminders);

//Notes

//create notes
router.post("/createNotes", verifyUserToken, createNotes); //done

//read notes
router.get("/readNotes", verifyUserToken, getAllNotes); //done

//update Notes
router.patch("/updateNotes/:id", verifyUserToken, updateNotes); //done

//delete Notes
router.delete("/deleteNotes", verifyUserToken, deleteNotes); //done

//FEEDBACK AND COMPLAINTS
//feedback-complaint
router.post("/user-message", verifyUserToken, userFeedbackComplaint); //done

// //BLOCK USER
// router.post("/auto-block-user", blockUser);

//CONTENT-MANAGEMENT
//get advertisements
router.get("/advertisement", verifyUserToken, getAdvertisementsUser); //done

//get videos
router.get("/videos", verifyUserToken, getVideosUser); //done

//get facilities
router.get("/facilities", verifyUserToken, getFacilitiesUser); //done

//INSURANCE
//Add a policy
router.post("/policy", verifyUserToken, upload.single("policy"), createPolicy); //done

//Read all policies
router.get("/policy", verifyUserToken, getAllPolicies); //done

//Edit Policy by id
router.patch(
  "/policy/:id",
  verifyUserToken,
  upload.single("policy"),
  updatePolicyById
); //done

//Delete Policies
router.delete("/policy", verifyUserToken, deletePolicies); //done

//notification
router.get("/notifications", verifyUserToken, getNotification);

//test route
router.post("/test", testRoute);

export default router;
