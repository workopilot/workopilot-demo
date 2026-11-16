/**
 * 文件存储管理模块 Mock 数据
 */

import type {
  FileStorageConfig,
  StorageConfigForm,
  StorageConfigListResponse,
  StorageConfigQuery,
} from '#/types/file-storage';

// ==================== 工具函数 ====================

export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockResponse<T>(data: T) {
  return {
    code: 0,
    data,
    message: 'success',
  };
}

// ==================== Mock 数据 ====================

export const mockStorageConfigs: FileStorageConfig[] = [
  {
    id: '1',
    configName: 'minio',
    serviceUrl: 'https://minio.example.com',
    customDomain: 'https://files.example.com',
    accessKey: 'APWMBLGFPTVUYIBH5P6S',
    secretKey: 'xJdq1fR7UGxjKUlwsfhgxBt1qL2alhArRGNClu3y',
    bucketName: 'wiseai-prod',
    prefix: 'files/',
    bucketPermission: 'private',
    isHttps: true,
    region: 'us-east-1',
    remark: '生产环境MinIO存储服务',
    status: 'enabled',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-20T14:30:00Z',
  },
  {
    id: '2',
    configName: '华为云OBS',
    serviceUrl: 'https://obs.cn-north-1.myhuaweicloud.com',
    customDomain: '',
    accessKey: 'HUAWEI_ACCESS_KEY_12345',
    secretKey: 'HUAWEI_SECRET_KEY_67890',
    bucketName: 'wiseai-backup',
    prefix: 'backup/',
    bucketPermission: 'private',
    isHttps: true,
    region: 'cn-north-1',
    remark: '华为云对象存储，用于备份',
    status: 'disabled',
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-03-15T16:20:00Z',
  },
  {
    id: '3',
    configName: '阿里云OSS',
    serviceUrl: 'https://oss-cn-hangzhou.aliyuncs.com',
    customDomain: 'https://static.wiseai.com',
    accessKey: 'ALIYUN_ACCESS_KEY_ABCDE',
    secretKey: 'ALIYUN_SECRET_KEY_FGHIJ',
    bucketName: 'wiseai-public',
    prefix: 'public/',
    bucketPermission: 'public',
    isHttps: true,
    region: 'cn-hangzhou',
    remark: '阿里云OSS，用于公开资源访问',
    status: 'disabled',
    createdAt: '2024-02-20T11:00:00Z',
    updatedAt: '2024-03-10T10:45:00Z',
  },
  {
    id: '4',
    configName: '腾讯云COS',
    serviceUrl: 'https://cos.ap-guangzhou.myqcloud.com',
    customDomain: '',
    accessKey: 'TENCENT_ACCESS_KEY_XXXXX',
    secretKey: 'TENCENT_SECRET_KEY_YYYYY',
    bucketName: 'wiseai-documents',
    prefix: 'documents/',
    bucketPermission: 'custom',
    isHttps: true,
    region: 'ap-guangzhou',
    remark: '腾讯云对象存储，用于文档管理',
    status: 'disabled',
    createdAt: '2024-03-01T08:30:00Z',
    updatedAt: '2024-03-05T15:10:00Z',
  },
  {
    id: '5',
    configName: 'AWS S3',
    serviceUrl: 'https://s3.amazonaws.com',
    customDomain: '',
    accessKey: 'AWS_ACCESS_KEY_TEST',
    secretKey: 'AWS_SECRET_KEY_TEST',
    bucketName: 'wiseai-s3',
    prefix: '',
    bucketPermission: 'private',
    isHttps: true,
    region: 'us-east-1',
    remark: 'AWS S3测试存储',
    status: 'disabled',
    createdAt: '2024-03-10T14:00:00Z',
    updatedAt: '2024-03-10T14:00:00Z',
  },
];

// ==================== API 函数 ====================

