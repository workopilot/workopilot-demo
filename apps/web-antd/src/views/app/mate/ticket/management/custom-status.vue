<script setup lang="ts">
import type {
  FlowEdge,
  FlowNode,
  FlowNodeType,
  OwnerRoleType,
  StatusFlowAiSuggestion,
  SubTaskTemplate,
} from '#/types/ticket';

import { computed, onMounted, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
} from 'ant-design-vue';

import { mockFlowGraphs } from '#/api/mock-data-ticket';
import {
  getPositionsApi,
  getRolesApi,
  getStaffsApi,
  getStatusFlowAiSuggestionsApi,
} from '#/api/ticket';

import TransitionEditDrawer from './components/transition-edit-drawer.vue';

// ==================== 颜色板 ====================

interface StatusColor {
  key: string;
  light: string;
  text: string;
  value: string;
}

const STATUS_COLORS: StatusColor[] = [
  { key: 'amber', value: '#EF9F27', light: '#FAEEDA', text: '#854F0B' },
  { key: 'blue', value: '#378ADD', light: '#E6F1FB', text: '#185FA5' },
  { key: 'green', value: '#3B6D11', light: '#EAF3DE', text: '#27500A' },
  { key: 'green2', value: '#639922', light: '#EAF3DE', text: '#3B6D11' },
  { key: 'purple', value: '#7F77DD', light: '#EEEDFE', text: '#3C3489' },
  { key: 'coral', value: '#D85A30', light: '#FAECE7', text: '#993C1D' },
  { key: 'teal', value: '#1D9E75', light: '#E1F5EE', text: '#085041' },
  { key: 'pink', value: '#D4537E', light: '#FBEAF0', text: '#72243E' },
  { key: 'gray', value: '#888780', light: '#F1EFE8', text: '#444441' },
  { key: 'red', value: '#A32D2D', light: '#FCEBEB', text: '#791F1F' },
];

function getColor(key?: string): StatusColor {
  return STATUS_COLORS.find((c) => c.key === key) || STATUS_COLORS[1]!;
}

// ==================== 节点类型 / 处理人角色 文案映射 ====================

const NODE_TYPE_LABEL: Record<FlowNodeType, string> = {
  start: '起点',
  normal: '常规',
  decision: '决策',
  suspend: '挂起',
  end: '终点',
  subtask: '子任务',
};

const OWNER_ROLE_OPTIONS: { label: string; value: OwnerRoleType }[] = [
  { label: '指定岗位', value: 'position' },
  { label: '指定角色', value: 'role' },
  { label: '指定人员', value: 'person' },
  { label: '单据创建人', value: 'creator' },
  { label: '部门领导', value: 'leader' },
  { label: '派单规则', value: 'dispatch-rule' },
];

const NODE_TYPE_OPTIONS: { label: string; value: FlowNodeType }[] = [
  { label: '起点', value: 'start' },
  { label: '常规', value: 'normal' },
  { label: '决策', value: 'decision' },
  { label: '挂起', value: 'suspend' },
  { label: '终点', value: 'end' },
  { label: '子任务', value: 'subtask' },
];

/** 多行文本输入（节点说明） */
const { TextArea } = Input;

// ==================== 流程数据 ====================

/** 当前场景流程图：取 mockFlowGraphs 第一项 */
const flowGraph = ref(mockFlowGraphs[0]!);

/** 节点排序（order 升序；同 order 按 id） */
const sortedNodes = computed<FlowNode[]>(() =>
  flowGraph.value.nodes.toSorted(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id),
  ),
);

/** 当前选中节点 ID */
const selectedId = ref<string>('');

const selectedNode = computed<FlowNode | null>(
  () => sortedNodes.value.find((n) => n.id === selectedId.value) || null,
);

/** 选中节点的出边列表 */
const outgoingEdges = computed<FlowEdge[]>(() =>
  flowGraph.value.edges.filter((e) => e.from === selectedId.value),
);

/** 选中节点的入边列表（流入流转卡片） */
const incomingEdges = computed<FlowEdge[]>(() =>
  flowGraph.value.edges.filter((e) => e.to === selectedId.value),
);

/** 节点 id → 节点 name 映射 */
const nodeMap = computed<Record<string, FlowNode>>(() => {
  const map: Record<string, FlowNode> = {};
  flowGraph.value.nodes.forEach((n) => {
    map[n.id] = n;
  });
  return map;
});

/** 选中节点关联的子任务模板 */
const selectedSubTasks = computed<SubTaskTemplate[]>(() => {
  const ids = selectedNode.value?.subTaskTemplateIds || [];
  if (ids.length === 0) return [];
  return flowGraph.value.subTaskTemplates.filter((t) => ids.includes(t.id));
});

// ==================== 左侧节点分组：主流程 / 分支与异常 / 取消 ====================

/** 是否取消节点：终点且名称含「取消」 */
function isCancelNode(node: FlowNode): boolean {
  return node.type === 'end' && node.name.includes('取消');
}

