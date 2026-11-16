<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Table,
  Tabs,
} from 'ant-design-vue';

const activeKey = ref('package');
const isModalVisible = ref(false);

// Mock Data for Tables
const packages = ref([
  {
    key: '1',
    name: '标准套餐 - 基础版',
    version: 'Std',
    points: 100_000,
    employees: ['订单专员', '收单专员', '财务对账助理'],
    remark: '适合小规模试运行。',
  },
  {
    key: '2',
    name: '标准套餐 - 专业版',
    version: 'Pro',
    points: 500_000,
    employees: ['订单专员', 'AI问数助理', '企业知识助理'],
    remark: '适合常规业务团队。',
  },
  {
    key: '3',
    name: '标准套餐 - 旗舰版',
    version: 'Ultra',
    points: 2_000_000,
    employees: ['全部数字员工'],
    remark: '适合高频调用和多员工并行。',
  },
]);

// Columns
const packageColumns = [
  { title: '套餐名称', dataIndex: 'name', key: 'name' },
  { title: '版本', dataIndex: 'version', key: 'version' },
  { title: '包含额度(点)', dataIndex: 'points', key: 'points' },
  { title: '支持员工范围', dataIndex: 'employees', key: 'employees' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'action', width: 120, align: 'center' },
];

// ==========================
// Employee Config State
// ==========================
const isEditingEmployees = ref(false);

const employeeConfigColumns = [
  { title: '数字员工', dataIndex: 'employee', key: 'employee' },
  {
    title: '默认单价',
    dataIndex: 'price',
    key: 'price',
    align: 'center',
    width: 150,
  },
  {
    title: '包月点数',
    dataIndex: 'monthlyPoints',
    key: 'monthlyPoints',
    align: 'center',
    width: 160,
  },
  {
    title: '计费单位',
    dataIndex: 'unit',
    key: 'unit',
    align: 'center',
    width: 180,
  },
];

const allEmployeesConfig = ref([
  {
    id: 'EMP-012',
    name: 'PPT自动生成专员',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ppt',
    price: 5,
    unit: '点/PPT',
    monthlyPoints: 2000,
  },
  {
    id: 'EMP-015',
    name: '短视频数字人',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=video',
    price: 10,
    unit: '点/视频',
    monthlyPoints: 5000,
  },
  {
    id: 'EMP-022',
    name: '视频编导',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=dir',
    price: null,
    unit: '',
    monthlyPoints: null,
  },
  {
    id: 'EMP-025',
    name: '数据分析师',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=data',
    price: 15,
    unit: '点/报表',
    monthlyPoints: 8000,
  },
  {
    id: 'EMP-033',
    name: '全能问答助手',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=qa',
    price: 1,
    unit: '点/交互',
    monthlyPoints: 1000,
  },
  {
    id: 'EMP-041',
    name: '文案优化大师',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=writer',
    price: null,
    unit: null,
    monthlyPoints: null,
  },
]);

// Form
const formState = ref<any>({});

const openModal = () => {
  formState.value = {};
  isModalVisible.value = true;
};

const handleOk = () => {
  // Mock save logic
  isModalVisible.value = false;
};
</script>

