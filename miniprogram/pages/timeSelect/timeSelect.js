// 工具函数模块
const utils = {
  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 节流函数
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  },

  // 格式化日期为 "MM月DD日"
  formatMonthDay(dateObj) {
    let m = dateObj.getMonth() + 1;
    let d = dateObj.getDate();
    return `${m < 10 ? '0' + m : m}月${d < 10 ? '0' + d : d}日`;
  },

  // 获取星期
  getWeek(dateObj) {
    const weekArr = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
    return weekArr[dateObj.getDay()];
  },

  // 格式化时间
  formatTime(date) {
    let newTime = date;
    let hours = newTime.getHours().toString().padStart(2, '0');
    let minutes = newTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 组合日期时间
  combineDateTime(timestamp, timeStr) {
    const date = new Date(timestamp);
    let timePart = timeStr;
    if (timeStr.includes(' ')) {
      const [_, tmpTime] = timeStr.split(' ');
      timePart = tmpTime;
    }
    const [hours, minutes] = timePart.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  },

  // 判断是否为同一天
  isSameDay(timestamp1, timestamp2) {
    if (typeof timestamp2 === 'undefined' || timestamp2 === null) return false;
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  },

  // 判断是否为今天或同一天
  isSameDayOrToday(timestamp1, timestamp2) {
    const date1 = new Date(timestamp1);
    const today = new Date();
    
    const isToday = 
      date1.getFullYear() === today.getFullYear() &&
      date1.getMonth() === today.getMonth() &&
      date1.getDate() === today.getDate();

    if (isToday) return true;

    if (typeof timestamp2 === 'undefined' || timestamp2 === null) return false;

    const date2 = new Date(timestamp2);
    
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
};

Page({
  data: {
    // 日期区间选择相关
    minDate: new Date().getTime(),
    maxDate: new Date().getTime() + 90 * 24 * 60 * 60 * 1000, // 90天后
    startDateVal: null, // 取车日期（时间戳）
    endDateVal: null,   // 还车日期（时间戳）
    startDateDisplay: '', // 顶部显示格式 "07月08日"
    endDateDisplay: '',
    startWeek: '',    // 顶部显示星期
    endWeek: '',
    dateRangeComplete: false, // 是否已完整选择日期区间

    // 日历月份数据
    calendarMonths: [],

    // 时间选择相关
    timeList: [],
    startTimeRaw: '', // 当前选中的取车时间
    endTimeRaw: '',   // 当前选中的还车时间
    startTimeRaw1: '', 
    endTimeRaw1: '',   

    // 总时长
    totalDays: 0,
    totalHours: 0,

    // 滚动相关
    startScrollTop: 0,
    endScrollTop: 0,
    lastStartScrollTop: 0,
    lastEndScrollTop: 0,
    startScrollTimer: null,
    endScrollTimer: null,
    selectedStartIndex: 0,
    selectedEndIndex: 0,
    itemHeightPx: 0,

    // 页面状态
    sourceUrl: '',
    isLoading: false,
    lastTapTime: 0,
    isDateSelected: false, // 是否已选中日期
    dateSelectionMode: 'start', // 日期选择模式：'start', 'end', 'range'
    tempSelectedDate: null // 临时存储的日期
  },

  onLoad(options) {
    console.log("timeSelect onLoad", options);
    this.setData({ isLoading: true });

    try {
      // 计算item高度
      const systemInfo = wx.getSystemInfoSync();
      const rpxToPx = systemInfo.windowWidth / 750;
      const itemHeightPx = Math.floor(60 * rpxToPx);
      this.setData({ itemHeightPx });

      // 初始化时间列表
      this.initTimeList();
      
      // 初始化日历数据
      this.initCalendarData();
      
      // 处理传入参数
      this.initOptionsData(options);
      
      // 初始化默认选中
      let defaultIndex = 0;
      this.setData({
        startScrollTop: defaultIndex * 60,
        endScrollTop: defaultIndex * 60,
        selectedStartIndex: defaultIndex,
        selectedEndIndex: defaultIndex
      });

    } catch (error) {
      console.error('页面初始化失败:', error);
      this.showErrorToast('页面初始化失败');
    } finally {
      this.setData({ isLoading: false });
    }
  },

  onReady() {
    // 延时确保渲染完成后更新滚动位置
    setTimeout(() => {
      this.updateScrollPosition();
      
      // 如果有传入的时间数据，需要同步滚动位置
      if (this.data.startTimeRaw && this.data.endTimeRaw) {
        const startTimeIndex = this.data.timeList.indexOf(this.data.startTimeRaw);
        const endTimeIndex = this.data.timeList.indexOf(this.data.endTimeRaw);
        
        if (startTimeIndex !== -1) {
          const startScrollTop = startTimeIndex * this.data.itemHeightPx;
          this.setData({ 
            startScrollTop: startScrollTop,
            selectedStartIndex: startTimeIndex
          });
        }
        
        if (endTimeIndex !== -1) {
          const endScrollTop = endTimeIndex * this.data.itemHeightPx;
          this.setData({ 
            endScrollTop: endScrollTop,
            selectedEndIndex: endTimeIndex 
          });
        }
      }
    }, 200);
  },

  // 初始化传入参数
  initOptionsData(options) {
    if (options.source) {
      this.setData({ sourceUrl: decodeURIComponent(options.source) });
    }
    
    console.log("传入的参数:", options);
    
    // 如果有传入的日期参数（时间戳），解析并设置
    if (options.pickupDate && options.returnDate) {
      const pickupTimestamp = Number(options.pickupDate);
      const returnTimestamp = Number(options.returnDate);
      
      console.log("解析时间戳:", { pickupTimestamp, returnTimestamp });
      
      // 从时间戳中提取日期部分（设置为当天0点）
      const pickupDate = new Date(pickupTimestamp);
      const returnDate = new Date(returnTimestamp);
      
      const pickupDateOnly = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate()).getTime();
      const returnDateOnly = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate()).getTime();
      
      // 提取时间部分
      const pickupTimeStr = utils.formatTime(pickupDate);
      const returnTimeStr = utils.formatTime(returnDate);
      
      // 查找时间在列表中的索引
      const pickupTimeIndex = this.data.timeList.indexOf(pickupTimeStr);
      const returnTimeIndex = this.data.timeList.indexOf(returnTimeStr);
      
      this.setData({
        startDateVal: pickupDateOnly,
        endDateVal: returnDateOnly,
        startTimeRaw: pickupTimeStr,
        endTimeRaw: returnTimeStr,
        startTimeRaw1: pickupTimeStr,
        endTimeRaw1: returnTimeStr,
        selectedStartIndex: pickupTimeIndex !== -1 ? pickupTimeIndex : 0,
        selectedEndIndex: returnTimeIndex !== -1 ? returnTimeIndex : 0,
        dateRangeComplete: true,
        isDateSelected: true
      });
      
      // 更新日历显示
      this.updateCalendarDisplay();
      
      // 根据已有数据更新顶部显示
      this.updateDateDisplay();
      this.computeDuration();
      
      console.log("设置完成的数据:", {
        startDateVal: pickupDateOnly,
        endDateVal: returnDateOnly,
        startTimeRaw: pickupTimeStr,
        endTimeRaw: returnTimeStr
      });
      
    } else {
      // 进入页面时未选中任何日期
      this.setData({
        startDateVal: null,
        endDateVal: null,
        dateRangeComplete: false,
        isDateSelected: false,
        dateSelectionMode: 'start'
      });
    }
  },

  // 初始化日历数据
  initCalendarData() {
    const months = [];
    const today = new Date();
    
    // 生成接下来3个月的日历数据
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthData = this.generateMonthData(monthDate);
      months.push(monthData);
    }
    
    this.setData({ calendarMonths: months });
  },

  // 生成单个月份的日历数据
  generateMonthData(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const monthTitle = `${year}年${month + 1 < 10 ? '0' + (month + 1) : month + 1}月`;
    
    // 获取当月第一天是星期几
    const firstDay = new Date(year, month, 1).getDay();
    // 获取当月天数
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    const today = new Date();
    
    // 添加前面的空白天
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', class: 'empty', timestamp: null });
    }
    
    // 添加当月的天
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      const timestamp = dayDate.getTime();
      
      let dayClass = '';
      
      // 判断是否为今天
      if (this.isSameDate(dayDate, today)) {
        dayClass += ' today';
      }
      
      // 判断是否小于今天（禁用）
      if (dayDate < today.setHours(0, 0, 0, 0)) {
        dayClass += ' disabled';
      }
      
      // 判断选中状态
      if (this.data.startDateVal && this.data.endDateVal) {
        if (timestamp === this.data.startDateVal && timestamp === this.data.endDateVal) {
          dayClass += ' start-end-same';
        } else if (timestamp === this.data.startDateVal) {
          dayClass += ' start-date';
        } else if (timestamp === this.data.endDateVal) {
          dayClass += ' end-date';
        } else if (timestamp > this.data.startDateVal && timestamp < this.data.endDateVal) {
          dayClass += ' in-range';
        }
      }
      
      days.push({
        day: day,
        class: dayClass.trim(),
        timestamp: timestamp
      });
    }
    
    return {
      title: monthTitle,
      month: month,
      days: days
    };
  },

  // 更新日历显示状态
  updateCalendarDisplay() {
    console.log('更新日历显示，当前数据:', {
      startDateVal: this.data.startDateVal,
      endDateVal: this.data.endDateVal
    });
    
    const months = this.data.calendarMonths.map(monthData => {
      const updatedDays = monthData.days.map(day => {
        if (!day.timestamp) return day;
        
        // 清除之前的选中状态
        let dayClass = day.class.replace(/\s*(start-date|end-date|start-end-same|in-range)\s*/g, ' ').trim();
        
        // 重新判断选中状态
        if (this.data.startDateVal && this.data.endDateVal) {
          if (day.timestamp === this.data.startDateVal && day.timestamp === this.data.endDateVal) {
            dayClass += ' start-end-same';
          } else if (day.timestamp === this.data.startDateVal) {
            dayClass += ' start-date';
          } else if (day.timestamp === this.data.endDateVal) {
            dayClass += ' end-date';
          } else if (day.timestamp > this.data.startDateVal && day.timestamp < this.data.endDateVal) {
            dayClass += ' in-range';
          }
        } else if (this.data.startDateVal && day.timestamp === this.data.startDateVal) {
          // 只有开始日期时也要显示选中状态
          dayClass += ' start-date';
        }
        
        return { ...day, class: dayClass.trim() };
      });
      
      return { ...monthData, days: updatedDays };
    });
    
    this.setData({ calendarMonths: months });
    console.log('日历显示更新完成');
  },

  // 判断是否为同一天
  isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  },

  // 日期点击事件
  onDateTap(e) {
    const timestamp = e.currentTarget.dataset.date;
    if (!timestamp) return;
    
    const today = new Date().setHours(0, 0, 0, 0);
    if (timestamp < today) return; // 禁用过去的日期
    
    console.log('点击日期:', new Date(timestamp), '当前状态:', {
      isDateSelected: this.data.isDateSelected,
      dateRangeComplete: this.data.dateRangeComplete,
      startDateVal: this.data.startDateVal,
      endDateVal: this.data.endDateVal
    });
    
    // 如果已经有完整的日期选择，点击任意日期都重新开始选择
    if (this.data.isDateSelected && this.data.dateRangeComplete) {
      console.log('重新开始选择，第一次点击');
      // 重新开始选择，立即设置第一个日期为取车日期
      this.setData({
        startDateVal: timestamp,
        endDateVal: null,
        startTimeRaw: '',
        endTimeRaw: '',
        startTimeRaw1: '',
        endTimeRaw1: '',
        dateRangeComplete: false,
        isDateSelected: false,
        dateSelectionMode: 'end'
      });
      
      // 立即设置默认时间并更新显示
      this.setDefaultTimeForDate(timestamp, 'start');
      
      // 立即更新日历显示，确保选中状态可见
      this.updateCalendarDisplay();
      this.updateDateDisplayOnly();
      
    } else if (!this.data.startDateVal && !this.data.endDateVal) {
      console.log('首次选择，第一次点击');
      // 第一次选择日期，立即选中为取车日期
      this.setData({
        startDateVal: timestamp,
        dateSelectionMode: 'end'
      });
      
      // 设置默认时间
      this.setDefaultTimeForDate(timestamp, 'start');
      
      // 立即更新显示
      this.updateCalendarDisplay();
      this.updateDateDisplayOnly();
      
    } else if (this.data.startDateVal && !this.data.endDateVal) {
      console.log('第二次选择');
      // 第二次选择日期，根据时间大小自动判断取车还车
      if (timestamp === this.data.startDateVal) {
        console.log('选择同一天');
        // 选择同一天
        this.setData({
          endDateVal: timestamp,
          dateRangeComplete: true,
          isDateSelected: true,
          dateSelectionMode: 'range'
        });
        // 设置默认时间，还车时间比取车时间晚一些
        this.setDefaultTimeForDate(timestamp, 'end', true);
        
      } else if (timestamp > this.data.startDateVal) {
        console.log('第二次选择日期较晚，第一次是取车，第二次是还车');
        // 选择的日期晚于第一次选择，第一次是取车，第二次是还车
        this.setData({
          endDateVal: timestamp,
          dateRangeComplete: true,
          isDateSelected: true,
          dateSelectionMode: 'range'
        });
        this.setDefaultTimeForDate(timestamp, 'end');
        
      } else {
        console.log('第二次选择日期较早，需要调换：第二次变成取车，第一次变成还车');
        // 选择的日期早于第一次选择，第二次选择变成取车，第一次选择变成还车
        const originalStartTime = this.data.startTimeRaw1;
        const originalStartDate = this.data.startDateVal;
        
        this.setData({
          startDateVal: timestamp,      // 第二次选择的（更早的）变成取车
          endDateVal: originalStartDate, // 第一次选择的（更晚的）变成还车
          dateRangeComplete: true,
          isDateSelected: true,
          dateSelectionMode: 'range'
        });
        
        // 重新设置时间：新的取车日期设置默认时间
        this.setDefaultTimeForDate(timestamp, 'start');
        
        // 原来的取车时间变成还车时间
        if (originalStartTime) {
          this.setData({
            endTimeRaw: originalStartTime,
            endTimeRaw1: originalStartTime,
            selectedEndIndex: this.data.timeList.indexOf(originalStartTime)
          });
        } else {
          this.setDefaultTimeForDate(originalStartDate, 'end');
        }
      }
      
      // 更新显示
      this.updateCalendarDisplay();
      this.updateDateDisplayOnly();
    }
    
    this.computeDuration();
    
    // 如果选择完成，自动调整时间选择器
    if (this.data.dateRangeComplete) {
      setTimeout(() => {
        this.updateTimeScrollPosition();
      }, 150);
    }
    
    console.log('选择完成后的状态:', {
      startDateVal: this.data.startDateVal,
      endDateVal: this.data.endDateVal,
      dateRangeComplete: this.data.dateRangeComplete
    });
  },

  // 为选中的日期设置默认时间
  setDefaultTimeForDate(timestamp, type, isSameDay = false) {
    const date = new Date(timestamp);
    const now = new Date();
    
    let defaultTime = '09:00'; // 默认时间
    
    // 如果是今天，使用当前时间的下一个半小时
    if (this.isSameDate(date, now)) {
      let hours = now.getHours();
      let minutes = now.getMinutes();
      
      if (minutes >= 30) {
        hours += 1;
        minutes = 0;
      } else {
        minutes = 30;
      }
      
      if (hours >= 24) hours = 0;
      defaultTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    
    // 如果是同一天还车，时间比取车时间晚2小时
    if (isSameDay && type === 'end') {
      const startTime = this.data.startTimeRaw1;
      if (startTime) {
        const [hours, minutes] = startTime.split(':').map(Number);
        let newHours = hours + 2;
        if (newHours >= 24) newHours = 23;
        defaultTime = `${String(newHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    
    const timeIndex = this.data.timeList.indexOf(defaultTime);
    
    if (type === 'start') {
      this.setData({
        startTimeRaw: defaultTime,
        startTimeRaw1: defaultTime,
        selectedStartIndex: timeIndex !== -1 ? timeIndex : 0
      });
    } else {
      this.setData({
        endTimeRaw: defaultTime,
        endTimeRaw1: defaultTime,
        selectedEndIndex: timeIndex !== -1 ? timeIndex : 0
      });
    }
  },

  // 更新时间选择器滚动位置
  updateTimeScrollPosition() {
    const startTimeIndex = this.data.selectedStartIndex;
    const endTimeIndex = this.data.selectedEndIndex;
    
    if (startTimeIndex !== -1) {
      const startScrollTop = startTimeIndex * this.data.itemHeightPx;
      this.setData({ startScrollTop: startScrollTop });
    }
    
    if (endTimeIndex !== -1) {
      const endScrollTop = endTimeIndex * this.data.itemHeightPx;
      this.setData({ endScrollTop: endScrollTop });
    }
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
    console.log("生成时间列表:", times);
    this.setData({ timeList: times });
  },

  // 更新滚动位置
  updateScrollPosition() {
    const startTimeIndex = this.data.timeList.indexOf(this.data.startTimeRaw);
    if (startTimeIndex !== -1) {
      const scrollTop = startTimeIndex * this.data.itemHeightPx;
      this.setData({ 
        startScrollTop: scrollTop,
        selectedStartIndex: startTimeIndex
      });
    }
    
    const endTimeIndex = this.data.timeList.indexOf(this.data.endTimeRaw);
    if (endTimeIndex !== -1) {
      const scrollTop = endTimeIndex * this.data.itemHeightPx;
      this.setData({ 
        endScrollTop: scrollTop,
        selectedEndIndex: endTimeIndex 
      });
    }
  },

  // 更新顶部日期显示和星期信息（包含传入的时间）
  updateDateDisplay() {
    const { startDateVal, endDateVal, startTimeRaw, endTimeRaw } = this.data;
    
    if (startDateVal) {
      let startObj = new Date(Number(startDateVal));
      this.setData({
        startDateDisplay: utils.formatMonthDay(startObj),
        startWeek: utils.getWeek(startObj)
      });
      
      // 如果没有时间数据，使用默认时间
      if (!startTimeRaw) {
        this.setData({
          startTimeRaw: utils.formatTime(startObj),
          startTimeRaw1: utils.formatTime(startObj)
        });
      }
    }
    
    if (endDateVal) {
      let endObj = new Date(Number(endDateVal));
      this.setData({
        endDateDisplay: utils.formatMonthDay(endObj),
        endWeek: utils.getWeek(endObj)
      });
      
      // 如果没有时间数据，使用默认时间
      if (!endTimeRaw) {
        this.setData({
          endTimeRaw: utils.formatTime(endObj),
          endTimeRaw1: utils.formatTime(endObj)
        });
      }
    }
  },

  // 仅更新日期显示（不更新时间）
  updateDateDisplayOnly() {
    const { startDateVal, endDateVal } = this.data;
    if (startDateVal) {
      let startObj = new Date(Number(startDateVal));
      this.setData({
        startDateDisplay: utils.formatMonthDay(startObj),
        startWeek: utils.getWeek(startObj)
      });
    }
    if (endDateVal) {
      let endObj = new Date(Number(endDateVal));
      this.setData({
        endDateDisplay: utils.formatMonthDay(endObj),
        endWeek: utils.getWeek(endObj)
      });
    }
  },

  // 防重复点击函数
  preventRepeatedTap(callback, delay = 1000) {
    const now = Date.now();
    if (now - this.data.lastTapTime < delay) {
      return false;
    }
    this.setData({ lastTapTime: now });
    return callback();
  },

  // 时间项点击事件
  onTimeItemTap(e) {
    const { index, time, type } = e.currentTarget.dataset;
    const scrollTop = index * this.data.itemHeightPx;
    
    if (type === 'start') {
      this.setData({
        startScrollTop: scrollTop,
        selectedStartIndex: index,
        startTimeRaw: time,
        startTimeRaw1: time
      });
    } else {
      this.setData({
        endScrollTop: scrollTop,
        selectedEndIndex: index,
        endTimeRaw: time,
        endTimeRaw1: time
      });
    }
    
    this.computeDuration();
  },

  // 取车时间滚动监听 - 使用节流优化
  onStartTimeScrolling: utils.throttle(function(e) {
    const current = e.detail.scrollTop;
    // 每次滚动时先清除之前的定时器
    if (this.data.startScrollTimer) {
      clearTimeout(this.data.startScrollTimer);
    }
    // 记录当前滚动位置
    this.setData({
      lastStartScrollTop: current
    });
    
    // 实时更新选中状态
    const index = Math.round(current / this.data.itemHeightPx);
    this.setData({ selectedStartIndex: index });
    
    // 延时判断滚动是否停止
    this.data.startScrollTimer = setTimeout(() => {
      // 如果延时后上次记录的位置和当前相同，则认为停止滚动
      if (this.data.lastStartScrollTop === current) {
        const snapped = this.getSnappedScrollTop(current, "start");
        this.setData({ startScrollTop: snapped });
        let index = snapped / this.data.itemHeightPx;
        let time = this.data.timeList[index];
        console.log("取车时间滚动停止，吸附到：", time);
        this.setData({ 
          startTimeRaw: time,
          startTimeRaw1: time,
          selectedStartIndex: index
        });
        this.computeDuration();
      }
    }, 100);
  }, 50),

  // 还车时间滚动监听 - 使用节流优化
  onEndTimeScrolling: utils.throttle(function(e) {
    const current = e.detail.scrollTop;
    if (this.data.endScrollTimer) {
      clearTimeout(this.data.endScrollTimer);
    }
    this.setData({
      lastEndScrollTop: current
    });
    
    // 实时更新选中状态
    const index = Math.round(current / this.data.itemHeightPx);
    this.setData({ selectedEndIndex: index });
    
    this.data.endScrollTimer = setTimeout(() => {
      if (this.data.lastEndScrollTop === current) {
        const snapped = this.getSnappedScrollTop(current, "end");
        this.setData({ endScrollTop: snapped });
        let index = snapped / this.data.itemHeightPx;
        let time = this.data.timeList[index];
        console.log("还车时间滚动停止，吸附到：", time);
        this.setData({ 
          endTimeRaw: time,
          endTimeRaw1: time,
          selectedEndIndex: index
        });
        this.computeDuration();
      }
    }, 100);
  }, 50),

  // 吸附函数
  adsorb(snapped, type) {
    if (type === "startScrollTop") {
      this.setData({ startScrollTop: snapped });
    } else { 
      this.setData({ endScrollTop: snapped });
    }

    let index = snapped / this.data.itemHeightPx;
    let time = this.data.timeList[index];
    console.log("时间吸附到：", time);
    
    if (type === "startScrollTop") {
      this.setData({ 
        startTimeRaw: time,
        startTimeRaw1: time,
        selectedStartIndex: index
      });
    } else {
      this.setData({ 
        endTimeRaw: time,
        endTimeRaw1: time,
        selectedEndIndex: index
      });
    }
    this.computeDuration();
  },

  // 触摸结束时也触发吸附
  onStartScrollTouchEnd(e) {
    const current = e.detail.scrollTop;
    const snapped = this.getSnappedScrollTop(current, "start");
    this.setData({ 
      startScrollTop: snapped,
      selectedStartIndex: snapped / this.data.itemHeightPx
    });
  },

  onEndScrollTouchEnd(e) {
    const current = e.detail.scrollTop;
    const snapped = this.getSnappedScrollTop(current, "end");
    this.setData({ 
      endScrollTop: snapped,
      selectedEndIndex: snapped / this.data.itemHeightPx
    });
  },

  // 自动吸附算法：计算最接近的 item 位置
  getSnappedScrollTop(scrollTop, type) {
    const itemHeight = this.data.itemHeightPx;
    let index = Math.floor(scrollTop / itemHeight);
    let sameDay = type === 'start' ? 
      utils.isSameDayOrToday(this.data.startDateVal, this.data.endDateVal) : 
      utils.isSameDay(this.data.startDateVal, this.data.endDateVal);
    
    if (sameDay) {
      let selectTime = this.data.timeList[index];
      // 获取当前时间并计算最近的半小时时间
      const now = new Date();
      let hours = now.getHours();
      let minutes = now.getMinutes();
      
      // 处理分钟进位
      if (minutes >= 30) {
        hours += 1;
        minutes = 0;
      } else {
        minutes = 30;
      }
      // 处理小时溢出
      if (hours >= 24) hours = 0;
      
      // 格式化成 HH:mm 字符串
      const currentTime = 
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      
      // 比较时间字符串
      if (selectTime < currentTime) {
        selectTime = currentTime;
      }
      let finalIndex = this.data.timeList.indexOf(selectTime);
      index = finalIndex !== -1 ? finalIndex : index;
    }
    
    const remainder = scrollTop - index * itemHeight;
    // 如果余数大于或等于半个item高度，则吸附到下一个item
    if (remainder >= itemHeight / 2) {
      index++;
    }
    return index * itemHeight;
  },

  // 计算总时长，结合日期与时间
  computeDuration() {
    const { startDateVal, endDateVal, startTimeRaw1, endTimeRaw1 } = this.data;

    console.log("计算时长参数:", { startDateVal, endDateVal, startTimeRaw1, endTimeRaw1 });
    
    if (!startDateVal || !endDateVal || !startTimeRaw1 || !endTimeRaw1) {
      this.setData({ totalDays: 0, totalHours: 0, dateRangeComplete: false });
      return;
    }
    
    let startObj = new Date(startDateVal);
    let endObj = new Date(endDateVal);
    
    // 解析时间字符串 "HH:mm"
    let [sh, sm] = startTimeRaw1.split(':').map(Number);
    let [eh, em] = endTimeRaw1.split(':').map(Number);
    startObj.setHours(sh, sm, 0, 0);
    endObj.setHours(eh, em, 0, 0);

    // 如果取还车是同一天，则只有当取车时间小于还车时间才有效
    if (startObj.toDateString() === endObj.toDateString()) {
      if (startObj.getTime() >= endObj.getTime()) {
        this.setData({ totalDays: 0, totalHours: 0, dateRangeComplete: false });
        return;
      }
    } else {
      // 如果跨天但出现结束时间小于开始时间，则认为跨天
      if (endObj.getTime() < startObj.getTime()) {
        endObj.setDate(endObj.getDate() + 1);
      }
    }

    let diff = endObj.getTime() - startObj.getTime();
    const totalHours = diff / (1000 * 60 * 60); // 精确小时数，不向上取整
    
    // 计算天数：不满一天也算一天
    let days;
    if (totalHours <= 24) {
      // 24小时以内都算1天
      days = 1;
    } else {
      // 超过24小时，向上取整
      days = Math.ceil(totalHours / 24);
    }
    
    // 剩余小时数（去掉整天后的小时）
    const hours = Math.ceil(totalHours % 24);
    
    console.log("计算结果:", {
      totalHours: totalHours,
      days: days,
      hours: hours
    });
    
    this.setData({ 
      totalDays: days, 
      totalHours: hours, 
      dateRangeComplete: true 
    });
  },

  // 底部按钮：清空所有选择
  onClear() {
    this.preventRepeatedTap(() => {
      // 重置所有日期和时间选择
      this.setData({
        startDateVal: null,
        endDateVal: null,
        startDateDisplay: '',
        endDateDisplay: '',
        startWeek: '',
        endWeek: '',
        startTimeRaw: '',
        endTimeRaw: '',
        startTimeRaw1: '',
        endTimeRaw1: '',
        totalDays: 0,
        totalHours: 0,
        dateRangeComplete: false,
        isDateSelected: false,
        dateSelectionMode: 'start',
        tempSelectedDate: null,
        selectedStartIndex: 0,
        selectedEndIndex: 0,
        startScrollTop: 0,
        endScrollTop: 0
      });
      
      // 更新日历显示
      this.updateCalendarDisplay();
      
      this.showToast('已清空选择', 'success');
    });
  },

  // 底部按钮：确定后执行逻辑
  onConfirm() {
    this.preventRepeatedTap(() => {
      const { 
        startDateVal, endDateVal, startTimeRaw1, endTimeRaw1, 
        startDateDisplay, endDateDisplay, startWeek, endWeek, 
        totalDays, totalHours 
      } = this.data;
      
      if (!startDateDisplay || !endDateDisplay) {
        this.showErrorToast('请选择完整的日期区间');
        return;
      }
      
      if (!startTimeRaw1 || !endTimeRaw1) {
        this.showErrorToast('请选择取车和还车时间');
        return;
      }

      // 显示成功提示
      this.showToast(
        `选择成功：${startDateDisplay}(${startWeek}) - ${endDateDisplay}(${endWeek})\n共${totalDays}天${totalHours}小时`, 
        'success'
      );

      // 回传数据给上一页
      this.backToParentPage();
    });
  },

  // 回传数据给上一页
  backToParentPage() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    
    const { startDateVal, endDateVal, startTimeRaw1, endTimeRaw1 } = this.data;
    
    console.log("准备回传的数据:", { 
      startDateVal, 
      endDateVal, 
      startTimeRaw1, 
      endTimeRaw1 
    });
    
    // 组合完整的时间戳（日期+时间）
    let newPickupDateTimestamp = utils.combineDateTime(startDateVal, startTimeRaw1);
    let newReturnDateTimestamp = utils.combineDateTime(endDateVal, endTimeRaw1);

    console.log("组合后的时间戳:", { 
      newPickupDateTimestamp, 
      newReturnDateTimestamp 
    });
    
    // 验证时间戳
    console.log("验证时间:", {
      pickup: new Date(newPickupDateTimestamp),
      return: new Date(newReturnDateTimestamp)
    });

    // 如果来源是首页，则存储到本地
    if (this.data.sourceUrl === '/pages/index/index') {
      wx.setStorageSync('pickupDateTimestamp', newPickupDateTimestamp);
      wx.setStorageSync('returnDateTimestamp', newReturnDateTimestamp);
      console.log("已存储到本地缓存");
    }
    
    // 回传数据给上一页
    if (prevPage) {
      prevPage.setData({
        pickupDateTimestamp: newPickupDateTimestamp,
        returnDateTimestamp: newReturnDateTimestamp,
      });
      console.log("已回传数据给上一页");
    }
    
    wx.navigateBack();
  },

  // 工具方法
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    });
  },

  showErrorToast(title) {
    this.showToast(title, 'none');
  },

  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  hideLoading() {
    wx.hideLoading();
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '选择租车时间',
      path: '/pages/timeSelect/timeSelect',
      imageUrl: '/assets/share-timeselect.png'
    };
  },

  // 页面错误处理
  onError(error) {
    console.error('页面错误:', error);
    this.showErrorToast('页面出现错误，请重试');
  },

  // 页面卸载清理
  onUnload() {
    // 清理定时器
    if (this.data.startScrollTimer) {
      clearTimeout(this.data.startScrollTimer);
    }
    if (this.data.endScrollTimer) {
      clearTimeout(this.data.endScrollTimer);
    }
    console.log('timeSelect页面清理完成');
  }
});