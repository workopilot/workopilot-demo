<script setup lang="ts">
import { ConfigProvider, theme } from 'ant-design-vue';
import { useRoute, useRouter } from 'vue-router';
import { demoReports, reportSchemes } from '#/api/mock-new-reports';
import ReportHistory from './components/ReportHistory.vue';
const route = useRoute();
const router = useRouter();
function back() {
  void router.push({
    name: 'NewReportAssistant',
    params: {
      employeeId: String(route.params.employeeId || 'new-report-assistant'),
    },
  });
}
</script>
<template>
  <ConfigProvider
    :theme="{
      inherit: false,
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#247d69',
        colorBgContainer: '#fff',
        colorBgElevated: '#fff',
        colorText: '#213d35',
        colorTextSecondary: '#5f7269',
        colorBorder: '#cddad2',
      },
    }"
    ><ReportHistory
      :reports="demoReports"
      :schemes="reportSchemes"
      @back="back"
  /></ConfigProvider>
</template>
