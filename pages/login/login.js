// pages/login/login.js
const app = getApp();

Page({
  data: {
    canIUseGetUserProfile: false,
    isAgree: false // 初始未勾选
  },

  onLoad() {
    // 1. 检查微信版本支持
    if (wx.getUserProfile) {
      this.setData({ canIUseGetUserProfile: true });
    }

    // 2. 修改登录回调，让新用户跳转到宠物信息收集页面
    app.setLoginSuccessCallback((userInfo, isNewUser) => {
      console.log('登录页回调触发，是否新用户:', isNewUser);
      if (isNewUser) {
        // 新用户：跳转到宠物信息收集页面
        wx.redirectTo({
          url: '/pages/pet-info-collect/pet-info-collect'
        });
        
        // 延迟展示欢迎信息
        setTimeout(() => {
          wx.showToast({
            title: '欢迎新用户！请完善宠物信息',
            icon: 'none',
            duration: 3000
          });
        }, 1000);
      } else {
        // 老用户：直接跳转到首页
        wx.reLaunch({
          url: '/pages/index/index',
          success: () => {
            app.showNewUserGuide();
          }
        });
      }
    });

    console.log('登录页加载完成，toggleAgree已就绪'); // 调试日志
  },

  /**
   * 终极修复：手动切换勾选状态（不依赖checkbox的bindchange）
   */
  toggleAgree() {
    // 手动切换isAgree状态
    const newAgreeState = !this.data.isAgree;
    this.setData({ isAgree: newAgreeState });
    
    // 强制打印日志（确保触发）
    console.log('=== toggleAgree触发 ===');
    console.log('当前勾选状态：', newAgreeState);
  },

  /**
   * 微信快捷登录（保留校验）
   */
  wxLogin() {
    console.log('点击登录按钮，当前勾选状态：', this.data.isAgree); // 调试日志
    if (!this.data.isAgree) {
      wx.showToast({
        title: '请先阅读并同意用户协议',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    app.login()
      .then(({ userInfo, isNewUser }) => {
        wx.hideLoading();
      })
      .catch((error) => {
        wx.hideLoading();
        console.log('登录失败:', error);
        wx.showToast({
          title: '登录失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 手机号登录（保留校验）
   */
  phoneLogin() {
    if (!this.data.isAgree) {
      wx.showToast({
        title: '请先阅读并同意用户协议',
        icon: 'none'
      });
      return;
    }
    wx.showModal({
      title: '提示',
      content: '手机号登录功能暂未开放，敬请期待',
      showCancel: false
    });
  },

  viewAgreement() {
    wx.navigateTo({ url: '/pages/login/agreement/agreement' });
  },

  onUnload() {
    app.setLoginSuccessCallback(null);
  }
});