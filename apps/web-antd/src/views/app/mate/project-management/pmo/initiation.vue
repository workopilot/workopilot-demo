<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Empty,
  Input,
  message,
  Progress,
  Select,
  Upload,
} from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type InitiationStatus =
  | 'active'
  | 'baseline'
  | 'charter'
  | 'materials'
  | 'parsing';
type InitiationView = 'manage' | 'wizard';
type WorkStep = 'analysis' | 'baseline' | 'charter' | 'materials';

interface ClassifiedMaterial {
  category: string;
  fileName: string;
  icon: string;
  id: string;
}

interface InitiationRecord {
  code: string;
  customer: string;
  dueDate: string;
  id: string;
  manager: string;
  name: string;
  projectDirectory?: string;
  projectType: string;
  status: InitiationStatus;
  statusLabel: string;
  summary: string;
  template: string;
  updatedAt: string;
}

interface ProjectStageDraft {
  code: string;
  collaborators: string;
  dependency: string;
  dueDate: string;
  goalOwner: string;
  krs: ProjectKrDraft[];
  name: string;
  objective: string;
  stageOwner: string;
  startDate: string;
}

interface ProjectKrDraft {
  dueDate: string;
  id: string;
  name: string;
  owner: string;
  type: 'deliverable' | 'metric';
}

interface RaciDraftRow {
  accountable: string;
  consulted: string;
  informed: string;
  responsible: string;
  workstream: string;
}

const router = useRouter();
const keyword = ref('');
const selectedId = ref('customer-b');
const activeStep = ref<WorkStep>('charter');
const initiationView = ref<InitiationView>('manage');
const furthestStepIndex = ref(0);
const sourceDrawerOpen = ref(false);
const sourceTitle = ref('');
const parseProgress = ref(100);
const parsing = ref(false);
const structureEditing = ref(false);
const raciEditing = ref(false);
const uploadedMaterials = ref<ClassifiedMaterial[]>([
  {
    id: 'contract-demo',
    category: '客户合同 / SOW',
    fileName: '客户交付合同.pdf',
    icon: 'lucide:file-signature',
  },
  {
    id: 'requirement-demo',
    category: '项目需求说明',
    fileName: '项目需求说明.docx',
    icon: 'lucide:file-chart-column',
  },
  {
    id: 'meeting-demo',
    category: '会议纪要',
    fileName: '项目启动会议纪要.docx',
    icon: 'lucide:notebook-tabs',
  },
]);
const recognizingProjectInfo = ref(false);
const projectInfoGenerated = ref(true);
const recognitionProgress = ref(0);
const recognitionStageIndex = ref(0);
const publishedRecord = ref<InitiationRecord | null>(null);
let parseTimer: ReturnType<typeof setInterval> | undefined;
let recognitionTimer: ReturnType<typeof setInterval> | undefined;

const recognitionStages = [
  {
    label: '正在提取项目信息',
    description: '识别项目名称、客户、类型与交付时间',
  },
  {
    label: '正在生成项目数据',
    description: '整理项目编号、目标摘要与交付边界',
  },
  {
    label: '正在完成智能推荐',
    description: '匹配项目模板并推荐项目负责人',
  },
];

const records = ref<InitiationRecord[]>([
  {
    id: 'customer-b',
    code: 'CB-DEL-2026',
    name: '客户 B 产线智能化升级交付项目',
    customer: '宁德智造',
    manager: '李四',
    projectDirectory: '客户交付 / 智能制造',
    projectType: '客户交付',
    template: '标准交付模板 V2.3',
    status: 'charter',
    statusLabel: '待确认宪章',
    dueDate: '2026-10-30',
    updatedAt: '10 分钟前',
    summary:
      '完成产线质检工位硬件、算法和接口升级，并按合同完成试运行与验收移交。',
  },
  {
    id: 'huada-crm',
    code: 'HD-CRM-2026',
    name: '华达药业 CRM 实施项目',
    customer: '华达药业',
    manager: '刘敏',
    projectDirectory: undefined,
    projectType: '系统实施',
    template: '标准交付模板 V2.3',
    status: 'materials',
    statusLabel: '资料待补充',
    dueDate: '2026-11-18',
    updatedAt: '昨天 16:40',
    summary: '完成 CRM 系统实施、数据迁移、用户培训和上线验收。',
  },
  {
    id: 'east-data',
    code: 'ED-DATA-2026',
    name: '东域数据治理交付项目',
    customer: '东域集团',
    manager: '王磊',
    projectType: '数据治理',
    template: '定制开发模板 V1.8',
    status: 'charter',
    statusLabel: '待确认宪章',
    projectDirectory: '客户交付 / 数据治理',
    dueDate: '2026-12-05',
    updatedAt: '今天 09:20',
    summary: '建立集团数据标准、质量规则与治理运营机制，完成首批主题域交付。',
  },
]);

const projectStages = ref<ProjectStageDraft[]>([
  {
    code: 'S1',
    name: '需求确认',
    objective: '确认项目范围、业务需求和验收边界',
    stageOwner: '李四',
    goalOwner: '李四',
    collaborators: '客户业务负责人、刘工',
    startDate: '09-05',
    dueDate: '09-12',
    dependency: '项目宪章确认',
    krs: [
      {
        id: 'S1-KR1',
        name: '客户需求确认记录',
        type: 'deliverable',
        owner: '李四',
        dueDate: '09-10',
      },
      {
        id: 'S1-KR2',
        name: '需求覆盖率达到 100%',
        type: 'metric',
        owner: '刘工',
        dueDate: '09-12',
      },
    ],
  },
  {
    code: 'S2',
    name: '方案设计',
    objective: '形成可实施方案并取得客户和内部批准',
    stageOwner: '张三',
    goalOwner: '张三',
    collaborators: '李四、客户 IT',
    startDate: '09-13',
    dueDate: '09-22',
    dependency: '需求确认完成',
    krs: [
      {
        id: 'S2-KR1',
        name: '项目实施方案',
        type: 'deliverable',
        owner: '张三',
        dueDate: '09-20',
      },
      {
        id: 'S2-KR2',
        name: '客户方案确认记录',
        type: 'deliverable',
        owner: '李四',
        dueDate: '09-22',
      },
    ],
  },
  {
    code: 'S3',
    name: '实施研发',
    objective: '完成核心能力开发、部署和接口联调',
    stageOwner: '张三',
    goalOwner: '张三',
    collaborators: '研发组、客户 IT',
    startDate: '09-23',
    dueDate: '10-12',
    dependency: '实施方案批准',
    krs: [
      {
        id: 'S3-KR1',
        name: '系统部署及联调报告',
        type: 'deliverable',
        owner: '张三',
        dueDate: '10-10',
      },
      {
        id: 'S3-KR2',
        name: '核心功能完成率达到 100%',
        type: 'metric',
        owner: '研发组',
        dueDate: '10-12',
      },
    ],
  },
  {
    code: 'S4',
    name: '试运行',
    objective: '完成 14 天稳定试运行并关闭关键缺陷',
    stageOwner: '孙莉',
    goalOwner: '孙莉',
    collaborators: '张三、客户运维',
    startDate: '10-13',
    dueDate: '10-26',
    dependency: '现场联调完成',
    krs: [
      {
        id: 'S4-KR1',
        name: '试运行记录',
        type: 'deliverable',
        owner: '孙莉',
        dueDate: '10-26',
      },
      {
        id: 'S4-KR2',
        name: '关键缺陷关闭率达到 100%',
        type: 'metric',
        owner: '张三',
        dueDate: '10-26',
      },
    ],
  },
  {
    code: 'S5',
    name: '客户验收',
    objective: '完成成果物审核、客户验收和问题闭环',
    stageOwner: '李四',
    goalOwner: '李四',
    collaborators: '孙莉、客户负责人',
    startDate: '10-27',
    dueDate: '10-30',
    dependency: '试运行通过',
    krs: [
      {
        id: 'S5-KR1',
        name: '客户验收报告',
        type: 'deliverable',
        owner: '李四',
        dueDate: '10-30',
      },
    ],
  },
  {
    code: 'S6',
    name: '运维移交',
    objective: '完成培训、运维资料和服务责任移交',
    stageOwner: '孙莉',
    goalOwner: '孙莉',
    collaborators: '客户运维负责人',
    startDate: '10-30',
    dueDate: '11-02',
    dependency: '客户验收完成',
    krs: [
      {
        id: 'S6-KR1',
        name: '运维交接清单',
        type: 'deliverable',
        owner: '孙莉',
        dueDate: '11-02',
      },
    ],
  },
]);

const raciRows = ref<RaciDraftRow[]>([
  {
    workstream: '需求与范围',
    responsible: '李四',
    accountable: '交付总监',
    consulted: '客户业务负责人、刘工',
    informed: '项目 PMO',
  },
  {
    workstream: '方案与实施',
    responsible: '张三',
    accountable: '',
    consulted: '客户 IT',
    informed: '',
  },
  {
    workstream: '试运行与验收',
    responsible: '孙莉',
    accountable: '李四',
    consulted: '客户业务负责人',
    informed: '',
  },
]);

const steps: Array<{ icon: string; key: WorkStep; label: string }> = [
  { key: 'materials', label: '项目资料', icon: 'lucide:files' },
  { key: 'analysis', label: 'AI 分析', icon: 'lucide:sparkles' },
  { key: 'charter', label: '项目宪章', icon: 'lucide:file-check-2' },
  { key: 'baseline', label: '执行基线', icon: 'lucide:git-commit-horizontal' },
];

const templateOptions = [
  { value: '标准交付模板 V2.3', label: '标准交付模板 V2.3' },
  { value: '设备交付模板 V2.1', label: '设备交付模板 V2.1' },
  { value: '定制开发模板 V1.8', label: '定制开发模板 V1.8' },
];

const projectDirectoryOptions = [
  { value: '客户交付 / 智能制造', label: '客户交付 / 智能制造' },
  { value: '客户交付 / 系统实施', label: '客户交付 / 系统实施' },
  { value: '客户交付 / 数据治理', label: '客户交付 / 数据治理' },
  { value: '内部项目 / 能力建设', label: '内部项目 / 能力建设' },
];

const krTypeOptions = [
  { value: 'deliverable', label: '成果物KR' },
  { value: 'metric', label: '指标KR' },
];

const selectedRecord = computed(() => {
  if (publishedRecord.value?.id === selectedId.value) {
    return publishedRecord.value;
  }
  return (
    records.value.find((item) => item.id === selectedId.value) ||
    records.value[0]
  );
});

const filteredRecords = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return records.value.filter((item) => {
    const matchKeyword =
      !query ||
      `${item.name}${item.code}${item.customer}${item.manager}`
        .toLowerCase()
        .includes(query);
    return matchKeyword;
  });
});

const hasUploadedMaterials = computed(() => uploadedMaterials.value.length > 0);

const raciResponsibleComplete = computed(() =>
  raciRows.value.every((row) => row.responsible.trim()),
);

