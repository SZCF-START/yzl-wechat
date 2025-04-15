Page({
  data: {
    cities: ['昆明', '北京', '上海'],
    selectedCity: '昆明',
    longitude: 102.715, // 默认经纬度
    latitude: 25.05,
    markers: [],
    selectedStore: null
  },

  onLoad() {
    this.loadStores()
  },

  loadStores() {
    const stores = [
      {
        id: 1,
        name: '五华吾悦广场店',
        address: '昆明市五华区王筇路178号吾悦...',
        latitude: 25.052,
        longitude: 102.72,
        openTime: '08:00-20:00',
        phone: '123456789',
        logo: '/images/logo.png'
      }
    ]
    const markers = stores.map(store => ({
      id: store.id,
      latitude: store.latitude,
      longitude: store.longitude,
      iconPath: '/images/marker-store.png',
      width: 40,
      height: 40
    }))
    this.setData({ markers, stores })
  },

  onMarkerTap(e) {
    const store = this.data.stores.find(s => s.id === e.detail.markerId)
    this.setData({ selectedStore: store })
  },

  onPhoneCall() {
    const phone = this.data.selectedStore.phone
    wx.makePhoneCall({ phoneNumber: phone })
  },

  onGuideTap() {
    const store = this.data.selectedStore
    wx.openLocation({
      latitude: store.latitude,
      longitude: store.longitude,
      name: store.name,
      address: store.address
    })
  },

  onRentTap() {
    wx.navigateTo({ url: '/pages/rent/rent?storeId=' + this.data.selectedStore.id })
  },

  onCityChange(e) {
    this.setData({ selectedCity: this.data.cities[e.detail.value] })
    // TODO: 根据城市刷新坐标与门店
  },

  onListTap() {
    wx.navigateTo({ url: '/pages/storeList/storeList' })
  }
})
