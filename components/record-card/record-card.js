// 引入通用工具
const { formatDate, getRecordTypeName } = require('../../utils/util');

Component({
  /**
   * 组件属性列表
   */
  properties: {
    // 记录ID（必传）
    recordId: {
      type: String,
      value: ''
    },
    // 记录类型（diary/health/activity，必传）
    type: {
      type: String,
      value: 'diary'
    },
    // 记录内容（必传）
    content: {
      type: String,
      value: ''
    },
    // 图片列表（可选）
    images: {
      type: Array,
      value: []
    },
    // 创建时间（必传）
    createTime: {
      type: String,
      value: ''
    },
    // 是否显示操作按钮（编辑/删除，可选）
    showActions: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件初始数据
   */
  data: {
    recordTypeName: '', // 记录类型中文名称
    formatCreateTime: '' // 格式化后的时间
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    // 组件初始化完成
    attached() {
      this.updateRecordInfo();
    }
  },

  /**
   * 属性变化监听
   */
  observers: {
    'type, createTime': function () {
      // 当类型或时间变化时，更新显示信息
      this.updateRecordInfo();
    }
  },

  /**
   * 组件方法列表
   */
  methods: {
    /**
     * 更新记录显示信息（类型名+格式化时间）
     */
    updateRecordInfo() {
      const { type, createTime } = this.data;
      this.setData({
        recordTypeName: getRecordTypeName(type),
        formatCreateTime: formatDate(createTime)
      });
    },

    /**
     * 图片预览
     */
    handleImagePreview(e) {
      const { img } = e.currentTarget.dataset;
      const { images } = this.data;
      // 调用微信图片预览API
      wx.previewImage({
        current: img, // 当前显示图片的URL
        urls: images // 需要预览的图片URL列表
      });
    },

    /**
     * 编辑记录（触发父组件事件）
     */
    handleEdit() {
      this.triggerEvent('editRecord', {
        recordId: this.data.recordId
      });
    },

    /**
     * 删除记录（触发父组件事件）
     */
    handleDelete() {
      const that = this;
      // 弹窗确认
      wx.showModal({
        title: '确认删除',
        content: '此操作将永久删除该记录，是否继续？',
        cancelText: '取消',
        confirmText: '删除',
        confirmColor: '#f44336',
        success: (res) => {
          if (res.confirm) {
            // 触发父组件删除事件
            that.triggerEvent('deleteRecord', {
              recordId: that.data.recordId
            });
          }
        }
      });
    }
  }
});