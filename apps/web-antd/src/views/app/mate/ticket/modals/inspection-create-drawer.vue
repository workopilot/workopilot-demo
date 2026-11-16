<!-- 确认/编辑巡检计划草稿抽屉：绿色分区卡体系，合同只读（创建态）+ 仅确认首日与负责人 -->
<script setup lang="ts">
import type { InspectionDraft } from '#/types/inspection';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Alert, Button, Drawer, Input, Select } from 'ant-design-vue';

import { emptyInspectionDraft } from '#/api/inspection-draft';
import { inspectionStaff } from '#/api/inspection-execution';

const props = withDefaults(
  defineProps<{ busy: boolean; draft: InspectionDraft; editing?: boolean }>(),
  { editing: false },
);
const emit = defineEmits<{
  confirm: [draft: InspectionDraft];
  update: [draft: InspectionDraft];
}>();
const open = defineModel<boolean>('open');
const form = ref(emptyInspectionDraft());
watch(open, (value) => {
  if (value) {
    form.value = { ...props.draft };
    if (!form.value.name && form.value.contract)
      form.value.name = `${form.value.contract}巡检计划`;
  }
});
const sourceMissing = computed(() =>
  [
    ['合同名称', form.value.contract],
    ['客户名称', form.value.customer],
    ['服务开始日期', form.value.start],
    ['服务结束日期', form.value.end],
  ]
    .filter(([, value]) => !value)
    .map(([label]) => label),
);
const dateError = computed(() => {
  const value = form.value.firstDate;
  if (!value) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))
    return '请选择有效的首次巡检日期';
  if (value < form.value.start || value > form.value.end)
    return '首次巡检日期须在合同服务期限内';
  return '';
});
const canSave = computed(
  () =>
    !!form.value.contract.trim() &&
    !!form.value.name.trim() &&
    !!form.value.frequency &&
    (props.editing ||
      (sourceMissing.value.length === 0 &&
        !!form.value.firstDate &&
        !!String(form.value.owner || '').trim() &&
        !dateError.value)),
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
function ownerChanged(value: unknown) {
  const staff = inspectionStaff.find((item) => item.name === value);
  if (staff) form.value.team = staff.team;
}

/** 底部状态提示 */
const saveNote = computed(() => {
  if (props.editing) {
    return !form.value.contract.trim() || !form.value.name.trim()
      ? { tone: 'warn', text: '请填写合同名称与计划名称' }
      : { tone: 'ok', text: '信息完整，可保存草稿' };
  }
  if (sourceMissing.value.length > 0)
    return {
      tone: 'warn',
      text: `合同信息缺少：${sourceMissing.value.join('、')}，请先在合同助理完善约定，不自动推测`,
    };
  if (!form.value.frequency) return { tone: 'warn', text: '请选择巡检频次' };
  if (dateError.value) return { tone: 'warn', text: dateError.value };
  if (!form.value.firstDate)
    return { tone: 'warn', text: '请选择首次巡检日期' };
  if (!String(form.value.owner || '').trim())
    return { tone: 'warn', text: '请选择巡检负责人' };
  return { tone: 'ok', text: '信息完整，可保存草稿' };
});
</script>
<template>
  <Drawer
    v-model:open="open"
    :width="680"
    root-class-name="icd-drawer"
    :mask-closable="!busy"
    :closable="!busy"
    :keyboard="!busy"
  >
    <template #title>
      <div class="icd__head">
        <span class="icd__icon">
          <Icon icon="lucide:clipboard-check" />
        </span>
        <div class="icd__heading">
          <small>{{ editing ? '巡检计划编辑' : '巡检计划创建' }}</small>
          <h3>{{ editing ? '编辑巡检计划草稿' : '确认巡检计划信息' }}</h3>
          <p>
            {{
              editing
                ? '完善草稿信息，启用前再确认设备与执行安排'
                : '核对巡检计划信息，确认首次巡检日期与负责人'
            }}
          </p>
        </div>
      </div>
    </template>

    <div class="icd__banner">
      <Icon :icon="editing ? 'lucide:circle-check' : 'lucide:file-check-2'" />
      {{
        editing
          ? '可完善草稿信息，启用前再确认设备与执行安排。'
          : '巡检频次按合同约定预填，可按实际执行安排调整。请核对计划信息后保存草稿。'
      }}
    </div>

    <!-- 巡检计划信息 -->
    <section class="icd__section">
      <header class="icd__section-head">
        <h4>
          <Icon icon="lucide:calendar-check" />
          巡检计划信息
        </h4>
      </header>
      <div class="icd__grid">
        <div class="icd-field">
          <label>
            计划名称
            <i>*</i>
          </label>
          <Input v-model:value="form.name" :maxlength="100" />
        </div>
        <div class="icd-field">
          <label>巡检频次</label>
          <Select
            v-model:value="form.frequency"
            class="!w-full"
            :options="[
              { label: '每月一次', value: '每月' },
              { label: '每季度一次', value: '每季度' },
            ]"
          />
        </div>

        <div class="icd-field">
          <label>
            首次巡检日期
            <i v-if="!editing">*</i>
          </label>
          <Input
            v-model:value="form.firstDate"
            type="date"
            :min="form.start"
            :max="form.end"
          />
        </div>
        <div class="icd-field">
          <label>
            负责人
            <i v-if="!editing">*</i>
          </label>
          <Select
            v-model:value="form.owner"
            show-search
            allow-clear
            class="!w-full"
            placeholder="请选择巡检负责人"
            :options="owners"
            @change="ownerChanged"
          />
        </div>
        <div class="icd-field icd-field--wide">
          <label>检查要求</label>
          <Input.TextArea
            v-model:value="form.requirements"
            :rows="3"
            placeholder="填写巡检检查要求，设备和模板在启用时确认"
          />
        </div>
      </div>
      <p class="icd__hint">
        负责班组随负责人带入；提前生成天数、设备及模板可在启用时确认。
      </p>
      <Alert
        v-if="dateError"
        class="icd__section-alert"
        type="error"
        :message="dateError"
      />
    </section>

    <!-- 折叠：合同原始内容 -->
    <details class="icd__raw">
      <summary>查看关联合同原始内容</summary>
      <p>{{ form.contractText || '暂无原始内容' }}</p>
    </details>

    <template #footer>
      <div class="icd__footer">
        <span
          class="icd__footer-note"
          :class="saveNote.tone === 'ok' ? 'is-ok' : 'is-warn'"
        >
          <Icon
            :icon="
              saveNote.tone === 'ok'
                ? 'lucide:circle-check'
                : 'lucide:triangle-alert'
            "
          />
          {{ saveNote.text }}
        </span>
        <div class="icd__footer-btns">
          <Button :disabled="busy" @click="open = false">取消</Button>
          <Button
            type="primary"
            :loading="busy"
            :disabled="!canSave"
            @click="emit('confirm', { ...form })"
          >
            保存草稿
          </Button>
        </div>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
