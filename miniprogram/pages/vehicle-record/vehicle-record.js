// vehicle-record.js - 挖机出车记录列表页面
const loginCheck = require('../../behaviors/loginCheck.js');

Page({
  behaviors: [loginCheck],
  data: {
    // 出车记录状态 - 增加待补缴状态
    statusList: [
      { id: 1, name: "出车中" },
      { id: 2, name: "还车待审核" },
      { id: 4, name: "待补缴" },  // 新增待补缴状态
      { id: 3, name: "已完成" }
    ],
    activeStatus: 1,
    
    // 出车记录列表
    recordList: [],
    pageNum: 1,
    pageSize: 10,
    totalCount: 0,
    totalPage: 0,
    isLoading: false,
    hasMoreRecords: true,
    
    // 用户信息
    userInfo: null,
    storeInfo: null, // 当前用户管理的门店信息
    
    // 交互状态
    activeMoreId: null, // 当前展开的"更多"菜单
    expandedChainIds: [], // 展开的订单链折叠区域
  },

  onLoad: function(options) {
    // 检查登录状态
    if (!this.checkLogin()) {
      return;
    }
    
    // 检查门店管理员权限
    this.checkStoreManagerPermission();
  },

  onShow: function() {
    // 每次显示页面时都检查登录状态
    if (!this.checkLogin()) {
      return;
    }
  },

  onPullDownRefresh: function() {
    this.setData({
      pageNum: 1,
      hasMoreRecords: true,
      expandedChainIds: [],
      activeMoreId: null
    });
    this.getRecordList(true);
    wx.stopPullDownRefresh();
  },

  onReachBottom: function() {
    if (this.data.hasMoreRecords && !this.data.isLoading) {
      this.loadMoreRecords();
    }
  },

  // ==================== 权限检查 ====================
  
  checkStoreManagerPermission: function() {
    console.log("999999999");
    // 先获取用户信息和门店信息
    this.getUserInfo();
  },

  getUserInfo: function() {
    wx.showLoading({ title: '验证权限中...' });
    
    // 模拟API调用获取用户信息
    setTimeout(() => {
      // 模拟用户信息和门店信息
      const mockUserInfo = {
        id: 'user_001',
        name: '张管理员',
        phone: '138****8888',
        role: 'store_manager', // store_manager: 门店管理员, normal: 普通用户
        storeId: 'store_001'
      };
      
      const mockStoreInfo = {
        id: 'store_001',
        name: '重庆渝北区分店',
        address: '重庆市渝北区XX路XX号',
        managerId: 'user_001'
      };
      
      wx.hideLoading();
      
      // 检查是否为门店管理员
      if (mockUserInfo.role !== 'store_manager') {
        wx.showModal({
          title: '权限不足',
          content: '只有门店管理员才能查看出车记录',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }
      
      this.setData({
        userInfo: mockUserInfo,
        storeInfo: mockStoreInfo
      });
      
      // 获取出车记录列表
      this.getRecordList(true);
    }, 1000);
  },

  // ==================== 数据获取 ====================
  
  getRecordList: function(isRefresh) {
    if (this.data.isLoading) return;
    
    this.setData({ isLoading: true });
    
    // 模拟API调用
    setTimeout(() => {
      const mockData = this.generateMockRecordData();
      this.handleRecordListResponse(mockData, isRefresh);
    }, 800);
  },

  handleRecordListResponse: function(responseData, isRefresh) {
    // 对每个出车记录进行数据预处理
    const processedRecords = responseData.list.map(record => this.processRecordData(record));
    
    if (isRefresh) {
      this.setData({
        recordList: processedRecords,
        isLoading: false,
        totalCount: responseData.totalCount,
        totalPage: responseData.totalPage,
        pageNum: 2,
        hasMoreRecords: responseData.pageNum < responseData.totalPage
      });
    } else {
      this.setData({
        recordList: [...this.data.recordList, ...processedRecords],
        isLoading: false,
        pageNum: this.data.pageNum + 1,
        hasMoreRecords: responseData.pageNum < responseData.totalPage
      });
    }
  },

  /**
   * 拨打电话
   */
  makePhoneCall: function(e) {
    const phoneNumber = e.currentTarget.dataset.phone;
    
    if (!phoneNumber) {
      wx.showToast({
        title: '电话号码无效',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 显示确认对话框
    wx.showModal({
      title: '拨打电话',
      content: `确定要拨打 ${phoneNumber} 吗？`,
      confirmText: '拨打',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          // 用户确认拨打
          wx.makePhoneCall({
            phoneNumber: phoneNumber,
            success: function() {
              console.log('拨打电话成功');
            },
            fail: function(err) {
              console.error('拨打电话失败：', err);
              wx.showToast({
                title: '拨打失败，请检查设备',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      }
    });
  },

  // 预处理出车记录数据
  processRecordData: function(record) {
    const processedRecord = { ...record };
    
    // 预计算状态样式类名
    processedRecord.statusClassName = this.getStatusClassName(record.status);
    
    // 预计算操作按钮显示逻辑
    processedRecord.actionButtons = this.getActionButtons(record);
    
    // 预计算更多菜单项
    processedRecord.moreMenuItems = this.getMoreMenuItems(record);
    
    // 预计算订单链相关属性
    if (record.hasOrderChain && record.orderChainDetails) {
      processedRecord.chainSummary = this.getChainSummary(record);
      processedRecord.processedChainDetails = record.orderChainDetails.map(chainItem => 
        this.processChainItemData(chainItem)
      );
    }
    
    // 预计算展开状态
    processedRecord.isChainExpanded = this.data.expandedChainIds.includes(record.id);
    processedRecord.isMoreMenuOpen = this.data.activeMoreId === record.id;
    
    // 添加CSS类名用于控制层级
    processedRecord.cssClasses = processedRecord.isMoreMenuOpen ? 'more-open' : '';
    
    // 计算待补缴金额
    processedRecord.pendingPayment = this.calculatePendingPayment(record);
    
    return processedRecord;
  },

  // 计算待补缴金额
  calculatePendingPayment: function(record) {
    if (!record.orderChainDetails) return 0;
    
    let totalPendingAmount = 0;
    
    record.orderChainDetails.forEach(chainItem => {
      // 只有确实标记为"待补缴"或"待支付"状态的订单才计算
      // 还车审核中的订单虽然有超时费用，但还没确定补缴，不计算
      if (chainItem.orderStatus && 
          (chainItem.orderStatus.includes('待补缴') || 
           chainItem.orderStatus.includes('待支付'))) {
        
        // 超时费用
        if (chainItem.isOvertime && chainItem.overtimeFee) {
          totalPendingAmount += chainItem.overtimeFee;
        }
        
        // 其他待支付费用
        if (chainItem.pendingAmount) {
          totalPendingAmount += chainItem.pendingAmount;
        }
      }
    });
    
    return totalPendingAmount;
  },

  // 获取状态样式类名
  getStatusClassName: function(status) {
    const statusClassMap = {
      1: 'status-renting',     // 出车中
      2: 'status-waiting',     // 还车待审核
      3: 'status-completed',   // 已完成
      4: 'status-pending-payment'  // 待补缴
    };
    return statusClassMap[status] || 'status-unknown';
  },

  // 获取操作按钮配置
  getActionButtons: function(record) {
    const buttons = [];
    
    switch (record.status) {
      case 1: // 出车中
        buttons.push(
          { text: '续租', action: 'handleRenewal', highlight: false },
          { text: '还车', action: 'handleReturn', highlight: true }
        );
        break;
        
      case 2: // 还车待审核
        buttons.push(
          { text: '去审核', action: 'handleAudit', highlight: true }
        );
        break;
        
      case 4: // 待补缴
        // 门店管理员视角：不需要"去补缴"按钮，只需要查看和管理
        // 可以联系租户或记录补缴情况
        buttons.push(
          { text: '联系租户', action: 'contactRenter', highlight: true }
        );
        break;
        
      case 3: // 已完成
        // 无按钮
        break;
    }
    
    return buttons;
  },

  // 获取更多菜单项
  getMoreMenuItems: function(record) {
    const items = [
      { text: '记录详情', action: 'viewRecordDetails', showAlways: true }
    ];
    
    // 出车中状态可以修改记录
    if (record.status === 1) {
      items.push({ text: '修改记录', action: 'modifyRecord', showAlways: false });
    }
    
    // 待补缴状态可以查看补缴详情和记录补缴操作
    if (record.status === 4) {
      items.push(
        { text: '补缴详情', action: 'viewPaymentDetails', showAlways: false },
        { text: '记录补缴', action: 'recordPayment', showAlways: false }
      );
    }
    
    return items;
  },

  // 获取订单链摘要信息
  getChainSummary: function(record) {
    return {
      totalOrders: record.orderChainDetails ? record.orderChainDetails.length : 0,
      renewalCount: record.renewalCount || 0,
      hasPayment: record.hasPayment || false,
      badges: this.getChainBadges(record)
    };
  },

  // 获取订单链标签
  getChainBadges: function(record) {
    const badges = [];
    
    if (record.renewalCount > 0) {
      badges.push({
        text: `续租${record.renewalCount}次`,
        type: 'renewal'
      });
    }
    
    // 只有在已完成或待补缴状态下才显示补缴标签
    // 还车待审核状态不显示，因为补缴只有在管理员审核后才会产生
    if ((record.status === 3 || record.status === 4) && record.hasPayment) {
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
      (chainItem.orderStatus.indexOf('补缴') > -1 || chainItem.orderStatus.indexOf('待支付') > -1);
    
    // 格式化数据
    processed.formattedPrice = `¥${chainItem.price}`;
    processed.formattedOvertimeFee = chainItem.overtimeFee ? `¥${chainItem.overtimeFee}` : '';
    
    // 格式化生效时间
    processed.formattedEffectiveTime = `${chainItem.startTime} - ${chainItem.endTime}`;
    
    // 格式化创建时间
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

  loadMoreRecords: function() {
    this.getRecordList(false);
  },

  // ==================== 交互事件 ====================

  switchStatus: function(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    if (status !== this.data.activeStatus) {
      this.setData({
        activeStatus: status,
        pageNum: 1,
        hasMoreRecords: true,
        recordList: [],
        expandedChainIds: [],
        activeMoreId: null
      });
      this.getRecordList(true);
    }
  },

  // 切换订单链折叠状态
  toggleOrderChain: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const recordId = e.currentTarget.dataset.recordId;
    const expandedIds = this.data.expandedChainIds;
    
    let newExpandedIds;
    if (expandedIds.includes(recordId)) {
      newExpandedIds = expandedIds.filter(id => id !== recordId);
    } else {
      newExpandedIds = [...expandedIds, recordId];
    }
    
    this.setData({
      expandedChainIds: newExpandedIds
    }, () => {
      this.updateRecordListState();
    });
  },

  // 显示更多操作菜单
  showMoreActions: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const recordId = e.currentTarget.dataset.id;
    const currentActiveId = this.data.activeMoreId;
    const newActiveId = currentActiveId === recordId ? null : recordId;
    
    this.setData({ 
      activeMoreId: newActiveId 
    }, () => {
      this.updateRecordListState();
    });
  },

  // 更新记录列表状态
  updateRecordListState: function() {
    const updatedRecordList = this.data.recordList.map(record => {
      const updated = { ...record };
      updated.isChainExpanded = this.data.expandedChainIds.includes(record.id);
      updated.isMoreMenuOpen = this.data.activeMoreId === record.id;
      updated.cssClasses = updated.isMoreMenuOpen ? 'more-open' : '';
      return updated;
    });
    
    this.setData({ recordList: updatedRecordList });
  },

  // 关闭所有弹窗
  closeAllDropdowns: function() {
    this.setData({ activeMoreId: null }, () => {
      this.updateRecordListState();
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

  // ==================== 出车记录操作 ====================

  // 通用操作处理函数
  handleAction: function(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    const action = e.currentTarget.dataset.action;
    const recordId = e.currentTarget.dataset.id;
    
    this.closeAllDropdowns();
    
    if (this[action]) {
      this[action]({ currentTarget: { dataset: { id: recordId } } });
    } else {
      console.error('Action method not found:', action);
    }
  },

  viewRecordDetails: function(e) {
    const recordId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.navigateTo({
      url: `/pages/vehicle-record-detail/vehicle-record-detail?recordId=${recordId}`
    });
  },

  modifyRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.navigateTo({
      url: `/pages/modify-record/modify-record?recordId=${recordId}`
    });
  },

  viewPaymentDetails: function(e) {
    const recordId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.navigateTo({
      url: `/pages/payment-details/payment-details?recordId=${recordId}`
    });
  },

  handleRenewal: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/renewal-car/renewal-car?recordId=${recordId}`
    });
  },

  handleReturn: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/return-car/return-car?recordId=${recordId}`
    });
  },

  handleAudit: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/audit-return/audit-return?recordId=${recordId}`
    });
  },

  recordPayment: function(e) {
    const recordId = e.currentTarget.dataset.id;
    this.closeAllDropdowns();
    wx.navigateTo({
      url: `/pages/record-payment/record-payment?recordId=${recordId}`
    });
  },

  contactRenter: function(e) {
    const recordId = e.currentTarget.dataset.id;
    // 找到对应的记录
    const record = this.data.recordList.find(item => item.id === recordId);
    if (record && record.renterPhone) {
      this.makePhoneCall({ currentTarget: { dataset: { phone: record.renterPhone } } });
    } else {
      wx.showToast({
        title: '联系方式不可用',
        icon: 'none',
        duration: 2000
      });
    }
  },

  handlePayment: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/payment/payment?recordId=${recordId}`
    });
  },

  // ==================== 数据生成 ====================

  generateMockRecordData: function() {
    const { activeStatus, pageNum, storeInfo } = this.data;
    
    if (!storeInfo) return { list: [], pageNum: 1, pageSize: 10, totalCount: 0, totalPage: 0 };
    
    // 基础数据
    const carModels = ["现代挖掘机R225LC-9T", "三一SY16C", "徐工XE27E", "柳工915E", "临工LG6150"];
    const carNumbers = ["京A12345", "沪B67890", "粤C11111", "川D88888", "湘E99999"];
    const renters = ["张三", "李四", "王五", "赵六", "钱七"];
    const phones = ["138****8888", "139****6666", "187****1234", "156****9999", "180****5555"];
    
    const mockRecords = [];
    const baseTime = Date.now();
    
    // 格式化日期
    const formatDateTime = (date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      return `${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    const formatCreateTime = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();
      return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
    };

    // 出车中状态
    if (activeStatus === 1) {
      const record1Id = `RECORD_RENTING_${baseTime}_001`;
      const record1Start = new Date();
      record1Start.setDate(record1Start.getDate() - 2);
      record1Start.setHours(9, 0, 0, 0);
      const record1End = new Date(record1Start);
      record1End.setDate(record1Start.getDate() + 3);
      record1End.setHours(18, 0, 0, 0);
      
      mockRecords.push({
        id: record1Id,
        status: 1,
        statusText: "出车中",
        carModel: carModels[0],
        carNumber: carNumbers[0],
        carImage: "../../assets/rsg.png",
        renterName: renters[0],
        renterPhone: phones[0],
        startTime: formatDateTime(record1Start),
        endTime: formatDateTime(record1End),
        rentalDays: 3,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 0,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: `ORDER_${record1Id}`,
            orderType: "原订单",
            orderStatus: "租赁中",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record1Start),
            endTime: formatDateTime(record1End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(record1Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 出车中 - 有续租的记录
      const record2Id = `RECORD_RENTING_${baseTime}_002`;
      const record2Start = new Date();
      record2Start.setDate(record2Start.getDate() - 5);
      record2Start.setHours(9, 0, 0, 0);
      const record2OriginalEnd = new Date(record2Start);
      record2OriginalEnd.setDate(record2Start.getDate() + 3);
      record2OriginalEnd.setHours(18, 0, 0, 0);
      const record2RenewalEnd = new Date(record2OriginalEnd);
      record2RenewalEnd.setDate(record2OriginalEnd.getDate() + 2);
      record2RenewalEnd.setHours(18, 0, 0, 0);
      
      mockRecords.push({
        id: record2Id,
        status: 1,
        statusText: "出车中",
        carModel: carModels[1],
        carNumber: carNumbers[1],
        carImage: "../../assets/rsg.png",
        renterName: renters[1],
        renterPhone: phones[1],
        startTime: formatDateTime(record2Start),
        endTime: formatDateTime(record2RenewalEnd),
        rentalDays: 5,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 1,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: `ORDER_${record2Id}`,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record2Start),
            endTime: formatDateTime(record2OriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(record2Start.getTime() - 24*60*60*1000))
          },
          {
            orderId: `ORDER_${record2Id}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "租赁中",
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(record2OriginalEnd),
            endTime: formatDateTime(record2RenewalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(record2OriginalEnd.getTime() - 1*60*60*1000))
          }
        ]
      });
    }

    // 还车待审核状态
    if (activeStatus === 2) {
      const record3Id = `RECORD_AUDIT_${baseTime}_001`;
      const record3Start = new Date();
      record3Start.setDate(record3Start.getDate() - 4);
      record3Start.setHours(9, 0, 0, 0);
      const record3PlanEnd = new Date(record3Start);
      record3PlanEnd.setDate(record3Start.getDate() + 3);
      record3PlanEnd.setHours(18, 0, 0, 0);
      const record3ActualEnd = new Date(record3PlanEnd);
      record3ActualEnd.setHours(22, 0, 0, 0);
      
      mockRecords.push({
        id: record3Id,
        status: 2,
        statusText: "还车待审核",
        carModel: carModels[2],
        carNumber: carNumbers[2],
        carImage: "../../assets/rsg.png",
        renterName: renters[2],
        renterPhone: phones[2],
        startTime: formatDateTime(record3Start),
        endTime: formatDateTime(record3ActualEnd),
        rentalDays: 3,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 0,
        hasPayment: false, // 还车待审核时不显示补缴标签
        orderChainDetails: [
          {
            orderId: `ORDER_${record3Id}`,
            orderType: "原订单",
            orderStatus: "还车审核中", // 还车待审核状态，不是待补缴
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record3Start),
            endTime: formatDateTime(record3PlanEnd),
            actualEndTime: formatDateTime(record3ActualEnd),
            isOvertime: true,
            overtimeHours: 4,
            overtimeFee: 240, // 这里有超时费用，但状态还是审核中，还没确定补缴
            createTime: formatCreateTime(new Date(record3Start.getTime() - 24*60*60*1000))
          }
        ]
      });
    }

    // 待补缴状态
    if (activeStatus === 4) {
      // 待补缴记录1 - 有超时费用
      const record6Id = `RECORD_PENDING_${baseTime}_001`;
      const record6Start = new Date();
      record6Start.setDate(record6Start.getDate() - 8);
      record6Start.setHours(9, 0, 0, 0);
      const record6PlanEnd = new Date(record6Start);
      record6PlanEnd.setDate(record6Start.getDate() + 3);
      record6PlanEnd.setHours(18, 0, 0, 0);
      const record6ActualEnd = new Date(record6PlanEnd);
      record6ActualEnd.setHours(23, 0, 0, 0);
      
      mockRecords.push({
        id: record6Id,
        status: 4,
        statusText: "待补缴",
        carModel: carModels[0],
        carNumber: carNumbers[0],
        carImage: "../../assets/rsg.png",
        renterName: renters[0],
        renterPhone: phones[0],
        startTime: formatDateTime(record6Start),
        endTime: formatDateTime(record6ActualEnd),
        rentalDays: 3,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 0,
        hasPayment: true,
        orderChainDetails: [
          {
            orderId: `ORDER_${record6Id}`,
            orderType: "原订单",
            orderStatus: "待补缴超时费",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record6Start),
            endTime: formatDateTime(record6PlanEnd),
            actualEndTime: formatDateTime(record6ActualEnd),
            isOvertime: true,
            overtimeHours: 5,
            overtimeFee: 350,
            createTime: formatCreateTime(new Date(record6Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 待补缴记录2 - 有续租和多笔超时费用
      const record7Id = `RECORD_PENDING_${baseTime}_002`;
      const record7Start = new Date();
      record7Start.setDate(record7Start.getDate() - 12);
      record7Start.setHours(9, 0, 0, 0);
      const record7OriginalEnd = new Date(record7Start);
      record7OriginalEnd.setDate(record7Start.getDate() + 3);
      record7OriginalEnd.setHours(18, 0, 0, 0);
      const record7RenewalEnd = new Date(record7OriginalEnd);
      record7RenewalEnd.setDate(record7OriginalEnd.getDate() + 2);
      record7RenewalEnd.setHours(18, 0, 0, 0);
      const record7ActualEnd = new Date(record7RenewalEnd);
      record7ActualEnd.setDate(record7RenewalEnd.getDate() + 1);
      record7ActualEnd.setHours(10, 0, 0, 0);
      
      mockRecords.push({
        id: record7Id,
        status: 4,
        statusText: "待补缴",
        carModel: carModels[1],
        carNumber: carNumbers[1],
        carImage: "../../assets/rsg.png",
        renterName: renters[1],
        renterPhone: phones[1],
        startTime: formatDateTime(record7Start),
        endTime: formatDateTime(record7ActualEnd),
        rentalDays: 6,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 1,
        hasPayment: true,
        orderChainDetails: [
          {
            orderId: `ORDER_${record7Id}`,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record7Start),
            endTime: formatDateTime(record7OriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(record7Start.getTime() - 24*60*60*1000))
          },
          {
            orderId: `ORDER_${record7Id}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "待补缴超时费",
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(record7OriginalEnd),
            endTime: formatDateTime(record7RenewalEnd),
            actualEndTime: formatDateTime(record7ActualEnd),
            isOvertime: true,
            overtimeHours: 16,
            overtimeFee: 1120,
            createTime: formatCreateTime(new Date(record7OriginalEnd.getTime() - 1*60*60*1000))
          }
        ]
      });
    }

    // 已完成状态
    if (activeStatus === 3) {
      const record4Id = `RECORD_COMPLETED_${baseTime}_001`;
      const record4Start = new Date();
      record4Start.setDate(record4Start.getDate() - 10);
      record4Start.setHours(9, 0, 0, 0);
      const record4End = new Date(record4Start);
      record4End.setDate(record4Start.getDate() + 3);
      record4End.setHours(18, 0, 0, 0);
      
      mockRecords.push({
        id: record4Id,
        status: 3,
        statusText: "已完成",
        carModel: carModels[3],
        carNumber: carNumbers[3],
        carImage: "../../assets/rsg.png",
        renterName: renters[3],
        renterPhone: phones[3],
        startTime: formatDateTime(record4Start),
        endTime: formatDateTime(record4End),
        rentalDays: 3,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 0,
        hasPayment: false,
        orderChainDetails: [
          {
            orderId: `ORDER_${record4Id}`,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record4Start),
            endTime: formatDateTime(record4End),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(record4Start.getTime() - 24*60*60*1000))
          }
        ]
      });

      // 已完成 - 有续租和超时的复杂记录
      const record5Id = `RECORD_COMPLETED_${baseTime}_002`;
      const record5Start = new Date();
      record5Start.setDate(record5Start.getDate() - 15);
      record5Start.setHours(9, 0, 0, 0);
      const record5OriginalEnd = new Date(record5Start);
      record5OriginalEnd.setDate(record5Start.getDate() + 3);
      record5OriginalEnd.setHours(18, 0, 0, 0);
      const record5RenewalPlanEnd = new Date(record5OriginalEnd);
      record5RenewalPlanEnd.setDate(record5OriginalEnd.getDate() + 2);
      record5RenewalPlanEnd.setHours(18, 0, 0, 0);
      const record5ActualEnd = new Date(record5RenewalPlanEnd);
      record5ActualEnd.setHours(23, 30, 0, 0);
      
      mockRecords.push({
        id: record5Id,
        status: 3,
        statusText: "已完成",
        carModel: carModels[4],
        carNumber: carNumbers[4],
        carImage: "../../assets/rsg.png",
        renterName: renters[4],
        renterPhone: phones[4],
        startTime: formatDateTime(record5Start),
        endTime: formatDateTime(record5ActualEnd),
        rentalDays: 5,
        storeId: storeInfo.id,
        storeName: storeInfo.name,
        hasOrderChain: true,
        renewalCount: 1,
        hasPayment: true,
        orderChainDetails: [
          {
            orderId: `ORDER_${record5Id}`,
            orderType: "原订单",
            orderStatus: "已完成",
            price: 720,
            rentalDays: 3,
            startTime: formatDateTime(record5Start),
            endTime: formatDateTime(record5OriginalEnd),
            isOvertime: false,
            overtimeHours: 0,
            createTime: formatCreateTime(new Date(record5Start.getTime() - 24*60*60*1000))
          },
          {
            orderId: `ORDER_${record5Id}_RENEWAL_1`,
            orderType: "第1次续租",
            orderStatus: "已完成",
            price: 480,
            rentalDays: 2,
            startTime: formatDateTime(record5OriginalEnd),
            endTime: formatDateTime(record5RenewalPlanEnd),
            actualEndTime: formatDateTime(record5ActualEnd),
            isOvertime: true,
            overtimeHours: 5.5,
            overtimeFee: 385,
            createTime: formatCreateTime(new Date(record5OriginalEnd.getTime() - 1*60*60*1000))
          }
        ]
      });
    }

    return {
      list: mockRecords,
      pageNum: pageNum,
      pageSize: 10,
      totalCount: 20,
      totalPage: 2
    };
  }
});
      