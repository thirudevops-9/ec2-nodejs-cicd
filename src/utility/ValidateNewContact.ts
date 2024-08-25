import { verifiedContactId } from "@prisma/client";
import prisma from "../prisma";
import HTTPError from "./HttpError";

export const validateContact = async (
  uuid: string,
  verifiedContact: verifiedContactId,
  contact: string
) => {
  try {
    const allUsers = await prisma.users.findMany();

    for (const user of allUsers) {
      if (user[verifiedContact] === contact && user.id !== uuid) {
        return {
          success: false,
          message: "This Contact detail already exists for a different user",
        };
      }
      if (user[verifiedContact] === contact && user.id == uuid) {
        return {
          success: false,
          message: "Contact cannot be the same as previous one",
        };
      }
    }

    return {
      success: true,
      message: "Contact is valid",
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      console.log(error);
      throw new HTTPError("Internal Server Error", 500);
    }
  }
};
