export interface GoogleBook {
  id: string
  title: string
  authors?: string[]
  description?: string
  cover?: string
  publishedDate?: string
  isbn?: string
  publisher?: string
  pageCount?: number
  language?: string
  genres?: string
}

export interface GoogleAuthor {
  id: string
  name: string
  photo?: string
  description?: string
}

interface GoogleBooksApiResponseItem {
  id: string
  volumeInfo: {
    authors?: string[]
    title?: string
    description?: string
    categories?: string[]
    imageLinks?: {
      thumbnail?: string
      smallThumbnail?: string
    }
    publishedDate?: string
    industryIdentifiers?: Array<{
      identifier: string
    }>
    publisher?: string
    pageCount?: number
    language?: string
  }
}

class GoogleBooksService {
  private baseUrl = 'https://www.googleapis.com/books/v1/volumes'

  async searchBooks(query: string, maxResults: number = 10): Promise<GoogleBook[]> {
    if (!query.trim()) return []

    try {
      const response = await fetch(
        `${this.baseUrl}?q=${encodeURIComponent(query)}&maxResults=${maxResults}&langRestrict=ru,en`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      return data.items?.map(this.transformBook) || []
    } catch (error) {
      console.error('Error searching books:', error)
      return []
    }
  }

  async getBookById(bookId: string): Promise<GoogleBook | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${bookId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return this.transformBook(data)
    } catch (error) {
      console.error('Error getting book by ID:', error)
      return null
    }
  }

  private transformBook(item: GoogleBooksApiResponseItem): GoogleBook {
    const volumeInfo = item.volumeInfo || {}
    const imageLinks = volumeInfo.imageLinks || {}

    return {
      id: item.id,
      title: volumeInfo.title || 'Unknown Title',
      authors: volumeInfo.authors,
      description: volumeInfo.description,
      cover: imageLinks.thumbnail || imageLinks.smallThumbnail,
      publishedDate: volumeInfo.publishedDate,
      isbn: volumeInfo.industryIdentifiers?.[0]?.identifier,
      publisher: volumeInfo.publisher,
      pageCount: volumeInfo.pageCount,
      language: volumeInfo.language,
      genres: volumeInfo.categories?.join(', '),
    }
  }
}

export const googleBooksService = new GoogleBooksService()
