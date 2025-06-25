Page({
  data: {
    // 订单信息
    orderInfo: {
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      startTime: '',
      endTime: '',
      rentalDays: 0,
      initialHours: 0,
      endTimestamp: 0, // 租赁结束时间戳
      dailyWorkHours: 8 // 每天允许工作小时数（8小时算一天）
    },
    
    // 还车数据
    returnData: {
      userReturnHours: 0, // 用户提交的还车小时数
      adminReturnHours: 0, // 管理员修改后的还车小时数
      actualReturnTime: '', // 实际还车时间
      actualReturnTimestamp: 0, // 实际还车时间戳
      dashboardImage: '' // 仪表盘照片
    },
    
    // 超时计算
    finalOvertimeDays: 0, // 最终超时天数
    paidOvertimeDays: 0, // 已支付超时天数
    remainingOvertimeDays: 0, // 剩余需支付超时天数
    
    // 价格相关
    overtimePrice: 0, // 超时单价
    renewalPrice: 0, // 续租单价
    selectedPriceType: 'overtime', // 默认选择超时单价
    overtimeTotalPrice: 0, // 超时计费总价
    renewalTotalPrice: 0, // 续租计费总价
    finalPaymentAmount: 0, // 最终支付金额
    
    // 弹窗
    showOvertimeModal: false,
    timeOvertimeDetail: '',
    hoursOvertimeDetail: '',
    finalOvertimeReason: '',
    
    // 支付状态
    canPayment: false
  },

  onLoad: function(options) {
    // 从options中获取订单ID
    const orderId = options.orderId;
    if (orderId) {
      this.loadOrderInfo(orderId);
    } else {
      // 订单ID不存在，使用模拟数据
      this.loadMockData();
    }
  },

  // 加载模拟数据
  loadMockData: function() {
    wx.showToast({
      title: '使用模拟数据',
      icon: 'none',
      duration: 2000
    });

    // 模拟数据
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000; // 3天前
    const endTime = now - 2 * 60 * 60 * 1000; // 2小时前（模拟已过期）
    const actualReturnTime = now; // 当前时间作为实际还车时间

    const mockData = {
      id: 'MOCK_ORDER_001',
      storeName: '北京朝阳门店',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      startTimestamp: threeDaysAgo,
      endTimestamp: endTime,
      initialHours: 1250.5, // 出车时仪表盘小时数
      userReturnHours: 1275.2, // 用户提交的还车小时数
      adminReturnHours: 1280.8, // 管理员修改后的还车小时数
      actualReturnTimestamp: actualReturnTime, // 实际还车时间戳
      dashboardImage: '/images/dashboard-sample.jpg', // 仪表盘照片
      overtimePrice: 800, // 超时单价：800元/天
      renewalPrice: 600, // 续租单价：600元/天
      paidOvertimeDays: 2 // 已支付2天超时费用
    };

    // 处理时间戳转换
    const startTime = this.formatTimestamp(mockData.startTimestamp);
    const endTimeFormatted = this.formatTimestamp(mockData.endTimestamp);
    const actualReturnTimeFormatted = this.formatTimestamp(mockData.actualReturnTimestamp);
    
    // 计算租赁天数
    const rentalDays = this.calculateRentalDays(mockData.startTimestamp, mockData.endTimestamp);
    
    this.setData({
      orderInfo: {
        id: mockData.id,
        storeName: mockData.storeName,
        managerName: mockData.managerName,
        managerPhone: mockData.managerPhone,
        carModel: mockData.carModel,
        startTime: startTime,
        endTime: endTimeFormatted,
        rentalDays: rentalDays,
        initialHours: mockData.initialHours,
        endTimestamp: mockData.endTimestamp,
        dailyWorkHours: 8
      },
      returnData: {
        userReturnHours: mockData.userReturnHours,
        adminReturnHours: mockData.adminReturnHours,
        actualReturnTime: actualReturnTimeFormatted,
        actualReturnTimestamp: mockData.actualReturnTimestamp,
        dashboardImage: mockData.dashboardImage
      },
      overtimePrice: mockData.overtimePrice,
      renewalPrice: mockData.renewalPrice,
      paidOvertimeDays: mockData.paidOvertimeDays
    });

    // 计算超时
    this.calculateOvertime();

    console.log('模拟数据加载完成：', {
      租赁天数: rentalDays,
      开始时间: startTime,
      结束时间: endTimeFormatted,
      实际还车时间: actualReturnTimeFormatted,
      初始小时数: mockData.initialHours,
      用户还车小时数: mockData.userReturnHours,
      管理员修改小时数: mockData.adminReturnHours,
      已支付天数: mockData.paidOvertimeDays
    });
  },

  // 加载订单信息
  loadOrderInfo: function(orderId) {
    const that = this;
    wx.showLoading({
      title: '加载中...'
    });
    
    // 调用后端接口获取审核后的订单详情
    wx.request({
      url: 'YOUR_API_BASE_URL/order/review-detail',
      method: 'GET',
      data: {
        orderId: orderId
      },
      success: function(res) {
        if (res.data.code === 200) {
          const data = res.data.data;
          
          // 处理时间戳转换
          const startTime = that.formatTimestamp(data.startTimestamp);
          const endTime = that.formatTimestamp(data.endTimestamp);
          const actualReturnTime = that.formatTimestamp(data.actualReturnTimestamp);
          
          // 计算租赁天数
          const rentalDays = that.calculateRentalDays(data.startTimestamp, data.endTimestamp);
          
          that.setData({
            orderInfo: {
              id: data.id,
              storeName: data.storeName,
              managerName: data.managerName,
              managerPhone: data.managerPhone,
              carModel: data.carModel,
              startTime: startTime,
              endTime: endTime,
              rentalDays: rentalDays,
              initialHours: data.initialHours,
              endTimestamp: data.endTimestamp,
              dailyWorkHours: 8
            },
            returnData: {
              userReturnHours: data.userReturnHours,
              adminReturnHours: data.adminReturnHours,
              actualReturnTime: actualReturnTime,
              actualReturnTimestamp: data.actualReturnTimestamp,
              dashboardImage: data.dashboardImage
            },
            overtimePrice: data.overtimePrice,
            renewalPrice: data.renewalPrice,
            paidOvertimeDays: data.paidOvertimeDays
          });

          // 计算超时
          that.calculateOvertime();
        } else {
          wx.showModal({
            title: '获取订单失败',
            content: res.data.message || '获取订单信息失败，是否使用模拟数据？',
            confirmText: '使用模拟数据',
            cancelText: '返回',
            success: function(modalRes) {
              if (modalRes.confirm) {
                that.loadMockData();
              } else {
                wx.navigateBack();
              }
            }
          });
        }
      },
      fail: function() {
        wx.showModal({
          title: '网络错误',
          content: '网络请求失败，是否使用模拟数据？',
          confirmText: '使用模拟数据',
          cancelText: '返回',
          success: function(modalRes) {
            if (modalRes.confirm) {
              that.loadMockData();
            } else {
              wx.navigateBack();
            }
          }
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  },

  // 时间戳转换为指定格式
  formatTimestamp: function(timestamp) {
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${month}月${day}日 ${hour}:${minute}`;
  },

  // 计算租赁天数
  calculateRentalDays: function(startTimestamp, endTimestamp) {
    const diffMs = endTimestamp - startTimestamp;
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return diffDays;
  },

  // 拨打电话
  makePhoneCall: function(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: function() {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 计算超时（基于管理员修改后的数据）
  calculateOvertime: function() {
    const adminReturnHours = this.data.returnData.adminReturnHours;
    const initialHours = this.data.orderInfo.initialHours;
    const endTimestamp = this.data.orderInfo.endTimestamp;
    const actualReturnTimestamp = this.data.returnData.actualReturnTimestamp;
    const dailyWorkHours = this.data.orderInfo.dailyWorkHours;
    
    // 1. 按租期时间计算超时（实际还车时间+30分钟）
    const graceTimestamp = endTimestamp + 30 * 60 * 1000; // 加30分钟宽限期
    const timeOverMs = Math.max(0, actualReturnTimestamp - graceTimestamp);
    const timeOvertimeDays = timeOverMs > 0 ? Math.ceil(timeOverMs / (24 * 60 * 60 * 1000)) : 0;
    
    // 2. 按工作小时数计算超时
    const totalWorkHours = adminReturnHours - initialHours;
    const rentalDays = this.data.orderInfo.rentalDays;
    const allowedTotalHours = rentalDays * dailyWorkHours;
    const excessHours = Math.max(0, totalWorkHours - allowedTotalHours);
    const hoursOvertimeDays = excessHours > 0 ? Math.ceil(excessHours / dailyWorkHours) : 0;
    
    // 取最大值作为实际超时天数
    const finalOvertimeDays = Math.max(timeOvertimeDays, hoursOvertimeDays);
    
    // 计算剩余需支付天数
    const remainingOvertimeDays = Math.max(0, finalOvertimeDays - this.data.paidOvertimeDays);
    
    // 生成详情说明
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
    
    // 计算价格
    const overtimeTotal = remainingOvertimeDays * this.data.overtimePrice;
    const renewalTotal = remainingOvertimeDays * this.data.renewalPrice;
    
    this.setData({
      finalOvertimeDays: finalOvertimeDays,
      remainingOvertimeDays: remainingOvertimeDays,
      timeOvertimeDetail: timeDetail,
      hoursOvertimeDetail: hoursDetail,
      finalOvertimeReason: finalReason,
      overtimeTotalPrice: overtimeTotal,
      renewalTotalPrice: renewalTotal,
      finalPaymentAmount: overtimeTotal, // 默认选择超时单价
      canPayment: remainingOvertimeDays > 0
    });

    // 在控制台输出计算详情，方便调试
    console.log('超时计算详情：', {
      总工作小时数: totalWorkHours.toFixed(1),
      租期天数: rentalDays,
      允许总小时数: allowedTotalHours,
      超出小时数: excessHours.toFixed(1),
      时间超时天数: timeOvertimeDays,
      小时数超时天数: hoursOvertimeDays,
      最终超时天数: finalOvertimeDays,
      已支付天数: this.data.paidOvertimeDays,
      剩余需支付天数: remainingOvertimeDays,
      超时总费用: overtimeTotal,
      续租总费用: renewalTotal
    });
  },

  // 显示超时详情
  showOvertimeDetail: function() {
    this.setData({
      showOvertimeModal: true
    });
  },

  // 隐藏超时详情
  hideOvertimeDetail: function() {
    this.setData({
      showOvertimeModal: false
    });
  },

  // 阻止冒泡
  stopPropagation: function() {
    // 空函数，用于阻止事件冒泡
  },

  // 选择价格类型
  selectPriceType: function(e) {
    const type = e.currentTarget.dataset.type;
    const amount = type === 'overtime' ? this.data.overtimeTotalPrice : this.data.renewalTotalPrice;
    
    this.setData({
      selectedPriceType: type,
      finalPaymentAmount: amount
    });
  },

  // 提交支付
  submitPayment: function() {
    if (!this.data.canPayment) {
      wx.showToast({
        title: '无需支付',
        icon: 'none'
      });
      return;
    }
    
    // 准备支付数据
    const paymentData = {
      orderId: this.data.orderInfo.id,
      remainingOvertimeDays: this.data.remainingOvertimeDays,
      selectedPriceType: this.data.selectedPriceType,
      finalPaymentAmount: this.data.finalPaymentAmount
    };
    
    console.log('支付数据：', paymentData);
    
    // 模拟支付过程
    if (this.data.orderInfo.id === 'MOCK_ORDER_001') {
      this.mockSubmitPayment(paymentData);
      return;
    }
    
    // 显示支付中
    wx.showLoading({
      title: '支付中...'
    });
    
    // 调用后端接口提交支付
    const that = this;
    wx.request({
      url: 'YOUR_API_BASE_URL/payment/submit',
      method: 'POST',
      data: paymentData,
      success: function(res) {
        if (res.data.code === 200) {
          // 调用微信支付
          that.processPayment(res.data.data.paymentInfo);
        } else {
          wx.showToast({
            title: res.data.message || '支付失败',
            icon: 'none'
          });
        }
      },
      fail: function() {
        wx.showToast({
          title: '网络请求失败',
          icon: 'none'
        });
      },
      complete: function() {
        wx.hideLoading();
      }
    });
  },

  // 模拟提交支付
  mockSubmitPayment: function(paymentData) {
    wx.showLoading({
      title: '支付中...'
    });
    
    // 模拟网络延迟
    setTimeout(() => {
      wx.hideLoading();
      
      wx.showModal({
        title: '模拟支付',
        content: `需要支付：¥${paymentData.finalPaymentAmount}，是否模拟支付成功？`,
        confirmText: '支付成功',
        cancelText: '支付失败',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.showModal({
                title: '支付完成',
                content: '订单已完成，感谢您的使用！',
                showCancel: false,
                success: () => {
                  // 跳转到订单完成页面
                  wx.redirectTo({
                    url: '/pages/order-complete/order-complete?orderId=' + this.data.orderInfo.id
                  });
                }
              });
            }, 1500);
          } else {
            wx.showToast({
              title: '支付失败',
              icon: 'error'
            });
          }
        }
      });
    }, 2000);
  },

  // 处理支付
  processPayment: function(paymentInfo) {
    const that = this;
    
    wx.requestPayment({
      timeStamp: paymentInfo.timeStamp,
      nonceStr: paymentInfo.nonceStr,
      package: paymentInfo.package,
      signType: paymentInfo.signType,
      paySign: paymentInfo.paySign,
      success: function() {
        wx.showToast({
          title: '支付成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/order-complete/order-complete?orderId=' + that.data.orderInfo.id
          });
        }, 1500);
      },
      fail: function() {
        wx.showToast({
          title: '支付失败',
          icon: 'none'
        });
      }
    });
  },

  // 跳转到订单完成页面
  goToComplete: function() {
    wx.redirectTo({
      url: '/pages/order-complete/order-complete?orderId=' + this.data.orderInfo.id
    });
  }
});