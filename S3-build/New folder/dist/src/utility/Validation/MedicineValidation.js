"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMedicineValidation = exports.MedicineValidation = void 0;
const zod_1 = require("zod");
const DocumentValidation_1 = require("./DocumentValidation");
const String = zod_1.z.string();
const caseInsensitiveEnum = (values) => zod_1.z
    .string()
    .transform((val) => val.toLowerCase())
    .refine((val) => values.includes(val), {
    message: `Value must be one of: ${values.join(", ")}`,
});
const isDayOfWeek = (day) => {
    const daysOfWeek = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
    ];
    return daysOfWeek.includes(day.toLowerCase());
};
// const isHours = (hour: string) => {
//   const validHours = [
//     "0.5 hours",
//     "1 hours",
//     "2 hours",
//     "3 hours",
//     "4 hours",
//     "5 hours",
//     "6 hours",
//     "7 hours",
//     "8 hours",
//     "9 hours",
//     "10 hours",
//     "11 hours",
//     "12 hours",
//   ];
//   return validHours.includes(hour.toLowerCase());
// };
const isHours = (hour) => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d) hours$/;
    return regex.test(hour);
};
const isDays = (day) => {
    const validDay = [
        "1 days",
        "2 days",
        "3 days",
        "4 days",
        "5 days",
        "6 days",
        "7 days",
    ];
    return validDay.includes(day.toLowerCase());
};
exports.MedicineValidation = zod_1.z
    .object({
    medName: String.min(1),
    // medunit: z.enum(["tablet", "syrup", "injection"]),
    medUnit: String.min(1),
    medInventory: zod_1.z
        .number()
        .min(1, "Enter a valid input for total contents")
        .optional(),
    medDoctor: String.optional(),
    medIntakeTime: caseInsensitiveEnum([
        "before meal",
        "after meal",
        "with meal",
        "never mind",
    ]),
    medIntakePerDose: zod_1.z
        .number()
        .min(1, "Enter a valid input for amount of dose atonce"),
    medIntakeFrequency: caseInsensitiveEnum([
        "daily",
        "interval",
        "specific day",
    ]),
    medReminderFrequency: String.optional(),
    medDosage: zod_1.z
        .number()
        .min(1, "Enter a valid input for doses per day")
        .default(5),
    MedDosageSchedule: zod_1.z.array(zod_1.z.string().time()).optional(),
    startAt: zod_1.z.string().datetime().optional(),
    endAt: zod_1.z.string().datetime().optional(),
    isRefill: zod_1.z.boolean().default(false),
    isSensitive: zod_1.z.boolean().optional(),
    medImage: DocumentValidation_1.base64String.optional(),
})
    .refine((data) => {
    const { isRefill, medInventory } = data;
    if (isRefill && !medInventory)
        return false;
    if (!isRefill && medInventory)
        return false;
    return true;
}, {
    message: "Medicine inventory is compulsory only if refill is set to true",
    path: ["medInventory"],
})
    .refine((data) => {
    const { startAt } = data;
    if (!startAt)
        return true;
    const dateTime = new Date(startAt);
    const now = new Date();
    return dateTime > now;
}, {
    message: "Start of reminder must be in the future",
    path: ["startAt"],
})
    .refine((data) => {
    const { medDosage, MedDosageSchedule, medIntakeFrequency, medReminderFrequency, } = data;
    if (medIntakeFrequency === "interval" &&
        isHours(medReminderFrequency)) {
        return true;
    }
    return MedDosageSchedule?.length == medDosage;
}, {
    message: "Dosage per day doesnt match schedule reminders to give user",
    path: ["MedDosageSchedule", "medDosage"],
})
    .refine((data) => {
    const { medIntakeFrequency, medReminderFrequency } = data;
    if (medIntakeFrequency === "interval") {
        //add hours and days filter
        return (medReminderFrequency &&
            isHours(medReminderFrequency)) ||
            (medReminderFrequency && isDays(medReminderFrequency))
            ? true
            : false;
    }
    else if (medIntakeFrequency === "specific day") {
        return medReminderFrequency &&
            isDayOfWeek(medReminderFrequency)
            ? true
            : false;
    }
    else
        return true;
}, {
    message: "Set a valid reminder frequency",
    path: ["medIntakeFrequency", "medReminderFrequency"],
})
    .refine((data) => {
    const { medIntakeFrequency, medReminderFrequency } = data;
    if (medIntakeFrequency === "daily" &&
        medReminderFrequency &&
        medReminderFrequency != "") {
        return false;
    }
    return true;
}, {
    message: "No reminder frequency is needed for daily intake of medicine",
    path: ["medIntakeFrequency", "medReminderFrequency"],
});
exports.UpdateMedicineValidation = zod_1.z
    .object({
    medName: String.optional(),
    // medunit: z.enum(["tablet", "syrup", "injection"]),
    medUnit: String.optional(),
    medInventory: zod_1.z
        .number()
        .min(1, "Enter a valid input for total contents")
        .optional(),
    medDoctor: String.optional(),
    medIntakeTime: caseInsensitiveEnum([
        "before meal",
        "after meal",
        "with meal",
        "never mind",
    ]).optional(),
    medIntakePerDose: zod_1.z
        .number()
        .min(1, "Enter a valid input for amount of dose atonce")
        .optional(),
    medIntakeFrequency: caseInsensitiveEnum([
        "daily",
        "interval",
        "specific day",
    ]).optional(),
    medReminderFrequency: String.optional(),
    medDosage: zod_1.z
        .number()
        .min(1, "Enter a valid input for doses per day")
        .optional(),
    MedDosageSchedule: zod_1.z.array(zod_1.z.string().time()).optional(),
    startAt: zod_1.z.string().datetime().optional(),
    isActive: zod_1.z.boolean().optional(),
    isRefill: zod_1.z.boolean().default(false).optional(),
    isSensitive: zod_1.z.boolean().optional(),
    medImage: DocumentValidation_1.base64String.optional(),
})
    .refine((data) => {
    const { isRefill, medInventory } = data;
    if (isRefill && !medInventory)
        return false;
    if (!isRefill && medInventory)
        return false;
    return true;
}, {
    message: "Medicine inventory is compulsory only if refill is set to true",
    path: ["medInventory"],
})
    .refine((data) => {
    const { startAt } = data;
    if (!startAt)
        return true;
    const dateTime = new Date(startAt);
    const now = new Date();
    return dateTime > now;
}, {
    message: "Start of reminder must be in the future",
    path: ["startAt"],
});
//# sourceMappingURL=MedicineValidation.js.map