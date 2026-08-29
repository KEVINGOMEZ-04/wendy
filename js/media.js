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
      let cover = song.artworkUrl100 || '';
      if (cover) {
        cover = cover.replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600');
      }

      return {
        title,
        artist,
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

    // 1. Si hay clave de TMDB configurada, usar TMDB
    if (tmdbKey) {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(tmdbKey)}&language=es-ES&query=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.results && data.results.length) {
            return data.results.slice(0, 8).map(movie => ({
              tmdbId: movie.id,
              title: movie.title || movie.original_title,
              year: (movie.release_date || '').slice(0, 4) || (new Date().getFullYear()),
              poster: movie.poster_path ? (window.CONFIG.media.tmdbImageBaseUrl || 'https://image.tmdb.org/t/p/w500') + movie.poster_path : '',
              synopsis: movie.overview || 'Sin sinopsis disponible.',
              imdbRating: movie.vote_average ? movie.vote_average.toFixed(1) : '',
              platforms: []
            }));
          }
        }
      } catch (e) {
        console.warn('Error buscando en TMDB, usando fallback:', e);
      }
    }

    // 2. Motor Inteligente de Películas en Español (OpenSearch & Wikipedia REST API con CORS origin=*)
    try {
      const openRes = await fetch(`https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=12&format=json&origin=*`);
      if (openRes.ok) {
        const openData = await openRes.json();
        const candidateTitles = openData[1] || [];
        
        // Priorizar títulos que sean películas o el término exacto
        const movieTitles = candidateTitles.filter(t => t.toLowerCase().includes('película') || t.toLowerCase().includes('filme') || t.toLowerCase() === q.toLowerCase());
        const titlesToFetch = movieTitles.length ? movieTitles.slice(0, 6) : candidateTitles.slice(0, 5);

        const moviePromises = titlesToFetch.map(async title => {
          try {
            const summaryRes = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
            if (!summaryRes.ok) return null;
            const page = await summaryRes.json();
            
            const isMovie = page.title.toLowerCase().includes('película') || 
                            (page.description && (page.description.includes('película') || page.description.includes('filme') || page.description.includes('dirigida') || page.description.includes('cine'))) ||
                            (page.extract && (page.extract.includes('película') || page.extract.includes('filme') || page.extract.includes('dirigida') || page.extract.includes('animación') || page.extract.includes('estrenada')));
            
            if (isMovie || candidateTitles.length <= 2) {
              const cleanTitle = page.title.replace(/\s*\(.*?\)/g, '').trim();
              const yearMatch = ((page.description || '') + ' ' + (page.extract || '')).match(/\b(19\d\d|20\d\d)\b/);
              const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
              
              let platforms = ['Netflix', 'Prime Video', 'Max', 'Apple TV'];
              const lower = (cleanTitle + ' ' + (page.extract || '')).toLowerCase();
              if (lower.includes('disney') || lower.includes('pixar') || lower.includes('animac') || lower.includes('infantil')) {
                platforms = ['Disney+', 'Apple TV', 'Prime Video'];
              }

              return {
                title: cleanTitle,
                year,
                poster: page.thumbnail?.source || '',
                synopsis: page.extract || 'Película encontrada en el catálogo.',
                imdbRating: '',
                platforms,
                imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(`${cleanTitle} ${year}`)}`
              };
            }
          } catch (e) {
            return null;
          }
          return null;
        });

        const wikiResults = (await Promise.all(moviePromises)).filter(Boolean);
        if (wikiResults.length) {
          return wikiResults;
        }
      }
    } catch (e) {
      console.warn('Error en búsqueda con Wikipedia:', e);
    }

    // 3. Fallback adicional con iTunes Movie Search
    try {
      const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&limit=6`);
      if (itunesRes.ok) {
        const itunesData = await itunesRes.json();
        if (itunesData.results?.length) {
          return itunesData.results.map(m => ({
            title: m.trackName || 'Película',
            year: parseInt((m.releaseDate || '').slice(0, 4), 10) || new Date().getFullYear(),
            poster: (m.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg').replace('100x100', '600x600'),
            synopsis: m.longDescription || m.shortDescription || 'Sin sinopsis disponible.',
            imdbRating: '',
            platforms: ['Apple TV', 'Alquiler digital'],
            imdbUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(m.trackName)}`
          }));
        }
      }
    } catch (e) {
      console.warn('Error en búsqueda con iTunes:', e);
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
          fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${encodeURIComponent(tmdbKey)}&language=es-ES`),
          fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}/watch/providers?api_key=${encodeURIComponent(tmdbKey)}`)
        ]);

        if (detailsRes.ok) {
          const details = await detailsRes.json();
          enriched.poster = details.poster_path ? (window.CONFIG.media.tmdbImageBaseUrl + details.poster_path) : enriched.poster;
          enriched.synopsis = details.overview || enriched.synopsis;
          if (details.imdb_id) {
            enriched.imdbUrl = `https://www.imdb.com/title/${details.imdb_id}/`;
            if (window.CONFIG?.media?.omdbApiKey) {
              try {
                const omdb = await fetch(`https://www.omdbapi.com/?apikey=${encodeURIComponent(window.CONFIG.media.omdbApiKey)}&i=${details.imdb_id}`);
                if (omdb.ok) {
                  const omdbData = await omdb.json();
                  if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
                    enriched.imdbRating = omdbData.imdbRating;
                  }
                }
              } catch (e) {
                console.warn('Error consultando OMDb:', e);
              }
            } else if (details.vote_average) {
              enriched.imdbRating = details.vote_average.toFixed(1);
            }
          }
        }

        if (providersRes.ok) {
          const providers = await providersRes.json();
          const country = providers.results?.CO || providers.results?.MX || providers.results?.ES || providers.results?.US || {};
          const streamPlatforms = (country.flatrate || []).map(p => p.provider_name);
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
  }
};
