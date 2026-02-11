// pages/my/my.js
const { get, post } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    userInfo: {
      avatar: '',
      nickname: '',
      phone: ''
    },
    userLevel: 1,
    userPoints: 0,
    companionDays: 0,
    levelName: '初级饲养员',
    petList: [],
    totalPhotos: 0,
    totalRecords: 0,
    totalExchanges: 0
  },

  onLoad(options) {
    this.loadUserData();
    this.loadStatistics();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData();
    this.loadStatistics();
  },

  // 加载用户数据
  loadUserData() {
    try {
      const userInfo = wx.getStorageSync('userInfo') || {
        avatar: 'https://via.placeholder.com/80?text=Avatar',
        nickname: '用户昵称',
        phone: '18800000000'
      };

      const pointsData = wx.getStorageSync('pointsData') || {
        points: 0,
        level: 1
      };

      const petList = wx.getStorageSync('petList') || [];

      const createdAt = wx.getStorageSync('userCreatedAt') || new Date().getTime();
      const companionDays = Math.floor((new Date().getTime() - createdAt) / (24 * 60 * 60 * 1000));

      const levelName = this.getLevelName(pointsData.level);

      this.setData({
        userInfo,
        userLevel: pointsData.level,
        userPoints: pointsData.points,
        companionDays: Math.max(companionDays, 1),
        levelName,
        petList
      });
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  },

  // 获取等级名称
  getLevelName(level) {
    const levelNames = {
      1: '初级饲养员',
      2: '中级饲养员',
      3: '高级饲养员',
      4: '专业饲养员',
      5: '传奇饲养员'
    };
    return levelNames[level] || '初级饲养员';
  },

  // 加载统计数据
  loadStatistics() {
    try {
      // 获取上传照片总数
      const allPhotos = wx.getStorageSync('photoCards') || [];
      const totalPhotos = allPhotos.length;

      // 获取成长记录总数
      const growthRecords = wx.getStorageSync('growthRecords') || {};
      let totalRecords = 0;
      Object.keys(growthRecords).forEach(petId => {
        totalRecords += (growthRecords[petId] || []).length;
      });

      // 获取兑换记录总数
      const exchangeRecords = wx.getStorageSync('exchangeRecords') || [];
      const totalExchanges = exchangeRecords.length;

      this.setData({
        totalPhotos,
        totalRecords,
        totalExchanges
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  // 编辑个人资料
  editProfile() {
    wx.navigateTo({
      url: '/pages/user-profile/user-profile'
    });
  },

  // 添加宠物
  addPet() {
    wx.navigateTo({
      url: '/pages/pet-edit/pet-edit'
    });
  },

  // 查看宠物详情
  viewPetDetail(e) {
    const petId = e.currentTarget.dataset.petId;
    wx.navigateTo({
      url: `/pages/pet-info-collect/pet-info-collect?petId=${petId}`
    });
  },

  // 跳转兑换记录
  goToExchangeRecords() {
    wx.navigateTo({
      url: '/pages/order-exchange/order-exchange'
    });
  },

  // 跳转积分商城
  goToPointsMall() {
    wx.navigateTo({
      url: '/pages/points-mall/points-mall'
    });
  },

  // 跳转积分中心
  goToPointsCenter() {
    wx.navigateTo({
      url: '/pages/points-center/points-center'
    });
  },

  // 跳转设置
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 头像加载错误
  onAvatarError() {
    this.setData({
      'userInfo.avatar': 'https://via.placeholder.com/80?text=Avatar'
    });
  },

  // 宠物头像加载错误
  onPetAvatarError(e) {
    console.log('宠物头像加载失败');
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确认要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmLogout();
        }
      }
    });
  },

  // 确认退出
  confirmLogout() {
    try {
      // 清除本地用户数据
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('pointsData');
      wx.removeStorageSync('userCreatedAt');
      wx.removeStorageSync('token');

      wx.showToast({
        title: '已退出登录',
        icon: 'success'
      });

      // 跳转到登录页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        });
      }, 1500);
    } catch (error) {
      console.error('退出登录失败:', error);
      wx.showToast({
        title: '退出失败',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserData();
    this.loadStatistics();
    wx.stopPullDownRefresh();
  }
});
