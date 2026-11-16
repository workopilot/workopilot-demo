/**
 * 开发者申请原型 API(前端 Mock)
 */

import type {
  DeveloperApplication,
  DeveloperApplicationListResult,
  DeveloperApplicationQueryParams,
  ProcessApplicationPayload,
} from '#/types/developer-application';

import { createMockResponse, mockDelay } from './mock-data';

// Mock 种子数据(内存中持久化,刷新页面重置)
const mockApplications: DeveloperApplication[] = [
  {
    id: 'DA-001',
    applicantName: '张伟',
    applyTime: '2026-06-10T09:24:00.000Z',
    phone: '13812345601',
    email: 'zhangwei@foxmail.com',
    techDirection: '前端开发',
    purpose:
      '希望接入智能填报专员的原型能力,验证在内部 OA 表单场景下的自动识别与填写效果,用于评估后续业务落地的可行性。',
    githubUrl: 'https://github.com/zhangwei',
    createdAt: '2026-06-10T09:24:00.000Z',
    updatedAt: '2026-06-10T09:24:00.000Z',
    status: 'pending',
  },
  {
    id: 'DA-002',
    applicantName: '李娜',
    applyTime: '2026-06-08T14:05:00.000Z',
    phone: '13812345602',
    email: 'lina.dev@gmail.com',
    techDirection: '后端开发',
    purpose:
      '计划基于 API 构建一个企业内部的文档摘要服务,需要申请调用大模型接口进行原型验证与技术调研。',
    githubUrl: 'https://github.com/lina-dev',
    createdAt: '2026-06-08T14:05:00.000Z',
    updatedAt: '2026-06-08T14:05:00.000Z',
    status: 'pending',
  },
  {
    id: 'DA-003',
    applicantName: '王强',
    applyTime: '2026-06-05T10:48:00.000Z',
    phone: '13912345603',
    email: 'wangqiang@company.com',
    techDirection: '全栈开发',
    purpose:
      '团队正在研发智能合同审核 Demo,申请获取原型接入权限,用于完成合同条款比对与风险点提示的演示。',
    gitlabUrl: 'https://gitlab.com/wangqiang',
    createdAt: '2026-06-05T10:48:00.000Z',
    updatedAt: '2026-06-05T10:48:00.000Z',
    status: 'pending',
  },
  {
    id: 'DA-004',
    applicantName: '赵敏',
    applyTime: '2026-05-28T16:12:00.000Z',
    phone: '13712345604',
    email: 'zhaomin@data.io',
    techDirection: '数据分析',
    purpose:
      '希望试用数据洞察助手,评估通过自然语言对话完成指标查询与可视化分析的准确度与响应速度。',
    createdAt: '2026-05-28T16:12:00.000Z',
    updatedAt: '2026-05-28T16:12:00.000Z',
    status: 'pending',
  },
  {
    id: 'DA-005',
    applicantName: '陈杰',
    applyTime: '2026-05-20T11:30:00.000Z',
    phone: '13612345605',
    email: 'chenjie.ml@ai.com',
    techDirection: '机器学习',
    purpose:
      '研究方向为多模态文档理解,申请原型权限用于测试附件智能分类的识别能力,作为论文实验的对照基线。',
    githubUrl: 'https://github.com/chenjie-ml',
    createdAt: '2026-05-20T11:30:00.000Z',
    updatedAt: '2026-05-20T11:30:00.000Z',
    status: 'pending',
  },
  {
    id: 'DA-006',
    applicantName: '刘洋',
    applyTime: '2026-05-15T08:50:00.000Z',
    phone: '13512345606',
    email: 'liuyang@web.dev',
    techDirection: '前端开发',
    purpose:
      '计划在内部管理后台集成 PPT 助手组件,申请原型权限进行前端联调与交互体验评估。',
    githubUrl: 'https://github.com/liuyang',
    status: 'processed',
    processResult: 'approved',
    processDetail:
      '<h3>审核通过</h3><p>申请材料完整、用途清晰,符合原型接入规范。</p><p><strong>已开通权限:</strong></p><ul><li>调用额度:50 万 Tokens / 月</li><li>有效期:30 天</li><li>支持接口:智能填报、PPT 助手</li></ul><p>请于 3 个工作日内查收开通邮件,如有疑问请联系平台支持。</p>',
    processedAt: '2026-05-16T09:00:00.000Z',
    processedBy: '运营管理员',
    createdAt: '2026-05-15T08:50:00.000Z',
    updatedAt: '2026-05-16T09:00:00.000Z',
  },
  {
    id: 'DA-007',
    applicantName: '周婷',
    applyTime: '2026-05-12T13:20:00.000Z',
    phone: '13412345607',
    email: 'zhouting@app.cn',
    techDirection: '移动开发',
    purpose: '想在移动端 App 中接入对话式数据查询能力,申请原型试用。',
    status: 'processed',
    processResult: 'rejected',
    processDetail:
      '<h3>暂未通过</h3><p>申请目的描述较为简略,缺少具体的使用场景与预期指标。</p><p><strong>建议补充以下信息后重新申请:</strong></p><ol><li>目标用户与使用频次</li><li>期望的准确率与响应时间</li><li>是否已有可参考的竞品或原型</li></ol>',
    processedAt: '2026-05-13T10:15:00.000Z',
    processedBy: '运营管理员',
    createdAt: '2026-05-12T13:20:00.000Z',
    updatedAt: '2026-05-13T10:15:00.000Z',
  },
  {
    id: 'DA-008',
    applicantName: '吴磊',
    applyTime: '2026-05-06T09:40:00.000Z',
    phone: '13312345608',
    email: 'wulei@backend.org',
    techDirection: '后端开发',
    purpose:
      '为内部知识库系统增加自动摘要与标签生成能力,申请原型接口用于后端服务集成验证。',
    gitlabUrl: 'https://gitlab.com/wulei',
    status: 'processed',
    processResult: 'approved',
    processDetail:
      '<h3>审核通过</h3><p>用途合理、技术方案可行,予以通过。</p><p><strong>注意事项:</strong></p><ul><li>请遵守接口调用频率限制(60 次/分钟)</li><li>生产环境上线前需单独申请正式密钥</li></ul>',
    processedAt: '2026-05-07T14:30:00.000Z',
    processedBy: '运营管理员',
    createdAt: '2026-05-06T09:40:00.000Z',
    updatedAt: '2026-05-07T14:30:00.000Z',
  },
  {
    id: 'DA-009',
    applicantName: '孙芳',
    applyTime: '2026-04-28T15:05:00.000Z',
    phone: '13212345609',
    email: 'sunfang@fullstack.cn',
    techDirection: '全栈开发',
    purpose: '搭建一个企业内部智能助手 Demo,需要前后端联调,申请原型权限。',
    status: 'processed',
    processResult: 'approved',
    processDetail:
      '<h3>审核通过</h3><p>申请信息完整,符合接入条件。</p><p>已开通标准原型额度,有效期 30 天。请留意 Token 用量监控面板。</p>',
    processedAt: '2026-04-29T11:00:00.000Z',
    processedBy: '运营管理员',
    createdAt: '2026-04-28T15:05:00.000Z',
    updatedAt: '2026-04-29T11:00:00.000Z',
  },
  {
    id: 'DA-010',
    applicantName: '郑浩',
    applyTime: '2026-04-22T10:18:00.000Z',
    phone: '13112345610',
    email: 'zhenghao@devops.io',
    techDirection: 'DevOps',
    purpose: '希望接入平台进行 CI/CD 流水线的智能化改造评估。',
    githubUrl: 'https://github.com/zhenghao',
    status: 'processed',
    processResult: 'rejected',
    processDetail:
      '<h3>暂未通过</h3><p>当前原型暂不支持 DevOps 流水线场景,且申请未说明具体的改造目标。</p><p>建议关注平台后续版本的能力更新公告,待相关能力开放后再行申请。</p>',
    processedAt: '2026-04-23T09:30:00.000Z',
    processedBy: '运营管理员',
    createdAt: '2026-04-22T10:18:00.000Z',
    updatedAt: '2026-04-23T09:30:00.000Z',
  },
];

