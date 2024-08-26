"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestData = exports.cycleDays = exports.isJsonObject = exports.groupVitalDataByField = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const groupVitalDataByField = (userVitalData) => {
    const groupedData = {};
    userVitalData.forEach((entry) => {
        const { vitalRecordData } = entry;
        // Ensure vitalRecordData is a JsonObject
        if ((0, exports.isJsonObject)(vitalRecordData)) {
            Object.keys(vitalRecordData).forEach((field) => {
                const value = vitalRecordData[field];
                // if (typeof value === "string" || typeof value === "boolean") {
                if (!groupedData[field]) {
                    groupedData[field] = [];
                }
                groupedData[field].push(value);
                // }
            });
        }
    });
    return groupedData;
};
exports.groupVitalDataByField = groupVitalDataByField;
// Type guard to check if a value is a JsonObject
const isJsonObject = (value) => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
exports.isJsonObject = isJsonObject;
const cycleDays = (date1, date2) => {
    // Convert strings to Date objects
    const dateObj1 = new Date(date1);
    const dateObj2 = new Date(date2);
    const differenceInMillis = dateObj2.getTime() - dateObj1.getTime();
    // Convert milliseconds to days
    const difference = differenceInMillis / (1000 * 60 * 60 * 24);
    return difference;
};
exports.cycleDays = cycleDays;
const getLatestData = async (vitalCode, userId, link) => {
    const data = await prisma_1.default.vitalsUserData.findFirst({
        where: {
            ...(link === "minor"
                ? {
                    forDependantId: userId,
                }
                : { forUserId: userId }),
            vitalCodeId: vitalCode,
        },
        orderBy: {
            recordedOn: "desc",
        },
        // select: {
        //   vitalRecordData: true,
        //   recordedOn: true,
        // },
    });
    if (data === null)
        return {
            vitalCodeId: vitalCode,
            vitalRecordData: null,
            recordedOn: null,
        };
    else
        return data;
};
exports.getLatestData = getLatestData;
//# sourceMappingURL=vitalsDataTransform.js.map