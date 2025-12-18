const { get } = require('../../utils/request');
const { formatTime } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    sharedCardData: null,
    shareCardLoading: false,
    hasError: false,
    errorMessage: '',
    cardId: null,
    isFromShare: false,
    loadedImages: {}, // 新增：记录图片加载状态
  },

  onLoad(options) {
    const { cardId } = options;
    console.log("分享页面 onLoad, cardId:", cardId);
    
    if (cardId) {
      this.setData({ 
        cardId,
        isFromShare: true 
      });
      this.loadSharedCard(cardId);
    } else {
      // 如果没有 cardId 参数，说明不是从分享链接进入的
      console.log("没有 cardId 参数，跳转回主页");
      this.redirectToHome();
    }
  },

  onShow() {
    console.log("分享页面 onShow");
    
    // 隐藏tabBar
    wx.hideTabBar();
    
    // 再次检查是否有 cardId，防止某些情况下参数丢失
    if (!this.data.cardId && !this.data.isFromShare) {
      console.log("onShow 检查：没有 cardId，跳转回主页");
      this.redirectToHome();
      return;
    }
  },

  onUnload() {
    // 显示tabBar
    wx.showTabBar();
  },

  // 跳转回主页
  redirectToHome() {
    // 使用 reLaunch 关闭所有页面并打开主页
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  onShareAppMessage() {
    const { sharedCardData } = this.data;
    if (sharedCardData) {
      const imageUrl = sharedCardData.imageList && sharedCardData.imageList.length > 0 
        ? sharedCardData.imageList[0] 
        : '/images/share-default.jpg';
      
      return {
        title: `来看看${sharedCardData.petName}的萌照！`,
        path: `/pages/shared-card/shared-card?cardId=${sharedCardData.id}`,
        imageUrl: imageUrl
      };
    }
    return {
      title: '来看看这个可爱的宠物照片！',
      path: '/pages/index/index',
      imageUrl: '/images/share-default.jpg'
    };
  },

  onShareTimeline() {
    const { sharedCardData } = this.data;
    if (sharedCardData) {
      const imageUrl = sharedCardData.imageList && sharedCardData.imageList.length > 0 
        ? sharedCardData.imageList[0] 
        : '/images/share-default.jpg';
      
      return {
        title: `来看看${sharedCardData.petName}的萌照！`,
        imageUrl: imageUrl
      };
    }
    return {
      title: '来看看这个可爱的宠物照片！',
      imageUrl: '/images/share-default.jpg'
    };
  },

  loadSharedCard(cardId) {
    console.log("cardId", cardId);
    this.setData({ shareCardLoading: true });
    
    get(`/pets/photo-card-groups/${cardId}`, {}, { showLoading: false })
      .then(response => {
        console.log("response", response);
        this.setData({ shareCardLoading: false });
        if (response != null) {
          const sharedCard = this.transformCardData(response);
          this.setData({ sharedCardData: sharedCard, hasError: false });
          console.log("sharedCardData", this.data.sharedCardData);
        } else {
          this.setErrorState('分享的卡片不存在或已过期');
        }
      })
      .catch(error => {
        this.setData({ shareCardLoading: false });
        this.handleLoadError(error, '加载失败，请重试');
      });
  },

  // 图片加载成功回调
  onImageLoad(e) {
    const { index } = e.currentTarget.dataset;
    console.log(`分享页面图片 ${index} 加载完成`);
    
    // 使用对象记录已加载的图片
    const loadedImages = {
      ...this.data.loadedImages,
      [index]: true
    };
    this.setData({ loadedImages });
  },

  // 图片加载失败回调
  onImageError(e) {
    console.log('分享页面图片加载失败:', e.detail.errMsg);
    const { index } = e.currentTarget.dataset;
    console.log(`分享页面图片 ${index} 加载失败`);
    
    // 标记为加载失败
    const loadedImages = {
      ...this.data.loadedImages,
      [index]: 'error'
    };
    this.setData({ loadedImages });
  },

  // 预览图片
  previewSharedImage(e) {
    const { sharedCardData } = this.data;
    
    if (!sharedCardData || !sharedCardData.imageList || sharedCardData.imageList.length === 0) {
      wx.showToast({
        title: '没有可预览的图片',
        icon: 'none'
      });
      return;
    }
    
    const currentIndex = e.currentTarget.dataset.index || 0;
    const imageUrls = sharedCardData.imageList;
    
    wx.showLoading({
      title: '加载中...',
    });
    
    // 检查第一张图片是否可访问
    wx.getImageInfo({
      src: imageUrls[0],
      success: () => {
        wx.hideLoading();
        // 图片可访问，进行预览
        wx.previewImage({
          current: imageUrls[currentIndex],
          urls: imageUrls,
          success: () => {
            console.log('图片预览成功');
          },
          fail: (error) => {
            console.error('预览失败:', error);
            wx.showToast({
              title: '预览失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('图片加载失败:', error);
        wx.showToast({
          title: '图片加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 转换卡片数据，支持多张图片
  transformCardData(responseData) {
    // 检查返回的数据结构
    if (!responseData) {
      return this.getDefaultCardData();
    }
    
    // 如果返回的是数组，说明是多张照片
    if (Array.isArray(responseData.photos)) {
      if (responseData.photos.length === 0) {
        return this.getDefaultCardData();
      }
      
      // 使用第一张照片的基本信息
      const firstPhoto = responseData;
      
      // 构建图片列表
      const imageList = responseData.photos.map(photo => {
        const imageUrl = photo.imageUrl ? `${app.globalData.domain}${photo.imageUrl}` : '/images/default-photo.jpg';
        const mediaType=photo.mediaType;
        const isLivePhoto=photo.isLivePhoto;
        return {imageUrl,mediaType,isLivePhoto}
      });
      
      return {
        id: firstPhoto.cardId || 'unknown', // 使用 cardId 作为卡片的ID
        petId: firstPhoto.petId || 'unknown',
        cardId: firstPhoto.cardId || 'unknown',
        petName: firstPhoto.petName || '宠物',
        petAvatarUrl:firstPhoto.petAvatarUrl || 'unknow',
        description: firstPhoto.description || `记录了宠物的萌照`,
        createdAt: formatTime(firstPhoto.createdAt),
        imageList: imageList,
       
      };
    } 
    // 如果返回的是单个对象
    else if (typeof responseData === 'object') {
      // 构建图片列表
      let imageList = [];
      
      if (responseData.imageUrl) {
        imageList = [`${app.globalData.domain}${responseData.imageUrl}`];
      } else {
        imageList = ['/images/default-photo.jpg'];
      }
      
      return {
        id: responseData.id?.toString() || responseData.cardId || 'unknown',
        petId: responseData.petId || 'unknown',
        cardId: responseData.cardId || 'unknown',
        petName: responseData.petName || '宠物',
        description: responseData.description || `记录了宠物的萌照`,
        createdAt: formatTime(firstPhoto.createdAt),
        imageList: imageList
      };
    }
    // 未知的数据格式
    else {
      return this.getDefaultCardData();
    }
  },

  // 获取默认卡片数据
  getDefaultCardData() {
    return {
      id: 'unknown',
      petId: 'unknown',
      cardId: 'unknown',
      petName: '宠物',
      description: '数据加载异常',
      createdAt: new Date().toISOString(),
      imageList: ['/images/default-photo.jpg']
    };
  },

  setErrorState(message) {
    this.setData({ hasError: true, errorMessage: message });
  },

  handleLoadError(error, defaultMessage) {
    this.setErrorState(defaultMessage);
    wx.showToast({ title: '操作失败', icon: 'none' });
  },

  onRetryLoad() {
    const { cardId } = this.data;
    if (cardId) {
      this.loadSharedCard(cardId);
    }
  }
});