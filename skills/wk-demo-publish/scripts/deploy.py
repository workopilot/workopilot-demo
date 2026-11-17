#!/usr/bin/env python3
"""Publish wk-demo through File Browser; credentials live only in root .env."""

import argparse
import getpass
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
ENV_FILE = PROJECT_ROOT / '.env'
DEFAULT_API = 'http://116.204.66.32:10000'
DEFAULT_PUBLIC = 'https://dev.workopilot.com'
REQUIRED = ('FILEBROWSER_URL', 'FILEBROWSER_USERNAME', 'FILEBROWSER_PASSWORD')


class PublishError(Exception):
    pass


def load_env(path=None):
    path = Path(path) if path else ENV_FILE
    if not path.exists():
        return {}
    result = {}
    for line in path.read_text(encoding='utf-8-sig').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                value = value[1:-1]
        elif value.startswith("'") and value.endswith("'"):
            value = value[1:-1]
        result[key.strip()] = value
    return result


def save_missing_config(values, path=None):
    """Append only absent/empty publishing fields; preserve deployment settings."""
    path = Path(path) if path else ENV_FILE
    current = load_env(path)
    allowed = (*REQUIRED, 'FILEBROWSER_PUBLIC_URL')
    additions = {key: value for key, value in values.items()
                 if key in allowed and value and not current.get(key)}
    if additions:
        with path.open('ab') as stream:
            stream.write(b'\n# File Browser publishing (local only)\n')
            for key, value in additions.items():
                stream.write(f'{key}={json.dumps(value, ensure_ascii=False)}\n'.encode('utf-8'))
    return load_env(path)


def validate_url(value):
    parsed = urllib.parse.urlsplit(value)
    if (parsed.scheme not in ('http', 'https') or not parsed.netloc
            or parsed.username or parsed.password or parsed.query or parsed.fragment):
        raise PublishError('服务地址必须为不含账号密码、查询参数或片段的 HTTP(S) 地址。')
    return value.rstrip('/')


def configure(path=None):
    env = load_env(path)
    keys = (*REQUIRED, 'FILEBROWSER_PUBLIC_URL')
    missing = [key for key in keys if not env.get(key)]
    if not missing:
        print('发布配置已存在，直接复用，未修改 .env。')
        return env
    if not sys.stdin.isatty():
        raise PublishError('缺少配置：' + ', '.join(missing)
                           + '。请在本地交互终端运行 deploy.py --configure，密码将隐藏输入。')
    values = {}
    for key in missing:
        if key == 'FILEBROWSER_PASSWORD':
            value = getpass.getpass('File Browser 密码（隐藏输入）：')
        elif key == 'FILEBROWSER_USERNAME':
            value = input('File Browser 用户名：').strip()
        else:
            default = DEFAULT_API if key == 'FILEBROWSER_URL' else DEFAULT_PUBLIC
            value = input(f'{key} [{default}]：').strip() or default
            validate_url(value)
        if not value:
            raise PublishError(f'{key} 不能为空；本次未写入配置。')
        values[key] = value
    env = save_missing_config(values, path)
    print('发布配置已保存至仓库根目录 .env，原有配置已保留。')
    return env


