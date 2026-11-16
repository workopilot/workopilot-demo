import type { AiWorkDemoState, AiWorkReportStatus } from '#/types/ai-work';

import { computed, reactive, watch } from 'vue';

import { defineStore } from 'pinia';

import { initialAiWorkDemoState } from '#/api/mock-data-ai-work';

const STORAGE_KEY = 'mate-ai-work-demo-v1';

function cloneInitialState(): AiWorkDemoState {
  return structuredClone(initialAiWorkDemoState);
}

function loadState(): AiWorkDemoState {
  if (typeof window === 'undefined') return cloneInitialState();
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    return saved
      ? { ...cloneInitialState(), ...(JSON.parse(saved) as AiWorkDemoState) }
      : cloneInitialState();
  } catch {
    return cloneInitialState();
  }
}

export const useAiWorkDemoStore = defineStore('mate-ai-work-demo', () => {
  const state = reactive<AiWorkDemoState>(loadState());

  const reportStatusLabel = computed(() => {
    const labels: Record<AiWorkReportStatus, string> = {
      APPROVED: '已通过',
      ARCHIVED: '已归档',
      DRAFT: '草稿',
      RETURNED: '已退回',
      SUBMITTED: '已提交',
    };
    return labels[state.reportStatus];
  });
  const pendingReviewCount = computed(() =>
    state.reportStatus === 'SUBMITTED' ? 10 : 9,
  );
  const attentionCount = computed(() => (state.focusMarked ? 5 : 4));

  watch(
    state,
    (value) => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      }
    },
    { deep: true },
  );

  function generateDraft() {
    state.draftGenerated = true;
    state.reportStatus = 'DRAFT';
    state.completeness = Math.max(state.completeness, 82);
    state.scene = Math.max(state.scene, 2);
  }

  function addMissingWork() {
    state.missingWorkAdded = true;
    state.completeness = Math.max(state.completeness, 82);
    state.scene = Math.max(state.scene, 3);
  }

  function explainDelay(dueDate = '下周三') {
    state.delayExplained = true;
    state.delayDueDate = dueDate;
    state.completeness = 93;
    state.huadaStatus = 'rising';
    state.scene = Math.max(state.scene, 4);
  }

  function submitReport() {
    state.reportStatus = 'SUBMITTED';
    state.scene = Math.max(state.scene, 5);
  }

  function approveReport(markFocus = false) {
    state.reviewDecision = 'approved';
    state.reportStatus = 'APPROVED';
    state.focusMarked = markFocus || state.focusMarked;
    state.huadaStatus = state.focusMarked ? 'rising' : 'watch';
    state.scene = Math.max(state.scene, 7);
  }

  function returnReport(reason: string) {
    state.reviewDecision = 'returned';
    state.returnReason = reason;
    state.reportStatus = 'RETURNED';
    state.scene = Math.max(state.scene, 6);
  }

  function markFocus() {
    state.focusMarked = true;
    state.huadaStatus = 'rising';
    state.scene = Math.max(state.scene, 7);
  }

  function setScene(scene: number) {
    state.scene = Math.min(8, Math.max(1, scene));
  }

  function resetDemo() {
    Object.assign(state, cloneInitialState());
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  return {
    approveReport,
    attentionCount,
    addMissingWork,
    explainDelay,
    generateDraft,
    markFocus,
    pendingReviewCount,
    reportStatusLabel,
    resetDemo,
    returnReport,
    setScene,
    state,
    submitReport,
  };
});
