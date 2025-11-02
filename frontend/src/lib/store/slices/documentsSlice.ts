import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Item } from '@/types';

type DocumentsState = {
    items: Item[];
    itemsById: Record<string, Item>;
};

const initialState: DocumentsState = {
    items: [],
    itemsById: {}, //eg. "folder-{id}" or "document-{id}"
};

const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        setItems(state, action: PayloadAction<Item[]>) {
            state.items = action.payload ?? [];

            (action.payload ?? []).forEach((item) => {
                const key = `${item.type}-${item.id}`;
                state.itemsById[key] = item;
            });
        },

        addItem(state, action: PayloadAction<Item>) {
            if (!action.payload) return;

            state.items.push(action.payload);

            const key = `${action.payload.type}-${action.payload.id}`;
            state.itemsById[key] = action.payload;
        },

        removeItem(state, action: PayloadAction<{ type: 'document' | 'folder'; id: number }>) {
            const key = `${action.payload.type}-${action.payload.id}`;
            state.items = state.items.filter((item) => !(item.type === action.payload.type && item.id === action.payload.id));
            
            delete state.itemsById[key];
        },

        removeItems(state, action: PayloadAction<string[]>) {
            if (!action.payload || action.payload.length === 0) return;

            const keysToRemove = new Set(action.payload);

            state.items = state.items.filter((item) => {
                const key = `${item.type}-${item.id}`;
                return !keysToRemove.has(key);
            });
            
            action.payload.forEach((key) => {
                delete state.itemsById[key];
            });
        },
    },
});

export const { setItems, addItem, removeItem, removeItems } = documentsSlice.actions;
export default documentsSlice.reducer;

