<script setup lang="ts">
import type {
  ContractAccessEntry,
  ContractPermission,
} from '#/types/contract-assistant';

import { ref, watch } from 'vue';

import {
  Button,
  Empty,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getContractAccess,
  getContractAuthorizationOptions,
  removeContractAccessGrant,
  saveContractAccessGrant,
} from '#/api/mock-contract-authorization';

import {
  contractPermissionOptions,
  permissionLabel,
} from '../utils/authorization';

const props = defineProps<{ contractId: string; contractName: string }>();
const emit = defineEmits<{ changed: [] }>();
const open = defineModel<boolean>('open', { required: true });
const entries = ref<ContractAccessEntry[]>([]);
const users = ref<{ label: string; value: string }[]>([]);
const canManage = ref(false);
const loading = ref(false);
const saving = ref(false);
const userId = ref<string>();
const permission = ref<ContractPermission>('view');
const columns = [
  { title: '人员／角色', dataIndex: 'name', key: 'name', width: 140 },
  { title: '合同权限', key: 'permission', width: 90 },
  { title: '授权来源', key: 'source', width: 210 },
  { title: '操作', key: 'action', width: 120 },
];
function row(record: Record<string, unknown>): ContractAccessEntry {
  const item = entries.value.find((entry) => entry.id === record.id);
  if (!item) throw new Error('未找到授权记录');
  return item;
}
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请重试';
let request = 0;
async function load() {
  const token = ++request;
  loading.value = true;
  canManage.value = false;
  try {
    const [response, options] = await Promise.all([
      getContractAccess(props.contractId),
      getContractAuthorizationOptions(),
    ]);
    if (token !== request) return;
    entries.value = response.data.entries;
    canManage.value = response.data.canManage;
    users.value = options.data.users;
  } catch (error) {
    message.error(errorText(error));
  } finally {
    if (token === request) loading.value = false;
  }
}
async function save() {
  if (!userId.value) {
    message.warning('请选择授权人员');
    return;
  }
  saving.value = true;
  try {
    await saveContractAccessGrant(
      props.contractId,
      userId.value,
      permission.value,
    );
    await load();
    userId.value = undefined;
    permission.value = 'view';
    emit('changed');
    message.success('本合同授权已保存');
  } catch (error) {
    message.error(errorText(error));
  } finally {
    saving.value = false;
  }
}
function edit(entry: ContractAccessEntry) {
  userId.value = entry.userId;
  permission.value = entry.permission;
}
function remove(entry: ContractAccessEntry) {
  if (!entry.grantId) return;
  Modal.confirm({
    title: '移除本合同的单独授权？',
    content: `移除后，“${entry.name}”可能仍通过默认规则或负责人身份获得权限。`,
    okText: '移除',
    cancelText: '取消',
    onOk: async () => {
      saving.value = true;
      try {
        await removeContractAccessGrant(props.contractId, entry.grantId!);
        await load();
        emit('changed');
        message.success('单独授权已移除');
      } catch (error) {
        message.error(errorText(error));
      } finally {
        saving.value = false;
      }
    },
  });
}
watch(
  () => [open.value, props.contractId],
  () => {
    if (open.value) {
      entries.value = [];
      userId.value = undefined;
      permission.value = 'view';
      void load();
    } else request++;
  },
  { immediate: true },
);
</script>
<template>
  <Modal
    v-model:open="open"
    title="本合同授权"
    :width="720"
    :footer="null"
    :closable="!saving"
    :mask-closable="!saving"
    :keyboard="!saving"
  >
    <p class="contract-caption">{{ contractName }}</p>
    <div v-if="canManage" class="grant-form">
      <Select
        v-model:value="userId"
        show-search
        allow-clear
        option-filter-prop="label"
        :options="users"
        placeholder="选择协作人员"
        :disabled="saving"
      />
      <Select
        v-model:value="permission"
        :options="contractPermissionOptions"
        :disabled="saving"
      />
      <Button type="primary" :loading="saving" @click="save">保存授权</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="entries"
      row-key="id"
      size="small"
      :pagination="false"
      :loading="loading"
      :scroll="{ x: 560 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'permission'">
          <Tag
            :color="
              record.permission === 'manage'
                ? 'green'
                : record.permission === 'handle'
                  ? 'blue'
                  : 'default'
            "
          >
            {{ permissionLabel(record.permission) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'source'">
          <span class="source-label">{{ record.sourceLabel }}</span>
        </template>
        <template v-else-if="column.key === 'action'">
          <template v-if="record.source === 'manual' && canManage">
            <Button
              type="link"
              size="small"
              :disabled="saving"
              @click="edit(row(record))"
            >
              修改
            </Button>
            <Button
              type="link"
              size="small"
              danger
              :disabled="saving"
              @click="remove(row(record))"
            >
              移除
            </Button>
          </template>
          <span v-else class="readonly">只读</span>
        </template>
      </template>
      <template #emptyText><Empty description="暂无授权记录" /></template>
    </Table>
    <div class="grant-note">
      <p>
        默认规则授权只读；负责人权限随合同负责人调整。单独授权仅作用于当前合同，同一人员的权限按各来源合并。
      </p>
      <p>
        选择已授权人员后保存，可更新其单独授权；移除单独授权不会移除其他来源的权限。
      </p>
    </div>
    <footer>
      <Button :disabled="saving" @click="open = false">关闭</Button>
    </footer>
  </Modal>
</template>
<style scoped>
.contract-caption {
  margin: 12px 0 18px;
  font-size: 12px;
  color: #809789;
  overflow-wrap: anywhere;
}

.grant-form {
  display: flex;
  gap: 10px;
  padding: 14px;
  margin-bottom: 18px;
  background: #f7faf8;
  border: 1px solid #e2ece5;
  border-radius: 10px;
}

.grant-form > .ant-select:first-child {
  flex: 1;
  min-width: 130px;
}

.grant-form > .ant-select:nth-child(2) {
  width: 100px;
}

.source-label {
  font-size: 11px;
  color: #809587;
}

.readonly {
  font-size: 11px;
  color: #a2afa6;
}

.grant-note {
  padding: 12px 14px;
  margin-top: 14px;
  font-size: 11px;
  line-height: 1.9;
  color: #94a69a;
  background: #f9fbfa;
  border-radius: 8px;
}

footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .grant-form {
    flex-wrap: wrap;
  }

  .grant-form > .ant-select:first-child {
    flex: auto;
    width: 100%;
  }
}
</style>
