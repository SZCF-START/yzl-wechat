Page({
  data: {
    storeName: '首都机场T2店(站内取还)',
    startTime: '',
    endTime: '',

    features: [
      { key: 'cam', name: '倒车影像' },
      { key: 'radar', name: '倒车雷达' },
      { key: 'bluetooth', name: '蓝牙连接' },
      { key: 'carplay', name: 'CarPlay' },
      { key: '4wd', name: '四驱' },
      { key: '4wd', name: '四驱' },
      { key: '4wd', name: '四驱' },
    ],

    categories: [
      { id: 1, name: '推荐' },
      { id: 2, name: '京牌畅行', price: 258 },
      { id: 3, name: '精英型', price: 258 },
      { id: 4, name: 'SUV', price: 313 },
      { id: 5, name: '豪华车', price: 459 },
      { id: 6, name: '个性车', price: 1456 },
      { id: 7, name: '自助取还', price: 258 },
      { id: 8, name: '临近时间' }
    ],
    activeCat: 1,

    carList: [],

    showPopup: false,
    popup: {},
    showModal: false,
    daysDiff: 0,        // 相差天数
    startTimeInfo: {},   // 开始时间信息
    endTimeInfo: {} ,     // 结束时间信息
    currentCity: '',
    currentStore: '',
    pickupDateTimestamp: '',
    returnDateTimestamp: ''
  },

  onLoad(options) {
    console.log("carSelect-onLoad");
    // 上一页通过参数传递时间戳： options.startTime、options.endTime\
    // console.log("options.pickupTime:",options.pickupTime); 
    // console.log("options.returnTime:",options.returnTime);
    console.log("options.currentCity:",options.currentCity);
    const s = Number(options.pickupDate);
    const e = Number(options.returnDate);
    this.processTimestamps(s,e);
    this.setData({
      startTime: this.formatTimestamp(s),
      endTime: this.formatTimestamp(e),
      carList: this._mockCars(),
      currentCity: options.currentCity,
      pickupDateTimestamp: s,
      returnDateTimestamp: e
    });
    const store = wx.getStorageSync('selectedStore');
    const city = wx.getStorageSync('currentCity');
    if (city) {
      console.log("store555777:",city);
      this.setData({ currentCity: city }, () => {
        wx.nextTick(() => {
          console.log("DOM 已更新，可执行渲染后操作");
        });
      });
    }
    if (store) {
      console.log("store555777:",store);
      this.setData({ currentStore: store }, () => {
        wx.nextTick(() => {
          console.log("DOM 已更新，可执行渲染后操作");
        });
      });
    }
  },

  onShow(options) {
    console.log("carSelect-onShow");
    const { pickupDateTimestamp, returnDateTimestamp } = this.data;
    

    this.processTimestamps(pickupDateTimestamp,returnDateTimestamp);
    this.setData({
      startTime: this.formatTimestamp(pickupDateTimestamp),
      endTime: this.formatTimestamp(returnDateTimestamp),
      carList: this._mockCars(),
    }); 
  },

  // 时间戳格式化为 MM-DD hh:mm
  formatTimestamp(ts) {
    const d = new Date(ts);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${mm}-${dd} ${hh}:${min}`;
  },

  // 模拟车辆数据
  _mockCars() {
    return [
      {
        id:1, name:'日产天籁', desc:'自动/2.0L/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['蓝牙连接','倒车雷达','倒车影像','天窗'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      {
        id:2, name:'大众新帕萨特', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      // … 可继续添加
      {
        id:3, name:'大众新帕萨特1', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      {
        id:4, name:'大众新帕萨特2', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      {
        id:5, name:'大众新帕萨特3', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
    ];
  },

  // 显示蒙层
  showTimeModal() {

    this.setData({ showModal: true });
  },

  // 隐藏蒙层
  hideTimeModal() {
    this.setData({ showModal: false });
  },

  onSelectCar() {
    this.setData({ showModal: false });
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    currentPage.onShow();
    // 跳回车型列表页面（当前页），或重置列表
  },

  // 切换分类
  onCategoryTap(e) {
    this.setData({ activeCat: e.currentTarget.dataset.id });
    // TODO: 过滤 carList
  },

  // 跳转车型详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url:`/pages/carDetail/carDetail?id=${id}` });
  },

  // 跳转评论页面
  goComment(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url:`/pages/carComment/carComment?id=${id}` });
  },

  // 显示总价费用明细弹框
  showDetail(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ showPopup:true, popup:item });
  },

  closePopup() {
    this.setData({ showPopup:false });
  },

  noop() {},  // 阻止冒泡

  // 处理时间戳的主函数
  processTimestamps(startStamp, endStamp) {
    const start = this.formatTimestamp1(startStamp)
    const end = this.formatTimestamp1(endStamp)
    const diff = this.calcDayDiff(startStamp, endStamp)
    
    this.setData({
      startTimeInfo: start,
      endTimeInfo: end,
      daysDiff: diff
    })
  },

  // 时间戳格式化函数
  formatTimestamp1(timestamp) {
    const date = new Date(timestamp)
    // 格式：周一
    const weekDay = `周${['日','一','二','三','四','五','六'][date.getDay()]}`;
    // 格式：16:00
    const timeStr = `${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`;
    return {
      // 格式：02月21日
      dateStr: `${this.padZero(date.getMonth() + 1)}月${this.padZero(date.getDate())}日`,
      // 格式：周一 16:00
      timeStr: weekDay + " " + timeStr,
    }
  },

  // 计算相差天数（不足一天算一天）
  calcDayDiff(startStamp, endStamp) {
    const diff = (endStamp - startStamp) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  },

  // 补零函数
  padZero(num) {
    return num.toString().padStart(2, '0')
  },
  goTimeSelect() {
    // 把当前选择的日期和时间传过去
    const { pickupDateTimestamp, returnDateTimestamp, startTimeInfo, endTimeInfo } = this.data;
    wx.navigateTo({
      url: `/pages/timeSelect/timeSelect?pickupDate=${pickupDateTimestamp}&returnDate=${returnDateTimestamp}&pickupTime=${startTimeInfo.timeStr}&returnTime=${endTimeInfo.timeStr}`,
    });
  },
  goCitySelect() {
    let url = '/pages/citySelect/citySelect';

    let sourceUrl = '/pages/carSelect/carSelect'
    url += `?source=${encodeURIComponent(sourceUrl)}`;
    if (this.data.isLocationEnabled) {
      url += `&city=${this.data.currentCity}`;
    }
    wx.navigateTo({
      url: url,
    });
  },
  goStoreSelect() {
    if (!this.data.currentCity) {
      wx.showToast({ title: '请先选择城市', icon: 'none' });
      return;
    }
    let sourceUrl = '/pages/carSelect/carSelect'
    wx.navigateTo({
      url: `/pages/storeSelect/storeSelect?city=${this.data.currentCity}&source=${sourceUrl}`,
    });
  },
});
