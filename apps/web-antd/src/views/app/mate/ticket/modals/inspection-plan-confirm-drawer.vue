<script setup lang="ts">
import type {
  InspectionActivation,
  InspectionDevice,
  InspectionDraft,
  InspectionPlan,
  InspectionTemplate,
} from '#/types/inspection';

import { computed, nextTick, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Checkbox,
  Descriptions,
  Drawer,
  Input,
  InputNumber,
  message,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  getInspectionPlansApi,
  getInspectionResourcesApi,
  inspectionStaff,
} from '#/api/contract-inspection';
import {
  buildInspectionDates,
  emptyInspectionDraft,
  missingInspectionFields,
} from '#/api/inspection-draft';
import {
  inspectionExpectedCount,
  inspectionOverlaps,
} from '#/api/inspection-rules';
import { deepClone } from '#/utils/deep-clone';

const props = defineProps<{
  busy: boolean;
  draft: InspectionDraft;
  plan?: InspectionPlan;
}>();
const emit = defineEmits<{
  activate: [config: InspectionActivation];
  save: [config: InspectionActivation];
}>();
const open = defineModel<boolean>('open');
const form = ref(emptyInspectionDraft());
const devices = ref<InspectionDevice[]>([]);
const templates = ref<InspectionTemplate[]>([]);
const allPlans = ref<InspectionPlan[]>([]);
const selectedIds = ref<string[]>([]);
const templateIds = ref<Record<string, string>>({});
const dispatchMode = ref<'auto' | 'manual'>('auto');
const bulkTemplate = ref('');
const scopeReason = ref('');
const overlapReason = ref('');
const changeReason = ref('');
const loading = ref(false);
const error = ref('');
const deviceOpen = ref(false);
let revision = 0;
const isConfigEdit = computed(
  () => !!props.plan && ['已暂停', '执行中'].includes(props.plan.status),
);
const normalize = (value: string) =>
  value.replaceAll(/有限责任公司|有限公司/g, '').trim();
