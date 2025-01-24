// index.js
Page({
  data: {
    isChecked: false
  },

  getData(event) {
    console.log("111",event.detail > 0);
    const res = this.selectComponent('.check',)
    console.log("222",res);
  }
})
