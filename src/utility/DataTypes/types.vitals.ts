import { Prisma } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";

export interface AddVitalRecord {
  userId: string;
  vitalCode: string;
  vitalData: JsonObject;
  recordedOn: Date;
}

export interface VitalModule {
  vitalName: string;
  vitalCode: string;
  vitalDataStructure: JsonObject[];
  filters: JsonObject[];
}

export interface UpdateVitalModule {
  vitalName?: string;
  vitalCode?: string;
  vitalDataStructure?: JsonObject[];
  filters?: JsonObject[];
}

export interface VitalRecordInput {
  userId: string;
}

//////////////
export interface VitalRecordData {
  [key: string]: string; // Generic type to handle varying fields
}

export interface UserVitalDataEntry {
  //   vitalRecordData: VitalRecordData;
  //   vitalModuleId: number;
  vitalRecordData: Prisma.JsonValue;
  vitalModuleId: number;
}

export interface CycleData {
  cycle: string;
  isPCOD?: boolean;
  startDate?: string;
}

export interface VitalsRecordsData {
  userId: string;
  vitalId: string;
}
