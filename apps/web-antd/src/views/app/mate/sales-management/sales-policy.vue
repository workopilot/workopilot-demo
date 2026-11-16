<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import { computed, onBeforeUnmount, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Input, Progress, Tag, Upload, message } from 'ant-design-vue';

import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

type PageTab = 'framework' | 'sources' | 'templates';
type ImportStep = 'parsing' | 'review' | 'source';
type RuleStatus = '待补充' | '待确认' | '已确认';
type FlowEditorStep = 'ai' | 'goal' | 'publish' | 'stages';

interface PolicyChapter {
  aiRole: string;
  complete: number;
  description: string;
  icon: string;
  id: string;
  rules: PolicyRule[];
  title: string;
}

interface PolicyRule {
  id: string;
  name: string;
  parameters?: RuleParameter[];
  source: string;
  status: RuleStatus;
  summary: string;
}

interface RuleParameter {
  label: string;
  unit: string;
  value: string;
}

interface StageMaterial {
  description: string;
  name: string;
  required: boolean;
  verifier: string;
}

interface SalesFlowStage {
  aiActions: string;
  duration: string;
  entryCriteria: string;
  exitCriteria: string;
  id: string;
  materials: StageMaterial[];
  name: string;
  owner: string;
}

interface SalesFlowTemplate {
  aiInstruction: string;
  completionCriteria: string;
  description: string;
  icon: string;
  id: string;
  name: string;
  objective: string;
  opportunityTypes: string;
  stages: SalesFlowStage[];
  status: '草稿' | '待确认' | '已发布';
}

const activeTab = ref<PageTab>('framework');
const activeChapterId = ref('registration');
const importOpen = ref(false);
const generateOpen = ref(false);
const sourceText = ref('');
const sourceFileName = ref('');
const importStep = ref<ImportStep>('source');
const parseProgress = ref(0);
const parseStage = ref('读取制度文件');
const editOpen = ref(false);
const templateDrawerOpen = ref(false);
const flowEditorStep = ref<FlowEditorStep>('goal');
const editingTemplateId = ref('');
const editingRuleId = ref('');
const editingRule = ref({
  name: '',
  parameters: [] as RuleParameter[],
  source: '',
  status: '待确认' as RuleStatus,
  summary: '',
});
const editingTemplate = ref<SalesFlowTemplate>({
  aiInstruction: '',
  completionCriteria: '',
  description: '',
  icon: 'lucide:sparkles',
  id: '',
  name: '',
  objective: '',
  opportunityTypes: '',
  stages: [],
  status: '草稿',
});
const selectedStageId = ref('');
let parseTimer: number | undefined;

const importSteps: Array<{ key: ImportStep; label: string; description: string }> = [
  { key: 'source', label: '上传制度', description: '提供制度或历史规则' },
  { key: 'parsing', label: 'AI 解析', description: '识别章节、规则与缺口' },
  { key: 'review', label: '确认结果', description: '人工审阅后写入制度' },
];

const flowEditorSteps: Array<{
  description: string;
  key: FlowEditorStep;
  label: string;
}> = [
  { key: 'goal', label: '流程目标', description: '定义适用场景和完成结果' },
  { key: 'stages', label: '阶段设置', description: '配置阶段与准入准出' },
  { key: 'ai', label: 'AI 执行', description: '设置检查与辅助动作' },
  { key: 'publish', label: '确认发布', description: '检查规则并发布版本' },
];

const aiExecutionModes = ref([
  {
    enabled: true,
    icon: 'lucide:scan-search',
    level: '自动执行',
    name: '信息提取与制度匹配',
    description: '从口述和材料中提取客户、来源、需求，匹配流程及已确认制度规则。',
  },
  {
    enabled: true,
    icon: 'lucide:list-checks',
    level: '自动执行',
    name: '阶段条件与缺口检查',
    description: '检查进入下一阶段所需的事实和材料，指出缺失项并生成追问。',
  },
  {
    enabled: true,
    icon: 'lucide:wand-sparkles',
    level: '生成建议',
    name: '跟进动作与材料草稿',
    description: '根据当前阶段生成拜访准备、跟进建议和周报素材，由销售确认后使用。',
  },
  {
    enabled: true,
    icon: 'lucide:calendar-clock',
    level: '自动执行',
    name: '跟进提醒与公海计时',
    description: '按制度参数计算首次跟进、无效进展提醒、保护期和公海回收时间。',
  },
  {
    enabled: true,
    icon: 'lucide:notebook-tabs',
    level: '生成建议',
    name: '拜访准备与进度汇报',
    description: '结合阶段资料生成拜访清单、售前材料和周报，销售确认后提交或发送。',
  },
  {
    enabled: true,
    icon: 'lucide:user-round-check',
    level: '人工确认',
    name: '归属裁决与规则发布',
    description: 'AI 只整理证据与适用条款，归属争议、例外审批和模板发布由人决定。',
  },
]);

const parsedRules = ref([
  {
    chapter: '商机报备与归属',
    confidence: 96,
    name: '所有商机必须先完成备案',
    source: '原文第 2 条：所有人员获取的商机均须向市场部登记备案。',
    status: '已提取',
  },
  {
    chapter: '业绩与提成',
    confidence: 88,
    name: '公司级商机成交后的来源奖励',
    source: '原文第 7 条：从销售端扣取的 5% 中拿出 1% 奖励市场部。',
    status: '需确认',
  },
  {
    chapter: '销售推进与跟进',
    confidence: 72,
    name: '无进展商机的公海回收',
    source: '原文只要求长期无进展时回收，未明确有效跟进和时间周期。',
    status: '有缺口',
  },
]);

const chapters = ref<PolicyChapter[]>([
  {
    id: 'registration',
    title: '商机报备与归属',
    icon: 'lucide:clipboard-check',
    description: '明确什么可以报、归谁负责，以及发生重复或跨范围报备时如何处理。',
    complete: 74,
    aiRole: '报备时抽取客户与来源信息，执行查重和范围检查；争议交由人工裁决。',
    rules: [
      {
        id: 'r1',
        name: '报备成立条件',
        summary: '客户主体、商机来源、联系人和初步需求完整后，才进入归属判断。',
        source: '9 月销售制度讨论纪要 · 03:00',
        status: '已确认',
      },
      {
        id: 'r2',
        name: '客户与销售范围',
        summary: '支持按区域、行业或产品线匹配负责人；跨范围报备进入协同确认。',
        source: '9 月销售制度讨论纪要 · 19:49',
        status: '待确认',
      },
      {
        id: 'r3',
        name: '重复报备与集团客户',
        summary: '需要补充同集团不同法人、多人同时接触和公开招标的归属标准。',
        source: 'AI 识别的制度缺口',
        status: '待补充',
      },
      {
        id: 'r4',
        name: '报备发起与受理职责',
        summary: '所有人员均可发起商机报备，市场部负责资料完整性检查和备案管理，归属争议不由市场部单方裁决。',
        source: '9 月销售制度讨论纪要 · 11:38',
        status: '待确认',
        parameters: [
          { label: '资料补充期限', value: '2', unit: '个工作日' },
          { label: '备案处理时限', value: '1', unit: '个工作日' },
        ],
      },
      {
        id: 'r5',
        name: '报备状态与成功判定',
        summary: '报备依次经过待补充、查重中、待归属、备案成功或驳回；客户核验通过不代表归属已经确认。',
        source: 'AI 根据原始需求补全的执行状态',
        status: '待确认',
      },
      {
        id: 'r6',
        name: '跟进数量上限与公开招标',
        summary: '限制单个销售同时保护的有效商机数；公开招标由公司指定统一牵头人，多渠道线索保留来源记录但不重复建立商机。',
        source: '9 月销售制度讨论纪要 · 12:35',
        status: '待补充',
        parameters: [
          { label: '单销售有效商机上限', value: '20', unit: '个' },
          { label: '超限申请审批人', value: '销售负责人', unit: '' },
        ],
      },
    ],
  },
  {
    id: 'progress',
    title: '销售推进与跟进',
    icon: 'lucide:route',
    description: '定义不同销售类型的阶段、阶段要求、有效跟进和公海回收。',
    complete: 61,
    aiRole: '整理跟进事实、判断阶段条件、提示下一步，并从日常记录生成周报素材。',
    rules: [
      {
        id: 'p1',
        name: '阶段与准入准出',
        summary: '新签、续约、增购分别使用流程模板，每个阶段配置成果和通过标准。',
        source: '销售流程框架草案',
        status: '待确认',
      },
      {
        id: 'p2',
        name: '有效跟进与保护期',
        summary: '跟进记录必须包含客户反馈、下一步动作和约定时间；只有有效跟进才会重置保护期。',
        source: '9 月销售制度讨论纪要 · 08:03',
        status: '待确认',
        parameters: [
          { label: '首次跟进期限', value: '3', unit: '个工作日' },
          { label: '无有效进展提醒', value: '7', unit: '天' },
          { label: '商机保护期', value: '30', unit: '天' },
        ],
      },
      {
        id: 'p3',
        name: '公海回收',
        summary: '超过无效跟进期限后先提醒责任人；仍无有效进展时进入待回收，并保留申诉期。',
        source: '9 月销售制度讨论纪要 · 12:35',
        status: '待确认',
        parameters: [
          { label: '连续无有效进展', value: '15', unit: '天' },
          { label: '回收前提醒', value: '3', unit: '天前' },
          { label: '申诉期限', value: '2', unit: '个工作日' },
        ],
      },
      {
        id: 'p4',
        name: '进度汇报与周报生成',
        summary: '销售只维护日常跟进事实，AI 自动汇总阶段变化、客户反馈、风险和下一步计划。',
        source: '9 月销售制度讨论纪要 · 08:03',
        status: '待确认',
        parameters: [
          { label: '跟进记录提交', value: '每次沟通后', unit: '当天' },
          { label: '周报汇总截止', value: '周五', unit: '17:00' },
          { label: '大额商机专项汇报', value: '50', unit: '万元以上' },
        ],
      },
    ],
  },
  {
    id: 'performance',
    title: '业绩与提成',
    icon: 'lucide:badge-dollar-sign',
    description: '统一业绩认定、协作分配、提成计算和结算调整口径。',
    complete: 46,
    aiRole: '解释计算结果、标注数据来源和规则版本，异常金额提交人工复核。',
    rules: [
      {
        id: 'c1',
        name: '业绩认定口径',
        summary: '需要确认按签约、开票、回款还是毛利认定，以及新签、续约、增购差异。',
        source: 'AI 识别的制度缺口',
        status: '待补充',
        parameters: [
          { label: '默认业绩口径', value: '实际回款额', unit: '' },
          { label: '含税口径', value: '不含税', unit: '' },
          { label: '结算频率', value: '每月', unit: '' },
        ],
      },
      {
        id: 'c2',
        name: '来源人与销售分配',
        summary: '已有“5% 与 1%”讨论素材，计算基数、剩余归属和结算条件待确认。',
        source: '9 月销售制度讨论纪要 · 11:38',
        status: '待补充',
        parameters: [
          { label: '销售端提成素材', value: '5', unit: '%' },
          { label: '市场来源奖励素材', value: '1', unit: '%' },
          { label: '私人关系商机素材', value: '5', unit: '%' },
        ],
      },
      {
        id: 'c3',
        name: '结算与追溯调整',
        summary: '退款、坏账、合同变更及人员离职后的提成调整方式尚未规定。',
        source: 'AI 识别的制度缺口',
        status: '待补充',
      },
      {
        id: 'c4',
        name: '新签、续约与增购差异',
        summary: '三种商机分别配置业绩认定与提成比例；续约同时包含新增范围时，续约金额与增购金额分别核算。',
        source: '流程模板补全规则',
        status: '待补充',
      },
    ],
  },
  {
    id: 'exceptions',
    title: '异常与争议处理',
    icon: 'lucide:scale',
    description: '规定制度未覆盖时由谁裁决、看什么证据，以及裁决如何沉淀。',
    complete: 69,
    aiRole: '汇总双方主张、证据时间线和适用条款，不替代最终裁决人。',
    rules: [
      {
        id: 'e1',
        name: '人工裁决边界',
        summary: '制度没有明确覆盖的归属和利益争议，保留人工最终决策权。',
        source: '9 月销售制度讨论纪要 · 19:49',
        status: '已确认',
      },
      {
        id: 'e2',
        name: '裁决证据与时限',
        summary: '需补充受理人、必要证据、处理时限及是否允许申诉。',
        source: 'AI 识别的制度缺口',
        status: '待补充',
        parameters: [
          { label: '受理时限', value: '1', unit: '个工作日' },
          { label: '裁决时限', value: '3', unit: '个工作日' },
          { label: '申诉期限', value: '2', unit: '个工作日' },
        ],
      },
    ],
  },
  {
    id: 'governance',
    title: '制度发布与版本',
    icon: 'lucide:history',
    description: '管理制度从解析、确认、发布到变更的完整版本，并记录每个商机实际采用的规则版本。',
    complete: 52,
    aiRole: '识别新旧制度差异、分析受影响流程和商机；是否发布或迁移仍由制度负责人确认。',
    rules: [
      {
        id: 'g1',
        name: '制度审核与生效',
        summary: '解析结果由制度负责人审核，审批通过后设置版本号和生效日期；草稿规则不得用于自动裁决。',
        source: '通用制度处理流程',
        status: '待确认',
      },
      {
        id: 'g2',
        name: '版本变更影响',
        summary: '新版本发布时列出受影响流程模板；执行中的商机默认沿用创建时版本，迁移需要负责人确认。',
        source: 'AI 根据制度闭环补全的治理规则',
        status: '待补充',
      },
      {
        id: 'g3',
        name: '个案沉淀为制度',
        summary: '人工裁决只对当前个案生效；需要普遍适用时，转成制度修订建议并重新审核发布。',
        source: '冲突裁决机制补全规则',
        status: '待确认',
      },
    ],
  },
]);

