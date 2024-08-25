import { z } from "zod";
const String = z.string();

export const AppointmentValidation = z
  .object({
    doctorName: z.string().min(1, "Doctor's name is required"),
    description: z.string().min(1, "description is required"),
    apptDate: z.string().date("Invalid date format. Use YYYY-MM-DD."),
    apptTime: z.string().refine((time) => {
      // Check if the time is in the correct format HH:MM:SS
      const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
      return timeRegex.test(time);
    }, "Invalid time format. Use HH:MM:SS."),
  })
  .refine(
    (data) => {
      const { apptDate, apptTime } = data;

      // Combine date and time into a single ISO 8601 string
      const appointmentDateTimeStr = `${apptDate}T${apptTime}+05:30`; // IST offset
      const appointmentDateTime = new Date(appointmentDateTimeStr);
      const now = new Date();

      return appointmentDateTime > now;
    },
    {
      message: "Appointment date and time must be in the future",
      path: ["apptDate", "apptTime"],
    }
  );

export const UpdateAppointmentValidation = z.object({
  doctorName: String.optional(),
  description: String.optional(),
  apptDate: z.string().date("Invalid date format. Use YYYY-MM-DD.").optional(),
  apptTime: z.string().optional(),
});
