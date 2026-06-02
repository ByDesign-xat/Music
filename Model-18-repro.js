// ===============================
// 🎧 INICIALIZACIÓN GLOBAL Y ESTADOS
// ===============================
let trackData = [];
let currentTrack = null;
let modoActual = "local"; // por defecto
let audio = document.getElementById("player");
let gestureDetected = false;
let repeatMode = "none";
let isShuffling = false;
let trackHistory = [];
let radioIntervalId = null; 
let lastTrackTitle = "";

// ===============================
// 🎯 ELEMENTOS CLAVE DEL DOM
// ===============================
const playPauseBtn = document.getElementById("btn-play-pause");
const nextBtn = document.getElementById("next-button");
const prevBtn = document.getElementById("prev-button");
const shuffleBtn = document.getElementById("shuffle-button");
const repeatBtn = document.getElementById("repeat-button");
const musicBtn = document.getElementById("music-btn");

const iconPlay = playPauseBtn?.querySelector(".icon-play");
const iconPause = playPauseBtn?.querySelector(".icon-pause");

const discImg = document.querySelector(".disc-img");
const currentTrackName = document.getElementById("current-track-name");
const currentArtistName = document.getElementById("current-artist-name");
const metaTrack = document.getElementById("meta-track");

const modalTracks = document.getElementById("modal-tracks");
const menuBtn = document.getElementById("btn-menu-tracks");
const closeModalBtn = document.getElementById("close-modal");
const trackList = document.querySelector(".track-list"); 
const currentTrackNameModal = document.getElementById("current-track-name");


// ===============================
// 🖼️ CARÁTULAS
// ===============================
function validarCaratula(url) {
    if (!discImg) return;
    const img = new Image();
    img.onload = () => {
        discImg.src = url;
        discImg.classList.add("rotating");
    };
    img.onerror = () => {
        discImg.src = "https://xatimg.com/image/OpwOSS8vdSd3.png";
        discImg.classList.add("rotating");
    };
    img.src = url;
}

function actualizarCaratula(track) {
    if (!discImg) return;
    if (modoActual === "local") {
        const currentTrackObj = track || (currentTrack !== null ? trackData[currentTrack] : null);
        const cover = currentTrackObj?.cover || "https://xatimg.com/image/OpwOSS8vdSd3.png";
        validarCaratula(cover);
    } else {
        discImg.src = "https://xatimg.com/image/OpwOSS8vdSd3.png";
        discImg.classList.add("rotating");
    }
}

// ===============================
// 📦 CARGA DE PISTAS (LOCAL)
// ===============================
function cargarTracksDesdeJSON() {
    fetch("https://bydesign-xat.github.io/Music/Model-18-repro10.json")
        .then(res => res.json())
        .then(data => {
            trackData = data;
            currentTrack = 0;
            activarReproduccion(0, "initial-load"); 
            generarListaModal();
        });
}

// ===============================
// ▶️ REPRODUCCIÓN LOCAL
// ===============================
function activarReproduccion(index, modo = "manual") {
  if (modoActual !== "local" || index < 0 || index >= trackData.length) return;
  const track = trackData[index];

  // Usamos dropbox_url como fuente principal
  const url = track.url;
  if (!url) {
    console.warn("⚠️ Pista sin URL válida:", track);
    return;
  }

  currentTrack = index;

  // Metadatos visibles en cabecera
  if (currentTrackName) currentTrackName.textContent = track.title || "Untitled";
  if (currentArtistName) currentArtistName.textContent = track.artist || "Unknown artist";
  if (metaTrack) {
    metaTrack.textContent = `${track.title || "Untitled"} — ${track.artist || "Unknown artist"} | ${track.album || "Álbum desconocido"} | ${track.genero || "Género"} | ⏱ ${track.duracion || "--:--"}`;
  }

  // Actualizar marquesina con todos los ingredientes
  actualizarMetadata(track);

  // Cargar audio
  audio.src = url;
  audio.load();
  actualizarCaratula(track);

  // Reproducir si ya hubo gesto humano
  if (gestureDetected) {
    audio.muted = false;
    audio.play().then(() => {
      iconPlay?.classList.add("hidden");
      iconPause?.classList.remove("hidden");
      actualizarModalActualTrack?.();
      console.log(`▶️ Reproduciendo pista local (${modo}): ${track.title}`);
    }).catch(err => console.error("❌ Error de reproducción local:", err));
  }
}

