import prisma from "../prisma";
import fs from "fs";
import utils from "util";
import { adminTokenData } from "../utility/DataTypes/types.admin";
import {
  editAdvertisementInput,
  EditFacilityType,
  EditVideoType,
  FacilityType,
  InputVideoType,
  uploadAdvertisementInput,
} from "../utility/DataTypes/types.contentManagement";
import { TokenData } from "../utility/DataTypes/types.user";
import HTTPError from "../utility/HttpError";
import { ParsedQs } from "qs";
import { renameFile } from "../utility/renameFiles";
import { uploadFile } from "../utility/aws/uploadFile";
import { deleteFile } from "../utility/aws/deleteFile";
import { ComplaintReplyEmail } from "../utility/emailService";
import { trackActiveSession } from "../utility/changeHistoryTrackFunction";
import { AdvertisePosition, AdvertiseType } from "@prisma/client";
import { getVideoDuration } from "../utility/getVideoDuration";
import { convertSecondsToTimeFormat } from "../utility/DateTimeFormatters";
import { complaintReply } from "../templates/DashboardTemplates";
const unlinkFile = utils.promisify(fs.unlink);

export function isTokenData(
  user: TokenData | adminTokenData
): user is TokenData {
  return (user as TokenData).id !== undefined;
}

export function isAdminTokenData(
  user: TokenData | adminTokenData
): user is adminTokenData {
  return (user as adminTokenData).role !== undefined;
}

