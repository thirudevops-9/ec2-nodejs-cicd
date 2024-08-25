import { AccessType, Prisma, verifiedContactId } from "@prisma/client";
import prisma from "../prisma";
import {
  createDependantType,
  ChangeAccessType,
} from "../utility/DataTypes/types.familyCare";
import {
  ExistingUserInput,
  NewContactDetailsInput,
  OtpLoginVerifyInput,
  TokenData,
  VerifyOTPForExistingUserInput,
} from "../utility/DataTypes/types.user";
import { formatDateForDB } from "../utility/DateTimeFormatters";
import { deduceRelation, familyLink } from "../utility/familyLinkData";
import HTTPError from "../utility/HttpError";
import { generateUserId } from "../utility/UserId";
import { createUserFunctionality } from "../utility/CreateUserFunction";
import { RegisterUserDataFamilyCare } from "../utility/DataTypes/types.user";
import { createS3Folder } from "../utility/aws/createFolder";
import {
  OTPFamilyCare,
  OTPmailService,
  ResetPasswordAndChangeContactDetails,
} from "../utility/emailService";
import { getUserByUniqueData } from "./auth.services";
import { createOTP } from "../utility/generateOTP";
import { sendOtpToMobile, sendUUIDToMobile } from "../utility/sendOtp";
import { verifyOTP } from "../utility/verifyOTP";
import { ParsedQs } from "qs";
import { FamilyMembersData } from "../utility/familyMemberData";
import { trackActiveSession } from "../utility/changeHistoryTrackFunction";
import {
  otp_verification_existing_user,
  releaseMinorAccount,
  userId_information,
} from "../templates/userTemplates";
import {
  notificationStore,
  sendNotificationFamilyCare,
} from "../utility/notification";
import { redirectLink } from "../constants/data";
import { uploadProfile } from "../utility/aws/uploadFile";

