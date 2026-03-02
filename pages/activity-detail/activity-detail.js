// pages/activity-detail/activity-detail.js
const { get, post, del } = require('../../utils/request');
const { formatTime, showModal } = require('../../utils/util');

Page({
  data: {
    // 活动数据
    activity: {},
    activityId: '',
    
    // 参与信息
    participants: [],
    joinedPets: [],
    
    // 报名相关
    showJoinModal: false,
    availablePets: [],
    selectedPets: [],
    
    // 加载状态
    loading: true
  },

  onLoad(options) {
    console.log('活动详情页面加载，参数:', options);
    
    const { activityId } = options;
    if (activityId) {
      this.setData({ activityId });
      this.loadActivityDetail(activityId);
    } else {
      wx.showToast({
        title: '活动不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 加载活动详情
  async loadActivityDetail(activityId) {
    this.setData({ loading: true });

    try {
      // 加载活动基本信息
      const activity = await get(`/activities/${activityId}`, {}, { showLoading: false });
      
      // 加载参与用户信息
      const participants = await get(`/activities/${activityId}/participants`, {}, { showLoading: false });
      
      // 加载当前用户的报名信息
      const userParticipation = await this.getUserParticipation(activityId);
      
      this.setData({
        activity: {
          ...activity,
          liked: this.checkIfLiked(activityId),
          joined: userParticipation.joined,
          joinedPets: userParticipation.pets
        },
        participants: participants || [],
        joinedPets: userParticipation.pets || [],
        loading: false
      });

      console.log('加载活动详情成功:', activity);
    } catch (error) {
      console.error('加载活动详情失败:', error);
      this.setData({ loading: false });
      
      // 开发阶段使用模拟数据
      if (this.isDevMode()) {
        this.setMockData(activityId);
      } else {
        wx.showToast({ 
          title: '加载活动详情失败', 
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 获取用户报名信息
  async getUserParticipation(activityId) {
    try {
      const participation = await get(`/activities/${activityId}/my-participation`, {}, { showLoading: false });
      return participation;
    } catch (error) {
      console.error('获取用户报名信息失败:', error);
      return { joined: false, pets: [] };
    }
  },

  // 检查是否点赞
  checkIfLiked(activityId) {
    // 这里应该调用API检查点赞状态
    // 暂时返回false
    const likedActivities = wx.getStorageSync('liked_activities') || [];
    return likedActivities.includes(activityId);
  },

  // 喜欢活动
  async onLikeActivity() {
    const { activity } = this.data;
    const newLiked = !activity.liked;

    try {
      if (newLiked) {
        await post(`/activities/${activity.activityId}/like`);
      } else {
        await del(`/activities/${activity.activityId}/like`);
      }

      // 更新本地状态
      this.updateLikeStatus(newLiked);
      
      wx.showToast({
        title: newLiked ? '已添加到喜欢' : '已取消喜欢',
        icon: 'success'
      });
    } catch (error) {
      console.error('操作喜欢状态失败:', error);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 更新点赞状态
  updateLikeStatus(liked) {
    const { activity } = this.data;
    
    // 更新活动数据
    this.setData({
      'activity.liked': liked,
      'activity.likeCount': liked ? (activity.likeCount || 0) + 1 : Math.max(0, (activity.likeCount || 1) - 1)
    });

    // 更新本地存储
    let likedActivities = wx.getStorageSync('liked_activities') || [];
    if (liked) {
      if (!likedActivities.includes(activity.activityId)) {
        likedActivities.push(activity.activityId);
      }
    } else {
      likedActivities = likedActivities.filter(id => id !== activity.activityId);
    }
    wx.setStorageSync('liked_activities', likedActivities);
  },

  // 报名活动
  async onJoinActivity() {
    const { activity } = this.data;

    if (activity.joined) {
      // 已报名，显示报名详情
      this.showParticipationInfo();
      return;
    }

    if (activity.status !== 'open') {
      wx.showToast({
        title: '该活动暂不可报名',
        icon: 'none'
      });
      return;
    }

    // 加载可用宠物
    await this.loadAvailablePets();
    
    // 显示报名弹窗
    this.setData({ 
      showJoinModal: true,
      selectedPets: []
    });
  },

  // 加载可用宠物
  async loadAvailablePets() {
    try {
      const pets = await get('/pets', {}, { showLoading: false });
      this.setData({ availablePets: pets });
    } catch (error) {
      console.error('加载宠物列表失败:', error);
      this.setData({ availablePets: [{name:"niuniu"},{name:"wangcai"}] });
    }
  },

  // 切换宠物选择
  onTogglePet(e) {
    const petId = e.currentTarget.dataset.petId;
    const { selectedPets } = this.data;
    
    let newSelectedPets;
    if (selectedPets.includes(petId)) {
      newSelectedPets = selectedPets.filter(id => id !== petId);
    } else {
      newSelectedPets = [...selectedPets, petId];
    }
    
    this.setData({ selectedPets: newSelectedPets });
  },

  // 确认报名
  async onConfirmJoin() {
    const { activityId, selectedPets } = this.data;

    if (selectedPets.length === 0) {
      wx.showToast({
        title: '请选择参与宠物',
        icon: 'none'
      });
      return;
    }

    try {
      // 调用报名接口
      await post(`/activities/${activityId}/join`, {
        petIds: selectedPets
      });

      // 关闭弹窗
      this.setData({ showJoinModal: false });

      // 重新加载活动详情
      this.loadActivityDetail(activityId);

      wx.showToast({
        title: '报名成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('报名失败:', error);
      wx.showToast({
        title: '报名失败，请重试',
        icon: 'none'
      });
    }
  },

  // 关闭弹窗
  onCloseModal() {
    this.setData({ showJoinModal: false });
  },

  // 显示报名详情
  showParticipationInfo() {
    const { joinedPets } = this.data;
    const petNames = joinedPets.map(pet => pet.name).join('、');
    
    wx.showModal({
      title: '报名详情',
      content: `您已报名参加此活动，参与的宠物：${petNames}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 查看地图
  onViewLocation() {
    const { activity } = this.data;
    
    if (!activity.address) {
      wx.showToast({
        title: '暂无详细地址',
        icon: 'none'
      });
      return;
    }

    wx.openLocation({
      name: activity.location,
      address: activity.address,
      latitude: activity.latitude || 39.9042, // 默认北京
      longitude: activity.longitude || 116.4074
    });
  },

  // 预览图片
  onPreviewImage(e) {
    const src = e.currentTarget.dataset.src;
    const { activity } = this.data;
    
    wx.previewImage({
      urls: activity.images || [src],
      current: src
    });
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'open': '可报名',
      'closed': '报名截止',
      'ended': '已结束'
    };
    return statusMap[status] || '未知';
  },

  // 获取报名按钮文本
  getJoinButtonText(activity) {
    if (activity.joined) return '已报名';
    if (activity.status === 'open') return '立即报名';
    if (activity.status === 'closed') return '报名截止';
    if (activity.status === 'ended') return '活动结束';
    return '无法报名';
  },

  // 格式化活动时间
  formatActivityTime(startTime, endTime) {
    if (!startTime || !endTime) return '时间待定';
    
    const start = formatTime(startTime, 'YYYY年MM月DD日 HH:mm');
    const end = formatTime(endTime, 'HH:mm');
    return `${start} - ${end}`;
  },

  // 开发模式判断
  isDevMode() {
    return getApp().globalData.baseURL.includes('localhost');
  },

  // 设置模拟数据
  setMockData(activityId) {
    const mockActivity = {
      activityId: activityId,
      title: '宠物万圣节派对',
      coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="690" height="300"%3E%3Crect fill="%23f5f3ff" width="690" height="300"/%3E%3Ctext fill="%238b5cf6" x="50%25" y="50%25" text-anchor="middle" font-size="32" dy=".3em"%3E🎃 万圣节活动封面%3C/text%3E%3C/svg%3E',
      description: `带上您的爱宠一起参加万圣节主题派对！🎃

活动内容：
• 宠物服装比赛
• 万圣节主题美食
• 互动游戏环节
• 宠物才艺表演
• 幸运抽奖活动

注意事项：
• 请为宠物准备好牵引绳
• 自带宠物饮用水和零食
• 如有特殊需求请提前告知

让我们和爱宠一起度过一个难忘的万圣节吧！`,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      location: '朝阳公园',
      address: '北京市朝阳区朝阳公园南路1号',
      organizer: '宠物成长日记团队',
      maxParticipants: 100,
      currentParticipants: 78,
      status: 'open',
      rating: 4.8,
      likeCount: 156,
      images: [],
      liked: false,
      joined: false
    };

    const mockParticipants = [
      {
        userId: 'USER_001',
        nickname: '小明',
        avatar: '',
        pets: [{ name: '小白' }, { name: '小黑' }]
      },
      {
        userId: 'USER_002',
        nickname: '小红',
        avatar: '',
        pets: [{ name: '小花' }]
      },
      {
        userId: 'USER_003',
        nickname: '小李',
        avatar: '',
        pets: [{ name: '旺财' }, { name: '来福' }]
      }
    ];

    this.setData({
      activity: mockActivity,
      participants: mockParticipants,
      loading: false
    });
  }
});