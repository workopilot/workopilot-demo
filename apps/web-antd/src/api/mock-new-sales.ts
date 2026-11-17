import { reactive } from "vue";
import type { SalesKind, SalesRecord, SalesTracking } from "#/types/new-sales";
import { createMockResponse, mockDelay } from "./mock-data";
export const salesToday = "2026-10-30";
export const salesStages = [
  "需求确认",
  "方案沟通",
  "评估验证",
  "商务谈判",
  "赢单",
  "输单",
];
export const salesLabels: Record<SalesKind, string> = {
  leads: "线索",
  customers: "客户",
  contacts: "联系人",
  deals: "商机",
  quotes: "报价",
  tasks: "任务",
  activities: "活动",
  products: "产品",
  files: "资料",
  plans: "客户方案",
};
export const salesDb = reactive<Record<SalesKind, SalesRecord[]>>({
  customers: [
    {
      id: "c1",
      name: "华达科技",
      industry: "智能制造",
      status: "潜在客户",
      owner: "韩立",
      contact: "李明",
      phone: "13800001001",
      date: "2026-10-30",
      source: "展会",
      note: "计划升级三个厂区的设备巡检流程，需要统一工单与设备台账。",
    },
    {
      id: "c2",
      name: "远航物流",
      industry: "物流运输",
      status: "合作客户",
      owner: "韩立",
      contact: "陈静",
      phone: "13800001002",
      date: "2026-11-02",
      source: "老客户增购",
      note: "已有两个仓库使用系统，本期关注跨区域派单和移动端执行。",
    },
    {
      id: "c3",
      name: "星河医疗",
      industry: "医疗健康",
      status: "潜在客户",
      owner: "林悦",
      contact: "赵凯",
      date: "2026-11-03",
      source: "官网咨询",
      note: "希望统一内部服务请求和审批流程。",
    },
    {
      id: "c4",
      name: "云帆能源",
      industry: "能源",
      status: "潜在客户",
      owner: "",
      contact: "周航",
      date: "2026-10-25",
      source: "合作伙伴",
      note: "区域设备维护管理，尚未确认预算。",
    },
    {
      id: "c5",
      name: "森屿零售",
      industry: "零售",
      status: "潜在客户",
      owner: "",
      contact: "许宁",
      date: "2026-10-26",
      source: "官网咨询",
      note: "门店报修与巡检需求，待领取。",
    },
    {
      id: "c6",
      name: "启明精工",
      industry: "智能制造",
      status: "合作客户",
      owner: "林悦",
      contact: "王磊",
      date: "2026-11-05",
      source: "转介绍",
      note: "已完成首期上线，关注售后服务流程。",
    },
  ],
  contacts: [
    {
      id: "p1",
      name: "李明",
      customerId: "c1",
      status: "在职",
      owner: "韩立",
      role: "采购经理",
      phone: "13800001001",
      email: "liming@example.com",
      note: "负责供应商选型和商务沟通。",
    },
    {
      id: "p2",
      name: "张工",
      customerId: "c1",
      status: "在职",
      owner: "韩立",
      role: "技术负责人",
      email: "zhanggong@example.com",
      note: "关注接口对接和移动端离线能力。",
    },
    {
      id: "p3",
      name: "陈静",
      customerId: "c2",
      status: "在职",
      owner: "韩立",
      role: "运营总监",
      phone: "13800001002",
    },
    {
      id: "p4",
      name: "赵凯",
      customerId: "c3",
      status: "在职",
      owner: "林悦",
      role: "信息中心主任",
    },
  ],
  leads: [
    {
      id: "l1",
      name: "苏州产线巡检升级",
      customerName: "苏州锐拓制造",
      contact: "刘洋",
      status: "待联系",
      owner: "韩立",
      source: "行业展会",
      date: "2026-10-30",
      phone: "13800002001",
      note: "5 条产线，希望用手机完成巡检并自动汇总异常。",
    },
    {
      id: "l2",
      name: "连锁门店报修咨询",
      customerName: "禾木生活",
      contact: "孙蕾",
      status: "待分配",
      owner: "",
      source: "官网咨询",
      date: "2026-11-02",
      note: "约 80 家门店，咨询报修与服务商派单。",
    },
    {
      id: "l3",
      name: "园区设备统一管理",
      customerName: "智汇园区",
      contact: "黄峰",
      status: "跟进中",
      owner: "林悦",
      source: "合作伙伴",
      date: "2026-11-03",
      note: "需核实设备数量和年度预算。",
    },
    {
      id: "l4",
      name: "华达新增设备需求",
      customerName: "华达科技",
      contact: "李明",
      status: "待联系",
      owner: "韩立",
      source: "客户推荐",
      date: "2026-11-04",
      note: "与现有客户同名，转化时应关联已有客户。",
    },
  ],
  deals: [
    {
      id: "d1",
      name: "采购2台5系设备",
      customerId: "c1",
      status: "方案/POC",
      owner: "韩立",
      amount: 280000,
      date: "2026-11-20",
      note: "客户计划采购2台5系设备，本周确认配置、交期和采购审批流程。",
    },
    {
      id: "d2",
      name: "准备购买喔壳智能体平台",
      customerId: "c2",
      status: "商务报价",
      owner: "韩立",
      amount: 168000,
      date: "2026-11-06",
      note: "客户准备购买喔壳智能体平台，已沟通部署方式，待确认授权范围和付款节点。",
    },
    {
      id: "d3",
      name: "27年财务准备上智能审核",
      customerId: "c3",
      status: "需求确认",
      owner: "林悦",
      amount: 360000,
      date: "2026-12-10",
      note: "财务计划在2027年上线智能审核，先梳理报销单据、审核规则和年度预算。",
    },
    {
      id: "d4",
      name: "预计上D100和一台国产化设备",
      customerId: "c1",
      status: "方案/POC",
      owner: "韩立",
      amount: 96000,
      date: "2026-11-15",
      note: "预计采购D100和一台国产化设备，需确认软硬件适配、配置清单及验收标准。",
    },
    {
      id: "d5",
      name: "采购喔壳智能审核，先用于财务报销",
      customerId: "c6",
      status: "赢单",
      owner: "林悦",
      amount: 120000,
      date: "2026-11-01",
      note: "客户已确认采购智能审核，首期覆盖财务报销，待安排实施交接。",
    },
    {
      id: "d6",
      name: "追加采购1台5系设备",
      customerId: "c2",
      status: "赢单",
      owner: "韩立",
      amount: 96000,
      category: "复购",
      date: "2026-11-01",
      note: "老客户已追加采购1台5系设备，后续跟进到货与安装。",
    },
    {
      id: "d7",
      name: "准备给两个部门增购数字员工",
      customerId: "c6",
      status: "合同谈判",
      owner: "林悦",
      amount: 128000,
      category: "增购",
      date: "2026-11-26",
      note: "两个部门的数字员工增购范围已确认，等待合同付款条款反馈。",
    },
    {
      id: "d8",
      name: "计划采购1台国产化设备，预算暂缓",
      customerId: "c4",
      status: "输单",
      owner: "",
      amount: 48000,
      category: "新签首单",
      date: "2026-10-28",
      note: "演示商机：本年度预算暂停，下一年度重新评估。",
    },
  ],
  quotes: [
    {
      id: "q1",
      name: "远航仓库扩容报价",
      customerId: "c2",
      dealId: "d2",
      status: "草稿",
      owner: "韩立",
      amount: 168000,
      date: "2026-11-10",
      version: 1,
      lines: [
        { productId: "pr1", name: "智能工单标准版", price: 48000, quantity: 1 },
        { productId: "pr2", name: "实施与集成服务", price: 60000, quantity: 2 },
      ],
    },
  ],
  tasks: [
    {
      id: "t-meeting-c1",
      name: "三厂区联合需求访谈",
      customerId: "c1",
      owner: "韩立",
      status: "待完成",
      date: "2026-11-05",
      category: "会议",
      note: "10:00 · 与采购、技术共同确认试点范围",
    },
    {
      id: "t-visit-c1",
      name: "一号厂区现场拜访",
      customerId: "c1",
      owner: "韩立",
      status: "待完成",
      date: "2026-11-09",
      category: "拜访",
      note: "14:00 · 济南厂区，了解巡检与设备台账流程",
    },

    {
      id: "t1",
      name: "确认华达演示参与人",
      customerId: "c1",
      dealId: "d1",
      status: "待完成",
      owner: "韩立",
      date: "2026-10-30",
      category: "电话",
    },
    {
      id: "t2",
      name: "核对远航付款节点",
      customerId: "c2",
      dealId: "d2",
      status: "待完成",
      owner: "韩立",
      date: "2026-10-29",
      category: "会议",
    },
    {
      id: "t3",
      name: "准备星河需求访谈",
      customerId: "c3",
      dealId: "d3",
      status: "待完成",
      owner: "林悦",
      date: "2026-11-02",
      category: "拜访",
    },
  ],
  activities: [
    {
      id: "a1",
      name: "华达需求沟通",
      customerId: "c1",
      dealId: "d1",
      status: "已记录",
      owner: "韩立",
      date: "2026-10-28",
      category: "会议",
      note: "李明确认有2台5系设备的采购需求，张工负责核对配置和适配要求；交期及采购审批流程待确认。",
    },
    {
      id: "a2",
      name: "远航平台采购范围确认",
      customerId: "c2",
      dealId: "d2",
      status: "已记录",
      owner: "韩立",
      date: "2026-10-27",
      category: "电话",
      note: "准备购买喔壳智能体平台，先覆盖销售与财务场景，预计11月确认部署和授权范围。",
    },
  ],
  products: [
    {
      id: "pr1",
      name: "智能工单标准版",
      status: "在售",
      owner: "韩立",
      amount: 48000,
      category: "软件",
      note: "年度授权，含报修、派单、服务台。",
    },
    {
      id: "pr2",
      name: "实施与集成服务",
      status: "在售",
      owner: "林悦",
      amount: 60000,
      category: "服务",
      note: "按项目提供需求调研、配置和接口集成。",
    },
    {
      id: "pr3",
      name: "设备巡检扩展包",
      status: "在售",
      owner: "韩立",
      amount: 32000,
      category: "软件",
      note: "支持巡检计划、移动执行与异常汇总。",
    },
  ],
  files: [
    {
      id: "f1",
      name: "制造业设备巡检解决方案",
      status: "已发布",
      owner: "韩立",
      category: "行业方案",
      date: "2026-10-26",
      version: 2,
      note: "适用场景：多厂区设备巡检。实施步骤：设备建档、计划配置、现场执行、异常闭环。验收关注计划完成率和异常响应时效。",
    },
    {
      id: "f2",
      name: "启明精工工单实施案例",
      status: "已发布",
      owner: "林悦",
      category: "客户案例",
      date: "2026-10-23",
      version: 1,
      note: "演示案例：梳理报修入口和服务人员职责，形成统一工单记录。对外使用须完成脱敏。",
    },
    {
      id: "f3",
      name: "产品演示讲解提纲",
      status: "草稿",
      owner: "韩立",
      category: "演示资料",
      date: "2026-10-29",
      version: 1,
      note: "从一张报修单展示分派、处理、验收和统计。",
    },
  ],
  plans: [
    {
      id: "s1",
      name: "华达厂区巡检试点方案",
      customerId: "c1",
      dealId: "d1",
      status: "草稿",
      owner: "韩立",
      version: 1,
      date: "2026-10-29",
      note: "一、目标\n统一试点厂区巡检执行与异常处理。\n\n二、范围\n选择一个厂区完成设备建档与移动端试点。\n\n三、实施步骤\n调研 → 配置 → 试运行 → 验收。\n\n四、待确认\n设备清单、接口范围、采购预算与验收标准。",
    },
  ],
});
export const salesTrackings = reactive<SalesTracking[]>([]);
export const salesRules = reactive({
  recycleDays: 30,
  claimLimit: 20,
  protectActive: true,
  assignment: "主管分配",
  reminderDays: 7,
});
export const salesLogs = reactive<{ time: string; text: string }[]>([]);
export const uid = () => crypto.randomUUID();
export const money = (value = 0) => `¥${value.toLocaleString("zh-CN")}`;
export const customerName = (r: SalesRecord) =>
  salesDb.customers.find((c) => c.id === r.customerId)?.name ||
  r.customerName ||
  "—";
