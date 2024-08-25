import { s3 } from "../../../config/s3Config";
import fs from "fs";
import dotenv from "dotenv";
import { deleteFile } from "./deleteFile";
dotenv.config();

export const uploadFile = (file: any, folder: string) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = {
    Bucket: `${process.env.AWS_BUCKET_DEV}/${folder}`,
    Body: fileStream,
    Key: file.filename,
    // ContentDisposition: "inline",
  };

  return s3.upload(uploadParams).promise();
};

export const uploadProfile = async (InputData: {
  profileImage: string;
  userId: string;
}) => {
  //delete existing profile image
  await deleteFile("profileImage", InputData.userId.toLowerCase());

  //add new profile
  const base64Data = Buffer.from(
    InputData.profileImage.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const type = InputData.profileImage.split(";")[0].split("/")[1];

  const params = {
    Bucket: `${process.env.AWS_BUCKET_DEV}/${InputData.userId}`,
    Key: `profileImage`,
    Body: base64Data,
    ContentEncoding: "base64",
    ContentType: `image/${type}`,
  };

  const { Location } = await s3.upload(params).promise();
  if (Location)
    return {
      success: true,
      Location,
    };
};

export const uploadMedicine = async (InputData: {
  medImage: string;
  userId: string;
  reminderName: string;
}) => {
  //delete existing profile image
  // await deleteFile(InputData.medImage, InputData.userId.toLowerCase());
  const currentTimeStamp = Date.now();
  //add new profile
  const base64Data = Buffer.from(
    InputData.medImage.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  const type = InputData.medImage.split(";")[0].split("/")[1];
  const params = {
    Bucket: `${process.env.AWS_BUCKET_DEV}/${InputData.userId}`,
    Key: `medReminderImg_${currentTimeStamp}_${InputData.reminderName}`,
    Body: base64Data,
    ContentEncoding: "base64",
    ContentType: `image/${type}`,
  };

  const { Location } = await s3.upload(params).promise();
  if (Location)
    return {
      success: true,
      Location,
    };
};

export const uploadImage = async (InputData: {
  image: string;
  folder: string;
  name: string;
}) => {
  //delete existing profile image
  await deleteFile(`${InputData.name}`, InputData.folder);

  //add new profile
  const base64Data = Buffer.from(
    InputData.image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const type = InputData.image.split(";")[0].split("/")[1];

  const params = {
    Bucket: `${process.env.AWS_BUCKET_DEV}/${InputData.folder}`,
    Key: InputData.name,
    Body: base64Data,
    ContentEncoding: "base64",
    ContentType: `image/${type}`,
  };

  const { Location } = await s3.upload(params).promise();
  if (Location)
    return {
      success: true,
      Location,
    };
};
