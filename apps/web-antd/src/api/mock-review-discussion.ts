import { reactive } from 'vue';
import { createMockResponse, mockDelay } from './mock-data';

export interface ReviewComment {
  id: string;
  author: string;
  text: string;
  time: string;
  parentId?: string;
}
interface ReviewDiscussion {
  likes: string[];
  comments: ReviewComment[];
}
const discussions = reactive<Record<string, ReviewDiscussion>>({});
export function discussionFor(key: string) {
  if (!discussions[key]) discussions[key] = { likes: [], comments: [] };
  return discussions[key]!;
}
export function toggleReviewLike(key: string, author: string) {
  const state = discussionFor(key);
  state.likes = state.likes.includes(author)
    ? state.likes.filter((name) => name !== author)
    : [...state.likes, author];
}
export async function addReviewComment(
  key: string,
  author: string,
  text: string,
  parentId?: string,
) {
  const state = discussionFor(key);
  if (!text.trim()) throw new Error('请先填写评论内容');
  if (parentId && !state.comments.some((comment) => comment.id === parentId))
    throw new Error('回复的评论不存在');
  await mockDelay(250);
  const comment: ReviewComment = {
    id: crypto.randomUUID(),
    author,
    text: text.trim(),
    parentId,
    time: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    }),
  };
  state.comments.push(comment);
  return createMockResponse(comment);
}
