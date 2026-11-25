<script setup lang="ts">
import type {
  EmployeeHandoff,
  EmployeeRecommendation,
  EmployeeRecommendationAction,
  EmployeeRecommendationContext,
} from '#/types/employee-recommendation';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Input, message, Modal } from 'ant-design-vue';

import {
  availableRecommendations,
  recommendationDraft,
} from '#/utils/employee-recommendations';

const props = withDefaults(
  defineProps<{
    context: EmployeeRecommendationContext;
    /** Help-page demonstration: return the draft without navigating. */
    demo?: boolean;
    disabled?: boolean;
    employees: EmployeeRecommendation[];
  }>(),
  { disabled: false, demo: false },
);
const emit = defineEmits<{ handoff: [value: EmployeeHandoff] }>();
const router = useRouter();
const employees = computed(() =>
  availableRecommendations(props.employees, props.context.currentEmployeeId),
);
const selected = ref<EmployeeHandoff>();
const draft = ref('');
const busy = ref(false);
const failedAvatars = ref<string[]>([]);
const invalid = computed(
  () => props.disabled || busy.value || !draft.value.trim(),
);

function prepare(
  employee: EmployeeRecommendation,
  action: EmployeeRecommendationAction,
) {
  draft.value = recommendationDraft(props.context, action);
  selected.value = { employee, action, draft: draft.value };
}

// Switching records or updating their state invalidates the previous draft.
watch(
  () => JSON.stringify([props.context, props.employees, props.disabled]),
  () => {
    selected.value = undefined;
  },
);

