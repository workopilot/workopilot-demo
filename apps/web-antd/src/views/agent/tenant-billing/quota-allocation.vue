<script setup lang="ts">
import { ref } from 'vue';

import {
  Button,
  Card,
  InputNumber,
  message,
  Progress,
  Switch,
  Table,
} from 'ant-design-vue';

// Mock Data
const employees = ref([
  {
    key: '1',
    id: 'EMP-001',
    name: '选品报价员',
    used: 450_200,
    limit: 500_000,
    hardLimit: true,
  },
  {
    key: '2',
    id: 'EMP-002',
    name: '数据分析员',
    used: 89_500,
    limit: 200_000,
    hardLimit: false,
  },
  {
    key: '3',
    id: 'EMP-003',
    name: '合规审核专员',
    used: 210_000,
    limit: null,
    hardLimit: false,
  },
]);

const columns = [
  { title: '数字员工', dataIndex: 'name', key: 'name' },
  { title: '编号', dataIndex: 'id', key: 'id' },
  { title: '本月已耗点数 (点)', dataIndex: 'used', key: 'used' },
  { title: '消耗进度', dataIndex: 'progress', key: 'progress', width: 200 },
  { title: '消耗上限 (点/月)', dataIndex: 'limit', key: 'limit', width: 180 },
  {
    title: '硬性限制 (熔断断服)',
    dataIndex: 'hardLimit',
    key: 'hardLimit',
    align: 'center',
  },
  { title: '操作', key: 'action', width: 100, align: 'center' },
];

const saveSettings = () => {
  message.success('额度分配配置已保存！');
};
</script>

<template>
  <div
    class="flex min-h-full w-full flex-col gap-6 bg-slate-50 p-4 md:p-6 dark:bg-slate-900"
  >
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">
        员工额度分配
      </h1>
      <p class="text-sm text-slate-500">
        为使用“通用共享池”的高频数字员工设置消耗上限，防止单一员工耗尽整体点数。
      </p>
    </div>

    <Card :bordered="false" class="w-full rounded-xl shadow-sm">
      <div class="mb-4 flex items-center justify-between">
        <div class="text-slate-500">
          <span class="mr-4"
            >当前共享池总容量:
            <strong class="text-slate-800 dark:text-slate-200"
              >1,000,000</strong
            >
            点</span
          >
          <span
            >共享池剩余: <strong class="text-primary">850,200</strong> 点</span
          >
        </div>
        <Button type="primary" @click="saveSettings">保存配置</Button>
      </div>

      <Table :columns="columns" :data-source="employees" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'used'">
            <span class="font-semibold">{{
              record.used.toLocaleString()
            }}</span>
          </template>
          <template v-if="column.key === 'progress'">
            <template v-if="record.limit">
              <Progress
                :percent="Math.round((record.used / record.limit) * 100)"
                size="small"
                :status="record.used > record.limit ? 'exception' : 'normal'"
              />
            </template>
            <template v-else>
              <span class="text-xs text-slate-400">无限制</span>
            </template>
          </template>
          <template v-if="column.key === 'limit'">
            <InputNumber
              v-model:value="record.limit"
              :min="0"
              :step="10000"
              placeholder="不设限"
              class="w-full"
            />
          </template>
          <template v-if="column.key === 'hardLimit'">
            <Switch
              v-model:checked="record.hardLimit"
              :disabled="!record.limit"
            />
          </template>
          <template v-if="column.key === 'action'">
            <Button
              type="link"
              size="small"
              @click="
                record.limit = null;
                record.hardLimit = false;
              "
            >
              清除
            </Button>
          </template>
        </template>
      </Table>

      <div
        class="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
      >
        <strong>配置说明：</strong>
        <ul class="mt-1 list-inside list-disc">
          <li>
            <strong>消耗上限</strong
            >：员工在本月内最多可以消耗的共享池点数。不填写即为不限制（最高可消耗完整个共享池）。
          </li>
          <li>
            <strong>硬性限制</strong
            >：开启后，该员工触达上限将立即停止服务；关闭后，触达上限仅触发超额告警，但仍可继续执行任务。
          </li>
        </ul>
      </div>
    </Card>
  </div>
</template>
