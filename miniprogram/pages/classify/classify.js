Page({
  data: {
    currentCity: "太原",
    latitude: 37.872,
    longitude: 112.548,
    markers: [
      {
        id: 1,
        latitude: 37.872,
        longitude: 112.548,
        title: "门店 A"
      }
    ],
    areaList: [
      {
        name: "迎泽区",
        stores: [
          {
            name: "迎泽门店 A",
            address: "迎泽南街 123 号",
            openTime: "08:00",
            closeTime: "20:00",
            supportSelfReturn: true,
            beeBox: true,
            orderableTomorrow: true
          }
        ]
      }
    ],
    selectedAreaIndex: 0
  },
  onAreaTap(e) {
    this.setData({
      selectedAreaIndex: e.currentTarget.dataset.index
    });
  }
});
