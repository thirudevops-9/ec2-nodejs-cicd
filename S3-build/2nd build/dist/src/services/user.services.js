"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByUniqueData = exports.unblockUser = exports.blockUserWithReason = exports.addUserMessage = exports.getUserSyncedData = exports.getHomePageData = exports.removeUserById = exports.changeContactOtpVerify = exports.newUserContactDetails = exports.verifyUserPassword = exports.updateUserSetting = exports.getUserSetting = exports.editUserById = exports.getUserDataById = exports.getAllAppUsers = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const generateOTP_1 = require("../utility/generateOTP");
const emailService_1 = require("../utility/emailService");
const verifyOTP_1 = require("../utility/verifyOTP");
const sendOtp_1 = require("../utility/sendOtp");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const deleteFolder_1 = require("../utility/aws/deleteFolder");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const ValidateNewContact_1 = require("../utility/ValidateNewContact");
const familyMemberData_1 = require("../utility/familyMemberData");
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const SyncedData_1 = require("../utility/SyncedData");
const vitals_services_1 = require("./vitals.services");
const familyLinkData_1 = require("../utility/familyLinkData");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const contentManagement_services_1 = require("./contentManagement.services");
const userTemplates_1 = require("../templates/userTemplates");
const uploadFile_1 = require("../utility/aws/uploadFile");
const DashboardTemplates_1 = require("../templates/DashboardTemplates");
const BlockUserRemainingTime_1 = require("../utility/BlockUserRemainingTime");
//!admin operation only
const getAllAppUsers = async (queryParams) => {
    try {
        const { page, limit } = queryParams;
        const userFilter = [];
        const depFilter = [];
        const { search } = queryParams;
        const genderValues = ["male", "female", "other"]; // Enum values
        if (search &&
            genderValues.includes(search.toLocaleLowerCase())) {
            userFilter.push({ gender: { equals: search.toLowerCase() } });
            depFilter.push({ gender: { equals: search.toLowerCase() } });
        }
        if (search) {
            userFilter.push({ id: { contains: search, mode: "insensitive" } }, {
                [client_1.verifiedContactId.emailId]: {
                    contains: search,
                    mode: "insensitive",
                },
            }, {
                [client_1.verifiedContactId.phoneNumber]: {
                    contains: search,
                    mode: "insensitive",
                },
            }, { fullName: { contains: search, mode: "insensitive" } }, { country: { contains: search, mode: "insensitive" } }, { pincode: { contains: search, mode: "insensitive" } });
        }
        if (search) {
            depFilter.push({ id: { contains: search, mode: "insensitive" } }, {
                user: {
                    [client_1.verifiedContactId.emailId]: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            }, {
                user: {
                    [client_1.verifiedContactId.phoneNumber]: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            }, { fullName: { contains: search, mode: "insensitive" } }, {
                user: {
                    country: { contains: search, mode: "insensitive" },
                },
            }, { pincode: { contains: search, mode: "insensitive" } });
        }
        // const filters: any = {};
        // if (fullName) {
        //   filters.fullName = fullName;
        // }
        // if (id) {
        //   filters.id = id;
        // }
        const [users, dependants] = await Promise.all([
            prisma_1.default.users.findMany({
                where: userFilter.length > 0 ? { OR: userFilter } : {},
                orderBy: {
                    createdAt: "desc",
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit)
                    : 0,
                take: limit ? parseInt(limit) : 500,
                include: {
                    healthRecord: true,
                },
            }),
            prisma_1.default.dependant.findMany({
                where: depFilter.length > 0 ? { OR: depFilter } : {},
                orderBy: {
                    createdAt: "desc",
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit)
                    : 0,
                take: limit ? parseInt(limit) : 500,
                include: {
                    healthRecord: true,
                },
            }),
        ]);
        const userData = users.map((user) => ({ ...user, type: "user" }));
        const dependantData = dependants.map((dependant) => {
            return {
                ...dependant,
                verifiedContactId: null,
                type: "minor",
            };
        });
        // Combine and sort the data by createdAt field
        const combinedData = [...userData, ...dependantData]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit ? parseInt(limit) : 500);
        const totalRecords = (await prisma_1.default.users.count({})) + (await prisma_1.default.dependant.count({}));
        // if (!allUserData) throw new HTTPError("Could Not fetch Users List", 404);
        return {
            success: true,
            data: combinedData,
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
exports.getAllAppUsers = getAllAppUsers;
//get user by id
const getUserDataById = async (userId, type) => {
    try {
        let data = {};
        if (type === "minor") {
            const userData = await prisma_1.default.dependant.findFirst({
                where: {
                    id: { equals: userId, mode: "insensitive" },
                },
                include: {
                    healthRecord: true,
                },
            });
            if (!userData)
                throw new HttpError_1.default("Could Not fetch Users List", 404);
            const createdBy = await prisma_1.default.users.findFirst({
                where: {
                    id: { equals: userData.userId, mode: "insensitive" },
                },
                include: {
                    setting: true,
                },
            });
            if (!createdBy)
                throw new HttpError_1.default("created by user does not exist", 404);
            const memberData = await prisma_1.default.familylinks.findFirst({
                where: {
                    linkFrom: userData.userId.toLowerCase(),
                    linkTo: userId.toLowerCase(),
                    linkType: "minor",
                },
            });
            if (!memberData)
                throw new HttpError_1.default("User is not a member of this family", 404);
            data = {
                id: userData.id.toLowerCase(),
                name: userData.fullName,
                profileImage: userData.profileImage,
                verifiedContact: createdBy.verifiedContactId,
                emailId: userData.emailId ? userData.emailId.toLowerCase() : null,
                phoneNumber: userData.phoneNumber,
                gender: userData.gender,
                bloodType: userData.healthRecord?.bloodGroup,
                account: {
                    createdAt: userData.createdAt,
                    language: createdBy.setting?.language,
                    createdBy: userData.userId,
                    isBlocked: false,
                    subscription: createdBy.subscription,
                },
                healthRecords: {
                    familyDoctorName: userData.healthRecord?.doctorFullName,
                    doctorAddress: userData.healthRecord?.docAddress,
                    disease: userData.healthRecord?.presentDiseases,
                    allergies: userData.healthRecord?.allergies,
                },
                personal: {
                    country: createdBy.country,
                    dob: userData.dob,
                    pincode: userData.pincode,
                    emergencyContact: userData.emergencyContact,
                    address: userData.address,
                },
                family: [
                    {
                        name: createdBy.fullName,
                        id: memberData.linkFrom.toLowerCase(),
                        relation: "guardian",
                        profileImage: createdBy.profileImage,
                        LinkType: null,
                    },
                ],
                additionalInfo: userData.healthRecord?.additionalInformation,
            };
        }
        else if (type === "user") {
            const userData = await prisma_1.default.users.findFirst({
                where: {
                    id: userId.toLowerCase(),
                },
                include: {
                    healthRecord: true,
                    setting: true,
                },
            });
            if (!userData)
                throw new HttpError_1.default("Could Not Find User", 404);
            //get family members
            const getAllFamilyMembers = await prisma_1.default.familylinks.findMany({
                where: {
                    linkFrom: userId.toLowerCase(),
                },
            });
            if (!getAllFamilyMembers)
                throw new HttpError_1.default("Could not fetch family data", 404);
            const memberData = await (0, familyMemberData_1.FamilyMembersData)(getAllFamilyMembers);
            const findMembers = (id) => {
                return (memberData.D7.find((member) => member.id === id) ||
                    memberData.U6.find((member) => member.id === id));
            };
            // Map over the F9 array to get the required family structure
            const family = memberData.F9.map((link) => {
                const member = findMembers(link.linkTo);
                if (!member)
                    return null;
                return {
                    name: member.fullName, // assuming all members have fullName
                    id: member.id,
                    relation: link.relation,
                    profileImage: member.profileImage || null, // assuming profileImage is in all member types
                    linkType: link.linkType,
                };
            }).filter(Boolean);
            data = {
                id: userData.id.toLowerCase(),
                name: userData.fullName,
                profileImage: userData.profileImage,
                verifiedContact: userData.verifiedContactId,
                emailId: userData.emailId ? userData.emailId.toLowerCase() : null,
                phoneNumber: userData.phoneNumber,
                gender: userData.gender,
                bloodType: userData.healthRecord?.bloodGroup,
                account: {
                    createdAt: userData.createdAt,
                    language: userData.setting?.language,
                    createdBy: userData.createdBy,
                    isBlocked: userData.isBlocked,
                    subscription: userData.subscription,
                },
                healthRecords: {
                    familyDoctorName: userData.healthRecord?.doctorFullName,
                    doctorAddress: userData.healthRecord?.docAddress,
                    disease: userData.healthRecord?.presentDiseases,
                    allergies: userData.healthRecord?.allergies,
                },
                personal: {
                    country: userData.country,
                    dob: userData.dob,
                    pincode: userData.pincode,
                    emergencyContact: userData.emergencyContact,
                    address: userData.address,
                },
                family,
                additionalInfo: userData.healthRecord?.additionalInformation,
            };
            const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId.toLowerCase());
            if (!updateActiveSession) {
                throw new HttpError_1.default("Could not update active session", 204);
            }
        }
        return {
            success: true,
            data,
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
exports.getUserDataById = getUserDataById;
//update user by id - other
const editUserById = async (data, userId, queryParams) => {
    try {
        if (!data || !userId)
            throw new HttpError_1.default("Required Data missing", 422);
        const { profileImage, phoneNumber, emailId, gender, dob, address, pincode, emergencyContact, bloodGroup, presentDiseases, allergies, doctorFullName, docAddress, docPhoneNumber, additionalInformation, } = data;
        const { famCareMemberId } = queryParams;
        let updateUser;
        let result;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId.toLowerCase(), famCareMemberId?.toLowerCase());
            if (linkData.accessType === "view" || linkData.linkType !== "minor") {
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            }
            const findMinor = await prisma_1.default.dependant.findFirst({
                where: {
                    id: famCareMemberId?.toLowerCase(),
                },
            });
            if (profileImage) {
                result = await (0, uploadFile_1.uploadProfile)({
                    profileImage: profileImage,
                    userId: famCareMemberId?.toLowerCase(),
                });
                if (!result || !result.success)
                    throw new HttpError_1.default("Could not upload profile to s3", 502);
            }
            updateUser = await prisma_1.default.dependant.update({
                where: {
                    id: famCareMemberId?.toLowerCase(),
                },
                data: {
                    phoneNumber: phoneNumber == "" ? null : phoneNumber,
                    emailId: emailId == "" ? null : emailId?.toLowerCase(),
                    gender,
                    dob: dob ? (0, DateTimeFormatters_1.formatDateForDB)(dob) : findMinor?.dob,
                    address,
                    pincode,
                    profileImage: result ? result?.Location : findMinor?.profileImage,
                    emergencyContact,
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
            const healthData = await prisma_1.default.healthRecord.findFirst({
                where: {
                    forDependantId: updateUser.id,
                },
            });
            if (!healthData)
                throw new HttpError_1.default("Could Not fetch updated health data", 404);
            return {
                success: true,
                id: updateUser.id.toLowerCase(),
                message: "User Data was updated successfully",
                D7: updateUser,
                H8: healthData,
            };
        }
        else {
            const findUser = await (0, exports.getUserByUniqueData)(userId);
            if (!findUser)
                throw new HttpError_1.default("User not found!", 404);
            if (profileImage) {
                result = await (0, uploadFile_1.uploadProfile)({
                    profileImage: profileImage,
                    userId,
                });
                if (!result || !result.success)
                    throw new HttpError_1.default("Could not upload profile to s3", 502);
            }
            if ((findUser.verifiedContactId === "emailId" &&
                emailId &&
                emailId != findUser.emailId) ||
                (findUser.verifiedContactId === "emailId" && emailId == "") ||
                (findUser.verifiedContactId === "phoneNumber" &&
                    phoneNumber &&
                    phoneNumber != findUser.phoneNumber) ||
                (findUser.verifiedContactId === "phoneNumber" && phoneNumber == ""))
                throw new HttpError_1.default("Verified Contact is not subject to change", 612);
            updateUser = await prisma_1.default.users.update({
                where: {
                    id: userId.toLowerCase(),
                },
                data: {
                    phoneNumber: phoneNumber == "" ? null : phoneNumber,
                    emailId: emailId == "" ? null : emailId?.toLowerCase(),
                    gender,
                    dob: dob ? (0, DateTimeFormatters_1.formatDateForDB)(dob) : findUser?.dob,
                    address,
                    pincode,
                    emergencyContact,
                    isSync: false,
                    profileImage: result ? result.Location : findUser.profileImage,
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
        }
        if (!updateUser)
            throw new HttpError_1.default("Could Not update User Data", 500);
        const healthData = await prisma_1.default.healthRecord.findFirst({
            where: {
                forUserId: updateUser.id,
            },
        });
        if (!healthData)
            throw new HttpError_1.default("Could Not fetch updated health data", 404);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const { password, refreshToken, ...filteredData } = updateUser;
        return {
            success: true,
            id: updateUser.id.toLowerCase(),
            message: "User Data was updated successfully",
            U6: filteredData,
            H8: healthData,
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
exports.editUserById = editUserById;
//get user settings
const getUserSetting = async (userId) => {
    try {
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User does not exist", 404);
        //2.update user setting data
        const getSettings = await prisma_1.default.usersSetting.findFirst({
            where: {
                forUserid: userId,
            },
            // select: {
            //   notification: true,
            //   appLock: true,
            //   language: true,
            // },
        });
        if (!getSettings)
            throw new HttpError_1.default("Could not fetch user setting", 404);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            settings: getSettings,
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
exports.getUserSetting = getUserSetting;
//update user setting
const updateUserSetting = async (data, userId) => {
    try {
        const { notification, language, appLock } = data;
        //1.check if user exist
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User does not exist", 404);
        //2.update user setting data
        const updateUserSetting = await prisma_1.default.usersSetting.update({
            where: {
                forUserid: userId,
            },
            data: {
                notification,
                language,
                appLock,
            },
        });
        if (!updateUserSetting)
            throw new HttpError_1.default("Could not update user setting", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            updatedSettings: updateUserSetting,
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
exports.updateUserSetting = updateUserSetting;
//Change Verified Contacts
//1. password verify
const verifyUserPassword = async (data) => {
    try {
        const { userId, password } = data;
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found!", 404);
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 403);
        }
        // if (findUser.wrongLoginAttempts === 5) {
        //   throw new HTTPError(
        //     "Maximum login attempts exceeded.Please try again after 30 minutes",
        //     401
        //   );
        // }
        if (!bcrypt_1.default.compareSync(password, findUser.password)) {
            const totalLoginAttempts = await prisma_1.default.users.update({
                where: {
                    id: userId,
                },
                data: {
                    wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
                },
            });
            if (totalLoginAttempts.wrongLoginAttempts >= 5) {
                const updatedData = await prisma_1.default.users.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        isBlocked: true,
                        blockedAt: new Date(),
                    },
                });
                await prisma_1.default.blockReasons.create({
                    data: {
                        blockReason: "auto-block",
                        blockedBy: "app",
                        user: {
                            connect: {
                                id: findUser.id.toLowerCase(),
                            },
                        },
                    },
                });
                if (updatedData.isBlocked == true &&
                    updatedData.blockedAt &&
                    updatedData.wrongLoginAttempts === 5) {
                    const error = await (0, BlockUserRemainingTime_1.remainingTime)(updatedData.blockedAt);
                    throw new HttpError_1.default(JSON.stringify(error), 403);
                }
            }
            const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
            const error = {
                message: `Invalid password .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
                remainingAttempts: remainingAttempts,
                isUserBlocked: false,
            };
            throw new HttpError_1.default(JSON.stringify(error), 401);
        }
        await prisma_1.default.users.update({
            where: {
                id: userId,
            },
            data: {
                wrongLoginAttempts: 0,
            },
        });
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "password verified successfully",
            user: {
                id: userId,
                verifiedContactId: findUser.verifiedContactId,
            },
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
exports.verifyUserPassword = verifyUserPassword;
//2. take new details and generate OTP
const newUserContactDetails = async (data) => {
    try {
        const { id, emailId, phoneNumber } = data;
        const findUser = await (0, exports.getUserByUniqueData)(id);
        if (!findUser)
            throw new HttpError_1.default("User not found!", 404);
        if (findUser.verifiedContactId === "emailId" && phoneNumber) {
            throw new HttpError_1.default("As your old verified contact is emailId,you can only set new emailId and not phoneNumber", 400);
        }
        if (findUser.verifiedContactId === "phoneNumber" && emailId) {
            throw new HttpError_1.default("As your old verified contact is phoneNumber,you can only set new phoneNumber and not emailId", 400);
        }
        if (emailId) {
            const validationResponse = await (0, ValidateNewContact_1.validateContact)(id, "emailId", emailId.toLowerCase());
            if (!validationResponse.success)
                throw new HttpError_1.default(validationResponse.message, 400);
            // generate OTP
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId.toLowerCase(), "15m");
            const response = await (0, emailService_1.ResetPasswordAndChangeContactDetails)(emailId.toLowerCase(), otp, "Change Contact detail in THITO App", userTemplates_1.changeVerifiedContactDetailsOTP, findUser.fullName);
            if (!response)
                throw new HttpError_1.default("could not send mail", 612);
            //add data to temporary storage
            const changeDetailsUser = await prisma_1.default.otpStore.upsert({
                where: {
                    userId_createdBy: {
                        userId: id,
                        createdBy: "self",
                    },
                },
                update: {
                    hashedOTP: hashedotp,
                    emailId: emailId.toLowerCase(),
                },
                create: {
                    userId: id,
                    emailId: emailId.toLowerCase(),
                    hashedOTP: hashedotp,
                },
            });
            if (!changeDetailsUser)
                throw new HttpError_1.default("Could not store OTP in db", 500);
            const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(id);
            if (!updateActiveSession) {
                throw new HttpError_1.default("Could not update active session", 204);
            }
            const returnData = {
                success: true,
                userId: id,
                verifiedContact: emailId,
                verifiedContactId: "emailId",
                message: "OTP sent successfully",
            };
            return returnData;
        }
        else if (phoneNumber) {
            const response = await (0, ValidateNewContact_1.validateContact)(id, "phoneNumber", phoneNumber);
            if (!response.success)
                throw new HttpError_1.default(response.message, 400);
            // generate OTP
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber, "5m");
            const msg = `Dear ${findUser.fullName}, to change your contact number, please enter OTP ${otp}. Do not share the OTP. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            if (!responseOtp)
                throw new HttpError_1.default("Could not send OTP ", 612);
            //add data to temporary storage
            const changeDetailsUser = await prisma_1.default.otpStore.upsert({
                where: {
                    userId_createdBy: {
                        userId: id,
                        createdBy: "self",
                    },
                },
                update: {
                    hashedOTP: hashedotp,
                    phoneNumber,
                },
                create: {
                    userId: id,
                    phoneNumber,
                    hashedOTP: hashedotp,
                },
            });
            if (!changeDetailsUser)
                throw new HttpError_1.default("Could not store OTP in db", 500);
            const returnData = {
                success: true,
                userId: id,
                verifiedContact: phoneNumber,
                verifiedContactId: "phoneNumber",
                message: "OTP sent successfully",
            };
            return returnData;
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
exports.newUserContactDetails = newUserContactDetails;
//3. verify otp and change details
const changeContactOtpVerify = async (data) => {
    try {
        const { userId, verifiedContact, verifiedContactId, otp } = data;
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found", 404);
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 403);
        }
        // if (findUser.wrongLoginAttempts === 5) {
        //   throw new HTTPError(
        //     "Maximum login attempts exceeded.Please try again after 30 minutes",
        //     401
        //   );
        // }
        //get hashed otp
        const findContactChangesUser = await prisma_1.default.otpStore.findUnique({
            where: {
                userId_createdBy: {
                    userId,
                    createdBy: "self",
                },
            },
            select: {
                hashedOTP: true,
                emailId: true,
                phoneNumber: true,
            },
        });
        if (!findContactChangesUser)
            throw new HttpError_1.default("Cannot find User to change contact details", 404);
        if (findContactChangesUser) {
        }
        const hashedotp = findContactChangesUser.hashedOTP;
        const verifyOTP_response = await (0, verifyOTP_1.verifyOTP)(hashedotp, otp, verifiedContact);
        if (!verifyOTP_response) {
            const totalLoginAttempts = await prisma_1.default.users.update({
                where: {
                    id: userId,
                },
                data: {
                    wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
                },
            });
            if (totalLoginAttempts.wrongLoginAttempts >= 5) {
                const updatedData = await prisma_1.default.users.update({
                    where: {
                        id: userId,
                    },
                    data: {
                        isBlocked: true,
                        blockedAt: new Date(),
                    },
                });
                await prisma_1.default.blockReasons.create({
                    data: {
                        blockReason: "auto-block",
                        blockedBy: "app",
                        user: {
                            connect: {
                                id: userId.toLowerCase(),
                            },
                        },
                    },
                });
                if (updatedData.isBlocked == true &&
                    updatedData.blockedAt &&
                    updatedData.wrongLoginAttempts === 5) {
                    const error = await (0, BlockUserRemainingTime_1.remainingTime)(updatedData.blockedAt);
                    throw new HttpError_1.default(JSON.stringify(error), 403);
                }
            }
            const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
            const error = {
                message: `Invalid password .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
                remainingAttempts: remainingAttempts,
                isUserBlocked: false,
            };
            throw new HttpError_1.default(JSON.stringify(error), 401);
        }
        //update user contact details
        const changeDetails = await prisma_1.default.users.update({
            data: {
                [verifiedContactId]: verifiedContact,
                verifiedContactId: verifiedContactId,
            },
            where: {
                id: findUser.id,
            },
        });
        if (!changeDetails)
            throw new HttpError_1.default("Could not update user data", 500);
        //delete data from OTP store
        await prisma_1.default.otpStore.delete({
            where: {
                userId_createdBy: {
                    userId,
                    createdBy: "self",
                },
            },
        });
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        await prisma_1.default.users.update({
            where: {
                id: userId,
            },
            data: {
                wrongLoginAttempts: 0,
            },
        });
        const { password, refreshToken, ...filteredData } = changeDetails;
        return {
            success: true,
            message: "contact details were changed successfully",
            U6: filteredData,
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
exports.changeContactOtpVerify = changeContactOtpVerify;
//delete user -self
const removeUserById = async (userId, deleteData) => {
    try {
        const { reason, role } = deleteData;
        let { email } = deleteData;
        //find user
        const userData = await prisma_1.default.users.findFirst({
            where: {
                id: userId.toLowerCase(),
            },
        });
        if (!userData)
            throw new HttpError_1.default("User Not Found", 404);
        if (email === "") {
            email =
                userData.verifiedContactId === "emailId"
                    ? userData.emailId
                    : userData.phoneNumber;
        }
        //1. reason to delete the user
        const createReason = await prisma_1.default.deleteAccountReasons.create({
            data: {
                reason,
                role,
                deletedby: email,
            },
        });
        if (!createReason)
            throw new HttpError_1.default("Could not create reason", 500);
        //2. delete user S3 folder
        const result = await (0, deleteFolder_1.deleteFolderFromS3)(userId.toLowerCase());
        if (!result)
            throw new HttpError_1.default(" Could not delete s3 folder", 502);
        //3.1 Store all deleting family links in syncChanges table
        const findLinks = await prisma_1.default.familylinks.findMany({
            where: {
                OR: [
                    {
                        linkFrom: userId.toLowerCase(),
                    },
                ],
            },
        });
        findLinks.map(async (link) => {
            const changeHistory = await prisma_1.default.syncChanges.create({
                data: {
                    userChanged: userId,
                    changedBy: userId,
                    changeType: "DELETE",
                    table: "F9",
                    recordId: link.id,
                    familyMember: link.linkTo,
                },
            });
            if (!changeHistory)
                throw new HttpError_1.default("Could not track change", 204);
        });
        //3. Delete all family Links
        const deleteFamily = await prisma_1.default.familylinks.deleteMany({
            where: {
                OR: [
                    {
                        linkFrom: userId.toLowerCase(),
                    },
                    {
                        linkTo: userId.toLowerCase(),
                    },
                ],
            },
        });
        if (!deleteFamily)
            throw new HttpError_1.default("Could not delete family links", 500);
        //4. delete the user permanently
        const deleteUser = await prisma_1.default.users.delete({
            where: {
                id: userId.toLowerCase(),
            },
        });
        if (!deleteUser)
            throw new HttpError_1.default("Could Not delete User", 500);
        return {
            success: true,
            message: `User with id ${deleteUser.id} successfully deleted`,
            id: deleteUser.id,
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
exports.removeUserById = removeUserById;
const getHomePageData = async (user, { famCareMemberId }) => {
    try {
        let HomePageData;
        if (famCareMemberId) {
            const response = await (0, familyMemberData_1.getMemberDataById)(user, famCareMemberId?.toLowerCase());
            if (response.success)
                HomePageData = response.HomePageData;
        }
        else {
            const userData = await prisma_1.default.users.findFirst({
                where: {
                    id: user.id,
                },
                include: {
                    healthRecord: true,
                    notes: true,
                    appointment: {
                        where: {
                            apptDate: { gte: new Date() }, // Upcoming appointments
                        },
                        orderBy: { apptDate: "asc" },
                        take: 4,
                    },
                    //TODO: logic fix
                    medicine: {
                        where: {
                            startAt: { gte: new Date() }, // Upcoming medicines
                            isActive: true,
                        },
                        orderBy: { startAt: "asc" },
                        take: 4,
                    },
                },
            });
            if (!userData)
                throw new HttpError_1.default("Could Not Find User", 404);
            const { refreshToken, password, healthRecord, notes, appointment, medicine, ...filteredData } = userData;
            // // Combine and sort appointments and medicines
            // const upcomingEvents: any = [];
            // if (userData?.appointment?.length) {
            //   userData.appointment.forEach((appointment) =>
            //     upcomingEvents.push(appointment)
            //   );
            // }
            // if (userData?.medicine?.length) {
            //   userData.medicine.forEach((medicine) => upcomingEvents.push(medicine));
            // }
            // upcomingEvents.sort((event1: any, event2: any) => {
            //   // Sort by date (ascending)
            //   const dateComparison =
            //     event1.apptDate?.getDate() - event2.apptDate?.getDate() || 0;
            //   if (dateComparison !== 0) {
            //     return dateComparison;
            //   }
            //   // If dates are equal, sort by time (ascending)
            //   if (event1.startAt && event2.startAt) {
            //     return event1.startAt.getTime() - event2.startAt.getTime();
            //   } else if (event1.startAt) {
            //     return (
            //       event1.startAt.getTime() - (event2.apptDate?.getTime() || Infinity)
            //     );
            //   } else {
            //     return (
            //       (event2.startAt?.getTime() || Infinity) - event1.apptDate?.getTime()
            //     );
            //   }
            // });
            //get family members
            const getAllFamilyMembers = await prisma_1.default.familylinks.findMany({
                where: {
                    linkFrom: user.id,
                },
            });
            const [memberData, selfAwareness, advertisements] = await Promise.all([
                (0, familyMemberData_1.FamilyMembersData)(getAllFamilyMembers),
                (0, vitals_services_1.getUserVitalModules)(user, {}),
                (0, contentManagement_services_1.getAllAdvertisements)(user, {}),
            ]);
            //get notification count
            const notifCount = await prisma_1.default.notifications.count({
                where: {
                    userId: user.id,
                    readStatus: false,
                },
            });
            HomePageData = {
                U6: filteredData,
                H8: userData.healthRecord,
                A12: advertisements.advertisements,
                A1: appointment.slice(0, 5),
                M3: medicine.slice(0, 5),
                selfAwareness: selfAwareness.V5,
                family: memberData,
                N4: userData.notes,
                unreadNotification: notifCount,
            };
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            HomePageData,
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
exports.getHomePageData = getHomePageData;
//syncing changes
const getUserSyncedData = async (user, { lastSyncDate, famCareMemberId }) => {
    try {
        let updatedData;
        if (famCareMemberId) {
            //1. get all distinct records
            const distinctRecords = await prisma_1.default.syncChanges.findMany({
                where: {
                    userChanged: famCareMemberId?.toLowerCase(),
                    familyMember: user.id,
                    synced: false,
                },
                orderBy: {
                    createdAt: "desc",
                },
                distinct: ["table", "changeType", "userChanged", "familyMember"],
            });
            updatedData = await (0, SyncedData_1.getUpdatedData)(distinctRecords);
            if (!updatedData)
                throw new HttpError_1.default("Could not fetch updated data", 404);
            if (updatedData.success) {
                const linkSync = await prisma_1.default.familylinks.updateMany({
                    where: {
                        linkTo: famCareMemberId?.toLowerCase(),
                        linkFrom: user.id,
                    },
                    data: {
                        synced: true,
                    },
                });
                const syncTrue = await prisma_1.default.syncChanges.updateMany({
                    where: {
                        userChanged: famCareMemberId?.toLowerCase(),
                        familyMember: user.id,
                    },
                    data: {
                        synced: true,
                    },
                });
                if (!syncTrue || !linkSync)
                    throw new HttpError_1.default("Could not update sync flag for family member", 500);
            }
        }
        else {
            const filters = {};
            if (lastSyncDate) {
                filters.createdAt = { gte: (0, DateTimeFormatters_1.formatDateForDB)(lastSyncDate) };
            }
            // get all distinct changes
            const distinctRecords = await prisma_1.default.syncChanges.findMany({
                where: {
                    AND: [filters],
                    OR: [
                        {
                            userChanged: user.id,
                            familyMember: user.id,
                            synced: false,
                        },
                        {
                            changeType: "DELETE",
                            table: "F9",
                            familyMember: user.id,
                            synced: false,
                        },
                    ],
                },
                orderBy: {
                    createdAt: "desc",
                },
                distinct: ["table", "changeType", "recordId"],
            });
            updatedData = await (0, SyncedData_1.getUpdatedData)(distinctRecords);
            if (!updatedData)
                throw new HttpError_1.default("Could not fetch updated data", 500);
            if (updatedData.success) {
                const linkSync = await prisma_1.default.syncChanges.updateMany({
                    where: {
                        userChanged: user.id,
                        familyMember: user.id,
                    },
                    data: {
                        synced: true,
                    },
                });
                const syncTrue = await prisma_1.default.users.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        isSync: true,
                    },
                });
                if (!syncTrue || !linkSync)
                    throw new HttpError_1.default("Could not update sync flag for logged in user", 500);
            }
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            lastSyncDate: new Date(),
            Data: updatedData.Data,
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
exports.getUserSyncedData = getUserSyncedData;
//user feedback & complaint
const addUserMessage = async (userId, data) => {
    try {
        const { message, type, emailId } = data;
        const date = new Date(Date.now());
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Adding 1 since getMonth() returns 0-11
        const day = date.getDate().toString().padStart(2, "0");
        let complaintId = null;
        if (type === "complaint") {
            // const randomString = crypto.randomBytes(2).toString("hex");
            // console.log(randomString);
            const randomNumber = Math.floor(1000 + Math.random() * 9000);
            complaintId = BigInt(year + month + day + randomNumber);
            console.log(complaintId);
        }
        //1.add complaint
        const addMessage = await prisma_1.default.userMessage.create({
            data: {
                message,
                emailId: emailId ? emailId.toLowerCase() : null,
                messageType: type,
                complaintId,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
            include: {
                user: true,
            },
        });
        if (!addMessage)
            throw new HttpError_1.default("Could not record message from user", 500);
        //2.send mail
        if (type === "complaint") {
            console.log("i am in");
            console.log(addMessage.emailId);
            const sendReplyToUser = await (0, emailService_1.ComplaintReplyEmail)({
                emailId: addMessage.emailId ? addMessage.emailId : "",
                user_complaintId: complaintId, //TODO
                name: addMessage.user?.fullName,
            }, DashboardTemplates_1.AutocomplaintReply);
            if (!sendReplyToUser) {
                throw new HttpError_1.default("Could not send reply to user", 612);
            }
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const returnData = {
            success: true,
            message: `${addMessage.messageType} was recorded successfully.`,
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
exports.addUserMessage = addUserMessage;
//block user
const blockUserWithReason = async (data, admin) => {
    try {
        if (!data)
            throw new HttpError_1.default("Required Data missing", 422);
        const { userId, reason } = data;
        //1. find User
        const findUser = await prisma_1.default.users.findFirst({
            where: {
                id: userId.toLowerCase(),
            },
        });
        if (!findUser)
            throw new HttpError_1.default("User to block not found", 404);
        //2. Record reason for block
        const recordBlock = await prisma_1.default.blockReasons.create({
            data: {
                blockReason: reason,
                blockedBy: admin.emailId,
                user: {
                    connect: {
                        id: userId.toLowerCase(),
                    },
                },
            },
        });
        if (!recordBlock)
            throw new HttpError_1.default("Reason for blocakge could not be recorded", 500);
        //3. Block User
        const blockUser = await prisma_1.default.users.update({
            where: {
                id: userId.toLowerCase(),
            },
            data: {
                isBlocked: true,
                blockedAt: new Date(),
            },
        });
        if (!blockUser)
            throw new HttpError_1.default("Could not block user", 500);
        const returnData = {
            success: true,
            message: `User ${userId} has been blocked due to ${reason}`,
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
exports.blockUserWithReason = blockUserWithReason;
//un-block user
const unblockUser = async (userId) => {
    try {
        if (!userId)
            throw new HttpError_1.default("Required Data missing", 422);
        //1. find User
        const findUser = await prisma_1.default.users.findFirst({
            where: {
                id: userId.toLowerCase(),
            },
        });
        if (!findUser)
            throw new HttpError_1.default("User to un-block not found", 404);
        //check if user is blocked
        const findUnblock = await prisma_1.default.users.findFirst({
            where: {
                id: userId.toLowerCase(),
                isBlocked: true,
            },
        });
        if (!findUnblock)
            throw new HttpError_1.default(`User with  ${userId} is not blocked`, 500);
        //2. Un-Block User
        const unblock = await prisma_1.default.users.update({
            where: {
                id: userId.toLowerCase(),
            },
            data: {
                isBlocked: false,
            },
        });
        if (!unblock)
            throw new HttpError_1.default("Could not un-block user", 500);
        const returnData = {
            success: true,
            message: `User ${userId} has been un-blocked by super-admin`,
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
exports.unblockUser = unblockUser;
//Helper Function
const getUserByUniqueData = async (userId) => {
    return await prisma_1.default.users.findFirst({
        where: {
            OR: [
                {
                    emailId: {
                        equals: userId,
                        mode: "insensitive",
                    },
                },
                { id: { equals: userId, mode: "insensitive" } },
                { phoneNumber: userId },
            ],
        },
    });
};
exports.getUserByUniqueData = getUserByUniqueData;
//# sourceMappingURL=user.services.js.map