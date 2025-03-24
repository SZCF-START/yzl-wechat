Page({
  data: {
    // 模拟banner
    // 这里使用的是一个简单的本地图片 /images/banner.png
    // 也可以使用swiper轮播图，视情况而定
    // 模拟轮播图数据
    bannerList: [
      { id: 1, imgUrl: '../../assets/swiper/-s-sd.png' },
      { id: 2, imgUrl: '../../assets/swiper/-s-lu.png' },
      { id: 3, imgUrl: '../../assets/swiper/-s-hb.png' },
    ],

    // 默认城市/门店
    defaultCity: '太原',
    defaultStore: '万象城店',

    // 当前选择城市/门店
    currentCity: '',
    currentStore: '',

    // 时间相关（示例先用字符串，后续从timeSelect页带回）
    pickupDate: '03月27日',
    returnDate: '04月25日',
    pickupTime: '今天 20:00',
    returnTime: '周日 20:00',
    totalDays: 2, // 示例：2天

    // 是否勾选“上门送取”
    sendChecked: false,

    // 金刚区数据
    iconList: [
      { id: 1, icon: '../../assets/yh.png', text: '特价活动' },
      { id: 2, icon: '../../assets/yh.png', text: '长租优惠' },
      { id: 3, icon: '../../assets/yh.png', text: '精品车源' },
      { id: 4, icon: '../../assets/yh.png', text: '门店导航' },
      { id: 5, icon: '../../assets/yh.png', text: '会员中心' },
      { id: 6, icon: '../../assets/yh.png', text: '会员中心2' },
    ],
    // 分页后存储的数组，每页4个
    iconPages: [],
    // 当前swiper页索引
    iconCurrentPage: 0,
    autoPlayValue: false,
  },

  onLoad() {
    // 这里可以检查地理位置授权、获取默认城市门店等
    this.initLocation();
    // 拆分金刚区数据，每页4个
    this.initIconPages();
  },

  onShow() {
    // 当从其他页面返回时，可在这里做数据刷新
    // 例如，如果在 citySelect/storeSelect/timeSelect 修改了数据并回传
    // 可以通过 globalData 或 query 参数进行更新
  },

  // 初始化位置，演示逻辑：不做真实定位，仅设置默认值
  initLocation() {
    this.setData({
      currentCity: this.data.defaultCity,
      currentStore: this.data.defaultStore,
    });
  },

  // 将 iconList 拆分为每页4个
  initIconPages() {
    const pageSize = 4;
    const pages = [];
    const list = this.data.iconList;
    for (let i = 0; i < list.length; i += pageSize) {
      pages.push(list.slice(i, i + pageSize));
    }
    this.setData({ iconPages: pages });
    console.log("111",pages);
  },

  // swiper分页切换事件
  handleIconSwiperChange(e) {
    this.setData({ iconCurrentPage: e.detail.current });
  },

  // 跳转到城市选择页面
  goCitySelect() {
    wx.navigateTo({
      url: '/pages/citySelect/citySelect',
    });
  },

  // 跳转到门店选择页面
  goStoreSelect() {
    if (!this.data.currentCity) {
      wx.showToast({ title: '请先选择城市', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/storeSelect/storeSelect?city=${this.data.currentCity}`,
    });
  },

  // 跳转到时间选择页面
  goTimeSelect() {
    // 把当前选择的日期和时间传过去
    const { startDate, endDate, startTime, endTime } = this.data;
    wx.navigateTo({
      url: `/pages/timeSelect/timeSelect?pickupDate=${this.data.pickupDate}&returnDate=${this.data.returnDate}&pickupTime=${this.data.pickupTime}&returnTime=${this.data.returnTime}`,
    });
  },

  // 一键填写示例
  handleFillQuickly() {
    wx.showToast({
      title: '一键填写示例',
      icon: 'none',
    });
  },

  // 上门送取checkbox变更
  onSendCheckChange(e) {
    this.setData({
      sendChecked: e.detail.value.length > 0,
    });
  },

  // 去选车
  goSelectCar() {
    wx.showToast({
      title: '跳转到选车页示例',
      icon: 'none',
    });
    // 也可使用 wx.navigateTo({ url: '/pages/carList/carList' });
  },

  // 金刚区点击事件
  handleIconTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: `点击图标ID: ${id}`,
      icon: 'none',
    });
  },
});
