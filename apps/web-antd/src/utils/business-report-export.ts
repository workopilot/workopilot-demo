import type {
  BusinessReportProfile,
  BusinessReportEdits,
} from '#/types/business-report';
import type { ReportDraft } from '#/types/new-report';
import { businessQuantities } from '#/api/mock-business-report-config';

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  );
const paragraph = (text: string) =>
  `<p>${escape(text).replace(/\n/g, '<br>')}</p>`;
export function exportBusinessReport(
  profile: BusinessReportProfile,
  edits: BusinessReportEdits,
  report: ReportDraft,
  format: 'pdf' | 'word',
  audience: 'internal' | 'customer',
) {
  const external = profile.kind === 'customer' && audience === 'customer';
  const approved =
    report.customerApproval?.status === 'approved' &&
    report.customerApproval.version === report.version;
  const heading = `${profile.name} · ${report.start} — ${report.end}`;
  const accent =
    report.presentation === 'executive'
      ? '#eaf0fa'
      : report.presentation === 'warm'
        ? '#fbf3e5'
        : '#edf5f0';
  const status =
    profile.kind === 'customer'
      ? approved
        ? '审批通过'
        : '草稿 / 未审批，仅供核对'
      : report.status === 'submitted'
        ? '已提交'
        : '草稿，仅供核对';
  const blocks = profile.blocks
    .map((block) => {
      const internalNote =
        !external && edits.notes[block.id]
          ? `<h3>内部补充</h3>${paragraph(edits.notes[block.id]!)}`
          : '';
      const customerNote = edits.customerNotes?.[block.id]
        ? `<h3>${external ? '补充说明' : '对客补充'}</h3>${paragraph(edits.customerNotes[block.id]!)}`
        : '';
      return `<section><h2>${escape(block.title)}</h2>${paragraph(block.summary)}${block.items.map((item) => `<article><b>${escape(item.title)}</b>${paragraph(item.detail)}${!external ? `<small>${escape(item.evidence)}</small>` : ''}</article>`).join('')}${internalNote}${customerNote}</section>`;
    })
    .join('');
  const files = Object.entries(report.attachments ?? {})
    .filter(([key]) => key.startsWith(`business-${profile.id}-`))
    .flatMap(([, items]) => items);
  const html = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>${escape(heading)}</title><style>
  body{font-family:'Microsoft YaHei',sans-serif;color:#263e34;max-width:900px;margin:32px auto;padding:20px;font-size:14px;line-height:1.8}h1{font-size:26px}h2{font-size:19px}header,section{padding:20px;margin-bottom:18px;border:1px solid #dce7e0;border-radius:12px}header{background:#edf5f0}.metrics{display:flex;flex-wrap:wrap;gap:12px}.metric{padding:14px;background:#f3f7f5;min-width:145px;flex:1}.metric b{display:block;font-size:24px}small{color:#61766a}article{margin:12px 0;padding:12px;background:#f6f8f7}footer{color:#6e7e74}@page{size:A4;margin:15mm}@media print{body{margin:0;padding:0;max-width:none}section,article{break-inside:avoid}}</style></head><body>
  <header style="background:${accent}"><small>${external ? '客户报告' : '内部审查报告'} · ${status}</small><h1>${escape(profile.name)}</h1><p>${escape(report.start)} — ${escape(report.end)} · ${escape(profile.phase)}</p>${paragraph(profile.conclusion)}${!external && edits.conclusion ? paragraph(edits.conclusion) : ''}</header>
  <div class="metrics">${businessQuantities(
    profile,
    report.business?.objectId ?? '',
  )
    .map(
      (item) =>
        `<div class="metric">${escape(item.label)}<b>${escape(item.value)}</b><small>${escape(item.hint)}</small></div>`,
    )
    .join('')}</div>
  ${profile.milestones.length ? `<section><h2>交付计划与实际</h2>${profile.milestones.map((item) => paragraph(`${item.title}：计划 ${item.planned}；实际 / 预测 ${item.actual}；${item.status}`)).join('')}</section>` : ''}
  ${profile.service ? `<section><h2>服务质量</h2>${profile.metrics.map((item) => paragraph(`${item.label}：${item.value}（${item.hint}）`)).join('')}${profile.service.categories.map((item) => paragraph(`${item.label}：${item.count} 个`)).join('')}</section>` : ''}
  ${blocks}
  ${files.length ? `<section><h2>成果附件清单</h2>${files.map((file) => paragraph(file.name)).join('')}<small>文件本体请随报告另行发送。</small></section>` : ''}
  <footer>${external ? '经内部审批后由客户经理分享。' : '内部说明仅供授权人员查看。'} · V${report.version}</footer></body></html>`;
  if (format === 'word') {
    const url = URL.createObjectURL(
      new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${heading}.doc`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    return;
  }
  const frame = document.createElement('iframe');
  frame.title = '报告 PDF 打印';
  frame.style.cssText =
    'position:fixed;left:-10000px;width:1000px;height:800px;border:0';
  frame.onload = () => {
    window.setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    }, 200);
  };
  frame.srcdoc = html;
  document.body.append(frame);
  window.setTimeout(() => frame.remove(), 120000);
}
