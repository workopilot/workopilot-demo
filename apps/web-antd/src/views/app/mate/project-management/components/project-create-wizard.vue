<script setup lang="ts">
import type {
  DeliverableStandard,
  ManagedProject,
  ProjectCharter,
  ProjectStage,
  ProjectType,
  RaciItem,
} from '#/types/project-management';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Input,
  message,
  Modal,
  Progress,
  Segmented,
  Steps,
  Table,
  Tag,
} from 'ant-design-vue';

import { projectTemplates } from '#/api/mock-project-management';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  'update:open': [value: boolean];
  created: [project: ManagedProject];
}>();

const current = ref(0);
const generating = ref(false);
const selectedTemplate = ref<ProjectType>('standard-delivery');
const sourceMode = ref<'contract' | 'meeting' | 'manual'>('contract');
const sourceOptions: Array<{
  icon: string;
  label: string;
  value: 'contract' | 'manual' | 'meeting';
}> = [
  { value: 'contract', icon: 'lucide:file-signature', label: '客户合同' },
  { value: 'meeting', icon: 'lucide:notebook-tabs', label: '会议纪要' },
  { value: 'manual', icon: 'lucide:square-pen', label: '手工创建' },
];
const generatedStages = ref<ProjectStage[]>([]);
const generatedCharter = ref<ProjectCharter | null>(null);
const charterPreviewTab = ref<'charter' | 'plan'>('charter');

const form = reactive({
  name: '客户 B 产线智能化升级交付项目',
  code: 'CB-DEL-2026',
  customer: '客户 B (宁德智造)',
  manager: '李四',
  startDate: '2026-09-03',
  dueDate: '2026-10-30',
  contractCode: 'HT-CATL-2026-D4',
  contractName: '智能制造产线工位改造与算法实施合同',
  sowSummary: '实施 4 套质检工位硬件改造、完成协议适配与 14 天稳定试运行，未详述项依据公司内部交付制度执行。',
  internalStandardNote: '合同缺少验收整改与容缺条款，根据《客户项目交付管理制度》补齐准出标准、RACI矩阵与前置验收规范。',
  description: '完成客户产线智能化系统实施、联调、上线与验收，确保高质量交付。',
});

const openModel = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
});
const template = computed(() =>
  projectTemplates.find((item) => item.id === selectedTemplate.value),
);
const objectiveCount = computed(() =>
  generatedStages.value.reduce((total, stage) => total + stage.objectives.length, 0),
);
const krCount = computed(() =>
  generatedStages.value.reduce(
    (total, stage) =>
      total + stage.objectives.reduce((sum, objective) => sum + objective.krs.length, 0),
    0,
  ),
);

watch(
  () => props.open,
  (value) => {
    if (!value) return;
    current.value = 0;
    generatedStages.value = [];
    generatedCharter.value = null;
    charterPreviewTab.value = 'charter';
  },
);

