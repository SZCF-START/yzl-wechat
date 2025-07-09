const privacyStatusManager = require('../../utils/privacyStatusManager');
import config from '../../config/config.js';

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
  }
};

Page({
  data: {
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
    storeInfo: null, // 完整的门店信息

    // 时间相关（示例先用字符串，后续从timeSelect页带回）
    pickupDate: null,
    pickupDateTimestamp: null,
    returnDate: null,
    returnDateTimestamp: null,
    pickupTime: null,
    returnTime: null,
    totalDays: 0, // 示例：2天

    // 金刚区数据
    iconList: [
      { id: 1, icon: '../../assets/yh.png', text: '特价活动' },
      { id: 2, icon: '../../assets/yh.png', text: '长租优惠' },
      { id: 3, icon: '../../assets/yh.png', text: '精品车源' },
      { id: 4, icon: '../../assets/yh.png', text: '门店导航' },
      { id: 5, icon: '../../assets/yh.png', text: '会员中心' },
      { id: 6, icon: '../../assets/yh.png', text: '客服热线' },
    ],
    // 分页后存储的数组，每页4个
    iconPages: [],
    // 当前swiper页索引
    iconCurrentPage: 0,
    autoPlayValue: false,

    //用户是否同意隐私
    isLocationEnabled: false,
    activeTab: 'daily', // 默认显示日租
    isLoading: false, // 加载状态
    
    // 防重复点击
    lastTapTime: 0,
  },

  onLoad(options) {
    console.log("index onLoad");
    this.setData({ isLoading: true });
    
    // 检查地理位置授权、获取默认城市门店等
    this.checkLocationPermission();
    // 拆分金刚区数据，每页4个
    this.initIconPages();
    // 初始化门店信息
    this.updateStoreInfoFromStorage();
    
    this.setData({ isLoading: false });
  },

  onShow() {
    console.log("index onShow");
    // 当从其他页面返回时，更新门店和城市信息
    this.updateStoreInfoFromStorage();
    this.setDefaultDateTime();
  },

  // 从存储更新门店和城市信息
  updateStoreInfoFromStorage() {
    const selectedStore = wx.getStorageSync('selectedStore');
    const selectedStoreInfo = wx.getStorageSync('selectedStoreInfo');
    const currentCity = wx.getStorageSync('currentCity');
    
    console.log('从存储获取信息:', {
      selectedStore,
      selectedStoreInfo,
      currentCity
    });
    
    // 更新城市信息
    if (currentCity) {
      this.setData({
        currentCity: currentCity
      });
    }
    
    // 更新门店信息
    if (selectedStore) {
      this.setData({
        currentStore: selectedStore,
        storeInfo: selectedStoreInfo
      });
      
      console.log('已更新门店信息:', {
        store: selectedStore,
        info: selectedStoreInfo
      });
    } else {
      // 如果没有选中门店，清空相关信息
      this.setData({
        currentStore: '',
        storeInfo: null
      });
    }
  },

  // 获取当前选中的门店详细信息
  getCurrentStoreInfo() {
    return this.data.storeInfo || wx.getStorageSync('selectedStoreInfo') || null;
  },

  // 检查是否已选择门店
  hasSelectedStore() {
    return !!this.data.currentStore;
  },

  // 清除门店选择
  clearStoreSelection() {
    wx.removeStorageSync('selectedStore');
    wx.removeStorageSync('selectedStoreInfo');
    
    this.setData({
      currentStore: '',
      storeInfo: null
    });
    
    this.showToast('已清除门店选择', 'none');
  },

  async checkLocationPermission() {
    try {
      const res = await privacyStatusManager.getPrivacyStatus();
      console.log("隐私状态检查结果:", res);
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
    const pickupDateTimestampStorage = wx.getStorageSync('pickupDateTimestamp');
    const returnDateTimestampStorage = wx.getStorageSync('returnDateTimestamp');
    const now = new Date();
    console.log("this.data.pickupDateTimestamp" + pickupDateTimestampStorage);
    
    // 如果 pickupDate 为空，则使用当前时间戳，否则使用已有数据
    let pickupDateTimestamp = pickupDateTimestampStorage ? pickupDateTimestampStorage : now.getTime();
    console.log("pickupDateTimestamp:",pickupDateTimestamp);
    let pickupDate = this.formatDate(new Date(pickupDateTimestamp));
    
    // 如果 returnDate 为空，则默认为 pickupDate 的后一天
    let returnDateTimestamp = returnDateTimestampStorage ? returnDateTimestampStorage 
    : this.data.activeTab === 'monthly' ? new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).getTime() : new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).getTime();
    let returnDate = this.formatDate(new Date(returnDateTimestamp));
  
    // 处理取车时间：如果为空则使用 formatTime 计算当前时间（不加小时）；如果有值则取其 "HH:mm" 部分，加上 pickupDate 对应的星期
    let pickupTime = pickupDateTimestampStorage ? this.formatTime1(pickupDateTimestamp, 0) : this.formatTime(pickupDateTimestamp, 0);
  
    // 处理还车时间：如果为空，则默认为取车时间；如果有值，则添加 returnDate 对应的星期
    let returnTime = returnDateTimestampStorage ? this.formatTime1(returnDateTimestamp, 0) : this.formatTime(returnDateTimestamp, 0);
  
    // 计算租赁天数（至少 1 天）
    const totalDays = this.calculateDays(pickupDateTimestamp, returnDateTimestamp, pickupTime, returnTime);
  
    if(totalDays >= 28) {
      this.setData({ activeTab: "monthly" });
    } else {
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
    let newTime = new Date(date + hoursToAdd * 60 * 60 * 1000);
    
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

  formatTime1(date, hoursToAdd) {
    let newTime = new Date(date + hoursToAdd * 60 * 60 * 1000);
    let hours = newTime.getHours().toString().padStart(2, '0');
    let minutes = newTime.getMinutes().toString().padStart(2, '0');
    // 获取星期几
    const weekDay = this.getWeek(newTime);
    return `${weekDay} ${hours}:${minutes}`;
  },
  
  /**
   * 计算租赁天数，至少为1天
   */
  calculateDays(pickupDateTimestamp, returnDateTimestamp) {
    // 计算两个时间之间的差值（单位：天）
    const diff = (returnDateTimestamp - pickupDateTimestamp) / (1000 * 60 * 60 * 24);
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
              // 去掉"市"字（如果有）
              city = city.replace(/市$/, '');
              this.setData({
                currentCity: city,
                isLocationEnabled: true,
              });
              wx.setStorageSync('currentCity', city);
              wx.setStorageSync('locationCity', city);
              wx.setStorageSync('isLocationEnabled', true);

            } else {
              this.showToast('获取城市失败', 'none');
            }
          },
          fail: (err) => {
            console.error('逆地理请求失败：', err);
            this.showToast('请求地址信息失败', 'none');
          }
        });
      },
      fail: (error) => {
        console.error('获取定位失败：', error);
        this.showToast('定位失败，请检查权限', 'none');

        this.setData({
          currentCity: this.data.defaultCity,
        });
        wx.setStorageSync('currentCity', this.data.defaultCity);
      }
    });  
  },

  initUnauthorizedLocation() {
    this.setData({
      currentCity: this.data.defaultCity,
    });
    wx.setStorageSync('currentCity', this.data.defaultCity);
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
    console.log("金刚区分页数据:", pages);
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

  // swiper分页切换事件
  handleIconSwiperChange: utils.throttle(function(e) {
    this.setData({ iconCurrentPage: e.detail.current });
  }, 100),

  // 跳转到城市选择页面
  goCitySelect() {
    this.preventRepeatedTap(() => {
      let url = '/pages/citySelect/citySelect';
      let sourceUrl = '/pages/index/index'
      url += `?source=${sourceUrl}`;
      if (this.data.isLocationEnabled) {
        url += `&city=${this.data.currentCity}`;
        url += `&store=${this.data.currentStore}`;
      }
      wx.navigateTo({
        url: url,
      });
    });
  },

  // 跳转到门店选择页面 - 优化后的存储方式
  goStoreSelect() {
    this.preventRepeatedTap(() => {
      if (!this.data.currentCity) {
        this.showToast('请先选择城市', 'none');
        return;
      }
      
      const sourceUrl = '/pages/index/index';
      
      // 简化跳转，只传递必要参数
      wx.navigateTo({
        url: `/pages/storeSelect/storeSelect?city=${this.data.currentCity}&source=${encodeURIComponent(sourceUrl)}`,
      });
    });
  },

  // 跳转到时间选择页面
  goTimeSelect() {
    this.preventRepeatedTap(() => {
      // 把当前选择的日期和时间传过去
      const { pickupDateTimestamp, returnDateTimestamp, pickupTime, returnTime } = this.data;
      const sourceUrl = '/pages/index/index';
      let newPickupDateTimestamp = this.combineDateTime(pickupDateTimestamp, pickupTime);
      let newReturnDateTimestamp = this.combineDateTime(returnDateTimestamp, returnTime);
      wx.navigateTo({
        url: `/pages/timeSelect/timeSelect?pickupDate=${newPickupDateTimestamp}&returnDate=${newReturnDateTimestamp}&pickupTime=${pickupTime}&returnTime=${returnTime}&source=${encodeURIComponent(sourceUrl)}`,
      });
    });
  },

  combineDateTime(timestamp, timeStr) {
    const date = new Date(timestamp);
    let timePart;
    // 提取时间部分（自动过滤周x信息）
    if (timeStr.includes(' ')) {
      const [_, tmpTime] = timeStr.split(' '); // 分割出时间部分
      timePart = tmpTime;
    } else {
      timePart = timeStr; // 无空格时直接使用整个字符串
    }
    const [hours, minutes] = timePart.split(':').map(Number);
    console.log("hours:",hours);
    console.log("minutes:",minutes);
    // 重置时分秒毫秒
    date.setHours(hours);
    date.setMinutes(minutes);
    date.setSeconds(0);
    date.setMilliseconds(0);
  
    return date.getTime();
  },

  // 一键填写示例
  handleFillQuickly() {
    this.showToast('一键填写示例', 'none');
  },

  // 上门送取checkbox变更
  onSendCheckChange(e) {
    this.setData({
      sendChecked: e.detail.value.length > 0,
    });
  },

  // 去选车 - 优化门店检查逻辑
  goSelectCar() {
    this.preventRepeatedTap(() => {
      if (this.hasSelectedStore()) {
        // 有选中门店，直接进入选车页面
        const newPickupTimestamp = this.combineDateTime(this.data.pickupDateTimestamp, this.data.pickupTime);
        const newReturnTimestamp = this.combineDateTime(this.data.returnDateTimestamp, this.data.returnTime);
        
        wx.navigateTo({ 
          url: `/pages/carSelect/carSelect?pickupDate=${newPickupTimestamp}&returnDate=${newReturnTimestamp}&currentCity=${this.data.currentCity}`,
        });
      } else {
        // 没有选中门店，先跳转到门店选择页面
        this.showToast('请先选择门店', 'none');
        setTimeout(() => {
          this.goStoreSelect();
        }, 1000);
      }
    });
  },

  // 金刚区点击事件
  handleIconTap(e) {
    this.preventRepeatedTap(() => {
      const id = e.currentTarget.dataset.id;
      const iconItem = this.data.iconList.find(item => item.id == id);
      console.log('点击金刚区图标:', iconItem);
      
      // 根据不同图标执行不同操作
      switch (parseInt(id)) {
        case 1:
          this.goActivity();
          break;
        case 2:
          this.goLongRent();
          break;
        case 3:
          this.goPremiumCars();
          break;
        case 4:
          this.goStoreNavigation();
          break;
        case 5:
          this.goMemberCenter();
          break;
        case 6:
          this.callService();
          break;
        default:
          this.showToast(`功能开发中: ${iconItem?.text}`, 'none');
      }
    }, 500);
  },

  // 金刚区功能实现
  goActivity() {
    this.showToast('跳转到活动页面', 'none');
    // wx.navigateTo({
    //   url: '/pages/activity/activity'
    // });
  },

  goLongRent() {
    this.setData({ activeTab: 'monthly' });
    this.setDefaultDateTime1();
    this.showToast('已切换至月租模式', 'success');
  },

  goPremiumCars() {
    this.showToast('跳转到精品车源', 'none');
    // wx.navigateTo({
    //   url: '/pages/premiumCars/premiumCars'
    // });
  },

  goStoreNavigation() {
    if (!this.hasSelectedStore()) {
      this.showToast('请先选择门店', 'none');
      return;
    }
    
    const storeInfo = this.getCurrentStoreInfo();
    console.log('门店导航 - 当前门店信息:', storeInfo);
    
    if (storeInfo && storeInfo.latitude && storeInfo.longitude) {
      // 打开地图导航
      wx.openLocation({
        latitude: storeInfo.latitude,
        longitude: storeInfo.longitude,
        name: storeInfo.name,
        address: storeInfo.address,
        fail: () => {
          this.showToast('打开地图失败', 'none');
        }
      });
    } else {
      this.showToast('门店位置信息不完整', 'none');
    }
  },

  goMemberCenter() {
    this.showToast('跳转到会员中心', 'none');
    // wx.switchTab({
    //   url: '/pages/profile/profile'
    // });
  },

  callService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        this.showToast('拨打电话失败', 'none');
      }
    });
  },

  // 切换标签 - 使用防抖处理
  switchTab: utils.debounce(function(e) {
    const type = e.currentTarget.dataset.tab;
    console.log("切换标签:", type);
    this.setData({ activeTab: type });
    this.setDefaultDateTime1();
  }, 300),
  
  setDefaultDateTime1() {
    const now = new Date();
    // 如果 pickupDate 为空，则使用当前时间戳，否则使用已有数据
    let pickupDateTimestamp = now.getTime();
    let pickupDate = this.formatDate(new Date(pickupDateTimestamp));
    // 如果 returnDate 为空，则默认为 pickupDate 的后一天
    let returnDateTimestamp = this.data.activeTab === 'monthly' ? new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000).getTime() : new Date(now.getTime() + 24 * 60 * 60 * 1000).getTime();
    let returnDate = this.formatDate(new Date(returnDateTimestamp));
  
    // 处理取车时间：如果为空则使用 formatTime 计算当前时间（不加小时）；如果有值则取其 "HH:mm" 部分，加上 pickupDate 对应的星期
    let pickupTime = this.formatTime(pickupDateTimestamp, 0);
    
    // 处理还车时间：如果为空，则默认为取车时间；如果有值，则添加 returnDate 对应的星期
    let returnTime = this.formatTime(returnDateTimestamp, 0);
    
    // 计算租赁天数（至少 1 天）
    const totalDays = this.calculateDays(pickupDateTimestamp, returnDateTimestamp, pickupTime, returnTime);

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

  // 通用提示方法
  showToast(title, icon = 'none') {
    wx.showToast({
      title,
      icon,
      duration: 2000
    });
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '便捷租车服务',
      path: '/pages/index/index',
      imageUrl: '/assets/share-image.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '便捷租车服务 - 随时随地，轻松出行'
    };
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('用户下拉刷新');
    this.setData({ isLoading: true });
    
    // 重新获取数据
    setTimeout(() => {
      this.checkLocationPermission();
      this.updateStoreInfoFromStorage();
      this.setDefaultDateTime();
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 页面错误处理
  onError(error) {
    console.error('页面错误:', error);
    this.showToast('页面出现错误，请重试', 'none');
  }
});