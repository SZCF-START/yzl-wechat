import { initEid } from './mp_ecard_sdk/main';
const privacyStatusManager = require('./utils/privacyStatusManager');

App({
  globalData: {
    userInfo: null,
    isLocationEnabled: false, // 全局定位状态
    token: wx.getStorageSync('token') || '',
    pagesRequiringAuth: [ // 需要校验登录的页面
      // 'pages/settings/settings',
      // 'pages/order/order',
      // 'pages/cart/cart'
    ],
    routeHistory: [],
    
    // 数据管理相关配置
    apiBaseUrl: 'https://your-api-domain.com',
    currentOrderData: null, // 用于页面间传递订单数据
    systemConfig: {
      serviceRate: 0.006, // 默认服务费率 0.6%
      membershipPrice: 299, // 会员价格
      memberDiscount: 0.8 // 会员折扣 8折
    }
  },

  onLaunch() {
    console.log('🚀 App 启动');
    
    // 原有初始化
    initEid();
    // this.methods.updateManager()
    this.overridePage();
    // 启动时检查一次隐私权限
    // privacyStatusManager.initPrivacyCheck();
    
    // 新增：初始化数据管理
    // this.initDataManager();
    
    // 新增：检查更新
    this.checkForUpdate();
    
    // 新增：获取系统信息
    this.getSystemInfo();
    
    // 新增：开发环境测试
    if (this.isDevelopment()) {
      this.runDevelopmentTests();
    }
  },

  onShow(options) {
    // 原有逻辑
    this.globalData.routeHistory.push(options.path);
    
    // 新增：应用显示时清理过期缓存
    this.cleanExpiredData();
    
    console.log('📱 应用显示');
  },

  onHide() {
    console.log('📱 应用隐藏');
    
    // 应用隐藏时保存重要数据
    this.saveImportantData();
  },

  onError(error) {
    console.error('❌ 应用错误:', error);
    
    // 错误上报
    this.reportError(error);
  },

  /**
   * 初始化数据管理（新增）
   */
  initDataManager() {
    try {
      const DataManager = require('./utils/data-manager.js');
      
      // 应用启动时清理过期缓存
      DataManager.cleanExpiredCache();
      
      // 获取缓存统计信息
      const stats = DataManager.getCacheStats();
      console.log('📊 缓存统计:', stats);
      
      console.log('✅ 数据管理器初始化完成');
    } catch (error) {
      console.error('❌ 数据管理器初始化失败:', error);
    }
  },

  /**
   * 检查小程序更新（新增）
   */
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('📦 发现新版本');
        }
      });
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });
      
      updateManager.onUpdateFailed(() => {
        console.error('❌ 新版本下载失败');
      });
    }
  },

  /**
   * 获取系统信息（新增）
   */
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      
      console.log('📱 系统信息:', {
        platform: systemInfo.platform,
        version: systemInfo.version,
        SDKVersion: systemInfo.SDKVersion
      });
    } catch (error) {
      console.error('❌ 获取系统信息失败:', error);
    }
  },

  /**
   * 清理过期数据（新增）
   */
  cleanExpiredData() {
    try {
      const DataManager = require('./utils/data-manager.js');
      DataManager.cleanExpiredCache();
      
      // 清理超过24小时的全局数据
      if (this.globalData.currentOrderData) {
        const dataAge = Date.now() - (this.globalData.currentOrderData.timestamp || 0);
        if (dataAge > 24 * 60 * 60 * 1000) { // 24小时
          this.globalData.currentOrderData = null;
          console.log('🧹 清理过期的全局订单数据');
        }
      }
    } catch (error) {
      console.error('❌ 清理过期数据失败:', error);
    }
  },

  /**
   * 保存重要数据（新增）
   */
  saveImportantData() {
    try {
      // 保存用户信息
      if (this.globalData.userInfo) {
        wx.setStorageSync('userInfo', this.globalData.userInfo);
      }
      
      // 保存token
      if (this.globalData.token) {
        wx.setStorageSync('token', this.globalData.token);
      }
      
      console.log('💾 重要数据已保存');
    } catch (error) {
      console.error('❌ 保存数据失败:', error);
    }
  },

  /**
   * 错误上报（新增）
   */
  reportError(error) {
    try {
      // 这里可以集成错误监控服务
      console.log('📤 错误上报:', error);
      
      // 简单的错误统计
      const errorLog = wx.getStorageSync('errorLog') || [];
      errorLog.push({
        error: error.toString(),
        timestamp: Date.now(),
        page: getCurrentPages().pop()?.route || 'unknown'
      });
      
      // 只保留最近50条错误记录
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      wx.setStorageSync('errorLog', errorLog);
    } catch (e) {
      console.error('❌ 错误上报失败:', e);
    }
  },

  /**
   * 判断是否为开发环境（新增）
   */
  isDevelopment() {
    try {
      const accountInfo = wx.getAccountInfoSync();
      return accountInfo.miniProgram.envVersion === 'develop';
    } catch (error) {
      return false;
    }
  },

  /**
   * 开发环境测试（新增）
   */
  runDevelopmentTests() {
    console.log('🧪 运行开发环境测试');
    
    try {
      const DataFlowTest = require('./utils/data-flow-test.js');
      
      // 延迟执行测试，避免影响应用启动
      setTimeout(() => {
        console.log('⏰ 3秒后开始执行数据流转测试...');
        DataFlowTest.runAllTests();
      }, 3000);
      
    } catch (error) {
      console.error('❌ 开发测试执行失败:', error);
    }
  },

  /**
   * 通用API请求方法（新增）
   */
  request(options) {
    return new Promise((resolve, reject) => {
      const config = {
        baseUrl: this.globalData.apiBaseUrl,
        timeout: 10000,
        header: {
          'Content-Type': 'application/json',
          'Authorization': this.globalData.token || ''
        }
      };
      
      wx.request({
        url: config.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: { ...config.header, ...options.header },
        timeout: options.timeout || config.timeout,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // token过期，清理登录信息
            this.clearUserInfo();
            reject(new Error('登录已过期'));
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  /**
   * 清理用户信息（新增）
   */
  clearUserInfo() {
    this.globalData.token = '';
    this.globalData.userInfo = null;
    
    try {
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
    } catch (error) {
      console.error('❌ 清理用户信息失败:', error);
    }
  },

  /**
   * 获取缓存调试信息（新增，用于调试）
   */
  getCacheDebugInfo() {
    try {
      const DataManager = require('./utils/data-manager.js');
      return DataManager.getCacheStats();
    } catch (error) {
      console.error('❌ 获取缓存调试信息失败:', error);
      return null;
    }
  },

  // 原有方法保持不变
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