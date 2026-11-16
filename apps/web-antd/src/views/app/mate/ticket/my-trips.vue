<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  Drawer,
  message,
  Tag,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

// ====================================================
// 类型定义（与 dispatch-workbench 共享语义，独立声明避免跨视图耦合）
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
type WoPriority = 'high' | 'low' | 'medium' | 'urgent';

interface SopAttachment {
  id: string;
  name: string;
  url: string;
  size: string;
  uploadedAt: string;
}

interface WoSopItem {
  id: string;
  templateId: string;
  templateName?: string;
  content: string;
  required: boolean;
  type: 'check' | 'fill' | 'upload';
  checked: boolean;
  note?: string;
  attachments: SopAttachment[];
  completedAt?: string;
}

/** 关联工单 —— 与 dispatch-workbench 的 TripWoRef / PendingWo 字段对齐 */
interface TripWoRef {
  id: string;
  code: string;
  title: string;
  woType: WoType;
  customer: string;
  customerLocation?: string;
  device: string;
  woStatus: WoStatus;
  slaRemaining: string;
  slaRisk: SlaRisk;
  priority?: WoPriority;
  problemDesc?: string;
  duration?: number;
  sopItems: WoSopItem[];
}

/** 行程变更事件 —— 与 dispatch-workbench 的 TripChangeEvent 对齐 */
interface TripChangeEvent {
  id: string;
  type: 'cancel' | 'note' | 'owner-change' | 'slot-change';
  time: string;
  operator: string;
  content: string;
  from?: string;
  to?: string;
}

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

// ====================================================
// Mock 数据（从调度端同步的行程单，加 SOP 实例）
// ====================================================

/** 设备故障 SOP（与图片参考工单一致） */
const sopTemplateMap: Record<WoType, WoSopItem[]> = {
  设备故障: [
    {
      id: 'sop-f1',
      templateId: 'f1',
      templateName: '设备维修 SOP',
      content: '到达现场后拍照打卡（带时间地点水印）',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-f2',
      templateId: 'f2',
      templateName: '设备维修 SOP',
      content: '记录设备编号和故障现象',
      required: true,
      type: 'fill',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-f3',
      templateId: 'f3',
      templateName: '设备维修 SOP',
      content: '完成后上传处理结果照片',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-f4',
      templateId: 'f4',
      templateName: '设备维修 SOP',
      content: '客户签字确认服务完成',
      required: false,
      type: 'check',
      checked: false,
      attachments: [],
    },
  ],
  电梯故障: [
    {
      id: 'sop-e1',
      templateId: 'e1',
      templateName: '特种设备作业 SOP',
      content: '必须持有特种设备作业证(T证)',
      required: true,
      type: 'check',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-e2',
      templateId: 'e2',
      templateName: '特种设备作业 SOP',
      content: '现场作业前拍照打卡(带时间地点水印)',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-e3',
      templateId: 'e3',
      templateName: '特种设备作业 SOP',
      content: '作业过程中每30分钟向调度报平安',
      required: true,
      type: 'fill',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-e4',
      templateId: 'e4',
      templateName: '特种设备作业 SOP',
      content: '完成后上传5张以上现场照片',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-e5',
      templateId: 'e5',
      templateName: '特种设备作业 SOP',
      content: '客户签字确认服务完成',
      required: false,
      type: 'check',
      checked: false,
      attachments: [],
    },
  ],
  电气维修: [
    {
      id: 'sop-eq1',
      templateId: 'eq1',
      templateName: '特种设备作业 SOP',
      content: '必须持有特种设备作业证(T证)',
      required: true,
      type: 'check',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-eq2',
      templateId: 'eq2',
      templateName: '特种设备作业 SOP',
      content: '现场作业前拍照打卡(带时间地点水印)',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-eq3',
      templateId: 'eq3',
      templateName: '特种设备作业 SOP',
      content: '作业过程中每30分钟向调度报平安',
      required: true,
      type: 'fill',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-eq4',
      templateId: 'eq4',
      templateName: '特种设备作业 SOP',
      content: '完成后上传5张以上现场照片',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-eq5',
      templateId: 'eq5',
      templateName: '特种设备作业 SOP',
      content: '客户签字确认服务完成',
      required: false,
      type: 'check',
      checked: false,
      attachments: [],
    },
  ],
  空调故障: [
    {
      id: 'sop-a1',
      templateId: 'a1',
      templateName: '普通设备维修 SOP',
      content: '现场作业前拍照打卡',
      required: true,
      type: 'upload',
      checked: true,
      attachments: [
        {
          id: 'att-1',
          name: '现场打卡_0929.jpg',
          url: '',
          size: '1.2MB',
          uploadedAt: '2026-09-29 09:10',
        },
      ],
      completedAt: '2026-09-29 09:10',
    },
    {
      id: 'sop-a2',
      templateId: 'a2',
      templateName: '普通设备维修 SOP',
      content: '记录设备编号和故障现象',
      required: true,
      type: 'fill',
      checked: true,
      note: '格力 GMV 外机 A-03，压缩机异响，初步判断风扇电机故障',
      attachments: [],
      completedAt: '2026-09-29 10:30',
    },
    {
      id: 'sop-a3',
      templateId: 'a3',
      templateName: '普通设备维修 SOP',
      content: '完成后上传处理结果照片',
      required: true,
      type: 'upload',
      checked: true,
      attachments: [
        {
          id: 'att-2',
          name: '处理结果_0929.jpg',
          url: '',
          size: '2.1MB',
          uploadedAt: '2026-09-29 11:20',
        },
        {
          id: 'att-3',
          name: '完工后设备状态.jpg',
          url: '',
          size: '1.8MB',
          uploadedAt: '2026-09-29 11:22',
        },
      ],
      completedAt: '2026-09-29 11:22',
    },
  ],
  网络调试: [
    {
      id: 'sop-n1',
      templateId: 'n1',
      templateName: '普通设备维修 SOP',
      content: '现场作业前拍照打卡',
      required: true,
      type: 'upload',
      checked: true,
      attachments: [
        {
          id: 'att-4',
          name: '现场打卡_交换机B2.jpg',
          url: '',
          size: '980KB',
          uploadedAt: '2026-09-29 13:15',
        },
      ],
      completedAt: '2026-09-29 13:15',
    },
    {
      id: 'sop-n2',
      templateId: 'n2',
      templateName: '普通设备维修 SOP',
      content: '记录设备编号和故障现象',
      required: true,
      type: 'fill',
      checked: true,
      note: '华为 S5720 交换机核心机柜 B2，经排查为光纤模块端口接触不良',
      attachments: [],
      completedAt: '2026-09-29 14:00',
    },
    {
      id: 'sop-n3',
      templateId: 'n3',
      templateName: '普通设备维修 SOP',
      content: '完成后上传处理结果照片',
      required: true,
      type: 'upload',
      checked: true,
      attachments: [
        {
          id: 'att-5',
          name: '光纤清理后状态.jpg',
          url: '',
          size: '1.1MB',
          uploadedAt: '2026-09-29 14:40',
        },
      ],
      completedAt: '2026-09-29 14:40',
    },
  ],
  打印机维修: [
    {
      id: 'sop-p1',
      templateId: 'p1',
      templateName: '普通设备维修 SOP',
      content: '现场作业前拍照打卡',
      required: true,
      type: 'upload',
      checked: true,
      attachments: [
        {
          id: 'att-6',
          name: '打印机现场.jpg',
          url: '',
          size: '820KB',
          uploadedAt: '2026-09-29 14:20',
        },
      ],
      completedAt: '2026-09-29 14:20',
    },
    {
      id: 'sop-p2',
      templateId: 'p2',
      templateName: '普通设备维修 SOP',
      content: '记录设备编号和故障现象',
      required: true,
      type: 'fill',
      checked: true,
      note: 'HP LaserJet M281fdw，更换硒鼓后卡纸问题解决',
      attachments: [],
      completedAt: '2026-09-29 15:10',
    },
    {
      id: 'sop-p3',
      templateId: 'p3',
      templateName: '普通设备维修 SOP',
      content: '完成后上传处理结果照片',
      required: true,
      type: 'upload',
      checked: true,
      attachments: [
        {
          id: 'att-7',
          name: '新硒鼓装机.jpg',
          url: '',
          size: '1.3MB',
          uploadedAt: '2026-09-29 15:15',
        },
      ],
      completedAt: '2026-09-29 15:15',
    },
  ],
  设备巡检: [
    {
      id: 'sop-in1',
      templateId: 'in1',
      templateName: '设备巡检 SOP',
      content: '按巡检表逐项检查',
      required: true,
      type: 'check',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-in2',
      templateId: 'in2',
      templateName: '设备巡检 SOP',
      content: '记录巡检数据和异常项',
      required: true,
      type: 'fill',
      checked: false,
      attachments: [],
    },
    {
      id: 'sop-in3',
      templateId: 'in3',
      templateName: '设备巡检 SOP',
      content: '上传巡检报告签字扫描件',
      required: true,
      type: 'upload',
      checked: false,
      attachments: [],
    },
  ],
};

