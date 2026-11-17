<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Dropdown,
  Input,
  message,
  Modal,
  Progress,
  Tag,
  Upload,
} from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type DetailTab = 'exceptions' | 'overview' | 'stages' | 'versions';
type PageTab = 'policies' | 'templates';
type TemplateStatus = 'draft' | 'gap' | 'published' | 'review';
type TemplateCreationStep =
  | 'basic'
  | 'review'
  | 'risk'
  | 'source'
  | 'structure';
type TemplateRiskSource = 'ai' | 'policy';
type UploadStep = 'done' | 'form' | 'parsing' | 'review';

interface DeliverableRule {
  acceptance: string;
  format: string;
  name: string;
  verifier: string;
}

interface PolicySource {
  effectiveDate: string;
  id: string;
  impactedTemplates: string[];
  name: string;
  owner: string;
  scope: string;
  status: 'confirmed' | 'review';
  summary: string;
  type: 'Manual' | 'PDF' | 'Word';
  updatedAt: string;
  version: string;
}

interface TemplateStage {
  deliverablePrompt?: string;
  deliverables: DeliverableRule[];
  duration: string;
  entryRule: string;
  exitRule: string;
  id: string;
  name: string;
  objectivePrompt?: string;
  ownerRole: string;
}

interface TemplateRiskRule {
  applicableStages: string;
  escalation: string;
  expanded?: boolean;
  handling: string;
  id: string;
  name: string;
  owner: string;
  source: TemplateRiskSource;
  trigger: string;
}

interface TemplateVersion {
  author: string;
  date: string;
  note: string;
  status: string;
  version: string;
}

interface ProjectTemplate {
  aiRiskInstruction?: string;
  category: string;
  completeness: number;
  department: string;
  exceptionRules: Array<{
    applicableStages?: string;
    description: string;
    escalation?: string;
    handling?: string;
    id?: string;
    name: string;
    owner: string;
    source?: TemplateRiskSource;
    trigger?: string;
  }>;
  id: string;
  name: string;
  policyIds: string[];
  scope: string;
  stages: TemplateStage[];
  status: TemplateStatus;
  updatedAt: string;
  version: string;
  versions: TemplateVersion[];
}

const route = useRoute();
const router = useRouter();

const pageTabs: Array<{
  description: string;
  icon: string;
  key: PageTab;
  label: string;
}> = [
  {
    key: 'templates',
    label: '模板库',
    icon: 'lucide:library-big',
    description: '已发布与草稿模板',
  },
  {
    key: 'policies',
    label: '制度文件',
    icon: 'lucide:files',
    description: '来源、版本与解析记录',
  },
];

const detailTabs: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: '基本信息' },
  { key: 'stages', label: '阶段与成果物' },
  { key: 'exceptions', label: '异常规则' },
  { key: 'versions', label: '版本记录' },
];

const policySources = ref<PolicySource[]>([
  {
    id: 'policy-delivery',
    name: '项目交付管理制度.pdf',
    type: 'PDF',
    version: 'V3.2',
    scope: '客户交付类项目',
    owner: 'PMO',
    updatedAt: '2026-08-28',
    effectiveDate: '2026-09-01',
    status: 'confirmed',
    impactedTemplates: ['标准交付模板'],
    summary: '定义客户交付项目的阶段门禁、责任角色、成果物与风险升级规则。',
  },
  {
    id: 'policy-acceptance',
    name: '客户验收管理办法.docx',
    type: 'Word',
    version: 'V2.1',
    scope: '交付、实施、运维项目',
    owner: '交付管理部',
    updatedAt: '2026-08-26',
    effectiveDate: '2026-09-01',
    status: 'confirmed',
    impactedTemplates: ['标准交付模板', 'OEM 交付模板'],
    summary: '规范成果物格式、客户签署、验收失败整改和让步接收流程。',
  },
  {
    id: 'policy-product',
    name: '产品研发项目管理制度.docx',
    type: 'Word',
    version: 'V4.0',
    scope: '产品研发类项目',
    owner: '产品委员会',
    updatedAt: '2026-08-20',
    effectiveDate: '2026-08-25',
    status: 'confirmed',
    impactedTemplates: ['定制开发模板'],
    summary: '定义需求、方案、研发、测试和发布阶段的准入准出要求。',
  },
]);

const templates = ref<ProjectTemplate[]>([
  {
    id: 'delivery',
    name: '标准交付模板',
    version: 'V2.3',
    category: '客户交付',
    department: '交付部',
    scope: '合同额 20 万以上的标准实施与集成交付项目',
    status: 'published',
    completeness: 96,
    updatedAt: '2026-08-30 16:20',
    policyIds: ['policy-delivery', 'policy-acceptance'],
    stages: [
      {
        id: 'delivery-1',
        name: '需求沟通',
        duration: '7 个工作日',
        ownerRole: '项目经理',
        entryRule: '合同或项目授权文件已经生效，客户关键联系人明确。',
        exitRule: '客户确认需求范围、业务边界和关键里程碑。',
        deliverables: [
          {
            name: '需求调研报告',
            format: 'Word / PDF',
            acceptance:
              '覆盖合同范围、现状、目标和边界，并由客户项目负责人确认。',
            verifier: '项目经理',
          },
          {
            name: '项目范围确认单',
            format: '签署 PDF',
            acceptance: '明确包含项、不包含项及双方责任，必须保留客户签署页。',
            verifier: '客户项目负责人',
          },
        ],
      },
      {
        id: 'delivery-2',
        name: '蓝图确认',
        duration: '10 个工作日',
        ownerRole: '解决方案负责人',
        entryRule: '需求范围和关键业务流程已确认。',
        exitRule: '客户签署项目蓝图，项目计划及责任分工完成确认。',
        deliverables: [
          {
            name: '项目蓝图方案',
            format: 'PDF',
            acceptance: '覆盖目标流程、系统边界、接口和关键差异，附评审纪要。',
            verifier: '解决方案负责人',
          },
          {
            name: '项目实施计划',
            format: 'Excel / PDF',
            acceptance: '包含阶段、里程碑、依赖、负责人和基线日期。',
            verifier: 'PMO',
          },
        ],
      },
      {
        id: 'delivery-3',
        name: '实施研发',
        duration: '20 个工作日',
        ownerRole: '实施负责人',
        entryRule: '蓝图、资源和环境准备计划已经确认。',
        exitRule: '内部测试通过，试运行环境和数据准备完成。',
        deliverables: [
          {
            name: '实施配置清单',
            format: 'Excel',
            acceptance: '配置项、环境、版本及验证结果完整可追溯。',
            verifier: '实施负责人',
          },
          {
            name: '内部测试报告',
            format: 'PDF + 录像',
            acceptance: '阻断缺陷清零，附关键流程测试录像和缺陷关闭记录。',
            verifier: '测试负责人',
          },
        ],
      },
      {
        id: 'delivery-4',
        name: '试运行',
        duration: '14 个自然日',
        ownerRole: '项目经理',
        entryRule: '系统部署完成，客户用户已培训并具备试运行条件。',
        exitRule: '试运行问题闭环并取得客户书面确认。',
        deliverables: [
          {
            name: '试运行报告',
            format: '签署 PDF',
            acceptance: '包含运行范围、关键数据、问题清单与客户结论。',
            verifier: '客户项目负责人',
          },
          {
            name: '问题闭环清单',
            format: 'Excel',
            acceptance: '全部问题有分级、责任人、关闭证据和验证人。',
            verifier: '项目经理',
          },
        ],
      },
      {
        id: 'delivery-5',
        name: '交付上线',
        duration: '5 个工作日',
        ownerRole: '交付经理',
        entryRule: '试运行结论通过，遗留问题处理方式已经书面确认。',
        exitRule: '客户正式验收并完成运维移交和资料归档。',
        deliverables: [
          {
            name: '客户验收报告',
            format: '签署 PDF',
            acceptance: '客户签字盖章，范围、结论、遗留项和日期完整。',
            verifier: '交付经理',
          },
          {
            name: '项目移交清单',
            format: 'Excel / PDF',
            acceptance: '代码、账号、文档、培训和运维责任全部完成移交。',
            verifier: '运维负责人',
          },
        ],
      },
    ],
    exceptionRules: [
      {
        name: '验收不合格',
        description:
          '成果物未达标时，责任人在 3 个工作日内提交整改版；二次不合格升级为三级质量异常。',
        owner: '阶段负责人 / PMO',
      },
      {
        name: '异常变更',
        description:
          '范围、工期或关键资源变化时先评估影响，再由项目经理发起基线变更审批。',
        owner: '项目经理',
      },
      {
        name: '容缺推进',
        description: '仅非阻断项可申请，需交付总监批准并在 5 个工作日内补正。',
        owner: '交付总监',
      },
    ],
    versions: [
      {
        version: 'V2.3',
        date: '2026-08-30',
        author: '韩立',
        status: '当前发布版',
        note: '补充客户验收失败和容缺推进规则。',
      },
      {
        version: 'V2.2',
        date: '2026-07-12',
        author: '李敏',
        status: '历史版本',
        note: '增加试运行阶段问题闭环清单。',
      },
      {
        version: 'V2.1',
        date: '2026-05-08',
        author: '系统迁移',
        status: '历史版本',
        note: '从旧交付制度初始化。',
      },
    ],
  },
  {
    id: 'development',
    name: '定制开发模板',
    version: 'V1.8',
    category: '产品研发',
    department: '产品研发部',
    scope: '需要定制研发、集成测试和 UAT 的项目',
    status: 'review',
    completeness: 88,
    updatedAt: '2026-09-02 10:40',
    policyIds: ['policy-product'],
    stages: [
      {
        id: 'development-1',
        name: '需求评审',
        duration: '8 个工作日',
        ownerRole: '产品经理',
        entryRule: '业务目标和需求来源明确。',
        exitRule: '需求评审通过并形成可追溯基线。',
        deliverables: [
          {
            name: '产品需求文档',
            format: 'Word / PDF',
            acceptance: '需求、范围、验收条件和责任人完整。',
            verifier: '产品负责人',
          },
        ],
      },
      {
        id: 'development-2',
        name: '研发与联调',
        duration: '20 个工作日',
        ownerRole: '研发负责人',
        entryRule: '方案评审通过且资源到位。',
        exitRule: '核心功能完成并通过联调测试。',
        deliverables: [
          {
            name: '联调测试报告',
            format: 'PDF + 日志',
            acceptance: '接口覆盖率、遗留问题和双方确认记录完整。',
            verifier: '测试负责人',
          },
        ],
      },
      {
        id: 'development-3',
        name: 'UAT 与发布',
        duration: '12 个工作日',
        ownerRole: '项目经理',
        entryRule: '联调结论通过且 UAT 环境就绪。',
        exitRule: 'UAT 通过并完成发布准入评审。',
        deliverables: [
          {
            name: 'UAT 验收报告',
            format: '签署 PDF',
            acceptance: '关键场景通过并保留业务负责人签署。',
            verifier: '业务负责人',
          },
        ],
      },
    ],
    exceptionRules: [
      {
        name: 'UAT 失败',
        description: 'AI 识别到制度仅要求重新测试，缺少整改时限和升级角色。',
        owner: '待确认',
      },
      {
        name: '需求变更',
        description: '变更需重新评估范围、排期和测试影响。',
        owner: '产品负责人',
      },
    ],
    versions: [
      {
        version: 'V1.8',
        date: '2026-09-02',
        author: 'AI 解析草稿',
        status: '待确认',
        note: '新增 UAT 验收失败处理规则，尚未发布。',
      },
      {
        version: 'V1.7',
        date: '2026-06-18',
        author: '赵倩',
        status: '当前发布版',
        note: '调整联调与 UAT 门禁。',
      },
    ],
  },
  {
    id: 'oem',
    name: 'OEM 交付模板',
    version: 'V1.2',
    category: '合作交付',
    department: '渠道合作部',
    scope: 'OEM、联合品牌和渠道合作交付项目',
    status: 'gap',
    completeness: 76,
    updatedAt: '2026-08-24 09:15',
    policyIds: ['policy-acceptance'],
    stages: [
      {
        id: 'oem-1',
        name: '合作确认',
        duration: '7 个工作日',
        ownerRole: '渠道经理',
        entryRule: '合作意向和商务负责人明确。',
        exitRule: '合作范围、品牌使用和双方责任书面确认。',
        deliverables: [
          {
            name: '合作范围确认书',
            format: '签署 PDF',
            acceptance: '合作范围和责任边界完整。',
            verifier: '渠道负责人',
          },
        ],
      },
      {
        id: 'oem-2',
        name: '适配交付',
        duration: '15 个工作日',
        ownerRole: '交付负责人',
        entryRule: '产品版本和适配范围确认。',
        exitRule: '完成适配验证和交付清单。',
        deliverables: [
          {
            name: 'OEM 适配清单',
            format: '待补充',
            acceptance: '制度未规定统一格式和签署要求。',
            verifier: '待确认',
          },
        ],
      },
    ],
    exceptionRules: [
      {
        name: '成果物格式',
        description: '当前制度未明确 OEM 适配清单的统一格式和签署要求。',
        owner: '待确认',
      },
    ],
    versions: [
      {
        version: 'V1.2',
        date: '2026-08-24',
        author: '陈涛',
        status: '有缺口',
        note: '等待补齐适配成果物规范。',
      },
    ],
  },
]);

const routeView = typeof route.query.view === 'string' ? route.query.view : '';
const activePageTab = ref<PageTab>(
  pageTabs.some((item) => item.key === routeView)
    ? (routeView as PageTab)
    : 'templates',
);
const activeDetailTab = ref<DetailTab>('overview');
const selectedTemplateId = ref('delivery');
const selectedStageId = ref('delivery-1');
const sourceDrawerOpen = ref(false);
const selectedSourceId = ref('policy-delivery');
const versionModalOpen = ref(false);
const publishModalOpen = ref(false);
const uploadModalOpen = ref(false);
const uploadStep = ref<UploadStep>('form');
const uploadProgress = ref(0);
const uploadFileName = ref('');
const templateCreateMode = ref(false);
const templateCreateStep = ref<TemplateCreationStep>('source');
const templateSourceName = ref('');
const templateRequirementText = ref('');
const templateDraftName = ref('标准交付项目模板');
const templateDraftCategory = ref('客户交付');
const templateDraftDepartment = ref('交付部');
const templateDraftScope = ref('适用于需要合同交付、阶段验收与客户签署的项目');
const templateRiskInstruction = ref(
  '发现临期、延期、成果物缺失或验收异常时，先核实原因、当前进展和预计完成时间；优先给执行者生成可执行建议并创建待办。若影响阶段或项目交付基线，向项目经理建议发起变更申请；未经人工确认，不得自动修改基线、替代审批或直接要求加班。',
);
const templateDraftRiskRules = ref<TemplateRiskRule[]>([]);
const riskRulesGenerated = ref(false);
const riskRulesGeneratedForType = ref('');
const templateAnalyzing = ref(false);
const templateAnalysisProgress = ref(0);
const templateAnalysisStageIndex = ref(0);
const templateAnalysisStages = [
  {
    label: '正在理解制度与管理语境',
    description: '识别制度用途、适用部门和项目管理边界',
  },
  {
    label: '正在提取项目类型与基本信息',
    description: '整理项目分类、适用范围和责任角色',
  },
  {
    label: '正在提取阶段与顺序',
    description: '识别阶段名称、先后关系、周期和阶段负责人',
  },
  {
    label: '正在识别目标与成果物要求',
    description: '提取准入准出、目标拆分和成果物验收要求',
  },
  {
    label: '正在识别风险与异常处理',
    description: '归纳预警条件、处理动作、升级规则和权限边界',
  },
];
const generatedPolicyDrawerOpen = ref(false);
const generatedPolicyLoading = ref(false);
const generatedPolicyProgress = ref(0);
const generatedPolicyContextName = ref('');
const generatedPolicyStageNames = ref<string[]>([]);
const generatedPolicyRiskNames = ref<string[]>([]);
const generatedPolicyFileName = computed(
  () => `${generatedPolicyContextName.value || '项目模板'}管理制度（草案）.docx`,
);
const templateCreateSteps: Array<{
  description: string;
  icon: string;
  key: TemplateCreationStep;
  label: string;
}> = [
  {
    key: 'source',
    label: '提供依据',
    icon: 'lucide:files',
    description: '上传制度或粘贴要求',
  },
  {
    key: 'basic',
    label: '基本设置',
    icon: 'lucide:sliders-horizontal',
    description: '定义名称与适用范围',
  },
  {
    key: 'structure',
    label: '阶段规则',
    icon: 'lucide:workflow',
    description: '确认 AI 生成的结构',
  },
  {
    key: 'risk',
    label: '风险规则',
    icon: 'lucide:shield-alert',
    description: '确认异常处理方式',
  },
  {
    key: 'review',
    label: '预览发布',
    icon: 'lucide:badge-check',
    description: '确认后用于新项目',
  },
];
const templateDraftStages = ref<TemplateStage[]>([
  {
    id: 'draft-stage-1',
    name: '需求确认',
    duration: '5 个工作日',
    ownerRole: '项目经理',
    entryRule: '项目授权与客户联系人已明确。',
    exitRule: '范围、目标与验收边界已确认。',
    objectivePrompt:
      '根据合同范围和客户业务目标，拆分本阶段目标；每个目标必须包含完成标准、责任角色和计划日期。',
    deliverablePrompt:
      '根据阶段目标生成成果物，明确成果物名称、文件格式、验收标准、验收角色和不合格后的补正要求。',
    deliverables: [
      {
        name: '需求与范围确认单',
        format: '签署 PDF',
        acceptance: '包含范围内、范围外事项并由客户负责人确认。',
        verifier: '客户项目负责人',
      },
    ],
  },
  {
    id: 'draft-stage-2',
    name: '方案与计划',
    duration: '7 个工作日',
    ownerRole: '解决方案负责人',
    entryRule: '需求与范围已经确认。',
    exitRule: '实施方案、里程碑和 RACI 获得批准。',
    objectivePrompt:
      '围绕方案确认、实施计划和资源到位拆分阶段目标，目标应能通过评审结论或签署记录验证。',
    deliverablePrompt:
      '生成方案与计划类成果物，说明必须覆盖的章节、评审参与人、签署形式和版本归档要求。',
    deliverables: [
      {
        name: '项目实施方案',
        format: 'Word / PDF',
        acceptance: '覆盖技术方案、里程碑、资源与风险应对。',
        verifier: '交付总监',
      },
    ],
  },
  {
    id: 'draft-stage-3',
    name: '实施与验证',
    duration: '按项目计划',
    ownerRole: '实施负责人',
    entryRule: '方案、资源与环境准备就绪。',
    exitRule: '实施完成且关键问题已经关闭。',
    objectivePrompt:
      '按实施范围拆分可交付的工作目标，关联环境、功能、接口、测试和问题关闭等可验证结果。',
    deliverablePrompt:
      '生成实施与验证成果物，要求保留配置、测试、日志、截图或录像等证据，并指定验收责任人。',
    deliverables: [
      {
        name: '实施与测试报告',
        format: 'Word / 证据附件',
        acceptance: '包含测试结果、问题清单及关闭证据。',
        verifier: '项目经理',
      },
    ],
  },
  {
    id: 'draft-stage-4',
    name: '验收与移交',
    duration: '5 个工作日',
    ownerRole: '项目经理',
    entryRule: '交付物完整且内部预验收通过。',
    exitRule: '客户签署验收文件并完成运维移交。',
    objectivePrompt:
      '围绕正式验收、遗留问题关闭和运维移交拆分目标，必须明确客户确认动作和完成证据。',
    deliverablePrompt:
      '生成验收与移交成果物，强调客户签署、遗留事项、账号文档交接和归档完整性。',
    deliverables: [
      {
        name: '客户验收报告',
        format: '签署 PDF',
        acceptance: '客户授权代表签字或盖章，遗留问题有关闭计划。',
        verifier: '客户项目负责人',
      },
    ],
  },
]);
let uploadTimer: number | undefined;
let templateAnalysisTimer: number | undefined;
let generatedPolicyTimer: number | undefined;

