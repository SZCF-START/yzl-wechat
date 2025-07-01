// payment-after-review.js - 优化代码结构和交互体验
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
      rentalDays: 0,
      initialHours: 0,
      endTimestamp: 0,
      dailyWorkHours: 8
    },
    
    // 还车数据  
    returnData: {
      userReturnHours: 0,
      adminReturnHours: 0,
      actualReturnTime: '',
      actualReturnTimestamp: 0,
      dashboardImage: ''
    },
    
    // 超时计算结果
    overtimeCalculation: {
      finalOvertimeDays: 0,
      paidOvertimeDays: 0,
      remainingOvertimeDays: 0,
      timeOvertimeDetail: '',
      hoursOvertimeDetail: '',
      finalOvertimeReason: ''
    },
    
    // 价格相关
    priceOptions: {
      overtimePrice: 0,
      renewalPrice: 0,
      selectedType: 'overtime',
      overtimeTotalPrice: 0,
      renewalTotalPrice: 0,
      finalPaymentAmount: 0
    },
    
    // UI 状态
    uiState: {
      showOvertimeModal: false,
      canPayment: false,
      isLoading: false,
      paymentProcessing: false
    }
  },

  onLoad: function(options) {
    this.initializePage(options);
  },

  // ==================== 初始化 ====================
  
  initializePage: function(options) {
    const orderId = options.orderId;
    if (orderId) {
      this.loadOrderInfo(orderId);
    } else {
      this.loadMockData();
    }
  },

  // ==================== 数据加载 ====================
  
  loadOrderInfo: function(orderId) {
    this.setData({ 'uiState.isLoading': true });
    
    wx.showLoading({ title: '加载中...' });
    
    // 调用后端接口
    wx.request({
      url: 'YOUR_API_BASE_URL/order/review-detail',
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
      this.processOrderData(res.data.data);
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
          this.loadMockData();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  processOrderData: function(data) {
    // 处理时间格式
    const timeData = this.processTimeData(data);
    
    // 更新数据
    this.setData({
      orderInfo: {
        id: data.id,
        storeName: data.storeName,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        carModel: data.carModel,
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        rentalDays: timeData.rentalDays,
        initialHours: data.initialHours,
        endTimestamp: data.endTimestamp,
        dailyWorkHours: 8
      },
      returnData: {
        userReturnHours: data.userReturnHours,
        adminReturnHours: data.adminReturnHours,
        actualReturnTime: timeData.actualReturnTime,
        actualReturnTimestamp: data.actualReturnTimestamp,
        dashboardImage: data.dashboardImage
      },
      'priceOptions.overtimePrice': data.overtimePrice,
      'priceOptions.renewalPrice': data.renewalPrice,
      'overtimeCalculation.paidOvertimeDays': data.paidOvertimeDays
    });

    this.calculateOvertime();
  },

  processTimeData: function(data) {
    return {
      startTime: this.formatTimestamp(data.startTimestamp),
      endTime: this.formatTimestamp(data.endTimestamp),
      actualReturnTime: this.formatTimestamp(data.actualReturnTimestamp),
      rentalDays: this.calculateRentalDays(data.startTimestamp, data.endTimestamp)
    };
  },

  loadMockData: function() {
    wx.showToast({
      title: '使用模拟数据',
      icon: 'none',
      duration: 2000
    });

    const mockData = this.generateMockData();
    this.processOrderData(mockData);
    
    console.log('模拟数据加载完成', mockData);
  },

  generateMockData: function() {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const endTime = now - 2 * 60 * 60 * 1000;
    
    return {
      id: 'MOCK_ORDER_001',
      storeName: '北京朝阳门店',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      startTimestamp: threeDaysAgo,
      endTimestamp: endTime,
      actualReturnTimestamp: now,
      initialHours: 1250.5,
      userReturnHours: 1275.2,
      adminReturnHours: 1280.8,
      dashboardImage: '/images/dashboard-sample.jpg',
      overtimePrice: 800,
      renewalPrice: 600,
      paidOvertimeDays: 0
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
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  },

  // ==================== 超时计算 ====================
  
  calculateOvertime: function() {
    const {
      adminReturnHours,
      actualReturnTimestamp
    } = this.data.returnData;
    
    const {
      initialHours,
      endTimestamp,
      dailyWorkHours,
      rentalDays
    } = this.data.orderInfo;
    
    const { paidOvertimeDays } = this.data.overtimeCalculation;
    
    // 计算超时
    const overtimeResult = this.performOvertimeCalculation({
      adminReturnHours,
      initialHours,
      endTimestamp,
      actualReturnTimestamp,
      dailyWorkHours,
      rentalDays,
      paidOvertimeDays
    });
    
    // 计算价格
    const priceResult = this.calculatePrices(overtimeResult.remainingOvertimeDays);
    
    // 更新数据
    this.setData({
      'overtimeCalculation.finalOvertimeDays': overtimeResult.finalOvertimeDays,
      'overtimeCalculation.remainingOvertimeDays': overtimeResult.remainingOvertimeDays,
      'overtimeCalculation.timeOvertimeDetail': overtimeResult.timeDetail,
      'overtimeCalculation.hoursOvertimeDetail': overtimeResult.hoursDetail,
      'overtimeCalculation.finalOvertimeReason': overtimeResult.finalReason,
      'priceOptions.overtimeTotalPrice': priceResult.overtimeTotal,
      'priceOptions.renewalTotalPrice': priceResult.renewalTotal,
      'priceOptions.finalPaymentAmount': priceResult.overtimeTotal,
      'uiState.canPayment': overtimeResult.remainingOvertimeDays > 0
    });

    console.log('超时计算完成', overtimeResult, priceResult);
  },

  performOvertimeCalculation: function(params) {
    const {
      adminReturnHours,
      initialHours,
      endTimestamp,
      actualReturnTimestamp,
      dailyWorkHours,
      rentalDays,
      paidOvertimeDays
    } = params;
    
    // 1. 按时间计算超时
    const graceTimestamp = endTimestamp + 30 * 60 * 1000;
    const timeOverMs = Math.max(0, actualReturnTimestamp - graceTimestamp);
    const timeOvertimeDays = timeOverMs > 0 ? Math.ceil(timeOverMs / (24 * 60 * 60 * 1000)) : 0;
    
    // 2. 按工作小时数计算超时
    const totalWorkHours = adminReturnHours - initialHours;
    const allowedTotalHours = rentalDays * dailyWorkHours;
    const excessHours = Math.max(0, totalWorkHours - allowedTotalHours);
    const hoursOvertimeDays = excessHours > 0 ? Math.ceil(excessHours / dailyWorkHours) : 0;
    
    // 3. 取最大值
    const finalOvertimeDays = Math.max(timeOvertimeDays, hoursOvertimeDays);
    const remainingOvertimeDays = Math.max(0, finalOvertimeDays - paidOvertimeDays);
    
    // 生成详情描述
    const details = this.generateOvertimeDetails({
      timeOvertimeDays,
      hoursOvertimeDays,
      finalOvertimeDays,
      endTimestamp,
      actualReturnTimestamp,
      totalWorkHours,
      rentalDays,
      allowedTotalHours,
      excessHours
    });
    
    return {
      finalOvertimeDays,
      remainingOvertimeDays,
      ...details
    };
  },

  generateOvertimeDetails: function(data) {
    const {
      timeOvertimeDays,
      hoursOvertimeDays,
      finalOvertimeDays,
      endTimestamp,
      actualReturnTimestamp,
      totalWorkHours,
      rentalDays,
      allowedTotalHours,
      excessHours
    } = data;
    
    const timeDetail = timeOvertimeDays > 0 ? 
      `预期还车时间：${this.formatTimestamp(endTimestamp)}（含30分钟宽限期），实际还车时间：${this.formatTimestamp(actualReturnTimestamp)}，超时${timeOvertimeDays}天` : 
      `预期还车时间：${this.formatTimestamp(endTimestamp)}（含30分钟宽限期），实际还车时间：${this.formatTimestamp(actualReturnTimestamp)}，未超时`;
    
    const hoursDetail = `工作小时数：${totalWorkHours.toFixed(1)}小时，租期${rentalDays}天允许工作${allowedTotalHours}小时，${
      hoursOvertimeDays > 0 ? `超出${excessHours.toFixed(1)}小时，按8小时/天计算，超时${hoursOvertimeDays}天` : '未超时'
    }`;
    
    const finalReason = finalOvertimeDays > 0 ? 
      (timeOvertimeDays >= hoursOvertimeDays ? 
        `最终按还车时间超时计算，因为时间超时${timeOvertimeDays}天 >= 工作小时数超时${hoursOvertimeDays}天` : 
        `最终按工作小时数超时计算，因为工作小时数超时${hoursOvertimeDays}天 > 时间超时${timeOvertimeDays}天`) :
      '未超时，无需额外费用';
    
    return {
      timeDetail,
      hoursDetail,
      finalReason
    };
  },

  calculatePrices: function(remainingDays) {
    const { overtimePrice, renewalPrice } = this.data.priceOptions;
    
    return {
      overtimeTotal: remainingDays * overtimePrice,
      renewalTotal: remainingDays * renewalPrice
    };
  },

  // ==================== 交互事件 ====================
  
  makePhoneCall: function(e) {
    const phone = e.currentTarget.dataset.phone;
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

  showOvertimeDetail: function() {
    this.setData({ 'uiState.showOvertimeModal': true });
  },

  hideOvertimeDetail: function() {
    this.setData({ 'uiState.showOvertimeModal': false });
  },

  stopPropagation: function() {
    // 阻止事件冒泡
  },

  selectPriceType: function(e) {
    const type = e.currentTarget.dataset.type;
    const { overtimeTotalPrice, renewalTotalPrice } = this.data.priceOptions;
    const amount = type === 'overtime' ? overtimeTotalPrice : renewalTotalPrice;
    
    this.setData({
      'priceOptions.selectedType': type,
      'priceOptions.finalPaymentAmount': amount
    });
  },

  // ==================== 支付处理 ====================
  
  submitPayment: function() {
    if (!this.data.uiState.canPayment) {
      wx.showToast({
        title: '无需支付',
        icon: 'none'
      });
      return;
    }
    
    if (this.data.uiState.paymentProcessing) {
      return;
    }
    
    const paymentData = this.preparePaymentData();
    
    if (this.data.orderInfo.id === 'MOCK_ORDER_001') {
      this.processRealPayment(paymentData);
    } else {
      this.processRealPayment(paymentData);
    }
  },

  preparePaymentData: function() {
    const { orderInfo, overtimeCalculation, priceOptions } = this.data;
    
    return {
      orderId: orderInfo.id,
      remainingOvertimeDays: overtimeCalculation.remainingOvertimeDays,
      selectedPriceType: priceOptions.selectedType,
      finalPaymentAmount: priceOptions.finalPaymentAmount
    };
  },

  processRealPayment: function(paymentData) {
    this.setData({ 'uiState.paymentProcessing': true });
    wx.showLoading({ title: '支付中...' });
    
    wx.request({
      url: 'YOUR_API_BASE_URL/payment/submit',
      method: 'POST',
      data: paymentData,
      success: (res) => this.handlePaymentResponse(res),
      fail: () => this.handlePaymentError(),
      complete: () => {
        wx.hideLoading();
        this.setData({ 'uiState.paymentProcessing': false });
      }
    });
  },

  handlePaymentResponse: function(res) {
    if (res.data.code === 200) {
      this.processWechatPayment(res.data.data.paymentInfo);
    } else {
      wx.showToast({
        title: res.data.message || '支付失败',
        icon: 'none'
      });
    }
  },

  handlePaymentError: function() {
    wx.showToast({
      title: '网络请求失败',
      icon: 'none'
    });
  },

  processWechatPayment: function(paymentInfo) {
    wx.requestPayment({
      timeStamp: paymentInfo.timeStamp,
      nonceStr: paymentInfo.nonceStr,
      package: paymentInfo.package,
      signType: paymentInfo.signType,
      paySign: paymentInfo.paySign,
      success: () => this.handlePaymentSuccess(),
      fail: () => this.handlePaymentFail()
    });
  },

  handlePaymentSuccess: function() {
    wx.showToast({
      title: '支付成功',
      icon: 'success'
    });
    
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/order-complete/order-complete?orderId=' + this.data.orderInfo.id
      });
    }, 1500);
  },

  handlePaymentFail: function() {
    wx.showToast({
      title: '支付失败',
      icon: 'none'
    });
  },

  goToComplete: function() {
    wx.redirectTo({
      url: '/pages/order-complete/order-complete?orderId=' + this.data.orderInfo.id
    });
  }
});