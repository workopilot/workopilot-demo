import { reactive } from 'vue';

export type MateMessageCategory =
  'application' | 'assistant' | 'other' | 'share' | 'todo';

export type MateNotificationChannelKey =
  'dingtalk' | 'email' | 'feishu' | 'wecom';

export interface MateNotificationChannel {
  accountLabel: string;
  bound: boolean;
  description: string;
  enabled: boolean;
  icon: string;
  key: MateNotificationChannelKey;
  label: string;
}

export interface MateInboxMessage {
  id: string;
  category: MateMessageCategory;
  title: string;
  summary: string;
  sourceName: string;
  sender: string;
  date: string;
  fullDate: string;
  unread: boolean;
  icon: string;
  actionHint: string;
  targetPath: string;
  contentMarkdown: string;
}

export const mateMessages = reactive<MateInboxMessage[]>([
  {
    id: 'contract-initiation-CT-SALES-002',
    category: 'todo',
    title: '销售合同履约安排已确认，待项目立项',
    summary:
      '远景科技软件销售合同已确认开票与收款安排，请交付项目 PMO 核对交付范围并发起立项。',
    sourceName: '合同助理',
    sender: '合同助理',
    date: '10-17',
    fullDate: '2026年10月17日 09:30',
    unread: true,
    icon: 'lucide:folder-kanban',
    actionHint: '准备项目立项',
    targetPath: `/app/mate/employee/pmo-assistant/project-chat?prefill=${encodeURIComponent(
      '请根据以下交付信息准备项目立项草稿，先确认新建还是关联已有项目：合同名称：远景科技软件销售合同；合同编号：HT-SALES-002；客户：远景科技有限公司；交付范围：软件产品许可；销售经理：李四；交付日期：2026-11-01；验收要求：完成软件许可交付与部署，由客户验证功能并签署验收单。请补齐项目负责人和部门，确认后再提交。',
    )}`,
    contentMarkdown:
      '销售合同 **远景科技软件销售合同** 的履约安排已确认，当前 **待项目立项**。\n\n- 客户：远景科技有限公司\n- 交付范围：软件产品许可\n- 销售经理：李四\n- 交付日期：2026-11-01\n\n请由交付项目 PMO 核对是否关联已有项目；新项目需补齐立项信息并确认后提交。',
  },
  {
    id: 'contract-inspection-CT-DEMO-002',
    category: 'todo',
    title: '运维履约事项已确认，待安排巡检工单',
    summary:
      '总部网络设备运维合同已确认4次巡检计划，请核对巡检日期并安排后续工单。',
    sourceName: '合同助理',
    sender: '合同助理',
    date: '10-17',
    fullDate: '2026年10月17日 09:20',
    unread: true,
    icon: 'lucide:clipboard-list',
    actionHint: '查看巡检安排',
    targetPath:
      '/app/mate/employee/contract-assistant/contract-archives/CT-DEMO-002?tab=plans',
    contentMarkdown:
      '运维合同 **总部网络设备运维合同** 的履约事项已确认。\n\n- 巡检次数：4次\n- 首次巡检：2026-10-20\n- 负责团队：华东运维组\n- 负责人：张三\n\n巡检计划已建立，工单仍待按执行规则生成和派发。请核对服务安排与客户预约条件。',
  },

  {
    id: 'msg-todo-approval',
    category: 'todo',
    title: '项目立项审批等待你处理',
    summary:
      '“华东智能工厂二期”已提交立项申请，请在今天 18:00 前确认预算与交付周期。',
    sourceName: '项目助理',
    sender: '项目管理助手',
    date: '09-11',
    fullDate: '2026年9月11日 10:42',
    unread: true,
    icon: 'lucide:clipboard-check',
    actionHint: '前往今日待办',
    targetPath: '/app/mate/employee/project-assistant/today',
    contentMarkdown: `“华东智能工厂二期”项目已完成资料准备并提交立项审批。

本次申请预算为 **120 万元**，计划交付周期为 **12 周**。项目管理助手已核对合同、项目章程和人员排期。

> 请在今天 18:00 前确认预算与交付周期，逾期将影响下周资源锁定。`,
  },
  {
    id: 'msg-assistant-weekly-submit',
    category: 'assistant',
    title: '侯小刚提交了 8 月第三周的周报',
    summary: '周报已提交，包含本周完成、风险问题和下周计划，请你审核。',
    sourceName: '汇报助理',
    sender: '侯小刚',
    date: '09-11',
    fullDate: '2026年9月11日 10:16',
    unread: true,
    icon: 'lucide:notebook-tabs',
    actionHint: '前往周报审核',
    targetPath: '/app/mate/employee/review-copilot/pending',
    contentMarkdown: `侯小刚提交了 **8 月第三周周报**，周报内容如下：

### 本周完成

- 完成华东智能工厂二期需求评审，确认 **12 项核心需求**。
- 完成设备数据接口联调，主流程接口通过率达到 **96%**。
- 提交客户验收材料初稿，并完成内部预审。

### 风险与问题

- 客户现场网络策略尚未确认，可能影响下周部署窗口。
- 两项非标设备数据协议仍等待供应商反馈。

### 下周计划

1. 完成现场部署演练和异常回滚方案评审。
2. 推动供应商完成非标协议适配，并开展第二轮联调。`,
  },
  {
    id: 'msg-assistant-daily-submit',
    category: 'assistant',
    title: '张三提交了 9 月 11 日的日报',
    summary: '日报包含 4 项工作进展、1 项风险和 3 项明日计划。',
    sourceName: '汇报助理',
    sender: '张三',
    date: '09-11',
    fullDate: '2026年9月11日 09:18',
    unread: true,
    icon: 'lucide:file-check-2',
    actionHint: '前往日报详情',
    targetPath: '/app/mate/employee/report-copilot/new-chat',
    contentMarkdown: `张三提交了今天的工作日报，日报内容如下：

### 今日完成

- 完成客户需求清单核对，并更新项目交付计划。
- 参与设备接口联调，解决 **2 项字段映射问题**。
- 整理项目周会纪要并同步相关责任人。

### 明日计划

1. 继续跟进现场网络策略确认。
2. 完成验收材料第二版。`,
  },
  {
    id: 'msg-application-ticket',
    category: 'application',
    title: '知应工单新增一条高优先级工单',
    summary: '华达制药反馈打印设备连续卡纸，SLA 剩余 3 小时。',
    sourceName: '工单应用',
    sender: '知应工单',
    date: '09-11',
    fullDate: '2026年9月11日 08:35',
    unread: true,
    icon: 'lucide:ticket-check',
    actionHint: '前往工单中心',
    targetPath: '/app/mate/employee/ticket-assistant/ticket-center',
    contentMarkdown: `知应工单检测到一条需要优先响应的新工单。

| 项目 | 内容 |
| --- | --- |
| 客户 | 华达制药 |
| 设备 | 包装线打印机 HD-1001 |
| 问题 | 连续卡纸并伴随打印偏移 |
| 优先级 | **高** |

> SLA 剩余 **3 小时**，系统已推荐两名可派单工程师。`,
  },
  {
    id: 'msg-todo-mention',
    category: 'todo',
    title: '日报中有 2 条 @我的待办',
    summary: '研发联调日期与客户验收材料仍待确认。',
    sourceName: '汇报助理',
    sender: 'AI 汇报助手',
    date: '09-10',
    fullDate: '2026年9月10日 17:20',
    unread: false,
    icon: 'lucide:at-sign',
    actionHint: '前往我的待办',
    targetPath: '/app/mate/employee/report-copilot/mentions',
    contentMarkdown: `数字员工从团队日报中识别出 **2 条与你相关的待办**：

- [ ] 确认研发联调日期，建议在 9 月 13 日前回复。
- [ ] 补充客户验收材料中的测试环境说明。`,
  },
  {
    id: 'msg-share-video',
    category: 'share',
    title: '张三给李斯分享了一个项目复盘视频',
    summary:
      '《华东区域客户交付复盘会》视频，时长 26 分钟，已自动生成章节与摘要。',
    sourceName: '文件分享',
    sender: '张三',
    date: '09-10',
    fullDate: '2026年9月10日 15:08',
    unread: false,
    icon: 'lucide:video',
    actionHint: '前往文件中心',
    targetPath: '/app/mate/files',
    contentMarkdown: `张三向李斯分享了 **《华东区域客户交付复盘会》** 视频。

- 视频时长：26 分钟
- 已生成：会议章节、关键结论、行动项摘要

> 分享备注：重点查看 12:30 开始的交付风险复盘，以及最后的责任人确认。`,
  },
  {
    id: 'msg-share-contract',
    category: 'share',
    title: '王芳分享并分析了一个合同 Word',
    summary:
      '《智能制造项目采购合同.docx》已完成条款分析，识别出付款节点与 3 项履约风险。',
    sourceName: '文件分享',
    sender: '王芳',
    date: '09-10',
    fullDate: '2026年9月10日 11:32',
    unread: false,
    icon: 'lucide:file-text',
    actionHint: '前往合同分析',
    targetPath: '/app/mate/employee/project-assistant/project-chat',
    contentMarkdown: `王芳分享了 **《智能制造项目采购合同.docx》** 及其 AI 分析结果。

合同分析已提取付款节点、交付范围、验收条件和违约责任，共识别出 **3 项履约风险**。

### 建议重点复核

1. “验收通过后 90 日付款”条款。
2. “现场条件不具备不顺延工期”条款。`,
  },
  {
    id: 'msg-other-maintenance',
    category: 'other',
    title: '系统将在周六凌晨进行例行维护',
    summary: '维护期间文件预览可能短暂不可用，预计持续 20 分钟。',
    sourceName: '系统通知',
    sender: '系统通知',
    date: '09-09',
    fullDate: '2026年9月9日 16:00',
    unread: false,
    icon: 'lucide:settings-2',
    actionHint: '前往工作台',
    targetPath: '/app/mate/home',
    contentMarkdown: `系统计划于本周六凌晨 **02:00—02:20** 进行例行维护。

维护期间文件预览和智能解析能力可能短暂不可用，其他功能不受影响。

> 如你正在进行长时间编辑，请提前保存当前工作。`,
  },
]);

