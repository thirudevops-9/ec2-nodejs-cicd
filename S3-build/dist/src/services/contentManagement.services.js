"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.complaintReplyById = exports.getAllMessages = exports.getAllAdminContent = exports.deleteFacilities = exports.updateFacilitiesById = exports.getAllFacilities = exports.createNewFacilities = exports.deleteAdvertisements = exports.updateAdvertisementById = exports.getAllAdvertisements = exports.createNewAdvertisement = exports.deleteVideo = exports.editVideosById = exports.getAllVideos = exports.createNewVideo = exports.isAdminTokenData = exports.isTokenData = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const fs_1 = __importDefault(require("fs"));
const util_1 = __importDefault(require("util"));
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const renameFiles_1 = require("../utility/renameFiles");
const uploadFile_1 = require("../utility/aws/uploadFile");
const deleteFile_1 = require("../utility/aws/deleteFile");
const emailService_1 = require("../utility/emailService");
const changeHistoryTrackFunction_1 = require("../utility/changeHistoryTrackFunction");
const getVideoDuration_1 = require("../utility/getVideoDuration");
const DateTimeFormatters_1 = require("../utility/DateTimeFormatters");
const DashboardTemplates_1 = require("../templates/DashboardTemplates");
const unlinkFile = util_1.default.promisify(fs_1.default.unlink);
function isTokenData(user) {
    return user.id !== undefined;
}
exports.isTokenData = isTokenData;
function isAdminTokenData(user) {
    return user.role !== undefined;
}
exports.isAdminTokenData = isAdminTokenData;
//VIDEOS
const createNewVideo = async (admin, data) => {
    try {
        const { file, form_data } = data;
        const { vidName, vidSourceUrl, vidTags, isActive, isSubscribed, priority } = form_data;
        const vidTagsArray = vidTags.split(",");
        const currentTimestamp = Date.now();
        const isSubscribe = isSubscribed == "true" ? true : false;
        const active = isActive == "true" ? true : false;
        const priorityNumber = parseInt(priority.toString());
        //1.rename file
        const renamedFiledata = (0, renameFiles_1.renameFile)(file, `${currentTimestamp}_${file.originalname}`);
        //2. upload file to s3
        const result = await (0, uploadFile_1.uploadFile)(renamedFiledata, "videos");
        if (!result)
            throw new HttpError_1.default("Could not upload image to s3", 502);
        await unlinkFile(renamedFiledata.path);
        const vidThumbnail = result.Location;
        if (!vidName || !vidSourceUrl)
            throw new HttpError_1.default("Required fields missing", 422);
        const videoURL = vidSourceUrl.split("?")[0];
        const addVideo = await prisma_1.default.video.create({
            data: {
                vidName,
                vidSourceUrl: videoURL,
                vidTags: vidTagsArray,
                isActive: active,
                isSubscribed: isSubscribe,
                priority: priorityNumber,
                vidThumbnail,
                dashboardUser: {
                    connect: {
                        emailId: admin.emailId,
                    },
                },
            },
        });
        if (!addVideo)
            throw new HttpError_1.default("Could not add new video", 500);
        return {
            success: true,
            message: "Video was added successfully",
            video: addVideo,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createNewVideo = createNewVideo;
const getAllVideos = async (user, queryParams) => {
    try {
        let getAllVideos;
        let data = {};
        if (isAdminTokenData(user)) {
            // user is of type AdminTokenData
            const filters = {};
            const { page, limit, search, id } = queryParams;
            const searchFilter = [];
            if (search) {
                searchFilter.push({ vidName: { contains: search, mode: "insensitive" } }, { vidTags: { hasSome: search.split(",") } }, { vidSourceUrl: { contains: search, mode: "insensitive" } });
            }
            if (id) {
                filters.id = parseInt(id); // conversion parsedqs-> string ->int
            }
            getAllVideos = await prisma_1.default.video.findMany({
                where: {
                    ...filters,
                    ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
                },
                orderBy: {
                    priority: "asc",
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit)
                    : 0,
                take: limit ? parseInt(limit) : 500,
            });
            if (!getAllVideos)
                throw new HttpError_1.default("Could not fetch videos from database", 500);
            const totalRecords = getAllVideos.length;
            return {
                success: true,
                data: getAllVideos,
                totalRecords: totalRecords,
            };
        }
        else {
            // user is of type TokenData
            //1. find user
            const findUser = await prisma_1.default.users.findFirst({
                where: {
                    id: user.id,
                },
            });
            if (!findUser)
                throw new HttpError_1.default("Could not find user", 404);
            const filters = {};
            const { tags, page, limit } = queryParams;
            if (queryParams && queryParams.tags) {
                //2. set filters of tags
                const tagArraay = tags.split(",");
                if (tags) {
                    filters.vidTags = {
                        hasSome: tagArraay,
                    };
                }
            }
            if (findUser.subscription == false) {
                filters.isSubscribed = false;
            }
            //3. get videos
            getAllVideos = await prisma_1.default.video.findMany({
                where: {
                    AND: [filters],
                    isActive: true,
                },
                select: {
                    id: true,
                    createdAt: true,
                    updatedAt: true,
                    vidName: true,
                    vidTags: true,
                    vidSourceUrl: true,
                    vidThumbnail: true,
                    isActive: true,
                    isSubscribed: true,
                    priority: true,
                    dashboardUser: {
                        select: {
                            fullName: true,
                        },
                    },
                },
                orderBy: {
                    priority: "asc",
                },
                // skip: page  ? (parseInt(page as string) - 1) * parseInt(limit as string)
                //   : 0,
                take: limit ? parseInt(limit) : undefined,
            });
            if (!getAllVideos)
                throw new HttpError_1.default("Could not fetch videos from database", 500);
            data = await Promise.all(getAllVideos.map(async (item) => {
                const duration = await (0, getVideoDuration_1.getVideoDuration)(item.vidSourceUrl.split("/")[4].split("?")[0]);
                const formattedTime = await (0, DateTimeFormatters_1.convertSecondsToTimeFormat)(duration);
                return {
                    id: item.id,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    vidName: item.vidName,
                    vidTags: item.vidTags,
                    vidSourceUrl: item.vidSourceUrl,
                    vidThumbnail: item.vidThumbnail,
                    isActive: item.isActive,
                    isSubscribed: item.isSubscribed,
                    priority: item.priority,
                    dashboardUser: item.dashboardUser.fullName,
                    duration: formattedTime,
                };
            }));
            //track session
            const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
            if (!updateActiveSession) {
                throw new HttpError_1.default("Could not update active session", 204);
            }
        }
        return {
            success: true,
            Videos: data,
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
exports.getAllVideos = getAllVideos;
const editVideosById = async (data) => {
    try {
        const { file, id, vidName, vidSourceUrl, vidTags, isActive, isSubscribed, priority, } = data;
        const subscribed = isSubscribed && isSubscribed == "true" ? true : false;
        const active = isActive && isActive == "true" ? true : false;
        const vidTagsArray = vidTags?.split(",");
        let vid_priority;
        let vid_URL = "";
        if (priority) {
            vid_priority = parseInt(priority);
        }
        const findVideo = await prisma_1.default.video.findFirst({
            where: {
                id,
            },
        });
        if (!findVideo)
            throw new HttpError_1.default("Video to edit not found", 404);
        if (file) {
            const fileName = decodeURIComponent(findVideo.vidThumbnail.split("/")[4]);
            const result = await (0, deleteFile_1.deleteFile)(fileName, "videos");
            if (!result)
                throw new HttpError_1.default("Could not delete file from s3", 502);
            const renamedFiledata = (0, renameFiles_1.renameFile)(file, `${Date.now()}_${file?.originalname}`);
            const file_upload_result = await (0, uploadFile_1.uploadFile)(renamedFiledata, "videos");
            if (!result) {
                throw new HttpError_1.default("Could not upload video to s3", 502);
            }
            await unlinkFile(renamedFiledata.path);
            vid_URL = file_upload_result.Location;
        }
        else {
            vid_URL = findVideo.vidThumbnail;
        }
        const editVideo = await prisma_1.default.video.update({
            where: {
                id,
            },
            data: {
                vidName,
                vidSourceUrl,
                vidTags: vidTags == "" ? findVideo.vidTags : vidTagsArray,
                isActive: active,
                isSubscribed: subscribed,
                vidThumbnail: vid_URL,
                priority: vid_priority,
            },
        });
        if (!editVideo)
            throw new HttpError_1.default("Could not edit video", 500);
        return {
            success: true,
            message: "Video was added edited successfully",
            video: editVideo,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.editVideosById = editVideosById;
const deleteVideo = async (vidId) => {
    try {
        const vids = vidId.split(",");
        //find appointment
        const findVideos = await prisma_1.default.video.findMany({
            where: {
                id: {
                    in: vids.map((vid) => parseInt(vid)),
                },
            },
        });
        if (!findVideos || findVideos.length != vids.length)
            throw new HttpError_1.default("Could not find video", 404);
        // let errors = [];
        const deleteMultiple = findVideos.map(async (videos) => {
            // decode filename into actual filename by removing the url encoded values
            const fileName = decodeURIComponent(videos.vidThumbnail.split("/")[4]);
            const result = await (0, deleteFile_1.deleteFile)(fileName, "videos");
            if (!result)
                throw new HttpError_1.default("Could not delete file from s3", 502);
            const deleteAdv = await prisma_1.default.video.delete({
                where: {
                    id: videos.id,
                },
            });
            if (!deleteAdv)
                throw new HttpError_1.default(`Could not delete data from database`, 500);
        });
        if (!deleteMultiple) {
            throw new HttpError_1.default("Could not delete all video(s)", 500);
        }
        // if (errors.length != 0)
        //   throw new HTTPError(`Could not delete videos with id: ${errors}`, 403);
        return {
            success: true,
            message: "Video(s) were deleted successfully",
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
exports.deleteVideo = deleteVideo;
//ADVERTISEMENTS
const createNewAdvertisement = async (admin, data) => {
    try {
        const { file, form_data } = data;
        const currentTimestamp = Date.now();
        //1. rename file
        const renamedFiledata = (0, renameFiles_1.renameFile)(file, `${currentTimestamp}_${file.originalname}`);
        //2. upload file to s3
        const result = await (0, uploadFile_1.uploadFile)(renamedFiledata, "advertisement");
        if (!result)
            throw new HttpError_1.default("Could not upload image to s3", 502);
        await unlinkFile(renamedFiledata.path);
        const documentURL = result.Location;
        //3. upload data and url in db
        const { advName, advType, advPosition, isActive, isSubscribed, priority, advRedirectLink, } = form_data;
        const uploadDocumentResponse = await prisma_1.default.advertisement.create({
            data: {
                advName,
                advSourceUrl: documentURL,
                advType,
                advPosition,
                isActive: isActive == "true" ? true : false,
                isSubscribed: isSubscribed == "true" ? true : false,
                advRedirectLink,
                priority: parseInt(priority),
                dashboardUser: {
                    connect: {
                        emailId: admin.emailId,
                    },
                },
            },
        });
        if (!uploadDocumentResponse)
            throw new HttpError_1.default(`Could Not add advertisement`, 500);
        return {
            success: true,
            uploadDocumentResponse,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createNewAdvertisement = createNewAdvertisement;
const getAllAdvertisements = async (user, queryParams) => {
    try {
        let getAllAdvertisements;
        if (isAdminTokenData(user)) {
            // user is of type AdminTokenData
            const filters = {};
            const { page, limit, search, id } = queryParams;
            const searchFilter = [];
            if (search) {
                searchFilter.push({
                    advName: { contains: search, mode: "insensitive" },
                });
            }
            if (search == "bottom" ||
                search == "top") {
                searchFilter.push({
                    advPosition: search,
                });
            }
            if (id) {
                filters.id = parseInt(id);
            }
            getAllAdvertisements = await prisma_1.default.advertisement.findMany({
                where: {
                    ...filters,
                    ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
                },
                orderBy: {
                    priority: "asc",
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit)
                    : 0,
                take: limit ? parseInt(limit) : 500,
            });
            if (!getAllAdvertisements)
                throw new HttpError_1.default("Could not fetch advertisements from database", 500);
            const totalRecords = getAllAdvertisements.length;
            return {
                success: true,
                data: getAllAdvertisements,
                totalRecords: totalRecords,
            };
        }
        else {
            // user is of type TokenData
            //1. find user
            const findUser = await prisma_1.default.users.findFirst({
                where: {
                    id: user.id,
                },
            });
            if (!findUser)
                throw new HttpError_1.default("Could not find user", 404);
            const filters = {};
            if (findUser.subscription == false) {
                filters.isSubscribed = false;
            }
            //2. get advertisements
            getAllAdvertisements = await prisma_1.default.advertisement.findMany({
                where: {
                    AND: [filters],
                    isActive: true,
                },
                orderBy: {
                    priority: "asc",
                },
                take: 3,
            });
            if (!getAllAdvertisements)
                throw new HttpError_1.default("Could not fetch advertisements from database", 404);
            //track session
            const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
            if (!updateActiveSession) {
                throw new HttpError_1.default("Could not update active session", 204);
            }
        }
        return {
            success: true,
            advertisements: getAllAdvertisements,
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
exports.getAllAdvertisements = getAllAdvertisements;
const updateAdvertisementById = async (data) => {
    try {
        const { file, form_data, advId } = data;
        const { advName, advType, advPosition, isActive, isSubscribed, priority, advRedirectLink, } = form_data;
        console.log(form_data);
        let adv_URL, renamedFiledata;
        //1. Find existing advertisement
        const adv_to_update = await prisma_1.default.advertisement.findFirst({
            where: {
                id: parseInt(advId),
            },
        });
        if (!adv_to_update) {
            throw new HttpError_1.default(`advertisement not found`, 404);
        }
        //2. delete and reupload the file from db and aws
        if (file) {
            const fileName = decodeURIComponent(adv_to_update.advSourceUrl.split("/")[4]);
            const result = await (0, deleteFile_1.deleteFile)(fileName, "advertisement");
            if (!result)
                throw new HttpError_1.default("Could not delete file from s3", 502);
            renamedFiledata = (0, renameFiles_1.renameFile)(file, `${Date.now()}_${file?.originalname}`);
            const file_upload_result = await (0, uploadFile_1.uploadFile)(renamedFiledata, "advertisement");
            if (!result) {
                throw new HttpError_1.default("Could not upload advertisement to s3", 502);
            }
            await unlinkFile(renamedFiledata.path);
            adv_URL = file_upload_result.Location;
        }
        else {
            adv_URL = adv_to_update.advSourceUrl;
        }
        //3. update data in db
        const updateAdvertisementData = await prisma_1.default.advertisement.update({
            where: {
                id: parseInt(advId),
            },
            data: {
                advName,
                advPosition,
                advType,
                isActive: isActive
                    ? isActive == "true"
                        ? true
                        : false
                    : adv_to_update.isActive,
                isSubscribed: isSubscribed
                    ? isSubscribed == "true"
                        ? true
                        : false
                    : adv_to_update.isSubscribed,
                priority: priority ? parseInt(priority) : adv_to_update.priority,
                advRedirectLink,
                advSourceUrl: adv_URL,
            },
        });
        if (!updateAdvertisementData)
            throw new HttpError_1.default(`Could not update advertisement data in db`, 500);
        return {
            success: true,
            message: "advertisement was editted successfully",
            updatedAdvertisement: updateAdvertisementData,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default("Prisma Client Error", 500);
        }
    }
};
exports.updateAdvertisementById = updateAdvertisementById;
const deleteAdvertisements = async (advId) => {
    try {
        const advs = advId.split(",");
        const advertisements = await prisma_1.default.advertisement.findMany({
            where: {
                id: {
                    in: advs.map((adv) => parseInt(adv)),
                },
            },
        });
        if (!advertisements || advertisements.length != advs.length)
            throw new HttpError_1.default(`Could not find advertisement`, 404);
        const deleteMultple = advertisements.map(async (advertisement) => {
            // decode filename into actual filename by removing the url encoded values
            const fileName = decodeURIComponent(advertisement.advSourceUrl.split("/")[4]);
            const result = await (0, deleteFile_1.deleteFile)(fileName, "advertisement");
            if (!result)
                throw new HttpError_1.default("Could not delete file from s3", 502);
            const deleteAdv = await prisma_1.default.advertisement.delete({
                where: {
                    id: advertisement.id,
                },
            });
            if (!deleteAdv)
                throw new HttpError_1.default(`Could not delete data from database`, 500);
        });
        if (!deleteMultple)
            throw new HttpError_1.default("Could not delete all advertisement(s)", 500);
        return {
            success: true,
            message: "advertisement(s) deleted successfully",
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        console.error("Error caught in errorHandler:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.deleteAdvertisements = deleteAdvertisements;
//FACILITIES
const createNewFacilities = async (admin, data) => {
    try {
        const { facPrimaryName, facSecondaryName, facPhoneNumber, facAddress, facPincode, facSpeciality, facType, isActive, } = data;
        const findPhone = await prisma_1.default.facility.findUnique({
            where: {
                facPhoneNumber,
            },
        });
        if (findPhone)
            throw new HttpError_1.default("Facility with this contact number already exists", 422);
        const active = isActive === "true" ? true : false;
        const addFacility = await prisma_1.default.facility.create({
            data: {
                facPrimaryName,
                facSecondaryName,
                facPhoneNumber,
                facAddress,
                facPincode,
                facSpeciality,
                facType,
                isActive: active,
                dashboardUser: {
                    connect: {
                        emailId: admin.emailId,
                    },
                },
            },
        });
        if (!addFacility)
            throw new HttpError_1.default("Could not add new video", 500);
        return {
            success: true,
            message: "Facility was added successfully",
            video: addFacility,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.createNewFacilities = createNewFacilities;
const getAllFacilities = async (user, queryParams) => {
    try {
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        let getAllFacilities;
        if (isAdminTokenData(user)) {
            // user is of type AdminTokenData
            const filters = {};
            const { page, limit, search, id } = queryParams;
            const searchFilter = [];
            if (search) {
                searchFilter.push({ facPrimaryName: { contains: search, mode: "insensitive" } }, { facSecondaryName: { contains: search, mode: "insensitive" } }, { facPhoneNumber: { contains: search, mode: "insensitive" } }, { facAddress: { contains: search, mode: "insensitive" } }, { facSpeciality: { hasSome: search.split(",") } }, { facPincode: { contains: search, mode: "insensitive" } }, { facType: { contains: search, mode: "insensitive" } });
            }
            if (id) {
                filters.id = id;
            }
            getAllFacilities = await prisma_1.default.facility.findMany({
                where: {
                    ...filters,
                    ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit)
                    : 0,
                take: limit ? parseInt(limit) : 500,
            });
            if (!getAllFacilities)
                throw new HttpError_1.default("Could not fetch facilities from database", 404);
            const totalRecords = getAllFacilities.length;
            return {
                success: true,
                data: getAllFacilities,
                totalRecords: totalRecords,
            };
        }
        else {
            // user is of type TokenData
            //1. find user
            const findUser = await prisma_1.default.users.findFirst({
                where: {
                    id: user.id,
                },
            });
            if (!findUser)
                throw new HttpError_1.default("Could not find user", 404);
            //2. set filters (if any)
            const { search, page, limit } = queryParams;
            const searchFilter = [];
            if (search) {
                searchFilter.push({ facPrimaryName: { contains: search, mode: "insensitive" } }, { facSecondaryName: { contains: search, mode: "insensitive" } }, { facPhoneNumber: { contains: search, mode: "insensitive" } }, { facAddress: { contains: search, mode: "insensitive" } }, { facSpeciality: { hasSome: search.split(",") } }, { facPincode: { contains: search, mode: "insensitive" } }, { facType: { contains: search, mode: "insensitive" } });
            }
            //3. get facilities
            // getAllFacilities = await prisma.facility.findMany({
            //   where: {
            //     isActive: true,
            //     // facPincode: findUser.pincode,
            //     ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
            //   },
            //   skip: page
            //     ? (parseInt(page as string) - 1) * parseInt(limit as string)
            //     : 0,
            //   take: limit ? parseInt(limit as string) : 500,
            // });
            // if (!getAllFacilities)
            //   throw new HTTPError("Could not fetch facilities from database", 403);
            // Fetch facilities that match the user's pincode
            const facilitiesMatchingPincode = await prisma_1.default.facility.findMany({
                where: {
                    isActive: true,
                    facPincode: findUser.pincode,
                    ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit)
                    : 0,
                take: limit ? parseInt(limit) : undefined,
            });
            // Calculate how many more facilities to fetch to complete the limit
            const remainingLimit = (limit ? parseInt(limit) : 100) -
                facilitiesMatchingPincode.length;
            // Fetch the remaining facilities that do not match the user's pincode
            const remainingFacilities = await prisma_1.default.facility.findMany({
                where: {
                    isActive: true,
                    facPincode: { not: findUser.pincode },
                    ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
                },
                skip: page
                    ? (parseInt(page) - 1) * parseInt(limit) -
                        facilitiesMatchingPincode.length
                    : 0,
                take: remainingLimit > 0 ? remainingLimit : 0,
            });
            // Combine the results
            getAllFacilities = [...facilitiesMatchingPincode, ...remainingFacilities];
            //track session
            const updateActiveSession = (0, changeHistoryTrackFunction_1.trackActiveSession)(user.id);
            if (!updateActiveSession) {
                throw new HttpError_1.default("Could not update active session", 204);
            }
        }
        return {
            success: true,
            Facilities: getAllFacilities,
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
exports.getAllFacilities = getAllFacilities;
const updateFacilitiesById = async (data) => {
    try {
        const { id, facPrimaryName, facSecondaryName, facPhoneNumber, facAddress, facPincode, facSpeciality, facType, isActive, } = data;
        const findFacility = await prisma_1.default.facility.findFirst({
            where: {
                id,
            },
        });
        if (!findFacility)
            throw new HttpError_1.default("facility to edit not found", 404);
        const active = isActive !== undefined ? isActive === "true" : findFacility.isActive;
        const editFacility = await prisma_1.default.facility.update({
            where: {
                id,
            },
            data: {
                facPrimaryName,
                facSecondaryName,
                facPhoneNumber,
                facAddress,
                facPincode,
                facSpeciality,
                facType,
                isActive: active,
            },
        });
        if (!editFacility)
            throw new HttpError_1.default("Could not edit facility", 500);
        return {
            success: true,
            message: "facility was added edited successfully",
            facility: editFacility,
        };
    }
    catch (error) {
        console.log("Error->Log:", error);
        if (error instanceof HttpError_1.default) {
            throw new HttpError_1.default(error.message, error.code);
        }
        else {
            throw new HttpError_1.default(error.name, 500);
        }
    }
};
exports.updateFacilitiesById = updateFacilitiesById;
const deleteFacilities = async (facId) => {
    try {
        if (!facId)
            throw new HttpError_1.default("Required fields are missing", 400);
        const facs = facId.split(",");
        //find facility
        const findFacilities = await prisma_1.default.facility.findMany({
            where: {
                id: {
                    in: facs.map((fac) => parseInt(fac)),
                },
            },
        });
        if (!findFacilities || findFacilities.length != facs.length)
            throw new HttpError_1.default("Could not find video", 404);
        let errors = [];
        for (const facility of findFacilities) {
            const deleteFacilities = await prisma_1.default.facility.delete({
                where: {
                    id: facility.id,
                },
            });
            if (!deleteFacilities)
                errors.push(facility.id);
        }
        if (errors.length != 0)
            throw new HttpError_1.default(`Could not delete Facilities with id: ${errors}`, 500);
        return {
            success: true,
            message: "Facilities were deleted successfully",
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
exports.deleteFacilities = deleteFacilities;
const getAllAdminContent = async (user) => {
    try {
        if (!user)
            throw new HttpError_1.default("Unauthorised", 401);
        //get first 3
        const [advertisements, videos, facs] = await Promise.all([
            (0, exports.getAllAdvertisements)(user, {
                limit: "3",
            }),
            (0, exports.getAllVideos)(user, { limit: "3" }),
            (0, exports.getAllFacilities)(user, { limit: "3" }),
        ]);
        return {
            success: true,
            data: {
                advertisements: advertisements.data,
                videos: videos.data,
                facs: facs.data,
            },
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
exports.getAllAdminContent = getAllAdminContent;
//FEEDBACK AND COMPLAINTS
const getAllMessages = async (admin) => {
    try {
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        let complaints = [];
        let feedbacks = [];
        const getMessages = await prisma_1.default.userMessage.findMany({
            select: {
                id: true,
                message: true,
                messageType: true,
                emailId: true,
                reply: true,
                replyBy: true,
                createdAt: true,
                updatedAt: true,
                isReplied: true,
                user: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
            },
        });
        for (const message of getMessages) {
            message.messageType == "complaint"
                ? complaints.push(message)
                : feedbacks.push(message);
        }
        return {
            success: true,
            complaints,
            feedbacks,
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
exports.getAllMessages = getAllMessages;
const complaintReplyById = async (admin, data) => {
    try {
        if (!admin)
            throw new HttpError_1.default("Unauthorised", 401);
        const { complaintId, reply } = data;
        //1. Find Complaint
        const getComplaint = await prisma_1.default.userMessage.findFirst({
            where: {
                id: parseInt(complaintId),
                messageType: "complaint",
            },
            include: {
                user: true,
            },
        });
        if (!getComplaint)
            throw new HttpError_1.default("Could not find complaint", 404);
        if (getComplaint.isReplied == true)
            throw new HttpError_1.default(`Message has been already replied to by admin user: ${getComplaint.replyBy}`, 422);
        //2. Note reply in database
        const storeReply = await prisma_1.default.userMessage.update({
            where: {
                id: getComplaint.id,
            },
            data: {
                reply,
                replyBy: admin.emailId,
                isReplied: true,
            },
        });
        if (!storeReply)
            throw new HttpError_1.default("Could not record admin reply in database", 500);
        //3. send email with reply to grieved user
        const sendReplyToUser = await (0, emailService_1.ComplaintReplyEmail)({
            emailId: getComplaint.emailId ? getComplaint.emailId : "",
            user_complaintId: getComplaint.complaintId,
            admin_reply: reply,
            name: getComplaint.user?.fullName,
        }, DashboardTemplates_1.complaintReply);
        if (!sendReplyToUser)
            throw new HttpError_1.default("Invalid Email Address", 612);
        return {
            success: true,
            message: "Reply sent Successfully to Concerned User",
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
exports.complaintReplyById = complaintReplyById;
//# sourceMappingURL=contentManagement.services.js.map