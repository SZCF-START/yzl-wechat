Component({
  data: {
    showDialog: false,
    // 直接在 data 中写死小程序名称和头像
    appName: '一嗨租车',
    appIcon: '/images/app-icon.png', // 这里请换成你实际的图片路径
    privacyChecked: false,
    shakeClass: ''
  },
  methods: {
    /**
     * 打开弹窗
     */
    open() {
      this.setData({
        showDialog: true,
        privacyChecked: false,
        shakeClass: ''
      });
    },

    /**
     * 关闭弹窗
     */
    close() {
      this.setData({
        showDialog: false,
        shakeClass: ''
      });
    },

    /**
     * 用户勾选隐私协议
     */
    onPrivacyChange(e) {
      // e.detail.value 里会存放 checkbox 的值数组
      // 如果勾选了，就会包含 'agree'；否则为空数组
      const checked = e.detail.value.includes('agree');
      this.setData({
        privacyChecked: checked
      });
    },

    /**
     * 点击查看隐私协议
     */
    onOpenPrivacy() {
      // 这里可以跳转到你的小程序隐私协议页面
      // 或者用 wx.navigateToMiniProgram / web-view 打开网页
      // 也可以用 showModal / showToast 简单提示
      wx.navigateTo({
        url: '/pages/privacy/privacy' // 示例
      });
    },

    /**
     * 点击“拒绝”按钮
     */
    onRefuseTap() {
      this.close();
      // 通知外部，用户拒绝授权
      this.triggerEvent('onLocationAuthFail', {
        reason: 'user refuse'
      });
    },

    /**
     * 点击“允许”按钮
     */
    onAllowTap() {
      // 如果还没勾选隐私，则抖动提示
      if (!this.data.privacyChecked) {
        this.setData({ shakeClass: 'shake' });
        setTimeout(() => {
          this.setData({ shakeClass: '' });
        }, 300);
        return;
      }

      // 如果已经勾选了隐私协议，则真正调用 wx.getLocation
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          // 定位成功，关闭弹窗并通知外部
          this.close();
          this.triggerEvent('onLocationAuthSuccess', {
            location: res
          });
        },
        fail: (err) => {
          // 定位失败，关闭弹窗并通知外部
          this.close();
          this.triggerEvent('onLocationAuthFail', {
            reason: err.errMsg
          });
        }
      });
    }
  }
});
