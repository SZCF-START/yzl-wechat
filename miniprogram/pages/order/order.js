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
        price: price,
        carModel: carModels[randomCarIndex],
        carImage: carImages[randomCarIndex % carImages.length],
        pickupStore: stores[randomStoreIndex],
        returnStore: stores[randomStoreIndex],
        pickupTime: formatDate(pickupDate),
        returnTime: formatDate(returnDate),
        rentalDays: rentalDays,
        orderType: orderType
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
  
  // 查看车辆详情
  viewCarDetails: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '查看车辆详情: ' + orderId,
      icon: 'none'
    });
  },
  
  // 显示更多操作
  showMoreActions: function(e) {
    const id = e.currentTarget.dataset.id;
    
    // 如果点击同一个更多按钮，则关闭菜单
    if (this.data.activeMoreId === id) {
      this.setData({ activeMoreId: null });
      return;
    }
    
    // 先设置为激活状态
    this.setData({ activeMoreId: id });
    
    // 获取按钮和屏幕位置信息
    const query = wx.createSelectorQuery();
    query.select('.more-action').boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec((res) => {
      if (res && res[0]) {
        const buttonRect = res[0];
        const screenWidth = wx.getSystemInfoSync().windowWidth;
        
        // 检查下拉菜单是否会超出屏幕右侧（假设下拉菜单宽度为180rpx）
        // 注意：rpx需要转换为px进行比较
        const dropdownWidthInPx = 180 * screenWidth / 750; // 转换rpx为px
        const rightEdgePos = buttonRect.right;
        const willOverflowRight = rightEdgePos + dropdownWidthInPx > screenWidth;
        
        // 根据不同设备换算的px值可能有差异，我们设置一个阈值
        const SCREEN_EDGE_THRESHOLD = 20; // px
        
        // 设置下拉菜单的对齐方式
        if (willOverflowRight || (screenWidth - rightEdgePos < SCREEN_EDGE_THRESHOLD)) {
          // 找到当前激活的下拉菜单
          setTimeout(() => {
            const menuQuery = wx.createSelectorQuery();
            menuQuery.select('.more-dropdown.show').boundingClientRect();
            menuQuery.exec((menuRes) => {
              if (menuRes && menuRes[0]) {
                // 添加left-aligned类
                const activeMenuId = this.data.activeMoreId;
                const orderList = this.data.orderList.map(item => {
                  if (item.id === activeMenuId) {
                    item.isLeftAligned = true;
                  }
                  return item;
                });
                
                this.setData({ orderList });
              }
            });
          }, 50);
        }
      }
    });
  },

  // 点击页面其他区域关闭下拉菜单
  onTap: function() {
    if (this.data.activeMoreId) {
      this.setData({
        activeMoreId: null
      });
    }
  },

  // 查看车辆详情
  viewCarDetails: function(e) {
    const id = e.currentTarget.dataset.id;
    // 关闭下拉菜单
    this.setData({
      activeMoreId: null
    });
    wx.navigateTo({
      url: `/pages/carDetail/index?id=${id}`
    });
  },

  // 修改订单
  modifyOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeMoreId: null });
    wx.navigateTo({
      url: `/pages/orderModify/index?id=${id}`
    });
  },

  // 取消订单
  cancelOrder: function(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ activeMoreId: null });
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 这里处理取消订单的逻辑
          wx.showToast({
            title: '订单已取消',
            icon: 'success'
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
      title: '取车门店指引: ' + orderId,
      icon: 'none'
    });
  },
  
  // 开发票
  handleInvoice: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '开发票: ' + orderId,
      icon: 'none'
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