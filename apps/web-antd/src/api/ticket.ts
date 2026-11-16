import type {
  Asset,
  AssetCategory,
  AssetFieldDef,
  AssignmentPolicy,
  CheckInRecord,
  ConditionRule,
  DispatchRule,
  DocumentParseResult,
  KnowledgeArticle,
  PlatformActionEvent,
  SlaAiSuggestion,
  SlaConfig,
  SlaEmailTemplate,
  SlaPolicy,
  SlaTimeoutRule,
  StatusFlowAiSuggestion,
  TicketAction,
  TicketCategory,
  TicketDevice,
  TicketFieldType,
  TicketOverviewStats,
  TicketRole,
  TicketSchema,
  WorkOrder,
} from '#/types/ticket';

import {
  cloneAssignmentPolicies,
  cloneSlaPolicies,
  cloneTicketActions,
  cloneTicketScenarios,
  cloneTicketSchemas,
  CURRENT_USER,
  mockAssetCategories,
  mockAssets,
  mockAssignmentAiSuggestions,
  mockAssignmentPolicies,
  mockDevices,
  mockDispatchRules,
  mockDocumentParseResults,
  mockFieldAiSuggestions,
  mockKnowledgeArticles,
  mockPlatformActionEvents,
  mockPositions,
  mockRoles,
  mockSlaAiSuggestions,
  mockSlaConfigs,
  mockSlaEmailTemplates,
  mockSlaPolicies,
  mockStaffs,
  mockStatusFlowAiSuggestions,
  mockTicketActions,
  mockTicketDelay,
  mockTicketOverview,
  mockTicketScenarios,
  mockTicketSchemas,
  mockWorkOrders,
} from './mock-data-ticket';

const response = <T>(data: T) => ({ code: 0, data, message: 'success' });

export async function getWorkOrdersApi() {
  await mockTicketDelay();
  return response(mockWorkOrders);
}

export async function getDevicesApi() {
  await mockTicketDelay();
  return response(mockDevices);
}

// ==================== 资产管理 ====================

/** 获取资产分类列表（含字段定义与生命周期状态） */
export async function getAssetCategoriesApi() {
  await mockTicketDelay();
  return response(mockAssetCategories);
}

/** 获取资产实例列表（可按分类 id 过滤；不传则返回全部） */
export async function getAssetsApi(categoryId?: string) {
  await mockTicketDelay();
  const list = categoryId
    ? mockAssets.filter((a) => a.categoryId === categoryId)
    : mockAssets;
  return response(list);
}

/** 新增资产实例 */
export async function createAssetApi(
  data: Pick<Asset, 'code' | 'extAttributes' | 'name' | 'status'> & {
    categoryId: string;
  },
) {
  await mockTicketDelay(260);
  const now = new Date().toISOString();
  const created: Asset = {
    id: `a-${Date.now()}`,
    code: data.code,
    name: data.name,
    categoryId: data.categoryId,
    status: data.status,
    extAttributes: data.extAttributes,
    createdAt: now,
    updatedAt: now,
  };
  mockAssets.unshift(created);
  return response(created);
}

/** 更新资产实例 */
export async function updateAssetApi(
  id: string,
  data: Partial<Pick<Asset, 'code' | 'extAttributes' | 'name' | 'status'>>,
) {
  await mockTicketDelay(260);
  const target = mockAssets.find((a) => a.id === id);
  if (target) {
    if (data.code !== undefined) target.code = data.code;
    if (data.name !== undefined) target.name = data.name;
    if (data.status !== undefined) target.status = data.status;
    if (data.extAttributes !== undefined)
      target.extAttributes = data.extAttributes;
    target.updatedAt = new Date().toISOString();
  }
  return response(target);
}

/** 删除资产实例 */
export async function deleteAssetApi(id: string) {
  await mockTicketDelay(200);
  const idx = mockAssets.findIndex((a) => a.id === id);
  if (idx !== -1) mockAssets.splice(idx, 1);
  return response(undefined);
}

/** 保存资产分类配置（字段定义 / 生命周期 / 名称 / 描述） */
export async function saveAssetCategoryApi(
  id: string,
  data: Partial<
    Pick<
      AssetCategory,
      'description' | 'fieldDefs' | 'lifecycleStates' | 'name'
    >
  >,
) {
  await mockTicketDelay(260);
  const target = mockAssetCategories.find((c) => c.id === id);
  if (target) {
    if (data.name) target.name = data.name;
    if (data.description !== undefined) target.description = data.description;
    if (data.fieldDefs) target.fieldDefs = data.fieldDefs;
    if (data.lifecycleStates) target.lifecycleStates = data.lifecycleStates;
  }
  return response(target);
}

