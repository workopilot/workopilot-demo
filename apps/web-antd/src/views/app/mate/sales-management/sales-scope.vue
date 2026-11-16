<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, message, Select, Tag } from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type ScopeType = '产品线' | '区域' | '行业';

interface ScopeRule {
  conflict: string;
  id: string;
  match: string;
  owner: string;
  priority: string;
  status: '冲突' | '待确认' | '生效';
  type: ScopeType;
}

const rules = ref<ScopeRule[]>([
  {
    id: 'scope-1',
    type: '区域',
    match: '华东 · 上海、江苏、浙江',
    owner: '王安康',
    priority: '主责',
    status: '生效',
    conflict: '无冲突',
  },
  {
    id: 'scope-2',
    type: '行业',
    match: '能源装备 · 国企客户',
    owner: '林晓',
    priority: '协同',
    status: '生效',
    conflict: '与区域规则重叠 2 条',
  },
  {
    id: 'scope-3',
    type: '产品线',
    match: '项目管理 SaaS',
    owner: '陈晨',
    priority: '主责',
    status: '待确认',
    conflict: '需确认跨区协同人',
  },
  {
    id: 'scope-4',
    type: '区域',
    match: '华南 · 广东、广西、福建',
    owner: '赵磊',
    priority: '主责',
    status: '生效',
    conflict: '无冲突',
  },
  {
    id: 'scope-5',
    type: '行业',
    match: '交通物流 · 集团客户',
    owner: '销售总监',
    priority: '统一牵头',
    status: '冲突',
    conflict: '公开招标需指定唯一牵头人',
  },
  {
    id: 'scope-6',
    type: '产品线',
    match: '知应工单与售后',
    owner: '王安康',
    priority: '协同',
    status: '生效',
    conflict: '无冲突',
  },
]);

const typeFilter = ref<'全部' | ScopeType>('全部');
const statusFilter = ref<'全部' | ScopeRule['status']>('全部');
const keyword = ref('');
const drawerOpen = ref(false);
const selected = ref<null | ScopeRule>(null);
const isDirector = ref(false);

const visibleRules = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  return rules.value.filter((rule) => {
    return (
      (typeFilter.value === '全部' || rule.type === typeFilter.value) &&
      (statusFilter.value === '全部' || rule.status === statusFilter.value) &&
      (!q ||
        `${rule.match}${rule.owner}${rule.conflict}`.toLowerCase().includes(q))
    );
  });
});

function openRule(rule: ScopeRule) {
  selected.value = rule;
  drawerOpen.value = true;
}

function submitArbitration() {
  if (selected.value) {
    selected.value.status = '待确认';
    message.success('已提交人工裁决，销售总监会在制度时限内处理');
  }
}

function addRule() {
  message.success('已创建规则草稿，可在侧滑中补充匹配条件');
}
</script>

