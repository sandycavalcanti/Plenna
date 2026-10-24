const NOTIFICATION_PRESENTATIONS = {
  LIMITE_COMPRA: {
    icon: 'wallet-outline',
    label: 'Limite por compra',
    iconColor: '#A85C00',
    iconBackgroundColor: '#FFF1DD',
  },
  LIMITE_CATEGORIA: {
    icon: 'tag-outline',
    label: 'Limite por categoria',
    iconColor: '#5F68A0',
    iconBackgroundColor: '#EEF1FF',
  },
  LIMITE_MENSAL: {
    icon: 'chart-line',
    label: 'Limite mensal',
    iconColor: '#6E63B5',
    iconBackgroundColor: '#F0EDFF',
  },
  SAZONAL: {
    icon: 'calendar-star-outline',
    label: 'Alerta sazonal',
    iconColor: '#C02C7A',
    iconBackgroundColor: '#FCECF4',
  },
  PROATIVA: {
    icon: 'message-text-outline',
    label: 'Mensagem da Plenna',
    iconColor: '#4D5AA8',
    iconBackgroundColor: '#E8EBFF',
  },
};

export function getNotificationPresentation(type) {
  return NOTIFICATION_PRESENTATIONS[type] || {
    icon: 'bell-outline',
    label: 'Notificação',
    iconColor: '#595D7C',
    iconBackgroundColor: '#E3E0F4',
  };
}

export function formatNotificationDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data indisponível';

  const datePart = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
  const timePart = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `${datePart} às ${timePart}`;
}

export function isNotificationUnread(notification) {
  return notification?.notificacao_lida === 0
    || notification?.notificacao_lida === '0'
    || notification?.notificacao_lida === false;
}

export function getUnreadBadgeLabel(count) {
  const normalizedCount = Number(count);
  if (!Number.isFinite(normalizedCount) || normalizedCount <= 0) return null;
  return normalizedCount > 99 ? '99+' : String(Math.floor(normalizedCount));
}

export function markNotificationAsReadLocally(notifications, notificationId, readAt) {
  return notifications.map((notification) => (
    String(notification.notificacao_id) === String(notificationId)
      ? { ...notification, notificacao_lida: 1, notificacao_lida_em: readAt }
      : notification
  ));
}
