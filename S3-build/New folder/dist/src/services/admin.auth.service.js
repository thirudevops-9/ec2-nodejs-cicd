"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateUserById = exports.getSuperAdminDashboardData = exports.deleteAdminAuditors = exports.fetchAdminAuditor = exports.updateAdminData = exports.verifyOtpAdminAuditor = exports.resendOtpforAdminAuditor = exports.createOtpforAdminAuditor = exports.deleteSuperAdmin = exports.updateSuperAdmin = exports.getSuperAdmin = exports.verifyOtpSuperAdmin = exports.resendOtpforSuperAdminRegistration = exports.createOtpforSuperAdminRegistration = exports.logoutAdmin = exports.generateNewAccessToken = exports.loginDashboardUser = exports.createOtpforLogin = exports.checkUserSession = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const Tokens_1 = require("../utility/Tokens");
const crypto_1 = __importDefault(require("crypto"));
const emailService_1 = require("../utility/emailService");
const OtpStorageInDb_1 = require("../utility/OtpStorageInDb");
const auth_services_1 = require("./auth.services");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const DashboardTemplates_1 = require("../templates/DashboardTemplates");
//login
//check session
const checkUserSession = async (data) => {
    try {
        const { emailId } = data;
        //check if user exist
        const findUser = await prisma_1.default.dashboardUser.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (!findUser) {
            throw new HttpError_1.default("could not find user ", 404);
        }
        //check user session
        const isSessionValid = await prisma_1.default.dashboardUser.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
                NOT: {
                    currentSessionId: null,
                },
            },
        });
        if (isSessionValid) {
            throw new HttpError_1.default("You are already logged in", 423);
        }
        return {
            success: true,
            message: "You can continue to login",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.checkUserSession = checkUserSession;
//1.send otp
const createOtpforLogin = async (data) => {
    try {
        const { emailId } = data;
        const existingAdmin = await prisma_1.default.dashboardUser.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (!existingAdmin) {
            throw new HttpError_1.default(`user with ${emailId} does not exist`, 404); // user already exist throw error
        }
        const storedOtpInDb = await (0, OtpStorageInDb_1.StoreOtpInDb)(emailId, existingAdmin.position, existingAdmin.role, existingAdmin.fullName, DashboardTemplates_1.otp_verification_dashboardUsers_login, "THITO- OTP for login");
        if (!storedOtpInDb.success) {
            throw new HttpError_1.default("cannot store otp", 204);
        }
        return {
            success: true,
            message: "OTP send successfully!!",
            emailId: emailId,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createOtpforLogin = createOtpforLogin;
//2.verify otp
const loginDashboardUser = async (data) => {
    try {
        const { emailId, otp } = data;
        //password verification
        const admin_create = await prisma_1.default.dashboardUser.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (!admin_create) {
            throw new HttpError_1.default(`could not find user with email id ${emailId}`, 404);
        }
        //otp verification
        const verifyUser = await (0, OtpStorageInDb_1.verifyOTPFromDb)(emailId, otp);
        if (!verifyUser) {
            throw new HttpError_1.default("cannot verify user: db error", 500);
        }
        //session id generation
        const currentSessionId = crypto_1.default.randomBytes(20).toString("hex");
        //token generation
        const { id, role } = admin_create;
        const adminData = {
            id,
            emailId,
            role,
            currentSessionId,
        };
        const accessToken = (0, Tokens_1.generateAccessTokenAdmin)(adminData);
        const refreshToken = (0, Tokens_1.generateRefreshTokenAdmin)(adminData);
        //adding refresh token to db
        const loggedinAdmin = await prisma_1.default.dashboardUser.update({
            data: {
                refreshToken,
                currentSessionId,
            },
            where: {
                id,
                emailId,
            },
        });
        if (!loggedinAdmin) {
            throw new HttpError_1.default("DB Error:could not login user", 500);
        }
        await prisma_1.default.dashboardUserOtpStore.delete({
            where: {
                emailId,
            },
        });
        return {
            success: true,
            message: " logged in successfully!!",
            role: admin_create.role,
            name: admin_create.fullName,
            accessToken: accessToken,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.loginDashboardUser = loginDashboardUser;
//refresh token
const generateNewAccessToken = async (token) => {
    try {
        if (!token)
            throw new HttpError_1.default("Missing Required Fields", 400);
        // const { accessToken } = data;
        const accessToken = token.split(" ")[1];
        if (!accessToken) {
            throw new HttpError_1.default("No token provided.", 401);
        }
        const decodedToken = jsonwebtoken_1.default.decode(accessToken);
        if (!decodedToken)
            throw new HttpError_1.default("Invalid Token.", 401);
        // 3. Find User
        const dashboardUsers = await prisma_1.default.dashboardUser.findFirst({
            where: { id: decodedToken["id"] },
        });
        if (!dashboardUsers) {
            throw new HttpError_1.default("User not found.", 404);
        }
        //check if the session is valid
        if (dashboardUsers.currentSessionId !== decodedToken.currentSessionId) {
            throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
        }
        // 4. Check Refresh Token
        if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
            // Access token expired
            const refreshToken = dashboardUsers.refreshToken;
            if (!refreshToken) {
                await prisma_1.default.dashboardUser.update({
                    where: { id: dashboardUsers.id },
                    data: { refreshToken: "", currentSessionId: null },
                });
                throw new HttpError_1.default("Access and refresh tokens expired.", 403);
            }
            const refreshDecodedToken = jsonwebtoken_1.default.decode(refreshToken);
            if (!refreshDecodedToken)
                throw new HttpError_1.default("User is logged Out", 403);
            if (dashboardUsers.currentSessionId !== refreshDecodedToken.currentSessionId) {
                await prisma_1.default.dashboardUser.update({
                    where: { id: dashboardUsers.id },
                    data: { refreshToken: "", currentSessionId: null },
                });
                throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
            }
            if (refreshDecodedToken["exp"] &&
                Date.now() / 1000 >= refreshDecodedToken["exp"]) {
                // Refresh token also expired
                await prisma_1.default.dashboardUser.update({
                    where: { id: dashboardUsers.id },
                    data: { refreshToken: "", currentSessionId: null },
                });
                throw new HttpError_1.default("Session expired. Please Log in again", 403);
            }
            else {
                // Generate new access token using refresh token data
                const userData = {
                    id: refreshDecodedToken["id"],
                    emailId: refreshDecodedToken["emailId"],
                    role: refreshDecodedToken["role"],
                    currentSessionId: refreshDecodedToken["currentSessionId"],
                };
                const newAccessToken = (0, Tokens_1.generateAccessTokenAdmin)(userData);
                return {
                    success: true,
                    refreshToken: newAccessToken,
                };
            }
        }
        else {
            // Access token still valid
            return {
                success: true,
                refreshToken: accessToken,
            };
        }
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.generateNewAccessToken = generateNewAccessToken;
//logout admin
const logoutAdmin = async (token) => {
    try {
        const { id, emailId } = token;
        //logout user
        const updateUser = await prisma_1.default.dashboardUser.update({
            data: {
                // isLoggedIn: false,
                refreshToken: "",
                currentSessionId: null,
            },
            where: {
                id: parseInt(id),
                emailId,
            },
        });
        if (!updateUser)
            throw new HttpError_1.default("User not found", 404);
        return {
            success: true,
            message: "successfully logged Out",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.logoutAdmin = logoutAdmin;
// CRUD SuperAdmin
//create otp for superAdmin
const createOtpforSuperAdminRegistration = async (data) => {
    try {
        const { emailId, fullName, position } = data;
        const existingAdmin = await prisma_1.default.dashboardUser.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (existingAdmin) {
            throw new HttpError_1.default(`user with ${emailId} already exist`, 400); // user already exist throw error
        }
        const storedOtpInDb = await (0, OtpStorageInDb_1.StoreOtpInDb)(emailId, position, "SUPERADMIN", fullName, DashboardTemplates_1.otp_verification_dashboardUsers, "OTP for registration in THITO Dashboard");
        if (!storedOtpInDb.success) {
            throw new HttpError_1.default("cannot store otp", 204);
        }
        return {
            success: true,
            message: "OTP send successfully!!",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createOtpforSuperAdminRegistration = createOtpforSuperAdminRegistration;
//re-send otp for superAdmin
const resendOtpforSuperAdminRegistration = async (emailId) => {
    try {
        const existingAdmin = await prisma_1.default.dashboardUserOtpStore.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (!existingAdmin) {
            throw new HttpError_1.default(`user could not be found`, 404); // user already exist throw error
        }
        const storedOtpInDb = await (0, OtpStorageInDb_1.StoreOtpInDb)(emailId, existingAdmin.position, "SUPERADMIN", existingAdmin.fullName, DashboardTemplates_1.otp_verification_dashboardUsers, "OTP for registration in THITO Dashboard");
        if (!storedOtpInDb.success) {
            throw new HttpError_1.default("cannot store otp", 204);
        }
        return {
            success: true,
            message: "OTP send successfully!!",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.resendOtpforSuperAdminRegistration = resendOtpforSuperAdminRegistration;
//verify otp for superadmin
const verifyOtpSuperAdmin = async (data) => {
    try {
        const { emailId, otp } = data;
        const verifyUser = await (0, OtpStorageInDb_1.verifyOTPFromDb)(emailId, otp);
        if (!verifyUser) {
            throw new HttpError_1.default("cannot verify user: db error", 500);
        }
        const admin_create = await prisma_1.default.dashboardUser.create({
            data: {
                fullName: verifyUser.fullName,
                emailId,
                position: verifyUser.position,
                // password: hashedPassword,
                role: verifyUser.role,
            },
        });
        if (!admin_create) {
            throw new HttpError_1.default("could not create admin", 500);
        }
        await prisma_1.default.dashboardUserOtpStore.delete({
            where: {
                emailId,
            },
        });
        let formattedStr = verifyUser.role.charAt(0) + verifyUser.role.slice(1).toLowerCase();
        const emaildata = {
            emailId,
            subject: "Successful registration in THITO Dashboard",
            role: formattedStr,
            fullName: verifyUser.fullName,
        };
        (0, emailService_1.AdminAuditorCreationMail)(emaildata);
        return {
            success: true,
            message: "Super admin created successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.verifyOtpSuperAdmin = verifyOtpSuperAdmin;
//read Superadmin
const getSuperAdmin = async (admin, param) => {
    try {
        const { id } = param;
        const adminId = id ? parseInt(id) : parseInt(admin.id);
        const findAdmin = await prisma_1.default.dashboardUser.findMany({
            where: {
                // id: adminId,
                role: "SUPERADMIN",
            },
            select: {
                id: true,
                fullName: true,
                emailId: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!findAdmin) {
            throw new HttpError_1.default("No Super Admin Found", 404);
        }
        return {
            success: true,
            data: findAdmin,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getSuperAdmin = getSuperAdmin;
//update superAdmin
const updateSuperAdmin = async (data, admin) => {
    try {
        const adminId = parseInt(admin.id);
        const { fullName, emailId, position } = data;
        const findAdmin = await prisma_1.default.dashboardUser.findUnique({
            where: {
                id: adminId,
                role: "SUPERADMIN",
            },
        });
        if (!findAdmin) {
            throw new HttpError_1.default("Could not find superadmin", 404);
        }
        const updateAdmin = await prisma_1.default.dashboardUser.update({
            where: {
                id: adminId,
                role: "SUPERADMIN",
            },
            data: {
                fullName,
                emailId,
                position,
            },
        });
        if (!updateAdmin) {
            throw new HttpError_1.default("Failed to update data", 500);
        }
        let formattedStr = updateAdmin.role.charAt(0) + updateAdmin.role.slice(1).toLowerCase();
        if (emailId) {
            const emaildata = {
                emailId,
                subject: "Successful registration in THITO Dashboard",
                role: formattedStr,
                fullName: updateAdmin.fullName,
            };
            (0, emailService_1.AdminAuditorCreationMail)(emaildata);
        }
        return {
            success: true,
            data: "Super admin updated successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.updateSuperAdmin = updateSuperAdmin;
//delete superadmin
const deleteSuperAdmin = async (admin) => {
    try {
        const adminId = parseInt(admin.id);
        const findAdmin = await prisma_1.default.dashboardUser.findUnique({
            where: {
                id: adminId,
                role: "SUPERADMIN",
            },
        });
        if (!findAdmin) {
            throw new HttpError_1.default("Could not find superadmin", 404);
        }
        const deleteAdmin = await prisma_1.default.dashboardUser.delete({
            where: {
                id: adminId,
                role: "SUPERADMIN",
            },
        });
        if (!deleteAdmin) {
            throw new HttpError_1.default("Failed to update data", 500);
        }
        return {
            success: true,
            data: "Super admin deleted successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.deleteSuperAdmin = deleteSuperAdmin;
//CRUD admin auditor
//create otp for admin & auditor
const createOtpforAdminAuditor = async (data) => {
    try {
        const { emailId, fullName, position, role } = data;
        const existingAdmin = await prisma_1.default.dashboardUser.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (existingAdmin) {
            throw new HttpError_1.default(`user with ${emailId} already exist`, 400); // user already exist throw error
        }
        // create otp
        const storedOtpInDb = await (0, OtpStorageInDb_1.StoreOtpInDb)(emailId, position, role, fullName, DashboardTemplates_1.otp_verification_dashboardUsers, "OTP for registration in THITO Dashboard");
        if (!storedOtpInDb.success) {
            throw new HttpError_1.default("cannot store otp", 204);
        }
        return {
            success: true,
            message: "OTP send successfully!!",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createOtpforAdminAuditor = createOtpforAdminAuditor;
//resend otp for admin & auditor
const resendOtpforAdminAuditor = async (emailId) => {
    try {
        const existingAdmin = await prisma_1.default.dashboardUserOtpStore.findFirst({
            where: {
                emailId: {
                    equals: emailId,
                    mode: "insensitive",
                },
            },
        });
        if (!existingAdmin) {
            throw new HttpError_1.default(`user not found`, 404); // user already exist throw error
        }
        // create otp
        const storedOtpInDb = await (0, OtpStorageInDb_1.StoreOtpInDb)(emailId, existingAdmin.position, existingAdmin.role, existingAdmin.fullName, DashboardTemplates_1.otp_verification_dashboardUsers, "OTP for registration in THITO Dashboard");
        if (!storedOtpInDb.success) {
            throw new HttpError_1.default("cannot store otp", 204);
        }
        return {
            success: true,
            message: "OTP send successfully!!",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.resendOtpforAdminAuditor = resendOtpforAdminAuditor;
//verify otp
const verifyOtpAdminAuditor = async (data) => {
    try {
        const { emailId, otp } = data;
        const verifyUser = await (0, OtpStorageInDb_1.verifyOTPFromDb)(emailId, otp);
        if (!verifyUser) {
            throw new HttpError_1.default("cannot verify user: db error", 500);
        }
        const admin_create = await prisma_1.default.dashboardUser.create({
            data: {
                fullName: verifyUser.fullName,
                emailId,
                position: verifyUser.position,
                // password: hashedPassword,
                role: verifyUser.role,
            },
        });
        if (!admin_create) {
            throw new HttpError_1.default("could not create admin", 500);
        }
        await prisma_1.default.dashboardUserOtpStore.delete({
            where: {
                emailId,
            },
        });
        let formattedStr = verifyUser.role.charAt(0) + verifyUser.role.slice(1).toLowerCase();
        const emaildata = {
            emailId,
            subject: `Successful registration in THITO Dashboard`,
            role: formattedStr,
            fullName: verifyUser.fullName,
        };
        (0, emailService_1.AdminAuditorCreationMail)(emaildata);
        return {
            success: true,
            message: `${verifyUser.role} created successfully`,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.verifyOtpAdminAuditor = verifyOtpAdminAuditor;
//update admin&auditor
const updateAdminData = async (admin, data, params) => {
    try {
        const id = parseInt(params.id, 10);
        const { fullName, position } = data;
        if (admin.role == "SUPERADMIN") {
            //1. Superadmin is changing admin/ auditor details
            const findAdmin = await prisma_1.default.dashboardUser.findUnique({
                where: {
                    id,
                    OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
                },
                select: {
                    role: true,
                },
            });
            // if (emailId) {
            //   if (findAdmin) {
            //     throw new HTTPError("User with email id already exist", 404);
            //   }
            // }
            if (!findAdmin) {
                throw new HttpError_1.default("Could not find admin or auditor", 404);
            }
            const updateAdmin = await prisma_1.default.dashboardUser.update({
                where: {
                    id,
                    OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
                },
                data: {
                    fullName,
                    position,
                },
            });
            if (!updateAdmin) {
                throw new HttpError_1.default("Failed to update data", 500);
            }
            return {
                success: true,
                data: "Admin/auditor updated successfully",
            };
        }
        //2. Auditor is changing his own details
        const findAdmin = await prisma_1.default.dashboardUser.findUnique({
            where: {
                id,
                role: "ADMIN",
            },
            select: {
                role: true,
            },
        });
        if (!findAdmin) {
            throw new HttpError_1.default("Could not find admin", 500);
        }
        const updateAdmin = await prisma_1.default.dashboardUser.update({
            where: {
                id,
                role: "ADMIN",
            },
            data: {
                fullName,
                position,
            },
        });
        if (!updateAdmin) {
            throw new HttpError_1.default("Failed to update data", 500);
        }
        return {
            success: true,
            data: "Admin updated successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.name, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.updateAdminData = updateAdminData;
//getAdminAuditor
const fetchAdminAuditor = async (params) => {
    try {
        const { id, page, search, limit } = params;
        const filters = {};
        const searchFilter = [];
        if (id) {
            filters.id = parseInt(id);
        }
        if (search) {
            searchFilter.push({ emailId: { contains: search, mode: "insensitive" } }, { fullName: { contains: search, mode: "insensitive" } }, { position: { contains: search, mode: "insensitive" } }
            // { role: { contains: search, mode: "insensitive" } }
            );
        }
        const fetchedData = await prisma_1.default.dashboardUser.findMany({
            where: {
                ...filters,
                AND: [
                    { OR: [{ role: "ADMIN" }, { role: "AUDITOR" }] },
                    ...(searchFilter.length > 0 ? [{ OR: searchFilter }] : []),
                ],
            },
            select: {
                id: true,
                fullName: true,
                emailId: true,
                role: true,
                position: true,
                createdAt: true,
            },
            skip: page
                ? (parseInt(page) - 1) * parseInt(limit)
                : 0,
            take: limit ? parseInt(limit) : 500,
        });
        if (!fetchedData) {
            throw new HttpError_1.default("No data found", 404);
        }
        const totalRecords = fetchedData.length;
        return {
            success: true,
            data: fetchedData,
            totalRecords: totalRecords,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.fetchAdminAuditor = fetchAdminAuditor;
//deleteAdminAuditor
const deleteAdminAuditors = async (params) => {
    try {
        let adminAuditorId = [];
        const id = params.id;
        if (!id) {
            throw new HttpError_1.default("provide the id of the user to be deleted", 400);
        }
        if (!Array.isArray(id)) {
            adminAuditorId = id.split(",").map((item) => {
                return parseInt(item);
            });
        }
        const fetchedData = await prisma_1.default.dashboardUser.findMany({
            where: {
                id: {
                    in: adminAuditorId,
                },
                OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
            },
        });
        if (!fetchedData.length) {
            throw new HttpError_1.default("No data found", 404);
        }
        const deletedData = await prisma_1.default.dashboardUser.deleteMany({
            where: {
                id: {
                    in: adminAuditorId,
                },
                OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
            },
        });
        if (!deletedData || deletedData.count == 0) {
            throw new HttpError_1.default("could not delete the user", 500);
        }
        return {
            success: true,
            data: "Admin/Auditor deleted successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.deleteAdminAuditors = deleteAdminAuditors;
//getDashboardData
const getSuperAdminDashboardData = async () => {
    try {
        const AllData = {};
        const totalUsers = await prisma_1.default.users.count({});
        if (!totalUsers)
            throw new HttpError_1.default("No data found", 404);
        // const activeUsersDaily
        const [totalMale, totalFemale, otherGender] = await Promise.all([
            prisma_1.default.users.count({
                where: {
                    gender: "male",
                },
            }),
            prisma_1.default.users.count({
                where: {
                    gender: "female",
                },
            }),
            prisma_1.default.users.count({
                where: {
                    gender: "other",
                },
            }),
        ]);
        const currentDate = new Date(Date.now());
        const oneDayAgo = new Date(currentDate);
        oneDayAgo.setDate(currentDate.getDate() - 1);
        const oneWeekAgo = new Date(currentDate);
        oneWeekAgo.setDate(currentDate.getDate() - 7);
        const oneMonthAgo = new Date(currentDate);
        oneMonthAgo.setDate(currentDate.getDate() - 30);
        // const [activeUsersDaily, activeUsersWeekly, activeUsersMonthly] =
        //   await Promise.all([
        //     prisma.activeUsers.count({
        //       where: {
        //         timeStamp: {
        //           gte: oneDayAgo,
        //           lte: currentDate,
        //         },
        //       },
        //     }),
        //     prisma.activeUsers.count({
        //       where: {
        //         timeStamp: {
        //           gte: oneWeekAgo,
        //           lte: currentDate,
        //         },
        //       },
        //     }),
        //     prisma.activeUsers.count({
        //       where: {
        //         timeStamp: {
        //           gte: oneMonthAgo,
        //           lte: currentDate,
        //         },
        //       },
        //     }),
        //   ]);
        const [inActiveUsersMonthly, activeUsersMonthly] = await Promise.all([
            prisma_1.default.users.count({
                where: {
                    currentSessionId: null,
                    activeUsers: {
                        timeStamp: {
                            lt: oneMonthAgo,
                        },
                    },
                },
            }),
            prisma_1.default.activeUsers.count({
                where: {
                    timeStamp: {
                        gte: oneMonthAgo,
                        lte: currentDate,
                    },
                },
            }),
        ]);
        AllData.totalUsers = totalUsers;
        AllData.totalMale = totalMale;
        AllData.totalFemale = totalFemale;
        AllData.otherGender = otherGender;
        AllData.monthlyinActiveUsers = inActiveUsersMonthly;
        // AllData.activeUsersDaily = activeUsersDaily;
        // AllData.weeklyActiveUser = activeUsersWeekly;
        AllData.monthlyActiveUser = activeUsersMonthly;
        return {
            success: true,
            data: AllData,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getSuperAdminDashboardData = getSuperAdminDashboardData;
//USER Mutations
//Edit User by id
//update user by id - other
const adminUpdateUserById = async (data, userId) => {
    try {
        if (!data || !userId)
            throw new HttpError_1.default("Required Data missing", 400);
        const { phoneNumber, emailId, gender, dob, address, pincode, emergencyContact, bloodGroup, presentDiseases, allergies, doctorFullName, docAddress, docPhoneNumber, additionalInformation, } = data;
        const findUser = await (0, auth_services_1.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found!", 404);
        const updateUser = await prisma_1.default.users.update({
            where: {
                id: userId,
            },
            data: {
                phoneNumber,
                emailId,
                gender,
                dob,
                address,
                pincode,
                emergencyContact,
                isSync: false,
                healthRecord: {
                    update: {
                        bloodGroup,
                        presentDiseases,
                        allergies,
                        doctorFullName,
                        docAddress,
                        docPhoneNumber,
                        additionalInformation,
                    },
                },
            },
        });
        if (!updateUser)
            throw new HttpError_1.default("Could Not update User Data", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const returnData = {
            success: true,
            id: updateUser.id,
            message: "User Data was updated successfully",
        };
        return returnData;
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.adminUpdateUserById = adminUpdateUserById;
//# sourceMappingURL=admin.auth.service.js.map