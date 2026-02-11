// pages/growth/growth.js
const { get, post } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    selectedPet: null,
    petList: [],
    growthRecords: [],
    loading: false,
    isLoadingMore: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad(options) {
    this.loadPetList();
    this.loadGrowthRecords();
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadPetList();
    if (this.data.selectedPet) {
      this.loadGrowthRecords();
    }
  },

  // 加载宠物列表
  loadPetList() {
    try {
      const petList = wx.getStorageSync('petList') || [];
      this.setData({ petList });

      if (petList.length > 0 && !this.data.selectedPet) {
        this.setData({ selectedPet: petList[0] });
      }
    } catch (error) {
      console.error('加载宠物列表失败:', error);
    }
  },

  // 加载成长记录
  loadGrowthRecords() {
    if (!this.data.selectedPet) {
      return;
    }

    this.setData({ loading: true });

    try {
      const petId = this.data.selectedPet.id;
      const allRecords = wx.getStorageSync('growthRecords') || {};
      const records = allRecords[petId] || [];

      // 按日期倒序排列
      records.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

      this.setData({
        growthRecords: records.slice(0, this.data.pageSize),
        hasMore: records.length > this.data.pageSize,
        loading: false,
        page: 1
      });
    } catch (error) {
      console.error('加载成长记录失败:', error);
      this.setData({ loading: false });
    }
  },

  // 宠物改变
  onPetChange(e) {
    const selectedPet = e.detail;
    this.setData({
      selectedPet,
      page: 1,
      growthRecords: [],
      hasMore: true
    });
    this.loadGrowthRecords();
  },

  // 编辑宠物
  onEditPet(e) {
    const pet = e.detail;
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?petId=${pet.id}`
    });
  },

  // 添加成长记录
  addGrowthRecord() {
    if (!this.data.selectedPet) {
      wx.showToast({
        title: '请先选择宠物',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: `/pages/growth-edit/growth-edit?petId=${this.data.selectedPet.id}`
    });
  },

  // 编辑记录
  editRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const record = this.data.growthRecords.find(r => r.id === recordId);

    if (record) {
      wx.navigateTo({
        url: `/pages/growth-edit/growth-edit?recordId=${recordId}&petId=${this.data.selectedPet.id}`
      });
    }
  },

  // 删除记录
  deleteRecord(e) {
    e.stopPropagation();

    const recordId = e.currentTarget.dataset.id;
    const record = this.data.growthRecords.find(r => r.id === recordId);

    if (!record) return;

    wx.showModal({
      title: '确认删除',
      content: '确认删除这条成长记录吗？',
      confirmText: '删除',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete(recordId);
        }
      }
    });
  },

  // 确认删除
  confirmDelete(recordId) {
    try {
      const petId = this.data.selectedPet.id;
      const allRecords = wx.getStorageSync('growthRecords') || {};
      const records = allRecords[petId] || [];

      allRecords[petId] = records.filter(r => r.id !== recordId);
      wx.setStorageSync('growthRecords', allRecords);

      const updatedRecords = this.data.growthRecords.filter(r => r.id !== recordId);
      this.setData({ growthRecords: updatedRecords });

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('删除记录失败:', error);
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  },

  // 预览图片
  previewImage(e) {
    const urls = e.currentTarget.dataset.urls;
    const current = e.currentTarget.dataset.current || 0;

    wx.previewImage({
      urls,
      current
    });
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.isLoadingMore) {
      return;
    }

    this.setData({ isLoadingMore: true });

    try {
      const petId = this.data.selectedPet.id;
      const allRecords = wx.getStorageSync('growthRecords') || {};
      const records = allRecords[petId] || [];

      records.sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate));

      const nextPage = this.data.page + 1;
      const startIndex = (nextPage - 1) * this.data.pageSize;
      const endIndex = startIndex + this.data.pageSize;

      const newRecords = this.data.growthRecords.concat(
        records.slice(startIndex, endIndex)
      );

      this.setData({
        growthRecords: newRecords,
        page: nextPage,
        hasMore: endIndex < records.length,
        isLoadingMore: false
      });
    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({ isLoadingMore: false });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadGrowthRecords();
    wx.stopPullDownRefresh();
  }
});
