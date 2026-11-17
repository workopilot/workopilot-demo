export const scenarios = [
  {
    id: 'report',
    label: '知记 · 汇报与审阅',
    app: '知记应用',
    settings: ['周报 / 月报方案', '报告模板', '审批规则与权限'],
    record: '同一份周报 / 月报',
    action: '草稿 → 待审批 → 已通过 / 退回修改',
    handoff: '提交报告 → 审阅审批 → 反馈同步',
    employees: [
      {
        name: '汇报助理',
        audience: '员工',
        role: '整理工作，生成周报与月报',
        prompt: '汇总本月工作，生成月报草稿',
        menus: ['我的报告', '工作记录'],
        tone: 'blue',
        icon: 'lucide:file-pen-line',
      },
      {
        name: '审阅助理',
        audience: '主管 / 审批人',
        role: '审阅周报与月报，给出审批意见',
        prompt: '查看本周待我审批的报告',
        menus: ['待我审批', '已审阅报告'],
        tone: 'coral',
        icon: 'lucide:clipboard-check',
      },
    ],
  },
  {
    id: 'meeting',
    label: '会议 · 预约协同',
    app: '会议应用',
    settings: ['会议室资源', '预约规则', '纪要模板'],
    record: '会议预约与纪要',
    action: '待开始 → 已结束 / 已取消',
    handoff: '对话发起 ↔ 业务菜单持续处理',
    employees: [
      {
        name: '会议助理',
        audience: '员工',
        role: '预约会议并跟进会议成果',
        prompt: '帮我预约明天下午的项目评审会',
        menus: ['我的会议', '会议纪要'],
        tone: 'blue',
        icon: 'lucide:calendar-days',
      },
    ],
  },
  {
    id: 'ticket',
    label: '工单 · 运维处理',
    app: '工单应用',
    settings: ['工单分类', '派单规则', '服务时限'],
    record: '工单与处理记录',
    action: '待派单 → 处理中 → 已完成',
    handoff: '对话建单 ↔ 业务菜单跟进处理',
    employees: [
      {
        name: '工单助理',
        audience: '一线工程师',
        role: '记录现场问题，跟进处理与闭环',
        prompt: '检测设备异常，帮我创建一张工单',
        menus: ['我的工单', '巡检计划'],
        tone: 'blue',
        icon: 'lucide:wrench',
      },
    ],
  },
] as const;

