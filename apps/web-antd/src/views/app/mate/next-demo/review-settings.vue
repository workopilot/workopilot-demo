<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Select, Switch, Tabs } from 'ant-design-vue';

type StrategyGroup = {
  enabled: boolean;
  id: string;
  name: string;
  positions: string[];
  prompt: string;
};
type ReportTemplateConfig = {
  cards: boolean;
  charts: boolean;
  departments: string[];
  description: string;
  enabled: boolean;
  id: string;
  name: string;
  navigation: boolean;
  prompt: string;
  theme: string;
};
const activeSettingsTab = ref('review-rules');
const positionOptions = [
  '产品经理',
  '项目经理',
  '前端工程师',
  '后端工程师',
  '算法工程师',
  '测试工程师',
  '销售经理',
  '售前顾问',
  '交付经理',
  '客户成功经理',
].map((value) => ({ label: value, value }));
const departmentOptions = [
  '产品研发部',
  '产品部',
  '设计部',
  '销售部',
  '售前部',
  '交付部',
  '测试部',
].map((value) => ({ label: value, value }));
const themeOptions = [
  { label: '企业深绿', value: 'enterprise-green' },
  { label: '项目蓝', value: 'project-blue' },
  { label: '复盘暖棕', value: 'retrospective-brown' },
];
const ruleGroups = ref<StrategyGroup[]>([
  {
    id: 'product-project',
    name: '产品与项目岗位策略',
    positions: ['产品经理', '项目经理'],
    enabled: true,
    prompt:
      '你是产品与项目岗位的周报分析助手。重点检查：上周计划是否承接；需求目标和用户价值是否清晰；里程碑、优先级与跨部门依赖是否明确；延期项是否说明原因、新日期、负责人和支持需求。输出建议评分、整体评价、需要关注、风险、需要追问和建议回复。',
  },
  {
    id: 'engineering',
    name: '研发工程岗位策略',
    positions: ['前端工程师', '后端工程师', '算法工程师'],
    enabled: true,
    prompt:
      '你是研发工程岗位的周报分析助手。重点检查：研发成果是否有联调、测试或发布闭环；技术产出是否说明业务价值；缺陷、技术债和阻塞是否可追溯；延期项是否给出原因、新日期和负责人。输出建议评分、整体评价、需要关注、风险、需要追问和建议回复。',
  },
  {
    id: 'quality',
    name: '测试岗位策略',
    positions: ['测试工程师'],
    enabled: true,
    prompt:
      '你是测试岗位的周报分析助手。重点检查：测试范围、用例覆盖、缺陷分布和回归结果；阻塞问题是否有责任人和修复时间；上线条件和质量风险是否给出明确结论。输出建议评分、整体评价、需要关注、风险、需要追问和建议回复。',
  },
  {
    id: 'sales-presales',
    name: '销售与售前岗位策略',
    positions: ['销售经理', '售前顾问'],
    enabled: true,
    prompt:
      '你是销售与售前岗位的周报分析助手。重点检查：客户推进阶段是否变化；承诺事项是否进入研发或交付排期；商机、报价与续费风险；跨部门依赖是否有负责人和时间。输出建议评分、整体评价、需要关注、风险、需要追问和建议回复。',
  },
  {
    id: 'delivery-success',
    name: '交付与客户成功岗位策略',
    positions: ['交付经理', '客户成功经理'],
    enabled: true,
    prompt:
      '你是交付与客户成功岗位的周报分析助手。重点检查：项目里程碑、验收状态、客户阻塞、延期归因、新完成时间与协同诉求；识别连续跨周未完成事项和客户满意度风险，并给出追问建议。',
  },
]);
const activeId = ref(ruleGroups.value[0]!.id);
const activeGroup = computed(
  () => ruleGroups.value.find((item) => item.id === activeId.value)!,
);
const preSubmitEnabled = ref(true);
const preSubmitPrompt = ref(
  '你是员工周报提交前检查助手。检查内容完整度、上周计划承接、本周成果、问题风险和下周计划。下周计划必须尽量包含负责人、完成时间与验收标准。仅给出补充与优化建议，不做主管评价，不判断通过或拒绝。输出完整度百分比、等级评价、缺失项和可一键采纳的修改建议。',
);
const reportTemplates = ref<ReportTemplateConfig[]>([
  {
    id: 'management',
    name: '管理周报',
    departments: ['产品研发部', '产品部', '设计部', '测试部'],
    description: '突出关键成果、风险、需要支持和下周计划，适合主管快速审阅。',
    theme: 'enterprise-green',
    enabled: true,
    navigation: true,
    cards: true,
    charts: true,
    prompt:
      '根据员工 Markdown 周报生成独立 HTML。保留事实和数据，结论优先；突出本周成果、上周计划承接、风险、需要支持和下周计划。使用企业深绿色主题，提供页内导航、成果卡片和进度图表；不得虚构原文中不存在的数据。',
  },
  {
    id: 'project',
    name: '项目进展',
    departments: ['交付部', '销售部', '售前部'],
    description: '围绕里程碑、客户进展、阻塞与跨部门依赖组织内容。',
    theme: 'project-blue',
    enabled: true,
    navigation: true,
    cards: true,
    charts: true,
    prompt:
      '根据 Markdown 生成项目进展型 HTML 周报。以项目和客户为主线，突出里程碑状态、风险、阻塞、责任人和下一检查时间，使用低饱和项目蓝主题。',
  },
  {
    id: 'retrospective',
    name: '复盘长文',
    departments: [],
    description: '适合阶段复盘和经验沉淀，强调阅读节奏与上下文。',
    theme: 'retrospective-brown',
    enabled: false,
    navigation: true,
    cards: true,
    charts: false,
    prompt:
      '根据 Markdown 生成适合深度阅读的复盘型 HTML。保留完整上下文，突出经验、决策依据、问题与改进建议，使用克制的暖棕配色。',
  },
]);
const activeTemplateId = ref(reportTemplates.value[0]!.id);
const activeReportTemplate = computed(
  () =>
    reportTemplates.value.find((item) => item.id === activeTemplateId.value)!,
);

