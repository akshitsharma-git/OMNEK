import express from "express"
import handleShowAllVideos from "../controllers/home.controllers.js"
import authenticateJWT from "../services/auth.js"

const router=express.Router()



router.get("/",authenticateJWT,handleShowAllVideos)



export default router