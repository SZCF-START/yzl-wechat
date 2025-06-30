// order.js - 修复租赁中三个小状态的逻辑和数据生成
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
      { id: 1, name: "租赁中" },  // 包含租赁中(1)、还车审核中(4)、待补缴(5)
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
    
    // 预计算价格显示逻辑 - 有续租或补缴时不显示价格
    processedOrder.shouldShowPrice = this.shouldShowOrderPrice(order);
    processedOrder.priceDisplayText = this.getPriceDisplayText(order);
    
    // 预计算状态样式类名 - 使用小状态确定样式
    processedOrder.statusClassName = this.getStatusClassName(order.subStatus || order.orderStatus);
    
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
    
    // 添加CSS类名用于控制层级
    processedOrder.cssClasses = processedOrder.isMoreMenuOpen ? 'more-open' : '';
    
    return processedOrder;
  },

  // 判断是否显示价格 - 有续租或补缴时不显示
  shouldShowOrderPrice: function(order) {
    return !(order.hasOrderChain || order.hasPayment);
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
      5: 'status-payment'     // 待补缴
    };
    return statusClassMap[status] || 'status-unknown';
  },

  // 获取操作按钮配置 - 根据小状态确定按钮
  getActionButtons: function(order) {
    const buttons = [];
    
    // 使用小状态来确定按钮显示
    const effectiveStatus = order.subStatus || order.orderStatus;
    
    switch (effectiveStatus) {
      case 0: // 预约中
        buttons.push(
          { text: '咨询', action: 'handleConsult', highlight: false },
          { text: '取车门店指引', action: 'handlePickupGuide', highlight: false },
          { text: '取车', action: 'handlePickup', highlight: true }
        );
        break;
        
      case 1: // 租赁中（小状态：租赁中）
        buttons.push(
          { text: '咨询', action: 'handleConsult', highlight: false },
          { text: '续租', action: 'handleRenewal', highlight: false },
          { text: '还车', action: 'handleReturn', highlight: true }
        );
        break;
        
      case 4: // 还车审核中
        buttons.push(
          { text: '还车审核中', action: 'handleReturnAudit', highlight: false }
        );
        break;
        
      case 5: // 待补缴
        buttons.push(
          { text: '去支付', action: 'handlePayment', highlight: true }
        );
        break;
        
      case 2: // 已完成
      case 3: // 已取消
        // 无按钮
        break;
    }
    
    return buttons;
  },

  // 获取更多菜单项
  getMoreMenuItems: function(order) {
    const items = [
      { text: '订单详情', action: 'viewOrderDetails', showAlways: true }
    ];
    
    // 预约中状态可以修改和取消订单
    if (order.orderStatus === 0) {
      items.push(
        { text: '修改订单', action: 'modifyOrder', showAlways: false },
        { text: '取消订单', action: 'cancelOrder', showAlways: false }
      );
    }
    
    // 租赁中状态（包括所有小状态）可以修改订单
    if (order.orderStatus === 1) {
      items.push({ text: '修改订单', action: 'modifyOrder', showAlways: false });
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
    
    // 格式化生效时间 - 精确到日期和小时
    processed.formattedEffectiveTime = `${chainItem.startTime} - ${chainItem.endTime}`;
    
    // 格式化创建时间 - 精确到年月日时分秒
    processed.formattedCreateTime = chainItem.createTime;
    
    return processed;
  },

  // 获取订单链子项状态样式
  getChainItemStatusClass: function(status) {
    if (!status) return 'status-unknown';
    
    if (status.includes('已完成')) return 'status-completed';
    if (status.includes('租赁中')) return 'status-renting';
    if (status.includes('待生效') || status.includes('未生效')) return 'status-pending';
    if (status.includes('待支付') || status.includes('补缴') || status.includes('待补缴')) return 'status-payment';
    if (status.includes('还车审核中')) return 'status-waiting';
    
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
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
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
      this.updateOrderListState();
    });
  },

  // 显示更多操作菜单
  showMoreActions: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const orderId = e.currentTarget.dataset.id;
    const currentActiveId = this.data.activeMoreId;
    const newActiveId = currentActiveId === orderId ? null : orderId;
    
    this.setData({ 
      activeMoreId: newActiveId 
    }, () => {
      this.updateOrderListState();
    });
  },

  // 更新订单列表状态
  updateOrderListState: function() {
    const updatedOrderList = this.data.orderList.map(order => {
      const updated = { ...order };
      updated.isChainExpanded = this.data.expandedChainIds.includes(order.id);
      updated.isMoreMenuOpen = this.data.activeMoreId === order.id;
      updated.cssClasses = updated.isMoreMenuOpen ? 'more-open' : '';
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
  stopPropagation: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  },

  // ==================== 订单操作 ====================

  // 通用操作处理函数
  handleAction: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const action = e.currentTarget.dataset.action;
    const orderId = e.currentTarget.dataset.id;
    
    this.closeAllDropdowns();
    
    if (this[action]) {
      this[action]({ currentTarget: { dataset: { id: orderId } } });
    } else {
      console.error('Action method not found:', action);
    }
  },

  viewOrderDetails: function(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${orderId}`
    });
  },

  modifyOrder: function(e) {
    const orderId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.navigateTo({
      url: `/pages/modify-order/modify-order?orderId=${orderId}`
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
          this.callCancelOrderAPI(orderId);
        }
      }
    });
  },

  callCancelOrderAPI: function(orderId) {
    wx.showLoading({ title: '取消中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: '订单已取消',
        icon: 'success'
      });
      this.getOrderList(true);
    }, 1000);
  },

  handleConsult: function(e) {
    const orderId = e.currentTarget.dataset.id;
    const order = this.data.orderList.find(item => item.id === orderId);
    if (order && order.managerPhone) {
      wx.showModal({
        title: '联系门店管理员',
        content: `是否拨打${order.managerName}的电话：${order.managerPhone}？`,
        success: (res) => {
          if (res.confirm) {
            wx.makePhoneCall({
              phoneNumber: order.managerPhone.replace(/\*/g, '')
            });
          }
        }
      });
    }
  },

  handlePickupGuide: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/pickup-guide/pickup-guide?orderId=${orderId}`
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
      url: `/pages/renewal-car/renewal-car?orderId=${orderId}`
    });
  },

  handleReturn: function(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/return-car/return-car?orderId=${orderId}`
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
    wx.navigateTo({
      url: '/pages/search-order/search-order'
    });
  },

  // ==================== 数据生成（新增租赁中三个小状态的模拟数据）====================

  generateMockOrderData: function() {
    const { activeOrderType, activeStatus, pageNum } = this.data;
    
    // 基础数据
    const carModels = ["现代挖掘机R225LC-9T", "三一SY16C", "徐工XE27E", "柳工915E", "临工LG6150"];
    const carNumbers = ["京A12345", "沪B67890", "粤C11111", "川D88888", "湘E99999"];
    const stores = ["重庆渝北区分店", "长沙岳麓区店", "长沙火车南站店"];
    const managers = ["张经理", "李经理", "王经理"];
    const phones = ["138****8888", "139****6666", "187****1234"];
    
    const mockOrders = [];
    const baseTime = Date.now();
    
    // 格式化日期 - 月日 时:分
    const formatDateTime = (date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    // 格式化创建时间 - 年月日时分秒
    const formatCreateTime = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();
      return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    };

    // 生成非租赁中状态的订单
    if (activeStatus !== 1) {
      const singleOrderId = `SINGLE_${baseTime}_001`;
      const singlePickupDate = new Date();
      singlePickupDate.setDate(singlePickupDate.getDate() - 3);
      const singleReturnDate = new Date(singlePickupDate);
      singleReturnDate.setDate(singlePickupDate.getDate() + 2);
      
      mockOrders.push({
        id: singleOrderId,
        statusText: this.getStatusText(activeStatus),
        orderStatus: activeStatus,
        subStatus: activeStatus, // 单状态订单小状态等于大状态
        price: 480,
        carModel: carModels[0],
        carNumber: carNumbers[0],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(singlePickupDate),
        returnTime: formatDateTime(singleReturnDate),
        rentalDays: 2,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${singleOrderId}`,
        hasOrderChain: false,
        totalRentalDays: 2,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false
      });
    }

    // 生成租赁中状态的订单（包含三个小状态）
    if (activeStatus === 1) {
      // 小状态1：租赁中（正常租赁中）
      const renting1Id = `RENTING_1_${baseTime}_001`;
      const renting1Start = new Date();
      renting1Start.setDate(renting1Start.getDate() - 2);
      renting1Start.setHours(9, 0, 0, 0);
      const renting1End = new Date(renting1Start);
      renting1End.setDate(renting1Start.getDate() + 3);
      renting1End.setHours(18, 0, 0, 0);
      
      mockOrders.push({
        id: renting1Id,
        statusText: "租赁中",
        orderStatus: 1, // 大状态：租赁中
        subStatus: 1,   // 小状态：租赁中
        price: 720,
        carModel: carModels[0],
        carNumber: carNumbers[0],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(renting1Start),
        returnTime: formatDateTime(renting1End),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${renting1Id}`,
        hasOrderChain: false,
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false
      });

      // 小状态4：还车审核中（业务流程1 - 单个订单超时还车审核中）
      const audit1Id = `AUDIT_1_${baseTime}_002`;
      const audit1Start = new Date();
      audit1Start.setDate(audit1Start.getDate() - 5);
      audit1Start.setHours(9, 0, 0, 0);
      const audit1PlanEnd = new Date(audit1Start);
      audit1PlanEnd.setDate(audit1Start.getDate() + 3);
      audit1PlanEnd.setHours(18, 0, 0, 0);
      const audit1ActualEnd = new Date(audit1PlanEnd);
      audit1ActualEnd.setHours(22, 0, 0, 0); // 超时4小时还车
      
      mockOrders.push({
        id: audit1Id,
        statusText: "还车审核中",
        orderStatus: 1, // 大状态：租赁中
        subStatus: 4,   // 小状态：还车审核中
        price: null, // 审核中不显示价格
        carModel: carModels[1],
        carNumber: carNumbers[1],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDateTime(audit1Start),
        returnTime: formatDateTime(audit1ActualEnd),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${audit1Id}`,
        hasOrderChain: true, // 需要显示超时信息
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false, // 还在审核中，暂无补缴
        orderChainDetails: [
          {
            orderId: audit1Id,
            orderType: "原订单",
            orderStatus: "还车审核中", // 正在审核
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(audit1Start),
            endTime: formatDateTime(audit1PlanEnd), // 计划结束时间
            actualEndTime: formatDateTime(audit1ActualEnd), // 实际还车时间
            isOvertime: true,
            overtimeHours: 4,
            overtimeFee: 240, // 基础超时费，审核可能调整
            createTime: formatCreateTime(new Date(audit1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 小状态5：待补缴（业务流程1完成审核 - 单个订单审核后需要补缴）
      const payment1Id = `PAYMENT_1_${baseTime}_003`;
      const payment1Start = new Date();
      payment1Start.setDate(payment1Start.getDate() - 8);
      payment1Start.setHours(9, 0, 0, 0);
      const payment1PlanEnd = new Date(payment1Start);
      payment1PlanEnd.setDate(payment1Start.getDate() + 3);
      payment1PlanEnd.setHours(18, 0, 0, 0);
      const payment1ActualEnd = new Date(payment1PlanEnd);
      payment1ActualEnd.setHours(23, 0, 0, 0); // 超时5小时还车
      
      mockOrders.push({
        id: payment1Id,
        statusText: "待补缴",
        orderStatus: 1, // 大状态：租赁中
        subStatus: 5,   // 小状态：待补缴
        price: null, // 待补缴不显示价格
        carModel: carModels[2],
        carNumber: carNumbers[2],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[2],
        returnStore: stores[2],
        managerName: managers[2],
        managerPhone: phones[2],
        pickupTime: formatDateTime(payment1Start),
        returnTime: formatDateTime(payment1ActualEnd),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${payment1Id}`,
        hasOrderChain: true, // 需要显示补缴信息
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: true, // 有补缴
        orderChainDetails: [
          {
            orderId: payment1Id,
            orderType: "原订单",
            orderStatus: "待补缴", // 审核完成，等待补缴
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(payment1Start),
            endTime: formatDateTime(payment1PlanEnd), // 计划结束时间
            actualEndTime: formatDateTime(payment1ActualEnd), // 实际还车时间
            isOvertime: true,
            overtimeHours: 5,
            overtimeFee: 350, // 管理员审核后确定的超时费（包含差异费用）
            createTime: formatCreateTime(new Date(payment1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 小状态1：租赁中 - 有续租的复杂场景
      const rentingComplexId = `RENTING_COMPLEX_${baseTime}_004`;
      const rentingComplexStart = new Date();
      rentingComplexStart.setDate(rentingComplexStart.getDate() - 6);
      rentingComplexStart.setHours(9, 0, 0, 0);
      const originalEnd = new Date(rentingComplexStart);
      originalEnd.setDate(rentingComplexStart.getDate() + 3);
      originalEnd.setHours(18, 0, 0, 0);
      const renewal1End = new Date(originalEnd);
      renewal1End.setDate(originalEnd.getDate() + 2);
      renewal1End.setHours(18, 0, 0, 0);
      
      mockOrders.push({
        id: rentingComplexId,
        statusText: "租赁中",
        orderStatus: 1, // 大状态：租赁中
        subStatus: 1,   // 小状态：租赁中
        price: null, // 有续租不显示价格
        carModel: carModels[3],
        carNumber: carNumbers[3],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(rentingComplexStart),
        returnTime: formatDateTime(renewal1End),
        rentalDays: 5, // 3+2=5天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${rentingComplexId}`,
        hasOrderChain: true,
        totalRentalDays: 5,
        isRenewalOrder: false,
        renewalCount: 1,
        hasPayment: false, // 当前正常租赁中
        orderChainDetails: [
          {
            orderId: rentingComplexId,
            orderType: "原订单",
            orderStatus: "已完成", // 原订单已完成
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(rentingComplexStart),
            endTime: formatDateTime(originalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(rentingComplexStart.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${rentingComplexId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "租赁中", // 续租正在进行
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(originalEnd),
            endTime: formatDateTime(renewal1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(originalEnd.getTime() - 1*60*60*1000))
          }
        ]
      });

      // 小状态4：还车审核中 - 业务流程2（有续租，最后超时还车审核中）
      const auditComplexId = `AUDIT_COMPLEX_${baseTime}_005`;
      const auditComplexStart = new Date();
      auditComplexStart.setDate(auditComplexStart.getDate() - 10);
      auditComplexStart.setHours(9, 0, 0, 0);
      const auditOriginalEnd = new Date(auditComplexStart);
      auditOriginalEnd.setDate(auditComplexStart.getDate() + 3);
      auditOriginalEnd.setHours(18, 0, 0, 0);
      const auditRenewal1End = new Date(auditOriginalEnd);
      auditRenewal1End.setDate(auditOriginalEnd.getDate() + 2);
      auditRenewal1End.setHours(18, 0, 0, 0);
      const auditRenewal2PlanEnd = new Date(auditRenewal1End);
      auditRenewal2PlanEnd.setDate(auditRenewal1End.getDate() + 3);
      auditRenewal2PlanEnd.setHours(18, 0, 0, 0);
      const auditRenewal2ActualEnd = new Date(auditRenewal2PlanEnd);
      auditRenewal2ActualEnd.setHours(21, 30, 0, 0); // 最后一次续租超时3.5小时
      
      mockOrders.push({
        id: auditComplexId,
        statusText: "还车审核中",
        orderStatus: 1, // 大状态：租赁中
        subStatus: 4,   // 小状态：还车审核中
        price: null,
        carModel: carModels[4],
        carNumber: carNumbers[4],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDateTime(auditComplexStart),
        returnTime: formatDateTime(auditRenewal2ActualEnd),
        rentalDays: 8, // 3+2+3=8天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${auditComplexId}`,
        hasOrderChain: true,
        totalRentalDays: 8,
        isRenewalOrder: false,
        renewalCount: 2,
        hasPayment: false, // 还在审核中
        orderChainDetails: [
          {
            orderId: auditComplexId,
            orderType: "原订单",
            orderStatus: "已完成", // 原订单正常完成
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(auditComplexStart),
            endTime: formatDateTime(auditOriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(auditComplexStart.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${auditComplexId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "已完成", // 第1次续租正常完成
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(auditOriginalEnd),
            endTime: formatDateTime(auditRenewal1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(auditOriginalEnd.getTime() - 2*60*60*1000))
          },
          {
            orderId: `${auditComplexId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "还车审核中", // 最后一次续租超时，正在审核
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(auditRenewal1End),
            endTime: formatDateTime(auditRenewal2PlanEnd), // 计划结束时间
            actualEndTime: formatDateTime(auditRenewal2ActualEnd), // 实际还车时间
            isOvertime: true,
            overtimeHours: 3.5,
            overtimeFee: 210, // 基础超时费，审核中可能调整
            createTime: formatCreateTime(new Date(auditRenewal1End.getTime() - 1*60*60*1000))
          }
        ]
      });

      // 小状态5：待补缴 - 业务流程2完成审核（有续租，最后超时还车审核完成需要补缴）
      const paymentComplexId = `PAYMENT_COMPLEX_${baseTime}_006`;
      const paymentComplexStart = new Date();
      paymentComplexStart.setDate(paymentComplexStart.getDate() - 15);
      paymentComplexStart.setHours(9, 0, 0, 0);
      const paymentOriginalEnd = new Date(paymentComplexStart);
      paymentOriginalEnd.setDate(paymentComplexStart.getDate() + 3);
      paymentOriginalEnd.setHours(18, 0, 0, 0);
      const paymentRenewal1End = new Date(paymentOriginalEnd);
      paymentRenewal1End.setDate(paymentOriginalEnd.getDate() + 2);
      paymentRenewal1End.setHours(18, 0, 0, 0);
      const paymentRenewal2PlanEnd = new Date(paymentRenewal1End);
      paymentRenewal2PlanEnd.setDate(paymentRenewal1End.getDate() + 3);
      paymentRenewal2PlanEnd.setHours(18, 0, 0, 0);
      const paymentRenewal2ActualEnd = new Date(paymentRenewal2PlanEnd);
      paymentRenewal2ActualEnd.setHours(22, 0, 0, 0); // 最后一次续租超时4小时
      
      mockOrders.push({
        id: paymentComplexId,
        statusText: "待补缴",
        orderStatus: 1, // 大状态：租赁中
        subStatus: 5,   // 小状态：待补缴
        price: null,
        carModel: carModels[0],
        carNumber: carNumbers[1],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[2],
        returnStore: stores[2],
        managerName: managers[2],
        managerPhone: phones[2],
        pickupTime: formatDateTime(paymentComplexStart),
        returnTime: formatDateTime(paymentRenewal2ActualEnd),
        rentalDays: 8, // 3+2+3=8天
        orderType: activeOrderType,
        vehicleRecordId: `VR_${paymentComplexId}`,
        hasOrderChain: true,
        totalRentalDays: 8,
        isRenewalOrder: false,
        renewalCount: 2,
        hasPayment: true, // 补缴在最后一个订单上
        orderChainDetails: [
          {
            orderId: paymentComplexId,
            orderType: "原订单",
            orderStatus: "已完成", // 原订单正常完成
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(paymentComplexStart),
            endTime: formatDateTime(paymentOriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(paymentComplexStart.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${paymentComplexId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "已完成", // 第1次续租正常完成
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(paymentOriginalEnd),
            endTime: formatDateTime(paymentRenewal1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(paymentOriginalEnd.getTime() - 2*60*60*1000))
          },
          {
            orderId: `${paymentComplexId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "待补缴", // 最后一次续租审核完成，需要补缴（补缴计算在最后一个订单上）
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(paymentRenewal1End),
            endTime: formatDateTime(paymentRenewal2PlanEnd), // 计划结束时间
            actualEndTime: formatDateTime(paymentRenewal2ActualEnd), // 实际还车时间
            isOvertime: true,
            overtimeHours: 4,
            overtimeFee: 280, // 管理员审核后确定的最终超时费（包含差异费用）
            createTime: formatCreateTime(new Date(paymentRenewal1End.getTime() - 1*60*60*1000))
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
      3: "已取消",
      4: "还车审核中",
      5: "待补缴"
    };
    return statusMap[status] || "未知状态";
  }
});