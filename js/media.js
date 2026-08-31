/**
 * Patico Wrapped 🌻 - Servicio de Medios (Música y Películas)
 */

window.MediaService = {
  spotifyUrl(title, artist) {
    return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
  },

  youtubeUrl(title, artist) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${artist} official`)}`;
  },

  geniusUrl(title, artist) {
    return `https://genius.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
  },

  /**
   * Obtiene la letra de una canción desde LRCLIB o lyrics.ovh
   */
  async fetchLyrics(artist, title) {
    if (!artist || !title) return '';
    
    // 1. Intentar con LRCLIB (API pública y gratuita)
    try {
      const cleanArtist = artist.split(/,|&|feat\.|ft\./i)[0].trim();
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.plainLyrics) {
          return data.plainLyrics.trim();
        }
      }

      // Si no encontró coincidencia exacta, probar búsqueda en LRCLIB
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`;
      const searchRes = await fetch(searchUrl);
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (Array.isArray(searchData) && searchData.length > 0) {
          const match = searchData.find(item => item.plainLyrics) || searchData[0];
          if (match && match.plainLyrics) {
            return match.plainLyrics.trim();
          }
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener letra de LRCLIB:', e);
    }

    // 2. Fallback con lyrics.ovh
    try {
      const cleanArtist = artist.split(/,|&|feat\.|ft\./i)[0].trim();
      const cleanTitle = title.replace(/\(.*?\)|\[.*?\]/g, '').trim();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.lyrics) {
          return data.lyrics.trim();
        }
      }
    } catch (e) {
      console.warn('No se pudo obtener letra de lyrics.ovh:', e);
    }

    return '';
  },

  /**
   * Búsqueda de canciones con metadatos completos y obtención de letra
   */
  async searchMusic(query) {
    if (!query || !query.trim()) return [];
    
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query.trim())}&entity=song&limit=8`);
    if (!response.ok) throw new Error('Error al conectar con el servicio de música');
    
    const data = await response.json();
    if (!data.results || !data.results.length) return [];

    return data.results.map(song => {
      const title = song.trackName || 'Canción desconocida';
      const artist = song.artistName || 'Artista';
      const album = song.collectionName || '';
      const year = song.releaseDate ? new Date(song.releaseDate).getFullYear() : '';
      let cover = song.artworkUrl100 || '';
      if (cover) {
        cover = cover.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
      }

      return {
        title,
        artist,
        album,
        year,
        cover,
        spotifyUrl: this.spotifyUrl(title, artist),
        youtubeUrl: this.youtubeUrl(title, artist),
        lyricsUrl: this.geniusUrl(title, artist),
        previewUrl: song.previewUrl || '',
        lyrics: ''
      };
    });
  },

  /**
   * Búsqueda de películas con soporte TMDB y fallback universal
   */
  async searchMovies(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;

    // 1. Motor Oficial: The Movie Database (TMDB) en Español Latino / Castellano
    if (tmdbKey) {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX&include_adult=false&query=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length) {
            // Ordenar por popularidad y votos
            const sortedResults = data.results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            return sortedResults.slice(0, 10).map(movie => {
              const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '';
              const year = (movie.release_date || '').slice(0, 4) || new Date().getFullYear();
              return {
                tmdbId: movie.id,
                title: movie.title || movie.original_title,
                year,
                poster,
                synopsis: movie.overview || 'Película disponible en catálogo oficial.',
                imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
                platforms: ['Cine', 'Streaming'],
                imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${movie.title || movie.original_title} ${year}`)}`
              };
            });
          }
        }
      } catch (e) {
        console.warn('Error buscando en TMDB:', e);
      }
    }

    // 2. Motor de Películas con Carátulas en Alta Definición (iTunes Movie API)
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=movie&limit=8`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results && itunesData.results.length) {
          return itunesData.results.map(m => {
            const cleanTitle = m.trackName || 'Película';
            const year = parseInt((m.releaseDate || '').slice(0, 4), 10) || new Date().getFullYear();
            let poster = m.artworkUrl100 || '';
            if (poster) {
              poster = poster.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
            }

            let platforms = ['Netflix', 'Prime Video', 'Apple TV'];
            const lower = (cleanTitle + ' ' + (m.primaryGenreName || '')).toLowerCase();
            if (lower.includes('disney') || lower.includes('pixar') || lower.includes('animac') || lower.includes('infantil') || lower.includes('kids')) {
              platforms = ['Disney+', 'Apple TV', 'Prime Video'];
            } else if (lower.includes('hbo') || lower.includes('warner') || lower.includes('dc')) {
              platforms = ['Max', 'Apple TV', 'Prime Video'];
            }

            return {
              title: cleanTitle,
              year,
              poster,
              genre: m.primaryGenreName || 'Cine',
              synopsis: m.longDescription || m.shortDescription || 'Película disponible en catálogo digital.',
              imdbRating: '',
              platforms,
              previewUrl: m.previewUrl || '',
              imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error en búsqueda con iTunes Movies:', e);
    }

    // 3. Fallback con Wikipedia REST API
    try {
      const openRes = await fetch(`https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&format=json&origin=*`);
      if (openRes.ok) {
        const openData = await openRes.json();
        const candidateTitles = openData[1] || [];
        const moviePromises = candidateTitles.slice(0, 5).map(async title => {
          try {
            const summaryRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            if (!summaryRes.ok) return null;
            const page = await summaryRes.json();
            const cleanTitle = page.title.replace(/\s*\(.*?\)/g, '').trim();
            const yearMatch = ((page.description || '') + ' ' + (page.extract || '')).match(/\b(19\d\d|20\d\d)\b/);
            const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

            return {
              title: cleanTitle,
              year,
              poster: page.thumbnail?.source || '',
              synopsis: page.extract || 'Película encontrada en el catálogo.',
              imdbRating: '',
              platforms: ['Netflix', 'Prime Video', 'Disney+'],
              imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
            };
          } catch (e) {
            return null;
          }
        });

        const wikiResults = (await Promise.all(moviePromises)).filter(Boolean);
        if (wikiResults.length) return wikiResults;
      }
    } catch (e) {
      console.warn('Error en búsqueda con Wikipedia:', e);
    }

    return [];
  },

  /**
   * Obtiene detalles extendidos de una película (plataformas, IMDb, sinopsis completa)
   */
  async movieDetails(movie) {
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;
    let enriched = { ...movie };

    // Si tiene TMDB ID y clave
    if (tmdbKey && movie.tmdbId) {
      try {
        const [detailsRes, providersRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX`),
          fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`)
        ]);

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.poster_path) {
            enriched.poster = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
          }
          enriched.synopsis = details.overview || enriched.synopsis;
          if (details.genres && details.genres.length) {
            enriched.genre = details.genres.map(g => g.name).join(', ');
          }
          if (details.vote_average) {
            enriched.imdbRating = details.vote_average.toFixed(1);
          }
          if (details.imdb_id) {
            enriched.imdbUrl = `https://www.imdb.com/title/${details.imdb_id}/`;
          }
        }

        if (providersRes.ok) {
          const providers = await providersRes.json();
          const country = providers.results?.CO || providers.results?.MX || providers.results?.ES || providers.results?.US || {};
          const streamPlatforms = (country.flatrate || []).map(p => {
            const name = p.provider_name || '';
            if (name.includes('Disney')) return 'Disney+';
            if (name.includes('Amazon') || name.includes('Prime')) return 'Prime Video';
            if (name.includes('HBO') || name.includes('Max')) return 'Max';
            if (name.includes('Apple')) return 'Apple TV';
            return name;
          });
          const rentBuyPlatforms = [...(country.rent || []), ...(country.buy || [])].map(p => p.provider_name);
          const allPlatforms = Array.from(new Set([...streamPlatforms, ...rentBuyPlatforms]));
          if (allPlatforms.length) {
            enriched.platforms = allPlatforms;
          }
        }
      } catch (e) {
        console.warn('Error al obtener detalles en TMDB:', e);
      }
    }

    // Si no tiene IMDb URL, generar enlace de búsqueda
    if (!enriched.imdbUrl && enriched.title) {
      enriched.imdbUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(`${enriched.title} ${enriched.year || ''}`)}`;
    }

    return enriched;
  },

  /**
   * ========================================================
   * BÚSQUEDA Y DETALLES DE SERIES Y ANIME 📺
   * ========================================================
   */

  async searchSeries(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;

    // 1. Motor Oficial: The Movie Database (TMDB) para Series & Anime
    if (tmdbKey) {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX&include_adult=false&query=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length) {
            const sortedResults = data.results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            return sortedResults.slice(0, 10).map(show => {
              const poster = show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '';
              const year = (show.first_air_date || '').slice(0, 4) || new Date().getFullYear();
              return {
                tmdbId: show.id,
                title: show.name || show.original_name,
                originalTitle: show.original_name,
                year,
                poster,
                synopsis: show.overview || 'Serie/Anime disponible en catálogo oficial.',
                imdbRating: show.vote_average ? show.vote_average.toFixed(1) : '',
                platforms: ['Streaming'],
                imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${show.name || show.original_name} ${year}`)}`
              };
            });
          }
        }
      } catch (e) {
        console.warn('Error buscando series en TMDB:', e);
      }
    }

    // 2. Fallback con iTunes TV Shows
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=tvSeason&limit=8`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results && itunesData.results.length) {
          return itunesData.results.map(s => {
            const cleanTitle = s.collectionName || s.artistName || 'Serie';
            const year = parseInt((s.releaseDate || '').slice(0, 4), 10) || new Date().getFullYear();
            let poster = s.artworkUrl100 || '';
            if (poster) {
              poster = poster.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
            }

            return {
              title: cleanTitle,
              year,
              poster,
              synopsis: s.longDescription || s.shortDescription || 'Serie de televisión.',
              imdbRating: '',
              platforms: ['Apple TV', 'Streaming'],
              imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
            };
          });
        }
      }
    } catch (e) {
      console.warn('Error en búsqueda de series en iTunes:', e);
    }

    return [];
  },

  /**
   * Obtiene detalles completos de una serie (temporadas, sinopsis, streaming providers)
   */
  async seriesDetails(serie) {
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;
    let enriched = { ...serie };

    if (tmdbKey && serie.tmdbId) {
      try {
        const [detailsRes, providersRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/tv/${serie.tmdbId}?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX`),
          fetch(`https://api.themoviedb.org/3/tv/${serie.tmdbId}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`)
        ]);

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          if (details.poster_path) {
            enriched.poster = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
          }
          enriched.synopsis = details.overview || enriched.synopsis;
          enriched.seasonsCount = details.number_of_seasons || 1;
          enriched.episodesCount = details.number_of_episodes || 0;
          if (details.vote_average) {
            enriched.imdbRating = details.vote_average.toFixed(1);
          }

          // Construir temporadas iniciales con todos sus capítulos preinicializados
          const validSeasons = (details.seasons || []).filter(s => s.season_number > 0);
          enriched.seasons = validSeasons.map(s => {
            const epCount = s.episode_count || 0;
            const initialEpisodes = [];
            for (let i = 1; i <= epCount; i++) {
              initialEpisodes.push({
                episodeNumber: i,
                name: `Episodio ${i}`,
                overview: '',
                airDate: '',
                stillPath: '',
                watchedByKevin: false,
                watchedByWendy: false,
                watchedAtKevin: null,
                watchedAtWendy: null
              });
            }

            return {
              seasonNumber: s.season_number,
              name: s.name || `Temporada ${s.season_number}`,
              episodesCount: epCount,
              poster: s.poster_path ? `https://image.tmdb.org/t/p/w500${s.poster_path}` : '',
              overview: s.overview || '',
              episodes: initialEpisodes
            };
          });

          // Cargar automáticamente metadatos completos de la Temporada 1
          if (enriched.seasons.length > 0) {
            try {
              const s1Episodes = await this.getSeasonEpisodes(serie.tmdbId, enriched.seasons[0].seasonNumber);
              if (s1Episodes && s1Episodes.length) {
                enriched.seasons[0].episodes = s1Episodes;
              }
            } catch (_) {}
          }
        }

        if (providersRes.ok) {
          const providers = await providersRes.json();
          const country = providers.results?.CO || providers.results?.MX || providers.results?.ES || providers.results?.US || {};
          const streamPlatforms = (country.flatrate || []).map(p => {
            const name = p.provider_name || '';
            if (name.includes('Disney')) return 'Disney+';
            if (name.includes('Amazon') || name.includes('Prime')) return 'Prime Video';
            if (name.includes('HBO') || name.includes('Max')) return 'Max';
            if (name.includes('Crunchyroll')) return 'Crunchyroll';
            if (name.includes('Apple')) return 'Apple TV';
            return name;
          });
          const allPlatforms = Array.from(new Set(streamPlatforms));
          if (allPlatforms.length) {
            enriched.platforms = allPlatforms;
          }
        }
      } catch (e) {
        console.warn('Error obteniendo detalles de serie en TMDB:', e);
      }
    }

    if (!enriched.imdbUrl && enriched.title) {
      enriched.imdbUrl = `https://www.imdb.com/find/?q=${encodeURIComponent(`${enriched.title} ${enriched.year || ''}`)}`;
    }

    return enriched;
  },

  /**
   * Obtiene la lista de capítulos de una temporada específica
   */
  async getSeasonEpisodes(tmdbId, seasonNumber) {
    const tmdbKey = window.CONFIG?.media?.tmdbApiKey;
    if (!tmdbKey || !tmdbId) return [];

    try {
      const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?api_key=${encodeURIComponent(tmdbKey)}&language=es-MX`);
      if (res.ok) {
        const data = await res.json();
        if (data.episodes && Array.isArray(data.episodes)) {
          return data.episodes.map(ep => ({
            episodeNumber: ep.episode_number,
            name: ep.name || `Episodio ${ep.episode_number}`,
            overview: ep.overview || 'Sinopsis no disponible para este capítulo.',
            airDate: ep.air_date || '',
            stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : '',
            voteAverage: ep.vote_average ? ep.vote_average.toFixed(1) : '',
            watchedByKevin: false,
            watchedByWendy: false,
            watchedAtKevin: null,
            watchedAtWendy: null
          }));
        }
      }
    } catch (e) {
      console.warn(`Error al cargar capítulos de temporada ${seasonNumber}:`, e);
    }
    return [];
  }
};

/**
 * ========================================================
 * SERVICIO DE INTEGRACIÓN CON GOOGLE DRIVE 🌻📁
 * Genera carpetas estructuradas: "{Título} {Fecha}"
 * Sube portada en primer lugar y luego fotos de galería.
 * ========================================================
 */
window.GoogleDriveService = {
  formatFolderName(title, dateStr) {
    const cleanTitle = (title || 'Recuerdo').replace(/[\\/:*?"<>|]/g, '').trim();
    let formattedDate = dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const day = parseInt(parts[2], 10);
        const month = months[parseInt(parts[1], 10) - 1];
        formattedDate = `${day} de ${month}`;
      }
    } catch (_) {}
    return `${cleanTitle} ${formattedDate}`;
  },

  async uploadMemory(memoryData, coverFileOrUrl, galleryFilesOrUrls = []) {
    const folderName = this.formatFolderName(memoryData.title, memoryData.date);
    const scriptUrl = window.CONFIG.googleDrive?.scriptUrl || 'https://script.google.com/macros/s/AKfycbwlvCsQoPOFWsE1JEirVv16Fy2IFwzsOAUxwJtFn-QRg9u4HWpv8JowqniTGZ72OY4o/exec';

    const filesToUpload = [];

    // 1. Portada de primera
    if (coverFileOrUrl) {
      filesToUpload.push({
        name: '01_Portada',
        data: coverFileOrUrl,
        isCover: true
      });
    }

    // 2. Fotos y videos adicionales
    if (Array.isArray(galleryFilesOrUrls)) {
      galleryFilesOrUrls.forEach((item, idx) => {
        const fileNum = String(idx + 2).padStart(2, '0');
        filesToUpload.push({
          name: `${fileNum}_Foto_${idx + 1}`,
          data: item,
          isCover: false
        });
      });
    }

    // Si hay un webhook de Google Apps Script configurado
    if (scriptUrl) {
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'createFolderAndUpload',
            parentFolderId: window.CONFIG.googleDrive?.parentFolderId || '1qXPifAHV5fTVX7HdI1ab6UzAjDTpiwjm',
            folderName: folderName,
            folderPrefix: window.CONFIG.googleDrive.folderPrefix,
            files: filesToUpload
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.folderUrl) {
            return {
              success: true,
              folderUrl: result.folderUrl,
              folderName: folderName,
              uploadedFiles: result.files || []
            };
          }
        }
      } catch (e) {
        console.warn('Error al subir a Google Drive Script:', e);
      }
    }

    // Fallback local: Generar enlace directo de búsqueda/creación en Google Drive
    const driveSearchUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(folderName)}`;
    return {
      success: true,
      folderUrl: driveSearchUrl,
      folderName: folderName,
      uploadedFiles: filesToUpload
    };
  }
};

