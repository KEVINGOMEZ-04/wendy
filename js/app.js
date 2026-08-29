/**
 * Patico Wrapped 🌻 - Controlador Principal de la Aplicación
 */

(function() {
  class PaticoApp {
    constructor() {
      this.currentSectionId = "inicio";
      this.init();
    }

    init() {
      new window.StarfieldBackground("stars-canvas");
      this.initUnlockSystem();
      this.initPresenceUI();
      this.initNavigation();
      this.initSections();
      this.initModals();
      this.initWrappedSystem();
      window.storage.subscribe((key) => {
        if (key === window.CONFIG.storageKeys.memories) this.renderMemories();
        if (key === window.CONFIG.storageKeys.movies) this.renderMovies();
        if (key === window.CONFIG.storageKeys.songs) this.renderSongs();
        if (key === window.CONFIG.storageKeys.notes) this.renderNotes();
        if (key === window.CONFIG.storageKeys.dreams) this.renderDreams();
        this.renderDailyDashboard();
      });
    }

    // --- 1. Desbloqueo y Seguridad ---
    initUnlockSystem() {
      const lockScreen = document.getElementById("lock-screen");
      const lockCard = document.getElementById("lock-card");
      const appContainer = document.getElementById("app-container");
      const lockForm = document.getElementById("lock-form");
      const usernameInput = document.getElementById("lock-username");
      const passwordInput = document.getElementById("lock-password");
      const lockError = document.getElementById("lock-error");
      const btnReLock = document.getElementById("btn-re-lock");

      if (window.storage.isUnlocked()) {
        lockScreen.style.display = "none";
        appContainer.style.display = "flex";
        this.handleRouting();
      } else {
        lockScreen.style.display = "flex";
        appContainer.style.display = "none";
      }

      lockForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const valid = await window.storage.verifyCredentials(username, passwordInput.value);
        if (valid) {
          window.storage.setCurrentUser(username);
          window.presence.switchUser(username);
          lockError.textContent = "";
          lockCard.classList.add("blooming");
          setTimeout(() => {
            lockScreen.classList.add("unlocked-fade");
            setTimeout(() => {
              lockScreen.style.display = "none";
              lockScreen.classList.remove("unlocked-fade");
              lockCard.classList.remove("blooming");
              appContainer.style.display = "flex";
              window.storage.setUnlocked(true);
              this.handleRouting();
              window.Utils.showToast(`¡Bienvenido, ${username}! 🌻`, "success");
            }, 1000);
          }, 1000);
        } else {
          lockError.textContent = "Usuario o contraseña incorrectos.";
          passwordInput.focus();
        }
      });

      btnReLock.addEventListener("click", () => {
        window.storage.setUnlocked(false);
        appContainer.style.display = "none";
        lockScreen.style.display = "flex";
        passwordInput.value = "";
        lockError.textContent = "";
        window.Utils.showToast("Sesión bloqueada de forma segura", "info");
      });
    }
    // --- 2. Presencia Compartida UI ---
    initPresenceUI() {
      const summaryText = document.getElementById("presence-summary-text");
      const presenceDot = document.getElementById("presence-dot");
      const activeUser = document.getElementById("active-user-label");

      window.presence.subscribe((state) => {
        summaryText.textContent = state.summary;
        if (state.isLocal) {
          presenceDot.className = "presence-status-dot local-mode";
        } else {
          const anyOnline = state.users.Kevin?.online || state.users.Wendy?.online;
          presenceDot.className = "presence-status-dot " + (anyOnline ? "online" : "");
        }

        activeUser.textContent = `Sesión: ${state.currentUser}`;
      });
    }

    // --- 3. Navegación y Enrutamiento Hash ---
    initNavigation() {
      const navContainer = document.getElementById("nav-pills-container");
      navContainer.innerHTML = window.CONFIG.sections.map(sec => `
        <a href="#${sec.id}" class="nav-pill-btn" id="tab-${sec.id}" role="tab" aria-controls="section-${sec.id}" aria-selected="false">
          <span>${sec.icon}</span>
          <span>${sec.label}</span>
        </a>
      `).join("");

      window.addEventListener("hashchange", () => this.handleRouting());
    }

    handleRouting() {
      const hash = (window.location.hash || "#inicio").replace("#", "");
      const targetSection = window.CONFIG.sections.find(s => s.id === hash) || window.CONFIG.sections[0];
      this.activateSection(targetSection.id);
    }

    activateSection(sectionId) {
      this.currentSectionId = sectionId;
      const targetConfig = window.CONFIG.sections.find(s => s.id === sectionId) || window.CONFIG.sections[0];

      document.querySelectorAll(".wrapped-section").forEach(sec => {
        sec.classList.remove("active");
      });

      const activeEl = document.getElementById(`section-${sectionId}`);
      if (activeEl) {
        activeEl.classList.add("active");
      }

      document.querySelectorAll(".nav-pill-btn").forEach(btn => {
        btn.classList.remove("active");
        btn.removeAttribute("aria-current");
        btn.setAttribute("aria-selected", "false");
      });

      const activeTab = document.getElementById(`tab-${sectionId}`);
      if (activeTab) {
        activeTab.classList.add("active");
        activeTab.setAttribute("aria-current", "page");
        activeTab.setAttribute("aria-selected", "true");
        activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }

      if (sectionId === 'inicio') this.renderDailyDashboard();
    }
    // --- Inicialización de secciones interactivas ---
    initSections() {
      this.renderMemories();
      this.renderMovies();
      this.renderSongs();
      this.renderNotes();
      this.renderDreams();
      this.renderDailyDashboard();
    }

    renderDailyDashboard() {
      const summary = document.getElementById('daily-summary');
      if (!summary) return;
      const currentUser = window.storage.getCurrentUser();
      document.getElementById('dashboard-user').textContent = currentUser;
      const values = [
        ['🌻', window.storage.getMemories().length, 'recuerdos'],
        ['🎵', window.storage.getSongs().length, 'canciones'],
        ['🎬', window.storage.getMovies().length, 'películas'],
        ['💌', window.storage.getNotes().length, 'notas'],
        ['🌟', window.storage.getDreams().filter(dream => dream.status === 'Pendiente').length, 'sueños pendientes']
      ];
      summary.innerHTML = values.map(([icon, value, label]) => `<div class="glass-card daily-stat"><span>${icon}</span><strong>${value}</strong><small>${label}</small></div>`).join('');
      const prompts = ['Dejen una nota para que el otro la encuentre.', '¿Qué canción describe este día?', 'Elijan una película para su próxima noche.', 'Guarden un momento pequeño antes de olvidarlo.'];
      document.getElementById('daily-tip-text').textContent = prompts[new Date().getDate() % prompts.length];
    }

    renderSongs() {
      const container = document.getElementById("songs-grid-list");
      if (!container) return;
      const songs = window.storage.getSongs();

      if (!songs.length) {
        container.innerHTML = `<div class="glass-card empty-media">Todavía no hay canciones recomendadas. ¡Busca una arriba o añade la tuya! 🎶</div>`;
        return;
      }

      container.innerHTML = songs.map(song => {
        const hasLyrics = Boolean(song.lyrics && song.lyrics.trim());
        return `
          <article class="glass-card song-card" data-id="${song.id}">
            ${song.cover ? `<img src="${window.Utils.sanitizeHTML(song.cover)}" alt="Portada de ${window.Utils.sanitizeHTML(song.title)}" onerror="this.style.display='none'">` : '<div style="width: 90px; height: 90px; border-radius: 8px; background: var(--color-purple); display: flex; align-items: center; justify-content: center; font-size: 2rem; flex-shrink: 0;">🎵</div>'}
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <p class="media-by">Recomendada por ${window.Utils.sanitizeHTML(song.proposedBy || 'Kevin')}</p>
                <h3>${window.Utils.sanitizeHTML(song.title)}</h3>
                <p style="font-weight: 500; color: var(--color-text-main); margin-bottom: 0.25rem;">${window.Utils.sanitizeHTML(song.artist)}</p>
              </div>
              <div class="media-links">
                ${song.spotifyUrl ? `<a href="${window.Utils.sanitizeHTML(song.spotifyUrl)}" target="_blank" rel="noopener" class="btn-song-spotify" title="Abrir en Spotify">🟢 Spotify</a>` : ''}
                ${song.youtubeUrl ? `<a href="${window.Utils.sanitizeHTML(song.youtubeUrl)}" target="_blank" rel="noopener" class="btn-song-youtube" title="Abrir en YouTube">🔴 YouTube</a>` : ''}
                <button type="button" class="btn-song-lyrics btn-view-lyrics" data-id="${song.id}" title="${hasLyrics ? 'Leer letra' : 'Ver / Añadir letra'}">📜 ${hasLyrics ? 'Letra' : 'Letra +'}</button>
                <button type="button" class="btn-edit-song" data-id="${song.id}" title="Editar canción">✏️</button>
                <button type="button" class="btn-delete-song" data-id="${song.id}" style="color: var(--color-danger);" title="Eliminar canción">🗑️</button>
              </div>
            </div>
          </article>
        `;
      }).join("");

      container.querySelectorAll('.btn-view-lyrics').forEach(button => {
        button.addEventListener('click', () => {
          const song = window.storage.getSongs().find(s => s.id === button.dataset.id);
          if (song) this.openLyricsModal(song);
        });
      });

      container.querySelectorAll('.btn-edit-song').forEach(button => {
        button.addEventListener('click', () => {
          const song = window.storage.getSongs().find(s => s.id === button.dataset.id);
          if (song) this.openSongModal(song);
        });
      });

      container.querySelectorAll('.btn-delete-song').forEach(button => {
        button.addEventListener('click', () => {
          if (confirm("¿Eliminar esta canción de las recomendaciones?")) {
            window.storage.deleteSong(button.dataset.id);
            this.renderSongs();
            this.renderDailyDashboard();
            window.Utils.showToast("Canción eliminada", "info");
          }
        });
      });
    }

    openLyricsModal(song) {
      const modal = document.getElementById("modal-lyrics");
      const coverEl = document.getElementById("lyrics-modal-cover");
      const titleEl = document.getElementById("modal-lyrics-title");
      const artistEl = document.getElementById("modal-lyrics-artist");
      const bodyEl = document.getElementById("modal-lyrics-body");
      const actionsEl = document.getElementById("modal-lyrics-actions");

      if (song.cover) {
        coverEl.src = song.cover;
        coverEl.style.display = "block";
      } else {
        coverEl.style.display = "none";
      }

      titleEl.textContent = song.title;
      artistEl.textContent = `${song.artist} · Recomendada por ${song.proposedBy || 'Kevin'}`;

      if (song.lyrics && song.lyrics.trim()) {
        bodyEl.textContent = song.lyrics.trim();
      } else {
        bodyEl.innerHTML = `
          <div style="color: var(--color-text-secondary); padding: 2rem 1rem;">
            <p style="font-size: 1.1rem; margin-bottom: 1rem;">Aún no tenemos guardada la letra de esta canción.</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
              <button type="button" class="btn-primary" id="btn-fetch-lyrics-now" style="font-size: 0.88rem;">🔍 Buscar letra en línea</button>
              <button type="button" class="btn-secondary" id="btn-write-lyrics-now" style="font-size: 0.88rem;">✏️ Escribir letra</button>
            </div>
          </div>
        `;

        document.getElementById('btn-fetch-lyrics-now')?.addEventListener('click', async () => {
          bodyEl.innerHTML = '<p style="color: var(--color-sunflower-gold);">Buscando letra de la canción… ✨</p>';
          const fetchedLyrics = await window.MediaService.fetchLyrics(song.artist, song.title);
          if (fetchedLyrics) {
            song.lyrics = fetchedLyrics;
            window.storage.saveSong(song);
            this.renderSongs();
            this.openLyricsModal(song);
            window.Utils.showToast("¡Letra encontrada y guardada! 📜", "success");
          } else {
            bodyEl.innerHTML = `
              <div style="color: var(--color-text-secondary); padding: 1.5rem 1rem;">
                <p>No se encontró la letra automática. Puedes pegarla o buscarla en Genius:</p>
                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap;">
                  <a href="${window.Utils.sanitizeHTML(song.lyricsUrl || window.MediaService.geniusUrl(song.artist, song.title))}" target="_blank" rel="noopener" class="btn-primary">Ver en Genius 🌐</a>
                  <button type="button" class="btn-secondary" id="btn-write-lyrics-now-2">✏️ Escribir letra</button>
                </div>
              </div>
            `;
            document.getElementById('btn-write-lyrics-now-2')?.addEventListener('click', () => {
              modal.classList.remove("active");
              this.openSongModal(song);
            });
          }
        });

        document.getElementById('btn-write-lyrics-now')?.addEventListener('click', () => {
          modal.classList.remove("active");
          this.openSongModal(song);
        });
      }

      actionsEl.innerHTML = `
        ${song.spotifyUrl ? `<a href="${window.Utils.sanitizeHTML(song.spotifyUrl)}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">🟢 Spotify</a>` : ''}
        ${song.youtubeUrl ? `<a href="${window.Utils.sanitizeHTML(song.youtubeUrl)}" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">🔴 YouTube</a>` : ''}
        <button type="button" class="btn-secondary" id="btn-edit-modal-song-lyrics" style="font-size: 0.82rem; padding: 0.35rem 0.75rem;">✏️ Editar</button>
      `;

      document.getElementById('btn-edit-modal-song-lyrics')?.addEventListener('click', () => {
        modal.classList.remove("active");
        this.openSongModal(song);
      });

      modal.classList.add("active");
    }

    openSongModal(song = null) {
      const modal = document.getElementById("modal-song");
      document.getElementById("song-id").value = song ? (song.id || '') : '';
      document.getElementById("song-title").value = song ? (song.title || '') : '';
      document.getElementById("song-artist").value = song ? (song.artist || '') : '';
      document.getElementById("song-cover").value = song ? (song.cover || '') : '';
      document.getElementById("song-lyrics").value = song ? (song.lyrics || '') : '';
      document.getElementById("song-spotify").value = song ? (song.spotifyUrl || '') : '';
      document.getElementById("song-youtube").value = song ? (song.youtubeUrl || '') : '';
      document.getElementById("song-proposed").value = song ? (song.proposedBy || window.storage.getCurrentUser()) : window.storage.getCurrentUser();
      modal.classList.add("active");
    }

    async searchMusic(query) {
      const results = document.getElementById('music-search-results');
      results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-sunflower-gold);">Buscando canciones… 🎵✨</div>';

      try {
        const songs = await window.MediaService.searchMusic(query);
        if (!songs.length) {
          results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-text-secondary);">No encontramos canciones con esa búsqueda. ¡Intenta con otro título o artista!</div>';
          return;
        }

        results.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.9rem; color: var(--color-sunflower-gold);">Resultados de búsqueda (${songs.length}):</span>
            <button type="button" class="btn-secondary" id="btn-close-music-results" style="padding: 0.2rem 0.6rem; font-size: 0.78rem;">Cerrar resultados</button>
          </div>
          ${songs.map((song, index) => `
            <div class="media-result">
              <img src="${window.Utils.sanitizeHTML(song.cover)}" alt="Portada" onerror="this.style.display='none'">
              <span>
                <strong>${window.Utils.sanitizeHTML(song.title)}</strong><br>
                <small style="color: var(--color-lilac);">${window.Utils.sanitizeHTML(song.artist)}</small>
              </span>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <button type="button" class="btn-primary btn-add-song" data-index="${index}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">+ Recomendar</button>
                <button type="button" class="btn-secondary btn-custom-song" data-index="${index}" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" title="Personalizar antes de guardar">✏️</button>
              </div>
            </div>
          `).join('')}
        `;

        document.getElementById('btn-close-music-results')?.addEventListener('click', () => {
          results.innerHTML = '';
        });

        results.querySelectorAll('.btn-add-song').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            const baseSong = songs[index];
            button.disabled = true;
            button.textContent = 'Importando letra… ⏳';

            const lyrics = await window.MediaService.fetchLyrics(baseSong.artist, baseSong.title);
            const savedSong = {
              ...baseSong,
              lyrics: lyrics || '',
              proposedBy: window.storage.getCurrentUser()
            };

            window.storage.saveSong(savedSong);
            this.renderSongs();
            this.renderDailyDashboard();
            results.innerHTML = '';
            window.Utils.showToast(`¡${savedSong.title} añadida con éxito! 🎵`, 'success');
          });
        });

        results.querySelectorAll('.btn-custom-song').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            const baseSong = songs[index];
            button.textContent = 'Cargando…';
            const lyrics = await window.MediaService.fetchLyrics(baseSong.artist, baseSong.title);
            this.openSongModal({
              ...baseSong,
              lyrics: lyrics || '',
              proposedBy: window.storage.getCurrentUser()
            });
            button.textContent = '✏️';
          });
        });
      } catch (error) {
        results.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-danger);">${window.Utils.sanitizeHTML(error.message || 'No fue posible buscar música ahora.')}</div>`;
      }
    }

    async searchMovies(query) {
      const results = document.getElementById('movie-search-results');
      results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-sunflower-gold);">Buscando películas… 🎬✨</div>';

      try {
        const movies = await window.MediaService.searchMovies(query);
        if (!movies.length) {
          results.innerHTML = '<div class="glass-card" style="text-align: center; color: var(--color-text-secondary);">No encontramos películas con ese nombre. ¡Intenta con otro título!</div>';
          return;
        }

        results.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.9rem; color: var(--color-sunflower-gold);">Resultados de películas (${movies.length}):</span>
            <button type="button" class="btn-secondary" id="btn-close-movie-results" style="padding: 0.2rem 0.6rem; font-size: 0.78rem;">Cerrar resultados</button>
          </div>
          ${movies.map((movie, index) => `
            <div class="media-result">
              ${movie.poster ? `<img src="${window.Utils.sanitizeHTML(movie.poster)}" alt="Póster" onerror="this.style.display='none'">` : '<div style="width: 56px; height: 56px; border-radius: 8px; background: var(--color-purple); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">🎬</div>'}
              <span>
                <strong>${window.Utils.sanitizeHTML(movie.title)}</strong> (${movie.year || '—'})<br>
                <small style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--color-text-secondary);">${window.Utils.sanitizeHTML(movie.synopsis)}</small>
              </span>
              <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                <button type="button" class="btn-primary btn-add-search-movie" data-index="${index}" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;">+ Añadir</button>
                <button type="button" class="btn-secondary btn-custom-movie" data-index="${index}" style="padding: 0.35rem 0.65rem; font-size: 0.8rem;" title="Personalizar y calificar">⭐ Calificar</button>
              </div>
            </div>
          `).join('')}
        `;

        document.getElementById('btn-close-movie-results')?.addEventListener('click', () => {
          results.innerHTML = '';
        });

        results.querySelectorAll('.btn-add-search-movie').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            button.disabled = true;
            button.textContent = 'Importando… ⏳';
            const details = await window.MediaService.movieDetails(movies[index]);

            window.storage.saveMovie({
              ...details,
              proposedBy: window.storage.getCurrentUser(),
              priority: 5,
              status: 'Por ver',
              kevinRating: '',
              wendyRating: '',
              kevinComment: '',
              wendyComment: ''
            });

            this.renderMovies();
            this.renderDailyDashboard();
            results.innerHTML = '';
            window.Utils.showToast(`¡${details.title} añadida a Nuestra Biblioteca! 🎬`, 'success');
          });
        });

        results.querySelectorAll('.btn-custom-movie').forEach(button => {
          button.addEventListener('click', async () => {
            const index = parseInt(button.dataset.index, 10);
            button.textContent = 'Cargando…';
            const details = await window.MediaService.movieDetails(movies[index]);
            this.openMovieModal({
              ...details,
              proposedBy: window.storage.getCurrentUser(),
              priority: 5,
              status: 'Por ver',
              kevinRating: '',
              wendyRating: '',
              kevinComment: '',
              wendyComment: ''
            });
            button.textContent = '⭐ Calificar';
          });
        });
      } catch (error) {
        results.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-danger);">${window.Utils.sanitizeHTML(error.message || 'No fue posible buscar películas ahora.')}</div>`;
      }
    }

    // --- 6. Recuerdos (Campo de Girasoles) ---
    renderMemories() {
      const container = document.getElementById("memories-trail-list");
      const sortOrder = document.getElementById("select-sort-memories")?.value || "desc";
      if (!container) return;

      let list = window.storage.getMemories();
      list.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      });

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-text-secondary);">Aún no hay recuerdos guardados. ¡Crea el primero! 🌻</div>`;
        return;
      }

      container.innerHTML = `<div class="trail-line"></div>` + list.map(m => `
        <div class="memory-node" data-id="${m.id}">
          <div class="sunflower-pin" title="Abrir recuerdo">🌻</div>
          <div class="glass-card memory-card-body">
            <div class="memory-date">
              <span>📅 ${window.Utils.formatDateES(m.date)}</span>
              ${m.isDemo ? `<span class="demo-badge">Dato de ejemplo</span>` : ""}
              ${m.status === "Destacado" ? `<span style="color: var(--color-sunflower-gold);">⭐ Destacado</span>` : ""}
            </div>
            <h3 class="memory-title">${window.Utils.sanitizeHTML(m.title)}</h3>
            <p class="memory-desc">${window.Utils.sanitizeHTML(m.description)}</p>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.75rem;">
              <button type="button" class="btn-secondary btn-edit-memory" data-id="${m.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;">Editar</button>
              <button type="button" class="btn-secondary btn-delete-memory" data-id="${m.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem; color: var(--color-danger);">Eliminar</button>
            </div>
          </div>
        </div>
      `).join("");

      container.querySelectorAll(".btn-edit-memory").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          const mem = window.storage.getMemories().find(m => m.id === id);
          if (mem) this.openMemoryModal(mem);
        });
      });

      container.querySelectorAll(".btn-delete-memory").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Seguro que deseas eliminar este recuerdo?")) {
            window.storage.deleteMemory(id);
            this.renderMemories();
            window.Utils.showToast("Recuerdo eliminado", "info");
          }
        });
      });

      document.getElementById("select-sort-memories")?.addEventListener("change", () => this.renderMemories());
    }

    openMemoryModal(mem = null) {
      const modal = document.getElementById("modal-memory");
      document.getElementById("mem-id").value = mem ? mem.id : "";
      document.getElementById("mem-date").value = mem ? mem.date : new Date().toISOString().split("T")[0];
      document.getElementById("mem-title").value = mem ? mem.title : "";
      document.getElementById("mem-desc").value = mem ? mem.description : "";
      document.getElementById("mem-status").value = mem ? mem.status : "Guardado";
      modal.classList.add("active");
    }

    // --- 7. Películas (Nuestro Cine) ---
    renderMovies() {
      const container = document.getElementById("movies-grid-list");
      const filter = document.getElementById("filter-movies-status")?.value || "all";
      if (!container) return;

      let list = window.storage.getMovies();
      if (filter !== "all") {
        list = list.filter(m => m.status === filter);
      }

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary); padding: 2rem;">No hay películas registradas en esta categoría.</div>`;
        return;
      }

      container.innerHTML = list.map(m => {
        const hasKevin = m.kevinRating !== null && m.kevinRating !== undefined && m.kevinRating !== '';
        const hasWendy = m.wendyRating !== null && m.wendyRating !== undefined && m.wendyRating !== '';
        let ratingHtml = "";

        if (hasKevin && hasWendy) {
          const avg = (parseFloat(m.kevinRating) + parseFloat(m.wendyRating)) / 2;
          ratingHtml = `<span>Promedio: <strong style="color: var(--color-sunflower-gold); font-size: 1rem;">${window.Utils.formatDecimalES(avg, 1)}/10</strong></span> <span>(K: ${window.Utils.formatDecimalES(parseFloat(m.kevinRating), 1)} | W: ${window.Utils.formatDecimalES(parseFloat(m.wendyRating), 1)})</span>`;
        } else if (hasKevin) {
          ratingHtml = `<span>Nota Kevin: <strong style="color: var(--color-lilac); font-size: 1rem;">${window.Utils.formatDecimalES(parseFloat(m.kevinRating), 1)}/10</strong></span> <span style="font-size: 0.75rem; color: var(--color-text-muted);">(Wendy pendiente)</span>`;
        } else if (hasWendy) {
          ratingHtml = `<span>Nota Wendy: <strong style="color: var(--color-sunflower-gold); font-size: 1rem;">${window.Utils.formatDecimalES(parseFloat(m.wendyRating), 1)}/10</strong></span> <span style="font-size: 0.75rem; color: var(--color-text-muted);">(Kevin pendiente)</span>`;
        } else {
          ratingHtml = `<span style="color: var(--color-text-muted); font-size: 0.8rem;">Sin calificar aún</span>`;
        }

        const statusClass = m.status === 'Me encantó' ? 'encanto' : (m.status === 'Vista' ? 'Vista' : 'por-ver');
        const statusLabel = m.status === 'Me encantó' ? '💖 Me encantó' : (m.status === 'Vista' ? '🍿 Vista' : '🌱 Por ver');
        const platformsList = Array.isArray(m.platforms) ? m.platforms : (typeof m.platforms === 'string' && m.platforms ? m.platforms.split(',').map(s => s.trim()) : []);

        return `
          <div class="glass-card movie-card" data-id="${m.id}">
            <div>
              ${m.poster ? `<img class="movie-poster" src="${window.Utils.sanitizeHTML(m.poster)}" alt="Póster de ${window.Utils.sanitizeHTML(m.title)}" onerror="this.style.display='none'">` : ''}
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
                <span class="movie-badge-status ${statusClass}" data-status="${window.Utils.sanitizeHTML(m.status)}">${statusLabel}</span>
                ${m.isDemo ? `<span class="demo-badge">Dato de ejemplo</span>` : ""}
              </div>
              <h3 style="font-family: var(--font-heading); font-size: 1.45rem; color: var(--color-text-main); margin-bottom: 0.2rem; line-height: 1.2;">
                ${window.Utils.sanitizeHTML(m.title)} <span style="font-size: 0.95rem; color: var(--color-sunflower-gold); font-family: var(--font-numbers);">(${m.year})</span>
              </h3>
              <p style="font-size: 0.82rem; color: var(--color-text-secondary); margin-bottom: 0.4rem;">
                Propuesta por: <strong style="color: var(--color-text-main);">${window.Utils.sanitizeHTML(m.proposedBy)}</strong> · Prioridad: ${m.priority}/5 ⭐
              </p>
              ${m.synopsis ? `<p class="movie-synopsis">${window.Utils.sanitizeHTML(m.synopsis)}</p>` : ''}
              
              ${platformsList.length ? `
                <div class="movie-platforms">
                  ${platformsList.map(plat => `<span class="platform-pill">📺 ${window.Utils.sanitizeHTML(plat)}</span>`).join('')}
                </div>
              ` : ''}

              ${m.imdbRating ? `
                <p class="movie-meta" style="margin-top: 0.5rem;">
                  ⭐ IMDb: <strong>${window.Utils.sanitizeHTML(m.imdbRating)}</strong>/10 
                  ${m.imdbUrl ? `· <a href="${window.Utils.sanitizeHTML(m.imdbUrl)}" target="_blank" rel="noopener">Ver ficha en IMDb</a>` : ''}
                </p>
              ` : (m.imdbUrl ? `<p class="movie-meta"><a href="${window.Utils.sanitizeHTML(m.imdbUrl)}" target="_blank" rel="noopener">⭐ Buscar en IMDb</a></p>` : '')}

              ${m.kevinComment ? `<p style="font-size: 0.84rem; color: var(--color-lilac); margin-top: 0.6rem; font-style: italic;">“${window.Utils.sanitizeHTML(m.kevinComment)}” — Kevin</p>` : ""}
              ${m.wendyComment ? `<p style="font-size: 0.84rem; color: var(--color-sunflower-gold); margin-top: 0.35rem; font-style: italic;">“${window.Utils.sanitizeHTML(m.wendyComment)}” — Wendy</p>` : ""}
            </div>
            <div>
              <div class="movie-rating-bar">${ratingHtml}</div>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.85rem;">
                <button type="button" class="btn-secondary btn-edit-movie" data-id="${m.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem;">Editar</button>
                <button type="button" class="btn-secondary btn-delete-movie" data-id="${m.id}" style="padding: 0.25rem 0.65rem; font-size: 0.8rem; color: var(--color-danger);">Eliminar</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      container.querySelectorAll(".btn-edit-movie").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const movie = window.storage.getMovies().find(m => m.id === id);
          if (movie) this.openMovieModal(movie);
        });
      });

      container.querySelectorAll(".btn-delete-movie").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Eliminar esta película de la biblioteca?")) {
            window.storage.deleteMovie(id);
            this.renderMovies();
            this.renderDailyDashboard();
            window.Utils.showToast("Película eliminada", "info");
          }
        });
      });

      document.getElementById("filter-movies-status")?.addEventListener("change", () => this.renderMovies());
    }

    openMovieModal(m = null) {
      const modal = document.getElementById("modal-movie");
      document.getElementById("movie-id").value = m ? (m.id || "") : "";
      document.getElementById("movie-title").value = m ? (m.title || "") : "";
      document.getElementById("movie-poster").value = m ? (m.poster || "") : "";
      document.getElementById("movie-year").value = m ? (m.year || new Date().getFullYear()) : new Date().getFullYear();
      document.getElementById("movie-proposed").value = m ? (m.proposedBy || "Kevin") : "Kevin";
      document.getElementById("movie-priority").value = m ? (m.priority || "5") : "5";
      document.getElementById("movie-status").value = m ? (m.status === 'Favorita' ? 'Me encantó' : (m.status || "Por ver")) : "Por ver";
      
      const platformsVal = m && m.platforms ? (Array.isArray(m.platforms) ? m.platforms.join(", ") : m.platforms) : "";
      document.getElementById("movie-platforms").value = platformsVal;
      document.getElementById("movie-imdb-score").value = m && m.imdbRating ? m.imdbRating : "";
      document.getElementById("movie-imdb-url").value = m && m.imdbUrl ? m.imdbUrl : "";
      document.getElementById("movie-synopsis").value = m && m.synopsis ? m.synopsis : "";

      document.getElementById("movie-kevin-score").value = m && m.kevinRating !== null && m.kevinRating !== undefined ? m.kevinRating : "";
      document.getElementById("movie-wendy-score").value = m && m.wendyRating !== null && m.wendyRating !== undefined ? m.wendyRating : "";
      document.getElementById("movie-kevin-comment").value = m && m.kevinComment ? m.kevinComment : "";
      document.getElementById("movie-wendy-comment").value = m && m.wendyComment ? m.wendyComment : "";
      modal.classList.add("active");
    }

    // --- 8. Muro Compartido ---
    renderNotes() {
      const container = document.getElementById("notes-grid-list");
      if (!container) return;

      let list = window.storage.getNotes();
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (list.length === 0) {
        container.innerHTML = `<div class="glass-card" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary);">El muro está esperando vuestras primeras palabras. 💌</div>`;
        return;
      }

      container.innerHTML = list.map(n => `
        <div class="paper-note" data-id="${n.id}">
          <div class="paper-note-header">
            <span class="paper-author" style="color: ${n.author === "Kevin" ? "var(--color-lilac)" : "var(--color-sunflower-gold)"};">${n.author}</span>
            <span class="paper-date">${window.Utils.formatDateTimeES(n.createdAt)}</span>
          </div>
        <div class="paper-content">${window.Utils.sanitizeHTML(n.message)}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
          ${n.isDemo ? `<span class="demo-badge">Dato de ejemplo</span>` : `<span></span>`}
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-secondary btn-edit-note" data-id="${n.id}" style="padding: 0.2rem 0.55rem; font-size: 0.75rem;">Editar</button>
            <button type="button" class="btn-secondary btn-delete-note" data-id="${n.id}" style="padding: 0.2rem 0.55rem; font-size: 0.75rem; color: var(--color-danger);">Eliminar</button>
          </div>
        </div>
      </div>
    `).join("");

      container.querySelectorAll(".btn-edit-note").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const note = window.storage.getNotes().find(n => n.id === id);
          if (note) this.openNoteModal(note);
        });
      });

      container.querySelectorAll(".btn-delete-note").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Eliminar esta nota del muro?")) {
            window.storage.deleteNote(id);
            this.renderNotes();
            window.Utils.showToast("Nota eliminada", "info");
          }
        });
      });
    }

    openNoteModal(n = null) {
      const modal = document.getElementById("modal-note");
      document.getElementById("note-id").value = n ? n.id : "";
      document.getElementById("note-author").value = n ? n.author : window.storage.getCurrentUser();
      document.getElementById("note-message").value = n ? n.message : "";
      modal.classList.add("active");
    }

    // --- 9. Frasco de Sueños ---
    renderDreams() {
      const container = document.getElementById("dreams-list-container");
      if (!container) return;

      const list = window.storage.getDreams();
      const total = list.length;
      const completed = list.filter(d => d.status === "Cumplido").length;
      const pending = total - completed;
      const pct = total > 0 ? (completed / total) * 100 : 0;

      document.getElementById("stat-dreams-total").textContent = window.Utils.formatNumberES(total);
      document.getElementById("stat-dreams-completed").textContent = window.Utils.formatNumberES(completed);
      document.getElementById("stat-dreams-pending").textContent = window.Utils.formatNumberES(pending);
      document.getElementById("stat-dreams-pct").textContent = window.Utils.formatDecimalES(pct, 2) + " %";

      if (total === 0) {
        container.innerHTML = `<div class="glass-card" style="text-align: center; color: var(--color-text-secondary);">El frasco está listo para guardar nuevos sueños juntos. ✨</div>`;
        return;
      }

      container.innerHTML = list.map(d => `
        <div class="dream-item-card ${d.status === "Cumplido" ? "completed" : ""}" data-id="${d.id}">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <button type="button" class="btn-toggle-dream" data-id="${d.id}" style="background: none; border: none; font-size: 1.4rem; cursor: pointer;">
              ${d.status === "Cumplido" ? "🌟" : "🌱"}
            </button>
            <div>
              <span class="dream-title-text">${window.Utils.sanitizeHTML(d.title)}</span>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">
                ${d.completedAt ? `Cumplido: ${window.Utils.formatDateES(d.completedAt)}` : `Añadido: ${window.Utils.formatDateES(d.createdAt)}`}
                ${d.isDemo ? ` · <span class="demo-badge">Dato de ejemplo</span>` : ""}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button type="button" class="btn-secondary btn-edit-dream" data-id="${d.id}" style="padding: 0.2rem 0.55rem; font-size: 0.75rem;">Editar</button>
            <button type="button" class="btn-secondary btn-delete-dream" data-id="${d.id}" style="padding: 0.2rem 0.55rem; font-size: 0.75rem; color: var(--color-danger);">Eliminar</button>
          </div>
        </div>
      `).join("");

      container.querySelectorAll(".btn-toggle-dream").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const { justCompleted } = window.storage.toggleDreamStatus(id);
          if (justCompleted) {
            window.Animations.triggerPetalRain();
            window.Utils.showToast("¡Sueño cumplido! 🌻✨", "success");
          }
          this.renderDreams();
        });
      });

      container.querySelectorAll(".btn-edit-dream").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          const dream = window.storage.getDreams().find(d => d.id === id);
          if (dream) this.openDreamModal(dream);
        });
      });

      container.querySelectorAll(".btn-delete-dream").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.dataset.id;
          if (confirm("¿Eliminar este sueño del frasco?")) {
            window.storage.deleteDream(id);
            this.renderDreams();
            window.Utils.showToast("Sueño eliminado", "info");
          }
        });
      });
    }

    openDreamModal(d = null) {
      const modal = document.getElementById("modal-dream");
      document.getElementById("dream-id").value = d ? d.id : "";
      document.getElementById("dream-title").value = d ? d.title : "";
      document.getElementById("dream-status").value = d ? d.status : "Pendiente";
      modal.classList.add("active");
    }

    // --- 10. Gestión de Formularios y Modales ---
    initModals() {
      document.getElementById("btn-new-memory")?.addEventListener("click", () => this.openMemoryModal());
      document.getElementById("btn-new-song")?.addEventListener("click", () => document.getElementById("modal-song").classList.add("active"));
      document.getElementById("btn-new-movie")?.addEventListener("click", () => this.openMovieModal());
      document.getElementById("btn-new-note")?.addEventListener("click", () => this.openNoteModal());
      document.getElementById("btn-new-dream")?.addEventListener("click", () => this.openDreamModal());
      document.getElementById("btn-change-password")?.addEventListener("click", () => document.getElementById("modal-password").classList.add("active"));
      document.getElementById("music-search-form")?.addEventListener("submit", e => { e.preventDefault(); this.searchMusic(document.getElementById('music-search-input').value); });
      document.getElementById("movie-search-form")?.addEventListener("submit", e => { e.preventDefault(); this.searchMovies(document.getElementById('movie-search-input').value); });

      document.querySelectorAll("[data-close-modal]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const modalId = e.currentTarget.dataset.closeModal;
          document.getElementById(modalId)?.classList.remove("active");
        });
      });

      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          document.querySelectorAll(".modal-overlay.active").forEach(m => m.classList.remove("active"));
        }
      });

      document.getElementById("form-memory")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const memData = {
          id: document.getElementById("mem-id").value,
          date: document.getElementById("mem-date").value,
          title: document.getElementById("mem-title").value,
          description: document.getElementById("mem-desc").value,
          status: document.getElementById("mem-status").value
        };
        window.storage.saveMemory(memData);
        document.getElementById("modal-memory").classList.remove("active");
        this.renderMemories();
        window.Utils.showToast("Recuerdo guardado con éxito 🌻", "success");
      });
      document.getElementById("form-password")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const ok = await window.storage.changePassword(
          window.storage.getCurrentUser(),
          document.getElementById('current-password').value,
          document.getElementById('new-password').value
        );
        if (!ok) {
          window.Utils.showToast('La contraseña actual no coincide.', 'error');
          return;
        }
        document.getElementById('modal-password').classList.remove('active');
        e.currentTarget.reset();
        window.Utils.showToast('Contraseña actualizada.', 'success');
      });

      document.getElementById("form-song")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = document.getElementById('song-id').value;
        const title = document.getElementById('song-title').value.trim();
        const artist = document.getElementById('song-artist').value.trim();
        const cover = document.getElementById('song-cover').value.trim();
        const lyrics = document.getElementById('song-lyrics').value.trim();
        const spotifyUrl = document.getElementById('song-spotify').value.trim() || window.MediaService.spotifyUrl(title, artist);
        const youtubeUrl = document.getElementById('song-youtube').value.trim() || window.MediaService.youtubeUrl(title, artist);
        const proposedBy = document.getElementById('song-proposed').value || window.storage.getCurrentUser();

        window.storage.saveSong({
          id: id || undefined,
          title,
          artist,
          cover,
          lyrics,
          spotifyUrl,
          youtubeUrl,
          lyricsUrl: window.MediaService.geniusUrl(artist, title),
          proposedBy
        });

        document.getElementById('modal-song').classList.remove('active');
        e.currentTarget.reset();
        this.renderSongs();
        this.renderDailyDashboard();
        window.Utils.showToast('Canción guardada 🎵', 'success');
      });

      document.getElementById("form-movie")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const movieData = {
          id: document.getElementById("movie-id").value,
          title: document.getElementById("movie-title").value,
          poster: document.getElementById("movie-poster").value.trim(),
          year: document.getElementById("movie-year").value,
          proposedBy: document.getElementById("movie-proposed").value,
          priority: document.getElementById("movie-priority").value,
          status: document.getElementById("movie-status").value,
          platforms: document.getElementById("movie-platforms").value.trim(),
          imdbRating: document.getElementById("movie-imdb-score").value.trim(),
          imdbUrl: document.getElementById("movie-imdb-url").value.trim(),
          synopsis: document.getElementById("movie-synopsis").value.trim(),
          kevinRating: document.getElementById("movie-kevin-score").value,
          wendyRating: document.getElementById("movie-wendy-score").value,
          kevinComment: document.getElementById("movie-kevin-comment").value,
          wendyComment: document.getElementById("movie-wendy-comment").value
        };
        window.storage.saveMovie(movieData);
        document.getElementById("modal-movie").classList.remove("active");
        this.renderMovies();
        this.renderDailyDashboard();
        window.Utils.showToast("Película guardada en la biblioteca 🎬", "success");
      });

      document.getElementById("form-note")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const noteData = {
          id: document.getElementById("note-id").value,
          author: document.getElementById("note-author").value,
          message: document.getElementById("note-message").value
        };
        window.storage.saveNote(noteData);
        document.getElementById("modal-note").classList.remove("active");
        this.renderNotes();
        window.Utils.showToast("Nota publicada en el muro 💌", "success");
      });

      document.getElementById("form-dream")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const dreamData = {
          id: document.getElementById("dream-id").value,
          title: document.getElementById("dream-title").value,
          status: document.getElementById("dream-status").value
        };
        window.storage.saveDream(dreamData);
        document.getElementById("modal-dream").classList.remove("active");
        this.renderDreams();
        window.Utils.showToast("Sueño guardado en el frasco ✨", "success");
      });
    }

    // --- 7. Sistema Interactivo Patico Wrapped 🌻 ---
    initWrappedSystem() {
      this.initChaptersTabs();
      this.initWrappedStories();
      this.initCounterAnimations();
    }

    initChaptersTabs() {
      const tabs = document.querySelectorAll("#chapters-nav-tabs .chapter-tab-btn");
      const display = document.getElementById("chapter-active-display");
      if (!tabs.length || !display) return;

      const chaptersData = {
        1: {
          title: "Capítulo 1 — El reencuentro",
          dates: "20 noviembre – diciembre 2024",
          count: "~3.361 mensajes",
          desc: "Todo comienza cuando Kevin recupera contacto con Wendy después del robo de su celular. Los primeros días están llenos de saludos, preguntas simples y la sensación de volver a conocerse. En esta etapa aparecen los primeros audios largos y los chismes que terminarían siendo una tradición.",
          quote: "«Todo comenzó con un simple “Holi”.»"
        },
        2: {
          title: "Capítulo 2 — La confianza",
          dates: "enero – abril 2025",
          count: "~3.000 mensajes",
          desc: "La conversación deja de depender de una excusa. Empiezan a llamarse “lindo”, comparten fotografías de su día, hablan de vacaciones, familia, universidad, trabajo y comienzan a mostrar espacios personales de su vida cotidiana.",
          quote: "«Ya no hablaban para responder; hablaban para compartir.»"
        },
        3: {
          title: "Capítulo 3 — Conversaciones reales",
          dates: "julio – diciembre 2025",
          count: "~11.680 mensajes",
          desc: "Es la etapa con mayor crecimiento del chat. Ambos empiezan a compartir preocupaciones, estrés, problemas laborales y emociones personales. La confianza alcanza su punto más alto y las conversaciones dejan de ser superficiales para convertirse en un espacio de apoyo mutuo.",
          quote: "«La confianza ya no estaba en los saludos. Estaba en contar lo difícil.»"
        },
        4: {
          title: "Capítulo 4 — La rutina bonita",
          dates: "enero – agosto 2026",
          count: "~7.337 mensajes",
          desc: "Hablar se convierte en parte del día. Ya no existen silencios incómodos ni motivos específicos para escribir. Los mensajes aparecen simplemente porque el otro forma parte de la rutina.",
          quote: "«Algunas personas llegan. Otras terminan haciendo parte de los días normales.»"
        }
      };

      tabs.forEach(btn => {
        btn.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("active"));
          btn.classList.add("active");
          const chId = btn.dataset.chapter;
          const data = chaptersData[chId];
          if (!data) return;

          display.style.opacity = "0";
          display.style.transform = "translateY(8px)";
          setTimeout(() => {
            display.innerHTML = `
              <div class="chapter-badge-dates">${data.dates}</div>
              <span class="chapter-msg-count">${data.count}</span>
              <h3 class="chapter-title">${data.title}</h3>
              <p class="chapter-desc">${data.desc}</p>
              <div class="chapter-quote">${data.quote}</div>
            `;
            display.style.transition = "all 0.3s ease";
            display.style.opacity = "1";
            display.style.transform = "translateY(0)";
          }, 200);
        });
      });
    }

    initWrappedStories() {
      const modal = document.getElementById("modal-wrapped-story");
      const btnOpen = document.getElementById("btn-open-story-mode");
      const btnClose = document.getElementById("btn-close-story");
      const progressContainer = document.getElementById("story-progress-bars");
      const viewport = document.getElementById("story-viewport");
      const indexLabel = document.getElementById("story-slide-index-label");
      const btnPrev = document.getElementById("btn-story-prev");
      const btnNext = document.getElementById("btn-story-next");
      const btnPause = document.getElementById("btn-story-pause");
      const touchPrev = document.getElementById("story-touch-prev");
      const touchNext = document.getElementById("story-touch-next");

      if (!modal || !btnOpen) return;

      const slides = [
        {
          tag: "🌻 Patico Wrapped · 2024 - 2026",
          icon: "🌻",
          title: "Nuestra Historia en Números",
          bigNumber: "25.378",
          unit: "mensajes intercambiados",
          narrative: "«Durante 648 días, dos personas construyeron una historia de 25.378 mensajes. No es una conversación cualquiera; es un diario escrito entre risas, chismes, audios y pequeños momentos cotidianos.»",
          footerInfo: "20 nov 2024 – 29 ago 2026 · 648 días"
        },
        {
          tag: "⚖️ Participación de Cada Uno",
          icon: "💬",
          title: "El Ritmo de la Conversación",
          customHtml: `
            <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin: 1rem 0;">
              <div class="participant-box kevin">
                <div class="participant-name kevin-name">Kevin Gómez</div>
                <div class="participant-pct">56,9%</div>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary);">14.428 msgs<br><strong>43.198 palabras</strong></div>
              </div>
              <div class="participant-box wendy">
                <div class="participant-name wendy-name">Wendy (Patico ♥️)</div>
                <div class="participant-pct">43,1%</div>
                <div style="font-size: 0.85rem; color: var(--color-text-secondary);">10.950 msgs<br><strong>41.403 palabras</strong></div>
              </div>
            </div>
            <div class="insight-highlight-box" style="margin-top: 0.5rem; text-align: left;">
              💡 Aunque Kevin envió 3.478 mensajes más, la diferencia final fue de tan solo <strong>1.795 palabras</strong>.
            </div>
          `,
          narrative: "«Kevin habla más veces. Wendy habla casi igual de profundo.»",
          footerInfo: "84.601 palabras totales escritas"
        },
        {
          tag: "⚡ Velocidad de Respuesta",
          icon: "⏱️",
          title: "Siempre Presentes",
          customHtml: `
            <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin: 1rem 0;">
              <div class="speed-card">
                <div class="speed-val">1 min</div>
                <div class="speed-label">Mediana Kevin 👦🏻</div>
              </div>
              <div class="speed-card">
                <div class="speed-val">3 min</div>
                <div class="speed-label">Mediana Wendy 👧🏻</div>
              </div>
            </div>
          `,
          narrative: "«Cuando alguno escribía, el otro casi siempre estaba ahí. En conversación activa, el chat funcionaba prácticamente en tiempo real.»",
          footerInfo: "Promedio general: 75 min (incluye noches y jornadas)"
        },
        {
          tag: "📖 Capítulo 1 · El reencuentro",
          icon: "🌱",
          title: "El Reencuentro",
          dates: "20 nov – dic 2024 · ~3.361 mensajes",
          bodyText: "Todo comenzó cuando Kevin recuperó contacto con Wendy después del robo de su celular. Los primeros días estuvieron llenos de saludos, preguntas simples y volver a conocerse con los primeros audios y chismes.",
          narrative: "«Todo comenzó con un simple “Holi”.»",
          footerInfo: "El inicio de una nueva etapa"
        },
        {
          tag: "🤝 Capítulo 2 · La confianza",
          icon: "🌷",
          title: "La Confianza",
          dates: "ene – abr 2025 · ~3.000 mensajes",
          bodyText: "La conversación dejó de necesitar excusas. Comenzaron a llamarse “lindo”, compartir fotos cotidianas, hablar de vacaciones, familia, universidad y trabajo.",
          narrative: "«Ya no hablaban para responder; hablaban para compartir.»",
          footerInfo: "Primeros espacios personales compartidos"
        },
        {
          tag: "💖 Capítulo 3 · Conversaciones reales",
          icon: "🌊",
          title: "Conversaciones Reales",
          dates: "jul – dic 2025 · ~11.680 mensajes",
          bodyText: "La etapa de mayor crecimiento del chat. Compartieron preocupaciones, estrés, problemas del trabajo y emociones personales. Un espacio incondicional de apoyo mutuo.",
          narrative: "«La confianza ya no estaba en los saludos. Estaba en contar lo difícil.»",
          footerInfo: "Pico de actividad y cercanía emocional"
        },
        {
          tag: "🏡 Capítulo 4 · La rutina bonita",
          icon: "✨",
          title: "La Rutina Bonita",
          dates: "ene – ago 2026 · ~7.337 mensajes",
          bodyText: "Hablar se convirtió en parte del día. Ya no existían silencios incómodos ni motivos forzados para escribir. Los mensajes aparecieron simplemente porque el otro hacía parte de la vida.",
          narrative: "«Algunas personas llegan. Otras terminan haciendo parte de los días normales.»",
          footerInfo: "Compañía cotidiana"
        },
        {
          tag: "👑 Récords del Chat",
          icon: "🔥",
          title: "El Día Más Activo de la Historia",
          bigNumber: "872",
          unit: "mensajes en un solo día",
          dates: "28 de agosto de 2026",
          narrative: "«Hubo días donde dejaron de usar WhatsApp como una aplicación… y prácticamente vivieron dentro del chat.»",
          footerInfo: "Top días: 2 dic 2025 (414 msgs) · 27 ago 2026 (405 msgs)"
        },
        {
          tag: "💬 Identidad & Lo de Siempre",
          icon: "🗣️",
          title: "El Sello de la Conversación",
          customHtml: `
            <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; margin: 0.75rem 0;">
              <div class="identity-col" style="padding: 0.8rem; text-align: left;">
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-lilac); margin-bottom: 0.35rem;">👦🏻 Kevin</div>
                <div style="font-size: 0.85rem; color: var(--color-text-main);">Holi · JSJSJS · Chisme · Parce · :3</div>
              </div>
              <div class="identity-col" style="padding: 0.8rem; text-align: left;">
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-sunflower-gold); margin-bottom: 0.35rem;">👧🏻 Wendy</div>
                <div style="font-size: 0.85rem; color: var(--color-text-main);">Holap · Jummm · Lindo · Pjs · 💁🏻‍♀️</div>
              </div>
            </div>
            <div class="top-phrase-spotlight" style="padding: 0.9rem; margin-top: 0.5rem;">
              <div style="font-size: 0.78rem; text-transform: uppercase; color: var(--color-text-secondary);">Pregunta más repetida:</div>
              <div style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 700; color: var(--color-sunflower-gold);">“¿Cómo estás?”</div>
            </div>
          `,
          narrative: "«Algunas conversaciones se escribieron con palabras. Otras duraron más de un minuto en un audio.»",
          footerInfo: "3.729 archivos multimedia compartidos"
        },
        {
          tag: "💛 El Dato Más Bonito",
          icon: "🌻",
          title: "Dos Voces, Una Misma Historia",
          customHtml: `
            <div style="margin: 1.2rem 0;">
              <div style="font-family: var(--font-numbers); font-size: 1.5rem; font-weight: 700; color: var(--color-sunflower-gold);">
                43.198 palabras <span style="color: var(--color-lilac); font-weight: 300;">vs</span> 41.403 palabras
              </div>
            </div>
          `,
          narrative: "«Kevin envió miles de mensajes más. Wendy escribió casi la misma cantidad de palabras. Dos maneras distintas de conversar que terminaron construyendo exactamente la misma historia.»",
          footerInfo: "648 días · 25.378 mensajes · Una historia infinita 🌻"
        }
      ];

      let currentIndex = 0;
      let isPaused = false;
      let timerId = null;
      const slideDuration = 6500; // ms

      const renderProgressBar = () => {
        progressContainer.innerHTML = slides.map((_, i) => `
          <div class="story-progress-segment ${i < currentIndex ? 'completed' : ''}" id="story-seg-${i}">
            <div class="story-progress-segment-fill" id="story-seg-fill-${i}" style="width: ${i < currentIndex ? '100%' : '0%'};"></div>
          </div>
        `).join("");
      };

      const renderSlide = (index) => {
        currentIndex = index;
        const slide = slides[index];
        indexLabel.textContent = `${index + 1}/${slides.length}`;

        renderProgressBar();

        viewport.classList.remove("slide-animating");
        void viewport.offsetWidth;
        viewport.classList.add("slide-animating");

        viewport.innerHTML = `
          <div class="wrapped-card-tag" style="margin-bottom: 0.75rem;">${slide.tag}</div>
          <div style="font-size: 2.2rem; margin-bottom: 0.25rem;">${slide.icon}</div>
          <h2 style="font-family: var(--font-heading); font-size: 1.75rem; color: var(--color-sunflower-gold); margin-bottom: 0.5rem; line-height: 1.2;">
            ${slide.title}
          </h2>
          
          ${slide.dates ? `<div style="font-family: var(--font-numbers); font-size: 0.85rem; color: var(--color-lilac); margin-bottom: 0.5rem;">${slide.dates}</div>` : ''}
          ${slide.bigNumber ? `
            <div style="margin: 0.85rem 0;">
              <span class="giant-number" style="font-size: 3.5rem;">${slide.bigNumber}</span>
              <div style="font-size: 0.95rem; color: var(--color-light-yellow);">${slide.unit || ''}</div>
            </div>
          ` : ''}
          ${slide.customHtml ? slide.customHtml : ''}
          ${slide.bodyText ? `<p style="font-size: 0.92rem; color: var(--color-text-secondary); line-height: 1.5; margin: 0.75rem 0;">${slide.bodyText}</p>` : ''}
          ${slide.narrative ? `
            <div style="font-family: var(--font-heading); font-style: italic; font-size: 1.18rem; color: var(--color-text-main); margin-top: 0.9rem; line-height: 1.4; border-left: 2px solid var(--color-sunflower-gold); padding-left: 0.75rem; text-align: left;">
              ${slide.narrative}
            </div>
          ` : ''}
          ${slide.footerInfo ? `
            <div style="font-size: 0.78rem; color: var(--color-text-muted); margin-top: 1.2rem;">
              ${slide.footerInfo}
            </div>
          ` : ''}
        `;

        startProgressTimer();
      };

      const startProgressTimer = () => {
        if (timerId) clearInterval(timerId);
        if (isPaused) return;

        const currentFill = document.getElementById(`story-seg-fill-${currentIndex}`);
        let startTime = Date.now();

        timerId = setInterval(() => {
          if (isPaused) {
            startTime += 50;
            return;
          }
          const elapsed = Date.now() - startTime;
          const pct = Math.min((elapsed / slideDuration) * 100, 100);
          if (currentFill) currentFill.style.width = `${pct}%`;

          if (elapsed >= slideDuration) {
            clearInterval(timerId);
            if (currentIndex < slides.length - 1) {
              renderSlide(currentIndex + 1);
            } else {
              closeStory();
            }
          }
        }, 30);
      };

      const nextSlide = () => {
        if (currentIndex < slides.length - 1) {
          renderSlide(currentIndex + 1);
        } else {
          closeStory();
        }
      };

      const prevSlide = () => {
        if (currentIndex > 0) {
          renderSlide(currentIndex - 1);
        } else {
          renderSlide(0);
        }
      };

      const togglePause = () => {
        isPaused = !isPaused;
        btnPause.textContent = isPaused ? "▶ Reanudar" : "⏸ Pausar";
      };

      const openStory = () => {
        modal.classList.add("active");
        currentIndex = 0;
        isPaused = false;
        btnPause.textContent = "⏸ Pausar";
        renderSlide(0);
      };

      const closeStory = () => {
        modal.classList.remove("active");
        if (timerId) clearInterval(timerId);
      };

      btnOpen.addEventListener("click", openStory);
      btnClose.addEventListener("click", closeStory);
      btnNext.addEventListener("click", nextSlide);
      btnPrev.addEventListener("click", prevSlide);
      btnPause.addEventListener("click", togglePause);
      touchNext.addEventListener("click", nextSlide);
      touchPrev.addEventListener("click", prevSlide);

      window.addEventListener("keydown", (e) => {
        if (!modal.classList.contains("active")) return;
        if (e.key === "Escape") closeStory();
        if (e.key === "ArrowRight" || e.key === " ") nextSlide();
        if (e.key === "ArrowLeft") prevSlide();
      });
    }

    initCounterAnimations() {
      const counters = document.querySelectorAll(".animate-counter");
      if (!counters.length) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.target, 10);
            if (!isNaN(target)) {
              window.animateCounter(entry.target, target, 2000, false);
            }
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });

      counters.forEach(c => observer.observe(c));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.paticoApp = new PaticoApp();
  });
})();

