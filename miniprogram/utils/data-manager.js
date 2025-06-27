/**
 * 数据管理工具类
 * 优化页面间数据传递，减少不必要的API调用
 */

class DataManager {
  
  /**
   * 缓存订单详情数据
   * @param {string} orderId - 订单ID
   * @param {Object} orderData - 订单数据
   * @param {number} expireTime - 过期时间(毫秒)，默认5分钟
   */
  static cacheOrderData(orderId, orderData, expireTime = 5 * 60 * 1000) {
    const cacheData = {
      data: orderData,
      timestamp: Date.now(),
      expireTime: expireTime
    };
    
    try {
      wx.setStorageSync(`order_${orderId}`, cacheData);
      console.log('订单数据已缓存:', orderId);
    } catch (error) {
      console.error('缓存订单数据失败:', error);
    }
  }

  /**
   * 获取缓存的订单数据
   * @param {string} orderId - 订单ID
   * @returns {Object|null} 订单数据或null
   */
  static getCachedOrderData(orderId) {
    try {
      const cacheData = wx.getStorageSync(`order_${orderId}`);
      if (!cacheData) return null;

      const now = Date.now();
      const isExpired = now - cacheData.timestamp > cacheData.expireTime;
      
      if (isExpired) {
        // 数据已过期，清除缓存
        this.clearOrderCache(orderId);
        return null;
      }

      console.log('使用缓存的订单数据:', orderId);
      return cacheData.data;
    } catch (error) {
      console.error('获取缓存数据失败:', error);
      return null;
    }
  }

  /**
   * 清除订单缓存
   * @param {string} orderId - 订单ID
   */
  static clearOrderCache(orderId) {
    try {
      wx.removeStorageSync(`order_${orderId}`);
      console.log('已清除订单缓存:', orderId);
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  /**
   * 设置全局订单数据（用于页面间传递）
   * @param {Object} orderData - 订单数据
   */
  static setGlobalOrderData(orderData) {
    const app = getApp();
    if (!app.globalData) {
      app.globalData = {};
    }
    app.globalData.currentOrderData = {
      ...orderData,
      timestamp: Date.now()
    };
    console.log('全局订单数据已设置');
  }

  /**
   * 获取全局订单数据
   * @param {number} maxAge - 最大有效期(毫秒)，默认2分钟
   * @returns {Object|null} 订单数据或null
   */
  static getGlobalOrderData(maxAge = 2 * 60 * 1000) {
    try {
      const app = getApp();
      const globalData = app.globalData?.currentOrderData;
      
      if (!globalData) return null;

      const isExpired = Date.now() - globalData.timestamp > maxAge;
      if (isExpired) {
        // 数据过期，清除
        this.clearGlobalOrderData();
        return null;
      }

      console.log('使用全局订单数据');
      return globalData;
    } catch (error) {
      console.error('获取全局数据失败:', error);
      return null;
    }
  }

  /**
   * 清除全局订单数据
   */
  static clearGlobalOrderData() {
    try {
      const app = getApp();
      if (app.globalData) {
        delete app.globalData.currentOrderData;
      }
      console.log('全局订单数据已清除');
    } catch (error) {
      console.error('清除全局数据失败:', error);
    }
  }

  /**
   * 智能获取订单数据（优先使用缓存，必要时查询API）
   * @param {string} orderId - 订单ID
   * @param {Function} apiCallFunction - API调用函数
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<Object>} 订单数据
   */
  static async getOrderDataSmart(orderId, apiCallFunction, forceRefresh = false) {
    if (!orderId) {
      throw new Error('订单ID不能为空');
    }

    // 如果不强制刷新，先尝试获取缓存数据
    if (!forceRefresh) {
      // 1. 优先使用全局数据（最新）
      const globalData = this.getGlobalOrderData();
      console.log("globalData888:",globalData);
      if (globalData && globalData.orderId === orderId) {
        return globalData;
      }

      // 2. 其次使用本地缓存
      const cachedData = this.getCachedOrderData(orderId);
      console.log("cachedData888:",cachedData);
      if (cachedData) {
        // 同时设置到全局数据中
        this.setGlobalOrderData(cachedData);
        return cachedData;
      }
    }

    // 3. 最后调用API获取最新数据
    console.log('从API获取订单数据:', orderId);
    try {
      const freshData = await apiCallFunction(orderId);
      
      // 缓存新数据
      this.cacheOrderData(orderId, freshData);
      this.setGlobalOrderData(freshData);
      
      return freshData;
    } catch (error) {
      console.error('API获取订单数据失败:', error);
      
      // 如果API失败，尝试使用过期的缓存数据
      const expiredCache = wx.getStorageSync(`order_${orderId}`);
      if (expiredCache?.data) {
        console.log('使用过期缓存数据作为备用');
        return expiredCache.data;
      }
      
      throw error;
    }
  }

  /**
   * 更新订单状态（支付成功后调用）
   * @param {string} orderId - 订单ID
   * @param {Object} updateData - 更新的数据
   */
  static updateOrderData(orderId, updateData) {
    // 更新缓存数据
    const cachedData = this.getCachedOrderData(orderId);
    if (cachedData) {
      const updatedData = { ...cachedData, ...updateData };
      this.cacheOrderData(orderId, updatedData);
    }

    // 更新全局数据
    const globalData = this.getGlobalOrderData(10 * 60 * 1000); // 10分钟有效期
    if (globalData && globalData.orderId === orderId) {
      const updatedData = { ...globalData, ...updateData };
      this.setGlobalOrderData(updatedData);
    }
  }

  /**
   * 预加载相关订单数据
   * @param {Array} orderIds - 订单ID数组
   * @param {Function} apiCallFunction - API调用函数
   */
  static async preloadOrderData(orderIds, apiCallFunction) {
    const promises = orderIds.map(async (orderId) => {
      try {
        // 只预加载没有缓存的数据
        const cached = this.getCachedOrderData(orderId);
        if (!cached) {
          const data = await apiCallFunction(orderId);
          this.cacheOrderData(orderId, data);
        }
      } catch (error) {
        console.error(`预加载订单${orderId}失败:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('订单数据预加载完成');
  }

  /**
   * 清理所有过期缓存
   */
  static cleanExpiredCache() {
    try {
      const info = wx.getStorageInfoSync();
      const keys = info.keys.filter(key => key.startsWith('order_'));
      
      keys.forEach(key => {
        try {
          const data = wx.getStorageSync(key);
          if (data && data.timestamp) {
            const isExpired = Date.now() - data.timestamp > data.expireTime;
            if (isExpired) {
              wx.removeStorageSync(key);
              console.log('清理过期缓存:', key);
            }
          }
        } catch (error) {
          // 清理异常数据
          wx.removeStorageSync(key);
        }
      });
    } catch (error) {
      console.error('清理缓存失败:', error);
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 缓存统计
   */
  static getCacheStats() {
    try {
      const info = wx.getStorageInfoSync();
      const orderKeys = info.keys.filter(key => key.startsWith('order_'));
      
      return {
        totalKeys: orderKeys.length,
        totalSize: info.currentSize,
        orderCacheKeys: orderKeys
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return { totalKeys: 0, totalSize: 0, orderCacheKeys: [] };
    }
  }
}

module.exports = DataManager;