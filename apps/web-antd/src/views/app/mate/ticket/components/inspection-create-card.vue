<script setup lang="ts">
import type { InspectionActivation, InspectionPlan } from '#/types/inspection';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message } from 'ant-design-vue';

import {
  activateInspectionPlanApi,
  createInspectionPlanApi,
  updateInspectionPlanApi,
} from '#/api/contract-inspection';
import { provideDemoInspectionContractApi } from '#/api/inspection-contract-content';
import {
  collectInspectionDraft,
  emptyInspectionDraft,
  missingInspectionFields,
} from '#/api/inspection-draft';

import InspectionPlanConfirmDrawer from '../modals/inspection-plan-confirm-drawer.vue';

const props = defineProps<{ input: string }>();
const emit = defineEmits<{ cancel: []; created: [plan: InspectionPlan] }>();
const router = useRouter();
const form = ref(emptyInspectionDraft());
const open = ref(false);
const busy = ref(false);
const created = ref<InspectionPlan>();
const pendingPlan = ref<InspectionPlan>();
const cancelled = ref(false);
const missing = computed(() =>
  missingInspectionFields(form.value).filter((label) =>
    ['负责人', '首次巡检日期'].includes(label),
  ),
);
const fields = computed(() => [
  ['合同', form.value.contract],
  [
    '客户 / 项目',
    [form.value.customer, form.value.project].filter(Boolean).join(' / '),
  ],
  [
    '服务期限',
    form.value.start && form.value.end
      ? `${form.value.start} 至 ${form.value.end}`
      : '',
  ],
  ['巡检范围', form.value.scope],
  ['执行频次', form.value.frequency],
  ['首次巡检', form.value.firstDate],
  [
    '负责人 / 班组',
    [form.value.owner, form.value.team].filter(Boolean).join(' / '),
  ],
  ['检查要求', form.value.requirements],
]);
function collect(text: string) {
  if (!text.trim() || created.value || cancelled.value) return;
  form.value = collectInspectionDraft(text, form.value);
}
watch(
  () => props.input,
  (value) => collect(value),
  { immediate: true },
);
async function provideContract() {
  if (busy.value || created.value || cancelled.value) return;
  busy.value = true;
  try {
    const response = await provideDemoInspectionContractApi();
    if (!props.input && !form.value.contract) form.value = response.data;
  } catch {
    message.error('模拟合同加载失败，请重试');
  } finally {
    busy.value = false;
  }
}
onMounted(() => {
  if (!props.input && !form.value.contract) void provideContract();
});
async function persist(config: InspectionActivation, activateNow = false) {
  if (busy.value || created.value) return;
  busy.value = true;
  try {
    form.value = config.draft;
    const draftResponse = pendingPlan.value
      ? await updateInspectionPlanApi(
          pendingPlan.value.id,
          config.draft,
          undefined,
          config,
        )
      : await createInspectionPlanApi(
          config.draft,
          config.overlapReason || '',
          config,
        );
    pendingPlan.value = draftResponse.data;
    const activationResponse = activateNow
      ? await activateInspectionPlanApi(pendingPlan.value.id, config)
      : undefined;
    const result = activationResponse
      ? activationResponse.data
      : pendingPlan.value;
    created.value = result;
    open.value = false;
    emit('created', result);
    message.success(activateNow ? '巡检计划已启用' : '草稿及执行配置已保存');
  } catch (error) {
    message.error(
      `${(error as Error).message}${pendingPlan.value ? '；草稿已保留，可修改后重试' : ''}`,
    );
  } finally {
    busy.value = false;
  }
}
function cancel() {
  cancelled.value = true;
  emit('cancel');
}
</script>
<template>
  <section class="inspection-collect-card" :class="{ 'is-created': created }">
    <header class="inspection-collect-card__header">
      <div class="inspection-collect-card__heading">
        <span class="inspection-collect-card__eyebrow">
          <Icon icon="lucide:file-text" />
          巡检计划确认
        </span>
        <span class="inspection-collect-card__status">
          {{
            created
              ? created.status
              : cancelled
                ? '已取消'
                : missing.length > 0
                  ? '待补充'
                  : '待确认'
          }}
        </span>
      </div>
      <h3>确认巡检计划信息</h3>
      <p v-if="created">
        {{ created.name
        }}{{
          created.status === '草稿'
            ? '已保存为草稿，可继续补充或启用。'
            : '已启用，将按排期生成巡检工单。'
        }}
      </p>
      <p v-else-if="cancelled">本次计划信息收集已取消</p>
      <p v-else-if="missing.length > 0">
        {{ form.contract || '巡检计划' }}合同信息已收集，请补充{{
          missing.slice(0, 3).join('、')
        }}{{ missing.length > 3 ? `等 ${missing.length} 项信息` : '' }}
      </p>
      <p v-else>
        合同信息已自动填充，请确认首次巡检日期和负责人后保存草稿或直接启用
      </p>
    </header>
    <button
      type="button"
      class="inspection-collect-card__body"
      :disabled="!!created || cancelled || busy"
      aria-label="编辑巡检计划收集信息"
      @click="open = true"
    >
      <dl class="inspection-collect-card__fields">
        <div v-for="[label, value] in fields" :key="label">
          <dt>{{ label }}</dt>
          <dd :class="{ 'is-missing': !value }">{{ value || '待补充' }}</dd>
        </div>
      </dl>
    </button>
    <footer class="inspection-collect-card__footer">
      <Button
        v-if="!created && !cancelled && !form.contract"
        size="small"
        :loading="busy"
        @click="provideContract"
      >
        模拟提供合同
      </Button>
      <Button
        v-if="created"
        size="small"
        class="inspection-collect-card__detail"
        @click="
          router.push('/app/mate/employee/ticket-assistant/inspection-plans')
        "
      >
        查看巡检计划
      </Button>
      <template v-else-if="!cancelled">
        <Button
          size="small"
          class="inspection-collect-card__detail"
          :disabled="busy"
          @click="open = true"
        >
          查看详情
        </Button>
        <Button type="text" size="small" :disabled="busy" @click="cancel">
          取消收集
        </Button>
      </template>
      <Button
        v-if="created?.status === '草稿'"
        type="link"
        size="small"
        @click="
          router.push({
            path: '/app/mate/employee/ticket-assistant/ticket-chat',
            query: { action: 'enable', planId: created.id },
          })
        "
      >
        通过助理启用
      </Button>
      <span v-if="created" class="inspection-collect-card__code">
        {{ created.id }}
      </span>
    </footer>
    <InspectionPlanConfirmDrawer
      v-model:open="open"
      :draft="form"
      :busy="busy"
      :plan="pendingPlan"
      @save="persist($event)"
      @activate="persist($event, true)"
    />
  </section>
