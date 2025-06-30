Page({
  data: {
    // 订单基本信息
    orderInfo: {
      orderId: '',
      carModel: '',
      managerName: '',
      managerPhone: ''
    },
    
    // 续租信息
    renewInfo: {
      days: 0,
      newPeriod: ''
    },
    
    // 支付信息
    paymentInfo: {
      renewAmount: '0.00',
      membershipAmount: '0.00',
      serviceFee: '0.00',
      totalAmount: '0.00',
      payTime: ''
    },
    
    // 是否显示会员升级提示
    showMemberUpgrade: false
  },

  onLoad(options) {
    console.log('续租成功页面加载', options);
    this.initSuccessPage(options);
  },

  // 初始化成功页面
  async initSuccessPage(options) {
    wx.showLoading({
      title: '加载中...'
    });

    try {
      // 引入数据管理工具
      const DataManager = require('../../utils/data-manager.js');
      
      // 1. 优先使用全局传递的数据（从续租页面传递过来的完整数据）
      const globalData = DataManager.getGlobalOrderData(5 * 60 * 1000); // 5分钟有效期
      
      if (globalData && globalData.orderId === options.orderId) {
        console.log('使用全局传递的完整数据');
        this.setDataFromGlobal(globalData, options);
        wx.hideLoading();
        this.showSuccessToast();
        return;
      }

      // 2. 其次尝试从缓存获取订单信息
      const cachedData = DataManager.getCachedOrderData(options.orderId);
      if (cachedData) {
        console.log('使用缓存的订单数据');
        this.setDataFromCache(cachedData, options);
        wx.hideLoading();
        this.showSuccessToast();
        return;
      }

      // 3. 从URL参数解析基本信息并设置默认数据
      this.parseUrlParams(options);
      this.setDefaultData(options);
      
      wx.hideLoading();
      this.showSuccessToast();
      
    } catch (error) {
      wx.hideLoading();
      console.error('页面初始化失败', error);
      this.handleInitError(options);
    }
  },

  // 从全局数据设置页面数据（设备租赁业务版本）
  setDataFromGlobal(globalData, options) {
    this.setData({
      orderInfo: {
        orderId: globalData.orderInfo?.orderId || options.orderId,
        equipmentId: globalData.orderInfo?.equipmentId,
        equipmentModel: globalData.orderInfo?.equipmentModel || globalData.orderInfo?.carModel || '设备名称',
        equipmentBrand: globalData.orderInfo?.equipmentBrand,
        equipmentCategory: globalData.orderInfo?.equipmentCategory,
        storeId: globalData.orderInfo?.storeId,
        storeName: globalData.orderInfo?.storeName,
        storeAddress: globalData.orderInfo?.storeAddress,
        managerId: globalData.orderInfo?.managerId,
        managerName: globalData.orderInfo?.managerName || '管理员',
        managerPhone: globalData.orderInfo?.managerPhone || '',
        operatorInfo: globalData.orderInfo?.operatorInfo,
        dashboardData: globalData.orderInfo?.dashboardData
      },
      renewInfo: {
        days: parseInt(globalData.renewDays || options.renewDays || '0'),
        newPeriod: globalData.newEndTime ? `续租至 ${globalData.newEndTime}` : '',
        equipmentUsage: this.calculateEquipmentUsage(globalData.orderInfo?.dashboardData)
      },
      paymentInfo: {
        renewAmount: globalData.paymentDetails?.renewAmount || '0.00',
        membershipAmount: globalData.paymentDetails?.membershipAmount || '0.00',
        serviceFee: globalData.paymentDetails?.serviceFee || '0.00',
        totalAmount: globalData.paymentDetails?.totalAmount || options.totalAmount || '0.00',
        payTime: this.formatPaymentTime(globalData.paymentDetails?.payTime || Date.now())
      },
      showMemberUpgrade: globalData.purchaseMembership === true || options.purchaseMembership === 'true',
      // 设备信息显示
      showEquipmentInfo: !!globalData.orderInfo?.equipmentId,
      showDashboard: !!globalData.orderInfo?.dashboardData
    });
  },

  // 从缓存数据设置页面数据（设备租赁业务版本）
  setDataFromCache(cachedData, options) {
    this.setData({
      orderInfo: {
        orderId: cachedData.orderId,
        equipmentId: cachedData.equipmentId,
        equipmentModel: cachedData.equipmentModel || cachedData.carModel,
        equipmentBrand: cachedData.equipmentBrand,
        equipmentCategory: cachedData.equipmentCategory,
        storeId: cachedData.storeId,
        storeName: cachedData.storeName || cachedData.pickupStore,
        storeAddress: cachedData.storeAddress,
        managerId: cachedData.managerId,
        managerName: cachedData.managerName,
        managerPhone: cachedData.managerPhone,
        operatorInfo: cachedData.operatorInfo,
        dashboardData: cachedData.dashboardData
      },
      renewInfo: {
        days: parseInt(options.renewDays || '0'),
        newPeriod: options.newEndTime ? `续租至 ${decodeURIComponent(options.newEndTime)}` : '',
        equipmentUsage: this.calculateEquipmentUsage(cachedData.dashboardData)
      },
      // 支付信息需要从URL参数计算
      paymentInfo: {
        renewAmount: this.calculateRenewAmount(options, cachedData),
        membershipAmount: options.purchaseMembership === 'true' ? '299.00' : '0.00',
        serviceFee: this.calculateServiceFee(options),
        totalAmount: options.totalAmount || '0.00',
        payTime: this.formatPaymentTime(Date.now())
      },
      showMemberUpgrade: options.purchaseMembership === 'true',
      // 设备信息显示
      showEquipmentInfo: !!cachedData.equipmentId,
      showDashboard: !!cachedData.dashboardData
    });
  },

  // 设置默认数据（设备租赁业务版本）
  setDefaultData(options) {
    const defaultDashboardData = {
      pickupReading: 5280,
      currentReading: 7150,
      fuelLevel: 75,
      lastUpdateTime: Date.now() - 1800000
    };

    this.setData({
      orderInfo: {
        orderId: options.orderId || 'unknown',
        equipmentId: 'EQ001',
        equipmentModel: '现代挖掘机R225LC-9T', // 默认设备
        equipmentBrand: '现代',
        equipmentCategory: '挖掘机',
        storeId: 'ST001',
        storeName: '重庆渝北区分店',
        storeAddress: '重庆市渝北区龙溪街道',
        managerId: 'MG001',
        managerName: '张经理', // 默认管理员
        managerPhone: '138****8888', // 默认电话
        operatorInfo: {
          name: "操作员李师傅",
          phone: "159****3698",
          certNo: "操作证12345"
        },
        dashboardData: defaultDashboardData
      },
      renewInfo: {
        days: parseInt(options.renewDays || '0'),
        newPeriod: options.newEndTime ? `续租至 ${decodeURIComponent(options.newEndTime)}` : '',
        equipmentUsage: this.calculateEquipmentUsage(defaultDashboardData)
      },
      paymentInfo: {
        renewAmount: this.calculateDefaultRenewAmount(options),
        membershipAmount: options.purchaseMembership === 'true' ? '299.00' : '0.00',
        serviceFee: this.calculateDefaultServiceFee(options),
        totalAmount: options.totalAmount || '0.00',
        payTime: this.formatPaymentTime(Date.now())
      },
      showMemberUpgrade: options.purchaseMembership === 'true',
      // 设备信息显示
      showEquipmentInfo: true,
      showDashboard: true
    });
  },

  // 计算设备使用情况
  calculateEquipmentUsage(dashboardData) {
    if (!dashboardData || !dashboardData.pickupReading || !dashboardData.currentReading) {
      return {
        totalHours: '数据不足',
        averageDaily: '数据不足',
        fuelEfficiency: '数据不足'
      };
    }

    const hoursUsed = dashboardData.currentReading - dashboardData.pickupReading;
    const daysUsed = Math.max(1, Math.floor((Date.now() - dashboardData.lastUpdateTime) / (24 * 60 * 60 * 1000)));
    const averageDaily = Math.round(hoursUsed / daysUsed * 10) / 10;
    
    return {
      totalHours: hoursUsed.toString(),
      averageDaily: averageDaily.toString(),
      fuelEfficiency: dashboardData.fuelLevel ? `${Math.round(hoursUsed / (100 - dashboardData.fuelLevel) * 10) / 10}小时/10%油耗` : '数据不足'
    };
  },

  // 查看设备详情
  viewEquipmentDetail() {
    const equipmentId = this.data.orderInfo.equipmentId;
    if (!equipmentId) {
      wx.showToast({
        title: '设备信息异常',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/equipment-detail/equipment-detail?equipmentId=${equipmentId}&orderId=${this.data.orderInfo.orderId}`,
      fail: () => {
        wx.showToast({
          title: '功能开发中，敬请期待',
          icon: 'none'
        });
      }
    });
  },

  // 查看仪表盘历史
  viewDashboardHistory() {
    const orderId = this.data.orderInfo.orderId;
    if (!orderId) {
      wx.showToast({
        title: '订单信息异常',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/dashboard-history/dashboard-history?orderId=${orderId}`,
      fail: () => {
        wx.showToast({
          title: '功能开发中，敬请期待',
          icon: 'none'
        });
      }
    });
  },

  // 联系操作员
  contactOperator() {
    const operatorInfo = this.data.orderInfo.operatorInfo;
    if (!operatorInfo?.phone) {
      wx.showToast({
        title: '操作员信息异常',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '联系操作员',
      content: `是否拨打操作员电话：${operatorInfo.name} ${operatorInfo.phone}？`,
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: operatorInfo.phone.replace(/\*/g, ''),
            fail: () => {
              wx.showToast({
                title: '拨打电话失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 分享续租成功
  shareRenewalSuccess() {
    const orderInfo = this.data.orderInfo;
    const renewInfo = this.data.renewInfo;

    return {
      title: `设备续租成功 - ${orderInfo.equipmentModel}`,
      path: `/pages/renew-success/renew-success?orderId=${orderInfo.orderId}`,
      imageUrl: '../../assets/share-success.png'
    };
  },

  // 计算续租金额（基于缓存数据）
  calculateRenewAmount(options, cachedData) {
    const days = parseInt(options.renewDays || '0');
    const price = options.purchaseMembership === 'true' ? 
      (cachedData.memberRenewPrice || 640) : 
      (cachedData.renewPrice || 800);
    return (days * price).toFixed(2);
  },

  // 计算服务费（基于缓存数据）
  calculateServiceFee(options) {
    const renewAmount = parseFloat(this.calculateRenewAmount(options, { renewPrice: 800, memberRenewPrice: 640 }));
    const membershipAmount = options.purchaseMembership === 'true' ? 299 : 0;
    const subtotal = renewAmount + membershipAmount;
    return (subtotal * 0.006).toFixed(2); // 0.6%服务费
  },

  // 计算默认续租金额
  calculateDefaultRenewAmount(options) {
    const days = parseInt(options.renewDays || '0');
    const price = options.purchaseMembership === 'true' ? 640 : 800; // 默认价格
    return (days * price).toFixed(2);
  },

  // 计算默认服务费
  calculateDefaultServiceFee(options) {
    const renewAmount = parseFloat(this.calculateDefaultRenewAmount(options));
    const membershipAmount = options.purchaseMembership === 'true' ? 299 : 0;
    const subtotal = renewAmount + membershipAmount;
    return (subtotal * 0.006).toFixed(2); // 0.6%服务费
  },

  // 解析URL参数
  parseUrlParams(options) {
    const {
      orderId = '',
      renewDays = '0',
      totalAmount = '0.00',
      newEndTime = '',
      purchaseMembership = 'false'
    } = options;

    // 构建新租期显示文本
    const newPeriod = newEndTime ? `续租至 ${newEndTime}` : '';
    
    this.setData({
      'renewInfo.days': parseInt(renewDays),
      'renewInfo.newPeriod': newPeriod,
      'paymentInfo.totalAmount': totalAmount,
      showMemberUpgrade: purchaseMembership === 'true'
    });
  },

  // 获取订单和支付详细信息（只在缓存无效时调用）
  async getOrderAndPaymentInfo(orderId) {
    if (!orderId) {
      throw new Error('订单ID不能为空');
    }

    console.log('从API获取订单和支付详情');

    try {
      // 并行获取订单信息和支付详情
      const [orderResponse, paymentResponse] = await Promise.all([
        this.requestAPI({
          url: '/api/order/detail',
          method: 'GET',
          data: { orderId }
        }),
        this.requestAPI({
          url: '/api/payment/detail',
          method: 'GET',
          data: { orderId }
        })
      ]);

      if (orderResponse.success) {
        this.setData({
          orderInfo: {
            orderId: orderResponse.data.orderId,
            carModel: orderResponse.data.carModel,
            managerName: orderResponse.data.managerName,
            managerPhone: orderResponse.data.managerPhone
          }
        });

        // 缓存订单数据
        const DataManager = require('../../utils/data-manager.js');
        DataManager.cacheOrderData(orderId, orderResponse.data);
      }

      if (paymentResponse.success) {
        const paymentData = paymentResponse.data;
        this.setData({
          paymentInfo: {
            renewAmount: paymentData.renewAmount || '0.00',
            membershipAmount: paymentData.membershipAmount || '0.00',
            serviceFee: paymentData.serviceFee || '0.00',
            totalAmount: paymentData.totalAmount || this.data.paymentInfo.totalAmount,
            payTime: this.formatPaymentTime(paymentData.payTime)
          }
        });
      }

    } catch (error) {
      console.error('获取详细信息失败', error);
      throw error;
    }
  },

  // 处理初始化错误，使用模拟数据
  handleInitError(options) {
    console.log('使用模拟数据');
    
    const mockOrderInfo = {
      orderId: options.orderId || 'ORDER_' + Date.now(),
      carModel: '现代挖掘机R225LC-9T',
      managerName: '张经理',
      managerPhone: '138****8888'
    };

    const mockPaymentInfo = {
      renewAmount: '1600.00',
      membershipAmount: options.purchaseMembership === 'true' ? '299.00' : '0.00',
      serviceFee: '11.40',
      totalAmount: options.totalAmount || '1910.40',
      payTime: this.formatPaymentTime(Date.now())
    };

    this.setData({
      orderInfo: mockOrderInfo,
      paymentInfo: mockPaymentInfo
    });

    this.showSuccessToast();
  },

  // API请求封装
  requestAPI(options) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: getApp().globalData.apiBaseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': getApp().globalData.token || ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(`请求失败: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  // 格式化支付时间
  formatPaymentTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 显示成功提示
  showSuccessToast() {
    setTimeout(() => {
      wx.showToast({
        title: '续租成功！',
        icon: 'success',
        duration: 2000
      });
    }, 500);
  },

  // 联系管理员
  contactManager() {
    const phone = this.data.orderInfo.managerPhone;
    if (!phone) {
      wx.showToast({
        title: '暂无联系方式',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '联系管理员',
      content: `是否拨打电话给${this.data.orderInfo.managerName}？`,
      confirmText: '拨打',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: phone.replace(/\*/g, '1'), // 实际项目中应该用真实号码
            fail: (err) => {
              console.error('拨打电话失败', err);
              wx.showToast({
                title: '拨打失败',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 查看租赁指南
  viewRentalGuide() {
    wx.showModal({
      title: '租赁指南',
      content: '即将跳转到租赁指南页面，您可以查看设备使用说明和注意事项。',
      confirmText: '前往',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/rental-guide/rental-guide',
            fail: () => {
              wx.showToast({
                title: '页面暂未开放',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 返回订单列表
  backToList() {
    wx.showModal({
      title: '确认返回',
      content: '是否返回到订单列表页面？',
      confirmText: '返回',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 清理当前订单的全局数据，返回列表时强制刷新
          const DataManager = require('../../utils/data-manager.js');
          DataManager.clearGlobalOrderData();
          
          const NavigationUtils = require('../../utils/navigation-utils.js');
          NavigationUtils.toOrderListPage(true);
        }
      }
    });
  },

  // 查看订单详情
  viewOrderDetail() {
    const orderId = this.data.orderInfo.orderId;
    if (!orderId) {
      wx.showToast({
        title: '订单信息异常',
        icon: 'none'
      });
      return;
    }

    const NavigationUtils = require('../../utils/navigation-utils.js');
    NavigationUtils.toOrderDetailPage(orderId);
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: '我刚完成了设备续租，操作很便捷！',
      path: '/pages/index/index',
      imageUrl: '/images/share-bg.jpg' // 分享图片路径
    };
  },

  // 页面分享到朋友圈
  onShareTimeline() {
    return {
      title: '便捷的设备租赁续租服务',
      imageUrl: '/images/share-bg.jpg'
    };
  },

  // 监听页面显示
  onShow() {
    // 页面显示时可以做一些统计或刷新操作
    this.reportPageView();
  },

  // 页面访问统计
  reportPageView() {
    try {
      // 发送页面访问统计
      this.requestAPI({
        url: '/api/analytics/page-view',
        method: 'POST',
        data: {
          page: 'renew-success',
          orderId: this.data.orderInfo.orderId,
          timestamp: Date.now()
        }
      }).catch(err => {
        console.log('统计上报失败', err);
      });
    } catch (error) {
      console.log('统计功能异常', error);
    }
  },

  // 页面卸载时清理
  onUnload() {
    // 清理定时器或其他资源
    console.log('续租成功页面卸载');
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('下拉刷新续租成功页面');
    
    // 重新获取数据
    this.initSuccessPage({
      orderId: this.data.orderInfo.orderId
    }).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 复制订单号
  copyOrderId() {
    const orderId = this.data.orderInfo.orderId;
    if (!orderId) {
      wx.showToast({
        title: '订单号异常',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: orderId,
      success: () => {
        wx.showToast({
          title: '订单号已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 保存支付凭证到相册
  savePaymentProof() {
    wx.showLoading({
      title: '生成中...'
    });

    // 模拟生成支付凭证图片
    setTimeout(() => {
      wx.hideLoading();
      wx.showModal({
        title: '功能提示',
        content: '支付凭证保存功能正在开发中，敬请期待！',
        showCancel: false,
        confirmText: '知道了'
      });
    }, 1500);
  },

  // 评价服务
  rateService() {
    wx.showModal({
      title: '服务评价',
      content: '您对本次续租服务还满意吗？点击确定前往评价页面。',
      confirmText: '去评价',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/service-rating/service-rating?orderId=${this.data.orderInfo.orderId}`,
            fail: () => {
              wx.showToast({
                title: '评价功能暂未开放',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  }
})