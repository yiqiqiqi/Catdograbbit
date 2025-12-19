// pages/lucky-draw/lucky-draw.js
const { post } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    lotteryTickets: 0, // 抽奖券数量
    isSpinning: false,
    rotation: 0,
    showPrizeModal: false,
    wonPrize: {},
    // 8个奖品（基于消费者心理学优化的配置）
    prizes: [
      { id: 1, name: '猫砂免单券', icon: '🎁', probability: 0.01 },
      { id: 2, name: '20积分', icon: '💝', probability: 0.20 },
      { id: 3, name: '宠物机器人', icon: '🤖', probability: 0.0001 },
      { id: 4, name: '猫砂8折券', icon: '🎫', probability: 0.18 },
      { id: 5, name: '50积分', icon: '⭐', probability: 0.20 },
      { id: 6, name: '30积分', icon: '💎', probability: 0.30 },
      { id: 7, name: '猫砂7折券', icon: '🏷️', probability: 0.08 },
      { id: 8, name: '猫砂半价券', icon: '🎟️', probability: 0.03 }
    ]
  },

  onLoad(options) {
    this.loadUserPoints();
  },

  onShow() {
    // 页面显示时刷新抽奖券数量
    this.loadUserPoints();
  },

  // 加载用户抽奖券数量
  loadUserPoints() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({
      lotteryTickets: userInfo.lotteryTickets || 0
    });
  },

  // 开始抽奖
  handleDraw() {
    const { lotteryTickets, isSpinning } = this.data;

    // 防止重复点击
    if (isSpinning) return;

    // 检查抽奖券
    if (lotteryTickets < 1) {
      wx.showModal({
        title: '抽奖券不足',
        content: '您还没有抽奖券，快去积分中心兑换吧！',
        showCancel: true,
        confirmText: '去兑换',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/points-center/points-center'
            });
          }
        }
      });
      return;
    }

    // 开始抽奖
    this.setData({ isSpinning: true });

    wx.showLoading({ title: '抽奖中...', mask: true });

    // 调用抽奖接口
    post('/lottery/draw', {})
      .then(res => {
        wx.hideLoading();

        // 获取中奖信息
        const { prizeId, prizeName, prizeIcon, remainTickets } = res;

        // 找到中奖的奖品索引
        const prizeIndex = this.data.prizes.findIndex(p => p.id === prizeId);
        const targetIndex = prizeIndex !== -1 ? prizeIndex : 0;

        // 计算转盘旋转角度（转5圈 + 目标角度）
        const baseRotation = 360 * 5; // 先转5圈
        const targetAngle = 360 - (targetIndex * 45) - 22.5; // 指向目标扇区中心
        const finalRotation = baseRotation + targetAngle;

        // 更新抽奖券和积分
        this.setData({
          lotteryTickets: remainTickets !== undefined ? remainTickets : (this.data.lotteryTickets - 1),
          rotation: finalRotation,
          wonPrize: {
            id: prizeId,
            name: prizeName,
            icon: prizeIcon || this.data.prizes[targetIndex]?.icon || '🎁'
          }
        });

        // 更新全局数据
        const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
        userInfo.lotteryTickets = remainTickets !== undefined ? remainTickets : (userInfo.lotteryTickets - 1);

        // 如果中奖是积分，更新积分数
        if (prizeName.includes('积分')) {
          const pointsMatch = prizeName.match(/\d+/);
          if (pointsMatch) {
            const points = parseInt(pointsMatch[0]);
            userInfo.points = (userInfo.points || 0) + points;
          }
        }

        app.globalData.userInfo = userInfo;
        wx.setStorageSync('userInfo', userInfo);

        // 4秒后显示中奖弹窗
        setTimeout(() => {
          this.setData({
            isSpinning: false,
            showPrizeModal: true
          });

          // 震动反馈
          wx.vibrateShort();
        }, 4000);
      })
      .catch(err => {
        wx.hideLoading();
        this.setData({ isSpinning: false });

        const errorMsg = err.message || '抽奖失败';
        let content = errorMsg;

        if (errorMsg.includes('抽奖券') || errorMsg.includes('券不足')) {
          content = '抽奖券不足，请先兑换抽奖券';
        } else if (errorMsg.includes('次数')) {
          content = '今日抽奖次数已达上限';
        }

        wx.showModal({
          title: '抽奖失败',
          content,
          showCancel: false
        });
      });
  },

  // 关闭中奖弹窗
  closePrizeModal() {
    this.setData({ showPrizeModal: false });
  },

  // 阻止事件冒泡
  preventClose() {
    // 空函数，阻止点击modal-card时关闭弹窗
  },

  // 前往我的奖品
  goToMyPrizes() {
    wx.navigateTo({
      url: '/pages/my-prizes/my-prizes'
    });
  },

  // 显示抽奖规则
  showRules() {
    wx.showModal({
      title: '抽奖规则',
      content: '1. 每次抽奖消耗1张抽奖券\n2. 抽奖券可在积分中心兑换\n3. 中奖后奖品将存入"我的奖品"\n4. 优惠券有效期30天，请及时使用\n5. 宠物机器人为展示奖品',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
