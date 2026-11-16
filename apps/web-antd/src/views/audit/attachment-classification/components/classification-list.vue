<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type {
  AttachmentClassification,
  AttachmentGroup,
  DocumentMode,
  ExtractionMode,
} from '#/types/attachment-classification';

import { computed, onMounted, ref } from 'vue';
// import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Input,
  List,
  message,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  deleteClassificationApi,
  exportClassificationsApi,
  getAttachmentGroupsApi,
  getClassificationsApi,
  updateClassificationApi,
} from '#/api/attachment-classification';

import ExtractionRulesDrawer from '../drawers/extraction-rules-drawer.vue';
import GroupDrawer from '../group/group-drawer.vue';
import ClassificationFormDrawer from '../modals/classification-form-drawer.vue';
import QuickTestModal from '../modals/quick-test-modal.vue';

// const router = useRouter();

const loading = ref(false);
const classifications = ref<AttachmentClassification[]>([]);
const groups = ref<AttachmentGroup[]>([]);
const drawerOpen = ref(false);
const groupDrawerOpen = ref(false);
const rulesDrawerOpen = ref(false);
const quickTestModalOpen = ref(false);
const editingClassification = ref<AttachmentClassification | null>(null);
const editingGroup = ref<AttachmentGroup | null>(null);

// 过滤状态
const searchText = ref('');
const selectedGroupId = ref<string>('');

// 计算属性：过滤后的分类列表
const filteredClassifications = computed(() => {
  return classifications.value.filter((item) => {
    // 关键字过滤
    const matchKeyword =
      !searchText.value ||
      item.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.value.toLowerCase());

    // 组过滤
    const matchGroup =
      !selectedGroupId.value || item.groupIds?.includes(selectedGroupId.value);

    return matchKeyword && matchGroup;
  });
});

