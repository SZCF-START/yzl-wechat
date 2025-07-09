const privacyStatusManager = {
  _modalLock: false,

  getPrivacyStatus() {
    return new Promise((resolve, reject) => {
      if (!wx.getPrivacySetting) {
        return resolve({ needAuthorization: false });
      }
      wx.getPrivacySetting({
        success(res) {
          resolve(res);
        },
        fail(err) {
          reject(err);
        }
      });
    });
  },

  showPrivacyAuthorizationPopup(options = {}) {
    return new Promise((resolve, reject) => {
      const { scope, scopeDesc } = options;
      if (scope && !this._isValidScope(scope)) {
        return reject(new Error(`无效的权限类型: ${scope}`));
      }
      if (!wx.requirePrivacyAuthorize) {
        console.warn("当前版本不支持隐私协议弹窗");
        return scope ? this._handleScopeAuth(scope) : resolve();
      }

      this._withModalLock(() => {
        return new Promise((innerResolve, innerReject) => {
          wx.requirePrivacyAuthorize({
            success: async () => {
              try {
                if (scope) {
                  await this._handleScopeAuth(scope, scopeDesc);
                }
                innerResolve();
              } catch (e) {
                innerReject(e);
              }
            },
            fail: (err) => {
              console.warn("隐私协议拒绝原始错误:", err);
              if (err.errMsg && err.errMsg.indexOf("privacy permission is not authorized") !== -1) {
                this._handlePrivacyReject(err, options, innerResolve, innerReject);
              } else {
                innerReject(err);
              }
            }
          });
        }).then(resolve).catch(reject);
      });
    });
  },

  _handlePrivacyReject(originalError, options, resolve, reject) {
    const retryCount = (options._retryCount || 0) + 1;
    wx.showModal({
      title: '温馨提示',
      content: '需要同意隐私协议才能继续使用服务',
      confirmText: '重新同意',
      cancelText: '退出',
      complete: (res) => {
        if (retryCount > 3) {
          return this._showFinalModal(reject, originalError);
        }
        if (res.confirm) {
          this._modalLock = false;
          wx.nextTick(() => {
            setTimeout(() => {
              this.showPrivacyAuthorizationPopup({
                ...options,
                _retryCount: retryCount
              }).then(resolve).catch(reject);
            }, 400);
          });
        } else {
          this._exitMiniProgram(reject, originalError);
        }
      }
    });
  },

  _withModalLock(fn) {
    if (this._modalLock) return Promise.resolve();
    this._modalLock = true;
    try {
      const result = fn();
      console.log("result:",result);
      if (result && typeof result.finally === 'function') {
        
        return result.finally(() => {
          console.log("6666");
          this._modalLock = false;
        });
      } else {
        console.log("777");
        this._modalLock = false;
        return Promise.resolve();
      }
    } catch (e) {
      console.log("888");
      this._modalLock = false;
      return Promise.reject(e);
    }
  },

  _exitMiniProgram(reject, error) {
    try {
      wx.exitMiniProgram();
    } catch (e) {
      console.error('退出失败:', e);
    }
    reject(this._formatError('privacy_reject', error));
  },

  _showFinalModal(reject, error) {
    wx.showModal({
      title: '提示',
      content: '您已多次拒绝，请手动前往设置开启权限',
      showCancel: false,
      success: () => {
        wx.openSetting({
          fail: () => this._exitMiniProgram(reject, error)
        });
      }
    });
  },

  _isValidScope(scope) {
    const validScopes = [
      'userLocation',
      'userLocationBackground',
      'album',
      'camera',
      'bluetooth'
    ];
    return validScopes.includes(scope);
  },

  async _handleScopeAuth(scope, scopeDesc) {
    try {
      const setting = await this.checkScopeSetting(scope);
      if (!setting.auth) {
        await this.requestScopeAuth(scope, scopeDesc);
      }
      return true;
    } catch (e) {
      console.log("finalErr:",e);
      throw this._formatError('scope_reject', e,scope);
    }
  },

  checkScopeSetting(scope) {
    return new Promise((resolve) => {
      wx.getSetting({
        success: (res) => {
          resolve({
            auth: res.authSetting[`scope.${scope}`] || false,
            isFinal: res.authSetting[`scope.${scope}`] !== undefined
          });
        },
        fail: () => resolve({ auth: false, isFinal: false })
      });
    });
  },

  requestScopeAuth(scope, desc) {
    return new Promise((resolve, reject) => {
      wx.authorize({
        scope: `scope.${scope}`,
        success: resolve,
        fail: (err) => {
          const finalErr = desc ? Object.assign(err, { scopeDesc: desc }) : err;
          reject(finalErr);
        }
      });
    });
  },

  _formatError(type, originalErr,scope) {
    const errorMap = {
      privacy_reject: {
        code: 1001,
        msg: '用户拒绝隐私协议',
        original: originalErr
      },
      scope_reject: {
        code: 1002,
        scope: scope,
        msg: '用户拒绝权限申请',
        original: originalErr
      }
    };
    return errorMap[type] || originalErr;
  },

  registerAutoPopupListener(callback) {
    if (!wx.onNeedPrivacyAuthorization) {
      console.warn("当前版本不支持 onNeedPrivacyAuthorization");
      return;
    }
    wx.onNeedPrivacyAuthorization((resolve, reject) => {
      if (typeof callback === 'function') {
        callback({
          resolve: () => this.showPrivacyAuthorizationPopup().then(resolve),
          reject
        });
      } else {
        this.showPrivacyAuthorizationPopup()
          .then(resolve)
          .catch(reject);
      }
    });
  },

  async initPrivacyCheck() {
    try {
      const res = await this.getPrivacyStatus();
      if (res.needAuthorization) {
        await this.showPrivacyAuthorizationPopup();
      }
    } catch (e) {
      console.error("隐私协议处理失败", e);
    }
    this.registerAutoPopupListener();
  }
};

module.exports = privacyStatusManager;
