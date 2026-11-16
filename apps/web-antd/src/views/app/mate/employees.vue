<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { MateEmployee, MateEmployeeStatus } from '#/types/mate';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Empty, Input, Segmented } from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';

const router = useRouter();
const keyword = ref('');
const viewMode = ref<'card' | 'list'>('card');
const employees = ref(mockMateEmployees);
const failedAvatars = ref<string[]>([]);

const filteredEmployees = computed(() =>
  employees.value.filter((item) =>
    `${item.name}${item.role}${item.description}`
      .toLowerCase()
      .includes(keyword.value.trim().toLowerCase()),
  ),
);
const onlineCount = computed(
  () => employees.value.filter((item) => item.status === 'online').length,
);

const statusLabels: Record<MateEmployeeStatus, string> = {
  busy: '忙碌',
  offline: '离线',
  online: '在线',
};

function openEmployee(id: string) {
  void router.push(`/app/mate/employee/${id}`);
}

function togglePinned(id: string) {
  const employee = employees.value.find((item) => item.id === id);
  if (employee) employee.pinned = !employee.pinned;
}

function roleClass(employee: MateEmployee) {
  if (employee.role.includes('数据')) return 'is-data';
  if (employee.role.includes('法务')) return 'is-legal';
  if (employee.role.includes('运营')) return 'is-operation';
  if (employee.role.includes('会议')) return 'is-meeting';
  return 'is-default';
}

function markAvatarFailed(id: string) {
  if (!failedAvatars.value.includes(id)) failedAvatars.value.push(id);
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <div class="employee-entry">
    <section class="employee-entry__panel">
      <div class="employee-entry__panel-head">
        <div>
          <span class="employee-entry__eyebrow">DIGITAL EMPLOYEES</span>
          <h1>数字员工</h1>
          <p>选择一个熟悉业务的员工，开始协同工作。</p>
        </div>
        <div class="employee-entry__tools">
          <div class="employee-entry__summary">
            <span>员工总数 {{ employees.length }}</span>
            <span>当前在线 {{ onlineCount }}</span>
          </div>
          <div class="employee-entry__actions">
            <Input
              v-model:value="keyword"
              allow-clear
              placeholder="搜索员工"
              class="employee-entry__search"
            >
              <template #prefix><Icon icon="lucide:search" /></template>
            </Input>
            <Segmented
              v-model:value="viewMode"
              :options="[
                { label: '卡片', value: 'card' },
                { label: '列表', value: 'list' },
              ]"
            />
          </div>
        </div>
      </div>

      <section
        v-if="filteredEmployees.length > 0"
        class="employee-grid"
        :class="{ 'is-list': viewMode === 'list' }"
      >
        <article
          v-for="employee in filteredEmployees"
          :key="employee.id"
          class="employee-card"
          :class="{
            'is-list-card': viewMode === 'list',
            'is-deprecated': employee.deprecated,
          }"
          role="button"
          tabindex="0"
          @click="openEmployee(employee.id)"
          @keydown.enter="openEmployee(employee.id)"
          @keydown.space.prevent="openEmployee(employee.id)"
        >
          <div class="employee-card__visual">
            <img
              v-if="!failedAvatars.includes(employee.id)"
              :src="employee.avatar"
              :alt="`${employee.name} 员工头像`"
              class="employee-card__avatar"
              @error="markAvatarFailed(employee.id)"
            />
            <div
              v-else
              class="employee-card__fallback"
              :style="{ background: employee.accent }"
            >
              {{ employee.name.slice(0, 1) }}
            </div>
            <span
              v-if="employee.unread"
              class="employee-card__unread-dot"
              :title="`${employee.unread} 条未读`"
            ></span>
            <div class="employee-card__status" :class="`is-${employee.status}`">
              <span class="dot"></span>
              {{ statusLabels[employee.status] }}
            </div>
            <button
              class="employee-card__pin"
              :class="{ 'is-pinned': employee.pinned }"
              type="button"
              :title="employee.pinned ? '取消收藏' : '收藏员工'"
              @click.stop="togglePinned(employee.id)"
            >
              <Icon :icon="employee.pinned ? 'lucide:star' : 'lucide:star'" />
            </button>
          </div>

          <div class="employee-card__body">
            <div class="employee-card__head">
              <h2>{{ employee.name }}</h2>
              <span v-if="employee.deprecated" class="employee-card__deprecated">
                作废
              </span>
              <span class="employee-card__role" :class="roleClass(employee)">
                {{ employee.role }}
              </span>
            </div>
            <p>{{ employee.description }}</p>
            <div class="employee-card__footer">
              <span>
                <Icon icon="lucide:clock-3" />
                {{ employee.lastActive }}
              </span>
              <strong>
                进入协同会话
                <Icon icon="lucide:arrow-up-right" />
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section v-else class="employee-entry__empty">
        <Empty description="没有找到匹配的数字员工" />
      </section>
    </section>
  </div>
