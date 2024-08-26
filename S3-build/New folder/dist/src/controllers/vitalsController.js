"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVitalModuleById = exports.deleteVitalModules = exports.getAllVitalModules = exports.createVitalModules = exports.deleteVitalRecordById = exports.getValidVitalModules = exports.getVitalDataByModule = exports.createVitalRecord = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const vitals_services_1 = require("../services/vitals.services");
const VitalsValidation_1 = require("../utility/Validation/VitalsValidation");
//USER DATA
const createVitalRecord = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        const queryParams = req.query;
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Required fields missing (vital module code / vital record data)", 401);
        const validationResponse = VitalsValidation_1.CreateVitalRecord.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const input = {
            userId: user.id,
            ...data,
        };
        if (!user.id || !data.vitalCode || !data.vitalData) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const newVitalRecord = await (0, vitals_services_1.addNewVitalRecord)(input, queryParams);
        if (!newVitalRecord)
            throw new HttpError_1.default(`Could Not Create New vitals record`, 204);
        const code = newVitalRecord.success ? 200 : 400;
        res.status(code).json({ data: newVitalRecord });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.createVitalRecord = createVitalRecord;
// export const addPeriodRecord = async (req: Request, res: Response) => {
//   try {
//     const user = req.user; // access user object attached in the middleware
//     const queryParams = req.query;
//     if (!user) throw new HTTPError("Unauthorised", 401);
//     const data =
//       req.body ??
//       (() => {
//         throw new HTTPError("API Missing body", 422);
//       });
//     if (!data) throw new HTTPError("Required fields missing: startDate", 401);
//     const input = {
//       userId: user.id,
//       ...data,
//     };
//     const newVitalRecord = await notePeriodRecord(input, queryParams);
//     if (!newVitalRecord)
//       throw new HTTPError(`Could Not Create New vitals record`, 204);
//     const code = newVitalRecord.success ? 200 : 400;
//     res.status(code).json({ data: newVitalRecord });
//   } catch (err) {
//     if (err instanceof HTTPError) {
//       res.status(err.code).json({ error: { message: err.message } });
//     } else {
//       res.status(500).json({ error: { message: "Internal server error" } });
//     }
//   }
// };
const getVitalDataByModule = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const queryParams = req.query;
        const input = {
            userId: user.id,
        };
        if (!user.id) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const newVitalRecord = await (0, vitals_services_1.getVitalRecordsOfUser)(input, queryParams);
        if (!newVitalRecord)
            throw new HttpError_1.default(`Could Not Get User Details`, 204);
        const code = newVitalRecord.success ? 200 : 400;
        res.status(code).json({ data: newVitalRecord });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getVitalDataByModule = getVitalDataByModule;
const getValidVitalModules = async (req, res) => {
    try {
        const user = req.user; // access user object attached in the middleware
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        const queryParams = req.query;
        const vitalModules = await (0, vitals_services_1.getUserVitalModules)(user, queryParams);
        if (!vitalModules)
            throw new HttpError_1.default(`Could Not Fetch Self awareness modules for user`, 204);
        const code = vitalModules.success ? 200 : 400;
        res.status(code).json({ data: vitalModules });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getValidVitalModules = getValidVitalModules;
const deleteVitalRecordById = async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            throw new HttpError_1.default("Unauthorized", 401);
        const queryParams = req.query;
        const { famCareMemberId, id } = queryParams;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        if (!id || !user.id)
            throw new HttpError_1.default("Required fields are missing", 422);
        const deleteVitalData = await (0, vitals_services_1.deleteVitalsRecords)({
            vitalId: id,
            userId: user.id,
        }, famCareMemberId?.toLowerCase());
        if (!deleteVitalData)
            throw new HttpError_1.default(`Could Not delete vital(s) data`, 204);
        const code = deleteVitalData.success ? 200 : 400;
        res.status(code).json({ data: deleteVitalData });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteVitalRecordById = deleteVitalRecordById;
//ADMIN FUNCTIONS
const createVitalModules = async (req, res) => {
    try {
        const admin = req.admin; // access admin object attached in the middleware
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        if (admin.role === "AUDITOR")
            throw new HttpError_1.default("Not authorised to make this change", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!data)
            throw new HttpError_1.default("Required fields misisng", 422);
        const validationResponse = VitalsValidation_1.BulkVitalModule.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const newVitalRecord = await (0, vitals_services_1.addNewVitalModule)(data, admin);
        if (!newVitalRecord)
            throw new HttpError_1.default(`Could Not Add New Self-awareness module`, 204);
        const code = newVitalRecord.success ? 200 : 400;
        res.status(code).json({ data: newVitalRecord });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.createVitalModules = createVitalModules;
const getAllVitalModules = async (req, res) => {
    try {
        const admin = req.admin; // access admin object attached in the middleware
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        const queryParams = req.query;
        const vitalModules = await (0, vitals_services_1.getVitalModules)(queryParams);
        if (!vitalModules)
            throw new HttpError_1.default(`Could Not Fetch Self awareness modules for admin`, 204);
        const code = vitalModules.success ? 200 : 400;
        res.status(code).json({ data: vitalModules });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getAllVitalModules = getAllVitalModules;
const deleteVitalModules = async (req, res) => {
    try {
        const admin = req.admin; // access admin object attached in the middleware
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        const userId = req.user?.id;
        if (!userId) {
            throw new HttpError_1.default("unauthorized", 401);
        }
        let queryParams = req.query;
        const deletedVitalModule = await (0, vitals_services_1.deleteVitalModule)(queryParams, userId);
        if (!deletedVitalModule) {
            throw new HttpError_1.default(" could not delete record", 204);
        }
        const code = deletedVitalModule.success ? 200 : 400;
        res.status(code).json({ error: { data: deletedVitalModule } });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteVitalModules = deleteVitalModules;
const updateVitalModuleById = async (req, res) => {
    try {
        const admin = req.admin; // access admin object attached in the middleware
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        if (admin.role === "AUDITOR")
            throw new HttpError_1.default("Not authorised to make this change", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const moduleId = req.params.id;
        if (!data || !moduleId)
            throw new HttpError_1.default("Required fields misisng", 422);
        const validationResponse = VitalsValidation_1.updateVitalModuleValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const updateVitalModule = await (0, vitals_services_1.editVitalModuleById)(data, moduleId);
        if (!updateVitalModule)
            throw new HttpError_1.default(`Could Not Update Self-awareness module`, 204);
        const code = updateVitalModule.success ? 200 : 400;
        res.status(code).json({ data: updateVitalModule });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.updateVitalModuleById = updateVitalModuleById;
//# sourceMappingURL=vitalsController.js.map