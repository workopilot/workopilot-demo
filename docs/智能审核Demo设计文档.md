# 智能审核管理后台前端Demo - 视觉设计文档

## 📋 项目概述

本文档描述基于Vben Admin 5.0框架开发的智能审核管理后台前端Demo的视觉设计方案。设计理念强调**现代化**、**数据驱动**和**交互友好**,避免传统后台管理系统的平庸设计。

### 设计目标

- ✨ 打造具有科技感的现代化界面
- 📊 通过数据可视化提升信息传达效率
- 🎨 运用渐变色、动画等元素增强视觉吸引力
- 💡 提供流畅的交互体验和清晰的信息层级

---

## 🎨 视觉设计系统

### 1. 色彩方案

#### 主题色彩

```css
/* 审核状态色彩编码 */
--color-audit-pass: linear-gradient(
  135deg,
  #52c41a 0%,
  #95de64 100%
); /* 通过 - 绿色渐变 */
--color-audit-warning: linear-gradient(
  135deg,
  #faad14 0%,
  #ffc53d 100%
); /* 警告 - 橙色渐变 */
--color-audit-reject: linear-gradient(
  135deg,
  #f5222d 0%,
  #ff4d4f 100%
); /* 拒绝 - 红色渐变 */
--color-audit-pending: linear-gradient(
  135deg,
  #1890ff 0%,
  #40a9ff 100%
); /* 待审 - 蓝色渐变 */
```

#### 中性色系

```css
/* 背景和边框 */
--bg-card: hsl(var(--card)); /* 卡片背景 */
--border-subtle: hsl(var(--border)); /* 微妙边框 */
--text-primary: hsl(var(--foreground)); /* 主要文本 */
--text-secondary: hsl(var(--foreground) / 0.8); /* 次要文本 */
--text-tertiary: hsl(var(--foreground) / 0.6); /* 辅助文本 */
```

### 2. 排版系统

| 字体大小 | Tailwind类  | 用途            | 行高 |
| -------- | ----------- | --------------- | ---- |
| 32px     | `text-3xl`  | 大标题/数据展示 | 40px |
| 24px     | `text-2xl`  | 页面标题        | 32px |
| 20px     | `text-xl`   | Card标题        | 28px |
| 16px     | `text-base` | 正文            | 24px |
| 14px     | `text-sm`   | 辅助信息        | 20px |
| 12px     | `text-xs`   | 次要信息/标签   | 16px |

**字重规范**:

- `font-semibold` (600): 标题、强调文本
- `font-medium` (500): 次级标题
- `font-normal` (400): 正文内容

### 3. 间距系统

```css
/* 组件内间距 */
padding-xs: 0.5rem; /* 8px  - 紧凑元素 */
padding-sm: 0.75rem; /* 12px - 小型组件 */
padding-md: 1rem; /* 16px - 标准间距 */
padding-lg: 1.5rem; /* 24px - 卡片内容 */
padding-xl: 2rem; /* 32px - 页面容器 */

/* 组件间距 */
gap-4: 1rem; /* 16px - 卡片间距 */
gap-5: 1.25rem; /* 20px - 区块间距 */
gap-6: 1.5rem; /* 24px - 大区块间距 */
```

### 4. 阴影层级

```css
/* 卡片阴影 */
shadow-sm:     0 1px 2px rgba(0,0,0,0.05);           /* 轻微浮起 */
shadow:        0 2px 8px rgba(0,0,0,0.1);            /* 标准卡片 */
shadow-lg:     0 10px 30px rgba(0,0,0,0.15);         /* 强调卡片 */
shadow-xl:     0 20px 50px rgba(0,0,0,0.2);          /* 模态框/抽屉 */

/* Hover状态 */
hover:shadow-lg: 卡片hover时提升阴影层级
```

### 5. 圆角系统

```css
rounded-sm: 4px; /* 小元素(Tag/Badge) */
rounded-md: 6px; /* 按钮 */
rounded-lg: 8px; /* 卡片 */
rounded-xl: 12px; /* 大卡片/模态框 */
rounded-2xl: 16px; /* 特大容器 */
```

