import { Changes, Gender, LinkType, verifiedContactId } from "@prisma/client";
import { String } from "aws-sdk/clients/cloudtrail";

export interface uploadDocData {
  category: string;
  name: string;
  dr_name?: string;
  documentLabName?: string;
  note?: string;
  isSensitive: string;
}
export interface editDocData {
  category?: string;
  name?: string;
  dr_name?: string;
  documentLabName?: string;
  note?: string;
  isSensitive?: string;
}

export interface uploadDocsToDbInput {
  userId: string;
  form_data: uploadDocData;
  documentURL: string;
  doc_id?: string;
  uploadedBy: string;
  linkType?: LinkType;
}

export interface uploadDocsInput {
  file: Express.Multer.File;
  userId: string;
  form_data: uploadDocData;
}

export interface delDocsInput {
  userId: string;
  id: string;
}

export interface editDocsInput {
  file?: Express.Multer.File;
  userId: string;
  form_data: editDocData;
  id: string;
}

export interface DefaultOutput {
  success: boolean;
  message: string;
}

//Register User Input Data
export interface RegisterUserdata {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  emailId?: string;
  password?: string;
  consent: boolean;
  gender: Gender;
  dob: Date;
  address?: string;
  pincode: string;
  emergencyContact?: string;
  bloodGroup: string;
  country: string;
  presentDiseases: string[];
  allergies: string[];
  doctorFullName?: string | null;
  docAddress?: string | null;
  docPhoneNumber?: string | null;
  additionalInformation?: string | null;
  createdBy: string;
  profileImage?: string;
  language: string;
  appLock: boolean;
  deviceToken:string
}

export interface RegisterUserDataFamilyCare {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  emailId?: string;
  password?: string;
  consent: boolean;
  gender: Gender;
  dob: Date;
  address?: string;
  pincode: string;
  emergencyContact?: string;
  bloodGroup: string;
  createdBy: string;
  presentDiseases: string[];
  allergies: string[];
  doctorFullName?: string | null;
  docAddress?: string | null;
  docPhoneNumber?: string | null;
  additionalInformation?: string | null;
  relation: string;
  linkFromUserid: string;
  profileImage?: string;
  language: string;
  appLock: boolean;
  deviceToken?:string
}

export type RegisterUserDataUnion =
  | RegisterUserDataFamilyCare
  | RegisterUserdata;

export interface ExistingUserInput {
  relation: string;
  uuid: string;
  linkFromUserName: string;
  userData: TokenData;
}

export interface VerifyOTPForExistingUserInput {
  relation: string;
  uuid: string;
  otp: number;
  linkFromUserId: string;
}
//register success output data
export interface RegisterSuccessData {
  message: string;
  success: boolean;
}
export enum VerifiedIds {
  phoneNumber = "phoneNumber",
  enailId = "emailId",
}

//password login input data
export type PasswordLoginData = {
  userId: string;
  password: string;
  language: string;
  deviceToken: string
};

//otp login input data
export interface OtpLoginData {
  userId: string;
}
export interface sessionData {
  userId: string;
  password?: string;
}
//otp generate output data
export interface OtpLoginGenerateResponse {
  success: boolean;
  userId: string;
  phoneNumber: string;
  message: string;
}

export interface OtpLoginVerifyInput {
  userId: string;
  verifiedContact: string;
  otp: number;
  language: string;
  deviceToken:string
}

//login output
export interface LoginOutput {
  message: string;
  success: boolean;
  accessToken?: string | null;
}

//forgot password input
export interface ForgotPasswordInput {
  userId: string;
  verifiedContact: string;
  hashedotp: string;
  otp: number;
}

//reset password input
export interface ResetPasswordInput {
  userId: string;
  newpassword: string;
}

//UserData
export interface UserData {
  id: string;
  fullName: string;
  phoneNumber?: string;
  emailId: string;
  password: string;
  consent: boolean;
  gender: string;
  dob: Date;
  address?: string | null;
  pincode: string;
  emergencyContact?: string | null;
  profileImage?: string | null;
  QRCodeURL?: string | null;
  isSync: boolean;
  isBlocked: boolean;
  // isLoggedIn: boolean;
}

//Token User Data
export type TokenData = {
  id: string;
  fullName: string;
  phoneNumber?: string | null;
  emailId?: string | null;
  isSync: boolean;
  subscription: boolean;
  accessToken?: string;
};

//healthRecords
export interface healthRecord {
  bloodGroup: string;
  presentDiseases: string[];
  allergies: string[];
  doctorFullName?: string | null;
  docAddress?: string | null;
  docPhoneNumber?: string | null;
  additionalInformation?: string | null;
}

export type UpdateData = {
  // id?: string;
  // fullName?: string;
  profileImage?: string;
  phoneNumber?: string;
  emailId?: string;
  gender?: Gender;
  dob?: Date;
  address?: string;
  pincode?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  presentDiseases?: string[];
  allergies?: string[];
  doctorFullName?: string | null;
  docAddress?: string | null;
  docPhoneNumber?: string | null;
  additionalInformation?: string | null;
  // otp?: number;
};

export type UpdateUserSetting = {
  language?: string;
  notification?: boolean;
  appLock?: boolean;
};

//profile image upload
// export interface UploadProfileInput {
//   userId: string;
//   renamedFiledata: Express.Multer.File;
// }
export interface UploadProfileInput {
  userId: string;
  profileImage: string;
}

//new contact details
export interface NewContactDetailsInput {
  id: string;
  emailId?: string;
  phoneNumber?: string;
}

//documents
// export interface BillData {
//   name: string;
//   type: string;
//   bill_dr_name: string;
//   notes?: string;
//   isSensitive: boolean;
// }

// export interface PresciptionData {
//   name: string;
//   type: string;
//   pres_dr_name: string;
//   isSensitive: boolean;
//   clinic_name: string;
// }

// export interface ReportData {
//   name: string;
//   lab_name: string;
//   consultant_name: string;
//   isSensitive: boolean;
// }

// export interface uploadBillInput {
//   userId: string;
//   form_data: BillData;
//   billURL: string;
// }

// export interface uploadPrescriptionInput {
//   userId: string;
//   form_data: PresciptionData;
//   billURL: string;
// }

// export interface uploadReportInput {
//   userId: string;
//   form_data: ReportData;
//   billURL: string;
// }

export interface SyncChangesDataType {
  id: number;
  createdAt: Date;
  changedBy: string;
  userChanged: string;
  changeType: Changes;
  recordId: number;
  table: string;
  familyMember: string;
  synced: boolean;
}

export interface ChangeContactDetailsInput {
  userId: string;
  verifiedContact: string;
  verifiedContactId: verifiedContactId;
  otp: number;
}
