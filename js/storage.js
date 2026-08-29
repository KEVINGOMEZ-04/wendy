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
      this.initCloudSync();
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
          this.remoteRef.child(remoteName).set(value).catch(error => console.error('Error al sincronizar con Firebase:', error));
        }
        // Solo programar subida a GitHub si Firebase NO está activo
        if (window.CONFIG.presence?.provider !== 'firebase' && this.remoteKeys.includes(remoteName) && this.scheduleCloudPush) {
          this.scheduleCloudPush();
        }
        return true;
      } catch (e) {
        console.error(`Error guardando clave ${key} en localStorage:`, e);
        return false;
      }
    }

    subscribe(listener) { this.listeners.push(listener); return () => { this.listeners = this.listeners.filter(item => item !== listener); }; }
    notify(key) { this.listeners.forEach(listener => listener(key)); }

    // --- Sincronización en la Nube con GitHub & Cloud Engine ---
    initCloudSync() {
      this.cloudConfig = window.CONFIG.cloudSync || {};
      this.lastCloudSyncTime = null;
      this.isSyncing = false;
      this.lastFileSha = null;
      this.pendingPushTimeout = null;

      // Si Firebase está activo, Firebase maneja el tiempo real. No hacemos polling redundante a GitHub.
      if (window.CONFIG.presence?.provider === 'firebase') {
        return;
      }

      // Cargar datos de la nube inmediatamente
      setTimeout(() => {
        this.syncCloudPull().catch(e => console.warn('Auto-pull inicial diferido:', e));
      }, 500);

      // Sincronización periódica cada intervalo
      if (this.cloudConfig.enabled && this.cloudConfig.syncIntervalMs) {
        setInterval(() => {
          if (!this.isSyncing) {
            this.syncCloudPull().catch(e => console.warn('Sync background pull:', e));
          }
        }, this.cloudConfig.syncIntervalMs);
      }
    }

    notifySyncState(state, message = '') {
      if (this.onSyncStateChange) {
        this.onSyncStateChange({
          state,
          message,
          lastSync: this.lastCloudSyncTime,
          isSyncing: this.isSyncing
        });
      }
    }

    async syncCloudPull() {
      if (!this.cloudConfig || !this.cloudConfig.enabled) return null;
      this.isSyncing = true;
      this.notifySyncState('syncing');

      try {
        const { repoOwner, repoName, filePath, branch, token } = this.cloudConfig;
        const headers = {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Patico-App'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        let remoteData = null;
        let fileSha = null;

        // Intento 1: GitHub API pública
        try {
          const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch || 'main'}&t=${Date.now()}`;
          const response = await fetch(url, { headers });
          if (response.ok) {
            const data = await response.json();
            fileSha = data.sha;
            const binaryStr = atob(data.content.replace(/\s/g, ''));
            const bytes = new Uint8Array(binaryStr.length);
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }
            const jsonText = new TextDecoder('utf-8').decode(bytes);
            remoteData = JSON.parse(jsonText);
          }
        } catch (apiErr) {
          console.warn('Fallo consulta API GitHub, intentando archivo local:', apiErr);
        }

        // Intento 2: Archivo estático relativo
        if (!remoteData) {
          try {
            const staticRes = await fetch(`./${filePath}?t=${Date.now()}`);
            if (staticRes.ok) {
              remoteData = await staticRes.json();
            }
          } catch(statErr) {}
        }

        if (!remoteData) {
          this.isSyncing = false;
          this.notifySyncState('synced');
          return { success: false, error: 'No se pudo contactar el servidor' };
        }

        if (fileSha) this.lastFileSha = fileSha;

        let hasChanges = false;
        this.remoteKeys.forEach(name => {
          if (Array.isArray(remoteData[name])) {
            const localList = this.get(this.keys[name], []);
            const mergedList = this.mergeDataLists(localList, remoteData[name]);
            if (JSON.stringify(localList) !== JSON.stringify(mergedList)) {
              localStorage.setItem(this.keys[name], JSON.stringify(mergedList));
              this.notify(this.keys[name]);
              hasChanges = true;
            }
          }
        });

        this.lastCloudSyncTime = new Date();
        this.isSyncing = false;
        this.notifySyncState('synced');
        return { success: true, hasChanges, lastSync: this.lastCloudSyncTime };
      } catch (error) {
        console.error('Error en syncCloudPull:', error);
        this.isSyncing = false;
        this.notifySyncState('error', error.message);
        return { success: false, error: error.message };
      }
    }

    async syncCloudPush() {
      if (!this.cloudConfig || !this.cloudConfig.enabled || !this.cloudConfig.token) return null;
      this.isSyncing = true;
      this.notifySyncState('syncing');

      try {
        const { repoOwner, repoName, filePath, branch, token } = this.cloudConfig;
        
        // 1. Obtener SHA actual si no lo tenemos
        if (!this.lastFileSha) {
          try {
            const checkRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch || 'main'}`, {
              headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              this.lastFileSha = checkData.sha;
            }
          } catch(e) {}
        }

        const payload = {
          version: '1.0',
          updatedAt: new Date().toISOString(),
          updatedBy: this.getCurrentUser(),
          memories: this.get(this.keys.memories, []),
          movies: this.get(this.keys.movies, []),
          notes: this.get(this.keys.notes, []),
          dreams: this.get(this.keys.dreams, []),
          songs: this.get(this.keys.songs, [])
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        // UTF-8 a Base64 seguro
        const bytes = new TextEncoder().encode(jsonStr);
        let binaryStr = '';
        bytes.forEach(b => binaryStr += String.fromCharCode(b));
        const base64Content = btoa(binaryStr);

        const bodyData = {
          message: `sync: Actualizar recuerdos y diario (${this.getCurrentUser()})`,
          content: base64Content,
          branch: branch || 'main'
        };
        if (this.lastFileSha) bodyData.sha = this.lastFileSha;

        const putRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Patico-App'
          },
          body: JSON.stringify(bodyData)
        });

        if (!putRes.ok) {
          if (putRes.status === 409 || putRes.status === 422) {
            this.lastFileSha = null;
            await this.syncCloudPull();
            return await this.syncCloudPush();
          }
          throw new Error(`Error ${putRes.status} al subir a la nube`);
        }

        const resData = await putRes.json();
        this.lastFileSha = resData.content?.sha || null;
        this.lastCloudSyncTime = new Date();
        this.isSyncing = false;
        this.notifySyncState('synced');
        return { success: true, lastSync: this.lastCloudSyncTime };
      } catch (error) {
        console.error('Error en syncCloudPush:', error);
        this.isSyncing = false;
        this.notifySyncState('error', error.message);
        return { success: false, error: error.message };
      }
    }

    scheduleCloudPush() {
      if (this.pendingPushTimeout) clearTimeout(this.pendingPushTimeout);
      this.pendingPushTimeout = setTimeout(() => {
        this.syncCloudPush().catch(e => console.warn('Background push error:', e));
      }, 1500);
    }

    mergeDataLists(localList, remoteList) {
      const mergedMap = new Map();
      
      remoteList.forEach(item => {
        if (item && item.id) mergedMap.set(item.id, item);
      });

      localList.forEach(item => {
        if (!item || !item.id) return;
        if (!mergedMap.has(item.id)) {
          mergedMap.set(item.id, item);
        } else {
          const remoteItem = mergedMap.get(item.id);
          const localTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
          const remoteTime = new Date(remoteItem.updatedAt || remoteItem.createdAt || 0).getTime();
          if (localTime >= remoteTime) {
            mergedMap.set(item.id, item);
          }
        }
      });

      return Array.from(mergedMap.values());
    }

    exportTransferCode() {
      const data = {
        timestamp: Date.now(),
        user: this.getCurrentUser(),
        memories: this.get(this.keys.memories, []),
        movies: this.get(this.keys.movies, []),
        notes: this.get(this.keys.notes, []),
        dreams: this.get(this.keys.dreams, []),
        songs: this.get(this.keys.songs, [])
      };
      const json = JSON.stringify(data);
      const bytes = new TextEncoder().encode(json);
      let binary = '';
      bytes.forEach(b => binary += String.fromCharCode(b));
      return 'PATICO_SYNC::' + btoa(binary);
    }

    importTransferCode(codeString) {
      if (!codeString || typeof codeString !== 'string') return { success: false, error: 'Código vacío o inválido' };
      try {
        const clean = codeString.trim();
        const rawB64 = clean.startsWith('PATICO_SYNC::') ? clean.slice(13) : clean;
        
        const binary = atob(rawB64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const json = new TextDecoder('utf-8').decode(bytes);
        const imported = JSON.parse(json);

        let importedCount = 0;
        this.remoteKeys.forEach(name => {
          if (Array.isArray(imported[name])) {
            const current = this.get(this.keys[name], []);
            const merged = this.mergeDataLists(current, imported[name]);
            this.set(this.keys[name], merged);
            importedCount += imported[name].length;
          }
        });

        this.scheduleCloudPush();
        return { success: true, count: importedCount };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    initRemoteSync() {
      const config = window.CONFIG.presence;
      if (config.provider !== 'firebase' || !config.firebaseConfig?.databaseURL || !window.firebase) return;
      try {
        if (!firebase.apps.length) firebase.initializeApp(config.firebaseConfig);
        const db = firebase.database();
        this.remoteRef = db.ref(`rooms/${config.roomId}/journal`);
        this.profilesRef = db.ref(`rooms/${config.roomId}/profiles`);
        this.presenceRef = db.ref(`rooms/${config.roomId}/presence`);
        this.nudgeRef = db.ref(`rooms/${config.roomId}/nudge`);
        
        // Handshake inicial
        this.remoteRef.once('value').then(snapshot => {
          const val = snapshot.val();
          if (!val) {
            const initial = {};
            this.remoteKeys.forEach(name => { initial[name] = this.get(this.keys[name], []); });
            return this.remoteRef.set(initial);
          } else {
            let hasNew = false;
            this.remoteKeys.forEach(name => {
              if (Array.isArray(val[name])) {
                const currentStr = localStorage.getItem(this.keys[name]);
                const newStr = JSON.stringify(val[name]);
                if (currentStr !== newStr) {
                  localStorage.setItem(this.keys[name], newStr);
                  this.notify(this.keys[name]);
                  hasNew = true;
                }
              }
            });
            this.lastCloudSyncTime = new Date();
            this.notifySyncState('synced');
            if (this.onRemoteReady) this.onRemoteReady();
          }
        }).catch(error => console.error('No se pudo iniciar Firebase Realtime Database:', error));

        // Escucha activa en tiempo real de datos del diario
        this.remoteRef.on('value', snapshot => {
          const data = snapshot.val();
          if (!data) return;
          this.remoteKeys.forEach(name => {
            if (Array.isArray(data[name])) {
              const currentStr = localStorage.getItem(this.keys[name]);
              const newStr = JSON.stringify(data[name]);
              if (currentStr !== newStr) {
                localStorage.setItem(this.keys[name], newStr);
                this.notify(this.keys[name]);
              }
            }
          });
          this.lastCloudSyncTime = new Date();
          this.notifySyncState('synced');
          if (this.onRemoteReady) this.onRemoteReady();
        });

        // Escucha de perfiles y apodos
        this.profilesRef.on('value', snapshot => {
          const remoteProfiles = snapshot.val();
          if (remoteProfiles) {
            localStorage.setItem(this.keys.profiles, JSON.stringify(remoteProfiles));
            this.notify(this.keys.profiles);
            if (this.onProfilesChange) this.onProfilesChange(remoteProfiles);
          }
        });

        // Escucha de Presencia estilo WhatsApp (Online / Última vez)
        this.initPresenceListeners();

        // Escucha de credenciales personalizadas
        this.credentialsRef = db.ref(`rooms/${config.roomId}/credentials`);
        this.credentialsRef.on('value', snapshot => {
          const creds = snapshot.val();
          if (creds && typeof creds === 'object') {
            localStorage.setItem(this.keys.credentials, JSON.stringify(creds));
          }
        });

        // Escucha de Toquecito de Amor (Nudge)
        let lastNudgeTime = Date.now();
        this.nudgeRef.on('value', snapshot => {
          const nudge = snapshot.val();
          if (nudge && nudge.timestamp && nudge.timestamp > lastNudgeTime) {
            lastNudgeTime = nudge.timestamp;
            if (nudge.from && nudge.from !== this.getCurrentUser()) {
              if (this.onNudgeReceived) this.onNudgeReceived(nudge);
            }
          }
        });

      } catch (error) {
        console.error('Firebase no pudo inicializarse:', error);
        this.remoteRef = null;
      }
    }

    initPresenceListeners() {
      if (!window.firebase || !window.CONFIG.presence?.firebaseConfig) return;
      const db = firebase.database();
      const config = window.CONFIG.presence;
      const connectedRef = db.ref('.info/connected');

      connectedRef.on('value', snap => {
        if (snap.val() === true) {
          const currentUser = this.getCurrentUser();
          const myPresenceRef = db.ref(`rooms/${config.roomId}/presence/${currentUser}`);
          
          myPresenceRef.onDisconnect().set({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
          }).then(() => {
            myPresenceRef.set({
              online: true,
              lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
          });
        }
      });

      // Escuchar presencia de Kevin y Wendy
      this.presenceRef.on('value', snap => {
        const presence = snap.val() || {};
        this.presenceState = presence;
        if (this.onPresenceUpdate) this.onPresenceUpdate(presence);
      });
    }

    sendNudge() {
      if (!this.nudgeRef) return false;
      const currentUser = this.getCurrentUser();
      const profiles = this.getProfiles();
      const senderNickname = profiles[currentUser]?.nickname || currentUser;

      const nudgeData = {
        from: currentUser,
        fromNickname: senderNickname,
        timestamp: Date.now(),
        id: window.Utils.generateUUID()
      };
      this.nudgeRef.set(nudgeData).catch(e => console.warn('Error enviando toquecito:', e));
      return true;
    }

    getProfiles() {
      const defaultProfiles = {
        Kevin: {
          name: 'Kevin',
          nickname: 'Kevin',
          avatar: '',
          color: '#00E5FF'
        },
        Wendy: {
          name: 'Wendy',
          nickname: 'Patico ♥️',
          avatar: '',
          color: '#E040FB'
        }
      };
      const stored = this.get(this.keys.profiles, defaultProfiles);
      return {
        Kevin: { ...defaultProfiles.Kevin, ...(stored?.Kevin || {}) },
        Wendy: { ...defaultProfiles.Wendy, ...(stored?.Wendy || {}) }
      };
    }

    saveProfiles(profilesData) {
      const current = this.getProfiles();
      const updated = {
        Kevin: { ...current.Kevin, ...(profilesData.Kevin || {}) },
        Wendy: { ...current.Wendy, ...(profilesData.Wendy || {}) }
      };
      this.set(this.keys.profiles, updated);
      if (this.profilesRef) {
        this.profilesRef.set(updated).catch(e => console.warn('Error guardando perfiles en Firebase:', e));
      }
      return updated;
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
      if (!username || !window.CONFIG.users.includes(username)) {
        return false;
      }
      if (!password || typeof password !== 'string') {
        return false;
      }
      const trimmed = password.trim();
      if (!trimmed) {
        return false;
      }

      const credentials = this.getCredentials();
      const userCred = credentials[username];

      // Si el usuario ya tiene una contraseña personalizada guardada
      if (userCred && userCred.passwordHash) {
        const hash = await this.hashPassword(trimmed);
        return userCred.passwordHash === hash;
      }

      // Si aún no ha cambiado su contraseña, la clave por defecto es 1234
      return trimmed === '1234';
    }

    async changePassword(username, currentPassword, newPassword) {
      if (!newPassword || newPassword.length < 4 || !(await this.verifyCredentials(username, currentPassword))) {
        return false;
      }
      const credentials = this.getCredentials();
      credentials[username] = { passwordHash: await this.hashPassword(newPassword.trim()) };
      const saved = this.set(this.keys.credentials, credentials);
      if (this.credentialsRef) {
        this.credentialsRef.set(credentials).catch(e => console.warn('Error sincronizando credenciales:', e));
      }
      return saved;
    }

    getMemories() {
      const list = this.get(this.keys.memories, []);
      return list.map(m => ({
        ...m,
        author: m.author || 'Kevin',
        color: m.color || '#F4C542',
        coverMedia: m.coverMedia || m.photo || '',
        coverType: m.coverType || (m.coverMedia && m.coverMedia.match(/\.(mp4|webm|ogg|mov)$/i) ? 'video' : 'image'),
        gallery: Array.isArray(m.gallery) ? m.gallery : [],
        comments: Array.isArray(m.comments) ? m.comments : []
      }));
    }

    saveMemory(memoryData) {
      const list = this.getMemories();
      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();

      if (memoryData.id) {
        const index = list.findIndex(m => m.id === memoryData.id);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            ...memoryData,
            author: list[index].author || memoryData.author || currentUser,
            color: memoryData.color || list[index].color || '#F4C542',
            coverMedia: memoryData.coverMedia !== undefined ? memoryData.coverMedia : (list[index].coverMedia || ''),
            coverType: memoryData.coverType || list[index].coverType || 'image',
            gallery: Array.isArray(memoryData.gallery) ? memoryData.gallery : (list[index].gallery || []),
            comments: Array.isArray(memoryData.comments) ? memoryData.comments : (list[index].comments || []),
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
          author: memoryData.author || currentUser,
          color: memoryData.color || '#F4C542',
          coverMedia: memoryData.coverMedia || memoryData.photo || '',
          coverType: memoryData.coverType || 'image',
          gallery: Array.isArray(memoryData.gallery) ? memoryData.gallery : [],
          comments: Array.isArray(memoryData.comments) ? memoryData.comments : [],
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

    addMemoryComment(memoryId, commentData) {
      const list = this.getMemories();
      const index = list.findIndex(m => m.id === memoryId);
      if (index === -1) return null;

      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      const newComment = {
        id: window.Utils.generateUUID(),
        author: commentData.author || currentUser,
        message: commentData.message.trim(),
        createdAt: now
      };

      if (!Array.isArray(list[index].comments)) {
        list[index].comments = [];
      }
      list[index].comments.push(newComment);
      list[index].updatedAt = now;

      this.set(this.keys.memories, list);
      return newComment;
    }

    deleteMemoryComment(memoryId, commentId) {
      const list = this.getMemories();
      const index = list.findIndex(m => m.id === memoryId);
      if (index === -1) return false;

      if (Array.isArray(list[index].comments)) {
        list[index].comments = list[index].comments.filter(c => c.id !== commentId);
        this.set(this.keys.memories, list);
        return true;
      }
      return false;
    }

    deleteMemory(id) {
      const list = this.getMemories().filter(m => m.id !== id);
      this.set(this.keys.memories, list);
      return list;
    }

    getMovies() {
      return this.get(this.keys.movies, []).map(m => {
        const kRating = m.kevinRating !== null && m.kevinRating !== undefined && m.kevinRating !== '' ? parseFloat(m.kevinRating) : 0;
        const wRating = m.wendyRating !== null && m.wendyRating !== undefined && m.wendyRating !== '' ? parseFloat(m.wendyRating) : 0;
        const comments = Array.isArray(m.comments) ? [...m.comments] : [];
        
        if (!comments.length) {
          if (m.kevinComment) {
            comments.push({ id: 'legacy-kevin-' + m.id, author: 'Kevin', message: m.kevinComment, createdAt: m.updatedAt || m.addedAt || new Date().toISOString() });
          }
          if (m.wendyComment) {
            comments.push({ id: 'legacy-wendy-' + m.id, author: 'Wendy', message: m.wendyComment, createdAt: m.updatedAt || m.addedAt || new Date().toISOString() });
          }
        }

        return {
          ...m,
          status: m.status === 'Favorita' ? 'Me encantó' : (m.status || 'Por ver'),
          platforms: Array.isArray(m.platforms) ? m.platforms : (typeof m.platforms === 'string' && m.platforms ? m.platforms.split(',').map(s => s.trim()).filter(Boolean) : []),
          kevinRating: kRating,
          wendyRating: wRating,
          rating: m.rating || (kRating > 0 && wRating > 0 ? Math.round((kRating + wRating) / 2) : (kRating || wRating || 5)),
          comments: comments
        };
      });
    }

    saveMovie(movieData) {
      const list = this.getMovies();
      const now = new Date().toISOString();

      const kevinScore = movieData.kevinRating !== '' && movieData.kevinRating !== null && movieData.kevinRating !== undefined
        ? parseFloat(movieData.kevinRating)
        : 0;
      const wendyScore = movieData.wendyRating !== '' && movieData.wendyRating !== null && movieData.wendyRating !== undefined
        ? parseFloat(movieData.wendyRating)
        : 0;

      const normalizedStatus = movieData.status === 'Favorita' ? 'Me encantó' : (movieData.status || 'Por ver');
      let platforms = movieData.platforms || [];
      if (typeof platforms === 'string') {
        platforms = platforms.split(',').map(s => s.trim()).filter(Boolean);
      }

      const comments = Array.isArray(movieData.comments) ? movieData.comments : [];

      if (movieData.id) {
        const index = list.findIndex(m => m.id === movieData.id);
        if (index !== -1) {
          const existing = list[index];
          list[index] = {
            ...existing,
            title: movieData.title.trim(),
            year: parseInt(movieData.year, 10) || existing.year || new Date().getFullYear(),
            proposedBy: movieData.proposedBy || existing.proposedBy || this.getCurrentUser() || 'Kevin',
            priority: parseInt(movieData.priority, 10) || existing.priority || 5,
            status: normalizedStatus,
            kevinRating: kevinScore,
            wendyRating: wendyScore,
            rating: typeof movieData.rating === 'number' ? movieData.rating : (parseInt(movieData.rating, 10) || (kevinScore || wendyScore || 5)),
            comments: comments.length ? comments : (existing.comments || []),
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
          proposedBy: movieData.proposedBy || this.getCurrentUser() || 'Kevin',
          priority: parseInt(movieData.priority, 10) || 5,
          status: normalizedStatus,
          kevinRating: kevinScore,
          wendyRating: wendyScore,
          rating: typeof movieData.rating === 'number' ? movieData.rating : 5,
          comments: comments,
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

    rateMovie(movieId, ratingValue, user) {
      const list = this.getMovies();
      const index = list.findIndex(m => m.id === movieId);
      if (index === -1) return false;

      const val = Math.max(0, Math.min(5, parseInt(ratingValue, 10) || 0));
      const targetUser = user || this.getCurrentUser();
      
      if (targetUser.toLowerCase() === 'wendy') {
        list[index].wendyRating = val;
      } else {
        list[index].kevinRating = val;
      }

      const k = list[index].kevinRating || 0;
      const w = list[index].wendyRating || 0;
      if (k > 0 && w > 0) {
        list[index].rating = Math.round((k + w) / 2);
      } else {
        list[index].rating = k > 0 ? k : w;
      }

      list[index].updatedAt = new Date().toISOString();
      this.set(this.keys.movies, list);
      return list[index];
    }

    addMovieComment(movieId, commentData) {
      const list = this.getMovies();
      const index = list.findIndex(m => m.id === movieId);
      if (index === -1) return null;

      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      const newComment = {
        id: window.Utils.generateUUID(),
        author: commentData.author || currentUser,
        message: commentData.message.trim(),
        createdAt: now
      };

      if (!Array.isArray(list[index].comments)) {
        list[index].comments = [];
      }
      list[index].comments.push(newComment);
      list[index].updatedAt = now;

      this.set(this.keys.movies, list);
      return newComment;
    }

    deleteMovieComment(movieId, commentId) {
      const list = this.getMovies();
      const index = list.findIndex(m => m.id === movieId);
      if (index === -1) return false;

      if (Array.isArray(list[index].comments)) {
        list[index].comments = list[index].comments.filter(c => c.id !== commentId);
        list[index].updatedAt = new Date().toISOString();
        this.set(this.keys.movies, list);
        return true;
      }
      return false;
    }

    deleteMovie(id) {
      const list = this.getMovies().filter(m => m.id !== id);
      this.set(this.keys.movies, list);
      return list;
    }

    getSongs() {
      return this.get(this.keys.songs, []).map(song => ({
        ...song,
        lyrics: song.lyrics || '',
        previewUrl: song.previewUrl || '',
        album: song.album || '',
        year: song.year || '',
        rating: song.rating || (song.kevinRating || song.wendyRating || 5),
        kevinRating: song.kevinRating !== undefined ? song.kevinRating : 5,
        wendyRating: song.wendyRating !== undefined ? song.wendyRating : 0,
        comments: Array.isArray(song.comments) ? song.comments : []
      }));
    }

    saveSong(songData) {
      const list = this.getSongs();
      const now = new Date().toISOString();
      const cleanSong = {
        title: songData.title ? songData.title.trim() : 'Canción',
        artist: songData.artist ? songData.artist.trim() : 'Artista',
        album: songData.album ? songData.album.trim() : '',
        year: songData.year || '',
        cover: songData.cover ? songData.cover.trim() : '',
        previewUrl: songData.previewUrl || '',
        lyrics: songData.lyrics ? songData.lyrics.trim() : '',
        spotifyUrl: songData.spotifyUrl ? songData.spotifyUrl.trim() : window.MediaService.spotifyUrl(songData.title, songData.artist),
        youtubeUrl: songData.youtubeUrl ? songData.youtubeUrl.trim() : window.MediaService.youtubeUrl(songData.title, songData.artist),
        lyricsUrl: songData.lyricsUrl ? songData.lyricsUrl.trim() : window.MediaService.geniusUrl(songData.title, songData.artist),
        proposedBy: songData.proposedBy || this.getCurrentUser() || 'Kevin',
        rating: typeof songData.rating === 'number' ? songData.rating : (parseInt(songData.rating, 10) || 5),
        kevinRating: songData.kevinRating !== undefined ? (parseInt(songData.kevinRating, 10) || 0) : 5,
        wendyRating: songData.wendyRating !== undefined ? (parseInt(songData.wendyRating, 10) || 0) : 0,
        comments: Array.isArray(songData.comments) ? songData.comments : []
      };

      if (songData.id) {
        const index = list.findIndex(song => song.id === songData.id);
        if (index !== -1) {
          list[index] = { 
            ...list[index], 
            ...cleanSong, 
            comments: Array.isArray(songData.comments) ? songData.comments : (list[index].comments || []),
            updatedAt: now 
          };
        }
      } else {
        list.unshift({ ...cleanSong, id: window.Utils.generateUUID(), addedAt: now, updatedAt: now });
      }
      this.set(this.keys.songs, list);
      return list;
    }

    rateSong(songId, ratingValue, user) {
      const list = this.getSongs();
      const index = list.findIndex(s => s.id === songId);
      if (index === -1) return false;

      const val = Math.max(0, Math.min(5, parseInt(ratingValue, 10) || 0));
      const targetUser = user || this.getCurrentUser();
      
      if (targetUser.toLowerCase() === 'wendy') {
        list[index].wendyRating = val;
      } else {
        list[index].kevinRating = val;
      }

      const k = list[index].kevinRating || 0;
      const w = list[index].wendyRating || 0;
      if (k > 0 && w > 0) {
        list[index].rating = Math.round((k + w) / 2);
      } else {
        list[index].rating = k > 0 ? k : w;
      }

      list[index].updatedAt = new Date().toISOString();
      this.set(this.keys.songs, list);
      return list[index];
    }

    addSongComment(songId, commentData) {
      const list = this.getSongs();
      const index = list.findIndex(s => s.id === songId);
      if (index === -1) return null;

      const now = new Date().toISOString();
      const currentUser = this.getCurrentUser();
      const newComment = {
        id: window.Utils.generateUUID(),
        author: commentData.author || currentUser,
        message: commentData.message.trim(),
        createdAt: now
      };

      if (!Array.isArray(list[index].comments)) {
        list[index].comments = [];
      }
      list[index].comments.push(newComment);
      list[index].updatedAt = now;

      this.set(this.keys.songs, list);
      return newComment;
    }

    deleteSongComment(songId, commentId) {
      const list = this.getSongs();
      const index = list.findIndex(s => s.id === songId);
      if (index === -1) return false;

      if (Array.isArray(list[index].comments)) {
        list[index].comments = list[index].comments.filter(c => c.id !== commentId);
        list[index].updatedAt = new Date().toISOString();
        this.set(this.keys.songs, list);
        return true;
      }
      return false;
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
