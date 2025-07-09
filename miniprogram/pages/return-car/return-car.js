// return-car.js - 更新数据处理逻辑，添加订单链支持
Page({
  data: {
    // 订单基本信息
    orderInfo: {
      id: '',
      storeName: '',
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
      statusText: '租赁中',
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
    
    // 用户输入数据
    userInput: {
      returnHours: '',
      dashboardImage: '',
      vehicleImages: [],
      hoursErrorTip: ''
    },
    
    // 超时计算结果
    overtimeCalculation: {
      showResult: false,
      overtimeDays: 0,
      timeOvertimeDays: 0,
      hoursOvertimeDays: 0,
      currentReturnTimestamp: 0,
      timeOvertimeDetail: '',
      hoursOvertimeDetail: '',
      finalOvertimeReason: ''
    },
    
    // 价格选择
    priceOptions: {
      overtimePrice: 0,
      renewalPrice: 0,
      selectedType: '',
      overtimeTotalPrice: 0,
      renewalTotalPrice: 0,
      finalPaymentAmount: 0,
      showFinalPayment: false
    },
    
    // UI状态控制
    uiState: {
      showOvertimeModal: false,
      canSubmit: false,
      submitButtonText: '还车',
      isLoading: false,
      submitting: false,
      // 订单链展开状态
      isChainExpanded: false
    }
  },

  onLoad: function(options) {
    this.logTestScenarios();
    this.initializePage(options);
  },

  // ==================== 初始化 ====================
  
  initializePage: function(options) {
    const orderId = options.orderId;
    
    console.log('还车页面初始化，订单ID:', orderId);
    
    if (orderId) {
      this.loadOrderInfo(orderId);
    } else {
      // 无订单ID时，生成一个测试订单ID
      const testOrderId = `RETURN_ORDER_${Date.now()}`;
      console.log('无订单ID，生成测试订单:', testOrderId);
      this.loadOrderInfo(testOrderId);
    }
  },

  // ==================== 数据加载 ====================
  
  loadOrderInfo: function(orderId) {
    // 优先使用模拟数据进行开发测试
    console.log(`加载还车订单信息: ${orderId}`);
    
    wx.showToast({
      title: '使用模拟数据',
      icon: 'none',
      duration: 1500
    });
    
    setTimeout(() => {
      const mockData = this.generateMockDataById(orderId);
      this.processOrderData(mockData);
    }, 800);
  },

  // ==================== 数据处理 ====================
  
  processOrderData: function(data) {
    // 处理时间格式
    const timeData = this.processTimeData(data);
    
    // 处理订单链数据 - 改进：始终生成订单链，即使只有一个订单
    const orderChainData = this.processOrderChainData(data);
    
    // 更新页面数据
    this.setData({
      orderInfo: {
        id: data.id,
        storeName: data.storeName,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        carModel: data.carModel,
        carNumber: data.carNumber,
        carImage: data.carImage || '../../assets/rsg.png',
        returnStore: data.returnStore || data.storeName, // 添加还车门店
        startTime: timeData.startTime,
        endTime: timeData.endTime,
        rentalDays: timeData.rentalDays,
        initialHours: data.initialHours,
        endTimestamp: data.endTimestamp,
        dailyWorkHours: 8,
        statusText: data.statusText || '租赁中',
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
      'priceOptions.overtimePrice': data.overtimePrice,
      'priceOptions.renewalPrice': data.renewalPrice
    });

    console.log('还车订单数据处理完成', {
      订单ID: data.id,
      租赁天数: timeData.rentalDays,
      总租赁天数: orderChainData.totalRentalDays,
      续租次数: orderChainData.renewalCount,
      订单链数量: orderChainData.chainSummary.totalOrders,
      有订单链: orderChainData.hasOrderChain
    });
  },

  processOrderChainData: function(data) {
    // 始终创建订单链，即使只有一个订单
    let originalChainDetails = [];
    let hasOrderChain = true; // 改为始终显示订单链
    
    if (data.orderChainDetails && data.orderChainDetails.length > 0) {
      // 使用现有的订单链数据
      originalChainDetails = data.orderChainDetails;
    } else {
      // 为单个订单创建订单链
      originalChainDetails = [{
        orderId: data.id,
        orderType: '原订单',
        orderStatus: data.statusText || '租赁中',
        price: data.originalPrice || 1800, // 假设原始价格
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
      rentalDays: this.calculateRentalDays(data.startTimestamp, data.endTimestamp)
    };
  },

  // ==================== 模拟数据生成方法 ====================
  
  generateMockDataById: function(orderId) {
    console.log(`为还车订单 ${orderId} 生成模拟数据`);
    
    const baseData = this.generateBaseMockData();
    
    // 根据不同的订单ID生成不同的场景数据
    if (orderId.includes('OVERTIME')) {
      return this.generateOvertimeScenario(baseData, orderId);
    } else if (orderId.includes('EXPIRED')) {
      return this.generateExpiredScenario(baseData, orderId);
    } else if (orderId.includes('NORMAL')) {
      return this.generateNormalScenario(baseData, orderId);
    } else if (orderId.includes('LONG_TERM')) {
      return this.generateLongTermScenario(baseData, orderId);
    } else {
      // 默认场景：即将到期，容易测试超时
      return this.generateDefaultReturnScenario(baseData, orderId);
    }
  },

  generateBaseMockData: function() {
    return {
      storeName: '北京朝阳门店',
      returnStore: '北京朝阳门店', // 添加还车门店，通常与取车门店相同
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      carNumber: '京A12345',
      carImage: '../../assets/rsg.png',
      initialHours: 1250.5,
      overtimePrice: 800,
      renewalPrice: 600,
      originalPrice: 1800,
      statusText: '租赁中',
      vehicleRecordId: ''
    };
  },

  // 默认还车场景（容易测试超时）
  generateDefaultReturnScenario: function(baseData, orderId) {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const twoHoursAgo = now - 2 * 60 * 60 * 1000; // 已过期2小时
    
    return {
      ...baseData,
      id: orderId,
      startTimestamp: threeDaysAgo,
      endTimestamp: twoHoursAgo,
      rentalDays: 3,
      // 单个订单，创建简单订单链
      hasOrderChain: false, // 在processOrderChainData中会被设为true
      orderChainDetails: [] // 会自动生成
    };
  },

  // 严重超时场景（有续租）
  generateOvertimeScenario: function(baseData, orderId) {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const originalEnd = now - 3 * 24 * 60 * 60 * 1000; // 原订单3天前结束
    const oneDayAgo = now - 1 * 24 * 60 * 60 * 1000; // 续租1天前过期
    
    return {
      ...baseData,
      id: orderId,
      storeName: '上海浦东新区分店',
      returnStore: '上海浦东新区分店',
      managerName: '李经理',
      managerPhone: '139-8888-6666',
      carModel: '三一重工SY365H挖掘机',
      carNumber: '沪B67890',
      startTimestamp: sevenDaysAgo,
      endTimestamp: oneDayAgo,
      rentalDays: 6, // 总租期
      initialHours: 2180.3,
      overtimePrice: 1200,
      renewalPrice: 900,
      // 有订单链数据
      hasOrderChain: true,
      orderChainDetails: [
        {
          orderId: orderId,
          orderType: '原订单',
          orderStatus: '已完成',
          price: 1800,
          rentalDays: 3,
          startTime: this.formatTimestamp(sevenDaysAgo),
          endTime: this.formatTimestamp(originalEnd),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(sevenDaysAgo - 24*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_1`,
          orderType: '第1次续租',
          orderStatus: '租赁中',
          price: 720,
          rentalDays: 3,
          startTime: this.formatTimestamp(originalEnd),
          endTime: this.formatTimestamp(oneDayAgo),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(originalEnd - 2*60*60*1000))
        }
      ]
    };
  },

  // 刚过期场景
  generateExpiredScenario: function(baseData, orderId) {
    const now = Date.now();
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000;
    const halfHourAgo = now - 30 * 60 * 1000; // 刚过期30分钟
    
    return {
      ...baseData,
      id: orderId,
      storeName: '深圳南山区分店',
      returnStore: '深圳南山区分店',
      managerName: '王经理',
      managerPhone: '187-9999-1234',
      carModel: '徐工XE270DK挖掘机',
      startTimestamp: twoDaysAgo,
      endTimestamp: halfHourAgo,
      initialHours: 890.2,
      // 单个订单
      hasOrderChain: false,
      orderChainDetails: []
    };
  },

  // 正常还车场景（未过期）
  generateNormalScenario: function(baseData, orderId) {
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000;
    const twoHoursLater = now + 2 * 60 * 60 * 1000; // 还有2小时到期
    
    return {
      ...baseData,
      id: orderId,
      storeName: '广州天河区分店',
      returnStore: '广州天河区分店',
      managerName: '陈经理',
      managerPhone: '158-7777-8888',
      carModel: '柳工CLG922E挖掘机',
      startTimestamp: threeDaysAgo,
      endTimestamp: twoHoursLater,
      initialHours: 1680.0,
      overtimePrice: 600,
      renewalPrice: 450,
      // 单个订单
      hasOrderChain: false,
      orderChainDetails: []
    };
  },

  // 长期租赁场景（复杂订单链）
  generateLongTermScenario: function(baseData, orderId) {
    const now = Date.now();
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;
    const originalEnd = now - 10 * 24 * 60 * 60 * 1000;
    const renewal1End = now - 5 * 24 * 60 * 60 * 1000;
    const fourHoursAgo = now - 4 * 60 * 60 * 1000; // 最终过期4小时
    
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
      endTimestamp: fourHoursAgo,
      rentalDays: 15, // 总租期
      initialHours: 3250.8,
      overtimePrice: 950,
      renewalPrice: 720,
      // 复杂订单链
      hasOrderChain: true,
      orderChainDetails: [
        {
          orderId: orderId,
          orderType: '原订单',
          orderStatus: '已完成',
          price: 3000,
          rentalDays: 5,
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
          price: 1500,
          rentalDays: 5,
          startTime: this.formatTimestamp(originalEnd),
          endTime: this.formatTimestamp(renewal1End),
          isOvertime: true,
          overtimeHours: 2,
          overtimeFee: 200,
          createTime: this.formatCreateTime(new Date(originalEnd - 2*60*60*1000))
        },
        {
          orderId: `${orderId}_RENEWAL_2`,
          orderType: '第2次续租',
          orderStatus: '租赁中',
          price: 1500,
          rentalDays: 5,
          startTime: this.formatTimestamp(renewal1End),
          endTime: this.formatTimestamp(fourHoursAgo),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(renewal1End - 1*60*60*1000))
        }
      ]
    };
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

  // ==================== 用户交互 ====================
  
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

  // 还车小时数输入处理
  onReturnHoursChange: function(e) {
    let value = e.detail.value;
    
    // 限制输入格式：只允许数字和一个小数点，小数点后最多一位
    value = value.replace(/[^\d.]/g, '');
    
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts[1] && parts[1].length > 1) {
      value = parts[0] + '.' + parts[1].substring(0, 1);
    }

    this.setData({
      'userInput.returnHours': value,
      'userInput.hoursErrorTip': ''
    });
    
    this.checkCanSubmit();
  },

  // 失去焦点时进行校验和计算
  onReturnHoursBlur: function(e) {
    const value = e.detail.value;
    
    if (!value) {
      this.setData({
        'overtimeCalculation.showResult': false,
        'priceOptions.showFinalPayment': false,
        'uiState.submitButtonText': '还车'
      });
      return;
    }
    
    const returnHours = parseFloat(value);
    const initialHours = this.data.orderInfo.initialHours;
    
    // 校验：不能小于出车时的仪表盘数据
    if (returnHours < initialHours) {
      this.setData({
        'userInput.hoursErrorTip': `还车工作小时数不能小于出车时的${initialHours}小时`,
        'overtimeCalculation.showResult': false,
        'priceOptions.showFinalPayment': false,
        'uiState.submitButtonText': '还车'
      });
      return;
    }
    
    // 清除错误提示，开始计算超时
    this.setData({
      'userInput.hoursErrorTip': ''
    });
    
    this.calculateOvertime();
  },

  // ==================== 超时计算 ====================
  
  calculateOvertime: function() {
    const returnHours = parseFloat(this.data.userInput.returnHours);
    const { initialHours, endTimestamp, dailyWorkHours, totalRentalDays } = this.data.orderInfo;
    
    if (isNaN(returnHours)) return;
    
    // 使用总租赁天数进行计算
    const effectiveRentalDays = totalRentalDays || this.data.orderInfo.rentalDays;
    
    // 获取当前时间戳
    const currentTimestamp = Date.now();
    
    // 1. 按租期时间计算超时
    const graceTimestamp = endTimestamp + 30 * 60 * 1000;
    const timeOverMs = Math.max(0, currentTimestamp - graceTimestamp);
    const timeOvertimeDays = timeOverMs > 0 ? Math.ceil(timeOverMs / (24 * 60 * 60 * 1000)) : 0;
    
    // 2. 按工作小时数计算超时
    const totalWorkHours = returnHours - initialHours;
    const allowedTotalHours = effectiveRentalDays * dailyWorkHours;
    const excessHours = Math.max(0, totalWorkHours - allowedTotalHours);
    const hoursOvertimeDays = excessHours > 0 ? Math.ceil(excessHours / dailyWorkHours) : 0;
    
    // 取最大值作为实际超时天数
    const finalOvertimeDays = Math.max(timeOvertimeDays, hoursOvertimeDays);
    
    // 生成详情描述
    const overtimeDetails = this.generateOvertimeDetails({
      timeOvertimeDays,
      hoursOvertimeDays,
      finalOvertimeDays,
      endTimestamp,
      currentTimestamp,
      totalWorkHours,
      rentalDays: effectiveRentalDays,
      allowedTotalHours,
      excessHours
    });
    
    // 计算价格
    const priceResult = this.calculatePrices(finalOvertimeDays);
    
    // 更新数据
    this.setData({
      'overtimeCalculation.showResult': true,
      'overtimeCalculation.overtimeDays': finalOvertimeDays,
      'overtimeCalculation.timeOvertimeDays': timeOvertimeDays,
      'overtimeCalculation.hoursOvertimeDays': hoursOvertimeDays,
      'overtimeCalculation.currentReturnTimestamp': currentTimestamp,
      'overtimeCalculation.timeOvertimeDetail': overtimeDetails.timeDetail,
      'overtimeCalculation.hoursOvertimeDetail': overtimeDetails.hoursDetail,
      'overtimeCalculation.finalOvertimeReason': overtimeDetails.finalReason,
      'priceOptions.overtimeTotalPrice': priceResult.overtimeTotal,
      'priceOptions.renewalTotalPrice': priceResult.renewalTotal
    });
    
    // 设置按钮状态和默认选择
    this.updateSubmitButtonState(finalOvertimeDays, priceResult.overtimeTotal);
    
    console.log('超时计算完成', { 
      finalOvertimeDays, 
      总租期: effectiveRentalDays,
      ...priceResult 
    });
  },

  generateOvertimeDetails: function(data) {
    const {
      timeOvertimeDays,
      hoursOvertimeDays,
      finalOvertimeDays,
      endTimestamp,
      currentTimestamp,
      totalWorkHours,
      rentalDays,
      allowedTotalHours,
      excessHours
    } = data;
    
    const timeDetail = timeOvertimeDays > 0 ? 
      `预期还车时间：${this.formatTimestamp(endTimestamp)}（含30分钟宽限期），当前时间：${this.formatTimestamp(currentTimestamp)}，超时${timeOvertimeDays}天` : 
      `预期还车时间：${this.formatTimestamp(endTimestamp)}（含30分钟宽限期），当前时间：${this.formatTimestamp(currentTimestamp)}，未超时`;
    
    const hoursDetail = `工作小时数：${totalWorkHours.toFixed(1)}小时，总租期${rentalDays}天允许工作${allowedTotalHours}小时，${
      hoursOvertimeDays > 0 ? `超出${excessHours.toFixed(1)}小时，按8小时/天计算，超时${hoursOvertimeDays}天` : '未超时'
    }`;
    
    const finalReason = finalOvertimeDays > 0 ? 
      (timeOvertimeDays >= hoursOvertimeDays ? 
        `最终按还车时间超时计算，因为时间超时${timeOvertimeDays}天 >= 工作小时数超时${hoursOvertimeDays}天` : 
        `最终按工作小时数超时计算，因为工作小时数超时${hoursOvertimeDays}天 > 时间超时${timeOvertimeDays}天`) :
      '未超时，无需额外费用';
    
    return { timeDetail, hoursDetail, finalReason };
  },

  calculatePrices: function(overtimeDays) {
    const { overtimePrice, renewalPrice } = this.data.priceOptions;
    
    return {
      overtimeTotal: overtimeDays * overtimePrice,
      renewalTotal: overtimeDays * renewalPrice
    };
  },

  updateSubmitButtonState: function(overtimeDays, overtimeTotal) {
    if (overtimeDays > 0) {
      this.setData({
        'priceOptions.selectedType': 'overtime',
        'priceOptions.finalPaymentAmount': overtimeTotal,
        'priceOptions.showFinalPayment': true,
        'uiState.submitButtonText': '还车并支付'
      });
    } else {
      this.setData({
        'priceOptions.selectedType': '',
        'priceOptions.finalPaymentAmount': 0,
        'priceOptions.showFinalPayment': false,
        'uiState.submitButtonText': '还车'
      });
    }
    
    this.checkCanSubmit();
  },

  // ==================== 弹窗控制 ====================
  
  showOvertimeDetail: function() {
    this.setData({
      'uiState.showOvertimeModal': true
    });
  },

  hideOvertimeDetail: function() {
    this.setData({
      'uiState.showOvertimeModal': false
    });
  },

  stopPropagation: function() {
    // 阻止事件冒泡
  },

  // ==================== 价格选择 ====================
  
  selectPriceType: function(e) {
    const type = e.currentTarget.dataset.type;
    const { overtimeTotalPrice, renewalTotalPrice } = this.data.priceOptions;
    const amount = type === 'overtime' ? overtimeTotalPrice : renewalTotalPrice;
    
    this.setData({
      'priceOptions.selectedType': type,
      'priceOptions.finalPaymentAmount': amount
    });
  },

  // ==================== 图片上传 ====================
  
  uploadDashboardImage: function() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          'userInput.dashboardImage': res.tempFilePaths[0]
        });
        this.checkCanSubmit();
      },
      fail: () => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  deleteDashboardImage: function() {
    this.setData({
      'userInput.dashboardImage': ''
    });
    this.checkCanSubmit();
  },

  uploadVehicleImage: function() {
    const maxCount = 6 - this.data.userInput.vehicleImages.length;
    
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = [...this.data.userInput.vehicleImages, ...res.tempFilePaths];
        this.setData({
          'userInput.vehicleImages': newImages
        });
        this.checkCanSubmit();
      },
      fail: () => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  deleteVehicleImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.userInput.vehicleImages];
    images.splice(index, 1);
    this.setData({
      'userInput.vehicleImages': images
    });
    this.checkCanSubmit();
  },

  // ==================== 表单验证 ====================
  
  checkCanSubmit: function() {
    const { returnHours, dashboardImage, vehicleImages, hoursErrorTip } = this.data.userInput;
    const { showResult } = this.data.overtimeCalculation;
    
    const basicConditions = returnHours && 
                           !isNaN(parseFloat(returnHours)) && 
                           !hoursErrorTip &&
                           dashboardImage && 
                           vehicleImages.length > 0 &&
                           showResult;
    
    this.setData({
      'uiState.canSubmit': basicConditions
    });
  },

  // ==================== 提交处理 ====================
  
  submitReturn: function() {
    // 检查基本必填项
    const validationResult = this.validateRequiredFields();
    if (!validationResult.isValid) {
      wx.showToast({
        title: validationResult.message,
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 如果有超时但未选择价格类型
    if (this.data.overtimeCalculation.overtimeDays > 0 && !this.data.priceOptions.selectedType) {
      wx.showToast({
        title: '请选择计费方式',
        icon: 'none'
      });
      return;
    }
    
    const submitData = this.prepareSubmitData();
    
    // 根据订单ID判断使用模拟还是真实提交
    if (this.data.orderInfo.id.includes('MOCK_') || 
        this.data.orderInfo.id.includes('RETURN_') || 
        this.data.orderInfo.id.includes('TEST_')) {
      this.processMockSubmit(submitData);
    } else {
      this.processAPISubmit(submitData);
    }
  },

  // 验证必填字段
  validateRequiredFields: function() {
    const { returnHours, dashboardImage, vehicleImages, hoursErrorTip } = this.data.userInput;
    const { showResult } = this.data.overtimeCalculation;
    
    // 检查工作小时数
    if (!returnHours || returnHours.trim() === '') {
      return {
        isValid: false,
        message: '请输入还车时的工作小时数'
      };
    }
    
    // 检查小时数格式
    if (isNaN(parseFloat(returnHours))) {
      return {
        isValid: false,
        message: '请输入有效的工作小时数'
      };
    }
    
    // 检查是否有输入错误
    if (hoursErrorTip) {
      return {
        isValid: false,
        message: '请修正工作小时数输入错误'
      };
    }
    
    // 检查仪表盘照片
    if (!dashboardImage) {
      return {
        isValid: false,
        message: '请上传仪表盘照片'
      };
    }
    
    // 检查车辆照片
    if (vehicleImages.length === 0) {
      return {
        isValid: false,
        message: '请至少上传一张车辆照片'
      };
    }
    
    // 检查是否已完成超时计算
    if (!showResult) {
      return {
        isValid: false,
        message: '请等待超时计算完成'
      };
    }
    
    return {
      isValid: true,
      message: ''
    };
  },

  prepareSubmitData: function() {
    const { orderInfo, userInput, overtimeCalculation, priceOptions } = this.data;
    
    return {
      orderId: orderInfo.id,
      returnHours: parseFloat(userInput.returnHours),
      dashboardImage: userInput.dashboardImage,
      vehicleImages: userInput.vehicleImages,
      currentReturnTimestamp: overtimeCalculation.currentReturnTimestamp,
      overtimeDays: overtimeCalculation.overtimeDays,
      selectedPriceType: priceOptions.selectedType,
      finalPaymentAmount: priceOptions.finalPaymentAmount
    };
  },

  // 模拟提交流程
  processMockSubmit: function(submitData) {
    console.log('使用模拟提交流程', submitData);
    
    this.setData({ 'uiState.submitting': true });
    wx.showLoading({ title: '提交中...' });
    
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ 'uiState.submitting': false });
      
      if (submitData.finalPaymentAmount > 0) {
        this.showMockPaymentDialog(submitData);
      } else {
        this.handleSuccessfulSubmit();
      }
    }, 2000);
  },

  showMockPaymentDialog: function(submitData) {
    wx.showModal({
      title: '模拟支付',
      content: `需要支付：¥${submitData.finalPaymentAmount}，是否模拟支付成功？`,
      confirmText: '支付成功',
      cancelText: '支付失败',
      success: (res) => {
        if (res.confirm) {
          this.handleSuccessfulPayment();
        } else {
          wx.showToast({
            title: '支付失败',
            icon: 'error'
          });
        }
      }
    });
  },

  handleSuccessfulPayment: function() {
    wx.showToast({
      title: '支付成功',
      icon: 'success'
    });
    
    setTimeout(() => {
      this.handleSuccessfulSubmit();
    }, 1500);
  },

  handleSuccessfulSubmit: function() {
    wx.showModal({
      title: '还车成功',
      content: '还车申请已提交，请等待门店审核',
      showCancel: false,
      success: () => {
        wx.redirectTo({
          url: '/pages/return-review/return-review'
        });
      }
    });
  },

  // 真实API提交流程（生产环境使用）
  processAPISubmit: function(submitData) {
    console.log('使用真实API提交流程', submitData);
    
    this.setData({ 'uiState.submitting': true });
    wx.showLoading({ title: '提交中...' });
    
    wx.request({
      url: 'YOUR_API_BASE_URL/return/submit',
      method: 'POST',
      data: submitData,
      success: (res) => this.handleAPIResponse(res),
      fail: () => this.handleAPIError(),
      complete: () => {
        wx.hideLoading();
        this.setData({ 'uiState.submitting': false });
      }
    });
  },

  handleAPIResponse: function(res) {
    if (res.data.code === 200) {
      if (res.data.data.needPayment) {
        this.processWechatPayment(res.data.data.paymentInfo);
      } else {
        this.handleSuccessfulSubmit();
      }
    } else if (res.data.code === 400 && res.data.message.includes('价格发生变化')) {
      this.handlePriceChangeError(res.data.message);
    } else {
      wx.showToast({
        title: res.data.message || '提交失败',
        icon: 'none'
      });
    }
  },

  handleAPIError: function() {
    wx.showToast({
      title: '网络请求失败',
      icon: 'none'
    });
  },

  handlePriceChangeError: function(message) {
    wx.showModal({
      title: '提示',
      content: message,
      showCancel: false,
      confirmText: '重新提交',
      success: () => {
        this.calculateOvertime();
      }
    });
  },

  processWechatPayment: function(paymentInfo) {
    wx.requestPayment({
      timeStamp: paymentInfo.timeStamp,
      nonceStr: paymentInfo.nonceStr,
      package: paymentInfo.package,
      signType: paymentInfo.signType,
      paySign: paymentInfo.paySign,
      success: () => this.handleSuccessfulPayment(),
      fail: () => {
        wx.showToast({
          title: '支付失败',
          icon: 'none'
        });
      }
    });
  },

  // ==================== 测试场景管理 ====================
  
  generateTestScenarios: function() {
    return {
      'OVERTIME_001': '严重超时场景 - 已过期1天，有续租',
      'EXPIRED_001': '刚过期场景 - 过期30分钟',
      'NORMAL_001': '正常还车场景 - 还有2小时到期',
      'LONG_TERM_001': '长期租赁场景 - 15天租期，复杂订单链',
      'RETURN_ORDER_001': '默认还车场景 - 过期2小时易测超时'
    };
  },

  logTestScenarios: function() {
    const scenarios = this.generateTestScenarios();
    console.log('=== 还车页面可用测试场景 ===');
    Object.keys(scenarios).forEach(orderId => {
      console.log(`${orderId}: ${scenarios[orderId]}`);
    });
    console.log('=== 使用方法 ===');
    console.log('在页面URL中添加 ?orderId=OVERTIME_001 来测试不同场景');
    console.log('=== 订单链展示说明 ===');
    console.log('- 所有订单都会显示订单链，单个订单会自动创建订单链');
    console.log('- 复杂场景(OVERTIME_001, LONG_TERM_001)包含多个续租订单');
    console.log('- 简单场景会自动为单个订单生成订单链结构');
  }
});