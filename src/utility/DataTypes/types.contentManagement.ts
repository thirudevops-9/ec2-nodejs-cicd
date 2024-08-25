import { AdvertisePosition, AdvertiseType } from "@prisma/client";

export interface VideoType {
  vidName: string;
  vidSourceUrl: string;
  vidTags: string;
  isActive: string;
  isSubscribed: string;
  priority: string;
}
export interface InputVideoType{
  file: Express.Multer.File;
  form_data:VideoType
}
export interface EditVideoType {
  file:Express.Multer.File;
  id: number;
  vidName?: string;
  vidSourceUrl?: string;
  vidTags?: string;
  isActive?: string;
  isSubscribed?: string;
  priority?: string;
}



export interface uploadAdvertisementData {
  advName: string;
  advType: AdvertiseType;
  advPosition: AdvertisePosition;
  isActive: string;
  isSubscribed: string;
  advRedirectLink?: string;
  priority: string;
}

export interface uploadAdvertisementInput {
  file: Express.Multer.File;
  form_data: uploadAdvertisementData;
}

export interface editAdvertisementData {
  advName?: string;
  advType?: AdvertiseType;
  advPosition?: AdvertisePosition;
  isActive?: string;
  isSubscribed?: string;
  advRedirectLink?: string;
  priority?: string;
}

export interface editAdvertisementInput {
  file?: Express.Multer.File;
  form_data: editAdvertisementData;
  advId: string;
}

export interface FacilityType {
  facPrimaryName: string;
  facSecondaryName?: string;
  facPhoneNumber: string;
  facAddress: string;
  facPincode: string;
  facSpeciality: string[];
  facType: string;
  isActive: string;
}

export interface EditFacilityType {
  id: number;
  facPrimaryName?: string;
  facSecondaryName?: string;
  facPhoneNumber?: string;
  facAddress?: string;
  facPincode?: string;
  facSpeciality?: string[];
  facType?: string;
  isActive?: string;
}
