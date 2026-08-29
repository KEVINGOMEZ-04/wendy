/**
 * Patico Wrapped 🌻 - Capa de Persistencia Local (LocalStorage)
 */

(function() {
  const INITIAL_DATA = {
    memories: [
      {
        id: 'demo-memory-1',
        date: '2026-02-14',
        title: 'Nuestro primer picnic',
        description: 'Bajo la sombra de los árboles, compartiendo risas, fresas y la promesa silenciosa de que este era solo el comienzo de nuestra historia.',
        photo: '',
        status: 'Destacado',
        createdAt: '2026-02-14T15:30:00.000Z',
        updatedAt: '2026-02-14T15:30:00.000Z',
        isDemo: true
      }
    ],

    movies: [
      {
        id: 'demo-movie-1',
        title: 'Elementos',
        year: 2023,
        proposedBy: 'Kevin',
        priority: 5,
        status: 'Me encantó',
        kevinRating: 10,
        wendyRating: 10,
        kevinComment: 'La película donde empezó a escribirse lo nuestro.',
        wendyComment: 'Nuestra primera película juntos, inolvidable.',
        poster: '',
        synopsis: 'En una ciudad donde conviven los residentes de fuego, agua, tierra y aire, una joven apasionada y un chico que se deja llevar descubren cuánto tienen en común.',
        platforms: ['Disney+'],
        imdbRating: '7.0',
        imdbUrl: 'https://www.imdb.com/title/tt15789038/',
        addedAt: '2026-01-10T20:00:00.000Z',
        watchedAt: '2026-01-15T22:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-movie-2',
        title: 'Enredados',
        year: 2010,
        proposedBy: 'Wendy',
        priority: 5,
        status: 'Vista',
        kevinRating: 9.5,
        wendyRating: 10,
        kevinComment: 'La escena de las linternas flotantes nos recordó nuestro propio brillo.',
        wendyComment: 'Ver la luz y los girasoles brillar juntos.',
        poster: '',
        synopsis: 'La princesa Rapunzel, de largo y mágico cabello dorado, ha estado encerrada en una torre durante toda su vida. Cuando un astuto ladrón se topa con ella, hacen un trato para escapar al mundo exterior.',
        platforms: ['Disney+'],
        imdbRating: '7.7',
        imdbUrl: 'https://www.imdb.com/title/tt0398286/',
        addedAt: '2026-02-01T18:00:00.000Z',
        watchedAt: '2026-02-10T21:30:00.000Z',
        isDemo: true
      }
    ],

    notes: [
      {
        id: 'demo-note-1',
        author: 'Kevin',
        message: 'Gracias por convertir cada día ordinario en algo que merece ser recordado con una sonrisa.',
        createdAt: '2026-02-14T09:15:00.000Z',
        updatedAt: '2026-02-14T09:15:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-note-2',
        author: 'Wendy',
        message: 'Me encanta que el camino que estamos construyendo esté lleno de girasoles y noches compartidas.',
        createdAt: '2026-02-14T11:40:00.000Z',
        updatedAt: '2026-02-14T11:40:00.000Z',
        isDemo: true
      }
    ],

    dreams: [
      {
        id: 'demo-dream-1',
        title: 'Ver una lluvia de estrellas',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-dream-2',
        title: 'Viajar juntos',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-dream-3',
        title: 'Aprender algo nuevo',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      },
      {
        id: 'demo-dream-4',
        title: 'Ver 100 películas',
        status: 'Pendiente',
        createdAt: '2026-01-01T00:00:00.000Z',
        completedAt: null,
        updatedAt: '2026-01-01T00:00:00.000Z',
        isDemo: true
      }
    ],
    songs: []
  };

  class StorageManager {
    constructor() {
      this.keys = window.CONFIG.storageKeys;
      this.listeners = [];
      this.remoteKeys = ['memories', 'movies', 'notes', 'dreams', 'songs'];
      this.remoteRef = null;
      this.initDefaults();
      this.initRemoteSync();
    }

    initDefaults() {
      if (!localStorage.getItem(this.keys.memories)) {
        this.set(this.keys.memories, INITIAL_DATA.memories);
      }
      if (!localStorage.getItem(this.keys.movies)) {
        this.set(this.keys.movies, INITIAL_DATA.movies);
      }
      if (!localStorage.getItem(this.keys.notes)) {
        this.set(this.keys.notes, INITIAL_DATA.notes);
      }
      if (!localStorage.getItem(this.keys.dreams)) {
        this.set(this.keys.dreams, INITIAL_DATA.dreams);
      }
      if (!localStorage.getItem(this.keys.songs)) this.set(this.keys.songs, INITIAL_DATA.songs);
      if (!localStorage.getItem(this.keys.currentUser)) {
        localStorage.setItem(this.keys.currentUser, window.CONFIG.defaultUser);
      }
    }

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error(`Error leyendo clave ${key} de localStorage:`, e);
        return defaultValue;
      }
    }

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        this.notify(key);
        const remoteName = Object.keys(this.keys).find(name => this.keys[name] === key);
        if (this.remoteRef && this.remoteKeys.includes(remoteName)) {
          this.remoteRef.child(remoteName).set(value).catch(error => console.error('No se pudo sincronizar:', error));
        }
        return true;
      } catch (e) {
        console.error(`Error guardando clave ${key} en localStorage:`, e);
        return false;
      }
    }

    subscribe(listener) { this.listeners.push(listener); return () => { this.listeners = this.listeners.filter(item => item !== listener); }; }
    notify(key) { this.listeners.forEach(listener => listener(key)); }

    initRemoteSync() {
      const config = window.CONFIG.presence;
      if (config.provider !== 'firebase' || !config.firebaseConfig?.databaseURL || !window.firebase) return;
      try {
        if (!firebase.apps.length) firebase.initializeApp(config.firebaseConfig);
        this.remoteRef = firebase.database().ref(`rooms/${config.roomId}/journal`);
        this.remoteRef.once('value').then(snapshot => {
          if (snapshot.val()) return;
          const initial = {};
          this.remoteKeys.forEach(name => { initial[name] = this.get(this.keys[name], []); });
          return this.remoteRef.set(initial);
        }).catch(error => console.error('No se pudo iniciar la base de datos:', error));
        this.remoteRef.on('value', snapshot => {
          const data = snapshot.val();
          if (!data) return;
          this.remoteKeys.forEach(name => {
            if (Array.isArray(data[name])) {
              localStorage.setItem(this.keys[name], JSON.stringify(data[name]));
              this.notify(this.keys[name]);
            }
          });
        });
      } catch (error) { console.error('Firebase no pudo inicializarse:', error); this.remoteRef = null; }
    }

    isUnlocked() {
      return localStorage.getItem(this.keys.unlocked) === 'true';
    }

    setUnlocked(unlocked) {
      if (unlocked) {
        localStorage.setItem(this.keys.unlocked, 'true');
      } else {
        localStorage.removeItem(this.keys.unlocked);
      }
    }

    getCurrentUser() {
      return localStorage.getItem(this.keys.currentUser) || window.CONFIG.defaultUser;
    }

    setCurrentUser(user) {
      if (window.CONFIG.users.includes(user)) {
        localStorage.setItem(this.keys.currentUser, user);
        return true;
      }
      return false;
    }

    getCredentials() { return this.get(this.keys.credentials, {}); }

    async hashPassword(password) {
      const bytes = new TextEncoder().encode(password);
      const hash = await crypto.subtle.digest('SHA-256', bytes);
      return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async verifyCredentials(username, password) {
      if (!window.CONFIG.users.includes(username) || !password) return false;
      const credentials = this.getCredentials();
      if (!credentials[username]) {
        credentials[username] = { passwordHash: await this.hashPassword('1234') };
        this.set(this.keys.credentials, credentials);
      }
      return credentials[username].passwordHash === await this.hashPassword(password);
    }

    async changePassword(username, currentPassword, newPassword) {
      if (newPassword.length < 4 || !(await this.verifyCredentials(username, currentPassword))) return false;
      const credentials = this.getCredentials();
      credentials[username] = { passwordHash: await this.hashPassword(newPassword) };
      return this.set(this.keys.credentials, credentials);
    }

    getMemories() {
      return this.get(this.keys.memories, []);
    }

    saveMemory(memoryData) {
      const list = this.getMemories();
      const now = new Date().toISOString();

      if (memoryData.id) {
        const index = list.findIndex(m => m.id === memoryData.id);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            ...memoryData,
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const newMemory = {
          id: window.Utils.generateUUID(),
          date: memoryData.date,
          title: memoryData.title.trim(),
          description: memoryData.description.trim(),
          photo: memoryData.photo || '',
          status: memoryData.status || 'Guardado',
          createdAt: now,
          updatedAt: now,
          isDemo: false
        };
        list.push(newMemory);
      }

      this.set(this.keys.memories, list);
      return list;
    }

    deleteMemory(id) {
      const list = this.getMemories().filter(m => m.id !== id);
      this.set(this.keys.memories, list);
      return list;
    }

    getMovies() {
      const list = this.get(this.keys.movies, []);
      return list.map(m => ({
        ...m,
        status: m.status === 'Favorita' ? 'Me encantó' : (m.status || 'Por ver'),
        platforms: Array.isArray(m.platforms) ? m.platforms : (typeof m.platforms === 'string' && m.platforms ? m.platforms.split(',').map(s => s.trim()).filter(Boolean) : [])
      }));
    }

    saveMovie(movieData) {
      const list = this.getMovies();
      const now = new Date().toISOString();

      const kevinScore = movieData.kevinRating !== '' && movieData.kevinRating !== null && movieData.kevinRating !== undefined
        ? parseFloat(movieData.kevinRating)
        : null;
      const wendyScore = movieData.wendyRating !== '' && movieData.wendyRating !== null && movieData.wendyRating !== undefined
        ? parseFloat(movieData.wendyRating)
        : null;

      const normalizedStatus = movieData.status === 'Favorita' ? 'Me encantó' : (movieData.status || 'Por ver');
      let platforms = movieData.platforms || [];
      if (typeof platforms === 'string') {
        platforms = platforms.split(',').map(s => s.trim()).filter(Boolean);
      }

      if (movieData.id) {
        const index = list.findIndex(m => m.id === movieData.id);
        if (index !== -1) {
          const existing = list[index];
          list[index] = {
            ...existing,
            title: movieData.title.trim(),
            year: parseInt(movieData.year, 10) || existing.year || new Date().getFullYear(),
            proposedBy: movieData.proposedBy || existing.proposedBy || 'Kevin',
            priority: parseInt(movieData.priority, 10) || existing.priority || 5,
            status: normalizedStatus,
            kevinRating: kevinScore,
            wendyRating: wendyScore,
            kevinComment: movieData.kevinComment ? movieData.kevinComment.trim() : '',
            wendyComment: movieData.wendyComment ? movieData.wendyComment.trim() : '',
            poster: movieData.poster !== undefined ? movieData.poster : (existing.poster || ''),
            synopsis: movieData.synopsis !== undefined ? movieData.synopsis : (existing.synopsis || ''),
            platforms: platforms.length ? platforms : (existing.platforms || []),
            imdbRating: movieData.imdbRating !== undefined ? movieData.imdbRating : (existing.imdbRating || ''),
            imdbUrl: movieData.imdbUrl !== undefined ? movieData.imdbUrl : (existing.imdbUrl || ''),
            watchedAt: (normalizedStatus === 'Vista' || normalizedStatus === 'Me encantó')
              ? (existing.watchedAt || now)
              : null,
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const newMovie = {
          id: window.Utils.generateUUID(),
          title: movieData.title.trim(),
          year: parseInt(movieData.year, 10) || new Date().getFullYear(),
          proposedBy: movieData.proposedBy || 'Kevin',
          priority: parseInt(movieData.priority, 10) || 5,
          status: normalizedStatus,
          kevinRating: kevinScore,
          wendyRating: wendyScore,
          kevinComment: movieData.kevinComment ? movieData.kevinComment.trim() : '',
          wendyComment: movieData.wendyComment ? movieData.wendyComment.trim() : '',
          poster: movieData.poster || '',
          synopsis: movieData.synopsis || '',
          platforms: platforms,
          imdbRating: movieData.imdbRating || '',
          imdbUrl: movieData.imdbUrl || '',
          addedAt: now,
          watchedAt: (normalizedStatus === 'Vista' || normalizedStatus === 'Me encantó') ? now : null,
          updatedAt: now,
          isDemo: false
        };
        list.push(newMovie);
      }

      this.set(this.keys.movies, list);
      return list;
    }

    deleteMovie(id) {
      const list = this.getMovies().filter(m => m.id !== id);
      this.set(this.keys.movies, list);
      return list;
    }

    getSongs() {
      return this.get(this.keys.songs, []).map(song => ({
        ...song,
        lyrics: song.lyrics || ''
      }));
    }

    saveSong(songData) {
      const list = this.getSongs();
      const now = new Date().toISOString();
      const cleanSong = {
        title: songData.title ? songData.title.trim() : 'Canción',
        artist: songData.artist ? songData.artist.trim() : 'Artista',
        cover: songData.cover ? songData.cover.trim() : '',
        lyrics: songData.lyrics ? songData.lyrics.trim() : '',
        spotifyUrl: songData.spotifyUrl ? songData.spotifyUrl.trim() : window.MediaService.spotifyUrl(songData.title, songData.artist),
        youtubeUrl: songData.youtubeUrl ? songData.youtubeUrl.trim() : window.MediaService.youtubeUrl(songData.title, songData.artist),
        lyricsUrl: songData.lyricsUrl ? songData.lyricsUrl.trim() : window.MediaService.geniusUrl(songData.title, songData.artist),
        proposedBy: songData.proposedBy || window.storage?.getCurrentUser() || 'Kevin'
      };

      if (songData.id) {
        const index = list.findIndex(song => song.id === songData.id);
        if (index !== -1) {
          list[index] = { ...list[index], ...cleanSong, updatedAt: now };
        }
      } else {
        list.unshift({ ...cleanSong, id: window.Utils.generateUUID(), addedAt: now, updatedAt: now });
      }
      this.set(this.keys.songs, list);
      return list;
    }

    deleteSong(id) {
      const list = this.getSongs().filter(song => song.id !== id);
      this.set(this.keys.songs, list);
      return list;
    }

    getNotes() {
      return this.get(this.keys.notes, []);
    }

    saveNote(noteData) {
      const list = this.getNotes();
      const now = new Date().toISOString();

      if (noteData.id) {
        const index = list.findIndex(n => n.id === noteData.id);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            author: noteData.author,
            message: noteData.message.trim(),
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const newNote = {
          id: window.Utils.generateUUID(),
          author: noteData.author,
          message: noteData.message.trim(),
          createdAt: now,
          updatedAt: now,
          isDemo: false
        };
        list.push(newNote);
      }

      this.set(this.keys.notes, list);
      return list;
    }

    deleteNote(id) {
      const list = this.getNotes().filter(n => n.id !== id);
      this.set(this.keys.notes, list);
      return list;
    }

    getDreams() {
      return this.get(this.keys.dreams, []);
    }

    saveDream(dreamData) {
      const list = this.getDreams();
      const now = new Date().toISOString();

      if (dreamData.id) {
        const index = list.findIndex(d => d.id === dreamData.id);
        if (index !== -1) {
          const existing = list[index];
          const isCompleted = dreamData.status === 'Cumplido';
          list[index] = {
            ...existing,
            title: dreamData.title.trim(),
            status: dreamData.status,
            completedAt: isCompleted ? (existing.completedAt || now) : null,
            updatedAt: now,
            isDemo: false
          };
        }
      } else {
        const isCompleted = dreamData.status === 'Cumplido';
        const newDream = {
          id: window.Utils.generateUUID(),
          title: dreamData.title.trim(),
          status: dreamData.status || 'Pendiente',
          createdAt: now,
          completedAt: isCompleted ? now : null,
          updatedAt: now,
          isDemo: false
        };
        list.push(newDream);
      }

      this.set(this.keys.dreams, list);
      return list;
    }

    toggleDreamStatus(id) {
      const list = this.getDreams();
      const now = new Date().toISOString();
      const index = list.findIndex(d => d.id === id);
      let justCompleted = false;

      if (index !== -1) {
        const dream = list[index];
        if (dream.status === 'Pendiente') {
          dream.status = 'Cumplido';
          dream.completedAt = now;
          justCompleted = true;
        } else {
          dream.status = 'Pendiente';
          dream.completedAt = null;
        }
        dream.updatedAt = now;
        this.set(this.keys.dreams, list);
      }
      return { list, justCompleted };
    }

    deleteDream(id) {
      const list = this.getDreams().filter(d => d.id !== id);
      this.set(this.keys.dreams, list);
      return list;
    }
  }

  window.storage = new StorageManager();
})();