</template>

<style scoped>
.employee-entry {
  max-width: 1420px;
  margin: 0 auto;
}

.employee-entry__panel {
  padding: 22px;
  background: #fff;
  border: 1px solid #d7e5df;
  border-radius: 30px;
  box-shadow: 0 24px 64px rgb(18 57 45 / 8%);
}

.employee-entry__panel-head {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid #d7e5df;
}

.employee-entry__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #0c9177;
  letter-spacing: 0.14em;
}

.employee-entry__panel-head h1 {
  margin: 7px 0 5px;
  font-size: 22px;
  font-weight: 750;
  color: #0f2925;
}

.employee-entry__panel-head p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #58736c;
}

.employee-entry__tools {
  display: grid;
  flex-shrink: 0;
  gap: 11px;
  justify-items: end;
}

.employee-entry__summary,
.employee-entry__actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.employee-entry__summary span {
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 650;
  color: #0f2925;
  background: #edf5f2;
  border: 1px solid #d7e5df;
  border-radius: 999px;
}

.employee-entry__search {
  width: 220px;
}

.employee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(244px, 1fr));
  gap: 18px;
}

.employee-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  outline: none;
  background: #fff;
  border: 1px solid #d7e5df;
  border-radius: 28px;
  box-shadow: 0 18px 48px rgb(18 57 45 / 8%);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;
}

.employee-card:hover,
.employee-card:focus-visible {
  border-color: rgb(13 92 75 / 28%);
  box-shadow: 0 24px 56px rgb(18 57 45 / 13%);
  transform: translateY(-4px);
}

.employee-card.is-deprecated {
  background: #f7f6f4;
  border-color: #ded7d1;
}

.employee-card.is-deprecated .employee-card__avatar {
  filter: saturate(0.45);
}

.employee-card:focus-visible {
  box-shadow:
    0 0 0 3px rgb(16 185 129 / 20%),
    0 24px 56px rgb(18 57 45 / 13%);
}

