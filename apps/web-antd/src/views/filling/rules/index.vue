<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Badge,
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import RuleEditor from './rule-editor.vue';

const rules = ref([
  {
    id: 'fr_1',
    code: 'RULE_001',
    name: '住宿费规则',
    linkAuditType: true,
    auditTypes: ['住宿费'],
    auditContent: '',
    needAttachmentCheck: true,
    needClassifyCheck: true,
    requiredAttachments: ['酒店水单', '住宿水单'],
    subFields: [
      { label: '入住人数', fieldName: 'guestCount' },
      { label: '入住日期', fieldName: 'checkInDate' },
      { label: '离店日期', fieldName: 'checkOutDate' },
    ],
    status: 'active',
    updatedAt: '2026-08-01',
  },
  {
    id: 'fr_2',
    code: 'RULE_002',
    name: '火车票规则',
    linkAuditType: true,
    auditTypes: ['火车票'],
    auditContent: '',
    needAttachmentCheck: true,
    needClassifyCheck: false,
    requiredAttachments: [],
    subFields: [
      { label: '出发地', fieldName: 'departure' },
      { label: '目的地', fieldName: 'destination' },
    ],
    status: 'active',
    updatedAt: '2026-08-01',
  },
  {
    id: 'fr_3',
    code: 'RULE_003',
    name: '市内交通费规则',
    linkAuditType: true,
    auditTypes: ['市内交通费'],
    auditContent: '',
    needAttachmentCheck: false,
    needClassifyCheck: false,
    requiredAttachments: [],
    subFields: [
      { label: '出发地', fieldName: 'departure' },
      { label: '目的地', fieldName: 'destination' },
      { label: '金额', fieldName: 'amount' },
    ],
    status: 'disabled',
    updatedAt: '2026-07-28',
  },
]);

const keyword = ref('');
const statusFilter = ref('');

const filteredRules = computed(() => {
  return rules.value.filter((r) => {
    const matchKeyword =
      !keyword.value ||
      r.name.includes(keyword.value) ||
      r.code.includes(keyword.value) ||
      r.auditTypes?.some((t: string) => t.includes(keyword.value)) ||
      r.auditContent?.includes(keyword.value);
    const matchStatus = !statusFilter.value || r.status === statusFilter.value;
    return matchKeyword && matchStatus;
  });
});

const drawerOpen = ref(false);
const currentRecord = ref<any>();

function handleAdd() {
  currentRecord.value = undefined;
  drawerOpen.value = true;
}
function handleEdit(row: any) {
  currentRecord.value = row;
  drawerOpen.value = true;
}
function handleDelete(id: string) {
  rules.value = rules.value.filter((r) => r.id !== id);
  message.success('规则已删除');
}
function handleSuccess() {
  drawerOpen.value = false;
}

const columns = [
  { title: '编码', dataIndex: 'code', width: 120, align: 'left' as const },
  { title: '规则名称', dataIndex: 'name', width: 180, align: 'left' as const },
  {
    title: '审核类型',
    dataIndex: 'auditTypes',
    width: 200,
    align: 'left' as const,
  },
  {
    title: '必填附件',
    dataIndex: 'requiredAttachments',
    width: 200,
    align: 'left' as const,
  },
  {
    title: '必填子字段',
    dataIndex: 'subFields',
    minWidth: 250,
    align: 'left' as const,
  },
  { title: '状态', dataIndex: 'status', width: 100, align: 'left' as const },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    width: 140,
    align: 'right' as const,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <!-- Top Query Card -->
    <Card :bordered="false" class="shadow-sm">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">关键字</span>
          <Input
            v-model:value="keyword"
            placeholder="规则名称/编码"
            class="!w-72"
            allow-clear
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">状态</span>
          <Select
            v-model:value="statusFilter"
            placeholder="全部"
            class="!w-32"
            allow-clear
          >
            <Select.Option value="">全部</Select.Option>
            <Select.Option value="active">启用</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
        </div>
        <Button
          type="primary"
          @click="
            keyword = '';
            statusFilter = '';
          "
        >
          查询
        </Button>
      </div>
    </Card>

    <!-- Bottom Table Card -->
    <Card
      :bordered="false"
      class="flex min-h-0 flex-1 flex-col shadow-sm"
      :body-style="{
        flex: 1,
        overflow: 'hidden',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <div class="flex items-center justify-between border-b p-4">
        <div class="flex items-center text-lg font-bold">
          <Icon icon="lucide:list" class="mr-2" />
          规则列表
        </div>
        <Button type="primary" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1" />
          新增规则
        </Button>
      </div>

      <div class="flex-1 overflow-hidden p-2">
        <Table
          :data-source="filteredRules"
          :columns="columns"
          row-key="id"
          :pagination="{ pageSize: 10 }"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'auditTypes'">
              <div class="flex flex-wrap gap-1">
                <template
                  v-if="record.linkAuditType && record.auditTypes?.length"
                >
                  <Tag
                    v-for="at in record.auditTypes"
                    :key="at"
                    color="purple"
                    class="!text-[11px]"
                  >
                    {{ at }}
                  </Tag>
                </template>
                <span v-else class="text-gray-400">-</span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'requiredAttachments'">
              <div class="flex flex-wrap gap-1">
                <template v-if="record.needAttachmentCheck">
                  <Tag color="blue" class="!text-[11px]">需检查</Tag>
                  <template
                    v-if="
                      record.needClassifyCheck &&
                      record.requiredAttachments?.length
                    "
                  >
                    <Tag
                      v-for="att in record.requiredAttachments"
                      :key="att"
                      color="cyan"
                      class="!text-[11px]"
                    >
                      {{ att }}
                    </Tag>
                  </template>
                  <span
                    v-else-if="!record.needClassifyCheck"
                    class="text-xs text-gray-500"
                  >
                    仅检查存在性
                  </span>
                </template>
                <span v-else class="text-gray-400">不检查</span>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'subFields'">
              <div class="flex flex-wrap gap-1">
                <Tag
                  v-for="sf in record.subFields"
                  :key="sf.fieldName || sf.label"
                  class="!text-[11px]"
                >
                  {{ sf.label }}
                  <span v-if="sf.fieldName" class="ml-0.5 text-gray-400">
                    ({{ sf.fieldName }})
                  </span>
                </Tag>
              </div>
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <Badge
                :status="record.status === 'active' ? 'success' : 'error'"
                :text="record.status === 'active' ? '启用' : '禁用'"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Tooltip title="编辑">
                  <Button type="text" size="small" @click="handleEdit(record)">
                    <Icon icon="lucide:edit" class="text-lg text-blue-500" />
                  </Button>
                </Tooltip>
                <Popconfirm
                  title="确定删除?"
                  @confirm="handleDelete(record.id)"
                >
                  <Tooltip title="删除">
                    <Button type="text" danger size="small">
                      <Icon icon="lucide:trash-2" class="text-lg" />
                    </Button>
                  </Tooltip>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </div>
    </Card>

    <RuleEditor
      v-model:open="drawerOpen"
      :record="currentRecord"
      @success="handleSuccess"
    />
  </div>
</template>