const activeStepIndex = computed(() =>
  steps.findIndex((item) => item.key === activeStep.value),
);

const nextStepLabel = computed(() => {
  return {
    analysis: '下一步：确认项目宪章',
    baseline: '确认基线并正式立项',
    charter: '确认宪章并生成执行基线',
    materials: '下一步：AI 解析',
  }[activeStep.value];
});

const flowNextDisabled = computed(() => {
  if (activeStep.value === 'analysis') {
    return parsing.value || parseProgress.value < 100;
  }
  if (activeStep.value === 'baseline') {
    return (
      structureEditing.value ||
      raciEditing.value ||
      !raciResponsibleComplete.value
    );
  }
  return false;
});

function statusStep(status: InitiationStatus): WorkStep {
  return {
    active: 'baseline',
    baseline: 'baseline',
    charter: 'charter',
    materials: 'materials',
    parsing: 'analysis',
  }[status] as WorkStep;
}

function selectRecord(record: InitiationRecord) {
  if (recognitionTimer) clearInterval(recognitionTimer);
  recognitionTimer = undefined;
  publishedRecord.value = null;
  selectedId.value = record.id;
  activeStep.value = statusStep(record.status);
  structureEditing.value = false;
  raciEditing.value = false;
  parseProgress.value = record.status === 'materials' ? 0 : 100;
  projectInfoGenerated.value =
    record.status !== 'materials' || Boolean(record.name || record.customer);
  recognizingProjectInfo.value = false;
  recognitionProgress.value = 0;
  recognitionStageIndex.value = 0;
  uploadedMaterials.value =
    record.status === 'materials'
      ? []
      : [
          {
            id: 'contract-demo',
            category: '客户合同 / SOW',
            fileName: '客户交付合同.pdf',
            icon: 'lucide:file-signature',
          },
          {
            id: 'requirement-demo',
            category: '项目需求说明',
            fileName: '项目需求说明.docx',
            icon: 'lucide:file-chart-column',
          },
          {
            id: 'meeting-demo',
            category: '会议纪要',
            fileName: '项目启动会议纪要.docx',
            icon: 'lucide:notebook-tabs',
          },
        ];
}

function continueInitiation(record: InitiationRecord) {
  selectRecord(record);
  initiationView.value = 'wizard';
  furthestStepIndex.value = Math.max(
    0,
    steps.findIndex((item) => item.key === statusStep(record.status)),
  );
}

function backToDrafts() {
  initiationView.value = 'manage';
  publishedRecord.value = null;
}

function createInitiation() {
  const id = `new-${Date.now()}`;
  const record: InitiationRecord = {
    id,
    code: '',
    name: '',
    customer: '',
    manager: '',
    projectDirectory: undefined,
    projectType: '',
    template: '',
    status: 'materials',
    statusLabel: '项目信息待完善',
    dueDate: '',
    updatedAt: '刚刚创建',
    summary: '',
  };
  records.value = [record, ...records.value];
  publishedRecord.value = null;
  selectRecord(record);
  initiationView.value = 'wizard';
  furthestStepIndex.value = 0;
  message.success('已创建空白立项草稿，可上传资料或直接进入下一步');
}

function generateProjectInfo() {
  if (!selectedRecord.value) return;
  if (recognitionTimer) clearInterval(recognitionTimer);
  const targetRecord = selectedRecord.value;
  const duration = 3200 + Math.round(Math.random() * 2600);
  const startedAt = Date.now();
  recognizingProjectInfo.value = true;
  projectInfoGenerated.value = false;
  recognitionProgress.value = 8;
  recognitionStageIndex.value = 0;
  if (activeStep.value === 'materials') {
    targetRecord.statusLabel = '正在识别项目信息';
  }
  recognitionTimer = setInterval(() => {
    const ratio = Math.min(1, (Date.now() - startedAt) / duration);
    recognitionProgress.value = Math.min(100, Math.round(8 + ratio * 92));
    recognitionStageIndex.value = ratio < 0.38 ? 0 : ratio < 0.74 ? 1 : 2;
    if (ratio < 1) return;

    if (recognitionTimer) clearInterval(recognitionTimer);
    targetRecord.name = '宁德智造产线智能化升级交付项目';
    targetRecord.code = 'NZ-DEL-2026-09';
    targetRecord.customer = '宁德智造';
    targetRecord.projectType = '客户交付';
    targetRecord.dueDate = '2026-10-30';
    targetRecord.manager = '刘工';
    targetRecord.template = '标准交付模板 V2.3';
    targetRecord.summary =
      '完成 4 套质检工位硬件与算法升级、协议联调、稳定试运行和客户验收移交。';
    if (activeStep.value === 'materials') {
      targetRecord.statusLabel = '项目信息已生成';
    }
    recognizingProjectInfo.value = false;
    projectInfoGenerated.value = true;
    recognitionTimer = undefined;
    message.success('AI 已识别资料并生成项目基本信息');
  }, 120);
}

function classifyMaterial(fileName: string) {
  const normalizedName = fileName.toLowerCase();
  if (normalizedName.includes('合同') || normalizedName.includes('sow')) {
    return { category: '客户合同 / SOW', icon: 'lucide:file-signature' };
  }
  if (normalizedName.includes('需求') || normalizedName.includes('方案')) {
    return { category: '项目需求说明', icon: 'lucide:file-chart-column' };
  }
  if (normalizedName.includes('会议') || normalizedName.includes('纪要')) {
    return { category: '会议纪要', icon: 'lucide:notebook-tabs' };
  }
  if (normalizedName.includes('制度') || normalizedName.includes('规范')) {
    return { category: '管理制度', icon: 'lucide:library-big' };
  }
  return { category: '其他项目资料', icon: 'lucide:file-text' };
}

function handleBatchUpload(file: { name: string }) {
  const classified = classifyMaterial(file.name);
  uploadedMaterials.value = [
    ...uploadedMaterials.value,
    {
      id: `${Date.now()}-${uploadedMaterials.value.length}-${file.name}`,
      category: classified.category,
      fileName: file.name,
      icon: classified.icon,
    },
  ];
  message.success(`${file.name} 已上传，自动分类为“${classified.category}”`);
  generateProjectInfo();
  return false;
}

function runAnalysis() {
  if (!selectedRecord.value || parsing.value) return;
  parsing.value = true;
  parseProgress.value = 12;
  selectedRecord.value.status = 'parsing';
  selectedRecord.value.statusLabel = 'AI 解析中';
  activeStep.value = 'analysis';
  furthestStepIndex.value = Math.max(furthestStepIndex.value, 1);
  parseTimer = setInterval(() => {
    parseProgress.value = Math.min(100, parseProgress.value + 11);
    if (parseProgress.value < 100) return;
    if (parseTimer) clearInterval(parseTimer);
    parseTimer = undefined;
    parsing.value = false;
    selectedRecord.value!.status = 'charter';
    selectedRecord.value!.statusLabel = '待确认宪章';
    message.success('AI 解析完成，已生成项目宪章草案');
  }, 180);
}

function openSource(title: string) {
  sourceTitle.value = title;
  sourceDrawerOpen.value = true;
}

function toggleStructureEditing() {
  if (structureEditing.value) {
    message.success('阶段、目标与 KR 调整已保存');
  }
  structureEditing.value = !structureEditing.value;
}

function toggleRaciEditing() {
  if (raciEditing.value && !raciResponsibleComplete.value) {
    message.warning('请先填写每个工作域的负责人');
    return;
  }
  if (raciEditing.value) {
    message.success('RACI 责任矩阵已保存');
  }
  raciEditing.value = !raciEditing.value;
}

function publishBaseline() {
  if (!selectedRecord.value) return;
  const activeRecord: InitiationRecord = {
    ...selectedRecord.value,
    status: 'active',
    statusLabel: '已生效',
  };
  records.value = records.value.filter((item) => item.id !== activeRecord.id);
  publishedRecord.value = activeRecord;
  activeStep.value = 'baseline';
  furthestStepIndex.value = 3;
  message.success('执行基线 V1.0 已确认，项目正式立项');
}

function goPreviousStep() {
  const previousStep = steps[activeStepIndex.value - 1];
  if (!previousStep) return;
  activeStep.value = previousStep.key;
  if (selectedRecord.value?.status === 'baseline') {
    selectedRecord.value.status = 'charter';
    selectedRecord.value.statusLabel = '待确认宪章';
  }
}

function goNextStep() {
  if (flowNextDisabled.value) return;
  if (activeStep.value === 'materials') {
    runAnalysis();
    return;
  }
  if (activeStep.value === 'analysis') {
    activeStep.value = 'charter';
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 2);
    return;
  }
  if (activeStep.value === 'charter') {
    if (selectedRecord.value) {
      selectedRecord.value.status = 'baseline';
      selectedRecord.value.statusLabel = '待确认执行基线';
    }
    activeStep.value = 'baseline';
    furthestStepIndex.value = Math.max(furthestStepIndex.value, 3);
    message.success('项目宪章已确认，AI 已生成执行基线草稿');
    return;
  }
  publishBaseline();
}

function enterProject() {
  void router.push('/app/mate/employee/pmo-assistant/portfolio');
}

onBeforeUnmount(() => {
  if (parseTimer) clearInterval(parseTimer);
  if (recognitionTimer) clearInterval(recognitionTimer);
});
</script>

