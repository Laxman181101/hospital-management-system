import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, ShieldCheck, Users, ArrowRight, Lock, 
  Smartphone, BarChart3, Clock, CheckCircle2,
  Building2, MessageCircle, Globe, Mail, Menu, X, ChevronDown,
  Star, HeartPulse, Check, PlayCircle, Plus, Minus, Quote
} from 'lucide-react';
import Button from '../components/ui/Button';
import api from '../services/api';

// Utility Hook for Scroll Reveal
const useScrollReveal = (options = { threshold: 0.1, rootMargin: "0px" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  const threshold = options?.threshold;
  const rootMargin = options?.rootMargin;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold, rootMargin });
    
    if (domRef.current) observer.observe(domRef.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return [domRef, isVisible];
};

// Animated Stat Counter Component
const AnimatedStat = ({ end, label, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  const [count, setCount] = useState(0);
  const endNum = parseFloat(end.replace(/[^0-9.]/g, ''));
  const suffix = end.replace(/[0-9.]/g, '');

  useEffect(() => {
    if (!isVisible) return;
    let startTime;
    const duration = 2000;
    
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      
      if (end.includes('.')) {
         setCount((easeProgress * endNum).toFixed(1));
      } else {
         setCount(Math.floor(easeProgress * endNum));
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const timer = setTimeout(() => requestAnimationFrame(animate), delay);
    return () => clearTimeout(timer);
  }, [isVisible, endNum, end, delay]);

  return (
    <div ref={ref} className={`px-4 transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <p className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500 mb-2 drop-shadow-sm">
        {count}{suffix}
      </p>
      <p className="text-slate-500 font-medium">{label}</p>
    </div>
  );
};

// FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <button 
        className="w-full py-5 flex items-center justify-between text-left focus:outline-none group"
        onClick={onClick}
      >
        <span className="text-lg font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{question}</span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-600 leading-relaxed pr-12">{answer}</p>
      </div>
    </div>
  );
};

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);
  const [trustHospitals, setTrustHospitals] = useState([]);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/api/v1/hospitals/search');
        if (res.data && (res.data.data || res.data.hospitals)) {
          setTrustHospitals((res.data.data || res.data.hospitals).slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch hospitals for trust bar:", err);
      }
    };
    fetchHospitals();
  }, []);

  // Scroll handler for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Building2 className="w-6 h-6 text-indigo-600" />,
      bg: "bg-indigo-100",
      border: "border-t-indigo-500",
      title: "Multi-Tenant Architecture",
      desc: "Manage multiple branches or completely independent hospitals from a single scalable platform."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
      bg: "bg-teal-100",
      border: "border-t-teal-500",
      title: "Role-Based Access Control",
      desc: "Granular permissions for Doctors, Receptionists, and Lab Technicians out of the box."
    },
    {
      icon: <Smartphone className="w-6 h-6 text-rose-500" />,
      bg: "bg-rose-100",
      border: "border-t-rose-500",
      title: "Real-Time OTP Authentication",
      desc: "Secure and frictionless mobile-first login flows for staff and patients."
    },
    {
      icon: <Lock className="w-6 h-6 text-amber-500" />,
      bg: "bg-amber-100",
      border: "border-t-amber-500",
      title: "Secure Cloud Storage",
      desc: "HIPAA-compliant infrastructure keeping patient records safe and fully encrypted."
    },
    {
      icon: <Users className="w-6 h-6 text-sky-500" />,
      bg: "bg-sky-100",
      border: "border-t-sky-500",
      title: "Staff Management",
      desc: "Comprehensive tools to manage shifts, permissions, and performance of all your hospital staff."
    },
    {
      icon: <Clock className="w-6 h-6 text-emerald-500" />,
      bg: "bg-emerald-100",
      border: "border-t-emerald-500",
      title: "24/7 Patient Care Tracking",
      desc: "Monitor appointments, vitals, and treatment histories in real-time across all departments."
    }
  ];

  const steps = [
    { icon: Building2, title: "Register Your Hospital", desc: "Submit your details and license for quick verification." },
    { icon: ShieldCheck, title: "Get Approved", desc: "Our team verifies your account within 24-48 hours." },
    { icon: Users, title: "Onboard Your Team", desc: "Add doctors, staff, and configure schedules effortlessly." },
    { icon: HeartPulse, title: "Start Managing Patients", desc: "Handle appointments, records, and billing seamlessly." }
  ];

  const testimonials = [
    { name: "Dr. Sarah Jenkins", role: "Chief of Surgery", hospital: "CityCare Hospital", quote: "CareConnect completely transformed how we handle patient flow. The role-based access ensures our nurses and receptionists see exactly what they need to, nothing more.", rating: 5, img: "https://i.pravatar.cc/150?img=32" },
    { name: "Dr. Arvind Kumar", role: "Hospital Administrator", hospital: "MedLife Group", quote: "Managing three branches used to be a nightmare. With the multi-tenant architecture, I can oversee operations, revenue, and staff across all locations from a single dashboard.", rating: 5, img: "https://i.pravatar.cc/150?img=11" },
    { name: "Priya Sharma", role: "Patient", hospital: "HealthCorp", quote: "Booking an appointment and viewing my medical records via OTP login is incredibly smooth. I feel secure knowing my data is protected while remaining highly accessible.", rating: 5, img: "https://i.pravatar.cc/150?img=44" }
  ];

  const faqs = [
    { q: "How does hospital approval work?", a: "Once you register your hospital, our verification team reviews your license and submitted details. This typically takes 24-48 hours. Upon approval, you gain full access to the admin dashboard." },
    { q: "Is patient data secure?", a: "Absolutely. We utilize HIPAA-compliant cloud infrastructure with end-to-end encryption for all sensitive health records and personal data." },
    { q: "Can I manage multiple hospital branches?", a: "Yes! Our platform is built on a multi-tenant architecture, meaning you can add and manage multiple independent branches under one master administrative account." },
    { q: "What does OTP login mean for patients?", a: "Patients do not need to remember passwords. They simply enter their registered mobile number, receive a One-Time Password (OTP) via SMS, and log in securely in seconds." },
    { q: "How is staff access controlled?", a: "We provide granular Role-Based Access Control (RBAC). A doctor's view is entirely different from a receptionist's or a pharmacist's view, ensuring data privacy and workflow efficiency." }
  ];

  const [heroRef, heroInView] = useScrollReveal({ threshold: 0.1 });
  const [trustRef, trustInView] = useScrollReveal({ threshold: 0.1 });
  const [featuresRef, featuresInView] = useScrollReveal({ threshold: 0.1 });
  const [stepsRef, stepsInView] = useScrollReveal({ threshold: 0.1 });
  const [testiRef, testiInView] = useScrollReveal({ threshold: 0.1 });
  const [priceRef, priceInView] = useScrollReveal({ threshold: 0.1 });

  const [annualBilling, setAnnualBilling] = useState(true);

  // Smooth scroll helper
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">CareConnect</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="relative group cursor-pointer">
              <span className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
                Product <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300"/>
              </span>
              {/* Dropdown */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 overflow-hidden">
                <div className="p-2">
                  {[
                    { icon: ShieldCheck, title: "For Hospitals", desc: "Complete management suite" },
                    { icon: HeartPulse, title: "For Patients", desc: "Easy booking & records" },
                    { icon: Lock, title: "Security", desc: "HIPAA compliant infrastructure" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <item.icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <button onClick={() => scrollTo('features')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all hover:after:w-full">
              Features
            </button>
            <button onClick={() => scrollTo('pricing')} className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-indigo-600 after:transition-all hover:after:w-full">
              Pricing
            </button>
            <Link to="/hospitals" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Find Hospitals
            </Link>
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register-hospital">
              <Button size="sm" className="shadow-md shadow-indigo-600/20 hover:shadow-lg hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                Register Hospital
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Slide-in Menu */}
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setMobileMenuOpen(false)}>
        <div className={`fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-300 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <span className="text-xl font-bold text-slate-900">Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-full">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
            <button onClick={() => scrollTo('features')} className="text-lg font-semibold text-left text-slate-700">Features</button>
            <button onClick={() => scrollTo('pricing')} className="text-lg font-semibold text-left text-slate-700">Pricing</button>
            <Link to="/hospitals" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-left text-slate-700">Find Hospitals</Link>
            <div className="h-px bg-slate-100 my-2"></div>
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-left text-indigo-600">Sign In</Link>
            <Link to="/patient/auth" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-left text-teal-600">Patient Login</Link>
            <Link to="/staff/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-semibold text-left text-slate-700">Staff Login</Link>
          </div>
          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <Link to="/register-hospital" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full h-12 bg-indigo-600 text-white text-base">Register Hospital</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <main ref={heroRef} className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden bg-slate-50 min-h-[90vh] flex items-center">
        {/* Animated Background Blob Mesh */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-[0%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-300/20 mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-teal-300/20 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-purple-300/20 mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className={`lg:col-span-6 text-center lg:text-left transition-all duration-1000 transform ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm backdrop-blur-sm mb-8 transition-transform hover:scale-105 cursor-default">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </span>
                <span className="text-sm font-bold text-slate-700 tracking-wide">Next-Gen Healthcare SaaS</span>
              </div>
              
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-6">
                Modernize your <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500">
                  Hospital Management
                </span>
              </h1>
              
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
                A comprehensive cloud platform empowering clinics and hospitals to deliver exceptional patient care through intelligent workflows and secure infrastructure.
              </p>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 mb-8">
                <Link to="/hospitals" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 group shadow-xl shadow-indigo-600/25 bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-1 hover:shadow-2xl transition-all active:scale-95 text-base font-semibold border-0">
                    Find Hospitals
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/patient/auth" className="w-full sm:w-auto">
                  <Button variant="secondary" size="lg" className="w-full h-14 px-8 bg-white/80 backdrop-blur-sm hover:bg-white border-slate-200 hover:-translate-y-1 transition-all shadow-sm active:scale-95 text-base font-semibold text-slate-700">
                    Patient Login
                  </Button>
                </Link>
                <Link to="/staff/login" className="text-sm font-semibold text-slate-500 hover:text-indigo-600 sm:ml-4 underline underline-offset-4 w-full sm:w-auto text-center">
                  Staff Login
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4 text-sm font-medium text-slate-500">
                <div className="h-px bg-slate-200 w-12"></div>
                <span>or explore as a hospital</span>
                <div className="h-px bg-slate-200 w-12"></div>
              </div>
              
              <div className="mt-6 flex justify-center lg:justify-start">
                <Link to="/register-hospital" className="group flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                  Register Your Hospital <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Content - Parallax Floating Mockup */}
            <div className={`lg:col-span-6 relative w-full transition-all duration-1000 delay-300 transform ${heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              {/* Floating Toast Notification */}
              <div className="absolute -right-4 lg:-right-12 -top-8 lg:-top-12 bg-white rounded-xl shadow-2xl p-4 flex items-center gap-4 z-20 animate-bounce-slow border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">New Appointment!</p>
                  <p className="text-xs text-slate-500">Sarah J. booked for 10:30 AM</p>
                </div>
              </div>

              {/* Main Mockup Card */}
              <div className="relative rounded-2xl bg-white/60 backdrop-blur-2xl border border-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-4 lg:p-6 lg:-mr-8 transform lg:rotate-[-2deg] hover:rotate-0 transition-transform duration-700 ease-out hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] animate-float">
                
                {/* Mockup Header */}
                <div className="flex items-center justify-between border-b border-slate-200/50 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-sm">
                      <img src="https://i.pravatar.cc/150?img=32" alt="Doctor" className="w-full h-full object-cover"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Dr. Sarah Jenkins</p>
                      <p className="text-xs text-indigo-600 font-semibold">Chief of Surgery</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 hover:bg-rose-400 transition-colors"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200 hover:bg-amber-400 transition-colors"></div>
                    <div className="w-3 h-3 rounded-full bg-slate-200 hover:bg-emerald-400 transition-colors"></div>
                  </div>
                </div>

                {/* Mockup Cards */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Users className="w-4 h-4" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Patients Today</span>
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">142</p>
                    <p className="text-[10px] sm:text-xs text-emerald-600 font-bold mt-1 flex items-center bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                      <ArrowRight className="w-3 h-3 -rotate-45 mr-1" /> +12% vs yest
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm group hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-teal-600">
                        <Activity className="w-4 h-4" />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Consultations</span>
                      </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">89</p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-400 to-teal-500 h-1.5 rounded-full w-[70%]"></div>
                    </div>
                  </div>
                </div>

                {/* Mockup Chart Area */}
                <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-slate-800">Weekly Activity</span>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-24 pt-4 border-t border-slate-50">
                    {[40, 70, 45, 90, 65, 85, 55].map((height, i) => (
                      <div key={i} className="flex-1 bg-indigo-100 rounded-t-md relative group hover:bg-indigo-500 transition-colors cursor-pointer" style={{ height: `${height}%` }}>
                        {i === 3 && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-sm ring-4 ring-indigo-100"></div>}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {height} Patients
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>

      {/* Trust Bar */}
      <section ref={trustRef} className={`py-10 border-t border-b border-slate-200/60 bg-white/50 backdrop-blur-sm transition-all duration-1000 ${trustInView ? 'opacity-100' : 'opacity-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center mb-8">Trusted by innovative healthcare providers</p>
          <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20">
            {trustHospitals.length > 0 ? (
              trustHospitals.map((hospital, index) => {
                const icons = [Activity, ShieldCheck, Building2, HeartPulse, Users];
                const colors = ['bg-blue-600', 'bg-teal-500', 'bg-indigo-600', 'bg-rose-500', 'bg-sky-500'];
                const Icon = icons[index % icons.length];
                const color = colors[index % colors.length];
                return (
                  <div key={hospital._id} className={`flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0 ${index > 2 ? 'hidden sm:flex' : ''} ${index > 3 ? 'md:flex' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center shadow-sm`}><Icon size={24}/></div>
                    <span className="text-xl font-extrabold text-slate-800 tracking-tight">{hospital.hospitalName}</span>
                  </div>
                );
              })
            ) : (
              <>
                <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm"><Activity size={24}/></div>
                  <span className="text-xl font-extrabold text-slate-800 tracking-tight">HealthCorp</span>
                </div>
                <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-sm"><ShieldCheck size={24}/></div>
                  <span className="text-xl font-extrabold text-slate-800 tracking-tight">MedLife<span className="font-light">Group</span></span>
                </div>
                <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm"><Building2 size={24}/></div>
                  <span className="text-xl font-extrabold text-slate-800 tracking-tight">CityCare</span>
                </div>
                <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0 hidden sm:flex">
                  <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm"><HeartPulse size={24}/></div>
                  <span className="text-xl font-extrabold text-slate-800 tracking-tight">Apex<span className="text-rose-500 font-black">Med</span></span>
                </div>
                <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-default grayscale hover:grayscale-0 hidden md:flex">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-sm"><Users size={24}/></div>
                  <span className="text-xl font-extrabold text-slate-800 tracking-tight">GlobalHealth</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white relative">
        {/* Subtle Background Tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/30 to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-8 lg:divide-x divide-slate-100 text-center">
            <AnimatedStat end="500+" label="Hospitals onboarded" delay={0} />
            <AnimatedStat end="10K+" label="Staff Members active" delay={100} />
            <AnimatedStat end="1M+" label="Patients Managed" delay={200} />
            <AnimatedStat end="99.9%" label="System Uptime" delay={300} />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-1000 transform ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Everything you need to run your hospital</h2>
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed">
              Powerful tools designed specifically for healthcare professionals. Built for speed, reliability, and unparalleled security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className={`bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col group relative overflow-hidden transform ${featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                {/* Colored Top Border on Hover */}
                <div className={`absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity ${feature.border}`}></div>
                
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed flex-grow text-sm sm:text-base">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={stepsRef} className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-1000 transform ${stepsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">How It Works</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Get your entire hospital digital infrastructure up and running in days, not months.
            </p>
          </div>

          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-indigo-100 via-teal-100 to-indigo-100 z-0"></div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
              {steps.map((step, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col items-center text-center relative transition-all duration-1000 transform ${stepsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  {/* Mobile timeline connector (vertical) */}
                  {idx !== steps.length - 1 && <div className="block lg:hidden absolute top-24 bottom-[-3rem] left-1/2 -translate-x-1/2 w-0.5 bg-slate-100 -z-10"></div>}
                  
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-indigo-50 shadow-xl flex items-center justify-center mb-6 relative group hover:border-indigo-100 transition-colors">
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-md">
                      {idx + 1}
                    </div>
                    <step.icon size={32} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-sm text-slate-600 max-w-[250px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testiRef} className="py-24 bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50/30 mix-blend-multiply pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center max-w-3xl mx-auto mb-20 transition-all duration-1000 transform ${testiInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">Trusted by healthcare professionals</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Don't just take our word for it. Hear from the administrators, doctors, and patients who use CareConnect every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testi, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative group transform ${testiInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <Quote className="absolute top-6 right-6 text-indigo-50 w-12 h-12 rotate-180 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-1 mb-6 text-amber-400">
                  {[...Array(testi.rating)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-slate-700 leading-relaxed mb-8 relative z-10 font-medium">"{testi.quote}"</p>
                
                <div className="flex items-center gap-4 mt-auto">
                  <img src={testi.img} alt={testi.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{testi.name}</p>
                    <p className="text-xs text-slate-500">{testi.role} • <span className="font-semibold text-indigo-600">{testi.hospital}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" ref={priceRef} className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-1000 transform ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              No hidden fees. No surprise charges. Choose the plan that best fits your facility.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button 
                onClick={() => setAnnualBilling(false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${!annualBilling ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setAnnualBilling(true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${annualBilling ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Annually
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${annualBilling ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {/* Starter */}
            <div className={`bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full transform transition-all duration-1000 delay-100 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
              <p className="text-sm text-slate-500 mb-6">Perfect for small clinics and individual practices.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-900">{annualBilling ? '₹2,999' : '₹3,499'}</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Up to 3 Doctors', 'Unlimited Patients', 'Basic Appointment Booking', 'Email Support'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                    <Check size={18} className="text-teal-500 shrink-0 mt-0.5" /> {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-12 font-bold border-slate-200 hover:bg-slate-50">Start Free Trial</Button>
            </div>

            {/* Professional (Most Popular) */}
            <div className={`bg-slate-900 rounded-3xl p-8 border border-indigo-500 shadow-2xl flex flex-col h-full relative transform transition-all duration-1000 delay-200 scale-100 md:scale-105 z-10 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-teal-400 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
              <p className="text-sm text-slate-400 mb-6">Ideal for mid-sized hospitals and multi-specialty centers.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-white">{annualBilling ? '₹7,999' : '₹9,999'}</span>
                <span className="text-slate-400 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Up to 20 Staff Members', 'Multi-tenant Architecture', 'Role-Based Access Control', 'Advanced Analytics & Reports', 'Priority 24/7 Support'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                    <Check size={18} className="text-teal-400 shrink-0 mt-0.5" /> {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register-hospital" className="w-full">
                <Button variant="primary" className="w-full h-12 font-bold bg-indigo-500 hover:bg-indigo-600 border-0 shadow-lg shadow-indigo-500/20">
                  Get Started Now
                </Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className={`bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col h-full transform transition-all duration-1000 delay-300 ${priceInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
              <p className="text-sm text-slate-500 mb-6">For large hospital networks requiring custom solutions.</p>
              <div className="mb-8">
                <span className="text-4xl font-extrabold text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Unlimited Everything', 'Custom API Integrations', 'Dedicated Account Manager', 'On-premise Deployment Options', 'SLA Guarantee'].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                    <Check size={18} className="text-indigo-500 shrink-0 mt-0.5" /> {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-12 font-bold border-slate-200 hover:bg-slate-50">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-600 text-lg">Everything you need to know about the platform.</p>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            {faqs.map((faq, i) => (
              <FAQItem 
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={activeFaq === i}
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950"></div>
        
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-1/4 w-[40vw] h-[40vw] bg-indigo-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vw] bg-teal-600/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>
        
        {/* Grain overlay for premium texture */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">Ready to transform your healthcare facility?</h2>
          <p className="text-slate-300 text-lg lg:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of hospitals already using CareConnect to streamline their operations, reduce costs, and improve patient care.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/register-hospital" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 bg-white text-slate-900 hover:bg-slate-50 shadow-xl hover:scale-105 active:scale-95 transition-all text-base font-bold">
                Get Started for Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 bg-transparent text-white border-slate-600 hover:bg-white/10 hover:border-white transition-all text-base font-bold flex items-center gap-2">
              <PlayCircle size={20} /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Newsletter Row */}
          <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-slate-50 rounded-3xl border border-slate-100 mb-16">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Stay updated with healthcare tech</h3>
              <p className="text-slate-500 text-sm">Join 10,000+ professionals receiving our monthly newsletter.</p>
            </div>
            <div className="flex w-full md:w-auto max-w-md">
              <input type="email" placeholder="Enter your email" className="w-full h-12 px-4 rounded-l-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              <button className="h-12 px-6 bg-indigo-600 text-white font-bold rounded-r-xl hover:bg-indigo-700 transition-colors whitespace-nowrap">Subscribe</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">CareConnect</span>
              </div>
              <p className="text-base text-slate-500 mb-8 max-w-xs leading-relaxed">
                A modern SaaS platform designed to streamline operations and enhance patient care globally.
              </p>
              <div className="flex gap-3 text-slate-400">
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all shadow-sm border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm border border-slate-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm border border-slate-100"><Globe size={18} /></a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all shadow-sm border border-slate-100"><Mail size={18} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Product</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-600">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Company</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-600">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Customer Stories</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-slate-600">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">HIPAA Compliance</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Data Processing</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">© 2026 CareConnect Inc. All rights reserved.</p>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
              Made with <HeartPulse size={14} className="text-rose-500 fill-rose-500" /> for healthcare providers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