<template>
  <AiWorkPage
    class="scope-page"
    eyebrow="SALES GOVERNANCE"
    icon="lucide:map-pinned"
    title="销售范围"
    description="按区域、行业、产品线维护销售负责范围；跨范围和公开招标冲突保留人工裁决。"
  >
    <template #actions>
      <div class="role-switch">
        <button :class="{ active: !isDirector }" @click="isDirector = false">
          销售视角
        </button>
        <button :class="{ active: isDirector }" @click="isDirector = true">
          销售总监
        </button>
      </div>
      <Button type="primary" @click="addRule">
        <Icon icon="lucide:plus" />
        新增范围规则
      </Button>
    </template>

    <section class="visibility-note">
      <Icon icon="lucide:eye" />
      <div>
        <strong>
          {{
            isDirector ? '销售总监可查看全部规则' : '当前只展示与你相关的范围'
          }}
        </strong>
        <span>
          {{
            isDirector
              ? '可处理跨区域、跨行业、集团客户及公开招标的归属裁决。'
              : '你负责的区域与产品线会自动参与报备查重；其他范围仅展示匹配结果。'
          }}
        </span>
      </div>
      <Tag color="green">规则自动用于报备</Tag>
    </section>

    <section class="summary-grid">
      <article>
        <span><Icon icon="lucide:map" /></span>
        <div>
          <small>生效规则</small>
          <strong>
            {{ rules.filter((rule) => rule.status === '生效').length }} 条
          </strong>
          <p>区域 / 行业 / 产品线</p>
        </div>
      </article>
      <article>
        <span><Icon icon="lucide:triangle-alert" /></span>
        <div>
          <small>待处理冲突</small>
          <strong>
            {{ rules.filter((rule) => rule.status !== '生效').length }} 条
          </strong>
          <p>报备时自动拦截</p>
        </div>
      </article>
      <article>
        <span><Icon icon="lucide:scale" /></span>
        <div>
          <small>人工裁决</small>
          <strong>1 个</strong>
          <p>制度未覆盖时保留最终决定</p>
        </div>
      </article>
    </section>

    <section class="toolbar">
      <Input
        v-model:value="keyword"
        class="search"
        allow-clear
        placeholder="搜索区域、行业、产品线或负责人"
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </Input>
      <Select
        v-model:value="typeFilter"
        class="select"
        :options="[
          { value: '全部', label: '全部维度' },
          { value: '区域', label: '区域' },
          { value: '行业', label: '行业' },
          { value: '产品线', label: '产品线' },
        ]"
      />
      <Select
        v-model:value="statusFilter"
        class="select"
        :options="[
          { value: '全部', label: '全部状态' },
          { value: '生效', label: '生效' },
          { value: '待确认', label: '待确认' },
          { value: '冲突', label: '冲突' },
        ]"
      />
      <span class="result-count">{{ visibleRules.length }} 条规则</span>
    </section>

    <section class="rule-list">
      <header>
        <span>维度</span>
        <span>匹配范围</span>
        <span>责任人</span>
        <span>协作优先级</span>
        <span>冲突检查</span>
        <span>状态</span>
        <span></span>
      </header>
      <button
        v-for="rule in visibleRules"
        :key="rule.id"
        class="rule-row"
        @click="openRule(rule)"
      >
        <Tag color="blue">{{ rule.type }}</Tag>
        <div class="match">
          <strong>{{ rule.match }}</strong>
          <span>报备、领取、公海回收均适用</span>
        </div>
        <span class="owner">{{ rule.owner }}</span>
        <span>{{ rule.priority }}</span>
        <span class="conflict" :class="{ warn: rule.status !== '生效' }">
          <Icon
            :icon="
              rule.status === '生效'
                ? 'lucide:check-circle-2'
                : 'lucide:alert-triangle'
            "
          />
          {{ rule.conflict }}
        </span>
        <Tag
          :color="
            rule.status === '生效'
              ? 'green'
              : rule.status === '冲突'
                ? 'red'
                : 'orange'
          "
        >
          {{ rule.status }}
        </Tag>
        <Icon class="row-arrow" icon="lucide:chevron-right" />
      </button>
      <div v-if="visibleRules.length === 0" class="empty">
        <Icon icon="lucide:search-x" />
        <strong>没有匹配的范围规则</strong>
      </div>
    </section>

    <Drawer
      v-model:open="drawerOpen"
      :width="540"
      title="销售范围规则"
      destroy-on-close
    >
      <template v-if="selected">
        <section class="drawer-title">
          <span><Icon icon="lucide:map-pinned" /></span>
          <div>
            <small>{{ selected.type }}规则 · {{ selected.status }}</small>
            <h2>{{ selected.match }}</h2>
            <p>
              责任人：{{ selected.owner }} · 优先级：{{ selected.priority }}
            </p>
          </div>
        </section>
        <section class="drawer-section">
          <header>
            <strong>规则如何被使用</strong>
            <Tag color="green">自动检查</Tag>
          </header>
          <div class="use-step">
            <span>1</span>
            <div>
              <strong>报备时匹配</strong>
              <p>AI 从客户主体、行业和产品需求中识别适用范围。</p>
            </div>
          </div>
          <div class="use-step">
            <span>2</span>
            <div>
              <strong>发现重叠</strong>
              <p>如果多人都符合，系统保留证据并要求协同确认。</p>
            </div>
          </div>
          <div class="use-step">
            <span>3</span>
            <div>
              <strong>人工裁决</strong>
              <p>集团客户、公开招标和制度未覆盖的例外由销售总监决定。</p>
            </div>
          </div>
        </section>
        <section class="drawer-section">
          <header>
            <strong>冲突检查</strong>
            <Tag :color="selected.status === '生效' ? 'green' : 'orange'">
              {{ selected.conflict }}
            </Tag>
          </header>
          <div class="check-row">
            <Icon icon="lucide:building-2" />
            <span>客户所在区域</span>
            <strong>华东 / 上海</strong>
            <Tag color="green">匹配</Tag>
          </div>
          <div class="check-row">
            <Icon icon="lucide:briefcase-business" />
            <span>所属行业</span>
            <strong>能源装备</strong>
            <Tag color="orange">协同</Tag>
          </div>
          <div class="check-row">
            <Icon icon="lucide:package-search" />
            <span>产品线</span>
            <strong>项目管理 SaaS</strong>
            <Tag color="green">匹配</Tag>
          </div>
        </section>
        <section class="evidence">
          <Icon icon="lucide:info" />
          <div>
            <strong>权限说明</strong>
            <p>
              {{
                isDirector
                  ? '销售总监可以查看所有销售范围并直接处理归属争议。'
                  : '普通销售只能维护自己的客户；查看他人范围只用于判断是否需要协作。'
              }}
            </p>
          </div>
        </section>
      </template>
      <template #footer>
        <div class="drawer-footer">
          <span>
            <Icon icon="lucide:history" />
            规则版本 V0.3 · 最近更新今天 09:20
          </span>
          <Button @click="drawerOpen = false">关闭</Button>
          <Button
            v-if="selected?.status !== '生效'"
            type="primary"
            @click="submitArbitration"
          >
            <Icon icon="lucide:scale" />
            提交人工裁决
          </Button>
        </div>
      </template>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.scope-page {
  --green: #287461;
}
.role-switch {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: #e5eeeb;
  border-radius: 7px;
}
.role-switch button {
  padding: 5px 9px;
  font-size: 12px;
  color: #6a7c75;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
}
.role-switch button.active {
  color: #225f50;
  background: #fff;
  box-shadow: 0 2px 7px rgb(37 75 64 / 8%);
}
.visibility-note {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 9px 11px;
  margin-bottom: 8px;
  color: #287461;
  background: #eef7f3;
  border: 1px solid #d3e7df;
  border-radius: 10px;
}
.visibility-note > svg {
  flex: none;
  font-size: 18px;
}
.visibility-note div {
  flex: 1;
  min-width: 0;
}
.visibility-note strong,
.visibility-note span {
  display: block;
}
.visibility-note strong {
  font-size: 12px;
  color: #3c5b52;
}
.visibility-note span {
  margin-top: 2px;
  font-size: 12px;
  color: #74867f;
}
.visibility-note :deep(.ant-tag) {
  margin: 0;
  font-size: 12px;
  white-space: nowrap;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}
