<script setup lang="ts">
import type { BillRecord } from '#/types/agent';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { getBillRecordsApi } from '#/api/agent';

const FormItem = Form.Item;
const RangePicker = DatePicker.RangePicker;

// 搜索表单
const searchForm = ref({
  billNo: '',
  billType: undefined,
  systemId: undefined,
  auditStatus: undefined,
  auditDateRange: undefined,
});

// 表格数据
const dataSource = ref<BillRecord[]>([]);
const loading = ref(false);

// 单据类型选项
const billTypeOptions = ref([
  { label: '费用报销单', value: '费用报销单' },
  { label: '采购申请单', value: '采购申请单' },
  { label: '付款申请单', value: '付款申请单' },
  { label: '请假申请单', value: '请假申请单' },
  { label: '差旅申请单', value: '差旅申请单' },
]);

// 业务系统选项
const systemOptions = ref([
  { label: 'SAP Fiori (总部)', value: '1' },
  { label: 'SAP Fiori (分部)', value: '2' },
  { label: '用友 NC', value: '3' },
]);

// 审核状态选项
const auditStatusOptions = ref([
  { label: '已通过', value: '已通过' },
  { label: '已拒绝', value: '已拒绝' },
  { label: '待审核', value: '待审核' },
  { label: '审核中', value: '审核中' },
]);

// 表格列配置
const columns = computed(() => [
  {
    title: '单据编号',
    dataIndex: 'billNo',
    key: 'billNo',
    width: 180,
    fixed: 'left' as const,
  },
  {
    title: '单据类型',
    dataIndex: 'billType',
    key: 'billType',
    width: 120,
  },
  {
    title: '业务系统',
    dataIndex: 'systemName',
    key: 'systemName',
    width: 180,
  },
  {
    title: '置信度',
    dataIndex: 'confidence',
    key: 'confidence',
    width: 100,
  },
  {
    title: '审核状态',
    dataIndex: 'auditStatus',
    key: 'auditStatus',
    width: 100,
  },
  {
    title: '单据创建时间',
    dataIndex: 'createdDate',
    key: 'createdDate',
    width: 160,
  },
  {
    title: '审核时间',
    dataIndex: 'auditDate',
    key: 'auditDate',
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    width: 120,
    fixed: 'right' as const,
  },
]);

// 获取审核状态标签颜色
function getAuditStatusColor(status: string) {
  const colorMap: Record<string, string> = {
    已通过: 'green',
    已拒绝: 'red',
    待审核: 'orange',
    审核中: 'blue',
  };
  return colorMap[status] || 'default';
}

// 获取置信度标签颜色
function getConfidenceColor(confidence: number | undefined) {
  if (confidence === undefined) return 'default';
  if (confidence >= 90) return 'green';
  if (confidence >= 75) return 'blue';
  if (confidence >= 60) return 'orange';
  return 'red';
}

// 查询数据
async function handleSearch() {
  loading.value = true;
  try {
    const result = await getBillRecordsApi(searchForm.value);
    dataSource.value = result.data || [];
  } catch {
    // 静默处理错误
  } finally {
    loading.value = false;
  }
}

// 重置搜索
function handleReset() {
  searchForm.value = {
    billNo: '',
    billType: undefined,
    systemId: undefined,
    auditStatus: undefined,
    auditDateRange: undefined,
  };
  handleSearch();
}

// 查看审核报告
function viewReport(_record: BillRecord) {
  // TODO: 打开审核报告详情弹窗
}

// 初始化加载数据
onMounted(() => {
  handleSearch();
});
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 p-6">
    <!-- 搜索表单 -->
    <Card>
      <Form layout="inline" :model="searchForm">
        <FormItem label="单据编号">
          <Input
            v-model:value="searchForm.billNo"
            placeholder="请输入单据编号"
            allow-clear
            style="width: 200px"
          />
        </FormItem>
        <FormItem label="单据类型">
          <Select
            v-model:value="searchForm.billType"
            placeholder="请选择单据类型"
            allow-clear
            style="width: 180px"
            :options="billTypeOptions"
          />
        </FormItem>
        <FormItem label="业务系统">
          <Select
            v-model:value="searchForm.systemId"
            placeholder="请选择业务系统"
            allow-clear
            style="width: 180px"
            :options="systemOptions"
          />
        </FormItem>
        <FormItem label="审核状态">
          <Select
            v-model:value="searchForm.auditStatus"
            placeholder="请选择审核状态"
            allow-clear
            style="width: 150px"
            :options="auditStatusOptions"
          />
        </FormItem>
        <FormItem label="审核时间">
          <RangePicker
            v-model:value="searchForm.auditDateRange"
            placeholder="['开始时间', '结束时间']"
            allow-clear
            style="width: 300px"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">
              <template #icon>
                <Icon icon="lucide:search" class="size-4" />
              </template>
              查询
            </Button>
            <Button @click="handleReset">
              <template #icon>
                <Icon icon="lucide:rotate-ccw" class="size-4" />
              </template>
              重置
            </Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <!-- 数据表格 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`,
        }"
        :scroll="{ x: 1300 }"
      >
        <!-- 审核状态列 -->
        <template #bodyCell="{ column, record }">
          <!-- 置信度列 -->
          <template v-if="column.key === 'confidence'">
            <Tag
              v-if="record.confidence !== undefined"
              :color="getConfidenceColor(record.confidence)"
            >
              {{ record.confidence }}%
            </Tag>
            <span v-else class="text-muted-foreground">-</span>
          </template>

          <!-- 审核状态列 -->
          <template v-else-if="column.key === 'auditStatus'">
            <Tag :color="getAuditStatusColor(record.auditStatus)">
              {{ record.auditStatus }}
            </Tag>
          </template>

          <!-- 操作列 -->
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="viewReport(record)">
              <template #icon>
                <Icon icon="lucide:file-text" class="size-4" />
              </template>
              查看报告
            </Button>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
