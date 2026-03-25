import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoAddOutline, IoGlobeOutline, IoLockClosedOutline,
  IoLogoGithub, IoLinkOutline, IoTrashOutline, IoCheckmarkDoneOutline,
} from 'react-icons/io5';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, orderBy, serverTimestamp, updateDoc, increment,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/common/Modal';

const Projects = () => {
  const { user, userProfile } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', repoUrl: '', demoUrl: '', isPublic: true, tags: '',
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'public' | 'private'

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'projects'),
        where('ownerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Project title is required');
    setSaving(true);
    try {
      let previewUrl = '';
      if (file) {
        const ext = file.name.split('.').pop();
        const r = ref(storage, `projects/${user.uid}/${uuidv4()}.${ext}`);
        const task = uploadBytesResumable(r, file);
        await new Promise((res, rej) => task.on('state_changed',
          (s) => setProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
          rej,
          async () => { previewUrl = await getDownloadURL(task.snapshot.ref); res(); }
        ));
      }
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const data = {
        ownerId: user.uid,
        ownerDisplayName: userProfile?.displayName || '',
        ownerUsername: userProfile?.username || '',
        ownerPhoto: userProfile?.photoURL || '',
        title: form.title.trim(),
        description: form.description.trim(),
        previewUrl,
        repoUrl: form.repoUrl.trim(),
        demoUrl: form.demoUrl.trim(),
        tags,
        isPublic: form.isPublic,
        stars: [],
        forks: 0,
        views: 0,
        requests: [],
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'projects'), data);
      await updateDoc(doc(db, 'users', user.uid), { projectCount: increment(1) });
      toast.success('Project published!');
      setForm({ title: '', description: '', repoUrl: '', demoUrl: '', isPublic: true, tags: '' });
      setFile(null); setPreview(null); setProgress(0);
      setShowCreate(false);
      fetchProjects();
    } catch {
      toast.error('Failed to publish project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await deleteDoc(doc(db, 'projects', id));
      setProjects((p) => p.filter((x) => x.id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleVisibility = async (proj) => {
    try {
      await updateDoc(doc(db, 'projects', proj.id), { isPublic: !proj.isPublic });
      setProjects((prev) => prev.map((p) => p.id === proj.id ? { ...p, isPublic: !p.isPublic } : p));
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const filtered = projects.filter((p) => {
    if (filter === 'public') return p.isPublic;
    if (filter === 'private') return !p.isPublic;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">My Projects</h1>
          <p className="text-white/50 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-bg text-white text-sm font-semibold shadow-lg shadow-primary/20"
        >
          <IoAddOutline size={18} /> New Project
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'public', 'private'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
              filter === f ? 'gradient-bg text-white' : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bento-card p-4 space-y-3">
              <div className="skeleton h-32 w-full rounded-xl" />
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-3 w-full rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card p-14 text-center">
          <div className="text-5xl mb-4">📁</div>
          <p className="text-white font-semibold">No projects yet</p>
          <p className="text-white/50 text-sm mt-1">Share your code with the world</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mt-4 max-w-xs mx-auto">
            Upload First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((proj) => (
            <motion.div
              key={proj.id}
              className="bento-card overflow-hidden"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {proj.previewUrl && (
                <img src={proj.previewUrl} alt={proj.title} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-white font-semibold">{proj.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleVisibility(proj)}
                      className={`p-1.5 rounded-lg ${proj.isPublic ? 'text-green-400 hover:bg-green-400/10' : 'text-red-400 hover:bg-red-400/10'} transition-colors`}
                      title={proj.isPublic ? 'Make private' : 'Make public'}
                    >
                      {proj.isPublic ? <IoGlobeOutline size={16} /> : <IoLockClosedOutline size={16} />}
                    </button>
                    <button
                      onClick={() => handleDelete(proj.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <IoTrashOutline size={16} />
                    </button>
                  </div>
                </div>
                {proj.description && (
                  <p className="text-white/60 text-xs mt-1 line-clamp-2">{proj.description}</p>
                )}

                {/* Tags */}
                {proj.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {proj.tags.slice(0, 3).map((t) => (
                      <span key={t} className="tag-chip text-xs">{t}</span>
                    ))}
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-2 mt-3">
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors">
                      <IoLogoGithub size={14} /> Repo
                    </a>
                  )}
                  {proj.demoUrl && (
                    <a href={proj.demoUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white transition-colors">
                      <IoLinkOutline size={14} /> Demo
                    </a>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 text-white/40 ml-auto">
                    ⭐ {proj.stars?.length || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create project modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Project title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input-field"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="input-field resize-none"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <IoLogoGithub size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="url"
                placeholder="GitHub / Repo URL"
                value={form.repoUrl}
                onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
                className="input-field pl-9"
              />
            </div>
            <div className="relative">
              <IoLinkOutline size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="url"
                placeholder="Live demo URL"
                value={form.demoUrl}
                onChange={(e) => setForm((f) => ({ ...f, demoUrl: e.target.value }))}
                className="input-field pl-9"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Tags (comma separated): react, firebase, tailwind"
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            className="input-field"
          />

          {/* Preview image */}
          <div>
            <label className="block text-sm text-white/50 mb-2">Preview image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
              }}
              className="input-field"
            />
            {preview && <img src={preview} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-xl" />}
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm text-white font-medium">Visibility</p>
              <p className="text-xs text-white/40">{form.isPublic ? 'Anyone can view this project' : 'Only approved users can access'}</p>
            </div>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isPublic ? 'gradient-bg' : 'bg-white/20'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${form.isPublic ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          {saving && progress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-white/50">
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Publishing…' : 'Publish Project'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