/**
 * 获取开发者申请列表(支持状态、日期范围筛选 + 分页)
 */
export async function getDeveloperApplicationsApi(
  params: DeveloperApplicationQueryParams,
) {
  await mockDelay();

  const { status = 'pending', startDate, endDate, page, pageSize } = params;

  let list = [...mockApplications];

  // 状态筛选
  if (status && status !== 'all') {
    list = list.filter((item) => item.status === status);
  }

  // 日期范围筛选(按申请日期的日历日)
  if (startDate) {
    list = list.filter((item) => item.applyTime.slice(0, 10) >= startDate);
  }
  if (endDate) {
    list = list.filter((item) => item.applyTime.slice(0, 10) <= endDate);
  }

  // 按申请时间倒序
  list.sort((a, b) => (a.applyTime < b.applyTime ? 1 : -1));

  const total = list.length;
  const start = (page - 1) * pageSize;
  const items = list.slice(start, start + pageSize);

  return createMockResponse<DeveloperApplicationListResult>({
    items,
    total,
  });
}

/**
 * 获取单条申请详情
 */
export async function getDeveloperApplicationApi(id: string) {
  await mockDelay();
  const item = mockApplications.find((a) => a.id === id);
  if (!item) {
    throw new Error('申请记录不存在');
  }
  return createMockResponse(item);
}

/**
 * 处理开发者申请(更新为已处理)
 */
export async function processDeveloperApplicationApi(
  id: string,
  payload: ProcessApplicationPayload,
) {
  await mockDelay();
  const index = mockApplications.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('申请记录不存在');
  }
  const now = new Date().toISOString();
  mockApplications[index] = {
    ...mockApplications[index],
    status: 'processed',
    processResult: payload.processResult,
    processDetail: payload.processDetail,
    processedAt: now,
    processedBy: '运营管理员',
    updatedAt: now,
  };
  return createMockResponse(mockApplications[index]);
}
