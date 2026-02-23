export interface IGDBGame {
  id: string
  name: string
  cover?: string
  releaseDate?: string
  genres?: string[]
  platforms?: string[]
  summary?: string
}

export interface RawgCompanySuggestion {
  id: string
  name: string
  image?: string
  gamesCount?: number
}

interface RawgGame {
  id: number
  name: string
  background_image?: string
  released?: string
  genres?: Array<{ name: string }>
  platforms?: Array<{ platform: { name: string } }>
  description?: string
}

interface RawgCompany {
  id: number
  name: string
  image_background?: string
  games_count?: number
}

interface RawgListResponse<T> {
  results?: T[]
}

class GamesSearchService {
  private rawgBaseUrl = 'https://api.rawg.io/api/games'
  private rawgDevelopersUrl = 'https://api.rawg.io/api/developers'
  private rawgPublishersUrl = 'https://api.rawg.io/api/publishers'
  private rawgApiKey = ''

  constructor(apikey: string) {
    this.rawgApiKey = apikey
  }

  async searchDevelopers(query: string, maxResults: number = 10): Promise<RawgCompanySuggestion[]> {
    return this.searchCompanies(this.rawgDevelopersUrl, query, maxResults)
  }

  async searchPublishers(query: string, maxResults: number = 10): Promise<RawgCompanySuggestion[]> {
    return this.searchCompanies(this.rawgPublishersUrl, query, maxResults)
  }

  async searchGames(query: string, maxResults: number = 10): Promise<IGDBGame[]> {
    if (!query.trim()) return []

    try {
      const response = await fetch(
        `${this.rawgBaseUrl}?key=${this.rawgApiKey}&search=${encodeURIComponent(query)}&page_size=${maxResults}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return data.results?.map(this.transformGame) || []
    } catch (error) {
      console.error('Error searching games:', error)
      return []
    }
  }

  async getGameById(gameId: string): Promise<IGDBGame | null> {
    try {
      const response = await fetch(`${this.rawgBaseUrl}/${gameId}?key=${this.rawgApiKey}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return this.transformGame(data)
    } catch (error) {
      console.error('Error getting game by ID:', error)
      return null
    }
  }

  private async searchCompanies(
    endpoint: string,
    query: string,
    maxResults: number,
  ): Promise<RawgCompanySuggestion[]> {
    if (!query.trim()) return []

    try {
      const response = await fetch(
        `${endpoint}?key=${this.rawgApiKey}&search=${encodeURIComponent(query)}&page_size=${maxResults}`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = (await response.json()) as RawgListResponse<RawgCompany>

      return data.results?.map((item) => this.transformCompany(item)) || []
    } catch (error) {
      console.error('Error searching companies:', error)
      return []
    }
  }

  private transformGame(item: RawgGame): IGDBGame {
    return {
      id: item.id.toString(),
      name: item.name || 'Unknown Game',
      cover: item.background_image,
      releaseDate: item.released,
      genres: item.genres?.map((g) => g.name),
      platforms: item.platforms?.map((p) => p.platform.name),
      summary: item.description,
    }
  }

  private transformCompany(item: RawgCompany): RawgCompanySuggestion {
    return {
      id: item.id.toString(),
      name: item.name || 'Unknown',
      image: item.image_background,
      gamesCount: item.games_count,
    }
  }
}

export default GamesSearchService