/** 新增资产分类（非内置） */
export async function createAssetCategoryApi(
  data: Partial<Pick<AssetCategory, 'description'>> &
    Pick<AssetCategory, 'name'>,
) {
  await mockTicketDelay(260);
  const created: AssetCategory = {
    id: `cat-${Date.now()}`,
    name: data.name,
    description: data.description ?? '',
    fieldDefs: [],
    lifecycleStates: ['normal'],
    builtin: false,
  };
  mockAssetCategories.push(created);
  return response(created);
}

/** 删除资产分类（仅非内置；分类下有资产时拒绝） */
export async function deleteAssetCategoryApi(id: string) {
  await mockTicketDelay(200);
  const target = mockAssetCategories.find((c) => c.id === id);
  if (!target) return response(undefined);
  if (target.builtin) {
    throw new Error('内置分类不可删除');
  }
  if (mockAssets.some((a) => a.categoryId === id)) {
    throw new Error('分类下存在资产，无法删除');
  }
  const idx = mockAssetCategories.findIndex((c) => c.id === id);
  if (idx !== -1) mockAssetCategories.splice(idx, 1);
  return response(undefined);
}

export async function getDispatchRulesApi() {
  await mockTicketDelay();
  return response(mockDispatchRules);
}

export async function getSlaConfigsApi() {
  await mockTicketDelay();
  return response(mockSlaConfigs);
}

export async function getKnowledgeArticlesApi() {
  await mockTicketDelay();
  return response(mockKnowledgeArticles);
}

export async function getTicketOverviewApi() {
  await mockTicketDelay();
  return response(mockTicketOverview);
}

/** 获取售后制度文件解析结果列表 */
export async function getDocumentParseResultsApi() {
  await mockTicketDelay();
  return response(mockDocumentParseResults);
}

/** 派单：将待派单工单指派给指定工程师 */
export async function dispatchWorkOrderApi(
  workOrderId: string,
  engineerId: string,
  engineerName: string,
) {
  await mockTicketDelay(260);
  const order = mockWorkOrders.find((item) => item.id === workOrderId);
  if (order) {
    order.status = 'dispatched';
    order.assignee = engineerName;
    order.assigneeId = engineerId;
    order.timeline?.push({
      id: `tl-${Date.now()}`,
      action: 'dispatched',
      time: '刚刚',
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `已派单给 ${engineerName}`,
    });
  }
  return response(order);
}

/** 转派：将已派单/处理中工单重新指派（转派后 SLA 重新计时） */
export async function transferWorkOrderApi(
  workOrderId: string,
  engineerId: string,
  engineerName: string,
  reason: string,
) {
  await mockTicketDelay(260);
  const order = mockWorkOrders.find((item) => item.id === workOrderId);
  if (order) {
    const prevAssignee = order.assignee || '';
    const prevAssigneeId = order.assigneeId || '';
    // 转派后 SLA 重新计时
    order.assignee = engineerName;
    order.assigneeId = engineerId;
    order.slaResetAt = new Date().toISOString();
    order.transferHistory = order.transferHistory || [];
    order.transferHistory.push({
      id: `tf-${Date.now()}`,
      fromAssignee: prevAssignee,
      fromAssigneeId: prevAssigneeId,
      toAssignee: engineerName,
      toAssigneeId: engineerId,
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      reason,
      time: '刚刚',
    });
    order.timeline?.push({
      id: `tl-${Date.now()}`,
      action: 'transferred',
      time: '刚刚',
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `从 ${prevAssignee} 转派给 ${engineerName}，SLA 重新计时`,
      reason,
    });
  }
  return response(order);
}

