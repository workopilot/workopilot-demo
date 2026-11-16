<script setup lang="ts">
import { reactive, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, Select, Switch, message } from 'ant-design-vue';
import { reportLayoutTemplates } from '#/api/mock-report-layout-templates';
import type { ReportLayoutTemplate } from '#/api/mock-report-layout-templates';
const open = ref(false);
const draft = reactive<ReportLayoutTemplate>({
  id: '',
  name: '',
  description: '',
  kinds: ['personal', 'project', 'customer'],
  presentation: 'classic',
  enabled: true,
  version: 1,
  prompt: '',
});
const kinds = [
  { label: '个人报告', value: 'personal' },
  { label: '项目报告', value: 'project' },
  { label: '客户报告', value: 'customer' },
  { label: '产品线报告', value: 'productline' },
];
function edit(template?: ReportLayoutTemplate, copy = false) {
  const source = template ?? reportLayoutTemplates[0]!;
  Object.assign(draft, JSON.parse(JSON.stringify(source)), {
    id: template && !copy ? template.id : '',
    name: template ? `${template.name}${copy ? '（副本）' : ''}` : '',
    version: template && !copy ? template.version : 1,
  });
  open.value = true;
}
function save() {
  if (!draft.name.trim() || !draft.prompt.trim() || !draft.kinds.length)
    return message.warning('请填写模板名称、适用类型和 HTML 生成提示词');
  const index = reportLayoutTemplates.findIndex((item) => item.id === draft.id);
  const snapshot = JSON.parse(JSON.stringify(draft)) as ReportLayoutTemplate;
  snapshot.name = snapshot.name.trim();
  snapshot.prompt = snapshot.prompt.trim();
  if (index >= 0) {
    snapshot.version = reportLayoutTemplates[index]!.version + 1;
    reportLayoutTemplates[index] = snapshot;
  } else {
    snapshot.id = `layout-${Date.now()}`;
    snapshot.version = 1;
    reportLayoutTemplates.push(snapshot);
  }
  open.value = false;
  message.success('展示模板已保存，已生成或已提交报告的模板快照不变');
}
</script>
<template>
  <section class="zj-page">
    <header class="zj-page-header">
      <div>
        <div class="zj-eyebrow">知记 / 展示配置</div>
        <h1>展示模板</h1>
        <p>
          管理员维护报告 HTML 的生成提示词，汇报者在预览底部选择模板重新排版。
        </p>
      </div>
      <Button type="primary" @click="edit()"
        ><Icon icon="lucide:plus" />新增模板</Button
      >
    </header>
    <div class="zj-inline-note">
      <Icon icon="lucide:panels-top-left" />
      <p>
        内容总结决定“写什么”，展示模板决定“如何排版”。方案可指定可用模板与默认模板，切换排版保留正文、统计和人工补充。
      </p>
    </div>
    <div class="layout-template-grid">
      <article
        v-for="template in reportLayoutTemplates"
        :key="template.id"
        class="layout-template-card"
      >
        <div class="layout-sample" :class="template.presentation">
          <div class="sample-heading"><span></span><i></i></div>
          <div class="sample-metrics"><i v-for="n in 4" :key="n"></i></div>
          <div class="sample-body">
            <div><i></i><i></i><i></i></div>
            <div><i></i><i></i></div>
          </div>
          <span class="sample-version">V{{ template.version }}</span>
        </div>
        <div class="layout-template-info">
          <div class="layout-name">
            <h2>{{ template.name }}</h2>
            <Switch
              v-model:checked="template.enabled"
              :aria-label="`启用${template.name}`"
            />
          </div>
          <p>{{ template.description || '自定义报告排版模板' }}</p>
          <div class="layout-kinds">
            <span v-for="kind in template.kinds" :key="kind">{{
              kinds.find((item) => item.value === kind)?.label
            }}</span>
          </div>
          <div class="layout-actions">
            <Button @click="edit(template)"
              ><Icon icon="lucide:settings-2" />配置提示词</Button
            ><Button type="text" @click="edit(template, true)"
              ><Icon icon="lucide:copy" />复制</Button
            >
          </div>
        </div>
      </article>
    </div>
    <Drawer
      v-model:open="open"
      :title="draft.id ? `配置展示模板 · ${draft.name}` : '新增展示模板'"
      width="min(960px, 96vw)"
      :destroy-on-close="true"
    >
      <div class="layout-template-form">
        <div class="layout-form-pair">
          <label
            >模板名称 <b>*</b
            ><Input
              v-model:value="draft.name"
              placeholder="例如：项目管理汇报"
              :maxlength="40" /></label
          ><label
            >适用报告类型 <b>*</b
            ><Select
              v-model:value="draft.kinds"
              mode="multiple"
              :options="kinds"
          /></label>
        </div>
        <label
          >模板说明<Input
            v-model:value="draft.description"
            placeholder="说明适合的场景和排版特点"
        /></label>
        <div class="layout-form-pair">
          <label
            >演示视觉方向<Select
              v-model:value="draft.presentation"
              :options="[
                { value: 'classic', label: '清新绿' },
                { value: 'executive', label: '商务蓝' },
                { value: 'warm', label: '暖金色' },
              ]" /></label
          ><label class="layout-enable"
            >启用模板<Switch v-model:checked="draft.enabled"
          /></label>
        </div>
        <label class="layout-prompt-label"
          >HTML 生成提示词 <b>*</b
          ><small
            >配置页面结构、统计卡片、图表、风险分类、颜色和 PDF
            打印规范；只改变展示，不改写业务事实。</small
          ><Input.TextArea
            v-model:value="draft.prompt"
            class="layout-prompt-input"
            placeholder="输入生成报告 HTML 的完整提示词……"
            :spellcheck="false"
        /></label>
      </div>
      <template #footer
        ><div class="layout-drawer-footer">
          <span>{{
            draft.id
              ? `当前 V${draft.version} · 保存生成新版本`
              : '新模板保存为 V1'
          }}</span
          ><Button @click="open = false">取消</Button
          ><Button type="primary" @click="save">保存配置</Button>
        </div></template
      >
    </Drawer>
  </section>