const selectedTemplate = computed(
  () =>
    templates.value.find((item) => item.id === selectedTemplateId.value) ??
    templates.value[0]!,
);
const selectedStage = computed(
  () =>
    selectedTemplate.value.stages.find(
      (item) => item.id === selectedStageId.value,
    ) ?? selectedTemplate.value.stages[0]!,
);
const selectedSource = computed(
  () =>
    policySources.value.find((item) => item.id === selectedSourceId.value) ??
    policySources.value[0]!,
);
const currentPublishedVersion = computed(
  () =>
    selectedTemplate.value.versions.find(
      (version) => version.status === '当前发布版',
    )?.version ?? '暂无发布版',
);
const suggestedVersion = computed(() => {
  if (selectedTemplate.value.status === 'draft') {
    return selectedTemplate.value.version.replace(' 草稿', '');
  }
  const matched = selectedTemplate.value.version.match(/^V(\d+)\.(\d+)/);
  if (!matched) return `${selectedTemplate.value.version} 新版本`;
  return `V${matched[1]}.${Number(matched[2]) + 1}`;
});
const templateCreateStepIndex = computed(() =>
  templateCreateSteps.findIndex(
    (item) => item.key === templateCreateStep.value,
  ),
);
const canContinueTemplateCreation = computed(() => {
  if (templateCreateStep.value === 'source') {
    return Boolean(
      templateSourceName.value || templateRequirementText.value.trim(),
    );
  }
  if (templateCreateStep.value === 'basic') {
    return Boolean(
      templateDraftName.value.trim() &&
      templateDraftCategory.value.trim() &&
      templateDraftDepartment.value.trim() &&
      templateDraftScope.value.trim(),
    );
  }
  if (templateCreateStep.value === 'structure') {
    return templateDraftStages.value.every(
      (stage) =>
        stage.name.trim() &&
        stage.ownerRole.trim() &&
        stage.entryRule.trim() &&
        stage.exitRule.trim(),
    );
  }
  if (templateCreateStep.value === 'risk') {
    return Boolean(
      templateRiskInstruction.value.trim() &&
        templateDraftRiskRules.value.length > 0 &&
        templateDraftRiskRules.value.every(
          (rule) =>
            rule.name.trim() &&
            rule.applicableStages.trim() &&
            rule.trigger.trim() &&
            rule.handling.trim() &&
            rule.escalation.trim() &&
            rule.owner.trim(),
        ),
    );
  }
  return true;
});
const templateCreateNextLabel = computed(() => {
  if (templateAnalyzing.value) return 'AI 正在解析制度…';
  return {
    basic: '下一步：生成阶段规则',
    review: '发布模板',
    risk: '下一步：预览发布',
    source: '下一步：基本设置',
    structure: '下一步：风险规则',
  }[templateCreateStep.value];
});
const templateDeliverableCount = computed(() =>
  templateDraftStages.value.reduce(
    (sum, stage) => sum + stage.deliverables.length,
    0,
  ),
);
const aiSuggestedRiskCount = computed(
  () =>
    templateDraftRiskRules.value.filter((rule) => rule.source === 'ai').length,
);

function templateStatus(status: TemplateStatus) {
  return {
    draft: { color: 'blue', label: '草稿' },
    gap: { color: 'red', label: '有缺口' },
    published: { color: 'green', label: '已发布' },
    review: { color: 'orange', label: '待确认' },
  }[status];
}

function buildRiskSuggestions(projectType: string): TemplateRiskRule[] {
  const createdAt = Date.now();
  const rules: Omit<TemplateRiskRule, 'id'>[] = [
    {
      name: '阶段或成果物延期',
      source: 'policy',
      applicableStages: '全部阶段',
      trigger: '距离计划完成日期 3 个工作日仍未达到预期进度，或到期成果物尚未提交。',
      handling:
        'AI 先向负责人核实原因、当前进展和预计完成时间，生成处理建议并创建待办持续跟踪。',
      escalation:
        '到期仍未处理时通知项目经理；影响阶段或项目交付日期时建议发起基线变更。',
      owner: '阶段负责人 / 项目经理',
    },
    {
      name: '成果物验收不通过',
      source: 'policy',
      applicableStages: '存在成果物验收的阶段',
      trigger: '成果物缺少必备内容、签署或证据，或者验收结论为不通过。',
      handling:
        '生成整改清单和补充材料建议，创建整改待办并跟踪重新提交与复验结果。',
      escalation: '超过制度整改时限或二次不通过时，升级项目经理和对应审批角色。',
      owner: '成果物负责人 / 验收人',
    },
    {
      name: '外部阻碍持续未解除',
      source: 'ai',
      applicableStages: '全部阶段',
      trigger: '负责人报告外部依赖、供应商、环境或接口阻碍，并且没有明确恢复日期。',
      handling:
        'AI 追问阻碍来源、影响范围、责任方和预计恢复时间，形成协调事项并创建待办。',
      escalation: '连续两次跟进无进展时通知项目经理；影响关键路径时建议升级协调。',
      owner: '项目经理 / 外部依赖责任人',
    },
    {
      name: '核心资源未按计划到位',
      source: 'ai',
      applicableStages: '方案、实施、研发、测试等资源密集阶段',
      trigger: '关键岗位、设备、环境或预算未在阶段开始前落实，可能阻塞关键路径。',
      handling:
        'AI 识别缺失资源和影响任务，建议调配替代资源或调整工作顺序，并向责任人创建待办。',
      escalation: '阶段开始前仍未落实时升级部门负责人；影响交付基线时建议发起变更。',
      owner: '项目经理 / 资源所属部门负责人',
    },
  ];
  const isClientProject = /客户|交付|实施|OEM|合作/i.test(
    `${projectType} ${templateDraftScope.value}`,
  );
  if (isClientProject) {
    rules.push(
      {
        name: '客户资源不足或无法配合',
        source: 'ai',
        applicableStages: '需要客户参与、确认或验收的阶段',
        trigger: '客户负责人、业务人员、现场、数据或接口资源未按约定时间提供。',
        handling:
          'AI 整理缺失资源、原约定时间和影响事项，生成客户协调清单并提醒项目经理确认新时间。',
        escalation: '超过约定时间仍未恢复时形成书面风险记录；影响交付时建议发起基线变更。',
        owner: '项目经理 / 客户项目负责人',
      },
      {
        name: '客户需求发生变更',
        source: 'ai',
        applicableStages: '需求确认后至项目验收前',
        trigger: '客户提出新增、删除或调整已确认范围、验收标准或交付日期。',
        handling:
          'AI 对比原基线，整理范围、工期、成本和成果物影响，生成需求变更申请草稿。',
        escalation: '未经审批不修改项目基线；客户要求先实施时立即提醒项目经理走变更流程。',
        owner: '项目经理 / 客户项目负责人',
      },
    );
  }
  return rules.map((rule, index) => ({
    ...rule,
    id: `draft-risk-${createdAt}-${index}`,
  }));
}

function generateRiskSuggestions(force = false) {
  if (riskRulesGenerated.value && !force) return;
  templateDraftRiskRules.value = buildRiskSuggestions(
    templateDraftCategory.value,
  );
  riskRulesGenerated.value = true;
  riskRulesGeneratedForType.value = templateDraftCategory.value.trim();
}

function requestRiskRegeneration() {
  Modal.confirm({
    autoFocusButton: 'cancel',
    wrapClassName: 'policy-light-modal',
    title: '重新生成风险处理建议？',
    content: '当前风险规则会被替换，AI 将根据最新项目类型和适用范围重新补充建议。',
    okText: '重新生成',
    cancelText: '取消',
    onOk() {
      generateRiskSuggestions(true);
      message.success('AI 已根据当前项目类型重新生成风险处理建议');
    },
  });
}

function addRiskRule() {
  templateDraftRiskRules.value.push({
    id: `draft-risk-manual-${Date.now()}`,
    name: '新风险场景',
    source: 'ai',
    applicableStages: '全部阶段',
    trigger: '',
    handling: '',
    escalation: '',
    owner: '项目经理',
    expanded: true,
  });
}

function syncRiskRuleExpanded(rule: TemplateRiskRule, event: Event) {
  rule.expanded = (event.currentTarget as HTMLDetailsElement).open;
}

function removeRiskRule(rule: TemplateRiskRule) {
  templateDraftRiskRules.value = templateDraftRiskRules.value.filter(
    (item) => item.id !== rule.id,
  );
  message.success(`已移除“${rule.name}”`);
}

function optimizeRiskRule(rule: TemplateRiskRule) {
  if (!rule.handling.includes('AI 先')) {
    rule.handling = `AI 先核实事实、影响范围和预计恢复时间；${rule.handling}`;
  }
  if (!rule.escalation.includes('持续未处理')) {
    rule.escalation = `${rule.escalation}；持续未处理时生成预警并通知项目经理。`;
  }
  message.success(`已优化“${rule.name}”的处理指引`);
}

function startGeneratedPolicyDraft() {
  if (generatedPolicyTimer) window.clearInterval(generatedPolicyTimer);
  generatedPolicyLoading.value = true;
  generatedPolicyProgress.value = 8;
  generatedPolicyTimer = window.setInterval(() => {
    generatedPolicyProgress.value = Math.min(
      100,
      generatedPolicyProgress.value + 7,
    );
    if (generatedPolicyProgress.value < 100) return;
    if (generatedPolicyTimer) window.clearInterval(generatedPolicyTimer);
    generatedPolicyTimer = undefined;
    generatedPolicyLoading.value = false;
    message.success('制度草案已根据模板规则生成');
  }, 160);
}

function openGeneratedPolicyDraft(template?: ProjectTemplate) {
  generatedPolicyContextName.value = template?.name || templateDraftName.value;
  generatedPolicyStageNames.value = (
    template?.stages || templateDraftStages.value
  ).map((stage) => stage.name);
  generatedPolicyRiskNames.value = template
    ? template.exceptionRules.map((rule) => rule.name)
    : templateDraftRiskRules.value.map((rule) => rule.name);
  generatedPolicyDrawerOpen.value = true;
  startGeneratedPolicyDraft();
}

function closeGeneratedPolicyDraft() {
  if (generatedPolicyTimer) window.clearInterval(generatedPolicyTimer);
  generatedPolicyTimer = undefined;
  generatedPolicyLoading.value = false;
  generatedPolicyDrawerOpen.value = false;
}

function downloadGeneratedPolicyDraft() {
  message.success(`演示文件“${generatedPolicyFileName.value}”已开始下载`);
}

function selectPageTab(tab: PageTab) {
  activePageTab.value = tab;
  void router.replace({ query: { ...route.query, view: tab } });
}

function selectTemplate(id: string) {
  selectedTemplateId.value = id;
  selectedStageId.value =
    templates.value.find((item) => item.id === id)?.stages[0]?.id ?? '';
  activeDetailTab.value = 'overview';
}

function openSource(id: string) {
  selectedSourceId.value = id;
  sourceDrawerOpen.value = true;
}

function createDraftVersion() {
  if (selectedTemplate.value.status === 'draft') {
    message.info('当前已经是可编辑草稿版本');
    activeDetailTab.value = 'stages';
    return;
  }
  selectedTemplate.value.status = 'draft';
  selectedTemplate.value.version =
    selectedTemplate.value.id === 'delivery'
      ? 'V2.4 草稿'
      : `${selectedTemplate.value.version} 草稿`;
  selectedTemplate.value.updatedAt = '刚刚';
  selectedTemplate.value.versions.unshift({
    version: selectedTemplate.value.version,
    date: '2026-09-05',
    author: '当前用户',
    status: '编辑中',
    note: '基于当前发布版创建，尚未影响任何项目。',
  });
  selectedStageId.value = selectedTemplate.value.stages[0]?.id ?? '';
  activeDetailTab.value = 'stages';
  message.success('已创建可编辑草稿，可修改阶段规则与成果物');
}

function saveDraftTemplateChanges() {
  if (selectedTemplate.value.status !== 'draft') return;

  const incompleteStage = selectedTemplate.value.stages.find(
    (stage) =>
      !stage.name.trim() ||
      !stage.ownerRole.trim() ||
      !stage.entryRule.trim() ||
      !stage.exitRule.trim(),
  );
  if (incompleteStage) {
    message.warning(`请完善“${incompleteStage.name || '未命名阶段'}”的基础规则`);
    return;
  }

  const incompleteDeliverable = selectedTemplate.value.stages
    .flatMap((stage) => stage.deliverables)
    .find(
      (deliverable) =>
        !deliverable.name.trim() ||
        !deliverable.format.trim() ||
        !deliverable.verifier.trim() ||
        !deliverable.acceptance.trim(),
    );
  if (incompleteDeliverable) {
    message.warning('请完善成果物名称、格式、验收人和验收标准');
    return;
  }

  selectedTemplate.value.updatedAt = '刚刚保存';
  if (selectedTemplate.value.versions[0]?.status === '编辑中') {
    selectedTemplate.value.versions[0].note =
      '阶段规则与成果物配置已更新，等待发布确认。';
  }
  message.success('草稿规则与成果物已保存');
}

function addSelectedStageDeliverable() {
  if (selectedTemplate.value.status !== 'draft') return;
  selectedStage.value.deliverables.push({
    name: '新成果物',
    format: 'Word / PDF',
    acceptance: '请填写成果物的验收标准与必备证据。',
    verifier: selectedStage.value.ownerRole || '项目经理',
  });
  selectedTemplate.value.updatedAt = '编辑中';
}

function removeSelectedStageDeliverable(index: number) {
  if (selectedTemplate.value.status !== 'draft') return;
  selectedStage.value.deliverables.splice(index, 1);
  selectedTemplate.value.updatedAt = '编辑中';
}

function publishTemplate() {
  selectedTemplate.value.version = selectedTemplate.value.version.replace(
    ' 草稿',
    '',
  );
  selectedTemplate.value.status = 'published';
  selectedTemplate.value.updatedAt = '刚刚发布';
  if (selectedTemplate.value.versions[0]) {
    selectedTemplate.value.versions.slice(1).forEach((version) => {
      if (version.status === '当前发布版') version.status = '历史发布版';
    });
    selectedTemplate.value.versions[0].version = selectedTemplate.value.version;
    selectedTemplate.value.versions[0].status = '当前发布版';
    selectedTemplate.value.versions[0].note =
      '发布到新项目立项，存量项目需单独迁移。';
  }
  publishModalOpen.value = false;
  message.success(
    `${selectedTemplate.value.name} ${selectedTemplate.value.version} 已发布，仅用于后续新项目`,
  );
}

function openTemplateCreation() {
  if (templateAnalysisTimer) window.clearInterval(templateAnalysisTimer);
  templateAnalysisTimer = undefined;
  templateAnalyzing.value = false;
  templateAnalysisProgress.value = 0;
  templateAnalysisStageIndex.value = 0;
  templateCreateMode.value = true;
  templateCreateStep.value = 'source';
  templateSourceName.value = '';
  templateRequirementText.value = '';
  templateDraftName.value = '标准交付项目模板';
  templateDraftCategory.value = '客户交付';
  templateDraftDepartment.value = '交付部';
  templateDraftScope.value = '适用于需要合同交付、阶段验收与客户签署的项目';
  templateRiskInstruction.value =
    '发现临期、延期、成果物缺失或验收异常时，先核实原因、当前进展和预计完成时间；优先给执行者生成可执行建议并创建待办。若影响阶段或项目交付基线，向项目经理建议发起变更申请；未经人工确认，不得自动修改基线、替代审批或直接要求加班。';
  templateDraftRiskRules.value = [];
  riskRulesGenerated.value = false;
  riskRulesGeneratedForType.value = '';
}

function closeTemplateCreation() {
  if (templateAnalysisTimer) window.clearInterval(templateAnalysisTimer);
  templateAnalysisTimer = undefined;
  templateAnalyzing.value = false;
  templateCreateMode.value = false;
  templateCreateStep.value = 'source';
}

const beforeTemplateSourceUpload: UploadProps['beforeUpload'] = (file) => {
  templateSourceName.value = file.name;
  message.success('资料已添加，下一步将由 AI 提取阶段与管理规则');
  return false;
};

function previousTemplateCreationStep() {
  if (templateAnalyzing.value) return;
  const previousStep = templateCreateSteps[templateCreateStepIndex.value - 1];
  if (previousStep) templateCreateStep.value = previousStep.key;
}

function removeTemplateDraftStage(stage: TemplateStage) {
  if (templateDraftStages.value.length <= 1) {
    message.warning('模板至少需要保留一个阶段');
    return;
  }
  Modal.confirm({
    autoFocusButton: 'cancel',
    wrapClassName: 'policy-light-modal',
    title: `删除“${stage.name || '未命名阶段'}”？`,
    content: '该阶段的门禁、提示词和成果物配置会从当前模板草稿中删除。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      templateDraftStages.value = templateDraftStages.value.filter(
        (item) => item.id !== stage.id,
      );
      message.success('阶段已从模板草稿中删除');
    },
  });
}

function createBlankTemplateStage(): TemplateStage {
  const createdAt = Date.now();
  return {
    id: `template-stage-${createdAt}-${Math.random().toString(36).slice(2, 7)}`,
    name: '新阶段',
    duration: '待设置',
    ownerRole: '项目经理',
    entryRule: '请填写进入本阶段前必须满足的条件。',
    exitRule: '请填写完成本阶段必须满足的条件。',
    objectivePrompt: '请配置 AI 拆分本阶段目标时应遵循的规则。',
    deliverablePrompt: '请配置 AI 生成本阶段成果物时应遵循的规则。',
    deliverables: [],
  };
}

function insertTemplateDraftStage(
  stage: TemplateStage,
  position: 'after' | 'before',
) {
  const currentIndex = templateDraftStages.value.findIndex(
    (item) => item.id === stage.id,
  );
  if (currentIndex < 0) return;
  const insertIndex = position === 'before' ? currentIndex : currentIndex + 1;
  templateDraftStages.value.splice(insertIndex, 0, createBlankTemplateStage());
  message.success(`已添加${position === 'before' ? '前置' : '后置'}阶段`);
}

function removeSelectedTemplateStage() {
  if (
    selectedTemplate.value.status !== 'draft' ||
    selectedTemplate.value.stages.length <= 1
  ) {
    message.warning('草稿模板至少需要保留一个阶段');
    return;
  }
  const stage = selectedStage.value;
  Modal.confirm({
    autoFocusButton: 'cancel',
    wrapClassName: 'policy-light-modal',
    title: `删除“${stage.name || '未命名阶段'}”？`,
    content: '保存后，该阶段及其门禁、提示词和成果物配置将不再属于此模板版本。',
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      selectedTemplate.value.stages = selectedTemplate.value.stages.filter(
        (item) => item.id !== stage.id,
      );
      selectedStageId.value = selectedTemplate.value.stages[0]?.id ?? '';
      selectedTemplate.value.updatedAt = '刚刚';
      message.success('阶段已从当前草稿版本中删除');
    },
  });
}

function insertSelectedTemplateStage(position: 'after' | 'before') {
  if (selectedTemplate.value.status !== 'draft') return;
  const currentIndex = selectedTemplate.value.stages.findIndex(
    (item) => item.id === selectedStage.value.id,
  );
  if (currentIndex < 0) return;
  const insertedStage = createBlankTemplateStage();
  const insertIndex = position === 'before' ? currentIndex : currentIndex + 1;
  selectedTemplate.value.stages.splice(insertIndex, 0, insertedStage);
  selectedStageId.value = insertedStage.id;
  selectedTemplate.value.updatedAt = '编辑中';
  message.success(`已添加${position === 'before' ? '前置' : '后置'}阶段`);
}

function publishCreatedTemplate() {
  const id = `created-template-${Date.now()}`;
  const sourceId = `${id}-source`;
  const sourceNote = templateSourceName.value
    ? `根据《${templateSourceName.value}》生成。`
    : '根据管理者粘贴的管理要求生成。';
  let sourceType: PolicySource['type'] = 'Manual';
  if (templateSourceName.value) {
    sourceType = templateSourceName.value.toLowerCase().endsWith('.pdf')
      ? 'PDF'
      : 'Word';
  }
  policySources.value.unshift({
    id: sourceId,
    name: templateSourceName.value || '管理要求（人工录入）',
    type: sourceType,
    version: 'V1.0',
    scope: templateDraftScope.value.trim(),
    owner: templateDraftDepartment.value.trim(),
    updatedAt: '2026-09-05',
    effectiveDate: '2026-09-05',
    status: 'confirmed',
    impactedTemplates: [templateDraftName.value.trim()],
    summary:
      templateRequirementText.value.trim() ||
      '新增模板时上传的管理依据，已由管理者确认并随模板 V1.0 发布。',
  });
  const createdTemplate: ProjectTemplate = {
    aiRiskInstruction: templateRiskInstruction.value.trim(),
    id,
    name: templateDraftName.value.trim(),
    version: 'V1.0',
    category: templateDraftCategory.value.trim(),
    department: templateDraftDepartment.value.trim(),
    scope: templateDraftScope.value.trim(),
    status: 'published',
    completeness: 92,
    updatedAt: '刚刚发布',
    policyIds: [sourceId],
    stages: templateDraftStages.value.map((stage) => ({
      ...stage,
      id: `${id}-${stage.id}`,
      deliverables: stage.deliverables.map((deliverable) => ({
        ...deliverable,
      })),
    })),
    exceptionRules: templateDraftRiskRules.value.map((rule) => ({
      id: rule.id,
      name: rule.name,
      source: rule.source,
      applicableStages: rule.applicableStages,
      trigger: rule.trigger,
      handling: rule.handling,
      escalation: rule.escalation,
      description: `${rule.trigger} ${rule.handling} ${rule.escalation}`,
      owner: rule.owner,
    })),
    versions: [
      {
        version: 'V1.0',
        date: '2026-09-05',
        author: '当前用户',
        status: '当前发布版',
        note: sourceNote,
      },
    ],
  };
  templates.value.unshift(createdTemplate);
  selectTemplate(id);
  activePageTab.value = 'templates';
  templateCreateMode.value = false;
  message.success(`${createdTemplate.name} V1.0 已发布，可用于新项目立项`);
}

