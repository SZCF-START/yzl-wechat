// order.js - 修改订单链展示逻辑，租赁中和已完成状态都展示订单链
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
      url: `/pages/payment-after-review/payment-after-review?orderId=${orderId}`
    });
  },

  searchOrder: function() {
    wx.navigateTo({
      url: '/pages/search-order/search-order'
    });
  },

  // ==================== 数据生成 - 修改为在租赁中和已完成状态都生成订单链数据 ====================

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

    // 预约中状态 - 简单订单
    if (activeStatus === 0) {
      const singleOrderId = `PENDING_${baseTime}_001`;
      const singlePickupDate = new Date();
      singlePickupDate.setDate(singlePickupDate.getDate() + 1);
      const singleReturnDate = new Date(singlePickupDate);
      singleReturnDate.setDate(singlePickupDate.getDate() + 3);
      
      mockOrders.push({
        id: singleOrderId,
        statusText: "预约中",
        orderStatus: 0,
        subStatus: 0,
        price: 720,
        carModel: carModels[0],
        carNumber: carNumbers[0],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(singlePickupDate),
        returnTime: formatDateTime(singleReturnDate),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${singleOrderId}`,
        hasOrderChain: false,
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false
      });
    }

    // 租赁中状态 - 生成复杂订单链数据
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
        orderStatus: 1,
        subStatus: 1,
        price: null, // 单订单也不显示价格，通过订单链查看详情
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
        hasOrderChain: true, // 所有租赁中的订单都显示订单链
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: renting1Id,
            orderType: "原订单",
            orderStatus: "租赁中",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(renting1Start),
            endTime: formatDateTime(renting1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(renting1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 小状态4：还车审核中
      const audit1Id = `AUDIT_1_${baseTime}_002`;
      const audit1Start = new Date();
      audit1Start.setDate(audit1Start.getDate() - 5);
      audit1Start.setHours(9, 0, 0, 0);
      const audit1PlanEnd = new Date(audit1Start);
      audit1PlanEnd.setDate(audit1Start.getDate() + 3);
      audit1PlanEnd.setHours(18, 0, 0, 0);
      const audit1ActualEnd = new Date(audit1PlanEnd);
      audit1ActualEnd.setHours(22, 0, 0, 0);
      
      mockOrders.push({
        id: audit1Id,
        statusText: "还车审核中",
        orderStatus: 1,
        subStatus: 4,
        price: null,
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
        hasOrderChain: true,
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: audit1Id,
            orderType: "原订单",
            orderStatus: "还车审核中",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(audit1Start),
            endTime: formatDateTime(audit1PlanEnd),
            actualEndTime: formatDateTime(audit1ActualEnd),
            isOvertime: true,
            overtimeHours: 4,
            overtimeFee: 240,
            createTime: formatCreateTime(new Date(audit1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 小状态5：待补缴
      const payment1Id = `PAYMENT_1_${baseTime}_003`;
      const payment1Start = new Date();
      payment1Start.setDate(payment1Start.getDate() - 8);
      payment1Start.setHours(9, 0, 0, 0);
      const payment1PlanEnd = new Date(payment1Start);
      payment1PlanEnd.setDate(payment1Start.getDate() + 3);
      payment1PlanEnd.setHours(18, 0, 0, 0);
      const payment1ActualEnd = new Date(payment1PlanEnd);
      payment1ActualEnd.setHours(23, 0, 0, 0);
      
      mockOrders.push({
        id: payment1Id,
        statusText: "待补缴",
        orderStatus: 1,
        subStatus: 5,
        price: null,
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
        hasOrderChain: true,
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: true,
        orderChainDetails: [
          {
            orderId: payment1Id,
            orderType: "原订单",
            orderStatus: "待补缴",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(payment1Start),
            endTime: formatDateTime(payment1PlanEnd),
            actualEndTime: formatDateTime(payment1ActualEnd),
            isOvertime: true,
            overtimeHours: 5,
            overtimeFee: 350,
            createTime: formatCreateTime(new Date(payment1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 租赁中 - 有续租的复杂场景（原订单已完成，续租进行中）
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
        orderStatus: 1,
        subStatus: 1,
        price: null,
        carModel: carModels[3],
        carNumber: carNumbers[3],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(rentingComplexStart),
        returnTime: formatDateTime(renewal1End),
        rentalDays: 5,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${rentingComplexId}`,
        hasOrderChain: true,
        totalRentalDays: 5,
        isRenewalOrder: false,
        renewalCount: 1,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: rentingComplexId,
            orderType: "原订单",
            orderStatus: "已完成",
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
            orderStatus: "租赁中",
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

      // 租赁中 - 原订单进行中，续租订单待生效
      const rentingPendingId = `RENTING_PENDING_${baseTime}_005`;
      const rentingPendingStart = new Date();
      rentingPendingStart.setDate(rentingPendingStart.getDate() - 1);
      rentingPendingStart.setHours(9, 0, 0, 0);
      const originalPendingEnd = new Date(rentingPendingStart);
      originalPendingEnd.setDate(rentingPendingStart.getDate() + 3);
      originalPendingEnd.setHours(18, 0, 0, 0);
      const renewalPendingEnd = new Date(originalPendingEnd);
      renewalPendingEnd.setDate(originalPendingEnd.getDate() + 2);
      renewalPendingEnd.setHours(18, 0, 0, 0);
      
      mockOrders.push({
        id: rentingPendingId,
        statusText: "租赁中",
        orderStatus: 1,
        subStatus: 1,
        price: null,
        carModel: carModels[4],
        carNumber: carNumbers[4],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDateTime(rentingPendingStart),
        returnTime: formatDateTime(renewalPendingEnd), // 显示预计的最终还车时间
        rentalDays: 5, // 总天数（原订单3天+续租2天）
        orderType: activeOrderType,
        vehicleRecordId: `VR_${rentingPendingId}`,
        hasOrderChain: true,
        totalRentalDays: 5,
        isRenewalOrder: false,
        renewalCount: 1,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: rentingPendingId,
            orderType: "原订单",
            orderStatus: "租赁中", // 原订单还在租赁中
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(rentingPendingStart),
            endTime: formatDateTime(originalPendingEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(rentingPendingStart.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${rentingPendingId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "待生效", // 续租订单待生效
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(originalPendingEnd), // 续租开始时间 = 原订单结束时间
            endTime: formatDateTime(renewalPendingEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date()) // 续租订单是最近创建的
          }
        ]
      });

      // 租赁中 - 原订单进行中，多个续租订单待生效
      const rentingMultiPendingId = `RENTING_MULTI_PENDING_${baseTime}_006`;
      const rentingMultiStart = new Date();
      rentingMultiStart.setDate(rentingMultiStart.getDate() - 1);
      rentingMultiStart.setHours(10, 0, 0, 0);
      const originalMultiEnd = new Date(rentingMultiStart);
      originalMultiEnd.setDate(rentingMultiStart.getDate() + 4);
      originalMultiEnd.setHours(17, 0, 0, 0);
      const renewal1MultiEnd = new Date(originalMultiEnd);
      renewal1MultiEnd.setDate(originalMultiEnd.getDate() + 3);
      renewal1MultiEnd.setHours(17, 0, 0, 0);
      const renewal2MultiEnd = new Date(renewal1MultiEnd);
      renewal2MultiEnd.setDate(renewal1MultiEnd.getDate() + 2);
      renewal2MultiEnd.setHours(17, 0, 0, 0);
      
      mockOrders.push({
        id: rentingMultiPendingId,
        statusText: "租赁中",
        orderStatus: 1,
        subStatus: 1,
        price: null,
        carModel: carModels[0],
        carNumber: carNumbers[2],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[2],
        returnStore: stores[2],
        managerName: managers[2],
        managerPhone: phones[2],
        pickupTime: formatDateTime(rentingMultiStart),
        returnTime: formatDateTime(renewal2MultiEnd), // 显示最终预计还车时间
        rentalDays: 9, // 总天数（4+3+2=9天）
        orderType: activeOrderType,
        vehicleRecordId: `VR_${rentingMultiPendingId}`,
        hasOrderChain: true,
        totalRentalDays: 9,
        isRenewalOrder: false,
        renewalCount: 2, // 有2次续租
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: rentingMultiPendingId,
            orderType: "原订单",
            orderStatus: "租赁中", // 原订单还在进行中
            price: 960,
            rentalDays: 4,
            startTime: formatDateTime(rentingMultiStart),
            endTime: formatDateTime(originalMultiEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(rentingMultiStart.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${rentingMultiPendingId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "待生效", // 第1次续租待生效
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(originalMultiEnd),
            endTime: formatDateTime(renewal1MultiEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(Date.now() - 2*60*60*1000)) // 2小时前创建
          },
          {
            orderId: `${rentingMultiPendingId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "待生效", // 第2次续租也待生效
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(renewal1MultiEnd),
            endTime: formatDateTime(renewal2MultiEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(Date.now() - 0.5*60*60*1000)) // 30分钟前创建
          }
        ]
      });
    }

    // 已完成状态 - 生成已完成订单链数据
    if (activeStatus === 2) {
      // 简单已完成订单
      const completed1Id = `COMPLETED_1_${baseTime}_001`;
      const completed1Start = new Date();
      completed1Start.setDate(completed1Start.getDate() - 10);
      completed1Start.setHours(9, 0, 0, 0);
      const completed1End = new Date(completed1Start);
      completed1End.setDate(completed1Start.getDate() + 3);
      completed1End.setHours(18, 0, 0, 0);
      
      mockOrders.push({
        id: completed1Id,
        statusText: "已完成",
        orderStatus: 2,
        subStatus: 2,
        price: null, // 已完成订单也通过订单链查看详情
        carModel: carModels[0],
        carNumber: carNumbers[0],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(completed1Start),
        returnTime: formatDateTime(completed1End),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${completed1Id}`,
        hasOrderChain: true, // 已完成订单也显示订单链
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: completed1Id,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(completed1Start),
            endTime: formatDateTime(completed1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(completed1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 已完成 - 有续租的复杂订单
      const completedComplexId = `COMPLETED_COMPLEX_${baseTime}_002`;
      const completedComplexStart = new Date();
      completedComplexStart.setDate(completedComplexStart.getDate() - 15);
      completedComplexStart.setHours(9, 0, 0, 0);
      const completedOriginalEnd = new Date(completedComplexStart);
      completedOriginalEnd.setDate(completedComplexStart.getDate() + 3);
      completedOriginalEnd.setHours(18, 0, 0, 0);
      const completedRenewal1End = new Date(completedOriginalEnd);
      completedRenewal1End.setDate(completedOriginalEnd.getDate() + 2);
      completedRenewal1End.setHours(18, 0, 0, 0);
      const completedRenewal2End = new Date(completedRenewal1End);
      completedRenewal2End.setDate(completedRenewal1End.getDate() + 4);
      completedRenewal2End.setHours(18, 0, 0, 0);
      
      mockOrders.push({
        id: completedComplexId,
        statusText: "已完成",
        orderStatus: 2,
        subStatus: 2,
        price: null,
        carModel: carModels[1],
        carNumber: carNumbers[1],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[1],
        returnStore: stores[1],
        managerName: managers[1],
        managerPhone: phones[1],
        pickupTime: formatDateTime(completedComplexStart),
        returnTime: formatDateTime(completedRenewal2End),
        rentalDays: 9,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${completedComplexId}`,
        hasOrderChain: true,
        totalRentalDays: 9,
        isRenewalOrder: false,
        renewalCount: 2,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: completedComplexId,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(completedComplexStart),
            endTime: formatDateTime(completedOriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(completedComplexStart.getTime() - 24*60*60*1000))
          },
          {
            orderId: `${completedComplexId}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "已完成",
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(completedOriginalEnd),
            endTime: formatDateTime(completedRenewal1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(completedOriginalEnd.getTime() - 2*60*60*1000))
          },
          {
            orderId: `${completedComplexId}_RENEWAL_2`,
            orderType: "第2次续租",
            orderStatus: "已完成",
            price: 960,
            rentalDays: 4,
            startTime: formatDateTime(completedRenewal1End),
            endTime: formatDateTime(completedRenewal2End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(completedRenewal1End.getTime() - 1*60*60*1000))
          }
        ]
      });

      // 已完成 - 有超时补缴的订单
      const completedOvertimeId = `COMPLETED_OVERTIME_${baseTime}_003`;
      const completedOvertimeStart = new Date();
      completedOvertimeStart.setDate(completedOvertimeStart.getDate() - 20);
      completedOvertimeStart.setHours(9, 0, 0, 0);
      const completedOvertimePlanEnd = new Date(completedOvertimeStart);
      completedOvertimePlanEnd.setDate(completedOvertimeStart.getDate() + 5);
      completedOvertimePlanEnd.setHours(18, 0, 0, 0);
      const completedOvertimeActualEnd = new Date(completedOvertimePlanEnd);
      completedOvertimeActualEnd.setHours(22, 30, 0, 0); // 超时4.5小时
      
      mockOrders.push({
        id: completedOvertimeId,
        statusText: "已完成",
        orderStatus: 2,
        subStatus: 2,
        price: null,
        carModel: carModels[2],
        carNumber: carNumbers[2],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[2],
        returnStore: stores[2],
        managerName: managers[2],
        managerPhone: phones[2],
        pickupTime: formatDateTime(completedOvertimeStart),
        returnTime: formatDateTime(completedOvertimeActualEnd),
        rentalDays: 5,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${completedOvertimeId}`,
        hasOrderChain: true,
        totalRentalDays: 5,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: true, // 有超时补缴记录
        orderChainDetails: [
          {
            orderId: completedOvertimeId,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 1200,
            rentalDays: 5,
            startTime: formatDateTime(completedOvertimeStart),
            endTime: formatDateTime(completedOvertimePlanEnd),
            actualEndTime: formatDateTime(completedOvertimeActualEnd),
            isOvertime: true,
            overtimeHours: 4.5,
            overtimeFee: 315, // 已补缴的超时费用
            createTime: formatCreateTime(new Date(completedOvertimeStart.getTime() - 24*60*60*1000))
          }
        ]
      });
    }

    // 已取消状态 - 简单订单
    if (activeStatus === 3) {
      const cancelledId = `CANCELLED_${baseTime}_001`;
      const cancelledPickupDate = new Date();
      cancelledPickupDate.setDate(cancelledPickupDate.getDate() - 5);
      const cancelledReturnDate = new Date(cancelledPickupDate);
      cancelledReturnDate.setDate(cancelledPickupDate.getDate() + 3);
      
      mockOrders.push({
        id: cancelledId,
        statusText: "已取消",
        orderStatus: 3,
        subStatus: 3,
        price: 720,
        carModel: carModels[3],
        carNumber: carNumbers[3],
        carImage: "../../assets/rsg.png",
        pickupStore: stores[0],
        returnStore: stores[0],
        managerName: managers[0],
        managerPhone: phones[0],
        pickupTime: formatDateTime(cancelledPickupDate),
        returnTime: formatDateTime(cancelledReturnDate),
        rentalDays: 3,
        orderType: activeOrderType,
        vehicleRecordId: `VR_${cancelledId}`,
        hasOrderChain: false, // 已取消订单不显示订单链
        totalRentalDays: 3,
        isRenewalOrder: false,
        renewalCount: 0,
        hasPayment: false
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