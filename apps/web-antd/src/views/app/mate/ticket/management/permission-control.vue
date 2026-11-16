<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  message,
  Modal,
  Select,
  Table,
  TabPane,
  Tabs,
} from 'ant-design-vue';

type DocStatus = '处理中' | '已完成' | '已派单' | '待派单' | '待验收';

const STATUS_TABS: DocStatus[] = [
  '待派单',
  '已派单',
  '处理中',
  '待验收',
  '已完成',
];

const FIELD_NAMES = [
  '工单标题',
  '工单类型',
  '优先级',
  '问题描述',
  '处理人',
  '产品型号',
  '故障等级',
  '客户等级',
];

const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'engineer', label: '工程师' },
  { value: 'service', label: '客服' },
  { value: 'finance', label: '财务' },
  { value: 'employee', label: '普通员工' },
];

interface FieldPermission {
  field: string;
  canShow: boolean;
  canEdit: boolean;
}

interface DocItem {
  id: string;
  code: string;
  name: string;
  roles: string[];
}

const docs = ref<DocItem[]>([
  {
    id: 'd1',
    code: 'ops-ticket',
    name: '运维工单',
    roles: ['admin', 'engineer', 'service'],
  },
  {
    id: 'd2',
    code: 'req-ticket',
    name: '需求工单',
    roles: ['admin', 'finance', 'employee'],
  },
  {
    id: 'd3',
    code: 'onsite-ticket',
    name: '上门工单',
    roles: ['admin', 'engineer'],
  },
]);