---

## 🖼️ 页面设计详解

### P4: 审核监控大屏 (首页)

**路径**: `/audit/dashboard`

#### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  【顶部统计卡片区】Grid 4列                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌─────┐ │
│  │ 📈 今日审核量 │ │ 💰 拦截金额   │ │ ⏱️ 平均耗时   │ │通过率│ │
│  │   1,234      │ │  ¥85,600     │ │   1.8s       │ │ 87% │ │
│  │   ↑ 12%     │ │  ↑ 23%       │ │  ↓ 0.3s      │ │ ↑5% │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └─────┘ │
├─────────────────────────────────────────────────────────────┤
│  【中部图表区】Tabs切换                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [审核趋势📈] [违规分布📊]                              │    │
│  │ ┌─────────────────────────────────────────────────┐ │    │
│  │ │                                                  │ │    │
│  │ │           双轴折线图 (审核量 + 拦截率)            │ │    │
│  │ │                                                  │ │    │
│  │ └─────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  【底部卡片区】Grid 3列                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ 🔥 热门违规  │  │ ⏰ 耗时分布  │  │ 📑 单据类型  │         │
│  │   TOP 5     │  │   环形图    │  │   饼图      │         │
│  │   柱状图    │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

#### 设计亮点

**1. 统计卡片渐变背景**

每个卡片使用独特的渐变背景:

- 今日审核量: 蓝色渐变 `#1890ff → #40a9ff`
- 拦截金额: 红色渐变 `#f5222d → #ff7875`
- 平均耗时: 橙色渐变 `#faad14 → #ffc53d`
- 通过率: 绿色渐变 `#52c41a → #95de64`

```vue
<div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-300 p-6 text-white shadow-lg">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm opacity-90">今日审核量</p>
      <VbenCountToAnimator :end-val="1234" class="text-3xl font-bold" />
      <p class="text-xs mt-2">
        <span class="text-green-200">↑ 12%</span> vs 昨日
      </p>
    </div>
    <Icon icon="lucide:trending-up" class="size-12 opacity-50" />
  </div>
</div>
```

**2. 数字跳动动画**

使用`VbenCountToAnimator`组件:

```vue
<VbenCountToAnimator
  :start-val="1"
  :end-val="1234"
  :duration="2000"
  class="text-3xl font-bold"
/>
```

**3. 图表配色方案**

**审核趋势折线图**:

```typescript
{
  color: ['#1890ff', '#52c41a'],  // 审核量(蓝) / 拦截率(绿)
  grid: { left: '3%', right: '3%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['12-13', '12-14', '12-15', '12-16', '12-17', '12-18', '12-19'],
  },
  yAxis: [
    { type: 'value', name: '审核量' },
    { type: 'value', name: '拦截率(%)', max: 100 }
  ],
  series: [
    {
      name: '审核量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: [120, 132, 101, 134, 90, 230, 210]
    },
    {
      name: '拦截率',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: [12, 15, 8, 18, 10, 25, 20]
    }
  ]
}
```

**热门违规柱状图**:

```typescript
{
  color: ['#f5222d'],
  grid: { left: '3%', right: '3%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['金额超标', '发票缺失', '时间异常', '科目错误', '报销标准']
  },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    barMaxWidth: 60,
    itemStyle: {
      borderRadius: [10, 10, 0, 0],
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#ff4d4f' },
        { offset: 1, color: '#f5222d' }
      ])
    },
    data: [45, 38, 32, 28, 21]
  }]
}
```

---

### P1: 审核历史页面

**路径**: `/audit/history`

#### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  【筛选区】Card包裹                                            │
│  [时间范围📅] [审核结果▾] [单据类型▾] [关键词🔍] [重置🔄]      │
├─────────────────────────────────────────────────────────────┤
│  【列表区】时间轴+卡片流 (非传统Table)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ┃ 14:30  BX202501001 - 差旅单                       │    │
│  │ ┃        审核结果: ✅ 通过  耗时: 1.2s  置信度: 95%  │    │
│  │ ○        [查看详情] [导出报告]                      │────┐│
│  │ ┃                                                    │    ││
│  │ ┃ 14:25  BX202501002 - 采购单                       │    ││
│  │ ┃        审核结果: ⚠️ 警告  耗时: 2.3s  置信度: 78%  │    ││
│  │ ○        [查看详情] [处理]                          │    ││
│  └─────────────────────────────────────────────────────┘    ││
│                                                              ││
│  【右侧抽屉】(点击"查看详情"滑出) <──────────────────────────┘│
│  ┌────────────────────────────┐                              │
│  │ 📋 审核报告 - BX202501001  │                              │
│  │ ─────────────────────────  │                              │
│  │ 【基本信息】               │                              │
│  │ 单据号: BX202501001        │                              │
│  │ 申请人: 张三               │                              │
│  │ 部门: 技术部               │                              │
│  │ 金额: ¥8,500               │                              │
│  │                            │                              │
│  │ 【规则执行结果】Accordion  │                              │
│  │ ▸ ✅ 规则1: 金额合规检查   │                              │
│  │ ▾ ⚠️ 规则2: 发票校验       │                              │
│  │   置信度: 78%              │                              │
│  │   审核意见: 发票日期晚于... │                              │
│  │   证据快照: [发票图片]     │                              │
│  │ ▸ ✅ 规则3: 时间合规检查   │                              │
│  │                            │                              │
│  │ 【置信度雷达图】            │                              │
│  │ (六边形雷达图展示各维度)   │                              │
│  └────────────────────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

#### 创新设计点

**1. 时间轴视图 (替代Table)**

```vue
<template>
  <div class="relative space-y-4">
    <!-- 时间轴竖线 -->
    <div class="bg-border absolute bottom-0 left-6 top-0 w-0.5"></div>

    <!-- 记录卡片 -->
    <div v-for="item in historyList" :key="item.id" class="relative pl-16">
      <!-- 时间轴圆点 -->
      <div
        class="absolute left-4 top-4 size-5 rounded-full border-4"
        :class="{
          'border-green-200 bg-green-500': item.auditResult === 'passed',
          'border-orange-200 bg-orange-500': item.auditResult === 'warning',
          'border-red-200 bg-red-500': item.auditResult === 'rejected',
        }"
      ></div>

      <!-- 卡片内容 -->
      <Card
        class="transition-all duration-300 hover:shadow-lg"
        :class="{
          'hover:border-green-400': item.auditResult === 'passed',
          'hover:border-orange-400': item.auditResult === 'warning',
          'hover:border-red-400': item.auditResult === 'rejected',
        }"
      >
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-muted-foreground text-xs">{{
                item.auditTime
              }}</span>
              <span class="text-base font-semibold">{{ item.billNo }}</span>
              <Tag>{{ item.billType }}</Tag>
            </div>
            <ResultBadge :result="item.auditResult" />
          </div>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="text-muted-foreground flex gap-6 text-sm">
            <span>⏱️ 耗时: {{ item.duration }}s</span>
            <span>🎯 置信度: {{ item.confidence }}%</span>
            <span v-if="item.riskAmount"
              >💰 风险金额: ¥{{ item.riskAmount }}</span
            >
          </div>
          <div class="flex gap-2">
            <Button size="sm" variant="outline" @click="viewDetail(item.id)">
              查看详情
            </Button>
            <Button size="sm" variant="ghost">导出报告</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
```

**2. 审核结果徽章 (渐变色)**

```vue
<template>
  <div
    class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
    :class="{
      'bg-gradient-to-r from-green-500 to-green-400 text-white':
        result === 'passed',
      'bg-gradient-to-r from-orange-500 to-orange-400 text-white':
        result === 'warning',
      'bg-gradient-to-r from-red-500 to-red-400 text-white':
        result === 'rejected',
    }"
  >
    <Icon
      :icon="
        {
          passed: 'lucide:check-circle',
          warning: 'lucide:alert-triangle',
          rejected: 'lucide:x-circle',
        }[result]
      "
      class="size-4"
    />
    <span>
      {{ { passed: '通过', warning: '警告', rejected: '拒绝' }[result] }}
    </span>
  </div>
</template>
```

