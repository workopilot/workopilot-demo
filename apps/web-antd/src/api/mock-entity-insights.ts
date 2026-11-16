import dayjs from 'dayjs';
import { reportPeriodRange } from '#/utils/report-period';
import type { ReportObject } from './mock-report-objects';

interface EntitySample {
  aliases: string[];
  counts: number[];
  earlierMentions: number;
  people: number;
}
const samples: Record<string, EntitySample> = {
  engine: {
    aliases: ['汇报引擎', '统一汇报引擎', '喔壳汇报', '新汇报助理'],
    counts: [8, 14, 18, 26, 31],
    earlierMentions: 76,
    people: 14,
  },
  edb: {
    aliases: ['曼伦 EDB', 'EDB 项目', '曼伦EDB项目', 'EDB'],
    counts: [4, 9, 7, 15, 21],
    earlierMentions: 43,
    people: 9,
  },
  huatian: {
    aliases: ['华天', '华天接口项目', '华天系统对接'],
    counts: [15, 22, 18, 10, 6],
    earlierMentions: 92,
    people: 11,
  },
  huachen: {
    aliases: ['华辰', '华辰医药客户', '华辰运维'],
    counts: [10, 12, 19, 17, 24],
    earlierMentions: 124,
    people: 18,
  },
  jinmao: {
    aliases: ['金茂府客户', '金茂府运维', '金茂打印机'],
    counts: [3, 8, 12, 7, 9],
    earlierMentions: 35,
    people: 7,
  },
  tower: {
    aliases: ['铁塔客户', '铁塔运维', '铁塔数据同步'],
    counts: [5, 7, 13, 22, 19],
    earlierMentions: 58,
    people: 12,
  },
};
const mentionPeople = [
  '小刚',
  '王安康',
  '杨总',
  '张三',
  '李明',
  '陈静',
  '刘洋',
  '赵敏',
  '周宁',
  '吴昊',
  '徐静',
  '孙悦',
  '马超',
  '朱琳',
  '胡杰',
  '林晓',
  '何涛',
  '郭颖',
  '高远',
  '罗欣',
];
/** Demo counts represent one canonical entity; matching aliases are deduplicated. */
export function entityInsights(entity: ReportObject) {
  const sample = samples[entity.id] ?? {
    aliases: [entity.name],
    counts: [0, 0, 0, 0, 0],
    earlierMentions: 0,
    people: 0,
  };
  const currentWeek = reportPeriodRange(
    dayjs().format('YYYY-MM-DD'),
    'week',
  ).start;
  const weeks = sample.counts.map((count, index) => {
    const range = reportPeriodRange(
      dayjs(currentWeek)
        .subtract(4 - index, 'week')
        .format('YYYY-MM-DD'),
      'week',
    );
    return { ...range, label: dayjs(range.start).format('MM/DD'), count };
  });
  const totalMentions =
    sample.earlierMentions +
    sample.counts.reduce((sum, count) => sum + count, 0);
  const weights = (sample.people * (sample.people + 1)) / 2;
  const nameOffset = Math.max(0, Object.keys(samples).indexOf(entity.id)) * 3;
  const people = Array.from({ length: sample.people }, (_, index) => ({
    id: `${entity.id}-person-${index}`,
    name: mentionPeople[(index + nameOffset) % mentionPeople.length]!,
    count:
      1 +
      Math.floor(
        ((totalMentions - sample.people) * (sample.people - index)) / weights,
      ),
  }));
  const remainder =
    totalMentions - people.reduce((sum, person) => sum + person.count, 0);
  people.forEach((person, index) => {
    if (index < remainder) person.count++;
  });
  const personMentions = people
    .sort((a, b) => b.count - a.count)
    .map((person, index) => ({ ...person, rank: index + 1 }));
  return {
    aliases: [...new Set(sample.aliases)].filter(
      (alias) => alias !== entity.name,
    ),
    totalMentions,
    totalPeople: personMentions.length,
    personMentions,
    recentMentions: sample.counts.reduce((sum, count) => sum + count, 0),
    weeks,
  };
}
