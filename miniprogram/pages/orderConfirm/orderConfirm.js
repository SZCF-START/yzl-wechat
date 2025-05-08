Page({
  data: {
    car: {
      image: '/assets/images/car_placeholder.png',
      name: '日产天籁',
      transmission: '自动',
      engine: '2.0L',
      body: '三厢',
      seats: '5座',
      rating: 95,
      pickupLocation: '昆明 - 长水机场商业街店',
      pickupDate: '05月09日 11:00',
      dropoffLocation: '昆明 - 长水机场商业街店',
      dropoffDate: '05月11日 11:00',
      totalPrice: 589.00
    }
  },
  onConfirmOrder() {
    wx.showModal({
      title: '确认订单',
      content: `您确定要提交订单并支付 ¥${this.data.car.totalPrice} 吗？`,
      confirmText: '去支付',
      cancelText: '再看看',
      success(res) {
        if (res.confirm) {
          wx.showToast({ title: '支付功能待接入', icon: 'none' });
        }
      }
    });
  }
});