</template>
<style scoped>
.layout-template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}
.layout-template-card {
  overflow: hidden;
  border: 1px solid #dce7e1;
  border-radius: 14px;
  background: white;
  box-shadow: 0 4px 18px #214d3d06;
}
.layout-sample {
  --sample: #38836a;
  position: relative;
  padding: 24px;
  height: 180px;
  background: #edf5f0;
}
.layout-sample.executive {
  --sample: #537daf;
  background: #edf2fa;
}
.layout-sample.warm {
  --sample: #b18b4b;
  background: #f9f3e8;
}
.sample-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.sample-heading span {
  width: 45%;
  height: 10px;
  background: var(--sample);
  border-radius: 3px;
  opacity: 0.7;
}
.sample-heading i {
  width: 18%;
  height: 6px;
  background: var(--sample);
  opacity: 0.2;
  border-radius: 3px;
}
.sample-metrics {
  display: flex;
  gap: 8px;
}
.sample-metrics > i {
  flex: 1;
  height: 33px;
  background: white;
  border-radius: 6px;
  border-top: 3px solid var(--sample);
}
.sample-body {
  display: flex;
  gap: 9px;
  margin-top: 12px;
}
.sample-body > div {
  flex: 1;
  padding: 10px;
  background: white;
  border-radius: 6px;
}
.sample-body i {
  display: block;
  width: 90%;
  height: 4px;
  margin: 4px 0;
  background: #e1e9e5;
  border-radius: 2px;
}
.sample-version {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 10px;
  color: var(--sample);
}
.layout-template-info {
  padding: 20px;
}
.layout-name {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.layout-name h2 {
  font-size: 17px;
  font-weight: 700;
  margin: 0;
}
.layout-template-info > p {
  font-size: 13px;
  color: #74867a;
  min-height: 40px;
  margin: 10px 0;
  line-height: 1.7;
}
.layout-kinds {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.layout-kinds span {
  color: #678174;
  background: #f1f6f3;
  padding: 3px 7px;
  border-radius: 5px;
  font-size: 11px;
}
.layout-actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}
.layout-actions :deep(button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.layout-template-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #375246;
}
.layout-template-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}
.layout-template-form b {
  color: #ba6052;
}
.layout-form-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.layout-enable {
  align-items: flex-start;
}
.layout-prompt-label small {
  color: #7f8e84;
  font-size: 12px;
  line-height: 1.7;
}
.layout-prompt-input {
  min-height: 360px;
  height: calc(100vh - 410px);
  font-size: 13px;
  line-height: 1.9;
  padding: 16px;
  resize: vertical;
  background: #f9fbfa;
}
.layout-drawer-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}
.layout-drawer-footer > span {
  margin-right: auto;
  color: #869489;
  font-size: 12px;
}
@media (max-width: 650px) {
  .layout-form-pair {
    grid-template-columns: 1fr;
  }
}
</style>