function createStage(
  id: string,
  name: string,
  owner: string,
  duration: string,
  entryCriteria: string,
  exitCriteria: string,
  materials: StageMaterial[],
  aiActions: string,
): SalesFlowStage {
  return {
    aiActions,
    duration,
    entryCriteria,
    exitCriteria,
    id,
    materials,
    name,
    owner,
  };
}

const templates = ref<SalesFlowTemplate[]>([
  {
    id: 'new-sale',
    name: '新签销售流程',
    icon: 'lucide:sparkles',
    status: '草稿',
    stages: [
      createStage(
        'new-register',
        '报备与归属',
        '销售人员 / 市场部',
        '1 个工作日',
        '发现明确客户主体或可验证销售线索。',
        '报备信息完整，客户查重完成，负责人及协作关系已确认。',
        [
          { name: '客户主体核验信息', description: '企业全称、统一社会信用代码及集团关系', required: true, verifier: 'AI 核验 + 市场部确认' },
          { name: '商机来源证明', description: '自拓、市场、渠道或私人关系的来源说明及有效证据', required: true, verifier: '市场部' },
          { name: '联系人与初步需求', description: '联系人、角色、联系方式及客户问题概述', required: true, verifier: '销售负责人' },
        ],
        '从口述中提取报备信息，联网核验客户主体，检查重复报备、销售范围和跟进数量上限。',
      ),
      createStage(
        'new-discovery',
        '需求确认',
        '销售负责人',
        '10 个工作日',
        '报备归属已确认，客户同意进一步沟通。',
        '客户需求、决策链、预算、计划和采购路径达到有效商机标准。',
        [
          { name: '需求访谈纪要', description: '业务现状、痛点、目标、范围和成功标准', required: true, verifier: '客户联系人 / 销售负责人' },
          { name: '客户决策链', description: '使用人、影响人、决策人及采购负责人', required: true, verifier: '销售负责人' },
          { name: '预算与采购计划', description: '预算区间、资金来源、采购方式和预计时间', required: true, verifier: '销售经理' },
        ],
        '整理访谈记录，识别缺失信息，生成下一次沟通提纲并判断商机有效性。',
      ),
      createStage(
        'new-solution',
        '方案验证',
        '销售负责人 / 售前顾问',
        '15 个工作日',
        '有效需求已确认，需要产品、方案、演示或 POC 支持。',
        '客户确认方案方向，演示或验证达到双方约定标准。',
        [
          { name: '客户解决方案', description: '需求对应方案、产品范围、实施边界及假设条件', required: true, verifier: '售前负责人' },
          { name: '演示或 POC 记录', description: '验证场景、结果、问题清单和客户反馈', required: false, verifier: '客户联系人 / 售前负责人' },
          { name: '售前投入审批', description: '涉及 POC、定制或较大投入时的内部审批', required: false, verifier: '销售经理' },
        ],
        '生成售前资料草稿，检查方案是否覆盖需求，汇总验证结果和未关闭问题。',
      ),
      createStage(
        'new-commercial',
        '商务报价',
        '销售负责人',
        '10 个工作日',
        '客户认可方案方向，产品和交付范围可以报价。',
        '价格、付款、交付范围及关键商务条件形成一致意见。',
        [
          { name: '正式报价单', description: '产品、数量、价格、税率、有效期和付款条件', required: true, verifier: '销售经理' },
          { name: '折扣或特殊条款审批', description: '超权限折扣、赠送、账期和特殊承诺的审批记录', required: false, verifier: '授权审批人' },
          { name: '商务沟通纪要', description: '客户异议、谈判结果和双方待办', required: true, verifier: '销售负责人' },
        ],
        '按权限规则检查报价，识别超限折扣和特殊承诺，生成审批材料与谈判清单。',
      ),
      createStage(
        'new-contract',
        '合同签订',
        '销售负责人 / 法务 / 财务',
        '10 个工作日',
        '商务条件基本一致，具备合同评审条件。',
        '双方合同签署并生效，订单范围和业绩归属完整，完成交付移交。',
        [
          { name: '合同评审记录', description: '商务、法务、财务和交付对关键条款的确认', required: true, verifier: '合同审批人' },
          { name: '已签署合同', description: '双方签章且版本一致的正式合同', required: true, verifier: '法务 / 销售负责人' },
          { name: '销售转交清单', description: '客户承诺、产品范围、交付边界、回款计划及联系人', required: true, verifier: '交付负责人' },
        ],
        '核对合同与报价差异，提取履约承诺和回款节点，生成交付移交清单。',
      ),
    ],
    description: '适用于首次购买或已有客户采购独立新业务。',
    opportunityTypes: '首次合作；老客户购买独立的新产品或新业务',
    objective:
      '将已完成有效报备的新签商机，按可验证的客户承诺逐步推进至合同正式生效。',
    completionCriteria:
      '合同已完成双方签署并生效；客户主体、合同金额、产品范围和业绩归属均已确认。',
    aiInstruction:
      '优先检查已确认的报备与归属规则；仅以客户明确反馈、文件和审批结果作为阶段判断依据；规则缺失时提出补充问题，不自行裁决。',
  },
  {
    id: 'renewal',
    name: '续约销售流程',
    icon: 'lucide:refresh-cw',
    status: '待确认',
    stages: [
      createStage('renew-alert', '到期提醒', '客户负责人', '到期前 90 天', '原合同进入续约提醒周期。', '原合同、客户负责人和续约窗口已确认。', [
        { name: '原合同与到期信息', description: '合同编号、服务范围、金额和到期日', required: true, verifier: '销售运营' },
        { name: '客户服务概览', description: '使用情况、服务问题、满意度和未关闭事项', required: true, verifier: '客户成功 / 交付负责人' },
      ], '关联原合同，汇总服务事实并提醒客户负责人启动续约。'),
      createStage('renew-assess', '续约评估', '客户负责人', '15 个工作日', '续约窗口已启动。', '客户续约意向、范围变化和风险已经确认。', [
        { name: '续约意向记录', description: '客户续约意向、期限、预算及关键条件', required: true, verifier: '客户联系人' },
        { name: '服务复盘材料', description: '服务成果、问题改进和续约价值说明', required: true, verifier: '客户负责人' },
        { name: '增购识别清单', description: '新增产品、模块、账号或服务范围', required: false, verifier: '销售经理' },
      ], '分析服务记录和客户反馈，区分纯续约与增购，生成续约沟通建议。'),
      createStage('renew-quote', '续约报价', '客户负责人', '10 个工作日', '续约范围与意向明确。', '续约期限、金额、服务范围和增购拆分达成一致。', [
        { name: '续约报价单', description: '续约部分与增购部分分项列示', required: true, verifier: '销售经理' },
        { name: '价格变化说明', description: '价格调整、折扣延续及特殊条件依据', required: false, verifier: '授权审批人' },
      ], '对比原合同，检查续约和增购金额是否拆分，验证价格权限。'),
      createStage('renew-contract', '合同签订', '客户负责人 / 法务', '10 个工作日', '续约商务条件已达成一致。', '续约合同生效且与原合同关联，服务连续性得到确认。', [
        { name: '续约合同评审记录', description: '价格、期限、服务范围和历史问题处理确认', required: true, verifier: '合同审批人' },
        { name: '已签续约合同', description: '双方签署并关联原合同的正式文件', required: true, verifier: '法务' },
      ], '检查续约合同与原合同差异，提取新期限、金额和服务承诺。'),
    ],
    description: '关联原合同，重点检查服务情况、续约责任与价格变化。',
    opportunityTypes: '已有合同临近到期，合作范围基本延续',
    objective:
      '在原合同到期前完成续约条件确认和合同签署，确保客户服务不中断。',
    completionCriteria:
      '续约合同生效，续约期限、金额、服务范围及原负责人权益均已确认。',
    aiInstruction:
      '先关联原合同和服务记录，区分续约金额与新增采购金额；发现新增范围时提示拆分增购明细。',
  },
  {
    id: 'upsell',
    name: '增购销售流程',
    icon: 'lucide:package-plus',
    status: '待确认',
    stages: [
      createStage('upsell-register', '增购报备', '客户负责人', '2 个工作日', '现有客户提出新增采购信号。', '关联原客户和合同，增购来源及负责人确认。', [
        { name: '原客户与合同关联', description: '客户档案、原合同和当前客户负责人', required: true, verifier: '销售运营' },
        { name: '增购来源记录', description: '新增需求的提出人、渠道和协作人员', required: true, verifier: '销售经理' },
      ], '关联原客户与合同，检查续约、增购和新签的分类规则。'),
      createStage('upsell-demand', '新增需求', '客户负责人', '7 个工作日', '增购归属已确认。', '新增范围、使用场景、数量和预算明确。', [
        { name: '新增需求清单', description: '新增产品、模块、数量、账号或服务内容', required: true, verifier: '客户联系人' },
        { name: '原范围差异表', description: '原合同范围与本次新增范围的差异', required: true, verifier: '售前负责人' },
      ], '从沟通记录提取新增范围，并与原合同自动生成差异清单。'),
      createStage('upsell-scope', '范围确认', '客户负责人 / 售前顾问', '10 个工作日', '新增需求已经结构化。', '新增范围、交付边界和技术可行性确认。', [
        { name: '增购方案与范围说明', description: '新增能力、边界、依赖和交付方式', required: true, verifier: '售前负责人' },
        { name: '技术可行性确认', description: '兼容性、容量、实施影响和风险', required: false, verifier: '技术负责人' },
      ], '检查新增范围与现有能力的依赖，提示实施和合同风险。'),
      createStage('upsell-quote', '商务报价', '客户负责人', '7 个工作日', '新增范围与交付边界已确认。', '增购价格、付款和交付条件达成一致。', [
        { name: '增购报价单', description: '新增范围单独列价并注明与原合同的关系', required: true, verifier: '销售经理' },
        { name: '协作分配确认', description: '原负责人、来源人和协作销售的业绩分配', required: true, verifier: '销售负责人' },
      ], '检查价格权限和协作分配规则，生成增购报价审批材料。'),
      createStage('upsell-contract', '合同签订', '客户负责人 / 法务', '10 个工作日', '增购商务条件已确认。', '增购合同或补充协议生效，新增范围完成移交。', [
        { name: '增购合同或补充协议', description: '关联原合同并明确新增范围和金额', required: true, verifier: '法务' },
        { name: '新增范围移交清单', description: '新增交付内容、责任、日期和验收要求', required: true, verifier: '交付负责人' },
      ], '核对新增范围、金额和原合同关联，生成交付变更清单。'),
    ],
    description: '沿用客户关系，单独记录增购范围、金额和业绩归属。',
    opportunityTypes: '现有客户增加产品、模块、账号、数量或服务范围',
    objective:
      '确认客户新增需求和商务范围，完成增购合同或补充协议签署。',
    completionCriteria:
      '新增范围、价格和交付边界已经签署确认，增购业绩与协作分配清晰。',
    aiInstruction:
      '沿用客户档案但单独记录新增范围和金额；涉及原销售、产品线或跨区协作时引用归属规则并发起确认。',
  },
]);

