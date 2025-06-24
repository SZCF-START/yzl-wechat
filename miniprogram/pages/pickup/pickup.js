Page({
  data: {
    // 订单信息
    orderInfo: {
      storeName: '长沙先锋店',
      managerName: '张经理',
      managerPhone: '13800138000',
      carModel: '三一SY16C',
      rentalTime: '08月21日 21:00——08月28日 21:00',
      rentalDays: 7
    },
    
    // 车辆列表
    vehicleList: [],
    selectedVehicleId: null,
    hasMoreVehicles: true,
    isLoadingVehicles: false,
    vehiclePage: 1,
    vehiclePageSize: 3,
    
    // 仪表盘数据
    dashboardHours: '',
    
    // 图片上传
    uploadedImages: [],
    maxImageCount: 6,
    
    // 提交状态
    canSubmit: false
  },

  onLoad: function(options) {
    // 获取订单ID
    const orderId = options.orderId;
    if (orderId) {
      this.getOrderInfo(orderId);
    }
    
    // 初始化车辆列表
    this.loadVehicleList(true);
  },

  // 获取订单信息
  getOrderInfo: function(orderId) {
    // 模拟接口请求
    setTimeout(() => {
      // 这里可以根据订单ID获取具体的订单信息
      console.log('获取订单信息:', orderId);
      // 实际开发中这里会调用API
    }, 200);
  },

  // 加载车辆列表
  loadVehicleList: function(isRefresh = false) {
    if (this.data.isLoadingVehicles) return;
    
    this.setData({ isLoadingVehicles: true });
    
    // 模拟API请求
    setTimeout(() => {
      const mockVehicles = this.getMockVehicleData();
      
      if (isRefresh) {
        this.setData({
          vehicleList: mockVehicles,
          isLoadingVehicles: false,
          vehiclePage: 2
        });
      } else {
        this.setData({
          vehicleList: [...this.data.vehicleList, ...mockVehicles],
          isLoadingVehicles: false,
          vehiclePage: this.data.vehiclePage + 1,
          hasMoreVehicles: mockVehicles.length === this.data.vehiclePageSize
        });
      }
    }, 500);
  },

  // 模拟车辆数据
  getMockVehicleData: function() {
    const page = this.data.vehiclePage;
    const mockData = [
      {
        id: `vehicle_${page}_1`,
        name: '三一SY16C-001',
        image: '../../assets/rsg.png',
        year: 2022,
        workHours: 1250.5,
        fuelLevel: 85,
        status: '可用'
      },
      {
        id: `vehicle_${page}_2`,
        name: '三一SY16C-002',
        image: '../../assets/rsg.png',
        year: 2023,
        workHours: 892.3,
        fuelLevel: 92,
        status: '可用'
      },
      {
        id: `vehicle_${page}_3`,
        name: '三一SY16C-003',
        image: '../../assets/rsg.png',
        year: 2021,
        workHours: 1876.8,
        fuelLevel: 78,
        status: '可用'
      }
    ];
    
    // 模拟分页，第一页返回3个，后续页面可能返回更少或没有数据
    if (page === 1) {
      return mockData;
    } else if (page === 2) {
      return mockData.slice(0, 2); // 第二页返回2个
    } else {
      return []; // 第三页没有更多数据
    }
  },

  // 选择车辆
  selectVehicle: function(e) {
    const vehicleId = e.currentTarget.dataset.id;
    this.setData({
      selectedVehicleId: vehicleId
    });
    this.checkCanSubmit();
  },

  // 查看车辆详情
  viewVehicleDetails: function(e) {
    const vehicleId = e.currentTarget.dataset.id;
    console.log('查看车辆详情:', vehicleId);
    
    // 弹窗提示功能开发中
    wx.showToast({
      title: '车辆详情功能开发中',
      icon: 'none',
      duration: 2000
    });
    
    // 实际开发中跳转到车辆详情页面
    // wx.navigateTo({
    //   url: `/pages/vehicle-details/vehicle-details?vehicleId=${vehicleId}`
    // });
  },

  // 加载更多车辆
  loadMoreVehicles: function() {
    if (this.data.hasMoreVehicles && !this.data.isLoadingVehicles) {
      this.loadVehicleList(false);
    }
  },

  // 仪表盘数据输入
  onDashboardInput: function(e) {
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
      dashboardHours: value
    });
    
    this.checkCanSubmit();
  },

  // 选择图片
  chooseImage: function() {
    const remainingCount = this.data.maxImageCount - this.data.uploadedImages.length;
    console.log('点击上传图片'); // ✅调试是否点击触发
    this.setData({
      uploadedImages: [
        ...this.data.uploadedImages,
        'https://yh-file.chwhyun.cn/test/2025/2/27/3ad37d272788c112eea181f7f4aea19(1)_1894946277376921601.jpg'
      ]
    });
    this.checkCanSubmit();
    // wx.chooseMedia({
    //   count: remainingCount,
    //   mediaType: ['image'],
    //   sizeType: ['compressed'],
    //   sourceType: ['album', 'camera'],
    //   success: (res) => {
    //     // 提取图片临时路径
    //     const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
    //     console.log("9999999999900000000");
    //     this.setData({
    //       uploadedImages: [...this.data.uploadedImages, ...tempFilePaths]
    //     });
    //     this.checkCanSubmit();
    //   },
    //   fail: (err) => {
    //     console.error('选择失败:', err); // 看控制台是否报错
    //   },
    //   complete: () => {
    //     console.log('chooseMedia调用完成');
    //   }
      
    // });
  },  

  // 删除图片
  deleteImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.uploadedImages;
    images.splice(index, 1);
    
    this.setData({
      uploadedImages: images
    });
    
    this.checkCanSubmit();
  },

  // 检查是否可以提交
  checkCanSubmit: function() {
    const { selectedVehicleId, dashboardHours, uploadedImages } = this.data;
    
    // 检查是否满足提交条件
    const hasSelectedVehicle = !!selectedVehicleId;
    const hasDashboardData = dashboardHours && dashboardHours.trim() !== '';
    const hasImages = uploadedImages.length > 0;
    
    // 验证仪表盘数据格式
    const isValidDashboard = /^\d+(\.\d)?$/.test(dashboardHours);
    
    const canSubmit = hasSelectedVehicle && hasDashboardData && isValidDashboard && hasImages;
    
    this.setData({
      canSubmit: canSubmit
    });
  },

  // 拨打电话
  callManager: function(e) {
    const phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        console.log('拨打电话成功');
      },
      fail: (err) => {
        console.log('拨打电话失败:', err);
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  // 提交取车
  submitPickup: function() {
    if (!this.data.canSubmit) {
      this.showSubmitError();
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '提交中...'
    });

    // 准备提交数据
    const submitData = {
      vehicleId: this.data.selectedVehicleId,
      dashboardHours: parseFloat(this.data.dashboardHours),
      images: this.data.uploadedImages
    };

    console.log('提交取车数据:', submitData);

    // 模拟API请求
    setTimeout(() => {
      wx.hideLoading();
      
      // 模拟成功响应
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(() => {
            // 跳转到出车成功页面
            wx.redirectTo({
              url: '/pages/pickup-success/pickup-success'
            });
          }, 1500);
        }
      });
    }, 2000);
  },

  // 显示提交错误信息
  showSubmitError: function() {
    const { selectedVehicleId, dashboardHours, uploadedImages } = this.data;
    
    let errorMsg = '';
    if (!selectedVehicleId) {
      errorMsg = '请选择车辆';
    } else if (!dashboardHours || dashboardHours.trim() === '') {
      errorMsg = '请输入仪表盘数据';
    } else if (!/^\d+(\.\d)?$/.test(dashboardHours)) {
      errorMsg = '仪表盘数据格式不正确';
    } else if (uploadedImages.length === 0) {
      errorMsg = '请上传车辆图片';
    }
    
    if (errorMsg) {
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
    }
  }
});