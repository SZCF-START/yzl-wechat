// pages/my/my.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: '../../assets/rsg.png',
    // showPrivacy: false
    isLoggedIn: wx.getStorageSync('isLoggedIn'), // 是否已登录
    needsReload: false,
    username: wx.getStorageSync('username'),
    avatarUrl: wx.getStorageSync('avatarUrl')
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
    wx.navigateTo({
      url: '/pages/login/login', // 跳转到登录页路径
    });
  },
  
  contactCustomerService() {
    wx.showToast({
      title: '联系客服功能',
      icon: 'none',
    });
  },

  openSettings() {
    wx.showToast({
      title: '设置功能',
      icon: 'none',
    });
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
    if (this.data.needsReload) {
      this.reloadData();
    }
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
    const username = wx.getStorageSync('username') || '用户昵称';
    const avatarUrl = wx.getStorageSync('avatarUrl') || '../../assets/yh.png';

    this.setData({
      isLoggedIn,
      username,
      avatarUrl,
      needsReload: false // 重置标识
    });
  },
})