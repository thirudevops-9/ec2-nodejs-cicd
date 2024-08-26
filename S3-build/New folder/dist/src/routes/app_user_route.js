"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const user_middleware_1 = require("../middleware/user.middleware");
const appointmentController_1 = require("../controllers/appointmentController");
const userController_1 = require("../controllers/userController");
const multerConfig_1 = require("../../config/multerConfig");
const documentsController_1 = require("../controllers/documentsController");
const medicineController_1 = require("../controllers/medicineController");
const notes_controller_1 = require("../controllers/notes.controller");
const insuranceController_1 = require("../controllers/insuranceController");
const router = express_1.default.Router();
//REGISTER
//generating otp
router.post("/user/generate-otp", authController_1.generateOtpForRegistration); //done
//OTP verification
router.post("/user/otp-verify", authController_1.verifyOtpForRegistration); //done
//resend OTP
router.post("/user/otp-resend", authController_1.resendOtpRegistration); //done
// Registering user
router.post("/user", authController_1.createUser); //done
//LOGIN
//1.check if the user is already logged in
router.post("/check-session", authController_1.checkSession); //done
//with userId and password
router.post("/user/login-password", authController_1.loginWithPassword); //done
//with otp
router.post("/user/login-otp/generate", authController_1.loginWithOtpGenerate); //done
router.post("/user/login-otp/verify", authController_1.loginWithOtpVerify); //done
//LOGOUT
router.post("/user/logout", user_middleware_1.verifyUserToken, authController_1.logout); //done
//FORGOT PASSWORD - Auth module
router.post("/user/forgot-password-otp/generate", authController_1.generateOtpForResetPassword); //done
router.post("/user/forgot-password-otp/verify", authController_1.verifiedOtpForResetPassword); //done
router.patch("/user/forgot-password", authController_1.userResetPassword); //done
//SESSION MANAGEMENT
//Splash screen
router.get("/user/session", user_middleware_1.verifyUserToken, userController_1.splashUserData); //done
//Refresh token
router.post("/user/refresh-token", authController_1.refreshToken); //done
//USER-DATA ROUTES
//settings - change settings
router.patch("/user/settings", user_middleware_1.verifyUserToken, userController_1.updateUserSettings); //done
//get settings data
router.get("/user/settings", user_middleware_1.verifyUserToken, userController_1.getUserSettings); //done
//user by id (profile data)
router.get("/user/:id", user_middleware_1.verifyUserToken, userController_1.getUserById); // not in use
//Sync Changes
router.get("/user/sync/changes", user_middleware_1.verifyUserToken, userController_1.syncUserChanges); //done
//APPOINTMENTS
//Create an appointment
router.post("/appointment", user_middleware_1.verifyUserToken, appointmentController_1.createAppointment); //done
//Read Appointments
router.get("/appointment", user_middleware_1.verifyUserToken, appointmentController_1.getAppointments); //done
//Update an Appointment
router.patch("/appointment/:id", user_middleware_1.verifyUserToken, appointmentController_1.updateAppointmentById); //done
//Delete an Appointment
router.delete("/appointment", user_middleware_1.verifyUserToken, appointmentController_1.deleteAppointmentById); //done
//PROFILE
//password verify -> new details -> OTP verify
//1. Verify User Password
router.post("/user/contact-change/password-verify", user_middleware_1.verifyUserToken, userController_1.userPasswordVerify); //done
//2. Take new details and generate otp
router.post("/user/contact-change/new-contact", user_middleware_1.verifyUserToken, userController_1.userNewContact); //done
//3. Verify OTP and change details
router.put("/user/contact-change/otp-verify", user_middleware_1.verifyUserToken, userController_1.userOtpVerify); //done
//update details: others
router.put("/user", user_middleware_1.verifyUserToken, userController_1.updateUserById); //done
//DELETE USER FLOW
//1. Verify password
router.post("/user/delete-account/password-verify", user_middleware_1.verifyUserToken, userController_1.userPasswordVerify); //done
//2. Delete user
router.delete("/user", user_middleware_1.verifyUserToken, userController_1.deleteUserById); //done
//RESET-PASSWORD (Protected Route)
router.post("/user/reset-password-otp/generate", user_middleware_1.verifyUserToken, userController_1.protectedGenerateOtpForResetPassword);
router.post("/user/reset-password-otp/verify", user_middleware_1.verifyUserToken, userController_1.protectedVerifiedOtpForResetPassword);
router.patch("/user/reset-password", user_middleware_1.verifyUserToken, userController_1.protectedUserResetPassword);
//documents
//upload
router.post("/documents", user_middleware_1.verifyUserToken, multerConfig_1.upload.single("document"), documentsController_1.userUploadFile); //done
//Get documents
router.get("/documents", user_middleware_1.verifyUserToken, documentsController_1.getDocuments); //done
//edit
router.put("/documents/:doc_id", user_middleware_1.verifyUserToken, multerConfig_1.upload.single("document"), documentsController_1.editUploadFile); //done
//delete
router.delete("/documents", user_middleware_1.verifyUserToken, multerConfig_1.upload.single("document"), documentsController_1.deleteUploadFile); //done
//MEDICINES
// Add new medicine reminder
router.post("/medicine", user_middleware_1.verifyUserToken, medicineController_1.createMedicineReminder); //done
// Get all medicine reminders
router.get("/medicine", user_middleware_1.verifyUserToken, medicineController_1.getMedicines); //done
// Edit medicine reminder
// Deactivate medicine reminder
router.put("/medicine/:id", user_middleware_1.verifyUserToken, medicineController_1.updateMedicineById); //done
// Delete medicine reminder
router.delete("/medicine", user_middleware_1.verifyUserToken, medicineController_1.deleteMedicineById); //done
router.get("/reminders", user_middleware_1.verifyUserToken, medicineController_1.getAllReminders);
//Notes
//create notes
router.post("/createNotes", user_middleware_1.verifyUserToken, notes_controller_1.createNotes); //done
//read notes
router.get("/readNotes", user_middleware_1.verifyUserToken, notes_controller_1.getAllNotes); //done
//update Notes
router.patch("/updateNotes/:id", user_middleware_1.verifyUserToken, notes_controller_1.updateNotes); //done
//delete Notes
router.delete("/deleteNotes", user_middleware_1.verifyUserToken, notes_controller_1.deleteNotes); //done
//FEEDBACK AND COMPLAINTS
//feedback-complaint
router.post("/user-message", user_middleware_1.verifyUserToken, userController_1.userFeedbackComplaint); //done
// //BLOCK USER
// router.post("/auto-block-user", blockUser);
//CONTENT-MANAGEMENT
//get advertisements
router.get("/advertisement", user_middleware_1.verifyUserToken, userController_1.getAdvertisementsUser); //done
//get videos
router.get("/videos", user_middleware_1.verifyUserToken, userController_1.getVideosUser); //done
//get facilities
router.get("/facilities", user_middleware_1.verifyUserToken, userController_1.getFacilitiesUser); //done
//INSURANCE
//Add a policy
router.post("/policy", user_middleware_1.verifyUserToken, multerConfig_1.upload.single("policy"), insuranceController_1.createPolicy); //done
//Read all policies
router.get("/policy", user_middleware_1.verifyUserToken, insuranceController_1.getAllPolicies); //done
//Edit Policy by id
router.patch("/policy/:id", user_middleware_1.verifyUserToken, multerConfig_1.upload.single("policy"), insuranceController_1.updatePolicyById); //done
//Delete Policies
router.delete("/policy", user_middleware_1.verifyUserToken, insuranceController_1.deletePolicies); //done
//notification
router.get("/notifications", user_middleware_1.verifyUserToken, insuranceController_1.getNotification);
//test route
router.post("/test", userController_1.testRoute);
exports.default = router;
//# sourceMappingURL=app_user_route.js.map