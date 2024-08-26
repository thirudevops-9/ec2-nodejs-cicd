"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoDuration = void 0;
const axios_1 = __importDefault(require("axios"));
const getVideoDuration = async (videoId) => {
    try {
        const response = await axios_1.default.get(`https://api.vimeo.com/videos/${videoId}`, {
            headers: {
                Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
            },
        });
        const duration = response.data.duration; // Duration in seconds
        return duration;
    }
    catch (error) {
        console.error("Error fetching video duration:", error);
        throw error;
    }
};
exports.getVideoDuration = getVideoDuration;
//# sourceMappingURL=getVideoDuration.js.map