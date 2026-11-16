<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Dropdown,
  Input,
  Menu,
  MenuItem,
  Table,
  Tag,
  Tooltip,
  Upload,
} from 'ant-design-vue';

// Statistics mock
const stats = ref([
  {
    title: '全网主数据总量',
    value: '18,245',
    trend: '+12%',
    icon: 'lucide:database',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    title: '管控类目数量',
    value: '156',
    trend: '稳定',
    icon: 'lucide:layout-grid',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    title: '库存预警 SKU',
    value: '38',
    trend: '需补库',
    icon: 'lucide:alert-triangle',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    title: '昨日新增数据',
    value: '412',
    trend: '+5%',
    icon: 'lucide:arrow-up-right',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
]);

// Mock columns for master data
const columns = [
  {
    title: '商品',
    dataIndex: 'image',
    key: 'image',
    width: 60,
    fixed: 'left',
  },
  {
    title: '商品名称与编号 (SKU)',
    dataIndex: 'name',
    key: 'name',
    width: 250,
  },
  {
    title: '商品分类',
    dataIndex: 'category',
    key: 'category',
    width: 120,
  },
  {
    title: '产品说明',
    dataIndex: 'description',
    key: 'description',
    width: 220,
  },
  {
    title: '指导价(元)',
    dataIndex: 'price',
    key: 'price',
    width: 90,
  },
  {
    title: '当前库存',
    dataIndex: 'stock',
    key: 'stock',
    width: 100,
  },
  {
    title: '核心扩展属性',
    dataIndex: 'attributes',
    key: 'attributes',
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right',
  },
];

// Mock data
const mockData = ref([
  {
    key: '1',
    sku: 'BST-2001',
    name: '百善堂胃復舒膠囊 (60粒)',
    category: '中成药 / 肠胃护理',
    description: '健脾益氣，和胃止痛。適用於脾胃虛弱所致的胃痛、消化不良。',
    price: 168,
    stock: 1250,
    maxStock: 2000,
    attributes: [
      { label: '规格', value: '60粒/瓶' },
      { label: '产地', value: '香港' },
    ],
  },
  {
    key: '2',
    sku: 'BST-2002',
    name: '百善堂強力清熱丸 (20粒)',
    category: '中成药 / 免疫力提升',
    description: '清熱解毒，消炎退腫。用於風火引致之牙痛、喉嚨痛及口腔溃疡。',
    price: 65,
    stock: 800,
    maxStock: 1500,
    attributes: [{ label: '适用情况', value: '容易热气、上火人群' }],
  },
  {
    key: '3',
    sku: 'BST-2003',
    name: '活絡通脈行血止痛貼 (10片)',
    category: '外用药 / 跌打损伤',
    description: '快速滲透，舒緩肌肉酸痛、關節扭傷及各類風湿痹痛。',
    price: 58,
    stock: 250,
    maxStock: 800,
    attributes: [{ label: '包装规格', value: '10片/盒' }],
  },
  {
    key: '4',
    sku: 'PRO-3001',
    name: '益生菌活性膠囊 (30粒)',
    category: '保健品 / 益生菌',
    description: '特含多株耐酸抗膽鹽益生菌，雙向調節腸胃道微生態平衡。',
    price: 298,
    stock: 2100,
    maxStock: 3000,
    attributes: [
      { label: '用法用量', value: '每日1粒，餐后温水送服' },
      { label: '核心菌群', value: '100亿CFU' },
    ],
  },
]);

const searchText = ref('');
</script>

<template>
  <div
    class="flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6 md:p-8"
  >
    <!-- Modern Header -->
    <div
      class="group relative w-full overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm md:px-8 md:py-8"
    >
      <Icon
        icon="lucide:database-zap"
        class="pointer-events-none absolute -bottom-4 -right-4 size-32 text-slate-50 transition-transform duration-700 group-hover:rotate-6"
      />
      <h1
        class="relative z-10 m-0 flex items-center gap-3 text-[1.8rem] font-extrabold tracking-tight text-slate-800"
      >
        主数据管理中心
      </h1>
      <p
        class="relative z-10 m-0 mt-2 max-w-2xl text-[13px] font-medium leading-relaxed text-slate-500"
      >
        维护企业全局核心产品基础信息，支持 Excel 智能导入解析，自动化提取 SKU
        扩展维度属性，并集中管理产品合规图文资产库。
      </p>
    </div>

    <!-- Toolbar -->
    <div
      class="flex flex-col items-center justify-between gap-4 rounded-[1.2rem] border border-slate-200/80 bg-white px-6 py-4 shadow-sm md:flex-row"
    >
      <div class="relative w-full md:w-96">
        <Input
          v-model:value="searchText"
          placeholder="搜索 SKU 编号、类别或名称..."
          class="custom-search !h-11 !rounded-xl !border-slate-200 !bg-slate-50/50 pl-10 text-sm font-medium focus:!bg-white"
        >
          <template #prefix>
            <Icon icon="lucide:search" class="size-4 text-slate-400" />
          </template>
        </Input>
      </div>

      <div
        class="hide-scrollbar flex w-full items-center gap-3 overflow-x-auto pb-1 md:w-auto md:pb-0"
      >
        <Dropdown>
          <template #overlay>
            <Menu class="!rounded-xl !border !border-slate-100 !p-2 !shadow-xl">
              <MenuItem key="1" class="!rounded-lg !py-2">
                <span class="font-medium text-slate-700">常规物料建档</span>
              </MenuItem>
              <MenuItem key="2" class="!rounded-lg !py-2">
                <span class="font-medium text-slate-700">捆绑组合商品</span>
              </MenuItem>
            </Menu>
          </template>
          <Button
            type="primary"
            class="flex !h-11 items-center gap-2 !rounded-xl border-none bg-slate-900 font-bold shadow-lg hover:bg-slate-800"
          >
            <Icon icon="lucide:plus" class="size-4" /> 新增产品档案
            <Icon
              icon="lucide:chevron-down"
              class="ml-0.5 size-3.5 opacity-60"
            />
          </Button>
        </Dropdown>

        <div class="mx-1 h-6 w-px bg-slate-200"></div>

        <Upload name="file" :show-upload-list="false">
          <Button
            class="flex !h-11 items-center gap-2 !rounded-xl border-slate-200 font-medium text-slate-700 transition-colors hover:border-green-400 hover:text-green-600"
          >
            <Icon icon="lucide:file-spreadsheet" class="size-4" /> Excel
            智能解析入库
          </Button>
        </Upload>
        <Upload name="file" :show-upload-list="false">
          <Button
            class="flex !h-11 items-center gap-2 !rounded-xl border-slate-200 font-medium text-slate-700 transition-colors hover:border-blue-400 hover:text-blue-600"
          >
            <Icon icon="lucide:image-up" class="size-4" /> 图文包提取
          </Button>
        </Upload>

        <Tooltip title="导出当前结果集" placement="topRight">
          <Button
            class="flex !h-11 !w-11 items-center justify-center !rounded-xl border-slate-200 !p-0 text-slate-400 transition-colors hover:text-slate-700"
          >
            <Icon icon="lucide:download-cloud" class="size-5" />
          </Button>
        </Tooltip>
      </div>
    </div>

    <!-- Data Table -->
    <div
      class="flex-1 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white shadow-sm"
    >
      <Table
        :columns="columns"
        :data-source="mockData"
        :scroll="{ x: 1200 }"
        :pagination="{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条数据`,
        }"
        class="modern-table !rounded-none border-none text-[13px]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'image'">
            <div
              class="group relative flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 shadow-inner"
            >
              <Icon
                icon="lucide:pill"
                class="size-5 text-slate-400 transition-transform group-hover:scale-110"
              />
            </div>
          </template>

          <template v-if="column.key === 'name'">
            <div class="flex flex-col justify-center">
              <span class="text-[14px] font-extrabold text-slate-800">{{
                record.name
              }}</span>
              <span class="font-mono text-[11px] tracking-wider text-slate-400"
                >SKU: {{ record.sku }}</span
              >
            </div>
          </template>

          <template v-if="column.key === 'category'">
            <Tag
              color="cyan"
              class="!m-0 !rounded-md !border-cyan-200/60 !bg-cyan-50 font-bold tracking-wide text-cyan-700"
            >
              {{ record.category }}
            </Tag>
          </template>

          <template v-if="column.key === 'description'">
            <p
              class="m-0 line-clamp-2 text-[12px] leading-relaxed text-slate-500"
              :title="record.description"
            >
              {{ record.description }}
            </p>
          </template>

          <template v-if="column.key === 'price'">
            <div class="font-mono text-[14px] font-bold text-slate-700">
              <span class="mr-0.5 text-[10px] text-slate-400">￥</span
              >{{ record.price.toFixed(2) }}
            </div>
          </template>

          <template v-else-if="column.key === 'attributes'">
            <div class="flex flex-wrap gap-1.5">
              <Tag
                v-for="(attr, index) in record.attributes"
                :key="index"
                class="!m-0 !rounded !border-slate-200 !bg-slate-50 text-slate-600"
              >
                <span class="mr-1 text-slate-400">{{ attr.label }}:</span>
                <span class="font-medium text-slate-700">{{ attr.value }}</span>
              </Tag>
              <span
                v-if="record.attributes.length === 0"
                class="text-xs italic text-slate-300"
                >无扩展维度</span
              >
            </div>
          </template>

          <template v-else-if="column.key === 'stock'">
            <span
              class="text-[14px] font-bold"
              :class="record.stock < 500 ? 'text-red-600' : 'text-slate-700'"
            >
              {{ record.stock }}
            </span>
          </template>

          <template v-else-if="column.key === 'action'">
            <div class="flex items-center gap-1">
              <Tooltip title="快速编辑">
                <Button
                  type="text"
                  class="!flex !h-8 !w-8 !items-center !justify-center rounded-lg border border-slate-200 bg-slate-50 !px-0 text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-600"
                >
                  <Icon icon="lucide:pencil" class="size-3.5" />
                </Button>
              </Tooltip>
              <Tooltip title="移除条目">
                <Button
                  type="text"
                  class="!flex !h-8 !w-8 !items-center !justify-center rounded-lg border border-red-100 bg-red-50 !px-0 text-red-500 transition-colors hover:border-red-500 hover:bg-red-500 hover:text-white"
                >
                  <Icon icon="lucide:trash-2" class="size-3.5" />
                </Button>
              </Tooltip>
            </div>
          </template>
        </template>
      </Table>
    </div>
  </div>
</template>

<style scoped>
/* AntD Input Override */
.custom-search :deep(.ant-input) {
  background-color: transparent !important;
}

/* AntD Table Override to look extremely modern */
.modern-table :deep(.ant-table-wrapper) {
  overflow: hidden;
  border-radius: 1.5rem;
}

.modern-table :deep(.ant-table-thead > tr > th) {
  padding: 16px 20px;
  font-weight: 700;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.modern-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}

.modern-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}

/* Hide scrollbar for horz action menu if screen is small */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
