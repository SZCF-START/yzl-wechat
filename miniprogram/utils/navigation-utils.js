/**
 * 页面导航工具类
 * 统一管理小程序页面跳转逻辑
 */

class NavigationUtils {
  
  /**
   * 跳转到续租页面
   * @param {string} orderId - 订单ID
   */
  static toRenewalPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/renewal-car/renewal-car?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转续租页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到续租成功页面
   * @param {Object} params - 跳转参数
   * @param {string} params.orderId - 订单ID
   * @param {number} params.renewDays - 续租天数
   * @param {string} params.totalAmount - 总金额
   * @param {string} params.newEndTime - 新的结束时间
   * @param {boolean} params.purchaseMembership - 是否购买会员
   * @param {Object} params.paymentDetails - 支付详情（可选）
   * @param {Object} params.orderInfo - 订单信息（可选）
   */
  static toRenewalSuccessPage(params) {
    const {
      orderId,
      renewDays,
      totalAmount,
      newEndTime,
      purchaseMembership = false,
      paymentDetails,
      orderInfo
    } = params;

    if (!orderId) {
      wx.showToast({
        title: '订单信息异常',
        icon: 'none'
      });
      return;
    }

    // 如果有完整的数据，设置到全局避免重复查询
    if (paymentDetails && orderInfo) {
      const DataManager = require('./data-manager.js');
      DataManager.setGlobalOrderData({
        orderId,
        renewDays,
        totalAmount,
        newEndTime,
        purchaseMembership,
        paymentDetails,
        orderInfo,
        timestamp: Date.now()
      });
    }

    // 构建URL，只传递必要的基本参数
    const url = `/pages/renewal-success/renewal-success?orderId=${orderId}&renewDays=${renewDays}&totalAmount=${totalAmount}&newEndTime=${encodeURIComponent(newEndTime)}&purchaseMembership=${purchaseMembership}`;
    
    wx.redirectTo({
      url: url,
      fail: (err) => {
        console.error('跳转续租成功页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到订单详情页面
   * @param {string} orderId - 订单ID
   */
  static toOrderDetailPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转订单详情页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到订单列表页面
   * @param {boolean} isTab - 是否为Tab页面
   */
  static toOrderListPage(isTab = true) {
    const navigateMethod = isTab ? 'switchTab' : 'redirectTo';
    
    wx[navigateMethod]({
      url: '/pages/order-list/order-list',
      fail: (err) => {
        console.error('跳转订单列表失败', err);
        // 如果switchTab失败，尝试redirectTo
        if (isTab) {
          this.toOrderListPage(false);
        } else {
          wx.showToast({
            title: '跳转失败',
            icon: 'none'
          });
        }
      }
    });
  }

  /**
   * 跳转到首页
   */
  static toHomePage() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: (err) => {
        console.error('跳转首页失败', err);
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    });
  }

  /**
   * 跳转到服务评价页面
   * @param {string} orderId - 订单ID
   */
  static toServiceRatingPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/service-rating/service-rating?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转服务评价页面失败', err);
        wx.showToast({
          title: '功能暂未开放',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到取车页面
   * @param {string} orderId - 订单ID
   */
  static toPickupPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/pickup/pickup?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转取车页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到还车页面
   * @param {string} orderId - 订单ID
   */
  static toReturnPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/return-car/return-car?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转还车页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到还车审核页面
   * @param {string} orderId - 订单ID
   */
  static toReturnReviewPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/return-review/return-review?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转还车审核页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 跳转到支付页面
   * @param {string} orderId - 订单ID
   */
  static toPaymentPage(orderId) {
    if (!orderId) {
      wx.showToast({
        title: '订单ID不能为空',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/payment-after-review/payment-after-review?orderId=${orderId}`,
      fail: (err) => {
        console.error('跳转支付页面失败', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 返回上一页
   * @param {number} delta - 返回页面层数，默认1
   */
  static goBack(delta = 1) {
    const pages = getCurrentPages();
    if (pages.length > delta) {
      wx.navigateBack({
        delta: delta,
        fail: (err) => {
          console.error('返回上一页失败', err);
          // 如果返回失败，跳转到首页
          this.toHomePage();
        }
      });
    } else {
      // 如果页面栈不够，跳转到首页
      this.toHomePage();
    }
  }

  /**
   * 重新加载当前页面
   */
  static reloadCurrentPage() {
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    const url = `/${currentPage.route}`;
    
    wx.reLaunch({
      url: url,
      fail: (err) => {
        console.error('重新加载页面失败', err);
        wx.showToast({
          title: '重新加载失败',
          icon: 'none'
        });
      }
    });
  }

  /**
   * 显示确认对话框后执行跳转
   * @param {Object} options - 配置选项
   * @param {string} options.title - 对话框标题
   * @param {string} options.content - 对话框内容
   * @param {Function} options.confirmCallback - 确认后的回调函数
   * @param {string} options.confirmText - 确认按钮文字
   * @param {string} options.cancelText - 取消按钮文字
   */
  static showConfirmDialog(options) {
    const {
      title = '确认操作',
      content = '确定要执行此操作吗？',
      confirmCallback,
      confirmText = '确定',
      cancelText = '取消'
    } = options;

    wx.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        if (res.confirm && typeof confirmCallback === 'function') {
          confirmCallback();
        }
      }
    });
  }
}

// 导出工具类
module.exports = NavigationUtils;