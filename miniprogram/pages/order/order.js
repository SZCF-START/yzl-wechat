Page({
  data: {
    orderTypeList: [],     // 订单类型列表数据
    activeOrderType: 0,    // 当前选中的订单类型索引
    statusList: [],        // 订单状态列表数据
    activeStatus: 0,       // 当前选中的订单状态索引
    orderList: [],         // 订单列表数据
    pageNum: 1,            // 当前页码
    pageSize: 10,          // 每页条数
    totalCount: 0,         // 订单总条数
    totalPage: 0,          // 总页数
    isLoading: false,      // 是否正在加载中
    hasMoreOrders: true,    // 是否还有更多订单
    activeMoreId: null, // 当前展开的"更多"菜单的订单ID
  },

  onLoad: function(options) {
    // 引入数据管理工具，应用启动时清理过期缓存
    const DataManager = require('../../utils/data-manager.js');
    DataManager.cleanExpiredCache();

    // 获取订单类型数据
    this.getOrderTypeList();
    // 获取订单状态数据
    this.getOrderStatusList();
    // 获取订单列表数据
    this.getOrderList(true);
  },

  onPullDownRefresh: function() {
    this.setData({
      pageNum: 1,
      hasMoreOrders: true
    });
    this.getOrderList(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom: function() {
    if (this.data.hasMoreOrders && !this.data.isLoading) {
      this.loadMoreOrders();
    }
  },
  
  // 获取订单类型列表
  getOrderTypeList: function() {
    // 模拟接口请求获取订单类型列表
    setTimeout(() => {
      // 模拟后台返回的订单类型数据
      const orderTypeList = [
        { id: 0, name: "挖机订单" },
        { id: 1, name: "属具订单" }
      ];
      
      this.setData({
        orderTypeList: orderTypeList
      });
    }, 200);
  },
  
  // 获取订单状态列表
  getOrderStatusList: function() {
    // 模拟接口请求获取订单状态列表
    setTimeout(() => {
      // 模拟后台返回的订单状态数据
      const statusList = [
        { id: 0, name: "预约中" },
        { id: 1, name: "租赁中" },
        { id: 2, name: "已完成" },
        { id: 3, name: "已取消" }
      ];
      
      this.setData({
        statusList: statusList
      });
    }, 200);
  },
  
  // 切换订单类型
  switchOrderType: function(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type !== this.data.activeOrderType) {
      this.setData({
        activeOrderType: type,
        pageNum: 1,
        hasMoreOrders: true,
        orderList: [],
        activeMoreId: null // 关闭所有展开的菜单
      });
      this.getOrderList(true);
    }
  },
  
  // 切换订单状态
  switchStatus: function(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    if (status !== this.data.activeStatus) {
      this.setData({
        activeStatus: status,
        pageNum: 1,
        hasMoreOrders: true,
        orderList: [],
        activeMoreId: null // 关闭所有展开的菜单
      });
      this.getOrderList(true);
    }
  },
  
  // 获取订单列表
  getOrderList: function(isRefresh) {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    
    // 准备请求参数
    const params = {
      orderType: this.data.activeOrderType,
      orderStatus: this.data.activeStatus,
      pageNum: this.data.pageNum,
      pageSize: this.data.pageSize
    };
    
    // 调用数据管理工具获取订单列表
    this.getOrderListWithCache(params, isRefresh);
  },

  // 使用缓存和API获取订单列表
  async getOrderListWithCache(params, isRefresh) {
    const DataManager = require('../../utils/data-manager.js');
    
    try {
      // 为列表数据生成缓存key
      const cacheKey = `order_list_${params.orderType}_${params.orderStatus}_${params.pageNum}`;
      
      // 列表数据缓存时间较短，1分钟
      let cachedData = null;
      if (!isRefresh) {
        cachedData = DataManager.getCachedOrderData(cacheKey);
      }

      if (cachedData && !isRefresh) {
        // 使用缓存数据
        this.handleOrderListResponse(cachedData, isRefresh);
      } else {
        // 获取新数据
        const responseData = await this.fetchOrderListFromAPI(params);
        
        // 缓存列表数据（1分钟过期）
        // DataManager.cacheOrderData(cacheKey, responseData, 60 * 1000);
        
        // 同时缓存每个订单的详细信息（5分钟过期）
        // responseData.list.forEach(order => {
        //   const orderDetail = this.buildOrderDetailFromListItem(order);
        //   DataManager.cacheOrderData(order.id, orderDetail, 5 * 60 * 1000);
        // });
        
        this.handleOrderListResponse(responseData, isRefresh);
      }
    } catch (error) {
      console.error('获取订单列表失败:', error);
      this.setData({ isLoading: false });
      wx.showToast({
        title: '获取订单列表失败',
        icon: 'none'
      });
    }
  },

  // 从列表项构建订单详情数据
  buildOrderDetailFromListItem(order) {
    return {
      orderId: order.id,
      storeName: order.pickupStore,
      managerName: '张经理', // 模拟数据
      managerPhone: '138****8888', // 模拟数据
      carModel: order.carModel,
      originalStartTime: this.parseTimeToTimestamp(order.pickupTime),
      originalEndTime: this.parseTimeToTimestamp(order.returnTime),
      originalDays: order.rentalDays,
      renewPrice: 800, // 模拟续租单价
      memberRenewPrice: 640, // 模拟会员续租单价
      status: order.orderStatus,
      price: order.price,
      carImage: order.carImage
    };
  },

  // 解析时间字符串为时间戳（简化版本）
  parseTimeToTimestamp(timeStr) {
    // 将 "09月16日 21:00" 格式转换为时间戳
    const currentYear = new Date().getFullYear();
    const match = timeStr.match(/(\d{2})月(\d{2})日\s+(\d{1,2}):(\d{2})/);
    if (match) {
      const [, month, day, hour, minute] = match;
      return new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).getTime();
    }
    return Date.now();
  },

  // 从API获取订单列表
  fetchOrderListFromAPI(params) {
    return new Promise((resolve) => {
      // 模拟API请求延迟
      setTimeout(() => {
        const responseData = this.getMockResponseData(params);
        resolve(responseData);
      }, 500);
    });
  },

  // 处理订单列表响应
  handleOrderListResponse(responseData, isRefresh) {
    if (isRefresh) {
      this.setData({
        orderList: responseData.list,
        isLoading: false,
        totalCount: responseData.totalCount,
        totalPage: responseData.totalPage,
        pageNum: responseData.pageNum + 1,
        hasMoreOrders: responseData.pageNum < responseData.totalPage
      });
    } else {
      // 加载更多数据
      if (responseData.list.length > 0) {
        this.setData({
          orderList: [...this.data.orderList, ...responseData.list],
          isLoading: false,
          totalCount: responseData.totalCount,
          totalPage: responseData.totalPage,
          pageNum: responseData.pageNum + 1,
          hasMoreOrders: responseData.pageNum < responseData.totalPage
        });
      } else {
        this.setData({
          isLoading: false,
          hasMoreOrders: false
        });
      }
    }
  },
  
  // 加载更多订单
  loadMoreOrders: function() {
    this.getOrderList(false);
  },
  
  // 模拟API响应数据（增加仪表盘数据和设备信息）
  getMockResponseData: function(params) {
    const { orderType, orderStatus, pageNum, pageSize } = params;
    
    // 模拟不同状态的订单数据
    const equipmentModels = [
      {
        model: "现代挖掘机R225LC-9T",
        equipmentId: "EQ001",
        brand: "现代",
        category: "挖掘机"
      },
      {
        model: "三一SY16C",
        equipmentId: "EQ002", 
        brand: "三一",
        category: "挖掘机"
      },
      {
        model: "徐工XE27E",
        equipmentId: "EQ003",
        brand: "徐工", 
        category: "挖掘机"
      },
      {
        model: "柳工915E",
        equipmentId: "EQ004",
        brand: "柳工",
        category: "挖掘机"
      },
      {
        model: "临工LG6150",
        equipmentId: "EQ005",
        brand: "临工",
        category: "装载机"
      }
    ];
    
    const stores = [
      {
        name: "重庆渝北区分店",
        storeId: "ST001",
        address: "重庆市渝北区龙溪街道",
        phone: "023-67788999"
      },
      {
        name: "长沙岳麓区店", 
        storeId: "ST002",
        address: "长沙市岳麓区桐梓坡路",
        phone: "0731-88889999"
      },
      {
        name: "长沙火车南站店",
        storeId: "ST003", 
        address: "长沙市雨花区劳动东路",
        phone: "0731-85556666"
      },
      {
        name: "长沙五一广场店",
        storeId: "ST004",
        address: "长沙市芙蓉区五一大道",
        phone: "0731-82223333"
      },
      {
        name: "长沙黄花机场店",
        storeId: "ST005", 
        address: "长沙市长沙县黄花镇",
        phone: "0731-96777888"
      }
    ];
    
    const managers = [
      { name: "张经理", phone: "138****8888", managerId: "MG001" },
      { name: "李经理", phone: "139****6666", managerId: "MG002" },
      { name: "王经理", phone: "187****1234", managerId: "MG003" },
      { name: "刘经理", phone: "150****9999", managerId: "MG004" },
      { name: "陈经理", phone: "186****5555", managerId: "MG005" }
    ];
    
    const carImages = [
      "../../assets/rsg.png", 
      "../../assets/rsg.png", 
      "../../assets/rsg.png", 
      "../../assets/rsg.png", 
      "../../assets/rsg.png"
    ];
    
    // 模拟分页数据
    let totalCount;
    if (orderType === 0) { // 挖机订单
      if (orderStatus === 0) totalCount = 35; // 预约中
      else if (orderStatus === 1) totalCount = 45; // 租赁中
      else if (orderStatus === 2) totalCount = 42; // 已完成
      else totalCount = 15; // 已取消
    } else { // 属具订单
      if (orderStatus === 0) totalCount = 20; // 预约中
      else if (orderStatus === 1) totalCount = 25; // 租赁中
      else if (orderStatus === 2) totalCount = 25; // 已完成
      else totalCount = 5; // 已取消
    }
    
    const totalPage = Math.ceil(totalCount / pageSize);
    
    let currentPageItemCount;
    if (pageNum >= totalPage) {
      currentPageItemCount = totalCount % pageSize === 0 ? pageSize : totalCount % pageSize;
    } else {
      currentPageItemCount = pageSize;
    }
    
    if (pageNum > totalPage) {
      return {
        list: [],
        pageNum: pageNum,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPage: totalPage
      };
    }
    
    const startDate = new Date();
    const mockOrders = [];
    
    // 随机生成订单数据
    for (let i = 0; i < currentPageItemCount; i++) {
      const randomEquipmentIndex = Math.floor(Math.random() * equipmentModels.length);
      const randomStoreIndex = Math.floor(Math.random() * stores.length);
      const randomManagerIndex = Math.floor(Math.random() * managers.length);
      const rentalDays = Math.floor(Math.random() * 7) + 1;
      
      const selectedEquipment = equipmentModels[randomEquipmentIndex];
      const selectedStore = stores[randomStoreIndex];
      const selectedManager = managers[randomManagerIndex];
      
      const pickupDate = new Date(startDate);
      pickupDate.setDate(startDate.getDate() + Math.floor(Math.random() * 10));
      
      const returnDate = new Date(pickupDate);
      returnDate.setDate(pickupDate.getDate() + rentalDays);
      
      const price = Math.floor(Math.random() * 300) + 100;
      
      const formatDate = (date) => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = date.getHours();
        return `${month < 10 ? '0' + month : month}月${day < 10 ? '0' + day : day}日 ${hour}:00`;
      };
      
      // 根据大状态确定实际的订单状态
      let actualOrderStatus = orderStatus;
      let statusText = "";
      
      if (orderStatus === 1) { // 租赁中大状态
        const rentalStatuses = [1, 4, 5];
        actualOrderStatus = rentalStatuses[Math.floor(Math.random() * rentalStatuses.length)];
        
        switch (actualOrderStatus) {
          case 1:
            statusText = "租赁中";
            break;
          case 4:
            statusText = "还车审核中";
            break;
          case 5:
            statusText = "待支付";
            break;
        }
      } else {
        const statusMap = {
          0: "预约中",
          2: "已完成", 
          3: "已取消"
        };
        statusText = statusMap[orderStatus];
      }
      
      const orderId = `ORDER_${Date.now()}_${i}_${pageNum}_${orderType}_${orderStatus}`;
      
      // 模拟仪表盘数据（根据订单状态）
      let dashboardData = null;
      if (actualOrderStatus >= 1) { // 已出车的订单有仪表盘数据
        dashboardData = {
          pickupReading: Math.floor(Math.random() * 10000) + 5000, // 取车时读数
          currentReading: actualOrderStatus === 1 ? Math.floor(Math.random() * 12000) + 7000 : null, // 当前读数（仅租赁中有）
          returnReading: actualOrderStatus >= 2 ? Math.floor(Math.random() * 15000) + 8000 : null, // 还车读数（已完成有）
          fuelLevel: Math.floor(Math.random() * 100), // 燃油量百分比
          lastUpdateTime: Date.now() - Math.floor(Math.random() * 3600000) // 最后更新时间
        };
      }
      
      // 模拟照片数据
      const photoData = {
        pickupPhotos: actualOrderStatus >= 1 ? [
          { url: '../../assets/pickup1.jpg', type: 'front', timestamp: pickupDate.getTime() },
          { url: '../../assets/pickup2.jpg', type: 'side', timestamp: pickupDate.getTime() },
          { url: '../../assets/pickup3.jpg', type: 'dashboard', timestamp: pickupDate.getTime() }
        ] : [],
        returnPhotos: actualOrderStatus >= 2 ? [
          { url: '../../assets/return1.jpg', type: 'front', timestamp: returnDate.getTime() },
          { url: '../../assets/return2.jpg', type: 'side', timestamp: returnDate.getTime() },
          { url: '../../assets/return3.jpg', type: 'dashboard', timestamp: returnDate.getTime() }
        ] : []
      };
      
      mockOrders.push({
        id: orderId,
        statusText: statusText,
        orderStatus: actualOrderStatus,
        displayStatus: orderStatus,
        price: price,
        
        // 设备信息
        equipmentId: selectedEquipment.equipmentId,
        equipmentModel: selectedEquipment.model,
        carModel: selectedEquipment.model, // 保持兼容性
        equipmentBrand: selectedEquipment.brand,
        equipmentCategory: selectedEquipment.category,
        carImage: carImages[randomEquipmentIndex % carImages.length],
        
        // 门店信息
        storeId: selectedStore.storeId,
        pickupStore: selectedStore.name,
        returnStore: selectedStore.name,
        storeAddress: selectedStore.address,
        storePhone: selectedStore.phone,
        
        // 管理员信息
        managerId: selectedManager.managerId,
        managerName: selectedManager.name,
        managerPhone: selectedManager.phone,
        
        // 时间信息
        pickupTime: formatDate(pickupDate),
        returnTime: formatDate(returnDate),
        rentalDays: rentalDays,
        pickupTimestamp: pickupDate.getTime(),
        returnTimestamp: returnDate.getTime(),
        
        // 业务数据
        orderType: orderType,
        isLeftAligned: false,
        
        // 仪表盘数据
        dashboardData: dashboardData,
        
        // 照片数据
        pickupPhotos: photoData.pickupPhotos,
        returnPhotos: photoData.returnPhotos,
        
        // 续租相关
        renewPrice: 800, // 标准续租价格
        memberRenewPrice: 640, // 会员续租价格
        
        // 额外业务字段
        operatorInfo: actualOrderStatus >= 1 ? {
          name: "操作员" + (i + 1),
          phone: "159****" + String(1000 + i).substr(1),
          certNo: "操作证" + String(10000 + i).substr(1)
        } : null,
        
        // 版本控制
        dataVersion: this.generateDataVersion(),
        lastUpdateTime: Date.now()
      });
    }
    
    return {
      list: mockOrders,
      pageNum: pageNum,
      pageSize: pageSize,
      totalCount: totalCount,
      totalPage: totalPage
    };
  },

  // 生成数据版本号
  generateDataVersion() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },
  
  /**
   * 显示更多操作菜单
   */
  showMoreActions(e) {
    const orderId = e.currentTarget.dataset.id;
    const currentActiveId = this.data.activeMoreId;
    
    if (currentActiveId === orderId) {
      this.setData({
        activeMoreId: null
      });
      return;
    }

    this.setData({
      activeMoreId: orderId
    });

    setTimeout(() => {
      this.calculateDropdownPosition(orderId);
    }, 50);
  },

  /**
   * 计算弹窗位置，防止超出屏幕
   */
  calculateDropdownPosition(orderId) {
    const query = wx.createSelectorQuery();
    const windowInfo = wx.getWindowInfo();
    const screenWidth = windowInfo.windowWidth;
    
    query.selectAll('.more-action').boundingClientRect((rects) => {
      if (rects && rects.length > 0) {
        const targetIndex = this.data.orderList.findIndex(item => item.id === orderId);
        
        if (targetIndex >= 0 && rects[targetIndex]) {
          const buttonRect = rects[targetIndex];
          const dropdownWidth = 200;
          const dropdownWidthPx = dropdownWidth * (screenWidth / 750);
          
          const willOverflow = (buttonRect.right + dropdownWidthPx) > screenWidth;
          
          const updatedOrderList = this.data.orderList.map((item, index) => {
            if (item.id === orderId) {
              return {
                ...item,
                isLeftAligned: willOverflow
              };
            }
            return item;
          });
          
          this.setData({
            orderList: updatedOrderList
          });
        }
      }
    }).exec();
  },

  /**
   * 关闭所有弹窗
   */
  closeAllDropdowns() {
    this.setData({
      activeMoreId: null
    });
  },

  /**
   * 处理页面点击事件
   */
  onPageTap() {
    if (this.data.activeMoreId) {
      this.closeAllDropdowns();
    }
  },

  /**
   * 查看车辆详情
   */
  viewCarDetails(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    
    console.log('查看车辆详情:', orderId);
    wx.showToast({
      title: '功能开发中,敬请期待!',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 修改订单
   */
  modifyOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    
    console.log('修改订单:', orderId);
    wx.showToast({
      title: '功能开发中,敬请期待!',
      icon: 'none',
      duration: 2000
    });
  },

  /**
   * 取消订单
   */
  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          console.log('取消订单:', orderId);
          wx.showToast({
            title: '功能开发中,敬请期待!',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },
  
  // 咨询
  handleConsult: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '咨询: ' + orderId,
      icon: 'none'
    });
  },
  
  // 取车门店指引
  handlePickupGuide: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '取车门店指引功能开发中',
      icon: 'none'
    });
  },
  
  // 取车 - 预约中状态
  handlePickup: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const NavigationUtils = require('../../utils/navigation-utils.js');
    NavigationUtils.toPickupPage(orderId);
  },
  
  // 续租 - 租赁中状态
  handleRenewal: function(e) {
    const orderId = e.currentTarget.dataset.id;
    
    // 检查导航工具类是否可用
    try {
      const NavigationUtils = require('../../utils/navigation-utils.js');
      NavigationUtils.toRenewalPage(orderId);
    } catch (error) {
      console.error('导航工具类加载失败:', error);
      // 降级处理：直接使用wx.navigateTo
      wx.navigateTo({
        url: `/pages/rental-car/rental-car?orderId=${orderId}`,
        fail: (err) => {
          console.error('跳转续租页面失败', err);
          wx.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  },
  
  // 还车 - 租赁中状态
  handleReturn: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const NavigationUtils = require('../../utils/navigation-utils.js');
    NavigationUtils.toReturnPage(orderId);
  },

  // 还车审核中状态的按钮
  handleReturnAudit: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const NavigationUtils = require('../../utils/navigation-utils.js');
    NavigationUtils.toReturnReviewPage(orderId);
  },

  // 去支付 - 待支付状态
  handlePayment: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const NavigationUtils = require('../../utils/navigation-utils.js');
    NavigationUtils.toPaymentPage(orderId);
  },
  
  // 搜索订单
  searchOrder: function() {
    wx.showToast({
      title: '搜索订单',
      icon: 'none'
    });
  },
  
  // 页面触摸开始时关闭所有下拉菜单
  onPageTouch: function() {
    if (this.data.activeMoreId) {
      this.setData({
        activeMoreId: null
      });
    }
  }
})