export function addSales(kind: SalesKind, record: Partial<SalesRecord>) {
  const row: SalesRecord = {
    id: uid(),
    name: "未命名",
    status: "草稿",
    owner: "韩立",
    ...record,
  };
  salesDb[kind].unshift(row);
  return row;
}
export function logSales(text: string) {
  salesLogs.unshift({ time: new Date().toLocaleTimeString("zh-CN"), text });
}
export function convertLead(lead: SalesRecord, withDeal: boolean) {
  if (lead.status === "已转化") return;
  let customer = salesDb.customers.find((c) => c.name === lead.customerName);
  if (!customer)
    customer = addSales("customers", {
      name: lead.customerName || lead.name,
      status: "潜在客户",
      owner: lead.owner || "韩立",
      source: lead.source,
      contact: lead.contact,
      phone: lead.phone,
      note: lead.note,
    });
  if (
    lead.contact &&
    !salesDb.contacts.some(
      (c) => c.customerId === customer.id && c.name === lead.contact,
    )
  )
    addSales("contacts", {
      name: lead.contact,
      customerId: customer.id,
      status: "在职",
      owner: customer.owner,
      phone: lead.phone,
    });
  if (withDeal)
    addSales("deals", {
      name: lead.name,
      customerId: customer.id,
      status: salesStages[0],
      owner: customer.owner,
      amount: 0,
      date: "2026-11-30",
      note: lead.note,
    });
  lead.status = "已转化";
  lead.customerId = customer.id;
  logSales(`转化线索：${lead.name}`);
  return customer;
}
export async function generateSalesAdvice(
  kind: SalesKind,
  record: SalesRecord,
  prompt: string,
) {
  await mockDelay(450);
  const customer =
    kind === "customers"
      ? record
      : salesDb.customers.find((c) => c.id === record.customerId);
  const activities = salesDb.activities.filter(
    (a) => a.customerId === (customer?.id || record.customerId),
  );
  const source = activities[0];
  const facts = [
    customer?.note || record.note || "尚无完整需求记录",
    source?.note,
  ]
    .filter(Boolean)
    .join("\n");
  let text = prompt.includes("方案")
    ? `一、客户目标\n${facts}\n\n二、建议范围\n先完成需求确认，再选择一个业务场景试点。\n\n三、实施安排\n需求调研 → 方案评审 → 试点验证 → 验收。\n\n四、待确认\n预算、决策人、采购时间和验收标准。`
    : prompt.includes("画像")
      ? `已知信息\n${customer?.name || record.name} · ${customer?.industry || "行业待确认"}\n${facts}\n\n机会推断\n可以围绕现有流程中的人工协作环节开展需求访谈，需向客户验证。\n\n待核实\n采购预算、最终决策人、审批流程与实施时间。`
      : `当前情况\n${facts}\n\n下一步建议\n与关键联系人确认需求优先级、采购流程和下一次沟通时间。\n\n建议任务\n准备需求确认提纲并安排一次客户沟通。`;
  if (prompt.includes("报价")) {
    text =
      "报价核对\n" +
      (record.lines?.length
        ? record.lines
            .map(
              (l) =>
                l.name +
                " × " +
                l.quantity +
                "：" +
                money(l.price * l.quantity),
            )
            .join("\n")
        : "尚未添加产品明细。") +
      "\n\n待确认\n有效期、税费口径、付款节点、交付范围及折扣审批。\n\n建议\n对照需求逐项核对产品和实施服务，价格以已授权产品目录为准。";
  } else if (kind === "files" || kind === "products") {
    text =
      "资料重点\n" +
      (record.note || "尚无资料正文。") +
      "\n\n应用建议\n先核对客户的业务场景与适用范围，再选择资料用于方案或沟通。\n\n待核实\n版本有效性、对外使用权限及具体产品配置。";
  } else if (prompt.includes("摘要")) {
    text =
      (record.note || customer?.note || "待补充客户的具体业务需求。") +
      "\n\n待确认：业务范围、预算、负责人和期望交付时间。";
  }
  return createMockResponse({
    text,
    source: source
      ? `${source.name} · ${source.date}`
      : `${salesLabels[kind]}档案：${record.name}`,
    sourceId: source?.id,
  });
}

export const salesChatSessions = reactive<
  import("#/types/mate").MateChatSession[]
>([
  {
    id: uid(),
    employeeId: "new-sales-assistant",
    title: "新对话",
    relativeTime: "刚刚",
    unread: 0,
    messages: [],
  },
]);
