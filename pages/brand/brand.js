const app = getApp()

Page({
  data: {
    // 轮播图数据（暂时使用占位图）
    banners: [
      {
        id: 1,
        imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="400"%3E%3Crect fill="%238b5cf6" width="750" height="400"/%3E%3Ctext fill="white" x="50%25" y="50%25" text-anchor="middle" font-size="40" dy=".3em"%3E喵汪兔品牌轮播图1%3C/text%3E%3C/svg%3E'
      },
      {
        id: 2,
        imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="400"%3E%3Crect fill="%23667eea" width="750" height="400"/%3E%3Ctext fill="white" x="50%25" y="50%25" text-anchor="middle" font-size="40" dy=".3em"%3E喵汪兔品牌轮播图2%3C/text%3E%3C/svg%3E'
      },
      {
        id: 3,
        imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="750" height="400"%3E%3Crect fill="%23764ba2" width="750" height="400"/%3E%3Ctext fill="white" x="50%25" y="50%25" text-anchor="middle" font-size="40" dy=".3em"%3E喵汪兔品牌轮播图3%3C/text%3E%3C/svg%3E'
      }
    ],

    // 品牌理念
    brandValues: [
      {
        id: 1,
        icon: '💚',
        title: '我们懂',
        description: '理解每一位铲屎官的需求'
      },
      {
        id: 2,
        icon: '🌱',
        title: '不说教',
        description: '陪伴而非指导'
      },
      {
        id: 3,
        icon: '🤝',
        title: '共成长',
        description: '与宠友一起进步'
      },
      {
        id: 4,
        icon: '✨',
        title: '高品质',
        description: '严选每一粒猫砂'
      }
    ],

    // 当前活动
    currentActivity: {
      id: 1,
      title: '新年福利活动 - 晒照赢好礼',
      coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="690" height="300"%3E%3Crect fill="%23f5f3ff" width="690" height="300"/%3E%3Ctext fill="%238b5cf6" x="50%25" y="50%25" text-anchor="middle" font-size="32" dy=".3em"%3E🎁 活动封面占位图%3C/text%3E%3C/svg%3E',
      startTime: '2024-01-01',
      endTime: '2024-01-31',
      linkType: 'miniprogram', // miniprogram, wechat, xiaohongshu
      linkUrl: ''
    },

    // 文章列表
    articles: [
      {
        id: 1,
        title: '养猫新手必看：如何选择合适的猫砂',
        description: '从材质、吸水性、除臭效果等方面教你选择...',
        coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ede9fe" width="200" height="200"/%3E%3Ctext fill="%238b5cf6" x="50%25" y="50%25" text-anchor="middle" font-size="40" dy=".3em"%3E📝%3C/text%3E%3C/svg%3E',
        platform: 'wechat', // wechat, xiaohongshu
        linkUrl: '',
        publishDate: '2024-01-15'
      },
      {
        id: 2,
        title: '社群用户真实反馈：使用喵汪兔3个月后',
        description: '来自500+铲屎官的真实使用体验分享...',
        coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ede9fe" width="200" height="200"/%3E%3Ctext fill="%238b5cf6" x="50%25" y="50%25" text-anchor="middle" font-size="40" dy=".3em"%3E💬%3C/text%3E%3C/svg%3E',
        platform: 'xiaohongshu',
        linkUrl: '',
        publishDate: '2024-01-10'
      },
      {
        id: 3,
        title: '猫砂更换频率指南',
        description: '科学换砂，让猫咪更健康...',
        coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ede9fe" width="200" height="200"/%3E%3Ctext fill="%238b5cf6" x="50%25" y="50%25" text-anchor="middle" font-size="40" dy=".3em"%3E📖%3C/text%3E%3C/svg%3E',
        platform: 'wechat',
        linkUrl: '',
        publishDate: '2024-01-05'
      }
    ]
  },

  onLoad() {
    this.loadBrandData()
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadBrandData()
  },

  // 加载品牌数据（从后台API获取）
  async loadBrandData() {
    try {
      // TODO: 调用后台API获取品牌数据
      // const res = await app.request({
      //   url: '/brand/info',
      //   method: 'GET'
      // })

      // 暂时使用模拟数据
      console.log('品牌数据加载成功')
    } catch (error) {
      console.error('加载品牌数据失败:', error)
    }
  },

  // 点击活动卡片
  onActivityTap() {
    const { currentActivity } = this.data

    if (!currentActivity) return

    // 根据链接类型跳转
    if (currentActivity.linkType === 'miniprogram') {
      // 小程序内页面跳转
      wx.navigateTo({
        url: '/pages/activity-detail/activity-detail?id=' + currentActivity.id
      })
    } else if (currentActivity.linkType === 'wechat') {
      // 跳转公众号文章
      this.showCopyLinkDialog(currentActivity.linkUrl, '公众号')
    } else if (currentActivity.linkType === 'xiaohongshu') {
      // 跳转小红书
      this.showCopyLinkDialog(currentActivity.linkUrl, '小红书')
    }
  },

  // 点击文章
  onArticleTap(e) {
    const { item } = e.currentTarget.dataset

    if (item.platform === 'wechat') {
      this.showCopyLinkDialog(item.linkUrl, '公众号文章')
    } else if (item.platform === 'xiaohongshu') {
      this.showCopyLinkDialog(item.linkUrl, '小红书笔记')
    }
  },

  // 显示复制链接对话框
  showCopyLinkDialog(url, platform) {
    if (!url) {
      wx.showToast({
        title: '链接暂未配置',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: `打开${platform}`,
      content: `链接：${url}`,
      confirmText: '复制链接',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: url,
            success: () => {
              wx.showToast({
                title: '链接已复制',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  // 分享配置
  onShareAppMessage() {
    return {
      title: '喵汪兔 - 我们懂的宠物清洁专家',
      path: '/pages/brand/brand'
    }
  }
})
