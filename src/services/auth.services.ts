import prisma from "../prisma";

import {
  DefaultOutput,
  ForgotPasswordInput,
  OtpLoginData,
  OtpLoginVerifyInput,
  PasswordLoginData,
  RegisterUserdata,
  ResetPasswordInput,
  TokenData,
  sessionData,
} from "../utility/DataTypes/types.user";
import HTTPError from "../utility/HttpError";

import { createOTP } from "../utility/generateOTP";
import {
  generateOtpReturnData,
  resendOtpReturnData,
  verifiedOtpReturnData,
  verifyOtpData,
} from "../utility/DataTypes/otp";
import { generateUserId } from "../utility/UserId";
import {
  OTPmailService,
  ResetPasswordAndChangeContactDetails,
} from "../utility/emailService";
import { verifyOTP } from "../utility/verifyOTP";
import bcrypt from "bcrypt";
import { sendOtpToMobile, sendUUIDToMobile } from "../utility/sendOtp";
import dotenv from "dotenv";
import { createS3Folder } from "../utility/aws/createFolder";
dotenv.config();
import { generateAccessToken, generateRefreshToken } from "../utility/Tokens";
import jwt, { JwtPayload } from "jsonwebtoken";
import { createUserFunctionality } from "../utility/CreateUserFunction";
import crypto from "crypto";
import { trackActiveSession } from "../utility/changeHistoryTrackFunction";
import {
  createUserOtpVerification,
  forgotPasswordOtpVerification,
  loginOTP,
  userId_information,
} from "../templates/userTemplates";
import { remainingTime } from "../utility/BlockUserRemainingTime";
import { profile } from "console";
import { verifiedContactId } from "@prisma/client";

