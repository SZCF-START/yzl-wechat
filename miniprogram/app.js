import { initEid } from './mp_ecard_sdk/main';
const privacyStatusManager = require('./utils/privacyStatusManager');
App({
  onLaunch() {
    console.log('App 启动');
    initEid();
    // this.methods.updateManager()
    
    this.overridePage();
    // 启动时检查一次隐私权限
    // privacyStatusManager.initPrivacyCheck();
  },
  
  globalData: {
    userInfo: null,
    isLocationEnabled: false, // 全局定位状态
    token: wx.getStorageSync('token') || '',
    pagesRequiringAuth: [ // 需要校验登录的页面
      // 'pages/settings/settings',
      // 'pages/order/order',
      // 'pages/cart/cart'
    ],
    routeHistory: []
  },

  onShow(options) {
    this.globalData.routeHistory.push(options.path);
  },

  // 检测定位权限方法
  checkLocationPermission() {
    const that = this;
    wx.getPrivacySetting({
      success(res) {
        that.globalData.isLocationEnabled = res.needAuthorization;
        // 触发全局事件（通知所有页面）
        wx.eventBus.emit('privacyStatusChange', res.needAuthorization);
      },
      fail(err) {
        console.error("获取隐私设置失败", err);
        // 根据需求，失败时可以进行额外处理
      }
    });
  },
  
  overridePage() {
    const originalPage = Page; // 保存原始 Page 方法

    Page = (options) => {
      // 备份用户的 onLoad 方法
      const userOnLoad = options.onLoad;

      options.onLoad = function (query) {
        console.log('Global Page Hook - 检查登录状态');
        const app = getApp();
        const token = wx.getStorageSync('token');

        // 判断当前页面是否需要登录
        const currentPage = this.route; // 获取当前页面路径
        console.log('当前登录页面——>' + currentPage);
        if (app.globalData.pagesRequiringAuth.includes(currentPage) && !token) {
          console.log(`未登录，跳转到登录页 -> ${currentPage}`);
          
          let redirectUrl = `/${currentPage}`;
          if (query && Object.keys(query).length > 0) {
            const params = Object.keys(query)
              .map(key => `${key}=${query[key]}`)
              .join('&');
            redirectUrl += '?' + params;
          }

          wx.redirectTo({
            url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`
          });
          return; // 终止页面 onLoad 执行
        }

        // 执行原始 onLoad 方法
        if (typeof userOnLoad === 'function') {
          userOnLoad.call(this, query);
        }
      };

      originalPage(options); // 调用原始 Page 方法
    };
  }
});

