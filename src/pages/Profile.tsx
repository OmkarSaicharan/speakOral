import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Hash, Camera, Save, Loader2 } from 'lucide-react';

interface ProfileProps {
  user: UserProfile;
  onUserUpdate: (user: UserProfile) => void;
}

export default function Profile({ user, onUserUpdate }: ProfileProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user.name);
  const [rollNumber, setRollNumber] = useState(user.rollNumber || '');
  const [photoURL, setPhotoURL] = useState(user.photoURL || '');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const updatedProfile = {
        ...user,
        name,
        rollNumber,
        photoURL,
      };
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        rollNumber,
        photoURL,
      });
      onUserUpdate(updatedProfile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 font-display tracking-tight">My Profile</h1>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700"></div>
        <CardContent className="relative px-6 pb-8">
          <div className="flex flex-col items-center -mt-16 mb-8">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarImage src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                <AvatarFallback className="text-4xl bg-emerald-50 text-emerald-600">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-4">{name}</h2>
            <p className="text-slate-500 capitalize">{user.role}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center text-slate-700">
                  <User className="w-4 h-4 mr-2 text-emerald-600" />
                  Full Name
                </Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center text-slate-700">
                  <Mail className="w-4 h-4 mr-2 text-emerald-600" />
                  Email Address
                </Label>
                <Input 
                  id="email" 
                  value={user.email} 
                  disabled 
                  className="rounded-xl bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roll" className="flex items-center text-slate-700">
                  <Hash className="w-4 h-4 mr-2 text-emerald-600" />
                  Roll Number
                </Label>
                <Input 
                  id="roll" 
                  value={rollNumber} 
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="ENG-2024-XXX"
                  className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo" className="flex items-center text-slate-700">
                  <Camera className="w-4 h-4 mr-2 text-emerald-600" />
                  Photo URL
                </Label>
                <Input 
                  id="photo" 
                  value={photoURL} 
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                User ID: <span className="font-mono">{user.uid}</span>
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-lg shadow-emerald-200"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
            {success && (
              <p className="text-center text-emerald-600 font-medium animate-in slide-in-from-bottom-2">
                Profile updated successfully!
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg bg-emerald-50">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-900">Account Details</CardTitle>
          <CardDescription className="text-emerald-700">Information about your registration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-emerald-100">
            <span className="text-emerald-800 font-medium">Member Since</span>
            <span className="text-emerald-600">{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-emerald-100">
            <span className="text-emerald-800 font-medium">Account Type</span>
            <span className="text-emerald-600 capitalize">{user.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
