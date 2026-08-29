/**
 * Patico Wrapped 🌻 - Sistema de Presencia Compartida
 */

(function() {
  class PresenceService {
    constructor() {
      this.config = window.CONFIG.presence;
      this.currentUser = window.storage.getCurrentUser();
      this.listeners = [];
      this.heartbeatTimer = null;
      
      this.state = {
        provider: this.config.provider,
        users: {
          Kevin: {
            online: false,
            lastSeen: null,
            lastSeenFormatted: 'No disponible'
          },
          Wendy: {
            online: false,
            lastSeen: null,
            lastSeenFormatted: 'No disponible'
          }
        },
        summary: 'Modo local: presencia compartida no configurada',
        isLocal: true,
        lastError: null
      };

      this.init();
    }

    init() {
      this.loadLocalPresence();

      if (this.config.provider === 'local') {
        this.initLocalMode();
      } else if (this.config.provider === 'firebase') {
        this.initFirebaseMode();
      } else {
        this.initLocalMode();
      }

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.sendHeartbeat();
        } else {
          this.handleTabHidden();
        }
      });

      window.addEventListener('beforeunload', () => {
        this.handleTabClosing();
      });
    }

    loadLocalPresence() {
      const localData = window.storage.get(window.CONFIG.storageKeys.localPresence, {});
      const now = new Date().toISOString();

      localData[this.currentUser] = {
        lastSeen: now,
        online: true
      };
      window.storage.set(window.CONFIG.storageKeys.localPresence, localData);

      window.CONFIG.users.forEach(user => {
        const uData = localData[user];
        if (uData && uData.lastSeen) {
          this.state.users[user] = {
            online: user === this.currentUser,
            lastSeen: uData.lastSeen,
            lastSeenFormatted: window.Utils.formatDateTimeES(uData.lastSeen)
          };
        }
      });

      this.updateSummary();
    }

    initLocalMode() {
      this.state.isLocal = true;
      this.state.provider = 'local';
      this.sendHeartbeat();

      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat();
      }, this.config.heartbeatIntervalMs);
    }

    initFirebaseMode() {
      this.state.isLocal = false;
      this.state.provider = 'firebase';
      
      if (!this.config.firebaseConfig || !this.config.firebaseConfig.databaseURL) {
        this.state.lastError = 'Configuración de Firebase incompleta. Operando en Modo Local.';
        this.initLocalMode();
        return;
      }

      this.sendHeartbeat();
      this.heartbeatTimer = setInterval(() => {
        this.sendHeartbeat();
      }, this.config.heartbeatIntervalMs);
    }

    sendHeartbeat() {
      const now = new Date().toISOString();
      const localData = window.storage.get(window.CONFIG.storageKeys.localPresence, {});
      
      localData[this.currentUser] = {
        lastSeen: now,
        online: true,
        roomId: this.config.roomId
      };
      window.storage.set(window.CONFIG.storageKeys.localPresence, localData);

      if (this.state.isLocal) {
        window.CONFIG.users.forEach(user => {
          const uData = localData[user];
          if (user === this.currentUser) {
            this.state.users[user] = {
              online: true,
              lastSeen: now,
              lastSeenFormatted: window.Utils.formatDateTimeES(now)
            };
          } else {
            const lastSeen = uData ? uData.lastSeen : null;
            this.state.users[user] = {
              online: false,
              lastSeen: lastSeen,
              lastSeenFormatted: lastSeen ? window.Utils.formatDateTimeES(lastSeen) : 'Sin registros en este dispositivo'
            };
          }
        });
      }

      this.updateSummary();
      this.notify();
    }

    handleTabHidden() {
      if (this.state.isLocal) {
        this.sendHeartbeat();
      }
    }

    handleTabClosing() {
      const localData = window.storage.get(window.CONFIG.storageKeys.localPresence, {});
      if (localData[this.currentUser]) {
        localData[this.currentUser].online = false;
        localData[this.currentUser].lastSeen = new Date().toISOString();
        window.storage.set(window.CONFIG.storageKeys.localPresence, localData);
      }
    }

    updateSummary() {
      if (this.state.provider === 'firebase') {
        this.state.summary = 'Diario sincronizado con Firebase';
        return;
      }
      if (this.state.isLocal) {
        this.state.summary = 'Modo local: presencia compartida no configurada';
        return;
      }

      const kevinOnline = this.state.users.Kevin?.online;
      const wendyOnline = this.state.users.Wendy?.online;

      if (kevinOnline && wendyOnline) {
        this.state.summary = 'Ambos están en línea';
      } else if (kevinOnline) {
        this.state.summary = 'Solo Kevin está en línea';
      } else if (wendyOnline) {
        this.state.summary = 'Solo Wendy está en línea';
      } else {
        this.state.summary = 'Ninguno está en línea';
      }
    }

    switchUser(newUser) {
      if (!window.CONFIG.users.includes(newUser)) return false;
      
      const localData = window.storage.get(window.CONFIG.storageKeys.localPresence, {});
      const now = new Date().toISOString();
      
      if (localData[this.currentUser]) {
        localData[this.currentUser].online = false;
        localData[this.currentUser].lastSeen = now;
      }

      this.currentUser = newUser;
      window.storage.setCurrentUser(newUser);

      localData[newUser] = {
        online: true,
        lastSeen: now
      };
      window.storage.set(window.CONFIG.storageKeys.localPresence, localData);

      this.sendHeartbeat();
      return true;
    }

    getState() {
      return {
        ...this.state,
        currentUser: this.currentUser
      };
    }

    subscribe(listener) {
      this.listeners.push(listener);
      listener(this.getState());
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      const currentState = this.getState();
      this.listeners.forEach(cb => {
        try {
          cb(currentState);
        } catch (e) {
          console.error('Error en listener de presencia:', e);
        }
      });
    }
  }

  window.presence = new PresenceService();
})();
