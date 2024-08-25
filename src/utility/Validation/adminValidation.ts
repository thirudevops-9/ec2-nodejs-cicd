import { z } from "zod";
import { emailString } from "./userValidation";

export const emailStringValidation = z.object({
  emailId: emailString,
});
export const createSuperAdminValidation = z.object({
  emailId: emailString,
  // password: z.string().min(1, "Password is required"),
  fullName: z.string().min(1, "Fullname is required"),
  position: z.string().min(1, "position is required"),
});

export const verifyOtp = z.object({
  emailId: emailString,
  otp: z.number().min(4),
});

export const updateSuperAdminValidation = z.object({
  emailId: emailString.optional(),
  fullName: z.string().min(1, "fullname is required").optional(),
  position: z.string().min(1, "Position is required").optional(),
});

export const createAdminAndAuditor = z.object({
  emailId: emailString,
  fullName: z.string().min(1, "Fullname is required"),
  position: z.string().min(1, "position is required"),
  role: z.enum(["ADMIN", "AUDITOR"]),
});
