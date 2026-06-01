// ===============================
// 🎧 SISTEMA DE REPRODUCCIÓN COMPLETO
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  // 🎯 Elementos clave del sistema
  const audio = document.getElementById("audio-player");
  const playPauseBtn = document.getElementById("btn-play-pause");
  const iconPlay = playPauseBtn.querySelector(".icon-play");
  const iconPause = playPauseBtn.querySelector(".icon-pause");
  const nextBtn = document.getElementById("next-button");
  const prevBtn = document.getElementById("prev-button");
  const shuffleBtn = document.getElementById("shuffle-button");

  // ===============================
  // SISTEMA MODAL
  // ===============================
  const trackList = document.querySelector(".track-list");
  const currentTrackName = document.getElementById("current-track-name");
  const modalTrackName = document.getElementById("modal-track-name");
  const discImg = document.querySelector(".disc-img");
  const nameDisplay = document.querySelector(".repro-name");
  const idDisplay = document.querySelector(".repro-id");
  const modalTracks = document.getElementById("modal-tracks");

  // 📦 Estado del sistema
  let trackData = [];
  let currentTrack = null;
  let autoplayEnabled = false; // ✅ Controla si debe avanzar automáticamente
    
trackData.forEach(track => {
  if (track.cover) {
    const preload = new Image();
    preload.src = track.cover;
  }
});

const preloadBase = new Image();
preloadBase.src = "assets/covers/Cover-Vinyl-Disc-FX1.png";

const preloadPlato = new Image();
preloadPlato.src = "assets/covers/Plato.png";

  // ===============================
  // 🎼 Cargar metadata y generar lista ✓
  // ===============================
  fetch("https://iraked.github.io/ExtasisRadio/Repro10.json")
    .then(res => res.json())
    .then(data => {
      trackData = data;
      if (!Array.isArray(trackData) || trackData.length === 0) {
        console.warn("❌ No se encontraron pistas");
        return;
      }

      trackList.innerHTML = "";

      trackData.forEach((track, index) => {
        const li = document.createElement("li");
        li.textContent = track.name;
        li.classList.add("modal-track-item");
        li.setAttribute("data-index", index);

        li.addEventListener("click", () => {
          playTrack(index, false);
          modalTracks.classList.add("hidden");
        });

        trackList.appendChild(li);
      });

      playTrack(0, false);
    });

// ===============================
// 🍐 Restaurar Plato cuando no hay pista activa
// ===============================
function restaurarPlato() {
  discImg.classList.remove("rotating"); // ✅ Detener animación
  discImg.src = "assets/covers/Plato.png"; // ✅ Mostrar Plato
}

// ===============================
// 🔁 BLOQUE 2: EVENTOS DE REPRODUCCIÓN Y PAUSA
// ===============================
//   - Reproduce automáticamente según el modo activo o si autoplayEnabled está activo.
//   - Actualiza portada y animación al avanzar o repetir.
//   - Muestra disco base al pausar.
// ===============================

// 🎯 Evento al terminar la pista
audio.addEventListener("ended", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");

  if (repeatMode === "track") {
    // 🔂 Repetir la misma pista
    audio.currentTime = 0;
    audio.play().then(() => {
      const track = trackData[currentTrack];
      if (track && track.cover) {
        discImg.src = track.cover;
        discImg.classList.add("rotating");
        actualizarEstadoCaratula();
      }
      console.log("🔂 Repetición automática de pista");
    }).catch(err => {
      console.warn("❌ Error al repetir pista:", err);
    });
    return;
  }

  if (repeatMode === "list") {
    // 🔁 Avanzar al siguiente track
    currentTrack = (currentTrack + 1) % trackData.length;
    const track = trackData[currentTrack];

    if (!track || !track.url) {
      console.warn("❌ Track inválido. Deteniendo reproducción.");
      discImg.src = "assets/covers/Plato.png";
      discImg.classList.add("rotating");
      actualizarEstadoCaratula();
      return;
    }

    currentTrackName.textContent = track.name;
    audio.src = track.url;

    audio.play().then(() => {
      discImg.src = track.cover || "assets/covers/Cover-Vinyl-Disc-FX1.png";
      discImg.classList.add("rotating");
      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");
      actualizarEstadoCaratula();
      console.log("🔁 Avance automático en lista");
    }).catch(err => {
      console.warn("❌ Error al reproducir siguiente pista:", err);
    });
    return;
  }

  if (autoplayEnabled) {
    // ▶️ Reproducción continua sin modo activo
    const nextIndex = currentTrack + 1;
    const nextTrack = trackData[nextIndex];

    if (!nextTrack || !nextTrack.url) {
      console.log("⏹ Fin de pista sin repetición");
      autoplayEnabled = false;
      discImg.src = "assets/covers/Plato.png";
      discImg.classList.add("rotating");
      actualizarEstadoCaratula();
      return;
    }

    currentTrack = nextIndex;
    currentTrackName.textContent = nextTrack.name;
    audio.src = nextTrack.url;

    audio.play().then(() => {
      discImg.src = nextTrack.cover || "assets/covers/Cover-Vinyl-Disc-FX1.png";
      discImg.classList.add("rotating");
      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");
      actualizarEstadoCaratula();
      console.log("▶️ Reproducción continua activada");
    }).catch(err => {
      console.warn("❌ Error al reproducir siguiente pista:", err);
      autoplayEnabled = false;
    });
    return;
  }

  // ⏹ Sin modo y sin autoplayEnabled
  discImg.src = "assets/covers/Plato.png";
  discImg.classList.add("rotating");
  actualizarEstadoCaratula();
  console.log("⏹ Fin de pista sin repetición");
});

