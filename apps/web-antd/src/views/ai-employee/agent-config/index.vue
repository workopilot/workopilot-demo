<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  Col,
  Divider,
  Input,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Select,
  Space,
  Switch,
  TabPane,
  Tabs,
  Upload,
} from 'ant-design-vue';

const router = useRouter();
const route = useRoute();

const activeKey = ref(route.query.tab === 'performance' ? 'performance' : 'skills');
const avatarUrl = ref('/auditdemo/images/ai-employee/sales.png');

// File Upload mock logic
const beforeUpload = (file: File) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.addEventListener('load', () => {
    avatarUrl.value = reader.result as string;
  });
  return false;
};

// Mock data for Skills (Plugin store feeling)
const skills = ref([
  {
    id: '1',
    label: '单据生成 (Excel/宣传册)',
    desc: '能够根据自然语言意图汇总数据，一键生成标准药企报价单及精美的高效宣传图文。',
    value: 'file_gen',
    icon: 'lucide:file-spreadsheet',
    bg: 'from-blue-500 to-cyan-500',
    checked: true,
  },
  {
    id: '2',
    label: '报表绘制 (可视化分析)',
    desc: '连接中台数据库，自动提取多维度数据生成企业经营驾驶舱图表展现。',
    value: 'charts_gen',
    icon: 'lucide:pie-chart',
    bg: 'from-purple-500 to-fuchsia-500',
    checked: true,
  },
  {
    id: '3',
    label: '主数据查询工具',
    desc: '自动调用企业主数据搜索系统检索所需的产品核心物料信息与各类数据。',
    value: 'db_search',
    icon: 'lucide:database',
    bg: 'from-emerald-500 to-teal-500',
    checked: true,
  },
  {
    id: '4',
    label: '公众号图文推送',
    desc: '将生成的宣传册与文章一键调用微信开放平台接口推送到企业服务号。',
    value: 'wechat_post',
    icon: 'lucide:send',
    bg: 'from-orange-500 to-red-500',
    checked: false,
  },
]);

// Mock data for Human-in-the-loop interactive cards
const interactiveCards = ref([
  {
    label: '选品单确认面板 (主数据结果核对)',
    value: 'quote_card',
    checked: true,
  },
  { label: '可视化图表绘制确认面板', value: 'chart_card', checked: false },
  {
    label: '公文/推文发布前审核侧滑面板',
    value: 'review_card',
    checked: false,
  },
]);

// Skill Configuration Modal Logic
const configVisible = ref(false);
const currentConfigSkill = ref<any>(null);
const fileGenSettings = ref({
  excelTemplate: 'template_a',
  brochureLayout: 'grid',
  brochureTheme: 'orange',
  displayFields: ['projectName', 'itemName', 'spec', 'price', 'profit'],
});
const dbSearchSettings = ref({
  scopes: ['product_info', 'price_info', 'sales_volume'],
});

const openSkillConfig = (skill: any) => {
  currentConfigSkill.value = skill;
  configVisible.value = true;
};
</script>

