<script setup lang="ts">
import type {
  InspectionActivation,
  InspectionDraft,
  InspectionPlan,
} from '#/types/inspection';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Alert, Button, message, Tag } from 'ant-design-vue';

import {
  activateInspectionPlanApi,
  getInspectionPlansApi,
  updateInspectionPlanApi,
} from '#/api/contract-inspection';
import {
  collectInspectionDraft,
  emptyInspectionDraft,
} from '#/api/inspection-draft';

import InspectionPlanConfirmDrawer from '../modals/inspection-plan-confirm-drawer.vue';

const props = withDefaults(
  defineProps<{ input?: string; mode?: 'edit' | 'enable'; planId: string }>(),
  { mode: 'enable', input: '' },
);
const emit = defineEmits<{ activated: [plan: InspectionPlan] }>();
const router = useRouter();
const plan = ref<InspectionPlan>();
const form = ref(emptyInspectionDraft());
const open = ref(false);
const loading = ref(true);
const busy = ref(false);
const error = ref('');
const isConfigEdit = computed(
  () =>
    props.mode === 'edit' &&
    ['已暂停', '执行中'].includes(plan.value?.status || ''),
);
const activePlan = computed(
  () => !!plan.value && plan.value.status !== '草稿' && !isConfigEdit.value,
);
async function load() {
  loading.value = true;
  try {
    const response = await getInspectionPlansApi();
    plan.value = response.data.find((item) => item.id === props.planId);
    if (!plan.value) throw new Error('计划不存在或已重置，请返回列表选择');
    form.value = Object.fromEntries(
      Object.entries(emptyInspectionDraft()).map(([key, value]) => [
        key,
        plan.value?.[key as keyof InspectionPlan] ?? value,
      ]),
    ) as unknown as InspectionDraft;
    if (props.input)
      form.value = collectInspectionDraft(props.input, form.value);
  } catch (error_) {
    error.value = (error_ as Error).message;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
watch(
  () => props.input,
  (text) => {
    if (text.trim()) form.value = collectInspectionDraft(text, form.value);
  },
);
async function persist(config: InspectionActivation, activateNow = false) {
  if (busy.value) return;
  busy.value = true;
  try {
    const editing = isConfigEdit.value;
    const response = activateNow
      ? await activateInspectionPlanApi(props.planId, config, editing)
      : await updateInspectionPlanApi(
          props.planId,
          config.draft,
          undefined,
          config,
        );
    plan.value = response.data;
    form.value = config.draft;
    open.value = false;
    emit('activated', plan.value);
    let successText = '草稿及执行配置已保存';
    if (activateNow)
      successText = editing ? '后续配置已更新' : '巡检计划已启用';
    message.success(successText);
  } catch (error_) {
    message.error((error_ as Error).message);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <section
    class="mt-4 overflow-hidden rounded-lg border border-teal-200 bg-white"
  >
    <header class="bg-teal-50 p-4">
      <div class="flex items-center justify-between">
        <h3 class="flex items-center gap-2 font-semibold text-teal-900">
          <Icon icon="lucide:clipboard-check" />
          {{ mode === 'edit' ? '巡检计划调整确认' : '巡检计划确认' }}
        </h3>
        <Tag>{{ plan?.status || '加载中' }}</Tag>
      </div>
      <p class="mt-2 text-sm text-slate-600">
        {{ plan?.name || '正在读取计划' }}
      </p>
    </header>
    <div class="p-4">
      <Alert v-if="error" type="error" :message="error" />
      <template v-else>
        <p class="mb-3 text-sm text-slate-500">
          {{
            activePlan
              ? '计划已启用，可在详情中查看已确认的设备清单、检查事项和排期。'
              : '合同信息已带入，可保存草稿或在同一页面确认并启用。'
          }}
        </p>
        <Button
          v-if="!activePlan"
          type="primary"
          :loading="loading"
          :disabled="loading || busy || !plan"
          @click="open = true"
        >
          查看并确认计划
        </Button>
        <Button
          v-else
          type="primary"
          @click="
            router.push({
              path: '/app/mate/employee/ticket-assistant/inspection-plan-detail',
              query: { id: planId },
            })
          "
        >
          查看计划明细
        </Button>
      </template>
    </div>
    <InspectionPlanConfirmDrawer
      v-model:open="open"
      :draft="form"
      :plan="plan"
      :busy="busy"
      @save="persist($event)"
      @activate="persist($event, true)"
    />
  </section>
</template>
