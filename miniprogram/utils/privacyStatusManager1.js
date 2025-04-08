// utils/privacyStatusManager.js

const listeners = [];

const privacyStatusManager = {
  isLocationEnabled: false, // 默认值

  /**
   * 主动检查用户是否需要授权隐私
   */
  check() {
    return new Promise((resolve, reject) => {
      wx.getPrivacySetting({
        success: (res) => {
          privacyStatusManager.isLocationEnabled = res.needAuthorization;
          privacyStatusManager._notifyListeners(res.needAuthorization);
          resolve(res.needAuthorization);
        },
        fail: (err) => {
          console.error("获取隐私设置失败", err);
          reject(err);
        }
      });
    });
  },

  /**
   * 弹出官方隐私协议弹窗
   */
  requestUserPrivacyConsent() {
    return new Promise((resolve, reject) => {
      wx.requirePrivacyAuthorize({
        success: () => {
          console.log("用户同意隐私协议");
          // 同意后再检查状态并通知
          privacyStatusManager.check().then(() => resolve(true));
        },
        fail: () => {
          console.warn("用户拒绝隐私协议");
          reject(false);
        }
      });
    });
  },

  /**
   * 注册监听器（当权限状态变更时触发）
   */
  onChange(callback) {
    if (typeof callback === 'function') {
      listeners.push(callback);
    }
  },

  /**
   * 获取当前状态（同步）
   */
  getStatus() {
    return this.isLocationEnabled;
  },

  /**
   * 内部方法：通知所有监听器
   */
  _notifyListeners(status) {
    listeners.forEach(fn => typeof fn === 'function' && fn(status));
  }
};

module.exports = privacyStatusManager;
