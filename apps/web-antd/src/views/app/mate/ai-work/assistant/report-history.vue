<!-- 周报历史：评分趋势 + 承诺追踪 + 历史周报列表 -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Progress, Tag } from 'ant-design-vue';

import { aiWorkReports, aiWorkScoreTrend } from '#/api/mock-data-ai-work';

import AiWorkPage from '../components/ai-work-page.vue';

const router = useRouter();

const reports = computed(() => aiWorkReports);

const avgScore = computed(() => {
  const scored = aiWorkScoreTrend;
  if (scored.length === 0) return '0.0';
  return (scored.reduce((sum, s) => sum + s.score, 0) / scored.length).toFixed(
    1,
  );
});

const maxScore = computed(() =>
  Math.max(...aiWorkScoreTrend.map((s) => s.score)),
);

// 承诺兑现追踪（第31周下周计划 vs 第32周完成）
const commitmentTracking = computed(() => [
  {
    description: '完成客户 B 接口联调',
    week31Plan: '承诺本周完成',
    current: '延期 1 周',
    fulfilled: false,
  },
  {
    description: '完成报价模块接口开发',
    week31Plan: '承诺本周完成',
    current: '已完成，进入联调',
    fulfilled: true,
  },
  {
    description: '华达需求确认',
    week31Plan: '承诺本周完成',
    current: '已完成',
    fulfilled: true,
  },
]);

function formatScore(score?: number) {
  return score ? score.toFixed(1) : '—';
}

function openReport(id: string) {
  router.push(`/app/mate/employee/weekly-assistant/report/${id}`);
}
</script>

<template>
  <AiWorkPage
    eyebrow="HISTORY"
    title="周报历史"
    description="张三 · 近期周报、评分趋势与承诺兑现追踪"
  >
    <div class="history">
      <!-- 顶部：评分趋势 + 承诺追踪 -->
      <div class="history-top">
        <section class="trend-card">
          <h3>
            <Icon icon="lucide:trending-up" />
            评分趋势
          </h3>
          <div class="trend-summary">
            <div class="trend-summary__item">
              <strong>{{ avgScore }}</strong>
              <span>近 4 周平均</span>
            </div>
            <div class="trend-summary__item">
              <strong>{{ maxScore.toFixed(1) }}</strong>
              <span>最高分</span>
            </div>
          </div>
          <div class="trend-chart">
            <div
              v-for="(point, idx) in aiWorkScoreTrend"
              :key="idx"
              class="trend-bar"
            >
              <div
                class="trend-bar__fill"
                :style="{ height: `${(point.score / 5) * 100}%` }"
              >
                <span class="trend-bar__score">
                  {{ point.score.toFixed(1) }}
                </span>
              </div>
              <span class="trend-bar__label">{{ point.weekLabel }}</span>
            </div>
          </div>
        </section>

        <section class="commit-card">
          <h3>
            <Icon icon="lucide:flag" />
            承诺兑现追踪
            <small>第 31 周计划 → 第 32 周完成情况</small>
          </h3>
          <div
            v-for="(commit, idx) in commitmentTracking"
            :key="idx"
            class="commit-row"
          >
            <Icon
              :icon="
                commit.fulfilled ? 'lucide:circle-check' : 'lucide:circle-x'
              "
              :class="
                commit.fulfilled
                  ? 'commit-row__icon--done'
                  : 'commit-row__icon--fail'
              "
            />
            <div class="commit-row__body">
              <div class="commit-row__desc">{{ commit.description }}</div>
              <div class="commit-row__meta">
                <span>{{ commit.week31Plan }}</span>
                <span class="commit-row__arrow">→</span>
                <span
                  :class="{ 'commit-row__current--fail': !commit.fulfilled }"
                >
                  {{ commit.current }}
                </span>
              </div>
            </div>
            <Tag :color="commit.fulfilled ? 'green' : 'red'" size="small">
              {{ commit.fulfilled ? '已兑现' : '未兑现' }}
            </Tag>
          </div>
        </section>
      </div>

      <!-- 历史周报列表 -->
      <section class="report-list-card">
        <h3>
          <Icon icon="lucide:history" />
          历史周报
        </h3>
        <div class="report-list">
          <article
            v-for="report in reports"
            :key="report.id"
            class="report-card"
            :class="{ 'report-card--draft': report.status === 'DRAFT' }"
          >
            <div class="report-card__head">
              <div>
                <span class="report-card__week">{{ report.weekLabel }}</span>
                <span class="report-card__range">{{ report.dateRange }}</span>
              </div>
              <div class="report-card__badges">
                <Tag
                  :color="
                    report.status === 'APPROVED'
                      ? 'green'
                      : report.status === 'DRAFT'
                        ? 'blue'
                        : 'default'
                  "
                  size="small"
                >
                  {{
                    report.status === 'APPROVED'
                      ? '已通过'
                      : report.status === 'DRAFT'
                        ? '草稿'
                        : report.status
                  }}
                </Tag>
                <Tag v-if="report.review" color="gold" size="small">
                  ⭐ {{ formatScore(report.review.score) }}
                </Tag>
              </div>
            </div>

            <p class="report-card__summary">
              {{
                report.items
                  .slice(0, 3)
                  .map((i) => i.title)
                  .join(' · ')
              }}
            </p>

            <div class="report-card__completeness">
              <span>完整度 {{ report.completeness }}%</span>
              <Progress
                :percent="report.completeness"
                :show-info="false"
                size="small"
                stroke-color="#0b806f"
              />
            </div>

            <div v-if="report.review" class="report-card__review">
              <Icon icon="lucide:user-check" />
              <span>
                {{ report.review.reviewerName }}：{{ report.review.comment }}
              </span>
            </div>

            <div class="report-card__footer">
              <span class="report-card__entities">
                <Icon icon="lucide:network" />
                {{
                  (report.entities.projects?.length ?? 0) +
                  (report.entities.customers?.length ?? 0)
                }}
                个实体
              </span>
              <Button
                size="small"
                type="primary"
                @click="openReport(report.id)"
              >
                {{ report.status === 'DRAFT' ? '继续编辑' : '查看周报详情' }}
                <Icon icon="lucide:arrow-right" />
              </Button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </AiWorkPage>
