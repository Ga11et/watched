export interface SeriesFormValues {
  title: string
  genres: string
  country: string
  rating?: number
  totalSeasons?: number
  watchedSeasons?: number
  watchedAt: string
  comment: string
  poster: File | null
}

const isNumber = (value?: number): value is number =>
  typeof value === 'number' && !Number.isNaN(value)

export const validateSeriesForm = (values: SeriesFormValues): Record<string, string> => {
  const errors: Record<string, string> = {}

  if (!values.title.trim()) {
    errors.title = 'Название обязательно'
  }

  if (
    isNumber(values.totalSeasons) &&
    isNumber(values.watchedSeasons) &&
    values.watchedSeasons > values.totalSeasons
  ) {
    errors.watchedSeasons = 'Просмотренных сезонов не может быть больше общего количества'
  }

  return errors
}

export const buildSeriesFormData = (values: SeriesFormValues): FormData => {
  const formData = new FormData()

  const strings = {
    title: values.title,
    genres: values.genres,
    country: values.country,
    watchedAt: values.watchedAt,
    comment: values.comment,
  }
  for (const [key, value] of Object.entries(strings)) {
    if (value.trim()) formData.append(key, value.trim())
  }

  const numbers = {
    rating: values.rating,
    totalSeasons: values.totalSeasons,
    watchedSeasons: values.watchedSeasons,
  }
  for (const [key, value] of Object.entries(numbers)) {
    if (isNumber(value)) formData.append(key, String(value))
  }

  if (values.poster) {
    formData.append('poster', values.poster)
  }

  return formData
}

export const seriesFormLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 1, fields: [{ id: 'genres' }] },
  { columns: 1, fields: [{ id: 'country' }] },
  { columns: 2, fields: [{ id: 'rating' }, { id: 'watchedAt' }] },
  { columns: 2, fields: [{ id: 'totalSeasons' }, { id: 'watchedSeasons' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
]
