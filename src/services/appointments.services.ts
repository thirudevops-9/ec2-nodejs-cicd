import { ParsedQs } from "qs";
import prisma from "../prisma";
import {
  Appointment,
  AppointmentInput,
  CreatedAppointment,
  UpdateAppointmentInput,
} from "../utility/DataTypes/types.appointment";
import { TokenData } from "../utility/DataTypes/types.user";
import {
  formatDateForDB,
  formatTimeForDB,
} from "../utility/DateTimeFormatters";
import HTTPError from "../utility/HttpError";
import { familyLink } from "../utility/familyLinkData";
import {
  trackActiveSession,
  trackChanges,
} from "../utility/changeHistoryTrackFunction";

export const createNewAppointment = async (
  data: Appointment,
  user: TokenData,
  queryParams: ParsedQs
) => {
  try {
    const { famCareMemberId } = queryParams;
    const { doctorName, description, apptDate, apptTime } = data;

    const formattedDate = formatDateForDB(apptDate);
    const formattedTime = `${apptDate}T${apptTime}.000Z`;
    let new_appointment: CreatedAppointment;
    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );

      const id = linkData.linkType === "minor" ? "forDependantId" : "forUserId";

      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      //find conflicting appointments
      const conflicts = await prisma.appointment.findMany({
        where: {
          apptDate: formattedDate,
          apptTime: formattedTime,
          [id]: (famCareMemberId as string)?.toLowerCase(),
        },
      });
      if (conflicts.length > 0)
        throw new HTTPError(
          "Appointment for entered date and time already exists for user",
          609
        );

      new_appointment = await prisma.appointment.create({
        data: {
          createdBy: user.id,
          doctorName,
          description,
          apptDate: formattedDate,
          apptTime: formattedTime,
          ...(linkData.linkType === "minor"
            ? {
                dependant: {
                  connect: {
                    id: linkData.linkTo,
                  },
                },
              }
            : {
                user: {
                  connect: {
                    id: linkData.linkTo,
                  },
                },
              }),
        },
      });

      if (!new_appointment)
        throw new HTTPError("Could Not Add new appointment", 500);

      //track changes (only for linked user / subaccount user)
      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "CREATE",
          new_appointment.id,
          "A1",
          user.id
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      console.log(formattedTime);
      //find conflicting appointments
      const conflicts = await prisma.appointment.findMany({
        where: {
          apptDate: formattedDate,
          apptTime: formattedTime,
          forUserId: user.id?.toLowerCase(),
        },
      });
      if (conflicts.length > 0)
        throw new HTTPError(
          "Appointment for entered date and time already exists for user",
          609
        );

      new_appointment = await prisma.appointment.create({
        data: {
          doctorName,
          description,
          apptDate: formattedDate,
          apptTime: formattedTime,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
      if (!new_appointment)
        throw new HTTPError("Could Not Add new appointment", 500);

      const changeHistory = await trackChanges(
        user.id,
        "CREATE",
        new_appointment.id,
        "A1",
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
      A1: new_appointment,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};

export const getUserAppointments = async (
  user: TokenData,
  queryParams: ParsedQs
) => {
  try {
    const {
      id,
      startDate,
      endDate,
      doctorName,
      description,
      limit,
      famCareMemberId,
    } = queryParams;

    const filters: any = {};

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        user.id,
        (famCareMemberId as string)?.toLowerCase()
      );
      if (!linkData)
        throw new HTTPError("Could not find relation between the users", 404);
      linkData.linkType == "minor"
        ? (filters.forDependantId = famCareMemberId)
        : (filters.forUserId = famCareMemberId);
    } else {
      filters.forUserId = user.id;
    }

    if (id) {
      filters.id = parseInt(id as string);
    }

    filters.apptDate = startDate
      ? { gte: formatDateForDB(startDate as string) }
      : { gte: new Date() };

    if (endDate) {
      filters.apptDate.lte = formatDateForDB(endDate as string);
    }

    if (doctorName) {
      filters.doctorName = {
        contains: doctorName,
        mode: "insensitive",
      };
    }
    if (description) {
      filters.description = {
        contains: description,
        mode: "insensitive",
      };
    }

    const all_apointments = await prisma.appointment.findMany({
      where: {
        AND: [
          filters, // Combine existing filters with upcoming appointments filter
        ],
      },
      take: limit ? parseInt(limit as string) : undefined,
      orderBy: {
        apptDate: "asc",
      },
    });
    if (!all_apointments)
      throw new HTTPError("Could Not fetch appointments data for user", 500);
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      // user_id: user.id,
      A1: all_apointments,
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

export const updateAppointment = async (
  updateAppointmentData: UpdateAppointmentInput,
  { famCareMemberId }: ParsedQs
) => {
  try {
    const { doctorName, description, apptDate, apptTime } =
      updateAppointmentData.data;

    //find appointment
    const findAppointment = await prisma.appointment.findFirst({
      where: {
        id: parseInt(updateAppointmentData.apptId),
        OR: [
          {
            forUserId: famCareMemberId
              ? (famCareMemberId as string)?.toLowerCase()
              : updateAppointmentData.userId,
          },
          { forDependantId: (famCareMemberId as string)?.toLowerCase() },
        ],
      },
    });

    if (!findAppointment)
      throw new HTTPError("Could not find appointment for user", 404);

    const formattedDate = apptDate ? formatDateForDB(apptDate) : undefined;
    const formattedTime = apptTime ? formatTimeForDB(apptTime) : undefined;

    let updatedApptData;

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        updateAppointmentData.userId,
        (famCareMemberId as string)?.toLowerCase()
      );

      if (!linkData) throw new HTTPError("Link Does Not exist", 404);
      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      updatedApptData = await prisma.appointment.update({
        where: {
          id: parseInt(updateAppointmentData.apptId),
          // userId: (famCareMemberId as string)?.toLowerCase(),
          ...(linkData.linkType === "minor"
            ? {
                forDependantId: (famCareMemberId as string)?.toLowerCase(),
              }
            : {
                forUserId: (famCareMemberId as string)?.toLowerCase(),
              }),
        },
        data: {
          doctorName,
          description,
          apptDate: formattedDate,
          apptTime: formattedTime,
        },
      });
      if (!updatedApptData) {
        throw new HTTPError("Could Not update appointment data", 500);
      }

      //track changes (only for linked user / subaccount user)
      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "UPDATE",
          updatedApptData.id,
          "A1",
          updateAppointmentData.userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      updatedApptData = await prisma.appointment.update({
        where: {
          id: parseInt(updateAppointmentData.apptId),
          forUserId: updateAppointmentData.userId,
        },
        data: {
          doctorName,
          description,
          apptDate: formattedDate,
          apptTime: formattedTime,
        },
      });
      if (!updatedApptData) {
        throw new HTTPError("Could Not update appointment data", 500);
      }
      const changeHistory = await trackChanges(
        updateAppointmentData.userId,
        "UPDATE",
        updatedApptData.id,
        "A1",
        updateAppointmentData.userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    }
    const updateActiveSession = trackActiveSession(
      updateAppointmentData.userId
    );
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "Appointment updated successfully",
      A1: updatedApptData,
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

export const deleteAppointment = async (
  data: AppointmentInput,
  famCareMemberId: string
) => {
  try {
    const { apptId, userId } = data;
    const appts = apptId.split(",");

    //find appointment
    const findAppointment = await prisma.appointment.findMany({
      where: {
        id: {
          in: appts.map((appt) => parseInt(appt)),
        },
        OR: [
          {
            forUserId: famCareMemberId ? famCareMemberId : userId,
          },
          { forDependantId: famCareMemberId },
        ],
      },
    });
    if (!findAppointment || findAppointment.length != appts.length)
      throw new HTTPError("Could not find appointment for user", 404);

    let deletedAppointment;

    if (famCareMemberId) {
      const { linkData } = await familyLink(userId, famCareMemberId);

      if (!linkData) throw new HTTPError("Link Does Not exist", 404);
      if (linkData.accessType == "view")
        throw new HTTPError("You are not authorised to make this change", 401);

      deletedAppointment = await prisma.appointment.deleteMany({
        where: {
          id: {
            in: appts.map((appt) => parseInt(appt)),
          },
          ...(linkData.linkType === "minor"
            ? {
                forDependantId: famCareMemberId,
              }
            : {
                forUserId: famCareMemberId,
              }),
        },
      });

      const changes = appts.map(async (appt) => {
        if (linkData.linkType != "minor") {
          const changeHistory = await trackChanges(
            famCareMemberId,
            "DELETE",
            parseInt(appt),
            "A1",
            userId
          );
          if (!changeHistory.success)
            throw new HTTPError("Could not track change", 204);
        }
      });
      if (!changes) throw new HTTPError("Could not record changes made", 500);
    } else {
      deletedAppointment = await prisma.appointment.deleteMany({
        where: {
          id: {
            in: appts.map((appt) => parseInt(appt)),
          },
          forUserId: userId,
        },
      });
    }
    if (!deletedAppointment)
      throw new HTTPError("Could Not delete appointment", 500);

    const changes = appts.map(async (appt) => {
      const changeHistory = await trackChanges(
        userId,
        "DELETE",
        parseInt(appt),
        "A1",
        userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    });
    if (!changes) throw new HTTPError("Could not record changes made", 500);
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    return {
      success: true,
      message: "Appointment was deleted successfully",
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
