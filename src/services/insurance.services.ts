// import { uploadBill, uploadProfileImage } from "./user.services";
import fs, { link } from "fs";
import utils from "util";
import { ParsedQs } from "qs";
import prisma from "../prisma";
import { TokenData } from "../utility/DataTypes/types.user";
import HTTPError from "../utility/HttpError";
import { uploadFile, uploadProfile } from "../utility/aws/uploadFile";
import { renameFile } from "../utility/renameFiles";
import { deleteFile } from "../utility/aws/deleteFile";
import { editAwsFileName } from "../utility/aws/editFileName";
import { familyLink } from "../utility/familyLinkData";
import { trackActiveSession } from "../utility/changeHistoryTrackFunction";
import {
  delInsuranceInput,
  editInsuranceInput,
  uploadInsuranceInput,
  uploadInsuranceToDbInput,
} from "../utility/DataTypes/types.insurance";
import { formatDateForDB } from "../utility/DateTimeFormatters";
import { filterRecords } from "../utility/RecordList";

const unlinkFile = utils.promisify(fs.unlink);

//upload
export const uploadInsurance = async (
  data: uploadInsuranceInput,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const { file, userId, form_data } = data;
    const currentTimestamp = Date.now();

    //rename file
    let insuranceURL, uploadInsuranceResponse;

    //if in family care
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );
      if (
        linkData.linkType === "existing" ||
        linkData.linkType == "subaccount"
      ) {
        throw new HTTPError(
          "you cannot view/manage insurance of familycare",
          613
        );
      }

      // if (linkData.accessType == "view" || linkData.linkType !== "minor")
      //   throw new HTTPError("You are not authorised to make this change", 401);

      //upload file to s3
      if (file) {
        const renamedFiledata = renameFile(
          file,
          `Insurance_${currentTimestamp}_${file.originalname}`
        );
        const result = await uploadFile(
          renamedFiledata,
          (famCareMemberId as string)?.toLowerCase()
        );
        if (file && !result)
          throw new HTTPError("Could not upload insurance to s3", 502);
        await unlinkFile(renamedFiledata.path);
        insuranceURL = result ? result.Location : undefined;
      }

      //call the function to upload data and url in db
      uploadInsuranceResponse = await uploadInsuranceToDb({
        userId: (famCareMemberId as string)?.toLowerCase(),
        linkType: linkData.linkType,
        form_data,
        insuranceURL,
        uploadedBy: userId,
      });
    } else {
      //upload file to s3
      if (file) {
        const renamedFiledata = renameFile(
          file,
          `Insurance_${currentTimestamp}_${file.originalname}`
        );
        const result = await uploadFile(renamedFiledata, userId);
        if (file && !result)
          throw new HTTPError("Could not upload insurance to s3", 502);
        await unlinkFile(renamedFiledata.path);
        insuranceURL = result ? result.Location : undefined;
      }

      //call the function to upload data and url in db
      uploadInsuranceResponse = await uploadInsuranceToDb({
        userId,
        form_data,
        insuranceURL,
        uploadedBy: userId,
      });
    }
    if (!uploadInsuranceResponse)
      throw new HTTPError(`Could Not add insurance for user ${userId}`, 204);
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    return uploadInsuranceResponse;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

