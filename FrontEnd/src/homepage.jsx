import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

export default function HomePage() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`${API_BASE}/`, {
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok) {
          setVideos(data.data.videos);
          setUser(data.data.user);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const handleLogout = async () => {
    await fetch(`${API_BASE}/u/logout`, {
      method: "POST",
      credentials: "include",
    });
    navigate("/u/login");
  };

  // Filter videos based on search query and category
  const filteredVideos = videos.filter((video) => {
    const matchesSearch = 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.uploader?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || video.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from videos
  const categories = ["all", ...new Set(videos.map(v => v.category).filter(Boolean))];

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSelectedCategory("all");
  };

  if (loading) {
    return (
      <div className={`h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'}`}>
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 mx-auto border-4 rounded-full animate-spin ${darkMode ? 'border-blue-500/30 border-t-blue-500' : 'border-blue-200 border-t-blue-600'}`}></div>
          <p className={`font-medium tracking-wide ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Loading your feed</p>
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

        body {
          transition: background-color 0.3s ease;
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

        .video-card:hover .thumbnail-img,
        .video-card:hover .thumbnail-video {
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
        
        .thumbnail-img,
        .thumbnail-video {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .thumbnail-video {
          pointer-events: none;
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
        
        .search-container {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .search-container:focus-within {
          transform: translateY(-1px);
        }
        
        .fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
          
        .category-badge {
          opacity: 1;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }

        .video-card:hover .category-badge {
          opacity: 0;
          transform: translateY(-4px);
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
        }

        .theme-toggle {
          transition: all 0.3s ease;
        }

        .theme-toggle:hover {
          transform: scale(1.05);
        }

        .category-chip {
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .category-chip:hover {
          transform: translateY(2px);
        }

        .category-chip.active {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .search-clear-btn {
          transition: all 0.2s ease;
        }

        .search-clear-btn:hover {
          transform: scale(1.1);
        }

        .no-results {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes fadeIn {
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

      <div style={{ 
        background: darkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' 
          : 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 50%, #f1f5f9 100%)',
        minHeight: '100vh'
      }}>
        {/* NAVBAR */}
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
          boxShadow: darkMode ? '0 1px 3px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
          <div className="max-w-[1800px] mx-auto px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <span className="logo-text text-2xl bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                OMNEK
              </span>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 mx-12 max-w-2xl">
              <div className="search-container w-full">
                <input
                  type="text"
                  placeholder="Search videos, creators, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  style={{
                    width: '100%',
                    paddingLeft: '2.75rem',
                    paddingRight: searchQuery ? '2.5rem' : '1.5rem',
                    paddingTop: '0.625rem',
                    paddingBottom: '0.625rem',
                    borderRadius: '0.75rem',
                    border: darkMode ? '2px solid #334155' : '2px solid #e5e7eb',
                    background: darkMode ? '#1e293b' : 'white',
                    color: darkMode ? '#f1f5f9' : '#0f172a',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    borderColor: searchFocused ? '#3b82f6' : (darkMode ? '#334155' : '#e5e7eb'),
                    boxShadow: searchFocused ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none'
                  }}
                />
                <svg 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: darkMode ? '#64748b' : '#94a3b8' }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                
                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="search-clear-btn absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700"
                    style={{ color: darkMode ? '#94a3b8' : '#64748b' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right Actions */}
            {user ? (
              <div className="flex items-center gap-3">
                {/* Theme Toggle Button */}
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="theme-toggle p-2 rounded-lg transition-all"
                  style={{
                    background: darkMode ? '#1e293b' : '#f1f5f9',
                    border: darkMode ? '1px solid #475569' : '1px solid #cbd5e1'
                  }}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? (
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                <span className="hidden lg:block text-sm font-medium px-3" style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                  {user.fullName}
                </span>
                
                <button
                  onClick={() => navigate("/video/upload")}
                  className="btn-primary px-5 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Upload
                </button>

                <button
                  onClick={() => navigate("/u/profile")}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: darkMode ? '#1e293b' : 'white',
                    border: darkMode ? '2px solid #475569' : '2px solid #cbd5e1',
                    color: darkMode ? '#e2e8f0' : '#475569'
                  }}
                >
                  Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: darkMode ? '#1e293b' : 'white',
                    border: darkMode ? '2px solid #475569' : '2px solid #cbd5e1',
                    color: darkMode ? '#e2e8f0' : '#475569'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/u/login")}
                  className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: darkMode ? '#1e293b' : 'white',
                    border: darkMode ? '2px solid #475569' : '2px solid #cbd5e1',
                    color: darkMode ? '#e2e8f0' : '#475569'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate("/u/signup")}
                  className="btn-primary px-5 py-2 rounded-lg text-white text-sm font-semibold"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* CATEGORY FILTERS */}
        {videos.length > 0 && (
          <section className="max-w-[1800px] mx-auto px-8 py-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`category-chip px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
                    selectedCategory === category ? 'active' : ''
                  }`}
                  style={{
                    background: selectedCategory === category 
                      ? undefined 
                      : (darkMode ? '#1e293b' : 'white'),
                    border: selectedCategory === category 
                      ? 'none' 
                      : `2px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
                    color: selectedCategory === category 
                      ? 'white' 
                      : (darkMode ? '#cbd5e1' : '#475569')
                  }}
                >
                  {category === "all" ? "All Videos" : category}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SEARCH RESULTS INFO */}
        {(searchQuery || selectedCategory !== "all") && (
          <section className="max-w-[1800px] mx-auto px-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p style={{ color: darkMode ? '#cbd5e1' : '#475569' }} className="text-sm font-medium">
                  {filteredVideos.length === 0 
                    ? 'No results found' 
                    : `${filteredVideos.length} ${filteredVideos.length === 1 ? 'video' : 'videos'} found`}
                </p>
                {searchQuery && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                    background: darkMode ? '#1e293b' : '#f1f5f9',
                    color: darkMode ? '#60a5fa' : '#2563eb'
                  }}>
                    "{searchQuery}"
                  </span>
                )}
              </div>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  onClick={clearSearch}
                  className="text-sm font-medium flex items-center gap-1 hover:underline"
                  style={{ color: darkMode ? '#60a5fa' : '#2563eb' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear filters
                </button>
              )}
            </div>
          </section>
        )}

        {/* VIDEO GRID */}
        <section className="max-w-[1800px] mx-auto px-8 py-6">
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredVideos.map((video, index) => (
                <div
                  key={video._id}
                  onClick={() => navigate(`/video/${video._id}`)}
                  className={`video-card cursor-pointer fade-in-up stagger-${(index % 8) + 1}`}
                  style={{
                    background: darkMode ? '#1e293b' : 'white',
                    border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                    boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = darkMode ? '#334155' : '#e5e7eb';
                    e.currentTarget.style.boxShadow = darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Thumbnail */}
                  <div className="thumbnail-container relative" style={{ background: darkMode ? '#0f172a' : '#e2e8f0' }}>
                    {video.thumbnailURL ? (
                      <img
                        src={video.thumbnailURL}
                        alt={video.title}
                        className="thumbnail-img w-full aspect-video object-cover"
                      />
                    ) : video.videoURL ? (
                      <video
                        src={video.videoURL}
                        className="thumbnail-video w-full aspect-video object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className="w-full aspect-video flex items-center justify-center" style={{ background: darkMode ? '#0f172a' : '#e2e8f0' }}>
                        <svg className="w-16 h-16" style={{ color: darkMode ? '#475569' : '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Play button */}
                    <div className="play-overlay">
                      <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 shadow-2xl">
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>

                    {/* Category badge - Top right */}
                    {video.category && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="category-badge px-2.5 py-1 rounded-md text-xs font-semibold">
                          {video.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Meta - Below thumbnail */}
                  <div className="mt-2.5 px-1">
                    {/* Title */}
                    <h3 className="font-semibold leading-snug line-clamp-2 text-sm mb-2" style={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                      {video.title}
                    </h3>

                    {/* Author and Views in one row */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Author */}
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {(video.uploader?.fullName || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-medium truncate" style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>
                          {video.uploader?.fullName || "Unknown"}
                        </span>
                      </div>

                      {/* Views */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <svg className="w-3.5 h-3.5" style={{ color: darkMode ? '#64748b' : '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="font-medium" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>{video.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results text-center py-24 rounded-2xl border-2 border-dashed" style={{
              background: darkMode ? '#1e293b' : 'white',
              borderColor: darkMode ? '#475569' : '#cbd5e1'
            }}>
              {searchQuery || selectedCategory !== "all" ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                    No videos found
                  </h3>
                  <p className="mb-6" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    {searchQuery 
                      ? `We couldn't find any videos matching "${searchQuery}"`
                      : `No videos in the ${selectedCategory} category`}
                  </p>
                  <button
                    onClick={clearSearch}
                    className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                    No videos yet
                  </h3>
                  <p className="mb-6" style={{ color: darkMode ? '#94a3b8' : '#64748b' }}>
                    Be the first to share amazing content with the community
                  </p>
                  <button
                    onClick={() => navigate("/video/upload")}
                    className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Upload your first video
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}