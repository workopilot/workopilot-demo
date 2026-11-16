<!-- 巡检计划状态变更确认弹窗：计划摘要 + 当前状态→目标状态流转 + 影响说明（列表页与详情页共用） -->
<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { InspectionPlan, InspectionStatus } from '#/types/inspection';

import { computed } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Modal } from 'ant-design-vue';

const props = defineProps<{
  busy: boolean;
  plan?: InspectionPlan;
  target: InspectionStatus;
}>();

const emit = defineEmits<{ confirm: [] }>();

const open = defineModel<boolean>('open');

const isStop = computed(() => props.target === '已终止');

/** 状态圆点配色（与详情页状态点一致） */
const statusColor: Record<InspectionStatus, string> = {
  已暂停: '#d97706',
  已完成: '#16a34a',
  已终止: '#8a9a93',
  待启用: '#1668dc',
  执行中: '#0e8074',
  草稿: '#98a8a1',
};

/** 变更影响说明（随目标状态变化） */
const impact = computed(() => {
  switch (props.target) {
    case '已暂停': {
      return {
        icon: 'lucide:pause',
        text: '暂停后不再生成新的巡检工单，已生成的工单继续保留原安排。',
        title: '暂停后续排期',
        tone: 'warning',
      };
    }
    case '待启用': {
      return {
        icon: 'lucide:send',
        text: '计划配置将锁定为待启用状态，可在列表或详情页随时启用开始执行。',
        title: '进入待启用列表',
        tone: 'info',
      };
    }
    case '执行中': {
      return {
        icon: 'lucide:play',
        text: `系统将按「${props.plan?.frequency ?? '约定频次'}」自动生成巡检工单，并提前 ${props.plan?.advanceDays ?? 3} 天提醒负责人。`,
        title: '开始按排期执行',
        tone: 'success',
      };
    }
    default: {
      return {
        icon: 'lucide:octagon-x',
        text: '停止后续排期生成，已生成的工单继续保留；如需再次执行，可复制为草稿重新配置。',
        title: '终止后不可恢复',
        tone: 'danger',
      };
    }
  }
});
</script>

<template>
  <Modal
    v-model:open="open"
    :closable="!busy"
    :footer="null"
    :width="440"
    wrap-class-name="icm-modal"
  >
    <template #title>
      <div class="icm__head">
        <span class="icm__icon" :class="{ 'is-danger': isStop }">
          <Icon :icon="isStop ? 'lucide:octagon-x' : 'lucide:repeat-2'" />
        </span>
        <div class="icm__heading">
          <h3>确认将计划设为「{{ target }}」？</h3>
          <p>变更将记录到计划变更日志</p>
        </div>
      </div>
    </template>

    <!-- 计划摘要 -->
    <section class="icm__plan">
      <span class="icm__plan-chip">
        <Icon icon="lucide:calendar-clock" />
      </span>
      <div class="icm__plan-meta">
        <b :title="plan?.name">{{ plan?.name }}</b>
        <small>{{ plan?.id }} · {{ plan?.customer }}</small>
      </div>
      <span class="icm__plan-extra">
        {{ plan?.frequency }} · {{ plan?.owner }}
      </span>
    </section>

    <!-- 状态流转 -->
    <div class="icm__flow">
      <div class="icm__state">
        <i
          :style="{ background: plan ? statusColor[plan.status] : '#98a8a1' }"
        ></i>
        <label>当前状态</label>
        <b>{{ plan?.status }}</b>
      </div>
      <span class="icm__arrow">
        <Icon icon="lucide:move-right" />
      </span>
      <div class="icm__state is-target">
        <i :style="{ background: statusColor[target] }"></i>
        <label>目标状态</label>
        <b>{{ target }}</b>
      </div>
    </div>

    <!-- 影响说明 -->
    <div class="icm__impact" :class="`is-${impact.tone}`">
      <Icon :icon="impact.icon" />
      <div>
        <b>{{ impact.title }}</b>
        <p>{{ impact.text }}</p>
      </div>
    </div>

    <!-- 操作区 -->
    <footer class="icm__footer">
      <Button :disabled="busy" @click="open = false">取消</Button>
      <Button
        type="primary"
        :class="{ 'is-danger': isStop }"
        :loading="busy"
        @click="emit('confirm')"
      >
        <Icon :icon="isStop ? 'lucide:octagon-x' : 'lucide:check'" />
        确认{{ isStop ? '终止' : '变更' }}
      </Button>
    </footer>
  </Modal>