export const mateNotificationChannels = reactive<MateNotificationChannel[]>([
  {
    key: 'email',
    label: '邮箱',
    description: '将重要消息发送到工作邮箱',
    icon: 'lucide:mail',
    bound: true,
    accountLabel: 'wang***@workopilot.cn',
    enabled: false,
  },
  {
    key: 'feishu',
    label: '飞书',
    description: '通过飞书机器人接收消息提醒',
    icon: 'lucide:message-square-more',
    bound: false,
    accountLabel: '尚未绑定飞书账号',
    enabled: false,
  },
  {
    key: 'dingtalk',
    label: '钉钉',
    description: '通过钉钉工作通知接收消息',
    icon: 'lucide:bell-ring',
    bound: false,
    accountLabel: '尚未绑定钉钉账号',
    enabled: false,
  },
  {
    key: 'wecom',
    label: '企微',
    description: '通过企业微信接收消息提醒',
    icon: 'lucide:messages-square',
    bound: true,
    accountLabel: '王安康 · 喔壳科技',
    enabled: false,
  },
]);

export function markMateMessageRead(id: string) {
  const target = mateMessages.find((item) => item.id === id);
  if (target) target.unread = false;
}

export function markAllMateMessagesRead() {
  mateMessages.forEach((item) => {
    item.unread = false;
  });
}

/** 仅更新应用内消息；相同业务事件重复提交不重复通知。 */
export function addMateInboxMessage(item: MateInboxMessage) {
  if (!mateMessages.some((message) => message.id === item.id))
    mateMessages.unshift(item);
}