<template>
  <AiWorkPage
    eyebrow="PROJECT INITIATION"
    icon="lucide:clipboard-check"
    :title="initiationView === 'manage' ? '项目立项' : '新建立项'"
    :description="
      initiationView === 'manage'
        ? '管理未生效的立项草稿；立项完成后自动进入“项目”页面。'
        : '按步骤补充资料、完成 AI 解析并确认项目宪章，当前进度会自动保存。'
    "
  >
    <template #actions>
      <Button
        v-if="initiationView === 'manage'"
        class="light-action"
        @click="router.push('/app/mate/employee/pmo-assistant/templates')"
      >
        <Icon icon="lucide:library-big" />
        制度与模板
      </Button>
      <Button
        v-if="initiationView === 'manage'"
        type="primary"
        class="primary-action"
        @click="createInitiation"
      >
        <Icon icon="lucide:plus" />
        新建立项
      </Button>
      <Button v-else class="light-action" @click="backToDrafts">
        <Icon icon="lucide:arrow-left" />
        返回草稿列表
      </Button>
    </template>

    <section class="initiation-page">
      <div
        class="initiation-workbench"
        :class="initiationView === 'manage' ? 'is-management' : 'is-wizard'"
      >
        <aside
          v-if="initiationView === 'manage'"
          class="record-panel"
          aria-label="立项记录"
        >
          <Input
            v-model:value="keyword"
            class="draft-search"
            allow-clear
            aria-label="搜索立项记录"
            placeholder="搜索草稿项目、客户或负责人"
          >
            <template #prefix><Icon icon="lucide:search" /></template>
          </Input>
          <div v-if="filteredRecords.length > 0" class="record-list">
            <button
              v-for="record in filteredRecords"
              :key="record.id"
              type="button"
              class="record-card"
              @click="continueInitiation(record)"
            >
              <span class="record-top">
                <strong>{{ record.name }}</strong>
                <em :class="`is-${record.status}`">{{ record.statusLabel }}</em>
              </span>
              <span class="record-code">
                {{ record.code }} · {{ record.customer }}
              </span>
              <span class="record-meta">
                <i>
                  <Icon icon="lucide:user-round" />
                  {{ record.manager }}
                </i>
                <i>{{ record.updatedAt }}</i>
              </span>
              <span class="record-continue">
                继续立项
                <Icon icon="lucide:arrow-right" />
              </span>
            </button>
          </div>
          <Empty v-else description="没有符合条件的立项记录" />
        </aside>

        <main
          v-if="initiationView === 'wizard' && selectedRecord"
          class="initiation-detail"
        >
          <nav class="step-navigation" aria-label="项目立项步骤">
            <button
              v-for="(step, index) in steps"
              :key="step.key"
              type="button"
              :class="{
                'is-active': activeStep === step.key,
                'is-complete': index < activeStepIndex,
              }"
              :disabled="index > furthestStepIndex"
              :aria-current="activeStep === step.key ? 'step' : undefined"
              @click="activeStep = step.key"
            >
              <span><Icon :icon="step.icon" /></span>
              <div>
                <small>步骤 {{ index + 1 }}</small>
                <strong>{{ step.label }}</strong>
              </div>
            </button>
          </nav>

          <section v-if="activeStep === 'materials'" class="work-section">
            <div class="section-heading">
              <div>
                <span>STEP 01</span>
                <h3>收集立项资料，生成项目基本信息</h3>
                <p>
                  可一次选择多份资料，系统自动分类、解析并填充右侧信息；也可以不上传，直接进入下一步。
                </p>
              </div>
            </div>
            <div class="material-layout">
              <article class="content-card material-collection-card">
                <header class="material-card-header">
                  <div>
                    <Icon icon="lucide:files" />
                    <span>
                      <strong>项目资料</strong>
                      <small>批量上传后由 AI 自动分类</small>
                    </span>
                  </div>
                  <span>{{ uploadedMaterials.length }} 份已分类</span>
                </header>
                <div class="material-suggestion">
                  <div>
                    <strong>可上传的资料</strong>
                    <small>均为选填，不限制文件类型和数量</small>
                  </div>
                  <div>
                    <span>合同 / SOW</span>
                    <span>需求或方案</span>
                    <span>会议纪要</span>
                    <span>其他资料</span>
                  </div>
                </div>
                <Upload
                  class="batch-upload"
                  :multiple="true"
                  :show-upload-list="false"
                  :before-upload="handleBatchUpload"
                >
                  <div class="upload-zone">
                    <Icon icon="lucide:upload-cloud" />
                    <span>
                      <strong>批量上传资料</strong>
                      <small>可一次选择多个文件，上传后自动分类和解析</small>
                    </span>
                  </div>
                </Upload>
                <section class="classification-result" aria-live="polite">
                  <header>
                    <strong>自动分类结果</strong>
                    <span>{{ uploadedMaterials.length }} 份</span>
                  </header>
                  <div v-if="uploadedMaterials.length > 0" class="file-list">
                    <button
                      v-for="material in uploadedMaterials"
                      :key="material.id"
                      type="button"
                      @click="openSource(material.category)"
                    >
                      <Icon :icon="material.icon" />
                      <span>
                        <strong>{{ material.category }}</strong>
                        <small>{{ material.fileName }}</small>
                      </span>
                      <em class="is-ready">已分类</em>
                    </button>
                  </div>
                  <div v-else class="classification-empty">
                    <Icon icon="lucide:inbox" />
                    <strong>尚未上传资料</strong>
                    <small>项目基本信息保持空白，但不影响进入下一步</small>
                  </div>
                </section>
                <p class="material-tip" role="status" aria-live="polite">
                  <Icon
                    :icon="
                      hasUploadedMaterials
                        ? 'lucide:circle-check'
                        : 'lucide:info'
                    "
                  />
                  {{
                    hasUploadedMaterials
                      ? '资料已接收，AI 将持续更新右侧识别结果。'
                      : '资料为选填；不上传时可手动填写，也可以直接下一步。'
                  }}
                </p>
              </article>
              <article class="content-card project-form-card">
                <header class="project-info-header">
                  <div>
                    <span class="project-info-icon">
                      <Icon icon="lucide:briefcase-business" />
                    </span>
                    <span class="project-info-copy">
                      <small>PROJECT INFORMATION</small>
                      <strong>项目基本信息</strong>
                      <em>上传后自动填充，也可以手动填写</em>
                    </span>
                  </div>
                  <span>
                    <Icon icon="lucide:cloud-check" />
                    自动保存
                  </span>
                </header>
                <Transition name="analysis-mask">
                  <div
                    v-if="recognizingProjectInfo"
                    class="project-analysis-mask"
                    role="status"
                    aria-live="polite"
                    :aria-label="recognitionStages[recognitionStageIndex]?.label"
                  >
                    <div class="project-analysis-panel">
                      <span class="project-analysis-icon">
                        <Icon class="is-spinning" icon="lucide:loader-circle" />
                      </span>
                      <div class="project-analysis-heading">
                        <small>AI 项目识别</small>
                        <strong>
                          {{ recognitionStages[recognitionStageIndex]?.label }}
                        </strong>
                        <p>
                          {{
                            recognitionStages[recognitionStageIndex]?.description
                          }}
                        </p>
                      </div>
                      <div class="recognition-stage-list">
                        <div
                          v-for="(stage, index) in recognitionStages"
                          :key="stage.label"
                          :class="{
                            'is-complete': index < recognitionStageIndex,
                            'is-current': index === recognitionStageIndex,
                          }"
                        >
                          <span>
                            <Icon
                              :class="{
                                'is-spinning': index === recognitionStageIndex,
                              }"
                              :icon="
                                index < recognitionStageIndex
                                  ? 'lucide:check'
                                  : index === recognitionStageIndex
                                    ? 'lucide:loader-circle'
                                    : 'lucide:circle'
                              "
                            />
                          </span>
                          <div>
                            <strong>{{ stage.label }}</strong>
                            <small>{{ stage.description }}</small>
                          </div>
                        </div>
                      </div>
                      <Progress
                        :percent="recognitionProgress"
                        :show-info="false"
                        stroke-color="#178273"
                        trail-color="#dce9e5"
                      />
                      <footer>
                        <span>
                          已读取 {{ uploadedMaterials.length }} 份项目资料
                        </span>
                        <strong>{{ recognitionProgress }}%</strong>
                      </footer>
                    </div>
                  </div>
                </Transition>
                <div
                  class="project-generation-state"
                  :class="{ 'is-ready': projectInfoGenerated }"
                >
                  <span>
                    <Icon
                      :class="{ 'is-spinning': recognizingProjectInfo }"
                      :icon="
                        recognizingProjectInfo
                          ? 'lucide:loader-circle'
                          : projectInfoGenerated
                            ? 'lucide:sparkles'
                            : 'lucide:scan-search'
                      "
                    />
                  </span>
                  <div>
                    <strong>
                      {{
                        recognizingProjectInfo
                          ? 'AI 正在识别项目信息'
                          : projectInfoGenerated
                            ? '项目基本信息已准备'
                            : '项目基本信息暂为空'
                      }}
                    </strong>
                    <small>
                      {{
                        recognizingProjectInfo
                          ? '正在提取项目名称、客户、类型、日期和目标摘要'
                          : projectInfoGenerated
                            ? '项目名称、编号、客户、类型、交付日期与目标摘要已识别'
                            : '可手动填写或直接下一步；上传资料后将自动填充默认数据'
                      }}
                    </small>
                  </div>
                </div>
                <section class="form-section">
                  <header>
                    <div>
                      <span>01</span>
                      <div>
                        <strong>项目识别信息</strong>
                        <small>用于建立项目身份与交付边界</small>
                      </div>
                    </div>
                  </header>
                  <div class="form-grid">
                    <label class="is-wide">
                      <span>项目名称</span>
                      <Input
                        v-model:value="selectedRecord.name"
                        placeholder="请输入项目名称"
                      />
                    </label>
                    <label>
                      <span>项目编号</span>
                      <Input
                        v-model:value="selectedRecord.code"
                        placeholder="请输入或等待自动生成"
                      />
                    </label>
                    <label>
                      <span>客户/业务方</span>
                      <Input
                        v-model:value="selectedRecord.customer"
                        placeholder="请输入客户或业务方"
                      />
                    </label>
                    <label>
                      <span>项目类型</span>
                      <Input
                        v-model:value="selectedRecord.projectType"
                        placeholder="请输入项目类型"
                      />
                    </label>
                    <label>
                      <span>计划交付日期</span>
                      <Input
                        v-model:value="selectedRecord.dueDate"
                        placeholder="请输入计划交付日期"
                      />
                    </label>
                    <label class="is-wide">
                      <span>
                        项目目录
                        <em>选填</em>
                      </span>
                      <Select
                        v-model:value="selectedRecord.projectDirectory"
                        :options="projectDirectoryOptions"
                        allow-clear
                        placeholder="可不选择，项目创建后再归档"
                      />
                    </label>
                  </div>
                </section>
                <section class="form-section">
                  <header>
                    <div>
                      <span>02</span>
                      <div>
                        <strong>组织与治理设置</strong>
                        <small>确认负责人、适用模板与项目目标</small>
                      </div>
                    </div>
                  </header>
                  <div class="form-grid">
                    <label>
                      <span>项目经理</span>
                      <Input
                        v-model:value="selectedRecord.manager"
                        placeholder="请输入项目经理"
                      />
                    </label>
                    <label>
                      <span>适用项目模板</span>
                      <Select
                        v-model:value="selectedRecord.template"
                        :options="templateOptions"
                        allow-clear
                        placeholder="可暂不选择"
                      />
                    </label>
                    <label class="is-wide">
                      <span>项目目标摘要</span>
                      <Input.TextArea
                        v-model:value="selectedRecord.summary"
                        placeholder="请输入项目目标，或上传资料后自动生成"
                        :rows="3"
                      />
                    </label>
                  </div>
                </section>
              </article>
            </div>
          </section>

          <section v-else-if="activeStep === 'analysis'" class="work-section">
            <div class="section-heading">
              <div>
                <span>STEP 02</span>
                <h3>AI 解析合同、项目资料与制度要求</h3>
                <p>解析结果不是最终承诺，缺失内容会明确标记并交由人工确认。</p>
              </div>
              <Button
                :loading="parsing"
                type="primary"
                class="primary-action"
                @click="runAnalysis"
              >
                <Icon icon="lucide:refresh-cw" />
                重新解析
              </Button>
            </div>
            <article class="analysis-progress content-card">
              <div>
                <span class="ai-mark"><Icon icon="lucide:sparkles" /></span>
                <div>
                  <strong>
                    {{
                      parseProgress < 100
                        ? 'AI 正在建立项目治理结构'
                        : '解析完成，可进入结构与宪章确认'
                    }}
                  </strong>
                  <small>范围、阶段、成果物、负责人、资源和异常机制</small>
                </div>
              </div>
              <div class="progress-line">
                <Progress
                  :percent="parseProgress"
                  :show-info="false"
                  stroke-color="#0b806f"
                />
                <b>{{ parseProgress }}%</b>
              </div>
            </article>
            <div class="analysis-grid">
              <article class="content-card">
                <span>6</span>
                <strong>项目阶段</strong>
                <small>需求、方案、实施研发、试运行、验收、运维</small>
              </article>
              <article class="content-card">
                <span>12</span>
                <strong>合同交付物</strong>
                <small>已与模板成果物要求完成映射</small>
              </article>
              <article class="content-card">
                <span>4</span>
                <strong>关键里程碑</strong>
                <small>已识别责任人和计划完成日期</small>
              </article>
              <article class="content-card">
                <span>3</span>
                <strong>待人工确认</strong>
                <small>范围边界、资源承诺和验收失败处理</small>
              </article>
            </div>
            <article class="gap-card">
              <span><Icon icon="lucide:triangle-alert" /></span>
              <div>
                <strong>发现合同治理缺口</strong>
                <p>
                  客户合同未明确验收不合格后的整改时限。AI
                  已引用《客户项目交付管理制度》第 5.3 条，建议补充“3
                  个工作日内整改，二次不合格升级至交付总监”。
                </p>
              </div>
              <Button class="light-action" @click="openSource('制度补全依据')">
                查看依据
              </Button>
            </article>
          </section>

          <section
            v-else-if="activeStep === 'charter'"
            class="work-section charter-section"
          >
            <div class="section-heading">
              <div>
                <span>STEP 03</span>
                <h3>确认项目宪章</h3>
                <p>
                  先确认项目要达成什么、边界在哪里以及由谁总体负责；执行结构将在下一步单独确认。
                </p>
              </div>
            </div>
            <article class="content-card charter-objective-card">
              <header>
                <div class="module-title-block">
                  <span class="module-title-icon is-objective">
                    <Icon icon="lucide:badge-check" />
                  </span>
                  <span class="module-title-copy">
                    <strong>项目目标与成功标准</strong>
                    <small>定义项目最终需要达成的业务结果</small>
                  </span>
                </div>
                <Button type="link" @click="openSource('项目目标识别依据')">
                  查看依据
                </Button>
              </header>
              <div class="charter-objective-content">
                <p>{{ selectedRecord.summary }}</p>
                <div>
                  <span><Icon icon="lucide:check" />合同范围全部完成</span>
                  <span><Icon icon="lucide:check" />客户验收一次通过</span>
                  <span><Icon icon="lucide:check" />按计划完成运维移交</span>
                </div>
              </div>
            </article>
            <div class="charter-grid">
              <article class="content-card scope-card">
                <header>
                  <div class="module-title-block">
                    <span class="module-title-icon is-scope">
                      <Icon icon="lucide:scan-search" />
                    </span>
                    <span class="module-title-copy">
                      <strong>项目范围与边界</strong>
                      <small>明确项目承诺范围与排除项</small>
                    </span>
                  </div>
                  <Button type="link" @click="openSource('范围来源')">
                    查看来源
                  </Button>
                </header>
                <h4>范围内</h4>
                <ul>
                  <li>完成 4 套质检工位硬件与算法升级</li>
                  <li>完成协议适配、联调和 14 天稳定试运行</li>
                  <li>交付培训、运维手册和正式验收材料</li>
                </ul>
                <h4>不在范围内</h4>
                <ul class="muted-list">
                  <li>客户 MES 主系统二次开发</li>
                  <li>既有产线电气线路整体改造</li>
                </ul>
              </article>
              <article class="content-card core-role-card">
                <header>
                  <div class="module-title-block">
                    <span class="module-title-icon is-role">
                      <Icon icon="lucide:users-round" />
                    </span>
                    <span class="module-title-copy">
                      <strong>核心负责人</strong>
                      <small>只确认项目治理所需的关键角色</small>
                    </span>
                  </div>
                  <span>3 个角色</span>
                </header>
                <div class="core-role-list">
                  <div>
                    <span><Icon icon="lucide:crown" /></span>
                    <div>
                      <small>项目发起人</small>
                      <strong>交付总监</strong>
                    </div>
                  </div>
                  <div>
                    <span><Icon icon="lucide:user-round-check" /></span>
                    <div>
                      <small>项目经理</small>
                      <strong>{{ selectedRecord.manager || '待指定' }}</strong>
                    </div>
                  </div>
                  <div>
                    <span><Icon icon="lucide:handshake" /></span>
                    <div>
                      <small>客户负责人</small>
                      <strong>{{ selectedRecord.customer }}项目负责人</strong>
                    </div>
                  </div>
                </div>
              </article>
            </div>
            <article class="content-card charter-risk-card">
              <header>
                <div class="module-title-block">
                  <span class="module-title-icon is-risk">
                    <Icon icon="lucide:shield-alert" />
                  </span>
                  <span class="module-title-copy">
                    <strong>关键约束与主要风险</strong>
                    <small>AI 根据合同、制度与会议纪要提取</small>
                  </span>
                </div>
                <Button type="link" @click="openSource('风险识别依据')">
                  查看依据
                </Button>
              </header>
              <div class="charter-risk-list">
                <div>
                  <span>交付约束</span>
                  <strong>计划交付日期为 {{ selectedRecord.dueDate }}</strong>
                  <small>超过合同宽限期将触发交付风险升级</small>
                </div>
                <div>
                  <span>外部依赖</span>
                  <strong>客户需按计划开放现场与接口环境</strong>
                  <small>环境延期将影响实施研发和试运行阶段</small>
                </div>
                <div>
                  <span>验收风险</span>
                  <strong>合同未明确二次验收整改时限</strong>
                  <small>已按公司制度建议补充为 3 个工作日</small>
                </div>
              </div>
            </article>
            <div class="charter-ready-note">
              <span><Icon icon="lucide:sparkles" /></span>
              <div>
                <strong>宪章信息已具备生成执行基线的条件</strong>
                <small>
                  下一步由 AI 生成阶段、目标、KR、负责人、日期和依赖关系。
                </small>
              </div>
            </div>
          </section>

          <section v-else class="work-section baseline-section">
            <template v-if="selectedRecord.status !== 'active'">
              <div class="section-heading">
                <div>
                  <span>STEP 04</span>
                  <h3>确认执行基线</h3>
                  <p>
                    确认阶段、目标、KR、负责人、日期和依赖关系；发布后这些内容将成为项目执行与AI监控的依据。
                  </p>
                </div>
              </div>
              <article class="content-card execution-baseline-card">
                <header>
                  <div class="module-title-block">
                    <span class="module-title-icon is-structure">
                      <Icon icon="lucide:git-branch" />
                    </span>
                    <span class="module-title-copy">
                      <strong>阶段、目标与KR</strong>
                      <small>
                        {{ projectStages.length }} 个阶段 ·
                        {{
                          projectStages.reduce(
                            (total, stage) => total + stage.krs.length,
                            0,
                          )
                        }}
                        个KR
                      </small>
                    </span>
                  </div>
                  <div class="card-header-actions">
                    <Button
                      size="small"
                      class="light-action"
                      @click="toggleStructureEditing"
                    >
                      <Icon
                        :icon="structureEditing ? 'lucide:save' : 'lucide:pencil'"
                      />
                      {{
                        structureEditing
                          ? '保存结构调整'
                          : '编辑阶段、目标与KR'
                      }}
                    </Button>
                    <Button type="link" @click="openSource('执行基线生成依据')">
                      查看依据
                    </Button>
                  </div>
                </header>
                <div class="execution-baseline-tree">
                  <details
                    v-for="(stage, index) in projectStages"
                    :key="stage.code"
                    class="execution-stage"
                    :open="structureEditing || index === 0"
                  >
                    <summary>
                      <span class="stage-code">{{ stage.code }}</span>
                      <div>
                        <strong>{{ stage.name }}</strong>
                        <small>
                          {{ stage.startDate }}—{{ stage.dueDate }} · 负责人
                          {{ stage.stageOwner }}
                        </small>
                      </div>
                      <span class="dependency-pill">
                        依赖：{{ stage.dependency }}
                      </span>
                      <Icon icon="lucide:chevron-down" />
                    </summary>
                    <div class="execution-stage-body">
                      <div v-if="structureEditing" class="stage-edit-grid">
                        <label>
                          <span>阶段名称</span>
                          <Input v-model:value="stage.name" />
                        </label>
                        <label>
                          <span>阶段负责人</span>
                          <Input v-model:value="stage.stageOwner" />
                        </label>
                        <label>
                          <span>开始日期</span>
                          <Input v-model:value="stage.startDate" />
                        </label>
                        <label>
                          <span>结束日期</span>
                          <Input v-model:value="stage.dueDate" />
                        </label>
                        <label class="is-wide">
                          <span>前置依赖</span>
                          <Input v-model:value="stage.dependency" />
                        </label>
                      </div>
                      <div class="execution-goal-row">
                        <span class="node-label is-goal">目标</span>
                        <div v-if="structureEditing" class="goal-edit-grid">
                          <Input
                            v-model:value="stage.objective"
                            aria-label="目标名称"
                          />
                          <Input
                            v-model:value="stage.goalOwner"
                            aria-label="目标负责人"
                          />
                          <Input
                            v-model:value="stage.collaborators"
                            aria-label="目标协作人"
                          />
                        </div>
                        <div v-else>
                          <strong>{{ stage.objective }}</strong>
                          <small>
                            负责人 {{ stage.goalOwner }} · 协作人
                            {{ stage.collaborators }}
                          </small>
                        </div>
                      </div>
                      <div class="execution-kr-list">
                        <div v-for="kr in stage.krs" :key="kr.id">
                          <span
                            class="node-label"
                            :class="
                              kr.type === 'deliverable'
                                ? 'is-deliverable'
                                : 'is-metric'
                            "
                          >
                            {{ kr.type === 'deliverable' ? '成果物KR' : '指标KR' }}
                          </span>
                          <div v-if="structureEditing" class="kr-edit-grid">
                            <Select
                              v-model:value="kr.type"
                              :options="krTypeOptions"
                              aria-label="KR类型"
                            />
                            <Input v-model:value="kr.name" aria-label="KR名称" />
                            <Input v-model:value="kr.owner" aria-label="KR负责人" />
                            <Input v-model:value="kr.dueDate" aria-label="KR完成日期" />
                          </div>
                          <div v-else>
                            <strong>{{ kr.name }}</strong>
                            <small>{{ kr.owner }} · {{ kr.dueDate }}</small>
                          </div>
                        </div>
                      </div>
                      <div class="stage-gate-note">
                        <Icon icon="lucide:shield-check" />
                        <span>
                          准入、准出规则已继承“{{ selectedRecord.template }}”，项目执行中可查看完整规则。
                        </span>
                      </div>
                    </div>
                  </details>
                </div>
              </article>
              <article class="content-card baseline-raci-card">
                <header>
                  <div class="module-title-block">
                    <span class="module-title-icon is-raci">
                      <Icon icon="lucide:users-round" />
                    </span>
                    <span class="module-title-copy">
                      <strong>RACI 责任矩阵</strong>
                      <small>
                        AI 已根据项目资料和阶段负责人预填，可由项目经理调整
                      </small>
                    </span>
                  </div>
                  <div class="card-header-actions">
                    <span class="ai-prefill-tag">
                      <Icon icon="lucide:sparkles" />
                      AI 已预填
                    </span>
                    <Button
                      size="small"
                      class="light-action"
                      @click="toggleRaciEditing"
                    >
                      <Icon :icon="raciEditing ? 'lucide:save' : 'lucide:pencil'" />
                      {{ raciEditing ? '保存责任矩阵' : '编辑责任矩阵' }}
                    </Button>
                  </div>
                </header>
                <div
                  class="baseline-raci-table"
                  role="table"
                  aria-label="项目RACI责任矩阵"
                >
                  <div class="baseline-raci-row is-head" role="row">
                    <span role="columnheader">工作域</span>
                    <span role="columnheader">
                      R · 负责人 <em class="required-chip">必填</em>
                    </span>
                    <span role="columnheader">
                      A · 审批/确认 <em>选填</em>
                    </span>
                    <span role="columnheader">
                      C · 协作 <em>选填</em>
                    </span>
                    <span role="columnheader">
                      I · 知会 <em>选填</em>
                    </span>
                  </div>
                  <div
                    v-for="(row, index) in raciRows"
                    :key="index"
                    class="baseline-raci-row"
                    role="row"
                  >
                    <template v-if="raciEditing">
                      <Input
                        v-model:value="row.workstream"
                        :aria-label="`第${index + 1}行工作域`"
                        placeholder="工作域"
                      />
                      <Input
                        v-model:value="row.responsible"
                        :aria-label="`第${index + 1}行负责人，必填`"
                        placeholder="请填写负责人"
                        :status="row.responsible.trim() ? undefined : 'error'"
                      />
                      <Input
                        v-model:value="row.accountable"
                        :aria-label="`第${index + 1}行审批确认人，选填`"
                        placeholder="可留空"
                      />
                      <Input
                        v-model:value="row.consulted"
                        :aria-label="`第${index + 1}行协作人，选填`"
                        placeholder="可留空"
                      />
                      <Input
                        v-model:value="row.informed"
                        :aria-label="`第${index + 1}行知会人，选填`"
                        placeholder="可留空"
                      />
                    </template>
                    <template v-else>
                      <strong role="cell">{{ row.workstream }}</strong>
                      <span role="cell">{{ row.responsible }}</span>
                      <span role="cell">{{ row.accountable || '—' }}</span>
                      <span role="cell">{{ row.consulted || '—' }}</span>
                      <span role="cell">{{ row.informed || '—' }}</span>
                    </template>
                  </div>
                </div>
                <p v-if="!raciResponsibleComplete" class="raci-validation">
                  <Icon icon="lucide:circle-alert" />
                  请填写所有工作域的负责人后再正式立项，其余角色允许留空。
                </p>
                <footer class="raci-sync-note">
                  <Icon icon="lucide:info" />
                  正式立项后，责任矩阵将同步到“成员与职责”，仍可继续维护。
                </footer>
              </article>
              <div class="baseline-check-grid">
                <article>
                  <span><Icon icon="lucide:user-round-check" /></span>
                  <div>
                    <strong>
                      {{
                        raciResponsibleComplete
                          ? '负责人完整'
                          : '负责人待补充'
                      }}
                    </strong>
                    <small>
                      {{
                        raciResponsibleComplete
                          ? '阶段、目标、KR与RACI均已指定负责人'
                          : 'RACI仍有必填负责人未填写'
                      }}
                    </small>
                  </div>
                </article>
                <article>
                  <span><Icon icon="lucide:calendar-check-2" /></span>
                  <div>
                    <strong>时间与依赖有效</strong>
                    <small>未发现日期冲突或循环依赖</small>
                  </div>
                </article>
                <article>
                  <span><Icon icon="lucide:file-check-2" /></span>
                  <div>
                    <strong>成果物已承接</strong>
                    <small>合同要求已映射到成果物KR</small>
                  </div>
                </article>
              </div>
            </template>
            <template v-else>
              <div class="baseline-success">
              <span><Icon icon="lucide:badge-check" /></span>
              <div>
                <small>PROJECT BASELINE · V1.0</small>
                <h3>执行基线已确认，项目正式立项</h3>
                <p>
                  后续对阶段、交付日期、责任人或验收标准的修改将形成变更草稿，不会直接覆盖当前基线。
                </p>
              </div>
              <Button
                type="primary"
                class="primary-action"
                @click="enterProject"
              >
                进入项目执行
                <Icon icon="lucide:arrow-right" />
              </Button>
            </div>
            <div class="baseline-grid">
              <article class="content-card">
                <small>生效版本</small>
                <strong>V1.0</strong>
                <span>2026-09-05 发布</span>
              </article>
              <article class="content-card">
                <small>项目阶段</small>
                <strong>6</strong>
                <span>首阶段：需求确认</span>
              </article>
              <article class="content-card">
                <small>成果物标准</small>
                <strong>12</strong>
                <span>全部关联验收人</span>
              </article>
              <article class="content-card">
                <small>治理来源</small>
                <strong>3</strong>
                <span>合同、纪要、制度</span>
              </article>
            </div>
            <article class="content-card baseline-note">
              <Icon icon="lucide:git-branch" />
              <div>
                <strong>版本与变更规则</strong>
                <p>
                  当前基线只读。工期变化超过 3
                  天、范围或验收标准发生变化时，系统生成 V1.1
                  变更草稿，由项目经理、交付总监和交付项目 PMO 重新确认。
                </p>
              </div>
            </article>
            </template>
          </section>

          <footer
            v-if="selectedRecord.status !== 'active'"
            class="wizard-footer"
          >
            <span>
              <Icon icon="lucide:cloud-check" />
              草稿已自动保存
            </span>
            <div>
              <Button
                class="light-action"
                :disabled="activeStepIndex === 0"
                @click="goPreviousStep"
              >
                <Icon icon="lucide:arrow-left" />
                上一步
              </Button>
              <Button
                type="primary"
                class="primary-action"
                :disabled="flowNextDisabled"
                @click="goNextStep"
              >
                {{ nextStepLabel }}
                <Icon icon="lucide:arrow-right" />
              </Button>
            </div>
          </footer>
        </main>
      </div>
    </section>

    <Drawer
      v-model:open="sourceDrawerOpen"
      width="460px"
      placement="right"
      title="依据与过程留痕"
      root-class-name="initiation-light-drawer"
    >
      <section class="source-drawer-content">
        <span class="source-type">
          <Icon icon="lucide:quote" />
          {{ sourceTitle }}
        </span>
        <h3>{{ selectedRecord?.name }}</h3>
        <p>
          所有 AI
          提取结果均保留原始资料名称、版本、页码或段落定位。人工调整会记录修改人、时间与修改前后差异。
        </p>
        <article>
          <small>外部商务依据</small>
          <strong>《智能制造产线工位改造与算法实施合同》</strong>
          <p>交付 4 套质检工位硬件与算法升级，并完成 14 天稳定试运行。</p>
        </article>
        <article>
          <small>内部制度补全</small>
          <strong>《客户项目交付管理制度》第 5.3 条</strong>
          <p>验收不合格需在 3 个工作日内整改；二次不合格升级至交付总监。</p>
        </article>
        <article>
          <small>最近一次人工确认</small>
          <strong>项目经理李四 · 今天 10:20</strong>
          <p>确认客户 MES 二次开发不在本期项目范围内。</p>
        </article>
      </section>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.initiation-page {
  display: grid;
  gap: 12px;
  container-type: inline-size;
  color: #163d34;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.summary-strip article {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 13px 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 12px;
}