**3. 详情抽屉 (Accordion折叠)**

```vue
<VbenDrawer v-model:open="detailDrawerOpen" title="审核报告" :width="600">
  <!-- 基本信息 -->
  <Card class="mb-4">
    <CardHeader>
      <CardTitle class="text-base">📋 基本信息</CardTitle>
    </CardHeader>
    <CardContent class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-muted-foreground">单据号</span>
        <span class="font-medium">{{ detail.billNo }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-muted-foreground">申请人</span>
        <span class="font-medium">{{ detail.applicant }}</span>
      </div>
      <!-- 更多字段... -->
    </CardContent>
  </Card>

  <!-- 规则执行结果 -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">🔍 规则执行结果</CardTitle>
    </CardHeader>
    <CardContent>
      <Accordion type="single" collapsible>
        <AccordionItem
          v-for="rule in detail.ruleResults"
          :key="rule.ruleId"
          :value="rule.ruleId"
        >
          <AccordionTrigger class="hover:no-underline">
            <div class="flex items-center gap-2">
              <Icon
                :icon="{
                  pass: 'lucide:check-circle',
                  warning: 'lucide:alert-triangle',
                  reject: 'lucide:x-circle',
                }[rule.result]"
                :class="{
                  'text-green-500': rule.result === 'pass',
                  'text-orange-500': rule.result === 'warning',
                  'text-red-500': rule.result === 'reject',
                }"
                class="size-5"
              />
              <span class="text-sm font-medium">{{ rule.ruleName }}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">置信度</span>
              <span>{{ rule.confidence }}%</span>
            </div>
            <div>
              <p class="text-muted-foreground mb-1">审核意见</p>
              <p class="text-foreground/90">{{ rule.reason }}</p>
            </div>
            <div v-if="rule.evidence.length">
              <p class="text-muted-foreground mb-1">证据快照</p>
              <div class="space-y-1">
                <div
                  v-for="(ev, idx) in rule.evidence"
                  :key="idx"
                  class="rounded-md bg-muted p-2 text-xs"
                >
                  {{ ev }}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CardContent>
  </Card>
</VbenDrawer>
```

---

### P2: 审核方案配置页面

**路径**: `/audit/scheme`

#### 布局结构

```
┌─────────────┬───────────────────────────────────────────────┐
│ 【方案列表】 │ 【方案编辑器】                                 │
│ (30%)       │ (70%)                                         │
│             │                                               │
│ [+ 新建方案] │ 方案名称: [_____________________]              │
│             │ 适用单据: [差旅单 ▾]                           │
│ 📁 差旅单   │                                               │
│   审核方案  │ 规则列表 (拖拽排序)                            │
│   3条规则   │ ┌─────────────────────────────────────────┐  │
│   ✅ 已启用  │ │ ≡  1. 金额合规检查                      │  │
│ [选中状态]  │ │    风险等级: ⚪ 警告  🔴 阻断 (选中)     │  │
│             │ │    [编辑规则] [删除]                    │  │
│ 📁 采购单   │ └─────────────────────────────────────────┘  │
│   审核方案  │ ┌─────────────────────────────────────────┐  │
│   5条规则   │ │ ≡  2. 发票校验                          │  │
│   ✅ 已启用  │ │    风险等级: 🟡 警告 (选中)  ⚪ 阻断     │  │
│             │ │    [编辑规则] [删除]                    │  │
│ 📁 报销单   │ └─────────────────────────────────────────┘  │
│   审核方案  │ ┌─────────────────────────────────────────┐  │
│   4条规则   │ │ ≡  3. 时间合规检查                      │  │
│   ❌ 已禁用  │ │    风险等级: 🟡 警告 (选中)  ⚪ 阻断     │  │
│             │ │    [编辑规则] [删除]                    │  │
│             │ └─────────────────────────────────────────┘  │
│             │                                               │
│             │ [+ 从规则库导入规则]                           │
│             │                                               │
│             │ [保存方案] [取消]                             │
└─────────────┴───────────────────────────────────────────────┘
```

#### 交互设计

