Page({
  data: {
    currentCity: "长沙",
    longitude: 112.9388,
    latitude: 28.2282,
    markers: [],
    selectedStore: {}
  },

  onLoad() {
    this.loadMarkers();
  },

  loadMarkers() {
    // 示例 marker 数据
    const stores = [
      {
        id: 1,
        latitude: 25.0406,
        longitude: 102.7123,
        name: '五华吾悦广场店',
        address: '昆明市五华区王筇路178号...',
        openTime: '08:00',
        closeTime: '20:00',
        phone: '12345678900',
        iconPath: '/assets/marker-icon.png'
      }
    ];
    const markers = stores.map(store => ({
      id: store.id,
      latitude: store.latitude,
      longitude: store.longitude,
      iconPath: store.iconPath,
      width: 40,
      height: 40,
      callout: {
        content: store.name,
        display: 'ALWAYS',
        fontSize: 12,
        padding: 4,
        borderRadius: 8
      }
    }));
    this.setData({
      markers,
      selectedStore: stores[0]
    });
  },

  onSearchTap() {
    this.setData({
      showSearchMask: true
    });
  },

  onCancelSearch() {
    this.setData({
      showSearchMask: false
    });
  },

  onListTap() {
    wx.showToast({
      title: '列表功能点击',
      icon: 'none'
    });
    wx.navigateTo({
      url: `/pages/storeSelect/storeSelect`,
    });
  },

  onCitySelect() {
    wx.navigateTo({ url: '/pages/citySelect/index' });
  },

  onSearchClick() {
    wx.navigateTo({ url: '/pages/search/index' });
  },

  onListClick() {
    wx.navigateTo({ url: '/pages/storeList/index' });
  },

  onCall(e) {
    wx.makePhoneCall({ phoneNumber: this.data.selectedStore.phone });
  },

  onGuide() {
    const store = this.data.selectedStore;
    wx.openLocation({
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.address
    });
  },

  onLocate() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      }
    });
  },

  onRent() {
    wx.navigateTo({ url: '/pages/rent/index' });
  }
});
