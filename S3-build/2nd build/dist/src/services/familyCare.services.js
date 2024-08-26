"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateDependantToUser = exports.releaseMinorGenerateOTP = exports.UnlinkFamilyMember = exports.verifyCreateExistingUser = exports.generateOtpExistingAccount = exports.createNewUserFamilyCare = exports.EditFamilyAccess = exports.getFamilyMembers = exports.createNewDependant = exports.checkSubsriptionStatus = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const familyLinkData_1 = require("../utility/familyLinkData");
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const UserId_1 = require("../utility/UserId");
const CreateUserFunction_1 = require("../utility/CreateUserFunction");
const createFolder_1 = require("../utility/aws/createFolder");
const emailService_1 = require("../utility/emailService");
const auth_services_1 = require("./auth.services");
const generateOTP_1 = require("../utility/generateOTP");
const sendOtp_1 = require("../utility/sendOtp");
const verifyOTP_1 = require("../utility/verifyOTP");
const familyMemberData_1 = require("../utility/familyMemberData");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const userTemplates_1 = require("../templates/userTemplates");
const notification_1 = require("../utility/notification");
const data_1 = require("../constants/data");
const uploadFile_1 = require("../utility/aws/uploadFile");
const checkSubsriptionStatus = async (data) => {
    try {
        if (!data) {
            throw new HttpError_1.default("Unauthorised", 401);
        }
        //check subscription count
        const aggregations = await prisma_1.default.familylinks.count({
            where: {
                linkFrom: data.id,
            },
        });
        if (data.subscription == true && aggregations > 5)
            throw new HttpError_1.default("You cannot add new members to your family care with current plan", 601);
        else if (data.subscription == false && aggregations > 2)
            throw new HttpError_1.default("You cannot add new members to your family care with free plan", 601);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(data.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "User can add a new member to family care",
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
exports.checkSubsriptionStatus = checkSubsriptionStatus;
const createNewDependant = async (data, user) => {
    try {
        const { fullName, 
        // declaration,
        gender, dob, address, pincode, emergencyContact, bloodGroup, relation, presentDiseases, allergies, doctorFullName, docAddress, docPhoneNumber, additionalInformation, profileImage, } = data;
        //check if adding is possible:
        await (0, exports.checkSubsriptionStatus)(user);
        const id = (0, UserId_1.generateUserId)();
        let profileURL;
        if (profileImage) {
            profileURL = await (0, uploadFile_1.uploadProfile)({
                profileImage: profileImage,
                userId: id.toLowerCase(),
            });
            if (!profileURL?.success)
                throw new HttpError_1.default("Could not upload profile Image to S3", 502);
        }
        //add user to dependant
        const formattedDob = (0, DateTimeFormatters_1.formatDateForDB)(dob);
        const newDependant = await prisma_1.default.dependant.create({
            data: {
                id: id.toLowerCase(),
                fullName,
                phoneNumber: user.phoneNumber,
                emailId: user.emailId,
                // declaration,
                gender,
                dob: formattedDob,
                address,
                pincode,
                emergencyContact,
                user: { connect: { id: user.id } },
                profileImage: profileURL?.Location,
            },
        });
        if (!newDependant)
            throw new HttpError_1.default("Could Not create New Dependant", 500);
        const healthRecord = await prisma_1.default.healthRecord.create({
            data: {
                bloodGroup,
                presentDiseases,
                allergies,
                doctorFullName,
                docAddress,
                docPhoneNumber,
                additionalInformation,
                dependant: { connect: { id: newDependant.id } },
            },
        });
        if (!healthRecord)
            throw new HttpError_1.default("Could Not store health records", 500);
        //add link to family links table
        const addLink = await prisma_1.default.familylinks.create({
            data: {
                linkFrom: user.id,
                linkTo: newDependant.id,
                accessType: "manage",
                relation,
                linkType: "minor",
                sensitiveDataAccess: true,
            },
        });
        if (!addLink)
            throw new HttpError_1.default("Could Not Add the family link", 500);
        //create s3 folder for user
        (0, createFolder_1.createS3Folder)(newDependant.id.toLowerCase());
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: `Successfully added new dependant under user ${user.id}`,
            D7: newDependant,
            H8: healthRecord,
            F9: addLink,
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
exports.createNewDependant = createNewDependant;
const getFamilyMembers = async (userId, queryParams) => {
    try {
        const { accessType, linkType, relation } = queryParams;
        const filters = {};
        if (accessType) {
            filters.accessType = accessType;
        }
        if (linkType) {
            filters.linkType = linkType;
        }
        if (relation) {
            filters.relation = {
                contains: relation,
                mode: "insensitive",
            };
        }
        const getAllFamilyMembers = await prisma_1.default.familylinks.findMany({
            where: {
                AND: [filters],
                linkFrom: userId,
                // linkTo:userId
            },
        });
        if (!getAllFamilyMembers)
            throw new HttpError_1.default("Could not fetch family data", 500);
        const getAllDetails = await prisma_1.default.familylinks.findMany({
            where: {
                AND: [filters],
                OR: [
                    { linkFrom: userId },
                    { linkTo: userId }
                ]
            },
        });
        if (!getAllDetails)
            throw new HttpError_1.default("Could not fetch family data", 500);
        const memberData = await (0, familyMemberData_1.FamilyMembersData)(getAllFamilyMembers);
        memberData.F9 = getAllDetails;
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            family: memberData,
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
exports.getFamilyMembers = getFamilyMembers;
const EditFamilyAccess = async (user, data) => {
    try {
        const { memberId, access, sensitiveAccess } = data;
        //link from
        const linkFrom = await prisma_1.default.users.findFirst({
            where: {
                id: user.id.toLowerCase(),
            },
        });
        if (!linkFrom) {
            throw new HttpError_1.default("user not found", 404);
        }
        const findUser = await prisma_1.default.users.findFirst({
            where: {
                id: memberId.toLowerCase(),
            },
            select: {
                deviceToken: true,
                currentSessionId: true,
                refreshToken: true,
                setting: {
                    select: {
                        notification: true,
                    },
                },
                fullName: true,
            },
        });
        if (!findUser) {
            throw new HttpError_1.default("user not found", 404);
        }
        const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, memberId.toLowerCase());
        if (!linkData)
            throw new HttpError_1.default("Could not fetch family member linking data", 500);
        if (linkData.linkType == "minor" && access == "view")
            throw new HttpError_1.default("Cannot change access type of a minor's account to view-only. To do so, you will have to detach the account", 401);
        const oldAccessType = linkData.accessType;
        const changedAccess = await prisma_1.default.familylinks.updateMany({
            where: {
                linkFrom: user.id.toLowerCase(),
                linkTo: memberId.toLowerCase(),
            },
            data: {
                accessType: access,
                sensitiveDataAccess: sensitiveAccess,
            },
        });
        if (!changedAccess)
            throw new HttpError_1.default("Could not update access/sensitive access of account", 500);
        const updatedFamilyLinkData = await prisma_1.default.familylinks.findFirst({
            where: {
                linkFrom: user.id.toLowerCase(),
                linkTo: memberId.toLowerCase(),
            },
        });
        if (oldAccessType !== access) {
            const notifContent = `${linkFrom.fullName} changed the access from ${oldAccessType} to ${access}`;
            const storeNotification = await (0, notification_1.notificationStore)(memberId.toLowerCase(), notifContent, data_1.redirectLink);
            if (!storeNotification) {
                throw new HttpError_1.default("could not store notification", 204);
            }
            if (findUser &&
                findUser.deviceToken &&
                (findUser.currentSessionId != null ||
                    findUser.currentSessionId != "") &&
                (findUser.refreshToken != null || findUser.refreshToken != "") &&
                findUser.setting?.notification === true) {
                await (0, notification_1.sendNotificationFamilyCare)(findUser, notifContent, data_1.redirectLink, storeNotification.id);
            }
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "Access of this account has been changed successfully",
            F9: updatedFamilyLinkData,
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
            throw new HttpError_1.default(error, 500);
        }
    }
};
exports.EditFamilyAccess = EditFamilyAccess;
const createNewUserFamilyCare = async (data) => {
    try {
        const { id, emailId, relation, linkFromUserid } = data;
        data.createdBy = linkFromUserid.toLowerCase();
        const findUser = await prisma_1.default.users.findUnique({
            where: {
                id: linkFromUserid.toLowerCase(),
            },
            select: {
                setting: true,
                fullName: true,
            },
        });
        if (!findUser) {
            throw new HttpError_1.default("User not found", 404);
        }
        data.language = findUser.setting?.language;
        const result = await (0, CreateUserFunction_1.createUserFunctionality)(data);
        const { password, refreshToken, healthRecord, ...filteredData } = result;
        if (result.success != true) {
            throw new HttpError_1.default("error creation record of user", 204);
        }
        const familyData = await prisma_1.default.familylinks.createMany({
            data: [
                {
                    linkFrom: linkFromUserid.toLowerCase(),
                    linkTo: id.toLowerCase(),
                    relation: relation,
                    linkType: "subaccount",
                    accessType: "manage",
                },
                {
                    linkFrom: id.toLowerCase(),
                    linkTo: linkFromUserid.toLowerCase(),
                    relation: (await (0, familyLinkData_1.deduceRelation)(relation, linkFromUserid.toLowerCase())),
                    linkType: "subaccount",
                },
            ],
        });
        if (!familyData) {
            throw new HttpError_1.default("db error: could not link the user", 500);
        }
        const family = await prisma_1.default.familylinks.findMany({
            where: {
                OR: [
                    {
                        linkFrom: linkFromUserid.toLowerCase(),
                        linkTo: id.toLowerCase(),
                    },
                    {
                        linkFrom: id.toLowerCase(),
                        linkTo: linkFromUserid.toLowerCase(),
                    },
                ],
            },
        });
        //inform user of successfull onboarding
        // if (emailId) {
        //   OTPmailService(
        //     emailId,
        //     id.toLowerCase(),
        //     "Successful registration in THITO App",
        //     userId_information
        //   );
        // }
        if (result.emailId && result.verifiedContactId == "emailId") {
            (0, emailService_1.ResetPasswordAndChangeContactDetails)(result.emailId.toLowerCase(), id.toLowerCase(), //id
            "Successful registration in THITO App", userTemplates_1.userId_information, result.fullName);
        }
        else if (result.phoneNumber &&
            result.verifiedContactId == "phoneNumber") {
            const msg = `Dear ${result.fullName}, welcome to THITO. Your User ID is ${id.toLowerCase()}. You can use it for login. Stay updated with your health data. -STEIGEN HEALTHCARE`;
            (0, sendOtp_1.sendOtpToMobile)(result.phoneNumber, msg);
        }
        //create s3 folder for user
        (0, createFolder_1.createS3Folder)(result.id.toLowerCase());
        //remove data from temp storage
        const delTempData = await prisma_1.default.verifiedUsers.delete({
            where: {
                userId: result.id.toLowerCase(),
            },
        });
        if (!delTempData) {
            throw new HttpError_1.default("db error: could not delete temp data", 500);
        }
        const notifContent = `Congratulations on connecting your profile with ${findUser.fullName}.`;
        const storeNotification = await (0, notification_1.notificationStore)(result.id.toLowerCase(), notifContent, data_1.redirectLink, linkFromUserid.toLowerCase(), findUser.fullName);
        if (storeNotification.success !== true) {
            throw new HttpError_1.default("could not store notification", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "Successfully added new user",
            U6: filteredData,
            H8: result.healthRecord,
            F9: family,
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
            throw new HttpError_1.default(error, 500);
        }
    }
};
exports.createNewUserFamilyCare = createNewUserFamilyCare;
const generateOtpExistingAccount = async (data) => {
    try {
        const { uuid, linkFromUserName, relation, userData } = data;
        //check if adding is allowed
        await (0, exports.checkSubsriptionStatus)(userData);
        //check if uuid is not the logged in user itself
        if (userData.id === uuid) {
            throw new HttpError_1.default("Cannot add yourself as family member", 607);
        }
        //get user
        const user = await (0, auth_services_1.getUserByUniqueData)(uuid.toLowerCase());
        if (!user) {
            throw new HttpError_1.default("User not found", 404);
        }
        //check if user is already linked with the other user
        const { phoneNumber, emailId } = user;
        // const find_existing_link = await familyLink(linkFromUserId, uuid);
        const find_existing_link = await prisma_1.default.familylinks.findFirst({
            where: {
                linkFrom: userData.id.toLowerCase(),
                linkTo: uuid.toLowerCase(),
            },
        });
        if (find_existing_link) {
            throw new HttpError_1.default("You already have access to the user account you are trying to link with.", 422);
        }
        //send otp
        let otp, hashedotp = "";
        if (emailId && user.verifiedContactId === "emailId") {
            ({ otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId + relation, "15m"));
            const responseOtp = await (0, emailService_1.OTPFamilyCare)(emailId.toLowerCase(), linkFromUserName.toLowerCase(), user.fullName, otp, "Attaching your profile in family care of THITO App", userTemplates_1.otp_verification_existing_user);
            if (!responseOtp)
                throw new HttpError_1.default("could not send otp", 612);
        }
        else if (phoneNumber && user.verifiedContactId == "phoneNumber") {
            ({ otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber + relation, "5m")); //89898989898friend
            const msg = `${linkFromUserName} has requested to attach your profile with his/her profile, OTP for the same is ${otp}. Sharing the OTP to proceed is considered as consent to attach your profile. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            console.log("OTP SEND TO MOBILE NO", phoneNumber, "otp", otp);
            if (!responseOtp)
                throw new HttpError_1.default("could not send otp", 612);
        }
        console.log("OTP:::", otp);
        //upsert data in otp store
        const otpStore = await prisma_1.default.otpStore.upsert({
            where: {
                userId_createdBy: {
                    userId: uuid.toLowerCase(),
                    createdBy: userData.id.toLowerCase(),
                },
            },
            update: {
                hashedOTP: hashedotp,
                phoneNumber,
                emailId: emailId ? emailId.toLowerCase() : null,
                createdBy: userData.id.toLowerCase(),
            },
            create: {
                userId: uuid.toLowerCase(),
                hashedOTP: hashedotp,
                phoneNumber,
                emailId: emailId ? emailId.toLowerCase() : null,
                createdBy: userData.id,
            },
        });
        if (!otpStore) {
            throw new HttpError_1.default("db error:could not store otp for the user", 500);
        }
        let response = {
            success: true,
            relation: relation,
            message: "otp send to user successfully",
            verifiedContactId: user.verifiedContactId,
            verifiedContact: user.verifiedContactId === "emailId" ? user.emailId : user.phoneNumber,
            uuid: user.id,
        };
        // if (user.verifiedContactId === "emailId") {
        //   response.emailId = emailId?.toLowerCase();
        // } else {
        //   response.phoneNumber = phoneNumber;
        // }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(uuid.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return response;
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error, 500);
        }
    }
};
exports.generateOtpExistingAccount = generateOtpExistingAccount;
const verifyCreateExistingUser = async (data) => {
    try {
        //data fetching
        const { uuid, otp, relation, linkFromUserId } = data;
        const findUser = await prisma_1.default.users.findFirst({
            where: {
                id: uuid.toLowerCase(),
            },
            include: {
                healthRecord: true,
                setting: true,
            },
        });
        if (!findUser) {
            throw new HttpError_1.default("user you are trying to link to does not exist", 404);
        }
        const linkFrom = await prisma_1.default.users.findFirst({
            where: {
                id: linkFromUserId.toLowerCase(),
            },
        });
        if (!linkFrom) {
            throw new HttpError_1.default("user you are trying to link from does not exist", 404);
        }
        const user_otp = await prisma_1.default.otpStore.findFirst({
            where: {
                userId: uuid.toLowerCase(),
                createdBy: linkFromUserId.toLowerCase(),
            },
        });
        if (!user_otp) {
            throw new HttpError_1.default("db error:Could not fetch otp for user", 500);
        }
        const userId = (user_otp.emailId ? user_otp.emailId.toLowerCase() : user_otp.phoneNumber);
        //verify otp
        const otp_verification = await (0, verifyOTP_1.verifyOTP)(user_otp.hashedOTP, otp, userId + relation);
        if (!otp_verification) {
            throw new HttpError_1.default("Invalid OTP", 401);
        }
        //delete otp data
        await prisma_1.default.otpStore.delete({
            where: {
                userId_createdBy: {
                    userId: uuid.toLowerCase(),
                    createdBy: linkFromUserId.toLowerCase(),
                },
            },
        });
        //get user records
        // const UserData = await prisma.users.findFirst({
        //   where: {
        //     id: uuid.toLowerCase(),
        //   },
        //   include: {
        //     healthRecord: true,
        //   },
        // });
        // if (!UserData) throw new HTTPError("Could not fetch User data", 500);
        const { refreshToken, healthRecord, deviceToken, password, currentSessionId, ...filteredData } = findUser;
        //link family
        const family_linking = await prisma_1.default.familylinks.createMany({
            data: [
                {
                    linkFrom: linkFromUserId.toLowerCase(),
                    linkTo: uuid.toLowerCase(),
                    relation,
                    linkType: "existing",
                },
                {
                    linkFrom: uuid.toLowerCase(),
                    linkTo: linkFromUserId.toLowerCase(),
                    relation: (await (0, familyLinkData_1.deduceRelation)(relation, linkFromUserId)),
                    linkType: "existing",
                },
            ],
        });
        if (!family_linking) {
            throw new HttpError_1.default("family linking failed", 500);
        }
        const family = await prisma_1.default.familylinks.findMany({
            where: {
                OR: [
                    {
                        linkFrom: linkFromUserId.toLowerCase(),
                        linkTo: uuid.toLowerCase(),
                    },
                    {
                        linkFrom: uuid.toLowerCase(),
                        linkTo: linkFromUserId.toLowerCase(),
                    },
                ],
            },
        });
        //store notification
        const notifContent = `Congratulations on connecting your profile with ${linkFrom.fullName}.`;
        const storeNotification = await (0, notification_1.notificationStore)(uuid.toLowerCase(), notifContent, data_1.redirectLink, linkFrom.id, linkFrom.fullName);
        if (storeNotification.success !== true) {
            throw new HttpError_1.default("could not store notification", 204);
        }
        //send notification
        if (findUser &&
            findUser.deviceToken &&
            (findUser.currentSessionId != null || findUser.currentSessionId != "") &&
            (findUser.refreshToken != null || findUser.refreshToken != "") &&
            findUser.setting?.notification === true) {
            console.log("in1111");
            const sendNotification = await (0, notification_1.sendNotificationFamilyCare)(findUser, notifContent, data_1.redirectLink, storeNotification.id);
            console.log("send", sendNotification);
            if (!sendNotification) {
                throw new HttpError_1.default("notification could not be send", 502);
            }
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(uuid.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        //return
        return {
            success: true,
            message: "Congratulation! user linked successfully",
            U6: filteredData,
            H8: healthRecord,
            F9: family,
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
            throw new HttpError_1.default(error, 500);
        }
    }
};
exports.verifyCreateExistingUser = verifyCreateExistingUser;
const UnlinkFamilyMember = async (id, famCareMemberId) => {
    try {
        //link to
        const findUser = await prisma_1.default.users.findFirst({
            where: {
                id: famCareMemberId.toLowerCase(),
            },
            select: {
                deviceToken: true,
                currentSessionId: true,
                refreshToken: true,
                setting: {
                    select: {
                        notification: true,
                    },
                },
                fullName: true,
            },
        });
        if (!findUser) {
            throw new HttpError_1.default("user not found", 404);
        }
        //link from
        const linkFrom = await prisma_1.default.users.findFirst({
            where: {
                id: id.toLowerCase(),
            },
        });
        if (!linkFrom) {
            throw new HttpError_1.default("user not found", 404);
        }
        const { linkData } = await (0, familyLinkData_1.familyLink)(id.toLowerCase(), famCareMemberId.toLowerCase());
        if (!linkData)
            throw new HttpError_1.default("Could not fetch family member linking data", 500);
        // const detachLink = await prisma.familylinks.delete({
        //   where: {
        //     id: linkData.id,
        //   },
        // });
        const detachLink = await prisma_1.default.familylinks.deleteMany({
            where: {
                OR: [
                    { id: linkData.id },
                    {
                        linkFrom: id.toLowerCase(),
                        linkTo: famCareMemberId.toLowerCase(),
                    },
                    {
                        linkFrom: famCareMemberId.toLowerCase(),
                        linkTo: id.toLowerCase(),
                    },
                ],
            },
        });
        if (!detachLink)
            throw new HttpError_1.default("Could not detach account", 500);
        //store  notification
        const notifContent = `Your profile has successfully disconnected with ${linkFrom.fullName}`;
        const storeNotification = await (0, notification_1.notificationStore)(famCareMemberId.toLowerCase(), notifContent, data_1.redirectLink);
        if (storeNotification.success != true) {
            throw new HttpError_1.default("could not store notification", 204);
        }
        if (findUser &&
            findUser.deviceToken &&
            (findUser.currentSessionId != null || findUser.currentSessionId != "") &&
            (findUser.refreshToken != null || findUser.refreshToken != "") &&
            findUser.setting?.notification === true) {
            console.log("in1111");
            await (0, notification_1.sendNotificationFamilyCare)(findUser, notifContent, data_1.redirectLink, storeNotification.id);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: `The user ${linkData.linkTo} has been successfully detached from family care of user ${id}`,
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
exports.UnlinkFamilyMember = UnlinkFamilyMember;
const releaseMinorGenerateOTP = async (user, data) => {
    try {
        const { id, phoneNumber, emailId } = data;
        const dependantName = await prisma_1.default.dependant.findFirst({
            where: {
                id: id.toLowerCase(),
            },
        });
        if (!dependantName) {
            throw new HttpError_1.default("Dependant not found", 404);
        }
        const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, id.toLowerCase());
        if (linkData.linkType !== "minor")
            throw new HttpError_1.default("Entered uuid is not a minor", 612);
        if (phoneNumber) {
            const findUser = await (0, auth_services_1.getUserByUniqueData)(phoneNumber);
            if (findUser)
                throw new HttpError_1.default("User with this phone number already exists", 422);
            // generate OTP
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber, "5m");
            const msg = `Your profile is getting detached from the ${user.fullName} account, and to create new profile please share the OTP ${otp}. Sharing the OTP to proceed is considered as consent to detach your profile. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            if (!responseOtp)
                throw new HttpError_1.default("Could not send OTP", 612);
            //add data to temporary storage
            const changeDetailsUser = await prisma_1.default.otpStore.upsert({
                where: {
                    userId_createdBy: {
                        userId: id.toLowerCase(),
                        createdBy: user.id,
                    },
                },
                update: {
                    hashedOTP: hashedotp,
                    phoneNumber,
                },
                create: {
                    userId: id.toLowerCase(),
                    createdBy: user.id,
                    phoneNumber,
                    hashedOTP: hashedotp,
                },
            });
            if (!changeDetailsUser)
                throw new HttpError_1.default("Could not store OTP in store", 500);
        }
        else if (emailId) {
            const findUser = await (0, auth_services_1.getUserByUniqueData)(emailId.toLowerCase());
            if (findUser)
                throw new HttpError_1.default("User with this email already exists", 422);
            // generate OTP
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId.toLowerCase(), "15m");
            const responseOtp = await (0, emailService_1.OTPFamilyCare)(emailId.toLowerCase(), user.fullName, dependantName?.fullName, //user
            otp, "OTP for detaching your profile in THITO App", userTemplates_1.releaseMinorAccount);
            if (!responseOtp)
                throw new HttpError_1.default("could not send otp", 612);
            //add data to temporary storage
            const changeDetailsUser = await prisma_1.default.otpStore.upsert({
                where: {
                    userId_createdBy: {
                        userId: id.toLowerCase(),
                        createdBy: user.id,
                    },
                },
                update: {
                    hashedOTP: hashedotp,
                    emailId: emailId.toLowerCase(),
                },
                create: {
                    userId: id.toLowerCase(),
                    createdBy: user.id,
                    emailId: emailId.toLowerCase(),
                    hashedOTP: hashedotp,
                },
            });
            if (!changeDetailsUser)
                throw new HttpError_1.default("Could not store OTP in store", 500);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const returnData = {
            success: true,
            minor_account_id: id.toLowerCase(),
            verifiedContactId: emailId ? "emailId" : "phoneNumber",
            verifiedContact: emailId ? emailId.toLowerCase() : phoneNumber,
            message: "OTP sent successfully",
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
exports.releaseMinorGenerateOTP = releaseMinorGenerateOTP;
const migrateDependantToUser = async (user, data) => {
    try {
        const { userId, verifiedContact, otp } = data;
        // Step 1: Fetch the dependant's data
        const dependant = await prisma_1.default.dependant.findUnique({
            where: { id: userId.toLowerCase() },
        });
        if (!dependant) {
            throw new HttpError_1.default(`Dependant with ID ${userId.toLowerCase()} not found`, 404);
        }
        //fetch user data
        const userData = await prisma_1.default.users.findFirst({
            where: {
                id: user.id,
            },
        });
        if (!userData)
            throw new HttpError_1.default("Parent user does not exist for minor", 404);
        //get hashed otp
        const findContactChangesUser = await prisma_1.default.otpStore.findUnique({
            where: {
                userId_createdBy: {
                    userId: userId.toLowerCase(),
                    createdBy: user.id,
                },
            },
            select: {
                hashedOTP: true,
                emailId: true,
                phoneNumber: true,
            },
        });
        if (!findContactChangesUser)
            throw new HttpError_1.default("Cannot find User details", 404);
        //check if user entered correct values
        if ((findContactChangesUser.emailId &&
            findContactChangesUser.emailId != verifiedContact) ||
            (findContactChangesUser.phoneNumber &&
                findContactChangesUser.phoneNumber != verifiedContact))
            throw new HttpError_1.default("Entered Verified contact is incorrect", 401);
        const hashedotp = findContactChangesUser.hashedOTP;
        const verifyOTP_response = await (0, verifyOTP_1.verifyOTP)(hashedotp, otp, findContactChangesUser.emailId
            ? verifiedContact.toLowerCase()
            : verifiedContact);
        if (!verifyOTP_response)
            throw new HttpError_1.default("Invalid OTP", 401);
        // Step 2: Create a new user with the dependant's data
        const verifiedContactType = findContactChangesUser.emailId
            ? "emailId"
            : "phoneNumber";
        const newUser = await prisma_1.default.users.create({
            data: {
                id: dependant.id,
                fullName: dependant.fullName,
                phoneNumber: findContactChangesUser.phoneNumber,
                verifiedContactId: verifiedContactType,
                password: "dummy",
                isMigrated: true,
                gender: dependant.gender,
                dob: dependant.dob,
                address: dependant.address,
                pincode: dependant.pincode,
                emergencyContact: dependant.emergencyContact,
                profileImage: dependant.profileImage,
                QRCodeURL: dependant.QRCodeURL,
                isBlocked: false,
                // isLoggedIn: dependant.isLoggedIn,
                emailId: findContactChangesUser.emailId,
                createdBy: user.id, // or any relevant identifier
                country: userData.country, // Use the country from the dependant's user
            },
        });
        const updateData = { forUserId: newUser.id, forDependantId: null };
        // Step 3: Update related records to reference the new user
        await Promise.all([
            prisma_1.default.appointment.updateMany({
                where: { forDependantId: userId.toLowerCase() },
                data: updateData,
            }),
            prisma_1.default.documents.updateMany({
                where: { forDependantId: userId.toLowerCase() },
                data: updateData,
            }),
            prisma_1.default.healthRecord.updateMany({
                where: { forDependantId: userId.toLowerCase() },
                data: updateData,
            }),
            prisma_1.default.medicine.updateMany({
                where: { forDependantId: userId.toLowerCase() },
                data: updateData,
            }),
            prisma_1.default.notes.updateMany({
                where: { forDependantId: userId.toLowerCase() },
                data: updateData,
            }),
            prisma_1.default.vitalsUserData.updateMany({
                where: { forDependantId: userId.toLowerCase() },
                data: updateData,
            }),
            prisma_1.default.usersSetting.create({
                data: {
                    forUserid: userId.toLowerCase(),
                    language: "english",
                    notification: false,
                    appLock: false,
                },
            }),
        ]);
        if (newUser.emailId && newUser.verifiedContactId == "emailId") {
            (0, emailService_1.ResetPasswordAndChangeContactDetails)(newUser.emailId.toLowerCase(), newUser.id.toLowerCase(), "Successful registration in THITO App", userTemplates_1.userId_information, newUser.fullName);
        }
        else if (newUser.phoneNumber &&
            newUser.verifiedContactId == "phoneNumber") {
            const msg = `Dear ${newUser.fullName}, welcome to THITO. Your User ID is ${newUser.id.toLowerCase()}. You can use it for login. Stay updated with your health data. -STEIGEN HEALTHCARE`;
            (0, sendOtp_1.sendOtpToMobile)(newUser.phoneNumber, msg);
        }
        // Step 4: Delete the original dependant record and record from OTP store
        const deleteOTPStoreRecord = await prisma_1.default.otpStore.delete({
            where: {
                userId_createdBy: {
                    userId: userId.toLowerCase(),
                    createdBy: user.id,
                },
            },
        });
        if (!deleteOTPStoreRecord)
            throw new HttpError_1.default("could not remove record from OTP Store", 500);
        const deleteDependant = await prisma_1.default.dependant.delete({
            where: { id: userId.toLowerCase() },
        });
        if (!deleteDependant)
            throw new HttpError_1.default("could not remove dependant from table", 500);
        //step 5: Unlink minor from guardian's account
        const delLink = await prisma_1.default.familylinks.deleteMany({
            where: {
                linkFrom: user.id,
                linkTo: dependant.id,
            },
        });
        if (!delLink)
            throw new HttpError_1.default("could not remove minor from user's family care", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: `Dependant with ID ${userId.toLowerCase()} has been migrated to user`,
            U6: newUser,
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
exports.migrateDependantToUser = migrateDependantToUser;
//# sourceMappingURL=familyCare.services.js.map