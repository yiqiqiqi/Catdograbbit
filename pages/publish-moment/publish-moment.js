// pages/publish-moment/index.js
const { generateCardId, formatTime, formatCreateTime } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    // 宠物相关
    selectedPet: null,
    petList: [],
    
    // 内容相关
    description: '',
    mediaList: [],
    
    // 上传状态
    isUploading: false,
    uploadProgress: 0,
    
    // 当前上传的cardId
    currentUploadCardId: ''
  },

  onLoad: function(options) {
    // 解析传递过来的宠物数据
    if (options.pet) {
      try {
        const pet = JSON.parse(decodeURIComponent(options.pet));
        this.setData({
          selectedPet: pet
        });
      } catch (error) {
        console.error('解析宠物数据失败:', error);
        this.setData({
          selectedPet: null
        });
      }
    }
    
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '记录美好时刻'
    });
  },

  // 显示媒体选择操作菜单
  showMediaActionSheet() {
    wx.showActionSheet({
      itemList: ['拍摄照片', '从相册选择', '拍摄视频'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.takePhoto();
            break;
          case 1:
            this.chooseMedia();
            break;
          case 2:
            this.takeVideo();
            break;
        }
      }
    });
  },

  // 输入描述
  onInputDescription: function(e) {
    this.setData({
      description: e.detail.value
    });
  },

  // 选择媒体（图片/视频）
  chooseMedia: function() {
    const that = this;
    const remainingCount = 9 - this.data.mediaList.length;
    
    if (remainingCount <= 0) {
      wx.showToast({
        title: '最多只能选择9个文件',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      maxDuration: 60, // 视频最大时长60秒
      camera: 'back',
      success: function(res) {
        const tempFiles = res.tempFiles;
        const newMediaList = tempFiles.map((file, index) => {
          // 为每个文件生成唯一ID
          const mediaId = Date.now() + '_' + index;
          
          // 判断是否为实况图片
          const isLivePhoto = file.fileType === 'image' && 
                            (file.tempFilePath.toLowerCase().endsWith('.mov') || 
                             file.tempFilePath.toLowerCase().endsWith('.live'));
          
          return {
            id: mediaId,
            path: file.tempFilePath,
            thumbTempFilePath: file.thumbTempFilePath,
            type: file.fileType,
            size: file.size,
            duration: file.duration || 0,
            isLivePhoto: isLivePhoto,
            uploadStatus: 'pending'
          };
        });
        
        // 合并到现有列表
        that.setData({
          mediaList: [...that.data.mediaList, ...newMediaList]
        });
      },
      fail: function(err) {
        console.error('选择媒体失败:', err);
        wx.showToast({
          title: '选择失败',
          icon: 'none'
        });
      }
    });
  },

  // 拍照
  takePhoto: function() {
    const that = this;
    const remainingCount = 9 - this.data.mediaList.length;
    
    if (remainingCount <= 0) {
      wx.showToast({
        title: '最多只能选择9个文件',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseMedia({
      count: Math.min(remainingCount, 1),
      mediaType: ['image'],
      sourceType: ['camera'],
      camera: 'back',
      success: function(res) {
        const file = res.tempFiles[0];
        const mediaId = Date.now() + '_photo';
        
        that.setData({
          mediaList: [...that.data.mediaList, {
            id: mediaId,
            path: file.tempFilePath,
            thumbTempFilePath: file.thumbTempFilePath,
            type: 'image',
            size: file.size,
            duration: 0,
            isLivePhoto: false,
            uploadStatus: 'pending'
          }]
        });
      },
      fail: function(err) {
        console.error('拍照失败:', err);
        wx.showToast({
          title: '拍照失败',
          icon: 'none'
        });
      }
    });
  },

  // 拍视频
  takeVideo: function() {
    const that = this;
    const remainingCount = 9 - this.data.mediaList.length;
    
    if (remainingCount <= 0) {
      wx.showToast({
        title: '最多只能选择9个文件',
        icon: 'none'
      });
      return;
    }
    
    wx.chooseMedia({
      count: Math.min(remainingCount, 1),
      mediaType: ['video'],
      sourceType: ['camera'],
      maxDuration: 60,
      camera: 'back',
      success: function(res) {
        const file = res.tempFiles[0];
        const mediaId = Date.now() + '_video';
        
        that.setData({
          mediaList: [...that.data.mediaList, {
            id: mediaId,
            path: file.tempFilePath,
            thumbTempFilePath: file.thumbTempFilePath,
            type: 'video',
            size: file.size,
            duration: file.duration,
            isLivePhoto: false,
            uploadStatus: 'pending'
          }]
        });
      },
      fail: function(err) {
        console.error('拍视频失败:', err);
        wx.showToast({
          title: '拍视频失败',
          icon: 'none'
        });
      }
    });
  },

  // 预览媒体
  previewMedia: function(e) {
    const index = e.currentTarget.dataset.index;
    const media = this.data.mediaList[index];
    
    if (media.type === 'image') {
      // 预览图片
      wx.previewImage({
        current: media.path,
        urls: this.data.mediaList
          .filter(item => item.type === 'image')
          .map(item => item.path)
      });
    } else if (media.type === 'video') {
      // 预览视频
      wx.openVideoEditor({
        filePath: media.path,
        success: (res) => {
          console.log('视频编辑成功', res);
        },
        fail: (err) => {
          console.error('视频编辑失败', err);
        }
      });
    }
  },

  // 删除媒体
  removeMedia: function(e) {
    const index = e.currentTarget.dataset.index;
    const mediaList = [...this.data.mediaList];
    mediaList.splice(index, 1);
    
    this.setData({ mediaList });
  },

  // 格式化视频时长
  formatDuration: function(duration) {
    if (!duration) return '00:00';
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  // 发布动态
  onPublish: function() {
    if (!this.data.selectedPet) {
      wx.showToast({
        title: '请选择宠物',
        icon: 'none'
      });
      return;
    }
    
    if (!this.data.description.trim() && this.data.mediaList.length === 0) {
      wx.showToast({
        title: '请填写内容或选择照片',
        icon: 'none'
      });
      return;
    }

    // 检查是否有实况图片需要特殊处理
    const livePhotos = this.data.mediaList.filter(media => media.isLivePhoto);
    if (livePhotos.length > 0) {
      // 实况图片需要特殊处理
      wx.showModal({
        title: '实况图片提示',
        content: `检测到${livePhotos.length}张实况图片，将自动提取为动态照片`,
        showCancel: false,
        success: () => {
          this.startUpload();
        }
      });
    } else {
      this.startUpload();
    }
  },

  // 开始上传
  startUpload: function() {
    const { selectedPet, description, mediaList } = this.data;
    
    if (mediaList.length === 0) {
        wx.showToast({
          title: '请添加照片',
          icon: 'none'
        });
        return;
    } else {
      // 有媒体文件，先上传媒体
      this.uploadMediaFiles(selectedPet, description, mediaList);
    }
  },

  // 上传媒体文件
  uploadMediaFiles: function(selectedPet, description, mediaList) {
    const cardId = generateCardId();
    this.setData({
      isUploading: true,
      uploadProgress: 0,
      currentUploadCardId: cardId
    });

    wx.showLoading({ 
      title: `上传中 (0/${mediaList.length})`, 
      mask: true 
    });

    let uploadedCount = 0;
    const totalCount = mediaList.length;
    
    const updateProgress = () => {
      uploadedCount++;
      this.setData({ 
        uploadProgress: Math.round((uploadedCount / totalCount) * 100) 
      });
      wx.showLoading({ 
        title: `上传中 (${uploadedCount}/${totalCount})`, 
        mask: true 
      });
    };

    const uploadPromises = mediaList.map((media, index) => 
      this.uploadSingleMedia(media, selectedPet, cardId, index, description)
    );

    Promise.all(uploadPromises)
      .then(results => {
        this.setData({ 
          isUploading: false, 
          uploadProgress: 100 
        });
        wx.hideLoading();
        this.handleUploadResults(results, cardId, totalCount);
      })
      .catch(error => {
        console.error('上传失败:', error);
        this.setData({ 
          isUploading: false, 
          uploadProgress: 0 
        });
        wx.hideLoading();
        wx.showToast({ 
          title: '上传失败', 
          icon: 'none' 
        });
      });

    uploadPromises.forEach(promise => 
      promise.then(() => {
        updateProgress();
      }).catch(() => {
        updateProgress();
      })
    );
  },

  // 上传单个媒体文件
  uploadSingleMedia: function(media, selectedPet, cardId, index, description) {
    console.log("selectedPet",selectedPet)
    const duration =media.duration>1? Math.round(media.duration):0; // 四舍五入取整
    // 1. 前置校验：获取有效 Token
    const token = app.getValidToken();
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
      return;
    }
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: app.globalData.baseURL + '/pets/publish-moment',
        filePath: media.path,
        name: 'file',
        formData: {
          PetId: selectedPet.petId,
          CardId: cardId,
          Description: index === 0 ? (description || "") : "", 
          UploadIndex: index,
          MediaType: media.type,
          IsLivePhoto: media.isLivePhoto ? 1 : 0,
          Duration: duration,
          petname:selectedPet.name,
          petavatarUrl:selectedPet.avatarUrl
        },
        header: { 'Authorization': `Bearer ${token}` },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve({
              success: data.code === 0,
              card: data.data,
              error: data.message,
              index: index,
              cardId: cardId
            });
          } catch (e) {
            resolve({ 
              success: false, 
              error: '解析响应失败', 
              index: index, 
              cardId: cardId 
            });
          }
        },
        fail: (error) => {
          resolve({ 
            success: false, 
            error: '网络请求失败', 
            index: index, 
            cardId: cardId 
          });
        }
      });
    });
  },

  // 处理上传结果
  handleUploadResults: function(results, cardId, totalCount) {
    const successfulUploads = results.filter(result => result.success);
    
    if (successfulUploads.length === totalCount) {
      wx.showToast({
        title: '发布成功！',
        icon: 'success',
        duration: 2000
      });

      // 返回上一页并刷新数据
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage && prevPage.handlePullDownRefresh) {
        prevPage.handlePullDownRefresh();
      }

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } else {
      const failedCount = totalCount - successfulUploads.length;
      wx.showToast({
        title: `部分上传失败 (${failedCount}/${totalCount})`,
        icon: 'none',
        duration: 3000
      });
      
      // 可以选择重试或继续
      wx.showModal({
        title: '上传提示',
        content: `${failedCount}个文件上传失败，是否重试？`,
        success: (res) => {
          if (res.confirm) {
            this.startUpload();
          }
        }
      });
    }
  },
  // 取消发布
  onCancel: function() {
    if (this.data.description.trim() || this.data.mediaList.length > 0) {
      wx.showModal({
        title: '提示',
        content: '确定要放弃编辑的内容吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  },

  onUnload: function() {
    // 清理临时文件（可选）
    // this.data.mediaList.forEach(media => {
    //   // 可以在这里清理临时文件
    // });
  }
});