<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Checkbox,
  Drawer,
  Dropdown,
  Input,
  Menu,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import FillInvoiceCard from './components/fill-assistant/FillInvoiceCard.vue';
import FillPlanCard from './components/fill-assistant/FillPlanCard.vue';
import FillSummaryCard from './components/fill-assistant/FillSummaryCard.vue';
import {
  pptBaseMenus,
  pptConversationList,
  pptOperationSteps,
  pptQuickSchemes,
  pptStyleTemplates,
} from './components/ppt-assistant/mock-data';
import PptAssistantChatHeader from './components/ppt-assistant/PptAssistantChatHeader.vue';
import PptBuildDrawer from './components/ppt-assistant/PptBuildDrawer.vue';
import PptPreviewWorkspace from './components/ppt-assistant/PptPreviewWorkspace.vue';
import ApplicationSelectCard from './components/smart-fill/ApplicationSelectCard.vue';
import ApplicationSelectTableCard from './components/smart-fill/ApplicationSelectTableCard.vue';
import ExpenseEditCard from './components/smart-fill/ExpenseEditCard.vue';
import HeaderCollectCard from './components/smart-fill/HeaderCollectCard.vue';
import InvoiceConfirmCard from './components/smart-fill/InvoiceConfirmCard.vue';
import InvoiceSelectTableCard from './components/smart-fill/InvoiceSelectTableCard.vue';
import TripEditCard from './components/smart-fill/TripEditCard.vue';

const router = useRouter();
const route = useRoute();
const currentId = route.params.id as string;

// Map Agent IDs to their realistic profiles
const agentsDb: Record<string, any> = {
  agt_1: {
    name: '选品报价员',
    role: '销售部',
    image: '/auditdemo/images/ai-employee/sales.png',
    status: 'online',
  },
  agt_2: {
    name: '数据分析员',
    role: '数据中心',
    image: '/auditdemo/images/ai-employee/data.png',
    status: 'online',
  },
  agt_3: {
    name: '库管预警员',
    role: '供应链部',
    image: '/auditdemo/images/ai-employee/warehouse.png',
    status: 'offline',
  },
  agt_4: {
    name: '合规审核专员',
    role: '风控合规部',
    image: '/auditdemo/images/ai-employee/finance.png',
    status: 'busy',
  },
  agt_5: {
    name: '智能填报专员',
    role: '财务部',
    image: '/auditdemo/images/ai-employee/咨询人员.jpg',
    status: 'online',
  },
  agt_6: {
    name: 'PPT助理',
    role: '办公效率线',
    image: '/auditdemo/images/ai-employee/插画设计师.jpg',
    status: 'online',
  },
  agt_7: {
    name: '费用类智能填报专员',
    role: '财务部',
    image: '/auditdemo/images/ai-employee/咨询人员.jpg',
    status: 'online',
  },
  agt_8: {
    name: '智能填报专员v2',
    role: '财务部',
    image: '/auditdemo/images/ai-employee/咨询人员.jpg',
    status: 'online',
  },
  agt_9: {
    name: '智能填报专员v3',
    role: '财务部',
    image: '/auditdemo/images/ai-employee/咨询人员.jpg',
    status: 'online',
  },
  agt_10: {
    name: '填报助理',
    role: '财务部',
    image: '/auditdemo/images/ai-employee/咨询人员.jpg',
    status: 'online',
  },
};

const currentAgent = computed(() => agentsDb[currentId] || agentsDb.agt_1);

const pptResourceCards = ref<
  Record<
    string,
    Array<{
      desc: string;
      meta: string;
      tags: string[];
      title: string;
    }>
  >
>({
  scheme: [
    {
      title: '设备售前客户宣讲方案',
      desc: '适用场景：设备、产品、解决方案类售前客户宣讲。\n标准结构：客户背景 → 行业痛点 → 解决方案 → 产品优势 → 客户案例 → 实施路径 → 服务保障。\n数据源提示：优先调取产品参数库、客户资料库、历史同类售前案例和售前服务话术。\n生成要求：突出客户业务痛点、设备适配能力、交付保障和可量化收益。',
      meta: '使用 128 次 · 默认方案',
      tags: ['售前', '设备', '客户宣讲'],
    },
    {
      title: '项目复盘分析方案',
      desc: '适用场景：项目阶段复盘、交付总结、管理层复盘汇报。\n标准结构：目标回顾 → 执行过程 → 关键成果 → 问题风险 → 原因分析 → 经验沉淀 → 后续计划。\n数据源提示：优先调取项目过程资料、交付记录、会议纪要和历史复盘案例。\n生成要求：客观呈现问题，沉淀可复用经验，明确下一阶段行动。',
      meta: '使用 86 次',
      tags: ['项目复盘', '管理汇报'],
    },
    {
      title: '工作总结汇报方案',
      desc: '适用场景：周报、月报、季度汇报、部门工作总结。\n标准结构：工作概览 → 核心成果 → 数据指标 → 重点项目 → 问题风险 → 下阶段规划。\n数据源提示：优先调取周会纪要、任务记录、业务数据和部门目标。\n生成要求：突出成果价值、数据支撑和后续行动计划。',
      meta: '使用 210 次',
      tags: ['工作汇报', '周会'],
    },
  ],
  template: [
    {
      title: '蓝色科技风售前模板',
      desc: '适合设备方案、技术宣讲、产品介绍，突出专业与可信。',
      meta: '最近使用：今天 · 默认模板',
      tags: ['科技蓝', '售前'],
    },
    {
      title: '极简商务汇报模板',
      desc: '适合管理层汇报、阶段总结和经营分析。',
      meta: '最近使用：昨天',
      tags: ['商务', '简洁'],
    },
    {
      title: '深色发布会模板',
      desc: '适合战略宣讲、产品发布和对外路演。',
      meta: '最近使用：3天前',
      tags: ['深色', '发布会'],
    },
    {
      title: '白底咨询报告模板',
      desc: '适合咨询报告、项目复盘和结构化分析汇报。',
      meta: '最近使用：5天前',
      tags: ['咨询风', '报告'],
    },
  ],
  case: [
    {
      title: '某半导体客户 D 系列设备售前方案',
      desc: '沉淀设备能力介绍、客户痛点分析和实施收益测算结构。',
      meta: '引用 42 次 · 最近引用：今天',
      tags: ['半导体', 'D系列', '售前'],
    },
    {
      title: '华东区域设备宣讲 PPT',
      desc: '包含区域客户共性诉求、标准话术和服务保障说明。',
      meta: '引用 29 次 · 最近引用：昨天',
      tags: ['区域宣讲', '设备'],
    },
    {
      title: '2026 Q1 项目复盘汇报',
      desc: '适合复用项目目标复盘、交付风险总结和经验沉淀结构。',
      meta: '引用 18 次',
      tags: ['项目复盘', '汇报'],
    },
  ],
  knowledge: [
    {
      title: 'D7020 设备参数说明',
      desc: '包含性能指标、适配产线、部署要求和核心优势。',
      meta: '产品参数库 · 更新于今天',
      tags: ['产品参数', 'D7020'],
    },
    {
      title: '长鑫客户背景资料',
      desc: '记录客户业务背景、关注重点和历史沟通摘要。',
      meta: '客户资料库 · 引用 31 次',
      tags: ['客户资料', '长鑫'],
    },
    {
      title: '半导体制造行业痛点',
      desc: '沉淀行业常见痛点、设备导入挑战和客户决策关注点。',
      meta: '行业知识库 · 已启用',
      tags: ['行业痛点', '半导体'],
    },
  ],
});

const pptActiveMenu = ref('employee');
const pptPreviewEnabled = ref(false);
const pptMenus = computed(() => {
  return pptPreviewEnabled.value
    ? [
        ...pptBaseMenus,
        { key: 'preview', label: '在线预览', icon: 'lucide:screen-share' },
      ]
    : pptBaseMenus;
});
const activePptMenu = computed(
  () =>
    pptMenus.value.find((item) => item.key === pptActiveMenu.value) ||
    pptMenus.value[0],
);
const activePptCards = computed(
  () => pptResourceCards.value[pptActiveMenu.value] || [],
);
const selectedPptConversationId = ref('new');
const artifactSearchForm = ref({ keyword: '', scheme: '', status: '' });
const schemeEditorVisible = ref(false);
const editingSchemeIndex = ref(-1);
const schemeEditorForm = ref({
  desc: '',
  tags: '',
  title: '',
});
const knowledgeUploadVisible = ref(false);
const knowledgeUploadForm = ref({
  desc: '',
  title: '',
});
const resourceUploadVisible = ref(false);
const resourceUploadType = ref<'case' | 'template'>('template');
const resourceUploadForm = ref({
  desc: '',
  tags: '',
  title: '',
});
const resourceRemoveVisible = ref(false);
const pendingRemoveResource = ref({ index: -1, title: '', type: '' });
const pptInputText = ref('');
const pptQuickSchemeExpanded = ref(false);
const pptDrawerVisible = ref(false);
const referencePickerVisible = ref(false);
const referencePickerType = ref<'case' | 'knowledge'>('case');
const selectedReferenceItems = ref<string[]>([]);
const selectedPptScheme = ref('设备售前客户宣讲');
const selectedPptStyle = ref('蓝色科技风');
const pptSchemeText = ref(
  'PPT主题：长鑫 D7020 设备售前 PPT\n目标客户：长鑫\n产品/设备：D7020\n使用场景：半导体制造设备售前宣讲\n重点表达：稳定性、产线适配、交付周期\n默认结构：客户背景、行业痛点、解决方案、产品优势、客户案例、实施路径、服务保障\n补充要求：控制在 10 页以内，风格专业正式',
);
const generatedPptCopyVersion = ref(1);
const generatedPptCopy = ref([
  {
    label: '目录',
    items: [
      '1. 客户背景与业务目标',
      '2. 行业痛点分析',
      '3. D7020 设备解决方案',
      '4. 产品优势与适配场景',
      '5. 实施路径与服务保障',
    ],
  },
  {
    label: '章节',
    items: [
      '1. 客户背景与业务目标',
      '1.1 长鑫业务背景',
      '1.2 当前设备导入诉求',
      '本章用于说明客户当前业务背景、设备导入目标和售前沟通重点，为后续方案展开建立上下文。',
    ],
  },
  {
    label: '内页',
    items: [
      '2. 行业痛点分析',
      '2.1 设备连续运行稳定性要求高',
      '2.2 产线适配周期长',
      '结合半导体制造场景，重点呈现客户在设备稳定性、交付窗口和售后响应上的核心关注点。',
    ],
  },
]);

const pptMatchedCases = ref([
  '某半导体客户 D 系列设备售前方案',
  '华东区域设备宣讲 PPT',
  '智能制造设备解决方案案例',
]);

const pptKnowledgeRefs = ref([
  'D7020 设备参数说明',
  '长鑫客户背景资料',
  '半导体制造行业痛点',
  'D7020 产品优势总结',
  '售前服务保障话术',
]);
const referencePickerOptions = computed(() => {
  const source =
    referencePickerType.value === 'case'
      ? pptResourceCards.value.case
      : pptResourceCards.value.knowledge;

  return source.map((item) => item.title);
});

const pptArtifacts = ref([
  {
    id: 'ppt_1',
    title: '长鑫 D7020 设备售前 PPT',
    scheme: '设备售前客户宣讲',
    style: '蓝色科技风',
    pages: 5,
    version: 3,
    status: '已编辑',
    createdAt: '2026-06-12 14:30',
    updatedAt: '2026-06-12 15:10',
  },
  {
    id: 'ppt_2',
    title: '2026 Q1 项目复盘汇报',
    scheme: '项目复盘',
    style: '白底咨询风',
    pages: 12,
    version: 2,
    status: '已生成',
    createdAt: '2026-06-10 10:20',
    updatedAt: '2026-06-10 11:05',
  },
  {
    id: 'ppt_3',
    title: '华东区域渠道合作方案',
    scheme: '渠道合作',
    style: '极简商务风',
    pages: 8,
    version: 1,
    status: '已生成',
    createdAt: '2026-06-08 09:45',
    updatedAt: '2026-06-08 09:45',
  },
]);

const filteredPptArtifacts = computed(() => {
  const { keyword, scheme, status } = artifactSearchForm.value;
  return pptArtifacts.value.filter((item) => {
    const matchedKeyword = !keyword || item.title.includes(keyword);
    const matchedScheme = !scheme || item.scheme === scheme;
    const matchedStatus = !status || item.status === status;
    return matchedKeyword && matchedScheme && matchedStatus;
  });
});

const pptSlides = ref([
  {
    id: 'slide_1',
    title: '长鑫 D7020 设备售前方案',
    subtitle: '面向半导体制造场景的智能设备解决方案',
    copy: '本页作为售前方案封面，突出 D7020 设备面向长鑫半导体制造场景的专业定位，建立正式、可信、技术导向的宣讲基调。',
    bullets: [
      '企业专属模板生成',
      '融合历史案例与知识库内容',
      '统一公司 PPT 输出风格',
    ],
    cases: ['某半导体客户 D 系列设备售前方案'],
    knowledge: ['D7020 设备参数说明', '长鑫客户背景资料'],
  },
  {
    id: 'slide_2',
    title: '客户背景与业务目标',
    subtitle: '聚焦产线效率、交付稳定性与设备适配能力',
    copy: '本页用于说明长鑫当前业务目标与设备导入诉求，强调客户对稳定运行、快速适配和交付保障的核心关注。',
    bullets: [
      '产线升级对设备稳定性要求提升',
      '新设备导入需要缩短适配周期',
      '交付窗口紧张，需要成熟服务体系支撑',
    ],
    cases: ['华东区域设备宣讲 PPT'],
    knowledge: ['长鑫客户背景资料', '半导体制造行业痛点'],
  },
  {
    id: 'slide_3',
    title: '行业痛点分析',
    subtitle: '半导体制造设备导入面临多维挑战',
    copy: '本页用于概括半导体制造场景下的核心痛点，为后续引出 D7020 设备解决方案建立问题背景。',
    bullets: [
      '设备连续运行稳定性要求高',
      '产线适配与验证周期长',
      '交付和售后响应要求严格',
    ],
    cases: ['智能制造设备解决方案案例'],
    knowledge: ['半导体制造行业痛点', '售前服务保障话术'],
  },
  {
    id: 'slide_4',
    title: 'D7020 解决方案',
    subtitle: '以标准化部署能力降低客户导入风险',
    copy: '本页说明 D7020 设备如何通过成熟参数配置、标准化部署路径和服务保障机制满足客户业务目标。',
    bullets: ['标准化设备参数配置', '快速产线适配流程', '交付与售后服务协同'],
    cases: ['某半导体客户 D 系列设备售前方案'],
    knowledge: ['D7020 设备参数说明', 'D7020 产品优势总结'],
  },
  {
    id: 'slide_5',
    title: '实施路径与服务保障',
    subtitle: '从方案确认到上线运行的闭环交付',
    copy: '本页展示项目实施阶段、关键交付节点和服务保障机制，帮助客户形成明确的推进预期。',
    bullets: ['需求确认与现场评估', '设备部署与产线适配', '上线验收与持续服务'],
    cases: ['华东区域设备宣讲 PPT'],
    knowledge: ['售前服务保障话术', 'D7020 产品优势总结'],
  },
]);
const selectedPptSlideId = ref('slide_1');

const pptChatMessages = ref<
  Array<{
    actionText?: string;
    cardDesc?: string;
    cardTitle?: string;
    content?: string;
    isPlanCard?: boolean;
    isResultCard?: boolean;
    role: string;
    time: string;
  }>
>([
  {
    role: 'agent',
    time: '14:20:48',
    content:
      '你好，我是 PPT助理。你可以直接输入 PPT 需求，让我自动生成制作方案；也可以先在下方选择方案模板，再补充细节和选择 PPT 风格模板。',
  },
]);

function getPptSchemeText(scheme: string) {
  const matchedScheme = pptQuickSchemes.find((item) => item.title === scheme);
  const structure = matchedScheme?.desc || '根据用户需求组织内容结构';
  return `PPT主题：长鑫 D7020 设备售前 PPT\n目标客户：长鑫\n产品/设备：D7020\n使用场景：半导体制造设备售前宣讲\n重点表达：稳定性、产线适配、交付周期\n默认结构：${structure}\n补充要求：控制在 10 页以内，风格专业正式`;
}

function openPptDrawer(scheme?: string) {
  if (scheme) {
    selectedPptScheme.value = scheme;
    pptSchemeText.value = getPptSchemeText(scheme);
  }
  pptDrawerVisible.value = true;
}

function removePptCase(index: number) {
  pptMatchedCases.value.splice(index, 1);
}

function removePptKnowledge(index: number) {
  pptKnowledgeRefs.value.splice(index, 1);
}

function openReferencePicker(type: 'case' | 'knowledge') {
  referencePickerType.value = type;
  selectedReferenceItems.value = [];
  referencePickerVisible.value = true;
}

function saveReferencePicker() {
  const targetList =
    referencePickerType.value === 'case' ? pptMatchedCases : pptKnowledgeRefs;
  selectedReferenceItems.value.forEach((item) => {
    if (!targetList.value.includes(item)) {
      targetList.value.push(item);
    }
  });
  referencePickerVisible.value = false;
  message.success('引用资料已添加');
}

function updateGeneratedPptCopyItem(
  sectionIndex: number,
  itemIndex: number,
  value: string,
) {
  const targetSection = generatedPptCopy.value[sectionIndex];
  if (!targetSection) return;

  targetSection.items[itemIndex] = value;
}

function rematchPptReferences() {
  message.success('已根据方案提示词重新匹配历史案例和知识库');
}

function regeneratePptCopy() {
  generatedPptCopyVersion.value += 1;
  generatedPptCopy.value = [
    {
      label: '目录',
      items: [
        '1. 客户背景与业务目标',
        '2. 行业痛点与决策关注',
        '3. D7020 设备解决方案',
        '4. 适配价值与客户收益',
        '5. 实施路径与服务保障',
      ],
    },
    {
      label: '章节',
      items: [
        '1. 客户背景与业务目标',
        '1.1 长鑫业务背景',
        '1.2 设备导入目标',
        '围绕修改后的方案提示词，重新组织客户背景、设备诉求和售前沟通重点。',
      ],
    },
    {
      label: '内页',
      items: [
        '2. 行业痛点与决策关注',
        '2.1 连续运行稳定性',
        '2.2 产线适配与交付窗口',
        '本页突出客户对稳定性、适配周期和交付确定性的关注，并引出 D7020 的方案价值。',
      ],
    },
  ];
  message.success('已结合当前方案、案例库和知识库重新生成 PPT 文案');
}

function openSchemeEditor(index = -1) {
  editingSchemeIndex.value = index;
  const target = pptResourceCards.value.scheme[index];
  schemeEditorForm.value = target
    ? {
        desc: target.desc,
        tags: target.tags.join('、'),
        title: target.title,
      }
    : {
        desc: '适用场景：\n标准结构：\n数据源提示：\n生成要求：',
        tags: '',
        title: '',
      };
  schemeEditorVisible.value = true;
}

function saveSchemeTemplate() {
  if (!schemeEditorForm.value.title.trim()) {
    message.warning('请输入方案名称');
    return;
  }

  const data = {
    desc: schemeEditorForm.value.desc,
    meta: editingSchemeIndex.value >= 0 ? '已编辑' : '新建方案',
    tags: schemeEditorForm.value.tags.split('、').filter(Boolean),
    title: schemeEditorForm.value.title,
  };

  if (editingSchemeIndex.value >= 0) {
    pptResourceCards.value.scheme[editingSchemeIndex.value] = data;
  } else {
    pptResourceCards.value.scheme.unshift(data);
  }
  schemeEditorVisible.value = false;
  message.success('方案模板已保存');
}

function uploadKnowledgeDemo() {
  if (!knowledgeUploadForm.value.title.trim()) {
    message.warning('请输入资料名称');
    return;
  }

  pptResourceCards.value.knowledge.unshift({
    desc: knowledgeUploadForm.value.desc,
    meta: '上传资料 · 刚刚',
    tags: ['上传资料'],
    title: knowledgeUploadForm.value.title,
  });
  knowledgeUploadVisible.value = false;
  knowledgeUploadForm.value = {
    desc: '',
    title: '',
  };
  message.success('知识资料已上传');
}

function openResourceUpload(type: 'case' | 'template') {
  resourceUploadType.value = type;
  resourceUploadForm.value = { desc: '', tags: '', title: '' };
  resourceUploadVisible.value = true;
}

function saveResourceUpload() {
  if (!resourceUploadForm.value.title.trim()) {
    message.warning('请输入名称');
    return;
  }

  pptResourceCards.value[resourceUploadType.value].unshift({
    desc: resourceUploadForm.value.desc,
    meta:
      resourceUploadType.value === 'template'
        ? '上传模板 · 刚刚'
        : '上传案例 · 刚刚',
    tags: resourceUploadForm.value.tags.split('、').filter(Boolean),
    title: resourceUploadForm.value.title,
  });
  resourceUploadVisible.value = false;
  message.success(
    resourceUploadType.value === 'template' ? 'PPT模板已上传' : '案例已上传',
  );
}

function openRemoveResourceConfirm(type: string, index: number, title: string) {
  pendingRemoveResource.value = { index, title, type };
  resourceRemoveVisible.value = true;
}

function confirmRemoveResource() {
  const { index, type } = pendingRemoveResource.value;
  if (index < 0 || !type) return;

  pptResourceCards.value[type].splice(index, 1);
  resourceRemoveVisible.value = false;
  message.success('已移除');
}

function resetArtifactSearch() {
  artifactSearchForm.value = { keyword: '', scheme: '', status: '' };
}

function handlePptSend() {
  const content = pptInputText.value.trim();
  if (!content) {
    message.warning('请输入 PPT 生成需求');
    return;
  }

  pptChatMessages.value.push(
    {
      role: 'user',
      time: '刚刚',
      content,
    },
    {
      role: 'agent',
      time: '刚刚',
      isPlanCard: true,
      cardTitle: '已生成 PPT 制作方案',
      cardDesc:
        'AI 已自动匹配方案模板、PPT风格模板、历史案例和知识库，可进入侧边栏调整后开始制作。',
      actionText: '查看并制作 PPT',
    },
  );
  pptInputText.value = '';
}

function handleStartPptBuild() {
  pptDrawerVisible.value = false;
  pptChatMessages.value.push({
    role: 'agent',
    time: '刚刚',
    isResultCard: true,
    cardTitle: 'PPT 初稿已生成',
    cardDesc:
      '已完成 5 页演示文稿初稿，可进入在线预览查看每页内容、编辑文案并查看引用来源。',
    actionText: '在线预览',
  });
  message.success('PPT 初稿已生成');
}

function openPptPreview() {
  pptPreviewEnabled.value = true;
  pptActiveMenu.value = 'preview';
}

function openArtifactPreview() {
  openPptPreview();
}

function exportPptFile(type: 'PDF' | 'PPT') {
  message.success(`已开始导出${type}文件`);
}

function downloadArtifact(type: 'PDF' | 'PPT') {
  message.success(`已开始下载${type}文件`);
}

function addArtifactToCaseLibrary(artifactId: string) {
  const artifact = pptArtifacts.value.find((item) => item.id === artifactId);
  if (!artifact) return;

  message.success(`已将「${artifact.title}」加入案例库`);
}

function updatePptSlideCopy(slideId: string, value: string) {
  const targetSlide = pptSlides.value.find((item) => item.id === slideId);
  if (!targetSlide) return;

  targetSlide.copy = value;
}

function regenerateCurrentSlide() {
  message.success('已根据修改后的文案重新生成当前页');
}

// Messages mock
const messages = ref<
  Array<{
    cardData?: any;
    cardDesc?: string;
    cardTitle?: string;
    cardType?: string;
    content?: string;
    hasAction?: boolean;
    isCard?: boolean;
    role: string;
    time: string;
  }>
>([]);