/** ① 主流程节点：整数 order，按流程顺序排列 */
const mainNodes = computed<FlowNode[]>(() =>
  sortedNodes.value.filter((n) => Number.isInteger(n.order ?? 0)),
);

/** ② 分支与异常节点：小数 order 插队，且非取消节点 */
const branchNodes = computed<FlowNode[]>(() =>
  sortedNodes.value.filter(
    (n) => !Number.isInteger(n.order ?? 0) && !isCancelNode(n),
  ),
);

/** ③ 取消节点：终点且名称含「取消」 */
const cancelNodes = computed<FlowNode[]>(() =>
  sortedNodes.value.filter((n) => isCancelNode(n)),
);

/** 节点的出边（卡片「流出 N」徽标） */
function outEdgesOf(nodeId: string): FlowEdge[] {
  return flowGraph.value.edges.filter((e) => e.from === nodeId);
}

/** 主流程相邻两节点间的流转动作（卡片间 ↓ 标签） */
const mainTransitions = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {};
  const mains = mainNodes.value;
  for (let i = 0; i < mains.length - 1; i++) {
    const prev = mains[i]!;
    const next = mains[i + 1]!;
    const edge = flowGraph.value.edges.find(
      (e) => e.from === prev.id && e.to === next.id && !e.rollback,
    );
    map[prev.id] = edge?.action ?? '';
  }
  return map;
});

// ==================== 确认状态 ====================

/** 节点名去掉历史版本遗留的 SLA 挂起后缀 */
function cleanNodeName(name: string): string {
  return name.replace(' · SLA 挂起', '');
}

// ==================== 选中 / 新增节点 ====================

function selectNode(id: string) {
  selectedId.value = id;
}

/** 新增自定义状态节点（默认追加为主流程节点） */
function addStatus() {
  let maxOrder = 0;
  for (const n of sortedNodes.value) {
    maxOrder = Math.max(maxOrder, n.order ?? 0);
  }
  const newNode: FlowNode = {
    id: `fn-${Date.now()}`,
    code: `CUSTOM_${flowGraph.value.nodes.length + 1}`,
    name: '新状态',
    ownerRole: '承办人',
    type: 'normal',
    system: false,
    order: maxOrder + 1,
    desc: '请在右侧编辑名称、颜色与说明',
    colorKey: 'teal',
  };
  flowGraph.value.nodes.push(newNode);
  selectedId.value = newNode.id;
  message.success('已新增状态，请在右侧完善信息');
}

// ==================== 最大化模式 ====================

const isMaximized = ref(false);

function toggleMaximize() {
  isMaximized.value = !isMaximized.value;
}

// ==================== AI 推荐 Drawer ====================

const aiOpen = ref(false);
const aiLoading = ref(false);
const aiSuggestions = ref<StatusFlowAiSuggestion[]>([]);

async function openAiDrawer() {
  aiOpen.value = true;
  if (aiSuggestions.value.length > 0) return;
  aiLoading.value = true;
  try {
    const res = await getStatusFlowAiSuggestionsApi();
    aiSuggestions.value = res.data;
  } catch {
    message.error('AI 推荐加载失败');
  } finally {
    aiLoading.value = false;
  }
}

// ==================== 处理人角色下拉数据 ====================

const positionOptions = ref<{ label: string; value: string }[]>([]);
const roleOptions = ref<{ label: string; value: string }[]>([]);
const staffOptions = ref<{ label: string; value: string }[]>([]);

async function loadOwnerOptions() {
  if (positionOptions.value.length === 0) {
    const r1 = await getPositionsApi();
    positionOptions.value = r1.data.map((p) => ({
      label: p.name,
      value: p.id,
    }));
  }
  if (roleOptions.value.length === 0) {
    const r2 = await getRolesApi();
    roleOptions.value = r2.data.map((r) => ({ label: r.name, value: r.id }));
  }
  if (staffOptions.value.length === 0) {
    const r3 = await getStaffsApi();
    staffOptions.value = r3.data.map((s) => ({
      label: s.name,
      value: s.id,
    }));
  }
}

/** 切换处理人角色类型：清空 ownerRoleConfig 避免脏数据 */
function onOwnerRoleTypeChange(value: any) {
  if (!selectedNode.value || !value) return;
  selectedNode.value.ownerRoleType = value as OwnerRoleType;
  selectedNode.value.ownerRoleConfig = {};
}

/** 处理人角色配置项：安全访问器，自动初始化 ownerRoleConfig */
const ownerPositionId = computed({
  get: () => selectedNode.value?.ownerRoleConfig?.positionId,
  set: (v) => {
    if (!selectedNode.value) return;
    if (!selectedNode.value.ownerRoleConfig)
      selectedNode.value.ownerRoleConfig = {};
    selectedNode.value.ownerRoleConfig.positionId = v;
  },
});
const ownerRoleId = computed({
  get: () => selectedNode.value?.ownerRoleConfig?.roleId,
  set: (v) => {
    if (!selectedNode.value) return;
    if (!selectedNode.value.ownerRoleConfig)
      selectedNode.value.ownerRoleConfig = {};
    selectedNode.value.ownerRoleConfig.roleId = v;
  },
});
const ownerStaffId = computed({
  get: () => selectedNode.value?.ownerRoleConfig?.staffId,
  set: (v) => {
    if (!selectedNode.value) return;
    if (!selectedNode.value.ownerRoleConfig)
      selectedNode.value.ownerRoleConfig = {};
    selectedNode.value.ownerRoleConfig.staffId = v;
  },
});

