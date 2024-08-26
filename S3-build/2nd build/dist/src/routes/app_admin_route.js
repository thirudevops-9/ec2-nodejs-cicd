"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminAuthController_1 = require("../controllers/adminAuthController");
const admin_middleware_1 = require("../middleware/admin.middleware");
const contentManagementController_1 = require("../controllers/contentManagementController");
const userController_1 = require("../controllers/userController");
const multerConfig_1 = require("../../config/multerConfig");
const vitalsController_1 = require("../controllers/vitalsController");
const adminUserController_1 = require("../controllers/adminUserController");
const auth_services_1 = require("../services/auth.services");
const router = express_1.default.Router();
//Authentication
//check session
router.post("/check-session", adminAuthController_1.checkSession);
//login superadmin,admin,auditor
router.post("/create-otp", adminAuthController_1.createOtpLogin);
//verify login otp
router.post("/verify-otp", adminAuthController_1.verifyOtpLogin);
//refresh token
router.post("/refreshToken", adminAuthController_1.refreshAdminToken);
//logout
router.post("/logout-admin", admin_middleware_1.verifyAdminToken, adminAuthController_1.adminLogout);
//CRUD Superadmin
//create superadmin
router.post("/send-otp/superAdmin", adminAuthController_1.sendOtp);
router.post("/resend-otp/superAdmin", auth_services_1.resendOtp);
router.post("/verify-otp-superAdmin", adminAuthController_1.registerSuperAdmin);
//get all superadmin
router.get("/super-superAdmin", admin_middleware_1.verifyAdminToken, adminAuthController_1.getSuperAdmins);
//update
router.patch("/update-superAdmin", admin_middleware_1.verifyAdminToken, adminAuthController_1.updateSuperAdmins);
//delete admin
router.delete("/delete-superAdmin", admin_middleware_1.verifyAdminToken, adminAuthController_1.deleteSuperAdmins);
//CRUD admin/auditor
//create admin & auditor
//create otp for admin auditor
router.post("/sign-up/admin_auditor", admin_middleware_1.verifyAdminToken, adminAuthController_1.sendOtpAdminAuditor); //created other for security purpose
//resend otp for admin auditor
router.post("/resend-otp/admin_auditor", admin_middleware_1.verifyAdminToken, adminAuthController_1.resendOtpAdminAuditor); //created other for security purpose
//verify otp for admin auditor
router.post("/verify-otp/admin", admin_middleware_1.verifyAdminToken, adminAuthController_1.registerAdminAuditor);
//update admin and auditor
router.patch("/update/admin_auditor", admin_middleware_1.verifyAdminToken, adminAuthController_1.updateAdmin);
//read admin and auditor
router.get("/getAdminAuditor", admin_middleware_1.verifyAdminToken, adminAuthController_1.getAdminAuditor);
//delete admin and auditor
router.delete("/delete/adminAuditor", admin_middleware_1.verifyAdminToken, adminAuthController_1.deleteAdminAuditor);
//dashboard user
router.get("/dashboard", admin_middleware_1.verifyAdminToken, adminAuthController_1.adminDashboard);
//CONTENT MANAGEMENT
//get all content
router.get("/all-content", admin_middleware_1.verifyAdminToken, contentManagementController_1.getAllContent);
//VIDEOS
//Create Videos
router.post("/videos", admin_middleware_1.verifyAdminToken, multerConfig_1.upload.single("imageFile"), contentManagementController_1.createVideo);
//read videos
router.get("/videos", admin_middleware_1.verifyAdminToken, contentManagementController_1.getVideosAdmin);
//update video by id
router.patch("/videos/:id", admin_middleware_1.verifyAdminToken, multerConfig_1.upload.single("imageFile"), contentManagementController_1.editVideoById);
//delete vidoes
router.delete("/videos", admin_middleware_1.verifyAdminToken, contentManagementController_1.deleteVideos);
//ADVERTISEMENTS
//Create advertisement
router.post("/advertisement", admin_middleware_1.verifyAdminToken, multerConfig_1.upload.single("imageFile"), contentManagementController_1.createAdvertisement);
//read advertisement
router.get("/advertisement", admin_middleware_1.verifyAdminToken, contentManagementController_1.getAdvertisementsAdmin);
//update advertisement by id
router.put("/advertisement/:id", admin_middleware_1.verifyAdminToken, multerConfig_1.upload.single("imageFile"), contentManagementController_1.editAdvertisementById);
//delete advertisements
router.delete("/advertisement", admin_middleware_1.verifyAdminToken, contentManagementController_1.deleteAdvertisement);
//FACILITIES
//Create facilities
router.post("/facilities", admin_middleware_1.verifyAdminToken, contentManagementController_1.createFacilities);
//read facilities
router.get("/facilities", admin_middleware_1.verifyAdminToken, contentManagementController_1.getFacilitiesAdmin);
//update facilities by id
router.patch("/facilities/:id", admin_middleware_1.verifyAdminToken, contentManagementController_1.editFacilitiesById);
//delete facilitiess
router.delete("/facilities", admin_middleware_1.verifyAdminToken, contentManagementController_1.deleteFacility);
//FEEDBACK AND COMPLAINT
//block user
router.post("/admin-block-user", admin_middleware_1.verifyAdminToken, adminUserController_1.adminBlockUser);
//un-block user
router.post("/unblock-user/:id", admin_middleware_1.verifyAdminToken, adminUserController_1.adminUnblockUser);
//get all feedbacks and complaints
router.get("/feedback-complaint", admin_middleware_1.verifyAdminToken, contentManagementController_1.getUserMessages);
//reply to complaint by id
router.post("/reply-complaint/:id", admin_middleware_1.verifyAdminToken, contentManagementController_1.replyCompliantById);
//SELF-AWARENESS
//VITALS - Modules
//Add a new vital module
router.post("/vitalModule", admin_middleware_1.verifyAdminToken, vitalsController_1.createVitalModules);
//Get all Vital modules
router.get("/vitalModule", admin_middleware_1.verifyAdminToken, vitalsController_1.getAllVitalModules);
//update vital module by id
router.put("/vitalModule/:id", admin_middleware_1.verifyAdminToken, vitalsController_1.updateVitalModuleById);
//delete vital module by id
router.delete("/vitalModule", admin_middleware_1.verifyAdminToken, vitalsController_1.deleteVitalModules);
//USER
//View All Users
router.get("/users", admin_middleware_1.verifyAdminToken, userController_1.getAllUsers);
//View User by Id
router.get("/users/:id", admin_middleware_1.verifyAdminToken, userController_1.getUserById);
//delete user by ID
router.delete("/users/:id", admin_middleware_1.verifyAdminToken, adminUserController_1.adminDeleteUserById);
exports.default = router;
//# sourceMappingURL=app_admin_route.js.map