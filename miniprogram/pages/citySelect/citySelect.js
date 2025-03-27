Page({
  data: {
    searchFocus: false,   // 是否点击搜索框
    searchKeyword: '',    // 搜索关键字

    // 当前城市（为空则显示“开启定位”）
    currentCity: '',
    // 历史城市（最多2个，从左到右，右侧最新）
    historyCities: [],

    // 热门城市
    hotCities: [
      { cityName: "北京", cityLetter: "B" },
      { cityName: "上海", cityLetter: "S" },
      { cityName: "广州", cityLetter: "G" },
      { cityName: "深圳", cityLetter: "S" },
      { cityName: "成都", cityLetter: "C" },
      { cityName: "重庆", cityLetter: "C" }
    ],

    // 全部城市分组
    letters: [],
    citiesByLetter: {}
  },

  onLoad() {
    // 1. 初始化全部城市（可换成后端请求）
    this.initAllCities();

    // 2. 从本地或后端获取当前城市、历史城市
    const storedCity = wx.getStorageSync('currentCity') || '';
    const storedHistory = wx.getStorageSync('historyCities') || [];
    this.setData({
      currentCity: storedCity,
      historyCities: storedHistory
    });
  },

  /* 初始化全部城市 */
  initAllCities() {
    const allCities = [
      { cityName: "北京", cityLetter: "B" },
      { cityName: "上海", cityLetter: "S" },
      { cityName: "安庆", cityLetter: "A" },
      { cityName: "杭州", cityLetter: "H" },
      { cityName: "哈尔滨", cityLetter: "H" },
      { cityName: "天津", cityLetter: "T" },
      { cityName: "重庆", cityLetter: "C" },
      { cityName: "长沙", cityLetter: "C" },
      { cityName: "成都", cityLetter: "C" },
      { cityName: "武汉", cityLetter: "W" },
      // ...
    ];
    // 排序
    allCities.sort((a, b) => a.cityLetter.localeCompare(b.cityLetter));

    const letters = [];
    const citiesByLetter = {};
    allCities.forEach(item => {
      const letter = item.cityLetter.toUpperCase();
      if (!letters.includes(letter)) {
        letters.push(letter);
        citiesByLetter[letter] = [];
      }
      citiesByLetter[letter].push(item);
    });
    this.setData({
      letters,
      citiesByLetter
    });
  },

  /* 搜索相关 */
  onSearchFocus() {
    this.setData({ searchFocus: true });
  },
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },
  onSearchLinkTap() {
    wx.showToast({
      title: '点击了蓝色链接',
      icon: 'none'
    });
  },
  onCancel() {
    this.setData({
      searchFocus: false,
      searchKeyword: ''
    });
  },
  stopScroll() {
    // 阻止滚动穿透
  },

  /* 获取定位 */
  onGetLocation() {
    wx.showToast({
      title: '定位功能未实现',
      icon: 'none'
    });
  },

  /* 点击历史城市 */
  onHistoryTap(e) {
    const city = e.currentTarget.dataset.city;
    this.selectCity(city);
  },

  /* 选择城市（热门/全部） */
  onSelectCity(e) {
    const city = e.currentTarget.dataset.city;
    this.selectCity(city);
  },

  /* 通用选城市逻辑 */
  selectCity(city) {
    // 设置当前城市
    this.setData({ currentCity: city.cityName });
    wx.setStorageSync('currentCity', city.cityName);

    // 更新历史城市（最多2个，右侧最新）
    let arr = this.data.historyCities || [];
    const idx = arr.findIndex(h => h.cityName === city.cityName);
    if (idx !== -1) {
      arr.splice(idx, 1);
    }
    arr.push(city);
    while (arr.length > 2) {
      arr.shift();
    }
    this.setData({ historyCities: arr });
    wx.setStorageSync('historyCities', arr);

    wx.showToast({
      title: `已选择：${city.cityName}`,
      icon: 'none'
    });
  },

  /* 右侧导航点击 */
  onNavTap(e) {
    const target = e.currentTarget.dataset.target;
    wx.showToast({
      title: `跳转到: ${target}`,
      icon: 'none'
    });
    // 这里可以使用 scrollIntoView 或 pageScrollTo
    this.scrollIntoView(target);
  },

  /* 滚动到指定锚点 */
  scrollIntoView(anchorId) {
    // anchorId 例如 "anchor-hot" 或 "anchor-A"
    const query = this.createSelectorQuery().in(this);
    // 同时查询锚点元素和scroll-view的位置
    query.select('#' + anchorId).boundingClientRect();
    query.select('#leftScroll').boundingClientRect()
    query.exec(res => {
      if (res[0] && res[1]) {
        // 计算相对滚动位置
        const anchorTop = res[0].top      // 锚点绝对位置
        const scrollViewTop = res[1].top   // 容器绝对位置
        const scrollOffset = anchorTop - scrollViewTop
        
        // 设置滚动位置（需考虑原有滚动偏移）
        this.setData({
          scrollTop: this.data.scrollTop + scrollOffset - 20  // 减去容器padding
        })
      }
    });
  },
  // 同步滚动位置
  onScroll(e) {
    this.setData({ scrollTop: e.detail.scrollTop })
  }
});
