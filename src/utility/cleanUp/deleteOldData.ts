import prisma from "../../prisma";

export const deleteOldNonRegisteredUsers = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  try {
    const result = await prisma.verifiedUsers.deleteMany({
      where: {
        updatedAt: {
          lt: thirtyDaysAgo,
        },
        isVerified: false,
      },
    });

  } catch (error) {
    console.error("Error deleting old non-registered users:", error);
  } finally {
    await prisma.$disconnect();
  }
};

export const deleteOldOtpStoreData = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

  try {
    const result = await prisma.otpStore.deleteMany({
      where: {
        updatedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

  } catch (error) {
    console.error("Error deleting old OTP Store Data:", error);
  } finally {
    await prisma.$disconnect();
  }
};
