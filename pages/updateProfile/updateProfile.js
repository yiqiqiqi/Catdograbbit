// pages/updateProfile/updateProfile.js
const app = getApp();
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

Page({
  data: {
    avatarUrl: defaultAvatarUrl,
    tempAvatarUrl: '', // 新选择的临时头像路径
    hasNewAvatar: false, // 是否选择了新头像
    nickname: '',
    userInfo: {},
    gender: 0,
    genderIndex: -1,
    genderOptions: ['男', '女', '保密'],
    birthday: '',
    region: [],
    regionDisplayText: '',
    experience: 0,
    isSubmitting: false
  },

  onChooseAvatar(e) {
    const tempAvatarUrl = e.detail.avatarUrl;
    console.log('新选择的头像临时路径:', tempAvatarUrl);
    this.setData({ 
      tempAvatarUrl: tempAvatarUrl,
      hasNewAvatar: true,
      avatarUrl: tempAvatarUrl // 预览用
    });
  },

  onLoad: function(options) {
    // 获取用户信息
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    console.log("onLoad-userInfo", userInfo);
    
    // 处理头像URL
    let avatarUrl = userInfo.avatarUrl || defaultAvatarUrl;
    
    // 设置性别索引
    let genderIndex = -1;
    if (userInfo.gender !== undefined) {
      if (userInfo.gender === 1) genderIndex = 0;
      else if (userInfo.gender === 2) genderIndex = 1;
      else if (userInfo.gender === 0) genderIndex = 2;
    }
    
    // 处理地区数据
    let region = [];
    let regionDisplayText = '';
    
    if (userInfo.region) {
      if (Array.isArray(userInfo.region)) {
        region = userInfo.region;
        regionDisplayText = userInfo.region.join(' ');
      } else if (typeof userInfo.region === 'string') {
        region = userInfo.region.split(' ');
        regionDisplayText = userInfo.region;
      }
    }
    
    this.setData({
      userInfo: userInfo,
      avatarUrl: avatarUrl,
      nickname: userInfo.nickName || '',
      gender: userInfo.gender || 0,
      genderIndex: genderIndex,
      birthday: userInfo.birthday || '',
      region: region,
      regionDisplayText: regionDisplayText,
      experience: userInfo.experience || 0
    });
  },

  // 昵称输入
  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 性别选择
  onGenderChange: function(e) {
    const index = parseInt(e.detail.value);
    let genderValue = 0;
    if (index === 0) genderValue = 1;
    else if (index === 1) genderValue = 2;
    else if (index === 2) genderValue = 0;
    
    this.setData({
      genderIndex: index,
      gender: genderValue
    });
  },

  // 选择生日
  onBirthdayChange: function(e) {
    this.setData({
      birthday: e.detail.value
    });
  },

  // 选择地区
  onRegionChange: function(e) {
    console.log('地区选择结果:', e.detail.value);
    const region = e.detail.value;
    this.setData({
      region: region,
      regionDisplayText: region.join(' ')
    });
  },

  // 选择养宠经验
  selectExperience: function(e) {
    const experience = parseInt(e.currentTarget.dataset.exp);
    this.setData({
      experience: experience
    });
  },

  // 提交表单
  submitForm: function() {
    const that = this;
    
    // 验证必填字段
    if (!this.data.nickname.trim()) {
      wx.showToast({
        title: '请输入昵称',
        icon: 'none'
      });
      return;
    }

    // 防止重复提交
    if (this.data.isSubmitting) {
      return;
    }

    this.setData({
      isSubmitting: true
    });

    wx.showLoading({ title: '保存中...' });

    // 构建更新数据
    const updateData = {
      NickName: this.data.nickname,
      Gender: this.data.gender,
      Birthday: this.data.birthday,
      Region: this.data.region,
      Experience: this.data.experience
    };
    
    console.log("提交的更新数据:", updateData);

    // 处理头像逻辑
    this.processAvatarUpload(updateData)
      .then(() => {
        // 更新资料到服务器
        return this.updateProfileToServer(updateData);
      })
      .then(() => {
        wx.hideLoading();
        that.setData({ isSubmitting: false });
        
        wx.showToast({
          title: '资料更新成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              wx.navigateBack();
            }, 2000);
          }
        });
      })
      .catch(err => {
        console.error('保存失败:', err);
        wx.hideLoading();
        that.setData({ isSubmitting: false });
        
        wx.showToast({
          title: err.message || '保存失败',
          icon: 'none',
          duration: 3000
        });
      });
  },

  // 处理头像上传
  processAvatarUpload: function(updateData) {
    return new Promise((resolve, reject) => {
      // 如果没有选择新头像，直接resolve
      if (!this.data.hasNewAvatar) {
        console.log('未选择新头像，跳过上传');
        resolve();
        return;
      }

      // 检查临时头像路径
      if (!this.data.tempAvatarUrl) {
        console.log('没有临时头像路径，跳过上传');
        resolve();
        return;
      }

      console.log('开始上传新头像:', this.data.tempAvatarUrl);

      // 上传头像
      this.uploadAvatar()
        .then(avatarUrl => {
          if (avatarUrl) {
            updateData.AvatarUrl = avatarUrl;
            console.log('头像上传成功:', avatarUrl);
          }
          resolve();
        })
        .catch(err => {
          reject(new Error('头像上传失败: ' + err.message));
        });
    });
  },

  // 上传头像到服务器获取URL
  uploadAvatar: function() {
    return new Promise((resolve, reject) => {
      const uploadUrl = `${app.globalData.baseURL}/auth/avatarfile`;
      console.log('上传头像到:', uploadUrl);
       // 1. 前置校验：获取有效 Token
    const token = app.getValidToken();
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
      wx.uploadFile({
        url: uploadUrl,
        filePath: this.data.tempAvatarUrl,
        name: 'File',
        header: {'Authorization': `Bearer ${token}`,},
        success: (res) => {
          console.log('上传响应状态码:', res.statusCode);
          console.log('上传响应数据:', res.data);
          
          if (res.statusCode === 401) {
            reject(new Error('未授权，请重新登录'));
            return;
          }
          
          if (res.statusCode !== 200) {
            reject(new Error(`上传失败: HTTP ${res.statusCode}`));
            return;
          }
          
          try {
            const data = JSON.parse(res.data);
            console.log('上传成功:', data);
            
            if (data.code === 0) {
              resolve(data.data.url);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (parseError) {
            reject(new Error('服务器返回数据格式错误'));
          }
        },
        fail: (err) => {
          console.error('上传请求失败:', err);
          reject(new Error('网络请求失败: ' + err.errMsg));
        }
      });
    });
  },

  // 更新资料到服务器
  updateProfileToServer: function(updateData) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.baseURL}/auth/update-profile`,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${app.globalData.token}`,
          'Content-Type': 'application/json'
        },
        data: updateData,
        success: (res) => {
          console.log('更新资料响应:', res.data);
          
          if (res.data.code === 0) {
            // 更新本地存储的用户信息
            const updatedUserInfo = {
              ...this.data.userInfo,
              nickName: updateData.NickName,
              gender: updateData.Gender,
              birthday: updateData.Birthday,
              region: updateData.Region,
              experience: updateData.Experience
            };
            
            // 如果有新头像URL，更新头像
            if (updateData.AvatarUrl) {
              updatedUserInfo.avatarUrl = app.globalData.domain + updateData.AvatarUrl;
            }
            
            console.log("更新后的用户信息:", updatedUserInfo);
            wx.setStorageSync('userInfo', updatedUserInfo);
            app.globalData.userInfo = updatedUserInfo;
            
            resolve();
          } else {
            const errorMsg = res.data.message || '未知错误';
            reject(new Error('更新失败: ' + errorMsg));
          }
        },
        fail: (error) => {
          console.error('更新资料请求失败:', error);
          reject(new Error('网络错误'));
        }
      });
    });
  }
});