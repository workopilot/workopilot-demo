<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Select,
  Switch,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

// Mock Data Interfaces
interface TaskConfig {
  name: string;
  type: 'AI' | 'API' | 'RPA';
  frequency: string; // Cron
  enableCaptcha?: boolean;
  provideCredentials?: boolean;
  username?: string;
  password?: string;
  scriptFile?: any;
}

interface CollectionTask {
  id: string;
  name: string;
  type: 'AI' | 'API' | 'RPA';
  frequency: string;
  status: 'error' | 'running' | 'stopped';
  lastRunTime?: string;
}

const tasks = ref<CollectionTask[]>([]);
const searchText = ref('');
const drawerOpen = ref(false);
const isEdit = ref(false);

const formRef = ref();
const formData = reactive<TaskConfig>({
  name: '',
  type: 'API',
  frequency: '0 0 * * *',
  enableCaptcha: false,
  provideCredentials: false,
  username: '',
  password: '',
  scriptFile: null,
});

onMounted(() => {
  // Load mock data
  tasks.value = [
    {
      id: 'T001',
      name: '企查查主数据采集',
      type: 'RPA',
      frequency: '0 2 * * *',
      status: 'running',
      lastRunTime: '2026-07-07 10:30',
    },
    {
      id: 'T002',
      name: '官网公告自动爬取',
      type: 'AI',
      frequency: '0 */4 * * *',
      status: 'running',
      lastRunTime: '2026-07-07 12:00',
    },
    {
      id: 'T003',
      name: '内部订单系统同步',
      type: 'API',
      frequency: '*/15 * * * *',
      status: 'stopped',
      lastRunTime: '2026-07-06 18:00',
    },
  ];
});

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '采集类型', dataIndex: 'type', key: 'type', width: 120 },
  {
    title: '采集频率 (Cron)',
    dataIndex: 'frequency',
    key: 'frequency',
    width: 150,
  },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  {
    title: '最后运行',
    dataIndex: 'lastRunTime',
    key: 'lastRunTime',
    width: 160,
  },
  { title: '操作', key: 'action', width: 150, align: 'center' },
];

function getTypeColor(type: string) {
  const map: Record<string, string> = {
    API: 'blue',
    RPA: 'purple',
    AI: 'emerald',
  };
  return map[type] || 'default';
}

function getStatusInfo(status: string) {
  const map: Record<string, { color: string; text: string }> = {
    running: { color: 'processing', text: '运行中' },
    stopped: { color: 'default', text: '已停止' },
    error: { color: 'error', text: '异常' },
  };
  return map[status] || { color: 'default', text: status };
}

function openAdd() {
  isEdit.value = false;
  Object.assign(formData, {
    name: '',
    type: 'API',
    frequency: '0 0 * * *',
    enableCaptcha: false,
    provideCredentials: false,
    username: '',
    password: '',
    scriptFile: null,
  });
  drawerOpen.value = true;
}

function openEdit(record: CollectionTask) {
  isEdit.value = true;
  Object.assign(formData, {
    name: record.name,
    type: record.type,
    frequency: record.frequency,
    enableCaptcha: true,
    provideCredentials: true,
    username: 'admin',
    password: '***',
  });
  drawerOpen.value = true;
}

function handleDelete(record: CollectionTask) {
  tasks.value = tasks.value.filter((t) => t.id !== record.id);
  message.success('删除成功');
}

