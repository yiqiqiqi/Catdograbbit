const app = getApp();

Page({
  goToProfile() {
    wx.navigateTo({
      url: '/pages/updateProfile/updateProfile'
    });
  },

  viewUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '欢迎使用喵汪兔小程序。我们致力于为宠物主人提供优质的服务体验。使用本小程序即表示您同意我们的用户协议条款。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  viewPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '喵汪兔小程序尊重并保护您的个人隐私。我们仅收集提供服务所必需的信息，不会将您的信息出售给第三方。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录才能使用功能',
      cancelText: '取消',
      confirmText: '退出',
      confirmColor: '#e63946',
      success: (res) => {
        if (res.confirm) {
          app.logout(true);
        }
      }
    });
  },

  deleteAccount() {
    wx.showModal({
      title: '警告',
      content: '注销账号后，所有数据（积分、订单等）将永久删除，无法恢复！',
      cancelText: '取消',
      confirmText: '确认注销',
      confirmColor: '#e63946',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '最后确认',
            content: '确定要注销账号吗？此操作不可撤销！',
            cancelText: '取消',
            confirmText: '确定注销',
            confirmColor: '#e63946',
            success: (secondRes) => {
              if (secondRes.confirm) {
                wx.clearStorageSync();
                app.globalData.token = null;
                app.globalData.userInfo = null;
                wx.reLaunch({
                  url: '/pages/login/login'
                });
                wx.showToast({ title: '账号已注销', icon: 'none' });
              }
            }
          });
        }
      }
    });
  }
});
