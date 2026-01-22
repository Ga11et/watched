export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'URL parameter is required',
    })
  }

  try {
    return $fetch(url)
  } catch (error) {
    console.error('Proxy error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to proxy image',
    })
  }
})
