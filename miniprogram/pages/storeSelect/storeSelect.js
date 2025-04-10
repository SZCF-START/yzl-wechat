const amapFile = require('../../utils/amap-wx.130');
import config from '../../config/config.js'
Page({
  data: {
    currentCity: '长沙',
    cityList: ['长沙', '北京', '广州'],
    latitude: 28.2282,
    longitude: 112.9388,
    markers: [
      {
        id: 1,
        latitude: 28.2282,
        longitude: 112.9388,
        iconPath: '/assets/marker.png',
        width: 30,
        height: 30
      }
    ],
    selectedAreaIndex: 0,
    areaList: [
      {
        name: '天心区',
        stores: [
          {
            name: '长沙先锋店',
            address: '芙蓉南路中信凯旋蓝岸花园16.17栋103室',
            openTime: '08:00',
            closeTime: '20:00',
            supportSelfReturn: true,
            beeBox: true,
            orderableTomorrow: true
          },
          {
            name: '长沙长盛岚庭店',
            address: '竹塘西路378号长盛岚庭小区东二栋门面',
            openTime: '08:00',
            closeTime: '20:00',
            supportSelfReturn: true,
            beeBox: true,
            orderableTomorrow: true
          }
        ]
      },
      {
        name: '芙蓉区',
        stores: [
          {
            name: '贺龙体育馆便捷点',
            address: '芙蓉中路白沙广场停车场',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点',
            address: '书院南路与南二环交汇处',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      }
    ]
  },

  // 初始化地图数据
  initMap() {
    const myAmapFun = new amapFile.AMapWX({ key: config.WECHAT_AMAP_KEY });

    wx.getLocation({
      type: 'gcj02',
      success: res => {
        const { latitude, longitude } = res;
        this.setData({ latitude, longitude });

        // 模拟门店打点
        const markers = [
          {
            id: 1,
            latitude: latitude + 0.002,
            longitude: longitude + 0.002,
            iconPath: '/assets/marker.png',
            width: 30,
            height: 30,
            title: '门店1'
          },
          {
            id: 2,
            latitude: latitude - 0.001,
            longitude: longitude - 0.001,
            iconPath: '/assets/marker.png',
            width: 30,
            height: 30,
            title: '门店2'
          }
        ];
        this.setData({ markers });
      }
    });
  },

  onCityTap() {
    wx.navigateTo({
      url: '/pages/citySelect/citySelect'
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
  },

  onCancelSearch() {
    this.setData({
      showSearchMask: false
    });
  },

  onCityChange(e) {
    const city = this.data.cityList[e.detail.value];
    this.setData({ currentCity: city });

    // 可调用腾讯/高德地理编码服务，根据城市更新经纬度
  },

  onAreaTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ selectedAreaIndex: index });
    wx.pageScrollTo({
      selector: `#area-${index}`,
      duration: 300
    });
  },

  onStoreScroll(e) {
    // 可加入滚动同步逻辑
  }
});
