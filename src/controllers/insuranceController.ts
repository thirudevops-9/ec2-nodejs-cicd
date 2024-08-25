import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  ChangeInsuranceValidation,
  uploadInsuranceValidation,
} from "../utility/Validation/insuranceValidations";
import {
  delPolicies,
  editPolicy,
  findNotification,
  getUserPolicies,
  uploadInsurance,
} from "../services/insurance.services";

export const createPolicy = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorised", 401);
    const file = req.file;
    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const userId = user.id;
    const queryParams = req.query;

    if (!form_data || !user.id) {
      throw new HTTPError("Missing required fields", 422);
    }
    const validationResponse = uploadInsuranceValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[1]} : ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const uploadInsuranceResponse = await uploadInsurance(
      {
        file,
        userId,
        form_data,
      },
      queryParams
    );
    if (!uploadInsuranceResponse) {
      throw new HTTPError("could not upload insurance", 204);
    }
    const code = uploadInsuranceResponse.success ? 200 : 400;
    res.status(code).json({ data: uploadInsuranceResponse });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getAllPolicies = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorised", 401);

    const all_policies = await getUserPolicies(user, queryParams);
    if (!all_policies)
      throw new HTTPError(`Could Not get documents for user`, 204);
    const code = all_policies.success ? 200 : 400;
    res.status(code).json({ data: all_policies });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const updatePolicyById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) throw new HTTPError("Unauthorised", 401);
    const file = req.file;
    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const queryParams = req.query;

    const validationResponse = ChangeInsuranceValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[1]} : ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    const userId = user?.id as string;
    const id = req.params.id;

    const editInsuranceResponse = await editPolicy(
      {
        file,
        userId,
        form_data,
        id,
      },
      queryParams
    );
    if (!editInsuranceResponse) {
      throw new HTTPError("Could not edit policy", 204);
    }
    const code = editInsuranceResponse.success ? 200 : 400;
    res.status(code).json({ data: editInsuranceResponse });
  } catch (err) {
    // console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const deletePolicies = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unauthorized", 401);
    }
    const userId = user?.id as string;
    // const id = req.params.doc_id;
    const queryParams = req.query;
    const { famCareMemberId, id } = queryParams;
    if (!id) throw new HTTPError("Enter id of records to delete", 422);
    // const userId: string = "oi18wv43";
    if (user) {
      if (!userId || !id) throw new HTTPError("Required fields missing", 422);
      const delInsuranceResponse = await delPolicies(
        { userId, id: id as string },
        (famCareMemberId as string)?.toLowerCase()
      );
      if (!delInsuranceResponse) {
        throw new HTTPError("Could not delete policy", 204);
      }
      const code = delInsuranceResponse.success ? 200 : 400;
      res.status(code).json({ data: delInsuranceResponse });
    } else {
      throw new HTTPError("validation error", 400);
    }
  } catch (err) {
    // console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//notifications
export const getNotification = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unauthorized", 401);
    }
    const userId = user?.id as string;
    const id  = req.query;

    if (!userId) throw new HTTPError("Required fields missing", 422);
    const findNotificationResponse = await findNotification(userId, id);
    if (!findNotificationResponse) {
      throw new HTTPError("Could not find notification", 204);
    }
    const code = findNotificationResponse.success ? 200 : 400;
    res.status(code).json({ data: findNotificationResponse });
  } catch (err) {
    // console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
