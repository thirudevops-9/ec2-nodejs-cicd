"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUploadFile = exports.editUploadFile = exports.getDocuments = exports.userUploadFile = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const documents_services_1 = require("../services/documents.services");
const DocumentValidation_1 = require("../utility/Validation/DocumentValidation");
//validations for userUploadFile
// 1. file must be in .jpeg,jpg,pdf,png,heic,docx
// 2. form data must contain category: string;name: string;dr_name: string;note?: string;isSensitive: string;
const userUploadFile = async (req, res) => {
    try {
        const user = req.user;
        const file = req.file;
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const userId = user?.id;
        const queryParams = req.query;
        console.log(form_data);
        if (!file || !form_data) {
            throw new HttpError_1.default("Missing required fields here", 422);
        }
        const validationResponse = DocumentValidation_1.uploadFileValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[1]} : ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (user) {
            if (!file || !userId || !form_data) {
                throw new HttpError_1.default("Required fields missing", 422);
            }
            const uploadImageResponse = await (0, documents_services_1.uploadDocs)({
                file,
                userId,
                form_data,
            }, queryParams);
            if (!uploadImageResponse) {
                throw new HttpError_1.default("Failed to upload file", 204);
            }
            const code = uploadImageResponse.success ? 200 : 400;
            res.status(code).json({ data: uploadImageResponse });
        }
        else {
            throw new HttpError_1.default("validation error", 400);
        }
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
exports.userUploadFile = userUploadFile;
const getDocuments = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const all_documents = await (0, documents_services_1.getUserDocuments)(user, queryParams);
        if (!all_documents)
            throw new HttpError_1.default(`Could Not get documents for user`, 204);
        const code = all_documents.success ? 200 : 400;
        res.status(code).json({ data: all_documents });
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
exports.getDocuments = getDocuments;
const editUploadFile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unauthorised", 401);
        }
        const doc_file = req.file;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const queryParams = req.query;
        const validationResponse = DocumentValidation_1.editFileValidation.safeParse({
            doc_file,
            data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[1]} : ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const file = doc_file;
        const userId = user?.id;
        const form_data = data;
        const id = req.params.doc_id;
        const uploadImageResponse = await (0, documents_services_1.editDocs)({
            file,
            userId,
            form_data,
            id,
        }, queryParams);
        if (!uploadImageResponse) {
            throw new HttpError_1.default("could not upload image", 204);
        }
        const code = uploadImageResponse.success ? 200 : 400;
        res.status(code).json({ data: uploadImageResponse });
    }
    catch (err) {
        // console.log(err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.editUploadFile = editUploadFile;
const deleteUploadFile = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unuathorised", 401);
        }
        const userId = user?.id;
        // const id = req.params.doc_id;
        const queryParams = req.query;
        const { famCareMemberId, id } = queryParams;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        // const userId: string = "oi18wv43";
        if (!userId || !id)
            throw new HttpError_1.default("Required fields missing", 422);
        const deleteDocResponse = await (0, documents_services_1.delDocs)({ userId, id: id }, famCareMemberId?.toLowerCase());
        if (!deleteDocResponse) {
            throw new HttpError_1.default("could not delete document", 204);
        }
        const code = deleteDocResponse.success ? 200 : 400;
        res.status(code).json({ data: deleteDocResponse });
    }
    catch (err) {
        // console.log(err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteUploadFile = deleteUploadFile;
//# sourceMappingURL=documentsController.js.map