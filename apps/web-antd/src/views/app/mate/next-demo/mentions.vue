<script setup lang="ts">
import type { CSSProperties } from 'vue';
import type { TodoItem, TodoScope } from './todo-state';
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { Icon } from '@iconify/vue';
import { Button, DatePicker, Drawer, Empty, Input, Popconfirm, Select, message } from 'ant-design-vue';
import { completeTodo, ignoreTodo, replyTodo, todoItems, todoProjects, updateTodo } from './todo-state';

const scope = ref<TodoScope>('assigned');
const status = ref('pending');
const keyword = ref('');
const project = ref('all');
type TimeRange = 'all' | 'month' | 'week' | 'year';
const timeRange = ref<TimeRange>('all');
const open = ref(false);
const selectedId = ref('');
const reply = ref('');
const error = ref('');
const draft = reactive({ title: '', detail: '', assignee: '', projectId: undefined as string | undefined, endDate: undefined as string | undefined });
const selected = computed(() => todoItems.value.find((item) => item.id === selectedId.value));
const readonly = computed(() => selected.value?.bucket !== 'pending');
const scopeTabs = [{ value: 'assigned' as const, label: '我的待办' }, { value: 'created' as const, label: '我创建的待办' }];
const statuses = [{ value: 'pending', label: '待处理' }, { value: 'completed', label: '已完成' }, { value: 'all', label: '全部' }];
const timeRanges = [
  { value: 'all' as const, label: '全部', icon: 'lucide:inbox' },
  { value: 'week' as const, label: '本周', icon: 'lucide:calendar-days' },
  { value: 'month' as const, label: '本月', icon: 'lucide:calendar-range' },
  { value: 'year' as const, label: '本年', icon: 'lucide:calendar' },
];
const projectOptions = computed(() => [{ label: '全部项目（含无项目）', value: 'all' }, { label: '无项目关联', value: 'none' }, ...todoProjects.value]);
const members = computed(() => [...new Set(['王安康', '王天豪', '周小曼', '张三', '李四', '陈浩', '林晓', ...todoItems.value.map((item) => item.assignee)])].map((name) => ({ label: name, value: name })));

