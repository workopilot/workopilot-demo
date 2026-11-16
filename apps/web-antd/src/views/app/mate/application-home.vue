<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';

const props = defineProps<{ applicationId: string }>();
const router = useRouter();
const applications: Record<string, { name: string; business: string; positioning: string; meaning: string; icon: string; entry?: string; action?: string }> = {
  zhiji: { name: '知记', business: '汇报', positioning: '记下每一步，看见自己的成长', meaning: '谐音「知己」。记录工作中的每一步，也在回顾与梳理中认识自己，让经历成为积累，让成长清晰可见。', icon: 'lucide:book-open-check', entry: '/app/mate/apps/zhiji/schemes', action: '管理汇报方案' },
  'zhiying-ticket': { name: '知应', business: '运维', positioning: '事事有回应，问题有着落', meaning: '知晓问题，及时回应。让每一次请求都被看见，让响应、处理与反馈连接起来，守护日常工作的顺畅运行。', icon: 'lucide:headset', entry: '/app/mate/apps/smart-ticket/devices', action: '进入运维管理' },
  zhixing: { name: '知行', business: '项目', positioning: '让计划有行动，让行动有结果', meaning: '取意「知行合一」。将目标化为计划，将计划付诸行动，在协作与推进中把每一份想法变成可交付的结果。', icon: 'lucide:flag' },
  zhiying: { name: '知赢', business: '销售', positioning: '懂客户，把握机会，赢得信任', meaning: '因理解而赢得信任，因合作而实现共赢。理解客户需求，把握每一次机会，让客户关系沉淀为长期价值。', icon: 'lucide:handshake', entry: '/app/mate/employee/new-sales-assistant/sales/chat', action: '进入销售助理' },
  zhiyue: { name: '知约', business: '合同', positioning: '读懂每份约定，守好每个承诺', meaning: '「约」是契约，也是约定。读懂条款，记住承诺，跟进履约，让每一份合同中的责任与约定都有着落。', icon: 'lucide:file-check-2' },
};
const application = computed(() => applications[props.applicationId]!);
</script>

<template>
  <section class="application-home" :aria-label="`${application.name}首页`">
    <div class="application-home__content">
      <div class="application-home__identity">
        <span class="application-home__icon"><Icon :icon="application.icon" /></span>
        <h1>{{ application.name }}</h1>
      </div>
      <p class="application-home__positioning">{{ application.business }}：{{ application.positioning }}</p>
      <div class="application-home__meaning">
        <h2>名字的寓意</h2>
        <p>{{ application.meaning }}</p>
      </div>
      <button v-if="application.entry" class="application-home__action" type="button" @click="router.push(application.entry!)">
        {{ application.action }}<Icon icon="lucide:arrow-right" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.application-home {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 100%;
  padding: clamp(24px, 6vw, 88px);
  color: #203c38;
  background: #fff;
}
.application-home__content { width: 100%; max-width: 760px; margin: auto; }
.application-home__identity { display: flex; gap: 20px; align-items: center; }
.application-home__icon { display: grid; width: 68px; height: 68px; place-items: center; font-size: 32px; color: #147d70; background: #eef6f3; border-radius: 16px; flex-shrink: 0; }
.application-home h1 { margin: 0; font-size: clamp(32px, 4vw, 48px); font-weight: 650; line-height: 1.3; }
.application-home__positioning { margin: 32px 0 0; font-size: clamp(19px, 2vw, 26px); line-height: 1.7; text-wrap: balance; }
.application-home__meaning { padding-top: 32px; margin-top: 40px; border-top: 1px solid #dfe8e5; }
.application-home h2 { margin: 0 0 12px; font-size: 15px; font-weight: 600; }
.application-home__meaning p { max-width: 65ch; margin: 0; font-size: 16px; line-height: 1.9; color: #526b65; }
.application-home__action { display: inline-flex; gap: 12px; align-items: center; min-height: 44px; padding: 10px 18px; margin-top: 36px; color: #fff; cursor: pointer; background: #147d70; border: 0; border-radius: 8px; }
.application-home__action:hover { background: #10675d; }
.application-home__action:focus-visible { outline: 2px solid #147d70; outline-offset: 4px; }
.application-home ::selection { color: #203c38; background: #d5ebe3; }
@media (max-width: 640px) { .application-home { align-items: flex-start; } .application-home__meaning { margin-top: 28px; } }
</style>
