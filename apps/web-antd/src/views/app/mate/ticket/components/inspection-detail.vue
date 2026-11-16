<script setup lang="ts">
import type { InspectionPlan } from '#/types/inspection';

import { Descriptions } from 'ant-design-vue';

defineProps<{ plan: InspectionPlan }>();
</script>
<template>
  <Descriptions bordered :column="2" size="small">
    <Descriptions.Item v-if="plan.contractText" label="合同原始信息" :span="2">
      <span class="whitespace-pre-line">{{ plan.contractText }}</span>
    </Descriptions.Item>
    <Descriptions.Item label="关联合同" :span="2">
      {{ plan.contract }}
    </Descriptions.Item>
    <Descriptions.Item label="客户">{{ plan.customer }}</Descriptions.Item>
    <Descriptions.Item label="项目">{{ plan.project }}</Descriptions.Item>
    <Descriptions.Item label="服务期限" :span="2">
      {{ plan.start }} 至 {{ plan.end }}
    </Descriptions.Item>
    <Descriptions.Item label="巡检范围" :span="2">
      {{ plan.scope }}
    </Descriptions.Item>
    <Descriptions.Item label="检查标准与记录要求" :span="2">
      {{ plan.requirements }}
    </Descriptions.Item>
    <Descriptions.Item label="合同巡检条款" :span="2">
      按约定周期完成设备巡检，提交巡检报告及现场照片（演示条款）。
    </Descriptions.Item>
    <Descriptions.Item label="巡检频次">{{ plan.frequency }}</Descriptions.Item>
    <Descriptions.Item label="排期规则">
      以执行记录中的日期为准，遇节假日保持原日期
    </Descriptions.Item>
    <Descriptions.Item label="负责人">{{ plan.owner }}</Descriptions.Item>
    <Descriptions.Item label="执行班组">{{ plan.team }}</Descriptions.Item>
    <Descriptions.Item label="工单生成" :span="2">
      巡检前 {{ plan.advanceDays }} 天生成工单（前端演示规则）
    </Descriptions.Item>
  </Descriptions>
</template>
