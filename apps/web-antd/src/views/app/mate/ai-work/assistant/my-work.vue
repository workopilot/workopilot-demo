<!-- 我的工作：色彩与视觉重构版本（收拢多余色彩，遵循“主色聚焦操作，中性色承载信息，状态色限定语义”） -->
<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import type { EntityPick } from '../components/entity-context-drawer.vue';

import type {
  AiWorkEntities,
  AiWorkMaterial,
  AiWorkWorkItem,
} from '#/types/ai-work';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Tag,
  Upload,
} from 'ant-design-vue';

import { aiWorkWorkItems } from '#/api/mock-data-ai-work';

import EntityContextDrawer from '../components/entity-context-drawer.vue';
import EntityTags from '../components/entity-tags.vue';
import MaterialList from '../components/material-list.vue';
import WorkItemDetailDrawer from '../components/work-item-detail-drawer.vue';

// 检索与筛选状态
const keyword = ref('');
const datePreset = ref<
  'all' | 'custom' | 'last-week' | 'this-month' | 'this-week'
>('all');
const customDateRange = ref<any>(null);

const statusFilter = ref('all');
const completionFilter = ref<'all' | 'done' | 'undone'>('all');
const inReportFilter = ref<'all' | 'in' | 'out'>('all');

// 侧滑与弹窗状态
const uploadOpen = ref(false);
const itemDetailOpen = ref(false);
const selectedWorkItem = ref<AiWorkWorkItem | null>(null);

const entityOpen = ref(false);
const pickedEntity = ref<EntityPick | null>(null);
const items = ref<AiWorkWorkItem[]>([...aiWorkWorkItems]);

// 规范统一的状态语义颜色映射 (未开始 | 进行中 | 已完成 | 已取消 | 暂停)
function getStatusTagStyle(status: string) {
  switch (status) {
    case '已取消': {
      return { bg: '#FFF0F0', color: '#D9363E', border: '#FFA39E' };
    }
    case '已完成': {
      return { bg: '#E8FFEA', color: '#165D25', border: '#B7EB8F' };
    }
    case '暂停': {
      return { bg: '#FFF7E6', color: '#D46B08', border: '#FFD591' };
    }
    case '未开始': {
      return { bg: '#F2F3F5', color: '#4E5969', border: '#E5E7EB' };
    }
    case '进行中': {
      return { bg: '#E8F3FF', color: '#1665D8', border: '#91CAFF' };
    }
    default: {
      return { bg: '#F2F3F5', color: '#4E5969', border: '#E5E7EB' };
    }
  }
}

// 打开事项详情侧滑 Drawer
function openWorkItemDetail(item: AiWorkWorkItem) {
  selectedWorkItem.value = item;
  itemDetailOpen.value = true;
}

// 侧滑抽屉更新事项
function onUpdateItem(updatedItem: AiWorkWorkItem) {
  const index = items.value.findIndex((i) => i.id === updatedItem.id);
  if (index !== -1) {
    items.value[index] = updatedItem;
    selectedWorkItem.value = updatedItem;
  }
}

function onEntityPick(payload: { name: string; type: keyof AiWorkEntities }) {
  pickedEntity.value = payload;
  entityOpen.value = true;
}

// 检查事项是否有关联实体
function hasEntities(entities?: AiWorkEntities): boolean {
  if (!entities) return false;
  return Boolean(
    (entities.projects && entities.projects.length > 0) ||
    (entities.customers && entities.customers.length > 0) ||
    (entities.products && entities.products.length > 0) ||
    (entities.people && entities.people.length > 0),
  );
}

const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '未开始', value: '未开始' },
  { label: '进行中', value: '进行中' },
  { label: '已完成', value: '已完成' },
  { label: '已取消', value: '已取消' },
  { label: '暂停', value: '暂停' },
];

// 重置筛选
function resetFilters() {
  keyword.value = '';
  datePreset.value = 'all';
  customDateRange.value = null;
  statusFilter.value = 'all';
  completionFilter.value = 'all';
  inReportFilter.value = 'all';
  message.info('筛选条件已重置');
}

