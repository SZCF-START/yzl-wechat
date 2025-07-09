const amapFile = require('../../utils/amap-wx.130');
import config from '../../config/config.js'
import { backPage } from '../../utils/index.js'

Page({
  data: {
    currentCity: '长沙',
    currentStore: '',
    selectedStore: '', // 当前选中的门店
    cityList: ['长沙', '北京', '广州'],
    latitude: 28.2282,
    longitude: 112.9388,
    markers: [],
    selectedAreaIndex: 0,
    areaOffsets: [],
    scrollTop: 0,
    showSearchMask: false,
    areaList: [], // 改为空数组，从API获取
    favoriteStores: [], // 常用门店列表
    scrollIntoId: "",
    nbBackgroundColor: "#efefef",
    sourceUrl: '',
    isScrolling: false, // 添加滚动状态标识
    lastClickTime: 0 // 添加点击时间记录
  },

  onLoad(options) {
    console.log('页面参数:', options);
    
    // 从存储中获取用户之前的选择
    const storedCity = wx.getStorageSync('currentCity') || options.city || '长沙';
    const storedStore = wx.getStorageSync('selectedStore') || '';
    
    this.setData({ 
      currentCity: storedCity,
      sourceUrl: decodeURIComponent(options.source || ''),
      currentStore: storedStore,
      selectedStore: storedStore
    });
    
    // 加载常用门店
    this.loadFavoriteStores();
    
    // 初始化页面数据
    this.initPageData();
  },

  // 初始化页面数据
  initPageData() {
    this.initMap();
    this.loadStoreList();
  },

  // 加载门店列表数据
  loadStoreList() {
    // TODO: 替换为真实的API调用
    this.getStoreListFromAPI();
  },

  // 模拟API调用获取门店列表
  getStoreListFromAPI() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 模拟API请求
    setTimeout(() => {
      const mockApiResponse = {
        code: 200,
        message: 'success',
        data: {
          areaList: [
            {
              name: '天心区',
              stores: [
                {
                  id: 1,
                  name: '长沙先锋店',
                  address: '芙蓉南路中信凯旋蓝岸花园16.17栋103室',
                  latitude: 28.2282,
                  longitude: 112.9388,
                  phone: '0731-88888888',
                  openTime: '08:00',
                  closeTime: '20:00',
                  supportSelfReturn: true,
                  beeBox: true,
                  orderableTomorrow: true,
                  tags: [
                    { label: "高铁站", type: "default" },
                    { label: "库存紧张", type: "danger" },
                    { label: "可下全天订单", type: "highlight" }
                  ]
                },
                {
                  id: 2,
                  name: '长沙长盛岚庭店',
                  address: '竹塘西路378号长盛岚庭小区东二栋门面',
                  latitude: 28.2200,
                  longitude: 112.9300,
                  phone: '0731-99999999',
                  openTime: '08:00',
                  closeTime: '20:00',
                  supportSelfReturn: true,
                  beeBox: true,
                  orderableTomorrow: true,
                  tags: [
                    { label: "地铁站", type: "default" },
                    { label: "可下全天订单", type: "highlight" }
                  ]
                }
              ]
            },
            {
              name: '芙蓉区',
              stores: [
                {
                  id: 3,
                  name: '贺龙体育馆便捷点',
                  address: '芙蓉中路白沙广场停车场',
                  latitude: 28.2180,
                  longitude: 112.9420,
                  phone: '0731-77777777',
                  openTime: '09:00',
                  closeTime: '19:00',
                  supportSelfReturn: false,
                  beeBox: false,
                  orderableTomorrow: false,
                  tags: [
                    { label: "体育馆", type: "default" }
                  ]
                },
                {
                  id: 4,
                  name: '新开铺送车点',
                  address: '书院南路与南二环交汇处',
                  latitude: 28.2100,
                  longitude: 112.9350,
                  phone: '0731-66666666',
                  openTime: '09:00',
                  closeTime: '19:00',
                  supportSelfReturn: false,
                  beeBox: false,
                  orderableTomorrow: false,
                  tags: [
                    { label: "送车点", type: "default" }
                  ]
                }
              ]
            },
            {
              name: '岳麓区',
              stores: [
                {
                  id: 5,
                  name: '岳麓山店',
                  address: '岳麓大道123号',
                  latitude: 28.2150,
                  longitude: 112.9250,
                  phone: '0731-55555555',
                  openTime: '08:30',
                  closeTime: '19:30',
                  supportSelfReturn: true,
                  beeBox: true,
                  orderableTomorrow: true,
                  tags: [
                    { label: "景区", type: "default" },
                    { label: "热门", type: "highlight" }
                  ]
                }
              ]
            }
          ]
        }
      };

      wx.hideLoading();

      if (mockApiResponse.code === 200) {
        // 处理数据，添加常用门店区域
        const processedAreaList = this.processAreaListWithFavorites(mockApiResponse.data.areaList);
        
        this.setData({
          areaList: processedAreaList
        }, () => {
          // 数据加载完成后初始化位置和选中状态
          this.initAreaPositions();
          this.scrollToSelectedStore();
        });
      } else {
        wx.showToast({
          title: mockApiResponse.message || '加载失败',
          icon: 'none'
        });
      }
    }, 1000); // 模拟网络延迟
  },

  // 处理区域列表，添加常用门店
  processAreaListWithFavorites(originalAreaList) {
    const favoriteStores = this.data.favoriteStores;
    
    // 如果有常用门店，添加到列表最前面
    if (favoriteStores.length > 0) {
      const favoriteArea = {
        name: '常用门店',
        stores: favoriteStores
      };
      return [favoriteArea, ...originalAreaList];
    }
    
    return originalAreaList;
  },

  // 加载常用门店
  loadFavoriteStores() {
    const currentCity = this.data.currentCity;
    const favoriteStoresKey = `favoriteStores_${currentCity}`;
    const favoriteStores = wx.getStorageSync(favoriteStoresKey) || [];
    
    console.log(`加载${currentCity}的常用门店:`, favoriteStores);
    
    this.setData({
      favoriteStores: favoriteStores
    });
  },

  // 保存常用门店 - 正确的排序逻辑：最新选中在第二个，之前的在第一个
  saveFavoriteStore(storeData) {
    const currentCity = this.data.currentCity;
    const favoriteStoresKey = `favoriteStores_${currentCity}`;
    let favoriteStores = wx.getStorageSync(favoriteStoresKey) || [];
    
    // 移除已存在的相同门店（避免重复）
    favoriteStores = favoriteStores.filter(store => store.name !== storeData.name);
    
    // 根据当前数组长度决定插入位置
    if (favoriteStores.length === 0) {
      // 第一次选择：[A]
      favoriteStores.push(storeData);
    } else if (favoriteStores.length === 1) {
      // 第二次选择：[A, B] - A在第一个，B（最新）在第二个
      favoriteStores.push(storeData);
    } else {
      // 第三次及以后：[B, C] - 移除最老的A，B移到第一个，C（最新）在第二个
      favoriteStores.push(storeData);
    }
    
    // 只保留最新的两个门店
    if (favoriteStores.length > 2) {
      favoriteStores = favoriteStores.slice(-2); // 保留最后两个
    }
    
    // 保存到存储
    wx.setStorageSync(favoriteStoresKey, favoriteStores);
    
    console.log(`保存${currentCity}的常用门店排序说明:`);
    console.log(`- 索引0（第一个）: ${favoriteStores[0]?.name || '无'} - 倒数第二个选择的门店`);
    console.log(`- 索引1（第二个）: ${favoriteStores[1]?.name || '无'} - 最新选择的门店`);
    console.log('完整数组:', favoriteStores);
    
    // 更新页面数据
    this.setData({
      favoriteStores: favoriteStores
    });
    
    // 如果是从其他区域选择的门店，需要重新处理区域列表
    if (this.data.areaList.length > 0) {
      // 重新获取原始区域列表（不包含常用门店）
      let originalAreaList = this.data.areaList;
      if (originalAreaList[0].name === '常用门店') {
        originalAreaList = originalAreaList.slice(1);
      }
      
      // 重新处理区域列表
      const processedAreaList = this.processAreaListWithFavorites(originalAreaList);
      this.setData({
        areaList: processedAreaList
      });
    }
  },

  // 滚动到选中的门店位置 - 只在常用门店中显示选中状态
  scrollToSelectedStore() {
    if (!this.data.selectedStore) return;

    const areaList = this.data.areaList;
    let targetAreaIndex = 0;
    let foundInFavorites = false;

    // 只检查常用门店
    if (areaList.length > 0 && areaList[0].name === '常用门店') {
      const favoriteArea = areaList[0];
      const foundStore = favoriteArea.stores.find(store => store.name === this.data.selectedStore);
      if (foundStore) {
        targetAreaIndex = 0;
        foundInFavorites = true;
      }
    }

    // 如果不在常用门店中，不清除选中状态，但是也不滚动
    if (!foundInFavorites) {
      return;
    }

    this.setData({
      selectedAreaIndex: targetAreaIndex
    });

    setTimeout(() => {
      const targetOffset = this.data.areaOffsets[targetAreaIndex];
      if (targetOffset !== undefined) {
        this.setData({
          scrollTop: targetOffset
        });
      }
    }, 500);
  },

  onReady() {
    // 简单延迟初始化，不使用过期的API
    setTimeout(() => {
      this.initAreaPositions();
    }, 800); // 增加延迟时间，确保DOM完全渲染
  },

  // 新增方法：设置滚动视图高度
  setScrollViewHeight(availableHeight) {
    // 通过动态样式设置滚动容器高度
    const query = wx.createSelectorQuery().in(this);
    query.select('.store-section').boundingClientRect();
    
    query.exec((res) => {
      if (res[0]) {
        console.log('门店区域当前高度:', res[0].height);
        console.log('应该设置的高度:', availableHeight);
        
        // 如果需要，可以通过setData设置动态样式
        // 这里主要是为了调试和确认高度计算
      }
    });
  },

  // 初始化地图数据
  initMap() {
    const currentCity = this.data.currentCity;
    console.log("currentCity:", currentCity);
    const amapKey = config.AMAP_KEY;
    if (!currentCity) {
      console.warn('当前城市为空');
      return;
    }
    
    const queryCity = (cityName) => {
      return new Promise((resolve, reject) => {
        wx.request({
          url: 'https://restapi.amap.com/v3/geocode/geo',
          method: 'GET',
          data: {
            key: amapKey,
            address: cityName
          },
          success(res) {
            if (res.data.status === '1' && res.data.geocodes.length > 0) {
              const locationStr = res.data.geocodes[0].location;
              const [lng, lat] = locationStr.split(',');
              resolve({ longitude: parseFloat(lng), latitude: parseFloat(lat) });
            } else {
              reject(new Error('未能获取经纬度'));
            }
          },
          fail(err) {
            reject(err);
          }
        });
      });
    };

    // 调用查询
    queryCity(currentCity).catch(() => {
      // 若失败，加上"市"再试一次
      if (!currentCity.endsWith('市')) {
        return queryCity(currentCity + '市');
      }
      throw new Error('城市解析失败');
    }).then(location => {
      const latitude = location.latitude;
      const longitude = location.longitude;
      // 修改 markers 配置
      const markers = [
        {
          id: 1,
          latitude: latitude + 0.002,
          longitude: longitude + 0.002,
          iconPath: '/assets/marker.png',
          width: 30,
          height: 30,
          title: '门店1',
          alpha: 1,
          rotate: 0,
          label: {
            content: '门店1',
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#ffffff',
            padding: 4,
            textAlign: 'center'
          }
        },
        {
          id: 2,
          latitude: latitude - 0.001,
          longitude: longitude - 0.001,
          iconPath: '/assets/marker.png',
          width: 30,
          height: 30,
          title: '门店2',
          alpha: 1,
          rotate: 0,
          label: {
            content: '门店2',
            color: '#000000',
            fontSize: 12,
            borderRadius: 4,
            bgColor: '#ffffff',
            padding: 4,
            textAlign: 'center'
          }
        }
      ];
      this.setData({
        latitude: latitude,
        longitude: longitude,
        markers
      });
    }).catch(err => {
      console.error('地图初始化失败:', err);
    });
  },

  onCityTap() {
    wx.navigateTo({
      url: `/pages/citySelect/citySelect?source=${this.data.sourceUrl}`
    });
  },

  onSearchTap() {
    this.setData({
      showSearchMask: true
    });
  },

  onMapTap() {
    wx.showToast({
      title: '地图功能点击',
      icon: 'none'
    });
    wx.navigateTo({
      url: `/pages/mapGuide/mapGuide`,
    });
  },

  onViewBigMap() {
    wx.navigateTo({
      url: `/pages/mapGuide/mapGuide`,
    });
  },

  onCancelSearch() {
    this.setData({
      showSearchMask: false
    });
  },

  onCityChange(e) {
    const city = this.data.cityList[e.detail.value];
    this.setData({ currentCity: city });
  },

  // 修复：优化区域点击事件
  onAreaTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    const currentTime = Date.now();
    
    if (index === undefined || index === null || isNaN(index)) {
      console.error("无效的区域索引");
      return;
    }
    
    // 防止快速连续点击
    if (currentTime - this.data.lastClickTime < 300) {
      return;
    }
    
    console.log(`点击区域: ${index}, 区域名: ${this.data.areaList[index]?.name}`);
    
    // 立即设置选中状态和标记为主动滚动
    this.setData({ 
      selectedAreaIndex: index,
      isScrolling: true,
      lastClickTime: currentTime
    });
  
    // 滚动到目标位置
    const targetOffset = this.data.areaOffsets[index];
    
    if (targetOffset !== undefined && targetOffset >= 0) {
      // 对于最后一个区域，使用特殊处理
      if (index === this.data.areaList.length - 1) {
        // 滚动到最底部
        this.setData({
          scrollTop: 999999 // 使用一个很大的值确保滚动到底部
        });
      } else {
        this.setData({
          scrollTop: targetOffset
        });
      }
    }
    
    // 500ms后重置滚动状态，允许滚动监听重新生效
    setTimeout(() => {
      this.setData({
        isScrolling: false
      });
    }, 500);
  },

  // 修复：优化滚动监听事件
  onStoreScroll(e) {
    // 如果是主动滚动（点击引起），则不处理
    if (this.data.isScrolling) {
      return;
    }
    
    const scrollTop = e.detail.scrollTop;
    const offsets = this.data.areaOffsets;
    
    if (offsets.length === 0) return;
  
    let targetIndex = 0;
    
    // 改进的区域判断逻辑
    const threshold = 50; // 阈值，避免频繁切换
    
    // 检查是否接近底部
    const scrollHeight = e.detail.scrollHeight;
    const clientHeight = e.detail.clientHeight || 400; // 默认高度
    
    // 如果滚动接近底部，选中最后一个区域
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      targetIndex = offsets.length - 1;
    } else {
      // 正常的区域判断
      for (let i = offsets.length - 1; i >= 0; i--) {
        if (scrollTop >= offsets[i] - threshold) {
          targetIndex = i;
          break;
        }
      }
    }
  
    // 防止频繁更新
    if (this.data.selectedAreaIndex !== targetIndex) {
      console.log(`滚动切换到区域: ${targetIndex}, 区域名: ${this.data.areaList[targetIndex]?.name}`);
      this.setData({
        selectedAreaIndex: targetIndex
      });
    }
  },

  // 修复：优化区域位置初始化
  initAreaPositions(callback) {
    const query = wx.createSelectorQuery().in(this);
    
    // 获取滚动容器信息
    query.select('#storeScrollView').boundingClientRect();
    // 获取所有区域标题的位置信息
    query.selectAll('.area-title').boundingClientRect();
    
    query.exec((res) => {
      console.log("位置查询结果:", res);
      
      if (!res[0] || !res[1] || res[1].length === 0) {
        console.warn('无法获取元素位置信息，稍后重试');
        setTimeout(() => {
          this.initAreaPositions(callback);
        }, 500);
        return;
      }
  
      const scrollViewRect = res[0];
      const titleRects = res[1];
      
      // 计算每个区域标题相对于滚动容器的偏移量
      const offsets = titleRects.map((rect, index) => {
        const offset = Math.max(0, rect.top - scrollViewRect.top);
        console.log(`区域${index} (${this.data.areaList[index]?.name}) 偏移量: ${offset}`);
        return offset;
      });
      
      console.log("所有偏移量:", offsets);
      
      this.setData({
        areaOffsets: offsets
      });
      
      if (typeof callback === 'function') {
        callback();
      }
    });
  },

  // 门店卡片点击事件 - 恢复所有门店的选择功能
  onCardTap(e) {
    const storeData = e.currentTarget.dataset.store;
    const areaName = e.currentTarget.dataset.area;
    const storeName = storeData.name;
    
    console.log("点击门店:", storeName, "区域:", areaName);
    
    // 所有门店都可以选择，不做限制
    console.log("选择门店:", storeName);
    
    // 更新页面选中状态
    this.setData({
      selectedStore: storeName,
      currentStore: storeName
    });
    
    // 保存完整门店信息到存储
    const storeInfo = {
      name: storeName,
      address: storeData.address,
      phone: storeData.phone,
      id: storeData.id,
      latitude: storeData.latitude,
      longitude: storeData.longitude,
      openTime: storeData.openTime,
      closeTime: storeData.closeTime,
      tags: storeData.tags || [],
      selectedTime: Date.now() // 记录选择时间
    };
    
    // 存储选中的门店信息
    wx.setStorageSync('selectedStore', storeName);
    wx.setStorageSync('selectedStoreInfo', storeInfo);
    wx.setStorageSync('currentCity', this.data.currentCity);
    
    // 保存为常用门店
    this.saveFavoriteStore(storeInfo);
    
    console.log('已保存门店信息到存储:', storeInfo);
    
    // 显示选择成功提示
    wx.showToast({
      title: '已选择门店',
      icon: 'success',
      duration: 1000
    });
    
    // 延迟返回，让用户看到选中效果和提示
    setTimeout(() => {
      // 触发全局事件，通知其他页面更新
      getApp().globalData.selectedStore = storeInfo;
      
      // 返回上个页面
      this.backToPreviousPage();
    }, 1000);
  },

  // 返回上个页面
  backToPreviousPage() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      });
    } else {
      // 如果没有上级页面，跳转到首页
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  onPhoneTap(e) {
    const phone = e.currentTarget.dataset.phone;
    if (phone) {
      wx.makePhoneCall({ phoneNumber: phone });
    }
  },

  onGuideTap(e) {
    const { lat, lng, name, address } = e.currentTarget.dataset;
    wx.openLocation({
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      name: name,
      address: address
    });
  },

  onBack() {
    // 直接返回，不需要传递参数
    this.backToPreviousPage();
  }
});