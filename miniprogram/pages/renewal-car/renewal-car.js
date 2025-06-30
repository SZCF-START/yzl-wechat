// renewal-car.js - 修改后支持生成新订单的续租页面
Page({
  data: {
    // 原订单信息
    originalOrderInfo: {
      orderId: '',
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      originalStartTime: 0,
      originalEndTime: 0,
      originalDays: 0,
      orderStatus: '',
      vehicleRecordId: '' // 出车记录ID
    },
    
    // 新续租订单信息
    renewalOrderInfo: {
      orderId: '', // 新生成的续租订单ID
      parentOrderId: '', // 指向原订单
      isRenewalOrder: true,
      renewalLevel: 1, // 续租层级
      status: 'pending' // 待生效
    },
    
    // 续租相关
    renewDays: '',
    renewPrice: 0,
    memberRenewPrice: 0,
    daysErrorTip: '',
    
    // 系统服务费率
    serviceRate: 0.006,
    serviceRatePercent: '0.6',
    
    // 会员相关
    isMember: false,
    showMemberCard: false,
    membershipInfo: {
      price: 299,
      discount: 0.8,
      discountText: '8折'
    },
    purchaseMembership: false,
    
    // 格式化后的时间显示
    originalStartTimeText: '',
    originalEndTimeText: '',
    
    // 计算结果
    showNewPeriod: false,
    showPaymentDetail: false,
    newStartTime: '',
    newEndTime: '',
    totalDays: 0,
    
    // 价格明细
    renewSubtotal: '0.00',
    membershipFee: '0.00',
    serviceSubtotal: '0.00',
    serviceFee: '0.00',
    totalAmount: '0.00',
    
    // 支付相关
    canPay: false,
    paymentButtonText: '请先输入续租天数',
    showPaymentModal: false,
    
    // 新增：订单关系展示
    showOrderChain: false,
    orderChainInfo: {
      totalOrders: 1,
      currentLevel: 0,
      chainHistory: []
    }
  },

  onLoad(options) {
    console.log('续租页面加载', options);
    this.initPage(options);
  },

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
        this.getServiceRate(),
        this.getOrderChainInfo(options.orderId)
      ]);
      
      // 预生成续租订单信息
      this.prepareRenewalOrder();
      
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

  // 获取原订单信息
  async getOriginalOrderInfo(orderId) {
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      const orderData = await DataManager.getOrderDataSmart(
        orderId, 
        this.fetchOrderFromAPI.bind(this),
        false
      );

      this.setData({
        originalOrderInfo: {
          orderId: orderData.orderId,
          storeName: orderData.storeName,
          managerName: orderData.managerName,
          managerPhone: orderData.managerPhone,
          carModel: orderData.carModel,
          originalStartTime: orderData.originalStartTime,
          originalEndTime: orderData.originalEndTime,
          originalDays: orderData.originalDays,
          orderStatus: orderData.status,
          vehicleRecordId: orderData.vehicleRecordId || `VR_${orderId}`
        },
        originalStartTimeText: this.formatDateTime(new Date(orderData.originalStartTime)),
        originalEndTimeText: this.formatDateTime(new Date(orderData.originalEndTime)),
        renewPrice: orderData.renewPrice || 800,
        memberRenewPrice: orderData.memberRenewPrice || 640
      });
      
    } catch (error) {
      console.error('获取订单信息失败', error);
      this.useDefaultOrderData(orderId);
    }
  },

  // 获取订单链信息
  async getOrderChainInfo(orderId) {
    try {
      // 查询订单链信息
      const response = await this.requestAPI({
        url: '/api/order/chain-info',
        method: 'GET',
        data: { orderId }
      });

      if (response.success) {
        this.setData({
          showOrderChain: true,
          orderChainInfo: {
            totalOrders: response.data.totalOrders || 1,
            currentLevel: response.data.currentLevel || 0,
            chainHistory: response.data.chainHistory || []
          }
        });
      }
    } catch (error) {
      console.error('获取订单链信息失败', error);
      // 使用模拟数据
      this.setData({
        showOrderChain: true,
        orderChainInfo: {
          totalOrders: Math.floor(Math.random() * 3) + 1,
          currentLevel: Math.floor(Math.random() * 2),
          chainHistory: [
            { level: 0, orderId: orderId, status: '已完成', days: 2 }
          ]
        }
      });
    }
  },

  // 预生成续租订单
  prepareRenewalOrder() {
    const originalOrderId = this.data.originalOrderInfo.orderId;
    const currentLevel = this.data.orderChainInfo.currentLevel;
    
    // 生成新的续租订单ID
    const newRenewalOrderId = `${originalOrderId}_RENEWAL_${Date.now()}`;
    
    this.setData({
      'renewalOrderInfo.orderId': newRenewalOrderId,
      'renewalOrderInfo.renewalLevel': currentLevel + 1
    });

    console.log('预生成续租订单:', newRenewalOrderId);
  },

  // 从API获取订单数据
  async fetchOrderFromAPI(orderId) {
    try {
      const response = await this.requestAPI({
        url: '/api/order/detail',
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
        originalStartTime: response.data.originalStartTime,
        originalEndTime: response.data.originalEndTime,
        originalDays: response.data.originalDays,
        renewPrice: response.data.renewPrice,
        memberRenewPrice: response.data.memberRenewPrice,
        status: response.data.status,
        vehicleRecordId: response.data.vehicleRecordId
      };
    } catch (error) {
      throw error;
    }
  },

  // 使用默认订单数据
  useDefaultOrderData(orderId) {
    const mockData = {
      orderId: orderId || 'mock_order_001',
      storeName: '重庆渝北区分店',
      managerName: '张经理',
      managerPhone: '138****8888',
      carModel: '现代挖掘机R225LC-9T',
      originalStartTime: 1726488000000,
      originalEndTime: 1726660800000,
      originalDays: 2,
      renewPrice: 800,
      memberRenewPrice: 640,
      status: 'completed',
      vehicleRecordId: `VR_${orderId}`
    };
    
    this.setData({
      originalOrderInfo: {
        orderId: mockData.orderId,
        storeName: mockData.storeName,
        managerName: mockData.managerName,
        managerPhone: mockData.managerPhone,
        carModel: mockData.carModel,
        originalStartTime: mockData.originalStartTime,
        originalEndTime: mockData.originalEndTime,
        originalDays: mockData.originalDays,
        orderStatus: mockData.status,
        vehicleRecordId: mockData.vehicleRecordId
      },
      originalStartTimeText: this.formatDateTime(new Date(mockData.originalStartTime)),
      originalEndTimeText: this.formatDateTime(new Date(mockData.originalEndTime)),
      renewPrice: mockData.renewPrice,
      memberRenewPrice: mockData.memberRenewPrice
    });

    const DataManager = require('../../utils/data-manager.js');
    DataManager.cacheOrderData(mockData.orderId, mockData);
  },

  // 检查用户会员状态
  async checkUserMembership() {
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
  },

  // 获取系统服务费率
  async getServiceRate() {
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
  },

  // API请求封装
  requestAPI(options) {
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

  // 格式化日期时间
  formatDateTime(date) {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
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

  // 提交支付 - 修改：先创建续租订单，再支付
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

  // 确认支付 - 修改：创建续租订单并支付
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
      storeName: originalOrderInfo.storeName,
      managerName: originalOrderInfo.managerName,
      managerPhone: originalOrderInfo.managerPhone,
      vehicleRecordId: originalOrderInfo.vehicleRecordId, // 共享同一个出车记录
      
      // 时间信息
      startTime: originalOrderInfo.originalEndTime, // 从原订单结束时间开始
      endTime: new Date(originalOrderInfo.originalEndTime + parseInt(this.data.renewDays) * 24 * 60 * 60 * 1000).getTime(),
      rentalDays: parseInt(this.data.renewDays),
      
      // 状态信息
      orderStatus: 6, // 待生效状态
      statusText: '待生效',
      
      // 价格信息
      renewPrice: this.data.renewPrice,
      memberRenewPrice: this.data.memberRenewPrice,
      price: parseFloat(this.data.totalAmount),
      renewSubtotal: parseFloat(this.data.renewSubtotal),
      membershipFee: parseFloat(this.data.membershipFee),
      serviceFee: parseFloat(this.data.serviceFee),
      
      // 会员信息
      purchaseMembership: this.data.purchaseMembership,
      
      // 创建时间
      createTime: Date.now()
    };

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
  },

  // 处理支付
  async processPayment(renewalOrderData) {
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
  },

  // 处理支付成功
  handlePaymentSuccess(renewalOrderData) {
    // 更新订单数据
    const DataManager = require('../../utils/data-manager.js');
    
    // 更新续租订单状态为待生效
    const updatedRenewalOrder = {
      ...renewalOrderData,
      orderStatus: 6, // 待生效
      statusText: '待生效',
      paymentTime: Date.now(),
      paymentStatus: 'paid'
    };
    
    DataManager.updateOrderData(renewalOrderData.id, updatedRenewalOrder);

    // 更新原订单的关联信息
    const updatedOriginalOrder = {
      ...this.data.originalOrderInfo,
      hasRenewal: true,
      latestRenewalOrderId: renewalOrderData.id,
      renewalCount: (this.data.orderChainInfo.currentLevel + 1)
    };
    
    DataManager.updateOrderData(this.data.originalOrderInfo.orderId, updatedOriginalOrder);

    wx.showToast({
      title: '续租订单创建成功',
      icon: 'success',
      duration: 2000
    });

    setTimeout(() => {
      const NavigationUtils = require('../../utils/navigation-utils.js');
      
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
          managerName: this.data.originalOrderInfo.managerName,
          managerPhone: this.data.originalOrderInfo.managerPhone,
          storeName: this.data.originalOrderInfo.storeName
        }
      };

      // 设置全局数据
      DataManager.setGlobalOrderData(successData);
      
      // 跳转到续租成功页面
      NavigationUtils.toRenewalSuccessPage(successData);
    }, 2000);
  }
});