**1. 拖拽排序 (使用@vueuse/core)**

```vue
<script setup lang="ts">
import { useSortable } from '@vueuse/core';

const ruleListRef = ref<HTMLElement>();
const rules = ref([
  { id: '1', name: '金额合规检查', riskLevel: 'block', priority: 1 },
  { id: '2', name: '发票校验', riskLevel: 'warning', priority: 2 },
  { id: '3', name: '时间合规检查', riskLevel: 'warning', priority: 3 },
]);

useSortable(ruleListRef, rules, {
  animation: 150,
  ghostClass: 'opacity-50',
  onEnd: () => {
    // 重新计算优先级
    rules.value.forEach((rule, index) => {
      rule.priority = index + 1;
    });
  },
});
</script>

<template>
  <div ref="ruleListRef" class="space-y-3">
    <Card
      v-for="rule in rules"
      :key="rule.id"
      class="cursor-move transition-all hover:shadow-md"
      :class="{
        'border-red-400': rule.riskLevel === 'block',
        'border-orange-400': rule.riskLevel === 'warning',
      }"
    >
      <CardContent class="flex items-center gap-4 p-4">
        <!-- 拖拽手柄 -->
        <Icon
          icon="lucide:grip-vertical"
          class="text-muted-foreground size-5 cursor-grab"
        />

        <!-- 优先级编号 -->
        <span
          class="bg-primary/10 flex size-8 items-center justify-center rounded-full text-sm font-medium"
        >
          {{ rule.priority }}
        </span>

        <!-- 规则名称 -->
        <span class="flex-1 font-medium">{{ rule.name }}</span>

        <!-- 风险等级切换 -->
        <ToggleGroup v-model="rule.riskLevel" type="single" class="gap-2">
          <ToggleGroupItem
            value="warning"
            class="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-700"
          >
            🟡 警告
          </ToggleGroupItem>
          <ToggleGroupItem
            value="block"
            class="data-[state=on]:bg-red-100 data-[state=on]:text-red-700"
          >
            🔴 阻断
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- 操作按钮 -->
        <Button size="sm" variant="ghost">编辑</Button>
        <Button size="sm" variant="ghost" class="text-red-500">删除</Button>
      </CardContent>
    </Card>
  </div>
</template>
```

**2. 规则导入模态框**

```vue
<VbenModal v-model:open="importModalOpen" title="从规则库导入规则" :width="800">
  <!-- 筛选区 -->
  <div class="mb-4 flex gap-2">
    <Input v-model="searchKeyword" placeholder="搜索规则..." class="flex-1" />
    <Select v-model="filterCategory">
      <SelectTrigger class="w-40">
        <SelectValue placeholder="适用科目" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">全部科目</SelectItem>
        <SelectItem value="accommodation">住宿费</SelectItem>
        <SelectItem value="traffic">交通费</SelectItem>
        <SelectItem value="meal">餐饮费</SelectItem>
      </SelectContent>
    </Select>
  </div>

  <!-- 规则列表 (多选) -->
  <div class="space-y-2 max-h-96 overflow-y-auto">
    <Card
      v-for="rule in availableRules"
      :key="rule.id"
      class="cursor-pointer transition-all hover:shadow-md"
      :class="{ 'border-primary': selectedRuleIds.includes(rule.id) }"
      @click="toggleRuleSelection(rule.id)"
    >
      <CardContent class="flex items-center gap-3 p-3">
        <Checkbox :checked="selectedRuleIds.includes(rule.id)" />
        <div class="flex-1">
          <p class="font-medium">{{ rule.name }}</p>
          <p class="text-xs text-muted-foreground">
            适用: {{ rule.scope }} | 科目: {{ rule.categories.join(', ') }}
          </p>
        </div>
        <Badge>{{ rule.refCount }} 个方案引用</Badge>
      </CardContent>
    </Card>
  </div>

  <template #footer>
    <div class="flex justify-between">
      <span class="text-sm text-muted-foreground">已选择 {{ selectedRuleIds.length }} 条规则</span>
      <div class="flex gap-2">
        <Button variant="outline" @click="importModalOpen = false">取消</Button>
        <Button @click="confirmImport">确定导入</Button>
      </div>
    </div>
  </template>
</VbenModal>
```