// ==================== 协助子任务编辑 ====================

/** 新增子任务弹窗 */
const subTaskModalOpen = ref(false);

/** 新增子任务表单 */
const subTaskForm = ref({
  name: '',
  description: '',
  defaultRole: '',
  required: false,
});

/** 岗位名称选项（子任务默认岗位直接存名称，与模板展示一致） */
const positionNameOptions = computed(() =>
  positionOptions.value.map((p) => ({ label: p.label, value: p.label })),
);

function openSubTaskModal() {
  subTaskForm.value = {
    name: '',
    description: '',
    defaultRole: '',
    required: false,
  };
  subTaskModalOpen.value = true;
}

/** 保存新子任务模板：追加进流程模板池，并挂载到当前节点 */
function saveSubTask() {
  const name = subTaskForm.value.name.trim();
  if (!name) {
    message.warning('请填写子任务名称');
    return;
  }
  const node = selectedNode.value;
  if (!node) return;
  const tpl: SubTaskTemplate = {
    id: `st-${Date.now()}`,
    name,
    description: subTaskForm.value.description.trim(),
    defaultRole: subTaskForm.value.defaultRole || '待指派',
    required: subTaskForm.value.required,
  };
  flowGraph.value.subTaskTemplates.push(tpl);
  node.subTaskTemplateIds = [...(node.subTaskTemplateIds ?? []), tpl.id];
  subTaskModalOpen.value = false;
  message.success('已新增子任务模板并挂载到当前状态');
}

/** 从当前节点摘除子任务引用（模板保留在模板池，可继续被其他节点引用） */
function removeSubTask(tplId: string) {
  const node = selectedNode.value;
  if (!node) return;
  node.subTaskTemplateIds = (node.subTaskTemplateIds ?? []).filter(
    (id) => id !== tplId,
  );
  message.success('已从当前状态移除该子任务');
}

// ==================== 流转编辑 Drawer ====================

const edgeDrawerOpen = ref(false);
const editingEdge = ref<FlowEdge | null>(null);

function openEdgeEditor(edge?: FlowEdge) {
  editingEdge.value = edge
    ? { ...edge }
    : {
        id: `fe-${Date.now()}`,
        from: selectedId.value,
        to: '',
        action: '',
        condition: '',
        rollback: false,
        async: false,
      };
  edgeDrawerOpen.value = true;
}

function saveEdge(edge: FlowEdge) {
  const idx = flowGraph.value.edges.findIndex((e) => e.id === edge.id);
  if (idx === -1) {
    flowGraph.value.edges.push(edge);
  } else {
    flowGraph.value.edges[idx] = edge;
  }
}

// ==================== 初始化 ====================

onMounted(async () => {
  if (sortedNodes.value.length > 0) {
    selectedId.value = sortedNodes.value[0]!.id;
  }
  // 预加载处理人下拉数据，避免切换时等待
  loadOwnerOptions().catch(() => {});
});

// ==================== 保存节点信息 ====================

/** 打开节点时的表单快照（用于判断已确认节点是否被编辑） */
let nodeSnapshot = '';

function buildSnapshot(node: FlowNode): string {
  return JSON.stringify({
    code: node.code,
    colorKey: node.colorKey,
    name: node.name,
    order: node.order,
    ownerRoleConfig: node.ownerRoleConfig,
    ownerRoleType: node.ownerRoleType,
    type: node.type,
  });
}

watch(
  selectedId,
  () => {
    if (selectedNode.value) {
      nodeSnapshot = buildSnapshot(selectedNode.value);
    }
  },
  { immediate: true },
);

function saveNode() {
  const node = selectedNode.value;
  if (!node) return;
  const changed = buildSnapshot(node) !== nodeSnapshot;
  nodeSnapshot = buildSnapshot(node);
  // 编辑已确认的规则后，该规则重新进入待确认状态
  if (changed && node.confirmStatus === 'confirmed') {
    node.confirmStatus = 'pending-review';
    node.confirmRecord = undefined;
    message.success('节点信息已更新，规则重新进入待确认');
  } else {
    message.success('节点信息已保存');
  }
}
</script>

