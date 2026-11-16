<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button, Input } from 'ant-design-vue';
import { Search } from '@vben/icons';
import {
  deptName,
  searchPeople,
  userName,
} from '#/api/mock-authorization-groups';

const props = defineProps<{ excludeId?: string; label: string }>();
const selected = defineModel<string>({ required: true });
const text = ref(selected.value ? userName(selected.value) : '');
const page = ref(1);
const result = ref<ReturnType<typeof searchPeople>>();
watch(selected, (id) => {
  if (id && !result.value) text.value = userName(id);
});
function clearResults() {
  result.value = undefined;
  selected.value = '';
  page.value = 1;
}
function query(number: number) {
  if (!text.value.trim()) return;
  page.value = number;
  result.value = searchPeople(text.value, number, props.excludeId);
  selected.value = result.value.total === 1 ? result.value.rows[0]!.id : '';
}
</script>
<template>
  <div class="person-search">
    <form @submit.prevent="query(1)">
      <Input
        v-model:value="text"
        :aria-label="label"
        allow-clear
        placeholder="输入姓名或工号"
        @update:value="clearResults"
        ><template #prefix><Search :size="16" /></template></Input
      ><Button type="primary" html-type="submit" :disabled="!text.trim()"
        >查询</Button
      >
    </form>
    <p v-if="result?.total === 0" role="status">
      未找到匹配人员，请核对姓名或工号。
    </p>
    <div v-if="result && result.total > 1" class="person-matches">
      <p>找到 {{ result.total }} 人，请按部门或工号选择。</p>
      <button
        v-for="p in result.rows"
        :key="p.id"
        type="button"
        :aria-pressed="selected === p.id"
        @click="selected = p.id"
      >
        {{ p.name }} · {{ deptName(p.dept) }} · {{ p.id }}
      </button>
      <div v-if="result.total > result.pageSize">
        <Button size="small" :disabled="page === 1" @click="query(page - 1)"
          >上一页</Button
        ><span
          >{{ page }} / {{ Math.ceil(result.total / result.pageSize) }}</span
        ><Button
          size="small"
          :disabled="page * result.pageSize >= result.total"
          @click="query(page + 1)"
          >下一页</Button
        >
      </div>
    </div>
  </div>
</template>
