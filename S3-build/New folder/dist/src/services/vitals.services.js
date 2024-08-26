"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteVitalsRecords = exports.getUserVitalModules = exports.getVitalRecordsOfUser = exports.addNewVitalRecord = exports.deleteVitalModule = exports.editVitalModuleById = exports.getVitalModules = exports.addNewVitalModule = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const familyLinkData_1 = require("../utility/familyLinkData");
const prisma_1 = __importDefault(require("../prisma"));
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const ValidVitalModules_1 = require("../utility/ValidVitalModules");
const vitalsDataTransform_1 = require("../utility/vitalsDataTransform");
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const RecordList_1 = require("../utility/RecordList");
//VITALS - MODULES //!ADMIN FUNCTIONS
const addNewVitalModule = async (data, user) => {
    try {
        // const { vitalName, vitalDataStructure, filters, vitalCode } = data;
        const newData = data.map((item) => ({
            ...item,
            updatedBy: user.emailId,
        }));
        const vitalCode = newData.map((item) => {
            return item.vitalCode;
        });
        const findVitalCode = await prisma_1.default.vitalModule.findMany({
            where: {
                vitalCode: {
                    in: vitalCode,
                },
            },
        });
        const alreadyExistVitalCode = findVitalCode.map((item) => {
            return item.vitalCode;
        });
        if (findVitalCode.length > 0) {
            throw new HttpError_1.default(`Vital Code ${alreadyExistVitalCode} already exists,please add all the vital(s) records again`, 422);
        }
        const newVitalModule = await prisma_1.default.vitalModule.createMany({
            data: newData,
        });
        if (!newVitalModule)
            throw new HttpError_1.default("Could Not Add new self-awareness module", 500);
        return {
            success: true,
            message: "New self-awareness module added successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.addNewVitalModule = addNewVitalModule;
const getVitalModules = async (queryParams) => {
    try {
        const { id, search } = queryParams;
        const filters = {};
        const searchFilter = [];
        if (id) {
            filters.id = parseInt(id);
        }
        if (search) {
            searchFilter.push({ vitalName: { contains: search, mode: "insensitive" } }, { vitalCode: { contains: search, mode: "insensitive" } });
        }
        const modules = await prisma_1.default.vitalModule.findMany({
            where: {
                AND: [filters],
                ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
            },
        });
        if (!modules)
            throw new HttpError_1.default("Could not fetch modules", 404);
        return {
            success: true,
            data: modules,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getVitalModules = getVitalModules;
const editVitalModuleById = async (data, moduleId) => {
    try {
        const { vitalName, vitalDataStructure, filters, vitalCode } = data;
        const newVitalModule = await prisma_1.default.vitalModule.update({
            where: {
                id: parseInt(moduleId),
            },
            data: {
                vitalName,
                vitalCode,
                vitalDataStructure,
                filters,
            },
        });
        if (!newVitalModule)
            throw new HttpError_1.default("Could Not Add new self-awareness module", 500);
        return {
            success: true,
            message: "New self-awareness module added successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.editVitalModuleById = editVitalModuleById;
const deleteVitalModule = async (queryParams, userId) => {
    try {
        let vitalsId = [];
        const { id } = queryParams;
        if (!id) {
            throw new HttpError_1.default("provide the id of the note to be deleted", 422);
        }
        if (!Array.isArray(id)) {
            vitalsId = id.split(",").map((item) => {
                return parseInt(item);
            });
        }
        // Fetch the vital modules to delete
        const find_modules = await prisma_1.default.vitalModule.findMany({
            where: {
                id: {
                    in: vitalsId,
                },
            },
        });
        if (!find_modules || find_modules.length != vitalsId.length) {
            throw new HttpError_1.default("Module to be deleted not found", 404);
        }
        const deletedRecords = find_modules.map((module) => module.id);
        const delete_modules = await prisma_1.default.vitalModule.deleteMany({
            where: {
                id: {
                    in: vitalsId,
                },
            },
        });
        if (!delete_modules || !delete_modules.count) {
            throw new HttpError_1.default("Module could not be deleted", 500);
        }
        //find successfull and failed records:
        const failedRecords = await (0, RecordList_1.filterRecords)(deletedRecords, vitalsId);
        return {
            success: true,
            message: "self-awareness module deleted successfully",
            successfullyDeleted: deletedRecords,
            failed: failedRecords,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.deleteVitalModule = deleteVitalModule;
//VITALS - USER DATA
const addNewVitalRecord = async (input, { famCareMemberId }) => {
    try {
        const { userId, vitalCode, vitalData, recordedOn } = input;
        //find vital module
        const findModule = await prisma_1.default.vitalModule.findUnique({
            where: {
                vitalCode: vitalCode.toLowerCase(),
            },
        });
        if (!findModule)
            throw new HttpError_1.default("Vital Module not found", 404);
        let newVitalRecord;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            //if familyMember is male, should not allow period record
            const findFam = linkData.linkType == "minor"
                ? await prisma_1.default.dependant.findFirst({
                    where: {
                        id: famCareMemberId?.toLowerCase(),
                    },
                })
                : await prisma_1.default.users.findFirst({
                    where: {
                        id: famCareMemberId?.toLowerCase(),
                    },
                });
            if (findFam &&
                findFam.gender == "male" &&
                vitalCode.toLowerCase().includes("period"))
                throw new HttpError_1.default("Cannot Add Record for male", 612);
            newVitalRecord = await prisma_1.default.vitalsUserData.create({
                data: {
                    createdBy: userId,
                    recordedOn: recordedOn,
                    vitalRecordData: vitalData,
                    VitalModule: {
                        connect: {
                            vitalCode: vitalCode.toLowerCase(),
                        },
                    },
                    ...(linkData.linkType === "minor"
                        ? {
                            dependant: {
                                connect: {
                                    id: famCareMemberId?.toLowerCase(),
                                },
                            },
                        }
                        : {
                            user: {
                                connect: {
                                    id: famCareMemberId?.toLowerCase(),
                                },
                            },
                        }),
                },
            });
            if (!newVitalRecord)
                throw new HttpError_1.default("Could not add record", 500);
            //track changes (only for linked user / subaccount user)
            if (linkData.linkType != "minor") {
                const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "CREATE", newVitalRecord.id, "V5", userId);
                if (!changeHistory.success)
                    throw new HttpError_1.default("Could not track change", 204);
            }
        }
        else {
            //find User
            const findUser = await prisma_1.default.users.findFirst({
                where: {
                    id: userId,
                },
            });
            if (!findUser)
                throw new HttpError_1.default("User not found", 404);
            if (findUser.gender == "male" &&
                vitalCode.toLowerCase().includes("period"))
                throw new HttpError_1.default("Cannot Add Record for male", 612);
            newVitalRecord = await prisma_1.default.vitalsUserData.create({
                data: {
                    vitalRecordData: vitalData,
                    recordedOn: recordedOn,
                    VitalModule: {
                        connect: {
                            vitalCode: vitalCode.toLowerCase(),
                        },
                    },
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                },
            });
            if (!newVitalRecord)
                throw new HttpError_1.default("Could not add record", 500);
            const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(userId, "CREATE", newVitalRecord.id, "V5", userId);
            if (!changeHistory.success)
                throw new HttpError_1.default("Could not track change", 204);
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            V5: newVitalRecord,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default(error.name, 412);
            throw new HttpError_1.default(error.message, error.code);
        }
    }
};
exports.addNewVitalRecord = addNewVitalRecord;
// export const notePeriodRecord = async (
//   input: AddVitalRecord,
//   { famCareMemberId }: ParsedQs
// ) => {
//   try {
//     const { userId, vitalCode, vitalData, recordedOn } = input;
//     if (!userId || !vitalCode || !vitalData) {
//       throw new HTTPError("Missing required fields", 400);
//     }
//     let newVitalRecord;
//     if (famCareMemberId) {
//       const { linkData } = await familyLink(
//         userId,
//         (famCareMemberId as string)?.toLowerCase()
//       );
//       if (!linkData) throw new HTTPError("Link Does Not exist", 403);
//       if (linkData.accessType == "view")
//         throw new HTTPError("You are not authorised to make this change", 401);
//       //if familyMember is male, should not allow period record
//       const findFam =
//         linkData.linkType == "minor"
//           ? await prisma.dependant.findFirst({
//               where: {
//                 id: (famCareMemberId as string)?.toLowerCase(),
//               },
//             })
//           : await prisma.users.findFirst({
//               where: {
//                 id: (famCareMemberId as string)?.toLowerCase(),
//               },
//             });
//       if (
//         findFam &&
//         findFam.gender == "male" &&
//         vitalCode.toLowerCase().includes("period")
//       )
//         throw new HTTPError("Cannot Add Record for male", 412);
//       //find last period record stored in Database
//       const lastPeriodRecord = await prisma.vitalsUserData.findMany({
//         where: {
//           vitalCodeId: vitalCode,
//           ...(linkData.linkType === "minor"
//             ? {
//                 forDependantId: (famCareMemberId as string)?.toLowerCase(),
//               }
//             : {
//                 forUserId: (famCareMemberId as string)?.toLowerCase(),
//               }),
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//         take: 1,
//       });
//       if (!lastPeriodRecord)
//         throw new HTTPError("No record found to calculate period cycle", 403);
//       const rawData: JsonValue = lastPeriodRecord[0].vitalRecordData;
//       const { isPCOD, startDate } = rawData as unknown as CycleData;
//       const newVitalData = {
//         startDate: vitalData["startDate"],
//         cycle: cycleDays(startDate as string, vitalData["startDate"] as string),
//         isPCOD,
//       };
//       newVitalRecord = await prisma.vitalsUserData.create({
//         data: {
//           vitalRecordData: newVitalData,
//           recordedOn: recordedOn,
//           createdBy: userId,
//           VitalModule: {
//             connect: {
//               vitalCode: vitalCode,
//             },
//           },
//           ...(linkData.linkType === "minor"
//             ? {
//                 dependant: {
//                   connect: {
//                     id: (famCareMemberId as string)?.toLowerCase(),
//                   },
//                 },
//               }
//             : {
//                 user: {
//                   connect: {
//                     id: (famCareMemberId as string)?.toLowerCase(),
//                   },
//                 },
//               }),
//         },
//       });
//       //track changes (only for linked user / subaccount user)
//       if (linkData.linkType != "minor") {
//         const changeHistory = await trackChanges(
//           (famCareMemberId as string)?.toLowerCase(),
//           "CREATE",
//           newVitalRecord.id,
//           "V5",
//           userId
//         );
//         if (!changeHistory.success)
//           throw new HTTPError("Could not track change", 204);
//       }
//     } else {
//       //find last period record stored in Database
//       const lastPeriodRecord = await prisma.vitalsUserData.findFirst({
//         where: {
//           forUserId: userId,
//           vitalCodeId: vitalCode,
//         },
//         orderBy: {
//           createdAt: "desc",
//         },
//       });
//       if (!lastPeriodRecord)
//         throw new HTTPError("No record found to calculate period cycle", 403);
//       const rawData: JsonValue = lastPeriodRecord.vitalRecordData;
//       const { isPCOD, startDate } = rawData as unknown as CycleData;
//       const newVitalData = {
//         startDate: vitalData["startDate"],
//         cycle: cycleDays(startDate as string, vitalData["startDate"] as string),
//         isPCOD,
//       };
//       newVitalRecord = await prisma.vitalsUserData.create({
//         data: {
//           vitalRecordData: newVitalData,
//           recordedOn: recordedOn,
//           VitalModule: {
//             connect: {
//               vitalCode: vitalCode,
//             },
//           },
//           user: {
//             connect: {
//               id: userId,
//             },
//           },
//         },
//       });
//       if (!newVitalRecord)
//         throw new HTTPError("Could Not Add period data", 403);
//       const changeHistory = await trackChanges(
//         userId,
//         "CREATE",
//         newVitalRecord.id,
//         "V5",
//         userId
//       );
//       if (!changeHistory.success)
//         throw new HTTPError("Could not track change", 204);
//     }
//     const updateActiveSession = trackActiveSession(userId);
//     if (!updateActiveSession) {
//       throw new HTTPError("Could not update active session", 204);
//     }
//     return {
//       success: true,
//       vitalData: newVitalRecord,
//     };
//   } catch (error: HTTPError | Error | any) {
//     console.log("Error->Log:", error);
//     if (error instanceof HTTPError) {
//       throw new HTTPError(error.message, error.code);
//     } else {
//       if (error.name == "PrismaClientKnownRequestError")
//         throw new HTTPError("Prisma Client error", 500);
//       throw new HTTPError(error.name, 500);
//     }
//   }
// };
const getVitalRecordsOfUser = async (input, { famCareMemberId, startDate, endDate, codeId }) => {
    try {
        const { userId } = input;
        //get vitalModule datastructure
        // const moduleDS = await prisma.vitalModule.findMany({
        //   where: {
        //     AND:[filters],
        //   },
        //   select: {
        //     id: true,
        //     vitalName: true,
        //     vitalCode: true,
        //     vitalDataStructure: true,
        //   },
        // });
        // if (!moduleDS)
        //   throw new HTTPError("Could not find Self-Awareness module details", 404);
        //filters:
        const filters = {};
        const vitalModuleFilters = {};
        if (codeId) {
            filters.vitalCodeId = codeId;
            vitalModuleFilters.vitalCode = codeId;
        }
        if (startDate && endDate) {
            filters.recordedOn = {
                gte: (0, DateTimeFormatters_1.formatDateForDB)(startDate),
                lte: (0, DateTimeFormatters_1.formatDateForDB)(endDate),
            };
        }
        else if (startDate && !endDate) {
            filters.recordedOn = {
                gte: (0, DateTimeFormatters_1.formatDateForDB)(startDate),
                lte: new Date(),
            };
        }
        else if (!startDate && endDate) {
            filters.recordedOn = {
                gte: (0, DateTimeFormatters_1.getFirstDayOfCurrentYear)(),
                lte: (0, DateTimeFormatters_1.formatDateForDB)(endDate),
            };
        }
        else {
            filters.recordedOn = {
                gte: (0, DateTimeFormatters_1.getFirstDayOfCurrentYear)(),
                lte: new Date(),
            };
        }
        let vitalRecordData;
        //search for module
        const moduleDS = await prisma_1.default.vitalModule.findMany({
            where: {
                AND: [vitalModuleFilters],
            },
        });
        if (!moduleDS || moduleDS.length === 0)
            throw new HttpError_1.default("Could not find Self-Awareness module details", 404);
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            vitalRecordData = await prisma_1.default.vitalsUserData.findMany({
                where: {
                    AND: [filters],
                    // vitalCodeId: codeId?.toString(),
                    ...(linkData.linkType === "minor"
                        ? {
                            forDependantId: famCareMemberId?.toLowerCase(),
                        }
                        : {
                            forUserId: famCareMemberId?.toLowerCase(),
                        }),
                },
                orderBy: {
                    recordedOn: "desc",
                },
                // select: {
                //   vitalRecordData: true,
                //   recordedOn: true,
                // },
            });
        }
        else {
            vitalRecordData = await prisma_1.default.vitalsUserData.findMany({
                where: {
                    AND: [filters],
                    // vitalCodeId: codeId?.toString(),
                    forUserId: userId,
                },
                orderBy: {
                    recordedOn: "desc",
                },
                // select: {
                //   id: true,
                //   vitalRecordData: true,
                //   recordedOn: true,
                // },
            });
        }
        if (!vitalRecordData)
            vitalRecordData = [];
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            // VM11: moduleDS,
            //   UserVitalData: groupVitalDataByField(vitalRecordData),
            V5: vitalRecordData,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getVitalRecordsOfUser = getVitalRecordsOfUser;
const getUserVitalModules = async (user, { famCareMemberId, search }) => {
    try {
        let validModules;
        let V5 = [];
        const searchFilter = [];
        if (search) {
            searchFilter.push({
                vitalName: { contains: search, mode: "insensitive" },
            });
        }
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(user.id, famCareMemberId?.toLowerCase());
            const findUser = linkData.linkType == "minor"
                ? await prisma_1.default.dependant.findUnique({
                    where: { id: famCareMemberId?.toLowerCase() },
                })
                : await prisma_1.default.users.findUnique({
                    where: { id: famCareMemberId?.toLowerCase() },
                });
            if (!findUser)
                throw new HttpError_1.default("could not fetch user details", 404);
            //what if the vital module is for veeryone and filter field is null? -> added the condition
            validModules = await (0, ValidVitalModules_1.getValidModules)(findUser, searchFilter);
            if (!validModules)
                throw new HttpError_1.default("Could not find any self awareness modules for this user", 404);
            for (const module of validModules) {
                const record = linkData.linkType == "minor"
                    ? await (0, vitalsDataTransform_1.getLatestData)(module.vitalCode, findUser.id, "minor")
                    : await (0, vitalsDataTransform_1.getLatestData)(module.vitalCode, findUser.id, "other");
                if (!record)
                    throw new HttpError_1.default("No data", 404);
                V5.push(record);
            }
        }
        else {
            const findUser = await prisma_1.default.users.findUnique({
                where: { id: user.id },
            });
            if (!findUser)
                throw new HttpError_1.default("could not fetch user details", 404);
            validModules = await (0, ValidVitalModules_1.getValidModules)(findUser, searchFilter);
            if (!validModules)
                throw new HttpError_1.default("Could not find any self awareness modules for this user", 404);
            for (const module of validModules) {
                const record = await (0, vitalsDataTransform_1.getLatestData)(module.vitalCode, findUser.id, "other");
                if (!record)
                    throw new HttpError_1.default("No data", 404);
                V5.push(record);
            }
        }
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            VM11: validModules,
            V5,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("prisma client error", 412);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getUserVitalModules = getUserVitalModules;
const deleteVitalsRecords = async (data, famCareMemberId) => {
    try {
        const { vitalId, userId } = data;
        const vitals = vitalId.split(",").map(Number);
        //find records(s)
        const findVitalRecords = await prisma_1.default.vitalsUserData.findMany({
            where: {
                id: {
                    in: vitals.map((vital) => vital),
                },
                AND: [
                    {
                        forUserId: famCareMemberId
                            ? famCareMemberId?.toLowerCase()
                            : userId,
                    },
                    { forDependantId: famCareMemberId?.toLowerCase() },
                ],
            },
        });
        if (!findVitalRecords || findVitalRecords.length != vitals.length)
            throw new HttpError_1.default("Could not find record(s) for user", 404);
        const deletedRecords = findVitalRecords.map((record) => record.id);
        let deletedVitalRecords;
        if (famCareMemberId) {
            const { linkData } = await (0, familyLinkData_1.familyLink)(userId, famCareMemberId?.toLowerCase());
            if (linkData.accessType == "view")
                throw new HttpError_1.default("You are not authorised to make this change", 401);
            deletedVitalRecords = await prisma_1.default.vitalsUserData.deleteMany({
                where: {
                    id: {
                        in: findVitalRecords.map((vital) => vital.id),
                    },
                    ...(linkData.linkType === "minor"
                        ? {
                            forDependantId: famCareMemberId?.toLowerCase(),
                        }
                        : {
                            forUserId: famCareMemberId?.toLowerCase(),
                        }),
                },
            });
            const changes = findVitalRecords.map(async (vital) => {
                if (linkData.linkType != "minor") {
                    const changeHistory = await (0, changeHistoryTrackFunction_1.trackChanges)(famCareMemberId?.toLowerCase(), "DELETE", vital.id, "A1", userId);
                    if (!changeHistory.success)
                        throw new HttpError_1.default("Could not track change", 612);
                }
            });
            if (!changes)
                throw new HttpError_1.default("Could not record changes made", 500);
        }
        else {
            deletedVitalRecords = await prisma_1.default.vitalsUserData.deleteMany({
                where: {
                    id: {
                        in: findVitalRecords.map((vital) => vital.id),
                    },
                    forUserId: userId,
                },
            });
        }
        if (!deletedVitalRecords)
            throw new HttpError_1.default("Could Not delete Vital Record(s)", 500);
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(userId);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        //find successfull and failed records:
        const failedRecords = await (0, RecordList_1.filterRecords)(deletedRecords, vitals);
        return {
            success: true,
            message: "Vital Record(s) were deleted successfully",
            successfullyDeleted: deletedRecords,
            failed: failedRecords,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.deleteVitalsRecords = deleteVitalsRecords;
//# sourceMappingURL=vitals.services.js.map