const app = getApp()
const { calculateOrderPoints } = require('../../utils/points.js')

Page({
  data: {
    platform: 'taobao',  // 默认淘宝
    orderNo: '',
    packages: 1,  // 默认1包
    isFirstOrder: false,  // 是否首单
    pointsInfo: {
      basePoints: 100,
      bonusPoints: 0,
      totalPoints: 100
    },
    submitting: false
  },

  onLoad() {
    this.checkFirstOrder()
    this.calculatePoints()
  },

  // 检查是否首单
  async checkFirstOrder() {
    try {
      const res = await app.request({
        url: '/orders/check-first-order',
        method: 'GET'
      })

      if (res.data.code === 0) {
        const isFirstOrder = res.data.data.isFirstOrder
        this.setData({ isFirstOrder })
        this.calculatePoints()
      }
    } catch (error) {
      console.error('检查首单状态失败:', error)
      // 默认不是首单
      this.setData({ isFirstOrder: false })
    }
  },

  // 选择平台
  onSelectPlatform(e) {
    const { platform } = e.currentTarget.dataset
    this.setData({ platform })
  },

  // 输入订单号
  onOrderNoInput(e) {
    this.setData({
      orderNo: e.detail.value.trim()
    })
  },

  // 选择包数
  onSelectPackages(e) {
    const packages = parseInt(e.currentTarget.dataset.packages)
    this.setData({ packages })
    this.calculatePoints()
  },

  // 计算积分
  calculatePoints() {
    const { packages, isFirstOrder } = this.data
    const pointsInfo = calculateOrderPoints(packages, isFirstOrder)
    this.setData({ pointsInfo })
  },

  // 提交兑换
  async onSubmit() {
    const { platform, orderNo, packages, submitting } = this.data

    if (submitting) return

    // 验证表单
    if (!orderNo) {
      wx.showToast({
        title: '请输入订单号',
        icon: 'none'
      })
      return
    }

    if (!packages) {
      wx.showToast({
        title: '请选择购买包数',
        icon: 'none'
      })
      return
    }

    // 确认对话框
    const confirmRes = await new Promise((resolve) => {
      wx.showModal({
        title: '确认提交',
        content: `您将兑换${this.data.pointsInfo.totalPoints}积分，是否确认提交？`,
        success: resolve
      })
    })

    if (!confirmRes.confirm) return

    // 提交兑换请求
    this.setData({ submitting: true })

    try {
      const res = await app.request({
        url: '/orders/exchange-points',
        method: 'POST',
        data: {
          platform,
          orderNo,
          packages
        }
      })

      if (res.data.code === 0) {
        const result = res.data.data

        wx.showModal({
          title: '提交成功',
          content: `您的订单已提交审核，预计获得${result.estimatedPoints}积分。审核通过后积分将自动到账。`,
          showCancel: false,
          success: () => {
            // 返回上一页
            wx.navigateBack()

            // 触发积分刷新事件
            app.emit('pointsChange', {
              reason: '订单兑换提交'
            })
          }
        })
      } else {
        throw new Error(res.data.message || '提交失败')
      }
    } catch (error) {
      console.error('提交订单兑换失败:', error)

      wx.showModal({
        title: '提交失败',
        content: error.message || '提交失败，请稍后重试',
        showCancel: false
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 查看兑换记录
  onHistoryTap() {
    wx.navigateTo({
      url: '/pages/exchange-history/exchange-history'
    })
  }
})