.metric-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 16px;
  color: #0b6e65;
  background: #edf5f2;
  border-radius: 9px;
}

.summary-strip article > div {
  display: flex;
  gap: 7px;
  align-items: baseline;
}

.summary-strip strong {
  font-size: 20px;
}

.summary-strip small {
  font-size: 12px;
  color: #668078;
}

.status-filter {
  display: flex;
  gap: 5px;
  padding: 5px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 12px;
}

.status-filter button {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 6px 10px;
  font-size: 12px;
  color: #58736b;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: 150ms ease;
}

.status-filter button:hover {
  background: #f3f8f6;
}

.status-filter button:focus-visible,
.record-card:focus-visible,
.step-navigation button:focus-visible,
.confirmation-grid button:focus-visible {
  outline: 3px solid rgb(11 128 111/22%);
  outline-offset: 2px;
}

.status-filter button.is-active {
  font-weight: 800;
  color: #0b6e65;
  background: #edf5f2;
  border-color: #bcd7cf;
}

.status-filter b {
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  font-size: 12px;
  background: #fff;
  border-radius: 999px;
}

.initiation-workbench {
  display: grid;
  grid-template-columns: 278px minmax(0, 1fr);
  gap: 12px;
  min-height: 640px;
}

.initiation-workbench.is-management,
.initiation-workbench.is-wizard {
  grid-template-columns: minmax(0, 1fr);
}

