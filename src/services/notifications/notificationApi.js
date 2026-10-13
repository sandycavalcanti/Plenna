import { apiClient } from '../../api/client';

const pendingReadRequests = new Set();

export async function getNotifications() {
  const response = await apiClient.get('/notifications');
  return Array.isArray(response.data) ? response.data : [];
}

export async function getUnreadCount() {
  const response = await apiClient.get('/notifications/unread-count');
  const count = Number(response.data?.count);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

export async function waitForPendingNotificationReads() {
  while (pendingReadRequests.size > 0) {
    await Promise.allSettled([...pendingReadRequests]);
  }
}

export async function markNotificationAsRead(notificationId) {
  if (!Number.isSafeInteger(Number(notificationId)) || Number(notificationId) <= 0) {
    throw new Error('Invalid notification id');
  }

  const request = apiClient
    .patch(`/notifications/${encodeURIComponent(notificationId)}/read`)
    .then((response) => response.data);
  pendingReadRequests.add(request);
  request.then(
    () => pendingReadRequests.delete(request),
    () => pendingReadRequests.delete(request),
  );
  return request;
}