function tripWoType(baseId: string): TripWoRef {
  const map: Record<string, Omit<TripWoRef, 'sopItems'>> = {
    'img-001': {
      id: 'img-001',
      code: 'WO-20260929162805563',
      title: '打印机坏了测试数据',
      woType: '设备故障',
      customer: '熊猫集团',
      customerLocation: '南京',
      device: '熊猫集团-D5200P-南京-4',
      woStatus: 'pending',
      slaRemaining: '剩余 71 小时',
      slaRisk: 'safe',
      priority: 'medium',
      problemDesc: '客户反馈打印机故障，打印头不出墨，需现场排查更换',
      duration: 60,
    },
    'img-002': {
      id: 'img-002',
      code: 'WO-20260922171433668',
      title: '中车电机轨道单据不齐',
      woType: '设备故障',
      customer: '中车电机',
      customerLocation: '株洲',
      device: '中车电机-D5200-株洲-1',
      woStatus: 'pending',
      slaRemaining: '已超时 95 小时',
      slaRisk: 'overdue',
      priority: 'urgent',
      problemDesc: '现场作业单据不齐，轨道设备疑似异常需重新核查',
      duration: 120,
    },
    'img-003': {
      id: 'img-003',
      code: 'WO-20260922164254499',
      title: '鲁西化工1号柜单据不齐',
      woType: '设备故障',
      customer: '鲁西化工',
      customerLocation: '聊城',
      device: '鲁西化工-D5200-聊城-1',
      woStatus: 'completed',
      slaRemaining: '已完成',
      slaRisk: 'safe',
      priority: 'low',
      problemDesc: '客户确认无需处理，单据不齐但无实际故障，已主动取消',
      duration: 0,
    },
    'img-004': {
      id: 'img-004',
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
      problemDesc: '现场单据掉落，需紧急前往现场处理',
      duration: 90,
    },
    'img-005': {
      id: 'img-005',
      code: 'WO-20260922160741775',
      title: '山东港4董家口航运-内置',
      woType: '设备故障',
      customer: '山东港',
      customerLocation: '青岛',
      device: '山东港-D5200P-青岛-4',
      woStatus: 'pending',
      slaRemaining: '已超时 96 小时',
      slaRisk: 'overdue',
      priority: 'high',
      problemDesc: '客户航运设备内置模块故障，需现场更换',
      duration: 90,
    },
    'img-006': {
      id: 'img-006',
      code: 'WO-20260922155841695',
      title: '东风技术中心2号柜内部',
      woType: '设备故障',
      customer: '东风汽车',
      customerLocation: '武汉',
      device: '东风汽车-D5200-武汉-2',
      woStatus: 'pending',
      slaRemaining: '已超时 96 小时',
      slaRisk: 'overdue',
      priority: 'high',
      problemDesc: '技术中心2号控制柜内部元件损坏，需现场排查',
      duration: 120,
    },
  };
  const fallback = map['img-001'] as Omit<TripWoRef, 'sopItems'>;
  const base = map[baseId] ?? fallback;
  return {
    ...base,
    sopItems: structuredClone(sopTemplateMap['设备故障'] ?? []),
  };
}

