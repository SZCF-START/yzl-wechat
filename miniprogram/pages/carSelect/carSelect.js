Page({
  data: {
    storeName: '首都机场T2店(站内取还)',
    startTime: '',
    endTime: '',

    features: [
      { key: 'cam', name: '倒车影像' },
      { key: 'radar', name: '倒车雷达' },
      { key: 'bluetooth', name: '蓝牙连接' },
      { key: 'carplay', name: 'CarPlay' },
      { key: '4wd', name: '四驱' },
      { key: '4wd', name: '四驱' },
      { key: '4wd', name: '四驱' },
    ],

    categories: [
      { id: 1, name: '推荐' },
      { id: 2, name: '京牌畅行', price: 258 },
      { id: 3, name: '精英型', price: 258 },
      { id: 4, name: 'SUV', price: 313 },
      { id: 5, name: '豪华车', price: 459 },
      { id: 6, name: '个性车', price: 1456 },
      { id: 7, name: '自助取还', price: 258 },
      { id: 8, name: '临近时间' }
    ],
    activeCat: 1,

    carList: [],

    showPopup: false,
    popup: {},
    showModal: false,
    daysDiff: 0,        // 相差天数
    startTimeInfo: {},   // 开始时间信息
    endTimeInfo: {} ,     // 结束时间信息
    currentCity: '',
    currentStore: '',
    pickupDateTimestamp: '',
    returnDateTimestamp: '',
    showMask: false,
    currentFilter: '',
    sortOptions: [
      { label: '默认排序', value: 'default' },
      { label: '价格从低到高', value: 'asc' },
      { label: '价格从高到低', value: 'desc' }
    ],
    activeType: '' ,// 当前激活的过滤类型
    selectedSort: '',

    selectedBrandCategory: '', // 当前显示的品牌
    // 模拟后端返回的品牌和车型数据
    brandData: [
      {
        id: 1,
        name: '奥迪',
        logo: '/images/brands/audi.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 101, name: 'A3', selected: false },
          { id: 102, name: 'A4L', selected: false },
          { id: 103, name: 'Q5L', selected: false },
          { id: 104, name: 'A6L', selected: false }
        ]
      },
      {
        id: 2,
        name: '宝马',
        logo: '/images/brands/bmw.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 201, name: 'A6L', selected: false },
          { id: 202, name: 'A7L', selected: false }
        ]
      },
      {
        id: 3,
        name: '本田',
        logo: '/images/brands/bentian.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 301, name: 'A7L', selected: false },
          { id: 302, name: 'Q5L', selected: false }
        ]
      },
      {
        id: 4,
        name: '比亚迪',
        logo: '/images/brands/biaozhi.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 401, name: 'Q3', selected: false },
          { id: 402, name: 'Q5L', selected: false }
        ]
      },
      {
        id: 5,
        name: '大众',
        logo: '/images/brands/dazhong.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 501, name: 'A3', selected: false },
          { id: 502, name: 'A6L', selected: false }
        ]
      },
      {
        id: 6,
        name: '丰田',
        logo: '/images/brands/fengtian.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 601, name: 'A6L', selected: false },
          { id: 602, name: 'A7L', selected: false }
        ]
      },
      {
        id: 7,
        name: '凯迪拉克',
        logo: '/images/brands/jibao.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 701, name: 'A6L', selected: false },
          { id: 702, name: 'A7L', selected: false }
        ]
      },
      {
        id: 8,
        name: '日产',
        logo: '/images/brands/richan.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 801, name: 'Q3', selected: false },
          { id: 802, name: 'Q5L', selected: false }
        ]
      },
      {
        id: 9,
        name: '日产2',
        logo: '/images/brands/richan.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限车系', selected: false },
          { id: 801, name: 'Q3', selected: false },
          { id: 802, name: 'Q5L', selected: false }
        ]
      }
    ],
    currentModels: [], // 当前显示的车型列表

    // 价格筛选
    selectedPriceRange: 'unlimited',
    priceRanges: [
      { value: 'unlimited', label: '不限', min: 0, max: null },
      { value: '0-150', label: '0-150', min: 0, max: 150 },
      { value: '150-250', label: '150-250', min: 150, max: 250 },
      { value: '250-350', label: '250-350', min: 250, max: 350 },
      { value: '350+', label: '350以上', min: 350, max: null }
    ],
    // 价格范围条相关
    rangeLeft: 0,
    rangeWidth: 600,  // 总宽度
    minPointPosition: 0,
    maxPointPosition: 600,
    minPointActive: false,
    maxPointActive: false,
    minPrice: 0,
    maxPrice: null,  // null 表示不限
  },

  onLoad(options) {
    console.log("carSelect-onLoad");
    // 上一页通过参数传递时间戳： options.startTime、options.endTime\
    // console.log("options.pickupTime:",options.pickupTime); 
    // console.log("options.returnTime:",options.returnTime);
    console.log("options.currentCity:",options.currentCity);
    const s = Number(options.pickupDate);
    const e = Number(options.returnDate);
    this.processTimestamps(s,e);
    this.setData({
      startTime: this.formatTimestamp(s),
      endTime: this.formatTimestamp(e),
      carList: this._mockCars(),
      currentCity: options.currentCity,
      pickupDateTimestamp: s,
      returnDateTimestamp: e
    });
    const store = wx.getStorageSync('selectedStore');
    const city = wx.getStorageSync('currentCity');
    if (city) {
      console.log("store555777:",city);
      this.setData({ currentCity: city }, () => {
        wx.nextTick(() => {
          console.log("DOM 已更新，可执行渲染后操作");
        });
      });
    }
    if (store) {
      console.log("store555777:",store);
      this.setData({ currentStore: store }, () => {
        wx.nextTick(() => {
          console.log("DOM 已更新，可执行渲染后操作");
        });
      });
    }


    // 页面加载时，默认选中第一个品牌
    if (this.data.brandData.length > 0) {
      this.setData({
        selectedBrandCategory: this.data.brandData[0].name,
        currentModels: this.data.brandData[0].models
      });
    }
  },

  onShow(options) {
    console.log("carSelect-onShow");
    const { pickupDateTimestamp, returnDateTimestamp } = this.data;
    
    this.processTimestamps(pickupDateTimestamp,returnDateTimestamp);
    this.setData({
      startTime: this.formatTimestamp(pickupDateTimestamp),
      endTime: this.formatTimestamp(returnDateTimestamp),
      carList: this._mockCars(),
    }); 
  },

  // 时间戳格式化为 MM-DD hh:mm
  formatTimestamp(ts) {
    const d = new Date(ts);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const hh = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${mm}-${dd} ${hh}:${min}`;
  },

  // 模拟车辆数据
  _mockCars() {
    return [
      {
        id:1, name:'日产天籁', desc:'自动/2.0L/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['蓝牙连接','倒车雷达','倒车影像','天窗'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      {
        id:2, name:'大众新帕萨特', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      // … 可继续添加
      {
        id:3, name:'大众新帕萨特1', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      {
        id:4, name:'大众新帕萨特2', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
      {
        id:5, name:'大众新帕萨特3', desc:'双离合/1.4T/三厢/5座',
        img:'../../assets/rsg.png',
        tags:['倒车雷达','蓝牙连接','六个月内车龄'],
        daily:258, total:636,
        details:[
          {label:'基础租金',value:'¥500'},
          {label:'保险费',value:'¥100'},
          {label:'手续费',value:'¥36'}
        ]
      },
    ];
  },

  // 显示蒙层
  showTimeModal() {

    this.setData({ showModal: true });
  },

  // 隐藏蒙层
  hideTimeModal() {
    this.setData({ showModal: false });
  },

  onSelectCar() {
    wx.setStorageSync('selectedStore', this.data.currentStore);
    wx.setStorageSync('currentCity', this.data.currentCity);
    wx.setStorageSync('pickupDateTimestamp',this.data.pickupDateTimestamp);
    wx.setStorageSync('returnDateTimestamp', this.data.returnDateTimestamp);
    this.setData({ showModal: false });
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    currentPage.onShow();
    // 跳回车型列表页面（当前页），或重置列表
  },

  // 切换分类
  onCategoryTap(e) {
    this.setData({ activeCat: e.currentTarget.dataset.id });
    // TODO: 过滤 carList
  },

  // 跳转车型详情
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url:`/pages/carDetail/carDetail?id=${id}` });
  },

  // 跳转评论页面
  goComment(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url:`/pages/carComment/carComment?id=${id}` });
  },

  // 显示总价费用明细弹框
  showDetail(e) {
    const item = e.currentTarget.dataset.item;
    this.setData({ showPopup:true, popup:item });
  },

  closePopup() {
    this.setData({ showPopup:false });
  },

  noop() {},  // 阻止冒泡

  // 处理时间戳的主函数
  processTimestamps(startStamp, endStamp) {
    const start = this.formatTimestamp1(startStamp)
    const end = this.formatTimestamp1(endStamp)
    const diff = this.calcDayDiff(startStamp, endStamp)
    
    this.setData({
      startTimeInfo: start,
      endTimeInfo: end,
      daysDiff: diff
    })
  },

  // 时间戳格式化函数
  formatTimestamp1(timestamp) {
    const date = new Date(timestamp)
    // 格式：周一
    const weekDay = `周${['日','一','二','三','四','五','六'][date.getDay()]}`;
    // 格式：16:00
    const timeStr = `${this.padZero(date.getHours())}:${this.padZero(date.getMinutes())}`;
    return {
      // 格式：02月21日
      dateStr: `${this.padZero(date.getMonth() + 1)}月${this.padZero(date.getDate())}日`,
      // 格式：周一 16:00
      timeStr: weekDay + " " + timeStr,
    }
  },

  // 计算相差天数（不足一天算一天）
  calcDayDiff(startStamp, endStamp) {
    const diff = (endStamp - startStamp) / (1000 * 60 * 60 * 24);
    return Math.ceil(diff);
  },

  // 补零函数
  padZero(num) {
    return num.toString().padStart(2, '0')
  },
  goTimeSelect() {
    // 把当前选择的日期和时间传过去
    const { pickupDateTimestamp, returnDateTimestamp, startTimeInfo, endTimeInfo } = this.data;
    wx.navigateTo({
      url: `/pages/timeSelect/timeSelect?pickupDate=${pickupDateTimestamp}&returnDate=${returnDateTimestamp}&pickupTime=${startTimeInfo.timeStr}&returnTime=${endTimeInfo.timeStr}`,
    });
  },
  goCitySelect() {
    let url = '/pages/citySelect/citySelect';

    let sourceUrl = '/pages/carSelect/carSelect'
    url += `?source=${encodeURIComponent(sourceUrl)}`;
    if (this.data.isLocationEnabled) {
      url += `&city=${this.data.currentCity}`;
    }
    wx.navigateTo({
      url: url,
    });
  },
  goStoreSelect() {
    if (!this.data.currentCity) {
      wx.showToast({ title: '请先选择城市', icon: 'none' });
      return;
    }
    let sourceUrl = '/pages/carSelect/carSelect'
    wx.navigateTo({
      url: `/pages/storeSelect/storeSelect?city=${this.data.currentCity}&source=${sourceUrl}`,
    });
  },

  // 点击筛选项
  onFilterTap(e) {
    console.log("e55666dff:",e);
    const type = e.currentTarget.dataset.type
    const isActive = this.data.activeType === type;
    this.setData({
      currentFilter: type,
      activeType: isActive ? '' : type,
      showMask: !isActive // 如果已经是激活状态则关闭，否则开启
    })
  },

  // 点击蒙层遮罩关闭
  onMaskClose() {
    // this.setData({
    //   showMask: false,
    //   currentFilter: ''
    // })
  },

  // 防止点击内容区域关闭
  stopTouch() {},

  // 点击选项
  onSortSelect(e) {
    console.log("e2222:",e);
    const selectedValue = e.currentTarget.dataset.value
    console.log('选择了排序项:', selectedValue)
    this.setData({
      selectedSort: selectedValue === 'default' ? '' : selectedValue,
      showMask: false,
      currentFilter: '',
      activeType: '',
    })
    // 可进一步处理筛选逻辑
  },

  
  // 选择左侧品牌
  selectBrandCategory(e) {
    const brandName = e.currentTarget.dataset.brand;
    const selectedBrand = this.data.brandData.find(brand => brand.name === brandName);
    
    if (selectedBrand) {
      this.setData({
        selectedBrandCategory: brandName,
        currentModels: selectedBrand.models
      });
    }
  },

  // 选择右侧车型
  selectModel(e) {
    const modelId = e.currentTarget.dataset.modelid;
    const { selectedBrandCategory, brandData: originalBrandData } = this.data;
  
    // 深拷贝避免直接修改原数据
    const brandData = JSON.parse(JSON.stringify(originalBrandData));
    const brandIndex = brandData.findIndex(brand => brand.name === selectedBrandCategory);
    if (brandIndex === -1) return;
  
    const currentBrand = brandData[brandIndex];
    const models = currentBrand.models;
    const modelIndex = models.findIndex(model => model.id === modelId);
    if (modelIndex === -1) return;
  
    // 使用映射生成新车型数组（核心优化点）
    const newModels = models.map(model => {
      // 处理"none"的特殊互斥逻辑
      if (modelId === 'none') {
        return {
          ...model,
          selected: model.id === 'none' ? !model.selected : false
        };
      } else {
        return {
          ...model,
          selected: model.id === 'none' 
            ? false 
            : model.id === modelId 
              ? !model.selected 
              : model.selected
        };
      }
    });
  
    // 更新品牌数据
    currentBrand.models = newModels;
    currentBrand.hasSelectedModels = newModels.some(model => model.selected);
  
    this.setData({
      brandData: brandData,
      currentModels: newModels
    });
  },

  // 清空选择
  clearBrandSelection() {
    const brandData = JSON.parse(JSON.stringify(this.data.brandData));
    
    // 重置所有选择状态
    brandData.forEach(brand => {
      brand.hasSelectedModels = false;
      brand.models.forEach(model => {
        model.selected = false;
      });
    });
    
    this.setData({
      brandData: brandData,
      currentModels: brandData.find(brand => brand.name === this.data.selectedBrandCategory)?.models || []
    });
  },

  // 确认选择
  confirmBrandSelection() {
    // 处理已选择的品牌和车型
    const selectedBrands = {};
    this.data.brandData.forEach(brand => {
      const selectedModels = brand.models.filter(model => model.selected).map(model => model.name);
      if (selectedModels.length > 0) {
        selectedBrands[brand.name] = selectedModels;
      }
    });
    
    console.log('已确认选择的品牌和车型:', selectedBrands);
    
    // 关闭弹窗
    this.setData({
      showMask: false
    });
    
    // 这里可以添加筛选回调
  },

  // 选择价格区间
  onPriceRangeSelect(e) {
    const range = e.currentTarget.dataset.range;
    const totalWidth = 600; // rpx
    let rangeLeft = 0;
    let rangeWidth = totalWidth;
    let minPointPosition = 0;
    let maxPointPosition = totalWidth;
    let minPrice = 0;
    let maxPrice = null;
    
    // 根据所选范围设置价格条的位置
    switch(range) {
      case '0-150':
        maxPointPosition = totalWidth * 0.25;
        rangeWidth = maxPointPosition;
        minPrice = 0;
        maxPrice = 150;
        break;
      case '150-250':
        minPointPosition = totalWidth * 0.25;
        maxPointPosition = totalWidth * 0.5;
        rangeLeft = minPointPosition;
        rangeWidth = maxPointPosition - minPointPosition;
        minPrice = 150;
        maxPrice = 250;
        break;
      case '250-350':
        minPointPosition = totalWidth * 0.5;
        maxPointPosition = totalWidth * 0.75;
        rangeLeft = minPointPosition;
        rangeWidth = maxPointPosition - minPointPosition;
        minPrice = 250;
        maxPrice = 350;
        break;
      case '350+':
        minPointPosition = totalWidth * 0.75;
        rangeLeft = minPointPosition;
        rangeWidth = totalWidth - minPointPosition;
        minPrice = 350;
        maxPrice = null;
        break;
      case 'unlimited':
      default:
        minPrice = 0;
        maxPrice = null;
    }
    
    this.setData({
      selectedPriceRange: range,
      rangeLeft,
      rangeWidth,
      minPointPosition,
      maxPointPosition,
      minPrice,
      maxPrice
    });
  },
  
  // 最小点触摸开始
  onMinPointTouchStart() {
    this.setData({
      minPointActive: true
    });
  },
  
  // 最小点触摸移动
  onMinPointTouchMove(e) {
    // 在实际应用中，这里应该处理触摸移动逻辑
    // 但根据需求，我们只需点击选择固定范围，此处保留但不实现滑动逻辑
  },
  
  // 最小点触摸结束
  onMinPointTouchEnd() {
    this.setData({
      minPointActive: false
    });
  },
  
  // 最大点触摸开始
  onMaxPointTouchStart() {
    this.setData({
      maxPointActive: true
    });
  },
  
  // 最大点触摸移动
  onMaxPointTouchMove(e) {
    // 在实际应用中，这里应该处理触摸移动逻辑
    // 但根据需求，我们只需点击选择固定范围，此处保留但不实现滑动逻辑
  },
  
  // 最大点触摸结束
  onMaxPointTouchEnd() {
    this.setData({
      maxPointActive: false
    });
  },
  
  // 清空价格筛选
  onClearPrice() {
    this.initPriceRangeBar();
    this.setData({
      selectedPriceRange: 'unlimited',
      minPrice: 0,
      maxPrice: null
    });
  },
  
  // 确认价格筛选
  onConfirmPrice() {
    this.setData({
      showMask: false
    });
    
    // 触发价格筛选查询
    this.applyFilters();
  },
  
  // 应用所有筛选条件
  applyFilters() {
    // 构建查询参数
    const filters = {
      sort: this.data.selectedSort,
      minPrice: this.data.minPrice,
      maxPrice: this.data.maxPrice
    };
    
    console.log('应用筛选条件:', filters);
    
    // 这里可以调用请求数据的方法
    // this.fetchFilteredData(filters);
  }
});
