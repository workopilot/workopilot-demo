<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Select,
  SelectOption,
  Spin,
  Tag,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

/** 简易 ID 生成器(替代 uuid) */
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ====================================================
// 类型定义
// ====================================================

type WoType =
  | '打印机维修'
  | '电梯故障'
  | '电气维修'
  | '空调故障'
  | '网络调试'
  | '设备故障'
  | '设备巡检';

type WoStatus = 'completed' | 'dispatched' | 'pending' | 'processing';

type SlaRisk = 'overdue' | 'safe' | 'warn';

type TripStatus = 'cancelled' | 'completed' | 'ongoing' | 'planned';

/** 待安排工单 */
interface PendingWo {
  id: string;
  code: string; // WO 工单号
  title: string; // 工单标题
  woType: WoType; // 工单类型
  customer: string; // 客户名称
  customerLocation: string; // 客户所在城市/区域
  device: string; // 设备信息
  woStatus: WoStatus; // 工单状态
  slaRemaining: string; // SLA 剩余时间
  slaRisk: SlaRisk; // SLA 风险等级
  priority: 'high' | 'low' | 'medium' | 'urgent';
  duration: number; // 预计处理时长(分钟)
  problemDesc: string; // 问题简要描述(供 AI 建议参考)
}

/** 关联工单(用于行程单展示) */
interface TripWoRef {
  id: string;
  code: string;
  title: string;
  woType: WoType;
  customer: string;
  device: string;
  woStatus: WoStatus;
  slaRemaining: string;
  slaRisk: SlaRisk;
  sopItems: WoSopItem[]; // ★ 关联的 SOP 现场服务要求事项
}

// ============ SOP 现场服务要求事项 ============

/** SOP 模板项 */
interface SopItemTemplate {
  id: string;
  content: string;
  required: boolean;
  type: 'check' | 'fill' | 'upload';
}

/** SOP 模板（管理后台可配置） */
interface SopTemplate {
  id: string;
  name: string;
  woTypes: WoType[];
  items: SopItemTemplate[];
  updatedAt: string;
}

/** SOP 附件（Mock 占位） */
interface SopAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
}

/** 工单要求事项实例（执行端消费） */
interface WoSopItem {
  id: string;
  templateId: string;
  templateName?: string; // 来源模板名称（分组展示用）
  content: string;
  required: boolean;
  type: 'check' | 'fill' | 'upload';
  // 执行进度
  checked: boolean;
  note?: string;
  attachments: SopAttachment[];
  completedAt?: string;
}

/** 根据工单类型匹配 SOP 模板，生成工单级要求事项实例 */
function matchSopItems(woType: WoType): WoSopItem[] {
  const matchedTemplates = sopTemplates.filter((t) =>
    t.woTypes.includes(woType),
  );
  if (matchedTemplates.length === 0) return [];
  return matchedTemplates.flatMap((t) =>
    t.items.map((item): WoSopItem => ({
      id: `sop-inst-${t.id}-${item.id}`,
      templateId: `${t.id}-${item.id}`,
      templateName: t.name,
      content: item.content,
      required: item.required,
      type: item.type,
      checked: false,
      note: '',
      attachments: [],
    })),
  );
}

/** SOP 模板 Mock 数据 */
const sopTemplates: SopTemplate[] = [
  {
    id: 'sop-001',
    name: '特种设备作业 SOP',
    woTypes: ['电梯故障', '电气维修'],
    items: [
      {
        id: 'i1',
        content: '必须持有特种设备作业证(T证)',
        required: true,
        type: 'check',
      },
      {
        id: 'i2',
        content: '现场作业前拍照打卡(带时间地点水印)',
        required: true,
        type: 'upload',
      },
      {
        id: 'i3',
        content: '作业过程中每30分钟向调度报平安',
        required: true,
        type: 'fill',
      },
      {
        id: 'i4',
        content: '完成后上传5张以上现场照片',
        required: true,
        type: 'upload',
      },
      {
        id: 'i5',
        content: '客户签字确认服务完成',
        required: false,
        type: 'check',
      },
    ],
    updatedAt: '2026-09-20 10:00',
  },
  {
    id: 'sop-002',
    name: '普通设备维修 SOP',
    woTypes: ['空调故障', '打印机维修', '网络调试'],
    items: [
      {
        id: 'i1',
        content: '现场作业前拍照打卡',
        required: true,
        type: 'upload',
      },
      {
        id: 'i2',
        content: '记录设备编号和故障现象',
        required: true,
        type: 'fill',
      },
      {
        id: 'i3',
        content: '完成后上传处理结果照片',
        required: true,
        type: 'upload',
      },
    ],
    updatedAt: '2026-09-20 10:00',
  },
  {
    id: 'sop-003',
    name: '设备巡检 SOP',
    woTypes: ['设备巡检'],
    items: [
      {
        id: 'i1',
        content: '按巡检表逐项检查',
        required: true,
        type: 'check',
      },
      {
        id: 'i2',
        content: '记录巡检数据和异常项',
        required: true,
        type: 'fill',
      },
      {
        id: 'i3',
        content: '上传巡检报告签字扫描件',
        required: true,
        type: 'upload',
      },
    ],
    updatedAt: '2026-09-20 10:00',
  },
  {
    id: 'sop-004',
    name: '设备维修 SOP',
    woTypes: ['设备故障'],
    items: [
      {
        id: 'i1',
        content: '到达现场后拍照打卡（带时间地点水印）',
        required: true,
        type: 'upload',
      },
      {
        id: 'i2',
        content: '记录设备编号和故障现象',
        required: true,
        type: 'fill',
      },
      {
        id: 'i3',
        content: '完成后上传处理结果照片',
        required: true,
        type: 'upload',
      },
      {
        id: 'i4',
        content: '客户签字确认服务完成',
        required: false,
        type: 'check',
      },
    ],
    updatedAt: '2026-09-25 09:00',
  },
];

/** 行程变更事件 */
interface TripChangeEvent {
  id: string;
  type: 'cancel' | 'note' | 'owner-change' | 'slot-change';
  time: string;
  operator: string;
  content: string;
  from?: string;
  to?: string;
}

/** 行程单 */
interface TripItem {
  id: string;
  code: string;
  title: string;
  planDate: string;
  planSlot: '上午' | '下午' | '全天';
  owner: string;
  ownerId: string;
  status: TripStatus;
  remark: string;
  workOrders: TripWoRef[];
  events: TripChangeEvent[];
  createdAt: string;
  updatedAt: string;
}

/** 工程师 */
interface Engineer {
  id: string;
  name: string;
  skills: string[];
  status: 'busy' | 'offline' | 'online';
  area: string;
  workload: number;
}

// ====================================================
// Mock 数据
// ====================================================

const engineers = ref<Engineer[]>([
  {
    id: 'u-shenjun',
    name: '沈俊',
    skills: ['设备故障', '打印机维修', '网络调试'],
    status: 'online',
    area: '南京',
    workload: 2,
  },
  {
    id: 'u-wangshengrui',
    name: '王圣瑞',
    skills: ['设备故障', '电气维修'],
    status: 'online',
    area: '青岛',
    workload: 1,
  },
  {
    id: 'u-zhangligang',
    name: '张利刚',
    skills: ['设备故障', '电气维修', '电梯故障'],
    status: 'online',
    area: '武汉',
    workload: 1,
  },
  {
    id: 'u-suguanyu',
    name: '苏冠宇',
    skills: ['设备故障', '设备巡检'],
    status: 'busy',
    area: '株洲',
    workload: 2,
  },
  {
    id: 'u-lichanghua',
    name: '李常华',
    skills: ['设备故障', '网络调试', '打印机维修'],
    status: 'offline',
    area: '聊城',
    workload: 0,
  },
]);

// ============ 待安排工单（图片参考数据：6 条设备故障场景） ============

