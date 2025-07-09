Page({
  data: {
    // 订单摘要信息
    orderSummary: {
      vehicleName: '三一SY16C-001',
      pickupTime: '2024年08月21日 21:00',
      returnTime: '2024年08月28日 21:00',
      dashboardHours: '1250.5'
    },
    
    // 页面加载状态
    isLoaded: false,
    
    // 成功动画状态
    showSuccessAnimation: false
  },

  onLoad: function(options) {
    // 获取传递的订单信息
    const orderData = options.orderData;
    if (orderData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(orderData));
        this.setOrderSummary(parsedData);
      } catch (error) {
        console.error('解析订单数据失败:', error);
        // 使用默认数据
        this.setDefaultOrderSummary();
      }
    } else {
      // 使用默认数据
      this.setDefaultOrderSummary();
    }
    
    // 延迟显示成功动画
    setTimeout(() => {
      this.setData({
        isLoaded: true,
        showSuccessAnimation: true
      });
    }, 300);
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '出车成功'
    });
    
    // 上报成功页面访问
    this.reportPageView();
  },

  onShow: function() {
    // 页面显示时的处理
    console.log('取车成功页面显示');
  },

  onHide: function() {
    // 页面隐藏时的处理
    console.log('取车成功页面隐藏');
  },

  // 设置订单摘要信息
  setOrderSummary: function(orderData) {
    const currentTime = new Date();
    const returnTime = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 7天后
    
    this.setData({
      orderSummary: {
        vehicleName: orderData.vehicleName || '三一SY16C-001',
        pickupTime: this.formatDate(currentTime),
        returnTime: this.formatDate(returnTime),
        dashboardHours: orderData.dashboardHours || '1250.5'
      }
    });
  },

  // 设置默认订单摘要
  setDefaultOrderSummary: function() {
    const currentTime = new Date();
    const returnTime = new Date(currentTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    this.setData({
      orderSummary: {
        vehicleName: '三一SY16C-001',
        pickupTime: this.formatDate(currentTime),
        returnTime: this.formatDate(returnTime),
        dashboardHours: '1250.5'
      }
    });
  },

  // 格式化日期
  formatDate: function(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
  },

  // 返回订单列表
  backToOrders: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 模拟跳转延迟
    setTimeout(() => {
      wx.hideLoading();
      
      // 跳转到订单列表页面
      wx.reLaunch({
        url: '/pages/orders/orders',
        success: () => {
          console.log('跳转到订单列表成功');
        },
        fail: (error) => {
          console.error('跳转到订单列表失败:', error);
          wx.showToast({
            title: '跳转失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }, 500);
  },

  // 返回首页
  goToHome: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 模拟跳转延迟
    setTimeout(() => {
      wx.hideLoading();
      
      // 跳转到首页
      wx.reLaunch({
        url: '/pages/index/index',
        success: () => {
          console.log('跳转到首页成功');
        },
        fail: (error) => {
          console.error('跳转到首页失败:', error);
          wx.showToast({
            title: '跳转失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    }, 500);
  },

  // 分享订单信息
  shareOrderInfo: function() {
    const { orderSummary } = this.data;
    
    // 准备分享内容
    const shareText = `
🎉 出车成功！
🚚 车辆：${orderSummary.vehicleName}
⏰ 取车时间：${orderSummary.pickupTime}
📅 预计还车：${orderSummary.returnTime}
⏱️ 工作小时：${orderSummary.dashboardHours}小时
    `.trim();
    
    // 复制到剪贴板
    wx.setClipboardData({
      data: shareText,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success',
          duration: 2000
        });
      },
      fail: (error) => {
        console.error('复制失败:', error);
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 联系客服
  contactSupport: function() {
    wx.showActionSheet({
      itemList: ['拨打客服电话', '在线客服'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 拨打客服电话
          this.callSupport();
        } else if (res.tapIndex === 1) {
          // 在线客服
          this.openOnlineSupport();
        }
      },
      fail: (error) => {
        console.log('取消选择:', error);
      }
    });
  },

  // 拨打客服电话
  callSupport: function() {
    const supportPhone = '400-123-4567'; // 客服电话
    
    wx.makePhoneCall({
      phoneNumber: supportPhone,
      success: () => {
        console.log('拨打客服电话成功');
      },
      fail: (error) => {
        console.error('拨打客服电话失败:', error);
        wx.showToast({
          title: '拨打失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 打开在线客服
  openOnlineSupport: function() {
    // 这里可以跳转到在线客服页面或打开客服系统
    wx.showToast({
      title: '在线客服功能开发中',
      icon: 'none',
      duration: 2000
    });
  },

  // 上报页面访问
  reportPageView: function() {
    try {
      // 上报页面访问数据
      const reportData = {
        page: 'pickup-success',
        timestamp: Date.now(),
        orderInfo: this.data.orderSummary
      };
      
      console.log('上报成功页面访问:', reportData);
      
      // 实际开发中这里会调用埋点API
      // this.reportAnalytics(reportData);
    } catch (error) {
      console.error('上报页面访问失败:', error);
    }
  },

  // 处理页面错误
  onError: function(error) {
    console.error('页面错误:', error);
    
    // 显示错误提示
    wx.showToast({
      title: '页面出现错误',
      icon: 'none',
      duration: 2000
    });
  },

  // 页面分享配置
  onShareAppMessage: function() {
    return {
      title: '出车成功 - 设备租赁',
      path: '/pages/index/index',
      imageUrl: '../../assets/share-logo.png'
    };
  },

  // 页面分享到朋友圈
  onShareTimeline: function() {
    return {
      title: '出车成功 - 设备租赁',
      imageUrl: '../../assets/share-logo.png'
    };
  }
});