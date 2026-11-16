<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Input,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import { zhangkouDataFileRecords } from '#/api/mock-data-zhangkou';

import AiWorkPage from '../../ai-work/components/ai-work-page.vue';

// 本地用 ref 持有响应式副本，使重启任务等操作能立即触发视图更新
const dataFileRecords = ref([...zhangkouDataFileRecords]);

const periodFilter = ref<string>('');
const statusFilter = ref<string>('');
const searchKeyword = ref<string>('');

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '处理中', value: '处理中' },
  { label: '创建任务完成', value: '创建任务完成' },
  { label: '失败', value: '失败' },
];

const statusColorMap: Record<string, string> = {
  处理中: 'blue',
  创建任务完成: 'green',
  失败: 'red',
};

const taskStatusColorMap: Record<string, string> = {
  成功: 'green',
  失败: 'red',
  处理中: 'blue',
  待填报: 'orange',
};

const appliedPeriod = ref<string>('');
const appliedStatus = ref<string>('');
const appliedKeyword = ref<string>('');

const filteredRecords = computed(() => {
  return dataFileRecords.value.filter((r) => {
    if (appliedPeriod.value && r.period !== appliedPeriod.value) return false;
    if (appliedStatus.value && r.fileStatus !== appliedStatus.value)
      return false;
    if (
      appliedKeyword.value &&
      !r.fileName.toLowerCase().includes(appliedKeyword.value.toLowerCase())
    )
      return false;
    return true;
  });
});

function handleQuery() {
  appliedPeriod.value = periodFilter.value;
  appliedStatus.value = statusFilter.value;
  appliedKeyword.value = searchKeyword.value;
}

function formatPeriod(period: string) {
  if (!period) return '';
  const [y, m] = period.split('-');
  return `${y}年${Number.parseInt(m, 10)}月`;
}

function handleRestart(task: any) {
  task.status = '待填报';
  task.completedAt = '';
  task.result = '';
  message.success(`已重启任务：${task.taskId}`);
}
</script>

<template>
  <AiWorkPage
    eyebrow="EXECUTION RECORDS"
    title="执行记录"
    description="查看数据文件处理状态及填报任务执行结果"
  >
    <div class="data-upload-page">
      <!-- 筛选区域 -->
      <section class="filter-section">
        <div class="filter-row">
          <div class="filter-item">
            <label>费用期间</label>
            <DatePicker
              v-model:value="periodFilter"
              picker="month"
              placeholder="选择费用期间"
              style="width: 180px"
            />
          </div>
          <div class="filter-item">
            <label>状态</label>
            <Select
              v-model:value="statusFilter"
              :options="statusOptions"
              style="width: 160px"
            />
          </div>
          <div class="filter-item">
            <label>文件名</label>
            <Input
              v-model:value="searchKeyword"
              placeholder="输入文件名"
              style="width: 220px"
              allow-clear
            />
          </div>
          <div class="filter-item filter-action">
            <Button type="primary" @click="handleQuery">
              <Icon icon="lucide:search" />
              查询
            </Button>
          </div>
        </div>
      </section>

      <!-- 主表 -->
      <section class="table-section">
        <Table
          :data-source="filteredRecords"
          row-key="id"
          :pagination="{ pageSize: 10 }"
          :expand-column-width="48"
        >
          <template #expandIcon="{ expanded, record, onExpand }">
            <span
              v-if="record.fileStatus === '创建任务完成'"
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

          <Table.Column title="文件名" data-index="fileName" />
          <Table.Column title="费用期间">
            <template #default="{ record }">
              {{ formatPeriod(record.period) }}
            </template>
          </Table.Column>
          <Table.Column title="文件处理状态">
            <template #default="{ record }">
              <Tag :color="statusColorMap[record.fileStatus]">
                {{ record.fileStatus }}
              </Tag>
            </template>
          </Table.Column>
          <Table.Column title="上传时间" data-index="uploadedAt" />
          <Table.Column title="处理完成时间" data-index="completedAt" />
          <Table.Column title="错误消息" data-index="errorMessage" />

          <!-- 展开行：填报任务明细 -->
          <template #expandedRowRender="{ record }">
            <div class="detail-wrap">
              <h4 class="detail-title">
                <Icon icon="lucide:list-checks" />
                填报任务明细（{{ record.tasks.length }}个任务）
              </h4>
              <Table
                :data-source="record.tasks"
                row-key="taskId"
                :pagination="false"
                size="small"
                class="detail-table"
              >
                <Table.Column title="任务编号" data-index="taskId" />
                <Table.Column title="任务状态">
                  <template #default="{ record: task }">
                    <Tag :color="taskStatusColorMap[task.status]">
                      {{ task.status }}
                    </Tag>
                  </template>
                </Table.Column>
                <Table.Column title="任务完成时间" data-index="completedAt" />
                <Table.Column title="执行结果" data-index="result" />
                <Table.Column title="操作">
                  <template #default="{ record: task }">
                    <Button
                      v-if="task.status === '失败'"
                      type="link"
                      size="small"
                      @click="handleRestart(task)"
                    >
                      <Icon icon="lucide:refresh-cw" class="size-3" />
                      重启任务
                    </Button>
                  </template>
                </Table.Column>
              </Table>
            </div>
          </template>
        </Table>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.data-upload-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.filter-section {
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
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
  justify-content: flex-end;
  margin-left: auto;
}

.table-section {
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

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

.detail-wrap {
  padding: 12px 16px;
}

.detail-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 12px;
  font-size: 13px;
  color: #173c34;
}

.detail-table {
  margin-left: 0;
}
</style>
