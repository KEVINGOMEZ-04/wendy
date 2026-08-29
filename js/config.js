/**
 * Patico Wrapped 🌻 - Configuración Centralizada
 */
window.CONFIG = {
  appName: 'Patico Wrapped 🌻',
  version: '1.0.0',
  
  // Claves de LocalStorage
  storageKeys: {
    unlocked: 'patico_unlocked_v2',
    currentUser: 'patico_current_user_v1',
    memories: 'patico_memories_v1',
    movies: 'patico_movies_v1',
    notes: 'patico_notes_v1',
    dreams: 'patico_dreams_v1',
    songs: 'patico_songs_v1',
    credentials: 'patico_credentials_v1',
    localPresence: 'patico_presence_local_v1',
    remoteConfig: 'patico_presence_remote_config_v1'
  },

  // Configuración de Presencia Compartida
  presence: {
    provider: 'local', // Cambiar a 'firebase' al completar firebaseConfig.
    roomId: 'kevin-wendy-wrapped-room',
    heartbeatIntervalMs: 15000,
    presenceTimeoutMs: 60000,
    firebaseConfig: {
      apiKey: '',
      authDomain: '',
      databaseURL: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    }
  },

  // Usuarios del diario compartido
  users: ['Kevin', 'Wendy'],
  defaultUser: 'Kevin',

  // Las claves de TMDB y OMDb deben restringirse por dominio antes de publicar.
  media: {
    tmdbApiKey: '',
    omdbApiKey: '',
    tmdbImageBaseUrl: 'https://image.tmdb.org/t/p/w500'
  },

  // Paleta oficial
  theme: {
    bg: '#120E1C',
    purple: '#6D4A99',
    lilac: '#B98EE6',
    sunflowerGold: '#F4C542',
    lightYellow: '#F8D96B',
    textMain: '#F1E9FB',
    textSecondary: '#B7A7CC'
  },

  // Secciones
  sections: [
    { id: 'inicio', number: 1, label: 'Inicio', icon: '🏡' },
    { id: 'recuerdos', number: 2, label: 'Recuerdos', icon: '🌻' },
    { id: 'musica', number: 3, label: 'Música', icon: '🎵' },
    { id: 'cine', number: 4, label: 'Películas', icon: '🎬' },
    { id: 'muro', number: 5, label: 'Notas', icon: '💌' },
    { id: 'suenos', number: 6, label: 'Sueños', icon: '🌟' }
  ]
};
