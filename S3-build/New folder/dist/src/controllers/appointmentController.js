"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAppointmentById = exports.updateAppointmentById = exports.getAppointments = exports.createAppointment = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const AppointmentValidation_1 = require("../utility/Validation/AppointmentValidation");
const appointments_services_1 = require("../services/appointments.services");
const createAppointment = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = AppointmentValidation_1.AppointmentValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const { doctorName, description, apptDate, apptTime } = data;
        if (!doctorName || !description || !apptDate || !apptTime) {
            throw new HttpError_1.default("Please provide all required fields", 422);
        }
        const new_appointment = await (0, appointments_services_1.createNewAppointment)(data, user, queryParams);
        if (!new_appointment)
            throw new HttpError_1.default(`Could Not Create New appointment`, 204);
        const code = new_appointment.success ? 200 : 400;
        res.status(code).json({ data: new_appointment });
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
exports.createAppointment = createAppointment;
const getAppointments = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const all_apointments = await (0, appointments_services_1.getUserAppointments)(user, queryParams);
        if (!all_apointments)
            throw new HttpError_1.default(`Could Not get all appointments of user`, 204);
        const code = all_apointments.success ? 200 : 400;
        res.status(code).json({ data: all_apointments });
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
exports.getAppointments = getAppointments;
const updateAppointmentById = async (req, res) => {
    try {
        const user = req.user;
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = AppointmentValidation_1.UpdateAppointmentValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const apptId = req.params.id;
        if (!apptId)
            throw new HttpError_1.default("Appointment Id is missing", 422);
        const updateInputData = {
            data: data,
            apptId,
            userId: user?.id,
        };
        const updatedAppointment = await (0, appointments_services_1.updateAppointment)(updateInputData, queryParams);
        if (!updatedAppointment)
            throw new HttpError_1.default(`Could Not update appointment data`, 204);
        const code = updatedAppointment.success ? 200 : 400;
        res.status(code).json({ data: updatedAppointment });
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
exports.updateAppointmentById = updateAppointmentById;
const deleteAppointmentById = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const queryParams = req.query;
        const { famCareMemberId, id } = queryParams;
        if (!id || !user.id)
            throw new HttpError_1.default("Required fields are missing", 422);
        const deleteAppointmentData = await (0, appointments_services_1.deleteAppointment)({
            apptId: id,
            userId: user.id,
        }, famCareMemberId?.toLowerCase());
        if (!deleteAppointmentData)
            throw new HttpError_1.default(`Could Not update appointment data`, 204);
        const code = deleteAppointmentData.success ? 200 : 400;
        res.status(code).json({ data: deleteAppointmentData });
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
exports.deleteAppointmentById = deleteAppointmentById;
//# sourceMappingURL=appointmentController.js.map