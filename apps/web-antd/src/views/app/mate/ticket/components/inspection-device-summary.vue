<script setup lang="ts">
import type { InspectionPlan } from '#/types/inspection';

import { Icon } from '@iconify/vue';
import { Empty, Tag } from 'ant-design-vue';

defineProps<{ plan: InspectionPlan }>();
</script>
<template>
  <section>
    <p class="mb-4 text-sm text-slate-500">
      固定设备清单：{{ plan.devices?.length || 0 }} 台；{{
        plan.dispatchMode === 'auto'
          ? '自动派单，按负责班组匹配'
          : plan.dispatchMode === 'manual'
            ? '人工派单，进入待派单池'
            : '派单方式待确认'
      }}。
    </p>
    <Empty
      v-if="!plan.devices?.length"
      :description="
        plan.status === '草稿'
          ? '启用时通过工单助理匹配设备并确认巡检模板'
          : '尚未配置设备明细'
      "
    />
    <article
      v-for="device in plan.devices"
      :key="device.id"
      class="mb-4 overflow-hidden rounded-lg border border-slate-200"
    >
      <header
        class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3"
      >
        <h4
          class="flex items-center gap-2 text-sm font-semibold text-slate-800"
        >
          <Icon icon="lucide:scan-line" class="text-teal-700" />
          {{ device.name }}
        </h4>
        <Tag class="!m-0">{{ device.category }}</Tag>
      </header>
      <dl
        v-if="plan.status !== '草稿'"
        class="grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm xl:grid-cols-3"
      >
        <div>
          <dt class="text-xs text-slate-500">设备编号</dt>
          <dd class="mt-1 break-all">{{ device.code }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">设备型号</dt>
          <dd class="mt-1">
            {{ device.model || device.name.match(/D\d+/)?.[0] || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">所属客户</dt>
          <dd class="mt-1">{{ device.customer }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">所属项目</dt>
          <dd class="mt-1">{{ device.project }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">安装位置</dt>
          <dd class="mt-1">{{ device.location }}</dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">巡检事项</dt>
          <dd class="mt-1">
            {{ device.items.length }} 项（{{
              device.items.filter((item) => item.required).length
            }}
            项必检）
          </dd>
        </div>
      </dl>
      <details class="border-t border-slate-100 px-4 py-3">
        <summary class="cursor-pointer text-sm text-teal-800">
          查看巡检事项、检查标准及凭证要求
        </summary>
        <div
          v-for="item in device.items"
          :key="item.id"
          class="mt-3 border-t border-slate-100 pt-3 text-sm"
        >
          <b>{{ item.name }}</b>
          <Tag class="ml-2">{{ item.required ? '必检' : '选检' }}</Tag>
          <p class="mt-1 text-slate-500">标准：{{ item.standard }}</p>
          <p class="text-slate-500">凭证：{{ item.evidence }}</p>
        </div>
      </details>
    </article>
  </section>
</template>
