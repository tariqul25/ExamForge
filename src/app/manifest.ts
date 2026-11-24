import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ExamForge - Smart Competitive Exam & Job Prep',
    short_name: 'ExamForge',
    description:
      'Smart Competitive Job Preparation & Exam Platform. Snap textbook notes or enter topics to generate BCS, Bank & job exams with detailed explanations.',
    start_url: '/',
    id: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'portrait-primary',
    background_color: '#090d16',
    theme_color: '#4f46e5',
    categories: ['education', 'productivity'],
    lang: 'en-US',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
