import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import firebase from "firebase-admin";
import HTTPError from "./HttpError";

export const notificationStore = async (
  userId: string,
  notifContent: string,
  redirectLink: string,
  id?: string,
  linkFromFullName?: string
) => {
  const userExists = await prisma.users.findUnique({
    where: {
      id: userId,
    },
  });
  if (!userExists) {
    throw new HTTPError(`User with ID ${userId} does not exist.`, 404);
  }

  const newNotification: Prisma.InputJsonValue = {
    title: "Family Care",
    body: notifContent,
    click_action: redirectLink,
  };

  const createNotification = await prisma.notifications.create({
    data: {
      userId: userId,
      content: newNotification,
    },
  });
  if (!createNotification) {
    throw new HTTPError("notification could not be store", 500);
  }
  const accessFrom = id ?? null;
  if (accessFrom != null) {
    const updateNotification = await prisma.notifications.update({
      where: {
        id: createNotification.id,
      },
      data: {
        changeAccessOf: accessFrom,
        AccessText: `${linkFromFullName} can view your data`,
      },
    });
    if (!updateNotification) {
      throw new HTTPError("notification could not be store", 5000);
    }
  }

  return {
    success: true,
    id: createNotification.id,
  };
};

export const sendNotificationFamilyCare = async (
  findUser: {
    deviceToken: string | null;
    fullName: string;
  },
  notifContent: string,
  redirectLink: string,
  id: number
) => {
  try {
    const message = {
      token: findUser.deviceToken as string,
      data: {
        notificationId: id.toString(),
        redirectTo: redirectLink,
      },
      notification: {
        title: "Family Care",
        body: notifContent,
        // click_action:redirectLink
      },
    };

    const sendNotification = await firebase.messaging().send(message);
    if (!sendNotification) {
      throw new HTTPError("notification could not be sent", 502);
    }
    return true;
  } catch (error: Error | HTTPError | any) {
    console.error("Error caught in errorHandler:", error);
    if (
      error.code === "messaging/invalid-argument" &&
      error.message.includes(
        "The registration token is not a valid FCM registration token"
      )
    ) {
      return true;
    } else if (error instanceof HTTPError) {
      throw new HTTPError(error.message, 200);
    } else {
      return true;
    }
  }
};
