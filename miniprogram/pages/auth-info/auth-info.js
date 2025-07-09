// pages/auth/info.js
import config from '../../config/config.js'

Page({
  data: {
    realName: '',
    idCardNumber: '',
    phoneNumber: '',
    certificationTime: ''
  },

  onLoad(options) {
    this.getUserAuthInfo();
  },

  // 获取用户实名认证信息
  getUserAuthInfo() {
    // 模拟API调用获取实名认证信息
    // 实际项目中替换为真实API调用
    const mockData = {
      realName: '张三',
      idCardNumber: '110101199001011234',
      phoneNumber: '138****5678',
      certificationTime: '2024-01-15 14:30:25'
    };

    // 处理身份证号脱敏
    const maskedIdCard = this.maskIdCard(mockData.idCardNumber);
    // 处理手机号脱敏
    const maskedPhone = this.maskPhone(mockData.phoneNumber);

    this.setData({
      realName: mockData.realName,
      idCardNumber: maskedIdCard,
      phoneNumber: maskedPhone,
      certificationTime: mockData.certificationTime
    });

    // 真实API调用示例（注释掉的代码）
    /*
    wx.request({
      url: config.baseUrl + 'user/getAuthInfo',
      method: 'GET',
      header: {
        'Authorization': wx.getStorageSync('token') || ''
      },
      success: (res) => {
        if (res.data && res.data.success) {
          const data = res.data.data;
          this.setData({
            realName: data.realName,
            idCardNumber: this.maskIdCard(data.idCardNumber),
            phoneNumber: this.maskPhone(data.phoneNumber),
            certificationTime: data.certificationTime
          });
        }
      },
      fail: (error) => {
        console.error('获取实名认证信息失败:', error);
        wx.showToast({
          title: '获取信息失败',
          icon: 'none'
        });
      }
    });
    */
  },

  // 身份证号脱敏处理
  maskIdCard(idCard) {
    if (!idCard || idCard.length < 18) return idCard;
    return idCard.substring(0, 6) + '********' + idCard.substring(14);
  },

  // 手机号脱敏处理
  maskPhone(phone) {
    if (!phone || phone.length < 11) return phone;
    return phone.substring(0, 3) + '****' + phone.substring(7);
  }
})