const demoToday = new Date(2026, 8, 8);
function getCreatedDate(value: string) {
  if (value.startsWith('今天') || value === '刚刚') return new Date(demoToday);
  if (value.startsWith('昨天')) {
    const date = new Date(demoToday);
    date.setDate(date.getDate() - 1);
    return date;
  }
  const fullDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (fullDate) return new Date(Number(fullDate[1]), Number(fullDate[2]) - 1, Number(fullDate[3]));
  const shortDate = value.match(/^(\d{2})-(\d{2})/);
  if (shortDate) return new Date(demoToday.getFullYear(), Number(shortDate[1]) - 1, Number(shortDate[2]));
  return undefined;
}
function isInTimeRange(item: TodoItem) {
  if (timeRange.value === 'all') return true;
  const createdDate = getCreatedDate(item.createdAt);
  if (!createdDate) return false;
  if (timeRange.value === 'year') return createdDate.getFullYear() === demoToday.getFullYear();
  if (timeRange.value === 'month') {
    return createdDate.getFullYear() === demoToday.getFullYear() && createdDate.getMonth() === demoToday.getMonth();
  }
  const weekStart = new Date(demoToday);
  weekStart.setDate(demoToday.getDate() - ((demoToday.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return createdDate >= weekStart && createdDate < weekEnd;
}
const items = computed(() => todoItems.value.filter((item) =>
  item.scope === scope.value &&
  (status.value === 'all' || (status.value === 'pending' ? item.bucket === 'pending' : item.bucket !== 'pending')) &&
  isInTimeRange(item) &&
  (project.value === 'all' || (project.value === 'none' ? !item.projectId : item.projectId === project.value)) &&
  [item.title, item.assignee, item.requester, item.detail].join(' ').toLowerCase().includes(keyword.value.trim().toLowerCase()),
));
function label(item: TodoItem) {
  return item.bucket === 'ignored' ? '已忽略' : item.bucket === 'completed' ? '已完成' : '待处理';
}
function showDetail(item: TodoItem) {
  selectedId.value = item.id;
  Object.assign(draft, { title: item.title, detail: item.detail, assignee: item.assignee, projectId: item.projectId, endDate: item.endDate });
  reply.value = '';
  error.value = '';
  open.value = true;
}
function save() {
  if (!selected.value || readonly.value) return;
  if (!draft.title.trim() || !draft.assignee) {
    error.value = '请填写标题并选择负责人';
    return;
  }
  const projectName = todoProjects.value.find((item) => item.value === draft.projectId)?.label;
  if (updateTodo(selected.value.id, { ...draft, projectName })) {
    error.value = '';
    message.success('待办已保存');
    open.value = false;
  }
}
const particles = ref<Array<{ id: number; style: CSSProperties }>>([]);
let animationTimer: ReturnType<typeof setTimeout> | undefined;
function finish(item: TodoItem, event?: Event) {
  if (item.bucket !== 'pending') return;
  completeTodo(item.id);
  if (selectedId.value === item.id) open.value = false;
  message.success('待办已完成');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = event?.currentTarget as HTMLElement | undefined;
  const bounds = target?.getBoundingClientRect();
  const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
  const y = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
  const colors = ['#35a789', '#e8b94e', '#779dea', '#cf84b5', '#73bfb8'];
  particles.value = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    style: {
      left: x + 'px', top: y + 'px', background: colors[i % colors.length],
      '--dx': Math.cos(i * 2.4) * (65 + i * 3) + 'px',
      '--dy': Math.sin(i * 2.4) * 100 - 60 + 'px',
      '--rotation': i * 41 + 'deg',
    } as CSSProperties,
  }));
  clearTimeout(animationTimer);
  animationTimer = setTimeout(() => { particles.value = []; }, 950);
}
onBeforeUnmount(() => clearTimeout(animationTimer));
function sendReply() {
  if (!selected.value || readonly.value || !reply.value.trim()) return;
  replyTodo(selected.value.id, reply.value.trim());
  reply.value = '';
  message.success('回复已记录，待办仍为待处理');
}
function ignore() {
  if (!selected.value || readonly.value) return;
  ignoreTodo(selected.value.id);
  open.value = false;
  message.success('已忽略，可在全部中查看');
}
</script>