const candidates = computed(() =>
  devices.value.filter(
    (device) =>
      normalize(device.customer) === normalize(form.value.customer) &&
      device.project === form.value.project,
  ),
);
const selected = computed(() =>
  candidates.value.filter((device) => selectedIds.value.includes(device.id)),
);
const owners = computed(() => {
  const options = inspectionStaff
    .filter(
      (person, index, list) =>
        list.findIndex((item) => item.name === person.name) === index,
    )
    .map((person) => ({
      value: person.name,
      label: `${person.name} · ${person.team}`,
    }));
  if (
    form.value.owner &&
    !options.some((item) => item.value === form.value.owner)
  )
    options.unshift({ value: form.value.owner, label: form.value.owner });
  return options;
});
const missing = computed(() =>
  missingInspectionFields(form.value).filter(
    (label) => !['合同信息', '检查要求'].includes(label),
  ),
);
const preview = computed(() => {
  try {
    return { dates: buildInspectionDates(form.value), error: '' };
  } catch (error_) {
    return { dates: [] as string[], error: (error_ as Error).message };
  }
});
const overlaps = computed(() =>
  inspectionOverlaps(form.value, allPlans.value, props.plan?.id || ''),
);
const expectedCount = computed(() => inspectionExpectedCount(form.value.scope));
const countMismatch = computed(
  () =>
    expectedCount.value !== undefined &&
    expectedCount.value !== selected.value.length,
);
const unconfigured = computed(() =>
  selected.value.some(
    (device) =>
      !templates.value.some(
        (item) =>
          item.id === templateIds.value[device.id] &&
          (item.category === '通用' || item.category === device.category),
      ),
  ),
);
const itemCount = computed(() =>
  selected.value.reduce(
    (total, device) =>
      total +
      (templates.value.find((item) => item.id === templateIds.value[device.id])
        ?.items.length || 0),
    0,
  ),
);
const canSave = computed(
  () =>
    !!form.value.contract.trim() &&
    !!form.value.name.trim() &&
    !loading.value &&
    !error.value &&
    (overlaps.value.length === 0 || !!overlapReason.value.trim()),
);
const canActivate = computed(
  () =>
    canSave.value &&
    missing.value.length === 0 &&
    !preview.value.error &&
    selected.value.length > 0 &&
    !unconfigured.value &&
    (!countMismatch.value || !!scopeReason.value.trim()) &&
    (!isConfigEdit.value || !!changeReason.value.trim()),
);
function matchDevices() {
  selectedIds.value = candidates.value.map((device) => device.id);
  templateIds.value = Object.fromEntries(
    candidates.value.map((device) => [
      device.id,
      templates.value.find((item) => item.category === device.category)?.id ||
        templates.value.find((item) => item.category === '通用')?.id ||
        '',
    ]),
  );
}
function applyTemplate() {
  const template = templates.value.find(
    (item) => item.id === bulkTemplate.value,
  );
  if (!template) return;
  for (const device of selected.value)
    if (template.category === '通用' || template.category === device.category)
      templateIds.value[device.id] = template.id;
  message.success('已批量应用到所选兼容设备');
}
function ownerChanged(value: unknown) {
  const staff = inspectionStaff.find((person) => person.name === value);
  if (staff) form.value.team = staff.team;
}
watch(
  () => [form.value.customer, form.value.project],
  () => {
    selectedIds.value = [];
    templateIds.value = {};
  },
);
watch(open, async (value) => {
  const token = ++revision;
  if (!value) return;
  form.value = { ...emptyInspectionDraft(), ...props.draft };
  if (!form.value.name && form.value.contract)
    form.value.name = `${form.value.contract}巡检计划`;
  if (isConfigEdit.value)
    form.value.firstDate =
      props.plan?.executions.find(
        (item) => !item.ticket && item.status !== '已完成',
      )?.date || form.value.firstDate;
  dispatchMode.value = props.plan?.dispatchMode || 'auto';
  scopeReason.value = props.plan?.configuration?.scopeReason || '';
  overlapReason.value = props.plan?.configuration?.overlapReason || '';
  changeReason.value = '';
  deviceOpen.value = false;
  error.value = '';
  loading.value = true;
  try {
    const [resources, list] = await Promise.all([
      getInspectionResourcesApi(),
      getInspectionPlansApi(),
    ]);
    if (token !== revision) return;
    devices.value = resources.data.devices;
    templates.value = resources.data.templates;
    allPlans.value = list.data;
    await nextTick();
    if (token !== revision) return;
    if (props.plan?.configuration || props.plan?.devices?.length) {
      selectedIds.value = (props.plan.devices || []).map((item) => item.id);
      templateIds.value = Object.fromEntries(
        (props.plan.devices || []).map((item) => [item.id, item.templateId]),
      );
    } else matchDevices();
  } catch (error_) {
    if (token === revision) error.value = (error_ as Error).message;
  } finally {
    if (token === revision) loading.value = false;
  }
});
function config(): InspectionActivation {
  return {
    draft: { ...form.value },
    devices: selected.value.map((device) => ({
      ...device,
      templateId: templateIds.value[device.id] || '',
      items: deepClone(
        templates.value.find((item) => item.id === templateIds.value[device.id])
          ?.items || [],
      ),
    })),
    dispatchMode: dispatchMode.value,
    scopeReason: scopeReason.value,
    overlapReason: overlapReason.value,
    changeReason: changeReason.value,
  };
}
</script>
<template>
  <Drawer
    v-model:open="open"
    :title="isConfigEdit ? '调整后续执行配置' : '巡检计划确认'"
    width="min(820px, 100vw)"
    :closable="!busy"
    :mask-closable="!busy"
    :keyboard="!busy"
  >
    <Alert
      class="mb-5"
      type="info"
      show-icon
      :message="
        isConfigEdit
          ? '仅调整尚未生成工单的后续安排，已有工单保留设备与事项快照。'
          : '合同信息自动带入，请确认巡检频次，并补充首次巡检日期和负责人。可保存草稿，或核对设备与模板后直接启用，无需再次跳转。'
      "
    />
    <Alert v-if="error" class="mb-4" type="error" :message="error" />
    <section class="mb-5 rounded-lg border border-slate-200 p-4">
      <h3 class="mb-3 flex items-center gap-2 font-semibold text-teal-800">
        <Icon icon="lucide:file-check-2" />
        合同信息
        <Tag>自动带入</Tag>
      </h3>
      <Descriptions bordered size="small" :column="2">
        <Descriptions.Item label="合同名称" :span="2">
          {{ form.contract || '待补充' }}
        </Descriptions.Item>
        <Descriptions.Item label="客户">
          {{ form.customer || '待补充' }}
        </Descriptions.Item>
        <Descriptions.Item label="项目">
          {{ form.project || '待补充' }}
        </Descriptions.Item>
        <Descriptions.Item label="服务期限" :span="2">
          {{ form.start || '待确认' }} 至 {{ form.end || '待确认' }}
        </Descriptions.Item>
        <Descriptions.Item label="计划名称" :span="2">
          {{ form.name || '待补充' }}
        </Descriptions.Item>
        <Descriptions.Item label="巡检范围" :span="2">
          {{ form.scope || '待补充' }}
        </Descriptions.Item>
      </Descriptions>
      <details class="mt-3">
        <summary class="cursor-pointer text-xs text-slate-500">
          查看原文{{ form.contractId ? '' : ' / 完善合同摘要' }}
        </summary>
        <p class="my-3 whitespace-pre-line text-xs leading-6 text-slate-500">
          {{ form.contractText || '暂无合同原文' }}
        </p>
        <div v-if="!form.contractId" class="grid grid-cols-2 gap-3">
          <label>
            合同名称
            <Input v-model:value="form.contract" />
          </label>
          <label>
            计划名称
            <Input v-model:value="form.name" />
          </label>
          <label>
            客户
            <Input v-model:value="form.customer" />
          </label>
          <label>
            项目
            <Input v-model:value="form.project" />
          </label>
          <label>
            服务开始日期
            <Input v-model:value="form.start" type="date" />
          </label>
          <label>
            服务结束日期
            <Input v-model:value="form.end" type="date" />
          </label>
          <label>
            范围
            <Input v-model:value="form.scope" />
          </label>
        </div>
      </details>
    </section>
    <section class="mb-5 rounded-lg border border-teal-100 bg-teal-50/30 p-4">
      <h3 class="mb-4 flex items-center gap-2 font-semibold text-teal-800">
        <Icon icon="lucide:calendar-check" />
        执行安排
      </h3>
      <div class="grid grid-cols-2 gap-4">
        <label>
          巡检频次
          <span class="text-red-500">*</span>
          <Select
            v-model:value="form.frequency"
            class="w-full"
            placeholder="请确认巡检频次"
            :options="[
              { label: '每月一次', value: '每月' },
              { label: '每季度一次', value: '每季度' },
            ]"
          />
        </label>
        <label>
          {{ isConfigEdit ? '后续首次巡检日期' : '首次巡检日期' }}
          <span class="text-red-500">*</span>
          <Input
            v-model:value="form.firstDate"
            type="date"
            :min="form.start"
            :max="form.end"
          />
        </label>
        <label>
          负责人
          <span class="text-red-500">*</span>
          <Select
            v-model:value="form.owner"
            class="w-full"
            show-search
            allow-clear
            placeholder="请选择巡检负责人"
            :options="owners"
            @change="ownerChanged"
          />
        </label>
      </div>
      <details class="mt-4">
        <summary class="cursor-pointer text-sm text-slate-600">
          更多执行安排：{{ form.team || '班组待确认' }} · 提前
          {{ form.advanceDays }} 天 ·
          {{ dispatchMode === 'auto' ? '自动派单' : '人工派单' }}
        </summary>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <label>
            负责班组
            <Input v-model:value="form.team" />
          </label>
          <label>
            提前生成天数
            <InputNumber
              v-model:value="form.advanceDays"
              class="!w-full"
              :min="0"
              :max="30"
              :precision="0"
            />
          </label>
          <label class="col-span-2">
            派单方式
            <Select
              v-model:value="dispatchMode"
              class="w-full"
              :options="[
                { label: '自动派单：按负责班组匹配', value: 'auto' },
                { label: '人工派单：进入待派单池', value: 'manual' },
              ]"
            />
          </label>
        </div>
      </details>
    </section>
    <section class="mb-5 rounded-lg border border-slate-200 p-4">
      <button
        class="flex w-full items-center justify-between text-left"
        type="button"
        :aria-expanded="deviceOpen"
        @click="deviceOpen = !deviceOpen"
      >
        <div>
          <h3 class="font-semibold text-teal-800">设备与巡检事项</h3>
          <p class="mt-2 text-sm text-slate-500">
            {{
              loading
                ? '正在匹配设备与推荐模板…'
                : `已匹配 ${selected.length} 台设备、${itemCount} 个检查项`
            }}
          </p>
        </div>
        <span class="text-xs text-teal-700">
          {{ deviceOpen ? '收起' : '查看或调整' }}
        </span>
      </button>
      <div v-if="deviceOpen" class="mt-4">
        <div class="mb-3 flex flex-wrap gap-2">
          <Button :disabled="loading || busy" @click="matchDevices">
            重新匹配设备
          </Button>
          <Select
            v-model:value="bulkTemplate"
            class="w-56"
            placeholder="选择巡检模板"
            :options="
              templates.map((item) => ({ label: item.name, value: item.id }))
            "
          />
          <Button
            :disabled="!bulkTemplate || selected.length === 0"
            @click="applyTemplate"
          >
            批量应用模板
          </Button>
        </div>
        <Alert
          v-if="candidates.length === 0"
          type="warning"
          message="未匹配到设备，可先保存草稿；启用前需补齐客户、项目及设备范围。"
        />
        <Checkbox.Group v-model:value="selectedIds" class="!block">
          <div
            v-for="device in candidates"
            :key="device.id"
            class="border-b border-slate-100 py-3"
          >
            <div class="flex items-center justify-between gap-3">
              <Checkbox :value="device.id">
                {{ device.name }} · {{ device.code }}
              </Checkbox>
              <Select
                v-if="selectedIds.includes(device.id)"
                v-model:value="templateIds[device.id]"
                class="w-52"
                placeholder="选择巡检模板"
                :options="
                  templates
                    .filter(
                      (item) =>
                        item.category === '通用' ||
                        item.category === device.category,
                    )
                    .map((item) => ({ label: item.name, value: item.id }))
                "
              />
            </div>
            <details
              v-if="selectedIds.includes(device.id) && templateIds[device.id]"
              class="ml-6 mt-2 text-xs text-slate-500"
            >
              <summary class="cursor-pointer">查看检查标准与凭证要求</summary>
              <p
                v-for="item in templates.find(
                  (template) => template.id === templateIds[device.id],
                )?.items"
                :key="item.id"
                class="mt-2"
              >
                {{ item.name }}（{{ item.required ? '必检' : '选检' }}）：{{
                  item.standard
                }}；凭证：{{ item.evidence }}
              </p>
            </details>
          </div>
        </Checkbox.Group>
      </div>
    </section>
    <label v-if="countMismatch" class="mb-4 block text-sm text-amber-700">
      合同约定 {{ expectedCount }} 台，已选
      {{ selected.length }} 台，启用前请补齐或说明差异原因：
      <Input v-model:value="scopeReason" placeholder="说明本次计划覆盖的范围" />
    </label>
    <label v-if="overlaps.length > 0" class="mb-4 block text-sm text-amber-700">
      已有重叠计划
      {{ overlaps.map((item) => item.id).join('、') }}，请说明另建或保留原因：
      <Input v-model:value="overlapReason" />
    </label>
    <label v-if="isConfigEdit" class="mb-4 block text-sm">
      变更原因 *
      <Input v-model:value="changeReason" />
    </label>
    <details class="mb-4 rounded-lg border border-slate-200 p-4">
      <summary class="cursor-pointer text-sm font-medium">
        排期预览{{
          preview.dates.length > 0 ? ` · ${preview.dates.length} 次` : ''
        }}
      </summary>
      <Alert
        v-if="preview.error"
        class="mt-3"
        type="warning"
        :message="preview.error"
      />
      <div v-else class="mt-3 flex flex-wrap gap-2">
        <Tag v-for="date in preview.dates.slice(0, 24)" :key="date">
          {{ date }}
        </Tag>
      </div>
      <p class="mt-2 text-xs text-slate-500">
        按首次日期推算，月末不足当日时取月末，节假日保持原日期；每次排期合并为一张巡检工单。
      </p>
    </details>
    <p v-if="missing.length > 0" class="text-xs text-amber-700">
      启用前待补充：{{ missing.join('、') }}。可先保存草稿。
    </p>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :disabled="busy" @click="open = false">取消</Button>
        <Button
          v-if="!isConfigEdit"
          :disabled="!canSave || busy"
          @click="emit('save', config())"
        >
          保存草稿
        </Button>
        <Button
          type="primary"
          :loading="busy"
          :disabled="!canActivate"
          @click="emit('activate', config())"
        >
          {{ isConfigEdit ? '确认更新后续配置' : '确认并启用' }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>
