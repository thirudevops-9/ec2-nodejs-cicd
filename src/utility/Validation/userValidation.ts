import { z } from "zod";
import { base64String } from "./DocumentValidation";
const String = z.string();
export const numericString = z
  .string()
  .refine((value) => value === "" || /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number or an empty string",
  });

export const emailString = z
  .string()
  .email("Invalid email format")
  .max(280, "Email must be at most 280 characters long")
  .or(z.literal(""));

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

    // Check if the date is valid
    if (isNaN(dobDate.getTime())) {
      return false;
    }

    // Check if the date is less than 100 years old
    return dobDate > hundredYearsAgo && dobDate < now;
  }, "Date of birth must be a valid date less than 130 years old and in the past.");

export const uploadProfileValidation = z.object({
  profileImage: z.any(),
});

export const updateUserValidation = z.object({
  profileImage: base64String.optional(),
  emailId: emailString.optional(),
  phoneNumber: numericString.optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  dob: dobString.optional(),
  address: String.optional(),
  pincode: z.string().min(6, "Pincode should be 6 digits long").optional(),
  emergencyContact: numericString.optional(),
  bloodGroup: z.string().min(1, "Blood group is required").optional(),
  presentDiseases: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  doctorFullName: String.optional(),
  docAddress: String.optional(),
  docPhoneNumber: numericString.optional(),
  additionalInformation: String.optional(),
});

export const deleteUserValidation = z.object({
  reason: z.string().min(1),
});

export const blockUserValidation = z.object({
  userId: z.string().min(1),
  reason: z.string().min(1),
});

export const updateUserSettingValidation = z.object({
  language: z.string().optional(),
  appLock: z.boolean().optional(),
  notification: z.boolean().optional(),
});
export const NewContactDetailsValidations = z.object({
  id: z.string().min(6, "ID must be at least 6 characters long"),
  emailId: emailString.optional(),
  phoneNumber: numericString.optional(),
});

export const userComplaintValidation = z.object({
  emailId: emailString,
  message: String.min(1),
  type: z.enum(["complaint", "feedback"]),
});

export const userFeedbackValidation = z.object({
  emailId: emailString.optional(),
  message: String.min(1),
  type: z.enum(["complaint", "feedback"]),
});
