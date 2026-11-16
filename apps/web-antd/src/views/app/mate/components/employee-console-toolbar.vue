<script setup lang="ts">
import type { MateEmployee } from "#/types/mate";

import { Icon } from "@iconify/vue";

import { pendingTodoCount } from "../next-demo/todo-state";

defineProps<{
  activeKey: string;
  employee: MateEmployee;
}>();

const emit = defineEmits<{
  select: [key: string];
}>();
</script>

<template>
  <section class="employee-console-toolbar">
    <div class="employee-console-toolbar__line">
      <h1>{{ employee.name }}</h1>
      <span
        v-if="employee.deprecated"
        class="employee-console-toolbar__deprecated"
      >
        作废
      </span>
      <div class="employee-console-toolbar__tabs">
        <button
          v-for="menu in employee.menus"
          :key="menu.key"
          class="employee-console-toolbar__tab"
          :class="{ 'is-active': activeKey === menu.key }"
          type="button"
          @click="emit('select', menu.key)"
        >
          <Icon :icon="menu.icon" />
          <span>{{ menu.title }}</span>
          <em
            v-if="employee.id === 'report-copilot' && menu.key === 'mentions'"
          >
            {{ pendingTodoCount }}
          </em>
          <em
            v-if="
              employee.id === 'review-copilot' && menu.key === 'approval-style'
            "
            class="is-learning"
          >
            3
          </em>
        </button>
      </div>
    </div>
    <p>
      {{ employee.description }}
    </p>
  </section>
</template>

<style scoped>
.employee-console-toolbar {
  display: grid;
  flex: none;
  gap: 7px;
  width: 100%;
  padding: 12px 18px;
  overflow: hidden;
  background: linear-gradient(90deg, #edf5f2 0%, #fff 50%, #f2f7f5 100%), #fff;
  border: 1px solid #d3e4de;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.employee-console-toolbar__line {
  display: flex;
  gap: 14px;
  align-items: center;
  min-width: 0;
}

.employee-console-toolbar h1 {
  flex: none;
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: #0f2925;
}

.employee-console-toolbar__deprecated {
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

.employee-console-toolbar p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #58736c;
}

.employee-console-toolbar__tabs {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  overflow-x: auto;
}

.employee-console-toolbar__tab {
  display: inline-flex;
  flex: none;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 650;
  color: #0f2925;
  cursor: pointer;
  background: #f4f8f6;
  border: 1px solid #d3e4de;
  border-radius: 999px;
  transition: 0.2s ease;
}

.employee-console-toolbar__tab:hover {
  background: #fff;
  transform: translateY(-1px);
}

.employee-console-toolbar__tab.is-active {
  color: #176b5c;
  background: #e5f3ee;
  border-color: #a9d2c6;
  box-shadow: 0 4px 12px rgb(44 111 94 / 10%);
}

.employee-console-toolbar__tab :deep(svg) {
  font-size: 14px;
}

.employee-console-toolbar__tab em {
  display: grid;
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  font-size: 12px;
  font-style: normal;
  line-height: 19px;
  color: #fff;
  text-align: center;
  background: #c96e28;
  border-radius: 999px;
}

.employee-console-toolbar__tab em.is-learning {
  background: #2775a5;
}

.employee-console-toolbar__tab.is-active em {
  color: #fff;
  background: #176b5c;
}

@media (max-width: 768px) {
  .employee-console-toolbar {
    padding: 12px 14px;
  }

  .employee-console-toolbar__line {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .employee-console-toolbar__tabs {
    width: 100%;
  }
}
</style>
