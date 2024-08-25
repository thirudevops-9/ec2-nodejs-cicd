import { ParsedQs } from "qs";
import { familyLink } from "../utility/familyLinkData";
import HTTPError from "../utility/HttpError";
import prisma from "../prisma";
import {
  trackActiveSession,
  trackChanges,
} from "../utility/changeHistoryTrackFunction";
import { filterRecords } from "../utility/RecordList";

export const createUserNotes = async (
  data: { title: string; color: string; description: string },
  userId: string,
  queryParams: ParsedQs
) => {
  try {
    const { title, color, description } = data;
    const { famCareMemberId } = queryParams;

    let createdNotes;

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );
      if (linkData.accessType === "view") {
        throw new HTTPError("You are not authorised to make this change", 401);
      }

      createdNotes = await prisma.notes.create({
        data: {
          createdBy: userId,
          title: title,
          color: color,
          description: description,
          ...(linkData.linkType === "minor"
            ? {
                forDependantId: linkData.linkTo,
              }
            : {
                forUserId: linkData.linkTo,
              }),
        },
      });

      if (!createdNotes) {
        throw new HTTPError("db:error ,could not create Notes", 500);
      }

      if (linkData.linkType != "minor") {
        const changeHistory = await trackChanges(
          (famCareMemberId as string)?.toLowerCase(),
          "CREATE",
          createdNotes.id,
          "N4",
          userId
        );
        if (!changeHistory.success)
          throw new HTTPError("Could not track change", 204);
      }
    } else {
      createdNotes = await prisma.notes.create({
        data: {
          createdBy: "self",
          title: title,
          color: color,
          description: description,
          forUserId: userId,
        },
      });
      if (!createdNotes) {
        throw new HTTPError("db:error ,could not create Notes", 500);
      }
      const changeHistory = await trackChanges(
        userId,
        "CREATE",
        createdNotes.id,
        "N4",
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
      message: "note created successfully",
      N4: createdNotes,
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

export const getUserNotes = async (userId: string, queryParams: ParsedQs) => {
  try {
    const { id, famCareMemberId } = queryParams;
    const filters: any = {};

    if (famCareMemberId) {
      const { linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      );
      linkData.linkType === "minor"
        ? (filters.forDependantId = famCareMemberId) //fetch minor notes
        : (filters.forUserId = famCareMemberId); //fetch subaccount and existing AC
    } else {
      filters.forUserId = userId; //fetch data of logged in userId
    }

    if (id) {
      filters.id = id; //fetch specific note
    }

    const allNotes = await prisma.notes.findMany({
      where: {
        AND: [filters],
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      N4: allNotes,
      // .map((item) => {
      //   return {
      //     id: item.id,
      //     createdAt: item.createdAt,
      //     updatedAt: item.updatedAt,
      //     title: item.title,
      //     description: item.description,
      //     color: item.color,
      //     createdBy: item.createdBy,
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

export const editNotes = async (
  userId: string,
  notesId: number,
  queryParams: ParsedQs,
  data: { title?: string; description?: string; color?: string }
) => {
  try {
    const { famCareMemberId } = queryParams;
    const { title, description, color } = data;
    const filters: any = { id: notesId };
    let linkData;
    if (famCareMemberId) {
      ({ linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      ));
      if (linkData.accessType === "view") {
        throw new HTTPError("You are not authorised to make this change", 401);
      }
      linkData.linkType === "minor"
        ? (filters.forDependantId = famCareMemberId) //fetch minor notes
        : (filters.forUserId = famCareMemberId); //fetch subaccount and existing AC
    } else {
      filters.forUserId = userId;
    }
    const findNotes = await prisma.notes.findFirst({
      where: filters,
    });
    if (!findNotes) {
      throw new HTTPError("The note  does not exist", 404);
    }

    const updatedNote = await prisma.notes.update({
      where: {
        id: findNotes.id,
      },
      data: {
        title: title,
        description: description,
        color: color,
      },
    });

    if (!updatedNote) {
      throw new HTTPError("could not update the notes", 500);
    }
    const uuid =
      famCareMemberId && linkData && linkData.linkType != "minor"
        ? (famCareMemberId as string)?.toLowerCase()
        : userId;

    const changeHistory = await trackChanges(
      uuid,
      "UPDATE",
      updatedNote.id,
      "N4",
      userId
    );

    if (!changeHistory.success)
      throw new HTTPError("Could not track change", 204);

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      message: "note updated successfully!",
      N4: updatedNote,
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

export const deleteNote = async (queryParams: ParsedQs, userId: string) => {
  try {
    let notesId: Array<number> = [];
    const { id } = queryParams;
    if(!id){
    throw new HTTPError("provide the id of the note to be deleted", 422);
    }
    const { famCareMemberId } = queryParams;
    const filters: any = {};
    if (!Array.isArray(id)) {
      notesId = (id as string).split(",").map((item: string) => {
        return parseInt(item);
      });
    }
    let linkData;
    if (famCareMemberId) {
      ({ linkData } = await familyLink(
        userId,
        (famCareMemberId as string)?.toLowerCase()
      ));
      if (linkData.accessType === "view") {
        throw new HTTPError("You are not authorised to make this change", 401);
      }
      linkData.linkType === "minor"
        ? (filters.forDependantId = famCareMemberId) //fetch minor notes
        : (filters.forUserId = famCareMemberId); //fetch subaccount and existing AC
    } else {
      filters.forUserId = userId;
    }
    // Fetch the notes to delete
    const notesToDelete = await prisma.notes.findMany({
      where: {
        id: {
          in: notesId,
        },
        ...filters,
      },
    });
    if(!notesToDelete ||notesToDelete.length != notesId.length){
      throw new HTTPError("Note(s) does not exist",404)
    }
    const deletedRecords = notesToDelete.map((note) => note.id);

    // if (!notesToDelete || notesToDelete.length === 0) {
    //   throw new HTTPError("Note to be deleted not found", 404);
    // }

    const deleteNote = await prisma.notes.deleteMany({
      where: {
        id: {
          in: notesId,
        },
        ...filters,
      },
    });
    if (!deleteNote || deleteNote.count === 0) {
      throw new HTTPError("Note to be deleted not found ", 500);
    }
    const uuid =
      famCareMemberId && linkData && linkData.linkType != "minor"
        ? (famCareMemberId as string)?.toLowerCase()
        : userId;

    for (const item of notesToDelete) {
      const changeHistory = await trackChanges(
        uuid,
        "DELETE",
        item.id,
        "N4",
        userId
      );
      if (!changeHistory.success)
        throw new HTTPError("Could not track change", 204);
    }

    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }

    //find successfull and failed records:
    const failedRecords = await filterRecords(deletedRecords, notesId);
    return {
      success: true,
      message: "note(s) deleted successfully",
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