.initiation-workbench.is-management {
  min-height: 0;
}

.record-panel,
.initiation-detail {
  min-width: 0;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 14px;
}

.record-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #e6efec;
  border-color: #c6d9d3;
}

.draft-search {
  width: min(100%, 460px);
}

.record-panel :deep(.draft-search.ant-input-affix-wrapper) {
  min-height: 40px;
  background: #fff;
  border-color: #bfd3cc;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(39 82 70 / 5%);
}

.record-panel :deep(.draft-search.ant-input-affix-wrapper:hover),
.record-panel :deep(.draft-search.ant-input-affix-wrapper-focused) {
  border-color: #76ab9d;
  box-shadow: 0 0 0 3px rgb(11 128 111 / 10%);
}

.record-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.record-panel > header span,
.section-heading span {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.1em;
}

.record-panel h2 {
  margin: 2px 0 0;
  font-size: 15px;
}

.record-panel > header > b {
  padding: 3px 7px;
  font-size: 12px;
  color: #5e776f;
  background: #edf5f2;
  border-radius: 999px;
}

.record-list {
  display: grid;
  gap: 7px;
  overflow: auto;
}

.is-management .record-list {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}

.record-card {
  display: grid;
  gap: 6px;
  min-height: 132px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d5e3df;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgb(39 82 70 / 5%);
  transition: 150ms ease;
}

.record-card:hover {
  background: #fff;
  border-color: #8ebcaf;
  box-shadow: 0 6px 18px rgb(39 82 70 / 9%);
}

