const loginCheck = require('../../behaviors/loginCheck.js');
import config from '../../config/config.js'
import { startEid } from '../../mp_ecard_sdk/main'

Page({
  behaviors: [loginCheck],
  
  data: {
    isLoggedIn: false, // 初始化为false，在onShow中更新
    needsReload: false,
    username: '',
    avatarUrl: '../../assets/yh.png',
    eidToken: "",
    isRealNameVerified: false, // 实名认证状态

    tags: [
      { id: '1', name: '实名认证', icon: '../../assets/myquickaccess/smrz.png', url: '/pages/auth-info/auth-info' },
      { id: '2', name: '出车记录', icon: '../../assets/myquickaccess/ccjl.png', url: '/pages/vehicle-record/vehicle-record' },
      { id: '3', name: '属具记录', icon: '../../assets/myquickaccess/sjjl.png', url: '/pages/equipment/record' },
    ]
  },

  goToLogin() {
    console.log("77777777766666");
    const redirectUrl = '/pages/my/my'
    wx.navigateTo({
      url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`,
    });
  },
  
  goToMembership() {
    wx.navigateTo({
      url: '/pages/membership/membership'
    });
  },

  contactCustomerService() {
    wx.showToast({
      title: '联系客服功能',
      icon: 'none',
    });
  },

  openSettings() {
    if (!this.checkLogin('/pages/settings/settings', {})) return;
    wx.navigateTo({
      url: '/pages/settings/settings',
    });
  },

  // 跳转到订单页面（tabBar）
  goToOrders() {
    if (!this.checkLogin()) return;
    wx.switchTab({
      url: '/pages/order/order' // 假设订单页面是tabBar页面
    });
  },

  onLoad(options) {
    this.getEidToken();
  },

  onReady() {
    this.getEidToken();
  },

  onShow() {
    // 每次显示页面时刷新用户信息
    this.refreshUserInfo();
  },

  onHide() {},
  onUnload() {},
  onPullDownRefresh() {},
  onReachBottom() {},
  onShareAppMessage() {},

  // 刷新用户信息
  refreshUserInfo() {
    const isLoggedIn = wx.getStorageSync('isLoggedIn') || false;
    
    if (isLoggedIn) {
      const userInfo = wx.getStorageSync('userInfo') || {};
      this.setData({
        isLoggedIn: true,
        username: userInfo.wechatName || '用户昵称',
        avatarUrl: userInfo.avatar || '../../assets/yh.png',
        needsReload: false
      });
      
      // 如果已登录，检查实名认证状态
      this.checkRealNameStatus();
    } else {
      this.setData({
        isLoggedIn: false,
        username: '用户昵称',
        avatarUrl: '../../assets/yh.png',
        isRealNameVerified: false
      });
    }
  },

  // 检查实名认证状态
  checkRealNameStatus() {
    // 模拟API调用检查实名认证状态
    // 这里先用随机数模拟，实际项目中替换为真实API调用
    console.log("99999999999900000000000");
    const mockApiCall = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log("55555555555555");
          // 随机返回true或false模拟实名认证状态
          const isVerified = Math.random() > 0.5;
          resolve(isVerified);
        }, 500);
      });
    };

    mockApiCall().then((isVerified) => {
      console.log("isVerified4444444:",isVerified);
      this.setData({
        isRealNameVerified: isVerified
      });
    }).catch((error) => {
      console.error('检查实名认证状态失败:', error);
    });

    // 真实API调用示例（注释掉的代码）
    /*
    wx.request({
      url: config.baseUrl + 'user/checkRealNameStatus',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.data && res.data.success) {
          this.setData({
            isRealNameVerified: res.data.data.isVerified || false
          });
        }
      },
      fail: (error) => {
        console.error('检查实名认证状态失败:', error);
      }
    });
    */
  },

  navigateToPage(e) {
    const url = e.currentTarget.dataset.url;
    
    // 检查登录状态
    if (!this.checkLogin('', {})) {
      this.goToLogin
    }

    // 如果是实名认证页面，需要特殊处理
    if (url === "/pages/auth-info/auth-info") {
      this.handleRealNameAuth();
    } else {
      // 普通页面直接跳转
      wx.navigateTo({
        url: url
      });
    }
  },

  // 处理实名认证逻辑
  handleRealNameAuth() {
    console.log("11111111111111222222");
    if (this.data.isRealNameVerified) {
      // 已通过实名认证，跳转到实名认证信息页面
      wx.navigateTo({
        url: '/pages/auth-info/auth-info' // 显示实名认证信息的页面
      });
    } else {
      console.log("000000000000");
      // 未通过实名认证，进行人脸核身
      if (!this.data.eidToken) {
        wx.showToast({
          title: "获取 Token 失败，请稍后重试",
          icon: "none"
        });
        return;
      }

      // wx.showLoading({ title: "实名认证中..." });
      this.goSDK(this.data.eidToken, '/pages/auth-info/auth-info');
    }
  },

  // 获取 e 证通身份验证 Token
  getEidToken() {
    wx.request({
      url: config.baseUrl + 'wechat/tencent/realnameauth/getEidToken', 
      method: "GET",
      data: {},
      success: (res) => {
        if (res.data && res.data.result && res.data.result.EidToken) {
          this.setData({ eidToken: res.data.result.EidToken });
        }
      },
      fail: (error) => {
        console.error('获取EidToken失败:', error);
      }
    });
  },

  goSDK(token, targetUrl) {
    startEid({
      data: {
        token,
      },
      verifyCallback: (res) => {
        wx.hideLoading();
        const { verifyDone } = res;

        if (verifyDone) {
          wx.showToast({
            title: "核身成功",
            icon: "success"
          });

          // 核身成功后跳转到目标页面
          wx.navigateTo({
            url: targetUrl
          });

          // 更新实名认证状态
          this.setData({
            isRealNameVerified: true
          });
        } else {
          wx.showToast({
            title: "核身失败，请重试",
            icon: "none"
          });
        }
      },
      verifyDoneCallback(res) {  
        const { token, verifyDone } = res;
        console.log('收到核身完成的res:', res);
        console.log('核身的token是:', token); 
        console.log('是否完成核身:', verifyDone);          
      },
    });
  },

  // 处理菜单项点击
  handleMenuClick(e) {
    const type = e.currentTarget.dataset.type;
    
    switch(type) {
      case 'orders':
        this.goToOrders();
        break;
      case 'coupons':
        if (!this.checkLogin()) return;
        wx.navigateTo({
          url: '/pages/coupons/coupons'
        });
        break;
      case 'settings':
        this.openSettings();
        break;
      default:
        wx.showToast({
          title: '功能开发中',
          icon: 'none'
        });
    }
  }
})