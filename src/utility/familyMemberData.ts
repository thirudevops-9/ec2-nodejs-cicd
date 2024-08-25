import prisma from "../prisma";
import { getUserVitalModules } from "../services/vitals.services";
import { trackActiveSession } from "./changeHistoryTrackFunction";
import { FamilyLinkType, FamilyMemberData } from "./DataTypes/types.familyCare";
import { TokenData } from "./DataTypes/types.user";
import HTTPError from "./HttpError";

export const FamilyMembersData = async (
  getAllFamilyMembers: FamilyLinkType[]
  
) => {
  // let memberData: FamilyMemberData[] = [];
  let D7 = [],
    U6 = [],
    H8 = [];
  for (const member of getAllFamilyMembers) {
    if (member.linkType == "minor") {
      const dependantData = await prisma.dependant.findUnique({
        where: {
          id: member.linkTo,
        },
      });
      if (dependantData) {
        D7.push(dependantData);
        const healthData = await prisma.healthRecord.findFirst({
          where: {
            forDependantId: member.linkTo,
          },
        });
        if (healthData) H8.push(healthData);
      }
    } else {
      const userData = await prisma.users.findUnique({
        where: {
          id: member.linkTo,
        },
      });
      if (userData) {
        const { refreshToken, password, ...filteredUserData } = userData;
        U6.push(filteredUserData);
        const healthData = await prisma.healthRecord.findFirst({
          where: {
            forUserId: member.linkTo,
          },
        });
        if (healthData) H8.push(healthData);
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

export const getMemberDataById = async (user: TokenData, memberId: string) => {
  try {
    if (!user) {
      throw new HTTPError("Unauthorised", 401);
    }
    const getMemberLink = await prisma.familylinks.findFirst({
      where: {
        linkFrom: user.id,
        linkTo: memberId.toLowerCase(),
      },
    });

    if (!getMemberLink)
      throw new HTTPError("Could not fetch family member linking data", 500);

    let memberData;
    if (getMemberLink.linkType == "minor") {
      memberData = await prisma.dependant.findFirst({
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
    } else {
      memberData = await prisma.users.findFirst({
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

    if (!memberData) throw new HTTPError("Could Not Find User", 404);
    // Combine and sort appointments and medicines
    const upcomingEvents: any = [];

    if (memberData?.appointment?.length) {
      memberData.appointment.forEach((appointment) =>
        upcomingEvents.push(appointment)
      );
    }

    if (memberData?.medicine?.length) {
      memberData.medicine.forEach((medicine) => upcomingEvents.push(medicine));
    }
    upcomingEvents.sort((event1: any, event2: any) => {
      // Sort by date (ascending)
      const dateComparison =
        event1.apptDate?.getDate() - event2.apptDate?.getDate() || 0;
      if (dateComparison !== 0) {
        return dateComparison;
      }

      // If dates are equal, sort by time (ascending)
      if (event1.startAt && event2.startAt) {
        return event1.startAt.getTime() - event2.startAt.getTime();
      } else if (event1.startAt) {
        return (
          event1.startAt.getTime() - (event2.apptDate?.getTime() || Infinity)
        );
      } else {
        return (
          (event2.startAt?.getTime() || Infinity) - event1.apptDate?.getTime()
        );
      }
    });

    //get all self-awareness-data
    const selfAwareness = await getUserVitalModules(user, {
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
    const updateActiveSession = trackActiveSession(user.id);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    return {
      success: true,
      HomePageData,
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
