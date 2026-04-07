/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from './types';

// Pages (to be created)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Notes from './pages/Notes';
import Videos from './pages/Videos';
import Quizzes from './pages/Quizzes';
import Assignments from './pages/Assignments';
import Community from './pages/Community';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleUserUpdate = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserProfile);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onUserUpdate={setUser} />} />
        
        <Route element={user ? <Layout user={user} /> : <Navigate to="/login" />}>
          <Route path="/" element={user?.role === 'admin' ? <AdminDashboard /> : <Dashboard user={user!} />} />
          <Route path="/notes" element={<Notes user={user!} />} />
          <Route path="/videos" element={<Videos user={user!} />} />
          <Route path="/quizzes" element={<Quizzes user={user!} />} />
          <Route path="/assignments" element={<Assignments user={user!} />} />
          <Route path="/community" element={<Community user={user!} />} />
          <Route path="/profile" element={<Profile user={user!} onUserUpdate={handleUserUpdate} />} />
        </Route>
      </Routes>
    </Router>
  );
}

