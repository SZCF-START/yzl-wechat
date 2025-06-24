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
        // { id: 1, name: "候补中" },
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
    
    // 模拟API请求
    setTimeout(() => {
      // 模拟后台返回的分页数据结构
      const responseData = this.getMockResponseData(params);
      console.log("responseData4444444:",responseData);
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
    }, 500);
  },
  
  // 加载更多订单
  loadMoreOrders: function() {
    this.getOrderList(false);
  },
  
  // 模拟API响应数据
  getMockResponseData: function(params) {
    const { orderType, orderStatus, pageNum, pageSize } = params;
    
    // 模拟不同状态的订单数据
    const carModels = ["三一SY16C", "徐工XE27E", "柳工915E", "临工LG6150", "中联ZE205E"];
    const stores = ["长沙长沙先锋店", "长沙岳麓区店", "长沙火车南站店", "长沙五一广场店", "长沙黄花机场店"];
    const carImages = [
      "../../assets/rsg.png", 
      "../../assets/rsg.png", 
      "../../assets/rsg.png", 
      "../../assets/rsg.png", 
      "../../assets/rsg.png"
    ];
    
    // 模拟分页数据
    // 根据订单类型和状态设置不同的总数据量
    let totalCount;
    if (orderType === 0) { // 自驾订单
      if (orderStatus === 0) totalCount = 35; // 预约中
      // else if (orderStatus === 1) totalCount = 18; // 候补中
      else if (orderStatus === 1) totalCount = 27; // 租赁中
      else if (orderStatus === 2) totalCount = 42; // 已完成
      else totalCount = 15; // 已取消
    } else { // 他人代订
      if (orderStatus === 0) totalCount = 20; // 预约中
      // else if (orderStatus === 1) totalCount = 8; // 候补中
      else if (orderStatus === 1) totalCount = 12; // 租赁中
      else if (orderStatus === 2) totalCount = 25; // 已完成
      else totalCount = 5; // 已取消
    }
    
    // 计算总页数
    const totalPage = Math.ceil(totalCount / pageSize);
    
    // 计算当前页应返回的数据量
    let currentPageItemCount;
    if (pageNum >= totalPage) {
      currentPageItemCount = totalCount % pageSize === 0 ? pageSize : totalCount % pageSize;
    } else {
      currentPageItemCount = pageSize;
    }
    
    // 如果超出总页数，则返回空数组
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
      
      // 获取订单状态文本
      const statusText = this.data.statusList.length > 0 ? 
                        this.data.statusList[orderStatus].name : 
                        ["预约中", "候补中", "租赁中", "已完成", "已取消"][orderStatus];
      
      mockOrders.push({
        id: `order_${Date.now()}_${i}_${pageNum}_${orderType}_${orderStatus}`,
        statusText: statusText,
        orderStatus: orderStatus,
        price: price,
        carModel: carModels[randomCarIndex],
        carImage: carImages[randomCarIndex % carImages.length],
        pickupStore: stores[randomStoreIndex],
        returnStore: stores[randomStoreIndex],
        pickupTime: formatDate(pickupDate),
        returnTime: formatDate(returnDate),
        rentalDays: rentalDays,
        orderType: orderType,
        isLeftAligned: false // 初始化对齐方式
      });
    }
    
    // 返回模拟的分页数据结构
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
    
    // 如果点击的是已经激活的项，则关闭
    if (currentActiveId === orderId) {
      this.setData({
        activeMoreId: null
      });
      return;
    }

    // 设置新的激活项
    this.setData({
      activeMoreId: orderId
    });

    // 延迟执行位置计算，确保DOM更新完成
    setTimeout(() => {
      this.calculateDropdownPosition(orderId);
    }, 50);
  },

  /**
   * 计算弹窗位置，防止超出屏幕
   */
  calculateDropdownPosition(orderId) {
    const query = wx.createSelectorQuery();
    
    // 获取屏幕信息
    // 获取窗口信息
    const windowInfo = wx.getWindowInfo();
    const screenWidth = windowInfo.windowWidth;
    
    // 获取更多按钮的位置信息
    query.selectAll('.more-action').boundingClientRect((rects) => {
      if (rects && rects.length > 0) {
        // 找到对应订单的更多按钮
        const targetIndex = this.data.orderList.findIndex(item => item.id === orderId);
        
        if (targetIndex >= 0 && rects[targetIndex]) {
          const buttonRect = rects[targetIndex];
          const dropdownWidth = 200; // 弹窗的大概宽度(rpx)
          const dropdownWidthPx = dropdownWidth * (screenWidth / 750); // 转换为px
          
          // 判断是否会超出右边界
          const willOverflow = (buttonRect.right + dropdownWidthPx) > screenWidth;
          
          // 更新订单列表，添加位置标识
          const updatedOrderList = this.data.orderList.map((item, index) => {
            if (item.id === orderId) {
              return {
                ...item,
                isLeftAligned: willOverflow // 如果会溢出，则右对齐
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
   * 关闭所有弹窗（点击其他地方时调用）
   */
  closeAllDropdowns() {
    this.setData({
      activeMoreId: null
    });
  },

  // 检查下拉菜单位置并调整对齐方式
  // checkDropdownPosition: function(orderId) {
  //   const query = wx.createSelectorQuery();
    
  //   // 获取屏幕信息
  //   const systemInfo = wx.getSystemInfoSync();
  //   const screenWidth = systemInfo.windowWidth;
    
  //   // 查找当前激活的更多按钮
  //   query.selectAll('.more-action').boundingClientRect();
  //   query.exec((res) => {
  //     if (res && res[0] && res[0].length > 0) {
  //       // 找到当前激活的更多按钮
  //       const currentOrderIndex = this.data.orderList.findIndex(item => item.id === orderId);
  //       if (currentOrderIndex !== -1 && res[0][currentOrderIndex]) {
  //         const buttonRect = res[0][currentOrderIndex];
          
  //         // 下拉菜单的预估宽度（单位：px）
  //         const dropdownWidth = 120; // 根据实际菜单宽度调整
  //         const rightEdgePos = buttonRect.right;
  //         const margin = 20; // 距离屏幕边缘的安全距离
          
  //         // 判断是否会超出屏幕右侧
  //         const willOverflowRight = (rightEdgePos + dropdownWidth) > (screenWidth - margin);
          
  //         if (willOverflowRight) {
  //           // 更新对应订单的对齐方式
  //           const orderList = this.data.orderList.map(item => {
  //             if (item.id === orderId) {
  //               item.isLeftAligned = true;
  //             }
  //             return item;
  //           });
            
  //           this.setData({ orderList: orderList });
  //         }
  //       }
  //     }
  //   });
  // },

  /**
   * 处理页面点击事件，用于关闭弹窗
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
    
    // 这里添加查看车辆详情的逻辑
    console.log('查看车辆详情:', orderId);
    // 弹窗提示“敬请期待”
    wx.showToast({
      title: '功能开发中,敬请期待!',
      icon: 'none',
      duration: 2000
    });
    // wx.navigateTo({
    //   url: `/pages/car-details/car-details?orderId=${orderId}`
    // });
  },

  /**
   * 修改订单
   */
  modifyOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    
    // 这里添加修改订单的逻辑
    console.log('修改订单:', orderId);
    // 弹窗提示“敬请期待”
    wx.showToast({
      title: '功能开发中,敬请期待!',
      icon: 'none',
      duration: 2000
    });
    // wx.navigateTo({
    //   url: `/pages/modify-order/modify-order?orderId=${orderId}`
    // });
  },

  /**
   * 取消订单
   */
  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    
    // 显示确认弹窗
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 这里添加取消订单的API调用
          console.log('取消订单:', orderId);
          // 调用取消订单接口
          // this.cancelOrderAPI(orderId);
          // 弹窗提示“敬请期待”
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

    wx.navigateTo({
      url: `/pages/pickup/pickup`,
    });
    // wx.showToast({
    //   title: '取车功能开发中',
    //   icon: 'none'
    // });
  },
  
  // 续租 - 租赁中状态
  handleRenewal: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '续租功能开发中',
      icon: 'none'
    });
  },
  
  // 还车 - 租赁中状态
  handleReturn: function(e) {
    const orderId = e.currentTarget.dataset.id;
    // wx.showToast({
    //   title: '还车功能开发中', 
    //   icon: 'none'
    // });
    wx.navigateTo({
      url: `/pages/return-car/return-car`,
    });
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