/** 现场决策：客户经理判定是否需要前往现场 */
export async function setOnSiteDecisionApi(
  workOrderId: string,
  onSiteRequired: boolean,
) {
  await mockTicketDelay(200);
  const order = mockWorkOrders.find((item) => item.id === workOrderId);
  if (order) {
    order.onSiteRequired = onSiteRequired;
    order.onSiteDecisionBy = CURRENT_USER.name;
    order.onSiteDecisionAt = '刚刚';
    order.timeline?.push({
      id: `tl-${Date.now()}`,
      action: 'note',
      time: '刚刚',
      operator: CURRENT_USER.name,
      operatorId: CURRENT_USER.id,
      summary: `客户经理判定：${onSiteRequired ? '需要前往现场' : '无需前往现场'}`,
    });
  }
  return response(order);
}

/** 现场打卡：上传带时间与地点水印的照片 */
export async function checkInApi(
  workOrderId: string,
  checkIn: Omit<CheckInRecord, 'id'>,
) {
  await mockTicketDelay(200);
  const order = mockWorkOrders.find((item) => item.id === workOrderId);
  if (order) {
    order.checkInRecords = order.checkInRecords || [];
    const record: CheckInRecord = {
      ...checkIn,
      id: `ci-${Date.now()}`,
    };
    order.checkInRecords.push(record);
    order.timeline?.push({
      id: `tl-${Date.now()}`,
      action: 'note',
      time: '刚刚',
      operator: checkIn.person,
      operatorId: checkIn.personId,
      summary: `现场打卡：${checkIn.location}`,
    });
  }
  return response(order);
}

/** 完成闭环：处理人填写解决方案并上传凭证（闭环必填项） */
export async function completeWorkOrderApi(
  workOrderId: string,
  data: {
    acceptanceAttachments?: WorkOrder['acceptanceAttachments'];
    solution: string;
  },
) {
  await mockTicketDelay(300);
  const order = mockWorkOrders.find((item) => item.id === workOrderId);
  if (order) {
    order.solution = data.solution;
    order.acceptanceAttachments = data.acceptanceAttachments;
    order.status = 'pending-acceptance';
    order.completedAt = '刚刚';
    order.timeline?.push({
      id: `tl-${Date.now()}`,
      action: 'completed',
      time: '刚刚',
      operator: order.assignee || CURRENT_USER.name,
      operatorId: order.assigneeId || CURRENT_USER.id,
      summary: `处理完成，提交解决方案与凭证，等待验收`,
    });
  }
  return response(order);
}

/** 创建工单（工单助理引导式建单） */
export async function createWorkOrderApi(
  data: Pick<
    WorkOrder,
    | 'category'
    | 'contact'
    | 'customer'
    | 'description'
    | 'device'
    | 'phone'
    | 'priority'
    | 'title'
    | 'type'
  > & { priority: WorkOrder['priority'] },
) {
  await mockTicketDelay(320);
  const localMockWorkOrders = [...mockWorkOrders];
  const seq = 1012 + localMockWorkOrders.length;
  const created: WorkOrder = {
    id: `wo-2026-${seq}`,
    code: `WO-2026-${seq}`,
    title: data.title,
    type: data.type,
    category: data.category,
    device: data.device,
    customer: data.customer,
    contact: data.contact,
    phone: data.phone,
    priority: data.priority,
    status: 'pending',
    source: '工单助理',
    creator: CURRENT_USER.name,
    creatorId: CURRENT_USER.id,
    createdAt: '刚刚',
    deadline: '待派单后确认',
    slaStatus: 'normal',
    slaRemaining: '待派单',
    description: data.description,
    timeline: [
      {
        id: `tl-${Date.now()}`,
        action: 'created',
        time: '刚刚',
        operator: CURRENT_USER.name,
        operatorId: CURRENT_USER.id,
        summary: `${data.category === 'internal' ? '内部' : '外部'}工单已创建`,
      },
    ],
  };
  localMockWorkOrders.unshift(created);
  return response(created);
}

/** 售后制度文件解析：上传文件并自动解析生成派单规则与 SLA 草稿 */
export async function uploadDocumentForParseApi(
  fileName: string,
  fileType: string,
) {
  await mockTicketDelay(500);
  const newDoc: DocumentParseResult = {
    id: `doc-${Date.now()}`,
    fileName,
    fileType,
    uploadedAt: '刚刚',
    status: 'draft',
    ruleCount: 2,
    slaCount: 1,
    parsedRules: [
      {
        id: `pr-${Date.now()}`,
        condition: '解析规则 1（待人工复核）',
        target: '待确认',
        priority: 'medium',
      },
      {
        id: `pr-${Date.now() + 1}`,
        condition: '解析规则 2（待人工复核）',
        target: '待确认',
        priority: 'low',
      },
    ],
    parsedSlas: [
      {
        id: `ps-${Date.now()}`,
        name: '解析 SLA 草稿',
        priority: 'medium',
        responseHours: 4,
        resolveHours: 48,
      },
    ],
  };
  mockDocumentParseResults.push(newDoc);
  return response(newDoc);
}

