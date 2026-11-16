import type { AuditRule, SandboxResult } from '#/types/audit';

export async function executeMockRule(
  rule: AuditRule,
  inputJson: any,
  files: any[],
): Promise<SandboxResult> {
  // Simulate AI Processing time
  const processingTime = Math.floor(Math.random() * 1500) + 500; // 500-2000ms

  // Basic Context Extraction
  const context = {
    item: inputJson,
    proofs: files.map((f) => f.name),
    policy: '《差旅管理办法》V2024',
    now: new Date().toISOString(),
  };

  const toolLogs: string[] = [];
  let passed = true;
  let reason = '符合各项审核标准';
  let confidence: 'High' | 'Low' | 'Medium' = 'High';

  // 1. Simulate Tool Calls
  if (rule.tools?.includes('exchange_rate') && inputJson.currency !== 'CNY') {
    toolLogs.push(`Call exchange_rate(${inputJson.currency}) -> 0.14`);
  }

  if (rule.tools?.includes('web_search')) {
    toolLogs.push(`Web Search: "${inputJson.merchant || '商家'}" -> 正常营业`);
  }

  // 2. Logic Simulation based on Rule Name/Content (Heuristics)

  const ruleName = rule.name || '';
  const prompt = rule.prompt || '';

  // Case A: Accommodation Limit (住宿限额)
  if (ruleName.includes('住宿') && ruleName.includes('限额')) {
    const city = inputJson.city || 'Unknown';
    const amount = Number(inputJson.amount || 0);
    const limit = city === 'Beijing' || city === 'Shanghai' ? 1500 : 800;

    toolLogs.push(`Check Policy Limit(${city}) -> ${limit}`);

    if (amount > limit) {
      passed = false;
      reason = `超出${city}地区住宿费标准 (限额 ${limit}, 实报 ${amount})`;
      confidence = 'High';
    }
  }

  // Case B: Invoice Required (发票检查)
  else if (ruleName.includes('发票') || prompt.includes('proofs')) {
    if (files.length === 0) {
      passed = false;
      reason = '未检测到任何附件，请上传发票';
      confidence = 'High';
    } else {
      const hasInvoice = files.some(
        (f) =>
          f.name.toLowerCase().includes('invoice') || f.name.includes('发票'),
      );
      if (!hasInvoice) {
        passed = false;
        reason = '附件中似乎不包含发票文件';
        confidence = 'Medium';
      }
    }
  }

  // Case C: Time Check (时间检查)
  else if (ruleName.includes('时间') || ruleName.includes('日期')) {
    const date = new Date(inputJson.date);
    const now = new Date();
    // Mock logic: if date is weekend
    const day = date.getDay();
    if (day === 0 || day === 6) {
      passed = false; // Just a mock simulation
      reason = '非工作日发生的费用 (周六/周日)';
      confidence = 'Medium';
    }
  }

  // Case D: General Fallback (Check prompt keywords)
  else if (
    (prompt.includes('taxi') || prompt.includes('交通')) &&
    inputJson.amount > 500
  ) {
    passed = false;
    reason = '市内交通费异常偏高 (>500)';
    confidence = 'Low'; // AI is not sure
  }

  return {
    passed,
    reason,
    duration: `${(processingTime / 1000).toFixed(1)}s`,
    tokens: Math.floor(Math.random() * 500) + 100,
    confidence,
    toolLogs,
    contextSnapshot: context,
  };
}
