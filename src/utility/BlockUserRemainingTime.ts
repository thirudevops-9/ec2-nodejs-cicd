export const remainingTime = async (blockedAt: Date) => {
  const unblockTime = new Date(blockedAt.getTime() + 30 * 60 * 1000);
  const timeRemaining = unblockTime.getTime() - new Date().getTime();
  const error = {
    message: "This user has been blocked",
    timeRemaining: Math.ceil(timeRemaining / (1000 * 60)),
    timeUnit: "minutes",
    isUserBlocked: true,
  };
  return error;
};
