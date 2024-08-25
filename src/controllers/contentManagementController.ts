import { Request, Response } from "express";
import HTTPError from "../utility/HttpError";
import {
  CreateFacilitiesValidation,
  UpdateAdvertisementValidation,
  UpdateFacilitiesValidation,
  UpdateVideoValidation,
  UploadAdvertisementValidation,
  uploadVideoValidation,
} from "../utility/Validation/contentManagementValidations";
import {
  complaintReplyById,
  createNewAdvertisement,
  createNewFacilities,
  createNewVideo,
  deleteAdvertisements,
  deleteFacilities,
  deleteVideo,
  updateAdvertisementById,
  updateFacilitiesById,
  editVideosById,
  getAllAdvertisements,
  getAllAdminContent,
  getAllFacilities,
  getAllMessages,
  getAllVideos,
} from "../services/contentManagement.services";

//CONTENT MANAGEMENT
//Aggregate Get
export const getAllContent = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    const contentMgmt = await getAllAdminContent(admin);
    if (!contentMgmt) {
      throw new HTTPError("could not get videos", 204);
    }
    const code = contentMgmt.success ? 200 : 400;
    res.status(code).json({ data: contentMgmt });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//VIDEOS
//Create Video
export const createVideo = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const file = req.file;
    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    if (!file || !form_data) {
      throw new HTTPError("Missing required fields", 422);
    }

    const validationResponse = uploadVideoValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const createdVideo = await createNewVideo(admin, { file, form_data });
    if (!createdVideo) {
      throw new HTTPError("could not add video", 204);
    }
    const code = createdVideo.success ? 200 : 400;
    res.status(code).json({ data: createdVideo });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//get videos
export const getVideosAdmin = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }
    const queryParams = req.query;

    const getVideos = await getAllVideos(admin, queryParams);
    if (!getVideos) {
      throw new HTTPError("could not get videos", 204);
    }
    const code = getVideos.success ? 200 : 400;
    res.status(code).json({ data: getVideos });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Edit Video
export const editVideoById = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);
    const file = req.file;
    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const vidId = req.params.id;
    if (!vidId) throw new HTTPError("Video Id not provided", 422);

    const validationResponse = UpdateVideoValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const input = {
      id: parseInt(vidId),
      file,
      ...form_data,
    };

    const editedVideo = await editVideosById(input);
    if (!editedVideo) {
      throw new HTTPError("could not edit video", 204);
    }
    const code = editedVideo.success ? 200 : 400;
    res.status(code).json({ form_data: editedVideo });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Delete Videos
export const deleteVideos = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 204);

    const { id } = req.query;

    if (!id) throw new HTTPError("Enter id of records to delete", 422);

    const deleteVideoData = await deleteVideo(id as string);

    if (!deleteVideoData)
      throw new HTTPError(`Could Not update appointment data`, 204);
    const code = deleteVideoData.success ? 200 : 400;
    res.status(code).json({ data: deleteVideoData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//ADVERTISEMENTS
//Create Advertisement
export const createAdvertisement = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 204);

    const file = req.file;
    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });

    if (!file || !form_data) {
      throw new HTTPError("Missing required fields", 422);
    }
    const validationResponse = UploadAdvertisementValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[1]} : ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const createdAdvertisement = await createNewAdvertisement(admin, {
      file,
      form_data,
    });
    if (!createdAdvertisement) {
      throw new HTTPError("could not add advertisement", 204);
    }
    const code = createdAdvertisement.success ? 200 : 400;
    res.status(code).json({ data: createdAdvertisement });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//get advertisements
export const getAdvertisementsAdmin = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    const queryParams = req.query;

    const getAdvertisements = await getAllAdvertisements(admin, queryParams);
    if (!getAdvertisements) {
      throw new HTTPError("could not get advertisements", 204);
    }
    const code = getAdvertisements.success ? 200 : 400;
    res.status(code).json({ data: getAdvertisements });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Edit advertisement
export const editAdvertisementById = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const form_data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const file = req.file;
    const advId = req.params.id;
    if (!advId) throw new HTTPError("advertisement Id not provided", 422);

    const validationResponse = UpdateAdvertisementValidation.safeParse({
      file,
      form_data,
    });
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const editedAdvertisement = await updateAdvertisementById({
      file,
      form_data,
      advId,
    });
    if (!editedAdvertisement) {
      throw new HTTPError("could not edit advertisement", 204);
    }
    const code = editedAdvertisement.success ? 200 : 400;
    res.status(code).json({ data: editedAdvertisement });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Delete advertisements
