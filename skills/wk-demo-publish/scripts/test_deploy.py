"""Offline checks: temporary config files and a local fake File Browser only."""

import contextlib
import importlib.util
import io
import json
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).with_name('deploy.py'))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class PublishTests(unittest.TestCase):
    def test_first_configuration_preserves_existing_settings_and_special_characters(self):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / '.env'
            original = b'# existing settings\r\nWK_DEMO_SUBDIRECTORY=wkdemo\r\n'
            env.write_bytes(original)
            password = 'fake-test-"#\\$=password'
            with patch.object(deploy.sys.stdin, 'isatty', return_value=True), \
                    patch('builtins.input', side_effect=['', 'demo-test-user', '']), \
                    patch.object(deploy.getpass, 'getpass', return_value=password), \
                    contextlib.redirect_stdout(io.StringIO()) as output:
                result = deploy.configure(env)
            self.assertTrue(env.read_bytes().startswith(original))
            self.assertEqual(result['WK_DEMO_SUBDIRECTORY'], 'wkdemo')
            self.assertEqual(result['FILEBROWSER_PASSWORD'], password)
            self.assertNotIn(password, output.getvalue())
            saved = env.read_bytes()
            with patch('builtins.input', side_effect=AssertionError('must not prompt')), \
                    contextlib.redirect_stdout(io.StringIO()):
                deploy.configure(env)
            self.assertEqual(env.read_bytes(), saved)

    def test_noninteractive_missing_configuration_does_not_write(self):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / '.env'
            with patch.object(deploy.sys.stdin, 'isatty', return_value=False):
                with self.assertRaises(deploy.PublishError):
                    deploy.configure(env)
            self.assertFalse(env.exists())

    def test_root_cleanup_and_secret_upload_are_rejected_before_network(self):
        with tempfile.TemporaryDirectory() as directory:
            env = Path(directory) / '.env'
            env.write_text('WK_DEMO_SUBDIRECTORY=\n', encoding='utf8')
            with patch.object(deploy, 'ENV_FILE', env), \
                    patch.object(deploy, 'get_token', side_effect=AssertionError('no network')), \
                    contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(deploy.main(['--clean']), 1)
            with self.assertRaises(deploy.PublishError):
                deploy.collect_files(Path(directory))
            self.assertEqual(deploy.default_remote({'WK_DEMO_SUBDIRECTORY': ''}), '/')
            self.assertEqual(deploy.default_remote({'WK_DEMO_SUBDIRECTORY': 'demo'}), '/demo')

    def test_upload_order_target_and_failure_exit(self):
        uploads = []
        failure = {'enabled': False}

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                body = self.rfile.read(int(self.headers.get('Content-Length', 0)))
                if self.path == '/api/login':
                    self.send_response(200)
                    self.end_headers()
                    self.wfile.write(b'fake-test-token')
                elif failure['enabled']:
                    self.send_response(403)
                    self.end_headers()
                    self.wfile.write(b'fake-password-must-not-leak')
                else:
                    uploads.append((self.path, body, self.headers.get('X-Auth')))
                    self.send_response(200)
                    self.end_headers()

        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                env = root / '.env'
                env.write_text('\n'.join([
                    'WK_DEMO_SUBDIRECTORY=wkdemo',
                    f'FILEBROWSER_URL=http://127.0.0.1:{server.server_port}',
                    'FILEBROWSER_USERNAME=test-user',
                    'FILEBROWSER_PASSWORD=fake-password-must-not-leak',
                ]), encoding='utf8')
                dist = root / 'apps/web-antd/dist'
                dist.mkdir(parents=True)
                (dist / 'index.html').write_text('<h1>Test</h1>', encoding='utf8')
                (dist / 'bundle.js').write_text('/* test */', encoding='utf8')
                with patch.object(deploy, 'PROJECT_ROOT', root), \
                        patch.object(deploy, 'ENV_FILE', env), \
                        contextlib.redirect_stdout(io.StringIO()) as output, \
                        contextlib.redirect_stderr(io.StringIO()) as errors:
                    self.assertEqual(deploy.main([]), 0)
                    self.assertEqual([item[0] for item in uploads], [
                        '/api/resources/wkdemo/bundle.js?override=true',
                        '/api/resources/wkdemo/index.html?override=true',
                    ])
                    self.assertEqual(uploads[0][2], 'fake-test-token')
                    failure['enabled'] = True
                    output.truncate(0)
                    output.seek(0)
                    self.assertEqual(deploy.main([]), 1)
                    self.assertNotIn('上传完成', output.getvalue())
                    self.assertNotIn('fake-password-must-not-leak', errors.getvalue())
        finally:
            server.shutdown()
            server.server_close()


if __name__ == '__main__':
    unittest.main()
