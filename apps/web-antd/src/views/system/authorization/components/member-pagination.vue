<script setup lang="ts">
import { Pagination } from 'ant-design-vue';

defineProps<{ total: number; label: string; unit: string }>();
const page = defineModel<number>('page', { required: true });
const pageSize = defineModel<number>('pageSize', { required: true });
</script>

<template>
  <nav class="gm-pagination" :aria-label="label + '分页'">
    <span>共 {{ total }} {{ unit }}</span>
    <Pagination
      v-model:current="page"
      :page-size="pageSize"
      :total="total"
      :show-size-changer="false"
      size="small"
      simple
    />
    <select v-model.number="pageSize" :aria-label="label + '每页条数'">
      <option v-for="size in [20, 50, 100]" :key="size" :value="size">
        {{ size }} 条/页
      </option>
    </select>
  </nav>
</template>
