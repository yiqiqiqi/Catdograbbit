const app = getApp()
const { getLevelInfo, getLevelByPoints } = require('../../utils/points.js')

Page({
  data: {
    userPoints: {
      available: 0,
      total: 0,
      monthly: 0
    },
    userLevel: {
      level: 1,
      name: '新手铲屎官'
    },
    levelList: [
      { level: 1, name: 'Lv1 新手铲屎官', requirement: '0积分', privilege: '不可兑换' },
      { level: 2, name: 'Lv2 稳定使用者', requirement: '≥300积分', privilege: '可兑换1包' },
      { level: 3, name: 'Lv3 长期陪伴官', requirement: '≥800积分', privilege: '可兑换1-2包' },
      { level: 4, name: 'Lv4 家庭号用户', requirement: '≥2000积分', privilege: '解锁全部兑换' },
      { level: 5, name: 'Lv5 终身铲屎官', requirement: '≥4000积分', privilege: '专属兑换门槛' }
    ]
  },

  onLoad() {
    this.loadUserPoints()
  },

  onShow() {
    // 每次显示时刷新积分数据
    this.loadUserPoints()

    // 监听积分变化事件
    app.on('pointsChange', this.handlePointsChange.bind(this))
  },

  onHide() {
    // 移除监听
    app.off('pointsChange', this.handlePointsChange)
  },

  // 加载用户积分数据
  async loadUserPoints() {
    try {
      const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {}

      // 从用户信息获取积分数据
      const points = {
        available: userInfo.points || 0,
        total: userInfo.totalPoints || 0,
        monthly: userInfo.monthlyPoints || 0
      }

      // 计算等级
      const levelInfo = getLevelInfo(points.total)

      this.setData({
        userPoints: points,
        userLevel: levelInfo
      })

      // 同时从服务器获取最新数据
      this.fetchPointsFromServer()
    } catch (error) {
      console.error('加载积分数据失败:', error)
    }
  },

  // 从服务器获取积分数据
  async fetchPointsFromServer() {
    try {
      const res = await app.request({
        url: '/points/summary',
        method: 'GET'
      })

      if (res.data.code === 0) {
        const data = res.data.data
        const points = {
          available: data.availablePoints || 0,
          total: data.totalPoints || 0,
          monthly: data.monthlyPoints || 0
        }

        // 计算等级
        const levelInfo = getLevelInfo(points.total)

        this.setData({
          userPoints: points,
          userLevel: levelInfo
        })

        // 更新全局用户信息
        const userInfo = app.globalData.userInfo || {}
        userInfo.points = points.available
        userInfo.totalPoints = points.total
        userInfo.monthlyPoints = points.monthly
        app.globalData.userInfo = userInfo
        wx.setStorageSync('userInfo', userInfo)
      }
    } catch (error) {
      console.error('从服务器获取积分数据失败:', error)
    }
  },

  // 处理积分变化事件
  handlePointsChange(data) {
    this.loadUserPoints()
  },

  // 点击订单兑换
  onOrderExchangeTap() {
    wx.navigateTo({
      url: '/pages/order-exchange/order-exchange'
    })
  },

  // 点击积分商城
  onPointsMallTap() {
    wx.navigateTo({
      url: '/pages/points-mall/points-mall'
    })
  },

  // 查看积分明细
  onHistoryTap() {
    wx.navigateTo({
      url: '/pages/points-center/points-center'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadUserPoints().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: '喵汪兔积分商城 - 订单兑换积分赢好礼',
      path: '/pages/points/points'
    }
  }
})