// 核心过滤计算
const filteredItems = computed(() => {
  return items.value.filter((item) => {
    // 1. 关键字搜索
    if (keyword.value.trim()) {
      const kw = keyword.value.trim().toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(kw);
      const matchSummary = item.summary.toLowerCase().includes(kw);
      const matchType = item.type.toLowerCase().includes(kw);
      const matchSource = item.source?.toLowerCase().includes(kw) ?? false;
      const matchProject = item.entities.projects?.some((p) =>
        p.toLowerCase().includes(kw),
      );
      const matchCustomer = item.entities.customers?.some((c) =>
        c.toLowerCase().includes(kw),
      );

      if (
        !matchTitle &&
        !matchSummary &&
        !matchType &&
        !matchSource &&
        !matchProject &&
        !matchCustomer
      ) {
        return false;
      }
    }

    // 2. 日期范围
    switch (datePreset.value) {
      case 'last-week': {
        if (
          !item.date.startsWith('07/') &&
          item.date !== '08/01' &&
          item.date !== '08/02'
        ) {
          return false;
        }

        break;
      }
      case 'this-month': {
        if (!item.date.startsWith('08/')) return false;

        break;
      }
      case 'this-week': {
        if (item.date.startsWith('07/')) return false;

        break;
      }
      // No default
    }

    // 3. 事项状态
    if (statusFilter.value !== 'all' && item.status !== statusFilter.value) {
      return false;
    }

    // 4. 是否完成
    if (completionFilter.value === 'done' && item.status !== '已完成')
      return false;
    if (completionFilter.value === 'undone' && item.status === '已完成')
      return false;

    // 5. 是否纳入周报
    if (inReportFilter.value === 'in' && !item.inReport) return false;
    if (inReportFilter.value === 'out' && item.inReport) return false;

    return true;
  });
});

// 切换纳入周报
function toggleReport(item: AiWorkWorkItem) {
  item.inReport = !item.inReport;
  message.success(item.inReport ? '已加入本周周报' : '已从周报移除');
}

// ---------------- 新增 / 采集工作内容弹窗 ----------------
const ingestMode = ref<'describe' | 'file'>('describe');
const ingestText = ref('');
const ingestTitle = ref('');
const ingestDate = ref('08/07');
const ingestProject = ref('AI Work');
const ingestCustomer = ref('');
const ingestProduct = ref('');
const ingestPerson = ref('张三');
const attachedFiles = ref<Array<{ name: string; size: string; type: string }>>(
  [],
);

// 根据资料类型解析时长（用于重构嵌套三元表达式）
function resolveMaterialDuration(type: string): string | undefined {
  if (type === 'audio') return '06:30';
  if (type === 'video') return '02:45';
  return undefined;
}

// 根据附件类型推断工作事项类型（用于重构嵌套三元表达式）
function resolveWorkItemType(
  files: Array<{ type: string }>,
): 'PDF纪要' | '工作采集' | '录屏视频' | '语音录音' {
  if (files.some((f) => f.type === 'video')) return '录屏视频';
  if (files.some((f) => f.type === 'audio')) return '语音录音';
  if (files.some((f) => f.type === 'meeting')) return 'PDF纪要';
  return '工作采集';
}

const uploadProps: UploadProps = {
  beforeUpload: (file) => {
    let fileType: any = 'document';
    if (file.name.endsWith('.pdf')) {
      fileType = 'meeting';
    } else if (file.name.endsWith('.m4a') || file.name.endsWith('.mp3')) {
      fileType = 'audio';
    } else if (file.name.endsWith('.mp4') || file.name.endsWith('.mov')) {
      fileType = 'video';
    } else if (/\.(?:png|jpg|jpeg)$/i.test(file.name)) {
      fileType = 'image';
    }

    attachedFiles.value.push({
      name: file.name,
      type: fileType,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
    });
    message.success(`已加载资料文件：${file.name}`);
    return false;
  },
  showUploadList: false,
};

