<script setup lang="ts">
import type {
  ContractBusinessDraft,
  ContractChatSession,
  ContractRelatedItem,
} from '#/types/contract-assistant';

import { computed, ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Empty,
  Input,
  InputNumber,
  message,
  Modal,
  Tag,
} from 'ant-design-vue';

import {
  acknowledgeContractBusinessChange,
  createContractBusinessPlan,
  recordContractBusinessResult,
} from '#/api/contract-business';
import {
  getContractArchive,
  getContractOperationPermission,
  getContractRelatedItems,
} from '#/api/mock-contract-assistant';
import { deepClone } from '#/utils/deep-clone';

const props = defineProps<{
  contractId: string;
  type: 'collection' | 'invoice' | 'project';
}>();
const item = ref<ContractChatSession>();
const rows = ref<ContractRelatedItem[]>([]);
const canHandle = ref(false);
const loading = ref(false);
const busy = ref(false);
const failure = ref('');
const draft = ref<ContractBusinessDraft>({ name: '', owner: '', rows: [] });
const selected = ref<ContractRelatedItem>();
const receiptOpen = ref(false);
const reference = ref('');
const amount = ref<number>();
const note = ref('');
const title = computed(
  () =>
    ({ invoice: '开票计划', collection: '收款计划', project: '项目立项' })[
      props.type
    ],
);
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请重试';
let generation = 0;
async function load() {
  const token = ++generation;
  loading.value = true;
  failure.value = '';
  try {
    const [contract, related, permission] = await Promise.all([
      getContractArchive(props.contractId),
      getContractRelatedItems(props.contractId),
      getContractOperationPermission(props.contractId),
    ]);
    if (token !== generation) return;
    item.value = contract.data || undefined;
    rows.value = related.data.filter((row) => row.type === props.type);
    canHandle.value = permission.data !== 'view';
    if (!item.value) throw new Error('未找到合同');
    draft.value = {
      name: `${item.value.fileName.replace(/\.[^.]+$/, '')}${title.value}`,
      owner: item.value.owner,
      rows: [
        {
          name:
            props.type === 'project'
              ? '项目立项'
              : `第1期${title.value.slice(0, 2)}`,
          date: '',
          amount: undefined,
        },
      ],
    };
  } catch (error) {
    failure.value = errorText(error);
  } finally {
    if (token === generation) loading.value = false;
  }
}
async function create() {
  busy.value = true;
  try {
    await createContractBusinessPlan(
      props.contractId,
      props.type,
      deepClone(draft.value),
    );
    await load();
    message.success(`${title.value}已确认，进展已关联合同`);
  } catch (error) {
    message.error(errorText(error));
  } finally {
    busy.value = false;
  }
}
function openReceipt(row: ContractRelatedItem) {
  selected.value = row;
  reference.value = '';
  amount.value = undefined;
  note.value = '';
  receiptOpen.value = true;
}
async function saveReceipt() {
  if (!selected.value) return;
  busy.value = true;
  try {
    await recordContractBusinessResult(
      props.contractId,
      selected.value.id,
      reference.value,
      note.value,
      amount.value,
    );
    receiptOpen.value = false;
    await load();
    message.success('实际结果已登记，合同进展已更新');
  } catch (error) {
    message.error(errorText(error));
  } finally {
    busy.value = false;
  }
}
async function review(row: ContractRelatedItem) {
  if (!note.value.trim()) {
    message.warning('请填写变更核对结果');
    return;
  }
  busy.value = true;
  try {
    await acknowledgeContractBusinessChange(
      props.contractId,
      row.id,
      note.value,
    );
    await load();
    note.value = '';
    message.success('变更影响已记录');
  } catch (error) {
    message.error(errorText(error));
  } finally {
    busy.value = false;
  }
}
watch(() => [props.contractId, props.type], load, { immediate: true });
</script>
<template>
  <section class="business-panel">
    <header>
      <h3>{{ title }}收集卡片</h3>
      <Tag>{{ item?.fileName || '关联合同' }}</Tag>
    </header>
    <p v-if="loading">正在加载合同与已有计划…</p>
    <Empty v-else-if="failure" :description="failure">
      <Button @click="load">重新加载</Button>
    </Empty>
    <template v-else-if="item">
      <div class="context">
        <span>合同编号：{{ item.contractNumber }}</span>
        <span>客户：{{ item.counterparty }}</span>
        <span v-if="type !== 'project'">
          合同金额：¥{{ item.amount?.toLocaleString('zh-CN') }}
        </span>
        <p>
          {{
            type === 'invoice'
              ? item.invoiceTerms
              : type === 'collection'
                ? item.paymentTerms
                : item.scope
          }}
        </p>
      </div>
      <template v-if="rows.length === 0">
        <p class="help">
          请核对合同约定，补齐日期和金额后确认计划；不会自动办理开票或确认到账。
        </p>
        <div class="fields">
          <label>
            计划名称
            <b>*</b>
            <Input v-model:value="draft.name" :disabled="!canHandle || busy" />
          </label>
          <label>
            负责人
            <b>*</b>
            <Input v-model:value="draft.owner" :disabled="!canHandle || busy" />
          </label>
        </div>
        <div v-for="(row, index) in draft.rows" :key="index" class="draft-row">
          <label>
            事项名称
            <b>*</b>
            <Input v-model:value="row.name" :disabled="!canHandle || busy" />
          </label>
          <label>
            计划日期
            <b>*</b>
            <DatePicker
              v-model:value="row.date"
              value-format="YYYY-MM-DD"
              :disabled="!canHandle || busy"
            />
          </label>
          <label v-if="type !== 'project'">
            计划金额
            <b>*</b>
            <InputNumber
              v-model:value="row.amount"
              :min="0.01"
              :precision="2"
              :disabled="!canHandle || busy"
            />
          </label>
          <Button
            v-if="draft.rows.length > 1"
            danger
            type="text"
            :disabled="busy"
            @click="draft.rows.splice(index, 1)"
          >
            移除
          </Button>
        </div>
        <footer v-if="canHandle">
          <Button
            v-if="type !== 'project'"
            :disabled="busy"
            @click="
              draft.rows.push({
                name: `第${draft.rows.length + 1}期${title.slice(0, 2)}`,
                date: '',
              })
            "
          >
            增加期次
          </Button>
          <Button type="primary" :loading="busy" @click="create">
            确认{{ title }}
          </Button>
        </footer>
      </template>
      <template v-else>
        <p class="help">
          已有关联安排，请在此核对并登记实际结果，避免重复创建。
        </p>
        <article v-for="row in rows" :key="row.id" class="progress-row">
          <header>
            <strong>{{ row.name }}</strong>
            <Tag
              :color="
                row.status === 'completed'
                  ? 'green'
                  : row.status === 'overdue'
                    ? 'orange'
                    : 'blue'
              "
            >
              {{
                row.status === 'completed'
                  ? '已完成'
                  : row.status === 'overdue'
                    ? '已逾期'
                    : row.status === 'in-progress'
                      ? '进行中'
                      : '待办理'
              }}
            </Tag>
            <Tag v-if="row.needsReview" color="orange">合同变更待核对</Tag>
          </header>
          <p>{{ row.plannedDate }} · {{ row.owner }}</p>
          <p v-if="row.amount !== undefined">
            计划 ¥{{ row.amount.toLocaleString('zh-CN') }} ·
            {{ type === 'invoice' ? '已开票' : '已到账' }} ¥{{
              (row.completedAmount || 0).toLocaleString('zh-CN')
            }}
          </p>
          <p>{{ row.progress }}</p>
          <p v-if="row.reference">业务记录编号：{{ row.reference }}</p>
          <template v-if="row.needsReview && canHandle">
            <p>{{ row.reviewReason }}</p>
            <Input.TextArea
              v-model:value="note"
              placeholder="说明变更影响及后续处理"
            />
            <Button :disabled="busy" @click="review(row)">记录核对结果</Button>
          </template>
          <Button
            v-if="canHandle && row.status !== 'completed'"
            size="small"
            :disabled="busy"
            @click="openReceipt(row)"
          >
            {{
              type === 'project'
                ? '登记实际立项结果'
                : type === 'invoice'
                  ? '登记实际开票结果'
                  : '登记实际到账结果'
            }}
          </Button>
        </article>
      </template>
      <p v-if="!canHandle" class="help">当前合同仅有查看权限。</p>
    </template>
    <Modal
      v-model:open="receiptOpen"
      :title="type === 'project' ? '登记立项结果' : '登记实际业务结果'"
      ok-text="确认登记"
      cancel-text="取消"
      :confirm-loading="busy"
      @ok="saveReceipt"
    >
      <div class="receipt-form">
        <label>
          {{
            type === 'project'
              ? '项目编号'
              : type === 'invoice'
                ? '发票或开票记录编号'
                : '到账流水编号'
          }}
          <b>*</b>
          <Input v-model:value="reference" />
        </label>
        <label v-if="type !== 'project'">
          本次实际金额
          <b>*</b>
          <InputNumber v-model:value="amount" :min="0.01" :precision="2" />
        </label>
        <label>
          结果说明
          <b>*</b>
          <Input.TextArea v-model:value="note" />
        </label>
      </div>
    </Modal>
  </section>
