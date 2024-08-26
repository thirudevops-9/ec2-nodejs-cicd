"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNote = exports.editNotes = exports.getUserNotes = exports.createUserNotes = void 0;
const familyLinkData_1 = require("../utility/familyLinkData");
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const prisma_1 = __importDefault(require("../prisma"));
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const RecordList_1 = require("../utility/RecordList");
const createUserNotes = async (data, userId, queryParams) => {
    try {
        const { title, color, description } = data;
        const { famCareMemberId } = queryParams;
        let createdNotes;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.accessType === "view") {
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            }
            createdNotes = await prisma_1.default.notes.create({
                data: {
                    createdBy: userId,
                    title: title,
                    color: color,
                    description: description,
                    ...(linkData.linkType === "minor"
                        ? {
                            forDependantId: linkData.linkTo,
                        }
                        : {
                            forUserId: linkData.linkTo,
                        }),
                },
            });
            if (!createdNotes) {
                throw new HttpError_1.default("db:error ,could not create Notes", 500);
            }
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "CREATE", createdNotes.id, "N4", userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            createdNotes = await prisma_1.default.notes.create({
                data: {
                    createdBy: "self",
                    title: title,
                    color: color,
                    description: description,
                    forUserId: userId,
                },
            });
            if (!createdNotes) {
                throw new HttpError_1.default("db:error ,could not create Notes", 500);
            }
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "CREATE", createdNotes.id, "N4", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "note created successfully",
            N4: createdNotes,
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
exports.createUserNotes = createUserNotes;
const getUserNotes = async (userId, queryParams) => {
    try {
        const { id, famCareMemberId } = queryParams;
        const filters = {};
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            linkData.linkType === "minor"
                ? (filters.forDependantId = famCareMemberId) //fetch minor notes
                : (filters.forUserId = famCareMemberId); //fetch subaccount and existing AC
        }
        else {
            filters.forUserId = userId; //fetch data of logged in userId
        }
        if (id) {
            filters.id = id; //fetch specific note
        }
        const allNotes = await prisma_1.default.notes.findMany({
            where: {
                AND: [filters],
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            N4: allNotes,
            // .map((item) => {
            //   return {
            //     id: item.id,
            //     createdAt: item.createdAt,
            //     updatedAt: item.updatedAt,
            //     title: item.title,
            //     description: item.description,
            //     color: item.color,
            //     createdBy: item.createdBy,
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
exports.getUserNotes = getUserNotes;
const editNotes = async (userId, notesId, queryParams, data) => {
    try {
        const { famCareMemberId } = queryParams;
        const { title, description, color } = data;
        const filters = { id: notesId };
        let linkData;
        if (famCareMemberId) {
            ({ linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase()));
            if (linkData.accessType === "view") {
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            }
            linkData.linkType === "minor"
                ? (filters.forDependantId = famCareMemberId) //fetch minor notes
                : (filters.forUserId = famCareMemberId); //fetch subaccount and existing AC
        }
        else {
            filters.forUserId = userId;
        }
        const findNotes = await prisma_1.default.notes.findFirst({
            where: filters,
        });
        if (!findNotes) {
            throw new HttpError_1.default("The note  does not exist", 404);
        }
        const updatedNote = await prisma_1.default.notes.update({
            where: {
                id: findNotes.id,
            },
            data: {
                title: title,
                description: description,
                color: color,
            },
        });
        if (!updatedNote) {
            throw new HttpError_1.default("could not update the notes", 500);
        }
        const uuid = famCareMemberId && linkData && linkData.linkType != "minor"
            ? famCareMemberId?.toLowerCase()
            : userId;
        const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(uuid, "UPDATE", updatedNote.id, "N4", userId);
        if (!changeHistory.success)
            throw new HttpError_1.default("Could not track change", 204);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            message: "note updated successfully!",
            N4: updatedNote,
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
exports.editNotes = editNotes;
const deleteNote = async (queryParams, userId) => {
    try {
        let notesId = [];
        const { id } = queryParams;
        if (!id) {
            throw new HttpError_1.default("provide the id of the note to be deleted", 422);
        }
        const { famCareMemberId } = queryParams;
        const filters = {};
        if (!Array.isArray(id)) {
            notesId = id.split(",").map((item) => {
                return parseInt(item);
            });
        }
        let linkData;
        if (famCareMemberId) {
            ({ linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase()));
            if (linkData.accessType === "view") {
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            }
            linkData.linkType === "minor"
                ? (filters.forDependantId = famCareMemberId) //fetch minor notes
                : (filters.forUserId = famCareMemberId); //fetch subaccount and existing AC
        }
        else {
            filters.forUserId = userId;
        }
        // Fetch the notes to delete
        const notesToDelete = await prisma_1.default.notes.findMany({
            where: {
                id: {
                    in: notesId,
                },
                ...filters,
            },
        });
        if (!notesToDelete || notesToDelete.length != notesId.length) {
            throw new HttpError_1.default("Note(s) does not exist", 404);
        }
        const deletedRecords = notesToDelete.map((note) => note.id);
        // if (!notesToDelete || notesToDelete.length === 0) {
        //   throw new HTTPError("Note to be deleted not found", 404);
        // }
        const deleteNote = await prisma_1.default.notes.deleteMany({
            where: {
                id: {
                    in: notesId,
                },
                ...filters,
            },
        });
        if (!deleteNote || deleteNote.count === 0) {
            throw new HttpError_1.default("Note to be deleted not found ", 500);
        }
        const uuid = famCareMemberId && linkData && linkData.linkType != "minor"
            ? famCareMemberId?.toLowerCase()
            : userId;
        for (const item of notesToDelete) {
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(uuid, "DELETE", item.id, "N4", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        //find successfull and failed records:
        const failedRecords = await (0, RecordList_1.filterRecords)(deletedRecords, notesId);
        return {
            success: true,
            message: "note(s) deleted successfully",
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
exports.deleteNote = deleteNote;
//# sourceMappingURL=notes.services.js.map