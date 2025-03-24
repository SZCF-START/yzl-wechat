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

    // 初始 scrollTop 值，默认选中中间项，比如第 0 项，也可以根据需要调整
    startScrollTop: 0,
    endScrollTop: 0,
    // 用于记录上次滚动位置
    lastStartScrollTop: 0,
    lastEndScrollTop: 0,
    // 定时器引用
    startScrollTimer: null,
    endScrollTimer: null,
    // 用于保存选中的时间 index
    selectedStartIndex: 0,
    selectedEndIndex: 0
  },

  onLoad() {
    // 初始化时间列表（"00:00", "00:30", …, "23:30"）
    this.initTimeList();
    // 如有默认选择可以在这里设置
    this.updateDateDisplay();
    this.setData({
      formatter: this.formatterFunction, // 在 onLoad 里绑定
    });
    // 根据需要初始化选中时间，比如默认选中时间列表中间项
    let defaultIndex = 0; // 或 Math.floor(this.data.timeList.length / 2)
    this.setData({
      startScrollTop: defaultIndex * 60,
      endScrollTop: defaultIndex * 60,
      selectedStartIndex: defaultIndex,
      selectedEndIndex: defaultIndex
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
    // times.push(''); // 前加空串
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        let hh = h < 10 ? '0' + h : '' + h;
        let mm = m === 0 ? '00' : '30';
        times.push(`${hh}:${mm}`);
      }
    }
    // times.push(''); // 后加空串
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

  // 取车时间滚动监听
  onStartTimeScrolling(e) {
    const current = e.detail.scrollTop;
    // 每次滚动时先清除之前的定时器
    if (this.data.startScrollTimer) {
      clearTimeout(this.data.startScrollTimer);
    }
    // 记录当前滚动位置
    this.setData({
      lastStartScrollTop: current
    });
    // 延时判断滚动是否停止
    this.data.startScrollTimer = setTimeout(() => {
      // 如果延时后上次记录的位置和当前相同，则认为停止滚动
      if (this.data.lastStartScrollTop === current) {
        const snapped = this.getSnappedScrollTop(current);
        this.setData({ startScrollTop: snapped });
        let index = snapped / 30;
        let time = this.data.timeList[index]
        console.log("取车时间滚动停止，吸附到：", time);
        this.setData({ startTimeRaw: time });
        this.computeDuration();
      }
    }, 100);
  },

  // 还车时间滚动监听
  onEndTimeScrolling(e) {
    const current = e.detail.scrollTop;
    if (this.data.endScrollTimer) {
      clearTimeout(this.data.endScrollTimer);
    }
    this.setData({
      lastEndScrollTop: current
    });
    this.data.endScrollTimer = setTimeout(() => {
      if (this.data.lastEndScrollTop === current) {
        const snapped = this.getSnappedScrollTop(current);
        this.setData({ endScrollTop: snapped });
        let index = snapped / 30;
        let time = this.data.timeList[index]
        console.log("还车时间滚动停止，吸附到：", time);
        this.setData({ endTimeRaw: time });
        this.computeDuration();
      }
    }, 100);
  },

  // 触摸结束时也触发吸附
  onStartScrollTouchEnd(e) {
    const current = e.detail.scrollTop;
    const snapped = this.getSnappedScrollTop(current);
    this.setData({ startScrollTop: snapped });
  },
  onEndScrollTouchEnd(e) {
    const current = e.detail.scrollTop;
    const snapped = this.getSnappedScrollTop(current);
    this.setData({ endScrollTop: snapped });
  },

  // 自动吸附算法：计算最接近的 item 位置（item 高度 30rpx）
  getSnappedScrollTop(scrollTop) {
    console.log("scrollTop:" + scrollTop);

    const systemInfo = wx.getWindowInfo();

    console.log("systemInfo:" + systemInfo.windowHeight);
    console.log("systemInfo:" + systemInfo.windowWidth);
    
    const rpxToPx = systemInfo.windowWidth / 750; // 1rpx 对应多少 px
    console.log("rpxToPx:" + rpxToPx);
    const itemHeight = 60 * rpxToPx; // 动态计算 item 高度
    console.log("itemHeight:" + itemHeight);

    let index = Math.floor(scrollTop / itemHeight);
    const remainder = scrollTop - index * itemHeight;
    // 如果余数大于或等于15（即距离下一个 item 更近或等距），则吸附到下一个 item
    if (remainder >= itemHeight / 2) {
      index++;
    }
    return index * itemHeight;
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
