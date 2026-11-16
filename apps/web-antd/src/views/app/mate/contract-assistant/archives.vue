<script setup lang="ts">
import type { ContractChatSession } from '#/types/contract-assistant';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  Input,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import { getContractArchives } from '#/api/mock-contract-assistant';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import {
  archiveStateLabel,
  contractValidityLabel,
} from './utils/archive-management';

const router = useRouter();
const records = ref<ContractChatSession[]>([]);
const loading = ref(false);
const keyword = ref('');
const status = ref('all');
const category = ref('all');
const statuses = [
  { value: 'all', label: '全部状态' },
  { value: 'review', label: '待处理' },
  { value: 'audit-issues', label: '审核问题' },
  { value: 'expiring', label: '即将到期（30天内）' },
  { value: '待完善', label: '待完善' },
  { value: '待审核', label: '待审核' },
  { value: '待处理问题', label: '待处理问题' },
  ...['待确认生效', '待生效', '生效中', '已到期', '已终止', '已作废'].map(
    (label) => ({ value: label, label }),
  ),
];
function stateLabel(item: ContractChatSession) {
  if (!item.managementState?.archived) return archiveStateLabel(item);
  const validity = contractValidityLabel(item);
  return validity === '待确认' ? '待确认生效' : validity;
}
function stateColor(item: ContractChatSession) {
  const label = stateLabel(item);
  if (label === '生效中') return 'green';
  if (label === '待处理问题') return 'red';
  if (['待审核', '待生效'].includes(label)) return 'blue';
  if (['已作废', '已到期', '已终止'].includes(label)) return 'default';
  return 'orange';
}
function categoryOf(item: ContractChatSession) {
  let label: string;
  if (item.scheme?.management) label = item.scheme.name;
  else if (item.scheme?.categoryIds.includes('contract-sales'))
    label = '销售合同';
  else if (item.scheme) label = '运维服务合同';
  else label = '待匹配';
  return {
    value:
      item.scheme?.management?.categoryKey || item.scheme?.id || 'unclassified',
    label,
  };
}
const categoryOptions = computed(() => [
  { value: 'all', label: '全部分类' },
  ...new Map(
    records.value.map((item) => {
      const category = categoryOf(item);
      return [category.value, category] as const;
    }),
  ).values(),
]);
function matchStatus(item: ContractChatSession) {
  if (status.value === 'audit-issues')
    return (
      item.managementState?.auditItems?.some(
        (entry) => entry.status !== 'passed',
      ) || false
    );
  if (status.value === 'expiring') {
    const end = item.managementState?.expiryDate;
    const days = end
      ? (new Date(`${end}T00:00:00`).getTime() -
          new Date(new Date().toDateString()).getTime()) /
        86_400_000
      : -1;
    return (
      !!item.managementState?.archived &&
      !!item.managementState.dateConfirmed &&
      !['已作废', '已终止'].includes(stateLabel(item)) &&
      days >= 0 &&
      days <= 30
    );
  }
  if (status.value === 'review') return !item.managementState?.archived;
  if (status.value === 'completed') return !!item.managementState?.archived;
  return stateLabel(item) === status.value;
}
const filtered = computed(() =>
  records.value
    .filter(
      (item) =>
        (!keyword.value.trim() ||
          `${item.fileName} ${item.contractNumber} ${item.counterparty} ${item.id} ${item.owner} ${item.team}`
            .toLowerCase()
            .includes(keyword.value.trim().toLowerCase())) &&
        (status.value === 'all' || matchStatus(item)) &&
        (category.value === 'all' || categoryOf(item).value === category.value),
    )
    .toSorted((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
);
const columns = [
  { title: '合同名称', key: 'name', width: 240 },
  { title: '分类／签约主体', key: 'category', width: 180 },
  { title: '负责人／所属公司', key: 'owner', width: 170 },
  { title: '合同状态', key: 'status', width: 135 },
  { title: '有效期／提醒', key: 'expiry', width: 165 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 155 },
  { title: '', key: 'action', width: 115, fixed: 'right' as const },
];
async function load() {
  loading.value = true;
  try {
    const list = await getContractArchives();
    records.value = list.data;
  } catch {
    message.error('档案加载失败，请重试');
  } finally {
    loading.value = false;
  }
}
function row(record: Record<string, unknown>): ContractChatSession {
  const item = records.value.find((value) => value.id === record.id);
  if (!item) throw new Error('未找到合同记录');
  return item;
}
function open(item: ContractChatSession) {
  void router.push(
    `/app/mate/employee/contract-assistant/contract-archives/${encodeURIComponent(item.id)}`,
  );
}
function newContract() {
  void router.push('/app/mate/employee/contract-assistant/contract-chat');
}
onMounted(load);
</script>

<template>
  <AiWorkPage
    title="合同档案"
    icon="lucide:folder-archive"
    description="统一查看合同信息、摘要、审核结果及有效期，跟踪到期处理事项。"
  >
    <template #title-suffix>
      <b class="archive-count">{{ records.length }}</b>
    </template>
    <template #actions>
      <Button :loading="loading" @click="load">
        <Icon icon="lucide:refresh-cw" />
        刷新
      </Button>
      <Button type="primary" @click="newContract">
        <Icon icon="lucide:upload" />
        上传合同
      </Button>
    </template>
    <div class="archive-page">
      <div class="archive-stats">
        <button :class="{ selected: status === 'all' }" @click="status = 'all'">
          <span class="stat-icon"><Icon icon="lucide:files" /></span>
          <span>
            <small>全部合同</small>
            <strong>
              {{ records.length }}
              <em>份</em>
            </strong>
          </span>
        </button>
        <button
          :class="{ selected: status === 'review' }"
          @click="status = 'review'"
        >
          <span class="stat-icon amber">
            <Icon icon="lucide:list-checks" />
          </span>
          <span>
            <small>待确认与补充</small>
            <strong>
              {{
                records.filter((item) => !item.managementState?.archived).length
              }}
              <em>份</em>
            </strong>
          </span>
        </button>
        <button
          :class="{ selected: status === 'completed' }"
          @click="status = 'completed'"
        >
          <span class="stat-icon"><Icon icon="lucide:circle-check" /></span>
          <span>
            <small>已建档</small>
            <strong>
              {{
                records.filter((item) => item.managementState?.archived).length
              }}
              <em>份</em>
            </strong>
          </span>
        </button>
      </div>
      <section class="archive-workbench">
        <header class="archive-toolbar">
          <div>
            <h2>合同记录</h2>
          </div>
          <div class="archive-filters">
            <Input
              v-model:value="keyword"
              allow-clear
              placeholder="搜索名称、编号、签约对方或负责人"
            >
              <template #prefix><Icon icon="lucide:search" /></template>
            </Input>
            <Select v-model:value="category" :options="categoryOptions" />
            <Select v-model:value="status" :options="statuses" />
          </div>
        </header>
        <Table
          :data-source="filtered"
          :columns="columns"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 1080 }"
          :pagination="{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total: number) => `共 ${total} 份合同`,
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <button class="contract-name" @click="open(row(record))">
                <span class="file-symbol">
                  <Icon icon="lucide:file-text" />
                </span>
                <span>
                  <strong :title="record.fileName">
                    {{ record.fileName.replace(/\.[^.]+$/, '') }}
                  </strong>
                  <small>{{ record.contractNumber || record.id }}</small>
                </span>
              </button>
            </template>
            <template v-else-if="column.key === 'category'">
              <span class="cell-main">
                {{ categoryOf(row(record)).label }}
              </span>
              <small class="cell-sub">
                签约主体：{{ record.counterparty || '未提取' }}
              </small>
            </template>
            <template v-else-if="column.key === 'owner'">
              <span class="cell-main">{{ record.owner || '待指定' }}</span>
              <small class="cell-sub">
                所属公司：{{ record.company || '未填写' }}
              </small>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="stateColor(row(record))">
                {{ stateLabel(row(record)) }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'expiry'">
              <span class="cell-main">
                {{
                  record.managementState?.dateConfirmed
                    ? record.managementState.expiryDate
                    : '日期待确认'
                }}
              </span>
              <small class="cell-sub">
                {{
                  record.end
                    ? '后续提醒已停止'
                    : record.managementState?.archived &&
                        record.managementState?.dateConfirmed
                      ? '到期安排已确认'
                      : '未触发到期提醒'
                }}
              </small>
            </template>
            <template v-else-if="column.key === 'action'">
              <a
                class="detail-link"
                :href="
                  router.resolve(
                    `/app/mate/employee/contract-assistant/contract-archives/${encodeURIComponent(record.id)}`,
                  ).href
                "
                @click.prevent="open(row(record))"
              >
                查看详情
                <Icon icon="lucide:arrow-up-right" />
              </a>
            </template>
          </template>
          <template #emptyText>
            <Empty description="暂无匹配合同，可更改筛选或前往聊天上传合同" />
          </template>
        </Table>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.detail-link {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  color: #36785d;
  white-space: nowrap;
}

.detail-link:hover {
  color: #145d43;
}

.detail-link svg {
  font-size: 15px;
}

.archive-page {
  height: 100%;
  min-height: 0;
  padding: 14px 18px;
  overflow: auto;
  background: #f7faf8;
}

.archive-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 23px;
  padding: 0 7px;
  font-size: 12px;
  color: #437460;
  background: #e8f1ec;
  border-radius: 7px;
}

.archive-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.archive-stats > button {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  text-align: left;
  background: white;
  border: 1px solid #dfe9e3;
  border-radius: 13px;
}

.archive-stats > button.selected {
  background: #f1f8f3;
  border-color: #a6cab7;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 17px;
  color: #4f8d69;
  background: #ecf5ef;
  border-radius: 8px;
}

.stat-icon.amber {
  color: #b59150;
  background: #fcf4e6;
}

.archive-stats > button > span:last-child {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.archive-stats small {
  display: block;
  font-size: 11px;
  color: #83958a;
}

.archive-stats strong {
  display: block;
  margin-top: 0;
  font-size: 22px;
  font-weight: 650;
  line-height: 28px;
  color: #2f513b;
}

.archive-stats em {
  margin-left: 7px;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  color: #9aaba0;
}

.archive-workbench {
  overflow: hidden;
  background: white;
  border: 1px solid #dfe9e3;
  border-radius: 14px;
}

.archive-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}

.archive-toolbar h2 {
  font-size: 14px;
  font-weight: 650;
  color: #31543e;
  white-space: nowrap;
}

.archive-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.archive-filters :deep(.ant-input-affix-wrapper) {
  display: inline-flex;
  align-items: center;
  width: 240px;
  height: 32px;
  padding: 4px 11px;
  margin: 0;
}

.archive-filters :deep(.ant-input-affix-wrapper > input.ant-input) {
  height: auto;
  min-height: 0;
  padding: 0;
  line-height: 22px;
}

.archive-filters :deep(.ant-input-prefix),
.archive-filters :deep(.ant-input-suffix) {
  display: inline-flex;
  align-items: center;
}

.archive-filters :deep(.ant-select-single) {
  height: 32px;
}

.archive-filters :deep(.ant-select-single .ant-select-selector) {
  display: flex;
  align-items: center;
  height: 32px;
  padding-inline-end: 28px;
}

.archive-filters :deep(.ant-select-single .ant-select-selection-item),
.archive-filters :deep(.ant-select-single .ant-select-selection-placeholder) {
  line-height: 30px;
}

.archive-filters :deep(.ant-select-arrow) {
  position: absolute;
  inset-inline-end: 11px;
  top: 50%;
  display: inline-flex;
  align-items: center;
  height: 12px;
  margin-top: -6px;
}

.archive-filters :deep(.ant-select) {
  min-width: 135px;
}

.contract-name {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  max-width: 208px;
  text-align: left;
}

.file-symbol {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 34px;
  height: 38px;
  font-size: 20px;
  color: #5a9370;
  background: #eef6f1;
  border-radius: 8px;
}

.contract-name > span:last-child {
  min-width: 0;
}

.contract-name strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 550;
  color: #345b43;
  white-space: nowrap;
}

