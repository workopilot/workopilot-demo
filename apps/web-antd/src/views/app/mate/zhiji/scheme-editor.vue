<script setup lang="ts">
import type { ReportLayoutTemplate } from '#/api/mock-report-layout-templates';
import type { ReportPeriod, ZhijiScheme } from '#/types/zhiji';

import { computed, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Input,
  message,
  Modal,
  Pagination,
  Switch,
} from 'ant-design-vue';

import {
  cloneZhijiScheme,
  defaultSourcePrompt,
  zhijiDepartments,
  zhijiPeople,
  zhijiScopeText,
  newZhijiScheme,
  saveZhijiScheme,
  validateZhijiScheme,
  zhijiCycleText,
  zhijiHistory,
  zhijiSchemes,
  zhijiSources,
  zhijiTemplates,
  zhijiTypes,
} from '#/api/mock-zhiji';
import { reportPeriodRange, reportPeriods } from '#/utils/report-period';
import { reportLayoutTemplates } from '#/api/mock-report-layout-templates';

const route = useRoute();
const router = useRouter();
const existing = zhijiSchemes.find((s) => s.id === route.params.id);
const missing = route.params.id !== 'new' && !existing;
const form = reactive<ZhijiScheme>(
  cloneZhijiScheme(existing ?? newZhijiScheme()),
);
form.mode = 'fixed';
form.autoGenerate = false;
form.periods = [form.defaultPeriod];
const scopeSearch = ref('');
const scopeOptions = computed(() =>
  zhijiDepartments.filter((item) => item.label.includes(scopeSearch.value)),
);
function toggleSelection(values: string[], id: string, checked: boolean) {
  return checked
    ? [...new Set([...values, id])]
    : values.filter((value) => value !== id);
}
function changeScopeMode() {
  form.scopeIds = [];
  scopeSearch.value = '';
  delete errors.value.scope;
}
watch(
  () => [form.scopeMode, ...form.scopeIds],
  () => {
    form.scope = zhijiScopeText(form);
  },
);
const peopleModal = ref(false);
const peopleSearch = ref('');
const peoplePage = ref(1);
const peoplePageSize = 10;
const pendingPeople = ref<string[]>([]);
const selectedPeople = computed(() =>
  zhijiPeople.filter((person) => form.scopeIds.includes(person.value)),
);
const filteredPeople = computed(() => {
  const query = peopleSearch.value.trim().toLowerCase();
  return zhijiPeople.filter((person) =>
    `${person.label} ${person.number} ${person.department}`
      .toLowerCase()
      .includes(query),
  );
});
const pagedPeople = computed(() =>
  filteredPeople.value.slice(
    (peoplePage.value - 1) * peoplePageSize,
    peoplePage.value * peoplePageSize,
  ),
);
watch(peopleSearch, () => {
  peoplePage.value = 1;
});
function openPeople() {
  pendingPeople.value = [...form.scopeIds];
  peopleSearch.value = '';
  peoplePage.value = 1;
  peopleModal.value = true;
}
function confirmPeople() {
  form.scopeIds = [...pendingPeople.value];
  peopleModal.value = false;
}
const sourceModal = ref(false);
const sourceSearch = ref('');
const pendingSources = ref<string[]>([]);
const availableSources = computed(() =>
  zhijiSources.filter(
    (item) =>
      selectedType.value.sources.includes(item.id) &&
      `${item.name}${item.description}${item.system}`
        .toLowerCase()
        .includes(sourceSearch.value.toLowerCase()),
  ),
);
const selectedSources = computed(() =>
  form.sources
    .map((id) => zhijiSources.find((item) => item.id === id))
    .filter((item) => !!item),
);
function openSources() {
  pendingSources.value = [...form.sources];
  sourceSearch.value = '';
  sourceModal.value = true;
}
function confirmSources() {
  form.sources = [...pendingSources.value];
  for (const id of form.sources)
    form.sourcePrompts[id] ??= defaultSourcePrompt(id);
  sourceModal.value = false;
}
form.layoutTemplates ??= JSON.parse(
  JSON.stringify(
    reportLayoutTemplates.filter((item) => item.kinds.includes(form.type)),
  ),
);
const templateDrawer = ref(false);
const templateDraft = ref<ReportLayoutTemplate>();
const templateError = ref('');
const htmlLoading = ref(false);
function editLayout(item?: ReportLayoutTemplate) {
  templateDraft.value = item
    ? JSON.parse(JSON.stringify(item))
    : {
        id: `layout-${Date.now()}`,
        name: '',
        description: '',
        kinds: [form.type],
        presentation: 'classic',
        prompt: '',
        enabled: true,
        version: 0,
      };
  templateError.value = '';
  templateDrawer.value = true;
}
async function attachHtml(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !templateDraft.value) return;
  const target = templateDraft.value;
  if (!/\.html?$/i.test(file.name)) {
    templateError.value = '请选择 HTML 文件';
    input.value = '';
    return;
  }
  htmlLoading.value = true;
  try {
    target.htmlFile = { name: file.name, content: await file.text() };
    templateError.value = '';
  } catch {
    templateError.value = '文件读取失败，请重新选择';
  } finally {
    htmlLoading.value = false;
    input.value = '';
  }
}
function saveLayout() {
  const item = templateDraft.value;
  if (!item || htmlLoading.value) return;
  if (!item.name.trim() || !item.prompt.trim()) {
    templateError.value = '请填写模板名称和样式提示词';
    return;
  }
  item.version++;
  const savedItem = JSON.parse(JSON.stringify(item));
  const index = form.layoutTemplates!.findIndex(
    (entry) => entry.id === item.id,
  );
  if (index < 0) form.layoutTemplates!.push(savedItem);
  else form.layoutTemplates![index] = savedItem;
  form.layoutTemplateIds = [
    ...new Set([...(form.layoutTemplateIds ?? []), item.id]),
  ];
  form.defaultLayoutTemplateId ??= item.id;
  templateDrawer.value = false;
}
function toggleLayout(id: string, checked: boolean) {
  form.layoutTemplateIds = toggleSelection(
    form.layoutTemplateIds ?? [],
    id,
    checked,
  );
  if (!form.layoutTemplateIds.includes(form.defaultLayoutTemplateId ?? ''))
    form.defaultLayoutTemplateId = form.layoutTemplateIds[0];
}
const baseline = ref(JSON.stringify(form));
const saved = ref(false);
const busy = ref(false);
const step = ref(0);
const errors = ref<Record<string, string>>({});
const preview = ref(false);
const historyOpen = ref(false);
const steps = [
  { title: '基本信息', sub: '对象与适用范围', icon: 'lucide:file-text' },
  {
    title: '周期与时间',
    sub: '固定周期与截止时间',
    icon: 'lucide:calendar-days',
  },
  { title: '数据源', sub: '数据来源与总结要求', icon: 'lucide:database' },
  { title: 'AI 生成要求', sub: '报告内容要求', icon: 'lucide:sparkles' },
  {
    title: '模板配置',
    sub: '样式与 HTML 文件',
    icon: 'lucide:layout-template',
  },
];
const selectedType = computed(() =>
  zhijiTypes.find((t) => t.id === form.type)!,
);
const periodOptions = computed(() =>
  reportPeriods.filter((p) => form.periods.includes(p.value)),
);
const previewPeriod = ref<ReportPeriod>(form.defaultPeriod);
const previewRange = computed(() =>
  reportPeriodRange('2026-10-22', previewPeriod.value, form.anchor),
);
const history = computed(() => zhijiHistory.filter((h) => h.id === form.id));
watch(
  () => form.defaultPeriod,
  (value) => {
    previewPeriod.value = value;
    form.periods = [value];
  },
);
function changeType() {
  form.owner = selectedType.value.owner;
  form.sources = [...selectedType.value.sources];
  form.sections = [...selectedType.value.sections];
  form.template =
    form.type === 'customer'
      ? 'service'
      : form.type === 'project'
        ? 'progress'
        : 'outcome';
  form.prompt = zhijiTemplates.find((t) => t.id === form.template)!.prompt;
}
function check() {
  errors.value = validateZhijiScheme(form);
  if (Object.keys(errors.value).length === 0) return true;
  if (errors.value.name || errors.value.scope) step.value = 0;
  else if (
    errors.value.periods ||
    errors.value.anchor ||
    errors.value.deadlineDay ||
    errors.value.deadlineTime
  )
    step.value = 1;
  else if (errors.value.layoutTemplates) step.value = 4;
  else step.value = 3;
  message.warning('请检查标记的配置项');
  return false;
}
async function save(publish: boolean) {
  if (!check()) return;
  busy.value = true;
  try {
    await saveZhijiScheme(form, publish);
    saved.value = true;
    message.success(publish ? '方案已发布，汇报者端已同步' : '草稿已保存');
    await router.push('/app/mate/apps/zhiji/schemes');
  } catch (error) {
    message.error((error as Error).message);
  } finally {
    busy.value = false;
  }
}
function publish() {
  if (!check()) return;
  Modal.confirm({
    title: existing?.status === 'published' ? '发布新版本' : '发布汇报方案',
    content: `“${form.name}” · ${form.scope} · ${zhijiCycleText(form)}。发布后汇报者可使用此配置，历史报告保持原版本。`,
    okText: '确认发布',
    cancelText: '继续编辑',
    onOk: () => save(true),
  });
}
onBeforeRouteLeave(() => {
  if (saved.value || baseline.value === JSON.stringify(form)) return true;
  return new Promise<boolean>((resolve) =>
    Modal.confirm({
      title: '离开未保存的配置？',
      content: '本次修改尚未保存。',
      okText: '离开',
      cancelText: '继续编辑',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    }),
  );
});
</script>
<template>
  <div v-if="missing" class="zj-empty">
    <h2>未找到此汇报方案</h2>
    <p>演示数据刷新后会重置，请返回方案列表。</p>
    <Button @click="router.push('/app/mate/apps/zhiji/schemes')"
      >返回列表</Button
    >
  </div>
  <section v-else class="zj-page zj-editor-page">
    <header class="zj-page-header">
      <div>
        <button
          class="zj-text-button zj-back"
          @click="router.push('/app/mate/apps/zhiji/schemes')"
        >
          <Icon icon="lucide:arrow-left" /> 汇报方案
        </button>
        <h1>
          {{ existing ? form.name : '新建汇报方案' }}
          <span class="zj-badge" :data-status="form.status">{{
            existing ? `V${form.version} · 配置` : '草稿'
          }}</span>
        </h1>
        <p>设置汇报规则、数据来源与样式模板。</p>
      </div>
      <Button v-if="existing" @click="historyOpen = true"
        ><Icon icon="lucide:history" /> 配置历史</Button
      >
    </header>
    <div class="zj-editor-grid">
      <nav class="zj-steps" aria-label="方案配置步骤">
        <button
          v-for="(item, index) in steps"
          :key="item.title"
          :class="{ active: step === index }"
          :aria-current="step === index ? 'step' : undefined"
          @click="step = index"
        >
          <span class="zj-step-number">{{ index + 1 }}</span
          ><span
            ><strong>{{ item.title }}</strong
            ><small>{{ item.sub }}</small></span
          >
        </button>
      </nav>
      <div class="zj-panel zj-form-panel">
        <div class="zj-section-heading">
          <span class="zj-section-icon"
            ><Icon :icon="steps[step]!.icon"
          /></span>
          <div>
            <h2>{{ steps[step]!.title }}</h2>
            <p>{{ steps[step]!.sub }}</p>
          </div>
          <span class="zj-muted">{{ step + 1 }} / {{ steps.length }}</span>
        </div>
        <div v-if="step === 0" class="zj-form-content">
          <label class="zj-field"
            ><span>方案名称 <b>*</b></span
            ><Input
              v-model:value="form.name"
              placeholder="例如：交付项目进展汇报"
              :maxlength="40"
              :status="errors.name ? 'error' : undefined"
            /><small v-if="errors.name" class="zj-error">{{
              errors.name
            }}</small></label
          >
          <label class="zj-field"
            ><span>报告类型</span
            ><select
              v-model="form.type"
              :disabled="!!existing"
              @change="changeType"
            >
              <option
                v-for="t in zhijiTypes"
                :key="t.id"
                :value="t.id"
                :disabled="!t.enabled"
              >
                {{ t.name }}{{ !t.enabled ? '（已停用）' : '' }}
              </option></select
            ><small
              >决定业务对象与取数边界。保存后不可切换类型，可新建其他类型方案。</small
            ></label
          >
          <div class="zj-inline-note">
            <Icon :icon="selectedType.icon" />
            <div>
              <strong
                >{{ selectedType.object }} · {{ selectedType.owner }}</strong
              >
              <p>{{ selectedType.description }}</p>
            </div>
          </div>
          <div class="zj-field">
            <span>适用范围 <b>*</b></span>
            <div class="zj-scope-modes">
              <label
                ><input
                  v-model="form.scopeMode"
                  type="radio"
                  value="all"
                  @change="changeScopeMode"
                />
                全员</label
              >
              <label
                ><input
                  v-model="form.scopeMode"
                  type="radio"
                  value="departments"
                  @change="changeScopeMode"
                />
                按部门</label
              >
              <label
                ><input
                  v-model="form.scopeMode"
                  type="radio"
                  value="people"
                  @change="changeScopeMode"
                />
                按人员</label
              >
            </div>
            <template v-if="form.scopeMode === 'departments'">
              <Input
                v-model:value="scopeSearch"
                placeholder="搜索部门"
                aria-label="搜索部门"
                allow-clear
              />
              <div class="zj-scope-options">
                <Checkbox
                  v-for="item in scopeOptions"
                  :key="item.value"
                  :checked="form.scopeIds.includes(item.value)"
                  @change="
                    form.scopeIds = toggleSelection(
                      form.scopeIds,
                      item.value,
                      !!$event.target.checked,
                    )
                  "
                  >{{ item.label }}</Checkbox
                >
              </div>
              <small v-if="!scopeOptions.length">未找到匹配的部门。</small>
            </template>
            <template v-else-if="form.scopeMode === 'people'">
              <div class="zj-source-list-heading">
                <span>已选 {{ selectedPeople.length }} 人</span
                ><Button @click="openPeople"
                  ><Icon icon="lucide:user-plus" /> 添加人员</Button
                >
              </div>
              <div class="zj-selected-people">
                <span
                  v-for="person in selectedPeople"
                  :key="person.value"
                  class="zj-person-chip"
                  ><Avatar :size="26" class="zj-person-avatar">{{
                    person.label.slice(-2)
                  }}</Avatar
                  ><span>{{ person.label }}</span
                  ><button
                    type="button"
                    :aria-label="`移除${person.label}`"
                    @click="
                      form.scopeIds = form.scopeIds.filter(
                        (id) => id !== person.value,
                      )
                    "
                  >
                    <Icon icon="lucide:x" /></button
                ></span>
                <span v-if="!selectedPeople.length" class="zj-muted"
                  >暂未添加人员</span
                >
              </div>
            </template>
            <small>{{
              form.scopeMode === 'all'
                ? '全体成员都可以看到此汇报方案，无需选择部门或人员。'
                : form.scopeMode === 'departments'
                  ? '所选部门的所有成员都可以看到此汇报方案。'
                  : '仅所选人员可以看到此汇报方案。'
            }}</small>
            <small v-if="form.scopeMode === 'departments'"
              >已选：{{ zhijiScopeText(form) || '暂未选择' }}</small
            >
            <small v-if="errors.scope" class="zj-error">{{
              errors.scope
            }}</small>
          </div>
          <label class="zj-field"
            ><span>方案说明</span
            ><Input.TextArea
              v-model:value="form.description"
              :rows="3"
              placeholder="告诉汇报者这份报告用于什么场景"
              :maxlength="200"
          /></label>
        </div>
        <div v-if="step === 1" class="zj-form-content">
          <label class="zj-field"
            ><span>固定汇报周期</span
            ><select v-model="form.defaultPeriod">
              <option
                v-for="p in reportPeriods"
                :key="p.value"
                :value="p.value"
              >
                {{ p.label }}
              </option>
            </select></label
          >
          <label v-if="form.periods.includes('biweek')" class="zj-field"
            ><span>双周起始周（周一）</span
            ><input v-model="form.anchor" type="date" /><small
              :class="{ 'zj-error': errors.anchor }"
              >{{
                errors.anchor || '以此日期为基准，每 14 天形成一个连续周期。'
              }}</small
            ></label
          >
          <div class="zj-inline-note">
            <Icon icon="lucide:calendar-range" />
            <p>
              周报按周一至周日；月、季度、年度按自然周期。所有时间使用北京时间。
            </p>
          </div>
          <div class="zj-toggle-row">
            <div>
              <strong>设置应交要求</strong
              ><small>要求汇报者在截止时间前提交报告</small>
            </div>
            <Switch
              v-model:checked="form.required"
              aria-label="设置应交要求"
            />
          </div>
          <div v-if="form.required" class="zj-field-pair">
            <label class="zj-field"
              ><span>提交截止日期</span>
              <div class="zj-deadline-offset">
                <span>上一周期结束后</span
                ><input
                  v-model.number="form.deadlineDay"
                  type="number"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  aria-label="提交截止日期距上一周期结束的天数"
                  :aria-invalid="!!errors.deadlineDay"
                /><span>天</span>
              </div>
              <small v-if="errors.deadlineDay" class="zj-error">{{
                errors.deadlineDay
              }}</small
              ><small>例如：周日结束，输入 2，截止日期为周二。</small></label
            ><label class="zj-field"
              ><span>截止时间</span
              ><input v-model="form.deadlineTime" type="time" /><small
                v-if="errors.deadlineTime"
                class="zj-error"
                >{{ errors.deadlineTime }}</small
              ></label
            >
          </div>
          <div class="zj-toggle-row">
            <div>
              <strong>发送提醒</strong
              ><small>应交截止提醒</small>
            </div>
            <Switch v-model:checked="form.reminder" aria-label="发送提醒" />
          </div>
        </div>
        <div v-if="step === 2" class="zj-form-content">
          <div class="zj-field">
            <div class="zj-source-list-heading">
              <strong>数据源 · {{ form.sources.length }}</strong
              ><Button @click="openSources"
                ><Icon icon="lucide:plus" /> 选择数据源</Button
              >
            </div>
            <p v-if="!selectedSources.length" class="zj-muted">
              尚未选择数据源，点击“选择数据源”添加。
            </p>
            <article
              v-for="source in selectedSources"
              :key="source.id"
              class="zj-selected-source"
            >
              <div class="zj-source-list-heading">
                <strong><Icon :icon="source.icon" /> {{ source.name }}</strong
                ><Button
                  type="text"
                  danger
                  :aria-label="`移除${source.name}`"
                  @click="
                    form.sources = form.sources.filter(
                      (id) => id !== source.id,
                    )
                  "
                  >移除</Button
                >
              </div>
              <p class="zj-muted">
                {{ source.description }} · {{ source.status }}
              </p>
              <label class="zj-field"
                ><span>总结提示词 · Markdown 输出</span
                ><Input.TextArea
                  v-model:value="form.sourcePrompts[source.id]"
                  :auto-size="{ minRows: 6, maxRows: 18 }"
                  :aria-label="`${source.name}总结提示词`"
                  placeholder="设置该数据源的总结重点、输出要求和注意事项"
              /></label>
            </article>
            <small
              >按各数据源的提示词分别总结，再用于生成报告。仅在授权范围内取数；未授权的数据源不采集。</small
            >
          </div>
          <div class="zj-inline-note">
            <Icon icon="lucide:shield-check" />
            <p>
              源事实与 AI 总结只读。人工补充独立保存，重新总结不覆盖人工内容。
            </p>
          </div>
        </div>
        <div v-if="step === 3" class="zj-form-content">
          <label class="zj-field"
            ><span>AI 生成要求 <b>*</b></span
            ><Input.TextArea v-model:value="form.prompt" :rows="7" /><small
              v-if="errors.prompt"
              class="zj-error"
              >{{ errors.prompt }}</small
            ><small
              >由管理员统一维护；汇报者不能修改系统提示词。</small
            ></label
          >
          <div class="zj-inline-note">
            <Icon icon="lucide:sparkles" />
            <div>
              <strong>成果优先，保留证据</strong>
              <p>
                提示补齐成果物、量化结果与下一步计划；不编造事实，不因信息缺失阻断提报。
              </p>
            </div>
          </div>
        </div>
        <div v-if="step === 4" class="zj-form-content">
          <p class="zj-muted">
            模板仅保存在当前报告方案中。勾选汇报者可用的模板，点击卡片编辑样式提示词。
          </p>
          <div class="zj-layout-cards">
            <article
              v-for="item in form.layoutTemplates"
              :key="item.id"
              class="zj-layout-card"
              :class="{ selected: form.layoutTemplateIds?.includes(item.id) }"
            >
              <button
                type="button"
                class="zj-layout-card-edit"
                @click="editLayout(item)"
              >
                <Icon icon="lucide:panels-top-left" /><strong>{{
                  item.name
                }}</strong
                ><small>{{ item.htmlFile?.name || '提示词样式模板' }}</small
                ><span>编辑模板</span>
              </button>
              <div class="zj-layout-card-actions">
                <Checkbox
                  :checked="form.layoutTemplateIds?.includes(item.id)"
                  @change="toggleLayout(item.id, !!$event.target.checked)"
                  >可用</Checkbox
                ><button
                  type="button"
                  class="zj-text-button"
                  :disabled="!form.layoutTemplateIds?.includes(item.id)"
                  @click="form.defaultLayoutTemplateId = item.id"
                >
                  {{
                    form.defaultLayoutTemplateId === item.id
                      ? '默认模板'
                      : '设为默认'
                  }}
                </button>
              </div>
            </article>
            <button type="button" class="zj-layout-add" @click="editLayout()">
              <Icon icon="lucide:plus" /><strong>添加模板</strong>
            </button>
          </div>
          <small v-if="errors.layoutTemplates" class="zj-error">{{
            errors.layoutTemplates
          }}</small>
        </div>
        <div class="zj-step-actions">
          <Button :disabled="step === 0" @click="step--">上一步</Button
          ><Button v-if="step < steps.length - 1" @click="step++"
            >下一步 <Icon icon="lucide:arrow-right" /></Button
          ><span v-else class="zj-muted">配置完成后，预览并发布</span>
        </div>
      </div>
    </div>
    <footer class="zj-editor-footer">
      <span
        ><Icon icon="lucide:shield-check" />
        {{
          baseline === JSON.stringify(form) ? '配置已载入' : '有未保存的修改'
        }}</span
      >
      <div>
        <Button
          :disabled="existing?.status === 'published'"
          :loading="busy"
          @click="save(false)"
          >保存草稿</Button
        ><Button @click="preview = true">预览</Button
        ><Button type="primary" :loading="busy" @click="publish">{{
          existing?.status === 'published' ? '发布新版本' : '发布方案'
        }}</Button>
      </div>
    </footer>
    <Drawer
      v-model:open="templateDrawer"
      title="模板配置"
      :width="560"
      :mask-closable="false"
    >
      <div v-if="templateDraft" class="zj-drawer-content">
        <label class="zj-field"
          ><span>模板名称 *</span
          ><Input
            v-model:value="templateDraft.name"
            :maxlength="60"
            placeholder="例如：简洁项目周报"
        /></label>
        <label class="zj-field"
          ><span>样式模板提示词 *</span
          ><Input.TextArea
            v-model:value="templateDraft.prompt"
            :rows="16"
            placeholder="描述报告的布局、配色、字体、图表样式及 HTML 输出要求……"
        /></label>
        <div class="zj-field">
          <span>关联 HTML 文件（可选）</span
          ><input
            type="file"
            accept=".html,.htm,text/html"
            aria-label="关联 HTML 文件"
            :disabled="htmlLoading"
            @change="attachHtml"
          /><small v-if="htmlLoading">正在读取文件…</small>
          <div v-if="templateDraft.htmlFile" class="zj-source-list-heading">
            <span>{{ templateDraft.htmlFile.name }}</span
            ><Button
              type="text"
              danger
              @click="templateDraft.htmlFile = undefined"
              >移除</Button
            >
          </div>
          <small>作为样式参考随方案保存，不在设置页执行 HTML。</small>
        </div>
        <p v-if="templateError" class="zj-error">{{ templateError }}</p>
      </div>
      <template #footer
        ><div class="zj-template-drawer-footer">
          <Button @click="templateDrawer = false">取消</Button
          ><Button type="primary" :loading="htmlLoading" @click="saveLayout"
            >保存到方案</Button
          >
        </div></template
      >
    </Drawer>
    <Modal
      v-model:open="peopleModal"
      title="选择人员"
      :width="720"
      ok-text="添加到人员列表"
      cancel-text="取消"
      @ok="confirmPeople"
    >
      <div class="zj-people-picker">
        <Input
          v-model:value="peopleSearch"
          placeholder="搜索姓名、编号或部门"
          aria-label="搜索人员"
          allow-clear
        />
        <p class="zj-muted">
          已勾选 {{ pendingPeople.length }} 人，支持跨页选择
        </p>
        <div class="zj-people-table-wrap">
          <table class="zj-people-table">
            <thead>
              <tr>
                <th scope="col">选择</th>
                <th scope="col">姓名</th>
                <th scope="col">编号</th>
                <th scope="col">部门</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="person in pagedPeople" :key="person.value">
                <td>
                  <Checkbox
                    :aria-label="`选择${person.label}`"
                    :checked="pendingPeople.includes(person.value)"
                    @change="
                      pendingPeople = toggleSelection(
                        pendingPeople,
                        person.value,
                        !!$event.target.checked,
                      )
                    "
                  />
                </td>
                <td>{{ person.label }}</td>
                <td>{{ person.number }}</td>
                <td>{{ person.department }}</td>
              </tr>
              <tr v-if="!pagedPeople.length">
                <td colspan="4" class="zj-people-empty">没有找到匹配人员</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Pagination
          v-model:current="peoplePage"
          :total="filteredPeople.length"
          :page-size="peoplePageSize"
          :show-size-changer="false"
          :show-total="(total: number) => `共 ${total} 人`"
        />
      </div>
    </Modal>
    <Modal
      v-model:open="sourceModal"
      title="选择数据源"
      :width="680"
      ok-text="确认选择"
      cancel-text="取消"
      @ok="confirmSources"
    >
      <div class="zj-source-picker">
        <Input
          v-model:value="sourceSearch"
          placeholder="搜索数据源名称、系统或描述"
          aria-label="搜索数据源"
          allow-clear
        />
        <p>已勾选 {{ pendingSources.length }} 个数据源</p>
        <div class="zj-source-picker-options">
          <Checkbox
            v-for="source in availableSources"
            :key="source.id"
            :checked="pendingSources.includes(source.id)"
            @change="
              pendingSources = toggleSelection(
                pendingSources,
                source.id,
                !!$event.target.checked,
              )
            "
            ><strong>{{ source.name }}</strong
            ><small
              >{{ source.system }} · {{ source.description }} ·
              {{ source.status }}</small
            ></Checkbox
          >
        </div>
        <p v-if="!availableSources.length">
          没有匹配的数据源，请换个关键词。
        </p>
      </div>
    </Modal>
    <Drawer v-model:open="preview" title="汇报者端配置预览" :width="480"
      ><div class="zj-drawer-content">
        <span class="zj-badge">{{ selectedType.name }}</span>
        <h2>{{ form.name || '新的汇报方案' }}</h2>
        <p>{{ form.description }}</p>
        <label class="zj-field"
          ><span>{{
            form.mode === 'fixed' ? '固定汇报周期' : '选择汇报周期'
          }}</span
          ><select v-model="previewPeriod" :disabled="form.mode === 'fixed'">
            <option
              v-for="p in periodOptions"
              :key="p.value"
              :value="p.value"
            >
              {{ p.label }}
            </option>
          </select></label
        >
        <div class="zj-inline-note">
          <Icon icon="lucide:calendar-range" />
          <div>
            <strong>{{ previewRange.start }} — {{ previewRange.end }}</strong>
            <p>以 2026-10-22 为参考日期展示周期边界</p>
          </div>
        </div>
        <h3>报告内容</h3>
        <ol class="zj-preview-sections">
          <li v-for="section in form.sections" :key="section">
            {{ section }}<small>AI 整理 + 人工补充</small>
          </li>
        </ol>
        <p class="zj-muted">此处预览配置，不生成真实业务内容。</p>
      </div></Drawer
    >
    <Drawer v-model:open="historyOpen" title="配置版本历史" :width="440"
      ><div class="zj-drawer-content">
        <h3>当前版本 V{{ existing?.version }}</h3>
        <p>{{ existing?.updated }}</p>
        <div v-for="(h, i) in history" :key="i" class="zj-history-item">
          <strong>V{{ h.version }} · {{ h.name }}</strong>
          <p>{{ zhijiCycleText(h.snapshot) }}</p>
          <small>{{ h.snapshot.updated }}</small>
        </div>
        <p v-if="history.length === 0" class="zj-muted">
          本次会话尚无配置变更。发布新版本后，旧配置快照会保留在这里。
        </p>
      </div></Drawer
    >
  </section>
</template>