const pendingOrders = ref<PendingWo[]>([
  {
    id: 'wo-img-001',
    code: 'WO-20260929162805563',
    title: '打印机坏了测试数据',
    woType: '设备故障',
    customer: '熊猫集团',
    customerLocation: '南京',
    device: '熊猫集团-D5200P-南京-4',
    woStatus: 'dispatched',
    slaRemaining: '剩余 71 小时',
    slaRisk: 'safe',
    priority: 'medium',
    duration: 60,
    problemDesc: '客户反馈打印机故障，打印头不出墨，需现场排查更换',
  },
  {
    id: 'wo-img-002',
    code: 'WO-20260922171433668',
    title: '中车电机轨道单据不齐',
    woType: '设备故障',
    customer: '中车电机',
    customerLocation: '株洲',
    device: '中车电机-D5200-株洲-1',
    woStatus: 'dispatched',
    slaRemaining: '已超时 95 小时',
    slaRisk: 'overdue',
    priority: 'urgent',
    duration: 120,
    problemDesc: '现场作业单据不齐，轨道设备疑似异常需重新核查',
  },
  {
    id: 'wo-img-004',
    code: 'WO-20260922163300866',
    title: '苏美达大厦13楼单据掉落',
    woType: '设备故障',
    customer: '苏美达',
    customerLocation: '南京',
    device: '苏美达-D5200P-南京-3',
    woStatus: 'processing',
    slaRemaining: '已超时 95 小时',
    slaRisk: 'overdue',
    priority: 'urgent',
    duration: 90,
    problemDesc: '现场单据掉落，需紧急前往现场处理',
  },
  {
    id: 'wo-img-005',
    code: 'WO-20260922160741775',
    title: '山东港4董家口航运-内置',
    woType: '设备故障',
    customer: '山东港',
    customerLocation: '青岛',
    device: '山东港-D5200P-青岛-4',
    woStatus: 'dispatched',
    slaRemaining: '已超时 96 小时',
    slaRisk: 'overdue',
    priority: 'high',
    duration: 90,
    problemDesc: '客户航运设备内置模块故障，需现场更换',
  },
  {
    id: 'wo-img-006',
    code: 'WO-20260922155841695',
    title: '东风技术中心2号柜内部',
    woType: '设备故障',
    customer: '东风汽车',
    customerLocation: '武汉',
    device: '东风汽车-D5200-武汉-2',
    woStatus: 'dispatched',
    slaRemaining: '已超时 96 小时',
    slaRisk: 'overdue',
    priority: 'high',
    duration: 120,
    problemDesc: '技术中心2号控制柜内部元件损坏，需现场排查',
  },
  {
    id: 'wo-img-007',
    code: 'WO-20260929100000001',
    title: '鑫泰科技空调不制冷',
    woType: '空调故障',
    customer: '鑫泰科技有限公司',
    customerLocation: '上海浦东',
    device: '格力 GMV 多联机外机 A-03 机房',
    woStatus: 'pending',
    slaRemaining: '已超时 12 分钟',
    slaRisk: 'overdue',
    priority: 'urgent',
    duration: 60,
    problemDesc: '空调不制冷，压缩机有异响声，怀疑风扇电机故障',
  },
  {
    id: 'wo-img-008',
    code: 'WO-20260929100000002',
    title: '华夏银行服务器季度巡检',
    woType: '设备巡检',
    customer: '华夏银行数据中心',
    customerLocation: '上海黄浦',
    device: 'IBM X3850 服务器集群 12 台',
    woStatus: 'pending',
    slaRemaining: '6 小时',
    slaRisk: 'safe',
    priority: 'medium',
    duration: 90,
    problemDesc: '季度例行巡检，包含硬件检测、温度监控、日志审查',
  },
]);

// ============ 行程单（与 my-trips.vue 对齐） ============

const tripList = ref<TripItem[]>([
  {
    id: 't-img-001',
    code: 'TR-20260930-001',
    title: '南京区域设备故障联合上门（熊猫集团 + 苏美达）',
    planDate: '2026-09-30',
    planSlot: '上午',
    owner: '沈俊',
    ownerId: 'u-shenjun',
    status: 'planned',
    remark: '熊猫集团打印机故障 + 苏美达单据掉落，同属南京区域合并出行',
    workOrders: [
      {
        id: 'wo-img-001',
        code: 'WO-20260929162805563',
        title: '打印机坏了测试数据',
        woType: '设备故障',
        customer: '熊猫集团',
        device: '熊猫集团-D5200P-南京-4',
        woStatus: 'pending',
        slaRemaining: '剩余 71 小时',
        slaRisk: 'safe',
        sopItems: matchSopItems('设备故障'),
      },
      {
        id: 'wo-img-004',
        code: 'WO-20260922163300866',
        title: '苏美达大厦13楼单据掉落',
        woType: '设备故障',
        customer: '苏美达',
        device: '苏美达-D5200P-南京-3',
        woStatus: 'processing',
        slaRemaining: '已超时 95 小时',
        slaRisk: 'overdue',
        sopItems: matchSopItems('设备故障'),
      },
    ],
    events: [],
    createdAt: '2026-09-29 17:00',
    updatedAt: '2026-09-29 17:00',
  },
  {
    id: 't-img-002',
    code: 'TR-20260929-003',
    title: '山东青岛航运设备故障处理',
    planDate: '2026-09-29',
    planSlot: '下午',
    owner: '王圣瑞',
    ownerId: 'u-wangshengrui',
    status: 'ongoing',
    remark: '山东港董家口航运内置模块故障，已到达现场处理中',
    workOrders: [
      {
        id: 'wo-img-005',
        code: 'WO-20260922160741775',
        title: '山东港4董家口航运-内置',
        woType: '设备故障',
        customer: '山东港',
        device: '山东港-D5200P-青岛-4',
        woStatus: 'dispatched',
        slaRemaining: '已超时 96 小时',
        slaRisk: 'overdue',
        sopItems: matchSopItems('设备故障'),
      },
    ],
    events: [
      {
        id: 'ev-img-001',
        type: 'owner-change',
        time: '2026-09-29 09:15',
        operator: '调度员-陈芳',
        content: '沈俊南京行程后临时调整，转由王圣瑞负责青岛区域',
        from: '沈俊',
        to: '王圣瑞',
      },
    ],
    createdAt: '2026-09-28 20:00',
    updatedAt: '2026-09-29 15:30',
  },
  {
    id: 't-img-003',
    code: 'TR-20260928-007',
    title: '湖北武汉东风技术中心控制柜处理',
    planDate: '2026-09-28',
    planSlot: '全天',
    owner: '张利刚',
    ownerId: 'u-zhangligang',
    status: 'completed',
    remark: '东风技术中心2号控制柜内部元件更换，已完成',
    workOrders: [
      {
        id: 'wo-img-006',
        code: 'WO-20260922155841695',
        title: '东风技术中心2号柜内部',
        woType: '设备故障',
        customer: '东风汽车',
        device: '东风汽车-D5200-武汉-2',
        woStatus: 'completed',
        slaRemaining: '已完成',
        slaRisk: 'safe',
        sopItems: matchSopItems('设备故障'),
      },
      {
        id: 'wo-img-003',
        code: 'WO-20260922164254499',
        title: '鲁西化工1号柜单据不齐',
        woType: '设备故障',
        customer: '鲁西化工',
        device: '鲁西化工-D5200-聊城-1',
        woStatus: 'completed',
        slaRemaining: '已完成',
        slaRisk: 'safe',
        sopItems: matchSopItems('设备故障'),
      },
    ],
    events: [
      {
        id: 'ev-img-002',
        type: 'note',
        time: '2026-09-28 18:00',
        operator: '张利刚',
        content: '东风控制柜元件已更换，客户验收通过；鲁西化工工单客户主动取消',
      },
    ],
    createdAt: '2026-09-27 18:00',
    updatedAt: '2026-09-28 18:00',
  },
]);

// ====================================================
// 概览统计
// ====================================================

const stats = computed(() => ({
  pending: pendingOrders.value.length,
  urgent: pendingOrders.value.filter((o) => o.slaRisk !== 'safe').length,
  todayTrips: tripList.value.filter(
    (t) => t.planDate === dayjs().format('YYYY-MM-DD'),
  ).length,
  planned: tripList.value.filter((t) => t.status === 'planned').length,
}));

// ====================================================
// Tab 切换
// ====================================================

type TabMode = 'pending' | 'trips';
const tabMode = ref<TabMode>('pending');

// ====================================================
// 待安排工单 - 选择 & 规划行程 Drawer
// ====================================================

const selectedWoIds = ref<string[]>([]);

function toggleSelectWo(id: string) {
  const i = selectedWoIds.value.indexOf(id);
  if (i === -1) selectedWoIds.value.push(id);
  else selectedWoIds.value.splice(i, 1);
}

function selectAllWo() {
  selectedWoIds.value =
    selectedWoIds.value.length === pendingOrders.value.length
      ? []
      : pendingOrders.value.map((o) => o.id);
}

