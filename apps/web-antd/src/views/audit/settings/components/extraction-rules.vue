<script setup lang="ts">
import type { FieldExtractionRule } from '#/types/settings';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { useSortable } from '@vueuse/integrations/useSortable';
import { Button, message, Popconfirm, Tag } from 'ant-design-vue';

import { updateExtractionRulesApi } from '#/api/settings';

import StrategyFormModal from '../modals/strategy-form-modal.vue';

const props = defineProps<{
  billTypeId: string;
  rules: FieldExtractionRule[];
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const localRules = ref<FieldExtractionRule[]>([...props.rules]);
const listRef = ref<HTMLElement>();
const modalOpen = ref(false);
const editingRule = ref<FieldExtractionRule | null>(null);
const saving = ref(false);

// 监听props变化
watch(
  () => props.rules,
  (newRules) => {
    localRules.value = [...newRules];
  },
);

// 初始化拖拽
useSortable(listRef, localRules, {
  animation: 200,
  handle: '.drag-handle',
  onUpdate: async () => {
    await saveRulesOrder();
  },
});

// 保存规则顺序
async function saveRulesOrder() {
  saving.value = true;
  try {
    await updateExtractionRulesApi(props.billTypeId, localRules.value);
    message.success('规则顺序已更新');
    emit('refresh');
  } catch (error) {
    message.error('保存失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
}

// 编辑规则
function handleEdit(rule: FieldExtractionRule) {
  editingRule.value = rule;
  modalOpen.value = true;
}

// 添加规则
function handleAdd() {
  editingRule.value = null;
  modalOpen.value = true;
}

// 删除规则
async function handleDelete(ruleId: string) {
  localRules.value = localRules.value.filter((r) => r.id !== ruleId);
  await saveRulesOrder();
}

// 保存成功回调
function handleSaveSuccess() {
  modalOpen.value = false;
  emit('refresh');
}

// 策略类型标签颜色
const strategyColors: Record<string, string> = {
  ID: 'blue',
  XPATH: 'green',
  CSS: 'orange',
  REGEX: 'purple',
};
</script>

<template>
  <div>
    <div ref="listRef" class="space-y-2">
      <div
        v-for="(rule, index) in localRules"
        :key="rule.id"
        class="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:shadow-md"
      >
        <!-- 拖拽手柄 -->
        <div
          class="drag-handle flex cursor-move items-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Icon icon="lucide:grip-vertical" class="size-4" />
        </div>

        <!-- 序号 -->
        <div
          class="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
        >
          {{ index + 1 }}
        </div>

        <!-- 字段信息 -->
        <div class="flex-1">
          <div class="mb-1 flex items-center gap-2">
            <span class="font-medium">{{ rule.fieldDesc }}</span>
            <code
              class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {{ rule.fieldKey }}
            </code>
            <Tag v-if="rule.required" color="red" size="small">必填</Tag>
          </div>
          <div class="flex flex-wrap gap-1">
            <Tag
              v-for="(strategy, idx) in rule.strategies"
              :key="idx"
              :color="strategyColors[strategy.type]"
              size="small"
            >
              {{ strategy.type }}
            </Tag>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-1">
          <Button
            type="text"
            size="small"
            class="opacity-0 transition-opacity group-hover:opacity-100"
            @click="handleEdit(rule)"
          >
            <Icon icon="lucide:edit" class="size-3" />
          </Button>
          <Popconfirm
            title="确定要删除此规则吗?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(rule.id)"
          >
            <Button
              type="text"
              danger
              size="small"
              class="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Icon icon="lucide:trash-2" class="size-3" />
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <Button
      type="dashed"
      block
      class="mt-3"
      :loading="saving"
      @click="handleAdd"
    >
      <Icon icon="lucide:plus" class="mr-1 size-4" />
      添加字段提取规则
    </Button>

    <!-- 提取策略表单弹窗 -->
    <StrategyFormModal
      v-model:open="modalOpen"
      :bill-type-id="billTypeId"
      :rule="editingRule"
      @success="handleSaveSuccess"
    />
  </div>
</template>
