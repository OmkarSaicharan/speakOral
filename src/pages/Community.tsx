import { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, orderBy, onSnapshot, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Post, Comment } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  MoreVertical, 
  Trash2, 
  Clock,
  MessageCircle,
  Share2,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

interface CommunityProps {
  user: UserProfile;
}

export default function Community({ user }: CommunityProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Comments state
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newCommentContent, setNewCommentContent] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(postsData);
      setLoading(false);

      // Fetch comments for each post
      postsData.forEach(post => {
        const cq = query(collection(db, `posts/${post.id}/comments`), orderBy('createdAt', 'asc'));
        onSnapshot(cq, (cSnapshot) => {
          setComments(prev => ({
            ...prev,
            [post.id]: cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment))
          }));
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/comments`);
        });
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);

    try {
      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: user.name,
        content: newPostContent,
        likes: [],
        createdAt: new Date().toISOString(),
      });
      setNewPostContent('');
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (post: Post) => {
    const postRef = doc(db, 'posts', post.id);
    const isLiked = post.likes.includes(user.uid);

    try {
      await updateDoc(postRef, {
        likes: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleCreateComment = async (postId: string) => {
    const content = newCommentContent[postId];
    if (!content?.trim()) return;

    try {
      await addDoc(collection(db, `posts/${postId}/comments`), {
        postId,
        authorId: user.uid,
        authorName: user.name,
        content,
        likes: [],
        createdAt: new Date().toISOString(),
      });
      setNewCommentContent(prev => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error("Error creating comment:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Community</h1>
        <p className="text-slate-600 mt-1">Connect with other learners, ask questions, and share knowledge.</p>
      </div>

      {/* Create Post */}
      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex space-x-4">
            <Avatar className="h-10 w-10 border-2 border-slate-100 bg-slate-200">
              <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback className="bg-slate-900 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea 
                placeholder="What's on your mind? Ask a question or share a tip..." 
                className="min-h-[100px] rounded-2xl border-slate-100 focus:ring-emerald-500 bg-slate-50 resize-none"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold px-6"
                  disabled={isPosting || !newPostContent.trim()}
                  onClick={handleCreatePost}
                >
                  {isPosting ? 'Posting...' : 'Post Question'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.map((post) => (
          <Card key={post.id} className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10 border border-slate-100 bg-slate-200">
                    <AvatarImage src={post.authorId === user.uid ? user.photoURL : `https://api.dicebear.com/7.x/initials/svg?seed=${post.authorName}`} />
                    <AvatarFallback className="bg-slate-900 text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{post.authorName}</p>
                    <p className="text-xs text-slate-500 font-medium flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {user.role === 'admin' && (
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => setDeleteId(post.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </CardContent>
            <CardFooter className="p-4 bg-slate-50/50 border-t border-slate-50 flex flex-col space-y-4">
              <div className="flex items-center space-x-6 w-full">
                <button 
                  className={cn(
                    "flex items-center text-sm font-bold transition-colors",
                    post.likes.includes(user.uid) ? "text-emerald-600" : "text-slate-600 hover:text-emerald-600"
                  )}
                  onClick={() => handleLikePost(post)}
                >
                  <ThumbsUp className={cn("h-4 w-4 mr-2", post.likes.includes(user.uid) && "fill-emerald-600")} />
                  {post.likes.length} Likes
                </button>
                <div className="flex items-center text-sm font-bold text-slate-600">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {comments[post.id]?.length || 0} Answers
                </div>
                <button className="flex items-center text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>

              {/* Comments Section */}
              <div className="w-full space-y-4 pt-4 border-t border-slate-100">
                {comments[post.id]?.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 group">
                    <Avatar className="h-8 w-8 border border-slate-100 bg-slate-200">
                      <AvatarImage src={comment.authorId === user.uid ? user.photoURL : `https://api.dicebear.com/7.x/initials/svg?seed=${comment.authorName}`} />
                      <AvatarFallback className="bg-slate-900 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-slate-900">{comment.authorName}</p>
                        <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</p>
                      </div>
                      <p className="text-sm text-slate-600">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {/* Add Comment */}
                <div className="flex items-center space-x-3 pt-2">
                  <Avatar className="h-8 w-8 bg-slate-200">
                    <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                    <AvatarFallback className="bg-slate-900 text-white">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 relative">
                    <Input 
                      placeholder="Write an answer..." 
                      className="h-10 rounded-full bg-white border-slate-200 pr-10 focus:ring-emerald-500"
                      value={newCommentContent[post.id] || ''}
                      onChange={(e) => setNewCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateComment(post.id)}
                    />
                    <button 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 disabled:text-slate-300"
                      disabled={!newCommentContent[post.id]?.trim()}
                      onClick={() => handleCreateComment(post.id)}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        ))}
        {posts.length === 0 && !loading && (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No discussions yet</h3>
            <p className="text-slate-500">Be the first to start a conversation!</p>
          </div>
        )}
      </div>

      <DeleteConfirmDialog 
        isOpen={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        onConfirm={() => deleteId && handleDeletePost(deleteId)}
        title="Delete Post"
        description="Are you sure you want to delete this community post? This action cannot be undone."
      />
    </div>
  );
}
