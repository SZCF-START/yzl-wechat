Page({
  data: {
    // 订单信息
    orderInfo: {
      id: '',
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      startTime: '',
      endTime: '',
      rentalDays: 0
    },
    
    // 费用明细
    costDetail: {
      rentalCost: 0,      // 租赁费用
      overtimeCost: 0,    // 超时费用
      depositRefund: 0,   // 押金退还
      totalCost: 0        // 总费用
    },
    
    // 工作统计
    workStats: {
      totalHours: '0.0',    // 总工作小时
      averageDaily: '0.0',  // 日均工作小时
      efficiency: '标准'     // 工作效率评级
    },
    
    // 评价相关
    rating: 0,           // 评分（1-5星）
    feedback: '',        // 反馈内容
    showSuccessModal: false,  // 成功提示弹窗
    
    // 星星数组，用于循环显示
    starArray: [1, 2, 3, 4, 5]
  },

  onLoad: function(options) {
    console.log('订单完成页面加载，参数：', options);
    
    // 从options中获取订单ID
    const orderId = options.orderId;
    if (orderId) {
      this.loadOrderCompleteInfo(orderId);
    } else {
      // 订单ID不存在，直接使用模拟数据进行测试
      console.log('未传入订单ID，使用模拟数据');
      this.loadMockData();
    }
  },

  onShow: function() {
    // 页面显示时执行
    console.log('订单完成页面显示');
  },

  // 加载模拟数据
  loadMockData: function() {
    console.log('开始加载模拟数据');
    
    wx.showToast({
      title: '加载模拟数据',
      icon: 'none',
      duration: 1500
    });

    // 模拟数据
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000; // 3天前
    const endTime = now - 2 * 60 * 60 * 1000; // 2小时前

    const mockData = {
      id: 'MOCK_ORDER_001',
      storeName: '北京朝阳门店',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      startTimestamp: threeDaysAgo,
      endTimestamp: endTime,
      rentalCost: 1800,      // 租赁费用：600元/天 * 3天
      overtimeCost: 200,     // 超时费用：200元
      depositRefund: 500,    // 押金退还：500元
      totalWorkHours: 25.5,  // 总工作小时
      initialHours: 1250.5,  // 出车时仪表盘小时数
      finalHours: 1276.0     // 还车时仪表盘小时数
    };

    // 计算总费用
    const totalCost = mockData.rentalCost + mockData.overtimeCost - mockData.depositRefund;
    
    // 计算工作统计
    const rentalDays = this.calculateRentalDays(mockData.startTimestamp, mockData.endTimestamp);
    const averageDaily = (mockData.totalWorkHours / rentalDays).toFixed(1);
    const efficiency = this.calculateEfficiency(parseFloat(averageDaily));

    // 处理时间戳转换
    const startTime = this.formatTimestamp(mockData.startTimestamp);
    const endTimeFormatted = this.formatTimestamp(mockData.endTimestamp);
    
    // 设置数据到页面
    this.setData({
      orderInfo: {
        id: mockData.id,
        storeName: mockData.storeName,
        managerName: mockData.managerName,
        managerPhone: mockData.managerPhone,
        carModel: mockData.carModel,
        startTime: startTime,
        endTime: endTimeFormatted,
        rentalDays: rentalDays
      },
      costDetail: {
        rentalCost: mockData.rentalCost,
        overtimeCost: mockData.overtimeCost,
        depositRefund: mockData.depositRefund,
        totalCost: totalCost
      },
      workStats: {
        totalHours: mockData.totalWorkHours.toFixed(1),
        averageDaily: averageDaily,
        efficiency: efficiency
      }
    }, () => {
      console.log('模拟数据设置完成，当前数据：', this.data);
    });

    console.log('订单完成页面模拟数据加载完成：', {
      订单编号: mockData.id,
      租赁天数: rentalDays,
      总费用: totalCost,
      总工作小时: mockData.totalWorkHours,
      日均工作小时: averageDaily,
      工作效率: efficiency
    });
  },

  // 加载订单完成信息
  loadOrderCompleteInfo: function(orderId) {
    const that = this;
    wx.showLoading({
      title: '加载中...'
    });
    
    // 调用后端接口获取订单完成详情
    wx.request({
      url: 'YOUR_API_BASE_URL/order/complete-detail',
      method: 'GET',
      data: {
        orderId: orderId
      },
      success: function(res) {
        console.log('订单详情接口返回：', res);
        
        if (res.data.code === 200) {
          const data = res.data.data;
          
          // 处理时间戳转换
          const startTime = that.formatTimestamp(data.startTimestamp);
          const endTime = that.formatTimestamp(data.endTimestamp);
          
          // 计算租赁天数
          const rentalDays = that.calculateRentalDays(data.startTimestamp, data.endTimestamp);
          
          // 计算工作统计
          const averageDaily = (data.totalWorkHours / rentalDays).toFixed(1);
          const efficiency = that.calculateEfficiency(parseFloat(averageDaily));
          
          that.setData({
            orderInfo: {
              id: data.id,
              storeName: data.storeName,
              managerName: data.managerName,
              managerPhone: data.managerPhone,
              carModel: data.carModel,
              startTime: startTime,
              endTime: endTime,
              rentalDays: rentalDays
            },
            costDetail: {
              rentalCost: data.rentalCost,
              overtimeCost: data.overtimeCost,
              depositRefund: data.depositRefund,
              totalCost: data.totalCost
            },
            workStats: {
              totalHours: data.totalWorkHours.toFixed(1),
              averageDaily: averageDaily,
              efficiency: efficiency
            }
          });
        } else {
          wx.showModal({
            title: '获取订单失败',
            content: res.data.message || '获取订单信息失败，是否使用模拟数据？',
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
      fail: function(error) {
        console.log('订单详情接口请求失败：', error);
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
        wx.hideLoading();
      }
    });
  },

  // 时间戳转换为指定格式
  formatTimestamp: function(timestamp) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 计算租赁天数
  calculateRentalDays: function(startTimestamp, endTimestamp) {
    const diffMs = endTimestamp - startTimestamp;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return Math.max(1, diffDays); // 最少1天
  },

  // 计算工作效率评级
  calculateEfficiency: function(averageDaily) {
    if (averageDaily >= 10) {
      return '高效';
    } else if (averageDaily >= 8) {
      return '标准';
    } else if (averageDaily >= 6) {
      return '一般';
    } else {
      return '偏低';
    }
  },

  // 拨打电话
  makePhoneCall: function(e) {
    const phone = e.currentTarget.dataset.phone;
    console.log('拨打电话：', phone);
    
    if (!phone) {
      wx.showToast({
        title: '电话号码为空',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phone,
      success: function() {
        console.log('拨打电话成功');
      },
      fail: function(error) {
        console.error('拨打电话失败：', error);
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 设置评分
  setRating: function(e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    console.log('设置评分：', rating);
    
    this.setData({
      rating: rating
    }, () => {
      console.log('当前评分：', this.data.rating);
    });
  },

  // 输入反馈内容
  onFeedbackInput: function(e) {
    const feedback = e.detail.value;
    console.log('输入反馈内容：', feedback);
    
    this.setData({
      feedback: feedback
    });
  },

  // 提交评价
  submitFeedback: function() {
    console.log('提交评价，当前评分：', this.data.rating, '反馈内容：', this.data.feedback);
    
    if (this.data.rating === 0 && !this.data.feedback.trim()) {
      wx.showToast({
        title: '请先评分或输入建议',
        icon: 'none'
      });
      return;
    }

    const feedbackData = {
      orderId: this.data.orderInfo.id,
      rating: this.data.rating,
      feedback: this.data.feedback.trim()
    };

    console.log('提交评价数据：', feedbackData);
    
    // 模拟提交评价
    if (this.data.orderInfo.id.includes('MOCK')) {
      this.mockSubmitFeedback(feedbackData);
      return;
    }

    wx.showLoading({
      title: '提交中...'
    });
    
    // 调用后端接口提交评价
    const that = this;
    wx.request({
      url: 'YOUR_API_BASE_URL/order/feedback',
      method: 'POST',
      data: feedbackData,
      success: function(res) {
        console.log('评价提交接口返回：', res);
        
        if (res.data.code === 200) {
          that.setData({
            showSuccessModal: true
          });
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: function(error) {
        console.log('评价提交接口请求失败：', error);
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  },

  // 模拟提交评价
  mockSubmitFeedback: function(feedbackData) {
    console.log('模拟提交评价：', feedbackData);
    
    wx.showLoading({
      title: '提交中...'
    });
    
    // 模拟网络延迟
    setTimeout(() => {
      wx.hideLoading();
      console.log('模拟提交评价成功');
      this.setData({
        showSuccessModal: true
      });
    }, 1000);
  },

  // 隐藏成功弹窗
  hideSuccessModal: function() {
    console.log('隐藏成功弹窗');
    this.setData({
      showSuccessModal: false
    });
  },

  // 阻止冒泡
  stopPropagation: function(e) {
    console.log('阻止事件冒泡');
    // 空函数，用于阻止事件冒泡
  },

  // 返回首页
  backToHome: function() {
    console.log('返回首页');
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // 页面分享
  onShareAppMessage: function() {
    return {
      title: '租赁设备服务完成',
      path: '/pages/index/index',
      imageUrl: '' // 可以设置分享图片
    };
  },

  // 页面卸载
  onUnload: function() {
    console.log('订单完成页面卸载');
  }
});