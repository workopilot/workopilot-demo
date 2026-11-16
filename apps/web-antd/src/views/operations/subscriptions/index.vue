<script setup lang="ts">
import type {
  SubscriptionQueryParams,
  TenantSubscription,
} from '#/types/billing';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  DatePicker,
  message,
  Popconfirm,
  Select,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  batchDeleteSubscriptionsApi,
  getProductsApi,
  getSubscriptionsApi,
} from '#/api/billing';
import { ProductVersionMap } from '#/types/billing';

import CreateSubscriptionDrawer from './modals/create-subscription-drawer.vue';
import RenewModal from './modals/renew-modal.vue';
import SubscriptionDetailDrawer from './modals/subscription-detail-drawer.vue';

const loading = ref(false);
const tableData = ref<TenantSubscription[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const selectedRowKeys = ref<string[]>([]);
const products = ref<any[]>([]);

// 租户列表（从订阅数据中提取）
const tenantList = ref<string[]>([]);

// 查询参数
const queryParams = ref<SubscriptionQueryParams>({
  page: 1,
  pageSize: 10,
});

// 订阅详情抽屉
const detailDrawerOpen = ref(false);
const selectedSubscriptionId = ref<null | string>(null);

// 续订弹窗
const renewModalOpen = ref(false);
const selectedSubscription = ref<null | TenantSubscription>(null);

// 新增订阅抽屉
const createDrawerOpen = ref(false);

// 状态选项
const statusOptions = [
  { label: '有效', value: 'active' },
  { label: '已过期', value: 'expired' },
];

// 产品版本选项
const versionOptions = [
  { label: '标准版', value: 'standard' },
  { label: 'Plus', value: 'plus' },
  { label: 'Pro', value: 'pro' },
  { label: 'ProMax', value: 'promax' },
];

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  active: { text: '有效', color: 'success' },
  expired: { text: '已过期', color: 'default' },
};

// 版本映射（包含颜色）
const versionColorMap: Record<string, string> = {
  standard: 'blue',
  plus: 'cyan',
  pro: 'purple',
  promax: 'gold',
};

