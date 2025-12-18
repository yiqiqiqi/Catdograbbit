// pages/feedback/feedback.js
const { post } = require('../../utils/request');
const { chooseImage, compressImage, showModal } = require('../../utils/util');

Page({
  data: {
    // 反馈表单
    feedbackTypes: [
      { name: '功能建议', value: 'suggestion' },
      { name: '问题反馈', value: 'bug' },
      { name: '体验问题', value: 'experience' },
      { name: '内容问题', value: 'content' },
      { name: '其他', value: 'other' }
    ],
    typeIndex: 0,
    contact: '',
    content: '',
    images: [],
    
    // 加载状态
    isLoading: false
  },

  onLoad() {
    console.log('意见反馈页面加载');
  },

  // 类型选择
  onTypeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({ typeIndex: index });
  },

  // 联系方式输入
  onContactInput(e) {
    this.setData({ contact: e.detail.value });
  },

  // 内容输入
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 添加图片
  async onAddImage() {
    if (this.data.images.length >= 3) {
      wx.showToast({
        title: '最多只能添加3张图片',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    try {
      const tempFilePaths = await chooseImage(3 - this.data.images.length);
      
      if (tempFilePaths && tempFilePaths.length > 0) {
        wx.showLoading({ title: '处理图片中...', mask: true });
        
        const newImages = [...this.data.images];
        
        for (const tempFilePath of tempFilePaths) {
          try {
            // 压缩图片
            const compressedPath = await compressImage(tempFilePath, 0.7);
            newImages.push(compressedPath);
          } catch (error) {
            console.error('处理图片失败:', error);
            newImages.push(tempFilePath);
          }
        }
        
        this.setData({ images: newImages });
        wx.hideLoading();
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
  },

  // 提交反馈
  async onSubmit() {
    // 验证表单
    if (!this.validateForm()) {
      return;
    }

    this.setData({ isLoading: true });

    try {
      const feedbackData = {
        type: this.data.feedbackTypes[this.data.typeIndex].value,
        contact: this.data.contact.trim(),
        content: this.data.content.trim(),
        images: this.data.images
      };

      console.log('提交反馈数据:', feedbackData);

      // 调用提交接口
      await post('/feedback', feedbackData);

      // 提交成功
      wx.showToast({
        title: '提交成功',
        icon: 'success',
        duration: 1500
      });

      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      console.error('提交反馈失败:', error);
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 复制微信号
  onCopyWechat() {
    wx.setClipboardData({
      data: 'petdiary-service',
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 发送邮件
  onSendEmail() {
    wx.setClipboardData({
      data: 'support@petdiary.com',
      success: () => {
        wx.showToast({
          title: '邮箱已复制',
          icon: 'success'
        });
      }
    });
  },

  // 验证表单
  validateForm() {
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    if (this.data.content.trim().length < 10) {
      wx.showToast({
        title: '反馈内容至少10个字',
        icon: 'none',
        duration: 2000
      });
      return false;
    }

    return true;
  }
});