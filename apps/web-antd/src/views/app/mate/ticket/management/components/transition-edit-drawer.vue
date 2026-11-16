<script setup lang="ts">
import type { FlowEdge, FlowNode } from '#/types/ticket';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Select,
} from 'ant-design-vue';

import {
  cloneTicketSchemas,
  mockPlatformActionEvents,
} from '#/api/mock-data-ticket';

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save', edge: FlowEdge): void;
}>();

/** 当前场景的工单字段（系统字段 + 自定义字段） */
const sceneFields = computed(() => {
  const schemas = cloneTicketSchemas();
  const schema = schemas[0];
  if (!schema) return [];
  return [...(schema.systemFields ?? []), ...(schema.customFields ?? [])];
});

/** 工单字段下拉选项 */
const fieldOptions = computed(() =>
  sceneFields.value.map((f) => ({
    label: `${f.name}（${f.code}）`,
    value: f.code,
  })),
);

/** 动作事件下拉选项 */
const eventOptions = computed(() =>
  mockPlatformActionEvents.map((e) => ({
    label: `${e.name}${e.desc ? ` · ${e.desc}` : ''}`,
    value: e.code,
  })),
);

interface Props {
  /** Drawer 是否打开（支持 v-model:open） */
  open: boolean;
  /** 当前正在编辑的流转边，为 null 表示新增 */
  edge: FlowEdge | null;
  /** 全部节点（用于目标状态下拉选项） */
  nodes: FlowNode[];
}

/** 表单本地副本：避免直接修改 props.edge */
const form = ref<FlowEdge>({
  id: '',
  from: '',
  to: '',
  action: '',
  condition: '',
  rollback: false,
  async: false,
  requiredFields: [],
  actionEvents: [],
});

/** 目标状态可选列表：排除源节点自身，避免自循环 */
const targetOptions = computed(() =>
  props.nodes.map((n) => ({
    label: n.name,
    value: n.id,
    disabled: n.id === form.value.from,
  })),
);

/** 同步外部传入 edge → 本地表单 */
watch(
  () => props.edge,
  (val) => {
    if (val) {
      form.value = { ...val };
    } else if (props.nodes.length > 0) {
      // 新增模式：默认指向第一个非源节点
      const first = props.nodes[0]!;
      form.value = {
        id: `fe-${Date.now()}`,
        from: '',
        to: first.id,
        action: '',
        condition: '',
        rollback: false,
        async: false,
        requiredFields: [],
        actionEvents: [],
      };
    }
  },
  { immediate: true },
);

function close() {
  emit('update:open', false);
}

/** 添加一个动作事件（空值，用户再选） */
function addActionEvent() {
  form.value.actionEvents ??= [];
  form.value.actionEvents.push('');
}

/** 删除某个动作事件 */
function removeActionEvent(index: number) {
  form.value.actionEvents?.splice(index, 1);
}

function handleSave() {
  if (!form.value.to) {
    message.warning('请选择目标状态');
    return;
  }
  if (!form.value.action?.trim()) {
    message.warning('请填写可执行动作名称');
    return;
  }
  emit('save', { ...form.value });
  message.success('流转已保存');
  close();
}
</script>

