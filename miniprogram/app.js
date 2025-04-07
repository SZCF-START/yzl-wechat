import { initEid } from './mp_ecard_sdk/main';
App({
  onLaunch() {
    initEid();
    // this.methods.updateManager()
  },
  
  globalData: {
    userInfo: null,
    isLocationEnabled: false, // 全局定位状态
    token: wx.getStorageSync('token') || '',
    pagesRequiringAuth: [ // 需要校验登录的页面
      // 'pages/settings/settings',
      // 'pages/order/order',
      // 'pages/cart/cart'
    ]
  },

  // 检测定位权限方法
  checkLocationPermission() {
    const that = this;
    wx.getPrivacySetting({
      success(res) {
        if (res.needAuthorization) {
          // 需要弹出隐私协议
          this.setData({
            isLocationEnabled: true
          })
        } else {
          // 用户已经同意过隐私协议，所以不需要再弹出隐私协议，也能调用隐私接口
        }
      },
      fail(err) {
        console.error("获取隐私设置失败", err);
        // 根据需求，失败时可以进行额外处理
      }
    });
  },
  

  onLaunch() {
    console.log('App 启动');
    this.overridePage();
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

