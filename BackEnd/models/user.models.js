import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName:{type: String, required: true },
  email:{type: String, required: true, unique: true },
  username:{type:String,required:true,unique:true},
  password:{type: String, required: true },
  profilePic:{type: String, default: "" },
  subscribers:[{type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  subscriptions:[{type: mongoose.Schema.Types.ObjectId, ref: "User" }],
},{timestamps:true});

const User = mongoose.model("User", userSchema);
export default User;
