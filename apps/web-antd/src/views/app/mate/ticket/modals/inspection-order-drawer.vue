<script setup lang="ts">
import type { InspectionCheckResult } from '#/types/inspection';
import type { WorkOrder } from '#/types/ticket';

import { ref, watch } from 'vue';

import {
  Alert,
  Button,
  Drawer,
  Input,
  message,
  Select,
  Tag,
} from 'ant-design-vue';

import {
  getInspectionOrderApi,
  inspectionStaff,
  updateInspectionOrderApi,
} from '#/api/contract-inspection';
import { deepClone } from '#/utils/deep-clone';

const props = defineProps<{ code: string }>();
const emit = defineEmits<{ changed: [] }>();
const statusLabels: Record<string, string> = {
  pending: '待派单',
  dispatched: '待接单',
  processing: '处理中',
  'pending-acceptance': '待验收',
  completed: '已完成',
};
const open = defineModel<boolean>('open');
const order = ref<WorkOrder>();
const busy = ref(false);
const error = ref('');
const assignee = ref('');
const note = ref('');
const results = ref<InspectionCheckResult[]>([]);
watch(
  () => [open.value, props.code],
  async () => {
    if (!open.value || !props.code) return;
    error.value = '';
    try {
      const response = await getInspectionOrderApi(props.code);
      order.value = response.data;
      results.value = deepClone(order.value.inspection?.results || []);
      note.value = order.value.inspection?.acceptanceNote || '';
    } catch (error_) {
      error.value = (error_ as Error).message;
    }
  },
  { immediate: true },
);
function result(deviceId: string, itemId: string) {
  let item = results.value.find(
    (value) => value.deviceId === deviceId && value.itemId === itemId,
  );
  if (!item) {
    item = { deviceId, itemId, result: '正常', note: '', evidence: '' };
    results.value.push(item);
  }
  return item;
}
function demo() {
  results.value = (order.value?.inspection?.devices || []).flatMap((device) =>
    device.items.map((item) => ({
      deviceId: device.id,
      itemId: item.id,
      result: '正常' as const,
      note: '演示检查正常',
      evidence: `演示凭证：${item.evidence}`,
    })),
  );
}
async function act(action: Parameters<typeof updateInspectionOrderApi>[1]) {
  if (busy.value) return;
  busy.value = true;
  try {
    const response = await updateInspectionOrderApi(props.code, action, {
      assigneeId: assignee.value,
      results: deepClone(results.value),
      note: note.value,
    });
    order.value = response.data;
    emit('changed');
    message.success('工单状态与计划记录已同步');
  } catch (error_) {
    message.error((error_ as Error).message);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <Drawer
    v-model:open="open"
    title="巡检工单执行与验收"
    :width="900"
    :closable="!busy"
    :mask-closable="!busy"
  >
    <Alert v-if="error" type="warning" :message="error" />
    <template v-else-if="order">
      <div class="mb-4">
        <h2 class="text-lg font-semibold">{{ order.title }}</h2>
        <p class="mt-2 text-sm text-slate-500">
          {{ order.code }} · 计划 {{ order.inspection?.planId }} ·
          {{ order.customer }} · {{ order.deadline }}
        </p>
        <Tag class="mt-2">{{ statusLabels[order.status] || order.status }}</Tag>
        <span>执行人：{{ order.assignee || '待分配' }}</span>
      </div>
      <Alert
        class="mb-4"
        type="info"
        message="设备与事项为工单生成时的快照。凭证以说明或文件名演示，当前不上传真实附件；演示模式可分别操作工程师与验收人环节。"
      />
      <div v-if="order.status === 'pending'" class="mb-4 flex gap-2">
        <Select
          v-model:value="assignee"
          class="w-72"
          placeholder="调度人员选择执行工程师"
          :options="
            inspectionStaff.map((item) => ({
              label: `${item.name} · ${item.team}`,
              value: item.id,
            }))
          "
        />
        <Button
          :loading="busy"
          :disabled="!assignee"
          type="primary"
          @click="act('dispatch')"
        >
          确认派单
        </Button>
      </div>
      <Button
        v-if="order.status === 'dispatched'"
        type="primary"
        :loading="busy"
        class="mb-4"
        @click="act('accept')"
      >
        工程师确认接单
      </Button>
      <Button v-if="order.status === 'processing'" class="mb-4" @click="demo">
        填入正常检查示例（演示）
      </Button>
      <section
        v-for="device in order.inspection?.devices"
        :key="device.id"
        class="mb-4 rounded-lg border border-slate-200 p-4"
      >
        <h3 class="mb-3 font-semibold">
          {{ device.name }} · {{ device.code }} · {{ device.location }}
        </h3>
        <div
          v-for="item in device.items"
          :key="item.id"
          class="mb-3 border-t border-slate-100 pt-3"
        >
          <div class="mb-2 flex gap-2 text-sm">
            <b>{{ item.name }}</b>
            <Tag>{{ item.required ? '必检' : '选检' }}</Tag>
            <span class="text-slate-500">{{ item.standard }}</span>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <Select
              v-model:value="result(device.id, item.id).result"
              :disabled="order.status !== 'processing'"
              :options="[
                { label: '正常', value: '正常' },
                { label: '异常', value: '异常' },
              ]"
            />
            <Input
              v-model:value="result(device.id, item.id).note"
              :disabled="order.status !== 'processing'"
              placeholder="检查说明，异常时必填"
            />
            <Input
              v-model:value="result(device.id, item.id).evidence"
              :disabled="order.status !== 'processing'"
              :placeholder="`凭证说明：${item.evidence}`"
            />
          </div>
        </div>
      </section>
      <Alert
        v-if="order.inspection?.exceptionTicket"
        class="mb-4"
        type="warning"
        :message="`异常已转关联报修：${order.inspection.exceptionTicket}，可在我的工单查询`"
      />
      <template v-if="order.status === 'pending-acceptance'">
        <label>
          验收意见 *
          <Input.TextArea v-model:value="note" :rows="3" />
        </label>
        <div class="mt-3 flex gap-2">
          <Button
            type="primary"
            :disabled="!note.trim()"
            :loading="busy"
            @click="act('approve')"
          >
            验收通过
          </Button>
          <Button
            danger
            :disabled="!note.trim()"
            :loading="busy"
            @click="act('reject')"
          >
            退回补充
          </Button>
        </div>
      </template>
      <p v-if="order.status === 'completed'" class="text-teal-700">
        验收意见：{{ order.inspection?.acceptanceNote }}；已回写计划执行记录。
      </p>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :disabled="busy" @click="open = false">关闭</Button>
        <template v-if="order?.status === 'processing'">
          <Button :loading="busy" @click="act('save')">保存检查结果</Button>
          <Button :loading="busy" @click="act('exception')">异常转报修</Button>
          <Button type="primary" :loading="busy" @click="act('submit')">
            提交验收
          </Button>
        </template>
      </div>
    </template>
  </Drawer>
</template>
