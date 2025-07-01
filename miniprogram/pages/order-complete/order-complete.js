// order-complete.js - 优化代码结构，参考order页面风格
Page({
  data: {
    // 订单基本信息
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
      rentalCost: 0,
      overtimeCost: 0,
      totalCost: 0
    },
    
    // 工作统计
    workStats: {
      totalHours: '0.0',
      averageDaily: '0.0',
      efficiency: '标准',
      efficiencyClass: 'standard'
    },
    
    // 评价系统
    feedback: {
      rating: 0,
      content: '',
      submitted: false
    },
    
    // UI状态
    uiState: {
      isLoading: false,
      showSuccessModal: false
    },
    
    // 星星数组
    starArray: [1, 2, 3, 4, 5]
  },

  onLoad: function(options) {
    this.logTestScenarios();
    this.initializePage(options);
  },

  // ==================== 初始化 ====================
  
  initializePage: function(options) {
    const orderId = options.orderId;
    
    console.log('订单完成页面初始化，订单ID:', orderId);
    
    if (orderId) {
      this.loadOrderCompleteInfo(orderId);
    } else {
      // 无订单ID时，生成一个测试订单ID
      const testOrderId = `COMPLETE_ORDER_${Date.now()}`;
      console.log('无订单ID，生成测试订单:', testOrderId);
      this.loadOrderCompleteInfo(testOrderId);
    }
  },

  // ==================== 数据加载 ====================
  
  loadOrderCompleteInfo: function(orderId) {
    // 优先使用模拟数据进行开发测试
    console.log(`加载订单完成信息: ${orderId}`);
    
    wx.showToast({
      title: '使用模拟数据',
      icon: 'none',
      duration: 1500
    });
    
    setTimeout(() => {
      const mockData = this.generateMockDataById(orderId);
      this.processOrderCompleteData(mockData);
    }, 800);
    
    // 保留真实API调用代码，生产环境时启用
    // this.loadOrderFromAPI(orderId);
  },

  // 真实API调用方法（生产环境使用）
  loadOrderFromAPI: function(orderId) {
    this.setData({ 'uiState.isLoading': true });
    
    wx.showLoading({ title: '加载中...' });
    
    wx.request({
      url: 'YOUR_API_BASE_URL/order/complete-detail',
      method: 'GET',
      data: { orderId },
      success: (res) => this.handleOrderResponse(res),
      fail: () => this.handleLoadError(),
      complete: () => {
        wx.hideLoading();
        this.setData({ 'uiState.isLoading': false });
      }
    });
  },

  handleOrderResponse: function(res) {
    if (res.data.code === 200) {
      this.processOrderCompleteData(res.data.data);
    } else {
      this.showLoadErrorDialog(res.data.message || '获取订单信息失败');
    }
  },

  handleLoadError: function() {
    this.showLoadErrorDialog('网络请求失败');
  },

  showLoadErrorDialog: function(message) {
    wx.showModal({
      title: '加载失败',
      content: `${message}，是否使用模拟数据？`,
      confirmText: '使用模拟数据',
      cancelText: '返回',
      success: (modalRes) => {
        if (modalRes.confirm) {
          const testOrderId = `ERROR_FALLBACK_${Date.now()}`;
          const mockData = this.generateMockDataById(testOrderId);
          this.processOrderCompleteData(mockData);
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  // ==================== 数据处理 ====================
  
  processOrderCompleteData: function(data) {
    // 处理时间格式
    const timeData = this.processTimeData(data);
    
    // 计算工作统计
    const workStats = this.calculateWorkStats(data, timeData.rentalDays);
    
    // 更新页面数据
    this.setData({
      orderInfo: {
        id: data.id,
        storeName: data.storeName,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        carModel: data.carModel,
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        rentalDays: timeData.rentalDays
      },
      costDetail: {
        rentalCost: data.rentalCost,
        overtimeCost: data.overtimeCost || 0,
        totalCost: data.totalCost || (data.rentalCost + (data.overtimeCost || 0))
      },
      workStats: workStats
    });

    console.log('订单完成数据处理完成', {
      订单ID: data.id,
      总费用: this.data.costDetail.totalCost,
      工作统计: workStats
    });
  },

  processTimeData: function(data) {
    return {
      startTime: this.formatTimestamp(data.startTimestamp),
      endTime: this.formatTimestamp(data.endTimestamp),
      rentalDays: this.calculateRentalDays(data.startTimestamp, data.endTimestamp)
    };
  },

  calculateWorkStats: function(data, rentalDays) {
    const totalHours = data.totalWorkHours || 0;
    const averageDaily = rentalDays > 0 ? (totalHours / rentalDays).toFixed(1) : '0.0';
    const efficiencyData = this.calculateEfficiency(parseFloat(averageDaily));
    
    return {
      totalHours: totalHours.toFixed(1),
      averageDaily: averageDaily,
      efficiency: efficiencyData.text,
      efficiencyClass: efficiencyData.class
    };
  },

  // ==================== 模拟数据生成 ====================
  
  generateMockDataById: function(orderId) {
    console.log(`为订单 ${orderId} 生成模拟数据`);
    
    const baseData = this.generateBaseMockData();
    
    // 根据不同的订单ID生成不同的场景数据
    if (orderId.includes('HIGH_COST')) {
      return this.generateHighCostScenario(baseData, orderId);
    } else if (orderId.includes('OVERTIME')) {
      return this.generateOvertimeScenario(baseData, orderId);
    } else if (orderId.includes('PERFECT')) {
      return this.generatePerfectScenario(baseData, orderId);
    } else if (orderId.includes('LONG_TERM')) {
      return this.generateLongTermScenario(baseData, orderId);
    } else {
      // 默认场景：标准完成
      return this.generateDefaultCompleteScenario(baseData, orderId);
    }
  },

  generateBaseMockData: function() {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const endTime = now - 2 * 60 * 60 * 1000;
    
    return {
      storeName: '北京朝阳门店',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      startTimestamp: threeDaysAgo,
      endTimestamp: endTime,
      rentalCost: 1800,
      totalWorkHours: 24.5
    };
  },

  // 默认完成场景
  generateDefaultCompleteScenario: function(baseData, orderId) {
    return {
      ...baseData,
      id: orderId,
      overtimeCost: 200,
      totalWorkHours: 24.5
    };
  },

  // 高费用场景
  generateHighCostScenario: function(baseData, orderId) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    
    return {
      ...baseData,
      id: orderId,
      storeName: '上海浦东新区分店',
      managerName: '李经理',
      managerPhone: '139-8888-6666',
      carModel: '三一重工SY365H挖掘机',
      startTimestamp: sevenDaysAgo,
      endTimestamp: twoDaysAgo,
      rentalCost: 5600, // 800元/天 * 7天
      overtimeCost: 800, // 超时费用
      totalWorkHours: 68.3
    };
  },

  // 超时场景
  generateOvertimeScenario: function(baseData, orderId) {
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;
    
    return {
      ...baseData,
      id: orderId,
      storeName: '深圳南山区分店',
      managerName: '王经理',
      managerPhone: '187-9999-1234',
      carModel: '徐工XE270DK挖掘机',
      startTimestamp: fiveDaysAgo,
      endTimestamp: oneDayAgo,
      rentalCost: 3000,
      overtimeCost: 1200, // 严重超时
      totalWorkHours: 52.8
    };
  },

  // 完美场景
  generatePerfectScenario: function(baseData, orderId) {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
    
    return {
      ...baseData,
      id: orderId,
      storeName: '广州天河区分店',
      managerName: '陈经理',
      managerPhone: '158-7777-8888',
      carModel: '柳工CLG922E挖掘机',
      startTimestamp: twoDaysAgo,
      endTimestamp: oneHourAgo,
      rentalCost: 1200,
      overtimeCost: 0, // 无超时
      totalWorkHours: 16.0 // 正好2天*8小时
    };
  },

  // 长期租赁场景
  generateLongTermScenario: function(baseData, orderId) {
    const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    
    return {
      ...baseData,
      id: orderId,
      storeName: '成都高新区分店',
      managerName: '刘经理',
      managerPhone: '177-5555-9999',
      carModel: '斗山DX225LC-9C挖掘机',
      startTimestamp: fifteenDaysAgo,
      endTimestamp: threeDaysAgo,
      rentalCost: 9000, // 600元/天 * 15天
      overtimeCost: 400,
      totalWorkHours: 126.5
    };
  },

  // ==================== 工具函数 ====================
  
  formatTimestamp: function(timestamp) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  calculateRentalDays: function(startTimestamp, endTimestamp) {
    const diffMs = endTimestamp - startTimestamp;
    return Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  },

  calculateEfficiency: function(averageDaily) {
    if (averageDaily >= 10) return { text: '高效', class: 'high' };
    if (averageDaily >= 8) return { text: '标准', class: 'standard' };
    if (averageDaily >= 6) return { text: '一般', class: 'normal' };
    return { text: '偏低', class: 'low' };
  },

  // ==================== 用户交互 ====================
  
  makePhoneCall: function(e) {
    const phone = e.currentTarget.dataset.phone;
    
    if (!phone) {
      wx.showToast({
        title: '电话号码为空',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  setRating: function(e) {
    const rating = parseInt(e.currentTarget.dataset.rating);
    
    this.setData({
      'feedback.rating': rating
    });
    
    console.log('设置评分:', rating);
  },

  onFeedbackInput: function(e) {
    this.setData({
      'feedback.content': e.detail.value
    });
  },

  // ==================== 评价提交 ====================
  
  submitFeedback: function() {
    const { rating, content } = this.data.feedback;
    
    if (rating === 0 && !content.trim()) {
      wx.showToast({
        title: '请先评分或输入建议',
        icon: 'none'
      });
      return;
    }

    const feedbackData = {
      orderId: this.data.orderInfo.id,
      rating: rating,
      feedback: content.trim()
    };

    console.log('提交评价数据:', feedbackData);
    
    // 根据订单ID判断使用模拟还是真实API
    if (this.data.orderInfo.id.includes('MOCK_') || 
        this.data.orderInfo.id.includes('COMPLETE_') || 
        this.data.orderInfo.id.includes('TEST_')) {
      this.processMockFeedback(feedbackData);
    } else {
      this.processApiFeedback(feedbackData);
    }
  },

  // 模拟评价提交
  processMockFeedback: function(feedbackData) {
    console.log('使用模拟评价提交:', feedbackData);
    
    wx.showLoading({ title: '提交中...' });
    
    setTimeout(() => {
      wx.hideLoading();
      
      this.setData({
        'feedback.submitted': true,
        'uiState.showSuccessModal': true
      });
      
      console.log('模拟评价提交成功');
    }, 1000);
  },

  // 真实API评价提交（生产环境使用）
  processApiFeedback: function(feedbackData) {
    console.log('使用真实API评价提交:', feedbackData);
    
    wx.showLoading({ title: '提交中...' });
    
    wx.request({
      url: 'YOUR_API_BASE_URL/order/feedback',
      method: 'POST',
      data: feedbackData,
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            'feedback.submitted': true,
            'uiState.showSuccessModal': true
          });
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // ==================== 弹窗控制 ====================
  
  hideSuccessModal: function() {
    this.setData({
      'uiState.showSuccessModal': false
    });
  },

  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // ==================== 页面导航 ====================
  
  backToHome: function() {
    console.log('返回首页');
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  // ==================== 测试场景管理 ====================
  
  generateTestScenarios: function() {
    return {
      'HIGH_COST_001': '高费用场景 - 长期租赁高总价',
      'OVERTIME_001': '超时场景 - 严重超时有罚金',
      'PERFECT_001': '完美场景 - 无超时按时还车',
      'LONG_TERM_001': '长期租赁场景 - 15天租期',
      'COMPLETE_ORDER_001': '默认完成场景 - 标准订单'
    };
  },

  logTestScenarios: function() {
    const scenarios = this.generateTestScenarios();
    console.log('=== 订单完成页面可用测试场景 ===');
    Object.keys(scenarios).forEach(orderId => {
      console.log(`${orderId}: ${scenarios[orderId]}`);
    });
    console.log('=== 使用方法 ===');
    console.log('在页面URL中添加 ?orderId=HIGH_COST_001 来测试不同场景');
  },

  // ==================== 页面生命周期 ====================
  
  onShow: function() {
    console.log('订单完成页面显示');
  },

  onUnload: function() {
    console.log('订单完成页面卸载');
  },

  onShareAppMessage: function() {
    return {
      title: '租赁设备服务完成',
      path: '/pages/index/index'
    };
  }
});