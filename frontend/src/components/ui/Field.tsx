'use client';

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from 'react';

/** Label + control + error message in one wrapper. */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

export function Input({
  error,
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
      } ${className}`}
      {...rest}
    />
  );
}

export function Select({
  error,
  className = '',
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 ${
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
      } ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({
  error,
  className = '',
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
        error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
          : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
      } ${className}`}
      {...rest}
    />
  );
}
