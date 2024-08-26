"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllReminders = exports.deleteMedicineById = exports.updateMedicineById = exports.getMedicines = exports.createMedicineReminder = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const MedicineValidation_1 = require("../utility/Validation/MedicineValidation");
const medicine_services_1 = require("../services/medicine.services");
const createMedicineReminder = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const queryParams = req.query;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = MedicineValidation_1.MedicineValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { medName, medUnit, medIntakeTime, medIntakePerDose, medIntakeFrequency, } = data;
        if (!medName ||
            !medUnit ||
            !medIntakeTime ||
            !medIntakeFrequency ||
            !medIntakePerDose) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const new_medicine = await (0, medicine_services_1.createNewMedicineReminder)(data, user, queryParams);
        if (!new_medicine)
            throw new HttpError_1.default(`Could Not Create New Medicine Reminder`, 204);
        const code = new_medicine.success ? 200 : 400;
        res.status(code).json({
            data: new_medicine,
        });
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
exports.createMedicineReminder = createMedicineReminder;
const getMedicines = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const all_medicines = await (0, medicine_services_1.getMedicineReminders)(user, queryParams);
        if (!all_medicines)
            throw new HttpError_1.default(`Could Not get Medicines data `, 204);
        const code = all_medicines.success ? 200 : 400;
        res.status(code).json({
            data: all_medicines,
        });
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
exports.getMedicines = getMedicines;
const updateMedicineById = async (req, res) => {
    try {
        const user = req.user;
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = MedicineValidation_1.UpdateMedicineValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const medId = req.params.id;
        if (!medId)
            throw new HttpError_1.default("Medicine Reminder Id is missing", 422);
        const updateInputData = {
            data: data,
            medId,
            userId: user?.id,
        };
        const updatedMedicineReminderData = await (0, medicine_services_1.UpdateMedicineReminders)(updateInputData, queryParams);
        if (!updatedMedicineReminderData)
            throw new HttpError_1.default(`Could Not update medicine reminder data`, 204);
        const code = updatedMedicineReminderData.success ? 200 : 400;
        res.status(code).json({ data: updatedMedicineReminderData });
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
exports.updateMedicineById = updateMedicineById;
const deleteMedicineById = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const queryParams = req.query;
        const { famCareMemberId, id } = queryParams;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        if (!id || !user.id)
            throw new HttpError_1.default("Required fields are missing", 422);
        const deleteMedicineData = await (0, medicine_services_1.deleteMedicine)({
            medId: id,
            userId: user.id,
        }, famCareMemberId?.toLowerCase());
        if (!deleteMedicineData)
            throw new HttpError_1.default(`Could Not delete medicine reminder data`, 204);
        const code = deleteMedicineData.success ? 200 : 400;
        res.status(code).json({ data: deleteMedicineData });
    }
    catch (err) {
        console.log(err);
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteMedicineById = deleteMedicineById;
const getAllReminders = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const all_reminders = await (0, medicine_services_1.getUserReminders)(user, queryParams);
        if (!all_reminders)
            throw new HttpError_1.default(`Could Not get Medicines data `, 204);
        const code = all_reminders.success ? 200 : 400;
        res.status(code).json({
            data: all_reminders,
        });
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
exports.getAllReminders = getAllReminders;
//# sourceMappingURL=medicineController.js.map