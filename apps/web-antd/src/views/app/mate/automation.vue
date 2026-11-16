<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
/* eslint-disable unicorn/no-await-expression-member */
import type { MateAutomationLog, MateAutomationTask } from '#/types/mate';

import { computed, onMounted, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import {
  deleteMateAutomationTaskApi,
  getMateAutomationLogsApi,
  getMateAutomationTasksApi,
  runMateAutomationTaskApi,
  saveMateAutomationTaskApi,
} from '#/api/mate';
import { mockMateEmployees } from '#/api/mock-data-mate';

const tasks = ref<MateAutomationTask[]>([]);
const logs = ref<MateAutomationLog[]>([]);
const keyword = ref('');
const status = ref('all');
const employeeId = ref('all');
const drawerOpen = ref(false);
const logModalOpen = ref(false);
const editingId = ref<string>();
const form = reactive<Omit<MateAutomationTask, 'id'>>({
  title: '',
  description: '',
  schedule: '每天 09:00',
  employeeId: 'weekly-assistant',
  status: 'enabled',
  lastRun: '尚未执行',
  nextRun: '明天 09:00',
  successRate: 100,
});
const filteredTasks = computed(() =>
  tasks.value.filter(
    (task) =>
      `${task.title}${task.description}`.includes(keyword.value.trim()) &&
      (status.value === 'all' || task.status === status.value) &&
      (employeeId.value === 'all' || task.employeeId === employeeId.value),
  ),
);
const employeeName = (id: string) =>
  mockMateEmployees.find((item) => item.id === id)?.name || '未分配';

async function load() {
  tasks.value = (await getMateAutomationTasksApi()).data;
  logs.value = (await getMateAutomationLogsApi()).data;
}
function resetForm() {
  Object.assign(form, {
    title: '',
    description: '',
    schedule: '每天 09:00',
    employeeId: 'weekly-assistant',
    status: 'enabled',
    lastRun: '尚未执行',
    nextRun: '明天 09:00',
    successRate: 100,
  });
}
function openCreate() {
  editingId.value = undefined;
  resetForm();
  drawerOpen.value = true;
}
function openEdit(task: MateAutomationTask) {
  editingId.value = task.id;
  Object.assign(form, task);
  drawerOpen.value = true;
}
async function save() {
  if (!form.title.trim()) {
    message.warning('请填写任务名称');
    return;
  }
  const saved = (
    await saveMateAutomationTaskApi({ ...form, id: editingId.value })
  ).data;
  if (saved) {
    const index = tasks.value.findIndex((item) => item.id === saved.id);
    if (index === -1) {
      tasks.value.unshift(saved);
    } else {
      tasks.value[index] = saved;
    }
  }
  drawerOpen.value = false;
  message.success(editingId.value ? '任务已更新' : '任务已创建');
}
async function remove(task: MateAutomationTask) {
  await deleteMateAutomationTaskApi(task.id);
  tasks.value = tasks.value.filter((item) => item.id !== task.id);
  message.success('任务已删除');
}
async function run(task: MateAutomationTask) {
  const log = (await runMateAutomationTaskApi(task)).data;
  logs.value.unshift(log);
  const item = tasks.value.find((taskItem) => taskItem.id === task.id);
  if (item) {
    item.lastRun = '刚刚';
    item.status = 'running';
  }
  message.success('已提交模拟执行');
}
async function toggle(task: MateAutomationTask, enabled: boolean) {
  task.status = enabled ? 'enabled' : 'disabled';
  await saveMateAutomationTaskApi(task);
}
async function openLogs() {
  logs.value = (await getMateAutomationLogsApi()).data;
  logModalOpen.value = true;
}

onMounted(load);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <div class="mate-page automation-page">
    <div class="mate-page-head">
      <div>
        <span class="mate-kicker">AUTOMATION CENTER</span>
        <h1>自动化中心</h1>
        <p>把重复的检查、整理和提醒交给数字员工按计划完成。</p>
      </div>
      <div class="automation-head-actions">
        <Button @click="openLogs">
          <Icon icon="lucide:scroll-text" />
          执行日志
        </Button>
        <Button type="primary" @click="openCreate">
          <Icon icon="lucide:plus" />
          新建自动化任务
        </Button>
      </div>
    </div>
    <div class="automation-toolbar">
      <Input v-model:value="keyword" allow-clear placeholder="搜索任务">
        <template #prefix><Icon icon="lucide:search" /></template>
      </Input>
      <Select
        v-model:value="status"
        :options="[
          { label: '全部状态', value: 'all' },
          { label: '运行中', value: 'enabled' },
          { label: '执行中', value: 'running' },
          { label: '已停用', value: 'disabled' },
        ]"
      />
      <Select
        v-model:value="employeeId"
        :options="[
          { label: '全部员工', value: 'all' },
          ...mockMateEmployees.map((item) => ({
            label: item.name,
            value: item.id,
          })),
        ]"
      />
    </div>
    <div v-if="filteredTasks.length > 0" class="task-grid">
      <article v-for="task in filteredTasks" :key="task.id" class="task-card">
        <div class="task-card__head">
          <div>
            <span class="task-card__status" :class="`is-${task.status}`"></span>
            <Tag
              :color="
                task.status === 'disabled'
                  ? 'default'
                  : task.status === 'running'
                    ? 'gold'
                    : 'green'
              "
            >
              {{
                task.status === 'running'
                  ? '执行中'
                  : task.status === 'enabled'
                    ? '运行中'
                    : '已停用'
              }}
            </Tag>
          </div>
          <div class="task-card__menu">
            <Button type="text" size="small" @click="openEdit(task)">
              <Icon icon="lucide:pen-line" />
            </Button>
            <Button type="text" danger size="small" @click="remove(task)">
              <Icon icon="lucide:trash-2" />
            </Button>
          </div>
        </div>
        <h2>{{ task.title }}</h2>
        <p>{{ task.description }}</p>
        <div class="task-card__meta">
          <span>
            <Icon icon="lucide:calendar-clock" />
            {{ task.schedule }}
          </span>
          <span>
            <Icon icon="lucide:bot" />
            {{ employeeName(task.employeeId) }}
          </span>
        </div>
        <div class="task-card__footer">
          <span>
            最近执行
            <b>{{ task.lastRun }}</b>
          </span>
          <span>
            成功率
            <b>{{ task.successRate }}%</b>
          </span>
          <Switch
            :checked="task.status !== 'disabled'"
            size="small"
            @change="(checked) => toggle(task, Boolean(checked))"
          />
          <Button
            size="small"
            type="primary"
            :disabled="task.status === 'running'"
            @click="run(task)"
          >
            <Icon icon="lucide:play" />
            立即执行
          </Button>
        </div>
      </article>
    </div>
    <Empty v-else description="没有匹配的自动化任务" />

    <Drawer
      v-model:open="drawerOpen"
      :title="editingId ? '编辑自动化任务' : '新建自动化任务'"
      :width="420"
      destroy-on-close
    >
      <div class="task-form">
        <label>
          任务名称
          <Input v-model:value="form.title" placeholder="例如：每日运营简报" />
        </label>
        <label>
          任务说明
          <Input.TextArea
            v-model:value="form.description"
            :rows="4"
            placeholder="描述数字员工需要自动完成的工作"
          />
        </label>
        <label>
          执行周期
          <Select
            v-model:value="form.schedule"
            :options="[
              { label: '每天 09:00', value: '每天 09:00' },
              { label: '工作日 08:30', value: '工作日 08:30' },
              { label: '每周一 10:00', value: '每周一 10:00' },
              { label: '每天 17:30', value: '每天 17:30' },
            ]"
          />
        </label>
        <label>
          关联执行员工
          <Select
            v-model:value="form.employeeId"
            :options="
              mockMateEmployees.map((item) => ({
                label: `${item.name} · ${item.role}`,
                value: item.id,
              }))
            "
          />
        </label>
        <label class="task-form__switch">
          创建后启用
          <Switch
            v-model:checked="form.status"
            checked-value="enabled"
            un-checked-value="disabled"
          />
        </label>
        <div class="task-form__footer">
          <Button @click="drawerOpen = false">取消</Button>
          <Button type="primary" @click="save">保存任务</Button>
        </div>
      </div>
    </Drawer>
    <Modal
      v-model:open="logModalOpen"
      title="自动化执行日志"
      :footer="null"
      width="650px"
    >
      <div class="log-list">
        <div v-for="log in logs" :key="log.id" class="log-row">
          <span class="log-row__icon" :class="`is-${log.status}`">
            <Icon
              :icon="log.status === 'success' ? 'lucide:check' : 'lucide:x'"
            />
          </span>
          <div>
            <b>{{ log.taskTitle }}</b>
            <p>{{ log.summary }}</p>
            <small>{{ log.startedAt }} · 用时 {{ log.duration }}</small>
          </div>
          <Tag :color="log.status === 'success' ? 'green' : 'red'">
            {{ log.status === 'success' ? '成功' : '失败' }}
          </Tag>
        </div>
        <Empty v-if="logs.length === 0" description="暂无执行日志" />
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.mate-page {
  max-width: 1420px;
  margin: 0 auto;
}

