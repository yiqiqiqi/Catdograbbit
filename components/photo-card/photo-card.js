// components/photo-card/photo-card.js
const { formatTime } = require('../../utils/util');
Component({
  properties: {
    card: {
      type: Object,
      value: {},
      // observer(newVal) {
      //   // 监听card变化，重置视频播放状态
      //   if (newVal) {
      //     console.log("card.createdAt",newVal)
      //   }
      // }
    }
  },

  data: {
    // 存储各视频的播放状态 { index: boolean }
    videoPlaying: {},
  },

  methods: {
    handleInnerLongPress() {
      this.triggerEvent('longpress', { cardId: this.data.card.cardId });
    },
    onPreviewImage(e) {
      try {
        const { card } = this.data;
        if (!card?.images?.length) return;
        const updatedCard = {
          ...card,
          createTime: formatTime(card.createTime)
        };
        // 更新到页面数据
        this.setData({
          card: updatedCard
        });
        const clickIndex = e.currentTarget.dataset.index;
        // 过滤出所有图片类型的媒体
        const imageList = card.images.filter(item => item.mediaType === 'image');
        if (!imageList.length) return;

        // 【简化】计算当前点击图片在过滤后列表中的索引
        const currentIndex = imageList.findIndex(
          item => item.imageUrl === card.images[clickIndex].imageUrl
        );

        // 预览图片（兼容currentIndex为-1的异常情况）
        wx.previewImage({
          current: imageList[Math.max(currentIndex, 0)].imageUrl,
          urls: imageList.map(item => item.imageUrl)
        });
      } catch (error) {
        console.error('预览图片失败：', error);
      }
    },
    onPlayVideo(e) {
      try {
        const { card } = this.data;
        if (!card?.images?.length) return;

        const index = e.currentTarget.dataset.index;
        const currentItem = card.images[index];
        // 非视频类型直接返回
        if (currentItem.mediaType !== 'video') return;

        const videoId = `video-${index}`;
        const videoContext = wx.createVideoContext(videoId, this);
        if (!videoContext) return;

        // 暂停所有其他正在播放的视频
        this.pauseAllVideosExcept(index);

        // 播放当前视频
        videoContext.play();
      } catch (error) {
        console.error('播放视频失败：', error);
      }
    },
    pauseAllVideosExcept(excludeIndex) {
      const { card, videoPlaying } = this.data;
      if (!card?.images?.length) return;

      Object.keys(videoPlaying).forEach(index => {
        const idx = Number(index);
        // 只暂停：非当前视频 + 是视频类型 + 正在播放
        if (idx !== excludeIndex && videoPlaying[idx] && card.images[idx]?.mediaType === 'video') {
          const videoContext = wx.createVideoContext(`video-${idx}`, this);
          videoContext?.pause();
          // 同步更新播放状态
          this.setData({ [`videoPlaying.${idx}`]: false });
        }
      });
    },
    onVideoPlay(e) {
      try {
        const index = e.currentTarget.dataset.index;
        this.setData({
          [`videoPlaying.${index}`]: true
        });
      } catch (error) {
        console.error('更新视频播放状态失败：', error);
      }
    },
    onVideoPause(e) {
      try {
        const index = e.currentTarget.dataset.index;
        this.setData({
          [`videoPlaying.${index}`]: false
        });
      } catch (error) {
        console.error('更新视频暂停状态失败：', error);
      }
    },
    onVideoEnded(e) {
      this.onVideoPause(e);
    },

    /**
     * 【补充】适配WXML的data-type属性 - 获取媒体列表的类型
     * @param {Array} mediaList - 媒体列表
     * @returns {string} image/video/mix/''
     */
    getMediaType(mediaList) {
      if (!mediaList?.length) return '';
      // 去重获取所有媒体类型
      const types = [...new Set(mediaList.map(item => item.mediaType))];
      return types.length === 1 ? types[0] : 'mix';
    },

    /**
     * 格式化视频时长（秒 → MM:SS）
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时长
     */
    formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00';
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    },
    /**
     * 分享功能 - 触发自定义事件给父组件
     */
    onShare() {
      this.triggerEvent('share', { card: this.data.card });
    }
  },

  /**
   * 生命周期：组件销毁时暂停所有视频，避免内存泄漏
   */
  lifetimes: {
    detached() {
      try {
        const { card, videoPlaying } = this.data;
        if (!card?.images?.length) return;

        // 暂停所有正在播放的视频
        Object.keys(videoPlaying).forEach(index => {
          const idx = Number(index);
          if (videoPlaying[idx]) {
            const videoContext = wx.createVideoContext(`video-${idx}`, this);
            videoContext?.pause();
          }
        });
        // 重置播放状态
        this.setData({ videoPlaying: {} });
      } catch (error) {
        console.error('组件销毁时暂停视频失败：', error);
      }
    }
  }
});