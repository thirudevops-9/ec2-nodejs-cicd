"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppointment = exports.updateAppointment = exports.getUserAppointments = exports.createNewAppointment = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const familyLinkData_1 = require("../utility/familyLinkData");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const createNewAppointment = async (data, user, queryParams) => {
    try {
        const { famCareMemberId } = queryParams;
        const { doctorName, description, apptDate, apptTime } = data;
        const formattedDate = (0, DateTimeFormatters_1.formatDateForDB)(apptDate);
        const formattedTime = `${apptDate}T${apptTime}.000Z`;
        let new_appointment;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            const id = linkData.linkType === "minor" ? "forDependantId" : "forUserId";
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            //find conflicting appointments
            const conflicts = await prisma_1.default.appointment.findMany({
                where: {
                    apptDate: formattedDate,
                    apptTime: formattedTime,
                    [id]: famCareMemberId?.toLowerCase(),
                },
            });
            if (conflicts.length > 0)
                throw new HttpError_1.default("Appointment for entered date and time already exists for user", 609);
            new_appointment = await prisma_1.default.appointment.create({
                data: {
                    createdBy: user.id,
                    doctorName,
                    description,
                    apptDate: formattedDate,
                    apptTime: formattedTime,
                    ...(linkData.linkType === "minor"
                        ? {
                            dependant: {
                                connect: {
                                    id: linkData.linkTo,
                                },
                            },
                        }
                        : {
                            user: {
                                connect: {
                                    id: linkData.linkTo,
                                },
                            },
                        }),
                },
            });
            if (!new_appointment)
                throw new HttpError_1.default("Could Not Add new appointment", 500);
            //track changes (only for linked user / subaccount user)
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "CREATE", new_appointment.id, "A1", user.id);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            console.log(formattedTime);
            //find conflicting appointments
            const conflicts = await prisma_1.default.appointment.findMany({
                where: {
                    apptDate: formattedDate,
                    apptTime: formattedTime,
                    forUserId: user.id?.toLowerCase(),
                },
            });
            if (conflicts.length > 0)
                throw new HttpError_1.default("Appointment for entered date and time already exists for user", 609);
            new_appointment = await prisma_1.default.appointment.create({
                data: {
                    doctorName,
                    description,
                    apptDate: formattedDate,
                    apptTime: formattedTime,
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                },
            });
            if (!new_appointment)
                throw new HttpError_1.default("Could Not Add new appointment", 500);
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(user.id, "CREATE", new_appointment.id, "A1", user.id);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            A1: new_appointment,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createNewAppointment = createNewAppointment;
const getUserAppointments = async (user, queryParams) => {
    try {
        const { id, startDate, endDate, doctorName, description, limit, famCareMemberId, } = queryParams;
        const filters = {};
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            if (!linkData)
                throw new HttpError_1.default("Could not find relation between the users", 404);
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
        filters.apptDate = startDate
            ? { gte: (0, DateTimeFormatters_1.formatDateForDB)(startDate) }
            : { gte: new Date() };
        if (endDate) {
            filters.apptDate.lte = (0, DateTimeFormatters_1.formatDateForDB)(endDate);
        }
        if (doctorName) {
            filters.doctorName = {
                contains: doctorName,
                mode: "insensitive",
            };
        }
        if (description) {
            filters.description = {
                contains: description,
                mode: "insensitive",
            };
        }
        const all_apointments = await prisma_1.default.appointment.findMany({
            where: {
                AND: [
                    filters, // Combine existing filters with upcoming appointments filter
                ],
            },
            take: limit ? parseInt(limit) : undefined,
            orderBy: {
                apptDate: "asc",
            },
        });
        if (!all_apointments)
            throw new HttpError_1.default("Could Not fetch appointments data for user", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            // user_id: user.id,
            A1: all_apointments,
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
exports.getUserAppointments = getUserAppointments;
const updateAppointment = async (updateAppointmentData, { famCareMemberId }) => {
    try {
        const { doctorName, description, apptDate, apptTime } = updateAppointmentData.data;
        //find appointment
        const findAppointment = await prisma_1.default.appointment.findFirst({
            where: {
                id: parseInt(updateAppointmentData.apptId),
                OR: [
                    {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : updateAppointmentData.userId,
                    },
                    { forDependantId: famCareMemberId?.toLowerCase() },
                ],
            },
        });
        if (!findAppointment)
            throw new HttpError_1.default("Could not find appointment for user", 404);
        const formattedDate = apptDate ? (0, DateTimeFormatters_1.formatDateForDB)(apptDate) : undefined;
        const formattedTime = apptTime ? (0, DateTimeFormatters_1.formatTimeForDB)(apptTime) : undefined;
        let updatedApptData;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(updateAppointmentData.userId, famCareMemberId?.toLowerCase());
            if (!linkData)
                throw new HttpError_1.default("Link Does Not exist", 404);
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            updatedApptData = await prisma_1.default.appointment.update({
                where: {
                    id: parseInt(updateAppointmentData.apptId),
                    // userId: (famCareMemberId as string)?.toLowerCase(),
                    ...(linkData.linkType === "minor"
                        ? {
                            forDependantId: famCareMemberId?.toLowerCase(),
                        }
                        : {
                            forUserId: famCareMemberId?.toLowerCase(),
                        }),
                },
                data: {
                    doctorName,
                    description,
                    apptDate: formattedDate,
                    apptTime: formattedTime,
                },
            });
            if (!updatedApptData) {
                throw new HttpError_1.default("Could Not update appointment data", 500);
            }
            //track changes (only for linked user / subaccount user)
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "UPDATE", updatedApptData.id, "A1", updateAppointmentData.userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            updatedApptData = await prisma_1.default.appointment.update({
                where: {
                    id: parseInt(updateAppointmentData.apptId),
                    forUserId: updateAppointmentData.userId,
                },
                data: {
                    doctorName,
                    description,
                    apptDate: formattedDate,
                    apptTime: formattedTime,
                },
            });
            if (!updatedApptData) {
                throw new HttpError_1.default("Could Not update appointment data", 500);
            }
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(updateAppointmentData.userId, "UPDATE", updatedApptData.id, "A1", updateAppointmentData.userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(updateAppointmentData.userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "Appointment updated successfully",
            A1: updatedApptData,
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
exports.updateAppointment = updateAppointment;
const deleteAppointment = async (data, famCareMemberId) => {
    try {
        const { apptId, userId } = data;
        const appts = apptId.split(",");
        //find appointment
        const findAppointment = await prisma_1.default.appointment.findMany({
            where: {
                id: {
                    in: appts.map((appt) => parseInt(appt)),
                },
                OR: [
                    {
                        forUserId: famCareMemberId ? famCareMemberId : userId,
                    },
                    { forDependantId: famCareMemberId },
                ],
            },
        });
        if (!findAppointment || findAppointment.length != appts.length)
            throw new HttpError_1.default("Could not find appointment for user", 404);
        let deletedAppointment;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId);
            if (!linkData)
                throw new HttpError_1.default("Link Does Not exist", 404);
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            deletedAppointment = await prisma_1.default.appointment.deleteMany({
                where: {
                    id: {
                        in: appts.map((appt) => parseInt(appt)),
                    },
                    ...(linkData.linkType === "minor"
                        ? {
                            forDependantId: famCareMemberId,
                        }
                        : {
                            forUserId: famCareMemberId,
                        }),
                },
            });
            const changes = appts.map(async (appt) => {
                if (linkData.linkType != "minor") {
                    const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId, "DELETE", parseInt(appt), "A1", userId);
                    if (!changeHistory.success)
                        throw new HttpError_1.default("Could not track change", 204);
                }
            });
            if (!changes)
                throw new HttpError_1.default("Could not record changes made", 500);
        }
        else {
            deletedAppointment = await prisma_1.default.appointment.deleteMany({
                where: {
                    id: {
                        in: appts.map((appt) => parseInt(appt)),
                    },
                    forUserId: userId,
                },
            });
        }
        if (!deletedAppointment)
            throw new HttpError_1.default("Could Not delete appointment", 500);
        const changes = appts.map(async (appt) => {
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "DELETE", parseInt(appt), "A1", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        });
        if (!changes)
            throw new HttpError_1.default("Could not record changes made", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "Appointment was deleted successfully",
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
exports.deleteAppointment = deleteAppointment;
//# sourceMappingURL=appointments.services.js.map