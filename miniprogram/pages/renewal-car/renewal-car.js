Page({
  data: {
    // 订单信息
    orderInfo: {
      orderId: '',
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      originalStartTime: 0, // 时间戳
      originalEndTime: 0, // 时间戳
      originalDays: 0
    },
    
    // 续租相关
    renewDays: '',
    renewPrice: 0, // 续租单价（非会员价格）
    memberRenewPrice: 0, // 会员续租单价
    daysErrorTip: '',
    
    // 系统服务费率
    serviceRate: 0.006, // 默认0.6%，从后台获取
    serviceRatePercent: '0.6', // 用于页面显示的百分比文本
    
    // 会员相关
    isMember: false, // 用户是否是会员
    showMemberCard: false, // 是否显示购买会员卡片
    membershipInfo: {
      price: 299, // 会员价格
      discount: 0.8, // 会员折扣（8折）
      discountText: '8折'
    },
    purchaseMembership: false, // 是否购买会员
    
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
    renewSubtotal: '0.00', // 续租小计
    membershipFee: '0.00', // 会员费用
    serviceSubtotal: '0.00', // 服务前小计
    serviceFee: '0.00', // 系统服务费
    totalAmount: '0.00', // 最终总价
    
    // 支付相关
    canPay: false,
    paymentButtonText: '请先输入续租天数',
    showPaymentModal: false
  },

  onLoad(options) {
    // 页面加载时初始化
    console.log('续租页面加载', options);
    this.initPage(options);
  },

  // 初始化页面
  async initPage(options) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 并行获取基础数据
      await Promise.all([
        this.getOrderInfo(options.orderId),
        this.checkUserMembership(),
        this.getServiceRate()
      ]);
      
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

  // 获取订单信息
  async getOrderInfo(orderId) {
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      // 使用智能数据获取（优先使用缓存）
      const orderData = await DataManager.getOrderDataSmart(
        orderId, 
        this.fetchOrderFromAPI.bind(this),
        false // 不强制刷新
      );

      // 设置页面数据
      this.setData({
        orderInfo: {
          orderId: orderData.orderId,
          storeName: orderData.storeName,
          managerName: orderData.managerName,
          managerPhone: orderData.managerPhone,
          carModel: orderData.carModel,
          originalStartTime: orderData.originalStartTime,
          originalEndTime: orderData.originalEndTime,
          originalDays: orderData.originalDays
        },
        originalStartTimeText: this.formatDateTime(new Date(orderData.originalStartTime)),
        originalEndTimeText: this.formatDateTime(new Date(orderData.originalEndTime)),
        renewPrice: orderData.renewPrice || 800,
        memberRenewPrice: orderData.memberRenewPrice || 640
      });
      
    } catch (error) {
      console.error('获取订单信息失败', error);
      // 使用模拟数据作为备用
      this.useDefaultOrderData(orderId);
    }
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
        memberRenewPrice: response.data.memberRenewPrice
      };
    } catch (error) {
      // API调用失败，抛出错误让上层处理
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
      memberRenewPrice: 640
    };
    
    this.setData({
      orderInfo: {
        orderId: mockData.orderId,
        storeName: mockData.storeName,
        managerName: mockData.managerName,
        managerPhone: mockData.managerPhone,
        carModel: mockData.carModel,
        originalStartTime: mockData.originalStartTime,
        originalEndTime: mockData.originalEndTime,
        originalDays: mockData.originalDays
      },
      originalStartTimeText: this.formatDateTime(new Date(mockData.originalStartTime)),
      originalEndTimeText: this.formatDateTime(new Date(mockData.originalEndTime)),
      renewPrice: mockData.renewPrice,
      memberRenewPrice: mockData.memberRenewPrice
    });

    // 缓存模拟数据
    const DataManager = require('../../utils/data-manager.js');
    DataManager.cacheOrderData(mockData.orderId, mockData);
  },
  async initPage(options) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 并行获取基础数据
      await Promise.all([
        this.getOrderInfo(options.orderId),
        this.checkUserMembership(),
        this.getServiceRate()
      ]);
      
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

  // 获取订单信息
  async getOrderInfo(orderId) {
    // 引入数据管理工具
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      // 使用智能数据获取（优先使用缓存）
      const orderData = await DataManager.getOrderDataSmart(
        orderId, 
        this.fetchOrderFromAPI.bind(this),
        false // 不强制刷新
      );

      // 设置页面数据
      this.setData({
        orderInfo: {
          orderId: orderData.orderId,
          storeName: orderData.storeName,
          managerName: orderData.managerName,
          managerPhone: orderData.managerPhone,
          carModel: orderData.carModel,
          originalStartTime: orderData.originalStartTime,
          originalEndTime: orderData.originalEndTime,
          originalDays: orderData.originalDays
        },
        originalStartTimeText: this.formatDateTime(new Date(orderData.originalStartTime)),
        originalEndTimeText: this.formatDateTime(new Date(orderData.originalEndTime)),
        renewPrice: orderData.renewPrice,
        memberRenewPrice: orderData.memberRenewPrice
      });
      
    } catch (error) {
      console.error('获取订单信息失败', error);
      // 使用模拟数据作为备用
      this.useDefaultOrderData(orderId);
    }
  },

  // 从API获取订单数据
  async fetchOrderFromAPI(orderId) {
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
      memberRenewPrice: response.data.memberRenewPrice
    };
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
      memberRenewPrice: 640
    };
    
    this.setData({
      orderInfo: {
        orderId: mockData.orderId,
        storeName: mockData.storeName,
        managerName: mockData.managerName,
        managerPhone: mockData.managerPhone,
        carModel: mockData.carModel,
        originalStartTime: mockData.originalStartTime,
        originalEndTime: mockData.originalEndTime,
        originalDays: mockData.originalDays
      },
      originalStartTimeText: this.formatDateTime(new Date(mockData.originalStartTime)),
      originalEndTimeText: this.formatDateTime(new Date(mockData.originalEndTime)),
      renewPrice: mockData.renewPrice,
      memberRenewPrice: mockData.memberRenewPrice
    });

    // 缓存模拟数据
    const DataManager = require('../../utils/data-manager.js');
    DataManager.cacheOrderData(mockData.orderId, mockData);
  },

  // 检查用户会员状态
  async checkUserMembership() {
    try {
      // 实际API调用
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
      // 使用模拟数据
      const mockIsMember = Math.random() > 0.7; // 30%概率是会员
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
      // 实际API调用
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
      // 使用默认值0.6%
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
    // checkbox-group返回的是数组，如果选中则包含值，未选中则为空数组
    const selected = e.detail.value.length > 0;
    this.setData({
      purchaseMembership: selected
    });
    
    // 重新计算价格
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

    // 计算新的租期 - 从时间戳计算
    const originalEndDate = new Date(this.data.orderInfo.originalEndTime);
    const newEndDate = new Date(originalEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    const newStartTime = this.data.originalEndTimeText;
    const newEndTime = this.formatDateTime(newEndDate);
    const totalDays = this.data.orderInfo.originalDays + days;

    // 计算价格
    this.calculatePricing(days);

    this.setData({
      showNewPeriod: true,
      showPaymentDetail: true,
      newStartTime,
      newEndTime,
      totalDays,
      canPay: true,
      paymentButtonText: `立即支付 ¥${this.data.totalAmount}`
    });
  },

  // 计算价格明细
  calculatePricing(days) {
    const { isMember, purchaseMembership, renewPrice, memberRenewPrice, serviceRate, membershipInfo } = this.data;
    
    // 1. 计算续租费用
    let currentRenewPrice = renewPrice;
    let renewSubtotal = 0;
    
    if (isMember || purchaseMembership) {
      // 会员价格
      currentRenewPrice = memberRenewPrice;
      renewSubtotal = days * memberRenewPrice;
    } else {
      // 非会员价格
      renewSubtotal = days * renewPrice;
    }

    // 2. 会员费用
    let membershipFee = 0;
    if (purchaseMembership && !isMember) {
      membershipFee = membershipInfo.price;
    }

    // 3. 服务费前小计
    const serviceSubtotal = renewSubtotal + membershipFee;

    // 4. 系统服务费
    const serviceFee = serviceSubtotal * serviceRate;

    // 5. 最终总价
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

  // 格式化日期时间 - 处理时间戳
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
      phoneNumber: phone.replace(/\*/g, '1'), // 实际项目中应该用真实号码
      fail: (err) => {
        console.error('拨打电话失败', err);
        wx.showToast({
          title: '拨打失败',
          icon: 'none'
        });
      }
    });
  },

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
      title: '支付中...'
    });

    // 模拟支付过程
    setTimeout(() => {
      wx.hideLoading();
      this.processPayment();
    }, 2000);
  },

  // 处理支付
  async processPayment() {
    try {
      // 构建支付参数
      const paymentData = {
        orderId: this.data.orderInfo.orderId,
        renewDays: parseInt(this.data.renewDays),
        renewSubtotal: parseFloat(this.data.renewSubtotal),
        membershipFee: parseFloat(this.data.membershipFee),
        serviceFee: parseFloat(this.data.serviceFee),
        totalAmount: parseFloat(this.data.totalAmount),
        purchaseMembership: this.data.purchaseMembership,
        newEndTime: this.data.newEndTime
      };

      // 实际API调用
      const response = await this.requestAPI({
        url: '/api/payment/process',
        method: 'POST',
        data: paymentData
      });

      if (response.success) {
        // 更新订单数据到缓存
        const DataManager = require('../../utils/data-manager.js');
        const updatedOrderData = {
          ...this.data.orderInfo,
          status: 'renewed',
          newEndTime: this.data.newEndTime,
          totalDays: this.data.totalDays,
          lastRenewalTime: Date.now()
        };
        
        DataManager.updateOrderData(this.data.orderInfo.orderId, updatedOrderData);

        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500
        });
        
        // 跳转到续租成功页面，传递完整数据
        setTimeout(() => {
          const NavigationUtils = require('../../utils/navigation-utils.js');
          
          // 准备传递给成功页面的完整数据
          const successData = {
            orderId: this.data.orderInfo.orderId,
            renewDays: this.data.renewDays,
            totalAmount: this.data.totalAmount,
            newEndTime: this.data.newEndTime,
            purchaseMembership: this.data.purchaseMembership,
            // 传递详细的支付信息
            paymentDetails: {
              renewAmount: this.data.renewSubtotal,
              membershipAmount: this.data.membershipFee,
              serviceFee: this.data.serviceFee,
              totalAmount: this.data.totalAmount,
              payTime: Date.now()
            },
            // 传递完整的订单信息
            orderInfo: {
              orderId: this.data.orderInfo.orderId,
              carModel: this.data.orderInfo.carModel,
              managerName: this.data.orderInfo.managerName,
              managerPhone: this.data.orderInfo.managerPhone,
              storeName: this.data.orderInfo.storeName,
              originalStartTime: this.data.orderInfo.originalStartTime,
              originalEndTime: this.data.orderInfo.originalEndTime,
              originalDays: this.data.orderInfo.originalDays
            }
          };

          // 将完整数据设置到全局，避免成功页面重新查询
          DataManager.setGlobalOrderData(successData);
          
          NavigationUtils.toRenewalSuccessPage(successData);
        }, 1500);
      } else {
        throw new Error(response.message || '支付失败');
      }
    } catch (error) {
      console.error('支付处理失败', error);
      
      // 模拟支付结果
      const paymentSuccess = Math.random() > 0.1; // 90%成功率
      
      if (paymentSuccess) {
        // 更新订单数据到缓存
        const DataManager = require('../../utils/data-manager.js');
        const updatedOrderData = {
          ...this.data.orderInfo,
          status: 'renewed',
          newEndTime: this.data.newEndTime,
          totalDays: this.data.totalDays,
          lastRenewalTime: Date.now()
        };
        
        DataManager.updateOrderData(this.data.orderInfo.orderId, updatedOrderData);

        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          const NavigationUtils = require('../../utils/navigation-utils.js');
          
          // 准备传递给成功页面的完整数据
          const successData = {
            orderId: this.data.orderInfo.orderId,
            renewDays: this.data.renewDays,
            totalAmount: this.data.totalAmount,
            newEndTime: this.data.newEndTime,
            purchaseMembership: this.data.purchaseMembership,
            // 传递详细的支付信息
            paymentDetails: {
              renewAmount: this.data.renewSubtotal,
              membershipAmount: this.data.membershipFee,
              serviceFee: this.data.serviceFee,
              totalAmount: this.data.totalAmount,
              payTime: Date.now()
            },
            // 传递完整的订单信息
            orderInfo: {
              orderId: this.data.orderInfo.orderId,
              carModel: this.data.orderInfo.carModel,
              managerName: this.data.orderInfo.managerName,
              managerPhone: this.data.orderInfo.managerPhone,
              storeName: this.data.orderInfo.storeName,
              originalStartTime: this.data.orderInfo.originalStartTime,
              originalEndTime: this.data.orderInfo.originalEndTime,
              originalDays: this.data.orderInfo.originalDays
            }
          };

          // 将完整数据设置到全局，避免成功页面重新查询
          DataManager.setGlobalOrderData(successData);
          
          NavigationUtils.toRenewalSuccessPage(successData);
        }, 1500);
      } else {
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        });
      }
    }
  }
})