"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVitalRecord = exports.BulkVitalModule = exports.updateVitalModuleValidation = exports.createVitalModuleValidation = void 0;
const zod_1 = require("zod");
const String = zod_1.z.string().min(1, "Please enter a valid string");
const DataStructure = zod_1.z.object({
    metric: zod_1.z.string().min(1),
    dataType: zod_1.z.string().min(1),
    units: zod_1.z.array(zod_1.z.string()).default([]),
});
const FilterType = zod_1.z.object({
    key: zod_1.z.string().min(1),
    value: zod_1.z.string().min(1),
});
exports.createVitalModuleValidation = zod_1.z.object({
    vitalName: String.min(1),
    vitalDataStructure: zod_1.z.array(DataStructure),
    vitalCode: String.min(1),
    filters: zod_1.z.array(FilterType).optional(),
});
exports.updateVitalModuleValidation = zod_1.z.object({
    vitalName: String.optional(),
    vitalDataStructure: zod_1.z.array(DataStructure).optional(),
    vitalCode: String.optional(),
    filters: zod_1.z.array(FilterType).optional(),
});
exports.BulkVitalModule = zod_1.z.array(exports.createVitalModuleValidation);
exports.CreateVitalRecord = zod_1.z.object({
    vitalCode: String.min(1),
    vitalData: zod_1.z.record(zod_1.z.unknown()),
    recordedOn: zod_1.z
        .string()
        .datetime("invalid datetime format: YYY-MM-DDTNN:NN:NN.NNNZ"),
});
//# sourceMappingURL=VitalsValidation.js.map