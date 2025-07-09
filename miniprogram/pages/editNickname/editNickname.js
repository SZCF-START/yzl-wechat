Page({
  data: {
    nickname: '', 
    isDisabled: true 
  },

  // 用于存储上一次合法的昵称，避免非法输入时更新界面
  lastValidNickname: "",

  onLoad(options) {
    // 获取上个页面传递的昵称
    let initialNickname = options.nickname || "";
    // 过滤掉非中英文字符
    initialNickname = initialNickname.replace(/[^A-Za-z\u4e00-\u9fa5]/g, '');
    this.lastValidNickname = initialNickname;
    this.setData({
      nickname: initialNickname,
      isDisabled: !this.validateNickname(initialNickname)
    });
  },

  onInputChange(e) {
    console.log("lastValidNickname=" + this.lastValidNickname);
    let value = e.detail.value;
    console.log(value);
    // 过滤掉所有非中英文字符
    let filtered = value.replace(/[^A-Za-z\u4e00-\u9fa5]/g, '');
    console.log(filtered);
    // 若用户输入非法字符，则不更新输入框，恢复到上一次合法状态
    if (filtered !== value) {
      this.setData({
        nickname: this.lastValidNickname
      });
      return;
    }
    // 限制最大长度为12（input组件已设置 maxlength，但再次确保）
    if (filtered.length > 12) {
      filtered = filtered.substring(0, 12);
    }
    // 保存本次合法输入作为最新的有效昵称
    this.lastValidNickname = filtered;
    // 更新数据和按钮状态：只有当昵称符合 2-12 个中英文字符时，按钮可点击
    this.setData({
      nickname: filtered,
      isDisabled: !this.validateNickname(filtered)
    });
  },

  validateNickname(nickname) {
    return /^[\u4e00-\u9fa5a-zA-Z]{1,12}$/.test(nickname);
  },

  saveNickname() {
    if (this.data.isDisabled) return;

    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2]; 
    prevPage.setData({
      nickname: this.data.nickname
    });
    wx.navigateBack(); 
  }
});
