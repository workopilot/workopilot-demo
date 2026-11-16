<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Checkbox, Input, message, Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const active = ref('产品研发部');
const departments = ['产品研发部', '客户成功部', '市场营销部', '综合管理部'];
const signals = ref(['延期承诺', '客户风险', '项目阻塞', '重复问题']);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="AI ANALYSIS POLICY"
    title="部门分析策略"
    description="让不同部门按自己的业务语言识别成果、风险和关注对象"
  >
    <template #actions>
      <Button
        type="primary"
        @click="message.success('产品研发部分析策略已保存')"
      >
        <Icon icon="lucide:save" />
        保存策略
      </Button>
    </template>
    <div class="policy-layout">
      <aside>
        <h3>适用部门</h3>
        <button
          v-for="department in departments"
          :key="department"
          type="button"
          :class="{ active: active === department }"
          @click="active = department"
        >
          <Icon icon="lucide:users-round" />
          <span>{{ department }}</span>
          <Icon icon="lucide:chevron-right" />
        </button>
        <Button block>
          <Icon icon="lucide:plus" />
          新增部门策略
        </Button>
      </aside>
      <main>
        <section>
          <header>
            <div>
              <span>当前策略</span>
              <h2>{{ active }}</h2>
            </div>
            <Tag color="green">已启用</Tag>
          </header>
          <p>AI 将重点关注交付进展、项目阻塞、客户现场风险与跨周承诺兑现。</p>
        </section>
        <section>
          <header>
            <h3>重点识别信号</h3>
            <small>选择需要进入部门周复盘的信号</small>
          </header>
          <Checkbox.Group v-model:value="signals">
            <div class="signal-grid">
              <Checkbox
                v-for="item in [
                  '延期承诺',
                  '客户风险',
                  '项目阻塞',
                  '重复问题',
                  '资源冲突',
                  '质量回退',
                ]"
                :key="item"
                :value="item"
              >
                <span>{{ item }}</span>
                <small>
                  {{
                    item === '延期承诺'
                      ? '计划跨周未完成或截止日期后移'
                      : item === '客户风险'
                        ? '客户情绪、现场问题或验收风险'
                        : '从工作记录中持续识别相关信号'
                  }}
                </small>
              </Checkbox>
            </div>
          </Checkbox.Group>
        </section>
        <section>
          <header>
            <h3>关注对象权重</h3>
            <small>影响团队洞察排序</small>
          </header>
          <div class="weight-grid">
            <label>
              客户交付
              <Input value="40%" />
            </label>
            <label>
              重点项目
              <Input value="35%" />
            </label>
            <label>
              团队承诺
              <Input value="25%" />
            </label>
          </div>
        </section>
        <section>
          <header>
            <h3>部门复盘提示词</h3>
            <small>用于约束 AI 输出口径</small>
          </header>
          <Input.TextArea
            :rows="4"
            value="优先说明本周形成的可验证结果；明确区分事实、判断与建议；对延期事项给出原因、影响对象和下一节点；避免将工作数量直接等同于绩效。"
          />
        </section>
      </main>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.policy-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 14px;
}

.policy-layout > aside,
.policy-layout main > section {
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.policy-layout > aside {
  display: grid;
  gap: 7px;
  align-content: start;
}

.policy-layout > aside h3 {
  margin: 2px 5px 8px;
  font-size: 13px;
  color: #193d35;
}

.policy-layout > aside > button {
  display: grid;
  grid-template-columns: 20px 1fr 16px;
  gap: 7px;
  align-items: center;
  padding: 10px;
  color: #5c726a;
  text-align: left;
  background: #f7faf9;
  border: 0;
  border-radius: 11px;
}

.policy-layout > aside > button.active {
  font-weight: 700;
  color: #087465;
  background: #dcefe9;
}

.policy-layout main {
  display: grid;
  gap: 11px;
}

.policy-layout section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.policy-layout section header span,
.policy-layout section small {
  font-size: 10px;
  color: #788a84;
}

.policy-layout h2,
.policy-layout h3 {
  margin: 0;
  color: #173c34;
}

.policy-layout h2 {
  margin-top: 3px;
  font-size: 18px;
}

.policy-layout h3 {
  font-size: 13px;
}

.policy-layout section > p {
  margin: 9px 0 0;
  font-size: 11px;
  color: #5e746c;
}

.signal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.signal-grid :deep(.ant-checkbox-wrapper) {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  margin: 0;
  border: 1px solid #e0eae7;
  border-radius: 11px;
}

.signal-grid span {
  display: block;
  font-size: 11px;
  color: #31534a;
}

.signal-grid small {
  display: block;
  margin-top: 3px;
}

.weight-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.weight-grid label {
  display: grid;
  gap: 6px;
  font-size: 10px;
  color: #587068;
}
</style>
