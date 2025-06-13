const amapFile = require('../../utils/amap-wx.130');
import config from '../../config/config.js'
import { backPage } from '../../utils/index.js'

Page({
  data: {
    currentCity: '长沙',
    currentStore: '',
    cityList: ['长沙', '北京', '广州'],
    latitude: 28.2282,
    longitude: 112.9388,
    markers: [
      
    ],
    selectedAreaIndex: 0,
    areaOffsets: [],
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
            orderableTomorrow: true,
            tags: [
              { label: "高铁站", type: "default" },
              { label: "库存紧张", type: "danger" },
              { label: "可下全天订单", type: "highlight" }
            ]
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
      },
      {
        name: '芙蓉区1',
        stores: [
          {
            name: '贺龙体育馆便捷点1',
            address: '芙蓉中路白沙广场停车场1',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点1',
            address: '书院南路与南二环交汇处1',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区2',
        stores: [
          {
            name: '贺龙体育馆便捷点2',
            address: '芙蓉中路白沙广场停车场2',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点2',
            address: '书院南路与南二环交汇处2',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区3',
        stores: [
          {
            name: '贺龙体育馆便捷点3',
            address: '芙蓉中路白沙广场停车场3',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点3',
            address: '书院南路与南二环交汇处3',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区4',
        stores: [
          {
            name: '贺龙体育馆便捷点4',
            address: '芙蓉中路白沙广场停车场4',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点4',
            address: '书院南路与南二环交汇处4',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区5',
        stores: [
          {
            name: '贺龙体育馆便捷点5',
            address: '芙蓉中路白沙广场停车场5',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点5',
            address: '书院南路与南二环交汇处5',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区6',
        stores: [
          {
            name: '贺龙体育馆便捷点6',
            address: '芙蓉中路白沙广场停车场6',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点6',
            address: '书院南路与南二环交汇处6',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区7',
        stores: [
          {
            name: '贺龙体育馆便捷点7',
            address: '芙蓉中路白沙广场停车场7',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点7',
            address: '书院南路与南二环交汇处7',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区8',
        stores: [
          {
            name: '贺龙体育馆便捷点8',
            address: '芙蓉中路白沙广场停车场8',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点8',
            address: '书院南路与南二环交汇处8',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区9',
        stores: [
          {
            name: '贺龙体育馆便捷点9',
            address: '芙蓉中路白沙广场停车场9',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点9',
            address: '书院南路与南二环交汇处9',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区10',
        stores: [
          {
            name: '贺龙体育馆便捷点10',
            address: '芙蓉中路白沙广场停车场10',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点10',
            address: '书院南路与南二环交汇处10',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区11',
        stores: [
          {
            name: '贺龙体育馆便捷点11',
            address: '芙蓉中路白沙广场停车场11',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点11',
            address: '书院南路与南二环交汇处11',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区12',
        stores: [
          {
            name: '贺龙体育馆便捷点12',
            address: '芙蓉中路白沙广场停车场12',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点12',
            address: '书院南路与南二环交汇处12',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      },
      {
        name: '芙蓉区13',
        stores: [
          {
            name: '贺龙体育馆便捷点13',
            address: '芙蓉中路白沙广场停车场13',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          },
          {
            name: '新开铺送车点13',
            address: '书院南路与南二环交汇处13',
            openTime: '09:00',
            closeTime: '19:00',
            supportSelfReturn: false,
            beeBox: false,
            orderableTomorrow: false
          }
        ]
      }
    ],
    scrollIntoId: "",
    nbBackgroundColor: "#efefef",
    sourceUrl: ''
  },

  onLoad(options) {
    this.setData({ 
      currentCity: options.city,
      sourceUrl: decodeURIComponent(options.source) ,
      currentStore: options.store
    });
    this.initMap()
  },

  // 初始化地图数据
  initMap() {
    const currentCity = this.data.currentCity;
    console.log("currentCity:",currentCity);
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
      // 若失败，加上“市”再试一次
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
          // 1. 检查图标路径 - 确保文件存在
          iconPath: '/assets/marker.png', // 使用绝对路径
          width: 30,
          height: 30,
          title: '门店1',
          // 2. 添加更多属性确保显示
          alpha: 1, // 透明度
          rotate: 0, // 旋转角度
          // 3. 使用 label 作为备选显示方案
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
      // 设置数据或初始化地图组件
      this.setData({
        latitude: latitude,
        longitude: longitude,
        markers
      });
      // 你还可以在这里调用 wx.createMapContext 或其他地图渲染逻辑
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

    // 可调用腾讯/高德地理编码服务，根据城市更新经纬度
  },

  onAreaTap(e) {
    const index = e.target.dataset.index;
    console.log("index:",index);
    this.setData({ 
      selectedAreaIndex: index,
      scrollIntoId: `area-${index}`  // 动态设置 scroll-into-view 的锚点ID 
    }, () => {
      // 添加延迟确保滚动生效
      setTimeout(() => {
        this.setData({ scrollIntoId: '' }); // 重置以允许重复触发相同ID
      }, 100);
    });
    // wx.pageScrollTo({
    //   selector: `#area-${index}`,
    //   duration: 300
    // });
  },

  onStoreScroll(e) {
    // 可加入滚动同步逻辑
    const scrollTop = e.detail.scrollTop;
    console.log("scrollTop:",scrollTop);
    const offsets = this.data.areaOffsets;
    console.log("offsets:",offsets);

    for (let i = 0; i < offsets.length; i++) {
      const current = offsets[i];
      const next = offsets[i + 1] ?? Infinity;
      console.log("next:",next);
      if (scrollTop >= current && scrollTop < next && this.data.selectedAreaIndex !== offsets.length-1) {
        if (this.data.selectedAreaIndex !== i) {
          this.setData({
            selectedAreaIndex: i
          });
        }
        break;
      }
    }
  },
  onReady() {
    this.initAreaPositions(); // 页面加载后初始化位置
  },
  // 初始化区域位置
  initAreaPositions() {
    const query = wx.createSelectorQuery().in(this);
    query.select('.store-list').boundingClientRect();
    query.selectAll('.area-section').boundingClientRect();
    query.exec((res) => {
      console.log("res:",res);
      const containerTop = res[0].top + 10;
      console.log("containerTop:",containerTop);
      const sectionRects = res[1];
      console.log("sectionRects:",sectionRects);
      const offsets = sectionRects.map(rect => rect.top - containerTop);
      this.setData({
        areaOffsets: offsets
      });
    });
  },

  onCardTap(e) {
    console.log("222",e.currentTarget.dataset.store.name);
    const store = e.currentTarget.dataset.store.name
    if(this.data.sourceUrl === '/pages/index/index') {
      wx.setStorageSync('selectedStore', store);
      wx.setStorageSync('currentCity', this.data.currentCity);
    }
    console.log("333store,",store);
    
    backPage({ 
      backUrl: this.data.sourceUrl, 
      pageData: {
        currentCity: this.data.currentCity,
        currentStore: store
      } 
    })
  },
  onPhoneTap() {
    wx.makePhoneCall({ phoneNumber: this.data.selectedStore.phone });
  },
  onGuideTap() {
    const store = this.data.selectedStore;
    wx.openLocation({
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.address
    });
  },
  onBack() {
    const condition = this.data.sourceUrl === '/pages/index/index';
    console.log("condition:",condition);
    backPage({ 
      backUrl: this.data.sourceUrl ,
      pageData: condition ? {} : {
        currentCity: this.data.currentCity,
        currentStore: this.data.currentStore
      } 
    })
  }
});
