Page({
  data: {
    currentTab: 0
  },
  
  onLoad: function() {
    // 页面加载时执行
  },
  
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: parseInt(tab)
    });
  },
  
  goToCarSelection: function() {
    // 跳转到选车页面
    wx.navigateTo({
      url: '/pages/car-selection/car-selection'
    });
  }
})