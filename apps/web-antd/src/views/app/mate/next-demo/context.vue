<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button, message, Tag } from 'ant-design-vue';

const timeline = [
  {
    date: '8 月 1 日',
    dept: '销售部',
    title: '需求评审会议中向客户承诺批量导入',
    text: '承诺在本月版本中提供 Excel 批量导入能力。',
    evidence: '客户需求评审会议.mp4 · 18:12',
  },
  {
    date: '8 月 3 日',
    dept: '研发部',
    title: 'W32 开发计划未出现对应事项',
    text: '本周聚焦报价平台 V2 和客户 B 接口联调。',
    evidence: '王天豪 W32 汇报',
  },
  {
    date: '8 月 5 日',
    dept: '交付部',
    title: '交付排期中未发现批量导入安排',
    text: '当前交付计划仅包含现场打印问题复测。',
    evidence: '交付周会纪要.docx',
  },
  {
    date: '8 月 10 日',
    dept: 'AI 判断',
    title: '识别为跨部门承诺脱节',
    text: '客户承诺已持续 9 天，但研发和交付均没有形成响应记录。',
    evidence: '3 部门 · 4 份材料交叉验证',
  },
];
</script>

<template>
  <section class="context-page">
    <header>
      <div>
        <Button type="text" @click="$router.back()">
          <Icon icon="lucide:arrow-left" />
          返回洞察
        </Button>
        <div class="context-title">
          <Tag color="red">高风险 · 跨部门</Tag>
          <h1>客户批量导入承诺尚无研发与交付排期</h1>
          <p>事件 Context · 华达智能打印项目 · 已持续 9 天</p>
        </div>
      </div>
      <div>
        <Button @click="message.success('已分享给产品、销售与交付负责人')">
          <Icon icon="lucide:share-2" />
          分享
        </Button>
        <Button type="primary" @click="message.success('已发起三方协调提醒')">
          <Icon icon="lucide:users" />
          发起协调
        </Button>
      </div>
    </header>
    <div class="context-grid">
      <main>
        <section class="ai-conclusion">
          <span>
            <Icon icon="lucide:sparkles" />
            AI 管理判断
          </span>
          <h2>这不是单一员工延期，而是一项没有进入执行系统的客户承诺。</h2>
          <p>
            建议销售、研发与交付共同确认功能范围、负责人和目标日期；如持续跨周，可关联到独立目标管理。
          </p>
          <div>
            <Tag color="green">置信度 94%</Tag>
            <Tag>4 份证据</Tag>
            <Tag>3 个部门</Tag>
          </div>
        </section>
        <section class="timeline">
          <h2>事件时间线</h2>
          <article v-for="item in timeline" :key="item.date">
            <time>{{ item.date }}</time>
            <span class="timeline-dot"></span>
            <div>
              <Tag>{{ item.dept }}</Tag>
              <h3>{{ item.title }}</h3>
              <p>{{ item.text }}</p>
              <button type="button">
                <Icon icon="lucide:paperclip" />
                {{ item.evidence }}
              </button>
            </div>
          </article>
        </section>
      </main>
      <aside>
        <section>
          <h2>涉及对象</h2>
          <div class="people">
            <span>销</span>
            <div>
              <strong>销售部 · 赵琳</strong>
              <small>客户承诺发起方</small>
            </div>
          </div>
          <div class="people">
            <span>研</span>
            <div>
              <strong>研发部 · 王天豪</strong>
              <small>可能的功能负责人</small>
            </div>
          </div>
          <div class="people">
            <span>交</span>
            <div>
              <strong>交付部 · 周小曼</strong>
              <small>客户交付协同</small>
            </div>
          </div>
        </section>
        <section>
          <h2>建议管理动作</h2>
          <ol>
            <li>确认批量导入的业务边界</li>
            <li>指定唯一负责人和交付时间</li>
            <li>下周汇报自动检查是否形成安排</li>
          </ol>
          <Button block type="primary">加入下周关注</Button>
          <Button block>关联长期目标</Button>
        </section>
        <section>
          <h2>判断规则</h2>
          <p>客户承诺出现后 7 天内，相关执行部门应出现计划、任务或明确回应。</p>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.context-page {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #f5f8f7;
  border: 1px solid #d7e4df;
  border-radius: 14px;
}

.context-page > header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 20px 26px;
  background: #fff;
  border-bottom: 1px solid #dfe9e5;
}

.context-page > header > div:last-child {
  display: flex;
  gap: 8px;
}

.context-title {
  margin-top: 12px;
}

.context-title h1 {
  margin: 8px 0 4px;
  font-size: 23px;
}

.context-title p {
  margin: 0;
  color: #788c85;
}

.context-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 290px;
  gap: 16px;
  max-width: 1200px;
  padding: 20px;
  margin: auto;
}

.context-grid main {
  display: grid;
  gap: 14px;
}

.ai-conclusion {
  padding: 23px;
  color: #eafff8;
  background: #123f36;
  border-radius: 11px;
}

.ai-conclusion > span {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 10px;
  font-weight: 800;
  color: #76d6bd;
}

.ai-conclusion h2 {
  max-width: 700px;
  margin: 12px 0 8px;
  font-size: 19px;
  line-height: 1.55;
}

.ai-conclusion p {
  line-height: 1.7;
  color: #bed4cd;
}

.timeline {
  padding: 22px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 11px;
}

.timeline > h2 {
  margin: 0 0 20px;
  font-size: 17px;
}

.timeline article {
  display: grid;
  grid-template-columns: 70px 18px 1fr;
  gap: 8px;
  min-height: 120px;
}

.timeline time {
  font-size: 10px;
  color: #758a83;
}

.timeline-dot {
  position: relative;
  width: 9px;
  height: 9px;
  margin-top: 4px;
  background: #0b806f;
  border: 2px solid #d7eee7;
  border-radius: 50%;
}

.timeline-dot::after {
  position: absolute;
  top: 12px;
  left: 2px;
  width: 1px;
  height: 100px;
  content: '';
  background: #cdded8;
}

.timeline article:last-child .timeline-dot::after {
  display: none;
}

.timeline h3 {
  margin: 7px 0 5px;
  font-size: 14px;
}

.timeline p {
  margin: 0;
  color: #637970;
}

.timeline button {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 5px 7px;
  margin-top: 8px;
  font-size: 10px;
  color: #0b6e65;
  cursor: pointer;
  background: #edf5f2;
  border: 0;
  border-radius: 5px;
}

.context-grid aside {
  display: grid;
  gap: 11px;
  align-content: start;
}

.context-grid aside section {
  padding: 16px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.context-grid aside h2 {
  margin: 0 0 13px;
  font-size: 14px;
}

.people {
  display: flex;
  gap: 9px;
  align-items: center;
  margin: 10px 0;
}

.people > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #fff;
  background: #477f70;
  border-radius: 8px;
}

.people div {
  display: grid;
}

.people strong {
  font-size: 11px;
}

.people small {
  font-size: 9px;
  color: #81948d;
}

.context-grid aside ol {
  display: grid;
  gap: 9px;
  padding-left: 20px;
  font-size: 11px;
  line-height: 1.5;
  color: #506960;
}

.context-grid aside .ant-btn {
  margin-top: 7px;
}

.context-grid aside section > p {
  font-size: 11px;
  line-height: 1.7;
  color: #687e77;
}

@media (max-width: 900px) {
  .context-grid {
    grid-template-columns: 1fr;
  }

  .context-page > header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .context-title h1 {
    font-size: 20px;
  }
}
</style>
