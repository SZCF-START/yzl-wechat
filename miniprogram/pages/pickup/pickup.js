Page({
  data: {
    // 订单信息
    orderInfo: {
      orderId: '',
      storeName: '',
      managerName: '',
      managerPhone: '',
      carModel: '',
      rentalTime: '',
      rentalDays: 0,
      pickupTime: '',
      returnTime: '',
      price: 0
    },
    
    // 车辆列表
    vehicleList: [],
    selectedVehicleId: null,
    selectedVehicleName: '',
    selectedVehicleHours: 0,
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
    canSubmit: false,
    
    // 加载状态
    isLoading: true
  },

  onLoad: function(options) {
    // 获取订单ID
    const orderId = options.orderId;
    if (orderId) {
      this.getOrderDetailInfo(orderId);
    } else {
      wx.showToast({
        title: '订单ID缺失',
        icon: 'none'
      });
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    // 初始化车辆列表
    this.loadVehicleList(true);
  },

  // 使用数据管理器获取订单详细信息
  async getOrderDetailInfo(orderId) {
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      this.setData({ isLoading: true });
      
      // 首先尝试从缓存获取订单详情
      let orderDetail = DataManager.getCachedOrderData(orderId);
      
      if (orderDetail) {
        console.log('从缓存获取订单详情:', orderDetail);
        this.processOrderDetail(orderDetail);
      } else {
        // 缓存中没有，从API获取
        console.log('缓存中没有订单详情，从API获取...');
        orderDetail = await this.fetchOrderDetailFromAPI(orderId);
        
        if (orderDetail) {
          // 缓存订单详情（5分钟过期）
          DataManager.cacheOrderData(orderId, orderDetail, 5 * 60 * 1000);
          this.processOrderDetail(orderDetail);
        } else {
          throw new Error('获取订单详情失败');
        }
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
      wx.showToast({
        title: '获取订单信息失败',
        icon: 'none'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 从API获取订单详情（模拟）
  fetchOrderDetailFromAPI(orderId) {
    return new Promise((resolve, reject) => {
      // 模拟API请求延迟
      setTimeout(() => {
        // 模拟根据orderId获取对应的订单详情
        const mockOrderDetail = this.getMockOrderDetail(orderId);
        
        if (mockOrderDetail) {
          resolve(mockOrderDetail);
        } else {
          reject(new Error('订单不存在'));
        }
      }, 800);
    });
  },

  // 模拟订单详情数据（与order页面数据保持一致）
  getMockOrderDetail(orderId) {
    // 这里应该根据实际的orderId返回对应的订单详情
    // 为了演示，我们创建一个基于orderId的模拟数据
    
    const orderIdParts = orderId.split('_');
    const orderType = orderIdParts[4] || '0';
    const orderStatus = orderIdParts[5] || '0';
    
    // 模拟门店数据
    const stores = [
      {
        name: "重庆渝北区分店",
        address: "重庆市渝北区龙溪街道",
        managerName: "张经理",
        managerPhone: "138****8888"
      },
      {
        name: "长沙岳麓区店",
        address: "长沙市岳麓区桐梓坡路", 
        managerName: "李经理",
        managerPhone: "139****6666"
      },
      {
        name: "长沙火车南站店",
        address: "长沙市雨花区劳动东路",
        managerName: "王经理", 
        managerPhone: "187****1234"
      }
    ];
    
    // 模拟设备数据
    const equipmentModels = [
      "现代挖掘机R225LC-9T",
      "三一SY16C", 
      "徐工XE27E",
      "柳工915E",
      "临工LG6150"
    ];
    
    const randomStoreIndex = Math.abs(orderId.length) % stores.length;
    const randomEquipmentIndex = Math.abs(orderId.length) % equipmentModels.length;
    const selectedStore = stores[randomStoreIndex];
    const selectedEquipment = equipmentModels[randomEquipmentIndex];
    
    // 生成时间数据
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5));
    const endDate = new Date(startDate);
    const rentalDays = Math.floor(Math.random() * 7) + 1;
    endDate.setDate(startDate.getDate() + rentalDays);
    
    const formatDate = (date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = Math.floor(Math.random() * 8) + 8; // 8-16点
      return `${month < 10 ? '0' + month : month}月${day < 10 ? '0' + day : day}日 ${hour}:00`;
    };
    
    const price = Math.floor(Math.random() * 300) + 100;
    
    return {
      orderId: orderId,
      storeName: selectedStore.name,
      storeAddress: selectedStore.address,
      managerName: selectedStore.managerName,
      managerPhone: selectedStore.managerPhone,
      carModel: selectedEquipment,
      equipmentModel: selectedEquipment,
      pickupTime: formatDate(startDate),
      returnTime: formatDate(endDate),
      rentalTime: `${formatDate(startDate)}——${formatDate(endDate)}`,
      rentalDays: rentalDays,
      originalStartTime: startDate.getTime(),
      originalEndTime: endDate.getTime(),
      orderStatus: parseInt(orderStatus),
      orderType: parseInt(orderType),
      price: price,
      renewPrice: 800,
      memberRenewPrice: 640,
      // 预约中状态的订单还没有仪表盘数据
      dashboardData: null,
      pickupPhotos: [],
      returnPhotos: [],
      dataVersion: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      lastUpdateTime: Date.now()
    };
  },

  // 处理订单详情数据
  processOrderDetail(orderDetail) {
    console.log('处理订单详情:', orderDetail);
    
    // 验证订单状态，只有预约中状态的订单才能取车
    if (orderDetail.orderStatus !== 0) {
      wx.showModal({
        title: '提示',
        content: '只有预约中的订单才能进行取车操作',
        showCancel: false,
        success: () => {
          wx.navigateBack();
        }
      });
      return;
    }
    
    this.setData({
      orderInfo: {
        orderId: orderDetail.orderId,
        storeName: orderDetail.storeName,
        managerName: orderDetail.managerName,
        managerPhone: orderDetail.managerPhone,
        carModel: orderDetail.carModel || orderDetail.equipmentModel,
        rentalTime: orderDetail.rentalTime,
        rentalDays: orderDetail.rentalDays,
        pickupTime: orderDetail.pickupTime,
        returnTime: orderDetail.returnTime,
        price: orderDetail.price
      }
    });
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
    const carModel = this.data.orderInfo.carModel || '三一SY16C';
    
    // 根据订单中的车型生成对应的可用车辆
    const baseModel = carModel.includes('三一') ? '三一SY16C' : 
                     carModel.includes('现代') ? '现代R225LC-9T' :
                     carModel.includes('徐工') ? '徐工XE27E' :
                     carModel.includes('柳工') ? '柳工915E' : '三一SY16C';
    
    const mockData = [
      {
        id: `vehicle_${page}_1`,
        name: `${baseModel}-001`,
        image: '../../assets/rsg.png',
        year: 2022,
        workHours: 1250.5,
        fuelLevel: 85,
        status: '可用'
      },
      {
        id: `vehicle_${page}_2`,
        name: `${baseModel}-002`,
        image: '../../assets/rsg.png',
        year: 2023,
        workHours: 892.3,
        fuelLevel: 92,
        status: '可用'
      },
      {
        id: `vehicle_${page}_3`,
        name: `${baseModel}-003`,
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
    const selectedVehicle = this.data.vehicleList.find(vehicle => vehicle.id === vehicleId);
    
    if (selectedVehicle) {
      this.setData({
        selectedVehicleId: vehicleId,
        selectedVehicleName: selectedVehicle.name,
        selectedVehicleHours: selectedVehicle.workHours,
        // 重置仪表盘数据和图片，因为换了车辆
        dashboardHours: '',
        uploadedImages: []
      });
      this.checkCanSubmit();
    }
  },

  // 获取选中车辆的信息
  getSelectedVehicleInfo: function() {
    const { selectedVehicleId, vehicleList } = this.data;
    if (!selectedVehicleId || !vehicleList.length) return null;
    
    return vehicleList.find(vehicle => vehicle.id === selectedVehicleId);
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
    
    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 提取图片临时路径
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
        console.log('选择图片成功:', tempFilePaths);
        
        this.setData({
          uploadedImages: [...this.data.uploadedImages, ...tempFilePaths]
        });
        this.checkCanSubmit();
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
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

  // 检查是否可以提交 - 简化逻辑，只检查基本条件
  checkCanSubmit: function() {
    const { selectedVehicleId, dashboardHours, uploadedImages } = this.data;
    
    // 检查是否满足基本提交条件
    const hasSelectedVehicle = !!selectedVehicleId;
    const hasDashboardData = dashboardHours && dashboardHours.trim() !== '';
    const hasImages = uploadedImages.length > 0;
    
    // 验证仪表盘数据格式
    const isValidDashboard = /^\d+(\.\d)?$/.test(dashboardHours);
    
    // 只要填写了数据和上传了图片就激活按钮，具体验证在提交时进行
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

  // 提交取车 - 在这里进行工作小时数验证
  submitPickup: function() {
    if (!this.data.canSubmit) {
      this.showSubmitError();
      return;
    }

    // 验证工作小时数是否大于等于车辆当前工作小时数
    const inputHours = parseFloat(this.data.dashboardHours);
    const vehicleHours = this.data.selectedVehicleHours;
    
    if (inputHours < vehicleHours) {
      wx.showModal({
        title: '工作小时数不符合要求',
        content: `输入的工作小时数(${inputHours}h)不能小于车辆当前工作小时数(${vehicleHours}h)，请重新输入。`,
        showCancel: false,
        confirmText: '重新输入',
        confirmColor: '#ff7200'
      });
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '提交中...'
    });

    // 准备提交数据
    const submitData = {
      orderId: this.data.orderInfo.orderId,
      vehicleId: this.data.selectedVehicleId,
      vehicleName: this.data.selectedVehicleName,
      dashboardHours: inputHours,
      images: this.data.uploadedImages,
      timestamp: Date.now()
    };

    console.log('提交取车数据:', submitData);

    // 模拟API请求
    setTimeout(() => {
      this.processPickupSuccess(submitData);
    }, 2000);
  },

  // 处理取车成功
  processPickupSuccess: function(submitData) {
    wx.hideLoading();
    
    // 更新缓存中的订单状态
    this.updateOrderCacheAfterPickup(submitData);
    
    // 显示成功提示
    wx.showToast({
      title: '出车成功',
      icon: 'success',
      duration: 1500,
      success: () => {
        setTimeout(() => {
          // 跳转到出车成功页面
          wx.redirectTo({
            url: `/pages/pickup-success/pickup-success?orderId=${submitData.orderId}&vehicleId=${submitData.vehicleId}`
          });
        }, 1500);
      }
    });
  },

  // 更新缓存中的订单状态
  updateOrderCacheAfterPickup: function(submitData) {
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      const orderId = submitData.orderId;
      let orderDetail = DataManager.getCachedOrderData(orderId);
      
      if (orderDetail) {
        // 更新订单状态为租赁中
        const updatedOrderDetail = {
          ...orderDetail,
          orderStatus: 1, // 租赁中
          dashboardData: {
            pickupReading: submitData.dashboardHours,
            currentReading: submitData.dashboardHours,
            returnReading: null,
            fuelLevel: Math.floor(Math.random() * 100),
            lastUpdateTime: Date.now()
          },
          pickupPhotos: submitData.images.map((img, index) => ({
            url: img,
            type: ['front', 'side', 'dashboard'][index % 3],
            timestamp: Date.now()
          })),
          selectedVehicleId: submitData.vehicleId,
          lastUpdateTime: Date.now(),
          dataVersion: Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
        };
        
        // 重新缓存更新后的订单详情
        DataManager.cacheOrderData(orderId, updatedOrderDetail, 5 * 60 * 1000);
        
        console.log('已更新缓存中的订单状态:', updatedOrderDetail);
      }
    } catch (error) {
      console.error('更新订单缓存失败:', error);
    }
  },

  // 显示提交错误信息 - 简化错误提示
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
      wx.showModal({
        title: '提示',
        content: errorMsg,
        showCancel: false,
        confirmText: '我知道了',
        confirmColor: '#ff7200'
      });
    }
  },

  // 页面显示时检查数据
  onShow: function() {
    // 如果订单信息为空，可能是从其他页面返回，需要重新加载
    if (!this.data.orderInfo.orderId && !this.data.isLoading) {
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options;
      
      if (options && options.orderId) {
        this.getOrderDetailInfo(options.orderId);
      }
    }
  },

  // 页面卸载时清理资源
  onUnload: function() {
    // 清理临时图片资源等
    console.log('取车页面卸载');
  }
});