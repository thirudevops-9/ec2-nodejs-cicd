"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterRecords = void 0;
const filterRecords = async (successRecords, allRecords) => {
    try {
        console.log(successRecords, allRecords);
        const successSet = new Set(successRecords);
        const failed = allRecords.filter((rec) => !successSet.has(rec));
        return failed; // Ensure to return the failed array if needed
    }
    catch (error) {
        console.error(error); // Log the error for debugging
        throw error; // Optionally rethrow the error to handle it outside
    }
};
exports.filterRecords = filterRecords;
//# sourceMappingURL=RecordList.js.map