const sources = [
  {
    name: '2026-09-17 销售制度讨论纪要',
    type: '会议纪要',
    extracted: '识别 18 条规则，发现 9 个待补充项',
    status: '待确认',
  },
  {
    name: '历史商机个案处理记录',
    type: '案例整理',
    extracted: '已归纳 6 类归属冲突',
    status: '整理中',
  },
];

const activeChapter = computed(
  () => chapters.value.find((item) => item.id === activeChapterId.value)!,
);
const overallComplete = computed(() =>
  Math.round(
    chapters.value.reduce((total, item) => total + item.complete, 0) /
      chapters.value.length,
  ),
);
const gapCount = computed(() =>
  chapters.value.flatMap((item) => item.rules).filter((rule) => rule.status === '待补充')
    .length,
);
const aiExecutionRules = computed(() => {
  const rules = chapters.value.flatMap((chapter) =>
    chapter.rules.map((rule) => ({ ...rule, chapter: chapter.title })),
  );
  return {
    enforced: rules.filter((rule) => rule.status === '已确认').slice(0, 2),
    advisory: rules.filter((rule) => rule.status !== '已确认').slice(0, 2),
  };
});
const flowEditorStepIndex = computed(() =>
  flowEditorSteps.findIndex((item) => item.key === flowEditorStep.value),
);
const selectedStage = computed(() =>
  editingTemplate.value.stages.find(
    (stage) => stage.id === selectedStageId.value,
  ),
);

function confirmRule(ruleId: string) {
  const rule = chapters.value
    .flatMap((item) => item.rules)
    .find((item) => item.id === ruleId);
  if (!rule) return;
  rule.status = '已确认';
  message.success(`“${rule.name}”已确认`);
}

const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
  sourceFileName.value = file.name;
  return false;
};

function openImport() {
  importStep.value = 'source';
  parseProgress.value = 0;
  parseStage.value = '读取制度文件';
  importOpen.value = true;
}

function startParsing() {
  if (!sourceText.value.trim() && !sourceFileName.value) {
    message.warning('请上传文件，或粘贴制度、会议纪要和历史处理规则');
    return;
  }
  importStep.value = 'parsing';
  parseProgress.value = 8;
  parseTimer = window.setInterval(() => {
    parseProgress.value = Math.min(100, parseProgress.value + 8);
    if (parseProgress.value >= 34) parseStage.value = '匹配销售制度章节';
    if (parseProgress.value >= 62) parseStage.value = '识别规则冲突和缺口';
    if (parseProgress.value >= 86) parseStage.value = '生成待确认规则';
    if (parseProgress.value >= 100) {
      if (parseTimer) window.clearInterval(parseTimer);
      importStep.value = 'review';
    }
  }, 180);
}

function applyParsedRules() {
  const registration = chapters.value.find((item) => item.id === 'registration');
  if (registration && !registration.rules.some((item) => item.id === 'r-imported')) {
    registration.rules.unshift({
      id: 'r-imported',
      name: '所有商机必须先完成备案',
      summary: '所有人员获取的商机均须完成登记备案，再进入归属判断与销售推进。',
      source: sourceFileName.value || '本次粘贴的制度资料',
      status: '待确认',
    });
  }
  importOpen.value = false;
  sourceText.value = '';
  sourceFileName.value = '';
  message.success('已写入 3 条解析结果；不完整规则保留为待补充状态');
}

function openRuleEditor(ruleId: string) {
  const rule = chapters.value
    .flatMap((item) => item.rules)
    .find((item) => item.id === ruleId);
  if (!rule) return;
  editingRuleId.value = ruleId;
  editingRule.value = {
    name: rule.name,
    parameters: rule.parameters?.map((item) => ({ ...item })) || [],
    source: rule.source,
    status: rule.status,
    summary: rule.summary,
  };
  editOpen.value = true;
}

function saveRule() {
  if (!editingRule.value.name.trim() || !editingRule.value.summary.trim()) {
    message.warning('请填写规则名称和规则内容');
    return;
  }
  const rule = chapters.value
    .flatMap((item) => item.rules)
    .find((item) => item.id === editingRuleId.value);
  if (!rule) return;
  Object.assign(rule, editingRule.value);
  editOpen.value = false;
  message.success('规则已保存');
}

function openTemplateEditor(templateId: string) {
  const template = templates.value.find((item) => item.id === templateId);
  if (!template) return;
  editingTemplateId.value = templateId;
  editingTemplate.value = {
    ...template,
    stages: template.stages.map((stage) => ({
      ...stage,
      materials: stage.materials.map((material) => ({ ...material })),
    })),
  };
  selectedStageId.value = editingTemplate.value.stages[0]?.id || '';
  flowEditorStep.value = 'goal';
  templateDrawerOpen.value = true;
}

function createTemplate() {
  const id = `flow-${Date.now()}`;
  const template: SalesFlowTemplate = {
    id,
    name: '未命名销售流程',
    icon: 'lucide:workflow',
    status: '草稿',
    stages: [
      createStage(
        `${id}-stage-1`,
        '商机进入',
        '销售负责人',
        '3 个工作日',
        '商机类型与适用范围明确。',
        '基础信息和责任人确认。',
        [
          {
            name: '基础业务资料',
            description: '请定义本阶段必须提交的材料。',
            required: true,
            verifier: '销售负责人',
          },
        ],
        '提取信息、匹配制度并提示缺口。',
      ),
    ],
    description: '请补充该流程适用的销售场景。',
    opportunityTypes: '',
    objective: '',
    completionCriteria: '',
    aiInstruction:
      '使用已确认的销售制度规则检查业务事实；信息不足时先向销售提问，不自行补全事实。',
  };
  templates.value.push(template);
  openTemplateEditor(id);
}

function validateTemplateGoal() {
  if (
    !editingTemplate.value.name.trim() ||
    !editingTemplate.value.objective.trim() ||
    !editingTemplate.value.completionCriteria.trim()
  ) {
    message.warning('请填写流程名称、流程目标和完成标准');
    return false;
  }
  return true;
}

function saveTemplate(closeDrawer = true, notify = true) {
  if (!validateTemplateGoal()) return false;
  const index = templates.value.findIndex(
    (item) => item.id === editingTemplateId.value,
  );
  if (index < 0) return;
  templates.value[index] = {
    ...editingTemplate.value,
    stages: editingTemplate.value.stages.map((stage) => ({
      ...stage,
      materials: stage.materials.map((material) => ({ ...material })),
    })),
  };
  if (closeDrawer) templateDrawerOpen.value = false;
  if (notify) message.success('流程模板已保存');
  return true;
}

function goToFlowStep(step: FlowEditorStep) {
  if (step !== 'goal' && !validateTemplateGoal()) return;
  flowEditorStep.value = step;
}

function goNextFlowStep() {
  if (flowEditorStep.value === 'goal' && !validateTemplateGoal()) return;
  const next = flowEditorSteps[flowEditorStepIndex.value + 1];
  if (next) flowEditorStep.value = next.key;
}

function goPreviousFlowStep() {
  const previous = flowEditorSteps[flowEditorStepIndex.value - 1];
  if (previous) flowEditorStep.value = previous.key;
}

function addTemplateStage() {
  const id = `stage-${Date.now()}`;
  editingTemplate.value.stages.push(
    createStage(
      id,
      `新阶段 ${editingTemplate.value.stages.length + 1}`,
      '销售负责人',
      '5 个工作日',
      '上一阶段已满足完成标准。',
      '本阶段成果和客户承诺已验证。',
      [
        {
          name: '待配置资料',
          description: '说明资料内容和用途。',
          required: true,
          verifier: '待配置',
        },
      ],
      '检查本阶段资料和完成标准，提示缺失项。',
    ),
  );
  selectedStageId.value = id;
}

function removeTemplateStage(index: number) {
  if (editingTemplate.value.stages.length <= 1) {
    message.warning('流程至少需要保留一个阶段');
    return;
  }
  const removingSelected =
    editingTemplate.value.stages[index]?.id === selectedStageId.value;
  editingTemplate.value.stages.splice(index, 1);
  if (removingSelected) {
    selectedStageId.value =
      editingTemplate.value.stages[Math.max(0, index - 1)]?.id || '';
  }
}

