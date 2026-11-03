<template>
  <div class="flex gap-6">
    <EntitiesSeriesOutputsPoster :poster="series.poster" :alt="series.title" />

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="outputLayout">
        <template #title>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ series.title }}</div>
          </div>
        </template>

        <template #genres>
          <div>
            <div class="text-sm text-gray-500">Жанры</div>
            <div class="text-base text-gray-900">{{ series.genres || '—' }}</div>
          </div>
        </template>

        <template #country>
          <div>
            <div class="text-sm text-gray-500">Страна производства</div>
            <div class="text-base text-gray-900">{{ series.country || '—' }}</div>
          </div>
        </template>

        <template #rating>
          <div>
            <div class="text-sm text-gray-500">Рейтинг</div>
            <div v-if="series.rating != null" class="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                />
              </svg>
              <span class="text-base text-gray-900">{{ Math.round(series.rating) }}/100</span>
            </div>
            <div v-else class="text-base text-gray-900">—</div>
          </div>
        </template>

        <template #watchedAt>
          <div>
            <div class="text-sm text-gray-500">Дата просмотра</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="series.watchedAt" /></div>
          </div>
        </template>

        <template #seasons>
          <div>
            <div class="text-sm text-gray-500">Просмотрено сезонов</div>
            <div class="text-base text-gray-900">
              {{
                series.totalSeasons != null
                  ? `${series.watchedSeasons ?? 0} из ${series.totalSeasons}`
                  : '—'
              }}
            </div>
          </div>
        </template>

        <template #comment>
          <EntitiesCommonCommentBlock :comment="series.comment" />
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="series.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="series.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Series } from '~/types/api'

defineProps<{ series: Series }>()

const outputLayout = [
  { columns: 1, fields: [{ id: 'title' }] },
  { columns: 2, fields: [{ id: 'genres' }, { id: 'country' }] },
  { columns: 2, fields: [{ id: 'rating' }, { id: 'watchedAt' }] },
  { columns: 1, fields: [{ id: 'seasons' }] },
  { columns: 1, fields: [{ id: 'comment' }] },
  { columns: 2, fields: [{ id: 'createdAt' }, { id: 'updatedAt' }] },
]
</script>
