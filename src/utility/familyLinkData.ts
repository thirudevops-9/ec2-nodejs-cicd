import prisma from "../prisma";
import HTTPError from "./HttpError";

export const familyLink = async (from: string, to: string) => {
  if (!from || !to) throw new HTTPError("Missing required fields", 422);

  const linkData = await prisma.familylinks.findFirst({
    where: {
      linkFrom: from,
      linkTo: to,
    },
  });
  if (!linkData)
    throw new HTTPError("Could not find link between specified users", 404);
  return {
    linkData,
  };
};

export const deduceRelation = async (relation: string, userId: string) => {
  const findUser = await prisma.users.findFirst({
    where: {
      id: userId,
    },
    select: {
      gender: true,
    },
  });
  if (!findUser) throw new HTTPError("Could not find user", 404);

  if (
    (relation == "brother" || relation == "sister") &&
    findUser.gender == "female"
  )
    return "sister";
  if (
    (relation == "brother" || relation == "sister") &&
    findUser.gender == "male"
  )
    return "brother";
  if (relation == "friend") return "friend";
  //Lesbian Couples
  if (
    (relation == "wife" || relation == "spouse") &&
    (findUser.gender == "female" || findUser.gender == "other")
  )
    return "wife";

  //gay couple
  if (
    (relation == "husband" || relation == "spouse") &&
    (findUser.gender == "male" || findUser.gender == "other")
  )
    return "husband";

  //Straight couples
  if ((relation == "wife" || relation == "spouse") && findUser.gender == "male")
    return "husband";
  if (
    (relation == "husband" || relation == "spouse") &&
    findUser.gender == "female"
  )
    return "wife";

  if (relation == "father" || relation == "mother" || relation == "parent")
    return "child";

  if (relation == "daughter" || relation == "son" || relation == "child")
    return "parent";

  //other
  if (relation == "other") return "other";
  if (relation == "family") return "family";

  return "other"
};
//parent
//spouse