import { useEffect, useState } from 'react';
import { collection, query, getDocs, limit, orderBy, count, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, QuizResult, Note, Video, Assignment, CoursePlan } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '../lib/utils';
import { 
  Users, 
  BookOpen, 
  Video as VideoIcon, 
  FileText, 
  Plus,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Calendar,
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    notes: 0,
    videos: 0,
    quizzes: 0,
    assignments: 0
  });
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  // Enrollment form state
  const [selectedPlan, setSelectedPlan] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const coursePlans: CoursePlan[] = [
    { id: 'monthly', name: 'Monthly Plan', price: 19, duration: '1 Month', features: [] },
    { id: 'semi-annual', name: '6 Months Plan', price: 89, duration: '6 Months', features: [] },
    { id: 'annual', name: '1 Year Plan', price: 159, duration: '12 Months', features: [] }
  ];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const notesSnap = await getDocs(collection(db, 'notes'));
        const videosSnap = await getDocs(collection(db, 'videos'));
        const quizzesSnap = await getDocs(collection(db, 'quizzes'));
        const assignmentsSnap = await getDocs(collection(db, 'assignments'));

        const studentsList = studentsSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setStudents(studentsList);

        setStats({
          students: studentsSnap.size,
          notes: notesSnap.size,
          videos: videosSnap.size,
          quizzes: quizzesSnap.size,
          assignments: assignmentsSnap.size
        });

        const resultsSnap = await getDocs(query(collection(db, 'results'), orderBy('completedAt', 'desc'), limit(5)));
        setRecentResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult)));
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleUpdateEnrollment = async () => {
    if (!selectedStudent || !selectedPlan || !startDate || !endDate) return;

    const plan = coursePlans.find(p => p.id === selectedPlan);
    if (!plan) return;

    try {
      await updateDoc(doc(db, 'users', selectedStudent.uid), {
        enrollment: {
          planId: plan.id,
          planName: plan.name,
          registeredAt: selectedStudent.enrollment?.registeredAt || new Date().toISOString(),
          startedAt: startDate,
          endsAt: endDate,
          status: 'active'
        }
      });
      
      // Update local state
      setStudents(students.map(s => 
        s.uid === selectedStudent.uid 
          ? { ...s, enrollment: { planId: plan.id, planName: plan.name, registeredAt: s.enrollment?.registeredAt || new Date().toISOString(), startedAt: startDate, endsAt: endDate, status: 'active' } } 
          : s
      ));
      
      setIsStudentModalOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error updating enrollment:", error);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statCards = [
    { name: 'Total Students', value: stats.students, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Active Courses', value: students.filter(s => s.enrollment?.status === 'active').length, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Completed Quizzes', value: stats.quizzes, icon: GraduationCap, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Assignments', value: stats.assignments, icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">speakOral Admin</h1>
          <p className="text-slate-600 mt-1">Monitor platform performance and manage students.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Student Management & Performance */}
        <div className="lg:col-span-2 space-y-8">
          {/* Student Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Student Management</h2>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search students..." 
                  className="pl-9 h-9 rounded-xl border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student Details</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course Plan</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((student) => (
                        <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm mr-3">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                                <p className="text-xs text-slate-500">{student.email}</p>
                                <p className="text-[10px] text-slate-400">Registered: {new Date(student.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {student.enrollment ? (
                              <div>
                                <p className="text-sm font-medium text-emerald-600">{student.enrollment.planName}</p>
                                <p className="text-[10px] text-slate-500">ID: {student.enrollment.planId}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No plan active</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {student.enrollment ? (
                              <div className="space-y-1">
                                <div className="flex items-center text-[10px] text-slate-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Start: {new Date(student.enrollment.startedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center text-[10px] text-slate-500">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  End: {new Date(student.enrollment.endsAt).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Dialog open={isStudentModalOpen && selectedStudent?.uid === student.uid} onOpenChange={(open) => {
                              setIsStudentModalOpen(open);
                              if (open) {
                                setSelectedStudent(student);
                                if (student.enrollment) {
                                  setSelectedPlan(student.enrollment.planId);
                                  setStartDate(student.enrollment.startedAt.split('T')[0]);
                                  setEndDate(student.enrollment.endsAt.split('T')[0]);
                                } else {
                                  setSelectedPlan('');
                                  setStartDate('');
                                  setEndDate('');
                                }
                              }
                            }}>
                              <DialogTrigger render={<Button variant="outline" size="sm" className="rounded-lg border-slate-200 text-slate-600 hover:text-emerald-600" />}>
                                Manage
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Manage Student Enrollment</DialogTitle>
                                  <DialogDescription className="text-slate-600">
                                    Update course plan and enrollment dates for {student.name}.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label>Course Plan</Label>
                                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                      <SelectTrigger className="rounded-xl border-slate-200">
                                        <SelectValue placeholder="Select a plan" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {coursePlans.map(plan => (
                                          <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label>Start Date</Label>
                                      <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-xl border-slate-200" />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>End Date</Label>
                                      <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-xl border-slate-200" />
                                    </div>
                                  </div>
                                  {student.enrollment && (
                                    <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      <p className="text-xs font-bold text-slate-900 mb-1">Current Enrollment Info:</p>
                                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                                        <div>Registered: {new Date(student.enrollment.registeredAt).toLocaleString()}</div>
                                        <div>Status: <span className="text-emerald-600 font-bold uppercase">{student.enrollment.status}</span></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setIsStudentModalOpen(false)}>Cancel</Button>
                                  <Button onClick={handleUpdateEnrollment} className="bg-emerald-600 hover:bg-emerald-700">
                                    Update Enrollment
                                  </Button>
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

          {/* Recent Performance */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Student Performance</h2>
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                View all results <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Quiz</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentResults.map((result) => (
                        <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs mr-3">
                                {result.studentName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{result.studentName}</p>
                                <p className="text-xs text-slate-500">{result.rollNumber || 'No ID'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700 font-medium">{result.quizTitle}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-xs font-bold",
                                (result.score / result.totalQuestions) >= 0.7 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                              )}>
                                {Math.round((result.score / result.totalQuestions) * 100)}%
                              </span>
                              <span className="ml-2 text-xs text-slate-400">{result.score}/{result.totalQuestions}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {new Date(result.completedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {recentResults.length === 0 && !loading && (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                            No results recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Management & Stats */}
        <div className="space-y-6">
          <Card className="border-none bg-slate-900 text-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-emerald-400" />
                Platform Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">New Students (This Month)</span>
                  <span className="text-sm font-bold text-emerald-400">+12%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Engagement Rate</span>
                  <span className="text-sm font-bold text-emerald-400">84%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link to="/messages" className="block">
                <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  View Messages
                </Button>
              </Link>
              <Link to="/profile" className="block">
                <Button variant="outline" className="w-full justify-start rounded-xl border-slate-200">
                  <User className="mr-2 h-4 w-4" />
                  Admin Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

