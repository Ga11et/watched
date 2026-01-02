<template>
  <div class="movie-card">
    <h3>{{ movie.title }}</h3>
    <div class="movie-info">
      <p><strong>Director:</strong> {{ movie.director.fullName }}</p>
      <p><strong>Watch Date:</strong> {{ formatDate(movie.watchDate) }}</p>
      <p><strong>Rating:</strong> {{ movie.rating }}/100</p>
      <p v-if="movie.comment"><strong>Comment:</strong> {{ movie.comment }}</p>
    </div>
  </div>
</template>
<script setup>
defineProps({
  movie: {
    type: Object,
    required: true,
    validator: (movie) => {
      return movie.title && movie.director && movie.watchDate && typeof movie.rating === 'number'
    },
  },
})
</script>
<style scoped>
.movie-card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
.movie-info {
  margin-top: 0.5rem;
}
.movie-info p {
  margin: 0.25rem 0;
}
</style>