<template>
  <section class="todos">
    <header class="page-title"><Icon icon="lucide:list-todo" /><h1>待办</h1></header>
    <nav class="scope-tabs" aria-label="待办归属">
      <button v-for="tab in scopeTabs" :key="tab.value" :class="{ active: scope === tab.value }" @click="scope = tab.value">{{ tab.label }}</button>
    </nav>
    <div class="todo-workspace">
      <aside class="filter-panel" aria-label="待办过滤">
        <div class="filter-heading"><Icon icon="lucide:list-filter" /><strong>筛选</strong></div>
        <section class="filter-group">
          <h2>时间范围</h2>
          <div class="time-filter">
            <button
              v-for="option in timeRanges"
              :key="option.value"
              :class="{ active: timeRange === option.value }"
              @click="timeRange = option.value"
            >
              <Icon :icon="option.icon" />
              <span>{{ option.label }}</span>
              <Icon v-if="timeRange === option.value" icon="lucide:check" class="selected-mark" />
            </button>
          </div>
        </section>
        <section class="filter-group project-group">
          <h2>项目</h2>
          <Select v-model:value="project" :options="projectOptions" aria-label="按项目过滤" class="project-filter" />
        </section>
      </aside>
      <section class="list-panel">
        <div class="filters">
          <div class="status-tabs" aria-label="待办状态">
            <button v-for="tab in statuses" :key="tab.value" :class="{ active: status === tab.value }" @click="status = tab.value">{{ tab.label }}</button>
          </div>
          <Input v-model:value="keyword" allow-clear placeholder="搜索标题、负责人、创建人" aria-label="搜索待办" class="search"><template #prefix><Icon icon="lucide:search" /></template></Input>
          <span class="count">{{ items.length }} 项</span>
        </div>
        <div class="list-scroll">
          <table class="todo-table">
            <thead><tr><th class="check-cell"></th><th>标题</th><th class="person-cell">负责人</th><th class="person-cell">创建人</th><th class="date-cell">结束日期</th><th class="action-cell"></th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="item.id" :class="{ closed: item.bucket !== 'pending' }">
                <td class="check-cell"><input type="checkbox" :checked="item.bucket === 'completed'" :disabled="item.bucket !== 'pending'" :aria-label="'完成待办：' + item.title" @change="finish(item, $event)" /></td>
                <td><span class="row-title">{{ item.title }}</span><span v-if="item.bucket !== 'pending'" class="state-label">{{ label(item) }}</span></td>
                <td>{{ item.assignee }}</td><td>{{ item.requester }}</td><td>{{ item.endDate || '—' }}</td>
                <td><button class="detail-link" @click="showDetail(item)">详情<Icon icon="lucide:chevron-right" /></button></td>
              </tr>
            </tbody>
          </table>
          <Empty v-if="!items.length" description="暂无符合条件的待办" class="empty" />
        </div>
      </section>
    </div>
    <Drawer v-model:open="open" title="待办详情" :width="600" root-class-name="simple-todo-drawer">
      <template v-if="selected">
        <div class="detail-status"><span>{{ label(selected) }}</span><small v-if="readonly">已关闭，仅可查看</small></div>
        <div class="edit-card">
          <label for="todo-title">标题 <span v-if="!readonly">*</span></label>
          <Input id="todo-title" v-model:value="draft.title" :disabled="readonly" :maxlength="160" />
          <label for="todo-note">备注</label>
          <Input.TextArea id="todo-note" v-model:value="draft.detail" :rows="6" :disabled="readonly" placeholder="补充事项背景、要求或处理安排" />
          <div class="field-grid">
            <div><label>关联项目</label><Select v-model:value="draft.projectId" :options="todoProjects" allow-clear :disabled="readonly" placeholder="可不关联项目" aria-label="关联项目" /></div>
            <div><label>负责人 <span v-if="!readonly">*</span></label><Select v-model:value="draft.assignee" :options="members" show-search :disabled="readonly" aria-label="负责人" /></div>
            <div><label for="todo-creator">创建人</label><Input id="todo-creator" :value="selected.requester" disabled /></div>
            <div><label>结束日期</label><DatePicker v-model:value="draft.endDate" value-format="YYYY-MM-DD" :disabled="readonly" allow-clear placeholder="可不设置" aria-label="结束日期" /></div>
          </div>
          <p v-if="error" role="alert" class="error">{{ error }}</p>
        </div>
        <section class="reply-card">
          <h2>回复与记录</h2>
          <div v-for="(record, index) in selected.timeline" :key="index" class="record"><div><b>{{ record.title }}</b><time>{{ record.time }}</time></div><p>{{ record.detail }}</p></div>
          <template v-if="!readonly">
            <label for="todo-reply">回复</label>
            <Input.TextArea id="todo-reply" v-model:value="reply" :rows="3" placeholder="好的，我已经安排好了，下周三处理。" />
            <div class="reply-footer"><small>回复不会自动完成待办</small><Button :disabled="!reply.trim()" @click="sendReply">发送回复</Button></div>
          </template>
        </section>
      </template>
      <template #footer>
        <div class="drawer-footer">
          <template v-if="selected && !readonly">
            <Popconfirm title="忽略此待办？" ok-text="忽略" cancel-text="取消" @confirm="ignore"><Button>忽略待办</Button></Popconfirm>
            <Button @click="finish(selected, $event)">完成待办</Button>
            <Button class="save-button" @click="save">保存修改</Button>
          </template>
          <Button v-else @click="open = false">关闭</Button>
        </div>
      </template>
    </Drawer>
    <Teleport to="body"><div class="confetti" aria-hidden="true"><i v-for="particle in particles" :key="particle.id" :style="particle.style"></i></div></Teleport>
  </section>
