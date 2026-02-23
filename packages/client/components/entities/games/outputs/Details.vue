<template>
  <div class="flex gap-6">
    <div class="flex-shrink-0">
      <div v-if="game.cover" class="h-56 w-40 overflow-hidden rounded-lg">
        <img :src="coverUrl" :alt="game.title" class="h-full w-full object-cover" />
      </div>
      <div v-else class="flex h-56 w-40 items-center justify-center rounded-lg bg-gray-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    </div>

    <div class="flex-1">
      <CommonOutputsConfigurableFields :config="gameOutputLayout">
        <template #title>
          <div>
            <div class="text-sm text-gray-500">Название</div>
            <div class="text-xl font-medium text-gray-900">{{ game.title }}</div>
          </div>
        </template>

        <template #completionDate>
          <div>
            <div class="text-sm text-gray-500">Дата прохождения</div>
            <div class="text-base text-gray-900">
              <UiDateDisplay v-if="game.completionDate" :date="game.completionDate" />
              <span v-else>—</span>
            </div>
          </div>
        </template>

        <template #playTimeHours>
          <div>
            <div class="text-sm text-gray-500">Время в игре (часы)</div>
            <div class="text-base text-gray-900">{{ game.playTimeHours ?? '—' }}</div>
          </div>
        </template>

        <template #rating>
          <div>
            <div class="text-sm text-gray-500">Оценка</div>
            <div class="text-base text-gray-900">
              {{ game.rating != null ? `${game.rating}/100` : '—' }}
            </div>
          </div>
        </template>

        <template #developers>
          <div>
            <div class="text-sm text-gray-500">Разработчики</div>
            <div class="mt-1 flex flex-wrap gap-2" v-if="game.developers?.length">
              <NuxtLink
                v-for="developer in game.developers"
                :key="developer.id"
                :to="`/games/developers/${developer.id}`"
                class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {{ developer.fullName }}
              </NuxtLink>
            </div>
            <div v-else class="text-base text-gray-900">—</div>
          </div>
        </template>

        <template #publishers>
          <div>
            <div class="text-sm text-gray-500">Издатели</div>
            <div class="mt-1 flex flex-wrap gap-2" v-if="game.publishers?.length">
              <NuxtLink
                v-for="publisher in game.publishers"
                :key="publisher.id"
                :to="`/games/publishers/${publisher.id}`"
                class="inline-flex rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {{ publisher.fullName }}
              </NuxtLink>
            </div>
            <div v-else class="text-base text-gray-900">—</div>
          </div>
        </template>

        <template #comment>
          <EntitiesCommonCommentBlock :comment="game.comment" />
        </template>

        <template #createdAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Создано</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="game.createdAt" /></div>
          </div>
        </template>

        <template #updatedAt>
          <div>
            <div class="tracking-wide text-sm text-gray-500">Обновлено</div>
            <div class="m-0 text-gray-900"><UiDateDisplay :date="game.updatedAt" /></div>
          </div>
        </template>
      </CommonOutputsConfigurableFields>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NamedEntity {
  id: string
  fullName: string
}

interface GameDetailsModel {
  title: string
  completionDate?: string | null
  playTimeHours?: number | null
  rating?: number | null
  comment?: string | null
  cover?: string | null
  developers?: NamedEntity[]
  publishers?: NamedEntity[]
  createdAt: string
  updatedAt: string
}

interface OutputFieldConfig {
  id: string
}

interface OutputRowConfig {
  columns?: number
  fields: OutputFieldConfig[]
}

interface Props {
  game: GameDetailsModel
}

const props = defineProps<Props>()

const config = useRuntimeConfig()

const gameOutputLayout: OutputRowConfig[] = [
  {
    columns: 1,
    fields: [{ id: 'title' }],
  },
  {
    columns: 1,
    fields: [{ id: 'completionDate' }],
  },
  {
    columns: 2,
    fields: [{ id: 'playTimeHours' }, { id: 'rating' }],
  },
  {
    columns: 2,
    fields: [{ id: 'developers' }, { id: 'publishers' }],
  },
  {
    columns: 1,
    fields: [{ id: 'comment' }],
  },
  {
    columns: 2,
    fields: [{ id: 'createdAt' }, { id: 'updatedAt' }],
  },
]

const coverUrl = computed(() => {
  if (!props.game.cover) {
    return ''
  }

  return props.game.cover.startsWith('http')
    ? props.game.cover
    : `${config.public.apiBase}${props.game.cover}`
})
</script>
