import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';

const SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'React', 'Vue', 'Angular', 'Node.js',
  'Express', 'Next.js', 'Firebase', 'SQL', 'MongoDB', 'GraphQL', 'Docker',
  'Kubernetes', 'AWS', 'Git', 'Java', 'C++', 'Rust', 'Go', 'Flutter', 'React Native',
  'TailwindCSS', 'CSS', 'HTML', 'Machine Learning', 'Data Science', 'DevOps',
];

const INTERESTS = [
  'Web Development', 'Mobile Apps', 'AI/ML', 'Open Source', 'System Design',
  'Cybersecurity', 'Blockchain', 'Game Dev', 'UI/UX', 'Data Engineering',
  'Cloud Computing', 'Networking', 'Embedded Systems', 'Freelancing',
];

const Onboarding = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [skills, setSkills] = useState([]);
  const [interests, setInterests] = useState([]);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleItem = (arr, setArr, item) => {
    setArr((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const finish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        skills,
        interests,
        bio,
        onboardingDone: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      await refreshProfile();
      navigate('/');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: '🎯 Pick your skills',
      subtitle: 'Let others know what you work with',
      content: (
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => toggleItem(skills, setSkills, s)}
              className={`tag-chip ${skills.includes(s) ? 'active' : ''}`}
            >
              {s}
            </button>
          ))}
        </div>
      ),
      canNext: skills.length >= 1,
    },
    {
      title: '💡 Your interests',
      subtitle: "We'll personalise your feed based on these",
      content: (
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => (
            <button
              key={i}
              onClick={() => toggleItem(interests, setInterests, i)}
              className={`tag-chip ${interests.includes(i) ? 'active' : ''}`}
            >
              {i}
            </button>
          ))}
        </div>
      ),
      canNext: interests.length >= 1,
    },
    {
      title: '✍️ Write a bio',
      subtitle: 'A short intro about yourself (optional)',
      content: (
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="e.g. Full-stack developer passionate about open-source and AI…"
          rows={4}
          className="input-field resize-none"
          maxLength={200}
        />
      ),
      canNext: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-purple" style={{ width: 400, height: 400, top: -100, left: -100 }} />
      <div className="orb orb-pink" style={{ width: 350, height: 350, bottom: -80, right: -80 }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-bg mb-3 shadow-lg shadow-primary/30">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <h1 className="text-2xl font-bold gradient-text">Set up your profile</h1>
          <p className="text-white/50 text-sm mt-1">Step {step + 1} of {steps.length}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? 'linear-gradient(90deg, #6C63FF, #FF6584)' : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        {/* Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="bento-card p-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="text-lg font-semibold text-white mb-1">{current.title}</h2>
            <p className="text-sm text-white/50 mb-5">{current.subtitle}</p>
            <div className="max-h-64 overflow-y-auto pr-1">{current.content}</div>

            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep((s) => s - 1)} className="btn-secondary flex-1">
                  Back
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!current.canNext}
                  className="btn-primary flex-1"
                >
                  Continue
                </button>
              ) : (
                <button onClick={finish} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Saving…' : 'Finish & Enter 🚀'}
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
