import type { ExpenseCategory } from '../../types';

import { eventHandler } from 'h3';
import { useResponseSuccess } from '~/utils/response';

// 模拟费用科目树数据
const mockCategories: ExpenseCategory[] = [
  {
    id: '1',
    code: '6600',
    name: '差旅费',
    system: '通用',
    aliases: ['出差费用', '旅行费用', '出行费'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    children: [
      {
        id: '1-1',
        code: '6601',
        name: '交通费',
        parentId: '1',
        system: '通用',
        aliases: ['车费', '打车费', '机票', '火车票', '高铁票'],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
      {
        id: '1-2',
        code: '6602',
        name: '住宿费',
        parentId: '1',
        system: '通用',
        aliases: ['酒店费', '旅馆费', '住宿'],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
      {
        id: '1-3',
        code: '6603',
        name: '餐饮费',
        parentId: '1',
        system: '通用',
        aliases: ['餐费', '用餐费', '伙食费'],
        createdAt: '2024-01-15T08:00:00Z',
        updatedAt: '2024-01-15T08:00:00Z',
      },
    ],
  },
  {
    id: '2',
    code: '6700',
    name: '办公费',
    system: '通用',
    aliases: ['办公用品', '文具费', '办公耗材'],
    createdAt: '2024-01-16T09:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z',
    children: [
      {
        id: '2-1',
        code: '6701',
        name: '文具用品',
        parentId: '2',
        system: '通用',
        aliases: ['文具', '笔墨纸张', '办公文具'],
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-16T09:00:00Z',
      },
      {
        id: '2-2',
        code: '6702',
        name: '耗材费',
        parentId: '2',
        system: '通用',
        aliases: ['打印耗材', '墨盒', '硒鼓'],
        createdAt: '2024-01-16T09:00:00Z',
        updatedAt: '2024-01-16T09:00:00Z',
      },
    ],
  },
  {
    id: '3',
    code: '6800',
    name: '通讯费',
    system: '通用',
    aliases: ['电话费', '网费', '通信费'],
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-01-17T10:00:00Z',
  },
  {
    id: '4',
    code: '6900',
    name: '培训费',
    system: '通用',
    aliases: ['学习费', '教育费', '培训支出'],
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
  },
];

// GET 获取费用科目列表
export default eventHandler(() => {
  return useResponseSuccess(mockCategories);
});
