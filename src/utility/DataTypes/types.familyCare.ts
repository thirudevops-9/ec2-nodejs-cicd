import {
  AccessType,
  Dependant,
  Familylinks,
  Gender,
  HealthRecord,
  LinkType,
  Users,
} from "@prisma/client";

export interface UserData {
  id: string;
}

export interface createDependantType {
  id: string;
  fullName: string;
  // declaration: boolean;
  gender: Gender;
  dob: Date;
  address?: string;
  pincode: string;
  emergencyContact?: string;
  bloodGroup: string;
  presentDiseases?: string[];
  allergies?: string[];
  doctorFullName?: string;
  docAddress?: string;
  docPhoneNumber?: string;
  additionalInformation?: string;
  relation: string;
  profileImage?: string;
}

export interface familyCareNewUser {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  emailId: string;
  password?: string;
  consent: boolean;
  gender: Gender;
  dob: Date;
  address?: string;
  pincode: string;
  emergencyContact?: string;
  bloodGroup: string;
  presentDiseases: string[];
  allergies: string[];
  doctorFullName?: string | null;
  docAddress?: string | null;
  docPhoneNumber?: string | null;
  additionalInformation?: string | null;
  relation: string;
}

export interface ChangeAccessType {
  memberId: string;
  access: AccessType;
  sensitiveAccess: boolean;
}

export interface FamilyLinkType {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  linkFrom: string;
  linkTo: string;
  relation: string;
  linkType: LinkType;
  accessType: AccessType;
  sensitiveDataAccess: boolean;
}

export interface FamilyMemberData {
  D7?: Dependant[];
  U6?: Users[];
  H8?: HealthRecord[];
  F9?: FamilyLinkType[];
}
