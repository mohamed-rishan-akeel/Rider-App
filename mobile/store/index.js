import { configureStore } from '@reduxjs/toolkit';
import availabilityReducer from './slices/availabilitySlice';
import assignedDeliveriesReducer from './slices/assignedDeliveriesSlice';
import homeReducer from './slices/homeSlice';

const store = configureStore({
    reducer: {
        availability: availabilityReducer,
        assignedDeliveries: assignedDeliveriesReducer,
        home: homeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            // Expo / React Native serializable check — relax for non-plain objects
            serializableCheck: {
                ignoredActions: ['availability/toggle/pending'],
            },
        }),
});

export default store;
