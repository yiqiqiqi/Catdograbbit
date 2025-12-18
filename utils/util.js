// utils/util.js - 通用工具函数
const generateCardId =()=>{
  const now = new Date();
  // 格式化日期时间：yyyyMMddHHmmss
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
  // 生成 1000-9999 的随机数
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;
  return `Card${timestamp}${randomNumber}`;
};
// 统一的日期处理工具
const DateUtils = {
  // 安全的日期解析（兼容 iOS）
  safeParseDate: (input) => {
    if (!input) return new Date();
    
    // 如果是 Date 对象
    if (input instanceof Date) {
      return isNaN(input.getTime()) ? new Date() : input;
    }
    
    // 如果是数字（时间戳）
    if (typeof input === 'number') {
      return new Date(input);
    }
    
    // 如果是字符串
    const str = String(input).trim();
    
    // 时间戳字符串
    if (/^\d{10,13}$/.test(str)) {
      const timestamp = parseInt(str, 10);
      const length = str.length;
      // 10位时间戳（秒）转换为13位（毫秒）
      return new Date(length === 10 ? timestamp * 1000 : timestamp);
    }
    
    // 处理 ISO 格式
    if (str.includes('T')) {
      // 确保有正确的时区信息
      if (!str.includes('Z') && !str.includes('+') && !str.includes('-')) {
        // 如果没有时区信息，添加 UTC 标记
        return new Date(str + 'Z');
      }
      return new Date(str);
    }
    
    // 处理常见的中文格式：将 '-' 替换为 '/' 以兼容 iOS
    let fixedStr = str;
    
    // 替换日期部分的分隔符
    fixedStr = fixedStr.replace(/^(\d{4})-(\d{1,2})-(\d{1,2})/, '$1/$2/$3');
    
    // 替换可能存在的 'T'
    fixedStr = fixedStr.replace('T', ' ');
    
    const date = new Date(fixedStr);
    
    if (isNaN(date.getTime())) {
      console.warn('无法解析日期:', input);
      return new Date();
    }
    
    return date;
  },
  
  // 格式化为 UTC+8 时间
  formatToUTC8: (input, format = 'YYYY-MM-DD HH:mm:ss') => {
    const date = DateUtils.safeParseDate(input);
    
    // 调整为 UTC+8
    date.setHours(date.getHours() + 8);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  },
  
  // 相对时间显示
  relativeTime: (input) => {
    const date = DateUtils.safeParseDate(input);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const week = 7 * day;
    
    if (diff < minute) {
      return '刚刚';
    } else if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    } else if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    } else if (diff < week) {
      return `${Math.floor(diff / day)}天前`;
    } else {
      return DateUtils.formatToUTC8(date, 'MM-DD');
    }
  }
};

// 导出使用
const formatCreateTime = (utcTime) => {
  return DateUtils.formatToUTC8(utcTime, 'YYYY-MM-DD HH:mm:ss');
};

const formatTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  return DateUtils.formatToUTC8(date, format);
};

const relativeTime = (date) => {
  return DateUtils.relativeTime(date);
};
// 图片处理
const compressImage = (filePath, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality: quality,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
};

// 选择图片
const chooseImage = (count = 1, sourceType = ['album', 'camera']) => {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count: count,
      mediaType: ['image'],
      sourceType: sourceType,
      maxDuration: 30,
      success: (res) => {
        // wx.chooseMedia 返回的结构与 wx.chooseImage 不同
        const tempFilePaths = res.tempFiles.map(file => file.tempFilePath);
        resolve(tempFilePaths);
      },
      fail: (error) => {
        reject(error);
      }
    });
  });
};

// 显示模态对话框
const showModal = (title, content, showCancel = true) => {
  return new Promise((resolve) => {
    wx.showModal({
      title: title,
      content: content,
      showCancel: showCancel,
      success: (res) => {
        resolve(res.confirm);
      }
    });
  });
};

// 防抖函数
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 获取宠物类型图标
const getPetIcon = (species) => {
  const icons = {
    'cat': '🐱',
    'dog': '🐶',
    'other': '🐾'
  };
  return icons[species] || '🐾';
};

// 获取记录类型图标
const getRecordTypeIcon = (type) => {
  const icons = {
    'diary': '📝',
    'health': '🏥',
    'activity': '🎪'
  };
  return icons[type] || '📝';
};

module.exports = {
  formatTime,
  relativeTime,
  compressImage,
  chooseImage,
  showModal,
  debounce,
  getPetIcon,
  getRecordTypeIcon,
  generateCardId,
  formatCreateTime
};