function submitIngest() {
  if (
    !ingestText.value.trim() &&
    attachedFiles.value.length === 0 &&
    !ingestTitle.value.trim()
  ) {
    message.warning('请填写工作描述或上传会议纪要/录音/视频资料');
    return;
  }

  const generatedTitle =
    ingestTitle.value.trim() ||
    (ingestText.value
      ? ingestText.value.slice(0, 18) +
        (ingestText.value.length > 18 ? '…' : '')
      : attachedFiles.value[0]?.name || '新采集工作事项');

  const generatedMaterials: AiWorkMaterial[] = attachedFiles.value.map(
    (f, idx) => ({
      id: `mat-upload-${Date.now()}-${idx}`,
      type: f.type as any,
      name: f.name,
      uploadedAt: new Date().toLocaleString(),
      size: f.size,
      duration: resolveMaterialDuration(f.type),
    }),
  );

  const newItem: AiWorkWorkItem = {
    id: `item-manual-${Date.now()}`,
    date: ingestDate.value || '08/07',
    weekday: '周五',
    title: generatedTitle,
    summary:
      ingestText.value ||
      `基于已上传资料【${attachedFiles.value.map((f) => f.name).join('、')}】自动抽取生成的工作事项摘要。`,
    type: resolveWorkItemType(attachedFiles.value),
    status: '进行中',
    source: attachedFiles.value.length > 0 ? '资料解析' : '手动描述',
    materials: generatedMaterials,
    entities: {
      projects: ingestProject.value ? [ingestProject.value] : [],
      customers: ingestCustomer.value ? [ingestCustomer.value] : [],
      products: ingestProduct.value ? [ingestProduct.value] : [],
      people: ingestPerson.value ? [ingestPerson.value] : [],
    },
    inReport: true,
  };

  items.value.unshift(newItem);
  message.success('已成功新增工作事项！已自动纳入本周周报');

  // 清空重置
  ingestText.value = '';
  ingestTitle.value = '';
  attachedFiles.value = [];
  uploadOpen.value = false;
}
</script>

