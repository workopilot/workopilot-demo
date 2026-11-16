<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { Table, Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const rows = [
  {
    id: 1,
    cycle: '2026 第 32 周',
    task: '生成个人周报草稿',
    time: '08/07 16:30',
    result: '成功',
    count: '24/25',
  },
  {
    id: 2,
    cycle: '2026 第 32 周',
    task: '发送提交提醒',
    time: '08/07 17:00',
    result: '成功',
    count: '8 人',
  },
  {
    id: 3,
    cycle: '2026 第 31 周',
    task: '生成团队周复盘',
    time: '08/03 10:00',
    result: '成功',
    count: '4 部门',
  },
];
</script>
<template>
  <AiWorkPage
    eyebrow="EXECUTION LOG"
    title="执行记录"
    description="查看 AI Work 周期任务的运行结果"
  >
    <Table :data-source="rows" :pagination="false" row-key="id">
      <Table.Column title="周期" data-index="cycle" />
      <Table.Column title="任务" data-index="task" />
      <Table.Column title="执行时间" data-index="time" />
      <Table.Column title="影响对象" data-index="count" />
      <Table.Column title="结果">
        <template #default="{ record }">
          <Tag color="green">{{ record.result }}</Tag>
        </template>
      </Table.Column>
    </Table>
  </AiWorkPage>
</template>
