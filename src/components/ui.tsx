'use client';
import Link from 'next/link';
import { ArrowUpRight, X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
export function tabKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
    return;
  const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  event.preventDefault();
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + tabs.length) %
          tabs.length;
  tabs[next].focus();
  tabs[next].click();
}
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="30"
      height="30"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M26 9 20 3H9L3 9v14l6 6h14l6-6V14H15v6h8v1l-3 3h-8l-3-3V12l3-3h8l3 3"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M16 3v6" stroke="currentColor" strokeWidth="3.5" />
    </svg>
  );
}
export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Growora home">
      <Mark />
      <span>
        growora<span className="logo-dot">.</span>
      </span>
    </Link>
  );
}
export function ButtonLink({
  href,
  children,
  secondary = false,
  className = '',
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`button ${secondary ? 'secondary' : ''} ${className}`}>
      {children}
      <ArrowUpRight size={16} />
    </Link>
  );
}
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow">
      <span />
      {children}
    </div>
  );
}
export function SectionTitle({
  number,
  kicker,
  title,
  description,
}: {
  number?: string;
  kicker: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="kicker">
          {number && <span>{number} / </span>}
          {kicker}
        </p>
        <h2>{title}</h2>
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}
export function Status({ children }: { children: ReactNode }) {
  return (
    <span className="status">
      <i />
      {children}
    </span>
  );
}
export function ScoreMeter({ score }: { score: number }) {
  return (
    <div
      className="growora-score"
      style={{ '--score': `${Math.min(100, Math.max(0, score))}%` } as React.CSSProperties}
      aria-label={`Lead score ${score} out of 100`}
    >
      <strong>
        {score}
        <small>/100</small>
      </strong>
      <span>GROWORA SCORE</span>
      <i aria-hidden="true" />
    </div>
  );
}
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open) {
      dialog?.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        dialog?.close();
        document.body.style.overflow = previous;
      };
    }
    dialog?.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? 'wide' : ''}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-head">
        <h3>{title}</h3>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