function addRuleGroup() {
  const id = `rule-${Date.now()}`;
  ruleGroups.value.push({
    id,
    name: '新岗位审核策略',
    positions: [],
    enabled: true,
    prompt:
      '请描述该岗位审核时需要关注的职责成果、风险规则、跨周比较方式和追问逻辑。',
  });
  activeId.value = id;
}
function removeGroup() {
  if (ruleGroups.value.length === 1) {
    message.warning('至少保留一个岗位审核策略');
    return;
  }
  ruleGroups.value = ruleGroups.value.filter(
    (item) => item.id !== activeId.value,
  );
  activeId.value = ruleGroups.value[0]!.id;
  message.success('岗位策略已删除');
}
function addReportTemplate() {
  const id = `template-${Date.now()}`;
  reportTemplates.value.push({
    id,
    name: '新周报模板',
    departments: [],
    description: '请说明模板的适用场景和阅读对象。',
    theme: 'enterprise-green',
    enabled: true,
    navigation: true,
    cards: true,
    charts: false,
    prompt: '请配置系统生成 HTML 周报时使用的内容组织、版式和视觉规则。',
  });
  activeTemplateId.value = id;
}
function saveSettings() {
  if (
    activeSettingsTab.value === 'review-rules' &&
    activeGroup.value.positions.length === 0
  ) {
    message.warning('请至少选择一个适用岗位');
    return;
  }
  message.success(
    activeSettingsTab.value === 'report-template'
      ? '周报模板配置已保存'
      : '岗位审核策略已保存',
  );
}
</script>

