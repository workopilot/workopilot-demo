import type { MateChatSession } from '#/types/mate';
import { reactive } from 'vue';
import { createMockResponse, mockDelay } from './mock-data';
import { reportSchemes } from './mock-new-reports';

export const reportChatSessions = reactive<MateChatSession[]>([
  {
    id: 'report-welcome',
    employeeId: 'new-report-assistant',
    title: '整理我的工作汇报',
    relativeTime: '今天',
    unread: 0,
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        time: '今天',
        content:
          '你好，韩立。我是新汇报助理，可以帮你整理工作成果、查看报告草稿，以及梳理风险和下一步计划。你想先处理哪份报告？',
      },
    ],
  },
  {
    id: 'report-customer',
    employeeId: 'new-report-assistant',
    title: '客户月报如何准备',
    relativeTime: '昨天',
    unread: 0,
    messages: [
      {
        id: 'customer-q',
        role: 'user',
        time: '昨天',
        content: '客户月报需要准备哪些内容？',
      },
      {
        id: 'customer-a',
        role: 'assistant',
        time: '昨天',
        content:
          '建议围绕工单处理、上门巡检、客户满意度和后续服务计划整理。请补充可量化成果及成果物链接，再到客户月报中核对自动归集的内容。',
      },
    ],
  },
]);

export async function replyReportChat(text: string) {
  await mockDelay(450);
  const schemeId = /客户/.test(text)
    ? 'customer'
    : /项目/.test(text)
      ? 'project'
      : /日报/.test(text)
        ? 'daily'
        : 'weekly';
  const scheme = reportSchemes.find(
    (item) => item.id === schemeId && item.enabled,
  );
  let content =
    '我已在这段对话中记录你的描述。整理汇报时，建议补充完成结果、量化数据、成果物链接和需要协调的问题。你可以进入报告的人工补充区核对并保存；这条聊天消息不会自动写入报告。';
  if (/定时|每周|自动生成/.test(text))
    content =
      '你可以在汇报页面的“生成计划”中，用“每周六 09:00”这样的表达设置生成时间，并确认保存。定时生成只产生草稿，提报仍由你确认。当前聊天不会直接修改计划。';
  else if (/下周|任务|计划/.test(text))
    content =
      '建议把下一步计划写清楚：要做什么、预期成果和完成时间。在报告中保存计划后，可以检查已有任务：已覆盖则关联，部分覆盖则补充子任务，没有覆盖再建议创建。转入项目素材和任务操作都需要你分别确认。';
  else if (/周报|日报|月报|报告|汇报/.test(text) && scheme)
    content = `已找到“${scheme.title}”的演示草稿。统计范围：${scheme.start} 至 ${scheme.end}。\n\n${scheme.summary}\n\n请进入报告核对来源、补充成果与计划，再确认提报。`;
  return createMockResponse({ content, schemeId: scheme?.id });
}
