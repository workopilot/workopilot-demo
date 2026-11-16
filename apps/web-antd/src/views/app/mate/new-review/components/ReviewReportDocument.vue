<script setup lang="ts">
import type { ReportDraft } from '#/types/new-report';
import { computed } from 'vue';
import { materialSections } from '#/api/mock-report-materials';
import {
  businessProfileForPeriod,
  defaultBusinessEdits,
} from '#/api/mock-business-reports';
import {
  defaultReportObject,
  scopedBusinessProfile,
} from '#/api/mock-report-objects';
import BusinessReportPreview from '../../new-report/components/BusinessReportPreview.vue';
import ReportPreview from '../../new-report/components/ReportPreview.vue';
import ProjectReportPreview from '../../new-report/components/ProjectReportPreview.vue';
const props = defineProps<{ report: ReportDraft }>();
const business = computed(() =>
  ['project', 'customer'].includes(props.report.schemeId),
);
const scenario = computed(
  () =>
    props.report.business?.scenario ??
    (props.report.schemeId === 'project' ? 'project' : 'operations'),
);
const profile = computed(
  () =>
    props.report.business?.snapshots?.[scenario.value] ??
    businessProfileForPeriod(
      scopedBusinessProfile(
        props.report.business?.objectId ??
          defaultReportObject(props.report.schemeId),
        scenario.value,
      ),
      props.report.start,
      props.report.end,
    ),
);
const edits = computed(
  () =>
    props.report.business?.drafts[scenario.value] ??
    defaultBusinessEdits(profile.value),
);
const sections = computed(
  () => props.report.generatedSections ?? materialSections(props.report),
);
</script>
<template>
  <ProjectReportPreview
    v-if="report.schemeId === 'project'"
    :profile="profile"
    :edits="edits"
    :report="report"
  />
  <BusinessReportPreview
    v-else-if="business"
    :profile="profile"
    :edits="edits"
    :report="report"
  /><ReportPreview v-else :report="report" :sections="sections" />
</template>