function addStageMaterial() {
  selectedStage.value?.materials.push({
    name: '新资料要求',
    description: '说明这份资料需要包含什么内容。',
    required: true,
    verifier: '销售负责人',
  });
}

function removeStageMaterial(index: number) {
  selectedStage.value?.materials.splice(index, 1);
}

function publishTemplate() {
  if (!validateTemplateGoal()) return;
  if (!editingTemplate.value.stages.length) {
    message.warning('请至少配置一个销售阶段');
    return;
  }
  editingTemplate.value.status = '已发布';
  if (saveTemplate(false, false)) {
    templateDrawerOpen.value = false;
    message.success('销售流程模板已发布，新的商机可以按此流程执行');
  }
}

onBeforeUnmount(() => {
  if (parseTimer) window.clearInterval(parseTimer);
});
</script>

<template>
  <AiWorkPage
    class="sales-policy-page"
    icon="lucide:book-open-check"
    title="销售制度"
    description="从制度和历史案例提取规则，经人工补全确认后，发布可执行的销售流程模板。"
  >
    <template #actions>
      <Button @click="generateOpen = true">
        <Icon icon="lucide:file-output" />生成制度草稿
      </Button>
      <Button type="primary" @click="openImport">
        <Icon icon="lucide:sparkles" />AI 解析资料
      </Button>
    </template>

    <section class="policy-summary">
      <div class="summary-copy">
        <span class="summary-icon"><Icon icon="lucide:bot" /></span>
        <div>
          <small>AI 制度助手</small>
          <h2>已搭好销售制度框架，还有 {{ gapCount }} 项关键规则需要补充</h2>
          <p>AI 负责提取、检查和解释；规则发布、例外审批和争议裁决仍由负责人确认。</p>
        </div>
      </div>
      <div class="summary-progress">
        <strong>{{ overallComplete }}%</strong>
        <span>制度完整度</span>
        <div><i :style="{ width: `${overallComplete}%` }"></i></div>
      </div>
    </section>

    <nav class="page-tabs" aria-label="销售制度功能">
      <button :class="{ active: activeTab === 'framework' }" @click="activeTab = 'framework'">
        <Icon icon="lucide:layout-list" />制度框架
      </button>
      <button :class="{ active: activeTab === 'templates' }" @click="activeTab = 'templates'">
        <Icon icon="lucide:git-branch" />流程模板 <Tag color="orange">3</Tag>
      </button>
      <button :class="{ active: activeTab === 'sources' }" @click="activeTab = 'sources'">
        <Icon icon="lucide:files" />制度来源
      </button>
    </nav>

    <section v-if="activeTab === 'framework'" class="framework-layout">
      <aside class="chapter-list">
        <header><span>制度章节</span><small>一条规则只维护一处</small></header>
        <button
          v-for="chapter in chapters"
          :key="chapter.id"
          :class="{ active: chapter.id === activeChapterId }"
          @click="activeChapterId = chapter.id"
        >
          <span class="chapter-icon"><Icon :icon="chapter.icon" /></span>
          <span class="chapter-name">
            <strong>{{ chapter.title }}</strong>
            <small>{{ chapter.rules.length }} 条规则 · {{ chapter.complete }}%</small>
          </span>
          <Icon icon="lucide:chevron-right" />
        </button>
      </aside>

      <main class="chapter-detail">
        <header class="detail-head">
          <div>
            <span>销售管理制度 · 第 {{ chapters.findIndex((item) => item.id === activeChapter.id) + 1 }} 章</span>
            <h2>{{ activeChapter.title }}</h2>
            <p>{{ activeChapter.description }}</p>
          </div>
          <Button><Icon icon="lucide:settings-2" />章节设置</Button>
        </header>

        <section class="ai-boundary">
          <Icon icon="lucide:wand-sparkles" />
          <div><strong>AI 在本章的作用</strong><p>{{ activeChapter.aiRole }}</p></div>
        </section>

        <div class="rule-list">
          <article v-for="rule in activeChapter.rules" :key="rule.id" class="rule-card">
            <div class="rule-status" :class="rule.status">
              <Icon :icon="rule.status === '已确认' ? 'lucide:circle-check-big' : rule.status === '待补充' ? 'lucide:circle-alert' : 'lucide:clock-3'" />
            </div>
            <div class="rule-content">
              <div class="rule-title">
                <h3>{{ rule.name }}</h3>
                <Tag :color="rule.status === '已确认' ? 'green' : rule.status === '待补充' ? 'red' : 'orange'">{{ rule.status }}</Tag>
              </div>
              <p>{{ rule.summary }}</p>
              <div v-if="rule.parameters?.length" class="rule-parameters">
                <span v-for="parameter in rule.parameters" :key="parameter.label"><small>{{ parameter.label }}</small><strong>{{ parameter.value }} {{ parameter.unit }}</strong></span>
              </div>
              <span><Icon icon="lucide:quote" />{{ rule.source }}</span>
            </div>
            <div class="rule-actions">
              <Button size="small" @click="openRuleEditor(rule.id)">编辑规则</Button>
              <Button v-if="rule.status !== '已确认'" size="small" type="primary" @click="confirmRule(rule.id)">确认</Button>
            </div>
          </article>
        </div>

        <button class="add-rule" type="button"><Icon icon="lucide:plus" />新增本章规则</button>
      </main>
    </section>

    <section v-else-if="activeTab === 'templates'" class="content-panel">
      <header class="panel-head">
        <div><span>销售流程模板</span><h2>同一套制度，适配不同类型的销售过程</h2><p>模板引用已确认的制度规则，不重复维护归属、绩效和异常条款。</p></div>
        <Button type="primary" @click="createTemplate"><Icon icon="lucide:plus" />新增流程模板</Button>
      </header>
      <div class="template-grid">
        <article v-for="template in templates" :key="template.id" class="template-card" @click="openTemplateEditor(template.id)">
          <header><span class="template-card-icon"><Icon :icon="template.icon" /></span><Tag class="template-status" :color="template.status === '草稿' ? 'default' : template.status === '已发布' ? 'green' : 'orange'">{{ template.status }}</Tag></header>
          <h3>{{ template.name }}</h3><p>{{ template.description }}</p>
          <div class="template-objective"><small>流程目标</small><strong>{{ template.objective || '尚未配置流程目标' }}</strong></div>
          <div class="stage-flow"><span v-for="(stage, index) in template.stages" :key="stage.id">{{ index + 1 }}. {{ stage.name }} · {{ stage.materials.length }} 项资料</span></div>
          <footer><Button @click.stop="openTemplateEditor(template.id)">查看配置</Button><Button type="primary" @click.stop="openTemplateEditor(template.id)">编辑流程目标</Button></footer>
        </article>
      </div>
    </section>

    <section v-else class="content-panel">
      <header class="panel-head">
        <div><span>制度来源</span><h2>每条执行规则都能追溯到依据</h2><p>当前没有完整成文制度，可先导入会议纪要和历史个案，逐项补全后反向生成正式制度。</p></div>
        <Button type="primary" @click="openImport"><Icon icon="lucide:upload" />导入资料</Button>
      </header>
      <div class="source-list">
        <article v-for="source in sources" :key="source.name">
          <span class="source-icon"><Icon icon="lucide:file-text" /></span>
          <div><h3>{{ source.name }}</h3><p>{{ source.type }} · {{ source.extracted }}</p></div>
          <Tag color="orange">{{ source.status }}</Tag><Button>查看解析结果</Button>
        </article>
      </div>
    </section>

    <Drawer v-model:open="importOpen" title="AI 解析销售制度" :width="760" :mask-closable="false" placement="right">
      <div class="import-modal">
        <nav class="import-steps" aria-label="制度解析步骤">
          <div v-for="(step, index) in importSteps" :key="step.key" :class="{ active: importStep === step.key, complete: importSteps.findIndex((item) => item.key === importStep) > index }">
            <span>{{ index + 1 }}</span><div><strong>{{ step.label }}</strong><small>{{ step.description }}</small></div>
          </div>
        </nav>

        <section v-if="importStep === 'source'" class="import-source">
          <div class="import-hint"><Icon icon="lucide:info" /><p>支持上传已有销售制度；如果公司还没有成文制度，也可以粘贴会议纪要和历史个案作为初始依据。</p></div>
          <div class="upload-box">
            <span><Icon icon="lucide:file-up" /></span>
            <div><strong>{{ sourceFileName || '上传销售制度文件' }}</strong><p>支持 Word、PDF、TXT，Demo 中仅保留文件名并模拟解析。</p></div>
            <Upload :before-upload="handleBeforeUpload" :show-upload-list="false" accept=".doc,.docx,.pdf,.txt">
              <Button>{{ sourceFileName ? '重新选择' : '选择文件' }}</Button>
            </Upload>
          </div>
          <div class="source-divider"><span>或者粘贴内容</span></div>
          <Input.TextArea v-model:value="sourceText" :rows="7" placeholder="粘贴销售制度、会议纪要或历史处理规则……" />
          <footer class="import-footer"><Button @click="importOpen = false">取消</Button><Button type="primary" @click="startParsing"><Icon icon="lucide:sparkles" />开始解析</Button></footer>
        </section>

        <section v-else-if="importStep === 'parsing'" class="parsing-state">
          <span class="parsing-icon"><Icon icon="lucide:loader-circle" /></span>
          <small>AI 正在处理</small><h3>{{ parseStage }}</h3>
          <p>从来源材料中识别适用对象、执行条件、责任人、例外处理和可计算参数。</p>
          <Progress :percent="parseProgress" stroke-color="#a85931" />
          <div class="parsing-checks"><span><Icon icon="lucide:check" />保留原文引用</span><span><Icon icon="lucide:check" />不把推测当作规则</span><span><Icon icon="lucide:check" />标记冲突与缺失项</span></div>
        </section>

        <section v-else class="parse-review">
          <header><div><small>解析完成</small><h3>发现 3 条候选规则，其中 2 条需要人工处理</h3><p>确认后写入对应章节；有缺口的内容不会自动成为正式执行规则。</p></div><Tag color="green">原文已关联</Tag></header>
          <div class="parsed-rule-list">
            <article v-for="item in parsedRules" :key="item.name">
              <span class="confidence">{{ item.confidence }}%</span>
              <div><small>{{ item.chapter }}</small><h4>{{ item.name }}</h4><p>{{ item.source }}</p></div>
              <Tag :color="item.status === '已提取' ? 'green' : item.status === '需确认' ? 'orange' : 'red'">{{ item.status }}</Tag>
            </article>
          </div>
          <footer class="import-footer"><Button @click="importStep = 'source'">返回修改来源</Button><Button type="primary" @click="applyParsedRules"><Icon icon="lucide:list-plus" />写入制度框架</Button></footer>
        </section>
      </div>
    </Drawer>

    <Drawer v-model:open="editOpen" title="编辑销售规则" :width="560" placement="right">
      <div class="rule-editor">
        <label>规则名称</label>
        <Input v-model:value="editingRule.name" placeholder="例如：报备成立条件" />
        <label>规则内容</label>
        <Input.TextArea v-model:value="editingRule.summary" :rows="5" placeholder="写清适用条件、执行要求和异常处理……" />
        <label>依据来源</label>
        <Input v-model:value="editingRule.source" placeholder="制度文件、会议纪要或裁决记录" />
        <label>确认状态</label>
        <div class="status-options">
          <button v-for="status in (['待补充', '待确认', '已确认'] as RuleStatus[])" :key="status" type="button" :class="{ active: editingRule.status === status }" @click="editingRule.status = status">{{ status }}</button>
        </div>
        <template v-if="editingRule.parameters.length">
          <label>执行参数</label>
          <div class="parameter-editor">
            <div v-for="parameter in editingRule.parameters" :key="parameter.label">
              <span>{{ parameter.label }}</span>
              <Input v-model:value="parameter.value" />
              <Input v-model:value="parameter.unit" />
            </div>
          </div>
          <div class="parameter-impact"><Icon icon="lucide:play-circle" /><div><strong>保存后如何执行</strong><p>系统按参数计算提醒和回收时间；AI 从跟进内容判断是否属于有效进展，并向销售解释触发依据。</p></div></div>
        </template>
        <div class="editor-note"><Icon icon="lucide:bot" /><p>AI 将按保存后的规则辅助检查，但只有“已确认”的规则可以作为自动判断依据。</p></div>
        <footer class="drawer-footer"><Button @click="editOpen = false">取消</Button><Button type="primary" @click="saveRule">保存规则</Button></footer>
      </div>
    </Drawer>

    <Drawer v-model:open="templateDrawerOpen" title="编辑销售流程模板" :width="960" placement="right" :mask-closable="false">
      <div class="flow-editor">
        <nav class="flow-editor-steps" aria-label="销售流程模板配置步骤">
          <button v-for="(step, index) in flowEditorSteps" :key="step.key" :class="{ active: flowEditorStep === step.key, complete: flowEditorStepIndex > index }" type="button" @click="goToFlowStep(step.key)"><span>{{ index + 1 }}</span><div><strong>{{ step.label }}</strong><small>{{ step.description }}</small></div></button>
        </nav>

        <div v-if="flowEditorStep === 'goal'" class="flow-goal-layout">
          <section class="goal-form">
            <header><small>STEP 01</small><h2>定义这套流程最终要达成什么</h2><p>AI 会根据适用场景选择流程，并用完成标准判断销售是否真正走完流程。</p></header>
            <label>流程名称</label>
            <Input v-model:value="editingTemplate.name" placeholder="例如：新签销售流程" />
            <label>适用的商机类型</label>
            <Input.TextArea v-model:value="editingTemplate.opportunityTypes" :rows="2" placeholder="哪些商机应进入这套流程？" />
            <label>流程目标</label>
            <Input.TextArea v-model:value="editingTemplate.objective" :rows="3" placeholder="这套流程要帮助销售达成什么业务结果？" />
            <label>完成标准</label>
            <Input.TextArea v-model:value="editingTemplate.completionCriteria" :rows="3" placeholder="满足哪些可验证条件才算完成？" />
            <label>AI 执行原则</label>
            <Input.TextArea v-model:value="editingTemplate.aiInstruction" :rows="4" placeholder="AI 使用制度和判断业务状态时要遵循什么原则？" />
          </section>

          <aside class="ai-usage-preview">
            <header><span><Icon icon="lucide:bot" /></span><div><small>执行预览</small><h3>AI 将怎样使用这套制度</h3></div></header>
            <div class="preview-input"><small>销售输入</small><p>“苏州智造准备采购设备运维系统，张总介绍的，下周约信息部沟通。”</p></div>
            <ol class="ai-reasoning">
              <li><span>1</span><div><strong>选择流程</strong><p>识别为首次采购，匹配「{{ editingTemplate.name || '未命名流程' }}」。</p></div></li>
              <li><span>2</span><div><strong>读取已确认规则</strong><p>只把已确认规则用于自动检查；待确认规则仅作为风险提示。</p></div></li>
              <li><span>3</span><div><strong>检查当前事实</strong><p>已获取客户、来源和初步需求；还缺客户主体全称和有效联系人。</p></div></li>
              <li><span>4</span><div><strong>给出可执行结果</strong><p>暂存报备并向销售追问缺失信息，信息齐备后再判断归属。</p></div></li>
            </ol>
            <section class="used-rules">
              <h4>本次引用的制度规则</h4>
              <div v-for="rule in aiExecutionRules.enforced" :key="rule.id" class="used-rule"><Icon icon="lucide:shield-check" /><span><strong>{{ rule.name }}</strong><small>{{ rule.chapter }} · 强制执行</small></span><Tag color="green">已确认</Tag></div>
              <div v-for="rule in aiExecutionRules.advisory" :key="rule.id" class="used-rule advisory"><Icon icon="lucide:message-square-warning" /><span><strong>{{ rule.name }}</strong><small>{{ rule.chapter }} · 仅提示，不自动裁决</small></span><Tag color="orange">{{ rule.status }}</Tag></div>
            </section>
            <div class="preview-result"><Icon icon="lucide:circle-help" /><div><small>AI 返回给销售</small><strong>还需补充 2 项信息，暂不能确认报备归属</strong><p>依据“报备成立条件”：请补充客户主体全称和直接联系人。</p></div></div>
          </aside>
        </div>

        <section v-else-if="flowEditorStep === 'stages'" class="stage-editor-page">
          <header class="flow-section-head"><div><small>STEP 02</small><h2>设置销售推进阶段</h2><p>阶段表示业务状态变化。制度规则继续在制度章节维护，流程这里只引用它们。</p></div><Button type="primary" @click="addTemplateStage"><Icon icon="lucide:plus" />新增阶段</Button></header>
          <div class="cross-stage-note"><Icon icon="lucide:repeat-2" /><div><strong>跟进、公海和进度汇报是贯穿规则</strong><p>它们会作用于需求确认、方案验证、商务报价等所有进行中阶段，因此统一在“销售推进与跟进”制度章节配置，不重复创建一个“跟进阶段”。</p></div></div>
          <div class="stage-config-layout">
            <aside class="stage-config-list">
              <button v-for="(stage, index) in editingTemplate.stages" :key="stage.id" type="button" :class="{ active: selectedStageId === stage.id }" @click="selectedStageId = stage.id">
                <span>{{ index + 1 }}</span><div><strong>{{ stage.name }}</strong><small>{{ stage.materials.filter((item) => item.required).length }} 项必备资料 · {{ stage.duration }}</small></div><Icon icon="lucide:chevron-right" />
              </button>
            </aside>

            <main v-if="selectedStage" class="stage-detail-editor">
              <header><div><small>阶段配置</small><h3>{{ selectedStage.name }}</h3><p>AI 根据进入条件、资料和完成标准判断当前阶段，并保留原始证据。</p></div><Button danger @click="removeTemplateStage(editingTemplate.stages.findIndex((item) => item.id === selectedStageId))"><Icon icon="lucide:trash-2" />删除阶段</Button></header>
              <div class="stage-basic-grid">
                <label><span>阶段名称</span><Input v-model:value="selectedStage.name" /></label>
                <label><span>主要负责人</span><Input v-model:value="selectedStage.owner" /></label>
                <label><span>建议处理时限</span><Input v-model:value="selectedStage.duration" /></label>
              </div>
              <div class="criteria-grid">
                <label><span>进入条件</span><Input.TextArea v-model:value="selectedStage.entryCriteria" :rows="3" /></label>
                <label><span>完成标准</span><Input.TextArea v-model:value="selectedStage.exitCriteria" :rows="3" /></label>
              </div>

              <section class="material-editor">
                <header><div><strong>本阶段需要提供的资料</strong><p>必备资料未齐全时，AI 不会把商机推进到下一阶段。</p></div><Button size="small" @click="addStageMaterial"><Icon icon="lucide:plus" />新增资料</Button></header>
                <article v-for="(material, materialIndex) in selectedStage.materials" :key="materialIndex">
                  <div class="material-main"><Input v-model:value="material.name" placeholder="资料名称" /><Input v-model:value="material.description" placeholder="这份资料需要包含什么" /></div>
                  <Input v-model:value="material.verifier" placeholder="验证人" />
                  <button type="button" class="required-toggle" :class="{ active: material.required }" @click="material.required = !material.required">{{ material.required ? '必备' : '可选' }}</button>
                  <button type="button" class="material-remove" title="删除资料" @click="removeStageMaterial(materialIndex)"><Icon icon="lucide:x" /></button>
                </article>
              </section>

              <label class="stage-ai-action"><span>AI 在本阶段执行什么</span><Input.TextArea v-model:value="selectedStage.aiActions" :rows="3" /></label>
              <aside class="stage-rule-map">
                <header><Icon icon="lucide:link-2" /><div><strong>引用的制度章节</strong><p>规则只在制度章节维护，这里显示本阶段可调用的依据。</p></div></header>
                <div v-for="chapter in chapters" :key="chapter.id"><span><Icon :icon="chapter.icon" /></span><div><strong>{{ chapter.title }}</strong><small>{{ chapter.rules.filter((rule) => rule.status === '已确认').length }} 条可执行 · {{ chapter.rules.filter((rule) => rule.status !== '已确认').length }} 条待处理</small></div><Tag :color="chapter.rules.some((rule) => rule.status === '已确认') ? 'green' : 'orange'">已引用</Tag></div>
              </aside>
            </main>
          </div>
        </section>

        <section v-else-if="flowEditorStep === 'ai'" class="ai-execution-page">
          <header class="flow-section-head"><div><small>STEP 03</small><h2>定义 AI 如何参与流程执行</h2><p>AI 可以整理和检查事实，但不会替代归属裁决、例外审批和制度发布。</p></div></header>
          <div class="ai-mode-list">
            <article v-for="mode in aiExecutionModes" :key="mode.name" :class="{ disabled: !mode.enabled }">
              <span><Icon :icon="mode.icon" /></span>
              <div><div><h3>{{ mode.name }}</h3><Tag :color="mode.level === '自动执行' ? 'green' : mode.level === '生成建议' ? 'blue' : 'orange'">{{ mode.level }}</Tag></div><p>{{ mode.description }}</p></div>
              <button type="button" :class="{ active: mode.enabled }" @click="mode.enabled = !mode.enabled"><i></i><em>{{ mode.enabled ? '已启用' : '已停用' }}</em></button>
            </article>
          </div>
          <div class="ai-instruction-editor"><label>AI 执行原则</label><p>这段要求会与每条已确认制度共同进入 AI 的执行上下文。</p><Input.TextArea v-model:value="editingTemplate.aiInstruction" :rows="5" /></div>
          <section class="ai-boundary-table">
            <header><Icon icon="lucide:shield-check" /><div><strong>制度执行边界</strong><p>相同规则版本下，AI 的处理口径保持一致。</p></div></header>
            <div><span>确定性判断</span><strong>期限、金额公式、必填项、权限</strong><em>规则程序执行</em></div>
            <div><span>非结构化理解</span><strong>口述、会议纪要、客户反馈、材料内容</strong><em>AI 提取并请人确认</em></div>
            <div><span>高影响决定</span><strong>归属裁决、折扣特批、例外放行、制度发布</strong><em>必须人工确认</em></div>
          </section>
        </section>

        <section v-else class="publish-page">
          <header class="publish-hero"><span><Icon icon="lucide:badge-check" /></span><small>STEP 04</small><h2>检查流程模板并发布</h2><p>发布后，新进入的商机会按该版本选择流程、检查阶段条件并引用制度规则。</p></header>
          <div class="publish-summary-grid">
            <article><small>流程名称</small><strong>{{ editingTemplate.name }}</strong><p>{{ editingTemplate.opportunityTypes }}</p></article>
            <article><small>流程目标</small><strong>{{ editingTemplate.objective }}</strong><p>{{ editingTemplate.completionCriteria }}</p></article>
            <article><small>阶段设置</small><strong>{{ editingTemplate.stages.length }} 个阶段</strong><p>{{ editingTemplate.stages.map((stage) => stage.name).join(' → ') }}</p></article>
            <article><small>AI 执行</small><strong>{{ aiExecutionModes.filter((item) => item.enabled).length }} 项能力已启用</strong><p>{{ aiExecutionModes.filter((item) => item.enabled).map((item) => item.name).join('、') }}</p></article>
          </div>
          <section class="publish-checks"><h3>发布前检查</h3><div><Icon icon="lucide:circle-check-big" /><span><strong>流程目标完整</strong><small>适用范围、目标和完成标准均已填写</small></span></div><div><Icon icon="lucide:circle-check-big" /><span><strong>销售阶段已配置</strong><small>共 {{ editingTemplate.stages.length }} 个连续阶段</small></span></div><div :class="{ warning: gapCount > 0 }"><Icon :icon="gapCount > 0 ? 'lucide:triangle-alert' : 'lucide:circle-check-big'" /><span><strong>{{ gapCount }} 条制度规则仍待补充</strong><small>这些规则只会产生提示，不会用于自动裁决</small></span></div></section>
        </section>

        <footer class="drawer-footer">
          <span class="autosave-hint"><Icon icon="lucide:info" />切换步骤不会丢失当前编辑内容。</span>
          <Button @click="templateDrawerOpen = false">取消</Button>
          <Button v-if="flowEditorStepIndex > 0" @click="goPreviousFlowStep"><Icon icon="lucide:arrow-left" />上一步</Button>
          <Button v-if="flowEditorStep !== 'publish'" type="primary" @click="goNextFlowStep">下一步<Icon icon="lucide:arrow-right" /></Button>
          <template v-else><Button @click="saveTemplate()">保存草稿</Button><Button type="primary" @click="publishTemplate"><Icon icon="lucide:send" />发布模板</Button></template>
        </footer>
      </div>
    </Drawer>

    <Drawer v-model:open="generateOpen" title="生成《销售管理制度》草稿" :width="500" placement="right">
      <div class="generate-summary">
        <Icon icon="lucide:file-check-2" />
        <div><h3>将当前已确认规则反向生成正式制度</h3><p>草稿会保留 {{ gapCount }} 项“待补充”标记，不会把 AI 建议自动发布为执行规则。</p></div>
      </div>
      <footer class="drawer-footer"><Button @click="generateOpen = false">取消</Button><Button type="primary" @click="generateOpen = false; message.success('已生成制度草稿，待负责人审阅')">开始生成</Button></footer>
    </Drawer>
  </AiWorkPage>