/** 选中工单的城市分布(供 AI 建议参考) */
const selectedWoCities = computed(() => {
  const map = new Map<string, number>();
  selectedWoIds.value.forEach((id) => {
    const wo = pendingOrders.value.find((o) => o.id === id);
    if (wo) {
      map.set(wo.customerLocation, (map.get(wo.customerLocation) ?? 0) + 1);
    }
  });
  return [...map.entries()]
    .toSorted((a, b) => b[1] - a[1])
    .map(([city, count]) => ({ city, count }));
});

/** 选中工单的总时长 */
const selectedWoTotalDuration = computed(() => {
  let sum = 0;
  for (const id of selectedWoIds.value) {
    const wo = pendingOrders.value.find((o) => o.id === id);
    sum += wo?.duration ?? 0;
  }
  return sum;
});

/** 规划行程 Drawer */
const planDrawerOpen = ref(false);
const planSubmitting = ref(false);

const planForm = reactive({
  title: '',
  planDate: dayjs().add(1, 'day'),
  planSlot: '上午' as '上午' | '下午' | '全天',
  ownerId: '',
  remark: '',
});

const planDateModel = computed({
  get: () => planForm.planDate,
  set: (val: dayjs.Dayjs) => {
    planForm.planDate = val;
  },
});

/** 预估时段建议 */
const estimateSlot = computed(() => {
  const hours = selectedWoTotalDuration.value / 60;
  if (hours <= 2.5) return '上午';
  if (hours <= 5) return '下午';
  return '全天';
});

/** AI 建议加载 & 内容 */
const aiSuggestLoading = ref(false);
const aiSuggestions = ref<
  Array<{
    content: string;
    icon: string;
    title: string;
    type: 'engineer' | 'route' | 'sla' | 'time' | 'warning';
  }>
>([]);

async function openPlanDrawer() {
  if (selectedWoIds.value.length === 0) {
    message.warning('请至少选择 1 张工单');
    return;
  }

  // 初始化表单
  const selectedWos = selectedWoIds.value
    .map((id) => pendingOrders.value.find((o) => o.id === id))
    .filter(Boolean) as PendingWo[];

  const cityNames = [...new Set(selectedWos.map((w) => w.customerLocation))];
  const titleCities = cityNames.length <= 2 ? cityNames.join('+') : '多区域';
  const titleTypes = [...new Set(selectedWos.map((w) => w.woType))];
  const mainType = titleTypes.length <= 2 ? titleTypes.join('、') : '综合维修';

  planForm.title = `${titleCities}${mainType}行程`;
  planForm.planDate = dayjs().add(1, 'day');
  planForm.planSlot = estimateSlot.value as '上午' | '下午' | '全天';

  // 智能推荐负责人
  const typeList = [...new Set(selectedWos.map((w) => w.woType))];
  const areaList = [...new Set(selectedWos.map((w) => w.customerLocation))];
  const recommended = engineers.value.find((e) => {
    const skillMatch = typeList.some((t) => e.skills.includes(t));
    const areaMatch = areaList.some((a) => e.area === a || e.area === '全市');
    return skillMatch && areaMatch && e.status !== 'busy';
  });
  planForm.ownerId = recommended?.id ?? engineers.value[0]!.id;

  planForm.remark = '';
  planDrawerOpen.value = true;

  // 加载 AI 建议
  await loadAiSuggestions(selectedWos);
}

async function loadAiSuggestions(selectedWos: PendingWo[]) {
  aiSuggestLoading.value = true;
  aiSuggestions.value = [];
  await new Promise((r) => setTimeout(r, 1000));

  const cityNames = [...new Set(selectedWos.map((w) => w.customerLocation))];
  const typeList = [...new Set(selectedWos.map((w) => w.woType))];
  const slaOverdue = selectedWos.filter((w) => w.slaRisk === 'overdue');
  const slaWarn = selectedWos.filter((w) => w.slaRisk === 'warn');

  const suggestions: typeof aiSuggestions.value = [];

  // 1. 路线优化建议
  if (cityNames.length === 1) {
    suggestions.push({
      type: 'route',
      icon: 'lucide:map-pin',
      title: '同区域集中处理',
      content: `所选工单均在【${cityNames[0]}】，建议按客户地址由近到远排序，减少往返里程约 30-40%。`,
    });
  } else {
    suggestions.push({
      type: 'route',
      icon: 'lucide:map-pin',
      title: '跨区域路线规划',
      content: `工单分布在 ${cityNames.join('、')} 等 ${cityNames.length} 个区域，建议先安排区域 A 的工单，再前往区域 B，可减少约 40 分钟行驶时间。`,
    });
  }

  // 2. 负责人推荐
  const recommended = engineers.value.find((e) => {
    const skillMatch = typeList.some((t) => e.skills.includes(t));
    const areaMatch = cityNames.includes(e.area) || e.area === '全市';
    return skillMatch && areaMatch && e.status !== 'busy';
  });
  if (recommended) {
    const matchTypes = typeList.filter((t) => recommended.skills.includes(t));
    suggestions.push({
      type: 'engineer',
      icon: 'lucide:user-check',
      title: '推荐工程师',
      content: `${recommended.name}（擅长：${matchTypes.join('、')}，服务区域：${recommended.area}，当前负荷：${recommended.workload} 单）匹配度最高。`,
    });
  }

  // 3. 时间建议
  suggestions.push({
    type: 'time',
    icon: 'lucide:clock',
    title: '建议时间安排',
    content: `工单总处理时长约 ${selectedWoTotalDuration.value} 分钟（约 ${Math.round((selectedWoTotalDuration.value / 60) * 10) / 10} 小时），建议安排【${estimateSlot.value}】。`,
  });

  // 4. SLA 预警
  if (slaOverdue.length > 0) {
    const overdueCodes = slaOverdue.map((w) => w.code).join('、');
    suggestions.push({
      type: 'warning',
      icon: 'lucide:alert-triangle',
      title: 'SLA 超时风险',
      content: `${overdueCodes} 已超时，建议优先安排并标注紧急处理，可考虑派遣就近的 ${cityNames} 区域工程师。`,
    });
  }
  if (slaWarn.length > 0) {
    const warnCodes = slaWarn.map((w) => w.code).join('、');
    suggestions.push({
      type: 'sla',
      icon: 'lucide:timer',
      title: 'SLA 即将到期',
      content: `${warnCodes} SLA 剩余时间紧张（< 6 小时），建议本次行程优先处理。`,
    });
  }

  // 5. 补充建议
  if (typeList.includes('电梯故障') || typeList.includes('电气维修')) {
    suggestions.push({
      type: 'warning',
      icon: 'lucide:wrench',
      title: '特殊资质提醒',
      content:
        '涉及电梯/电气作业，需确认工程师持有特种设备操作证，必要时提前联系客户开放作业权限。',
    });
  }

  aiSuggestions.value = suggestions;
  aiSuggestLoading.value = false;
}

async function submitPlan() {
  if (!planForm.title.trim()) {
    message.warning('请填写行程标题');
    return;
  }
  if (!planForm.planDate) {
    message.warning('请选择计划上门日期');
    return;
  }
  if (!planForm.ownerId) {
    message.warning('请选择行程负责人');
    return;
  }

  const owner = engineers.value.find((e) => e.id === planForm.ownerId)!;
  const selectedWos = selectedWoIds.value
    .map((id) => pendingOrders.value.find((o) => o.id === id))
    .filter(Boolean) as PendingWo[];

  planSubmitting.value = true;
  await new Promise((r) => setTimeout(r, 600));

  const now = dayjs().format('YYYY-MM-DD HH:mm');
  const newTrip: TripItem = {
    id: genId(),
    code: `TRIP-${dayjs().format('YYYYMMDD')}-${String(tripList.value.length + 1).padStart(3, '0')}`,
    title: planForm.title.trim(),
    planDate: planForm.planDate.format('YYYY-MM-DD'),
    planSlot: planForm.planSlot,
    owner: owner.name,
    ownerId: owner.id,
    status: 'planned',
    remark: planForm.remark.trim(),
    workOrders: selectedWos.map((w) => ({
      id: w.id,
      code: w.code,
      title: w.title,
      woType: w.woType,
      customer: w.customer,
      device: w.device,
      woStatus: 'pending' as const,
      slaRemaining: w.slaRemaining,
      slaRisk: w.slaRisk,
      sopItems: matchSopItems(w.woType),
    })),
    events: [],
    createdAt: now,
    updatedAt: now,
  };

  tripList.value.unshift(newTrip);
  pendingOrders.value = pendingOrders.value.filter(
    (o) => !selectedWoIds.value.includes(o.id),
  );

  planSubmitting.value = false;
  planDrawerOpen.value = false;
  selectedWoIds.value = [];
  message.success(`行程单 ${newTrip.code} 创建成功`);
  tabMode.value = 'trips';
}

