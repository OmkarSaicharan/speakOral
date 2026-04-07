import { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Video } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Video as VideoIcon, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Play,
  ExternalLink,
  Tag,
  Clock
} from 'lucide-react';

interface VideosProps {
  user: UserProfile;
}

export default function Videos({ user }: VideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Admin form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [url, setUrl] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'videos'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setVideos(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Video)));
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVideo = async () => {
    if (!title || !topic || !url) return;

    try {
      if (editingVideo) {
        await updateDoc(doc(db, 'videos', editingVideo.id), {
          title,
          topic,
          url,
        });
      } else {
        await addDoc(collection(db, 'videos'), {
          title,
          topic,
          url,
          createdAt: new Date().toISOString(),
        });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchVideos();
    } catch (error) {
      console.error("Error saving video:", error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;
    try {
      await deleteDoc(doc(db, 'videos', id));
      fetchVideos();
      if (activeVideo?.id === id) setActiveVideo(null);
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setUrl('');
    setEditingVideo(null);
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Video Lessons</h1>
          <p className="text-slate-500 mt-1">Watch and learn from our curated English tutorials.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100" />}>
              <Plus className="mr-2 h-4 w-4" /> Add New Video
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingVideo ? 'Edit Video' : 'Add New Video'}</DialogTitle>
                <DialogDescription>
                  Enter the video details and YouTube URL.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. English Pronunciation Tips" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Speaking" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">YouTube URL</Label>
                  <Input id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveVideo} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingVideo ? 'Update Video' : 'Save Video'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {activeVideo && (
        <Card className="border-none shadow-xl bg-slate-900 overflow-hidden animate-in zoom-in-95 duration-300">
          <div className="aspect-video w-full">
            <iframe 
              src={getEmbedUrl(activeVideo.url)}
              title={activeVideo.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
          <CardHeader className="bg-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">{activeVideo.title}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Tag className="h-3 w-3 mr-1" /> {activeVideo.topic}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setActiveVideo(null)}>Close Player</Button>
            </div>
          </CardHeader>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Search videos by title or topic..." 
          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="border-none shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors cursor-pointer" onClick={() => setActiveVideo(video)}>
              <VideoIcon className="h-12 w-12 text-slate-300 group-hover:text-blue-400 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="bg-white p-3 rounded-full shadow-lg">
                  <Play className="h-6 w-6 text-blue-600 fill-blue-600" />
                </div>
              </div>
            </div>
            <CardHeader className="p-5 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  {video.topic}
                </span>
                {isAdmin && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={(e) => {
                      e.stopPropagation();
                      setEditingVideo(video);
                      setTitle(video.title);
                      setTopic(video.topic);
                      setUrl(video.url);
                      setIsDialogOpen(true);
                    }}>
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600" onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVideo(video.id);
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 cursor-pointer" onClick={() => setActiveVideo(video)}>
                {video.title}
              </CardTitle>
            </CardHeader>
            <CardFooter className="p-5 pt-0 mt-auto">
              <div className="flex items-center justify-between w-full pt-4 border-t border-slate-50">
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(video.createdAt).toLocaleDateString()}
                </div>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 h-8" onClick={() => setActiveVideo(video)}>
                  Watch Now
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        {filteredVideos.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <VideoIcon className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No videos found</h3>
            <p className="text-slate-500">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
