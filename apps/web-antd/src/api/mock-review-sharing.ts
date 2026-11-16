import { reactive } from 'vue';
import { createMockResponse, mockDelay } from './mock-data';
import { reviewReports, reviewKey } from './mock-new-review';
import { zhijiPeople } from './mock-zhiji';

export const reviewShareRecords = reactive<Record<string, string[]>>({});
export async function shareReviewReport(
  id: string,
  version: number,
  personIds: string[],
) {
  const entry = reviewReports.value.find((item) => item.id === id);
  if (
    !entry ||
    entry.report.status !== 'submitted' ||
    entry.report.version !== version
  )
    throw new Error('报告不可分享或版本已变化，请重新打开');
  const ids = [...new Set(personIds)];
  const people = zhijiPeople.filter((person) => ids.includes(person.value));
  if (!people.length || people.length !== ids.length)
    throw new Error('请选择有效的分享人员');
  await mockDelay(300);
  const current = reviewReports.value.find((item) => item.id === id);
  if (
    !current ||
    current.report !== entry.report ||
    current.report.status !== 'submitted' ||
    current.report.version !== version
  )
    throw new Error('报告版本已变化，请重新打开后分享');
  const existing = new Set([
    ...entry.report.recipients,
    ...entry.report.reviewers,
    entry.author,
  ]);
  const added = people.filter((person) => !existing.has(person.label));
  entry.report.recipients = [
    ...new Set([
      ...entry.report.recipients,
      ...added.map((person) => person.label),
    ]),
  ];
  const key = reviewKey(entry);
  reviewShareRecords[key] = [
    ...new Set([...(reviewShareRecords[key] ?? []), ...ids]),
  ];
  if (added.length)
    entry.report.history.unshift(
      `V${version} 已增加只读分享人员：${added.map((person) => person.label).join('、')}（演示）。`,
    );
  return createMockResponse({ added: added.length });
}