// ====================================================
// 行程单列表 - 变更说明 & 更换负责人
// ====================================================

/** 新增变更事件 Drawer */
const changeDrawerOpen = ref(false);
const changeTargetTrip = ref<null | TripItem>(null);
const changeForm = reactive({
  type: 'note' as TripChangeEvent['type'],
  content: '',
});

function openChangeDrawer(trip: TripItem, type?: TripChangeEvent['type']) {
  changeTargetTrip.value = trip;
  changeForm.type = type ?? 'note';
  changeForm.content = '';
  changeDrawerOpen.value = true;
}

function submitChange() {
  if (!changeForm.content.trim()) {
    message.warning('请填写变更说明内容');
    return;
  }
  if (!changeTargetTrip.value) return;

  const trip = tripList.value.find((t) => t.id === changeTargetTrip.value!.id);
  if (!trip) return;

  const newEvent: TripChangeEvent = {
    id: genId(),
    type: changeForm.type,
    time: dayjs().format('YYYY-MM-DD HH:mm'),
    operator: '当前调度员',
    content: changeForm.content.trim(),
  };
  trip.events.push(newEvent);
  trip.updatedAt = dayjs().format('YYYY-MM-DD HH:mm');

  changeDrawerOpen.value = false;
  changeTargetTrip.value = null;
  message.success('变更说明已添加');
}

/** 更换负责人 Drawer */
const ownerDrawerOpen = ref(false);
const ownerTargetTrip = ref<null | TripItem>(null);
const newOwnerId = ref<string>('');

function openOwnerDrawer(trip: TripItem) {
  ownerTargetTrip.value = trip;
  newOwnerId.value = trip.ownerId;
  ownerDrawerOpen.value = true;
}

function submitOwnerChange() {
  if (!ownerTargetTrip.value) return;
  if (!newOwnerId.value) {
    message.warning('请选择新的负责人');
    return;
  }

  const trip = tripList.value.find((t) => t.id === ownerTargetTrip.value!.id);
  if (!trip) return;

  const newOwner = engineers.value.find((e) => e.id === newOwnerId.value)!;
  const fromName = trip.owner;
  const now = dayjs().format('YYYY-MM-DD HH:mm');

  trip.events.push({
    id: genId(),
    type: 'owner-change',
    time: now,
    operator: '当前调度员',
    content: `负责人变更：${fromName} → ${newOwner.name}`,
    from: fromName,
    to: newOwner.name,
  });

  trip.owner = newOwner.name;
  trip.ownerId = newOwner.id;
  trip.updatedAt = now;

  ownerDrawerOpen.value = false;
  ownerTargetTrip.value = null;
  message.success(`行程负责人已变更为 ${newOwner.name}`);
}

/** 展开/折叠行程工单列表 */
const expandedTripIds = ref<Set<string>>(new Set());

function toggleTripExpand(tripId: string) {
  if (expandedTripIds.value.has(tripId)) {
    expandedTripIds.value.delete(tripId);
  } else {
    expandedTripIds.value.add(tripId);
  }
}

// ====================================================
// 工具函数
// ====================================================

const woTypeTagColor: Record<WoType, string> = {
  设备故障: 'red',
  空调故障: 'cyan',
  电梯故障: 'geekblue',
  设备巡检: 'blue',
  打印机维修: 'purple',
  网络调试: 'orange',
  电气维修: 'magenta',
};

const woStatusLabel: Record<WoStatus, string> = {
  pending: '待处理',
  dispatched: '待接单',
  processing: '处理中',
  completed: '已完成',
};

const woStatusColor: Record<WoStatus, string> = {
  pending: 'default',
  dispatched: 'blue',
  processing: 'processing',
  completed: 'green',
};

const slaRiskColor: Record<SlaRisk, string> = {
  safe: 'blue',
  warn: 'orange',
  overdue: 'red',
};

const tripStatusLabel: Record<TripStatus, string> = {
  planned: '已规划',
  ongoing: '执行中',
  completed: '已完成',
  cancelled: '已取消',
};

const tripStatusColor: Record<TripStatus, string> = {
  planned: 'blue',
  ongoing: 'processing',
  completed: 'green',
  cancelled: 'default',
};

const ownerStatusColor: Record<Engineer['status'], string> = {
  online: 'green',
  busy: 'orange',
  offline: 'default',
};

function priorityColor(p: PendingWo['priority']) {
  return (
    { urgent: 'red', high: 'orange', medium: 'blue', low: 'default' } as const
  )[p];
}

function priorityLabel(p: PendingWo['priority']) {
  return { urgent: '紧急', high: '高', medium: '中', low: '低' }[p];
}
</script>

