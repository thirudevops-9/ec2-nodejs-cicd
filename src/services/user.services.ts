import prisma from "../prisma";
import { ParsedQs } from "qs";
import {
  ChangeContactDetailsInput,
  NewContactDetailsInput,
  PasswordLoginData,
  TokenData,
  UpdateData,
  UpdateUserSetting,
} from "../utility/DataTypes/types.user";
import HTTPError from "../utility/HttpError";
import crypto from "crypto";
import { createOTP } from "../utility/generateOTP";
import {
  ComplaintReplyEmail,
  OTPmailService,
  ResetPasswordAndChangeContactDetails,
} from "../utility/emailService";
import { verifyOTP } from "../utility/verifyOTP";
import { sendOtpToMobile } from "../utility/sendOtp";
import dotenv from "dotenv";
dotenv.config();
import { deleteFolderFromS3 } from "../utility/aws/deleteFolder";
import { MessageType, Users, verifiedContactId } from "@prisma/client";
import bcrypt from "bcrypt";
import { validateContact } from "../utility/ValidateNewContact";
import {
  FamilyMembersData,
  getMemberDataById,
} from "../utility/familyMemberData";
import { formatDateForDB } from "../utility/DateTimeFormatters";
import { getUpdatedData } from "../utility/SyncedData";
import { getUserVitalModules } from "./vitals.services";
import { familyLink } from "../utility/familyLinkData";
import {
  trackActiveSession,
  trackChanges,
} from "../utility/changeHistoryTrackFunction";
import { getAllAdvertisements } from "./contentManagement.services";

import { changeVerifiedContactDetailsOTP } from "../templates/userTemplates";
import { adminTokenData } from "../utility/DataTypes/types.admin";
import { uploadProfile } from "../utility/aws/uploadFile";
import { AutocomplaintReply } from "../templates/DashboardTemplates";
import { remainingTime } from "../utility/BlockUserRemainingTime";

