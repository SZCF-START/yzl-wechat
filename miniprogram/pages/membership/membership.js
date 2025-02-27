Page({
  data: {
    memberLevel: "普通会员",
    growthValueNeeded: 100,
    upgradeCost: 100,
    upgradeBenefits: [
      "🎂 50元生日优惠",
      "⭐ 会员积分 1:1.2",
      "⛽ 无忧还车 +1"
    ]
  },

  buyMembership() {
    wx.showToast({
      title: "会员购买成功！",
      icon: "success"
    });
  }
});
