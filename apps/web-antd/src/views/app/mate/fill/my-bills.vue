<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Tag } from 'ant-design-vue';

import { mockMateEmployees } from '#/api/mock-data-mate';

interface FillBill {
  id: string;
  type: string;
  amount: string;
  invoiceCount: number;
  itemCount: number;
  time: string;
  status: '审批中' | '已通过' | '已驳回' | '待提交';
  reason?: string;
}

const employee =
  mockMateEmployees.find((item) => item.id === 'fill-assistant') ||
  mockMateEmployees[0]!;

const bills = ref<FillBill[]>([
  {
    id: 'CLS20260728002',
    type: '差旅报销单',
    amount: '¥4,125.00',
    invoiceCount: 6,
    itemCount: 4,
    time: '今天 14:32',
    status: '待提交',
  },
  {
    id: 'CLS20260630015',
    type: '差旅报销单',
    amount: '¥3,268.00',
    invoiceCount: 5,
    itemCount: 4,
    time: '06-30 18:05',
    status: '审批中',
  },
  {
    id: 'CLS20260531008',
    type: '费用报销单',
    amount: '¥860.00',
    invoiceCount: 3,
    itemCount: 2,
    time: '05-31 10:22',
    status: '已通过',
  },
  {
    id: 'CLS20260430201',
    type: '招待费报销单',
    amount: '¥1,560.00',
    invoiceCount: 2,
    itemCount: 2,
    time: '04-30 09:47',
    status: '已驳回',
    reason: '缺招待审批单，请补充后重新提交',
  },
]);

const statusColors: Record<FillBill['status'], string> = {
  待提交: 'gold',
  审批中: 'processing',
  已通过: 'success',
  已驳回: 'error',
};

const statusFilters = ['全部', '待提交', '审批中', '已通过', '已驳回'] as const;
const activeFilter = ref<(typeof statusFilters)[number]>('全部');

const filteredBills = computed(() =>
  activeFilter.value === '全部'
    ? bills.value
    : bills.value.filter((item) => item.status === activeFilter.value),
);

function viewBill(bill: FillBill) {
  message.info(`查看单据 ${bill.id}（Demo 预览）`);
}

function goChat() {
  message.info('已回到填报助理对话，发起一句「帮我填报差旅报销单」即可开始');
}
</script>

<template>
  <div class="fill-bills">
    <header class="fill-bills__head">
      <img :src="employee.avatar" :alt="employee.name" />
      <div>
        <h2>我的单据</h2>
        <p>填报助理为你生成的报销单与填报记录，点击单据可查看详情。</p>
      </div>
      <Button class="fill-bills__new" type="primary" @click="goChat">
        <Icon icon="lucide:plus" />
        新建填报
      </Button>
    </header>

    <div class="fill-bills__filters">
      <button
        v-for="item in statusFilters"
        :key="item"
        type="button"
        :class="{ 'is-active': activeFilter === item }"
        @click="activeFilter = item"
      >
        {{ item }}
        <b v-if="item === '全部'">{{ bills.length }}</b>
        <b v-else>{{ bills.filter((bill) => bill.status === item).length }}</b>
      </button>
    </div>

    <div class="fill-bills__list">
      <article v-for="bill in filteredBills" :key="bill.id" class="fill-bill">
        <div class="fill-bill__main">
          <div class="fill-bill__title">
            <Icon icon="lucide:receipt-text" />
            <strong>{{ bill.id }}</strong>
            <Tag :color="statusColors[bill.status]" class="m-0">
              {{ bill.status }}
            </Tag>
          </div>
          <small>
            {{ bill.type }} · 发票 {{ bill.invoiceCount }} 张 · 费用明细
            {{ bill.itemCount }} 项 · 生成于 {{ bill.time }}
          </small>
          <small v-if="bill.reason" class="fill-bill__reason">
            <Icon icon="lucide:alert-triangle" />
            {{ bill.reason }}
          </small>
        </div>
        <div class="fill-bill__side">
          <strong>{{ bill.amount }}</strong>
          <Button size="small" @click="viewBill(bill)">查看详情</Button>
        </div>
      </article>

      <div v-if="filteredBills.length === 0" class="fill-bills__empty">
        <Icon icon="lucide:inbox" />
        该状态下暂无单据
      </div>
    </div>
  </div>
</template>

<style scoped>
.fill-bills {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 20px 24px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d4e3de;
  border-radius: 28px;
  box-shadow: 0 22px 52px rgb(18 57 45 / 8%);
}

.fill-bills__head {
  display: flex;
  gap: 14px;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px dashed #dbe6e2;
}

.fill-bills__head img {
  width: 46px;
  height: 46px;
  border-radius: 50%;
}

.fill-bills__head h2 {
  margin: 0;
  font-size: 18px;
  color: #102e29;
}

.fill-bills__head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #557067;
}

.fill-bills__new {
  margin-left: auto;
  background: #0b6e65;
  border-color: #0b6e65;
}

.fill-bills__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.fill-bills__filters button {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #557067;
  cursor: pointer;
  background: #f4faf7;
  border: 1px solid #cce0d9;
  border-radius: 999px;
}

.fill-bills__filters button.is-active {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.fill-bills__filters b {
  font-size: 10px;
  font-weight: 700;
}

.fill-bills__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fill-bill {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #fbfdfc;
  border: 1px solid #e1ece7;
  border-radius: 14px;
  transition: 0.18s ease;
}

.fill-bill:hover {
  background: #fff;
  border-color: #9cc9bd;
  box-shadow: 0 6px 16px rgb(11 110 101 / 8%);
}

.fill-bill__main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.fill-bill__title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.fill-bill__title svg {
  width: 15px;
  height: 15px;
  color: #0b806f;
}

.fill-bill__title strong {
  font-size: 13px;
  color: #102e29;
}

.fill-bill__main small {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  color: #81958e;
}

.fill-bill__reason {
  color: #b45309 !important;
}

.fill-bill__reason svg {
  width: 12px;
  height: 12px;
}

.fill-bill__side {
  display: flex;
  flex: none;
  gap: 12px;
  align-items: center;
}

.fill-bill__side strong {
  font-size: 14px;
  color: #0c4a3f;
}

.fill-bills__empty {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  font-size: 13px;
  color: #81958e;
}
</style>
