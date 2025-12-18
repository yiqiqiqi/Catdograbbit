// pages/redeem-code/redeem-code.js
const { post } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    redeemCode: '',
    isRedeeming: false
  },

  onLoad(options) {
    // 页面加载
  },

  // 输入兑换码
  onCodeInput(e) {
    this.setData({
      redeemCode: e.detail.value.toUpperCase().trim()
    });
  },

  // 处理兑换
  handleRedeem() {
    const { redeemCode, isRedeeming } = this.data;

    // 防止重复点击
    if (isRedeeming) return;

    // 验证兑换码
    if (!redeemCode) {
      wx.showToast({
        title: '请输入兑换码',
        icon: 'none'
      });
      return;
    }

    if (redeemCode.length < 6) {
      wx.showToast({
        title: '兑换码格式不正确',
        icon: 'none'
      });
      return;
    }

    this.setData({ isRedeeming: true });

    // 调用兑换接口
    post('/redeem/verify', { code: redeemCode })
      .then(res => {
        // 兑换成功
        wx.showModal({
          title: '兑换成功！',
          content: `恭喜您获得 ${res.points} 积分\n当前总积分：${res.totalPoints}`,
          showCancel: false,
          confirmText: '太棒了',
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 更新全局积分数据
              const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
              userInfo.points = res.totalPoints;
              app.globalData.userInfo = userInfo;
              wx.setStorageSync('userInfo', userInfo);

              // 清空输入框
              this.setData({ redeemCode: '' });

              // 可选：返回上一页
              // wx.navigateBack();
            }
          }
        });
      })
      .catch(err => {
        // 兑换失败
        const errorMsg = err.message || '兑换失败';
        let title = '兑换失败';
        let content = errorMsg;

        // 根据错误类型提供友好提示
        if (errorMsg.includes('不存在')) {
          content = '兑换码不存在，请检查后重试';
        } else if (errorMsg.includes('已使用')) {
          content = '该兑换码已被使用';
        } else if (errorMsg.includes('已过期')) {
          content = '兑换码已过期';
        }

        wx.showModal({
          title,
          content,
          showCancel: false,
          confirmText: '知道了'
        });
      })
      .finally(() => {
        this.setData({ isRedeeming: false });
      });
  },

  // 查看兑换记录（可选功能）
  goToHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
    // 可以后续扩展兑换记录页面
    // wx.navigateTo({
    //   url: '/pages/redeem-history/redeem-history'
    // });
  }
});
