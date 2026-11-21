'use client';

import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text: string;
  className?: string;
}

export default function MathRenderer({ text, className = '' }: MathRendererProps) {
  if (!text) return null;

  // Render parts: handles block math $$...$$ and inline math $...$
  const renderFormattedText = (raw: string) => {
    // Regular expression to match $$...$$ and $...$
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
    const parts = raw.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
        const formula = part.slice(2, -2);
        try {
          const html = katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="my-2 block overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      } else if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const formula = part.slice(1, -1);
        try {
          const html = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={index}
              className="inline-block mx-0.5 align-baseline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch (e) {
          return <span key={index}>{part}</span>;
        }
      }

      // Return plain text
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return <span className={`math-content font-sans ${className}`}>{renderFormattedText(text)}</span>;
}
