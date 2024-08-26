"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deduceRelation = exports.familyLink = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const HttpError_1 = __importDefault(require("./HttpError"));
const familyLink = async (from, to) => {
    if (!from || !to)
        throw new HttpError_1.default("Missing required fields", 422);
    const linkData = await prisma_1.default.familylinks.findFirst({
        where: {
            linkFrom: from,
            linkTo: to,
        },
    });
    if (!linkData)
        throw new HttpError_1.default("Could not find link between specified users", 404);
    return {
        linkData,
    };
};
exports.familyLink = familyLink;
const deduceRelation = async (relation, userId) => {
    const findUser = await prisma_1.default.users.findFirst({
        where: {
            id: userId,
        },
        select: {
            gender: true,
        },
    });
    if (!findUser)
        throw new HttpError_1.default("Could not find user", 404);
    if ((relation == "brother" || relation == "sister") &&
        findUser.gender == "female")
        return "sister";
    if ((relation == "brother" || relation == "sister") &&
        findUser.gender == "male")
        return "brother";
    if (relation == "friend")
        return "friend";
    //Lesbian Couples
    if ((relation == "wife" || relation == "spouse") &&
        (findUser.gender == "female" || findUser.gender == "other"))
        return "wife";
    //gay couple
    if ((relation == "husband" || relation == "spouse") &&
        (findUser.gender == "male" || findUser.gender == "other"))
        return "husband";
    //Straight couples
    if ((relation == "wife" || relation == "spouse") && findUser.gender == "male")
        return "husband";
    if ((relation == "husband" || relation == "spouse") &&
        findUser.gender == "female")
        return "wife";
    if (relation == "father" || relation == "mother" || relation == "parent")
        return "child";
    if (relation == "daughter" || relation == "son" || relation == "child")
        return "parent";
    //other
    if (relation == "other")
        return "other";
    if (relation == "family")
        return "family";
    return "other";
};
exports.deduceRelation = deduceRelation;
//parent
//spouse
//# sourceMappingURL=familyLinkData.js.map