//Registration
export const generatedOtpRegistration = async (data: RegisterUserdata) => {
  try {
    const { fullName, phoneNumber, password, emailId, country } = data;
    if (!fullName || !password || (!emailId && !phoneNumber) || !country) {
      throw new HTTPError("Please provide all required fields", 400);
    }
    //hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    // send otp using email id
    if (emailId && !phoneNumber) {
      const email = emailId.toLowerCase();
      const existing_user = await prisma.users.findFirst({
        where: {
          emailId: {
            equals: emailId,
            mode: "insensitive",
          },
        },
      });
      if (existing_user) {
        throw new HTTPError(`user with ${email} already exist`, 422); // user already exist throw error
      } else {
        //generate OTP
        const { otp, hashedotp } = await createOTP(email, "2h");
        const response = await OTPmailService(
          email,
          otp,
          "OTP for registration in THITO App",
          createUserOtpVerification
        );
        if (!response) throw new HTTPError("could not send otp to user", 612);

        //add data to temporary storage
        // const generatedId = generateUserId() as string;
        const UnverifiedUser = await prisma.verifiedUsers.upsert({
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
            userId: generateUserId() as string,
            fullName,
            emailId: email,
            hashedPassword,
            hashedOTP: hashedotp,
            country,
          },
        });

        if (!UnverifiedUser)
          throw new HTTPError("Could not store data of user", 500);

        const returnData: generateOtpReturnData = {
          success: true,
          id: UnverifiedUser.userId,
          verified: UnverifiedUser.isVerified,
          message: "OTP sent successfully",
          verifiedContact: emailId as string,
          verifiedContactId: "emailId",
        };
        return returnData;
      }
    } else {
      const existing_user = await prisma.users.findFirst({
        where: {
          phoneNumber,
        },
      });
      if (existing_user) {
        throw new HTTPError(`user with ${phoneNumber} already exist`, 422);
      }
      //generate OTP
      const { otp, hashedotp } = await createOTP(phoneNumber as string, "2h");
      const msg = `To create new profile on THITO, OTP is ${otp}, it is valid for 2 hours. Please click
https://tinyxxxxxxxxxxx to read and accept the terms. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber as string, msg);
      if (!responseOtp) throw new HTTPError("could not send otp to user", 612);

      const UnverifiedUser = await prisma.verifiedUsers.upsert({
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
          userId: generateUserId() as string,
          fullName,
          phoneNumber,
          hashedPassword,
          hashedOTP: hashedotp,
          country,
        },
      });

      if (!UnverifiedUser)
        throw new HTTPError("Could not store data of user", 500);

      const returnData: generateOtpReturnData = {
        success: true,
        id: UnverifiedUser.userId,
        verified: UnverifiedUser.isVerified,
        message: "OTP sent successfully",
        verifiedContact: phoneNumber as string,
        verifiedContactId: "phoneNumber",
      };
      return returnData;
    }
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

//verify otp
export const verifiedOtpRegistration = async (
  data: verifyOtpData
): Promise<verifiedOtpReturnData | void> => {
  try {
    const { id, otp, consent } = data;
    if (consent === false) {
      throw new HTTPError("User did not give consent", 600);
    }
    const findUnverifiedUser = await prisma.verifiedUsers.findFirst({
      where: {
        userId: {
          equals: id.toLocaleLowerCase(),
          mode: "insensitive",
        },
      },
    });
    if (!findUnverifiedUser) throw new HTTPError("User not found", 404);

    if (findUnverifiedUser.isVerified === true) {
      await prisma.verifiedUsers.update({
        where: {
          id: findUnverifiedUser.id,
        },
        data: {
          isVerified: false,
          hashedOTP: "not_verified",
        },
      });
      throw new HTTPError("Invalid otp, please regenerate", 400);
    }

    const registration_id = findUnverifiedUser.emailId
      ? findUnverifiedUser.emailId
      : (findUnverifiedUser.phoneNumber as string);
    const verifyOTP_response = await verifyOTP(
      findUnverifiedUser.hashedOTP,
      otp,
      registration_id
    );
    if (!verifyOTP_response) throw new HTTPError("Invalid OTP", 400);

    const verifiedUser = await prisma.verifiedUsers.update({
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

    const otpVerified: verifiedOtpReturnData = {
      success: true,
      user_data: values,
      verified: verifiedUser.isVerified,
      consent: true,
      message: "Congratulations! Your identity is verified",
    };
    return otpVerified;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

//resend otp for registration
export const resendOtp = async (data: { id: string }) => {
  try {
    const { id } = data;

    const findVerifyUser = await prisma.verifiedUsers.findFirst({
      where: {
        userId: {
          equals: id,
          mode: "insensitive",
        },
      },
    });

    if (!findVerifyUser)
      throw new HTTPError("User Not found,please generate the otp", 404);

    // if (findVerifyUser.isVerified == true)
    //   throw new HTTPError("User already verified", 400);

    const { emailId, phoneNumber } = findVerifyUser;

    if (emailId) {
      const { otp, hashedotp } = await createOTP(emailId, "2h");
      const response = await OTPmailService(
        emailId,
        otp,
        "OTP for registration in THITO App",
        createUserOtpVerification
      );
      if (!response) throw new HTTPError("could not send otp to user", 612);
      const UnverifiedUser = await prisma.verifiedUsers.update({
        where: {
          emailId,
        },
        data: {
          hashedOTP: hashedotp,
          isVerified: false,
        },
      });

      if (!UnverifiedUser) throw new HTTPError("Could Not Store new OTP", 500);

      const returnData: resendOtpReturnData = {
        success: true,
        id: UnverifiedUser.userId,
        verified: UnverifiedUser.isVerified,
        message: "OTP sent successfully",
      };
      return returnData;
    } else if (phoneNumber) {
      const { otp, hashedotp } = await createOTP(phoneNumber as string, "2h");
      const msg = `To create new profile on THITO, OTP is ${otp}, it is valid for 2 hours. Please click https://tinyxxxxxxxxxxx to read and accept the terms. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber as string, msg);
      if (!responseOtp) throw new HTTPError("Could not send OTP to user", 612);
      const UnverifiedUser = await prisma.verifiedUsers.update({
        where: {
          phoneNumber,
        },
        data: {
          hashedOTP: hashedotp,
          isVerified: false,
        },
      });

      if (!UnverifiedUser) throw new HTTPError("Could Not Store new OTP", 500);

      const returnData: resendOtpReturnData = {
        success: true,
        id: UnverifiedUser.userId,
        verified: UnverifiedUser.isVerified,
        message: "OTP sent successfully",
      };
      return returnData;
    }
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

//create user
export const createNewUser = async (data: RegisterUserdata) => {
  try {
    const { id } = data;
    data.createdBy = "self";

    const result = await createUserFunctionality(data);

    const { password, refreshToken, healthRecord, ...filteredData } = result;

    if (result.emailId && result.verifiedContactId == "emailId") {
      ResetPasswordAndChangeContactDetails(
        result.emailId.toLowerCase(),
        id.toLowerCase(), //id
        "Successful registration in THITO App",
        userId_information,
        result.fullName
      );
    } else if (
      result.phoneNumber &&
      result.verifiedContactId == "phoneNumber"
    ) {
      const msg = `Dear ${result.fullName}, welcome to THITO. Your User ID is ${id.toLowerCase()}. You can use it for login. Stay updated with your health data. -STEIGEN HEALTHCARE`;
      sendOtpToMobile(result.phoneNumber, msg);
    }

    //remove data from temp storage
    await prisma.verifiedUsers.delete({
      where: {
        userId: result.id,
      },
    });

    const settings = await prisma.usersSetting.findUnique({
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
    createS3Folder(result.id.toLowerCase());
    //login the user directly after sucessful registeration
    const uniqueSessionId = crypto.randomBytes(20).toString("hex");
    const { emailId, phoneNumber } = result;

    //generate jwt token
    const userData = {
      id: id.toLowerCase(),
      emailId: emailId ? emailId.toLowerCase() : null,
      phoneNumber,
      currentSessionId: uniqueSessionId,
    };
    //update user status to loggedIn
    const loggedInUser = await prisma.users.update({
      data: {
        refreshToken: generateRefreshToken(userData),
        currentSessionId: uniqueSessionId,
      },
      where: {
        id: id.toLowerCase(),
      },
    });

    if (!loggedInUser)
      throw new HTTPError("DB Error: Could not update user data", 500);

    const updateActiveSession = await trackActiveSession(id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "Successfully added new user and logged in",
      data: {
        userData: {
          U6: filteredData,
          H8: result.healthRecord,
        },
        uniqueKey: crypto.randomBytes(16).toString("hex"),
        accessToken: generateAccessToken(userData),
      },
      settings,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

//check session
export const checkUserSession = async (data: sessionData) => {
  try {
    const { userId, password } = data;

    //check if user exist
    const findUser = await getUserByUniqueData(userId);
    if (!findUser) {
      throw new HTTPError("could not find user ", 404);
    }
    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 603);
    }

    //if minor logging in for the first time
    if (password) {
      if (findUser.password === "dummy" && findUser.isMigrated == true)
        throw new HTTPError("Password is not set. Login Using OTP", 401);
      //check password

      if (!bcrypt.compareSync(password, findUser.password)) {
        const totalLoginAttempts = await prisma.users.update({
          where: {
            id: findUser.id.toLowerCase(),
          },
          data: {
            wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
          },
        });
        if (totalLoginAttempts.wrongLoginAttempts >= 5) {
          const updatedData = await prisma.users.update({
            where: {
              id: findUser.id.toLowerCase(),
            },
            data: {
              isBlocked: true,
              blockedAt: new Date(),
            },
          });

          await prisma.blockReasons.create({
            data: {
              blockReason: "auto-block",
              blockedBy: "app",
            },
          });

          if (
            updatedData.isBlocked == true &&
            updatedData.blockedAt &&
            updatedData.wrongLoginAttempts === 5
          ) {
            const error = await remainingTime(updatedData.blockedAt);
            throw new HTTPError(JSON.stringify(error), 603);
          }
        }
        const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
        const error = {
          message: `Invalid password .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
          remainingAttempts: remainingAttempts,
          isUserBlocked: false,
        };
        throw new HTTPError(JSON.stringify(error), 401);
      }
    }
    //check user session
    const isSessionValid = await prisma.users.findFirst({
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
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

//User Login Logic
export const passwordLogin = async (data: PasswordLoginData) => {
  try {
    const { userId, password, language, deviceToken } = data;
    const findUser = await getUserByUniqueData(userId);

    if (!findUser) throw new HTTPError("User not found!", 404);

    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 603);
    }

    //if minor logging in for the first time
    if (findUser.password === "dummy" && findUser.isMigrated == true)
      throw new HTTPError("Password is not set. Login Using OTP", 401);

    if (!bcrypt.compareSync(password, findUser.password)) {
      const totalLoginAttempts = await prisma.users.update({
        where: {
          id: findUser.id.toLowerCase(),
        },
        data: {
          wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
        },
      });
      if (totalLoginAttempts.wrongLoginAttempts >= 5) {
        const updatedData = await prisma.users.update({
          where: {
            id: findUser.id.toLowerCase(),
          },
          data: {
            isBlocked: true,
            blockedAt: new Date(),
          },
        });

        await prisma.blockReasons.create({
          data: {
            blockReason: "auto-block",
            blockedBy: "app",
          },
        });

        if (
          updatedData.isBlocked == true &&
          updatedData.blockedAt &&
          updatedData.wrongLoginAttempts === 5
        ) {
          const error = await remainingTime(updatedData.blockedAt);
          throw new HTTPError(JSON.stringify(error), 603);
        }
      }
      const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
      const error = {
        message: `Invalid password .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
        remainingAttempts: remainingAttempts,
        isUserBlocked: false,
      };
      throw new HTTPError(JSON.stringify(error), 401);
    }

    const uniqueSessionId = crypto.randomBytes(20).toString("hex");
    const { id, emailId, phoneNumber, wrongLoginAttempts } = findUser;

    //generate jwt token
    const userData = {
      id: id.toLowerCase(),
      emailId: emailId ? emailId.toLowerCase() : null,
      phoneNumber,
      currentSessionId: uniqueSessionId,
    };

    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    //update user status to loggedIn
    const loggedInUser = await prisma.users.update({
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
      throw new HTTPError("DB Error: Could not update user data", 500);
    const settings = await prisma.usersSetting.update({
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
      throw new HTTPError("could not update settings data", 500);
    }

    const updateActiveSession = trackActiveSession(findUser.id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
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
        uniqueKey: crypto.randomBytes(16).toString("hex"),
        accessToken,
      },
      settings,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const otpLoginGenerate = async (data: OtpLoginData) => {
  try {
    const { userId } = data;
    const findUser = await getUserByUniqueData(userId);

    if (!findUser) throw new HTTPError("User not found", 404);

    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 603);
    }

    // if (findUser.isLoggedIn) throw new HTTPError("User already logged in", 400);

    const { phoneNumber, emailId } = findUser;
    let otp,
      hashedotp = "";
    let verifiedContact;
    //generate OTP
    if (phoneNumber && findUser.verifiedContactId === "phoneNumber") {
      ({ otp, hashedotp } = await createOTP(phoneNumber, "5m"));
      console.log(otp); //!remove this later

      verifiedContact = phoneNumber;
      const msg = `Dear ${findUser.fullName}, to Log into the THITO App, please enter OTP ${otp}. DO NOT SHARE THE OTP. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber, msg);
      if (!responseOtp) throw new HTTPError("could not send otp", 612);
    } else if (emailId && findUser.verifiedContactId === "emailId") {
      ({ otp, hashedotp } = await createOTP(emailId.toLowerCase(), "15m"));
      verifiedContact = emailId.toLowerCase();
      const responseOtp = await OTPmailService(
        emailId.toLowerCase(),
        otp,
        "THITO - OTP for Login",
        loginOTP
      );
      if (!responseOtp) throw new HTTPError("could not send otp", 612);
    }
    await prisma.otpStore.upsert({
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
      uniqueKey: crypto.randomBytes(16).toString("hex"),
      message: "OTP sent successfully",
      verifiedContact,
      verifiedContactId: findUser.verifiedContactId,
    };
    return returnData;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const otpLoginVerify = async (data: OtpLoginVerifyInput) => {
  try {
    const { userId, verifiedContact, otp, language, deviceToken } = data;

    const findUser = await getUserByUniqueData(userId);

    if (!findUser) throw new HTTPError("User not found", 404);

    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 603);
    }

    //get hashed otp
    const findLoginUser = await prisma.otpStore.findUnique({
      where: {
        userId_createdBy: {
          userId: findUser.id.toLowerCase(),
          createdBy: "self",
        },
      },
    });
    if (!findLoginUser)
      throw new HTTPError("Could not find User to log in", 404);

    if (
      (findUser.verifiedContactId === "emailId" &&
        findLoginUser.emailId !== verifiedContact) ||
      (findUser.verifiedContactId === "phoneNumber" &&
        findLoginUser.phoneNumber !== verifiedContact)
    )
      throw new HTTPError("Enter Correct verified contact", 401);

    const hashedotp = findLoginUser.hashedOTP;

    const verifyOTP_response = await verifyOTP(hashedotp, otp, verifiedContact);
    if (!verifyOTP_response) {
      const totalLoginAttempts = await prisma.users.update({
        where: {
          id: findUser.id.toLowerCase(),
        },
        data: {
          wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
        },
      });
      if (totalLoginAttempts.wrongLoginAttempts >= 5) {
        const updatedData = await prisma.users.update({
          where: {
            id: findUser.id.toLowerCase(),
          },
          data: {
            isBlocked: true,
            blockedAt: new Date(),
          },
        });
        await prisma.blockReasons.create({
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
        if (
          updatedData.isBlocked == true &&
          updatedData.blockedAt &&
          updatedData.wrongLoginAttempts === 5
        ) {
          const error = await remainingTime(updatedData.blockedAt);
          throw new HTTPError(JSON.stringify(error), 603);
        }
      }
      const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
      const error = {
        message: `Invalid otp .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
        remainingAttempts: remainingAttempts,
        isUserBlocked: false,
      };
      throw new HTTPError(JSON.stringify(error), 401);
    }

    const { id, emailId, phoneNumber } = findUser;
    const currentDate: Date = new Date(Date.now());
    const uniqueSessionId =
      crypto.randomBytes(20).toString("hex") + "+" + currentDate;
    const userData = {
      id: id.toLowerCase(),
      emailId: emailId ? emailId.toLowerCase() : null,
      phoneNumber,
      currentSessionId: uniqueSessionId,
    };

    const accessToken = generateAccessToken(userData);

    const refreshToken = generateRefreshToken(userData);

    //update user status to loggedIn
    const loggedInUser = await prisma.users.update({
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

    if (!loggedInUser) throw new HTTPError("Could not update user data", 500);

    //delete data from OTP store
    await prisma.otpStore.delete({
      where: {
        userId_createdBy: {
          userId: userId.toLowerCase(),
          createdBy: "self",
        },
      },
    });
    const settings = await prisma.usersSetting.update({
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
      throw new HTTPError("could not update settings data", 500);
    }
    const updateActiveSession = trackActiveSession(findUser.id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
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
          uniqueKey: crypto.randomBytes(16).toString("hex"),
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
        uniqueKey: crypto.randomBytes(16).toString("hex"),
        accessToken,
      },
      settings,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const userLogout = async (user: TokenData) => {
  try {
    const { id } = user;

    //logout user
    const updateUser = await prisma.users.update({
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

    if (!updateUser) throw new HTTPError("User not found", 404);
    const updateActiveSession = trackActiveSession(id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "successfully logged Out",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError("Internal server error", 500);
    }
  }
};

//forgot password logic
export const forgotPasswordGenerateOtp = async (userId: string) => {
  try {
    //find user
    const findUser = await getUserByUniqueData(userId);
    if (!findUser) throw new HTTPError("User Does not exist!", 404);

    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 603);
    }

    const { phoneNumber, emailId } = findUser;
    let otp,
      hashedotp = "";
    let verifiedContact;
    //generate OTP
    if (phoneNumber && findUser.verifiedContactId === "phoneNumber") {
      ({ otp, hashedotp } = await createOTP(phoneNumber, "5m"));
      verifiedContact = phoneNumber;
      const msg = `To reset your old password, please enter OTP ${otp}, Do not share the OTP. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber, msg);
      if (!responseOtp) throw new HTTPError("could not send OTP", 612);
    } else if (emailId && findUser.verifiedContactId === "emailId") {
      ({ otp, hashedotp } = await createOTP(emailId.toLowerCase(), "15m"));
      verifiedContact = emailId.toLowerCase();
      const responseOtp = await ResetPasswordAndChangeContactDetails(
        emailId.toLowerCase(),
        otp,
        "Reset password in THITO App",
        forgotPasswordOtpVerification,
        findUser.fullName
      );
      if (!responseOtp) throw new HTTPError("could not send email", 612);
    } else {
      throw new HTTPError("Email id or phonenumber is not verified", 401);
    }
    //store in temp otp store
    await prisma.otpStore.upsert({
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
    const updateActiveSession = trackActiveSession(findUser.id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    const returnData = {
      success: true,
      userId: findUser.id.toLowerCase(),
      verifiedContact,
      message: "OTP sent successfully",
      verifiedContactId: findUser.verifiedContactId,
    };
    return returnData;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const forgotPasswordVerifyOtp = async (
  data: ForgotPasswordInput
): Promise<void | verifiedOtpReturnData> => {
  try {
    const { userId, verifiedContact, otp } = data;

    const findUser = await getUserByUniqueData(userId);
    if (!findUser) {
      throw new HTTPError("user not found", 404);
    }
    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 603);
    }
    // if (findUser.wrongLoginAttempts === 5) {
    //   throw new HTTPError(
    //     "Maximum login attempts exceeded.Please try again after 30 minutes",
    //     401
    //   );
    // }
    const findUserInTempStorage = await prisma.otpStore.findUnique({
      where: {
        userId_createdBy: {
          userId: userId.toLowerCase(),
          createdBy: "self",
        },
      },
    });

    if (!findUserInTempStorage)
      throw new HTTPError("User OTP could not be found", 500);

    const hashedotp = findUserInTempStorage.hashedOTP;

    const verifyOTP_response = await verifyOTP(hashedotp, otp, verifiedContact);

    if (!verifyOTP_response) {
      const totalLoginAttempts = await prisma.users.update({
        where: {
          id: userId.toLowerCase(),
        },
        data: {
          wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
        },
      });
      if (totalLoginAttempts.wrongLoginAttempts >= 5) {
        const updatedData = await prisma.users.update({
          where: {
            id: userId.toLowerCase(),
          },
          data: {
            isBlocked: true,
            blockedAt: new Date(),
          },
        });
        await prisma.blockReasons.create({
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
        if (
          updatedData.isBlocked == true &&
          updatedData.blockedAt &&
          updatedData.wrongLoginAttempts === 5
        ) {
          const error = await remainingTime(updatedData.blockedAt);
          throw new HTTPError(JSON.stringify(error), 603);
        }
      }
      const remainingAttempts = 5 - totalLoginAttempts.wrongLoginAttempts;
      const error = {
        message: `Invalid OTP .You will be blocked after ${remainingAttempts} unsuccessfull attempts`,
        remainingAttempts: remainingAttempts,
        isUserBlocked: false,
      };
      throw new HTTPError(JSON.stringify(error), 401);
    }
    await prisma.otpStore.delete({
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
    await prisma.users.update({
      where: {
        id: userId.toLowerCase(),
      },
      data: {
        wrongLoginAttempts: 0,
      },
    });
    const updateActiveSession = trackActiveSession(userId.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      verified: true,
      message: "Your account has been verified successfully! ",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const resetPassword = async (
  data: ResetPasswordInput
): Promise<DefaultOutput | void> => {
  try {
    const { userId, newpassword } = data;
    //hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(newpassword, salt);

    //find User
    const findUser = await getUserByUniqueData(userId);
    if (!findUser) throw new HTTPError("User not found", 404);

    let updatedPassword;

    //If minor setting password for the first time
    if (findUser.isMigrated == true && findUser.password === "dummy") {
      //minor changing passsword
      updatedPassword = await prisma.users.update({
        where: {
          id: userId.toLowerCase(),
        },
        data: {
          password: hashedPassword,
          isMigrated: false,
        },
      });
    } else {
      //user changing password
      updatedPassword = await prisma.users.update({
        where: {
          id: userId.toLowerCase(),
        },
        data: {
          password: hashedPassword,
        },
      });
    }

    if (!updatedPassword) throw new HTTPError("Could Not update password", 500);
    const passwordUpdatedResponse: DefaultOutput = {
      success: true,
      message: "Your password is updated successfully",
    };
    const updateActiveSession = trackActiveSession(userId.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return passwordUpdatedResponse;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError(error.meta, 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

//refresh access token for new session
export const generateUserRefreshToken = async (data: string) => {
  try {
    if (!data) throw new HTTPError("Missing Required Fields", 422);

    // const { accessToken } = data;
    const accessToken = data.split(" ")[1];
    if (!accessToken) {
      throw new HTTPError("No token provided.", 401);
    }

    const decodedToken = jwt.decode(accessToken) as JwtPayload;

    if (!decodedToken) throw new HTTPError("Invalid Token.", 401);

    // 3. Find User
    const user = await prisma.users.findUnique({
      where: { id: decodedToken["id"] },
    });
    if (!user) {
      throw new HTTPError("User not found.", 404);
    }
    //check if the session is valid
    if (user.currentSessionId !== decodedToken.currentSessionId) {
      throw new HTTPError("Session invalidated. Please log in again.", 403);
    }
    // 4. Check Refresh Token
    if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
      // Access token expired
      const refreshToken = user.refreshToken;
      if (!refreshToken) {
        throw new HTTPError("Refresh token not found, user logged out", 403);
      }

      const refreshDecodedToken = jwt.decode(refreshToken) as JwtPayload;

      if (!refreshDecodedToken) throw new HTTPError("User is logged Out", 403);

      if (user.currentSessionId !== refreshDecodedToken.currentSessionId) {
        await prisma.users.update({
          where: { id: user.id.toLowerCase() },
          data: {
            refreshToken: null,
            currentSessionId: null,
            deviceToken: null,
          },
        });
        throw new HTTPError("Session invalidated. Please log in again.", 403);
      }
      if (
        refreshDecodedToken["exp"] &&
        Date.now() / 1000 >= refreshDecodedToken["exp"]
      ) {
        // Refresh token also expired
        await prisma.users.update({
          where: { id: user.id.toLowerCase() },
          data: { refreshToken: "", currentSessionId: null, deviceToken: null },
        });
        throw new HTTPError("Session expired. Please Login again", 403);
      } else {
        // Generate new access token using refresh token data
        const userData = {
          id: refreshDecodedToken["id"],
          emailId: refreshDecodedToken["emailId"],
          phoneNumber: refreshDecodedToken["phoneNumber"],
          currentSessionId: refreshDecodedToken["currentSessionId"],
        };
        const newAccessToken = generateAccessToken(userData);
        const updateActiveSession = trackActiveSession(user.id.toLowerCase());
        if (!updateActiveSession) {
          throw new HTTPError("Could not update active session", 204);
        }
        return {
          success: true,
          refreshToken: newAccessToken,
        };
      }
    } else {
      const updateActiveSession = trackActiveSession(user.id.toLowerCase());
      if (!updateActiveSession) {
        throw new HTTPError("Could not update active session", 204);
      }
      // Access token still valid
      return {
        success: true,
        refreshToken: accessToken,
      };
    }
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//Helper Function
export const getUserByUniqueData = async (userId: string) => {
  return await prisma.users.findFirst({
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