<template>
  <div
    class="relative flex min-h-full w-full flex-col gap-6 bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900/50"
  >
    <!-- Header -->
    <div
      class="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 p-8 text-white shadow-lg"
    >
      <div
        class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-black/10 blur-2xl"
      ></div>
      <div class="relative z-10 flex items-center gap-5">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-sm backdrop-blur-md"
        >
          <Icon icon="lucide:package-open" class="text-3xl text-white" />
        </div>
        <div>
          <h1
            class="m-0 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm"
          >
            产品包与版本管理
          </h1>
          <p
            class="m-0 mt-2 max-w-2xl text-sm font-medium tracking-wide text-indigo-50 opacity-90"
          >
            统一维护数字员工套餐、额度和员工计费标准，支撑租户订阅与后续计费配置。
          </p>
        </div>
      </div>
    </div>

    <!-- Main Content wrapper -->
    <div
      class="w-full rounded-3xl border border-slate-200/60 bg-white/70 p-3 shadow-xl backdrop-blur-xl transition-all dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <Tabs
        v-model:active-key="activeKey"
        size="large"
        :tab-bar-style="{
          marginBottom: '20px',
          paddingLeft: '16px',
          fontWeight: '600',
        }"
      >
        <!-- 套餐管理 -->
        <Tabs.TabPane key="package">
          <template #tab>
            <span class="flex items-center gap-2">
              <Icon icon="lucide:layers" /> 套餐管理
            </span>
          </template>
          <div
            class="mb-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-900/30"
              >
                <Icon icon="lucide:users" class="text-xl" />
              </div>
              <div>
                <h3
                  class="m-0 text-base font-bold text-slate-800 dark:text-slate-100"
                >
                  套餐管理
                </h3>
                <p class="m-0 mt-0.5 text-xs text-slate-500">
                  维护套餐版本、点数额度和适用员工范围
                </p>
              </div>
            </div>
            <div class="flex w-full flex-wrap justify-end gap-3 sm:w-auto">
              <Input.Search placeholder="搜索套餐名称" class="max-w-[200px]" />
              <Button
                type="primary"
                class="rounded-lg border-0 bg-gradient-to-r from-purple-500 to-indigo-600 shadow-md transition-all hover:from-purple-600 hover:to-indigo-700 hover:shadow-lg"
                @click="openModal"
              >
                <template #icon><Icon icon="lucide:plus-circle" /></template>
                新增套餐
              </Button>
            </div>
          </div>

          <div
            class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <Table
              :columns="packageColumns"
              :data-source="packages"
              :pagination="false"
              class="custom-table"
              :row-class-name="
                () =>
                  'hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors'
              "
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <span class="font-bold text-slate-700 dark:text-slate-200">{{
                    record.name
                  }}</span>
                </template>
                <template v-if="column.key === 'version'">
                  <div
                    class="inline-flex items-center justify-center rounded-full border border-black/5 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider shadow-sm"
                    :class="{
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300':
                        record.version === 'Std',
                      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300':
                        record.version === 'Pro',
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400':
                        record.version === 'Ultra',
                    }"
                  >
                    {{ record.version }}
                  </div>
                </template>
                <template v-if="column.key === 'points'">
                  <div class="flex items-center gap-1.5">
                    <Icon icon="lucide:coins" class="text-amber-500" />
                    <span
                      class="text-[15px] font-bold tracking-tight text-slate-800 dark:text-slate-100"
                    >
                      {{ record.points.toLocaleString() }}
                    </span>
                  </div>
                </template>
                <template v-if="column.key === 'employees'">
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="emp in record.employees"
                      :key="emp"
                      class="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                    >
                      {{ emp }}
                    </span>
                  </div>
                </template>
                <template v-if="column.key === 'remark'">
                  <span class="text-sm text-slate-500">
                    {{ record.remark || '-' }}
                  </span>
                </template>
                <template v-if="column.key === 'action'">
                  <Button
                    type="text"
                    class="flex items-center gap-1 rounded-md px-2 font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                    size="small"
                  >
                    <Icon icon="lucide:settings-2" class="text-sm" /> 配置
                  </Button>
                </template>
              </template>
            </Table>
          </div>
        </Tabs.TabPane>

        <!-- 数字员工配置 -->
        <Tabs.TabPane key="employee">
          <template #tab>
            <span class="flex items-center gap-2">
              <Icon icon="lucide:bot" /> 数字员工配置
            </span>
          </template>
          <div
            class="mb-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-800"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-900/30"
              >
                <Icon icon="lucide:bot" class="text-xl" />
              </div>
              <div>
                <h3
                  class="m-0 text-base font-bold text-slate-800 dark:text-slate-100"
                >
                  全部数字员工配置
                </h3>
                <p class="m-0 mt-0.5 text-xs text-slate-500">
                  统一定义所有员工的默认单价及计费单位
                </p>
              </div>
            </div>

            <div class="flex w-full flex-wrap justify-end gap-3 sm:w-auto">
              <Input.Search placeholder="搜索数字员工" class="max-w-[200px]" />
              <div
                class="mx-1 hidden h-8 w-[1px] bg-slate-200 sm:block dark:bg-slate-700"
              ></div>
              <Button
                :type="isEditingEmployees ? 'primary' : 'default'"
                :ghost="isEditingEmployees"
                @click="isEditingEmployees = !isEditingEmployees"
                class="min-w-[100px] transition-colors"
              >
                <template #icon>
                  <Icon
                    :icon="
                      isEditingEmployees ? 'lucide:check' : 'lucide:edit-3'
                    "
                  />
                </template>
                {{ isEditingEmployees ? '完成编辑' : '批量编辑' }}
              </Button>
            </div>
          </div>

          <div
            class="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <Table
              :columns="employeeConfigColumns"
              :data-source="allEmployeesConfig"
              :pagination="{ pageSize: 10, showSizeChanger: true }"
              class="custom-table"
              :row-class-name="
                () =>
                  'hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors'
              "
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'employee'">
                  <div class="flex items-center gap-3 py-1">
                    <Avatar
                      :src="record.avatar"
                      :size="44"
                      class="border border-slate-100 shadow-sm ring-2 ring-white transition-transform duration-300 hover:scale-110 dark:border-slate-600 dark:ring-slate-800"
                    />
                    <div class="flex flex-col text-left">
                      <span
                        class="text-[15px] font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100"
                      >
                        {{ record.name }}
                      </span>
                      <span
                        class="mt-1 w-fit rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      >
                        {{ record.id }}
                      </span>
                    </div>
                  </div>
                </template>

                <template v-if="column.key === 'price'">
                  <div class="flex justify-center">
                    <div v-if="isEditingEmployees" class="animate-fade-in">
                      <InputNumber
                        v-model:value="record.price"
                        size="middle"
                        class="w-24 rounded-lg text-center shadow-inner"
                        :min="0"
                      />
                    </div>
                    <div
                      v-else
                      class="font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {{
                        record.price !== null && record.price !== undefined
                          ? record.price
                          : '-'
                      }}
                    </div>
                  </div>
                </template>

                <template v-if="column.key === 'monthlyPoints'">
                  <div class="flex justify-center">
                    <div v-if="isEditingEmployees" class="animate-fade-in">
                      <InputNumber
                        v-model:value="record.monthlyPoints"
                        size="middle"
                        class="w-28 rounded-lg text-center shadow-inner"
                        :min="0"
                      />
                    </div>
                    <div
                      v-else
                      class="font-semibold text-indigo-600 dark:text-indigo-400"
                    >
                      {{
                        record.monthlyPoints !== null &&
                        record.monthlyPoints !== undefined
                          ? record.monthlyPoints.toLocaleString()
                          : '-'
                      }}
                    </div>
                  </div>
                </template>

                <template v-if="column.key === 'unit'">
                  <div class="flex justify-center">
                    <div v-if="isEditingEmployees" class="animate-fade-in">
                      <Input
                        v-model:value="record.unit"
                        size="middle"
                        class="w-28 rounded-lg text-center shadow-inner"
                      />
                    </div>
                    <div
                      v-else
                      class="text-sm font-medium text-slate-600 dark:text-slate-400"
                    >
                      {{ record.unit || '-' }}
                    </div>
                  </div>
                </template>
              </template>
            </Table>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>

    <!-- Create/Edit Modal -->
    <Modal
      v-model:open="isModalVisible"
      title="配置套餐"
      @ok="handleOk"
      ok-text="保存"
      cancel-text="取消"
      width="600px"
    >
      <Form layout="vertical" class="mt-4">
        <FormItem label="套餐名称" required>
          <Input
            v-model:value="formState.name"
            placeholder="如：标准套餐 - 专业版"
          />
        </FormItem>

        <FormItem label="版本" required>
          <Input
            v-model:value="formState.version"
            placeholder="如：Std / Pro / Ultra"
          />
        </FormItem>

        <FormItem label="包含额度点数" required>
          <InputNumber
            v-model:value="formState.points"
            class="w-full"
            :min="1"
          />
        </FormItem>

        <FormItem label="备注">
          <Input.TextArea
            v-model:value="formState.remark"
            :rows="3"
            placeholder="填写套餐适用场景、限制说明或运营备注"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>