// ⏸ Evento al pausar manualmente
audio.addEventListener("pause", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");

  discImg.src = "assets/covers/Cover-Vinyl-Disc-FX1.png";
  discImg.classList.remove("rotating");
  actualizarEstadoCaratula();
});
    
// ===============================
// 🎛️ CONTROL DE GIRO DE CARÁTULA SEGÚN ESTADO REAL DE REPRODUCCIÓN
// ===============================
//   - La carátula gira solo cuando el audio está reproduciéndose.
//   - Se detiene cuando el audio está en pausa.
//   - En reposo (sin reproducción iniciada), se muestra Plato.
//   - Este bloque actualiza dinámicamente la clase CSS del elemento .disc-img
//   - Se ejecuta dentro de los eventos 'play', 'pause' y 'DOMContentLoaded'.
// ===============================

// ✅ Función que actualiza el estado visual de la carátula
function actualizarEstadoCaratula() {
  const discImg = document.querySelector('.disc-img');
  if (!discImg) return;

  const hasTrack = trackData[currentTrack] && trackData[currentTrack].cover;
  const isPlaying = !audio.paused && audio.currentTime > 0;
  const isPaused = audio.paused && audio.currentTime > 0;
  const isIdle = audio.currentTime === 0;

  if (isPlaying && hasTrack) {
    // 🔄 Reproducción activa: portada del track + animación
    discImg.classList.add("rotating");
    discImg.src = trackData[currentTrack].cover;
  } else if (isPaused) {
    // ⏸ Pausa: disco detenido sin animación
    discImg.classList.remove("rotating");
    discImg.src = "assets/covers/Cover-Vinyl-Disc-FX1.png";
  } else if (isIdle) {
    // 💤 Reposo: sin reproducción ni pista activa
    discImg.classList.remove("rotating");
    discImg.src = "assets/covers/Plato.png";
  }
}

// ✅ Evento al iniciar reproducción
audio.addEventListener("play", () => {
  iconPlay.classList.add("hidden");
  iconPause.classList.remove("hidden");
  actualizarEstadoCaratula();
});

// ✅ Evento al pausar reproducción
audio.addEventListener("pause", () => {
  iconPause.classList.add("hidden");
  iconPlay.classList.remove("hidden");
  actualizarEstadoCaratula();
});

// ✅ Evento al cargar DOM: mostrar Plato antes de cargar pista
document.addEventListener("DOMContentLoaded", () => {
  const discImg = document.querySelector('.disc-img');
  if (discImg) {
    discImg.classList.remove("rotating");
    discImg.src = "assets/covers/Plato.png"; // ✅ Mostrar Plato al iniciar
  }

  // ✅ Cargar pista sin activar portada ni reproducción
  fetch("https://iraked.github.io/ExtasisRadio/Repro11.json")
    .then(res => res.json())
    .then(data => {
      trackData = data;
      if (!Array.isArray(trackData) || trackData.length === 0) {
        console.warn("❌ No se encontraron pistas");
        return;
      }

      currentTrack = 0;
      currentTrackName.textContent = trackData[0].name;
      audio.src = trackData[0].url;

      // ✅ No mostrar portada ni activar animación aún
      audio.load(); // Carga el audio sin reproducir
      actualizarEstadoCaratula(); // Refuerza visual tras carga
    });
});
    