<template>
  <div class="custom-status-wrap" :class="{ 'is-maximized': isMaximized }">
    <!-- ============ Header ============ -->
    <header class="cs-header">
      <div class="cs-header__row">
        <div class="cs-header__left">
          <div class="cs-icon-box">
            <Icon icon="lucide:flag" class="size-4" />
          </div>
          <div class="cs-title-block">
            <div class="cs-title-row">
              <h3 class="cs-title">状态流转</h3>
            </div>
            <p class="cs-subtitle">设置工单状态、处理角色和状态流转规则</p>
          </div>
          <button
            class="cs-max-btn"
            :title="isMaximized ? '恢复' : '最大化'"
            @click="toggleMaximize"
          >
            <Icon
              :icon="isMaximized ? 'lucide:minimize-2' : 'lucide:maximize-2'"
              class="size-3.5"
            />
          </button>
        </div>

        <div class="cs-header__right">
          <Button class="cs-ai-btn" @click="openAiDrawer">
            <Icon icon="lucide:sparkles" class="size-3.5" />
            <span>AI 智能推荐</span>
          </Button>
          <Button type="primary" @click="addStatus">
            <Icon icon="lucide:plus" class="size-3.5" />
            <span>新增状态</span>
          </Button>
        </div>
      </div>
    </header>

    <!-- ============ 主体：左侧节点列表（按大类分组） + 右侧节点属性 ============ -->
    <div class="cs-body">
      <!-- 左侧：状态流 -->
      <section class="node-panel">
        <div class="node-panel__scroll">
          <!-- ① 主流程节点 -->
          <div class="np-group-label">
            <span>主流程节点</span>
            <span class="np-group-label__count">{{ mainNodes.length }}</span>
          </div>

          <Empty
            v-if="mainNodes.length === 0"
            description="暂无主流程节点"
            class="my-6"
          />
          <template v-for="(node, idx) in mainNodes" :key="node.id">
            <button
              class="np-card"
              :class="{ 'is-active': selectedId === node.id }"
              type="button"
              @click="selectNode(node.id)"
            >
              <span
                class="np-card__seq"
                :style="{ background: getColor(node.colorKey).value }"
              >
                {{ idx + 1 }}
              </span>
              <span class="np-card__name" :title="cleanNodeName(node.name)">
                {{ cleanNodeName(node.name) }}
              </span>
              <span class="np-card__owner" :title="node.ownerRole">
                {{ node.ownerRole?.trim() || '无处理人' }}
              </span>
              <span class="np-card__out" title="流出流转数量">
                流出 {{ outEdgesOf(node.id).length }}
              </span>
              <Icon icon="lucide:chevron-right" class="np-card__go size-3.5" />
            </button>

            <!-- 相邻节点间的流转动作 -->
            <div v-if="idx < mainNodes.length - 1" class="np-transition">
              <Icon icon="lucide:arrow-down" class="size-3" />
              <span>{{ mainTransitions[node.id] || '流转' }}</span>
            </div>
          </template>

          <!-- ② 分支与异常节点 -->
          <template v-if="branchNodes.length > 0">
            <div class="np-group-label">
              <span>分支与异常节点</span>
              <span class="np-group-label__count">
                {{ branchNodes.length }}
              </span>
            </div>
            <button
              v-for="node in branchNodes"
              :key="node.id"
              class="np-card"
              :class="{ 'is-active': selectedId === node.id }"
              type="button"
              @click="selectNode(node.id)"
            >
              <span class="np-card__seq np-card__seq--branch">•</span>
              <span class="np-card__name" :title="cleanNodeName(node.name)">
                {{ cleanNodeName(node.name) }}
              </span>
              <span class="np-card__owner" :title="node.ownerRole">
                {{ node.ownerRole?.trim() || '无处理人' }}
              </span>
              <span class="np-card__out" title="流出流转数量">
                流出 {{ outEdgesOf(node.id).length }}
              </span>
              <Icon icon="lucide:chevron-right" class="np-card__go size-3.5" />
            </button>
          </template>

          <!-- ③ 取消节点 -->
          <template v-if="cancelNodes.length > 0">
            <div class="np-group-label">
              <span>取消节点</span>
              <span class="np-group-label__count">
                {{ cancelNodes.length }}
              </span>
            </div>
            <button
              v-for="node in cancelNodes"
              :key="node.id"
              class="np-card np-card--cancel"
              :class="{ 'is-active': selectedId === node.id }"
              type="button"
              @click="selectNode(node.id)"
            >
              <span class="np-card__seq np-card__seq--cancel">×</span>
              <span class="np-card__name" :title="cleanNodeName(node.name)">
                {{ cleanNodeName(node.name) }}
              </span>
              <span class="np-card__owner" :title="node.ownerRole">
                {{ node.ownerRole?.trim() || '无处理人' }}
              </span>
              <span class="np-card__out" title="流出流转数量">
                流出 {{ outEdgesOf(node.id).length }}
              </span>
              <Icon icon="lucide:chevron-right" class="np-card__go size-3.5" />
            </button>
          </template>
        </div>
      </section>

      <!-- 右侧：节点属性 -->
      <aside class="cs-properties">
        <template v-if="selectedNode">
          <!-- ===== 区域 1：状态信息（2 列网格） ===== -->
          <div class="detail-block">
            <div class="detail-block__title">
              <Icon icon="lucide:info" class="size-3.5" />
              <span>状态信息</span>
              <Button type="primary" class="cs-title-btn" @click="saveNode">
                <Icon icon="lucide:save" class="size-3" />
                <span>保存节点</span>
              </Button>
            </div>
            <Form layout="vertical" :model="selectedNode" class="status-form">
              <Form.Item label="状态名称" required>
                <Input
                  v-model:value="selectedNode.name"
                  placeholder="如 处理中 / 待验收"
                />
              </Form.Item>
              <Form.Item label="状态类型">
                <Select
                  v-model:value="selectedNode.type"
                  :options="NODE_TYPE_OPTIONS"
                />
              </Form.Item>
              <Form.Item label="状态编码">
                <Input
                  v-model:value="selectedNode.code"
                  :readonly="!!selectedNode.system"
                  placeholder="如 PROCESSING"
                  :class="selectedNode.system ? 'input-readonly' : ''"
                />
              </Form.Item>
              <Form.Item label="处理人角色">
                <Select
                  :value="selectedNode.ownerRoleType"
                  :options="OWNER_ROLE_OPTIONS"
                  placeholder="选择负责人选取方式"
                  @update:value="onOwnerRoleTypeChange"
                />
              </Form.Item>

              <!-- 处理人角色下拉（按类型显示，跨两列） -->
              <Form.Item
                v-if="selectedNode.ownerRoleType === 'position'"
                label="岗位名称"
                class="span-2"
              >
                <Select
                  v-model:value="ownerPositionId"
                  :options="positionOptions"
                  placeholder="选择岗位"
                  option-filter-prop="label"
                  show-search
                />
              </Form.Item>
              <Form.Item
                v-else-if="selectedNode.ownerRoleType === 'role'"
                label="角色名称"
                class="span-2"
              >
                <Select
                  v-model:value="ownerRoleId"
                  :options="roleOptions"
                  placeholder="选择角色"
                  option-filter-prop="label"
                  show-search
                />
              </Form.Item>
              <Form.Item
                v-else-if="selectedNode.ownerRoleType === 'person'"
                label="用户名称"
                class="span-2"
              >
                <Select
                  v-model:value="ownerStaffId"
                  :options="staffOptions"
                  placeholder="选择用户"
                  option-filter-prop="label"
                  show-search
                />
              </Form.Item>

              <Form.Item label="节点说明" class="span-2">
                <TextArea
                  v-model:value="selectedNode.desc"
                  :rows="3"
                  placeholder="描述该状态的职责与处理要求"
                />
              </Form.Item>
            </Form>
          </div>

          <!-- ===== 区域 2：流出流转 ===== -->
          <div class="detail-block">
            <div class="detail-block__title">
              <Icon icon="lucide:git-branch" class="size-3.5" />
              <span>流出流转</span>
              <Tag>{{ outgoingEdges.length }}</Tag>
              <Button
                size="small"
                type="primary"
                class="cs-title-btn ml-auto"
                @click="openEdgeEditor()"
              >
                <Icon icon="lucide:plus" class="size-3.5" />
                <span>新增流转</span>
              </Button>
            </div>

            <div v-if="outgoingEdges.length > 0" class="edge-list">
              <div
                v-for="edge in outgoingEdges"
                :key="edge.id"
                class="edge-card"
                :class="{ 'edge-card--rollback': edge.rollback }"
              >
                <div class="edge-card__flow">
                  <span class="edge-card__flow-action">{{ edge.action }}</span>
                  <Icon
                    icon="lucide:arrow-right"
                    class="edge-card__flow-arrow size-3.5"
                  />
                  <span class="edge-card__state">
                    {{ nodeMap[edge.to]?.name || edge.to }}
                  </span>
                  <Space :size="4">
                    <Tag v-if="edge.rollback" color="red">回退</Tag>
                    <Tag v-if="edge.async" color="purple">异步</Tag>
                  </Space>
                  <Button
                    size="small"
                    type="link"
                    class="edge-card__edit"
                    @click="openEdgeEditor(edge)"
                  >
                    <Icon icon="lucide:pencil" class="size-3" />
                    <span>编辑</span>
                  </Button>
                </div>
                <div class="edge-card__cond">
                  <Icon icon="lucide:filter" class="size-3" />
                  <span>{{ edge.condition || '无条件' }}</span>
                </div>
              </div>
            </div>
            <Empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="该状态暂无流出流转"
              class="my-4"
            />
          </div>

          <!-- ===== 区域 3：协助子任务 ===== -->
          <div class="detail-block">
            <div class="detail-block__title">
              <Icon icon="lucide:users" class="size-3.5" />
              <span>协助子任务</span>
              <Tag>{{ selectedSubTasks.length }}</Tag>
              <Button
                size="small"
                type="primary"
                class="cs-title-btn ml-auto"
                @click="openSubTaskModal"
              >
                <Icon icon="lucide:plus" class="size-3.5" />
                <span>新增子任务</span>
              </Button>
            </div>

            <div v-if="selectedSubTasks.length > 0" class="subtask-list">
              <div
                v-for="t in selectedSubTasks"
                :key="t.id"
                class="subtask-card"
              >
                <div class="subtask-card__head">
                  <Icon icon="lucide:user-cog" class="size-3.5" />
                  <span>{{ t.name }}</span>
                  <Tag v-if="t.required" color="red" class="ml-auto">必填</Tag>
                </div>
                <div class="subtask-card__desc">{{ t.description }}</div>
                <div class="subtask-card__role">
                  <span>默认岗位：{{ t.defaultRole }}</span>
                  <Button
                    type="link"
                    size="small"
                    class="subtask-card__remove"
                    title="从当前状态移除（模板保留，可挂到其他状态）"
                    @click="removeSubTask(t.id)"
                  >
                    <Icon icon="lucide:x" class="size-3" />
                    <span>移除</span>
                  </Button>
                </div>
              </div>
            </div>
            <Empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="该状态未配置协助子任务"
              class="my-4"
            />
          </div>

          <!-- ===== 区域 4：流入流转 ===== -->
          <div class="detail-block">
            <div class="detail-block__title">
              <Icon icon="lucide:corner-down-right" class="size-3.5" />
              <span>流入流转</span>
              <Tag>{{ incomingEdges.length }}</Tag>
            </div>

            <div v-if="incomingEdges.length > 0" class="edge-list">
              <div
                v-for="edge in incomingEdges"
                :key="edge.id"
                class="edge-card"
                :class="{ 'edge-card--rollback': edge.rollback }"
              >
                <div class="edge-card__flow">
                  <span class="edge-card__state">
                    {{ nodeMap[edge.from]?.name || edge.from }}
                  </span>
                  <Icon
                    icon="lucide:arrow-right"
                    class="edge-card__flow-arrow size-3.5"
                  />
                  <span class="edge-card__flow-action">{{ edge.action }}</span>
                  <Space :size="4">
                    <Tag v-if="edge.rollback" color="red">回退</Tag>
                    <Tag v-if="edge.async" color="purple">异步</Tag>
                  </Space>
                </div>
                <div class="edge-card__cond">
                  <Icon icon="lucide:filter" class="size-3" />
                  <span>{{ edge.condition || '无条件' }}</span>
                </div>
              </div>
            </div>
            <Empty
              v-else
              :image="Empty.PRESENTED_IMAGE_SIMPLE"
              description="该状态暂无流入流转"
              class="my-4"
            />
          </div>
        </template>

        <!-- 未选中节点 -->
        <div v-else class="cs-properties__empty">
          <Icon icon="lucide:circle-dashed" class="size-8 opacity-40" />
          <p>请选择左侧节点查看属性</p>
        </div>
      </aside>
    </div>

    <!-- ============ 流转编辑 Drawer ============ -->
    <TransitionEditDrawer
      v-model:open="edgeDrawerOpen"
      :edge="editingEdge"
      :nodes="sortedNodes"
      @save="saveEdge"
    />

    <!-- ============ 新增协助子任务 Modal ============ -->
    <Modal
      v-model:open="subTaskModalOpen"
      title="新增协助子任务"
      :width="460"
      ok-text="保存并挂载到当前状态"
      cancel-text="取消"
      @ok="saveSubTask"
    >
      <Form layout="vertical" class="pt-2">
        <Form.Item label="子任务名称" required>
          <Input
            v-model:value="subTaskForm.name"
            :maxlength="20"
            placeholder="如 现场协助 / 备件协调"
          />
        </Form.Item>
        <Form.Item label="协作内容说明">
          <TextArea
            v-model:value="subTaskForm.description"
            :rows="2"
            placeholder="描述需要协助人完成的工作"
          />
        </Form.Item>
        <Form.Item label="默认岗位">
          <Select
            v-model:value="subTaskForm.defaultRole"
            :options="positionNameOptions"
            placeholder="选择协助人默认岗位"
            option-filter-prop="label"
            show-search
            allow-clear
          />
        </Form.Item>
        <Form.Item class="mb-0">
          <Checkbox v-model:checked="subTaskForm.required">
            必填：协作完成后主工单才能继续流转
          </Checkbox>
        </Form.Item>
      </Form>
    </Modal>

    <!-- ============ AI 推荐 Drawer ============ -->
    <div v-if="aiOpen" class="ai-drawer-mask" @click.self="aiOpen = false">
      <div class="ai-drawer">
        <div class="ai-drawer__header">
          <div class="ai-drawer__title">
            <Icon icon="lucide:sparkles" class="size-4" />
            <span>AI 推荐状态定义</span>
          </div>
          <button class="ai-drawer__close" @click="aiOpen = false">
            <Icon icon="lucide:x" class="size-4" />
          </button>
        </div>
        <div class="ai-drawer__body">
          <Spin :spinning="aiLoading" tip="加载中…">
            <div v-for="s in aiSuggestions" :key="s.id" class="ai-card">
              <div class="ai-card__head">
                <Tag color="purple">{{ s.suggestion.scenarioType }}</Tag>
                <span class="ai-card__source">{{ s.source }}</span>
              </div>
              <p class="ai-card__reason">{{ s.reason }}</p>
              <div class="ai-card__nodes">
                <div
                  v-for="n in s.suggestion.nodes"
                  :key="n.code"
                  class="ai-node"
                  :style="{
                    background: getColor(n.colorKey).light,
                    color: getColor(n.colorKey).text,
                    borderColor: getColor(n.colorKey).value,
                  }"
                >
                  <span class="ai-node__name">{{ n.name }}</span>
                  <Tag class="ai-node__type">{{ NODE_TYPE_LABEL[n.type] }}</Tag>
                </div>
              </div>
            </div>
            <Empty
              v-if="!aiLoading && aiSuggestions.length === 0"
              description="暂无推荐"
            />
          </Spin>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============ 响应式 ============ */
