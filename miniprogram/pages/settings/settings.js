
const loginCheck = require('../../behaviors/loginCheck.js');
Page({
  behaviors: [loginCheck],
  data: {
    arrowicon: '../../assets/arrow-icon.png',
    userInfo: {
      avatar: wx.getStorageSync('userInfo').avatar,
      nickname: wx.getStorageSync('userInfo').wechatName,
      memberName: "手机用户_3026013"
    },
    address: "山西省太原市小店区海唐罗马花园9号楼",
    isDefaultAddress: true
  },

  onLoad() {
    // this.checkLoginStatus();
    this.checkLogin();
    this.loadUserInfo();
  },

  loadUserInfo() {
    // 模拟获取用户信息
    this.setData({
      userInfo: {
        avatar: wx.getStorageSync('userInfo').avatar,
        nickname: wx.getStorageSync('userInfo').wechatName,
        memberName: "手机用户_3026013"
      },
      address: "山西省太原市小店区海唐罗马花园9号楼"
    });
  },

  logout() {
    wx.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success(res) {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.reLaunch({
            url: "/pages/index/index"
          });
        }
      }
    });
  }
});