.contract-name small {
  display: block;
  margin-top: 5px;
  font-size: 10px;
  color: #95a79a;
}

.sample-tag {
  margin-top: 6px;
  margin-left: 44px;
  font-size: 9px;
  line-height: 17px;
  color: #8f9d93;
}

.cell-main {
  font-size: 12px;
  color: #56715e;
}

.cell-sub {
  display: block;
  margin-top: 5px;
  font-size: 10px;
  color: #9aa89e;
}

:deep(.ant-btn) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn-primary) {
  background: #176e5b;
  border-color: #176e5b;
}

:deep(.ant-table-thead > tr > th) {
  font-size: 11px;
  font-weight: 550;
  color: #809588;
  background: #f7faf8;
}

:deep(.ant-table-pagination) {
  padding: 0 16px;
}

@media (max-width: 1000px) {
  .archive-stats > button > span:last-child {
    gap: 5px;
  }

  .archive-stats > button {
    gap: 7px;
    padding: 9px 10px;
  }

  .stat-icon {
    flex-shrink: 0;
    width: 25px;
    height: 25px;
    font-size: 15px;
  }

  .archive-stats small {
    font-size: 10px;
  }

  .archive-filters :deep(.ant-input-affix-wrapper) {
    width: 210px;
  }
}

@media (max-width: 680px) {
  .archive-page {
    padding: 12px;
  }

  .archive-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .archive-stats > button {
    padding: 12px;
  }

  .archive-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .archive-filters {
    width: 100%;
  }

  .archive-filters :deep(.ant-input-affix-wrapper) {
    width: 100%;
  }
}
</style>
