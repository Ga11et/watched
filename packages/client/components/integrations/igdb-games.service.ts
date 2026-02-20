export interface IGDBGame {
  id: string
  name: string
  cover?: string
  releaseDate?: string
  genres?: string[]
  platforms?: string[]
  summary?: string
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

class GamesSearchService {
  private rawgBaseUrl = 'https://api.rawg.io/api/games'
  private rawgApiKey = ''

  constructor(apikey: string) {
    this.rawgApiKey = apikey
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
}

export default GamesSearchService
