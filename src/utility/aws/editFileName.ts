import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../../config/s3Config";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const editAwsFileName = async (
  oldKey: string,
  newKey: string,
  folder: string
) => {
  // Copy the file to a new key
  const copySource = encodeURIComponent(`${process.env.AWS_BUCKET_DEV}/${folder}/${oldKey}`);

  await s3
    .copyObject({
      Bucket: `${process.env.AWS_BUCKET_DEV}/${folder}`,
      CopySource: copySource,
      Key: newKey,
    })
    .promise();

  // Delete the old file
  await s3
    .deleteObject({
      Bucket: `${process.env.AWS_BUCKET_DEV}/${folder}`,
      Key: oldKey,
    })
    .promise();

  const copiedObjectUrl = `https://${process.env.AWS_BUCKET_DEV}.s3.amazonaws.com/${folder}/${newKey}`;

  return copiedObjectUrl;
};