.record-card.is-selected {
  background: #edf5f2;
  border-color: #0b6e65;
  box-shadow: inset 3px 0 0 #0b6e65;
}

.record-top {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  justify-content: space-between;
}

.record-top strong {
  font-size: 12px;
  line-height: 1.45;
}

.record-top em,
.status-pill {
  flex: none;
  padding: 2px 6px;
  font-size: 12px;
  font-style: normal;
  border-radius: 999px;
}

.record-top em,
.status-pill,
.neutral-pill {
  color: #49665e;
  background: #edf5f2;
  border: 1px solid #d5e4df;
}

.record-top em.is-materials,
.status-pill.is-materials,
.record-top em.is-charter,
.status-pill.is-charter {
  color: #925814;
  background: #fff6e7;
  border-color: #efd7b4;
}

.record-top em.is-active,
.status-pill.is-active {
  color: #0b6e65;
  background: #e7f5f0;
  border-color: #baddd2;
}

.record-top em.is-baseline,
.status-pill.is-baseline {
  color: #315f8a;
  background: #e7f0f8;
  border-color: #c4d7e8;
}

.record-code {
  font-size: 12px;
  color: #6a817a;
}

.record-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #71857e;
}

.record-meta i {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-style: normal;
}

.record-continue {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: flex-end;
  padding-top: 7px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  border-top: 1px solid #e2ece8;
}

.initiation-detail {
  overflow: hidden;
}

.step-navigation {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 14px 16px;
  background: #dfeae6;
  border-bottom: 1px solid #c7d8d2;
}

.step-navigation button {
  position: relative;
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 9px 11px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #cbdad5;
  border-radius: 10px;
  box-shadow: 0 1px 2px rgb(33 68 59 / 5%);
}

.step-navigation button:not(:last-child)::after {
  position: absolute;
  top: 50%;
  right: -9px;
  z-index: 1;
  width: 9px;
  height: 1px;
  content: '';
  background: #a9c0b8;
}

.step-navigation button:hover {
  background: #f5faf8;
  border-color: #99bbb0;
}

.step-navigation button.is-active {
  background: #f0f8f5;
  border-color: #4f9a8b;
  box-shadow: 0 0 0 2px rgb(79 154 139 / 12%);
}

.step-navigation button > span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #688078;
  background: #fff;
  border: 1px solid #d4e2dd;
  border-radius: 8px;
}

.step-navigation button.is-active > span,
.step-navigation button.is-complete > span {
  color: #0b6e65;
  background: #dcefe9;
  border-color: #a8cfc4;
}

.step-navigation button > div {
  display: grid;
  min-width: 0;
}

.step-navigation small {
  font-size: 12px;
  color: #83968f;
}

.step-navigation strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #35584f;
  white-space: nowrap;
}

.work-section {
  display: grid;
  gap: 12px;
  padding: 18px;
  background: #e6efec;
}

.section-heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.section-heading h3 {
  margin: 2px 0 3px;
  font-size: 15px;
}

.section-heading p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #6b827b;
}

.content-card {
  background: #fff;
  border: 1px solid #cbdad5;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgb(33 68 59 / 5%);
}

.content-card > header {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 11px 13px;
  border-bottom: 1px solid #e5eeea;
}

.content-card > header > div {
  display: flex;
  gap: 6px;
  align-items: center;
}

.content-card > header svg {
  color: #0b6e65;
}

.content-card > header strong {
  font-size: 12px;
}

.content-card > header > span {
  font-size: 12px;
  color: #688078;
}

.card-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.structure-card {
  overflow: hidden;
}

.charter-section .content-card {
  overflow: hidden;
  border-color: #c3d6d0;
  box-shadow: 0 3px 9px rgb(33 68 59 / 7%);
}

.charter-section .content-card > header {
  min-height: 72px;
  padding: 13px 15px;
  background: #f1f7f5;
  border-bottom-color: #cbdcd6;
}

.module-title-block {
  gap: 11px !important;
  min-width: 0;
}

.module-title-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  border: 1px solid transparent;
  border-radius: 11px;
}

.module-title-icon.is-structure {
  color: #0b6e65;
  background: #dff0eb;
  border-color: #bad8cf;
}

.module-title-icon.is-objective {
  color: #0b6e65;
  background: #dff0eb;
  border-color: #bad8cf;
}

.module-title-icon.is-scope {
  color: #315f8a;
  background: #e7f0f8;
  border-color: #c4d7e8;
}

.module-title-icon.is-milestone {
  color: #956018;
  background: #fff1d9;
  border-color: #ead3ad;
}

.module-title-icon.is-raci {
  color: #684a8a;
  background: #f0eafa;
  border-color: #d8cbea;
}

.module-title-icon.is-role {
  color: #684a8a;
  background: #f0eafa;
  border-color: #d8cbea;
}

.module-title-icon.is-risk {
  color: #956018;
  background: #fff1d9;
  border-color: #ead3ad;
}

.module-title-icon.is-structure svg {
  color: #0b6e65;
}

.module-title-icon.is-objective svg {
  color: #0b6e65;
}

.module-title-icon.is-scope svg {
  color: #315f8a;
}

.module-title-icon.is-milestone svg {
  color: #956018;
}

.module-title-icon.is-raci svg {
  color: #684a8a;
}

.module-title-icon.is-role svg {
  color: #684a8a;
}

.module-title-icon.is-risk svg {
  color: #956018;
}

.module-title-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.module-title-copy strong {
  font-size: 15px !important;
  line-height: 1.35;
  color: #173f36;
}

.module-title-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #627a72;
  white-space: nowrap;
}

.charter-objective-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px;
}

.charter-objective-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: #294f45;
}

.charter-objective-content > div {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  justify-content: flex-end;
}

.charter-objective-content > div > span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 6px 9px;
  font-size: 12px;
  color: #35685b;
  background: #edf7f3;
  border: 1px solid #c5ded6;
  border-radius: 8px;
}

.core-role-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 13px;
}

.core-role-list > div {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 9px;
  background: #f8faf9;
  border: 1px solid #e0e9e6;
  border-radius: 9px;
}

.core-role-list > div > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #684a8a;
  background: #f0eafa;
  border-radius: 8px;
}

.core-role-list > div > div {
  display: grid;
}

.core-role-list small,
.core-role-list strong {
  font-size: 12px;
}

.core-role-list small {
  color: #71857e;
}

.charter-risk-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 13px;
}

.charter-risk-list > div {
  display: grid;
  gap: 4px;
  padding: 11px;
  background: #fffaf1;
  border: 1px solid #efdfc5;
  border-radius: 9px;
}

.charter-risk-list span,
.charter-risk-list strong,
.charter-risk-list small {
  font-size: 12px;
}

.charter-risk-list span {
  font-weight: 800;
  color: #956018;
}

.charter-risk-list strong {
  color: #624a27;
}

.charter-risk-list small {
  line-height: 1.5;
  color: #806e52;
}

.charter-ready-note {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  background: #edf7f3;
  border: 1px solid #b8dace;
  border-radius: 11px;
}

.charter-ready-note > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  color: #0b6e65;
  background: #fff;
  border-radius: 9px;
}

.charter-ready-note > div {
  display: grid;
  gap: 2px;
}

.charter-ready-note strong {
  font-size: 13px;
  color: #244b41;
}

.charter-ready-note small {
  font-size: 12px;
  color: #607970;
}

.execution-baseline-card {
  overflow: hidden;
  border-color: #bfd4cd;
}

.execution-baseline-card > header {
  min-height: 72px;
  padding: 13px 15px;
  background: #f1f7f5;
  border-bottom-color: #cbdcd6;
}

.execution-baseline-tree {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: #edf3f1;
}

.execution-stage {
  overflow: hidden;
  background: #fff;
  border: 1px solid #ccdcd7;
  border-radius: 10px;
}

.execution-stage summary {
  display: grid;
  grid-template-columns: 38px minmax(220px, 1fr) auto 18px;
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 9px 12px;
  cursor: pointer;
  list-style: none;
}

.execution-stage summary::-webkit-details-marker {
  display: none;
}

.execution-stage[open] summary {
  background: #f7faf9;
  border-bottom: 1px solid #dce7e3;
}

.execution-stage summary > div {
  display: grid;
  gap: 2px;
}

.execution-stage summary strong {
  font-size: 14px;
  color: #244b41;
}

.execution-stage summary small {
  font-size: 12px;
  color: #687f77;
}

.execution-stage summary > svg {
  color: #658078;
  transition: transform 180ms ease;
}

.execution-stage[open] summary > svg {
  transform: rotate(180deg);
}

.stage-code {
  display: grid;
  place-items: center;
  width: 38px;
  height: 34px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  background: #e5f2ee;
  border-radius: 8px;
}

.dependency-pill {
  max-width: 230px;
  padding: 5px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #5f756e;
  white-space: nowrap;
  background: #f3f6f5;
  border: 1px solid #dbe5e2;
  border-radius: 7px;
}

.execution-stage-body {
  display: grid;
  gap: 9px;
  padding: 11px 14px 14px 62px;
}

.stage-edit-grid,
.goal-edit-grid,
.kr-edit-grid {
  display: grid;
  gap: 8px;
}

.stage-edit-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 10px;
  background: #f8faf9;
  border: 1px solid #e0e9e6;
  border-radius: 9px;
}

.stage-edit-grid label {
  display: grid;
  gap: 4px;
}

.stage-edit-grid label.is-wide {
  grid-column: 1/-1;
}

.stage-edit-grid label > span {
  font-size: 12px;
  font-weight: 700;
  color: #526e65;
}

.goal-edit-grid {
  grid-template-columns: minmax(220px, 1fr) 150px 180px;
  width: 100%;
}

.kr-edit-grid {
  grid-template-columns: 132px minmax(220px, 1fr) 150px 150px;
  width: 100%;
}

.stage-edit-grid :deep(.ant-input),
.goal-edit-grid :deep(.ant-input),
.kr-edit-grid :deep(.ant-input) {
  min-height: 36px;
  font-size: 12px;
}

.kr-edit-grid :deep(.ant-select) {
  width: 100%;
  font-size: 12px;
}

.kr-edit-grid :deep(.ant-select-selector) {
  min-height: 36px !important;
  font-size: 12px;
}

.baseline-raci-card {
  overflow: hidden;
  border-color: #d6cbea;
}

.baseline-raci-card > header {
  min-height: 72px;
  padding: 13px 15px;
  background: #f5f2fa;
  border-bottom-color: #e1d9ee;
}

.ai-prefill-tag {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  min-height: 28px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #654894;
  background: #eee8f8;
  border: 1px solid #ddd1ef;
  border-radius: 7px;
}

.baseline-raci-table {
  display: grid;
  overflow-x: auto;
  background: #fff;
}

.baseline-raci-row {
  display: grid;
  grid-template-columns: 1.05fr repeat(4, minmax(150px, 1fr));
  min-width: 850px;
  border-bottom: 1px solid #ece8f2;
}

.baseline-raci-row:last-child {
  border-bottom: 0;
}

