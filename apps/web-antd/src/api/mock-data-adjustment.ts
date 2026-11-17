import { createMockResponse, mockDelay } from './mock-data';

export interface AdjustmentStat {
  label: string;
  value: number;
  color: string;
  icon: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  url: string; // Image URL placeholder
  pageIndex: number; // File sequence number (1-based)
  classificationId: string;
  classificationName: string;
  isContract: boolean;
  contractGroupId?: string; // For grouping pages of the same contract
}

export interface AttachmentCategory {
  id: string;
  name: string;
  color?: string;
}

// Mock Categories
export const mockCategories: AttachmentCategory[] = [
  { id: '1', name: '发票', color: 'blue' },
  { id: '2', name: '合同', color: 'orange' },
  { id: '3', name: '凭证', color: 'green' },
  { id: '4', name: '银行回单', color: 'cyan' },
  { id: '5', name: '未分类', color: 'gray' },
];

// Mock Stats
export const mockStats: AdjustmentStat[] = [
  { label: '附件总数', value: 15, color: 'text-primary', icon: 'lucide:files' },
  {
    label: '合同数',
    value: 2,
    color: 'text-orange-500',
    icon: 'lucide:file-signature',
  },
  { label: '发票数', value: 5, color: 'text-blue-500', icon: 'lucide:receipt' },
  {
    label: '凭证数',
    value: 3,
    color: 'text-green-500',
    icon: 'lucide:file-check',
  },
];

const demoImages = [
  `${import.meta.env.BASE_URL}demo/1.png`,
  `${import.meta.env.BASE_URL}demo/2.png`,
  `${import.meta.env.BASE_URL}demo/3.png`,
  `${import.meta.env.BASE_URL}demo/4.png`,
  `${import.meta.env.BASE_URL}demo/5.jpg`,
  `${import.meta.env.BASE_URL}demo/6.png`,
];

const getRandomImage = () => {
  const index = Math.floor(Math.random() * demoImages.length);
  return demoImages[index];
};

// Mock Files
const generateFiles = (): AttachmentFile[] => {
  const files: AttachmentFile[] = [];

  // 1-4: Invoices
  for (let i = 1; i <= 4; i++) {
    files.push({
      id: `file-${i}`,
      name: `发票-${i}.jpg`,
      url: getRandomImage(),
      pageIndex: i,
      classificationId: '1',
      classificationName: '发票',
      isContract: false,
    });
  }

  // 5-7: Contract 1
  for (let i = 5; i <= 7; i++) {
    files.push({
      id: `file-${i}`,
      name: `合同1-页${i - 4}.jpg`,
      url: getRandomImage(),
      pageIndex: i,
      classificationId: '2',
      classificationName: '合同',
      isContract: true,
      contractGroupId: 'c1',
    });
  }

  // 8: Invoice
  files.push({
    id: `file-8`,
    name: `发票-5.jpg`,
    url: getRandomImage(),
    pageIndex: 8,
    classificationId: '1',
    classificationName: '发票',
    isContract: false,
  });

  // 9-11: Contract 2
  for (let i = 9; i <= 11; i++) {
    files.push({
      id: `file-${i}`,
      name: `合同2-页${i - 8}.jpg`,
      url: getRandomImage(),
      pageIndex: i,
      classificationId: '2',
      classificationName: '合同',
      isContract: true,
      contractGroupId: 'c2',
    });
  }

  // 12-14: Vouchers
  for (let i = 12; i <= 14; i++) {
    files.push({
      id: `file-${i}`,
      name: `凭证-${i - 11}.jpg`,
      url: getRandomImage(),
      pageIndex: i,
      classificationId: '3',
      classificationName: '凭证',
      isContract: false,
    });
  }

  // 15: Unclassified
  files.push({
    id: `file-15`,
    name: `未知文件.jpg`,
    url: getRandomImage(),
    pageIndex: 15,
    classificationId: '5',
    classificationName: '未分类',
    isContract: false,
  });

  return files;
};

export const mockFiles = generateFiles();

// APIs
export async function getAdjustmentStatsApi() {
  await mockDelay();
  return createMockResponse(mockStats);
}

export async function getAdjustmentFilesApi() {
  await mockDelay();
  return createMockResponse(mockFiles);
}

export async function getAdjustmentCategoriesApi() {
  await mockDelay();
  return createMockResponse(mockCategories);
}

export async function updateFileClassificationApi(
  fileId: string,
  classificationId: string,
) {
  await mockDelay(200);
  const file = mockFiles.find((f) => f.id === fileId);
  const category = mockCategories.find((c) => c.id === classificationId);

  if (file && category) {
    file.classificationId = category.id;
    file.classificationName = category.name;
    return createMockResponse(file);
  }
  throw new Error('File or Category not found');
}
