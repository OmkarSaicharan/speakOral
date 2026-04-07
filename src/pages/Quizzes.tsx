import { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, doc, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Quiz, QuizResult, Question } from '../types';
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
  PenTool, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  ArrowLeft,
  Trophy,
  Timer,
  HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';

interface QuizzesProps {
  user: UserProfile;
}

export default function Quizzes({ user }: QuizzesProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  
  // Quiz taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  // Admin form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  ]);

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setQuizzes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz)));
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    if (field === 'question') newQuestions[index].question = value;
    if (field === 'correctAnswer') newQuestions[index].correctAnswer = parseInt(value);
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async () => {
    if (!title || !topic || questions.some(q => !q.question)) return;

    try {
      await addDoc(collection(db, 'quizzes'), {
        title,
        topic,
        questions,
        createdAt: new Date().toISOString(),
      });
      setIsDialogOpen(false);
      resetForm();
      fetchQuizzes();
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setTopic('');
    setQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]);
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setQuizFinished(false);
    setScore(0);
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < activeQuiz!.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    let finalScore = 0;
    activeQuiz!.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setQuizFinished(true);

    // Save result to Firestore
    try {
      const result: Omit<QuizResult, 'id'> = {
        studentId: user.uid,
        studentName: user.name,
        rollNumber: user.rollNumber,
        quizId: activeQuiz!.id,
        quizTitle: activeQuiz!.title,
        score: finalScore,
        totalQuestions: activeQuiz!.questions.length,
        completedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'results'), result);

      // Add notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Quiz Completed!',
        message: `You scored ${finalScore}/${activeQuiz!.questions.length} in "${activeQuiz!.title}".`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeQuiz) {
    if (quizFinished) {
      const percentage = Math.round((score / activeQuiz.questions.length) * 100);
      return (
        <div className="max-w-2xl mx-auto py-12 animate-in zoom-in-95 duration-500">
          <Card className="border-none shadow-2xl overflow-hidden bg-white text-center">
            <div className="bg-emerald-600 p-12 flex flex-col items-center">
              <div className="bg-white/20 p-6 rounded-full mb-6">
                <Trophy className="h-16 w-16 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
              <p className="text-blue-100">Congratulations on finishing the {activeQuiz.title} quiz.</p>
            </div>
            <CardContent className="p-12">
              <div className="flex justify-center items-baseline space-x-2 mb-8">
                <span className="text-6xl font-black text-slate-900">{score}</span>
                <span className="text-2xl text-slate-400 font-medium">/ {activeQuiz.questions.length}</span>
              </div>
              
              <div className="space-y-4 mb-10">
                <div className="flex justify-between text-sm font-medium text-slate-500 mb-1">
                  <span>Accuracy</span>
                  <span>{percentage}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      percentage >= 70 ? "bg-green-500" : percentage >= 40 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setActiveQuiz(null)}>
                  Back to Quizzes
                </Button>
                <Button className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={() => startQuiz(activeQuiz)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setActiveQuiz(null)} className="text-slate-500 hover:text-blue-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quit Quiz
          </Button>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-slate-500 text-sm font-medium">
              <Timer className="h-4 w-4 mr-1" /> 15:00
            </div>
            <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
              Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
          ></div>
        </div>

        <Card className="border-none shadow-xl bg-white p-8">
          <CardHeader className="px-0 pt-0">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              {currentQuestion.question}
            </h2>
          </CardHeader>
          <CardContent className="px-0 py-8">
            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={cn(
                    "flex items-center p-5 rounded-2xl border-2 text-left transition-all duration-200",
                    selectedAnswers[currentQuestionIndex] === index
                      ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md"
                      : "border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold text-sm",
                    selectedAnswers[currentQuestionIndex] === index
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-400"
                  )}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="font-medium">{option}</span>
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="px-0 pb-0 pt-4 flex justify-end">
            <Button 
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 px-8 rounded-xl h-12"
              disabled={selectedAnswers[currentQuestionIndex] === -1}
              onClick={nextQuestion}
            >
              {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quizzes</h1>
          <p className="text-slate-500 mt-1">Test your knowledge and track your progress.</p>
        </div>
        
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger render={<Button className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100" />}>
              <Plus className="mr-2 h-4 w-4" /> Create Quiz
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
                <DialogDescription>
                  Define your quiz title, topic, and multiple choice questions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quiz-title">Quiz Title</Label>
                    <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Tenses Mastery" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="quiz-topic">Topic</Label>
                    <Input id="quiz-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Grammar" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Questions</h3>
                    <Button variant="outline" size="sm" onClick={handleAddQuestion}>
                      <Plus className="mr-2 h-4 w-4" /> Add Question
                    </Button>
                  </div>
                  
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="p-4 border border-slate-200 rounded-xl space-y-4 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Question {qIndex + 1}</span>
                        {questions.length > 1 && (
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}>
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Question Text</Label>
                        <Input value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)} placeholder="Enter the question..." />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {q.options.map((option, oIndex) => (
                          <div key={oIndex} className="grid gap-1">
                            <Label className="text-[10px] uppercase text-slate-400">Option {String.fromCharCode(65 + oIndex)}</Label>
                            <Input value={option} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} placeholder={`Option ${oIndex + 1}`} />
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-2">
                        <Label>Correct Answer</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                        >
                          {q.options.map((_, oIndex) => (
                            <option key={oIndex} value={oIndex}>Option {String.fromCharCode(65 + oIndex)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveQuiz} className="bg-emerald-600 hover:bg-emerald-700">Save Quiz</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="Search quizzes by title or topic..." 
          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <Card key={quiz.id} className="border-none shadow-sm hover:shadow-md transition-all group bg-white overflow-hidden flex flex-col">
            <CardHeader className="p-6 pb-2">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                  {quiz.topic}
                </span>
                <div className="flex items-center text-slate-400 text-xs">
                  <HelpCircle className="h-3 w-3 mr-1" />
                  {quiz.questions.length} Questions
                </div>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {quiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 flex-1">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Timer className="h-3 w-3" />
                <span>Approx. {quiz.questions.length * 2} mins</span>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0 mt-auto border-t border-slate-50">
              <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold" onClick={() => startQuiz(quiz)}>
                Start Quiz
              </Button>
            </CardFooter>
          </Card>
        ))}
        {filteredQuizzes.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PenTool className="h-8 w-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No quizzes found</h3>
            <p className="text-slate-500">Try adjusting your search or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
