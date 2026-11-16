<script setup lang="ts">
import type {
  ManagedProject,
  ProjectKr,
  ProjectObjective,
  ProjectStage,
} from '#/types/project-management';
import type { UploadProps } from 'ant-design-vue';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Pagination,
  Progress,
  Select,
  Tag,
  Upload,
} from 'ant-design-vue';

import { managedProjects } from '#/api/mock-project-management';

type ApprovalState = 'accepted' | 'draft' | 'pending' | 'rejected';
type GoalUpdateStatus = 'active' | 'completed' | 'pending' | 'risk' | 'watch';
type ItemType = 'deliverable' | 'goal';

interface BaseWorkItem {
  key: string;
  owner: string;
  project: ManagedProject;
  stage: ProjectStage;
  goal: ProjectObjective;
  type: ItemType;
}

interface GoalWorkItem extends BaseWorkItem {
  type: 'goal';
}

interface DeliverableWorkItem extends BaseWorkItem {
  kr: ProjectKr;
  type: 'deliverable';
}

type WorkItem = DeliverableWorkItem | GoalWorkItem;

const member = ref('王天豪');
const selectedProjectId = ref('all');
const projectKeyword = ref('');
const projectPage = ref(1);
const projectPageSize = 3;
const statusFilter = ref('all');
const keyword = ref('');
const drawerOpen = ref(false);
const selectedItem = ref<WorkItem>();
const progressDraft = ref(0);
const statusDraft = ref<GoalUpdateStatus>('active');
const updateNote = ref('');

const goalApprovalStates = reactive<Record<string, ApprovalState>>({});
const deliverableApprovalStates = reactive<Record<string, ApprovalState>>({});
const uploadedFiles = reactive<
  Record<string, Array<{ name: string; size: string; uploadedAt: string }>>
>({});

const reviewerAssignments: Record<string, string> = {
  'customer-b-delivery-obj-3-2': '赵凯',
  'product-ai-copilot-v3-obj-3-2': '孙莉',
  'product-ai-copilot-v3-obj-3-3': '林晓',
};

const allWorkItems = computed<WorkItem[]>(() =>
  managedProjects.flatMap((project) =>
    project.stages.flatMap((stage) =>
      stage.objectives.flatMap((goal) => {
        const items: WorkItem[] = [];
        if (goal.owner === member.value || goal.collaborators.includes(member.value)) {
          items.push({ goal, key: `${project.id}/${stage.id}/${goal.id}`, owner: goal.owner, project, stage, type: 'goal' });
        }
        goal.krs
          .filter((kr) => kr.kind === 'deliverable' && kr.owner === member.value)
          .forEach((kr) => {
            items.push({ goal, key: `${project.id}/${stage.id}/${goal.id}/${kr.id}`, kr, owner: kr.owner, project, stage, type: 'deliverable' });
          });
        return items;
      }),
    ),
  ),
);

const projectList = computed(() =>
  managedProjects.map((project) => ({
    count: allWorkItems.value.filter((item) => item.project.id === project.id).length,
    project,
  })),
);

const filteredProjectList = computed(() => {
  const query = projectKeyword.value.trim().toLowerCase();
  if (!query) return projectList.value;
  return projectList.value.filter(({ project }) =>
    `${project.name}${project.code}${project.customer}${project.manager}${project.stage}${project.department || ''}`
      .toLowerCase()
      .includes(query),
  );
});

const pagedProjectList = computed(() => {
  const start = (projectPage.value - 1) * projectPageSize;
  return filteredProjectList.value.slice(start, start + projectPageSize);
});

watch(projectKeyword, () => {
  projectPage.value = 1;
});

function reviewerFor(item: WorkItem) {
  const stageReviewer =
    item.goal.id.endsWith('-2') && item.stage.owner !== item.goal.owner
      ? item.stage.owner
      : undefined;
  const assigned = reviewerAssignments[item.goal.id] || stageReviewer;
  return { isDefault: !assigned, name: assigned || item.project.manager };
}

