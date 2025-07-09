import config from '../../config/config.js'
Page({
  data: {
    username: wx.getStorageSync('username'),
    avatarUrl: wx.getStorageSync('avatarUrl'),
    nickname: '默认昵称',
    gender: '未设置'
  },

  // 获取用户头像
  getUserAvatar(e) {
    const { avatarUrl } = e.detail
    this.afterRead(avatarUrl)
  },

  afterRead(url) {
    wx.uploadFile({
      url: config.baseUrl + 'wechat/sys/common/upload',
      filePath: url,
      name: 'file',
      success:(res) => {
        console.log(JSON.parse(res.data).message);
        // 上传完成需要更新 fileList
        this.setData({
          avatarUrl:JSON.parse(res.data).message,
        })
      },
    });
  },

  // 跳转到编辑昵称页面
  goToEditNickname() {
    wx.navigateTo({
      url: '/pages/editNickname/editNickname?nickname=' + this.data.nickname
    });
  },

  // 选择性别
  selectGender() {
    wx.showActionSheet({
      itemList: ['男', '女'],
      success: (res) => {
        const selectedGender = res.tapIndex === 0 ? '男' : '女';
        this.setData({
          gender: selectedGender
        });
      }
    });
  }
});