.baseline-raci-row > * {
  min-width: 0;
  padding: 11px 12px;
  font-size: 12px;
  color: #56626f;
}

.baseline-raci-row > strong {
  color: #303847;
}

.baseline-raci-row.is-head {
  font-weight: 800;
  color: #493965;
  background: #faf8fc;
}

.baseline-raci-row.is-head > span {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: #493965;
}

.baseline-raci-row em {
  padding: 2px 5px;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  color: #78808b;
  background: #f1f2f4;
  border-radius: 5px;
}

.baseline-raci-row em.required-chip {
  color: #a34a3f;
  background: #faece9;
}

.baseline-raci-row :deep(.ant-input) {
  width: calc(100% - 16px);
  min-height: 36px;
  padding: 6px 8px;
  margin: 6px 8px;
  font-size: 12px;
}

.raci-validation,
.raci-sync-note {
  display: flex;
  gap: 7px;
  align-items: center;
  min-height: 38px;
  padding: 8px 12px;
  margin: 0;
  font-size: 12px;
}

.raci-validation {
  color: #9f3f35;
  background: #fff6f4;
  border-top: 1px solid #f1d5d0;
}

.raci-sync-note {
  color: #675c79;
  background: #faf8fc;
  border-top: 1px solid #ece6f2;
}

.raci-validation svg,
.raci-sync-note svg {
  flex: none;
}

.execution-goal-row,
.execution-kr-list > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 45px;
  padding: 7px 10px;
  background: #fff;
  border: 1px solid #e0e9e6;
  border-radius: 8px;
}

.execution-goal-row > div,
.execution-kr-list > div > div {
  display: grid;
  gap: 2px;
}

.execution-goal-row strong,
.execution-kr-list strong {
  font-size: 13px;
  color: #294f45;
}

.execution-goal-row small,
.execution-kr-list small {
  font-size: 12px;
  color: #6b8179;
}

.execution-kr-list {
  display: grid;
  gap: 6px;
  padding-left: 22px;
}

.node-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-width: 60px;
  padding: 4px 7px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 7px;
}

.node-label.is-goal {
  color: #315f8a;
  background: #e7f0f8;
}

.node-label.is-deliverable {
  color: #0b6e65;
  background: #e2f1ec;
}

.node-label.is-metric {
  color: #956018;
  background: #fff1d9;
}

.stage-gate-note {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 8px 10px;
  font-size: 12px;
  color: #5e756d;
  background: #f7faf9;
  border-radius: 8px;
}

.stage-gate-note svg {
  flex: none;
  color: #0b6e65;
}

.baseline-check-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.baseline-check-grid article {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 11px 12px;
  background: #fff;
  border: 1px solid #cbdad5;
  border-radius: 10px;
}

.baseline-check-grid article > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #0b6e65;
  background: #e5f2ee;
  border-radius: 9px;
}

.baseline-check-grid article > div {
  display: grid;
  gap: 2px;
}

.baseline-check-grid strong,
.baseline-check-grid small {
  font-size: 12px;
}

.baseline-check-grid small {
  color: #687f77;
}

.stage-goal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.stage-goal-item {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 9px;
  min-width: 0;
  padding: 12px 13px;
  border-right: 1px solid #edf2f0;
  border-bottom: 1px solid #edf2f0;
}

.stage-goal-item:nth-child(3n) {
  border-right: 0;
}

.stage-goal-item:nth-last-child(-n + 3) {
  border-bottom: 0;
}

.stage-goal-item > span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  background: #edf5f2;
  border-radius: 7px;
}

.stage-goal-item > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.stage-goal-item strong {
  font-size: 12px;
  color: #244b41;
}

.stage-goal-item small {
  font-size: 12px;
  line-height: 1.45;
  color: #6b817a;
}

.stage-goal-item :deep(.ant-input) {
  min-height: 30px;
  font-size: 12px;
  color: #244b41;
  background: #fff;
}

.material-layout,
.charter-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.material-layout {
  grid-template-columns: minmax(250px, 0.72fr) minmax(0, 1.55fr);
  align-items: start;
}

.material-collection-card,
.project-form-card {
  overflow: hidden;
}

.material-card-header > div > span {
  display: grid;
}

.material-card-header > div > span small {
  font-size: 12px;
  color: #758a83;
}

.material-suggestion {
  display: grid;
  gap: 8px;
  padding: 10px;
  margin: 10px;
  background: #f8fbfa;
  border: 1px solid #dce8e4;
  border-radius: 9px;
}

.material-suggestion > div:first-child {
  display: grid;
  gap: 2px;
}

.material-suggestion strong {
  font-size: 12px;
  color: #244b41;
}

.material-suggestion small {
  font-size: 12px;
  color: #70857e;
}

.material-suggestion > div:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.material-suggestion > div:last-child span {
  padding: 3px 7px;
  font-size: 12px;
  color: #55736a;
  background: #fff;
  border: 1px solid #d7e5e1;
  border-radius: 999px;
}

.batch-upload {
  display: block;
  margin: 0 10px 10px;
}

.batch-upload :deep(.ant-upload) {
  display: block;
  width: 100%;
}

.upload-zone {
  display: flex;
  gap: 9px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 62px;
  color: #0b6e65 !important;
  cursor: pointer;
  background: #f3faf7 !important;
  border: 1px dashed #91bfb3 !important;
  border-radius: 9px;
}

.upload-zone > svg {
  font-size: 20px;
}

.upload-zone > span {
  display: grid;
  gap: 1px;
  text-align: left;
}

.upload-zone strong {
  font-size: 12px;
}

.upload-zone small {
  font-size: 12px;
  color: #6c827a;
}

.classification-result {
  margin: 0 10px 10px;
  overflow: hidden;
  border: 1px solid #e0eae7;
  border-radius: 9px;
}

.classification-result > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #fafcfb;
  border-bottom: 1px solid #e7efec;
}

.classification-result > header strong {
  font-size: 12px;
  color: #365b51;
}

.classification-result > header span {
  font-size: 12px;
  color: #6d837b;
}

.classification-empty {
  display: grid;
  gap: 3px;
  place-items: center;
  min-height: 96px;
  padding: 14px;
  text-align: center;
}

.classification-empty svg {
  font-size: 20px;
  color: #89a099;
}

.classification-empty strong {
  font-size: 12px;
  color: #4e6c63;
}

.classification-empty small {
  font-size: 12px;
  color: #7a8d87;
}

.file-list {
  display: grid;
  padding: 5px 10px;
}

.file-list > button {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 48px;
  padding: 7px 2px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid #edf2f0;
}

.file-list > :last-child {
  border: 0;
}

.file-list > button > svg {
  font-size: 16px;
  color: #55736a;
}

.file-list > button > span {
  display: grid;
  min-width: 0;
}

.file-list strong {
  font-size: 12px;
}

.file-list small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #748981;
  white-space: nowrap;
}

.file-list em {
  padding: 2px 6px;
  font-size: 12px;
  font-style: normal;
  color: #4d6b62;
  background: #edf5f2;
  border: 1px solid #d7e5e1;
  border-radius: 999px;
}

.file-list em.is-ready {
  color: #0b6e65;
  background: #e8f5f0;
  border-color: #bfddd4;
}

.material-tip {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 9px;
  margin: 0 10px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: #748981;
  background: #f8fbfa;
  border: 1px dashed #c7dcd6;
  border-radius: 8px;
}

.material-tip svg {
  flex: none;
  color: #0b6e65;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px 15px 15px;
}

.form-grid label {
  display: grid;
  gap: 4px;
}

.form-grid label > span {
  font-size: 12px;
  font-weight: 700;
  color: #46645c;
}

.form-grid label > span em {
  margin-left: 3px;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  color: #7b8f88;
}

.form-grid label.is-wide {
  grid-column: 1/-1;
}

.form-grid :deep(.ant-select) {
  width: 100%;
}

.form-grid :deep(.ant-input),
.form-grid :deep(.ant-select-selector) {
  min-height: 38px;
  font-size: 12px;
  color: #244b41;
  background: #fff !important;
  border-color: #ccddd8 !important;
}

.form-grid :deep(textarea.ant-input) {
  min-height: 74px;
  line-height: 1.55;
}

.project-form-card {
  position: relative;
  background: #fff;
  border-color: #bfd8d1;
}

.project-analysis-mask {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(225 236 232 / 96%);
  backdrop-filter: blur(3px);
}

.project-analysis-panel {
  display: grid;
  width: min(100%, 520px);
  padding: 24px;
  background: #fff;
  border: 1px solid #b9d0c9;
  border-radius: 16px;
  box-shadow: 0 16px 40px rgb(39 77 67 / 13%);
}

.project-analysis-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  margin-bottom: 12px;
  font-size: 22px;
  color: #0b6e65;
  background: #e3f1ed;
  border: 1px solid #bed8d0;
  border-radius: 13px;
}

.project-analysis-heading {
  display: grid;
  gap: 3px;
}

.project-analysis-heading small {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.08em;
}

.project-analysis-heading strong {
  font-size: 18px;
  color: #173f36;
}

.project-analysis-heading p {
  margin: 0;
  font-size: 12px;
  color: #607970;
}

.recognition-stage-list {
  display: grid;
  gap: 7px;
  margin: 18px 0 14px;
}

.recognition-stage-list > div {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 8px 10px;
  color: #789087;
  background: #f4f7f6;
  border: 1px solid transparent;
  border-radius: 9px;
}

.recognition-stage-list > div.is-current {
  color: #174f43;
  background: #edf7f3;
  border-color: #b8dace;
}

.recognition-stage-list > div.is-complete {
  color: #456b61;
  background: #f4faf7;
}

.recognition-stage-list > div > span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: currentcolor;
  background: #fff;
  border: 1px solid #d2dfdb;
  border-radius: 8px;
}

.recognition-stage-list > div > div {
  display: grid;
  gap: 1px;
}

.recognition-stage-list strong,
.recognition-stage-list small {
  font-size: 12px;
}

.recognition-stage-list small {
  color: #6b8179;
}

.project-analysis-panel footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #607970;
}

.project-analysis-panel footer strong {
  color: #0b6e65;
}

.analysis-mask-enter-active,
.analysis-mask-leave-active {
  transition: opacity 220ms ease;
}

.analysis-mask-enter-from,
.analysis-mask-leave-to {
  opacity: 0;
}

.project-info-header {
  min-height: 74px;
  padding: 14px 16px !important;
  background: #f6faf8;
}

.project-info-header > div {
  gap: 10px !important;
}

.project-info-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 17px;
  color: #0b6e65;
  background: #e6f3ee;
  border-radius: 10px;
}

.project-info-copy {
  display: grid;
  gap: 1px;
}

.project-info-copy small {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.09em;
}

.project-info-copy strong {
  font-size: 16px !important;
  color: #173f36;
}

.project-info-copy em {
  font-size: 12px;
  font-style: normal;
  color: #6d817a;
}

.project-info-header > span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 7px;
  color: #537067 !important;
  background: #fff;
  border: 1px solid #d7e5e1;
  border-radius: 999px;
}

