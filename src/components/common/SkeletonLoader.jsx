const SkeletonLoader = ({ type = 'post' }) => {
  if (type === 'post') {
    return (
      <div className="bento-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-32 rounded" />
            <div className="skeleton h-2 w-20 rounded" />
          </div>
        </div>
        <div className="skeleton h-48 w-full rounded-xl" />
        <div className="space-y-2">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
        <div className="flex gap-4">
          <div className="skeleton h-8 w-16 rounded-lg" />
          <div className="skeleton h-8 w-16 rounded-lg" />
          <div className="skeleton h-8 w-16 rounded-lg" />
        </div>
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="bento-card overflow-hidden">
        <div className="skeleton h-32 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <div className="flex gap-3">
            <div className="skeleton w-20 h-20 rounded-full -mt-10" />
            <div className="flex-1 pt-2 space-y-2">
              <div className="skeleton h-4 w-32 rounded" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
          </div>
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="flex gap-4">
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (type === 'story') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="skeleton w-16 h-16 rounded-full" />
        <div className="skeleton h-2 w-14 rounded" />
      </div>
    );
  }

  if (type === 'user') {
    return (
      <div className="flex items-center gap-3 p-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-28 rounded" />
          <div className="skeleton h-2 w-20 rounded" />
        </div>
      </div>
    );
  }

  return <div className="skeleton h-20 w-full rounded-xl" />;
};

export default SkeletonLoader;
