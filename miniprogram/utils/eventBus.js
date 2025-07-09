// utils/eventBus.js
class EventBus {
  constructor() {
    this.events = {};
  }

  // 监听事件
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  // 移除监听
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  // 触发事件
  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(...args));
  }
}

// 创建实例并挂载到 wx 对象
const eventBus = new EventBus();
wx.eventBus = eventBus;

// 导出实例（可选）
export default eventBus;