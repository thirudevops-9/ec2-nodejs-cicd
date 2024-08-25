import express from "express";
import {
  refreshAdminToken,
  adminLogout,
  getSuperAdmins,
  updateSuperAdmins,
  deleteSuperAdmins,
  updateAdmin,
  sendOtp,
  registerSuperAdmin,
  sendOtpAdminAuditor,
  registerAdminAuditor,
  createOtpLogin,
  verifyOtpLogin,
  getAdminAuditor,
  deleteAdminAuditor,
  adminDashboard,
  checkSession,
  resendOtpAdminAuditor,
} from "../controllers/adminAuthController";
import { verifyAdminToken } from "../middleware/admin.middleware";
import {
  createAdvertisement,
  createFacilities,
  createVideo,
  deleteAdvertisement,
  deleteFacility,
  deleteVideos,
  editAdvertisementById,
  editFacilitiesById,
  editVideoById,
  getAdvertisementsAdmin,
  getAllContent,
  getFacilitiesAdmin,
  getUserMessages,
  getVideosAdmin,
  replyCompliantById,
} from "../controllers/contentManagementController";
import { getAllUsers, getUserById } from "../controllers/userController";
import { upload } from "../../config/multerConfig";
import {
  createVitalModules,
  deleteVitalModules,
  getAllVitalModules,
  updateVitalModuleById,
} from "../controllers/vitalsController";
import {
  adminBlockUser,
  adminDeleteUserById,
  adminUnblockUser,
} from "../controllers/adminUserController";
import { resendOtp } from "../services/auth.services";

const router = express.Router();

//Authentication
//check session
router.post("/check-session", checkSession);
//login superadmin,admin,auditor
router.post("/create-otp", createOtpLogin);

//verify login otp
router.post("/verify-otp", verifyOtpLogin);
//refresh token
router.post("/refreshToken", refreshAdminToken);
//logout
router.post("/logout-admin", verifyAdminToken, adminLogout);

//CRUD Superadmin
//create superadmin
router.post("/send-otp/superAdmin", sendOtp);

router.post("/resend-otp/superAdmin", resendOtp);

router.post("/verify-otp-superAdmin", registerSuperAdmin);
//get all superadmin
router.get("/super-superAdmin", verifyAdminToken, getSuperAdmins);
//update
router.patch("/update-superAdmin", verifyAdminToken, updateSuperAdmins);
//delete admin
router.delete("/delete-superAdmin", verifyAdminToken, deleteSuperAdmins);

//CRUD admin/auditor
//create admin & auditor
//create otp for admin auditor
router.post("/sign-up/admin_auditor", verifyAdminToken, sendOtpAdminAuditor); //created other for security purpose

//resend otp for admin auditor
router.post(
  "/resend-otp/admin_auditor",
  verifyAdminToken,
  resendOtpAdminAuditor
); //created other for security purpose

//verify otp for admin auditor
router.post("/verify-otp/admin", verifyAdminToken, registerAdminAuditor);
//update admin and auditor
router.patch("/update/admin_auditor", verifyAdminToken, updateAdmin);
//read admin and auditor
router.get("/getAdminAuditor", verifyAdminToken, getAdminAuditor);
//delete admin and auditor
router.delete("/delete/adminAuditor", verifyAdminToken, deleteAdminAuditor);

//dashboard user
router.get("/dashboard", verifyAdminToken, adminDashboard);

//CONTENT MANAGEMENT
//get all content
router.get("/all-content", verifyAdminToken, getAllContent);

//VIDEOS
//Create Videos
router.post(
  "/videos",
  verifyAdminToken,
  upload.single("imageFile"),
  createVideo
);
//read videos
router.get("/videos", verifyAdminToken, getVideosAdmin);
//update video by id
router.patch(
  "/videos/:id",
  verifyAdminToken,
  upload.single("imageFile"),
  editVideoById
);
//delete vidoes
router.delete("/videos", verifyAdminToken, deleteVideos);

//ADVERTISEMENTS
//Create advertisement
router.post(
  "/advertisement",
  verifyAdminToken,
  upload.single("imageFile"),
  createAdvertisement
);
//read advertisement
router.get("/advertisement", verifyAdminToken, getAdvertisementsAdmin);
//update advertisement by id
router.put(
  "/advertisement/:id",
  verifyAdminToken,
  upload.single("imageFile"),
  editAdvertisementById
);
//delete advertisements
router.delete("/advertisement", verifyAdminToken, deleteAdvertisement);

//FACILITIES
//Create facilities
router.post("/facilities", verifyAdminToken, createFacilities);
//read facilities
router.get("/facilities", verifyAdminToken, getFacilitiesAdmin);
//update facilities by id
router.patch("/facilities/:id", verifyAdminToken, editFacilitiesById);
//delete facilitiess
router.delete("/facilities", verifyAdminToken, deleteFacility);

//FEEDBACK AND COMPLAINT
//block user
router.post("/admin-block-user", verifyAdminToken, adminBlockUser);
//un-block user
router.post("/unblock-user/:id", verifyAdminToken, adminUnblockUser);

//get all feedbacks and complaints
router.get("/feedback-complaint", verifyAdminToken, getUserMessages);
//reply to complaint by id
router.post("/reply-complaint/:id", verifyAdminToken, replyCompliantById);

//SELF-AWARENESS
//VITALS - Modules
//Add a new vital module
router.post("/vitalModule", verifyAdminToken, createVitalModules);
//Get all Vital modules
router.get("/vitalModule", verifyAdminToken, getAllVitalModules);
//update vital module by id
router.put("/vitalModule/:id", verifyAdminToken, updateVitalModuleById);
//delete vital module by id
router.delete("/vitalModule", verifyAdminToken, deleteVitalModules);

//USER
//View All Users
router.get("/users", verifyAdminToken, getAllUsers);
//View User by Id
router.get("/users/:id", verifyAdminToken, getUserById);
//delete user by ID
router.delete("/users/:id", verifyAdminToken, adminDeleteUserById);

export default router;