.mate-page-head {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20px;
}

.mate-kicker {
  font-size: 10px;
  font-weight: 800;
  color: #0c9177;
  letter-spacing: 0.14em;
}

.mate-page-head h1 {
  margin: 8px 0 4px;
  font-size: 27px;
  color: #143a30;
}

.mate-page-head p {
  margin: 0;
  font-size: 12px;
  color: #748e86;
}

.automation-head-actions {
  display: flex;
  gap: 9px;
}

.automation-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.automation-toolbar > .ant-input-affix-wrapper {
  width: 290px;
}

.automation-toolbar > .ant-select {
  width: 150px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
}

.task-card {
  padding: 18px;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 15px;
  box-shadow: 0 7px 20px rgb(14 78 64 / 5%);
}

.task-card:hover {
  border-color: #9acabe;
}

.task-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.task-card__head > div:first-child {
  display: flex;
  gap: 7px;
  align-items: center;
}

.task-card__status {
  width: 8px;
  height: 8px;
  background: #acbdb7;
  border-radius: 50%;
}

.task-card__status.is-enabled {
  background: #20b486;
  box-shadow: 0 0 0 4px #def4eb;
}

.task-card__status.is-running {
  background: #f0a62d;
  box-shadow: 0 0 0 4px #fff0d3;
}

