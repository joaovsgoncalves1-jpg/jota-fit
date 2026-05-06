import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X, Send, Plus, Image, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

function RelativeTime({ date }) {
  if (!date) return null;
  try {
    return <span>{formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR })}</span>;
  } catch {
    return null;
  }
}

function PostCard({ post, profiles, workouts, currentUser }) {
  const qc = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState((post.liked_by || []).includes(currentUser?.email));
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const profile = profiles?.find(p => p.email === post.student_email);
  const workout = workouts?.find(w => w.id === post.workout_id);

  const { data: comments } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => base44.entities.Comment.filter({ post_id: post.id }),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: async (text) => {
      await base44.entities.Comment.create({ post_id: post.id, student_email: currentUser.email, text });
      await base44.entities.Post.update(post.id, { comments_count: (post.comments_count || 0) + 1 });
    },
    onSuccess: () => {
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['comments', post.id] });
      qc.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });

  const handleLike = async () => {
    const newLiked = !liked;
    const newCount = newLiked ? likesCount + 1 : likesCount - 1;
    setLiked(newLiked);
    setLikesCount(newCount);
    const likedBy = post.liked_by || [];
    const newLikedBy = newLiked
      ? [...likedBy, currentUser.email]
      : likedBy.filter(e => e !== currentUser.email);
    await base44.entities.Post.update(post.id, { likes_count: newCount, liked_by: newLikedBy });
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-primary-foreground shrink-0">
          {(profile?.name || post.student_email)?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{profile?.name || post.student_email.split('@')[0]}</p>
          <p className="text-xs text-muted-foreground"><RelativeTime date={post.created_date} /></p>
        </div>
        {workout && (
          <span className="text-xs bg-gold/10 text-gold border border-gold/20 px-2 py-1 rounded-full font-bold flex items-center gap-1">
            <Trophy className="w-3 h-3" /> {workout.name}
          </span>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="w-full">
          <img src={post.image_url} alt="post" className="w-full object-cover max-h-96" />
        </div>
      )}

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pt-3">
          <p className="text-sm text-foreground leading-relaxed">{post.caption}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3">
        <motion.button
          whileTap={{ scale: 1.2 }}
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${liked ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Heart className={`w-5 h-5 ${liked ? 'fill-primary text-primary' : ''}`} />
          <span>{likesCount}</span>
        </motion.button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{post.comments_count || 0}</span>
        </button>
      </div>

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#333]"
          >
            <div className="px-4 py-3 space-y-2">
              {(comments || []).slice(0, 3).map(c => (
                <div key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                    {(profiles?.find(p => p.email === c.student_email)?.name || c.student_email)?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 bg-muted/30 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold">{profiles?.find(p => p.email === c.student_email)?.name || c.student_email.split('@')[0]}</p>
                    <p className="text-xs text-foreground">{c.text}</p>
                  </div>
                </div>
              ))}
              {(comments || []).length > 3 && (
                <p className="text-xs text-muted-foreground text-center">Ver todos os {comments.length} comentários</p>
              )}
              {/* Input */}
              <div className="flex gap-2 pt-1">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="flex-1 bg-muted/30 rounded-full px-3 py-2 text-xs outline-none border border-transparent focus:border-primary/30"
                  onKeyDown={e => e.key === 'Enter' && commentText.trim() && commentMutation.mutate(commentText.trim())}
                />
                <button
                  onClick={() => commentText.trim() && commentMutation.mutate(commentText.trim())}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewPostModal({ onClose, currentUser, workouts }) {
  const qc = useQueryClient();
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [workoutId, setWorkoutId] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: recentLogs } = useQuery({
    queryKey: ['my-recent-logs-feed', currentUser?.email],
    queryFn: () => base44.entities.WorkoutLog.filter({ student_email: currentUser?.email }),
    enabled: !!currentUser?.email,
  });

  const recentWorkoutIds = [...new Set((recentLogs || []).slice(0, 10).map(l => l.workout_id))];
  const recentWorkouts = (workouts || []).filter(w => recentWorkoutIds.includes(w.id));

  const publishMutation = useMutation({
    mutationFn: () => base44.entities.Post.create({
      student_email: currentUser.email,
      image_url: imageUrl,
      caption,
      workout_id: workoutId || undefined,
      likes_count: 0,
      comments_count: 0,
      liked_by: [],
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed-posts'] });
      toast({ title: 'Post publicado! 💪' });
      onClose();
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-[#1a1a1a] border border-[#333] rounded-2xl w-full max-w-md p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg">Novo Post</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        {/* Image */}
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl} alt="preview" className="w-full h-48 object-cover rounded-xl" />
            <button onClick={() => setImageUrl('')} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-[#333] rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <Image className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Clique para fazer upload</p>
                <p className="text-xs text-muted-foreground">ou cole uma URL abaixo</p>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </label>
        )}

        {!imageUrl && (
          <input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="Ou cole URL da imagem..."
            className="w-full bg-muted/20 border border-[#333] rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/30"
          />
        )}

        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Conte sobre seu treino..."
          rows={3}
          className="w-full bg-muted/20 border border-[#333] rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/30 resize-none"
        />

        {recentWorkouts.length > 0 && (
          <select
            value={workoutId}
            onChange={e => setWorkoutId(e.target.value)}
            className="w-full bg-muted/20 border border-[#333] rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/30 text-foreground"
          >
            <option value="">Associar treino (opcional)</option>
            {recentWorkouts.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        )}

        <Button
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending || (!caption && !imageUrl)}
          className="w-full bg-primary font-bold py-5 rounded-xl"
        >
          {publishMutation.isPending ? 'Publicando...' : 'Publicar 💪'}
        </Button>
      </motion.div>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useCurrentUser();
  const [showNewPost, setShowNewPost] = useState(false);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: () => base44.entities.Post.list('-created_date'),
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles'],
    queryFn: () => base44.entities.StudentProfile.list(),
  });

  const { data: workouts } = useQuery({
    queryKey: ['all-workouts'],
    queryFn: () => base44.entities.Workout.list(),
  });

  return (
    <div className="max-w-lg mx-auto p-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-xl font-black tracking-widest">COMUNIDADE 🔥</h1>
        <Button onClick={() => setShowNewPost(true)} size="sm" className="bg-primary font-bold rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Novo Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (posts || []).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Nenhum post ainda. Seja o primeiro! 💪</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(posts || []).map(post => (
            <PostCard key={post.id} post={post} profiles={profiles} workouts={workouts} currentUser={user} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showNewPost && (
          <NewPostModal onClose={() => setShowNewPost(false)} currentUser={user} workouts={workouts} />
        )}
      </AnimatePresence>
    </div>
  );
}