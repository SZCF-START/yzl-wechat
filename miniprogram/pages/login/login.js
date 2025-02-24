// pages/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isAgreementChecked: false, // 是否勾选了服务协议和隐私政策
    canTriggerPhoneNumber: false, // 标记是否允许触发手机号验证组件
    redirectUrl: ''
  },

  // 用户勾选协议
  onAgreementChange(event) {
    const isChecked = event.detail > 0;
    console.log(isChecked);
    this.setData({
      isAgreementChecked: isChecked,
      canTriggerPhoneNumber: isChecked, // 是否允许触发手机号验证组件
    });
    
  },

  // 用户点击同意隐私协议
  handleAgreePrivacyAuthorization() {
    // 用户同意，触发 resolve 操作
    // 用户勾选同意后，调用 wx.requirePrivacyAuthorize
    wx.onNeedPrivacyAuthorization((resolve, eventInfo) => {
      console.log("999999000000");
      if (this.data.isAgreementChecked){
        resolve({ buttonId: 'agree-btn', event: 'agree' });
      }else{
        
      }
      
    })
  },

  // 继续隐私授权请求的处理（告知微信同意或拒绝）
  handleAgreePrivacyAuthorization1() {
    this.resolvePrivacyAuthorization({ buttonId: 'agree-btn', event: 'agree' })
  },

  // 查看服务协议
  viewServiceAgreement() {
    wx.navigateTo({
      url: '/pages/service-agreement/service-agreement', // 跳转到服务协议页面
    });
  },

  // 查看隐私政策
  viewPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy', // 跳转到隐私政策页面
    });
  },

  // 点击登录按钮时触发
  onLoginTap() {
    if (!this.data.isAgreementChecked) {
      wx.showToast({
        title: '请先同意并先勾选《服务协议》和《隐私政策》',
        icon: 'none',
      });
    }else{
      
    }
  },

  // 获取手机号
  getPhoneNumber(event) {
    if (event.detail.code) {
      console.log('动态令牌 code：', event.detail.code);
      let self = this; // 保存 this 引用，防止回调函数中丢失 this
      wx.login({
        success (res) {
          if (res.code) {
            // 发送 code 到后端换取 openId 和手机号
            wx.request({
              url: 'http://192.168.200.16:8991/jeecg-boot/wechat/carousel/yzlCarousel/login',
              method: 'post',
              data: {
                loginCode: res.code, // 登录 code
                phoneCode: event.detail.code, // 手机号 code
              },
              success(res) {
                console.log('解密后的手机号：', res.data.result.phoneNumber);
                wx.showToast({
                  title: '登录成功',
                  icon: 'success',
                });

                // 或使用本地存储
                wx.setStorageSync('isLoggedIn', true);
                wx.setStorageSync('avatarUrl', res.data.result.avatar);
                wx.setStorageSync('username', res.data.result.wechatName);
                wx.setStorageSync('userInfo', res.data.result);
                wx.setStorageSync('token', res.data.token);
                


                // 设置页面刷新标识
                // const pages = getCurrentPages();
                // const prevPage = pages[pages.length - 2]; // 上一个页面
                // prevPage.setData({ needsReload: true });
                // 返回上一页
                // wx.navigateBack();
                // 登录成功后跳转回之前的页面

                console.log("self.data.redirectUrl->" + self.data.redirectUrl);
                wx.reLaunch({
                  url: self.data.redirectUrl
                });
              },
              fail(err) {
                console.error('获取手机号失败：', err);
                wx.showToast({
                  title: '手机号验证失败，请稍后重试',
                  icon: 'none',
                });
              },
            });
                } else {
                  console.log('登录失败！' + res.errMsg)
                }
              }
            })
      
    } else {
      console.error('获取手机号失败1：', event.detail.errMsg);
      // 用户拒绝，弹出提示框
        wx.showModal({
          title: '提示',
          content: '您已拒绝获取绑定手机号登录授权，您需要同意手机号登录授权后才能继续使用该功能。',
          showCancel: false, // 隐藏取消按钮
          confirmText: '知道了', // 确认按钮文案
          confirmColor: '#007AFF', // 按钮颜色（可自定义）
          success: (res) => {
            if (res.confirm) {
              console.log('用户点击知道了');
            }
          },
        });
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      redirectUrl: options.redirect ? decodeURIComponent(options.redirect) : '/pages/index/index'
    });
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

  }
})