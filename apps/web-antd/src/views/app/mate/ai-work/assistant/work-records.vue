<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Select, Tag } from 'ant-design-vue';

import { aiWorkRecords } from '#/api/mock-data-ai-work';

import AiWorkPage from '../components/ai-work-page.vue';

const keyword = ref('');
const source = ref('全部来源');
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="WORK MEMORY"
    title="工作记录"
    description="AI 自动汇聚会议、项目与研发工作台中的事实记录"
  >
    <template #actions>
      <Button
        type="primary"
        @click="message.success('已同步 5 条最新工作记录')"
      >
        <Icon icon="lucide:refresh-cw" />
        同步记录
      </Button>
    </template>
    <div class="filters">
      <Input
        v-model:value="keyword"
        placeholder="搜索工作、项目或客户"
        allow-clear
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </Input>
      <Select
        v-model:value="source"
        :options="
          ['全部来源', 'AI Hub', '项目工作台', '研发工作台'].map((value) => ({
            label: value,
            value,
          }))
        "
      />
    </div>
    <div class="record-list">
      <article
        v-for="record in aiWorkRecords.filter(
          (item) =>
            !keyword || `${item.title}${item.summary}`.includes(keyword),
        )"
        :key="record.id"
      >
        <div class="date">
          <strong>{{ record.date }}</strong>
          <span>{{ record.weekday }}</span>
        </div>
        <div class="record-body">
          <header>
            <h3>{{ record.title }}</h3>
            <Tag :color="record.inReport ? 'green' : 'orange'">
              {{ record.inReport ? '已加入周报' : '待确认' }}
            </Tag>
          </header>
          <p>{{ record.summary }}</p>
          <footer>
            <span>
              <Icon icon="lucide:database" />
              {{ record.source }}
            </span>
            <span v-if="record.project">
              <Icon icon="lucide:briefcase-business" />
              {{ record.project }}
            </span>
            <span>{{ record.status }}</span>
          </footer>
        </div>
      </article>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 180px;
  gap: 10px;
  margin-bottom: 14px;
}

.record-list {
  display: grid;
  gap: 10px;
}

.record-list article {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 14px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.date {
  display: grid;
  align-content: center;
  justify-items: center;
  color: #0b7668;
  background: #e8f5f1;
  border-radius: 12px;
}

.date strong {
  font-size: 17px;
}

.date span,
footer {
  font-size: 11px;
}

.record-body header,
footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.record-body header {
  justify-content: space-between;
}

.record-body h3 {
  margin: 0;
  font-size: 14px;
  color: #163c33;
}

.record-body p {
  margin: 8px 0 11px;
  font-size: 12px;
  color: #5f736d;
}

.record-body footer {
  flex-wrap: wrap;
  color: #71857e;
}

.record-body footer span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}
</style>
