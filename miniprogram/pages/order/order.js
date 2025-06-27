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
        DataManager.cacheOrderData(cacheKey, responseData, 60 * 1000);
        
        // 同时缓存每个订单的详细信息（5分钟过期）
        responseData.list.forEach(order => {
          const orderDetail = this.buildOrderDetailFromListItem(order);
          DataManager.cacheOrderData(order.id, orderDetail, 5 * 60 * 1000);
        });
        
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
  
  // 模拟API响应数据（保持原有逻辑，确保数据一致性）
  getMockResponseData: function(params) {
    const { orderType, orderStatus, pageNum, pageSize } = params;
    
    // 模拟不同状态的订单数据
    const carModels = ["现代挖掘机R225LC-9T", "三一SY16C", "徐工XE27E", "柳工915E", "临工LG6150"];
    const stores = ["重庆渝北区分店", "长沙岳麓区店", "长沙火车南站店", "长沙五一广场店", "长沙黄花机场店"];
    const managers = ["张经理", "李经理", "王经理", "刘经理", "陈经理"];
    const phones = ["138****8888", "139****6666", "187****1234", "150****9999", "186****5555"];
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
      const randomCarIndex = Math.floor(Math.random() * carModels.length);
      const randomStoreIndex = Math.floor(Math.random() * stores.length);
      const randomManagerIndex = Math.floor(Math.random() * managers.length);
      const rentalDays = Math.floor(Math.random() * 7) + 1;
      
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
      
      mockOrders.push({
        id: orderId,
        statusText: statusText,
        orderStatus: actualOrderStatus,
        displayStatus: orderStatus,
        price: price,
        carModel: carModels[randomCarIndex],
        carImage: carImages[randomCarIndex % carImages.length],
        pickupStore: stores[randomStoreIndex],
        returnStore: stores[randomStoreIndex],
        managerName: managers[randomManagerIndex],
        managerPhone: phones[randomManagerIndex],
        pickupTime: formatDate(pickupDate),
        returnTime: formatDate(returnDate),
        rentalDays: rentalDays,
        orderType: orderType,
        isLeftAligned: false
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
    const NavigationUtils = require('../../utils/navigation-utils.js');
    NavigationUtils.toRenewalPage(orderId);
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