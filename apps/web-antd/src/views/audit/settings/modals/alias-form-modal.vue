<script setup lang="ts">
import type { ExpenseCategory } from '#/types/settings';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Input, message, Modal, Space, Tag } from 'ant-design-vue';

import { updateCategoryAliasesApi } from '#/api/settings';

const props = defineProps<{
  category: ExpenseCategory | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const aliases = ref<string[]>([]);
const newAlias = ref('');

// 监听弹窗打开
watch(
  () => props.open,
  (open) => {
    if (open && props.category) {
      aliases.value = [...(props.category.aliases || [])];
      newAlias.value = '';
    }
  },
);

// 添加别名
function addAlias() {
  const alias = newAlias.value.trim();
  if (!alias) {
    return;
  }

  if (aliases.value.includes(alias)) {
    message.warning('别名已存在');
    return;
  }

  aliases.value.push(alias);
  newAlias.value = '';
}

// 删除别名
function removeAlias(alias: string) {
  aliases.value = aliases.value.filter((a) => a !== alias);
}

// 保存别名
async function handleSubmit() {
  if (!props.category) return;

  loading.value = true;
  try {
    await updateCategoryAliasesApi(props.category.id, aliases.value);
    message.success('别名更新成功');
    emit('success');
  } catch (error) {
    message.error('更新失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleCancel() {
  emit('update:open', false);
}

// 处理回车键
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    addAlias();
  }
}
</script>

<template>
  <Modal
    :open="open"
    title="编辑AI识别别名"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <div v-if="category" class="space-y-4 py-4">
      <!-- 科目信息 -->
      <div class="rounded-lg bg-muted/30 p-3">
        <div class="text-sm">
          <span class="text-muted-foreground">科目名称:</span>
          <span class="ml-2 font-medium">{{ category.name }}</span>
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          AI会使用这些别名来识别和匹配费用科目
        </div>
      </div>

      <!-- 添加别名输入框 -->
      <div>
        <label class="mb-2 block text-sm font-medium">添加别名</label>
        <Space.Compact class="w-full">
          <Input
            v-model:value="newAlias"
            placeholder="输入别名,按回车添加"
            @keydown="handleKeydown"
          />
          <a-button type="primary" @click="addAlias">
            <Icon icon="lucide:plus" class="size-4" />
          </a-button>
        </Space.Compact>
      </div>

      <!-- 别名列表 -->
      <div>
        <label class="mb-2 block text-sm font-medium">
          当前别名 ({{ aliases.length }})
        </label>
        <div
          v-if="aliases.length > 0"
          class="min-h-[100px] rounded-lg border bg-card p-3"
        >
          <Space wrap>
            <Tag
              v-for="alias in aliases"
              :key="alias"
              color="blue"
              closable
              @close="removeAlias(alias)"
            >
              {{ alias }}
            </Tag>
          </Space>
        </div>
        <div
          v-else
          class="flex min-h-[100px] items-center justify-center rounded-lg border border-dashed text-muted-foreground"
        >
          暂无别名
        </div>
      </div>
    </div>
  </Modal>
</template>