function goalApprovalState(goal: ProjectObjective): ApprovalState {
  return goalApprovalStates[goal.id] || (goal.progress >= 100 ? 'accepted' : 'draft');
}

function deliverableApprovalState(kr: ProjectKr): ApprovalState {
  if (deliverableApprovalStates[kr.id]) return deliverableApprovalStates[kr.id]!;
  if (kr.status === 'accepted') return 'accepted';
  if (kr.weeklyEvidence) return 'pending';
  return 'draft';
}

function approvalState(item: WorkItem) {
  return item.type === 'goal' ? goalApprovalState(item.goal) : deliverableApprovalState(item.kr);
}

function itemState(item: WorkItem) {
  const approval = approvalState(item);
  if (approval === 'accepted') return { key: 'accepted', label: item.type === 'goal' ? '已验收' : '已确认', tone: 'green' };
  if (approval === 'pending') return { key: 'pending-review', label: item.type === 'goal' ? '待验收' : '待确认', tone: 'orange' };
  if (approval === 'rejected') return { key: 'rejected', label: '需补充', tone: 'red' };
  if (item.type === 'deliverable') return { key: 'draft', label: '待上传', tone: 'neutral' };
  if (item.stage.status === 'pending' || item.goal.progress === 0) return { key: 'draft', label: '未开始', tone: 'neutral' };
  if (['at-risk', 'blocked'].includes(item.goal.health)) return { key: 'risk', label: '有风险', tone: 'red' };
  if (item.goal.health === 'watch') return { key: 'risk', label: '需关注', tone: 'amber' };
  return { key: 'active', label: '进行中', tone: 'blue' };
}

const filteredItems = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return allWorkItems.value.filter((item) => {
    const title = item.type === 'goal' ? item.goal.title : krTitle(item.kr);
    const text = `${title}${item.project.name}${item.stage.name}${item.owner}${reviewerFor(item).name}`.toLowerCase();
    return (selectedProjectId.value === 'all' || item.project.id === selectedProjectId.value) &&
      (statusFilter.value === 'all' || itemState(item).key === statusFilter.value) &&
      (!query || text.includes(query));
  });
});

const pageSummary = computed(() => ({
  deliverables: filteredItems.value.filter((item) => item.type === 'deliverable').length,
  goals: filteredItems.value.filter((item) => item.type === 'goal').length,
  pending: filteredItems.value.filter((item) => approvalState(item) === 'pending').length,
}));

const selectedProjectName = computed(() =>
  projectList.value.find(({ project }) => project.id === selectedProjectId.value)?.project.name || '全部项目',
);

function krTitle(kr: ProjectKr) {
  return kr.artifact || kr.title;
}

function itemTitle(item: WorkItem) {
  return item.type === 'goal' ? item.goal.title : krTitle(item.kr);
}

function itemDueDate(item: WorkItem) {
  return item.type === 'goal' ? item.goal.dueDate || item.stage.plannedEnd : item.kr.dueDate || item.stage.plannedEnd;
}

function selectProject(projectId: string) {
  selectedProjectId.value = projectId;
}

function openItem(item: WorkItem) {
  selectedItem.value = item;
  if (item.type === 'goal') {
    progressDraft.value = item.goal.progress;
    statusDraft.value = item.goal.progress >= 100 ? 'completed' : item.goal.progress === 0 ? 'pending' : ['at-risk', 'blocked'].includes(item.goal.health) ? 'risk' : item.goal.health === 'watch' ? 'watch' : 'active';
  }
  updateNote.value = '';
  drawerOpen.value = true;
}

