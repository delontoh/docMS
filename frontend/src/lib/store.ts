import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '@/features/ui/uiSlice';

export const makeStore = () =>
    configureStore({
        reducer: {
            ui: uiReducer,
        },
    });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;
