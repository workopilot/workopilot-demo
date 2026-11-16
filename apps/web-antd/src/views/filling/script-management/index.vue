<script setup lang="ts">
import { Card } from 'ant-design-vue';
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="mb-8">
      <h1 class="mb-2 text-2xl font-bold text-slate-900">填报脚本管理</h1>
      <p class="text-slate-500">管理智能填报的自动化脚本</p>
    </div>

    <Card
      class="flex min-h-[400px] items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50"
    >
      <div class="text-center text-slate-400">
        <div class="mb-4 text-6xl">📜</div>
        <div class="text-lg font-medium">脚本管理区域</div>
        <div class="mt-2 text-sm">待设计与开发</div>
      </div>
    </Card>
  </div>
</template>
