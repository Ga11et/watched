import type { TmdbSeries } from '~/types/api'

export interface TmdbSeriesFormData {
  country: string
  totalSeasons: number
  genres: string
  posterFile: File | null
  posterPreview: string | null
}

interface TmdbGenre {
  id: number
  name: string
}

interface TmdbGenresResponse {
  genres: TmdbGenre[]
}

class TmdbSeriesService {
  private genresUrl = 'https://api.themoviedb.org/3/genre/tv/list'
  private posterBaseUrl = 'https://image.tmdb.org/t/p/w500'
  private apiKey = ''

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getFormData(series: TmdbSeries): Promise<TmdbSeriesFormData> {
    const [genres, poster] = await Promise.all([
      this.getGenres(series.genre_ids),
      this.getPoster(series),
    ])

    return {
      country: series.origin_country?.[0] || '',
      totalSeasons: series.number_of_seasons || 0,
      genres,
      ...poster,
    }
  }

  private async getGenres(genreIds: number[]): Promise<string> {
    if (!genreIds?.length) return ''

    try {
      const response = await $fetch<TmdbGenresResponse>(this.genresUrl, {
        params: {
          api_key: this.apiKey,
          language: 'ru-RU',
        },
      })

      return genreIds
        .map((id) => response.genres.find((genre) => genre.id === id)?.name)
        .filter(Boolean)
        .join(', ')
    } catch (error) {
      console.error('Failed to fetch TMDB genres:', error)
      return ''
    }
  }

  private async getPoster(
    series: TmdbSeries,
  ): Promise<Pick<TmdbSeriesFormData, 'posterFile' | 'posterPreview'>> {
    if (!series.poster_path) return { posterFile: null, posterPreview: null }

    const posterPreview = `${this.posterBaseUrl}${series.poster_path}`

    try {
      const response = await fetch(posterPreview)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      const posterFile = new File([blob], `${series.id}.jpg`, { type: blob.type })

      return { posterFile, posterPreview }
    } catch (error) {
      console.error('Failed to fetch TMDB poster:', error)
      return { posterFile: null, posterPreview }
    }
  }
}

export default TmdbSeriesService
