Page({
  data: {
    // 订单信息
    orderInfo: {
      orderId: '',
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      originalStartTime: '',
      originalEndTime: '',
      originalDays: 0
    },
    
    // 续租相关
    renewDays: '',
    renewPrice: 0, // 续租单价（非会员价格）
    memberRenewPrice: 0, // 会员续租单价
    daysErrorTip: '',
    
    // 系统服务费率
    serviceRate: 0.006, // 默认0.6%，从后台获取
    serviceRateDisplay: '0.6%', // 默认0.6%，从后台获取
    
    // 会员相关
    isMember: false, // 用户是否是会员
    showMemberCard: false, // 是否显示购买会员卡片
    membershipInfo: {
      price: 299, // 会员价格
      discount: 0.8, // 会员折扣（8折）
      discountText: '8折'
    },
    purchaseMembership: false, // 是否购买会员
    
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
    if (!orderId) {
      // 使用模拟数据
      this.setData({
        orderInfo: {
          orderId: 'mock_order_001',
          storeName: '重庆渝北区分店',
          managerName: '张经理',
          managerPhone: '138****8888',
          carModel: '现代挖掘机R225LC-9T',
          originalStartTime: '09月16日 21:00',
          originalEndTime: '09月18日 21:00',
          originalDays: 2
        },
        renewPrice: 800,
        memberRenewPrice: 640 // 8折
      });
      return;
    }

    try {
      // 实际API调用
      const response = await this.requestAPI({
        url: '/api/order/detail',
        method: 'GET',
        data: { orderId }
      });

      if (response.success) {
        this.setData({
          orderInfo: response.data.orderInfo,
          renewPrice: response.data.renewPrice,
          memberRenewPrice: response.data.memberRenewPrice
        });
      } else {
        throw new Error(response.message || '获取订单信息失败');
      }
    } catch (error) {
      console.error('获取订单信息失败', error);
      // 使用模拟数据作为备用
      this.setData({
        orderInfo: {
          orderId: orderId || 'mock_order_001',
          storeName: '重庆渝北区分店',
          managerName: '张经理',
          managerPhone: '138****8888',
          carModel: '现代挖掘机R225LC-9T',
          originalStartTime: '09月16日 21:00',
          originalEndTime: '09月18日 21:00',
          originalDays: 2
        },
        renewPrice: 800,
        memberRenewPrice: 640
      });
    }
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

      let serviceRate = 0.006; // 默认值
      if (response.success) {
        serviceRate = response.data.serviceRate || 0.006;
      } else {
        throw new Error(response.message || '获取服务费率失败');
      }

      this.setData({
        serviceRate,
        serviceRateDisplay: (serviceRate * 100).toFixed(1)
      });
    } catch (error) {
      console.error('获取服务费率失败', error);
      const defaultRate = 0.006;
      this.setData({
        serviceRate: defaultRate,
        serviceRateDisplay: (defaultRate * 100).toFixed(1)
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
    this.setData({
      purchaseMembership: e.detail.value
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

    // 计算新的租期
    const originalEndDate = this.parseDateTime(this.data.orderInfo.originalEndTime);
    const originalStartDate = this.parseDateTime(this.data.orderInfo.originalStartTime);
    const newEndDate = new Date(originalEndDate.getTime() + days * 24 * 60 * 60 * 1000);
    
    const newStartTime = this.data.orderInfo.originalStartTime;
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

  // 解析日期时间字符串
  parseDateTime(dateTimeStr) {
    const currentYear = new Date().getFullYear();
    const match = dateTimeStr.match(/(\d{2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})/);
    if (match) {
      const [, month, day, hour, minute] = match;
      return new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    return new Date();
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
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500
        });
        
        // 跳转到续租成功页面
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/renew-success/renew-success?orderId=${this.data.orderInfo.orderId}&renewDays=${this.data.renewDays}&totalAmount=${this.data.totalAmount}&newEndTime=${this.data.newEndTime}&purchaseMembership=${this.data.purchaseMembership}`
          });
        }, 1500);
      } else {
        throw new Error(response.message || '支付失败');
      }
    } catch (error) {
      console.error('支付处理失败', error);
      
      // 模拟支付结果
      const paymentSuccess = Math.random() > 0.1; // 90%成功率
      
      if (paymentSuccess) {
        wx.showToast({
          title: '支付成功',
          icon: 'success',
          duration: 1500
        });
        
        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/renew-success/renew-success?orderId=${this.data.orderInfo.orderId}&renewDays=${this.data.renewDays}&totalAmount=${this.data.totalAmount}&newEndTime=${this.data.newEndTime}&purchaseMembership=${this.data.purchaseMembership}`
          });
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