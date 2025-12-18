const app = getApp();
const { get, post,delete: del } = require('../../utils/request');
Page({
  data: {
    activeTab: 'record',
    currentMonth: 11, // 11月
    calendarDays: [],
    todayRecords: {
      diet: '',
      water: '',
      weight: '',
      grooming: ''
    },
    showRecordModal: false,
    selectedRecordType: '',
    isPetModalShow: false,
    petList: [],
    selectedPet: {}
  },

  onLoad: function(options) {
    this.loadPets();
    this.generateCalendar();
    this.loadTodayRecords();
  },

  // 加载宠物列表
  loadPets() {
    return new Promise((resolve, reject) => {
      const userId = app.globalData.userInfo.userId;
      if (!userId) {
        reject(new Error('用户ID不存在'));
        return;
      }

      get('/pets/user/' + userId, {}, { showLoading: false })
        .then(pets => {
          if (!pets || pets.length === 0) {
            this.setData({ petList: [], selectedPet: null });
            resolve([]);
            return;
          }
          
          const selectedPet = app.globalData.selectedPet || pets[0];
          
          this.setData({
            petList: pets,
            selectedPet: selectedPet
          });
          
          app.globalData.selectedPet = selectedPet;
          
          resolve(pets);
        })
        .catch(error => {
          console.error('加载宠物列表失败:', error);
          this.setData({ petList: [], selectedPet: null });
          reject(error);
        });
    });
  },
  onPetChange(e) {
    const { selectedPet } = e.detail;
    
    this.setData({ selectedPet });
    app.globalData.selectedPet = selectedPet;
    
    this.loadTodayDiet().catch(console.error);
  },
  // 生成日历数据
  generateCalendar: function() {
    const year = 2023;
    const month = 10; // 0-based (10 = 11月)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    // 调整第一天的位置（周一为0）
    let adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const calendarDays = [];
    
    // 添加上个月的日期
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      calendarDays.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }
    
    // 添加当前月的日期
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: true,
        isToday: isCurrentMonth && i === today.getDate(),
        isSelected: isCurrentMonth && i === today.getDate()
      });
    }
    
    // 添加下个月的日期
    const totalCells = 42; // 6行 * 7列
    const remainingCells = totalCells - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      calendarDays.push({
        day: i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false
      });
    }
    
    this.setData({
      calendarDays: calendarDays
    });
  },

  // 加载今日记录
  loadTodayRecords: function() {
    // 模拟从存储中加载数据，根据当前选中的宠物
    const petId = this.data.selectedPet.id;
    const petRecords = wx.getStorageSync('petRecords') || {};
    
    const todayRecords = petRecords[petId] || {
      diet: '狗粮 200g',
      water: '300',
      weight: '2.5',
      grooming: '洗澡'
    };
    
    this.setData({
      todayRecords: todayRecords
    });
  },

  // 切换标签
  switchTab: function(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab
    });
    
    if (tab === 'reminder') {
      wx.showToast({
        title: '切换到提醒页面',
        icon: 'none'
      });
    }
  },

  // 选择日期
  selectDay: function(e) {
    const day = e.currentTarget.dataset.day;
    if (!day.isCurrentMonth) return;
    
    const calendarDays = this.data.calendarDays.map(item => {
      return {
        ...item,
        isSelected: item.day === day.day && item.isCurrentMonth
      };
    });
    
    this.setData({
      calendarDays: calendarDays
    });
    
    // 在实际应用中，这里应该加载选中日期的记录
    wx.showToast({
      title: `查看${this.data.selectedPet.name} ${day.day}日记录`,
      icon: 'none'
    });
  },

  // 打开宠物选择弹窗
  openPetModal: function() {
    this.setData({
      isPetModalShow: true
    });
  },

  // 关闭宠物选择弹窗
  closePetModal: function() {
    this.setData({
      isPetModalShow: false
    });
  },

  // 切换宠物
  changePet: function(e) {
    const petId = parseInt(e.currentTarget.dataset.petid);
    const selectedPet = this.data.petList.find(pet => pet.id === petId);
    
    if (selectedPet) {
      this.setData({
        selectedPet: selectedPet,
        isPetModalShow: false
      });
      
      // 更新全局选中的宠物
      app.globalData.selectedPet = selectedPet;
      
      // 重新加载该宠物的记录
      this.loadTodayRecords();
      
      wx.showToast({
        title: `已切换到${selectedPet.name}`,
        icon: 'success'
      });
    }
  },

  // 跳转到添加宠物页面
  gotoAddPet: function() {
    wx.navigateTo({
      url: '/pages/pet-edit/pet-edit'
    });
  },

  // 显示添加记录弹窗
  showAddRecordModal: function() {
    this.setData({
      showRecordModal: true
    });
  },

  // 隐藏添加记录弹窗
  hideAddRecordModal: function() {
    this.setData({
      showRecordModal: false,
      selectedRecordType: ''
    });
  },

  // 选择记录类型
  selectRecordType: function(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      selectedRecordType: type
    });
    
    // 在实际应用中，这里应该跳转到对应的记录编辑页面
    setTimeout(() => {
      this.hideAddRecordModal();
      wx.showToast({
        title: `为${this.data.selectedPet.name}添加${this.getRecordTypeName(type)}记录`,
        icon: 'none'
      });
    }, 300);
  },

  // 获取记录类型名称
  getRecordTypeName: function(type) {
    const names = {
      diet: '饮食',
      water: '喝水',
      weight: '体重',
      grooming: '洗护'
    };
    return names[type] || '';
  },

  // 编辑饮食记录
  editDiet: function() {
    wx.showToast({
      title: `编辑${this.data.selectedPet.name}的饮食记录`,
      icon: 'none'
    });
  },

  // 编辑喝水记录
  editWater: function() {
    wx.showToast({
      title: `编辑${this.data.selectedPet.name}的喝水记录`,
      icon: 'none'
    });
  },

  // 编辑体重记录
  editWeight: function() {
    wx.showToast({
      title: `编辑${this.data.selectedPet.name}的体重记录`,
      icon: 'none'
    });
  },

  // 编辑洗护记录
  editGrooming: function() {
    wx.showToast({
      title: `编辑${this.data.selectedPet.name}的洗护记录`,
      icon: 'none'
    });
  }
});