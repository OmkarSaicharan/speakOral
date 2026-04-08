import { useState } from 'react';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { UserProfile, UserRole, Enrollment } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, BookOpen, LogIn, UserPlus, Check, CreditCard, Smartphone, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

interface LoginProps {
  onUserUpdate: (user: UserProfile) => void;
}

export default function Login({ onUserUpdate }: LoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regStep, setRegStep] = useState(1); // 1: Details, 2: Plan, 3: Payment

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'semi-annual' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'gpay' | 'paytm' | null>(null);

  const plans = [
    { id: 'monthly', name: 'Monthly Plan', price: 0, duration: 1 },
    { id: 'semi-annual', name: '6 Months Plan', price: 0, duration: 6 },
    { id: 'annual', name: '1 Year Plan', price: 0, duration: 12 },
  ];

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        onUserUpdate(userDoc.data() as UserProfile);
      } else {
        // Create new student profile for first time Google login
        const isAdmin = user.email === 'admin@gmail.com';
        const newProfile: UserProfile = {
          uid: user.uid,
          name: user.displayName || 'New Student',
          email: user.email || '',
          role: isAdmin ? 'admin' : 'student',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', user.uid), newProfile);
        onUserUpdate(newProfile);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (userDoc.exists()) {
        onUserUpdate(userDoc.data() as UserProfile);
      } else {
        if (email === 'admin@gmail.com') {
          const adminProfile: UserProfile = {
            uid: result.user.uid,
            name: 'Admin',
            email: 'admin@gmail.com',
            rollNumber: '100A',
            role: 'admin',
            createdAt: new Date().toISOString(),
          };
          await setDoc(doc(db, 'users', result.user.uid), adminProfile);
          onUserUpdate(adminProfile);
        } else {
          setError("User profile not found. Please register first.");
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regStep < 3) {
      setRegStep(regStep + 1);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      const isAdmin = email === 'admin@gmail.com';
      const plan = plans.find(p => p.id === selectedPlan)!;
      
      const enrollment: Enrollment = {
        planId: plan.id,
        planName: plan.name,
        registeredAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        endsAt: new Date(new Date().setMonth(new Date().getMonth() + plan.duration)).toISOString(),
        status: 'active'
      };

      const newProfile: UserProfile = {
        uid: result.user.uid,
        name,
        email,
        rollNumber,
        role: isAdmin ? 'admin' : 'student',
        createdAt: new Date().toISOString(),
        enrollment: isAdmin ? undefined : enrollment
      };
      await setDoc(doc(db, 'users', result.user.uid), newProfile);
      onUserUpdate(newProfile);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0M0MsTke4Bb3WmbA7DBDV2UtSmjrQoD-qnQ&s")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.9) contrast(1.1)',
        }}
      />
      {/* Shine Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-white/10 z-0 pointer-events-none" />
      
      <div className="absolute top-8 left-8 z-10">
        <Link to="/" className="flex items-center text-white drop-shadow-md hover:text-emerald-400 transition-colors font-bold">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </div>
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">speakOral</h1>
          <p className="text-white/90 mt-1 font-bold drop-shadow-md">English at the Speed of Experience</p>
        </div>

        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl">
          <Tabs defaultValue="login" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Register</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleEmailLogin}>
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="sss@gmail.com" 
                      className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••••"
                      className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pb-8">
                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-emerald-200" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                    <LogIn className="ml-2 w-4 h-4" />
                  </Button>
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-100"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">Or continue with</span>
                    </div>
                  </div>
                  <Button variant="outline" type="button" className="w-full border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl h-12" onClick={handleGoogleLogin} disabled={loading}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                      <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                    </svg>
                    Google
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <form onSubmit={handleEmailRegister}>
                <CardHeader className="space-y-1 pb-4">
                  <CardTitle className="text-2xl font-bold">
                    {regStep === 1 && "Create Account"}
                    {regStep === 2 && "Select Course Plan"}
                    {regStep === 3 && "Payment Method"}
                  </CardTitle>
                  <CardDescription>
                    {regStep === 1 && "Join our community of English learners"}
                    {regStep === 2 && "Choose a plan that fits your needs"}
                    {regStep === 3 && "Complete payment to activate your account"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {regStep === 1 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="reg-name">Full Name</Label>
                        <Input 
                          id="reg-name" 
                          placeholder="sss" 
                          className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-roll">Roll Number (Optional)</Label>
                        <Input 
                          id="reg-roll" 
                          placeholder="111" 
                          className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-email">Email</Label>
                        <Input 
                          id="reg-email" 
                          type="email" 
                          placeholder="sss@gmail.com" 
                          className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reg-password">Password</Label>
                        <Input 
                          id="reg-password" 
                          type="password" 
                          placeholder="••••••••••"
                          className="rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required 
                        />
                      </div>
                    </>
                  )}

                  {regStep === 2 && (
                    <div className="space-y-3">
                      {plans.map((plan) => (
                        <div 
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id as any)}
                          className={cn(
                            "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                            selectedPlan === plan.id ? "bg-emerald-50 border-emerald-500" : "bg-white border-slate-100 hover:border-emerald-200"
                          )}
                        >
                          <div>
                            <p className="font-bold text-slate-900">{plan.name}</p>
                            <p className="text-xs text-slate-500">Duration: {plan.duration} {plan.duration === 1 ? 'Month' : 'Months'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-emerald-600 text-lg">₹{plan.price}</p>
                            {selectedPlan === plan.id && <Check className="h-4 w-4 ml-auto mt-1 text-emerald-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {regStep === 3 && (
                    <div className="space-y-3">
                      {[
                        { id: 'gpay', name: 'Google Pay', icon: Smartphone },
                        { id: 'phonepe', name: 'PhonePe', icon: Smartphone },
                        { id: 'paytm', name: 'Paytm', icon: Smartphone },
                      ].map((method) => (
                        <div 
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={cn(
                            "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center space-x-3",
                            paymentMethod === method.id ? "bg-emerald-50 border-emerald-500" : "bg-white border-slate-100 hover:border-emerald-200"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            paymentMethod === method.id ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                          )}>
                            <method.icon className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-slate-900">{method.name}</span>
                          {paymentMethod === method.id && <Check className="h-4 w-4 ml-auto text-emerald-500" />}
                        </div>
                      ))}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center mt-4">
                        <p className="text-sm text-slate-500">Amount to pay: <span className="text-emerald-600 font-bold text-lg">₹0</span></p>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
                </CardContent>
                <CardFooter className="flex gap-3 pb-8">
                  {regStep > 1 && (
                    <Button type="button" variant="outline" className="flex-1 border-slate-200 rounded-xl h-12" onClick={() => setRegStep(regStep - 1)}>
                      Back
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    className={cn("flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-emerald-200", regStep === 1 && "w-full")} 
                    disabled={loading || (regStep === 3 && !paymentMethod)}
                  >
                    {loading ? "Processing..." : (regStep === 3 ? "Pay & Register" : "Next")}
                    {regStep === 3 ? <CreditCard className="ml-2 w-4 h-4" /> : <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