/* ============ 标题区 ============ */
.icd__head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icd__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgb(11 110 101 / 22%);
}

.icd__icon svg {
  width: 20px;
  height: 20px;
}

.icd__heading {
  flex: 1;
  min-width: 0;
}

.icd__heading small {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.12em;
}

.icd__heading h3 {
  margin: 2px 0 0;
  font-size: 15.5px;
  font-weight: 700;
  color: #10231f;
}

.icd__heading p {
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11.5px;
  color: #8a9a93;
  white-space: nowrap;
}

/* ============ 顶部说明条 ============ */
.icd__banner {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 11px 14px;
  margin-bottom: 14px;
  font-size: 12px;
  line-height: 1.6;
  color: #2f5d51;
  background: #eef7f2;
  border: 1px solid #d5eadfe1;
  border-radius: 10px;
}

.icd__banner svg {
  flex: none;
  width: 15px;
  height: 15px;
  margin-top: 2px;
  color: #2b8577;
}

/* ============ 分区卡片 ============ */
.icd__section {
  padding: 14px 16px 16px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e2eae6;
  border-radius: 12px;
}

.icd__section-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 13px;
}

.icd__section-head h4 {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #10231f;
}

.icd__section-head h4 svg {
  width: 15px;
  height: 15px;
  color: #2b8577;
}

.icd__section-tag {
  padding: 2.5px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #176e5b;
  background: #e9f4f2;
  border: 1px solid #cfe6dc;
  border-radius: 999px;
}

.icd__section-alert {
  margin: 12px 0 0;
}

.icd__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px 16px;
}

.icd-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.icd-field--wide {
  grid-column: 1 / -1;
}

.icd-field > label {
  font-size: 11.5px;
  font-weight: 600;
  color: #6d827b;
}

.icd-field > label i {
  margin-left: 3px;
  font-style: normal;
  color: #d92d20;
}

.icd__hint {
  margin: 11px 0 0;
  font-size: 11px;
  color: #8a9a93;
}

/* ============ 合同原始内容折叠 ============ */
.icd__raw {
  padding: 12px 16px;
  background: #fff;
  border: 1px dashed #cfe0d8;
  border-radius: 12px;
}

.icd__raw summary {
  font-size: 12px;
  font-weight: 600;
  color: #5d736c;
  cursor: pointer;
  user-select: none;
}

.icd__raw summary:hover {
  color: #176e5b;
}

.icd__raw p {
  padding-top: 10px;
  margin: 10px 0 0;
  font-size: 11px;
  line-height: 1.8;
  color: #7d9a90;
  white-space: pre-line;
  border-top: 1px solid #eef2ee;
}

/* ============ 底部操作区 ============ */
.icd__footer {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
}

.icd__footer-note {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
  font-size: 11.5px;
}

.icd__footer-note svg {
  flex: none;
  width: 13px;
  height: 13px;
}

.icd__footer-note.is-warn {
  color: #92610a;
}

.icd__footer-note.is-ok {
  color: #0e8074;
}

.icd__footer-btns {
  display: flex;
  flex: none;
  gap: 8px;
}
</style>

<!-- 抽屉壳体挂在 body 下，scoped 样式无法命中包装层，需全局块（以 .icd-drawer 限定作用域） -->
<style>
.icd-drawer .ant-drawer-header {
  padding: 16px 22px;
  border-bottom: 1px solid #eef2ee;
}

.icd-drawer .ant-drawer-body {
  padding: 16px 22px 22px;
  background: #fbfdfb;
}

.icd-drawer .ant-drawer-footer {
  padding: 11px 22px;
  border-top: 1px solid #eef2ee;
}

/* 主按钮随模块主色 */
.icd-drawer .ant-btn-primary {
  background: #176e5b;
  border-color: #176e5b;
}

.icd-drawer .ant-btn-primary:not(:disabled):hover {
  background: #145d43;
  border-color: #145d43;
}
</style>
