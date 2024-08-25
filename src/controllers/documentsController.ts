import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  delDocs,
  editDocs,
  getUserDocuments,
  uploadDocs,
} from "../services/documents.services";
import {
  editFileValidation,
  uploadFileValidation,
} from "../utility/Validation/DocumentValidation";

//validations for userUploadFile
// 1. file must be in .jpeg,jpg,pdf,png,heic,docx
// 2. form data must contain category: string;name: string;dr_name: string;note?: string;isSensitive: string;

export const userUploadFile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const file = req.file;
    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const userId = user?.id as string;
    const queryParams = req.query;
    console.log(form_data);

    if (!file || !form_data) {
      throw new HTTPError("Missing required fields here", 422);
    }
    const validationResponse = uploadFileValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[1]} : ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    if (user) {
      if (!file || !userId || !form_data) {
        throw new HTTPError("Required fields missing", 422);
      }

      const uploadImageResponse = await uploadDocs(
        {
          file,
          userId,
          form_data,
        },
        queryParams
      );
      if (!uploadImageResponse) {
        throw new HTTPError("Failed to upload file", 204);
      }
      const code = uploadImageResponse.success ? 200 : 400;
      res.status(code).json({ data: uploadImageResponse });
    } else {
      throw new HTTPError("validation error", 400);
    }
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  try {
    const user = req.user; // access user object attached in the middleware

    const queryParams = req.query;

    if (!user) throw new HTTPError("Unauthorised", 401);

    const all_documents = await getUserDocuments(user, queryParams);
    if (!all_documents)
      throw new HTTPError(`Could Not get documents for user`, 204);
    const code = all_documents.success ? 200 : 400;
    res.status(code).json({ data: all_documents });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const editUploadFile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unauthorised", 401);
    }
    const doc_file = req.file;
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const queryParams = req.query;

    const validationResponse = editFileValidation.safeParse({
      doc_file,
      data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[1]} : ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const file = doc_file;
    const userId = user?.id as string;
    const form_data = data;
    const id = req.params.doc_id;

    const uploadImageResponse = await editDocs(
      {
        file,
        userId,
        form_data,
        id,
      },
      queryParams
    );
    if (!uploadImageResponse) {
      throw new HTTPError("could not upload image", 204);
    }
    const code = uploadImageResponse.success ? 200 : 400;
    res.status(code).json({ data: uploadImageResponse });
  } catch (err) {
    // console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

export const deleteUploadFile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      throw new HTTPError("Unuathorised", 401);
    }
    const userId = user?.id as string;
    // const id = req.params.doc_id;
    const queryParams = req.query;
    const { famCareMemberId, id } = queryParams;
    
    if (!id) throw new HTTPError("Enter id of records to delete", 422);
    // const userId: string = "oi18wv43";

    if (!userId || !id) throw new HTTPError("Required fields missing", 422);
    const deleteDocResponse = await delDocs(
      { userId, id: id as string },
      (famCareMemberId as string)?.toLowerCase()
    );
    if (!deleteDocResponse) {
      throw new HTTPError("could not delete document", 204);
    }
    const code = deleteDocResponse.success ? 200 : 400;
    res.status(code).json({ data: deleteDocResponse });
  } catch (err) {
    // console.log(err);
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
