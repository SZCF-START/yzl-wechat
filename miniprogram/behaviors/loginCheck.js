module.exports = Behavior({
  // lifetimes: {
  //   attached() {
  //     this.checkLogin();
  //   }
  // },
  methods: {
    checkLogin(route = '', options = {}) {
      const token = wx.getStorageSync('token'); // 获取本地存储的 token
    
      if (!token) {
        // 如果没有传入 route，则自动获取当前页面路径和参数
        if (!route) {
          const pages = getCurrentPages();
          if (pages.length > 0) {
            const currentPage = pages[pages.length - 1];
            route = currentPage.route;
            options = currentPage.options || {};
          }
        }
    
        // 组装参数
        let queryString = '';
        if (options && Object.keys(options).length > 0) {
          queryString = Object.keys(options)
            .map(key => `${key}=${options[key]}`)
            .join('&');
        }
    
        const redirectUrl = queryString ? `/${route}?${queryString}` : `/${route}`;
    
        // 跳转到登录页面，并携带重定向信息
        wx.reLaunch({
          url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`
        });
    
        return false; // 未登录，跳转到登录页面
      }
    
      return true; // 已登录
    }    
  }
});