export const deleteAdvertisement = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const { id } = req.query;

    if (!id) throw new HTTPError("Enter id of records to delete", 422);

    const deleteAdvertisementData = await deleteAdvertisements(id as string);

    if (!deleteAdvertisementData)
      throw new HTTPError(`Could Not update appointment data`, 204);
    const code = deleteAdvertisementData.success ? 200 : 400;
    res.status(code).json({ data: deleteAdvertisementData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//FACILITIES
//Create Facilities
export const createFacilities = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const validationResponse = CreateFacilitiesValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const {
      facPrimaryName,
      facPhoneNumber,
      facAddress,
      facPincode,
      facSpeciality,
      facType,
    } = data;
    if (
      !facPrimaryName ||
      !facPhoneNumber ||
      !facAddress ||
      !facPincode ||
      !facSpeciality ||
      !facType
    )
      throw new HTTPError("Required fields missing", 422);

    const createdFacilities = await createNewFacilities(admin, data);
    if (!createdFacilities) {
      throw new HTTPError("could not add Facilities", 204);
    }
    const code = createdFacilities.success ? 200 : 400;
    res.status(code).json({ data: createdFacilities });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//get Facilitiess
export const getFacilitiesAdmin = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    const queryParams = req.query;

    const getFacilitiess = await getAllFacilities(admin, queryParams);
    if (!getFacilitiess) {
      throw new HTTPError("could not get Facilitiess", 204);
    }
    const code = getFacilitiess.success ? 200 : 400;
    res.status(code).json({ data: getFacilitiess });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Edit Facilities
export const editFacilitiesById = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    const facId = req.params.id;
    if (!facId) throw new HTTPError("Facilities Id not provided", 422);

    const validationResponse = UpdateFacilitiesValidation.safeParse(data);
    if (!validationResponse.success) {
      const errorObj = validationResponse.error.issues
        .map((issue) => `${issue.path[0]}: ${issue.message}`)
        .join(" // ");
      throw new HTTPError(`Validation Errors:-> ${errorObj}`, 400);
    }

    const input = {
      id: parseInt(facId),
      ...data,
    };

    const editedFacilities = await updateFacilitiesById(input);
    if (!editedFacilities) {
      throw new HTTPError("could not edit Facilities", 204);
    }
    const code = editedFacilities.success ? 200 : 400;
    res.status(code).json({ data: editedFacilities });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//Delete Facilitiess
export const deleteFacility = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const { id } = req.query;

    if (!id) throw new HTTPError("Enter id of records to delete", 422);

    const deleteFacilitiesData = await deleteFacilities(id as string);

    if (!deleteFacilitiesData)
      throw new HTTPError(`Could Not update appointment data`, 204);
    const code = deleteFacilitiesData.success ? 200 : 400;
    res.status(code).json({ data: deleteFacilitiesData });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//FEEDBACK AND COMPLAINTS
//Get all feedbacks and complaints
export const getUserMessages = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    const getMessages = await getAllMessages(admin);
    if (!getMessages) {
      throw new HTTPError("could not get messages", 204);
    }
    const code = getMessages.success ? 200 : 400;
    res.status(code).json({ data: getMessages });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};

//reply to complaints
export const replyCompliantById = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) {
      throw new HTTPError("Unauthorized", 401);
    }

    if (admin.role == "AUDITOR")
      throw new HTTPError("Not authorised to do this action", 401);

    const complaintId = req.params.id;
    const data =
      req.body ??
      (() => {
        throw new HTTPError("API Missing body", 422);
      });
    if (!complaintId || !data)
      throw new HTTPError("Missing required Fields", 422);

    const adminComplaintReply = await complaintReplyById(admin, {
      complaintId,
      reply: data.reply,
    });

    if (!adminComplaintReply) {
      throw new HTTPError("could not edit advertisement", 204);
    }
    const code = adminComplaintReply.success ? 200 : 400;
    res.status(code).json({ data: adminComplaintReply });
  } catch (err) {
    if (err instanceof HTTPError) {
      res.status(err.code).json({ error: { message: err.message } });
    } else {
      res.status(500).json({ error: { message: "Internal server error" } });
    }
  }
};
