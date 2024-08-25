import { addMinutes, isAfter } from "date-fns";
import prisma from "../../prisma";

// Function to unblock the user after 30 minutes
export async function unblockUsers() {
  try {
    const users = await prisma.users.findMany({
      where: {
        isBlocked: true,
      },
      include: {
        blockReasons: {
          where: {
            blockReason: "auto-block",
            blockedBy: "app",
          },
        },
      },
    });

    const now = new Date();

    for (const user of users) {
      if (user.blockedAt && isAfter(now, addMinutes(user.blockedAt, 30))) {
        await prisma.users.update({
          where: {
            id: user.id,
          },
          data: {
            isBlocked: false,
            blockedAt: null, // Clear the blocked timestamp
            wrongLoginAttempts: 0,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error deleting old non-registered users:", error);
  } finally {
    await prisma.$disconnect();
  }
}
