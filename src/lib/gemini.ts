import { GoogleGenAI } from '@google/genai';
import { MCQQuestion, WrittenQuestion } from '@/types';

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key.trim() !== '' &&
    !key.includes('YOUR_GEMINI_API_KEY_HERE')
  );
}

export interface GenerateExamParams {
  images?: Array<{
    base64Data: string;
    mimeType: string;
  }>;
  subject: string;
  topic?: string;
  mode: 'mcq' | 'written';
  mcqCount?: number;
  difficulty?: 'Easy' | 'Medium' | 'Job-Exam Standard';
  negativeMarking?: number;
  writtenCount?: number;
  questionMix?: 'Short Answer' | 'Broad/Descriptive' | 'Problem-Solving';
  sourceType?: 'image' | 'topic';
}

export interface GeneratedResult {
  detectedTopic: string;
  detectedSubject?: string;
  languageDetected: 'Bangla' | 'English' | 'Mixed';
  summaryOfContent: string;
  mcqQuestions?: MCQQuestion[];
  writtenQuestions?: WrittenQuestion[];
  isDemoFallback?: boolean;
  notes?: string;
}

export async function processStudyMaterialWithGemini(
  params: GenerateExamParams
): Promise<GeneratedResult> {
  const { images = [], subject, topic, mode, sourceType = 'image' } = params;
  const isTopicOnly = sourceType === 'topic' || images.length === 0;

  // Auto-detect subject if user provided a specific topic
  let resolvedSubject = subject;
  if (topic && topic.trim()) {
    const autoSubj = detectSubjectFromTopic(topic.trim());
    if (autoSubj && (subject.includes('All Subjects') || subject.includes('Combined') || subject.includes('General Knowledge'))) {
      resolvedSubject = autoSubj;
    }
  }

  if (isGeminiConfigured()) {
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-flash'];
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const imageParts = images.map((img) => {
      let cleanBase64 = img.base64Data;
      if (cleanBase64.includes(';base64,')) {
        cleanBase64 = cleanBase64.split(';base64,')[1];
      } else if (cleanBase64.includes(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }
      return {
        inlineData: {
          mimeType: img.mimeType?.startsWith('image/') ? img.mimeType : 'image/jpeg',
          data: cleanBase64.trim(),
        },
      };
    });

    const isCombined =
      !topic &&
      (resolvedSubject.includes('All Subjects') ||
        resolvedSubject.includes('Combined') ||
        resolvedSubject.includes('সকল বিষয়'));

    const isBangla =
      resolvedSubject.toLowerCase().includes('bangla') ||
      resolvedSubject.includes('বাংলা') ||
      (topic && isBanglaTopic(topic));

    const targetCount = Math.min(30, Math.max(1, params.mcqCount || 5));

    const systemPrompt = `You are an elite competitive job exam paper setter for BCS, Bank Recruitment, PSC, and Govt Jobs.

${
  isTopicOnly
    ? `TASK: TOPIC-SPECIFIC COMPETITIVE EXAM GENERATION
Generate an authentic competitive exam paper strictly matching the requested topic: "${topic || resolvedSubject}".
Target Subject: ${resolvedSubject}.`
    : `TASK: DEEP SCAN & VISION ANALYSIS OF STUDY MATERIAL
Carefully transcribe, read, and analyze the handwritten notes, textbook pages, formulas, rules, and facts in the uploaded image(s).
Formulate authentic exam questions directly testing the specific rules, equations, vocabulary, or concepts found in these uploaded pages.
If topic is given ("${topic || 'Extract and name the exact topic from the uploaded material'}"), focus strictly on that topic within the images.`
}

${
  isCombined
    ? `Combined Model Test: Distribute questions across: 1. Bangla, 2. English, 3. Mathematics, 4. General Knowledge, 5. Computer Science / IT.`
    : `CRITICAL ACCURACY REQUIREMENT: Every single question MUST be strictly on the target topic: "${topic || resolvedSubject}".
DO NOT mix unrelated subjects or topics. For example:
- If topic is "changing voice" or "voice change", EVERY question must be an English Active/Passive Voice transformation question.
- If topic is "শতকরা ও লাভ-ক্ষতি", EVERY question must be a Percentage / Profit & Loss math problem.
- If topic is "বাংলা ব্যাকরণ - সমাস", EVERY question must be on Bangla Samas.`
}

CRITICAL RULES:
1. FRESHNESS & ANTI-REPETITION:
   Random Session Seed: ${Date.now()}_${Math.random().toString(36)}.
   Generate completely fresh, varied, and non-repetitive questions. Do NOT repeat questions from previous sessions. Even if the student generates questions for the same topic multiple times, synthesize novel sentences, varied numerical figures, and different question formats each time!
2. LANGUAGE:
   - Bangla material/subject -> Questions, options & explanations strictly in Bangla Unicode.
   - English material/subject -> English.
   - Math/CS -> Format formulas with KaTeX dollar signs ($x^2 + y = 10$, $\\frac{a}{b}$, $25\\%$).
3. RIGOR: Formulate authentic job-exam standard questions with 4 distinct options and clear explanations.

MODE: ${mode === 'mcq' ? 'MCQ EXAM' : 'WRITTEN EXAM'}
${
  mode === 'mcq'
    ? `Generate exactly ${targetCount} multiple choice questions (Numbered 1 to ${targetCount}).
For each question, provide:
- "id": number (1 to ${targetCount})
- "question": string
- "options": [string, string, string, string] (4 distinct choices)
- "correctAnswer": 0, 1, 2, or 3 (0-indexed)
- "explanation": clear explanation.`
    : `Generate exactly ${params.writtenCount || 3} written questions with model answers and key points.`
}

OUTPUT FORMAT:
Respond with ONLY valid JSON conforming to this schema (no markdown code fence):
{
  "detectedTopic": "concise topic name",
  "detectedSubject": "${resolvedSubject}",
  "languageDetected": "Bangla" | "English" | "Mixed",
  "summaryOfContent": "1-2 sentence overview",
  ${mode === 'mcq' ? '"mcqQuestions": [ ... ]' : '"writtenQuestions": [ ... ]'}
}`;

    const contents = isTopicOnly
      ? [{ text: systemPrompt }]
      : [...imageParts, { text: systemPrompt }];

    for (const modelName of candidateModels) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini ${modelName} request timed out`)), 25000)
        );

        const geminiCall = ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const response: any = await Promise.race([geminiCall, timeoutPromise]);
        const responseText = response.text || '';
        const cleanJson = responseText.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed && (parsed.mcqQuestions?.length || parsed.writtenQuestions?.length)) {
          return {
            detectedTopic: topic && topic.trim() ? topic : parsed.detectedTopic || `${resolvedSubject} Core Study Note`,
            detectedSubject: parsed.detectedSubject || resolvedSubject,
            languageDetected: parsed.languageDetected || (isBangla ? 'Bangla' : 'English'),
            summaryOfContent: parsed.summaryOfContent || `Analyzed study material for ${resolvedSubject}`,
            mcqQuestions: parsed.mcqQuestions,
            writtenQuestions: parsed.writtenQuestions,
            isDemoFallback: false,
          };
        }
      } catch (err: any) {
        console.warn(`[ExamForge] Gemini ${modelName} failed, trying next:`, err.message);
      }
    }
  }

  return generateIntelligentFallback({ ...params, subject: resolvedSubject });
}

export function detectSubjectFromTopic(t: string): string {
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

function generateIntelligentFallback(params: GenerateExamParams): GeneratedResult {
  const { subject, topic, mode, mcqCount = 5, writtenCount = 3 } = params;
  const isCombined =
    !topic &&
    (subject.includes('All Subjects') ||
      subject.includes('Combined') ||
      subject.includes('সকল বিষয়'));

  const autoSubj = topic ? detectSubjectFromTopic(topic) : '';
  const finalSubject = autoSubj || (isCombined ? 'All Subjects (Combined Model Test)' : subject);

  const resolvedTopic =
    topic && topic.trim()
      ? topic.trim()
      : isCombined
      ? 'All Subjects Combined Model Test (সকল বিষয় সমন্বিত মডেল টেস্ট)'
      : getTopicBySubject(finalSubject);

  const targetCount = Math.min(30, Math.max(1, mcqCount));

  if (mode === 'mcq') {
    const fallbackMCQs = getDynamicTopicMCQs(finalSubject, targetCount, resolvedTopic, isCombined);
    return {
      detectedTopic: resolvedTopic,
      detectedSubject: finalSubject,
      languageDetected: finalSubject === 'Bangla' || isBanglaTopic(resolvedTopic) ? 'Bangla' : 'English',
      summaryOfContent: `Analyzed study topic: "${resolvedTopic}". Generated dynamic job preparation questions with explanations.`,
      mcqQuestions: fallbackMCQs,
      isDemoFallback: true,
      notes: 'Generated via Smart ExamForge Engine.',
    };
  } else {
    const fallbackWritten = getTopicAwareWritten(finalSubject, writtenCount, resolvedTopic);
    return {
      detectedTopic: resolvedTopic,
      detectedSubject: finalSubject,
      languageDetected: finalSubject === 'Bangla' || isBanglaTopic(resolvedTopic) ? 'Bangla' : 'English',
      summaryOfContent: `Analyzed study notes on ${resolvedTopic}. Generated structured written questions with model answers.`,
      writtenQuestions: fallbackWritten,
      isDemoFallback: true,
      notes: 'Generated via Smart ExamForge Engine.',
    };
  }
}

export function isBanglaTopic(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

function getTopicBySubject(subject: string): string {
  switch (subject) {
    case 'Bangla':
      return 'বাংলা ব্যাকরণ - সমাস ও সন্ধি';
    case 'English':
      return 'Right Form of Verbs & Subject-Verb Agreement';
    case 'Mathematics':
      return 'শতকরা ও লাভ-ক্ষতি';
    case 'General Knowledge':
      return 'বাংলাদেশের সংবিধান ও মুক্তিযুদ্ধ';
    case 'Computer Science / IT':
      return 'Operating System Deadlocks & Memory Management';
    default:
      return `${subject} Core Concepts`;
  }
}

// -----------------------------------------------------------------
// DYNAMIC QUESTION POOLS WITH RANDOM VARIETY ON EVERY SESSION
// -----------------------------------------------------------------

// Helper to shuffle an array non-destructively
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper to convert English digits to Bangla
function toBanglaNum(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().split('').map((c) => bnDigits[parseInt(c, 10)] || c).join('');
}

// 1. DYNAMIC ENGLISH VOICE CHANGE GENERATOR (NO REPETITION!)
function generateDynamicVoiceQuestions(count: number): MCQQuestion[] {
  const voiceItems = [
    {
      q: 'Which is the correct passive form of: "The teacher checked all the answer scripts"?',
      opts: [
        'All the answer scripts were checked by the teacher.',
        'All the answer scripts was checked by the teacher.',
        'All the answer scripts have been checked by the teacher.',
        'The answer scripts had checked by the teacher.',
      ],
      ans: 0,
      exp: 'Past indefinite active (S + V2 + O) changes to passive: O + was/were + V3 + by + S.',
    },
    {
      q: 'Identify the passive voice: "Who wrote this letter?"',
      opts: [
        'By whom was this letter written?',
        'By whom this letter was written?',
        'Who was written this letter?',
        'Whom wrote this letter?',
      ],
      ans: 0,
      exp: '"Who" becomes "By whom + auxiliary verb + subject + V3?".',
    },
    {
      q: 'Change the voice: "They are constructing a modern bridge over the river."',
      opts: [
        'A modern bridge is being constructed over the river by them.',
        'A modern bridge has been constructed over the river by them.',
        'A modern bridge was being constructed over the river.',
        'A modern bridge is constructed by them over the river.',
      ],
      ans: 0,
      exp: 'Present continuous passive uses: is/am/are + being + past participle (constructed).',
    },
    {
      q: 'Transform to passive: "Do not open the secret envelope."',
      opts: [
        'Let not the secret envelope be opened.',
        'Let the secret envelope not opened.',
        'The secret envelope should not open.',
        'You are requested not open the secret envelope.',
      ],
      ans: 0,
      exp: 'Negative imperative changes to: Let not + object + be + past participle (opened).',
    },
    {
      q: 'Change into passive: "One should keep one\'s promises."',
      opts: [
        'Promises should be kept.',
        'One\'s promises should be kept by one.',
        'Promises ought to be kept by someone.',
        'A promise must be kept by everyone.',
      ],
      ans: 0,
      exp: 'With indefinite subject "one", the passive form drops the agent: "Promises should be kept".',
    },
    {
      q: 'Change into passive: "The committee will approve the project proposal tomorrow."',
      opts: [
        'The project proposal will be approved by the committee tomorrow.',
        'The project proposal would be approved tomorrow by the committee.',
        'The project proposal will have been approved tomorrow.',
        'The project proposal is approved by the committee tomorrow.',
      ],
      ans: 0,
      exp: 'Future indefinite active (will + V1) converts to passive: will + be + V3 (approved).',
    },
    {
      q: 'Choose the correct passive voice: "His polite behavior pleased all of us."',
      opts: [
        'We were all pleased with his polite behavior.',
        'We were all pleased by his polite behavior.',
        'All of us had pleased with his polite behavior.',
        'We are pleased at his polite behavior.',
      ],
      ans: 0,
      exp: 'The verb "pleased" takes the preposition "with" (pleased with someone\'s behavior), not "by".',
    },
    {
      q: 'Change the voice: "The doctor had examined the patient before the surgery."',
      opts: [
        'The patient had been examined by the doctor before the surgery.',
        'The patient was examined by the doctor before the surgery.',
        'The patient has been examined by the doctor before surgery.',
        'The patient had being examined by the doctor before surgery.',
      ],
      ans: 0,
      exp: 'Past perfect passive uses: had + been + V3 (examined).',
    },
    {
      q: 'Passive of: "Panic seized the entire crowd."',
      opts: [
        'The entire crowd was seized with panic.',
        'The entire crowd was seized by panic.',
        'The entire crowd were seized in panic.',
        'The entire crowd had been seized with panic.',
      ],
      ans: 0,
      exp: 'The verb "seize" in this context takes the preposition "with" (seized with panic).',
    },
    {
      q: 'Transform to passive: "Never tell a lie."',
      opts: [
        'Let a lie never be told.',
        'Let not a lie ever be told.',
        'A lie should never told.',
        'You are ordered never to tell a lie.',
      ],
      ans: 0,
      exp: 'Imperative with "never": Let + object + never be + V3 (told).',
    },
    {
      q: 'Which one is in the passive voice?',
      opts: [
        'A new education policy was announced by the ministry.',
        'The ministry announced a new education policy.',
        'The students are reading the new textbook.',
        'The author has published three books this year.',
      ],
      ans: 0,
      exp: '"was announced by the ministry" has the passive structure (be-verb + V3 + by agent).',
    },
    {
      q: 'Change the voice: "People say that honesty is the best policy."',
      opts: [
        'It is said that honesty is the best policy.',
        'Honesty is said the best policy by people.',
        'That honesty is the best policy was said.',
        'It was said people that honesty is best policy.',
      ],
      ans: 0,
      exp: 'Sentences starting with "People say that..." convert to "It is said that...".',
    },
    {
      q: 'Change the voice: "Smoke filled the banquet hall."',
      opts: [
        'The banquet hall was filled with smoke.',
        'The banquet hall was filled by smoke.',
        'The banquet hall was filled of smoke.',
        'The banquet hall had been filled with smoke.',
      ],
      ans: 0,
      exp: '"Filled" takes the preposition "with" when denoting contents (filled with smoke).',
    },
    {
      q: 'Change to active voice: "The thief was caught red-handed by the police."',
      opts: [
        'The police caught the thief red-handed.',
        'The police had caught the thief red-handed.',
        'The police were catching the thief red-handed.',
        'The police catches the thief red-handed.',
      ],
      ans: 0,
      exp: 'Converting passive past indefinite ("was caught") to active requires simple past: "caught".',
    },
    {
      q: 'Change to passive: "We elected him class representative."',
      opts: [
        'He was elected class representative by us.',
        'Class representative was elected him by us.',
        'He has been elected class representative.',
        'We were elected class representative by him.',
      ],
      ans: 0,
      exp: 'Factitive object "class representative" stays as objective complement: "He was elected class representative".',
    },
    {
      q: 'Passive voice of: "Honey tastes sweet."',
      opts: [
        'Honey is sweet when it is tasted.',
        'Honey was sweet when tasted.',
        'Honey is tasted sweet.',
        'Sweet is honey when it tastes.',
      ],
      ans: 0,
      exp: 'Quasi-passive verbs take the formula: Subject + be-verb + adjective + when it is + V3.',
    },
    {
      q: 'Change the voice: "The government must take immediate steps."',
      opts: [
        'Immediate steps must be taken by the government.',
        'Immediate steps should be taken by the government.',
        'Immediate steps must have been taken by the government.',
        'Immediate steps are taken by the government.',
      ],
      ans: 0,
      exp: 'Modal auxiliaries (must, should, can) take: modal + be + V3 (must be taken).',
    },
    {
      q: 'Change the voice: "Who can solve this complex puzzle?"',
      opts: [
        'By whom can this complex puzzle be solved?',
        'By who can this complex puzzle be solved?',
        'Who can be solved this complex puzzle?',
        'By whom this complex puzzle can be solved?',
      ],
      ans: 0,
      exp: '"Who" -> "By whom + modal (can) + object + be + V3?".',
    },
    {
      q: 'Change to passive: "We ought to obey our national constitution."',
      opts: [
        'Our national constitution ought to be obeyed by us.',
        'Our national constitution should be obeyed by us.',
        'Our national constitution ought to have been obeyed.',
        'Our national constitution is to be obeyed by us.',
      ],
      ans: 0,
      exp: '"Ought to" becomes "ought to be + past participle (obeyed)".',
    },
    {
      q: 'Passive voice of: "Post the official letter immediately."',
      opts: [
        'Let the official letter be posted immediately.',
        'Let the official letter posted immediately.',
        'You are asked to post letter immediately.',
        'The official letter should post immediately.',
      ],
      ans: 0,
      exp: 'Imperative sentence rule: Let + object + be + V3.',
    },
  ];

  // Randomize the items order on every single session
  const shuffledPool = shuffleArray(voiceItems);
  const result: MCQQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const item = shuffledPool[i % shuffledPool.length];
    // Randomize option placements so correct answer isn't always at index 0
    const correctOpt = item.opts[item.ans];
    const randomizedOpts = shuffleArray(item.opts);
    const newCorrectIdx = randomizedOpts.indexOf(correctOpt);

    result.push({
      id: i + 1,
      question: item.q,
      options: randomizedOpts,
      correctAnswer: newCorrectIdx,
      explanation: item.exp,
    });
  }

  return result;
}

// 2. DYNAMIC MATHEMATICS PERCENTAGE & PROFIT-LOSS GENERATOR
function generateDynamicProfitLossQuestions(count: number): MCQQuestion[] {
  const result: MCQQuestion[] = [];
  const basePrices = [40, 50, 60, 80, 100, 120, 150, 200, 250, 300, 400, 500, 600, 800, 1000];
  const profitPercents = [10, 15, 20, 25, 30, 40, 50];

  for (let i = 0; i < count; i++) {
    const cp = basePrices[(i + Math.floor(Math.random() * basePrices.length)) % basePrices.length];
    const pct = profitPercents[(i + Math.floor(Math.random() * profitPercents.length)) % profitPercents.length];
    const isProfit = (i % 2 === 0);

    const diff = Math.round((cp * pct) / 100);
    const sp = isProfit ? cp + diff : cp - diff;

    const questionType = i % 3;

    if (questionType === 0) {
      // Find Percentage Profit / Loss
      const bnCP = toBanglaNum(cp);
      const bnSP = toBanglaNum(sp);
      const bnPct = toBanglaNum(pct);
      const qText = isProfit
        ? `একটি দ্রব্য ${bnCP} টাকায় কিনে ${bnSP} টাকায় বিক্রয় করলে শতকরা কত লাভ হবে?`
        : `একটি দ্রব্য ${bnCP} টাকায় কিনে ${bnSP} টাকায় বিক্রয় করলে শতকরা কত ক্ষতি হবে?`;

      const correctStr = `${bnPct}%`;
      const wrong1 = `${toBanglaNum(Math.max(5, pct - 5))}%`;
      const wrong2 = `${toBanglaNum(pct + 5)}%`;
      const wrong3 = `${toBanglaNum(pct + 10)}%`;

      const rawOpts = [correctStr, wrong1, wrong2, wrong3];
      const randomizedOpts = shuffleArray(rawOpts);

      result.push({
        id: i + 1,
        question: qText,
        options: randomizedOpts,
        correctAnswer: randomizedOpts.indexOf(correctStr),
        explanation: isProfit
          ? `লাভ $= ${bnSP} - ${bnCP} = ${toBanglaNum(diff)}$ টাকা। শতকরা লাভ $= \\frac{${toBanglaNum(diff)}}{${bnCP}} \\times ১০০\\% = ${bnPct}\\%$।`
          : `ক্ষতি $= ${bnCP} - ${bnSP} = ${toBanglaNum(diff)}$ টাকা। শতকরা ক্ষতি $= \\frac{${toBanglaNum(diff)}}{${bnCP}} \\times ১০০\\% = ${bnPct}\\%$।`,
      });
    } else if (questionType === 1) {
      // Given Selling Price & Profit %, Find Cost Price
      const bnSP = toBanglaNum(sp);
      const bnPct = toBanglaNum(pct);
      const bnCP = toBanglaNum(cp);

      const qText = isProfit
        ? `একটি দ্রব্য ${bnPct}% লাভে ${bnSP} টাকায় বিক্রয় করা হলো। দ্রব্যটির ক্রয়মূল্য কত?`
        : `একটি দ্রব্য ${bnPct}% ক্ষতিতে ${bnSP} টাকায় বিক্রয় করা হলো। দ্রব্যটির ক্রয়মূল্য কত?`;

      const correctStr = `${bnCP} টাকা`;
      const wrong1 = `${toBanglaNum(cp - 20)} টাকা`;
      const wrong2 = `${toBanglaNum(cp + 25)} টাকা`;
      const wrong3 = `${toBanglaNum(cp + 50)} টাকা`;

      const randomizedOpts = shuffleArray([correctStr, wrong1, wrong2, wrong3]);

      result.push({
        id: i + 1,
        question: qText,
        options: randomizedOpts,
        correctAnswer: randomizedOpts.indexOf(correctStr),
        explanation: isProfit
          ? `ক্রয়মূল্য ১০০ টাকা হলে বিক্রয়মূল্য $= ১০০ + ${bnPct} = ${toBanglaNum(100 + pct)}$ টাকা। সুতরাং ক্রয়মূল্য $= \\frac{${bnSP} \\times ১০০}{${toBanglaNum(100 + pct)}} = ${bnCP}$ টাকা।`
          : `ক্রয়মূল্য ১০০ টাকা হলে বিক্রয়মূল্য $= ১০০ - ${bnPct} = ${toBanglaNum(100 - pct)}$ টাকা। সুতরাং ক্রয়মূল্য $= \\frac{${bnSP} \\times ১০০}{${toBanglaNum(100 - pct)}} = ${bnCP}$ টাকা।`,
      });
    } else {
      // Ratio of Cost Price to Selling Price
      const factor = Math.floor(cp / 10);
      const rCP = Math.max(2, Math.round(cp / factor));
      const rSP = Math.max(2, Math.round(sp / factor));
      const actualPct = Math.round(Math.abs(sp - cp) / cp * 100);

      const bnRCP = toBanglaNum(rCP);
      const bnRSP = toBanglaNum(rSP);
      const bnActualPct = toBanglaNum(actualPct);

      const qText = `একটি পণ্যের ক্রয়মূল্য ও বিক্রয়মূল্যের অনুপাত ${bnRCP} : ${bnRSP} হলে শতকরা ${sp >= cp ? 'লাভের' : 'ক্ষতির'} হার কত?`;
      const correctStr = `${bnActualPct}%`;
      const wrong1 = `${toBanglaNum(actualPct + 5)}%`;
      const wrong2 = `${toBanglaNum(Math.max(2, actualPct - 5))}%`;
      const wrong3 = `${toBanglaNum(actualPct + 10)}%`;

      const randomizedOpts = shuffleArray([correctStr, wrong1, wrong2, wrong3]);

      result.push({
        id: i + 1,
        question: qText,
        options: randomizedOpts,
        correctAnswer: randomizedOpts.indexOf(correctStr),
        explanation: `অনুপাত অনুযায়ী ক্রয়মূল্য ${bnRCP} টাকা হলে লাভ/ক্ষতি $= |${bnRSP} - ${bnRCP}|$ টাকা। শতকরা হার $= \\frac{|${bnRSP} - ${bnRCP}|}{${bnRCP}} \\times ১০০\\% = ${bnActualPct}\\%$।`,
      });
    }
  }

  return result;
}

// 3. DYNAMIC ALGEBRA & MATH FORMULAS GENERATOR
function generateDynamicAlgebraQuestions(count: number): MCQQuestion[] {
  const result: MCQQuestion[] = [];
  const seeds = [
    { a: 5, b: 3 },
    { a: 4, b: 2 },
    { a: 6, b: 4 },
    { a: 7, b: 3 },
    { a: 8, b: 2 },
    { a: 5, b: 4 },
    { a: 6, b: 2 },
  ];

  for (let i = 0; i < count; i++) {
    const pair = seeds[(i + Math.floor(Math.random() * seeds.length)) % seeds.length];
    const sum = pair.a + pair.b;
    const diff = pair.a - pair.b;
    const prod = pair.a * pair.b;
    const sqSum = pair.a * pair.a + pair.b * pair.b;

    const bnSum = toBanglaNum(sum);
    const bnDiff = toBanglaNum(diff);
    const bnProd = toBanglaNum(prod);
    const bnSqSum = toBanglaNum(sqSum);

    if (i % 2 === 0) {
      const qText = `যদি $a + b = ${bnSum}$ এবং $a - b = ${bnDiff}$ হয়, তবে $ab$ এর মান কত?`;
      const correctStr = bnProd;
      const wrong1 = toBanglaNum(prod + 2);
      const wrong2 = toBanglaNum(Math.max(1, prod - 2));
      const wrong3 = toBanglaNum(prod + 4);

      const randomizedOpts = shuffleArray([correctStr, wrong1, wrong2, wrong3]);
      result.push({
        id: i + 1,
        question: qText,
        options: randomizedOpts,
        correctAnswer: randomizedOpts.indexOf(correctStr),
        explanation: `সূত্র: $ab = \\left(\\frac{a+b}{2}\\right)^2 - \\left(\\frac{a-b}{2}\\right)^2 = \\left(\\frac{${bnSum}}{2}\\right)^2 - \\left(\\frac{${bnDiff}}{2}\\right)^2 = ${bnProd}$।`,
      });
    } else {
      const qText = `যদি $a + b = ${bnSum}$ এবং $ab = ${bnProd}$ হয়, তবে $a^2 + b^2$ এর মান কত?`;
      const correctStr = bnSqSum;
      const wrong1 = toBanglaNum(sqSum + 4);
      const wrong2 = toBanglaNum(Math.max(2, sqSum - 4));
      const wrong3 = toBanglaNum(sqSum + 6);

      const randomizedOpts = shuffleArray([correctStr, wrong1, wrong2, wrong3]);
      result.push({
        id: i + 1,
        question: qText,
        options: randomizedOpts,
        correctAnswer: randomizedOpts.indexOf(correctStr),
        explanation: `সূত্র: $a^2 + b^2 = (a+b)^2 - 2ab = (${bnSum})^2 - 2(${bnProd}) = ${bnSqSum}$।`,
      });
    }
  }

  return result;
}

// 4. TOPIC-AWARE DISPATCHER FOR ALL SUBJECTS
function getDynamicTopicMCQs(
  subject: string,
  count: number,
  topicTitle: string,
  isCombined: boolean
): MCQQuestion[] {
  const t = topicTitle.toLowerCase();

  // If user asked for Voice Change -> Return Dynamic Voice Change MCQs ONLY
  if (t.includes('voice') || t.includes('passive') || t.includes('active')) {
    return generateDynamicVoiceQuestions(count);
  }

  // If user asked for Percentage / Profit & Loss -> Return Dynamic Percentage MCQs ONLY
  if (t.includes('শতকরা') || t.includes('লাভ') || t.includes('ক্ষতি') || t.includes('percentage') || t.includes('profit')) {
    return generateDynamicProfitLossQuestions(count);
  }

  // If user asked for Algebra -> Return Dynamic Algebra MCQs ONLY
  if (t.includes('বীজগণিত') || t.includes('algebra') || t.includes('সূচক') || t.includes('সমীকরণ')) {
    return generateDynamicAlgebraQuestions(count);
  }

  // If combined model test (and no specific topic was specified)
  if (isCombined) {
    const combinedResult: MCQQuestion[] = [];
    const subjects = ['Bangla', 'English', 'Mathematics', 'General Knowledge', 'Computer Science / IT'];
    for (let i = 0; i < count; i++) {
      const currentSubj = subjects[i % subjects.length];
      if (currentSubj === 'English') {
        const vq = generateDynamicVoiceQuestions(1)[0];
        combinedResult.push({ ...vq, id: i + 1 });
      } else if (currentSubj === 'Mathematics') {
        const mq = generateDynamicProfitLossQuestions(1)[0];
        combinedResult.push({ ...mq, id: i + 1 });
      } else if (currentSubj === 'Bangla') {
        const bq = getBanglaGrammarQuestion(i + 1);
        combinedResult.push(bq);
      } else if (currentSubj === 'General Knowledge') {
        const gkq = getGKQuestion(i + 1);
        combinedResult.push(gkq);
      } else {
        const csq = getCSQuestion(i + 1);
        combinedResult.push(csq);
      }
    }
    return combinedResult;
  }

  // Subject-specific fallback
  if (subject === 'English') {
    return generateDynamicVoiceQuestions(count);
  }
  if (subject === 'Mathematics') {
    return generateDynamicProfitLossQuestions(count);
  }
  if (subject === 'Bangla') {
    const list: MCQQuestion[] = [];
    for (let i = 0; i < count; i++) {
      list.push(getBanglaGrammarQuestion(i + 1));
    }
    return list;
  }
  if (subject === 'General Knowledge') {
    const list: MCQQuestion[] = [];
    for (let i = 0; i < count; i++) {
      list.push(getGKQuestion(i + 1));
    }
    return list;
  }

  // Default CS / IT
  const csList: MCQQuestion[] = [];
  for (let i = 0; i < count; i++) {
    csList.push(getCSQuestion(i + 1));
  }
  return csList;
}

// Static pools for Bangla, GK, CS (shuffled on access)
function getBanglaGrammarQuestion(id: number): MCQQuestion {
  const pool = [
    {
      q: 'কোনটি দ্বিগু সমাসের উদাহরণ?',
      opts: ['তেপান্তর', 'পীতাম্বর', 'নীলকণ্ঠ', 'দশানন'],
      ans: 0,
      exp: 'তিন প্রান্তরের সমাহার = তেপান্তর। সমাহার অর্থে দ্বিগু সমাস হয়।',
    },
    {
      q: '‘গায়ক’ শব্দের সঠিক সন্ধি বিচ্ছেদ কোনটি?',
      opts: ['গৈ + অক', 'গা + অক', 'গো + অক', 'গে + অক'],
      ans: 0,
      exp: 'স্বরসন্ধির নিয়মে ঐ-কারের পর অন্য স্বরধ্বনি থাকলে ‘আয়’ হয়। তাই গৈ + অক = গায়ক।',
    },
    {
      q: '‘পাপে বিরত হও’— এখানে ‘পাপে’ কোন কারকে কোন বিভক্তি?',
      opts: ['অপাদানে ৭মী', 'করণে ৭মী', 'অধিকরণে ৭মী', 'কর্মে ৭মী'],
      ans: 0,
      exp: 'যা থেকে কোনো কিছু ভীত, জাত বা বিরত হয় তাকে অপাদান কারক বলে। পাপে (এ বিভক্তি = ৭মী)।',
    },
    {
      q: '‘মনমাঝি’ কোন সমাসের উদাহরণ?',
      opts: ['রূপক কর্মধারয়', 'উপমিত কর্মধারয়', 'উপমান কর্মধারয়', 'তৎপুরুষ'],
      ans: 0,
      exp: 'মন রূপ মাঝি = মনমাঝি। অভেদ কল্পনা করা হলে রূপক কর্মধারয় সমাস হয়।',
    },
    {
      q: 'শুদ্ধ বানান কোনটি?',
      opts: ['মুমূর্ষু', 'মুহূর্মুহু', 'মুহুর্ত', 'পিপিলীকা'],
      ans: 0,
      exp: 'মুমূর্ষু বানানে প্রথমটি হ্রস্ব-উ (মু), দ্বিতীয়টি দীর্ঘ-ঊ (মূ), তৃতীয়টি হ্রস্ব-উ (র্ষু)।',
    },
  ];
  const item = pool[(id - 1) % pool.length];
  const correctOpt = item.opts[item.ans];
  const opts = shuffleArray(item.opts);
  return {
    id,
    question: item.q,
    options: opts,
    correctAnswer: opts.indexOf(correctOpt),
    explanation: item.exp,
  };
}

function getGKQuestion(id: number): MCQQuestion {
  const pool = [
    {
      q: 'বাংলাদেশের সংবিধান কত তারিখে গণপরিষদে গৃহীত হয়?',
      opts: ['৪ নভেম্বর ১৯৭২', '১৬ ডিসেম্বর ১৯৭২', '২৬ মার্চ ১৯৭২', '১৭ এপ্রিল ১৯৭২'],
      ans: 0,
      exp: '১৯৭২ সালের ৪ নভেম্বর গণপরিষদে বাংলাদেশের সংবিধান গৃহীত হয় এবং ১৬ ডিসেম্বর ১৯৭২ থেকে কার্যকর হয়।',
    },
    {
      q: 'মুক্তিযুদ্ধকালীন সময়ে সমগ্র বাংলাদেশকে কয়টি সেক্টরে বিভক্ত করা হয়েছিল?',
      opts: ['১১টি সেক্টর', '১০টি সেক্টর', '৯টি সেক্টর', '১২টি সেক্টর'],
      ans: 0,
      exp: '১৯৭১ সালের মুক্তিযুদ্ধে যুদ্ধ পরিচালনার সুবিধার জন্য বাংলাদেশকে ১১টি সেক্টরে ভাগ করা হয়।',
    },
    {
      q: 'বাংলাদেশের সংবিধানে মূলনীতি কয়টি?',
      opts: ['৪টি', '৫টি', '৭টি', '৩টি'],
      ans: 0,
      exp: 'সংবিধানের ৮ নম্বর অনুচ্ছেদ অনুযায়ী ৪টি মূলনীতি: জাতীয়তাবাদ, সমাজতন্ত্র, গণতন্ত্র ও ধর্মনিরপেক্ষতা।',
    },
    {
      q: 'মুজিবনগর সরকার কোন তারিখে শপথ গ্রহণ করে?',
      opts: ['১৭ এপ্রিল ১৯৭১', '১০ এপ্রিল ১৯৭১', '২৬ মার্চ ১৯৭১', '২৫ মার্চ ১৯৭১'],
      ans: 0,
      exp: '১৯৭১ সালের ১৭ এপ্রিল তৎকালীন মেহেরপুরের বৈদ্যনাথতলার আম্রকাননে মুজিবনগর সরকার শপথ গ্রহণ করে।',
    },
  ];
  const item = pool[(id - 1) % pool.length];
  const correctOpt = item.opts[item.ans];
  const opts = shuffleArray(item.opts);
  return {
    id,
    question: item.q,
    options: opts,
    correctAnswer: opts.indexOf(correctOpt),
    explanation: item.exp,
  };
}

function getCSQuestion(id: number): MCQQuestion {
  const pool = [
    {
      q: 'Which condition is NOT strictly required for a system deadlock to occur (Coffman Conditions)?',
      opts: ['Preemption allowed', 'Mutual Exclusion', 'Hold and Wait', 'Circular Wait'],
      ans: 0,
      exp: 'The Coffman condition is "No preemption" (resources cannot be forcibly taken away). Allowing preemption prevents deadlocks.',
    },
    {
      q: 'Which algorithm is used in Operating Systems to avoid deadlocks?',
      opts: ["Banker's Algorithm", "Dijkstra's Shortest Path", "Round Robin Algorithm", "First In First Out (FIFO)"],
      ans: 0,
      exp: "Banker's Algorithm tests for safety by simulating resource allocation before granting requests.",
    },
    {
      q: 'In the OSI Model, which layer is responsible for end-to-end reliable transmission and flow control?',
      opts: ['Transport Layer', 'Network Layer', 'Data Link Layer', 'Session Layer'],
      ans: 0,
      exp: 'The Transport Layer (Layer 4) handles end-to-end communication, segmentation, flow control, and error correction (TCP).',
    },
    {
      q: 'What is the default port number for HTTPS secure web traffic?',
      opts: ['443', '80', '8080', '22'],
      ans: 0,
      exp: 'Port 443 is the standard port for HTTPS communication; Port 80 is for unencrypted HTTP.',
    },
  ];
  const item = pool[(id - 1) % pool.length];
  const correctOpt = item.opts[item.ans];
  const opts = shuffleArray(item.opts);
  return {
    id,
    question: item.q,
    options: opts,
    correctAnswer: opts.indexOf(correctOpt),
    explanation: item.exp,
  };
}

function getTopicAwareWritten(
  subject: string,
  count: number,
  topicTitle: string
): WrittenQuestion[] {
  const isBangla = subject === 'Bangla' || isBanglaTopic(topicTitle);

  const poolBangla: WrittenQuestion[] = [
    {
      id: 1,
      question: `‘${topicTitle}’ বিষয়ের মূল ধারণা, গাণিতিক/তাত্ত্বিক নিয়মাবলী এবং চাকরি পরীক্ষার গুরুত্বপূর্ণ প্রয়োগ ব্যাখ্যা করুন।`,
      marks: 5,
      modelAnswer: `${topicTitle} হলো বিসিএস ও প্রতিযোগিতামূলক চাকরি পরীক্ষার জন্য একটি অত্যন্ত গুরুত্বপূর্ণ অধ্যায়। এর মৌলিক ভিত্তি, সূত্রাবলী ও তাত্ত্বিক বিশ্লেষণ নির্ভুলভাবে পরীক্ষার খাতায় উপস্থাপন করতে হবে।`,
      keyPoints: [
        'মৌলিক ধারণা ও সংজ্ঞায়ন',
        'প্রাসঙ্গিক সূত্র ও নিয়মাবলী',
        'বিসিএস স্ট্যান্ডার্ড সমাধান পদ্ধতি',
      ],
      status: 'Not Practiced',
    },
    {
      id: 2,
      question: `‘${topicTitle}’ সম্পর্কিত সমস্যা সমাধানের প্রধান ধাপগুলো উদাহরণসহ বিশ্লেষণ করুন।`,
      marks: 5,
      modelAnswer: `সমস্যা সমাধানের প্রতিটি ধাপে প্রাসঙ্গিক সূত্র, যৌক্তিক যুক্তি এবং স্পষ্ট উদাহরণ উল্লেখ করা অপরিহার্য।`,
      keyPoints: [
        'সূত্র বা নিয়মের সঠিক প্রয়োগ',
        'পর্যায়ক্রমিক উপস্থাপন',
        'চূড়ান্ত ফলাফল বিশ্লেষণ',
      ],
      status: 'Not Practiced',
    },
  ];

  const poolEnglish: WrittenQuestion[] = [
    {
      id: 1,
      question: `Elaborate the fundamental concepts, core principles, and problem-solving methodology of "${topicTitle}".`,
      marks: 5,
      modelAnswer: `A comprehensive discussion covering theoretical definitions, core mechanics, and competitive exam application for ${topicTitle}.`,
      keyPoints: [
        'Precise definitions and principles',
        'Standard formulas and rules',
        'Clear structured solution',
      ],
      status: 'Not Practiced',
    },
  ];

  const list = isBangla ? poolBangla : poolEnglish;
  const result: WrittenQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const item = list[i % list.length];
    result.push({
      ...item,
      id: i + 1,
    });
  }
  return result;
}