<template>
  <div class="my-work-container min-h-screen w-full bg-[#F7F8FA] p-4">
    <div class="my-work-grid w-full">
      <!-- ================= 左侧：查询条件面板 ================= -->
      <aside
        class="filter-panel shadow-xs rounded-xl border border-[#E8E8E8] bg-white p-4"
      >
        <h2
          class="mb-3 flex items-center justify-between border-b border-[#F2F3F5] pb-2 text-sm font-bold text-[#1D2129]"
        >
          <span class="flex items-center gap-1.5">
            <Icon
              icon="lucide:sliders-horizontal"
              class="size-4 text-[#0D6853]"
            />
            查询条件
          </span>
          <Button
            type="link"
            size="small"
            class="p-0 text-xs text-[#86909C] hover:text-[#0D6853]"
            @click="resetFilters"
          >
            重置
          </Button>
        </h2>

        <!-- 1. 最上面是关键字 -->
        <div class="filter-group mb-4">
          <label
            class="filter-label mb-1.5 block text-xs font-medium text-[#4E5969]"
          >
            关键字
          </label>
          <Input
            v-model:value="keyword"
            placeholder="搜索标题、描述或实体..."
            allow-clear
            size="small"
          />
        </div>

        <!-- 2. 日期范围 -->
        <div class="filter-group mb-4">
          <label
            class="filter-label mb-1.5 block text-xs font-medium text-[#4E5969]"
          >
            日期
          </label>
          <Radio.Group
            v-model:value="datePreset"
            button-style="solid"
            size="small"
            class="filter-radio-grid mb-2 flex w-full flex-wrap gap-1"
          >
            <Radio.Button value="all">全部</Radio.Button>
            <Radio.Button value="this-week">本周</Radio.Button>
            <Radio.Button value="last-week">上周</Radio.Button>
            <Radio.Button value="this-month">本月</Radio.Button>
            <Radio.Button value="custom">自定义</Radio.Button>
          </Radio.Group>
          <DatePicker.RangePicker
            v-if="datePreset === 'custom'"
            v-model:value="customDateRange"
            size="small"
            class="w-full"
            placeholder="['开始日期', '结束日期']"
          />
        </div>

        <!-- 3. 事项状态 -->
        <div class="filter-group mb-4">
          <label
            class="filter-label mb-1.5 block text-xs font-medium text-[#4E5969]"
          >
            状态
          </label>
          <Select
            v-model:value="statusFilter"
            :options="statusOptions"
            size="small"
            class="w-full"
          />
        </div>

        <!-- 4. 是否完成 -->
        <div class="filter-group mb-4">
          <label
            class="filter-label mb-1.5 block text-xs font-medium text-[#4E5969]"
          >
            是否完成
          </label>
          <Radio.Group
            v-model:value="completionFilter"
            button-style="solid"
            size="small"
            class="filter-radio-group flex w-full"
          >
            <Radio.Button value="all" class="flex-1 text-center">
              全部
            </Radio.Button>
            <Radio.Button value="done" class="flex-1 text-center">
              已完成
            </Radio.Button>
            <Radio.Button value="undone" class="flex-1 text-center">
              未完成
            </Radio.Button>
          </Radio.Group>
        </div>

        <!-- 5. 是否纳入周报 -->
        <div class="filter-group mb-4">
          <label
            class="filter-label mb-1.5 block text-xs font-medium text-[#4E5969]"
          >
            是否纳入周报
          </label>
          <Radio.Group
            v-model:value="inReportFilter"
            button-style="solid"
            size="small"
            class="filter-radio-group flex w-full"
          >
            <Radio.Button value="all" class="flex-1 text-center">
              全部
            </Radio.Button>
            <Radio.Button value="in" class="flex-1 text-center">
              已纳入
            </Radio.Button>
            <Radio.Button value="out" class="flex-1 text-center">
              未纳入
            </Radio.Button>
          </Radio.Group>
        </div>

        <Button
          size="small"
          block
          class="mt-2 text-xs text-[#4E5969]"
          @click="resetFilters"
        >
          重置所有条件
        </Button>
      </aside>

      <!-- ================= 右侧：工作事项区域 ================= -->
      <main class="content-panel">
        <!-- 顶栏：我的工作标题与新增工作按钮 -->
        <div
          class="header-bar shadow-xs mb-3 flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-white p-4"
        >
          <div>
            <h1
              class="flex items-center gap-2 text-lg font-bold text-[#1D2129]"
            >
              <Icon icon="lucide:briefcase" class="size-5 text-[#0D6853]" />
              我的工作
            </h1>
            <p class="mt-0.5 text-xs text-[#86909C]">
              共查出
              <b class="text-[#1D2129]">{{ filteredItems.length }}</b>
              条符合条件的工作事项
            </p>
          </div>

          <Button
            type="primary"
            class="primary-brand-btn shadow-sm"
            @click="uploadOpen = true"
          >
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            新增工作
          </Button>
        </div>

        <!-- 工作事项列表 -->
        <div class="compact-work-list space-y-2.5">
          <article
            v-for="item in filteredItems"
            :key="item.id"
            class="compact-card cursor-pointer"
            :class="{
              'compact-card--delayed': item.status === '延期',
              'compact-card--commitment':
                item.isCommitment && item.status !== '延期',
            }"
            @click="openWorkItemDetail(item)"
          >
            <!-- 第一行：日期、标题、标签系统（降噪版）、按钮 -->
            <div class="card-header-row">
              <div class="date-tag">
                <Icon icon="lucide:calendar" class="size-3 text-[#86909C]" />
                <span>{{ item.date }} {{ item.weekday }}</span>
              </div>

              <h3 class="card-title" :title="item.title">{{ item.title }}</h3>

              <div class="card-tags-area">
                <!-- 跨周承诺标志 (仅在为承诺事项时展示) -->
                <span
                  v-if="item.isCommitment"
                  class="commitment-badge"
                  title="上周承诺事项·本周追踪中"
                >
                  <Icon icon="lucide:flag" class="size-3 flex-none" />
                  <span>
                    上周承诺{{
                      item.delayWeeks ? ` (延期${item.delayWeeks}周)` : ''
                    }}
                  </span>
                </span>

                <!-- 系统状态标签 (未开始 | 进行中 | 已完成 | 暂停 | 已取消) -->
                <span
                  class="status-semantic-tag"
                  :style="{
                    backgroundColor: getStatusTagStyle(item.status).bg,
                    color: getStatusTagStyle(item.status).color,
                    borderColor: getStatusTagStyle(item.status).border,
                  }"
                >
                  {{ item.status }}
                </span>
              </div>

              <!-- 二级按钮：幽灵文字样式，不拉走视角焦点 -->
              <Button
                size="small"
                type="link"
                class="timeline-btn"
                @click.stop="openWorkItemDetail(item)"
              >
                <Icon icon="lucide:panel-right" class="mr-1 size-3.5" />
                详情/补充进展
              </Button>

              <!-- 周报主操作按钮：仅使用品牌主色 -->
              <div class="card-action">
                <Button
                  size="small"
                  :type="item.inReport ? 'default' : 'primary'"
                  :class="
                    item.inReport ? 'btn-remove-report' : 'primary-brand-btn'
                  "
                  @click.stop="toggleReport(item)"
                >
                  <Icon
                    :icon="item.inReport ? 'lucide:check' : 'lucide:plus'"
                    class="mr-0.5 size-3.5"
                  />
                  <span>{{ item.inReport ? '已入周报' : '加入周报' }}</span>
                </Button>
              </div>
            </div>

            <!-- 第二行：简短工作描述 -->
            <p class="card-summary-row" :title="item.summary">
              {{ item.summary }}
            </p>

            <!-- 第三行：关联资料与关联实体 (明确标题与位置，关联实体统一强制靠右放置) -->
            <div
              v-if="
                (item.materials && item.materials.length > 0) ||
                hasEntities(item.entities)
              "
              class="card-footer-row"
            >
              <!-- 左侧：关联资料 -->
              <div class="footer-materials">
                <template v-if="item.materials && item.materials.length > 0">
                  <span class="footer-section-label">
                    <Icon
                      icon="lucide:paperclip"
                      class="size-3 text-[#86909C]"
                    />
                    关联资料:
                  </span>
                  <MaterialList
                    :materials="item.materials"
                    :show-label="false"
                  />
                </template>
              </div>

              <!-- 右侧：关联实体 (强制 ml-auto 靠最右侧对齐) -->
              <div
                v-if="hasEntities(item.entities)"
                class="footer-entities ml-auto"
                @click.stop
              >
                <span class="footer-section-label">
                  <Icon icon="lucide:boxes" class="size-3 text-[#86909C]" />
                  关联实体:
                </span>
                <EntityTags
                  :entities="item.entities"
                  :show-group-title="false"
                  :clickable="true"
                  @pick="onEntityPick"
                />
              </div>
            </div>
          </article>

          <div v-if="filteredItems.length === 0" class="work-empty-box">
            <Icon icon="lucide:inbox" class="size-10 text-[#86909C]" />
            <p class="mt-2 text-sm text-[#4E5969]">
              没有符合筛选条件的工作事项
            </p>
            <Button size="small" class="mt-1" @click="resetFilters">
              重置查询条件
            </Button>
          </div>
        </div>
      </main>
    </div>

    <!-- 侧滑事项详情 & 补充进展 Drawer -->
    <WorkItemDetailDrawer
      v-model:open="itemDetailOpen"
      :item="selectedWorkItem"
      @pick-entity="onEntityPick"
      @update-item="onUpdateItem"
    />

    <!-- 新增工作弹窗 -->
    <Modal
      v-model:open="uploadOpen"
      title="新增工作事项"
      width="640px"
      ok-text="保存事项"
      cancel-text="取消"
      @ok="submitIngest"
    >
      <div class="ingest-modal-body">
        <div class="ingest-tip">
          <Icon
            icon="lucide:sparkles"
            class="size-4 flex-none text-[#0D6853]"
          />
          <span>
            支持输入
            <b>文本描述</b>
            或上传
            <b>会议纪要 PDF</b>
            、
            <b>语音录音</b>
            、
            <b>录屏视频</b>
            等提取生成。
          </span>
        </div>

        <Radio.Group
          v-model:value="ingestMode"
          button-style="solid"
          class="filter-radio-group mb-3 w-full"
        >
          <Radio.Button value="describe" class="w-1/2 text-center">
            <Icon icon="lucide:pencil-line" class="mr-1 inline size-3.5" />
            文本描述
          </Radio.Button>
          <Radio.Button value="file" class="w-1/2 text-center">
            <Icon icon="lucide:file-up" class="mr-1 inline size-3.5" />
            上传会议纪要 PDF / 录音 / 视频
          </Radio.Button>
        </Radio.Group>

        <Upload v-bind="uploadProps" class="mb-3 w-full">
          <div class="drop-zone">
            <div class="flex items-center justify-center gap-3 text-[#0D6853]">
              <Icon
                icon="lucide:file-text"
                class="size-6"
                title="PDF会议纪要"
              />
              <Icon icon="lucide:mic" class="size-6" title="语音录音" />
              <Icon icon="lucide:video" class="size-6" title="录屏视频" />
              <Icon icon="lucide:image" class="size-6" title="截图照片" />
            </div>
            <span class="mt-2 text-sm font-medium text-[#1D2129]">
              点击或拖拽上传资料 (PDF / .m4a / .mp3 / .mp4 / 图片)
            </span>
          </div>
        </Upload>

        <div v-if="attachedFiles.length > 0" class="attached-list mb-3">
          <span class="mb-1 block text-xs text-[#86909C]">
            已选文件 ({{ attachedFiles.length }}):
          </span>
          <div class="flex flex-wrap gap-2">
            <Tag
              v-for="(f, i) in attachedFiles"
              :key="i"
              closable
              @close="attachedFiles.splice(i, 1)"
            >
              📎 {{ f.name }} ({{ f.size }})
            </Tag>
          </div>
        </div>

        <div class="form-item mb-2.5">
          <label class="form-label">事项标题:</label>
          <Input
            v-model:value="ingestTitle"
            placeholder="例如：开发OA开放接口 / 华达打印问题排查"
          />
        </div>

        <div class="form-item mb-3">
          <label class="form-label">工作内容描述:</label>
          <Input.TextArea
            v-model:value="ingestText"
            :rows="3"
            placeholder="请输入工作详细描述..."
          />
        </div>

        <div class="mb-2 grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">关联项目:</label>
            <Input
              v-model:value="ingestProject"
              placeholder="如：OA集成 / AI Work"
            />
          </div>
          <div>
            <label class="form-label">关联客户:</label>
            <Input
              v-model:value="ingestCustomer"
              placeholder="如：客户 B / 华达"
            />
          </div>
        </div>

        <div class="mt-2">
          <label class="form-label">日期:</label>
          <Input
            v-model:value="ingestDate"
            placeholder="如 08/07"
            class="w-32"
          />
        </div>
      </div>
    </Modal>

    <!-- 实体穿透详情 Drawer -->
    <EntityContextDrawer
      v-model:open="entityOpen"
      :entity="pickedEntity"
      mode="personal"
    />
  </div>
