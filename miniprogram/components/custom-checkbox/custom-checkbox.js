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
    isChecked: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    
    updateChecked(e) {
      const newChecked = !this.data.isChecked;
      this.setData({
        isChecked: newChecked
      })
      this.triggerEvent('changechecked',this.data.isChecked)
    },
    // 点击文字区域时触发
    contentTap(e) {
      // 如果点击目标是链接，则不做切换
      if (e.target.dataset && e.target.dataset.isLink === 'true') {
        return;
      }
      // 否则，切换选中状态
      const newChecked = !this.data.isChecked;
      this.setData({ isChecked: newChecked });
      this.triggerEvent('changechecked', { value: newChecked });
    },

    // 可选：在组件内部也提供一个用于链接点击的处理函数，阻止事件冒泡
    handleLinkTap(e) {
      e.stopPropagation();
      // 此处可以处理链接跳转或其他逻辑
    }
    
  }
})