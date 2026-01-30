import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function VideoUploadPage() {
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const navigate = useNavigate();

  const videoInputRef = useRef(null);
  const thumbInputRef = useRef(null);

  // Toast notification function
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        showToast("Video file size must be less than 500MB", "error");
        return;
      }
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      showToast("Video selected successfully", "success");
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max for images)
      if (file.size > 10 * 1024 * 1024) {
        showToast("Thumbnail file size must be less than 10MB", "error");
        return;
      }
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
      showToast("Thumbnail selected successfully", "success");
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        // Validate file size
        if (file.size > 500 * 1024 * 1024) {
          showToast("Video file size must be less than 500MB", "error");
          return;
        }
        setVideo(file);
        setVideoPreview(URL.createObjectURL(file));
        showToast("Video selected successfully", "success");
      } else {
        showToast("Please drop a valid video file", "error");
      }
    }
  };

  const handleUpload = async () => {
    if (!title || !video) {
      showToast("Title and video are required!", "warning");
      return;
    }

    if (title.trim().length < 3) {
      showToast("Title must be at least 3 characters long", "warning");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      // Upload Video
      const videoForm = new FormData();
      videoForm.append("file", video);
      videoForm.append("upload_preset", "uploads");
      videoForm.append("folder", "omnek/videos");

      const videoRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dv4hrlvk8/video/upload",
        videoForm,
        {
          onUploadProgress: (e) => {
            setProgress(Math.round((e.loaded * 100) / e.total));
          },
        }
      );

      let thumbRes = null;
      if (thumbnail) {
        const thumbForm = new FormData();
        thumbForm.append("file", thumbnail);
        thumbForm.append("upload_preset", "uploads");
        thumbForm.append("folder", "omnek/thumbnails");

        thumbRes = await axios.post(
          "https://api.cloudinary.com/v1_1/dv4hrlvk8/image/upload",
          thumbForm
        );
      }

      await axios.post(
        `${API_BASE}/video/metaData`,
        {
          title,
          description,
          category,
          videoURL: videoRes.data.secure_url,
          videoPublicId: videoRes.data.public_id,
          thumbnailURL: thumbRes?.data?.secure_url || null,
          thumbnailPublicId: thumbRes?.data?.public_id || null,
        },
        { withCredentials: true }
      );

      showToast("Upload successful! Redirecting...", "success");
      
      // Clear form
      setTitle("");
      setDescription("");
      setCategory("");
      setVideo(null);
      setThumbnail(null);
      setVideoPreview(null);
      setThumbnailPreview(null);

      if (videoInputRef.current) videoInputRef.current.value = "";
      if (thumbInputRef.current) thumbInputRef.current.value = "";

      // Navigate after a short delay
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error("Upload error:", err);
      if (err.response?.status === 401) {
        showToast("Please log in to upload videos", "error");
        setTimeout(() => navigate("/u/login"), 2000);
      } else if (err.response?.data?.message) {
        showToast(err.response.data.message, "error");
      } else {
        showToast("Upload failed. Please try again.", "error");
      }
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, sans-serif;
        }
        
        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .upload-container {
          animation: fadeInUp 0.6s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .drag-active {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.1) !important;
          transform: scale(1.02);
        }

        .input-field {
          transition: all 0.3s ease;
        }

        .input-field:focus {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-publish {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .btn-publish:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5);
        }

        .btn-cancel {
          transition: all 0.3s ease;
        }

        .btn-cancel:hover {
          background: #334155;
          transform: translateY(-1px);
        }

        .preview-video {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .progress-bar {
          transition: width 0.3s ease;
        }

        .upload-icon {
          transition: transform 0.3s ease;
        }

        .upload-zone:hover .upload-icon {
          transform: translateY(-4px);
        }

        /* Toast Notification Styles */
        .toast-container {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 9999;
          animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .toast {
          min-width: 300px;
          padding: 16px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .toast-success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
          color: white;
        }

        .toast-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%);
          color: white;
        }

        .toast-warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%);
          color: white;
        }

        .toast-info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
          color: white;
        }
      `}</style>

      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" && (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === "error" && (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.type === "warning" && (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.type === "info" && (
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <span className="logo-text text-2xl bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              OMNEK
            </span>
          </div>

          <button
            onClick={() => navigate("/")}
            className="text-slate-300 hover:text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="upload-container">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-white mb-3">
              Upload Your Video
            </h1>
            <p className="text-slate-400 text-lg">
              Share your story with the OMNEK community
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column - Video Upload & Preview */}
            <div className="space-y-6">
              {/* Video Upload Zone */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Video File <span className="text-blue-400">*</span>
                </label>

                <div className="relative">
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !video && videoInputRef.current.click()}
                    className={`upload-zone border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      video ? 'border-slate-600' : 'cursor-pointer ' + (dragActive ? 'drag-active' : 'border-slate-600 hover:border-blue-500')
                    }`}
                  >
                    <div className="upload-icon mx-auto mb-4">
                      <svg className="w-16 h-16 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>

                    {video ? (
                      <div>
                        <p className="text-base font-medium text-white mb-1">
                          ✓ {video.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {(video.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-base font-medium text-slate-200 mb-2">
                          Drag & drop or click to upload
                        </p>
                        <p className="text-sm text-slate-400">
                          MP4, WebM, MOV • Max 500MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Delete Video Button */}
                  {video && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideo(null);
                        setVideoPreview(null);
                        if (videoInputRef.current) videoInputRef.current.value = "";
                        showToast("Video removed", "info");
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors group"
                      title="Remove video"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
              </div>

              {/* Video Preview */}
              {videoPreview && (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-slate-200">
                      Video Preview
                    </label>
                    <button
                      onClick={() => {
                        setVideo(null);
                        setVideoPreview(null);
                        if (videoInputRef.current) videoInputRef.current.value = "";
                        showToast("Video removed", "info");
                      }}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  </div>
                  <video
                    src={videoPreview}
                    controls
                    className="preview-video w-full"
                  />
                </div>
              )}

              {/* Thumbnail Upload */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Custom Thumbnail (Optional)
                </label>

                <div className="relative">
                  <div
                    onClick={() => !thumbnailPreview && thumbInputRef.current.click()}
                    className={`border-2 border-dashed rounded-xl p-6 transition-all text-center ${
                      thumbnailPreview ? 'border-slate-600' : 'cursor-pointer border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {thumbnailPreview ? (
                      <div>
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full aspect-video object-contain rounded-lg mb-3 bg-slate-900"
                        />
                        <p className="text-sm text-slate-300">{thumbnail.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(thumbnail.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 mx-auto text-slate-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-slate-300">Upload thumbnail image</p>
                        <p className="text-xs text-slate-500 mt-1">JPG, PNG • Recommended 1280x720</p>
                      </div>
                    )}
                  </div>

                  {/* Delete Thumbnail Button */}
                  {thumbnailPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setThumbnail(null);
                        setThumbnailPreview(null);
                        if (thumbInputRef.current) thumbInputRef.current.value = "";
                        showToast("Thumbnail removed", "info");
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors group"
                      title="Remove thumbnail"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Right Column - Video Details */}
            <div className="space-y-6">
              {/* Title */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Title <span className="text-blue-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Give your video an engaging title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  maxLength={100}
                />
                <p className="text-xs text-slate-500 mt-2 text-right">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Description
                </label>
                <textarea
                  placeholder="Tell viewers what your video is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="input-field w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-slate-500 mt-2 text-right">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Category */}
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <label className="block text-sm font-semibold text-slate-200 mb-3">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-field w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-600 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Music">Music</option>
                  <option value="Sports">Sports</option>
                  <option value="Tech">Tech</option>
                  <option value="Vlogs">Vlogs</option>
                  <option value="Comedy">Comedy</option>
                  <option value="News">News</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Upload Progress */}
              {loading && (
                <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-200">
                      Uploading...
                    </span>
                    <span className="text-sm font-bold text-blue-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                    <div
                      className="progress-bar bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Please don't close this page...
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => navigate("/")}
                  disabled={loading}
                  className="btn-cancel flex-1 px-6 py-3 rounded-xl border border-slate-600 text-slate-300 font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpload}
                  disabled={loading || !title || !video}
                  className="btn-publish flex-1 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Publishing...
                    </span>
                  ) : (
                    "Publish Video"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}