import { ExamSessionData, WrittenSessionData, RevisionItemData } from '@/types';
import crypto from 'crypto';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'user';
  avatar?: string;
  targetExam?: string;
  authProvider?: string;
  googleId?: string;
  createdAt: string;
}

export function hashPassword(password: string): string {
  const salt = process.env.AUTH_SECRET || '_examforge_salt_2026';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// In-memory fallback and seed storage for ExamForge
class MemoryStore {
  users: Map<string, UserRecord> = new Map();
  exams: Map<string, ExamSessionData> = new Map();
  writtenSessions: Map<string, WrittenSessionData> = new Map();
  revisionItems: Map<string, RevisionItemData> = new Map();

  constructor() {
    this.seedInitialData();
  }

  seedInitialData() {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@examforge.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    // Seed Admin & Default user
    const adminUser: UserRecord = {
      id: 'user_admin_01',
      name: 'System Admin',
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
      role: 'admin',
      avatar: undefined,
      targetExam: 'Platform Management',
      createdAt: new Date().toISOString(),
    };
    this.users.set(adminUser.id, adminUser);

    if (process.env.NODE_ENV !== 'production') {
      const sampleUser: UserRecord = {
        id: 'user_sample_01',
        name: 'Tanvir Hossain',
        email: 'learner@examforge.com',
        passwordHash: hashPassword('password123'),
        role: 'user',
        avatar: undefined,
        targetExam: '47th BCS & Bangladesh Bank AD',
        createdAt: new Date().toISOString(),
      };
      this.users.set(sampleUser.id, sampleUser);
    }
    // 1. Math Exam (Algebra & Arithmetic with LaTeX math)
    const mathExamId = 'exam_sample_math_01';
    this.exams.set(mathExamId, {
      _id: mathExamId,
      subject: 'Mathematics',
      topic: 'বীজগণিত ও সূচক (Algebra & Exponents)',
      difficulty: 'Job-Exam Standard',
      negativeMarking: 0.25,
      totalQuestions: 5,
      timeLimitSeconds: 300,
      status: 'completed',
      score: 3.75,
      accuracy: 80,
      correctCount: 4,
      wrongCount: 1,
      skippedCount: 0,
      timeSpentSeconds: 215,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 2 + 215000).toISOString(),
      questions: [
        {
          id: 1,
          question: 'যদি $x + \\frac{1}{x} = 3$ হয়, তবে $x^2 + \\frac{1}{x^2}$ এর মান কত?',
          options: ['7', '9', '11', '6'],
          correctAnswer: 0,
          explanation: 'আমরা জানি, $x^2 + \\frac{1}{x^2} = (x + \\frac{1}{x})^2 - 2 = 3^2 - 2 = 9 - 2 = 7$।',
        },
        {
          id: 2,
          question: 'যদি $2^{x+3} = 32$ হয়, তবে $x$ এর মান কত?',
          options: ['2', '3', '4', '5'],
          correctAnswer: 0,
          explanation: '$32 = 2^5$। সুতরাং $2^{x+3} = 2^5 \\implies x+3 = 5 \\implies x = 2$।',
        },
        {
          id: 3,
          question: 'একটি সমকোণী ত্রিভুজের অতিভুজ $13\\text{ cm}$ এবং ভূমি $12\\text{ cm}$ হলে লম্ব কত?',
          options: ['5 cm', '6 cm', '7 cm', '8 cm'],
          correctAnswer: 0,
          explanation: 'পীথাগোরাসের উপপাদ্য অনুসারে, $\\text{লম্ব} = \\sqrt{13^2 - 12^2} = \\sqrt{169 - 144} = \\sqrt{25} = 5\\text{ cm}$।',
        },
        {
          id: 4,
          question: 'বার্ষিক $10\\%$ মুনাফায় $1000$ টাকার $2$ বছরের চক্রবৃদ্ধি মূলধন কত?',
          options: ['1200 টাকা', '1210 টাকা', '1100 টাকা', '1250 টাকা'],
          correctAnswer: 1,
          explanation: '$C = P(1+r)^n = 1000 \\times (1 + 0.10)^2 = 1000 \\times 1.21 = 1210$ টাকা।',
        },
        {
          id: 5,
          question: 'যদি $\\log_2(x) = 5$ হয়, তবে $x$ এর মান কত?',
          options: ['10', '25', '32', '64'],
          correctAnswer: 2,
          explanation: 'সংজ্ঞানুসারে, $\\log_2(x) = 5 \\implies x = 2^5 = 32$।',
        },
      ],
      userAnswers: [
        { questionId: 1, selectedOption: 0, isMarkedForReview: false },
        { questionId: 2, selectedOption: 0, isMarkedForReview: false },
        { questionId: 3, selectedOption: 0, isMarkedForReview: false },
        { questionId: 4, selectedOption: 0, isMarkedForReview: false }, // Wrong answer selected: option 0
        { questionId: 5, selectedOption: 2, isMarkedForReview: false },
      ],
    });

    // 2. Bangla Exam (সন্ধি ও ব্যাকরণ)
    const banglaExamId = 'exam_sample_bangla_01';
    this.exams.set(banglaExamId, {
      _id: banglaExamId,
      subject: 'Bangla',
      topic: 'বাংলা ব্যাকরণ - সন্ধি ও কারক',
      difficulty: 'Job-Exam Standard',
      negativeMarking: 0.5,
      totalQuestions: 5,
      timeLimitSeconds: 300,
      status: 'completed',
      score: 4.5,
      accuracy: 90,
      correctCount: 4,
      wrongCount: 0,
      skippedCount: 1,
      timeSpentSeconds: 180,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 3 + 180000).toISOString(),
      questions: [
        {
          id: 1,
          question: '‘গায়ক’ শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?',
          options: ['গা + অক', 'গৈ + অক', 'গো + অক', 'গে + অক'],
          correctAnswer: 1,
          explanation: 'ঐ-কারের পর অন্য স্বরধ্বনি থাকলে ‘ঐ’ স্থলে ‘আয়’ হয়। তাই গৈ + অক = গায়ক।',
        },
        {
          id: 2,
          question: '‘পাপে বিরত হও’— এখানে ‘পাপে’ কোন কারকে কোন বিভক্তি?',
          options: ['করণে ৭মী', 'অধিকরণে ৭মী', 'অপাদানে ৭মী', 'কর্মে ৭মী'],
          correctAnswer: 2,
          explanation: 'যা থেকে কোনো কিছু ভীত, জাত বা বিরত হয় তাকে অপাদান কারক বলে। পাপে = অপাদানে ৭মী।',
        },
        {
          id: 3,
          question: '‘তন্মেধ্যে’ এর সঠিক সন্ধি বিচ্ছেদ কোনটি?',
          options: ['তৎ + মধ্যে', 'তদ্ + মধ্যে', 'তন + মধ্যে', 'তদ + মধ্যে'],
          correctAnswer: 0,
          explanation: 'তৎ + মধ্যে = তন্মেধ্যে (ত বর্গের পর ম থাকলে পূর্ববর্তী বর্ণ ন হয়)।',
        },
        {
          id: 4,
          question: '‘মেঘে বৃষ্টি হয়’— ‘মেঘে’ কোন কারক?',
          options: ['অপাদান কারক', 'অধিকরণ কারক', 'করণ কারক', 'কর্তৃ কারক'],
          correctAnswer: 0,
          explanation: 'মেঘ থেকে বৃষ্টি জাত বা উৎপন্ন হয়, তাই এটি অপাদান কারক।',
        },
        {
          id: 5,
          question: 'কোনটি নিপাতনে সিদ্ধ সন্ধির উদাহরণ?',
          options: ['পরস্পর', 'বিদ্যালয়', 'সূর্যোদয়', 'সতীশ'],
          correctAnswer: 0,
          explanation: 'পর + পর = পরস্পর, এটি নিপাতনে সিদ্ধ ব্যঞ্জনসন্ধি।',
        },
      ],
      userAnswers: [
        { questionId: 1, selectedOption: 1, isMarkedForReview: false },
        { questionId: 2, selectedOption: 2, isMarkedForReview: false },
        { questionId: 3, selectedOption: 0, isMarkedForReview: false },
        { questionId: 4, selectedOption: null, isMarkedForReview: true },
        { questionId: 5, selectedOption: 0, isMarkedForReview: false },
      ],
    });

    // 3. English Exam (Subject-Verb Agreement)
    const englishExamId = 'exam_sample_english_01';
    this.exams.set(englishExamId, {
      _id: englishExamId,
      subject: 'English',
      topic: 'Subject-Verb Agreement & Prepositions',
      difficulty: 'Job-Exam Standard',
      negativeMarking: 0.25,
      totalQuestions: 5,
      timeLimitSeconds: 300,
      status: 'completed',
      score: 2.5,
      accuracy: 50,
      correctCount: 3,
      wrongCount: 2,
      skippedCount: 0,
      timeSpentSeconds: 240,
      createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      completedAt: new Date(Date.now() - 86400000 * 1 + 240000).toISOString(),
      questions: [
        {
          id: 1,
          question: 'Neither of the two candidates _____ selected for the interview.',
          options: ['were', 'was', 'are', 'have been'],
          correctAnswer: 1,
          explanation: '"Neither of" takes a singular verb when referring to two items, so "was" is correct.',
        },
        {
          id: 2,
          question: 'The committee _____ divided in their opinions.',
          options: ['is', 'are', 'was', 'has been'],
          correctAnswer: 1,
          explanation: 'When members of a collective noun act individually or disagree, plural verb "are" is used.',
        },
        {
          id: 3,
          question: 'He is proficient _____ mathematics and statistics.',
          options: ['in', 'at', 'with', 'on'],
          correctAnswer: 0,
          explanation: '"Proficient in" is the correct idiomatic preposition usage for a subject or discipline.',
        },
        {
          id: 4,
          question: 'One of my friends _____ an aeronautical engineer.',
          options: ['are', 'is', 'were', 'have been'],
          correctAnswer: 1,
          explanation: '"One of + plural noun" takes a singular verb agreeing with "One".',
        },
        {
          id: 5,
          question: 'Choose the correct synonym of "Ephemeral":',
          options: ['Eternal', 'Transient', 'Permanent', 'Enduring'],
          correctAnswer: 1,
          explanation: '"Ephemeral" means lasting for a very short time; its synonym is "transient".',
        },
      ],
      userAnswers: [
        { questionId: 1, selectedOption: 1, isMarkedForReview: false },
        { questionId: 2, selectedOption: 0, isMarkedForReview: false }, // wrong
        { questionId: 3, selectedOption: 1, isMarkedForReview: false }, // wrong
        { questionId: 4, selectedOption: 1, isMarkedForReview: false },
        { questionId: 5, selectedOption: 1, isMarkedForReview: false },
      ],
    });

    // 4. Computer Science / IT Exam
    const csExamId = 'exam_sample_cs_01';
    this.exams.set(csExamId, {
      _id: csExamId,
      subject: 'Computer Science / IT',
      topic: 'Computer Networking & OS Principles',
      difficulty: 'Job-Exam Standard',
      negativeMarking: 0.25,
      totalQuestions: 5,
      timeLimitSeconds: 300,
      status: 'completed',
      score: 4.0,
      accuracy: 80,
      correctCount: 4,
      wrongCount: 0,
      skippedCount: 1,
      timeSpentSeconds: 195,
      createdAt: new Date().toISOString(),
      completedAt: new Date(Date.now() + 195000).toISOString(),
      questions: [
        {
          id: 1,
          question: 'Which OSI layer is responsible for end-to-end reliable transmission and flow control?',
          options: ['Network Layer', 'Transport Layer', 'Data Link Layer', 'Session Layer'],
          correctAnswer: 1,
          explanation: 'The Transport Layer (Layer 4, TCP/UDP) provides end-to-end communication and error/flow control.',
        },
        {
          id: 2,
          question: 'In IPv4 addressing, how many bits are used for an IP address?',
          options: ['16 bits', '32 bits', '64 bits', '128 bits'],
          correctAnswer: 1,
          explanation: 'IPv4 addresses are 32-bit numerical labels, whereas IPv6 uses 128 bits.',
        },
        {
          id: 3,
          question: 'Which scheduling algorithm is non-preemptive and allocates CPU according to burst time?',
          options: ['Round Robin', 'Shortest Job First (SJF)', 'Priority Scheduling', 'FCFS'],
          correctAnswer: 1,
          explanation: 'Standard Shortest Job First (SJF) is non-preemptive; its preemptive variant is SRTF.',
        },
        {
          id: 4,
          question: 'What is the default port number for HTTPS secure communication?',
          options: ['80', '8080', '443', '22'],
          correctAnswer: 2,
          explanation: 'Port 443 is used for HTTPS over TLS/SSL, whereas HTTP uses port 80.',
        },
        {
          id: 5,
          question: 'Which of the following is NOT a relational database management system?',
          options: ['PostgreSQL', 'MySQL', 'MongoDB', 'Oracle Database'],
          correctAnswer: 2,
          explanation: 'MongoDB is a document-oriented NoSQL database system, not a traditional RDBMS.',
        },
      ],
      userAnswers: [
        { questionId: 1, selectedOption: 1, isMarkedForReview: false },
        { questionId: 2, selectedOption: 1, isMarkedForReview: false },
        { questionId: 3, selectedOption: null, isMarkedForReview: true },
        { questionId: 4, selectedOption: 2, isMarkedForReview: false },
        { questionId: 5, selectedOption: 2, isMarkedForReview: false },
      ],
    });

    // 5. Sample Written Session
    const writtenId = 'written_sample_gk_01';
    this.writtenSessions.set(writtenId, {
      _id: writtenId,
      subject: 'General Knowledge',
      topic: 'বাংলাদেশের সংবিধান ও মহান মুক্তিযুদ্ধ (Bangladesh Constitution & Liberation War)',
      questionMix: 'Broad/Descriptive',
      totalQuestions: 3,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 1,
          question: '১৯৭১ সালের মহান মুক্তিযুদ্ধে মুজিবনগর সরকারের কাঠামো ও ঐতিহাসিক তাৎপর্য বিশ্লেষণ করুন।',
          marks: 5,
          modelAnswer: '১০ এপ্রিল ১৯৭১ সালে গঠিত এবং ১৭ এপ্রিল মেহেরপুরের বৈদ্যনাথতলার ভবেরপাড়ায় (মুজিবনগর) শপথ গ্রহণ করে গণপ্রজাতন্ত্রী বাংলাদেশের প্রথম সরকার। রাষ্ট্রপতি: বঙ্গবন্ধু শেখ মুজিবুর রহমান (অনুপস্থিতিতে উপ-রাষ্ট্রপতি সৈয়দ নজরুল ইসলাম অস্থায়ী রাষ্ট্রপতি), প্রধানমন্ত্রী: তাজউদ্দীন আহমদ। ঐতিহাসিক তাৎপর্য: মুক্তিযুদ্ধের আন্তর্জাতিক স্বীকৃতি অর্জন, মুক্তাঞ্চল পরিচালনা এবং সমগ্র যুদ্ধ পরিচালনায় একক ও আইনানুগ নেতৃত্ব প্রদান।',
          keyPoints: [
            'গঠন তারিখ: ১০ এপ্রিল ১৯৭১ ও শপথ: ১৭ এপ্রিল ১৯৭১',
            'মন্ত্রীসভার নেতৃত্ব: সৈয়দ নজরুল ইসলাম ও তাজউদ্দীন আহমদ',
            'স্বাধীনতার ঘোষণাপত্র (Proclamation of Independence) অনুমোদন',
            '১১টি সেক্টর ও সশস্ত্র বাহিনীর পরিচালনা সমন্বয়',
            'বিশ্বব্যাপী জনমত ও কূটনৈতিক স্বীকৃতি আদায়'
          ],
          status: 'Mastered',
        },
        {
          id: 2,
          question: 'বাংলাদেশ সংবিধানের মূল ৪টি রাষ্ট্রীয় মূলনীতি এবং তাদের তাৎপর্য সংক্ষেপে লিখুন।',
          marks: 5,
          modelAnswer: 'সংবিধানের ৮ নং অনুচ্ছেদ অনুযায়ী রাষ্ট্র পরিচালনার মূলনীতি ৪টি: ১. জাতীয়তাবাদ (অনুচ্ছেদ ৯), ২. সমাজতন্ত্র ও শোষণমুক্তি (অনুচ্ছেদ ১০), ৩. গণতন্ত্র ও মানবাধিকার (অনুচ্ছেদ ১১), ৪. ধর্মনিরপেক্ষতা ও ধর্মীয় স্বাধীনতা (অনুচ্ছেদ ১২)। এই মূলনীতিগুলো দেশের সামগ্রিক আইনের ভিত্তি এবং নাগরিকের মৌলিক অধিকার প্রতিষ্ঠার মূল স্তম্ভ।',
          keyPoints: [
            'জাতীয়তাবাদ (ভাষাগত ও সংস্কৃতিগত ঐক্য)',
            'সমাজতন্ত্র (সুষম বণ্টন ও সামাজিক ন্যায়বিচার)',
            'গণতন্ত্র (জনগণের কার্যকর অংশগ্রহণ)',
            'ধর্মনিরপেক্ষতা (সকল ধর্মের সমান স্বাধীনতা ও সাম্প্রদায়িকতাবোধ বিলোপ)'
          ],
          status: 'Needs Review',
        },
        {
          id: 3,
          question: 'পদ্মা বহুমুখী সেতু ও কর্ণফুলী টানেল কীভাবে বাংলাদেশের অর্থনীতি ও আঞ্চলিক যোগাযোগে প্রভাব ফেলছে?',
          marks: 5,
          modelAnswer: 'পদ্মা সেতু দক্ষিণ-পশ্চিমাঞ্চলের ২১টি জেলাকে সরাসরি রাজধানীর সাথে সংযুক্ত করেছে, যা জাতীয় জিডিপিতে ১.২% প্রবৃদ্ধি যোগ করছে। কর্ণফুলী টানেল (বঙ্গবন্ধু টানেল) দক্ষিণ এশিয়ায় নদীর তলদেশে প্রথম টানেল, যা চট্টগ্রামকে "ওয়ান সিটি টু টাউন" মডেলে উন্নত করে মাতারবাড়ি গভীর সমুদ্রবন্দর ও আনোয়ারা শিল্পাঞ্চলের সাথে নির্বিঘ্ন যোগাযোগ গড়ে তুলেছে।',
          keyPoints: [
            'জিডিপি বৃদ্ধিতে অবদান (আনুমানিক ১.২%-১.৫%)',
            'সরাসরি সড়ক ও রেল যোগাযোগ বৃদ্ধি এবং পণ্য পরিবহন সময় সাশ্রয়',
            'চট্টগ্রামের "ওয়ান সিটি টু টাউন" ধারণা ও পর্যটন বিকাশ',
            'মাতারবাড়ি ও এশিয়ান হাইওয়ে সংযোগ জোরদার'
          ],
          status: 'Not Practiced',
        },
      ],
    });

    // 6. Sample Revision Items (Mistakes saved from exams)
    const rev1Id = 'rev_sample_01';
    this.revisionItems.set(rev1Id, {
      _id: rev1Id,
      type: 'mcq',
      subject: 'English',
      topic: 'Subject-Verb Agreement',
      sessionId: englishExamId,
      questionId: 2,
      question: 'The committee _____ divided in their opinions.',
      options: ['is', 'are', 'was', 'has been'],
      userAnswer: 0,
      correctAnswer: 1,
      explanation: 'When members of a collective noun act individually or disagree, plural verb "are" is used.',
      isMastered: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    });

    const rev2Id = 'rev_sample_02';
    this.revisionItems.set(rev2Id, {
      _id: rev2Id,
      type: 'written',
      subject: 'General Knowledge',
      topic: 'বাংলাদেশের সংবিধান',
      sessionId: writtenId,
      questionId: 2,
      question: 'বাংলাদেশ সংবিধানের মূল ৪টি রাষ্ট্রীয় মূলনীতি এবং তাদের তাৎপর্য সংক্ষেপে লিখুন।',
      marks: 5,
      modelAnswer: 'সংবিধানের ৮ নং অনুচ্ছেদ অনুযায়ী রাষ্ট্র পরিচালনার মূলনীতি ৪টি: জাতীয়তাবাদ, সমাজতন্ত্র, গণতন্ত্র ও ধর্মনিরপেক্ষতা।',
      keyPoints: ['জাতীয়তাবাদ', 'সমাজতন্ত্র', 'গণতন্ত্র', 'ধর্মনিরপেক্ষতা'],
      isMastered: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    });
  }

  // Exam methods
  getAllExams(): ExamSessionData[] {
    return Array.from(this.exams.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getExamById(id: string): ExamSessionData | undefined {
    return this.exams.get(id);
  }

  saveExam(exam: ExamSessionData): ExamSessionData {
    this.exams.set(exam._id, exam);
    return exam;
  }

  deleteExam(id: string): boolean {
    return this.exams.delete(id);
  }

  // Written methods
  getAllWritten(): WrittenSessionData[] {
    return Array.from(this.writtenSessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getWrittenById(id: string): WrittenSessionData | undefined {
    return this.writtenSessions.get(id);
  }

  saveWritten(session: WrittenSessionData): WrittenSessionData {
    this.writtenSessions.set(session._id, session);
    return session;
  }

  deleteWritten(id: string): boolean {
    return this.writtenSessions.delete(id);
  }

  // Revision methods
  getAllRevision(): RevisionItemData[] {
    return Array.from(this.revisionItems.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  saveRevisionItem(item: RevisionItemData): RevisionItemData {
    this.revisionItems.set(item._id, item);
    return item;
  }

  deleteRevisionItem(id: string): boolean {
    return this.revisionItems.delete(id);
  }

  toggleRevisionMastered(id: string, isMastered?: boolean): RevisionItemData | undefined {
    const item = this.revisionItems.get(id);
    if (item) {
      item.isMastered = isMastered !== undefined ? isMastered : !item.isMastered;
      this.revisionItems.set(id, item);
      return item;
    }
    return undefined;
  }

  // User methods
  getUserByEmail(email: string): UserRecord | undefined {
    const clean = email.toLowerCase().trim();
    return Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === clean
    );
  }

  getUserById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  createUser(data: {
    name: string;
    email: string;
    passwordHash?: string;
    role?: 'admin' | 'user';
    avatar?: string;
    targetExam?: string;
    authProvider?: string;
    googleId?: string;
  }): UserRecord {
    const id = 'user_' + Math.random().toString(36).substring(2, 10);
    const user: UserRecord = {
      id,
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash || '',
      role: data.role || 'user',
      avatar: data.avatar || undefined,
      targetExam: data.targetExam || 'BCS & Bank Jobs',
      authProvider: data.authProvider || 'password',
      googleId: data.googleId,
      createdAt: new Date().toISOString(),
    };
    this.users.set(id, user);
    return user;
  }

  saveUser(user: UserRecord): UserRecord {
    this.users.set(user.id, user);
    return user;
  }

  // Reset to initial seeds
  resetData() {
    this.exams.clear();
    this.writtenSessions.clear();
    this.revisionItems.clear();
    this.seedInitialData();
  }

  // Export / Import
  exportAll() {
    return {
      exams: Array.from(this.exams.values()),
      writtenSessions: Array.from(this.writtenSessions.values()),
      revisionItems: Array.from(this.revisionItems.values()),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  importAll(data: { exams?: ExamSessionData[]; writtenSessions?: WrittenSessionData[]; revisionItems?: RevisionItemData[] }) {
    if (Array.isArray(data.exams)) {
      this.exams.clear();
      data.exams.forEach((e) => this.exams.set(e._id, e));
    }
    if (Array.isArray(data.writtenSessions)) {
      this.writtenSessions.clear();
      data.writtenSessions.forEach((w) => this.writtenSessions.set(w._id, w));
    }
    if (Array.isArray(data.revisionItems)) {
      this.revisionItems.clear();
      data.revisionItems.forEach((r) => this.revisionItems.set(r._id, r));
    }
  }
}

// Global singleton
declare global {
  // eslint-disable-next-line no-var
  var __memoryStore: MemoryStore | undefined;
}

export const memoryStore = global.__memoryStore || new MemoryStore();
if (!global.__memoryStore) {
  global.__memoryStore = memoryStore;
}
