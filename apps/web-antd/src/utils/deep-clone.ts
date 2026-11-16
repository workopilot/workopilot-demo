/**
 * 深拷贝纯数据对象。
 *
 * 不能直接用 structuredClone：它无法克隆 Vue 响应式 Proxy（抛 DataCloneError），
 * 因此对响应式树（ref/reactive）取值克隆时统一走本函数，内部以 JSON 序列化实现。
 */
export function deepClone<T>(value: T): T {
  // structuredClone 会因 Vue 响应式 Proxy 抛 DataCloneError，此处必须用 JSON 方式
  // eslint-disable-next-line unicorn/prefer-structured-clone
  return JSON.parse(JSON.stringify(value)) as T;
}
