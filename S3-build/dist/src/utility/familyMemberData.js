"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMemberDataById = exports.FamilyMembersData = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const vitals_services_1 = require("../services/vitals.services");
const changeHistoryTrackFunction_1 = require("./changeHistoryTrackFunction");
const HttpError_1 = __importDefault(require("./HttpError"));
const FamilyMembersData = async (getAllFamilyMembers) => {
    // let memberData: FamilyMemberData[] = [];
    let D7 = [], U6 = [], H8 = [];
    for (const member of getAllFamilyMembers) {
        if (member.linkType == "minor") {
            const dependantData = await prisma_1.default.dependant.findUnique({
                where: {
                    id: member.linkTo,
                },
            });
            if (dependantData) {
                D7.push(dependantData);
                const healthData = await prisma_1.default.healthRecord.findFirst({
                    where: {
                        forDependantId: member.linkTo,
                    },
                });
                if (healthData)
                    H8.push(healthData);
            }
        }
        else {
            const userData = await prisma_1.default.users.findUnique({
                where: {
                    id: member.linkTo,
                },
            });
            if (userData) {
                const { refreshToken, password, ...filteredUserData } = userData;
                U6.push(filteredUserData);
                const healthData = await prisma_1.default.healthRecord.findFirst({
                    where: {
                        forUserId: member.linkTo,
                    },
                });
                if (healthData)
                    H8.push(healthData);
            }
        }
    }
    return {
        D7,
        U6,
        H8,
        F9: getAllFamilyMembers,
    };
};
exports.FamilyMembersData = FamilyMembersData;
const getMemberDataById = async (user, memberId) => {
    try {
        if (!user) {
            throw new HttpError_1.default("Unauthorised", 401);
        }
        const getMemberLink = await prisma_1.default.familylinks.findFirst({
            where: {
                linkFrom: user.id,
                linkTo: memberId.toLowerCase(),
            },
        });
        if (!getMemberLink)
            throw new HttpError_1.default("Could not fetch family member linking data", 500);
        let memberData;
        if (getMemberLink.linkType == "minor") {
            memberData = await prisma_1.default.dependant.findFirst({
                where: {
                    id: memberId.toLowerCase(),
                },
                include: {
                    healthRecord: true,
                    appointment: {
                        where: {
                            apptDate: { gte: new Date() }, // Upcoming appointments
                        },
                        orderBy: { apptDate: "asc" },
                        take: 4,
                    },
                    medicine: {
                        where: {
                            startAt: { gte: new Date() }, // Upcoming medicines
                        },
                        orderBy: { startAt: "asc" },
                        take: 4,
                    },
                },
            });
        }
        else {
            memberData = await prisma_1.default.users.findFirst({
                where: {
                    id: memberId.toLowerCase(),
                },
                include: {
                    healthRecord: true,
                    appointment: {
                        where: {
                            apptDate: { gte: new Date() }, // Upcoming appointments
                        },
                        orderBy: { apptDate: "asc" },
                        take: 4,
                    },
                    medicine: {
                        where: {
                            startAt: { gte: new Date() }, // Upcoming medicines
                        },
                        orderBy: { startAt: "asc" },
                        take: 4,
                    },
                },
            });
        }
        if (!memberData)
            throw new HttpError_1.default("Could Not Find User", 404);
        // Combine and sort appointments and medicines
        const upcomingEvents = [];
        if (memberData?.appointment?.length) {
            memberData.appointment.forEach((appointment) => upcomingEvents.push(appointment));
        }
        if (memberData?.medicine?.length) {
            memberData.medicine.forEach((medicine) => upcomingEvents.push(medicine));
        }
        upcomingEvents.sort((event1, event2) => {
            // Sort by date (ascending)
            const dateComparison = event1.apptDate?.getDate() - event2.apptDate?.getDate() || 0;
            if (dateComparison !== 0) {
                return dateComparison;
            }
            // If dates are equal, sort by time (ascending)
            if (event1.startAt && event2.startAt) {
                return event1.startAt.getTime() - event2.startAt.getTime();
            }
            else if (event1.startAt) {
                return (event1.startAt.getTime() - (event2.apptDate?.getTime() || Infinity));
            }
            else {
                return ((event2.startAt?.getTime() || Infinity) - event1.apptDate?.getTime());
            }
        });
        //get all self-awareness-data
        const selfAwareness = await (0, vitals_services_1.getUserVitalModules)(user, {
            famCareMemberId: memberId.toLowerCase(),
        });
        const HomePageData = {
            family_care_details: {
                relation: getMemberLink.relation,
                linktype: getMemberLink.linkType,
                access_type: getMemberLink.accessType,
                senstiveData: getMemberLink.sensitiveDataAccess,
                sync: getMemberLink.synced,
            },
            user: {
                id: memberData.id,
                fullName: memberData.fullName,
                gender: memberData.gender,
                dob: memberData.dob,
                address: memberData.address,
                pincode: memberData.pincode,
                emergencyContact: memberData.emergencyContact,
                profileImage: memberData.profileImage,
                QRCodeURL: memberData.QRCodeURL,
            },
            HealthRecords: memberData.healthRecord,
            upcomingEvents: upcomingEvents.slice(0, 4),
            selfAwareness: selfAwareness.V5,
        };
        const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
        if (!updateActiveSession) {
            throw new HttpError_1.default("Could not update active session", 204);
        }
        return {
            success: true,
            HomePageData,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            if (error.name == "PrismaClientKnownRequestError")
                throw new HttpError_1.default("Prisma Client error", 500);
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.getMemberDataById = getMemberDataById;
//# sourceMappingURL=familyMemberData.js.map