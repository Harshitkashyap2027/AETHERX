import { formatDistanceToNow } from 'date-fns';
import { IoHeartOutline, IoChatbubbleOutline, IoPersonAddOutline, IoBriefcaseOutline } from 'react-icons/io5';
import Avatar from '../common/Avatar';

const typeConfig = {
  like: { icon: IoHeartOutline, color: 'text-red-400', bg: 'bg-red-400/10' },
  comment: { icon: IoChatbubbleOutline, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  follow: { icon: IoPersonAddOutline, color: 'text-green-400', bg: 'bg-green-400/10' },
  follow_request: { icon: IoPersonAddOutline, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  project_request: { icon: IoBriefcaseOutline, color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

const NotificationItem = ({ notification, onAction }) => {
  const config = typeConfig[notification.type] || typeConfig.like;
  const Icon = config.icon;
  const createdAt = notification.createdAt?.toDate?.() || new Date(notification.createdAt);

  const messages = {
    like: 'liked your post',
    comment: `commented: "${notification.message || '...'}"`,
    follow: 'started following you',
    follow_request: 'requested to follow you',
    project_request: 'requested access to your project',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl transition-all ${!notification.read ? 'bg-primary/5 border border-primary/10' : 'hover:bg-white/5'}`}>
      {/* Avatar + icon badge */}
      <div className="relative flex-shrink-0">
        <Avatar src={notification.fromPhoto} alt={notification.fromName} size={42} />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${config.bg} flex items-center justify-center`}>
          <Icon size={13} className={config.color} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">
          <span className="font-semibold">{notification.fromName || 'Someone'}</span>{' '}
          <span className="text-white/70">{messages[notification.type] || notification.message}</span>
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          {formatDistanceToNow(createdAt, { addSuffix: true })}
        </p>

        {/* Action buttons for follow requests */}
        {notification.type === 'follow_request' && !notification.handled && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => onAction?.('accept', notification)}
              className="px-3 py-1 text-xs font-medium rounded-lg gradient-bg text-white"
            >
              Accept
            </button>
            <button
              onClick={() => onAction?.('reject', notification)}
              className="px-3 py-1 text-xs font-medium rounded-lg bg-white/10 text-white/70 hover:bg-white/15"
            >
              Decline
            </button>
          </div>
        )}
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  );
};

export default NotificationItem;