</template>

<style scoped>
@media (max-width: 1100px) {
  .history-top {
    grid-template-columns: 1fr;
  }
}

.history {
  display: grid;
  gap: 14px;
}

.history-top {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  gap: 14px;
}

.trend-card,
.commit-card,
.report-list-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.trend-card h3,
.commit-card h3,
.report-list-card h3 {
  display: flex;
  gap: 7px;
  align-items: center;
  margin: 0 0 14px;
  font-size: 15px;
  color: #183e35;
}

.trend-card h3 svg,
.commit-card h3 svg,
.report-list-card h3 svg {
  width: 17px;
  height: 17px;
  color: #0b806f;
}

.commit-card h3 small {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: #8b9b96;
}

/* 趋势 */
.trend-summary {
  display: flex;
  gap: 20px;
  padding-bottom: 14px;
  margin-bottom: 16px;
  border-bottom: 1px solid #edf2f0;
}

.trend-summary__item {
  display: flex;
  flex-direction: column;
}

.trend-summary__item strong {
  font-size: 26px;
  color: #0b806f;
}

.trend-summary__item span {
  font-size: 11px;
  color: #6c8179;
}

.trend-chart {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  height: 130px;
  padding: 8px 4px 0;
}

.trend-bar {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.trend-bar__fill {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  min-height: 28px;
  padding-top: 4px;
  background: linear-gradient(180deg, #0b806f 0%, #12a37f 100%);
  border-radius: 8px 8px 0 0;
}

.trend-bar__score {
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.trend-bar__label {
  font-size: 10px;
  color: #6c8179;
}

/* 承诺追踪 */
.commit-row {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #edf2f0;
}

.commit-row:first-of-type {
  border-top: 0;
}

.commit-row__icon--done,
.commit-row__icon--fail {
  flex: none;
  width: 18px;
  height: 18px;
}

.commit-row__icon--done {
  color: #0b7668;
}

.commit-row__icon--fail {
  color: #dc2626;
}

.commit-row__body {
  flex: 1;
}

.commit-row__desc {
  font-size: 13px;
  font-weight: 500;
  color: #102e29;
}

.commit-row__meta {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 2px;
  font-size: 11px;
  color: #6c8179;
}

.commit-row__arrow {
  color: #8b9b96;
}

.commit-row__current--fail {
  color: #dc2626;
}

/* 周报列表 */
.report-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.report-card {
  padding: 14px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 14px;
  transition: border-color 0.15s;
}

.report-card:hover {
  border-color: #0b806f;
}

.report-card--draft {
  background: #f8fbfa;
  border-color: #b8d4cc;
}

.report-card__head {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.report-card__week {
  font-size: 15px;
  font-weight: 600;
  color: #102e29;
}

.report-card__range {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  color: #8b9b96;
}

.report-card__badges {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.report-card__summary {
  display: -webkit-box;
  margin: 0 0 10px;
  overflow: hidden;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: 12px;
  line-height: 1.6;
  color: #596f68;
  -webkit-box-orient: vertical;
}

.report-card__completeness {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}

.report-card__completeness span {
  font-size: 10px;
  color: #6c8179;
}

.report-card__review {
  display: flex;
  gap: 6px;
  padding: 8px;
  margin-bottom: 10px;
  font-size: 11px;
  line-height: 1.6;
  color: #596f68;
  background: #f8fbfa;
  border-radius: 8px;
}

.report-card__review svg {
  flex: none;
  width: 14px;
  height: 14px;
  color: #2563a8;
}

.report-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid #edf2f0;
}

.report-card__entities {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #6c8179;
}

.report-card__entities svg {
  width: 13px;
  height: 13px;
}
</style>
