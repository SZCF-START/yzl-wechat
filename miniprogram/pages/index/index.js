const privacyStatusManager = require('../../utils/privacyStatusManager');
import config from '../../config/config.js'
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
    defaultCity: '长治',
    defaultStore: '',

    // 当前选择城市/门店
    currentCity: '',
    currentStore: '',

    // 时间相关（示例先用字符串，后续从timeSelect页带回）
    pickupDate: null,
    pickupDateTimestamp: null,
    returnDate: null,
    returnDateTimestamp: null,
    pickupTime: null,
    returnTime: null,
    totalDays: 0, // 示例：2天

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

    //用户是否同意隐私
    isLocationEnabled: false,
    activeTab: 'daily', // 默认显示日租
  },

  onLoad(options) {
    // 这里可以检查地理位置授权、获取默认城市门店等
    this.checkLocationPermission();
    // 拆分金刚区数据，每页4个
    this.initIconPages();
    
  },

  async checkLocationPermission() {
    try {
      const res = await privacyStatusManager.getPrivacyStatus();
      if (res.needAuthorization) {
        await privacyStatusManager.showPrivacyAuthorizationPopup({
          scope: 'userLocation'
        });
      }
      this.initLocation()
    } catch (e) {
      console.error(e.msg + '：', e);
      if (e.scope === 'userLocation'){
        this.initUnauthorizedLocation();
      }
    }
    
  },

  setDefaultDateTime() {
    const now = new Date();
    console.log("this.data.pickupDateTimestamp" + this.data.pickupDateTimestamp);
    console.log("this.data.pickupDateTimestamp" + this.data.pickupDateTimestamp);
    // 如果 pickupDate 为空，则使用当前时间戳，否则使用已有数据
    let pickupDateTimestamp = this.data.pickupDateTimestamp ? this.data.pickupDateTimestamp : now.getTime();
    console.log("pickupDateTimestamp" + pickupDateTimestamp);
    console.log("new Date(pickupDateTimestamp)" + new Date(pickupDateTimestamp));
    let pickupDate = this.formatDate(new Date(pickupDateTimestamp));
    // 如果 returnDate 为空，则默认为 pickupDate 的后一天
    let returnDateTimestamp = this.data.returnDateTimestamp ? this.data.returnDateTimestamp 
    : this.data.activeTab === 'monthly' ? new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).getTime() : new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime();
    let returnDate = this.formatDate(new Date(returnDateTimestamp));
  
    // 处理取车时间：如果为空则使用 formatTime 计算当前时间（不加小时）；如果有值则取其 "HH:mm" 部分，加上 pickupDate 对应的星期
    let pickupTime;
    if (!this.data.pickupTime) {
      // 默认取车时间，直接调用 formatTime 返回类似 "周二 09:30"（根据当前时间计算）
      pickupTime = this.formatTime(now, 0);
    } else {
      // 已有取车时间（格式为 "03:30"），需要添加星期（根据 pickupDate 计算）
      const weekDay = this.getWeek(new Date(pickupDateTimestamp));
      pickupTime = `${weekDay} ${this.extractTime(this.data.pickupTime)}`;
    }
  
    // 处理还车时间：如果为空，则默认为取车时间；如果有值，则添加 returnDate 对应的星期
    let returnTime;
    if (!this.data.returnTime) {
      returnTime = pickupTime;
    } else {
      const weekDay = this.getWeek(new Date(returnDateTimestamp));
      returnTime = `${weekDay} ${this.extractTime(this.data.returnTime)}`;
    }
  
    // 计算租赁天数（至少 1 天）
    const totalDays = this.calculateDays(pickupDateTimestamp, returnDateTimestamp,pickupTime,returnTime);
  
    if(totalDays >= 28) {
      this.setData({ activeTab: "monthly" });
    }else{
      this.setData({ activeTab: "daily" });
    }

    // 更新页面数据
    this.setData({
      pickupDateTimestamp,
      pickupDate,
      returnDateTimestamp,
      returnDate,
      pickupTime,
      returnTime,
      totalDays
    });
  },
  
  /**
   * 格式化日期为 'MM月DD日' 格式（这里可根据需要调用）
   */
  formatDate(date) {
    const month = date.getMonth() + 1; // 月份从0开始
    const day = date.getDate();
    return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`;
  },
  
  /**
   * 计算时间：当前时间 + n 小时，取最近的整点或半点，并在前面添加星期
   * 如果 n 为 0，则直接返回当前时间最近的整/半点
   */
  formatTime(date, hoursToAdd) {
    let newTime = new Date(date.getTime() + hoursToAdd * 60 * 60 * 1000);
    
    let hours = newTime.getHours();
    let minutes = newTime.getMinutes();
  
    // 取最近的整点或半点
    if (minutes > 30) {
      hours += 1;
      minutes = '00';
    } else {
      minutes = '30';
    }
    
    // 获取星期几
    const weekDay = this.getWeek(newTime);
    return `${weekDay} ${hours}:${minutes}`;
  },
  
  /**
   * 计算租赁天数，至少为1天
   */
  calculateDays(pickupDate, returnDate, pickupTime, returnTime) {
    // 将传入的 pickupDate 和 returnDate 转换为 Date 对象（假设它们是日期字符串或时间戳）
    const startDate = new Date(pickupDate);
    const endDate = new Date(returnDate);
  
    // 分解 pickupTime 和 returnTime（例如 "08:30"）
    const [pickupHour, pickupMinute] = this.extractTime(pickupTime).split(':').map(Number);
    const [returnHour, returnMinute] = this.extractTime(returnTime).split(':').map(Number);
    // 结合日期和时间，构建完整的取车时间和还车时间
    startDate.setHours(pickupHour, pickupMinute, 0, 0);
    endDate.setHours(returnHour, returnMinute, 0, 0);
  
    // 计算两个时间之间的差值（单位：天）
    const diff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    // 不足一天向上取整（比如2.1天和2.9天均返回3天）
    return Math.ceil(diff);
  },
  
  extractTime(str) {
    const match = str.match(/\b\d{1,2}:\d{2}\b/); // 匹配 HH:mm 格式
    return match ? match[0] : "时间未找到";
  },

  /**
   * 获取星期几，返回格式例如：'周日', '周一', …
   */
  getWeek(dateObj) {
    const weekArr = ['周日','周一','周二','周三','周四','周五','周六'];
    return weekArr[dateObj.getDay()];
  },
  

  onShow() {
    // 当从其他页面返回时，可在这里做数据刷新
    const store = wx.getStorageSync('selectedStore');
    console.log("store555:",store);
    // 使用展开运算符创建新对象
    // 数据是对象或数组，直接修改内部属性不会触发渲染，需通过 ​​深拷贝​​ 或 ​​新建引用​​ 强制更新
    // const newStore = { ...store }; 
    // this.setData({ defaultStore: newStore });
    if (store) {
      console.log("store555777:",store);
      this.setData({ currentStore: store }, () => {
        wx.nextTick(() => {
          console.log("DOM 已更新，可执行渲染后操作");
        });
      });
      // wx.removeStorageSync('selectedStore'); // 用完即清
    }
    console.log("options.pickupDate:" + this.data.pickupDate);
    this.setDefaultDateTime();
    // this.initLocation();

  },

  // 初始化位置，演示逻辑：不做真实定位，仅设置默认值
  initLocation() {
    wx.getLocation({
      type: 'wgs84', // 返回 wgs84 坐标，可以用于地图显示
      success: (res) => {
        const { latitude, longitude } = res;
        console.log('用户经纬度：', latitude, longitude);
        // 根据经纬度获取详细地址信息
        // 调用高德地图 API 获取地级市
        const amapKey = config.AMAP_KEY; // 🔔 替换为你的高德地图 Web 服务 Key
        const url = `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${amapKey}&radius=1000&extensions=base`;

        wx.request({
          url: url,
          method: 'GET',
          success: (response) => {
            const data = response.data;
            if (data.status === '1') {
              const addressComponent = data.regeocode.addressComponent;
              console.log("addressComponent:",addressComponent);
              let city = addressComponent.city;
              let adcode = addressComponent.adcode;

              // 直辖市的处理：city 可能是空，使用 province 替代
              if (!city || (Array.isArray(city) && city.length === 0)) {
                city = addressComponent.province;
              }

              console.log('获取的城市：', city);
              // 去掉“市”字（如果有）
              city = city.replace(/市$/, '');
              this.setData({
                currentCity: city,
                // 可根据城市设定默认门店等
                // currentStore: this.data.defaultStore,
                isLocationEnabled: true,
              });
            } else {
              wx.showToast({
                title: '获取城市失败',
                icon: 'none',
              });
            }
          },
          fail: (err) => {
            console.error('逆地理请求失败：', err);
            wx.showToast({
              title: '请求地址信息失败',
              icon: 'none',
            });
          }
        });
      },
      fail: (error) => {
        console.error('获取定位失败：', error);
        wx.showToast({
          title: '定位失败，请检查权限',
          icon: 'none',
        });

        this.setData({
          currentCity: this.data.defaultCity,
          currentStore: this.data.defaultStore,
        });
      }
    });  
  },

  initUnauthorizedLocation() {
    this.setData({
      currentCity: this.data.defaultCity,
      // currentStore: this.data.defaultStore,
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
    let url = '/pages/citySelect/citySelect';

    let sourceUrl = '/pages/index/index'
    url += `?source=${sourceUrl}`;
    if (this.data.isLocationEnabled) {
      url += `&city=${this.data.currentCity}`;
    }
    wx.navigateTo({
      url: url,
    });
  },

  // 跳转到门店选择页面
  goStoreSelect() {
    if (!this.data.currentCity) {
      wx.showToast({ title: '请先选择城市', icon: 'none' });
      return;
    }
    let sourceUrl = '/pages/index/index'
    wx.navigateTo({
      url: `/pages/storeSelect/storeSelect?city=${this.data.currentCity}&source=${sourceUrl}`,
    });
  },

  // 跳转到时间选择页面
  goTimeSelect() {
    // 把当前选择的日期和时间传过去
    const { startDate, endDate, startTime, endTime } = this.data;
    wx.navigateTo({
      url: `/pages/timeSelect/timeSelect?pickupDate=${this.data.pickupDateTimestamp}&returnDate=${this.data.returnDateTimestamp}&pickupTime=${this.data.pickupTime}&returnTime=${this.data.returnTime}`,
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
    const newPickupTimestamp = this.combineDateTime(this.data.pickupDateTimestamp,this.data.pickupTime);
    const newReturnTimestamp  = this.combineDateTime(this.data.returnDateTimestamp,this.data.returnTime);
    wx.navigateTo({ 
      url: `/pages/carSelect/carSelect?pickupDate=${newPickupTimestamp}&returnDate=${newReturnTimestamp}
      &currentCity=${this.data.currentCity}&currentStore=${this.data.currentStore}`,
    });
  },

  combineDateTime(timestamp, timeStr) {
    const date = new Date(timestamp);
    
    // 提取时间部分（自动过滤周x信息）
    const [_, timePart] = timeStr.split(' '); // 分割周x和时间
    const [hours, minutes] = timePart.split(':').map(Number);
  
    // 重置时分秒毫秒
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
  
    return date.getTime();
  },

  // 金刚区点击事件
  handleIconTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: `点击图标ID: ${id}`,
      icon: 'none',
    });
  },
  switchTab(e) {
    const type = e.currentTarget.dataset.tab;
    console.log("type:",e);
    this.setData({ activeTab: type });
    this.setDefaultDateTime1();
  },
  
  setDefaultDateTime1() {
    const now = new Date();
    // 如果 pickupDate 为空，则使用当前时间戳，否则使用已有数据
    let pickupDateTimestamp = now.getTime();
    let pickupDate = this.formatDate(new Date(pickupDateTimestamp));
    // 如果 returnDate 为空，则默认为 pickupDate 的后一天
    let returnDateTimestamp =  this.data.activeTab === 'monthly' ? new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).getTime() : new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime();
    let returnDate = this.formatDate(new Date(returnDateTimestamp));
  
    // 处理取车时间：如果为空则使用 formatTime 计算当前时间（不加小时）；如果有值则取其 "HH:mm" 部分，加上 pickupDate 对应的星期
    let pickupTime;
    if (!this.data.pickupTime) {
      // 默认取车时间，直接调用 formatTime 返回类似 "周二 09:30"（根据当前时间计算）
      pickupTime = this.formatTime(now, 0);
    } else {
      // 已有取车时间（格式为 "03:30"），需要添加星期（根据 pickupDate 计算）
      const weekDay = this.getWeek(new Date(pickupDateTimestamp));
      pickupTime = `${weekDay} ${this.extractTime(this.data.pickupTime)}`;
    }
  
    // 处理还车时间：如果为空，则默认为取车时间；如果有值，则添加 returnDate 对应的星期
    let returnTime;
    if (!this.data.returnTime) {
      returnTime = pickupTime;
    } else {
      const weekDay = this.getWeek(new Date(returnDateTimestamp));
      returnTime = `${weekDay} ${this.extractTime(this.data.returnTime)}`;
    }
  
    // 计算租赁天数（至少 1 天）
    const totalDays = this.calculateDays(pickupDateTimestamp, returnDateTimestamp,pickupTime,returnTime);

    // 更新页面数据
    this.setData({
      pickupDateTimestamp,
      pickupDate,
      returnDateTimestamp,
      returnDate,
      pickupTime,
      returnTime,
      totalDays
    });
  },
});
