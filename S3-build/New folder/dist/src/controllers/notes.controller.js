"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotes = exports.updateNotes = exports.getAllNotes = exports.createNotes = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const notesValidation_1 = require("../utility/Validation/notesValidation");
const notes_services_1 = require("../services/notes.services");
//create notes
const createNotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!req.user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const queryParams = req.query;
        const validationResponse = notesValidation_1.createNotesValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!data.color || !data.description || !data.title) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const createdNotes = await (0, notes_services_1.createUserNotes)(data, userId, queryParams);
        if (!createdNotes) {
            throw new HttpError_1.default("could not create notes", 204);
        }
        const code = createdNotes.success ? 200 : 400;
        res.status(code).json({ data: createdNotes });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.createNotes = createNotes;
//read all notes
const getAllNotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!req.user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const readAllNotes = await (0, notes_services_1.getUserNotes)(userId, queryParams);
        if (!readAllNotes) {
            throw new HttpError_1.default("could not create notes", 204);
        }
        const code = readAllNotes.success ? 200 : 400;
        res.status(code).json({ data: readAllNotes });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getAllNotes = getAllNotes;
//update notes
const updateNotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        const notesId = parseInt(req.params.id);
        const queryParams = req.query;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = notesValidation_1.updateNotesValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!req.user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const updatedNotes = await (0, notes_services_1.editNotes)(userId, notesId, queryParams, data);
        if (!updatedNotes) {
            throw new HttpError_1.default("could not create notes", 204);
        }
        const code = updatedNotes.success ? 200 : 400;
        res.status(code).json({ data: updatedNotes });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.updateNotes = updateNotes;
//delete notes
const deleteNotes = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new HttpError_1.default("unauthorized", 401);
        }
        let queryParams = req.query;
        // if (!queryParams ) {
        //   throw new HTTPError("provide the id of the note to be deleted", 422);
        // }
        const deletedNotes = await (0, notes_services_1.deleteNote)(queryParams, userId);
        if (!deletedNotes) {
            throw new HttpError_1.default(" could not delete record", 204);
        }
        const code = deletedNotes.success ? 200 : 400;
        res.status(code).json({ error: { data: deletedNotes } });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteNotes = deleteNotes;
//# sourceMappingURL=notes.controller.js.map