export const designSteps = [
  {
    title: '确定职责',
    icon: 'lucide:focus',
    question: '谁在什么场景下，需要完成什么？',
    description:
      '先写清服务对象、业务目标和主要演示场景，再确定数字员工的职责与名称。',
    deliverable: '一段业务职责 + 一个主要演示场景',
    example: '会议助理帮助员工预约会议，减少查找会议室与协调时间的成本。',
  },
  {
    title: '划分入口',
    icon: 'lucide:network',
    question: '这是办理一笔业务，还是配置业务规则？',
    description:
      '按角色划分数字员工，每个员工包含“对话 + 业务菜单”。一个应用可支持多个员工，共享资源、规则与模板；个人偏好放在个人设置。',
    deliverable: '员工菜单树 + 应用配置清单',
    example: '“预约会议”属于会议助理；“禁用会议室”属于会议应用。',
  },
  {
    title: '定义对象',
    icon: 'lucide:shapes',
    question: '业务里有什么记录，它们如何关联？',
    description:
      '定义核心字段、稳定 ID、状态与关联关系，明确配置变更对已有记录和后续操作的影响。',
    deliverable: '对象关系 + 状态流转图',
    example: '会议关联会议室和参会人；状态包含待开始、已结束、已取消。',
  },
  {
    title: '准备数据',
    icon: 'lucide:database',
    question: '怎样让一次演示能重复发生？',
    description:
      '使用虚构信息，覆盖正常、冲突、缺失信息及空数据。默认内存保存，刷新重置；持久化需说明范围和重置方式。',
    deliverable: '可重复使用的 Mock 初始数据',
    example: '准备可用、已占用、已停用的会议室，并设置可解释的预约时间。',
  },
  {
    title: '实现方法',
    icon: 'lucide:workflow',
    question: '操作真的改变了记录吗？',
    description:
      '统一实现查询、创建、更新和取消方法，对话与表单都调用它们。校验失败要返回业务原因。',
    deliverable: '统一业务 API + 异常反馈',
    example: '预约成功新增会议；时间冲突时拒绝创建，并提示调整时间。',
  },
  {
    title: '组织页面',
    icon: 'lucide:panels-top-left',
    question: '用户能从对话继续走到业务详情吗？',
    description:
      '复用员工工作区、工具栏、表单和弹窗。首菜单固定为“对话”，列表、详情及表单承接后续处理。',
    deliverable: '可访问的菜单、路由和详情入口',
    example: '预约结果卡片提供“查看会议”，详情页支持改期与取消。',
  },
  {
    title: '串联演示',
    icon: 'lucide:route',
    question: '配置变化是否影响实际业务？',
    description:
      '从应用配置出发，经对话办理、列表查询到详情后续操作，验证同一份状态在各入口间流转。',
    deliverable: '一条可连续演示的业务闭环',
    example: '禁用一个会议室后，对话和预约表单都不能再选择它。',
  },
  {
    title: '完成验收',
    icon: 'lucide:badge-check',
    question: '成功、失败和重置都能解释吗？',
    description:
      '检查菜单顺序、默认跳转、数据联动、异常反馈和小屏显示，执行对应范围的类型检查或构建。',
    deliverable: '验收记录 + 模拟范围 + 重置说明',
    example: '测试预约成功、时间冲突、取消后再次查询；说明历史检查问题。',
  },
] as const;

export const reportFlow = [
  {
    title: '配置方案',
    actor: '管理员 · 知记应用',
    detail: '设置周报、月报的报告模板、汇报周期、审批人及审批规则。',
    result: '汇报与审阅两个助理共用这套配置。',
    icon: 'lucide:settings-2',
  },
  {
    title: '生成报告',
    actor: '员工 · 汇报助理',
    detail:
      '根据工作记录生成周报或月报草稿；信息不足时继续补充，由员工核对内容。',
    result: '形成草稿，生成不等于自动提交。',
    icon: 'lucide:file-pen-line',
  },
  {
    title: '确认提交',
    actor: '员工 · 我的报告',
    detail: '确认报告内容和审批人后提交，将报告从草稿变为待审批。',
    result: '审阅助理的“待我审批”中出现同一份报告。',
    icon: 'lucide:send',
  },
  {
    title: '审阅审批',
    actor: '主管 · 审阅助理',
    detail: '查看报告与工作依据，填写审批意见，选择通过或退回修改。',
    result: '审批结果写回原报告，保留审批意见。',
    icon: 'lucide:clipboard-check',
  },
  {
    title: '反馈同步',
    actor: '员工 · 汇报助理',
    detail:
      '查询审批状态和意见。被退回的报告可继续修改并重新提交，已通过的报告进入历史查询。',
    result: '两个助理看到一致的报告状态，完成协作闭环。',
    icon: 'lucide:refresh-cw',
  },
] as const;

export const acceptance = [
  '首菜单为“对话”，默认跳转正确，业务职责清晰',
  '对话能查询或改变业务状态，缺少信息时继续询问',
  '对话、列表、详情读写同一份数据，记录可以互相定位',
  '应用配置影响业务操作，历史记录的影响范围有说明',
  '加载、确认、成功、失败、取消都有反馈',
  '正常、冲突、空数据可演示，刷新与重置规则明确',
  '复用现有布局和组件，路由、详情与返回路径可访问',
  '完成相应类型检查或构建，区分原有与新增问题',
];
