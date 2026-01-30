import express from "express"
import {handleCreateUser,handleUserLogout,handleVerifyUser,handleUserProfile,handleUserVideos,handleUserPFP,handleRemoveUserPFP,handleDeleteUser} from "../controllers/user.controllers.js"
import authenticateJWT from "../services/auth.js"

const router=express.Router()



router.post("/login",handleVerifyUser)
router.post("/logout",handleUserLogout)
router.post("/signup",handleCreateUser)
router.get("/profile",authenticateJWT,handleUserProfile)
router.post("/profile/addPFP",authenticateJWT,handleUserPFP)
router.delete("/profile/removePFP",authenticateJWT,handleRemoveUserPFP)
router.get("/videos",authenticateJWT,handleUserVideos)
router.delete("/profile/delete",authenticateJWT,handleDeleteUser)





export default router