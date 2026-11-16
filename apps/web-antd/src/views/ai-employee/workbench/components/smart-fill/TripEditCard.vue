<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Select } from 'ant-design-vue';

interface Trip {
  seq: number;
  startDate: string;
  endDate: string;
  from: string;
  to: string;
  transport: string;
  companion: string;
  remark: string;
  source: string;
}

interface TripData {
  trips: Trip[];
  differenceReason: string;
}

const props = defineProps<{
  initialTrips: Trip[];
  selectedApplications: string[];
}>();

const emit = defineEmits<{
  confirm: [data: TripData];
}>();

const submitting = ref(false);
const trips = ref<Trip[]>(props.initialTrips.map((t) => ({ ...t })));
const differenceReason = ref('');
const recognizing = ref(false);
const imageFileInput = ref<HTMLInputElement | null>(null);

const transportOptions = ['火车', '飞机', '自驾', '其它'];

// Mock recognition results based on filename patterns
const mockRecognitionResults = [
  {
    startDate: '2026-07-20',
    endDate: '2026-07-20',
    from: '上海虹桥站',
    to: '浦东新区酒店',
    transport: '其它',
    remark: '导航截图识别',
    source: '用户补填',
  },
  {
    startDate: '2026-07-22',
    endDate: '2026-07-22',
    from: '浦东新区',
    to: '徐汇区',
    transport: '自驾',
    remark: '导航截图识别',
    source: '用户补填',
  },
  {
    startDate: '2026-07-20',
    endDate: '2026-07-20',
    from: '上海',
    to: '北京',
    transport: '飞机',
    remark: '机票识别',
    source: '用户补填',
  },
  {
    startDate: '2026-07-24',
    endDate: '2026-07-24',
    from: '上海',
    to: '杭州',
    transport: '火车',
    remark: '火车票识别',
    source: '用户补填',
  },
];

function addTrip() {
  trips.value.push({
    seq: trips.value.length + 1,
    startDate: '',
    endDate: '',
    from: '',
    to: '',
    transport: '其它',
    companion: '',
    remark: '',
    source: '用户补填',
  });
}

function removeTrip(index: number) {
  trips.value.splice(index, 1);
  trips.value.forEach((t, i) => (t.seq = i + 1));
}

function handleUploadImage() {
  if (imageFileInput.value) {
    imageFileInput.value.value = '';
    imageFileInput.value.click();
  }
}

function onImageSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  recognizing.value = true;
  message.loading({
    content: '正在识别图片中的行程信息...',
    key: 'recognize',
    duration: 0,
  });

  // Simulate recognition delay
  setTimeout(() => {
    recognizing.value = false;
    message.destroy('recognize');

    // Pick a mock result based on filename
    const name = file.name.toLowerCase();
    let resultIndex = 0;
    if (name.includes('自驾') || name.includes('导航')) resultIndex = 1;
    else if (name.includes('飞机') || name.includes('flight')) resultIndex = 2;
    else if (
      name.includes('火车') ||
      name.includes('train') ||
      name.includes('高铁')
    )
      resultIndex = 3;
    else if (name.includes('打车') || name.includes('taxi')) resultIndex = 0;

    const result = mockRecognitionResults[resultIndex];
    const newTrip: Trip = {
      seq: trips.value.length + 1,
      startDate: result.startDate,
      endDate: result.endDate,
      from: result.from,
      to: result.to,
      transport: result.transport,
      companion: '',
      remark: result.remark,
      source: result.source,
    };

    trips.value.push(newTrip);
    message.success(`已从图片识别并添加行程：${result.from} → ${result.to}`);
  }, 1500);
}

function handleConfirm() {
  if (trips.value.length === 0) {
    message.warning('行程列表不能为空');
    return;
  }
  submitting.value = true;
  emit('confirm', {
    trips: trips.value.map((t) => ({ ...t })),
    differenceReason: differenceReason.value,
  });
  message.success('行程已确认');
}
</script>