function startTemplateSourceAnalysis() {
  if (templateAnalyzing.value) return;
  if (templateAnalysisTimer) window.clearInterval(templateAnalysisTimer);
  const duration = 12_000;
  const startedAt = Date.now();
  templateAnalyzing.value = true;
  templateAnalysisProgress.value = 5;
  templateAnalysisStageIndex.value = 0;
  templateAnalysisTimer = window.setInterval(() => {
    const ratio = Math.min(1, (Date.now() - startedAt) / duration);
    templateAnalysisProgress.value = Math.min(100, Math.round(5 + ratio * 95));
    templateAnalysisStageIndex.value = Math.min(
      templateAnalysisStages.length - 1,
      Math.floor(ratio * templateAnalysisStages.length),
    );
    if (ratio < 1) return;

    if (templateAnalysisTimer) window.clearInterval(templateAnalysisTimer);
    templateAnalysisTimer = undefined;
    templateAnalyzing.value = false;
    generateRiskSuggestions(true);
    templateCreateStep.value = 'basic';
    message.success('制度解析完成，已生成基本信息、阶段规则和风险处理指引草案');
  }, 100);
}

function nextTemplateCreationStep() {
  if (!canContinueTemplateCreation.value) return;
  if (templateCreateStep.value === 'source') {
    startTemplateSourceAnalysis();
    return;
  }
  const nextStep = templateCreateSteps[templateCreateStepIndex.value + 1];
  if (nextStep) {
    templateCreateStep.value = nextStep.key;
    if (nextStep.key === 'structure') {
      message.success('AI 已根据资料生成阶段、成果物与验收规则草案');
    }
    if (nextStep.key === 'risk') {
      if (
        !riskRulesGenerated.value ||
        riskRulesGeneratedForType.value !== templateDraftCategory.value.trim()
      ) {
        generateRiskSuggestions(true);
      }
      message.success('AI 已结合制度和项目类型补充风险处理建议');
    }
    return;
  }
  publishCreatedTemplate();
}

function openUpload() {
  resetUpload();
  uploadModalOpen.value = true;
}

function startPolicyAnalysis(fileName: string) {
  if (uploadTimer) window.clearInterval(uploadTimer);
  uploadFileName.value = fileName;
  uploadStep.value = 'parsing';
  uploadProgress.value = 8;
  uploadTimer = window.setInterval(() => {
    uploadProgress.value = Math.min(100, uploadProgress.value + 8);
    if (uploadProgress.value >= 100) {
      if (uploadTimer) window.clearInterval(uploadTimer);
      uploadTimer = undefined;
      uploadStep.value = 'review';
    }
  }, 120);
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  startPolicyAnalysis(file.name);
  return false;
};

function finishPolicyImport() {
  if (!policySources.value.some((item) => item.id === 'policy-supplement')) {
    policySources.value.unshift({
      id: 'policy-supplement',
      name: uploadFileName.value || '项目管理制度补充规定.docx',
      type: 'Word',
      version: 'V1.0',
      scope: '客户交付类项目',
      owner: 'PMO',
      updatedAt: '2026-09-05',
      effectiveDate: '2026-09-05',
      status: 'confirmed',
      impactedTemplates: ['标准交付模板'],
      summary: 'AI 已识别并由管理者确认 2 条规则变化，可作为模板配置依据。',
    });
  }
  uploadStep.value = 'done';
}

function finishPolicyUpload() {
  uploadModalOpen.value = false;
  selectPageTab('policies');
  message.success('制度文件与解析结果已保存');
}

function resetUpload() {
  if (uploadTimer) window.clearInterval(uploadTimer);
  uploadTimer = undefined;
  uploadStep.value = 'form';
  uploadProgress.value = 0;
  uploadFileName.value = '';
}

onBeforeUnmount(() => {
  if (uploadTimer) window.clearInterval(uploadTimer);
  if (templateAnalysisTimer) window.clearInterval(templateAnalysisTimer);
  if (generatedPolicyTimer) window.clearInterval(generatedPolicyTimer);
});
</script>

