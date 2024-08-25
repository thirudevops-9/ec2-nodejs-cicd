import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import { RegisterUserDataFamilyCare } from "../utility/DataTypes/types.user";

import {
  EditFamilyAccess,
  checkSubsriptionStatus,
  createNewDependant,
  createNewUserFamilyCare,
  UnlinkFamilyMember,
  generateOtpExistingAccount,
  getFamilyMembers,
  migrateDependantToUser,
  releaseMinorGenerateOTP,
  verifyCreateExistingUser,
  // generatedOtpDependant,
} from "../services/familyCare.services";

import {
  addNewUserFamilyCareValidation,
  changeAccessValidation,
  dependantRegisterValidation,
  existingUserOtpValidation,
  existingUserValidation,
  releaseMinorInputValidation,
} from "../utility/Validation/familyCareValidations";
import { minorOtpLoginVerificationValidation } from "../utility/Validation/AuthValidation";

export const checkSubscription = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const checkResponse = await checkSubsriptionStatus(user);
    if (!checkResponse)
      throw new HTTPError(`Could Not Create New Dependant`, 204);
    const code = checkResponse.success ? 200 : 400;
    res.status(code).json({ data: checkResponse });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

// export const generateOtpForDependant = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const user = req.user
//     if(!user){
//       throw new HTTPError("Unauthorised", 401)
//     }
//     const data =
//       req.body ??
//       (() => {
//         throw new HTTPError("API Missing body", 422);
//       });
//     if (!data) throw new HTTPError("API Missing body", 422);
//     const validationResponse = registrationValidation.safeParse(data);
//     if (!validationResponse.success) {
//       const errorObj = validationResponse.error.issues
//         .map((issue) => `${issue.path[0]}: ${issue.message}`)
//         .join(" // ");
//       throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
//     }

//     const newUser = await generatedOtpDependant(data,user);
//     if (!newUser)
//       throw new HTTPError("Could Not Generate OTP for minor", 204);
//     const code = newUser.success ? 200 : 400;
//     res.status(code).json(newUser);
//   } catch (err) {
//     if (err instanceof HTTPError) {
//       res.status(err.code).json({ error: { message: err.message } });
//     } else {
//       res.status(500).json({ error: { message: "Internal server error" } });
//     }
//   }
// };

export const fcAddNewUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const linkFromUserid = user?.id as string;
    const data: RegisterUserDataFamilyCare =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    const validationResponse = addNewUserFamilyCareValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    if (!data.id || !data.pincode || !data.bloodGroup || !data.relation) {
      throw new HTTPError("Missing required fields", 422);
    }
    const finalData = {
      ...data,
      linkFromUserid,
    };
    const { id, relation } = data;
    if (!id || !relation || !linkFromUserid)
      throw new HTTPError("Missing Required Fields", 422);

    const addedNewFamilyCareUser = await createNewUserFamilyCare(finalData);
    if (!addedNewFamilyCareUser) {
      throw new HTTPError("could not create new family care user", 204);
    }
    const code = addedNewFamilyCareUser.success ? 200 : 400;
    res.status(code).json({ data: addedNewFamilyCareUser });
  } catch (err) {
    // console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const existingUserSendOtp = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const linkFromUserId = user?.id;
    const linkFromUserName = user?.fullName;
    const validationResponse = existingUserValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const finalData = {
      ...data,
      userData: user,
      linkFromUserName,
    };

    if (!data.uuid || !data.relation) {
      throw new HTTPError("missing required fields", 422);
    }
    const addedExistingUser = await generateOtpExistingAccount(finalData);
    if (!addedExistingUser) {
      throw new HTTPError("could not create a link for existing user", 204);
    }
    const code = addedExistingUser.success ? 200 : 400;
    res.status(code).json({ data: addedExistingUser });
  } catch (err) {
    // console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const createExistingUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const linkFromUserId = user?.id;
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = existingUserOtpValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const finalData = {
      ...data,
      linkFromUserId,
    };

    if (!data.uuid || !data.relation || !data.otp) {
      throw new HTTPError("missing required fiels", 422);
    }
    const user_linked = await verifyCreateExistingUser(finalData);
    if (!user_linked) {
      throw new HTTPError("could not create a link for existing user", 204);
    }
    const code = user_linked.success ? 200 : 400;
    res.status(code).json({ data: user_linked });
  } catch (err) {
    // console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const createDependant = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = dependantRegisterValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (!user) throw new HTTPError("Unauthorised", 401);

    const { fullName, gender, dob, pincode, bloodGroup, relation } = data;
    if (!fullName || !gender || !dob || !pincode || !bloodGroup || !relation) {
      throw new HTTPError("Please provide all required fields", 422);
    }
    // if (!declaration)
    //   throw new HTTPError(
    //     "Declaration for managing minor account is required",
    //     412
    //   );
    const new_dependant = await createNewDependant(data, user);
    if (!new_dependant)
      throw new HTTPError(`Could Not Create New Dependant`, 204);
    const code = new_dependant.success ? 200 : 400;
    res.status(code).json({ data: new_dependant });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getAllFamily = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    if (!user.id) {
      throw new HTTPError("user id missing", 401);
    }

    const queryParams = req.query;

    const allfamily = await getFamilyMembers(user.id, queryParams);
    if (!allfamily) throw new HTTPError(`Could Not find any family`, 204);
    const code = allfamily.success ? 200 : 400;
    res.status(code).json({ data: allfamily });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const changeFamilyAccess = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Missing fields", 422);

    const validationResponse = changeAccessValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const { memberId, access } = data;
    if (!memberId || !access)
      throw new HTTPError("Missing Required Fields", 422);

    const ChangeAccess = await EditFamilyAccess(user, data);
    if (!ChangeAccess) throw new HTTPError(`Could Not change access`, 204);
    const code = ChangeAccess.success ? 200 : 400;
    res.status(code).json({ data: ChangeAccess });
  } catch (err) {
    console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const detachFamilyMember = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const { famCareMemberId } =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    if (!famCareMemberId) throw new HTTPError("Missing fields", 422);

    if (!user.id || !famCareMemberId) {
      throw new HTTPError("Required fields missing", 422);
    }
    const detachUser = await UnlinkFamilyMember(user.id, famCareMemberId);
    if (!detachUser)
      throw new HTTPError(`Could Not Detach User from Family Care`, 204);
    const code = detachUser.success ? 200 : 400;
    res.status(code).json({ data: detachUser });
  } catch (err) {
    // console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const releaseMinorGenerateOtp = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    const validationResponse = releaseMinorInputValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const { minorId, phoneNumber, emailId } = data;
    if ((!minorId && !phoneNumber) || (!minorId && !emailId))
      throw new HTTPError("Missing required fields", 422);

    const detachUser = await releaseMinorGenerateOTP(user, {
      id: minorId,
      phoneNumber: phoneNumber,
      emailId: emailId,
    });
    if (!detachUser)
      throw new HTTPError(`Could Not Detach User from Family Care`, 204);
    const code = detachUser.success ? 200 : 400;
    res.status(code).json({ data: detachUser });
  } catch (err) {
    // console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const releaseMinorVerifyOtp = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse =
      minorOtpLoginVerificationValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const { userId, verifiedContact, otp } = data;
    if (!userId || !verifiedContact || !otp)
      throw new HTTPError("Missing Required Fields", 422);

    const otpverifyResponse = await migrateDependantToUser(user, data);

    if (!otpverifyResponse) throw new HTTPError("Could not migrate minor", 204);
    const code = otpverifyResponse.success ? 200 : 400;
    res.status(code).json(otpverifyResponse);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