const trips = ref<TripItem[]>([
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
    workOrders: [tripWoType('img-001'), tripWoType('img-004')],
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
    workOrders: [tripWoType('img-005')],
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
    workOrders: [tripWoType('img-006'), tripWoType('img-003')],
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
// Tab & 筛选
// ====================================================

type TripTab = 'history' | 'today' | 'tomorrow';
const activeTab = ref<TripTab>('today');

const todayStr = dayjs().format('YYYY-MM-DD');
const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');

const filteredTrips = computed(() => {
  if (activeTab.value === 'today') {
    return trips.value.filter((t) => t.planDate === todayStr);
  }
  if (activeTab.value === 'tomorrow') {
    return trips.value.filter((t) => t.planDate === tomorrowStr);
  }
  return trips.value.filter((t) => t.planDate < todayStr);
});

const counts = computed(() => ({
  today: trips.value.filter((t) => t.planDate === todayStr).length,
  tomorrow: trips.value.filter((t) => t.planDate === tomorrowStr).length,
  history: trips.value.filter((t) => t.planDate < todayStr).length,
  ongoing: trips.value.filter((t) => t.status === 'ongoing').length,
  planned: trips.value.filter((t) => t.status === 'planned').length,
}));

// ====================================================
// 行程进度
// ====================================================

// ====================================================
// 工单处理进度（新：按工单数量 + 阶段）
// ====================================================

interface WoProgress {
  total: number;
  pending: number; // 待处理
  processing: number; // 处理中
  completed: number; // 已完成
  percent: number; // 工单完成百分比
  stages: {
    count: number;
    key: 'completed' | 'pending' | 'processing';
    label: string;
  }[];
  currentStage: 'completed' | 'ongoing' | 'planned';
}

function woProgress(trip: TripItem): WoProgress {
  const total = trip.workOrders.length;
  const pending = trip.workOrders.filter(
    (w) => w.woStatus === 'pending' || w.woStatus === 'dispatched',
  ).length;
  const processing = trip.workOrders.filter(
    (w) => w.woStatus === 'processing',
  ).length;
  const completed = trip.workOrders.filter(
    (w) => w.woStatus === 'completed',
  ).length;
  // 阶段判定
  let currentStage: WoProgress['currentStage'] = 'planned';
  if (completed === total && total > 0) currentStage = 'completed';
  else if (processing > 0 || completed > 0) currentStage = 'ongoing';
  return {
    total,
    pending,
    processing,
    completed,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
    stages: [
      { key: 'pending', label: '待处理', count: pending },
      { key: 'processing', label: '处理中', count: processing },
      { key: 'completed', label: '已完成', count: completed },
    ],
    currentStage,
  };
}

function tripProgress(trip: TripItem) {
  const allItems = trip.workOrders.flatMap((wo) => wo.sopItems);
  if (allItems.length === 0)
    return {
      percent: 100,
      done: 0,
      total: 0,
      requiredDone: 0,
      requiredTotal: 0,
    };
  const done = allItems.filter((i) => isItemDone(i)).length;
  const required = allItems.filter((i) => i.required);
  const requiredDone = required.filter((i) => isItemDone(i)).length;
  return {
    percent: Math.round((done / allItems.length) * 100),
    done,
    total: allItems.length,
    requiredDone,
    requiredTotal: required.length,
  };
}

function isItemDone(item: WoSopItem): boolean {
  if (item.type === 'check') return item.checked;
  if (item.type === 'fill') return (item.note?.trim() ?? '').length > 0;
  if (item.type === 'upload') return item.attachments.length > 0;
  return false;
}

// ====================================================
// 行程详情 Drawer
// ====================================================

const detailOpen = ref(false);
const detailTripId = ref<null | string>(null);

const detailTrip = computed(
  () => trips.value.find((t) => t.id === detailTripId.value) ?? null,
);

function openDetail(tripId: string) {
  detailTripId.value = tripId;
  detailOpen.value = true;
}

/** 行程卡片展开/收起状态：默认全部收起 */
const collapsedCards = reactive<Record<string, boolean>>({});

function toggleCard(cardId: string) {
  collapsedCards[cardId] = !collapsedCards[cardId];
}

function isCardCollapsed(cardId: string) {
  return collapsedCards[cardId] !== false; // 默认收起
}

function handleStartTrip(trip: TripItem) {
  trip.status = 'ongoing';
  trip.updatedAt = dayjs().format('YYYY-MM-DD HH:mm');
  message.success(`行程 ${trip.code} 已开始`);
}

function handleCompleteTrip(trip: TripItem) {
  const progress = tripProgress(trip);
  if (progress.requiredDone < progress.requiredTotal) {
    message.warning(
      `还有 ${progress.requiredTotal - progress.requiredDone} 项必填要求未完成，无法标记完成`,
    );
    return;
  }
  trip.status = 'completed';
  trip.updatedAt = dayjs().format('YYYY-MM-DD HH:mm');
  trip.workOrders.forEach((wo) => {
    if (wo.woStatus !== 'completed') wo.woStatus = 'completed';
  });
  message.success(`行程 ${trip.code} 已完成 🎉`);
  detailOpen.value = false;
}

// ====================================================
// 更新进展 Drawer（执行中行程）
// ====================================================

interface WoProgressForm {
  woId: string;
  woCode: string;
  title: string;
  woType: WoType;
  /** 工单处理方案（SOP fill 类型的 note 汇总） */
  handledNote: string;
  /** 验收资料说明 */
  acceptanceNote: string;
  /** 模拟上传的验收资料附件 */
  attachments: { id: string; name: string }[];
  /** 该工单是否已全部完成 */
  woCompleted: boolean;
}

const progressOpen = ref(false);
const progressTripId = ref<null | string>(null);
const progressForms = ref<WoProgressForm[]>([]);
const progressSubmitting = ref(false);

const progressTrip = computed(
  () => trips.value.find((t) => t.id === progressTripId.value) ?? null,
);

function openProgressUpdate(trip: TripItem) {
  progressTripId.value = trip.id;
  progressForms.value = trip.workOrders.map((wo) => ({
    woId: wo.id,
    woCode: wo.code,
    title: wo.title,
    woType: wo.woType,
    handledNote: '',
    acceptanceNote: '',
    attachments: [],
    woCompleted: wo.woStatus === 'completed',
  }));
  progressOpen.value = true;
}

function toggleWoDone(form: WoProgressForm) {
  form.woCompleted = !form.woCompleted;
  if (form.woCompleted && !form.handledNote.trim()) {
    form.handledNote = '已完成处理';
  }
}

function mockProgressAttachment(form: WoProgressForm) {
  const now = dayjs();
  form.attachments.push({
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: `验收资料-${now.format('HHmmss')}.jpg`,
  });
}

function mockRemoveProgressAttachment(form: WoProgressForm, idx: number) {
  form.attachments.splice(idx, 1);
}

async function saveProgress(updateStatus: 'completed' | 'ongoing') {
  const trip = progressTrip.value;
  if (!trip) return;

  // 校验
  for (const f of progressForms.value) {
    if (!f.handledNote.trim()) {
      message.warning(`请填写工单 ${f.woCode} 的处理方案`);
      return;
    }
  }
  if (updateStatus === 'completed') {
    for (const f of progressForms.value) {
      if (!f.woCompleted) {
        message.warning(`工单 ${f.woCode} 尚未标记完成`);
        return;
      }
      if (!f.acceptanceNote.trim() && f.attachments.length === 0) {
        message.warning(`请补充工单 ${f.woCode} 的验收资料`);
        return;
      }
    }
  }

  progressSubmitting.value = true;
  await new Promise((r) => setTimeout(r, 400));

  const now = dayjs().format('YYYY-MM-DD HH:mm');
  // 回写到行程工单数据
  progressForms.value.forEach((pf) => {
    const wo = trip.workOrders.find((w) => w.id === pf.woId);
    if (!wo) return;
    wo.woStatus =
      pf.woCompleted || updateStatus === 'completed'
        ? 'completed'
        : 'processing';
    // 处理方案 → 写入第一个 fill 类型的 SOP note
    const fillItem = wo.sopItems.find((s) => s.type === 'fill');
    if (fillItem) {
      fillItem.note = pf.handledNote;
      fillItem.checked = true;
      fillItem.completedAt = now;
    } else {
      // 没有 fill 的就加一个
      wo.sopItems.push({
        id: `progress-${Date.now()}-${pf.woId}`,
        templateId: 'manual',
        content: pf.handledNote,
        required: false,
        type: 'fill',
        checked: true,
        completedAt: now,
        attachments: [],
      });
    }
    // 验收资料
    pf.attachments.forEach((att) => {
      const upItem: undefined | WoSopItem = wo.sopItems.find(
        (s) => s.type === 'upload',
      );
      const targetItem = upItem ?? wo.sopItems[wo.sopItems.length - 1];
      if (targetItem) {
        targetItem.attachments.push({
          id: att.id,
          name: att.name,
          url: '',
          size: `${(Math.random() * 2 + 0.5).toFixed(1)}MB`,
          uploadedAt: now,
        });
        targetItem.checked = true;
        targetItem.completedAt = now;
      }
    });
  });

  if (updateStatus === 'completed') {
    trip.status = 'completed';
    trip.updatedAt = now;
    message.success(`行程 ${trip.code} 已完成 🎉`);
  } else {
    trip.status = 'ongoing';
    trip.updatedAt = now;
    message.success(`行程进展已保存 · ${trip.code}`);
  }

  progressSubmitting.value = false;
  progressOpen.value = false;
}

// ====================================================
// 工具
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
</script>

<template>
  <section class="mt-page">
    <!-- ===== 顶部标题 ===== -->
    <header class="mt-header">
      <div class="mt-header__title">
        <div class="mt-header__icon">
          <Icon icon="lucide:clipboard-list" class="size-5" />
        </div>
        <div>
          <div class="mt-header__name">我的行程</div>
          <div class="mt-header__meta">
            我作为工程师负责的上门运维行程，现场服务要求事项在这里处理
          </div>
        </div>
      </div>
    </header>

    <!-- ===== 统计卡 ===== -->
    <div class="mt-stats">
      <div class="mt-stat mt-stat--blue">
        <div class="mt-stat__icon">
          <Icon icon="lucide:calendar-check" class="size-5" />
        </div>
        <div class="mt-stat__body">
          <div class="mt-stat__num">{{ counts.today }}</div>
          <div class="mt-stat__label">今日行程</div>
        </div>
      </div>
      <div class="mt-stat mt-stat--amber">
        <div class="mt-stat__icon">
          <Icon icon="lucide:clock" class="size-5" />
        </div>
        <div class="mt-stat__body">
          <div class="mt-stat__num">{{ counts.ongoing }}</div>
          <div class="mt-stat__label">执行中</div>
        </div>
      </div>
      <div class="mt-stat mt-stat--purple">
        <div class="mt-stat__icon">
          <Icon icon="lucide:calendar" class="size-5" />
        </div>
        <div class="mt-stat__body">
          <div class="mt-stat__num">{{ counts.tomorrow }}</div>
          <div class="mt-stat__label">明日待办</div>
        </div>
      </div>
      <div class="mt-stat mt-stat--emerald">
        <div class="mt-stat__icon">
          <Icon icon="lucide:check-circle" class="size-5" />
        </div>
        <div class="mt-stat__body">
          <div class="mt-stat__num">{{ counts.planned }}</div>
          <div class="mt-stat__label">已规划</div>
        </div>
      </div>
    </div>

    <!-- ===== Tab ===== -->
    <div class="mt-tabs">
      <button
        class="mt-tab"
        :class="{ 'is-active': activeTab === 'today' }"
        @click="activeTab = 'today'"
      >
        <Icon icon="lucide:sun" class="size-4" />
        今日
        <span class="mt-tab__badge">{{ counts.today }}</span>
      </button>
      <button
        class="mt-tab"
        :class="{ 'is-active': activeTab === 'tomorrow' }"
        @click="activeTab = 'tomorrow'"
      >
        <Icon icon="lucide:cloud-sun" class="size-4" />
        明日
        <span class="mt-tab__badge">{{ counts.tomorrow }}</span>
      </button>
      <button
        class="mt-tab"
        :class="{ 'is-active': activeTab === 'history' }"
        @click="activeTab = 'history'"
      >
        <Icon icon="lucide:archive" class="size-4" />
        历史
        <span class="mt-tab__badge">{{ counts.history }}</span>
      </button>
    </div>

    <!-- ===== 空状态 ===== -->
    <div v-if="filteredTrips.length === 0" class="mt-empty">
      <Icon icon="lucide:clipboard-list" class="size-12 text-slate-300" />
      <div class="mt-empty__title">暂无行程</div>
      <div class="mt-empty__desc">
        {{
          activeTab === 'today'
            ? '今日没有安排上门服务'
            : '没有相关的历史行程记录'
        }}
      </div>
    </div>

    <!-- ===== 行程卡片列表 ===== -->
    <div v-for="trip in filteredTrips" :key="trip.id" class="mt-trip-card">
      <!-- 头部 -->
      <div
        class="mt-trip-head"
        :class="`is-${trip.status}`"
        @click="toggleCard(trip.id)"
      >
        <div class="mt-trip-head__toggle">
          <Icon
            :icon="
              isCardCollapsed(trip.id)
                ? 'lucide:chevron-down'
                : 'lucide:chevron-up'
            "
            class="size-4"
          />
        </div>
        <div class="mt-trip-head__main">
          <div class="mt-trip-head__row1">
            <span class="dw-mono trip-code">{{ trip.code }}</span>
            <h4 class="trip-title">{{ trip.title }}</h4>
            <Tag :color="tripStatusColor[trip.status]" class="mini-tag">
              {{ tripStatusLabel[trip.status] }}
            </Tag>
          </div>
          <div class="mt-trip-head__row2">
            <span>
              <Icon icon="lucide:calendar" class="size-3" />
              {{ trip.planDate }}
            </span>
            <span>
              <Icon icon="lucide:clock" class="size-3" />
              {{ trip.planSlot }}
            </span>
            <span>
              <Icon icon="lucide:clipboard-list" class="size-3" />
              {{ trip.workOrders.length }} 张工单
            </span>
          </div>
        </div>

        <!-- 工单处理进度 -->
        <div class="mt-trip-progress">
          <div class="mt-progress-stages">
            <template
              v-for="(stage, sIdx) in woProgress(trip).stages"
              :key="stage.key"
            >
              <div
                class="mt-progress-stage"
                :class="{
                  'is-active':
                    stage.count > 0 ||
                    stage.key === woProgress(trip).currentStage ||
                    (stage.key === 'completed' &&
                      woProgress(trip).completed === woProgress(trip).total),
                  'is-done':
                    stage.key === 'completed' &&
                    stage.count === woProgress(trip).total &&
                    woProgress(trip).total > 0,
                }"
              >
                <div class="mt-progress-stage__count">{{ stage.count }}</div>
                <div class="mt-progress-stage__label">{{ stage.label }}</div>
              </div>
              <div
                v-if="sIdx < 2"
                class="mt-progress-stage__bar"
                :class="{
                  'is-filled':
                    woProgress(trip).completed + woProgress(trip).processing >
                      0 && sIdx === 0,
                }"
              ></div>
            </template>
          </div>
          <div class="mt-progress-summary">
            <span class="mt-progress-summary__num">
              {{ woProgress(trip).completed }}/{{ woProgress(trip).total }}
            </span>
            <span
              class="mt-progress-summary__pct"
              :class="{ 'is-complete': woProgress(trip).percent === 100 }"
            >
              · {{ woProgress(trip).percent }}%
            </span>
          </div>
        </div>

        <div class="mt-trip-head__actions" @click.stop>
          <Button
            v-if="trip.status === 'planned'"
            type="primary"
            size="small"
            @click="handleStartTrip(trip)"
          >
            <Icon icon="lucide:play" class="size-3" />
            开始行程
          </Button>
          <Button
            v-if="trip.status === 'ongoing'"
            type="primary"
            size="small"
            @click="openProgressUpdate(trip)"
          >
            <Icon icon="lucide:file-edit" class="size-3" />
            更新进展
          </Button>
          <Button
            v-if="trip.status === 'ongoing'"
            size="small"
            :disabled="woProgress(trip).percent < 100"
            @click="handleCompleteTrip(trip)"
          >
            <Icon icon="lucide:flag" class="size-3" />
            直接完成
          </Button>
          <Button size="small" @click="openDetail(trip.id)">
            <Icon icon="lucide:chevron-right" class="size-3" />
            查看详情
          </Button>
        </div>
      </div>

      <!-- 工单预览（点击卡片展开后显示 · 与图片对齐的表格结构） -->
      <div v-if="!isCardCollapsed(trip.id)" class="mt-trip-preview" @click.stop>
        <div class="mt-trip-preview__title">
          <Icon icon="lucide:clipboard-list" class="size-3.5" />
          关联工单（{{ trip.workOrders.length }}）
        </div>
        <div class="mt-wo-table">
          <div class="mt-wo-table__head">
            <div class="col-related">关联工单</div>
            <div class="col-code">工单号</div>
            <div class="col-title">工单标题</div>
            <div class="col-type">类型</div>
            <div class="col-customer">客户 / 设备</div>
            <div class="col-status">状态</div>
            <div class="col-sla">SLA</div>
          </div>
          <div v-for="wo in trip.workOrders" :key="wo.id" class="mt-wo-row">
            <div class="col-related">
              <Icon icon="lucide:link" class="size-3.5 text-slate-400" />
            </div>
            <div class="col-code">
              <span class="dw-mono">{{ wo.code }}</span>
            </div>
            <div class="col-title">{{ wo.title }}</div>
            <div class="col-type">
              <Tag :color="woTypeTagColor[wo.woType]" class="mini-tag">
                {{ wo.woType }}
              </Tag>
            </div>
            <div class="col-customer">
              <span>{{ wo.customer }} · {{ wo.device }}</span>
            </div>
            <div class="col-status">
              <Tag :color="woStatusColor[wo.woStatus]" class="mini-tag">
                {{ woStatusLabel[wo.woStatus] }}
              </Tag>
            </div>
            <div class="col-sla">
              <span class="mt-wo-sla" :class="`sla-${wo.slaRisk}`">
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
          </div>
        </div>
      </div>
    </div>

    <!-- ==================================================== -->
    <!--  行程详情 Drawer（与更新进展 Drawer 同结构 · 只读）      -->
    <!-- ==================================================== -->
    <Drawer
      v-model:open="detailOpen"
      width="680px"
      :destroy-on-close="true"
      :title="
        detailTrip ? `${detailTrip.code} · ${detailTrip.title}` : '行程详情'
      "
      class="trip-detail-drawer"
    >
      <template #footer v-if="detailTrip">
        <div class="dd-footer">
          <Button
            v-if="detailTrip.status === 'planned'"
            type="primary"
            size="large"
            @click="handleStartTrip(detailTrip)"
          >
            <Icon icon="lucide:play" class="size-4" />
            开始行程
          </Button>
          <Button
            v-if="detailTrip.status === 'ongoing'"
            type="primary"
            size="large"
            @click="openProgressUpdate(detailTrip)"
          >
            <Icon icon="lucide:file-edit" class="size-4" />
            更新进展
          </Button>
        </div>
      </template>

      <template v-if="detailTrip">
        <div class="dd-body">
          <!-- 顶部概要（与更新进展 Drawer 同结构） -->
          <div class="dd-summary">
            <div class="dd-summary__item">
              <div class="lb">行程标题</div>
              <div class="val">{{ detailTrip.title }}</div>
            </div>
            <div class="dd-summary__item">
              <div class="lb">计划日期</div>
              <div class="val">
                {{ detailTrip.planDate }} · {{ detailTrip.planSlot }}
              </div>
            </div>
            <div class="dd-summary__item">
              <div class="lb">工单处理进度</div>
              <div class="val">
                <div class="dd-progress-stages">
                  <span
                    v-for="(stage, sIdx) in woProgress(detailTrip).stages"
                    :key="stage.key"
                    class="dd-progress-stage"
                    :class="{
                      'is-active': stage.count > 0,
                      'is-done':
                        stage.key === 'completed' &&
                        woProgress(detailTrip).percent === 100,
                    }"
                  >
                    {{ stage.label }} {{ stage.count }}
                    <span v-if="sIdx < 2" class="dd-progress-stage__sep">
                      →
                    </span>
                  </span>
                </div>
                <span class="dd-summary__hint">
                  {{ woProgress(detailTrip).completed }}/{{
                    woProgress(detailTrip).total
                  }}
                  · 工单完成 {{ woProgress(detailTrip).percent }}%
                </span>
              </div>
            </div>
          </div>

          <div v-if="detailTrip.remark" class="dd-remark">
            <Icon icon="lucide:file-text" class="size-4" />
            {{ detailTrip.remark }}
          </div>

          <!-- 工单处理信息（与更新进展 Drawer 同结构 · 只读展示） -->
          <div class="pu-section">
            <div class="pu-section__title">
              <Icon icon="lucide:wrench" class="size-4" />
              工单处理信息（{{ detailTrip.workOrders.length }} 张）
              <span class="pu-section__sub">
                查看每张工单的处理方案与验收资料
              </span>
            </div>

            <div
              v-for="wo in detailTrip.workOrders"
              :key="wo.id"
              class="pu-wo-block dd-wo-block"
              :class="{ 'is-done': wo.woStatus === 'completed' }"
            >
              <!-- 工单头部 -->
              <div class="pu-wo-head">
                <div class="pu-wo-head__left">
                  <Tag :color="woTypeTagColor[wo.woType]" class="mini-tag">
                    {{ wo.woType }}
                  </Tag>
                  <span class="dw-mono pu-wo-code">{{ wo.code }}</span>
                  <span class="pu-wo-title">{{ wo.title }}</span>
                </div>
                <div class="pu-wo-head__right">
                  <Tag :color="woStatusColor[wo.woStatus]" class="mini-tag">
                    <Icon
                      v-if="wo.woStatus === 'completed'"
                      icon="lucide:check-circle"
                      class="mr-1 inline-block size-3"
                    />
                    <Icon
                      v-else-if="wo.woStatus === 'processing'"
                      icon="lucide:loader"
                      class="mr-1 inline-block size-3 animate-spin"
                    />
                    {{ woStatusLabel[wo.woStatus] }}
                  </Tag>
                </div>
              </div>

              <!-- 客户 & 设备 & SLA -->
              <div class="dd-wo-info-inline">
                <span>
                  <Icon icon="lucide:building-2" class="size-3" />
                  {{ wo.customer }} · {{ wo.device }}
                </span>
                <span class="sla-line" :class="`sla-${wo.slaRisk}`">
                  <Icon icon="lucide:clock" class="size-3" />
                  SLA {{ wo.slaRemaining }}
                </span>
              </div>

              <!-- 处理方案（只读：取第一个 fill 类型 SOP note） -->
              <div class="pu-wo-field">
                <label class="pu-wo-field__label">
                  <Icon icon="lucide:file-text" class="size-3" />
                  处理方案 / 现场情况
                </label>
                <div class="dd-field-readonly">
                  <template
                    v-if="
                      wo.sopItems.some(
                        (s) => s.type === 'fill' && s.note?.trim(),
                      )
                    "
                  >
                    {{
                      wo.sopItems.find(
                        (s) => s.type === 'fill' && s.note?.trim(),
                      )!.note
                    }}
                    <span
                      v-if="
                        wo.sopItems.find(
                          (s) => s.type === 'fill' && s.note?.trim(),
                        )!.completedAt
                      "
                      class="dd-field-readonly__time"
                    >
                      ·
                      {{
                        wo.sopItems.find(
                          (s) => s.type === 'fill' && s.note?.trim(),
                        )!.completedAt
                      }}
                    </span>
                  </template>
                  <span v-else class="dd-field-empty">暂无处理方案记录</span>
                </div>
              </div>

              <!-- 验收资料（只读） -->
              <div class="pu-wo-field">
                <label class="pu-wo-field__label">
                  <Icon icon="lucide:file-check" class="size-3" />
                  验收资料
                </label>
                <template
                  v-if="
                    wo.sopItems.some(
                      (s) => s.type === 'upload' && s.attachments.length > 0,
                    )
                  "
                >
                  <div class="pu-wo-attachments">
                    <div
                      v-for="att in wo.sopItems.find(
                        (s) => s.type === 'upload',
                      )!.attachments"
                      :key="att.id"
                      class="pu-wo-att"
                    >
                      <Icon icon="lucide:image" class="size-3" />
                      <span class="pu-wo-att__name">{{ att.name }}</span>
                      <span class="dd-field-readonly__time">
                        {{ att.uploadedAt }}
                      </span>
                    </div>
                  </div>
                </template>
                <div v-else class="dd-field-empty">暂无验收资料</div>
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div class="pu-tip">
            <Icon icon="lucide:info" class="size-4" />
            <span>
              此页面为只读视图。点击「更新进展」进入可编辑模式，填写处理方案与验收资料后保存或标记完成。
            </span>
          </div>
        </div>
      </template>
    </Drawer>

    <!-- ==================================================== -->
    <!--  更新进展 Drawer（执行中行程）                          -->
    <!-- ==================================================== -->
    <Drawer
      v-model:open="progressOpen"
      width="680px"
      :destroy-on-close="true"
      :title="progressTrip ? `更新进展 · ${progressTrip.code}` : '更新进展'"
      class="trip-detail-drawer"
    >
      <template #footer v-if="progressTrip">
        <div class="dd-footer">
          <Button @click="progressOpen = false">取消</Button>
          <Button
            size="large"
            @click="saveProgress('ongoing')"
            :loading="progressSubmitting"
          >
            <Icon icon="lucide:save" class="size-4" />
            保存进展
          </Button>
          <Button
            type="primary"
            size="large"
            @click="saveProgress('completed')"
            :loading="progressSubmitting"
          >
            <Icon icon="lucide:flag" class="size-4" />
            标记完成
          </Button>
        </div>
      </template>

      <template v-if="progressTrip">
        <div class="dd-body">
          <!-- 顶部概要 -->
          <div class="dd-summary">
            <div class="dd-summary__item">
              <div class="lb">行程标题</div>
              <div class="val">{{ progressTrip.title }}</div>
            </div>
            <div class="dd-summary__item">
              <div class="lb">计划日期</div>
              <div class="val">
                {{ progressTrip.planDate }} · {{ progressTrip.planSlot }}
              </div>
            </div>
            <div class="dd-summary__item">
              <div class="lb">状态</div>
              <div class="val">
                <Tag
                  :color="tripStatusColor[progressTrip.status]"
                  class="mini-tag"
                >
                  {{ tripStatusLabel[progressTrip.status] }}
                </Tag>
                <span class="dd-summary__hint">
                  更新后状态保持「执行中」或变更为「已完成」
                </span>
              </div>
            </div>
          </div>

          <!-- 工单处理表单 -->
          <div class="pu-section">
            <div class="pu-section__title">
              <Icon icon="lucide:wrench" class="size-4" />
              工单处理信息（{{ progressForms.length }} 张）
              <span class="pu-section__sub">
                请填写每张工单的处理方案；标记完成前必须提供验收资料
              </span>
            </div>

            <div
              v-for="pf in progressForms"
              :key="pf.woId"
              class="pu-wo-block"
              :class="{ 'is-done': pf.woCompleted }"
            >
              <!-- 工单头部 -->
              <div class="pu-wo-head">
                <div class="pu-wo-head__left">
                  <Tag :color="woTypeTagColor[pf.woType]" class="mini-tag">
                    {{ pf.woType }}
                  </Tag>
                  <span class="dw-mono pu-wo-code">{{ pf.woCode }}</span>
                  <span class="pu-wo-title">{{ pf.title }}</span>
                </div>
                <div class="pu-wo-head__right">
                  <Checkbox
                    :checked="pf.woCompleted"
                    @change="toggleWoDone(pf)"
                  >
                    <span class="pu-wo-done-label">
                      <Icon
                        v-if="pf.woCompleted"
                        icon="lucide:check-circle"
                        class="size-3 text-emerald-500"
                      />
                      该工单已完成
                    </span>
                  </Checkbox>
                </div>
              </div>

              <!-- 处理方案 -->
              <div class="pu-wo-field">
                <label class="pu-wo-field__label">
                  <Icon icon="lucide:file-text" class="size-3" />
                  处理方案 / 现场情况
                  <span class="pu-wo-field__req">必填</span>
                </label>
                <Textarea
                  v-model:value="pf.handledNote"
                  :rows="3"
                  :maxlength="300"
                  placeholder="请填写本工单的现场处理情况、处置结果或阶段性进展..."
                />
              </div>

              <!-- 验收资料（工单已完成时显示） -->
              <div v-if="pf.woCompleted" class="pu-wo-field">
                <label class="pu-wo-field__label">
                  <Icon icon="lucide:file-check" class="size-3" />
                  验收资料
                  <span class="pu-wo-field__req">必填（完成标记时）</span>
                </label>
                <Textarea
                  v-model:value="pf.acceptanceNote"
                  :rows="2"
                  :maxlength="300"
                  placeholder="填写验收结果说明，或上传现场复测附件"
                />
                <div class="pu-wo-attachments">
                  <div
                    v-for="(att, ai) in pf.attachments"
                    :key="att.id"
                    class="pu-wo-att"
                  >
                    <Icon icon="lucide:image" class="size-3" />
                    <span class="pu-wo-att__name">{{ att.name }}</span>
                    <Button
                      type="text"
                      size="small"
                      danger
                      @click="mockRemoveProgressAttachment(pf, ai)"
                    >
                      <Icon icon="lucide:x" class="size-3" />
                    </Button>
                  </div>
                  <Button
                    size="small"
                    type="dashed"
                    @click="mockProgressAttachment(pf)"
                  >
                    <Icon icon="lucide:upload" class="size-3" />
                    上传验收资料（模拟）
                  </Button>
                </div>
              </div>

              <!-- 未完成提示 -->
              <div v-else class="pu-wo-pending">
                <Icon icon="lucide:clock" class="size-3" />
                工单暂未完成，填写处理方案后勾选「该工单已完成」可补充验收资料
              </div>
            </div>
          </div>

          <!-- 提示 -->
          <div class="pu-tip">
            <Icon icon="lucide:info" class="size-4" />
            <span>
              <strong>保存进展</strong>
              仅更新工单数据，行程状态保持「执行中」；
              <strong>标记完成</strong>
              要求所有工单已完成且验收资料齐全，完成后行程状态更新为「已完成」。
            </span>
          </div>
        </div>
      </template>
    </Drawer>
  </section>
