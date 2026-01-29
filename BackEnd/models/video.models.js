  import mongoose from "mongoose";

  const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    videoURL: { type: String, required: true },
    videoPublicId:{type:String},
    thumbnailURL: { type: String },
    thumbnailPublicId:{type:String},
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  },{timestamps:true});

  const Video = mongoose.model('Video', videoSchema);
  export default Video;
