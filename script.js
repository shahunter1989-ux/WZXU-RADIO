// Playlists: paste individual YouTube video links into the tracks arrays below.
// Each playlist can be renamed by changing its name value.
const WZXU_PLAYLISTS = [
  {
    name: "The One and All",
    tracks: [
      "https://www.youtube.com/watch?v=p4vQ9fl5r9o&list=RDp4vQ9fl5r9o&start_radio=1",
      "https://www.youtube.com/watch?v=xbbA-SVP0tI&list=RDxbbA-SVP0tI&start_radio=1",
      "https://www.youtube.com/watch?v=3xrEaq-6TjQ&list=RDEMBVaVLvoz-yiKKjS-hBY5Lw&index=5",
      "https://www.youtube.com/watch?v=l7uvW_GU2cs&list=RDEMBVaVLvoz-yiKKjS-hBY5Lw&index=7",
      "https://music.youtube.com/watch?v=PbMXtYDGM8c&si=a4NowzGZWzwQOt9X",
      "https://music.youtube.com/watch?v=9NXVRraVK5A&si=HecpGLiTASoHhOVi",
      "https://music.youtube.com/watch?v=rI72ieJscYE&si=qSAcp1O3McTmiGk5",
      "https://music.youtube.com/watch?v=3AzSb-InqsA&si=jhcjQOwcH1t_Q2kd",
      "https://youtu.be/Re85ukzn11E?is=SUhiPKuWu0_Zlcyw",
      "https://youtu.be/a7xa1hpb12Q?is=DbthJyxcNKXtwrro"
    ]
  }
];

// Button links: you can also edit these in index.html if you prefer.
// Brand text and tagline are commented in index.html.

let player;
let activePlaylistIndex = 0;
let currentTrackIndex = 0;
let shuffleQueue = [];
let shufflePosition = 0;
let isReady = false;
let hasAttemptedPlayback = false;

const playPauseBtn = document.getElementById("playPauseBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const trackTitle = document.getElementById("trackTitle");
const trackDetail = document.getElementById("trackDetail");
const playerState = document.getElementById("playerState");
const playlistTabs = document.getElementById("playlistTabs");
const playlistEl = document.getElementById("playlist");
const playlistCount = document.getElementById("playlistCount");
const mediaPlayer = document.getElementById("mediaPlayer");
const artworkOpenBtn = document.getElementById("artworkOpenBtn");
const artworkViewer = document.getElementById("artworkViewer");
const artworkCloseBtn = document.getElementById("artworkCloseBtn");

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
  playerState.textContent = "Now Playing";
  buildShuffleQueue(getActiveTracks().length);
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

function buildShuffleQueue(trackCount) {
  shuffleQueue = shuffleIndexes(Array.from({ length: trackCount }, (_, index) => index));
  shufflePosition = 0;
}

function shuffleIndexes(indexes) {
  const shuffled = [...indexes];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function getCurrentShuffleIndex() {
  if (!shuffleQueue.length) {
    buildShuffleQueue(getActiveTracks().length);
  }

  return shuffleQueue[shufflePosition] ?? 0;
}

function advanceShuffle() {
  const tracks = getActiveTracks();

  if (!tracks.length) {
    return 0;
  }

  shufflePosition += 1;

  if (shufflePosition >= shuffleQueue.length) {
    const previousTrackIndex = currentTrackIndex;
    buildShuffleQueue(tracks.length);

    if (tracks.length > 1 && shuffleQueue[0] === previousTrackIndex) {
      const swapIndex = shuffleQueue.findIndex((trackIndex) => trackIndex !== previousTrackIndex);
      [shuffleQueue[0], shuffleQueue[swapIndex]] = [shuffleQueue[swapIndex], shuffleQueue[0]];
    }
  }

  return getCurrentShuffleIndex();
}

function rewindShuffle() {
  const tracks = getActiveTracks();

  if (!tracks.length) {
    return 0;
  }

  if (!shuffleQueue.length) {
    buildShuffleQueue(tracks.length);
  }

  if (shufflePosition === 0) {
    shufflePosition = shuffleQueue.length - 1;
  } else {
    shufflePosition -= 1;
  }

  return getCurrentShuffleIndex();
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
  buildShuffleQueue(getActiveTracks().length);
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
    trackTitle.textContent = "Music Playing";
    trackDetail.textContent = "Add YouTube links in script.js.";

    const empty = document.createElement("li");
    empty.className = "playlist-empty";
    empty.textContent = `${playlist.name} is ready. Add YouTube links in script.js.`;
    playlistEl.appendChild(empty);
    return;
  }

  updateTrackDisplay();
}

function updateTrackDisplay() {
  const playlist = getActivePlaylist();
  const tracks = getActiveTracks();
  const activeTrack = tracks[currentTrackIndex];

  if (!activeTrack) {
    return;
  }

  trackTitle.textContent = "Music Playing";
  trackDetail.textContent = `${playlist.name} | ${tracks.length} songs loaded`;
}

function playTrack(index) {
  const tracks = getActiveTracks();
  const selectedTrack = tracks[index];

  if (!isReady || !selectedTrack) {
    return;
  }

  currentTrackIndex = index;
  hasAttemptedPlayback = true;
  player.loadVideoById(selectedTrack.videoId);
  renderActivePlaylist();
}

function playCurrentTrack() {
  const tracks = getActiveTracks();

  if (!isReady || !tracks.length) {
    playerState.textContent = "Add tracks first";
    return;
  }

  hasAttemptedPlayback = true;
  playTrack(getCurrentShuffleIndex());
}

function handlePlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    mediaPlayer.classList.add("is-playing");
    playPauseBtn.textContent = "Pause";
    playPauseBtn.setAttribute("aria-label", "Pause playlist");
    playerState.textContent = "Now Playing";
  }

  if (event.data === YT.PlayerState.PAUSED) {
    mediaPlayer.classList.remove("is-playing");
    playPauseBtn.textContent = "Play";
    playPauseBtn.setAttribute("aria-label", "Play playlist");
    playerState.textContent = "Paused";
  }

  if (event.data === YT.PlayerState.ENDED) {
    mediaPlayer.classList.remove("is-playing");
    playNextTrack();
  }

  if (event.data === YT.PlayerState.BUFFERING) {
    playerState.textContent = "Buffering";
  }
}

function handlePlayerError() {
  if (!hasAttemptedPlayback) {
    playerState.textContent = "Now Playing";
    trackTitle.textContent = "Music Playing";
    trackDetail.textContent = `${getActivePlaylist().name} | ${getActiveTracks().length} songs loaded`;
    return;
  }

  if (!getActiveTracks().length) {
    playerState.textContent = "Now Playing";
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

  playTrack(rewindShuffle());
}

function playNextTrack() {
  const tracks = getActiveTracks();

  if (!isReady || !tracks.length) {
    return;
  }

  playTrack(advanceShuffle());
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

function openArtworkViewer() {
  artworkViewer.hidden = false;
  artworkOpenBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("artwork-open");
  artworkCloseBtn.focus();
}

function closeArtworkViewer() {
  artworkViewer.hidden = true;
  artworkOpenBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("artwork-open");
  artworkOpenBtn.focus();
}

artworkOpenBtn.addEventListener("click", openArtworkViewer);
artworkCloseBtn.addEventListener("click", closeArtworkViewer);

artworkViewer.addEventListener("click", (event) => {
  if (event.target === artworkViewer) {
    closeArtworkViewer();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !artworkViewer.hidden) {
    closeArtworkViewer();
  }
});
