<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Checkbox } from 'ant-design-vue';

import CollaborationGuide from './components/collaboration-guide.vue';
import DesignWorkflow from './components/design-workflow.vue';
import EntryOverview from './components/entry-overview.vue';
import RelationshipMap from './components/relationship-map.vue';
import { acceptance, reportFlow } from './content';

import './guide.css';
import './visual-theme.css';

const router = useRouter();
const checked = ref<string[]>([]);
const activeFlow = ref(0);
const flow = computed(() => reportFlow[activeFlow.value] ?? reportFlow[0]);
const sections = [
  { id: 'entries', label: '认识三个入口' },
  { id: 'relationships', label: '理解产品关系' },
  { id: 'collaboration', label: '让员工协作' },
  { id: 'boundaries', label: '判断业务入口' },
  { id: 'design', label: '设计一项业务' },
  { id: 'loop', label: '跑通演示闭环' },
  { id: 'delivery', label: '开发与验收' },
];
function jump(id: string) {
  document.querySelector(`#guide-${id}`)?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
    block: 'start',
  });
}
</script>

<template>
  <div class="demo-guide">
    <header class="guide-topline">
      <span>
        <Icon icon="lucide:book-open" aria-hidden="true" />
        喔壳 · Demo 开发指南
      </span>
      <Button type="text" @click="router.push('/app/mate/employees')">
        进入数字员工
        <Icon icon="lucide:arrow-up-right" aria-hidden="true" />
      </Button>
    </header>
    <div class="guide-wrap">
      <section class="guide-hero">
        <div>
          <span class="eyebrow">WK DEMO / BUILDER’S GUIDE</span>
          <h1>
            从一个业务场景，
            <br />
            到一个
            <span>可演示的闭环。</span>
          </h1>
          <p>
            理解数字员工、业务菜单与应用如何协作，
            <br class="desktop-break" />
            把业务需求变成能操作、有反馈、数据相通的 Demo。
          </p>
          <Button
            class="guide-primary"
            type="primary"
            size="large"
            @click="jump('entries')"
          >
            先认识三个入口
            <Icon icon="lucide:arrow-down" aria-hidden="true" />
          </Button>
          <div class="hero-meta" aria-label="业务颜色图例">
            <span>橙 · 应用配置</span>
            <span>蓝 · 业务办理</span>
            <span>红 · 审阅审批</span>
            <span>绿 · 共享数据</span>
          </div>
        </div>
        <div
          class="hero-ecosystem"
          aria-label="知记应用支持汇报和审阅两个助理，共享报告状态"
        >
          <div class="hero-orbit-label">
            <span>一个应用，多种角色，一份业务状态</span>
            <Icon icon="lucide:sparkles" aria-hidden="true" />
          </div>
          <div class="hero-app">
            <Icon icon="lucide:blocks" aria-hidden="true" />
            <div>
              <small>配置规则与模板</small>
              <strong>知记应用</strong>
            </div>
            <span>01 APP</span>
          </div>
          <div class="hero-fork">
            <span>↓</span>
            <span>↓</span>
          </div>
          <div class="hero-assistants">
            <div class="hero-reporter">
              <Icon icon="lucide:file-pen-line" aria-hidden="true" />
              <strong>汇报助理</strong>
              <small>生成周报 · 月报</small>
            </div>
            <div class="hero-reviewer">
              <Icon icon="lucide:clipboard-check" aria-hidden="true" />
              <strong>审阅助理</strong>
              <small>审批周报 · 月报</small>
            </div>
          </div>
          <div class="hero-handoff">
            提交
            <span>→</span>
            审批
            <span>→</span>
            反馈
          </div>
          <div class="hero-state">
            <Icon icon="lucide:database" aria-hidden="true" />
            <span>同一份报告，同步状态与意见</span>
            <Icon icon="lucide:check-check" aria-hidden="true" />
          </div>
        </div>
      </section>
      <nav class="guide-nav" aria-label="开发指南章节">
        <button
          v-for="(section, index) in sections"
          :key="section.id"
          type="button"
          @click="jump(section.id)"
        >
          <small>0{{ index + 1 }}</small>
          {{ section.label }}
        </button>
      </nav>

      <section id="guide-entries" class="guide-section">
        <div class="section-heading">
          <span class="section-number">01</span>
          <div>
            <span class="eyebrow">THREE USER-FACING ENTRIES</span>
            <h2>先分清，用户看见的三个地方。</h2>
          </div>
          <p>
            数字员工下面分为“对话”和“业务菜单”，
            <br />
            应用里面是“应用菜单”，各有明确职责。
          </p>
        </div>
        <EntryOverview />
      </section>

      <section id="guide-relationships" class="guide-section">
        <div class="section-heading">
          <span class="section-number">02</span>
          <div>
            <span class="eyebrow">PRODUCT STRUCTURE</span>
            <h2>一个应用，多个助理，协作完成业务。</h2>
          </div>
          <p>
            应用提供共享能力，数字员工按角色分工。
            <br />
            每个助理都有自己的对话与业务菜单。
          </p>
        </div>
        <RelationshipMap />
        <div class="principle-row">
          <p>
            <b>按角色划分助理</b>
            <span>员工生成报告，主管审阅报告，各有入口。</span>
          </p>
          <p>
            <b>对话始终在首位</b>
            <span>进入员工后，默认打开“对话”。</span>
          </p>
          <p>
            <b>菜单承接持续操作</b>
            <span>按业务对象或结果命名，如“我的会议”。</span>
          </p>
        </div>
      </section>

      <section id="guide-collaboration" class="guide-section">
        <div class="section-heading">
          <span class="section-number">03</span>
          <div>
            <span class="eyebrow">CONNECTED DIGITAL EMPLOYEES</span>
            <h2>下一步，让另一位数字员工接着帮你。</h2>
          </div>
          <p>
            从当前业务出发，推荐关联员工与具体动作。
            <br />
            点击下方示例，体验一次带着上下文的交接。
          </p>
        </div>
        <CollaborationGuide />
      </section>

      <section id="guide-boundaries" class="guide-section">
        <div class="section-heading">
          <span class="section-number">04</span>
          <div>
            <span class="eyebrow">ENTRY DECISION</span>
            <h2>这个功能，应该放在哪里？</h2>
          </div>
        </div>
        <div class="decision-map">
          <div class="decision-question">
            <Icon icon="lucide:split" aria-hidden="true" />
            <strong>用户正在做什么？</strong>
            <span>看业务目的，决定入口</span>
          </div>
          <div class="decision-branches">
            <article>
              <small>办理一笔业务 ↓</small>
              <h3>数字员工</h3>
              <p>预约、查询、提交、改期、处理</p>
              <div>
                对话
                <span>↔</span>
                业务列表 / 详情 / 表单
              </div>
              <footer>例：取消明天下午的一场会议</footer>
            </article>
            <article>
              <small>配置业务如何运行 ↓</small>
              <h3>应用</h3>
              <p>资源、规则、模板、权限</p>
              <div>由业务管理员统一维护</div>
              <footer>例：设置会议室的可预约时段</footer>
            </article>
            <article>
              <small>只影响我自己的偏好 ↓</small>
              <h3>个人设置</h3>
              <p>个人提醒、偏好与展示方式</p>
              <div>在个人范围内生效</div>
              <footer>例：设置我接收提醒的方式</footer>
            </article>
          </div>
        </div>
        <p class="guide-note">
          <Icon icon="lucide:lightbulb" aria-hidden="true" />
          页面使用聊天、表格还是表单，不决定业务归属。管理员办理自己的日常业务时，也通过数字员工进入。
        </p>
      </section>

      <section id="guide-design" class="guide-section">
        <div class="section-heading">
          <span class="section-number">05</span>
          <div>
            <span class="eyebrow">DESIGN → BUILD</span>
            <h2>从需求开始，走过八个步骤。</h2>
          </div>
          <p>点击步骤，查看要回答的问题与阶段产出。</p>
        </div>
        <DesignWorkflow />
      </section>

      <section id="guide-loop" class="guide-section">
        <div class="section-heading">
          <span class="section-number">06</span>
          <div>
            <span class="eyebrow">A COMPLETE BUSINESS LOOP</span>
            <h2>从生成到审批，让两个助理真正协作。</h2>
          </div>
          <p>
            教学案例 · 展示最低验收目标
            <br />
            知记应用 · 周报 / 月报协作示例
          </p>
        </div>
        <div class="loop-panel">
          <div
            class="loop-steps"
            role="group"
            aria-label="知记报告协作闭环步骤"
          >
            <button
              v-for="(step, index) in reportFlow"
              :key="step.title"
              type="button"
              :aria-pressed="activeFlow === index"
              :class="{ selected: activeFlow === index }"
              @click="activeFlow = index"
            >
              <span><Icon :icon="step.icon" aria-hidden="true" /></span>
              <small>0{{ index + 1 }}</small>
              <strong>{{ step.title }}</strong>
            </button>
          </div>
          <div class="loop-return">
            <Icon icon="lucide:corner-up-left" aria-hidden="true" />
            更新同一份业务状态，再次查询得到最新结果
          </div>
          <div class="loop-detail" aria-live="polite">
            <div>
              <span class="eyebrow">{{ flow.actor }}</span>
              <h3>{{ flow.title }}</h3>
              <p>{{ flow.detail }}</p>
            </div>
            <div class="expected-result">
              <Icon icon="lucide:circle-check" aria-hidden="true" />
              <small>应观察到的结果</small>
              <strong>{{ flow.result }}</strong>
            </div>
          </div>
          <div class="exception-path">
            <Icon icon="lucide:git-branch" aria-hidden="true" />
            <b>异常也要走通</b>
            <span>缺少信息 → 补充确认</span>
            <span>审批退回 → 按意见修改、重新提交</span>
            <span>权限不符 → 说明范围、联系管理员</span>
          </div>
        </div>
      </section>

      <section id="guide-delivery" class="guide-section">
        <div class="section-heading">
          <span class="section-number">07</span>
          <div>
            <span class="eyebrow">IMPLEMENTATION & ACCEPTANCE</span>
            <h2>让演示落到代码与验证。</h2>
          </div>
        </div>
        <div class="delivery-grid">
          <article class="implementation-panel">
            <span class="eyebrow">统一数据，分层实现</span>
            <h3>一次操作，所有入口可见。</h3>
            <div class="code-flow">
              <span>对话 / 列表 / 详情 / 表单</span>
              <b>↓ 共用业务方法</b>
              <code>src/api/&lt;domain&gt;.ts</code>
              <b>↓ 读写同一份状态</b>
              <code>src/api/mock-data-&lt;domain&gt;.ts</code>
              <small>类型定义：src/types/&lt;domain&gt;.ts</small>
            </div>
            <p>
              复用
              <code>createMockResponse</code>
              与
              <code>mockDelay</code>
              ，返回
              <code>{ code, data, message }</code>
              。主要操作必须更新记录，失败时返回明确原因。
            </p>
            <details>
              <summary>查看工程约定与验证命令</summary>
              <ul>
                <li>Vue 3 + TypeScript + Vben Admin 5 + Ant Design Vue。</li>
                <li>页面放在业务目录，组件、弹窗和业务逻辑按职责拆分。</li>
                <li>
                  Mate 页面挂载在 core.ts
                  独立用户端，同步员工注册、菜单及默认跳转。
                </li>
                <li>
                  复用现有布局和 Lucide 图标，不修改 packages/@core/ 或
                  views/_core/。
                </li>
                <li>
                  模拟意图与执行过程即可，无需引入真实后端、数据库或大模型。
                </li>
              </ul>
              <code class="command-block">
                pnpm dev:antd
                <br />
                pnpm build:antd
                <br />
                pnpm check:type
              </code>
            </details>
          </article>
          <article class="acceptance-panel">
            <div class="checklist-title">
              <div>
                <span class="eyebrow">交付前，逐项检查</span>
                <h3>你的 Demo 准备好了吗？</h3>
              </div>
              <span class="check-count" aria-live="polite">
                {{ checked.length }} / {{ acceptance.length }}
              </span>
            </div>
            <div
              class="check-progress"
              role="progressbar"
              aria-label="验收完成度"
              :aria-valuenow="checked.length"
              :aria-valuemax="acceptance.length"
              :aria-valuemin="0"
            >
              <span
                :style="{
                  width: `${(checked.length / acceptance.length) * 100}%`,
                }"
              ></span>
            </div>
            <Checkbox.Group v-model:value="checked" class="acceptance-list">
              <Checkbox v-for="item in acceptance" :key="item" :value="item">
                {{ item }}
              </Checkbox>
            </Checkbox.Group>
            <div class="checklist-bottom">
              <span aria-live="polite">
                {{
                  checked.length === acceptance.length
                    ? '检查项已全部勾选，请保留实际验证记录。'
                    : '勾选仅用于本次自查，离开页面后重置。'
                }}
              </span>
              <Button
                type="text"
                size="small"
                :disabled="checked.length === 0"
                @click="checked = []"
              >
                重置
              </Button>
            </div>
          </article>
        </div>
      </section>
      <section class="guide-summary" aria-labelledby="guide-summary-title">
        <span class="eyebrow">记住这三个关系</span>
        <h2 id="guide-summary-title">一个业务应用可以包括多个数字员工。</h2>
        <div>
          <p>
            <Icon icon="lucide:bot" aria-hidden="true" />
            <span>
              数字员工菜单承载
              <strong>业务处理</strong>
              <small>包括对话与业务菜单，共同完成日常办理。</small>
            </span>
          </p>
          <p>
            <Icon icon="lucide:blocks" aria-hidden="true" />
            <span>
              应用菜单承载
              <strong>业务设置</strong>
              <small>统一维护资源、规则、模板与权限。</small>
            </span>
          </p>
        </div>
      </section>
      <footer class="guide-footer">
        <div>
          <Icon icon="lucide:book-open-check" aria-hidden="true" />
          <span>
            依据《喔壳 Demo 开发规范》V1.0 编写
            <small>规范位置：docs/Demo开发规范.md · 当前用户要求优先</small>
          </span>
        </div>
        <button type="button" @click="jump('entries')">
          回到三个入口
          <Icon icon="lucide:arrow-up" aria-hidden="true" />
        </button>
      </footer>
    </div>
  </div>
</template>
