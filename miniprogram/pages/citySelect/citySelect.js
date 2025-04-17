import config from '../../config/config.js'
Page({
  data: {
    searchFocus: false,   // 是否点击搜索框
    searchKeyword: '',    // 搜索关键字
    searchResults: [],    // 搜索结果

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

  onLoad(options) {
    // 1. 初始化全部城市（可换成后端请求）
    this.initAllCities();

    // 2. 从本地或后端获取当前城市、历史城市
    const storedCity = wx.getStorageSync('currentCity') || '';
    const storedHistory = wx.getStorageSync('historyCities') || [];
    this.setData({
      currentCity: storedCity,
      historyCities: storedHistory
    });
    console.log("options.city",options.city);
    if (options.city){
      console.log("options.city222",options.city);
      this.setData({
        currentCity: options.city,
      })
    }
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
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });

    // 清空之前的定时器
    clearTimeout(this.timer);

    // 关键字为空则清空结果
    if (!keyword) {
      this.setData({ searchResults: [] });
      return;
    }
    // 延迟 500 毫秒后再执行搜索逻辑
    this.timer = setTimeout(() => {
      // 1. 先搜索后端门店城市
      this.mockSearchStoreCities(keyword).then(res => {
        if (res && res.length > 0) {
          // 找到门店城市结果
          const processed = res.map(item => {
            return {
              id: item.id,
              type: 'store',           // 标识这是门店城市结果
              cityName: item.cityName,
              // 高亮处理
              highlightName: this.highlightText(item.cityName, keyword)
            };
          });
          this.setData({ searchResults: processed });
        } else {
          // 2. 若无匹配城市，则调用高德 API
          this.fetchCityFuzzySearch(keyword);
        }
      });
    }, 500);  
  },

  // 模拟后端接口：搜索门店城市列表
  mockSearchStoreCities(keyword) {
    return new Promise(resolve => {
      // 假设后端存储了这些门店城市
      const storeCities = [
        { id: 1, cityName: '朝阳' },
        { id: 2, cityName: '丹阳' },
        { id: 3, cityName: '当阳' },
        { id: 4, cityName: '东阳' },
        { id: 5, cityName: '贵阳' },
        { id: 6, cityName: '衡阳' },
        { id: 7, cityName: '简阳' },
        { id: 8, cityName: '洛阳' },
        { id: 9, cityName: '南阳' },
        { id: 10, cityName: '信阳' },
        // ...
      ];
      // 模拟模糊搜索
      const result = storeCities.filter(item => item.cityName.includes(keyword));
      // 返回结果
      resolve(result);
    });
  },

  // 调用高德接口进行地址模糊搜索（取前10条）
  fetchCityFuzzySearch(keyword) {
    wx.request({
      url: 'https://restapi.amap.com/v5/place/text',
      data: {
        key: config.AMAP_KEY,
        keywords: keyword,
        page_size: 10, 
        page_num: 1
      },
      success: (res) => {
        if (res.data && res.data.status === '1') {
          const pois = res.data.pois || [];
          // 只取前10条
          const top10 = pois.slice(0, 10);
          const processed = top10.map(poi => {
            const address = `${poi.cityname}-${poi.adname}${
              poi.adname !== poi.address ? `-${poi.address}` : ''
            }`;
            return {
              id: poi.id,
              type: 'gaode', // 标识这是高德结果
              highlightName: this.highlightText(poi.name, keyword),
              address: address
            };
          });
          this.setData({ searchResults: processed });
        } else {
          // 搜索失败或无结果
          this.setData({ searchResults: [] });
        }
      },
      fail: () => {
        this.setData({ searchResults: [] });
        wx.showToast({
          title: '请求高德API失败',
          icon: 'none'
        });
      }
    });
  },

  // 关键词高亮函数：将匹配到的部分用 <span style="color:orange"> 包裹
  highlightText(text, keyword) {
    if (!keyword) return text;
    // 使用正则全局匹配（不区分大小写可加 'i'）
    const reg = new RegExp(`(${keyword})`, 'g');
    // 将匹配部分替换为橙色高亮
    const newText = text.replace(reg, `<span style="color:orange">$1</span>`);
    // 注意：rich-text 需要的是 HTML 字符串
    return newText;
  },

  // 点击搜索结果
  onSelectSearchResult(e) {
    const item = e.currentTarget.dataset.item;
    if (item.type === 'store') {
      // 门店城市结果：与原先selectCity逻辑一致
      this.selectCity({ cityName: item.cityName });
    } else {
      // 高德地址结果，假设只取 name 作为城市名
      // 若需要更准确的城市信息，需要从 poi 结构中解析
      const cityObj = { cityName: this.stripHtml(item.highlightName) };
      this.selectCity(cityObj);
    }

    // 选完收起搜索
    this.setData({
      searchFocus: false,
      searchKeyword: '',
      searchResults: []
    });
  },

  // 去除 HTML 标签，仅保留文字
  stripHtml(html) {
    return html.replace(/<[^>]+>/g, '');
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
    // wx.showToast({
    //   title: '定位功能未实现',
    //   icon: 'none'
    // });
    const that = this;
    wx.openSetting({
     
      success (res) {
        console.log(res.authSetting)
        const hasLocationAuth = res.authSetting && res.authSetting['scope.userLocation'];
        if (hasLocationAuth) {
          console.log('✅ 用户已授权位置信息');
          that.initLocation()
        }else{
          wx.showToast({
            title: '您拒绝了定位授权,请重新授权',
            icon: 'none'
          });
        }
      },
      fail: () => {
        this._exitMiniProgram(reject, error)
      }
    });
  },

  initLocation() {
    wx.getLocation({
      type: 'wgs84', // 返回 wgs84 坐标，可以用于地图显示
      success: (res) => {
        const { latitude, longitude } = res;
        console.log('用户经纬度：', latitude, longitude);
        // 根据经纬度获取详细地址信息
        // 调用高德地图 API 获取地级市
        const amapKey = config.AMAP_KEY; // 🔔 替换为你的高德地图 Web 服务 Key
        const url = `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${amapKey}&radius=1000&extensions=base`;

        wx.request({
          url: url,
          method: 'GET',
          success: (response) => {
            const data = response.data;
            if (data.status === '1') {
              const addressComponent = data.regeocode.addressComponent;
              console.log("addressComponent:",addressComponent);
              let city = addressComponent.city;
              let adcode = addressComponent.adcode;

              // 直辖市的处理：city 可能是空，使用 province 替代
              if (!city || (Array.isArray(city) && city.length === 0)) {
                city = addressComponent.province;
              }

              console.log('获取的城市：', city);
              // 去掉“市”字（如果有）
              city = city.replace(/市$/, '');
              
              this.setData({
                currentCity: city,
              });
            } else {
              wx.showToast({
                title: '获取城市失败',
                icon: 'none',
              });
            }
          },
          fail: (err) => {
            console.error('逆地理请求失败：', err);
            wx.showToast({
              title: '请求地址信息失败',
              icon: 'none',
            });
          }
        });
      },
      fail: (error) => {
        console.error('获取定位失败：', error);
        wx.showToast({
          title: '定位失败，请检查权限',
          icon: 'none',
        });
      }
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
    wx.navigateTo({
      url: `/pages/storeSelect/storeSelect?city=${city.cityName}`,
    });
  },

  /* 通用选城市逻辑 */
  selectCity(city) {
    // 设置当前城市
    // this.setData({ currentCity: city.cityName });
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
