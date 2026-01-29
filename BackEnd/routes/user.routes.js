import express from "express"
import {handleCreateUser,handleUserLogout,handleVerifyUser,handleUserProfile,handleUserVideos} from "../controllers/user.controllers.js"
import authenticateJWT from "../services/auth.js"

const router=express.Router()



router.post("/login",handleVerifyUser)
router.post("/logout",handleUserLogout)
router.post("/signup",handleCreateUser)
router.get("/profile",authenticateJWT,handleUserProfile)
router.get("/videos",authenticateJWT,handleUserVideos)





export default router