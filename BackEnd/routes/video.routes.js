import express from "express"
import {handleBringVideo,handleVideoDelete,handleLikeVideo,handleDislikeVideo,handleToggleSubscribe,handleSaveMetaData} from "../controllers/video.controllers.js"
import authenticateJWT from "../services/auth.js"



const router=express.Router()


router.post("/metaData",authenticateJWT,handleSaveMetaData)
router.get("/:id",authenticateJWT,handleBringVideo)
router.delete("/:id",authenticateJWT,handleVideoDelete)
router.post("/:id/like",authenticateJWT,handleLikeVideo)
router.post("/:id/dislike",authenticateJWT,handleDislikeVideo)
router.post("/:id/subscribe",authenticateJWT,handleToggleSubscribe)


export default router