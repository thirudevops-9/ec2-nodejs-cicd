import { Changes } from "@prisma/client";
import prisma from "../prisma";
import dotenv from "dotenv";
import HTTPError from "./HttpError";
dotenv.config();

export const trackChanges = async (
  userChanged: string,
  changeType: Changes,
  recordId: number,
  tableId: string,
  changedBy: string
) => {
  //1. flag user sync for user whose data is changed (if another member is changing data)
  if (userChanged != changedBy) {
    await prisma.users.update({
      where: {
        id: userChanged,
      },
      data: {
        isSync: false,
      },
    });
  }

  //2. Find all family members who can see "userchanged" data
  const family = await prisma.familylinks.findMany({
    where: {
      ...(userChanged == changedBy
        ? {
            linkTo: userChanged,
          }
        : {
            linkTo: userChanged,
            NOT: {
              linkFrom: changedBy,
            },
          }),
    },
  });

  //3. flag all family links between member -> userChanged
  await prisma.familylinks.updateMany({
    where: {
      ...(userChanged == changedBy
        ? {
            linkTo: userChanged,
          }
        : {
            linkTo: userChanged,
            NOT: {
              linkFrom: changedBy,
            },
          }),
    },
    data: {
      synced: false,
    },
  });

  //4. add changes under all family members who can see "userchanged" data
  let changesRecord = [];
  if (family.length == 0) {
    changesRecord.push(
      await prisma.syncChanges.create({
        data: {
          userChanged: userChanged,
          changeType: changeType,
          familyMember: userChanged,
          recordId: recordId,
          table: tableId,
          changedBy: changedBy, //logged In user
        },
      })
    );
  } else {
    changesRecord.push(
      await prisma.syncChanges.create({
        data: {
          userChanged: userChanged,
          changeType: changeType,
          familyMember: userChanged,
          recordId: recordId,
          table: tableId,
          changedBy: changedBy, //logged In user
        },
      })
    );
    changesRecord.push(
      family.map(async (member) => {
        const res = await prisma.syncChanges.create({
          data: {
            userChanged: userChanged,
            changeType: changeType,
            familyMember: member.linkFrom,
            recordId: recordId,
            table: tableId,
            changedBy: changedBy, //logged In user
          },
        });
        if (!res) throw new HTTPError("Could not track change", 500);
      })
    );
  }

  if (!changesRecord)
    throw new HTTPError("Could not record changes for family members", 500);

  return {
    success: true,
    changes: changesRecord,
  };
};

export const trackActiveSession = async (uuid: string) => {
  const trackedChanges = await prisma.activeUsers.upsert({
    where: {
      id: uuid,
    },
    update: {
      user: {
        connect: {
          id: uuid,
        },
      },
      timeStamp: new Date(Date.now()),
    },
    create: {
      user: {
        connect: {
          id: uuid,
        },
      },
      timeStamp: new Date(Date.now()),
    },
  });
  if (!trackedChanges) {
    throw new HTTPError("Could not track active session", 500);
  }
  return true;
};
