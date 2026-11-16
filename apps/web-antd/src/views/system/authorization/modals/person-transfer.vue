<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useUserStore } from '@vben/stores';
import { Checkbox, Modal, message } from 'ant-design-vue';
import {
  accessApps,
  afterTransfer,
  groups,
  memberships,
  sources,
  transferLog,
  userName,
} from '#/api/mock-authorization-groups';

import PersonSearch from '../components/person-search.vue';

const props = defineProps<{ open: boolean; from: string }>();
const emit = defineEmits<{ close: [] }>();
const to = ref('');
const selected = ref<string[]>([]);
const userStore = useUserStore();
const eligible = computed(() =>
  groups.value.filter((g) => g.enabled && g.users.includes(props.from)),
);
watch(
  () => props.open,
  (open) => {
    if (open) {
      to.value = '';
      selected.value = eligible.value.map((g) => g.id);
    }
  },
);
const next = computed(() =>
  afterTransfer(props.from, to.value ?? '', selected.value),
);
const additions = computed(() =>
  accessApps(to.value ?? '', next.value).filter(
    (a) => !accessApps(to.value ?? '').includes(a),
  ),
);
const retained = computed(() =>
  memberships(props.from, next.value).filter((g) => g.apps.length),
);
const lost = computed(() =>
  accessApps(props.from).filter(
    (a) => !accessApps(props.from, next.value).includes(a),
  ),
);
function submit() {
  if (!to.value || to.value === props.from || !selected.value.length) return;
  groups.value = next.value;
  transferLog.value.unshift({
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    operator: userStore.userInfo?.realName || '演示管理员',
    from: props.from,
    to: to.value,
    names: eligibleNames(),
  });
  message.success('人员替换已完成');
  emit('close');
}
function eligibleNames() {
  return groups.value
    .filter((g) => selected.value.includes(g.id))
    .map((g) => g.name);
}
</script>
<template>
  <Modal
    :open="open"
    title="替换人员"
    ok-text="确认替换"
    cancel-text="取消"
    :width="560"
    :ok-button-props="{ disabled: !to || !selected.length }"
    @cancel="emit('close')"
    @ok="submit"
  >
    <div class="auth-form">
      <section>
        <h3>接替 {{ userName(from) }} 的人员</h3>
        <PersonSearch
          v-if="open"
          v-model="to"
          :exclude-id="from"
          label="查询接替人姓名或工号"
        />
        <p v-if="to">接替人：{{ userName(to) }} · {{ to }}</p>
      </section>
      <section>
        <h3>交接直接成员资格</h3>
        <Checkbox.Group
          v-model:value="selected"
          :options="eligible.map((g) => ({ label: g.name, value: g.id }))"
        />
        <p>部门授权随组织关系生效。</p>
      </section>
      <section v-if="to && selected.length" class="preview" aria-live="polite">
        <h3>权限变化预览</h3>
        <p>
          <b>{{ userName(to) }} 新增应用</b>　{{
            additions.join('、') || '无新增应用'
          }}
        </p>
        <p>
          <b>{{ userName(from) }} 失去访问</b>　{{ lost.join('、') || '无' }}
        </p>
        <p>
          <b>{{ userName(from) }} 保留访问</b>　{{
            accessApps(from, next).join('、') || '无'
          }}
        </p>
        <div v-for="g in retained" :key="g.id" class="reason">
          {{ g.name }}（{{ sources(g, from).join('、') }}）·
          {{ g.apps.join('、') }}
        </div>
      </section>
    </div>
  </Modal>
</template>