export const checkSubsriptionStatus = async (data: TokenData) => {
  try {
    if (!data) {
      throw new HTTPError("Unauthorised", 401);
    }
    //check subscription count
    const aggregations = await prisma.familylinks.count({
      where: {
        linkFrom: data.id,
      },
    });

    if (data.subscription == true && aggregations > 5)
      throw new HTTPError(
        "You cannot add new members to your family care with current plan",
        601
      );
    else if (data.subscription == false && aggregations > 2)
      throw new HTTPError(
        "You cannot add new members to your family care with free plan",
        601
      );
    const updateActiveSession = trackActiveSession(data.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "User can add a new member to family care",
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

export const createNewDependant = async (
  data: createDependantType,
  user: TokenData
) => {
  try {
    const {
      fullName,
      // declaration,
      gender,
      dob,
      address,
      pincode,
      emergencyContact,
      bloodGroup,
      relation,
      presentDiseases,
      allergies,
      doctorFullName,
      docAddress,
      docPhoneNumber,
      additionalInformation,
      profileImage,
    } = data;

    //check if adding is possible:
    await checkSubsriptionStatus(user);
    const id = generateUserId();
    let profileURL;
    if (profileImage) {
      profileURL = await uploadProfile({
        profileImage: profileImage,
        userId: id.toLowerCase(),
      });
      if (!profileURL?.success)
        throw new HTTPError("Could not upload profile Image to S3", 502);
    }
    //add user to dependant
    const formattedDob = formatDateForDB(dob);
    const newDependant = await prisma.dependant.create({
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
      throw new HTTPError("Could Not create New Dependant", 500);
    const healthRecord = await prisma.healthRecord.create({
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
      throw new HTTPError("Could Not store health records", 500);
    //add link to family links table
    const addLink = await prisma.familylinks.create({
      data: {
        linkFrom: user.id,
        linkTo: newDependant.id,
        accessType: "manage",
        relation,
        linkType: "minor",
        sensitiveDataAccess: true,
      },
    });
    if (!addLink) throw new HTTPError("Could Not Add the family link", 500);

    //create s3 folder for user
    createS3Folder(newDependant.id.toLowerCase());

    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    return {
      success: true,
      message: `Successfully added new dependant under user ${user.id}`,
      D7: newDependant,
      H8: healthRecord,
      F9: addLink,
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

export const getFamilyMembers = async (
  userId: string,
  queryParams: ParsedQs
) => {
  try {
    const { accessType, linkType, relation } = queryParams;
    const filters: any = {};

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

    const getAllFamilyMembers = await prisma.familylinks.findMany({
      where: {
        AND: [filters],
        linkFrom: userId,
        // linkTo:userId
      },
    });

    if (!getAllFamilyMembers)
      throw new HTTPError("Could not fetch family data", 500);

    
    const getAllDetails = await prisma.familylinks.findMany({
      where: {
        AND: [filters],
        OR :[
        {linkFrom: userId},
        {linkTo:userId}
        ]
      },
    });
    if (!getAllDetails)
      throw new HTTPError("Could not fetch family data", 500);

    const memberData = await FamilyMembersData(getAllFamilyMembers);
    memberData.F9 = getAllDetails
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      family: memberData,
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

export const EditFamilyAccess = async (
  user: TokenData,
  data: ChangeAccessType
) => {
  try {
    const { memberId, access, sensitiveAccess } = data;
    //link from
    const linkFrom = await prisma.users.findFirst({
      where: {
        id: user.id.toLowerCase(),
      },
    });
    if (!linkFrom) {
      throw new HTTPError("user not found", 404);
    }
    const findUser = await prisma.users.findFirst({
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
      throw new HTTPError("user not found", 404);
    }
    const { linkData } = await familyLink(user.id, memberId.toLowerCase());

    if (!linkData)
      throw new HTTPError("Could not fetch family member linking data", 500);

    if (linkData.linkType == "minor" && access == "view")
      throw new HTTPError(
        "Cannot change access type of a minor's account to view-only. To do so, you will have to detach the account",
        401
      );

    const oldAccessType = linkData.accessType;

    const changedAccess = await prisma.familylinks.updateMany({
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
      throw new HTTPError(
        "Could not update access/sensitive access of account",
        500
      );
    const updatedFamilyLinkData = await prisma.familylinks.findFirst({
      where: {
        linkFrom: user.id.toLowerCase(),
        linkTo: memberId.toLowerCase(),
      },
    });

    if (oldAccessType !== access) {
      const notifContent = `${linkFrom.fullName} changed the access from ${oldAccessType} to ${access}`;
      const storeNotification = await notificationStore(
        memberId.toLowerCase(),
        notifContent,
        redirectLink
      );
      if (!storeNotification) {
        throw new HTTPError("could not store notification", 204);
      }
      if (
        findUser &&
        findUser.deviceToken &&
        (findUser.currentSessionId != null ||
          findUser.currentSessionId != "") &&
        (findUser.refreshToken != null || findUser.refreshToken != "") &&
        findUser.setting?.notification === true
      ) {
        await sendNotificationFamilyCare(
          findUser,
          notifContent,
          redirectLink,
          storeNotification.id
        );
      }
    }
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "Access of this account has been changed successfully",
      F9: updatedFamilyLinkData,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error, 500);
    }
  }
};

export const createNewUserFamilyCare = async (
  data: RegisterUserDataFamilyCare
) => {
  try {
    const { id, emailId, relation, linkFromUserid } = data;
    data.createdBy = linkFromUserid.toLowerCase();
    const findUser = await prisma.users.findUnique({
      where: {
        id: linkFromUserid.toLowerCase(),
      },
      select: {
        setting: true,
        fullName: true,
      },
    });
    if (!findUser) {
      throw new HTTPError("User not found", 404);
    }
    data.language = findUser.setting?.language as string;
    const result = await createUserFunctionality(data);
    const { password, refreshToken, healthRecord, ...filteredData } = result;

    if (result.success != true) {
      throw new HTTPError("error creation record of user", 204);
    }

    const familyData = await prisma.familylinks.createMany({
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
          relation: (await deduceRelation(
            relation,
            linkFromUserid.toLowerCase()
          )) as string,
          linkType: "subaccount",
        },
      ],
    });
    if (!familyData) {
      throw new HTTPError("db error: could not link the user", 500);
    }

    const family = await prisma.familylinks.findMany({
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
    //create s3 folder for user
    createS3Folder(result.id.toLowerCase());

    //remove data from temp storage
    const delTempData = await prisma.verifiedUsers.delete({
      where: {
        userId: result.id.toLowerCase(),
      },
    });
    if (!delTempData) {
      throw new HTTPError("db error: could not delete temp data", 500);
    }

    const notifContent = `Congratulations on connecting your profile with ${findUser.fullName}.`;
    const storeNotification = await notificationStore(
      result.id.toLowerCase(),
      notifContent,
      redirectLink,
      linkFromUserid.toLowerCase(),
      findUser.fullName
    );
    if (storeNotification.success !== true) {
      throw new HTTPError("could not store notification", 204);
    }
    const updateActiveSession = trackActiveSession(id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "Successfully added new user",
      U6: filteredData,
      H8: result.healthRecord,
      F9: family,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error, 500);
    }
  }
};

export const generateOtpExistingAccount = async (data: ExistingUserInput) => {
  try {
    const { uuid, linkFromUserName, relation, userData } = data;

    //check if adding is allowed
    await checkSubsriptionStatus(userData);

    //check if uuid is not the logged in user itself
    if (userData.id === uuid) {
      throw new HTTPError("Cannot add yourself as family member", 607);
    }
    //get user
    const user = await getUserByUniqueData(uuid.toLowerCase());
    if (!user) {
      throw new HTTPError("User not found", 404);
    }

    //check if user is already linked with the other user
    const { phoneNumber, emailId } = user;
    // const find_existing_link = await familyLink(linkFromUserId, uuid);
    const find_existing_link = await prisma.familylinks.findFirst({
      where: {
        linkFrom: userData.id.toLowerCase(),
        linkTo: uuid.toLowerCase(),
      },
    });
    if (find_existing_link) {
      throw new HTTPError(
        "You already have access to the user account you are trying to link with.",
        422
      );
    }

    //send otp
    let otp,
      hashedotp = "";

    if (emailId && user.verifiedContactId === "emailId") {
      ({ otp, hashedotp } = await createOTP(emailId + relation, "15m"));
      const responseOtp = await OTPFamilyCare(
        emailId.toLowerCase(),
        linkFromUserName.toLowerCase(),
        user.fullName,
        otp,
        "Attaching your profile in family care of THITO App",
        otp_verification_existing_user
      );
      if (!responseOtp) throw new HTTPError("could not send otp", 612);
    } else if (phoneNumber && user.verifiedContactId == "phoneNumber") {
      ({ otp, hashedotp } = await createOTP(phoneNumber + relation, "5m")); //89898989898friend
      const msg = `${linkFromUserName} has requested to attach your profile with his/her profile, OTP for the same is ${otp}. Sharing the OTP to proceed is considered as consent to attach your profile. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber, msg);
      console.log("OTP SEND TO MOBILE NO", phoneNumber, "otp", otp);
      if (!responseOtp) throw new HTTPError("could not send otp", 612);
    }
    console.log("OTP:::", otp);

    //upsert data in otp store
    const otpStore = await prisma.otpStore.upsert({
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
      throw new HTTPError("db error:could not store otp for the user", 500);
    }

    let response: {
      success: boolean;
      relation: string;
      message: string;
      [key: string]: any;
    } = {
      success: true,
      relation: relation,
      message: "otp send to user successfully",
      verifiedContactId: user.verifiedContactId,
      verifiedContact:
        user.verifiedContactId === "emailId" ? user.emailId : user.phoneNumber,
      uuid: user.id,
    };
    // if (user.verifiedContactId === "emailId") {
    //   response.emailId = emailId?.toLowerCase();
    // } else {
    //   response.phoneNumber = phoneNumber;
    // }
    const updateActiveSession = trackActiveSession(uuid.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return response;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error, 500);
    }
  }
};

export const verifyCreateExistingUser = async (
  data: VerifyOTPForExistingUserInput
) => {
  try {
    //data fetching
    const { uuid, otp, relation, linkFromUserId } = data;
    const findUser = await prisma.users.findFirst({
      where: {
        id: uuid.toLowerCase(),
      },
      include: {
        healthRecord: true,
        setting: true,
      },
    });
    if (!findUser) {
      throw new HTTPError("user you are trying to link to does not exist", 404);
    }
    const linkFrom = await prisma.users.findFirst({
      where: {
        id: linkFromUserId.toLowerCase(),
      },
    });
    if (!linkFrom) {
      throw new HTTPError(
        "user you are trying to link from does not exist",
        404
      );
    }
    const user_otp = await prisma.otpStore.findFirst({
      where: {
        userId: uuid.toLowerCase(),
        createdBy: linkFromUserId.toLowerCase(),
      },
    });
    if (!user_otp) {
      throw new HTTPError("db error:Could not fetch otp for user", 500);
    }
    const userId = (
      user_otp.emailId ? user_otp.emailId.toLowerCase() : user_otp.phoneNumber
    ) as string;

    //verify otp
    const otp_verification = await verifyOTP(
      user_otp.hashedOTP,
      otp,
      userId + relation
    );
    if (!otp_verification) {
      throw new HTTPError("Invalid OTP", 401);
    }

    //delete otp data
    await prisma.otpStore.delete({
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
    const {
      refreshToken,
      healthRecord,
      deviceToken,
      password,
      currentSessionId,
      ...filteredData
    } = findUser;

    //link family
    const family_linking = await prisma.familylinks.createMany({
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
          relation: (await deduceRelation(relation, linkFromUserId)) as string,
          linkType: "existing",
        },
      ],
    });
    if (!family_linking) {
      throw new HTTPError("family linking failed", 500);
    }

    const family = await prisma.familylinks.findMany({
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
    const storeNotification = await notificationStore(
      uuid.toLowerCase(),
      notifContent,
      redirectLink,
      linkFrom.id,
      linkFrom.fullName
    );
    if (storeNotification.success !== true) {
      throw new HTTPError("could not store notification", 204);
    }

    //send notification
    if (
      findUser &&
      findUser.deviceToken &&
      (findUser.currentSessionId != null || findUser.currentSessionId != "") &&
      (findUser.refreshToken != null || findUser.refreshToken != "") &&
      findUser.setting?.notification === true
    ) {
      console.log("in1111");

      const sendNotification = await sendNotificationFamilyCare(
        findUser,
        notifContent,
        redirectLink,
        storeNotification.id
      );
      console.log("send", sendNotification);
      if (!sendNotification) {
        throw new HTTPError("notification could not be send", 502);
      }
    }

    const updateActiveSession = trackActiveSession(uuid.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    //return
    return {
      success: true,
      message: "Congratulation! user linked successfully",
      U6: filteredData,
      H8: healthRecord,
      F9: family,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error, 500);
    }
  }
};

export const UnlinkFamilyMember = async (
  id: string,
  famCareMemberId: string
) => {
  try {
    //link to
    const findUser = await prisma.users.findFirst({
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
      throw new HTTPError("user not found", 404);
    }
    //link from
    const linkFrom = await prisma.users.findFirst({
      where: {
        id: id.toLowerCase(),
      },
    });
    if (!linkFrom) {
      throw new HTTPError("user not found", 404);
    }
    const { linkData } = await familyLink(
      id.toLowerCase(),
      famCareMemberId.toLowerCase()
    );

    if (!linkData)
      throw new HTTPError("Could not fetch family member linking data", 500);

    // const detachLink = await prisma.familylinks.delete({
    //   where: {
    //     id: linkData.id,
    //   },
    // });
    const detachLink = await prisma.familylinks.deleteMany({
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

    if (!detachLink) throw new HTTPError("Could not detach account", 500);
    //store  notification

    const notifContent = `Your profile has successfully disconnected with ${linkFrom.fullName}`;
    const storeNotification = await notificationStore(
      famCareMemberId.toLowerCase(),
      notifContent,
      redirectLink
    );
    if (storeNotification.success != true) {
      throw new HTTPError("could not store notification", 204);
    }
    if (
      findUser &&
      findUser.deviceToken &&
      (findUser.currentSessionId != null || findUser.currentSessionId != "") &&
      (findUser.refreshToken != null || findUser.refreshToken != "") &&
      findUser.setting?.notification === true
    ) {
      console.log("in1111");
      await sendNotificationFamilyCare(
        findUser,
        notifContent,
        redirectLink,
        storeNotification.id
      );
    }

    const updateActiveSession = trackActiveSession(id.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: `The user ${linkData.linkTo} has been successfully detached from family care of user ${id}`,
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

export const releaseMinorGenerateOTP = async (
  user: TokenData,
  data: NewContactDetailsInput
) => {
  try {
    const { id, phoneNumber, emailId } = data;
    const dependantName = await prisma.dependant.findFirst({
      where: {
        id: id.toLowerCase(),
      },
    });
    if (!dependantName) {
      throw new HTTPError("Dependant not found", 404);
    }
    const { linkData } = await familyLink(user.id, id.toLowerCase());

    if (linkData.linkType !== "minor")
      throw new HTTPError("Entered uuid is not a minor", 612);

    if (phoneNumber) {
      const findUser = await getUserByUniqueData(phoneNumber);
      if (findUser)
        throw new HTTPError("User with this phone number already exists", 422);

      // generate OTP
      const { otp, hashedotp } = await createOTP(phoneNumber as string, "5m");
      const msg = `Your profile is getting detached from the ${user.fullName} account, and to create new profile please share the OTP ${otp}. Sharing the OTP to proceed is considered as consent to detach your profile. -STEIGEN HEALTHCARE`;
      const responseOtp = await sendOtpToMobile(phoneNumber as string, msg);
      if (!responseOtp) throw new HTTPError("Could not send OTP", 612);
      //add data to temporary storage
      const changeDetailsUser = await prisma.otpStore.upsert({
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
        throw new HTTPError("Could not store OTP in store", 500);
    } else if (emailId) {
      const findUser = await getUserByUniqueData(emailId.toLowerCase());
      if (findUser)
        throw new HTTPError("User with this email already exists", 422);

      // generate OTP
      const { otp, hashedotp } = await createOTP(emailId.toLowerCase(), "15m");

      const responseOtp = await OTPFamilyCare(
        emailId.toLowerCase(),
        user.fullName,
        dependantName?.fullName, //user
        otp,
        "OTP for detaching your profile in THITO App",
        releaseMinorAccount
      );
      if (!responseOtp) throw new HTTPError("could not send otp", 612);
      //add data to temporary storage
      const changeDetailsUser = await prisma.otpStore.upsert({
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
        throw new HTTPError("Could not store OTP in store", 500);
    }

    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    const returnData = {
      success: true,
      minor_account_id: id.toLowerCase(),
      verifiedContactId: emailId ? "emailId" : "phoneNumber",
      verifiedContact: emailId ? emailId.toLowerCase() : phoneNumber,
      message: "OTP sent successfully",
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

export const migrateDependantToUser = async (
  user: TokenData,
  data: OtpLoginVerifyInput
) => {
  try {
    const { userId, verifiedContact, otp } = data;
    // Step 1: Fetch the dependant's data
    const dependant = await prisma.dependant.findUnique({
      where: { id: userId.toLowerCase() },
    });

    if (!dependant) {
      throw new HTTPError(
        `Dependant with ID ${userId.toLowerCase()} not found`,
        404
      );
    }
    //fetch user data
    const userData = await prisma.users.findFirst({
      where: {
        id: user.id,
      },
    });
    if (!userData)
      throw new HTTPError("Parent user does not exist for minor", 404);
    //get hashed otp
    const findContactChangesUser = await prisma.otpStore.findUnique({
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
      throw new HTTPError("Cannot find User details", 404);

    //check if user entered correct values
    if (
      (findContactChangesUser.emailId &&
        findContactChangesUser.emailId != verifiedContact) ||
      (findContactChangesUser.phoneNumber &&
        findContactChangesUser.phoneNumber != verifiedContact)
    )
      throw new HTTPError("Entered Verified contact is incorrect", 401);

    const hashedotp = findContactChangesUser.hashedOTP;

    const verifyOTP_response = await verifyOTP(
      hashedotp,
      otp,
      findContactChangesUser.emailId
        ? verifiedContact.toLowerCase()
        : verifiedContact
    );

    if (!verifyOTP_response) throw new HTTPError("Invalid OTP", 401);

    // Step 2: Create a new user with the dependant's data
    const verifiedContactType = findContactChangesUser.emailId
      ? "emailId"
      : "phoneNumber";

    const newUser = await prisma.users.create({
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
      prisma.appointment.updateMany({
        where: { forDependantId: userId.toLowerCase() },
        data: updateData,
      }),
      prisma.documents.updateMany({
        where: { forDependantId: userId.toLowerCase() },
        data: updateData,
      }),

      prisma.healthRecord.updateMany({
        where: { forDependantId: userId.toLowerCase() },
        data: updateData,
      }),

      prisma.medicine.updateMany({
        where: { forDependantId: userId.toLowerCase() },
        data: updateData,
      }),

      prisma.notes.updateMany({
        where: { forDependantId: userId.toLowerCase() },
        data: updateData,
      }),
      prisma.vitalsUserData.updateMany({
        where: { forDependantId: userId.toLowerCase() },
        data: updateData,
      }),
      prisma.usersSetting.create({
        data: {
          forUserid: userId.toLowerCase(),
          language: "english",
          notification: false,
          appLock: false,
        },
      }),
    ]);

    if (newUser.emailId && newUser.verifiedContactId == "emailId") {
      ResetPasswordAndChangeContactDetails(
        newUser.emailId.toLowerCase(),
        newUser.id.toLowerCase(),
        "Successful registration in THITO App",
        userId_information,
        newUser.fullName
      );
    } else if (
      newUser.phoneNumber &&
      newUser.verifiedContactId == "phoneNumber"
    ) {
      const msg = `Dear ${newUser.fullName}, welcome to THITO. Your User ID is ${newUser.id.toLowerCase()}. You can use it for login. Stay updated with your health data. -STEIGEN HEALTHCARE`;
      sendOtpToMobile(newUser.phoneNumber, msg);
    }
    // Step 4: Delete the original dependant record and record from OTP store
    const deleteOTPStoreRecord = await prisma.otpStore.delete({
      where: {
        userId_createdBy: {
          userId: userId.toLowerCase(),
          createdBy: user.id,
        },
      },
    });
    if (!deleteOTPStoreRecord)
      throw new HTTPError("could not remove record from OTP Store", 500);

    const deleteDependant = await prisma.dependant.delete({
      where: { id: userId.toLowerCase() },
    });
    if (!deleteDependant)
      throw new HTTPError("could not remove dependant from table", 500);

    //step 5: Unlink minor from guardian's account
    const delLink = await prisma.familylinks.deleteMany({
      where: {
        linkFrom: user.id,
        linkTo: dependant.id,
      },
    });
    if (!delLink)
      throw new HTTPError(
        "could not remove minor from user's family care",
        500
      );
    const updateActiveSession = trackActiveSession(userId.toLowerCase());
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: `Dependant with ID ${userId.toLowerCase()} has been migrated to user`,
      U6: newUser,
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