</template>

<style scoped>
.my-work-container {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.my-work-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  width: 100%;
}

/* 左侧查询条件面板 */
.filter-panel {
  display: flex;
  flex-direction: column;
}

.filter-radio-grid :deep(.ant-radio-button-wrapper-checked) {
  color: #fff !important;
  background-color: #0d6853 !important;
  border-color: #0d6853 !important;
}

.filter-radio-group :deep(.ant-radio-button-wrapper-checked) {
  color: #fff !important;
  background-color: #0d6853 !important;
  border-color: #0d6853 !important;
}

.filter-radio-grid :deep(.ant-radio-button-wrapper) {
  padding: 0 6px;
  font-size: 11.5px;
  text-align: center;
}

.filter-radio-group :deep(.ant-radio-button-wrapper) {
  padding: 0 4px;
  font-size: 11.5px;
}

/* 右侧内容面板自适应充满 */
.content-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

/* 品牌主色按钮 (#0D6853) */
.primary-brand-btn {
  color: #fff !important;
  background-color: #0d6853 !important;
  border-color: #0d6853 !important;
}

.primary-brand-btn:hover {
  background-color: #095040 !important;
  border-color: #095040 !important;
}

/* 卡片基类（纯白背景，灰色边框） */
.compact-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transition: all 0.15s ease-in-out;
}