<template>
  <AiWorkPage
    class="policy-page-shell"
    icon="lucide:library-big"
    :title="templateCreateMode ? '新增项目模板' : '制度与模板'"
    :description="
      templateCreateMode
        ? '按步骤提供管理依据、确认阶段规则并发布模板，当前进度会自动保存。'
        : '管理项目模板与制度来源；新增模板进入独立引导流程。'
    "
  >
    <template #actions>
      <Button
        v-if="!templateCreateMode"
        class="policy-secondary-button"
        @click="versionModalOpen = true"
      >
        <Icon icon="lucide:history" />
        发布记录
      </Button>
      <Button
        v-if="!templateCreateMode"
        type="primary"
        class="policy-primary-button"
        @click="openTemplateCreation"
      >
        <Icon icon="lucide:plus" />
        新增项目模板
      </Button>
      <Button
        v-else
        class="policy-secondary-button"
        @click="closeTemplateCreation"
      >
        <Icon icon="lucide:arrow-left" />
        返回模板管理
      </Button>
    </template>

    <section v-if="templateCreateMode" class="template-create-flow">
      <nav class="create-step-navigation" aria-label="新增项目模板步骤">
        <button
          v-for="(step, index) in templateCreateSteps"
          :key="step.key"
          type="button"
          :disabled="templateAnalyzing || index > templateCreateStepIndex"
          :class="{
            'is-active': templateCreateStep === step.key,
            'is-complete': index < templateCreateStepIndex,
          }"
          :aria-current="templateCreateStep === step.key ? 'step' : undefined"
          @click="templateCreateStep = step.key"
        >
          <span><Icon :icon="step.icon" /></span>
          <div>
            <small>步骤 {{ index + 1 }}</small>
            <strong>{{ step.label }}</strong>
            <em>{{ step.description }}</em>
          </div>
        </button>
      </nav>

      <section v-if="templateCreateStep === 'source'" class="create-workspace">
        <header class="create-section-heading">
          <span>STEP 01</span>
          <h2>先告诉 AI 这类项目应该怎么管</h2>
          <p>
            上传制度、管理办法或要求资料，也可以直接粘贴管理要求；完成任意一种即可继续。
          </p>
        </header>
        <section
          v-if="templateAnalyzing"
          class="template-analysis-state"
          role="status"
          aria-live="polite"
          :aria-label="templateAnalysisStages[templateAnalysisStageIndex]?.label"
        >
          <header>
            <span class="analysis-state-icon">
              <Icon class="is-spinning" icon="lucide:loader-circle" />
            </span>
            <div>
              <small>AI 制度解析</small>
              <h3>{{ templateAnalysisStages[templateAnalysisStageIndex]?.label }}</h3>
              <p>
                {{ templateAnalysisStages[templateAnalysisStageIndex]?.description }}
              </p>
            </div>
            <strong>{{ templateAnalysisProgress }}%</strong>
          </header>
          <div class="template-analysis-progress">
            <Progress
              :percent="templateAnalysisProgress"
              :show-info="false"
              stroke-color="#0b6e65"
              trail-color="#dce8e4"
            />
          </div>
          <div class="template-analysis-steps">
            <div
              v-for="(analysisStage, index) in templateAnalysisStages"
              :key="analysisStage.label"
              :class="{
                'is-complete': index < templateAnalysisStageIndex,
                'is-current': index === templateAnalysisStageIndex,
              }"
            >
              <span>
                <Icon
                  :class="{ 'is-spinning': index === templateAnalysisStageIndex }"
                  :icon="
                    index < templateAnalysisStageIndex
                      ? 'lucide:check'
                      : index === templateAnalysisStageIndex
                        ? 'lucide:loader-circle'
                        : 'lucide:circle'
                  "
                />
              </span>
              <div>
                <strong>{{ analysisStage.label }}</strong>
                <small>{{ analysisStage.description }}</small>
              </div>
            </div>
          </div>
          <footer>
            <Icon icon="lucide:wand-sparkles" />
            完成后将自动进入基本设置，阶段规则与风险处理会在后续步骤分别确认。
          </footer>
        </section>
        <template v-else>
        <div class="source-choice-grid">
          <article :class="{ 'has-content': templateSourceName }">
            <span class="choice-icon"><Icon icon="lucide:file-up" /></span>
            <div>
              <small>方式一</small>
              <h3>上传制度或要求资料</h3>
              <p>支持制度、管理办法、SOP、Word 或 PDF 等资料。</p>
            </div>
            <Upload
              :before-upload="beforeTemplateSourceUpload"
              :show-upload-list="false"
              accept=".pdf,.doc,.docx,.txt"
            >
              <Button class="policy-secondary-button">
                <Icon icon="lucide:paperclip" />
                {{ templateSourceName || '选择资料' }}
              </Button>
            </Upload>
            <span v-if="templateSourceName" class="source-ready">
              <Icon icon="lucide:circle-check" />
              已就绪，下一步将自动解析
            </span>
          </article>
          <article :class="{ 'has-content': templateRequirementText.trim() }">
            <span class="choice-icon">
              <Icon icon="lucide:text-cursor-input" />
            </span>
            <div>
              <small>方式二</small>
              <h3>粘贴管理要求</h3>
              <p>适合制度还没成文，先把管理经验和执行要求表达出来。</p>
            </div>
            <label class="requirement-field">
              <span>管理要求</span>
              <textarea
                v-model="templateRequirementText"
                rows="7"
                placeholder="例如：客户交付项目分为需求、方案、实施、试运行和验收阶段；每阶段必须有明确成果物、验收人和异常升级规则……"
              ></textarea>
            </label>
          </article>
        </div>
        <aside class="create-tip">
          <Icon icon="lucide:sparkles" />
          <div>
            <strong>AI 会先生成草案，不会直接发布</strong>
            <span>
              阶段、成果物、准入准出和异常规则都需要管理者在后续步骤中确认。
            </span>
          </div>
        </aside>
        </template>
      </section>

      <section
        v-else-if="templateCreateStep === 'basic'"
        class="create-workspace"
      >
        <header class="create-section-heading">
          <span>STEP 02</span>
          <h2>定义模板的名称和适用边界</h2>
          <p>这些信息帮助立项人快速判断应该选择哪个模板。</p>
        </header>
        <div class="create-form-grid">
          <label>
            <span>模板名称</span>
            <Input
              v-model:value="templateDraftName"
              placeholder="请输入模板名称"
            />
          </label>
          <label>
            <span>项目类型</span>
            <Input
              v-model:value="templateDraftCategory"
              placeholder="例如：客户交付"
            />
          </label>
          <label>
            <span>归属部门</span>
            <Input
              v-model:value="templateDraftDepartment"
              placeholder="例如：交付部"
            />
          </label>
          <label class="is-wide">
            <span>适用范围</span>
            <Input
              v-model:value="templateDraftScope"
              placeholder="说明适用的项目范围、金额或复杂度"
            />
          </label>
        </div>
        <aside class="source-summary">
          <span><Icon icon="lucide:quote" /></span>
          <div>
            <strong>本次生成依据</strong>
            <p v-if="templateSourceName">{{ templateSourceName }}</p>
            <p v-else>{{ templateRequirementText }}</p>
          </div>
        </aside>
      </section>

      <section
        v-else-if="templateCreateStep === 'structure'"
        class="create-workspace structure-workspace"
      >
        <header class="create-section-heading is-horizontal">
          <div>
            <span>STEP 03</span>
            <h2>确认 AI 生成的阶段与执行规则</h2>
            <p>
              可编辑阶段名称、负责人、准入准出，并用提示词控制目标拆分和成果物生成。
            </p>
          </div>
          <span class="ai-generated-chip">
            <Icon icon="lucide:sparkles" />
            AI 已生成 {{ templateDraftStages.length }} 个阶段
          </span>
        </header>
        <div class="generated-stage-list">
          <article
            v-for="(stage, index) in templateDraftStages"
            :key="stage.id"
          >
            <span class="stage-index">
              {{ String(index + 1).padStart(2, '0') }}
            </span>
            <div class="stage-card-body">
              <header class="stage-card-heading">
                <div>
                  <strong>{{ stage.name || '未命名阶段' }}</strong>
                  <small>
                    {{ stage.deliverables.length }} 项成果物 ·
                    {{ stage.deliverables[0]?.name || '等待 AI 生成' }}
                  </small>
                </div>
                <div class="stage-card-actions">
                  <Dropdown :trigger="['click']" placement="bottomRight">
                    <Button
                      size="small"
                      class="stage-insert-button"
                      :aria-label="`在${stage.name || '当前阶段'}前后添加阶段`"
                      title="添加阶段"
                    >
                      <Icon icon="lucide:plus" />
                    </Button>
                    <template #overlay>
                      <div class="stage-insert-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          @click="insertTemplateDraftStage(stage, 'before')"
                        >
                          <Icon icon="lucide:arrow-up-to-line" />
                          前置阶段
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          @click="insertTemplateDraftStage(stage, 'after')"
                        >
                          <Icon icon="lucide:arrow-down-to-line" />
                          后置阶段
                        </button>
                      </div>
                    </template>
                  </Dropdown>
                  <Button
                    danger
                    size="small"
                    class="stage-remove-button"
                    :disabled="templateDraftStages.length <= 1"
                    @click="removeTemplateDraftStage(stage)"
                  >
                    <Icon icon="lucide:trash-2" />
                    删除
                  </Button>
                </div>
              </header>
              <div class="stage-core-grid">
                <label>
                  <span>阶段名称</span>
                  <Input
                    v-model:value="stage.name"
                    placeholder="请输入阶段名称"
                  />
                </label>
                <label>
                  <span>参考周期</span>
                  <Input
                    v-model:value="stage.duration"
                    placeholder="例如：5 个工作日"
                  />
                </label>
                <label>
                  <span>负责人角色</span>
                  <Input
                    v-model:value="stage.ownerRole"
                    placeholder="例如：项目经理"
                  />
                </label>
              </div>
              <div class="stage-rule-grid">
                <label>
                  <span>
                    <Icon icon="lucide:log-in" />
                    准入条件
                  </span>
                  <Input.TextArea
                    v-model:value="stage.entryRule"
                    :rows="3"
                    placeholder="说明进入本阶段前必须满足的条件"
                  />
                </label>
                <label>
                  <span>
                    <Icon icon="lucide:log-out" />
                    准出条件
                  </span>
                  <Input.TextArea
                    v-model:value="stage.exitRule"
                    :rows="3"
                    placeholder="说明本阶段完成和进入下一阶段的标准"
                  />
                </label>
              </div>
              <div class="stage-prompt-grid">
                <label>
                  <span>
                    <Icon icon="lucide:target" />
                    目标拆分提示词
                  </span>
                  <small>控制 AI 如何把项目目标拆到本阶段。</small>
                  <Input.TextArea
                    v-model:value="stage.objectivePrompt"
                    :rows="3"
                    placeholder="例如：按范围、责任角色和完成证据拆分阶段目标……"
                  />
                </label>
                <label>
                  <span>
                    <Icon icon="lucide:package-check" />
                    成果物说明提示词
                  </span>
                  <small>控制成果物名称、格式、验收标准和验收角色。</small>
                  <Input.TextArea
                    v-model:value="stage.deliverablePrompt"
                    :rows="3"
                    placeholder="例如：生成可验收成果物，并明确格式与验收证据……"
                  />
                </label>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        v-else-if="templateCreateStep === 'risk'"
        class="create-workspace risk-workspace"
      >
        <header class="create-section-heading is-horizontal">
          <div>
            <span>STEP 04</span>
            <h2>确认风险与异常处理规则</h2>
            <p>
              制度不完整时，AI 会根据项目类型补充常见风险建议；所有建议都可编辑或移除。
            </p>
          </div>
          <span class="ai-generated-chip">
            <Icon icon="lucide:sparkles" />
            {{ templateDraftRiskRules.length }} 条规则 ·
            {{ aiSuggestedRiskCount }} 条 AI 建议
          </span>
        </header>
        <article class="ai-risk-instruction-card">
          <header>
            <span><Icon icon="lucide:shield-alert" /></span>
            <div>
              <strong>AI 总体处理原则</strong>
              <small>定义 AI 可以做什么，以及哪些操作必须由人确认</small>
            </div>
            <em>需人工确认</em>
          </header>
          <Input.TextArea
            v-model:value="templateRiskInstruction"
            :rows="4"
            placeholder="说明 AI 如何识别、提醒、创建待办、建议升级，以及哪些操作必须由人工确认"
          />
          <p>
            AI 可以提醒、追问、生成处理建议和申请草稿；项目基线修改、审批与加班决定始终由人确认。
          </p>
        </article>
        <aside class="risk-suggestion-note">
          <span><Icon icon="lucide:bot" /></span>
          <div>
            <strong>AI 已补充制度未明确的常见风险</strong>
            <p>
              当前项目类型为“{{ templateDraftCategory }}”。淡紫色为 AI
              建议，绿色为制度原文提取；建议不是制度事实，发布前需要人工确认。
            </p>
          </div>
          <Button
            class="policy-secondary-button"
            @click="requestRiskRegeneration"
          >
            <Icon icon="lucide:refresh-cw" />
            重新生成建议
          </Button>
        </aside>
        <div class="risk-rule-list">
          <details
            v-for="(rule, index) in templateDraftRiskRules"
            :key="rule.id"
            class="risk-rule-card"
            :open="rule.expanded"
            @toggle="syncRiskRuleExpanded(rule, $event)"
          >
            <summary>
              <span class="risk-rule-index">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <span class="risk-rule-summary">
                <strong>{{ rule.name }}</strong>
                <small>{{ rule.applicableStages }} · {{ rule.owner }}</small>
              </span>
              <Tag :color="rule.source === 'policy' ? 'green' : 'purple'">
                {{ rule.source === 'policy' ? '制度提取' : 'AI 建议' }}
              </Tag>
              <Icon class="risk-rule-chevron" icon="lucide:chevron-down" />
            </summary>
            <div class="risk-rule-editor">
              <header>
                <label>
                  <span>风险名称</span>
                  <Input v-model:value="rule.name" aria-label="风险名称" />
                </label>
                <div>
                  <Button
                    size="small"
                    class="risk-optimize-button"
                    @click="optimizeRiskRule(rule)"
                  >
                    <Icon icon="lucide:wand-sparkles" />
                    AI 优化
                  </Button>
                  <Button
                    danger
                    size="small"
                    class="risk-remove-button"
                    aria-label="移除风险规则"
                    @click="removeRiskRule(rule)"
                  >
                    <Icon icon="lucide:trash-2" />
                    移除
                  </Button>
                </div>
              </header>
              <div class="risk-rule-meta">
                <label>
                  <span>适用阶段</span>
                  <Input v-model:value="rule.applicableStages" />
                </label>
                <label>
                  <span>负责/升级角色</span>
                  <Input v-model:value="rule.owner" />
                </label>
              </div>
              <div class="risk-rule-content">
                <label>
                  <span>触发条件</span>
                  <Input.TextArea v-model:value="rule.trigger" :rows="2" />
                </label>
                <label>
                  <span>AI 处理动作</span>
                  <Input.TextArea v-model:value="rule.handling" :rows="2" />
                </label>
                <label>
                  <span>升级与人工确认</span>
                  <Input.TextArea v-model:value="rule.escalation" :rows="2" />
                </label>
              </div>
            </div>
          </details>
        </div>
        <Button class="add-risk-rule-button" @click="addRiskRule">
          <Icon icon="lucide:plus" />
          新增风险场景
        </Button>
      </section>

      <section v-else class="create-workspace">
        <header class="create-section-heading">
          <span>STEP 05</span>
          <h2>预览模板并确认发布</h2>
          <p>发布后可用于后续新项目立项；存量项目不会被自动修改。</p>
        </header>
        <div class="template-review-hero">
          <span><Icon icon="lucide:badge-check" /></span>
          <div>
            <small>PROJECT TEMPLATE · V1.0</small>
            <h3>{{ templateDraftName }}</h3>
            <p>{{ templateDraftScope }}</p>
          </div>
          <div class="review-meta">
            <span>{{ templateDraftCategory }}</span>
            <span>{{ templateDraftDepartment }}</span>
          </div>
        </div>
        <div class="review-stat-grid">
          <article>
            <strong>{{ templateDraftStages.length }}</strong>
            <span>项目阶段</span>
          </article>
          <article>
            <strong>{{ templateDeliverableCount }}</strong>
            <span>成果物标准</span>
          </article>
          <article>
            <strong>{{ templateDraftRiskRules.length }}</strong>
            <span>异常处理规则</span>
          </article>
          <article>
            <strong>92%</strong>
            <span>规则完整度</span>
          </article>
        </div>
        <div class="review-stage-flow">
          <article
            v-for="(stage, index) in templateDraftStages"
            :key="stage.id"
          >
            <span>{{ index + 1 }}</span>
            <div>
              <strong>{{ stage.name }}</strong>
              <small>{{ stage.ownerRole }} · {{ stage.duration }}</small>
            </div>
          </article>
        </div>
        <article class="policy-regeneration-card">
          <span><Icon icon="lucide:file-output" /></span>
          <div>
            <strong>模板规则已经可以反向生成制度草案</strong>
            <p>
              AI 会把阶段、准入准出、成果物和风险处理规则整理为制度章节，供管理者下载前继续修订。
            </p>
          </div>
          <Button
            class="policy-secondary-button"
            @click="openGeneratedPolicyDraft()"
          >
            <Icon icon="lucide:wand-sparkles" />
            生成制度草案
          </Button>
        </article>
        <aside class="publish-boundary-note">
          <Icon icon="lucide:shield-check" />
          <div>
            <strong>发布边界已确认</strong>
            <span>
              模板发布后仅对新建立项可选；后续修改将创建新版本并保留完整记录。
            </span>
          </div>
        </aside>
      </section>

      <footer class="create-flow-footer">
        <span>
          <Icon icon="lucide:cloud-check" />
          草稿已自动保存
        </span>
        <div>
          <Button
            class="policy-secondary-button"
            :disabled="templateAnalyzing || templateCreateStepIndex === 0"
            @click="previousTemplateCreationStep"
          >
            <Icon icon="lucide:arrow-left" />
            上一步
          </Button>
          <Button
            type="primary"
            class="policy-primary-button"
            :loading="templateAnalyzing"
            :disabled="templateAnalyzing || !canContinueTemplateCreation"
            @click="nextTemplateCreationStep"
          >
            {{ templateCreateNextLabel }}
            <Icon icon="lucide:arrow-right" />
          </Button>
        </div>
      </footer>
    </section>

    <div v-else class="policy-hub">
      <nav class="page-tabs" role="tablist" aria-label="制度与模板功能">
        <button
          v-for="tabItem in pageTabs"
          :key="tabItem.key"
          type="button"
          role="tab"
          :aria-selected="activePageTab === tabItem.key"
          :class="{ 'is-active': activePageTab === tabItem.key }"
          @click="selectPageTab(tabItem.key)"
        >
          <span><Icon :icon="tabItem.icon" /></span>
          <span>
            <strong>{{ tabItem.label }}</strong>
            <small>{{ tabItem.description }}</small>
          </span>
        </button>
      </nav>

      <section v-if="activePageTab === 'templates'" class="template-workbench">
        <aside class="template-list" aria-label="项目模板列表">
          <header>
            <div>
              <span>PROJECT TEMPLATES</span>
              <h2>项目模板</h2>
            </div>
            <b>{{ templates.length }}</b>
          </header>
          <div class="template-list__items">
            <button
              v-for="templateItem in templates"
              :key="templateItem.id"
              type="button"
              :class="{ 'is-active': selectedTemplate.id === templateItem.id }"
              @click="selectTemplate(templateItem.id)"
            >
              <span class="template-icon">
                <Icon
                  :icon="
                    templateItem.id === 'delivery'
                      ? 'lucide:truck'
                      : templateItem.id === 'development'
                        ? 'lucide:code-xml'
                        : 'lucide:handshake'
                  "
                />
              </span>
              <span class="template-copy">
                <strong>{{ templateItem.name }}</strong>
                <small>
                  {{ templateItem.version }} ·
                  {{ templateItem.stages.length }} 个阶段
                </small>
              </span>
              <Tag :color="templateStatus(templateItem.status).color">
                {{ templateStatus(templateItem.status).label }}
              </Tag>
            </button>
          </div>
          <footer>
            <Icon icon="lucide:shield-check" />
            <span>模板必须有制度来源。已发布版本只能通过新草稿修改。</span>
          </footer>
        </aside>

        <section class="template-detail">
          <header class="template-detail__header">
            <div>
              <div class="title-row">
                <h2>{{ selectedTemplate.name }}</h2>
                <Tag :color="templateStatus(selectedTemplate.status).color">
                  {{ templateStatus(selectedTemplate.status).label }}
                </Tag>
                <span class="version-chip">{{ selectedTemplate.version }}</span>
              </div>
              <p>{{ selectedTemplate.scope }}</p>
            </div>
            <div class="detail-actions">
              <Button
                class="policy-secondary-button"
                @click="openGeneratedPolicyDraft(selectedTemplate)"
              >
                <Icon icon="lucide:file-output" />
                生成制度草案
              </Button>
              <Button
                class="policy-secondary-button"
                @click="versionModalOpen = true"
              >
                <Icon icon="lucide:git-compare-arrows" />
                比较版本
              </Button>
              <Button
                v-if="selectedTemplate.status === 'draft'"
                type="primary"
                class="policy-primary-button"
                @click="publishModalOpen = true"
              >
                <Icon icon="lucide:send" />
                发布模板
              </Button>
              <Button
                v-else
                type="primary"
                class="policy-primary-button"
                @click="createDraftVersion"
              >
                <Icon icon="lucide:file-plus-2" />
                创建新版本
              </Button>
            </div>
          </header>

          <nav class="detail-tabs" aria-label="模板详情">
            <button
              v-for="tabItem in detailTabs"
              :key="tabItem.key"
              type="button"
              :class="{ 'is-active': activeDetailTab === tabItem.key }"
              @click="activeDetailTab = tabItem.key"
            >
              {{ tabItem.label }}
            </button>
          </nav>

          <div
            v-if="activeDetailTab === 'overview'"
            class="detail-panel overview-panel"
          >
            <article class="template-summary-card">
              <header>
                <div>
                  <span>模板概况</span>
                  <h3>发布与适用信息</h3>
                </div>
                <Icon icon="lucide:layout-template" />
              </header>
              <dl>
                <div>
                  <dt>项目类型</dt>
                  <dd>{{ selectedTemplate.category }}</dd>
                </div>
                <div>
                  <dt>维护部门</dt>
                  <dd>{{ selectedTemplate.department }}</dd>
                </div>
                <div>
                  <dt>阶段数量</dt>
                  <dd>{{ selectedTemplate.stages.length }} 个</dd>
                </div>
                <div>
                  <dt>最后更新</dt>
                  <dd>{{ selectedTemplate.updatedAt }}</dd>
                </div>
              </dl>
            </article>
            <article class="completeness-card">
              <header>
                <div>
                  <span>规则完整度</span>
                  <h3>{{ selectedTemplate.completeness }}%</h3>
                </div>
                <Tag
                  :color="
                    selectedTemplate.completeness >= 90
                      ? 'green'
                      : selectedTemplate.completeness >= 80
                        ? 'orange'
                        : 'red'
                  "
                >
                  {{
                    selectedTemplate.completeness >= 90 ? '可发布' : '需补全'
                  }}
                </Tag>
              </header>
              <Progress
                :percent="selectedTemplate.completeness"
                :show-info="false"
                stroke-color="#0b806f"
                trail-color="#e6efec"
              />
              <p>
                已检查阶段门禁、成果物、验收责任和异常流程。AI
                检查结果仅作为人工审核辅助。
              </p>
            </article>
            <article class="source-card">
              <header>
                <div>
                  <span>制度来源</span>
                  <h3>{{ selectedTemplate.policyIds.length }} 份有效制度</h3>
                </div>
                <Icon icon="lucide:quote" />
              </header>
              <div class="source-list">
                <button
                  v-for="sourceId in selectedTemplate.policyIds"
                  :key="sourceId"
                  type="button"
                  @click="openSource(sourceId)"
                >
                  <span><Icon icon="lucide:file-text" /></span>
                  <span>
                    <strong>
                      {{
                        policySources.find((item) => item.id === sourceId)?.name
                      }}
                    </strong>
                    <small>
                      {{
                        policySources.find((item) => item.id === sourceId)
                          ?.version
                      }}
                      · 点击查看引用与影响
                    </small>
                  </span>
                  <Icon icon="lucide:chevron-right" />
                </button>
              </div>
            </article>
            <article class="governance-note">
              <span><Icon icon="lucide:info" /></span>
              <div>
                <strong>版本影响规则</strong>
                <p>
                  新发布模板默认只用于之后发起的项目。存量项目若需升级，必须在“项目治理”中单独发起基线变更。
                </p>
              </div>
            </article>
          </div>

          <div
            v-else-if="activeDetailTab === 'stages'"
            class="detail-panel stages-panel"
          >
            <aside class="stage-list" aria-label="模板阶段">
              <button
                v-for="(stageItem, index) in selectedTemplate.stages"
                :key="stageItem.id"
                type="button"
                :class="{ 'is-active': selectedStage.id === stageItem.id }"
                @click="selectedStageId = stageItem.id"
              >
                <span>{{ String(index + 1).padStart(2, '0') }}</span>
                <span>
                  <strong>{{ stageItem.name }}</strong>
                  <small>
                    {{ stageItem.duration }} · {{ stageItem.ownerRole }}
                  </small>
                </span>
                <Icon icon="lucide:chevron-right" />
              </button>
            </aside>
            <section class="stage-detail">
              <header>
                <div>
                  <span>STAGE RULES</span>
                  <h3>{{ selectedStage.name }}</h3>
                  <p>
                    {{ selectedStage.duration }} · 默认责任角色：{{
                      selectedStage.ownerRole
                    }}
                  </p>
                </div>
                <div
                  v-if="selectedTemplate.status === 'draft'"
                  class="stage-editor-actions"
                >
                  <Dropdown :trigger="['click']" placement="bottomRight">
                    <Button
                      class="policy-secondary-button stage-insert-button"
                      :aria-label="`在${selectedStage.name || '当前阶段'}前后添加阶段`"
                    >
                      <Icon icon="lucide:plus" />
                    </Button>
                    <template #overlay>
                      <div class="stage-insert-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          @click="insertSelectedTemplateStage('before')"
                        >
                          <Icon icon="lucide:arrow-up-to-line" />
                          前置阶段
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          @click="insertSelectedTemplateStage('after')"
                        >
                          <Icon icon="lucide:arrow-down-to-line" />
                          后置阶段
                        </button>
                      </div>
                    </template>
                  </Dropdown>
                  <Button
                    class="policy-secondary-button stage-remove-button"
                    :disabled="selectedTemplate.stages.length <= 1"
                    @click="removeSelectedTemplateStage"
                  >
                    <Icon icon="lucide:trash-2" />
                    删除
                  </Button>
                  <Button
                    type="primary"
                    class="policy-primary-button"
                    @click="saveDraftTemplateChanges"
                  >
                    <Icon icon="lucide:save" />
                    保存修改
                  </Button>
                </div>
              </header>
              <div
                v-if="selectedTemplate.status === 'draft'"
                class="stage-detail-editor"
              >
                <div class="draft-edit-notice">
                  <Icon icon="lucide:pencil-line" />
                  <span>
                    当前为草稿编辑模式，阶段规则和成果物可直接修改，发布前不会影响现有项目。
                  </span>
                </div>
                <div class="stage-core-grid">
                  <label>
                    <span>阶段名称</span>
                    <Input v-model:value="selectedStage.name" />
                  </label>
                  <label>
                    <span>参考周期</span>
                    <Input v-model:value="selectedStage.duration" />
                  </label>
                  <label>
                    <span>负责人角色</span>
                    <Input v-model:value="selectedStage.ownerRole" />
                  </label>
                </div>
                <div class="stage-rule-grid">
                  <label>
                    <span>
                      <Icon icon="lucide:log-in" />
                      准入条件
                    </span>
                    <Input.TextArea
                      v-model:value="selectedStage.entryRule"
                      :rows="3"
                    />
                  </label>
                  <label>
                    <span>
                      <Icon icon="lucide:log-out" />
                      准出条件
                    </span>
                    <Input.TextArea
                      v-model:value="selectedStage.exitRule"
                      :rows="3"
                    />
                  </label>
                </div>
                <div class="stage-prompt-grid">
                  <label>
                    <span>
                      <Icon icon="lucide:target" />
                      目标拆分提示词
                    </span>
                    <small>控制 AI 如何把项目目标拆到本阶段。</small>
                    <Input.TextArea
                      v-model:value="selectedStage.objectivePrompt"
                      :rows="3"
                      placeholder="输入本阶段的目标拆分逻辑"
                    />
                  </label>
                  <label>
                    <span>
                      <Icon icon="lucide:package-check" />
                      成果物说明提示词
                    </span>
                    <small>控制成果物说明、格式、验收标准和验收角色。</small>
                    <Input.TextArea
                      v-model:value="selectedStage.deliverablePrompt"
                      :rows="3"
                      placeholder="输入本阶段的成果物生成说明"
                    />
                  </label>
                </div>
              </div>
              <div v-else class="gate-grid">
                <article>
                  <span class="gate-icon is-entry">
                    <Icon icon="lucide:log-in" />
                  </span>
                  <div>
                    <strong>准入条件</strong>
                    <p>{{ selectedStage.entryRule }}</p>
                  </div>
                </article>
                <article>
                  <span class="gate-icon is-exit">
                    <Icon icon="lucide:badge-check" />
                  </span>
                  <div>
                    <strong>准出条件</strong>
                    <p>{{ selectedStage.exitRule }}</p>
                  </div>
                </article>
              </div>
              <div
                v-if="selectedTemplate.status !== 'draft'"
                class="prompt-rule-panel"
              >
                <article>
                  <span><Icon icon="lucide:target" /></span>
                  <div>
                    <strong>目标拆分逻辑</strong>
                    <p>
                      {{
                        selectedStage.objectivePrompt ||
                        '按阶段范围、责任角色、完成标准和计划日期拆分可验证目标。'
                      }}
                    </p>
                  </div>
                </article>
                <article>
                  <span><Icon icon="lucide:package-check" /></span>
                  <div>
                    <strong>成果物生成说明</strong>
                    <p>
                      {{
                        selectedStage.deliverablePrompt ||
                        '根据阶段目标生成成果物，并明确格式、验收标准和验收责任人。'
                      }}
                    </p>
                  </div>
                </article>
              </div>
              <div class="deliverable-heading">
                <div>
                  <span>DELIVERABLE STANDARDS</span>
                  <h3>成果物与验收标准</h3>
                </div>
                <div class="deliverable-heading-actions">
                  <b>{{ selectedStage.deliverables.length }}</b>
                  <Button
                    v-if="selectedTemplate.status === 'draft'"
                    class="policy-secondary-button"
                    @click="addSelectedStageDeliverable"
                  >
                    <Icon icon="lucide:plus" />
                    新增成果物
                  </Button>
                </div>
              </div>
              <div class="deliverable-list">
                <template
                  v-for="(deliverable, index) in selectedStage.deliverables"
                  :key="`${selectedStage.id}-deliverable-${index}`"
                >
                  <article
                    v-if="selectedTemplate.status === 'draft'"
                    class="deliverable-edit-card"
                  >
                    <div class="deliverable-edit-grid">
                      <label>
                        <span>成果物名称</span>
                        <Input v-model:value="deliverable.name" />
                      </label>
                      <label>
                        <span>文件格式</span>
                        <Input v-model:value="deliverable.format" />
                      </label>
                      <label>
                        <span>验收人</span>
                        <Input v-model:value="deliverable.verifier" />
                      </label>
                      <Button
                        class="deliverable-remove-button"
                        aria-label="移除成果物"
                        title="移除成果物"
                        @click="removeSelectedStageDeliverable(index)"
                      >
                        <Icon icon="lucide:trash-2" />
                      </Button>
                    </div>
                    <label class="deliverable-acceptance-field">
                      <span>验收标准与必备证据</span>
                      <Input.TextArea
                        v-model:value="deliverable.acceptance"
                        :rows="2"
                      />
                    </label>
                  </article>
                  <article v-else>
                    <header>
                      <span><Icon icon="lucide:package-check" /></span>
                      <div>
                        <strong>{{ deliverable.name }}</strong>
                        <small>{{ deliverable.format }}</small>
                      </div>
                      <Tag color="blue">
                        验收人：{{ deliverable.verifier }}
                      </Tag>
                    </header>
                    <p>{{ deliverable.acceptance }}</p>
                  </article>
                </template>
                <div
                  v-if="
                    selectedTemplate.status === 'draft' &&
                    selectedStage.deliverables.length === 0
                  "
                  class="deliverable-empty-edit"
                >
                  <Icon icon="lucide:package-plus" />
                  <span>当前阶段还没有成果物，请点击“新增成果物”进行配置。</span>
                </div>
              </div>
              <div
                v-if="selectedTemplate.status !== 'draft'"
                class="locked-note"
              >
                <Icon icon="lucide:lock-keyhole" />
                <span>
                  当前为非草稿版本。如需修改阶段或成果物规则，请先创建新版本。
                </span>
              </div>
            </section>
          </div>

          <div
            v-else-if="activeDetailTab === 'exceptions'"
            class="detail-panel exceptions-panel"
          >
            <header class="section-heading">
              <div>
                <span>EXCEPTION GOVERNANCE</span>
                <h3>异常、变更与容缺规则</h3>
                <p>模板必须同时覆盖正常执行流和异常处理闭环。</p>
              </div>
              <Tag
                :color="
                  selectedTemplate.exceptionRules.length >= 3
                    ? 'green'
                    : 'orange'
                "
              >
                {{ selectedTemplate.exceptionRules.length }} 类规则
              </Tag>
            </header>
            <article class="ai-risk-governance-card">
              <header>
                <span><Icon icon="lucide:brain-circuit" /></span>
                <div>
                  <strong>AI 风险与异常处理指引</strong>
                  <small>规定 AI 如何判断、提醒、建待办和建议升级</small>
                </div>
              </header>
              <Input.TextArea
                v-if="selectedTemplate.status === 'draft'"
                v-model:value="selectedTemplate.aiRiskInstruction"
                :rows="4"
                placeholder="说明 AI 的判断依据、处理顺序、升级条件和权限边界"
              />
              <p v-else>
                {{
                  selectedTemplate.aiRiskInstruction ||
                  '发现风险后先核实原因和预计完成时间，生成处理建议并创建待办；涉及基线、审批与加班决定时必须由人工确认。'
                }}
              </p>
            </article>
            <div class="exception-list">
              <article
                v-for="(ruleItem, index) in selectedTemplate.exceptionRules"
                :key="ruleItem.name"
              >
                <span class="exception-number">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <div>
                  <header class="exception-rule-heading">
                    <strong>{{ ruleItem.name }}</strong>
                    <Tag :color="ruleItem.source === 'ai' ? 'purple' : 'green'">
                      {{ ruleItem.source === 'ai' ? 'AI 建议' : '制度规则' }}
                    </Tag>
                  </header>
                  <p>{{ ruleItem.description }}</p>
                  <small>
                    <Icon icon="lucide:user-round-check" />
                    {{ ruleItem.applicableStages || '全部阶段' }} · 批准/负责角色：{{
                      ruleItem.owner
                    }}
                  </small>
                </div>
                <Button
                  class="policy-secondary-button"
                  :disabled="selectedTemplate.status !== 'draft'"
                >
                  编辑
                </Button>
              </article>
            </div>
          </div>

          <div v-else class="detail-panel versions-panel">
            <header class="section-heading">
              <div>
                <span>VERSION HISTORY</span>
                <h3>版本记录</h3>
                <p>发布版本不可原地修改，每次变化都保留原因和责任人。</p>
              </div>
              <Button
                class="policy-secondary-button"
                @click="versionModalOpen = true"
              >
                <Icon icon="lucide:git-compare-arrows" />
                比较版本
              </Button>
            </header>
            <div class="version-list">
              <article
                v-for="(versionItem, index) in selectedTemplate.versions"
                :key="`${versionItem.version}-${index}`"
              >
                <span
                  class="version-dot"
                  :class="{ 'is-current': index === 0 }"
                >
                  <Icon
                    :icon="
                      index === 0 ? 'lucide:circle-check' : 'lucide:history'
                    "
                  />
                </span>
                <div>
                  <header>
                    <strong>{{ versionItem.version }}</strong>
                    <Tag :color="index === 0 ? 'green' : 'default'">
                      {{ versionItem.status }}
                    </Tag>
                  </header>
                  <p>{{ versionItem.note }}</p>
                  <small>
                    {{ versionItem.date }} · {{ versionItem.author }}
                  </small>
                </div>
              </article>
            </div>
          </div>
        </section>
      </section>

      <section v-else class="policy-workspace">
        <header class="policy-header">
          <div>
            <span>POLICY SOURCES</span>
            <h2>制度文件与解析记录</h2>
            <p>
              制度文件是模板规则的正式来源；每次更新都生成差异，不直接覆盖已发布模板。
            </p>
          </div>
          <Button
            type="primary"
            class="policy-primary-button"
            @click="openUpload"
          >
            <Icon icon="lucide:file-up" />
            上传新制度
          </Button>
        </header>
        <div class="policy-file-list">
          <article v-for="source in policySources" :key="source.id">
            <span class="file-icon">
              <Icon
                :icon="
                  source.type === 'PDF'
                    ? 'lucide:file-text'
                    : source.type === 'Manual'
                      ? 'lucide:clipboard-pen-line'
                      : 'lucide:file-type-2'
                "
              />
            </span>
            <div class="file-main">
              <header>
                <strong>{{ source.name }}</strong>
                <Tag
                  :color="source.status === 'confirmed' ? 'green' : 'orange'"
                >
                  {{ source.status === 'confirmed' ? '已确认' : '待确认' }}
                </Tag>
              </header>
              <p>{{ source.summary }}</p>
              <div>
                <span>{{ source.version }}</span>
                <span>{{ source.scope }}</span>
                <span>{{ source.owner }}</span>
              </div>
            </div>
            <div class="file-impact">
              <span>影响模板</span>
              <strong>{{ source.impactedTemplates.length }}</strong>
              <small>{{ source.updatedAt }} 更新</small>
            </div>
            <Button
              class="policy-secondary-button"
              @click="openSource(source.id)"
            >
              <Icon icon="lucide:eye" />
              查看解析结果
            </Button>
          </article>
        </div>
      </section>
    </div>
  </AiWorkPage>

  <Drawer
    v-model:open="sourceDrawerOpen"
    width="560px"
    placement="right"
    root-class-name="policy-light-drawer"
    :destroy-on-close="false"
  >
    <template #title>
      <div class="overlay-title">
        <span><Icon icon="lucide:file-search" /></span>
        <div>
          <strong>制度来源与引用</strong>
          <small>查看原文依据和模板影响</small>
        </div>
      </div>
    </template>
    <div class="source-drawer-body">
      <section class="source-identity">
        <span>
          <Icon
            :icon="
              selectedSource.type === 'PDF'
                ? 'lucide:file-text'
                : selectedSource.type === 'Manual'
                  ? 'lucide:clipboard-pen-line'
                  : 'lucide:file-type-2'
            "
          />
        </span>
        <div>
          <Tag
            :color="selectedSource.status === 'confirmed' ? 'green' : 'orange'"
          >
            {{
              selectedSource.status === 'confirmed' ? '已确认制度' : '等待确认'
            }}
          </Tag>
          <h2>{{ selectedSource.name }}</h2>
          <p>{{ selectedSource.summary }}</p>
        </div>
      </section>
      <dl class="source-meta">
        <div>
          <dt>制度版本</dt>
          <dd>{{ selectedSource.version }}</dd>
        </div>
        <div>
          <dt>适用范围</dt>
          <dd>{{ selectedSource.scope }}</dd>
        </div>
        <div>
          <dt>制度责任人</dt>
          <dd>{{ selectedSource.owner }}</dd>
        </div>
        <div>
          <dt>生效日期</dt>
          <dd>{{ selectedSource.effectiveDate }}</dd>
        </div>
      </dl>
      <section class="drawer-section">
        <header>
          <div>
            <span>TRACEABILITY</span>
            <h3>已影响的项目模板</h3>
          </div>
          <b>{{ selectedSource.impactedTemplates.length }}</b>
        </header>
        <div class="impact-chips">
          <span
            v-for="templateName in selectedSource.impactedTemplates"
            :key="templateName"
          >
            <Icon icon="lucide:layout-template" />
            {{ templateName }}
          </span>
        </div>
      </section>
      <section class="drawer-section">
        <header>
          <div>
            <span>AI PARSING</span>
            <h3>结构化解析摘要</h3>
          </div>
          <Tag color="blue">AI 生成</Tag>
        </header>
        <div class="parsing-summary">
          <div>
            <Icon icon="lucide:milestone" />
            <span>
              <strong>阶段门禁</strong>
              <small>识别准入、准出和依赖条件</small>
            </span>
          </div>
          <div>
            <Icon icon="lucide:package-check" />
            <span>
              <strong>成果物标准</strong>
              <small>识别格式、验收标准和验收人</small>
            </span>
          </div>
          <div>
            <Icon icon="lucide:shield-alert" />
            <span>
              <strong>异常规则</strong>
              <small>识别整改、变更和容缺处理</small>
            </span>
          </div>
        </div>
      </section>
      <section class="source-citation">
        <Icon icon="lucide:quote" />
        <div>
          <strong>示例引用 · 第 4 章 4.3 条</strong>
          <p>
            验收未通过的交付成果，应在三个工作日内完成整改并重新提交；连续两次未通过的，按三级质量异常处理。
          </p>
        </div>
      </section>
      <footer class="drawer-footer">
        <Button
          class="policy-secondary-button"
          @click="message.info('Demo：正在打开制度原文预览')"
        >
          <Icon icon="lucide:external-link" />
          查看制度原文
        </Button>
        <Button
          type="primary"
          class="policy-primary-button"
          @click="sourceDrawerOpen = false"
        >
          完成
        </Button>
      </footer>
    </div>
  </Drawer>

  <Modal
    v-model:open="versionModalOpen"
    wrap-class-name="policy-light-modal"
    width="720px"
    title="模板版本对比"
    :footer="null"
  >
    <div class="version-compare">
      <header>
        <div>
          <span>当前发布版</span>
          <strong>
            {{ selectedTemplate.name }} {{ currentPublishedVersion }}
          </strong>
        </div>
        <Icon icon="lucide:arrow-right" />
        <div>
          <span>新建版本</span>
          <strong>{{ selectedTemplate.name }} {{ suggestedVersion }}</strong>
        </div>
      </header>
      <div class="change-list">
        <article>
          <span class="change-icon is-new"><Icon icon="lucide:plus" /></span>
          <div>
            <strong>新增联合批准角色</strong>
            <p>
              容缺推进由“交付总监批准”调整为“项目负责人、PMO
              联合确认后报交付总监批准”。
            </p>
          </div>
        </article>
        <article>
          <span class="change-icon is-change">
            <Icon icon="lucide:pencil" />
          </span>
          <div>
            <strong>细化验收失败处理</strong>
            <p>增加 3 个工作日整改时限和二次不合格升级规则。</p>
          </div>
        </article>
      </div>
      <div class="version-impact">
        <Icon icon="lucide:shield-check" />
        <div>
          <strong>不会影响当前项目</strong>
          <p>
            {{ suggestedVersion }}
            发布后只用于新立项项目，存量项目需在“项目治理”中单独迁移。
          </p>
        </div>
      </div>
      <footer>
        <Button
          type="primary"
          class="policy-primary-button"
          @click="versionModalOpen = false"
        >
          我知道了
        </Button>
      </footer>
    </div>
  </Modal>

  <Modal
    v-model:open="publishModalOpen"
    wrap-class-name="policy-light-modal"
    width="620px"
    title="发布模板新版本"
    ok-text="确认发布"
    cancel-text="继续编辑"
    @ok="publishTemplate"
  >
    <div class="publish-confirmation">
      <section>
        <span><Icon icon="lucide:send" /></span>
        <div>
          <Tag color="blue">{{ selectedTemplate.version }}</Tag>
          <h3>{{ selectedTemplate.name }}</h3>
          <p>{{ selectedTemplate.scope }}</p>
        </div>
      </section>
      <dl>
        <div>
          <dt>发布范围</dt>
          <dd>仅用于发布后新发起的项目</dd>
        </div>
        <div>
          <dt>存量项目</dt>
          <dd>不自动迁移，需单独发起基线变更</dd>
        </div>
        <div>
          <dt>制度来源</dt>
          <dd>{{ selectedTemplate.policyIds.length }} 份已确认制度</dd>
        </div>
      </dl>
      <div class="modal-notice">
        <Icon icon="lucide:triangle-alert" />
        <span>发布后该版本不可原地修改。如需调整，必须再次创建新草稿。</span>
      </div>
    </div>
  </Modal>

  <Modal
    v-model:open="uploadModalOpen"
    wrap-class-name="policy-light-modal policy-upload-modal"
    width="760px"
    title="上传并解析制度文件"
    :footer="null"
    :mask-closable="uploadStep !== 'parsing'"
  >
    <div class="upload-flow">
      <ol class="upload-steps" aria-label="制度上传步骤">
        <li
          :class="{
            'is-active': uploadStep === 'form',
            'is-done': uploadStep !== 'form',
          }"
        >
          <span>1</span>
          <div>
            <strong>上传制度</strong>
            <small>补充来源信息</small>
          </div>
        </li>
        <li
          :class="{
            'is-active': uploadStep === 'parsing',
            'is-done': uploadStep === 'review' || uploadStep === 'done',
          }"
        >
          <span>2</span>
          <div>
            <strong>AI 解析</strong>
            <small>识别规则和缺口</small>
          </div>
        </li>
        <li
          :class="{
            'is-active': uploadStep === 'review',
            'is-done': uploadStep === 'done',
          }"
        >
          <span>3</span>
          <div>
            <strong>确认入库</strong>
            <small>进入审核队列</small>
          </div>
        </li>
      </ol>
      <section v-if="uploadStep === 'form'" class="upload-form-panel">
        <div class="upload-zone">
          <span><Icon icon="lucide:cloud-upload" /></span>
          <h3>选择公司制度文件</h3>
          <p>
            支持 PDF、Word，单个文件不超过 20MB。单项目合同或 SOW
            请到“项目治理”上传。
          </p>
          <Upload
            :before-upload="beforeUpload"
            :show-upload-list="false"
            accept=".pdf,.doc,.docx"
          >
            <Button type="primary" class="policy-primary-button">
              <Icon icon="lucide:folder-open" />
              选择本地文件
            </Button>
          </Upload>
          <button
            type="button"
            @click="startPolicyAnalysis('项目管理制度补充规定.docx')"
          >
            使用示例制度体验完整流程
          </button>
        </div>
        <div class="upload-boundary">
          <Icon icon="lucide:split" />
          <div>
            <strong>资料边界</strong>
            <p>
              本页只维护公司级制度来源。客户合同、SOW
              和项目会议纪要属于单项目资料，不会进入全局模板库。
            </p>
          </div>
        </div>
      </section>
      <section
        v-else-if="uploadStep === 'parsing'"
        class="parsing-panel"
        aria-live="polite"
      >
        <header>
          <span><Icon icon="lucide:file-search" /></span>
          <div>
            <strong>{{ uploadFileName }}</strong>
            <small>AI 正在解析制度结构，已完成 {{ uploadProgress }}%</small>
          </div>
          <b>{{ uploadProgress }}%</b>
        </header>
        <Progress
          :percent="uploadProgress"
          :show-info="false"
          stroke-color="#0b806f"
          trail-color="#e6efec"
        />
        <div class="parsing-tasks">
          <div :class="{ 'is-done': uploadProgress >= 24 }">
            <Icon
              :icon="
                uploadProgress >= 24
                  ? 'lucide:circle-check'
                  : 'lucide:loader-circle'
              "
            />
            <span>
              <strong>识别制度元数据</strong>
              <small>名称、版本、责任部门和适用范围</small>
            </span>
          </div>
          <div :class="{ 'is-done': uploadProgress >= 48 }">
            <Icon
              :icon="
                uploadProgress >= 48
                  ? 'lucide:circle-check'
                  : 'lucide:loader-circle'
              "
            />
            <span>
              <strong>提取执行规则</strong>
              <small>阶段、门禁、成果物与验收责任</small>
            </span>
          </div>
          <div :class="{ 'is-done': uploadProgress >= 72 }">
            <Icon
              :icon="
                uploadProgress >= 72
                  ? 'lucide:circle-check'
                  : 'lucide:loader-circle'
              "
            />
            <span>
              <strong>检测制度缺口</strong>
              <small>验收失败、变更和容缺处理流程</small>
            </span>
          </div>
          <div :class="{ 'is-done': uploadProgress >= 96 }">
            <Icon
              :icon="
                uploadProgress >= 96
                  ? 'lucide:circle-check'
                  : 'lucide:loader-circle'
              "
            />
            <span>
              <strong>生成引用与差异</strong>
              <small>定位原文并评估影响模板</small>
            </span>
          </div>
        </div>
      </section>
      <section v-else-if="uploadStep === 'review'" class="upload-review-panel">
        <header>
          <span><Icon icon="lucide:clipboard-check" /></span>
          <div>
            <Tag color="blue">AI 解析完成</Tag>
            <h3>{{ uploadFileName }}</h3>
            <p>识别到 2 条规则变化，请确认解析结果后保存为制度依据。</p>
          </div>
        </header>
        <div class="parse-result-grid">
          <article>
            <span>规则变化</span>
            <strong>2</strong>
            <small>整改时限、批准角色</small>
          </article>
          <article>
            <span>制度缺口</span>
            <strong>0</strong>
            <small>关键字段完整</small>
          </article>
          <article>
            <span>影响模板</span>
            <strong>1</strong>
            <small>标准交付模板</small>
          </article>
        </div>
        <div class="detected-rules">
          <article>
            <Icon icon="lucide:refresh-cw" />
            <div>
              <strong>验收失败整改</strong>
              <p>新增 3 个工作日整改时限和二次不合格升级规则。</p>
              <small>第 4 章 4.3 条 · 置信度 98%</small>
            </div>
          </article>
          <article>
            <Icon icon="lucide:user-round-check" />
            <div>
              <strong>容缺联合批准</strong>
              <p>新增项目负责人、PMO 联合确认后报交付总监批准。</p>
              <small>第 7 章 7.2 条 · 置信度 94%</small>
            </div>
          </article>
        </div>
        <footer>
          <Button class="policy-secondary-button" @click="resetUpload">
            重新选择
          </Button>
          <Button
            type="primary"
            class="policy-primary-button"
            @click="finishPolicyImport"
          >
            <Icon icon="lucide:save" />
            确认解析并保存制度
          </Button>
        </footer>
      </section>
      <section v-else class="upload-done-panel">
        <span><Icon icon="lucide:circle-check-big" /></span>
        <h3>制度文件已保存</h3>
        <p>解析结果已经人工确认，可在制度文件中查看并用于模板配置。</p>
        <Button
          type="primary"
          class="policy-primary-button"
          @click="finishPolicyUpload"
        >
          返回制度文件
        </Button>
      </section>
    </div>
  </Modal>

  <Drawer
    :open="generatedPolicyDrawerOpen"
    :width="760"
    root-class-name="generated-policy-drawer"
    title="AI 生成制度草案"
    @close="closeGeneratedPolicyDraft"
  >
    <section
      v-if="generatedPolicyLoading"
      class="generated-policy-loading"
      role="status"
      aria-live="polite"
    >
      <span><Icon class="is-spinning" icon="lucide:loader-circle" /></span>
      <h3>正在根据模板规则编制制度草案</h3>
      <p>
        AI 正在把项目阶段、成果物要求和风险处理规则组织成可审阅的制度章节。
      </p>
      <Progress
        :percent="generatedPolicyProgress"
        :show-info="false"
        stroke-color="#0b6e65"
      />
      <div>
        <span :class="{ 'is-done': generatedPolicyProgress >= 28 }">
          <Icon icon="lucide:circle-check" />整理适用范围与职责
        </span>
        <span :class="{ 'is-done': generatedPolicyProgress >= 52 }">
          <Icon icon="lucide:circle-check" />编排阶段与门禁章节
        </span>
        <span :class="{ 'is-done': generatedPolicyProgress >= 76 }">
          <Icon icon="lucide:circle-check" />写入成果物与验收要求
        </span>
        <span :class="{ 'is-done': generatedPolicyProgress >= 96 }">
          <Icon icon="lucide:circle-check" />标注风险规则来源
        </span>
      </div>
    </section>
    <section v-else class="generated-policy-preview">
      <header>
        <span><Icon icon="lucide:file-check-2" /></span>
        <div>
          <small>AI GENERATED · 待人工审阅</small>
          <h3>《{{ generatedPolicyContextName }}管理制度（草案）》</h3>
          <p>由当前项目模板反向生成，不会自动覆盖已生效制度。</p>
        </div>
      </header>
      <section class="generated-policy-file">
        <span><Icon icon="lucide:file-text" /></span>
        <div>
          <strong>{{ generatedPolicyFileName }}</strong>
          <small>Word 文档 · AI 生成 · 待人工审阅</small>
        </div>
        <a
          href="#"
          aria-label="下载生成的 Word 制度草案"
          @click.prevent="downloadGeneratedPolicyDraft"
        >
          <Icon icon="lucide:download" />
          下载 Word 草案
        </a>
      </section>
      <article>
        <span>第一章</span>
        <div>
          <strong>总则与适用范围</strong>
          <p>
            明确该类项目的管理目标、适用范围、项目经理责任及模板版本管理要求。
          </p>
        </div>
      </article>
      <article>
        <span>第二章</span>
        <div>
          <strong>项目阶段与门禁管理</strong>
          <p>{{ generatedPolicyStageNames.join('、') }}</p>
        </div>
      </article>
      <article>
        <span>第三章</span>
        <div>
          <strong>目标、成果物与验收要求</strong>
          <p>
            根据各阶段提示词生成目标和成果物，并保留负责人、验收人和完成证据。
          </p>
        </div>
      </article>
      <article>
        <span>第四章</span>
        <div>
          <strong>风险、异常与升级处理</strong>
          <p>{{ generatedPolicyRiskNames.join('、') || '暂未配置风险规则' }}</p>
          <small>AI 补充的规则会在制度草案中标记为“建议条款”，需人工确认后生效。</small>
        </div>
      </article>
      <aside>
        <Icon icon="lucide:shield-check" />
        该内容只是制度草案。管理者确认、补充文号和生效日期后，才能作为正式制度重新解析并发布。
      </aside>
      <footer>
        <Button class="policy-secondary-button" @click="startGeneratedPolicyDraft">
          <Icon icon="lucide:refresh-cw" />
          重新生成
        </Button>
        <Button
          type="primary"
          class="policy-primary-button"
          @click="message.success('制度草案已保存到制度文件草稿')"
        >
          <Icon icon="lucide:save" />
          保存制度草案
        </Button>
      </footer>
    </section>
  </Drawer>
