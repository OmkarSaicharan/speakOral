import { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, doc, orderBy, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Assignment, Submission } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Send,
  GraduationCap,
  ExternalLink,
  Users as UsersIcon,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { FileUpload } from '../components/FileUpload';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

interface AssignmentsProps {
  user: UserProfile;
}

export default function Assignments({ user }: AssignmentsProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  // Submission form state
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionPdfUrl, setSubmissionPdfUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Grading state
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [feedback, setFeedback] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchAssignments();
    if (!isAdmin) {
      fetchUserSubmissions();
    } else {
      fetchAllSubmissions();
    }
  }, [isAdmin]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setAssignments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment)));
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async () => {
    try {
      const q = query(collection(db, 'submissions'), where('studentId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      setSubmissions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const fetchAllSubmissions = async () => {
    try {
      const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setSubmissions(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
    } catch (error) {
      console.error("Error fetching all submissions:", error);
    }
  };

  const handleSaveAssignment = async () => {
    if (!title || !description || !dueDate) return;

    try {
      await addDoc(collection(db, 'assignments'), {
        title,
        description,
        pdfUrl,
        dueDate,
        createdAt: new Date().toISOString(),
      });
      setIsDialogOpen(false);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'assignments', id));
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  const handleSubmitAssignment = async () => {
    if (!submissionContent || !selectedAssignment) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'submissions'), {
        assignmentId: selectedAssignment.id,
        studentId: user.uid,
        studentName: user.name,
        content: submissionContent,
        pdfUrl: submissionPdfUrl,
        submittedAt: new Date().toISOString(),
      });

      // Add notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Assignment Submitted!',
        message: `Your work for "${selectedAssignment.title}" has been received.`,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString()
      });

      setSubmissionContent('');
      setSelectedAssignment(null);
      fetchUserSubmissions();
    } catch (error) {
      console.error("Error submitting assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) return;

    try {
      await updateDoc(doc(db, 'submissions', gradingSubmission.id), {
        marks,
        feedback,
        gradedAt: new Date().toISOString(),
      });

      // Add notification for student
      await addDoc(collection(db, 'notifications'), {
        userId: gradingSubmission.studentId,
        title: 'Assignment Graded!',
        message: `Your submission for assignment has been graded. Marks: ${marks}`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      });

      setGradingSubmission(null);
      setMarks(0);
      setFeedback('');
      fetchAllSubmissions();
    } catch (error) {
      console.error("Error grading submission:", error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPdfUrl('');
    setDueDate('');
  };

  const getSubmissionForAssignment = (assignmentId: string) => {
    return submissions.find(s => s.assignmentId === assignmentId);
  };

  const filteredAssignments = assignments.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedAssignment) {
    const submission = getSubmissionForAssignment(selectedAssignment.id);
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <Button variant="ghost" onClick={() => setSelectedAssignment(null)} className="mb-4 hover:bg-emerald-50 text-emerald-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignments
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader className="p-8">
                <div className="flex items-center space-x-2 text-emerald-600 mb-4">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">Assignment</span>
                </div>
                <CardTitle className="text-3xl font-bold text-slate-900 leading-tight">{selectedAssignment.title}</CardTitle>
                <div className="flex items-center text-slate-400 text-sm mt-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due Date: {format(new Date(selectedAssignment.dueDate), 'PPP')}
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0 prose prose-slate max-w-none">
                <p className="text-slate-600 whitespace-pre-wrap mb-6">{selectedAssignment.description}</p>
                {selectedAssignment.pdfUrl && (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <FileText className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Task PDF</p>
                        <p className="text-xs text-slate-500">Download assignment instructions</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => window.open(selectedAssignment.pdfUrl, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" /> View PDF
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {submission ? (
              <Card className="border-none shadow-sm bg-white border-l-4 border-l-green-500">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-bold text-slate-900">Your Submission</CardTitle>
                  <CardDescription>Submitted on {format(new Date(submission.submittedAt), 'PPP')}</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="bg-slate-50 p-6 rounded-2xl text-slate-700 whitespace-pre-wrap mb-6">
                    {submission.content}
                  </div>
                  {submission.pdfUrl && (
                    <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          <FileText className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-900">Submitted PDF</p>
                          <p className="text-xs text-emerald-500">Your uploaded work file</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => window.open(submission.pdfUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" /> View PDF
                      </Button>
                    </div>
                  )}
                  {submission.gradedAt && (
                    <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-green-800 flex items-center">
                          <GraduationCap className="mr-2 h-5 w-5" /> Grade & Feedback
                        </h4>
                        <span className="text-2xl font-black text-green-600">{submission.marks}/100</span>
                      </div>
                      <p className="text-green-700 italic">"{submission.feedback}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm bg-white">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-bold text-slate-900">Submit Your Work</CardTitle>
                  <CardDescription>Type your answer or paste a link to your work below.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sub-content">Your Answer</Label>
                    <Textarea 
                      id="sub-content"
                      placeholder="Write your submission here..." 
                      className="min-h-[150px] rounded-2xl border-slate-200 focus:ring-emerald-500"
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sub-pdf">PDF Attachment (Optional)</Label>
                    <FileUpload 
                      value={submissionPdfUrl} 
                      onFileSelect={setSubmissionPdfUrl} 
                    />
                  </div>
                  <Button 
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold"
                    onClick={handleSubmitAssignment}
                    disabled={isSubmitting || !submissionContent}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-sm text-slate-500">Submission</span>
                  {submission ? (
                    <span className="text-sm font-bold text-green-600 flex items-center">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Submitted
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-orange-600 flex items-center">
                      <Clock className="mr-1 h-4 w-4" /> Pending
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-sm text-slate-500">Grading</span>
                  {submission?.gradedAt ? (
                    <span className="text-sm font-bold text-green-600 flex items-center">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Graded
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-slate-400 flex items-center">
                      <Clock className="mr-1 h-4 w-4" /> Not Graded
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-100">
              <AlertCircle className="h-8 w-8 mb-4 text-emerald-200" />
              <h4 className="font-bold text-lg mb-2">Important Note</h4>
              <p className="text-emerald-100 text-sm leading-relaxed">
                Please ensure your submission is original work. Plagiarism will result in a zero grade. Contact your instructor if you need an extension.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-600 mt-1">Practical tasks to apply what you've learned.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 w-full md:w-auto" />}>
              <Plus className="mr-2 h-4 w-4" /> Create Assignment
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[90vh] overflow-y-auto rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Set a task for your students with a clear deadline.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="as-title">Title</Label>
                  <Input id="as-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Essay on Climate Change" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="as-desc">Description</Label>
                  <Textarea id="as-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide detailed instructions..." className="min-h-[150px]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="as-pdf">PDF Attachment (Optional)</Label>
                  <FileUpload 
                    value={pdfUrl} 
                    onFileSelect={setPdfUrl} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="as-due">Due Date</Label>
                  <Input id="as-due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveAssignment} className="bg-emerald-600 hover:bg-emerald-700">Save Assignment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Search assignments..." 
          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-emerald-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => {
          const submission = getSubmissionForAssignment(assignment.id);
          const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
          const submissionCount = submissions.filter(s => s.assignmentId === assignment.id).length;

          return (
            <Card key={assignment.id} className="border-none shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden flex flex-col">
              <CardHeader className="p-6 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
                    isAdmin ? "bg-emerald-50 text-emerald-600" : (submission ? "bg-green-50 text-green-600" : isOverdue ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600")
                  )}>
                    {isAdmin ? `${submissionCount} Submissions` : (submission ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-slate-400 text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(assignment.dueDate), 'MMM d')}
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(assignment.id);
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {assignment.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1">
                <p className="text-slate-600 text-sm line-clamp-3">
                  {assignment.description}
                </p>
                {isAdmin && (
                  <div className="mt-4 flex items-center text-xs text-slate-600 font-bold">
                    <UsersIcon className="h-3 w-3 mr-1" />
                    {submissionCount} students submitted
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-6 pt-0 mt-auto border-t border-slate-50">
                <Button 
                  className={cn(
                    "w-full mt-4 rounded-xl font-bold",
                    isAdmin ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-600 hover:bg-emerald-700"
                  )} 
                  onClick={() => isAdmin ? document.getElementById('submissions-table')?.scrollIntoView({ behavior: 'smooth' }) : setSelectedAssignment(assignment)}
                >
                  {isAdmin ? 'Check Submissions' : (submission ? 'View Submission' : 'Submit Work')}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {filteredAssignments.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No assignments found</h3>
            <p className="text-slate-500">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>

      {isAdmin && submissions.length > 0 && (
        <div id="submissions-table" className="pt-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Recent Submissions</h2>
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assignment</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-900">{sub.studentName}</p>
                          <p className="text-xs text-slate-500">{format(new Date(sub.submittedAt), 'MMM d, h:mm a')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-700 font-medium">
                            {assignments.find(a => a.id === sub.assignmentId)?.title || 'Unknown'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          {sub.gradedAt ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                              Graded ({sub.marks}/100)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">
                              Needs Grading
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Dialog open={gradingSubmission?.id === sub.id} onOpenChange={(open) => !open && setGradingSubmission(null)}>
                            <DialogTrigger render={<Button variant="ghost" size="sm" className="text-emerald-600 font-bold hover:bg-emerald-50" onClick={() => {
                                setGradingSubmission(sub);
                                setMarks(sub.marks || 0);
                                setFeedback(sub.feedback || '');
                              }} />}>
                              {sub.gradedAt ? 'Edit Grade' : 'Grade Now'}
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>Grade Submission</DialogTitle>
                                <DialogDescription>
                                  Review {sub.studentName}'s work and provide feedback.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap max-h-[200px] overflow-y-auto border border-slate-100">
                                  {sub.content}
                                </div>
                                {sub.pdfUrl && (
                                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4 text-emerald-600" />
                                      <span className="text-xs font-bold text-emerald-900">Student PDF Attachment</span>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-emerald-600 hover:bg-emerald-100"
                                      onClick={() => window.open(sub.pdfUrl, '_blank')}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" /> View
                                    </Button>
                                  </div>
                                )}
                                <div className="grid gap-2">
                                  <Label htmlFor="marks">Marks (out of 100)</Label>
                                  <Input id="marks" type="number" min="0" max="100" value={marks} onChange={(e) => setMarks(parseInt(e.target.value))} />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="feedback">Feedback</Label>
                                  <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Great job! Next time try to..." />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setGradingSubmission(null)}>Cancel</Button>
                                <Button onClick={handleGradeSubmission} className="bg-emerald-600 hover:bg-emerald-700">Submit Grade</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DeleteConfirmDialog 
        isOpen={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)} 
        onConfirm={() => deleteId && handleDeleteAssignment(deleteId)}
        title="Delete Assignment"
        description="Are you sure you want to delete this assignment? This action cannot be undone."
      />
    </div>
  );
}