//VIDEOS
export const createNewVideo = async (
  admin: adminTokenData,
  data: InputVideoType
) => {
  try {
    const { file, form_data } = data;
    const { vidName, vidSourceUrl, vidTags, isActive, isSubscribed, priority } =
      form_data;
    const vidTagsArray = vidTags.split(",");
    const currentTimestamp = Date.now();
    const isSubscribe = isSubscribed == "true" ? true : false;
    const active = isActive == "true" ? true : false;
    const priorityNumber = parseInt(priority.toString());
    //1.rename file
    const renamedFiledata = renameFile(
      file,
      `${currentTimestamp}_${file.originalname}`
    );

    //2. upload file to s3
    const result = await uploadFile(renamedFiledata, "videos");
    if (!result) throw new HTTPError("Could not upload image to s3", 502);
    await unlinkFile(renamedFiledata.path);
    const vidThumbnail = result.Location;

    if (!vidName || !vidSourceUrl)
      throw new HTTPError("Required fields missing", 422);

    const videoURL = vidSourceUrl.split("?")[0];

    const addVideo = await prisma.video.create({
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
    if (!addVideo) throw new HTTPError("Could not add new video", 500);

    return {
      success: true,
      message: "Video was added successfully",
      video: addVideo,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

export const getAllVideos = async (
  user: TokenData | adminTokenData,
  queryParams: ParsedQs
) => {
  try {
    let getAllVideos;
    let data = {};
    if (isAdminTokenData(user)) {
      // user is of type AdminTokenData
      const filters: any = {};
      const { page, limit, search, id } = queryParams;
      const searchFilter: Array<{}> = [];
      if (search) {
        searchFilter.push(
          { vidName: { contains: search, mode: "insensitive" } },
          { vidTags: { hasSome: (search as string).split(",") } },
          { vidSourceUrl: { contains: search, mode: "insensitive" } }
        );
      }

      if (id) {
        filters.id = parseInt(id as string); // conversion parsedqs-> string ->int
      }

      getAllVideos = await prisma.video.findMany({
        where: {
          ...filters,
          ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
        },
        orderBy: {
          priority: "asc",
        },

        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string)
          : 0,
        take: limit ? parseInt(limit as string) : 500,
      });

      if (!getAllVideos)
        throw new HTTPError("Could not fetch videos from database", 500);

      const totalRecords = getAllVideos.length;

      return {
        success: true,
        data: getAllVideos,
        totalRecords: totalRecords,
      };
    } else {
      // user is of type TokenData
      //1. find user
      const findUser = await prisma.users.findFirst({
        where: {
          id: user.id,
        },
      });
      if (!findUser) throw new HTTPError("Could not find user", 404);

      const filters: any = {};
      const { tags, page, limit } = queryParams;
      if (queryParams && queryParams.tags) {
        //2. set filters of tags
        const tagArraay = (tags as string).split(",");
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
      getAllVideos = await prisma.video.findMany({
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
        take: limit ? parseInt(limit as string) : undefined,
      });

      if (!getAllVideos)
        throw new HTTPError("Could not fetch videos from database", 500);

      data = await Promise.all(
        getAllVideos.map(async (item: any) => {
          const duration = await getVideoDuration(
            item.vidSourceUrl.split("/")[4].split("?")[0]
          );
          const formattedTime = await convertSecondsToTimeFormat(duration);
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
        })
      );
      //track session
      const updateActiveSession = trackActiveSession(user.id);
      if (!updateActiveSession) {
        throw new HTTPError("Could not update active session", 204);
      }
    }
    return {
      success: true,
      Videos: data,
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

export const editVideosById = async (data: EditVideoType) => {
  try {
    const {
      file,
      id,
      vidName,
      vidSourceUrl,
      vidTags,
      isActive,
      isSubscribed,
      priority,
    } = data;
    const subscribed = isSubscribed && isSubscribed == "true" ? true : false;
    const active = isActive && isActive == "true" ? true : false;
    const vidTagsArray = vidTags?.split(",");
    let vid_priority;
    let vid_URL = "";

    if (priority) {
      vid_priority = parseInt(priority);
    }

    const findVideo = await prisma.video.findFirst({
      where: {
        id,
      },
    });

    if (!findVideo) throw new HTTPError("Video to edit not found", 404);
    if (file) {
      const fileName = decodeURIComponent(findVideo.vidThumbnail.split("/")[4]);
      const result = await deleteFile(fileName, "videos");
      if (!result) throw new HTTPError("Could not delete file from s3", 502);

      const renamedFiledata = renameFile(
        file,
        `${Date.now()}_${file?.originalname}`
      );
      const file_upload_result = await uploadFile(renamedFiledata, "videos");
      if (!result) {
        throw new HTTPError("Could not upload video to s3", 502);
      }
      await unlinkFile(renamedFiledata.path);
      vid_URL = file_upload_result.Location;
    } else {
      vid_URL = findVideo.vidThumbnail;
    }
    const editVideo = await prisma.video.update({
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
    if (!editVideo) throw new HTTPError("Could not edit video", 500);

    return {
      success: true,
      message: "Video was added edited successfully",
      video: editVideo,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

export const deleteVideo = async (vidId: string) => {
  try {
    const vids = vidId.split(",");

    //find appointment
    const findVideos = await prisma.video.findMany({
      where: {
        id: {
          in: vids.map((vid) => parseInt(vid)),
        },
      },
    });
    if (!findVideos || findVideos.length != vids.length)
      throw new HTTPError("Could not find video", 404);

    // let errors = [];

    const deleteMultiple = findVideos.map(async (videos) => {
      // decode filename into actual filename by removing the url encoded values
      const fileName = decodeURIComponent(videos.vidThumbnail.split("/")[4]);
      const result = await deleteFile(fileName, "videos");
      if (!result) throw new HTTPError("Could not delete file from s3", 502);

      const deleteAdv = await prisma.video.delete({
        where: {
          id: videos.id,
        },
      });
      if (!deleteAdv)
        throw new HTTPError(`Could not delete data from database`, 500);
    });
    if (!deleteMultiple) {
      throw new HTTPError("Could not delete all video(s)", 500);
    }
    // if (errors.length != 0)
    //   throw new HTTPError(`Could not delete videos with id: ${errors}`, 403);

    return {
      success: true,
      message: "Video(s) were deleted successfully",
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

//ADVERTISEMENTS
export const createNewAdvertisement = async (
  admin: adminTokenData,
  data: uploadAdvertisementInput
) => {
  try {
    const { file, form_data } = data;
    const currentTimestamp = Date.now();

    //1. rename file
    const renamedFiledata = renameFile(
      file,
      `${currentTimestamp}_${file.originalname}`
    );

    //2. upload file to s3
    const result = await uploadFile(renamedFiledata, "advertisement");
    if (!result) throw new HTTPError("Could not upload image to s3", 502);
    await unlinkFile(renamedFiledata.path);
    const documentURL = result.Location;

    //3. upload data and url in db
    const {
      advName,
      advType,
      advPosition,
      isActive,
      isSubscribed,
      priority,
      advRedirectLink,
    } = form_data;

    const uploadDocumentResponse = await prisma.advertisement.create({
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
      throw new HTTPError(`Could Not add advertisement`, 500);

    return {
      success: true,
      uploadDocumentResponse,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

export const getAllAdvertisements = async (
  user: TokenData | adminTokenData,
  queryParams: ParsedQs
) => {
  try {
    let getAllAdvertisements;
    if (isAdminTokenData(user)) {
      // user is of type AdminTokenData
      const filters: any = {};
      const { page, limit, search, id } = queryParams;
      const searchFilter: Array<{}> = [];
      if (search) {
        searchFilter.push({
          advName: { contains: search, mode: "insensitive" },
        });
      }
      if (
        (search as AdvertisePosition) == "bottom" ||
        (search as AdvertisePosition) == "top"
      ) {
        searchFilter.push({
          advPosition: search as AdvertisePosition,
        });
      }

      if (id) {
        filters.id = parseInt(id as string);
      }
      getAllAdvertisements = await prisma.advertisement.findMany({
        where: {
          ...filters,
          ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
        },

        orderBy: {
          priority: "asc",
        },
        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string)
          : 0,
        take: limit ? parseInt(limit as string) : 500,
      });

      if (!getAllAdvertisements)
        throw new HTTPError(
          "Could not fetch advertisements from database",
          500
        );
      const totalRecords = getAllAdvertisements.length;

      return {
        success: true,
        data: getAllAdvertisements,
        totalRecords: totalRecords,
      };
    } else {
      // user is of type TokenData
      //1. find user
      const findUser = await prisma.users.findFirst({
        where: {
          id: user.id,
        },
      });
      if (!findUser) throw new HTTPError("Could not find user", 404);

      const filters: any = {};
      if (findUser.subscription == false) {
        filters.isSubscribed = false;
      }

      //2. get advertisements
      getAllAdvertisements = await prisma.advertisement.findMany({
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
        throw new HTTPError(
          "Could not fetch advertisements from database",
          404
        );

      //track session
      const updateActiveSession = trackActiveSession(user.id);
      if (!updateActiveSession) {
        throw new HTTPError("Could not update active session", 204);
      }
    }
    return {
      success: true,
      advertisements: getAllAdvertisements,
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

export const updateAdvertisementById = async (data: editAdvertisementInput) => {
  try {
    const { file, form_data, advId } = data;
    const {
      advName,
      advType,
      advPosition,
      isActive,
      isSubscribed,
      priority,
      advRedirectLink,
    } = form_data;

    console.log(form_data)

    let adv_URL, renamedFiledata;

    //1. Find existing advertisement
    const adv_to_update = await prisma.advertisement.findFirst({
      where: {
        id: parseInt(advId),
      },
    });

    if (!adv_to_update) {
      throw new HTTPError(`advertisement not found`, 404);
    }
    //2. delete and reupload the file from db and aws


    if (file) {
      const fileName = decodeURIComponent(
        adv_to_update.advSourceUrl.split("/")[4]
      );
      const result = await deleteFile(fileName, "advertisement");
      if (!result) throw new HTTPError("Could not delete file from s3", 502);

      renamedFiledata = renameFile(file, `${Date.now()}_${file?.originalname}`);
      const file_upload_result = await uploadFile(
        renamedFiledata,
        "advertisement"
      );
      if (!result) {
        throw new HTTPError("Could not upload advertisement to s3", 502);
      }
      await unlinkFile(renamedFiledata.path);
      adv_URL = file_upload_result.Location;
    } else {
      adv_URL = adv_to_update.advSourceUrl;
    }

    //3. update data in db
    const updateAdvertisementData = await prisma.advertisement.update({
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
      throw new HTTPError(`Could not update advertisement data in db`, 500);

    return {
      success: true,
      message: "advertisement was editted successfully",
      updatedAdvertisement: updateAdvertisementData,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError("Prisma Client Error", 500);
    }
  }
};

export const deleteAdvertisements = async (advId: string) => {
  try {
    const advs = advId.split(",");

    const advertisements = await prisma.advertisement.findMany({
      where: {
        id: {
          in: advs.map((adv) => parseInt(adv)),
        },
      },
    });
    if (!advertisements || advertisements.length != advs.length)
      throw new HTTPError(`Could not find advertisement`, 404);

    const deleteMultple = advertisements.map(async (advertisement) => {
      // decode filename into actual filename by removing the url encoded values
      const fileName = decodeURIComponent(
        advertisement.advSourceUrl.split("/")[4]
      );
      const result = await deleteFile(fileName, "advertisement");
      if (!result) throw new HTTPError("Could not delete file from s3", 502);

      const deleteAdv = await prisma.advertisement.delete({
        where: {
          id: advertisement.id,
        },
      });
      if (!deleteAdv)
        throw new HTTPError(`Could not delete data from database`, 500);
    });
    if (!deleteMultple)
      throw new HTTPError("Could not delete all advertisement(s)", 500);

    return {
      success: true,
      message: "advertisement(s) deleted successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    console.error("Error caught in errorHandler:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

//FACILITIES
export const createNewFacilities = async (
  admin: adminTokenData,
  data: FacilityType
) => {
  try {
    const {
      facPrimaryName,
      facSecondaryName,
      facPhoneNumber,
      facAddress,
      facPincode,
      facSpeciality,
      facType,
      isActive,
    } = data;

    const findPhone = await prisma.facility.findUnique({
      where: {
        facPhoneNumber,
      },
    });
    if (findPhone)
      throw new HTTPError(
        "Facility with this contact number already exists",
        422
      );

    const active = isActive === "true" ? true : false;

    const addFacility = await prisma.facility.create({
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
    if (!addFacility) throw new HTTPError("Could not add new video", 500);

    return {
      success: true,
      message: "Facility was added successfully",
      video: addFacility,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

export const getAllFacilities = async (
  user: TokenData | adminTokenData,
  queryParams: ParsedQs
) => {
  try {
    if (!user) throw new HTTPError("Unauthorised", 401);
    let getAllFacilities;
    if (isAdminTokenData(user)) {
      // user is of type AdminTokenData
      const filters: any = {};
      const { page, limit, search, id } = queryParams;
      const searchFilter: Array<{}> = [];
      if (search) {
        searchFilter.push(
          { facPrimaryName: { contains: search, mode: "insensitive" } },
          { facSecondaryName: { contains: search, mode: "insensitive" } },
          { facPhoneNumber: { contains: search, mode: "insensitive" } },
          { facAddress: { contains: search, mode: "insensitive" } },
          { facSpeciality: { hasSome: (search as string).split(",") } },
          { facPincode: { contains: search, mode: "insensitive" } },
          { facType: { contains: search, mode: "insensitive" } }
        );
      }

      if (id) {
        filters.id = id;
      }

      getAllFacilities = await prisma.facility.findMany({
        where: {
          ...filters,
          ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
        },
        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string)
          : 0,
        take: limit ? parseInt(limit as string) : 500,
      });

      if (!getAllFacilities)
        throw new HTTPError("Could not fetch facilities from database", 404);

      const totalRecords = getAllFacilities.length;

      return {
        success: true,
        data: getAllFacilities,
        totalRecords: totalRecords,
      };
    } else {
      // user is of type TokenData
      //1. find user
      const findUser = await prisma.users.findFirst({
        where: {
          id: user.id,
        },
      });
      if (!findUser) throw new HTTPError("Could not find user", 404);

      //2. set filters (if any)
      const { search, page, limit } = queryParams;
      const searchFilter: Array<{}> = [];

      if (search) {
        searchFilter.push(
          { facPrimaryName: { contains: search, mode: "insensitive" } },
          { facSecondaryName: { contains: search, mode: "insensitive" } },
          { facPhoneNumber: { contains: search, mode: "insensitive" } },
          { facAddress: { contains: search, mode: "insensitive" } },
          { facSpeciality: { hasSome: (search as string).split(",") } },
          { facPincode: { contains: search, mode: "insensitive" } },
          { facType: { contains: search, mode: "insensitive" } }
        );
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
      const facilitiesMatchingPincode = await prisma.facility.findMany({
        where: {
          isActive: true,
          facPincode: findUser.pincode,
          ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
        },
        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string)
          : 0,
        take: limit ? parseInt(limit as string) : undefined,
      });

      // Calculate how many more facilities to fetch to complete the limit
      const remainingLimit =
        (limit ? parseInt(limit as string) : 100) -
        facilitiesMatchingPincode.length;

      // Fetch the remaining facilities that do not match the user's pincode
      const remainingFacilities = await prisma.facility.findMany({
        where: {
          isActive: true,
          facPincode: { not: findUser.pincode },
          ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
        },
        skip: page
          ? (parseInt(page as string) - 1) * parseInt(limit as string) -
            facilitiesMatchingPincode.length
          : 0,
        take: remainingLimit > 0 ? remainingLimit : 0,
      });

      // Combine the results
      getAllFacilities = [...facilitiesMatchingPincode, ...remainingFacilities];

      //track session
      const updateActiveSession = trackActiveSession(user.id);
      if (!updateActiveSession) {
        throw new HTTPError("Could not update active session", 204);
      }
    }
    return {
      success: true,
      Facilities: getAllFacilities,
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

export const updateFacilitiesById = async (data: EditFacilityType) => {
  try {
    const {
      id,
      facPrimaryName,
      facSecondaryName,
      facPhoneNumber,
      facAddress,
      facPincode,
      facSpeciality,
      facType,
      isActive,
    } = data;

    const findFacility = await prisma.facility.findFirst({
      where: {
        id,
      },
    });

    if (!findFacility) throw new HTTPError("facility to edit not found", 404);

    const active =
      isActive !== undefined ? isActive === "true" : findFacility.isActive;

    const editFacility = await prisma.facility.update({
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
    if (!editFacility) throw new HTTPError("Could not edit facility", 500);

    return {
      success: true,
      message: "facility was added edited successfully",
      facility: editFacility,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      throw new HTTPError(error.name, 500);
    }
  }
};

export const deleteFacilities = async (facId: string) => {
  try {
    if (!facId) throw new HTTPError("Required fields are missing", 400);
    const facs = facId.split(",");

    //find facility
    const findFacilities = await prisma.facility.findMany({
      where: {
        id: {
          in: facs.map((fac) => parseInt(fac)),
        },
      },
    });
    if (!findFacilities || findFacilities.length != facs.length)
      throw new HTTPError("Could not find video", 404);

    let errors = [];

    for (const facility of findFacilities) {
      const deleteFacilities = await prisma.facility.delete({
        where: {
          id: facility.id,
        },
      });
      if (!deleteFacilities) errors.push(facility.id);
    }

    if (errors.length != 0)
      throw new HTTPError(
        `Could not delete Facilities with id: ${errors}`,
        500
      );

    return {
      success: true,
      message: "Facilities were deleted successfully",
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

export const getAllAdminContent = async (user: adminTokenData) => {
  try {
    if (!user) throw new HTTPError("Unauthorised", 401);
    //get first 3
    const [advertisements, videos, facs] = await Promise.all([
      getAllAdvertisements(user, {
        limit: "3",
      }),
      getAllVideos(user, { limit: "3" }),
      getAllFacilities(user, { limit: "3" }),
    ]);

    return {
      success: true,
      data: {
        advertisements: advertisements.data,
        videos: videos.data,
        facs: facs.data,
      },
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

//FEEDBACK AND COMPLAINTS
export const getAllMessages = async (admin: adminTokenData) => {
  try {
    if (!admin) throw new HTTPError("Unauthorised", 401);

    let complaints = [];
    let feedbacks = [];

    const getMessages = await prisma.userMessage.findMany({
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

export const complaintReplyById = async (
  admin: adminTokenData,
  data: { complaintId: string; reply: string }
) => {
  try {
    if (!admin) throw new HTTPError("Unauthorised", 401);

    const { complaintId, reply } = data;

    //1. Find Complaint
    const getComplaint = await prisma.userMessage.findFirst({
      where: {
        id: parseInt(complaintId),
        messageType: "complaint",
      },
      include: {
        user: true,
      },
    });

    if (!getComplaint) throw new HTTPError("Could not find complaint", 404);

    if (getComplaint.isReplied == true)
      throw new HTTPError(
        `Message has been already replied to by admin user: ${getComplaint.replyBy}`,
        422
      );

    //2. Note reply in database
    const storeReply = await prisma.userMessage.update({
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
      throw new HTTPError("Could not record admin reply in database", 500);

    //3. send email with reply to grieved user
    const sendReplyToUser = await ComplaintReplyEmail(
      {
        emailId: getComplaint.emailId ? getComplaint.emailId : "",
        user_complaintId: getComplaint.complaintId,
        admin_reply: reply,
        name: getComplaint.user?.fullName as string,
      },
      complaintReply
    );
    if (!sendReplyToUser) throw new HTTPError("Invalid Email Address", 612);

    return {
      success: true,
      message: "Reply sent Successfully to Concerned User",
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
