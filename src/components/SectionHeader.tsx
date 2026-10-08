/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SectionHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Standardized Section Header Component for DeepFocus OS.
 * Strictly adheres to the Swiss Minimalist brand ADN:
 * - Clean monochrome inline vector icon (w-5 h-5 text-zinc-300)
 * - Title: text-xl md:text-2xl font-bold tracking-tight text-white
 * - Subtitle: text-xs text-[#9496a1] mt-1 font-normal
 * - Border bottom: border-b border-white/[0.08] pb-4
 * - Toolbar / action buttons aligned on the right
 */
export default function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
  className = ''
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-4 ${className}`}>
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-2.5">
          <Icon className="w-5 h-5 text-zinc-300 shrink-0" />
          <span>{title}</span>
          {badge}
        </h2>
        <p className="text-xs text-[#9496a1] mt-1 font-normal">
          {subtitle}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-start sm:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
