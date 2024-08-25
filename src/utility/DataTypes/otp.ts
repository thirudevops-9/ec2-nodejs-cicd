// export type generateOtpReturnData = {
//   fullName?: string;
//   phoneNumber?: string;
//   emailId?: string;
//   hashedPassword?: string;
//   hashedotp: string;
// };

export enum OtpExpiryEnum {
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
}

export type generateOtpReturnData = {
  success: boolean;
  id: string;
  verified: boolean;
  message: string;
  verifiedContact: string;
  verifiedContactId: string;
};

export type resendOtpReturnData = {
  success: boolean;
  id: string;
  verified: boolean;
  message: string;
};

// export type verifyOtpData = {
//   fullName: string;
//   phoneNumber: string | undefined;
//   //   password?: string;
//   emailId: string | undefined;
//   otp: number;
//   hashedPassword: string;
//   hashedotp: string;
//   newpassword?: string;
//   consent: boolean;
// };

export type verifyOtpData = {
  id: string;
  otp: number;
  consent: boolean;
};

interface UserData {
  fullName?: string;
  emailId: string | null;
  id?: string;
  phoneNumber: string | null;
  hashedPassword?: string; //hashed password for new  user registration and login
}

// export type verifiedOtpReturnData = {
//   user_data?: UserData;
//   success: boolean;
//   verified: boolean;
//   message: string;
// };
export type verifiedOtpReturnData = {
  user_data?: {
    id: string;
    fullName: string;
    phoneNumber?: string | undefined;
    emailId?: string | undefined;
  };
  success: boolean;
  verified: boolean;
  consent?: true;
  message: string;
  unsuccessfullAttempts?: number;
};