@media (max-width: 1024px) {
  .cs-body {
    grid-template-columns: 1fr;
  }

  .node-panel {
    max-height: 420px;
  }
}

.custom-status-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 14px;
}

/* 最大化模式：fixed 全屏 */
.custom-status-wrap.is-maximized {
  position: fixed;
  inset: 0;
  z-index: 1000;
  height: 100vh;
  margin: 0;
  border-radius: 0;
}

/* ============ Header ============ */
.cs-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4edea;
}

.cs-header__row {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.cs-header__left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cs-header__right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.cs-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 10px;
}

.cs-title-block {
  display: flex;
  flex-direction: column;
}

.cs-title-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.cs-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.cs-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: #6d827b;
}

.cs-ai-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: #fff;
  background: linear-gradient(90deg, #7f77dd, #9b6fce);
  border: none;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgb(127 119 221 / 30%);
}

.cs-ai-btn:hover,
.cs-ai-btn:focus {
  color: #fff;
  background: linear-gradient(90deg, #8b85e2, #a87dd6);
  box-shadow: 0 3px 10px rgb(127 119 221 / 40%);
}

.cs-max-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #5f5e5a;
  cursor: pointer;
  background: #f4f8f6;
  border: 1px solid #e4edea;
  border-radius: 8px;
  transition: all 0.15s;
}

