// pages/record-edit/record-edit.js
const { post, uploadFile } = require('../../utils/request');
const { chooseImage, compressImage, showModal } = require('../../utils/util');

Page({
  data: {
    // 页面状态
    isLoading: false,
    
    // 记录基本信息
    recordType: 'diary', // diary, health, activity
    content: '',
    selectedPetId: '',
    images: [],
    
    // 宠物列表
    pets: [],
    
    // 健康记录额外信息
    healthTypes: [
      { name: '驱虫', value: 'deworm' },
      { name: '疫苗', value: 'vaccine' },
      { name: '体检', value: 'checkup' },
      { name: '洗澡美容', value: 'bath' },
      { name: '其他', value: 'other' }
    ],
    healthTypeIndex: 0,
    
    // 活动记录额外信息
    activities: [
      { activityId: 'ACT001', title: '宠物万圣节派对' },
      { activityId: 'ACT002', title: '猫咪游泳体验课' },
      { activityId: 'ACT003', title: '狗狗训练营' }
    ],
    activityIndex: 0,
    
    // 编辑模式相关
    isEditMode: false,
    recordId: null
  },

  onLoad(options) {
    console.log('记录编辑页面加载，参数:', options);
    
    // 获取传入的参数
    const { petId, recordId } = options;
    
    if (recordId) {
      // 编辑模式
      this.setData({ 
        isEditMode: true,
        recordId 
      });
      this.loadRecordData(recordId);
    } else {
      // 创建模式
      this.setData({ 
        selectedPetId: petId || '' 
      });
    }
    
    // 加载必要的数据
    this.loadPets();
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: this.data.isEditMode ? '编辑记录' : '添加记录'
    });
  },

  // 加载宠物列表
  async loadPets() {
    try {
      const pets = await get('/pets', {}, { showLoading: false });
      
      this.setData({ pets });
      
      // 如果没有传入petId且没有默认选中，选择第一个宠物
      if (!this.data.selectedPetId && pets.length > 0) {
        this.setData({ selectedPetId: pets[0].petId });
      }
      
      console.log('加载宠物列表成功:', pets);
    } catch (error) {
      console.error('加载宠物列表失败:', error);
      
      // 开发阶段使用模拟数据
      if (this.isDevMode()) {
        this.setMockPets();
      } else {
        wx.showToast({ 
          title: '加载宠物失败', 
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 加载记录数据（编辑模式）
  // async loadRecordData(recordId) {
  //   try {
  //     const record = await get(`/records/${recordId}`, {}, { showLoading: true });
      
  //     this.setData({
  //       recordType: record.type,
  //       content: record.content,
  //       selectedPetId: record.petId,
  //       images: record.images ? JSON.parse(record.images) : []
  //     });
      
  //     // 设置健康类型
  //     if (record.type === 'health' && record.extra) {
  //       const extra = JSON.parse(record.extra);
  //       const healthTypeIndex = this.data.healthTypes.findIndex(item => item.value === extra.healthType);
  //       if (healthTypeIndex !== -1) {
  //         this.setData({ healthTypeIndex });
  //       }
  //     }
      
  //     console.log('加载记录数据成功:', record);
  //   } catch (error) {
  //     console.error('加载记录数据失败:', error);
  //     wx.showToast({ 
  //       title: '加载记录失败', 
  //       icon: 'none',
  //       duration: 2000
  //     });
      
  //     // 返回上一页
  //     setTimeout(() => {
  //       wx.navigateBack();
  //     }, 1500);
  //   }
  // },

  // 选择宠物
  onSelectPet(e) {
    const petId = e.currentTarget.dataset.petId;
    this.setData({ selectedPetId: petId });
    console.log('选择宠物:', petId);
  },

  // 选择记录类型
  onSelectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ recordType: type });
    console.log('选择记录类型:', type);
  },

  // 健康类型改变
  onHealthTypeChange(e) {
    const index = e.detail.value;
    this.setData({ healthTypeIndex: index });
    console.log('选择健康类型:', this.data.healthTypes[index]);
  },

  // 活动选择改变
  onActivityChange(e) {
    const index = e.detail.value;
    this.setData({ activityIndex: index });
    console.log('选择活动:', this.data.activities[index]);
  },

  // 内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 添加图片
  async onAddImage() {
    if (this.data.images.length >= 9) {
      wx.showToast({
        title: '最多只能添加9张图片',
        icon: 'none',
        duration: 2000
      });
      return;
    }
  
    try {
      const tempFilePaths = await chooseImage(9 - this.data.images.length);
      
      if (tempFilePaths && tempFilePaths.length > 0) {
        // 显示加载中
        wx.showLoading({ title: '处理图片中...', mask: true });
        
        const newImages = [...this.data.images];
        
        // 处理每张图片
        for (const tempFilePath of tempFilePaths) {
          try {
            // 压缩图片
            const compressedPath = await compressImage(tempFilePath, 0.7);
            
            // 开发阶段直接使用临时路径
            newImages.push(compressedPath);
          } catch (error) {
            console.error('处理图片失败:', error);
            // 如果压缩失败，使用原图
            newImages.push(tempFilePath);
          }
        }
        
        this.setData({ images: newImages });
        wx.hideLoading();
        
        console.log('添加图片成功，当前图片数量:', newImages.length);
      }
    } catch (error) {
      wx.hideLoading();
      console.error('选择图片失败:', error);
      
      if (error.errMsg !== 'chooseMedia:fail cancel') {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 移除图片
  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    images.splice(index, 1);
    this.setData({ images });
    console.log('移除图片，剩余数量:', images.length);
  },

  // 取消编辑
  onCancel() {
    if (this.data.content || this.data.images.length > 0) {
      showModal('确认退出', '您有未保存的内容，确定要退出吗？').then(confirm => {
        if (confirm) {
          wx.navigateBack();
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  // 保存记录
  async onSave() {
    // 验证数据
    if (!this.validateForm()) {
      return;
    }

    this.setData({ isLoading: true });

    try {
      // 准备数据
      const recordData = {
        petId: this.data.selectedPetId,
        type: this.data.recordType,
        content: this.data.content,
        images: this.data.images,
        extra: this.prepareExtraData()
      };

      console.log('保存记录数据:', recordData);

      // 调用保存接口
      let result;
      if (this.data.isEditMode) {
        result = await put(`/records/${this.data.recordId}`, recordData);
      } else {
        result = await post('/records', recordData);
      }

      // 保存成功
      wx.showToast({
        title: this.data.isEditMode ? '更新成功' : '保存成功',
        icon: 'success',
        duration: 1500
      });

      // 设置需要刷新首页的标志
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.route === 'pages/index/index') {
        prevPage.setData({ needRefresh: true });
      }

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('保存记录失败:', error);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 验证表单
  validateForm() {
    if (!this.data.selectedPetId) {
      wx.showToast({
        title: '请选择宠物',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入记录内容',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    return true;
  },

  // 准备额外数据
  prepareExtraData() {
    const extra = {};

    if (this.data.recordType === 'health') {
      const healthType = this.data.healthTypes[this.data.healthTypeIndex];
      extra.healthType = healthType.value;
      extra.healthName = healthType.name;
    }

    if (this.data.recordType === 'activity' && this.data.activities[this.data.activityIndex]) {
      const activity = this.data.activities[this.data.activityIndex];
      extra.activityId = activity.activityId;
      extra.activityTitle = activity.title;
    }

    return Object.keys(extra).length > 0 ? extra : null;
  },

  // 开发模式判断
  isDevMode() {
    return getApp().globalData.baseURL.includes('localhost');
  },

  // 设置模拟宠物数据（开发阶段使用）
  setMockPets() {
    const mockPets = [
      {
        petId: 'PET_202411050001',
        name: '妞妞',
        species: 'cat',
        breed: '英短',
        avatar: '/images/default-cat.png',
        status: 'active'
      },
      {
        petId: 'PET_202411050002', 
        name: '旺财',
        species: 'dog',
        breed: '金毛',
        avatar: '/images/default-dog.png',
        status: 'active'
      }
    ];
    
    this.setData({ 
      pets: mockPets,
      selectedPetId: this.data.selectedPetId || mockPets[0].petId
    });
  }
});