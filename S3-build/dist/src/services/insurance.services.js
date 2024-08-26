"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNotification = exports.delPolicies = exports.editPolicy = exports.getUserPolicies = exports.uploadInsuranceToDb = exports.uploadInsurance = void 0;
// import { uploadBill, uploadProfileImage } from "./user.services";
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const uploadFile_1 = require("../utility/aws/uploadFile");
const renameFiles_1 = require("../utility/renameFiles");
const deleteFile_1 = require("../utility/aws/deleteFile");
const familyLinkData_1 = require("../utility/familyLinkData");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const RecordList_1 = require("../utility/RecordList");
const unlinkFile = util_1.default.promisify(fs_1.default.unlink);
//upload
const uploadInsurance = async (data, { famCareMemberId }) => {
    try {
        const { file, userId, form_data } = data;
        const currentTimestamp = Date.now();
        //rename file
        let insuranceURL, uploadInsuranceResponse;
        //if in family care
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.linkType === "existing" ||
                linkData.linkType == "subaccount") {
                throw new HttpError_1.default("you cannot view/manage insurance of familycare", 613);
            }
            // if (linkData.accessType == "view" || linkData.linkType !== "minor")
            //   throw new HTTPError("You are not authorised to make this change", 401);
            //upload file to s3
            if (file) {
                const renamedFiledata = (0, renameFiles_1.renameFile)(file, `Insurance_${currentTimestamp}_${file.originalname}`);
                const result = await (0, uploadFile_1.uploadFile)(renamedFiledata, famCareMemberId?.toLowerCase());
                if (file && !result)
                    throw new HttpError_1.default("Could not upload insurance to s3", 502);
                await unlinkFile(renamedFiledata.path);
                insuranceURL = result ? result.Location : undefined;
            }
            //call the function to upload data and url in db
            uploadInsuranceResponse = await (0, exports.uploadInsuranceToDb)({
                userId: famCareMemberId?.toLowerCase(),
                linkType: linkData.linkType,
                form_data,
                insuranceURL,
                uploadedBy: userId,
            });
        }
        else {
            //upload file to s3
            if (file) {
                const renamedFiledata = (0, renameFiles_1.renameFile)(file, `Insurance_${currentTimestamp}_${file.originalname}`);
                const result = await (0, uploadFile_1.uploadFile)(renamedFiledata, userId);
                if (file && !result)
                    throw new HttpError_1.default("Could not upload insurance to s3", 502);
                await unlinkFile(renamedFiledata.path);
                insuranceURL = result ? result.Location : undefined;
            }
            //call the function to upload data and url in db
            uploadInsuranceResponse = await (0, exports.uploadInsuranceToDb)({
                userId,
                form_data,
                insuranceURL,
                uploadedBy: userId,
            });
        }
        if (!uploadInsuranceResponse)
            throw new HttpError_1.default(`Could Not add insurance for user ${userId}`, 204);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return uploadInsuranceResponse;
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
exports.uploadInsurance = uploadInsurance;
//upload policy to Database
const uploadInsuranceToDb = async (data) => {
    try {
        const { userId, insuranceURL, form_data, uploadedBy, linkType } = data;
        const { policyNum, policyName, policyType, insuranceProv, renewalAt, ifCoPay, } = form_data;
        const addInsurance = await prisma_1.default.insurance.create({
            data: {
                policyNum,
                policyName,
                policyType,
                insuranceProv,
                renewalAt: (0, DateTimeFormatters_1.formatDateForDB)(renewalAt),
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
            throw new HttpError_1.default("Could not store insurance image link", 500);
        return {
            success: true,
            id: addInsurance.id,
            I10: addInsurance,
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
exports.uploadInsuranceToDb = uploadInsuranceToDb;
//get all policies
const getUserPolicies = async (user, queryParams) => {
    try {
        const { id, famCareMemberId, limit } = queryParams;
        const filters = {};
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            if (linkData.linkType === "existing" ||
                linkData.linkType == "subaccount") {
                throw new HttpError_1.default("you cannot view/manage insurance of familycare", 613);
            }
            linkData.linkType == "minor"
                ? (filters.forDependantId = famCareMemberId)
                : (filters.forUserId = famCareMemberId);
        }
        else {
            filters.forUserId = user.id;
        }
        if (id) {
            filters.id = parseInt(id);
        }
        const all_policies = await prisma_1.default.insurance.findMany({
            where: filters,
            // skip: ((page as number) - 1) * 10,
            take: limit ? parseInt(limit) : undefined,
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
            throw new HttpError_1.default("Could Not fetch insurance data for user", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            user_id: user.id,
            I10: all_policies,
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
exports.getUserPolicies = getUserPolicies;
//edit
const editPolicy = async (data, { famCareMemberId }) => {
    try {
        const { file, userId, form_data, id } = data;
        const currentTimestamp = Date.now();
        const { policyNum, policyName, policyType, insuranceProv, renewalAt, ifCoPay, } = form_data;
        let policyURL = null, renamedFiledata;
        //check link
        let link;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            link = linkData;
            if (linkData.linkType === "existing" ||
                linkData.linkType == "subaccount") {
                throw new HttpError_1.default("you cannot view/manage insurance of familycare", 613);
            }
        }
        //find existing policy
        const policy_to_update = await prisma_1.default.insurance.findFirst({
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
        if (!policy_to_update) {
            throw new HttpError_1.default(`Error while fetching the policy`, 500);
        }
        //if file exists, delete from aws and re-upload
        if (file && policy_to_update.policyImg != null) {
            const fileName = decodeURIComponent(policy_to_update.policyImg.split("/")[4]);
            const result = famCareMemberId
                ? await (0, deleteFile_1.deleteFile)(fileName, famCareMemberId?.toLowerCase())
                : await (0, deleteFile_1.deleteFile)(fileName, userId.toLowerCase());
            if (!result)
                throw new HttpError_1.default("Could not delete file from s3", 502);
            // const filename = file?.originalname.split(".")[0];
            renamedFiledata = (0, renameFiles_1.renameFile)(file, `Insurance_${currentTimestamp}_${file?.originalname}`);
            const file_upload_result = famCareMemberId
                ? await (0, uploadFile_1.uploadFile)(renamedFiledata, famCareMemberId?.toLowerCase())
                : await (0, uploadFile_1.uploadFile)(renamedFiledata, userId);
            if (!file_upload_result) {
                throw new HttpError_1.default("Could not upload policy to s3", 502);
            }
            await unlinkFile(renamedFiledata.path);
            policyURL = file_upload_result.Location;
        }
        //else if file and no existing file, upload
        else if (file && policy_to_update.policyImg == null) {
            renamedFiledata = (0, renameFiles_1.renameFile)(file, `Insurance_${currentTimestamp}_${file?.originalname}`);
            const file_upload_result = famCareMemberId
                ? await (0, uploadFile_1.uploadFile)(renamedFiledata, famCareMemberId?.toLowerCase())
                : await (0, uploadFile_1.uploadFile)(renamedFiledata, userId);
            if (!file_upload_result) {
                throw new HttpError_1.default("Could not upload bill to s3", 502);
            }
            await unlinkFile(renamedFiledata.path);
            policyURL = file_upload_result.Location;
        }
        //else, keep existing url
        else {
            policyURL = policy_to_update.policyImg;
        }
        const updatePolicy = await prisma_1.default.insurance.update({
            where: {
                id: parseInt(id),
                ...(link?.linkType === "minor"
                    ? {
                        forDependantId: famCareMemberId?.toLowerCase(),
                    }
                    : {
                        forUserId: famCareMemberId?.toLowerCase(),
                    }),
            },
            data: {
                policyName,
                policyNum,
                policyType,
                insuranceProv,
                renewalAt: renewalAt
                    ? (0, DateTimeFormatters_1.formatDateForDB)(renewalAt)
                    : policy_to_update.renewalAt,
                ifCoPay: ifCoPay ? parseFloat(ifCoPay) : policy_to_update.ifCoPay,
                policyImg: policyURL,
            },
        });
        if (!updatePolicy)
            throw new HttpError_1.default(`Could not store doc image link`, 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "policy editted successfully",
            I10: updatePolicy,
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
exports.editPolicy = editPolicy;
//delete insurance policies
const delPolicies = async (data, famCareMemberId) => {
    try {
        const { userId, id } = data;
        const policies = id.split(",").map(Number);
        let deletedRecords = [];
        const policyData = await prisma_1.default.insurance.findMany({
            where: {
                id: {
                    in: policies.map((policy) => policy),
                },
                AND: [
                    {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : userId,
                    },
                    { forDependantId: famCareMemberId?.toLowerCase() },
                ],
            },
        });
        if (!policyData || policyData.length != policies.length)
            throw new HttpError_1.default(`Could not find policy`, 404);
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.linkType === "existing" ||
                linkData.linkType == "subaccount") {
                throw new HttpError_1.default("you cannot view/manage insurance of familycare", 401);
            }
            const deleteMultple = policyData.map(async (policy) => {
                deletedRecords.push(policy.id);
                // decode filename into actual filename by removing the url encoded values
                if (policy.policyImg) {
                    const fileName = decodeURIComponent(policy.policyImg.split("/")[4]);
                    const result = await (0, deleteFile_1.deleteFile)(fileName, famCareMemberId?.toLowerCase());
                    if (!result)
                        throw new HttpError_1.default("Could not delete file from s3", 502);
                }
                const deletePloicies = await prisma_1.default.insurance.delete({
                    where: {
                        id: policy.id,
                        ...(linkData.linkType === "minor"
                            ? {
                                forDependantId: famCareMemberId?.toLowerCase(),
                            }
                            : {
                                forUserId: famCareMemberId?.toLowerCase(),
                            }),
                    },
                });
                if (!deletePloicies)
                    throw new HttpError_1.default(`Could not delete data from database`, 500);
            });
            if (!deleteMultple)
                throw new HttpError_1.default("Could not delete all policies", 500);
        }
        else {
            const deleteMultple = policyData.map(async (policy) => {
                deletedRecords.push(policy.id);
                // decode filename into actual filename by removing the url encoded values
                if (policy.policyImg) {
                    const fileName = decodeURIComponent(policy.policyImg.split("/")[4]);
                    console.log(fileName);
                    const result = await (0, deleteFile_1.deleteFile)(fileName, userId.toLowerCase());
                    if (!result)
                        throw new HttpError_1.default("Could not delete file from s3", 502);
                }
                const deletePloicies = await prisma_1.default.insurance.delete({
                    where: {
                        id: policy.id,
                        forUserId: userId,
                    },
                });
                if (!deletePloicies)
                    throw new HttpError_1.default(`Could not delete data from database`, 500);
            });
            if (!deleteMultple)
                throw new HttpError_1.default("Could not delete all policies", 500);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        //find successfull and failed records:
        const failedRecords = await (0, RecordList_1.filterRecords)(deletedRecords, policies);
        return {
            success: true,
            message: "policy(ies) deleted successfully",
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
exports.delPolicies = delPolicies;
const findNotification = async (userId, { id }) => {
    try {
        const filter = {};
        if (id) {
            filter.id = parseInt(id.toString());
        }
        const findNotification = await prisma_1.default.notifications.findMany({
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
            throw new HttpError_1.default("notification not found", 404);
        }
        const updateNotificationStatus = await prisma_1.default.notifications.updateMany({
            where: {
                userId,
                AND: [filter],
            },
            data: {
                readStatus: true,
            },
        });
        if (!updateNotificationStatus) {
            throw new HttpError_1.default("db error: could not update notifications", 500);
        }
        return {
            success: true,
            data: findNotification,
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
exports.findNotification = findNotification;
//# sourceMappingURL=insurance.services.js.map