.cs-max-btn:hover {
  color: #185fa5;
  background: #e6f1fb;
  border-color: #185fa5;
}

/* ============ 主体：左侧节点列表 + 右侧属性 ============ */

/* 左侧节点面板固定宽度，右侧属性面板占满剩余空间 */
.cs-body {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
}

.is-maximized .cs-body {
  max-height: calc(100vh - 150px);
  overflow: auto;
}

/* ============ 左侧：流程节点面板 ============ */
.node-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 260px);
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.is-maximized .node-panel {
  max-height: calc(100vh - 180px);
}

.node-panel__scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow: auto;
}

/* 分组标签 */
.np-group-label {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-top: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #6d827b;
}

.np-group-label:first-child {
  padding-top: 0;
}

.np-group-label__count {
  padding: 0 7px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  color: #5f7a72;
  background: #f1f5f2;
  border-radius: 8px;
}

/* 节点卡片（单行：序号 + 状态名称 + 流出数量） */
.np-card {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 11px;
  transition:
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}

.np-card:hover {
  background: #fff;
  border-color: #b9ddcf;
}

.np-card.is-active {
  background: #f3faf6;
  border-color: #0b6e65;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 8%);
}

.np-card--cancel {
  background: #fafaf8;
  border-color: #e2e1dc;
}

