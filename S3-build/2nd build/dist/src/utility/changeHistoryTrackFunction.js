"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackActiveSession = exports.trackChanges = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const dotenv_1 = __importDefault(require("dotenv"));
const HttpError_1 = __importDefault(require("./HttpError"));
dotenv_1.default.config();
const trackChanges = async (userChanged, changeType, recordId, tableId, changedBy) => {
    //1. flag user sync for user whose data is changed (if another member is changing data)
    if (userChanged != changedBy) {
        await prisma_1.default.users.update({
            where: {
                id: userChanged,
            },
            data: {
                isSync: false,
            },
        });
    }
    //2. Find all family members who can see "userchanged" data
    const family = await prisma_1.default.familylinks.findMany({
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
    await prisma_1.default.familylinks.updateMany({
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
        changesRecord.push(await prisma_1.default.syncChanges.create({
            data: {
                userChanged: userChanged,
                changeType: changeType,
                familyMember: userChanged,
                recordId: recordId,
                table: tableId,
                changedBy: changedBy, //logged In user
            },
        }));
    }
    else {
        changesRecord.push(await prisma_1.default.syncChanges.create({
            data: {
                userChanged: userChanged,
                changeType: changeType,
                familyMember: userChanged,
                recordId: recordId,
                table: tableId,
                changedBy: changedBy, //logged In user
            },
        }));
        changesRecord.push(family.map(async (member) => {
            const res = await prisma_1.default.syncChanges.create({
                data: {
                    userChanged: userChanged,
                    changeType: changeType,
                    familyMember: member.linkFrom,
                    recordId: recordId,
                    table: tableId,
                    changedBy: changedBy, //logged In user
                },
            });
            if (!res)
                throw new HttpError_1.default("Could not track change", 500);
        }));
    }
    if (!changesRecord)
        throw new HttpError_1.default("Could not record changes for family members", 500);
    return {
        success: true,
        changes: changesRecord,
    };
};
exports.trackChanges = trackChanges;
const trackActiveSession = async (uuid) => {
    const trackedChanges = await prisma_1.default.activeUsers.upsert({
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
        throw new HttpError_1.default("Could not track active session", 500);
    }
    return true;
};
exports.trackActiveSession = trackActiveSession;
//# sourceMappingURL=changeHistoryTrackFunction.js.map