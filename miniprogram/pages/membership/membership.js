Page({
  data: {
    // 用于显示会员信息
    memberInfo: {
      level: '',       // 后台返回，如“普通会员”
      validTime: '',   // 后台返回，如“永久有效”
    },
    // 购买升级所需价格
    price: 0,
    // 解锁的权益列表
    benefits: []
  },

  onLoad() {
    // 在这里模拟后台数据
    const mockMemberInfo = {
      level: '普通会员',
      validTime: '永久有效'
    };
    const mockPrice = 99; // 后台返回的价格
    const mockBenefits = [
      { icon: '🎂', text: '50元生日优惠' },
      { icon: '⭐', text: '会员积分 1:1.2' },
      { icon: '⛽', text: '无忧还车 +1' }
    ];

    // 模拟异步请求，赋值到 data
    this.setData({
      memberInfo: mockMemberInfo,
      price: mockPrice,
      benefits: mockBenefits
    });
  },

  // 购买会员按钮点击事件
  buyMembership() {
    // 在这里处理购买逻辑
    wx.showToast({
      title: '购买会员逻辑执行',
      icon: 'none'
    });
  }
});
