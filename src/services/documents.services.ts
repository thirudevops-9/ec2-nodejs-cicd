// import { uploadBill, uploadProfileImage } from "./user.services";
import fs from "fs";
import utils from "util";
import { ParsedQs } from "qs";
import prisma from "../prisma";
import {
  TokenData,
  UploadProfileInput,
  delDocsInput,
  editDocsInput,
  uploadDocData,
  uploadDocsInput,
  uploadDocsToDbInput,
} from "../utility/DataTypes/types.user";
import HTTPError from "../utility/HttpError";
import { uploadFile, uploadProfile } from "../utility/aws/uploadFile";
import { renameFile } from "../utility/renameFiles";
import { deleteFile } from "../utility/aws/deleteFile";
import { editAwsFileName } from "../utility/aws/editFileName";
import { familyLink } from "../utility/familyLinkData";
import {
  trackActiveSession,
  trackChanges,
} from "../utility/changeHistoryTrackFunction";
import { filterRecords } from "../utility/RecordList";

const unlinkFile = utils.promisify(fs.unlink);

//upload
export const uploadDocs = async (
  data: uploadDocsInput,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const { file, userId, form_data } = data;
    const currentTimestamp = Date.now();

    //rename file
    const renamedFiledata = renameFile(
      file,
      `${form_data.category}_${currentTimestamp}_${file.originalname}`
    );

    let uploadDocumentResponse;

    //if in family care
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      //upload file to s3
      const result = await uploadFile(
        renamedFiledata,
        (famCareMemberId as string)?.toLowerCase()
      );
      if (!result) throw new HTTPError("Could not upload document to s3", 502);
      await unlinkFile(renamedFiledata.path);
      const documentURL = result.Location;

      //call the function to upload data and url in db
      uploadDocumentResponse = await uploadDocsToDb({
        userId: (famCareMemberId as string)?.toLowerCase(),
        linkType: linkData.linkType,
        form_data,
        documentURL,
        uploadedBy: userId,
      });

      //track changes (only for linked user / subaccount user)
      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "CREATE",
          uploadDocumentResponse.id,
          "D2",
          userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      //upload file to s3
      const result = await uploadFile(renamedFiledata, userId);
      if (!result) throw new HTTPError("Could not upload document to s3", 502);
      await unlinkFile(renamedFiledata.path);
      const documentURL = result.Location;

      //call the function to upload data and url in db
      uploadDocumentResponse = await uploadDocsToDb({
        userId,
        form_data,
        documentURL,
        uploadedBy: userId,
      });

      // if (!form_data.isSensitive) {
      const changeHistory = await trackChanges(
        userId,
        "CREATE",
        uploadDocumentResponse.id,
        "D2",
        userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
      // }
    }

    if (!uploadDocumentResponse)
      throw new HTTPError(`Could Not add document for user ${userId}`, 502);
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    return uploadDocumentResponse;
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

//upload document to Database
export const uploadDocsToDb = async (data: uploadDocsToDbInput) => {
  try {
    const { userId, documentURL, form_data, uploadedBy } = data;

    const { category, name, dr_name, note, isSensitive, documentLabName } =
      form_data;
    const sensitive = isSensitive == "true" ? true : false;

    const addDocument = await prisma.documents.create({
      data: {
        documentImage: documentURL,
        documentName: name,
        documentCategory: category,
        documentConsultant: dr_name,
        documentLabName,
        notes: note,
        isSensitive: sensitive,
        createdAt: new Date(),
        updatedAt: new Date(),
        uploadedBy,
        ...(data.linkType === "minor"
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
    if (!addDocument)
      throw new HTTPError("Could not store doc in database", 500);

    return {
      success: true,
      id: addDocument.id,
      D2: addDocument,
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

//get all docs
export const getUserDocuments = async (
  user: TokenData,
  queryParams: ParsedQs
) => {
  try {
    if (!user) throw new HTTPError("User Unique Id required", 422);

    const {
      id,
      page = 1,
      documentName,
      category,
      consultant,
      notes,
      famCareMemberId,
      limit,
    } = queryParams;

    const filters: any = {};

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );

      linkData.linkType == "minor"
        ? (filters.forDependantId = famCareMemberId)
        : (filters.forUserId = famCareMemberId);

      if (
        linkData.accessType == "view" &&
        linkData.sensitiveDataAccess == false
      )
        filters.isSensitive = false;

      if (
        linkData.accessType == "manage" &&
        linkData.sensitiveDataAccess == false
      ) {
        filters.isSensitive = false;
        // filters.uploadedBy = user.id;
      }
      if (
        linkData.accessType == "manage" &&
        linkData.sensitiveDataAccess == true
      ) {
        filters.uploadedBy = user.id;
      }
    } else {
      filters.forUserId = user.id;
    }
    if (id) {
      filters.id = parseInt(id as string);
    }
    if (documentName) {
      filters.documentName = {
        contains: documentName,
        mode: "insensitive",
      };
    }
    if (consultant) {
      filters.documentConsultant = {
        contains: consultant,
        mode: "insensitive",
      };
    }
    if (category) {
      filters.documentCategory = {
        contains: category,
        mode: "insensitive",
      };
    }
    if (notes) {
      filters.notes = {
        contains: notes,
        mode: "insensitive",
      };
    }

    const all_documents = await prisma.documents.findMany({
      where: filters,
      // skip: ((page as number) - 1) * 10,
      take: limit ? parseInt(limit as string) : undefined,
      // select: {
      //   id: true,
      //   documentName: true,
      //   documentCategory: true,
      //   documentConsultant: true,
      //   documentImage: true,
      //   notes: true,
      //   isSensitive: true,
      // },
      orderBy: {
        updatedAt: "desc",
      },
    });
    if (!all_documents)
      throw new HTTPError("Could Not fetch documents data for user", 500);
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    return {
      success: true,
      user_id: user.id,
      D2: all_documents,
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
export const editDocs = async (
  data: editDocsInput,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const { file, userId, form_data, id } = data;

    const currentTimestamp = Date.now();
    const { category, name, dr_name, note, isSensitive, documentLabName } =
      form_data;
    let doc_URL, renamedFiledata;
    const sensitive = isSensitive == "true" ? true : false;

    //check link
    let result;
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );
      result = linkData;

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);
    }

    //find existing document
    const file_to_update = await prisma.documents.findFirst({
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

    if (!file_to_update) {
      throw new HTTPError(`Error while fetching the document`, 500);
    }

    if (
      file_to_update.isSensitive == true &&
      result?.sensitiveDataAccess == false
    ) {
      throw new HTTPError("No access to edit sensitive data", 401);
    }
    //delete and reupload the file from db and aws
    if (file) {
      const fileName = decodeURIComponent(
        file_to_update.documentImage.split("/")[4]
      );
      const result = famCareMemberId
        ? await deleteFile(fileName, (famCareMemberId as string)?.toLowerCase())
        : await deleteFile(fileName, userId.toLowerCase());
      if (!result) throw new HTTPError("Could not delete file from s3", 502);
      // const filename = file?.originalname.split(".")[0];
      renamedFiledata = renameFile(
        file,
        `${file_to_update.documentCategory}_${currentTimestamp}_${file?.originalname}`
      );
      const file_upload_result = famCareMemberId
        ? await uploadFile(
            renamedFiledata,
            (famCareMemberId as string)?.toLowerCase()
          )
        : await uploadFile(renamedFiledata, userId);
      if (!result) {
        throw new HTTPError("Could not upload bill to s3", 502);
      }
      await unlinkFile(renamedFiledata.path);
      doc_URL = file_upload_result.Location;
    } else {
      doc_URL = file_to_update.documentImage;
    }

    //rename the file in db
    if (category) {
      const oldKey = decodeURIComponent(doc_URL.split("/")[4]);
      const fileName = oldKey.split("_");
      const newKey = `${category}_${currentTimestamp}_${fileName.slice(2).join("_")}`;
      const url = famCareMemberId
        ? await editAwsFileName(
            oldKey,
            newKey,
            (famCareMemberId as string)?.toLowerCase()
          )
        : await editAwsFileName(oldKey, newKey, userId.toLowerCase());
      if (!url) {
        throw new HTTPError("Could not rename file", 502);
      }
      doc_URL = url;
    }

    const updateDocs = await prisma.documents.update({
      where: {
        id: parseInt(id),
        ...(result?.linkType === "minor"
          ? {
              forDependantId: (famCareMemberId as string)?.toLowerCase(),
            }
          : {
              forUserId: (famCareMemberId as string)?.toLowerCase(),
            }),
      },
      data: {
        documentImage: doc_URL,
        documentName: name,
        documentCategory: category,
        documentConsultant: dr_name,
        documentLabName,
        notes: note,
        isSensitive: sensitive,
        updatedAt: new Date(),
      },
    });

    if (!updateDocs) throw new HTTPError(`Could not update document`, 500);

    //track changes (only for linked user / subaccount user)
    if (result && famCareMemberId && result.linkType != "minor") {
      const changeHistory = await trackChanges(
        (famCareMemberId as string)?.toLowerCase(),
        "UPDATE",
        updateDocs.id,
        "D2",
        userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    } else {
      const changeHistory = await trackChanges(
        userId,
        "UPDATE",
        updateDocs.id,
        "D2",
        userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    }
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "document editted successfully",
      D2: updateDocs,
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

//delete doc
export const delDocs = async (data: delDocsInput, famCareMemberId: string) => {
  try {
    const { userId, id } = data;
    const docs = id.split(",").map(Number);
    let deletedRecords: number[] = [];

    const document_data = await prisma.documents.findMany({
      where: {
        id: {
          in: docs.map((doc) => doc),
        },
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
    if (!document_data || document_data.length != docs.length)
      throw new HTTPError(`Could not find document(s)`, 404);

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      const deleteMultple = document_data.map(async (document) => {
        deletedRecords.push(document.id);
        // decode filename into actual filename by removing the url encoded values
        const fileName = decodeURIComponent(
          document.documentImage.split("/")[4]
        );
        const result = await deleteFile(
          fileName,
          (famCareMemberId as string)?.toLowerCase()
        );
        if (!result) throw new HTTPError("Could not delete file from s3", 502);

        const deleteDocs = await prisma.documents.delete({
          where: {
            id: document.id,
            ...(linkData.linkType === "minor"
              ? {
                  forDependantId: (famCareMemberId as string)?.toLowerCase(),
                }
              : {
                  forUserId: (famCareMemberId as string)?.toLowerCase(),
                }),
          },
        });
        if (!deleteDocs)
          throw new HTTPError(`Could not delete data from database`, 500);

        //track changes (only for linked user / subaccount user)
        if (linkData.linkType != "minor") {
          const changeHistory = await trackChanges(
            (famCareMemberId as string)?.toLowerCase(),
            "DELETE",
            deleteDocs.id,
            "D2",
            userId
          );
          if (!changeHistory.success)
            throw new HTTPError("Could not track change", 204);
        }
      });
      if (!deleteMultple)
        throw new HTTPError("Could not delete all documents", 500);
    } else {
      const deleteMultple = document_data.map(async (document) => {
        deletedRecords.push(document.id);
        // decode filename into actual filename by removing the url encoded values
        const fileName = decodeURIComponent(
          document.documentImage.split("/")[4]
        );
        const result = await deleteFile(fileName, userId.toLowerCase());
        if (!result) throw new HTTPError("Could not delete file from s3", 502);

        const deleteDocs = await prisma.documents.delete({
          where: {
            id: document.id,
            forUserId: userId,
          },
        });
        if (!deleteDocs)
          throw new HTTPError(`Could not delete data from database`, 500);
        const changeHistory = await trackChanges(
          userId,
          "DELETE",
          deleteDocs.id,
          "D2",
          userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      });
      if (!deleteMultple)
        throw new HTTPError("Could not delete all documents", 500);
    }
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    //find successfull and failed records:
    const failedRecords = await filterRecords(deletedRecords, docs);

    return {
      success: true,
      message: "document deleted successfully",
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