// ===============================
// 🎛️ BOTÓN MENU — MODAL ✓
// ===============================
const menuBtn = document.getElementById("btn-menu-tracks");
const closeModalBtn = document.getElementById("close-modal");

menuBtn?.addEventListener("click", () => {
  if (!trackData || trackData.length === 0) {
    console.warn("📂 No hay pistas para mostrar en el modal");
    return;
  }

  modalTracks.classList.remove("hidden");
  console.log("🎛️ Modal abierto");
});

closeModalBtn?.addEventListener("click", () => {
  modalTracks.classList.add("hidden");
  console.log("❌ Modal cerrado");
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalTracks.classList.contains("hidden")) {
    modalTracks.classList.add("hidden");
    console.log("❌ Modal cerrado con ESC");
  }
});

  // ===============================
// 🔁 BOTÓN PLAY/PAUSE ✓
// ===============================
playPauseBtn.addEventListener("click", () => {
  if (!audio.src || currentTrack === null || !trackData[currentTrack]) {
    console.warn("🎧 No hay pista válida cargada");
    return;
  }

  if (audio.paused || audio.ended) {
    autoplayEnabled = true; // ✅ Activar solo cuando el usuario inicia reproducción
    audio.play().then(() => {
      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");
    }).catch(err => {
      console.warn("⚠️ Error al reproducir:", err);
    });
  } else {
    audio.pause();
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
  }
});

  // ===============================
// ⏪ BOTÓN REWIND — 1 clic: pista anterior | sostenido: retroceso de 5s ✓
// ===============================
let rewindHoldTimer = null;

prevBtn?.addEventListener("mousedown", () => {
  rewindHoldTimer = setTimeout(() => {
    if (!audio.src || currentTrack === null || !trackData[currentTrack]) return;
    audio.currentTime = Math.max(0, audio.currentTime - 5);
    console.log("⏪ Retroceso de 5 segundos (clic sostenido)");
  }, 600); // Tiempo de activación sostenida
});

prevBtn?.addEventListener("mouseup", () => {
  clearTimeout(rewindHoldTimer);
});

prevBtn?.addEventListener("click", () => {
  if (!trackData || trackData.length === 0 || currentTrack === null) return;
  currentTrack = (currentTrack - 1 + trackData.length) % trackData.length;
  playTrack(currentTrack, true);
  console.log("⏮ Cambio a pista anterior (clic simple)");
});
  
  // ===============================
// ⏭ BOTÓN FORWARD ✓
// ===============================
let forwardClickCount = 0;
let forwardClickTimer = null;

nextBtn?.addEventListener("click", () => {
  forwardClickCount++;

  if (forwardClickCount === 1) {
    forwardClickTimer = setTimeout(() => {
      // 🟢 Acción de 1 clic: ir a pista siguiente
      if (!trackData || trackData.length === 0 || currentTrack === null) return;
      currentTrack = (currentTrack + 1) % trackData.length;
      playTrack(currentTrack, true);
      console.log("⏭ Cambio a pista siguiente:", trackData[currentTrack].name);
      forwardClickCount = 0;
    }, 300);
  }

  if (forwardClickCount === 2) {
    clearTimeout(forwardClickTimer);
    forwardClickCount = 0;

    // 🟢 Acción de doble clic: adelantar 10 segundos
    if (!audio.src || currentTrack === null || !trackData[currentTrack]) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
    console.log("⏩ Avance de 10 segundos");
  }
});

// ===============================
// 🔁 BOTÓN REPEAT — 1 clic: repetir pista | 2 clics o clic sostenido: repetir lista ✓
// ===============================
const repeatBtn = document.getElementById("repeat-button");

let repeatMode = "none"; // Modos posibles: "none", "track", "list"
let repeatClickCount = 0;
let repeatClickTimer = null;

// 🌀 Detectar clic sostenido
let holdTimer = null;
repeatBtn?.addEventListener("mousedown", () => {
  holdTimer = setTimeout(() => {
    repeatMode = "list";
    console.log("🔁 Modo: repetir lista completa");
    repeatBtn.classList.add("repeat-list");
  }, 600); // Sostenido por 600ms activa modo lista
});