//upload policy to Database
export const uploadInsuranceToDb = async (data: uploadInsuranceToDbInput) => {
  try {
    const { userId, insuranceURL, form_data, uploadedBy, linkType } = data;

    const {
      policyNum,
      policyName,
      policyType,
      insuranceProv,
      renewalAt,
      ifCoPay,
    } = form_data;

    const addInsurance = await prisma.insurance.create({
      data: {
        policyNum,
        policyName,
        policyType,
        insuranceProv,
        renewalAt: formatDateForDB(renewalAt),
        policyImg: insuranceURL,
        ifCoPay: ifCoPay ? parseInt(ifCoPay) : 100,
        createdBy: uploadedBy,
        ...(linkType && linkType === "minor"
          ? {
              dependant: {
                connect: {
                  id: userId,
                },
              },
            }
          : {
              Users: {
                connect: {
                  id: userId,
                },
              },
            }),
      },
    });
    if (!addInsurance)
      throw new HTTPError("Could not store insurance image link", 500);

    return {
      success: true,
      id: addInsurance.id,
      I10: addInsurance,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

//get all policies
export const getUserPolicies = async (
  user: TokenData,
  queryParams: ParsedQs
) => {
  try {
    const { id, famCareMemberId , limit } = queryParams;

    const filters: any = {};

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (
        linkData.linkType === "existing" ||
        linkData.linkType == "subaccount"
      ) {
        throw new HTTPError(
          "you cannot view/manage insurance of familycare",
          613
        );
      }

      linkData.linkType == "minor"
        ? (filters.forDependantId = famCareMemberId)
        : (filters.forUserId = famCareMemberId);
    } else {
      filters.forUserId = user.id;
    }
    if (id) {
      filters.id = parseInt(id as string);
    }

    const all_policies = await prisma.insurance.findMany({
      where: filters,
      // skip: ((page as number) - 1) * 10,
      take: limit ? parseInt(limit as string): undefined,
      // select: {
      //   id: true,
      //   policyNum: true,
      //   policyName: true,
      //   policyImg: true,
      //   policyType: true,
      //   renewalAt: true,
      //   insuranceProv: true,
      //   ifCoPay: true,
      // },
      orderBy: {
        updatedAt: "desc",
      },
    });
    if (!all_policies)
      throw new HTTPError("Could Not fetch insurance data for user", 500);
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    return {
      success: true,
      user_id: user.id,
      I10: all_policies,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

//edit
export const editPolicy = async (
  data: editInsuranceInput,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const { file, userId, form_data, id } = data;

    const currentTimestamp = Date.now();
    const {
      policyNum,
      policyName,
      policyType,
      insuranceProv,
      renewalAt,
      ifCoPay,
    } = form_data;
    let policyURL = null,
      renamedFiledata;

    //check link
    let link;
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );
      link = linkData;
      if (
        linkData.linkType === "existing" ||
        linkData.linkType == "subaccount"
      ) {
        throw new HTTPError(
          "you cannot view/manage insurance of familycare",
          613
        );
      }
    }

    //find existing policy
    const policy_to_update = await prisma.insurance.findFirst({
      where: {
        id: parseInt(id),
        OR: [
          {
            forUserId: famCareMemberId
              ? (famCareMemberId as string)?.toLowerCase()
              : userId,
          },
          { forDependantId: (famCareMemberId as string)?.toLowerCase() },
        ],
      },
    });

    if (!policy_to_update) {
      throw new HTTPError(`Error while fetching the policy`, 500);
    }

    //if file exists, delete from aws and re-upload
    if (file && policy_to_update.policyImg != null) {
      const fileName = decodeURIComponent(
        policy_to_update.policyImg.split("/")[4]
      );
      const result = famCareMemberId
          ? await deleteFile(
              fileName,
              (famCareMemberId as string)?.toLowerCase()
            )
        : await deleteFile(fileName, userId.toLowerCase());
      if (!result) throw new HTTPError("Could not delete file from s3", 502);
      // const filename = file?.originalname.split(".")[0];
      renamedFiledata = renameFile(
        file,
        `Insurance_${currentTimestamp}_${file?.originalname}`
      );
      const file_upload_result = famCareMemberId
        ? await uploadFile(
            renamedFiledata,
            (famCareMemberId as string)?.toLowerCase()
          )
        : await uploadFile(renamedFiledata, userId);
      if (!file_upload_result) {
        throw new HTTPError("Could not upload policy to s3", 502);
      }
      await unlinkFile(renamedFiledata.path);
      policyURL = file_upload_result.Location;
    }
    //else if file and no existing file, upload
    else if (file && policy_to_update.policyImg == null) {
      renamedFiledata = renameFile(
        file,
        `Insurance_${currentTimestamp}_${file?.originalname}`
      );
      const file_upload_result = famCareMemberId
        ? await uploadFile(
            renamedFiledata,
            (famCareMemberId as string)?.toLowerCase()
          )
        : await uploadFile(renamedFiledata, userId);
      if (!file_upload_result) {
        throw new HTTPError("Could not upload bill to s3", 502);
      }
      await unlinkFile(renamedFiledata.path);
      policyURL = file_upload_result.Location;
    }
    //else, keep existing url
    else {
      policyURL = policy_to_update.policyImg;
    }

    const updatePolicy = await prisma.insurance.update({
      where: {
        id: parseInt(id),
        ...(link?.linkType === "minor"
          ? {
              forDependantId: (famCareMemberId as string)?.toLowerCase(),
            }
          : {
              forUserId: (famCareMemberId as string)?.toLowerCase(),
            }),
      },
      data: {
        policyName,
        policyNum,
        policyType,
        insuranceProv,
        renewalAt: renewalAt
          ? formatDateForDB(renewalAt)
          : policy_to_update.renewalAt,
        ifCoPay: ifCoPay ? parseFloat(ifCoPay) : policy_to_update.ifCoPay,
        policyImg: policyURL,
      },
    });

    if (!updatePolicy)
      throw new HTTPError(`Could not store doc image link`, 500);

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "policy editted successfully",
      I10: updatePolicy,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error, 500);
    }
  }
};