/** 售后制度文件解析：人工复核确认或驳回 */
export async function reviewDocumentParseApi(
  docId: string,
  approved: boolean,
  reviewNote?: string,
) {
  await mockTicketDelay(300);
  const doc = mockDocumentParseResults.find((item) => item.id === docId);
  if (doc) {
    doc.status = approved ? 'confirmed' : 'rejected';
    doc.reviewedBy = CURRENT_USER.name;
    doc.reviewedAt = '刚刚';
    doc.reviewNote = reviewNote;
    if (approved) {
      // 确认后将解析出的规则和 SLA 合并到正式配置中
      doc.parsedRules.forEach((rule) => {
        mockDispatchRules.push({
          ...rule,
          name: rule.condition,
          condition: rule.condition,
          targetMode: 'position',
          targetPosition: rule.target,
          target: rule.target,
          enabled: true,
          hitCount: 0,
        });
      });
      doc.parsedSlas.forEach((sla) => {
        mockSlaConfigs.push({
          ...sla,
          penalty: '超时自动通知',
          responseAlert: {
            enabled: true,
            delayMinutes: 0,
            targetPersonIds: [],
            channels: ['in-app', 'email'],
          },
          resolveAlert: {
            enabled: false,
            delayMinutes: 60,
            targetPersonIds: [],
            channels: ['in-app'],
          },
          alertChannels: ['in-app', 'email'],
          enabled: true,
        });
      });
    }
  }
  return response(doc);
}

// ============================================================================
// V1.1：可配置流程模型扩展 API（PRD 工单V1.1prd.md）
// 与现有 API 并存，互不干扰。配置域 4 组 CRUD。
// ============================================================================

/** 获取工单模型（按场景 id 加载系统/自定义字段与表单布局） */
export async function getTicketSchemaApi(sceneId: string) {
  await mockTicketDelay();
  // 返回深拷贝避免运行时改写污染全局 mock
  const schema = cloneTicketSchemas().find((s) => s.sceneId === sceneId);
  if (!schema) throw new Error('工单模型未配置');
  return response(schema);
}

/** 保存工单模型（覆盖式更新该场景的 schema） */
export async function saveTicketSchemaApi(
  id: string,
  data: Partial<TicketSchema>,
) {
  await mockTicketDelay();
  const index = mockTicketSchemas.findIndex((s) => s.id === id);
  if (index !== -1) {
    mockTicketSchemas[index] = {
      ...(mockTicketSchemas[index] as TicketSchema),
      ...data,
    } as TicketSchema;
    return response(mockTicketSchemas[index]);
  }
  // 新建
  const newSchema: TicketSchema = {
    id: `ts-${Date.now()}`,
    sceneId: data.sceneId || '',
    systemFields: data.systemFields || [],
    customFields: data.customFields || [],
    layout: data.layout,
  };
  mockTicketSchemas.push(newSchema);
  return response(newSchema);
}

/** 获取工单动作列表（按流程图 id 关联） */
export async function getTicketActionsApi(graphId: string) {
  await mockTicketDelay();
  // Demo 简化：返回全部动作，由调用方按 nextStateId 过滤
  void graphId;
  return response(cloneTicketActions());
}

/** 保存工单动作（新建或更新） */
export async function saveTicketActionApi(
  id: string,
  data: Partial<TicketAction>,
) {
  await mockTicketDelay();
  const index = mockTicketActions.findIndex((a) => a.id === id);
  if (index !== -1) {
    mockTicketActions[index] = {
      ...(mockTicketActions[index] as TicketAction),
      ...data,
    } as TicketAction;
    return response(mockTicketActions[index]);
  }
  // 新建
  const newAction: TicketAction = {
    id: `act-${Date.now()}`,
    code: data.code || `act_${Date.now()}`,
    name: data.name || '新动作',
    allowedRoles: data.allowedRoles,
    condition: data.condition,
    inputFields: data.inputFields,
    nextStateId: data.nextStateId || '',
    triggers: data.triggers,
    requireReason: data.requireReason,
    enabled: data.enabled ?? true,
  };
  mockTicketActions.push(newAction);
  return response(newAction);
}