.project-generation-state {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 10px;
  margin: 13px 15px 4px;
  background: #fafcfb;
  border: 1px dashed #c8d8d3;
  border-radius: 9px;
}

.project-generation-state.is-ready {
  background: #edf7f3;
  border-color: #b8dace;
  border-style: solid;
}

.project-generation-state > span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #0b6e65;
  background: #fff;
  border-radius: 9px;
}

.project-generation-state > div {
  display: grid;
  gap: 2px;
}

.project-generation-state strong {
  font-size: 12px;
  color: #244b41;
}

.project-generation-state small {
  font-size: 12px;
  color: #70857e;
}

.is-spinning {
  animation: initiation-spin 900ms linear infinite;
}

@keyframes initiation-spin {
  to {
    transform: rotate(360deg);
  }
}

.form-section + .form-section {
  border-top: 1px solid #e7eeec;
}

.form-section > header {
  padding: 13px 15px 0;
}

.form-section > header > div {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.form-section > header > div > span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  background: #edf5f2;
  border-radius: 7px;
}

.form-section > header > div > div {
  display: grid;
}

.form-section > header strong {
  font-size: 12px;
  color: #244b41;
}

.form-section > header small {
  font-size: 12px;
  color: #768a83;
}

.analysis-progress {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.analysis-progress > div:first-child {
  display: flex;
  gap: 10px;
  align-items: center;
}

.ai-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 16px;
  color: #0b6e65;
  background: #edf5f2;
  border-radius: 9px;
}

.analysis-progress > div > div {
  display: grid;
  gap: 2px;
}

.analysis-progress strong {
  font-size: 12px;
}

.analysis-progress small {
  font-size: 12px;
  color: #70867f;
}

.progress-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.progress-line b {
  font-size: 12px;
  color: #0b6e65;
}

.analysis-grid,
.baseline-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.analysis-grid article,
.baseline-grid article {
  display: grid;
  gap: 3px;
  padding: 13px;
}

.analysis-grid span,
.baseline-grid strong {
  font-size: 19px;
  font-weight: 800;
  color: #0b6e65;
}

.analysis-grid strong,
.baseline-grid small {
  font-size: 12px;
}

.analysis-grid small,
.baseline-grid span {
  font-size: 12px;
  line-height: 1.4;
  color: #70867f;
}

.gap-card {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 13px 14px;
  background: #fffaf1;
  border: 1px solid #efd9b9;
  border-radius: 12px;
}

.gap-card > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: #a96d20;
  background: #fff1d9;
  border-radius: 8px;
}

.gap-card strong {
  font-size: 12px;
  color: #77501e;
}

.gap-card p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: #765f40;
}

.scope-card,
.milestone-card {
  padding-bottom: 13px;
}

.scope-card h4 {
  margin: 11px 13px 4px;
  font-size: 12px;
  color: #31584e;
}

.scope-card ul {
  display: grid;
  gap: 5px;
  padding: 0 14px 0 30px;
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #49665e;
}

.scope-card .muted-list {
  color: #71857e;
}

.milestone-card ol {
  display: grid;
  gap: 0;
  padding: 8px 13px;
  margin: 0;
  list-style: none;
}

.milestone-card li {
  display: grid;
  grid-template-columns: 25px 1fr;
  gap: 8px;
  align-items: center;
  padding: 7px 0;
  border-bottom: 1px solid #edf2f0;
}

.milestone-card li:last-child {
  border: 0;
}

.milestone-card li > b {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  color: #0b6e65;
  background: #edf5f2;
  border-radius: 7px;
}

.milestone-card li > div {
  display: grid;
}

.milestone-card li strong {
  font-size: 12px;
}

.milestone-card li small {
  font-size: 12px;
  color: #72877f;
}

.raci-card {
  overflow: hidden;
}

.raci-table {
  display: grid;
  overflow-x: auto;
}

.raci-row {
  display: grid;
  grid-template-columns: 1.05fr repeat(4, 1fr);
  min-width: 650px;
  border-bottom: 1px solid #edf2f0;
}

.raci-row:last-child {
  border: 0;
}

.raci-row > * {
  padding: 9px 11px;
  font-size: 12px;
  color: #506c64;
}

.raci-row strong {
  color: #244b41;
}

.raci-row.is-head {
  font-weight: 800;
  background: #f3f8f6;
}

.raci-row :deep(.ant-input) {
  min-height: 32px;
  padding: 5px 7px;
  margin: 4px 5px;
  font-size: 12px;
  color: #244b41;
  background: #fff;
}

.confirmation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.confirmation-grid button {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 12px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 11px;
}

.confirmation-grid button > span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  color: #758a83;
  background: #f3f7f5;
  border-radius: 8px;
}

.confirmation-grid button > div {
  display: grid;
  gap: 2px;
}

.confirmation-grid strong {
  font-size: 12px;
}

.confirmation-grid small {
  font-size: 12px;
  color: #70867f;
}

.confirmation-grid button.is-confirmed {
  background: #f4faf7;
  border-color: #9fc8bd;
}

.confirmation-grid button.is-confirmed > span {
  color: #0b6e65;
  background: #e1f1eb;
}

.confirmation-grid button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.baseline-success {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 13px;
  align-items: center;
  padding: 18px;
  background: #fff;
  border: 1px solid #b8d9cf;
  border-radius: 13px;
}

.baseline-success > span {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  font-size: 22px;
  color: #0b6e65;
  background: #e3f2ed;
  border-radius: 12px;
}

.baseline-success small {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
  letter-spacing: 0.1em;
}

.baseline-success h3 {
  margin: 2px 0 3px;
  font-size: 15px;
}

.baseline-success p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #647c74;
}

.baseline-note {
  display: flex;
  gap: 10px;
  padding: 14px;
}

.baseline-note > svg {
  flex: none;
  font-size: 20px;
  color: #0b6e65;
}

.baseline-note strong {
  font-size: 12px;
}

.baseline-note p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.55;
  color: #607970;
}

.wizard-footer {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #e6efec;
  border-top: 1px solid #cbdad5;
}

.wizard-footer > span,
.wizard-footer > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.wizard-footer > span {
  font-size: 12px;
  color: #607970;
}

.wizard-footer > span svg {
  color: #0b806f;
}

.primary-action {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
  box-shadow: none !important;
}

.primary-action:hover,
.primary-action:focus-visible {
  background: #085c55 !important;
  border-color: #085c55 !important;
}

.primary-action:disabled {
  color: #8aa098 !important;
  background: #dce7e3 !important;
  border-color: #dce7e3 !important;
}

.light-action {
  color: #0b6e65 !important;
  background: #fff !important;
  border-color: #acd0c6 !important;
  box-shadow: none !important;
}

.light-action:hover,
.light-action:focus-visible {
  color: #085c55 !important;
  background: #f0f7f4 !important;
  border-color: #78b3a4 !important;
}

@container (max-width: 1050px) {
  .initiation-workbench {
    grid-template-columns: 1fr;
  }

  .record-panel {
    max-height: 330px;
  }

  .record-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .step-navigation {
    overflow-x: auto;
  }

  .step-navigation button {
    min-width: 130px;
  }

  .charter-grid {
    grid-template-columns: 1fr;
  }

  .analysis-grid,
  .baseline-grid,
  .stage-goal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stage-goal-item:nth-child(3n) {
    border-right: 1px solid #edf2f0;
  }

  .stage-goal-item:nth-child(2n) {
    border-right: 0;
  }

  .stage-goal-item:nth-last-child(-n + 3) {
    border-bottom: 1px solid #edf2f0;
  }

  .stage-goal-item:nth-last-child(-n + 2) {
    border-bottom: 0;
  }
}

@container (max-width: 820px) {
  .material-layout {
    grid-template-columns: 1fr;
  }
}

@container (max-width: 680px) {
  .summary-strip,
  .analysis-grid,
  .baseline-grid,
  .confirmation-grid,
  .record-list,
  .stage-goal-grid {
    grid-template-columns: 1fr;
  }

  .status-filter {
    flex-wrap: wrap;
  }

  .status-filter button {
    flex: 1 1 30%;
  }

  .record-header,
  .section-heading,
  .baseline-success {
    flex-direction: column;
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid label.is-wide {
    grid-column: auto;
  }

  .charter-objective-content,
  .core-role-list,
  .charter-risk-list,
  .baseline-check-grid,
  .stage-edit-grid,
  .goal-edit-grid,
  .kr-edit-grid {
    grid-template-columns: 1fr;
  }

  .charter-objective-content > div {
    justify-content: flex-start;
  }

  .stage-edit-grid label.is-wide {
    grid-column: auto;
  }

  .execution-stage summary {
    grid-template-columns: 38px minmax(0, 1fr) 18px;
  }

  .execution-stage summary > svg {
    grid-column: 3;
    grid-row: 1;
  }

  .dependency-pill {
    grid-column: 2;
    max-width: 100%;
  }

  .execution-stage-body {
    padding: 10px;
  }

  .execution-kr-list {
    padding-left: 12px;
  }

  .project-info-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .gap-card {
    grid-template-columns: 32px minmax(0, 1fr);
  }

  .gap-card .light-action {
    grid-column: 2;
  }

  .work-section {
    padding: 13px;
  }

  .raci-row {
    grid-template-columns: 120px repeat(4, 130px);
  }

  .stage-goal-item,
  .stage-goal-item:nth-child(2n),
  .stage-goal-item:nth-child(3n),
  .stage-goal-item:nth-last-child(-n + 2),
  .stage-goal-item:nth-last-child(-n + 3) {
    border-right: 0;
    border-bottom: 1px solid #edf2f0;
  }

  .stage-goal-item:last-child {
    border-bottom: 0;
  }

  .wizard-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .wizard-footer > div {
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .analysis-mask-enter-active,
  .analysis-mask-leave-active,
  .is-spinning,
  .status-filter button,
  .record-card {
    transition: none;
    animation: none;
  }
}
</style>

<style>
.initiation-light-drawer .ant-drawer-content,
.initiation-light-drawer .ant-drawer-header,
.initiation-light-drawer .ant-drawer-body {
  background: #fff !important;
}

.initiation-light-drawer .ant-drawer-header {
  border-bottom: 1px solid #dce8e4;
}

.source-drawer-content {
  display: grid;
  gap: 12px;
  color: #183f36;
}

.source-type {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  width: max-content;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
  background: #edf5f2;
  border-radius: 999px;
}

.source-drawer-content h3 {
  margin: 0;
  font-size: 17px;
}

.source-drawer-content > p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #637b74;
}

.source-drawer-content article {
  display: grid;
  gap: 4px;
  padding: 12px;
  background: #f8fbfa;
  border: 1px solid #dce8e4;
  border-radius: 10px;
}

.source-drawer-content article small {
  font-size: 12px;
  color: #0b6e65;
}

.source-drawer-content article strong {
  font-size: 12px;
}

.source-drawer-content article p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #607870;
}
</style>