.task-card :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.task-card h2 {
  margin: 14px 0 7px;
  font-size: 17px;
  color: #214a3e;
}

.task-card > p {
  min-height: 39px;
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: #80968e;
}

.task-card__meta {
  display: flex;
  gap: 15px;
  padding-bottom: 13px;
  margin-top: 16px;
  font-size: 11px;
  color: #779188;
  border-bottom: 1px solid #edf3f0;
}

.task-card__meta span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.task-card__meta :deep(svg) {
  color: #0a8a72;
}

.task-card__footer {
  display: flex;
  gap: 11px;
  align-items: center;
  padding-top: 13px;
  font-size: 10px;
  color: #8aa099;
}

.task-card__footer > span {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.task-card__footer b {
  font-size: 11px;
  color: #45675d;
}

.task-card__footer :deep(.ant-switch) {
  margin-left: auto;
}

.task-card__footer :deep(.ant-btn) {
  font-size: 11px;
}

.task-form {
  display: flex;
  flex-direction: column;
  gap: 17px;
}

.task-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
  font-weight: 700;
  color: #4d6b62;
}

.task-form__switch {
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
}

.task-form__footer {
  display: flex;
  gap: 9px;
  justify-content: flex-end;
  margin-top: 8px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.log-row {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  padding: 11px;
  border: 1px solid #edf2ef;
  border-radius: 10px;
}

.log-row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #0b8b72;
  background: #def4eb;
  border-radius: 9px;
}

.log-row__icon.is-failed {
  color: #d95a60;
  background: #ffebeb;
}

.log-row > div {
  flex: 1;
  min-width: 0;
}

.log-row b {
  font-size: 12px;
  color: #24483e;
}

.log-row p {
  margin: 4px 0;
  font-size: 11px;
  color: #728d84;
}

.log-row small {
  font-size: 10px;
  color: #9aaba5;
}

.log-row :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

@media (max-width: 800px) {
  .mate-page-head {
    display: block;
  }

  .automation-head-actions {
    margin-top: 15px;
  }

  .automation-toolbar {
    flex-wrap: wrap;
  }

  .automation-toolbar > .ant-input-affix-wrapper {
    width: 100%;
  }

  .task-grid {
    grid-template-columns: 1fr;
  }
}
</style>