</template>

<style scoped>
.sales-policy-page { --accent: #a85931; --ink: #24332f; }
.policy-summary { display:flex; align-items:center; justify-content:space-between; gap:28px; padding:18px 22px; color:#fff; background:linear-gradient(120deg,#315e52,#1f473f); border-radius:18px; box-shadow:0 14px 28px rgb(25 67 56 / 16%); }
.summary-copy { display:flex; gap:15px; align-items:center; }
.summary-icon { display:grid; flex:none; width:48px; height:48px; place-items:center; font-size:23px; color:#17483b; background:#d9f0e8; border-radius:14px; }
.summary-copy small { font-size:12px; font-weight:800; color:#aee1d4; letter-spacing:.12em; }
.summary-copy h2 { margin:3px 0 4px; font-size:18px; }
.summary-copy p { margin:0; font-size:12px; color:#d2e5df; }
.summary-progress { width:150px; text-align:right; }
.summary-progress strong { display:block; font-size:25px; }
.summary-progress span { font-size:12px; color:#cae0da; }
.summary-progress div { height:5px; margin-top:8px; overflow:hidden; background:rgb(255 255 255 / 20%); border-radius:9px; }
.summary-progress i { display:block; height:100%; background:#e8a479; border-radius:9px; }
.page-tabs { display:flex; gap:8px; margin:14px 0; padding:5px; background:#edf4f1; border:1px solid #dbe8e3; border-radius:14px; }
.page-tabs button { display:flex; gap:7px; align-items:center; padding:9px 16px; font-size:12px; font-weight:700; color:#63766f; cursor:pointer; background:transparent; border:0; border-radius:10px; }
.page-tabs button.active { color:#185b4d; background:#fff; box-shadow:0 4px 12px rgb(31 74 62 / 8%); }
.page-tabs :deep(.ant-tag) { margin:0; }
.framework-layout { display:grid; grid-template-columns:265px minmax(0,1fr); min-height:560px; overflow:hidden; background:#fff; border:1px solid #dbe7e3; border-radius:18px; }
.chapter-list { padding:16px 12px; background:#f5f8f7; border-right:1px solid #e0e9e6; }
.chapter-list > header { display:flex; justify-content:space-between; padding:4px 8px 12px; }
.chapter-list > header span { font-size:12px; font-weight:800; color:#314a43; }
.chapter-list > header small { font-size:12px; color:#8a9994; }
.chapter-list > button { display:flex; gap:10px; align-items:center; width:100%; padding:12px 10px; margin-bottom:6px; text-align:left; cursor:pointer; background:transparent; border:1px solid transparent; border-radius:12px; }
.chapter-list > button.active { background:#fff; border-color:#d5e4df; box-shadow:0 6px 14px rgb(34 73 62 / 7%); }
.chapter-icon { display:grid; flex:none; width:34px; height:34px; place-items:center; color:#497267; background:#e2eeea; border-radius:10px; }
.chapter-list button.active .chapter-icon { color:#fff; background:#a85931; }
.chapter-name { flex:1; min-width:0; }
.chapter-name strong,.chapter-name small { display:block; }
.chapter-name strong { font-size:12px; color:#2b403a; }
.chapter-name small { margin-top:3px; font-size:12px; color:#899792; }
.chapter-list > button > svg { color:#9caaa5; }
.chapter-detail { padding:22px; }
.detail-head,.panel-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
.detail-head span,.panel-head span { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.1em; }
.detail-head h2,.panel-head h2 { margin:4px 0; font-size:20px; color:var(--ink); }
.detail-head p,.panel-head p { margin:0; font-size:12px; color:#71817c; }
.ai-boundary { display:flex; gap:11px; align-items:flex-start; padding:13px 15px; margin:18px 0; color:#325a50; background:#edf7f4; border:1px solid #d5ebe4; border-radius:12px; }
.ai-boundary > svg { flex:none; margin-top:2px; color:#16806b; }
.ai-boundary strong { font-size:12px; }
.ai-boundary p { margin:3px 0 0; font-size:12px; color:#617d75; }
.rule-list { display:grid; gap:10px; }
.rule-card { display:grid; grid-template-columns:34px minmax(0,1fr) auto; gap:12px; align-items:start; padding:15px; border:1px solid #e0e9e6; border-radius:13px; transition:.2s; }
.rule-card:hover { border-color:#c0d6cf; box-shadow:0 8px 18px rgb(37 75 64 / 6%); }
.rule-status { display:grid; width:32px; height:32px; place-items:center; color:#c77a32; background:#fff4e6; border-radius:9px; }
.rule-status.已确认 { color:#20856d; background:#e8f6f1; }
.rule-status.待补充 { color:#c8554d; background:#fff0ef; }
.rule-title { display:flex; gap:9px; align-items:center; }
.rule-title h3 { margin:0; font-size:13px; color:#2b403a; }
.rule-content p { margin:6px 0 8px; font-size:12px; line-height:1.55; color:#60726c; }
.rule-content > span { display:flex; gap:5px; align-items:center; font-size:12px; color:#91a09b; }
.rule-parameters { display:flex; flex-wrap:wrap; gap:6px; margin:0 0 9px; }
.rule-parameters span { padding:6px 8px; background:#f3f7f5; border:1px solid #e2ebe8; border-radius:7px; }
.rule-parameters small,.rule-parameters strong { display:block; }
.rule-parameters small { margin-bottom:2px; font-size:12px; color:#889690; }
.rule-parameters strong { font-size:12px; color:#425a53; }
.rule-actions { display:flex; gap:7px; }
.add-rule { width:100%; padding:12px; margin-top:11px; font-size:12px; color:#54736b; cursor:pointer; background:#f8fbfa; border:1px dashed #c5d7d1; border-radius:12px; }
.add-rule svg { margin-right:6px; }
.content-panel { min-height:500px; padding:24px; background:#fff; border:1px solid #dbe7e3; border-radius:18px; }
.template-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-top:22px; }
.template-card { padding:18px; cursor:pointer; border:1px solid #dfe9e5; border-radius:15px; box-shadow:0 8px 22px rgb(31 71 60 / 5%); transition:transform .2s,border-color .2s,box-shadow .2s; }
.template-card:hover { border-color:#c4d8d1; box-shadow:0 13px 28px rgb(31 71 60 / 10%); transform:translateY(-2px); }
.template-card header { display:flex; align-items:center; justify-content:space-between; }
.template-card-icon { display:grid; flex:none; width:38px; height:38px; place-items:center; font-size:18px; color:#fff; background:#a85931; border-radius:11px; }
.template-status { flex:none; width:auto; min-width:max-content; height:auto; margin:0; padding:1px 8px; font-size:12px; line-height:20px; white-space:nowrap; }
.template-card h3 { margin:14px 0 5px; font-size:15px; color:#2a3e38; }
.template-card > p { min-height:38px; margin:0; font-size:12px; line-height:1.6; color:#71817c; }
.template-objective { padding:10px; margin:12px 0; background:#fcf5f0; border-left:3px solid #b66b43; border-radius:7px; }
.template-objective small,.template-objective strong { display:block; }
.template-objective small { margin-bottom:4px; font-size:12px; font-weight:800; color:#a85931; }
.template-objective strong { display:-webkit-box; min-height:32px; overflow:hidden; font-size:12px; line-height:1.55; color:#604a3e; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
.stage-flow { display:grid; gap:6px; margin:14px 0; }
.stage-flow span { padding:7px 9px; font-size:12px; color:#536a63; background:#f3f7f5; border-radius:7px; }
.template-card footer { display:flex; gap:8px; justify-content:flex-end; padding-top:12px; border-top:1px solid #edf1f0; }
.source-list { display:grid; gap:10px; margin-top:22px; }
.source-list article { display:grid; grid-template-columns:42px minmax(0,1fr) auto auto; gap:13px; align-items:center; padding:15px; border:1px solid #dfe9e5; border-radius:13px; }
.source-icon { display:grid; width:40px; height:40px; place-items:center; font-size:18px; color:#a85931; background:#faeee7; border-radius:11px; }
.source-list h3 { margin:0 0 4px; font-size:13px; color:#2b403a; }
.source-list p { margin:0; font-size:12px; color:#788983; }
.import-modal label { display:block; margin:15px 0 7px; font-size:12px; font-weight:700; color:#3d544d; }
.import-hint,.generate-summary { display:flex; gap:12px; align-items:flex-start; padding:13px; color:#47655d; background:#edf6f3; border-radius:11px; }
.import-hint p,.generate-summary p { margin:0; font-size:12px; line-height:1.6; }
.import-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; padding:6px; margin-bottom:20px; background:#f2f6f4; border-radius:13px; }
.import-steps > div { display:flex; gap:9px; align-items:center; padding:10px; color:#899792; border-radius:9px; }
.import-steps > div.active { color:#814323; background:#fff; box-shadow:0 5px 13px rgb(42 72 63 / 7%); }
.import-steps > div.complete { color:#237361; }
.import-steps > div > span { display:grid; flex:none; width:25px; height:25px; place-items:center; font-size:12px; font-weight:800; color:#fff; background:#a9b6b2; border-radius:50%; }
.import-steps > div.active > span { background:#a85931; }
.import-steps > div.complete > span { background:#25806c; }
.import-steps strong,.import-steps small { display:block; }
.import-steps strong { font-size:12px; }
.import-steps small { margin-top:2px; font-size:12px; font-weight:400; }
.upload-box { display:flex; gap:13px; align-items:center; padding:17px; margin-top:14px; border:1px dashed #bdcec8; border-radius:12px; }
.upload-box > span { display:grid; flex:none; width:40px; height:40px; place-items:center; font-size:19px; color:#a85931; background:#faeee7; border-radius:10px; }
.upload-box > div { flex:1; }
.upload-box strong { font-size:12px; color:#344d46; }
.upload-box p { margin:3px 0 0; font-size:12px; color:#879690; }
.source-divider { display:flex; align-items:center; margin:15px 0; font-size:12px; color:#99a6a2; }
.source-divider::before,.source-divider::after { flex:1; height:1px; content:''; background:#e3ebe8; }
.source-divider span { padding:0 11px; }
.import-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:18px; }
.parsing-state { max-width:580px; padding:38px 20px 22px; margin:auto; text-align:center; }
.parsing-icon { display:grid; width:58px; height:58px; margin:0 auto 14px; place-items:center; font-size:27px; color:#fff; background:linear-gradient(145deg,#b86b41,#8c4828); border-radius:18px; box-shadow:0 12px 24px rgb(153 78 39 / 22%); }
.parsing-icon svg { animation:spin 1.2s linear infinite; }
.parsing-state > small,.parse-review header small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.1em; }
.parsing-state h3,.parse-review h3 { margin:5px 0; font-size:18px; color:#2b403a; }
.parsing-state > p,.parse-review header p { margin:0 0 20px; font-size:12px; color:#71817c; }
.parsing-checks { display:flex; gap:8px; justify-content:center; margin-top:16px; }
.parsing-checks span { display:flex; gap:4px; align-items:center; padding:6px 8px; font-size:12px; color:#527067; background:#edf6f3; border-radius:7px; }
.parse-review > header { display:flex; align-items:flex-start; justify-content:space-between; }
.parsed-rule-list { display:grid; gap:9px; margin-top:16px; }
.parsed-rule-list article { display:grid; grid-template-columns:48px minmax(0,1fr) auto; gap:12px; align-items:start; padding:13px; border:1px solid #e0e9e6; border-radius:11px; }
.confidence { display:grid; width:44px; height:34px; place-items:center; font-size:12px; font-weight:800; color:#24705e; background:#eaf6f2; border-radius:8px; }
.parsed-rule-list small { font-size:12px; font-weight:800; color:#a85931; }
.parsed-rule-list h4 { margin:2px 0 4px; font-size:12px; color:#344a44; }
.parsed-rule-list p { margin:0; font-size:12px; line-height:1.5; color:#7a8984; }
.rule-editor label { display:block; margin:14px 0 6px; font-size:12px; font-weight:800; color:#425951; }
.rule-editor label:first-child { margin-top:0; }
.status-options { display:flex; gap:7px; }
.status-options button { padding:7px 12px; font-size:12px; color:#6d7e78; cursor:pointer; background:#f5f7f6; border:1px solid #dfe7e4; border-radius:8px; }
.status-options button.active { color:#84431f; background:#fdf0e8; border-color:#dfa47f; }
.parameter-editor { display:grid; gap:7px; padding:11px; background:#f5f8f7; border:1px solid #e0e9e6; border-radius:10px; }
.parameter-editor > div { display:grid; grid-template-columns:minmax(130px,1fr) 95px 110px; gap:7px; align-items:center; }
.parameter-editor span { font-size:12px; font-weight:700; color:#536a63; }
.parameter-impact { display:flex; gap:9px; align-items:flex-start; padding:11px; margin-top:10px; color:#94603e; background:#fff7ef; border:1px solid #f0dfce; border-radius:9px; }
.parameter-impact > svg { flex:none; margin-top:2px; }
.parameter-impact strong { display:block; font-size:12px; color:#684b3a; }
.parameter-impact p { margin:3px 0 0; font-size:12px; line-height:1.5; }
.editor-note { display:flex; gap:9px; align-items:flex-start; padding:11px; margin-top:16px; color:#3d695e; background:#eef7f4; border-radius:9px; }
.editor-note p { margin:0; font-size:12px; line-height:1.5; }
.flow-editor-steps { display:grid; grid-template-columns:repeat(4,1fr); gap:7px; padding:6px; margin-bottom:20px; background:#f1f5f3; border-radius:13px; }
.flow-editor-steps button { display:flex; gap:9px; align-items:center; padding:10px; text-align:left; background:transparent; border:0; border-radius:9px; }
.flow-editor-steps button.active { background:#fff; box-shadow:0 5px 13px rgb(42 72 63 / 8%); }
.flow-editor-steps button.complete { background:#eaf4f0; }
.flow-editor-steps button > span { display:grid; flex:none; width:26px; height:26px; place-items:center; font-size:12px; font-weight:800; color:#fff; background:#abb7b3; border-radius:50%; }
.flow-editor-steps button.active > span { background:#a85931; }
.flow-editor-steps button.complete > span { background:#2a7c68; }
.flow-editor-steps strong,.flow-editor-steps small { display:block; }
.flow-editor-steps strong { font-size:12px; color:#42544f; }
.flow-editor-steps small { margin-top:2px; font-size:12px; color:#8c9995; }
.flow-goal-layout { display:grid; grid-template-columns:minmax(0,1fr) 390px; gap:22px; }
.goal-form { min-width:0; padding-right:22px; border-right:1px solid #e4ebe8; }
.goal-form header { margin-bottom:18px; }
.goal-form header small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.12em; }
.goal-form header h2 { margin:4px 0; font-size:19px; color:#2b403a; }
.goal-form header p { margin:0; font-size:12px; color:#788781; }
.goal-form > label { display:flex; align-items:center; justify-content:space-between; margin:14px 0 6px; font-size:12px; font-weight:800; color:#40564f; }
.ai-usage-preview { padding:17px; background:#f6f9f8; border:1px solid #dce8e4; border-radius:15px; }
.ai-usage-preview > header { display:flex; gap:11px; align-items:center; padding-bottom:13px; border-bottom:1px solid #e0e9e6; }
.ai-usage-preview > header > span { display:grid; width:38px; height:38px; place-items:center; font-size:18px; color:#fff; background:#2c6b5c; border-radius:11px; }
.ai-usage-preview header small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.1em; }
.ai-usage-preview header h3 { margin:2px 0 0; font-size:14px; color:#304841; }
.preview-input { padding:11px; margin:13px 0; color:#5e5048; background:#fff8f3; border:1px solid #f0ddd1; border-radius:10px; }
.preview-input small,.preview-result small { font-size:12px; font-weight:800; color:#a85931; }
.preview-input p { margin:4px 0 0; font-size:12px; line-height:1.55; }
.ai-reasoning { display:grid; gap:8px; padding:0; margin:0; list-style:none; }
.ai-reasoning li { display:flex; gap:9px; align-items:flex-start; }
.ai-reasoning li > span { display:grid; flex:none; width:22px; height:22px; place-items:center; font-size:12px; font-weight:800; color:#26715f; background:#e3f1ec; border-radius:7px; }
.ai-reasoning strong { display:block; font-size:12px; color:#3e554e; }
.ai-reasoning p { margin:2px 0 0; font-size:12px; line-height:1.5; color:#798883; }
.used-rules { padding-top:13px; margin-top:13px; border-top:1px solid #e0e9e6; }
.used-rules h4 { margin:0 0 8px; font-size:12px; color:#4a6059; }
.used-rule { display:grid; grid-template-columns:20px minmax(0,1fr) auto; gap:7px; align-items:center; padding:7px; margin-bottom:6px; color:#25715f; background:#edf7f3; border-radius:8px; }
.used-rule.advisory { color:#a26731; background:#fff7eb; }
.used-rule span strong,.used-rule span small { display:block; }
.used-rule span strong { font-size:12px; color:#3f554f; }
.used-rule span small { margin-top:2px; font-size:12px; color:#7e8d88; }
.used-rule :deep(.ant-tag) { margin:0; font-size:12px; }
.preview-result { display:flex; gap:9px; align-items:flex-start; padding:11px; margin-top:12px; color:#236b59; background:#e9f5f0; border:1px solid #cde5dc; border-radius:10px; }
.preview-result > svg { flex:none; margin-top:2px; }
.preview-result strong { display:block; margin:3px 0; font-size:12px; color:#304d45; }
.preview-result p { margin:0; font-size:12px; line-height:1.5; color:#657b74; }
.drawer-footer { display:flex; gap:8px; align-items:center; justify-content:flex-end; padding-top:18px; margin-top:20px; border-top:1px solid #e4ece9; }
.autosave-hint { display:flex; flex:1; gap:6px; align-items:center; font-size:12px; color:#84938e; }
.flow-section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; margin-bottom:18px; }
.flow-section-head small,.publish-hero > small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.12em; }
.flow-section-head h2,.publish-hero h2 { margin:4px 0; font-size:19px; color:#2b403a; }
.flow-section-head p,.publish-hero p { margin:0; font-size:12px; color:#788781; }
.stage-editor-layout { display:grid; grid-template-columns:minmax(0,1fr) 330px; gap:20px; }
.cross-stage-note { display:flex; gap:10px; align-items:flex-start; padding:12px 14px; margin-bottom:14px; color:#2b725f; background:#eaf5f1; border:1px solid #d3e8e0; border-radius:11px; }
.cross-stage-note > svg { flex:none; margin-top:2px; }
.cross-stage-note strong { display:block; font-size:12px; color:#37564d; }
.cross-stage-note p { margin:3px 0 0; font-size:12px; line-height:1.5; color:#688078; }
.stage-config-layout { display:grid; grid-template-columns:210px minmax(0,1fr); min-height:560px; overflow:hidden; border:1px solid #dfe8e5; border-radius:14px; }
.stage-config-list { padding:10px; background:#f4f7f6; border-right:1px solid #dfe8e5; }
.stage-config-list button { display:grid; grid-template-columns:28px minmax(0,1fr) 16px; gap:8px; align-items:center; width:100%; padding:10px 8px; margin-bottom:5px; text-align:left; cursor:pointer; background:transparent; border:1px solid transparent; border-radius:9px; }
.stage-config-list button.active { background:#fff; border-color:#d3e2dd; box-shadow:0 5px 12px rgb(37 73 63 / 6%); }
.stage-config-list button > span { display:grid; width:26px; height:26px; place-items:center; font-size:12px; font-weight:800; color:#fff; background:#96aaa4; border-radius:7px; }
.stage-config-list button.active > span { background:#a85931; }
.stage-config-list strong,.stage-config-list small { display:block; }
.stage-config-list strong { overflow:hidden; font-size:12px; color:#40564f; text-overflow:ellipsis; white-space:nowrap; }
.stage-config-list small { margin-top:3px; font-size:12px; color:#8a9893; }
.stage-config-list button > svg { color:#a5b0ac; }
.stage-detail-editor { min-width:0; padding:18px; }
.stage-detail-editor > header { display:flex; align-items:flex-start; justify-content:space-between; gap:15px; padding-bottom:14px; border-bottom:1px solid #e6ecea; }
.stage-detail-editor > header small { font-size:12px; font-weight:800; color:#a85931; letter-spacing:.1em; }
.stage-detail-editor > header h3 { margin:3px 0; font-size:16px; color:#304840; }
.stage-detail-editor > header p { margin:0; font-size:12px; color:#82908b; }
.stage-basic-grid { display:grid; grid-template-columns:1fr 1fr 150px; gap:10px; margin-top:14px; }
.stage-basic-grid label > span,.criteria-grid label > span,.stage-ai-action > span { display:block; margin-bottom:5px; font-size:12px; font-weight:800; color:#536961; }
.criteria-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
.material-editor { margin-top:15px; overflow:hidden; border:1px solid #dfe8e5; border-radius:11px; }
.material-editor > header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 12px; background:#f5f8f7; }
.material-editor > header strong { display:block; font-size:12px; color:#40564f; }
.material-editor > header p { margin:2px 0 0; font-size:12px; color:#86948f; }
.material-editor article { display:grid; grid-template-columns:minmax(0,1fr) 135px 48px 28px; gap:8px; align-items:center; padding:10px 12px; border-top:1px solid #e9eeec; }
.material-main { display:grid; grid-template-columns:145px minmax(0,1fr); gap:7px; }
.required-toggle { padding:6px 5px; font-size:12px; color:#7a8984; cursor:pointer; background:#f1f4f3; border:1px solid #dce4e1; border-radius:7px; }
.required-toggle.active { color:#a14f28; background:#fff2e9; border-color:#e8b492; }
.material-remove { display:grid; width:27px; height:27px; place-items:center; color:#a86b5c; cursor:pointer; background:#fff3f0; border:0; border-radius:7px; }
.stage-ai-action { display:block; margin-top:14px; }
.stage-detail-editor .stage-rule-map { margin-top:14px; }
.editable-stages { display:grid; gap:9px; }
.editable-stages article { display:grid; grid-template-columns:34px minmax(180px,.7fr) minmax(220px,1fr) 34px; gap:11px; align-items:center; padding:13px; background:#fff; border:1px solid #dfe9e5; border-radius:12px; }
.stage-order { display:grid; width:30px; height:30px; place-items:center; font-size:12px; font-weight:800; color:#fff; background:#a85931; border-radius:9px; }
.editable-stages label { display:block; margin-bottom:5px; font-size:12px; font-weight:800; color:#788983; }
.stage-gate-summary { min-width:0; padding:7px 10px; background:#f4f7f6; border-radius:8px; }
.stage-gate-summary small,.stage-gate-summary strong { display:block; }
.stage-gate-summary small { margin-bottom:3px; font-size:12px; color:#899792; }
.stage-gate-summary strong { overflow:hidden; font-size:12px; font-weight:600; color:#516761; text-overflow:ellipsis; white-space:nowrap; }
.editable-stages article > button { display:grid; width:30px; height:30px; place-items:center; color:#a16a5c; cursor:pointer; background:#fff4f1; border:0; border-radius:8px; }
.stage-rule-map { padding:15px; background:#f6f9f8; border:1px solid #dce8e4; border-radius:14px; }
.stage-rule-map > header { display:flex; gap:9px; align-items:flex-start; padding-bottom:12px; border-bottom:1px solid #e0e9e6; }
.stage-rule-map > header > svg { margin-top:2px; color:#2b7765; }
.stage-rule-map > header strong { display:block; font-size:12px; color:#3e554e; }
.stage-rule-map > header p { margin:3px 0 0; font-size:12px; color:#84938e; }
.stage-rule-map > div { display:grid; grid-template-columns:30px minmax(0,1fr) auto; gap:8px; align-items:center; padding:10px 0; border-bottom:1px solid #e8eeec; }
.stage-rule-map > div:last-child { border-bottom:0; }
.stage-rule-map > div > span { display:grid; width:28px; height:28px; place-items:center; color:#2c7563; background:#e6f1ed; border-radius:8px; }
.stage-rule-map > div strong,.stage-rule-map > div small { display:block; }
.stage-rule-map > div strong { font-size:12px; color:#425851; }
.stage-rule-map > div small { margin-top:2px; font-size:12px; color:#899792; }
.ai-execution-page { max-width:820px; margin:auto; }
.ai-mode-list { display:grid; gap:9px; }
.ai-mode-list article { display:grid; grid-template-columns:40px minmax(0,1fr) 72px; gap:12px; align-items:center; padding:14px; background:#fff; border:1px solid #dfe9e5; border-radius:12px; }
.ai-mode-list article.disabled { opacity:.58; }
.ai-mode-list article > span { display:grid; width:38px; height:38px; place-items:center; font-size:18px; color:#2a7663; background:#e7f2ee; border-radius:10px; }
.ai-mode-list article > div > div { display:flex; gap:7px; align-items:center; }
.ai-mode-list h3 { margin:0; font-size:12px; color:#354c45; }
.ai-mode-list p { margin:4px 0 0; font-size:12px; color:#7a8984; }
.ai-mode-list article > button { position:relative; width:68px; height:28px; cursor:pointer; background:#e5e9e7; border:0; border-radius:15px; }
.ai-mode-list article > button i { position:absolute; top:4px; left:4px; width:20px; height:20px; background:#fff; border-radius:50%; box-shadow:0 2px 5px rgb(0 0 0 / 15%); transition:.2s; }
.ai-mode-list article > button em { position:absolute; right:7px; font-size:12px; font-style:normal; color:#7f8c88; }
.ai-mode-list article > button.active { background:#2c806b; }
.ai-mode-list article > button.active i { left:44px; }
.ai-mode-list article > button.active em { right:auto; left:7px; color:#fff; }
.ai-instruction-editor { padding:15px; margin-top:15px; background:#fbf5f1; border:1px solid #efddd1; border-radius:12px; }
.ai-instruction-editor label { font-size:12px; font-weight:800; color:#654b3e; }
.ai-instruction-editor p { margin:3px 0 9px; font-size:12px; color:#93796b; }
.ai-boundary-table { margin-top:15px; overflow:hidden; border:1px solid #dfe9e5; border-radius:12px; }
.ai-boundary-table header { display:flex; gap:9px; align-items:flex-start; padding:12px; background:#f3f7f5; }
.ai-boundary-table header svg { margin-top:2px; color:#287561; }
.ai-boundary-table header strong { display:block; font-size:12px; color:#3d554e; }
.ai-boundary-table header p { margin:2px 0 0; font-size:12px; color:#87958f; }
.ai-boundary-table > div { display:grid; grid-template-columns:110px 1fr 150px; gap:12px; padding:10px 12px; font-size:12px; border-top:1px solid #e8eeec; }
.ai-boundary-table > div span { font-weight:800; color:#526862; }
.ai-boundary-table > div strong { color:#71817c; }
.ai-boundary-table > div em { color:#a25934; font-style:normal; }
.publish-page { max-width:800px; margin:auto; }
.publish-hero { padding:24px; text-align:center; background:linear-gradient(145deg,#f3f8f6,#fbf5f1); border:1px solid #dbe7e3; border-radius:16px; }
.publish-hero > span { display:grid; width:48px; height:48px; margin:0 auto 9px; place-items:center; font-size:23px; color:#fff; background:#2a7663; border-radius:14px; }
.publish-summary-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin-top:14px; }
.publish-summary-grid article { padding:14px; border:1px solid #dfe9e5; border-radius:11px; }
.publish-summary-grid small,.publish-summary-grid strong { display:block; }
.publish-summary-grid small { font-size:12px; font-weight:800; color:#a85931; }
.publish-summary-grid strong { margin:4px 0; font-size:12px; color:#40564f; }
.publish-summary-grid p { margin:0; font-size:12px; line-height:1.5; color:#7e8d88; }
.publish-checks { padding:15px; margin-top:14px; background:#f6f9f8; border-radius:12px; }
.publish-checks h3 { margin:0 0 8px; font-size:12px; color:#3e554e; }
.publish-checks > div { display:flex; gap:9px; align-items:flex-start; padding:8px 0; color:#287561; border-top:1px solid #e5ece9; }
.publish-checks > div.warning { color:#bd762c; }
.publish-checks strong,.publish-checks small { display:block; }
.publish-checks strong { font-size:12px; color:#445b54; }
.publish-checks small { margin-top:2px; font-size:12px; color:#87958f; }
.generate-summary > svg { flex:none; margin-top:2px; font-size:24px; color:#16806b; }
.generate-summary h3 { margin:0 0 5px; font-size:14px; color:#2f4b43; }
@keyframes spin { to { transform:rotate(360deg); } }
@media (max-width:1100px) { .template-grid { grid-template-columns:1fr; } .flow-goal-layout,.stage-editor-layout,.stage-config-layout { grid-template-columns:1fr; } .goal-form { padding-right:0; border-right:0; } .stage-config-list { border-right:0; border-bottom:1px solid #dfe8e5; } }
@media (max-width:760px) { .policy-summary,.detail-head,.panel-head { align-items:flex-start; flex-direction:column; } .summary-progress { width:100%; text-align:left; } .framework-layout { grid-template-columns:1fr; } .chapter-list { border-right:0; border-bottom:1px solid #e0e9e6; } .rule-card { grid-template-columns:34px 1fr; } .rule-actions { grid-column:2; } .source-list article { grid-template-columns:42px 1fr; } }
</style>
