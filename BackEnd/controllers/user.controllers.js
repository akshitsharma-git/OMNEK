import User from "../models/user.models.js";
import Video from "../models/video.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../services/cloudinary.js";

async function handleCreateUser(req, res) {
  const { fullName, email, password, username } = req.body;
  if (!fullName || !email || !password || !username) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exists!!" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashedPass,
      username,
    });

    return res.status(201).json({ message: "User Created Successfully!!" });
  } catch (err) {
    console.log("Error Creating User: ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

function handleUserLogout(req, res) {
  res.clearCookie("token");
  return res.status(200).json({ message: "User LoggedOut Successfully!!" });
}

async function handleVerifyUser(req, res) {
  const { email, password, username } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { username: username?.toLowerCase() }],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid Credentials!!" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Login Successful!!", token });
  } catch (err) {
    console.log("Error during Login: ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleUserProfile(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const user = await User.findById(req.user.id)
      .populate("subscribers", "fullName username")
      .populate("subscriptions", "fullName username");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const uploadedVideos = await Video.find({ uploader: req.user.id }).sort({
      createdAt: -1,
    });

    return res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      profilePicURL: user.profilePicURL,
      profilePicPublicId: user.profilePicPublicId,
      subscribers: user.subscribers,
      subscriptions: user.subscriptions,
      uploadedVideos,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleUserVideos(req, res) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const videos = await Video.find({ uploader: req.user.id })
      .lean()
      .populate("uploader", "fullName");
    return res.json({ videos });
  } catch (err) {
    console.error("Error fetching videos: ", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

async function handleUserPFP(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const { profilePicURL, profilePicPublicId } = req.body;

    if (!profilePicURL || !profilePicPublicId) {
      return res.status(400).json({
        message: "Profile picture URL and public ID are required",
      });
    }

    // Get current user to delete old profile picture if exists
    const currentUser = await User.findById(req.user.id);

    // Delete old profile picture from Cloudinary if it exists
    if (currentUser.profilePicPublicId) {
      try {
        await cloudinary.uploader.destroy(currentUser.profilePicPublicId);
        console.log(
          `Deleted old image from Cloudinary: ${currentUser.profilePicPublicId}`
        );
      } catch (cloudinaryError) {
        console.error(
          "Error deleting old image from Cloudinary:",
          cloudinaryError
        );
        // Continue with upload even if deletion fails
      }
    }

    // Update user with new profile picture
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        profilePicURL,
        profilePicPublicId,
      },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      message: "Profile picture updated successfully",
      profilePicURL: updatedUser.profilePicURL,
    });
  } catch (err) {
    console.error("Error updating profile picture:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

async function handleRemoveUserPFP(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from Cloudinary if exists
    if (user.profilePicPublicId) {
      try {
        await cloudinary.uploader.destroy(user.profilePicPublicId);
        console.log(`Deleted image from Cloudinary: ${user.profilePicPublicId}`);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Remove from database
    user.profilePicURL = null;
    user.profilePicPublicId = null;
    await user.save();

    return res.status(200).json({
      message: "Profile picture removed successfully",
    });
  } catch (err) {
    console.error("Error removing profile picture:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

async function handleDeleteUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated!" });
    }

    const userId = req.user.id;

    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`Starting account deletion for user: ${user.username}`);

    // 2. Delete user's profile picture from Cloudinary
    if (user.profilePicPublicId) {
      try {
        await cloudinary.uploader.destroy(user.profilePicPublicId);
        console.log(`Deleted profile picture: ${user.profilePicPublicId}`);
      } catch (err) {
        console.error("Error deleting profile picture from Cloudinary:", err);
      }
    }

    // 3. Find all videos uploaded by this user
    const userVideos = await Video.find({ uploader: userId });
    console.log(`Found ${userVideos.length} videos to delete`);

    // 4. Delete all videos and their assets from Cloudinary
    for (const video of userVideos) {
      try {
        // Delete video file from Cloudinary
        if (video.videoPublicId) {
          await cloudinary.uploader.destroy(video.videoPublicId, {
            resource_type: "video",
          });
          console.log(`Deleted video: ${video.videoPublicId}`);
        }

        // Delete thumbnail from Cloudinary
        if (video.thumbnailPublicId) {
          await cloudinary.uploader.destroy(video.thumbnailPublicId);
          console.log(`Deleted thumbnail: ${video.thumbnailPublicId}`);
        }
      } catch (err) {
        console.error(`Error deleting video assets for ${video._id}:`, err);
      }
    }

    // 5. Delete all video records from database
    await Video.deleteMany({ uploader: userId });
    console.log("Deleted all video records from database");

    // 6. Remove user from other users' subscribers arrays
    await User.updateMany(
      { subscribers: userId },
      { $pull: { subscribers: userId } }
    );
    console.log("Removed user from subscribers lists");

    // 7. Remove user from other users' subscriptions arrays
    await User.updateMany(
      { subscriptions: userId },
      { $pull: { subscriptions: userId } }
    );
    console.log("Removed user from subscriptions lists");

    // 8. Delete the user account
    await User.findByIdAndDelete(userId);
    console.log("Deleted user account");

    // 9. Clear the authentication cookie
    res.clearCookie("token");

    return res.status(200).json({
      message: "Account deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user account:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
}

export {
  handleCreateUser,
  handleUserLogout,
  handleVerifyUser,
  handleUserProfile,
  handleUserVideos,
  handleUserPFP,
  handleRemoveUserPFP,
  handleDeleteUser,
};