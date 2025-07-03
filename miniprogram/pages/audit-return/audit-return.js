// audit-return.js - 还车待审核页面（优化版）
const loginCheck = require('../../behaviors/loginCheck.js');

Page({
  behaviors: [loginCheck],
  data: {
    // 页面状态
    loading: true,
    recordId: '',
    
    // 出车记录基本信息
    recordInfo: {},
    
    // 仪表盘数据
    dashboardData: {
      departure: {
        value: 0,
        image: '',
        timestamp: ''
      },
      return: {
        value: 0,
        image: '',
        timestamp: '',
        originalValue: 0,
        originalImage: ''
      }
    },
    
    // 还车时间
    returnTime: '',
    originalReturnTime: '',
    
    // 超时计算结果
    originalOvertimeResult: {}, // 用户提交的原始超时结果
    currentOvertimeResult: {}, // 当前计算的超时结果
    
    // 修改状态
    hasModification: false,
    modificationData: {
      dashboardModified: false,
      timeModified: false,
      newDashboardValue: '',
      newDashboardImages: [],
      newReturnTime: ''
    },
    
    // 交互状态
    showImagePreview: false,
    previewImage: '',
    showTimeSelector: false,
    showDashboardModify: false,
    showTooltip: false,
    tooltipData: {},
    selectedDate: '',
    selectedTime: '',
    
    // 订单链相关
    expandedChainIds: [],
    
    // 表单验证
    errors: {},
    
    // 计算属性 - 为了避免复杂表达式
    displayDashboardValue: '',
    displayReturnTime: '',
    displayPreviewImage: '',
    displayCurrentWorkingHours: '',
    additionalOvertimeDays: 0,
    overtimePrice: 0,
    renewalPrice: 0,
    selectedPriceType: 'overtime',
    finalOvertimeFee: 0,
    renewalFinalOvertimeFee: 0,
    showModificationSection: false,
    showSimpleResult: false,
    
    // 订单链展开状态
    isOrderChainExpanded: false
  },

  onLoad: function(options) {
    if (!this.checkLogin()) {
      return;
    }
    
    if (options.recordId) {
      this.setData({
        recordId: options.recordId
      });
      this.loadAuditData();
    } else {
      wx.showToast({
        title: '记录ID不能为空',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // ==================== 数据加载 ====================
  
  loadAuditData: function() {
    wx.showLoading({ title: '加载中...' });
    
    // 模拟API调用
    setTimeout(() => {
      const mockData = this.generateMockAuditData();
      this.setData({
        recordInfo: mockData.recordInfo,
        dashboardData: mockData.dashboardData,
        returnTime: mockData.returnTime,
        originalReturnTime: mockData.returnTime,
        loading: false
      });
      
      // 计算超时情况
      this.calculateOriginalOvertime();
      this.calculateCurrentOvertime();
      this.updateCalculatedData();
      wx.hideLoading();
    }, 1000);
  },

  generateMockAuditData: function() {
    const now = new Date();
    const departureTime = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3天前
    const plannedReturnTime = new Date(departureTime.getTime() + 3 * 24 * 60 * 60 * 1000); // 计划还车时间
    const actualReturnTime = new Date(plannedReturnTime.getTime() + 4 * 60 * 60 * 1000); // 实际还车时间(超时4小时)
    
    // 确保recordId是字符串类型
    const recordId = String(this.data.recordId);
    
    return {
      recordInfo: {
        id: recordId,
        carModel: '现代挖掘机R225LC-9T',
        carNumber: '京A12345',
        carImage: '../../assets/rsg.png',
        renterName: '张三',
        renterPhone: '138****8888',
        rentalDays: 3,
        startTime: this.formatDateTime(departureTime),
        plannedEndTime: this.formatDateTime(plannedReturnTime),
        overtimePrice: 35, // 超时单价35元/小时
        renewalPrice: 25, // 续租单价25元/小时
        selectedPriceType: 'overtime', // 用户选择的单价类型 'overtime' | 'renewal'
        // 订单链信息
        hasOrderChain: true,
        renewalCount: 1,
        orderChainDetails: [
          {
            orderId: `ORDER_${recordId}`,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: this.formatDateTime(departureTime),
            endTime: this.formatDateTime(plannedReturnTime),
            isOvertime: false,
            overtimeHours: 0,
            createTime: this.formatCreateTime(new Date(departureTime.getTime() - 24*60*60*1000))
          },
          {
            orderId: `ORDER_${recordId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "还车审核中",
            price: 400,
            rentalDays: 2,
            startTime: this.formatDateTime(plannedReturnTime),
            endTime: this.formatDateTime(new Date(plannedReturnTime.getTime() + 2*24*60*60*1000)),
            isOvertime: true,
            overtimeHours: 4,
            overtimeFee: 140,
            createTime: this.formatCreateTime(new Date(plannedReturnTime.getTime() - 1*60*60*1000))
          }
        ]
      },
      dashboardData: {
        departure: {
          value: 1250,
          image: '../../assets/dashboard1.jpg',
          timestamp: this.formatDateTime(departureTime)
        },
        return: {
          value: 1280,
          image: '../../assets/dashboard2.jpg',
          timestamp: this.formatDateTime(actualReturnTime),
          originalValue: 1280,
          originalImage: '../../assets/dashboard2.jpg'
        }
      },
      returnTime: this.formatReturnTime(actualReturnTime)
    };
  },

  // ==================== 计算属性更新 ====================
  
  updateCalculatedData: function() {
    const { dashboardData, modificationData, returnTime, currentOvertimeResult, originalOvertimeResult, recordInfo, hasModification, expandedChainIds } = this.data;
    
    // 计算显示的仪表盘数值（确保精度）
    const displayDashboardValue = modificationData.dashboardModified 
      ? this.formatNumber(parseFloat(modificationData.newDashboardValue), 1)
      : dashboardData.return.value;
    
    // 计算显示的还车时间
    const displayReturnTime = modificationData.timeModified 
      ? modificationData.newReturnTime 
      : returnTime;
    
    // 计算显示的预览图片
    const displayPreviewImage = modificationData.dashboardModified 
      ? (modificationData.newDashboardImages[0] || dashboardData.return.image)
      : dashboardData.return.image;
    
    // 计算当前工作小时数（确保精度）
    const displayCurrentWorkingHours = currentOvertimeResult.calculation 
      ? this.formatNumber(currentOvertimeResult.calculation.workingHours, 1)
      : 0;
    
    // 计算额外超时天数
    const additionalOvertimeDays = (currentOvertimeResult.finalOvertime || 0) - (originalOvertimeResult.finalOvertime || 0);
    
    // 计算超时价格（确保精度）
    const overtimePrice = this.formatNumber((recordInfo.overtimePrice || 0) * 8, 2);
    const renewalPrice = this.formatNumber((recordInfo.renewalPrice || 0) * 8, 2);
    
    // 获取当前选择的价格类型
    const selectedPriceType = currentOvertimeResult.calculation ? currentOvertimeResult.calculation.priceType : 'overtime';
    
    // 计算最终超时费用（确保精度）
    const finalOvertimeFee = this.formatNumber(additionalOvertimeDays * overtimePrice, 2);
    const renewalFinalOvertimeFee = this.formatNumber(additionalOvertimeDays * renewalPrice, 2);
    
    // 计算显示区域
    const showModificationSection = hasModification;
    const showSimpleResult = !hasModification;
    
    // 计算订单链展开状态
    const isOrderChainExpanded = expandedChainIds.includes(recordInfo.id);
    
    this.setData({
      displayDashboardValue,
      displayReturnTime,
      displayPreviewImage,
      displayCurrentWorkingHours,
      additionalOvertimeDays,
      overtimePrice,
      renewalPrice,
      selectedPriceType,
      finalOvertimeFee,
      renewalFinalOvertimeFee,
      showModificationSection,
      showSimpleResult,
      isOrderChainExpanded
    });
  },

  // ==================== 超时计算 ====================
  
  // 计算用户原始提交的超时情况
  calculateOriginalOvertime: function() {
    const { recordInfo, dashboardData, returnTime } = this.data;
    
    const originalOvertimeResult = this.performOvertimeCalculation(
      dashboardData.departure.value,
      dashboardData.return.originalValue,
      returnTime,
      recordInfo
    );
    
    this.setData({ originalOvertimeResult });
  },
  
  // 计算当前的超时情况（可能包含修改）
  calculateCurrentOvertime: function() {
    const { recordInfo, dashboardData, returnTime, modificationData } = this.data;
    
    // 获取当前使用的数据（可能是修改后的）
    const currentDashboardValue = modificationData.dashboardModified 
      ? parseFloat(modificationData.newDashboardValue) 
      : dashboardData.return.value;
    
    const currentReturnTime = modificationData.timeModified 
      ? modificationData.newReturnTime 
      : returnTime;
    
    const currentOvertimeResult = this.performOvertimeCalculation(
      dashboardData.departure.value,
      currentDashboardValue,
      currentReturnTime,
      recordInfo
    );
    
    this.setData({ currentOvertimeResult });
  },
  
  // 执行超时计算的核心逻辑
  performOvertimeCalculation: function(departureValue, returnValue, returnTime, recordInfo) {
    // 计算工作小时数超时 - 使用精度控制
    const workingHours = this.formatNumber(returnValue - departureValue, 1);
    const purchasedHours = recordInfo.rentalDays * 8;
    const workingHoursOvertime = Math.max(0, this.formatNumber(workingHours - purchasedHours, 1));
    const workingOvertimeDays = workingHoursOvertime > 0 ? Math.ceil(workingHoursOvertime / 8) : 0;
    
    // 计算时间超时
    const plannedEndTime = new Date(this.parseReturnTime(recordInfo.plannedEndTime));
    const actualEndTime = new Date(this.parseReturnTime(returnTime));
    const timeDiffMinutes = (actualEndTime - plannedEndTime) / (1000 * 60);
    const timeOvertime = Math.max(0, timeDiffMinutes - 30); // 30分钟宽限期
    const timeOvertimeDays = timeOvertime > 0 ? Math.ceil(timeOvertime / (24 * 60)) : 0;
    
    // 确定最终超时天数（取两者最大值）
    const finalOvertimeDays = Math.max(workingOvertimeDays, timeOvertimeDays);
    
    // 根据用户选择的单价类型计算费用
    const selectedPrice = recordInfo.selectedPriceType === 'renewal' 
      ? recordInfo.renewalPrice 
      : recordInfo.overtimePrice;
    
    const totalFee = this.formatNumber(finalOvertimeDays * selectedPrice * 8, 2); // 按小时计算，一天8小时
    
    return {
      workingHoursOvertime: this.formatNumber(workingHoursOvertime, 1),
      timeOvertime: timeOvertime,
      finalOvertime: finalOvertimeDays,
      totalFee: totalFee,
      calculation: {
        workingHours: this.formatNumber(workingHours, 1),
        purchasedHours: purchasedHours,
        workingOvertimeDays: workingOvertimeDays,
        timeDiffMinutes: timeDiffMinutes,
        timeOvertimeDays: timeOvertimeDays,
        selectedPrice: selectedPrice,
        priceType: recordInfo.selectedPriceType
      }
    };
  },

  // ==================== 图片预览 ====================
  
  previewImages: function(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      showImagePreview: true,
      previewImage: type === 'departure' ? this.data.dashboardData.departure.image : this.data.displayPreviewImage
    });
  },

  closeImagePreview: function() {
    this.setData({
      showImagePreview: false,
      previewImage: ''
    });
  },

  // ==================== 修改数据 ====================
  
  modifyDashboard: function() {
    this.setData({
      showDashboardModify: true,
      'modificationData.newDashboardValue': this.data.dashboardData.return.value.toString(),
      'modificationData.newDashboardImages': [] // 清空图片，不设置默认图片
    });
  },
  
  closeDashboardModifyModal: function() {
    const that = this;
    
    // 检查是否有未保存的修改
    const hasUnsavedChanges = this.data.modificationData.newDashboardValue !== this.data.dashboardData.return.value.toString() ||
                             this.data.modificationData.newDashboardImages.length > 0;
    
    if (hasUnsavedChanges) {
      wx.showModal({
        title: '确认关闭',
        content: '您有未保存的修改，确定要关闭吗？',
        confirmText: '确定关闭',
        cancelText: '继续编辑',
        confirmColor: '#dc3545',
        success: function(res) {
          if (res.confirm) {
            that.setData({
              showDashboardModify: false,
              'modificationData.newDashboardValue': that.data.dashboardData.return.value.toString(),
              'modificationData.newDashboardImages': []
            });
          }
        }
      });
    } else {
      this.setData({
        showDashboardModify: false
      });
    }
  },
  
  confirmDashboardModify: function() {
    // 格式化输入值
    let inputValue = this.data.modificationData.newDashboardValue;
    const newValue = this.formatNumber(parseFloat(inputValue), 1);
    const originalValue = this.data.dashboardData.return.value;
    
    // 验证输入值
    if (isNaN(newValue) || newValue <= 0) {
      wx.showToast({
        title: '请输入有效的数值',
        icon: 'none'
      });
      return;
    }
    
    // 验证是否上传了图片
    if (this.data.modificationData.newDashboardImages.length === 0) {
      wx.showToast({
        title: '请上传实际仪表盘照片',
        icon: 'none'
      });
      return;
    }
    
    // 如果修改的数据比原来小，需要确认
    if (newValue < originalValue) {
      const that = this;
      wx.showModal({
        title: '数据异常提醒',
        content: `修改后的数据(${newValue}h)比原数据(${originalValue}h)小，这可能表示数据有误。确定要修改吗？`,
        confirmText: '确定修改',
        cancelText: '重新检查',
        confirmColor: '#ff7200',
        success: function(res) {
          if (res.confirm) {
            that.performDashboardModify(newValue);
          }
        }
      });
    } else {
      this.performDashboardModify(newValue);
    }
  },

  // 执行仪表盘修改
  performDashboardModify: function(newValue) {
    // 确保数值精度正确
    const formattedValue = this.formatNumber(newValue, 1);
    
    this.setData({
      showDashboardModify: false,
      'modificationData.dashboardModified': true,
      'modificationData.newDashboardValue': formattedValue.toString(),
      hasModification: true
    });
    
    // 重新计算超时
    this.calculateCurrentOvertime();
    this.updateCalculatedData();
    
    wx.showToast({
      title: '仪表盘数据已修改',
      icon: 'success'
    });
  },

  // 格式化数字，避免精度问题
  formatNumber: function(num, decimals = 1) {
    if (isNaN(num) || num === null || num === undefined) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
  },

  onDashboardInput: function(e) {
    let value = e.detail.value;
    
    // 只允许输入数字和小数点
    value = value.replace(/[^\d.]/g, '');
    
    // 防止多个小数点
    const dotIndex = value.indexOf('.');
    if (dotIndex !== -1) {
      value = value.substring(0, dotIndex + 1) + value.substring(dotIndex + 1).replace(/\./g, '');
      
      // 限制小数位数为1位
      if (value.length > dotIndex + 2) {
        value = value.substring(0, dotIndex + 2);
      }
    }
    
    // 如果输入完整，格式化数值避免精度问题
    if (value && value !== '' && !value.endsWith('.')) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        value = this.formatNumber(numValue, 1).toString();
      }
    }
    
    this.setData({
      'modificationData.newDashboardValue': value
    });
  },

  uploadDashboardImage: function() {
    const that = this;
    wx.chooseImage({
      count: 1, // 只能选择一张图片
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        
        // 显示loading
        wx.showLoading({
          title: '上传中...'
        });
        
        // 模拟上传过程
        setTimeout(() => {
          that.setData({
            'modificationData.newDashboardImages': [tempFilePath]
          });
          wx.hideLoading();
          wx.showToast({
            title: '图片上传成功',
            icon: 'success'
          });
        }, 1000);
      },
      fail: function(err) {
        console.error('选择图片失败：', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  deleteDashboardImage: function(e) {
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: '#dc3545',
      success: function(res) {
        if (res.confirm) {
          that.setData({
            'modificationData.newDashboardImages': []
          });
          wx.showToast({
            title: '图片已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  modifyReturnTime: function() {
    const returnTime = new Date(this.parseReturnTime(this.data.returnTime));
    const dateStr = returnTime.getFullYear() + '-' + 
                   String(returnTime.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(returnTime.getDate()).padStart(2, '0');
    const timeStr = String(returnTime.getHours()).padStart(2, '0') + ':' + 
                   String(returnTime.getMinutes()).padStart(2, '0');
    
    this.setData({
      showTimeSelector: true,
      selectedDate: dateStr,
      selectedTime: timeStr
    });
  },

  onDateChange: function(e) {
    this.setData({
      selectedDate: e.detail.value
    });
  },

  onTimeChange: function(e) {
    this.setData({
      selectedTime: e.detail.value
    });
  },

  confirmTimeChange: function() {
    const { selectedDate, selectedTime } = this.data;
    const newDateTime = new Date(selectedDate + ' ' + selectedTime);
    const formattedTime = this.formatReturnTime(newDateTime);
    
    this.setData({
      'modificationData.newReturnTime': formattedTime,
      'modificationData.timeModified': true,
      showTimeSelector: false,
      hasModification: true
    });
    
    // 重新计算超时
    this.calculateCurrentOvertime();
    this.updateCalculatedData();
  },

  cancelTimeChange: function() {
    this.setData({
      showTimeSelector: false
    });
  },

  // ==================== 价格类型选择 ====================
  
  selectPriceType: function(e) {
    const priceType = e.currentTarget.dataset.type;
    const currentResult = { ...this.data.currentOvertimeResult };
    currentResult.calculation.priceType = priceType;
    currentResult.calculation.selectedPrice = priceType === 'overtime' 
      ? this.data.recordInfo.overtimePrice 
      : this.data.recordInfo.renewalPrice;
    currentResult.totalFee = currentResult.finalOvertime * currentResult.calculation.selectedPrice * 8;
    
    this.setData({
      currentOvertimeResult: currentResult
    });
    
    this.updateCalculatedData();
  },

  // ==================== 帮助提示 ====================
  
  showTooltip: function(e) {
    const type = e.currentTarget.dataset.type;
    let tooltipData = {};
    
    switch(type) {
      case 'working':
        tooltipData = {
          title: '工作小时数超时计算',
          content: '计算公式：(修改后工作小时数 - 购买的工作小时数) ÷ 8小时/天，不足一天按一天计算。\n\n例如：超出10小时 ÷ 8 = 1.25天，按2天计算。'
        };
        break;
      case 'time':
        tooltipData = {
          title: '还车时间超时计算',
          content: '计算公式：(实际还车时间 - 计划还车时间 - 30分钟宽限期) ÷ 24小时/天，不足一天按一天计算。\n\n例如：超时25小时 ÷ 24 = 1.04天，按2天计算。'
        };
        break;
      case 'final':
        tooltipData = {
          title: '最终超时天数计算',
          content: '取工作小时数超时天数和还车时间超时天数中的较大值作为最终超时天数。\n\n这样确保用户按照实际使用情况和时间情况中更严重的一项来计费。'
        };
        break;
    }
    
    this.setData({
      showTooltip: true,
      tooltipData: tooltipData
    });
  },

  closeTooltip: function() {
    this.setData({
      showTooltip: false,
      tooltipData: {}
    });
  },

  // ==================== 审核提交 ====================
  
  submitAudit: function() {
    const that = this;
    
    let confirmContent = '确认审核完毕并提交吗？';
    if (this.data.hasModification) {
      confirmContent = '您已修改了还车数据，提交后将推送给租赁人确认。确定要提交吗？';
    }
    
    wx.showModal({
      title: '确认审核',
      content: confirmContent,
      confirmText: '确定',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          that.performAuditSubmit();
        }
      }
    });
  },

  performAuditSubmit: function() {
    wx.showLoading({ title: '提交中...' });
    
    const submitData = {
      recordId: this.data.recordId,
      hasModification: this.data.hasModification,
      modificationData: this.data.modificationData,
      originalOvertimeResult: this.data.originalOvertimeResult,
      currentOvertimeResult: this.data.currentOvertimeResult,
      auditTime: new Date().toISOString(),
      auditorId: 'current_user_id'
    };
    
    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();
      
      if (this.data.hasModification) {
        wx.showToast({
          title: '修改数据已推送给租赁人',
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: '审核完毕',
          icon: 'success',
          duration: 2000
        });
      }
      
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }, 1500);
  },

  // ==================== 订单链相关 ====================
  
  // 切换订单链折叠状态
  toggleOrderChain: function(e) {
    console.log('toggleOrderChain called');
    const recordId = e.currentTarget.dataset.recordId;
    console.log('recordId:', recordId);
    
    const expandedIds = this.data.expandedChainIds;
    console.log('current expandedIds:', expandedIds);
    
    let newExpandedIds;
    let isExpanded;
    if (expandedIds.includes(recordId)) {
      newExpandedIds = expandedIds.filter(id => id !== recordId);
      isExpanded = false;
      console.log('收起订单链');
    } else {
      newExpandedIds = [...expandedIds, recordId];
      isExpanded = true;
      console.log('展开订单链');
    }
    
    console.log('new expandedIds:', newExpandedIds);
    this.setData({
      expandedChainIds: newExpandedIds,
      isOrderChainExpanded: isExpanded
    });
  },

  // ==================== 工具函数 ====================
  
  formatDateTime: function(date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  },

  formatReturnTime: function(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
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

  parseReturnTime: function(timeStr) {
    // 解析格式：2025年09月21日 21:00
    const match = timeStr.match(/(\d{4})年(\d{2})月(\d{2})日 (\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      return new Date(year, month - 1, day, hour, minute);
    }
    return new Date();
  },

  // 阻止事件冒泡
  stopPropagation: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  },

  makePhoneCall: function(e) {
    const phoneNumber = e.currentTarget.dataset.phone;
    
    wx.showModal({
      title: '拨打电话',
      content: `确定要拨打 ${phoneNumber} 吗？`,
      confirmText: '拨打',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phoneNumber,
            success: function() {
              console.log('拨打电话成功');
            },
            fail: function(err) {
              console.error('拨打电话失败：', err);
              wx.showToast({
                title: '拨打失败，请检查设备',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
});