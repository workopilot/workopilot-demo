<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Tag } from 'ant-design-vue';

const router = useRouter();
const insights = [
  {
    kind: '跨部门',
    level: '高',
    icon: 'lucide:git-pull-request-arrow',
    title: '客户批量导入承诺尚无研发与交付排期',
    desc: '销售在 8 月 1 日向客户承诺提供批量导入能力，但研发、交付连续两周没有对应工作记录。',
    meta: ['持续 9 天', '涉及 3 个部门', '4 份证据'],
    action: true,
  },
  {
    kind: '跨周承诺',
    level: '中',
    icon: 'lucide:calendar-clock',
    title: '客户 B 接口联调连续两周未完成',
    desc: '上周计划承诺完成，本周因客户环境未就绪延期；员工已补充新日期 8 月 14 日。',
    meta: ['连续 2 周', '已有解释', '等待验证'],
  },
  {
    kind: '经验规则',
    level: '中',
    icon: 'lucide:gauge',
    title: '采购到货周期超过公司 14 天标准',
    desc: '华达项目打印耗材采购已进入第 16 天，尚未出现到货记录，建议确认供应情况。',
    meta: ['超期 2 天', '制度规则命中', '采购部'],
  },
];
</script>

<template>
  <section class="insight-page">
    <header>
      <div>
        <span>WEEKLY MANAGEMENT RADAR</span>
        <h1>本周洞察</h1>
        <p>AI 从目标、跨周承诺和经营规则中发现问题，并保留完整判断依据。</p>
      </div>
      <div class="radar-score">
        <strong>3</strong>
        <span>建议介入</span>
      </div>
    </header>
    <div class="dimension-tabs">
      <button class="is-active" type="button">
        全部洞察
        <b>3</b>
      </button>
      <button type="button">
        目标型
        <b>0</b>
      </button>
      <button type="button">
        承诺型
        <b>2</b>
      </button>
      <button type="button">
        经验型
        <b>1</b>
      </button>
    </div>
    <main>
      <article
        v-for="(item, index) in insights"
        :key="item.title"
        :class="{ priority: index === 0 }"
      >
        <div class="insight-icon"><Icon :icon="item.icon" /></div>
        <div class="insight-copy">
          <div>
            <Tag :color="item.level === '高' ? 'red' : 'orange'">
              {{ item.level }}风险
            </Tag>
            <span>{{ item.kind }}</span>
          </div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.desc }}</p>
          <footer>
            <span v-for="meta in item.meta" :key="meta">{{ meta }}</span>
          </footer>
        </div>
        <Button
          v-if="item.action"
          type="primary"
          @click="
            router.push(
              '/app/mate/employee/insight-copilot/context/huada-import',
            )
          "
        >
          查看 Context
          <Icon icon="lucide:arrow-right" />
        </Button>
        <Button v-else>查看依据</Button>
      </article>
    </main>
  </section>
</template>

<style scoped>
.insight-page {
  width: 100%;
  height: 100%;
  padding: 26px;
  overflow: auto;
  background: #f6f9f8;
  border: 1px solid #d7e4df;
  border-radius: 14px;
}

.insight-page > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
}

.insight-page header > div > span {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.insight-page h1 {
  margin: 6px 0;
  font-size: 26px;
}

.insight-page header p {
  margin: 0;
  color: #677e76;
}

.radar-score {
  display: grid !important;
  place-items: center;
  width: 80px;
  height: 80px;
  background: #fff2e2;
  border: 1px solid #f1d2a9;
  border-radius: 50%;
}

.radar-score strong {
  font-size: 27px;
}

.radar-score span {
  font-size: 9px !important;
  color: #a35f1f !important;
  letter-spacing: 0 !important;
}

.dimension-tabs {
  display: flex;
  gap: 5px;
  padding: 5px;
  margin-bottom: 14px;
  background: #e9f0ed;
  border-radius: 9px;
}

.dimension-tabs button {
  padding: 8px 13px;
  color: #5e756d;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

.dimension-tabs button.is-active {
  color: #17483d;
  background: #fff;
}

.dimension-tabs b {
  padding: 1px 5px;
  margin-left: 5px;
  font-size: 9px;
  background: #dbe8e3;
  border-radius: 10px;
}

.insight-page main {
  display: grid;
  gap: 10px;
}

.insight-page main article {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 20px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}

.insight-page main article.priority {
  border-left: 4px solid #d97831;
}

.insight-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 21px;
  color: #0b806f;
  background: #e3f1ed;
  border-radius: 10px;
}

.insight-copy {
  flex: 1;
  min-width: 0;
}

.insight-copy > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.insight-copy > div span {
  font-size: 10px;
  color: #82958e;
}

.insight-copy h2 {
  margin: 8px 0 5px;
  font-size: 15px;
}

.insight-copy p {
  margin: 0;
  line-height: 1.6;
  color: #637970;
}

.insight-copy footer {
  display: flex;
  gap: 7px;
  margin-top: 11px;
}

.insight-copy footer span {
  padding: 3px 7px;
  font-size: 9px;
  color: #587069;
  background: #f0f5f3;
  border-radius: 5px;
}

.insight-page main article > .ant-btn {
  flex: none;
}

@media (max-width: 760px) {
  .insight-page {
    padding: 16px;
  }

  .dimension-tabs {
    overflow: auto;
  }

  .insight-page main article {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .insight-copy {
    min-width: calc(100% - 70px);
  }
}
</style>
