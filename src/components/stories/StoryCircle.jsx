import Avatar from '../common/Avatar';

const StoryCircle = ({ story, onClick, isOwn = false }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 group flex-shrink-0"
  >
    <div
      className="rounded-full p-0.5 transition-transform group-hover:scale-105"
      style={{
        background: story?.seen
          ? 'rgba(255,255,255,0.15)'
          : 'linear-gradient(135deg, #6C63FF, #FF6584)',
      }}
    >
      <div className="p-0.5 bg-dark rounded-full">
        <Avatar
          src={story?.userPhoto}
          alt={story?.userDisplayName || 'Story'}
          size={52}
        />
      </div>
    </div>
    <span className="text-xs text-white/60 max-w-[60px] truncate">
      {isOwn ? 'Your story' : story?.userDisplayName?.split(' ')[0] || 'User'}
    </span>
  </button>
);

export default StoryCircle;
