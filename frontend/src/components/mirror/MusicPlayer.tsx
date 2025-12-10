/// <reference types="youtube" />

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import ColorThief from "colorthief";

/* ✅ Extend Window type safely (ONLY ONCE) */
declare global {
  interface Window {
    YT: typeof YT;
  }
}

const socket = io(`http://${window.location.hostname}:5001`);

type Song = {
  id: string;
  title: string;
  thumb: string;
};

type PlayPayload = {
  query?: string;
};

type YouTubeItem = {
  id: { videoId: string };
  snippet: {
    title: string;
    thumbnails: { high: { url: string } };
  };
};

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [title, setTitle] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [bgColor, setBgColor] = useState("rgba(0,0,0,0.6)");

  const playerRef = useRef<YT.Player | null>(null);
  const playlistRef = useRef<Song[]>([]);
  const indexRef = useRef(0);

  /* ✅ Keep refs in sync */
  useEffect(() => {
    playlistRef.current = playlist;
    indexRef.current = currentIndex;
  }, [playlist, currentIndex]);

  /* ✅ Load YouTube API */
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  }, []);

  /* ✅ SOCKET VOICE COMMANDS */
  useEffect(() => {
    const onPlay = (data: PlayPayload) => {
      const query = data.query || "popular songs";
      console.log("🎵 Lumi → Play:", query);
      searchYouTube(query);
    };

    const onPause = () => pause();
    const onResume = () => resume();
    const onStop = () => stop();
    const onNext = () => next();

    socket.on("play_song", onPlay);
    socket.on("music_pause", onPause);
    socket.on("music_resume", onResume);
    socket.on("music_stop", onStop);
    socket.on("music_next", onNext);

    return () => {
      socket.off("play_song", onPlay);
      socket.off("music_pause", onPause);
      socket.off("music_resume", onResume);
      socket.off("music_stop", onStop);
      socket.off("music_next", onNext);
    };
  });

  /* ✅ YouTube Search (NO any, FULLY TYPED) */
  async function searchYouTube(query: string) {
    const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
    if (!API_KEY) return console.error("❌ VITE_YOUTUBE_API_KEY missing");

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(
        query
      )}&key=${API_KEY}`
    );

    const data: { items?: YouTubeItem[] } = await res.json();
    if (!data.items || data.items.length === 0) return;

    const list: Song[] = data.items.map(v => ({
      id: v.id.videoId,
      title: v.snippet.title,
      thumb: v.snippet.thumbnails.high.url,
    }));

    setPlaylist(list);
    setCurrentIndex(0);
    loadSong(list[0]);
  }

  function loadSong(song: Song) {
    setTitle(song.title);
    setThumbnail(song.thumb);
    extractColors(song.thumb);
    loadPlayer(song.id);
  }

  function extractColors(url: string) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;

    img.onload = () => {
      const ct = new ColorThief();
      const [r, g, b] = ct.getColor(img);
      setBgColor(`rgba(${r}, ${g}, ${b}, 0.55)`);
    };
  }

  function loadPlayer(videoId: string) {
    if (!window.YT || !window.YT.Player) {
      setTimeout(() => loadPlayer(videoId), 400);
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

  /* ✅ VOICE ACTIONS */

  function pause() {
    console.log("⏸ Lumi → Pause");
    playerRef.current?.pauseVideo();
  }

  function resume() {
    console.log("▶️ Lumi → Resume");
    playerRef.current?.playVideo();
  }

  function stop() {
    console.log("⏹ Lumi → Stop");
    playerRef.current?.stopVideo();
  }

  function next() {
    const list = playlistRef.current;
    const i = indexRef.current;

    if (i + 1 < list.length) {
      const nextIndex = i + 1;
      setCurrentIndex(nextIndex);
      loadSong(list[nextIndex]);
    }
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: bgColor,
        backdropFilter: "blur(25px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transition: "background 0.6s ease",
      }}
    >
      {/* ✅ Hidden YouTube Player */}
      <div id="yt-player" style={{ display: "none" }} />

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
            }}
            alt="Thumbnail"
          />
          <h2 style={{ color: "white", marginTop: 20, fontSize: 22 }}>
            {title}
          </h2>
        </>
      )}
    </div>
  );
}
