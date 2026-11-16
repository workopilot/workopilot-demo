<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue';

import type { OpsStaff, OpsStaffStatus } from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  areaOptions,
  mockOpsStaff,
  positionOptions,
  userOptions,
} from '#/api/mock-data-ticket';

const staffList = ref<OpsStaff[]>([...mockOpsStaff]);

/** 岗位列表（本地可变副本，支持新增/编辑/删除） */
const positions = ref<string[]>([...positionOptions]);

const keyword = ref('');
const activePosition = ref<'all' | string>('all');
const currentPage = ref(1);
const pageSize = ref(10);

/** 岗位分组列表（左侧用，自动派生人员数量） */
const positionGroups = computed(() => {
  const groups: Array<{ count: number; position: string }> = [
    { position: '全部', count: staffList.value.length },
  ];
  positions.value.forEach((position) => {
    const count = staffList.value.filter(
      (item) => item.position === position,
    ).length;
    groups.push({ position, count });
  });
  return groups;
});

/** 右侧展示的人员列表（按岗位 + 关键词过滤 + 分页） */
const filtered = computed(() =>
  staffList.value.filter((item) => {
    const matchPos =
      activePosition.value === 'all' || item.position === activePosition.value;
    const matchKw =
      !keyword.value ||
      (item.userId || '').toLowerCase().includes(keyword.value.toLowerCase()) ||
      item.position.includes(keyword.value) ||
      item.area.includes(keyword.value);
    return matchPos && matchKw;
  }),
);

const pagedStaff = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

function resetPage() {
  currentPage.value = 1;
}

const statusLabel: Record<OpsStaffStatus, string> = {
  on: '在岗',
  rest: '休息',
};

function statusColor(status: OpsStaffStatus) {
  switch (status) {
    case 'on': {
      return 'green';
    }
    case 'rest': {
      return 'default';
    }
    default: {
      return 'default';
    }
  }
}

function toggleStaff(staff: OpsStaff, value: boolean) {
  staff.enabled = value;
  message.success(value ? '人员已启用' : '人员已停用');
}

