// 执行器状态
export type ExecutorStatus = 'busy' | 'idle' | 'maintenance' | 'offline';

// 执行器类型
export type ExecutorType = 'browser-plugin' | 'playwright';

// Playwright 配置
export interface PlaywrightConfig {
  headless: boolean; // 是否无头模式
  browserType: 'chromium' | 'firefox' | 'webkit'; // 浏览器类型
  viewport?: {
    height: number;
    width: number;
  }; // 视口大小
}

// 浏览器插件配置
export interface BrowserPluginConfig {
  pluginId: string; // 插件ID
  requiredVersion: string; // 要求的最低版本
  supportedBrowsers: string[]; // 支持的浏览器
}

// 执行器接口
export interface Executor {
  id: string;
  name: string;
  code: string; // 执行器编码
  type: ExecutorType;
  status: ExecutorStatus;
  maxConcurrentTasks: number; // 最大并发任务数
  currentQueue: number; // 当前队列中的任务数
  playwrightConfig?: PlaywrightConfig; // Playwright 配置（type 为 playwright 时）
  browserPluginConfig?: BrowserPluginConfig; // 浏览器插件配置（type 为 browser-plugin 时）
  description?: string; // 描述
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}