function saveGoalUpdate() {
  const item = selectedItem.value;
  if (!item || item.type !== 'goal') return;
  let nextProgress = Math.max(0, Math.min(100, Number(progressDraft.value) || 0));
  if (statusDraft.value === 'completed') nextProgress = 100;
  if (statusDraft.value === 'pending') nextProgress = 0;
  const submittedAsComplete =
    statusDraft.value === 'completed' || nextProgress === 100;
  item.goal.progress = nextProgress;
  item.goal.health = statusDraft.value === 'risk' ? 'at-risk' : statusDraft.value === 'watch' ? 'watch' : 'healthy';

  if (submittedAsComplete) {
    goalApprovalStates[item.goal.id] = 'pending';
    message.success(`目标已提交验收，等待${reviewerFor(item).name}确认`);
  } else {
    goalApprovalStates[item.goal.id] = 'draft';
    message.success(`“${item.goal.title}”进度已更新为 ${nextProgress}%`);
  }
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function uploadedFileCount(krId: string) {
  return uploadedFiles[krId]?.length || 0;
}

function latestUploadedFileName(krId: string) {
  return uploadedFiles[krId]?.at(-1)?.name || '';
}

function uploadDeliverable(item: DeliverableWorkItem, file: Parameters<NonNullable<UploadProps['beforeUpload']>>[0]) {
  uploadedFiles[item.kr.id] = [
    ...(uploadedFiles[item.kr.id] || []),
    { name: file.name, size: formatFileSize(file.size), uploadedAt: '刚刚' },
  ];
  item.kr.weeklyEvidence = file.name;
  item.kr.status = 'in-progress';
  deliverableApprovalStates[item.kr.id] = 'pending';
  message.success(`“${file.name}”已提交，等待${reviewerFor(item).name}确认`);
  return false;
}
</script>

<template>
  <section class="goals-page">
    <div class="goals-workbench">
      <aside class="project-sidebar" aria-label="项目列表">
        <header><div><span>PROJECTS</span><h2>项目列表</h2></div><b>{{ filteredProjectList.length }}</b></header>
        <Input v-model:value="projectKeyword" allow-clear class="project-search" placeholder="搜索项目" aria-label="搜索项目"><template #prefix><Icon icon="lucide:search" /></template></Input>
        <button type="button" class="project-filter-card is-all" :class="{ active: selectedProjectId === 'all' }" @click="selectProject('all')">
          <span class="project-avatar"><Icon icon="lucide:layers-3" /></span>
          <span><strong>全部项目</strong><small>查看所有目标与成果物</small></span>
          <b>{{ allWorkItems.length }}</b>
        </button>
        <div class="project-list-scroll">
          <button v-for="record in pagedProjectList" :key="record.project.id" type="button" class="project-filter-card" :class="{ active: selectedProjectId === record.project.id }" @click="selectProject(record.project.id)">
            <span class="project-avatar"><Icon icon="lucide:folder-kanban" /></span>
            <span><strong>{{ record.project.name }}</strong><small>{{ record.project.stage }} · {{ record.project.manager }}</small></span>
            <b>{{ record.count }}</b>
          </button>
          <Empty v-if="!filteredProjectList.length" :image-style="{ height: '36px' }" description="未找到项目" />
        </div>
        <Pagination v-if="filteredProjectList.length > projectPageSize" v-model:current="projectPage" class="project-pagination" :total="filteredProjectList.length" :page-size="projectPageSize" :show-size-changer="false" size="small" />
        <footer><Icon icon="lucide:shield-check" /><span>目标和成果物提交后，由审核员或项目经理确认。</span></footer>
      </aside>

      <main class="items-panel">
        <header class="items-panel-head">
          <div><span>当前范围</span><h2>{{ selectedProjectName }}</h2><p>{{ filteredItems.length }} 项工作内容</p></div>
          <section class="summary-cards" aria-label="工作项汇总">
            <article><span>目标</span><strong>{{ pageSummary.goals }}</strong></article>
            <article><span>成果物</span><strong>{{ pageSummary.deliverables }}</strong></article>
            <article class="is-pending"><span>待确认</span><strong>{{ pageSummary.pending }}</strong></article>
          </section>
        </header>

        <div class="item-filters">
          <Input v-model:value="keyword" allow-clear placeholder="搜索目标、成果物、项目或负责人" aria-label="搜索目标和成果物"><template #prefix><Icon icon="lucide:search" /></template></Input>
          <Select v-model:value="statusFilter" :options="[{label:'全部状态',value:'all'},{label:'进行中',value:'active'},{label:'待验收 / 待确认',value:'pending-review'},{label:'已验收 / 已确认',value:'accepted'},{label:'有风险',value:'risk'},{label:'未开始 / 待上传',value:'draft'}]" aria-label="工作项状态" />
        </div>

        <section v-if="filteredItems.length" class="work-item-list">
          <article v-for="item in filteredItems" :key="item.key" class="work-item-card" :class="[`is-${item.type}`, `is-${itemState(item).tone}`]">
            <span class="item-type-icon"><Icon :icon="item.type === 'goal' ? 'lucide:target' : 'lucide:file-up'" /></span>
            <div class="item-main">
              <div class="item-primary-line">
                <Tag :color="item.type === 'goal' ? 'green' : 'purple'">{{ item.type === 'goal' ? '目标' : '成果物' }}</Tag>
                <h3>{{ itemTitle(item) }}</h3>
                <span class="state" :class="itemState(item).tone">{{ itemState(item).label }}</span>
              </div>
              <div class="item-secondary-line">
                <span class="item-stage"><Icon icon="lucide:folder-kanban" />{{ item.project.name }} · {{ item.stage.name }}</span>
                <span><Icon icon="lucide:user-round" />负责人 {{ item.owner }}</span>
                <span><Icon icon="lucide:shield-check" />审核员 {{ reviewerFor(item).name }}<i v-if="reviewerFor(item).isDefault">（默认项目经理）</i></span>
                <span><Icon icon="lucide:calendar-days" />{{ itemDueDate(item) }}</span>
                <span v-if="item.type === 'goal'" class="inline-progress"><Progress :percent="item.goal.progress" :show-info="false" stroke-color="#19866d" /><b>{{ item.goal.progress }}%</b></span>
                <span v-else-if="item.kr.weeklyEvidence" class="file-evidence"><Icon icon="lucide:paperclip" />{{ item.kr.weeklyEvidence }}</span>
              </div>
            </div>
            <div class="item-actions">
              <Button v-if="item.type === 'goal'" size="small" type="link" @click="openItem(item)">更新</Button>
              <Upload v-else :show-upload-list="false" :max-count="1" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg" :before-upload="(file) => uploadDeliverable(item, file)"><Button size="small" type="link">上传</Button></Upload>
              <Button size="small" type="text" @click="openItem(item)"><Icon icon="lucide:chevron-right" /></Button>
            </div>
          </article>
        </section>
        <Empty v-else description="当前范围内没有符合条件的目标或成果物" />
      </main>
    </div>

    <Drawer v-model:open="drawerOpen" :title="selectedItem?.type === 'goal' ? '目标进展与验收' : '成果物提交与确认'" :width="720" root-class-name="personal-goal-drawer">
      <template v-if="selectedItem">
        <section class="drawer-hero">
          <div class="drawer-hero-tag"><Icon :icon="selectedItem.type === 'goal' ? 'lucide:target' : 'lucide:file-check-2'" /><span>{{ selectedItem.type === 'goal' ? '目标' : '成果物' }}</span></div>
          <p>{{ selectedItem.project.name }} / {{ selectedItem.stage.name }}</p>
          <h2>{{ itemTitle(selectedItem) }}</h2>
          <div class="drawer-people"><span>负责人 <b>{{ selectedItem.owner }}</b></span><span>审核员 <b>{{ reviewerFor(selectedItem).name }}</b><i v-if="reviewerFor(selectedItem).isDefault">默认项目经理</i></span><span>截止时间 <b>{{ itemDueDate(selectedItem) }}</b></span></div>
        </section>

        <section class="approval-rule"><Icon icon="lucide:info" /><div><strong>{{ selectedItem.type === 'goal' ? '完成后需要验收' : '上传后进入待确认' }}</strong><p>提交后由 {{ reviewerFor(selectedItem).name }} 确认；目标未设置审核员时，自动由项目经理负责验收。</p></div><span class="state" :class="itemState(selectedItem).tone">{{ itemState(selectedItem).label }}</span></section>

        <section v-if="selectedItem.type === 'goal'" class="drawer-card">
          <header><div><h3>更新完成情况</h3><p>完成度达到 100% 或选择“已完成并提交验收”后，状态变为待验收。</p></div><Button type="primary" @click="saveGoalUpdate"><Icon icon="lucide:send" />保存并提交</Button></header>
          <div class="update-grid">
            <label><span>目标状态</span><Select v-model:value="statusDraft" :options="[{label:'未开始',value:'pending'},{label:'进行中',value:'active'},{label:'需关注',value:'watch'},{label:'有风险',value:'risk'},{label:'已完成并提交验收',value:'completed'}]" /></label>
            <label><span>完成进度</span><Input v-model:value="progressDraft" type="number" :min="0" :max="100"><template #suffix>%</template></Input></label>
          </div>
          <div class="progress-presets"><Button v-for="value in [0,25,50,75,100]" :key="value" size="small" :type="Number(progressDraft) === value ? 'primary' : 'default'" @click="progressDraft = value">{{ value }}%</Button></div>
          <label class="update-note"><span>完成说明与验收依据</span><Input.TextArea v-model:value="updateNote" :rows="4" placeholder="填写本次完成内容、结果数据、关联文件或需要审核员关注的事项" /></label>
        </section>

        <section v-else class="drawer-card">
          <header><div><h3>上传成果文件</h3><p>支持文档、表格、演示文稿、压缩包和图片；每次上传作为一个新版本提交确认。</p></div></header>
          <div class="acceptance-box"><span>验收要求</span><p>{{ selectedItem.kr.acceptance || '文件内容完整、命名规范，并满足当前阶段验收要求。' }}</p></div>
          <div class="uploaded-file-box"><Icon icon="lucide:paperclip" /><div><strong v-if="uploadedFileCount(selectedItem.kr.id)">已上传 {{ uploadedFileCount(selectedItem.kr.id) }} 个文件</strong><strong v-else>尚未上传本次成果文件</strong><p v-if="latestUploadedFileName(selectedItem.kr.id)">最新版本：{{ latestUploadedFileName(selectedItem.kr.id) }}</p><p v-else-if="selectedItem.kr.weeklyEvidence">已有证据：{{ selectedItem.kr.weeklyEvidence }}</p></div><Upload :show-upload-list="false" :max-count="1" accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg" :before-upload="(file) => uploadDeliverable(selectedItem, file)"><Button type="primary"><Icon icon="lucide:upload" />选择文件并提交</Button></Upload></div>
        </section>
      </template>
      <template #footer><div class="drawer-footer"><span><Icon icon="lucide:shield-check" />提交后由审核员或项目经理确认</span><Button @click="drawerOpen = false">关闭</Button></div></template>
    </Drawer>
  </section>
</template>

<style scoped>
.goals-page{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;overflow:hidden;color:#294e42;background:#eef3f1;border:1px solid #d4e1dc;border-radius:12px}.goals-heading{display:flex;align-items:center;justify-content:space-between;padding:13px 17px;background:#fff;border-bottom:1px solid #dce7e3}.heading-copy,.heading-copy>div,.identity{display:flex;align-items:center}.heading-copy{gap:10px}.heading-icon{display:grid;width:38px;height:38px;place-items:center;font-size:19px;color:#fff;background:linear-gradient(145deg,#25886d,#146c58);border-radius:10px}.heading-copy>div{display:block}.heading-copy h1{margin:0;font-size:18px;font-weight:780;color:#21483e}.heading-copy p{margin:2px 0 0;font-size:11px;color:#6f837c}.identity{gap:8px;font-size:11px;color:#6c8179}.identity :deep(.ant-select){width:120px}.goals-workbench{display:grid;grid-template-columns:260px minmax(0,1fr);flex:1;min-height:0}.project-sidebar{display:flex;flex-direction:column;min-height:0;padding:13px;background:#f5f9f7;border-right:1px solid #d8e5e0}.project-sidebar>header{display:flex;align-items:center;justify-content:space-between;padding:2px 3px 10px}.project-sidebar>header span{font-size:9px;font-weight:800;letter-spacing:.11em;color:#24816b}.project-sidebar h2{margin:2px 0 0;font-size:15px;color:#234a40}.project-sidebar>header>b{display:grid;min-width:24px;height:24px;place-items:center;font-size:10px;color:#5b746c;background:#e5eeeb;border-radius:999px}.project-list-scroll{display:grid;gap:6px;overflow:auto}.project-filter-card{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:9px;align-items:center;width:100%;min-height:62px;padding:9px;text-align:left;cursor:pointer;background:#fff;border:1px solid #dce7e3;border-radius:9px}.project-filter-card.is-all{margin-bottom:7px}.project-filter-card:hover,.project-filter-card:focus-visible{outline:0;border-color:#9ec9bd}.project-filter-card.active{background:#eaf5f1;border-color:#6eae9d;box-shadow:inset 3px 0 0 #23866d}.project-avatar{display:grid;width:34px;height:34px;place-items:center;font-size:15px;color:#247660;background:#e6f2ee;border-radius:9px}.project-filter-card>span:nth-child(2){display:grid;gap:3px;min-width:0}.project-filter-card strong,.project-filter-card small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.project-filter-card strong{font-size:11px;color:#31554c}.project-filter-card small{font-size:9px;color:#778a83}.project-filter-card>b{display:grid;min-width:21px;height:21px;place-items:center;font-size:9px;color:#587068;background:#eef3f1;border-radius:999px}.project-filter-card :deep(.ant-progress){grid-column:2/4;margin:0}.project-sidebar>footer{display:flex;gap:7px;align-items:flex-start;padding:10px;margin-top:auto;font-size:10px;line-height:1.5;color:#617970;background:#eaf3f0;border-radius:8px}.project-sidebar>footer svg{flex:none;margin-top:2px;color:#258069}.items-panel{min-width:0;overflow:auto;background:#f8fbfa}.items-panel-head{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:14px 16px;background:#fff;border-bottom:1px solid #e0e9e6}.items-panel-head>div>span{font-size:9px;font-weight:800;letter-spacing:.08em;color:#28826c}.items-panel-head h2{margin:2px 0;font-size:17px;color:#22483e}.items-panel-head p{margin:0;font-size:10px;color:#768a83}.summary-cards{display:flex;gap:7px}.summary-cards article{display:grid;grid-template-columns:auto auto;gap:10px;align-items:center;min-width:96px;padding:8px 10px;background:#f5f9f7;border:1px solid #e0e9e6;border-radius:8px}.summary-cards span{font-size:10px;color:#73867f}.summary-cards strong{font-size:17px;color:#31564c}.summary-cards .is-pending{background:#fff7e9;border-color:#edd9b5}.summary-cards .is-pending strong{color:#a66b18}.item-filters{display:grid;grid-template-columns:minmax(260px,1fr) 180px;gap:9px;padding:12px 16px}.item-filters :deep(.ant-select){width:100%}.work-item-list{display:grid;gap:8px;padding:0 16px 18px}.work-item-card{display:grid;grid-template-columns:40px minmax(260px,1fr) 105px 150px 88px auto;gap:12px;align-items:center;padding:12px 13px;background:#fff;border:1px solid #dce7e3;border-left:3px solid #279075;border-radius:10px}.work-item-card.is-deliverable{border-left-color:#8061a6}.work-item-card.is-orange{border-left-color:#dd962e}.work-item-card.is-red{border-left-color:#d95c50}.item-type-icon{display:grid;width:38px;height:38px;place-items:center;font-size:17px;color:#1e7860;background:#e7f4ef;border-radius:10px}.work-item-card.is-deliverable .item-type-icon{color:#705094;background:#f1ebf7}.item-main{display:grid;gap:4px;min-width:0}.item-title-line{display:flex;gap:6px;align-items:center}.item-title-line :deep(.ant-tag){margin:0;font-size:9px}.item-stage{overflow:hidden;font-size:9px;color:#7c8d87;text-overflow:ellipsis;white-space:nowrap}.item-main h3,.item-main p{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.item-main h3{margin:0;font-size:12px;font-weight:730;color:#2e5148}.item-main p{margin:0;font-size:10px;color:#70847c}.goal-progress-line{display:grid;grid-template-columns:minmax(0,1fr) 34px;gap:7px;align-items:center;max-width:280px}.goal-progress-line :deep(.ant-progress){margin:0}.goal-progress-line b{font-size:9px;color:#577068}.file-evidence{display:flex;gap:4px;align-items:center;overflow:hidden;font-size:9px;color:#54756b;text-overflow:ellipsis;white-space:nowrap}.item-person{display:grid;gap:5px;min-width:0}.item-person>span,.item-status>small{font-size:9px;color:#7a8d86}.item-person strong{display:flex;gap:5px;align-items:center;overflow:hidden;font-size:10px;color:#3c5f55;text-overflow:ellipsis;white-space:nowrap}.item-person strong i{display:grid;flex:none;width:21px;height:21px;place-items:center;font-size:9px;font-style:normal;color:#1e745e;background:#e1f0eb;border-radius:50%}.item-person small{font-size:8px;line-height:1.3;color:#9a6a25}.item-status{display:grid;gap:6px;justify-items:start}.state{padding:3px 7px;font-size:9px;white-space:nowrap;border-radius:5px}.state.green{color:#267359;background:#e5f4ed}.state.orange{color:#9c6316;background:#fff0d9}.state.red{color:#ad493f;background:#fbe8e6}.state.amber{color:#94661f;background:#fff3de}.state.blue{color:#3f6f9f;background:#e8f0fa}.state.neutral{color:#657972;background:#edf1ef}.item-actions{display:flex;gap:6px;justify-content:flex-end}.item-actions :deep(.ant-btn){font-size:10px}.drawer-hero{padding:18px;margin-bottom:12px;color:#fff;background:linear-gradient(135deg,#245f51,#173f37);border-radius:12px}.drawer-hero-tag{display:flex;gap:6px;align-items:center;font-size:10px;color:#cfe5de}.drawer-hero>p{margin:9px 0 2px;font-size:10px;color:#bcd7cf}.drawer-hero h2{margin:0;font-size:19px}.drawer-people{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;font-size:10px;color:#c6ddd6}.drawer-people b{margin-left:4px;color:#fff}.drawer-people i{margin-left:4px;font-size:9px;font-style:normal;color:#f6cf8b}.approval-rule{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;padding:11px 13px;margin-bottom:12px;color:#346457;background:#edf7f3;border:1px solid #d0e5de;border-radius:9px}.approval-rule>svg{font-size:17px}.approval-rule strong{font-size:11px}.approval-rule p{margin:2px 0 0;font-size:10px;color:#6b8179}.drawer-card{padding:15px;background:#fff;border:1px solid #d8e5e0;border-radius:10px}.drawer-card>header{display:flex;gap:10px;align-items:center;justify-content:space-between}.drawer-card h3{margin:0;font-size:14px;color:#2e5148}.drawer-card header p{margin:3px 0 0;font-size:10px;color:#71857e}.update-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:15px}.update-grid label>span,.update-note>span{display:block;margin-bottom:5px;font-size:10px;font-weight:700;color:#526b62}.update-grid :deep(.ant-select){width:100%}.progress-presets{display:flex;gap:6px;margin:9px 0 13px}.update-note{display:block}.acceptance-box{padding:11px;margin-top:13px;background:#f6f9f8;border-radius:8px}.acceptance-box span{font-size:9px;font-weight:700;color:#657a72}.acceptance-box p{margin:4px 0 0;font-size:11px;line-height:1.6;color:#415f56}.uploaded-file-box{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:9px;align-items:center;padding:12px;margin-top:10px;border:1px dashed #b9d1c9;border-radius:8px}.uploaded-file-box>svg{font-size:18px;color:#357763}.uploaded-file-box strong{font-size:11px;color:#36584f}.uploaded-file-box p{margin:3px 0 0;font-size:9px;color:#758880}.drawer-footer{display:flex;align-items:center;justify-content:space-between}.drawer-footer>span{display:flex;gap:6px;align-items:center;font-size:10px;color:#667b74}:global(.personal-goal-drawer .ant-drawer-body),:global(.personal-goal-drawer .ant-drawer-footer){background:#f3f7f5}
@media(max-width:1100px){.goals-workbench{grid-template-columns:220px minmax(0,1fr)}.work-item-card{grid-template-columns:38px minmax(220px,1fr) 100px 135px auto}.item-status{grid-column:2}.item-actions{grid-column:3/6}}@media(max-width:760px){.goals-workbench{grid-template-columns:1fr}.project-sidebar{max-height:260px;border-right:0;border-bottom:1px solid #d8e5e0}.summary-cards{display:none}.item-filters{grid-template-columns:1fr}.work-item-card{grid-template-columns:36px minmax(0,1fr)}.item-person,.item-status,.item-actions{grid-column:2}.item-actions{justify-content:flex-start}.update-grid{grid-template-columns:1fr}.identity>span{display:none}}
.project-filter-card{grid-template-columns:30px minmax(0,1fr) auto;gap:8px;min-height:50px;padding:7px 8px;border-color:#e0e9e6;border-radius:8px}.project-avatar{width:30px;height:30px;font-size:14px;border-radius:8px}.project-filter-card :deep(.ant-progress){display:none}.work-item-list{gap:6px}.work-item-card{grid-template-columns:34px minmax(0,1fr) auto;gap:10px;min-height:62px;padding:8px 10px;border-color:#e0e9e6;border-left-width:2px;border-radius:8px}.item-type-icon{width:32px;height:32px;font-size:15px;border-radius:8px}.item-main{gap:5px}.item-primary-line,.item-secondary-line{display:flex;align-items:center;min-width:0}.item-primary-line{gap:7px}.item-primary-line :deep(.ant-tag){flex:none;margin:0;font-size:9px}.item-primary-line h3{min-width:0;margin:0;overflow:hidden;font-size:12px;font-weight:700;color:#2e5148;text-overflow:ellipsis;white-space:nowrap}.item-primary-line .state{flex:none;margin-left:auto}.item-secondary-line{gap:12px;overflow:hidden;font-size:9px;color:#73877f}.item-secondary-line>span{display:inline-flex;gap:4px;align-items:center;min-width:0;white-space:nowrap}.item-secondary-line>span:first-child{max-width:240px;overflow:hidden;text-overflow:ellipsis}.item-secondary-line svg{flex:none;font-size:11px;color:#789087}.item-secondary-line i{font-style:normal;color:#9c6b25}.inline-progress{width:100px}.inline-progress :deep(.ant-progress){width:66px;margin:0}.inline-progress b{font-size:9px;color:#587068}.file-evidence{max-width:180px}.item-actions{gap:1px}.item-actions :deep(.ant-btn){height:26px;padding-inline:6px}.item-person,.item-status,.goal-progress-line{display:none}
@media(max-width:1100px){.work-item-card{grid-template-columns:32px minmax(0,1fr) auto}.item-actions{grid-column:auto}.item-secondary-line{gap:8px}}
@media(max-width:760px){.work-item-card{grid-template-columns:30px minmax(0,1fr) auto}.item-actions{grid-column:3}.item-secondary-line>span:nth-child(3),.item-secondary-line>span:nth-child(4){display:none}.inline-progress{display:inline-flex!important}}
.project-search{margin-bottom:7px}.project-search :deep(.ant-input){font-size:11px}.project-search :deep(.ant-input-affix-wrapper){min-height:30px}.project-pagination{display:flex;justify-content:center;padding:9px 0 6px}.project-pagination :deep(.ant-pagination-item),.project-pagination :deep(.ant-pagination-prev),.project-pagination :deep(.ant-pagination-next){min-width:24px;height:24px;line-height:22px}.project-list-scroll :deep(.ant-empty){margin:16px 0}.project-list-scroll :deep(.ant-empty-description){font-size:10px;color:#81918b}
</style>
