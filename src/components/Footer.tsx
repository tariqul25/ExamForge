import React from 'react';
import Link from 'next/link';
import ExamForgeLogo from '@/components/ExamForgeLogo';

export default function Footer() {
  const subjects = [
    { name: 'Bangla', bn: 'বাংলা' },
    { name: 'English', bn: 'English' },
    { name: 'Mathematics', bn: 'গণিত' },
    { name: 'General Knowledge', bn: 'সাধারণ জ্ঞান' },
    { name: 'Computer Science / IT', bn: 'কম্পিউটার ও তথ্যপ্রযুক্তি' },
  ];

  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-800/80 bg-white dark:bg-gray-950 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ExamForgeLogo size={28} showText={true} />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            {subjects.map((s) => (
              <span
                key={s.name}
                className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
              >
                {s.name} ({s.bn})
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/settings" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Settings & Admin
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Analytics
            </Link>
            <span>•</span>
            <Link href="/revision" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Revision Bank
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} ExamForge. Built for BCS, Bank & Competitive Job Candidates.</p>
          <p className="mt-1 sm:mt-0">
            Smart Question Generation with Gemini 2.5 & MongoDB Atlas
          </p>
        </div>
      </div>
    </footer>
  );
}
