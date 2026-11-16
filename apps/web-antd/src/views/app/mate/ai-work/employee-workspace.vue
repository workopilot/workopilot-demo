<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

import { message } from "ant-design-vue";

import { mockMateEmployees } from "#/api/mock-data-mate";

import EmployeeConsoleToolbar from "../components/employee-console-toolbar.vue";

const route = useRoute();
const router = useRouter();

const employeeId = computed(() => String(route.params.employeeId || ""));
const employee = computed(() =>
  mockMateEmployees.find((item) => item.id === employeeId.value),
);
const activeMenuKey = computed(() => {
  if (
    employeeId.value === "new-report-assistant" &&
    route.path.endsWith("/report-history")
  )
    return "reports";
  if (route.path.includes("/project/")) {
    return employeeId.value === "pmo-assistant" ? "portfolio" : "projects";
  }

  return (
    employee.value?.menus.find((item) => route.path.startsWith(item.path))
      ?.key || "chat"
  );
});

function selectMenu(key: string) {
  const menu = employee.value?.menus.find((item) => item.key === key);
  if (menu) void router.push(menu.path);
}

watchEffect(() => {
  if (!employee.value) {
    message.warning("未找到对应数字员工，已切换到项目助理");
    void router.replace("/app/mate/employee/project-assistant/project-chat");
  }
});
</script>

<template>
  <div v-if="employee" class="ai-work-employee">
    <EmployeeConsoleToolbar
      :employee="employee"
      :active-key="activeMenuKey"
      @select="selectMenu"
    />
    <div class="ai-work-employee__content">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.ai-work-employee {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.ai-work-employee__content {
  display: flex;
  flex: 1;
  min-height: 0;
}
</style>
