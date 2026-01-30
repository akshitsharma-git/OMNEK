import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("videos");
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [uploadingPFP, setUploadingPFP] = useState(false);
  const [showPFPModal, setShowPFPModal] = useState(false);
  const [pfpPreview, setPfpPreview] = useState(null);
  const [selectedPFP, setSelectedPFP] = useState(null);

  const navigate = useNavigate();
  const pfpInputRef = useRef(null);

  // Toast notification function
  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    const fetchProfileAndVideos = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch(`${API_BASE}/u/profile`, {
          credentials: "include",
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileRes.json();
        setUser(profileData);

        // Fetch user's videos
        const videosRes = await fetch("${API_BASE}/u/videos", {
          credentials: "include",
        });
        if (!videosRes.ok) throw new Error("Failed to fetch videos");
        const videosData = await videosRes.json();
        setVideos(videosData.videos || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndVideos();
  }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/u/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/u/login");
  };

  const handlePFPChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast("Please select a valid image file", "error");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB", "error");
        return;
      }

      setSelectedPFP(file);
      setPfpPreview(URL.createObjectURL(file));
      setShowPFPModal(true);
    }
  };

  const handleUploadPFP = async () => {
    if (!selectedPFP) return;

    setUploadingPFP(true);

    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", selectedPFP);
      formData.append("upload_preset", "uploads");
      formData.append("folder", "omnek/profile-pictures");

      const cloudinaryRes = await axios.post(
        "https://api.cloudinary.com/v1_1/dv4hrlvk8/image/upload",
        formData
      );

      // Send to backend
      const response = await fetch(`${API_BASE}/u/profile/addPFP`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profilePicURL: cloudinaryRes.data.secure_url,
          profilePicPublicId: cloudinaryRes.data.public_id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile picture");
      }

      const data = await response.json();

      // Update local user state
      setUser({
        ...user,
        profilePicURL: data.profilePicURL,
      });
      setShowPFPModal(false);
      setPfpPreview(null);
      setSelectedPFP(null);
      showToast("Profile picture updated successfully!", "success");
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      showToast("Failed to update profile picture", "error");
    } finally {
      setUploadingPFP(false);
    }
  };

  const handleRemovePFP = async () => {
    try {
      const response = await fetch(`${API_BASE}/u/profile/removePFP`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to remove profile picture");
      }

      setUser({
        ...user,
        profilePicURL: null,
        profilePicPublicId: null,
      });

      // Reset the file input so user can select the same file again if needed
      if (pfpInputRef.current) {
        pfpInputRef.current.value = "";
      }

      showToast("Profile picture removed", "success");
    } catch (err) {
      console.error("Error removing profile picture:", err);
      showToast("Failed to remove profile picture", "error");
    }
  };


  const handleDeleteAccount = async () => {
  // Show confirmation dialog
  const confirmed = window.confirm(
    "⚠️ Are you sure you want to delete your account?\n\n" +
    "This will permanently delete:\n" +
    "• Your profile and all personal information\n" +
    "• All your uploaded videos\n" +
    "• All your comments and interactions\n\n" +
    "This action CANNOT be undone!"
  );

  if (!confirmed) return;

  // Double confirmation
  const doubleConfirm = window.confirm(
    "🚨 FINAL WARNING!\n\n" +
    "This is your last chance to cancel.\n" +
    "Are you ABSOLUTELY sure you want to delete your account forever?"
  );

  if (!doubleConfirm) return;

  try {
    const response = await fetch(`${API_BASE}/u/profile/delete`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to delete account");
    }

    showToast("Account deleted successfully", "success");
    
    // Redirect to login page after 2 seconds
    setTimeout(() => {
      navigate("/u/login");
    }, 2000);
  } catch (err) {
    console.error("Error deleting account:", err);
    showToast("Failed to delete account. Please try again.", "error");
  }
};  

  if (loading) {
    return (
      <div
        className={`h-screen flex items-center justify-center ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" : "bg-gradient-to-br from-blue-50 via-white to-blue-50"}`}
      >
        <div className="text-center space-y-4">
          <div
            className={`w-16 h-16 mx-auto border-4 rounded-full animate-spin ${darkMode ? "border-blue-500/30 border-t-blue-500" : "border-blue-200 border-t-blue-600"}`}
          ></div>
          <p
            className={`font-medium tracking-wide ${darkMode ? "text-slate-300" : "text-slate-700"}`}
          >
            Loading profile
          </p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">
            {error || "User not logged in"}
          </p>
          <button
            onClick={() => navigate("/u/login")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={darkMode ? "min-h-screen" : "min-h-screen"}>
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
        
        .video-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 14px;
          padding: 10px;
          position: relative;
        }
        
        .video-card:hover {
          transform: translateY(-12px) scale(1.04);
          z-index: 20;
        }
        
        .video-card:hover .play-overlay {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }

        .video-card:hover .thumbnail-img {
          transform: scale(1.05);
        }
        
        .thumbnail-container {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .video-card:hover .thumbnail-container {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
        }
        
        .thumbnail-img {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.7);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: none;
          z-index: 20;
        }

        .btn-primary {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.5);
        }

        .theme-toggle {
          transition: all 0.3s ease;
        }

        .theme-toggle:hover {
          transform: scale(1.05);
        }

        .tab-button {
          position: relative;
          transition: all 0.3s ease;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          border-radius: 2px 2px 0 0;
        }

        .stat-card {
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
        }

        .profile-header {
          animation: fadeInDown 0.6s ease-out;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .stagger-1 { animation-delay: 0.05s; opacity: 0; }
        .stagger-2 { animation-delay: 0.1s; opacity: 0; }
        .stagger-3 { animation-delay: 0.15s; opacity: 0; }
        .stagger-4 { animation-delay: 0.2s; opacity: 0; }
        .stagger-5 { animation-delay: 0.25s; opacity: 0; }
        .stagger-6 { animation-delay: 0.3s; opacity: 0; }
        .stagger-7 { animation-delay: 0.35s; opacity: 0; }
        .stagger-8 { animation-delay: 0.4s; opacity: 0; }

        .category-badge {
          background: rgba(59, 130, 246, 0.95);
          color: white;
          backdrop-filter: blur(8px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          opacity: 1;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .video-card:hover .category-badge {
          opacity: 0;
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

        .profile-pic-container {
          position: relative;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .profile-pic-container:hover .pfp-overlay {
          opacity: 1;
        }

        /* Show remove button on hover */
        .profile-pic-container:hover .pfp-remove-btn {
          opacity: 1 !important;
        }

        .pfp-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }

        .pfp-remove-btn {
          transition: all 0.3s ease;
          z-index: 10;
        }

        .pfp-remove-btn:hover {
          transform: scale(1.1);
        }

        .modal-overlay {
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toast.show && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" && (
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {toast.type === "error" && (
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {toast.type === "warning" && (
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            )}
            {toast.type === "info" && (
              <svg
                className="w-6 h-6 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Profile Picture Upload Modal */}
      {showPFPModal && (
        <div className="modal-overlay fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="modal-content bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">
              Update Profile Picture
            </h3>

            {pfpPreview && (
              <div className="mb-6">
                <img
                  src={pfpPreview}
                  alt="Preview"
                  className="w-48 h-48 mx-auto rounded-full object-cover border-4 border-blue-500"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPFPModal(false);
                  setPfpPreview(null);
                  setSelectedPFP(null);
                }}
                disabled={uploadingPFP}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadPFP}
                disabled={uploadingPFP}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploadingPFP ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          background: darkMode
            ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
            : "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f1f5f9 100%)",
          minHeight: "100vh",
        }}
      >
        {/* NAVBAR */}
        <nav
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: darkMode
              ? "rgba(15, 23, 42, 0.9)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(16px)",
            borderBottom: darkMode ? "1px solid #334155" : "1px solid #e5e7eb",
            boxShadow: darkMode
              ? "0 1px 3px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div className="max-w-[1800px] mx-auto px-8 h-16 flex items-center justify-between">
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="logo-text text-2xl bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                OMNEK
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="theme-toggle p-2 rounded-lg transition-all"
                style={{
                  background: darkMode ? "#1e293b" : "#f1f5f9",
                  border: darkMode ? "1px solid #475569" : "1px solid #cbd5e1",
                }}
                title={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? (
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5 text-slate-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>

              <button
                onClick={() => navigate("/video/upload")}
                className="btn-primary px-5 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload
              </button>

              <button
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: darkMode ? "#1e293b" : "white",
                  border: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
                  color: darkMode ? "#e2e8f0" : "#475569",
                }}
              >
                Home
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: darkMode ? "#1e293b" : "white",
                  border: darkMode ? "2px solid #475569" : "2px solid #cbd5e1",
                  color: darkMode ? "#e2e8f0" : "#475569",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>

        {/* PROFILE HEADER */}
        <section className="max-w-[1400px] mx-auto px-8 py-8">
          <div
            className="profile-header rounded-3xl p-8 mb-8"
            style={{
              background: darkMode ? "#1e293b" : "white",
              border: darkMode ? "1px solid #334155" : "1px solid #e5e7eb",
              boxShadow: darkMode
                ? "0 4px 20px rgba(0,0,0,0.3)"
                : "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Profile Avatar with Upload */}
              <div className="relative">
                <div 
                  className="profile-pic-container"
                  onClick={() => {
                    // Only trigger file input if user doesn't have a profile pic
                    if (!user.profilePicURL) {
                      pfpInputRef.current.click();
                    }
                  }}
                >
                  {user.profilePicURL ? (
                    <img
                      src={user.profilePicURL}
                      alt={user.fullName}
                      className="w-32 h-32 rounded-full object-cover shadow-2xl border-4 border-blue-500"
                      onClick={(e) => {
                        // Allow clicking on the image to change it
                        e.stopPropagation();
                        pfpInputRef.current.click();
                      }}
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
                      {user.fullName[0].toUpperCase()}
                    </div>
                  )}

                  {/* Camera Icon Overlay - Shows on hover */}
                  <div className="pfp-overlay" onClick={(e) => {
                    e.stopPropagation();
                    pfpInputRef.current.click();
                  }}>
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>

                  {/* Remove Button - Shows on hover over the profile pic container */}
                  {user.profilePicURL && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePFP();
                      }}
                      className="pfp-remove-btn absolute top-0 right-0 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-all shadow-lg opacity-0"
                      title="Remove profile picture"
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <input
                  ref={pfpInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePFPChange}
                  className="hidden"
                />

                {/* Green Active Dot - Always visible */}
                <div 
                  className="absolute bottom-0 right-0 w-10 h-10 bg-green-500 rounded-full border-4 pointer-events-none" 
                  style={{
                    borderColor: darkMode ? '#1e293b' : 'white'
                  }}
                ></div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1
                  className="text-3xl md:text-4xl font-bold mb-2"
                  style={{
                    color: darkMode ? "#f1f5f9" : "#0f172a",
                  }}
                >
                  {user.fullName}
                </h1>
                <p
                  className="text-lg mb-4"
                  style={{
                    color: darkMode ? "#94a3b8" : "#64748b",
                  }}
                >
                  @{user.username}
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <div
                    className="flex items-center gap-2 px-4 py-2 rounded-lg"
                    style={{
                      background: darkMode ? "#0f172a" : "#f1f5f9",
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      style={{ color: darkMode ? "#60a5fa" : "#3b82f6" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span
                      className="text-sm font-medium"
                      style={{ color: darkMode ? "#cbd5e1" : "#475569" }}
                    >
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6">
                <div
                  className="stat-card text-center px-6 py-4 rounded-xl"
                  style={{
                    background: darkMode ? "#0f172a" : "#f1f5f9",
                    border: darkMode
                      ? "1px solid #334155"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    {videos.length}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    Videos
                  </div>
                </div>
                <div
                  className="stat-card text-center px-6 py-4 rounded-xl"
                  style={{
                    background: darkMode ? "#0f172a" : "#f1f5f9",
                    border: darkMode
                      ? "1px solid #334155"
                      : "1px solid #e5e7eb",
                  }}
                >
                  <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    {videos.reduce((sum, v) => sum + (v.views || 0), 0)}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    Total Views
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div
            className="flex gap-6 mb-8 border-b-2"
            style={{
              borderColor: darkMode ? "#334155" : "#e5e7eb",
            }}
          >
            <button
              onClick={() => setActiveTab("videos")}
              className={`tab-button pb-3 px-4 font-semibold text-base transition-all ${
                activeTab === "videos" ? "active" : ""
              }`}
              style={{
                color:
                  activeTab === "videos"
                    ? darkMode
                      ? "#60a5fa"
                      : "#2563eb"
                    : darkMode
                      ? "#94a3b8"
                      : "#64748b",
              }}
            >
              My Videos
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`tab-button pb-3 px-4 font-semibold text-base transition-all ${
                activeTab === "about" ? "active" : ""
              }`}
              style={{
                color:
                  activeTab === "about"
                    ? darkMode
                      ? "#60a5fa"
                      : "#2563eb"
                    : darkMode
                      ? "#94a3b8"
                      : "#64748b",
              }}
            >
              About
            </button>
          </div>

          {/* TAB CONTENT - Videos Tab */}
          {activeTab === "videos" && (
            <div>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {videos.map((video, index) => (
                    <div
                      key={video._id}
                      onClick={() => navigate(`/video/${video._id}`)}
                      className={`video-card cursor-pointer fade-in-up stagger-${(index % 8) + 1}`}
                      style={{
                        background: darkMode ? "#1e293b" : "white",
                        border: darkMode
                          ? "1px solid #334155"
                          : "1px solid #e5e7eb",
                        boxShadow: darkMode
                          ? "none"
                          : "0 1px 3px rgba(0,0,0,0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#3b82f6";
                        e.currentTarget.style.boxShadow =
                          "0 20px 50px rgba(59, 130, 246, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = darkMode
                          ? "#334155"
                          : "#e5e7eb";
                        e.currentTarget.style.boxShadow = darkMode
                          ? "none"
                          : "0 1px 3px rgba(0,0,0,0.1)";
                      }}
                    >
                      <div
                        className="thumbnail-container relative"
                        style={{ background: darkMode ? "#0f172a" : "#e2e8f0" }}
                      >
                        <img
                          src={
                            video.thumbnailURL ||
                            "https://via.placeholder.com/400x225/1e293b/60a5fa?text=OMNEK"
                          }
                          alt={video.title}
                          className="thumbnail-img w-full aspect-video object-cover"
                        />

                        <div className="play-overlay">
                          <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                            <svg
                              className="w-6 h-6 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>

                        {video.category && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="category-badge px-2.5 py-1 rounded-md text-xs font-semibold">
                              {video.category}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 px-1">
                        <h3
                          className="font-semibold leading-snug line-clamp-2 text-sm mb-2"
                          style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                        >
                          {video.title}
                        </h3>

                        <div className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <svg
                              className="w-3.5 h-3.5"
                              style={{
                                color: darkMode ? "#64748b" : "#94a3b8",
                              }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span
                              className="font-medium"
                              style={{
                                color: darkMode ? "#94a3b8" : "#64748b",
                              }}
                            >
                              {video.views || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="text-center py-24 rounded-2xl border-2 border-dashed"
                  style={{
                    background: darkMode ? "#1e293b" : "white",
                    borderColor: darkMode ? "#475569" : "#cbd5e1",
                  }}
                >
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                  >
                    No videos uploaded yet
                  </h3>
                  <p
                    className="mb-6"
                    style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                  >
                    Start sharing your content with the world
                  </p>
                  <button
                    onClick={() => navigate("/video/upload")}
                    className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Upload your first video
                  </button>
                </div>
              )}
            </div>
          )}

          {/* About Tab */}
          {activeTab === "about" && (
            <div className="max-w-3xl">
              <div
                className="rounded-2xl p-8"
                style={{
                  background: darkMode ? "#1e293b" : "white",
                  border: darkMode ? "1px solid #334155" : "1px solid #e5e7eb",
                  boxShadow: darkMode
                    ? "0 4px 20px rgba(0,0,0,0.3)"
                    : "0 4px 20px rgba(0,0,0,0.08)",
                }}
              >
                <h2
                  className="text-2xl font-bold mb-6"
                  style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                >
                  Account Information
                </h2>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{
                      background: darkMode ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        Full Name
                      </p>
                      <p
                        className="text-base font-semibold"
                        style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                      >
                        {user.fullName}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{
                      background: darkMode ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        Email Address
                      </p>
                      <p
                        className="text-base font-semibold"
                        style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Username */}
                  <div
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{
                      background: darkMode ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        Username
                      </p>
                      <p
                        className="text-base font-semibold"
                        style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                      >
                        @{user.username}
                      </p>
                    </div>
                  </div>

                  {/* User ID */}
                  <div
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{
                      background: darkMode ? "#0f172a" : "#f8fafc",
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
                      >
                        User ID
                      </p>
                      <p
                        className="text-base font-semibold font-mono"
                        style={{ color: darkMode ? "#f1f5f9" : "#0f172a" }}
                      >
                        {user._id}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-8 pt-6 border-t"
                  style={{
                    borderColor: darkMode ? "#334155" : "#e5e7eb",
                  }}
                >
                  <button 
  onClick={handleDeleteAccount}
  className="w-full px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2" 
  style={{
    background: darkMode ? "#dc2626" : "#ef4444",
    color: "white",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = darkMode ? "#b91c1c" : "#dc2626";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = darkMode ? "#dc2626" : "#ef4444";
  }}
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
  Delete Account
</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}