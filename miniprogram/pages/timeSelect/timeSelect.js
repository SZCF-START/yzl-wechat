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
    selectedEndIndex: 0,
    // 记录 px 中的单项高度
    itemHeightPx: 0,
    dateRange: [], // 用于回显的时间戳数组
  },

  onLoad(options) {
    // 计算 1rpx = ?px
    const systemInfo = wx.getSystemInfoSync();
    // 1rpx = windowWidth / 750 px
    const rpxToPx = systemInfo.windowWidth / 750;
    // 每个 item 的高度是 60rpx，所以换算成 px
    const itemHeightPx = Math.floor(60 * rpxToPx);
    this.setData({ itemHeightPx });

    console.log(options,"44444444555555566");
    // 初始化时间列表（"00:00", "00:30", …, "23:30"）
    this.initTimeList();
    // 如果从其他页面传入了取/还车日期和时间，则初始化数据

    console.log("options.pickupDate:" + options.pickupDate);
    console.log("options.returnDate:" + options.returnDate);
    if (options.pickupDate && options.returnDate){
      this.setData({
        dateRange: [Number(options.pickupDate), Number(options.returnDate)],
      })
    }

    if (options.pickupDate) {
      // options.pickupDate 格式应为标准日期字符串
      this.setData({ startDateVal: Number(options.pickupDate) });
    }
    if (options.returnDate) {
      this.setData({ endDateVal: Number(options.returnDate) });
    }
    if (options.pickupTime) {
      const pickupTime = this.extractTime(options.pickupTime);
      this.setData({ startTimeRaw: pickupTime });
    }
    if (options.returnTime) {
      const returnTime = this.extractTime(options.returnTime);
      this.setData({ endTimeRaw: returnTime });
    }
    
    // 根据已有数据更新顶部显示
    this.updateDateDisplay();
    this.computeDuration();

    // 如果没有传入，使用默认时间
    if (!this.data.startTimeRaw) {
      this.setData({ startTimeRaw: '09:00' });
    }
    if (!this.data.endTimeRaw) {
      this.setData({ endTimeRaw: '07:30' });
    }
    
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

  onReady() {
    // 延时确保渲染完成
    setTimeout(() => {
      const startTimeIndex = this.data.timeList.indexOf(this.data.startTimeRaw);
      if (startTimeIndex !== -1) {
        const scrollTop = startTimeIndex * this.data.itemHeightPx;
        this.setData({ startScrollTop: scrollTop });
      }
      const endTimeIndex = this.data.timeList.indexOf(this.data.endTimeRaw);
      if (endTimeIndex !== -1) {
        const scrollTop = endTimeIndex * this.data.itemHeightPx;
        this.setData({ endScrollTop: scrollTop });
      }
    }, 100);
  },

  // 使用正则表达式提取时间部分
  extractTime(str) {
    const match = str.match(/\b\d{1,2}:\d{2}\b/); // 匹配 HH:mm 格式
    return match ? match[0] : "时间未找到";
  },

  // 转换函数
  convertToTimestamp(dateStr) {
    // 步骤1: 提取月份和日期（适配图片中的"03月14日"格式）
    const [_, month, day] = dateStr.match(/(\d{2})月(\d{2})日/);
    
    // 步骤2: 获取当前年（根据图片隐含的当年时间）
    const currentYear = new Date().getFullYear();
    
    // 步骤3: 创建Date对象（注意月份从0开始）
    const dateObj = new Date(currentYear, parseInt(month) - 1, parseInt(day));
    
    // 步骤4: 转换为时间戳（毫秒级）
    return dateObj.getTime();
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
        dateRange: [e.detail[0].getTime(), e.detail[1].getTime()],
        showCalendar: true,
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
      let startObj = new Date(Number(startDateVal));
      this.setData({
        startDateDisplay: this.formatMonthDay(startObj),
        startWeek: this.getWeek(startObj)
      });
    }
    if (endDateVal) {
      let endObj = new Date(Number(endDateVal));
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
        let index = snapped / this.data.itemHeightPx;
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
        let index = snapped / this.data.itemHeightPx;
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
    const itemHeight = this.data.itemHeightPx;
    const systemInfo = wx.getWindowInfo();
    let index = Math.floor(scrollTop / itemHeight);
    let sameDay = this.isSameDay(this.data.startDateVal,this.data.endDateVal);
    if (sameDay){
      let selectTime = this.data.timeList[index];
      // 获取当前时间并计算最近的半小时时间
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      
      // 处理分钟进位
      if (minutes >= 30) {
        hours += 1; // 超过30分钟进小时
        minutes = 0;
      } else {
        minutes = 30; // 不足30分钟补到30分
      }
      // 处理小时溢出（如23:30进小时会变成24点）
      if (hours >= 24) hours = 0;
      
      // 格式化成 HH:mm 字符串
      const currentTime = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // 比较时间字符串（HH:mm格式可直接比较）
      if (selectTime < currentTime) {
        selectTime = currentTime; // 选择时间早于当前时间，使用当前时间
      }
      let finalIndex = this.data.timeList.indexOf(selectTime);
      index = finalIndex;
    }
    
    const remainder = scrollTop - index * itemHeight;
    // 如果余数大于或等于15（即距离下一个 item 更近或等距），则吸附到下一个 item
    if (remainder >= itemHeight / 2) {
      index++;
    }
    return index * itemHeight;
  },

  isSameDay(timestamp1, timestamp2) {
    // 确保时间戳为毫秒（如为秒级则乘以1000）
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
  },

  // 计算总时长，结合日期与时间
  computeDuration() {
    const { startDateVal, endDateVal, startTimeRaw, endTimeRaw } = this.data;

    console.log("111",startDateVal, endDateVal, startTimeRaw, endTimeRaw ,"222");
    if (!startDateVal || !endDateVal) {
      this.setData({ totalDays: 0, totalHours: 0, dateRangeComplete: false });
      return;
    }
    let startObj = new Date(startDateVal);
    let endObj = new Date(endDateVal);
    // 解析时间字符串 "HH:mm"
    let [sh, sm] = startTimeRaw.split(':').map(Number);
    let [eh, em] = endTimeRaw.split(':').map(Number);
    startObj.setHours(sh, sm, 0, 0);
    endObj.setHours(eh, em, 0, 0);

    // 如果取还车是同一天，则只有当取车时间小于还车时间才有效
    if (startObj.toDateString() === endObj.toDateString()) {
      if (startObj.getTime() >= endObj.getTime()) {
        // 不满足条件：同一天取车时间不小于还车时间
        this.setData({ totalDays: 0, totalHours: 0, dateRangeComplete: false });
        return;
      }
    } else {
      // 如果跨天但出现结束时间小于开始时间，则认为跨天，自动加一天（可根据需求调整）
      if (endObj.getTime() < startObj.getTime()) {
        endObj.setDate(endObj.getDate() + 1);
      }
    }

    let diff = endObj.getTime() - startObj.getTime();
    const totalHours = Math.ceil(diff / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    this.setData({ totalDays: days, totalHours: hours, dateRangeComplete: true });
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
    const { startDateVal, endDateVal, startTimeRaw, endTimeRaw, startDateDisplay, endDateDisplay, startWeek, endWeek, totalDays, totalHours } = this.data;
    if (!startDateDisplay || !endDateDisplay) {
      wx.showToast({ title: '请选择完整的日期区间', icon: 'none' });
      return;
    }
    wx.showToast({
      title: `选择成功：${startDateDisplay}(${startWeek}) - ${endDateDisplay}(${endWeek})\n共${totalDays}天${totalHours}小时`,
      icon: 'none'
    });
    // 此处可传值给上一页或提交数据
    // 回传数据给上一页
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    if (prevPage) {
      prevPage.setData({
        pickupDateTimestamp: startDateVal,    // 取车日期（时间戳）
        pickupTime: startTimeRaw,      // 取车时间
        returnDateTimestamp: endDateVal,        // 还车日期（时间戳）
        returnTime: endTimeRaw         // 还车时间
      });
    }
    wx.navigateBack();
  }
});