<template>
  <div
    class="overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-lg shadow-teal-100/30"
  >
    <div
      class="flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3"
    >
      <div class="flex items-center gap-2">
        <span
          class="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs text-white"
        >
          <Icon icon="lucide:map-pin" class="size-3" />
        </span>
        <h4 class="m-0 text-sm font-bold text-white">2. 行程编辑</h4>
      </div>
      <span
        class="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white/90"
      >
        待编辑
      </span>
    </div>

    <div class="space-y-3 p-4">
      <p class="mb-3 text-xs text-slate-500">
        已关联
        {{ selectedApplications.length }}
        份申请单，以下行程来自申请单明细，可编辑调整。
      </p>

      <div class="overflow-x-auto rounded-lg border border-slate-200">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 text-slate-500">
            <tr>
              <th class="px-2 py-2">#</th>
              <th class="px-2 py-2">出发日期</th>
              <th class="px-2 py-2">结束日期</th>
              <th class="px-2 py-2">出发城市</th>
              <th class="px-2 py-2">目的城市</th>
              <th class="px-2 py-2">交通方式</th>
              <th class="px-2 py-2">同住人</th>
              <th class="px-2 py-2">备注</th>
              <th class="px-2 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(trip, index) in trips"
              :key="index"
              class="border-t border-slate-100"
            >
              <td class="px-2 py-1.5 text-center text-slate-400">
                {{ trip.seq }}
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="trip.startDate"
                  type="date"
                  size="small"
                  class="!w-28 !text-xs"
                />
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="trip.endDate"
                  type="date"
                  size="small"
                  class="!w-28 !text-xs"
                />
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="trip.from"
                  size="small"
                  class="!w-20 !text-xs"
                />
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="trip.to"
                  size="small"
                  class="!w-20 !text-xs"
                />
              </td>
              <td class="px-2 py-1.5">
                <Select
                  v-model:value="trip.transport"
                  size="small"
                  class="!w-16 !text-xs"
                >
                  <Select.Option
                    v-for="t in transportOptions"
                    :key="t"
                    :value="t"
                  >
                    {{ t }}
                  </Select.Option>
                </Select>
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="trip.companion"
                  size="small"
                  class="!w-12 !text-xs"
                />
              </td>
              <td class="px-2 py-1.5">
                <Input
                  v-model:value="trip.remark"
                  size="small"
                  class="!w-20 !text-xs"
                />
              </td>
              <td class="px-2 py-1.5">
                <Button
                  type="text"
                  danger
                  size="small"
                  class="!h-6 !px-1"
                  @click="removeTrip(index)"
                >
                  <Icon icon="lucide:trash-2" class="size-3" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center gap-2">
        <Button
          type="dashed"
          class="flex-1 !rounded-lg !border-dashed !text-xs"
          @click="addTrip"
        >
          <Icon icon="lucide:plus" class="size-3" />
          新增行程
        </Button>
        <input
          ref="imageFileInput"
          type="file"
          accept="image/*"
          class="hidden"
          @change="onImageSelected"
        />
        <Button
          class="flex items-center gap-1.5 rounded-lg border-teal-300 px-4 text-xs font-bold text-teal-700"
          :disabled="recognizing"
          @click="handleUploadImage"
        >
          <Icon icon="lucide:scan" class="size-3" />
          {{ recognizing ? '识别中...' : '上传图片识别' }}
        </Button>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-slate-500">
          ⚠️ 差异说明（删除/修改行程需填写）
        </label>
        <Input.TextArea
          v-model:value="differenceReason"
          :auto-size="{ minRows: 2, maxRows: 4 }"
          class="!text-sm"
          placeholder="请说明与差旅申请单不一致的原因..."
        />
      </div>

      <div class="flex justify-end">
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 text-sm font-bold hover:!bg-teal-700"
          :disabled="submitting"
          @click="handleConfirm"
        >
          <Icon icon="lucide:check" class="size-4" />
          确认行程，进入下一步
        </Button>
      </div>
    </div>
  </div>
</template>
