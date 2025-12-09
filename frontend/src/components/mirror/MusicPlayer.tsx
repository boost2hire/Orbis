import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ColorThief from "colorthief";

const socket = io(`http://${window.location.hostname}:5001`)


export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [bgColor, setBgColor] = useState("rgba(0,0,0,0.6)");

  const playerRef = useRef(null);

  // Load YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  // Handle socket events from backend
  useEffect(() => {
    socket.on("play_song", ({ query }) => {
      console.log("Voice → Play:", query);
      searchYouTube(query);
    });

    socket.on("music_pause", () => pause());
    socket.on("music_resume", () => resume());
    socket.on("music_stop", () => stop());
    socket.on("music_next", () => next());
    socket.on("music_prev", () => prev());
  }, [socket, searchYouTube, next, prev]);

  // Search YouTube for playlist
  async function searchYouTube(query) {
    const API_KEY = process.env.REACT_APP_YT_KEY;

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
        query
      )}&key=${API_KEY}`
    );

    const data = await res.json();
    if (!data.items.length) return;

    const list = data.items.map((v) => ({
      id: v.id.videoId,
      title: v.snippet.title,
      thumb: v.snippet.thumbnails.high.url,
    }));

    setPlaylist(list);
    setCurrentIndex(0);

    loadSong(list[0]);
  }

  // Load selected track
  function loadSong(song) {
    setTitle(song.title);
    setThumbnail(song.thumb);
    extractColors(song.thumb);
    loadPlayer(song.id);
  }

  // Extract background color from thumbnail
  function extractColors(url) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const ct = new ColorThief();
      const [r, g, b] = ct.getColor(img);
      setBgColor(`rgba(${r}, ${g}, ${b}, 0.55)`);
    };
  }

  // Load or update YouTube player
  function loadPlayer(videoId) {
    if (!window.YT || !window.YT.Player) {
      setTimeout(() => loadPlayer(videoId), 500);
      return;
    }

    if (!playerRef.current) {
      playerRef.current = new window.YT.Player("yt-player", {
        height: "0",
        width: "0",
        videoId,
        playerVars: { autoplay: 1 },
      });
    } else {
      playerRef.current.loadVideoById(videoId);
    }
  }

  // Voice Control Functions
  function pause() {
    console.log("Pausing music");
    playerRef.current?.pauseVideo();
  }

  function resume() {
    console.log("Resuming music");
    playerRef.current?.playVideo();
  }

  function stop() {
    console.log("Stopping music");
    playerRef.current?.stopVideo();
  }

  function next() {
    if (currentIndex + 1 < playlist.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      loadSong(playlist[nextIndex]);
    }
  }

  function prev() {
    if (currentIndex - 1 >= 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      loadSong(playlist[prevIndex]);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: bgColor,
        backdropFilter: "blur(25px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transition: "background 0.6s ease",
      }}
    >
      {/* Hidden YouTube Player */}
      <div id="yt-player" style={{ display: "none" }}></div>

      {thumbnail && (
        <>
          <img
            src={thumbnail}
            style={{
              width: 260,
              height: 260,
              objectFit: "cover",
              borderRadius: 20,
              boxShadow: "0px 0px 40px rgba(0,0,0,0.5)",
              zIndex: 2,
              transition: "0.3s ease",
            }}
            alt="Thumbnail"
          />
          <h2
            style={{
              color: "white",
              marginTop: 20,
              fontSize: 22,
              width: "80%",
              textAlign: "center",
            }}
          >
            {title}
          </h2>
        </>
      )}
    </div>
  );
}