// ===============================
// 🪟 FUNCIÓN DE GENERACIÓN Y MANEJO DEL MODAL (DUAL: LOCAL / RADIO)
// ===============================
function generarListaModal() {
  if (!trackList) return;

  // Limpieza siempre al abrir
  trackList.innerHTML = "";

  // ----- MODO RADIO: mostrar historial y NO playlist local -----
  if (modoActual === "radio") {
    // Cabecera con lo último conocido (si existe)
    if (currentTrackNameModal) {
      const titulo = currentTrackName?.textContent || "Loading...";
      const artista = currentArtistName?.textContent || "Loading...";
      currentTrackNameModal.textContent = `${titulo} — ${artista}`;
    }

    if (trackHistory.length === 0) {
      const li = document.createElement("li");
      li.textContent = "Waiting for the first track update...";
      li.classList.add("radio-history-item");
      trackList.appendChild(li);
      return;
    }

    // Generar historial con hora | artista - título
    trackHistory.forEach(entry => {
      const li = document.createElement("li");
      li.textContent = `${entry.time} | ${entry.artist} - ${entry.title}`;
      li.classList.add("radio-history-item");
      trackList.appendChild(li);
    });

    return; // clave: evitar que continúe a la lógica local
  }

  // ----- MODO LOCAL: playlist clicable y cabecera con Título — Artista -----
  if (currentTrackNameModal) {
    if (currentTrack !== null && trackData[currentTrack]) {
      const t = trackData[currentTrack];
      currentTrackNameModal.textContent = `${t.title} — ${t.artist || "Artista desconocido"}`;
    } else {
      currentTrackNameModal.textContent = "Only the greatest hits";
    }
  }

  if (trackData.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No tracks have been loaded yet...";
    trackList.appendChild(li);
    return;
  }

  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${track.title} — ${track.artist || "Artista desconocido"}`;
    li.setAttribute("data-index", index);
    li.classList.add("modal-track-item");

    li.addEventListener("click", () => {
      activarReproduccion(index, "modal-click");
      modalTracks.classList.add("hidden");
    });

    if (currentTrack === index) li.classList.add("active-track");
    trackList.appendChild(li);
  });
}

// ===============================
// 📻 ACTIVAR MODO RADIO
// ===============================
function activarModoRadio() {
  modoActual = "radio";
  detenerActualizacionRadio();

  // Mensajes iniciales en cabecera
  if (currentArtistName) currentArtistName.textContent = "Loading...";
  if (currentTrackName) currentTrackName.textContent = "Loading...";

  // Carátula inicial: Plato
  if (discImg) {
    discImg.src = "https://xatimg.com/image/OpwOSS8vdSd3.png";
    discImg.classList.add("rotating");
  }

  // Limpieza inmediata de la lista local en el modal
  if (trackList) trackList.innerHTML = "";
  if (currentTrackNameModal) currentTrackNameModal.textContent = "Historial de Radio (Últimas 20)";

  // Configuración del stream
  audio.pause();
  audio.src = "https://radio.sonicpanel.ro:8118/stream?icy=http";
  audio.load();
  audio.muted = !gestureDetected;

  audio.play().then(() => {
    iconPlay?.classList.add("hidden");
    iconPause?.classList.remove("hidden");
  }).catch(err => {
    console.warn("🔒 Error al iniciar Radio automáticamente en transición:", err);
    iconPause?.classList.add("hidden");
    iconPlay?.classList.remove("hidden"); 
  });

  iniciarActualizacionRadio();

  // 🚫 Desactivar botones que no aplican en modo radio
  nextBtn?.setAttribute("disabled", true);
  prevBtn?.setAttribute("disabled", true);
  shuffleBtn?.setAttribute("disabled", true);
  repeatBtn?.setAttribute("disabled", true);
}

// ===============================
// 🎶 ACTIVAR MODO LOCAL
// ===============================
function activarModoLocal() {
  modoActual = "local";
  detenerActualizacionRadio();
  detenerContadorRadioescuchas();

  audio.pause();
  audio.muted = !gestureDetected;
  iconPause?.classList.add("hidden");
  iconPlay?.classList.remove("hidden");

  cargarTracksDesdeJSON();

  // ✅ Reactivar botones en modo local
  nextBtn?.removeAttribute("disabled");
  prevBtn?.removeAttribute("disabled");
  shuffleBtn?.removeAttribute("disabled");
  repeatBtn?.removeAttribute("disabled");
}

// ===============================
// 🔄 ALTERNANCIA DE MODOS (BOTÓN MUSIC)
// ===============================
if (musicBtn) {
  musicBtn.addEventListener("click", () => {
    if (!gestureDetected) { 
      gestureDetected = true; 
      audio.muted = false; 
    }

    if (modoActual === "radio") {
      activarModoLocal();
    } else {
      activarModoRadio();
    }

    // Indicadores visuales
    const metaDiv = document.getElementById("track-metadata");
    if (metaDiv) {
      metaDiv.innerHTML = `<span>${modoActual === "radio" ? "🔊 Radio active mode" : "🎶 Local active mode"}</span>`;
    }
    musicBtn.style.backgroundColor = (modoActual === "radio") ? "#8e44ad" : "#3688ff";
  });
}

// ===============================
// 🧭 INICIALIZACIÓN Y GESTOS
// ===============================
document.addEventListener("click", () => {
  if (!gestureDetected) {
    gestureDetected = true;
    audio.muted = false;

    if (audio.src && audio.paused) {
      audio.play().then(() => {
        iconPlay?.classList.add("hidden");
        iconPause?.classList.remove("hidden");
        discImg?.classList.add("rotating");
        console.log("🟢 Autoplay desbloqueado tras gesto humano");
      }).catch(err => console.warn("⚠️ Error al iniciar reproducción tras gesto:", err));
    }
  }
}, { once: true });

document.addEventListener("DOMContentLoaded", () => {
  inicializarReproductor();
  inicializarVolumen?.();
  console.log("✅ Reproductor inicializado en modo:", modoActual);
});

// ===============================
// 🧭 INICIALIZACIÓN DEL REPRODUCTOR
// ===============================
function inicializarReproductor() {
  if (modoActual === "radio") {
    activarModoRadio();
  } else {
    cargarTracksDesdeJSON();
  }
  console.log("✅ inicializarReproductor ejecutado. Modo:", modoActual);
}

// ===============================
// 🛑 LIMPIEZA DE INTERVALOS DE RADIO
// ===============================
function detenerActualizacionRadio() {
  if (radioIntervalId !== null) {
    clearInterval(radioIntervalId);
    radioIntervalId = null;
  }
}
function detenerContadorRadioescuchas() {
  if (typeof contadorIntervalId !== "undefined" && contadorIntervalId !== null) {
    clearInterval(contadorIntervalId);
    contadorIntervalId = null;
  }
  // No hay contadorElemento en tu HTML, así que eliminamos esa línea
}

// ===============================
// 📻 ACTUALIZACIÓN DE METADATOS RADIO (CON CARÁTULAS)
// ===============================
function iniciarActualizacionRadio() {
  detenerActualizacionRadio();

  const radioUrl = "https://radio.sonicpanel.ro:8118/currentsong?sid=1";
  const proxyUrl =
    `https://api.allorigins.win/raw?url=${encodeURIComponent(radioUrl)}`;

  async function actualizar() {
    try {

      const res = await fetch(proxyUrl, {
        cache: "no-cache"
      });

      const raw = (await res.text()).trim();

      console.log("RADIO:", raw);

      const parts = raw.split(/ - | – /);

      const artist =
        parts.length >= 2
          ? parts[0].trim()
          : "Unknown Artist";

      const title =
        parts.length >= 2
          ? parts.slice(1).join(" - ").trim()
          : raw;

      const time = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit"
      });

      const metaDiv =
        document.getElementById("track-metadata");

      if (metaDiv) {
        metaDiv.innerHTML =
          `<span>${artist} — ${title} — ${time}</span>`;
      }

      if (currentArtistName) {
        currentArtistName.textContent = artist;
      }

      if (currentTrackName) {
        currentTrackName.textContent = title;
      }

      if (artist && title) {
        obtenerCaratulaDesdeiTunes(artist, title);
      }

    } catch (err) {
      console.error("Radio metadata error:", err);
    }
  }

  actualizar();
  radioIntervalId = setInterval(actualizar, 5000);
}

