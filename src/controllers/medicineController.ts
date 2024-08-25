import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  MedicineValidation,
  UpdateMedicineValidation,
} from "../utility/Validation/MedicineValidation";
import {
  createNewMedicineReminder,
  deleteMedicine,
  getUserReminders,
  getMedicineReminders,
  UpdateMedicineReminders,
} from "../services/medicine.services";

export const createMedicineReminder = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    if (!user) throw new HTTPError("Unauthorised", 401);

    const queryParams = req.query;

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = MedicineValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const {
      medName,
      medUnit,
      medIntakeTime,
      medIntakePerDose,
      medIntakeFrequency,
    } = data;

    if (
      !medName ||
      !medUnit ||
      !medIntakeTime ||
      !medIntakeFrequency ||
      !medIntakePerDose
    ) {
      throw new HTTPError("Missing required fields", 422);
    }

    const new_medicine = await createNewMedicineReminder(
      data,
      user,
      queryParams
    );
    if (!new_medicine)
      throw new HTTPError(`Could Not Create New Medicine Reminder`, 204);
    const code = new_medicine.success ? 200 : 400;
    res.status(code).json({
      data: new_medicine,
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getMedicines = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorised", 401);

    const all_medicines = await getMedicineReminders(user, queryParams);
    if (!all_medicines)
      throw new HTTPError(`Could Not get Medicines data `, 204);
    const code = all_medicines.success ? 200 : 400;
    res.status(code).json({
      data: all_medicines,
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const updateMedicineById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const queryParams = req.query;
    if (!user) throw new HTTPError("Unauthorized", 401);
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    const validationResponse = UpdateMedicineValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const medId: string = req.params.id as string;
    if (!medId) throw new HTTPError("Medicine Reminder Id is missing", 422);

    const updateInputData = {
      data: data,
      medId,
      userId: user?.id,
    };
    const updatedMedicineReminderData = await UpdateMedicineReminders(
      updateInputData,
      queryParams
    );

    if (!updatedMedicineReminderData)
      throw new HTTPError(`Could Not update medicine reminder data`, 204);
    const code = updatedMedicineReminderData.success ? 200 : 400;
    res.status(code).json({ data: updatedMedicineReminderData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const deleteMedicineById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorized", 401);

    const queryParams = req.query;
    const { famCareMemberId, id } = queryParams;

    if (!id) throw new HTTPError("Enter id of records to delete", 422);

    if (!id || !user.id)
      throw new HTTPError("Required fields are missing", 422);

    const deleteMedicineData = await deleteMedicine(
      {
        medId: id as string,
        userId: user.id,
      },
      (famCareMemberId as string)?.toLowerCase()
    );

    if (!deleteMedicineData)
      throw new HTTPError(`Could Not delete medicine reminder data`, 204);
    const code = deleteMedicineData.success ? 200 : 400;
    res.status(code).json({ data: deleteMedicineData });
  } catch (err) {
    console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getAllReminders = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorised", 401);

    const all_reminders = await getUserReminders(user, queryParams);
    if (!all_reminders)
      throw new HTTPError(`Could Not get Medicines data `, 204);
    const code = all_reminders.success ? 200 : 400;
    res.status(code).json({
      data: all_reminders,
    });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
