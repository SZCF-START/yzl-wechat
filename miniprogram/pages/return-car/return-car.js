Page({
  data: {
    // 订单信息
    orderInfo: {
      storeName: '长沙星沙店',
      managerName: '张三',
      managerPhone: '138****8888',
      carModel: '三一SY16C',
      startTime: '08月21日 21:00',
      endTime: '08月28日 21:00',
      rentalDays: 7,
      initialHours: 120.5,
      dailyPrice: 200, // 原始租赁单价
      dailyWorkHours: 8 // 每天允许工作小时数
    },
    
    // 用户输入数据
    returnHours: '', // 还车时仪表盘数据
    dashboardImage: '', // 仪表盘照片
    vehicleImages: [], // 车辆照片数组
    
    // 计算结果
    showOvertimeResult: false,
    overtimeDays: 0, // 超时天数
    timeOvertimeDays: 0, // 按时间计算的超时天数
    hoursOvertimeDays: 0, // 按工作小时数计算的超时天数
    
    // 价格相关
    overtimePrice: 250, // 超时单价（比原价高）
    renewalPrice: 180, // 续租单价（比原价低）
    selectedPriceType: '', // 选择的价格类型
    overtimeTotalPrice: 0, // 超时计费总价
    renewalTotalPrice: 0, // 续租计费总价
    finalPaymentAmount: 0, // 最终支付金额
    showFinalPayment: false,
    
    // 弹窗
    showOvertimeModal: false,
    timeOvertimeDetail: '',
    hoursOvertimeDetail: '',
    finalOvertimeReason: '',
    
    // 提交状态
    canSubmit: false
  },

  onLoad: function(options) {
    // 可以从options中获取订单ID，然后加载订单详情
    // const orderId = options.orderId;
    // this.loadOrderInfo(orderId);
    
    // 模拟加载订单数据
    this.loadMockOrderInfo();
  },

  // 模拟加载订单信息
  loadMockOrderInfo: function() {
    // 在实际项目中，这里应该调用API获取订单详情
    console.log('订单信息加载完成');
  },

  // 监听还车小时数输入
  onReturnHoursChange: function(e) {
    const value = e.detail.value;
    // 限制输入格式：只允许数字和一位小数
    const regex = /^\d*\.?\d{0,1}$/;
    
    if (regex.test(value) || value === '') {
      this.setData({
        returnHours: value
      });
      
      // 如果输入了有效数值，进行超时计算
      if (value && !isNaN(parseFloat(value))) {
        this.calculateOvertime();
      } else {
        this.setData({
          showOvertimeResult: false,
          showFinalPayment: false
        });
      }
    }
    
    this.checkCanSubmit();
  },

  // 计算超时
  calculateOvertime: function() {
    const returnHours = parseFloat(this.data.returnHours);
    const initialHours = this.data.orderInfo.initialHours;
    const rentalDays = this.data.orderInfo.rentalDays;
    const dailyWorkHours = this.data.orderInfo.dailyWorkHours;
    
    if (isNaN(returnHours)) return;
    
    // 计算工作小时数
    const totalWorkHours = returnHours - initialHours;
    
    // 1. 按租期时间计算超时（考虑半小时宽限期）
    const currentTime = new Date();
    const endTime = new Date('2024-08-28 21:30:00'); // 模拟预期还车时间+30分钟
    const timeOvertimeDays = currentTime > endTime ? 
      Math.ceil((currentTime - endTime) / (24 * 60 * 60 * 1000)) : 0;
    
    // 2. 按工作小时数计算超时
    const allowedTotalHours = rentalDays * dailyWorkHours; // 总允许工作小时数
    const hoursOvertimeDays = totalWorkHours > allowedTotalHours ? 
      Math.ceil((totalWorkHours - allowedTotalHours) / dailyWorkHours) : 0;
    
    // 取最大值作为实际超时天数
    const finalOvertimeDays = Math.max(timeOvertimeDays, hoursOvertimeDays);
    
    // 生成详情说明
    const timeDetail = timeOvertimeDays > 0 ? 
      `按还车时间计算，超时${timeOvertimeDays}天` : 
      '按还车时间计算，未超时';
    
    const hoursDetail = `工作小时数：${totalWorkHours.toFixed(1)}小时，允许工作${allowedTotalHours}小时，${
      hoursOvertimeDays > 0 ? `超时${hoursOvertimeDays}天` : '未超时'
    }`;
    
    const finalReason = finalOvertimeDays > 0 ? 
      (timeOvertimeDays >= hoursOvertimeDays ? 
        '最终按还车时间超时计算，因为还车时间超时天数更多' : 
        '最终按工作小时数超时计算，因为工作小时数超时天数更多') :
      '未超时，无需额外费用';
    
    // 计算价格
    const overtimeTotal = finalOvertimeDays * this.data.overtimePrice;
    const renewalTotal = finalOvertimeDays * this.data.renewalPrice;
    
    this.setData({
      showOvertimeResult: true,
      overtimeDays: finalOvertimeDays,
      timeOvertimeDays: timeOvertimeDays,
      hoursOvertimeDays: hoursOvertimeDays,
      timeOvertimeDetail: timeDetail,
      hoursOvertimeDetail: hoursDetail,
      finalOvertimeReason: finalReason,
      overtimeTotalPrice: overtimeTotal,
      renewalTotalPrice: renewalTotal
    });
    
    // 如果有超时，显示价格选择
    if (finalOvertimeDays > 0) {
      // 默认选择续租价格（更便宜）
      this.setData({
        selectedPriceType: 'renewal',
        finalPaymentAmount: renewalTotal,
        showFinalPayment: true
      });
    } else {
      this.setData({
        selectedPriceType: '',
        finalPaymentAmount: 0,
        showFinalPayment: false
      });
    }
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

  // 上传仪表盘照片
  uploadDashboardImage: function() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        that.setData({
          dashboardImage: tempFilePath
        });
        that.checkCanSubmit();
      },
      fail: function() {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除仪表盘照片
  deleteDashboardImage: function() {
    this.setData({
      dashboardImage: ''
    });
    this.checkCanSubmit();
  },

  // 上传车辆照片
  uploadVehicleImage: function() {
    const that = this;
    const maxCount = 6 - that.data.vehicleImages.length;
    
    wx.chooseImage({
      count: maxCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePaths = res.tempFilePaths;
        const newImages = [...that.data.vehicleImages, ...tempFilePaths];
        that.setData({
          vehicleImages: newImages
        });
        that.checkCanSubmit();
      },
      fail: function() {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除车辆照片
  deleteVehicleImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.vehicleImages;
    images.splice(index, 1);
    this.setData({
      vehicleImages: images
    });
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit: function() {
    const { returnHours, dashboardImage, vehicleImages } = this.data;
    const canSubmit = returnHours && 
                     !isNaN(parseFloat(returnHours)) && 
                     dashboardImage && 
                     vehicleImages.length > 0;
    
    this.setData({
      canSubmit: canSubmit
    });
  },

  // 提交还车申请
  submitReturn: function() {
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请完善所有信息',
        icon: 'none'
      });
      return;
    }
    
    // 如果有超时但未选择价格类型
    if (this.data.overtimeDays > 0 && !this.data.selectedPriceType) {
      wx.showToast({
        title: '请选择计费方式',
        icon: 'none'
      });
      return;
    }
    
    // 准备提交数据
    const submitData = {
      returnHours: parseFloat(this.data.returnHours),
      dashboardImage: this.data.dashboardImage,
      vehicleImages: this.data.vehicleImages,
      overtimeDays: this.data.overtimeDays,
      selectedPriceType: this.data.selectedPriceType,
      finalPaymentAmount: this.data.finalPaymentAmount
    };
    
    console.log('提交数据：', submitData);
    
    // 显示提交中
    wx.showLoading({
      title: '提交中...'
    });
    
    // 模拟API提交
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      });
      
      // 跳转到还车审核页面
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/return-review/return-review'
        });
      }, 1500);
    }, 2000);
  },
});