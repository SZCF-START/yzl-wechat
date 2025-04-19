Page({
  data: {
    storeName: '首都机场T2店(站内取还)',
    startTimeFormatted: '',
    endTimeFormatted: '',

    // 筛选状态（可扩展）
    activeFilter: '',

    // 功能标签列表
    features: [
      { key: 'camera', name: '倒车影像' },
      { key: 'radar', name: '倒车雷达' },
      { key: 'bluetooth', name: '蓝牙连接' },
      { key: 'carplay', name: 'CarPlay' },
      { key: '4wd', name: '四驱' }
    ],

    // 左侧分类
    categories: [
      { id: 1, name: '推荐' },
      { id: 2, name: '京牌畅行', price: 258 },
      { id: 3, name: '精英型', price: 258 },
      { id: 4, name: 'SUV', price: 313 },
      { id: 5, name: '豪华车', price: 459 },
      { id: 6, name: '个性车', price: 1456 },
      { id: 7, name: '自助取还', price: 258 },
      { id: 8, name: '临近时间', /* 这里可动态显示车型数 */ }
    ],
    activeCategoryId: 1,

    // 模拟的车辆列表
    carList: [
      {
        id: 1,
        name: '日产天籁',
        desc: '自动/2.0L/三厢/5座',
        image: '/images/car1.png',
        tags: ['蓝牙连接', '倒车雷达', '倒车影像', '天窗'],
        pickupType: '自助取还',
        dailyPrice: 258,
        totalPrice: 636
      },
      {
        id: 2,
        name: '大众新帕萨特',
        desc: '双离合/1.4T/三厢/5座',
        image: '/images/car2.png',
        tags: ['倒车雷达', '蓝牙连接', '六个月内车龄'],
        pickupType: '京牌',
        dailyPrice: 258,
        totalPrice: 636
      },
      {
        id: 3,
        name: '本田雅阁',
        desc: '自动/2.0L/三厢/5座',
        image: '/images/car3.png',
        tags: ['蓝牙连接', '倒车影像', '天窗'],
        pickupType: '自助取还',
        dailyPrice: 280,
        totalPrice: 680
      },
      {
        id: 4,
        name: '丰田皇冠陆放四驱',
        desc: '自动/2.5L/SUV/7座',
        image: '/images/car4.png',
        tags: ['CarPlay', '蓝牙连接', '四驱'],
        pickupType: '京牌',
        dailyPrice: 313,
        totalPrice: 700
      }
    ]
  },

  onLoad(options) {
    // 上一页通过参数传递时间戳： options.startTime、options.endTime\
    console.log("options.pickupTime:",options.pickupTime); 
    console.log("options.returnTime:",options.returnTime);
    const s = Number(options.pickupDate);
    const e = Number(options.returnDate);
    this.setData({
      startTimeFormatted: this.formatTimestamp(s),
      endTimeFormatted: this.formatTimestamp(e)
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

  // 点击分类
  onCategoryTap(evt) {
    const id = evt.currentTarget.dataset.id;
    this.setData({ activeCategoryId: id });
    // TODO: 按分类过滤 carList
  },

  // 点击功能标签
  onFeatureTap(evt) {
    const key = evt.currentTarget.dataset.key;
    // TODO: 标记选中状态并过滤列表
  },

  // 点击顶栏筛选项
  onFilterTap(evt) {
    const key = evt.currentTarget.dataset.key;
    this.setData({ activeFilter: key });
    // TODO: 弹出下拉、弹层等
  }
});