.employee-card__visual {
  position: relative;
  flex: none;
  height: 220px;
  overflow: hidden;
  background: linear-gradient(180deg, #eef8f4, #dceae5);
}

.employee-card__avatar,
.employee-card__fallback {
  width: 100%;
  height: 100%;
}

.employee-card__avatar {
  display: block;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.employee-card:hover .employee-card__avatar {
  transform: scale(1.025);
}

.employee-card__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 64px;
  font-weight: 800;
  color: #fff;
}

.employee-card__unread-dot {
  position: absolute;
  top: 14px;
  left: 14px;
  width: 11px;
  height: 11px;
  background: #ef4444;
  border: 2px solid rgb(255 255 255 / 95%);
  border-radius: 50%;
  box-shadow: 0 8px 18px rgb(239 68 68 / 28%);
}

.employee-card__status {
  position: absolute;
  top: 14px;
  right: 14px;
  display: inline-flex;
  gap: 7px;
  align-items: center;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 650;
  color: #0d7a4f;
  background: rgb(255 255 255 / 92%);
  border-radius: 999px;
  box-shadow: 0 12px 28px rgb(18 57 45 / 10%);
}

.employee-card__status .dot {
  width: 8px;
  height: 8px;
  background: currentcolor;
  border-radius: 50%;
}

.employee-card__status.is-busy {
  color: #b87314;
}

.employee-card__status.is-offline {
  color: #7c8c85;
}

.employee-card__pin {
  position: absolute;
  right: 14px;
  bottom: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: #8ba39d;
  cursor: pointer;
  background: rgb(255 255 255 / 90%);
  border: 0;
  border-radius: 10px;
  box-shadow: 0 8px 20px rgb(18 57 45 / 12%);
}

.employee-card__pin.is-pinned {
  color: #e7a51e;
  background: #fff4dc;
}

.employee-card__body {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.employee-card__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.employee-card__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 750;
  color: #0f2925;
}

.employee-card__deprecated {
  flex: none;
  padding: 2px 7px;
  font-size: 10px;
  font-weight: 750;
  line-height: 1.4;
  color: #786154;
  background: #eee7e1;
  border: 1px solid #d9c9bd;
  border-radius: 999px;
}

.employee-card__role {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #65766f;
  background: #f3f5f4;
  border: 1px solid #dce4e0;
  border-radius: 999px;
}

.employee-card__role.is-data {
  color: #6a4fbb;
  background: #f4f0ff;
  border-color: #e0d2ff;
}

.employee-card__role.is-legal {
  color: #c54c42;
  background: #fff1f0;
  border-color: #ffd4cf;
}

.employee-card__role.is-operation {
  color: #2c69c9;
  background: #eff6ff;
  border-color: #c8ddff;
}

.employee-card__role.is-meeting {
  color: #b87314;
  background: #fff8ea;
  border-color: #ffe0a8;
}

.employee-card__body p {
  min-height: 46px;
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: #58736c;
}

.employee-card__footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  font-size: 11px;
  color: #78918a;
  border-top: 1px solid #d7e5df;
}

.employee-card__footer span,
.employee-card__footer strong {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.employee-card__footer strong {
  font-size: 13px;
  color: #0d5c4b;
}

.employee-entry__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.employee-grid.is-list {
  grid-template-columns: 1fr;
  gap: 10px;
}

.employee-card.is-list-card {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  min-height: 88px;
  border-radius: 18px;
}

.employee-card.is-list-card .employee-card__visual {
  place-self: center center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
}

.employee-card.is-list-card .employee-card__status {
  top: auto;
  right: -4px;
  bottom: -4px;
  width: 13px;
  height: 13px;
  padding: 0;
  font-size: 0;
  border: 2px solid #fff;
}

.employee-card.is-list-card .employee-card__status .dot {
  width: 100%;
  height: 100%;
}

.employee-card.is-list-card .employee-card__unread-dot {
  top: -3px;
  left: -3px;
}

.employee-card.is-list-card .employee-card__pin {
  display: none;
}

.employee-card.is-list-card .employee-card__body {
  grid-template-columns: 180px minmax(220px, 1fr) 250px;
  gap: 20px;
  align-items: center;
  padding: 14px 18px 14px 0;
}

.employee-card.is-list-card .employee-card__body p {
  min-height: 0;
}

.employee-card.is-list-card .employee-card__footer {
  padding: 0;
  border: 0;
}

@media (max-width: 1050px) {
  .employee-entry__panel-head {
    flex-direction: column;
  }

  .employee-entry__tools {
    justify-items: start;
    width: 100%;
  }

  .employee-card.is-list-card .employee-card__body {
    grid-template-columns: 150px minmax(180px, 1fr);
  }

  .employee-card.is-list-card .employee-card__footer {
    display: none;
  }
}

@media (max-width: 680px) {
  .employee-entry__panel {
    padding: 16px;
    border-radius: 22px;
  }

  .employee-entry__actions {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .employee-entry__search {
    width: 100%;
  }

  .employee-grid {
    grid-template-columns: 1fr;
  }

  .employee-card.is-list-card {
    grid-template-columns: 74px minmax(0, 1fr);
  }

  .employee-card.is-list-card .employee-card__body {
    display: block;
    padding-right: 12px;
  }

  .employee-card.is-list-card .employee-card__body p {
    margin-top: 5px;
  }
}
</style>
