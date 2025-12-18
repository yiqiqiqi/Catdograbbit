// pet-edit.js
const app = getApp();
const { post, put } = require('../../utils/request');

const PET_TYPES = ['狗', '猫', '其他'];
const MAX_NAME_LENGTH = 10;
const MAX_BREED_LENGTH = 20;

Page({
  data: {
    // 表单数据
    name: '',
    breed: '',
    gender: 'male',
    sterilized: 'no',
    birthday: '',
    species: '狗',
    vaccines: { rabies: false, combo: false, other: false },
    today:'',
    // UI状态
    petTypes: PET_TYPES,
    petTypeIndex: 0,
    avatarUrl: '',
    isEdit: false,
    isSubmitting: false,
    petId: null,
    errors: { name: '', breed: '' }
  },

  onLoad(options) {
    this.initPage(options);
    const today = new Date().toISOString().split('T')[0];
    this.setData({ today });
  },

  // ========== 初始化 ==========
  initPage(options) {
    const userInfo = app.globalData.userInfo;
    if (!userInfo) {
      this.showToast('请先登录', 'error');
      setTimeout(() => wx.reLaunch({ url: '/pages/login/login' }), 1500);
      return;
    }

    if (options.editData) {
      this.setEditMode(options.editData);
    }
  },

  setEditMode(editData) {
    try {
      const data = JSON.parse(decodeURIComponent(editData));
      const vaccines = this.parseVaccines(data.vaccines);
      
      this.setData({
        name: data.name || '',
        breed: data.breed || '',
        gender: data.gender || 'male',
        sterilized: data.sterilized || 'no',
        birthday: this.formatDate(data.birthday),
        species: data.species || '狗',
        vaccines,
        avatarUrl: data.avatarUrl || '',
        isEdit: true,
        petId: data.petId || data.id,
        petTypeIndex: PET_TYPES.indexOf(data.species || '狗')
      });
    } catch (error) {
      this.showToast('数据加载失败', 'error');
    }
  },

  // ========== 疫苗处理 ==========
  parseVaccines(vaccinesData) {
    if (!vaccinesData) return { rabies: false, combo: false, other: false };
    
    try {
      // 如果已经是对象，直接使用
      if (typeof vaccinesData === 'object') {
        return {
          rabies: !!vaccinesData.rabies,
          combo: !!vaccinesData.combo,
          other: !!vaccinesData.other
        };
      }
      
      // 如果是字符串，尝试解析
      if (typeof vaccinesData === 'string') {
        // 先尝试直接解析
        try {
          const parsed = JSON.parse(vaccinesData);
          return {
            rabies: !!parsed.rabies,
            combo: !!parsed.combo,
            other: !!parsed.other
          };
        } catch (e) {
          // 如果解析失败，检查是否是布尔值字符串
          if (vaccinesData === 'true' || vaccinesData === 'false') {
            return {
              rabies: vaccinesData === 'true',
              combo: false,
              other: false
            };
          }
          return { rabies: false, combo: false, other: false };
        }
      }
      
      return { rabies: false, combo: false, other: false };
    } catch {
      return { rabies: false, combo: false, other: false };
    }
  },

  onVaccineChange(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      [`vaccines.${type}`]: !this.data.vaccines[type]
    });
  },

  // ========== 表单处理 ==========
  onNameInput(e) {
    const name = e.detail.value.trim();
    this.setData({ name });
    this.validateName(name);
  },

  onBreedInput(e) {
    const breed = e.detail.value.trim();
    this.setData({ breed });
    this.validateBreed(breed);
  },

  onPetTypeChange(e) {
    console.log(e)
    const index = e.detail.value;
    this.setData({
      petTypeIndex: index,
      species: PET_TYPES[index]
    });
  },

  // 修复性别选择
  onGenderChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ gender: value });
  },

  // 修复绝育选择
  onSterilizedChange(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({ sterilized: value });
  },

  onBirthdayChange(e) {
    this.setData({ birthday: e.detail.value });
  },

  // ========== 验证 ==========
  validateName(name) {
    let error = '';
    if (!name) error = '请输入宠物名称';
    else if (name.length > MAX_NAME_LENGTH) error = `名称不能超过${MAX_NAME_LENGTH}个字`;
    else if (!/^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)) error = '只能包含中文、英文和数字';
    
    this.setData({ 'errors.name': error });
    return !error;
  },

  validateBreed(breed) {
    const error = breed && breed.length > MAX_BREED_LENGTH ? `品种不能超过${MAX_BREED_LENGTH}个字` : '';
    this.setData({ 'errors.breed': error });
    return !error;
  },

  validateForm() {
    return this.validateName(this.data.name) && this.validateBreed(this.data.breed);
  },

  // ========== 头像处理 ==========
  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const file = res.tempFiles[0];
        if (file.size > 5 * 1024 * 1024) {
          this.showToast('图片不能超过5MB', 'error');
          return;
        }
        this.setData({ avatarUrl: file.tempFilePath });
      },
      fail: () => this.showToast('选择图片失败', 'error')
    });
  },

  removeAvatar() {
    this.setData({ avatarUrl: '' });
  },

  // ========== 提交 ==========
  async onSubmit() {
    if (this.data.isSubmitting || !this.validateForm()) return;

    this.setData({ isSubmitting: true });
    wx.showLoading({ title: '保存中...' });

    try {
      const avatarUrl = await this.uploadAvatarIfNeeded();
      await this.savePet(avatarUrl);
      this.handleSuccess();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.setData({ isSubmitting: false });
      wx.hideLoading();
    }
  },
  async uploadAvatarIfNeeded() {
    // 1. 前置校验：获取有效 Token
    const token = app.getValidToken();
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    if (!this.data.avatarUrl || 
        (this.data.avatarUrl.startsWith('http') && !this.data.avatarUrl.startsWith('http://tmp/'))) {
      return this.data.avatarUrl;
    }
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.baseURL}/pets/upload-avatar`,
        filePath: this.data.avatarUrl,
        name: 'file',
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            console.log("【上传头像】响应数据（解析后）：", data); // 打印解析后的JSON
            data.code === 0 ? resolve(data.data.url) : reject(data.message);
          } catch (e) {
            console.error("【上传头像】解析响应失败：", e); // 打印解析错误
            reject('上传失败（响应格式错误）');
          }
        },
        fail: (err) => {
          console.error("【上传头像】请求失败，错误信息：", err.errMsg);
          reject('网络错误：' + err.errMsg);
        },
      });
    });
  },

  async savePet(avatarUrl) {
    const submitData = this.prepareSubmitData(avatarUrl);
    console.log('提交的数据:', submitData);
    const url = this.data.isEdit ? `/pets/${this.data.petId}` : '/pets/createpet';
    const method = this.data.isEdit ? put : post;
    const result = await method(url, submitData);
    // 检查响应结果
    if (result) {
      return result;
    } else {
      throw new Error(result?.message || '保存失败');
    }
  },
  // 修复疫苗数据格式
  prepareSubmitData(avatarUrl) {
    const userInfo = app.globalData.userInfo;
    const userId = userInfo.UserId || userInfo.userId || userInfo.id;
    
    // 确保疫苗数据是有效的 JSON 格式
    let vaccinesData;
    try {
      vaccinesData = JSON.stringify(this.data.vaccines);
    } catch (e) {
      console.error('疫苗数据序列化失败:', e);
      vaccinesData = JSON.stringify({ rabies: false, combo: false, other: false });
    }

    const data = {
      UserId: userId,
      Name: this.data.name,
      Species: this.data.species,
      Breed: this.data.breed,
      Gender: this.data.gender,
      Sterilized: this.data.sterilized,
      Birthday: this.data.birthday,
      Vaccines: vaccinesData  // 使用序列化后的 JSON 字符串
    };

    // 处理头像URL
    if (avatarUrl) {
      data.AvatarUrl = avatarUrl.startsWith('http') ? avatarUrl :app.globalData.domain+avatarUrl;
    } else if (this.data.avatarUrl && this.data.avatarUrl.startsWith('http')) {
      data.AvatarUrl = this.data.avatarUrl;
    }

    return data;
  },

  // ========== 工具方法 ==========
  formatDate(date) {
    if (!date) return '';
    if (typeof date === 'string' && date.includes('T')) return date.split('T')[0];
    
    try {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  },

  handleSuccess() {
    this.showToast(this.data.isEdit ? '更新成功' : '创建成功', 'success');
    setTimeout(() => {
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.refreshData) prevPage.refreshData();
      app.globalData.petUpdated = true; // 标记宠物已更新
      wx.navigateBack();
    }, 1500);
  },

  handleError(error) {
    console.error('提交失败:', error);
    let message = '保存失败';
    
    if (typeof error === 'string') {
      message = error;
    } else if (error && error.message) {
      message = error.message;
    }
    
    // 特别处理疫苗相关的错误
    if (message.includes('Vaccines') || message.includes('JSON')) {
      message = '疫苗数据格式错误，请重试';
    }
    
    this.showToast(message, 'error');
  },

  showToast(message, type = 'none') {
    wx.showToast({
      title: message,
      icon: type === 'error' ? 'none' : type,
      duration: 3000
    });
  },

  onCancel() {
    wx.navigateBack();
  }
});