import { useEffect, useState } from 'react';
import { collection, query, getDocs, limit, orderBy, count, where } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, QuizResult, Note, Video, Assignment } from '../types';
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
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    notes: 0,
    videos: 0,
    quizzes: 0,
    assignments: 0
  });
  const [recentResults, setRecentResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // In a real app, we'd use count() but for simplicity we'll just fetch all or use a metadata doc
        const studentsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        const notesSnap = await getDocs(collection(db, 'notes'));
        const videosSnap = await getDocs(collection(db, 'videos'));
        const quizzesSnap = await getDocs(collection(db, 'quizzes'));
        const assignmentsSnap = await getDocs(collection(db, 'assignments'));

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

  const statCards = [
    { name: 'Total Students', value: stats.students, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Notes', value: stats.notes, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Videos', value: stats.videos, icon: VideoIcon, color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Assignments', value: stats.assignments, icon: FileText, color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor platform performance and manage content.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100">
            <Plus className="mr-2 h-4 w-4" /> Create Content
          </Button>
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
        {/* Recent Student Performance */}
        <div className="lg:col-span-2 space-y-6">
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

        {/* Management Links */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Content Management</h2>
          <div className="grid grid-cols-1 gap-4">
            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white border-l-4 border-l-emerald-500">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Manage Notes</CardTitle>
                      <CardDescription className="text-xs">Add or edit text lessons</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white border-l-4 border-l-emerald-500">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <VideoIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Manage Videos</CardTitle>
                      <CardDescription className="text-xs">Upload video tutorials</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white border-l-4 border-l-emerald-500">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Manage Quizzes</CardTitle>
                      <CardDescription className="text-xs">Create and edit MCQs</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group bg-white border-l-4 border-l-emerald-500">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Assignments</CardTitle>
                      <CardDescription className="text-xs">Grade student submissions</CardDescription>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </div>

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
        </div>
      </div>
    </div>
  );
}