/**
 * 将消息内容中的 Markdown 表格（管道符格式）转换为 HTML 表格
 */
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  const tableRegex = /^\s*\|/;
  const sepRegex = /^\s*\|[\s\-:|]+\|/;

  let i = 0;
  while (i < lines.length) {
    if (
      tableRegex.test(lines[i]) &&
      i + 1 < lines.length &&
      sepRegex.test(lines[i + 1])
    ) {
      const headers: string[] = [];
      const rows: string[][] = [];
      const headerCells = lines[i]
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      headers.push(...headerCells);
      i += 2;
      while (i < lines.length && tableRegex.test(lines[i])) {
        const cells = lines[i]
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        rows.push(cells);
        i++;
      }
      let tableHtml = '<table class="chat-table">';
      tableHtml += '<thead><tr>';
      headers.forEach((h) => {
        tableHtml += `<th>${h}</th>`;
      });
      tableHtml += '</tr></thead>';
      tableHtml += '<tbody>';
      rows.forEach((row) => {
        tableHtml += '<tr>';
        row.forEach((cell) => {
          tableHtml += `<td>${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody></table>';
      result.push(tableHtml);
      continue;
    }
    result.push(lines[i].replaceAll('<', '&lt;').replaceAll('>', '&gt;'));
    i++;
  }
  return result.join('<br>');
}

// Initialize messages based on agent type
const initMessages = () => {
  const id = route.params.id as string;

  if (id === 'agt_9') {
    v3ExpenseItems.value = [
      {
        category: '火车票',
        invoiceType: '火车票',
        invoiceNo: '00483217',
        invoiceAmount: '¥286.00',
        reimbursementAmount: '¥286.00',
        detail: '出发城市：上海；目的城市：上海虹桥',
        attachment: '—',
        trip: '2026-07-20至2026-07-20 上海-火车-上海虹桥',
      },
      {
        category: '火车票',
        invoiceType: '火车票',
        invoiceNo: '00483218',
        invoiceAmount: '¥286.00',
        reimbursementAmount: '¥286.00',
        detail: '出发城市：上海；目的城市：上海总部',
        attachment: '—',
        trip: '2026-07-24至2026-07-24 上海-火车-上海总部',
      },
      {
        category: '市内交通费',
        invoiceType: '电子普票',
        invoiceNo: '66554433',
        invoiceAmount: '¥86.00',
        reimbursementAmount: '¥86.00',
        detail: '—',
        attachment: '—',
        trip: '2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店',
      },
      {
        category: '其他',
        invoiceType: '增值税普通发票',
        invoiceNo: '99887766',
        invoiceAmount: '¥300.00',
        reimbursementAmount: '¥300.00',
        detail: '—',
        attachment: '—',
        trip: '2026-07-22至2026-07-22 浦东新区-自驾-徐汇区',
      },
      {
        category: '国内住宿费',
        invoiceType: '增值税专用发票',
        invoiceNo: '87654321',
        invoiceAmount: '¥1,280.00',
        reimbursementAmount: '¥1,280.00',
        detail: '入住日期：2026-07-20；离店日期：2026-07-22',
        attachment: '—',
        trip: '2026-07-20至2026-07-22 上海-其它-浦东新区',
        anomalyWarning: '待上传水单；人数待补充',
        checkInDate: '2026-07-20',
        checkOutDate: '2026-07-22',
      },
      {
        category: '国内住宿费',
        invoiceType: '增值税专用发票',
        invoiceNo: '87654322',
        invoiceAmount: '¥1,350.00',
        reimbursementAmount: '¥1,350.00',
        detail: '入住日期：2026-07-23；离店日期：2026-07-24',
        attachment: '—',
        trip: '2026-07-23至2026-07-24 上海-其它-徐汇区',
        anomalyWarning: '待上传水单；人数待补充',
        checkInDate: '2026-07-23',
        checkOutDate: '2026-07-24',
      },
    ];
    v3Stage.value = 'expense';
  }

  if (id === 'agt_5') {
    messages.value = [
      {
        role: 'user',
        content:
          '选择发票池里我上周去上海出差的相关发票，帮我创建一张差旅报销单。',
        time: '10:02 AM',
      },
      {
        role: 'agent',
        content:
          '收到！正在查询您上周去上海出差的相关发票...\n\n已从发票池中筛选出您上周上海出差的发票记录，共找到 5 张相关发票。\n\n其中住宿发票两张，根据同批发票的火车票和飞机票出行时间，智能推测如下：\n\n▸ 入住日期：2026年5月18日\n▸ 离店日期：2026年5月22日\n▸ 住宿人数：1人\n▸ 城市：上海\n▸ 晚数：4晚\n\n请确认以上信息是否准确，如无误我将为您预创建差旅报销单。',
        time: '10:03 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '确认无误，继续',
        time: '10:04 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        isCard: true,
        cardTitle: '已筛选 5 张上海出差相关发票',
        cardDesc: '总金额：￥2,856.00',
        time: '10:03 AM',
      },
    ];
    return;
  }
  if (id === 'agt_7') {
    messages.value = [
      // ========== Step 1 选择单据类型 ==========
      {
        role: 'agent',
        content:
          '您好！我是费用类智能填报专员，请选择您要填报的单据类型：\n\n1️⃣ 差旅申请单 — 出差前的事前计划申请\n2️⃣ 差旅报销单 — 出差后产生的费用报销\n3️⃣ 员工通用报销单 — 业务招待、办公用品等其他费用报销',
        time: '10:00 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '2️⃣ 差旅报销单',
        time: '10:00 AM',
      },

      // ========== Step 2 收集单头信息 ==========
      {
        role: 'agent',
        content:
          '好的，已选择 **差旅报销单**。请描述您的报销事项，例如：\n\n"报销上海家化联合股份有限公司7月份的差旅费用"',
        time: '10:01 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '报销上海家化联合股份有限公司7月份的差旅费用',
        time: '10:01 AM',
      },
      {
        role: 'agent',
        content:
          '根据您的描述，已为您推断出以下单头信息，请确认或修改：\n\n| 字段 | 内容 |\n|---|---|\n| 公司 | 上海家化联合股份有限公司 |\n| 预算类别 | 全年预算 |\n| 项目 | （无需选择） |\n| 事项描述 | 7月份差旅费用报销 |\n| 申请人 | 当前登录人（自动带出） |\n| 部门 | 自动匹配 |\n| 业务大类 | 管理-国内差旅 |\n| 币种 | RMB_人民币 |\n| 联系方式 | 自动带出 |\n\n您可以对以下内容进行调整：\n- 公司：如需更换请告知新公司名称\n- 预算类别：可选"全年预算"或"项目预算"\n- 项目：选择"项目预算"后需选择具体项目\n- 事项描述：可补充具体出差事由',
        time: '10:02 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content:
          '公司改成"上海家化销售有限公司"，预算类别改为"项目预算"，项目选"华东区客户拓展项目"，事项描述改成"7月份上海出差拜访重点客户，推进新品铺货事宜"。',
        time: '10:02 AM',
      },
      {
        role: 'agent',
        content:
          '已更新，以下是调整后的完整单头信息：\n\n| 字段 | 内容 |\n|---|---|\n| 公司 | 上海家化销售有限公司 |\n| 预算类别 | 项目预算 |\n| 项目 | 华东区客户拓展项目 |\n| 事项描述 | 7月份上海出差拜访重点客户，推进新品铺货事宜 |\n| 申请人 | 当前登录人（自动带出） |\n| 部门 | 自动匹配 |\n| 业务大类 | 管理-国内差旅 |\n| 币种 | RMB_人民币 |\n| 联系方式 | 自动带出 |\n\n确认无误后，进入下一步选择关联差旅申请单。',
        time: '10:03 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '确认，继续。',
        time: '10:03 AM',
        hasAction: false,
      },

      // ========== Step 3 选择前置单据 & 行程确认 ==========
      {
        role: 'agent',
        content:
          '接下来请确认本次出差的行程信息。根据您的报销描述"7月份上海出差"，系统已为您匹配到以下已审批通过的 **差旅申请单**：\n\n**已为您预选（推荐关联）：**\n| 序号 | 申请单号 | 主题 | 出差日期 | 事项描述 |\n|---|---|---|---|---|\n| 1️⃣ | CLS20260720001 | 上海出差客户拜访 | 2026-07-20~2026-07-24 | 拜访重点客户，推进新品铺货事宜 |\n| 2️⃣ | CLS20260718002 | 上海新品铺货推进 | 2026-07-18~2026-07-25 | 华东区新品铺货与渠道拓展 |\n\n**其他可选申请单：**\n| 序号 | 申请单号 | 主题 | 出差日期 | 事项描述 |\n|---|---|---|---|---|\n| 3️⃣ | CLS20260715003 | 杭州供应商考察 | 2026-07-15~2026-07-17 | 考察杭州地区供应商，评估新品产能 |\n\n您可以根据实际情况：\n- 增加关联：告知其他申请单序号\n- 移除预选：告知去掉某份申请单\n- 如不需要关联任何申请单，请告知"不使用申请单"',
        time: '10:04 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '关联1号和2号。',
        time: '10:04 AM',
      },
      {
        role: 'agent',
        content:
          '已关联2份申请单，系统已根据行程时间自动排序，合并生成以下 **行程列表**（所有行程均来自差旅申请单明细，不可减少）：\n\n| 序号 | 出发日期 | 结束日期 | 出发城市 | 目的城市 | 交通方式 | 同住人 | 备注 | 数据来源 |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2026-07-18 | 2026-07-18 | 上海 | 上海虹桥 | 火车 | — | — | 差旅申请单明细 |\n| 2 | 2026-07-18 | 2026-07-20 | 上海 | 静安区 | 其它 | — | — | 差旅申请单明细 |\n| 3 | 2026-07-20 | 2026-07-20 | 上海 | 上海虹桥 | 火车 | — | — | 差旅申请单明细 |\n| 4 | 2026-07-20 | 2026-07-22 | 上海 | 浦东新区 | 其它 | — | — | 差旅申请单明细 |\n| 5 | 2026-07-20 | 2026-07-23 | 上海 | 徐汇区 | 其它 | — | — | 差旅申请单明细 |\n| 6 | 2026-07-24 | 2026-07-24 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n| 7 | 2026-07-25 | 2026-07-25 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n\n您可以根据实际情况调整：\n- 修改：任意行程的出发日期、结束日期、出发城市、目的城市、交通方式（火车/飞机/自驾/其它）、同住人、备注\n- 删除：移除某段行程（需填写差异说明）\n- 新增行程：可手动填写或上传图片（导航截图等）由AI识别后补充，新行程标注为"用户补填"',
        time: '10:05 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content:
          '把行程1去程删掉，行程2渠道拜访改成2026-07-20~2026-07-22，行程5终端巡店改成2026-07-23~2026-07-24。',
        time: '10:05 AM',
      },
      {
        role: 'agent',
        content:
          '⏰ 时间校验：\n- 行程1 去程（申请单2 CLS20260718002 2026-07-18~2026-07-25）：删除 ✅\n- 行程2 渠道拜访（申请单2 CLS20260718002 2026-07-18~2026-07-25）：2026-07-20~2026-07-22 ✅ 在范围内\n- 行程5 终端巡店（申请单2 CLS20260718002 2026-07-18~2026-07-25）：2026-07-23~2026-07-24 ✅ 在范围内\n\n⚠️ **行程差异检测**：您对以下行程的调整与关联的差旅申请单原行程不一致，请填写 **差异说明**：\n\n| 行程 | 修改内容 | 原申请单内容 |\n|---|---|---|\n| 2026-07-18至2026-07-18 上海-火车-上海虹桥（申请单2） | ❌ 删除 | 2026-07-18至2026-07-18 上海市-火车-上海虹桥 |\n| 2026-07-18至2026-07-20 上海-其它-静安区（申请单2） | 时间改为2026-07-20至2026-07-22 | 2026-07-18至2026-07-20 上海市-其它-静安区 |\n| 2026-07-20至2026-07-23 上海-其它-徐汇区（申请单2） | 时间改为2026-07-23至2026-07-24 | 2026-07-20至2026-07-23 上海市-其它-徐汇区 |\n\n请填写差异说明：',
        time: '10:06 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content:
          '申请单1已有去程，不需要重复。渠道拜访和客户拜访时间合并。终端巡店实际是最后两天去的。',
        time: '10:06 AM',
      },
      {
        role: 'agent',
        content:
          '已记录差异说明，以下是更新后的完整行程列表：\n\n| 序号 | 出发日期 | 结束日期 | 出发城市 | 目的城市 | 交通方式 | 同住人 | 备注 | 数据来源 |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2026-07-20 | 2026-07-22 | 上海 | 静安区 | 其它 | — | — | 差旅申请单明细 |\n| 2 | 2026-07-20 | 2026-07-20 | 上海 | 上海虹桥 | 火车 | — | — | 差旅申请单明细 |\n| 3 | 2026-07-20 | 2026-07-22 | 上海 | 浦东新区 | 其它 | — | — | 差旅申请单明细 |\n| 4 | 2026-07-23 | 2026-07-24 | 上海 | 徐汇区 | 其它 | — | — | 差旅申请单明细 |\n| 5 | 2026-07-24 | 2026-07-24 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n| 6 | 2026-07-25 | 2026-07-25 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n\n差异说明：申请单1已有去程，不需要重复。渠道拜访和客户拜访时间合并。终端巡店实际是最后两天去的。',
        time: '10:07 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '我上传了一张打车截图，帮我识别一下加到行程里。',
        time: '10:07 AM',
      },
      {
        role: 'agent',
        content:
          '已收到您上传的图片，正在分析...\n\n✅ 图片识别结果：\n- 图片类型：高德地图导航截图\n- 识别时间：2026-07-20\n- 识别内容：上海虹桥站 → 上海如家精选酒店（浦东新区）\n- 行驶里程：约 32 公里（蓝色数字，用户选择路线）\n- 预计用时：约 45 分钟\n- 交通方式：其它（市内非飞机/火车/自驾的出行方式）\n\n⏰ 时间校验：\n- 2026-07-20 ~ 2026-07-20 ✅ 在关联申请单时间范围内（CLS20260720001 2026-07-20~2026-07-24）\n- 2026-07-20 ~ 2026-07-20 ✅ 与现有行程无时间交叉\n\n⚠️ **行程差异检测**：新增行程"市内交通"不在原差旅申请单明细中，将标注为"用户补填"。请补充差异说明：',
        time: '10:08 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '实际从虹桥站打车到酒店的费用。',
        time: '10:08 AM',
      },
      {
        role: 'agent',
        content:
          '已记录，以下是更新后的完整行程列表：\n\n| 序号 | 出发日期 | 结束日期 | 出发城市 | 目的城市 | 交通方式 | 同住人 | 备注 | 数据来源 |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2026-07-20 | 2026-07-22 | 上海 | 静安区 | 其它 | — | — | 差旅申请单明细 |\n| 2 | 2026-07-20 | 2026-07-20 | 上海 | 上海虹桥 | 火车 | — | — | 差旅申请单明细 |\n| 3 | 2026-07-20 | 2026-07-20 | 上海虹桥站 | 浦东新区酒店 | 其它 | — | 导航截图识别 | 用户补填 |\n| 4 | 2026-07-20 | 2026-07-22 | 上海 | 浦东新区 | 其它 | — | — | 差旅申请单明细 |\n| 5 | 2026-07-23 | 2026-07-24 | 上海 | 徐汇区 | 其它 | — | — | 差旅申请单明细 |\n| 6 | 2026-07-24 | 2026-07-24 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n| 7 | 2026-07-25 | 2026-07-25 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n\n差异说明：申请单1已有去程，不需要重复。渠道拜访和客户拜访时间合并。终端巡店实际是最后两天去的。实际从虹桥站打车到酒店的费用。',
        time: '10:09 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content:
          '再帮我加一段行程，2026-07-22~2026-07-22，从浦东新区到徐汇区，自驾，去客户仓库查看铺货。',
        time: '10:09 AM',
      },
      {
        role: 'agent',
        content:
          '⏰ 时间校验：\n- 2026-07-22 ~ 2026-07-22 ✅ 在关联申请单时间范围内（CLS20260720001 2026-07-20~2026-07-24）\n- 2026-07-22 ~ 2026-07-22 ✅ 与现有行程无时间交叉\n\n⚠️ **行程差异检测**：新增行程"客户仓库"不在原差旅申请单明细中，将标注为"用户补填"。请补充差异说明：',
        time: '10:10 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '拜访客户后去仓库看新品铺货情况。',
        time: '10:10 AM',
      },
      {
        role: 'agent',
        content:
          '已记录，以下是更新后的完整行程列表：\n\n| 序号 | 出发日期 | 结束日期 | 出发城市 | 目的城市 | 交通方式 | 同住人 | 备注 | 数据来源 |\n|---|---|---|---|---|---|---|---|---|\n| 1 | 2026-07-20 | 2026-07-22 | 上海 | 静安区 | 其它 | — | — | 差旅申请单明细 |\n| 2 | 2026-07-20 | 2026-07-20 | 上海 | 上海虹桥 | 火车 | — | — | 差旅申请单明细 |\n| 3 | 2026-07-20 | 2026-07-20 | 上海虹桥站 | 浦东新区酒店 | 其它 | — | 导航截图识别 | 用户补填 |\n| 4 | 2026-07-20 | 2026-07-22 | 上海 | 浦东新区 | 其它 | — | — | 差旅申请单明细 |\n| 5 | 2026-07-22 | 2026-07-22 | 浦东新区 | 徐汇区 | 自驾 | — | 查看新品铺货 | 用户补填 |\n| 6 | 2026-07-23 | 2026-07-24 | 上海 | 徐汇区 | 其它 | — | — | 差旅申请单明细 |\n| 7 | 2026-07-24 | 2026-07-24 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n| 8 | 2026-07-25 | 2026-07-25 | 上海 | 上海总部 | 火车 | — | — | 差旅申请单明细 |\n\n差异说明：申请单1已有去程，不需要重复。渠道拜访和客户拜访时间合并。终端巡店实际是最后两天去的。实际从虹桥站打车到酒店的费用。拜访客户后去仓库看新品铺货情况。\n\n确认无误后进入下一步发票筛选。',
        time: '10:11 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '确认，继续。',
        time: '10:11 AM',
        hasAction: false,
      },

      // ========== Step 4 发票筛选 & 费用明细确认 ==========
      {
        role: 'agent',
        content:
          '好的，根据以下条件已从 **发票池** 中筛选出匹配的发票：\n- 公司：上海家化销售有限公司（购方抬头匹配增值税发票）\n- 出差日期：2026-07-18~2026-07-25（行程时间范围）\n- 出发地/目的地：上海（交通票据匹配）\n- 住宿城市：上海（住宿发票匹配）\n\n差旅报销单可报销以下科目：**火车票、市内交通费、其他、国内住宿费**，已为您匹配到 **6 张** 相关发票：\n\n| 序号 | 发票类型 | 销方名称 | 发票号码 | 发票金额 | 开票日期 | 匹配依据 |\n|---|---|---|---|---|---|---|\n| 1️⃣ | 火车票 | 中国铁路上海局集团有限公司 | 00483217 | ¥286.00 | 2026-07-20 | 去程交通 |\n| 2️⃣ | 火车票 | 中国铁路上海局集团有限公司 | 00483218 | ¥286.00 | 2026-07-24 | 返程交通 |\n| 3️⃣ | 增值税专用发票 | 上海如家精选酒店有限公司 | 87654321 | ¥1,280.00 | 2026-07-20 | 住宿（浦东新区） |\n| 4️⃣ | 增值税专用发票 | 上海全季酒店有限公司 | 87654322 | ¥1,350.00 | 2026-07-22 | 住宿（徐汇区） |\n| 5️⃣ | 增值税电子普通发票 | 滴滴出行科技有限公司 | 66554433 | ¥86.00 | 2026-07-20 | 市内交通 |\n| 6️⃣ | 增值税普通发票 | 中国石化上海石油分公司 | 99887766 | ¥300.00 | 2026-07-22 | 自驾油费 |\n\n**发票池中还有以下未报销发票可供选择：**\n| 序号 | 发票类型 | 销方名称 | 发票号码 | 发票金额 | 开票日期 | 说明 |\n|---|---|---|---|---|---|---|\n| 7️⃣ | 增值税普通发票 | 上海小南国餐饮管理有限公司 | 99887777 | ¥420.00 | 2026-07-21 | 餐饮费用，差旅报销单不报销 |\n\n系统根据发票内容自动生成以下 **费用明细**：\n\n| 科目 | 发票类型 | 发票号码 | 发票金额 | 报销金额 | 详细信息 | 附件 | 关联行程 |\n|---|---|---|---|---|---|---|---|---|\n| 火车票 | 火车票 | 00483217 | ¥286.00 | ¥286.00 | 出发城市：上海；目的城市：上海虹桥 | — | 2026-07-20至2026-07-20 上海-火车-上海虹桥 |\n| 火车票 | 火车票 | 00483218 | ¥286.00 | ¥286.00 | 出发城市：上海；目的城市：上海总部 | — | 2026-07-24至2026-07-24 上海-火车-上海总部 |\n| 市内交通费 | 电子普票 | 66554433 | ¥86.00 | ¥86.00 | — | — | 2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店 |\n| 其他 | 增值税普通发票 | 99887766 | ¥300.00 | ¥300.00 | — | — | 2026-07-22至2026-07-22 浦东新区-自驾-徐汇区 |\n| 国内住宿费 | 增值税专用发票 | 87654321 | ¥1,280.00 | ¥1,280.00 | 人数：⚠️ 待补充；入住日期：2026-07-20；离店日期：2026-07-22 | ⚠️ 待上传 | 2026-07-20至2026-07-22 上海-其它-浦东新区 |\n| 国内住宿费 | 增值税专用发票 | 87654322 | ¥1,350.00 | ¥1,350.00 | 人数：⚠️ 待补充；入住日期：2026-07-23；离店日期：2026-07-24 | ⚠️ 待上传 | 2026-07-23至2026-07-24 上海-其它-徐汇区 |\n\n系统自动计算差旅补贴：\n| 科目 | 标准 | 天数 | 金额 | 关联行程 |\n|---|---|---|---|---|\n| 国内餐费 | 100元/天 | 4天 | ¥400.00 | 2026-07-20至2026-07-20 上海-火车-上海虹桥;2026-07-20至2026-07-22 上海-其它-静安区;2026-07-20至2026-07-22 上海-其它-浦东新区;2026-07-22至2026-07-22 浦东新区-自驾-徐汇区;2026-07-23至2026-07-24 上海-其它-徐汇区;2026-07-24至2026-07-24 上海-火车-上海总部;2026-07-25至2026-07-25 上海-火车-上海总部 |\n\n**合计报销金额：¥3,988.00**\n\n请确认：\n1. 以上6张发票是否正确？如需移除请告知\n2. 如需增加发票，可从发票池中选择\n3. 报销金额如需调整（例如发票¥1,280但只报销部分），请告知"只报X元"\n4. 费用科目是否需调整？\n5. ⚠️ **国内住宿费需补充水单附件**：您有2笔国内住宿费（¥1,280.00 + ¥1,350.00），住宿水单是报销必要附件，请拍照上传。\n6. ℹ️ **国内住宿费需补充入住人数**：请告知如家精选酒店和全季酒店各住几人。',
        time: '10:12 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content:
          '第3张住宿费发票¥1,280只报¥1,000。附件：如家精选酒店账单明细.jpg。如家精选住1人。',
        time: '10:12 AM',
      },
      {
        role: 'agent',
        content:
          '已调整，以下是调整后的完整费用明细：\n\n| 科目 | 发票类型 | 发票号码 | 发票金额 | 报销金额 | 详细信息 | 附件 | 关联行程 |\n|---|---|---|---|---|---|---|---|---|\n| 火车票 | 火车票 | 00483217 | ¥286.00 | ¥286.00 | 出发城市：上海；目的城市：上海虹桥 | — | 2026-07-20至2026-07-20 上海-火车-上海虹桥 |\n| 火车票 | 火车票 | 00483218 | ¥286.00 | ¥286.00 | 出发城市：上海；目的城市：上海总部 | — | 2026-07-24至2026-07-24 上海-火车-上海总部 |\n| 市内交通费 | 电子普票 | 66554433 | ¥86.00 | ¥86.00 | — | — | 2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店 |\n| 其他 | 增值税普通发票 | 99887766 | ¥300.00 | ¥300.00 | — | — | 2026-07-22至2026-07-22 浦东新区-自驾-徐汇区 |\n| 国内住宿费 | 增值税专用发票 | 87654321 | ¥1,280.00 | ¥1,000.00 | 人数：1人；入住日期：2026-07-20；离店日期：2026-07-22 | ✅ 如家精选酒店账单明细.jpg | 2026-07-20至2026-07-22 上海-其它-浦东新区 |\n| 国内住宿费 | 增值税专用发票 | 87654322 | ¥1,350.00 | ¥1,350.00 | 人数：⚠️ 待补充；入住日期：2026-07-23；离店日期：2026-07-24 | ⚠️ 待上传 | 2026-07-23至2026-07-24 上海-其它-徐汇区 |\n\n差旅补贴：\n| 科目 | 标准 | 天数 | 金额 | 关联行程 |\n|---|---|---|---|---|\n| 国内餐费 | 100元/天 | 4天 | ¥400.00 | 2026-07-20至2026-07-20 上海-火车-上海虹桥;2026-07-20至2026-07-22 上海-其它-静安区;2026-07-20至2026-07-22 上海-其它-浦东新区;2026-07-22至2026-07-22 浦东新区-自驾-徐汇区;2026-07-23至2026-07-24 上海-其它-徐汇区;2026-07-24至2026-07-24 上海-火车-上海总部;2026-07-25至2026-07-25 上海-火车-上海总部 |\n\n**合计报销金额：¥3,708.00**\n\n请补充全季酒店的水单照片。',
        time: '10:13 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '附件：全季酒店住宿账单.jpg。全季住1人。',
        time: '10:13 AM',
      },
      {
        role: 'agent',
        content:
          '✅ 已收到全部2份住宿水单，附件已齐全。以下是更新后的完整费用明细：\n\n| 科目 | 发票类型 | 发票号码 | 发票金额 | 报销金额 | 详细信息 | 附件 | 关联行程 |\n|---|---|---|---|---|---|---|---|---|\n| 火车票 | 火车票 | 00483217 | ¥286.00 | ¥286.00 | 出发城市：上海；目的城市：上海虹桥 | — | 2026-07-20至2026-07-20 上海-火车-上海虹桥 |\n| 火车票 | 火车票 | 00483218 | ¥286.00 | ¥286.00 | 出发城市：上海；目的城市：上海总部 | — | 2026-07-24至2026-07-24 上海-火车-上海总部 |\n| 市内交通费 | 电子普票 | 66554433 | ¥86.00 | ¥86.00 | — | — | 2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店 |\n| 其他 | 增值税普通发票 | 99887766 | ¥300.00 | ¥300.00 | — | — | 2026-07-22至2026-07-22 浦东新区-自驾-徐汇区 |\n| 国内住宿费 | 增值税专用发票 | 87654321 | ¥1,280.00 | ¥1,000.00 | 人数：1人；入住日期：2026-07-20；离店日期：2026-07-22 | ✅ 如家精选酒店账单明细.jpg | 2026-07-20至2026-07-22 上海-其它-浦东新区 |\n| 国内住宿费 | 增值税专用发票 | 87654322 | ¥1,350.00 | ¥1,350.00 | 人数：1人；入住日期：2026-07-23；离店日期：2026-07-24 | ✅ 全季酒店住宿账单.jpg | 2026-07-23至2026-07-24 上海-其它-徐汇区 |\n\n**合计报销金额：¥3,708.00**\n\n确认无误后，将为您生成差旅报销单待办卡片。',
        time: '10:13 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '确认没问题。',
        time: '10:13 AM',
        hasAction: false,
      },

      // ========== Step 5 生成待办卡片 ==========
      {
        role: 'agent',
        content:
          '已为您生成差旅报销单，待办卡片如下，点击「立即处理」可查看完整单据内容并进行提交。',
        time: '10:14 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        isCard: true,
        cardTitle: '差旅报销单已生成 — CLS20260728001',
        cardDesc:
          '合计金额 ¥3,708.00 · 关联申请单2份 · 发票6张 · 费用明细7项 · 行程8段',
        time: '10:14 AM',
      },
    ];
    return;
  }
  if (id === 'agt_9') {
    messages.value = [
      // ========== Step 1 选择单据类型 ==========
      {
        role: 'agent',
        content:
          '您好！我是智能填报专员v3，请选择您要填报的单据类型：\n\n1️⃣ 差旅申请单 — 出差前的事前计划申请\n2️⃣ 差旅报销单 — 出差后产生的费用报销\n3️⃣ 员工通用报销单 — 业务招待、办公用品等其他费用报销',
        time: '10:00 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '2️⃣ 差旅报销单',
        time: '10:00 AM',
      },

      // ========== Step 2 收集单头信息 ==========
      {
        role: 'agent',
        content:
          '好的，已选择 **差旅报销单**。请描述您的报销事项，例如：\n\n"报销上海家化联合股份有限公司7月份的差旅费用"',
        time: '10:01 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '报销上海家化联合股份有限公司7月份的差旅费用',
        time: '10:01 AM',
      },
      {
        role: 'agent',
        content:
          '根据您的描述，已为您推断出以下单头信息，请确认或修改：\n\n| 字段 | 内容 |\n|---|---|\n| 公司 | 上海家化联合股份有限公司 |\n| 事项描述 | 报销上海家化联合股份有限公司7月份的差旅费用 |\n\n您可以对公司或事项描述进行调整：如需更换请告知具体内容。\n如有相关附件，可一并补充上传。\n确认无误后，进入下一步选择关联差旅申请单。',
        time: '10:02 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content:
          '公司改成"上海家化销售有限公司"，事项描述改成"7月份上海出差拜访重点客户，推进新品铺货事宜"。',
        time: '10:02 AM',
      },
      {
        role: 'agent',
        content:
          '已更新，以下是调整后的完整单头信息：\n\n| 字段 | 内容 |\n|---|---|\n| 公司 | 上海家化销售有限公司 |\n| 事项描述 | 7月份上海出差拜访重点客户，推进新品铺货事宜 |\n\n您可以对公司或事项描述进行调整：如需更换请告知具体内容。\n如有相关附件，可一并补充上传。\n确认无误后，进入下一步选择关联差旅申请单。',
        time: '10:03 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '确认，继续。',
        time: '10:03 AM',
        hasAction: false,
      },

      // ========== Step 3 选择差旅申请单 ==========
      {
        role: 'agent',
        cardType: 'application-select-table',
        cardData: {
          initialSelectedApplications: ['CLS20260720001', 'CLS20260718002'],
          availableApplications: [
            {
              id: 'CLS20260720001',
              title: '上海出差客户拜访',
              dateRange: '2026-07-20~2026-07-24',
              description: '拜访重点客户，推进新品铺货事宜',
            },
            {
              id: 'CLS20260718002',
              title: '上海新品铺货推进',
              dateRange: '2026-07-18~2026-07-25',
              description: '华东区新品铺货与渠道拓展',
            },
            {
              id: 'CLS20260715003',
              title: '杭州供应商考察',
              dateRange: '2026-07-15~2026-07-17',
              description: '考察杭州地区供应商，评估新品产能',
            },
          ],
        },
        time: '10:04 AM',
      },
      {
        role: 'user',
        content: '确认，继续',
        time: '10:04 AM',
      },
      // ========== 一次性显示后续步骤 ==========
      {
        role: 'agent',
        content:
          '好的，已根据申请单出差日期从发票池中筛选出匹配的发票，请选择需要报销的发票。',
        time: '10:04 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        cardType: 'invoice-select-table',
        cardData: {
          initialSelectedInvoices: [
            'inv_1',
            'inv_2',
            'inv_3',
            'inv_4',
            'inv_5',
            'inv_6',
          ],
          availableInvoices: [
            {
              id: 'inv_1',
              type: '火车票',
              seller: '中国铁路上海局集团有限公司',
              number: '00483217',
              amount: '¥286.00',
              date: '2026-07-20',
              basis: '去程交通',
            },
            {
              id: 'inv_2',
              type: '火车票',
              seller: '中国铁路上海局集团有限公司',
              number: '00483218',
              amount: '¥286.00',
              date: '2026-07-24',
              basis: '返程交通',
            },
            {
              id: 'inv_3',
              type: '增值税专用发票',
              seller: '上海如家精选酒店有限公司',
              number: '87654321',
              amount: '¥1,280.00',
              date: '2026-07-20',
              basis: '住宿（浦东新区）',
            },
            {
              id: 'inv_4',
              type: '增值税专用发票',
              seller: '上海全季酒店有限公司',
              number: '87654322',
              amount: '¥1,350.00',
              date: '2026-07-22',
              basis: '住宿（徐汇区）',
            },
            {
              id: 'inv_5',
              type: '增值税电子普通发票',
              seller: '滴滴出行科技有限公司',
              number: '66554433',
              amount: '¥86.00',
              date: '2026-07-20',
              basis: '市内交通',
            },
            {
              id: 'inv_6',
              type: '增值税普通发票',
              seller: '中国石化上海石油分公司',
              number: '99887766',
              amount: '¥300.00',
              date: '2026-07-22',
              basis: '自驾油费',
            },
            {
              id: 'inv_7',
              type: '增值税普通发票',
              seller: '上海小南国餐饮管理有限公司',
              number: '99887777',
              amount: '¥420.00',
              date: '2026-07-21',
              basis: '餐饮费用',
            },
          ],
        },
        time: '10:04 AM',
      },
      {
        role: 'user',
        content: '确认，继续',
        time: '10:04 AM',
      },
      {
        role: 'agent',
        content: '已根据所选发票生成费用明细，可点击处理异常。',
        time: '10:04 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        cardType: 'expense-summary',
        cardTitle: '费用明细已生成',
        cardDesc: '已根据选取的发票生成费用明细。',
        time: '10:04 AM',
      },
      {
        role: 'agent',
        content:
          '已为您生成差旅报销单，待办卡片如下，点击「立即处理」可查看完整单据内容并进行提交。',
        time: '10:04 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        isCard: true,
        cardTitle: '差旅报销单已生成 — CLS20260728001',
        cardDesc:
          '合计金额 ¥3,708.00 · 关联申请单2份 · 发票6张 · 费用明细7项 · 行程8段',
        time: '10:04 AM',
      },
    ];
    return;
  }
  if (id === 'agt_8') {
    messages.value = [
      // ========== Step 1 选择单据类型 ==========
      {
        role: 'agent',
        content:
          '您好！我是智能填报专员v2，请选择您要填报的单据类型：\n\n1️⃣ 差旅申请单 — 出差前的事前计划申请\n2️⃣ 差旅报销单 — 出差后产生的费用报销\n3️⃣ 员工通用报销单 — 业务招待、办公用品等其他费用报销',
        time: '10:00 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '2️⃣ 差旅报销单',
        time: '10:00 AM',
      },

      // ========== Step 2 描述报销事项 ==========
      {
        role: 'agent',
        content:
          '好的，已选择 **差旅报销单**。请描述您的报销事项，例如：\n\n"报销上海家化联合股份有限公司7月份的差旅费用"',
        time: '10:01 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '报销上海家化联合股份有限公司7月份的差旅费用',
        time: '10:01 AM',
      },

      // ========== Card 1: 关联差旅申请单 ==========
      {
        role: 'agent',
        content:
          '请选择需要关联的差旅申请单，系统将根据选中申请单的明细生成行程。',
        time: '10:02 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        cardType: 'application-select',
        cardData: {
          initialSelectedApplications: ['CLS20260720001', 'CLS20260718002'],
          availableApplications: [
            {
              id: 'CLS20260720001',
              title: '上海出差客户拜访',
              dateRange: '2026-07-20~2026-07-24',
              description: '拜访重点客户，推进新品铺货事宜',
            },
            {
              id: 'CLS20260718002',
              title: '上海新品铺货推进',
              dateRange: '2026-07-18~2026-07-25',
              description: '华东区新品铺货与渠道拓展',
            },
            {
              id: 'CLS20260715003',
              title: '杭州供应商考察',
              dateRange: '2026-07-15~2026-07-17',
              description: '考察杭州地区供应商，评估新品产能',
            },
          ],
        },
        time: '10:02 AM',
      },
    ];
    return;
  }
  if (id === 'agt_10') {
    messages.value = [
      // ========== 填报助理：欢迎 + 填报方案 ==========
      {
        role: 'agent',
        content:
          '您好！我是您的填报助理，可以帮您完成报销单的分步填报：发票智能筛选 → 表头信息确认 → 费用汇总校验 → 生成报销单。请告诉我您的填报需求。',
        time: '10:00 AM',
        hasAction: false,
      },
      {
        role: 'user',
        content: '帮我填报7月份的差旅报销单',
        time: '10:01 AM',
      },
      {
        role: 'agent',
        content:
          '收到！我已扫描您的发票池并匹配行程数据，为您生成如下填报方案，请确认后开始。',
        time: '10:01 AM',
        hasAction: false,
      },
      {
        role: 'agent',
        cardType: 'fill-plan',
        cardData: {
          docType: '差旅报销单',
          period: '2026-07',
          invoiceCount: 8,
          invoiceTotal: '¥3,725.00',
          steps: [
            {
              title: '发票智能筛选',
              desc: '自动扫描发票池，匹配行程日期',
            },
            {
              title: '表头信息确认',
              desc: 'AI 推断单据表头，可修改',
            },
            {
              title: '费用汇总校验',
              desc: '归类汇总并执行合规预校验',
            },
            {
              title: '生成报销单',
              desc: '生成单据待办，支持预览提交',
            },
          ],
        },
        time: '10:01 AM',
      },
    ];
    return;
  }
  messages.value = [
    {
      role: 'user',
      content:
        '今天我要拜访李总（健民大药房单体店负责人），他想看一些牙科的消炎药。帮我从库里根据他们的单体药店性质和主营品类筛选一下，做成报价单和推介宣传册发给他。',
      time: '10:02 AM',
    },
    {
      role: 'agent',
      content:
        '收到嘱咐。单体药店通常更偏爱品牌力强且易于周转的品类。正在主数据中心扫描，当前牙科抗炎类在售 SKU 共有 800+ 款...\n\n经过对该客户性质与「口腔消炎品类」综合评估，为您精选了 30 款最核心的对冲药品。',
      time: '10:03 AM',
      hasAction: false,
    },
    {
      role: 'agent',
      isCard: true,
      cardTitle: '已筛选 30 款牙科精选商品',
      cardDesc: '包含指导金额评估：￥45,800.00',
      time: '10:03 AM',
    },
  ];
};

onMounted(() => {
  initMessages();
});

// Right panel / Drawer data mock
const drawerVisible = ref(false);
const v3ExpenseDrawerVisible = ref(false);
const v3ExpenseItems = ref<Array<Record<string, any>>>([]);
const v3ExpenseAnomalyCount = computed(() => {
  return v3ExpenseItems.value.filter(
    (item) => item.anomalyWarning && item.anomalyWarning.trim().length > 0,
  ).length;
});
const v3ExpenseTotal = computed(() => {
  const sum = v3ExpenseItems.value.reduce(
    (acc: number, item) =>
      acc +
      Number.parseFloat(
        item.reimbursementAmount.replaceAll(/[¥,]/g, '') || '0',
      ),
    0,
  );
  return `¥${(sum + 400).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});
const v3AllowanceModifyDesc = ref('');
const v3FileInputs = ref<Map<number, HTMLInputElement>>(new Map());
const v3Stage = ref('done'); // application | invoice | expense | done

// ========== Fill Assistant (agt_10) state ==========
const fillInvoices = ref([
  {
    id: 'inv_1',
    type: '火车票',
    seller: '中国铁路上海局集团有限公司',
    number: '00483217',
    amount: '¥286.00',
    date: '2026-07-20',
  },
  {
    id: 'inv_2',
    type: '火车票',
    seller: '中国铁路上海局集团有限公司',
    number: '00483218',
    amount: '¥286.00',
    date: '2026-07-24',
  },
  {
    id: 'inv_3',
    type: '增值税专用发票',
    seller: '上海如家精选酒店有限公司',
    number: '87654321',
    amount: '¥1,280.00',
    date: '2026-07-20',
  },
  {
    id: 'inv_4',
    type: '增值税专用发票',
    seller: '上海如家精选酒店有限公司',
    number: '87654322',
    amount: '¥1,350.00',
    date: '2026-07-23',
    anomaly: '入住人数待补充',
  },
  {
    id: 'inv_5',
    type: '增值税普通发票',
    seller: '上海锦江餐饮管理有限公司',
    number: '99887766',
    amount: '¥300.00',
    date: '2026-07-22',
  },
  {
    id: 'inv_6',
    type: '电子普票',
    seller: '上海申通地铁集团有限公司',
    number: '66554433',
    amount: '¥86.00',
    date: '2026-07-20',
  },
  {
    id: 'inv_7',
    type: '电子普票',
    seller: '上海强生出租汽车股份有限公司',
    number: '66554434',
    amount: '¥92.00',
    date: '2026-07-22',
  },
  {
    id: 'inv_8',
    type: '出租车发票',
    seller: '上海海博出租汽车有限公司',
    number: '03398877',
    amount: '¥45.00',
    date: '2026-07-21',
    anomaly: '连号发票，建议人工复核',
  },
]);
const fillSelectedInvoices = ref<Array<Record<string, any>>>([]);
const fillHeader = ref({
  company: '上海家化联合股份有限公司',
  budgetCategory: '全年预算',
  project: '',
  description: '7月份差旅费用报销',
  applicant: '当前登录人（自动带出）',
  department: '数字化创新部',
  businessType: '管理-国内差旅',
  currency: 'RMB_人民币',
  contact: '138****5678',
});
const fillSummaryItems = computed(() => {
  const byCategory: Record<string, any> = {};
  for (const inv of fillSelectedInvoices.value) {
    let category: string;
    if (inv.type === '火车票') {
      category = '城际交通费';
    } else if (inv.type.includes('专用发票') && inv.seller.includes('酒店')) {
      category = '住宿费';
    } else if (inv.type === '出租车发票' || inv.type === '电子普票') {
      category = '市内交通费';
    } else {
      category = '其他费用';
    }
    if (!byCategory[category]) {
      byCategory[category] = {
        amount: 0,
        category,
        count: 0,
        invoiceNos: [],
        status: 'pass',
        tip: '',
      };
    }
    byCategory[category].amount += Number.parseFloat(
      inv.amount.replaceAll(/[¥,]/g, '') || '0',
    );
    byCategory[category].count += 1;
    byCategory[category].invoiceNos.push(inv.number);
    if (inv.anomaly) {
      byCategory[category].status = 'warn';
      byCategory[category].tip = `${inv.number} ${inv.anomaly}，请补充后提交`;
    }
  }
  const defaultTips: Record<string, string> = {
    城际交通费: '已与行程日期逐条匹配，全部一致',
    住宿费: '符合差旅住宿标准（≤¥600/晚）',
    市内交通费: '均在市内交通报销范围内',
    其他费用: '餐费需附招待审批单，已自动关联',
  };
  return Object.values(byCategory).map((item: any) => ({
    ...item,
    amount: `¥${item.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    invoiceNos: item.invoiceNos.join('、'),
    tip: item.tip || defaultTips[item.category] || '校验通过',
  }));
});
const fillTotal = computed(() => {
  const sum = fillSelectedInvoices.value.reduce(
    (acc: number, item: any) =>
      acc + Number.parseFloat(item.amount.replaceAll(/[¥,]/g, '') || '0'),
    0,
  );
  return `¥${(sum + 400).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
});

const exportOptions = ref(['excel', 'brochure']);
const customItemCode = ref('');
const addInvoiceModalVisible = ref(false);

// Document info data
const budgetCategories = [
  { label: '共享服务中心预算2026', value: 'shared' },
  { label: 'AP事业部预算2026', value: 'ap' },
  { label: '喔壳事业部预算2026', value: 'oke' },
  { label: '单多啦事业部预算2026', value: 'dandola' },
];

// Document type options
const documentTypes = [
  { label: '差旅报销单', value: 'travel' },
  { label: '个人报销单', value: 'personal' },
  { label: '对公付款单', value: 'corporate' },
];
const selectedDocumentType = ref('travel');

const selectedBudgetCategory = ref('ap');
const selectedProject = ref('');
const selectedCompany = ref('COM-001');
const selectedPaymentMethod = ref('bank');
const remark = ref('');
const relatedDocument = ref('');

// Corporate payment fields
const supplier = ref('');
const contractNumber = ref('');

// Invoice pool filter fields
const filterUsed = ref('');
const filterShared = ref('');
const filterInvoiceNumber = ref('');
const filterBuyer = ref('');
const filterSeller = ref('');
const filterTag = ref('');
const filterDateStart = ref('');
const filterDateEnd = ref('');

// Selected invoice keys
const selectedInvoiceKeys = ref<string[]>([]);

// Invoice pool data (mock)
const poolInvoices = ref([
  {
    key: '1',
    image:
      'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=invoice%20receipt%20document&image_size=square',
    seller: '苏州苏浙徽商贸有限公司',
    amount: '4080.00',
    number: '27309047',
    code: '032002100105',
    date: '2024年06月17日',
    buyer: '购方：深装总文化创意（苏州）有限公司',
    status: '1次查验真实',
    uploader: '吴志强',
    uploadDate: '2025-02-20 10:27:55',
  },
  {
    key: '2',
    image:
      'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=receipt%20bill%20document&image_size=square',
    seller: '浙江临平高速公路有限责任公司',
    amount: '7.00',
    number: '526646051',
    code: '233002510111',
    date: '2025年01月15日',
    buyer: '购方：厦门市立达信照明开关有限公司',
    status: '已查验真实',
    uploader: '吴志强',
    uploadDate: '2025-01-21 11:18:35',
  },
  {
    key: '3',
    image:
      'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=tax%20invoice%20document&image_size=square',
    seller: '天津浦东衡东贸易有限公司',
    amount: '16.45',
    number: '2412700000130302793',
    code: '2412700000130',
    date: '2024-11-02',
    buyer: '购方：济南企财通软件有限公司',
    status: '已查验真实',
    uploader: '陈志超',
    uploadDate: '2024-11-18 16:18:3',
  },
]);

// Invoice pool columns
const poolInvoiceColumns = [
  { title: '#', dataIndex: 'key', key: 'key', width: 40 },
  { title: '影像', dataIndex: 'image', key: 'image', width: 60 },
  { title: '销方名称', dataIndex: 'seller', key: 'seller', width: 120 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 80 },
  { title: '发票号码', dataIndex: 'number', key: 'number', width: 100 },
  { title: '发票代码', dataIndex: 'code', key: 'code', width: 100 },
  { title: '发票日期', dataIndex: 'date', key: 'date', width: 80 },
  { title: '购方/备注', dataIndex: 'buyer', key: 'buyer', width: 150 },
  { title: '查验状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '上传人', dataIndex: 'uploader', key: 'uploader', width: 60 },
  { title: '上传日期', dataIndex: 'uploadDate', key: 'uploadDate', width: 120 },
];

// Reset filters
const resetFilters = () => {
  filterUsed.value = '';
  filterShared.value = '';
  filterInvoiceNumber.value = '';
  filterBuyer.value = '';
  filterSeller.value = '';
  filterTag.value = '';
  filterDateStart.value = '';
  filterDateEnd.value = '';
};

// Search invoices
const searchInvoices = () => {
  message.info('搜索功能演示');
};

// Handle invoice selection
const handleInvoiceSelect = (keys: string[]) => {
  selectedInvoiceKeys.value = keys;
};

// Confirm select invoices
const confirmSelectInvoices = () => {
  const selectedInvoices = poolInvoices.value.filter((inv) =>
    selectedInvoiceKeys.value.includes(inv.key),
  );

  selectedInvoices.forEach((inv) => {
    mockInvoices.value.push({
      key: String(mockInvoices.value.length + 1),
      type: inv.number.length > 8 ? '增值税专用发票' : '增值税普通发票',
      code: inv.code,
      number: inv.number,
      amount: `￥${inv.amount}`,
      date: inv.date,
      seller: inv.seller,
    });
  });

  message.success(`已添加 ${selectedInvoices.length} 张发票`);
  selectedInvoiceKeys.value = [];
  addInvoiceModalVisible.value = false;
};

// View state: 'invoice' | 'expense'
const currentView = ref<'expense' | 'invoice'>('invoice');

// Flag to track if create reimbursement has been clicked
const hasGenerated = ref(false);

// Expense detail data (one invoice to one expense item)
const expenseItems = ref([
  {
    id: '1',
    invoiceType: '火车票',
    invoiceCode: 'K1234',
    invoiceNumber: '00123456',
    invoiceDate: '2026-05-18',
    seller: '中国铁路上海局集团有限公司',
    expenseAmount: '286.00',
    taxAmount: '0.00',
    totalAmount: '286.00',
    expenseCategory: '差旅费',
    budget: 'AP事业部预算2026',
    remark: '',
    checkInDate: '',
    checkOutDate: '',
    city: '',
    guests: '',
    nights: '',
  },
  {
    id: '2',
    invoiceType: '飞机票',
    invoiceCode: 'CA1234',
    invoiceNumber: 'ETKT1234567890',
    invoiceDate: '2026-05-22',
    seller: '中国国际航空股份有限公司',
    expenseAmount: '1580.00',
    taxAmount: '142.20',
    totalAmount: '1722.20',
    expenseCategory: '差旅费',
    budget: 'AP事业部预算2026',
    remark: '',
    checkInDate: '',
    checkOutDate: '',
    city: '',
    guests: '',
    nights: '',
  },
  {
    id: '3',
    invoiceType: '增值税专用发票',
    invoiceCode: '3100191130',
    invoiceNumber: '12345678',
    invoiceDate: '2026-05-18',
    seller: '上海如家精选酒店有限公司',
    expenseAmount: '1280.00',
    taxAmount: '76.80',
    totalAmount: '1356.80',
    expenseCategory: '住宿费',
    budget: 'AP事业部预算2026',
    remark: '',
    checkInDate: '2026-05-18',
    checkOutDate: '2026-05-19',
    city: '上海',
    guests: '1',
    nights: '1',
  },
  {
    id: '4',
    invoiceType: '增值税专用发票',
    invoiceCode: '3100192130',
    invoiceNumber: '23456789',
    invoiceDate: '2026-05-19',
    seller: '上海全季酒店有限公司',
    expenseAmount: '1350.00',
    taxAmount: '81.00',
    totalAmount: '1431.00',
    expenseCategory: '住宿费',
    budget: 'AP事业部预算2026',
    remark: '',
    checkInDate: '2026-05-19',
    checkOutDate: '2026-05-22',
    city: '上海',
    guests: '1',
    nights: '3',
  },
  {
    id: '5',
    invoiceType: '增值税普通发票',
    invoiceCode: '3100193130',
    invoiceNumber: '34567890',
    invoiceDate: '2026-05-20',
    seller: '上海小南国餐饮管理有限公司',
    expenseAmount: '420.00',
    taxAmount: '0.00',
    totalAmount: '420.00',
    expenseCategory: '业务招待费',
    budget: 'AP事业部预算2026',
    remark: '',
    checkInDate: '',
    checkOutDate: '',
    city: '',
    guests: '',
    nights: '',
  },
  {
    id: '4',
    invoiceType: '无',
    invoiceCode: '-',
    invoiceNumber: '-',
    invoiceDate: '2026-05-20',
    seller: '内部补助',
    expenseAmount: '800.00',
    taxAmount: '0.00',
    totalAmount: '800.00',
    expenseCategory: '住宿补助',
    budget: 'AP事业部预算2026',
    remark: '上海出差住宿补助',
    city: '上海',
    startDate: '2026-05-18',
    endDate: '2026-05-22',
    days: '4',
    roomMates: '1',
    roomMateNames: '张三',
    checkInDate: '',
    checkOutDate: '',
    guests: '',
    nights: '',
  },
]);

// Total amount - editable
const totalAmount = ref<string>(
  expenseItems.value
    .reduce((sum, item) => sum + Number.parseFloat(item.totalAmount), 0)
    .toFixed(2),
);

// Expense category options
// Travel subcategories
const travelSubcategories = [
  '交通费',
  '住宿费',
  '餐费',
  '差旅补贴',
  '住宿补助',
  '业务招待费',
];

// Invoice columns for reimbursement agent
const invoiceColumns = [
  { title: '发票类型', dataIndex: 'type', key: 'type', width: 100 },
  { title: '发票代码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '金额', dataIndex: 'amount', key: 'amount', width: 100 },
  { title: '开票日期', dataIndex: 'date', key: 'date', width: 100 },
  { title: '销方', dataIndex: 'seller', key: 'seller', width: 150 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 60 },
];

// Drug columns for sales agent
const drugColumns = [
  { title: '商品', dataIndex: 'image', key: 'image', width: 50 },
  { title: '商品名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '产品编号', dataIndex: 'sku', key: 'sku', width: 85 },
  { title: '包装规格', dataIndex: 'spec', key: 'spec', width: 90 },
  {
    title: '主治项目 / 药效',
    dataIndex: 'efficacy',
    key: 'efficacy',
    width: 160,
  },
  { title: '建议价', dataIndex: 'price', key: 'price', width: 60 },
  { title: '所属品类', dataIndex: 'category', key: 'category', width: 90 },
  { title: '操作', dataIndex: 'action', key: 'action', width: 50 },
];

// Invoice mock data
const mockInvoices = ref([
  {
    key: '1',
    type: '火车票',
    code: 'K1234',
    number: '00123456',
    amount: '￥286.00',
    date: '2026-05-18',
    seller: '中国铁路上海局集团有限公司',
  },
  {
    key: '2',
    type: '飞机票',
    code: 'CA1234',
    number: 'ETKT1234567890',
    amount: '￥1,580.00',
    date: '2026-05-22',
    seller: '中国国际航空股份有限公司',
  },
  {
    key: '3',
    type: '增值税专用发票',
    code: '3100191130',
    amount: '￥1,280.00',
    date: '2026-05-18',
    seller: '上海如家精选酒店有限公司',
  },
  {
    key: '4',
    type: '增值税专用发票',
    code: '3100192130',
    amount: '￥1,350.00',
    date: '2026-05-19',
    seller: '上海全季酒店有限公司',
  },
  {
    key: '5',
    type: '增值税普通发票',
    code: '3100193130',
    amount: '￥420.00',
    date: '2026-05-20',
    seller: '上海小南国餐饮管理有限公司',
  },
]);

// Drug mock data
const mockDrugs = ref([
  {
    key: '1',
    name: '甲硝唑片',
    sku: 'DEN-1001',
    spec: '0.2g*100片',
    efficacy: '厌氧菌感染/牙周炎/冠周炎',
    price: '8.5',
    category: '处方药 (抗厌氧菌)',
  },
  {
    key: '2',
    name: '人工牛黄甲硝唑胶囊',
    sku: 'DEN-1035',
    spec: '24粒/盒',
    efficacy: '急性智齿冠周炎/局部牙槽脓肿',
    price: '15.0',
    category: '非处方药 (中西结合)',
  },
  {
    key: '3',
    name: '阿莫西林克拉维酸钾片',
    sku: 'MED-2016',
    spec: '0.375g*6片',
    efficacy: '广谱抗菌/重度牙痛感染',
    price: '32.0',
    category: '处方药 (青霉素类)',
  },
]);

const removeItem = (key: string) => {
  if (currentId === 'agt_5') {
    mockInvoices.value = mockInvoices.value.filter((d) => d.key !== key);
  } else {
    mockDrugs.value = mockDrugs.value.filter((d) => d.key !== key);
  }
};

// Add item logic
const handleAddItem = () => {
  if (currentId === 'agt_5') {
    // For invoice agent, open modal first
    addInvoiceModalVisible.value = true;
    return;
  }

  const code = customItemCode.value.trim();
  if (!code) return;

  // Add drug logic
  if (code === '80002') {
    mockDrugs.value.push({
      key: String(mockDrugs.value.length + 1),
      name: '丁细牙痛胶囊',
      sku: '80002',
      spec: '0.45g*24粒',
      efficacy: '清热解毒，疏风止痛，用于风火牙痛',
      price: '28.0',
      category: '非处方药 (中成药)',
    });
    message.success('已自动补全并添加：丁细牙痛胶囊');
    customItemCode.value = '';
  } else {
    message.error(`未在主数据库中查询到编号：${code}`);
  }
};

// Generate Logic
const generatingModalVisible = ref(false);
const generating = ref(false);
const generateSuccess = ref(false);

const handleGenerate = () => {
  if (currentId === 'agt_5') {
    // Switch to expense detail view
    currentView.value = 'expense';
    hasGenerated.value = true;
    return;
  }

  if (exportOptions.value.length === 0) {
    message.warning('请至少选择一种生成格式！');
    return;
  }

  generatingModalVisible.value = true;
  generating.value = true;
  generateSuccess.value = false;

  // Simulate generation delay
  setTimeout(() => {
    generating.value = false;
    generateSuccess.value = true;
  }, 2500);
};

const resetGenerateModal = () => {
  generatingModalVisible.value = false;
};

const handleSubmitReimbursement = () => {
  generatingModalVisible.value = true;
  generating.value = true;
  generateSuccess.value = false;

  setTimeout(() => {
    generating.value = false;
    generateSuccess.value = true;
    hasGenerated.value = true;
  }, 2500);
};

const handleSubmitDocument = () => {
  message.success('单据提交成功！');
};

const handleSelectDocument = () => {
  message.info('请选择差旅申请单');
};

const handleViewInvoiceImage = (item: any) => {
  message.info(`查看发票影像：${item.invoiceCode}`);
};

const inputText = ref('');

function openBusinessDrawer() {
  drawerVisible.value = true;
}

// ========== Card Confirm Handlers for agt_10 (填报助理) ==========

function handleFillPlanConfirm() {
  messages.value.push(
    {
      role: 'user',
      content: '方案没问题，开始填报',
      time: '刚刚',
    },
    {
      role: 'agent',
      content:
        '好的，我已扫描发票池并按行程日期智能匹配，共命中 8 张差旅相关发票（其中 2 张存在异常已为您排除勾选），请核对确认。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'fill-invoice',
      cardData: {
        invoices: fillInvoices.value,
        matchBasis:
          '结合本单报销期间（2026-07）与行程数据（2026-07-20 至 2026-07-24 上海），按发票日期、费用类型与行程规则自动匹配，连号及信息缺失发票将标记提醒。',
      },
      time: '刚刚',
    },
  );
}

function handleFillInvoiceConfirm(selected: any[]) {
  fillSelectedInvoices.value = selected;
  messages.value.push(
    {
      role: 'user',
      content: `已确认 ${selected.length} 张发票`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content: '好的，已根据您的描述推断出单据表头信息，请确认或修改。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'header-collect',
      cardData: { ...fillHeader.value },
      time: '刚刚',
    },
  );
}

function handleFillHeaderConfirm(data: any) {
  fillHeader.value = { ...data };
  messages.value.push(
    {
      role: 'user',
      content: `单头信息已确认：${data.company} · ${data.budgetCategory} · ${data.description}`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content:
        '已按科目自动归类费用明细并完成合规预校验，请查看汇总结果，确认后生成报销单。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'fill-summary',
      cardData: {
        docTitle: '差旅报销单',
        items: fillSummaryItems.value,
        allowance: { amount: '¥400.00', label: '国内餐费（100元/天 × 4天）' },
        total: fillTotal.value,
      },
      time: '刚刚',
    },
  );
}

function handleFillSummaryConfirm() {
  const invoiceCount = fillSelectedInvoices.value.length;
  messages.value.push(
    {
      role: 'user',
      content: '费用汇总已确认，生成报销单',
      time: '刚刚',
    },
    {
      role: 'agent',
      content:
        '已为您生成差旅报销单，待办卡片如下，点击「立即处理」可查看完整单据内容并进行提交。',
      time: '刚刚',
    },
    {
      role: 'agent',
      isCard: true,
      cardTitle: '差旅报销单已生成 — CLS20260728002',
      cardDesc: `合计金额 ${fillTotal.value} · 发票${invoiceCount}张 · 费用明细${fillSummaryItems.value.length}项 · 差旅补贴1项`,
      time: '刚刚',
    },
  );
  message.success('差旅报销单已生成');
}

// ========== Card Confirm Handlers for agt_8 ==========

function handleHeaderConfirm(data: any) {
  if (currentId === 'agt_10') {
    handleFillHeaderConfirm(data);
    return;
  }
  messages.value.push(
    {
      role: 'user',
      content: `单头信息已确认：${data.company} · ${data.budgetCategory} · ${data.description}`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content: '好的，单头信息已保存。接下来请确认需要报销的发票。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'invoice-confirm',
      cardData: {
        initialSelectedInvoices: [
          'inv_1',
          'inv_2',
          'inv_3',
          'inv_4',
          'inv_5',
          'inv_6',
        ],
        matchedInvoices: [
          {
            id: 'inv_1',
            type: '火车票',
            seller: '中国铁路上海局集团有限公司',
            number: '00483217',
            amount: '¥286.00',
            date: '2026-07-20',
          },
          {
            id: 'inv_2',
            type: '火车票',
            seller: '中国铁路上海局集团有限公司',
            number: '00483218',
            amount: '¥286.00',
            date: '2026-07-24',
          },
          {
            id: 'inv_3',
            type: '增值税专用发票',
            seller: '上海如家精选酒店有限公司',
            number: '87654321',
            amount: '¥1,280.00',
            date: '2026-07-20',
          },
          {
            id: 'inv_4',
            type: '增值税专用发票',
            seller: '上海全季酒店有限公司',
            number: '87654322',
            amount: '¥1,350.00',
            date: '2026-07-22',
          },
          {
            id: 'inv_5',
            type: '增值税电子普通发票',
            seller: '滴滴出行科技有限公司',
            number: '66554433',
            amount: '¥86.00',
            date: '2026-07-20',
          },
          {
            id: 'inv_6',
            type: '增值税普通发票',
            seller: '中国石化上海石油分公司',
            number: '99887766',
            amount: '¥300.00',
            date: '2026-07-22',
          },
          {
            id: 'inv_7',
            type: '增值税普通发票',
            seller: '上海小南国餐饮管理有限公司',
            number: '99887777',
            amount: '¥420.00',
            date: '2026-07-21',
          },
          {
            id: 'inv_8',
            type: '增值税普通发票',
            seller: '上海联华超市有限公司',
            number: '99887788',
            amount: '¥156.00',
            date: '2026-07-23',
          },
        ],
      },
      time: '刚刚',
    },
  );
}

function handleApplicationSelectConfirm(data: any) {
  const selected = data.selectedApplications || [];
  messages.value.push(
    {
      role: 'user',
      content: `已关联 ${selected.length} 份差旅申请单`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content: '好的，已根据选中申请单生成行程，请在下方编辑调整行程信息。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'trip-edit',
      cardData: {
        selectedApplications: selected,
        initialTrips: [
          {
            seq: 1,
            startDate: '2026-07-18',
            endDate: '2026-07-18',
            from: '上海',
            to: '上海虹桥',
            transport: '火车',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
          {
            seq: 2,
            startDate: '2026-07-18',
            endDate: '2026-07-20',
            from: '上海',
            to: '静安区',
            transport: '其它',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
          {
            seq: 3,
            startDate: '2026-07-20',
            endDate: '2026-07-20',
            from: '上海',
            to: '上海虹桥',
            transport: '火车',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
          {
            seq: 4,
            startDate: '2026-07-20',
            endDate: '2026-07-22',
            from: '上海',
            to: '浦东新区',
            transport: '其它',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
          {
            seq: 5,
            startDate: '2026-07-20',
            endDate: '2026-07-23',
            from: '上海',
            to: '徐汇区',
            transport: '其它',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
          {
            seq: 6,
            startDate: '2026-07-24',
            endDate: '2026-07-24',
            from: '上海',
            to: '上海总部',
            transport: '火车',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
          {
            seq: 7,
            startDate: '2026-07-25',
            endDate: '2026-07-25',
            from: '上海',
            to: '上海总部',
            transport: '火车',
            companion: '',
            remark: '',
            source: '差旅申请单明细',
          },
        ],
      },
      time: '刚刚',
    },
  );
}

function handleApplicationSelectTableConfirm(_data: any) {
  messages.value.push(
    {
      role: 'user',
      content: '已确认关联的差旅申请单，继续。',
      time: '刚刚',
    },
    {
      role: 'agent',
      content:
        '好的，已根据申请单出差日期从发票池中筛选出匹配的发票，请选择需要报销的发票。',
      time: '刚刚',
      hasAction: false,
    },
    {
      role: 'agent',
      cardType: 'invoice-select-table',
      cardData: {
        initialSelectedInvoices: [
          'inv_1',
          'inv_2',
          'inv_3',
          'inv_4',
          'inv_5',
          'inv_6',
        ],
        availableInvoices: [
          {
            id: 'inv_1',
            type: '火车票',
            seller: '中国铁路上海局集团有限公司',
            number: '00483217',
            amount: '¥286.00',
            date: '2026-07-20',
            basis: '去程交通',
          },
          {
            id: 'inv_2',
            type: '火车票',
            seller: '中国铁路上海局集团有限公司',
            number: '00483218',
            amount: '¥286.00',
            date: '2026-07-24',
            basis: '返程交通',
          },
          {
            id: 'inv_3',
            type: '增值税专用发票',
            seller: '上海如家精选酒店有限公司',
            number: '87654321',
            amount: '¥1,280.00',
            date: '2026-07-20',
            basis: '住宿（浦东新区）',
          },
          {
            id: 'inv_4',
            type: '增值税专用发票',
            seller: '上海全季酒店有限公司',
            number: '87654322',
            amount: '¥1,350.00',
            date: '2026-07-22',
            basis: '住宿（徐汇区）',
          },
          {
            id: 'inv_5',
            type: '增值税电子普通发票',
            seller: '滴滴出行科技有限公司',
            number: '66554433',
            amount: '¥86.00',
            date: '2026-07-20',
            basis: '市内交通',
          },
          {
            id: 'inv_6',
            type: '增值税普通发票',
            seller: '中国石化上海石油分公司',
            number: '99887766',
            amount: '¥300.00',
            date: '2026-07-22',
            basis: '自驾油费',
          },
          {
            id: 'inv_7',
            type: '增值税普通发票',
            seller: '上海小南国餐饮管理有限公司',
            number: '99887777',
            amount: '¥420.00',
            date: '2026-07-21',
            basis: '餐饮费用',
          },
        ],
      },
      time: '刚刚',
    },
  );
}

function handleInvoiceSelectTableConfirm(data: any) {
  const selected = data.selectedInvoices || [];
  v3ExpenseItems.value = [
    {
      category: '火车票',
      invoiceType: '火车票',
      invoiceNo: '00483217',
      invoiceAmount: '¥286.00',
      reimbursementAmount: '¥286.00',
      detail: '出发城市：上海；目的城市：上海虹桥',
      attachment: '—',
      trip: '2026-07-20至2026-07-20 上海-火车-上海虹桥',
    },
    {
      category: '火车票',
      invoiceType: '火车票',
      invoiceNo: '00483218',
      invoiceAmount: '¥286.00',
      reimbursementAmount: '¥286.00',
      detail: '出发城市：上海；目的城市：上海总部',
      attachment: '—',
      trip: '2026-07-24至2026-07-24 上海-火车-上海总部',
    },
    {
      category: '市内交通费',
      invoiceType: '电子普票',
      invoiceNo: '66554433',
      invoiceAmount: '¥86.00',
      reimbursementAmount: '¥86.00',
      detail: '—',
      attachment: '—',
      trip: '2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店',
    },
    {
      category: '其他',
      invoiceType: '增值税普通发票',
      invoiceNo: '99887766',
      invoiceAmount: '¥300.00',
      reimbursementAmount: '¥300.00',
      detail: '—',
      attachment: '—',
      trip: '2026-07-22至2026-07-22 浦东新区-自驾-徐汇区',
    },
    {
      category: '国内住宿费',
      invoiceType: '增值税专用发票',
      invoiceNo: '87654321',
      invoiceAmount: '¥1,280.00',
      reimbursementAmount: '¥1,280.00',
      detail: '入住日期：2026-07-20；离店日期：2026-07-22',
      attachment: '—',
      trip: '2026-07-20至2026-07-22 上海-其它-浦东新区',
      anomalyWarning: '待上传水单；人数待补充',
      checkInDate: '2026-07-20',
      checkOutDate: '2026-07-22',
    },
    {
      category: '国内住宿费',
      invoiceType: '增值税专用发票',
      invoiceNo: '87654322',
      invoiceAmount: '¥1,350.00',
      reimbursementAmount: '¥1,350.00',
      detail: '入住日期：2026-07-23；离店日期：2026-07-24',
      attachment: '—',
      trip: '2026-07-23至2026-07-24 上海-其它-徐汇区',
      anomalyWarning: '待上传水单；人数待补充',
      checkInDate: '2026-07-23',
      checkOutDate: '2026-07-24',
    },
  ];
  messages.value.push(
    {
      role: 'user',
      content: `已确认 ${selected.length} 张发票，继续。`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content: '好的，已根据所选发票生成费用明细，请查看并处理异常。',
      time: '刚刚',
      hasAction: false,
    },
    {
      role: 'agent',
      cardType: 'expense-summary',
      cardTitle: '费用明细已生成',
      cardDesc: '已根据选取的发票生成费用明细，可点击处理异常。',
      time: '刚刚',
    },
  );
}

function handleV3ExpenseModify() {
  v3ExpenseItems.value.forEach((item: any) => {
    const desc = (item.modifyDescription || '').trim();
    if (desc) {
      const guestMatch = desc.match(/人数[：:]?\s*(\d+)/);
      if (guestMatch) {
        item.guests = guestMatch[1];
      }
      const checkInMatch = desc.match(
        /入住?(?:日期)?[：:]\s*(\d{4}-\d{2}-\d{2})/,
      );
      if (checkInMatch) {
        item.checkInDate = checkInMatch[1];
      }
      const checkOutMatch = desc.match(
        /(?:离店|离)(?:日期)?[：:]\s*(\d{4}-\d{2}-\d{2})/,
      );
      if (checkOutMatch) {
        item.checkOutDate = checkOutMatch[1];
      }
      if (desc.includes('水单') || desc.includes('已上传')) {
        item.attachment = '已上传水单';
      }
      if (item.category === '国内住宿费') {
        const parts: string[] = [];
        if (item.guests) parts.push(`人数：${item.guests}人`);
        if (item.checkInDate) parts.push(`入住日期：${item.checkInDate}`);
        if (item.checkOutDate) parts.push(`离店日期：${item.checkOutDate}`);
        if (parts.length > 0) {
          item.detail = parts.join('；');
        }
      }
    }
    if (item.anomalyWarning) {
      const remaining: string[] = [];
      if (
        item.anomalyWarning.includes('待上传水单') &&
        (!item.attachment || item.attachment === '—')
      ) {
        remaining.push('待上传水单');
      }
      if (item.anomalyWarning.includes('人数待补充') && !item.guests) {
        remaining.push('人数待补充');
      }
      item.anomalyWarning =
        remaining.length > 0 ? remaining.join('；') : undefined;
    }
  });
  const remaining = v3ExpenseAnomalyCount.value;
  const allowanceDesc = v3AllowanceModifyDesc.value.trim();
  const allowanceNote = allowanceDesc
    ? `国内餐费已按「${allowanceDesc}」调整。`
    : '';
  messages.value.push(
    {
      role: 'agent',
      content:
        (remaining > 0
          ? `已根据修改说明更新费用明细，剩余 ${remaining} 个异常待处理。`
          : '费用明细异常已全部处理完成，可点击「进入下一步」生成报销单。') +
        (allowanceNote ? ` ${allowanceNote}` : ''),
      time: '刚刚',
      hasAction: false,
    },
    {
      role: 'agent',
      cardType: 'expense-summary',
      cardTitle: '费用明细已更新',
      cardDesc:
        remaining > 0
          ? `已更新费用明细，剩余 ${remaining} 个异常待处理。`
          : '费用明细异常已全部处理完成，可生成报销单。',
      time: '刚刚',
    },
  );
  v3ExpenseDrawerVisible.value = false;
  v3AllowanceModifyDesc.value = '';
  message.success('费用明细已更新');
}

function setV3FileInputRef(index: number, el: HTMLInputElement | null) {
  if (el) {
    v3FileInputs.value.set(index, el);
  }
}

function handleV3Upload(index: number) {
  const input = v3FileInputs.value.get(index);
  if (input) {
    input.value = '';
    input.click();
  }
}

function onV3FileSelected(event: Event, index: number) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    v3ExpenseItems.value[index].attachment = file.name;
    message.success(`已上传：${file.name}`);
  }
}

function handleV3InputSubmit() {
  if (currentId !== 'agt_9') return;
  const text = inputText.value.trim();
  if (!['确认，继续', '确认，进入下一步'].includes(text)) return;

  if (v3Stage.value === 'expense') {
    if (v3ExpenseAnomalyCount.value === 0) {
      handleV3ExpenseNext();
      v3Stage.value = 'done';
    } else {
      message.warning('尚有费用明细异常未处理，请先点击「编辑费用明细」处理。');
    }
  }
  inputText.value = '';
}

function handleV3ExpenseNext() {
  messages.value.push(
    {
      role: 'agent',
      content:
        '已为您生成差旅报销单，待办卡片如下，点击「立即处理」可查看完整单据内容并进行提交。',
      time: '刚刚',
      hasAction: false,
    },
    {
      role: 'agent',
      isCard: true,
      cardTitle: '差旅报销单已生成 — CLS20260728001',
      cardDesc:
        '合计金额 ¥3,708.00 · 关联申请单2份 · 发票6张 · 费用明细7项 · 行程8段',
      time: '刚刚',
    },
  );
  message.success('差旅报销单已生成');
}

function handleTripConfirm(data: any) {
  const tripCount = data.trips?.length || 0;
  messages.value.push(
    {
      role: 'user',
      content: `行程已确认：共 ${tripCount} 段行程`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content: '好的，行程已保存。接下来请填写单据表头信息。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'header-collect',
      cardData: {
        company: '上海家化联合股份有限公司',
        budgetCategory: '全年预算',
        project: '',
        description: '7月份差旅费用报销',
        applicant: '当前登录人（自动带出）',
        department: '数字化创新部',
        businessType: '管理-国内差旅',
        currency: 'RMB_人民币',
        contact: '138****5678',
      },
      time: '刚刚',
    },
  );
}

function handleInvoiceConfirm(data: any) {
  const selected = data.selectedInvoices || [];
  messages.value.push(
    {
      role: 'user',
      content: `已确认 ${selected.length} 张发票`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content: '好的，已根据发票生成费用明细，请在下方编辑调整报销金额。',
      time: '刚刚',
    },
    {
      role: 'agent',
      cardType: 'expense-edit',
      cardData: {
        selectedInvoices: selected,
        initialExpenses: [
          {
            category: '火车票',
            invoiceType: '火车票',
            invoiceNo: '00483217',
            invoiceAmount: '¥286.00',
            reimbursementAmount: '¥286.00',
            detail: '出发城市：上海；目的城市：上海虹桥',
            attachment: '—',
            trip: '2026-07-20至2026-07-20 上海-火车-上海虹桥',
          },
          {
            category: '火车票',
            invoiceType: '火车票',
            invoiceNo: '00483218',
            invoiceAmount: '¥286.00',
            reimbursementAmount: '¥286.00',
            detail: '出发城市：上海；目的城市：上海总部',
            attachment: '—',
            trip: '2026-07-24至2026-07-24 上海-火车-上海总部',
          },
          {
            category: '市内交通费',
            invoiceType: '电子普票',
            invoiceNo: '66554433',
            invoiceAmount: '¥86.00',
            reimbursementAmount: '¥86.00',
            detail: '—',
            attachment: '—',
            trip: '2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店',
          },
          {
            category: '其他',
            invoiceType: '增值税普通发票',
            invoiceNo: '99887766',
            invoiceAmount: '¥300.00',
            reimbursementAmount: '¥300.00',
            detail: '—',
            attachment: '—',
            trip: '2026-07-22至2026-07-22 浦东新区-自驾-徐汇区',
          },
          {
            category: '国内住宿费',
            invoiceType: '增值税专用发票',
            invoiceNo: '87654321',
            invoiceAmount: '¥1,280.00',
            reimbursementAmount: '¥1,280.00',
            detail: '人数：1人；入住日期：2026-07-20；离店日期：2026-07-22',
            attachment: '—',
            trip: '2026-07-20至2026-07-22 上海-其它-浦东新区',
            guests: '1',
            checkInDate: '2026-07-20',
            checkOutDate: '2026-07-22',
            anomalyWarning: '待上传水单',
          },
          {
            category: '国内住宿费',
            invoiceType: '增值税专用发票',
            invoiceNo: '87654322',
            invoiceAmount: '¥1,350.00',
            reimbursementAmount: '¥1,350.00',
            detail: '入住日期：2026-07-23；离店日期：2026-07-24',
            attachment: '—',
            trip: '2026-07-23至2026-07-24 上海-其它-徐汇区',
            checkInDate: '2026-07-23',
            checkOutDate: '2026-07-24',
            anomalyWarning: '人数待补充；待上传水单',
          },
        ],
        totalAllowance: 400,
        allowanceLabel: '国内餐费（100元/天 × 4天）',
      },
      time: '刚刚',
    },
  );
}

function handleExpenseSave(data: any) {
  const savedItems = data.expenseItems || [];
  const msgIndex = messages.value.findIndex(
    (m) => m.cardType === 'expense-edit',
  );
  if (msgIndex !== -1) {
    messages.value[msgIndex] = {
      ...messages.value[msgIndex],
      cardData: {
        ...messages.value[msgIndex].cardData,
        initialExpenses: savedItems,
      },
    };
  }
  message.success('修改信息已保存');
}

function handleExpenseConfirm(data: any) {
  const items = data.expenseItems || [];
  const total = items.reduce((acc: number, item: any) => {
    return (
      acc +
      Number.parseFloat(item.reimbursementAmount.replaceAll(/[¥,]/g, '') || '0')
    );
  }, 0);
  const totalStr = `¥${total.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  messages.value.push(
    {
      role: 'user',
      content: `费用明细已确认，合计 ${totalStr}`,
      time: '刚刚',
    },
    {
      role: 'agent',
      content:
        '已为您生成差旅报销单，待办卡片如下，点击「立即处理」可查看完整单据内容并进行提交。',
      time: '刚刚',
    },
    {
      role: 'agent',
      isCard: true,
      cardTitle: '差旅报销单已生成 — CLS20260728001',
      cardDesc: `合计金额 ${totalStr} · 关联申请单2份 · 发票6张 · 费用明细${items.length}项 · 行程6段`,
      time: '刚刚',
    },
  );
}
</script>

<template>
  <div
    v-if="currentId === 'agt_6'"
    class="flex h-[calc(100vh-100px)] flex-col overflow-hidden bg-[#eef7f1] p-3"
  >
    <div
      class="mb-3 flex overflow-hidden rounded-[28px] border border-emerald-100 bg-white/90 shadow-sm"
    >
      <div class="flex flex-1 flex-col justify-center px-5 py-4">
        <div class="flex flex-wrap items-center gap-3">
          <Button
            type="text"
            shape="circle"
            class="!flex !items-center !justify-center bg-emerald-50 text-emerald-700"
            @click="router.back()"
          >
            <Icon icon="lucide:arrow-left" class="size-4" />
          </Button>
          <h1 class="m-0 text-2xl font-black tracking-tight text-slate-900">
            PPT助理
          </h1>
          <button
            v-for="menu in pptMenus"
            :key="menu.key"
            class="flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold transition-all"
            :class="[
              pptActiveMenu === menu.key
                ? 'border-emerald-950 bg-emerald-950 text-white shadow-lg shadow-emerald-900/20'
                : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50',
            ]"
            @click="pptActiveMenu = menu.key"
          >
            <Icon :icon="menu.icon" class="size-4" />
            {{ menu.label }}
          </button>
        </div>
        <p class="mb-0 mt-3 text-sm font-medium text-slate-500">
          企业专属 PPT
          生成专家，基于方案库、模板库、案例库和知识库一键生成专业演示文稿
        </p>
      </div>
    </div>

    <div
      class="flex min-h-0 flex-1 overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-sm"
    >
      <aside
        v-if="pptActiveMenu !== 'preview'"
        class="flex w-[280px] shrink-0 flex-col border-r border-emerald-50 bg-[#f6fbf8] p-4"
      >
        <div class="mb-4 flex items-center justify-between">
          <h2 class="m-0 text-lg font-black text-slate-900">对话历史</h2>
          <div class="flex gap-2">
            <Button shape="circle" class="!flex !items-center !justify-center">
              <Icon icon="lucide:plus" class="size-4" />
            </Button>
            <Button shape="circle" class="!flex !items-center !justify-center">
              <Icon icon="lucide:trash-2" class="size-4" />
            </Button>
          </div>
        </div>
        <div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          <button
            v-for="conversation in pptConversationList"
            :key="conversation.id"
            class="flex items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all"
            :class="[
              selectedPptConversationId === conversation.id
                ? 'border-blue-100 bg-white text-slate-900 shadow-sm ring-1 ring-blue-100'
                : 'border-slate-100 bg-white/70 text-slate-700 hover:bg-white',
            ]"
            @click="selectedPptConversationId = conversation.id"
          >
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-blue-500"
            >
              <Icon
                :icon="
                  selectedPptConversationId === conversation.id
                    ? 'lucide:check'
                    : 'lucide:plus'
                "
                class="size-4"
              />
            </span>
            <span class="min-w-0 flex-1 truncate text-sm font-bold">
              {{ conversation.title }}
            </span>
            <span class="shrink-0 text-xs font-bold text-slate-400">
              {{ conversation.time }}
            </span>
          </button>
        </div>
      </aside>

      <main
        v-if="pptActiveMenu !== 'preview'"
        class="flex min-w-0 flex-1 flex-col bg-white"
      >
        <PptAssistantChatHeader
          :active-menu="activePptMenu"
          :agent="currentAgent"
          :operation-steps="pptOperationSteps"
        />

        <div
          v-if="pptActiveMenu === 'employee'"
          class="flex min-h-0 flex-1 flex-col"
        >
          <div
            class="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-white to-emerald-50/20 p-8"
          >
            <div
              v-for="(msg, index) in pptChatMessages"
              :key="index"
              class="mb-6 flex gap-3"
              :class="{ 'justify-end': msg.role === 'user' }"
            >
              <Avatar
                v-if="msg.role === 'agent'"
                :src="currentAgent.image"
                :size="36"
                class="shrink-0"
              />
              <div class="max-w-[620px]">
                <div
                  class="mb-2 text-xs font-bold text-slate-300"
                  :class="{ 'text-right': msg.role === 'user' }"
                >
                  {{ msg.time }}
                </div>
                <div
                  v-if="msg.isPlanCard || msg.isResultCard"
                  class="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-lg shadow-emerald-900/5"
                >
                  <div
                    class="bg-gradient-to-r from-emerald-950 to-slate-900 p-5 text-white"
                  >
                    <div
                      class="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-100"
                    >
                      <Icon
                        :icon="
                          msg.isResultCard
                            ? 'lucide:file-check-2'
                            : 'lucide:sparkles'
                        "
                        class="size-4"
                      />
                      {{ msg.isResultCard ? '生成结果' : '全自动生成方案' }}
                    </div>
                    <h3 class="m-0 text-lg font-black">{{ msg.cardTitle }}</h3>
                  </div>
                  <div class="space-y-3 p-5">
                    <p class="m-0 text-sm leading-6 text-slate-500">
                      {{ msg.cardDesc }}
                    </p>
                    <div
                      class="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600"
                    >
                      <div class="rounded-2xl bg-emerald-50 p-3">
                        方案：设备售前客户宣讲
                      </div>
                      <div class="rounded-2xl bg-blue-50 p-3">
                        风格：蓝色科技风
                      </div>
                      <div class="rounded-2xl bg-amber-50 p-3">
                        {{ msg.isResultCard ? '页数：5 页' : '案例：3 个匹配' }}
                      </div>
                      <div class="rounded-2xl bg-cyan-50 p-3">
                        {{
                          msg.isResultCard ? '引用：可追溯' : '知识库：5 条引用'
                        }}
                      </div>
                    </div>
                    <Button
                      type="primary"
                      class="w-full !rounded-2xl !bg-emerald-950"
                      @click="
                        msg.isResultCard ? openPptPreview() : openPptDrawer()
                      "
                    >
                      {{ msg.actionText }}
                    </Button>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-2xl border px-5 py-4 text-sm font-medium leading-7 shadow-sm"
                  :class="[
                    msg.role === 'user'
                      ? 'border-emerald-900 bg-emerald-950 text-white'
                      : 'border-slate-100 bg-white text-slate-700',
                  ]"
                >
                  {{ msg.content }}
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-100 bg-white p-4">
            <div
              class="mb-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-2"
            >
              <div
                v-if="!pptQuickSchemeExpanded"
                class="flex items-center gap-2 overflow-x-auto"
              >
                <div
                  class="flex shrink-0 items-center gap-2 px-1 text-xs font-black text-slate-500"
                >
                  <Icon
                    icon="lucide:layout-template"
                    class="size-4 text-emerald-700"
                  />
                  快速选择方案模板
                </div>
                <button
                  v-for="scheme in pptQuickSchemes"
                  :key="scheme.title"
                  class="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  @click="openPptDrawer(scheme.title)"
                >
                  {{ scheme.title }}
                </button>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  class="!flex !items-center !justify-center text-slate-500"
                  @click="pptQuickSchemeExpanded = true"
                >
                  <Icon icon="lucide:chevron-up" class="size-4" />
                </Button>
              </div>

              <div v-else class="flex items-center justify-between gap-3">
                <div
                  class="flex items-center gap-2 text-xs font-black text-slate-500"
                >
                  <Icon
                    icon="lucide:layout-template"
                    class="size-4 text-emerald-700"
                  />
                  快速选择方案模板
                </div>
                <Button
                  type="text"
                  size="small"
                  shape="circle"
                  class="!flex !items-center !justify-center text-slate-500"
                  @click="pptQuickSchemeExpanded = false"
                >
                  <Icon icon="lucide:chevron-down" class="size-4" />
                </Button>
              </div>

              <div
                v-if="pptQuickSchemeExpanded"
                class="mt-2 grid gap-2 md:grid-cols-4"
              >
                <button
                  v-for="scheme in pptQuickSchemes"
                  :key="scheme.title"
                  class="group rounded-2xl border border-slate-200 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-sm"
                  @click="openPptDrawer(scheme.title)"
                >
                  <div
                    class="mb-2 flex items-center gap-2 text-sm font-black text-slate-900"
                  >
                    <span
                      class="flex size-7 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm group-hover:bg-emerald-950 group-hover:text-white"
                    >
                      <Icon :icon="scheme.icon" class="size-4" />
                    </span>
                    {{ scheme.title }}
                  </div>
                  <p class="m-0 line-clamp-2 text-xs leading-5 text-slate-500">
                    {{ scheme.desc }}
                  </p>
                </button>
              </div>
            </div>
            <div
              class="rounded-[24px] border border-slate-200 bg-slate-50/80 p-3 transition-all focus-within:border-emerald-300 focus-within:bg-white"
            >
              <Input.TextArea
                v-model:value="pptInputText"
                :auto-size="{ minRows: 2, maxRows: 4 }"
                placeholder="输入PPT主题，例如：创建长鑫 D7020 设备售前 PPT..."
                class="!border-none !bg-transparent !shadow-none placeholder:text-slate-400 focus:!shadow-none"
                @keyup.enter.exact.prevent="handlePptSend"
              />
              <div class="mt-2 flex items-center justify-between">
                <Button type="text" shape="circle" class="text-slate-500">
                  <Icon icon="lucide:paperclip" class="size-5" />
                </Button>
                <div class="flex items-center gap-2">
                  <Button type="text" shape="circle" class="text-slate-500">
                    <Icon icon="lucide:mic" class="size-5" />
                  </Button>
                  <Button
                    type="primary"
                    shape="circle"
                    class="!flex !items-center !justify-center !bg-emerald-950"
                    @click="handlePptSend"
                  >
                    <Icon icon="lucide:arrow-up" class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-white to-emerald-50/30 p-8"
        >
          <div class="mb-6 flex items-start justify-between gap-4">
            <div>
              <div
                class="flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-lg shadow-emerald-900/20"
              >
                <Icon :icon="activePptMenu.icon" class="size-6" />
              </div>
              <h2 class="mb-2 mt-4 text-2xl font-black text-slate-900">
                {{ activePptMenu.label }}
              </h2>
              <p class="m-0 text-sm font-medium text-slate-500">
                {{
                  pptActiveMenu === 'artifact'
                    ? '统一查看 PPT助理生成的所有产物，支持再次预览编辑和生成新版本。'
                    : '管理 PPT助理生成所需的方案、模板、案例和知识资料。'
                }}
              </p>
            </div>
            <div class="flex gap-2">
              <Button
                v-if="pptActiveMenu === 'scheme'"
                type="primary"
                class="!rounded-xl !bg-emerald-950"
                @click="openSchemeEditor()"
              >
                新增方案模板
              </Button>
              <Button
                v-if="pptActiveMenu === 'knowledge'"
                type="primary"
                class="!rounded-xl !bg-emerald-950"
                @click="knowledgeUploadVisible = true"
              >
                上传知识资料
              </Button>
              <Button
                v-if="pptActiveMenu === 'template'"
                type="primary"
                class="!rounded-xl !bg-emerald-950"
                @click="openResourceUpload('template')"
              >
                上传PPT模板
              </Button>
              <Button
                v-if="pptActiveMenu === 'case'"
                type="primary"
                class="!rounded-xl !bg-emerald-950"
                @click="openResourceUpload('case')"
              >
                上传案例
              </Button>
            </div>
          </div>

          <div v-if="pptActiveMenu === 'artifact'" class="space-y-4">
            <div
              class="flex flex-wrap items-center gap-3 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <Input
                v-model:value="artifactSearchForm.keyword"
                class="!w-64"
                placeholder="搜索 PPT 标题"
              />
              <Select
                v-model:value="artifactSearchForm.scheme"
                allow-clear
                class="!w-44"
                placeholder="方案模板"
              >
                <Select.Option value="设备售前客户宣讲">
                  设备售前客户宣讲
                </Select.Option>
                <Select.Option value="项目复盘">项目复盘</Select.Option>
                <Select.Option value="渠道合作">渠道合作</Select.Option>
              </Select>
              <Select
                v-model:value="artifactSearchForm.status"
                allow-clear
                class="!w-36"
                placeholder="状态"
              >
                <Select.Option value="已生成">已生成</Select.Option>
                <Select.Option value="已编辑">已编辑</Select.Option>
              </Select>
              <Button class="!rounded-xl" @click="resetArtifactSearch">
                重置
              </Button>
            </div>

            <div
              class="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm"
            >
              <table class="w-full text-left text-sm">
                <thead class="bg-emerald-50 text-xs font-black text-slate-500">
                  <tr>
                    <th class="px-4 py-3">PPT标题</th>
                    <th class="px-4 py-3">方案模板</th>
                    <th class="px-4 py-3">PPT风格</th>
                    <th class="px-4 py-3">页数</th>
                    <th class="px-4 py-3">版本</th>
                    <th class="px-4 py-3">状态</th>
                    <th class="px-4 py-3">最近编辑</th>
                    <th class="px-4 py-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="artifact in filteredPptArtifacts"
                    :key="artifact.id"
                    class="border-t border-slate-100 text-slate-700"
                  >
                    <td class="px-4 py-4 font-black text-slate-900">
                      {{ artifact.title }}
                    </td>
                    <td class="px-4 py-4">{{ artifact.scheme }}</td>
                    <td class="px-4 py-4">{{ artifact.style }}</td>
                    <td class="px-4 py-4">{{ artifact.pages }} 页</td>
                    <td class="px-4 py-4">V{{ artifact.version }}</td>
                    <td class="px-4 py-4">
                      <Tag color="green" class="!rounded-full">
                        {{ artifact.status }}
                      </Tag>
                    </td>
                    <td class="px-4 py-4 text-xs text-slate-400">
                      {{ artifact.updatedAt }}
                    </td>
                    <td class="px-4 py-4">
                      <div class="flex flex-wrap gap-2">
                        <Button
                          size="small"
                          class="!rounded-xl"
                          @click="openArtifactPreview"
                        >
                          预览
                        </Button>
                        <Button
                          size="small"
                          class="!rounded-xl"
                          @click="openArtifactPreview"
                        >
                          编辑
                        </Button>
                        <Dropdown trigger="click">
                          <Button size="small" class="!rounded-xl">下载</Button>
                          <template #overlay>
                            <Menu>
                              <Menu.Item
                                key="ppt"
                                @click="downloadArtifact('PPT')"
                              >
                                下载PPT
                              </Menu.Item>
                              <Menu.Item
                                key="pdf"
                                @click="downloadArtifact('PDF')"
                              >
                                下载PDF
                              </Menu.Item>
                            </Menu>
                          </template>
                        </Dropdown>
                        <Button
                          size="small"
                          class="!rounded-xl"
                          @click="addArtifactToCaseLibrary(artifact.id)"
                        >
                          加入案例库
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div
            v-else
            class="grid gap-4"
            :class="
              pptActiveMenu === 'template' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'
            "
          >
            <div
              v-for="(card, index) in activePptCards"
              :key="card.title"
              class="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <div
                v-if="pptActiveMenu === 'template' || pptActiveMenu === 'case'"
                class="h-28 p-5 text-white"
                :class="[
                  pptActiveMenu === 'template'
                    ? [
                        'bg-gradient-to-br from-blue-700 to-cyan-400',
                        'bg-gradient-to-br from-slate-900 to-slate-500',
                        'bg-gradient-to-br from-zinc-950 to-indigo-700',
                        'bg-gradient-to-br from-stone-100 to-emerald-200 !text-slate-900',
                      ][index % 4]
                    : [
                        'bg-gradient-to-br from-blue-950 to-sky-600',
                        'bg-gradient-to-br from-emerald-900 to-lime-500',
                        'bg-gradient-to-br from-orange-700 to-amber-400',
                      ][index % 3],
                ]"
              >
                <div class="text-xs font-black opacity-80">{{ card.meta }}</div>
                <div class="mt-4 line-clamp-2 text-lg font-black">
                  {{ card.title }}
                </div>
              </div>
              <div class="p-5">
                <div
                  v-if="
                    pptActiveMenu !== 'template' && pptActiveMenu !== 'case'
                  "
                  class="mb-4 flex items-center justify-between"
                >
                  <Tag color="green" class="!rounded-full">{{ card.meta }}</Tag>
                  <Icon
                    icon="lucide:more-horizontal"
                    class="size-5 text-slate-300"
                  />
                </div>
                <h3
                  v-if="
                    pptActiveMenu !== 'template' && pptActiveMenu !== 'case'
                  "
                  class="mb-2 text-base font-black text-slate-900"
                >
                  {{ card.title }}
                </h3>
                <p
                  class="m-0 min-h-12 whitespace-pre-line text-sm leading-6 text-slate-500"
                >
                  {{ card.desc }}
                </p>
                <div class="mt-4 flex flex-wrap gap-2">
                  <Tag
                    v-for="tag in card.tags"
                    :key="tag"
                    class="!rounded-full"
                  >
                    {{ tag }}
                  </Tag>
                </div>
                <div class="mt-5 flex gap-2">
                  <Button
                    size="small"
                    class="!rounded-xl"
                    @click="
                      pptActiveMenu === 'scheme'
                        ? openSchemeEditor(index)
                        : undefined
                    "
                  >
                    {{
                      pptActiveMenu === 'scheme'
                        ? '编辑'
                        : pptActiveMenu === 'template'
                          ? '预览模板'
                          : '查看详情'
                    }}
                  </Button>
                  <Button
                    size="small"
                    class="!rounded-xl"
                    @click="
                      pptActiveMenu === 'template' || pptActiveMenu === 'case'
                        ? openRemoveResourceConfirm(
                            pptActiveMenu,
                            index,
                            card.title,
                          )
                        : undefined
                    "
                  >
                    {{
                      pptActiveMenu === 'template' || pptActiveMenu === 'case'
                        ? '移除'
                        : pptActiveMenu === 'knowledge'
                          ? '添加到当前任务'
                          : '设为默认'
                    }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PptPreviewWorkspace
        v-else
        v-model:selected-ppt-slide-id="selectedPptSlideId"
        :selected-ppt-scheme="selectedPptScheme"
        :selected-ppt-style="selectedPptStyle"
        :slides="pptSlides"
        @export-pdf="exportPptFile('PDF')"
        @export-ppt="exportPptFile('PPT')"
        @regenerate-current-slide="regenerateCurrentSlide"
        @update-copy="updatePptSlideCopy"
      />
    </div>

    <PptBuildDrawer
      v-model="pptDrawerVisible"
      v-model:ppt-scheme-text="pptSchemeText"
      v-model:selected-ppt-style="selectedPptStyle"
      :generated-ppt-copy="generatedPptCopy"
      :generated-ppt-copy-version="generatedPptCopyVersion"
      :ppt-knowledge-refs="pptKnowledgeRefs"
      :ppt-matched-cases="pptMatchedCases"
      :ppt-style-templates="pptStyleTemplates"
      :selected-ppt-scheme="selectedPptScheme"
      @add-case-reference="openReferencePicker('case')"
      @add-knowledge-reference="openReferencePicker('knowledge')"
      @regenerate-copy="regeneratePptCopy"
      @rematch-references="rematchPptReferences"
      @remove-case="removePptCase"
      @remove-knowledge="removePptKnowledge"
      @start-build="handleStartPptBuild"
      @update-copy-item="updateGeneratedPptCopyItem"
    />

    <Modal
      v-model:open="referencePickerVisible"
      :title="
        referencePickerType === 'case' ? '添加案例引用' : '添加知识库引用'
      "
      width="640px"
      @ok="saveReferencePicker"
    >
      <div class="space-y-3 pt-2">
        <div
          class="rounded-2xl bg-slate-50 p-4 text-xs font-medium leading-6 text-slate-500"
        >
          {{
            referencePickerType === 'case'
              ? '请选择需要补充引用的历史 PPT 案例。'
              : '请选择需要补充引用的知识库资料。'
          }}
        </div>
        <Checkbox.Group v-model:value="selectedReferenceItems" class="w-full">
          <div class="grid gap-3">
            <label
              v-for="item in referencePickerOptions"
              :key="item"
              class="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 text-sm font-bold text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50"
            >
              <Checkbox :value="item" />
              <span>{{ item }}</span>
            </label>
          </div>
        </Checkbox.Group>
      </div>
    </Modal>

    <Modal
      v-model:open="schemeEditorVisible"
      :title="editingSchemeIndex >= 0 ? '编辑方案模板' : '新增方案模板'"
      width="720px"
      @ok="saveSchemeTemplate"
    >
      <div class="space-y-4 pt-2">
        <Input v-model:value="schemeEditorForm.title" placeholder="方案名称" />
        <Input
          v-model:value="schemeEditorForm.tags"
          placeholder="标签，用顿号分隔，例如：售前、设备"
        />
        <Input.TextArea
          v-model:value="schemeEditorForm.desc"
          :auto-size="{ minRows: 6, maxRows: 10 }"
          placeholder="编辑模板中的内容、页面结构和数据源提示语"
        />
      </div>
    </Modal>

    <Modal
      v-model:open="knowledgeUploadVisible"
      title="上传知识资料"
      width="640px"
      @ok="uploadKnowledgeDemo"
    >
      <div class="space-y-4 pt-2">
        <Input
          v-model:value="knowledgeUploadForm.title"
          placeholder="资料名称"
        />
        <Input.TextArea
          v-model:value="knowledgeUploadForm.desc"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          placeholder="资料摘要"
        />
        <div
          class="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm font-bold text-emerald-800"
        >
          点击或拖拽文件到此处上传（Demo）
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="resourceUploadVisible"
      :title="resourceUploadType === 'template' ? '上传PPT模板' : '上传案例'"
      width="640px"
      @ok="saveResourceUpload"
    >
      <div class="space-y-4 pt-2">
        <Input
          v-model:value="resourceUploadForm.title"
          :placeholder="
            resourceUploadType === 'template' ? '模板名称' : '案例名称'
          "
        />
        <Input
          v-model:value="resourceUploadForm.tags"
          placeholder="标签，用顿号分隔"
        />
        <Input.TextArea
          v-model:value="resourceUploadForm.desc"
          :auto-size="{ minRows: 4, maxRows: 8 }"
          :placeholder="
            resourceUploadType === 'template' ? '模板适用场景说明' : '案例摘要'
          "
        />
        <div
          class="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-sm font-bold text-emerald-800"
        >
          {{
            resourceUploadType === 'template'
              ? '上传 PPT 模板文件（Demo）'
              : '上传历史案例 PPT（Demo）'
          }}
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="resourceRemoveVisible"
      title="确认移除"
      ok-text="确认移除"
      cancel-text="取消"
      @ok="confirmRemoveResource"
    >
      <p class="m-0 text-sm leading-6 text-slate-600">
        确认移除「{{ pendingRemoveResource.title }}」吗？该操作仅影响当前 Demo
        数据。
      </p>
    </Modal>
  </div>

  <div
    v-else
    class="flex h-[calc(100vh-100px)] gap-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6"
  >
    <!-- Main Chat Area -->
    <div
      class="relative flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/95 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 backdrop-blur-xl transition-all duration-500 hover:shadow-[0_12px_48px_rgba(0,0,0,0.08)]"
    >
      <!-- Modern Chat Header -->
      <div
        class="flex items-start justify-between border-b border-slate-100/80 bg-gradient-to-r from-white via-slate-50/50 to-white px-6 py-4 backdrop-blur-md"
      >
        <div class="flex items-start gap-4">
          <Button
            type="text"
            shape="circle"
            class="!flex !items-center !justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-50 text-slate-500 shadow-sm transition-all hover:from-slate-200 hover:to-slate-100 hover:text-slate-700 hover:shadow-md"
            @click="router.back()"
          >
            <Icon icon="lucide:arrow-left" class="size-5" />
          </Button>

          <div class="relative">
            <Avatar
              :src="currentAgent.image"
              :size="52"
              class="border-2 border-white bg-gradient-to-br from-blue-50 to-white object-cover shadow-md"
            />
            <span
              class="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm"
              :class="{
                'bg-gradient-to-br from-green-400 to-green-600':
                  currentAgent.status === 'online',
                'bg-gradient-to-br from-amber-400 to-amber-600':
                  currentAgent.status === 'busy',
                'bg-gradient-to-br from-slate-300 to-slate-500':
                  currentAgent.status === 'offline',
              }"
            ></span>
          </div>

          <div>
            <h2
              class="m-0 flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900"
            >
              {{ currentAgent.name }}
              <span
                class="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
              >
                {{ currentAgent.role }}
              </span>
            </h2>
            <div
              class="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500"
            >
              <Icon
                icon="lucide:sparkles"
                class="text-gradient-to-r size-3.5 from-blue-500 to-purple-500"
              />
              <span
                class="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"
              >
                AI 智能体正在为您服务
              </span>
            </div>
          </div>
        </div>

        <Space class="flex items-center gap-2">
          <Button
            type="text"
            shape="circle"
            class="rounded-full bg-slate-50/50 text-slate-400 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon icon="lucide:phone" class="size-4" />
          </Button>
          <Button
            type="text"
            shape="circle"
            class="rounded-full bg-slate-50/50 text-slate-400 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon icon="lucide:video" class="size-4" />
          </Button>
          <Button
            type="text"
            shape="circle"
            class="rounded-full bg-slate-50/50 text-slate-400 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon icon="lucide:more-vertical" class="size-5" />
          </Button>
        </Space>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 space-y-8 overflow-y-auto bg-slate-50/30 p-6 md:p-8">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="flex items-start gap-4"
          :class="{ 'flex-row-reverse': msg.role === 'user' }"
        >
          <!-- Message Avatar -->
          <Avatar
            v-if="msg.role === 'agent'"
            :src="currentAgent.image"
            :size="40"
            class="mb-1 shrink-0 border border-slate-200 shadow-sm"
          />
          <Avatar
            v-else
            size="large"
            class="mb-1 shrink-0 bg-blue-600 font-bold text-white shadow-sm"
          >
            YOU
          </Avatar>

          <!-- Smart-fill Card: Header Collect -->
          <HeaderCollectCard
            v-if="msg.cardType === 'header-collect'"
            :initial-data="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleHeaderConfirm"
          />

          <!-- Smart-fill Card: Application Select -->
          <ApplicationSelectCard
            v-else-if="msg.cardType === 'application-select'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleApplicationSelectConfirm"
          />

          <!-- Smart-fill Card: Application Select Table (agt_9) -->
          <ApplicationSelectTableCard
            v-else-if="msg.cardType === 'application-select-table'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleApplicationSelectTableConfirm"
          />

          <!-- Smart-fill Card: Invoice Select Table (agt_9) -->
          <InvoiceSelectTableCard
            v-else-if="msg.cardType === 'invoice-select-table'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleInvoiceSelectTableConfirm"
          />

          <!-- Smart-fill Card: Expense Summary (agt_9) -->
          <div
            v-else-if="msg.cardType === 'expense-summary'"
            class="flex w-full max-w-[320px] flex-col overflow-hidden rounded-2xl rounded-bl-md border border-slate-100 bg-white shadow-lg shadow-slate-200/40 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/30"
          >
            <div class="flex flex-col gap-1.5 p-4">
              <div
                class="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-3 py-1 text-white shadow-sm"
              >
                <Icon icon="lucide:receipt" class="size-3.5" />
                <span class="text-[10px] font-bold">费用明细</span>
              </div>
              <h3 class="m-0 text-base font-bold leading-snug text-slate-900">
                {{ msg.cardTitle }}
              </h3>
              <p class="m-0 text-sm font-medium text-slate-500">
                {{ msg.cardDesc }} · 还有
                {{ v3ExpenseAnomalyCount }} 个异常待处理
              </p>
            </div>
            <div
              class="flex items-center justify-between gap-2 border-t border-slate-50 bg-gradient-to-r from-slate-50 to-teal-50/30 p-3"
            >
              <div
                class="flex items-center gap-1.5 text-xs font-medium text-slate-500"
              >
                <Icon icon="lucide:info" class="size-3.5 text-blue-500" />
                <span>请确认数据，确认后进入下一步</span>
              </div>
              <Button
                size="small"
                class="flex items-center gap-1.5 rounded-full border-teal-300 px-4 py-1.5 text-sm font-medium text-teal-700"
                @click="v3ExpenseDrawerVisible = true"
              >
                <Icon icon="lucide:edit-3" class="size-3.5" />
                编辑费用明细
              </Button>
            </div>
          </div>

          <!-- Smart-fill Card: Trip Edit -->
          <TripEditCard
            v-else-if="msg.cardType === 'trip-edit'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleTripConfirm"
          />

          <!-- Smart-fill Card: Invoice Confirm -->
          <InvoiceConfirmCard
            v-else-if="msg.cardType === 'invoice-confirm'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleInvoiceConfirm"
          />

          <!-- Smart-fill Card: Expense Edit -->
          <ExpenseEditCard
            v-else-if="msg.cardType === 'expense-edit'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @save="handleExpenseSave"
            @confirm="handleExpenseConfirm"
          />

          <!-- Fill Assistant Card: Fill Plan (agt_10) -->
          <FillPlanCard
            v-else-if="msg.cardType === 'fill-plan'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleFillPlanConfirm"
          />

          <!-- Fill Assistant Card: Invoice Select (agt_10) -->
          <FillInvoiceCard
            v-else-if="msg.cardType === 'fill-invoice'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleFillInvoiceConfirm"
          />

          <!-- Fill Assistant Card: Expense Summary (agt_10) -->
          <FillSummaryCard
            v-else-if="msg.cardType === 'fill-summary'"
            v-bind="msg.cardData"
            class="max-w-[75%]"
            @confirm="handleFillSummaryConfirm"
          />

          <!-- Standard Message Bubble -->
          <div
            v-else-if="!msg.isCard"
            class="group relative max-w-[75%] rounded-2xl p-5 text-[15px] leading-relaxed"
            :class="{
              'rounded-br-md bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20':
                msg.role === 'user',
              'rounded-bl-md border border-slate-100 bg-white text-slate-700 shadow-md shadow-slate-200/50':
                msg.role === 'agent',
            }"
          >
            <div
              class="whitespace-pre-wrap"
              v-html="markdownToHtml(msg.content || '')"
            ></div>
            <!-- Time Signature -->
            <div
              class="mt-2 flex items-center gap-1 text-[11px] font-medium"
              :class="{
                'justify-end text-blue-200': msg.role === 'user',
                'text-slate-400': msg.role === 'agent',
              }"
            >
              <Icon
                v-if="msg.role === 'agent'"
                icon="lucide:check-circle-2"
                class="size-3"
              />
              {{ msg.time }}
            </div>
          </div>

          <!-- Modern Interactive Card Bubble (Todo Card) -->
          <div
            v-else
            class="flex w-full max-w-[320px] flex-col overflow-hidden rounded-2xl rounded-bl-md border border-slate-100 bg-white shadow-lg shadow-slate-200/40 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/30"
          >
            <div class="flex flex-col gap-1.5 p-4">
              <div
                class="mb-2 flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-white shadow-sm"
              >
                <Icon icon="lucide:file-spreadsheet" class="size-3.5" />
                <span class="text-[10px] font-bold">待办卡片</span>
              </div>
              <!-- Dynamic title -->
              <h3 class="m-0 text-base font-bold leading-snug text-slate-900">
                {{ msg.cardTitle }}
              </h3>
              <p class="m-0 text-sm font-medium text-slate-500">
                {{ msg.cardDesc }}
              </p>
            </div>
            <div
              class="flex justify-end border-t border-slate-50 bg-gradient-to-r from-slate-50 to-blue-50/30 p-3"
            >
              <Button
                type="primary"
                size="small"
                class="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1.5 text-sm font-medium shadow-md shadow-blue-500/30 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-500/40"
                @click="openBusinessDrawer"
              >
                <Icon icon="lucide:arrow-right" class="size-3.5" />
                立即处理
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modern Chat Input -->
      <div class="bg-gradient-to-t from-slate-50/50 to-white px-6 pb-6 pt-3">
        <div
          class="relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-3 shadow-md shadow-slate-100/50 transition-all duration-300 focus-within:border-blue-400 focus-within:shadow-lg focus-within:shadow-blue-100/30"
        >
          <Input.TextArea
            v-model:value="inputText"
            :auto-size="{ minRows: 2, maxRows: 6 }"
            placeholder="告诉数字员工您想要的选品要求或工作指令..."
            class="!resize-none !border-none !bg-transparent !px-4 !pt-3 !text-[15px] !shadow-none placeholder:text-slate-300 focus:!shadow-none"
            @keyup.enter.exact.prevent="handleV3InputSubmit"
          />

          <div class="mt-2 flex items-center justify-between px-2 pb-1">
            <Space size="middle" class="text-slate-400">
              <Button
                type="text"
                shape="circle"
                class="rounded-full bg-slate-50/80 text-slate-400 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-500"
              >
                <Icon icon="lucide:paperclip" class="size-5" />
              </Button>
              <Button
                type="text"
                shape="circle"
                class="rounded-full bg-slate-50/80 text-slate-400 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-500"
              >
                <Icon icon="lucide:image" class="size-5" />
              </Button>
              <Button
                type="text"
                shape="circle"
                class="rounded-full bg-slate-50/80 text-slate-400 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-500"
              >
                <Icon icon="lucide:mic" class="size-5" />
              </Button>
            </Space>
            <Button
              type="primary"
              size="large"
              shape="round"
              class="flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-800 to-slate-900 px-6 font-medium shadow-lg shadow-slate-500/30 transition-all hover:from-slate-700 hover:to-slate-800 hover:shadow-xl"
              @click="handleV3InputSubmit"
            >
              发送指令
              <Icon icon="lucide:send" class="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </div>

      <!-- Right Drawer (Human-in-the-loop) -->
      <Drawer
        v-model:open="drawerVisible"
        :title="
          currentId === 'agt_5' ||
          currentId === 'agt_7' ||
          currentId === 'agt_8' ||
          currentId === 'agt_9' ||
          currentId === 'agt_10'
            ? '创建报销单'
            : '选品单确认与产出'
        "
        placement="right"
        width="70%"
        :closable="true"
        :get-container="false"
        :style="{ position: 'absolute' }"
      >
        <template #extra></template>

        <!-- Fill Assistant Drawer - agt_10 -->
        <div
          v-if="currentId === 'agt_10'"
          class="flex flex-col gap-4 pl-2"
          style="height: calc(100vh - 200px)"
        >
          <!-- Section 1: 单据信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white shadow-sm"
              >
                1
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">单据信息</h4>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  单据类型
                </label>
                <div class="font-medium text-slate-800">差旅报销单</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  合计金额
                </label>
                <div class="font-bold text-green-600">{{ fillTotal }}</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  公司
                </label>
                <div class="text-slate-800">{{ fillHeader.company }}</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  预算类别
                </label>
                <div class="text-slate-800">
                  {{ fillHeader.budgetCategory
                  }}{{ fillHeader.project ? ` · ${fillHeader.project}` : '' }}
                </div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  申请人
                </label>
                <div class="text-slate-800">
                  {{ fillHeader.applicant }}（{{ fillHeader.department }}）
                </div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  业务大类
                </label>
                <div class="text-slate-800">
                  {{ fillHeader.businessType }}
                </div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  事项描述
                </label>
                <div class="text-slate-800">
                  {{ fillHeader.description }}
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: 费用明细 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white shadow-sm"
              >
                2
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">费用明细</h4>
              <Tag
                class="!ml-auto !bg-violet-100 !font-medium !text-violet-700"
              >
                {{ fillSummaryItems.length }} 个科目 · 含差旅补贴
              </Tag>
            </div>
            <div class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500">
                  <tr>
                    <th class="px-2 py-2">费用科目</th>
                    <th class="px-2 py-2">发票张数</th>
                    <th class="px-2 py-2">关联发票号</th>
                    <th class="px-2 py-2">金额</th>
                    <th class="px-2 py-2">合规校验</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in fillSummaryItems"
                    :key="item.category"
                    class="border-t border-slate-100"
                  >
                    <td class="px-2 py-1.5 font-medium text-slate-700">
                      {{ item.category }}
                    </td>
                    <td class="px-2 py-1.5">{{ item.count }} 张</td>
                    <td
                      class="max-w-[220px] px-2 py-1.5 font-mono text-[10px] text-slate-500"
                    >
                      {{ item.invoiceNos }}
                    </td>
                    <td class="px-2 py-1.5 font-bold text-slate-800">
                      {{ item.amount }}
                    </td>
                    <td class="px-2 py-1.5">
                      <span
                        class="flex items-start gap-1"
                        :class="
                          item.status === 'pass'
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        "
                      >
                        <Icon
                          :icon="
                            item.status === 'pass'
                              ? 'lucide:shield-check'
                              : 'lucide:alert-triangle'
                          "
                          class="mt-0.5 size-3 shrink-0"
                        />
                        {{ item.tip }}
                      </span>
                    </td>
                  </tr>
                  <tr
                    class="border-t border-dashed border-violet-200 bg-violet-50/40"
                  >
                    <td class="px-2 py-1.5 font-medium text-violet-700">
                      差旅补贴
                    </td>
                    <td class="px-2 py-1.5">1 项</td>
                    <td class="px-2 py-1.5 text-slate-400">系统自动计算</td>
                    <td class="px-2 py-1.5 font-bold text-violet-600">
                      ¥400.00
                    </td>
                    <td class="px-2 py-1.5 text-emerald-600">
                      国内餐费（100元/天 × 4天）
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Section 3: 关联发票 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white shadow-sm"
              >
                3
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">关联发票</h4>
              <Tag
                class="!ml-auto !bg-violet-100 !font-medium !text-violet-700"
              >
                共 {{ fillSelectedInvoices.length }} 张
              </Tag>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="inv in fillSelectedInvoices"
                :key="inv.id"
                class="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <Icon
                    icon="lucide:receipt"
                    class="size-4 shrink-0 text-violet-600"
                  />
                  <div class="min-w-0">
                    <div class="truncate text-xs font-medium text-slate-700">
                      {{ inv.type }} · {{ inv.number }}
                    </div>
                    <div class="truncate text-[10px] text-slate-400">
                      {{ inv.seller }} · {{ inv.date }}
                    </div>
                  </div>
                </div>
                <span class="shrink-0 text-xs font-bold text-slate-800">
                  {{ inv.amount }}
                </span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3"
          >
            <Button
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold"
              @click="drawerVisible = false"
            >
              关闭
            </Button>
            <Button
              type="primary"
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl bg-violet-600 text-[15px] font-bold shadow-lg shadow-violet-500/30 hover:!bg-violet-700"
              @click="handleSubmitDocument"
            >
              <Icon icon="lucide:send" class="size-5" />
              提交单据
            </Button>
          </div>
        </div>

        <!-- Invoice Agent Drawer -->
        <div
          v-else-if="currentId === 'agt_5'"
          class="flex flex-col gap-4 pl-2"
          style="height: calc(100vh - 200px)"
        >
          <!-- Document Info Form - only show in invoice view -->
          <div
            v-if="currentView === 'invoice'"
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
                >
                  1
                </div>
                <h4 class="m-0 text-base font-bold text-slate-900">单据信息</h4>
              </div>
              <div class="w-40">
                <Select
                  v-model:value="selectedDocumentType"
                  class="!w-full rounded-lg border border-slate-200 !text-sm"
                >
                  <Select.Option
                    v-for="doc in documentTypes"
                    :key="doc.value"
                    :value="doc.value"
                  >
                    {{ doc.label }}
                  </Select.Option>
                </Select>
              </div>
            </div>

            <!-- Budget Category -->
            <div class="mb-4">
              <label class="mb-2 block text-xs font-medium text-slate-500">
                预算类别
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="cat in budgetCategories"
                  :key="cat.value"
                  class="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                  :class="[
                    selectedBudgetCategory === cat.value
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  ]"
                  @click="selectedBudgetCategory = cat.value"
                >
                  {{ cat.label }}
                </button>
              </div>
            </div>

            <!-- Project and Company -->
            <div class="mb-4 grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-xs font-medium text-slate-500">
                  项目
                </label>
                <Select
                  v-model:value="selectedProject"
                  class="!w-full rounded-lg border border-slate-200 !text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="请选择"
                >
                  <Select.Option value="project1">项目A</Select.Option>
                  <Select.Option value="project2">项目B</Select.Option>
                  <Select.Option value="project3">项目C</Select.Option>
                </Select>
              </div>
              <div>
                <label class="mb-2 block text-xs font-medium text-slate-500">
                  公司
                </label>
                <Select
                  v-model:value="selectedCompany"
                  class="!w-full rounded-lg border border-slate-200 !text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="请选择"
                >
                  <Select.Option value="COM-001">
                    COM-001_济南企财通软件有限公司
                  </Select.Option>
                  <Select.Option value="COM-002">
                    COM-002_上海科技有限公司
                  </Select.Option>
                </Select>
              </div>
            </div>

            <!-- Corporate Payment Fields - Supplier and Contract Number -->
            <div
              v-if="selectedDocumentType === 'corporate'"
              class="mb-3 grid grid-cols-2 gap-4"
            >
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-600">
                  供应商
                </label>
                <Input
                  v-model:value="supplier"
                  class="!text-sm"
                  placeholder="请输入供应商"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-600">
                  合同号
                </label>
                <Input
                  v-model:value="contractNumber"
                  class="!text-sm"
                  placeholder="请输入合同号"
                />
              </div>
            </div>

            <!-- Payment Method -->
            <div class="mb-3">
              <label class="mb-1.5 block text-xs font-medium text-slate-600">
                付款方式
              </label>
              <Select
                v-model:value="selectedPaymentMethod"
                class="!text-sm"
                placeholder="请选择"
              >
                <Select.Option value="bank">银行转账</Select.Option>
                <Select.Option value="cash">现金</Select.Option>
                <Select.Option value="alipay">支付宝</Select.Option>
                <Select.Option value="wechat">微信支付</Select.Option>
              </Select>
            </div>

            <!-- Remark -->
            <div class="mb-4">
              <label class="mb-1.5 block text-xs font-medium text-slate-600">
                备注
              </label>
              <Textarea
                v-model:value="remark"
                :rows="3"
                class="!text-sm"
                placeholder="备注"
              />
            </div>

            <!-- Related Document -->
            <div class="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div class="mb-3 flex items-center gap-2">
                <Icon icon="lucide:link" class="size-4 text-blue-600" />
                <h5 class="text-sm font-semibold text-slate-700">关联单据</h5>
              </div>
              <div class="flex items-center gap-3">
                <Tag class="!bg-blue-100 !font-medium !text-blue-700">
                  差旅申请单
                </Tag>
                <div class="relative flex-1">
                  <Input
                    v-model:value="relatedDocument"
                    class="!text-sm"
                    placeholder="请选择或输入单据编号"
                  />
                  <Button
                    type="text"
                    class="absolute right-1 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-700"
                    @click="handleSelectDocument"
                  >
                    <Icon icon="lucide:search" class="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Invoice Modal -->
          <Modal
            v-model:open="addInvoiceModalVisible"
            title="关联我的发票"
            :footer="null"
            centered
            :width="900"
          >
            <!-- Filter Section -->
            <div
              class="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div class="grid grid-cols-6 gap-3 text-sm">
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    是否使用
                  </label>
                  <Select
                    v-model:value="filterUsed"
                    class="!w-full !text-sm"
                    placeholder="全部"
                  >
                    <Select.Option value="">全部</Select.Option>
                    <Select.Option value="used">已使用</Select.Option>
                    <Select.Option value="unused">未使用</Select.Option>
                  </Select>
                </div>
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    分享给我
                  </label>
                  <Select
                    v-model:value="filterShared"
                    class="!w-full !text-sm"
                    placeholder="全部"
                  >
                    <Select.Option value="">全部</Select.Option>
                    <Select.Option value="yes">是</Select.Option>
                    <Select.Option value="no">否</Select.Option>
                  </Select>
                </div>
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    发票号码
                  </label>
                  <Input
                    v-model:value="filterInvoiceNumber"
                    class="!text-sm"
                    placeholder="请输入发票号码"
                  />
                </div>
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    购方关键字
                  </label>
                  <Input
                    v-model:value="filterBuyer"
                    class="!text-sm"
                    placeholder="请输入购方关键字"
                  />
                </div>
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    销方关键字
                  </label>
                  <Input
                    v-model:value="filterSeller"
                    class="!text-sm"
                    placeholder="请输入销方关键字"
                  />
                </div>
                <div>
                  <label
                    class="mb-1.5 block text-xs font-medium text-slate-600"
                  >
                    标签
                  </label>
                  <Input
                    v-model:value="filterTag"
                    class="!text-sm"
                    placeholder="请输入标签"
                  />
                </div>
              </div>
              <div class="mt-3 flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <label class="text-xs font-medium text-slate-600">
                    上传日期：
                  </label>
                  <Input
                    v-model:value="filterDateStart"
                    type="date"
                    class="!w-32 !text-sm"
                  />
                  <span class="text-slate-400">-</span>
                  <Input
                    v-model:value="filterDateEnd"
                    type="date"
                    class="!w-32 !text-sm"
                  />
                </div>
                <Button
                  type="primary"
                  size="small"
                  class="ml-auto"
                  @click="resetFilters"
                >
                  重置
                </Button>
                <Button type="primary" size="small" @click="searchInvoices">
                  搜索
                </Button>
                <Button type="text" size="small" class="text-blue-600">
                  同步最新票
                </Button>
              </div>
            </div>

            <!-- Invoice List -->
            <div class="overflow-x-auto">
              <Table
                :columns="poolInvoiceColumns"
                :data-source="poolInvoices"
                :pagination="false"
                :scroll="{ x: 'max-content' }"
                :row-selection="{
                  type: 'checkbox',
                  selectedRowKeys: selectedInvoiceKeys,
                  onChange: handleInvoiceSelect,
                }"
                size="small"
                class="modern-table"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'image'">
                    <img
                      :src="record.image"
                      alt="发票影像"
                      class="h-12 w-12 rounded object-cover"
                    />
                  </template>
                  <template v-if="column.key === 'amount'">
                    <span class="font-bold text-red-600">
                      {{ record.amount }}
                    </span>
                  </template>
                  <template v-if="column.key === 'status'">
                    <Tag
                      :color="
                        record.status === '已查验真实'
                          ? 'green'
                          : record.status === '1次查验真实'
                            ? 'blue'
                            : 'amber'
                      "
                      class="!m-0 text-[10px]"
                    >
                      {{ record.status }}
                    </Tag>
                  </template>
                </template>
              </Table>
            </div>

            <!-- Action Buttons -->
            <div
              class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4"
            >
              <Button
                @click="
                  addInvoiceModalVisible = false;
                  selectedInvoiceKeys = [];
                "
              >
                取消
              </Button>
              <Button
                type="primary"
                @click="confirmSelectInvoices"
                :disabled="selectedInvoiceKeys.length === 0"
              >
                确定 ({{ selectedInvoiceKeys.length }})
              </Button>
            </div>
          </Modal>

          <!-- Invoice List View -->
          <div v-if="currentView === 'invoice'">
            <!-- Invoice List Header -->
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white"
                >
                  2
                </div>
                <h4 class="m-0 text-base font-bold text-slate-800">发票列表</h4>
              </div>
              <Button
                type="primary"
                ghost
                class="flex items-center gap-1.5 border-blue-200 shadow-sm"
                @click="handleAddItem"
              >
                <Icon icon="lucide:plus" class="size-4" />
                添加发票
              </Button>
            </div>

            <!-- Invoice List -->
            <div class="flex-1 overflow-y-auto">
              <Table
                :columns="invoiceColumns"
                :data-source="mockInvoices"
                :pagination="false"
                size="middle"
                class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'type'">
                    <Tag
                      :color="record.type.includes('专用') ? 'blue' : 'green'"
                      class="!m-0 text-[11px]"
                    >
                      {{ record.type }}
                    </Tag>
                  </template>
                  <template v-if="column.key === 'code'">
                    <span
                      class="font-mono text-xs tracking-wider text-slate-600"
                    >
                      {{ record.code }}
                    </span>
                  </template>
                  <template v-if="column.key === 'amount'">
                    <span class="font-bold text-red-600">
                      {{ record.amount }}
                    </span>
                  </template>
                  <template v-if="column.key === 'date'">
                    <span class="text-xs text-slate-600">
                      {{ record.date }}
                    </span>
                  </template>
                  <template v-if="column.key === 'seller'">
                    <span
                      class="line-clamp-1 text-xs text-slate-600"
                      :title="record.seller"
                    >
                      {{ record.seller }}
                    </span>
                  </template>
                  <template v-if="column.key === 'action'">
                    <Button
                      type="text"
                      danger
                      size="small"
                      @click="removeItem(record.key)"
                    >
                      <Icon icon="lucide:trash-2" class="size-4" />
                    </Button>
                  </template>
                </template>
              </Table>
            </div>

            <!-- Action Button -->
            <div class="flex justify-end border-t border-slate-100 pt-4">
              <Button
                type="primary"
                size="large"
                class="flex h-12 w-[200px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold shadow-lg shadow-blue-500/30"
                @click="handleGenerate"
              >
                <Icon
                  :icon="
                    hasGenerated ? 'lucide:arrow-right' : 'lucide:file-text'
                  "
                  class="size-5"
                />
                {{ hasGenerated ? '下一步' : '创建报销单' }}
              </Button>
            </div>
          </div>

          <!-- Expense Detail View -->
          <div v-else>
            <!-- Expense Detail Header -->
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white"
                >
                  3
                </div>
                <h4 class="m-0 text-base font-bold text-slate-800">费用明细</h4>
              </div>
              <Button
                type="text"
                class="text-blue-600 hover:text-blue-700"
                @click="currentView = 'invoice'"
              >
                返回修改
              </Button>
            </div>

            <!-- Total Amount -->
            <div
              class="mb-4 rounded-xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Icon icon="lucide:wallet" class="size-4 text-blue-600" />
                  <label class="text-sm font-bold text-slate-700">总金额</label>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-slate-500">￥</span>
                  <span
                    class="!w-36 text-center text-sm font-bold text-red-600"
                  >
                    {{ totalAmount }}
                  </span>
                  <span class="text-sm text-slate-500">元</span>
                </div>
              </div>
            </div>

            <!-- Expense Items List -->
            <div class="flex-1 space-y-3 overflow-y-auto">
              <div
                v-for="(item, index) in expenseItems"
                :key="item.id"
                class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <!-- Item Header -->
                <div class="mb-3 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-medium text-slate-500">
                      费用项 {{ index + 1 }}
                    </span>
                    <Tag
                      :color="
                        item.invoiceType.includes('专用') ? 'blue' : 'green'
                      "
                      class="!m-0 text-[10px]"
                    >
                      {{ item.invoiceType }}
                    </Tag>
                    <Button
                      type="link"
                      size="small"
                      class="!h-auto !p-0 text-xs text-blue-600 hover:text-blue-700"
                      @click="handleViewInvoiceImage(item)"
                    >
                      <Icon icon="lucide:eye" class="mr-1 size-3" />
                      查看发票影像
                    </Button>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="text-xs font-medium text-slate-600">
                      费用科目
                    </label>
                    <Select
                      :value="item.expenseCategory"
                      class="!w-36 !text-sm"
                      @change="
                        (val: string) => {
                          item.expenseCategory = val;
                        }
                      "
                    >
                      <Select.Option
                        v-for="sub in travelSubcategories"
                        :key="sub"
                        :value="sub"
                      >
                        {{ sub }}
                      </Select.Option>
                    </Select>
                  </div>
                </div>

                <!-- Invoice Info -->
                <div class="mb-3 rounded-lg bg-slate-50 p-3">
                  <div class="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span class="text-slate-400">发票代码：</span>
                      <span class="font-mono text-slate-700">
                        {{ item.invoiceCode }}
                      </span>
                    </div>
                    <div>
                      <span class="text-slate-400">发票号码：</span>
                      <span class="font-mono text-slate-700">
                        {{ item.invoiceNumber }}
                      </span>
                    </div>
                    <div>
                      <span class="text-slate-400">开票日期：</span>
                      <span class="text-slate-700">{{ item.invoiceDate }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400">销方：</span>
                      <span class="text-slate-700">{{ item.seller }}</span>
                    </div>
                    <div>
                      <span class="text-slate-400">金额(不含税)：</span>
                      <span class="font-bold text-red-600">
                        {{ item.expenseAmount }}
                      </span>
                    </div>
                    <div>
                      <span class="text-slate-400">增值税额：</span>
                      <span class="font-bold text-blue-600">
                        {{ item.taxAmount }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Hotel Fields - show when category is '住宿费' -->
                <div
                  v-if="item.expenseCategory === '住宿费'"
                  class="mb-3 rounded-lg bg-amber-50 p-3"
                >
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        入住日期
                      </label>
                      <Input
                        :value="item.checkInDate"
                        type="date"
                        class="!text-sm"
                        @input="
                          (e: Event) => {
                            item.checkInDate = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        离店日期
                      </label>
                      <Input
                        :value="item.checkOutDate"
                        type="date"
                        class="!text-sm"
                        @input="
                          (e: Event) => {
                            item.checkOutDate = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        城市
                      </label>
                      <Input
                        :value="item.city"
                        class="!text-sm"
                        placeholder="城市"
                        @input="
                          (e: Event) => {
                            item.city = (e.target as HTMLInputElement).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        人数
                      </label>
                      <Input
                        :value="item.guests"
                        type="number"
                        class="!text-sm"
                        placeholder="人数"
                        @input="
                          (e: Event) => {
                            item.guests = (e.target as HTMLInputElement).value;
                          }
                        "
                      />
                    </div>
                  </div>
                  <div class="mt-3">
                    <label
                      class="mb-1.5 block text-xs font-medium text-slate-600"
                    >
                      晚数
                    </label>
                    <Input
                      :value="item.nights"
                      type="number"
                      class="!text-sm"
                      placeholder="晚数"
                      @input="
                        (e: Event) => {
                          item.nights = (e.target as HTMLInputElement).value;
                        }
                      "
                    />
                  </div>
                </div>

                <!-- Accommodation Allowance Fields - show when category is '住宿补助' -->
                <div
                  v-if="item.expenseCategory === '住宿补助'"
                  class="mb-3 rounded-lg bg-emerald-50 p-3"
                >
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        出差城市
                      </label>
                      <Input
                        :value="item.city"
                        class="!text-sm"
                        placeholder="出差城市"
                        @input="
                          (e: Event) => {
                            item.city = (e.target as HTMLInputElement).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        开始日期
                      </label>
                      <Input
                        :value="item.startDate"
                        type="date"
                        class="!text-sm"
                        @input="
                          (e: Event) => {
                            item.startDate = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        结束日期
                      </label>
                      <Input
                        :value="item.endDate"
                        type="date"
                        class="!text-sm"
                        @input="
                          (e: Event) => {
                            item.endDate = (e.target as HTMLInputElement).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        天数
                      </label>
                      <Input
                        :value="item.days"
                        type="number"
                        class="!text-sm"
                        placeholder="天数"
                        @input="
                          (e: Event) => {
                            item.days = (e.target as HTMLInputElement).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        同房间人数
                      </label>
                      <Input
                        :value="item.roomMates"
                        type="number"
                        class="!text-sm"
                        placeholder="同房间人数"
                        @input="
                          (e: Event) => {
                            item.roomMates = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        同住人姓名
                      </label>
                      <Input
                        :value="item.roomMateNames"
                        class="!text-sm"
                        placeholder="同住人姓名"
                        @input="
                          (e: Event) => {
                            item.roomMateNames = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        "
                      />
                    </div>
                  </div>
                </div>

                <!-- Total Amount, Budget and Remark -->
                <div class="mb-3 rounded-lg bg-blue-50/50 p-3">
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        总金额
                      </label>
                      <Input
                        :value="item.totalAmount"
                        class="!text-sm"
                        @input="
                          (e: Event) => {
                            item.totalAmount = (
                              e.target as HTMLInputElement
                            ).value;
                          }
                        "
                      />
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        预算
                      </label>
                      <Select
                        :value="item.budget"
                        class="!w-full !text-sm"
                        @change="
                          (val: string) => {
                            item.budget = val;
                          }
                        "
                      >
                        <Select.Option
                          v-for="cat in budgetCategories"
                          :key="cat.value"
                          :value="cat.label"
                        >
                          {{ cat.label }}
                        </Select.Option>
                      </Select>
                    </div>
                    <div>
                      <label
                        class="mb-1.5 block text-xs font-medium text-slate-600"
                      >
                        备注
                      </label>
                      <Input
                        :value="item.remark"
                        class="!text-sm"
                        placeholder="备注"
                        @input="
                          (e: Event) => {
                            item.remark = (e.target as HTMLInputElement).value;
                          }
                        "
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer - Only show on expense detail page -->
          <div
            v-if="currentView === 'expense'"
            class="border-t border-slate-200 bg-white px-6 py-3"
          >
            <div class="flex items-center justify-end gap-3">
              <!-- 返回修改按钮 -->
              <Button
                size="large"
                class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold"
                @click="currentView = 'invoice'"
              >
                <Icon icon="lucide:arrow-left" class="size-5" />
                返回修改
              </Button>

              <!-- 去AP继续编辑按钮 -->
              <Button
                size="large"
                class="flex h-12 w-[200px] items-center justify-center gap-2 rounded-xl border-green-500 bg-green-500 text-[15px] font-bold text-white shadow-lg shadow-green-500/30 hover:bg-green-600"
                @click="handleSubmitReimbursement"
              >
                <Icon icon="lucide:check-circle" class="size-5" />
                去AP继续编辑
              </Button>

              <!-- 提交单据按钮 -->
              <Button
                type="primary"
                size="large"
                class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold shadow-lg shadow-green-500/30"
                @click="handleSubmitDocument"
              >
                <Icon icon="lucide:send" class="size-5" />
                提交单据
              </Button>
            </div>
          </div>
        </div>

        <!-- Invoice Agent Drawer - agt_7 -->
        <div
          v-else-if="currentId === 'agt_7'"
          class="flex flex-col gap-4 pl-2"
          style="height: calc(100vh - 200px)"
        >
          <!-- Section 1: 单据信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
              >
                1
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">单据信息</h4>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  单据类型
                </label>
                <div class="font-medium text-slate-800">差旅报销单</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  合计金额
                </label>
                <div class="font-bold text-green-600">¥3,708.00</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  公司
                </label>
                <div class="text-slate-800">上海家化销售有限公司</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  预算类别
                </label>
                <div class="text-slate-800">项目预算</div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  项目
                </label>
                <div class="text-slate-800">华东区客户拓展项目</div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  事项描述
                </label>
                <div class="text-slate-800">
                  7月份上海出差拜访重点客户，推进新品铺货事宜
                </div>
              </div>
              <div class="col-span-2 border-t border-slate-100 pt-3">
                <label class="mb-2 block text-xs font-medium text-slate-500">
                  差旅申请单
                </label>
                <div class="space-y-2">
                  <div
                    class="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                  >
                    <Icon
                      icon="lucide:file-text"
                      class="size-4 text-blue-600"
                    />
                    <span class="text-xs text-slate-700">
                      CLS20260720001 上海出差客户拜访
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                  >
                    <Icon
                      icon="lucide:file-text"
                      class="size-4 text-blue-600"
                    />
                    <span class="text-xs text-slate-700">
                      CLS20260718002 上海新品铺货推进
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: 行程信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
              >
                2
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">行程信息</h4>
              <Tag class="!ml-auto !bg-blue-100 !font-medium !text-blue-700">
                共8段行程
              </Tag>
            </div>
            <Table
              :columns="[
                { title: '序号', dataIndex: 'seq', key: 'seq', width: 40 },
                {
                  title: '出发日期',
                  dataIndex: 'startDate',
                  key: 'startDate',
                  width: 90,
                },
                {
                  title: '结束日期',
                  dataIndex: 'endDate',
                  key: 'endDate',
                  width: 90,
                },
                { title: '出发城市', dataIndex: 'from', key: 'from' },
                { title: '目的城市', dataIndex: 'to', key: 'to' },
                {
                  title: '交通方式',
                  dataIndex: 'transport',
                  key: 'transport',
                  width: 70,
                },
                {
                  title: '同住人',
                  dataIndex: 'companion',
                  key: 'companion',
                  width: 50,
                },
                { title: '备注', dataIndex: 'remark', key: 'remark' },
                {
                  title: '数据来源',
                  dataIndex: 'source',
                  key: 'source',
                  width: 80,
                },
              ]"
              :data-source="[
                {
                  key: '1',
                  seq: '1',
                  startDate: '2026-07-20',
                  endDate: '2026-07-22',
                  from: '上海',
                  to: '静安区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '2',
                  seq: '2',
                  startDate: '2026-07-20',
                  endDate: '2026-07-20',
                  from: '上海',
                  to: '上海虹桥',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '3',
                  seq: '3',
                  startDate: '2026-07-20',
                  endDate: '2026-07-20',
                  from: '上海虹桥站',
                  to: '浦东新区酒店',
                  transport: '其它',
                  companion: '—',
                  remark: '导航截图识别',
                  source: '用户补填',
                },
                {
                  key: '4',
                  seq: '4',
                  startDate: '2026-07-20',
                  endDate: '2026-07-22',
                  from: '上海',
                  to: '浦东新区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '5',
                  seq: '5',
                  startDate: '2026-07-22',
                  endDate: '2026-07-22',
                  from: '浦东新区',
                  to: '徐汇区',
                  transport: '自驾',
                  companion: '—',
                  remark: '查看新品铺货',
                  source: '用户补填',
                },
                {
                  key: '6',
                  seq: '6',
                  startDate: '2026-07-23',
                  endDate: '2026-07-24',
                  from: '上海',
                  to: '徐汇区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '7',
                  seq: '7',
                  startDate: '2026-07-24',
                  endDate: '2026-07-24',
                  from: '上海',
                  to: '上海总部',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '8',
                  seq: '8',
                  startDate: '2026-07-25',
                  endDate: '2026-07-25',
                  from: '上海',
                  to: '上海总部',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
              ]"
              :pagination="false"
              size="small"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            />
          </div>

          <!-- Section 3: 费用明细 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
              >
                3
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">费用明细</h4>
            </div>
            <Table
              :columns="[
                { title: '科目', dataIndex: 'category', key: 'category' },
                {
                  title: '发票类型',
                  dataIndex: 'invoiceType',
                  key: 'invoiceType',
                },
                { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo' },
                { title: '发票金额', dataIndex: 'amount', key: 'amount' },
                { title: '报销金额', dataIndex: 'reimburse', key: 'reimburse' },
                { title: '详细信息', dataIndex: 'detail', key: 'detail' },
                { title: '附件', dataIndex: 'attachment', key: 'attachment' },
                { title: '关联行程', dataIndex: 'trip', key: 'trip' },
              ]"
              :data-source="[
                {
                  key: '1',
                  category: '火车票',
                  invoiceType: '火车票',
                  invoiceNo: '00483217',
                  amount: '¥286.00',
                  reimburse: '¥286.00',
                  detail: '出发城市：上海；目的城市：上海虹桥',
                  attachment: '—',
                  trip: '2026-07-20至2026-07-20 上海-火车-上海虹桥',
                },
                {
                  key: '2',
                  category: '火车票',
                  invoiceType: '火车票',
                  invoiceNo: '00483218',
                  amount: '¥286.00',
                  reimburse: '¥286.00',
                  detail: '出发城市：上海；目的城市：上海总部',
                  attachment: '—',
                  trip: '2026-07-24至2026-07-24 上海-火车-上海总部',
                },
                {
                  key: '3',
                  category: '市内交通费',
                  invoiceType: '电子普票',
                  invoiceNo: '66554433',
                  amount: '¥86.00',
                  reimburse: '¥86.00',
                  detail: '—',
                  attachment: '—',
                  trip: '2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店',
                },
                {
                  key: '4',
                  category: '其他',
                  invoiceType: '增值税普通发票',
                  invoiceNo: '99887766',
                  amount: '¥300.00',
                  reimburse: '¥300.00',
                  detail: '—',
                  attachment: '—',
                  trip: '2026-07-22至2026-07-22 浦东新区-自驾-徐汇区',
                },
                {
                  key: '5',
                  category: '国内住宿费',
                  invoiceType: '增值税专用发票',
                  invoiceNo: '87654321',
                  amount: '¥1,280.00',
                  reimburse: '¥1,000.00',
                  detail:
                    '人数：1人；入住日期：2026-07-20；离店日期：2026-07-22',
                  attachment: '如家精选酒店账单明细.jpg',
                  trip: '2026-07-20至2026-07-22 上海-其它-浦东新区',
                },
                {
                  key: '6',
                  category: '国内住宿费',
                  invoiceType: '增值税专用发票',
                  invoiceNo: '87654322',
                  amount: '¥1,350.00',
                  reimburse: '¥1,350.00',
                  detail:
                    '人数：1人；入住日期：2026-07-23；离店日期：2026-07-24',
                  attachment: '全季酒店住宿账单.jpg',
                  trip: '2026-07-23至2026-07-24 上海-其它-徐汇区',
                },
              ]"
              :pagination="false"
              size="small"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            />
            <div class="mt-3 rounded-lg bg-blue-50/50 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-600">差旅补贴</span>
                <span class="font-bold text-green-600">¥400.00</span>
              </div>
              <div
                class="mt-1 flex items-center justify-between text-xs text-slate-500"
              >
                <span>国内餐费（100元/天 × 4天）</span>
                <span>¥400.00</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3"
          >
            <Button
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold"
              @click="drawerVisible = false"
            >
              关闭
            </Button>
            <Button
              type="primary"
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold shadow-lg shadow-green-500/30"
            >
              <Icon icon="lucide:send" class="size-5" />
              提交单据
            </Button>
          </div>
        </div>

        <!-- Smart Filling v3 Drawer - agt_9 -->
        <div
          v-else-if="currentId === 'agt_9'"
          class="flex flex-col gap-4 pl-2"
          style="height: calc(100vh - 200px)"
        >
          <!-- Section 1: 单据信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
              >
                1
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">单据信息</h4>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  单据类型
                </label>
                <div class="font-medium text-slate-800">差旅报销单</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  合计金额
                </label>
                <div class="font-bold text-green-600">¥3,708.00</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  公司
                </label>
                <div class="text-slate-800">上海家化销售有限公司</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  预算类别
                </label>
                <div class="text-slate-800">项目预算</div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  项目
                </label>
                <div class="text-slate-800">华东区客户拓展项目</div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  事项描述
                </label>
                <div class="text-slate-800">
                  7月份上海出差拜访重点客户，推进新品铺货事宜
                </div>
              </div>
              <div class="col-span-2 border-t border-slate-100 pt-3">
                <label class="mb-2 block text-xs font-medium text-slate-500">
                  差旅申请单
                </label>
                <div class="space-y-2">
                  <div
                    class="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                  >
                    <Icon
                      icon="lucide:file-text"
                      class="size-4 text-blue-600"
                    />
                    <span class="text-xs text-slate-700">
                      CLS20260720001 上海出差客户拜访
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                  >
                    <Icon
                      icon="lucide:file-text"
                      class="size-4 text-blue-600"
                    />
                    <span class="text-xs text-slate-700">
                      CLS20260718002 上海新品铺货推进
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: 行程信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
              >
                2
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">行程信息</h4>
              <Tag class="!ml-auto !bg-blue-100 !font-medium !text-blue-700">
                共8段行程
              </Tag>
            </div>
            <Table
              :columns="[
                { title: '序号', dataIndex: 'seq', key: 'seq', width: 40 },
                {
                  title: '出发日期',
                  dataIndex: 'startDate',
                  key: 'startDate',
                  width: 90,
                },
                {
                  title: '结束日期',
                  dataIndex: 'endDate',
                  key: 'endDate',
                  width: 90,
                },
                { title: '出发城市', dataIndex: 'from', key: 'from' },
                { title: '目的城市', dataIndex: 'to', key: 'to' },
                {
                  title: '交通方式',
                  dataIndex: 'transport',
                  key: 'transport',
                  width: 70,
                },
                {
                  title: '同住人',
                  dataIndex: 'companion',
                  key: 'companion',
                  width: 50,
                },
                { title: '备注', dataIndex: 'remark', key: 'remark' },
                {
                  title: '数据来源',
                  dataIndex: 'source',
                  key: 'source',
                  width: 80,
                },
              ]"
              :data-source="[
                {
                  key: '1',
                  seq: '1',
                  startDate: '2026-07-20',
                  endDate: '2026-07-22',
                  from: '上海',
                  to: '静安区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '2',
                  seq: '2',
                  startDate: '2026-07-20',
                  endDate: '2026-07-20',
                  from: '上海',
                  to: '上海虹桥',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '3',
                  seq: '3',
                  startDate: '2026-07-20',
                  endDate: '2026-07-20',
                  from: '上海虹桥站',
                  to: '浦东新区酒店',
                  transport: '其它',
                  companion: '—',
                  remark: '导航截图识别',
                  source: '用户补填',
                },
                {
                  key: '4',
                  seq: '4',
                  startDate: '2026-07-20',
                  endDate: '2026-07-22',
                  from: '上海',
                  to: '浦东新区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '5',
                  seq: '5',
                  startDate: '2026-07-22',
                  endDate: '2026-07-22',
                  from: '浦东新区',
                  to: '徐汇区',
                  transport: '自驾',
                  companion: '—',
                  remark: '查看新品铺货',
                  source: '用户补填',
                },
                {
                  key: '6',
                  seq: '6',
                  startDate: '2026-07-23',
                  endDate: '2026-07-24',
                  from: '上海',
                  to: '徐汇区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '7',
                  seq: '7',
                  startDate: '2026-07-24',
                  endDate: '2026-07-24',
                  from: '上海',
                  to: '上海总部',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '8',
                  seq: '8',
                  startDate: '2026-07-25',
                  endDate: '2026-07-25',
                  from: '上海',
                  to: '上海总部',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
              ]"
              :pagination="false"
              size="small"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            />
          </div>

          <!-- Section 3: 费用明细 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-xs font-bold text-white shadow-sm"
              >
                3
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">费用明细</h4>
            </div>
            <Table
              :columns="[
                { title: '科目', dataIndex: 'category', key: 'category' },
                {
                  title: '发票类型',
                  dataIndex: 'invoiceType',
                  key: 'invoiceType',
                },
                { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo' },
                { title: '发票金额', dataIndex: 'amount', key: 'amount' },
                { title: '报销金额', dataIndex: 'reimburse', key: 'reimburse' },
                { title: '详细信息', dataIndex: 'detail', key: 'detail' },
                { title: '附件', dataIndex: 'attachment', key: 'attachment' },
                { title: '关联行程', dataIndex: 'trip', key: 'trip' },
              ]"
              :data-source="[
                {
                  key: '1',
                  category: '火车票',
                  invoiceType: '火车票',
                  invoiceNo: '00483217',
                  amount: '¥286.00',
                  reimburse: '¥286.00',
                  detail: '出发城市：上海；目的城市：上海虹桥',
                  attachment: '—',
                  trip: '2026-07-20至2026-07-20 上海-火车-上海虹桥',
                },
                {
                  key: '2',
                  category: '火车票',
                  invoiceType: '火车票',
                  invoiceNo: '00483218',
                  amount: '¥286.00',
                  reimburse: '¥286.00',
                  detail: '出发城市：上海；目的城市：上海总部',
                  attachment: '—',
                  trip: '2026-07-24至2026-07-24 上海-火车-上海总部',
                },
                {
                  key: '3',
                  category: '市内交通费',
                  invoiceType: '电子普票',
                  invoiceNo: '66554433',
                  amount: '¥86.00',
                  reimburse: '¥86.00',
                  detail: '—',
                  attachment: '—',
                  trip: '2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店',
                },
                {
                  key: '4',
                  category: '其他',
                  invoiceType: '增值税普通发票',
                  invoiceNo: '99887766',
                  amount: '¥300.00',
                  reimburse: '¥300.00',
                  detail: '—',
                  attachment: '—',
                  trip: '2026-07-22至2026-07-22 浦东新区-自驾-徐汇区',
                },
                {
                  key: '5',
                  category: '国内住宿费',
                  invoiceType: '增值税专用发票',
                  invoiceNo: '87654321',
                  amount: '¥1,280.00',
                  reimburse: '¥1,000.00',
                  detail:
                    '人数：1人；入住日期：2026-07-20；离店日期：2026-07-22',
                  attachment: '如家精选酒店账单明细.jpg',
                  trip: '2026-07-20至2026-07-22 上海-其它-浦东新区',
                },
                {
                  key: '6',
                  category: '国内住宿费',
                  invoiceType: '增值税专用发票',
                  invoiceNo: '87654322',
                  amount: '¥1,350.00',
                  reimburse: '¥1,350.00',
                  detail:
                    '人数：1人；入住日期：2026-07-23；离店日期：2026-07-24',
                  attachment: '全季酒店住宿账单.jpg',
                  trip: '2026-07-23至2026-07-24 上海-其它-徐汇区',
                },
              ]"
              :pagination="false"
              size="small"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            />
            <div class="mt-3 rounded-lg bg-blue-50/50 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-600">差旅补贴</span>
                <span class="font-bold text-green-600">¥400.00</span>
              </div>
              <div
                class="mt-1 flex items-center justify-between text-xs text-slate-500"
              >
                <span>国内餐费（100元/天 × 4天）</span>
                <span>¥400.00</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3"
          >
            <Button
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold"
              @click="drawerVisible = false"
            >
              关闭
            </Button>
            <Button
              type="primary"
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold shadow-lg shadow-green-500/30"
            >
              <Icon icon="lucide:send" class="size-5" />
              提交单据
            </Button>
          </div>
        </div>

        <!-- Smart Filling v2 Drawer - agt_8 -->
        <div
          v-else-if="currentId === 'agt_8'"
          class="flex flex-col gap-4 pl-2"
          style="height: calc(100vh - 200px)"
        >
          <!-- Section 1: 单据信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-bold text-white shadow-sm"
              >
                1
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">单据信息</h4>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  单据类型
                </label>
                <div class="font-medium text-slate-800">差旅报销单</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  合计金额
                </label>
                <div class="font-bold text-green-600">¥3,708.00</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  公司
                </label>
                <div class="text-slate-800">上海家化销售有限公司</div>
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  预算类别
                </label>
                <div class="text-slate-800">项目预算</div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  项目
                </label>
                <div class="text-slate-800">华东区客户拓展项目</div>
              </div>
              <div class="col-span-2">
                <label class="mb-1 block text-xs font-medium text-slate-500">
                  事项描述
                </label>
                <div class="text-slate-800">
                  7月份上海出差拜访重点客户，推进新品铺货事宜
                </div>
              </div>
              <div class="col-span-2 border-t border-slate-100 pt-3">
                <label class="mb-2 block text-xs font-medium text-slate-500">
                  差旅申请单
                </label>
                <div class="space-y-2">
                  <div
                    class="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                  >
                    <Icon
                      icon="lucide:file-text"
                      class="size-4 text-teal-600"
                    />
                    <span class="text-xs text-slate-700">
                      CLS20260720001 上海出差客户拜访
                    </span>
                  </div>
                  <div
                    class="flex items-center gap-2 rounded-lg bg-slate-50 p-2"
                  >
                    <Icon
                      icon="lucide:file-text"
                      class="size-4 text-teal-600"
                    />
                    <span class="text-xs text-slate-700">
                      CLS20260718002 上海新品铺货推进
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: 行程信息 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-bold text-white shadow-sm"
              >
                2
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">行程信息</h4>
              <Tag class="!ml-auto !bg-teal-100 !font-medium !text-teal-700">
                共6段行程
              </Tag>
            </div>
            <Table
              :columns="[
                { title: '序号', dataIndex: 'seq', key: 'seq', width: 40 },
                {
                  title: '出发日期',
                  dataIndex: 'startDate',
                  key: 'startDate',
                  width: 90,
                },
                {
                  title: '结束日期',
                  dataIndex: 'endDate',
                  key: 'endDate',
                  width: 90,
                },
                { title: '出发城市', dataIndex: 'from', key: 'from' },
                { title: '目的城市', dataIndex: 'to', key: 'to' },
                {
                  title: '交通方式',
                  dataIndex: 'transport',
                  key: 'transport',
                  width: 70,
                },
                {
                  title: '同住人',
                  dataIndex: 'companion',
                  key: 'companion',
                  width: 50,
                },
                { title: '备注', dataIndex: 'remark', key: 'remark' },
                {
                  title: '数据来源',
                  dataIndex: 'source',
                  key: 'source',
                  width: 80,
                },
              ]"
              :data-source="[
                {
                  key: '1',
                  seq: '1',
                  startDate: '2026-07-20',
                  endDate: '2026-07-22',
                  from: '上海',
                  to: '静安区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '2',
                  seq: '2',
                  startDate: '2026-07-20',
                  endDate: '2026-07-20',
                  from: '上海',
                  to: '上海虹桥',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '3',
                  seq: '3',
                  startDate: '2026-07-20',
                  endDate: '2026-07-22',
                  from: '上海',
                  to: '浦东新区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '4',
                  seq: '4',
                  startDate: '2026-07-23',
                  endDate: '2026-07-24',
                  from: '上海',
                  to: '徐汇区',
                  transport: '其它',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '5',
                  seq: '5',
                  startDate: '2026-07-24',
                  endDate: '2026-07-24',
                  from: '上海',
                  to: '上海总部',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
                {
                  key: '6',
                  seq: '6',
                  startDate: '2026-07-25',
                  endDate: '2026-07-25',
                  from: '上海',
                  to: '上海总部',
                  transport: '火车',
                  companion: '—',
                  remark: '—',
                  source: '差旅申请单明细',
                },
              ]"
              :pagination="false"
              size="small"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            />
          </div>

          <!-- Section 3: 费用明细 -->
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-bold text-white shadow-sm"
              >
                3
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">费用明细</h4>
            </div>
            <Table
              :columns="[
                { title: '科目', dataIndex: 'category', key: 'category' },
                {
                  title: '发票类型',
                  dataIndex: 'invoiceType',
                  key: 'invoiceType',
                },
                { title: '发票号码', dataIndex: 'invoiceNo', key: 'invoiceNo' },
                { title: '发票金额', dataIndex: 'amount', key: 'amount' },
                { title: '报销金额', dataIndex: 'reimburse', key: 'reimburse' },
                { title: '详细信息', dataIndex: 'detail', key: 'detail' },
                { title: '附件', dataIndex: 'attachment', key: 'attachment' },
                { title: '关联行程', dataIndex: 'trip', key: 'trip' },
              ]"
              :data-source="[
                {
                  key: '1',
                  category: '火车票',
                  invoiceType: '火车票',
                  invoiceNo: '00483217',
                  amount: '¥286.00',
                  reimburse: '¥286.00',
                  detail: '出发城市：上海；目的城市：上海虹桥',
                  attachment: '—',
                  trip: '2026-07-20至2026-07-20 上海-火车-上海虹桥',
                },
                {
                  key: '2',
                  category: '火车票',
                  invoiceType: '火车票',
                  invoiceNo: '00483218',
                  amount: '¥286.00',
                  reimburse: '¥286.00',
                  detail: '出发城市：上海；目的城市：上海总部',
                  attachment: '—',
                  trip: '2026-07-24至2026-07-24 上海-火车-上海总部',
                },
                {
                  key: '3',
                  category: '市内交通费',
                  invoiceType: '电子普票',
                  invoiceNo: '66554433',
                  amount: '¥86.00',
                  reimburse: '¥86.00',
                  detail: '—',
                  attachment: '—',
                  trip: '2026-07-20至2026-07-20 上海虹桥站-其它-浦东新区酒店',
                },
                {
                  key: '4',
                  category: '其他',
                  invoiceType: '增值税普通发票',
                  invoiceNo: '99887766',
                  amount: '¥300.00',
                  reimburse: '¥300.00',
                  detail: '—',
                  attachment: '—',
                  trip: '2026-07-22至2026-07-22 浦东新区-自驾-徐汇区',
                },
                {
                  key: '5',
                  category: '国内住宿费',
                  invoiceType: '增值税专用发票',
                  invoiceNo: '87654321',
                  amount: '¥1,280.00',
                  reimburse: '¥1,000.00',
                  detail:
                    '人数：1人；入住日期：2026-07-20；离店日期：2026-07-22',
                  attachment: '如家精选酒店账单明细.jpg',
                  trip: '2026-07-20至2026-07-22 上海-其它-浦东新区',
                },
                {
                  key: '6',
                  category: '国内住宿费',
                  invoiceType: '增值税专用发票',
                  invoiceNo: '87654322',
                  amount: '¥1,350.00',
                  reimburse: '¥1,350.00',
                  detail:
                    '人数：1人；入住日期：2026-07-23；离店日期：2026-07-24',
                  attachment: '全季酒店住宿账单.jpg',
                  trip: '2026-07-23至2026-07-24 上海-其它-徐汇区',
                },
              ]"
              :pagination="false"
              size="small"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            />
            <div class="mt-3 rounded-lg bg-teal-50/50 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-600">差旅补贴</span>
                <span class="font-bold text-green-600">¥400.00</span>
              </div>
              <div
                class="mt-1 flex items-center justify-between text-xs text-slate-500"
              >
                <span>国内餐费（100元/天 × 4天）</span>
                <span>¥400.00</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-3"
          >
            <Button
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold"
              @click="drawerVisible = false"
            >
              关闭
            </Button>
            <Button
              type="primary"
              size="large"
              class="flex h-12 w-[140px] items-center justify-center gap-2 rounded-xl bg-teal-600 text-[15px] font-bold shadow-lg shadow-teal-500/30 hover:!bg-teal-700"
              @click="handleSubmitDocument"
            >
              <Icon icon="lucide:send" class="size-5" />
              提交单据
            </Button>
          </div>
        </div>

        <!-- Sales Agent Drawer -->
        <div v-else class="flex h-full flex-col pl-2">
          <!-- Step 1: Data Confirmation -->
          <div class="mb-6">
            <div class="mb-3 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white"
              >
                1
              </div>
              <h4 class="m-0 text-base font-bold text-slate-800">
                核对并补充单据明细 (包含最新主数据参数)
              </h4>
            </div>

            <Table
              :columns="drugColumns"
              :data-source="mockDrugs"
              :pagination="false"
              size="middle"
              class="modern-table overflow-hidden rounded-xl border border-slate-200 !bg-white text-sm shadow-sm"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'image'">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-slate-400"
                  >
                    <Icon icon="lucide:pill" />
                  </div>
                </template>
                <template v-if="column.key === 'name'">
                  <span class="text-[13px] font-bold text-slate-700">
                    {{ record.name }}
                  </span>
                </template>
                <template v-if="column.key === 'sku'">
                  <span class="font-mono text-xs tracking-wider text-slate-500">
                    {{ record.sku }}
                  </span>
                </template>
                <template v-if="column.key === 'spec'">
                  <Tag color="purple" class="!m-0 text-[11px]">
                    {{ record.spec }}
                  </Tag>
                </template>
                <template v-if="column.key === 'efficacy'">
                  <span
                    class="line-clamp-2 text-xs text-slate-600"
                    :title="record.efficacy"
                  >
                    {{ record.efficacy }}
                  </span>
                </template>
                <template v-if="column.key === 'price'">
                  <Input
                    size="small"
                    :value="record.price"
                    class="w-16 border-none bg-orange-50 !text-center !text-sm !font-bold !text-orange-600 focus:ring-orange-500"
                  />
                </template>
                <template v-if="column.key === 'category'">
                  <Tag color="cyan" class="!m-0 text-[11px]">
                    {{ record.category }}
                  </Tag>
                </template>
                <template v-if="column.key === 'action'">
                  <Button
                    type="text"
                    danger
                    size="small"
                    @click="removeItem(record.key)"
                  >
                    <Icon icon="lucide:trash-2" class="size-4" />
                  </Button>
                </template>
              </template>
            </Table>

            <!-- Quick Add section -->
            <div
              class="mt-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3"
            >
              <div class="flex w-[60%] items-center gap-3">
                <Icon icon="lucide:search" class="ml-2 text-blue-500" />
                <Input
                  v-model:value="customItemCode"
                  placeholder="输入产品编码或中文名首字母 (例：输入 80002 回车)..."
                  @press-enter="handleAddItem"
                  class="w-full border-none bg-transparent !text-sm font-medium shadow-none focus:!shadow-none"
                />
              </div>
              <div class="flex items-center gap-4">
                <span class="text-xs text-slate-400">
                  也可通过回车键快速补充
                </span>
                <Button
                  type="primary"
                  ghost
                  class="border-blue-200 shadow-sm"
                  @click="handleAddItem"
                >
                  添加至清单
                </Button>
              </div>
            </div>

            <div class="mt-4 text-right text-xs font-medium text-slate-500">
              当前清单共 {{ mockDrugs.length }} 项，满足生成基本条数。
            </div>
          </div>

          <!-- Step 2: Generation Options -->
          <div class="mb-8 flex-1">
            <div class="mb-3 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white"
              >
                2
              </div>
              <h4 class="m-0 text-base font-bold text-slate-800">
                选择生成格式
              </h4>
            </div>
            <div
              class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6"
            >
              <Checkbox.Group
                v-model:value="exportOptions"
                class="flex w-full flex-col gap-4"
              >
                <label
                  class="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20':
                      exportOptions.includes('excel'),
                  }"
                >
                  <Checkbox value="excel" />
                  <div class="ml-1 flex w-full items-center gap-4">
                    <Icon
                      icon="lucide:file-spreadsheet"
                      class="size-8 text-green-600"
                    />
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[15px] font-bold text-slate-800">
                        生成 Excel 格式报价单
                      </span>
                      <span class="text-[13px] text-slate-500">
                        包含完整的底价、指导价参数与阶梯优惠。
                      </span>
                    </div>
                  </div>
                </label>
                <label
                  class="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20':
                      exportOptions.includes('brochure'),
                  }"
                >
                  <Checkbox value="brochure" />
                  <div class="ml-1 flex items-center gap-4">
                    <Icon
                      icon="lucide:book-image"
                      class="size-8 text-orange-500"
                    />
                    <div class="flex flex-col gap-0.5">
                      <span class="text-[15px] font-bold text-slate-800">
                        生成 高清宣传册图文 (PDF)
                      </span>
                      <span class="text-[13px] text-slate-500">
                        自动排版药品图文介绍，用于直接发给客户。
                      </span>
                    </div>
                  </div>
                </label>
              </Checkbox.Group>
            </div>
          </div>

          <!-- Create Reimbursement Button -->
          <div class="flex justify-end border-t border-slate-100 pt-4">
            <Button
              type="primary"
              size="large"
              class="flex h-12 w-[300px] items-center justify-center gap-2 rounded-xl text-[15px] font-bold shadow-lg shadow-blue-500/30"
              @click="handleSubmitReimbursement"
            >
              <Icon icon="lucide:file-plus" class="size-5" />
              创建报销单据
            </Button>
          </div>
        </div>
      </Drawer>

      <!-- Expense Detail Drawer (agt_9) -->
      <Drawer
        v-model:open="v3ExpenseDrawerVisible"
        title="费用明细"
        placement="right"
        width="70%"
        :closable="true"
        :get-container="false"
        :style="{ position: 'absolute' }"
      >
        <div
          class="flex flex-col gap-4 pl-2"
          style="height: calc(100vh - 200px)"
        >
          <div
            class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-100/50"
          >
            <div class="mb-4 flex items-center gap-2">
              <div
                class="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-xs font-bold text-white shadow-sm"
              >
                5
              </div>
              <h4 class="m-0 text-base font-bold text-slate-900">
                费用明细编辑
              </h4>
              <Tag class="!ml-auto !bg-teal-100 !font-medium !text-teal-700">
                {{ v3ExpenseAnomalyCount }} 个异常待处理
              </Tag>
            </div>

            <div class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500">
                  <tr>
                    <th class="px-2 py-2">科目</th>
                    <th class="px-2 py-2">发票号码</th>
                    <th class="px-2 py-2">发票金额</th>
                    <th class="px-2 py-2">报销金额</th>
                    <th class="px-2 py-2">详细信息</th>
                    <th class="px-2 py-2">异常提示</th>
                    <th class="px-2 py-2">详细信息修改说明</th>
                    <th class="px-2 py-2">附件</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in v3ExpenseItems"
                    :key="index"
                    class="border-t border-slate-100"
                  >
                    <td class="px-2 py-1.5">{{ item.category }}</td>
                    <td
                      class="whitespace-nowrap px-2 py-1.5 font-mono text-slate-600"
                    >
                      {{ item.invoiceNo }}
                    </td>
                    <td
                      class="whitespace-nowrap px-2 py-1.5 font-bold text-red-600"
                    >
                      {{ item.invoiceAmount }}
                    </td>
                    <td class="px-2 py-1.5">
                      {{ item.reimbursementAmount }}
                    </td>
                    <td class="max-w-[120px] px-2 py-1.5">
                      <span class="text-slate-500">
                        {{ item.detail || '—' }}
                      </span>
                    </td>
                    <td class="px-2 py-1.5">
                      <span v-if="item.anomalyWarning" class="text-amber-600">
                        <Icon
                          icon="lucide:alert-triangle"
                          class="mr-0.5 inline size-3"
                        />
                        {{ item.anomalyWarning }}
                      </span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                    <td class="px-2 py-1.5">
                      <Input.TextArea
                        v-model:value="item.modifyDescription"
                        :rows="2"
                        size="small"
                        class="!text-xs"
                        placeholder="例：人数2"
                        style="width: 150px; resize: vertical"
                      />
                    </td>
                    <td class="px-2 py-1.5">
                      <div class="flex flex-col items-start gap-1">
                        <span
                          v-if="item.attachment && item.attachment !== '—'"
                          class="text-teal-600"
                        >
                          <Icon
                            icon="lucide:paperclip"
                            class="mr-0.5 inline size-3"
                          />
                          {{ item.attachment }}
                        </span>
                        <span v-else class="text-slate-400">—</span>
                        <input
                          :ref="
                            (el: any) =>
                              setV3FileInputRef(index, el as HTMLInputElement)
                          "
                          type="file"
                          class="hidden"
                          @change="(e: Event) => onV3FileSelected(e, index)"
                        />
                        <Button
                          type="link"
                          size="small"
                          class="!h-auto !p-0 !text-xs text-blue-600"
                          @click="handleV3Upload(index)"
                        >
                          <Icon icon="lucide:upload" class="size-3" />
                          上传附件
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 差旅补贴 -->
            <div class="mt-3 rounded-lg bg-teal-50/50 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-medium text-slate-600">
                  国内餐费（100元/天 × 4天）
                </span>
                <span class="font-bold text-green-600">¥400.00</span>
              </div>
              <div class="mt-2 flex items-start gap-2">
                <span class="mt-1 shrink-0 text-xs text-slate-400">
                  详细信息修改说明
                </span>
                <Input.TextArea
                  v-model:value="v3AllowanceModifyDesc"
                  :rows="2"
                  size="small"
                  class="!text-xs"
                  placeholder="例：天数改为3天"
                  style="width: 220px; resize: vertical"
                />
              </div>
            </div>

            <!-- 合计 -->
            <div class="mt-3 rounded-lg bg-blue-50/50 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="font-bold text-slate-700">
                  合计报销金额（含差旅补贴）
                </span>
                <span class="text-lg font-bold text-red-600">
                  {{ v3ExpenseTotal }}
                </span>
              </div>
            </div>

            <div class="mt-4 flex justify-end">
              <Button
                type="primary"
                class="flex items-center gap-1.5 rounded-lg bg-teal-600 px-6 text-sm font-bold hover:!bg-teal-700"
                @click="handleV3ExpenseModify"
              >
                <Icon icon="lucide:save" class="size-4" />
                修改
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      <!-- Generating Generation Modal -->
      <Modal
        v-model:open="generatingModalVisible"
        :closable="!generating"
        :footer="null"
        :width="400"
        centered
      >
        <div
          class="flex flex-col items-center justify-center p-8 text-center"
          v-if="generating"
        >
          <!-- Spinner -->
          <div class="relative mb-6 h-20 w-20">
            <div
              class="absolute inset-0 rounded-full border-4 border-slate-100"
            ></div>
            <div
              class="absolute inset-0 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
            ></div>
            <Icon
              icon="lucide:sparkles"
              class="absolute left-1/2 top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-blue-600"
            />
          </div>
          <h3 class="mb-1 text-lg font-bold text-slate-800">
            正在火速生成中...
          </h3>
          <p class="text-sm text-slate-500">
            正在按要求读取主数据、计算模板与排版页面，请稍候片刻
          </p>
        </div>

        <!-- Success Result -->
        <div
          class="flex flex-col items-center justify-center p-6 text-center"
          v-if="generateSuccess"
        >
          <div
            class="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"
          >
            <Icon icon="lucide:check" class="size-8" />
          </div>
          <h3 class="mb-2 text-xl font-bold text-slate-800">生成完毕！</h3>
          <p class="mb-8 text-sm text-slate-500">
            AI 选品报价员已通过主数据处理完成您的需求。
          </p>

          <div class="flex w-full flex-col gap-3 px-4">
            <a
              v-if="exportOptions.includes('excel')"
              href="#"
              class="group flex items-center justify-between rounded-xl border border-slate-200 p-3 text-slate-700 transition-all hover:border-green-400 hover:bg-green-50 hover:text-green-700"
            >
              <div class="flex items-center gap-3">
                <Icon
                  icon="lucide:file-spreadsheet"
                  class="size-5 text-green-600"
                />
                <span class="font-bold">医药定线客户内部报价单.xlsx</span>
              </div>
              <Icon
                icon="lucide:download"
                class="opacity-40 group-hover:opacity-100"
              />
            </a>
            <a
              v-if="exportOptions.includes('brochure')"
              href="#"
              class="group flex items-center justify-between rounded-xl border border-slate-200 p-3 text-slate-700 transition-all hover:border-orange-400 hover:bg-orange-50 hover:text-orange-700"
            >
              <div class="flex items-center gap-3">
                <Icon icon="lucide:file-text" class="size-5 text-orange-500" />
                <span class="font-bold">高清产品推介宣传册-春季版.pdf</span>
              </div>
              <Icon
                icon="lucide:download"
                class="opacity-40 group-hover:opacity-100"
              />
            </a>
          </div>
          <Button
            type="primary"
            size="large"
            class="mt-8 w-full !rounded-lg"
            @click="resetGenerateModal"
          >
            完成，返回会话
          </Button>
        </div>
      </Modal>
    </div>
  </div>
</template>

<style scoped>
/* Ensure drawer mounts inside the relative container nicely */
:deep(.ant-drawer) {
  position: absolute;
}

/* Chat table styles */
:deep(.chat-table) {
  width: 100%;
  margin: 8px 0;
  overflow: hidden;
  font-size: 13px;
  border-collapse: collapse;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

:deep(.chat-table th) {
  padding: 8px 12px;
  font-weight: 600;
  color: #1e40af;
  text-align: left;
  white-space: nowrap;
  background: #f0f5ff;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.chat-table td) {
  padding: 6px 12px;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.chat-table tr:last-child td) {
  border-bottom: none;
}

:deep(.chat-table tr:hover td) {
  background: #fafafa;
}
</style>
