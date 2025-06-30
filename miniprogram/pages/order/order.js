// order.js - 优化后的订单页面逻辑，避免模板中的复杂表达式
Page({
  data: {
    // 订单类型和状态
    orderTypeList: [
      { id: 0, name: "挖机订单" },
      { id: 1, name: "属具订单" }
    ],
    activeOrderType: 0,
    statusList: [
      { id: 0, name: "预约中" },
      { id: 1, name: "租赁中" },
      { id: 2, name: "已完成" },
      { id: 3, name: "已取消" }
    ],
    activeStatus: 0,
    
    // 订单列表
    orderList: [],
    pageNum: 1,
    pageSize: 10,
    totalCount: 0,
    totalPage: 0,
    isLoading: false,
    hasMoreOrders: true,
    
    // 交互状态
    activeMoreId: null, // 当前展开的"更多"菜单
    expandedChainIds: [], // 展开的订单链折叠区域
  },

  onLoad: function(options) {
    this.getOrderList(true);
  },

  onPullDownRefresh: function() {
    this.setData({
      pageNum: 1,
      hasMoreOrders: true,
      expandedChainIds: [],
      activeMoreId: null
    });
    this.getOrderList(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom: function() {
    if (this.data.hasMoreOrders && !this.data.isLoading) {
      this.loadMoreOrders();
    }
  },

  // ==================== 数据获取 ====================
  
  getOrderList: function(isRefresh) {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    
    // 模拟API调用
    setTimeout(() => {
      const mockData = this.generateMockOrderData();
      this.handleOrderListResponse(mockData, isRefresh);
    }, 800);
  },

  handleOrderListResponse: function(responseData, isRefresh) {
    // 过滤显示主订单（包含订单链信息）
    const displayOrders = responseData.list.filter(order => 
      !order.isRenewalOrder || order.isMainDisplay
    );
    
    // 对每个订单进行数据预处理
    const processedOrders = displayOrders.map(order => this.processOrderData(order));
    
    if (isRefresh) {
      this.setData({
        orderList: processedOrders,
        isLoading: false,
        totalCount: responseData.totalCount,
        totalPage: responseData.totalPage,
        pageNum: 2,
        hasMoreOrders: responseData.pageNum < responseData.totalPage
      });
    } else {
      this.setData({
        orderList: [...this.data.orderList, ...processedOrders],
        isLoading: false,
        pageNum: this.data.pageNum + 1,
        hasMoreOrders: responseData.pageNum < responseData.totalPage
      });
    }
  },

  // 预处理订单数据，计算所有需要在模板中使用的属性
  processOrderData: function(order) {
    const processedOrder = { ...order };
    
    // 预计算价格显示逻辑
    processedOrder.shouldShowPrice = this.shouldShowOrderPrice(order);
    processedOrder.priceDisplayText = this.getPriceDisplayText(order);
    
    // 预计算状态样式类名
    processedOrder.statusClassName = this.getStatusClassName(order.orderStatus);
    
    // 预计算操作按钮显示逻辑
    processedOrder.actionButtons = this.getActionButtons(order);
    
    // 预计算更多菜单项
    processedOrder.moreMenuItems = this.getMoreMenuItems(order);
    
    // 预计算订单链相关属性
    if (order.hasOrderChain && order.orderChainDetails) {
      processedOrder.chainSummary = this.getChainSummary(order);
      processedOrder.processedChainDetails = order.orderChainDetails.map(chainItem => 
        this.processChainItemData(chainItem)
      );
    }
    
    // 预计算展开状态
    processedOrder.isChainExpanded = this.data.expandedChainIds.includes(order.id);
    processedOrder.isMoreMenuOpen = this.data.activeMoreId === order.id;
    
    return processedOrder;
  },

  // 判断是否显示价格
  shouldShowOrderPrice: function(order) {
    // 租赁中状态且有订单链时不显示价格
    return !(order.orderStatus === 1 && order.hasOrderChain);
  },

  // 获取价格显示文本
  getPriceDisplayText: function(order) {
    if (!this.shouldShowOrderPrice(order)) {
      return '';
    }
    return order.price ? `¥${order.price}` : '详见明细';
  },

  // 获取状态样式类名
  getStatusClassName: function(status) {
    const statusClassMap = {
      0: 'status-pending',    // 预约中
      1: 'status-renting',    // 租赁中
      2: 'status-completed',  // 已完成
      3: 'status-cancelled',  // 已取消
      4: 'status-waiting',    // 还车审核中
      5: 'status-payment'     // 待支付
    };
    return statusClassMap[status] || 'status-unknown';
  },

  // 获取操作按钮配置
  getActionButtons: function(order) {
    const buttons = [];
    
    switch (order.orderStatus) {
      case 0: // 预约中
        buttons.push(
          { text: '咨询', action: 'handleConsult', highlight: true },
          { text: '取车门店指引', action: 'handlePickupGuide', highlight: true },
          { text: '取车', action: 'handlePickup', highlight: true }
        );
        break;
        
      case 1: // 租赁中
        buttons.push(
          { text: '取车门店指引', action: 'handlePickupGuide', highlight: true },
          { text: '续租', action: 'handleRenewal', highlight: true },
          { text: '还车', action: 'handleReturn', highlight: true }
        );
        break;
        
      case 4: // 还车审核中
        buttons.push(
          { text: '还车审核中', action: 'handleReturnAudit', highlight: true }
        );
        break;
        
      case 5: // 待支付
        buttons.push(
          { text: '去支付', action: 'handlePayment', highlight: true }
        );
        break;
    }
    
    return buttons;
  },

  // 获取更多菜单项
  getMoreMenuItems: function(order) {
    const items = [
      { text: '车辆详情', action: 'viewCarDetails', showAlways: true }
    ];
    
    // 预约中或租赁中可以修改订单
    if (order.orderStatus === 0 || order.orderStatus === 1) {
      items.push({ text: '修改订单', action: 'modifyOrder', showAlways: false });
    }
    
    // 预约中可以取消订单
    if (order.orderStatus === 0) {
      items.push({ text: '取消订单', action: 'cancelOrder', showAlways: false });
    }
    
    return items;
  },

  // 获取订单链摘要信息
  getChainSummary: function(order) {
    return {
      totalOrders: order.orderChainDetails ? order.orderChainDetails.length : 0,
      renewalCount: order.renewalCount || 0,
      hasPayment: order.hasPayment || false,
      badges: this.getChainBadges(order)
    };
  },

  // 获取订单链标签
  getChainBadges: function(order) {
    const badges = [];
    
    if (order.renewalCount > 0) {
      badges.push({
        text: `续租${order.renewalCount}次`,
        type: 'renewal'
      });
    }
    
    if (order.hasPayment) {
      badges.push({
        text: '有补缴',
        type: 'payment'
      });
    }
    
    return badges;
  },

  // 处理订单链子项数据
  processChainItemData: function(chainItem) {
    const processed = { ...chainItem };
    
    // 预计算订单类型样式
    processed.typeClassName = chainItem.orderType === '原订单' ? 'original' : 'renewal';
    
    // 预计算状态样式
    processed.statusClassName = this.getChainItemStatusClass(chainItem.orderStatus);
    
    // 预计算是否显示超时信息
    processed.showOvertimeInfo = chainItem.isOvertime || false;
    
    // 预计算是否显示补缴提示
    processed.showPaymentNotice = chainItem.orderStatus && 
      chainItem.orderStatus.indexOf('补缴') > -1;
    
    // 格式化数据
    processed.formattedPrice = `¥${chainItem.price}`;
    processed.formattedOvertimeFee = chainItem.overtimeFee ? `¥${chainItem.overtimeFee}` : '';
    
    return processed;
  },

  // 获取订单链子项状态样式
  getChainItemStatusClass: function(status) {
    if (!status) return 'status-unknown';
    
    if (status.includes('已完成')) return 'status-completed';
    if (status.includes('租赁中')) return 'status-renting';
    if (status.includes('待生效')) return 'status-pending';
    if (status.includes('待支付')) return 'status-payment';
    if (status.includes('补缴')) return 'status-payment';
    
    return 'status-unknown';
  },

  loadMoreOrders: function() {
    this.getOrderList(false);
  },

  // ==================== 交互事件 ====================

  switchOrderType: function(e) {
    const type = parseInt(e.currentTarget.dataset.type);
    if (type !== this.data.activeOrderType) {
      this.setData({
        activeOrderType: type,
        pageNum: 1,
        hasMoreOrders: true,
        orderList: [],
        expandedChainIds: [],
        activeMoreId: null
      });
      this.getOrderList(true);
    }
  },

  switchStatus: function(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    if (status !== this.data.activeStatus) {
      this.setData({
        activeStatus: status,
        pageNum: 1,
        hasMoreOrders: true,
        orderList: [],
        expandedChainIds: [],
        activeMoreId: null
      });
      this.getOrderList(true);
    }
  },

  // 切换订单链折叠状态
  toggleOrderChain: function(e) {
    const orderId = e.currentTarget.dataset.orderId;
    const expandedIds = this.data.expandedChainIds;
    
    let newExpandedIds;
    if (expandedIds.includes(orderId)) {
      newExpandedIds = expandedIds.filter(id => id !== orderId);
    } else {
      newExpandedIds = [...expandedIds, orderId];
    }
    
    this.setData({
      expandedChainIds: newExpandedIds
    }, () => {
      // 重新处理订单数据以更新展开状态
      this.updateOrderListState();
    });
  },

  // 显示更多操作菜单
  showMoreActions: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const currentActiveId = this.data.activeMoreId;
    
    const newActiveId = currentActiveId === orderId ? null : orderId;
    
    this.setData({ 
      activeMoreId: newActiveId 
    }, () => {
      this.updateOrderListState();
    });
  },

  // 更新订单列表状态（重新计算展开状态等）
  updateOrderListState: function() {
    const updatedOrderList = this.data.orderList.map(order => {
      const updated = { ...order };
      updated.isChainExpanded = this.data.expandedChainIds.includes(order.id);
      updated.isMoreMenuOpen = this.data.activeMoreId === order.id;
      return updated;
    });
    
    this.setData({ orderList: updatedOrderList });
  },

  // 关闭所有弹窗
  closeAllDropdowns: function() {
    this.setData({ activeMoreId: null }, () => {
      this.updateOrderListState();
    });
  },

  onPageTap: function() {
    if (this.data.activeMoreId) {
      this.closeAllDropdowns();
    }
  },

  // 阻止事件冒泡
  stopPropagation: function() {
    // 空函数，用于阻止事件冒泡
  },

  // ==================== 订单操作 ====================

  // 通用操作处理函数
  handleAction: function(e) {
    const action = e.currentTarget.dataset.action;
    const orderId = e.currentTarget.dataset.id;
    
    this.closeAllDropdowns();
    
    // 根据action调用对应的处理函数
    if (this[action]) {
      this[action]({ currentTarget: { dataset: { id: orderId } } });
    }
  },

  viewCarDetails: function(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.showToast({
      title: '查看车辆详情: ' + orderId,
      icon: 'none'
    });
  },

  modifyOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.showToast({
      title: '修改订单: ' + orderId,
      icon: 'none'
    });
  },

  cancelOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '订单已取消',
            icon: 'success'
          });
        }
      }
    });
  },

  handleConsult: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '咨询: ' + orderId,
      icon: 'none'
    });
  },

  handlePickupGuide: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showToast({
      title: '取车门店指引',
      icon: 'none'
    });
  },

  handlePickup: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/pickup/pickup?orderId=${orderId}`
    });
  },

  handleRenewal: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/renewal/renewal?orderId=${orderId}`
    });
  },

  handleReturn: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/return/return?orderId=${orderId}`
    });
  },

  handleReturnAudit: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/return-audit/return-audit?orderId=${orderId}`
    });
  },

  handlePayment: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/payment/payment?orderId=${orderId}`
    });
  },

  searchOrder: function() {
    wx.showToast({
      title: '搜索订单功能',
      icon: 'none'
    });
  },

  // ==================== 数据生成 ====================

  generateMockOrderData: function() {
    const { activeOrderType, activeStatus, pageNum } = this.data;
    
    // 基础数据
    const carModels = ["现代挖掘机R225LC-9T", "三一SY16C", "徐工XE27E", "柳工915E", "临工LG6150"];
    const stores = ["重庆渝北区分店", "长沙岳麓区店", "长沙火车南站店"];
    const managers = ["张经理", "李经理", "王经理"];
    const phones = ["138****8888", "139****6666", "187****1234"];
    
    const mockOrders = [];
    const baseTime = Date.now();
    
    // 格式化日期
    const formatDate = (date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour}:00`;
    };

    // 示例1: 单个订单（无续租）
    const singleOrderId = `SINGLE_${baseTime}_001`;
    const singlePickupDate = new Date();
    singlePickupDate.setDate(singlePickupDate.getDate() - 3);
    const singleReturnDate = new Date(singlePickupDate);
    singleReturnDate.setDate(singlePickupDate.getDate() + 2);
    
    mockOrders.push({
      id: singleOrderId,
      statusText: this.getStatusText(activeStatus),
      orderStatus: activeStatus,
      price: activeStatus === 1 ? null : 480, // 租赁中状态不显示价格（如果有订单链）
      carModel: carModels[0],
      carImage: "../../assets/rsg.png",
      pickupStore: stores[0],
      returnStore: stores[0],
      managerName: managers[0],
      managerPhone: phones[0],
      pickupTime: formatDate(singlePickupDate),
      returnTime: formatDate(singleReturnDate),
      rentalDays: 2,
      orderType: activeOrderType,
      vehicleRecordId: `VR_${singleOrderId}`,
      hasOrderChain: false,
      totalRentalDays: 2,
      isRenewalOrder: false,
      renewalCount: 0,
      hasPayment: false
    });

    // 示例2: 有续租的订单链 - 根据不同状态显示不同示例
    if (activeStatus === 1) { // 租赁中状态 - 有2次续租的复杂订单链
      const rentingChainId = `RENTING_${baseTime}_001`;
      const rentingPickupDate = new Date();
      rentingPickupDate.setDate(rentingPickupDate.getDate() - 5);
      const originalReturnDate = new Date(rentingPickupDate);
      originalReturnDate.setDate(rentingPickupDate.getDate() + 7);
      const renewal1EndDate = new Date(originalReturnDate);
      renewal1EndDate.setDate(originalReturnDate.getDate() + 3);
      const renewal2EndDate = new Date(renewal1EndDate);
      renewal2EndDate.setDate(renewal1EndDate.getDate() + 4);
      
      mockOrders.push({
        id: rentingChainId,
        statusText: "租赁中",
        orderStatus: 1,
        price: null, // 租赁中且有订单链时不显示价格
        carModel: carModels[1],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDate(rentingPickupDate),
        returnTime: formatDate(renewal2EndDate), // 预计最终还车时间
        rentalDays: 14, // 7+3+4=14天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${rentingChainId}`,
        hasOrderChain: true,
        totalRentalDays: 14,
        isRenewalOrder: false,
        renewalCount: 2, // 续租2次
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: rentingChainId,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 1680,
            rentalDays: 7,
            startTime: formatDate(rentingPickupDate),
            endTime: formatDate(originalReturnDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(rentingPickupDate.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${rentingChainId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "租赁中",
            price: 720,
            rentalDays: 3,
            startTime: formatDate(originalReturnDate),
            endTime: formatDate(renewal1EndDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(originalReturnDate.getTime() - 3*60*60*1000))
          },
          {
            orderId: `${rentingChainId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "待生效",
            price: 960,
            rentalDays: 4,
            startTime: formatDate(renewal1EndDate),
            endTime: formatDate(renewal2EndDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(renewal1EndDate.getTime() - 1*60*60*1000))
          }
        ]
      });

      // 示例2: 原订单已完成 + 第1次续租租赁中
      const simpleRentingId = `SIMPLE_RENTING_${baseTime}_002`;
      const simplePickupDate = new Date();
      simplePickupDate.setDate(simplePickupDate.getDate() - 2);
      const simpleOriginalEnd = new Date(simplePickupDate);
      simpleOriginalEnd.setDate(simplePickupDate.getDate() + 5);
      const simpleRenewalEnd = new Date(simpleOriginalEnd);
      simpleRenewalEnd.setDate(simpleOriginalEnd.getDate() + 3);
      
      mockOrders.push({
        id: simpleRentingId,
        statusText: "租赁中",
        orderStatus: 1,
        price: null,
        carModel: carModels[2],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[2],
        returnStore: stores[2],
        managerName: managers[2],
        managerPhone: phones[2],
        pickupTime: formatDate(simplePickupDate),
        returnTime: formatDate(simpleRenewalEnd),
        rentalDays: 8, // 5+3=8天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${simpleRentingId}`,
        hasOrderChain: true,
        totalRentalDays: 8,
        isRenewalOrder: false,
        renewalCount: 1,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: simpleRentingId,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 1200,
            rentalDays: 5,
            startTime: formatDate(simplePickupDate),
            endTime: formatDate(simpleOriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(simplePickupDate.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${simpleRentingId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "租赁中",
            price: 720,
            rentalDays: 3,
            startTime: formatDate(simpleOriginalEnd),
            endTime: formatDate(simpleRenewalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(simpleOriginalEnd.getTime() - 2*60*60*1000))
          }
        ]
      });

      // 示例3: 原订单租赁中 + 第1次续租待生效
      const originalRentingId = `ORIGINAL_RENTING_${baseTime}_003`;
      const originalStartDate = new Date();
      originalStartDate.setDate(originalStartDate.getDate() - 1); // 1天前开始
      const originalEndDate = new Date(originalStartDate);
      originalEndDate.setDate(originalStartDate.getDate() + 6); // 还有5天结束
      const firstRenewalEnd = new Date(originalEndDate);
      firstRenewalEnd.setDate(originalEndDate.getDate() + 4); // 续租4天
      
      mockOrders.push({
        id: originalRentingId,
        statusText: "租赁中",
        orderStatus: 1,
        price: null,
        carModel: carModels[3],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDate(originalStartDate),
        returnTime: formatDate(firstRenewalEnd), // 预计最终还车时间
        rentalDays: 10, // 6+4=10天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${originalRentingId}`,
        hasOrderChain: true,
        totalRentalDays: 10,
        isRenewalOrder: false,
        renewalCount: 1,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: originalRentingId,
            orderType: "原订单",
            orderStatus: "租赁中", // 原订单还在租赁中
            price: 1440,
            rentalDays: 6,
            startTime: formatDate(originalStartDate),
            endTime: formatDate(originalEndDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(originalStartDate.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${originalRentingId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "待生效", // 续租订单待生效
            price: 960,
            rentalDays: 4,
            startTime: formatDate(originalEndDate),
            endTime: formatDate(firstRenewalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date()) // 刚创建的续租订单
          }
        ]
      });

      // 示例4: 原订单租赁中，提前预约了2次续租
      const advancedRenewalId = `ADVANCED_${baseTime}_004`;
      const advancedStartDate = new Date();
      advancedStartDate.setHours(advancedStartDate.getHours() - 12); // 12小时前开始
      const advancedOriginalEnd = new Date(advancedStartDate);
      advancedOriginalEnd.setDate(advancedStartDate.getDate() + 3); // 3天后结束
      const advancedRenewal1End = new Date(advancedOriginalEnd);
      advancedRenewal1End.setDate(advancedOriginalEnd.getDate() + 2); // 第1次续租2天
      const advancedRenewal2End = new Date(advancedRenewal1End);
      advancedRenewal2End.setDate(advancedRenewal1End.getDate() + 5); // 第2次续租5天
      
      mockOrders.push({
        id: advancedRenewalId,
        statusText: "租赁中",
        orderStatus: 1,
        price: null,
        carModel: carModels[4],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDate(advancedStartDate),
        returnTime: formatDate(advancedRenewal2End),
        rentalDays: 10, // 3+2+5=10天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${advancedRenewalId}`,
        hasOrderChain: true,
        totalRentalDays: 10,
        isRenewalOrder: false,
        renewalCount: 2, // 预约了2次续租
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: advancedRenewalId,
            orderType: "原订单",
            orderStatus: "租赁中", // 原订单正在进行中
            price: 720,
            rentalDays: 3,
            startTime: formatDate(advancedStartDate),
            endTime: formatDate(advancedOriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(advancedStartDate.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${advancedRenewalId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "待生效", // 第1次续租等待生效
            price: 480,
            rentalDays: 2,
            startTime: formatDate(advancedOriginalEnd),
            endTime: formatDate(advancedRenewal1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(advancedOriginalEnd.getTime() - 6*60*60*1000)) // 6小时前创建
          },
          {
            orderId: `${advancedRenewalId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "待生效", // 第2次续租也是待生效
            price: 1200,
            rentalDays: 5,
            startTime: formatDate(advancedRenewal1End),
            endTime: formatDate(advancedRenewal2End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(advancedRenewal1End.getTime() - 1*60*60*1000)) // 1小时前创建
          }
        ]
      });
    }

    if (activeStatus === 2) { // 已完成状态 - 有续租的订单链
      const chainOrderId = `CHAIN_${baseTime}_001`;
      const chainPickupDate = new Date();
      chainPickupDate.setDate(chainPickupDate.getDate() - 8);
      const originalReturnDate = new Date(chainPickupDate);
      originalReturnDate.setDate(chainPickupDate.getDate() + 3);
      const finalReturnDate = new Date(originalReturnDate);
      finalReturnDate.setDate(originalReturnDate.getDate() + 2);
      
      mockOrders.push({
        id: chainOrderId,
        statusText: "已完成",
        orderStatus: 2,
        price: null, // 不显示价格，在折叠区域显示
        carModel: carModels[1],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDate(chainPickupDate),
        returnTime: formatDate(finalReturnDate),
        rentalDays: 5, // 合并显示：3+2=5天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${chainOrderId}`,
        hasOrderChain: true,
        totalRentalDays: 5,
        isRenewalOrder: false,
        renewalCount: 1, // 续租1次
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: chainOrderId,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDate(chainPickupDate),
            endTime: formatDate(originalReturnDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(chainPickupDate.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${chainOrderId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "已完成",
            price: 480,
            rentalDays: 2,
            startTime: formatDate(originalReturnDate),
            endTime: formatDate(finalReturnDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(originalReturnDate.getTime() - 2*60*60*1000))
          }
        ]
      });

      // 示例3: 有超时的待补缴订单（3次续租，最后一次超时）
      const overtimeOrderId = `OVERTIME_${baseTime}_001`;
      const overtimePickupDate = new Date();
      overtimePickupDate.setDate(overtimePickupDate.getDate() - 15);
      const originalEndDate = new Date(overtimePickupDate);
      originalEndDate.setDate(overtimePickupDate.getDate() + 4);
      const renewal1EndDate = new Date(originalEndDate);
      renewal1EndDate.setDate(originalEndDate.getDate() + 3);
      const renewal2EndDate = new Date(renewal1EndDate);
      renewal2EndDate.setDate(renewal1EndDate.getDate() + 2);
      const actualReturnDate = new Date(renewal2EndDate);
      actualReturnDate.setHours(renewal2EndDate.getHours() + 6); // 超时6小时
      
      mockOrders.push({
        id: overtimeOrderId,
        statusText: "已完成(补缴)",
        orderStatus: 2,
        price: null,
        carModel: carModels[3],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDate(overtimePickupDate),
        returnTime: formatDate(actualReturnDate), // 实际还车时间（含超时）
        rentalDays: 9, // 4+3+2=9天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${overtimeOrderId}`,
        hasOrderChain: true,
        totalRentalDays: 9,
        isRenewalOrder: false,
        renewalCount: 2, // 续租2次
        hasPayment: true, // 有补缴
        orderChainDetails: [
          {
            orderId: overtimeOrderId,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 960,
            rentalDays: 4,
            startTime: formatDate(overtimePickupDate),
            endTime: formatDate(originalEndDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(overtimePickupDate.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${overtimeOrderId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDate(originalEndDate),
            endTime: formatDate(renewal1EndDate),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatDate(new Date(originalEndDate.getTime() - 2*60*60*1000))
          },
          {
            orderId: `${overtimeOrderId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "已完成(补缴)",
            price: 480,
            rentalDays: 2,
            startTime: formatDate(renewal1EndDate),
            endTime: formatDate(renewal2EndDate), // 计划结束时间
            isOvertime: true,
            overtimeHours: 6,
            actualEndTime: formatDate(actualReturnDate), // 实际还车时间
            overtimeFee: 360, // 超时费用
            createTime: formatDate(new Date(renewal1EndDate.getTime() - 1*60*60*1000))
          }
        ]
      });
    }

    // 示例4: 预约中状态的订单（即将开始）
    if (activeStatus === 0) {
      const futureOrderId = `FUTURE_${baseTime}_001`;
      const futurePickupDate = new Date();
      futurePickupDate.setDate(futurePickupDate.getDate() + 1);
      const futureReturnDate = new Date(futurePickupDate);
      futureReturnDate.setDate(futurePickupDate.getDate() + 5);
      
      mockOrders.push({
        id: futureOrderId,
        statusText: "预约中",
        orderStatus: 0,
        price: 1200,
        carModel: carModels[4],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDate(futurePickupDate),
        returnTime: formatDate(futureReturnDate),
        rentalDays: 5,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${futureOrderId}`,
        hasOrderChain: false,
        totalRentalDays: 5,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false
      });
    }

    // 示例5: 待支付状态（有超时费用）
    if (activeStatus === 5) {
      const paymentOrderId = `PAYMENT_${baseTime}_001`;
      const paymentPickupDate = new Date();
      paymentPickupDate.setDate(paymentPickupDate.getDate() - 10);
      const paymentOriginalEnd = new Date(paymentPickupDate);
      paymentOriginalEnd.setDate(paymentPickupDate.getDate() + 3);
      const paymentActualEnd = new Date(paymentOriginalEnd);
      paymentActualEnd.setHours(paymentOriginalEnd.getHours() + 4); // 超时4小时
      
      mockOrders.push({
        id: paymentOrderId,
        statusText: "待支付",
        orderStatus: 5,
        price: null,
        carModel: carModels[2],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[2],
        returnStore: stores[2],
        managerName: managers[2],
        managerPhone: phones[2],
        pickupTime: formatDate(paymentPickupDate),
        returnTime: formatDate(paymentActualEnd),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${paymentOrderId}`,
        hasOrderChain: true,
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: true,
        orderChainDetails: [
          {
            orderId: paymentOrderId,
            orderType: "原订单",
            orderStatus: "待支付",
            price: 720,
            rentalDays: 3,
            startTime: formatDate(paymentPickupDate),
            endTime: formatDate(paymentOriginalEnd),
            isOvertime: true,
            overtimeHours: 4,
            actualEndTime: formatDate(paymentActualEnd),
            overtimeFee: 240,
            createTime: formatDate(new Date(paymentPickupDate.getTime() - 24*60*60*1000))
          }
        ]
      });
    }

    return {
      list: mockOrders,
      pageNum: pageNum,
      pageSize: 10,
      totalCount: 20,
      totalPage: 2
    };
  },

  getStatusText: function(status) {
    const statusMap = {
      0: "预约中",
      1: "租赁中", 
      2: "已完成",
      3: "已取消"
    };
    return statusMap[status] || "未知状态";
  }
});