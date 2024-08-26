"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUpdatedData = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getUpdatedData = async (records) => {
    try {
        let data = [];
        for (const record of records) {
            if (record.changeType == "DELETE") {
                data.push({
                    change: record.changeType,
                    id: record.recordId,
                    table: record.table,
                    data: null,
                });
            }
            else {
                const modelKey = process.env[record.table];
                const findRecordData = await prisma_1.default[modelKey].findFirst({
                    where: { id: record.recordId },
                });
                if (!findRecordData)
                    continue;
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
    }
    catch (error) {
        console.error("Error:", error);
        throw error;
    }
};
exports.getUpdatedData = getUpdatedData;
//# sourceMappingURL=SyncedData.js.map