// pages/lucky-draw/lucky-draw.js
const { post } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    userPoints: 0,
    costPoints: 100, // 每次抽奖消耗积分
    isSpinning: false,
    rotation: 0,
    showPrizeModal: false,
    wonPrize: {},
    // 8个奖品（后端返回，这里是默认配置）
    prizes: [
      { id: 1, name: '猫砂免单', icon: '🎁', probability: 0.01 },
      { id: 2, name: '谢谢参与', icon: '💝', probability: 0.5 },
      { id: 3, name: '宠物机器人', icon: '🤖', probability: 0.005 },
      { id: 4, name: '10元优惠券', icon: '🎫', probability: 0.2 },
      { id: 5, name: '50积分', icon: '⭐', probability: 0.15 },
      { id: 6, name: '谢谢参与', icon: '💝', probability: 0.1 },
      { id: 7, name: '20元优惠券', icon: '🎟️', probability: 0.03 },
      { id: 8, name: '5元优惠券', icon: '🏷️', probability: 0.005 }
    ]
  },

  onLoad(options) {
    this.loadUserPoints();
  },

  onShow() {
    // 页面显示时刷新积分
    this.loadUserPoints();
  },

  // 加载用户积分
  loadUserPoints() {
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    this.setData({
      userPoints: userInfo.points || 0
    });
  },

  // 开始抽奖
  handleDraw() {
    const { userPoints, costPoints, isSpinning } = this.data;

    // 防止重复点击
    if (isSpinning) return;

    // 检查积分
    if (userPoints < costPoints) {
      wx.showModal({
        title: '积分不足',
        content: '您的积分不足，快去完成任务或兑换积分吧！',
        showCancel: true,
        confirmText: '去兑换',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/redeem-code/redeem-code'
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
        const { prizeId, prizeName, prizeIcon, remainPoints } = res;

        // 找到中奖的奖品索引
        const prizeIndex = this.data.prizes.findIndex(p => p.id === prizeId);
        const targetIndex = prizeIndex !== -1 ? prizeIndex : 0;

        // 计算转盘旋转角度（转3圈 + 目标角度）
        const baseRotation = 360 * 5; // 先转5圈
        const targetAngle = 360 - (targetIndex * 45) - 22.5; // 指向目标扇区中心
        const finalRotation = baseRotation + targetAngle;

        // 更新积分
        this.setData({
          userPoints: remainPoints,
          rotation: finalRotation,
          wonPrize: {
            id: prizeId,
            name: prizeName,
            icon: prizeIcon || this.data.prizes[targetIndex]?.icon || '🎁'
          }
        });

        // 更新全局积分
        const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
        userInfo.points = remainPoints;
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

        if (errorMsg.includes('积分不足')) {
          content = '积分不足，请先兑换积分';
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
      content: '1. 每次抽奖消耗100积分\n2. 每日最多可抽奖10次\n3. 中奖后奖品将存入"我的奖品"\n4. 奖品有效期30天，请及时使用',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});
