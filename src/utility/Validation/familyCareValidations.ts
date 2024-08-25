import { z } from "zod";
import { base64String } from "./DocumentValidation";
import { emailString } from "./userValidation";
import { AccessType } from "@prisma/client";
const AccessTypeEnum = z.enum([AccessType.view, AccessType.manage]);
const String = z.string();
const numericString = z
  .string()
  .refine((value) => value === "" || /^\d{10}$/.test(value), {
    message: "Must be a valid 10-digit phone number or an empty string",
  });

const MinorDobString = z
  .string()
  .date("Date must be of the format YYYY-MM-DD")
  .refine((dob) => {
    const dobDate = new Date(dob);
    const now = new Date();
    const eighteenYears = new Date(
      now.getFullYear() - 18,
      now.getMonth(),
      now.getDate()
    );

    // Check if the date is valid
    if (isNaN(dobDate.getTime())) {
      return false;
    }

    // Check if the date is less than 100 years old
    return dobDate > eighteenYears && dobDate < now;
  }, "Date of birth must be a valid date less than 18 years old and in the past.");

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

    // Check if the date is less than 130 years old
    return dobDate > hundredYearsAgo && dobDate < now;
  }, "Date of birth must be a valid date less than 130 years old and in the past.");

export const dependantRegisterValidation = z.object({
  //   id: z.string().min(8, "ID must be at least 6 characters long"),
  fullName: String.min(3, "Full Name should be longer than 3 characters"),
  //   phoneNumber: numericString.optional(),
  // declaration: z.boolean(),
  gender: z.enum(["male", "female", "other"]),
  dob: MinorDobString,
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
  relation: String.min(1, "enter valid relation"),
  profileImage: base64String.optional(),

  //   linkingUserId: z.string().min(6, "ID must be at least 6 characters long"),
});

export const addNewUserFamilyCareValidation = z.object({
  id: z.string().min(8, "ID must be at least 8 characters long"),
  emailId: emailString.optional(),
  phoneNumber: numericString.optional(),
  gender: z.enum(["male", "female", "other"]),
  dob: dobString,
  pincode: z.string().min(6, "Pincode should be 6 digits long"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  relation: z.string().min(1, "Relation is required"),
  profileImage: base64String.optional(),
});

export const existingUserValidation = z.object({
  uuid: z.string().min(1, "uuid field is required").max(8),
  relation: z.string().min(2, "minimum 2 letters required for relation"),
});

export const existingUserOtpValidation = z.object({
  uuid: z
    .string()
    .min(1, "uuid field is required and should be 8 characters long")
    .max(8),
  otp: z.number().min(1, "otp is required"),
  relation: z.string().min(2, "minimum 2 letters required for relation"),
});

export const changeAccessValidation = z.object({
  memberId: z
    .string()
    .min(8, "uuid field is required and should be 8 characters long")
    .max(8),
  access: AccessTypeEnum,
  sensitiveAccess: z.boolean().default(false),
});

export const releaseMinorInputValidation = z.object({
  minorId: z.string().min(8, "minor UUID should be 8 digits long"),
  phoneNumber: numericString.optional(),
  emailId: emailString.optional(),
});