---

### P3: 规则库页面

**路径**: `/audit/rule`

#### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  【筛选区】                                                   │
│  [关键词搜索🔍] [适用科目▾] [规则类型▾] [☑仅显示已启用]      │
├─────────────────────────────────────────────────────────────┤
│  【规则卡片Grid】3列布局                                      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 🏷️ 金额合规   │ │ 🏷️ 发票校验   │ │ 🏷️ 时间合规   │        │
│  │ 检查          │ │              │ │ 检查          │        │
│  │              │ │              │ │              │        │
│  │ 适用: 整单    │ │ 适用: 行级    │ │ 适用: 整单    │        │
│  │ 科目: 全部    │ │ 科目: 住宿费  │ │ 科目: 全部    │        │
│  │              │ │              │ │              │        │
│  │ 引用: 3个方案 │ │ 引用: 5个方案 │ │ 引用: 2个方案 │        │
│  │              │ │              │ │              │        │
│  │ [查看详情]   │ │ [查看详情]   │ │ [查看详情]   │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ 🏷️ 报销标准   │ │ ...          │ │ ...          │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

#### 组件设计

**1. 规则卡片**

```vue
<template>
  <Card
    class="group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
  >
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <!-- emoji图标 -->
        <span class="text-3xl">🏷️</span>
        <!-- 状态徽章 -->
        <Badge v-if="rule.enabled" variant="success">已启用</Badge>
        <Badge v-else variant="secondary">未启用</Badge>
      </div>
      <CardTitle class="mt-2 text-base">{{ rule.name }}</CardTitle>
    </CardHeader>

    <CardContent class="space-y-3">
      <!-- 适用范围 -->
      <div class="flex items-center gap-2 text-sm">
        <Icon icon="lucide:target" class="text-muted-foreground size-4" />
        <span class="text-muted-foreground">适用:</span>
        <Tag size="sm">{{ { bill: '整单', item: '行级' }[rule.scope] }}</Tag>
      </div>

      <!-- 适用科目 -->
      <div class="flex items-center gap-2 text-sm">
        <Icon icon="lucide:tag" class="text-muted-foreground size-4" />
        <span class="text-muted-foreground">科目:</span>
        <div class="flex flex-wrap gap-1">
          <Tag
            v-for="cat in rule.categories.slice(0, 2)"
            :key="cat"
            size="sm"
            variant="outline"
          >
            {{ cat }}
          </Tag>
          <Tag v-if="rule.categories.length > 2" size="sm" variant="outline">
            +{{ rule.categories.length - 2 }}
          </Tag>
        </div>
      </div>

      <!-- 引用计数 -->
      <div class="flex items-center gap-2 text-sm">
        <Icon icon="lucide:git-branch" class="text-muted-foreground size-4" />
        <span class="text-muted-foreground">引用:</span>
        <Badge variant="secondary">{{ rule.refCount }} 个方案</Badge>
      </div>

      <!-- 操作按钮 -->
      <Button
        variant="outline"
        size="sm"
        class="mt-4 w-full"
        @click="viewDetail(rule.id)"
      >
        查看详情
      </Button>
    </CardContent>
  </Card>
</template>
```

**2. 规则详情抽屉**

