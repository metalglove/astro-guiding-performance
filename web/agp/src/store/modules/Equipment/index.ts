import { Module } from 'vuex';
import { RootState } from '../../index';
import { EquipmentState } from './Equipment.types';
import { equipmentState } from './Equipment.state';
import { equipmentActions } from './Equipment.actions';
import { equipmentMutations } from './Equipment.mutations';
import { equipmentGetters } from './Equipment.getters';

const equipmentModule: Module<EquipmentState, RootState> = {
  namespaced: true,
  state: equipmentState,
  actions: equipmentActions,
  mutations: equipmentMutations,
  getters: equipmentGetters
};

export default equipmentModule;