<template>
  <section class="dw-page">
    <!-- ===== 顶部标题 ===== -->
    <header class="dw-header">
      <div class="dw-header__title">
        <div class="dw-header__icon">
          <Icon icon="lucide:compass" class="size-5" />
        </div>
        <div>
          <div class="dw-header__name">调度工作台</div>
          <div class="dw-header__meta">
            从工单收集 → AI 智能规划 → 人工确认 → 行程执行 → 动态优化
          </div>
        </div>
      </div>
      <div class="dw-header__actions">
        <Button size="small">
          <Icon icon="lucide:download" class="size-3.5" />
          导出报表
        </Button>
        <Button type="primary" size="small">
          <Icon icon="lucide:refresh-cw" class="size-3.5" />
          刷新数据
        </Button>
      </div>
    </header>

    <!-- ===== 统计卡片 ===== -->
    <div class="dw-stats">
      <div class="dw-stat dw-stat--amber">
        <div class="dw-stat__icon">
          <Icon icon="lucide:clipboard-list" class="size-5" />
        </div>
        <div class="dw-stat__body">
          <div class="dw-stat__num">{{ stats.pending }}</div>
          <div class="dw-stat__label">待安排工单</div>
        </div>
      </div>
      <div class="dw-stat dw-stat--red">
        <div class="dw-stat__icon">
          <Icon icon="lucide:alert-circle" class="size-5" />
        </div>
        <div class="dw-stat__body">
          <div class="dw-stat__num">{{ stats.urgent }}</div>
          <div class="dw-stat__label">SLA 风险中</div>
        </div>
      </div>
      <div class="dw-stat dw-stat--blue">
        <div class="dw-stat__icon">
          <Icon icon="lucide:calendar-check" class="size-5" />
        </div>
        <div class="dw-stat__body">
          <div class="dw-stat__num">{{ stats.todayTrips }}</div>
          <div class="dw-stat__label">今日行程</div>
        </div>
      </div>
      <div class="dw-stat dw-stat--emerald">
        <div class="dw-stat__icon">
          <Icon icon="lucide:route" class="size-5" />
        </div>
        <div class="dw-stat__body">
          <div class="dw-stat__num">{{ stats.planned }}</div>
          <div class="dw-stat__label">已规划待执行</div>
        </div>
      </div>
    </div>

    <!-- ===== Tab 切换 ===== -->
    <div class="dw-tabs">
      <button
        class="dw-tab"
        :class="{ 'is-active': tabMode === 'pending' }"
        @click="tabMode = 'pending'"
      >
        <Icon icon="lucide:clipboard-list" class="size-4" />
        待安排工单
        <span class="dw-tab__badge">{{ pendingOrders.length }}</span>
      </button>
      <button
        class="dw-tab"
        :class="{ 'is-active': tabMode === 'trips' }"
        @click="tabMode = 'trips'"
      >
        <Icon icon="lucide:route" class="size-4" />
        行程单列表
        <span class="dw-tab__badge">{{ tripList.length }}</span>
      </button>
    </div>

    <!-- ==================================================== -->
    <!--  待安排工单 Tab                                      -->
    <!-- ==================================================== -->
    <div v-if="tabMode === 'pending'" class="dw-panel">
      <div class="dw-card">
        <div class="dw-card__head">
          <div>
            <h3 class="dw-card__title">
              <Icon icon="lucide:clipboard-check" class="size-4" />
              待安排工单清单
            </h3>
            <p class="dw-help mt-1">
              勾选工单，点击「规划行程」创建行程单；勾选后右侧 Drawer 将提供 AI
              智能建议
            </p>
          </div>
          <div class="dw-card__actions">
            <Button size="small" @click="selectAllWo">
              {{
                selectedWoIds.length === pendingOrders.length &&
                pendingOrders.length > 0
                  ? '取消全选'
                  : '全选'
              }}
            </Button>
            <Button
              type="primary"
              :loading="planSubmitting"
              :disabled="selectedWoIds.length === 0"
              @click="openPlanDrawer"
            >
              <Icon icon="lucide:sparkles" class="size-3.5" />
              规划行程{{
                selectedWoIds.length > 0 ? ` (${selectedWoIds.length})` : ''
              }}
            </Button>
          </div>
        </div>

        <!-- 表格 -->
        <div class="dw-table-wrap">
          <div class="dw-table">
            <!-- 表头 -->
            <div class="dw-table__head">
              <div class="col-check"></div>
              <div class="col-code">工单号</div>
              <div class="col-title">工单标题</div>
              <div class="col-type">工单类型</div>
              <div class="col-customer">客户 / 设备</div>
              <div class="col-status">工单状态</div>
              <div class="col-sla">SLA 剩余</div>
              <div class="col-priority">优先级</div>
            </div>

            <!-- 数据行 -->
            <div v-if="pendingOrders.length === 0" class="dw-empty-row">
              <Icon
                icon="lucide:party-popper"
                class="size-8 text-emerald-400"
              />
              所有工单都已安排完毕 🎉
            </div>

            <div
              v-for="wo in pendingOrders"
              :key="wo.id"
              class="dw-row"
              :class="{
                'is-selected': selectedWoIds.includes(wo.id),
                'risk-warn': wo.slaRisk === 'warn',
                'risk-overdue': wo.slaRisk === 'overdue',
              }"
              @click="toggleSelectWo(wo.id)"
            >
              <div class="col-check">
                <span
                  class="dw-check"
                  :class="{ 'is-checked': selectedWoIds.includes(wo.id) }"
                >
                  <Icon
                    v-if="selectedWoIds.includes(wo.id)"
                    icon="lucide:check"
                    class="size-3"
                  />
                </span>
              </div>
              <div class="col-code">
                <span class="dw-mono dw-code">{{ wo.code }}</span>
              </div>
              <div class="col-title">
                <div class="wo-title">{{ wo.title }}</div>
                <div class="wo-desc">{{ wo.problemDesc }}</div>
              </div>
              <div class="col-type">
                <Tag :color="woTypeTagColor[wo.woType]" class="mini-tag">
                  {{ wo.woType }}
                </Tag>
              </div>
              <div class="col-customer">
                <div class="wo-customer">
                  <Icon icon="lucide:building-2" class="size-3" />
                  {{ wo.customer }}
                </div>
                <div class="wo-device">
                  <Icon icon="lucide:monitor" class="size-3" />
                  {{ wo.device }}
                </div>
                <div class="wo-location">
                  <Icon icon="lucide:map-pin" class="size-3" />
                  {{ wo.customerLocation }}
                </div>
              </div>
              <div class="col-status">
                <Tag :color="woStatusColor[wo.woStatus]" class="mini-tag">
                  {{ woStatusLabel[wo.woStatus] }}
                </Tag>
              </div>
              <div class="col-sla">
                <span class="sla-text" :class="`sla-${wo.slaRisk}`">
                  <Icon
                    :icon="
                      wo.slaRisk === 'overdue'
                        ? 'lucide:alert-triangle'
                        : wo.slaRisk === 'warn'
                          ? 'lucide:timer'
                          : 'lucide:clock'
                    "
                    class="size-3"
                  />
                  {{ wo.slaRemaining }}
                </span>
              </div>
              <div class="col-priority">
                <Tag :color="priorityColor(wo.priority)" class="mini-tag">
                  {{ priorityLabel(wo.priority) }}
                </Tag>
              </div>
            </div>
          </div>
        </div>

        <!-- 表格下方摘要 -->
        <div class="dw-table__foot">
          <div class="foot-left">
            <span>
              已选
              <strong class="text-emerald-600">
                {{ selectedWoIds.length }}
              </strong>
              / {{ pendingOrders.length }}
            </span>
            <span v-if="selectedWoIds.length > 0">
              · 涉及
              <strong>{{ selectedWoCities.length }}</strong>
              个区域 · 预估总时长
              <strong>{{ selectedWoTotalDuration }}</strong>
              分钟
            </span>
          </div>
          <div class="foot-right">
            <span
              v-if="selectedWoIds.length > 0 && selectedWoIds.length < 6"
              class="text-amber-600"
            >
              💡 工单数量较少，建议先查看 AI 建议后再确认
            </span>
            <span v-else-if="selectedWoIds.length >= 6" class="text-blue-600">
              💡 工单较多，AI 将提供最优路线建议
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================== -->
    <!--  行程单列表 Tab                                      -->
    <!-- ==================================================== -->
    <div v-else class="dw-panel">
      <!-- 状态统计条 -->
      <div class="dw-status-bar">
        <div class="status-item">
          <span class="status-dot status-dot--blue"></span>
          已规划
          <span class="status-count">
            {{ tripList.filter((t) => t.status === 'planned').length }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-dot status-dot--processing"></span>
          执行中
          <span class="status-count">
            {{ tripList.filter((t) => t.status === 'ongoing').length }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-dot status-dot--green"></span>
          已完成
          <span class="status-count">
            {{ tripList.filter((t) => t.status === 'completed').length }}
          </span>
        </div>
        <div class="status-item">
          <span class="status-dot status-dot--gray"></span>
          已取消
          <span class="status-count">
            {{ tripList.filter((t) => t.status === 'cancelled').length }}
          </span>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="tripList.length === 0" class="dw-empty-state">
        <Icon icon="lucide:route-off" class="size-12 text-slate-300" />
        <div class="dw-empty-state__title">暂无行程单</div>
        <div class="dw-empty-state__desc">
          先从「待安排工单」中选择工单创建行程
        </div>
      </div>

      <!-- 行程单列表 -->
      <div v-for="trip in tripList" :key="trip.id" class="dw-trip-card">
        <!-- 行程头部 -->
        <div
          class="dw-trip-head"
          :class="{
            'is-ongoing': trip.status === 'ongoing',
            'is-completed': trip.status === 'completed',
          }"
        >
          <div class="dw-trip-head__main">
            <div class="dw-trip-head__row1">
              <span class="dw-mono trip-code">{{ trip.code }}</span>
              <h4 class="trip-title">{{ trip.title }}</h4>
              <Tag :color="tripStatusColor[trip.status]" class="mini-tag">
                {{ tripStatusLabel[trip.status] }}
              </Tag>
            </div>
            <div class="dw-trip-head__row2">
              <span class="trip-meta">
                <Icon icon="lucide:calendar" class="size-3" />
                {{ trip.planDate }}
              </span>
              <span class="trip-meta">
                <Icon icon="lucide:clock" class="size-3" />
                {{ trip.planSlot }}
              </span>
              <span class="trip-meta">
                <Icon icon="lucide:user" class="size-3" />
                {{ trip.owner }}
              </span>
              <span class="trip-meta">
                <Icon icon="lucide:clipboard-list" class="size-3" />
                {{ trip.workOrders.length }} 张工单
              </span>
              <span v-if="trip.events.length > 0" class="trip-meta has-event">
                <Icon icon="lucide:file-edit" class="size-3" />
                {{ trip.events.length }} 条变更
              </span>
            </div>
          </div>
          <div class="dw-trip-head__actions">
            <Button
              size="small"
              :disabled="
                trip.status === 'cancelled' || trip.status === 'completed'
              "
              @click.stop="openOwnerDrawer(trip)"
            >
              <Icon icon="lucide:user-round-pen" class="size-3.5" />
              更换负责人
            </Button>
            <Button size="small" @click.stop="openChangeDrawer(trip)">
              <Icon icon="lucide:file-edit" class="size-3.5" />
              补充说明
            </Button>
            <Button
              size="small"
              :type="expandedTripIds.has(trip.id) ? 'primary' : 'default'"
              @click.stop="toggleTripExpand(trip.id)"
            >
              <Icon
                :icon="
                  expandedTripIds.has(trip.id)
                    ? 'lucide:chevron-up'
                    : 'lucide:chevron-down'
                "
                class="size-3.5"
              />
              {{ expandedTripIds.has(trip.id) ? '收起详情' : '展开工单' }}
            </Button>
          </div>
        </div>

        <!-- 展开区域：关联工单列表 + 变更事件时间线 -->
        <div v-if="expandedTripIds.has(trip.id)" class="dw-trip-expand">
          <!-- 关联工单表格 -->
          <div class="expand-section">
            <div class="expand-section__title">
              <Icon icon="lucide:clipboard-list" class="size-4" />
              关联工单
            </div>
            <div class="dw-sub-table">
              <div class="dw-sub-table__head">
                <div class="sub-col-code">工单号</div>
                <div class="sub-col-title">工单标题</div>
                <div class="sub-col-type">类型</div>
                <div class="sub-col-customer">客户 / 设备</div>
                <div class="sub-col-status">状态</div>
                <div class="sub-col-sla">SLA</div>
              </div>
              <div
                v-for="wo in trip.workOrders"
                :key="wo.id"
                class="dw-sub-row"
              >
                <div class="sub-col-code">
                  <span class="dw-mono dw-code">{{ wo.code }}</span>
                </div>
                <div class="sub-col-title">{{ wo.title }}</div>
                <div class="sub-col-type">
                  <Tag :color="woTypeTagColor[wo.woType]" class="mini-tag">
                    {{ wo.woType }}
                  </Tag>
                </div>
                <div class="sub-col-customer">
                  <div>{{ wo.customer }}</div>
                  <div class="text-xs text-slate-400">{{ wo.device }}</div>
                </div>
                <div class="sub-col-status">
                  <Tag :color="woStatusColor[wo.woStatus]" class="mini-tag">
                    {{ woStatusLabel[wo.woStatus] }}
                  </Tag>
                </div>
                <div class="sub-col-sla">
                  <span :class="`sla-text sla-${wo.slaRisk}`">
                    {{ wo.slaRemaining }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 变更事件时间线 -->
          <div v-if="trip.events.length > 0" class="expand-section">
            <div class="expand-section__title">
              <Icon icon="lucide:clock-3" class="size-4" />
              变更记录
            </div>
            <div class="dw-event-timeline">
              <div
                v-for="(evt, idx) in [...trip.events].reverse()"
                :key="evt.id"
                class="dw-event-item"
              >
                <div class="dw-event-dot" :class="`dot-${evt.type}`"></div>
                <div
                  v-if="idx < trip.events.length - 1"
                  class="dw-event-line"
                ></div>
                <div class="dw-event-body">
                  <div class="dw-event-header">
                    <Tag
                      :color="
                        {
                          'owner-change': 'orange',
                          note: 'blue',
                          'slot-change': 'purple',
                          cancel: 'red',
                        }[evt.type]
                      "
                      class="mini-tag"
                    >
                      {{
                        {
                          'owner-change': '负责人变更',
                          note: '补充说明',
                          'slot-change': '时段调整',
                          cancel: '取消行程',
                        }[evt.type]
                      }}
                    </Tag>
                    <span class="dw-event-meta">
                      {{ evt.time }} · {{ evt.operator }}
                    </span>
                  </div>
                  <div class="dw-event-content">{{ evt.content }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 备注 -->
          <div v-if="trip.remark" class="expand-section">
            <div class="expand-section__title">
              <Icon icon="lucide:file-text" class="size-4" />
              行程备注
            </div>
            <div class="dw-trip-remark">{{ trip.remark }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================== -->
    <!--  规划行程 Drawer                                     -->
    <!-- ==================================================== -->
    <Drawer
      v-model:open="planDrawerOpen"
      title="规划行程"
      width="780px"
      :footer="null"
      :destroy-on-close="true"
      class="plan-drawer"
    >
      <div v-if="planDrawerOpen" class="plan-container">
        <!-- 左侧：表单 -->
        <div class="plan-form-side">
          <!-- 选中工单预览 -->
          <div class="plan-selected">
            <div class="plan-selected__title">
              <Icon icon="lucide:clipboard-check" class="size-4" />
              已选择 {{ selectedWoIds.length }} 张工单
            </div>
            <div class="plan-selected__list">
              <div
                v-for="id in selectedWoIds"
                :key="id"
                class="plan-selected-item"
              >
                <span class="dw-mono dw-code">
                  {{ pendingOrders.find((o) => o.id === id)?.code }}
                </span>
                <span class="plan-wo-title">
                  {{ pendingOrders.find((o) => o.id === id)?.title }}
                </span>
                <Tag
                  :color="
                    slaRiskColor[
                      pendingOrders.find((o) => o.id === id)?.slaRisk ?? 'safe'
                    ]
                  "
                  class="mini-tag"
                >
                  {{ pendingOrders.find((o) => o.id === id)?.slaRemaining }}
                </Tag>
              </div>
            </div>
          </div>

          <!-- 表单 -->
          <Form layout="vertical" class="plan-form">
            <FormItem label="行程标题" required>
              <Input
                v-model:value="planForm.title"
                placeholder="如：浦东空调故障集中处理"
                :maxlength="40"
                show-count
              />
            </FormItem>

            <div class="form-row">
              <FormItem label="计划上门日期" required class="form-col">
                <DatePicker
                  v-model:value="planDateModel"
                  class="w-full"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  :disabled-date="
                    (date: dayjs.Dayjs) => date.isBefore(dayjs(), 'day')
                  "
                />
              </FormItem>
              <FormItem label="计划时段" required class="form-col">
                <Select
                  v-model:value="planForm.planSlot"
                  class="w-full"
                  :options="[
                    { label: '上午 (09:00-12:00)', value: '上午' },
                    { label: '下午 (13:00-18:00)', value: '下午' },
                    { label: '全天', value: '全天' },
                  ]"
                />
              </FormItem>
            </div>

            <FormItem label="行程负责人" required>
              <Select v-model:value="planForm.ownerId" class="w-full">
                <SelectOption
                  v-for="eng in engineers"
                  :key="eng.id"
                  :value="eng.id"
                >
                  <div class="owner-option">
                    <span class="owner-name">{{ eng.name }}</span>
                    <Tag :color="ownerStatusColor[eng.status]" class="mini-tag">
                      {{
                        { online: '在线', busy: '忙碌', offline: '离线' }[
                          eng.status
                        ]
                      }}
                    </Tag>
                    <span class="owner-info">
                      {{ eng.area }} · 负荷 {{ eng.workload }} · 擅长
                      {{ eng.skills.join('、') }}
                    </span>
                  </div>
                </SelectOption>
              </Select>
            </FormItem>

            <FormItem label="备注信息">
              <Textarea
                v-model:value="planForm.remark"
                placeholder="可选，填写行程特别注意事项"
                :rows="3"
                :maxlength="200"
                show-count
              />
            </FormItem>
          </Form>

          <!-- 提交按钮 -->
          <div class="plan-actions">
            <Button size="large" @click="planDrawerOpen = false">取消</Button>
            <Button
              type="primary"
              size="large"
              :loading="planSubmitting"
              block
              @click="submitPlan"
            >
              <Icon icon="lucide:check" class="size-4" />
              确认创建行程单
            </Button>
          </div>
        </div>

        <!-- 右侧：AI 建议 -->
        <div class="plan-ai-side">
          <div class="plan-ai-header">
            <div class="plan-ai-title">
              <Icon icon="lucide:sparkles" class="size-4" />
              AI 行程建议
            </div>
            <div class="plan-ai-sub">
              基于所选工单的客户、城市、问题情况生成
            </div>
          </div>

          <!-- 快速概览 -->
          <div class="plan-ai-summary">
            <div class="ai-summary-item">
              <div class="ai-summary-val">{{ selectedWoIds.length }}</div>
              <div class="ai-summary-lb">工单数量</div>
            </div>
            <div class="ai-summary-item">
              <div class="ai-summary-val">{{ selectedWoCities.length }}</div>
              <div class="ai-summary-lb">涉及区域</div>
            </div>
            <div class="ai-summary-item">
              <div class="ai-summary-val">{{ selectedWoTotalDuration }}m</div>
              <div class="ai-summary-lb">预估工时</div>
            </div>
          </div>

          <!-- AI 建议列表 -->
          <div class="plan-ai-list">
            <Spin v-if="aiSuggestLoading" tip="AI 分析中..." />

            <template v-else>
              <div
                v-for="(s, idx) in aiSuggestions"
                :key="idx"
                class="ai-suggest-card"
                :class="`suggest-${s.type}`"
              >
                <div class="ai-suggest-icon">
                  <Icon :icon="s.icon" class="size-4" />
                </div>
                <div class="ai-suggest-body">
                  <div class="ai-suggest-title">
                    {{ s.title }}
                  </div>
                  <div class="ai-suggest-content">
                    {{ s.content }}
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- 免责声明 -->
          <div class="plan-ai-footer">
            <Icon icon="lucide:info" class="size-3.5" />
            AI 建议仅供参考，最终行程安排请结合实际情况确认
          </div>
        </div>
      </div>
    </Drawer>

    <!-- ==================================================== -->
    <!--  变更说明 Drawer                                     -->
    <!-- ==================================================== -->
    <Drawer
      v-model:open="changeDrawerOpen"
      title="添加变更说明"
      width="460px"
      :footer="null"
      :destroy-on-close="true"
    >
      <div v-if="changeTargetTrip">
        <div class="dw-subject">
          <span class="dw-mono">{{ changeTargetTrip.code }}</span>
          <span class="text-slate-500">· {{ changeTargetTrip.title }}</span>
        </div>
        <Form layout="vertical" class="mt-4">
          <FormItem label="变更类型">
            <Select v-model:value="changeForm.type" class="w-full">
              <SelectOption value="note">补充说明（默认）</SelectOption>
              <SelectOption value="slot-change">时段调整</SelectOption>
              <SelectOption value="cancel">取消行程</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="说明内容" required>
            <Textarea
              v-model:value="changeForm.content"
              :placeholder="
                changeForm.type === 'slot-change'
                  ? '请说明时段变更原因和新的计划安排'
                  : changeForm.type === 'cancel'
                    ? '请说明取消行程的原因'
                    : '请填写本次行程的补充说明或调整原因'
              "
              :rows="4"
              :maxlength="300"
              show-count
            />
          </FormItem>
        </Form>
        <div class="mt-6 flex gap-2">
          <Button size="large" class="flex-1" @click="changeDrawerOpen = false">
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            class="flex-1"
            :loading="planSubmitting"
            @click="submitChange"
          >
            <Icon icon="lucide:check" class="size-4" />
            提交
          </Button>
        </div>
      </div>
    </Drawer>

    <!-- ==================================================== -->
    <!--  更换负责人 Drawer                                   -->
    <!-- ==================================================== -->
    <Drawer
      v-model:open="ownerDrawerOpen"
      title="更换行程负责人"
      width="460px"
      :footer="null"
      :destroy-on-close="true"
    >
      <div v-if="ownerTargetTrip">
        <div class="dw-subject">
          <span class="dw-mono">{{ ownerTargetTrip.code }}</span>
          <span class="text-slate-500">
            · 当前负责人：{{ ownerTargetTrip.owner }}
          </span>
        </div>
        <Form layout="vertical" class="mt-4">
          <FormItem label="选择新负责人" required>
            <Select
              v-model:value="newOwnerId"
              class="w-full"
              :disabled="planSubmitting"
            >
              <SelectOption
                v-for="eng in engineers"
                :key="eng.id"
                :value="eng.id"
              >
                <div class="owner-option">
                  <span class="owner-name">{{ eng.name }}</span>
                  <Tag :color="ownerStatusColor[eng.status]" class="mini-tag">
                    {{
                      { online: '在线', busy: '忙碌', offline: '离线' }[
                        eng.status
                      ]
                    }}
                  </Tag>
                  <span class="owner-info">
                    {{ eng.area }} · 负荷 {{ eng.workload }}
                  </span>
                </div>
              </SelectOption>
            </Select>
          </FormItem>
        </Form>
        <div class="mt-6 flex gap-2">
          <Button size="large" class="flex-1" @click="ownerDrawerOpen = false">
            取消
          </Button>
          <Button
            type="primary"
            size="large"
            class="flex-1"
            :loading="planSubmitting"
            @click="submitOwnerChange"
          >
            <Icon icon="lucide:swap" class="size-4" />
            确认更换
          </Button>
        </div>
      </div>
    </Drawer>
  </section>
</template>

<style scoped>
/* =====================================================
   响应式
   ===================================================== */
@media (max-width: 1200px) {
  .dw-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .plan-container {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dw-stats {
    grid-template-columns: 1fr;
  }

  .dw-table__head {
    display: none;
  }

  .dw-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}

.dw-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.dw-header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0 4px;
}

.dw-header__title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.dw-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65 0%, #10b981 100%);
  border-radius: 10px;
}

.dw-header__name {
  font-size: 18px;
  font-weight: 700;
  color: #0c4a3f;
}

.dw-header__meta {
  margin-top: 2px;
  font-size: 12px;
  color: #869b94;
}

.dw-header__actions {
  display: flex;
  gap: 8px;
}

/* =====================================================
   统计卡片
   ===================================================== */
.dw-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.dw-stat {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
  transition: all 0.18s;
}

.dw-stat:hover {
  border-color: #0b6e65;
  box-shadow: 0 2px 8px rgb(11 110 101 / 6%);
}

.dw-stat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.dw-stat__num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: #0c4a3f;
}

.dw-stat__label {
  margin-top: 2px;
  font-size: 12px;
  color: #869b94;
}

.dw-stat--amber .dw-stat__icon {
  color: #ea580c;
  background: #fff7ed;
}

.dw-stat--red .dw-stat__icon {
  color: #dc2626;
  background: #fef2f2;
}

.dw-stat--blue .dw-stat__icon {
  color: #2563eb;
  background: #eff6ff;
}

.dw-stat--emerald .dw-stat__icon {
  color: #059669;
  background: #ecfdf5;
}

/* =====================================================
   Tab
   ===================================================== */
.dw-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: #f1f7f4;
  border-radius: 10px;
}