<template>
  <div class="min-h-[calc(100vh-100px)] bg-slate-50/50 p-6 md:p-8">
    <!-- Modern Header -->
    <div class="mb-8 flex items-start justify-between">
      <div class="flex items-center gap-6">
        <Button
          type="text"
          shape="circle"
          class="!flex !h-12 !w-12 !items-center !justify-center border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300"
          @click="router.back()"
        >
          <Icon icon="lucide:arrow-left" class="size-5 text-slate-600" />
        </Button>
        <div
          class="group relative h-[72px] w-[72px] cursor-pointer overflow-hidden rounded-full border-4 border-white bg-white shadow-sm ring-1 ring-slate-200"
        >
          <img
            :src="avatarUrl"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div
            class="absolute inset-0 hidden items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all group-hover:flex"
          >
            <Upload
              name="avatar"
              :show-upload-list="false"
              :before-upload="beforeUpload"
            >
              <Icon icon="lucide:camera" class="size-6 text-white" />
            </Upload>
          </div>
        </div>
        <div>
          <h1
            class="m-0 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900"
          >
            选品报价员
            <span
              class="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-blue-600 shadow-sm"
              >ID: AGT-8921</span
            >
          </h1>
          <p class="m-0 mt-1.5 font-medium tracking-wide text-slate-500">
            高级销售部数字员工 • 正在为您配置对应的技能参数和交互体验。
          </p>
        </div>
      </div>
      <Space size="middle">
        <Button
          size="large"
          class="!rounded-lg border-slate-300 !px-6 font-medium text-slate-600"
        >
          取消暂存
        </Button>
        <Button
          type="primary"
          size="large"
          class="!rounded-lg border-none bg-slate-900 !px-6 font-bold shadow-lg shadow-blue-500/20 transition-colors hover:bg-slate-800"
        >
          <Icon icon="lucide:save" class="mr-2 opacity-80" /> 部署全部配置
        </Button>
      </Space>
    </div>

    <!-- Main Config Area (Bento Layout) -->
    <div
      class="min-h-[500px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm"
    >
      <Tabs v-model:active-key="activeKey" class="modern-tabs w-full px-8 pt-4">
        <!-- 基础设置 -->
        <TabPane key="basic" tab="员工档案定义" class="pb-10 pt-4">
          <div
            class="grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-[1fr_2.5fr]"
          >
            <!-- Avatar Upload Card Bento -->
            <div
              class="flex h-fit flex-col items-center justify-center rounded-[1.5rem] border border-slate-100 bg-slate-50/50 p-8 shadow-sm"
            >
              <Avatar
                :size="140"
                :src="avatarUrl"
                class="mb-6 border-[5px] border-white bg-white object-cover shadow-xl"
              />
              <Upload
                name="avatar"
                :show-upload-list="false"
                :before-upload="beforeUpload"
                class="w-full"
              >
                <Button
                  class="flex !h-12 w-full items-center justify-center gap-2 !rounded-xl border-slate-200 bg-white font-bold text-slate-700 shadow-sm transition-all hover:border-blue-400 hover:text-blue-600"
                >
                  <Icon icon="lucide:image-plus" class="size-5" />
                  替换工作证件照
                </Button>
              </Upload>
              <span
                class="mt-4 px-4 text-center text-xs font-medium text-slate-400"
                >系统建议上传 1:1 像数比例的高清正装职场肖像。</span
              >
            </div>

            <!-- Form Bento -->
            <div class="flex w-full flex-col gap-6">
              <Row :gutter="24">
                <Col :span="14">
                  <div class="mb-4 flex flex-col gap-1.5 font-bold">
                    <label class="text-[13px] text-slate-700"
                      >数字员工姓名 <span class="text-red-500">*</span></label
                    >
                    <Input
                      value="选品报价员"
                      size="large"
                      class="!h-12 !rounded-xl border-slate-200 !bg-slate-50/50 px-4 focus:!bg-white"
                    />
                  </div>
                </Col>
                <Col :span="10">
                  <div class="mb-4 flex flex-col gap-1.5 font-bold">
                    <label class="text-[13px] text-slate-700"
                      >员工当前状态</label
                    >
                    <div
                      class="flex h-12 w-full items-center rounded-xl border border-slate-200 bg-slate-50/50 px-4"
                    >
                      <Switch
                        checked
                        checked-children="正常服役"
                        un-checked-children="停职暂存"
                      />
                    </div>
                  </div>
                </Col>
              </Row>
              <div class="flex flex-col gap-1.5 font-bold">
                <label class="text-[13px] text-slate-700"
                  >核心岗位描述 (将展示在员工介绍页)</label
                >
                <Input.TextArea
                  value="熟悉医药市场的选品与报价专家，能够快速根据客户模糊需求，从庞大的产品库中筛选高利润药品并生成业务单据。"
                  :rows="3"
                  class="!rounded-xl border-slate-200 !bg-slate-50/50 p-4 !text-sm leading-relaxed focus:!bg-white"
                />
              </div>
              <div class="flex flex-col gap-1.5 font-bold">
                <label class="text-[13px] text-slate-700"
                  >工作台默认唤醒开场白</label
                >
                <Input.TextArea
                  value="您好！我是您的专属选品报价员。请告诉我客户的需求（如：需要一批儿科感冒药，利润空间好一点），我将马上为您从主数据中心精准检索。"
                  :rows="3"
                  class="!rounded-xl border-slate-200 !bg-slate-50/50 p-4 !text-sm leading-relaxed focus:!bg-white"
                />
              </div>
            </div>
          </div>
        </TabPane>

        <!-- 技能超市与UI交互卡片 (Plugin App Store) -->
        <TabPane key="skills" tab="能力块与交互控制" class="pb-10 pt-4">
          <div class="flex w-full gap-10">
            <div class="flex-1">
              <h3 class="mb-2 text-xl font-bold tracking-tight text-slate-800">
                配置底座功能插件
              </h3>
              <p class="mb-8 text-sm font-medium text-slate-500">
                您可以为该数字员工装配功能块。每一个开启的插件背后都集成了强大的工具链。通过小齿轮
                ⚙️ 您能自定义其调用策略。
              </p>

              <div class="grid-col-1 grid gap-6 xl:grid-cols-2">
                <div
                  v-for="skill in skills"
                  :key="skill.value"
                  class="group relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] border bg-white p-6 shadow-sm transition-all duration-300"
                  :class="{
                    'border-slate-800 bg-white shadow-xl ring-1 ring-slate-800 hover:-translate-y-1':
                      skill.checked,
                    'border-slate-200 hover:border-slate-400 hover:shadow-md':
                      !skill.checked,
                  }"
                >
                  <!-- Plugin Header -->
                  <div class="mb-4 flex items-start justify-between">
                    <div
                      class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner"
                      :class="skill.bg"
                    >
                      <Icon :icon="skill.icon" class="size-7 text-white" />
                    </div>
                    <Switch v-model:checked="skill.checked" />
                  </div>

                  <!-- Title & Desc -->
                  <div>
                    <h4 class="mb-2 text-lg font-extrabold text-slate-800">
                      {{ skill.label }}
                    </h4>
                    <p
                      class="h-[3.5rem] text-xs font-medium leading-relaxed text-slate-500 xl:h-[4.5rem]"
                    >
                      {{ skill.desc }}
                    </p>
                  </div>

                  <!-- Footer Config -->
                  <div
                    class="relative mt-2 flex items-center justify-between border-t border-slate-100 pt-4 transition-opacity"
                    :class="
                      skill.checked
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-30'
                    "
                  >
                    <span
                      class="py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400"
                      >{{ skill.checked ? 'Running' : 'Offline' }}</span
                    >
                    <Button
                      type="text"
                      shape="circle"
                      class="!flex !h-10 !w-10 !items-center !justify-center border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:border-slate-800 hover:bg-slate-800 hover:text-white"
                      @click="openSkillConfig(skill)"
                      :disabled="!skill.checked"
                    >
                      <Icon icon="lucide:settings-2" class="size-[18px]" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div
              class="flex h-full w-[380px] shrink-0 flex-col border-l border-slate-100 pl-10"
            >
              <div
                class="rounded-[1.5rem] border border-blue-100 bg-blue-50/50 p-6"
              >
                <h4
                  class="mb-2 flex items-center gap-2 text-lg font-extrabold text-slate-800"
                >
                  <Icon icon="lucide:blocks" class="text-blue-600" />
                  Human-in-the-loop
                </h4>
                <p
                  class="mb-6 text-xs font-medium leading-relaxed text-slate-500"
                >
                  指定本智能体在长工作流中，执行何种风险阻断任务时必须弹出右侧互动卡片强制获得人工授权及复核。
                </p>

                <div class="flex flex-col gap-4">
                  <div
                    v-for="card in interactiveCards"
                    :key="card.value"
                    class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <span class="text-sm font-bold text-slate-700">{{
                      card.label
                    }}</span>
                    <Switch v-model:checked="card.checked" size="small" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabPane>

        <!-- 业务提示词与规则 -->
        <TabPane key="prompts" tab="人设与规则引擎" class="pb-10 pt-4">
          <div
            class="grid max-w-6xl grid-cols-1 gap-8 xl:grid-cols-[1fr_350px]"
          >
            <!-- Left: Prompt Editors -->
            <div class="flex flex-col gap-6">
              <div
                class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div
                  class="absolute left-0 top-0 h-full w-1.5 bg-blue-500"
                ></div>
                <div class="mb-2 flex items-center gap-2">
                  <Icon
                    icon="lucide:terminal-square"
                    class="size-5 text-blue-600"
                  />
                  <h3 class="m-0 text-base font-extrabold text-slate-800">
                    系统提示词 (System Prompt)
                  </h3>
                </div>
                <p class="mb-4 text-[13px] font-medium text-slate-500">
                  定义该数字员工思考的工作方式、价值观与领域知识。这将被作为上下文的第一层进行底层系统注入。
                </p>
                <Input.TextArea
                  value="- 你现在是医药连锁总部的精锐选品分析师。\n- 你的主要任务是从千万级 SKU 中匹配客户意图。\n- 优先选择带「高毛利率」和「当期促销」标签的库存药品。\n- 你的语气必须专业、干练，不提供医药诊断建议。\n- 任何关于竞争对手产品的数据对比，必须表明是基于公共市调数据。"
                  :auto-size="{ minRows: 8 }"
                  class="!rounded-xl !border-slate-300 !bg-white !p-4 !font-mono !text-[13px] !leading-relaxed shadow-inner transition-all focus:!border-blue-500 focus:!ring-4 focus:!ring-blue-500/10"
                />
              </div>

              <div
                class="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div
                  class="absolute left-0 top-0 h-full w-1.5 bg-red-400"
                ></div>
                <div class="mb-2 flex items-center gap-2">
                  <Icon
                    icon="lucide:shield-alert"
                    class="size-5 text-red-500"
                  />
                  <h3 class="m-0 text-base font-extrabold text-slate-800">
                    红线与安全边界 (Negative Prompts)
                  </h3>
                </div>
                <p class="mb-4 text-[13px] font-medium text-slate-500">
                  强烈禁止模型生成的特定格式或回答倾向，用于阻断核心机密的流失和强化合规防护网。
                </p>
                <Input.TextArea
                  value="1. 严禁向客户提供未经验证的开药、处方建议作为确定的结论。\n2. 绝对不能在报价中泄露公司的最低“进货底牌价”（除非获取总监级授权指令）。\n3. 如果没有命中主数据查询结果，禁止自身伪造、编造药品名称或功效虚假信息。"
                  :auto-size="{ minRows: 4 }"
                  class="!rounded-xl !border-slate-300 !bg-white !p-4 !font-mono !text-[13px] !leading-relaxed !text-red-900 shadow-inner transition-all focus:!border-red-400 focus:!ring-4 focus:!ring-red-400/10"
                />
              </div>
            </div>

            <!-- Right: Hyperparameters -->
            <div class="flex flex-col gap-6">
              <div
                class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3
                  class="m-0 mb-6 flex items-center gap-2 text-[15px] font-extrabold text-slate-800"
                >
                  <Icon
                    icon="lucide:sliders-horizontal"
                    class="text-slate-500"
                  />
                  推理干预变量 (Hyperparameters)
                </h3>

                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                      <label class="text-[13px] font-bold text-slate-700"
                        >随机性温度 (Temperature)</label
                      >
                      <span
                        class="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-600"
                        >0.3</span
                      >
                    </div>
                    <p class="m-0 text-[11px] leading-tight text-slate-400">
                      决定输出内容的随机性。由于医药单据严谨度要求极高，系统已强制锁定在较低数值。
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value="0.3"
                      class="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                    />
                    <div
                      class="mt-0.5 flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      <span>严谨 Accurate</span>
                      <span>发散 Creative</span>
                    </div>
                  </div>

                  <Divider class="!my-2 !border-slate-100" />

                  <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between">
                      <label class="text-[13px] font-bold text-slate-700"
                        >单次反馈容积 (Max Tokens)</label
                      >
                      <span
                        class="rounded bg-blue-50 px-2 py-0.5 font-mono text-xs font-bold text-blue-600"
                        >1500</span
                      >
                    </div>
                    <p class="m-0 text-[11px] leading-tight text-slate-400">
                      限制单次流式对话能够抛出的最大文本量边界。
                    </p>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value="1500"
                      class="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600"
                    />
                  </div>
                </div>
              </div>

              <!-- Model Selector Light Box -->
              <div
                class="group relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm"
              >
                <Icon
                  icon="lucide:cpu"
                  class="absolute -bottom-6 -right-6 size-32 text-blue-500/5 transition-transform duration-700 group-hover:rotate-12"
                />
                <h3
                  class="relative z-10 m-0 mb-2 flex items-center gap-2 text-[15px] font-extrabold text-slate-800"
                >
                  底座大语言模型
                </h3>
                <p class="relative z-10 m-0 mb-4 text-[12px] text-slate-500">
                  当前接驳推理的知识基座。
                </p>
                <div
                  class="relative z-10 rounded-xl border border-blue-200 bg-white shadow-sm"
                >
                  <Select
                    value="qwen_max"
                    size="large"
                    class="w-full !font-medium"
                    :bordered="false"
                  >
                    <Select.Option value="qwen_max">
                      通义千问 Qwen-Max (推荐)
                    </Select.Option>
                    <Select.Option value="gpt4">OpenAI GPT-4o</Select.Option>
                    <Select.Option value="deepseek">
                      DeepSeek Coder V2
                    </Select.Option>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </TabPane>

        <TabPane key="performance" tab="绩效" class="pb-10 pt-4">
          <div class="max-w-6xl">
            <div class="mb-6 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <h3 class="m-0 text-xl font-bold text-slate-900">员工绩效配置</h3>
                <p class="mb-0 mt-2 text-sm text-slate-500">先选择考核维度，再为当前员工设置独立的月度或季度目标。</p>
              </div>
              <Space>
                <Button @click="router.push('/digital-employees/performance-dashboard')">查看绩效看板</Button>
                <Button type="primary"><Icon icon="lucide:save" class="mr-1" />保存绩效配置</Button>
              </Space>
            </div>

            <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div class="rounded-xl border border-slate-200 bg-white p-5"><p class="m-0 text-xs font-medium text-slate-500">已选维度</p><p class="mb-0 mt-2 text-2xl font-bold text-slate-900">4 <span class="text-sm font-medium text-slate-400">项</span></p></div>
              <div class="rounded-xl border border-slate-200 bg-white p-5"><p class="m-0 text-xs font-medium text-slate-500">本期目标</p><p class="mb-0 mt-2 text-2xl font-bold text-slate-900">2 <span class="text-sm font-medium text-slate-400">项</span></p></div>
              <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5"><p class="m-0 text-xs font-medium text-emerald-700">采集状态</p><p class="mb-0 mt-2 flex items-center gap-2 text-base font-bold text-emerald-700"><span class="size-2 rounded-full bg-emerald-500"></span>正常采集</p></div>
            </div>

            <section class="mb-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div class="flex items-center gap-3"><span class="grid size-8 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">1</span><div><h4 class="m-0 text-base font-bold text-slate-900">设置考核维度</h4><p class="mb-0 mt-1 text-xs text-slate-500">同一员工可以同时配置多个业务与使用维度。</p></div></div><Space><Button>从维度库选择</Button><Button type="primary" ghost>新建考核维度</Button></Space></div>
              <div class="overflow-hidden rounded-xl border border-slate-200">
                <div v-for="metric in [{name:'已解决工单数',code:'ticket_resolved_count',unit:'单',source:'维度库',enabled:true},{name:'PPT 数',code:'ppt_completed_count',unit:'份',source:'维度库',enabled:true},{name:'使用人数',code:'sys_active_user_count',unit:'人',source:'平台内置',enabled:true},{name:'有效使用时长',code:'sys_active_usage_seconds',unit:'小时',source:'平台内置',enabled:true}]" :key="metric.code" class="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-0 md:grid-cols-[1.2fr_1.2fr_80px_90px_auto]"><b class="text-sm text-slate-800">{{ metric.name }}</b><code class="hidden text-xs text-slate-400 md:block">{{ metric.code }}</code><span class="hidden text-sm text-slate-500 md:block">{{ metric.unit }}</span><span class="hidden text-xs text-slate-500 md:block">{{ metric.source }}</span><Switch v-model:checked="metric.enabled" size="small" /></div>
              </div>
            </section>

            <section class="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
              <div class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div class="flex items-center gap-3"><span class="grid size-8 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">2</span><div><h4 class="m-0 text-base font-bold text-slate-900">设置周期维度目标</h4><p class="mb-0 mt-1 text-xs text-slate-500">单位由维度自动带出，没有目标的维度仍会统计实际值。</p></div></div><Space><Select value="month" class="w-24" :options="[{value:'month',label:'月度'},{value:'quarter',label:'季度'}]" /><Select value="2026-09" class="w-36" :options="[{value:'2026-09',label:'2026 年 9 月'},{value:'2026-10',label:'2026 年 10 月'}]" /></Space></div>
              <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div class="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><b class="text-sm text-slate-800">已解决工单数</b><p class="mb-0 mt-1 text-xs text-slate-400">按量累计 · 单</p></div><Input value="300" class="w-28" addon-after="单" /></div>
                <div class="flex items-center justify-between rounded-xl border border-slate-200 p-4"><div><b class="text-sm text-slate-800">使用人数</b><p class="mb-0 mt-1 text-xs text-slate-400">周期去重 · 人</p></div><Input value="50" class="w-28" addon-after="人" /></div>
                <div class="flex items-center justify-between rounded-xl border border-dashed border-slate-300 p-4"><div><b class="text-sm text-slate-800">PPT 数</b><p class="mb-0 mt-1 text-xs text-slate-400">仅统计，未设目标</p></div><Button type="link">设置目标</Button></div>
                <div class="flex items-center justify-between rounded-xl border border-dashed border-slate-300 p-4"><div><b class="text-sm text-slate-800">有效使用时长</b><p class="mb-0 mt-1 text-xs text-slate-400">仅统计，未设目标</p></div><Button type="link">设置目标</Button></div>
              </div>
              <Alert class="mt-5" type="info" show-icon message="开发接入正常" description="运维工单系统最近于 5 分钟前上报业绩；标准聊天页和工作台已覆盖使用活动采集。" />
            </section>
          </div>
        </TabPane>
      </Tabs>
    </div>

    <!-- UI/UX Pro Max Plugin Settings Modal -->
    <Modal
      v-model:open="configVisible"
      :closable="false"
      centered
      :width="640"
      wrap-class-name="modern-modal"
      :footer="null"
    >
      <div
        class="relative flex h-full flex-col px-2 pb-5 pt-3"
        v-if="
          currentConfigSkill?.value === 'file_gen' ||
          currentConfigSkill?.value === 'db_search'
        "
      >
        <!-- Modal Header -->
        <div
          class="mb-8 flex items-start justify-between border-b border-slate-100 pb-5"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner"
              :class="currentConfigSkill.bg"
            >
              <Icon :icon="currentConfigSkill.icon" class="size-6 text-white" />
            </div>
            <div>
              <h3
                class="m-0 text-[1.4rem] font-extrabold tracking-tight text-slate-900"
              >
                {{ currentConfigSkill.label }} 工具配置
              </h3>
              <p class="m-0 mt-1 text-xs font-medium text-slate-500">
                定制该工序在后台执行时的精细参数细节与授权范围。
              </p>
            </div>
          </div>
          <Button
            type="text"
            shape="circle"
            class="bg-slate-50 text-slate-400 hover:text-slate-800"
            @click="configVisible = false"
          >
            <Icon icon="lucide:x" class="size-5" />
          </Button>
        </div>

        <!-- Template for File Generation Plugin -->
        <div
          class="custom-scrollbar flex flex-1 flex-col gap-8 overflow-y-auto pr-2"
          v-if="currentConfigSkill?.value === 'file_gen'"
        >
          <!-- Block 1: Excel -->
          <div
            class="rounded-2xl border border-slate-100/50 bg-slate-50/50 p-6"
          >
            <div class="mb-4 flex items-center gap-2">
              <Icon
                icon="lucide:file-spreadsheet"
                class="size-5 text-green-600"
              />
              <h4 class="m-0 font-extrabold text-slate-800">
                Excel 报价单产出设置
              </h4>
            </div>
            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-bold text-slate-600"
                >选用底层模板引擎</label
              >
              <Select
                v-model:value="fileGenSettings.excelTemplate"
                size="large"
                class="w-full !font-medium"
              >
                <Select.Option value="template_a">
                  通用标准医药报价单 (带内部阶梯价计算式)
                </Select.Option>
                <Select.Option value="template_b">
                  集团大客户专供报价单 (仅展示最高售价与优惠卷)
                </Select.Option>
              </Select>
            </div>
          </div>

          <!-- Block 2: Brochure -->
          <div
            class="rounded-2xl border border-slate-100/50 bg-slate-50/50 p-6"
          >
            <div class="mb-4 flex items-center gap-2">
              <Icon icon="lucide:book-image" class="size-5 text-orange-500" />
              <h4 class="m-0 font-extrabold text-slate-800">
                高清图文宣传册 (PDF) 排版设置
              </h4>
            </div>

            <div class="mb-6 flex flex-col gap-2">
              <label class="text-[13px] font-bold text-slate-600"
                >宣传册色彩模版 (Theme)</label
              >
              <RadioGroup
                v-model:value="fileGenSettings.brochureTheme"
                button-style="solid"
                class="modern-radio-group grid grid-cols-3 gap-3"
              >
                <Radio.Button
                  value="orange"
                  class="!flex !h-auto !items-center !justify-center !rounded-xl !border-slate-200 !px-0 !py-2.5"
                >
                  <div class="flex items-center gap-2">
                    <span class="size-3.5 rounded-full bg-orange-500"></span>
                    <span class="text-xs font-bold text-slate-700"
                      >橙色模版</span
                    >
                  </div>
                </Radio.Button>
                <Radio.Button
                  value="blue"
                  class="!flex !h-auto !items-center !justify-center !rounded-xl !border-slate-200 !px-0 !py-2.5"
                >
                  <div class="flex items-center gap-2">
                    <span class="size-3.5 rounded-full bg-blue-500"></span>
                    <span class="text-xs font-bold text-slate-700"
                      >蓝色模版</span
                    >
                  </div>
                </Radio.Button>
                <Radio.Button
                  value="red"
                  class="!flex !h-auto !items-center !justify-center !rounded-xl !border-slate-200 !px-0 !py-2.5"
                >
                  <div class="flex items-center gap-2">
                    <span class="size-3.5 rounded-full bg-red-500"></span>
                    <span class="text-xs font-bold text-slate-700"
                      >红色模版</span
                    >
                  </div>
                </Radio.Button>
              </RadioGroup>
            </div>

            <div class="mb-6 flex flex-col gap-2">
              <label class="text-[13px] font-bold text-slate-600"
                >展示版式结构 (Layout)</label
              >
              <RadioGroup
                v-model:value="fileGenSettings.brochureLayout"
                button-style="solid"
                class="modern-radio-group grid grid-cols-2 gap-3"
              >
                <Radio.Button
                  value="grid"
                  class="flex h-auto flex-col items-center justify-center !rounded-xl !border-slate-200 p-4 !text-center"
                >
                  <Icon
                    icon="lucide:layout-grid"
                    class="mb-2 size-6 opacity-80"
                  />
                  图文九宫格阵列
                </Radio.Button>
                <Radio.Button
                  value="list"
                  class="flex h-auto flex-col items-center justify-center !rounded-xl !border-slate-200 p-4 !text-center"
                >
                  <Icon
                    icon="lucide:layout-list"
                    class="mb-2 size-6 opacity-80"
                  />
                  单列瀑布流大图
                </Radio.Button>
              </RadioGroup>
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-bold text-slate-600"
                >卡片必须展示的数据明细项目</label
              >
              <Checkbox.Group
                v-model:value="fileGenSettings.displayFields"
                class="mt-1 grid w-full grid-cols-2 gap-3"
              >
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20':
                      fileGenSettings.displayFields.includes('projectName'),
                  }"
                >
                  <Checkbox value="projectName" />
                  <span class="text-[13px] font-bold text-slate-700"
                    >产品全称 Name</span
                  >
                </label>
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20':
                      fileGenSettings.displayFields.includes('itemName'),
                  }"
                >
                  <Checkbox value="itemName" />
                  <span class="text-[13px] font-bold text-slate-700"
                    >主治项目 Project</span
                  >
                </label>
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20':
                      fileGenSettings.displayFields.includes('spec'),
                  }"
                >
                  <Checkbox value="spec" />
                  <span class="text-[13px] font-bold text-slate-700"
                    >包装规格 Spec</span
                  >
                </label>
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20':
                      fileGenSettings.displayFields.includes('price'),
                  }"
                >
                  <Checkbox value="price" />
                  <span class="text-[13px] font-bold text-slate-700"
                    >建议价展示 Price</span
                  >
                </label>
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500/20':
                      fileGenSettings.displayFields.includes('profit'),
                  }"
                >
                  <Checkbox value="profit" />
                  <span class="text-[13px] font-bold text-slate-700"
                    >利润率测算 Profit</span
                  >
                </label>
              </Checkbox.Group>
            </div>
          </div>
        </div>

        <!-- Template for DB Search Plugin -->
        <div
          class="custom-scrollbar flex flex-1 flex-col gap-8 overflow-y-auto pr-2"
          v-else-if="currentConfigSkill?.value === 'db_search'"
        >
          <div class="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <div class="mb-2 flex items-center gap-2">
              <Icon icon="lucide:shield-check" class="size-5 text-blue-600" />
              <h4 class="m-0 font-extrabold text-slate-800">检索作用域授权</h4>
            </div>
            <p class="mb-5 text-xs font-medium text-slate-500">
              设定当前数字员工在执行意图拆解后能直接穿透读取的数据库范围。
            </p>

            <div class="flex flex-col gap-2">
              <Checkbox.Group
                v-model:value="dbSearchSettings.scopes"
                class="mt-1 flex w-full flex-col gap-3"
              >
                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'bg-blue-[2%] border-blue-500 ring-1 ring-blue-500/20':
                      dbSearchSettings.scopes.includes('product_info'),
                  }"
                >
                  <Checkbox value="product_info" />
                  <div class="flex w-full items-center gap-3">
                    <div class="rounded bg-slate-100 p-2">
                      <Icon icon="lucide:box" class="size-4 text-slate-500" />
                    </div>
                    <span class="text-[14px] font-bold text-slate-700"
                      >产品主数据信息检索</span
                    >
                  </div>
                  <Tag class="!m-0 text-xs" color="blue">基础物料表</Tag>
                </label>

                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'bg-blue-[2%] border-blue-500 ring-1 ring-blue-500/20':
                      dbSearchSettings.scopes.includes('price_info'),
                  }"
                >
                  <Checkbox value="price_info" />
                  <div class="flex w-full items-center gap-3">
                    <div class="rounded bg-slate-100 p-2">
                      <Icon icon="lucide:tag" class="size-4 text-slate-500" />
                    </div>
                    <span class="text-[14px] font-bold text-slate-700"
                      >底价与多套指导价穿透查询</span
                    >
                  </div>
                  <Tag class="!m-0 text-xs" color="blue">多级价目表</Tag>
                </label>

                <label
                  class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-blue-400"
                  :class="{
                    'bg-blue-[2%] border-blue-500 ring-1 ring-blue-500/20':
                      dbSearchSettings.scopes.includes('sales_volume'),
                  }"
                >
                  <Checkbox value="sales_volume" />
                  <div class="flex w-full items-center gap-3">
                    <div class="rounded bg-slate-100 p-2">
                      <Icon
                        icon="lucide:Trending-up"
                        class="size-4 text-slate-500"
                      />
                    </div>
                    <span class="text-[14px] font-bold text-slate-700"
                      >全网历史销量大数据集查询</span
                    >
                  </div>
                  <Tag class="!m-0 text-xs" color="blue">经营看板表</Tag>
                </label>

                <label
                  class="pointer-events-none flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 opacity-50"
                >
                  <Checkbox value="finance_cost" />
                  <div class="flex w-full items-center gap-3">
                    <div class="rounded bg-slate-100 p-2">
                      <Icon icon="lucide:lock" class="size-4 text-slate-500" />
                    </div>
                    <span class="text-[14px] font-bold text-slate-700"
                      >底层供应链成本底牌查询</span
                    >
                  </div>
                  <Tag class="!m-0 text-xs" color="red">无权限</Tag>
                </label>
              </Checkbox.Group>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex justify-end border-t border-slate-100 pt-6">
          <Button
            type="primary"
            size="large"
            class="!h-12 !rounded-xl border-none bg-slate-900 !px-8 font-bold shadow-lg hover:bg-slate-800"
            @click="configVisible = false"
          >
            保存并应用
          </Button>
        </div>
      </div>

      <div
        class="relative flex min-h-[300px] flex-col items-center justify-center py-12 text-slate-400"
        v-else
      >
        <Button
          type="text"
          shape="circle"
          class="absolute right-0 top-0 bg-slate-50 text-slate-400 hover:text-slate-800"
          @click="configVisible = false"
        >
          <Icon icon="lucide:x" class="size-5" />
        </Button>
        <Icon icon="lucide:cone" class="mb-4 size-16 opacity-30" />
        <p class="font-medium">此预置插件的高级配置面板尚在研发接入中...</p>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
/* Ant Design tabs override */
.modern-tabs :deep(.ant-tabs-nav::before) {
  border-bottom: 2px solid #f1f5f9;
}

.modern-tabs :deep(.ant-tabs-tab) {
  padding: 16px 0;
  margin-right: 40px;
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

.modern-tabs :deep(.ant-tabs-tab-active) {
  color: #0f172a;
}

.modern-tabs :deep(.ant-tabs-ink-bar) {
  height: 3px;
  background: #0f172a;
  border-radius: 3px;
}

/* Modal overrides */
:global(.modern-modal .ant-modal-content) {
  padding: 24px 32px;
  border-radius: 2rem;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 25%);
}

/* Radio Button overrides */
.modern-radio-group :deep(.ant-radio-button-wrapper) {
  border: 1px solid #e2e8f0;
}

.modern-radio-group :deep(.ant-radio-button-wrapper:not(:first-child)::before) {
  display: none;
}

.modern-radio-group
  :deep(
    .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)
  ) {
  z-index: 1;
  color: #2563eb;
  background: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}
</style>