/** 删除工单动作 */
export async function deleteTicketActionApi(id: string) {
  await mockTicketDelay();
  const index = mockTicketActions.findIndex((a) => a.id === id);
  if (index !== -1) {
    mockTicketActions.splice(index, 1);
  }
  return response(undefined);
}

/** 获取派单策略（按场景 id，含全部规则） */
export async function getAssignmentPolicyApi(sceneId: string) {
  await mockTicketDelay();
  // 返回深拷贝避免运行时改写污染全局 mock
  const policy = cloneAssignmentPolicies().find((p) => p.sceneId === sceneId);
  if (!policy) throw new Error('派单策略未配置');
  return response(policy);
}

/** 保存派单策略（覆盖式更新该场景的策略与规则列表） */
export async function saveAssignmentPolicyApi(
  id: string,
  data: Partial<AssignmentPolicy>,
) {
  await mockTicketDelay();
  const index = mockAssignmentPolicies.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockAssignmentPolicies[index] = {
      ...(mockAssignmentPolicies[index] as AssignmentPolicy),
      ...data,
    } as AssignmentPolicy;
    return response(mockAssignmentPolicies[index]);
  }
  // 新建
  const newPolicy: AssignmentPolicy = {
    id: `ap-${Date.now()}`,
    sceneId: data.sceneId || '',
    rules: data.rules || [],
    defaultAssigneeId: data.defaultAssigneeId,
  };
  mockAssignmentPolicies.push(newPolicy);
  return response(newPolicy);
}

/** 获取 SLA 策略列表（按场景 id） */
export async function getSlaPoliciesApi(sceneId: string) {
  await mockTicketDelay();
  // 返回深拷贝避免运行时改写污染全局 mock
  return response(cloneSlaPolicies().filter((p) => p.sceneId === sceneId));
}

/** 保存 SLA 策略（新建或更新） */
export async function saveSlaPolicyApi(id: string, data: Partial<SlaPolicy>) {
  await mockTicketDelay();
  const index = mockSlaPolicies.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockSlaPolicies[index] = {
      ...(mockSlaPolicies[index] as SlaPolicy),
      ...data,
    } as SlaPolicy;
    return response(mockSlaPolicies[index]);
  }
  // 新建
  const newPolicy: SlaPolicy = {
    id: `sp-${Date.now()}`,
    sceneId: data.sceneId || '',
    name: data.name || '新 SLA 策略',
    code: data.code,
    applyCondition: data.applyCondition,
    applyConditionText: data.applyConditionText,
    responseTarget: data.responseTarget,
    resolveTarget: data.resolveTarget || {
      hours: 4,
      timeMode: 'natural',
      startNodeId: '',
      endNodeId: '',
    },
    pauseRules: data.pauseRules,
    warnRules: data.warnRules,
    escalateRules: data.escalateRules,
    responseTimeoutRules: data.responseTimeoutRules,
    resolveTimeoutRules: data.resolveTimeoutRules,
    enabled: data.enabled ?? true,
  };
  mockSlaPolicies.push(newPolicy);
  return response(newPolicy);
}

/** 删除 SLA 策略 */
export async function deleteSlaPolicyApi(id: string) {
  await mockTicketDelay();
  const index = mockSlaPolicies.findIndex((p) => p.id === id);
  if (index !== -1) {
    mockSlaPolicies.splice(index, 1);
  }
  return response(undefined);
}

/** 获取 SLA AI 推荐建议（基于制度条款 / 合同） */
export async function getSlaAiSuggestionsApi() {
  await mockTicketDelay(500);
  return response(mockSlaAiSuggestions);
}

/** 获取工单字段 AI 推荐建议（基于场景描述 / 制度条款） */
export async function getFieldAiSuggestionsApi() {
  await mockTicketDelay(500);
  return response(mockFieldAiSuggestions);
}

/** 获取状态流程 AI 推荐建议（基于制度条款，提供状态定义建议） */
export async function getStatusFlowAiSuggestionsApi() {
  await mockTicketDelay(500);
  return response(mockStatusFlowAiSuggestions);
}