.dw-tab {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #5e7a72;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 8px;
  transition: all 0.18s;
}

.dw-tab:hover {
  background: rgb(255 255 255 / 60%);
}

.dw-tab.is-active {
  color: #0c4a3f;
  background: #fff;
  box-shadow: 0 1px 3px rgb(12 74 63 / 12%);
}

.dw-tab__badge {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  color: #059669;
  background: rgb(14 165 133 / 12%);
  border-radius: 10px;
}

/* =====================================================
   卡片 & 通用
   ===================================================== */
.dw-card {
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.dw-card__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1px solid #eef4f1;
}

.dw-card__title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0c4a3f;
}

.dw-help {
  margin: 0;
  font-size: 12px;
  color: #869b94;
}

.dw-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dw-mono {
  font-family: 'SF Mono', Menlo, ui-monospace, monospace;
}

.dw-code {
  font-size: 12px;
  font-weight: 600;
  color: #5e7a72;
  letter-spacing: 0.02em;
}

/* =====================================================
   待安排工单表格
   ===================================================== */
.dw-table-wrap {
  padding: 0;
}

.dw-table {
  overflow: hidden;
}

.dw-table__head {
  display: grid;
  grid-template-columns: 40px 140px 1fr 110px 1fr 100px 130px 80px;
  gap: 8px;
  align-items: center;
  padding: 10px 18px;
  font-size: 12px;
  font-weight: 600;
  color: #5e7a72;
  background: #f6faf8;
}

