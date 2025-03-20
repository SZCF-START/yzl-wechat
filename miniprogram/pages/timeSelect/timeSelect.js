Page({
  data: {
    formatter: null,
    // 日期区间选择（van-calendar）相关
    minDate: new Date().getTime(),
    maxDate: new Date().getTime() + 90 * 24 * 60 * 60 * 1000, // 90天后
    startDateVal: null, // 取车日期（时间戳）
    endDateVal: null,   // 还车日期（时间戳）
    startDateDisplay: '', // 顶部显示格式 "03月28日"
    endDateDisplay: '',
    startWeek: '',    // 顶部显示星期，如 "周二"
    endWeek: '',
    dateRangeComplete: false, //是否已完整选择日期区间

    // 时间选择（自定义滚动列表，半小时一档）
    timeList: [],
    startTimeRaw: '09:00', // 当前选中的取车时间
    endTimeRaw: '07:30',   // 当前选中的还车时间

    // 总时长（天、小时）
    totalDays: 0,
    totalHours: 0,

    // 每行高度（单位统一，这里假设 60rpx 或 60px）
    itemHeight: 60,
    // 左侧（取车时间）的滚动位置
    startScrollTop: 0,
    // 右侧（还车时间）的滚动位置
    endScrollTop: 0
  },

  onLoad() {
    // 初始化时间列表（"00:00", "00:30", …, "23:30"）
    this.initTimeList();
    // 如有默认选择可以在这里设置
    this.updateDateDisplay();
    this.setData({
      formatter: this.formatterFunction, // 在 onLoad 里绑定
    });
  },

  formatterFunction(day) {
    if (day.type === 'start') {
      day.bottomInfo = '取车'; // 修改开始的文本
    }
    if (day.type === 'end') {
      day.bottomInfo = '还车'; // 修改结束的文本
    }
    if (day.type === 'start-end') {
      day.bottomInfo = '取/还车'; // 适用于同一天取车还车
    }
    return day;
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
    if (e.detail && e.detail[0] && e.detail[1]) {
      this.setData({
        startDateVal: e.detail[0].getTime(),
        endDateVal: e.detail[1].getTime(),
        dateRangeComplete: true
      });
      this.updateDateDisplay();
      this.computeDuration();
    }else{
      this.setData({ dateRangeComplete: false });
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

  onStartScrollEnd(e) {
    // 获取当前滚动位置（注意：微信小程序 scroll-view 的 scrollTop 单位为 px，需要结合设计稿与机型进行换算，这里假设 1rpx=1px）
    let scrollTop = e.detail.scrollTop;
    let remainder = scrollTop % 60;
    let adjustment = remainder < 30 ? -remainder : (60 - remainder);
    // 自动校准到最近的整行
    this.setData({
      startScrollTop: scrollTop + adjustment,
      startIndex: Math.round((scrollTop + adjustment) / 60)
    });
  },

  onEndScrollEnd(e) {
    let scrollTop = e.detail.scrollTop;
    let remainder = scrollTop % 60;
    let adjustment = remainder < 30 ? -remainder : (60 - remainder);
    this.setData({
      endScrollTop: scrollTop + adjustment,
      endIndex: Math.round((scrollTop + adjustment) / 60)
    });
  },

  // 监听取车时间滚动
  onStartTimeScroll(e) {
    let scrollTop = e.detail.scrollTop;
    let index = Math.floor(scrollTop / 50); // 50rpx 近似为每个 item 的高度
    let time = this.data.timeList[index] || this.data.startTime;
    this.setData({ startTimeRaw: time });
    this.computeDuration();
  },

  // 监听还车时间滚动
  onEndTimeScroll(e) {
    let scrollTop = e.detail.scrollTop;
    let index = Math.floor(scrollTop / 50);
    let time = this.data.timeList[index] || this.data.endTime;
    this.setData({ endTimeRaw: time });
    this.computeDuration();
  },

  // 左侧滚动过程中记录当前滚动位置
  onStartTimeScrolling(e) {
    this.setData({
      startScrollTop: e.detail.scrollTop
    });
  },

  // 右侧滚动过程中记录当前滚动位置
  onEndTimeScrolling(e) {
    this.setData({
      endScrollTop: e.detail.scrollTop
    });
  },

  // 左侧滚动结束后吸附到最近整行
  onStartScrollTouchEnd(e) {
    this.adjustScroll("start");
  },

  // 右侧滚动结束后吸附到最近整行
  onEndScrollTouchEnd(e) {
    this.adjustScroll("end");
  },

  // 自动吸附逻辑：根据当前 scrollTop 对齐到最近的整行
  adjustScroll(type) {
    let scrollTop = type === "start" ? this.data.startScrollTop : this.data.endScrollTop;
    const { itemHeight, timeList } = this.data;
    // 计算最近的行索引
    const index = Math.round(scrollTop / itemHeight);
    const finalIndex = Math.min(Math.max(index, 0), timeList.length - 1);
    const finalScrollTop = finalIndex * itemHeight;

    if (type === "start") {
      this.setData({
        startScrollTop: finalScrollTop
      });
    } else {
      this.setData({
        endScrollTop: finalScrollTop
      });
    }
  },

  // 计算总时长，结合日期与时间
  computeDuration() {
    const { startDateVal, endDateVal, startTimeRaw, endTimeRaw } = this.data;

    console.log("111",startDateVal, endDateVal, startTimeRaw, endTimeRaw ,"222");
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
      totalHours: 0,
      dateRangeComplete: false
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
