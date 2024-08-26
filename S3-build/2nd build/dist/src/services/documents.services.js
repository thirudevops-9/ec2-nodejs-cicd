"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delDocs = exports.editDocs = exports.getUserDocuments = exports.uploadDocsToDb = exports.uploadDocs = void 0;
// import { uploadBill, uploadProfileImage } from "./user.services";
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const uploadFile_1 = require("../utility/aws/uploadFile");
const renameFiles_1 = require("../utility/renameFiles");
const deleteFile_1 = require("../utility/aws/deleteFile");
const editFileName_1 = require("../utility/aws/editFileName");
const familyLinkData_1 = require("../utility/familyLinkData");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const RecordList_1 = require("../utility/RecordList");
const unlinkFile = util_1.default.promisify(fs_1.default.unlink);
//upload
const uploadDocs = async (data, { famCareMemberId }) => {
    try {
        const { file, userId, form_data } = data;
        const currentTimestamp = Date.now();
        //rename file
        const renamedFiledata = (0, renameFiles_1.renameFile)(file, `${form_data.category}_${currentTimestamp}_${file.originalname}`);
        let uploadDocumentResponse;
        //if in family care
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            //upload file to s3
            const result = await (0, uploadFile_1.uploadFile)(renamedFiledata, famCareMemberId?.toLowerCase());
            if (!result)
                throw new HttpError_1.default("Could not upload document to s3", 502);
            await unlinkFile(renamedFiledata.path);
            const documentURL = result.Location;
            //call the function to upload data and url in db
            uploadDocumentResponse = await (0, exports.uploadDocsToDb)({
                userId: famCareMemberId?.toLowerCase(),
                linkType: linkData.linkType,
                form_data,
                documentURL,
                uploadedBy: userId,
            });
            //track changes (only for linked user / subaccount user)
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "CREATE", uploadDocumentResponse.id, "D2", userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            //upload file to s3
            const result = await (0, uploadFile_1.uploadFile)(renamedFiledata, userId);
            if (!result)
                throw new HttpError_1.default("Could not upload document to s3", 502);
            await unlinkFile(renamedFiledata.path);
            const documentURL = result.Location;
            //call the function to upload data and url in db
            uploadDocumentResponse = await (0, exports.uploadDocsToDb)({
                userId,
                form_data,
                documentURL,
                uploadedBy: userId,
            });
            // if (!form_data.isSensitive) {
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "CREATE", uploadDocumentResponse.id, "D2", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
            // }
        }
        if (!uploadDocumentResponse)
            throw new HttpError_1.default(`Could Not add document for user ${userId}`, 502);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return uploadDocumentResponse;
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.uploadDocs = uploadDocs;
//upload document to Database
const uploadDocsToDb = async (data) => {
    try {
        const { userId, documentURL, form_data, uploadedBy } = data;
        const { category, name, dr_name, note, isSensitive, documentLabName } = form_data;
        const sensitive = isSensitive == "true" ? true : false;
        const addDocument = await prisma_1.default.documents.create({
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
            throw new HttpError_1.default("Could not store doc in database", 500);
        return {
            success: true,
            id: addDocument.id,
            D2: addDocument,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.uploadDocsToDb = uploadDocsToDb;
//get all docs
const getUserDocuments = async (user, queryParams) => {
    try {
        if (!user)
            throw new HttpError_1.default("User Unique Id required", 422);
        const { id, page = 1, documentName, category, consultant, notes, famCareMemberId, limit, } = queryParams;
        const filters = {};
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            linkData.linkType == "minor"
                ? (filters.forDependantId = famCareMemberId)
                : (filters.forUserId = famCareMemberId);
            if (linkData.accessType == "view" &&
                linkData.sensitiveDataAccess == false)
                filters.isSensitive = false;
            if (linkData.accessType == "manage" &&
                linkData.sensitiveDataAccess == false) {
                filters.isSensitive = false;
                // filters.uploadedBy = user.id;
            }
            if (linkData.accessType == "manage" &&
                linkData.sensitiveDataAccess == true) {
                filters.uploadedBy = user.id;
            }
        }
        else {
            filters.forUserId = user.id;
        }
        if (id) {
            filters.id = parseInt(id);
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
        const all_documents = await prisma_1.default.documents.findMany({
            where: filters,
            // skip: ((page as number) - 1) * 10,
            take: limit ? parseInt(limit) : undefined,
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
            throw new HttpError_1.default("Could Not fetch documents data for user", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            user_id: user.id,
            D2: all_documents,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getUserDocuments = getUserDocuments;
//edit
const editDocs = async (data, { famCareMemberId }) => {
    try {
        const { file, userId, form_data, id } = data;
        const currentTimestamp = Date.now();
        const { category, name, dr_name, note, isSensitive, documentLabName } = form_data;
        let doc_URL, renamedFiledata;
        const sensitive = isSensitive == "true" ? true : false;
        //check link
        let result;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            result = linkData;
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
        }
        //find existing document
        const file_to_update = await prisma_1.default.documents.findFirst({
            where: {
                id: parseInt(id),
                OR: [
                    {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : userId,
                    },
                    { forDependantId: famCareMemberId?.toLowerCase() },
                ],
            },
        });
        if (!file_to_update) {
            throw new HttpError_1.default(`Error while fetching the document`, 500);
        }
        if (file_to_update.isSensitive == true &&
            result?.sensitiveDataAccess == false) {
            throw new HttpError_1.default("No access to edit sensitive data", 401);
        }
        //delete and reupload the file from db and aws
        if (file) {
            const fileName = decodeURIComponent(file_to_update.documentImage.split("/")[4]);
            const result = famCareMemberId
                ? await (0, deleteFile_1.deleteFile)(fileName, famCareMemberId?.toLowerCase())
                : await (0, deleteFile_1.deleteFile)(fileName, userId.toLowerCase());
            if (!result)
                throw new HttpError_1.default("Could not delete file from s3", 502);
            // const filename = file?.originalname.split(".")[0];
            renamedFiledata = (0, renameFiles_1.renameFile)(file, `${file_to_update.documentCategory}_${currentTimestamp}_${file?.originalname}`);
            const file_upload_result = famCareMemberId
                ? await (0, uploadFile_1.uploadFile)(renamedFiledata, famCareMemberId?.toLowerCase())
                : await (0, uploadFile_1.uploadFile)(renamedFiledata, userId);
            if (!result) {
                throw new HttpError_1.default("Could not upload bill to s3", 502);
            }
            await unlinkFile(renamedFiledata.path);
            doc_URL = file_upload_result.Location;
        }
        else {
            doc_URL = file_to_update.documentImage;
        }
        //rename the file in db
        if (category) {
            const oldKey = decodeURIComponent(doc_URL.split("/")[4]);
            const fileName = oldKey.split("_");
            const newKey = `${category}_${currentTimestamp}_${fileName.slice(2).join("_")}`;
            const url = famCareMemberId
                ? await (0, editFileName_1.editAwsFileName)(oldKey, newKey, famCareMemberId?.toLowerCase())
                : await (0, editFileName_1.editAwsFileName)(oldKey, newKey, userId.toLowerCase());
            if (!url) {
                throw new HttpError_1.default("Could not rename file", 502);
            }
            doc_URL = url;
        }
        const updateDocs = await prisma_1.default.documents.update({
            where: {
                id: parseInt(id),
                ...(result?.linkType === "minor"
                    ? {
                        forDependantId: famCareMemberId?.toLowerCase(),
                    }
                    : {
                        forUserId: famCareMemberId?.toLowerCase(),
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
        if (!updateDocs)
            throw new HttpError_1.default(`Could not update document`, 500);
        //track changes (only for linked user / subaccount user)
        if (result && famCareMemberId && result.linkType != "minor") {
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "UPDATE", updateDocs.id, "D2", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        else {
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "UPDATE", updateDocs.id, "D2", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "document editted successfully",
            D2: updateDocs,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error, 500);
        }
    }
};
exports.editDocs = editDocs;
//delete doc
const delDocs = async (data, famCareMemberId) => {
    try {
        const { userId, id } = data;
        const docs = id.split(",").map(Number);
        let deletedRecords = [];
        const document_data = await prisma_1.default.documents.findMany({
            where: {
                id: {
                    in: docs.map((doc) => doc),
                },
                OR: [
                    {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : userId,
                    },
                    { forDependantId: famCareMemberId?.toLowerCase() },
                ],
            },
        });
        if (!document_data || document_data.length != docs.length)
            throw new HttpError_1.default(`Could not find document(s)`, 404);
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            const deleteMultple = document_data.map(async (document) => {
                deletedRecords.push(document.id);
                // decode filename into actual filename by removing the url encoded values
                const fileName = decodeURIComponent(document.documentImage.split("/")[4]);
                const result = await (0, deleteFile_1.deleteFile)(fileName, famCareMemberId?.toLowerCase());
                if (!result)
                    throw new HttpError_1.default("Could not delete file from s3", 502);
                const deleteDocs = await prisma_1.default.documents.delete({
                    where: {
                        id: document.id,
                        ...(linkData.linkType === "minor"
                            ? {
                                forDependantId: famCareMemberId?.toLowerCase(),
                            }
                            : {
                                forUserId: famCareMemberId?.toLowerCase(),
                            }),
                    },
                });
                if (!deleteDocs)
                    throw new HttpError_1.default(`Could not delete data from database`, 500);
                //track changes (only for linked user / subaccount user)
                if (linkData.linkType != "minor") {
                    const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "DELETE", deleteDocs.id, "D2", userId);
                    if (!changeHistory.success)
                        throw new HttpError_1.default("Could not track change", 204);
                }
            });
            if (!deleteMultple)
                throw new HttpError_1.default("Could not delete all documents", 500);
        }
        else {
            const deleteMultple = document_data.map(async (document) => {
                deletedRecords.push(document.id);
                // decode filename into actual filename by removing the url encoded values
                const fileName = decodeURIComponent(document.documentImage.split("/")[4]);
                const result = await (0, deleteFile_1.deleteFile)(fileName, userId.toLowerCase());
                if (!result)
                    throw new HttpError_1.default("Could not delete file from s3", 502);
                const deleteDocs = await prisma_1.default.documents.delete({
                    where: {
                        id: document.id,
                        forUserId: userId,
                    },
                });
                if (!deleteDocs)
                    throw new HttpError_1.default(`Could not delete data from database`, 500);
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "DELETE", deleteDocs.id, "D2", userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            });
            if (!deleteMultple)
                throw new HttpError_1.default("Could not delete all documents", 500);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        //find successfull and failed records:
        const failedRecords = await (0, RecordList_1.filterRecords)(deletedRecords, docs);
        return {
            success: true,
            message: "document deleted successfully",
            successfullyDeleted: deletedRecords,
            failed: failedRecords,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.delDocs = delDocs;
//# sourceMappingURL=documents.services.js.map