//delete insurance policies
export const delPolicies = async (
  data: delInsuranceInput,
  famCareMemberId: string
) => {
  try {
    const { userId, id } = data;
    const policies = id.split(",").map(Number);
    let deletedRecords: number[] = [];

    const policyData = await prisma.insurance.findMany({
      where: {
        id: {
          in: policies.map((policy) => policy),
        },
        AND: [
          {
            forUserId: famCareMemberId
              ? (famCareMemberId as string)?.toLowerCase()
              : userId,
          },
          { forDependantId: (famCareMemberId as string)?.toLowerCase() },
        ],
      },
    });
    if (!policyData || policyData.length != policies.length)
      throw new HTTPError(`Could not find policy`, 404);

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );
      if (
        linkData.linkType === "existing" ||
        linkData.linkType == "subaccount"
      ) {
        throw new HTTPError(
          "you cannot view/manage insurance of familycare",
          401
        );
      }

      const deleteMultple = policyData.map(async (policy) => {
        deletedRecords.push(policy.id);

        // decode filename into actual filename by removing the url encoded values
        if (policy.policyImg) {
          const fileName = decodeURIComponent(policy.policyImg.split("/")[4]);
          const result = await deleteFile(
            fileName,
            (famCareMemberId as string)?.toLowerCase()
          );
          if (!result)
            throw new HTTPError("Could not delete file from s3", 502);
        }

        const deletePloicies = await prisma.insurance.delete({
          where: {
            id: policy.id,
            ...(linkData.linkType === "minor"
              ? {
                  forDependantId: (famCareMemberId as string)?.toLowerCase(),
                }
              : {
                  forUserId: (famCareMemberId as string)?.toLowerCase(),
                }),
          },
        });
        if (!deletePloicies)
          throw new HTTPError(`Could not delete data from database`, 500);
      });
      if (!deleteMultple)
        throw new HTTPError("Could not delete all policies", 500);
    } else {
      const deleteMultple = policyData.map(async (policy) => {
        deletedRecords.push(policy.id);
        // decode filename into actual filename by removing the url encoded values
        if (policy.policyImg) {
          const fileName = decodeURIComponent(policy.policyImg.split("/")[4]);
          console.log(fileName);
          const result = await deleteFile(fileName, userId.toLowerCase());
          if (!result)
            throw new HTTPError("Could not delete file from s3", 502);
        }

        const deletePloicies = await prisma.insurance.delete({
          where: {
            id: policy.id,
            forUserId: userId,
          },
        });
        if (!deletePloicies)
          throw new HTTPError(`Could not delete data from database`, 500);
      });
      if (!deleteMultple)
        throw new HTTPError("Could not delete all policies", 500);
    }
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    //find successfull and failed records:
    const failedRecords = await filterRecords(deletedRecords, policies);
    return {
      success: true,
      message: "policy(ies) deleted successfully",
      successfullyDeleted: deletedRecords,
      failed: failedRecords,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

export const findNotification = async (userId: string, { id }: ParsedQs) => {
  try {
    const filter: any = {};
    if (id) {
      filter.id = parseInt(id.toString());
    }
    const findNotification = await prisma.notifications.findMany({
      where: {
        userId,
        AND: [filter],
      },
      select: {
        id: true,
        content: true,
        changeAccessOf: true,
        createdAt: true,
        AccessText: true,
      },
    });
    if (!findNotification) {
      throw new HTTPError("notification not found", 404);
    }
    const updateNotificationStatus = await prisma.notifications.updateMany({
      where: {
        userId,
        AND: [filter],
      },
      data: {
        readStatus: true,
      },
    });
    if (!updateNotificationStatus) {
      throw new HTTPError("db error: could not update notifications", 500);
    }
    return {
      success: true,
      data: findNotification,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};