</template>
<style scoped>
.business-panel {
  padding: 20px;
  margin: 18px;
  background: #fff;
  border: 1px solid #d9e8de;
  border-radius: 12px;
}

.business-panel > header,
.progress-row > header {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.business-panel h3 {
  font-size: 16px;
  font-weight: 600;
  color: #365e46;
}

.context {
  padding: 14px;
  margin: 14px 0;
  font-size: 12px;
  line-height: 1.9;
  color: #64816d;
  background: #f6faf7;
  border-radius: 9px;
}

.context > span {
  display: inline-block;
  margin-right: 18px;
}

.help {
  margin: 12px 0;
  font-size: 12px;
  line-height: 1.9;
  color: #8ca094;
}

.fields,
.draft-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: end;
  margin: 14px 0;
}

.fields > label {
  flex: 1;
}

.draft-row > label {
  flex: 1;
  min-width: 140px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 12px;
  color: #66816d;
}

b {
  color: #ef4444;
}

.receipt-form {
  display: grid;
  gap: 16px;
  padding-top: 18px;
}

.receipt-form :deep(.ant-input-number) {
  width: 100%;
}

footer {
  display: flex;
  gap: 10px;
  margin-top: 18px;
}

.progress-row {
  padding: 15px;
  margin-top: 12px;
  border: 1px solid #e3ece6;
  border-radius: 9px;
}

.progress-row strong {
  font-size: 13px;
  color: #496b54;
}

.progress-row p {
  margin: 7px 0;
  font-size: 12px;
  line-height: 1.9;
  color: #81988a;
}
</style>
