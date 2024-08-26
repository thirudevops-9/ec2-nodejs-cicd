"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyCompliantById = exports.getUserMessages = exports.deleteFacility = exports.editFacilitiesById = exports.getFacilitiesAdmin = exports.createFacilities = exports.deleteAdvertisement = exports.editAdvertisementById = exports.getAdvertisementsAdmin = exports.createAdvertisement = exports.deleteVideos = exports.editVideoById = exports.getVideosAdmin = exports.createVideo = exports.getAllContent = void 0;
const HttpError_1 = __importDefault(require("../utility/HttpError"));
const contentManagementValidations_1 = require("../utility/Validation/contentManagementValidations");
const contentManagement_services_1 = require("../services/contentManagement.services");
//CONTENT MANAGEMENT
//Aggregate Get
const getAllContent = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const contentMgmt = await (0, contentManagement_services_1.getAllAdminContent)(admin);
        if (!contentMgmt) {
            throw new HttpError_1.default("could not get videos", 204);
        }
        const code = contentMgmt.success ? 200 : 400;
        res.status(code).json({ data: contentMgmt });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getAllContent = getAllContent;
//VIDEOS
//Create Video
const createVideo = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const file = req.file;
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!file || !form_data) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const validationResponse = contentManagementValidations_1.uploadVideoValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const createdVideo = await (0, contentManagement_services_1.createNewVideo)(admin, { file, form_data });
        if (!createdVideo) {
            throw new HttpError_1.default("could not add video", 204);
        }
        const code = createdVideo.success ? 200 : 400;
        res.status(code).json({ data: createdVideo });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.createVideo = createVideo;
//get videos
const getVideosAdmin = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const getVideos = await (0, contentManagement_services_1.getAllVideos)(admin, queryParams);
        if (!getVideos) {
            throw new HttpError_1.default("could not get videos", 204);
        }
        const code = getVideos.success ? 200 : 400;
        res.status(code).json({ data: getVideos });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getVideosAdmin = getVideosAdmin;
//Edit Video
const editVideoById = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const file = req.file;
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const vidId = req.params.id;
        if (!vidId)
            throw new HttpError_1.default("Video Id not provided", 422);
        const validationResponse = contentManagementValidations_1.UpdateVideoValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const input = {
            id: parseInt(vidId),
            file,
            ...form_data,
        };
        const editedVideo = await (0, contentManagement_services_1.editVideosById)(input);
        if (!editedVideo) {
            throw new HttpError_1.default("could not edit video", 204);
        }
        const code = editedVideo.success ? 200 : 400;
        res.status(code).json({ form_data: editedVideo });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.editVideoById = editVideoById;
//Delete Videos
const deleteVideos = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 204);
        const { id } = req.query;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        const deleteVideoData = await (0, contentManagement_services_1.deleteVideo)(id);
        if (!deleteVideoData)
            throw new HttpError_1.default(`Could Not update appointment data`, 204);
        const code = deleteVideoData.success ? 200 : 400;
        res.status(code).json({ data: deleteVideoData });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteVideos = deleteVideos;
//ADVERTISEMENTS
//Create Advertisement
const createAdvertisement = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 204);
        const file = req.file;
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!file || !form_data) {
            throw new HttpError_1.default("Missing required fields", 422);
        }
        const validationResponse = contentManagementValidations_1.UploadAdvertisementValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[1]} : ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const createdAdvertisement = await (0, contentManagement_services_1.createNewAdvertisement)(admin, {
            file,
            form_data,
        });
        if (!createdAdvertisement) {
            throw new HttpError_1.default("could not add advertisement", 204);
        }
        const code = createdAdvertisement.success ? 200 : 400;
        res.status(code).json({ data: createdAdvertisement });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.createAdvertisement = createAdvertisement;
//get advertisements
const getAdvertisementsAdmin = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const getAdvertisements = await (0, contentManagement_services_1.getAllAdvertisements)(admin, queryParams);
        if (!getAdvertisements) {
            throw new HttpError_1.default("could not get advertisements", 204);
        }
        const code = getAdvertisements.success ? 200 : 400;
        res.status(code).json({ data: getAdvertisements });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getAdvertisementsAdmin = getAdvertisementsAdmin;
//Edit advertisement
const editAdvertisementById = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const form_data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const file = req.file;
        const advId = req.params.id;
        if (!advId)
            throw new HttpError_1.default("advertisement Id not provided", 422);
        const validationResponse = contentManagementValidations_1.UpdateAdvertisementValidation.safeParse({
            file,
            form_data,
        });
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const editedAdvertisement = await (0, contentManagement_services_1.updateAdvertisementById)({
            file,
            form_data,
            advId,
        });
        if (!editedAdvertisement) {
            throw new HttpError_1.default("could not edit advertisement", 204);
        }
        const code = editedAdvertisement.success ? 200 : 400;
        res.status(code).json({ data: editedAdvertisement });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.editAdvertisementById = editAdvertisementById;
