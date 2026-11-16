<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const customers = [
  {
    id: 'huada',
    name: '华达',
    projects: 2,
    risk: '重点关注',
    summary: '打印效果进入观察期，建议主动跟进',
  },
  {
    id: 'customer-b',
    name: '客户 B',
    projects: 1,
    risk: '依赖阻塞',
    summary: '测试环境未就绪导致接口联调延期',
  },
  {
    id: 'future-tech',
    name: '未来科技',
    projects: 2,
    risk: '稳定',
    summary: '本周进展正常，无新增风险',
  },
];
</script>
<template>
  <AiWorkPage
    eyebrow="CUSTOMER INTELLIGENCE"
    title="客户洞察"
    description="跨项目聚合客户动态、承诺与风险"
  >
    <div class="customer-list">
      <RouterLink
        v-for="item in customers"
        :key="item.id"
        :to="
          item.id === 'huada'
            ? `/app/mate/employee/weekly-analysis/customer/${item.id}`
            : ''
        "
      >
        <span class="logo"><Icon icon="lucide:building-2" /></span>
        <div>
          <header>
            <h3>{{ item.name }}</h3>
            <Tag :color="item.risk === '稳定' ? 'green' : 'orange'">
              {{ item.risk }}
            </Tag>
          </header>
          <p>{{ item.summary }}</p>
          <footer>{{ item.projects }} 个关联项目</footer>
        </div>
        <Icon icon="lucide:chevron-right" />
      </RouterLink>
    </div>
  </AiWorkPage>
</template>
<style scoped>
.customer-list {
  display: grid;
  gap: 10px;
}

.customer-list > a {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  color: inherit;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 19px;
  color: #0b7b6d;
  background: #e5f4ef;
  border-radius: 13px;
}

.customer-list header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.customer-list h3 {
  margin: 0;
  font-size: 14px;
  color: #173c34;
}

.customer-list p {
  margin: 6px 0;
  font-size: 12px;
  color: #5f746c;
}

.customer-list footer {
  font-size: 10px;
  color: #80918a;
}
</style>
