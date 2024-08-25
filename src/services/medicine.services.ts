import prisma from "../prisma";
import { ParsedQs } from "qs";
import {
  Medicine,
  MedicineInput,
  UpdateMedicineInput,
} from "../utility/DataTypes/types.medicine";
import { TokenData } from "../utility/DataTypes/types.user";
import { formatTimeForDB } from "../utility/DateTimeFormatters";
import HTTPError from "../utility/HttpError";
import { familyLink } from "../utility/familyLinkData";
import {
  trackActiveSession,
  trackChanges,
} from "../utility/changeHistoryTrackFunction";
import { uploadMedicine } from "../utility/aws/uploadFile";
import { deleteFile } from "../utility/aws/deleteFile";
import { editAwsFileName } from "../utility/aws/editFileName";
import { filterRecords } from "../utility/RecordList";

export const createNewMedicineReminder = async (
  data: Medicine,
  user: TokenData,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const {
      medName,
      medUnit,
      medInventory,
      medDoctor,
      medIntakeTime,
      medIntakePerDose,
      medIntakeFrequency,
      medReminderFrequency,
      medDosage,
      MedDosageSchedule,
      startAt,
      isRefill,
      medImage,
    } = data;
    let medURL;

    let formattedScheduleTime: string[] = [];
    if (MedDosageSchedule) {
      MedDosageSchedule.map((scheduleTime) => {
        formattedScheduleTime.push(formatTimeForDB(scheduleTime));
      });
    }
    let new_medicine_reminder;
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);
      if (medImage) {
        medURL = await uploadMedicine({
          medImage: medImage,
          userId: (famCareMemberId as string)?.toLowerCase(),
          reminderName: medName,
        });
        if (!medURL?.success)
          throw new HTTPError("Could not upload medicine Image to S3", 502);
      }
      new_medicine_reminder = await prisma.medicine.create({
        data: {
          createdBy: user.id,
          medName,
          medUnit: medUnit.toLocaleLowerCase(),
          medInventory,
          medDoctor,
          medIntakeTime: medIntakeTime.toLocaleLowerCase(),
          medIntakePerDose,
          medIntakeFrequency: medIntakeFrequency.toLocaleLowerCase(),
          medReminderFrequency:
            medReminderFrequency && medReminderFrequency.toLocaleLowerCase(),
          medDosage,
          MedDosageSchedule: formattedScheduleTime,
          startAt,
          isRefill,
          medImage: medURL?.Location,
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
      //track changes (only for linked user / subaccount user)
      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "CREATE",
          new_medicine_reminder.id,
          "M3",
          user.id
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      if (medImage) {
        medURL = await uploadMedicine({
          medImage: medImage,
          userId: (user.id as string).toLowerCase(),
          reminderName: medName,
        });
        if (!medURL?.success)
          throw new HTTPError("Could not upload medicine Image to S3", 502);
      }
      new_medicine_reminder = await prisma.medicine.create({
        data: {
          createdBy: "self",
          medName,
          medUnit: medUnit.toLocaleLowerCase(),
          medInventory,
          medDoctor,
          medIntakeTime: medIntakeTime.toLocaleLowerCase(),
          medIntakePerDose,
          medIntakeFrequency: medIntakeFrequency.toLocaleLowerCase(),
          medReminderFrequency:
            medReminderFrequency && medReminderFrequency.toLocaleLowerCase(),
          medDosage,
          MedDosageSchedule: formattedScheduleTime,
          startAt,
          isRefill,
          medImage: medURL?.Location,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      if (!new_medicine_reminder)
        throw new HTTPError("Could Not Add new medicine reminder", 500);
      const changeHistory = await trackChanges(
        user.id,
        "CREATE",
        new_medicine_reminder.id,
        "M3",
        user.id
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    }
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      M3: new_medicine_reminder,
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

export const getMedicineReminders = async (
  user: TokenData,
  queryParams: ParsedQs
) => {
  try {
    const {
      id,
      medName,
      medUnit,
      medDoctor,
      medIntakeFrequency,
      medIntakeTime,
      limit,
      famCareMemberId,
    } = queryParams;

    const filters: any = {};

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );

      linkData.linkType == "minor"
        ? (filters.forDependantId = famCareMemberId)
        : (filters.forUserId = famCareMemberId);
    } else {
      filters.forUserId = user.id;
    }
    if (id) {
      filters.id = parseInt(id.toString());
    }

    if (medName) {
      filters.medName = {
        contains: medName,
        mode: "insensitive",
      };
    }
    if (medUnit) {
      filters.medUnit = {
        contains: medUnit,
        mode: "insensitive",
      };
    }
    if (medDoctor) {
      filters.medDoctor = {
        contains: medDoctor,
        mode: "insensitive",
      };
    }
    if (medIntakeFrequency) {
      filters.medIntakeFrequency = {
        contains: medIntakeFrequency,
        mode: "insensitive",
      };
    }
    if (medIntakeTime) {
      filters.medIntakeTime = {
        contains: medIntakeTime,
        mode: "insensitive",
      };
    }

    const all_med_reminders = await prisma.medicine.findMany({
      where: filters,
      take: limit ? parseInt(limit as string) : undefined,
      orderBy: {
        updatedAt: "asc",
      },
    });
    if (!all_med_reminders)
      throw new HTTPError(
        "Could Not fetch medicine reminder data for user",
        404
      );
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      user_id: user.id,
      M3: all_med_reminders,
      // medicines: all_med_reminders.map((reminder) => {
      //   return {
      //     id: reminder.id,
      //     medName: reminder.medName,
      //     medUnit: reminder.medUnit,
      //     medInventory: reminder.medInventory,
      //     medDoctor: reminder.medDoctor,
      //     medIntakeTime: reminder.medIntakeTime,
      //     medIntakePerDose: reminder.medIntakePerDose,
      //     medIntakeFrequency: reminder.medIntakeFrequency,
      //     medReminderFrequency: reminder.medReminderFrequency,
      //     medDosage: reminder.medDosage,
      //     MedDosageSchedule: reminder.MedDosageSchedule.map((sched) => {
      //       return formatTime(sched);
      //     }),
      //     startAt: formatDate(reminder.startAt),
      //     isRefill: reminder.isRefill,
      //     medURL: reminder.medImage,
      //   };
      // }),
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

export const UpdateMedicineReminders = async (
  updateMedicineData: UpdateMedicineInput,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const {
      medName,
      medUnit,
      medInventory,
      medDoctor,
      medIntakeTime,
      medIntakePerDose,
      medIntakeFrequency,
      medReminderFrequency,
      medDosage,
      MedDosageSchedule,
      startAt,
      isActive,
      isRefill,
      medImage,
    } = updateMedicineData.data;
    //find existing record
    const existingMedicineData = await prisma.medicine.findFirst({
      where: {
        id: parseInt(updateMedicineData.medId),
        OR: [
          {
            forUserId: famCareMemberId
              ? (famCareMemberId as string)?.toLowerCase()
              : updateMedicineData.userId,
          },
          {
            forDependantId:
              famCareMemberId && (famCareMemberId as string)?.toLowerCase(),
          },
        ],
      },
    });

    if (!existingMedicineData)
      throw new HTTPError("Could not find medicine reminder to update", 404);

    const newMedDosage = medDosage ? medDosage : existingMedicineData.medDosage;
    const newMedDosageSchedule = MedDosageSchedule
      ? MedDosageSchedule
      : existingMedicineData.MedDosageSchedule;

    if (newMedDosageSchedule?.length != newMedDosage)
      throw new HTTPError(
        "Dosage per day doesnt match schedule reminders to give user",
        612
      );
    let formattedScheduleTime: string[] = [];
    if (MedDosageSchedule) {
      MedDosageSchedule.map((scheduleTime) => {
        formattedScheduleTime.push(formatTimeForDB(scheduleTime));
      });
    }
    let updatedMedData;
    let medURL;
    let url;
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        updateMedicineData.userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);
      if (medImage) {
        //1.find the image link from db -> fetch the image name
        const fileName = decodeURIComponent(
          existingMedicineData.medImage?.split("/")[4] ?? ""
        );
        //2.delete the existing file from aws
        await deleteFile(fileName, (famCareMemberId as string)?.toLowerCase());

        //3.upload new file
        medURL = await uploadMedicine({
          medImage: medImage,
          userId: (famCareMemberId as string)?.toLowerCase(),
          reminderName: medName ?? existingMedicineData.medName,
        });
        if (!medURL?.success)
          throw new HTTPError("Could not upload medicine Image to S3", 502);
      }

      if (medName && !medImage && existingMedicineData.medImage) {
        const oldKey = decodeURIComponent(
          existingMedicineData.medImage?.split("/")[4]
        );
        const newKey = `medReminderImg_${Date.now()}_${medName}`;
        url = await editAwsFileName(
          oldKey,
          newKey,
          (famCareMemberId as string)?.toLowerCase()
        );
        if (!url) {
          throw new HTTPError("Could not rename file", 502);
        }
      }
      updatedMedData = await prisma.medicine.update({
        where: {
          id: parseInt(updateMedicineData.medId),
          ...(linkData.linkType === "minor"
            ? {
                forDependantId: (famCareMemberId as string)?.toLowerCase(),
              }
            : {
                forUserId: (famCareMemberId as string)?.toLowerCase(),
              }),
        },
        data: {
          medName,
          medUnit,
          medInventory,
          medDoctor,
          medIntakeTime,
          medIntakePerDose,
          medIntakeFrequency,
          medReminderFrequency,
          medDosage,
          MedDosageSchedule: formattedScheduleTime,
          startAt,
          isRefill,
          isActive,
          medImage: medURL?.Location,
        },
      });
      if (!updatedMedData) {
        throw new HTTPError("Could Not update medicine reminder data", 500);
      }
      //track changes
      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "UPDATE",
          updatedMedData.id,
          "M3",
          updateMedicineData.userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      if (medImage) {
        //1.find the image link from db -> fetch the image name
        const fileName = decodeURIComponent(
          existingMedicineData.medImage?.split("/")[4] ?? ""
        );
        //2.delete the existing file from aws
        await deleteFile(fileName, updateMedicineData.userId.toLowerCase());
        //3.upload new file
        medURL = await uploadMedicine({
          medImage: medImage,
          userId: updateMedicineData.userId.toLowerCase(),
          reminderName: medName ?? existingMedicineData.medName,
        });
        if (!medURL?.success)
          throw new HTTPError("Could not upload medicine Image to S3", 502);
      }

      if (medName && !medImage && existingMedicineData.medImage) {
        const oldKey = decodeURIComponent(
          existingMedicineData.medImage?.split("/")[4]
        );
        const newKey = `medReminderImg_${Date.now()}_${medName}`;
        url = await editAwsFileName(
          oldKey,
          newKey,
          updateMedicineData.userId.toLowerCase()
        );
        if (!url) {
          throw new HTTPError("Could not rename file", 502);
        }
      }

      updatedMedData = await prisma.medicine.update({
        where: {
          id: parseInt(updateMedicineData.medId),
          forUserId: updateMedicineData.userId,
        },
        data: {
          medName,
          medUnit,
          medInventory,
          medDoctor,
          medIntakeTime,
          medIntakePerDose,
          medIntakeFrequency,
          medReminderFrequency,
          medDosage,
          MedDosageSchedule: formattedScheduleTime,
          startAt,
          isRefill,
          isActive,
          medImage: medURL?.Location ?? url,
        },
      });
      if (!updatedMedData) {
        throw new HTTPError("Could Not update medicine reminder data", 500);
      }

      //track changes
      const changeHistory = await trackChanges(
        updateMedicineData.userId,
        "UPDATE",
        updatedMedData.id,
        "M3",
        updateMedicineData.userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    }
    const updateActiveSession = trackActiveSession(updateMedicineData.userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "Medicine Appointment updated successfully",
      M3: updatedMedData,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const deleteMedicine = async (
  data: MedicineInput,
  famCareMemberId: string
) => {
  try {
    const { medId, userId } = data;

    const meds = medId.split(",").map(Number);
    let deletedRecords: number[] = [];

    //find existing record
    const existingMedicineData = await prisma.medicine.findMany({
      where: {
        id: {
          in: meds.map((med) => med),
        },
        OR: [
          {
            forUserId: famCareMemberId ? famCareMemberId : userId,
          },
          { forDependantId: famCareMemberId },
        ],
      },
    });

    if (
      !existingMedicineData.length ||
      existingMedicineData.length != meds.length
    )
      throw new HTTPError("Could not find medicine reminder to delete", 404);

    if (famCareMemberId) {
      const { linkData } = await familyLink(userId, famCareMemberId);

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      const deleteMultiple = existingMedicineData.map(async (med) => {
        deletedRecords.push(med.id);
        // decode filename into actual filename by removing the url encoded values
        if (med.medImage) {
          const fileName = decodeURIComponent(med.medImage.split("/")[4]);
          const result = await deleteFile(fileName, famCareMemberId);
          if (!result)
            throw new HTTPError("Could not delete file from s3", 502);
        }

        const deleteAdv = await prisma.medicine.delete({
          where: {
            id: med.id,
          },
        });
        if (!deleteAdv)
          throw new HTTPError(`Could not delete data from database`, 500);
      });
      if (!deleteMultiple) {
        throw new HTTPError("Could not delete all reminder(s)", 500);
      }
      //track changes (only for linked user / subaccount user)
      const changes = deletedRecords.map(async (med) => {
        if (linkData.linkType != "minor") {
          const changeHistory = await trackChanges(
            famCareMemberId,
            "DELETE",
            med,
            "M3",
            userId
          );
          if (!changeHistory.success)
            throw new HTTPError("Could not track change", 204);
        }
      });
      if (!changes) throw new HTTPError("Could not record changes made", 500);
    } else {
      const deleteMultiple = existingMedicineData.map(async (med) => {
        deletedRecords.push(med.id);
        // decode filename into actual filename by removing the url encoded values
        if (med.medImage) {
          const fileName = decodeURIComponent(med.medImage.split("/")[4]);
          const result = await deleteFile(fileName, userId);
          if (!result)
            throw new HTTPError("Could not delete file from s3", 502);
        }

        const deleteAdv = await prisma.medicine.delete({
          where: {
            id: med.id,
          },
        });
        if (!deleteAdv)
          throw new HTTPError(`Could not delete data from database`, 500);
      });
      if (!deleteMultiple) {
        throw new HTTPError("Could not delete all reminder(s)", 500);
      }
      const changes = deletedRecords.map(async (med) => {
        const changeHistory = await trackChanges(
          userId,
          "DELETE",
          med,
          "M3",
          userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      });
      if (!changes) throw new HTTPError("Could not record changes made", 500);
    }

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    //find successfull and failed records:
    const failedRecords = await filterRecords(deletedRecords, meds);
    return {
      success: true,
      message: "Medicine Reminder was deleted successfully",
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

export const getUserReminders = async (
  user: TokenData,
  { famCareMemberId }: ParsedQs
) => {
  try {
    if (!user) throw new HTTPError("User Unique Id required", 422);

    const { linkData } = await familyLink(
      user.id,
      (famCareMemberId as string)?.toLowerCase()
    );
    if (!linkData) throw new HTTPError("Link Does Not exist", 404);

    const all_med_reminders = await prisma.medicine.findMany({
      where: {
        ...(linkData.linkType === "minor"
          ? {
              forDependantId: (famCareMemberId as string)?.toLowerCase(),
            }
          : {
              forUserId: famCareMemberId
                ? (famCareMemberId as string)?.toLowerCase()
                : user.id,
            }),
      },
      // select: {
      //   id: true,
      //   medName: true,
      //   medUnit: true,
      //   medInventory: true,
      //   medDoctor: true,
      //   medIntakeTime: true,
      //   medIntakePerDose: true,
      //   medIntakeFrequency: true,
      //   medReminderFrequency: true,
      //   medDosage: true,
      //   MedDosageSchedule: true,
      //   startAt: true,
      //   isRefill: true,
      // },
      orderBy: {
        updatedAt: "asc",
      },
    });
    if (!all_med_reminders)
      throw new HTTPError("Could Not fetch appointments data for user", 404);

    const all_appointments = await prisma.appointment.findMany({
      where: {
        ...(linkData.linkType === "minor"
          ? {
              forDependantId: (famCareMemberId as string)?.toLowerCase(),
            }
          : {
              forUserId: famCareMemberId
                ? (famCareMemberId as string)?.toLowerCase()
                : user.id,
            }),
      },
      // select: {
      //   id: true,
      //   doctorName: true,
      //   description: true,
      //   apptDate: true,
      //   apptTime: true,
      // },
      orderBy: {
        apptDate: "asc",
      },
    });
    if (!all_appointments)
      throw new HTTPError("Could Not fetch appointments data for user", 404);
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      user_id: user.id,
      M3: all_med_reminders,
      A1: all_appointments,
      // .map((Appt) => {
      //   return {
      //     id: Appt.id,
      //     doctor: Appt.doctorName,
      //     description: Appt.description,
      //     appointment_date: formatDate(Appt.apptDate),
      //     appointment_time: formatTime(Appt.apptTime),
      //   };
      // }),
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
