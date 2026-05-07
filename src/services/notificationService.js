import { api } from './api';

export const notificationService = {
    getSentNotifications: async (page = 1, pageSize = 20) => {
        const response = await api.get('/admin/notifications', {
            params: { page, pageSize }
        });
        return response.data;
    },

    sendNotification: async (data) => {
        const response = await api.post('/admin/notifications/send', data);
        return response.data;
    }
};
