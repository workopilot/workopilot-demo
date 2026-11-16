import { ref } from 'vue';

export interface Group {
  id: string;
  code: string;
  enabled: boolean;
  name: string;
  note: string;
  users: string[];
  departments: string[];
  recursive: string[];
  apps: string[];
}
export const departments = [
  { id: 'sales', name: '销售中心', parent: '' },
  { id: 'east', name: '华东一部', parent: 'sales' },
  { id: 'south', name: '华南一部', parent: 'sales' },
  { id: 'finance', name: '财务部', parent: '' },
  { id: 'ops', name: '运营部', parent: '' },
  { id: 'product', name: '产品部', parent: '' },
];
export const people = [
  { id: '1001', name: '张三', dept: 'east' },
  { id: '1002', name: '李四', dept: 'product' },
  { id: '1003', name: '王敏', dept: 'finance' },
  { id: '1004', name: '陈晓', dept: 'east' },
  { id: '1005', name: '周妍', dept: 'ops' },
  { id: '1006', name: '林悦', dept: 'product' },
  { id: '1007', name: '赵辰', dept: 'south' },
  { id: '1008', name: '孙宁', dept: 'finance' },
  { id: '1009', name: '徐嘉', dept: 'sales' },
  { id: '1010', name: '王敏', dept: 'product' },
  { id: '1011', name: '叶舟', dept: 'ops' },
  { id: '1012', name: '程越', dept: 'finance' },
  { id: '1013', name: '方宁', dept: 'product' },
  { id: '1014', name: '罗昕', dept: 'east' },
  { id: '1015', name: '唐悦', dept: 'south' },
  { id: '1016', name: '朱晨', dept: 'sales' },
  { id: '1017', name: '曹睿', dept: 'ops' },
  { id: '1018', name: '陆云', dept: 'finance' },
  { id: '1019', name: '高博', dept: 'product' },
  { id: '1020', name: '黄仪', dept: 'east' },
  { id: '1021', name: '魏桐', dept: 'south' },
  { id: '1022', name: '宋岚', dept: 'sales' },
  { id: '1023', name: '江林', dept: 'ops' },
  { id: '1024', name: '杜航', dept: 'finance' },
  { id: '1025', name: '何欣', dept: 'product' },
  { id: '1026', name: '许扬', dept: 'east' },
  { id: '1027', name: '郑安', dept: 'south' },
  { id: '1028', name: '严松', dept: 'sales' },
  { id: '1029', name: '马蕾', dept: 'ops' },
  { id: '1030', name: '钱佳', dept: 'finance' },
  { id: '1031', name: '夏禾', dept: 'product' },
  { id: '1032', name: '金旭', dept: 'east' },
];
// The demo directory stands in for a server-side, paginated lookup.
export function searchPeople(term: string, page = 1, excludeId?: string) {
  const query = term.trim();
  const matches = query
    ? people.filter(
        (p) => p.id !== excludeId && (p.name.includes(query) || p.id === query),
      )
    : [];
  const pageSize = 5;
  return {
    rows: matches.slice((page - 1) * pageSize, page * pageSize),
    total: matches.length,
    pageSize,
  };
}

const appIcons: Record<string, string> = {
  客户管理: 'smartcrm.png',
  经营报表: 'zhiji.svg',
  合同助手: 'zhiyue.svg',
  项目协同: 'zhixing.svg',
  费用报销: 'piao_in.png',
};
export const applications = Object.keys(appIcons);
export function appIcon(name: string) {
  return import.meta.env.BASE_URL + 'mate/apps/' + appIcons[name];
}
export const groups = ref<Group[]>([
  {
    id: 'sales-ops',
    code: 'GRP-001',
    enabled: true,
    name: '销售运营组',
    note: '销售线索、客户跟进与业绩分析',
    users: ['1001', '1005'],
    departments: ['south'],
    recursive: [],
    apps: ['客户管理', '经营报表'],
  },
  {
    id: 'east-sales',
    code: 'GRP-002',
    enabled: true,
    name: '华东业务组',
    note: '华东区域客户与合同协作',
    users: [],
    departments: ['east'],
    recursive: [],
    apps: ['客户管理', '合同助手'],
  },
  {
    id: 'review',
    code: 'GRP-003',
    enabled: true,
    name: '报表复核组',
    note: '区域经营数据核对与复核',
    users: ['1001', '1003'],
    departments: ['east'],
    recursive: [],
    apps: ['经营报表'],
  },
  {
    id: 'ops',
    code: 'GRP-004',
    enabled: true,
    name: '项目协作组',
    note: '跨团队项目进度与交付管理',
    users: ['1006'],
    departments: ['ops'],
    recursive: [],
    apps: ['项目协同'],
  },
  {
    id: 'finance',
    code: 'GRP-005',
    enabled: true,
    name: '财务结算组',
    note: '日常费用与结算审批',
    users: [],
    departments: ['finance'],
    recursive: [],
    apps: ['费用报销', '经营报表'],
  },
  {
    id: 'reserve',
    code: 'GRP-006',
    enabled: true,
    name: '销售储备组',
    note: '新入组销售人员的应用配置',
    users: [],
    departments: ['sales'],
    recursive: ['sales'],
    apps: [],
  },
]);
export const deptName = (id: string) =>
  departments.find((d) => d.id === id)?.name ?? id;
export const userName = (id: string) =>
  people.find((p) => p.id === id)?.name ?? id;

export function sources(group: Group, user: string) {
  const labels = group.users.includes(user) ? ['直接指定'] : [];
  let dept = people.find((p) => p.id === user)?.dept;
  let ancestor = false;
  while (dept) {
    if (
      group.departments.includes(dept) &&
      (!ancestor || group.recursive.includes(dept))
    ) {
      labels.push('部门 · ' + deptName(dept));
    }
    dept = departments.find((d) => d.id === dept)?.parent;
    ancestor = true;
  }
  return labels;
}
export function memberships(user: string, rows = groups.value) {
  return rows.filter((g) => g.enabled && sources(g, user).length > 0);
}
export function accessApps(user: string, rows = groups.value) {
  return [...new Set(memberships(user, rows).flatMap((g) => g.apps))];
}
export function afterTransfer(from: string, to: string, ids: string[]) {
  return groups.value.map((g) => {
    if (!ids.includes(g.id) || !g.users.includes(from)) return g;
    return {
      ...g,
      users: [...new Set([...g.users.filter((id) => id !== from), to])],
    };
  });
}
export const transferLog = ref<
  {
    time: string;
    operator: string;
    from: string;
    to: string;
    names: string[];
  }[]
>([]);
