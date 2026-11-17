import { reactive } from "vue";

export interface SalesRegion {
  id: string;
  name: string;
  coverage: string;
  manager: string;
  members: string[];
}
export interface SalesTarget {
  period: string;
  metric: string;
  regionId: string;
  amount: number;
  allocations: Record<string, number>;
}
export const salesPeople = [
  "韩立",
  "林晓",
  "张悦",
  "陈晨",
  "赵宁",
  "李可",
  "周远",
  "孙敏",
];

export const defaultSalesStages = [
  {
    id: 1,
    name: "需求确认",
    rate: 20,
    days: 7,
    color: "#548be2",
    required: "客户需求、预计金额",
  },
  {
    id: 2,
    name: "方案/POC",
    rate: 40,
    days: 14,
    color: "#8970d5",
    required: "方案附件、关键联系人",
  },
  {
    id: 3,
    name: "商务报价",
    rate: 60,
    days: 7,
    color: "#cb963b",
    required: "报价金额、报价单",
  },
  {
    id: 4,
    name: "合同谈判",
    rate: 80,
    days: 14,
    color: "#26a69a",
    required: "预计成交日、合同草稿",
  },
];

// Configuration prototype only: session memory, never changes live CRM permissions.
export const salesSettings = reactive({
  regions: [
    {
      id: "shandong",
      name: "山东大区",
      coverage: "山东",
      manager: "周远",
      members: ["韩立", "张悦"],
    },
    {
      id: "east",
      name: "华东大区",
      coverage: "上海、江苏、浙江、安徽",
      manager: "孙敏",
      members: ["林晓", "陈晨"],
    },
  ] as SalesRegion[],
  targets: [
    {
      period: "2027",
      metric: "赢单金额",
      regionId: "shandong",
      amount: 600,
      allocations: { 韩立: 360, 张悦: 200 },
    },
    {
      period: "2027",
      metric: "赢单金额",
      regionId: "east",
      amount: 800,
      allocations: { 林晓: 450, 陈晨: 350 },
    },
  ] as SalesTarget[],
  stages: defaultSalesStages.map((stage) => ({ ...stage })),
  permissions: {
    salesExport: false,
    directorExport: true,
    directorTransfer: true,
    adminExport: true,
  },
  pool: {
    reclaim: true,
    idleDays: 30,
    protectDays: 7,
    limit: 100,
    dailyClaim: 10,
    excludeDeals: true,
  },
  follow: {
    remind: true,
    idleDays: 15,
    renewDays: 30,
    overdue: true,
    channel: "站内消息",
    time: "09:00",
  },
  fields: [
    {
      id: 1,
      object: "客户",
      name: "客户名称",
      type: "单行文本",
      required: true,
      values: "",
      locked: true,
    },
    {
      id: 2,
      object: "客户",
      name: "客户等级",
      type: "单选",
      required: false,
      values: "S、A、B、C",
      locked: false,
    },
    {
      id: 3,
      object: "线索",
      name: "来源渠道",
      type: "单选",
      required: false,
      values: "官网留资、行业展会、客户推荐、合作伙伴",
      locked: false,
    },
    {
      id: 4,
      object: "商机",
      name: "商机类型",
      type: "单选",
      required: true,
      values: "新签首单、老客复购与增购",
      locked: true,
    },
    {
      id: 5,
      object: "商机",
      name: "输单原因",
      type: "单选",
      required: true,
      values: "预算不足、竞品中标、需求取消、时间推迟",
      locked: false,
    },
  ],
});
