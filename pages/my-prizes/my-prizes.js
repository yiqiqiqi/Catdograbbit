// pages/my-prizes/my-prizes.js
const { get, post } = require('../../utils/request');
const { relativeTime } = require('../../utils/util');

Page({
  data: {
    loading: true,
    prizesList: [],
    showRedeemModal: false,
    redeemCode: '',
    currentPrize: {}
  },

  onLoad(options) {
    this.loadPrizesList();
  },

  onShow() {
    // 页面显示时刷新列表
    this.loadPrizesList();
  },

  // 加载奖品列表
  loadPrizesList() {
    this.setData({ loading: true });

    get('/prizes/my-list', { page: 1, size: 50 })
      .then(res => {
        // 处理时间格式
        const list = (res.list || []).map(item => ({
          ...item,
          winTime: this.formatTime(item.winTime),
          expireTime: this.formatExpireTime(item.expireTime),
          prizeIcon: item.prizeIcon || '🎁'
        }));

        this.setData({
          prizesList: list,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载奖品列表失败:', err);
        this.setData({ loading: false });

        wx.showToast({
          title: err.message || '加载失败',
          icon: 'none'
        });
      });
  },

  // 使用奖品
  usePrize(e) {
    const prizeId = e.currentTarget.dataset.id;
    const prize = this.data.prizesList.find(p => p.id === prizeId);

    if (!prize) return;

    wx.showModal({
      title: '使用奖品',
      content: `确定要使用【${prize.prizeName}】吗？`,
      success: (res) => {
        if (res.confirm) {
          this.generateRedeemCode(prizeId, prize);
        }
      }
    });
  },

  // 生成核销码
  generateRedeemCode(prizeId, prize) {
    wx.showLoading({ title: '生成中...', mask: true });

    post('/prizes/use', { prizeId })
      .then(res => {
        wx.hideLoading();

        // 显示核销码弹窗
        this.setData({
          showRedeemModal: true,
          redeemCode: res.redeemCode || 'MWT' + Date.now(),
          currentPrize: prize
        });

        // 刷新列表
        this.loadPrizesList();
      })
      .catch(err => {
        wx.hideLoading();

        wx.showModal({
          title: '生成失败',
          content: err.message || '核销码生成失败',
          showCancel: false
        });
      });
  },

  // 关闭核销码弹窗
  closeRedeemModal() {
    this.setData({ showRedeemModal: false });
  },

  // 阻止事件冒泡
  preventClose() {
    // 空函数
  },

  // 前往抽奖页面
  goToLottery() {
    wx.navigateTo({
      url: '/pages/lucky-draw/lucky-draw'
    });
  },

  // 格式化时间
  formatTime(timeStr) {
    if (!timeStr) return '';
    return relativeTime(timeStr);
  },

  // 格式化过期时间
  formatExpireTime(timeStr) {
    if (!timeStr) return '';

    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
});
