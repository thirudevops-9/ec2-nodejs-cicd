import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  AppointmentValidation,
  UpdateAppointmentValidation,
} from "../utility/Validation/AppointmentValidation";
import {
  createNewAppointment,
  deleteAppointment,
  getUserAppointments,
  // getAppointmentDataById,
  updateAppointment,
} from "../services/appointments.services";

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    const queryParams = req.query;

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = AppointmentValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    if (!user) throw new HTTPError("Unauthorised", 401);

    const { doctorName, description, apptDate, apptTime } = data;
    if (!doctorName || !description || !apptDate || !apptTime) {
      throw new HTTPError("Please provide all required fields", 422);
    }

    const new_appointment = await createNewAppointment(data, user, queryParams);
    if (!new_appointment)
      throw new HTTPError(`Could Not Create New appointment`, 204);
    const code = new_appointment.success ? 200 : 400;
    res.status(code).json({ data: new_appointment });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorised", 401);

    const all_apointments = await getUserAppointments(user, queryParams);
    if (!all_apointments)
      throw new HTTPError(`Could Not get all appointments of user`, 204);
    const code = all_apointments.success ? 200 : 400;
    res.status(code).json({ data: all_apointments });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const updateAppointmentById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const queryParams = req.query;
    if (!user) throw new HTTPError("Unauthorized", 401);
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = UpdateAppointmentValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const apptId: string = req.params.id as string;
    if (!apptId) throw new HTTPError("Appointment Id is missing", 422);

    const updateInputData = {
      data: data,
      apptId,
      userId: user?.id,
    };
    const updatedAppointment = await updateAppointment(
      updateInputData,
      queryParams
    );

    if (!updatedAppointment)
      throw new HTTPError(`Could Not update appointment data`, 204);
    const code = updatedAppointment.success ? 200 : 400;
    res.status(code).json({ data: updatedAppointment });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const deleteAppointmentById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorized", 401);

    const queryParams = req.query;
    const { famCareMemberId, id } = queryParams;

    if (!id || !user.id)
      throw new HTTPError("Required fields are missing", 422);

    const deleteAppointmentData = await deleteAppointment(
      {
        apptId: id as string,
        userId: user.id,
      },
      (famCareMemberId as string)?.toLowerCase()
    );

    if (!deleteAppointmentData)
      throw new HTTPError(`Could Not update appointment data`, 204);
    const code = deleteAppointmentData.success ? 200 : 400;
    res.status(code).json({ data: deleteAppointmentData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