</template>

<style scoped>
.policy-page-shell :deep(.ai-work-page__actions .ant-btn) {
  color: #28584d !important;
  background: #fff !important;
  border-color: #c7dcd6 !important;
  box-shadow: none !important;
}

.policy-page-shell :deep(.ai-work-page__actions .ant-btn-primary),
.policy-page-shell :deep(.ai-work-page__actions .policy-primary-button) {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
}

.policy-page-shell :deep(.ai-work-page__actions .ant-btn-primary:hover),
.policy-page-shell :deep(.ai-work-page__actions .policy-primary-button:hover) {
  color: #fff !important;
  background: #075c54 !important;
  border-color: #075c54 !important;
}

.template-create-flow {
  --create-primary: #0b6e65;
  --create-primary-hover: #075c54;
  --create-ink: #153a32;
  --create-text: #365b52;
  --create-muted: #6d827b;
  --create-border: #d5e4df;

  display: grid;
  overflow: hidden;
  color: var(--create-text);
  background: #fff;
  border: 1px solid var(--create-border);
  border-radius: 14px;
}

.create-step-navigation {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  background: #f8fbfa;
  border-bottom: 1px solid var(--create-border);
}

.create-step-navigation button {
  position: relative;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  min-height: 78px;
  padding: 12px 14px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-right: 1px solid #e1eae7;
}

