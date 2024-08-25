import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  checkUserSession,
  createNewUser,
  forgotPasswordGenerateOtp,
  forgotPasswordVerifyOtp,
  generateUserRefreshToken,
  generatedOtpRegistration,
  otpLoginGenerate,
  otpLoginVerify,
  passwordLogin,
  resendOtp,
  resetPassword,
  userLogout,
  verifiedOtpRegistration,
} from "../services/auth.services";

import { RegisterUserdata, UserData } from "../utility/DataTypes/types.user";
import {
  generateOtpReturnData,
  verifiedOtpReturnData,
} from "../utility/DataTypes/otp";
import {
  createUserRegistration,
  generateOtpForResetPasswordValidation,
  loginWithPasswordValidation,
  otpLoginGenerateValidation,
  otpLoginVerificationValidation,
  registrationValidation,
  ResendOtpValidation,
  ResetPasswordValidation,
  sessionInputValidation,
  verifyOtpForRegistrationValidation,
  verifyOtpForResetPasswordValidation,
} from "../utility/Validation/AuthValidation";

export const generateOtpForRegistration = async (
  req: Request,
  res: Response
) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = registrationValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const newUser = await generatedOtpRegistration(data);
    if (!newUser)
      throw new HTTPError("Could Not Generate OTP for new User", 204);
    const code = newUser.success ? 200 : 400;
    res.status(code).json(newUser);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const resendOtpRegistration = async (
  req: Request,
  res: Response
): Promise<generateOtpReturnData | void> => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = ResendOtpValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const { id } = data;
    if (!id) {
      throw new HTTPError("Please provide all required fields", 422);
    }
    const newUser = await resendOtp(data);
    if (!newUser) throw new HTTPError("Could Not Resend OTP for new User", 204);
    const code = newUser.success ? 200 : 400;
    res.status(code).json(newUser);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const verifyOtpForRegistration = async (
  req: Request,
  res: Response
): Promise<void | verifiedOtpReturnData> => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse =
      verifyOtpForRegistrationValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const { id, otp, consent } = data;
    if (!id || !otp) {
      throw new HTTPError("please provide all required fields", 422);
    }
    if (!consent) {
      throw new HTTPError("Please provide your consent", 600);
    }
    const otp_data = await verifiedOtpRegistration(data);
    if (!otp_data)
      throw new HTTPError("Could Not Verify OTP for new User", 204);
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

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data: RegisterUserdata =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);

    const validationResponse = createUserRegistration.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    //validations
    if (!data.id || !data.pincode || !data.bloodGroup || !data.deviceToken) {
      throw new HTTPError("Missing required fields", 400);
    }

    const newUserData = await createNewUser(data);

    if (!newUserData) throw new HTTPError("Could Not create new User", 204);
    const code = newUserData.success ? 200 : 400;
    res.status(code).json(newUserData);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const loginWithPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = loginWithPasswordValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const { userId, password, language, deviceToken } = data;
    if (!userId || !password || !language || !deviceToken)
      throw new HTTPError("Missing Required Fields", 422);

    const loginData = await passwordLogin(data);

    if (!loginData) throw new HTTPError("Could Not Log in user", 204);
    const code = loginData.success ? 200 : 400;
    res.status(code).json(loginData);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const checkSession = async (req: Request, res: Response) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = sessionInputValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const { userId } = data;
    if (!userId) {
      throw new HTTPError("missing required field", 422);
    }

    const sessionData = await checkUserSession(data);

    if (!sessionData) throw new HTTPError("Could Not Log in user", 204);
    const code = sessionData.success ? 200 : 400;
    res.status(code).json(sessionData);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const loginWithOtpGenerate = async (req: Request, res: Response) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = otpLoginGenerateValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const { userId } = data;

    if (!userId) {
      throw new HTTPError("please provide all required fields", 422);
    }

    const loginData = await otpLoginGenerate(data);
    if (!loginData)
      throw new HTTPError("Could Not Generate OTP for logging in user", 204);
    const code = loginData.success ? 200 : 400;
    res.status(code).json(loginData);
  } catch (err) {
    // console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const loginWithOtpVerify = async (req: Request, res: Response) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = otpLoginVerificationValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const { userId, verifiedContact, otp, language, deviceToken } = data;
    if (!userId || !verifiedContact || !otp || !language || !deviceToken) {
      throw new HTTPError("please provide all required fields", 422);
    }
    const loginData = await otpLoginVerify(data);

    if (!loginData) throw new HTTPError("Could Not Log in User", 204);
    const code = loginData.success ? 200 : 400;
    res.status(code).json(loginData);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // res.clearCookie("sessionToken");
    const user = req.user; // access user object attached in the middleware

    if (!user) throw new HTTPError("Unauthorised", 401);

    const logoutData = await userLogout(user);

    if (!logoutData || !logoutData.success)
      throw new HTTPError("Could Not Log Out User", 204);
    const code = logoutData.success ? 200 : 400;
    res.clearCookie("sessionToken");
    res.status(code).json(logoutData);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const generateOtpForResetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse =
      generateOtpForResetPasswordValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    if (!data.userId) {
      throw new HTTPError("please provide all required fields", 422);
    }

    const generatedOtpData = await forgotPasswordGenerateOtp(data.userId);
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

export const verifiedOtpForResetPassword = async (
  req: Request,
  res: Response
) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse =
      verifyOtpForResetPasswordValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const { verifiedContact, otp } = data;

    if (!verifiedContact || !otp) {
      throw new HTTPError("Missing required fields", 422);
    }

    const otp_data = await forgotPasswordVerifyOtp(data);
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

export const userResetPassword = async (req: Request, res: Response) => {
  try {
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("API Missing body", 422);
    const validationResponse = ResetPasswordValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const { userId, newpassword } = data;
    if (!userId || !newpassword) {
      throw new HTTPError("please provide all required fields", 422);
    }

    const updated_user = await resetPassword(data);
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

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const data = req.headers.authorization;
    if (!data) throw new HTTPError("Access Token Missing", 400);
    const refreshToken = await generateUserRefreshToken(data);
    if (!refreshToken) throw new HTTPError("could not generate refresh", 204);
    const code = refreshToken.success ? 200 : 400;
    res.status(code).json(refreshToken);
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response): void => {
  console.error("Error caught in errorHandler:", err);
  if (err instanceof HTTPError) {
    res.status(err.code).json({ error: { message: err.message } });
  } else {
    res.status(500).json({ error: { message: "Internal server error" } });
  }
};
