const app = getApp();
Page({
  data: {
    currentStep: 0, // 当前步骤
    swiperHeight: 0, // swiper高度
    isStepValid: false, // 当前步骤是否有效
    
    // 日期选择器相关
    minDate: '2000-01-01',
    maxDate: '',
    defaultDate: '',
    
    // 宠物信息
    petInfo: {
      AvatarUrl: '', // 头像URL
      Name: '', // 名字
      Species: '', // 种类
      Birthday: '', // 生日
      Gender: '', // 性别
      Sterilized: '' // 是否绝育
    }
  },

  onLoad() {
    // 初始化日期
    this.initDatePicker();
    
    // 计算swiper高度
    this.calcSwiperHeight();
    
    // 验证第一步
    this.validateStep(0);
  },

  onShow() {
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 初始化日期选择器
  initDatePicker() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    
    // 设置最大日期为今天
    this.setData({
      maxDate: `${year}-${month}-${day}`,
      defaultDate: `${year}-${month}-${day}`
    });
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    if (!app.globalData.userInfo) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.redirectTo({
            url: '/pages/login/login'
          });
        }
      });
    }
  },

  // 计算swiper高度
  calcSwiperHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const query = wx.createSelectorQuery();
    
    query.select('.action-buttons').boundingClientRect();
    query.exec((res) => {
      const btnHeight = res[0]?.height || 0;
      const swiperHeight = systemInfo.windowHeight - btnHeight;
      
      this.setData({ swiperHeight });
    });
  },

  // 上传图片
  uploadImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        
        // 显示图片预览
        this.setData({
          'petInfo.AvatarUrl': tempFilePath
        });
        
        // 验证步骤
        this.validateStep(0);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 输入宠物名称
  onNameInput(e) {
    const value = e.detail.value.trim();
    this.setData({
      'petInfo.Name': value
    });
    
    // 验证步骤
    this.validateStep(0);
  },

  // 选择宠物种类（通过点击图片）
  selectType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      'petInfo.Species': type
    });
    
    // 验证第二步
    this.validateStep(1);
  },

  // 选择生日
  onBirthdayChange(e) {
    const birthday = e.detail.value;
    this.setData({
      'petInfo.Birthday': birthday
    });
  },

  // 选择性别
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender;
    // 转换为接口需要的格式
    let genderValue = '';
    if (gender === '男孩') {
      genderValue = 'male';
    } else if (gender === '女孩') {
      genderValue = 'female';
    }
    
    this.setData({
      'petInfo.Gender': genderValue
    });
    
    // 验证第三步
    this.validateStep(2);
  },

  // 选择绝育情况
  selectNeutered(e) {
    const value = e.currentTarget.dataset.value;
    let sterilizedValue = '';
    
    if (value === 'true') {
      sterilizedValue = 'yes';
    } else if (value === 'false') {
      sterilizedValue = 'no';
    } else {
      sterilizedValue = 'unknown';
    }
    
    this.setData({
      'petInfo.Sterilized': sterilizedValue
    });
    
    // 验证第三步
    this.validateStep(2);
  },

  // 验证当前步骤
  validateStep(step) {
    let isValid = false;
    
    switch(step) {
      case 0:
        // 第一步：头像和姓名都需要
        isValid = this.data.petInfo.AvatarUrl && this.data.petInfo.Name.trim();
        break;
      case 1:
        // 第二步：需要选择种类，生日可选
        isValid = !!this.data.petInfo.Species;
        break;
      case 2:
        // 第三步：需要选择性别和绝育情况
        isValid = this.data.petInfo.Gender && this.data.petInfo.Sterilized !== '';
        break;
      default:
        isValid = false;
    }
    
    this.setData({ isStepValid: isValid });
    return isValid;
  },

  // swiper滑动
  onSwiperChange(e) {
    const current = e.detail.current;
    this.setData({ currentStep: current });
    this.validateStep(current);
  },

  // 上一步
  prevStep() {
    if (this.data.currentStep > 0) {
      const prevStep = this.data.currentStep - 1;
      this.setData({ currentStep: prevStep });
      this.validateStep(prevStep);
    }
  },

  // 下一步/完成
  nextStep() {
    if (!this.validateStep(this.data.currentStep)) {
      // 显示具体的错误提示
      let errorMsg = '';
      switch(this.data.currentStep) {
        case 0:
          errorMsg = '请上传头像并输入宠物名字';
          break;
        case 1:
          errorMsg = '请选择宠物种类';
          break;
        case 2:
          errorMsg = '请选择性别和绝育情况';
          break;
      }
      
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    if (this.data.currentStep < 2) {
      const nextStep = this.data.currentStep + 1;
      this.setData({ currentStep: nextStep });
      this.validateStep(nextStep);
    } else {
      // 第三步点击完成，提交数据
      this.submitPetInfo();
    }
  },

  // 跳过，以后再说
  skipForNow() {
    wx.showModal({
      title: '跳过提示',
      content: '跳过后部分功能将受限，确定要跳过吗？',
      confirmText: '确定跳过',
      cancelText: '继续填写',
      confirmColor: '#8b5cf6',
      success: (res) => {
        if (res.confirm) {
          // 设置跳过标记
          wx.setStorageSync('hasSkippedPetInfo', true);
          
          wx.showToast({
            title: '已跳过',
            icon: 'success',
            duration: 1500
          });
          
          // 延迟跳转到首页
          setTimeout(() => {
            this.goToHomePage();
          }, 1500);
        }
      }
    });
  },

  // 提交宠物信息
  async submitPetInfo() {
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    // 准备提交数据
    const submitData = {
      ...this.data.petInfo,
      // 添加其他必填字段
      Breed: "", // 品种（目前未收集，留空）
      Vaccines: JSON.stringify({ rabies: false, combo: false, other: false }), // 疫苗信息（默认值）
      UserId: app.globalData.userInfo.userId || ''
    };
    // 调用API接口
    await this.callSubmitApi(submitData);
  },

  // 调用API接口
  async callSubmitApi(petData) {
    const avatarUrl = await this.uploadAvatarIfNeeded(petData.AvatarUrl);
    petData={...petData,AvatarUrl:app.globalData.domain+avatarUrl};
    console.log('提交数据:', petData);
    const apiUrl = `${app.globalData.baseURL}/pets/createpet`;
    
    wx.request({
      url: apiUrl,
      method: 'POST',
      data: petData,
      header: {
        'content-type': 'application/json',
        // 如果有token，需要在这里添加
        // 'Authorization': 'Bearer ' + wx.getStorageSync('token')
      },
      success: (res) => {
        wx.hideLoading();
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
          
          // 延迟跳转到首页
          setTimeout(() => {
            this.goToHomePage();
          }, 1500);
        } else {
          // API返回错误
          wx.showToast({
            title: res.data?.message || '保存失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('API请求失败:', error);
        
        // 网络错误，使用模拟提交
        this.simulateSubmit(petData);
      }
    });
  },
  async uploadAvatarIfNeeded(avatarUrl) {
    if (!avatarUrl || 
        (avatarUrl.startsWith('http') && !avatarUrl.startsWith('http://tmp/'))) {
      return avatarUrl;
    }
     // 1. 前置校验：获取有效 Token
     const token = app.getValidToken();
     if (!token) {
       wx.showToast({ title: '请先登录', icon: 'none' });
       wx.navigateTo({ url: '/pages/login/login' });
       return;
     }
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: `${app.globalData.baseURL}/pets/upload-avatar`,
        filePath: avatarUrl,
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

  // 跳转到首页
  goToHomePage() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 页面卸载
  onUnload() {
    console.log('宠物信息收集页面卸载');
  },
});