// pages/points-center/points-center.js
const { get, post } = require('../../utils/request');
const { relativeTime } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    userPoints: 0,
    userLevel: 1,
    monthlyPoints: 0,
    lotteryTickets: 0,
    filterType: 'all', // all-全部 income-收入 expense-支出
    historyList: [],
    loading: false,
    page: 1,
    pageSize: 20,
    hasMore: true,
    // 兑换商品配置
    exchangeProducts: [
      { id: 1, name: '猫砂免单券', pointsCost: 1000, type: 'coupon' },
      { id: 2, name: '抽奖券×1', pointsCost: 100, type: 'ticket', count: 1 },
      { id: 3, name: '抽奖券×10', pointsCost: 900, type: 'ticket', count: 10 }
    ]
  },

  onLoad(options) {
    this.loadUserData();
    this.loadPointsHistory();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadUserData();
  },

  // 加载用户数据
  loadUserData() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};

    // 设置用户积分和等级
    this.setData({
      userPoints: userInfo.points || 0,
      userLevel: this.calculateLevel(userInfo.points || 0),
      lotteryTickets: userInfo.lotteryTickets || 0
    });

    // 获取本月累计积分（从接口获取，这里先模拟）
    this.getMonthlyPoints();
  },

  // 计算等级
  calculateLevel(points) {
    const levelConfig = [
      { min: 0, max: 100, level: 1 },
      { min: 100, max: 300, level: 2 },
      { min: 300, max: 600, level: 3 },
      { min: 600, max: 1000, level: 4 },
      { min: 1000, max: 2000, level: 5 },
      { min: 2000, max: Infinity, level: 6 }
    ];

    const config = levelConfig.find(c => points >= c.min && points < c.max);
    return config ? config.level : 1;
  },

  // 获取本月累计积分
  getMonthlyPoints() {
    // 这里应该调用接口获取，暂时模拟
    // get('/points/monthly').then(res => {
    //   this.setData({ monthlyPoints: res.monthlyPoints });
    // });

    // 模拟数据
    this.setData({ monthlyPoints: 500 });
  },

  // 加载积分明细
  loadPointsHistory() {
    const { filterType, page, pageSize } = this.data;

    this.setData({ loading: true });

    get('/points/history', { page, size: pageSize, type: filterType })
      .then(res => {
        const list = (res.list || []).map(item => ({
          ...item,
          time: relativeTime(item.time),
          icon: this.getHistoryIcon(item.reason, item.type)
        }));

        this.setData({
          historyList: page === 1 ? list : [...this.data.historyList, ...list],
          hasMore: list.length >= pageSize,
          loading: false
        });
      })
      .catch(err => {
        console.error('加载积分明细失败:', err);
        this.setData({ loading: false });

        // 加载失败时显示模拟数据
        this.loadMockHistory();
      });
  },

  // 加载模拟数据
  loadMockHistory() {
    const mockData = [
      { id: 1, type: 'income', amount: 50, reason: '兑换码', time: '2小时前', icon: '🎫' },
      { id: 2, type: 'expense', amount: 100, reason: '兑换抽奖券', time: '5小时前', icon: '🎰' },
      { id: 3, type: 'income', amount: 10, reason: '每日签到', time: '今天', icon: '📅' },
      { id: 4, type: 'income', amount: 30, reason: '抽奖获得', time: '昨天', icon: '🎁' },
      { id: 5, type: 'expense', amount: 1000, reason: '兑换免单券', time: '2天前', icon: '🎁' }
    ];

    this.setData({
      historyList: mockData,
      loading: false
    });
  },

  // 获取历史记录图标
  getHistoryIcon(reason, type) {
    const iconMap = {
      '兑换码': '🎫',
      '每日签到': '📅',
      '完成任务': '✅',
      '抽奖获得': '🎁',
      '兑换抽奖券': '🎰',
      '兑换免单券': '🎁',
      '兑换优惠券': '🏷️'
    };

    return iconMap[reason] || (type === 'income' ? '📥' : '📤');
  },

  // 切换筛选类型
  switchFilter(e) {
    const type = e.currentTarget.dataset.type;

    this.setData({
      filterType: type,
      page: 1,
      historyList: []
    });

    this.loadPointsHistory();
  },

  // 处理兑换
  handleExchange(e) {
    const productId = e.currentTarget.dataset.id;
    const product = this.data.exchangeProducts.find(p => p.id === productId);

    if (!product) return;

    // 检查积分是否足够
    if (this.data.userPoints < product.pointsCost) {
      wx.showModal({
        title: '积分不足',
        content: `兑换${product.name}需要${product.pointsCost}积分，您当前积分：${this.data.userPoints}`,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }

    // 确认兑换
    wx.showModal({
      title: '确认兑换',
      content: `消耗${product.pointsCost}积分兑换${product.name}？`,
      success: (res) => {
        if (res.confirm) {
          this.doExchange(product);
        }
      }
    });
  },

  // 执行兑换
  doExchange(product) {
    wx.showLoading({ title: '兑换中...', mask: true });

    post('/exchange/redeem', { productId: product.id })
      .then(res => {
        wx.hideLoading();

        // 更新本地数据
        const newPoints = res.remainPoints || (this.data.userPoints - product.pointsCost);
        const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
        userInfo.points = newPoints;

        // 如果兑换的是抽奖券，更新抽奖券数量
        if (product.type === 'ticket') {
          userInfo.lotteryTickets = (userInfo.lotteryTickets || 0) + product.count;
          this.setData({ lotteryTickets: userInfo.lotteryTickets });
        }

        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);

        this.setData({
          userPoints: newPoints,
          userLevel: this.calculateLevel(newPoints)
        });

        // 刷新明细
        this.setData({ page: 1 });
        this.loadPointsHistory();

        // 成功提示
        let successMsg = `兑换成功！`;
        if (product.type === 'ticket') {
          successMsg = `兑换成功！获得${product.count}张抽奖券`;
        } else if (product.type === 'coupon') {
          successMsg = `兑换成功！优惠券已放入"我的奖品"`;
        }

        wx.showModal({
          title: '兑换成功',
          content: successMsg,
          showCancel: product.type !== 'ticket',
          confirmText: product.type === 'ticket' ? '去抽奖' : '查看奖品',
          cancelText: '知道了',
          success: (modalRes) => {
            if (modalRes.confirm) {
              if (product.type === 'ticket') {
                // 跳转到抽奖页面
                wx.navigateTo({
                  url: '/pages/lucky-draw/lucky-draw'
                });
              } else {
                // 跳转到我的奖品
                wx.navigateTo({
                  url: '/pages/my-prizes/my-prizes'
                });
              }
            }
          }
        });
      })
      .catch(err => {
        wx.hideLoading();

        wx.showModal({
          title: '兑换失败',
          content: err.message || '兑换失败，请稍后重试',
          showCancel: false
        });
      });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadUserData();
    this.loadPointsHistory();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return;

    this.setData({ page: this.data.page + 1 });
    this.loadPointsHistory();
  }
});
