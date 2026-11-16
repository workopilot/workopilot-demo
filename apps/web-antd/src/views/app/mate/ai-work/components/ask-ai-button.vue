<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    context: string;
    employeeId?: 'weekly-analysis' | 'weekly-assistant' | 'weekly-review';
    label?: string;
  }>(),
  { employeeId: 'weekly-analysis', label: 'Ask AI' },
);

const router = useRouter();

function ask() {
  void router.push({
    path: `/app/mate/employee/${props.employeeId}/chat`,
    query: { context: props.context },
  });
}
</script>

<template>
  <Button @click="ask">
    <Icon icon="lucide:sparkles" />
    {{ label }}
  </Button>
</template>
