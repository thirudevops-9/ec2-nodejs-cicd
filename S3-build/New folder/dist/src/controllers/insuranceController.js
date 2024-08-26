"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotification = exports.deletePolicies = exports.updatePolicyById = exports.getAllPolicies = exports.createPolicy = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const insuranceValidations_1 = require("../utility/Validation/insuranceValidations");
const insurance_services_1 = require("../services/insurance.services");
const createPolicy = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const file = req.file;
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const userId = user.id;
        const queryParams = req.query;
        if (!form_data || !user.id) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const validationResponse = insuranceValidations_1.uploadInsuranceValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[1]} : ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const uploadInsuranceResponse = await (0, insurance_services_1.uploadInsurance)({
            file,
            userId,
            form_data,
        }, queryParams);
        if (!uploadInsuranceResponse) {
            throw new HttpError_1.default("could not upload insurance", 204);
        }
        const code = uploadInsuranceResponse.success ? 200 : 400;
        res.status(code).json({ data: uploadInsuranceResponse });
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
exports.createPolicy = createPolicy;
const getAllPolicies = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const all_policies = await (0, insurance_services_1.getUserPolicies)(user, queryParams);
        if (!all_policies)
            throw new HttpError_1.default(`Could Not get documents for user`, 204);
        const code = all_policies.success ? 200 : 400;
        res.status(code).json({ data: all_policies });
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
exports.getAllPolicies = getAllPolicies;
const updatePolicyById = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const file = req.file;
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const queryParams = req.query;
        const validationResponse = insuranceValidations_1.ChangeInsuranceValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[1]} : ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const userId = user?.id;
        const id = req.params.id;
        const editInsuranceResponse = await (0, insurance_services_1.editPolicy)({
            file,
            userId,
            form_data,
            id,
        }, queryParams);
        if (!editInsuranceResponse) {
            throw new HttpError_1.default("Could not edit policy", 204);
        }
        const code = editInsuranceResponse.success ? 200 : 400;
        res.status(code).json({ data: editInsuranceResponse });
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
exports.updatePolicyById = updatePolicyById;
const deletePolicies = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const userId = user?.id;
        // const id = req.params.doc_id;
        const queryParams = req.query;
        const { famCareMemberId, id } = queryParams;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        // const userId: string = "oi18wv43";
        if (user) {
            if (!userId || !id)
                throw new HttpError_1.default("Required fields missing", 422);
            const delInsuranceResponse = await (0, insurance_services_1.delPolicies)({ userId, id: id }, famCareMemberId?.toLowerCase());
            if (!delInsuranceResponse) {
                throw new HttpError_1.default("Could not delete policy", 204);
            }
            const code = delInsuranceResponse.success ? 200 : 400;
            res.status(code).json({ data: delInsuranceResponse });
        }
        else {
            throw new HttpError_1.default("validation error", 400);
        }
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
exports.deletePolicies = deletePolicies;
//notifications
const getNotification = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const userId = user?.id;
        const id = req.query;
        if (!userId)
            throw new HttpError_1.default("Required fields missing", 422);
        const findNotificationResponse = await (0, insurance_services_1.findNotification)(userId, id);
        if (!findNotificationResponse) {
            throw new HttpError_1.default("Could not find notification", 204);
        }
        const code = findNotificationResponse.success ? 200 : 400;
        res.status(code).json({ data: findNotificationResponse });
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
exports.getNotification = getNotification;
//# sourceMappingURL=insuranceController.js.map