const columns: TableColumnType<OpsStaff>[] = [
  { title: '关联用户', dataIndex: 'userId', key: 'userId', width: 160 },
  { title: '岗位', dataIndex: 'position', key: 'position', width: 140 },
  { title: '服务区域', dataIndex: 'area', key: 'area', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  { title: '启用', key: 'enabled', width: 80 },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

/* ============ 人员新增/编辑 ============ */
const staffModalOpen = ref(false);
const isEdit = ref(false);
const editingId = ref<string>('');
const form = ref<Partial<OpsStaff>>({
  userId: '',
  position: '现场工程师',
  area: '',
  workload: 0,
  status: 'on',
  enabled: true,
});

function resetForm() {
  form.value = {
    userId: '',
    position: positions.value[0] || '现场工程师',
    area: areaOptions[0] || '',
    workload: 0,
    status: 'on',
    enabled: true,
  };
}

function openAddStaff() {
  isEdit.value = false;
  editingId.value = '';
  resetForm();
  staffModalOpen.value = true;
}

function openEditStaff(staff: OpsStaff) {
  isEdit.value = true;
  editingId.value = staff.id;
  form.value = { ...staff };
  staffModalOpen.value = true;
}

function saveStaff() {
  if (!form.value.userId || !form.value.position || !form.value.area) {
    message.warning('请完整填写用户、岗位与服务区域');
    return;
  }
  if (isEdit.value) {
    const target = staffList.value.find((item) => item.id === editingId.value);
    if (target) {
      Object.assign(target, {
        userId: form.value.userId || '',
        position: form.value.position,
        area: form.value.area,
        workload: form.value.workload ?? 0,
        status: form.value.status as OpsStaffStatus,
        enabled: form.value.enabled,
      });
      message.success('运维人员信息已更新');
    }
  } else {
    const created: OpsStaff = {
      id: `e-${Date.now()}`,
      userId: form.value.userId || '',
      position: form.value.position!,
      area: form.value.area || '-',
      workload: Number(form.value.workload) || 0,
      status: (form.value.status as OpsStaffStatus) || 'on',
      enabled: form.value.enabled ?? true,
    };
    staffList.value.unshift(created);
    resetPage();
    message.success('运维人员已添加');
  }
  staffModalOpen.value = false;
}

function deleteStaff(staff: OpsStaff) {
  const idx = staffList.value.findIndex((item) => item.id === staff.id);
  if (idx !== -1) {
    staffList.value.splice(idx, 1);
    if (pagedStaff.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    message.success(`运维人员「${staff.userId}」已删除`);
  }
}

/* ============ 岗位管理（新增/编辑/删除） ============ */
const positionModalOpen = ref(false);
const positionModalMode = ref<'add' | 'edit'>('add');
const editingPosition = ref<string>('');
const positionForm = ref<{ description: string; name: string }>({
  name: '',
  description: '',
});

function openAddPosition() {
  positionModalMode.value = 'add';
  editingPosition.value = '';
  positionForm.value = { name: '', description: '' };
  positionModalOpen.value = true;
}

function openEditPosition(position: string) {
  positionModalMode.value = 'edit';
  editingPosition.value = position;
  positionForm.value = { name: position, description: '' };
  positionModalOpen.value = true;
}

function savePosition() {
  const name = positionForm.value.name?.trim();
  if (!name) {
    message.warning('请填写岗位名称');
    return;
  }
  if (positionModalMode.value === 'add') {
    if (positions.value.includes(name)) {
      message.warning('岗位已存在');
      return;
    }
    positions.value.push(name);
    message.success(`岗位「${name}」已添加`);
  } else {
    if (editingPosition.value === name) {
      positionModalOpen.value = false;
      return;
    }
    if (positions.value.includes(name)) {
      message.warning('岗位已存在');
      return;
    }
    const oldName = editingPosition.value;
    const idx = positions.value.indexOf(oldName);
    if (idx !== -1) positions.value[idx] = name;
    // 同步更新人员岗位
    staffList.value.forEach((staff) => {
      if (staff.position === oldName) staff.position = name;
    });
    if (activePosition.value === oldName) activePosition.value = name;
    message.success(`岗位已更新为「${name}」`);
  }
  positionModalOpen.value = false;
}

function deletePosition(position: string) {
  if (position === '全部') return;
  const count = staffList.value.filter((s) => s.position === position).length;
  if (count > 0) {
    message.warning(`岗位下仍有 ${count} 名人员，无法删除`);
    return;
  }
  const idx = positions.value.indexOf(position);
  if (idx !== -1) {
    positions.value.splice(idx, 1);
    if (activePosition.value === position) {
      activePosition.value = 'all';
    }
    message.success(`岗位「${position}」已删除`);
  }
}
</script>

<template>
  <section class="ops-page">
    <header class="ops-header">
      <div class="ops-header__heading">
        <span class="ops-header__icon"><Icon icon="lucide:users" /></span>
        <div>
          <span class="ops-header__eyebrow">OPS STAFF MANAGEMENT</span>
          <h1>工单运维人员管理</h1>
          <p>
            维护运维人员台账、岗位、联系方式与告警渠道，作为派单与 SLA
            告警通知对象的基础数据。
          </p>
        </div>
      </div>
      <Button type="primary" class="ops-header__cta" @click="openAddStaff">
        <Icon icon="lucide:plus" />
        新增运维人员
      </Button>
    </header>

    <div class="ops-layout">
      <aside class="ops-sidebar">
        <div class="ops-sidebar__head">
          <div class="ops-sidebar__label">
            <Icon icon="lucide:layers" />
            <span>岗位</span>
          </div>
          <Button
            type="link"
            size="small"
            class="ops-sidebar__add"
            @click="openAddPosition"
          >
            <Icon icon="lucide:plus" class="size-3" />
            新增岗位
          </Button>
        </div>
        <nav class="ops-sidebar__nav">
          <button
            v-for="group in positionGroups"
            :key="group.position"
            type="button"
            :class="{
              'is-active':
                activePosition === group.position ||
                (group.position === '全部' && activePosition === 'all'),
            }"
            @click="
              activePosition =
                group.position === '全部' ? 'all' : group.position
            "
          >
            <span class="ops-sidebar__name">
              <Icon
                v-if="group.position === '全部'"
                icon="lucide:layout-grid"
              />
              <Icon v-else icon="lucide:tag" />
              {{ group.position }}
            </span>
            <span class="ops-sidebar__count">{{ group.count }}</span>
            <template v-if="group.position !== '全部'">
              <Icon
                class="ops-sidebar__edit"
                icon="lucide:pencil"
                @click.stop="openEditPosition(group.position)"
              />
              <Popconfirm
                title="确认删除该岗位吗？"
                ok-text="删除"
                cancel-text="取消"
                @confirm="deletePosition(group.position)"
              >
                <Icon
                  class="ops-sidebar__del"
                  icon="lucide:trash-2"
                  @click.stop
                />
              </Popconfirm>
            </template>
          </button>
        </nav>
      </aside>

      <section class="ops-main">
        <div class="ops-toolbar">
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="搜索工号 / 姓名 / 团队 / 电话"
            class="ops-toolbar__search"
            @change="resetPage"
          >
            <template #prefix><Icon icon="lucide:search" /></template>
          </Input>
          <div class="ops-toolbar__meta">
            <span>
              当前岗位：
              <strong>
                {{ activePosition === 'all' ? '全部' : activePosition }}
              </strong>
            </span>
            <span class="ops-toolbar__divider">|</span>
            <span>
              共
              <strong>{{ filtered.length }}</strong>
              人
            </span>
          </div>
        </div>

        <div class="ops-table">
          <Table
            :columns="columns"
            :data-source="pagedStaff"
            row-key="id"
            :pagination="false"
            size="middle"
            class="ops-table__inner"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'position'">
                <Tag color="geekblue">{{ record.position }}</Tag>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor((record as OpsStaff).status)">
                  {{ statusLabel[(record as OpsStaff).status] }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'enabled'">
                <Switch
                  :checked="record.enabled"
                  size="small"
                  @change="
                    (v: unknown) => toggleStaff(record as OpsStaff, Boolean(v))
                  "
                />
              </template>
              <template v-else-if="column.key === 'action'">
                <div class="ops-table__actions">
                  <Button
                    type="link"
                    size="small"
                    @click="openEditStaff(record as OpsStaff)"
                  >
                    <Icon icon="lucide:pencil" class="size-3" />
                    编辑
                  </Button>
                  <Popconfirm
                    title="确认删除该运维人员吗？"
                    ok-text="删除"
                    cancel-text="取消"
                    @confirm="deleteStaff(record as OpsStaff)"
                  >
                    <Button type="link" size="small" danger>
                      <Icon icon="lucide:trash-2" class="size-3" />
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </template>
            </template>
          </Table>

          <p v-if="filtered.length === 0" class="ops-empty">
            未找到匹配的运维人员。
          </p>

          <div v-else class="ops-table__pager">
            <Pagination
              v-model:current="currentPage"
              v-model:page-size="pageSize"
              :total="filtered.length"
              :page-size-options="['10', '20', '50']"
              :show-size-changer="true"
              size="small"
              :show-total="(total: number) => `共 ${total} 条`"
            />
          </div>
        </div>
      </section>
    </div>

    <!-- 人员新增/编辑弹窗 -->
    <Modal
      v-model:open="staffModalOpen"
      :title="isEdit ? '编辑运维人员' : '新增运维人员'"
      :width="640"
      ok-text="保存"
      cancel-text="取消"
      @ok="saveStaff"
    >
      <Form layout="vertical" class="device-form">
        <div class="device-form__row">
          <Form.Item label="岗位 *">
            <Select
              v-model:value="form.position"
              :options="positions.map((p) => ({ label: p, value: p }))"
            />
          </Form.Item>
          <Form.Item label="用户">
            <Select
              v-model:value="form.userId"
              :options="userOptions"
              allow-clear
              placeholder="请选择关联用户"
            />
          </Form.Item>
        </div>
        <div class="device-form__row">
          <Form.Item label="服务区域">
            <Select
              v-model:value="form.area"
              :options="areaOptions.map((a) => ({ label: a, value: a }))"
              allow-clear
              placeholder="请选择服务区域"
            />
          </Form.Item>
          <Form.Item label="在岗状态">
            <Select v-model:value="form.status">
              <Select.Option value="on">在岗</Select.Option>
              <Select.Option value="rest">休息</Select.Option>
            </Select>
          </Form.Item>
        </div>
        <Form.Item label="启动状态">
          <Switch v-model:checked="form.enabled" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 岗位新增/编辑弹窗 -->
    <Modal
      v-model:open="positionModalOpen"
      :title="positionModalMode === 'add' ? '新增岗位' : '编辑岗位'"
      ok-text="保存"
      cancel-text="取消"
      @ok="savePosition"
    >
      <Form layout="vertical">
        <Form.Item label="岗位名称 *">
          <Input
            v-model:value="positionForm.name"
            placeholder="例如：现场工程师"
          />
        </Form.Item>
      </Form>
    </Modal>
  </section>
</template>

<style scoped>
.ops-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 24px;
  overflow: hidden;
}

.ops-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 26px;
  margin-bottom: 16px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 18px;
  box-shadow: 0 15px 36px rgb(7 71 60 / 18%);
}

.ops-header__heading {
  display: flex;
  gap: 14px;
  align-items: center;
}

.ops-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  color: #c9fff2;
  background: rgb(124 238 208 / 18%);
  border-radius: 14px;
}