.dw-row {
  display: grid;
  grid-template-columns: 40px 140px 1fr 110px 1fr 100px 130px 80px;
  gap: 8px;
  align-items: center;
  padding: 12px 18px;
  cursor: pointer;
  border-bottom: 1px solid #eef4f1;
  transition: background 0.15s;
}

.dw-row:last-child {
  border-bottom: none;
}

.dw-row:hover {
  background: #f6faf8;
}

.dw-row.is-selected {
  background: #e1f5ee;
  box-shadow: inset 3px 0 0 #0b6e65;
}

.dw-row.risk-warn {
  box-shadow: inset 3px 0 0 #f59e0b;
}

.dw-row.risk-overdue {
  box-shadow: inset 3px 0 0 #dc2626;
}

.dw-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  transition: all 0.15s;
}

.dw-check.is-checked {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

/* 列样式 */
.col-check {
  display: flex;
  justify-content: center;
}

.col-title .wo-title {
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

.col-title .wo-desc {
  max-width: 300px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: #869b94;
  white-space: nowrap;
}

.col-customer {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wo-customer,
.wo-device,
.wo-location {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #5e7a72;
}

.wo-customer {
  font-size: 12px;
  font-weight: 500;
  color: #0c4a3f;
}

.wo-device {
  color: #869b94;
}

.wo-location {
  color: #869b94;
}

.sla-text {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
}

.sla-safe {
  color: #1d4ed8;
  background: #eff6ff;
}

.sla-warn {
  color: #b45309;
  background: #fffbeb;
}

.sla-overdue {
  color: #b91c1c;
  background: #fef2f2;
}

.mini-tag {
  padding: 0 6px !important;
  font-size: 11px !important;
  line-height: 18px !important;
}

/* 空行 */
.dw-empty-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #94a3b8;
  text-align: center;
}

/* 表格底部 */
.dw-table__foot {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  font-size: 12px;
  color: #5e7a72;
  background: #fafcfb;
  border-top: 1px solid #eef4f1;
  border-radius: 0 0 12px 12px;
}

.foot-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.foot-right {
  color: #869b94;
}

/* =====================================================
   行程单 Tab
   ===================================================== */
.dw-panel {
  width: 100%;
}

.dw-status-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 12px 18px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.status-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: #5e7a72;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot--blue {
  background: #1677ff;
}

.status-dot--processing {
  background: #13c2c2;
}

.status-dot--green {
  background: #52c41a;
}

.status-dot--gray {
  background: #d9d9d9;
}

.status-count {
  font-weight: 700;
  color: #0c4a3f;
}

.dw-empty-state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.dw-empty-state__title {
  font-size: 14px;
  font-weight: 600;
  color: #5e7a72;
}

.dw-empty-state__desc {
  font-size: 12px;
  color: #869b94;
}

/* 行程单卡片 */
.dw-trip-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
  transition: all 0.18s;
}

