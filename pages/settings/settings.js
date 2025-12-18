Page({
  /**
   * 点击“个人信息”：跳转到个人信息编辑页
   * （需提前创建个人信息页：pages/profile/profile）
   */
  goToProfile() {
    wx.navigateTo({
      url: '/pages/profile/profile', // 个人信息页路径，根据实际项目调整
      fail: () => {
        wx.showToast({ title: '页面不存在', icon: 'none' });
      }
    });
  },

  /**
   * 点击“用户协议”：跳转到协议页面
   * （复用之前创建的协议页面：pages/agreement/agreement）
   */
  viewUserAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement?type=user', // 传type区分协议类型（可选）
    });
  },

  /**
   * 点击“隐私政策”：跳转到隐私页面
   * （复用之前创建的隐私页面：pages/privacy/privacy）
   */
  viewPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy',
    });
  },

  /**
   * 点击“第三方SDK说明”：跳转到SDK说明页
   * （需创建SDK说明页：pages/sdk-info/sdk-info）
   */
  viewSDKInfo() {
    wx.navigateTo({
      url: '/pages/sdk-info/sdk-info',
      fail: () => {
        wx.showToast({ title: 'SDK说明页未创建', icon: 'none' });
      }
    });
  },

  /**
   * 点击“退出登录”：清除缓存+确认弹窗+跳转首页/登录页
   */
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录才能使用功能',
      cancelText: '取消',
      confirmText: '退出',
      confirmColor: '#e63946', // 确认按钮红色，突出操作
      success: (res) => {
        if (res.confirm) {
          // 1. 清除本地登录缓存（和主页面登录缓存key保持一致）
          wx.removeStorageSync('userLoginInfo');
          // 2. 跳转首页（或登录页，根据项目需求调整）
          wx.reLaunch({
            url: '/pages/index/index', // 首页路径，根据实际项目调整
          });
          // 3. 提示退出成功
          wx.showToast({ title: '已退出登录' });
        }
      }
    });
  },

  /**
   * 点击“注销账号”：二次确认（高危操作）+ 清除缓存+跳转登录页
   */
  deleteAccount() {
    wx.showModal({
      title: '警告',
      content: '注销账号后，所有数据（积分、订单等）将永久删除，无法恢复！',
      cancelText: '取消',
      confirmText: '确认注销',
      confirmColor: '#e63946',
      success: (res) => {
        if (res.confirm) {
          // 二次确认：进一步降低误操作风险
          wx.showModal({
            title: '最后确认',
            content: '确定要注销账号吗？此操作不可撤销！',
            cancelText: '取消',
            confirmText: '确定注销',
            confirmColor: '#e63946',
            success: (secondRes) => {
              if (secondRes.confirm) {
                // 1. 调用后端注销接口（实际项目需补充）
                // wx.request({ url: 'xxx/deleteAccount', ... })
                // 2. 清除所有本地缓存
                wx.clearStorageSync();
                // 3. 跳转登录页（强制重新注册/登录）
                wx.reLaunch({
                  url: '/pages/login/login', // 登录页路径，根据实际项目调整
                });
                // 4. 提示注销成功
                wx.showToast({ title: '账号已注销', icon: 'none' });
              }
            }
          });
        }
      }
    });
  }
});