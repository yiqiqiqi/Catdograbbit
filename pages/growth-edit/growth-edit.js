const app = getApp();

Page({
  data: {
    petId: '',
    recordId: '',
    isEdit: false,
    typeOptions: [
      { value: 'diary', label: '日常记录' },
      { value: 'health', label: '健康记录' },
      { value: 'activity', label: '活动记录' }
    ],
    typeIndex: 0,
    recordDate: '',
    content: '',
    images: []
  },

  onLoad(options) {
    const { petId, recordId } = options;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    this.setData({
      petId: petId || '',
      recordDate: dateStr
    });

    if (recordId) {
      this.setData({ recordId, isEdit: true });
      this.loadRecord(petId, recordId);
    }
  },

  loadRecord(petId, recordId) {
    try {
      const allRecords = wx.getStorageSync('growthRecords') || {};
      const records = allRecords[petId] || [];
      const record = records.find(r => r.id === recordId);

      if (record) {
        const typeIndex = this.data.typeOptions.findIndex(t => t.value === record.type);
        this.setData({
          content: record.content || '',
          recordDate: record.recordDate || '',
          images: record.images || [],
          typeIndex: typeIndex >= 0 ? typeIndex : 0
        });
      }
    } catch (error) {
      console.error('加载记录失败:', error);
    }
  },

  onTypeChange(e) {
    this.setData({ typeIndex: parseInt(e.detail.value) });
  },

  onDateChange(e) {
    this.setData({ recordDate: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  chooseImage() {
    const remaining = 9 - this.data.images.length;
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          images: this.data.images.concat(newImages)
        });
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.images[index],
      urls: this.data.images
    });
  },

  saveRecord() {
    const { petId, recordId, isEdit, content, recordDate, images, typeOptions, typeIndex } = this.data;

    if (!content.trim()) {
      wx.showToast({ title: '请输入记录内容', icon: 'none' });
      return;
    }

    try {
      const allRecords = wx.getStorageSync('growthRecords') || {};
      const records = allRecords[petId] || [];

      if (isEdit) {
        const idx = records.findIndex(r => r.id === recordId);
        if (idx >= 0) {
          records[idx] = {
            ...records[idx],
            type: typeOptions[typeIndex].value,
            recordDate,
            content: content.trim(),
            images
          };
        }
      } else {
        records.unshift({
          id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          petId,
          type: typeOptions[typeIndex].value,
          recordDate,
          content: content.trim(),
          images,
          createdAt: new Date().toISOString()
        });
      }

      allRecords[petId] = records;
      wx.setStorageSync('growthRecords', allRecords);

      wx.showToast({
        title: isEdit ? '修改成功' : '添加成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存记录失败:', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  }
});
