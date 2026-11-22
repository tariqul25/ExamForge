'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  Trash2,
  CheckCircle2,
  Layers,
  ChevronRight,
  BookOpen,
  Plus,
  Loader2,
  AlertTriangle,
  Type,
  Lock,
  Languages,
  Calculator,
  Globe,
  Laptop,
  HelpCircle,
  Clock,
  X,
} from 'lucide-react';
import { SAMPLE_STUDY_PRESETS, SampleStudyPreset } from '@/lib/sampleNotes';
import { useAuth } from '@/context/AuthContext';
import ExamForgeLogo from '@/components/ExamForgeLogo';

interface UploadedImage {
  id: string;
  name: string;
  base64Data: string;
  mimeType: string;
  sizeKb: number;
}

interface CustomSubjectItem {
  id: string;
  label: string;
  bn: string;
}

const DEFAULT_SUBJECTS = [
  {
    id: 'All Subjects (Combined Model Test)',
    label: 'Combined Model Test',
    bn: 'সকল বিষয় (মডেল টেস্ট)',
    color: 'from-fuchsia-500 to-indigo-600',
    icon: Sparkles,
  },
  {
    id: 'Bangla',
    label: 'Bangla',
    bn: 'বাংলা',
    color: 'from-emerald-500 to-green-600',
    icon: BookOpen,
  },
  {
    id: 'English',
    label: 'English',
    bn: 'English',
    color: 'from-blue-500 to-indigo-600',
    icon: Languages,
  },
  {
    id: 'Mathematics',
    label: 'Mathematics',
    bn: 'গণিত',
    color: 'from-purple-500 to-indigo-600',
    icon: Calculator,
  },
  {
    id: 'General Knowledge',
    label: 'General Knowledge',
    bn: 'সাধারণ জ্ঞান',
    color: 'from-amber-500 to-orange-600',
    icon: Globe,
  },
  {
    id: 'Computer Science / IT',
    label: 'Computer Science / IT',
    bn: 'কম্পিউটার ও তথ্যপ্রযুক্তি',
    color: 'from-cyan-500 to-blue-600',
    icon: Laptop,
  },
];

const PRESET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Bangla: BookOpen,
  English: Languages,
  Mathematics: Calculator,
  'General Knowledge': Globe,
  'Computer Science / IT': Laptop,
};

function detectSubjectClient(t: string): string {
  const lower = t.toLowerCase();
  if (
    lower.includes('voice') ||
    lower.includes('passive') ||
    lower.includes('active') ||
    lower.includes('narration') ||
    lower.includes('speech') ||
    lower.includes('verb') ||
    lower.includes('tense') ||
    lower.includes('grammar') ||
    lower.includes('grammer') ||
    lower.includes('english') ||
    lower.includes('vocabulary') ||
    lower.includes('antonym') ||
    lower.includes('synonym') ||
    lower.includes('idiom') ||
    lower.includes('preposition') ||
    lower.includes('clause') ||
    lower.includes('degree') ||
    lower.includes('concord') ||
    lower.includes('agreement') ||
    lower.includes('transformation')
  ) {
    return 'English';
  }
  if (
    lower.includes('শতকরা') ||
    lower.includes('লাভ') ||
    lower.includes('ক্ষতি') ||
    lower.includes('বীজগণিত') ||
    lower.includes('গণিত') ||
    lower.includes('math') ||
    lower.includes('algebra') ||
    lower.includes('percentage') ||
    lower.includes('মুনাফা') ||
    lower.includes('সুদ') ||
    lower.includes('অনুপাত') ||
    lower.includes('জ্যামিতি') ||
    lower.includes('পরিমিতি') ||
    lower.includes('ত্রিভুজ') ||
    lower.includes('বৃত্ত') ||
    lower.includes('সমীকরণ') ||
    lower.includes('সূচক') ||
    lower.includes('লগারিদম') ||
    lower.includes('লসাগু') ||
    lower.includes('গসাগু')
  ) {
    return 'Mathematics';
  }
  if (
    lower.includes('সমাস') ||
    lower.includes('সন্ধি') ||
    lower.includes('কারক') ||
    lower.includes('বিভক্তি') ||
    lower.includes('সাহিত্য') ||
    lower.includes('মধ্যযুগ') ||
    lower.includes('বাংলা') ||
    lower.includes('বানান') ||
    lower.includes('চর্যাপদ') ||
    lower.includes('শব্দ') ||
    lower.includes('প্রত্যয়') ||
    lower.includes('বাগধারা') ||
    lower.includes('উপসর্গ')
  ) {
    return 'Bangla';
  }
  if (
    lower.includes('সংবিধান') ||
    lower.includes('মুক্তিযুদ্ধ') ||
    lower.includes('বাংলাদেশ') ||
    lower.includes('আন্তর্জাতিক') ||
    lower.includes('বঙ্গবন্ধু') ||
    lower.includes('রাজধানী') ||
    lower.includes('মুদ্রা') ||
    lower.includes('জাতিসংঘ') ||
    lower.includes('gk')
  ) {
    return 'General Knowledge';
  }
  if (
    lower.includes('os') ||
    lower.includes('operating system') ||
    lower.includes('deadlock') ||
    lower.includes('network') ||
    lower.includes('database') ||
    lower.includes('sql') ||
    lower.includes('computer') ||
    lower.includes('it') ||
    lower.includes('memory management')
  ) {
    return 'Computer Science / IT';
  }
  return '';
}

