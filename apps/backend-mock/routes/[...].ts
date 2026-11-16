import { defineEventHandler } from 'h3';

export default defineEventHandler((event) => {
  // 只处理非API路由,让API路由由api目录下的文件处理
  const path = event.path || event.node?.req?.url || '';
  if (path.startsWith('/api/')) {
    // 返回404让其他路由处理
    return;
  }

  return `
<h1>Hello Vben Admin</h1>
<h2>Mock service is running</h2>
<ul>
<li><a href="/api/user/info">/api/user/info</a></li>
<li><a href="/api/menu/all">/api/menu/all</a></li>
<li><a href="/api/auth/codes">/api/auth/codes</a></li>
<li><a href="/api/auth/login">/api/auth/login</a></li>
<li><a href="/api/upload">/api/upload</a></li>
<li><a href="/api/settings/source-systems">/api/settings/source-systems</a></li>
</ul>
`;
});
