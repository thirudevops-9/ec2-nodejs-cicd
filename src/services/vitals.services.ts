import { ParsedQs } from "qs";
import {
  AddVitalRecord,
  UpdateVitalModule,
  VitalModule,
  VitalRecordInput,
  VitalsRecordsData,
} from "../utility/DataTypes/types.vitals";
import HTTPError from "../utility/HttpError";
import { familyLink } from "../utility/familyLinkData";
import prisma from "../prisma";
import {
  trackActiveSession,
  trackChanges,
} from "../utility/changeHistoryTrackFunction";
import { TokenData } from "../utility/DataTypes/types.user";
import { Prisma } from "@prisma/client";
import { getValidModules } from "../utility/ValidVitalModules";
import { getLatestData } from "../utility/vitalsDataTransform";
import {
  formatDateForDB,
  getFirstDayOfCurrentYear,
} from "../utility/DateTimeFormatters";
import { adminTokenData } from "../utility/DataTypes/types.admin";
import { filterRecords } from "../utility/RecordList";

//VITALS - MODULES //!ADMIN FUNCTIONS
export const addNewVitalModule = async (
  data: VitalModule[],
  user: adminTokenData
) => {
  try {
    // const { vitalName, vitalDataStructure, filters, vitalCode } = data;
    const newData = data.map((item: any) => ({
      ...item,
      updatedBy: user.emailId,
    }));

    const vitalCode = newData.map((item: any) => {
      return item.vitalCode;
    });

    const findVitalCode = await prisma.vitalModule.findMany({
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
      throw new HTTPError(
        `Vital Code ${alreadyExistVitalCode} already exists,please add all the vital(s) records again`,
        422
      );
    }

    const newVitalModule = await prisma.vitalModule.createMany({
      data: newData,
    });
    if (!newVitalModule)
      throw new HTTPError("Could Not Add new self-awareness module", 500);

    return {
      success: true,
      message: "New self-awareness module added successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const getVitalModules = async (queryParams: ParsedQs) => {
  try {
    const { id, search } = queryParams;

    const filters: any = {};
    const searchFilter: Array<{}> = [];

    if (id) {
      filters.id = parseInt(id as string);
    }
    if (search) {
      searchFilter.push(
        { vitalName: { contains: search, mode: "insensitive" } },
        { vitalCode: { contains: search, mode: "insensitive" } }
      );
    }
    const modules = await prisma.vitalModule.findMany({
      where: {
        AND: [filters],
        ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
      },
    });
    if (!modules) throw new HTTPError("Could not fetch modules", 404);

    return {
      success: true,
      data: modules,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const editVitalModuleById = async (
  data: UpdateVitalModule,
  moduleId: string
) => {
  try {
    const { vitalName, vitalDataStructure, filters, vitalCode } = data;

    const newVitalModule = await prisma.vitalModule.update({
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
      throw new HTTPError("Could Not Add new self-awareness module", 500);

    return {
      success: true,
      message: "New self-awareness module added successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const deleteVitalModule = async (queryParams: any, userId: string) => {
  try {
    let vitalsId: Array<number> = [];
    const { id } = queryParams;
    if (!id) {
      throw new HTTPError("provide the id of the note to be deleted", 422);
    }

    if (!Array.isArray(id)) {
      vitalsId = id.split(",").map((item: string) => {
        return parseInt(item);
      });
    }

    // Fetch the vital modules to delete
    const find_modules = await prisma.vitalModule.findMany({
      where: {
        id: {
          in: vitalsId,
        },
      },
    });

    if (!find_modules || find_modules.length != vitalsId.length) {
      throw new HTTPError("Module to be deleted not found", 404);
    }

    const deletedRecords = find_modules.map((module) => module.id);

    const delete_modules = await prisma.vitalModule.deleteMany({
      where: {
        id: {
          in: vitalsId,
        },
      },
    });
    if (!delete_modules || !delete_modules.count) {
      throw new HTTPError("Module could not be deleted", 500);
    }

    //find successfull and failed records:
    const failedRecords = await filterRecords(deletedRecords, vitalsId);
    return {
      success: true,
      message: "self-awareness module deleted successfully",
      successfullyDeleted: deletedRecords,
      failed: failedRecords,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//VITALS - USER DATA
export const addNewVitalRecord = async (
  input: AddVitalRecord,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const { userId, vitalCode, vitalData, recordedOn } = input;

    //find vital module
    const findModule = await prisma.vitalModule.findUnique({
      where: {
        vitalCode: vitalCode.toLowerCase(),
      },
    });

    if (!findModule) throw new HTTPError("Vital Module not found", 404);

    let newVitalRecord;
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      //if familyMember is male, should not allow period record
      const findFam =
        linkData.linkType == "minor"
          ? await prisma.dependant.findFirst({
              where: {
                id: (famCareMemberId as string)?.toLowerCase(),
              },
            })
          : await prisma.users.findFirst({
              where: {
                id: (famCareMemberId as string)?.toLowerCase(),
              },
            });
      if (
        findFam &&
        findFam.gender == "male" &&
        vitalCode.toLowerCase().includes("period")
      )
        throw new HTTPError("Cannot Add Record for male", 612);

      newVitalRecord = await prisma.vitalsUserData.create({
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
                    id: (famCareMemberId as string)?.toLowerCase(),
                  },
                },
              }
            : {
                user: {
                  connect: {
                    id: (famCareMemberId as string)?.toLowerCase(),
                  },
                },
              }),
        },
      });

      if (!newVitalRecord) throw new HTTPError("Could not add record", 500);
      //track changes (only for linked user / subaccount user)
      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "CREATE",
          newVitalRecord.id,
          "V5",
          userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      //find User
      const findUser = await prisma.users.findFirst({
        where: {
          id: userId,
        },
      });
      if (!findUser) throw new HTTPError("User not found", 404);
      if (
        findUser.gender == "male" &&
        vitalCode.toLowerCase().includes("period")
      )
        throw new HTTPError("Cannot Add Record for male", 612);

      newVitalRecord = await prisma.vitalsUserData.create({
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
      if (!newVitalRecord) throw new HTTPError("Could not add record", 500);

      const changeHistory = await trackChanges(
        userId,
        "CREATE",
        newVitalRecord.id,
        "V5",
        userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    }
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      V5: newVitalRecord,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError(error.name, 412);
      throw new HTTPError(error.message, error.code);
    }
  }
};

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

export const getVitalRecordsOfUser = async (
  input: VitalRecordInput,
  { famCareMemberId, startDate, endDate, codeId }: ParsedQs
) => {
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
    const filters: any = {};
    const vitalModuleFilters: any = {};
    if (codeId) {
      filters.vitalCodeId = codeId;
      vitalModuleFilters.vitalCode = codeId;
    }
    if (startDate && endDate) {
      filters.recordedOn = {
        gte: formatDateForDB(startDate as string),
        lte: formatDateForDB(endDate as string),
      };
    } else if (startDate && !endDate) {
      filters.recordedOn = {
        gte: formatDateForDB(startDate as string),
        lte: new Date(),
      };
    } else if (!startDate && endDate) {
      filters.recordedOn = {
        gte: getFirstDayOfCurrentYear(),
        lte: formatDateForDB(endDate as string),
      };
    } else {
      filters.recordedOn = {
        gte: getFirstDayOfCurrentYear(),
        lte: new Date(),
      };
    }

    let vitalRecordData: {
      vitalRecordData: Prisma.JsonValue;
    }[];

    //search for module
    const moduleDS = await prisma.vitalModule.findMany({
      where: {
        AND: [vitalModuleFilters],
      },
    });
    if (!moduleDS || moduleDS.length === 0)
      throw new HTTPError("Could not find Self-Awareness module details", 404);

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      vitalRecordData = await prisma.vitalsUserData.findMany({
        where: {
          AND: [filters],
          // vitalCodeId: codeId?.toString(),
          ...(linkData.linkType === "minor"
            ? {
                forDependantId: (famCareMemberId as string)?.toLowerCase(),
              }
            : {
                forUserId: (famCareMemberId as string)?.toLowerCase(),
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
    } else {
      vitalRecordData = await prisma.vitalsUserData.findMany({
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
    if (!vitalRecordData) vitalRecordData = [];
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      // VM11: moduleDS,
      //   UserVitalData: groupVitalDataByField(vitalRecordData),
      V5: vitalRecordData,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const getUserVitalModules = async (
  user: TokenData,
  { famCareMemberId, search }: ParsedQs
) => {
  try {
    let validModules;
    let V5: any = [];
    const searchFilter: Array<{}> = [];
    if (search) {
      searchFilter.push({
        vitalName: { contains: search, mode: "insensitive" },
      });
    }
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );

      const findUser =
        linkData.linkType == "minor"
          ? await prisma.dependant.findUnique({
              where: { id: (famCareMemberId as string)?.toLowerCase() },
            })
          : await prisma.users.findUnique({
              where: { id: (famCareMemberId as string)?.toLowerCase() },
            });
      if (!findUser) throw new HTTPError("could not fetch user details", 404);

      //what if the vital module is for veeryone and filter field is null? -> added the condition
      validModules = await getValidModules(findUser, searchFilter);
      if (!validModules)
        throw new HTTPError(
          "Could not find any self awareness modules for this user",
          404
        );
      for (const module of validModules) {
        const record =
          linkData.linkType == "minor"
            ? await getLatestData(module.vitalCode, findUser.id, "minor")
            : await getLatestData(module.vitalCode, findUser.id, "other");
        if (!record) throw new HTTPError("No data", 404);
        V5.push(record);
      }
    } else {
      const findUser = await prisma.users.findUnique({
        where: { id: user.id },
      });
      if (!findUser) throw new HTTPError("could not fetch user details", 404);

      validModules = await getValidModules(findUser, searchFilter);
      if (!validModules)
        throw new HTTPError(
          "Could not find any self awareness modules for this user",
          404
        );
      for (const module of validModules) {
        const record = await getLatestData(
          module.vitalCode,
          findUser.id,
          "other"
        );
        if (!record) throw new HTTPError("No data", 404);
        V5.push(record);
      }
    }
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      VM11: validModules,
      V5,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const deleteVitalsRecords = async (
  data: VitalsRecordsData,
  famCareMemberId: string
) => {
  try {
    const { vitalId, userId } = data;
    const vitals = vitalId.split(",").map(Number);

    //find records(s)
    const findVitalRecords = await prisma.vitalsUserData.findMany({
      where: {
        id: {
          in: vitals.map((vital) => vital),
        },
        AND: [
          {
            forUserId: famCareMemberId
              ? (famCareMemberId as string)?.toLowerCase()
              : userId,
          },
          { forDependantId: (famCareMemberId as string)?.toLowerCase() },
        ],
      },
    });
    if (!findVitalRecords || findVitalRecords.length != vitals.length)
      throw new HTTPError("Could not find record(s) for user", 404);
    const deletedRecords = findVitalRecords.map((record) => record.id);

    let deletedVitalRecords;

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      deletedVitalRecords = await prisma.vitalsUserData.deleteMany({
        where: {
          id: {
            in: findVitalRecords.map((vital) => vital.id),
          },
          ...(linkData.linkType === "minor"
            ? {
                forDependantId: (famCareMemberId as string)?.toLowerCase(),
              }
            : {
                forUserId: (famCareMemberId as string)?.toLowerCase(),
              }),
        },
      });

      const changes = findVitalRecords.map(async (vital) => {
        if (linkData.linkType != "minor") {
          const changeHistory = await trackChanges(
            (famCareMemberId as string)?.toLowerCase(),
            "DELETE",
            vital.id,
            "A1",
            userId
          );
          if (!changeHistory.success)
            throw new HTTPError("Could not track change", 612);
        }
      });
      if (!changes) throw new HTTPError("Could not record changes made", 500);
    } else {
      deletedVitalRecords = await prisma.vitalsUserData.deleteMany({
        where: {
          id: {
            in: findVitalRecords.map((vital) => vital.id),
          },
          forUserId: userId,
        },
      });
    }
    if (!deletedVitalRecords)
      throw new HTTPError("Could Not delete Vital Record(s)", 500);
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    //find successfull and failed records:
    const failedRecords = await filterRecords(deletedRecords, vitals);
    return {
      success: true,
      message: "Vital Record(s) were deleted successfully",
      successfullyDeleted: deletedRecords,
      failed: failedRecords,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};
