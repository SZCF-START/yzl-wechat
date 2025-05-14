Page({
  data: {
    car: {
      image: '/assets/images/car_placeholder.png',
      name: '日产天籁',
      specs: '自动/2.0L/三厢/5座',
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
    ]
  },
  
  onLoad: function(options) {
    // 接收上一页面传来的数据
    if (options.carId) {
      // 这里可以根据carId从上一页面获取详细信息
      // 或者发起请求获取车辆详情
      this.fetchCarDetails(options.carId);
    }
    
    // 计算租车天数
    this.calculateDays();
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
    this.calculateTotal();
  },
  
  calculateTotal: function() {
    let insurancePrice = 0;
    
    // 如果选择了保险，计算保险费用
    if (this.data.selectedInsurance) {
      insurancePrice = this.data.insurancePrices[this.data.selectedInsurance] * this.data.days;
    }
    
    // 计算总价
    const total = this.data.car.basePrice + insurancePrice;
    
    this.setData({
      insurancePrice: insurancePrice.toFixed(2),
      totalPrice: total.toFixed(2)
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
    this.setData({
      showPriceDetail: true
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
    // 这里可以添加实际的支付逻辑
    wx.showLoading({
      title: '正在跳转支付...',
    });
    
    // 模拟跳转
    setTimeout(function() {
      wx.hideLoading();
      wx.showToast({
        title: '跳转到支付页面',
        icon: 'success'
      });
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
});