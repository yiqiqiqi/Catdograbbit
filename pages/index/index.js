
const { get, delete: del } = require('../../utils/request');
const { generateCardId, formatTime, formatCreateTime } = require('../../utils/util');
const app = getApp();

// 全局常量定义（抽离魔法值，提升可维护性）
const CONSTANTS = {
  DEFAULT_AVATAR: '/images/default-pet-avatar.jpg',
  DEFAULT_PHOTO: '/images/default-photo.jpg',
  DEFAULT_SHARE_IMG: '/images/share-default.jpg',
  STORAGE_KEY: 'photoCards',
  PAGE_SIZE: 20,
};

Page({
  data: {
    // 加载/错误状态
    loading: false,
    hasError: false,
    errorMessage: '',
    isRefreshing: false,
    isLoadingMore: false,
    // 上传相关（原代码未实际使用，保留占位）
    uploadProgress: 0,
    isUploading: false,
    currentUploadCardId: null,
    // 业务数据
    petList: [],
    selectedPet: null, // 保留选中宠物状态，供发布功能使用
    photoCards: [], // 存储原始卡片对象数组（接口返回的结构）
    groupedPhotoCards: [], // 处理后供页面展示的卡片数据
    totalPhotoCount: 0, // 所有卡片的图片总数
    currentShareCard: null,
    needRefresh: false,
    // 分页配置
    pageSize: CONSTANTS.PAGE_SIZE,
    hasMore: true,
  },

  // ========== 生命周期钩子 ==========
  onLoad(options) {
    this.initPage();
  },

  onShow() {
    const { petUpdated } = app.globalData;
    if (petUpdated) {
      app.globalData.petUpdated = false;
      !this.data.isRefreshing && this.initPage();
    }
  },

  onPullDownRefresh() {
    this.handlePullDownRefresh();
  },

  // ========== 分享配置 ==========
  
  shareCard(e) {
    const { card } = e.detail || {};
    if (!card?.cardId) {
      wx.showToast({ title: '分享失败：卡片数据异常', icon: 'none' });
      return;
    }

    this.setData({ currentShareCard: card });
    wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] });
  },
  onShareAppMessage() {
    return this.generateShareConfig();
  },
  onShareTimeline() {
    const { title, imageUrl } = this.generateShareConfig();
    return { title, imageUrl };
  },

  // ========== 核心业务逻辑 ==========
  /**
   * 初始化页面：权限校验 -> 加载宠物 -> 加载所有宠物的照片卡片
   */
  async initPage() {
    this.clearErrorState();

    // 权限校验
    const authValid = this.checkAuth();
    if (!authValid) return;

    try {
      await this.loadPets();
      await this.loadPhotoCards(); // 不再依赖selectedPet，直接加载所有卡片
    } catch (error) {
      this.handleError(error, '初始化失败，请下拉刷新重试');
    }
  },

  /**
   * 下拉刷新处理：加载宠物 -> 加载所有宠物的照片卡片
   */
  async handlePullDownRefresh() {
    this.setData({ isRefreshing: true });
    try {
      this.clearErrorState();
      await this.loadPets();
      await this.loadPhotoCards(); // 不再依赖selectedPet，直接加载所有卡片
      wx.showToast({ title: '刷新成功', icon: 'success' });
    } catch (error) {
      this.handleError(error, '刷新失败，请重试');
    } finally {
      this.setData({ isRefreshing: false });
      wx.stopPullDownRefresh();
    }
  },

  /**
   * 加载宠物列表（保留，供页面选择宠物功能使用）
   */
  async loadPets() {
    const userId = this.getUserId();
    if (!userId) throw new Error('用户ID不存在');

    const pets = await get('/pets/user/' + userId, {}, { showLoading: false });
    if (!Array.isArray(pets)) throw new Error('宠物数据格式错误');

    // 保留选中宠物逻辑（供发布功能使用）
    let selectedPet = app.globalData.selectedPet;
    if (selectedPet) {
      selectedPet = pets.find(pet => (pet.petId || pet.id) === (selectedPet.petId || selectedPet.id)) || selectedPet;
    }
    selectedPet = selectedPet || (pets.length > 0 ? { ...pets[0] } : null);

    this.setData({ petList: pets, selectedPet });
    app.globalData.selectedPet = selectedPet;
    return pets;
  },

  /**
   * 加载用户所有宠物的照片卡片（适配接口数据结构）
   */
  async loadPhotoCards() {
    this.setData({ loading: true, hasError: false, errorMessage: '' });

    try {
      const userId = this.getUserId();
      const response = await get(`/pets/moments/${userId}`, {}, { showLoading: false });
      this.processPhotoCardsResponse(response);
    } catch (error) {
      await this.handlePhotoCardsLoadError(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // ========== 数据处理 ==========
  /**
   * 处理卡片数据响应：适配接口返回的卡片对象数组结构
   */
  processPhotoCardsResponse(response) {
    const data = Array.isArray(response) ? response : (response?.code === 0 ? response.data : null);
    if (!Array.isArray(data) || data.length === 0) {
      this.setErrorState(data === null ? '数据格式错误' : '暂无照片卡片');
      this.setData({ photoCards: [], groupedPhotoCards: [], totalPhotoCount: 0 });
      return;
    }

    try {
      // 转换接口数据为页面可用格式（保留卡片基本信息 + 处理图片数据）
      const photoCards = data.map(card => ({
        id: card.id?.toString() || 'unknown',
        userId: card.userId || 'unknown',
        petId: card.petId || 'unknown',
        petName: card.petName || '未知宠物',
        petAvatar: card.petAvatar || CONSTANTS.DEFAULT_AVATAR,
        cardId: card.cardId || 'unknown',
        description: card.description || '记录了宠物的萌照',
        createdAt: card.createdAt || new Date().toISOString(),
        // 处理卡片下的图片数组
        photos: (card.photos || []).map(photo => ({
          id: photo.id?.toString() || 'unknown',
          photoId: photo.photoId || 'unknown',
          imageUrl: photo.imageUrl,
          fileName: photo.fileName || 'unknown',
          description: photo.description || '',
          createdAt: photo.createdAt || new Date().toISOString(),
          mediaType:photo.mediaType,
          isLivePhoto:photo.isLivePhoto
        }))
      }));

      // 分组处理（每个卡片天然对应一个分组）
      this.groupPhotoCards(photoCards);
      this.setData({ photoCards, hasError: false, errorMessage: '' });
      this.savePhotoCardsToStorage(photoCards);
    } catch (error) {
      console.error('数据转换失败:', error);
      this.setErrorState('数据转换失败');
    }
  },

  /**
   * 分组处理卡片数据：适配接口的卡片+图片数组结构
   * 每个卡片对应一个分组，直接处理其photos数组生成展示数据
   */
  groupPhotoCards(photoCards) {
    // 处理每个卡片，生成页面展示的分组数据
    const groupedCards = photoCards.map(card => {
      const images = card.photos.map(photo => ({
        id: photo.id,
        imageUrl: photo.imageUrl && photo.imageUrl.startsWith("http") 
      ? photo.imageUrl 
      : `${app.globalData.domain}${photo.imageUrl}`,
        mediaType:photo.mediaType
      }));
      const imageUrls = images.map(img => img.imageUrl);

      return {
        id: card.id,
        cardId: card.cardId,
        petId: card.petId,
        petName: card.petName,
        petAvatar: card.petAvatar,
        createdAt: formatCreateTime(card.createdAt),
        description: card.description,
        images, // 供预览的图片数组（带id和完整URL）
        imageUrls, // 纯图片URL数组
        photoCount: images.length, // 该卡片的图片数量
      };
    });

    // 计算所有卡片的图片总数
    const totalPhotoCount = groupedCards.reduce((sum, card) => sum + card.photoCount, 0);

    this.setData({
      groupedPhotoCards: groupedCards,
      totalPhotoCount: totalPhotoCount
    });
    console.log("groupedPhotoCards",this.data.groupedPhotoCards)
  },

  // ========== 缓存处理 ==========
  async savePhotoCardsToStorage(cards) {
    try {
      await wx.setStorage({ key: CONSTANTS.STORAGE_KEY, data: cards });
    } catch (error) {
      console.error('保存卡片缓存失败:', error);
    }
  },

  async getPhotoCardsFromStorage() {
    try {
      const res = await wx.getStorage({ key: CONSTANTS.STORAGE_KEY });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      console.error('读取卡片缓存失败:', error);
      return [];
    }
  },

  // ========== 错误处理 ==========
  handleError(error, defaultMsg = '操作失败') {
    console.error(error);
    this.setErrorState(defaultMsg);
    wx.showToast({ title: defaultMsg, icon: 'none' });
    return Promise.reject(error);
  },

  /**
   * 卡片加载失败处理：加载用户所有缓存卡片
   */
  async handlePhotoCardsLoadError(error) {
    this.setErrorState('网络加载失败，正在尝试加载缓存...');
    const storedCards = await this.getPhotoCardsFromStorage();
    
    if (storedCards.length > 0) {
      // 对缓存数据重新分组处理
      this.groupPhotoCards(storedCards);
      this.setData({ photoCards: storedCards, hasError: false, errorMessage: '' });
    } else {
      this.setErrorState('加载失败，请检查网络连接');
    }
  },

  setErrorState(message) {
    this.setData({ hasError: true, errorMessage: message, loading: false });
  },

  clearErrorState() {
    this.setData({ hasError: false, errorMessage: '' });
  },

  // ========== 工具方法 ==========
  checkAuth() {
    if (!app.globalData.token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return false;
    }
    if (!this.getUserId()) {
      this.setErrorState('用户信息未找到，请重新登录');
      return false;
    }
    return true;
  },

  getUserId() {
    return app.globalData.userInfo?.userId;
  },

  getPetId(pet) {
    return pet?.petId || pet?.id;
  },

  generateShareConfig() {
    const { selectedPet, currentShareCard } = this.data;
    const defaultTitle = selectedPet ? `来看看${selectedPet.name}的萌照！` : '萌宠照片分享';

    if (currentShareCard) {
      return {
        title: `来看看${currentShareCard.petName}的萌照！`,
        path: `/pages/shared-card/shared-card?cardId=${currentShareCard.cardId}`,
        imageUrl: currentShareCard.imageUrls?.[0] || CONSTANTS.DEFAULT_SHARE_IMG,
      };
    }

    return {
      title: defaultTitle,
      path: '/pages/index/index',
      imageUrl: CONSTANTS.DEFAULT_SHARE_IMG,
    };
  },

  // ========== 事件处理 ==========
  /**
   * 宠物切换事件：仅更新选中状态，不再清空/重新加载卡片
   */
  onPetChange(e) {
    const { selectedPet } = e.detail;
    if (!selectedPet?.name) {
      wx.showToast({ title: '宠物名称缺失，请编辑宠物', icon: 'none' });
      return;
    }

    // 仅更新选中宠物状态，不影响卡片展示
    this.setData({ selectedPet: { ...selectedPet } });
    app.globalData.selectedPet = selectedPet;
  },

  /**
   * 宠物删除事件：更新宠物列表，刷新所有卡片
   */
  onPetDeleted(e) {
    const { newPetList, newSelectedPet } = e.detail;
    this.setData({ petList: newPetList, selectedPet: newSelectedPet });
    app.globalData.selectedPet = newSelectedPet;

    // 刷新所有卡片，自动移除已删除宠物的卡片
    this.loadPhotoCards().catch(this.handleError.bind(this));
  },

  onEditPet(e) {
    const { pet } = e.detail;
    wx.navigateTo({
      url: `/pages/pet-edit/pet-edit?editData=${encodeURIComponent(JSON.stringify(pet))}`,
    });
  },

  onAddPet() {
    wx.navigateTo({ url: '/pages/pet-edit/pet-edit' });
  },

  chooseImages() {
    const { selectedPet } = this.data;
    if (!selectedPet) {
      wx.showToast({ title: '请先选择宠物（用于发布新照片）', icon: 'none' });
      return;
    }

    const petStr = encodeURIComponent(JSON.stringify(selectedPet));
    wx.navigateTo({ url: `/pages/publish-moment/publish-moment?pet=${petStr}` });
  },

  previewImage(e) {
    console.log(e.detail);
    const { urls, index = 0 } = e.detail || {};
    if (!urls || !urls.length) {
      wx.showToast({ title: '无法预览图片：无有效图片链接', icon: 'none' });
      return;
    }
    wx.previewImage({
      current: urls[index],
      urls,
      fail: () => wx.showToast({ title: '预览失败，请重试', icon: 'none' }),
    });
  },
  onCardLongPress(e) {
    const { cardId } = e.detail;
    if (!cardId) return;
    wx.showActionSheet({
      itemList: ['删除卡片'],
      success: (res) => res.tapIndex === 0 && this.deletePhotoCard(cardId),
    });
  },

  deletePhotoCard(cardId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张卡片吗？',
      success: (res) => res.confirm && this.performDeletePhotoCard(cardId),
    });
  },

  async performDeletePhotoCard(cardId) {
    wx.showLoading({ title: '删除中...' });
    try {
      await del(`/pets/moments/${this.getUserId()}/${cardId}`, {}, { showLoading: false });
      await this.handlePullDownRefresh();
      wx.showToast({ title: '删除成功', icon: 'success' });
    } catch (error) {
      this.handleError(error, '删除失败，请重试');
    } finally {
      wx.hideLoading();
    }
  },

  onRetryLoad() {
    this.initPage();
  },
  onImageError(e) {
    console.error('图片加载失败:', e.detail);
  },
});