/** 获取存储配置列表 */
export async function getStorageConfigsApi(params: StorageConfigQuery) {
  await mockDelay();

  let filteredList = [...mockStorageConfigs];

  // 按配置名称过滤
  if (params.configName) {
    filteredList = filteredList.filter((config) =>
      config.configName.toLowerCase().includes(params.configName.toLowerCase()),
    );
  }

  // 按服务地址过滤
  if (params.serviceUrl) {
    filteredList = filteredList.filter((config) =>
      config.serviceUrl.toLowerCase().includes(params.serviceUrl.toLowerCase()),
    );
  }

  // 按桶名称过滤
  if (params.bucketName) {
    filteredList = filteredList.filter((config) =>
      config.bucketName.toLowerCase().includes(params.bucketName.toLowerCase()),
    );
  }

  // 按权限桶类型过滤
  if (params.bucketPermission) {
    filteredList = filteredList.filter(
      (config) => config.bucketPermission === params.bucketPermission,
    );
  }

  // 分页
  const total = filteredList.length;
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filteredList.slice(start, end);

  return createMockResponse<StorageConfigListResponse>({
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
  });
}

/** 获取存储配置详情 */
export async function getStorageConfigDetailApi(id: string) {
  await mockDelay();
  const config = mockStorageConfigs.find((c) => c.id === id);
  if (!config) {
    throw new Error('配置不存在');
  }
  return createMockResponse(config);
}

/** 创建存储配置 */
export async function createStorageConfigApi(form: StorageConfigForm) {
  await mockDelay(500);

  // 检查是否已有启用的配置，新配置默认为禁用状态
  const hasEnabled = mockStorageConfigs.some((c) => c.status === 'enabled');

  const newConfig: FileStorageConfig = {
    id: String(Date.now()),
    configName: form.configName,
    serviceUrl: form.serviceUrl,
    customDomain: form.customDomain,
    accessKey: form.accessKey,
    secretKey: form.secretKey,
    bucketName: form.bucketName,
    prefix: form.prefix,
    bucketPermission: form.bucketPermission,
    isHttps: form.isHttps,
    region: form.region,
    remark: form.remark,
    status: hasEnabled ? 'disabled' : 'enabled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockStorageConfigs.unshift(newConfig);
  return createMockResponse(newConfig);
}

/** 更新存储配置 */
export async function updateStorageConfigApi(
  id: string,
  form: StorageConfigForm,
) {
  await mockDelay(500);

  const index = mockStorageConfigs.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('配置不存在');
  }

  mockStorageConfigs[index] = {
    ...mockStorageConfigs[index],
    ...form,
    updatedAt: new Date().toISOString(),
  };

  return createMockResponse(mockStorageConfigs[index]);
}

/** 删除存储配置 */
export async function deleteStorageConfigApi(id: string) {
  await mockDelay();
  const index = mockStorageConfigs.findIndex((c) => c.id === id);
  if (index !== -1) {
    mockStorageConfigs.splice(index, 1);
  }
  return createMockResponse(undefined);
}

/** 测试连接 */
export async function testConnectionApi(_id: string) {
  await mockDelay(1000);
  // 随机返回成功或失败
  const success = Math.random() > 0.3;
  return success
    ? createMockResponse({
        success: true,
        message: '连接成功',
        responseTime: `${Math.floor(Math.random() * 200 + 50)}ms`,
      })
    : createMockResponse({
        success: false,
        message: '连接失败：无法访问存储服务',
        responseTime: `${Math.floor(Math.random() * 5000 + 1000)}ms`,
      });
}

/** 切换状态 */
export async function toggleStorageConfigStatusApi(id: string) {
  await mockDelay();
  const index = mockStorageConfigs.findIndex((c) => c.id === id);
  if (index !== -1) {
    const currentStatus = mockStorageConfigs[index].status;

    // 如果当前是禁用状态，要启用它，需要先禁用其他已启用的配置
    if (currentStatus === 'disabled') {
      mockStorageConfigs.forEach((config) => {
        if (config.status === 'enabled') {
          config.status = 'disabled';
          config.updatedAt = new Date().toISOString();
        }
      });
      mockStorageConfigs[index].status = 'enabled';
    } else {
      // 如果当前是启用状态，直接禁用
      mockStorageConfigs[index].status = 'disabled';
    }
    mockStorageConfigs[index].updatedAt = new Date().toISOString();
  }
  return createMockResponse(mockStorageConfigs[index]);
}
