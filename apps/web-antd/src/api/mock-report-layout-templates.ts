import { reactive } from 'vue';
import type { ReportKind } from '#/types/zhiji';
export interface ReportLayoutTemplate {
  htmlFile?: { name: string; content: string };
  id: string;
  name: string;
  description: string;
  kinds: ReportKind[];
  presentation: 'classic' | 'executive' | 'warm';
  prompt: string;
  enabled: boolean;
  version: number;
}
const basePrompt = `你是报告 HTML 排版设计师。输入是已经保存并确认的报告正文、统计数字、人工补充、报告类型和起止日期。
只根据输入生成完整的 HTML 报告，不重新采集数据，不修改数字、负责人、完成状态或风险结论，不编造图表和成果。
输出 HTML 与局部作用域 CSS，不输出 Markdown 代码围栏；不包含脚本、事件处理器、外部资源、表单或其他应用导航。
内容先概述，再本期完成、下期计划、风险与协调；项目报告保留阶段与里程碑、任务及负责人，客户报告保留客户概述、运维时长、工单和任务统计。
用统计卡片、清晰的标题、轻量图标和有数据依据的进度条呈现。没有风险则不显示风险区；原始明细默认折叠。
保留所有对外可见的人工补充及授权附件链接，内部说明不能进入对客 HTML；源链接不能扩大访问权限。
兼容窄屏与 A4 PDF 打印，确保字体清晰、颜色对比足够、表格可读，避免卡片内容被分页截断。`;
export const reportLayoutTemplates = reactive<ReportLayoutTemplate[]>([
  {
    id: 'layout-classic',
    name: '清新简报',
    description: '浅绿色容器、白色卡片，适合日常汇报。',
    kinds: ['personal', 'project', 'customer', 'productline'],
    presentation: 'classic',
    enabled: true,
    version: 1,
    prompt: `${basePrompt}\n视觉方向：清新绿色、白色内容卡片、留白充分；统计数字突出，风险使用浅琥珀色。`,
  },
  {
    id: 'layout-executive',
    name: '管理汇报',
    description: '商务蓝与紧凑层级，突出进展和管理关注点。',
    kinds: ['personal', 'project', 'customer', 'productline'],
    presentation: 'executive',
    enabled: true,
    version: 1,
    prompt: `${basePrompt}\n视觉方向：商务蓝，概述优先，量化指标与阶段进度清晰；风险和需要协调的事项优先可见。`,
  },
  {
    id: 'layout-warm',
    name: '客户成果',
    description: '暖金配色，强调服务成果与后续安排。',
    kinds: ['personal', 'project', 'customer', 'productline'],
    presentation: 'warm',
    enabled: true,
    version: 1,
    prompt: `${basePrompt}\n视觉方向：暖金色与米白背景，使用成果卡片和服务完成率；优先展示客户价值和下一周期安排。`,
  },
]);
