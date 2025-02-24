const loginCheck = require('../../behaviors/loginCheck.js');
Page({
  behaviors: [loginCheck],
  /**
   * 页面的初始数据
   */
  data: {
    // avatarUrl: '../../assets/rsg.png',
    // showPrivacy: false
    isLoggedIn: wx.getStorageSync('isLoggedIn'), // 是否已登录
    needsReload: false,
    username: wx.getStorageSync('userInfo').wechatName,
    avatarUrl: wx.getStorageSync('userInfo').avatar,

    tags: [
      { id: '1', name: '实名认证', icon: '../../assets/myquickaccess/smrz.png', url: '/pages/auth/auth' },
      { id: '2', name: '出车记录', icon: '../../assets/myquickaccess/ccjl.png', url: '/pages/record/record' },
      { id: '3', name: '出车管理', icon: '../../assets/myquickaccess/ccgl.png', url: '/pages/manage/manage' },
      { id: '4', name: '属具记录', icon: '../../assets/myquickaccess/sjjl.png', url: '/pages/equipment/record' },
      { id: '5', name: '属具管理', icon: '../../assets/myquickaccess/sjgl.png', url: '/pages/equipment/manage' },
      { id: '6', name: '押金审核', icon: '../../assets/myquickaccess/yjsh.png', url: '/pages/deposit/review' }
    ]
  },

  // chooseavatar(event) {
  //   console.log(event);
  //   const {avatarUrl} = event.detail
  //   this.setData({
  //     avatarUrl
  //   })
  // },

  // onSubmit (event) {
  //   const {nickname} = event.detail.value
  //   console.log(nickname);
  // },

  goToLogin() {
    const redirectUrl = '/pages/my/my'
    wx.navigateTo({
      url: `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`, // 跳转到登录页路径
    });
  },
  
  goToMembership() {
    wx.navigateTo({
      url: '/pages/membership/membership' // 替换成你的会员页面路径
    });
  },

  contactCustomerService() {
    wx.showToast({
      title: '联系客服功能',
      icon: 'none',
    });
  },

  openSettings() {
    if (!this.checkLogin('pages/settings/settings', {})) return;
    wx.navigateTo({
      url: '/pages/settings/settings', // 跳转到设置页路径
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 如果需要重新加载数据
    this.reloadData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  reloadData() {
    // 重新获取登录状态和用户信息
    const isLoggedIn = wx.getStorageSync('isLoggedIn');
    const username = wx.getStorageSync('userInfo').wechatName || '用户昵称';
    const avatarUrl = wx.getStorageSync('userInfo').avatar || '../../assets/yh.png';

    this.setData({
      isLoggedIn,
      username,
      avatarUrl,
      needsReload: false // 重置标识
    });
  },

  navigateToPage(e) {
    
    const url = e.currentTarget.dataset.url;
    if (!this.checkLogin(url, {})) {
      return
    }else{
      wx.navigateTo({
        url: url
      });
    };
  }
})