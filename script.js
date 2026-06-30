// Playlist ID: replace this with your public YouTube playlist ID.
// You can also paste a single YouTube video URL or video ID for a one-track preview.
const YOUTUBE_PLAYLIST_ID = "https://youtu.be/S0KAAsanVms?si=h8_lhfqNMIPThDN5";

// Button links: you can also edit these in index.html if you prefer.
// Brand text and tagline are commented in index.html.

let player;
let playlistItems = [];
let currentIndex = 0;
let isReady = false;

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const trackTitle = document.getElementById("trackTitle");
const trackDetail = document.getElementById("trackDetail");
const playerState = document.getElementById("playerState");
const playlistEl = document.getElementById("playlist");
const playlistCount = document.getElementById("playlistCount");
const youtubeSource = parseYouTubeSource(YOUTUBE_PLAYLIST_ID);

function onYouTubeIframeAPIReady() {
  const playerOptions = {
    controls: 0,
    modestbranding: 1,
    rel: 0,
    playsinline: 1
  };

  if (youtubeSource.type === "playlist") {
    playerOptions.listType = "playlist";
    playerOptions.list = youtubeSource.id;
  }

  player = new YT.Player("youtubePlayer", {
    height: "200",
    width: "320",
    videoId: youtubeSource.type === "video" ? youtubeSource.id : undefined,
    playerVars: playerOptions,
    events: {
      onReady: handlePlayerReady,
      onStateChange: handlePlayerStateChange,
      onError: handlePlayerError
    }
  });
}

function handlePlayerReady() {
  isReady = true;

  if (!youtubeSource.id) {
    playerState.textContent = "YouTube source needed";
    trackTitle.textContent = "Paste your YouTube playlist ID";
    trackDetail.textContent = "Open script.js and replace the YouTube source variable.";
    return;
  }

  playerState.textContent = "Ready";
  refreshPlaylist();
}

function parseYouTubeSource(source) {
  const value = source.trim();

  if (!value || value === "PASTE_PLAYLIST_ID_HERE") {
    return { type: "empty", id: "" };
  }

  try {
    const url = new URL(value);
    const playlistId = url.searchParams.get("list");
    const videoId = url.hostname.includes("youtu.be")
      ? url.pathname.replace("/", "")
      : url.searchParams.get("v");

    if (playlistId) {
      return { type: "playlist", id: playlistId };
    }

    if (videoId) {
      return { type: "video", id: videoId };
    }
  } catch (error) {
    // Plain IDs land here, which is expected.
  }

  if (value.startsWith("PL") || value.startsWith("OLAK5uy_") || value.startsWith("UU")) {
    return { type: "playlist", id: value };
  }

  return { type: "video", id: value };
}

function refreshPlaylist() {
  if (youtubeSource.type === "video") {
    playlistItems = [{
      videoId: youtubeSource.id,
      title: "WZXU RADIO Preview"
    }];
    currentIndex = 0;
    renderPlaylist();
    updateTrackDisplay();
    return;
  }

  const rawPlaylist = player.getPlaylist() || [];
  playlistItems = rawPlaylist.map((videoId, index) => ({
    videoId,
    title: `Playlist Track ${index + 1}`
  }));

  currentIndex = player.getPlaylistIndex() || 0;
  renderPlaylist();
  updateTrackDisplay();
}

function handlePlayerStateChange(event) {
  refreshPlaylist();

  if (event.data === YT.PlayerState.PLAYING) {
    playPauseBtn.textContent = "Pause";
    playPauseBtn.setAttribute("aria-label", "Pause playlist");
    playerState.textContent = "Playing";
  }

  if (event.data === YT.PlayerState.PAUSED) {
    playPauseBtn.textContent = "Play";
    playPauseBtn.setAttribute("aria-label", "Play playlist");
    playerState.textContent = "Paused";
  }

  if (event.data === YT.PlayerState.ENDED) {
    playPauseBtn.textContent = "Play";
    playerState.textContent = "Track ended";
  }

  if (event.data === YT.PlayerState.BUFFERING) {
    playerState.textContent = "Buffering";
  }
}

function handlePlayerError() {
  playerState.textContent = "Playback unavailable";
  trackDetail.textContent = "This track may be private, removed, or blocked from embedding.";
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  playlistCount.textContent = `${playlistItems.length} ${playlistItems.length === 1 ? "track" : "tracks"}`;

  if (!playlistItems.length) {
    const empty = document.createElement("li");
    empty.className = "playlist-empty";
    empty.textContent = "No public playlist tracks found yet.";
    playlistEl.appendChild(empty);
    return;
  }

  playlistItems.forEach((item, index) => {
    const li = document.createElement("li");
    if (index === currentIndex) {
      li.classList.add("active");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Play track ${index + 1}`);
    button.addEventListener("click", () => playTrack(index));

    const number = document.createElement("span");
    number.className = "index";
    number.textContent = String(index + 1).padStart(2, "0");

    const title = document.createElement("span");
    title.textContent = item.title;

    button.append(number, title);
    li.appendChild(button);
    playlistEl.appendChild(li);
  });
}

function updateTrackDisplay() {
  if (!playlistItems.length) {
    return;
  }

  const activeTrack = playlistItems[currentIndex] || playlistItems[0];
  trackTitle.textContent = activeTrack.title;
  trackDetail.textContent = `Track ${currentIndex + 1} of ${playlistItems.length}`;
}

function playTrack(index) {
  if (!isReady || !playlistItems.length) {
    return;
  }

  currentIndex = index;

  if (youtubeSource.type === "video") {
    player.playVideo();
  } else {
    player.playVideoAt(index);
  }

  renderPlaylist();
  updateTrackDisplay();
}

playPauseBtn.addEventListener("click", () => {
  if (!isReady || !youtubeSource.id) {
    return;
  }

  const state = player.getPlayerState();

  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
});

prevBtn.addEventListener("click", () => {
  if (!isReady || !playlistItems.length) {
    return;
  }

  if (youtubeSource.type === "video") {
    player.seekTo(0);
    return;
  }

  player.previousVideo();
});

nextBtn.addEventListener("click", () => {
  if (!isReady || !playlistItems.length) {
    return;
  }

  if (youtubeSource.type === "video") {
    player.seekTo(0);
    return;
  }

  player.nextVideo();
});
