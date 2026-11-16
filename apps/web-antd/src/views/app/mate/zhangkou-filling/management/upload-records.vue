<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { ZipUploadRecord } from '#/api/mock-data-zhangkou';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, DatePicker, Input, Select, Table, Tag } from 'ant-design-vue';

import { zhangkouZipUploadRecords } from '#/api/mock-data-zhangkou';

import AiWorkPage from '../../ai-work/components/ai-work-page.vue';

const periodFilter = ref<string>('');
const statusFilter = ref<string>('');
const searchKeyword = ref<string>('');

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '处理中', value: '处理中' },
  { label: '已完成', value: '已完成' },
  { label: '部分失败', value: '部分失败' },
  { label: '全部失败', value: '全部失败' },
];

const statusColorMap: Record<string, string> = {
  处理中: 'blue',
  已完成: 'green',
  部分失败: 'orange',
  全部失败: 'red',
  成功: 'green',
  失败: 'red',
};

const appliedPeriod = ref<string>('');
const appliedStatus = ref<string>('');
const appliedKeyword = ref<string>('');

const filteredRecords = computed(() => {
  return zhangkouZipUploadRecords.filter((record) => {
    if (appliedPeriod.value && record.period !== appliedPeriod.value) {
      return false;
    }
    if (appliedStatus.value && record.overallStatus !== appliedStatus.value) {
      return false;
    }
    if (
      appliedKeyword.value &&
      !record.zipName.includes(appliedKeyword.value)
    ) {
      return false;
    }
    return true;
  });
});

function handleQuery() {
  appliedPeriod.value = periodFilter.value;
  appliedStatus.value = statusFilter.value;
  appliedKeyword.value = searchKeyword.value;
}

function getInvoiceSummary(record: ZipUploadRecord) {
  const total = record.invoices.length;
  const success = record.invoices.filter((f) => f.status === '成功').length;
  return { success, total };
}

function getAttachSummary(record: ZipUploadRecord) {
  const total = record.attachments.length;
  const success = record.attachments.filter((f) => f.status === '成功').length;
  return { success, total };
}

