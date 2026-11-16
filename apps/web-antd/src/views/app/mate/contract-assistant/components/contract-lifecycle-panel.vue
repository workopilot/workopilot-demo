<script setup lang="ts">
import type {
  ContractChatSession,
  ContractReminderRecord,
} from '#/types/contract-assistant';

import { ref, watch } from 'vue';

import {
  Button,
  DatePicker,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  completeContractReminder,
  endContract,
  getContractReminderRecords,
  recordContractRenewal,
  runContractReminders,
} from '#/api/contract-lifecycle';
import {
  getContractArchive,
  getContractArchives,
  getContractOperationPermission,
} from '#/api/mock-contract-assistant';

const props = defineProps<{ contractId: string }>();
const emit = defineEmits<{ changed: [] }>();
const contract = ref<ContractChatSession>();
const records = ref<ContractReminderRecord[]>([]);
const candidates = ref<{ label: string; value: string }[]>([]);
const permission = ref('view');
const busy = ref(false);
const failure = ref('');
const decision = ref<'no-renew' | 'renew' | 'undecided'>('undecided');
const renewalNote = ref('');
const newId = ref<string>();
const selected = ref<ContractReminderRecord>();
const note = ref('');
const resultOpen = ref(false);
const endOpen = ref(false);
const endKind = ref<'terminated' | 'void'>('terminated');
const endDate = ref('');
const reason = ref('');
const labels = {
  waiting: '待触发',
  sent: '发送成功',
  processing: '办理中',
  completed: '已完成',
  failed: '发送失败',
  cancelled: '已取消',
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : '操作失败，请重试';
let generation = 0;
async function load() {
  const token = ++generation;
  failure.value = '';
  try {
    const [a, r, p, all] = await Promise.all([
      getContractArchive(props.contractId),
      getContractReminderRecords(props.contractId),
      getContractOperationPermission(props.contractId),
      getContractArchives(),
    ]);
    if (token !== generation) return;
    contract.value = a.data || undefined;
    records.value = r.data;
    permission.value = p.data || 'view';
    decision.value = a.data?.renewal?.decision || 'undecided';
    renewalNote.value = a.data?.renewal?.note || '';
    newId.value = a.data?.renewal?.newContractId;
    candidates.value = all.data
      .filter(
        (item) =>
          item.id !== props.contractId &&
          item.managementState?.archived &&
          item.signedAt &&
          item.counterparty === a.data?.counterparty &&
          !item.end,
      )
      .map((item) => ({
        value: item.id,
        label: `${item.fileName}（${item.contractNumber}）`,
      }));
  } catch (error) {
    failure.value = errorText(error);
  }
}
async function act(action: () => Promise<unknown>, text: string) {
  busy.value = true;
  try {
    await action();
    await load();
    emit('changed');
    message.success(text);
  } catch (error) {
    message.error(errorText(error));
  } finally {
    busy.value = false;
  }
}
function openResult(record: ContractReminderRecord) {
  selected.value = record;
  note.value = '';
  resultOpen.value = true;
}
async function saveResult() {
  if (!selected.value) return;
  await act(async () => {
    await completeContractReminder(
      props.contractId,
      selected.value!.id,
      note.value,
    );
    resultOpen.value = false;
  }, '办理结果已保存');
}
watch(() => props.contractId, load, { immediate: true });
</script>
<template>
  <div class="lifecycle-panel">
    <Empty v-if="failure" :description="failure">
      <Button @click="load">重新加载</Button>
    </Empty>
    <template v-else-if="contract">
      <header>
        <div>
          <h3>到期事项与办理记录</h3>
          <p>
            {{
              contract.managementState?.dateConfirmed
                ? '按已确认日期检查到期事项，同一事项同一周期仅触发一次。'
                : '关键日期尚未确认，不触发到期提醒。'
            }}
          </p>
        </div>
        <Button
          v-if="permission !== 'view' && !contract.end"
          :loading="busy"
          @click="act(() => runContractReminders(contractId), '到期检查完成')"
        >
          检查并触发
        </Button>
      </header>
      <article v-for="record in records" :key="record.id" class="record">
        <h4>
          {{ record.name }}
          <Tag
            :color="
              record.status === 'failed'
                ? 'red'
                : ['completed', 'sent'].includes(record.status)
                  ? 'green'
                  : 'default'
            "
          >
            {{ labels[record.status] }}
          </Tag>
        </h4>
        <p>{{ record.date || '等待触发条件确认' }}</p>
        <p>{{ record.note }}</p>
        <small v-if="record.at">{{ record.at }}</small>
        <Button
          v-if="
            record.status === 'processing' &&
            !/续约|续签/.test(record.name) &&
            permission !== 'view'
          "
          size="small"
          @click="openResult(record)"
        >
          记录办理结果
        </Button>
      </article>
      <Empty v-if="records.length === 0" description="本类别未配置到期事项" />
      <section
        v-if="
          contract.scheme?.management?.lifecycle.automaticRenewal !== 'none'
        "
        class="renewal"
      >
        <h3>续约决策与续签结果</h3>
        <p>{{ contract.scheme?.management?.lifecycle.renewalInstructions }}</p>
        <div class="form">
          <label>
            续约决策
            <Select
              v-model:value="decision"
              :disabled="permission === 'view' || !!contract.end || busy"
              :options="[
                { value: 'renew', label: '续约' },
                { value: 'no-renew', label: '不续约' },
                { value: 'undecided', label: '暂未决定' },
              ]"
            />
          </label>
          <label v-if="decision === 'renew'">
            已签署的新合同（续签完成时关联）
            <Select
              v-model:value="newId"
              allow-clear
              :disabled="permission === 'view' || !!contract.end || busy"
              :options="candidates"
              placeholder="未签署时保留办理中"
            />
          </label>
          <label>
            决策依据／办理结果
            <Input.TextArea
              v-model:value="renewalNote"
              :disabled="permission === 'view' || !!contract.end || busy"
            />
          </label>
        </div>
        <Button
          v-if="permission !== 'view' && !contract.end"
          :loading="busy"
          @click="
            act(
              () =>
                recordContractRenewal(contractId, decision, renewalNote, newId),
              '续约结果已保存',
            )
          "
        >
          保存续约结果
        </Button>
        <p v-if="contract.renewal?.newContractId">
          已关联新合同：{{ contract.renewal.newContractId }}
        </p>
        <p v-if="contract.previousContractId">
          关联原合同：{{ contract.previousContractId }}
        </p>
      </section>
      <section v-if="permission === 'manage'" class="end-section">
        <h3>合同终止与作废</h3>
        <p v-if="contract.end">
          {{ contract.end.kind === 'terminated' ? '已终止' : '已作废' }} ·
          {{ contract.end.date }} · {{ contract.end.reason }}
        </p>
        <template v-else>
          <p>
            仅结束合同及不再适用的到期提醒，已安排的业务事项保留并提示负责人核对。
          </p>
          <Button :disabled="busy" @click="endOpen = true">
            登记终止／作废
          </Button>
        </template>
      </section>
    </template>
    <Modal
      v-model:open="resultOpen"
      title="记录办理结果"
      ok-text="确认完成"
      cancel-text="取消"
      :confirm-loading="busy"
      @ok="saveResult"
    >
      <Input.TextArea
        v-model:value="note"
        placeholder="填写实际处理结果和依据"
      />
    </Modal>
    <Modal
      v-model:open="endOpen"
      title="确认合同终止／作废"
      ok-text="确认结束"
      cancel-text="取消"
      :confirm-loading="busy"
      @ok="
        act(async () => {
          await endContract(contractId, endKind, endDate, reason);
          endOpen = false;
        }, '合同状态已更新')
      "
    >
      <div class="form">
        <label>
          结束方式
          <Select
            v-model:value="endKind"
            :options="[
              { value: 'terminated', label: '终止' },
              { value: 'void', label: '作废' },
            ]"
          />
        </label>
        <label>
          实际结束日期
          <DatePicker v-model:value="endDate" value-format="YYYY-MM-DD" />
        </label>
        <label>
          原因与依据
          <Input.TextArea v-model:value="reason" />
        </label>
      </div>
    </Modal>
  </div>
</template>
<style scoped>
.lifecycle-panel {
  display: grid;
  gap: 16px;
}

.lifecycle-panel > header {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.lifecycle-panel h3 {
  font-size: 14px;
  font-weight: 600;
  color: #3c6149;
}

.lifecycle-panel p {
  margin: 9px 0;
  font-size: 12px;
  line-height: 1.8;
  color: #8ba092;
}

.record,
.renewal,
.end-section {
  padding: 16px;
  background: #fcfefc;
  border: 1px solid #e0eae3;
  border-radius: 10px;
}

.record h4 {
  display: flex;
  gap: 9px;
  align-items: center;
  font-size: 13px;
  color: #4e7259;
}

.record small {
  margin-right: 12px;
  font-size: 10px;
  color: #a0afa4;
}

.form {
  display: grid;
  gap: 14px;
  margin: 14px 0;
}

.form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #6b8774;
}

.form :deep(.ant-picker) {
  width: 100%;
}

@media (max-width: 680px) {
  .lifecycle-panel > header {
    flex-wrap: wrap;
  }
}
</style>
