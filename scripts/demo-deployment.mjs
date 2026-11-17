import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const localEnvPath = fileURLToPath(new URL('../.env', import.meta.url));

export function loadDemoBase(envPath = localEnvPath) {
  let contents;
  try {
    contents = readFileSync(envPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    throw new Error(
      '缺少根目录 .env。请按 AGENTS.md 先确认部署子目录：默认 wkdemo（www.xxx.com/wkdemo/index.html），可换名或留空使用根目录，确认后写入 WK_DEMO_SUBDIRECTORY。',
    );
  }
  const { WK_DEMO_SUBDIRECTORY: value } = parseEnv(contents);
  if (value === undefined) {
    throw new Error('.env 缺少 WK_DEMO_SUBDIRECTORY；留空表示部署到根目录。');
  }
  const directory = value.trim().replace(/^\/+|\/+$/g, '');
  if (directory && !/^[a-zA-Z0-9_-]+$/.test(directory)) {
    throw new Error(
      '部署子目录只能包含字母、数字、下划线或连字符，也可留空使用根目录。',
    );
  }
  return directory ? `/${directory}/` : '/';
}

// 供 PowerShell 发布脚本读取同一份本地配置。
if (process.argv[2] === '--directory') {
  console.log(loadDemoBase().slice(1, -1));
}