def request(base_url, endpoint, token=None, data=None, method='GET'):
    headers = {'X-Auth': token} if token else {}
    if data is not None:
        headers['Content-Type'] = 'application/octet-stream' if token else 'application/json'
    req = urllib.request.Request(validate_url(base_url) + endpoint,
                                 data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return response.read()
    except urllib.error.HTTPError as error:
        # Never print server bodies: they may echo credentials or auth headers.
        if error.code == 404 and method == 'DELETE':
            return b''
        raise PublishError(f'{method} 请求失败（HTTP {error.code}）。') from None
    except (urllib.error.URLError, TimeoutError):
        raise PublishError(f'{method} 请求连接失败或超时，请检查服务地址和网络。') from None


def get_token(base_url, username, password):
    data = json.dumps({'username': username, 'password': password, 'recaptcha': ''}).encode('utf-8')
    token = request(base_url, '/api/login', data=data, method='POST').decode().strip()
    if token.startswith('"'):
        token = json.loads(token)
    if not token:
        raise PublishError('登录未返回有效 Token。')
    return token


def normalize_remote(value):
    value = value.replace('\\', '/').strip()
    parts = value.strip('/').split('/')
    if any(part in ('.', '..') for part in parts):
        raise PublishError('远程路径不能包含 . 或 ..。')
    return '/' + '/'.join(part for part in parts if part)


def resource_endpoint(remote):
    return '/api/resources/' + urllib.parse.quote(normalize_remote(remote).lstrip('/'))


def upload_single_file(base_url, token, local, remote):
    request(base_url, resource_endpoint(remote) + '?override=true', token,
            Path(local).read_bytes(), 'POST')
    print(f'已上传：{remote}')


def list_remote_resources(base_url, token, remote='/'):
    return json.loads(request(base_url, resource_endpoint(remote), token))


def default_remote(env):
    if 'WK_DEMO_SUBDIRECTORY' not in env:
        raise PublishError('缺少 WK_DEMO_SUBDIRECTORY，请先按 AGENTS.md 确认子目录。')
    directory = env['WK_DEMO_SUBDIRECTORY'].strip().strip('/')
    if directory and not re.fullmatch(r'[a-zA-Z0-9_-]+', directory):
        raise PublishError('部署子目录只能包含字母、数字、下划线或连字符。')
    return normalize_remote(directory)


def collect_files(local):
    if not local.exists():
        raise PublishError('找不到本地产物，请先完成构建。')
    files = [local] if local.is_file() else sorted(p for p in local.rglob('*') if p.is_file())
    if not files:
        raise PublishError('本地目录为空，不执行发布。')
    if any(p.name.startswith('.env') for p in files):
        raise PublishError('上传内容包含 .env 配置文件，请只选择构建产物。')
    if any(p.is_symlink() for p in files):
        raise PublishError('上传内容包含符号链接，请选择实际构建文件。')
    return sorted(files, key=lambda p: (p.suffix.lower() == '.html', p.as_posix()))


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('local', nargs='?', help='默认 apps/web-antd/dist')
    parser.add_argument('remote', nargs='?', help='默认读取 WK_DEMO_SUBDIRECTORY')
    parser.add_argument('--configure', action='store_true', help='仅收集缺失配置，密码隐藏输入')
    parser.add_argument('--list', metavar='REMOTE', help='只查看指定远程目录')
    parser.add_argument('--clean', action='store_true', help='完整替换已指定的非根目录')
    args = parser.parse_args(argv)
    try:
        if args.configure:
            configure()
            return 0
        env = load_env()
        local = Path(args.local).resolve() if args.local else PROJECT_ROOT / 'apps/web-antd/dist'
        remote = normalize_remote(args.list or args.remote) if (args.list or args.remote) else default_remote(env)
        if args.clean and (remote == '/' or args.list):
            raise PublishError('禁止清空服务根目录，--list 也不能与 --clean 同用。')
        files = [] if args.list else collect_files(local)
        if any(not env.get(key) for key in REQUIRED):
            env = configure()
        base = validate_url(env['FILEBROWSER_URL'])
        public = validate_url(env.get('FILEBROWSER_PUBLIC_URL') or DEFAULT_PUBLIC)
        token = get_token(base, env['FILEBROWSER_USERNAME'], env['FILEBROWSER_PASSWORD'])
        if args.list:
            data = list_remote_resources(base, token, remote)
            for item in data.get('items', []):
                print(f"{'目录' if item.get('isDir') else '文件'} {item['name']} ({item.get('size', 0)} bytes)")
            return 0
        if args.clean:
            request(base, resource_endpoint(remote), token, method='DELETE')
        for file in files:
            target = remote if local.is_file() else normalize_remote(remote + '/' + file.relative_to(local).as_posix())
            upload_single_file(base, token, file, target)
        print(f'上传完成：{len(files)} 个文件；请继续核对远程文件与公网资源。')
        entry = remote if local.is_file() else normalize_remote(remote + '/index.html')
        if local.is_file() or (local / 'index.html').exists():
            print('访问地址：' + public + urllib.parse.quote(entry))
        return 0
    except (PublishError, OSError, ValueError) as error:
        # OSError may contain local paths; do not echo arbitrary config values.
        print(str(error) if isinstance(error, PublishError) else '读取文件或配置失败，请检查输入与文件权限。', file=sys.stderr)
        return 1
    except (KeyboardInterrupt, EOFError):
        print('已取消，未继续发布。', file=sys.stderr)
        return 1


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    sys.exit(main())
