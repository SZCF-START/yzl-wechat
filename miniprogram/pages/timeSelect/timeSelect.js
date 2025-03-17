Page({
  data: {
    showCalendar: false,
    minDate: new Date().getTime(), // 可选的最早日期
    maxDate: new Date().getTime() + 60 * 24 * 60 * 60 * 1000, // 60天后
  },

  // 显示日历
  showCalendar() {
    this.setData({ showCalendar: true });
  },

  // 取消选择
  onCancel() {
    this.setData({ showCalendar: false });
  },

  // 确定日期区间
  onConfirm(event) {
    const [start, end] = event.detail; // start、end为时间戳
    // TODO: 在这里处理你的开始/结束日期逻辑
    // 例如：转换为 "YYYY-MM-DD" 等格式，保存到 data 并回到上一页
    this.setData({ showCalendar: false });
  },
});