</template>

<style scoped>
/* ===== 响应式 ===== */
@media (max-width: 1200px) {
  .mt-trip-head {
    grid-template-columns: 1fr 1fr;
  }

  .mt-trip-head__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .mt-stats {
    grid-template-columns: 1fr 1fr;
  }

  .dd-summary {
    grid-template-columns: 1fr;
  }
}

.mt-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.dw-mono {
  font-family: 'SF Mono', Menlo, ui-monospace, monospace;
}

.mini-tag {
  padding: 0 6px !important;
  font-size: 11px !important;
  line-height: 18px !important;
}

/* ===== Header ===== */
.mt-header {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 0 4px;
}

.mt-header__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #fff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 10px;
}

.mt-header__name {
  font-size: 18px;
  font-weight: 700;
  color: #0c4a3f;
}

.mt-header__meta {
  margin-top: 2px;
  font-size: 12px;
  color: #869b94;
}

/* ===== Stats ===== */
.mt-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.mt-stat {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.mt-stat__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
}

.mt-stat__num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  color: #0c4a3f;
}

.mt-stat__label {
  margin-top: 2px;
  font-size: 12px;
  color: #869b94;
}

.mt-stat--blue .mt-stat__icon {
  color: #2563eb;
  background: #eff6ff;
}

.mt-stat--amber .mt-stat__icon {
  color: #ea580c;
  background: #fff7ed;
}

