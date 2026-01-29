import Video from "../models/video.models.js";
import User from "../models/user.models.js";
import cloudinary from "../services/cloudinary.js";
import mongoose from "mongoose";



async function handleSaveMetaData(req, res) {
  
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const {
      title,
      description,
      category,
      videoURL,
      videoPublicId,
      thumbnailURL,
      thumbnailPublicId,
    } = req.body;

    
    if (!title || !videoURL || !videoPublicId) {
      return res.status(400).json({
        message: "Title, videoURL and videoPublicId are required",
      });
    }

    
    const newVideo = await Video.create({
      title,
      description,
      category,
      videoURL,
      videoPublicId,
      thumbnailURL: thumbnailURL || null,
      thumbnailPublicId: thumbnailPublicId || null,
      uploader: req.user.id,
    });

    return res.status(201).json({
      message: "Video metadata saved successfully",
      video: newVideo,
    });
  } catch (err) {
    console.error("Error saving video metadata:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}




async function handleBringVideo(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const cookieKey = `viewed_${id}`;
    const alreadyViewed = Boolean(req.cookies?.[cookieKey]);

    let video;
    if (alreadyViewed) {
      video = await Video.findById(id).populate(
        "uploader",
        "fullname subscribers username"
      );
    } else {
      video = await Video.findByIdAndUpdate(
        id,
        { $inc: { views: 1 } },
        { new: true }
      ).populate("uploader", "username subscribers fullName");

      res.cookie(cookieKey, "1", {
        maxAge: 1000 * 60 * 60 * 6,
        sameSite: "lax",
      });
    }

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const uploader = video.uploader;

    let isSubscribed = false;
    if (req.user) {
      isSubscribed = uploader?.subscribers?.some(
        (id) => req.user && id.toString() === req.user.id
      );
    }

    
    res.json({
      video: {
        ...video.toObject(),
        uploader: {
          ...uploader.toObject(),
          subscribers: uploader.subscribers.length,
        },
        isSubscribed,
      },
    });
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}

async function handleVideoDelete(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid video ID" });
  }

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (video.uploader.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this video" });
    }

    if (video.videoPublicId) {
      await cloudinary.uploader.destroy(video.videoPublicId, {
        resource_type: "video",
      });
    }

    if (video.thumbnailPublicId) {
      await cloudinary.uploader.destroy(video.thumbnailPublicId);
    }

    await Video.findByIdAndDelete(id);

    res.json({ message: "Video Deleted Successfully!!" });
  } catch (err) {
    console.error("Error Deleting Video: ", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleLikeVideo(req, res) {
  try {
    if (!req.params.id) {
      return res
        .status(404)
        .json({ message: "Login First to Like or Dislike" });
    }
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.dislikes = video.dislikes.filter(
      (uid) => uid.toString() !== req.user.id
    );

    if (!video.likes.includes(req.user.id)) {
      video.likes.push(req.user.id);
    }

    await video.save();
    res.json({
      message: "Video liked",
      likes: video.likes,
      dislikes: video.dislikes,
    });
  } catch (err) {
    console.error("Error liking video:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleDislikeVideo(req, res) {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    video.likes = video.likes.filter((uid) => uid.toString() !== req.user.id);

    if (!video.dislikes.includes(req.user.id)) {
      video.dislikes.push(req.user.id);
    }

    await video.save();
    res.json({
      message: "Video disliked",
      likes: video.likes,
      dislikes: video.dislikes,
    });
  } catch (err) {
    console.error("Error disliking video:", err);
    res.status(500).json({ message: "Server error" });
  }
}

async function handleToggleSubscribe(req, res) {
  try {
    const channelId = req.params.id;
    const userId = req.user.id;

    if (channelId === userId) {
      return res
        .status(400)
        .json({ message: "You cannot subscribe to yourself" });
    }

    const channel = await User.findById(channelId);
    const currentUser = await User.findById(userId);

    if (!channel || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSubscribed = channel.subscribers.includes(userId);

    if (isSubscribed) {
      
      channel.subscribers.pull(userId);
      currentUser.subscriptions.pull(channelId);
    } else {
      
      channel.subscribers.push(userId);
      currentUser.subscriptions.push(channelId);
    }

    await channel.save();
    await currentUser.save();

    res.status(200).json({
      message: isSubscribed
        ? "Unsubscribed successfully"
        : "Subscribed successfully",
      subscribed: !isSubscribed,
      channelSubscribers: channel.subscribers.length,
    });
  } catch (error) {
    console.error("Subscribe toggle error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export {
  handleBringVideo,
  handleVideoDelete,
  handleLikeVideo,
  handleDislikeVideo,
  handleToggleSubscribe,
  handleSaveMetaData
};