.np-card--cancel.is-active {
  background: #f5f5f2;
  border-color: #5f5e5a;
  box-shadow: 0 0 0 3px rgb(95 94 90 / 8%);
}

/* 编号圆（主流程 idx+1 / 分支 • / 取消 ×） */
.np-card__seq {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 11.5px;
  font-weight: 800;
  color: #fff;
  border-radius: 50%;
}

.np-card__seq--branch {
  font-size: 16px;
  line-height: 1;
  color: #5f7a72;
  background: transparent;
  border: 1.5px dashed #a9c4ba;
}

.np-card__seq--cancel {
  color: #fff;
  background: #888780;
}

/* 状态名称 */
.np-card__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 700;
  color: #102e29;
  white-space: nowrap;
}

/* 处理人角色 */
.np-card__owner {
  flex-shrink: 0;
  max-width: 88px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #6d827b;
  white-space: nowrap;
}

/* 流出数量徽标 */
.np-card__out {
  flex-shrink: 0;
  padding: 1px 8px;
  font-size: 10.5px;
  font-weight: 600;
  color: #5f7a72;
  background: #f1f5f2;
  border-radius: 9px;
}

.np-card--cancel .np-card__out {
  color: #6d6c67;
  background: #f1efe8;
}

/* 选中态右侧箭头 */
.np-card__go {
  flex-shrink: 0;
  color: #0b6e65;
  opacity: 0;
  transition: opacity 0.15s;
}

