<script setup lang="ts">
import type { ManagedProject, ProjectHealth, ProjectKr, ProjectObjective, ProjectStage } from '#/types/project-management';
import type { UploadProps } from 'ant-design-vue';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Empty, Input, message, Progress, Select, Tag, Upload } from 'ant-design-vue';

import { managedProjects } from '#/api/mock-project-management';
import { useProjectManagementDemoStore } from '#/store/project-management-demo';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import ProjectCreateWizard from '../components/project-create-wizard.vue';

const router = useRouter();
const store = useProjectManagementDemoStore();
const wizardOpen = ref(false);
const keyword = ref('');
const healthFilter = ref('all');
const typeFilter = ref('all');
const selectedProjectId = ref(managedProjects[0]?.id || '');
const stageDetailOpen = ref(false);
const progressDrafts = reactive<Record<string, number>>({});
const statusDrafts = reactive<Record<string, 'active' | 'completed' | 'pending' | 'risk' | 'watch'>>({});
const uploadedFiles = reactive<Record<string, Array<{ name: string; size: string; uploadedAt: string }>>>({});

const healthOptions = [
  { label: '全部状态', value: 'all' },
  { label: '正常', value: 'healthy' },
  { label: '需关注', value: 'watch' },
  { label: '有风险', value: 'at-risk' },
];
const typeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '标准交付', value: 'standard-delivery' },
  { label: '定制开发', value: 'custom-development' },
  { label: 'OEM 合作', value: 'oem' },
];

function projectHealth(project: ManagedProject): ProjectHealth {
  return project.id === 'customer-b-delivery' ? store.activeStage.health : project.health;
}
function projectHealthLabel(project: ManagedProject) {
  return project.id === 'customer-b-delivery' ? store.activeStage.healthLabel : project.healthLabel;
}
function projectProgress(project: ManagedProject) {
  return project.id === 'customer-b-delivery' ? store.activeStage.progress : project.progress;
}

const filteredProjects = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return managedProjects.filter((project) => {
    const matchesKeyword = !query || `${project.name}${project.customer}${project.manager}${project.typeLabel}`.toLowerCase().includes(query);
    const matchesHealth = healthFilter.value === 'all' || projectHealth(project) === healthFilter.value;
    const matchesType = typeFilter.value === 'all' || project.type === typeFilter.value;
    return matchesKeyword && matchesHealth && matchesType;
  });
});
const selectedProject = computed(() => managedProjects.find((project) => project.id === selectedProjectId.value) || filteredProjects.value[0]);
const activeStage = computed<ProjectStage | undefined>(() => selectedProject.value?.stages.find((stage) => stage.name === selectedProject.value?.stage) || selectedProject.value?.stages.find((stage) => ['blocked', 'in-progress', 'ready'].includes(stage.status)) || selectedProject.value?.stages.at(-1));
const currentObjective = computed(() => {
  const objectives = selectedProject.value?.objectives || [];
  return objectives.find((objective) => objective.progress < 100 && objective.health !== 'healthy') || objectives.find((objective) => objective.progress < 100) || objectives.at(-1);
});

watch(filteredProjects, (projects) => {
  if (!projects.some((project) => project.id === selectedProjectId.value)) selectedProjectId.value = projects[0]?.id || '';
});

function objectiveProgress(objective: ProjectObjective) {
  return selectedProject.value?.id === 'customer-b-delivery' && objective.id === 'o2' ? store.activeStage.progress : objective.progress;
}
function healthColor(health: ProjectHealth) {
  if (health === 'healthy') return 'green';
  if (health === 'at-risk' || health === 'blocked') return 'red';
  return 'orange';
}
function krStatusLabel(kr: ProjectKr) {
  return { accepted: '已完成', 'at-risk': '有风险', 'in-progress': '进行中', missing: '缺少成果', pending: '待开始' }[kr.status];
}
function krStatusColor(kr: ProjectKr) {
  if (kr.status === 'accepted') return 'green';
  if (kr.status === 'at-risk' || kr.status === 'missing') return 'red';
  if (kr.status === 'in-progress') return 'blue';
  return undefined;
}
function krProgress(kr: ProjectKr) {
  if (kr.kind === 'deliverable') return kr.status === 'accepted' ? 100 : ['in-progress', 'at-risk'].includes(kr.status) ? 60 : 0;
  if (kr.target === 0) return kr.actual === 0 ? 100 : 0;
  return Math.min(100, Math.round(((kr.actual || 0) / Math.max(kr.target || 1, 1)) * 100));
}

