import { useEffect, useState, useRef } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Note } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Clock, 
  Tag,
  ChevronRight,
  ArrowLeft,
  FileText,
  ExternalLink,
  Upload,
  File,
  X
} from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface NotesProps {
  user: UserProfile;
}

export default function Notes({ user }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Admin form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isAdmin = user.role === 'admin';

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setNotes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!title || !topic || !content) return;

    try {
      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id), {
          title,
          topic,
          content,
          pdfUrl,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          title,
          topic,
          content,
          pdfUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
      fetchNotes();
      if (selectedNote?.id === id) setSelectedNote(null);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setContent('');
    setPdfUrl('');
    setEditingNote(null);
  };

  if (selectedNote) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <Button variant="ghost" onClick={() => setSelectedNote(null)} className="mb-4 hover:bg-emerald-50 text-emerald-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes
        </Button>
        
        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 p-8">
            <div className="flex items-center space-x-2 text-emerald-600 mb-4">
              <Tag className="h-4 w-4" />
              <span className="text-sm font-bold uppercase tracking-wider">{selectedNote.topic}</span>
            </div>
            <CardTitle className="text-4xl font-bold text-slate-900 leading-tight">{selectedNote.title}</CardTitle>
            <div className="flex items-center text-slate-400 text-sm mt-4">
              <Clock className="h-4 w-4 mr-1" />
              Last updated: {new Date(selectedNote.updatedAt).toLocaleDateString()}
            </div>
            {selectedNote.pdfUrl && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <FileText className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Attached PDF Lesson</p>
                    <p className="text-xs text-slate-500">Click to view or download the PDF material</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => window.open(selectedNote.pdfUrl, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> View PDF
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-8 prose prose-slate max-w-none">
            <div className="markdown-body">
              <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Study Notes</h1>
          <p className="text-slate-500 mt-1">Comprehensive guides to master English grammar and vocabulary.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100" />}>
              <Plus className="mr-2 h-4 w-4" /> Add New Note
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</DialogTitle>
                <DialogDescription>
                  Fill in the details below. You can use Markdown for the content.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Present Continuous Tense" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic / Category</Label>
                  <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Grammar" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Content (Markdown supported)</Label>
                  <Textarea 
                    id="content" 
                    value={content} 
                    onChange={(e) => setContent(e.target.value)} 
                    placeholder="Write your lesson content here..." 
                    className="min-h-[200px] rounded-xl border-slate-200 focus:ring-emerald-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>PDF Attachment</Label>
                  <FileUpload 
                    value={pdfUrl} 
                    onFileSelect={setPdfUrl} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNote} className="bg-emerald-600 hover:bg-emerald-700">
                  {editingNote ? 'Update Note' : 'Save Note'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Search notes by title or topic..." 
          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-emerald-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-all group flex flex-col bg-white overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  {note.topic}
                </span>
                {isAdmin && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" onClick={(e) => {
                      e.stopPropagation();
                      setEditingNote(note);
                      setTitle(note.title);
                      setTopic(note.topic);
                      setContent(note.content);
                      setPdfUrl(note.pdfUrl || '');
                      setIsDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(note.id);
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                {note.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-1">
              <p className="text-slate-500 text-sm line-clamp-3">
                {note.content.replace(/[#*`]/g, '')}
              </p>
            </CardContent>
            <CardFooter className="p-6 pt-0 border-t border-slate-50 mt-auto">
              <div className="flex items-center justify-between w-full pt-4">
                <div className="flex items-center text-xs text-slate-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
                <Button variant="ghost" className="text-emerald-600 font-bold text-sm p-0 h-auto hover:bg-transparent" onClick={() => setSelectedNote(note)}>
                  Read More <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
        {filteredNotes.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No notes found</h3>
            <p className="text-slate-500">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>

      <DeleteConfirmDialog 
        isOpen={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        onConfirm={() => deleteId && handleDeleteNote(deleteId)}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
      />
    </div>
  );
}