// ===============================
// 🖼️ OBTENER CARÁTULA DESDE iTunes (modo radio)
// ===============================
function obtenerCaratulaDesdeiTunes(artist, title) {
  if (!discImg) return;

  const query = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${query}&media=music&limit=1`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      let cover = "https://xatimg.com/image/OpwOSS8vdSd3.png"; // fallback
      if (data.results && data.results.length > 0) {
        // iTunes devuelve artworkUrl100 → lo ampliamos a 400x400
        cover = data.results[0].artworkUrl100.replace("100x100", "400x400");
      }
      discImg.src = cover;
      discImg.classList.add("rotating");
    })
    .catch(err => {
      console.warn("⚠️ Error obteniendo carátula desde iTunes:", err);
      discImg.src = "https://xatimg.com/image/OpwOSS8vdSd3.png";
      discImg.classList.add("rotating");
    });
}

// ===============================
// 🎛️ BOTONERA - ➡️ NEXT / ⬅️ PREV / 🔁 REPEAT / 🔀 SHUFFLE
// ===============================
if (playPauseBtn) {
  playPauseBtn.addEventListener("click", () => {
    if (!gestureDetected) { gestureDetected = true; audio.muted = false; }

    if (audio.paused || audio.ended) {
      audio.play().then(() => {
        iconPlay?.classList.add("hidden");
        iconPause?.classList.remove("hidden");
        if (currentTrack !== null && trackData[currentTrack]) {
          actualizarCaratula(trackData[currentTrack], "reproduciendo");
        }
      }).catch(err => console.warn("⚠️ Error al reanudar:", err));
    } else {
      audio.pause();
      iconPause?.classList.add("hidden");
      iconPlay?.classList.remove("hidden");
      if (currentTrack !== null && trackData[currentTrack]) {
        actualizarCaratula(trackData[currentTrack], "pausado");
      }
    }
  });
}

// ===============================
// ⏭ BOTÓN FORWARD — 1 clic: siguiente pista | 2 clics: +10s
// ===============================
let forwardClickCount = 0;
let forwardClickTimer = null;

nextBtn.addEventListener("click", () => {
  forwardClickCount++;

  if (forwardClickCount === 1) {
    forwardClickTimer = setTimeout(() => {
      const next = (currentTrack + 1) % trackData.length;
      activarReproduccion(next, "next");
      forwardClickCount = 0;
    }, 300); // Tiempo de doble clic
  }

  if (forwardClickCount === 2) {
    clearTimeout(forwardClickTimer);
    forwardClickCount = 0;

    if (!audio.src || currentTrack === null) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    console.log("⏩ Avance de 10 segundos");
  }
});

// ===============================
// ⏮ BOTÓN REWIND — 1 clic: pista anterior | 2 clics: -10s
// ===============================
let rewindClickCount = 0;
let rewindClickTimer = null;

prevBtn.addEventListener("click", () => {
  rewindClickCount++;

  if (rewindClickCount === 1) {
    rewindClickTimer = setTimeout(() => {
      const prev = (currentTrack - 1 + trackData.length) % trackData.length;
      activarReproduccion(prev, "prev");
      rewindClickCount = 0;
    }, 300);
  }

  if (rewindClickCount === 2) {
    clearTimeout(rewindClickTimer);
    rewindClickCount = 0;

    if (!audio.src || currentTrack === null) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    console.log("⏪ Retroceso de 10 segundos");
  }
});

// ===============================
// ⏮ BOTÓN REPEAT — 1 clic: repetir pista | 2 clics: desactivar
// ===============================
let repeatClickCount = 0;
let repeatClickTimer = null;

repeatBtn.addEventListener("click", () => {
  repeatClickCount++;

  if (repeatClickCount === 1) {
    repeatClickTimer = setTimeout(() => {
      repeatMode = "track";
      repeatBtn.style.backgroundColor = "#8e44ad"; // 💜 Morado para repetir pista
      console.log("🔂 Modo: repetir pista actual");
      repeatClickCount = 0;
    }, 300);
  }

  if (repeatClickCount === 2) {
    clearTimeout(repeatClickTimer);
    repeatMode = "none"; // 🔴 Desactivado
    repeatBtn.style.backgroundColor = ""; // 🔄 Sin color
    console.log("⏹ Modo repetir desactivado");
    repeatClickCount = 0;
  }
});

// ===============================
// 🔀 BOTÓN SHUFFLE — 1 clic: activar shuffle | 2 clics: desactivar
// ===============================
let shuffleActive = false;
let shuffleClickCount = 0;
let shuffleClickTimer = null;

shuffleBtn.addEventListener("click", () => {
  shuffleClickCount++;

  if (shuffleClickCount === 1) {
    shuffleClickTimer = setTimeout(() => {
      shuffleActive = true;
      trackData.sort(() => Math.random() - 0.5);
      generarListaModal();
      activarReproduccion(0, "shuffle");
      shuffleBtn.style.backgroundColor = "#3498db"; // 💙 Azul para modo shuffle
      console.log("🔀 Lista mezclada (shuffle activado)");
      shuffleClickCount = 0;
    }, 300);
  }

  if (shuffleClickCount === 2) {
    clearTimeout(shuffleClickTimer);
    shuffleActive = false;
    shuffleBtn.style.backgroundColor = ""; // 🔄 Sin color
    console.log("⏹ Shuffle desactivado");
    shuffleClickCount = 0;
  }
});

// =============================
// BOTON MENú
// ===============================
menuBtn.addEventListener("click", () => modalTracks.classList.remove("hidden"));
closeModalBtn.addEventListener("click", () => modalTracks.classList.add("hidden"));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modalTracks.classList.add("hidden");
});

// ===============================
// 🎶 METADATOS EN MARQUESINA (LOCAL)
// ===============================
function actualizarMetadata(track) {
  const metadataDiv = document.getElementById("track-metadata");
  if (!metadataDiv) return;

  if (!track) {
    metadataDiv.innerHTML = "<span>Solo los mejores éxitos</span>";
    return;
  }

  // ✨ Ingredientes completos: artista, título, álbum, género y duración
  const texto = `${track.artist} — ${track.title} | ${track.album} | ${track.genero} | ⏱ ${track.duracion}`;
  metadataDiv.innerHTML = `<span>${texto}</span>`;
}

// ===============================
// 🌌 PARTÍCULAS
// ===============================
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const container = document.querySelector(".bg-water");

// 🔁 Ajustar tamaño del canvas al contenedor
function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🔮 Clase de partícula individual
class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 5 + 1;
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 3 - 1.5;
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.size > 0.2) this.size -= 0.1;
    if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
  }

  draw() {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

const particlesArray = [];

// 🔁 Manejo de partículas activas
function handleParticles() {
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
    particlesArray[i].draw();
    if (particlesArray[i].size <= 0.2) {
      particlesArray.splice(i, 1);
      i--;
    }
  }
}

// ✨ Generar nuevas partículas
function createParticles() {
  if (particlesArray.length < 100) {
    particlesArray.push(new Particle());
  }
}

// 🔄 Animación continua
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleParticles();
  createParticles();
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ===============================
// 🍰 MENSAJE PERSONALIZADO AL HACER CLIC DERECHO
// ===============================
document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  const msg = document.getElementById("custom-message");
  if (!msg) return;
  msg.classList.add("show");
  setTimeout(() => msg.classList.remove("show"), 2000);

});

audio.addEventListener("ended", () => {

  if (modoActual !== "local") return;

  // repetă aceeași piesă
  if (repeatMode === "track") {
    activarReproduccion(currentTrack, "repeat");
    return;
  }

  // următoarea piesă
  let nextTrack = currentTrack + 1;

  // dacă a ajuns la finalul playlistului
  if (nextTrack >= trackData.length) {
    nextTrack = 0;
  }

  activarReproduccion(nextTrack, "auto-next");
});