.create-step-navigation button:last-child {
  border-right: 0;
}

.create-step-navigation button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.create-step-navigation button.is-active {
  background: #edf5f2;
  box-shadow: inset 0 -3px 0 var(--create-primary);
}

.create-step-navigation button.is-complete {
  background: #f3f8f6;
}

.create-step-navigation button > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: var(--create-primary);
  background: #fff;
  border: 1px solid #c9ded8;
  border-radius: 9px;
}

.create-step-navigation button > div {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.create-step-navigation small {
  font-size: 9px;
  font-weight: 800;
  color: var(--create-primary);
}

.create-step-navigation strong {
  font-size: 12px;
  color: var(--create-ink);
}

.create-step-navigation em {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  font-style: normal;
  color: var(--create-muted);
  white-space: nowrap;
}

.create-workspace {
  display: grid;
  gap: 16px;
  min-height: 500px;
  padding: 22px;
  background: #fff;
}

.template-analysis-state {
  display: grid;
  gap: 18px;
  align-content: start;
  min-height: 390px;
  padding: 24px;
  background: #eef4f2;
  border: 1px solid #cdded9;
  border-radius: 14px;
}

.template-analysis-state > header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #d6e3df;
  border-radius: 12px;
}

.analysis-state-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 23px;
  color: var(--create-primary);
  background: #e7f2ee;
  border-radius: 12px;
}

.template-analysis-state > header > div {
  min-width: 0;
}

.template-analysis-state > header small {
  font-size: 12px;
  font-weight: 800;
  color: var(--create-primary);
}

.template-analysis-state > header h3 {
  margin: 3px 0;
  font-size: 18px;
  color: var(--create-ink);
}

.template-analysis-state > header p {
  margin: 0;
  font-size: 12px;
  color: var(--create-muted);
}

.template-analysis-state > header > strong {
  font-size: 22px;
  color: var(--create-primary);
}

.template-analysis-progress :deep(.ant-progress-inner) {
  height: 8px;
}

.template-analysis-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.template-analysis-steps > div {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
  min-height: 92px;
  padding: 12px;
  background: #f7f9f8;
  border: 1px solid #d9e3e0;
  border-radius: 10px;
}

.template-analysis-steps > div.is-current {
  background: #fff;
  border-color: #79aa9d;
  box-shadow: 0 5px 14px rgb(31 79 68 / 8%);
}

.template-analysis-steps > div.is-complete {
  background: #e5f2ed;
  border-color: #bfd9d1;
}

.template-analysis-steps > div > span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #799089;
  background: #fff;
  border: 1px solid #d5e1dd;
  border-radius: 8px;
}

.template-analysis-steps .is-current > span,
.template-analysis-steps .is-complete > span {
  color: var(--create-primary);
  border-color: #b8d4cc;
}

.template-analysis-steps > div > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.template-analysis-steps strong,
.template-analysis-steps small {
  font-size: 12px;
  line-height: 1.45;
}

.template-analysis-steps strong {
  color: #294f46;
}

.template-analysis-steps small {
  color: #6a7e78;
}

.template-analysis-state > footer {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 11px 13px;
  font-size: 12px;
  color: #315c52;
  background: #fff;
  border: 1px solid #d6e3df;
  border-radius: 9px;
}

.template-analysis-state > footer svg {
  flex: none;
  color: var(--create-primary);
}

.is-spinning {
  animation: template-spinner 900ms linear infinite;
}

@keyframes template-spinner {
  to {
    transform: rotate(360deg);
  }
}

.create-section-heading span {
  font-size: 9px;
  font-weight: 800;
  color: var(--create-primary);
  letter-spacing: 0.1em;
}

.create-section-heading h2 {
  margin: 3px 0 5px;
  font-size: 20px;
  color: var(--create-ink);
}

.create-section-heading p {
  max-width: 760px;
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--create-muted);
}

.create-section-heading.is-horizontal {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.ai-generated-chip {
  display: inline-flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 7px 10px;
  color: var(--create-primary);
  letter-spacing: 0;
  background: #edf5f2;
  border: 1px solid #c9ded8;
  border-radius: 999px;
}

.source-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.source-choice-grid > article {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-width: 0;
  min-height: 310px;
  padding: 18px;
  background: #fafcfb;
  border: 1px solid #dfe9e6;
  border-radius: 12px;
}

.source-choice-grid > article.has-content {
  background: #f4faf7;
  border-color: #86bcae;
  box-shadow: inset 0 0 0 1px rgb(11 110 101 / 8%);
}

.choice-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 18px;
  color: var(--create-primary);
  background: #edf5f2;
  border-radius: 10px;
}

.source-choice-grid small {
  font-size: 9px;
  font-weight: 800;
  color: var(--create-primary);
}

.source-choice-grid h3 {
  margin: 2px 0 4px;
  font-size: 16px;
  color: var(--create-ink);
}

.source-choice-grid p {
  margin: 0;
  font-size: 11px;
  line-height: 1.55;
  color: var(--create-muted);
}

.source-ready {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-top: auto;
  font-size: 10px;
  color: var(--create-primary);
}

.requirement-field,
.create-form-grid label,
.stage-core-grid label,
.stage-rule-grid label,
.stage-prompt-grid label {
  display: grid;
  gap: 6px;
}

.requirement-field > span,
.create-form-grid label > span,
.stage-core-grid label > span,
.stage-rule-grid label > span,
.stage-prompt-grid label > span {
  font-size: 10px;
  font-weight: 800;
  color: #44665e;
}

.stage-rule-grid label > span,
.stage-prompt-grid label > span {
  display: flex;
  gap: 5px;
  align-items: center;
}

.stage-rule-grid label > span svg,
.stage-prompt-grid label > span svg {
  color: var(--create-primary, #0b6e65);
}

.stage-prompt-grid label > small {
  font-size: 9px;
  line-height: 1.5;
  color: var(--create-muted, #6d827b);
}

.requirement-field textarea {
  width: 100%;
  min-height: 138px;
  padding: 10px 11px;
  font: inherit;
  font-size: 12px;
  line-height: 1.6;
  color: var(--create-ink);
  resize: vertical;
  outline: none;
  background: #fff;
  border: 1px solid #c9dcd7;
  border-radius: 8px;
}

.requirement-field textarea:focus {
  border-color: #6eac9d;
  box-shadow: 0 0 0 3px rgb(11 128 111 / 12%);
}

.create-tip,
.source-summary,
.publish-boundary-note {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: #edf5f2;
  border: 1px solid #cfe1dc;
  border-radius: 10px;
}

.create-tip > svg,
.source-summary > span,
.publish-boundary-note > svg {
  flex: none;
  margin-top: 2px;
  color: var(--create-primary);
}

.create-tip > div,
.source-summary > div,
.publish-boundary-note > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.create-tip strong,
.source-summary strong,
.publish-boundary-note strong {
  font-size: 11px;
  color: var(--create-ink);
}

.create-tip span,
.source-summary p,
.publish-boundary-note span {
  margin: 0;
  overflow: hidden;
  font-size: 10px;
  line-height: 1.55;
  color: var(--create-muted);
}

.source-summary p {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.create-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  max-width: 900px;
  padding: 18px;
  background: #fafcfb;
  border: 1px solid #dfe9e6;
  border-radius: 12px;
}

.create-form-grid label.is-wide {
  grid-column: 1 / -1;
}

.structure-workspace {
  background: #e7eeeb;
}

.risk-workspace {
  background: #e7eeeb;
}

.ai-risk-instruction-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  background: #fff;
  border: 1px solid #cbdad5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(34 70 61 / 6%);
}

.ai-risk-instruction-card > header {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.ai-risk-instruction-card > header > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #9a5813;
  background: #fff3df;
  border-radius: 9px;
}

.ai-risk-instruction-card > header > div {
  display: grid;
  gap: 2px;
}

.ai-risk-instruction-card strong,
.ai-risk-instruction-card small,
.ai-risk-instruction-card p,
.ai-risk-instruction-card em {
  font-size: 12px;
}

.ai-risk-instruction-card strong {
  color: var(--create-ink);
}

.ai-risk-instruction-card small,
.ai-risk-instruction-card p {
  color: var(--create-muted);
}

.ai-risk-instruction-card em {
  padding: 4px 8px;
  font-style: normal;
  color: #8a4d0e;
  background: #fff3df;
  border: 1px solid #efd5ad;
  border-radius: 999px;
}

.ai-risk-instruction-card p {
  margin: 0;
  line-height: 1.55;
}

.risk-suggestion-note {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 13px 14px;
  background: #f7f3ff;
  border: 1px solid #ddd1f3;
  border-radius: 11px;
}

.risk-suggestion-note > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #6843a4;
  background: #fff;
  border-radius: 9px;
}

.risk-suggestion-note > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.risk-suggestion-note strong,
.risk-suggestion-note p {
  font-size: 12px;
}

.risk-suggestion-note strong {
  color: #413052;
}

.risk-suggestion-note p {
  margin: 0;
  line-height: 1.55;
  color: #6d5b7e;
}

.risk-rule-list {
  display: grid;
  gap: 14px;
}

.risk-rule-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #cbdad5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(34 70 61 / 6%);
}

.risk-rule-card > summary {
  display: grid;
  grid-template-columns: 38px minmax(180px, 1fr) auto 18px;
  gap: 10px;
  align-items: center;
  min-height: 64px;
  padding: 12px 14px;
  cursor: pointer;
  list-style: none;
}

.risk-rule-card > summary::-webkit-details-marker {
  display: none;
}

.risk-rule-card[open] > summary {
  background: #f8fbfa;
  border-bottom: 1px solid #dce6e3;
}

.risk-rule-summary {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.risk-rule-summary strong {
  overflow: hidden;
  font-size: 13px;
  color: #244b41;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-rule-summary small {
  overflow: hidden;
  font-size: 12px;
  color: #6d827b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.risk-rule-chevron {
  color: #648078;
  transition: transform 180ms ease;
}

.risk-rule-card[open] .risk-rule-chevron {
  transform: rotate(180deg);
}

.risk-rule-editor {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.risk-rule-editor > header {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
}

.risk-rule-editor > header > label {
  display: grid;
  flex: 1;
  gap: 6px;
}

.risk-rule-editor > header > label > span {
  font-size: 12px;
  font-weight: 700;
  color: #44665e;
}

.risk-rule-editor > header > div {
  display: flex;
  gap: 8px;
}

.risk-rule-index {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 12px;
  font-weight: 800;
  color: #8a4d0e;
  background: #fff3df;
  border-radius: 9px;
}

.risk-optimize-button {
  color: #64419c !important;
  background: #faf7ff !important;
  border-color: #d9caef !important;
}

.risk-remove-button {
  color: #a53e36 !important;
  background: #fff !important;
  border-color: #e5b9b4 !important;
}

.risk-rule-meta,
.risk-rule-content {
  display: grid;
  gap: 10px;
}

.risk-rule-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.risk-rule-content {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.risk-rule-meta label,
.risk-rule-content label {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.risk-rule-meta label > span,
.risk-rule-content label > span {
  font-size: 12px;
  font-weight: 700;
  color: #44665e;
}

.risk-rule-content textarea {
  min-height: 76px;
  font-size: 12px;
  line-height: 1.55;
  resize: vertical;
}

.add-risk-rule-button {
  min-height: 44px;
  color: #28584d !important;
  background: rgb(255 255 255 / 72%) !important;
  border: 1px dashed #8eb2a8 !important;
}

.generated-stage-list {
  display: grid;
  gap: 14px;
}

.generated-stage-list > article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 16px;
  background: #fff;
  border: 1px solid #cbdad5;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(34 70 61 / 6%);
}

.stage-index {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 12px;
  font-weight: 900;
  color: var(--create-primary);
  background: #edf5f2;
  border-radius: 9px;
}

.stage-card-body {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.stage-card-heading {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4ece9;
}

.stage-card-heading > div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.stage-card-heading strong {
  font-size: 13px;
  color: var(--create-ink, #153a32);
}

.stage-card-heading small {
  font-size: 12px;
  line-height: 1.5;
  color: var(--create-muted, #6d827b);
}

.stage-card-actions {
  display: flex !important;
  flex: none;
  gap: 8px;
  align-items: center;
}

.stage-insert-button {
  min-width: 36px;
  color: #28584d !important;
  background: #f7fbf9 !important;
  border-color: #bfd4ce !important;
}

.stage-insert-button:hover,
.stage-insert-button:focus-visible {
  color: #0b6e65 !important;
  background: #edf6f2 !important;
  border-color: #79a99e !important;
}

:global(.stage-insert-menu) {
  display: grid;
  gap: 4px;
  min-width: 148px;
  padding: 6px;
  background: #fff;
  border: 1px solid #d2dfdb;
  border-radius: 10px;
  box-shadow: 0 10px 28px rgb(31 66 57 / 14%);
}

:global(.stage-insert-menu button) {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 38px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: #365b52;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

:global(.stage-insert-menu button:hover),
:global(.stage-insert-menu button:focus-visible) {
  color: #0b6e65;
  background: #edf6f2;
  outline: none;
}

:global(.stage-insert-menu button svg) {
  flex: none;
  font-size: 15px;
}

.stage-remove-button {
  flex: none;
  color: #a53e36 !important;
  background: #fff !important;
  border-color: #e5b9b4 !important;
}

.stage-remove-button:hover {
  color: #8f2f29 !important;
  background: #fff7f6 !important;
  border-color: #d98f88 !important;
}

.stage-remove-button:disabled {
  color: #9aa9a4 !important;
  background: #f7f9f8 !important;
  border-color: #dce5e2 !important;
}

.stage-core-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stage-rule-grid,
.stage-prompt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stage-prompt-grid label.is-wide,
.prompt-rule-panel article.is-wide {
  grid-column: 1 / -1;
}

.structure-workspace .stage-core-grid label > span,
.structure-workspace .stage-rule-grid label > span,
.structure-workspace .stage-prompt-grid label > span,
.structure-workspace .stage-prompt-grid label > small {
  font-size: 12px;
}

.stage-rule-grid textarea,
.stage-prompt-grid textarea {
  line-height: 1.55;
  color: #244b41 !important;
  resize: vertical;
  background: #fff !important;
  border-color: #cbded8 !important;
}

.stage-prompt-grid {
  padding: 11px;
  background: #f4faf7;
  border: 1px solid #d6e8e2;
  border-radius: 9px;
}

.stage-detail-editor {
  display: grid;
  gap: 12px;
  padding: 14px;
  background: #fafcfb;
  border: 1px solid #dfe9e6;
  border-radius: 10px;
}

.stage-editor-actions,
.deliverable-heading-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.draft-edit-notice {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  gap: 9px;
  align-items: center;
  padding: 9px 11px;
  font-size: 12px;
  color: #315f54;
  background: #edf7f3;
  border: 1px solid #cde4dc;
  border-radius: 8px;
}

.draft-edit-notice > svg {
  font-size: 17px;
  color: #0b806f;
}

.prompt-rule-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.prompt-rule-panel article {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 8px;
  padding: 11px;
  background: #f4faf7;
  border: 1px solid #d6e8e2;
  border-radius: 9px;
}

.prompt-rule-panel article > span {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #0b6e65;
  background: #fff;
  border: 1px solid #dceae6;
  border-radius: 8px;
}

.prompt-rule-panel article > div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.prompt-rule-panel strong {
  font-size: 10px;
  color: #244b41;
}

.prompt-rule-panel p {
  margin: 0;
  font-size: 9px;
  line-height: 1.6;
  color: #5f776f;
}

.template-review-hero {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 17px;
  background: #f4faf7;
  border: 1px solid #c7ddd7;
  border-radius: 12px;
}

.policy-regeneration-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  background: #f7f3ff;
  border: 1px solid #ddd1f3;
  border-radius: 11px;
}

.policy-regeneration-card > span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 19px;
  color: #6843a4;
  background: #fff;
  border-radius: 10px;
}

.policy-regeneration-card > div {
  min-width: 0;
}

.policy-regeneration-card strong,
.policy-regeneration-card p {
  font-size: 12px;
}

.policy-regeneration-card strong {
  color: #413052;
}

.policy-regeneration-card p {
  margin: 3px 0 0;
  line-height: 1.55;
  color: #6d5b7e;
}

.template-review-hero > span {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 22px;
  color: var(--create-primary);
  background: #fff;
  border-radius: 11px;
}

.template-review-hero small {
  font-size: 9px;
  font-weight: 800;
  color: var(--create-primary);
  letter-spacing: 0.08em;
}

.template-review-hero h3 {
  margin: 2px 0 3px;
  font-size: 18px;
  color: var(--create-ink);
}

.template-review-hero p {
  margin: 0;
  font-size: 11px;
  color: var(--create-muted);
}

.review-meta {
  display: flex;
  gap: 5px;
}

.review-meta span {
  padding: 4px 8px;
  font-size: 9px;
  color: #456b61;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 999px;
}

.review-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 9px;
}

.review-stat-grid article {
  display: grid;
  gap: 2px;
  padding: 13px;
  text-align: center;
  background: #fafcfb;
  border: 1px solid #dfe9e6;
  border-radius: 10px;
}

.review-stat-grid strong {
  font-size: 20px;
  color: var(--create-primary);
}

.review-stat-grid span {
  font-size: 10px;
  color: var(--create-muted);
}

.review-stage-flow {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.review-stage-flow article {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 10px;
  background: #fff;
  border: 1px solid #dfe9e6;
  border-radius: 9px;
}

.review-stage-flow article > span {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  font-size: 9px;
  font-weight: 800;
  color: var(--create-primary);
  background: #edf5f2;
  border-radius: 7px;
}

.review-stage-flow article > div {
  display: grid;
  min-width: 0;
}

.review-stage-flow strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  color: var(--create-ink);
  white-space: nowrap;
}

.review-stage-flow small {
  font-size: 9px;
  color: var(--create-muted);
}

.create-flow-footer {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: #f8fbfa;
  border-top: 1px solid var(--create-border);
}

.create-flow-footer > span,
.create-flow-footer > div {
  display: flex;
  gap: 8px;
  align-items: center;
}

.create-flow-footer > span {
  font-size: 10px;
  color: var(--create-muted);
}

.create-flow-footer > span svg {
  color: var(--create-primary);
}

.template-create-flow :deep(.ant-btn) {
  min-height: 38px;
  color: #28584d !important;
  background: #fff !important;
  border-color: #c7dcd6 !important;
  box-shadow: none !important;
}

.template-create-flow :deep(.ant-btn:hover) {
  color: var(--create-primary) !important;
  background: #f2f8f6 !important;
  border-color: #8ebfb2 !important;
}

.template-create-flow :deep(.ant-btn-primary),
.template-create-flow :deep(.policy-primary-button) {
  color: #fff !important;
  background: var(--create-primary) !important;
  border-color: var(--create-primary) !important;
}

.template-create-flow :deep(.ant-btn-primary:hover),
.template-create-flow :deep(.policy-primary-button:hover) {
  color: #fff !important;
  background: var(--create-primary-hover) !important;
  border-color: var(--create-primary-hover) !important;
}

.template-create-flow :deep(.ant-btn:disabled) {
  color: #8a9b95 !important;
  background: #f2f5f4 !important;
  border-color: #dde6e3 !important;
}

.template-create-flow :deep(.stage-remove-button:not(:disabled)) {
  color: #a53e36 !important;
  background: #fff !important;
  border-color: #e5b9b4 !important;
}

.template-create-flow :deep(.stage-remove-button:not(:disabled):hover) {
  color: #8f2f29 !important;
  background: #fff7f6 !important;
  border-color: #d98f88 !important;
}

.create-step-navigation button:focus-visible,
.requirement-field textarea:focus-visible {
  outline: 3px solid rgb(11 128 111 / 20%);
  outline-offset: 2px;
}

.policy-hub {
  --p: #0b6e65;
  --ph: #075c54;
  --a: #3f9d86;
  --ink: #153a32;
  --text: #365b52;
  --muted: #6d827b;
  --border: #d5e4df;
  --strong: #a9cdc3;
  --soft: #edf5f2;
  --warn: #a86412;
  --warn-soft: #fff7e8;
  --danger: #b5483e;
  --danger-soft: #fff2f0;
  --blue: #356f9f;
  --blue-soft: #edf6fb;

  display: grid;
  gap: 14px;
  min-width: 0;
  color: var(--text);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-grid article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 4px 11px;
  align-items: center;
  min-height: 84px;
  padding: 14px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 4px 16px rgb(22 63 52 / 4%);
}

.metric-icon,
.file-icon,
.gate-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 19px;
  border-radius: 11px;
}

.metric-icon.is-green {
  color: var(--p);
  background: #e7f4f0;
}

.metric-icon.is-amber {
  color: var(--warn);
  background: var(--warn-soft);
}

.metric-icon.is-red {
  color: var(--danger);
  background: var(--danger-soft);
}

.metric-icon.is-blue {
  color: var(--blue);
  background: var(--blue-soft);
}

.metric-grid article > div {
  display: flex;
  gap: 7px;
  align-items: baseline;
}

.metric-grid strong {
  font-size: 24px;
  line-height: 1;
  color: var(--ink);
}

.metric-grid article > div span {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.metric-grid small {
  grid-column: 2;
  font-size: 12px;
  color: var(--muted);
}

.page-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 5px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
}

.page-tabs button {
  position: relative;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-height: 58px;
  padding: 7px 12px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 10px;
  transition:
    background 180ms ease,
    border-color 180ms ease,
    color 180ms ease;
}

.page-tabs button:hover {
  background: #f4f9f7;
}

.page-tabs button:focus-visible,
.template-list__items > button:focus-visible,
.detail-tabs button:focus-visible,
.review-filter button:focus-visible,
.stage-list button:focus-visible,
.source-list button:focus-visible,
.source-quote:focus-visible {
  outline: 3px solid rgb(11 128 111 / 20%);
  outline-offset: 1px;
}

.page-tabs button.is-active {
  color: var(--p);
  background: #eaf5f1;
  border-color: #bcd9d0;
}

.page-tabs button > span:first-child {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  background: #f1f7f5;
  border-radius: 9px;
}

.page-tabs button.is-active > span:first-child {
  background: #fff;
  box-shadow: 0 2px 8px rgb(23 76 62 / 8%);
}

.page-tabs button > span:nth-child(2) {
  display: grid;
  gap: 2px;
}

.page-tabs strong {
  font-size: 14px;
}

.page-tabs small {
  font-size: 12px;
  color: var(--muted);
}

.page-tabs b {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  color: #fff;
  background: var(--warn);
  border-radius: 999px;
}

.template-workbench {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  min-height: 600px;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 8px 28px rgb(22 63 52 / 5%);
}

.template-list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 14px;
  background: #f2f7f5;
  border-right: 1px solid var(--border);
}

.template-list > header,
.review-header,
.policy-header,
.section-heading,
.drawer-section > header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
}

.template-list > header {
  align-items: center;
  padding: 3px 4px 12px;
}

.template-list header span,
.review-header > div > span,
.policy-header > div > span,
.section-heading > div > span,
.drawer-section header span,
.stage-detail > header > div > span,
.deliverable-heading > div:first-child > span {
  font-size: 10px;
  font-weight: 800;
  color: var(--p);
  letter-spacing: 0.1em;
}

.template-list h2,
.review-header h2,
.policy-header h2 {
  margin: 2px 0 0;
  font-size: 18px;
  color: var(--ink);
}

.template-list > header > b,
.drawer-section header > b,
.deliverable-heading-actions > b {
  display: grid;
  place-items: center;
  min-width: 28px;
  height: 28px;
  font-size: 12px;
  color: var(--p);
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 999px;
}

.template-list__items {
  display: grid;
  gap: 7px;
}

.template-list__items > button {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  min-height: 66px;
  padding: 9px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 11px;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.template-list__items > button:hover {
  border-color: var(--strong);
}

.template-list__items > button.is-active {
  color: var(--p);
  background: #e7f3ef;
  border-color: #8fc2b4;
  box-shadow: inset 3px 0 0 var(--a);
}

.template-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 16px;
  color: var(--p);
  background: #edf6f3;
  border-radius: 9px;
}

.template-list__items > button.is-active .template-icon {
  background: #fff;
}

.template-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.template-copy strong,
.template-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-copy strong {
  font-size: 13px;
}

.template-copy small {
  font-size: 11px;
  color: var(--muted);
}

.template-list :deep(.ant-tag) {
  margin: 0;
}

.template-list > footer {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 13px 5px 2px;
  margin-top: auto;
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}

.template-list > footer svg {
  flex: none;
  margin-top: 2px;
  color: var(--p);
}

.template-detail {
  min-width: 0;
  padding: 18px;
  background: #fff;
}

.template-detail__header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding-bottom: 14px;
}