function addDays(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  date.setDate(date.getDate() + days);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function buildStages() {
  const phases = template.value?.phases || [];
  const start = new Date(`${form.startDate}T00:00:00`).getTime();
  const end = new Date(`${form.dueDate}T00:00:00`).getTime();
  const totalDays = Math.max(1, Math.round((end - start) / 86_400_000));
  const phaseDays = Math.max(5, Math.floor(totalDays / Math.max(phases.length, 1)));

  generatedStages.value = phases.map((phase, index) => {
    const stageStart = addDays(form.startDate, index * phaseDays);
    const stageEnd =
      index === phases.length - 1
        ? form.dueDate
        : addDays(form.startDate, (index + 1) * phaseDays - 1);
    const stageCode = `S${index + 1}`;
    const objectiveCode = `O${index + 1}`;
    return {
      id: `new-stage-${index + 1}`,
      code: stageCode,
      name: phase,
      description: `完成${phase}范围内的目标、成果物与验收门禁。`,
      owner: form.manager,
      plannedStart: stageStart,
      plannedEnd: stageEnd,
      dependsOn: index === 0 ? [] : [`new-stage-${index}`],
      entryCriteria: index === 0 ? '立项审批通过，项目基线已发布' : `前置阶段 S${index} 完成门禁通过`,
      exitCriteria: `${phase}成果物完成、指标达标并由项目经理确认`,
      status: index === 0 ? 'ready' : 'pending',
      progress: 0,
      health: 'healthy',
      objectives: [
        {
          id: `new-objective-${index + 1}`,
          code: objectiveCode,
          title: `按计划完成${phase}并通过阶段验收`,
          description: `聚焦${phase}的可验证业务结果。`,
          owner: form.manager,
          collaborators: ['张三', '刘工'],
          progress: 0,
          health: 'healthy',
          krs: [
            {
              id: `new-deliverable-${index + 1}`,
              title: `提交《${phase}成果报告》并完成确认`,
              kind: 'deliverable',
              owner: '张三',
              dueDate: stageEnd,
              status: 'pending',
              weight: 60,
              acceptance: '文档完整、责任人确认、满足阶段完成门禁',
              artifact: `《${phase}成果报告》`,
            },
            {
              id: `new-metric-${index + 1}`,
              title: `${phase}验收项通过率达到 95%`,
              kind: 'metric',
              owner: '刘工',
              dueDate: stageEnd,
              status: 'pending',
              weight: 40,
              target: 95,
              actual: 0,
              unit: '%',
            },
          ],
        },
      ],
    } satisfies ProjectStage;
  });

  // 同步自动构建《项目宪章 Project Charter》
  generatedCharter.value = {
    id: `charter-${Date.now()}`,
    projectId: `project-${Date.now()}`,
    contractCode: form.contractCode,
    contractName: form.contractName,
    sowSummary: form.sowSummary,
    internalStandardNote: form.internalStandardNote,
    businessGoals: [
      '消除产线硬件检测盲区，算法准确率稳定达到 99.2%',
      '实现核心工位检测相机 7x24h 自动化巡检与状态监控',
      '按期通过客户阶段性验收，10 月 30 日前取得正式移交报告',
    ],
    raciMatrix: phases.map((phase, idx) => ({
      stageId: `new-stage-${idx + 1}`,
      stageName: phase,
      responsible: idx === 0 ? form.manager : idx === 1 ? '方案架构师' : idx === 2 ? '实施负责人(张三)' : idx === 3 ? '现场技术支持' : '交付经理',
      accountable: form.manager,
      consulted: idx === 2 ? '硬件专家(刘工)' : '技术委员会',
      informed: form.customer,
    })),
    deliverableStandards: phases.map((phase, idx) => ({
      id: `deliv-std-${idx + 1}`,
      name: `《${phase}成果报告》`,
      stageName: phase,
      requiredFormat: idx === 2 ? 'document' : 'screenshot',
      formatLabel: idx === 2 ? '文档及签字盖章件' : '系统操作流截图',
      acceptanceCriteria: idx === 2 ? '需包含接口用例集与压测记录，并附双方 PM 签字，阻断级 Bug 为 0' : '需上传系统审批流完成截图，不接受微信文字沟通凭据',
      sampleName: `${phase}-验收样例标准.pdf`,
      verifierRole: form.manager,
    })),
    resourceBudget: {
      manDays: Math.max(80, totalDays * 3),
      teamSize: 5,
      environments: ['客户工控机沙箱', '云端算法流水线', '现场局域网测试环境'],
      hardwareDependencies: ['智能工业相机', '工控机专用采集卡'],
    },
    changeControlRule: '单次工期延期超过 3 天需重新向 PMO 申请重承诺；非关键成果物欠缺须经交付总监签署《容缺流转单》方可推进。',
    status: 'approved',
    approvedAt: form.startDate,
    approvedBy: '项目管理办公室(PMO)',
  };
}

function next() {
  if (current.value === 0) {
    if (!form.name.trim() || !form.code.trim() || !form.customer.trim()) {
      message.warning('请补全项目名称、项目编码和客户名称');
      return;
    }
    if (form.startDate >= form.dueDate) {
      message.warning('计划完成日期需要晚于计划开始日期');
      return;
    }
    current.value = 1;
    return;
  }

  generating.value = true;
  window.setTimeout(() => {
    buildStages();
    generating.value = false;
    current.value = 2;
  }, 650);
}

function createProject() {
  const objectives = generatedStages.value.flatMap((stage) => stage.objectives);
  const project: ManagedProject = {
    id: `project-${Date.now()}`,
    code: form.code,
    name: form.name,
    customer: form.customer,
    type: selectedTemplate.value,
    typeLabel: template.value?.name || '标准交付',
    manager: form.manager,
    startDate: form.startDate,
    stage: generatedStages.value[0]?.name || '待启动',
    dueDate: form.dueDate,
    initiationStatus: 'pending',
    initiationStatusLabel: '审批中',
    progress: 0,
    onTimeProbability: 88,
    health: 'healthy',
    healthLabel: '正常',
    summary: form.description,
    charter: generatedCharter.value || undefined,
    stages: generatedStages.value,
    objectives,
  };

  emit('created', project);
  message.success('立项申请已提交，项目宪章与计划已进入审批生效流');
  openModel.value = false;
}
</script>

<template>
  <Modal
    v-model:open="openModel"
    width="960px"
    :footer="null"
    title="AI 立项"
    wrap-class-name="project-create-modal"
    destroy-on-close
  >
    <div class="project-wizard">
      <Steps
        :current="current"
        size="small"
        :items="[
          { title: '立项信息' },
          { title: '生成项目计划' },
          { title: '审阅并提交' },
        ]"
      />

      <section v-if="current === 0" class="wizard-step">
        <header class="step-heading">
          <div>
            <span>STEP 1</span>
            <h3>确认立项依据和项目基线</h3>
            <p>AI 会读取立项材料并提取客户、范围与时间要求，最终仍由项目经理确认。</p>
          </div>
          <Tag>草稿未提交</Tag>
        </header>

        <div class="source-switch" aria-label="立项来源">
          <button
            v-for="source in sourceOptions"
            :key="source.value"
            type="button"
            :class="{ 'is-selected': sourceMode === source.value }"
            @click="sourceMode = source.value"
          >
            <Icon :icon="source.icon" />{{ source.label }}
          </button>
        </div>

        <div class="form-grid">
          <label class="is-wide">项目名称<Input v-model:value="form.name" /></label>
          <label>项目编码<Input v-model:value="form.code" /></label>
          <label>客户名称<Input v-model:value="form.customer" /></label>
          <label>项目经理<Input v-model:value="form.manager" /></label>
          <label>计划开始<input v-model="form.startDate" type="date" /></label>
          <label>计划完成<input v-model="form.dueDate" type="date" /></label>
          <label class="is-wide">
            关联商务合同 / SOW 协议
            <Input v-model:value="form.contractCode" placeholder="如：HT-CATL-2026-D4 (客户合同编号)" />
          </label>
          <label class="is-wide">
            合同 SOW 交付范围（外部法务约束）
            <Input v-model:value="form.sowSummary" placeholder="合同约定的硬性范围与客户验收里程碑" />
          </label>
          <label class="is-wide">
            内部管理制度对齐策略（治理底线要求）
            <Input v-model:value="form.internalStandardNote" placeholder="依据制度补全阶段准出标准、RACI问责矩阵与前置验收规范" />
          </label>
        </div>

        <div v-if="sourceMode !== 'manual'" class="source-box">
          <Icon icon="lucide:sparkles" />
          <div>
            <strong>AI 已深度融合 3 份立项治理输入</strong>
            <p>《{{ form.contractName }}》、立项研讨会议纪要、公司《项目交付管理制度》；已自动生成兼具外部商务约束与内部制度底线的项目宪章草案。</p>
          </div>
          <Button size="small">查看原文依据</Button>
        </div>
      </section>

      <section v-else-if="current === 1" class="wizard-step">
        <header class="step-heading">
          <div>
            <span>STEP 2</span>
            <h3>选择项目类型和标准流程</h3>
            <p>项目类型决定阶段模板、门禁要求和 AI 默认生成的 O / KR。</p>
          </div>
          <Tag>{{ form.startDate }} 至 {{ form.dueDate }}</Tag>
        </header>

        <div class="template-grid" role="radiogroup" aria-label="项目类型">
          <button
            v-for="item in projectTemplates"
            :key="item.id"
            type="button"
            role="radio"
            :aria-checked="selectedTemplate === item.id"
            :class="{ 'is-selected': selectedTemplate === item.id }"
            @click="selectedTemplate = item.id"
          >
            <span><Icon :icon="item.icon" /></span>
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
            <small>{{ item.phases.length }} 个阶段 · AI 按制度生成 O / KR</small>
          </button>
        </div>

        <div class="generation-preview">
          <div>
            <Icon icon="lucide:wand-sparkles" />
            <span>
              <strong>AI 将生成可审阅的项目基线与《项目宪章》</strong>
              <small>包含阶段依赖、时间窗口、前置验收标准、RACI责任矩阵与异常整改规程。</small>
            </span>
          </div>
          <div class="phase-flow">
            <template v-for="(phase, index) in template?.phases" :key="phase">
              <span>S{{ index + 1 }} {{ phase }}</span>
              <Icon v-if="index < (template?.phases.length || 0) - 1" icon="lucide:arrow-right" />
            </template>
          </div>
        </div>
      </section>

      <section v-else class="wizard-step">
        <header class="generated-head">
          <div>
            <span>AI GENERATED BASELINE</span>
            <h3>项目计划与宪章已生成，等待人工确认</h3>
            <p>{{ generatedStages.length }} 个阶段 · {{ objectiveCount }} 个目标 · {{ krCount }} 个 KR，已生成 RACI 与成果物前置验收标准。</p>
          </div>
          <div class="flex items-center gap-3">
            <Segmented
              v-model:value="charterPreviewTab"
              :options="[
                { label: '项目宪章 (Charter)', value: 'charter' },
                { label: '阶段与目标计划', value: 'plan' },
              ]"
            />
            <Progress type="circle" :percent="96" :size="56" stroke-color="#4f9d88" />
          </div>
        </header>

        <!-- 宪章预览视图 -->
        <div v-if="charterPreviewTab === 'charter' && generatedCharter" class="charter-card">
          <div class="charter-paper">
            <div class="charter-stamp">
              <span>待管委会签发</span>
              <small>PROJECT CHARTER</small>
            </div>

            <div class="charter-title-box">
              <span class="text-xs uppercase tracking-wider text-emerald-700 font-semibold">企业级数字化交付治理正本</span>
              <h2 class="text-lg font-bold text-slate-800 m-0">{{ generatedCharter.title }}</h2>
              <div class="flex flex-wrap gap-4 text-xs text-slate-500 mt-1">
                <span>客户: <strong class="text-slate-700">{{ generatedCharter.customer }}</strong></span>
                <span>项目经理: <strong class="text-slate-700">{{ generatedCharter.manager }}</strong></span>
                <span>版本: <strong class="text-slate-700">{{ generatedCharter.version }}</strong></span>
                <span>生成日期: <strong class="text-slate-700">{{ generatedCharter.approvedDate }}</strong></span>
              </div>
            </div>

            <div class="charter-section">
              <h4 class="section-title"><Icon icon="lucide:target" class="text-emerald-600" /> 1. 业务目标与交付范围 (合同 SOW + 制度双核对齐)</h4>
              <p class="text-xs text-slate-600 leading-relaxed mb-2">{{ generatedCharter.scopeSummary }}</p>
              <div class="grid grid-cols-2 gap-2">
                <div v-for="(obj, idx) in generatedCharter.objectives" :key="idx" class="p-2 bg-emerald-50/70 rounded border border-emerald-100 text-xs text-emerald-950">
                  <span class="font-bold">目标 {{ idx + 1 }}:</span> {{ obj }}
                </div>
              </div>
            </div>

            <div class="charter-section">
              <h4 class="section-title"><Icon icon="lucide:users" class="text-blue-600" /> 2. RACI 责任矩阵</h4>
              <div class="overflow-x-auto rounded border border-slate-200">
                <table class="charter-table">
                  <thead>
                    <tr>
                      <th style="width: 120px;">角色</th>
                      <th style="width: 100px;">责任人</th>
                      <th>职责范围</th>
                      <th style="width: 140px;">RACI 定义</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="raci in generatedCharter.raciMatrix" :key="raci.role">
                      <td class="font-medium text-slate-700">{{ raci.role }}</td>
                      <td><Tag color="cyan">{{ raci.owner }}</Tag></td>
                      <td class="text-slate-600 text-xs">{{ raci.responsibility }}</td>
                      <td>
                        <span
                          class="px-2 py-0.5 rounded text-[11px] font-semibold"
                          :class="{
                            'bg-red-100 text-red-700': raci.type === 'R',
                            'bg-purple-100 text-purple-700': raci.type === 'A',
                            'bg-blue-100 text-blue-700': raci.type === 'C',
                            'bg-gray-100 text-gray-700': raci.type === 'I',
                          }"
                        >
                          {{ raci.type === 'R' ? 'R (实际执行)' : raci.type === 'A' ? 'A (最终问责)' : raci.type === 'C' ? 'C (咨询协同)' : 'I (知会备查)' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="charter-section">
              <h4 class="section-title"><Icon icon="lucide:file-check" class="text-indigo-600" /> 3. 成果物前置验收规范与凭证格式要求 (制度强制)</h4>
              <div class="overflow-x-auto rounded border border-slate-200">
                <table class="charter-table">
                  <thead>
                    <tr>
                      <th style="width: 160px;">成果物名称</th>
                      <th style="width: 90px;">归属阶段</th>
                      <th>前置格式规范 (杜绝模糊聊天记录)</th>
                      <th style="width: 110px;">验收人</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="del in generatedCharter.deliverableStandards" :key="del.name">
                      <td class="font-medium text-slate-800">{{ del.name }}</td>
                      <td><Tag color="blue">{{ del.stageCode }}</Tag></td>
                      <td class="text-xs text-rose-700 font-medium">{{ del.formatStandard }}</td>
                      <td><Tag color="green">{{ del.approverRole }}</Tag></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="charter-section grid grid-cols-2 gap-3">
              <div class="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-xs">
                <h5 class="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                  <Icon icon="lucide:alert-octagon" /> 例外处置与容缺整改机制
                </h5>
                <p class="text-amber-800 m-0">{{ generatedCharter.exceptionHandling }}</p>
              </div>
              <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <h5 class="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Icon icon="lucide:coins" /> 资源预算与变更控制
                </h5>
                <p class="text-slate-600 m-0">{{ generatedCharter.budgetSummary }}。{{ generatedCharter.changeControlRule }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 阶段计划列表视图 -->
        <div v-else class="generated-plan">
          <article v-for="stage in generatedStages" :key="stage.id">
            <span class="stage-code">{{ stage.code }}</span>
            <div>
              <div class="flex items-center gap-2">
                <strong>{{ stage.name }}</strong>
                <span v-if="stage.exceptionRules" class="text-[11px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">
                  不合格整改时限: {{ stage.exceptionRules.maxRectificationDays }}天 (容缺人: {{ stage.exceptionRules.concessionApprover }})
                </span>
              </div>
              <p>{{ stage.plannedStart }} 至 {{ stage.plannedEnd }} · {{ stage.dependsOn.length ? '依赖前置阶段' : '无前置依赖' }}</p>
              <small>{{ stage.objectives[0]?.code }} {{ stage.objectives[0]?.title }}</small>
            </div>
            <div class="stage-result">
              <span><Icon icon="lucide:file-check-2" />成果物 KR</span>
              <span><Icon icon="lucide:gauge" />指标 KR</span>
            </div>
          </article>
        </div>

        <div class="review-note">
          <Icon icon="lucide:shield-check" />
          <p><strong>人机分工</strong>AI 结合外部合同 SOW 与内部管理制度，生成完备的项目宪章与执行计划；项目经理签字确认后即具备正式治理效力。</p>
        </div>
      </section>

      <footer>
        <Button v-if="current > 0" @click="current -= 1">上一步</Button>
        <span></span>
        <Button @click="openModel = false">取消</Button>
        <Button
          v-if="current < 2"
          class="wizard-primary"
          :loading="generating"
          @click="next"
        >
          {{ current === 0 ? '选择项目模板' : 'AI 生成项目计划' }}
        </Button>
        <Button v-else class="wizard-primary" @click="createProject">提交立项审批</Button>
      </footer>
    </div>
  </Modal>
</template>

<style scoped>
:global(.project-create-modal) {
  color-scheme: light;
}

:global(.project-create-modal .ant-modal-content),
:global(.project-create-modal .ant-modal-header) {
  color: #24483f !important;
  background: #fff !important;
}

:global(.project-create-modal .ant-modal-content) {
  border: 1px solid #dce8e4;
  box-shadow: 0 22px 60px rgb(28 67 57 / 18%);
}

:global(.project-create-modal .ant-modal-title) {
  color: #173c34 !important;
}

:global(.project-create-modal .ant-modal-close) {
  color: #60766f !important;
  background: #f2f7f5 !important;
}

:global(.project-create-modal .ant-input),
.form-grid input {
  min-height: 34px;
  color: #24463e !important;
  background: #fff !important;
  border: 1px solid #cfdfd9 !important;
  border-radius: 6px;
}

:global(.project-create-modal .ant-btn-default:not(.wizard-primary)) {
  color: #4c665e !important;
  background: #fff !important;
  border-color: #cadbd5 !important;
  box-shadow: none !important;
}

:global(.project-create-modal .ant-btn-default:not(.wizard-primary):hover),
:global(.project-create-modal .ant-btn-default:not(.wizard-primary):focus-visible) {
  color: #176b5c !important;
  background: #f1f8f5 !important;
  border-color: #8fc1b4 !important;
}

.project-wizard {
  display: grid;
  gap: 20px;
  padding-top: 8px;
  color: #23453d;
  background: #fff;
}

.wizard-step {
  display: grid;
  gap: 14px;
  min-height: 430px;
  padding: 18px;
  background: #f7faf9;
  border: 1px solid #dce8e4;
  border-radius: 14px;
}

.step-heading,
.generated-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.step-heading span,
.generated-head > div > span {
  font-size: 9px;
  font-weight: 800;
  color: #19705f;
  letter-spacing: 0.1em;
}

.step-heading h3,
.generated-head h3 {
  margin: 4px 0;
  font-size: 18px;
  color: #173a32;
}

.step-heading p,
.generated-head p,
.template-grid p,
.source-box p,
.generated-plan p,
.review-note p {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: #657b73;
}

.source-switch {
  display: flex;
  gap: 8px;
}

.source-switch button {
  display: inline-flex;
  gap: 7px;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  font-size: 11px;
  color: #5a7169;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d7e4df;
  border-radius: 8px;
}

.source-switch button.is-selected,
.source-switch button:hover,
.source-switch button:focus-visible {
  color: #176b5c;
  background: #eaf6f2;
  border-color: #9dcabd;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.form-grid label {
  display: grid;
  gap: 5px;
  font-size: 10px;
  font-weight: 700;
  color: #4b665e;
}

.form-grid label.is-wide {
  grid-column: span 2;
}

.form-grid input {
  width: 100%;
  padding: 0 10px;
  font: inherit;
  font-weight: 400;
}

.source-box,
.review-note {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 13px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 10px;
}

.source-box > svg,
.review-note > svg {
  flex: none;
  font-size: 20px;
  color: #237563;
}

.source-box > div {
  flex: 1;
}

.source-box strong,
.review-note strong {
  font-size: 11px;
  color: #24483f;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.template-grid button {
  min-height: 178px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d7e5df;
  border-radius: 12px;
}

.template-grid button:hover,
.template-grid button:focus-visible,
.template-grid button.is-selected {
  background: #edf8f4;
  border-color: #4f9d88;
  box-shadow: 0 0 0 3px rgb(79 157 136 / 11%);
}

.template-grid button > span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  font-size: 18px;
  color: #247665;
  background: #e7f4ef;
  border-radius: 10px;
}

.template-grid h3 {
  margin: 12px 0 5px;
  font-size: 14px;
  color: #173b33;
}

.template-grid small {
  display: block;
  margin-top: 12px;
  font-size: 9px;
  color: #247665;
}

.generation-preview {
  display: grid;
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 11px;
}

.generation-preview > div:first-child {
  display: flex;
  gap: 10px;
  align-items: center;
}

.generation-preview > div:first-child > svg {
  font-size: 20px;
  color: #247665;
}

.generation-preview span {
  display: grid;
  gap: 2px;
}

.generation-preview strong {
  font-size: 11px;
  color: #24483f;
}

.generation-preview small {
  font-size: 9px;
  color: #72867f;
}

.phase-flow {
  display: flex;
  gap: 8px;
  align-items: center;
  overflow: auto;
}

.phase-flow span {
  flex: none;
  padding: 7px 9px;
  font-size: 9px;
  color: #3a665b;
  background: #f0f7f4;
  border-radius: 7px;
}

.phase-flow svg {
  flex: none;
  color: #91a49d;
}

.generated-head {
  padding: 13px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 11px;
}

.generated-plan {
  display: grid;
  gap: 8px;
}

.generated-plan article {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #e0eae6;
  border-radius: 9px;
}

.stage-code {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 10px;
  font-weight: 800;
  color: #176b5c;
  background: #e4f2ed;
  border-radius: 9px;
}

.generated-plan strong,
.generated-plan small {
  display: block;
}

.generated-plan strong {
  font-size: 12px;
  color: #284d43;
}

.generated-plan small {
  margin-top: 4px;
  font-size: 9px;
  color: #377466;
}

.stage-result {
  display: flex;
  gap: 6px;
}

.stage-result span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 5px 7px;
  font-size: 8px;
  color: #5c716a;
  background: #f2f7f5;
  border-radius: 6px;
}

.project-wizard > footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.project-wizard > footer > span {
  flex: 1;
}

.wizard-primary {
  color: #176b5c !important;
  background: #e7f5ef !important;
  border-color: #afd7ca !important;
  box-shadow: none !important;
}

.wizard-primary:hover,
.wizard-primary:focus-visible {
  color: #10594d !important;
  background: #dcefe8 !important;
  border-color: #83bdae !important;
}

.project-wizard :deep(.ant-steps-item-process .ant-steps-item-icon) {
  background: #dff0ea;
  border-color: #99c9bd;
}

.project-wizard :deep(.ant-steps-item-process .ant-steps-icon) {
  color: #176b5c;
}

.project-wizard :deep(.ant-steps-item-title) {
  color: #60766f !important;
}

@media (max-width: 720px) {
  .template-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-grid label.is-wide {
    grid-column: auto;
  }

  .wizard-step {
    max-height: 65vh;
    overflow: auto;
  }

  .stage-result {
    display: none;
  }
}

.charter-card {
  max-height: 480px;
  overflow-y: auto;
  border-radius: 12px;
  background: #fdfefe;
  border: 1px solid #dce8e4;
  padding: 16px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.charter-paper {
  position: relative;
  background: #ffffff;
  border: 1px solid #e2ece8;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 4px 16px rgba(18, 62, 51, 0.05);
}

.charter-stamp {
  position: absolute;
  top: 18px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 108px;
  height: 52px;
  border: 2px dashed #dc2626;
  border-radius: 6px;
  color: #dc2626;
  font-weight: bold;
  transform: rotate(-5deg);
  opacity: 0.82;
  pointer-events: none;
}

.charter-stamp span {
  font-size: 13px;
  letter-spacing: 1.5px;
}

.charter-stamp small {
  font-size: 8px;
  font-family: ui-monospace, monospace;
}

.charter-title-box {
  margin-bottom: 18px;
  border-bottom: 2px solid #eaf2ee;
  padding-bottom: 12px;
}

.charter-section {
  margin-top: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e3a34;
  margin-bottom: 8px;
}

.charter-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.charter-table th {
  background: #f4f8f6;
  color: #3b5a51;
  font-weight: 600;
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid #e0eae5;
}

.charter-table td {
  padding: 8px 10px;
  border-bottom: 1px solid #edf4f1;
  color: #334155;
}

.charter-table tbody tr:hover {
  background: #fafcfb;
}
</style>
