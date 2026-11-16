<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ icon: string }>();
// Bundle settings icons with the page so they also render without Iconify API access.
const paths: Record<string, string[]> = {
  sun: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
    'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  ],
  'calendar-days': [
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
    'M7 14h1m4 0h1m4 0h1M7 18h1m4 0h1',
  ],
  'folder-kanban': [
    'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7',
    'M7 11v6m5-6v3m5-3v5',
  ],
  'folder-clock': [
    'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v3M3 7v12a2 2 0 0 0 2 2h6',
    'M17 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10M17 14v3l2 1',
  ],
  'building-2': [
    'M6 22V4l12-2v20M2 22h20M9 7h1m4-1h1M9 11h1m4-1h1M9 15h1m4-1h1M10 22v-4h4v4',
  ],
  'calendar-range': [
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2',
    'M7 15h10M7 18h6',
  ],
  'calendar-clock': [
    'M8 2v4m8-4v4M3 10h11M3 17V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4M3 17v3a2 2 0 0 0 2 2h5',
    'M17 12a5 5 0 1 0 0 10 5 5 0 0 0 0-10M17 14v3l2 1',
  ],
  'users-round': [
    'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8M2 21v-2a6 6 0 0 1 12 0v2M16 3a4 4 0 0 1 0 8m2 4a5 5 0 0 1 4 5v1',
  ],
  'loader-circle': ['M21 12a9 9 0 1 1-6-8.5'],
  'circle-alert': ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8v5m0 4h.01'],
  'clock-3': ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v5h4'],
  'pencil-line': [
    'M12 20h9M4 16l12-12a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4M14 6l3 3',
  ],
  x: ['M6 6l12 12M18 6 6 18'],
  plus: ['M12 5v14M5 12h14'],
  search: ['M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15M16 16l5 5'],
};
const strokes = computed(
  () => paths[props.icon.replace('lucide:', '')] ?? paths['calendar-days'],
);
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, index) in strokes" :key="index" :d="d" />
  </svg>
</template>