const docsColumns: TableColumnsType<DocItem> = [
  { title: '序号', width: 70, key: 'index' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
  { title: '工单名称', dataIndex: 'name', key: 'name', width: 200 },
  {
    title: '适用角色',
    dataIndex: 'roles',
    key: 'roles',
    width: 360,
  },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
];

const modalOpen = ref(false);
const currentDoc = ref<DocItem | null>(null);
const activeTab = ref<DocStatus>('待派单');
const perms = ref<Record<DocStatus, FieldPermission[]>>(
  {} as Record<DocStatus, FieldPermission[]>,
);

function genDefaultPerms(): Record<DocStatus, FieldPermission[]> {
  const result: Record<DocStatus, FieldPermission[]> = {} as Record<
    DocStatus,
    FieldPermission[]
  >;
  (STATUS_TABS as DocStatus[]).forEach((status) => {
    result[status] = FIELD_NAMES.map((name) => ({
      field: name,
      canShow: true,
      canEdit: true,
    }));
  });
  return result;
}

function openConfigModal(doc: DocItem) {
  currentDoc.value = doc;
  perms.value = genDefaultPerms();
  activeTab.value = '待派单';
  modalOpen.value = true;
}

function saveModal() {
  message.success(`${currentDoc.value?.name} 字段权限配置已保存`);
  modalOpen.value = false;
}

const modalTitle = computed(() =>
  currentDoc.value ? `${currentDoc.value.name} · 字段权限配置` : '字段权限配置',
);

const permsColumns: TableColumnsType<FieldPermission> = [
  { title: '字段名', dataIndex: 'field', key: 'field', width: 200 },
  { title: '显示权限', key: 'canShow', width: 140, align: 'center' },
  { title: '编辑权限', key: 'canEdit', width: 140, align: 'center' },
];

const currentPerms = computed<FieldPermission[]>(
  () => perms.value[activeTab.value] ?? [],
);

const allViewChecked = computed<boolean>(
  () =>
    currentPerms.value.length > 0 && currentPerms.value.every((p) => p.canShow),
);

const allEditChecked = computed<boolean>(
  () =>
    currentPerms.value.length > 0 && currentPerms.value.every((p) => p.canEdit),
);

const someViewChecked = computed<boolean>(
  () => currentPerms.value.some((p) => p.canShow) && !allViewChecked.value,
);

const someEditChecked = computed<boolean>(
  () => currentPerms.value.some((p) => p.canEdit) && !allEditChecked.value,
);

function toggleAllView(e: { target: { checked: boolean } }) {
  const checked = e.target.checked;
  currentPerms.value.forEach((p) => {
    p.canShow = checked;
    if (!checked) p.canEdit = false;
  });
}

function toggleAllEdit(e: { target: { checked: boolean } }) {
  const checked = e.target.checked;
  currentPerms.value.forEach((p) => {
    if (p.canShow) p.canEdit = checked;
  });
}

function onViewChange(checked: boolean, record: FieldPermission) {
  record.canShow = checked;
  if (!checked) record.canEdit = false;
}

function onEditChange(checked: boolean, record: FieldPermission) {
  record.canEdit = checked;
}
</script>

<template>
  <section class="scenario-page">
    <header class="scenario-page__header">
      <div>
        <span>PERMISSION CONTROL</span>
        <h1>权限控制</h1>
        <p>按工单与状态维度配置字段显隐与编辑权限</p>
      </div>
      <div class="scenario-page__actions"></div>
    </header>

    <div class="scenario-page__body">
      <section class="list-section">
        <header class="list-section__header">
          <div>
            <Icon icon="lucide:folder-tree" />
            <span>
              <h3>工单清单</h3>
              <p>共 {{ docs.length }} 个工单类型</p>
            </span>
          </div>
        </header>
        <Table
          :columns="docsColumns"
          :data-source="docs"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          row-key="id"
          bordered
        >
          <template #[`bodyCell`]="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-else-if="column.key === 'roles'">
              <Select
                v-model:value="record.roles"
                mode="multiple"
                :options="ROLE_OPTIONS"
                placeholder="选择适用角色"
                class="w-full"
              />
            </template>
            <template v-else-if="column.key === 'action'">
              <Button
                type="primary"
                size="small"
                @click="openConfigModal(record)"
              >
                <Icon
                  icon="lucide:shield-check"
                  class="mr-1 inline-block size-3"
                />
                权限配置
              </Button>
            </template>
          </template>
        </Table>
      </section>
    </div>

    <Modal
      v-model:open="modalOpen"
      :title="modalTitle"
      width="820px"
      :footer="null"
    >
      <div class="mt-4">
        <Tabs v-model:active-key="activeTab">
          <TabPane v-for="status in STATUS_TABS" :key="status" :tab="status">
            <Table
              :columns="permsColumns"
              :data-source="perms[status]"
              :pagination="false"
              row-key="field"
              size="small"
              bordered
              class="mt-2"
            >
              <template #headerCell="{ column }">
                <template v-if="column.key === 'canShow'">
                  <Checkbox
                    :checked="allViewChecked"
                    :indeterminate="someViewChecked"
                    @change="toggleAllView"
                  >
                    显示权限
                  </Checkbox>
                </template>
                <template v-else-if="column.key === 'canEdit'">
                  <Checkbox
                    :checked="allEditChecked"
                    :indeterminate="someEditChecked"
                    @change="toggleAllEdit"
                  >
                    编辑权限
                  </Checkbox>
                </template>
              </template>
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'canShow'">
                  <Checkbox
                    :checked="record.canShow"
                    @change="
                      (e: { target: { checked: boolean } }) =>
                        onViewChange(e.target.checked, record)
                    "
                  />
                </template>
                <template v-else-if="column.key === 'canEdit'">
                  <Checkbox
                    :checked="record.canEdit"
                    :disabled="!record.canShow"
                    @change="
                      (e: { target: { checked: boolean } }) =>
                        onEditChange(e.target.checked, record)
                    "
                  />
                </template>
              </template>
            </Table>
          </TabPane>
        </Tabs>
      </div>
      <div class="flex justify-end gap-2 pt-4">
        <Button @click="modalOpen = false">取消</Button>
        <Button type="primary" @click="saveModal">保存配置</Button>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
.scenario-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  height: 100%;
  padding: 20px 24px 24px;
  overflow: auto;
}

.scenario-page__header {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 22px;
}

.scenario-page__header > div:first-child {
  display: grid;
  gap: 4px;
}

.scenario-page__header > div:first-child > span {
  font-size: 11px;
  font-weight: 700;
  color: #3d8b7d;
  letter-spacing: 1.4px;
}

.scenario-page__header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f322c;
}

.scenario-page__header p {
  margin: 0;
  font-size: 12.5px;
  color: #627a74;
}

.scenario-page__body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-height: 0;
}

.list-section {
  width: 100%;
  min-width: 0;
  padding: 18px;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 22px;
}

.list-section__header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 14px;
}

.list-section__header > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.list-section__header > div > :first-child {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: #087365;
  background: #d9eee8;
  border-radius: 11px;
}

.list-section__header > div > span {
  display: grid;
  gap: 2px;
}

.list-section__header h3 {
  margin: 0;
  font-size: 16px;
  color: #0f322c;
}

.list-section__header p {
  margin: 0;
  font-size: 12px;
  color: #738a84;
}
</style>
