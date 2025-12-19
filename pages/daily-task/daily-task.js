// pages/daily-task/daily-task.js
Page({
  data: {
    userPoints: 1250, // 用户当前积分
    todayPoints: 80,  // 今日获得积分
    completedTasksCount: 1, // 已完成任务数量
    totalTasksCount: 3,     // 总任务数量
    showToast: false,       // 是否显示提示
    toastMessage: '',       // 提示消息内容
    taskList: [
      {
        id: 1,
        name: '每日签到',
        description: '每日登录应用即可领取积分',
        points: 10,  // 保持不变，鼓励日活
        completed: true,
      },
      {
        id: 2,
        name: '分享内容',
        description: '分享任意内容到社交平台',
        points: 20,  // 从30降到20，平衡成本
        completed: false,
      },
      {
        id: 3,
        name: '完善资料',
        description: '完善个人资料信息',
        points: 15,  // 从25降到15，一次性任务
        completed: false,
      }
    ]
  },

  onLoad: function(options) {
    // 从全局数据或缓存中获取用户任务状态
    this.loadTaskProgress();
  },

  onShow: function() {
    // 页面显示时刷新任务状态
    this.refreshTaskStatus();
  },

  // 加载任务进度
  loadTaskProgress: function() {
    // 这里可以从缓存或服务器获取任务完成状态
    try {
      const taskProgress = wx.getStorageSync('dailyTaskProgress');
      if (taskProgress) {
        this.setData({
          taskList: taskProgress.taskList,
          completedTasksCount: taskProgress.completedTasksCount,
          todayPoints: taskProgress.todayPoints || 0
        });
      }
    } catch (e) {
      console.error('加载任务进度失败:', e);
    }
  },

  // 保存任务进度
  saveTaskProgress: function() {
    try {
      const taskProgress = {
        taskList: this.data.taskList,
        completedTasksCount: this.data.completedTasksCount,
        todayPoints: this.data.todayPoints
      };
      wx.setStorageSync('dailyTaskProgress', taskProgress);
    } catch (e) {
      console.error('保存任务进度失败:', e);
    }
  },

  // 刷新任务状态
  refreshTaskStatus: function() {
    // 这里可以添加从服务器获取最新任务状态的逻辑
    // 暂时使用本地数据
  },

  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  },

  // 切换任务完成状态
  toggleTaskCompletion: function(e) {
    const taskId = e.currentTarget.dataset.taskid;
    const taskList = this.data.taskList;
    const taskIndex = taskList.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return;
    
    const task = taskList[taskIndex];
    
    // 如果任务已完成，则不能取消完成
    if (task.completed) {
      this.showToast('任务已完成，明日可再次参与');
      return;
    }
    
    // 标记任务为已完成
    taskList[taskIndex].completed = true;
    
    // 更新数据
    const completedTasksCount = this.data.completedTasksCount + 1;
    const todayPoints = this.data.todayPoints + task.points;
    const userPoints = this.data.userPoints + task.points;
    
    this.setData({
      taskList: taskList,
      completedTasksCount: completedTasksCount,
      todayPoints: todayPoints,
      userPoints: userPoints
    });
    
    // 显示完成提示
    this.showToast(`任务完成！获得${task.points}积分`);
    
    // 保存进度
    this.saveTaskProgress();
    
    // 这里可以添加向服务器提交任务完成的逻辑
    // this.submitTaskCompletion(taskId);
  },

  // 显示提示消息
  showToast: function(message) {
    this.setData({
      showToast: true,
      toastMessage: message
    });
    
    setTimeout(() => {
      this.setData({
        showToast: false
      });
    }, 2000);
  },

  // 提交任务完成到服务器
  submitTaskCompletion: function(taskId) {
    // 这里添加与服务器交互的代码
    wx.request({
      url: 'https://your-api-domain.com/task/complete',
      method: 'POST',
      data: {
        taskId: taskId,
        userId: getApp().globalData.userId
      },
      success: (res) => {
        if (res.data.code === 200) {
          console.log('任务完成提交成功');
        } else {
          console.error('任务完成提交失败:', res.data.message);
        }
      },
      fail: (err) => {
        console.error('网络请求失败:', err);
      }
    });
  }
});