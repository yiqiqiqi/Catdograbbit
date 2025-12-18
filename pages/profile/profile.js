const app = getApp();

Page({
  data: {
    userInfo: {},
    userId: '',
    hasUserInfo: false,
    hasUnfinishedTask: true, // 控制任务小红点显示（可根据接口调整）
    // 新增：积分等级相关字段
    userLevel: 1, // 用户等级（默认L1）
    progressStep: 0, // 进度条步长（对应CSS的progress-fill--xx）
    currentLevelMin: 0, // 当前等级最低积分
    currentLevelMax: 100, // 当前等级最高积分
    needPoints: 0 // 新增：升级所需积分
  },

  onLoad: function (options) {
    this.loadUserInfo();
    // 检查未完成任务（实际项目中从接口获取，这里默认true）
    this.checkUnfinishedTask();
  },

  onShow: function () {
    // 页面显示时重新加载用户信息，确保资料更新后能及时显示
    this.loadUserInfo();
    // 刷新任务状态
    this.checkUnfinishedTask();
  },

  // 加载用户信息（保留原有逻辑，新增等级计算）
  loadUserInfo: function () {
    let userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
        userInfo = {
            ...userInfo,
            avatarUrl: app.globalData.domain + userInfo.avatarUrl
        };
    const userId = app.globalData.userInfo?.userId || wx.getStorageSync('userId') || '';
    const hasUserInfo = !!(userInfo.userId);
    const points = 50; // 获取用户积分
    // 新增：等级规则配置（可根据业务需求调整）
    const levelConfig = [
      { min: 0, max: 100, level: 1 },
      { min: 100, max: 300, level: 2 },
      { min: 300, max: 600, level: 3 },
      { min: 600, max: 1000, level: 4 },
      { min: 1000, max: 2000, level: 5 },
      { min: 2000, max: Infinity, level: 6 } // 最高等级（无上限）
    ];
    const currentConfig = levelConfig.filter(c => points >= c.min).at(-1) || levelConfig[0];
    const { level: currentLevel, min: currentMin, max: currentMax } = currentConfig;
    const progress = currentMax === Infinity ? 100 : Math.min(100, Math.round(((points - currentMin) / (currentMax - currentMin)) * 100));
    const progressStep = Math.round(progress / 10) * 10;
    const needPoints = currentMax === Infinity ? 0 : currentMax - points;
    // 保留原有更新逻辑，追加等级相关字段
    this.setData({
      userInfo: userInfo,
      userId: userId,
      hasUserInfo: hasUserInfo,
      // 新增：等级相关数据
      userLevel: currentLevel,
      progressStep: progressStep,
      currentLevelMin: currentMin,
      currentLevelMax: currentMax === Infinity ? '∞' : currentMax,
      needPoints: needPoints // 新增：升级所需积分
    });
  },

  // 更新资料 - 跳转到完善资料页面（原有逻辑不变）
  updateProfile: function () {
    if (!this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    if (!app.globalData.token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/updateProfile/updateProfile'
    });
  },

  // 新增：前往兑换码页面
  goToRedeemCode: function () {
    if (!this.checkLogin()) return;

    wx.navigateTo({
      url: '/pages/redeem-code/redeem-code'
    });
  },

  // 新增：前往抽奖页面
  goToLuckyDraw: function () {
    if (!this.checkLogin()) return;

    wx.navigateTo({
      url: '/pages/lucky-draw/lucky-draw'
    });
  },

  // 新增：导航到每日任务
  navigateToDailyTask: function () {
    if (!this.checkLogin()) return;

    wx.navigateTo({
      url: '/pages/daily-task/daily-task'
    });
  },

  // 新增：导航到积分中心
  navigateToPointsCenter: function () {
    if (!this.checkLogin()) return;

    wx.navigateTo({
      url: '/pages/points-center/points-center'
    });
  },

  // 显示关于我们
  showAbout: function () {
    wx.showModal({
      title: '关于我们',
      content: '一个懂你的宠物生活伙伴平台。',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 联系客服
  contactUs: function () {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },

  // 退出登录
  logout: function () {
    const that = this;

    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success:function(res){
        app.logout();
      }
    });
  },

  // 检查登录状态
  checkLogin: function () {
    if (!app.globalData.token || !this.data.hasUserInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });

      // 跳转到登录页面
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }, 1500);

      return false;
    }
    return true;
  },

  // 新增：检查未完成任务
  checkUnfinishedTask: function () {
    if (!this.data.hasUserInfo) {
      this.setData({ hasUnfinishedTask: false });
      return;
    }

    // 模拟接口请求：判断是否有未完成的分享/签到任务
    setTimeout(() => {
      // 这里可根据userInfo中的任务状态字段调整，示例默认true
      this.setData({ hasUnfinishedTask: true });
    }, 500);
  }
});