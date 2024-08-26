"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserFunctionality = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const uploadFile_1 = require("./aws/uploadFile");
const DateTimeFormatters_1 = require("./DateTimeFormatters");
const HttpError_1 = __importDefault(require("./HttpError"));
const createUserFunctionality = async (data) => {
    try {
        const { id, dob, consent, gender, address, pincode, emergencyContact, bloodGroup, presentDiseases, allergies, doctorFullName, docAddress, docPhoneNumber, additionalInformation, createdBy, profileImage, language, appLock, deviceToken, } = data;
        //existing user and device token match
        const existing_user = await prisma_1.default.users.findFirst({
            where: {
                id: id.toLowerCase(),
            },
        });
        if (existing_user) {
            throw new HttpError_1.default(`user  ${id}  already exist`, 422); // user already exist throw error
        }
        const verifiedUser = await prisma_1.default.verifiedUsers.findFirst({
            where: {
                userId: id.toLowerCase(),
                isVerified: true,
            },
        });
        if (!verifiedUser)
            throw new HttpError_1.default("User not verified, please generate the otp", 404);
        let verifiedContactId;
        const phoneNumber = verifiedUser?.phoneNumber
            ? verifiedUser.phoneNumber
            : data.phoneNumber == ""
                ? null
                : data.phoneNumber;
        const emailId = verifiedUser?.emailId
            ? verifiedUser.emailId
            : data.emailId == ""
                ? null
                : data.emailId;
        if (verifiedUser?.phoneNumber) {
            verifiedContactId = "phoneNumber";
        }
        else {
            verifiedContactId = "emailId";
        }
        if (verifiedContactId == "emailId" &&
            data.emailId &&
            data.emailId.toLowerCase() != verifiedUser.emailId)
            throw new HttpError_1.default("Verified email not matching entered email", 401);
        if (verifiedContactId == "phoneNumber" &&
            data.phoneNumber &&
            data.phoneNumber != verifiedUser.phoneNumber)
            throw new HttpError_1.default("Verified phone number not matching entered phone number", 401);
        const formattedDob = (0, DateTimeFormatters_1.formatDateForDB)(dob);
        //add profile image
        let profileURL;
        if (profileImage) {
            profileURL = await (0, uploadFile_1.uploadProfile)({
                profileImage: profileImage,
                userId: id.toLowerCase(),
            });
            if (!profileURL?.success)
                throw new HttpError_1.default("Could not upload profile Image to S3", 502);
        }
        let newUser = await prisma_1.default.users.create({
            data: {
                id: id.toLowerCase(),
                fullName: verifiedUser.fullName,
                phoneNumber: phoneNumber,
                emailId: emailId ? emailId.toLowerCase() : undefined,
                password: verifiedUser.hashedPassword,
                consent,
                gender,
                dob: formattedDob,
                address,
                pincode,
                emergencyContact,
                country: verifiedUser.country,
                createdBy,
                subscription: true,
                verifiedContactId,
                profileImage: profileURL?.Location ?? null,
                deviceToken,
            },
        });
        await prisma_1.default.usersSetting.create({
            data: {
                user: {
                    connect: {
                        id: newUser.id,
                    },
                },
                language,
                appLock,
            },
        });
        if (!newUser)
            throw new HttpError_1.default("Could Not create New User", 500);
        const healthRecord = await prisma_1.default.healthRecord.create({
            data: {
                bloodGroup,
                presentDiseases,
                allergies,
                doctorFullName,
                docAddress,
                docPhoneNumber,
                additionalInformation,
                user: { connect: { id: newUser.id } },
            },
        });
        if (!healthRecord)
            throw new HttpError_1.default("Could Not store health records", 500);
        return {
            success: true,
            ...newUser,
            healthRecord: healthRecord,
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
exports.createUserFunctionality = createUserFunctionality;
//# sourceMappingURL=CreateUserFunction.js.map