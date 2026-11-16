<script setup lang="ts">
import type { InspectionPlan } from '#/types/inspection';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Alert, Button, message } from 'ant-design-vue';

import {
  getInspectionPlansApi,
  updateInspectionPlanApi,
} from '#/api/contract-inspection';

const props = defineProps<{ action: string; planId: string }>();
const router = useRouter();
const plan = ref<InspectionPlan>();
const busy = ref(false);
const error = ref('');
const done = ref(false);
const canConfirm = computed(() => {
  if (!plan.value) return false;
  if (props.action === 'pause') return plan.value.status === '执行中';
  if (props.action === 'resume') return plan.value.status === '已暂停';
  if (props.action === 'stop')
    return ['已暂停', '执行中', '草稿'].includes(plan.value.status);
  return false;
});
onMounted(async () => {
  try {
    const response = await getInspectionPlansApi();
    plan.value = response.data.find((item) => item.id === props.planId);
    if (!plan.value) error.value = '计划不存在或刷新后已重置';
  } catch (error_) {
    error.value = (error_ as Error).message;
  }
});

async function confirm() {
  if (busy.value || !plan.value || !canConfirm.value) return;
  busy.value = true;
  try {
    let target: '已暂停' | '已终止' | '执行中' = '执行中';
    if (props.action === 'pause') target = '已暂停';
    else if (props.action === 'stop') target = '已终止';
    const response = await updateInspectionPlanApi(props.planId, {
      status: target,
    });
    plan.value = response.data;
    done.value = true;
    message.success(`计划${target}`);
  } catch (error_) {
    message.error((error_ as Error).message);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section class="mt-4 rounded-lg border border-teal-200 bg-white p-4">
    <h3 class="mb-3 font-semibold">
      {{
        action === 'report'
          ? '巡检执行与结果填报'
          : action === 'pause'
            ? '暂停巡检确认'
            : action === 'stop'
              ? '终止巡检确认'
              : '恢复巡检确认'
      }}
    </h3>
    <Alert v-if="error" type="error" :message="error" />
    <template v-else-if="plan">
      <p class="mb-3">{{ plan.name }} · {{ plan.id }} · {{ plan.status }}</p>
      <p class="mb-3 text-xs text-slate-500">
        {{
          action === 'report'
            ? '在计划详情选择本次排期，生成或打开巡检工单，按设备逐项回填并提交验收。'
            : '仅影响后续安排，已经生成的工单保留原清单与处理进度。'
        }}
      </p>
      <Button
        v-if="canConfirm && !done"
        type="primary"
        :loading="busy"
        @click="confirm"
      >
        确认{{
          action === 'pause' ? '暂停' : action === 'stop' ? '终止' : '恢复'
        }}
      </Button>
      <Button
        class="ml-2"
        @click="
          router.push({
            path: '/app/mate/employee/ticket-assistant/inspection-plan-detail',
            query: { id: planId },
          })
        "
      >
        查看计划与执行记录
      </Button>
    </template>
  </section>
</template>