.mt-stat--purple .mt-stat__icon {
  color: #7c3aed;
  background: #f5f3ff;
}

.mt-stat--emerald .mt-stat__icon {
  color: #059669;
  background: #ecfdf5;
}

/* ===== Tabs ===== */
.mt-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: #f1f7f4;
  border-radius: 10px;
}

.mt-tab {
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

.mt-tab:hover {
  background: rgb(255 255 255 / 60%);
}

.mt-tab.is-active {
  color: #0c4a3f;
  background: #fff;
  box-shadow: 0 1px 3px rgb(12 74 63 / 12%);
}

.mt-tab__badge {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
  color: #059669;
  background: rgb(14 165 133 / 12%);
  border-radius: 10px;
}

/* ===== 空状态 ===== */
.mt-empty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 60px 20px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.mt-empty__title {
  font-size: 14px;
  font-weight: 600;
  color: #5e7a72;
}

.mt-empty__desc {
  font-size: 12px;
  color: #869b94;
}

/* ===== 行程卡片 ===== */
.mt-trip-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
  transition: all 0.18s;
}

.mt-trip-card + .mt-trip-card {
  margin-top: 12px;
}

.mt-trip-head {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 200px auto;
  gap: 10px;
  align-items: center;
  padding: 16px 18px;
  cursor: pointer;
  transition: background 0.15s;
}

