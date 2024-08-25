import prisma from "../prisma";
import { SyncChangesDataType } from "./DataTypes/types.user";
import dotenv from "dotenv";
import HTTPError from "./HttpError";
import { Changes } from "@prisma/client";
dotenv.config();

type RecordData = {
  change: Changes;
  id: number;
  table: string;
  data: any;
};

export const getUpdatedData = async (records: SyncChangesDataType[]) => {
  try {
    let data: RecordData[] = [];
    for (const record of records) {
      if (record.changeType == "DELETE") {
        data.push({
          change: record.changeType,
          id: record.recordId,
          table: record.table,
          data: null,
        });
      } else {
        const modelKey: keyof typeof prisma = process.env[
          record.table
        ] as keyof typeof prisma;
        const findRecordData = await (prisma[modelKey] as any).findFirst({
          where: { id: record.recordId },
        });
        if (!findRecordData) continue;
        data.push({
          change: record.changeType,
          id: record.recordId,
          table: record.table,
          data: findRecordData,
        });
      }
    }
    return {
      success: true,
      Data: data,
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
