export const presentationOptions = [
  { value: 'classic', label: '清新绿 · 标准报告' },
  { value: 'executive', label: '商务蓝 · 管理汇报' },
  { value: 'warm', label: '暖金色 · 成果展示' },
];
export function printReportElement(element: HTMLElement, title: string) {
  const frame = document.createElement('iframe');
  frame.title = '导出报告 PDF';
  frame.style.cssText =
    'position:fixed;left:-10000px;width:1100px;height:800px;border:0';
  document.body.append(frame);
  const target = frame.contentDocument;
  if (!target) {
    frame.remove();
    return;
  }
  target.open();
  target.write(
    '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"></head><body></body></html>',
  );
  target.close();
  target.title = title;
  document
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach((style) => target.head.append(style.cloneNode(true)));
  const printStyle = target.createElement('style');
  printStyle.textContent =
    'body{background:white!important;color:#294035;margin:0;padding:0;--ink:#213d35;--muted:#5f7269;--line:#dfe7e2;--green:#247d69}article{height:auto!important;overflow:visible!important}a{color:inherit}section{break-inside:avoid}@page{size:A4;margin:12mm}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
  target.head.append(printStyle);
  target.body.append(element.cloneNode(true));
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  }, 500);
  window.setTimeout(() => frame.remove(), 120000);
}
