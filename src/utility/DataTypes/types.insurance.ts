import { Changes, Gender, LinkType, verifiedContactId } from "@prisma/client";
import { String } from "aws-sdk/clients/cloudtrail";
import { DateTime } from "aws-sdk/clients/devicefarm";

export interface uploadInsuranceData {
  policyNum: String;
  policyName: String;
  policyType?: String;
  insuranceProv?: String;
  renewalAt: DateTime;
  ifCoPay?: String;
}

export interface uploadInsuranceToDbInput {
  userId: String;
  linkType?: LinkType;
  form_data: uploadInsuranceData;
  insuranceURL?: String;
  uploadedBy: String;
}

export interface uploadInsuranceInput {
  file?: Express.Multer.File;
  userId: String;
  form_data: uploadInsuranceData;
}

export interface delInsuranceInput {
  userId: String;
  id: String;
}

export interface editInsuranceData {
  policyNum?: String;
  policyName?: String;
  policyType?: String;
  insuranceProv?: String;
  renewalAt?: String;
  ifCoPay?: String;
}

export interface editInsuranceInput {
  file?: Express.Multer.File;
  userId: string;
  form_data: editInsuranceData;
  id: string;
}

export interface DefaultOutput {
  success: boolean;
  message: string;
}
