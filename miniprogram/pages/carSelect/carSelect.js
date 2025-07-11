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

    // categories: [
    //   { id: 1, name: '推荐' },
    //   { id: 2, name: '京牌畅行', price: 258 },
    //   { id: 3, name: '精英型', price: 258 },
    //   { id: 4, name: 'SUV', price: 313 },
    //   { id: 5, name: '豪华车', price: 459 },
    //   { id: 6, name: '个性车', price: 1456 },
    //   { id: 7, name: '自助取还', price: 258 },
    //   { id: 8, name: '临近时间' }
    // ],
    categories: [
      { id: 1, name: '热门推荐' },                    // 默认展示机型
      { id: 2, name: '微型挖机（1-5吨）', price: 1200 },  // 三一SY16C/徐工XE27E
      { id: 3, name: '小型挖机（6-15吨）', price: 1800 }, // 柳工915E/临工LG6150
      { id: 4, name: '中型挖机（20-30吨）', price: 2600 },// 三一SY245/中联ZE205E
      { id: 5, name: '大型挖机（35吨+）', price: 3500 },  // 山河SWE450/徐工XE370
      { id: 6, name: '智能电驱型', price: 3200 },        // 三一SY550H混合动力
      { id: 7, name: '长臂深坑型', price: 3800 },       // 超长臂改装（10米+）
      { id: 8, name: '特种改装型', price: 4200 },       // 抓钢机/拆楼剪/打桩臂
      // { id: 9, name: '当天可取', price: 0 },           // 紧急工程绿色通道
      // { id: 10, name: '灵活租期' }                    // 支持小时/周租计费
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
        name: '三一重工',
        logo: '/images/brands/sany.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 101, name: 'SY75C（0.8m³铲斗）', selected: false },
          { id: 102, name: 'SY365（2.2m³矿用）', selected: false },
          { id: 103, name: 'SY950（智能液压）', selected: false }
        ]
      },
      {
        id: 2,
        name: '徐工集团',
        logo: '/images/brands/xugong.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 201, name: 'XE60D（6吨级）', selected: false },
          { id: 202, name: 'XE370（矿山版）', selected: false }
        ]
      },
      {
        id: 3,
        name: '柳工机械',
        logo: '/images/brands/liugong.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 301, name: 'CLG915E（混合动力）', selected: false },
          { id: 302, name: 'CLG950（超长臂）', selected: false }
        ]
      },
      {
        id: 4,
        name: '临工重机',
        logo: '/images/brands/lingong.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 401, name: 'LG6150（高原型）', selected: false },
          { id: 402, name: 'LG670（隧道专用）', selected: false }
        ]
      },
      {
        id: 5,
        name: '中联重科',
        logo: '/images/brands/zoomlion.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 501, name: 'ZE205E（智能版）', selected: false },
          { id: 502, name: 'ZE700（深基坑）', selected: false }
        ]
      },
      {
        id: 6,
        name: '山河智能',
        logo: '/images/brands/sunward.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 601, name: 'SWE210（沼泽地）', selected: false },
          { id: 602, name: 'SWE450（拆楼王）', selected: false }
        ]
      },
      {
        id: 7,
        name: '山推股份',
        logo: '/images/brands/shanwei.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 701, name: 'SE75（市政版）', selected: false },
          { id: 702, name: 'SE390（岩石斗）', selected: false }
        ]
      },
      {
        id: 8,
        name: '雷沃重工',
        logo: '/images/brands/lovol.png',
        hasSelectedModels: false,
        models: [
          { id: 'none', name: '不限机型', selected: false },
          { id: 801, name: 'FR650（抓钢机）', selected: false },
          { id: 802, name: 'FR220（轮式）', selected: false }
        ]
      }
    ],
    currentModels: [], // 当前显示的车型列表

    // 价格范围条相关
    pricePoints: [0, 150, 250, 350, Infinity], // Infinity 表示"不限"
    leftThumbPosition: 0, // 左滑块位置，单位rpx
    rightThumbPosition: 600, // 右滑块位置，单位rpx
    confirmLeftThumbPosition: null, 
    confirmRightThumbPosition: null,
    selectionWidth: 620, // 选中区域宽度，单位rpx
    confirmSelectionWidth: 0,
    trackWidth: 620, // 轨道总宽度，单位rpx
    isRangeSelecting: false, // 是否正在选择区间
    firstSelectedPoint: null, // 首次选中的点
    minPrice: 0,
    maxPrice: null, // null 表示不限
    selectedPriceRange: 'unlimited',
    isRangeValid: false,
    isTrackGrayed: false,
    
    moreFilters: [
      {
        title: '核心配置',
        key: 'carConfig',
        options: ['360°监控系统', 'GPS定位', '防滚架', '自动润滑', '快速换装']
      },
      {
        title: '动力类型',
        key: 'powerType',
        options: ['柴油发动机', '油电混合', '纯电动', '涡轮增压']
      },
      {
        title: '吨位级别',
        key: 'weight',
        options: ['5-10吨', '10-20吨', '20-30吨', '30吨+']
      },
      {
        title: '属具类型',
        key: 'attachment',
        options: ['标准铲斗', '岩石斗', '抓钢器', '破碎锤', '松土器']
      },
      // {
      //   title: '服务类型',
      //   key: 'service',
      //   options: ['含操作员', '自备操作员', '免费运输', '技术支持']
      // }
    ],
    selectedFilters: {
      carConfig: [],
      powerType: [],
      weight: [],
      attachment: []
    },
    //更多最终选择
    confirmSelectedFilters: {
      carConfig: [],
      powerType: [],
      weight: [],
      attachment: []
    },
    processedList: [],
    //更多选项任意一个是否被选中状态
    confirmActive: false,
    //品牌任意一个车型是否被选中状态
    brandActive: false,
    //品牌最终选择
    selectedModels: {}
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

    // 初始化价格范围条
    this.initPriceRangeBar();
    this.updateProcessedList();
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
        id: 1,
        name: '三一重工SY75C',
        desc: '液压先导/21吨级/履带式',
        img: '../../assets/rsg.png',
        tags: ['GPS定位', '智能调速', '防滚架', '快速维护'],
        daily: 2200,
        total: 32800,
        details: [
          {label: '基础租金', value: '¥28,000'},
          {label: '设备保险费', value: '¥3,500'},
          {label: '运输费', value: '¥1,300'}
        ]
      },
      {
        id: 2,
        name: '徐工XE60D',
        desc: '液压先导/6吨级/履带式',
        img: '../../assets/rsg.png',
        tags: ['低油耗', '折叠臂', '三年质保'],
        daily: 1500,
        total: 21800,
        details: [
          {label: '基础租金', value: '¥18,000'},
          {label: '设备保险费', value: '¥2,800'},
          {label: '操作员费', value: '¥1,000'}
        ]
      },
      {
        id: 3,
        name: '柳工CLG915E',
        desc: '机械拉杆/15吨级/​​轮式',
        img: '../../assets/rsg.png',
        tags: ['远程监控', '自动润滑', '工况适应'],
        daily: 2800,
        total: 45800,
        details: [
          {label: '基础租金', value: '¥40,000'},
          {label: '设备保险费', value: '¥4,200'},
          {label: '燃油补贴', value: '¥1,600'}
        ]
      },
      {
        id: 4,
        name: '临工LG6150',
        desc: '液压先导/6吨级/履带式',
        img: '../../assets/rsg.png',
        tags: ['矿山加强型', '防爆系统', '快速换装'],
        daily: 2600,
        total: 43800,
        details: [
          {label: '基础租金', value: '¥36,000'},
          {label: '设备保险费', value: '¥5,000'},
          {label: '配件押金', value: '¥2,800'}
        ]
      },
      {
        id: 5,
        name: '中联重科ZE205E',
        desc: '电控液压/6吨级/履带式',
        img: '../../assets/rsg.png',
        tags: ['工况自识别', '云端管理', '360°影像'],
        daily: 3500,
        total: 59800,
        details: [
          {label: '基础租金', value: '¥50,000'},
          {label: '设备保险费', value: '¥7,000'},
          {label: '技术支持费', value: '¥2,800'}
        ]
      }
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
    console.log("999999");
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
    console.log("this.data.brandActive:",this.data.brandActive);
    console.log("this.data.selectedModels:",this.data.selectedModels);
    if(Object.keys(this.data.selectedModels).length === 0) {
      this.clearBrandSelection()
    }else{
      this.updateBrandSelectionFromSelectedModels()
    }

    console.log("this.data.confirmLeftThumbPosition:",this.data.confirmLeftThumbPosition);
    console.log("this.data.confirmRightThumbPosition:",this.data.confirmRightThumbPosition);
    if(this.data.confirmLeftThumbPosition !== null && this.data.confirmRightThumbPosition !== null){
      const firstIndex = this.getPointIndexFromPosition(this.data.confirmLeftThumbPosition);
      const secondIndex = this.getPointIndexFromPosition(this.data.confirmRightThumbPosition);
      if (firstIndex <= secondIndex) {
        this.updatePriceRange(firstIndex, secondIndex);
      } else {
        this.updatePriceRange(secondIndex, firstIndex);
      }
    }else{
      this.initPriceRangeBar();
    }
    const type = e.currentTarget.dataset.type
    const isActive = this.data.activeType === type;
    this.setData({
      currentFilter: type,
      activeType: isActive ? '' : type,
      showMask: !isActive // 如果已经是激活状态则关闭，否则开启
    })

    this.updateProcessedList(true)
    this.setData({
      selectedFilters: {
        carConfig: [...this.data.confirmSelectedFilters.carConfig],
        powerType: [...this.data.confirmSelectedFilters.powerType],
        weight: [...this.data.confirmSelectedFilters.weight],
        attachment: [...this.data.confirmSelectedFilters.attachment]
      }
    })
  },

  updateBrandSelectionFromSelectedModels() {
    const { selectedModels, brandData } = this.data;
  
    const updatedBrandData = brandData.map(brand => {
      const selectedIds = selectedModels[brand.id] || [];
      console.log("selectedIds:",selectedIds);
      const updatedModels = brand.models.map(model => ({
        ...model,
        selected: selectedIds.includes(model.id)
      }));
      console.log("updatedModels:",updatedModels);
      return {
        ...brand,
        hasSelectedModels: selectedIds.length > 0,
        models: updatedModels
      };
    });
    console.log("updatedBrandData:",updatedBrandData);
    const selectedBrand = updatedBrandData.find(brand => brand.name === this.data.selectedBrandCategory);
    this.setData({
      brandData: updatedBrandData,
      currentModels: selectedBrand.models,
      brandActive: true
    });
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
    //检查是否有任意一个车型选中
    const brandActive = brandData.some(item => item.hasSelectedModels === true);

    this.setData({
      brandData: brandData,
      currentModels: newModels,
      brandActive
    }, () => {
      console.log("brandData:",brandData);
      console.log("currentModels:",this.data.currentModels);
      console.log("brandActive:",brandActive);
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
      currentModels: brandData.find(brand => brand.name === this.data.selectedBrandCategory)?.models || [],
      brandActive: false,
      
    });
  },

  // 确认选择
  confirmBrandSelection() {
    // 处理已选择的品牌和车型
    const selectedBrands = {};
    this.data.brandData.forEach(brand => {
      const selectedModels = brand.models.filter(model => model.selected).map(model => model.id);
      if (selectedModels.length > 0) {
        selectedBrands[brand.id] = selectedModels;
      }
    });
    
    console.log('已确认选择的品牌和车型:', selectedBrands);
    
    // 关闭弹窗
    this.setData({
      showMask: false,
      activeType: '',
      selectedModels: selectedBrands
    }, () => {
      console.log("selectedModels:",this.data.selectedModels);
    });
    
    // 这里可以添加筛选回调
  },

  // 初始化价格范围条
  initPriceRangeBar() {
    // 设置轨道刻度分段
    const pricePointsCount = this.data.pricePoints.length;
    const tickMarks = [];
    for (let i = 0; i < pricePointsCount; i++) {
      tickMarks.push({
        position: this.getPositionFromPointIndex(i)
      });
    }
    this.setData({
      leftThumbPosition: 0,
      rightThumbPosition: this.data.trackWidth,
      selectionWidth: this.data.trackWidth,
      isRangeSelecting: false,
      firstSelectedPoint: null,
      minPrice: 0,
      maxPrice: null,
      selectedPriceRange: '',
      isRangeValid: false, // 添加表示范围是否有效的标志
      isTrackGrayed: false, // 添加表示轨道是否置灰的标志
      tickMarks: tickMarks, // 添加刻度标记数组
    });
  },
  
  // 点击左滑块
  onLeftThumbTap() {
    if (this.data.isRangeSelecting) {
      // 如果已经在选择区间，重置状态
      this.setData({
        isRangeSelecting: false,
        firstSelectedPoint: null,
        isTrackGrayed: false
      });
    } else {
      // 标记开始选择区间，并记录第一个点为左滑块位置
      const pointIndex = this.getPointIndexFromPosition(this.data.leftThumbPosition);
      this.setData({
        isRangeSelecting: true,
        firstSelectedPoint: pointIndex,
        isTrackGrayed: true // 置灰轨道
      });
    }
  },
  
  // 点击右滑块
  onRightThumbTap() {
    if (this.data.isRangeSelecting) {
      // 如果已经在选择区间，重置状态
      this.setData({
        isRangeSelecting: false,
        firstSelectedPoint: null,
        isTrackGrayed: false
      });
    } else {
      // 标记开始选择区间，并记录第一个点为右滑块位置
      const pointIndex = this.getPointIndexFromPosition(this.data.rightThumbPosition);
      this.setData({
        isRangeSelecting: true,
        firstSelectedPoint: pointIndex,
        isTrackGrayed: true // 置灰轨道
      });
    }
  },
  
  // 点击轨道
  onTrackClick(e) {
    // 获取点击位置相对于轨道的坐标
    console.log("e666:", e);
    
    // 使用SelectorQuery替代getBoundingClientRect
    const query = wx.createSelectorQuery();
    query.select('.click-area').boundingClientRect();
    query.exec((res) => {
      if (res && res[0]) {
        const trackRect = res[0];
        const clickX = e.touches[0].clientX - trackRect.left;
        
        // 将点击位置转换为rpx单位
        const rpxRatio = 750 / wx.getSystemInfoSync().windowWidth;
        const clickPositionRpx = clickX * rpxRatio;
        
        // 找到最接近点击位置的价格点
        const nearestPointIndex = this.findNearestPricePoint(clickPositionRpx);
        const nearestPosition = this.getPositionFromPointIndex(nearestPointIndex);
        
        
        if (this.data.isRangeSelecting) {
          console.log("44444444566666");
          // 正在选择区间，这是第二次点击
          const firstIndex = this.data.firstSelectedPoint;

          // 检查是否与第一次点击位置相同
          if (firstIndex === nearestPointIndex) {
            // 相同点击位置，无效操作，继续等待不同位置的点击
            console.log('点击位置相同，请选择不同位置');
            return;
          }
          const secondIndex = nearestPointIndex;
          
          // 确保左滑块在右滑块左侧
          if (firstIndex <= secondIndex) {
            this.updatePriceRange(firstIndex, secondIndex);
          } else {
            this.updatePriceRange(secondIndex, firstIndex);
          }
          
          // 重置选择状态并设置范围有效
          this.setData({
            isRangeSelecting: false,
            firstSelectedPoint: null,
            isTrackGrayed: false,
            isRangeValid: true, // 设置范围有效
            rightThumbPosition: nearestPosition
          });
        } else {
          console.log("44444444555555555");
          // 第一次点击，开始选择区间
          this.setData({
            isRangeSelecting: true,
            firstSelectedPoint: nearestPointIndex,
            isTrackGrayed: true, // 置灰轨道
            isRangeValid: false, // 重置范围有效状态
            leftThumbPosition: nearestPosition, // 设置第一个滑块位置
            rightThumbPosition: null, // 清空第二个滑块位置
            selectionWidth: 0,
            selectedPriceRange: '',
          });
        }
      }
    });
  },
  
  // 根据点索引获取位置（rpx）
  getPositionFromPointIndex(index) {
    // 将价格点索引转换为位置
    const totalPoints = this.data.pricePoints.length;
    const segmentWidth = this.data.trackWidth / (totalPoints - 1);
    return index * segmentWidth;
  },
  
  // 根据位置获取最近的点索引
  getPointIndexFromPosition(position) {
    const totalPoints = this.data.pricePoints.length;
    const segmentWidth = this.data.trackWidth / (totalPoints - 1);
    return Math.round(position / segmentWidth);
  },
  
  // 找到最接近点击位置的价格点
  findNearestPricePoint(position) {
    const totalPoints = this.data.pricePoints.length;
    const segmentWidth = this.data.trackWidth / (totalPoints - 1);
    
    // 找到最接近的点索引
    return Math.min(Math.max(Math.round(position / segmentWidth), 0), totalPoints - 1);
  },
  
  // 更新价格范围
  updatePriceRange(leftIndex, rightIndex) {
    const leftPosition = this.getPositionFromPointIndex(leftIndex);
    const rightPosition = this.getPositionFromPointIndex(rightIndex);
    const selectionWidth = rightPosition - leftPosition;
    
    // 获取对应的价格值
    const minPrice = this.data.pricePoints[leftIndex];
    const maxPrice = this.data.pricePoints[rightIndex] === Infinity ? null : this.data.pricePoints[rightIndex];
    
    // 确定价格区间名称
    let rangeName = 'custom';
    if (leftIndex === 0 && rightIndex === 4) {
      rangeName = 'unlimited'; // 0 - 不限
    } else if (leftIndex === 0 && rightIndex === 1) {
      rangeName = '0-150'; // 0 - 150
    } else if (leftIndex === 1 && rightIndex === 2) {
      rangeName = '150-250'; // 150 - 250
    } else if (leftIndex === 2 && rightIndex === 3) {
      rangeName = '250-350'; // 250 - 350
    } else if (leftIndex === 3 && rightIndex === 4) {
      rangeName = '350+'; // 350 - 不限
    }
    
    this.setData({
      leftThumbPosition: leftPosition,
      rightThumbPosition: rightPosition,
      selectionWidth: selectionWidth,
      minPrice: minPrice,
      maxPrice: maxPrice,
      selectedPriceRange: rangeName,
      isRangeValid: true // 设置范围有效
    });
    
    console.log(`价格范围更新: ${minPrice} - ${maxPrice === null ? '不限' : maxPrice}`);
  },
  
  // 根据价格区间名称设置范围
  setPriceRangeByName(rangeName) {
    let leftIndex = 0;
    let rightIndex = 4;
    
    switch(rangeName) {
      case '0-150':
        leftIndex = 0;
        rightIndex = 1;
        break;
      case '150-250':
        leftIndex = 1;
        rightIndex = 2;
        break;
      case '250-350':
        leftIndex = 2;
        rightIndex = 3;
        break;
      case '350+':
        leftIndex = 3;
        rightIndex = 4;
        break;
      case 'unlimited':
      default:
        leftIndex = 0;
        rightIndex = 4;
    }
    
    this.updatePriceRange(leftIndex, rightIndex);
  },
  
  // 选择价格区间（通过快捷按钮）
  onPriceRangeSelect(e) {
    const range = e.currentTarget.dataset.range;
    this.setPriceRangeByName(range);
  },
  
  // 清空价格筛选
  onClearPrice() {
    this.initPriceRangeBar();
  },
  
  // 确认价格筛选
  onConfirmPrice() {
    this.setData({
      showMask: false,
      activeType: '',
      confirmLeftThumbPosition: this.data.leftThumbPosition,
      confirmRightThumbPosition: this.data.rightThumbPosition
    });
    
    // 触发价格筛选查询
    this.applyFilters();
  },
  
  // 应用所有筛选条件
  applyFilters() {
    // 构建查询参数
    const filters = {
      minPrice: this.data.minPrice,
      maxPrice: this.data.maxPrice
    };
    
    console.log('应用筛选条件:', filters);
    
    // 这里可以调用请求数据的方法
    // this.fetchFilteredData(filters);
  },

  updateProcessedList(useConfirm = false) {
    const { moreFilters, selectedFilters, confirmSelectedFilters } = this.data;
  
    // 根据参数决定使用哪个 filter 数据
    const filters = useConfirm ? confirmSelectedFilters : selectedFilters;
  
    const processedList = moreFilters.map(item => {
      return {
        key: item.key,
        title: item.title,
        options: item.options.map(option => {
          return {
            value: option,
            active: filters[item.key]?.includes(option) || false
          };
        })
      };
    });
  
    // 检查是否有任意 active 为 true
    const confirmActive = processedList.some(item => 
      item.options.some(option => option.active)
    );
  
    this.setData({
      processedList,
      confirmActive
    }, () => {
      console.log("processedList", processedList);
    });
  },
  
  // 优化后的筛选处理
  handleFilterSelect(e) {
    const { filterKey, optionValue } = e.currentTarget.dataset;
    const filters = this.data.selectedFilters[filterKey];
    const newFilters = filters.includes(optionValue)
      ? filters.filter(v => v !== optionValue)
      : [...filters, optionValue];

    this.setData({
      [`selectedFilters.${filterKey}`]: newFilters
    }, () => {
      console.log("this.data.selectedFilters",this.data.selectedFilters);
      this.updateProcessedList(); // 更新处理后的列表
    });
  },

  onClear() {
    // 清空选中的filters
    const emptyFilters = {};
    Object.keys(this.data.selectedFilters).forEach(key => {
      emptyFilters[key] = [];
    });

    this.setData({
      selectedFilters: emptyFilters
    }, () => {
      this.updateProcessedList();
    });
  },

  onConfirm() {
    console.log('用户选择了：', this.data.selectedOptions);

    this.setData({
      showMask: false,
      activeType: '',
      confirmSelectedFilters: {
        carConfig: [...this.data.selectedFilters.carConfig],
        powerType: [...this.data.selectedFilters.powerType],
        weight: [...this.data.selectedFilters.weight],
        attachment: [...this.data.selectedFilters.attachment]
      }
    });
    // 可以在这里触发事件，把筛选条件传递给列表页
  },

  onCheckout() {
    console.log("00000");
    wx.navigateTo({
      url: `/pages/orderConfirm/orderConfirm`,
    });
  }
});
