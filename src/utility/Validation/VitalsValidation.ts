import { z } from "zod";

const String = z.string().min(1, "Please enter a valid string");

const DataStructure = z.object({
  metric: z.string().min(1),
  dataType: z.string().min(1),
  units: z.array(z.string()).default([]),
});

const FilterType = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export const createVitalModuleValidation = z.object({
  vitalName: String.min(1),
  vitalDataStructure: z.array(DataStructure),
  vitalCode: String.min(1),
  filters: z.array(FilterType).optional(),
});

export const updateVitalModuleValidation = z.object({
  vitalName: String.optional(),
  vitalDataStructure: z.array(DataStructure).optional(),
  vitalCode: String.optional(),
  filters: z.array(FilterType).optional(),
});

export const BulkVitalModule = z.array(createVitalModuleValidation);
export const CreateVitalRecord = z.object({
  vitalCode: String.min(1),
  vitalData: z.record(z.unknown()),
  recordedOn: z
    .string()
    .datetime("invalid datetime format: YYY-MM-DDTNN:NN:NN.NNNZ"),
});
