// renewal-car.js - 按照订单页面模式的续租页面（使用模拟数据）
Page({
  data: {
    // ==================== 订单信息 ====================
    // 原订单信息 - 扩展为完整的订单信息
    originalOrderInfo: {
      id: '',
      orderId: '',
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      carNumber: '',
      carImage: '../../assets/rsg.png',
      pickupStore: '',
      returnStore: '',
      originalStartTime: 0,
      originalEndTime: 0,
      originalDays: 0,
      orderStatus: 2, // 已完成
      statusText: '已完成',
      vehicleRecordId: '', // 出车记录ID
      
      // 订单链相关信息
      hasOrderChain: false,
      orderChainDetails: [],
      totalRentalDays: 0,
      renewalCount: 0,
      hasPayment: false
    },
    
    // 新续租订单信息
    renewalOrderInfo: {
      orderId: '', // 新生成的续租订单ID
      parentOrderId: '', // 指向原订单
      isRenewalOrder: true,
      renewalLevel: 1, // 续租层级
      status: 'pending' // 待生效
    },
    
    // ==================== 订单链展示控制 ====================
    showOrderChain: false,
    isChainExpanded: false, // 订单链折叠状态
    
    // 预处理后的订单链数据
    processedChainDetails: [],
    chainSummary: {
      totalOrders: 0,
      renewalCount: 0,
      hasPayment: false,
      badges: []
    },
    
    // ==================== 续租配置 ====================
    renewDays: '',
    renewPrice: 0,
    memberRenewPrice: 0,
    currentRenewPrice: 0,
    daysErrorTip: '',
    
    // ==================== 系统配置 ====================
    // 系统服务费率
    serviceRate: 0.006,
    serviceRatePercent: '0.6',
    
    // ==================== 会员相关 ====================
    isMember: false,
    showMemberCard: false,
    membershipInfo: {
      price: 299,
      discount: 0.8,
      discountText: '8折'
    },
    purchaseMembership: false,
    
    // ==================== 时间显示 ====================
    originalStartTimeText: '',
    originalEndTimeText: '',
    newStartTime: '',
    newEndTime: '',
    
    // ==================== 计算结果 ====================
    showNewPeriod: false,
    showPaymentDetail: false,
    totalDays: 0,
    
    // 价格明细
    renewSubtotal: '0.00',
    membershipFee: '0.00',
    serviceSubtotal: '0.00',
    serviceFee: '0.00',
    totalAmount: '0.00',
    
    // ==================== 支付相关 ====================
    canPay: false,
    paymentButtonText: '请先输入续租天数',
    showPaymentModal: false
  },

  // ==================== 生命周期方法 ====================
  
  onLoad(options) {
    console.log('续租页面加载', options);
    this.initPage(options);
  },

  // ==================== 初始化方法 ====================
  
  // 初始化页面
  async initPage(options) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 设置原订单ID
      this.setData({
        'originalOrderInfo.orderId': options.orderId,
        'renewalOrderInfo.parentOrderId': options.orderId
      });

      // 并行获取基础数据
      await Promise.all([
        this.getOriginalOrderInfo(options.orderId),
        this.checkUserMembership(),
        this.getServiceRate()
      ]);
      
      // 预生成续租订单信息
      this.prepareRenewalOrder();
      
      // 处理订单链数据
      this.processOrderChainData();
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('页面初始化失败', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // ==================== 数据获取方法（模拟数据优先）====================
  
  // 获取原订单信息
  async getOriginalOrderInfo(orderId) {
    // 暂时不使用API，直接使用模拟数据
    console.log('暂时不使用API，使用模拟数据');
    this.useDefaultOrderData(orderId);
    
    /* 预留API调用代码，后续可启用
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      const orderData = await DataManager.getOrderDataSmart(
        orderId, 
        this.fetchOrderFromAPI.bind(this),
        false
      );

      // 扩展订单信息，包含订单链
      this.setData({
        originalOrderInfo: {
          id: orderData.orderId,
          orderId: orderData.orderId,
          storeName: orderData.storeName,
          managerName: orderData.managerName,
          managerPhone: orderData.managerPhone,
          carModel: orderData.carModel,
          carNumber: orderData.carNumber || '京A12345',
          carImage: orderData.carImage || '../../assets/rsg.png',
          pickupStore: orderData.pickupStore || orderData.storeName,
          returnStore: orderData.returnStore || orderData.storeName,
          originalStartTime: orderData.originalStartTime,
          originalEndTime: orderData.originalEndTime,
          originalDays: orderData.originalDays,
          orderStatus: 2, // 能续租的订单必须是已完成状态
          statusText: '已完成',
          vehicleRecordId: orderData.vehicleRecordId || `VR_${orderId}`,
          
          // 订单链信息
          hasOrderChain: orderData.hasOrderChain || false,
          orderChainDetails: orderData.orderChainDetails || [],
          totalRentalDays: orderData.totalRentalDays || orderData.originalDays,
          renewalCount: orderData.renewalCount || 0,
          hasPayment: orderData.hasPayment || false
        },
        originalStartTimeText: this.formatDateTime(new Date(orderData.originalStartTime)),
        originalEndTimeText: this.formatDateTime(new Date(orderData.originalEndTime)),
        renewPrice: orderData.renewPrice || 800,
        memberRenewPrice: orderData.memberRenewPrice || 640,
        showOrderChain: orderData.hasOrderChain || false
      });
      
    } catch (error) {
      console.error('获取订单信息失败', error);
      this.useDefaultOrderData(orderId);
    }
    */
  },

  // 检查用户会员状态
  async checkUserMembership() {
    // 暂时不使用API，直接使用模拟数据
    console.log('暂时不使用API，使用模拟会员数据');
    const mockIsMember = Math.random() > 0.7;
    this.setData({
      isMember: mockIsMember,
      showMemberCard: !mockIsMember,
      membershipInfo: {
        price: 299,
        discount: 0.8,
        discountText: '8折'
      }
    });
    
    /* 预留API调用代码，后续可启用
    try {
      const response = await this.requestAPI({
        url: '/api/user/membership',
        method: 'GET'
      });

      if (response.success) {
        const isMember = response.data.isMember;
        this.setData({
          isMember,
          showMemberCard: !isMember,
          membershipInfo: response.data.membershipInfo || this.data.membershipInfo
        });
      } else {
        throw new Error(response.message || '获取会员信息失败');
      }
    } catch (error) {
      console.error('检查会员状态失败', error);
      const mockIsMember = Math.random() > 0.7;
      this.setData({
        isMember: mockIsMember,
        showMemberCard: !mockIsMember,
        membershipInfo: {
          price: 299,
          discount: 0.8,
          discountText: '8折'
        }
      });
    }
    */
  },

  // 获取系统服务费率
  async getServiceRate() {
    // 暂时不使用API，直接使用模拟数据
    console.log('暂时不使用API，使用模拟服务费率数据');
    this.setData({
      serviceRate: 0.006,
      serviceRatePercent: '0.6'
    });
    
    /* 预留API调用代码，后续可启用
    try {
      const response = await this.requestAPI({
        url: '/api/system/service-rate',
        method: 'GET'
      });

      if (response.success) {
        const rate = response.data.serviceRate || 0.006;
        this.setData({
          serviceRate: rate,
          serviceRatePercent: (rate * 100).toFixed(1)
        });
      } else {
        throw new Error(response.message || '获取服务费率失败');
      }
    } catch (error) {
      console.error('获取服务费率失败', error);
      this.setData({
        serviceRate: 0.006,
        serviceRatePercent: '0.6'
      });
    }
    */
  },

  // ==================== 模拟数据生成方法 ====================
  
  // 使用默认订单数据 - 包含订单链模拟数据
  useDefaultOrderData(orderId) {
    const currentTime = Date.now();
    const startTime = currentTime - 7 * 24 * 60 * 60 * 1000; // 7天前开始
    let endTime = currentTime - 2 * 24 * 60 * 60 * 1000; // 2天前结束
    
    // 模拟已有续租的复杂订单链
    const hasExistingRenewals = Math.random() > 0.5;
    let orderChainDetails = [];
    let renewalCount = 0;
    let totalDays = 3;
    
    if (hasExistingRenewals) {
      renewalCount = Math.floor(Math.random() * 2) + 1; // 1-2次续租
      
      // 原订单
      orderChainDetails.push({
        orderId: orderId,
        orderType: "原订单",
        orderStatus: "已完成",
        price: 720,
        rentalDays: 3,
        startTime: this.formatDateTime(new Date(startTime)),
        endTime: this.formatDateTime(new Date(startTime + 3 * 24 * 60 * 60 * 1000)),
        isOvertime: false,
        overtimeHours: 0,
        createTime: this.formatCreateTime(new Date(startTime - 24 * 60 * 60 * 1000))
      });
      
      // 续租订单
      let currentEndTime = startTime + 3 * 24 * 60 * 60 * 1000;
      for (let i = 1; i <= renewalCount; i++) {
        const renewalDays = Math.floor(Math.random() * 3) + 2; // 2-4天
        const renewalEndTime = currentEndTime + renewalDays * 24 * 60 * 60 * 1000;
        
        orderChainDetails.push({
          orderId: `${orderId}_RENEWAL_${i}`,
          orderType: `第${i}次续租`,
          orderStatus: "已完成",
          price: renewalDays * 240,
          rentalDays: renewalDays,
          startTime: this.formatDateTime(new Date(currentEndTime)),
          endTime: this.formatDateTime(new Date(renewalEndTime)),
          isOvertime: false,
          overtimeHours: 0,
          createTime: this.formatCreateTime(new Date(currentEndTime - 2 * 60 * 60 * 1000))
        });
        
        totalDays += renewalDays;
        currentEndTime = renewalEndTime;
      }
      
      // 更新结束时间为最后一次续租的结束时间
      endTime = currentEndTime;
    } else {
      // 简单订单，只有原订单
      orderChainDetails.push({
        orderId: orderId,
        orderType: "原订单",
        orderStatus: "已完成",
        price: 720,
        rentalDays: 3,
        startTime: this.formatDateTime(new Date(startTime)),
        endTime: this.formatDateTime(new Date(endTime)),
        isOvertime: false,
        overtimeHours: 0,
        createTime: this.formatCreateTime(new Date(startTime - 24 * 60 * 60 * 1000))
      });
    }
    
    const mockData = {
      orderId: orderId || 'COMPLETED_001',
      storeName: '重庆渝北区分店',
      managerName: '张经理',
      managerPhone: '138****8888',
      carModel: '现代挖掘机R225LC-9T',
      carNumber: '京A12345',
      carImage: '../../assets/rsg.png',
      pickupStore: '重庆渝北区分店',
      returnStore: '重庆渝北区分店',
      originalStartTime: startTime,
      originalEndTime: endTime,
      originalDays: totalDays,
      renewPrice: 800,
      memberRenewPrice: 640,
      status: 'completed',
      vehicleRecordId: `VR_${orderId}`,
      
      // 订单链信息
      hasOrderChain: hasExistingRenewals,
      orderChainDetails: orderChainDetails,
      totalRentalDays: totalDays,
      renewalCount: renewalCount,
      hasPayment: false
    };
    
    this.setData({
      originalOrderInfo: {
        id: mockData.orderId,
        orderId: mockData.orderId,
        storeName: mockData.storeName,
        managerName: mockData.managerName,
        managerPhone: mockData.managerPhone,
        carModel: mockData.carModel,
        carNumber: mockData.carNumber,
        carImage: mockData.carImage,
        pickupStore: mockData.pickupStore,
        returnStore: mockData.returnStore,
        originalStartTime: mockData.originalStartTime,
        originalEndTime: mockData.originalEndTime,
        originalDays: mockData.originalDays,
        orderStatus: 2,
        statusText: '已完成',
        vehicleRecordId: mockData.vehicleRecordId,
        hasOrderChain: mockData.hasOrderChain,
        orderChainDetails: mockData.orderChainDetails,
        totalRentalDays: mockData.totalRentalDays,
        renewalCount: mockData.renewalCount,
        hasPayment: mockData.hasPayment
      },
      originalStartTimeText: this.formatDateTime(new Date(mockData.originalStartTime)),
      originalEndTimeText: this.formatDateTime(new Date(mockData.originalEndTime)),
      renewPrice: mockData.renewPrice,
      memberRenewPrice: mockData.memberRenewPrice,
      showOrderChain: mockData.hasOrderChain
    });

    console.log('使用模拟订单数据:', mockData.orderId);
    
    /* 预留 DataManager 缓存代码，后续可启用
    const DataManager = require('../../utils/data-manager.js');
    DataManager.cacheOrderData(mockData.orderId, mockData);
    */
  },

  // ==================== 订单链数据处理方法 ====================
  
  // 预生成续租订单
  prepareRenewalOrder() {
    const originalOrderId = this.data.originalOrderInfo.orderId;
    const renewalCount = this.data.originalOrderInfo.renewalCount;
    
    // 生成新的续租订单ID
    const newRenewalOrderId = `${originalOrderId}_RENEWAL_${renewalCount + 1}_${Date.now()}`;
    
    this.setData({
      'renewalOrderInfo.orderId': newRenewalOrderId,
      'renewalOrderInfo.renewalLevel': renewalCount + 1
    });

    console.log('预生成续租订单:', newRenewalOrderId);
  },

  // 处理订单链数据 - 按照 order.js 的模式
  processOrderChainData() {
    const originalOrderInfo = this.data.originalOrderInfo;
    
    if (!originalOrderInfo.hasOrderChain || !originalOrderInfo.orderChainDetails) {
      return;
    }
    
    // 处理订单链详情
    const processedChainDetails = originalOrderInfo.orderChainDetails.map(chainItem => {
      const processed = { ...chainItem };
      
      // 预计算订单类型样式
      processed.typeClassName = chainItem.orderType === '原订单' ? 'original' : 'renewal';
      
      // 预计算状态样式
      processed.statusClassName = this.getChainItemStatusClass(chainItem.orderStatus);
      
      // 预计算是否显示超时信息
      processed.showOvertimeInfo = chainItem.isOvertime || false;
      
      // 预计算是否显示补缴提示
      processed.showPaymentNotice = chainItem.orderStatus && 
        chainItem.orderStatus.indexOf('补缴') > -1;
      
      // 格式化数据
      processed.formattedPrice = `¥${chainItem.price}`;
      processed.formattedOvertimeFee = chainItem.overtimeFee ? `¥${chainItem.overtimeFee}` : '';
      
      // 格式化生效时间 - 精确到日期和小时
      processed.formattedEffectiveTime = `${chainItem.startTime} - ${chainItem.endTime}`;
      
      // 格式化创建时间 - 精确到年月日时分秒
      processed.formattedCreateTime = chainItem.createTime;
      
      return processed;
    });
    
    // 生成链摘要
    const chainSummary = {
      totalOrders: originalOrderInfo.orderChainDetails.length,
      renewalCount: originalOrderInfo.renewalCount,
      hasPayment: originalOrderInfo.hasPayment,
      badges: this.getChainBadges(originalOrderInfo)
    };
    
    this.setData({
      processedChainDetails,
      chainSummary
    });
  },

  // 获取订单链子项状态样式
  getChainItemStatusClass(status) {
    if (!status) return 'status-unknown';
    
    if (status.includes('已完成')) return 'status-completed';
    if (status.includes('租赁中')) return 'status-renting';
    if (status.includes('待生效') || status.includes('未生效')) return 'status-pending';
    if (status.includes('待支付') || status.includes('补缴') || status.includes('待补缴')) return 'status-payment';
    if (status.includes('还车审核中')) return 'status-waiting';
    
    return 'status-unknown';
  },

  // 获取订单链标签
  getChainBadges(order) {
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

  // ==================== 交互事件处理方法 ====================
  
  // 切换订单链折叠状态
  toggleOrderChain() {
    this.setData({
      isChainExpanded: !this.data.isChainExpanded
    });
  },

  // 续租天数输入
  onRenewDaysChange(e) {
    const value = e.detail.value.trim();
    this.setData({
      renewDays: value,
      daysErrorTip: ''
    });
    
    if (value) {
      this.calculateRenewal(parseInt(value));
    } else {
      this.clearCalculation();
    }
  },

  // 续租天数输入失焦验证
  onRenewDaysBlur(e) {
    const value = e.detail.value.trim();
    if (!value) {
      this.clearCalculation();
      return;
    }

    const days = parseInt(value);
    if (isNaN(days) || days < 1) {
      this.setData({
        daysErrorTip: '续租天数最少为1天',
        canPay: false,
        paymentButtonText: '请输入正确的续租天数'
      });
      this.clearCalculation();
      return;
    }

    if (days > 365) {
      this.setData({
        daysErrorTip: '续租天数不能超过365天',
        canPay: false,
        paymentButtonText: '请输入正确的续租天数'
      });
      this.clearCalculation();
      return;
    }

    this.setData({
      renewDays: days.toString(),
      daysErrorTip: ''
    });
    
    this.calculateRenewal(days);
  },

  // 购买会员选择切换
  onPurchaseMembershipChange(e) {
    const selected = e.detail.value.length > 0;
    this.setData({
      purchaseMembership: selected
    });
    
    if (this.data.renewDays) {
      this.calculateRenewal(parseInt(this.data.renewDays));
    }
  },

  // 拨打电话
  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '1'),
      fail: (err) => {
        console.error('拨打电话失败', err);
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

  // ==================== 计算方法 ====================
  
  // 计算续租信息
  calculateRenewal(days) {
    if (!days || days < 1) {
      this.clearCalculation();
      return;
    }

    // 计算新的租期 - 从原订单结束时间开始
    const originalEndDate = new Date(this.data.originalOrderInfo.originalEndTime);
    const newEndDate = new Date(originalEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    const newStartTime = this.data.originalEndTimeText; // 从原订单结束时间开始
    const newEndTime = this.formatDateTime(newEndDate);
    const totalDays = this.data.originalOrderInfo.originalDays + days;

    // 计算价格
    this.calculatePricing(days);

    this.setData({
      showNewPeriod: true,
      showPaymentDetail: true,
      newStartTime,
      newEndTime,
      totalDays,
      canPay: true,
      paymentButtonText: `创建续租订单并支付 ¥${this.data.totalAmount}`
    });
  },

  // 计算价格明细
  calculatePricing(days) {
    const { isMember, purchaseMembership, renewPrice, memberRenewPrice, serviceRate, membershipInfo } = this.data;
    
    let currentRenewPrice = renewPrice;
    let renewSubtotal = 0;
    
    if (isMember || purchaseMembership) {
      currentRenewPrice = memberRenewPrice;
      renewSubtotal = days * memberRenewPrice;
    } else {
      renewSubtotal = days * renewPrice;
    }

    let membershipFee = 0;
    if (purchaseMembership && !isMember) {
      membershipFee = membershipInfo.price;
    }

    const serviceSubtotal = renewSubtotal + membershipFee;
    const serviceFee = serviceSubtotal * serviceRate;
    const totalAmount = serviceSubtotal + serviceFee;

    this.setData({
      renewSubtotal: renewSubtotal.toFixed(2),
      membershipFee: membershipFee.toFixed(2),
      serviceSubtotal: serviceSubtotal.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      currentRenewPrice: currentRenewPrice
    });
  },

  // 清除计算结果
  clearCalculation() {
    this.setData({
      showNewPeriod: false,
      showPaymentDetail: false,
      newStartTime: '',
      newEndTime: '',
      totalDays: 0,
      renewSubtotal: '0.00',
      membershipFee: '0.00',
      serviceSubtotal: '0.00',
      serviceFee: '0.00',
      totalAmount: '0.00',
      canPay: false,
      paymentButtonText: '请先输入续租天数'
    });
  },

  // ==================== 支付相关方法 ====================
  
  // 提交支付
  submitPayment() {
    if (!this.data.canPay) {
      wx.showToast({
        title: '请先输入续租天数',
        icon: 'none'
      });
      return;
    }

    this.setData({
      showPaymentModal: true
    });
  },

  // 隐藏支付弹窗
  hidePaymentModal() {
    this.setData({
      showPaymentModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止事件冒泡
  },

  // 确认支付
  confirmPayment() {
    wx.showLoading({
      title: '创建续租订单中...'
    });

    // 模拟创建续租订单过程
    setTimeout(() => {
      this.createRenewalOrderAndPay();
    }, 1500);
  },

  // 创建续租订单并支付
  async createRenewalOrderAndPay() {
    try {
      // 1. 先创建续租订单
      const renewalOrderData = await this.createRenewalOrder();
      
      wx.showLoading({
        title: '支付中...'
      });

      // 2. 再进行支付
      const paymentResult = await this.processPayment(renewalOrderData);
      
      if (paymentResult.success) {
        wx.hideLoading();
        this.handlePaymentSuccess(renewalOrderData);
      } else {
        throw new Error(paymentResult.message || '支付失败');
      }
    } catch (error) {
      wx.hideLoading();
      console.error('创建续租订单或支付失败:', error);
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  // 创建续租订单
  async createRenewalOrder() {
    // 暂时不使用API，直接使用模拟逻辑
    console.log('暂时不使用API，使用模拟创建续租订单');
    
    const originalOrderInfo = this.data.originalOrderInfo;
    const renewalOrderInfo = this.data.renewalOrderInfo;
    
    // 构建续租订单数据
    const renewalOrderData = {
      id: renewalOrderInfo.orderId,
      parentOrderId: originalOrderInfo.orderId,
      isRenewalOrder: true,
      renewalLevel: renewalOrderInfo.renewalLevel,
      
      // 基本信息
      carModel: originalOrderInfo.carModel,
      carNumber: originalOrderInfo.carNumber,
      carImage: originalOrderInfo.carImage,
      storeName: originalOrderInfo.storeName,
      pickupStore: originalOrderInfo.pickupStore,
      returnStore: originalOrderInfo.returnStore,
      managerName: originalOrderInfo.managerName,
      managerPhone: originalOrderInfo.managerPhone,
      vehicleRecordId: originalOrderInfo.vehicleRecordId, // 共享同一个出车记录
      
      // 时间信息
      startTime: originalOrderInfo.originalEndTime, // 从原订单结束时间开始
      endTime: new Date(originalOrderInfo.originalEndTime + parseInt(this.data.renewDays) * 24 * 60 * 60 * 1000).getTime(),
      rentalDays: parseInt(this.data.renewDays),
      
      // 状态信息
      orderStatus: 1, // 租赁中状态
      subStatus: 6, // 待生效状态
      statusText: '待生效',
      
      // 价格信息
      renewPrice: this.data.renewPrice,
      memberRenewPrice: this.data.memberRenewPrice,
      price: parseFloat(this.data.totalAmount),
      renewSubtotal: parseFloat(this.data.renewSubtotal),
      membershipFee: parseFloat(this.data.membershipFee),
      serviceFee: parseFloat(this.data.serviceFee),
      currentRenewPrice: this.data.currentRenewPrice,
      
      // 会员信息
      purchaseMembership: this.data.purchaseMembership,
      
      // 订单链相关 - 这是一个续租订单，需要关联到原订单链
      hasOrderChain: false, // 续租订单本身不显示订单链
      isMainDisplay: false, // 不是主显示订单
      
      // 创建时间
      createTime: Date.now(),
      
      // 格式化时间显示
      pickupTime: this.data.originalEndTimeText,
      returnTime: this.data.newEndTime
    };

    // 模拟缓存数据
    console.log('模拟缓存续租订单数据:', renewalOrderData.id);
    return renewalOrderData;
    
    /* 预留API调用代码，后续可启用
    try {
      // 调用API创建续租订单
      const response = await this.requestAPI({
        url: '/api/order/create-renewal',
        method: 'POST',
        data: renewalOrderData
      });

      if (response.success) {
        // 缓存新订单数据
        const DataManager = require('../../utils/data-manager.js');
        DataManager.cacheOrderData(renewalOrderData.id, renewalOrderData);
        
        console.log('续租订单创建成功:', renewalOrderData.id);
        return renewalOrderData;
      } else {
        throw new Error(response.message || '创建续租订单失败');
      }
    } catch (error) {
      // 使用模拟逻辑
      console.log('使用模拟创建续租订单');
      
      // 缓存模拟数据
      const DataManager = require('../../utils/data-manager.js');
      DataManager.cacheOrderData(renewalOrderData.id, renewalOrderData);
      
      return renewalOrderData;
    }
    */
  },

  // 处理支付
  async processPayment(renewalOrderData) {
    // 暂时不使用API，直接使用模拟逻辑
    console.log('暂时不使用API，使用模拟支付逻辑');
    
    // 模拟支付结果，90%成功率
    const paymentSuccess = Math.random() > 0.1;
    
    if (paymentSuccess) {
      return { 
        success: true, 
        data: { 
          paymentId: `PAY_${Date.now()}`,
          payTime: Date.now()
        } 
      };
    } else {
      return { 
        success: false, 
        message: '支付失败，请重试' 
      };
    }
    
    /* 预留API调用代码，后续可启用
    try {
      const paymentData = {
        orderId: renewalOrderData.id,
        parentOrderId: renewalOrderData.parentOrderId,
        amount: renewalOrderData.price,
        renewDays: renewalOrderData.rentalDays,
        renewSubtotal: renewalOrderData.renewSubtotal,
        membershipFee: renewalOrderData.membershipFee,
        serviceFee: renewalOrderData.serviceFee,
        purchaseMembership: renewalOrderData.purchaseMembership
      };

      const response = await this.requestAPI({
        url: '/api/payment/process-renewal',
        method: 'POST',
        data: paymentData
      });

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || '支付失败');
      }
    } catch (error) {
      // 模拟支付结果
      const paymentSuccess = Math.random() > 0.1; // 90%成功率
      
      if (paymentSuccess) {
        return { 
          success: true, 
          data: { 
            paymentId: `PAY_${Date.now()}`,
            payTime: Date.now()
          } 
        };
      } else {
        return { 
          success: false, 
          message: '支付失败，请重试' 
        };
      }
    }
    */
  },

  // 处理支付成功
  handlePaymentSuccess(renewalOrderData) {
    // 暂时不使用 DataManager，直接使用模拟逻辑
    console.log('暂时不使用 DataManager，使用模拟数据更新逻辑');
    
    // 模拟更新续租订单状态为待生效
    const updatedRenewalOrder = {
      ...renewalOrderData,
      orderStatus: 1, // 租赁中状态
      subStatus: 6, // 待生效
      statusText: '待生效',
      paymentTime: Date.now(),
      paymentStatus: 'paid'
    };
    
    console.log('模拟缓存续租订单数据:', updatedRenewalOrder.id);

    // 模拟更新原订单信息，添加新的续租订单到链中
    const originalOrderInfo = this.data.originalOrderInfo;
    const newChainItem = {
      orderId: renewalOrderData.id,
      orderType: `第${renewalOrderData.renewalLevel}次续租`,
      orderStatus: "待生效",
      price: parseFloat(this.data.renewSubtotal),
      rentalDays: parseInt(this.data.renewDays),
      startTime: this.data.originalEndTimeText,
      endTime: this.data.newEndTime,
      isOvertime: false,
      overtimeHours: 0,
      createTime: this.formatCreateTime(new Date())
    };
    
    // 模拟更新原订单信息
    const updatedOriginalOrder = {
      ...originalOrderInfo,
      hasOrderChain: true, // 确保显示订单链
      hasRenewal: true,
      latestRenewalOrderId: renewalOrderData.id,
      renewalCount: renewalOrderData.renewalLevel,
      totalRentalDays: originalOrderInfo.totalRentalDays + parseInt(this.data.renewDays),
      // 将新续租订单添加到订单链详情中
      orderChainDetails: [...(originalOrderInfo.orderChainDetails || []), newChainItem]
    };
    
    console.log('模拟更新原订单数据:', updatedOriginalOrder.orderId);

    /* 预留 DataManager 代码，后续可启用
    // 更新订单数据
    const DataManager = require('../../utils/data-manager.js');
    
    DataManager.updateOrderData(renewalOrderData.id, updatedRenewalOrder);
    DataManager.updateOrderData(originalOrderInfo.orderId, updatedOriginalOrder);
    */

    wx.showToast({
      title: '续租订单创建成功',
      icon: 'success',
      duration: 2000
    });

    setTimeout(() => {
      // 准备传递给成功页面的数据
      const successData = {
        originalOrderId: this.data.originalOrderInfo.orderId,
        renewalOrderId: renewalOrderData.id,
        renewDays: this.data.renewDays,
        totalAmount: this.data.totalAmount,
        newStartTime: this.data.newStartTime,
        newEndTime: this.data.newEndTime,
        purchaseMembership: this.data.purchaseMembership,
        orderType: 'renewal', // 标识为续租订单
        
        // 续租订单特有信息
        renewalInfo: {
          parentOrderId: this.data.originalOrderInfo.orderId,
          renewalLevel: renewalOrderData.renewalLevel,
          vehicleRecordId: renewalOrderData.vehicleRecordId,
          status: '待生效',
          effectiveCondition: '原订单结束后自动生效'
        },
        
        // 详细的支付信息
        paymentDetails: {
          renewAmount: this.data.renewSubtotal,
          membershipAmount: this.data.membershipFee,
          serviceFee: this.data.serviceFee,
          totalAmount: this.data.totalAmount,
          payTime: Date.now()
        },
        
        // 完整的订单信息
        orderInfo: {
          carModel: this.data.originalOrderInfo.carModel,
          carNumber: this.data.originalOrderInfo.carNumber,
          managerName: this.data.originalOrderInfo.managerName,
          managerPhone: this.data.originalOrderInfo.managerPhone,
          storeName: this.data.originalOrderInfo.storeName,
          vehicleRecordId: this.data.originalOrderInfo.vehicleRecordId
        }
      };

      // 构建URL参数 - 将主要信息通过URL传递
      const urlParams = [
        `originalOrderId=${encodeURIComponent(successData.originalOrderId)}`,
        `renewalOrderId=${encodeURIComponent(successData.renewalOrderId)}`,
        `renewDays=${successData.renewDays}`,
        `totalAmount=${successData.totalAmount}`,
        `renewalLevel=${successData.renewalInfo.renewalLevel}`,
        `carModel=${encodeURIComponent(successData.orderInfo.carModel)}`,
        `storeName=${encodeURIComponent(successData.orderInfo.storeName)}`,
        `newStartTime=${encodeURIComponent(successData.newStartTime)}`,
        `newEndTime=${encodeURIComponent(successData.newEndTime)}`,
        `vehicleRecordId=${encodeURIComponent(successData.orderInfo.vehicleRecordId)}`,
        `purchaseMembership=${successData.purchaseMembership ? 1 : 0}`
      ].join('&');

      // 跳转到续租成功页面
      wx.redirectTo({
        url: `/pages/renewal-success/renewal-success?${urlParams}`
      });
      
      console.log('跳转到续租成功页面，参数:', urlParams);
      
      /* 预留 NavigationUtils 代码，后续可启用
      const NavigationUtils = require('../../utils/navigation-utils.js');
      
      // 设置全局数据
      DataManager.setGlobalOrderData(successData);
      
      // 跳转到续租成功页面
      NavigationUtils.toRenewalSuccessPage(successData);
      */
    }, 2000);
  },

  // ==================== 工具方法 ====================
  
  // 格式化日期时间
  formatDateTime(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 格式化创建时间 - 年月日时分秒
  formatCreateTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  },

  // ==================== 预留API方法（暂时不使用）====================
  
  // 从API获取订单数据
  async fetchOrderFromAPI(orderId) {
    /* 预留API调用代码，后续可启用
    try {
      const response = await this.requestAPI({
        url: '/api/order/detail-with-chain',
        method: 'GET',
        data: { orderId }
      });

      if (!response.success) {
        throw new Error(response.message || '获取订单信息失败');
      }

      return {
        orderId: response.data.orderId,
        storeName: response.data.storeName,
        managerName: response.data.managerName,
        managerPhone: response.data.managerPhone,
        carModel: response.data.carModel,
        carNumber: response.data.carNumber,
        carImage: response.data.carImage,
        pickupStore: response.data.pickupStore,
        returnStore: response.data.returnStore,
        originalStartTime: response.data.originalStartTime,
        originalEndTime: response.data.originalEndTime,
        originalDays: response.data.originalDays,
        renewPrice: response.data.renewPrice,
        memberRenewPrice: response.data.memberRenewPrice,
        status: response.data.status,
        vehicleRecordId: response.data.vehicleRecordId,
        
        // 订单链信息
        hasOrderChain: response.data.hasOrderChain,
        orderChainDetails: response.data.orderChainDetails,
        totalRentalDays: response.data.totalRentalDays,
        renewalCount: response.data.renewalCount,
        hasPayment: response.data.hasPayment
      };
    } catch (error) {
      throw error;
    }
    */
    
    // 暂时返回空，使用模拟数据
    return null;
  },

  // API请求封装
  requestAPI(options) {
    /* 预留API调用代码，后续可启用
    return new Promise((resolve, reject) => {
      wx.request({
        url: getApp().globalData.apiBaseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': getApp().globalData.token || ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
    */
    
    // 暂时返回空Promise，使用模拟数据
    return Promise.resolve(null);
  }
});