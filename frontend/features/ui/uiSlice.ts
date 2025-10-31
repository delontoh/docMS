import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type UiState = { darkMode: boolean };

const initialState: UiState = { darkMode: false };

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setDarkMode(state, action: PayloadAction<boolean>) {
            state.darkMode = action.payload;
        },
        toggleDarkMode(state) {
            state.darkMode = !state.darkMode;
        },
    },
});

export const { setDarkMode, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