.summary-grid article {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}
.summary-grid article > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #287461;
  background: #e7f2ee;
  border-radius: 9px;
}
.summary-grid small,
.summary-grid strong,
.summary-grid p {
  display: block;
  margin: 0;
}
.summary-grid small,
.summary-grid p {
  font-size: 12px;
  color: #899791;
}
.summary-grid strong {
  margin: 2px 0;
  font-size: 15px;
  color: #3c564e;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  padding: 7px;
  margin-bottom: 8px;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 10px;
}
.search {
  flex: 1;
  min-width: 240px;
  max-width: 380px;
}
.select {
  width: 120px;
}
.result-count {
  margin-left: auto;
  font-size: 12px;
  color: #83928d;
}
.rule-list {
  overflow: auto;
  background: #fff;
  border: 1px solid #dce7e3;
  border-radius: 11px;
}
.rule-list > header,
.rule-row {
  display: grid;
  grid-template-columns:
    72px minmax(250px, 1.5fr) 100px 100px minmax(200px, 1.2fr)
    80px 22px;
  gap: 9px;
  align-items: center;
  min-width: 1040px;
  padding: 8px 11px;
}
.rule-list > header {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 12px;
  font-weight: 700;
  color: #71837c;
  background: #f4f7f6;
  border-bottom: 1px solid #dfe8e5;
}
.rule-row {
  width: 100%;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 0;
  border-bottom: 1px solid #edf1ef;
}
.rule-row:hover {
  background: #f4faf7;
}
.rule-row :deep(.ant-tag) {
  width: max-content;
  margin: 0;
  font-size: 12px;
  line-height: 18px;
}
.match,
.conflict {
  min-width: 0;
}
.match strong,
.match span {
  display: block;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.match strong {
  color: #334e45;
}
.match span {
  margin-top: 2px;
  color: #8a9893;
}
.owner {
  font-size: 12px;
  color: #4e655d;
}
.conflict {
  display: flex;
  gap: 4px;
  align-items: center;
  overflow: hidden;
  font-size: 12px;
  color: #6f8179;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.conflict.warn {
  color: #a6663e;
}
.row-arrow {
  color: #a3b0ab;
}
.empty {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
  padding: 45px;
  color: #91a09b;
}
.empty strong {
  font-size: 12px;
  color: #61766e;
}
.drawer-title {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 13px;
  background: #eff7f4;
  border: 1px solid #d7ebe3;
  border-radius: 11px;
}
.drawer-title > span {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  font-size: 18px;
  color: #fff;
  background: #287461;
  border-radius: 10px;
}
.drawer-title small,
.drawer-title p {
  font-size: 12px;
  color: #7d9088;
}
.drawer-title h2 {
  margin: 3px 0;
  font-size: 16px;
  color: #355247;
}
.drawer-title p {
  margin: 0;
}
.drawer-section {
  margin-top: 13px;
  overflow: hidden;
  border: 1px solid #e0e8e5;
  border-radius: 10px;
}
.drawer-section > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 11px;
  background: #f5f8f7;
}
.drawer-section header strong {
  font-size: 12px;
  color: #425851;
}
.drawer-section :deep(.ant-tag) {
  margin: 0;
  font-size: 12px;
}
.use-step {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 8px;
  padding: 10px 11px;
  border-top: 1px solid #e8eeec;
}
.use-step > span {
  display: grid;
  width: 21px;
  height: 21px;
  place-items: center;
  font-size: 12px;
  color: #287461;
  background: #e3f1eb;
  border-radius: 50%;
}
.use-step strong,
.use-step p {
  display: block;
}
.use-step strong {
  font-size: 12px;
  color: #4b625a;
}
.use-step p {
  margin: 2px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #7b8d85;
}
.check-row {
  display: grid;
  grid-template-columns: 22px 1fr 100px auto;
  gap: 7px;
  align-items: center;
  padding: 9px 11px;
  border-top: 1px solid #e8eeec;
}
.check-row > svg {
  color: #287461;
}
.check-row span {
  font-size: 12px;
  color: #7b8d85;
}
.check-row strong {
  font-size: 12px;
  color: #4b625a;
}
.check-row :deep(.ant-tag) {
  font-size: 12px;
}
.evidence {
  display: flex;
  gap: 8px;
  padding: 10px;
  margin-top: 11px;
  color: #8c673e;
  background: #fff7ed;
  border-radius: 9px;
}
.evidence strong,
.evidence p {
  display: block;
}
.evidence strong {
  font-size: 12px;
  color: #75543b;
}
.evidence p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #917b66;
}
.drawer-footer {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #e1e9e6;
}
.drawer-footer > span {
  display: flex;
  flex: 1;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  color: #899691;
}
@media (max-width: 800px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .visibility-note {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .visibility-note :deep(.ant-tag) {
    margin-left: 27px;
  }
}
</style>
