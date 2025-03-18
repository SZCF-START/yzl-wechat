Page({
  data: {
    // 日期区间选择（van-calendar）相关
    minDate: new Date().getTime(),
    maxDate: new Date().getTime() + 90 * 24 * 60 * 60 * 1000, // 90天后
    startDateVal: null, // 取车日期（时间戳）
    endDateVal: null,   // 还车日期（时间戳）
    startDateDisplay: '', // 顶部显示格式 "03月28日"
    endDateDisplay: '',
    startWeek: '',    // 顶部显示星期，如 "周二"
    endWeek: '',

    // 时间选择（自定义滚动列表，半小时一档）
    timeList: [],
    startTimeRaw: '09:00', // 当前选中的取车时间
    endTimeRaw: '07:30',   // 当前选中的还车时间

    // 总时长（天、小时）
    totalDays: 0,
    totalHours: 0
  },

  onLoad() {
    // 初始化时间列表（"00:00", "00:30", …, "23:30"）
    this.initTimeList();
    // 如有默认选择可以在这里设置
    this.updateDateDisplay();
  },

  // 生成半小时增量的时间列表
  initTimeList() {
    let times = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        let hh = h < 10 ? '0' + h : '' + h;
        let mm = m === 0 ? '00' : '30';
        times.push(`${hh}:${mm}`);
      }
    }
    this.setData({ timeList: times });
  },

  // van-calendar 日期区间选择回调
  onSelectDate(e) {
    const dates = e.detail.date; // dates 为 Date 对象数组，长度为2时表示区间选择
    if (dates && dates.length === 2) {
      this.setData({
        startDateVal: dates[0].getTime(),
        endDateVal: dates[1].getTime()
      });
      this.updateDateDisplay();
      this.computeDuration();
    }
  },

  // 更新顶部日期显示和星期信息
  updateDateDisplay() {
    const { startDateVal, endDateVal, startTimeRaw, endTimeRaw } = this.data;
    if (startDateVal) {
      let startObj = new Date(startDateVal);
      this.setData({
        startDateDisplay: this.formatMonthDay(startObj),
        startWeek: this.getWeek(startObj)
      });
    }
    if (endDateVal) {
      let endObj = new Date(endDateVal);
      this.setData({
        endDateDisplay: this.formatMonthDay(endObj),
        endWeek: this.getWeek(endObj)
      });
    }
  },

  // 时间选择：取车时间点击
  chooseStartTime(e) {
    const time = e.currentTarget.dataset.time;
    this.setData({ startTimeRaw: time });
    this.computeDuration();
  },

  // 时间选择：还车时间点击
  chooseEndTime(e) {
    const time = e.currentTarget.dataset.time;
    this.setData({ endTimeRaw: time });
    this.computeDuration();
  },

  // 计算总时长，结合日期与时间
  computeDuration() {
    const { startDateVal, endDateVal, startTimeRaw, endTimeRaw } = this.data;
    if (!startDateVal || !endDateVal) {
      this.setData({ totalDays: 0, totalHours: 0 });
      return;
    }
    let startObj = new Date(startDateVal);
    let endObj = new Date(endDateVal);
    // 解析时间字符串 "HH:mm"
    let [sh, sm] = startTimeRaw.split(':').map(Number);
    let [eh, em] = endTimeRaw.split(':').map(Number);
    startObj.setHours(sh, sm, 0, 0);
    endObj.setHours(eh, em, 0, 0);
    let diff = endObj.getTime() - startObj.getTime();
    if (diff < 0) {
      // 若结束时间早于开始时间，视为跨天：加一天
      diff += 24 * 60 * 60 * 1000;
    }
    const totalHours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    this.setData({ totalDays: days, totalHours: hours });
  },

  // 工具方法：格式化日期为 "MM月DD日"
  formatMonthDay(dateObj) {
    let m = dateObj.getMonth() + 1;
    let d = dateObj.getDate();
    return `${m < 10 ? '0' + m : m}月${d < 10 ? '0' + d : d}日`;
  },

  // 工具方法：获取星期
  getWeek(dateObj) {
    const weekArr = ['周日','周一','周二','周三','周四','周五','周六'];
    return weekArr[dateObj.getDay()];
  },

  // 底部按钮：清空所有选择
  onClear() {
    // 重置所有日期和时间选择
    const now = new Date().getTime();
    this.setData({
      startDateVal: null,
      endDateVal: null,
      startDateDisplay: '',
      endDateDisplay: '',
      startWeek: '',
      endWeek: '',
      startTimeRaw: '09:00',
      endTimeRaw: '07:30',
      totalDays: 0,
      totalHours: 0
    });
  },

  // 底部按钮：确定后执行逻辑
  onConfirm() {
    const { startDateDisplay, endDateDisplay, startWeek, endWeek, totalDays, totalHours } = this.data;
    if (!startDateDisplay || !endDateDisplay) {
      wx.showToast({ title: '请选择完整的日期区间', icon: 'none' });
      return;
    }
    wx.showToast({
      title: `选择成功：${startDateDisplay}(${startWeek}) - ${endDateDisplay}(${endWeek})\n共${totalDays}天${totalHours}小时`,
      icon: 'none'
    });
    // 此处可传值给上一页或提交数据
    // const pages = getCurrentPages();
    // const prevPage = pages[pages.length - 2];
    // prevPage.setData({ ... });
    // wx.navigateBack();
  }
});
