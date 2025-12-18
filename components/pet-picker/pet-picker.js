// components/pet-selector/pet-selector.js
const { get, delete: del } = require('../../utils/request');
const { getPetIcon } = require('../../utils/util');
const app = getApp();

// 常量配置
const PET_TYPE_NAMES = {
  'cat': '猫咪',
  'dog': '狗狗', 
  'rabbit': '兔兔',
  'hamster': '仓鼠',
  'bird': '鸟儿'
};

const DEFAULT_AVATAR = '/images/default-avatar.png';

Component({
  properties: {
    // 从父组件传入的选中宠物
    selectedPet: {
      type: Object,
      value: null
    },
    // 从父组件传入的宠物列表
    petList: {
      type: Array,
      value: []
    }
  },

  data: {
    isManagementModalShow: false, // 只保留管理弹窗状态
    loading: false
  },

  methods: {
    // 打开管理弹窗
    openManagementModal(e) {
      this.setData({ isManagementModalShow: true });
    },

    // 关闭管理弹窗
    closeManagementModal() {
      this.setData({ isManagementModalShow: false });
    },

    // 切换宠物
    changePet(e) {
      const petId = e.currentTarget.dataset.petid;
      const selectedPet = this.data.petList.find(pet => 
        pet.id === petId || pet.petId === petId
      );
      
      if (!selectedPet) {
        wx.showToast({ title: '宠物不存在', icon: 'none' });
        return;
      }
      
      this.setData({
        selectedPet: selectedPet
      });
      
      // 通知父组件宠物已切换
      this.triggerEvent('petChange', { selectedPet });
      
      wx.showToast({ 
        title: '已切换到' + selectedPet.name, 
        icon: 'success',
        duration: 1000
      });
    },

    // 跳转到添加宠物页面
    gotoAddPet() {
      this.setData({ 
        isManagementModalShow: false 
      });
      wx.navigateTo({ url: '/pages/pet-edit/pet-edit' });
    },

    // 编辑宠物
    editPet(e) {
      const pet = e.currentTarget.dataset.pet;
      
      if (!pet) {
        wx.showToast({ title: '数据错误', icon: 'none' });
        return;
      }
      
      this.setData({ 
        isManagementModalShow: false 
      });
      
      // 通知父组件编辑宠物
      this.triggerEvent('editPet', { pet });
    },

    // 删除宠物
    deletePet(e) {
      const pet = e.currentTarget.dataset.pet;
      const petId = pet.petId || pet.id;
      const petName = pet.name || '该宠物';
      
      wx.showModal({
        title: '确认删除',
        content: `确定要删除"${petName}"吗？此操作不可恢复。`,
        confirmText: '删除',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            this.confirmDeletePet(petId, pet);
          }
        }
      });
    },

    // 确认删除宠物
    confirmDeletePet(petId, pet) {
      wx.showLoading({ title: '删除中...' });
      
      del(`/pets/${petId}`, {}, { showLoading: false })
        .then(() => {
          wx.hideLoading();
          this.handlePetDeleted(petId, pet);
          wx.showToast({ title: '删除成功', icon: 'success' });
        })
        .catch(error => {
          wx.hideLoading();
          console.error('删除宠物失败:', error);
          wx.showToast({ title: '删除失败，请重试', icon: 'none' });
        });
    },

    // 处理宠物删除后的数据更新
    handlePetDeleted(deletedPetId, deletedPet) {
      const { petList, selectedPet } = this.data;
      
      // 从宠物列表中移除
      const newPetList = petList.filter(pet => {
        const currentPetId = pet.petId || pet.id;
        return currentPetId !== deletedPetId;
      });
      
      // 如果删除的是当前选中的宠物，需要重新选择
      let newSelectedPet = selectedPet;
      const currentSelectedPetId = selectedPet.petId || selectedPet.id;
      
      if (currentSelectedPetId === deletedPetId) {
        if (newPetList.length > 0) {
          newSelectedPet = newPetList[0];
        } else {
          newSelectedPet = {
            name: '暂无宠物',
            breed: '快去添加一个吧',
            avatar: DEFAULT_AVATAR
          };
        }
      }
      
      // 更新数据
      this.setData({
        petList: newPetList,
        selectedPet: newSelectedPet,
        isManagementModalShow: newPetList.length > 0 ? this.data.isManagementModalShow : false
      });
      
      // 通知父组件宠物已删除
      this.triggerEvent('petDeleted', { 
        deletedPetId, 
        newPetList, 
        newSelectedPet 
      });
    },

    // 处理宠物数据
    processPetData(pet) {
      const displayName = pet.name && pet.name.length > 4 ? 
        pet.name.substring(0, 4) + '...' : (pet.name || '未知宠物');
      
      return {
        ...pet,
        id: pet.Id || pet.id,
        petId: pet.petId || pet.id,
        name: pet.name || '未知宠物',
        typeName: PET_TYPE_NAMES[pet.species] || '宠物',
        breed: pet.breed || '未知品种',
        avatar: pet.avatar || DEFAULT_AVATAR,
        icon: getPetIcon(pet.species),
        displayName: displayName
      };
    }
  }
});