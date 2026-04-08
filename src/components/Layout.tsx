import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { UserProfile, Notification } from '../types';
import { cn } from '../lib/utils';
import { 
  LayoutDashboard, 
  BookOpen, 
  Video, 
  PenTool, 
  FileText, 
  Users, 
  LogOut, 
  Menu,
  X,
  GraduationCap,
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  User,
  MessageSquare
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Chatbot from './Chatbot';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';

interface LayoutProps {
  user: UserProfile;
}

export default function Layout({ user }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(notifs);
      setHasUnread(notifs.some(n => !n.read));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user.uid]);

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      }
    });
    await batch.commit();
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Notes', path: '/notes', icon: BookOpen },
    { name: 'Videos', path: '/videos', icon: Video },
    { name: 'Quizzes', path: '/quizzes', icon: PenTool },
    { name: 'Assignments', path: '/assignments', icon: FileText },
    { name: 'Messages', path: '/messages', icon: MessageSquare },
    { name: 'Community', path: '/community', icon: Users },
  ];

  const NavLinks = () => (
    <nav className="space-y-1 px-2">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              "flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-950/50" 
                : "text-emerald-100/70 hover:bg-emerald-800 hover:text-white"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className={cn(
              "mr-3 h-5 w-5 transition-colors",
              isActive ? "text-white" : "text-emerald-400 group-hover:text-white"
            )} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-emerald-900 border-r border-emerald-800 sticky top-0 h-screen shadow-xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-emerald-500 p-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight font-display">speakOral</span>
        </div>

        <div className="flex-1 py-4">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-emerald-800/50">
          <Link to="/profile" className="flex items-center p-2 mb-4 hover:bg-emerald-800/50 rounded-xl transition-colors">
            <Avatar className="h-10 w-10 border-2 border-emerald-700 bg-slate-200">
              <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback className="bg-slate-900 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-emerald-300 capitalize">{user.role}</p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-800 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-emerald-800 border-b border-emerald-700 h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-md">
          <div className="flex items-center">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden mr-2 text-white hover:bg-emerald-700" />}>
                <Menu className="h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-emerald-900 border-emerald-800">
                <div className="p-6 flex items-center space-x-3 border-b border-emerald-800">
                  <div className="bg-emerald-500 p-2 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-white font-display">speakOral</span>
                </div>
                <div className="py-6">
                  <NavLinks />
                </div>
                <div className="absolute bottom-0 w-full p-4 border-t border-emerald-800">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-emerald-100 hover:text-white hover:bg-emerald-800 rounded-xl"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-semibold text-white hidden md:block">
              {navItems.find(item => item.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <Dialog onOpenChange={(open) => open && hasUnread && markAllAsRead()}>
              <DialogTrigger render={<Button variant="ghost" size="icon" className="text-emerald-100 hover:text-white hover:bg-emerald-700 relative" />}>
                <Bell className="h-5 w-5" />
                {hasUnread && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-emerald-800"></span>
                )}
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Notifications</DialogTitle>
                  <DialogDescription>Stay updated with your latest learning activities.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "flex items-start space-x-4 p-3 rounded-xl transition-colors",
                          n.read ? "hover:bg-slate-50" : "bg-emerald-50 border border-emerald-100"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-full",
                          n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                          n.type === 'warning' ? "bg-orange-100 text-orange-600" :
                          n.type === 'error' ? "bg-red-100 text-red-600" :
                          "bg-blue-100 text-blue-600"
                        )}>
                          {n.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                           n.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                           n.type === 'error' ? <AlertCircle className="h-4 w-4" /> :
                           <Info className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <Bell className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No notifications yet</p>
                      <p className="text-xs text-slate-400">We'll notify you when something happens.</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 rounded-xl"
                    onClick={markAllAsRead}
                  >
                    Mark All as Read
                  </Button>
                )}
              </DialogContent>
            </Dialog>
            <Link to="/profile" className="md:hidden">
              <Avatar className="h-8 w-8 bg-slate-200">
                <AvatarImage src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                <AvatarFallback className="bg-slate-900 text-white">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <Chatbot />
      </div>
    </div>
  );
}