<template>
  <Drawer
    :open="open"
    title="流转规则编辑"
    :width="520"
    placement="right"
    :mask="true"
    @update:open="(v: boolean) => emit('update:open', v)"
  >
    <!-- 顶部说明卡片：流转规则整体说明 -->
    <div class="rule-intro">
      <div class="rule-intro__icon">
        <Icon icon="lucide:git-branch" class="size-4" />
      </div>
      <div class="rule-intro__body">
        <div class="rule-intro__title">流转规则说明</div>
        <p class="rule-intro__desc">
          流转规则定义了状态之间的跳转路径，将在工单操作面板渲染为按钮。
        </p>
      </div>
    </div>

    <div class="flex flex-col gap-4">
      <Form layout="vertical" :model="form" class="transition-form">
        <Form.Item
          label="流转条件"
          tooltip="自然语言描述触发条件，留空表示默认可走"
        >
          <Input.TextArea
            v-model:value="form.condition"
            :rows="3"
            placeholder="自然语言描述触发条件（可选，无条件则默认可走）"
          />
        </Form.Item>

        <Form.Item
          label="动作按钮名称"
          required
          tooltip="定义工单详情页中按钮的展示文字"
        >
          <Input
            v-model:value="form.action"
            placeholder="定义操作按钮名称（如：验收通过 / 退回整改）"
          />
          <div class="field-hint">
            <Icon icon="lucide:cursor-click" class="size-3" />
            <span>用户点击此按钮将触发该流转</span>
          </div>
        </Form.Item>

        <Form.Item
          label="目标状态"
          required
          tooltip="流转指向的下一状态，不能选择当前节点自身"
        >
          <Select
            v-model:value="form.to"
            :options="targetOptions"
            placeholder="选择流转目标节点"
            option-filter-prop="label"
            show-search
          />
          <div class="field-hint">
            <Icon icon="lucide:info" class="size-3" />
            <span>将作为操作按钮点击后的目标节点</span>
          </div>
        </Form.Item>

        <Form.Item
          label="必填事项"
          tooltip="流转执行时，这些工单字段必须填写完成才能继续"
        >
          <Select
            v-model:value="form.requiredFields"
            mode="multiple"
            :options="fieldOptions"
            placeholder="选择流转时必须填写的工单字段"
            show-search
            :disabled="fieldOptions.length === 0"
          />
          <div class="field-hint">
            <Icon icon="lucide:list-checks" class="size-3" />
            <span>支持多选；留空表示不强制字段校验</span>
          </div>
        </Form.Item>

        <!-- 事件卡片列表 -->
        <Form.Item
          label="事件"
          tooltip="流转完成后自动触发的平台事件（通知、SLA 计算、子任务等）"
        >
          <div class="flex flex-col gap-2">
            <Card
              v-for="(_evt, idx) in form.actionEvents"
              :key="idx"
              size="small"
              :title="`事件 ${idx + 1}`"
              class="action-event-card"
            >
              <template #extra>
                <Button
                  type="link"
                  size="small"
                  danger
                  @click="removeActionEvent(idx)"
                >
                  删除
                </Button>
              </template>
              <Select
                v-model:value="form.actionEvents![idx]"
                :options="eventOptions"
                placeholder="选择一个平台动作事件"
                :disabled="eventOptions.length === 0"
                class="w-full"
              />
            </Card>

            <Button
              class="flex items-center justify-center gap-1 border-dashed"
              block
              @click="addActionEvent"
            >
              <Icon icon="lucide:plus" class="size-4" />
              {{ form.actionEvents?.length ? '继续添加事件' : '添加事件' }}
            </Button>
          </div>
          <div class="field-hint">
            <Icon icon="lucide:play-circle" class="size-3" />
            <span>支持添加多个事件；按顺序执行</span>
          </div>
        </Form.Item>
      </Form>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button @click="close">取消</Button>
        <Button type="primary" @click="handleSave">保存</Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.transition-form :deep(.ant-form-item) {
  margin-bottom: 16px;
}

.transition-form :deep(.ant-form-item):last-child {
  margin-bottom: 0;
}

/* ============ 顶部说明卡片 ============ */
.rule-intro {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%);
  border: 1px solid #ddd1f7;
  border-radius: 10px;
}

.rule-intro__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #fff;
  background: linear-gradient(135deg, #7f77dd, #9b6fce);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgb(127 119 221 / 35%);
}

.rule-intro__body {
  flex: 1;
  min-width: 0;
}

.rule-intro__title {
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #3c3489;
}

.rule-intro__desc {
  margin: 0 0 6px;
  font-size: 12px;
  line-height: 1.6;
  color: #5b4f8a;
}

.rule-intro__list {
  padding-left: 16px;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.7;
  color: #6e62a3;
}

.rule-intro__list li b {
  color: #3c3489;
}

/* ============ 字段底部提示 ============ */
.field-hint {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.4;
  color: #94a8a1;
}

.field-hint .anticon {
  color: #b8c3be;
}
</style>
