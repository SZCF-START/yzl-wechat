// components/custom-checkbox/custom-checkbox.js
Component({

  options: {
    styleIsolation: 'shared'
  },
  /**
   * 组件的属性列表
   */
  properties: {
    label: {
      type: String,
      value: ''
    },
    position: {
      type: String,
      value: 'right'
    },
    checked: {
      type: Boolean,
      value: false
    }
  },

  observers: {
    checked: function(newChecked) {
      console.log(newChecked);
      this.setData({
        isChecked: newChecked
      })
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isChecked: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    
    updateChecked() {
      const newChecked = !this.data.isChecked;
      this.setData({
        isChecked: newChecked
      })
      // 调用 wx.onNeedPrivacyAuthorization 回调
      // if (newChecked) {
      //   console.log("1111111111111");
      //   wx.onNeedPrivacyAuthorization((listener) => {
      //     listener({
      //       success: () => {
      //         console.log("11111111111112");
      //         this.triggerEvent('changechecked', { checked: true });
      //       },
      //       fail: () => {
      //         console.log("11111111111113");
      //         wx.showToast({
      //           title: '您需要同意隐私政策才能继续',
      //           icon: 'none',
      //         });
      //         this.setData({ checked: false });
      //       },
      //     });
      //   });
      // } else {
      //   console.log("2222222222");
      //   this.triggerEvent('changechecked', this.data.isChecked);
      // }
      this.triggerEvent('changechecked',this.data.isChecked)
    }
    
  }
})