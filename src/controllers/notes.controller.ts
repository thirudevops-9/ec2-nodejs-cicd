import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  createNotesValidation,
  updateNotesValidation,
} from "../utility/Validation/notesValidation";
import {
  createUserNotes,
  deleteNote,
  getUserNotes,
  editNotes,
} from "../services/notes.services";

//create notes
export const createNotes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    if (!req.user) {
      throw new HTTPError("Unauthorized", 401);
    }
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    const queryParams = req.query;
    const validationResponse = createNotesValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    if (!data.color || !data.description || !data.title) {
      throw new HTTPError("Missing required fields", 422);
    }
    const createdNotes = await createUserNotes(data, userId, queryParams);
    if (!createdNotes) {
      throw new HTTPError("could not create notes", 204);
    }
    const code = createdNotes.success ? 200 : 400;
    res.status(code).json({ data: createdNotes });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//read all notes
export const getAllNotes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    if (!req.user) {
      throw new HTTPError("Unauthorized", 401);
    }
    const queryParams = req.query;

    const readAllNotes = await getUserNotes(userId, queryParams);
    if (!readAllNotes) {
      throw new HTTPError("could not create notes", 204);
    }
    const code = readAllNotes.success ? 200 : 400;
    res.status(code).json({ data: readAllNotes });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//update notes
export const updateNotes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const notesId = parseInt(req.params.id);
    const queryParams = req.query;
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = updateNotesValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }
    if (!req.user) {
      throw new HTTPError("Unauthorized", 401);
    }
    const updatedNotes = await editNotes(userId, notesId, queryParams, data);
    if (!updatedNotes) {
      throw new HTTPError("could not create notes", 204);
    }
    const code = updatedNotes.success ? 200 : 400;
    res.status(code).json({ data: updatedNotes });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//delete notes
export const deleteNotes = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    if (!userId) {
      throw new HTTPError("unauthorized", 401);
    }
    let queryParams = req.query;

    // if (!queryParams ) {
    //   throw new HTTPError("provide the id of the note to be deleted", 422);
    // }

    const deletedNotes = await deleteNote(queryParams, userId);
    if (!deletedNotes) {
      throw new HTTPError(" could not delete record", 204);
    }
    const code = deletedNotes.success ? 200 : 400;
    res.status(code).json({ error: { data: deletedNotes } });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
