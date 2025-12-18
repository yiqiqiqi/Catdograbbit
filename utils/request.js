// utils/request.js - 网络请求封装
const app = getApp();

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    // 显示加载状态（如果是GET请求且不明确指定不显示）
    if ((!options.method || options.method === 'GET') && options.showLoading !== false) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }
    
    wx.request({
      url: app.globalData.baseURL + url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res) => {
        // 隐藏加载状态
        if ((!options.method || options.method === 'GET') && options.showLoading !== false) {
          wx.hideLoading();
        }
        
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else if (res.data.code === 401) {
            // token失效，清除本地存储并重新登录
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            app.globalData.token = null;
            app.globalData.userInfo = null;
            
            // 重新登录
            app.login();
            reject(new Error('登录已过期，请重新登录'));
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        } else {
          reject(new Error(`网络错误: ${res.statusCode}`));
        }
      },
      fail: (error) => {
        // 隐藏加载状态
        if ((!options.method || options.method === 'GET') && options.showLoading !== false) {
          wx.hideLoading();
        }
        
        reject(new Error('网络请求失败，请检查网络连接'));
      }
    });
  });
};

// GET请求
const get = (url, data = {}, options = {}) => {
  return request(url, { method: 'GET', data, ...options });
};

// POST请求
const post = (url, data = {}, options = {}) => {
  return request(url, { method: 'POST', data, ...options });
};

// PUT请求
const put = (url, data = {}, options = {}) => {
  return request(url, { method: 'PUT', data, ...options });
};

// DELETE请求
const del = (url, data = {}, options = {}) => {
  return request(url, { method: 'DELETE', data, ...options });
};

// 上传文件
const uploadFile = (url, filePath, formData = {}, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    wx.uploadFile({
      url: app.globalData.baseURL + url,
      filePath: filePath,
      name: options.name || 'file',
      formData: formData,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header,
      },
      success: (res) => {
        const data = JSON.parse(res.data);
        if (data.code === 0) {
          resolve(data.data);
        } else {
          reject(new Error(data.message || '上传失败'));
        }
      },
      fail: (error) => {
        reject(new Error('上传失败，请检查网络连接'));
      }
    });
  });
};

module.exports = {
  request,
  get,
  post,
  put,
  delete: del,
  uploadFile
};