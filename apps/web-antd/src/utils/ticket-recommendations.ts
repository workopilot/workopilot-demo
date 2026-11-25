import type { WorkOrder } from '#/types/ticket';

import { ticketStatusLabel } from '#/api/mock-data-ticket';

import { recommendationEmployee } from './employee-recommendations';

export function ticketRecommendations(order: WorkOrder) {
  const acceptance = order.status === 'pending-acceptance';
  const completed = ['cancelled', 'closed', 'completed'].includes(order.status);
  let purpose = '工单进展沟通';
  let reason = '需要把当前处理进展同步给客户，可由会议助理准备沟通安排。';
  if (completed) {
    purpose = '服务复盘';
    reason = '工单已结束，可以与客户复盘处理过程和后续改进。';
  }
  if (acceptance) {
    purpose = '验收沟通';
    reason = '处理结果已提交，需要与客户确认验收安排。';
  }
  return {
    context: {
      currentEmployeeId: 'ticket-assistant',
      source: 'ticket-detail',
      businessId: order.id,
      title: `工单详情 · ${order.code}`,
      query: { ticketCode: order.code },
      summary: `工单：${order.code}（${order.title}）\n客户：${order.customer ?? '待补充'}\n设备：${order.device ?? '待补充'}\n服务地点：${order.customerLocation ?? '待补充'}\n处理人：${order.assignee ?? '待指派'}\n当前状态：${ticketStatusLabel[order.status]}`,
    },
    employees: [
      recommendationEmployee('meeting-assistant', reason, [
        {
          id: 'customer-meeting',
          title: `为${order.customer || '当前客户'}准备${purpose}会议`,
          icon: 'lucide:calendar-plus',
          prompt: `请围绕工单 ${order.code} 为${order.customer || '当前客户'}准备${purpose}会议草稿，核对参会人和可用时间，待我确认后再预约。`,
        },
      ]),
      ...(order.status === 'processing'
        ? [
            {
              ...recommendationEmployee(
                'fill-assistant',
                '当前工单正在处理中；若排查后需要现场服务，可交给填报助理准备上门申请。',
                [
                  {
                    id: 'onsite',
                    title: `为工单 ${order.code} 创建上门申请草稿`,
                    icon: 'lucide:file-plus-2',
                    prompt: `请帮我为工单 ${order.code}（${order.title}）创建上门申请单草稿，沿用客户、设备和服务地点，补齐上门时间与人员后由我确认。`,
                    query: { action: 'onsite' },
                  },
                ],
              ),
              path: '/app/mate/employee/fill-assistant/ticket-chat',
              role: '上门申请 · 业务单据填报',
            },
          ]
        : []),
    ],
  };
}