// 获取订阅列表
async function fetchSubscriptions() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const response = await getSubscriptionsApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;

    // 提取租户列表（去重）
    const tenants = new Set<string>();
    response.data.items.forEach((item: TenantSubscription) => {
      tenants.add(item.tenantName);
    });
    tenantList.value = [...tenants].toSorted();
  } catch (error) {
    message.error('获取订阅列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 获取产品列表
async function fetchProducts() {
  try {
    const response = await getProductsApi({ page: 1, pageSize: 100 });
    products.value = response.data.items;
  } catch (error) {
    console.error('获取产品列表失败', error);
  }
}

// 查询
function handleSearch() {
  currentPage.value = 1;
  fetchSubscriptions();
}

// 重置查询
function handleReset() {
  queryParams.value = {
    page: 1,
    pageSize: pageSize.value,
  };
  currentPage.value = 1;
  fetchSubscriptions();
}

// 查看详情
function handleViewDetail(subscriptionId: string) {
  selectedSubscriptionId.value = subscriptionId;
  detailDrawerOpen.value = true;
}

// 续订
function handleRenew(subscription: TenantSubscription) {
  selectedSubscription.value = subscription;
  renewModalOpen.value = true;
}

// 续订成功
function handleRenewSuccess() {
  renewModalOpen.value = false;
  fetchSubscriptions();
}

// 新增订阅
function handleAdd() {
  createDrawerOpen.value = true;
}

// 新增订阅成功
function handleCreateSuccess() {
  createDrawerOpen.value = false;
  fetchSubscriptions();
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的订阅');
    return;
  }
  try {
    await batchDeleteSubscriptionsApi(selectedRowKeys.value);
    message.success('删除成功');
    selectedRowKeys.value = [];
    fetchSubscriptions();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 分页改变
function handleTableChange(pagination: any) {
  currentPage.value = pagination.current;
  pageSize.value = pagination.pageSize;
  fetchSubscriptions();
}

// 刷新
function handleRefresh() {
  fetchSubscriptions();
}

// 导出
function handleExport() {
  message.success('导出功能开发中');
}

// 批量生成 License
function handleBatchGenerateLicense() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要生成 License 的订阅');
    return;
  }

  const selectedSubscriptions = tableData.value.filter((item) =>
    selectedRowKeys.value.includes(item.id),
  );

  message.info(
    `开始为 ${selectedSubscriptions.length} 个订阅生成 License 文件...`,
  );

  // 逐个生成，间隔300ms
  selectedSubscriptions.forEach((subscription, index) => {
    setTimeout(() => {
      handleGenerateLicense(subscription);
    }, index * 300);
  });

  message.success(
    `已开始批量生成 ${selectedSubscriptions.length} 个 License 文件`,
  );
}

// 生成 License 文件
function handleGenerateLicense(subscription: TenantSubscription) {
  try {
    // 生成 License 数据结构
    const licenseData = {
      // License 基本信息
      license: {
        id: `LIC-${subscription.id}`,
        version: '1.0',
        type: 'tenant_subscription',
        issueDate: new Date().toISOString(),
        issuer: '企财通运营平台',
      },

      // 租户信息
      tenant: {
        id: subscription.tenantId,
        name: subscription.tenantName,
        subscriptionId: subscription.id,
      },

      // 产品/服务权限
      product: {
        name: subscription.productName,
        version: subscription.productVersion,
        code: subscription.productCode,
        displayName: `${subscription.productName} - ${ProductVersionMap[subscription.productVersion] || subscription.productVersion}`,
      },

      // 订阅期限
      subscription: {
        startDate: subscription.subscribeDate,
        endDate: subscription.expiryDate,
        status: subscription.status,
        autoRenew: subscription.autoRenew || false,
      },

      // 权限声明
      permissions: {
        services: ['audit', 'analysis', 'report'], // 默认权限
        features: generateFeaturesByVersion(subscription.productVersion),
        quotas: generateQuotasByVersion(subscription.productVersion),
      },

      // 数字签名（模拟）
      signature: {
        algorithm: 'RSA-SHA256',
        value: generateMockSignature(subscription.id),
        timestamp: new Date().toISOString(),
      },

      // 附加信息
      metadata: {
        createdBy: '系统管理员',
        environment: 'production',
        notes: '本License为企财通平台正式授权文件，仅供指定租户使用',
      },
    };

    // 转换为 JSON 字符串（格式化）
    const jsonString = JSON.stringify(licenseData, null, 2);

    // 创建 Blob 对象
    const blob = new Blob([jsonString], { type: 'application/json' });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `license_${subscription.tenantName}_${subscription.productName}_${Date.now()}.json`;

    // 触发下载
    document.body.append(link);
    link.click();

    // 清理
    link.remove();
    URL.revokeObjectURL(url);

    message.success(`License 文件已生成：${link.download}`);
  } catch (error) {
    message.error('生成 License 文件失败');
    console.error('生成 License 失败:', error);
  }
}

// 根据产品版本生成功能列表
function generateFeaturesByVersion(version: string): string[] {
  const baseFeatures = ['dashboard', 'basic_audit'];

  const featureMap: Record<string, string[]> = {
    standard: [...baseFeatures, 'audit_tools', 'basic_report', 'export_data'],
    plus: [
      ...baseFeatures,
      'audit_tools',
      'basic_report',
      'export_data',
      'api_access',
      'custom_rules',
    ],
    pro: [
      ...baseFeatures,
      'audit_tools',
      'advanced_report',
      'export_data',
      'api_access',
      'custom_rules',
      'ai_analysis',
      'real_time_monitor',
    ],
    promax: [
      ...baseFeatures,
      'audit_tools',
      'advanced_report',
      'export_data',
      'api_access',
      'custom_rules',
      'ai_analysis',
      'real_time_monitor',
      'white_label',
      'unlimited_quota',
    ],
  };

  return featureMap[version] || baseFeatures;
}

// 根据产品版本生成配额
function generateQuotasByVersion(version: string): Record<string, number> {
  const quotaMap: Record<string, Record<string, number>> = {
    standard: {
      maxUsers: 50,
      maxAuditRecords: 10_000,
      maxApiCallsPerDay: 1000,
      maxStorageGB: 10,
    },
    plus: {
      maxUsers: 200,
      maxAuditRecords: 50_000,
      maxApiCallsPerDay: 5000,
      maxStorageGB: 50,
    },
    pro: {
      maxUsers: 1000,
      maxAuditRecords: 200_000,
      maxApiCallsPerDay: 20_000,
      maxStorageGB: 200,
    },
    promax: {
      maxUsers: -1, // -1 表示无限制
      maxAuditRecords: -1,
      maxApiCallsPerDay: -1,
      maxStorageGB: -1,
    },
  };

  return quotaMap[version] || quotaMap.standard;
}

// 生成模拟签名
function generateMockSignature(subscriptionId: string): string {
  // 实际生产环境应使用真实的加密签名
  const timestamp = Date.now();
  const input = `${subscriptionId}-${timestamp}`;

  // 简单的哈希模拟（实际应使用 RSA 或其他加密算法）
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.codePointAt(i) ?? 0;
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return btoa(Math.abs(hash).toString(16).padStart(32, '0'));
}

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

onMounted(() => {
  fetchSubscriptions();
  fetchProducts();
});
</script>

<template>
  <div class="h-full space-y-4 overflow-y-auto p-6">
    <!-- 查询表单 -->
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <!-- 第一行：租户名称、产品名称、产品规格、订阅状态 -->
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 租户名称 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">租户名称</label>
          <Select
            v-model:value="queryParams.tenantName"
            allow-clear
            placeholder="请选择租户"
            class="flex-1"
            show-search
            :filter-option="
              (input: string, option: any) =>
                option.value.toLowerCase().includes(input.toLowerCase())
            "
          >
            <Select.Option
              v-for="tenant in tenantList"
              :key="tenant"
              :value="tenant"
            >
              {{ tenant }}
            </Select.Option>
          </Select>
        </div>

        <!-- 产品名称 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">产品名称</label>
          <Select
            v-model:value="queryParams.productName"
            allow-clear
            placeholder="请选择产品"
            class="flex-1"
          >
            <Select.Option
              v-for="product in products"
              :key="product.serviceName"
              :value="product.serviceName"
            >
              {{ product.serviceName }}
            </Select.Option>
          </Select>
        </div>

        <!-- 产品规格 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">产品规格</label>
          <Select
            v-model:value="queryParams.productVersion"
            allow-clear
            placeholder="请选择规格"
            class="flex-1"
          >
            <Select.Option
              v-for="version in versionOptions"
              :key="version.value"
              :value="version.value"
            >
              {{ version.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 订阅状态 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">订阅状态</label>
          <Select
            v-model:value="queryParams.status"
            allow-clear
            placeholder="请选择状态"
            class="flex-1"
          >
            <Select.Option
              v-for="item in statusOptions"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </Select.Option>
          </Select>
        </div>
      </div>

      <!-- 第二行：订阅日期、到期日期、操作按钮 -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 订阅日期 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">订阅日期</label>
          <DatePicker.RangePicker
            v-model:value="queryParams.subscribeDateRange"
            class="flex-1"
            :placeholder="['开始日期', '结束日期']"
          />
        </div>

        <!-- 到期日期 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">到期日期</label>
          <DatePicker.RangePicker
            v-model:value="queryParams.expiryDateRange"
            class="flex-1"
            :placeholder="['开始日期', '结束日期']"
          />
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center justify-end gap-2 lg:col-span-2">
          <Button @click="handleReset">重置</Button>
          <Button type="primary" @click="handleSearch">搜索</Button>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="rounded-lg border bg-card shadow-sm">
      <!-- 表格标题和操作栏 -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h3 class="text-lg font-semibold">租户订阅</h3>
        <Space>
          <Button type="primary" @click="handleAdd">
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            新增订阅
          </Button>
          <Button @click="handleExport">导出</Button>
          <Tooltip title="刷新">
            <Button @click="handleRefresh">
              <Icon icon="lucide:refresh-cw" class="size-4" />
            </Button>
          </Tooltip>
          <Tooltip title="最大化">
            <Button>
              <Icon icon="lucide:maximize" class="size-4" />
            </Button>
          </Tooltip>
          <Tooltip title="设置">
            <Button>
              <Icon icon="lucide:settings" class="size-4" />
            </Button>
          </Tooltip>
        </Space>
      </div>

      <table class="w-full">
        <thead class="bg-muted/50">
          <tr>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 50px"
            >
              <Checkbox
                :checked="
                  selectedRowKeys.length === tableData.length &&
                  tableData.length > 0
                "
                :indeterminate="
                  selectedRowKeys.length > 0 &&
                  selectedRowKeys.length < tableData.length
                "
                @change="
                  (e: any) => {
                    if (e.target.checked) {
                      selectedRowKeys = tableData.map((item) => item.id);
                    } else {
                      selectedRowKeys = [];
                    }
                  }
                "
              />
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 140px"
            >
              订阅ID
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 180px"
            >
              租户名称
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 180px"
            >
              产品/规格
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 120px"
            >
              订阅日期
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 120px"
            >
              到期日期
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 90px"
            >
              状态
            </th>
            <th
              class="border-b px-4 py-3 text-left text-sm font-medium"
              style="width: 150px"
            >
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in tableData"
            :key="item.id"
            class="border-b transition-colors hover:bg-muted/50"
          >
            <td class="px-4 py-3">
              <Checkbox
                :checked="selectedRowKeys.includes(item.id)"
                @change="
                  (e: any) => {
                    if (e.target.checked) {
                      selectedRowKeys.push(item.id);
                    } else {
                      const index = selectedRowKeys.indexOf(item.id);
                      if (index > -1) {
                        selectedRowKeys.splice(index, 1);
                      }
                    }
                  }
                "
              />
            </td>
            <td class="px-4 py-3 font-mono text-sm">{{ item.id }}</td>
            <td class="px-4 py-3 text-sm font-medium">{{ item.tenantName }}</td>
            <td class="px-4 py-3 text-sm">
              <div class="flex items-center gap-2">
                <span class="font-medium">{{ item.productName }}</span>
                <Tag
                  :color="versionColorMap[item.productVersion] || 'default'"
                  size="small"
                >
                  {{
                    ProductVersionMap[item.productVersion] ||
                    item.productVersion
                  }}
                </Tag>
              </div>
            </td>
            <td class="px-4 py-3 text-sm">
              {{ formatDate(item.subscribeDate) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(item.expiryDate) }}</td>
            <td class="px-4 py-3">
              <Tag :color="statusMap[item.status].color">
                {{ statusMap[item.status].text }}
              </Tag>
            </td>
            <td class="px-4 py-3">
              <Space>
                <Button
                  type="link"
                  size="small"
                  @click="handleViewDetail(item.id)"
                >
                  查看
                </Button>
                <Button
                  type="link"
                  size="small"
                  @click="handleGenerateLicense(item)"
                >
                  <Icon icon="lucide:file-text" class="size-3" />
                  License
                </Button>
                <Button
                  v-if="item.status === 'expired'"
                  type="link"
                  size="small"
                  @click="handleRenew(item)"
                >
                  续订
                </Button>
              </Space>
            </td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td
              :colspan="8"
              class="px-4 py-8 text-center text-muted-foreground"
            >
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 批量操作栏 -->
      <div
        v-if="selectedRowKeys.length > 0"
        class="flex items-center justify-between border-b border-t bg-blue-50 px-4 py-2"
      >
        <span class="text-sm text-blue-600">
          已选择 {{ selectedRowKeys.length }} 项
        </span>
        <Space>
          <Button size="small" @click="handleBatchGenerateLicense">
            <Icon icon="lucide:file-down" class="size-3" />
            批量生成License
          </Button>
          <Popconfirm
            title="确定要删除选中的订阅吗？"
            @confirm="handleBatchDelete"
          >
            <Button danger size="small">批量删除</Button>
          </Popconfirm>
        </Space>
      </div>

      <!-- 分页 -->
      <div
        v-if="total > 0"
        class="flex items-center justify-between border-t px-4 py-3"
      >
        <span class="text-sm text-muted-foreground">
          共 {{ total }} 条记录
        </span>
        <div class="flex gap-2">
          <Button
            :disabled="currentPage === 1"
            size="small"
            @click="
              currentPage--;
              handleTableChange({ current: currentPage, pageSize });
            "
          >
            上一页
          </Button>
          <Button
            :disabled="currentPage * pageSize >= total"
            size="small"
            @click="
              currentPage++;
              handleTableChange({ current: currentPage, pageSize });
            "
          >
            下一页
          </Button>
        </div>
      </div>
    </div>

    <!-- 订阅详情抽屉 -->
    <SubscriptionDetailDrawer
      v-model:open="detailDrawerOpen"
      :subscription-id="selectedSubscriptionId"
    />

    <!-- 续订弹窗 -->
    <RenewModal
      v-model:open="renewModalOpen"
      :subscription="selectedSubscription"
      @success="handleRenewSuccess"
    />

    <!-- 新增订阅抽屉 -->
    <CreateSubscriptionDrawer
      v-model:open="createDrawerOpen"
      :products="products"
      @success="handleCreateSuccess"
    />
  </div>
</template>