.np-card.is-active .np-card__go {
  opacity: 1;
}

/* 主流程相邻节点间的流转标签 */
.np-transition {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  padding: 2px 0;
  font-size: 11.5px;
  color: #6d827b;
}

.np-transition svg {
  color: #9db3aa;
}

/* ============ 右侧属性面板 ============ */
.cs-properties {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 260px);
  padding: 16px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.is-maximized .cs-properties {
  max-height: calc(100vh - 180px);
}

.cs-properties__empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  font-size: 13px;
  color: #888780;
}

/* 三个详情块 */
.detail-block {
  padding: 14px 16px;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.detail-block__title {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
  border-bottom: 1px dashed #c8d9d2;
}

.detail-block__title .ant-tag {
  margin: 0;
}

/* 标题行右侧新增按钮：紧凑对齐 */
.cs-title-btn {
  flex-shrink: 0;
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: 6px;
}

.detail-block__title .cs-title-btn {
  margin-left: auto;
}

.detail-block :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.detail-block :deep(.ant-form-item):last-child {
  margin-bottom: 0;
}

/* 状态信息表单：2 列网格布局 */
.status-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

.status-form :deep(.ant-form-item.span-2) {
  grid-column: span 2;
}

/* TextArea / Button 跨满两列后保持单列宽度 */
.status-form :deep(.ant-form-item.span-2 .ant-input) {
  width: 100%;
}

.input-readonly :deep(input) {
  color: #888780;
  background: #f4f8f6;
}

/* ============ 流转卡片 ============ */
.edge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edge-card {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 8px;
}

.edge-card--rollback {
  background: #fff5f5;
  border-color: #fcc;
}

/* 流入/流出流转首行：状态 ⇄ 动作 */
.edge-card__flow {
  display: flex;
  gap: 6px;
  align-items: center;
}

.edge-card__flow-action {
  font-size: 12.5px;
  font-weight: 600;
  color: #2c2c2a;
}

.edge-card__flow-arrow {
  flex-shrink: 0;
  color: #9db3aa;
}

.edge-card__state {
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

.edge-card__edit {
  height: 20px;
  padding: 0 4px;
  margin-left: auto;
  font-size: 11px;
}

.edge-card__cond {
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  font-size: 11px;
  color: #888780;
}

/* ============ 子任务卡片 ============ */
.subtask-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-card {
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 8px;
}

.subtask-card__head {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #2c2c2a;
}

.subtask-card__desc {
  margin-top: 4px;
  font-size: 12px;
  color: #5f5e5a;
}

.subtask-card__role {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: #888780;
}

.subtask-card__remove {
  height: 20px;
  padding: 0;
  font-size: 11px;
  color: #a32d2d;
}

.subtask-card__remove:hover {
  color: #c04040;
}

/* ============ AI Drawer ============ */
.ai-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgb(0 0 0 / 35%);
}

.ai-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 720px;
  max-width: 92vw;
  background: #fff;
  box-shadow: -4px 0 16px rgb(0 0 0 / 10%);
}

.ai-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e4edea;
}

.ai-drawer__title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  color: #0c4a3f;
}

.ai-drawer__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #5f5e5a;
  cursor: pointer;
  background: #f4f8f6;
  border: none;
  border-radius: 8px;
}

.ai-drawer__close:hover {
  color: #a32d2d;
  background: #fcebeb;
}

.ai-drawer__body {
  max-height: calc(100vh - 60px);
  padding: 16px 20px;
  overflow: auto;
}

.ai-card {
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 10px;
  transition: all 0.2s;
}

.ai-card:hover {
  background: #f4f8f6;
  border-color: #c8d9d2;
  box-shadow: 0 2px 8px rgb(11 110 101 / 8%);
}

.ai-card__head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.ai-card__source {
  font-size: 11px;
  color: #888780;
}

.ai-card__reason {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #5f5e5a;
}

.ai-card__nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* AI 状态标签：胶囊风格，带左侧色点 */
.ai-node {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px 6px 10px;
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid;
  border-radius: 999px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 4%);
  transition:
    transform 0.18s,
    box-shadow 0.18s;
}

.ai-node::before {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  content: '';
  background: currentcolor;
  border-radius: 50%;
  opacity: 0.7;
}

.ai-node:hover {
  box-shadow: 0 3px 8px rgb(0 0 0 / 8%);
  transform: translateY(-1px);
}

.ai-node__name {
  font-weight: 600;
  letter-spacing: 0.2px;
}

.ai-node__type {
  padding: 0 6px;
  margin: 0;
  font-size: 10px;
  line-height: 14px;
  background: rgb(255 255 255 / 60%);
  border: 1px solid currentcolor;
  border-radius: 4px;
  opacity: 0.78;
}

/* 主按钮使用项目主色 */
:deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

:deep(.ant-btn-primary:hover) {
  background: #0c8077;
  border-color: #0c8077;
}
</style>