.compact-card:hover {
  border-color: #0d6853;
  box-shadow: 0 2px 8px rgb(13 104 83 / 8%);
}

/* 延期/风险卡片：仅在左侧增加 3px 警示红条，不加粗整个卡片框 */
.compact-card--delayed {
  border-left: 3px solid #d9363e !important;
}

/* 承诺卡片：仅在左侧增加 3px 橙色 Accent 条 */
.compact-card--commitment {
  border-left: 3px solid #d46b08 !important;
}

/* Header Row */
.card-header-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.date-tag {
  display: inline-flex;
  flex: none;
  gap: 4px;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
}

.card-title {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
  white-space: nowrap;
}

.card-tags-area {
  display: flex;
  gap: 5px;
  align-items: center;
  margin-left: 2px;
}

/* 降噪通用信息 Tag (无彩浅灰底) */
.neutral-info-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-size: 11px;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
}

/* 承诺 Badge */
.commitment-badge {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 500;
  color: #d46b08;
  background: #fff7e6;
  border-radius: 4px;
}

/* 新增 Badge */
.new-item-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-size: 11px;
  color: #4e5969;
  background: #f2f3f5;
  border-radius: 4px;
}

/* 状态语义标签 */
.status-semantic-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 500;
  line-height: 18px;
  border: 1px solid transparent;
  border-radius: 4px;
}