function objectiveStatus(objective: ProjectObjective) {
  if (objective.progress === 100) return 'completed';
  if (objective.progress === 0) return 'pending';
  if (objective.health === 'at-risk' || objective.health === 'blocked') return 'risk';
  if (objective.health === 'watch') return 'watch';
  return 'active';
}

function openStageDetail() {
  if (!activeStage.value) return;
  activeStage.value.objectives.forEach((objective) => {
    progressDrafts[objective.id] = objective.progress;
    statusDrafts[objective.id] = objectiveStatus(objective);
  });
  stageDetailOpen.value = true;
}

function saveObjectiveProgress(stage: ProjectStage, objective: ProjectObjective) {
  const status = statusDrafts[objective.id] || 'active';
  let progress = Math.max(0, Math.min(100, Number(progressDrafts[objective.id]) || 0));
  if (status === 'completed') progress = 100;
  if (status === 'pending') progress = 0;
  if (status === 'active' && progress === 100) progress = 99;
  objective.progress = progress;
  objective.health = status === 'risk' ? 'at-risk' : status === 'watch' ? 'watch' : 'healthy';
  progressDrafts[objective.id] = progress;
  stage.progress = stage.objectives.length ? Math.round(stage.objectives.reduce((sum, item) => sum + item.progress, 0) / stage.objectives.length) : 0;
  if (selectedProject.value) selectedProject.value.progress = Math.round(selectedProject.value.stages.reduce((sum, item) => sum + item.progress, 0) / Math.max(selectedProject.value.stages.length, 1));
  const label = { active: '进行中', completed: '已完成', pending: '未开始', risk: '有风险', watch: '需关注' }[status];
  message.success(`“${objective.title}”已更新为 ${label} · ${progress}%`);
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function uploadStageDeliverable(kr: ProjectKr, file: Parameters<NonNullable<UploadProps['beforeUpload']>>[0]) {
  uploadedFiles[kr.id] = [...(uploadedFiles[kr.id] || []), { name: file.name, size: formatFileSize(file.size), uploadedAt: '刚刚' }];
  kr.weeklyEvidence = file.name;
  if (kr.status !== 'accepted') kr.status = 'in-progress';
  message.success(`“${file.name}”已上传并关联到“${kr.artifact || kr.title}”`);
  return false;
}
</script>

<template>
  <AiWorkPage eyebrow="PROJECTS & OBJECTIVES" title="项目" description="从项目进入目标，查看每个 O 的责任关系、当前进展以及下属 KR">
    <template #actions><Button class="project-light-action" @click="wizardOpen = true"><Icon icon="lucide:sparkles" /> AI 立项</Button></template>
    <div class="project-master-detail">
      <aside class="project-sidebar" aria-label="项目列表">
        <header class="sidebar-title"><div><span>ALL PROJECTS</span><h2>所有项目</h2></div><b>{{ filteredProjects.length }}/{{ managedProjects.length }}</b></header>
        <div class="project-filters">
          <Input v-model:value="keyword" allow-clear placeholder="搜索项目、客户、负责人" aria-label="搜索项目"><template #prefix><Icon icon="lucide:search" /></template></Input>
          <div><Select v-model:value="healthFilter" :options="healthOptions" aria-label="按项目状态过滤" /><Select v-model:value="typeFilter" :options="typeOptions" aria-label="按项目类型过滤" /></div>
        </div>
        <div v-if="filteredProjects.length" class="project-list">
          <button v-for="project in filteredProjects" :key="project.id" type="button" class="project-item" :class="{ 'is-selected': selectedProject?.id === project.id }" :aria-pressed="selectedProject?.id === project.id" @click="selectedProjectId = project.id">
            <span class="project-icon"><Icon icon="lucide:folder-kanban" /></span>
            <span class="project-item__body">
              <span class="project-item__title"><strong>{{ project.name }}</strong><Tag :color="healthColor(projectHealth(project))">{{ projectHealthLabel(project) }}</Tag></span>
              <small>{{ project.typeLabel }} · {{ project.stage }} · {{ project.manager }}</small>
              <span class="inline-progress"><Progress :percent="projectProgress(project)" :show-info="false" stroke-color="#0b806f" /><b>{{ projectProgress(project) }}%</b></span>
            </span>
          </button>
        </div>
        <Empty v-else description="没有符合条件的项目" />
      </aside>

      <main v-if="selectedProject" class="project-objectives">
        <section class="selected-project-header">
          <div class="selected-project-copy">
            <div><Tag>{{ selectedProject.typeLabel }}</Tag><Tag :color="healthColor(projectHealth(selectedProject))">{{ projectHealthLabel(selectedProject) }}</Tag></div>
            <h2>{{ selectedProject.name }}</h2><p>{{ selectedProject.summary }}</p>
            <div class="project-meta"><span><Icon icon="lucide:user-round" />项目经理 {{ selectedProject.manager }}</span><span><Icon icon="lucide:flag" />当前阶段 {{ selectedProject.stage }}</span><span><Icon icon="lucide:calendar-days" />计划完成 {{ selectedProject.dueDate }}</span><Button size="small" type="primary" @click="openStageDetail"><Icon icon="lucide:panel-right-open" />阶段详情</Button></div>
          </div>
          <div v-if="currentObjective" class="current-objective">
            <div><span>当前目标</span><Tag :color="healthColor(currentObjective.health)">{{ currentObjective.health === 'healthy' ? '正常' : currentObjective.health === 'at-risk' ? '有风险' : '需关注' }}</Tag></div>
            <strong>{{ currentObjective.code }} · {{ currentObjective.title }}</strong>
            <span class="inline-progress"><Progress :percent="objectiveProgress(currentObjective)" :show-info="false" stroke-color="#0b806f" /><b>{{ objectiveProgress(currentObjective) }}%</b></span>
            <small>{{ currentObjective.krs.length }} 个 KR 正在支撑该目标</small>
          </div>
        </section>

        <section class="objective-tree">
          <header class="tree-title"><div><span>OBJECTIVE HIERARCHY</span><h2>目标与关键结果</h2></div><p><b>{{ selectedProject.objectives.length }}</b> 个目标 · <b>{{ selectedProject.objectives.reduce((total, objective) => total + objective.krs.length, 0) }}</b> 个 KR</p></header>
          <article v-for="objective in selectedProject.objectives" :key="objective.id" class="objective-node" :class="{ 'is-current': objective.id === currentObjective?.id }">
            <div class="objective-rail"><span>{{ objective.code }}</span><i></i></div>
            <div class="objective-card">
              <header class="objective-header">
                <div><div class="tags"><Tag color="green">目标 O</Tag><Tag v-if="objective.id === currentObjective?.id" color="blue">当前目标</Tag><Tag :color="healthColor(objective.health)">{{ objective.progress === 100 ? '已完成' : objective.health === 'healthy' ? '正常' : objective.health === 'at-risk' ? '有风险' : '需关注' }}</Tag></div><h3>{{ objective.title }}</h3><p>{{ objective.description }}</p></div>
                <div class="objective-progress"><b>{{ objectiveProgress(objective) }}%</b><Progress :percent="objectiveProgress(objective)" :show-info="false" stroke-color="#0b806f" /><small>目标进展</small></div>
              </header>
              <div class="objective-people">
                <div><span>负责人</span><strong><i>{{ objective.owner.slice(0, 1) }}</i>{{ objective.owner }}</strong></div>
                <div><span>协助人</span><strong v-for="person in objective.collaborators" :key="person"><i>{{ person.slice(0, 1) }}</i>{{ person }}</strong></div>
              </div>
              <div class="kr-tree">
                <article v-for="kr in objective.krs" :key="kr.id" class="kr-node">
                  <div class="kr-branch"></div><div class="kr-kind" :class="`is-${kr.kind}`"><Icon :icon="kr.kind === 'deliverable' ? 'lucide:file-check-2' : 'lucide:gauge'" /></div>
                  <div class="kr-copy"><div><Tag :color="kr.kind === 'deliverable' ? 'cyan' : 'purple'">{{ kr.kind === 'deliverable' ? '成果物型 KR' : '指标型 KR' }}</Tag><Tag :color="krStatusColor(kr)">{{ krStatusLabel(kr) }}</Tag></div><strong>{{ kr.title }}</strong><small>负责人 {{ kr.owner }} · 截止 {{ kr.dueDate }}<template v-if="kr.kind === 'deliverable'"> · {{ kr.artifact }}</template><template v-else> · 当前 {{ kr.actual }}{{ kr.unit }} / 目标 {{ kr.target }}{{ kr.unit }}</template></small></div>
                  <span class="inline-progress kr-progress"><Progress :percent="krProgress(kr)" :show-info="false" :stroke-color="kr.status === 'at-risk' ? '#c65347' : '#3f9d86'" /><b>{{ krProgress(kr) }}%</b></span>
                </article>
              </div>
            </div>
          </article>
        </section>
        <footer class="page-footer"><span><Icon icon="lucide:info" />目标进展由下属 KR 状态和权重汇总。</span><Button @click="router.push(`/app/mate/employee/pmo-assistant/project/${selectedProject.id}`)">查看项目完整 Context <Icon icon="lucide:arrow-right" /></Button></footer>
      </main>
    </div>
    <Drawer v-model:open="stageDetailOpen" :width="860" placement="right" root-class-name="pmo-stage-detail-drawer" :title="activeStage ? `阶段详情 · ${activeStage.name}` : '阶段详情'">
      <div v-if="activeStage && selectedProject" class="pmo-stage-detail">
        <header class="stage-detail-hero"><div><span>{{ activeStage.code }}</span><div><small>{{ selectedProject.name }}</small><h2>{{ activeStage.name }}</h2><p>{{ activeStage.description }}</p></div></div><div><strong>{{ activeStage.progress }}%</strong><small>阶段完成进度</small></div></header>
        <section class="stage-detail-summary"><div><span>阶段负责人</span><strong>{{ activeStage.owner }}</strong></div><div><span>计划周期</span><strong>{{ activeStage.plannedStart }} 至 {{ activeStage.plannedEnd }}</strong></div><div><span>目标与 KR</span><strong>{{ activeStage.objectives.length }} 个目标 · {{ activeStage.objectives.reduce((sum, objective) => sum + objective.krs.length, 0) }} 项 KR</strong></div></section>
        <section class="stage-execution-note"><Icon icon="lucide:info" /><div><strong>可直接维护执行进展</strong><p>交付项目助理可在阶段详情中更新目标状态和进度，并上传成果物证据；阶段流转仍按门禁制度执行。</p></div></section>
        <section class="stage-objective-editor-list">
          <article v-for="objective in activeStage.objectives" :key="objective.id" class="stage-objective-editor">
            <header><div><Tag color="green">{{ objective.code }}</Tag><div><h3>{{ objective.title }}</h3><p>负责人 {{ objective.owner }} · 截止 {{ objective.dueDate || activeStage.plannedEnd }}</p></div></div><Tag :color="objective.progress === 100 ? 'green' : objective.health === 'at-risk' || objective.health === 'blocked' ? 'red' : objective.health === 'watch' ? 'orange' : 'blue'">{{ objective.progress === 100 ? '已完成' : objective.health === 'at-risk' || objective.health === 'blocked' ? '有风险' : objective.health === 'watch' ? '需关注' : '进行中' }}</Tag></header>
            <div class="objective-update-row"><label><span>目标状态</span><Select v-model:value="statusDrafts[objective.id]" :options="[{label:'未开始',value:'pending'},{label:'进行中',value:'active'},{label:'需关注',value:'watch'},{label:'有风险',value:'risk'},{label:'已完成',value:'completed'}]" /></label><label><span>完成进度</span><Input v-model:value="progressDrafts[objective.id]" type="number" :min="0" :max="100"><template #suffix>%</template></Input></label><Button type="primary" @click="saveObjectiveProgress(activeStage, objective)"><Icon icon="lucide:check" />保存更新</Button></div>
            <div class="stage-kr-editor-list">
              <div v-for="kr in objective.krs" :key="kr.id" class="stage-kr-editor-row"><span class="kr-editor-icon"><Icon :icon="kr.kind === 'deliverable' ? 'lucide:file-check-2' : 'lucide:gauge'" /></span><div><strong>{{ kr.artifact || kr.title }}</strong><small>{{ kr.kind === 'deliverable' ? '成果物型 KR' : '指标型 KR' }} · {{ krStatusLabel(kr) }} · {{ kr.owner }}</small><p v-if="kr.weeklyEvidence"><Icon icon="lucide:paperclip" />当前证据：{{ kr.weeklyEvidence }}</p></div><Upload v-if="kr.kind === 'deliverable'" :show-upload-list="false" :max-count="1" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg" :before-upload="(file) => uploadStageDeliverable(kr, file)"><Button><Icon icon="lucide:upload" />上传成果物</Button></Upload><span v-else class="metric-editor-value">{{ kr.actual ?? '—' }} / {{ kr.target ?? '—' }} {{ kr.unit }}</span></div>
            </div>
          </article>
        </section>
      </div>
      <template #footer><div class="stage-detail-footer"><span><Icon icon="lucide:database" />状态、进度与成果物将同步到项目执行视图</span><Button @click="stageDetailOpen = false">关闭</Button></div></template>
    </Drawer>
    <ProjectCreateWizard v-model:open="wizardOpen" />
  </AiWorkPage>
</template>

<style scoped>
.project-master-detail{display:grid;grid-template-columns:294px minmax(0,1fr);gap:12px;min-height:0}.project-sidebar,.project-objectives{min-height:0;background:#fff;border:1px solid #dce8e4;border-radius:14px}.project-sidebar{display:flex;flex-direction:column;overflow:hidden}.sidebar-title,.tree-title{display:flex;align-items:center;justify-content:space-between}.sidebar-title{padding:16px 16px 12px}.sidebar-title span,.tree-title span{font-size:9px;font-weight:800;letter-spacing:.12em;color:#0b806f}.sidebar-title h2,.tree-title h2{margin:2px 0 0;font-size:16px;font-weight:800;color:#173c34}.sidebar-title>b{padding:4px 8px;font-size:10px;color:#55736a;background:#edf5f2;border-radius:999px}.project-filters{display:grid;gap:8px;padding:0 12px 12px;border-bottom:1px solid #e4ece9}.project-filters>div{display:grid;grid-template-columns:1fr 1fr;gap:7px}.project-filters :deep(.ant-select){width:100%}.project-list{display:grid;gap:7px;padding:10px;overflow-y:auto}.project-item{display:grid;grid-template-columns:34px minmax(0,1fr);gap:10px;align-items:start;min-height:88px;padding:11px;color:#23483f;text-align:left;cursor:pointer;background:#f8fbfa;border:1px solid #e1ebe7;border-radius:11px;transition:180ms ease}.project-item:hover{background:#fff;border-color:#9fcac0;box-shadow:0 5px 14px rgb(11 110 101/8%)}.project-item:focus-visible{outline:3px solid rgb(11 128 111/24%);outline-offset:2px}.project-item.is-selected{background:#edf7f3;border-color:#0b806f;box-shadow:inset 3px 0 0 #0b806f}.project-icon{display:grid;place-items:center;width:34px;height:34px;font-size:16px;color:#0b806f;background:#dff0ea;border-radius:9px}.project-item__body{display:grid;gap:5px;min-width:0}.project-item__title{display:flex;gap:6px;align-items:center;justify-content:space-between}.project-item__title strong{min-width:0;overflow:hidden;font-size:12px;text-overflow:ellipsis;white-space:nowrap}.project-item__title :deep(.ant-tag){flex:none;margin:0;font-size:9px}.project-item__body>small{overflow:hidden;font-size:9px;color:#70857e;text-overflow:ellipsis;white-space:nowrap}.inline-progress{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}.inline-progress b{font-size:9px;color:#49675f}.project-objectives{overflow-y:auto;background:#f8fbfa}.selected-project-header{display:grid;grid-template-columns:minmax(0,1fr) minmax(250px,.42fr);gap:16px;padding:18px;background:#fff;border-bottom:1px solid #dfe9e5}.selected-project-copy h2{margin:7px 0 4px;font-size:20px;font-weight:820;color:#153b33}.selected-project-copy p{margin:0;font-size:11px;line-height:1.6;color:#5d756e}.project-meta{display:flex;flex-wrap:wrap;gap:8px 16px;margin-top:12px;font-size:10px;color:#557169}.project-meta span{display:inline-flex;gap:5px;align-items:center}.current-objective{display:grid;gap:7px;align-content:center;padding:14px;background:linear-gradient(145deg,#eff8f5,#fff);border:1px solid #cde4dc;border-radius:12px}.current-objective>div{display:flex;align-items:center;justify-content:space-between}.current-objective>div>span{font-size:9px;font-weight:800;letter-spacing:.08em;color:#0b806f}.current-objective>strong{font-size:12px;line-height:1.5;color:#173f36}.current-objective>small{font-size:9px;color:#6b8179}.objective-tree{display:grid;gap:10px;padding:16px}.tree-title{padding:0 2px 5px}.tree-title p{font-size:10px;color:#61776f}.tree-title b{color:#143d34}.objective-node{display:grid;grid-template-columns:42px minmax(0,1fr);gap:9px}.objective-rail{display:flex;flex-direction:column;align-items:center}.objective-rail span{z-index:1;display:grid;place-items:center;width:38px;height:38px;font-size:11px;font-weight:850;color:#0b6e65;background:#e3f2ed;border:1px solid #b9dcd2;border-radius:11px}.objective-rail i{width:1px;height:100%;min-height:28px;background:#c8ded7}.objective-node:last-child .objective-rail i{background:linear-gradient(#c8ded7 45%,transparent)}.objective-node.is-current .objective-rail span{color:#0b6e65;background:#d7ece6;border-color:#86bdaf;box-shadow:0 6px 16px rgb(11 110 101/12%)}.objective-card{overflow:hidden;background:#fff;border:1px solid #dce8e4;border-radius:13px}.objective-node.is-current .objective-card{border-color:#9fcfc3;box-shadow:0 7px 20px rgb(11 110 101/8%)}.objective-header{display:grid;grid-template-columns:minmax(0,1fr) 105px;gap:16px;padding:14px 15px 11px}.tags{display:flex;flex-wrap:wrap;gap:4px}.tags :deep(.ant-tag),.kr-copy :deep(.ant-tag){margin:0;font-size:9px}.objective-header h3{margin:7px 0 3px;font-size:14px;font-weight:800;color:#183e35}.objective-header p{margin:0;font-size:10px;line-height:1.55;color:#657b74}.objective-progress{display:grid;gap:3px;align-content:center;text-align:right}.objective-progress b{font-size:18px;color:#0b6e65}.objective-progress small{font-size:9px;color:#74877f}.objective-people{display:flex;gap:28px;align-items:center;padding:9px 15px;background:#f4f8f6;border-block:1px solid #e3ece8}.objective-people>div{display:flex;gap:8px;align-items:center}.objective-people span{font-size:9px;color:#71857e}.objective-people strong{display:inline-flex;gap:5px;align-items:center;font-size:10px;color:#34584f}.objective-people strong i{display:grid;place-items:center;width:21px;height:21px;font-size:9px;font-style:normal;color:#0b6e65;background:#dceee8;border-radius:50%}.kr-tree{display:grid;padding:4px 14px 10px 20px}.kr-node{display:grid;grid-template-columns:22px 34px minmax(0,1fr) 118px;gap:9px;align-items:center;min-height:66px;border-bottom:1px solid #e8efec}.kr-node:last-child{border-bottom:0}.kr-branch{position:relative;align-self:stretch;border-left:1px solid #bdd6ce}.kr-branch:after{position:absolute;top:50%;left:0;width:18px;height:1px;content:'';background:#bdd6ce}.kr-node:last-child .kr-branch{height:50%}.kr-kind{display:grid;place-items:center;width:32px;height:32px;font-size:15px;border-radius:9px}.kr-kind.is-deliverable{color:#087b78;background:#e2f3f1}.kr-kind.is-metric{color:#7453a6;background:#eee8f7}.kr-copy{display:grid;gap:4px;min-width:0}.kr-copy :deep(.ant-tag){margin-right:4px}.kr-copy>strong,.kr-copy>small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kr-copy>strong{font-size:11px;color:#294f46}.kr-copy>small{font-size:9px;color:#71857e}.page-footer{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:11px 16px 16px 67px;font-size:9px;color:#637970}.page-footer>span{display:inline-flex;gap:6px;align-items:center}.project-master-detail :deep(.ant-progress-line){margin:0}.project-master-detail :deep(.ant-tag){color:#4d625c!important;background:#f3f7f5!important;border-color:#d7e3df!important}.project-master-detail :deep(.ant-tag-green){color:#27725f!important;background:#e6f5ef!important;border-color:#b9dfd2!important}.project-master-detail :deep(.ant-tag-blue){color:#245d8f!important;background:#e8f2fb!important;border-color:#bdd7ed!important}.project-master-detail :deep(.ant-tag-red){color:#a34338!important;background:#fbecea!important;border-color:#efc4be!important}.project-master-detail :deep(.ant-tag-orange){color:#9a5b14!important;background:#fff3df!important;border-color:#efd3a9!important}.project-master-detail :deep(.ant-tag-cyan){color:#126b70!important;background:#e5f5f5!important;border-color:#b9dcde!important}.project-master-detail :deep(.ant-tag-purple){color:#68448f!important;background:#f1ebf8!important;border-color:#d6c4e8!important}.project-light-action{color:#0b6e65!important;background:#e9f6f2!important;border-color:#a8d2c7!important;box-shadow:none!important}.project-light-action:hover,.project-light-action:focus-visible{color:#075f56!important;background:#dcf0e9!important;border-color:#79b8a8!important}
.pmo-stage-detail { display: grid; gap: 14px; }
.stage-detail-hero { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; color: #fff; background: linear-gradient(135deg, #245e51, #183f37); border-radius: 12px; }
.stage-detail-hero > div:first-child { display: flex; gap: 12px; align-items: center; }
.stage-detail-hero > div:first-child > span { display: grid; width: 42px; height: 42px; place-items: center; font-size: 12px; font-weight: 800; color: #205b4d; background: #d9eee7; border-radius: 10px; }
.stage-detail-hero small { display: block; font-size: 12px; color: #b9dbd1; }
.stage-detail-hero h2 { margin: 2px 0; font-size: 18px; }
.stage-detail-hero p { margin: 0; font-size: 12px; color: #d2e4de; }
.stage-detail-hero > div:last-child { text-align: right; }
.stage-detail-hero > div:last-child strong { display: block; font-size: 22px; }
.stage-detail-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.stage-detail-summary > div { padding: 11px 12px; background: #f6faf8; border: 1px solid #dce7e3; border-radius: 9px; }
.stage-detail-summary span, .stage-detail-summary strong { display: block; font-size: 12px; }
.stage-detail-summary span { color: #7a8d85; }
.stage-detail-summary strong { margin-top: 4px; color: #35564d; }
.stage-execution-note { display: flex; gap: 9px; align-items: flex-start; padding: 11px 13px; color: #246b59; background: #edf7f3; border: 1px solid #d1e6df; border-radius: 9px; }
.stage-execution-note strong { font-size: 12px; }
.stage-execution-note p { margin: 3px 0 0; font-size: 12px; color: #657e75; }
.stage-objective-editor-list { display: grid; gap: 12px; }
.stage-objective-editor { overflow: hidden; background: #fff; border: 1px solid #d7e4df; border-radius: 11px; }
.stage-objective-editor > header { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; }
.stage-objective-editor > header > div { display: flex; align-items: center; gap: 9px; }
.stage-objective-editor h3 { margin: 0; font-size: 14px; color: #2e5148; }
.stage-objective-editor header p { margin: 3px 0 0; font-size: 12px; color: #74877f; }
.objective-update-row { display: grid; grid-template-columns: 170px 150px auto; gap: 10px; align-items: end; padding: 11px 14px; background: #f7faf9; border-block: 1px solid #e3ebe8; }
.objective-update-row label > span { display: block; margin-bottom: 5px; font-size: 12px; font-weight: 700; color: #536b62; }
.objective-update-row :deep(.ant-select) { width: 100%; }
.stage-kr-editor-list { padding: 0 14px; }
.stage-kr-editor-row { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; gap: 10px; align-items: center; min-height: 62px; border-top: 1px solid #e8eeec; }
.stage-kr-editor-row:first-child { border-top: 0; }
.kr-editor-icon { display: grid; width: 28px; height: 28px; place-items: center; color: #2f725f; background: #e9f4f0; border-radius: 7px; }
.stage-kr-editor-row > div { min-width: 0; }
.stage-kr-editor-row strong, .stage-kr-editor-row small { display: block; overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.stage-kr-editor-row strong { color: #35564d; }
.stage-kr-editor-row small { margin-top: 3px; color: #798a83; }
.stage-kr-editor-row p { display: flex; gap: 4px; align-items: center; margin: 4px 0 0; font-size: 12px; color: #39715f; }
.metric-editor-value { font-size: 12px; color: #657c74; }
.stage-detail-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.stage-detail-footer > span { display: flex; gap: 6px; align-items: center; font-size: 12px; color: #6b7f77; }
:global(.pmo-stage-detail-drawer .ant-drawer-body), :global(.pmo-stage-detail-drawer .ant-drawer-footer) { background: #f4f8f6; }

@media(max-width:1080px){.project-master-detail{grid-template-columns:250px minmax(0,1fr)}.selected-project-header{grid-template-columns:1fr}.kr-node{grid-template-columns:18px 32px minmax(0,1fr)}.kr-progress{grid-column:3;width:180px;padding-bottom:8px}}
@media(max-width:760px){.project-master-detail{grid-template-columns:1fr}.project-sidebar{max-height:340px}.objective-node{grid-template-columns:32px minmax(0,1fr)}.objective-rail span{width:30px;height:30px}.objective-header{grid-template-columns:1fr}.objective-progress{grid-template-columns:auto minmax(0,1fr) auto;align-items:center;text-align:left}.objective-people{align-items:flex-start;flex-direction:column;gap:7px}.page-footer{align-items:flex-start;flex-direction:column;padding-left:16px}}
@media(prefers-reduced-motion:reduce){.project-item{transition:none}}
</style>
