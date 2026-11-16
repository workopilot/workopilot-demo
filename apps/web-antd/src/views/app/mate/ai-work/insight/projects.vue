<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { Progress, Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const projects = [
  {
    name: '报价平台 V2',
    progress: 72,
    status: '正常',
    owner: '李四',
    signal: '接口开发完成，进入联调',
  },
  {
    name: '华达智能打印',
    progress: 78,
    status: '关注',
    owner: '张三',
    signal: '现场效果需要连续观察',
  },
  {
    name: '客户 B 集成',
    progress: 46,
    status: '延期',
    owner: '张三',
    signal: '测试环境未就绪',
  },
];
</script>
<template>
  <AiWorkPage
    eyebrow="PROJECT INTELLIGENCE"
    title="项目洞察"
    description="从周报和工作记录中持续识别项目进展与阻塞"
  >
    <div class="cards">
      <article v-for="item in projects" :key="item.name">
        <header>
          <h3>{{ item.name }}</h3>
          <Tag
            :color="
              item.status === '正常'
                ? 'green'
                : item.status === '关注'
                  ? 'orange'
                  : 'red'
            "
          >
            {{ item.status }}
          </Tag>
        </header>
        <Progress :percent="item.progress" stroke-color="#0b806f" />
        <p>{{ item.signal }}</p>
        <footer>负责人 {{ item.owner }}</footer>
      </article>
    </div>
  </AiWorkPage>
</template>
<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.cards article {
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 16px;
}

.cards header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cards h3 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #173c34;
}

.cards p {
  font-size: 12px;
  color: #5f746c;
}

.cards footer {
  font-size: 10px;
  color: #82918c;
}
</style>