// 获取分类列表
async function fetchClassifications() {
  loading.value = true;
  try {
    const [classRes, groupRes] = await Promise.all([
      getClassificationsApi(),
      getAttachmentGroupsApi(),
    ]);
    classifications.value = classRes.data || [];
    groups.value = groupRes.data || [];
    // 默认选中第一个组(如果有)
    if (groups.value.length > 0 && !selectedGroupId.value) {
      // selectedGroupId.value = groups.value[0].id;
    }
  } catch (error) {
    message.error('获取附件分类列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 获取组名称
// function getGroupName(groupId?: string) {
//   if (!groupId) return '-';
//   const group = groups.value.find((g) => g.id === groupId);
//   return group ? group.name : '-';
// }

// 新增附件组
function handleAddGroup() {
  editingGroup.value = null;
  groupDrawerOpen.value = true;
}

// 编辑附件组
function handleEditGroup(e: Event, group: AttachmentGroup) {
  e.stopPropagation(); // 防止触发选择
  editingGroup.value = group;
  groupDrawerOpen.value = true;
}

// 附件组保存成功
async function handleGroupSaveSuccess() {
  groupDrawerOpen.value = false;
  await fetchClassifications();
}

// 新增分类
function handleAdd() {
  editingClassification.value = null;
  drawerOpen.value = true;
}

// 编辑分类
function handleEdit(classification: AttachmentClassification) {
  editingClassification.value = classification;
  drawerOpen.value = true;
}

// 删除分类
async function handleDelete(id: string) {
  try {
    await deleteClassificationApi(id);
    message.success('删除成功');
    await fetchClassifications();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 切换启用状态
async function handleToggleEnabled(record: AttachmentClassification) {
  try {
    await updateClassificationApi(record.id, {
      enabled: !record.enabled,
    });
    message.success(record.enabled ? '已禁用' : '已启用');
    await fetchClassifications();
  } catch (error) {
    message.error('操作失败');
    console.error(error);
  }
}

// 配置取数规则
function handleConfigureRules(record: AttachmentClassification) {
  editingClassification.value = record;
  rulesDrawerOpen.value = true;
}

// 快速测试
function handleQuickTest(record: AttachmentClassification) {
  editingClassification.value = record;
  quickTestModalOpen.value = true;
}

// 导入配置
function handleImport() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,.xlsx';
  input.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      message.info('导入功能开发中');
      // TODO: 实现JSON/Excel解析和导入
    }
  });
  input.click();
}

// 导出配置
async function handleExport() {
  try {
    const response = await exportClassificationsApi();
    const data = response.data;

    // 转换为JSON并下载
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `附件分类配置_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();

    message.success('导出成功');
  } catch (error) {
    message.error('导出失败');
    console.error(error);
  }
}

// // 进入测试沙箱
// function handleEnterSandbox() {
//   router.push('/attachment/sandbox');
// }

// 保存成功回调
async function handleSaveSuccess() {
  drawerOpen.value = false;
  await fetchClassifications();
}

// 取数模式映射
const extractionModeMap: Record<
  ExtractionMode,
  { color: string; text: string }
> = {
  OCR: { text: 'OCR + LLM', color: 'blue' },
  VISION: { text: 'Vision', color: 'purple' },
};

// 文档模式映射
const documentModeMap: Record<DocumentMode, { color: string; text: string }> = {
  page: { text: '单页', color: 'blue' },
  document: { text: '文档', color: 'green' },
};

// 表格列定义
const columns: TableColumnsType<AttachmentClassification> = [
  {
    title: '#',
    key: 'index',
    width: 60,
    align: 'center',
    customRender: ({ index }) => index + 1,
  },
  {
    title: '分类名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '分类编码',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '分类提示词',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '取数模式',
    key: 'documentMode',
    width: 100,
    align: 'center',
  },
  {
    title: '取数策略',
    key: 'extractionMode',
    width: 120,
  },
  {
    title: '提取字段数',
    key: 'fieldCount',
    width: 120,
    align: 'center',
  },
  {
    title: '启用状态',
    key: 'enabled',
    width: 100,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    width: 250,
    fixed: 'right',
    align: 'center',
  },
];

onMounted(() => {
  fetchClassifications();
});
</script>

<template>
  <div class="flex h-full gap-4">
    <!-- 左侧：附件组与搜索 -->
    <div class="flex h-full w-64 flex-shrink-0 flex-col border-r pr-4">
      <!-- 搜索框 -->
      <div class="mb-4 flex-shrink-0">
        <Input
          v-model:value="searchText"
          placeholder="搜索附件分类"
          allow-clear
        >
          <template #prefix>
            <Icon icon="lucide:search" class="size-4 text-muted-foreground" />
          </template>
        </Input>
      </div>

      <!-- 附件组列表 -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="mb-2 flex items-center justify-between px-2">
          <h3 class="text-xs font-medium uppercase text-muted-foreground">
            附件组
          </h3>
          <Button
            size="small"
            type="text"
            class="-mr-2 text-muted-foreground hover:text-primary"
            @click="handleAddGroup"
          >
            <Icon icon="lucide:plus" class="size-4" />
          </Button>
        </div>
        <List size="small" :data-source="[{ id: '', name: '全部' }, ...groups]">
          <template #renderItem="{ item }">
            <List.Item
              class="group/item cursor-pointer rounded-md px-2 hover:bg-accent hover:text-accent-foreground"
              :class="{
                'bg-accent text-accent-foreground': selectedGroupId === item.id,
              }"
              @click="selectedGroupId = item.id"
            >
              <div class="flex w-full items-center gap-2">
                <!-- Gear Icon for Edit -->
                <div
                  v-if="item.id !== ''"
                  class="flex h-6 w-6 items-center justify-center rounded-sm hover:bg-background/50"
                  @click="(e) => handleEditGroup(e, item as AttachmentGroup)"
                >
                  <Icon
                    icon="lucide:settings"
                    class="size-3.5 text-muted-foreground transition-opacity hover:text-primary"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <span class="truncate font-medium">{{ item.name }}</span>
                    <span class="ml-2 text-xs text-muted-foreground">
                      {{
                        item.id === ''
                          ? classifications.length
                          : classifications.filter((c) =>
                              c.groupIds?.includes(item.id),
                            ).length
                      }}
                    </span>
                  </div>
                  <!-- Group Code -->
                  <div
                    v-if="item.id !== ''"
                    class="truncate text-xs text-muted-foreground/70"
                  >
                    {{ (item as AttachmentGroup).code }}
                  </div>
                </div>
              </div>
            </List.Item>
          </template>
        </List>
      </div>
    </div>

    <!-- 右侧：分类列表 -->
    <div class="flex h-full flex-1 flex-col overflow-hidden">
      <!-- 头部 -->
      <div class="mb-4 flex flex-shrink-0 items-center justify-between">
        <div>
          <h2 class="text-2xl font-semibold">附件分类</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            配置不同类型文件的识别规则和字段提取方案
          </p>
        </div>
        <Space>
          <Button @click="handleImport">
            <Icon icon="lucide:upload" class="mr-1 size-4" />
            导入
          </Button>
          <Button @click="handleExport">
            <Icon icon="lucide:download" class="mr-1 size-4" />
            导出
          </Button>
          <Button type="primary" @click="handleAdd">
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            新增分类
          </Button>
        </Space>
      </div>

      <!-- 表格 -->
      <div class="table-wrapper-full min-h-0 flex-1">
        <Table
          :columns="columns"
          :data-source="filteredClassifications"
          :loading="loading"
          :pagination="{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }"
          row-key="id"
          :scroll="{ x: 1400, y: '100%' }"
          bordered
          class="h-full"
        >
          <!-- 字段数列 -->
          <template #bodyCell="{ column, record }">
            <!-- 取数模式列 -->
            <template v-if="column.key === 'documentMode'">
              <Tag :color="documentModeMap[record.documentMode].color">
                {{ documentModeMap[record.documentMode].text }}
              </Tag>
            </template>

            <!-- 取数策略列 -->
            <template v-else-if="column.key === 'extractionMode'">
              <Tag :color="extractionModeMap[record.extractionMode].color">
                {{
                  extractionModeMap[record.extractionMode as ExtractionMode]
                    .text
                }}
              </Tag>
            </template>

            <template v-else-if="column.key === 'fieldCount'">
              <Tag
                color="cyan"
                class="cursor-pointer hover:opacity-80"
                @click="
                  handleConfigureRules(record as AttachmentClassification)
                "
              >
                {{ record.fieldRules.length }}
              </Tag>
            </template>

            <!-- 启用状态列 -->
            <template v-else-if="column.key === 'enabled'">
              <Switch
                :checked="record.enabled"
                @change="
                  () => handleToggleEnabled(record as AttachmentClassification)
                "
              />
            </template>

            <!-- 操作列 -->
            <template v-else-if="column.key === 'action'">
              <Space size="small">
                <Tooltip title="快速测试">
                  <Button
                    type="text"
                    size="small"
                    @click="handleQuickTest(record)"
                  >
                    <Icon
                      icon="lucide:play-circle"
                      class="size-4 text-blue-500"
                    />
                  </Button>
                </Tooltip>
                <Tooltip title="取数规则">
                  <Button
                    type="text"
                    size="small"
                    @click="handleConfigureRules(record)"
                  >
                    <Icon icon="lucide:settings" class="size-4" />
                  </Button>
                </Tooltip>
                <Tooltip title="编辑">
                  <Button type="text" size="small" @click="handleEdit(record)">
                    <Icon icon="lucide:edit" class="size-4 text-orange-500" />
                  </Button>
                </Tooltip>
                <Popconfirm
                  title="确定要删除此分类吗?"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record.id)"
                >
                  <Tooltip title="删除">
                    <Button type="text" size="small" danger>
                      <Icon icon="lucide:trash-2" class="size-4" />
                    </Button>
                  </Tooltip>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 分类表单抽屉 -->
    <ClassificationFormDrawer
      v-model:open="drawerOpen"
      :classification="editingClassification"
      @success="handleSaveSuccess"
    />

    <!-- 取数规则抽屉 -->
    <ExtractionRulesDrawer
      v-model:open="rulesDrawerOpen"
      :classification="editingClassification"
      @success="fetchClassifications"
    />

    <!-- 快速测试弹窗 -->
    <QuickTestModal
      v-model:open="quickTestModalOpen"
      :classification="editingClassification"
    />

    <!-- 附件组表单抽屉 -->
    <GroupDrawer
      v-model:open="groupDrawerOpen"
      :group="editingGroup"
      @success="handleGroupSaveSuccess"
    />
  </div>
</template>

<style scoped>
:deep(.table-wrapper-full .ant-table-wrapper),
:deep(.table-wrapper-full .ant-spin-nested-loading),
:deep(.table-wrapper-full .ant-spin-container),
:deep(.table-wrapper-full .ant-table-container),
:deep(.table-wrapper-full .ant-table) {
  height: 100%;
}

:deep(.table-wrapper-full .ant-spin-container) {
  display: flex;
  flex-direction: column;
}

:deep(.table-wrapper-full .ant-table) {
  flex: 1;
  overflow: hidden;
}

:deep(.table-wrapper-full .ant-table-container) {
  display: flex;
  flex-direction: column;
}

:deep(.table-wrapper-full .ant-table-body) {
  flex: 1;
  max-height: none !important;
  overflow-y: auto !important;
}

:deep(.table-wrapper-full .ant-pagination) {
  flex-shrink: 0;
  padding: 16px 0;
  margin-top: auto !important;
}
</style>