async function handleSave() {
  await formRef.value.validate();
  message.success(isEdit.value ? '修改成功' : '创建成功');
  if (!isEdit.value) {
    tasks.value.unshift({
      id: `T00${tasks.value.length + 1}`,
      name: formData.name,
      type: formData.type,
      frequency: formData.frequency,
      status: 'stopped',
    });
  }
  drawerOpen.value = false;
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-6">
    <div class="mb-6 flex items-end justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">采集任务配置</h1>
        <p class="mt-1 text-slate-500">
          配置并管理各类自动化数据采集任务，支持定时调度和复杂 RPA/AI 脚本注入。
        </p>
      </div>
    </div>

    <Card :bordered="false" class="rounded-xl shadow-sm">
      <div class="mb-4 flex justify-between">
        <Input.Search
          v-model:value="searchText"
          placeholder="搜索任务名称"
          class="w-64"
          allow-clear
        />
        <Button type="primary" class="flex items-center gap-2" @click="openAdd">
          <Icon icon="lucide:plus" /> 新建任务
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="
          tasks.filter((t) => !searchText || t.name.includes(searchText))
        "
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag :color="getTypeColor(record.type)">{{ record.type }}</Tag>
          </template>
          <template v-else-if="column.key === 'frequency'">
            <code class="rounded bg-slate-100 px-2 py-1 font-mono text-xs">{{
              record.frequency
            }}</code>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusInfo(record.status).color">
              {{ getStatusInfo(record.status).text }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <div class="flex justify-center gap-2">
              <Button type="link" size="small" @click="openEdit(record)">
                配置
              </Button>
              <Popconfirm
                title="确定删除该任务吗？"
                @confirm="handleDelete(record)"
              >
                <Button type="link" size="small" danger>删除</Button>
              </Popconfirm>
            </div>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="drawerOpen"
      :title="isEdit ? '编辑采集任务' : '新建采集任务'"
      width="500"
    >
      <Form ref="formRef" :model="formData" layout="vertical">
        <Form.Item
          label="任务名称"
          name="name"
          :rules="[{ required: true, message: '请输入任务名称' }]"
        >
          <Input
            v-model:value="formData.name"
            placeholder="例如：企查查财务数据爬取"
          />
        </Form.Item>

        <Form.Item label="采集类型" name="type">
          <Select v-model:value="formData.type">
            <Select.Option value="API">接口 (API)</Select.Option>
            <Select.Option value="RPA">网页自动化 (RPA)</Select.Option>
            <Select.Option value="AI">智能抓取 (AI)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="采集频率 (Cron表达式)"
          name="frequency"
          :rules="[{ required: true }]"
        >
          <Input
            v-model:value="formData.frequency"
            placeholder="例如：0 2 * * *"
          />
          <div class="mt-1 text-xs text-slate-400">
            支持标准 Cron 格式，如 '0 0 * * *' 每天零点执行
          </div>
        </Form.Item>

        <!-- Only for RPA / AI -->
        <template v-if="formData.type === 'RPA' || formData.type === 'AI'">
          <div
            class="mb-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            <h4 class="m-0 font-semibold text-slate-700">高级设置</h4>

            <Form.Item
              label="启用验证码识别"
              name="enableCaptcha"
              class="!mb-0 flex items-center justify-between [&_.ant-form-item-label]:pb-0"
            >
              <Switch v-model:checked="formData.enableCaptcha" />
            </Form.Item>

            <Form.Item
              label="提供账户信息"
              name="provideCredentials"
              class="!mb-0 flex items-center justify-between [&_.ant-form-item-label]:pb-0"
            >
              <Switch v-model:checked="formData.provideCredentials" />
            </Form.Item>

            <template v-if="formData.provideCredentials">
              <Form.Item label="登录账号" name="username" class="mt-4">
                <Input
                  v-model:value="formData.username"
                  placeholder="请输入抓取所需的登录账号"
                />
              </Form.Item>
              <Form.Item label="登录密码" name="password">
                <Input.Password
                  v-model:value="formData.password"
                  placeholder="请输入密码"
                />
              </Form.Item>
            </template>

            <Form.Item label="流程脚本上传 (ZIP / JSON)" class="mt-4">
              <Upload.Dragger accept=".zip,.json" :max-count="1">
                <p class="ant-upload-drag-icon pt-4">
                  <Icon
                    icon="lucide:upload-cloud"
                    class="mx-auto size-8 text-blue-500"
                  />
                </p>
                <p class="ant-upload-text">点击或拖拽文件到此处</p>
                <p class="ant-upload-hint pb-4">
                  支持自研RPA工具导出的脚本文件
                </p>
              </Upload.Dragger>
            </Form.Item>
          </div>
        </template>
      </Form>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="drawerOpen = false">取消</Button>
          <Button type="primary" @click="handleSave">保存</Button>
        </div>
      </template>
    </Drawer>
  </div>
</template>
