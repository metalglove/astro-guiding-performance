import { Store, CommitOptions, DispatchOptions, Module } from 'vuex';
import { RootState } from '@/store';
import { EquipmentActions, equipmentActions } from './Equipment.actions';
import { EquipmentGetters, equipmentGetters } from './Equipment.getters';
import { EquipmentMutations, equipmentMutations } from './Equipment.mutations';
import { IEquipmentState as State, equipmentState } from './Equipment.state';

export type IEquipmentState = State;

export type EquipmentModule = {
    namespaced?: boolean;
    state?: IEquipmentState;
    mutations?: EquipmentMutations;
    actions?: EquipmentActions;
    getters?: EquipmentGetters;
};

export type EquipmentStore<S = IEquipmentState> = Omit<Store<S>, 'getters' | 'commit' | 'dispatch'>
    & {
        commit<K extends keyof EquipmentMutations, P extends Parameters<EquipmentMutations[K]>[1]>(
            key: K,
            payload: P,
            options?: CommitOptions
        ): ReturnType<EquipmentMutations[K]>;
    } & {
        dispatch<K extends keyof EquipmentActions, P extends Parameters<EquipmentActions[K]>[1]>(
            key: K,
            payload: P,
            options?: DispatchOptions
        ): ReturnType<EquipmentActions[K]>;
    } & {
        getters: {
            [K in keyof EquipmentGetters]: ReturnType<EquipmentGetters[K]>
        };
    };

export const equipmentStore: Module<IEquipmentState, RootState> & EquipmentModule = {
    namespaced: true,
    state: equipmentState,
    mutations: equipmentMutations,
    actions: equipmentActions,
    getters: equipmentGetters
};