//Delete advertisements
const deleteAdvertisement = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const { id } = req.query;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        const deleteAdvertisementData = await (0, contentManagement_services_1.deleteAdvertisements)(id);
        if (!deleteAdvertisementData)
            throw new HttpError_1.default(`Could Not update appointment data`, 204);
        const code = deleteAdvertisementData.success ? 200 : 400;
        res.status(code).json({ data: deleteAdvertisementData });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteAdvertisement = deleteAdvertisement;
//FACILITIES
//Create Facilities
const createFacilities = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const validationResponse = contentManagementValidations_1.CreateFacilitiesValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const { facPrimaryName, facPhoneNumber, facAddress, facPincode, facSpeciality, facType, } = data;
        if (!facPrimaryName ||
            !facPhoneNumber ||
            !facAddress ||
            !facPincode ||
            !facSpeciality ||
            !facType)
            throw new HttpError_1.default("Required fields missing", 422);
        const createdFacilities = await (0, contentManagement_services_1.createNewFacilities)(admin, data);
        if (!createdFacilities) {
            throw new HttpError_1.default("could not add Facilities", 204);
        }
        const code = createdFacilities.success ? 200 : 400;
        res.status(code).json({ data: createdFacilities });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.createFacilities = createFacilities;
//get Facilitiess
const getFacilitiesAdmin = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const queryParams = req.query;
        const getFacilitiess = await (0, contentManagement_services_1.getAllFacilities)(admin, queryParams);
        if (!getFacilitiess) {
            throw new HttpError_1.default("could not get Facilitiess", 204);
        }
        const code = getFacilitiess.success ? 200 : 400;
        res.status(code).json({ data: getFacilitiess });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getFacilitiesAdmin = getFacilitiesAdmin;
//Edit Facilities
const editFacilitiesById = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        const facId = req.params.id;
        if (!facId)
            throw new HttpError_1.default("Facilities Id not provided", 422);
        const validationResponse = contentManagementValidations_1.UpdateFacilitiesValidation.safeParse(data);
        if (!validationResponse.success) {
            const errorObj = validationResponse.error.issues
                .map((issue) => `${issue.path[0]}: ${issue.message}`)
                .join(" // ");
            throw new HttpError_1.default(`Validation Errors:-> ${errorObj}`, 400);
        }
        const input = {
            id: parseInt(facId),
            ...data,
        };
        const editedFacilities = await (0, contentManagement_services_1.updateFacilitiesById)(input);
        if (!editedFacilities) {
            throw new HttpError_1.default("could not edit Facilities", 204);
        }
        const code = editedFacilities.success ? 200 : 400;
        res.status(code).json({ data: editedFacilities });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.editFacilitiesById = editFacilitiesById;
//Delete Facilitiess
const deleteFacility = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const { id } = req.query;
        if (!id)
            throw new HttpError_1.default("Enter id of records to delete", 422);
        const deleteFacilitiesData = await (0, contentManagement_services_1.deleteFacilities)(id);
        if (!deleteFacilitiesData)
            throw new HttpError_1.default(`Could Not update appointment data`, 204);
        const code = deleteFacilitiesData.success ? 200 : 400;
        res.status(code).json({ data: deleteFacilitiesData });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.deleteFacility = deleteFacility;
//FEEDBACK AND COMPLAINTS
//Get all feedbacks and complaints
const getUserMessages = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        const getMessages = await (0, contentManagement_services_1.getAllMessages)(admin);
        if (!getMessages) {
            throw new HttpError_1.default("could not get messages", 204);
        }
        const code = getMessages.success ? 200 : 400;
        res.status(code).json({ data: getMessages });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.getUserMessages = getUserMessages;
//reply to complaints
const replyCompliantById = async (req, res) => {
    try {
        const admin = req.admin;
        if (!admin) {
            throw new HttpError_1.default("Unauthorized", 401);
        }
        if (admin.role == "AUDITOR")
            throw new HttpError_1.default("Not authorised to do this action", 401);
        const complaintId = req.params.id;
        const data = req.body ??
            (() => {
                throw new HttpError_1.default("API Missing body", 422);
            });
        if (!complaintId || !data)
            throw new HttpError_1.default("Missing required Fields", 422);
        const adminComplaintReply = await (0, contentManagement_services_1.complaintReplyById)(admin, {
            complaintId,
            reply: data.reply,
        });
        if (!adminComplaintReply) {
            throw new HttpError_1.default("could not edit advertisement", 204);
        }
        const code = adminComplaintReply.success ? 200 : 400;
        res.status(code).json({ data: adminComplaintReply });
    }
    catch (err) {
        if (err instanceof HttpError_1.default) {
            res.status(err.code).json({ error: { message: err.message } });
        }
        else {
            res.status(500).json({ error: { message: "Internal server error" } });
        }
    }
};
exports.replyCompliantById = replyCompliantById;
//# sourceMappingURL=contentManagementController.js.map