"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationFamilyCare = exports.notificationStore = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const HttpError_1 = __importDefault(require("./HttpError"));
const notificationStore = async (userId, notifContent, redirectLink, id, linkFromFullName) => {
    const userExists = await prisma_1.default.users.findUnique({
        where: {
            id: userId,
        },
    });
    if (!userExists) {
        throw new HttpError_1.default(`User with ID ${userId} does not exist.`, 404);
    }
    const newNotification = {
        title: "Family Care",
        body: notifContent,
        click_action: redirectLink,
    };
    const createNotification = await prisma_1.default.notifications.create({
        data: {
            userId: userId,
            content: newNotification,
        },
    });
    if (!createNotification) {
        throw new HttpError_1.default("notification could not be store", 500);
    }
    const accessFrom = id ?? null;
    if (accessFrom != null) {
        const updateNotification = await prisma_1.default.notifications.update({
            where: {
                id: createNotification.id,
            },
            data: {
                changeAccessOf: accessFrom,
                AccessText: `${linkFromFullName} can view your data`,
            },
        });
        if (!updateNotification) {
            throw new HttpError_1.default("notification could not be store", 5000);
        }
    }
    return {
        success: true,
        id: createNotification.id,
    };
};
exports.notificationStore = notificationStore;
const sendNotificationFamilyCare = async (findUser, notifContent, redirectLink, id) => {
    try {
        const message = {
            token: findUser.deviceToken,
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
        const sendNotification = await firebase_admin_1.default.messaging().send(message);
        if (!sendNotification) {
            throw new HttpError_1.default("notification could not be sent", 502);
        }
        return true;
    }
    catch (error) {
        console.error("Error caught in errorHandler:", error);
        if (error.code === "messaging/invalid-argument" &&
            error.message.includes("The registration token is not a valid FCM registration token")) {
            return true;
        }
        else if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, 200);
        }
        else {
            return true;
        }
    }
};
exports.sendNotificationFamilyCare = sendNotificationFamilyCare;
//# sourceMappingURL=notification.js.map