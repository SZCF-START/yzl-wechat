Page({
  data: {
    // 审核信息
    reviewInfo: {
      orderNo: '',
      orderId: '',
      status: 'pending', // pending, approved, rejected
      statusSymbol: '⏳',
      statusTitle: '审核中',
      statusDesc: '门店正在审核您的还车申请，请耐心等待',
      storeName: '',
      carModel: '',
      managerName: '',
      managerPhone: '',
      submitTime: '',
      reviewTime: '',
      reviewReason: '',
      resultText: '',
      
      // 仪表盘数据
      initialHours: 0,
      returnHours: 0,
      totalWorkHours: 0,
      
      // 超时信息
      overtimeDays: 0,
      priceType: '',
      priceTypeName: '',
      overtimeFee: 0,
      
      // 照片
      dashboardImage: '',
      vehicleImages: []
    },
    
    // 审核进度步骤
    progressSteps: [
      {
        title: '提交申请',
        completed: true,
        time: '',
        desc: '您已成功提交还车申请'
      },
      {
        title: '门店审核',
        completed: false,
        time: '',
        desc: '门店正在审核您的申请'
      },
      {
        title: '审核完成',
        completed: false,
        time: '',
        desc: '等待审核结果'
      }
    ],
    
    // 加载状态
    isLoading: false,
    loadingText: '加载中...',
    
    // 定时刷新
    refreshTimer: null,
    refreshInterval: 30000 // 30秒刷新一次
  },

  onLoad: function(options) {
    // 从参数中获取订单ID或直接传入的审核信息
    const orderId = options.orderId;
    const reviewData = options.reviewData;
    
    if (reviewData) {
      // 如果有直接传入的审核数据，使用它
      this.setData({
        reviewInfo: JSON.parse(decodeURIComponent(reviewData))
      });
      this.updateProgressSteps();
    } else if (orderId) {
      // 根据订单ID加载审核信息
      this.loadReviewInfo(orderId);
    } else {
      // 使用模拟数据
      this.loadMockData();
    }
    
    // 如果状态是审核中，启动定时刷新
    if (this.data.reviewInfo.status === 'pending') {
      this.startAutoRefresh();
    }
  },

  onShow: function() {
    // 页面显示时刷新状态
    if (this.data.reviewInfo.orderId && this.data.reviewInfo.status === 'pending') {
      this.loadReviewInfo(this.data.reviewInfo.orderId);
    }
  },

  onHide: function() {
    // 页面隐藏时停止定时刷新
    this.stopAutoRefresh();
  },

  onUnload: function() {
    // 页面卸载时停止定时刷新
    this.stopAutoRefresh();
  },

  // 加载模拟数据
  loadMockData: function() {
    const mockData = {
      orderNo: 'RC2025062501',
      orderId: 'MOCK_ORDER_001',
      status: 'pending',
      statusSymbol: '⏳',
      statusTitle: '审核中',
      statusDesc: '门店正在审核您的还车申请，预计1-2小时内完成',
      storeName: '北京朝阳门店',
      carModel: '卡特彼勒320D挖掘机',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      submitTime: this.formatTime(Date.now() - 30 * 60 * 1000), // 30分钟前提交
      reviewTime: '',
      reviewReason: '',
      resultText: '',
      
      initialHours: 1250.5,
      returnHours: 1278.3,
      totalWorkHours: 27.8,
      
      overtimeDays: 2,
      priceType: 'overtime',
      priceTypeName: '超时单价',
      overtimeFee: 1600,
      
      dashboardImage: '/images/mock-dashboard.jpg',
      vehicleImages: [
        '/images/mock-vehicle1.jpg',
        '/images/mock-vehicle2.jpg',
        '/images/mock-vehicle3.jpg'
      ]
    };
    
    this.setData({
      reviewInfo: mockData
    });
    
    this.updateProgressSteps();
    this.startAutoRefresh();
    
    console.log('使用模拟数据，订单号：', mockData.orderNo);
  },

  // 加载审核信息
  loadReviewInfo: function(orderId) {
    const that = this;
    
    this.setData({
      isLoading: true,
      loadingText: '加载审核信息...'
    });
    
    wx.request({
      url: 'YOUR_API_BASE_URL/return/review-status',
      method: 'GET',
      data: {
        orderId: orderId
      },
      success: function(res) {
        if (res.data.code === 200) {
          const data = res.data.data;
          
          // 处理状态显示
          const statusInfo = that.getStatusInfo(data.status);
          
          that.setData({
            reviewInfo: {
              ...data,
              statusSymbol: statusInfo.symbol,
              statusTitle: statusInfo.title,
              statusDesc: statusInfo.desc,
              submitTime: that.formatTime(data.submitTimestamp),
              reviewTime: data.reviewTimestamp ? that.formatTime(data.reviewTimestamp) : '',
              totalWorkHours: (data.returnHours - data.initialHours).toFixed(1),
              priceTypeName: data.priceType === 'overtime' ? '超时单价' : '续租单价'
            }
          });
          
          that.updateProgressSteps();
          
          // 根据状态决定是否启动定时刷新
          if (data.status === 'pending') {
            that.startAutoRefresh();
          } else {
            that.stopAutoRefresh();
          }
        } else {
          wx.showModal({
            title: '获取信息失败',
            content: res.data.message || '获取审核信息失败，是否使用模拟数据？',
            confirmText: '使用模拟数据',
            cancelText: '返回',
            success: function(modalRes) {
              if (modalRes.confirm) {
                that.loadMockData();
              } else {
                wx.navigateBack();
              }
            }
          });
        }
      },
      fail: function() {
        wx.showModal({
          title: '网络错误',
          content: '网络请求失败，是否使用模拟数据？',
          confirmText: '使用模拟数据',
          cancelText: '返回',
          success: function(modalRes) {
            if (modalRes.confirm) {
              that.loadMockData();
            } else {
              wx.navigateBack();
            }
          }
        });
      },
      complete: function() {
        that.setData({
          isLoading: false
        });
      }
    });
  },

  // 获取状态显示信息
  getStatusInfo: function(status) {
    const statusMap = {
      pending: {
        symbol: '⏳',
        title: '审核中',
        desc: '门店正在审核您的还车申请，请耐心等待'
      },
      approved: {
        symbol: '✅',
        title: '审核通过',
        desc: '恭喜！您的还车申请已通过审核'
      },
      rejected: {
        symbol: '❌',
        title: '审核未通过',
        desc: '很遗憾，您的还车申请未通过审核'
      }
    };
    
    return statusMap[status] || statusMap.pending;
  },

  // 更新进度步骤
  updateProgressSteps: function() {
    const status = this.data.reviewInfo.status;
    const submitTime = this.data.reviewInfo.submitTime;
    const reviewTime = this.data.reviewInfo.reviewTime;
    
    let steps = [
      {
        title: '提交申请',
        completed: true,
        time: submitTime,
        desc: '您已成功提交还车申请'
      },
      {
        title: '门店审核',
        completed: status !== 'pending',
        time: status !== 'pending' ? reviewTime : '',
        desc: status === 'pending' ? '门店正在审核您的申请' : '门店已完成审核'
      },
      {
        title: '審核完成',
        completed: status !== 'pending',
        time: status !== 'pending' ? reviewTime : '',
        desc: status === 'approved' ? '审核通过，还车成功' : 
              status === 'rejected' ? '审核未通过，请联系门店' : '等待审核结果'
      }
    ];
    
    this.setData({
      progressSteps: steps
    });
  },

  // 启动自动刷新
  startAutoRefresh: function() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
    }
    
    const that = this;
    const timer = setInterval(() => {
      if (that.data.reviewInfo.status === 'pending' && that.data.reviewInfo.orderId) {
        console.log('自动刷新审核状态...');
        that.loadReviewInfo(that.data.reviewInfo.orderId);
      } else {
        that.stopAutoRefresh();
      }
    }, this.data.refreshInterval);
    
    this.setData({
      refreshTimer: timer
    });
  },

  // 停止自动刷新
  stopAutoRefresh: function() {
    if (this.data.refreshTimer) {
      clearInterval(this.data.refreshTimer);
      this.setData({
        refreshTimer: null
      });
    }
  },

  // 格式化时间
  formatTime: function(timestamp) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 复制订单号
  copyOrderNo: function() {
    wx.setClipboardData({
      data: this.data.reviewInfo.orderNo,
      success: function() {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        });
      },
      fail: function() {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览图片
  previewImage: function(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current;
    
    wx.previewImage({
      urls: urls,
      current: current,
      fail: function() {
        wx.showToast({
          title: '图片预览失败',
          icon: 'none'
        });
      }
    });
  },

  // 拨打电话
  makePhoneCall: function(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: function() {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 手动刷新状态
  refreshStatus: function() {
    if (this.data.reviewInfo.orderId) {
      wx.showToast({
        title: '刷新中...',
        icon: 'loading'
      });
      this.loadReviewInfo(this.data.reviewInfo.orderId);
    } else {
      // 模拟数据的刷新
      this.mockRefreshStatus();
    }
  },

  // 模拟刷新状态（用于演示）
  mockRefreshStatus: function() {
    wx.showToast({
      title: '刷新中...',
      icon: 'loading'
    });
    
    // 模拟有30%的几率审核通过，20%的几率审核未通过
    setTimeout(() => {
      const random = Math.random();
      let newStatus = 'pending';
      
      if (random < 0.3) {
        newStatus = 'approved';
      } else if (random < 0.5) {
        newStatus = 'rejected';
      }
      
      if (newStatus !== 'pending') {
        const statusInfo = this.getStatusInfo(newStatus);
        const reviewTime = this.formatTime(Date.now());
        
        this.setData({
          'reviewInfo.status': newStatus,
          'reviewInfo.statusSymbol': statusInfo.symbol,
          'reviewInfo.statusTitle': statusInfo.title,
          'reviewInfo.statusDesc': statusInfo.desc,
          'reviewInfo.reviewTime': reviewTime,
          'reviewInfo.resultText': newStatus === 'approved' ? '审核通过' : '审核未通过',
          'reviewInfo.reviewReason': newStatus === 'rejected' ? '照片不清晰，请重新提交' : ''
        });
        
        this.updateProgressSteps();
        this.stopAutoRefresh();
        
        wx.showToast({
          title: '刷新成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '仍在审核中',
          icon: 'none'
        });
      }
    }, 1500);
  },

  // 返回首页
  backToHome: function() {
    wx.switchTab({
      url: '/pages/home/home',
      fail: function() {
        wx.reLaunch({
          url: '/pages/home/home'
        });
      }
    });
  },

  // 查看订单详情
  viewOrder: function() {
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${this.data.reviewInfo.orderId}`
    });
  }
});