.title-row {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
}

.title-row h2 {
  margin: 0;
  font-size: 20px;
  color: var(--ink);
}

.template-detail__header p {
  max-width: 720px;
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--muted);
}

.version-chip {
  padding: 3px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--blue);
  background: var(--blue-soft);
  border: 1px solid #cbdfea;
  border-radius: 999px;
}

.detail-actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.detail-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f0f5f3;
  border-radius: 10px;
}

.detail-tabs button,
.review-filter button {
  min-height: 40px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition:
    background 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.detail-tabs button:hover,
.review-filter button:hover {
  color: var(--p);
  background: #fff;
}

.detail-tabs button.is-active,
.review-filter button.is-active {
  color: var(--p);
  background: #fff;
  box-shadow: 0 2px 8px rgb(23 76 62 / 8%);
}

.detail-panel {
  padding-top: 16px;
}

.overview-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.template-summary-card,
.completeness-card,
.source-card,
.governance-note,
.suggestion-list article,
.policy-file-list article,
.ai-review-notice,
.gap-callout,
.locked-note {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 13px;
}

.template-summary-card,
.completeness-card,
.source-card {
  padding: 15px;
}

.template-summary-card > header,
.completeness-card > header,
.source-card > header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 13px;
}

.template-summary-card header span,
.completeness-card header span,
.source-card header span {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}

.template-summary-card h3,
.completeness-card h3,
.source-card h3 {
  margin: 2px 0 0;
  font-size: 16px;
  color: var(--ink);
}

.template-summary-card > header > svg,
.source-card > header > svg {
  font-size: 22px;
  color: var(--a);
}

.template-summary-card dl,
.source-meta,
.publish-confirmation dl {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin: 0;
}

.template-summary-card dl > div,
.source-meta > div,
.publish-confirmation dl > div {
  padding: 10px;
  background: #f4f8f6;
  border-radius: 9px;
}

dt {
  font-size: 11px;
  color: var(--muted);
}

dd {
  margin: 3px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.completeness-card p {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--muted);
}

.source-card {
  grid-column: 1/3;
}

.source-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.source-list button {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  min-height: 58px;
  padding: 9px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  background: #f7faf9;
  border: 1px solid #e1ebe8;
  border-radius: 10px;
  transition:
    border-color 180ms ease,
    background 180ms ease;
}

.source-list button:hover {
  background: #edf6f3;
  border-color: var(--strong);
}

.source-list button > span:first-child {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--p);
  background: #fff;
  border-radius: 8px;
}

.source-list button > span:nth-child(2) {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.source-list strong,
.source-list small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-list strong {
  font-size: 12px;
}

.source-list small {
  font-size: 11px;
  color: var(--muted);
}

.governance-note {
  display: flex;
  grid-column: 1/3;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  background: #eef7f4;
  border-color: #cfe3dc;
}

.governance-note > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--p);
  background: #fff;
  border-radius: 9px;
}

.governance-note strong {
  font-size: 13px;
  color: var(--ink);
}

.governance-note p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
}

.stages-panel {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 14px;
}

.stage-list {
  display: grid;
  gap: 6px;
  align-content: start;
}

.stage-list button {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
  min-height: 58px;
  padding: 8px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  background: #f7faf9;
  border: 1px solid var(--border);
  border-radius: 10px;
  transition: 180ms ease;
}

.stage-list button:hover {
  border-color: var(--strong);
}

.stage-list button.is-active {
  color: var(--p);
  background: #e8f4f0;
  border-color: #97c6ba;
}

.stage-list button > span:first-child {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 11px;
  font-weight: 800;
  background: #fff;
  border-radius: 8px;
}

.stage-list button > span:nth-child(2) {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.stage-list strong {
  font-size: 12px;
}

.stage-list small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}

.stage-detail {
  min-width: 0;
}

.stage-detail > header {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 2px 0 12px;
}

.stage-detail h3,
.deliverable-heading h3,
.section-heading h3,
.drawer-section h3 {
  margin: 2px 0 0;
  font-size: 17px;
  color: var(--ink);
}

.stage-detail header p,
.section-heading p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.gate-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.gate-grid article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-height: 102px;
  padding: 12px;
  background: #f7faf9;
  border: 1px solid var(--border);
  border-radius: 11px;
}

.gate-icon.is-entry {
  color: var(--blue);
  background: var(--blue-soft);
}

.gate-icon.is-exit {
  color: var(--p);
  background: #e7f4f0;
}

.gate-grid strong {
  font-size: 13px;
  color: var(--ink);
}

.gate-grid p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
}

.deliverable-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 17px 2px 9px;
}

.deliverable-heading-actions > b {
  flex: none;
}

.deliverable-list {
  display: grid;
  gap: 8px;
}

.deliverable-list article {
  padding: 11px 12px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
}

.deliverable-list .deliverable-edit-card {
  display: grid;
  gap: 10px;
  background: #fafcfb;
  border-color: #cfe1db;
}

.deliverable-edit-grid {
  display: grid;
  grid-template-columns: minmax(150px, 1.4fr) minmax(120px, 0.8fr) minmax(
      120px,
      0.8fr
    ) 34px;
  gap: 9px;
  align-items: end;
}

.deliverable-edit-grid label,
.deliverable-acceptance-field {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.deliverable-edit-grid label > span,
.deliverable-acceptance-field > span {
  font-size: 12px;
  font-weight: 700;
  color: #48675f;
}

.deliverable-remove-button {
  width: 34px;
  min-width: 34px;
  height: 32px;
  padding: 0 !important;
  color: #a34840 !important;
  background: #fff !important;
  border-color: #e2bdb8 !important;
}

.deliverable-remove-button:hover,
.deliverable-remove-button:focus-visible {
  color: #8c312a !important;
  outline: 2px solid rgb(180 76 65 / 18%);
  background: #fff7f6 !important;
  border-color: #cf8f88 !important;
}

.deliverable-acceptance-field textarea {
  line-height: 1.55;
  color: #244b41 !important;
  resize: vertical;
  background: #fff !important;
  border-color: #cbded8 !important;
}

.deliverable-empty-edit {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 88px;
  padding: 16px;
  font-size: 12px;
  color: #677c75;
  background: #fafcfb;
  border: 1px dashed #c8dbd5;
  border-radius: 10px;
}

.deliverable-empty-edit > svg {
  font-size: 18px;
  color: #4c8d7c;
}

.deliverable-list article header {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
}

.deliverable-list article header > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--p);
  background: #edf6f3;
  border-radius: 8px;
}

.deliverable-list article header > div {
  display: grid;
  gap: 2px;
}

.deliverable-list strong {
  font-size: 13px;
  color: var(--ink);
}

.deliverable-list small {
  font-size: 11px;
  color: var(--muted);
}

.deliverable-list p {
  margin: 8px 0 0 43px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text);
}

.locked-note {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
  background: #f4f7f6;
}

.exceptions-panel,
.versions-panel {
  display: grid;
  gap: 12px;
}

.ai-risk-governance-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  background: #f3f8f6;
  border: 1px solid #cbded8;
  border-radius: 11px;
}

.ai-risk-governance-card > header {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.ai-risk-governance-card > header > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #0b6e65;
  background: #fff;
  border: 1px solid #d3e3de;
  border-radius: 9px;
}

.ai-risk-governance-card > header > div {
  display: grid;
  gap: 2px;
}

.ai-risk-governance-card strong,
.ai-risk-governance-card small,
.ai-risk-governance-card p {
  font-size: 12px;
}

.ai-risk-governance-card strong {
  color: var(--ink);
}

.ai-risk-governance-card small,
.ai-risk-governance-card p {
  color: var(--muted);
}

.ai-risk-governance-card p {
  margin: 0;
  line-height: 1.6;
}

.exception-list,
.version-list {
  display: grid;
  gap: 8px;
}

.exception-list article {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 13px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 11px;
}

.exception-number {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 12px;
  font-weight: 800;
  color: var(--danger);
  background: var(--danger-soft);
  border-radius: 10px;
}

.exception-list strong {
  font-size: 13px;
  color: var(--ink);
}

.exception-rule-heading {
  display: flex;
  gap: 8px;
  align-items: center;
}

.exception-list p {
  margin: 3px 0 6px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text);
}

.exception-list small {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
}

.gap-callout {
  display: flex;
  gap: 11px;
  align-items: center;
  padding: 12px;
  background: var(--warn-soft);
  border-color: #edd4ac;
}

.gap-callout > svg {
  flex: none;
  font-size: 20px;
  color: var(--warn);
}

.gap-callout > div {
  flex: 1;
}

.gap-callout strong {
  font-size: 13px;
  color: #7b4a0e;
}

.gap-callout p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8b622c;
}

.version-list article {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 10px;
  padding: 7px 0;
}

.version-dot {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--muted);
  background: #f0f5f3;
  border-radius: 50%;
}

.version-dot.is-current {
  color: var(--p);
  background: #e5f3ee;
}

.version-list article > div {
  padding: 0 0 15px 2px;
  border-bottom: 1px solid #e6eeeb;
}

.version-list article > div > header {
  display: flex;
  gap: 7px;
  align-items: center;
}

.version-list strong {
  font-size: 14px;
  color: var(--ink);
}

.version-list p {
  margin: 4px 0;
  font-size: 12px;
  color: var(--text);
}

.version-list small {
  font-size: 11px;
  color: var(--muted);
}

.review-workspace,
.policy-workspace {
  display: grid;
  gap: 12px;
  padding: 17px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 8px 28px rgb(22 63 52 / 5%);
}

.review-header p,
.policy-header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.review-filter {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: #f0f5f3;
  border-radius: 9px;
}

.ai-review-notice {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  background: var(--blue-soft);
  border-color: #cbdfea;
}

.ai-review-notice > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  color: var(--blue);
  background: #fff;
  border-radius: 9px;
}

.ai-review-notice strong {
  font-size: 13px;
  color: #285d88;
}

.ai-review-notice p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #517493;
}

.suggestion-list {
  display: grid;
  gap: 10px;
}

.suggestion-list article {
  padding: 14px;
}

.suggestion-list article.is-accepted {
  background: #f4faf7;
}

.suggestion-list article.is-ignored {
  background: #f7f8f8;
  opacity: 0.72;
}

.suggestion-list article > header {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.suggestion-title {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.suggestion-title h3 {
  width: 100%;
  margin: 2px 0 0;
  font-size: 15px;
  color: var(--ink);
}

.confidence {
  display: grid;
  flex: none;
  min-width: 84px;
  padding: 7px 9px;
  text-align: center;
  background: #f1f7f5;
  border-radius: 9px;
}

.confidence span {
  font-size: 10px;
  color: var(--muted);
}

.confidence strong {
  font-size: 16px;
  color: var(--p);
}

.suggestion-summary {
  margin: 10px 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}

.source-quote {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 18px;
  gap: 8px;
  align-items: start;
  width: 100%;
  min-height: 58px;
  padding: 9px 11px;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  background: #f6f9f8;
  border: 1px solid #e2ebe8;
  border-radius: 9px;
  transition:
    background 180ms ease,
    border-color 180ms ease;
}

.source-quote:hover {
  background: #edf6f3;
  border-color: var(--strong);
}

.source-quote > svg {
  margin-top: 2px;
  color: var(--p);
}

.source-quote > span {
  display: grid;
  gap: 3px;
}

.source-quote strong {
  font-size: 11px;
  color: var(--ink);
}

.source-quote small {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.suggestion-list article > footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}

.suggestion-list article > footer > span {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
}

.suggestion-list article > footer > div {
  display: flex;
  gap: 7px;
}

.empty-review {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 30px;
  text-align: center;
}

.empty-review > span {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  font-size: 30px;
  color: var(--p);
  background: #e8f4f0;
  border-radius: 50%;
}

.empty-review h3 {
  margin: 14px 0 4px;
  color: var(--ink);
}

.empty-review p {
  margin: 0 0 15px;
  font-size: 12px;
  color: var(--muted);
}

.policy-file-list {
  display: grid;
  gap: 8px;
}

.policy-file-list article {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 94px auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
}

.file-icon {
  color: var(--p);
  background: #e9f5f1;
}

.file-main {
  min-width: 0;
}

.file-main header {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
}

.file-main strong {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
}

.file-main p {
  margin: 4px 0 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
}

.file-main > div {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.file-main > div span {
  padding: 3px 7px;
  font-size: 10px;
  color: var(--muted);
  background: #f2f6f5;
  border-radius: 999px;
}

.file-impact {
  display: grid;
  text-align: center;
}

.file-impact span,
.file-impact small {
  font-size: 10px;
  color: var(--muted);
}

.file-impact strong {
  font-size: 18px;
  color: var(--p);
}

.policy-hub :deep(.ant-btn) {
  min-height: 38px;
  color: #28584d;
  background: #fff;
  border-color: #c7dcd6;
  box-shadow: none;
}

.policy-hub :deep(.ant-btn:hover) {
  color: var(--p);
  background: #f2f8f6;
  border-color: #8ebfb2;
}

.policy-hub :deep(.ant-btn:focus-visible) {
  outline: 3px solid rgb(11 128 111 / 20%);
  outline-offset: 1px;
}

.policy-hub :deep(.ant-btn-primary),
.policy-hub :deep(.policy-primary-button) {
  color: #fff !important;
  background: var(--p) !important;
  border-color: var(--p) !important;
}

.policy-hub :deep(.ant-btn-primary:hover),
.policy-hub :deep(.policy-primary-button:hover) {
  color: #fff !important;
  background: var(--ph) !important;
  border-color: var(--ph) !important;
}

.policy-hub :deep(.ant-btn:disabled) {
  color: #8a9b95 !important;
  background: #f2f5f4 !important;
  border-color: #dde6e3 !important;
}

.policy-hub :deep(.ant-btn-dangerous:not(:disabled)) {
  color: #a53e36 !important;
  background: #fff !important;
  border-color: #e5b9b4 !important;
}

.policy-hub :deep(.ant-btn-dangerous:not(:disabled):hover) {
  color: #8f2f29 !important;
  background: #fff7f6 !important;
  border-color: #d98f88 !important;
}

.policy-warning-button {
  color: #81500f !important;
  background: #fff9ef !important;
  border-color: #e8c894 !important;
}

.policy-danger-button {
  color: #a8433a !important;
  background: #fff5f3 !important;
  border-color: #e6bbb6 !important;
}

.overlay-title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.overlay-title > span {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #0b6e65;
  background: #e8f4f0;
  border-radius: 9px;
}

.overlay-title > div {
  display: grid;
  gap: 1px;
}

.overlay-title strong {
  font-size: 14px;
  color: #153a32;
}

.overlay-title small {
  font-size: 11px;
  color: #6d827b;
}

.source-drawer-body {
  display: grid;
  gap: 14px;
  color: #365b52;
}

.source-identity {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  background: #f3f8f6;
  border: 1px solid #d5e4df;
  border-radius: 12px;
}

.source-identity > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 22px;
  color: #0b6e65;
  background: #fff;
  border-radius: 11px;
}

.source-identity h2 {
  margin: 5px 0 3px;
  font-size: 17px;
  color: #153a32;
}

.source-identity p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #5d766f;
}

.source-meta {
  margin: 0;
}

.drawer-section {
  padding: 14px;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 12px;
}

.impact-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 11px;
}

.impact-chips span {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 6px 9px;
  font-size: 12px;
  color: #245a4e;
  background: #edf6f3;
  border-radius: 8px;
}

.parsing-summary {
  display: grid;
  gap: 7px;
  margin-top: 11px;
}

.parsing-summary > div {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: #f7faf9;
  border-radius: 8px;
}

.parsing-summary > div > svg {
  font-size: 17px;
  color: #0b6e65;
}

.parsing-summary span {
  display: grid;
  gap: 1px;
}

.parsing-summary strong {
  font-size: 12px;
  color: #153a32;
}

.parsing-summary small {
  font-size: 11px;
  color: #6d827b;
}

.source-citation {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 12px;
  background: #edf6fb;
  border: 1px solid #cbdfea;
  border-radius: 11px;
}