.ops-header__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.ops-header h1 {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 800;
}

.ops-header p {
  margin: 0;
  font-size: 12px;
  color: rgb(255 255 255 / 72%);
}

.ops-header__cta {
  font-weight: 700;
  color: #073a33;
  background: #32c8a5;
  border-color: #3bd3ae;
}

.ops-layout {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
}

.ops-sidebar {
  display: flex;
  flex-direction: column;
  width: 260px;
  min-width: 260px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 16px;
}

.ops-sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 10px;
  border-bottom: 1px solid #e2ebe8;
}

.ops-sidebar__label {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  color: #315e55;
  letter-spacing: 0.04em;
}

.ops-sidebar__add {
  padding: 0;
  font-size: 11px;
  color: #0b6e65;
}

.ops-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  overflow-y: auto;
}

.ops-sidebar__nav button {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  color: #536b65;
  cursor: pointer;
  background: #f7faf9;
  border: 0;
  border-radius: 12px;
  transition: all 0.15s ease;
}

.ops-sidebar__nav button:hover {
  background: #eef5f2;
}

.ops-sidebar__nav button.is-active {
  font-weight: 700;
  color: #087365;
  background: #d9eee8;
  box-shadow: inset 0 0 0 1px #9dcfc2;
}

.ops-sidebar__name {
  display: inline-flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.ops-sidebar__count {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #087365;
  background: #fff;
  border-radius: 999px;
}

.ops-sidebar__nav button.is-active .ops-sidebar__count {
  color: #fff;
  background: #087365;
}

.ops-sidebar__edit,
.ops-sidebar__del {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  padding: 2px;
  color: #95a7a1;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.ops-sidebar__edit:hover {
  color: #0b6e65;
  background: rgb(11 110 101 / 10%);
}

.ops-sidebar__del:hover {
  color: #d4541f;
  background: rgb(212 84 31 / 10%);
}

.ops-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.ops-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.ops-toolbar__search {
  width: 320px;
}

.ops-toolbar__meta {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #5a756d;
}

.ops-toolbar__meta strong {
  margin: 0 2px;
  font-size: 14px;
  font-weight: 800;
  color: #0b6e65;
}

.ops-toolbar__divider {
  color: #c5d6d0;
}

.ops-table {
  flex: 1;
  padding: 12px 14px;
  overflow: auto;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 16px;
}

.ops-table__inner :deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  font-weight: 600;
  color: #315e55;
  background: #f6fbf9;
  border-bottom: 1px solid #e4edea;
}

.ops-table__inner :deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  color: #536b65;
  border-bottom: 1px solid #eef5f2;
}

.ops-table__inner :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fdfa;
}

.ops-table__inner :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.ops-table__workload {
  font-size: 14px;
  font-weight: 800;
  color: #0b6e65;
}

.ops-table__unit {
  font-size: 11px;
  color: #95a7a1;
}

.ops-table__actions {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.ops-table__actions :deep(.ant-btn-link) {
  padding: 0 4px;
}

.ops-table__pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 6px 4px;
  border-top: 1px solid #eef5f2;
}

.ops-empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.device-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.device-form__divider {
  height: 1px;
  margin: 8px 0 16px;
  background: #eef5f2;
}

@media (max-width: 1100px) {
  .ops-layout {
    flex-direction: column;
  }

  .ops-sidebar {
    width: 100%;
    min-width: 0;
  }

  .ops-sidebar__nav {
    flex-flow: row wrap;
  }

  .ops-sidebar__nav button {
    flex: 1;
    min-width: 140px;
  }

  .ops-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ops-toolbar__search {
    width: 100%;
  }

  .device-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
