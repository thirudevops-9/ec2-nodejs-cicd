"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserReminders = exports.deleteMedicine = exports.UpdateMedicineReminders = exports.getMedicineReminders = exports.createNewMedicineReminder = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const familyLinkData_1 = require("../utility/familyLinkData");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const uploadFile_1 = require("../utility/aws/uploadFile");
const deleteFile_1 = require("../utility/aws/deleteFile");
const editFileName_1 = require("../utility/aws/editFileName");
const RecordList_1 = require("../utility/RecordList");
const createNewMedicineReminder = async (data, user, { famCareMemberId }) => {
    try {
        const { medName, medUnit, medInventory, medDoctor, medIntakeTime, medIntakePerDose, medIntakeFrequency, medReminderFrequency, medDosage, MedDosageSchedule, startAt, isRefill, medImage, } = data;
        let medURL;
        let formattedScheduleTime = [];
        if (MedDosageSchedule) {
            MedDosageSchedule.map((scheduleTime) => {
                formattedScheduleTime.push((0, DateTimeFormatters_1.formatTimeForDB)(scheduleTime));
            });
        }
        let new_medicine_reminder;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            if (medImage) {
                medURL = await (0, uploadFile_1.uploadMedicine)({
                    medImage: medImage,
                    userId: famCareMemberId?.toLowerCase(),
                    reminderName: medName,
                });
                if (!medURL?.success)
                    throw new HttpError_1.default("Could not upload medicine Image to S3", 502);
            }
            new_medicine_reminder = await prisma_1.default.medicine.create({
                data: {
                    createdBy: user.id,
                    medName,
                    medUnit: medUnit.toLocaleLowerCase(),
                    medInventory,
                    medDoctor,
                    medIntakeTime: medIntakeTime.toLocaleLowerCase(),
                    medIntakePerDose,
                    medIntakeFrequency: medIntakeFrequency.toLocaleLowerCase(),
                    medReminderFrequency: medReminderFrequency && medReminderFrequency.toLocaleLowerCase(),
                    medDosage,
                    MedDosageSchedule: formattedScheduleTime,
                    startAt,
                    isRefill,
                    medImage: medURL?.Location,
                    ...(linkData.linkType === "minor"
                        ? {
                            dependant: {
                                connect: {
                                    id: famCareMemberId?.toLowerCase(),
                                },
                            },
                        }
                        : {
                            user: {
                                connect: {
                                    id: famCareMemberId?.toLowerCase(),
                                },
                            },
                        }),
                },
            });
            //track changes (only for linked user / subaccount user)
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "CREATE", new_medicine_reminder.id, "M3", user.id);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            if (medImage) {
                medURL = await (0, uploadFile_1.uploadMedicine)({
                    medImage: medImage,
                    userId: user.id.toLowerCase(),
                    reminderName: medName,
                });
                if (!medURL?.success)
                    throw new HttpError_1.default("Could not upload medicine Image to S3", 502);
            }
            new_medicine_reminder = await prisma_1.default.medicine.create({
                data: {
                    createdBy: "self",
                    medName,
                    medUnit: medUnit.toLocaleLowerCase(),
                    medInventory,
                    medDoctor,
                    medIntakeTime: medIntakeTime.toLocaleLowerCase(),
                    medIntakePerDose,
                    medIntakeFrequency: medIntakeFrequency.toLocaleLowerCase(),
                    medReminderFrequency: medReminderFrequency && medReminderFrequency.toLocaleLowerCase(),
                    medDosage,
                    MedDosageSchedule: formattedScheduleTime,
                    startAt,
                    isRefill,
                    medImage: medURL?.Location,
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                },
            });
            if (!new_medicine_reminder)
                throw new HttpError_1.default("Could Not Add new medicine reminder", 500);
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(user.id, "CREATE", new_medicine_reminder.id, "M3", user.id);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            M3: new_medicine_reminder,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createNewMedicineReminder = createNewMedicineReminder;
const getMedicineReminders = async (user, queryParams) => {
    try {
        const { id, medName, medUnit, medDoctor, medIntakeFrequency, medIntakeTime, limit, famCareMemberId, } = queryParams;
        const filters = {};
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            linkData.linkType == "minor"
                ? (filters.forDependantId = famCareMemberId)
                : (filters.forUserId = famCareMemberId);
        }
        else {
            filters.forUserId = user.id;
        }
        if (id) {
            filters.id = parseInt(id.toString());
        }
        if (medName) {
            filters.medName = {
                contains: medName,
                mode: "insensitive",
            };
        }
        if (medUnit) {
            filters.medUnit = {
                contains: medUnit,
                mode: "insensitive",
            };
        }
        if (medDoctor) {
            filters.medDoctor = {
                contains: medDoctor,
                mode: "insensitive",
            };
        }
        if (medIntakeFrequency) {
            filters.medIntakeFrequency = {
                contains: medIntakeFrequency,
                mode: "insensitive",
            };
        }
        if (medIntakeTime) {
            filters.medIntakeTime = {
                contains: medIntakeTime,
                mode: "insensitive",
            };
        }
        const all_med_reminders = await prisma_1.default.medicine.findMany({
            where: filters,
            take: limit ? parseInt(limit) : undefined,
            orderBy: {
                updatedAt: "asc",
            },
        });
        if (!all_med_reminders)
            throw new HttpError_1.default("Could Not fetch medicine reminder data for user", 404);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            user_id: user.id,
            M3: all_med_reminders,
            // medicines: all_med_reminders.map((reminder) => {
            //   return {
            //     id: reminder.id,
            //     medName: reminder.medName,
            //     medUnit: reminder.medUnit,
            //     medInventory: reminder.medInventory,
            //     medDoctor: reminder.medDoctor,
            //     medIntakeTime: reminder.medIntakeTime,
            //     medIntakePerDose: reminder.medIntakePerDose,
            //     medIntakeFrequency: reminder.medIntakeFrequency,
            //     medReminderFrequency: reminder.medReminderFrequency,
            //     medDosage: reminder.medDosage,
            //     MedDosageSchedule: reminder.MedDosageSchedule.map((sched) => {
            //       return formatTime(sched);
            //     }),
            //     startAt: formatDate(reminder.startAt),
            //     isRefill: reminder.isRefill,
            //     medURL: reminder.medImage,
            //   };
            // }),
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getMedicineReminders = getMedicineReminders;
const UpdateMedicineReminders = async (updateMedicineData, { famCareMemberId }) => {
    try {
        const { medName, medUnit, medInventory, medDoctor, medIntakeTime, medIntakePerDose, medIntakeFrequency, medReminderFrequency, medDosage, MedDosageSchedule, startAt, isActive, isRefill, medImage, } = updateMedicineData.data;
        //find existing record
        const existingMedicineData = await prisma_1.default.medicine.findFirst({
            where: {
                id: parseInt(updateMedicineData.medId),
                OR: [
                    {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : updateMedicineData.userId,
                    },
                    {
                        forDependantId: famCareMemberId && famCareMemberId?.toLowerCase(),
                    },
                ],
            },
        });
        if (!existingMedicineData)
            throw new HttpError_1.default("Could not find medicine reminder to update", 404);
        const newMedDosage = medDosage ? medDosage : existingMedicineData.medDosage;
        const newMedDosageSchedule = MedDosageSchedule
            ? MedDosageSchedule
            : existingMedicineData.MedDosageSchedule;
        if (newMedDosageSchedule?.length != newMedDosage)
            throw new HttpError_1.default("Dosage per day doesnt match schedule reminders to give user", 612);
        let formattedScheduleTime = [];
        if (MedDosageSchedule) {
            MedDosageSchedule.map((scheduleTime) => {
                formattedScheduleTime.push((0, DateTimeFormatters_1.formatTimeForDB)(scheduleTime));
            });
        }
        let updatedMedData;
        let medURL;
        let url;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(updateMedicineData.userId, famCareMemberId?.toLowerCase());
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            if (medImage) {
                //1.find the image link from db -> fetch the image name
                const fileName = decodeURIComponent(existingMedicineData.medImage?.split("/")[4] ?? "");
                //2.delete the existing file from aws
                await (0, deleteFile_1.deleteFile)(fileName, famCareMemberId?.toLowerCase());
                //3.upload new file
                medURL = await (0, uploadFile_1.uploadMedicine)({
                    medImage: medImage,
                    userId: famCareMemberId?.toLowerCase(),
                    reminderName: medName ?? existingMedicineData.medName,
                });
                if (!medURL?.success)
                    throw new HttpError_1.default("Could not upload medicine Image to S3", 502);
            }
            if (medName && !medImage && existingMedicineData.medImage) {
                const oldKey = decodeURIComponent(existingMedicineData.medImage?.split("/")[4]);
                const newKey = `medReminderImg_${Date.now()}_${medName}`;
                url = await (0, editFileName_1.editAwsFileName)(oldKey, newKey, famCareMemberId?.toLowerCase());
                if (!url) {
                    throw new HttpError_1.default("Could not rename file", 502);
                }
            }
            updatedMedData = await prisma_1.default.medicine.update({
                where: {
                    id: parseInt(updateMedicineData.medId),
                    ...(linkData.linkType === "minor"
                        ? {
                            forDependantId: famCareMemberId?.toLowerCase(),
                        }
                        : {
                            forUserId: famCareMemberId?.toLowerCase(),
                        }),
                },
                data: {
                    medName,
                    medUnit,
                    medInventory,
                    medDoctor,
                    medIntakeTime,
                    medIntakePerDose,
                    medIntakeFrequency,
                    medReminderFrequency,
                    medDosage,
                    MedDosageSchedule: formattedScheduleTime,
                    startAt,
                    isRefill,
                    isActive,
                    medImage: medURL?.Location,
                },
            });
            if (!updatedMedData) {
                throw new HttpError_1.default("Could Not update medicine reminder data", 500);
            }
            //track changes
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "UPDATE", updatedMedData.id, "M3", updateMedicineData.userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            if (medImage) {
                //1.find the image link from db -> fetch the image name
                const fileName = decodeURIComponent(existingMedicineData.medImage?.split("/")[4] ?? "");
                //2.delete the existing file from aws
                await (0, deleteFile_1.deleteFile)(fileName, updateMedicineData.userId.toLowerCase());
                //3.upload new file
                medURL = await (0, uploadFile_1.uploadMedicine)({
                    medImage: medImage,
                    userId: updateMedicineData.userId.toLowerCase(),
                    reminderName: medName ?? existingMedicineData.medName,
                });
                if (!medURL?.success)
                    throw new HttpError_1.default("Could not upload medicine Image to S3", 502);
            }
            if (medName && !medImage && existingMedicineData.medImage) {
                const oldKey = decodeURIComponent(existingMedicineData.medImage?.split("/")[4]);
                const newKey = `medReminderImg_${Date.now()}_${medName}`;
                url = await (0, editFileName_1.editAwsFileName)(oldKey, newKey, updateMedicineData.userId.toLowerCase());
                if (!url) {
                    throw new HttpError_1.default("Could not rename file", 502);
                }
            }
            updatedMedData = await prisma_1.default.medicine.update({
                where: {
                    id: parseInt(updateMedicineData.medId),
                    forUserId: updateMedicineData.userId,
                },
                data: {
                    medName,
                    medUnit,
                    medInventory,
                    medDoctor,
                    medIntakeTime,
                    medIntakePerDose,
                    medIntakeFrequency,
                    medReminderFrequency,
                    medDosage,
                    MedDosageSchedule: formattedScheduleTime,
                    startAt,
                    isRefill,
                    isActive,
                    medImage: medURL?.Location ?? url,
                },
            });
            if (!updatedMedData) {
                throw new HttpError_1.default("Could Not update medicine reminder data", 500);
            }
            //track changes
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(updateMedicineData.userId, "UPDATE", updatedMedData.id, "M3", updateMedicineData.userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(updateMedicineData.userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "Medicine Appointment updated successfully",
            M3: updatedMedData,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.UpdateMedicineReminders = UpdateMedicineReminders;
const deleteMedicine = async (data, famCareMemberId) => {
    try {
        const { medId, userId } = data;
        const meds = medId.split(",").map(Number);
        let deletedRecords = [];
        //find existing record
        const existingMedicineData = await prisma_1.default.medicine.findMany({
            where: {
                id: {
                    in: meds.map((med) => med),
                },
                OR: [
                    {
                        forUserId: famCareMemberId ? famCareMemberId : userId,
                    },
                    { forDependantId: famCareMemberId },
                ],
            },
        });
        if (!existingMedicineData.length ||
            existingMedicineData.length != meds.length)
            throw new HttpError_1.default("Could not find medicine reminder to delete", 404);
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId);
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            const deleteMultiple = existingMedicineData.map(async (med) => {
                deletedRecords.push(med.id);
                // decode filename into actual filename by removing the url encoded values
                if (med.medImage) {
                    const fileName = decodeURIComponent(med.medImage.split("/")[4]);
                    const result = await (0, deleteFile_1.deleteFile)(fileName, famCareMemberId);
                    if (!result)
                        throw new HttpError_1.default("Could not delete file from s3", 502);
                }
                const deleteAdv = await prisma_1.default.medicine.delete({
                    where: {
                        id: med.id,
                    },
                });
                if (!deleteAdv)
                    throw new HttpError_1.default(`Could not delete data from database`, 500);
            });
            if (!deleteMultiple) {
                throw new HttpError_1.default("Could not delete all reminder(s)", 500);
            }
            //track changes (only for linked user / subaccount user)
            const changes = deletedRecords.map(async (med) => {
                if (linkData.linkType != "minor") {
                    const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId, "DELETE", med, "M3", userId);
                    if (!changeHistory.success)
                        throw new HttpError_1.default("Could not track change", 204);
                }
            });
            if (!changes)
                throw new HttpError_1.default("Could not record changes made", 500);
        }
        else {
            const deleteMultiple = existingMedicineData.map(async (med) => {
                deletedRecords.push(med.id);
                // decode filename into actual filename by removing the url encoded values
                if (med.medImage) {
                    const fileName = decodeURIComponent(med.medImage.split("/")[4]);
                    const result = await (0, deleteFile_1.deleteFile)(fileName, userId);
                    if (!result)
                        throw new HttpError_1.default("Could not delete file from s3", 502);
                }
                const deleteAdv = await prisma_1.default.medicine.delete({
                    where: {
                        id: med.id,
                    },
                });
                if (!deleteAdv)
                    throw new HttpError_1.default(`Could not delete data from database`, 500);
            });
            if (!deleteMultiple) {
                throw new HttpError_1.default("Could not delete all reminder(s)", 500);
            }
            const changes = deletedRecords.map(async (med) => {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "DELETE", med, "M3", userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            });
            if (!changes)
                throw new HttpError_1.default("Could not record changes made", 500);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        //find successfull and failed records:
        const failedRecords = await (0, RecordList_1.filterRecords)(deletedRecords, meds);
        return {
            success: true,
            message: "Medicine Reminder was deleted successfully",
            successfullyDeleted: deletedRecords,
            failed: failedRecords,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.deleteMedicine = deleteMedicine;
const getUserReminders = async (user, { famCareMemberId }) => {
    try {
        if (!user)
            throw new HttpError_1.default("User Unique Id required", 422);
        const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
        if (!linkData)
            throw new HttpError_1.default("Link Does Not exist", 404);
        const all_med_reminders = await prisma_1.default.medicine.findMany({
            where: {
                ...(linkData.linkType === "minor"
                    ? {
                        forDependantId: famCareMemberId?.toLowerCase(),
                    }
                    : {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : user.id,
                    }),
            },
            // select: {
            //   id: true,
            //   medName: true,
            //   medUnit: true,
            //   medInventory: true,
            //   medDoctor: true,
            //   medIntakeTime: true,
            //   medIntakePerDose: true,
            //   medIntakeFrequency: true,
            //   medReminderFrequency: true,
            //   medDosage: true,
            //   MedDosageSchedule: true,
            //   startAt: true,
            //   isRefill: true,
            // },
            orderBy: {
                updatedAt: "asc",
            },
        });
        if (!all_med_reminders)
            throw new HttpError_1.default("Could Not fetch appointments data for user", 404);
        const all_appointments = await prisma_1.default.appointment.findMany({
            where: {
                ...(linkData.linkType === "minor"
                    ? {
                        forDependantId: famCareMemberId?.toLowerCase(),
                    }
                    : {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : user.id,
                    }),
            },
            // select: {
            //   id: true,
            //   doctorName: true,
            //   description: true,
            //   apptDate: true,
            //   apptTime: true,
            // },
            orderBy: {
                apptDate: "asc",
            },
        });
        if (!all_appointments)
            throw new HttpError_1.default("Could Not fetch appointments data for user", 404);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            user_id: user.id,
            M3: all_med_reminders,
            A1: all_appointments,
            // .map((Appt) => {
            //   return {
            //     id: Appt.id,
            //     doctor: Appt.doctorName,
            //     description: Appt.description,
            //     appointment_date: formatDate(Appt.apptDate),
            //     appointment_time: formatTime(Appt.apptTime),
            //   };
            // }),
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getUserReminders = getUserReminders;
//# sourceMappingURL=medicine.services.js.map