```vue
<VbenDrawer v-model:open="detailDrawerOpen" :title="detail.name" :width="700">
  <!-- Prompt模板 -->
  <Card class="mb-4">
    <CardHeader>
      <CardTitle class="text-base">📝 Prompt模板</CardTitle>
    </CardHeader>
    <CardContent>
      <pre class="rounded-lg bg-muted p-4 text-xs overflow-x-auto"><code>{{ detail.prompt }}</code></pre>
    </CardContent>
  </Card>

  <!-- 数据依赖 -->
  <Card class="mb-4">
    <CardHeader>
      <CardTitle class="text-base">🔗 数据依赖</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-2">
        <Tag
          v-for="dep in detail.dataDependencies"
          :key="dep"
          class="bg-blue-100 text-blue-700"
        >
          {{ dep }}
        </Tag>
      </div>
    </CardContent>
  </Card>

  <!-- 工具依赖 -->
  <Card class="mb-4">
    <CardHeader>
      <CardTitle class="text-base">🛠️ 工具依赖</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-2">
        <Tag
          v-for="tool in detail.toolDependencies"
          :key="tool"
          class="bg-purple-100 text-purple-700"
        >
          {{ tool }}
        </Tag>
      </div>
    </CardContent>
  </Card>

  <!-- 引用方案 -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">📊 引用方案</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <div
          v-for="scheme in detail.refSchemes"
          :key="scheme.id"
          class="flex items-center justify-between rounded-md bg-muted p-2 text-sm"
        >
          <span>{{ scheme.name }}</span>
          <Button size="sm" variant="ghost">查看</Button>
        </div>
      </div>
    </CardContent>
  </Card>
</VbenDrawer>
```

---

## ⚡ 动画与交互

### 1. 页面进入动画

```vue
<template>
  <div class="animate-fade-in">
    <!-- 页面内容 -->
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
```

### 2. 列表stagger动画

```vue
<template>
  <div class="space-y-4">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      class="animate-fade-in"
      :style="{ animationDelay: `${index * 50}ms` }"
    >
      <Card><!-- 卡片内容 --></Card>
    </div>
  </div>
</template>
```

### 3. 卡片hover效果

```css
.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}
```

### 4. 加载骨架屏

```vue
<template>
  <div v-if="loading" class="space-y-4">
    <Skeleton class="h-32 w-full" />
    <Skeleton class="h-32 w-full" />
    <Skeleton class="h-32 w-full" />
  </div>
  <div v-else>
    <!-- 实际内容 -->
  </div>
</template>
```

---

## 📱 响应式设计

### 断点策略

```css
/* Tailwind断点 */
sm: 640px   (小屏手机)
md: 768px   (平板竖屏)
lg: 1024px  (小笔记本)
xl: 1280px  (桌面)
2xl: 1536px (大屏)
```

### 适配规范

| 分辨率    | Grid列数 | 卡片间距 | 字体缩放 |
| --------- | -------- | -------- | -------- |
| 1920+     | 4列      | gap-6    | 100%     |
| 1440-1919 | 3列      | gap-5    | 100%     |
| 1024-1439 | 2列      | gap-4    | 95%      |
| 768-1023  | 1列      | gap-4    | 90%      |

---

## 🎯 性能优化

### 1. 图片优化

- 统计卡片图标使用SVG或Icon组件
- 避免使用大尺寸背景图

### 2. 懒加载

- 路由组件懒加载: `() => import('#/views/...')`
- 图表按需加载: 仅在可见时渲染ECharts

### 3. 虚拟滚动

- 审核历史列表超过100条时启用虚拟滚动
- 使用`vue-virtual-scroller`

---

## 📦 组件库依赖

| 组件库                | 用途                           | 版本         |
| --------------------- | ------------------------------ | ------------ |
| Ant Design Vue        | 基础组件(Form/Button/Tag)      | catalog:     |
| shadcn-ui             | 现代组件(Card/Accordion/Sheet) | -            |
| @vben/plugins/echarts | 图表渲染                       | workspace:\* |
| @vueuse/core          | 工具函数(useSortable)          | catalog:     |
| lucide-vue-next       | 图标库                         | -            |

---

## ✅ 设计检查清单

实施完成后需验证:

- [ ] 所有页面支持1920/1440/1366分辨率
- [ ] 卡片hover效果流畅(300ms过渡)
- [ ] 统计数字跳动动画正常
- [ ] 图表颜色符合色彩编码系统
- [ ] 时间轴视图对齐准确
- [ ] 拖拽排序手感流畅
- [ ] 抽屉滑出动画自然
- [ ] 空状态和加载状态友好
- [ ] 所有交互有视觉反馈
- [ ] TypeScript类型检查通过

---

**文档版本**: V1.0 **创建日期**: 2025-12-19 **最后更新**: 2025-12-19