function formatPeriod(value: string) {
  if (!value) return '';
  return `${value.replace('-', '年')}月`;
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="UPLOAD RECORDS"
    title="发票附件上传记录"
    description="查看批量上传 zip 文件的解包与上传处理结果"
  >
    <div class="records-page">
      <!-- 筛选区 -->
      <section class="filter-section">
        <div class="filter-item">
          <label>费用期间</label>
          <DatePicker
            v-model:value="periodFilter"
            picker="month"
            placeholder="选择费用期间"
            style="width: 180px"
            format="YYYY-MM"
          />
        </div>
        <div class="filter-item">
          <label>处理状态</label>
          <Select
            v-model:value="statusFilter"
            :options="statusOptions"
            style="width: 150px"
          />
        </div>
        <div class="filter-item">
          <label>文件名搜索</label>
          <Input
            v-model:value="searchKeyword"
            placeholder="输入文件名"
            style="width: 200px"
            allow-clear
          />
        </div>
        <div class="filter-item filter-action">
          <Button type="primary" @click="handleQuery">
            <Icon icon="lucide:search" />
            查询
          </Button>
        </div>
      </section>

      <!-- zip 包记录主表 -->
      <section class="table-section">
        <Table
          :data-source="filteredRecords"
          row-key="id"
          :pagination="{ pageSize: 10 }"
          :expand-column-width="48"
        >
          <template #expandIcon="{ expanded, record, onExpand }">
            <span
              v-if="record.overallStatus !== '处理中'"
              class="row-expand-toggle"
              @click="(e) => onExpand(record, e)"
            >
              <Icon
                :icon="
                  expanded ? 'lucide:chevron-down' : 'lucide:chevron-right'
                "
                class="size-4"
              />
            </span>
            <span v-else class="row-expand-placeholder"></span>
          </template>
          <Table.Column title="文件名" data-index="zipName" />
          <Table.Column title="费用期间">
            <template #default="{ record }">
              {{ formatPeriod(record.period) }}
            </template>
          </Table.Column>
          <Table.Column title="解包文件数">
            <template #default="{ record }">
              {{ record.overallStatus === '处理中' ? '' : record.totalFiles }}
            </template>
          </Table.Column>
          <Table.Column title="发票结果">
            <template #default="{ record }">
              <template v-if="record.overallStatus !== '处理中'">
                <span>
                  {{ getInvoiceSummary(record).success }}/{{
                    getInvoiceSummary(record).total
                  }}
                </span>
                <Tag
                  v-if="
                    getInvoiceSummary(record).success <
                    getInvoiceSummary(record).total
                  "
                  color="red"
                  size="small"
                >
                  部分失败
                </Tag>
              </template>
            </template>
          </Table.Column>
          <Table.Column title="附件结果">
            <template #default="{ record }">
              <template v-if="record.overallStatus !== '处理中'">
                <span>
                  {{ getAttachSummary(record).success }}/{{
                    getAttachSummary(record).total
                  }}
                </span>
                <Tag
                  v-if="
                    getAttachSummary(record).success <
                    getAttachSummary(record).total
                  "
                  color="red"
                  size="small"
                >
                  部分失败
                </Tag>
              </template>
            </template>
          </Table.Column>
          <Table.Column title="整体状态">
            <template #default="{ record }">
              <Tag :color="statusColorMap[record.overallStatus]">
                {{ record.overallStatus }}
              </Tag>
            </template>
          </Table.Column>
          <Table.Column title="上传时间" data-index="uploadedAt" />
          <Table.Column title="完成时间" data-index="completedAt" />

          <!-- 展开行：发票 + 附件明细 -->
          <template #expandedRowRender="{ record }">
            <div class="detail-wrap">
              <!-- 发票明细 -->
              <div class="detail-block">
                <div class="detail-block-header">
                  <Icon icon="lucide:receipt" />
                  <h4>发票明细（{{ record.invoices.length }}）</h4>
                </div>
                <Table
                  :data-source="record.invoices"
                  row-key="name"
                  :pagination="false"
                  size="small"
                >
                  <Table.Column title="文件名" data-index="name" />
                  <Table.Column
                    title="文件类型"
                    data-index="type"
                    :width="80"
                  />
                  <Table.Column title="上传状态" :width="100">
                    <template #default="{ record: item }">
                      <Tag :color="statusColorMap[item.status]" size="small">
                        {{ item.status }}
                      </Tag>
                    </template>
                  </Table.Column>
                  <Table.Column title="错误消息" :width="300">
                    <template #default="{ record: item }">
                      <span v-if="item.error" class="error-text">
                        {{ item.error }}
                      </span>
                      <span v-else class="muted-text">—</span>
                    </template>
                  </Table.Column>
                  <Table.Column
                    title="处理时间"
                    data-index="processedAt"
                    :width="160"
                  />
                </Table>
              </div>

              <!-- 附件明细 -->
              <div class="detail-block">
                <div class="detail-block-header">
                  <Icon icon="lucide:paperclip" />
                  <h4>附件明细（{{ record.attachments.length }}）</h4>
                </div>
                <Table
                  :data-source="record.attachments"
                  row-key="name"
                  :pagination="false"
                  size="small"
                >
                  <Table.Column title="文件名" data-index="name" />
                  <Table.Column
                    title="文件类型"
                    data-index="type"
                    :width="80"
                  />
                  <Table.Column title="上传状态" :width="100">
                    <template #default="{ record: item }">
                      <Tag :color="statusColorMap[item.status]" size="small">
                        {{ item.status }}
                      </Tag>
                    </template>
                  </Table.Column>
                  <Table.Column title="错误消息" :width="300">
                    <template #default="{ record: item }">
                      <span v-if="item.error" class="error-text">
                        {{ item.error }}
                      </span>
                      <span v-else class="muted-text">—</span>
                    </template>
                  </Table.Column>
                  <Table.Column
                    title="处理时间"
                    data-index="processedAt"
                    :width="160"
                  />
                </Table>
              </div>
            </div>
          </template>
        </Table>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
@media (max-width: 1024px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

.records-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 筛选区 */
.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 11px;
  color: #4d6860;
}

.filter-action {
  padding-bottom: 0;
}

/* 统计概览 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.stat-icon {
  font-size: 28px;
  color: #0b806f;
}

.stat-card > div {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #173c34;
}

.stat-label {
  font-size: 11px;
  color: #7a8b85;
}

.stat-fail {
  margin-left: 4px;
  font-size: 11px;
  color: #cf1322;
}

/* 表格区 */
.row-expand-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.row-expand-placeholder {
  display: inline-block;
  width: 20px;
  height: 20px;
}

.table-section {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

/* 展开行明细 */
.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

.detail-block-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
}

.detail-block-header svg {
  font-size: 18px;
  color: #0b806f;
}

.detail-block-header h4 {
  margin: 0;
  font-size: 13px;
  color: #173c34;
}

.error-text {
  font-size: 12px;
  color: #cf1322;
}

.muted-text {
  color: #bbb;
}
</style>