.timeline-btn {
  padding: 0 4px !important;
  font-size: 11.5px !important;
  color: #4e5969 !important;
}

.timeline-btn:hover {
  color: #0d6853 !important;
}

.card-action {
  flex: none;
  margin-left: auto;
}

.btn-remove-report {
  color: #86909c !important;
}

/* Summary Row */
.card-summary-row {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  font-size: 12.5px;
  line-height: 1.5;
  color: #4e5969;
  -webkit-box-orient: vertical;
}

/* Footer Row */
.card-footer-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  padding-top: 8px;
  border-top: 1px dashed #f2f3f5;
}

.footer-materials {
  display: flex;
  flex: 1 1 calc(50% - 6px);
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
  min-width: 240px;
}

.footer-entities {
  display: flex;
  flex: 1 1 calc(50% - 6px);
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-start;
  justify-content: flex-end;
  min-width: 240px;
  margin-left: auto;
}

.footer-section-label {
  display: inline-flex;
  flex: none;
  gap: 3px;
  align-items: center;
  font-size: 11px;
  font-weight: 500;
  color: #86909c;
  white-space: nowrap;
}

.work-empty-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  background: #fff;
  border: 1px dashed #e8e8e8;
  border-radius: 12px;
}

.ingest-modal-body {
  display: flex;
  flex-direction: column;
}

.ingest-tip {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #165d25;
  background: #e8ffea;
  border-radius: 8px;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  cursor: pointer;
  background: #f8fbf9;
  border: 1.5px dashed #b7eb8f;
  border-radius: 10px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #1d2129;
}
</style>