</template>

<style scoped>
.inspection-collect-card {
  width: 100%;
  min-width: min(480px, 100%);
  margin-top: 14px;
  overflow: hidden;
  color: #30343b;
  background: #fff;
  border: 1px solid #bfc8d4;
  border-radius: 7px;
  box-shadow: 0 3px 12px rgb(15 23 42 / 4%);
}

.inspection-collect-card__header {
  padding: 12px 15px;
  color: #8a570b;
  background: #fff8e7;
}

.inspection-collect-card__heading {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.inspection-collect-card__eyebrow {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.inspection-collect-card__eyebrow svg {
  width: 14px;
  height: 14px;
}

.inspection-collect-card__status {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 18px;
  background: #fff;
  border: 1px solid #f5dfad;
  border-radius: 20px;
}

.inspection-collect-card__header h3 {
  margin: 5px 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.inspection-collect-card__header p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #ac7b2d;
}

.inspection-collect-card__body {
  display: block;
  width: 100%;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 0;
}

.inspection-collect-card__body:disabled {
  cursor: default;
}

.inspection-collect-card__body:focus-visible {
  outline: 2px solid #0d6853;
  outline-offset: -3px;
}

.inspection-collect-card__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 17px 28px;
  margin: 0;
}

.inspection-collect-card__fields dt {
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
}

.inspection-collect-card__fields dd {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.inspection-collect-card__fields dd.is-missing {
  color: #94620f;
}

.inspection-collect-card__footer {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 47px;
  padding: 10px 16px;
  border-top: 1px solid #eef0f3;
}

.inspection-collect-card__detail {
  height: 25px;
  padding: 0 8px;
  color: #fff;
  background: #102e28;
  border-color: #102e28;
  border-radius: 3px;
}

.inspection-collect-card__detail:not(:disabled):hover {
  color: #fff;
  background: #205345;
  border-color: #205345;
}

.inspection-collect-card__code {
  font-size: 11px;
  color: #86909c;
}

.is-created .inspection-collect-card__header {
  color: #235744;
  background: #eef8f2;
}

.is-created .inspection-collect-card__header p {
  color: #4f7e68;
}

@media (max-width: 520px) {
  .inspection-collect-card__fields {
    gap: 14px 16px;
  }
}
</style>
