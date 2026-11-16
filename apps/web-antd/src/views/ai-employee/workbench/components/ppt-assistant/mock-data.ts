export const pptBaseMenus = [
  { key: 'employee', label: '数字员工', icon: 'lucide:bot' },
  { key: 'scheme', label: '方案模板管理', icon: 'lucide:wand-sparkles' },
  { key: 'template', label: 'PPT模板管理', icon: 'lucide:panels-top-left' },
  { key: 'case', label: '案例库管理', icon: 'lucide:folder-kanban' },
  { key: 'knowledge', label: '知识库管理', icon: 'lucide:database' },
  { key: 'artifact', label: '任务产物', icon: 'lucide:archive' },
];

export const pptConversationList = [
  { id: 'new', title: '新对话', time: '刚刚' },
  { id: 'd7020', title: '创建长鑫 D7020 设备售前 PPT', time: '3小时' },
  { id: 'review', title: '生成项目复盘汇报 PPT', time: '4月' },
  { id: 'report', title: '帮我做一份工作汇报', time: '4月' },
  { id: 'case', title: '上传案例生成客户宣讲 PPT', time: '1月' },
  { id: 'product', title: '根据知识库生成产品介绍', time: '1月' },
  { id: 'investor', title: '制作投资人推介材料', time: '1月' },
  { id: 'channel', title: '生成渠道合作方案 PPT', time: '1月' },
];

export const pptOperationSteps = [
  '提出要求',
  '选择方案',
  '匹配资料',
  '生成文案',
  '选择风格',
  '生成PPT',
];

export const pptQuickSchemes = [
  {
    title: '设备售前客户宣讲',
    desc: '行业痛点、解决方案、产品优势、客户案例',
    icon: 'lucide:presentation',
  },
  {
    title: '工作汇报',
    desc: '工作成果、问题复盘、后续规划',
    icon: 'lucide:briefcase-business',
  },
  {
    title: '项目复盘',
    desc: '目标回顾、执行过程、问题总结、经验沉淀',
    icon: 'lucide:refresh-cw',
  },
  {
    title: '投资人推介',
    desc: '业务定位、市场空间、增长数据、融资计划',
    icon: 'lucide:trending-up',
  },
];

export const pptStyleTemplates = [
  {
    name: '蓝色科技风',
    desc: '适合设备售前、技术方案、产品介绍',
    color: 'from-blue-600 to-cyan-500',
  },
  {
    name: '极简商务风',
    desc: '适合工作汇报、管理层汇报',
    color: 'from-slate-700 to-slate-500',
  },
  {
    name: '深色发布会风',
    desc: '适合产品发布、战略宣讲',
    color: 'from-zinc-950 to-indigo-800',
  },
  {
    name: '白底咨询风',
    desc: '适合咨询报告、项目复盘',
    color: 'from-stone-100 to-emerald-100',
  },
];
