// payment-after-review.js - 采用续租页面样式，添加订单链支持
Page({
  data: {
    // 订单信息
    orderInfo: {
      id: '',
      storeName: '',
      returnStore: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      carNumber: '',
      carImage: '',
      startTime: '',
      endTime: '',
      rentalDays: 0,
      initialHours: 0,
      endTimestamp: 0,
      dailyWorkHours: 8,
      statusText: '已完成',
      // 订单链相关
      hasOrderChain: false,
      totalRentalDays: 0,
      renewalCount: 0,
      hasPayment: false,
      orderChainDetails: [],
      vehicleRecordId: ''
    },
    
    // 预处理后的订单链数据
    processedChainDetails: [],
    chainSummary: {
      totalOrders: 0,
      renewalCount: 0,
      hasPayment: false,
      badges: []
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
      paymentProcessing: false,
      // 订单链展开状态
      isChainExpanded: false
    }
  },

  onLoad: function(options) {
    // 输出测试场景信息，方便开发调试
    this.logTestScenarios();
    
    this.initializePage(options);
  },

  // ==================== 初始化 ====================
  
  initializePage: function(options) {
    const orderId = options.orderId;
    
    console.log('页面初始化，订单ID:', orderId);
    
    if (orderId) {
      this.loadOrderInfo(orderId);
    } else {
      // 无订单ID时，生成一个测试订单ID
      const testOrderId = `TEST_ORDER_${Date.now()}`;
      console.log('无订单ID，生成测试订单:', testOrderId);
      this.loadOrderInfo(testOrderId);
    }
  },

  // ==================== 数据加载 ====================
  
  loadOrderInfo: function(orderId) {
    // 优先使用模拟数据进行开发测试
    console.log(`加载订单信息: ${orderId}`);
    
    // 直接使用模拟数据，便于开发调试
    wx.showToast({
      title: '使用模拟数据',
      icon: 'none',
      duration: 1500
    });
    
    setTimeout(() => {
      const mockData = this.generateMockDataById(orderId);
      this.processOrderData(mockData);
    }, 800); // 模拟网络延迟
  },

  processOrderData: function(data) {
    // 处理时间格式
    const timeData = this.processTimeData(data);
    
    // 处理订单链数据 - 始终生成订单链
    const orderChainData = this.processOrderChainData(data);
    
    // 更新数据
    this.setData({
      orderInfo: {
        id: data.id,
        storeName: data.storeName,
        returnStore: data.returnStore || data.storeName,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        carModel: data.carModel,
        carNumber: data.carNumber || '京A12345',
        carImage: data.carImage || '../../assets/rsg.png',
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        rentalDays: timeData.rentalDays,
        initialHours: data.initialHours,
        endTimestamp: data.endTimestamp,
        dailyWorkHours: 8,
        statusText: data.statusText || '已完成',
        // 订单链相关数据
        hasOrderChain: orderChainData.hasOrderChain,
        totalRentalDays: orderChainData.totalRentalDays,
        renewalCount: orderChainData.renewalCount,
        hasPayment: orderChainData.hasPayment,
        orderChainDetails: orderChainData.originalChainDetails,
        vehicleRecordId: data.vehicleRecordId || `VR_${data.id}`
      },
      // 设置处理后的订单链数据
      processedChainDetails: orderChainData.processedChainDetails,
      chainSummary: orderChainData.chainSummary,
      returnData: {
        userReturnHours: data.userReturnHours,
        adminReturnHours: data.adminReturnHours,
        actualReturnTime: timeData.actualReturnTime,
        actualReturnTimestamp: data.actualReturnTimestamp,
        dashboardImage: data.dashboardImage || '../../assets/dashboard-sample.jpg'
      },
      'priceOptions.overtimePrice': data.overtimePrice,
      'priceOptions.renewalPrice': data.renewalPrice,
      'overtimeCalculation.paidOvertimeDays': data.paidOvertimeDays
    });

    console.log('订单数据处理完成', {
      订单ID: data.id,
      租赁天数: timeData.rentalDays,
      总租赁天数: orderChainData.totalRentalDays,
      续租次数: orderChainData.renewalCount,
      订单链数量: orderChainData.chainSummary.totalOrders
    });

    this.calculateOvertime();
  },

  // 处理订单链数据
  processOrderChainData: function(data) {
    // 始终创建订单链，即使只有一个订单
    let originalChainDetails = [];
    let hasOrderChain = true; // 始终显示订单链
    
    if (data.orderChainDetails && data.orderChainDetails.length > 0) {
      // 使用现有的订单链数据
      originalChainDetails = data.orderChainDetails;
    } else {
      // 为单个订单创建订单链
      originalChainDetails = [{
        orderId: data.id,
        orderType: '原订单',
        orderStatus: data.statusText || '已完成',
        price: data.originalPrice || 1800,
        rentalDays: data.rentalDays || 3,
        startTime: this.formatTimestamp(data.startTimestamp),
        endTime: this.formatTimestamp(data.endTimestamp),
        isOvertime: false,
        overtimeHours: 0,
        createTime: this.formatCreateTime(new Date(data.startTimestamp - 24*60*60*1000))
      }];
    }
    
    // 处理订单链详情
    const processedChainDetails = originalChainDetails.map(chainItem => {
      return {
        ...chainItem,
        typeClassName: chainItem.orderType === '原订单' ? 'original' : 'renewal',
        statusClassName: this.getChainItemStatusClass(chainItem.orderStatus),
        formattedPrice: `¥${chainItem.price}`,
        formattedOvertimeFee: chainItem.overtimeFee ? `¥${chainItem.overtimeFee}` : '',
        formattedEffectiveTime: `${chainItem.startTime} - ${chainItem.endTime}`,
        formattedCreateTime: chainItem.createTime || this.formatCreateTime(new Date()),
        showOvertimeInfo: chainItem.isOvertime || false,
        showPaymentNotice: chainItem.orderStatus && chainItem.orderStatus.indexOf('补缴') > -1
      };
    });
    
    // 计算统计数据
    const renewalCount = processedChainDetails.filter(item => item.orderType !== '原订单').length;
    const totalRentalDays = processedChainDetails.reduce((sum, item) => sum + (item.rentalDays || 0), 0);
    const hasPayment = processedChainDetails.some(item => item.showPaymentNotice || item.overtimeFee > 0);
    
    // 生成链摘要
    const chainSummary = {
      totalOrders: originalChainDetails.length,
      renewalCount: renewalCount,
      hasPayment: hasPayment,
      badges: this.getChainBadges({
        renewalCount: renewalCount,
        hasPayment: hasPayment
      })
    };
    
    return {
      hasOrderChain: hasOrderChain,
      totalRentalDays: totalRentalDays,
      renewalCount: renewalCount,
      hasPayment: hasPayment,
      originalChainDetails: originalChainDetails,
      processedChainDetails: processedChainDetails,
      chainSummary: chainSummary
    };
  },

  getChainItemStatusClass: function(status) {
    if (!status) return 'status-unknown';
    
    if (status.includes('已完成')) return 'status-completed';
    if (status.includes('租赁中')) return 'status-renting';
    if (status.includes('待生效') || status.includes('未生效')) return 'status-pending';
    if (status.includes('待支付') || status.includes('补缴') || status.includes('待补缴')) return 'status-payment';
    if (status.includes('还车审核中')) return 'status-waiting';
    
    return 'status-unknown';
  },

  // 获取订单链标签
  getChainBadges: function(order) {
    const badges = [];
    
    if (order.renewalCount > 0) {
      badges.push({
        text: `续租${order.renewalCount}次`,
        type: 'renewal'
      });
    }
    
    if (order.hasPayment) {
      badges.push({
        text: '有补缴',
        type: 'payment'
      });
    }
    
    return badges;
  },

  processTimeData: function(data) {
    return {
      startTime: this.formatTimestamp(data.startTimestamp),
      endTime: this.formatTimestamp(data.endTimestamp),
      actualReturnTime: this.formatTimestamp(data.actualReturnTimestamp),
      rentalDays: this.calculateRentalDays(data.startTimestamp, data.endTimestamp)
    };
  },

  // ==================== 模拟数据生成方法 ====================
  
  // 根据订单ID生成对应的模拟数据
  generateMockDataById: function(orderId) {
    console.log(`为订单 ${orderId} 生成模拟数据`);
    
    const baseData = this.generateBaseMockData();
    
    // 根据不同的订单ID生成不同的场景数据
    if (orderId.includes('OVERTIME')) {
      return this.generateOvertimeScenario(baseData, orderId);
    } else if (orderId.includes('PAYMENT')) {
      return this.generatePaymentScenario(baseData, orderId);
    } else if (orderId.includes('NO_PAYMENT')) {
      return this.generateNoPaymentScenario(baseData, orderId);
    } else if (orderId.includes('COMPLEX')) {
      return this.generateComplexChainScenario(baseData, orderId);
    } else {
      // 默认场景：有超时需要支付
      return this.generateDefaultScenario(baseData, orderId);
    }
  },

  generateBaseMockData: function() {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const endTime = now - 2 * 60 * 60 * 1000;
    
    return {
      storeName: '北京朝阳门店',
      returnStore: '北京朝阳门店',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      carNumber: '京A12345',
      carImage: '../../assets/rsg.png',
      startTimestamp: threeDaysAgo,
      endTimestamp: endTime,
      actualReturnTimestamp: now,
      initialHours: 1250.5,
      userReturnHours: 1275.2,
      adminReturnHours: 1280.8,
      dashboardImage: '../../assets/dashboard-sample.jpg',
      overtimePrice: 800,
      renewalPrice: 600,
      paidOvertimeDays: 0,
      originalPrice: 1800,
      statusText: '已完成',
      vehicleRecordId: ''
    };
  },

  // 生成默认超时场景
  generateDefaultScenario: function(baseData, orderId) {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const plannedEnd = now - 2 * 60 * 60 * 1000; // 计划2小时前还车
    const actualEnd = now + 3 * 60 * 60 * 1000; // 实际3小时后还车（超时5小时）
    
    return {
      ...baseData,
      id: orderId,
      startTimestamp: threeDaysAgo,
      endTimestamp: plannedEnd,
      actualReturnTimestamp: actualEnd,
      initialHours: 1250.5,
      userReturnHours: 1275.2,
      adminReturnHours: 1280.8, // 比用户多5.6小时，按8小时/天算会超时1天
      paidOvertimeDays: 0, // 未支付任何超时费用
      // 单个订单，会自动生成订单链
      hasOrderChain: false,
      orderChainDetails: []
    };
  },

  // 生成严重超时场景（有续租）
  generateOvertimeScenario: function(baseData, orderId) {
    const now = Date.now();
    const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
    const originalEnd = now - 7 * 24 * 60 * 60 * 1000; // 原订单7天前结束
    const renewal1End = now - 3 * 24 * 60 * 60 * 1000; // 第1次续租3天前结束
    const actualEnd = now - 12 * 60 * 60 * 1000; // 实际12小时前还车（超时）
    
    return {
      ...baseData,
      id: orderId,
      storeName: '上海浦东新区分店',
      returnStore: '上海浦东新区分店',
      managerName: '李经理',
      managerPhone: '139-8888-6666',
      carModel: '三一重工SY365H挖掘机',
      carNumber: '沪B67890',
      startTimestamp: tenDaysAgo,
      endTimestamp: actualEnd,
      actualReturnTimestamp: actualEnd,
      initialHours: 2180.3,
      userReturnHours: 2220.1,
      adminReturnHours: 2258.7, // 工作78.4小时，10天*8=80小时，接近但按时间超时
      overtimePrice: 1200,
      renewalPrice: 900,
      paidOvertimeDays: 1, // 已支付1天，但实际超时2天
      // 复杂订单链
      hasOrderChain: true,
      orderChainDetails: [
        {
          orderId: orderId,
          orderType: '原订单',
          orderStatus: '已完成',
          price: 1800,
          rentalDays: 3,
          startTime: this.formatTimestamp(tenDaysAgo),
          endTime: this.formatTimestamp(originalEnd),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(tenDaysAgo - 24*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_1`,
          orderType: '第1次续租',
          orderStatus: '已完成',
          price: 960,
          rentalDays: 4,
          startTime: this.formatTimestamp(originalEnd),
          endTime: this.formatTimestamp(renewal1End),
          isOvertime: true,
          overtimeHours: 6,
          overtimeFee: 300,
          createTime: this.formatCreateTime(new Date(originalEnd - 2*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_2`,
          orderType: '第2次续租',
          orderStatus: '已完成',
          price: 720,
          rentalDays: 3,
          startTime: this.formatTimestamp(renewal1End),
          endTime: this.formatTimestamp(actualEnd),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(renewal1End - 1*60*60*1000))
        }
      ]
    };
  },

  // 生成部分支付场景
  generatePaymentScenario: function(baseData, orderId) {
    const now = Date.now();
    const sixDaysAgo = now - 6 * 24 * 60 * 60 * 1000;
    const plannedEnd = now - 3 * 24 * 60 * 60 * 1000; // 计划3天前还车
    const actualEnd = now - 2 * 24 * 60 * 60 * 1000; // 实际2天前还车（超时1天）
    
    return {
      ...baseData,
      id: orderId,
      storeName: '深圳南山区分店',
      returnStore: '深圳南山区分店',
      managerName: '王经理',
      managerPhone: '187-9999-1234',
      carModel: '徐工XE270DK挖掘机',
      carNumber: '粤B88888',
      startTimestamp: sixDaysAgo,
      endTimestamp: plannedEnd,
      actualReturnTimestamp: actualEnd,
      initialHours: 3650.8,
      userReturnHours: 3685.5,
      adminReturnHours: 3698.2, // 工作47.4小时，6天*8=48小时，未超时但时间超时1天
      overtimePrice: 950,
      renewalPrice: 720,
      paidOvertimeDays: 2, // 已支付2天，但实际只超时1天，应该退费或无需再支付
      // 单个订单
      hasOrderChain: false,
      orderChainDetails: []
    };
  },

  // 生成无需支付场景
  generateNoPaymentScenario: function(baseData, orderId) {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const plannedEnd = now - 1 * 60 * 60 * 1000; // 计划1小时前还车
    const actualEnd = now - 30 * 60 * 1000; // 实际30分钟前还车（在宽限期内）
    
    return {
      ...baseData,
      id: orderId,
      storeName: '广州天河区分店',
      returnStore: '广州天河区分店',
      managerName: '陈经理',
      managerPhone: '158-7777-8888',
      carModel: '柳工CLG922E挖掘机',
      carNumber: '粤A66666',
      startTimestamp: twoDaysAgo,
      endTimestamp: plannedEnd,
      actualReturnTimestamp: actualEnd,
      initialHours: 890.2,
      userReturnHours: 906.1,
      adminReturnHours: 905.8, // 工作15.6小时，2天*8=16小时，未超时
      overtimePrice: 600,
      renewalPrice: 450,
      paidOvertimeDays: 1, // 已支付1天超时费，但实际未超时
      // 单个订单
      hasOrderChain: false,
      orderChainDetails: []
    };
  },

  // 生成复杂订单链场景
  generateComplexChainScenario: function(baseData, orderId) {
    const now = Date.now();
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;
    const originalEnd = now - 12 * 24 * 60 * 60 * 1000;
    const renewal1End = now - 8 * 24 * 60 * 60 * 1000;
    const renewal2End = now - 4 * 24 * 60 * 60 * 1000;
    const actualEnd = now - 6 * 60 * 60 * 1000; // 最终过期6小时
    
    return {
      ...baseData,
      id: orderId,
      storeName: '成都高新区分店',
      returnStore: '成都高新区分店',
      managerName: '刘经理',
      managerPhone: '177-5555-9999',
      carModel: '斗山DX225LC-9C挖掘机',
      carNumber: '川D88888',
      startTimestamp: fifteenDaysAgo,
      endTimestamp: actualEnd,
      actualReturnTimestamp: actualEnd,
      initialHours: 3250.8,
      userReturnHours: 3368.2,
      adminReturnHours: 3375.6, // 工作124.8小时，15天*8=120小时，超时4.8小时约1天
      overtimePrice: 950,
      renewalPrice: 720,
      paidOvertimeDays: 0, // 未支付任何超时费用
      // 复杂订单链
      hasOrderChain: true,
      orderChainDetails: [
        {
          orderId: orderId,
          orderType: '原订单',
          orderStatus: '已完成',
          price: 1500,
          rentalDays: 3,
          startTime: this.formatTimestamp(fifteenDaysAgo),
          endTime: this.formatTimestamp(originalEnd),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(fifteenDaysAgo - 24*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_1`,
          orderType: '第1次续租',
          orderStatus: '已完成',
          price: 960,
          rentalDays: 4,
          startTime: this.formatTimestamp(originalEnd),
          endTime: this.formatTimestamp(renewal1End),
          isOvertime: true,
          overtimeHours: 3,
          overtimeFee: 150,
          createTime: this.formatCreateTime(new Date(originalEnd - 2*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_2`,
          orderType: '第2次续租',
          orderStatus: '已完成',
          price: 960,
          rentalDays: 4,
          startTime: this.formatTimestamp(renewal1End),
          endTime: this.formatTimestamp(renewal2End),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(renewal1End - 1*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_3`,
          orderType: '第3次续租',
          orderStatus: '已完成',
          price: 960,
          rentalDays: 4,
          startTime: this.formatTimestamp(renewal2End),
          endTime: this.formatTimestamp(actualEnd),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(renewal2End - 1*60*60*1000))
        }
      ]
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

  formatCreateTime: function(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  },

  calculateRentalDays: function(startTimestamp, endTimestamp) {
    const diffMs = endTimestamp - startTimestamp;
    return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  },

  // ==================== 交互事件 ====================
  
  // 切换订单链折叠状态
  toggleOrderChain: function(e) {
    // 阻止事件冒泡
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    this.setData({
      'uiState.isChainExpanded': !this.data.uiState.isChainExpanded
    });
    
    console.log('订单链展开状态:', !this.data.uiState.isChainExpanded);
  },

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
      totalRentalDays,
      rentalDays
    } = this.data.orderInfo;
    
    const { paidOvertimeDays } = this.data.overtimeCalculation;
    
    // 使用总租赁天数进行计算
    const effectiveRentalDays = totalRentalDays || rentalDays;
    
    // 计算超时
    const overtimeResult = this.performOvertimeCalculation({
      adminReturnHours,
      initialHours,
      endTimestamp,
      actualReturnTimestamp,
      dailyWorkHours,
      rentalDays: effectiveRentalDays,
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

    console.log('超时计算完成', {
      ...overtimeResult, 
      总租期: effectiveRentalDays,
      ...priceResult
    });
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
    
    const hoursDetail = `工作小时数：${totalWorkHours.toFixed(1)}小时，总租期${rentalDays}天允许工作${allowedTotalHours}小时，${
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
    this.processRealPayment(paymentData);
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
    // 开发阶段优先使用模拟支付
    this.processMockPayment(paymentData);
  },

  // 模拟支付流程
  processMockPayment: function(paymentData) {
    console.log('使用模拟支付流程', paymentData);
    
    this.setData({ 'uiState.paymentProcessing': true });
    wx.showLoading({ title: '支付中...' });
    
    // 模拟网络延迟
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ 'uiState.paymentProcessing': false });
      
      // 模拟支付选择对话框
      wx.showModal({
        title: '模拟支付',
        content: `支付金额：¥${paymentData.finalPaymentAmount}\n选择支付结果：`,
        confirmText: '支付成功',
        cancelText: '支付失败',
        success: (res) => {
          if (res.confirm) {
            this.handlePaymentSuccess();
          } else {
            this.handlePaymentFail();
          }
        }
      });
    }, 1500);
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
  },

  // ==================== 测试场景管理 ====================
  
  generateTestScenarios: function() {
    return {
      'OVERTIME_001': '严重超时场景 - 超时2天需支付，有复杂续租链',
      'PAYMENT_001': '部分支付场景 - 已支付部分费用',
      'NO_PAYMENT_001': '无需支付场景 - 已全部支付',
      'COMPLEX_001': '复杂订单链场景 - 多次续租和超时补缴',
      'TEST_ORDER_001': '默认测试场景 - 标准超时，单个订单'
    };
  },

  logTestScenarios: function() {
    const scenarios = this.generateTestScenarios();
    console.log('=== 支付审核后页面可用测试场景 ===');
    Object.keys(scenarios).forEach(orderId => {
      console.log(`${orderId}: ${scenarios[orderId]}`);
    });
    console.log('=== 使用方法 ===');
    console.log('在页面URL中添加 ?orderId=OVERTIME_001 来测试不同场景');
    console.log('=== 订单链展示说明 ===');
    console.log('- 所有订单都会显示订单链，单个订单会自动创建订单链');
    console.log('- 复杂场景包含多个续租订单和超时补缴情况');
    console.log('- 支持标签系统显示续租次数和补缴状态');
  }
});