"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserByUniqueData = exports.generateUserRefreshToken = exports.resetPassword = exports.forgotPasswordVerifyOtp = exports.forgotPasswordGenerateOtp = exports.userLogout = exports.otpLoginVerify = exports.otpLoginGenerate = exports.passwordLogin = exports.checkUserSession = exports.createNewUser = exports.resendOtp = exports.verifiedOtpRegistration = exports.generatedOtpRegistration = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const generateOTP_1 = require("../utility/generateOTP");
const UserId_1 = require("../utility/UserId");
const emailService_1 = require("../utility/emailService");
const verifyOTP_1 = require("../utility/verifyOTP");
const bcrypt_1 = __importDefault(require("bcrypt"));
const sendOtp_1 = require("../utility/sendOtp");
const dotenv_1 = __importDefault(require("dotenv"));
const createFolder_1 = require("../utility/aws/createFolder");
dotenv_1.default.config();
const Tokens_1 = require("../utility/Tokens");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const CreateUserFunction_1 = require("../utility/CreateUserFunction");
const crypto_1 = __importDefault(require("crypto"));
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const userTemplates_1 = require("../templates/userTemplates");
const BlockUserRemainingTime_1 = require("../utility/BlockUserRemainingTime");
//Registration
const generatedOtpRegistration = async (data) => {
    try {
        const { fullName, phoneNumber, password, emailId, country } = data;
        if (!fullName || !password || (!emailId && !phoneNumber) || !country) {
            throw new HttpError_1.default("Please provide all required fields", 400);
        }
        //hash password
        const salt = bcrypt_1.default.genSaltSync(10);
        const hashedPassword = bcrypt_1.default.hashSync(password, salt);
        // send otp using email id
        if (emailId && !phoneNumber) {
            const email = emailId.toLowerCase();
            const existing_user = await prisma_1.default.users.findFirst({
                where: {
                    emailId: {
                        equals: emailId,
                        mode: "insensitive",
                    },
                },
            });
            if (existing_user) {
                throw new HttpError_1.default(`user with ${email} already exist`, 422); // user already exist throw error
            }
            else {
                //generate OTP
                const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(email, "2h");
                const response = await (0, emailService_1.OTPmailService)(email, otp, "OTP for registration in THITO App", userTemplates_1.createUserOtpVerification);
                if (!response)
                    throw new HttpError_1.default("could not send otp to user", 612);
                //add data to temporary storage
                // const generatedId = generateUserId() as string;
                const UnverifiedUser = await prisma_1.default.verifiedUsers.upsert({
                    where: {
                        emailId: email,
                    },
                    update: {
                        fullName,
                        emailId: email,
                        hashedPassword,
                        hashedOTP: hashedotp,
                        isVerified: false,
                        country,
                    },
                    create: {
                        userId: (0, UserId_1.generateUserId)(),
                        fullName,
                        emailId: email,
                        hashedPassword,
                        hashedOTP: hashedotp,
                        country,
                    },
                });
                if (!UnverifiedUser)
                    throw new HttpError_1.default("Could not store data of user", 500);
                const returnData = {
                    success: true,
                    id: UnverifiedUser.userId,
                    verified: UnverifiedUser.isVerified,
                    message: "OTP sent successfully",
                    verifiedContact: emailId,
                    verifiedContactId: "emailId",
                };
                return returnData;
            }
        }
        else {
            const existing_user = await prisma_1.default.users.findFirst({
                where: {
                    phoneNumber,
                },
            });
            if (existing_user) {
                throw new HttpError_1.default(`user with ${phoneNumber} already exist`, 422);
            }
            //generate OTP
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber, "2h");
            const msg = `To create new profile on THITO, OTP is ${otp}, it is valid for 2 hours. Please click
https://tinyxxxxxxxxxxx to read and accept the terms. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            if (!responseOtp)
                throw new HttpError_1.default("could not send otp to user", 612);
            const UnverifiedUser = await prisma_1.default.verifiedUsers.upsert({
                where: {
                    phoneNumber,
                },
                update: {
                    fullName,
                    phoneNumber,
                    hashedPassword,
                    hashedOTP: hashedotp,
                    isVerified: false,
                    country,
                },
                create: {
                    userId: (0, UserId_1.generateUserId)(),
                    fullName,
                    phoneNumber,
                    hashedPassword,
                    hashedOTP: hashedotp,
                    country,
                },
            });
            if (!UnverifiedUser)
                throw new HttpError_1.default("Could not store data of user", 500);
            const returnData = {
                success: true,
                id: UnverifiedUser.userId,
                verified: UnverifiedUser.isVerified,
                message: "OTP sent successfully",
                verifiedContact: phoneNumber,
                verifiedContactId: "phoneNumber",
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
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.generatedOtpRegistration = generatedOtpRegistration;
//verify otp
const verifiedOtpRegistration = async (data) => {
    try {
        const { id, otp, consent } = data;
        if (consent === false) {
            throw new HttpError_1.default("User did not give consent", 600);
        }
        const findUnverifiedUser = await prisma_1.default.verifiedUsers.findFirst({
            where: {
                userId: {
                    equals: id.toLocaleLowerCase(),
                    mode: "insensitive",
                },
            },
        });
        if (!findUnverifiedUser)
            throw new HttpError_1.default("User not found", 404);
        if (findUnverifiedUser.isVerified === true) {
            await prisma_1.default.verifiedUsers.update({
                where: {
                    id: findUnverifiedUser.id,
                },
                data: {
                    isVerified: false,
                    hashedOTP: "not_verified",
                },
            });
            throw new HttpError_1.default("Invalid otp, please regenerate", 400);
        }
        const registration_id = findUnverifiedUser.emailId
            ? findUnverifiedUser.emailId
            : findUnverifiedUser.phoneNumber;
        const verifyOTP_response = await (0, verifyOTP_1.verifyOTP)(findUnverifiedUser.hashedOTP, otp, registration_id);
        if (!verifyOTP_response)
            throw new HttpError_1.default("Invalid OTP", 400);
        const verifiedUser = await prisma_1.default.verifiedUsers.update({
            where: {
                id: findUnverifiedUser.id,
            },
            data: {
                isVerified: true,
                hashedOTP: "",
            },
        });
        const values = {
            id: verifiedUser.userId.toLowerCase(),
            fullName: verifiedUser.fullName,
            emailId: verifiedUser.emailId ?? undefined,
            phoneNumber: verifiedUser.phoneNumber ?? undefined,
        };
        const otpVerified = {
            success: true,
            user_data: values,
            verified: verifiedUser.isVerified,
            consent: true,
            message: "Congratulations! Your identity is verified",
        };
        return otpVerified;
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.verifiedOtpRegistration = verifiedOtpRegistration;
//resend otp for registration
const resendOtp = async (data) => {
    try {
        const { id } = data;
        const findVerifyUser = await prisma_1.default.verifiedUsers.findFirst({
            where: {
                userId: {
                    equals: id,
                    mode: "insensitive",
                },
            },
        });
        if (!findVerifyUser)
            throw new HttpError_1.default("User Not found,please generate the otp", 404);
        // if (findVerifyUser.isVerified == true)
        //   throw new HTTPError("User already verified", 400);
        const { emailId, phoneNumber } = findVerifyUser;
        if (emailId) {
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId, "2h");
            const response = await (0, emailService_1.OTPmailService)(emailId, otp, "OTP for registration in THITO App", userTemplates_1.createUserOtpVerification);
            if (!response)
                throw new HttpError_1.default("could not send otp to user", 612);
            const UnverifiedUser = await prisma_1.default.verifiedUsers.update({
                where: {
                    emailId,
                },
                data: {
                    hashedOTP: hashedotp,
                    isVerified: false,
                },
            });
            if (!UnverifiedUser)
                throw new HttpError_1.default("Could Not Store new OTP", 500);
            const returnData = {
                success: true,
                id: UnverifiedUser.userId,
                verified: UnverifiedUser.isVerified,
                message: "OTP sent successfully",
            };
            return returnData;
        }
        else if (phoneNumber) {
            const { otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber, "2h");
            const msg = `To create new profile on THITO, OTP is ${otp}, it is valid for 2 hours. Please click https://tinyxxxxxxxxxxx to read and accept the terms. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            if (!responseOtp)
                throw new HttpError_1.default("Could not send OTP to user", 612);
            const UnverifiedUser = await prisma_1.default.verifiedUsers.update({
                where: {
                    phoneNumber,
                },
                data: {
                    hashedOTP: hashedotp,
                    isVerified: false,
                },
            });
            if (!UnverifiedUser)
                throw new HttpError_1.default("Could Not Store new OTP", 500);
            const returnData = {
                success: true,
                id: UnverifiedUser.userId,
                verified: UnverifiedUser.isVerified,
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
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.resendOtp = resendOtp;
//create user
const createNewUser = async (data) => {
    try {
        const { id } = data;
        data.createdBy = "self";
        const result = await (0, CreateUserFunction_1.createUserFunctionality)(data);
        const { password, refreshToken, healthRecord, ...filteredData } = result;
        if (result.emailId && result.verifiedContactId == "emailId") {
            (0, emailService_1.ResetPasswordAndChangeContactDetails)(result.emailId.toLowerCase(), id.toLowerCase(), //id
            "Successful registration in THITO App", userTemplates_1.userId_information, result.fullName);
        }
        else if (result.phoneNumber &&
            result.verifiedContactId == "phoneNumber") {
            const msg = `Dear ${result.fullName}, welcome to THITO. Your User ID is ${id.toLowerCase()}. You can use it for login. Stay updated with your health data. -STEIGEN HEALTHCARE`;
            (0, sendOtp_1.sendOtpToMobile)(result.phoneNumber, msg);
        }
        //remove data from temp storage
        await prisma_1.default.verifiedUsers.delete({
            where: {
                userId: result.id,
            },
        });
        const settings = await prisma_1.default.usersSetting.findUnique({
            where: {
                forUserid: id.toLowerCase(),
            },
            select: {
                language: true,
                notification: true,
                appLock: true,
            },
        });
        //create s3 folder for user
        (0, createFolder_1.createS3Folder)(result.id.toLowerCase());
        //login the user directly after sucessful registeration
        const uniqueSessionId = crypto_1.default.randomBytes(20).toString("hex");
        const { emailId, phoneNumber } = result;
        //generate jwt token
        const userData = {
            id: id.toLowerCase(),
            emailId: emailId ? emailId.toLowerCase() : null,
            phoneNumber,
            currentSessionId: uniqueSessionId,
        };
        //update user status to loggedIn
        const loggedInUser = await prisma_1.default.users.update({
            data: {
                refreshToken: (0, Tokens_1.generateRefreshToken)(userData),
                currentSessionId: uniqueSessionId,
            },
            where: {
                id: id.toLowerCase(),
            },
        });
        if (!loggedInUser)
            throw new HttpError_1.default("DB Error: Could not update user data", 500);
        const updateActiveSession = await (0, changeHistoryTrackFunction_1.trackActiveSession)(id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "Successfully added new user and logged in",
            data: {
                userData: {
                    U6: filteredData,
                    H8: result.healthRecord,
                },
                uniqueKey: crypto_1.default.randomBytes(16).toString("hex"),
                accessToken: (0, Tokens_1.generateAccessToken)(userData),
            },
            settings,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createNewUser = createNewUser;
//check session
const checkUserSession = async (data) => {
    try {
        const { userId, password } = data;
        //check if user exist
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser) {
            throw new HttpError_1.default("could not find user ", 404);
        }
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 603);
        }
        //if minor logging in for the first time
        if (password) {
            if (findUser.password === "dummy" && findUser.isMigrated == true)
                throw new HttpError_1.default("Password is not set. Login Using OTP", 401);
            //check password
            if (!bcrypt_1.default.compareSync(password, findUser.password)) {
                const totalLoginAttempts = await prisma_1.default.users.update({
                    where: {
                        id: findUser.id.toLowerCase(),
                    },
                    data: {
                        wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
                    },
                });
                if (totalLoginAttempts.wrongLoginAttempts >= 5) {
                    const updatedData = await prisma_1.default.users.update({
                        where: {
                            id: findUser.id.toLowerCase(),
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
                        },
                    });
                    if (updatedData.isBlocked == true &&
                        updatedData.blockedAt &&
                        updatedData.wrongLoginAttempts === 5) {
                        const error = await (0, BlockUserRemainingTime_1.remainingTime)(updatedData.blockedAt);
                        throw new HttpError_1.default(JSON.stringify(error), 603);
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
        }
        //check user session
        const isSessionValid = await prisma_1.default.users.findFirst({
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
                NOT: {
                    currentSessionId: null,
                },
            },
        });
        if (isSessionValid) {
            // throw new HTTPError("user already logged in", 412);
            return {
                success: true,
                message: "User Already logged in",
                isLoggedIn: true,
            };
        }
        return {
            success: true,
            message: "You can continue to login",
            isLoggedIn: false,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.checkUserSession = checkUserSession;
//User Login Logic
const passwordLogin = async (data) => {
    try {
        const { userId, password, language, deviceToken } = data;
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found!", 404);
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 603);
        }
        //if minor logging in for the first time
        if (findUser.password === "dummy" && findUser.isMigrated == true)
            throw new HttpError_1.default("Password is not set. Login Using OTP", 401);
        if (!bcrypt_1.default.compareSync(password, findUser.password)) {
            const totalLoginAttempts = await prisma_1.default.users.update({
                where: {
                    id: findUser.id.toLowerCase(),
                },
                data: {
                    wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
                },
            });
            if (totalLoginAttempts.wrongLoginAttempts >= 5) {
                const updatedData = await prisma_1.default.users.update({
                    where: {
                        id: findUser.id.toLowerCase(),
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
                    },
                });
                if (updatedData.isBlocked == true &&
                    updatedData.blockedAt &&
                    updatedData.wrongLoginAttempts === 5) {
                    const error = await (0, BlockUserRemainingTime_1.remainingTime)(updatedData.blockedAt);
                    throw new HttpError_1.default(JSON.stringify(error), 603);
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
        const uniqueSessionId = crypto_1.default.randomBytes(20).toString("hex");
        const { id, emailId, phoneNumber, wrongLoginAttempts } = findUser;
        //generate jwt token
        const userData = {
            id: id.toLowerCase(),
            emailId: emailId ? emailId.toLowerCase() : null,
            phoneNumber,
            currentSessionId: uniqueSessionId,
        };
        const accessToken = (0, Tokens_1.generateAccessToken)(userData);
        const refreshToken = (0, Tokens_1.generateRefreshToken)(userData);
        //update user status to loggedIn
        const loggedInUser = await prisma_1.default.users.update({
            data: {
                refreshToken: refreshToken,
                currentSessionId: uniqueSessionId,
                wrongLoginAttempts: 0,
                deviceToken,
            },
            where: {
                id: findUser.id.toLowerCase(),
            },
            include: {
                healthRecord: true,
            },
        });
        if (!loggedInUser)
            throw new HttpError_1.default("DB Error: Could not update user data", 500);
        const settings = await prisma_1.default.usersSetting.update({
            where: {
                forUserid: findUser.id.toLowerCase(),
            },
            data: {
                language,
            },
            select: {
                language: true,
                notification: true,
                appLock: true,
            },
        });
        if (!settings) {
            throw new HttpError_1.default("could not update settings data", 500);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(findUser.id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const filteredData = {
            id: loggedInUser.id,
            createdAt: loggedInUser.createdAt,
            updatedAt: loggedInUser.updatedAt,
            fullName: loggedInUser.fullName,
            phoneNumber: loggedInUser.phoneNumber,
            emailId: loggedInUser.emailId,
            consent: loggedInUser.consent,
            dob: loggedInUser.dob,
            address: loggedInUser.address,
            pincode: loggedInUser.pincode,
            emergencyContact: loggedInUser.emergencyContact,
            profileImage: loggedInUser.profileImage,
            QRCodeURL: loggedInUser.QRCodeURL,
            isSync: loggedInUser.isSync,
            isBlocked: loggedInUser.isBlocked,
            subscription: loggedInUser.subscription,
            country: loggedInUser.subscription,
            createdBy: loggedInUser.createdBy,
            currentSessionId: loggedInUser.currentSessionId,
            isMigrated: loggedInUser.isMigrated,
            verifiedContactId: loggedInUser.verifiedContactId,
            gender: loggedInUser.gender,
            wrongLoginAttempts: loggedInUser.wrongLoginAttempts,
            blockedAt: loggedInUser.blockedAt,
            deviceToken: loggedInUser.deviceToken,
        };
        return {
            success: true,
            message: "successfully logged In",
            data: {
                userData: {
                    U6: filteredData,
                    H8: loggedInUser.healthRecord,
                },
                uniqueKey: crypto_1.default.randomBytes(16).toString("hex"),
                accessToken,
            },
            settings,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.passwordLogin = passwordLogin;
const otpLoginGenerate = async (data) => {
    try {
        const { userId } = data;
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found", 404);
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 603);
        }
        // if (findUser.isLoggedIn) throw new HTTPError("User already logged in", 400);
        const { phoneNumber, emailId } = findUser;
        let otp, hashedotp = "";
        let verifiedContact;
        //generate OTP
        if (phoneNumber && findUser.verifiedContactId === "phoneNumber") {
            ({ otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber, "5m"));
            console.log(otp); //!remove this later
            verifiedContact = phoneNumber;
            const msg = `Dear ${findUser.fullName}, to Log into the THITO App, please enter OTP ${otp}. DO NOT SHARE THE OTP. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            if (!responseOtp)
                throw new HttpError_1.default("could not send otp", 612);
        }
        else if (emailId && findUser.verifiedContactId === "emailId") {
            ({ otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId.toLowerCase(), "15m"));
            verifiedContact = emailId.toLowerCase();
            const responseOtp = await (0, emailService_1.OTPmailService)(emailId.toLowerCase(), otp, "THITO - OTP for Login", userTemplates_1.loginOTP);
            if (!responseOtp)
                throw new HttpError_1.default("could not send otp", 612);
        }
        await prisma_1.default.otpStore.upsert({
            where: {
                userId_createdBy: {
                    userId: findUser.id.toLowerCase(),
                    createdBy: "self",
                },
            },
            update: {
                hashedOTP: hashedotp,
            },
            create: {
                userId: findUser.id.toLowerCase(),
                phoneNumber,
                emailId: emailId ? emailId.toLocaleLowerCase() : null,
                hashedOTP: hashedotp,
            },
        });
        const returnData = {
            success: true,
            userId: findUser.id.toLowerCase(),
            uniqueKey: crypto_1.default.randomBytes(16).toString("hex"),
            message: "OTP sent successfully",
            verifiedContact,
            verifiedContactId: findUser.verifiedContactId,
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
                throw new HttpError_1.default("Prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.otpLoginGenerate = otpLoginGenerate;
const otpLoginVerify = async (data) => {
    try {
        const { userId, verifiedContact, otp, language, deviceToken } = data;
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found", 404);
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 603);
        }
        //get hashed otp
        const findLoginUser = await prisma_1.default.otpStore.findUnique({
            where: {
                userId_createdBy: {
                    userId: findUser.id.toLowerCase(),
                    createdBy: "self",
                },
            },
        });
        if (!findLoginUser)
            throw new HttpError_1.default("Could not find User to log in", 404);
        if ((findUser.verifiedContactId === "emailId" &&
            findLoginUser.emailId !== verifiedContact) ||
            (findUser.verifiedContactId === "phoneNumber" &&
                findLoginUser.phoneNumber !== verifiedContact))
            throw new HttpError_1.default("Enter Correct verified contact", 401);
        const hashedotp = findLoginUser.hashedOTP;
        const verifyOTP_response = await (0, verifyOTP_1.verifyOTP)(hashedotp, otp, verifiedContact);
        if (!verifyOTP_response) {
            const totalLoginAttempts = await prisma_1.default.users.update({
                where: {
                    id: findUser.id.toLowerCase(),
                },
                data: {
                    wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
                },
            });
            if (totalLoginAttempts.wrongLoginAttempts >= 5) {
                const updatedData = await prisma_1.default.users.update({
                    where: {
                        id: findUser.id.toLowerCase(),
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
                    throw new HttpError_1.default(JSON.stringify(error), 603);
                }
            }
            const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
            const error = {
                message: `Invalid otp .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
                remainingAttempts: remainingAttempts,
                isUserBlocked: false,
            };
            throw new HttpError_1.default(JSON.stringify(error), 401);
        }
        const { id, emailId, phoneNumber } = findUser;
        const currentDate = new Date(Date.now());
        const uniqueSessionId = crypto_1.default.randomBytes(20).toString("hex") + "+" + currentDate;
        const userData = {
            id: id.toLowerCase(),
            emailId: emailId ? emailId.toLowerCase() : null,
            phoneNumber,
            currentSessionId: uniqueSessionId,
        };
        const accessToken = (0, Tokens_1.generateAccessToken)(userData);
        const refreshToken = (0, Tokens_1.generateRefreshToken)(userData);
        //update user status to loggedIn
        const loggedInUser = await prisma_1.default.users.update({
            data: {
                // isLoggedIn: true,
                refreshToken: refreshToken,
                currentSessionId: uniqueSessionId,
                wrongLoginAttempts: 0,
                deviceToken,
            },
            where: {
                id: findUser.id.toLowerCase(),
            },
            include: {
                healthRecord: true,
            },
        });
        if (!loggedInUser)
            throw new HttpError_1.default("Could not update user data", 500);
        //delete data from OTP store
        await prisma_1.default.otpStore.delete({
            where: {
                userId_createdBy: {
                    userId: userId.toLowerCase(),
                    createdBy: "self",
                },
            },
        });
        const settings = await prisma_1.default.usersSetting.update({
            where: {
                forUserid: userId.toLowerCase(),
            },
            data: {
                language,
            },
            select: {
                language: true,
                notification: true,
                appLock: true,
            },
        });
        if (!settings) {
            throw new HttpError_1.default("could not update settings data", 500);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(findUser.id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const filteredData = {
            id: loggedInUser.id,
            createdAt: loggedInUser.createdAt,
            updatedAt: loggedInUser.updatedAt,
            fullName: loggedInUser.fullName,
            phoneNumber: loggedInUser.phoneNumber,
            emailId: loggedInUser.emailId,
            consent: loggedInUser.consent,
            dob: loggedInUser.dob,
            address: loggedInUser.address,
            pincode: loggedInUser.pincode,
            emergencyContact: loggedInUser.emergencyContact,
            profileImage: loggedInUser.profileImage,
            QRCodeURL: loggedInUser.QRCodeURL,
            isSync: loggedInUser.isSync,
            isBlocked: loggedInUser.isBlocked,
            subscription: loggedInUser.subscription,
            country: loggedInUser.subscription,
            createdBy: loggedInUser.createdBy,
            currentSessionId: loggedInUser.currentSessionId,
            isMigrated: loggedInUser.isMigrated,
            verifiedContactId: loggedInUser.verifiedContactId,
            gender: loggedInUser.gender,
            wrongLoginAttempts: loggedInUser.wrongLoginAttempts,
            blockedAt: loggedInUser.blockedAt,
            deviceToken: loggedInUser.deviceToken,
        };
        if (loggedInUser.isMigrated == true && loggedInUser.password === "dummy") {
            return {
                success: true,
                passwordReset: true,
                message: "successfully logged In",
                data: {
                    userData: {
                        U6: filteredData,
                        H8: loggedInUser.healthRecord,
                    },
                    uniqueKey: crypto_1.default.randomBytes(16).toString("hex"),
                    accessToken,
                },
                settings,
            };
        }
        return {
            success: true,
            passwordReset: false,
            message: "successfully logged In",
            data: {
                userData: {
                    U6: filteredData,
                    H8: loggedInUser.healthRecord,
                },
                uniqueKey: crypto_1.default.randomBytes(16).toString("hex"),
                accessToken,
            },
            settings,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.otpLoginVerify = otpLoginVerify;
const userLogout = async (user) => {
    try {
        const { id } = user;
        //logout user
        const updateUser = await prisma_1.default.users.update({
            data: {
                // isLoggedIn: false,
                refreshToken: "",
                currentSessionId: null,
                deviceToken: null,
            },
            where: {
                id: id.toLowerCase(),
            },
        });
        if (!updateUser)
            throw new HttpError_1.default("User not found", 404);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
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
            throw new HttpError_1.default("Internal server error", 500);
        }
    }
};
exports.userLogout = userLogout;
//forgot password logic
const forgotPasswordGenerateOtp = async (userId) => {
    try {
        //find user
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User Does not exist!", 404);
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 603);
        }
        const { phoneNumber, emailId } = findUser;
        let otp, hashedotp = "";
        let verifiedContact;
        //generate OTP
        if (phoneNumber && findUser.verifiedContactId === "phoneNumber") {
            ({ otp, hashedotp } = await (0, generateOTP_1.createOTP)(phoneNumber, "5m"));
            verifiedContact = phoneNumber;
            const msg = `To reset your old password, please enter OTP ${otp}, Do not share the OTP. -STEIGEN HEALTHCARE`;
            const responseOtp = await (0, sendOtp_1.sendOtpToMobile)(phoneNumber, msg);
            if (!responseOtp)
                throw new HttpError_1.default("could not send OTP", 612);
        }
        else if (emailId && findUser.verifiedContactId === "emailId") {
            ({ otp, hashedotp } = await (0, generateOTP_1.createOTP)(emailId.toLowerCase(), "15m"));
            verifiedContact = emailId.toLowerCase();
            const responseOtp = await (0, emailService_1.ResetPasswordAndChangeContactDetails)(emailId.toLowerCase(), otp, "Reset password in THITO App", userTemplates_1.forgotPasswordOtpVerification, findUser.fullName);
            if (!responseOtp)
                throw new HttpError_1.default("could not send email", 612);
        }
        else {
            throw new HttpError_1.default("Email id or phonenumber is not verified", 401);
        }
        //store in temp otp store
        await prisma_1.default.otpStore.upsert({
            where: {
                userId_createdBy: {
                    userId: findUser.id,
                    createdBy: "self",
                },
            },
            update: {
                hashedOTP: hashedotp,
            },
            create: {
                userId: findUser.id.toLowerCase(),
                phoneNumber,
                emailId: emailId ? emailId.toLowerCase() : null,
                hashedOTP: hashedotp,
            },
        });
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(findUser.id.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        const returnData = {
            success: true,
            userId: findUser.id.toLowerCase(),
            verifiedContact,
            message: "OTP sent successfully",
            verifiedContactId: findUser.verifiedContactId,
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
exports.forgotPasswordGenerateOtp = forgotPasswordGenerateOtp;
const forgotPasswordVerifyOtp = async (data) => {
    try {
        const { userId, verifiedContact, otp } = data;
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser) {
            throw new HttpError_1.default("user not found", 404);
        }
        if (findUser.isBlocked == true && findUser.blockedAt) {
            const error = await (0, BlockUserRemainingTime_1.remainingTime)(findUser.blockedAt);
            throw new HttpError_1.default(JSON.stringify(error), 603);
        }
        // if (findUser.wrongLoginAttempts === 5) {
        //   throw new HTTPError(
        //     "Maximum login attempts exceeded.Please try again after 30 minutes",
        //     401
        //   );
        // }
        const findUserInTempStorage = await prisma_1.default.otpStore.findUnique({
            where: {
                userId_createdBy: {
                    userId: userId.toLowerCase(),
                    createdBy: "self",
                },
            },
        });
        if (!findUserInTempStorage)
            throw new HttpError_1.default("User OTP could not be found", 500);
        const hashedotp = findUserInTempStorage.hashedOTP;
        const verifyOTP_response = await (0, verifyOTP_1.verifyOTP)(hashedotp, otp, verifiedContact);
        if (!verifyOTP_response) {
            const totalLoginAttempts = await prisma_1.default.users.update({
                where: {
                    id: userId.toLowerCase(),
                },
                data: {
                    wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
                },
            });
            if (totalLoginAttempts.wrongLoginAttempts >= 5) {
                const updatedData = await prisma_1.default.users.update({
                    where: {
                        id: userId.toLowerCase(),
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
                    throw new HttpError_1.default(JSON.stringify(error), 603);
                }
            }
            const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
            const error = {
                message: `Invalid OTP .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
                remainingAttempts: remainingAttempts,
                isUserBlocked: false,
            };
            throw new HttpError_1.default(JSON.stringify(error), 401);
        }
        await prisma_1.default.otpStore.delete({
            where: {
                userId_createdBy: {
                    userId: userId.toLowerCase(),
                    createdBy: "self",
                },
            },
        });
        // const passwordUpdatedResponse: verifiedOtpReturnData = {
        //   success: true,
        //   verified: true,
        //   message: "Your account has been verified successfully! ",
        // };
        await prisma_1.default.users.update({
            where: {
                id: userId.toLowerCase(),
            },
            data: {
                wrongLoginAttempts: 0,
            },
        });
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            verified: true,
            message: "Your account has been verified successfully! ",
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
exports.forgotPasswordVerifyOtp = forgotPasswordVerifyOtp;
const resetPassword = async (data) => {
    try {
        const { userId, newpassword } = data;
        //hash password
        const salt = bcrypt_1.default.genSaltSync(10);
        const hashedPassword = bcrypt_1.default.hashSync(newpassword, salt);
        //find User
        const findUser = await (0, exports.getUserByUniqueData)(userId);
        if (!findUser)
            throw new HttpError_1.default("User not found", 404);
        let updatedPassword;
        //If minor setting password for the first time
        if (findUser.isMigrated == true && findUser.password === "dummy") {
            //minor changing passsword
            updatedPassword = await prisma_1.default.users.update({
                where: {
                    id: userId.toLowerCase(),
                },
                data: {
                    password: hashedPassword,
                    isMigrated: false,
                },
            });
        }
        else {
            //user changing password
            updatedPassword = await prisma_1.default.users.update({
                where: {
                    id: userId.toLowerCase(),
                },
                data: {
                    password: hashedPassword,
                },
            });
        }
        if (!updatedPassword)
            throw new HttpError_1.default("Could Not update password", 500);
        const passwordUpdatedResponse = {
            success: true,
            message: "Your password is updated successfully",
        };
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId.toLowerCase());
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return passwordUpdatedResponse;
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default(error.meta, 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.resetPassword = resetPassword;
//refresh access token for new session
const generateUserRefreshToken = async (data) => {
    try {
        if (!data)
            throw new HttpError_1.default("Missing Required Fields", 422);
        // const { accessToken } = data;
        const accessToken = data.split(" ")[1];
        if (!accessToken) {
            throw new HttpError_1.default("No token provided.", 401);
        }
        const decodedToken = jsonwebtoken_1.default.decode(accessToken);
        if (!decodedToken)
            throw new HttpError_1.default("Invalid Token.", 401);
        // 3. Find User
        const user = await prisma_1.default.users.findUnique({
            where: { id: decodedToken["id"] },
        });
        if (!user) {
            throw new HttpError_1.default("User not found.", 404);
        }
        //check if the session is valid
        if (user.currentSessionId !== decodedToken.currentSessionId) {
            throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
        }
        // 4. Check Refresh Token
        if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
            // Access token expired
            const refreshToken = user.refreshToken;
            if (!refreshToken) {
                throw new HttpError_1.default("Refresh token not found, user logged out", 403);
            }
            const refreshDecodedToken = jsonwebtoken_1.default.decode(refreshToken);
            if (!refreshDecodedToken)
                throw new HttpError_1.default("User is logged Out", 403);
            if (user.currentSessionId !== refreshDecodedToken.currentSessionId) {
                await prisma_1.default.users.update({
                    where: { id: user.id.toLowerCase() },
                    data: {
                        refreshToken: null,
                        currentSessionId: null,
                        deviceToken: null,
                    },
                });
                throw new HttpError_1.default("Session invalidated. Please log in again.", 403);
            }
            if (refreshDecodedToken["exp"] &&
                Date.now() / 1000 >= refreshDecodedToken["exp"]) {
                // Refresh token also expired
                await prisma_1.default.users.update({
                    where: { id: user.id.toLowerCase() },
                    data: { refreshToken: "", currentSessionId: null, deviceToken: null },
                });
                throw new HttpError_1.default("Session expired. Please Login again", 403);
            }
            else {
                // Generate new access token using refresh token data
                const userData = {
                    id: refreshDecodedToken["id"],
                    emailId: refreshDecodedToken["emailId"],
                    phoneNumber: refreshDecodedToken["phoneNumber"],
                    currentSessionId: refreshDecodedToken["currentSessionId"],
                };
                const newAccessToken = (0, Tokens_1.generateAccessToken)(userData);
                const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id.toLowerCase());
                if (!updateActiveSession) {
                    throw new HttpError_1.default("Could not update active session", 204);
                }
                return {
                    success: true,
                    refreshToken: newAccessToken,
                };
            }
        }
        else {
            const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id.toLowerCase());
            if (!updateActiveSession) {
                throw new HttpError_1.default("Could not update active session", 204);
            }
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
exports.generateUserRefreshToken = generateUserRefreshToken;
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
//# sourceMappingURL=auth.services.js.map