.source-citation > svg {
  flex: none;
  color: #356f9f;
}

.source-citation strong {
  font-size: 12px;
  color: #285d88;
}

.source-citation p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #517493;
}

.drawer-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 2px;
}

.edit-suggestion-form,
.version-compare,
.publish-confirmation,
.upload-flow {
  color: #365b52;
}

.modal-notice {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: #4a6c63;
  background: #edf6f3;
  border: 1px solid #cfe3dc;
  border-radius: 9px;
}

.modal-notice > svg {
  flex: none;
  margin-top: 2px;
  color: #0b6e65;
}

.edit-suggestion-form label {
  display: block;
  margin: 14px 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #153a32;
}

.edit-suggestion-form textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.65;
  color: #244d43;
  resize: vertical;
  outline: none;
  background: #fff;
  border: 1px solid #c7dcd6;
  border-radius: 9px;
}

.edit-suggestion-form textarea:focus {
  border-color: #0b806f;
  box-shadow: 0 0 0 3px rgb(11 128 111 / 15%);
}

.version-compare > header {
  display: grid;
  grid-template-columns: 1fr 30px 1fr;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: #f3f8f6;
  border-radius: 11px;
}

.version-compare > header > div {
  display: grid;
  gap: 3px;
}

.version-compare > header span {
  font-size: 11px;
  color: #6d827b;
}

.version-compare > header strong {
  font-size: 14px;
  color: #153a32;
}

.version-compare > header > svg {
  justify-self: center;
  color: #0b6e65;
}

.change-list {
  display: grid;
  gap: 8px;
  margin: 12px 0;
}

.change-list article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 11px;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 10px;
}

.change-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
}

.change-icon.is-new {
  color: #0b6e65;
  background: #e8f4f0;
}

.change-icon.is-change {
  color: #356f9f;
  background: #edf6fb;
}

.change-list strong {
  font-size: 13px;
  color: #153a32;
}

.change-list p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #5d766f;
}

.version-impact {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 11px;
  background: #edf6f3;
  border-radius: 9px;
}

.version-impact > svg {
  flex: none;
  color: #0b6e65;
}

.version-impact strong {
  font-size: 12px;
  color: #153a32;
}

.version-impact p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #5d766f;
}

.version-compare > footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 14px;
}

.publish-confirmation {
  display: grid;
  gap: 12px;
}

.publish-confirmation > section {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px;
  background: #f3f8f6;
  border-radius: 11px;
}

.publish-confirmation > section > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  color: #0b6e65;
  background: #fff;
  border-radius: 10px;
}

.publish-confirmation h3 {
  margin: 5px 0 2px;
  font-size: 16px;
  color: #153a32;
}

.publish-confirmation p {
  margin: 0;
  font-size: 12px;
  color: #6d827b;
}

.upload-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 0;
  margin: 0 0 16px;
  list-style: none;
}

.upload-steps li {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 54px;
  padding: 8px;
  color: #73867f;
  background: #f5f8f7;
  border: 1px solid #e1e9e6;
  border-radius: 9px;
}

.upload-steps li > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 12px;
  font-weight: 800;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 50%;
}

.upload-steps li > div {
  display: grid;
  gap: 1px;
}

.upload-steps strong {
  font-size: 12px;
}

.upload-steps small {
  font-size: 10px;
}

.upload-steps li.is-active {
  color: #0b6e65;
  background: #eaf5f1;
  border-color: #9fc9bd;
}

.upload-steps li.is-done {
  color: #397667;
  background: #f0f8f5;
}

.upload-steps li.is-done > span {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.upload-form-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(220px, 0.55fr);
  gap: 12px;
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 330px;
  padding: 24px;
  text-align: center;
  background: #f7faf9;
  border: 1px dashed #9fc9bd;
  border-radius: 12px;
}

.upload-zone > span {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  font-size: 28px;
  color: #0b6e65;
  background: #e5f3ee;
  border-radius: 16px;
}

.upload-zone h3 {
  margin: 0;
  font-size: 17px;
  color: #153a32;
}

.upload-zone p {
  max-width: 460px;
  margin: 6px 0 15px;
  font-size: 12px;
  line-height: 1.7;
  color: #6d827b;
}

.upload-zone > button {
  min-height: 40px;
  padding: 0;
  margin-top: 10px;
  font-size: 12px;
  color: #0b6e65;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.upload-zone > button:hover {
  text-decoration: underline;
}

.upload-zone > button:focus-visible {
  outline: 3px solid rgb(11 128 111 / 20%);
  outline-offset: 3px;
}

.upload-boundary {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 14px;
  background: #edf6fb;
  border: 1px solid #cbdfea;
  border-radius: 12px;
}

.upload-boundary > svg {
  flex: none;
  margin-top: 2px;
  font-size: 20px;
  color: #356f9f;
}

.upload-boundary strong {
  font-size: 13px;
  color: #285d88;
}

.upload-boundary p {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: #517493;
}

.parsing-panel {
  display: grid;
  gap: 13px;
  padding: 16px;
  background: #f7faf9;
  border: 1px solid #d5e4df;
  border-radius: 12px;
}

.parsing-panel > header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.parsing-panel > header > span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: #0b6e65;
  background: #e8f4f0;
  border-radius: 10px;
}

.parsing-panel header > div {
  display: grid;
  gap: 2px;
}

.parsing-panel strong {
  font-size: 13px;
  color: #153a32;
}

.parsing-panel small {
  font-size: 11px;
  color: #6d827b;
}

.parsing-panel header > b {
  font-size: 18px;
  color: #0b6e65;
}

.parsing-tasks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.parsing-tasks > div {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 58px;
  padding: 8px;
  color: #8b9b96;
  background: #fff;
  border: 1px solid #e2ebe8;
  border-radius: 9px;
}

.parsing-tasks > div.is-done {
  color: #0b6e65;
  border-color: #c8dfd8;
}

.parsing-tasks > div > svg {
  font-size: 18px;
}

.parsing-tasks span {
  display: grid;
  gap: 2px;
}

.parsing-tasks strong {
  font-size: 12px;
  color: inherit;
}

.parsing-tasks small {
  font-size: 10px;
}

.upload-review-panel {
  display: grid;
  gap: 12px;
}

.upload-review-panel > header {
  display: flex;
  gap: 11px;
  align-items: flex-start;
  padding: 13px;
  background: #edf6f3;
  border-radius: 11px;
}

.upload-review-panel > header > span {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  color: #0b6e65;
  background: #fff;
  border-radius: 10px;
}

.upload-review-panel h3 {
  margin: 5px 0 2px;
  font-size: 16px;
  color: #153a32;
}

.upload-review-panel p {
  margin: 0;
  font-size: 12px;
  color: #6d827b;
}

.parse-result-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.parse-result-grid article {
  display: grid;
  padding: 10px;
  text-align: center;
  background: #f7faf9;
  border: 1px solid #d5e4df;
  border-radius: 9px;
}

.parse-result-grid span,
.parse-result-grid small {
  font-size: 10px;
  color: #6d827b;
}

.parse-result-grid strong {
  margin: 2px 0;
  font-size: 20px;
  color: #0b6e65;
}

.detected-rules {
  display: grid;
  gap: 8px;
}

.detected-rules article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 11px;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 9px;
}

.detected-rules article > svg {
  flex: none;
  margin-top: 2px;
  color: #0b6e65;
}

.detected-rules strong {
  font-size: 12px;
  color: #153a32;
}

.detected-rules p {
  margin: 3px 0;
  font-size: 12px;
  color: #4f6f66;
}

.detected-rules small {
  font-size: 10px;
  color: #6d827b;
}

.upload-review-panel > footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.upload-done-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 330px;
  text-align: center;
}

.upload-done-panel > span {
  display: grid;
  place-items: center;
  width: 66px;
  height: 66px;
  font-size: 32px;
  color: #0b6e65;
  background: #e6f4ef;
  border-radius: 50%;
}

.upload-done-panel h3 {
  margin: 14px 0 4px;
  font-size: 18px;
  color: #153a32;
}

.upload-done-panel p {
  margin: 0 0 16px;
  font-size: 12px;
  color: #6d827b;
}

:global(.generated-policy-drawer .ant-drawer-content),
:global(.generated-policy-drawer .ant-drawer-header),
:global(.generated-policy-drawer .ant-drawer-body) {
  color: #365b52 !important;
  background: #eef3f1 !important;
}

:global(.generated-policy-drawer .ant-drawer-header) {
  background: #fff !important;
  border-bottom-color: #cddbd7 !important;
}

:global(.generated-policy-drawer .ant-drawer-title) {
  color: #153a32 !important;
}

.generated-policy-loading,
.generated-policy-preview {
  display: grid;
  gap: 14px;
}

.generated-policy-loading {
  place-items: center;
  min-height: 470px;
  padding: 32px;
  text-align: center;
  background: #fff;
  border: 1px solid #d3dfdb;
  border-radius: 13px;
}

.generated-policy-loading > span {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  font-size: 28px;
  color: #0b6e65;
  background: #e7f2ee;
  border-radius: 15px;
}

.generated-policy-loading h3 {
  margin: 0;
  font-size: 18px;
  color: #153a32;
}

.generated-policy-loading p {
  max-width: 520px;
  margin: -6px 0 4px;
  font-size: 12px;
  line-height: 1.6;
  color: #6d827b;
}

.generated-policy-loading :deep(.ant-progress) {
  width: min(520px, 100%);
}

.generated-policy-loading > div {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: min(520px, 100%);
}

.generated-policy-loading > div span {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 9px 10px;
  font-size: 12px;
  color: #81928d;
  text-align: left;
  background: #f5f8f7;
  border: 1px solid #e0e8e5;
  border-radius: 8px;
}

.generated-policy-loading > div span.is-done {
  color: #246256;
  background: #edf6f2;
  border-color: #c8ded7;
}

.generated-policy-preview > header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #d3dfdb;
  border-radius: 12px;
}

.generated-policy-preview > header > span {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  font-size: 22px;
  color: #0b6e65;
  background: #e7f2ee;
  border-radius: 12px;
}

.generated-policy-preview > header small,
.generated-policy-preview > header p,
.generated-policy-preview article p,
.generated-policy-preview article small,
.generated-policy-file small,
.generated-policy-preview > aside {
  font-size: 12px;
}

.generated-policy-preview > header small {
  font-weight: 800;
  color: #0b6e65;
}

.generated-policy-preview > header h3 {
  margin: 3px 0;
  font-size: 18px;
  color: #153a32;
}

.generated-policy-preview > header p,
.generated-policy-preview article p,
.generated-policy-preview article small,
.generated-policy-file small {
  margin: 0;
  line-height: 1.6;
  color: #6d827b;
}

.generated-policy-file {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 13px 14px;
  background: #f8fbfa;
  border: 1px solid #c9dbd5;
  border-radius: 10px;
}

.generated-policy-file > span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  font-size: 20px;
  color: #2563a7;
  background: #eaf3fc;
  border-radius: 10px;
}

.generated-policy-file > div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.generated-policy-file strong {
  overflow: hidden;
  font-size: 13px;
  color: #234b41;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.generated-policy-file > a {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 700;
  color: #28584d;
  text-decoration: none;
  background: #fff;
  border: 1px solid #bdd3cc;
  border-radius: 8px;
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.generated-policy-file > a:hover,
.generated-policy-file > a:focus-visible {
  color: #0b6e65;
  background: #edf6f2;
  border-color: #79a99e;
  outline: none;
}

.generated-policy-preview > article {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  background: #fff;
  border: 1px solid #d3dfdb;
  border-radius: 10px;
}

.generated-policy-preview > article > span {
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
}

.generated-policy-preview article strong {
  font-size: 13px;
  color: #234b41;
}

.generated-policy-preview > aside {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 12px;
  line-height: 1.6;
  color: #7b541e;
  background: #fff7e9;
  border: 1px solid #ecd5ae;
  border-radius: 9px;
}

.generated-policy-preview > aside svg {
  flex: none;
  margin-top: 2px;
}

.generated-policy-preview > footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

:global(.policy-light-drawer .ant-drawer-content),
:global(.policy-light-drawer .ant-drawer-header),
:global(.policy-light-drawer .ant-drawer-body),
:global(.policy-light-modal .ant-modal-content),
:global(.policy-light-modal .ant-modal-header),
:global(.policy-light-modal .ant-modal-body),
:global(.policy-light-modal .ant-modal-footer) {
  color: #365b52 !important;
  background: #fff !important;
}

:global(.policy-light-drawer .ant-drawer-header) {
  border-bottom-color: #d5e4df !important;
}

:global(.policy-light-drawer .ant-drawer-close),
:global(.policy-light-modal .ant-modal-close) {
  color: #315f54 !important;
  background: #f1f7f5 !important;
  border-radius: 8px;
}

:global(.policy-light-modal .ant-modal-title) {
  color: #153a32 !important;
}

:global(.policy-light-drawer .ant-btn),
:global(.policy-light-modal .ant-btn) {
  color: #28584d !important;
  background: #fff !important;
  border-color: #c7dcd6 !important;
  box-shadow: none !important;
}

:global(.policy-light-drawer .ant-btn:hover),
:global(.policy-light-modal .ant-btn:hover) {
  color: #0b6e65 !important;
  background: #f2f8f6 !important;
  border-color: #8ebfb2 !important;
}

:global(.policy-light-drawer .ant-btn-primary),
:global(.policy-light-modal .ant-btn-primary),
:global(.policy-light-drawer .policy-primary-button),
:global(.policy-light-modal .policy-primary-button) {
  color: #fff !important;
  background: #0b6e65 !important;
  border-color: #0b6e65 !important;
}

:global(.policy-light-drawer .ant-btn-primary:hover),
:global(.policy-light-modal .ant-btn-primary:hover),
:global(.policy-light-drawer .policy-primary-button:hover),
:global(.policy-light-modal .policy-primary-button:hover) {
  color: #fff !important;
  background: #075c54 !important;
  border-color: #075c54 !important;
}

:global(.policy-light-modal .ant-btn-dangerous.ant-btn-primary),
:global(.policy-light-modal .ant-btn-dangerous.ant-btn-primary:hover) {
  color: #fff !important;
  background: #b3483f !important;
  border-color: #b3483f !important;
}

@media (max-width: 1180px) {
  .stage-core-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .template-workbench {
    grid-template-columns: 1fr;
  }

  .template-list {
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .template-list__items {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .template-list > footer {
    margin-top: 8px;
  }
}

@media (max-width: 840px) {
  .policy-page-shell :deep(.ai-work-page__header) {
    flex-direction: column;
    align-items: flex-start;
  }

  .policy-page-shell :deep(.ai-work-page__actions) {
    flex-wrap: wrap;
  }

  .create-step-navigation {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .create-step-navigation button:nth-child(2n) {
    border-right: 0;
  }

  .create-step-navigation button:nth-child(-n + 4) {
    border-bottom: 1px solid #e1eae7;
  }

  .source-choice-grid,
  .review-stat-grid,
  .review-stage-flow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .template-analysis-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .risk-rule-content {
    grid-template-columns: 1fr;
  }

  .metric-grid article {
    grid-template-columns: 34px minmax(0, 1fr);
    column-gap: 8px;
    min-height: 70px;
    padding: 10px;
  }

  .metric-icon {
    width: 34px;
    height: 34px;
    font-size: 16px;
  }

  .metric-grid strong {
    font-size: 20px;
  }

  .metric-grid article > div span {
    font-size: 11px;
  }

  .metric-grid small {
    display: none;
  }

  .page-tabs small {
    display: none;
  }

  .page-tabs button {
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
    min-width: 0;
    min-height: 68px;
    padding: 5px 3px;
    text-align: center;
  }

  .page-tabs button > span:first-child {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .page-tabs button > span:nth-child(2) strong {
    font-size: 12px;
    white-space: nowrap;
  }

  .page-tabs button > b {
    position: absolute;
    top: 4px;
    right: 4px;
  }

  .template-list__items {
    grid-template-columns: 1fr;
  }

  .template-detail__header,
  .review-header,
  .policy-header,
  .section-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-actions {
    flex-wrap: wrap;
  }

  .overview-panel,
  .gate-grid {
    grid-template-columns: 1fr;
  }

  .source-card,
  .governance-note {
    grid-column: 1;
  }

  .source-list {
    grid-template-columns: 1fr;
  }

  .stages-panel {
    grid-template-columns: 1fr;
  }

  .stage-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .policy-file-list article {
    grid-template-columns: 44px minmax(0, 1fr) auto;
  }

  .file-impact {
    display: none;
  }

  .upload-form-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .create-step-navigation {
    display: flex;
    overflow-x: auto;
  }

  .create-step-navigation button {
    min-width: 160px;
    border-right: 1px solid #e1eae7;
    border-bottom: 0 !important;
  }

  .create-workspace {
    min-height: 0;
    padding: 15px;
  }

  .template-analysis-state {
    min-height: 0;
    padding: 14px;
  }

  .template-analysis-state > header {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .template-analysis-state > header > strong {
    grid-column: 2;
    font-size: 18px;
  }

  .template-analysis-steps {
    grid-template-columns: 1fr;
  }

  .risk-suggestion-note,
  .policy-regeneration-card {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .risk-suggestion-note > :deep(.ant-btn),
  .policy-regeneration-card > :deep(.ant-btn) {
    grid-column: 2;
    justify-self: start;
  }

  .risk-rule-meta {
    grid-template-columns: 1fr;
  }

  .risk-rule-card > summary {
    grid-template-columns: 36px minmax(0, 1fr) 18px;
  }

  .risk-rule-card > summary :deep(.ant-tag) {
    grid-column: 2;
    justify-self: start;
  }

  .risk-rule-editor > header {
    flex-direction: column;
    align-items: stretch;
  }

  .risk-rule-editor > header > div {
    flex-wrap: wrap;
  }

  .generated-policy-loading {
    min-height: 0;
    padding: 18px;
  }

  .generated-policy-loading > div {
    grid-template-columns: 1fr;
  }

  .generated-policy-preview > footer {
    flex-wrap: wrap;
  }

  .generated-policy-file {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .generated-policy-file > a {
    grid-column: 1 / -1;
    justify-content: center;
  }

  .create-section-heading.is-horizontal,
  .create-flow-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .create-flow-footer > div {
    justify-content: flex-end;
  }

  .source-choice-grid,
  .create-form-grid,
  .stage-core-grid,
  .stage-rule-grid,
  .stage-prompt-grid,
  .prompt-rule-panel,
  .review-stat-grid,
  .review-stage-flow,
  .template-review-hero {
    grid-template-columns: 1fr;
  }

  .create-form-grid label.is-wide {
    grid-column: auto;
  }

  .template-review-hero > span {
    display: none;
  }

  .review-meta {
    flex-wrap: wrap;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .page-tabs {
    grid-template-columns: 1fr;
  }

  .page-tabs button {
    min-height: 52px;
  }

  .template-detail {
    padding: 13px;
  }

  .detail-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .stage-list {
    grid-template-columns: 1fr;
  }

  .stage-detail > header,
  .deliverable-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .stage-editor-actions,
  .deliverable-heading-actions {
    flex-wrap: wrap;
  }

  .deliverable-edit-grid {
    grid-template-columns: 1fr;
  }

  .deliverable-remove-button {
    justify-self: end;
  }

  .deliverable-list article header {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .deliverable-list article :deep(.ant-tag) {
    grid-column: 2;
    justify-self: start;
  }

  .deliverable-list p {
    margin-left: 0;
  }

  .exception-list article {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .exception-list article :deep(.ant-btn) {
    grid-column: 2;
    justify-self: start;
  }

  .gap-callout {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .gap-callout :deep(.ant-btn) {
    margin-left: 31px;
  }

  .suggestion-list article > footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .suggestion-list article > footer > div {
    flex-wrap: wrap;
  }

  .source-quote small {
    white-space: normal;
  }

  .policy-file-list article {
    grid-template-columns: 40px minmax(0, 1fr);
  }

  .policy-file-list article > :deep(.ant-btn) {
    grid-column: 2;
    justify-self: start;
  }

  .template-summary-card dl,
  .source-meta,
  .publish-confirmation dl {
    grid-template-columns: 1fr;
  }

  .upload-steps {
    grid-template-columns: 1fr;
  }

  .parsing-tasks,
  .parse-result-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-tabs button,
  .template-list__items > button,
  .detail-tabs button,
  .stage-list button,
  .source-list button,
  .source-quote {
    transition: none;
  }

  .is-spinning {
    animation: none;
  }
}
</style>