</template>

<style scoped>
/* ============ 标题区 ============ */
.icm__head {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icm__icon {
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

.icm__icon svg {
  width: 20px;
  height: 20px;
}

.icm__icon.is-danger {
  background: linear-gradient(135deg, #b42318, #d92d20);
  box-shadow: 0 4px 10px rgb(180 35 24 / 22%);
}

.icm__heading h3 {
  margin: 0;
  font-size: 15.5px;
  font-weight: 700;
  color: #10231f;
}

.icm__heading p {
  margin: 2px 0 0;
  font-size: 11.5px;
  color: #8a9a93;
}

/* ============ 计划摘要 ============ */
.icm__plan {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 11px 12px;
  margin-bottom: 12px;
  background: #f7faf8;
  border: 1px solid #e2eae6;
  border-radius: 10px;
}

.icm__plan-chip {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 36px;
  font-size: 18px;
  color: #2b8577;
  background: #e9f4f2;
  border-radius: 8px;
}

.icm__plan-meta {
  flex: 1;
  min-width: 0;
}

.icm__plan-meta b {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: #10231f;
  white-space: nowrap;
}

.icm__plan-meta small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #84948d;
}

.icm__plan-extra {
  flex: none;
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #6d827b;
  white-space: nowrap;
}

/* ============ 状态流转 ============ */
.icm__flow {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px dashed #cfe6dc;
  border-radius: 10px;
}

.icm__state {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.icm__state label {
  font-size: 10.5px;
  color: #84948d;
}

.icm__state b {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13.5px;
  font-weight: 700;
  color: #10231f;
}

.icm__state i {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.icm__state.is-target b {
  color: #0b6e65;
}

.icm__arrow {
  display: inline-flex;
  flex: none;
  align-items: center;
  color: #9db3ab;
}

.icm__arrow svg {
  width: 22px;
  height: 22px;
}

/* ============ 影响说明 ============ */
.icm__impact {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  margin-bottom: 4px;
  border-radius: 10px;
}

.icm__impact > svg {
  flex: none;
  width: 15px;
  height: 15px;
  margin-top: 2px;
}

.icm__impact b {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
}

.icm__impact p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
}

.icm__impact.is-info {
  color: #145d43;
  background: #eef7f3;
  border: 1px solid #cfe6dc;
}

.icm__impact.is-success {
  color: #166534;
  background: #f0faf3;
  border: 1px solid #bfe4cd;
}

.icm__impact.is-warning {
  color: #92610a;
  background: #fffaf0;
  border: 1px solid #f3e3bd;
}

.icm__impact.is-danger {
  color: #b42318;
  background: #fef3f2;
  border: 1px solid #f3c6c2;
}

/* ============ 操作区 ============ */
.icm__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 14px;
  margin-top: 10px;
  border-top: 1px solid #eef2ee;
}

.icm__footer :deep(.ant-btn) {
  display: inline-flex;
  gap: 5px;
  align-items: center;
}

.icm__footer :deep(.ant-btn svg) {
  width: 13px;
  height: 13px;
}

/* 主按钮随模块主色（弹窗挂在 body 下，需显式覆盖） */
.icm__footer :deep(.ant-btn-primary) {
  background: #176e5b;
  border-color: #176e5b;
}

.icm__footer :deep(.ant-btn-primary:not(:disabled):hover) {
  background: #145d43;
  border-color: #145d43;
}

.icm__footer :deep(.ant-btn-primary.is-danger) {
  background: #d92d20;
  border-color: #d92d20;
}

.icm__footer :deep(.ant-btn-primary.is-danger:not(:disabled):hover) {
  background: #b42318;
  border-color: #b42318;
}

/* ============ 弹窗壳体微调 ============ */
:deep(.ant-modal-header) {
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #eef2ee;
}

:deep(.ant-modal-body) {
  padding-top: 2px;
}
</style>