<template>
  <div class="review-settings-page">
    <header class="settings-hero">
      <div>
        <span>REVIEW CONFIGURATION</span>
        <h1>审核设置</h1>
        <p>按岗位管理审核策略，并集中配置员工提交前检查和系统内置周报模板。</p>
      </div>
      <Button class="save-primary" @click="saveSettings">
        <Icon icon="lucide:save" />
        保存设置
      </Button>
    </header>
    <Tabs v-model:active-key="activeSettingsTab" class="settings-tabs">
      <Tabs.TabPane key="review-rules" tab="岗位审核策略">
        <div class="settings-layout">
          <aside class="rule-groups">
            <header>
              <div>
                <strong>岗位审核策略组</strong>
                <small>{{ ruleGroups.length }} 个策略组</small>
              </div>
              <Button
                type="text"
                aria-label="新建岗位审核策略"
                @click="addRuleGroup"
              >
                <Icon icon="lucide:plus" />
              </Button>
            </header>
            <button
              v-for="group in ruleGroups"
              :key="group.id"
              type="button"
              :class="{ active: group.id === activeId }"
              @click="activeId = group.id"
            >
              <span><Icon icon="lucide:badge-check" /></span>
              <div>
                <b>{{ group.name }}</b>
                <small>
                  {{
                    group.positions.length > 0
                      ? group.positions.join('、')
                      : '尚未选择岗位'
                  }}
                </small>
              </div>
              <em :class="{ off: !group.enabled }">
                {{ group.enabled ? '启用' : '停用' }}
              </em>
            </button>
          </aside>
          <main class="settings-editor">
            <section class="config-card">
              <header>
                <div>
                  <span>
                    <Icon icon="lucide:scan-text" />
                    岗位审核分析
                  </span>
                  <h2>岗位审核策略组</h2>
                  <p>不同岗位使用不同关注标准；同类岗位可以共用一组策略。</p>
                </div>
                <Switch
                  v-model:checked="activeGroup.enabled"
                  checked-children="启用"
                  un-checked-children="停用"
                />
              </header>
              <div class="field-grid">
                <label>
                  <span>策略组名称</span>
                  <Input v-model:value="activeGroup.name" size="large" />
                </label>
                <label>
                  <span>适用岗位（可多选）</span>
                  <Select
                    v-model:value="activeGroup.positions"
                    mode="multiple"
                    :options="positionOptions"
                    size="large"
                    placeholder="选择一个或多个岗位"
                  />
                </label>
              </div>
              <div class="position-match-note">
                <Icon icon="lucide:route" />
                <div>
                  <b>岗位匹配顺序</b>
                  <p>
                    先应用员工主岗位策略，再叠加副岗位特有关注项；未匹配时使用系统默认策略。
                  </p>
                </div>
                <span>部门仅用于权限与人员分组</span>
              </div>
              <label class="prompt-field">
                <span>AI 审核分析提示词</span>
                <small>
                  建议明确岗位职责、关注维度、风险规则、跨周比较方式，以及输出结构。
                </small>
                <Input.TextArea v-model:value="activeGroup.prompt" :rows="10" />
              </label>
              <footer>
                <Button danger @click="removeGroup">
                  <Icon icon="lucide:trash-2" />
                  删除策略组
                </Button>
                <div>
                  <span>输出结构：</span>
                  <b>建议评分</b>
                  <b>整体评价</b>
                  <b>需要关注</b>
                  <b>风险</b>
                  <b>需要追问</b>
                  <b>建议回复</b>
                </div>
              </footer>
            </section>
            <section class="config-card pre-submit-card">
              <header>
                <div>
                  <span>
                    <Icon icon="lucide:file-check-2" />
                    员工侧检查
                  </span>
                  <h2>提交前 AI 检查提示词</h2>
                  <p>
                    应用于员工未提交的 Markdown 周报，仅用于发现缺项和优化表达。
                  </p>
                </div>
                <Switch
                  v-model:checked="preSubmitEnabled"
                  checked-children="启用"
                  un-checked-children="停用"
                />
              </header>
              <label class="prompt-field">
                <span>员工提交前检查提示词</span>
                <small>此提示词不应包含主管评分、通过、拒绝或审批结论。</small>
                <Input.TextArea v-model:value="preSubmitPrompt" :rows="8" />
              </label>
              <div class="check-output">
                <span>预期输出</span>
                <b>完整度百分比</b>
                <b>等级评价</b>
                <b>缺失项</b>
                <b>优化建议</b>
                <b>可采纳内容</b>
              </div>
            </section>
          </main>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane key="report-template" tab="周报模板配置">
        <div class="settings-layout template-settings-layout">
          <aside class="rule-groups template-groups">
            <header>
              <div>
                <strong>系统内置模板</strong>
                <small>{{ reportTemplates.length }} 个模板</small>
              </div>
              <Button
                type="text"
                aria-label="新建周报模板"
                @click="addReportTemplate"
              >
                <Icon icon="lucide:plus" />
              </Button>
            </header>
            <button
              v-for="template in reportTemplates"
              :key="template.id"
              type="button"
              :class="{ active: template.id === activeTemplateId }"
              @click="activeTemplateId = template.id"
            >
              <span><Icon icon="lucide:layout-template" /></span>
              <div>
                <b>{{ template.name }}</b>
                <small>
                  {{
                    template.departments.length > 0
                      ? template.departments.join('、')
                      : '尚未绑定部门'
                  }}
                </small>
              </div>
              <em :class="{ off: !template.enabled }">
                {{ template.enabled ? '启用' : '停用' }}
              </em>
            </button>
            <section class="template-security-note">
              <Icon icon="lucide:shield-check" />
              <div>
                <b>仅管理员可见</b>
                <p>
                  员工生成 HTML
                  时只能看到模板名称和用途，不能查看或修改生成提示词。
                </p>
              </div>
            </section>
          </aside>
          <main class="settings-editor">
            <section class="config-card report-template-card">
              <header>
                <div>
                  <span>
                    <Icon icon="lucide:layout-dashboard" />
                    HTML 周报生成
                  </span>
                  <h2>{{ activeReportTemplate.name }}</h2>
                  <p>配置模板的适用部门、内容组织、视觉风格和系统生成规则。</p>
                </div>
                <Switch
                  v-model:checked="activeReportTemplate.enabled"
                  checked-children="启用"
                  un-checked-children="停用"
                />
              </header>
              <div class="field-grid template-field-grid">
                <label>
                  <span>模板名称</span>
                  <Input
                    v-model:value="activeReportTemplate.name"
                    size="large"
                  />
                </label>
                <label>
                  <span>视觉主题</span>
                  <Select
                    v-model:value="activeReportTemplate.theme"
                    :options="themeOptions"
                    size="large"
                  />
                </label>
                <label class="department-field">
                  <span>适用部门（可多选）</span>
                  <Select
                    v-model:value="activeReportTemplate.departments"
                    mode="multiple"
                    :options="departmentOptions"
                    size="large"
                    placeholder="未选择时作为通用模板"
                  />
                </label>
              </div>
              <label>
                <span>员工侧模板说明</span>
                <Input
                  v-model:value="activeReportTemplate.description"
                  size="large"
                />
              </label>
              <div class="template-feature-switches">
                <label>
                  <span>
                    <Icon icon="lucide:list-tree" />
                    <b>页内导航</b>
                    <small>按周报章节快速定位</small>
                  </span>
                  <Switch v-model:checked="activeReportTemplate.navigation" />
                </label>
                <label>
                  <span>
                    <Icon icon="lucide:layout-grid" />
                    <b>成果卡片</b>
                    <small>提炼重点成果和状态</small>
                  </span>
                  <Switch v-model:checked="activeReportTemplate.cards" />
                </label>
                <label>
                  <span>
                    <Icon icon="lucide:chart-no-axes-combined" />
                    <b>数据图表</b>
                    <small>展示进度和完成度</small>
                  </span>
                  <Switch v-model:checked="activeReportTemplate.charts" />
                </label>
              </div>
              <label class="prompt-field admin-template-prompt">
                <span>系统 HTML 生成提示词</span>
                <small>
                  仅管理员可见。员工点击生成时自动使用，不在员工侧页面或分享页中暴露。
                </small>
                <Input.TextArea
                  v-model:value="activeReportTemplate.prompt"
                  :rows="11"
                />
              </label>
              <footer>
                <div class="template-footer-note">
                  <Icon icon="lucide:info" />
                  <span>
                    部门专属模板优先于通用模板；同一部门仅启用一个模板。
                  </span>
                </div>
                <div>
                  <span>生成内容：</span>
                  <b>导航</b>
                  <b>卡片</b>
                  <b>图表</b>
                  <b>响应式页面</b>
                </div>
              </footer>
            </section>
          </main>
        </div>
      </Tabs.TabPane>
    </Tabs>
  </div>
</template>

<style scoped src="./review-settings.css"></style>
<style src="./review-settings-fullscreen.css"></style>
<style src="./review-settings-template.css"></style>