repeatBtn?.addEventListener("mouseup", () => {
  clearTimeout(holdTimer);
});

repeatBtn?.addEventListener("click", () => {
  repeatClickCount++;

  if (repeatClickCount === 1) {
    repeatClickTimer = setTimeout(() => {
      // 🟢 Acción de 1 clic: repetir pista actual
      repeatMode = "track";
      console.log("🔂 Modo: repetir pista actual");
      repeatBtn.classList.remove("repeat-list");
      repeatBtn.classList.add("repeat-track");
      repeatClickCount = 0;
    }, 300);
  }

  if (repeatClickCount === 2) {
    clearTimeout(repeatClickTimer);
    repeatClickCount = 0;

    // 🟢 Acción de doble clic: repetir lista
    repeatMode = "list";
    console.log("🔁 Modo: repetir lista completa");
    repeatBtn.classList.remove("repeat-track");
    repeatBtn.classList.add("repeat-list");
  }
});

// ===============================
// 🎵 Función única para cargar y reproducir pista
// ===============================
//   - Actualiza nombre, audio, portada y animación según autoplay.
//   - Si autoplay está activo, reproduce y muestra carátula girando.
//   - Si autoplay está desactivado, muestra disco base detenido.
// ===============================
function playTrack(index, autoplay = true) {
  if (typeof index !== "number" || index < 0 || index >= trackData.length) {
    restaurarPlato();
    return;
  }

  const track = trackData[index];
  if (!track || !track.url) {
    restaurarPlato();
    return;
  }

  currentTrack = index;
  currentTrackName.textContent = track.name;
  audio.src = track.url;

  if (autoplay) {
    audio.play().then(() => {
      // ✅ Solo después de que el audio comienza, actualizamos visuales
      discImg.src = track.cover || "assets/covers/Cover-Vinyl-Disc-FX1.png";
      discImg.classList.remove("rotating");
      void discImg.offsetWidth;
      discImg.classList.add("rotating");

      iconPlay.classList.add("hidden");
      iconPause.classList.remove("hidden");

      // ✅ Invocación directa del estado visual
      actualizarEstadoCaratula();
      console.log("▶️ Reproduciendo:", track.name);
    }).catch(err => {
      console.warn("❌ Error al reproducir pista:", err);
    });
  } else {
    discImg.src = "assets/covers/Cover-Vinyl-Disc-FX1.png";
    discImg.classList.remove("rotating");
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
    actualizarEstadoCaratula();
    console.log("⏸ Pista cargada sin reproducción:", track.name);
  }
}

// ===============================
// 🔀 BOTÓN SHUFFLE ✓
// ===============================

    shuffleBtn?.addEventListener("click", () => {
  if (!Array.isArray(trackData) || trackData.length < 2) {
    console.warn("🔀 No hay suficientes pistas para mezclar");
    return;
  }

  // Mezclar el array de pistas usando Fisher-Yates
  for (let i = trackData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [trackData[i], trackData[j]] = [trackData[j], trackData[i]];
  }

  // Reiniciar desde la primera pista mezclada
  currentTrack = 0;
  playTrack(currentTrack, true);

  // Regenerar visuales del modal
  trackList.innerHTML = "";
  trackData.forEach((track, index) => {
    const li = document.createElement("li");
    li.textContent = track.name;
    li.classList.add("modal-track-item");
    li.setAttribute("data-index", index);
    li.addEventListener("click", () => {
      playTrack(index, false);
      modalTracks.classList.add("hidden");
    });
    trackList.appendChild(li);
  });

  console.log("🔀 Lista mezclada. Nueva danza iniciada.");
});

  // ===============================
  // 🎯 Sincronización visual con eventos del audio
  // ===============================
  audio.addEventListener("play", () => {
    iconPlay.classList.add("hidden");
    iconPause.classList.remove("hidden");
  });

  audio.addEventListener("pause", () => {
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
  });

  audio.addEventListener("ended", () => {
    iconPause.classList.add("hidden");
    iconPlay.classList.remove("hidden");
  });
});

// ===============================
// 🌌 PARTÍCULAS ✓
// ===============================
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const container = document.getElementById("reproductor-rick");

function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

const particlesArray = [];

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

function createParticles() {
  if (particlesArray.length < 100) {
    particlesArray.push(new Particle());
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handleParticles();
  createParticles();
  requestAnimationFrame(animateParticles);
}

animateParticles();
