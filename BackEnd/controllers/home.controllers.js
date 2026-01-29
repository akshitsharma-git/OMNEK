import Video from "../models/video.models.js";

async function handleShowAllVideos(req, res) {
  try {
    const videos = await Video.find()
      .sort({ createdAt: -1 })
      .populate("uploader", "fullName username email"); 

    const formattedVideos = videos.map(video => ({
      _id: video._id,
      title: video.title,
      description: video.description,
      videoURL: video.videoURL,
      thumbnailURL: video.thumbnailURL || null,
      category: video.category,
      views: video.views,
      likesCount: video.likes.length,
      dislikesCount: video.dislikes.length,
      uploader: video.uploader,
      createdAt: video.createdAt
    }));

    const user = req.user || null

    return res.status(200).json({
      success: true,
      message: "Welcome to OMNEK",
      data: { videos: formattedVideos, user }
    });

  } catch (err) {
    console.error("Error fetching videos:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

export default handleShowAllVideos ;
