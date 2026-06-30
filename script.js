// Playlists: paste individual YouTube video links into the tracks arrays below.
// Each playlist can be renamed by changing its name value.
const WZXU_PLAYLISTS = [
  {
    name: "THE ONE IN ALL",
    tracks: [
      // Paste all YouTube video links here.
    ]
  }
];

// Button links: you can also edit these in index.html if you prefer.
// Brand text and tagline are commented in index.html.

let player;
let activePlaylistIndex = 0;
let currentTrackIndex = 0;
let isReady = false;

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const trackTitle = document.getElementById("trackTitle");
const trackDetail = document.getElementById("trackDetail");
const playerState = document.getElementById("playerState");
const playlistTabs = document.getElementById("playlistTabs");
const playlistEl = document.getElementById("playlist");
const playlistCount = document.getElementById("playlistCount");

function onYouTubeIframeAPIReady() {
  player = new YT.Player("youtubePlayer", {
    height: "200",
    width: "320",
    playerVars: {
      controls: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1
    },
    events: {
      onReady: handlePlayerReady,
      onStateChange: handlePlayerStateChange,
      onError: handlePlayerError
    }
  });
}

function handlePlayerReady() {
  isReady = true;
  playerState.textContent = "Ready";
  renderPlaylistTabs();
  renderActivePlaylist();
}

function getActivePlaylist() {
  return WZXU_PLAYLISTS[activePlaylistIndex] || WZXU_PLAYLISTS[0];
}

function getActiveTracks() {
  return getActivePlaylist().tracks
    .map((source, index) => ({
      source,
      videoId: parseYouTubeVideoId(source),
      title: `Track ${index + 1}`
    }))
    .filter((track) => track.videoId);
}

function parseYouTubeVideoId(source) {
  const value = source.trim();

  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    if (url.hostname.includes("youtu.be")) {
      return url.pathname.replace("/", "");
    }

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v") || "";
    }
  } catch (error) {
    // Plain YouTube video IDs land here, which is expected.
  }

  return value;
}

function renderPlaylistTabs() {
  playlistTabs.innerHTML = "";

  WZXU_PLAYLISTS.forEach((playlist, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "playlist-tab";
    button.textContent = playlist.name;
    button.setAttribute("aria-pressed", String(index === activePlaylistIndex));

    if (index === activePlaylistIndex) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => switchPlaylist(index));
    playlistTabs.appendChild(button);
  });
}

function switchPlaylist(index) {
  activePlaylistIndex = index;
  currentTrackIndex = 0;
  playPauseBtn.textContent = "Play";
  playerState.textContent = "Ready";

  if (isReady) {
    player.stopVideo();
  }

  renderPlaylistTabs();
  renderActivePlaylist();
}

function renderActivePlaylist() {
  const playlist = getActivePlaylist();
  const tracks = getActiveTracks();

  playlistEl.innerHTML = "";
  playlistCount.textContent = `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}`;

  if (!tracks.length) {
    trackTitle.textContent = `${playlist.name} is ready`;
    trackDetail.textContent = "Add YouTube links in script.js.";

    const empty = document.createElement("li");
    empty.className = "playlist-empty";
    empty.textContent = `${playlist.name} is ready. Add YouTube links in script.js.`;
    playlistEl.appendChild(empty);
    return;
  }

  tracks.forEach((track, index) => {
    const li = document.createElement("li");
    if (index === currentTrackIndex) {
      li.classList.add("active");
    }

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", `Play ${playlist.name} track ${index + 1}`);
    button.addEventListener("click", () => playTrack(index));

    const number = document.createElement("span");
    number.className = "index";
    number.textContent = String(index + 1).padStart(2, "0");

    const title = document.createElement("span");
    title.textContent = track.title;

    button.append(number, title);
    li.appendChild(button);
    playlistEl.appendChild(li);
  });

  updateTrackDisplay();
}

function updateTrackDisplay() {
  const playlist = getActivePlaylist();
  const tracks = getActiveTracks();
  const activeTrack = tracks[currentTrackIndex];

  if (!activeTrack) {
    return;
  }

  trackTitle.textContent = activeTrack.title;
  trackDetail.textContent = `${playlist.name} | Track ${currentTrackIndex + 1} of ${tracks.length}`;
}

function playTrack(index) {
  const tracks = getActiveTracks();
  const selectedTrack = tracks[index];

  if (!isReady || !selectedTrack) {
    return;
  }

  currentTrackIndex = index;
  player.loadVideoById(selectedTrack.videoId);
  renderActivePlaylist();
}

function playCurrentTrack() {
  const tracks = getActiveTracks();

  if (!isReady || !tracks.length) {
    playerState.textContent = "Add tracks first";
    return;
  }

  player.loadVideoById(tracks[currentTrackIndex].videoId);
}

function handlePlayerStateChange(event) {
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
    playNextTrack();
  }

  if (event.data === YT.PlayerState.BUFFERING) {
    playerState.textContent = "Buffering";
  }
}

function handlePlayerError() {
  if (!getActiveTracks().length) {
    playerState.textContent = "Ready";
    trackDetail.textContent = "Add YouTube links in script.js.";
    return;
  }

  playerState.textContent = "Playback unavailable";
  trackDetail.textContent = "This track may be private, removed, or blocked from embedding.";
}

function playPreviousTrack() {
  const tracks = getActiveTracks();

  if (!isReady || !tracks.length) {
    return;
  }

  currentTrackIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
  playTrack(currentTrackIndex);
}

function playNextTrack() {
  const tracks = getActiveTracks();

  if (!isReady || !tracks.length) {
    return;
  }

  currentTrackIndex = currentTrackIndex === tracks.length - 1 ? 0 : currentTrackIndex + 1;
  playTrack(currentTrackIndex);
}

playPauseBtn.addEventListener("click", () => {
  if (!isReady) {
    return;
  }

  const tracks = getActiveTracks();

  if (!tracks.length) {
    playerState.textContent = "Add tracks first";
    return;
  }

  const state = player.getPlayerState();

  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else if (state === YT.PlayerState.PAUSED) {
    player.playVideo();
  } else {
    playCurrentTrack();
  }
});

prevBtn.addEventListener("click", playPreviousTrack);
nextBtn.addEventListener("click", playNextTrack);
