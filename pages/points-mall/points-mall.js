// pages/points-mall/points-mall.js
const { get, post } = require('../../utils/request');
const { getLevelInfo } = require('../../utils/points');
const app = getApp();

Page({
  data: {
    userPoints: 0,
    userLevel: 1,
    accessLevel: false, // 是否有兑换权限
    loading: false,
    products: [
      {
        id: 1,
        name: '1包猫砂券',
        packageSize: 1,
        pointsCost: 300,
        icon: '📦'
      },
      {
        id: 2,
        name: '2包猫砂券',
        packageSize: 2,
        pointsCost: 550,
        icon: '📦'
      },
      {
        id: 3,
        name: '4包猫砂券',
        packageSize: 4,
        pointsCost: 1000,
        icon: '📦'
      }
    ]
  },

  onLoad(options) {
    this.loadUserData();

    // 监听积分变化事件
    app.on('pointsChange', this.handlePointsChange.bind(this));
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData();
  },

  onUnload() {
    // 页面卸载时移除事件监听
    app.off('pointsChange', this.handlePointsChange);
  },

  // 处理积分变化事件
  handlePointsChange(data) {
    console.log('积分商城收到积分变化通知:', data);
    this.setData({
      userPoints: data.points,
      userLevel: data.level
    });
    this.checkAccessLevel();
  },

  // 加载用户数据
  loadUserData() {
    this.setData({ loading: true });

    // 从app或本地存储获取用户信息
    try {
      const userInfo = wx.getStorageSync('userInfo') || {};
      const pointsData = wx.getStorageSync('pointsData') || { points: 0, level: 1 };

      this.setData({
        userPoints: pointsData.points || 0,
        userLevel: pointsData.level || 1,
        loading: false
      });

      this.checkAccessLevel();
    } catch (error) {
      console.error('加载用户数据失败:', error);
      this.setData({ loading: false });
    }
  },

  // 检查兑换权限（等级2以上）
  checkAccessLevel() {
    const hasAccess = this.data.userLevel >= 2;
    this.setData({ accessLevel: hasAccess });
  },

  // 选择商品
  selectProduct(e) {
    const product = e.currentTarget.dataset.product;
    console.log('选中商品:', product);

    if (!this.data.accessLevel) {
      wx.showToast({
        title: '等级不足，无法兑换',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  },

  // 处理兑换
  handleExchange(e) {
    e.stopPropagation();

    const product = e.currentTarget.dataset.product;

    // 检查权限
    if (!this.data.accessLevel) {
      wx.showToast({
        title: '需要Lv.2以上等级',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 检查积分是否足够
    if (this.data.userPoints < product.pointsCost) {
      wx.showToast({
        title: '积分不足',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 显示确认对话框
    wx.showModal({
      title: '确认兑换',
      content: `是否确认兑换"${product.name}"？需要${product.pointsCost}积分`,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmExchange(product);
        }
      }
    });
  },

  // 确认兑换
  confirmExchange(product) {
    // 这里会调用后端API进行兑换
    // 暂时模拟处理
    wx.showLoading({
      title: '兑换中...',
      mask: true
    });

    setTimeout(() => {
      wx.hideLoading();

      // 更新本地积分
      const newPoints = this.data.userPoints - product.pointsCost;
      wx.setStorageSync('pointsData', {
        points: newPoints,
        level: this.data.userLevel
      });

      this.setData({
        userPoints: newPoints
      });

      // 显示成功提示
      wx.showToast({
        title: '兑换成功！',
        icon: 'success',
        duration: 2000
      });

      // 触发积分更新事件
      app.emit('pointsChange', {
        points: newPoints,
        level: this.data.userLevel
      });

      // 可选：跳转到兑换记录页面
      setTimeout(() => {
        wx.navigateTo({
          url: '/pages/order-exchange/order-exchange'
        });
      }, 1500);
    }, 1200);
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserData();
    wx.stopPullDownRefresh();
  }
});