.dw-trip-card + .dw-trip-card {
  margin-top: 12px;
}

.dw-trip-head {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
}

.dw-trip-head.is-ongoing {
  background: linear-gradient(90deg, #eff6ff 0%, #fff 30%);
  border-bottom: 2px solid #1677ff;
}

.dw-trip-head.is-completed {
  background: #fafcfb;
  opacity: 0.85;
}

.dw-trip-head__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.dw-trip-head__row1 {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.trip-code {
  padding: 2px 8px;
  font-size: 13px;
  font-weight: 600;
  color: #0b6e65;
  background: #e1f5ee;
  border-radius: 4px;
}

.trip-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0c4a3f;
}

.dw-trip-head__row2 {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  font-size: 12px;
  color: #869b94;
}

.trip-meta {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.trip-meta.has-event {
  font-weight: 500;
  color: #b45309;
}

.dw-trip-head__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

/* 展开区域 */
.dw-trip-expand {
  padding: 0 18px 16px;
  background: #fafcfb;
  border-top: 1px dashed #e4edea;
}

.expand-section {
  padding-top: 14px;
}

.expand-section + .expand-section {
  border-top: 1px dashed #e4edea;
}

.expand-section__title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

/* 关联工单子表格 */
.dw-sub-table {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 8px;
}

.dw-sub-table__head {
  display: grid;
  grid-template-columns: 130px 1fr 90px 1fr 80px 120px;
  gap: 8px;
  align-items: center;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  color: #5e7a72;
  background: #f6faf8;
}

.dw-sub-row {
  display: grid;
  grid-template-columns: 130px 1fr 90px 1fr 80px 120px;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #eef4f1;
}

.dw-sub-row:last-child {
  border-bottom: none;
}

.dw-sub-row:hover {
  background: #fafcfb;
}

/* 变更时间线 */
.dw-event-timeline {
  position: relative;
  padding-left: 4px;
}

.dw-event-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 6px 0;
}

.dw-event-dot {
  position: absolute;
  top: 10px;
  left: 0;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #cbd5e1;
}

.dw-event-dot.dot-note {
  background: #1677ff;
  box-shadow: 0 0 0 2px #1677ff;
}

.dw-event-dot.dot-owner-change {
  background: #fa8c16;
  box-shadow: 0 0 0 2px #fa8c16;
}

.dw-event-dot.dot-slot-change {
  background: #722ed1;
  box-shadow: 0 0 0 2px #722ed1;
}

.dw-event-dot.dot-cancel {
  background: #ff4d4f;
  box-shadow: 0 0 0 2px #ff4d4f;
}

.dw-event-line {
  position: absolute;
  top: 22px;
  left: 4px;
  width: 1px;
  height: calc(100% - 6px);
  background: #e4edea;
}

.dw-event-body {
  flex: 1;
  padding-bottom: 4px;
}

.dw-event-header {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dw-event-meta {
  font-size: 12px;
  color: #869b94;
}

.dw-event-content {
  margin-top: 4px;
  font-size: 13px;
  color: #334155;
}

.dw-trip-remark {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #5e7a72;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 8px;
}

/* =====================================================
   规划行程 Drawer
   ===================================================== */
.plan-container {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 320px);
  gap: 20px;
  min-height: 500px;
}

.plan-form-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-selected {
  padding: 12px 14px;
  background: #f6faf8;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.plan-selected__title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

.plan-selected__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 160px;
  overflow-y: auto;
}

.plan-selected-item {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  font-size: 12px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 6px;
}

.plan-selected-item .plan-wo-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #0c4a3f;
  white-space: nowrap;
}

.plan-form {
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.owner-option {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.owner-name {
  font-weight: 600;
}

.owner-info {
  font-size: 12px;
  color: #869b94;
}

.plan-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  margin-top: auto;
  border-top: 1px solid #eef4f1;
}

/* AI 建议侧 */
.plan-ai-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: linear-gradient(165deg, #fafbff 0%, #f0fdf4 100%);
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.plan-ai-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plan-ai-title {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.plan-ai-sub {
  font-size: 12px;
  color: #869b94;
}

.plan-ai-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 12px 10px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 10px;
}

.ai-summary-item {
  text-align: center;
}

.ai-summary-val {
  font-size: 18px;
  font-weight: 700;
  color: #0b6e65;
}

.ai-summary-lb {
  margin-top: 2px;
  font-size: 11px;
  color: #869b94;
}

.plan-ai-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.ai-suggest-card {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e4edea;
  border-left: 3px solid #0b6e65;
  border-radius: 8px;
}

.ai-suggest-card.suggest-warning {
  border-left-color: #dc2626;
}

.ai-suggest-card.suggest-sla {
  border-left-color: #f59e0b;
}

.ai-suggest-card.suggest-engineer {
  border-left-color: #1677ff;
}

.ai-suggest-card.suggest-route {
  border-left-color: #059669;
}

.ai-suggest-card.suggest-time {
  border-left-color: #722ed1;
}

.ai-suggest-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #0b6e65;
  background: #f0fdf4;
  border-radius: 6px;
}

.ai-suggest-card.suggest-warning .ai-suggest-icon {
  color: #dc2626;
  background: #fef2f2;
}

.ai-suggest-card.suggest-sla .ai-suggest-icon {
  color: #f59e0b;
  background: #fffbeb;
}

.ai-suggest-card.suggest-engineer .ai-suggest-icon {
  color: #1677ff;
  background: #eff6ff;
}

.ai-suggest-card.suggest-route .ai-suggest-icon {
  color: #059669;
  background: #ecfdf5;
}

.ai-suggest-card.suggest-time .ai-suggest-icon {
  color: #722ed1;
  background: #f9f0ff;
}

.ai-suggest-body {
  flex: 1;
  min-width: 0;
}

.ai-suggest-title {
  font-size: 12px;
  font-weight: 600;
  color: #0c4a3f;
}

.ai-suggest-content {
  margin-top: 3px;
  font-size: 12px;
  line-height: 1.5;
  color: #5e7a72;
}

.plan-ai-footer {
  display: flex;
  gap: 4px;
  align-items: center;
  padding-top: 8px;
  font-size: 11px;
  color: #869b94;
  border-top: 1px dashed #e4edea;
}

/* =====================================================
   Drawer 内共用
   ===================================================== */
.dw-subject {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 14px;
  font-size: 13px;
  background: #f6faf8;
  border-radius: 8px;
}

/* =====================================================
   基础布局
   ===================================================== */
</style>
