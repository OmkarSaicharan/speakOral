import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ArrowRight, 
  Instagram, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Globe,
  MessageSquare,
  BookOpen,
  Video,
  Users,
  ChevronDown
} from 'lucide-react';
import { UserProfile } from '../types';
import { motion } from 'motion/react';

interface LandingProps {
  user: UserProfile | null;
}

export default function Landing({ user }: LandingProps) {
  const coursePlans = [
    {
      id: 'monthly',
      name: 'Monthly Plan',
      price: 0,
      duration: '1 Month',
      features: [
        'Grammar Fundamentals',
        'Basic Vocabulary',
        'Weekly Quizzes',
        'Access to Study Notes',
        'Community Forum Access'
      ]
    },
    {
      id: 'semi-annual',
      name: 'Professional Plan',
      price: 0,
      duration: '6 Months',
      features: [
        'Advanced Business English',
        'Speaking Practice',
        'Video Tutorials',
        'Personalized Feedback',
        'Direct Messaging with Admin',
        'Community Forum Access'
      ],
      popular: true
    },
    {
      id: 'annual',
      name: 'Mastery Program',
      price: 0,
      duration: '12 Months',
      features: [
        'Full Fluency Training',
        'IELTS/TOEFL Prep',
        '1-on-1 Mentorship',
        'Lifetime Community Access',
        'Certification',
        'All Features Included'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-white selection:text-black">
      {/* Fullscreen Hero with Video */}
      <div className="relative h-screen w-full overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-10" />

        {/* Navbar */}
        <nav className="absolute top-0 w-full z-50 px-[120px] py-[20px] flex items-center justify-between">
          <div className="flex items-center">
            {/* Placeholder Logo */}
            <div className="h-[25px] flex items-center">
              <span className="text-white font-bold text-2xl tracking-tighter">speakOral</span>
            </div>
            
            <div className="hidden md:flex items-center ml-[30px] space-x-[30px]">
              {["Get Started", "Developers", "Features", "Resources"].map((link) => (
                <div key={link} className="flex items-center space-x-[14px] cursor-pointer group">
                  <span className="text-white text-[14px] font-medium opacity-80 group-hover:opacity-100 transition-opacity">{link}</span>
                  <ChevronDown className="w-[14px] h-[14px] text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <Link to="/login">
              <button className="relative group">
                <div className="absolute -inset-[0.6px] rounded-full bg-white opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-black rounded-full px-[29px] py-[11px] flex items-center justify-center overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent blur-[1px]" />
                  <span className="text-white text-[14px] font-medium">Join Waitlist</span>
                </div>
              </button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full pt-[280px] pb-[102px] px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-[40px]"
          >
            {/* Badge */}
            <div className="rounded-full bg-white/10 border border-white/20 px-4 py-2 flex items-center gap-2">
              <div className="w-[4px] h-[4px] bg-white rounded-full" />
              <span className="text-[13px] font-medium">
                <span className="opacity-60 text-white">Early access available from</span>
                <span className="text-white"> May 1, 2026</span>
              </span>
            </div>

            {/* Heading */}
            <h1 className="max-w-[613px] text-[36px] md:text-[56px] font-medium leading-[1.28] bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-black/0">
              English at the Speed of Experience
            </h1>

            {/* Subtitle */}
            <p className="max-w-[680px] text-[15px] font-normal text-white/70 -mt-[16px]">
              Powering seamless experiences and real-time connections, speakOral is the base for creators who move with purpose, leveraging resilience, speed, and scale to shape the future.
            </p>

            {/* CTA Button */}
            <Link to="/login">
              <button className="relative group">
                <div className="absolute -inset-[0.6px] rounded-full bg-white opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative bg-white rounded-full px-[29px] py-[11px] flex items-center justify-center overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent blur-[1px]" />
                  <span className="text-black text-[14px] font-medium">Join Waitlist</span>
                </div>
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Course Plans Section */}
      <section className="py-32 px-4 bg-black" id="courses">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Choose Your Path</h2>
            <p className="text-white/60 max-w-2xl mx-auto">Flexible plans designed to fit your learning goals and schedule. Start your journey with speakOral today.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {coursePlans.map((plan) => (
              <div 
                key={plan.id} 
                className={`relative bg-white/5 p-8 rounded-[32px] border transition-all hover:bg-white/[0.08] ${
                  plan.popular ? 'border-white/40 shadow-2xl shadow-white/5 scale-105 z-10' : 'border-white/10'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-bold text-white">₹{plan.price}</span>
                  <span className="text-white/50 ml-2">/ {plan.duration}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-white/70 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-white mr-3 shrink-0 opacity-60" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className={`w-full py-6 rounded-2xl font-bold text-lg transition-all ${
                    plan.popular ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                    Enroll Now
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/10 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-2xl font-bold tracking-tight text-white">speakOral</span>
              </div>
              <p className="text-white/50 max-w-sm mb-6">
                Empowering creators and learners worldwide to achieve proficiency through modern technology and community-driven learning.
              </p>
              <div className="flex space-x-4">
                {[Instagram, Twitter, Facebook, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors">
                    <Icon className="h-5 w-5 text-white/70" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Quick Links</h4>
              <ul className="space-y-4 text-white/50 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><a href="#courses" className="hover:text-white transition-colors">Courses</a></li>
                <li><Link to="/community" className="hover:text-white transition-colors">Community</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Contact</h4>
              <ul className="space-y-4 text-white/50 text-sm">
                <li>support@speakoral.com</li>
                <li>+1 (555) 000-0000</li>
                <li>123 Learning Way, Education City</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-white/30 text-xs">
            © {new Date().getFullYear()} speakOral. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
