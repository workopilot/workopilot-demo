<script setup lang="ts">
import type { InspectionPlan } from '#/types/inspection';

import { ref } from 'vue';

import { Alert, Button, Input, message } from 'ant-design-vue';

import { generateInspectionOrderApi } from '#/api/contract-inspection';
import { inspectionToday } from '#/api/inspection-rules';

import InspectionOrderDrawer from '../modals/inspection-order-drawer.vue';

defineProps<{ plan: InspectionPlan }>();
const emit = defineEmits<{ changed: [] }>();
const date = ref(inspectionToday());
const open = ref(false);
const code = ref('');
const busy = ref(false);
async function generate(plan: InspectionPlan, id: string) {
  if (busy.value) return;
  busy.value = true;
  try {
    const result = await generateInspectionOrderApi(plan.id, id, date.value);
    code.value = result.data.code;
    open.value = true;
    emit('changed');
    message.success('工单已生成，设备和事项快照已保存');
  } catch (error) {
    message.error((error as Error).message);
  } finally {
    busy.value = false;
  }
}
function view(value: string) {
  code.value = value;
  open.value = true;
}
</script>
<template>
  <section>
    <Alert
      v-if="plan.status === '草稿'"
      type="info"
      message="启用后生成执行排期"
    />
    <template v-else>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <label class="text-sm">
          模拟业务日期
          <Input v-model:value="date" type="date" class="!w-44" />
        </label>
        <span class="text-xs text-slate-500">
          手动模拟巡检日前N天触发，不修改系统时间；同一排期不会重复生成。
        </span>
      </div>
      <div
        v-for="item in plan.executions"
        :key="item.id"
        class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
      >
        <div class="text-sm">
          <b>{{ item.date }}</b>
          · {{ item.owner }} · {{ item.status }}
          <p class="mt-1 text-xs text-slate-500">
            {{ item.result || '待完成巡检'
            }}{{ item.completedAt ? ` · ${item.completedAt}` : '' }}
          </p>
        </div>
        <Button v-if="item.ticket" type="link" @click="view(item.ticket)">
          {{ item.ticket }} · 查看工单
        </Button>
        <Button
          v-else
          :disabled="plan.status !== '执行中'"
          :loading="busy"
          @click="generate(plan, item.id)"
        >
          模拟生成本次工单
        </Button>
      </div>
    </template>
    <InspectionOrderDrawer
      v-model:open="open"
      :code="code"
      @changed="emit('changed')"
    />
  </section>
</template>
