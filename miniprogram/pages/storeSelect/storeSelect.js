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
    scrollIntoId: ""
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
    wx.setStorageSync('selectedStore', store);
    wx.switchTab({
      url: '/pages/index/index'
    });
  },
  onPhoneTap() {
    console.log("onPhoneTap")
  },
  onGuideTap() {
    console.log("onGuideTap")
  },

  // onHide() {
  //   // 获取页面栈
  //   const pages = getCurrentPages();
    
  //   // 当前页面是门店页，倒数第二个是城市页（我们要跳过它）
  //   if (pages.length >= 2) {
  //     const prevPage = pages[pages.length - 2];
  //     console.log("prevPage:",prevPage);
  //     if (prevPage.route === 'pages/citySelect/citySelect') {
  //       // 从城市页返回，拦截并跳转首页
  //       wx.reLaunch({
  //         url: '/pages/index/index'
  //       });
  //     }
  //   }
  // },
  // onUnload() {
  //   const pages = getCurrentPages();
  //   // 页面即将卸载（通常是 navigateBack）
  //   if (pages.length >= 1) {
  //     const current = pages[pages.length - 1];
  //     const prev = pages.length > 1 ? pages[pages.length - 2] : null;
      
  //     // 如果上一个是城市页，说明是点了左上角返回
  //     if (prev && prev.route === 'pages/citySelect/citySelect') {
  //       wx.reLaunch({
  //         url: '/pages/index/index'
  //       });
  //     }
  //   }
  // }
});