//!admin operation only
export const getAllAppUsers = async (queryParams: ParsedQs) => {
  try {
    const { page, limit } = queryParams;
    const userFilter: Array<{}> = [];
    const depFilter: Array<{}> = [];
    const { search } = queryParams;

    const genderValues = ["male", "female", "other"]; // Enum values
    if (
      search &&
      genderValues.includes((search as string).toLocaleLowerCase())
    ) {
      userFilter.push({ gender: { equals: (search as string).toLowerCase() } });
      depFilter.push({ gender: { equals: (search as string).toLowerCase() } });
    }
    if (search) {
      userFilter.push(
        { id: { contains: search, mode: "insensitive" } },
        {
          [verifiedContactId.emailId]: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          [verifiedContactId.phoneNumber]: {
            contains: search,
            mode: "insensitive",
          },
        },
        { fullName: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
        { pincode: { contains: search, mode: "insensitive" } }
      );
    }

    if (search) {
      depFilter.push(
        { id: { contains: search, mode: "insensitive" } },
        {
          user: {
            [verifiedContactId.emailId]: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            [verifiedContactId.phoneNumber]: {
              contains: search,
              mode: "insensitive",
            },
          },
        },

        { fullName: { contains: search, mode: "insensitive" } },
        {
          user: {
            country: { contains: search, mode: "insensitive" },
          },
        },
        { pincode: { contains: search, mode: "insensitive" } }
      );
    }
    // const filters: any = {};
    // if (fullName) {
    //   filters.fullName = fullName;
    // }
    // if (id) {
    //   filters.id = id;
    // }

    const [users, dependants] = await Promise.all([
      prisma.users.findMany({
        where: userFilter.length > 0 ? { OR: userFilter } : {},
        orderBy: {
          createdAt: "desc",
        },
        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string)
          : 0,
        take: limit ? parseInt(limit as string) : 500,
        include: {
          healthRecord: true,
        },
      }),
      prisma.dependant.findMany({
        where: depFilter.length > 0 ? { OR: depFilter } : {},

        orderBy: {
          createdAt: "desc",
        },
        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string)
          : 0,
        take: limit ? parseInt(limit as string) : 500,
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
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit ? parseInt(limit as string) : 500);

    const totalRecords =
      (await prisma.users.count({})) + (await prisma.dependant.count({}));

    // if (!allUserData) throw new HTTPError("Could Not fetch Users List", 404);

    return {
      success: true,
      data: combinedData,
      totalRecords: totalRecords,
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

//get user by id
export const getUserDataById = async (userId: string, type: string) => {
  try {
    let data = {};

    if (type === "minor") {
      const userData = await prisma.dependant.findFirst({
        where: {
          id: { equals: userId, mode: "insensitive" },
        },
        include: {
          healthRecord: true,
        },
      });

      if (!userData) throw new HTTPError("Could Not fetch Users List", 404);

      const createdBy = await prisma.users.findFirst({
        where: {
          id: { equals: userData.userId, mode: "insensitive" },
        },
        include: {
          setting: true,
        },
      });
      if (!createdBy)
        throw new HTTPError("created by user does not exist", 404);

      const memberData = await prisma.familylinks.findFirst({
        where: {
          linkFrom: userData.userId.toLowerCase(),
          linkTo: userId.toLowerCase(),
          linkType: "minor",
        },
      });

      if (!memberData)
        throw new HTTPError("User is not a member of this family", 404);

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
    } else if (type === "user") {
      const userData = await prisma.users.findFirst({
        where: {
          id: userId.toLowerCase(),
        },
        include: {
          healthRecord: true,
          setting: true,
        },
      });
      if (!userData) throw new HTTPError("Could Not Find User", 404);

      //get family members
      const getAllFamilyMembers = await prisma.familylinks.findMany({
        where: {
          linkFrom: userId.toLowerCase(),
        },
      });

      if (!getAllFamilyMembers)
        throw new HTTPError("Could not fetch family data", 404);

      const memberData = await FamilyMembersData(getAllFamilyMembers);
      const findMembers = (id: string) => {
        return (
          memberData.D7.find((member) => member.id === id) ||
          memberData.U6.find((member) => member.id === id)
        );
      };

      // Map over the F9 array to get the required family structure
      const family = memberData.F9.map((link) => {
        const member = findMembers(link.linkTo);

        if (!member) return null;
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

      const updateActiveSession = trackActiveSession(userId.toLowerCase());
      if (!updateActiveSession) {
        throw new HTTPError("Could not update active session", 204);
      }
    }
    return {
      success: true,
      data,
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

//update user by id - other
export const editUserById = async (
  data: UpdateData,
  userId: string,
  queryParams: ParsedQs
) => {
  try {
    if (!data || !userId) throw new HTTPError("Required Data missing", 422);

    const {
      profileImage,
      phoneNumber,
      emailId,
      gender,
      dob,
      address,
      pincode,
      emergencyContact,
      bloodGroup,
      presentDiseases,
      allergies,
      doctorFullName,
      docAddress,
      docPhoneNumber,
      additionalInformation,
    } = data;

    const { famCareMemberId } = queryParams;

    let updateUser;
    let result;

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId.toLowerCase(),
        (famCareMemberId as string)?.toLowerCase()
      );
      if (linkData.accessType === "view" || linkData.linkType !== "minor") {
        throw new HTTPError("You are not authorised to make this change", 401);
      }

      const findMinor = await prisma.dependant.findFirst({
        where: {
          id: (famCareMemberId as string)?.toLowerCase(),
        },
      });
      if (profileImage) {
        result = await uploadProfile({
          profileImage: profileImage,
          userId: (famCareMemberId as string)?.toLowerCase(),
        });
        if (!result || !result.success)
          throw new HTTPError("Could not upload profile to s3", 502);
      }

      updateUser = await prisma.dependant.update({
        where: {
          id: (famCareMemberId as string)?.toLowerCase(),
        },
        data: {
          phoneNumber: phoneNumber == "" ? null : phoneNumber,
          emailId: emailId == "" ? null : emailId?.toLowerCase(),
          gender,
          dob: dob ? formatDateForDB(dob) : findMinor?.dob,
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
      const healthData = await prisma.healthRecord.findFirst({
        where: {
          forDependantId: updateUser.id,
        },
      });

      if (!healthData)
        throw new HTTPError("Could Not fetch updated health data", 404);
      return {
        success: true,
        id: updateUser.id.toLowerCase(),
        message: "User Data was updated successfully",
        D7: updateUser,
        H8: healthData,
      };
    } else {
      const findUser = await getUserByUniqueData(userId);
      if (!findUser) throw new HTTPError("User not found!", 404);

      if (profileImage) {
        result = await uploadProfile({
          profileImage: profileImage,
          userId,
        });
        if (!result || !result.success)
          throw new HTTPError("Could not upload profile to s3", 502);
      }

      if (
        (findUser.verifiedContactId === "emailId" &&
          emailId &&
          emailId != findUser.emailId) ||
        (findUser.verifiedContactId === "emailId" && emailId == "") ||
        (findUser.verifiedContactId === "phoneNumber" &&
          phoneNumber &&
          phoneNumber != findUser.phoneNumber) ||
        (findUser.verifiedContactId === "phoneNumber" && phoneNumber == "")
      )
        throw new HTTPError("Verified Contact is not subject to change", 612);

      updateUser = await prisma.users.update({
        where: {
          id: userId.toLowerCase(),
        },
        data: {
          phoneNumber: phoneNumber == "" ? null : phoneNumber,
          emailId: emailId == "" ? null : emailId?.toLowerCase(),
          gender,
          dob: dob ? formatDateForDB(dob) : findUser?.dob,
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
    if (!updateUser) throw new HTTPError("Could Not update User Data", 500);
    const healthData = await prisma.healthRecord.findFirst({
      where: {
        forUserId: updateUser.id,
      },
    });
    if (!healthData)
      throw new HTTPError("Could Not fetch updated health data", 404);

    const updateActiveSession = trackActiveSession(userId.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    const { password, refreshToken, ...filteredData } = updateUser;

    return {
      success: true,
      id: updateUser.id.toLowerCase(),
      message: "User Data was updated successfully",
      U6: filteredData,
      H8: healthData,
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

//get user settings
export const getUserSetting = async (userId: string) => {
  try {
    const findUser = await getUserByUniqueData(userId);
    if (!findUser) throw new HTTPError("User does not exist", 404);
    //2.update user setting data
    const getSettings = await prisma.usersSetting.findFirst({
      where: {
        forUserid: userId,
      },
      // select: {
      //   notification: true,
      //   appLock: true,
      //   language: true,
      // },
    });
    if (!getSettings) throw new HTTPError("Could not fetch user setting", 404);

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      settings: getSettings,
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

//update user setting
export const updateUserSetting = async (
  data: UpdateUserSetting,
  userId: string
) => {
  try {
    const { notification, language, appLock } = data;
    //1.check if user exist
    const findUser = await getUserByUniqueData(userId);
    if (!findUser) throw new HTTPError("User does not exist", 404);
    //2.update user setting data
    const updateUserSetting = await prisma.usersSetting.update({
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
      throw new HTTPError("Could not update user setting", 500);

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      updatedSettings: updateUserSetting,
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

//Change Verified Contacts
//1. password verify
export const verifyUserPassword = async (data: PasswordLoginData) => {
  try {
    const { userId, password } = data;

    const findUser = await getUserByUniqueData(userId);

    if (!findUser) throw new HTTPError("User not found!", 404);
    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 403);
    }
    // if (findUser.wrongLoginAttempts === 5) {
    //   throw new HTTPError(
    //     "Maximum login attempts exceeded.Please try again after 30 minutes",
    //     401
    //   );
    // }

    if (!bcrypt.compareSync(password, findUser.password)) {
      const totalLoginAttempts = await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
        },
      });
      if (totalLoginAttempts.wrongLoginAttempts >= 5) {
        const updatedData = await prisma.users.update({
          where: {
            id: userId,
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
          throw new HTTPError(JSON.stringify(error), 403);
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
    await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        wrongLoginAttempts: 0,
      },
    });
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "password verified successfully",
      user: {
        id: userId,
        verifiedContactId: findUser.verifiedContactId,
      },
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

//2. take new details and generate OTP
export const newUserContactDetails = async (data: NewContactDetailsInput) => {
  try {
    const { id, emailId, phoneNumber } = data;

    const findUser = await getUserByUniqueData(id);
    if (!findUser) throw new HTTPError("User not found!", 404);
    if (findUser.verifiedContactId === "emailId" && phoneNumber) {
      throw new HTTPError(
        "As your old verified contact is emailId,you can only set new emailId and not phoneNumber",
        400
      );
    }
    if (findUser.verifiedContactId === "phoneNumber" && emailId) {
      throw new HTTPError(
        "As your old verified contact is phoneNumber,you can only set new phoneNumber and not emailId",
        400
      );
    }
    if (emailId) {
      const validationResponse = await validateContact(
        id,
        "emailId",
        emailId.toLowerCase()
      );
      if (!validationResponse.success)
        throw new HTTPError(validationResponse.message, 400);

      // generate OTP
      const { otp, hashedotp } = await createOTP(emailId.toLowerCase(), "15m");

      const response = await ResetPasswordAndChangeContactDetails(
        emailId.toLowerCase(),
        otp,
        "Change Contact detail in THITO App",
        changeVerifiedContactDetailsOTP,
        findUser.fullName
      );
      if (!response) throw new HTTPError("could not send mail", 612);

      //add data to temporary storage
      const changeDetailsUser = await prisma.otpStore.upsert({
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
        throw new HTTPError("Could not store OTP in db", 500);
      const updateActiveSession = trackActiveSession(id);
      if (!updateActiveSession) {
        throw new HTTPError("Could not update active session", 204);
      }

      const returnData = {
        success: true,
        userId: id,
        verifiedContact: emailId,
        verifiedContactId: "emailId",
        message: "OTP sent successfully",
      };
      return returnData;
    } else if (phoneNumber) {
      const response = await validateContact(id, "phoneNumber", phoneNumber);
      if (!response.success) throw new HTTPError(response.message, 400);

      // generate OTP
      const { otp, hashedotp } = await createOTP(phoneNumber as string, "5m");
      const msg = `Dear ${findUser.fullName}, to change your contact number, please enter OTP ${otp}. Do not share the OTP. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber as string, msg);
      if (!responseOtp) throw new HTTPError("Could not send OTP ", 612);
      //add data to temporary storage
      const changeDetailsUser = await prisma.otpStore.upsert({
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
        throw new HTTPError("Could not store OTP in db", 500);

      const returnData = {
        success: true,
        userId: id,
        verifiedContact: phoneNumber,
        verifiedContactId: "phoneNumber",
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
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//3. verify otp and change details
export const changeContactOtpVerify = async (
  data: ChangeContactDetailsInput
) => {
  try {
    const { userId, verifiedContact, verifiedContactId, otp } = data;

    const findUser = await getUserByUniqueData(userId);

    if (!findUser) throw new HTTPError("User not found", 404);
    if (findUser.isBlocked == true && findUser.blockedAt) {
      const error = await remainingTime(findUser.blockedAt);
      throw new HTTPError(JSON.stringify(error), 403);
    }
    // if (findUser.wrongLoginAttempts === 5) {
    //   throw new HTTPError(
    //     "Maximum login attempts exceeded.Please try again after 30 minutes",
    //     401
    //   );
    // }

    //get hashed otp
    const findContactChangesUser = await prisma.otpStore.findUnique({
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
      throw new HTTPError("Cannot find User to change contact details", 404);

    if (findContactChangesUser) {
    }
    const hashedotp = findContactChangesUser.hashedOTP;

    const verifyOTP_response = await verifyOTP(hashedotp, otp, verifiedContact);

    if (!verifyOTP_response) {
      const totalLoginAttempts = await prisma.users.update({
        where: {
          id: userId,
        },
        data: {
          wrongLoginAttempts: findUser.wrongLoginAttempts + 1,
        },
      });
      if (totalLoginAttempts.wrongLoginAttempts >= 5) {
        const updatedData = await prisma.users.update({
          where: {
            id: userId,
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
          throw new HTTPError(JSON.stringify(error), 403);
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

    //update user contact details
    const changeDetails = await prisma.users.update({
      data: {
        [verifiedContactId]: verifiedContact,
        verifiedContactId: verifiedContactId,
      },
      where: {
        id: findUser.id,
      },
    });

    if (!changeDetails) throw new HTTPError("Could not update user data", 500);

    //delete data from OTP store
    await prisma.otpStore.delete({
      where: {
        userId_createdBy: {
          userId,
          createdBy: "self",
        },
      },
    });
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    await prisma.users.update({
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

//delete user -self
export const removeUserById = async (
  userId: string,
  deleteData: { reason: string; role: string; email: string }
) => {
  try {
    const { reason, role } = deleteData;
    let { email } = deleteData;
    //find user
    const userData = await prisma.users.findFirst({
      where: {
        id: userId.toLowerCase(),
      },
    });
    if (!userData) throw new HTTPError("User Not Found", 404);

    if (email === "") {
      email =
        userData.verifiedContactId === "emailId"
          ? (userData.emailId as string)
          : (userData.phoneNumber as string);
    }
    //1. reason to delete the user
    const createReason = await prisma.deleteAccountReasons.create({
      data: {
        reason,
        role,
        deletedby: email,
      },
    });
    if (!createReason) throw new HTTPError("Could not create reason", 500);

    //2. delete user S3 folder
    const result = await deleteFolderFromS3(userId.toLowerCase());
    if (!result) throw new HTTPError(" Could not delete s3 folder", 502);

    //3.1 Store all deleting family links in syncChanges table
    const findLinks = await prisma.familylinks.findMany({
      where: {
        OR: [
          {
            linkFrom: userId.toLowerCase(),
          },
        ],
      },
    });

    findLinks.map(async (link) => {
      const changeHistory = await prisma.syncChanges.create({
        data: {
          userChanged: userId,
          changedBy: userId,
          changeType: "DELETE",
          table: "F9",
          recordId: link.id,
          familyMember: link.linkTo,
        },
      });
      if (!changeHistory) throw new HTTPError("Could not track change", 204);
    });

    //3. Delete all family Links
    const deleteFamily = await prisma.familylinks.deleteMany({
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
      throw new HTTPError("Could not delete family links", 500);

    //4. delete the user permanently
    const deleteUser = await prisma.users.delete({
      where: {
        id: userId.toLowerCase(),
      },
    });

    if (!deleteUser) throw new HTTPError("Could Not delete User", 500);

    return {
      success: true,
      message: `User with id ${deleteUser.id} successfully deleted`,
      id: deleteUser.id,
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

export const getHomePageData = async (
  user: TokenData,
  { famCareMemberId }: ParsedQs
) => {
  try {
    let HomePageData;
    if (famCareMemberId) {
      const response = await getMemberDataById(
        user,
        (famCareMemberId as string)?.toLowerCase()
      );
      if (response.success) HomePageData = response.HomePageData;
    } else {
      const userData = await prisma.users.findFirst({
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
      if (!userData) throw new HTTPError("Could Not Find User", 404);

      const {
        refreshToken,
        password,
        healthRecord,
        notes,
        appointment,
        medicine,
        ...filteredData
      } = userData;

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
      const getAllFamilyMembers = await prisma.familylinks.findMany({
        where: {
          linkFrom: user.id,
        },
      });

      const [memberData, selfAwareness, advertisements] = await Promise.all([
        FamilyMembersData(getAllFamilyMembers),
        getUserVitalModules(user, {}),
        getAllAdvertisements(user, {}),
      ]);

      //get notification count
      const notifCount = await prisma.notifications.count({
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
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      HomePageData,
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

//syncing changes
export const getUserSyncedData = async (
  user: TokenData,
  { lastSyncDate, famCareMemberId }: ParsedQs
) => {
  try {
    let updatedData;
    if (famCareMemberId) {
      //1. get all distinct records
      const distinctRecords = await prisma.syncChanges.findMany({
        where: {
          userChanged: (famCareMemberId as string)?.toLowerCase(),
          familyMember: user.id,
          synced: false,
        },
        orderBy: {
          createdAt: "desc",
        },
        distinct: ["table", "changeType", "userChanged", "familyMember"],
      });
      updatedData = await getUpdatedData(distinctRecords);

      if (!updatedData)
        throw new HTTPError("Could not fetch updated data", 404);

      if (updatedData.success) {
        const linkSync = await prisma.familylinks.updateMany({
          where: {
            linkTo: (famCareMemberId as string)?.toLowerCase(),
            linkFrom: user.id,
          },
          data: {
            synced: true,
          },
        });
        const syncTrue = await prisma.syncChanges.updateMany({
          where: {
            userChanged: (famCareMemberId as string)?.toLowerCase(),
            familyMember: user.id,
          },
          data: {
            synced: true,
          },
        });
        if (!syncTrue || !linkSync)
          throw new HTTPError(
            "Could not update sync flag for family member",
            500
          );
      }
    } else {
      const filters: any = {};

      if (lastSyncDate) {
        filters.createdAt = { gte: formatDateForDB(lastSyncDate as string) };
      }

      // get all distinct changes
      const distinctRecords = await prisma.syncChanges.findMany({
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

      updatedData = await getUpdatedData(distinctRecords);
      if (!updatedData)
        throw new HTTPError("Could not fetch updated data", 500);

      if (updatedData.success) {
        const linkSync = await prisma.syncChanges.updateMany({
          where: {
            userChanged: user.id,
            familyMember: user.id,
          },
          data: {
            synced: true,
          },
        });

        const syncTrue = await prisma.users.update({
          where: {
            id: user.id,
          },
          data: {
            isSync: true,
          },
        });
        if (!syncTrue || !linkSync)
          throw new HTTPError(
            "Could not update sync flag for logged in user",
            500
          );
      }
    }
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      lastSyncDate: new Date(),
      Data: updatedData.Data,
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

//user feedback & complaint
export const addUserMessage = async (
  userId: string,
  data: { emailId: string; message: string; type: MessageType }
) => {
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
    const addMessage = await prisma.userMessage.create({
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
      throw new HTTPError("Could not record message from user", 500);

    //2.send mail
    if (type === "complaint") {
      console.log("i am in");
      console.log(addMessage.emailId);
      const sendReplyToUser = await ComplaintReplyEmail(
        {
          emailId: addMessage.emailId ? addMessage.emailId : "",
          user_complaintId: complaintId, //TODO
          name: addMessage.user?.fullName as string,
        },
        AutocomplaintReply
      );
      if (!sendReplyToUser) {
        throw new HTTPError("Could not send reply to user", 612);
      }
    }

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    const returnData = {
      success: true,
      message: `${addMessage.messageType} was recorded successfully.`,
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

//block user
export const blockUserWithReason = async (
  data: {
    userId: string;
    reason: string;
  },
  admin: adminTokenData
) => {
  try {
    if (!data) throw new HTTPError("Required Data missing", 422);

    const { userId, reason } = data;

    //1. find User
    const findUser = await prisma.users.findFirst({
      where: {
        id: userId.toLowerCase(),
      },
    });
    if (!findUser) throw new HTTPError("User to block not found", 404);

    //2. Record reason for block
    const recordBlock = await prisma.blockReasons.create({
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
      throw new HTTPError("Reason for blocakge could not be recorded", 500);

    //3. Block User
    const blockUser = await prisma.users.update({
      where: {
        id: userId.toLowerCase(),
      },
      data: {
        isBlocked: true,
        blockedAt: new Date(),
      },
    });
    if (!blockUser) throw new HTTPError("Could not block user", 500);
    const returnData = {
      success: true,
      message: `User ${userId} has been blocked due to ${reason}`,
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

//un-block user
export const unblockUser = async (userId: string) => {
  try {
    if (!userId) throw new HTTPError("Required Data missing", 422);

    //1. find User
    const findUser = await prisma.users.findFirst({
      where: {
        id: userId.toLowerCase(),
      },
    });
    if (!findUser) throw new HTTPError("User to un-block not found", 404);

    //check if user is blocked
    const findUnblock = await prisma.users.findFirst({
      where: {
        id: userId.toLowerCase(),
        isBlocked: true,
      },
    });
    if (!findUnblock)
      throw new HTTPError(`User with  ${userId} is not blocked`, 500);

    //2. Un-Block User
    const unblock = await prisma.users.update({
      where: {
        id: userId.toLowerCase(),
      },
      data: {
        isBlocked: false,
      },
    });
    if (!unblock) throw new HTTPError("Could not un-block user", 500);
    const returnData = {
      success: true,
      message: `User ${userId} has been un-blocked by super-admin`,
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