export default function HomeUploadPage() {
  const router = useRouter();
  const { user, requireAuth, openAuthModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Creation Source: 'image' (Upload photo) OR 'topic' (No image needed)
  const [sourceType, setSourceType] = useState<'image' | 'topic'>('image');

  // Uploaded images state (1 to 5 images)
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Selected subject & permanent custom subjects
  const [selectedSubject, setSelectedSubject] = useState('All Subjects (Combined Model Test)');
  const [customSubjects, setCustomSubjects] = useState<CustomSubjectItem[]>([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  // Topic input
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'mcq' | 'written'>('mcq');

  // MCQ Settings (Support up to 30 MCQs)
  const [mcqCount, setMcqCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Job-Exam Standard'>('Job-Exam Standard');
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // Written Settings
  const [writtenCount, setWrittenCount] = useState(3);
  const [questionMix, setQuestionMix] = useState<'Short Answer' | 'Broad/Descriptive' | 'Problem-Solving'>('Broad/Descriptive');

  // Processing state
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStep, setProcessingStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [presetNotification, setPresetNotification] = useState<string | null>(null);

  // Load permanent custom subjects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('examforge_custom_subjects');
      if (saved) {
        setCustomSubjects(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const handleSaveCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newSubjectInput.trim();
    if (!cleanName) return;

    const exists = [...DEFAULT_SUBJECTS, ...customSubjects].some(
      (s) => s.label.toLowerCase() === cleanName.toLowerCase()
    );

    if (exists) {
      setSelectedSubject(cleanName);
      setShowAddSubjectModal(false);
      setNewSubjectInput('');
      return;
    }

    const newSubj: CustomSubjectItem = {
      id: cleanName,
      label: cleanName,
      bn: cleanName,
    };

    const updated = [...customSubjects, newSubj];
    setCustomSubjects(updated);
    try {
      localStorage.setItem('examforge_custom_subjects', JSON.stringify(updated));
    } catch (err) {}

    setSelectedSubject(cleanName);
    setShowAddSubjectModal(false);
    setNewSubjectInput('');
  };

  const removeCustomSubject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customSubjects.filter((s) => s.id !== id);
    setCustomSubjects(updated);
    try {
      localStorage.setItem('examforge_custom_subjects', JSON.stringify(updated));
    } catch (err) {}
    if (selectedSubject === id) {
      setSelectedSubject('All Subjects (Combined Model Test)');
    }
  };

  // Helper to compress image in client memory
  const compressImage = (file: File): Promise<{ base64Data: string; mimeType: string; sizeKb: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = (e.target?.result as string) || '';
        if (file.type === 'image/svg+xml' || file.name.endsWith('.svg')) {
          resolve({
            base64Data: rawResult,
            mimeType: 'image/svg+xml',
            sizeKb: Math.round(file.size / 1024) || 1,
          });
          return;
        }

        const img = new Image();
        img.onload = () => {
          const maxDim = 1280;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.82);
            const sizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);
            resolve({
              base64Data: compressedBase64,
              mimeType: 'image/jpeg',
              sizeKb,
            });
            return;
          }

          resolve({
            base64Data: rawResult,
            mimeType: file.type || 'image/jpeg',
            sizeKb: Math.round(file.size / 1024),
          });
        };
        img.onerror = () => {
          resolve({
            base64Data: rawResult,
            mimeType: file.type || 'image/jpeg',
            sizeKb: Math.round(file.size / 1024),
          });
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle files
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    if (!user) {
      openAuthModal('signin');
      return;
    }

    setErrorMsg(null);
    const MAX_PAGES = 30;
    const remainingSlots = MAX_PAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMsg(`Maximum ${MAX_PAGES} images allowed per study session.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      const isImg =
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|gif|bmp|heic|heif|svg)$/i.test(file.name);

      if (!isImg) {
        setErrorMsg('Please upload image files only (PNG, JPG, WebP, etc.).');
        continue;
      }

      const compressed = await compressImage(file);
      const newImage: UploadedImage = {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        base64Data: compressed.base64Data,
        mimeType: compressed.mimeType,
        sizeKb: compressed.sizeKb,
      };
      setImages((prev) => [...prev, newImage]);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const loadPreset = (preset: SampleStudyPreset) => {
    setErrorMsg(null);
    setSelectedSubject(preset.subject);
    setTopic(preset.topic);
    setSourceType('image');
    setPresetNotification(`Sample note loaded: ${preset.subject} • ${preset.topic}`);

    const sampleImg: UploadedImage = {
      id: 'preset_' + preset.id,
      name: `${preset.title}.svg`,
      base64Data: preset.svgImage,
      mimeType: 'image/svg+xml',
      sizeKb: 12,
    };
    setImages([sampleImg]);

    setTimeout(() => {
      document.getElementById('create-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Submit and Generate
  const triggerGenerate = () => {
    requireAuth('generate exams and create custom question sets', () => {
      executeGenerate();
    });
  };

  const executeGenerate = async () => {
    if (sourceType === 'image' && images.length === 0) {
      setErrorMsg('Please upload at least 1 image of your textbook page or handwritten notes.');
      return;
    }

    if (sourceType === 'topic' && !topic.trim()) {
      setErrorMsg('Please enter your desired chapter or topic name to generate questions.');
      return;
    }

    setIsGenerating(true);
    setProcessingStep(1);
    setErrorMsg(null);

    const step2Timer = setTimeout(() => setProcessingStep(2), 1000);
    const step3Timer = setTimeout(() => setProcessingStep(3), 2000);

    try {
      let finalSubject = selectedSubject;
      if (sourceType === 'topic') {
        const detected = detectSubjectClient(topic);
        if (detected) {
          finalSubject = detected;
        } else if (!/[\u0980-\u09FF]/.test(topic)) {
          finalSubject = 'English';
        } else {
          finalSubject = 'Bangla';
        }
      }

      const payload = {
        images: sourceType === 'image' ? images.map((img) => ({
          base64Data: img.base64Data,
          mimeType: img.mimeType,
        })) : [],
        subject: finalSubject,
        topic: topic.trim() || undefined,
        mode,
        mcqCount,
        difficulty,
        negativeMarking,
        writtenCount,
        questionMix,
        sourceType,
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      setProcessingStep(4);

      let data: any = {};
      try {
        const text = await res.text();
        data = JSON.parse(text);
      } catch (parseErr) {
        throw new Error('Server returned an unexpected response. Please try with a clearer photo or enter a topic.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate questions. Please try again.');
      }

      // Save generated session to client localStorage cache so it never vanishes
      if (typeof window !== 'undefined' && data.exam && data.sessionId) {
        try {
          localStorage.setItem('examforge_exam_' + data.sessionId, JSON.stringify(data.exam));
          const existingRecent = JSON.parse(localStorage.getItem('examforge_recent_sessions') || '[]');
          existingRecent.unshift({
            id: data.sessionId,
            type: data.type,
            subject: finalSubject,
            topic: data.topic || topic.trim() || 'General Practice',
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('examforge_recent_sessions', JSON.stringify(existingRecent.slice(0, 20)));
        } catch (storageErr) {}
      }

      if (data.type === 'mcq') {
        router.push(`/exam/${data.sessionId}`);
      } else {
        router.push(`/written/${data.sessionId}`);
      }
    } catch (err: any) {
      setIsGenerating(false);
      setErrorMsg(err.message || 'An error occurred during generation.');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 border border-indigo-800/50 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Smart Competitive Exam Preparation Platform</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Generate Competitive Exams from Notes or Any Topic
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans max-w-2xl">
            Prepare for BCS, Bank Recruitment, PSC, and job exams across <strong>Bangla, English, Mathematics, GK, and IT</strong>. Snap photos of textbook pages or type any syllabus topic to generate up to 30 job-standard MCQs or written questions with full explanations.
          </p>

          {!user && (
            <div className="mt-4 pt-3 border-t border-indigo-800/60 flex flex-wrap items-center gap-3">
              <span className="text-xs text-indigo-200">
                You are currently browsing in <strong>Guest Mode</strong> (sample preview only).
              </span>
              <button
                onClick={() => openAuthModal('signin')}
                className="px-3 py-1 rounded-lg bg-white text-indigo-900 text-xs font-bold hover:bg-gray-100 transition-colors shadow-xs"
              >
                Sign In to Unlock Everything
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1-Click Study Note Samples Bar - STRICTLY FOR ANONYMOUS GUESTS ONLY */}
      {!user && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-800 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                1-Click Study Note Samples (Quick Preview):
              </h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              Click any subject to auto-load sample note
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {SAMPLE_STUDY_PRESETS.map((preset) => {
              const PresetIcon = PRESET_ICONS[preset.subject] || BookOpen;
              return (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="text-left p-3 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gray-50/60 dark:bg-gray-800/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <PresetIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {preset.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {preset.topic}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Creation Section */}
      <div id="create-section" className="scroll-mt-20 space-y-6">
        {/* Source Mode Toggle (Tabs): Image Upload vs Topic Only */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xs">
            <button
              type="button"
              onClick={() => setSourceType('image')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                sourceType === 'image'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Photo / Note Upload</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('topic')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                sourceType === 'topic'
                  ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Topic Only (No Image Needed)</span>
            </button>
          </div>
        </div>

        {/* EQUALIZED HEIGHT GRID (Left & Right Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* LEFT COLUMN: Upload Zone OR Topic Generator Input */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-5">
            {sourceType === 'image' ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Upload Textbook Pages (1 - 5 Images)</span>
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {images.length}/5 Selected
                    </span>
                  </div>

                  {/* Preset Notification Banner */}
                  {presetNotification && (
                    <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{presetNotification}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPresetNotification(null)}
                        className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 text-[11px] underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {/* Drag & Drop Zone */}
                  {images.length === 0 ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        handleFiles(e.dataTransfer.files);
                      }}
                      className={`border-2 border-dashed rounded-2xl py-10 px-4 sm:py-12 sm:px-6 text-center transition-all cursor-pointer ${
                        isDragging
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                          : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 bg-gray-50/40 dark:bg-gray-900/40'
                      }`}
                      onClick={() => {
                        if (!user) {
                          openAuthModal('signin', 'Sign in to upload your photos and notes.');
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                    >
                      <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        Drag & drop photos here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Supports PNG, JPG, JPEG, WebP • Max 5 images per exam
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              openAuthModal('signin', 'Sign in to upload files.');
                              return;
                            }
                            fileInputRef.current?.click();
                          }}
                          className="px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-2xs flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-500" />
                          Choose Files
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              openAuthModal('signin', 'Sign in to capture photos.');
                              return;
                            }
                            cameraInputRef.current?.click();
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition-colors shadow-2xs flex items-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Take Photo (Mobile)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 gap-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                          <Upload className="w-4 h-4 text-indigo-500" />
                          <span>{images.length} page(s) attached (up to 30)</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {images.length < 30 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!user) {
                                    openAuthModal('signin', 'Sign in to capture photos.');
                                    return;
                                  }
                                  cameraInputRef.current?.click();
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>+ Snap Photo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!user) {
                                    openAuthModal('signin', 'Sign in to upload files.');
                                    return;
                                  }
                                  fileInputRef.current?.click();
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>+ Add Files</span>
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setImages([]);
                              setPresetNotification(null);
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>

                      {/* Uploaded Thumbnails Preview Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((img, idx) => (
                          <div
                            key={img.id}
                            className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 aspect-4/3"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.base64Data}
                              alt={`Page ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                              <button
                                onClick={() => removeImage(img.id)}
                                className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md transition-transform hover:scale-110"
                                title="Remove image"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                              P{idx + 1}
                            </div>
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] truncate">
                              {img.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </div>

                {/* Left Column Study Guide Footer (Equalizes Height) */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Vision Optical Scanner</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Automatically recognizes Bangla Unicode script, English, and LaTeX mathematical equations ($x^2 + y = 10$). Generates standard competitive exam questions with complete explanations.
                  </p>
                </div>
              </div>
            ) : (
              /* Topic-Only Workspace (No Image Required) */
              <div className="space-y-5 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Type className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Instant Topic-Based Question Generator</span>
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">
                      No textbook photo? Type any syllabus topic, chapter, or theorem in Bangla or English. ExamForge will craft competitive exam questions directly!
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                      Target Topic / Chapter Title <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. বাংলা সাহিত্য - মধ্যযুগ, অথবা শতকরা ও লাভ-ক্ষতি, অথবা বাংলাদেশের সংবিধান ও মূলনীতি, অথবা Right Form of Verbs, অথবা Computer Network Topologies"
                      className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans"
                    />
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="text-[11px] text-gray-400">Quick suggestions:</span>
                      {[
                        'বাংলা সাহিত্য - মধ্যযুগ',
                        'Right Form of Verbs',
                        'শতকরা ও লাভ-ক্ষতি',
                        'বাংলাদেশের সংবিধান',
                        'Operating System Deadlocks',
                      ].map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => setTopic(sugg)}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors font-medium"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Left Column Topic Guide Footer (Equalizes Height) */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Topic-Matched Question Synthesis</span>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    Generates authentic BCS, PSC, and Job-Exam standard multiple-choice questions matching your typed topic in either Bangla or English with in-depth solution notes.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Exam Session Setup */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Exam Session Setup</span>
                </h2>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                  {sourceType === 'topic'
                    ? topic.trim()
                      ? `${detectSubjectClient(topic) || 'Auto'} (From Topic)`
                      : 'Auto (From Topic)'
                    : selectedSubject}
                </span>
              </div>

              {/* Subject Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Subject Selector
                  </label>
                  {sourceType === 'image' && (
                    <button
                      type="button"
                      onClick={() => setShowAddSubjectModal(true)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Subject</span>
                    </button>
                  )}
                </div>

                {sourceType === 'topic' ? (
                  /* Deactivated in Topic-Only Mode */
                  <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-gray-800/40 border border-dashed border-gray-300 dark:border-gray-700 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {topic.trim() ? (
                          <>Auto-identified Subject: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{detectSubjectClient(topic) || 'Auto-Detected'}</span></>
                        ) : (
                          'Subject is auto-detected from your topic'
                        )}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Subject selection is disabled in Topic-Only mode. ExamForge automatically categorizes your topic into the appropriate subject.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {DEFAULT_SUBJECTS.map((subj) => {
                      const isSelected = selectedSubject === subj.id;
                      const SubjIcon = subj.icon;
                      return (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => setSelectedSubject(subj.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 font-semibold text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                              : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <SubjIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <p className="font-semibold leading-tight truncate">{subj.label}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{subj.bn}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {/* Permanent Custom Subjects */}
                    {customSubjects.map((subj) => {
                      const isSelected = selectedSubject === subj.id;
                      return (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => setSelectedSubject(subj.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition-all relative group ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 font-semibold text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                              : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate pr-4">
                              <p className="font-semibold leading-tight truncate">{subj.label}</p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400">Custom Subject</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => removeCustomSubject(subj.id, e)}
                            className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove custom subject"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => setShowAddSubjectModal(true)}
                      className="p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 text-left text-xs transition-all text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold leading-tight">+ Add Subject</p>
                          <p className="text-[10px] text-gray-400">Save permanently</p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Mode Toggle: MCQ vs Written */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Exam Mode
                </label>
                <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setMode('mcq')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'mcq'
                        ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>MCQ Exam (Up to 30)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('written')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                      mode === 'written'
                        ? 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Written Questions</span>
                  </button>
                </div>
              </div>

              {/* MCQ Settings (Up to 30 MCQs!) */}
              {mode === 'mcq' ? (
                <div className="space-y-3.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Number of MCQs (Max: 30)
                      </span>
                      {/* Exam Timer Rule: Half the number of questions in minutes */}
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{mcqCount} MCQs (~{Math.max(1, Math.round(mcqCount / 2))} mins)</span>
                      </span>
                    </div>
                    {/* Selectable Counts up to 30 */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {[5, 10, 15, 20, 25, 30].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setMcqCount(num)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                            mcqCount === num
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Exam Standard / Difficulty
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Easy', 'Medium', 'Job-Exam Standard'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setDifficulty(lvl)}
                          className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition-all truncate ${
                            difficulty === lvl
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negative Marking */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Negative Marking
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'None (0)', val: 0 },
                        { label: '-0.25 Mark', val: 0.25 },
                        { label: '-0.50 Mark', val: 0.5 },
                      ].map((neg) => (
                        <button
                          key={neg.label}
                          type="button"
                          onClick={() => setNegativeMarking(neg.val)}
                          className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            negativeMarking === neg.val
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {neg.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Written Settings */
                <div className="space-y-3.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Number of Questions
                      </span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        {writtenCount} Questions
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 8].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setWrittenCount(num)}
                          className={`py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            writtenCount === num
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {num} Questions
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Question Mix
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Short Answer', 'Broad/Descriptive', 'Problem-Solving'] as const).map(
                        (mix) => (
                          <button
                            key={mix}
                            type="button"
                            onClick={() => setQuestionMix(mix)}
                            className={`py-1.5 px-1 rounded-xl border text-[11px] font-semibold transition-all truncate ${
                              questionMix === mix
                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold'
                                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {mix}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={triggerGenerate}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 shadow-indigo-500/25 active:scale-[0.99] transition-all cursor-pointer"
            >
              {!user ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In & Generate Exam</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {mode === 'mcq'
                      ? `Generate ${mcqCount} MCQ Exam ${sourceType === 'image' ? `(${images.length} Pages)` : `(${selectedSubject})`}`
                      : `Generate ${writtenCount} Written Questions`}
                  </span>
                </>
              )}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Permanent Subject Modal */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Permanent Subject</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder="e.g. Accounting, Economics, General Science"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  This subject will remain permanently selectable in your subject grid.
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  className="px-3.5 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generation Loading State Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl space-y-6">
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 animate-pulse">
              <ExamForgeLogo size={36} showText={false} />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                ExamForge Engine Active
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Crafting {mcqCount} competitive exam questions...
              </p>
            </div>

            <div className="space-y-3 text-left">
              {[
                { step: 1, title: 'Analyzing study content & academic scope' },
                { step: 2, title: 'Parsing Bangla Unicode & LaTeX formulas' },
                { step: 3, title: `Formulating ${mcqCount} competitive questions & detailed solutions` },
                { step: 4, title: 'Finalizing interactive timer & palette' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      processingStep > s.step
                        ? 'bg-emerald-500 text-white'
                        : processingStep === s.step
                        ? 'bg-indigo-600 text-white animate-spin'
                        : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                    }`}
                  >
                    {processingStep > s.step ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : processingStep === s.step ? (
                      <Loader2 className="w-4 h-4" />
                    ) : (
                      s.step
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      processingStep === s.step
                        ? 'font-bold text-indigo-600 dark:text-indigo-400'
                        : processingStep > s.step
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400'
                    }`}
                  >
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