.mt-trip-head:hover {
  filter: brightness(0.98);
}

.mt-trip-head__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #7b8c85;
  background: #f1f7f4;
  border-radius: 8px;
  transition: all 0.2s;
}

.mt-trip-head:hover .mt-trip-head__toggle {
  color: #0b6e65;
  background: #e1f5ee;
}

.mt-trip-head.is-ongoing {
  background: linear-gradient(90deg, #eff6ff 0%, #fff 30%);
  border-bottom: 2px solid #1677ff;
}

.mt-trip-head.is-completed {
  background: linear-gradient(90deg, #ecfdf5 0%, #fff 30%);
  border-bottom: 2px solid #52c41a;
}

.mt-trip-head.is-planned {
  background: #fffbeb;
  border-bottom: 2px solid #faad14;
}

.mt-trip-head__row1 {
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

.mt-trip-head__row2 {
  display: flex;
  gap: 18px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #869b94;
}

.mt-trip-head__row2 span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

/* 工单处理进度条 */
.mt-trip-progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mt-progress-stages {
  display: flex;
  gap: 2px;
  align-items: center;
}

.mt-progress-stage {
  display: flex;
  flex-direction: column;
  gap: 1px;
  align-items: center;
  min-width: 52px;
  padding: 3px 6px;
  font-size: 10px;
  color: #869b94;
  background: #f4faf8;
  border-radius: 6px;
  opacity: 0.6;
  transition: all 0.18s;
}

.mt-progress-stage__count {
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: #5e7a72;
}

.mt-progress-stage__label {
  font-size: 10px;
  font-weight: 500;
}

.mt-progress-stage.is-active {
  color: #0b6e65;
  background: #e1f5ee;
  opacity: 1;
}

.mt-progress-stage.is-active .mt-progress-stage__count {
  color: #0b6e65;
}

.mt-progress-stage.is-done {
  color: #059669;
  background: #ecfdf5;
}

.mt-progress-stage.is-done .mt-progress-stage__count {
  color: #059669;
}

.mt-progress-stage__bar {
  flex: 1;
  min-width: 12px;
  height: 3px;
  margin: 0 2px;
  background: #e4edea;
  border-radius: 2px;
}

.mt-progress-stage__bar.is-filled {
  background: linear-gradient(90deg, #1677ff, #52c41a);
}

.mt-progress-summary {
  display: flex;
  gap: 2px;
  align-items: baseline;
  justify-content: center;
  font-size: 11px;
  color: #5e7a72;
}

.mt-progress-summary__num {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #0c4a3f;
}

.mt-progress-summary__pct.is-complete {
  font-weight: 600;
  color: #059669;
}

/* 详情 Drawer：工单阶段进度（概要区） */
.dd-progress-stages {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.dd-progress-stage {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  color: #869b94;
  background: #f4faf8;
  border-radius: 4px;
}

.dd-progress-stage.is-active {
  color: #0b6e65;
  background: #e1f5ee;
}

.dd-progress-stage.is-done {
  color: #059669;
  background: #ecfdf5;
}

.dd-progress-stage__sep {
  margin: 0 2px;
  color: #c8d5cf;
}

/* 详情 Drawer：只读展示样式 */
.dd-field-readonly {
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.6;
  color: #0c4a3f;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  background: #f4faf8;
  border: 1px solid #e4edea;
  border-radius: 8px;
}

.dd-field-readonly__time {
  font-size: 11px;
  color: #869b94;
}

.dd-field-empty {
  display: inline-block;
  padding: 10px 12px;
  font-size: 12px;
  color: #b3c2bb;
  background: #f8faf9;
  border: 1px dashed #d5e1dc;
  border-radius: 8px;
}

.dd-wo-info-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding-top: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: #5e7a72;
  border-top: 1px dashed #eef4f1;
}

.dd-wo-info-inline span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.dd-sop-compact {
  padding-top: 8px;
  margin-top: 4px;
  border-top: 1px dashed #e4edea;
}

.mt-trip-head__actions {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

/* 工单预览（精简表格结构 · 与图片一致） */
.mt-trip-preview {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  margin-top: 4px;
  overflow: hidden;
  background: #fff;
  border-top: 1px dashed #e4edea;
  border-radius: 0 0 12px 12px;
}

.mt-trip-preview__title {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  background: #f6faf8;
}

.mt-wo-table {
  overflow: hidden;
}

.mt-wo-table__head {
  display: grid;
  grid-template-columns: 50px 150px 1fr 90px 1fr 100px 140px;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: #5e7a72;
  background: #f0f6f3;
  border-bottom: 1px solid #e4edea;
}

.mt-wo-row {
  display: grid;
  grid-template-columns: 50px 150px 1fr 90px 1fr 100px 140px;
  gap: 8px;
  align-items: center;
  padding: 10px 16px;
  font-size: 12px;
  border-bottom: 1px solid #f0f4f2;
  transition: background 0.15s;
}

.mt-wo-row:last-child {
  border-bottom: none;
}

.mt-wo-row:hover {
  background: #fafcfb;
}

.mt-wo-row .col-related {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mt-wo-row .col-code {
  color: #5e7a72;
}

.mt-wo-row .col-title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  color: #0c4a3f;
  white-space: nowrap;
}

.mt-wo-row .col-customer {
  overflow: hidden;
  text-overflow: ellipsis;
  color: #334155;
  white-space: nowrap;
}

.mt-wo-sla {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
}

.mt-wo-sla.sla-overdue {
  font-weight: 500;
  color: #dc2626;
}

.mt-wo-sla.sla-warn {
  color: #d97706;
}

.mt-wo-sla.sla-safe {
  color: #5e7a72;
}

/* ===== Drawer ===== */
.dd-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  padding-right: 4px;
  overflow-y: auto;
}

.dd-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  background: #f6faf8;
  border-radius: 10px;
}

.dd-summary__item .lb {
  font-size: 11px;
  font-weight: 500;
  color: #869b94;
}

.dd-summary__item .val {
  margin-top: 3px;
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

.progress-inline {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-label {
  font-size: 11px;
  font-weight: 400;
  color: #5e7a72;
}

.dd-remark {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 14px;
  font-size: 12px;
  color: #5e7a72;
  background: #fff7ed;
  border-radius: 8px;
}

/* 工单块 */
.dd-wo-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
}

.dd-wo-block {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
}

.dd-wo-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: #f6faf8;
  border-bottom: 1px solid #e4edea;
  transition: background 0.15s;
}

.dd-wo-head:hover {
  background: #eef6f2;
}

.dd-wo-collapse {
  color: #5e7a72;
  transition: transform 0.18s;
}

.dd-wo-head__left {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.dd-wo-head__right {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
}

.wo-sop-progress {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  background: #ecfdf5;
  border-radius: 10px;
}

.wo-idx {
  font-size: 11px;
  font-weight: 600;
  color: #869b94;
}

.dd-wo-code {
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
}

.dd-wo-info {
  padding: 12px 16px;
}

/* 收起态摘要 */
.dd-wo-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  padding: 10px 16px;
  background: #fafcfb;
  border-top: 1px solid #eef4f1;
}

.dd-wo-summary .info-title {
  margin-right: 4px;
  margin-bottom: 0;
  font-size: 13px;
  font-weight: 600;
}

.dd-wo-summary .info-line {
  font-size: 11px;
}

.info-title {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.info-line {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-right: 14px;
  font-size: 12px;
  color: #5e7a72;
}

.sla-line.sla-safe {
  color: #1d4ed8;
}

.sla-line.sla-warn {
  color: #b45309;
}

.sla-line.sla-overdue {
  color: #b91c1c;
}

/* SOP 区 */
.dd-sop {
  padding: 0 16px 16px;
}

.dd-sop__header {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
  border-bottom: 1px dashed #e4edea;
}

.dd-sop__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
}

.dd-sop-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  background: #fafcfb;
  border: 1px solid #e4edea;
  border-radius: 8px;
  transition: all 0.15s;
}

.dd-sop-item.is-done {
  background: #f0fdf4;
  border-color: #86efac;
}

.dd-sop-item.is-pending-required {
  background: #fffbeb;
  border-color: #fca5a5;
}

.sop-item-left {
  display: flex;
  flex: 1;
  gap: 10px;
}

.sop-item-num {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  font-size: 11px;
  font-weight: 700;
  color: #0b6e65;
  background: #e1f5ee;
  border-radius: 6px;
}

.dd-sop-item.is-done .sop-item-num {
  color: #059669;
  background: #dcfce7;
}

.dd-sop-item.is-pending-required .sop-item-num {
  color: #b91c1c;
  background: #fee2e2;
}

.sop-item-body {
  flex: 1;
  min-width: 0;
}

.sop-item-content {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #0c4a3f;
}

.dd-sop-item.is-done .sop-item-content {
  color: #059669;
}

.sop-item-actions {
  margin-top: 6px;
  font-size: 12px;
}

.sop-done-at {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  margin-left: 10px;
  font-size: 11px;
  color: #059669;
}

/* 附件区 */
.sop-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.sop-att {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 6px;
}

.sop-att__name {
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #0c4a3f;
  white-space: nowrap;
}

.sop-att__size {
  color: #869b94;
}

/* 无 SOP */
.dd-sop-empty {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 10px 16px;
  font-size: 12px;
  color: #869b94;
  background: #f8fafc;
}

/* 底部（Drawer footer slot） */
.dd-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 覆盖 Drawer body：撑满高度 + 内部滚动 */
:global(.trip-detail-drawer) .ant-drawer-body {
  display: flex !important;
  flex-direction: column;
  padding: 16px 20px !important;
  overflow: hidden !important;
}

/* ===== 更新进展 Drawer ===== */
.pu-section {
  margin-top: 16px;
}

.pu-section__title {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
  border-bottom: 1px solid #e4edea;
}

.pu-section__sub {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: #869b94;
}

.pu-wo-block {
  padding: 12px 14px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 12px;
  transition: all 0.18s;
}

.pu-wo-block.is-done {
  background: #f0fdf4;
  border-color: #86efac;
}

.pu-wo-head {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e4edea;
}

.pu-wo-head__left {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.pu-wo-head__right {
  flex-shrink: 0;
}

.pu-wo-code {
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
}

.pu-wo-title {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
  white-space: nowrap;
}

.pu-wo-done-label {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #0c4a3f;
}

.pu-wo-field {
  padding-top: 10px;
}

.pu-wo-field__label {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #3a5c54;
}

.pu-wo-field__req {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 700;
  color: #dc2626;
  background: #fee2e2;
  border-radius: 4px;
}

.pu-wo-attachments {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.pu-wo-att {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  width: fit-content;
  padding: 4px 10px;
  font-size: 12px;
  background: #f1f7f4;
  border-radius: 6px;
}

.pu-wo-att__name {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #0c4a3f;
  white-space: nowrap;
}

.pu-wo-pending {
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 12px;
  color: #71867f;
  background: #f9fafb;
  border: 1px dashed #e4edea;
  border-radius: 8px;
}

.pu-tip {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px 14px;
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #3a5c54;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
}

.pu-tip strong {
  font-weight: 600;
  color: #1e40af;
}

.dd-summary__hint {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #869b94;
}

/* ===== 基础 ===== */
</style>
