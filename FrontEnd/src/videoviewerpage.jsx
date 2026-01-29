import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function VideoViewerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch("http://localhost:9999/u/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentUser(data);
      })
      .catch((err) => console.error("Error fetching current user:", err));
  }, []);

  useEffect(() => {
    async function fetchVideo() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:9999/video/${id}`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch video");
        }
        const data = await res.json();
        setVideo(data.video);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchVideo();
  }, [id]);

  async function handleVideoDelete() {
    try {
      const res = await fetch(`http://localhost:9999/video/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete video");
      }

      navigate("/");
    } catch (err) {
      console.error("Error deleting video:", err);
      alert("Error deleting video: " + err.message);
    }
  }

  const handleLikeVideo = async () => {
    if (!currentUser) {
      alert("Please log in first to like this video.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:9999/video/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to like video");

      const updatedVideo = await res.json();
      setVideo((prev) => ({
        ...prev,
        likes: updatedVideo.likes,
        dislikes: updatedVideo.dislikes,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislikeVideo = async () => {
    if (!currentUser) {
      alert("Please log in first to dislike this video.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:9999/video/${id}/dislike`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to dislike video");

      const updatedVideo = await res.json();
      setVideo((prev) => ({
        ...prev,
        likes: updatedVideo.likes,
        dislikes: updatedVideo.dislikes,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!currentUser) {
      alert("Please log in first to subscribe.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:9999/video/${video.uploader._id}/subscribe`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to subscribe");

      const updated = await res.json();

      setVideo((prev) => ({
        ...prev,
        uploader: {
          ...prev.uploader,
          subscribers: updated.channelSubscribers,
        },
        isSubscribed: updated.subscribed,
      }));
    } catch (err) {
      console.error("Subscribe error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-slate-300 font-medium">Loading video...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Video Not Found</h2>
          <p className="text-slate-400 mb-6">{error || "The video you're looking for doesn't exist."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isUserLiked = video.likes?.includes(currentUser?._id);
  const isUserDisliked = video.dislikes?.includes(currentUser?._id);
  const isOwner = currentUser?._id === video?.uploader?._id;

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

        .video-container {
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

        .action-btn {
          transition: all 0.3s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        .action-btn:active {
          transform: translateY(0);
        }

        .subscribe-btn {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
        }

        .subscribe-btn:hover {
          box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
        }

        .subscribed-btn {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          box-shadow: 0 4px 14px rgba(100, 116, 139, 0.4);
        }

        .subscribed-btn:hover {
          box-shadow: 0 8px 25px rgba(100, 116, 139, 0.5);
        }

        .delete-modal {
          animation: modalFadeIn 0.3s ease-out;
        }

        @keyframes modalFadeIn {
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
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="video-container space-y-6">
          {/* Video Player */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            <video
              src={video.videoURL}
              controls
              className="w-full aspect-video"
              autoPlay
            />
          </div>

          {/* Video Title */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-3">
              {video.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {video.views.toLocaleString()} views
              </span>
              <span>•</span>
              <span>{new Date(video.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}</span>
              {video.category && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {video.category}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Like/Dislike */}
            <div className="flex items-center bg-slate-800 rounded-full border border-slate-700 overflow-hidden">
              <button
                onClick={handleLikeVideo}
                className={`action-btn px-5 py-2.5 flex items-center gap-2 font-semibold transition-colors ${
                  isUserLiked ? 'text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill={isUserLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {video.likes?.length || 0}
              </button>
              
              <div className="w-px h-6 bg-slate-700"></div>
              
              <button
                onClick={handleDislikeVideo}
                className={`action-btn px-5 py-2.5 flex items-center gap-2 font-semibold transition-colors ${
                  isUserDisliked ? 'text-blue-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                <svg className="w-5 h-5" fill={isUserDisliked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
                {video.dislikes?.length || 0}
              </button>
            </div>

            {/* Delete Button (Owner Only) */}
            {isOwner && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="action-btn px-5 py-2.5 bg-red-500/10 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 font-semibold flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Video
              </button>
            )}
          </div>

          {/* Channel Info & Subscribe */}
          {video?.uploader && (
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-4">
                  {/* Channel Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {video.uploader.username?.[0]?.toUpperCase()}
                  </div>
                  
                  {/* Channel Name & Subscribers */}
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {video.uploader.fullName || video.uploader.username || "Unknown Creator"}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {video.uploader.subscribers?.toLocaleString() || 0} subscribers
                    </p>
                  </div>
                </div>

                {/* Subscribe Button */}
                {!isOwner && currentUser && (
                  <button
                    onClick={handleToggleSubscribe}
                    className={`action-btn px-6 py-2.5 rounded-full text-white font-semibold ${
                      video.isSubscribed ? 'subscribed-btn' : 'subscribe-btn'
                    }`}
                  >
                    {video.isSubscribed ? "Subscribed" : "Subscribe"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Description
            </h3>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
              {video.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="delete-modal bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Video?</h3>
              <p className="text-slate-400">
                This action cannot be undone. Your video will be permanently deleted.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleVideoDelete();
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold transition-all shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoViewerPage;