import { Request, Response } from "express";
import firebase from "firebase-admin";
import HTTPError from "../utility/HttpError";
import {
  addUserMessage,
  blockUserWithReason,
  changeContactOtpVerify,
  removeUserById,
  getAllAppUsers,
  getHomePageData,
  getUserDataById,
  getUserSetting,
  getUserSyncedData,
  newUserContactDetails,
  editUserById,
  updateUserSetting,
  verifyUserPassword,
} from "../services/user.services";
import {
  deleteUserValidation,
  NewContactDetailsValidations,
  updateUserSettingValidation,
  updateUserValidation,
  userComplaintValidation,
  userFeedbackValidation,
} from "../utility/Validation/userValidation";
import { base64ImageValidation } from "../utility/Validation/DocumentValidation";
import {
  detachloginWithPasswordValidation,
  ResetPasswordValidation,
  verifyOtpForDetailsChangeValidation,
  verifyOtpForResetPasswordValidation,
} from "../utility/Validation/AuthValidation";
import {
  getAllAdvertisements,
  getAllFacilities,
  getAllVideos,
} from "../services/contentManagement.services";
import {
  forgotPasswordGenerateOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
} from "../services/auth.services";
import prisma from "../prisma";

//test controller
export const testRoute = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ msg: "success!!" });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//User functions
//!Admin Function
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    const queryParams = req.query;

    const allUser = await getAllAppUsers(queryParams);
    if (!allUser) throw new HTTPError("Could Not Fetch User data", 204);
    const code = allUser.success ? 200 : 400;
    res.status(code).json(allUser);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    if (!user.id) throw new HTTPError("Required Data missing", 422);

    const getSettingsData = await getUserSetting(user.id);

    if (!getSettingsData)
      throw new HTTPError(
        `Could Not update details for user ${req.params.id}`,
        204
      );
    const code = getSettingsData.success ? 200 : 400;
    res.status(code).json({ data: getSettingsData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const updateUserSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Missing required Data", 422);

    const validationResponse = updateUserSettingValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (!data || !user.id) throw new HTTPError("Required Data missing", 422);
    const updatedData = await updateUserSetting(data, user.id);

    if (!updatedData)
      throw new HTTPError(
        `Could Not update details for user ${req.params.id}`,
        204
      );
    const code = updatedData.success ? 200 : 400;
    res.status(code).json({ data: updatedData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    const admin = req.admin;
    const type = req.query.type as string;
    if (!user && !admin) throw new HTTPError("Unauthorised", 401);

    if (user && user.id !== (req.params.id as string))
      throw new HTTPError("Id not matching authorised user", 401);

    const userId: string = req.params.id as string;
    if (!type || !userId) throw new HTTPError("Required Data missing", 422);

    const userData = await getUserDataById(userId, type);

    if (!userData)
      throw new HTTPError(
        `Could Not Fetch Data for user ${req.params.id}`,
        204
      );
    const code = userData.success ? 200 : 400;
    res.status(code).json(userData);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const updateUserById = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Missing required Data", 422);

    const queryParams = req.query;

    const validationResponse = updateUserValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (req.body.password || req.body.password == "")
      throw new HTTPError(
        "Validation Error: Password is not subject to change using this API",
        400
      );
    const updatedData = await editUserById(data, user.id, queryParams);

    if (!updatedData)
      throw new HTTPError(
        `Could Not update details for user ${req.params.id}`,
        204
      );
    const code = updatedData.success ? 200 : 400;
    res.status(code).json({ data: updatedData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//reset password flow
//1. Generate OTP
export const protectedGenerateOtpForResetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorised", 401);

    if (!user.id) {
      throw new HTTPError("please provide all required fields", 401);
    }
    const generatedOtpData = await forgotPasswordGenerateOtp(user.id);
    if (!generatedOtpData)
      throw new HTTPError("Could Not Generate OTP for Password Reset", 204);
    const code = generatedOtpData.success ? 200 : 400;
    res.status(code).json(generatedOtpData);
  } catch (err) {
    // console.log("error", err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//2. Verify OTP
export const protectedVerifiedOtpForResetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);

    const input = {
      ...data,
      userId: user.id,
    };
    const validationResponse =
      verifyOtpForResetPasswordValidation.safeParse(input);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const { verifiedContact, otp } = data;

    if (!verifiedContact || !otp || !user.id) {
      throw new HTTPError("Missing required fields", 422);
    }

    const otp_data = await forgotPasswordVerifyOtp(input);
    if (!otp_data)
      throw new HTTPError("Could Not Verify OTP for Password Reset", 204);
    const code = otp_data.success ? 200 : 400;
    res.status(code).json(otp_data);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//3. Reset Password
export const protectedUserResetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const input = {
      userId: user.id,
      newpassword: data.newpassword,
    };
    const validationResponse = ResetPasswordValidation.safeParse(input);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (!user.id || !data.newpassword) {
      throw new HTTPError("please provide all required fields", 422);
    }

    const updated_user = await resetPassword(input);
    if (!updated_user)
      throw new HTTPError("Could Not Reset User Password", 204);
    const code = updated_user.success ? 200 : 400;
    res.status(code).json(updated_user);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//sync changes
export const syncUserChanges = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const queryParams = req.query;

    const syncedData = await getUserSyncedData(user, queryParams);

    if (!syncedData)
      throw new HTTPError(`Could Not get updated data for user`, 204);
    const code = syncedData.success ? 200 : 400;
    res.status(code).json({ data: syncedData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//password verify -> new details -> OTP verify
//1. Verify User Password
export const userPasswordVerify = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Missing required Data", 422);

    const input = {
      ...data,
      userId: user.id,
    };

    const validationResponse =
      detachloginWithPasswordValidation.safeParse(input);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (!user.id || !data.password)
      throw new HTTPError("Missing required fields", 422);

    const verifyPasswordResponse = await verifyUserPassword(input);

    if (!verifyPasswordResponse)
      throw new HTTPError(`Could Not verify passowrd of user ${user.id}`, 204);
    const code = verifyPasswordResponse.success ? 200 : 400;
    res.status(code).json({ data: verifyPasswordResponse });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//2. Take new details and generate otp
export const userNewContact = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Missing required Data", 422);

    const input = {
      ...data,
      id: user.id,
    };

    const validationResponse = NewContactDetailsValidations.safeParse(input);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if ((!user.id && !data.emailId) || (!user.id && !data.phoneNumber))
      throw new HTTPError("Missing required fields", 422);

    const newContactDetails = await newUserContactDetails(input);

    if (!newContactDetails)
      throw new HTTPError(`Could Not verify passowrd of user ${user.id}`, 204);
    const code = newContactDetails.success ? 200 : 400;
    res.status(code).json({ data: newContactDetails });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//3. Verify OTP and change details
export const userOtpVerify = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Missing required Data", 422);

    const input = {
      ...data,
      userId: user.id,
    };

    const validationResponse =
      verifyOtpForDetailsChangeValidation.safeParse(input);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (
      !user.id ||
      !data.verifiedContact ||
      !data.otp ||
      !data.verifiedContactId
    ) {
      throw new HTTPError("please provide all required fields", 422);
    }

    const otpverifyResponse = await changeContactOtpVerify(input);

    if (!otpverifyResponse) throw new HTTPError("Could Not Log in User", 204);
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

export const deleteUserById = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    if (!user) throw new HTTPError("Unauthorised", 401);
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = deleteUserValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    if (!data.reason) throw new HTTPError("Required fields missing", 422);

    const deleteData = {
      reason: data.reason,
      role: "SELF",
      email: "",
    };
    const userData = await removeUserById(user.id, deleteData);
    if (!userData)
      throw new HTTPError(`Could Not delete user ${req.params.id}`, 204);
    const code = userData.success ? 200 : 400;
    res.status(code).json({ data: userData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const splashUserData = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorized", 401);
    const userData = await getHomePageData(user, queryParams);
    if (!userData) throw new HTTPError(`Could Not Redirect User`, 204);
    const code = userData.success ? 200 : 400;
    res.status(code).json({ data: userData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//CONTENT MANAGEMENT
//videos
export const getVideosUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unauthorized", 401);
    }

    const queryParams = req.query;

    const getVideos = await getAllVideos(user, queryParams);
    if (!getVideos) {
      throw new HTTPError("could not get videos", 204);
    }
    const code = getVideos.success ? 200 : 400;
    res.status(code).json({ data: getVideos });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//advertisements
export const getAdvertisementsUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unauthorized", 401);
    }

    const getAdvertisements = await getAllAdvertisements(user, {});
    if (!getAdvertisements) {
      throw new HTTPError("could not get advertisements", 204);
    }
    const code = getAdvertisements.success ? 200 : 400;
    res.status(code).json({ data: getAdvertisements });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//facilities
export const getFacilitiesUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unauthorized", 401);
    }

    const queryParams = req.query;

    const getFacilities = await getAllFacilities(user, queryParams);
    if (!getFacilities) {
      throw new HTTPError("could not get facilities", 204);
    }
    const code = getFacilities.success ? 200 : 400;
    res.status(code).json({ data: getFacilities });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Feedback and Complaints
export const userFeedbackComplaint = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    if (!user) throw new HTTPError("Unauthorized", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("missing api body", 422);

    if (data.type == "complaint") {
      const validationResponse = userComplaintValidation.safeParse(data);
      if (!validationResponse.success) {
        const errorObj = validationResponse.error.issues
          .map((issue) => `${issue.path[0]}: ${issue.message}`)
          .join(" // ");
        throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
      }
    } else {
      const validationResponse = userFeedbackValidation.safeParse(data);
      if (!validationResponse.success) {
        const errorObj = validationResponse.error.issues
          .map((issue) => `${issue.path[0]}: ${issue.message}`)
          .join(" // ");
        throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
      }
    }

    if (!data.message || !data.type || !user.id)
      throw new HTTPError("Required Data missing", 422);

    const feedbackData = await addUserMessage(user.id, data);
    if (!feedbackData) throw new HTTPError(`Could Not add ${data.type}`, 204);
    const code = feedbackData.success ? 200 : 400;
    res.status(code).json({ data: feedbackData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

// //auto-block user
// export const blockUser = async (req: Request, res: Response) => {
//   try {
//     const data =
//       req.body ??
//       (() => {
//         throw new HTTPError("API Missing body", 422);
//       });

//     const { userId, reason } = data;
//     if (!userId || !reason)
//       throw new HTTPError("userId and block reason is needed", 400);

//     const blockUserResponse = await blockUserWithReason(data);
//     if (!blockUserResponse) throw new HTTPError(`Could Not block User`, 204);
//     const code = blockUserResponse.success ? 200 : 400;
//     res.status(code).json({ data: blockUserResponse });
//   } catch (err) {
//     if (err instanceof HTTPError) {
//       res.status(err.code).json({ error: { message: err.message } });
//     } else {
//       res.status(500).json({ error: { message: "Internal server error" } });
//     }
//   }
// };
