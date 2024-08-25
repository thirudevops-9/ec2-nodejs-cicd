import AWS from "aws-sdk";

AWS.config.region = process.env.AWS_REGION_DEV;
const accessKey = process.env.AWS_ACCESS_KEY_DEV;
const secretKey = process.env.AWS_SECRET_ACCESS_KEY_DEV;

AWS.config.update({
  accessKeyId: accessKey,
  secretAccessKey: secretKey,
});
export const s3 = new AWS.S3();
