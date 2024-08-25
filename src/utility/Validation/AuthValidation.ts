import { z } from "zod";
import { emailString } from "./userValidation";
import { base64String } from "./DocumentValidation";
const String = z.string();
// const numericString = z.string().regex(/^\d*$/, "Must be a number");
const numericString = z
  .string()
  .refine((value) => value === "" || /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number or an empty string",
  });

const dobString = z
  .string()
  .date("Date must be of the format YYYY-MM-DD")
  .refine((dob) => {
    const dobDate = new Date(dob);
    const now = new Date();
    const hundredYearsAgo = new Date(
      now.getFullYear() - 130,
      now.getMonth(),
      now.getDate()
    );

    const eighteenYearsAgo = new Date(
      now.getFullYear() - 18,
      now.getMonth(),
      now.getDate()
    );

    // Check if the date is valid
    if (isNaN(dobDate.getTime())) {
      return false;
    }

    // Check if the date is less than 130 years old
    return (
      (dobDate > hundredYearsAgo && dobDate < now) ||
      (dobDate > eighteenYearsAgo && dobDate < now)
    );
  }, "Date of birth must be a valid date : older than 18 years and younger than 130 years of age.");

export const registrationValidation = z
  .object({
    fullName: String.min(3, "Name should be atleast 3 characters long"),
    password: z.string().min(8),
    phoneNumber: numericString.optional(),
    emailId: emailString.optional(),
    country: z.string().min(1, "please provide country of the user"),
  })
  .refine((data) => data.phoneNumber || data.emailId, {
    message: "Either phone number or email id must be provided",
    path: ["phoneNumber,emailId"],
  });

export const ResendOtpValidation = z.object({
  id: z.string().min(6),
});

export const verifyOtpForRegistrationValidation = z.object({
  id: z.string().min(6),
  otp: z.number(),
  consent: z.boolean(),
});

export const createUserRegistration = z.object({
  id: z.string().min(6, "ID must be at least 6 characters long"),
  emailId: String.optional(),
  phoneNumber: numericString.optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .optional(),
  consent: z.boolean().optional(),
  gender: z.enum(["male", "female", "other"]),
  dob: dobString,
  address: String.optional(),
  pincode: z.string().min(6, "Pincode should be 6 digits long"),
  emergencyContact: numericString.optional(),
  bloodGroup: z.string().min(1, "Blood group is required"),
  presentDiseases: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  doctorFullName: String.optional(),
  docAddress: String.optional(),
  docPhoneNumber: numericString.optional(),
  additionalInformation: String.optional(),
  language: String.optional(),
  profileImage: base64String.optional(),
  deviceToken: String.min(1),
});

export const sessionInputValidation = z.object({
  userId: String.min(1),
  password: z
    .string()
    .optional(),
});

export const adminSessionValidation = z.object({
  emailId: String.min(1),
});

export const loginWithPasswordValidation = z.object({
  userId: String.min(1),
  password: z.string().min(8, "Password length should be atleast 8 characters"),
  language: z.string().min(1),
  deviceToken: String.min(1),
});

export const detachloginWithPasswordValidation = z.object({
  userId: String.min(1),
  password: z.string().min(8, "Password length should be atleast 8 characters"),
});

export const otpLoginGenerateValidation = z.object({
  userId: String.min(1),
});

export const otpLoginVerificationValidation = z.object({
  userId: z.string().min(1),
  verifiedContact: z.string().min(1),
  otp: z.number().min(6, "OTP should be 6 digits long"),
  language: z.string().min(1),
  deviceToken: String.min(1),
});

export const minorOtpLoginVerificationValidation = z.object({
  userId: z.string().min(1),
  verifiedContact: z.string().min(1),
  otp: z.number().min(6, "OTP should be 6 digits long"),
});
export const generateOtpForResetPasswordValidation = z.object({
  userId: z.string().min(1),
});

export const verifyOtpForResetPasswordValidation = z.object({
  userId: z.string().min(6, "ID must be at least 6 characters long"),
  verifiedContact: z.string().min(1),
  otp: z.number().min(6, "OTP should be 6 digits long"),
});

export const verifyOtpForDetailsChangeValidation = z.object({
  userId: z.string().min(6, "ID must be at least 6 characters long"),
  verifiedContactId: z.enum(["emailId", "phoneNumber"]),
  verifiedContact: z.string().min(1),
  otp: z.number().min(6, "OTP should be 6 digits long"),
});

export const ResetPasswordValidation = z.object({
  userId: z.string().min(6, "ID must be at least 6 characters long"),
  newpassword: z.string().min(8, "Password must be at least 8 characters long"),
});
