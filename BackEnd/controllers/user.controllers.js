import User from "../models/user.models.js";
import Video from "../models/video.models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    const user = await User.findOne({ $or: [{ email:email?.toLowerCase() }, { username:username?.toLowerCase() }] });

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
      maxAge:3600000,
      sameSite:"strict",
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

    const uploadedVideos = await Video.find({ uploader: req.user.id })
      .sort({ createdAt: -1 });

    return res.json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      subscribers: user.subscribers,
      subscriptions: user.subscriptions,
      uploadedVideos
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}


async function handleUserVideos(req,res){
    if(!req.user){
      return res.status(401).json({ message: "Not authenticated" });
    }

    try{
      const videos=await Video.find({uploader:req.user.id}).lean().populate("uploader","fullName")
      return res.json({videos})
    }catch(err){
      console.error("Error fetching videos: ",err)
      return res.status(500).json({message:"Internal Server Error"})
    }
}


async function handleUserSubscribers(req,res){

}


async function handleUserSubscriptions(req,res){

}


export {
  handleCreateUser,
  handleUserLogout,
  handleVerifyUser,
  handleUserProfile,
  handleUserVideos,
  handleUserSubscriptions,
  handleUserSubscribers,
};
