import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 200, // 200MB max for videos
  },
  fileFilter: (req, file, cb) => {
    if (
      file.fieldname === "video" &&
      !file.mimetype.startsWith("video/")
    ) {
      return cb(new Error("Only video files are allowed"));
    }
    if (
      file.fieldname === "thumbnail" &&
      !file.mimetype.startsWith("image/")
    ) {
      return cb(new Error("Only image files are allowed for thumbnails"));
    }
    cb(null, true);
  },
});

export default upload;
