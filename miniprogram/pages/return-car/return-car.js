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
    
    // 用户输入数据
    returnHours: '', // 还车时仪表盘数据
    dashboardImage: '', // 仪表盘照片
    vehicleImages: [], // 车辆照片数组
    hoursErrorTip: '', // 小时数输入错误提示
    
    // 计算结果
    showOvertimeResult: false,
    overtimeDays: 0, // 超时天数
    timeOvertimeDays: 0, // 按时间计算的超时天数
    hoursOvertimeDays: 0, // 按工作小时数计算的超时天数
    currentReturnTimestamp: 0, // 用户计算时的当前时间戳
    
    // 价格相关
    overtimePrice: 0, // 超时单价（从接口获取）
    renewalPrice: 0, // 续租单价（从接口获取）
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
    canSubmit: false,
    submitButtonText: '还车'
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

    // 模拟数据 - 设置为3天前开始，今天结束，这样更容易测试超时情况
    const now = Date.now();
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000; // 3天前
    const endTime = now - 2 * 60 * 60 * 1000; // 2小时前（模拟已过期）

    const mockData = {
      id: 'MOCK_ORDER_001',
      storeName: '北京朝阳门店',
      managerName: '张经理',
      managerPhone: '138-0000-1234',
      carModel: '卡特彼勒320D挖掘机',
      startTimestamp: threeDaysAgo,
      endTimestamp: endTime,
      initialHours: 1250.5, // 出车时仪表盘小时数
      overtimePrice: 800, // 超时单价：800元/天
      renewalPrice: 600   // 续租单价：600元/天
    };

    // 处理时间戳转换
    const startTime = this.formatTimestamp(mockData.startTimestamp);
    const endTimeFormatted = this.formatTimestamp(mockData.endTimestamp);
    
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
      overtimePrice: mockData.overtimePrice,
      renewalPrice: mockData.renewalPrice
    });

    console.log('模拟数据加载完成：', {
      租赁天数: rentalDays,
      开始时间: startTime,
      结束时间: endTimeFormatted,
      初始小时数: mockData.initialHours,
      超时单价: mockData.overtimePrice,
      续租单价: mockData.renewalPrice
    });
  },

  // 加载订单信息
  loadOrderInfo: function(orderId) {
    const that = this;
    wx.showLoading({
      title: '加载中...'
    });
    
    // 调用后端接口获取订单详情
    wx.request({
      url: 'YOUR_API_BASE_URL/order/detail',
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
            overtimePrice: data.overtimePrice,
            renewalPrice: data.renewalPrice
          });
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

  // 监听还车小时数输入
  onReturnHoursChange: function(e) {
    let value = e.detail.value;
    // 限制输入格式：只允许数字和一个小数点，小数点后最多一位
    value = value.replace(/[^\d.]/g, ''); // 只保留数字和小数点
    
    const parts = value.split('.');
    if (parts.length > 2) {
      // 如果有多个小数点，只保留第一个
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    if (parts[1] && parts[1].length > 1) {
      // 小数点后只保留一位
      value = parts[0] + '.' + parts[1].substring(0, 1);
    }

    this.setData({
      returnHours: value,
      hoursErrorTip: ''
    });
    
    this.checkCanSubmit();
  },

  // 失去焦点时进行校验和计算
  onReturnHoursBlur: function(e) {
    const value = e.detail.value;
    
    if (!value) {
      this.setData({
        showOvertimeResult: false,
        showFinalPayment: false,
        submitButtonText: '还车'
      });
      return;
    }
    
    const returnHours = parseFloat(value);
    const initialHours = this.data.orderInfo.initialHours;
    
    // 校验：不能小于出车时的仪表盘数据
    if (returnHours < initialHours) {
      this.setData({
        hoursErrorTip: `还车工作小时数不能小于出车时的${initialHours}小时`,
        showOvertimeResult: false,
        showFinalPayment: false,
        submitButtonText: '还车'
      });
      return;
    }
    
    // 清除错误提示，开始计算超时
    this.setData({
      hoursErrorTip: ''
    });
    this.calculateOvertime();
  },

  // 计算超时
  calculateOvertime: function() {
    const returnHours = parseFloat(this.data.returnHours);
    const initialHours = this.data.orderInfo.initialHours;
    const endTimestamp = this.data.orderInfo.endTimestamp;
    const dailyWorkHours = this.data.orderInfo.dailyWorkHours;
    
    if (isNaN(returnHours)) return;
    
    // 获取当前时间戳
    const currentTimestamp = Date.now();
    
    // 1. 按租期时间计算超时（预期还车时间+30分钟）
    const graceTimestamp = endTimestamp + 30 * 60 * 1000; // 加30分钟宽限期
    const timeOverMs = Math.max(0, currentTimestamp - graceTimestamp);
    const timeOvertimeDays = timeOverMs > 0 ? Math.ceil(timeOverMs / (24 * 60 * 60 * 1000)) : 0;
    
    // 2. 按工作小时数计算超时
    const totalWorkHours = returnHours - initialHours;
    const rentalDays = this.data.orderInfo.rentalDays;
    const allowedTotalHours = rentalDays * dailyWorkHours;
    const excessHours = Math.max(0, totalWorkHours - allowedTotalHours);
    const hoursOvertimeDays = excessHours > 0 ? Math.ceil(excessHours / dailyWorkHours) : 0;
    
    // 取最大值作为实际超时天数
    const finalOvertimeDays = Math.max(timeOvertimeDays, hoursOvertimeDays);
    
    // 生成详情说明
    const timeDetail = timeOvertimeDays > 0 ? 
      `预期还车时间：${this.formatTimestamp(endTimestamp)}（含30分钟宽限期），当前时间：${this.formatTimestamp(currentTimestamp)}，超时${timeOvertimeDays}天` : 
      `预期还车时间：${this.formatTimestamp(endTimestamp)}（含30分钟宽限期），当前时间：${this.formatTimestamp(currentTimestamp)}，未超时`;
    
    const hoursDetail = `工作小时数：${totalWorkHours.toFixed(1)}小时，租期${rentalDays}天允许工作${allowedTotalHours}小时，${
      hoursOvertimeDays > 0 ? `超出${excessHours.toFixed(1)}小时，按8小时/天计算，超时${hoursOvertimeDays}天` : '未超时'
    }`;
    
    const finalReason = finalOvertimeDays > 0 ? 
      (timeOvertimeDays >= hoursOvertimeDays ? 
        `最终按还车时间超时计算，因为时间超时${timeOvertimeDays}天 >= 工作小时数超时${hoursOvertimeDays}天` : 
        `最终按工作小时数超时计算，因为工作小时数超时${hoursOvertimeDays}天 > 时间超时${timeOvertimeDays}天`) :
      '未超时，无需额外费用';
    
    // 计算价格
    const overtimeTotal = finalOvertimeDays * this.data.overtimePrice;
    const renewalTotal = finalOvertimeDays * this.data.renewalPrice;
    
    this.setData({
      showOvertimeResult: true,
      overtimeDays: finalOvertimeDays,
      timeOvertimeDays: timeOvertimeDays,
      hoursOvertimeDays: hoursOvertimeDays,
      currentReturnTimestamp: currentTimestamp,
      timeOvertimeDetail: timeDetail,
      hoursOvertimeDetail: hoursDetail,
      finalOvertimeReason: finalReason,
      overtimeTotalPrice: overtimeTotal,
      renewalTotalPrice: renewalTotal
    });
    
    // 根据是否超时设置按钮文本和默认选择
    if (finalOvertimeDays > 0) {
      // 默认选择超时单价
      this.setData({
        selectedPriceType: 'overtime',
        finalPaymentAmount: overtimeTotal,
        showFinalPayment: true,
        submitButtonText: '还车并支付'
      });
    } else {
      this.setData({
        selectedPriceType: '',
        finalPaymentAmount: 0,
        showFinalPayment: false,
        submitButtonText: '还车'
      });
    }
    
    this.checkCanSubmit();

    // 在控制台输出计算详情，方便调试
    console.log('超时计算详情：', {
      总工作小时数: totalWorkHours.toFixed(1),
      租期天数: rentalDays,
      允许总小时数: allowedTotalHours,
      超出小时数: excessHours.toFixed(1),
      时间超时天数: timeOvertimeDays,
      小时数超时天数: hoursOvertimeDays,
      最终超时天数: finalOvertimeDays,
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
    const { returnHours, dashboardImage, vehicleImages, hoursErrorTip, showOvertimeResult } = this.data;
    
    // 基本条件：有还车小时数、无错误提示、有仪表盘照片、有车辆照片、已显示超时计算结果
    const basicConditions = returnHours && 
                           !isNaN(parseFloat(returnHours)) && 
                           !hoursErrorTip &&
                           dashboardImage && 
                           vehicleImages.length > 0 &&
                           showOvertimeResult;
    
    this.setData({
      canSubmit: basicConditions
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
      orderId: this.data.orderInfo.id,
      returnHours: parseFloat(this.data.returnHours),
      dashboardImage: this.data.dashboardImage,
      vehicleImages: this.data.vehicleImages,
      currentReturnTimestamp: this.data.currentReturnTimestamp,
      overtimeDays: this.data.overtimeDays,
      selectedPriceType: this.data.selectedPriceType,
      finalPaymentAmount: this.data.finalPaymentAmount
    };
    
    console.log('提交数据：', submitData);
    
    // 模拟提交过程
    if (this.data.orderInfo.id === 'MOCK_ORDER_001') {
      this.mockSubmitReturn(submitData);
      return;
    }
    
    // 显示提交中
    wx.showLoading({
      title: '提交中...'
    });
    
    // 调用后端接口提交还车申请
    const that = this;
    wx.request({
      url: 'YOUR_API_BASE_URL/return/submit',
      method: 'POST',
      data: submitData,
      success: function(res) {
        if (res.data.code === 200) {
          if (res.data.data.needPayment) {
            // 需要支付
            that.processPayment(res.data.data.paymentInfo);
          } else {
            // 不需要支付，直接跳转
            wx.showToast({
              title: '提交成功',
              icon: 'success'
            });
            setTimeout(() => {
              wx.redirectTo({
                url: '/pages/return-review/return-review'
              });
            }, 1500);
          }
        } else if (res.data.code === 400 && res.data.message.includes('价格发生变化')) {
          // 价格发生变化，需要重新提交
          wx.showModal({
            title: '提示',
            content: res.data.message,
            showCancel: false,
            confirmText: '重新提交',
            success: function() {
              // 重新计算价格
              that.calculateOvertime();
            }
          });
        } else {
          wx.showToast({
            title: res.data.message || '提交失败',
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

  // 模拟提交还车申请
  mockSubmitReturn: function(submitData) {
    wx.showLoading({
      title: '提交中...'
    });
    
    // 模拟网络延迟
    setTimeout(() => {
      wx.hideLoading();
      
      if (submitData.finalPaymentAmount > 0) {
        // 需要支付，模拟支付流程
        wx.showModal({
          title: '模拟支付',
          content: `需要支付：¥${submitData.finalPaymentAmount}，是否模拟支付成功？`,
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
                  title: '还车成功',
                  content: '还车申请已提交，请等待门店审核',
                  showCancel: false,
                  success: () => {
                    // 实际项目中这里应该跳转到还车审核页面
                    console.log('跳转到还车审核页面');
                    wx.redirectTo({
                      url: '/pages/return-review/return-review'
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
      } else {
        // 不需要支付
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.showModal({
            title: '还车成功',
            content: '还车申请已提交，请等待门店审核',
            showCancel: false,
            success: () => {
              // 实际项目中这里应该跳转到还车审核页面
                wx.redirectTo({
                  url: '/pages/return-review/return-review'
                });
              
            }
          });
        }, 1500);
      }
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
            url: '/pages/return-review/return-review'
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
  }
});