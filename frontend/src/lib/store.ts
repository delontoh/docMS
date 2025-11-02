import { configureStore } from '@reduxjs/toolkit';
import documentsReducer from '@/lib/store/slices/documentsSlice';

export const makeStore = () =>
    configureStore({
        reducer: {
            documents: documentsReducer,
        },
    });

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
export type RootState = ReturnType<AppStore['getState']>;