/** 获取平台层级定义的动作事件列表（供流转规则绑定） */
export async function getPlatformActionEventsApi() {
  await mockTicketDelay(200);
  return response(mockPlatformActionEvents);
}

/** 获取岗位列表（状态流转：处理人角色=指定岗位时下拉选项） */
export async function getPositionsApi() {
  await mockTicketDelay(200);
  return response(mockPositions);
}

/** 获取角色列表（状态流转：处理人角色=指定角色时下拉选项） */
export async function getRolesApi() {
  await mockTicketDelay(200);
  return response(mockRoles);
}

/** 获取用户列表（状态流转：处理人角色=指定人员时下拉选项） */
export async function getStaffsApi() {
  await mockTicketDelay(200);
  return response(mockStaffs);
}

/** 获取预定义 SLA 邮件模板列表（供超时告警渠道下拉引用） */
export async function getSlaEmailTemplatesApi() {
  await mockTicketDelay(200);
  return response(mockSlaEmailTemplates);
}

/** 获取派单 AI 推荐建议（基于制度条款 / 业务规则） */
export async function getAssignmentAiSuggestionsApi() {
  await mockTicketDelay(500);
  return response(mockAssignmentAiSuggestions);
}

/** 发布场景（草稿→已发布，写 latestStatus='published'） */
export async function publishSceneApi(sceneId: string) {
  await mockTicketDelay(500);
  const scene = mockTicketScenarios.find((s) => s.id === sceneId);
  if (!scene) throw new Error('场景不存在');
  const versionParts = (scene.latestVersion || 'v0.0.0')
    .replace(/^v/, '')
    .split('.')
    .map(Number);
  const newVersion = `v${versionParts[0] || 1}.${versionParts[1] || 0}.${(versionParts[2] || 0) + 1}`;
  scene.latestStatus = 'published';
  scene.status = 'published';
  scene.latestVersion = newVersion;
  scene.lastPublishedVersion = newVersion;
  scene.updatedAt = '刚刚';
  // 返回深拷贝避免运行时改写污染全局 mock
  return response(cloneTicketScenarios().find((s) => s.id === sceneId));
}

/** 停用场景（已发布→草稿） */
export async function disableSceneApi(sceneId: string) {
  await mockTicketDelay(500);
  const scene = mockTicketScenarios.find((s) => s.id === sceneId);
  if (!scene) throw new Error('场景不存在');
  scene.latestStatus = 'draft';
  scene.status = 'draft';
  scene.updatedAt = '刚刚';
  // 返回深拷贝避免运行时改写污染全局 mock
  return response(cloneTicketScenarios().find((s) => s.id === sceneId));
}

/** 复制场景为草稿（生成新的草稿副本） */
export async function copySceneApi(sceneId: string, newName: string) {
  await mockTicketDelay(500);
  const source = mockTicketScenarios.find((s) => s.id === sceneId);
  if (!source) throw new Error('源场景不存在');
  const newId = `s-${Date.now()}`;
  const newScene = {
    ...source,
    id: newId,
    code: `${source.code}-copy-${Date.now().toString().slice(-4)}`,
    name: newName || `${source.name} 副本`,
    status: 'draft' as const,
    latestStatus: 'draft' as const,
    latestVersion: 'v0.1.0',
    lastPublishedVersion: '',
    updatedAt: '刚刚',
    by: CURRENT_USER.name,
  };
  mockTicketScenarios.push(newScene);
  return response(newScene);
}

/** 删除场景 */
export async function deleteSceneApi(sceneId: string) {
  await mockTicketDelay(300);
  const idx = mockTicketScenarios.findIndex((s) => s.id === sceneId);
  if (idx === -1) throw new Error('场景不存在');
  mockTicketScenarios.splice(idx, 1);
  return response(undefined);
}

export type {
  Asset,
  AssetCategory,
  AssetFieldDef,
  AssignmentPolicy,
  CheckInRecord,
  ConditionRule,
  DispatchRule,
  DocumentParseResult,
  KnowledgeArticle,
  PlatformActionEvent,
  SlaAiSuggestion,
  SlaConfig,
  SlaEmailTemplate,
  SlaPolicy,
  SlaTimeoutRule,
  StatusFlowAiSuggestion,
  TicketAction,
  TicketCategory,
  TicketDevice,
  TicketFieldType,
  TicketOverviewStats,
  TicketRole,
  TicketSchema,
  WorkOrder,
};
