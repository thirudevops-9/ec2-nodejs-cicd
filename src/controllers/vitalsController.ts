import { query, Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  addNewVitalModule,
  addNewVitalRecord,
  // notePeriodRecord,
  deleteVitalModule,
  deleteVitalsRecords,
  getUserVitalModules,
  getVitalModules,
  getVitalRecordsOfUser,
  editVitalModuleById,
} from "../services/vitals.services";
import {
  BulkVitalModule,
  CreateVitalRecord,
  updateVitalModuleValidation,
} from "../utility/Validation/VitalsValidation";

//USER DATA
export const createVitalRecord = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorised", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data)
      throw new HTTPError(
        "Required fields missing (vital module code / vital record data)",
        401
      );
    const validationResponse = CreateVitalRecord.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const input = {
      userId: user.id,
      ...data,
    };

    if (!user.id || !data.vitalCode || !data.vitalData) {
      throw new HTTPError("Missing required fields", 422);
    }

    const newVitalRecord = await addNewVitalRecord(input, queryParams);
    if (!newVitalRecord)
      throw new HTTPError(`Could Not Create New vitals record`, 204);
    const code = newVitalRecord.success ? 200 : 400;
    res.status(code).json({ data: newVitalRecord });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

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

export const  getVitalDataByModule = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    if (!user) throw new HTTPError("Unauthorised", 401);

    const queryParams = req.query;
    const input = {
      userId: user.id,
    };

    if (!user.id) {
      throw new HTTPError("Missing required fields", 422);
    }
    const newVitalRecord = await getVitalRecordsOfUser(input, queryParams);
    if (!newVitalRecord) throw new HTTPError(`Could Not Get User Details`, 204);
    const code = newVitalRecord.success ? 200 : 400;
    res.status(code).json({ data: newVitalRecord });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getValidVitalModules = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware
    if (!user) throw new HTTPError("Unauthorised", 401);

    const queryParams = req.query;

    const vitalModules = await getUserVitalModules(user, queryParams);
    if (!vitalModules)
      throw new HTTPError(
        `Could Not Fetch Self awareness modules for user`,
        204
      );
    const code = vitalModules.success ? 200 : 400;
    res.status(code).json({ data: vitalModules });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const deleteVitalRecordById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorized", 401);

    const queryParams = req.query;
    const { famCareMemberId, id } = queryParams;

    if (!id) throw new HTTPError("Enter id of records to delete", 422);

    if (!id || !user.id)
      throw new HTTPError("Required fields are missing", 422);

    const deleteVitalData = await deleteVitalsRecords(
      {
        vitalId: id as string,
        userId: user.id,
      },
      (famCareMemberId as string)?.toLowerCase()
    );

    if (!deleteVitalData)
      throw new HTTPError(`Could Not delete vital(s) data`, 204);
    const code = deleteVitalData.success ? 200 : 400;
    res.status(code).json({ data: deleteVitalData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//ADMIN FUNCTIONS
export const createVitalModules = async (req: Request, res: Response) => {
  try {
    const admin = req.admin; // access admin object attached in the middleware
    if (!admin) throw new HTTPError("Unauthorised", 401);

    if (admin.role === "AUDITOR")
      throw new HTTPError("Not authorised to make this change", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!data) throw new HTTPError("Required fields misisng", 422);
    const validationResponse = BulkVitalModule.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const newVitalRecord = await addNewVitalModule(data, admin);
    if (!newVitalRecord)
      throw new HTTPError(`Could Not Add New Self-awareness module`, 204);
    const code = newVitalRecord.success ? 200 : 400;
    res.status(code).json({ data: newVitalRecord });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getAllVitalModules = async (req: Request, res: Response) => {
  try {
    const admin = req.admin; // access admin object attached in the middleware
    if (!admin) throw new HTTPError("Unauthorised", 401);

    const queryParams = req.query;

    const vitalModules = await getVitalModules(queryParams);
    if (!vitalModules)
      throw new HTTPError(
        `Could Not Fetch Self awareness modules for admin`,
        204
      );
    const code = vitalModules.success ? 200 : 400;
    res.status(code).json({ data: vitalModules });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
export const deleteVitalModules = async (req: Request, res: Response) => {
  try {
    const admin = req.admin; // access admin object attached in the middleware
    if (!admin) throw new HTTPError("Unauthorised", 401);
    const userId = req.user?.id as string;
    if (!userId) {
      throw new HTTPError("unauthorized", 401);
    }
    let queryParams = req.query;

    const deletedVitalModule = await deleteVitalModule(queryParams, userId);
    if (!deletedVitalModule) {
      throw new HTTPError(" could not delete record", 204);
    }
    const code = deletedVitalModule.success ? 200 : 400;
    res.status(code).json({ error: { data: deletedVitalModule } });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
export const updateVitalModuleById = async (req: Request, res: Response) => {
  try {
    const admin = req.admin; // access admin object attached in the middleware
    if (!admin) throw new HTTPError("Unauthorised", 401);

    if (admin.role === "AUDITOR")
      throw new HTTPError("Not authorised to make this change", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const moduleId = req.params.id;
    if (!data || !moduleId) throw new HTTPError("Required fields misisng", 422);
    const validationResponse = updateVitalModuleValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const updateVitalModule = await editVitalModuleById(data, moduleId);
    if (!updateVitalModule)
      throw new HTTPError(`Could Not Update Self-awareness module`, 204);
    const code = updateVitalModule.success ? 200 : 400;
    res.status(code).json({ data: updateVitalModule });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