async function handoff() {
  const selection = selected.value;
  if (!selection || invalid.value) return;
  const value = { ...selection, draft: draft.value.trim() };
  if (props.demo) {
    emit('handoff', value);
    selected.value = undefined;
    return;
  }
  busy.value = true;
  try {
    const failure = await router.push({
      path: selection.employee.path,
      query: {
        ...props.context.query,
        ...selection.action.query,
        source: props.context.source,
        businessId: props.context.businessId,
        prefill: value.draft,
      },
    });
    if (failure) {
      message.error('暂未进入目标对话，请重试。草稿已保留。');
      return;
    }
    selected.value = undefined;
    emit('handoff', value);
  } catch {
    message.error('暂未进入目标对话，请重试。草稿已保留。');
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section
    v-if="employees.length > 0"
    class="employee-recommendations"
    aria-label="关联数字员工推荐"
  >
    <header class="recommendation-heading">
      <span class="recommendation-mark">
        <Icon icon="lucide:workflow" aria-hidden="true" />
      </span>
      <div>
        <small>AI 下一步建议</small>
        <h3>让其他数字员工接着帮你</h3>
      </div>
    </header>
    <p class="recommendation-source">
      <Icon icon="lucide:paperclip" aria-hidden="true" />
      {{ context.title }}
    </p>
    <p class="recommendation-instruction">
      选一条建议 → 核对内容 → 进入对应员工的对话
    </p>
    <article
      v-for="employee in employees"
      :key="employee.id"
      class="recommendation-employee"
      :data-employee-id="employee.id"
    >
      <div class="recommendation-identity">
        <img
          v-if="employee.avatar && !failedAvatars.includes(employee.id)"
          :src="employee.avatar"
          alt=""
          @error="failedAvatars.push(employee.id)"
        />
        <span v-else class="recommendation-avatar">
          <Icon icon="lucide:bot" aria-hidden="true" />
        </span>
        <div>
          <strong>{{ employee.name }}</strong>
          <small>{{ employee.role }}</small>
        </div>
        <span class="recommendation-tag">协作</span>
      </div>
      <p class="recommendation-reason">
        <b>为什么推荐</b>
        {{ employee.reason }}
      </p>
      <button
        v-for="(action, index) in employee.actions"
        :key="action.id"
        type="button"
        class="recommendation-action"
        :class="{ primary: index === 0 }"
        :disabled="disabled"
        :aria-label="`${employee.name}：${action.title}`"
        @click="prepare(employee, action)"
      >
        <Icon :icon="action.icon || 'lucide:sparkles'" aria-hidden="true" />
        <span>{{ action.title }}</span>
        <Icon icon="lucide:arrow-up-right" aria-hidden="true" />
      </button>
    </article>
    <p class="recommendation-footnote">
      <Icon icon="lucide:message-square-text" aria-hidden="true" />
      自动带上当前业务信息，无需重述；发送和执行仍由你确认。
    </p>
  </section>
  <Modal
    :open="!!selected"
    :title="`交给${selected?.employee.name ?? '数字员工'}继续处理`"
    :ok-text="demo ? '查看对话示意' : '带入对话'"
    cancel-text="取消"
    :width="660"
    :confirm-loading="busy"
    :ok-button-props="{ disabled: invalid }"
    @cancel="selected = undefined"
    @ok="handoff"
  >
    <p class="recommendation-preview-note">
      {{
        demo
          ? '教学示例：只预览协作过程，不创建真实业务。'
          : '以下内容将带入目标员工的输入框，你可以修改后再发送。'
      }}
    </p>
    <Input.TextArea
      v-model:value="draft"
      :rows="12"
      aria-label="关联员工对话草稿"
    />
  </Modal>
</template>

<style scoped>
.employee-recommendations {
  min-width: 0;
  padding: 20px;
  color: #243b53;
  background: linear-gradient(145deg, #f0f8ff, #fff 35%, #f1faf7);
  border: 1px solid #cfdfe8;
  border-radius: 16px;
}

.recommendation-heading {
  display: flex;
  gap: 10px;
  align-items: center;
}

.recommendation-mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  color: white;
  background: linear-gradient(135deg, #2878c7, #238779);
  border-radius: 11px;
}

.recommendation-heading small {
  font-size: 11px;
  font-weight: 600;
  color: #3a687e;
}

.recommendation-heading h3 {
  margin: 3px 0 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
}

.recommendation-source {
  display: flex;
  gap: 6px;
  align-items: baseline;
  margin: 14px 0 7px;
  font-size: 12px;
  overflow-wrap: anywhere;
}

.recommendation-instruction {
  margin: 0 0 16px;
  font-size: 12px;
  line-height: 1.8;
  color: #506779;
}

.recommendation-employee {
  padding: 15px;
  margin-top: 12px;
  background: #fff;
  border: 1px solid #dde7ed;
  border-radius: 12px;
}

.recommendation-identity {
  display: flex;
  gap: 9px;
  align-items: center;
}

.recommendation-identity img,
.recommendation-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  object-fit: cover;
  background: #e8f0fa;
  border-radius: 10px;
}

.recommendation-identity > div {
  flex: 1;
  min-width: 0;
}

.recommendation-identity strong {
  font-size: 14px;
}

.recommendation-identity small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.5;
  color: #637589;
}

.recommendation-tag {
  padding: 3px 6px;
  font-size: 10px;
  color: #1d695c;
  white-space: nowrap;
  background: #e9f6ef;
  border-radius: 5px;
}

.recommendation-reason {
  margin: 12px 0;
  font-size: 12px;
  line-height: 1.8;
  color: #526578;
  overflow-wrap: anywhere;
}

.recommendation-reason b {
  margin-right: 6px;
  font-weight: 600;
  color: #315975;
}

.recommendation-action {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 10px;
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.6;
  text-align: left;
  cursor: pointer;
  background: #f7f9fc;
  border: 1px solid #e2e9f0;
  border-radius: 8px;
}

.recommendation-action.primary {
  color: #215e75;
  background: #edf7fa;
  border-color: #cce3eb;
}

.recommendation-action span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.recommendation-action :deep(svg) {
  flex: none;
}

.recommendation-action:hover:not(:disabled) {
  background: #e3f1f7;
  border-color: #7eafc8;
}

.recommendation-action:focus-visible {
  outline: 3px solid #4386cc;
  outline-offset: 3px;
}

.recommendation-action:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.recommendation-footnote {
  display: flex;
  gap: 7px;
  align-items: baseline;
  margin: 16px 0 0;
  font-size: 11px;
  line-height: 1.8;
  color: #5d7181;
}

.recommendation-preview-note {
  margin: 12px 0;
  color: #526578;
}
</style>
