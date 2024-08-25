import prisma from "../prisma";
import { uploadProfile } from "./aws/uploadFile";
import { RegisterUserDataUnion, VerifiedIds } from "./DataTypes/types.user";
import { formatDateForDB } from "./DateTimeFormatters";
import HTTPError from "./HttpError";

export const createUserFunctionality = async (data: RegisterUserDataUnion) => {
  try {
    const {
      id,
      dob,
      consent,
      gender,
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
      createdBy,
      profileImage,
      language,
      appLock,
      deviceToken,
    } = data;
    //existing user and device token match
    const existing_user = await prisma.users.findFirst({
      where: {
        id: id.toLowerCase(),
      },
    });
    if (existing_user) {
      throw new HTTPError(`user  ${id}  already exist`, 422); // user already exist throw error
    }

    const verifiedUser = await prisma.verifiedUsers.findFirst({
      where: {
        userId: id.toLowerCase(),
        isVerified: true,
      },
    });
    if (!verifiedUser)
      throw new HTTPError("User not verified, please generate the otp", 404);

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
      verifiedContactId = "phoneNumber" as VerifiedIds;
    } else {
      verifiedContactId = "emailId" as VerifiedIds;
    }

    if (
      verifiedContactId == "emailId" &&
      data.emailId &&
      data.emailId.toLowerCase() != verifiedUser.emailId
    )
      throw new HTTPError("Verified email not matching entered email", 401);

    if (
      verifiedContactId == "phoneNumber" &&
      data.phoneNumber &&
      data.phoneNumber != verifiedUser.phoneNumber
    )
      throw new HTTPError(
        "Verified phone number not matching entered phone number",
        401
      );

    const formattedDob = formatDateForDB(dob);

    //add profile image
    let profileURL;
    if (profileImage) {
      profileURL = await uploadProfile({
        profileImage: profileImage,
        userId: id.toLowerCase(),
      });
      if (!profileURL?.success)
        throw new HTTPError("Could not upload profile Image to S3", 502);
    }
    let newUser = await prisma.users.create({
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

    await prisma.usersSetting.create({
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

    if (!newUser) throw new HTTPError("Could Not create New User", 500);

    const healthRecord = await prisma.healthRecord.create({
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
      throw new HTTPError("Could Not store health records", 500);

    return {
      success: true,
      ...newUser,
      healthRecord: healthRecord,
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
