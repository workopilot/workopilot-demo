<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { reactive } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Select, Switch, Tag } from 'ant-design-vue';

import AiWorkPage from '../components/ai-work-page.vue';

const config = reactive({
  enabled: true,
  collectDay: '周五',
  collectTime: '16:30',
  deadline: '18:00',
  reminder: true,
  timezone: 'Asia/Shanghai',
});
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="ADMIN CONFIG"
    title="周报周期"
    description="配置组织周报的生成、提交与提醒节奏"
  >
    <template #actions>
      <Tag color="green">运行中</Tag>
      <Button type="primary" @click="message.success('周报周期配置已保存')">
        <Icon icon="lucide:save" />
        保存配置
      </Button>
    </template>
    <div class="settings-layout">
      <main>
        <section>
          <header>
            <div>
              <Icon icon="lucide:calendar-range" />
              <span>
                <h3>基础周期</h3>
                <p>统一设置周报周期与时区</p>
              </span>
            </div>
            <Switch v-model:checked="config.enabled" />
          </header>
          <div class="form-grid">
            <label>
              周期类型
              <Select
                value="每周"
                :options="[{ label: '每周', value: '每周' }]"
              />
            </label>
            <label>
              组织时区
              <Select
                v-model:value="config.timezone"
                :options="[{ label: 'Asia/Shanghai', value: 'Asia/Shanghai' }]"
              />
            </label>
          </div>
        </section>
        <section>
          <header>
            <div>
              <Icon icon="lucide:wand-sparkles" />
              <span>
                <h3>AI 汇总时间</h3>
                <p>自动读取本周期事实记录并生成草稿</p>
              </span>
            </div>
          </header>
          <div class="form-grid">
            <label>
              生成日期
              <Select
                v-model:value="config.collectDay"
                :options="
                  ['周四', '周五'].map((value) => ({ label: value, value }))
                "
              />
            </label>
            <label>
              生成时间
              <Input v-model:value="config.collectTime" />
            </label>
          </div>
        </section>
        <section>
          <header>
            <div>
              <Icon icon="lucide:bell-ring" />
              <span>
                <h3>提交提醒</h3>
                <p>对未提交成员发送应用内提醒</p>
              </span>
            </div>
            <Switch v-model:checked="config.reminder" />
          </header>
          <div class="form-grid">
            <label>
              提交截止
              <Input v-model:value="config.deadline" />
            </label>
            <label>
              升级提醒
              <Select
                value="截止前 30 分钟"
                :options="[
                  { label: '截止前 30 分钟', value: '截止前 30 分钟' },
                ]"
              />
            </label>
          </div>
        </section>
      </main>
      <aside>
        <h3>本周执行预览</h3>
        <div class="timeline">
          <p>
            <b>1</b>
            <span>
              <strong>周五 16:30</strong>
              <small>AI 自动汇总工作记录</small>
            </span>
          </p>
          <p>
            <b>2</b>
            <span>
              <strong>周五 17:00</strong>
              <small>提醒成员检查并完善周报</small>
            </span>
          </p>
          <p>
            <b>3</b>
            <span>
              <strong>周五 18:00</strong>
              <small>提交截止，进入主管审核</small>
            </span>
          </p>
          <p>
            <b>4</b>
            <span>
              <strong>周一 10:00</strong>
              <small>形成团队分析与复盘</small>
            </span>
          </p>
        </div>
        <footer>
          <Icon icon="lucide:info" />
          保存后将在下一周期生效
        </footer>
      </aside>
    </div>
  </AiWorkPage>
</template>

<style scoped>
.settings-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 14px;
}

.settings-layout main {
  display: grid;
  gap: 12px;
}

.settings-layout section,
.settings-layout aside {
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.settings-layout section header,
.settings-layout section header > div {
  display: flex;
  align-items: center;
}

.settings-layout section header {
  justify-content: space-between;
}

.settings-layout section header > div {
  gap: 10px;
}

.settings-layout section header svg {
  font-size: 20px;
  color: #0b806f;
}

.settings-layout h3 {
  margin: 0;
  font-size: 14px;
  color: #173c34;
}

.settings-layout p {
  margin: 3px 0 0;
  font-size: 10px;
  color: #7a8b85;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 13px;
  margin-top: 13px;
  border-top: 1px solid #edf2f0;
}

.form-grid label {
  display: grid;
  gap: 7px;
  font-size: 11px;
  color: #4d6860;
}

.settings-layout aside h3 {
  margin-bottom: 18px;
}

.timeline {
  margin-left: 13px;
  border-left: 1px solid #c9ded7;
}

.timeline p {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 10px;
  margin: 0 0 20px -13px;
}

.timeline b {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  font-size: 10px;
  color: #fff;
  background: #0b806f;
  border-radius: 50%;
}

.timeline span {
  display: grid;
  gap: 3px;
}

.timeline strong {
  font-size: 12px;
  color: #2a4d44;
}

.timeline small {
  font-size: 10px;
  color: #798b85;
}

.settings-layout aside footer {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 10px;
  font-size: 10px;
  color: #557169;
  background: #eef7f4;
  border-radius: 10px;
}
</style>
