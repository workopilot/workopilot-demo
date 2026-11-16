<script setup lang="ts">
import type { PolicyClause } from '#/types/policy';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  Input,
  message,
  Popconfirm,
  Spin,
} from 'ant-design-vue';

import {
  createPolicyClauseApi,
  deletePolicyClauseApi,
  getPolicyClausesApi,
  updatePolicyClauseApi,
} from '#/api/policy';

const props = defineProps<{
  policyId: string;
}>();

const clauses = ref<PolicyClause[]>([]);
const loading = ref(false);
const activeId = ref<string>('');
const searchText = ref('');
const isEditing = ref(false);

// Editing state
const editClauseCode = ref('');
const editTitle = ref('');
const editContent = ref('');
const editParams = ref('');
const editOriginalText = ref('');
const editParamsVisible = ref(false);

async function fetchClauses() {
  if (!props.policyId) return;
  loading.value = true;
  try {
    const res = await getPolicyClausesApi(props.policyId);
    clauses.value = res.data;
    if (clauses.value.length > 0 && !activeId.value) {
      handleSelect(clauses.value[0]);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.policyId,
  (val) => {
    if (val) fetchClauses();
  },
  { immediate: true },
);

function handleSelect(clause: PolicyClause) {
  activeId.value = clause.id;
  editClauseCode.value = clause.clauseCode || '';
  editTitle.value = clause.title;
  editContent.value = clause.content;
  editOriginalText.value = clause.originalText || '';
  editParams.value = clause.params
    ? JSON.stringify(clause.params, null, 2)
    : '';
  isEditing.value = false;
}

async function handleAdd() {
  try {
    const res = await createPolicyClauseApi({
      policyId: props.policyId,
      clauseCode: String(clauses.value.length + 1),
      title: '新条款',
      content: '',
      source: 'manual',
    });
    clauses.value.push(res.data);
    handleSelect(res.data);
    message.success('添加成功');
  } catch (error) {
    console.error(error);
  }
}

async function handleSave() {
  if (!activeId.value) return;
  isEditing.value = true;
  try {
    let paramsObj;
    if (editParams.value) {
      try {
        paramsObj = JSON.parse(editParams.value);
      } catch {
        message.error('AI参数JSON格式错误');
        isEditing.value = false;
        return;
      }
    }

    const res = await updatePolicyClauseApi(activeId.value, {
      clauseCode: editClauseCode.value,
      title: editTitle.value,
      content: editContent.value,
      params: paramsObj,
      originalText: editOriginalText.value,
      summary: `${editContent.value.replaceAll(/<[^>]+>/g, '').slice(0, 50)}...`,
    });

    const idx = clauses.value.findIndex((c) => c.id === activeId.value);
    if (idx !== -1) {
      clauses.value[idx] = res.data;
    }
    message.success('保存成功');
  } catch (error) {
    console.error(error);
  } finally {
    isEditing.value = false;
  }
}

async function handleDelete() {
  if (!activeId.value) return;
  try {
    await deletePolicyClauseApi(activeId.value);
    const idx = clauses.value.findIndex((c) => c.id === activeId.value);
    clauses.value.splice(idx, 1);
    if (clauses.value.length > 0) {
      handleSelect(clauses.value[0]);
    } else {
      activeId.value = '';
    }
    message.success('删除成功');
  } catch (error) {
    console.error(error);
  }
}
</script>

<template>
  <div class="flex h-full overflow-hidden border bg-white">
    <!-- Left: List -->
    <div class="flex w-[300px] flex-col border-r">
      <div class="border-b p-2">
        <div class="mb-2 flex gap-2">
          <Input.Search
            v-model:value="searchText"
            placeholder="搜索条款..."
            size="small"
          />
          <Button type="primary" size="small" @click="handleAdd">
            <template #icon><Icon icon="lucide:plus" /></template>
          </Button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        <Spin :spinning="loading">
          <div
            v-if="clauses.length === 0"
            class="py-8 text-center text-gray-400"
          >
            暂无条款
          </div>
          <div
            v-for="clause in clauses"
            :key="clause.id"
            class="mb-3 cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md"
            :class="{
              'border-blue-500 ring-1 ring-blue-500': activeId === clause.id,
              'border-gray-200': activeId !== clause.id,
            }"
            @click="handleSelect(clause)"
          >
            <div class="mb-1 flex items-center justify-between">
              <span class="font-bold text-gray-800">
                <span v-if="clause.clauseCode" class="mr-1 text-blue-600">
                  {{ clause.clauseCode }}
                </span>
                {{ clause.title }}
              </span>
              <Icon
                v-if="clause.source === 'ai'"
                icon="lucide:bot"
                class="size-4 text-blue-500"
              />
              <Icon v-else icon="lucide:user" class="size-4 text-gray-400" />
            </div>
            <div class="line-clamp-2 text-xs text-gray-500">
              {{ clause.summary }}
            </div>
          </div>
        </Spin>
      </div>
    </div>

    <!-- Right: Editor -->
    <div class="flex flex-1 flex-col overflow-hidden bg-gray-50">
      <div v-if="activeId" class="flex h-full flex-col">
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b bg-white px-6 py-3"
        >
          <div class="mr-4 flex flex-1 items-center gap-2">
            <span class="font-bold">No.</span>
            <Input
              v-model:value="editClauseCode"
              class="w-20 font-bold"
              :bordered="false"
              placeholder="编号"
            />
            <Input
              v-model:value="editTitle"
              class="flex-1 text-lg font-bold"
              :bordered="false"
              placeholder="请输入条款标题"
            />
          </div>
          <div class="flex gap-2">
            <Popconfirm title="确定删除此条款吗？" @confirm="handleDelete">
              <Button danger ghost size="small">删除条款</Button>
            </Popconfirm>
            <Button
              type="primary"
              size="small"
              :loading="isEditing"
              @click="handleSave"
            >
              保存
            </Button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm">
            <div class="mb-2 text-sm text-gray-400">条款正文</div>
            <textarea
              v-model="editContent"
              class="h-[300px] w-full resize-none rounded border border-gray-200 p-4 focus:border-blue-500 focus:outline-none"
              placeholder="请输入条款内容..."
            ></textarea>

            <div class="mb-2 mt-4 text-sm text-gray-400">引用原文</div>
            <textarea
              v-model="editOriginalText"
              class="h-[150px] w-full resize-none rounded border border-gray-200 bg-gray-50 p-4 font-mono text-sm focus:border-blue-500 focus:outline-none"
              placeholder="AI识别的原文片段..."
            ></textarea>

            <!-- Structured Params (Hidden by default, keep for compatibility) -->
            <div v-if="editParams" class="mt-6 border-t pt-4">
              <div
                class="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
                @click="editParamsVisible = !editParamsVisible"
              >
                <Icon
                  :icon="
                    editParamsVisible
                      ? 'lucide:chevron-down'
                      : 'lucide:chevron-right'
                  "
                />
                结构化参数 (已配置)
              </div>
              <div
                v-show="editParamsVisible"
                class="mt-2 rounded bg-gray-50 p-4"
              >
                <Input.TextArea
                  v-model:value="editParams"
                  :rows="4"
                  class="font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="flex h-full items-center justify-center text-gray-400">
        <Empty description="请选择左侧条款或新建" />
      </div>
    </div>
  </div>
</template>