</template>

<style scoped>
.todos { display:flex; flex-direction:column; width:100%; height:100%; min-height:0; color:#244c41; background:#e9f0ed; border:1px solid #d2dfda; border-radius:10px; overflow:hidden; font-size:13px; }
.page-title { display:flex; align-items:center; gap:9px; padding:13px 18px; background:white; }
.page-title svg { font-size:20px; color:#197560; }.page-title h1 { margin:0; font-size:19px; font-weight:750; }
button { cursor:pointer; }button:focus-visible { outline:2px solid #25836c; outline-offset:2px; }
.scope-tabs { display:flex; gap:18px; padding:0 18px; background:white; border-bottom:1px solid #d4e0db; }
.scope-tabs button { height:44px; padding:0 4px; color:#62766e; background:none; border:0; border-bottom:2px solid transparent; }
.scope-tabs button.active { color:#166c56; border-bottom-color:#238268; font-weight:700; }
.todo-workspace { display:grid; grid-template-columns:220px minmax(0,1fr); flex:1; min-height:0; }
.filter-panel { padding:16px 14px; background:#f7faf8; border-right:1px solid #d2dfda; overflow:auto; }
.filter-heading { display:flex; align-items:center; gap:8px; min-height:30px; padding:0 4px; color:#294f43; }
.filter-heading svg { font-size:16px; color:#287d67; }.filter-heading strong { font-size:14px; }
.filter-group { margin-top:18px; }.filter-group h2 { margin:0 0 8px 5px; color:#6b7d75; font-size:12px; font-weight:600; }
.time-filter { display:flex; flex-direction:column; gap:4px; }
.time-filter button { display:grid; grid-template-columns:20px 1fr 16px; align-items:center; width:100%; min-height:38px; padding:7px 9px; color:#4d675d; background:transparent; border:1px solid transparent; border-radius:7px; text-align:left; font-size:13px; }
.time-filter button:hover { color:#176e58; background:#edf4f0; }.time-filter button.active { color:#146b54; background:#e1f0e9; border-color:#c0ddd0; font-weight:700; }
.time-filter button svg { font-size:15px; }.time-filter .selected-mark { justify-self:end; color:#28836b; font-size:14px; }
.project-group { padding-top:16px; border-top:1px solid #dce5e1; }.project-filter { width:100%; }
.list-panel { display:flex; flex-direction:column; min-width:0; min-height:0; }
.filters { display:flex; align-items:center; gap:12px; flex-wrap:wrap; padding:12px 16px; }
.status-tabs { display:flex; padding:3px; border:1px solid #d0ddd7; border-radius:7px; background:#dfe9e4; }
.status-tabs button { padding:6px 14px; font-size:12px; border:0; border-radius:5px; background:none; color:#536b61; }
.status-tabs button.active { background:white; color:#166c56; font-weight:700; }.search { width:280px; }.count { margin-left:auto; font-size:12px; color:#61796f; }
.list-scroll { flex:1; min-height:0; overflow:auto; padding:0 16px 16px; }
.todo-table { width:100%; min-width:710px; border-collapse:separate; border-spacing:0 6px; table-layout:fixed; }
th { text-align:left; font-size:12px; color:#60796e; font-weight:500; padding:4px 12px; }
td { padding:15px 12px; background:white; border-top:1px solid #d9e3de; border-bottom:1px solid #d9e3de; overflow-wrap:anywhere; }
td:first-child { border-left:1px solid #d9e3de; border-radius:8px 0 0 8px; }td:last-child { border-right:1px solid #d9e3de; border-radius:0 8px 8px 0; }
.check-cell { width:42px; text-align:center; }.person-cell { width:110px; }.date-cell { width:120px; }.action-cell { width:78px; }
input[type=checkbox] { width:17px; height:17px; accent-color:#23886c; cursor:pointer; vertical-align:middle; }input:disabled { cursor:default; }
.row-title { font-weight:550; }.closed .row-title { color:#687c72; }.state-label { margin-left:8px; padding:2px 6px; color:#5c7367; background:#edf3ef; font-size:12px; border-radius:4px; }
.detail-link { display:flex; gap:3px; align-items:center; padding:5px 0; color:#197560; background:none; border:0; font-size:12px; }.empty { margin:70px 0; }
.detail-status { display:flex; gap:10px; align-items:center; margin-bottom:14px; }.detail-status span { padding:3px 9px; background:#dcefe5; color:#1a7256; border-radius:5px; }.detail-status small { font-size:12px; color:#667d72; }
.edit-card,.reply-card { padding:18px; margin-bottom:14px; background:white; border:1px solid #d6e2da; border-radius:9px; }
label { display:block; margin:14px 0 7px; font-size:13px; color:#36594c; }label:first-child { margin-top:0; }label span { color:#b65844; }
.field-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px; }.field-grid :deep(.ant-select),.field-grid :deep(.ant-picker) { width:100%; }
.reply-card h2 { margin:0 0 14px; font-size:14px; font-weight:700; }.record { border-bottom:1px solid #edf1ee; padding:10px 0; }.record div { display:flex; justify-content:space-between; gap:10px; font-size:12px; }.record time { color:#6f8077; }.record p { margin:5px 0; font-size:13px; line-height:1.6; white-space:pre-wrap; overflow-wrap:anywhere; }
.reply-footer,.drawer-footer { display:flex; justify-content:flex-end; align-items:center; gap:8px; margin-top:12px; }.reply-footer small { margin-right:auto; font-size:12px; color:#62796e; }.drawer-footer { margin:0; }.save-button { color:#166b55!important; background:#dff1e8!important; border-color:#a5cdbb!important; }.error { color:#b5483a; font-size:12px; }
:global(.simple-todo-drawer .ant-drawer-content),:global(.simple-todo-drawer .ant-drawer-header),:global(.simple-todo-drawer .ant-drawer-footer) { background:#edf3ef; color:#244c41; }
:global(.simple-todo-drawer .ant-drawer-body) { padding:18px; }:global(.simple-todo-drawer .ant-input-disabled),:global(.simple-todo-drawer .ant-select-disabled .ant-select-selector),:global(.simple-todo-drawer .ant-picker-disabled) { color:#53675c!important; background:#f4f7f5!important; }
.confetti { position:fixed; inset:0; pointer-events:none; z-index:9999; overflow:hidden; }.confetti i { position:absolute; width:7px; height:10px; border-radius:2px; animation:celebrate 900ms ease-out both; }
@keyframes celebrate { from { transform:translate(0,0) rotate(0); opacity:1; } 65% { opacity:1; } to { transform:translate(var(--dx),calc(var(--dy) + 95px)) rotate(var(--rotation)); opacity:0; } }
@media(prefers-reduced-motion:reduce) { .confetti { display:none; } }
@media(max-width:900px) {
  .todo-workspace { grid-template-columns:1fr; grid-template-rows:auto minmax(0,1fr); }
  .filter-panel { padding:12px 16px; border-right:0; border-bottom:1px solid #d2dfda; overflow:visible; }
  .filter-heading { display:none; }.filter-group { margin:0; }.filter-group h2 { margin-left:0; }
  .time-filter { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
  .project-group { margin-top:12px; padding-top:12px; }.project-filter { max-width:320px; }
}
@media(max-width:600px) {
  .time-filter { grid-template-columns:repeat(2,1fr); }.search,.project-filter { width:100%; max-width:none; }.count { width:100%; margin-left:0; }
  .field-grid { grid-template-columns:1fr; }.drawer-footer { flex-wrap:wrap; }
}
</style>
