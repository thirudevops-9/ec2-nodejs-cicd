import axios from "axios";

export const getVideoDuration = async (videoId: string) => {
    try {
        
      const response = await axios.get(
        `https://api.vimeo.com/videos/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
          },
        }
      );

      const duration = response.data.duration; // Duration in seconds
      return duration
    } catch (error) {
      console.error("Error fetching video duration:", error);
      throw error;
    }
  }