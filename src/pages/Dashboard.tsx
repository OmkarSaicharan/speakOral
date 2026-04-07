import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, QuizResult, Note, Video } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '../lib/utils';
import { 
  BookOpen, 
  Video as VideoIcon, 
  Trophy, 
  Clock, 
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  PenTool,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: UserProfile;
}

export default function Dashboard({ user }: DashboardProps) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent quiz results
        const resultsQuery = query(
          collection(db, 'results'),
          where('studentId', '==', user.uid),
          orderBy('completedAt', 'desc'),
          limit(5)
        );
        const resultsSnap = await getDocs(resultsQuery);
        setResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult)));

        // Fetch recent notes
        const notesQuery = query(
          collection(db, 'notes'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const notesSnap = await getDocs(notesQuery);
        setRecentNotes(notesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note)));
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.uid]);

  const averageScore = results.length > 0 
    ? Math.round((results.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / results.length) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">Welcome back, {user.name}! 👋</h1>
          <p className="text-slate-500 mt-1">Ready to continue your English journey today?</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Current Streak: 5 Days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Recent Lessons</h2>
            <Link to="/notes" className="text-sm font-medium text-emerald-600 hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentNotes.map((note) => (
              <Card key={note.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="p-4 pb-2">
                  <div className="bg-emerald-50 w-fit p-2 rounded-lg mb-2">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-emerald-600 transition-colors text-slate-900">{note.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-slate-500">{note.topic}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center text-xs text-slate-400 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
            {recentNotes.length === 0 && !loading && (
              <div className="col-span-2 p-8 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
                <p className="text-slate-400">No lessons available yet.</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <h2 className="text-xl font-bold text-slate-900">Latest Quiz Results</h2>
          </div>
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {results.map((result) => (
                  <div key={result.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "p-2 rounded-full",
                        (result.score / result.totalQuestions) >= 0.7 ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
                      )}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{result.quizTitle}</p>
                        <p className="text-xs text-slate-500">{new Date(result.completedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{result.score}/{result.totalQuestions}</p>
                      <p className="text-xs text-slate-500">{Math.round((result.score / result.totalQuestions) * 100)}%</p>
                    </div>
                  </div>
                ))}
                {results.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-400">
                    You haven't taken any quizzes yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link to="/quizzes" className={cn(buttonVariants({ variant: "outline" }), "justify-start h-14 rounded-xl border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 group")}>
              <PenTool className="mr-3 h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
              <span>Take a Quiz</span>
            </Link>
            <Link to="/community" className={cn(buttonVariants({ variant: "outline" }), "justify-start h-14 rounded-xl border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 group")}>
              <Users className="mr-3 h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
              <span>Ask a Question</span>
            </Link>
            <Link to="/videos" className={cn(buttonVariants({ variant: "outline" }), "justify-start h-14 rounded-xl border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 group")}>
              <VideoIcon className="mr-3 h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
              <span>Watch Lessons</span>
            </Link>
          </div>

          <Card className="border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-100">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Challenge</CardTitle>
              <CardDescription className="text-emerald-100">Complete 3 quizzes this week to earn a "Grammar Guru" badge!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Progress</span>
                <span>{results.length >= 3 ? '100%' : '33%'}</span>
              </div>
              <Progress value={results.length >= 3 ? 100 : 33} className="h-2 bg-white/20 [&>div]:bg-white" />
              <Button className="w-full mt-6 bg-white text-emerald-600 hover:bg-emerald-50 font-bold rounded-xl">
                Start Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Average Score</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{averageScore}%</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress value={averageScore} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Quizzes Completed</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{results.length}</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Last quiz: {results[0] ? new Date(results[0].completedAt).toLocaleDateString() : 'None'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Lessons Viewed</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">12</h3>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                  {i}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                +8
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
