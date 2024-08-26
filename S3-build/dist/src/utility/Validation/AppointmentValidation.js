"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAppointmentValidation = exports.AppointmentValidation = void 0;
const zod_1 = require("zod");
const String = zod_1.z.string();
exports.AppointmentValidation = zod_1.z
    .object({
    doctorName: zod_1.z.string().min(1, "Doctor's name is required"),
    description: zod_1.z.string().min(1, "description is required"),
    apptDate: zod_1.z.string().date("Invalid date format. Use YYYY-MM-DD."),
    apptTime: zod_1.z.string().refine((time) => {
        // Check if the time is in the correct format HH:MM:SS
        const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
        return timeRegex.test(time);
    }, "Invalid time format. Use HH:MM:SS."),
})
    .refine((data) => {
    const { apptDate, apptTime } = data;
    // Combine date and time into a single ISO 8601 string
    const appointmentDateTimeStr = `${apptDate}T${apptTime}+05:30`; // IST offset
    const appointmentDateTime = new Date(appointmentDateTimeStr);
    const now = new Date();
    return appointmentDateTime > now;
}, {
    message: "Appointment date and time must be in the future",
    path: ["apptDate", "apptTime"],
});
exports.UpdateAppointmentValidation = zod_1.z.object({
    doctorName: String.optional(),
    description: String.optional(),
    apptDate: zod_1.z.string().date("Invalid date format. Use YYYY-MM-DD.").optional(),
    apptTime: zod_1.z.string().optional(),
});
//# sourceMappingURL=AppointmentValidation.js.map