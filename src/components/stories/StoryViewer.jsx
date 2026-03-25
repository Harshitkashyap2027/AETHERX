import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import Avatar from '../common/Avatar';

const STORY_DURATION = 5000;

const StoryViewer = ({ stories, startIndex = 0, onClose }) => {
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const story = stories[current];

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(timerRef.current);
        if (current < stories.length - 1) setCurrent((c) => c + 1);
        else onClose();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [current]);

  const prev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  const next = () => {
    if (current < stories.length - 1) setCurrent((c) => c + 1);
    else onClose();
  };

  if (!story) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-none"
              style={{ width: i < current ? '100%' : i === current ? `${progress}%` : '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center gap-3 px-4 z-20">
        <Avatar src={story.userPhoto} alt={story.userDisplayName} size={36} />
        <div>
          <p className="text-white text-sm font-semibold">{story.userDisplayName}</p>
          <p className="text-white/60 text-xs">@{story.userUsername}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <IoCloseOutline size={22} />
        </button>
      </div>

      {/* Story media */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          className="w-full h-full flex items-center justify-center"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {story.mediaType === 'video' ? (
            <video
              src={story.mediaUrl}
              autoPlay
              muted
              className="max-h-full max-w-full object-contain"
            />
          ) : story.mediaUrl ? (
            <img
              src={story.mediaUrl}
              alt="Story"
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-white text-xl text-center">{story.text}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
      >
        <IoChevronBack size={24} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
      >
        <IoChevronForward size={24} />
      </button>

      {/* Tap areas */}
      <div className="absolute inset-0 flex z-10">
        <div className="flex-1" onClick={prev} />
        <div className="flex-1" onClick={next} />
      </div>
    </motion.div>
  );
};

export default StoryViewer;
