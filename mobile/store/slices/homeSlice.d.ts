import type { AsyncThunk } from '@reduxjs/toolkit';
import type { Delivery } from '../../types/delivery';

export const fetchDriverHome: AsyncThunk<
    {
        profile: unknown;
        activeDelivery: Delivery | null;
        assignedDeliveries: Delivery[];
    },
    void,
    { rejectValue: string }
>;
