Page({
  data: {
    car: {
      image: '../../assets/rsg.png',
      name: '三一重工SY75C',
      specs: '液压先导/21吨级/履带式',
      rating: 95,
      pickupLocation: '昆明 - 长水机场商业街店',
      pickupDate: '05月09日 11:00',
      dropoffLocation: '昆明 - 长水机场商业街店',
      dropoffDate: '05月11日 11:00',
      basePrice: 545.00
    },
    selectedInsurance: '', // 移除默认选择
    insurancePrices: {
      'basic': 51,
      'premium': 91,
      'guard': 71
    },
    insuranceNames: {
      'basic': '尊享保障',
      'premium': '全程无忧',
      'guard': '尊享守护'
    },
    insurancePrice: 0,
    days: 2,
    totalPrice: 546.00,
    discount: 0.00,
    showPriceDetail: false,
    rentalDays: 2,
    priceDetails: [
      { 
        name: '车辆租赁费及门店服务费', 
        price: 426.00,
        dailyPrices: [
          { date: '05/31', day: '周六', price: 59.00 },
          { date: '06/01', day: '周日', price: 260.00 },
          { date: '06/02', day: '周一', price: 107.00 }
        ]
      },
      { name: '基本保障服务费', price: 100.00, unit: 50, days: 2 },
      { name: '车辆整备费', price: 20.00 }
    ],
    deposits: [
      { name: '违章押金', price: 2000.00, refundable: true },
      { name: '车辆押金', exempted: true }
    ],
    // 用户信息
    userInfo: {
      isMember: false, // 是否为会员
    },
    // 新增：价格加载状态
    priceLoading: false,
    priceAnimating: false,
    // 会员相关数据
    selectedMembership: false, // 是否选择购买会员
    membershipPrice: 299, // 会员年费
    originalMembershipPrice: 399, // 会员原价
    originalDailyPrice: 120, // 普通用户日租价
    memberDailyPrice: 100, // 会员日租价
    dailySavings: 20, // 每天节省金额
    
    // 计算相关
    memberDiscount: 0, // 会员折扣金额
    totalDiscount: 0, // 总折扣

    // 新增：底部栏显示的价格数据
    footerPrice: {
      total: '546.00',
      discount: '0'
    }
  },
  
  onLoad: function(options) {
    this.initializeData(options);
  },

  // 页面显示时重新加载价格
  onShow: function() {
    console.log('页面显示，重新计算价格');
    this.refreshPriceData();
  },
  
  // 应用从后台进入前台时重新加载
  onShow: function() {
    this.refreshPriceData();
  },

  // 初始化数据
  initializeData: function(options) {
    // 接收上一页面传来的数据
    if (options && options.carId) {
      // 这里可以根据carId从上一页面获取详细信息
      // 或者发起请求获取车辆详情
      this.fetchCarDetails(options.carId);
    }
    
    // 计算租车天数
    this.calculateDays();
    // 检查用户会员状态
    this.checkMembershipStatus();
    // 计算价格相关数据
    this.calculatePriceComparison();
    this.calculateTotalWithAnimation();
  },
  
  // 刷新价格数据（页面重新显示时调用）
  refreshPriceData: function() {
    this.showPriceLoadingAnimation();
    
    // 模拟网络请求延迟
    setTimeout(() => {
      this.checkMembershipStatus();
      this.calculateTotalWithAnimation();
    }, 500);
  },
  
  // 显示价格加载动画
  showPriceLoadingAnimation: function() {
    this.setData({
      priceLoading: true
    });
    
    setTimeout(() => {
      this.setData({
        priceLoading: false
      });
    }, 800);
  },
  
  // 带动画的价格计算
  calculateTotalWithAnimation: function() {
    // 先显示加载状态
    this.setData({
      priceAnimating: true
    });
    
    // 延迟计算，营造加载效果
    setTimeout(() => {
      this.calculateTotal();
      
      // 价格数字跳动动画
      this.animatePriceChange();
      
      setTimeout(() => {
        this.setData({
          priceAnimating: false
        });
      }, 600);
    }, 200);
  },
  
  // 价格数字跳动动画
  animatePriceChange: function() {
    const currentTotal = parseFloat(this.data.totalPrice);
    const targetTotal = currentTotal;
    const steps = 15;
    const stepValue = targetTotal / steps;
    let currentStep = 0;
    
    const animate = () => {
      if (currentStep <= steps) {
        const animatedValue = (stepValue * currentStep).toFixed(2);
        this.setData({
          'footerPrice.total': animatedValue
        });
        currentStep++;
        setTimeout(animate, 30);
      } else {
        // 确保最终值准确
        this.setData({
          'footerPrice.total': targetTotal.toFixed(2)
        });
      }
    };
    
    animate();
  },

  fetchCarDetails: function(carId) {
    // 这里可以发起请求获取车辆详情
    // wx.request({...})
    
    // 示例：模拟获取到的数据
    const pickupTime = new Date(options.pickupTime || Date.now());
    const dropoffTime = new Date(options.dropoffTime || Date.now() + 172800000); // 默认两天后
    
    this.setData({
      'car.image': options.carImage || '/assets/images/car_placeholder.png',
      'car.name': options.carName || '日产天籁',
      'car.specs': options.carSpecs || '自动/2.0L/三厢/5座',
      'car.rating': options.carRating || 95,
      'car.pickupLocation': options.pickupLocation || '昆明 - 长水机场商业街店',
      'car.pickupDate': this.formatDate(pickupTime),
      'car.dropoffLocation': options.dropoffLocation || '昆明 - 长水机场商业街店',
      'car.dropoffDate': this.formatDate(dropoffTime),
      'car.basePrice': options.basePrice || 545.00
    });
    
    // 更新总价为基础价格
    this.setData({
      totalPrice: this.data.car.basePrice.toFixed(2)
    });
  },
  
  formatDate: function(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${month}月${day}日 ${hour}:${minute}`;
  },
  
  calculateDays: function() {
    // 简化计算天数的逻辑，这里假设已经知道天数为2
    // 实际应用中应该根据日期计算
    this.setData({
      days: 2
    });
  },
  
  selectInsurance: function(e) {
    const type = e.currentTarget.dataset.type;
    // 如果已经选择了该保险，则取消选择
    if (this.data.selectedInsurance === type) {
      this.setData({
        selectedInsurance: ''
      });
    } else {
      this.setData({
        selectedInsurance: type
      });
    }
    // 带动画的价格计算
    this.calculateTotalWithAnimation();
  },

  // 检查用户会员状态
  checkMembershipStatus: function() {
    // 从本地存储或服务器获取用户会员状态
    const isMember = wx.getStorageSync('userMembership') || false;
    this.setData({
      'userInfo.isMember': isMember
    });
  },

  // 计算价格对比数据
  calculatePriceComparison: function() {
    const basePrice = this.data.car.basePrice;
    const days = this.data.days;
    
    // 计算普通用户和会员的日租价格
    const originalDaily = Math.round(basePrice / days);
    const memberDaily = Math.round(originalDaily * 0.9); // 9折
    const savings = originalDaily - memberDaily;
    
    this.setData({
      originalDailyPrice: originalDaily,
      memberDailyPrice: memberDaily,
      dailySavings: savings
    });
  },

  // 选择会员
  selectMembership: function() {
    const newSelection = !this.data.selectedMembership;
    this.setData({
      selectedMembership: newSelection
    });
    // 带动画的价格计算
    this.calculateTotalWithAnimation();
  },
  // 计算总价（核心逻辑）
  calculateTotal: function() {
    let insurancePrice = 0;
    let membershipFee = 0;
    let memberDiscount = 0;
    let totalDiscount = 0;
    
    // 如果选择了保险，计算保险费用
    if (this.data.selectedInsurance) {
      insurancePrice = this.data.insurancePrices[this.data.selectedInsurance] * this.data.days;
    }
    
    // 计算会员相关费用
    const isMember = this.data.userInfo.isMember;
    const selectedMembership = this.data.selectedMembership;
    
    if (isMember || selectedMembership) {
      // 计算会员折扣（基础租金的10%折扣）
      const basePrice = this.data.car.basePrice;
      const discountRate = 0.1; // 10%折扣
      memberDiscount = basePrice * discountRate;
      totalDiscount = memberDiscount;
      
      // 如果选择购买会员且当前不是会员
      if (selectedMembership && !isMember) {
        membershipFee = this.data.membershipPrice;
      }
    }
    
    // 计算总价
    const total = this.data.car.basePrice + insurancePrice + membershipFee - memberDiscount;
    
    this.setData({
      insurancePrice: insurancePrice.toFixed(2),
      memberDiscount: memberDiscount.toFixed(2),
      totalDiscount: totalDiscount.toFixed(2),
      totalPrice: total.toFixed(2),
      // 更新底部栏数据
      'footerPrice.total': total.toFixed(2),
      'footerPrice.discount': totalDiscount.toFixed(2)
    });
    console.log('价格计算完成:', {
      basePrice: this.data.car.basePrice,
      insurancePrice,
      membershipFee,
      memberDiscount,
      total: total.toFixed(2)
    });
  },

  // 显示会员权益详情
  showMembershipBenefits: function() {
    wx.showModal({
      title: '会员权益',
      content: '• 租车享9折优惠\n• 免费全国道路救援\n• 专属客服优先服务\n• 免费升级车型（有条件）\n• 积分奖励翻倍\n• 专享活动优惠',
      showCancel: false,
      confirmText: '我知道了'
    });
  },
  
  onConfirmOrder: function() {
    wx.showLoading({
      title: '正在提交...',
    });
    
    // 模拟提交订单
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '订单提交成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 如果用户购买了会员，更新本地会员状态
          if (this.data.selectedMembership && !this.data.userInfo.isMember) {
            wx.setStorageSync('userMembership', true);
          }
          // 可以跳转到支付页面或订单页面
          // wx.navigateTo({
          //   url: '/pages/payment/payment?orderId=123&amount=' + this.data.totalPrice,
          // })
        }
      });
    }, 1500);
  },

  // 显示价格明细
  showPriceDetail: function() {
    // 确保数据同步
    this.syncPriceData();
    this.setData({
      showPriceDetail: true
    });
  },
  
  // 同步价格数据
  syncPriceData: function() {
    const totalPrice = this.data.totalPrice;
    const totalDiscount = this.data.totalDiscount;
    
    this.setData({
      'footerPrice.total': totalPrice,
      'footerPrice.discount': totalDiscount
    });
  },

  // 隐藏价格明细
  hidePriceDetail: function() {
    this.setData({
      showPriceDetail: false
    });
  },
  
  // 跳转到支付页面
  goToPayment: function() {
    // 最后一次价格同步确认
    this.syncPriceData();
    // 这里可以添加实际的支付逻辑
    wx.showLoading({
      title: '正在跳转支付...',
    });

    const paymentData = {
      totalAmount: this.data.footerPrice.total,
      discount: this.data.footerPrice.discount,
      carInfo: this.data.car,
      insurance: this.data.selectedInsurance,
      membership: this.data.selectedMembership
    };
    
    console.log('支付数据:', paymentData);
    
    // 模拟跳转
    setTimeout(function() {
      wx.hideLoading();
      wx.showToast({
        title: '跳转到支付页面',
        icon: 'success'
      });

      // 实际项目中跳转到支付页面
      // wx.navigateTo({
      //   url: '/pages/payment/payment?data=' + JSON.stringify(paymentData)
      // });
    }, 1500);
  },
  
  // 查看费用规则
  showFeeRules: function() {
    wx.showToast({
      title: '查看费用规则',
      icon: 'none'
    });
  },
  
  // 查看保障规则
  showGuaranteeRules: function() {
    wx.showToast({
      title: '查看保障规则',
      icon: 'none'
    });
  },
  
  // 查看保障服务详情
  showGuaranteeDetails: function() {
    wx.showToast({
      title: '查看保障服务详情',
      icon: 'none'
    });
  },
  // 查看会员权益
  showMembershipBenefits: function() {
    wx.showToast({
      title: '查看会员权益',
      icon: 'none'
    });
  }
});