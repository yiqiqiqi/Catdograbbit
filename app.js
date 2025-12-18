// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    systemInfo: null,
    baseURL: 'http://60.204.233.13:8003/api',
    petUpdated: null, // 保留原有字段，若无用可删除
    domain: 'http://60.204.233.13:8003',
  },

  onLaunch: function () {
    this.getSystemInfo();
    this.checkLoginStatus();
  },

  getSystemInfo: function () {
    const that = this;
    wx.getSystemInfo({
      success: (res) => {
        that.globalData.systemInfo = res;
      },
      fail: (err) => {
        console.error('获取系统信息失败:', err);
      }
    });
  },

  /**
   * 优化：检查登录状态（避免重复跳转）
   */
  checkLoginStatus: function () {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    console.log("userInfo", userInfo);

    if (token && userInfo) {
      // 已登录：更新全局状态
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;

      // 优化：仅当前页面不是首页时，才跳转首页
      const pages = getCurrentPages();
      const currentPagePath = pages.length > 0 ? pages[0].route : '';
      if (currentPagePath !== 'pages/index/index') {
        wx.reLaunch({
          url: '/pages/index/index',
          success: () => {
            console.log('已登录，自动跳转首页');
          },
          fail: (err) => {
            console.log('跳转首页失败:', err);
          }
        });
      } else {
        console.log('已在首页，无需跳转');
      }
    } else {
      // 未登录：保持在登录页（app.json第一个页面是login）
      this.globalData.token = null;
      this.globalData.userInfo = null;
      console.log('未登录，显示登录页');
    }
  },

  // 原有登录方法：保留，仅补充注释
  login: function () {
    const that = this;
    return new Promise((resolve, reject) => {
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            console.log('获取到微信code:', loginRes.code);
            that.wxLogin(loginRes.code, resolve, reject);
          } else {
            console.log('登录失败！' + loginRes.errMsg);
            reject(new Error('微信登录失败：' + loginRes.errMsg));
          }
        },
        fail: (loginErr) => {
          console.log('wx.login调用失败:', loginErr);
          reject(new Error('wx.login调用失败'));
        }
      });
    });
  },

  // 原有微信登录请求：保留
  wxLogin: function (code, resolve, reject) {
    const that = this;
    const requestData = { code: code };

    console.log('发送登录请求数据:', JSON.stringify(requestData));
    console.log('请求URL:', `${that.globalData.baseURL}/auth/login`);

    wx.request({
      url: `${that.globalData.baseURL}/auth/login`,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: requestData,
      success: (res) => {
        console.log('完整登录响应:', res);
        console.log('响应状态码:', res.statusCode);
        console.log('响应数据:', JSON.stringify(res.data));

        if (res.statusCode === 200 && res.data.code === 0) {
          const { token, userInfo: responseUserInfo, isNewUser } = res.data.data;
          // 登录成功：同步本地缓存和全局数据（原有逻辑）
          wx.setStorageSync('token', token);
          wx.setStorageSync('userInfo', responseUserInfo);
          that.globalData.userInfo = responseUserInfo;
          that.globalData.token = token;

          that.emitLoginSuccess(responseUserInfo, isNewUser);
          const toastTitle = isNewUser ? '欢迎新用户！' : '登录成功';
          wx.showToast({ title: toastTitle, icon: 'success', duration: isNewUser ? 2000 : 1500 });
          resolve({ userInfo: responseUserInfo, isNewUser });
        } else {
          const errorMsg = res.data.message || `登录失败 (${res.statusCode})`;
          console.log('登录失败 - 状态码:', res.statusCode, '错误信息:', errorMsg);
          that.showError(errorMsg, false);
          reject(new Error(errorMsg));
        }
      },
      fail: (error) => {
        console.log('登录请求失败:', error);
        that.showError('网络错误，请检查网络连接', false);
        reject(error);
      }
    });
  },

  // 原有发送登录成功事件：保留
  emitLoginSuccess: function (userInfo, isNewUser) {
    console.log('开始发送登录成功事件', userInfo, isNewUser);
    // 方法1：全局回调
    if (this.loginSuccessCallback && typeof this.loginSuccessCallback === 'function') {
      console.log('调用全局登录成功回调');
      try {
        this.loginSuccessCallback(userInfo, isNewUser);
      } catch (e) {
        console.error('全局登录回调执行错误:', e);
      }
    } else {
      console.log('全局登录回调未设置或不是函数');
    }
    // 方法2：当前页面方法
    const pages = getCurrentPages();
    if (pages && pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.onLoginSuccess && typeof currentPage.onLoginSuccess === 'function') {
        console.log('调用当前页面onLoginSuccess方法');
        try {
          currentPage.onLoginSuccess(userInfo, isNewUser);
        } catch (e) {
          console.error('页面登录回调执行错误:', e);
        }
      }
    }
  },

  // 原有设置登录成功回调：保留
  setLoginSuccessCallback: function (callback) {
    console.log('设置登录成功回调', typeof callback);
    this.loginSuccessCallback = (callback && typeof callback === 'function') ? callback : null;
  },

  // 原有更新用户资料：保留，补充兼容性提醒
  updateUserProfile: function () {
    const that = this;
    return new Promise((resolve, reject) => {
      // 前置校验 Token
      if (!that.getValidToken()) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        reject(new Error('请先登录'));
        return;
      }

      // 注意：wx.getUserProfile 需用户主动触发（如按钮点击），且基础库≥2.10.4
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (userRes) => {
          console.log('获取用户信息成功:', userRes);
          wx.request({
            url: `${that.globalData.baseURL}/auth/update-profile`,
            method: 'POST',
            header: {
              'Authorization': `Bearer ${that.globalData.token}`,
              'Content-Type': 'application/json'
            },
            data: {
              nickname: userRes.userInfo.nickName,
              avatar: userRes.userInfo.avatarUrl
            },
            success: (res) => {
              if (res.data.code === 0) {
                const updatedUserInfo = res.data.data;
                wx.setStorageSync('userInfo', updatedUserInfo);
                that.globalData.userInfo = updatedUserInfo;
                wx.showToast({ title: '资料更新成功', icon: 'success' });
                console.log('用户资料更新成功');
                resolve(updatedUserInfo);
              } else {
                const errorMsg = res.data.message || '未知错误';
                console.log('更新用户资料失败:', errorMsg);
                wx.showToast({ title: '更新失败: ' + errorMsg, icon: 'none' });
                reject(new Error(errorMsg));
              }
            },
            fail: (error) => {
              console.log('更新用户资料请求失败:', error);
              wx.showToast({ title: '网络错误', icon: 'none' });
              reject(error);
            }
          });
        },
        fail: (err) => {
          console.log('获取用户信息失败:', err);
          wx.showToast({ title: '获取用户信息失败', icon: 'none' });
          reject(err);
        }
      });
    });
  },

  // 原有新用户引导：保留
  showNewUserGuide: function () {
    wx.showModal({
      title: '欢迎使用宠物成长日记',
      content: '记录宠物的每一个成长瞬间，不错过它们的健康与快乐！\n\n您可以在"我的"页面完善个人资料。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 原有显示错误：保留
  showError: function (message, autoRetry = false) {
    wx.showModal({
      title: '提示',
      content: message,
      showCancel: false,
      confirmText: '知道了',
      success: (res) => {
        if (res.confirm && autoRetry) {
          this.login();
        }
      }
    });
  },

  // ===================== 新增/优化方法 =====================
  /**
   * 新增：获取有效 Token（兜底校验）
   * @returns {string|null} 有效 Token 或 null
   */
  getValidToken: function () {
    let token = this.globalData.token;
    // 内存中无 Token，从本地缓存读取并同步
    if (!token) {
      token = wx.getStorageSync('token');
      if (token) {
        this.globalData.token = token; // 同步到内存
      }
    }
    return token;
  },

  /**
   * 新增：退出登录（清除 Token/用户信息）
   * @param {boolean} isRedirect - 是否跳转登录页（默认true）
   */
  logout: function (isRedirect = true) {
    // 清除本地缓存
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    // 清除全局数据
    this.globalData.token = null;
    this.globalData.userInfo = null;
    // 跳转登录页（可选）
    if (isRedirect) {
      wx.reLaunch({ url: '/pages/login/login' });
    }
    wx.showToast({ title: '退出登录成功', icon: 'success' });
    console.log('用户已退出登录');
  },

  /**
   * 新增：处理 Token 失效（401 统一拦截）
   */
  handleTokenInvalid: function () {
    console.log('Token 失效，清理并跳转登录');
    this.logout(true); // 清除 Token 并跳转登录页
    wx.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 });
  },

  /**
   * 新增：通用请求封装（自动带 Token，统一处理 401）
   * @param {Object} options - 请求参数（url/method/data 等）
   * @returns {Promise}
   */
  request: function (options) {
    const that = this;
    const token = this.getValidToken();
    // 拼接完整 URL
    options.url = options.url.startsWith('http') ? options.url : `${this.globalData.baseURL}${options.url}`;
    // 统一设置请求头
    options.header = {
      'Content-Type': options.header?.['Content-Type'] || 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // 有 Token 才加
      ...options.header // 允许覆盖自定义头
    };

    return new Promise((resolve, reject) => {
      wx.request({
        ...options,
        success: (res) => {
          // 统一拦截 401（Token 失效）
          if (res.statusCode === 401) {
            that.handleTokenInvalid();
            reject(new Error('登录已过期'));
            return;
          }
          resolve(res);
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(err);
        }
      });
    });
  }
});