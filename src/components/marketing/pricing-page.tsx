'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Plus,
  Minus,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  CreditCard,
  Users,
  Zap,
} from 'lucide-react';
import s from './pricing-page.module.css';

interface Plan {
  id: string;
  name: string;
  badge?: string;
  eyebrow: string;
  desc: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    eyebrow: 'MAKE A STRONG START',
    desc: 'Give every enquiry a better beginning. Perfect for solo consultants, new practices and boutique studios.',
    monthlyPrice: 29,
    yearlyPrice: 23,
    cta: 'Explore Starter',
    ctaHref: '/how-it-works',
    features: [
      '250 leads / month included',
      '3 smart enquiry capture forms',
      '1 workspace member seat',
      'Lead scoring & pipeline views',
      'Instant email & Slack alerts',
      '30-day enquiry history',
      'Standard community & email support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    badge: 'Recommended',
    eyebrow: 'A LITTLE MORE MOMENTUM',
    desc: 'Turn a good process into your team’s unfair advantage. Built for ambitious studios and expanding teams.',
    monthlyPrice: 79,
    yearlyPrice: 63,
    cta: 'Explore Growth',
    ctaHref: '/how-it-works',
    popular: true,
    features: [
      '2,000 leads / month included',
      'Unlimited smart capture forms',
      '5 workspace member seats',
      'Custom automation & qualification rules',
      'Multiple pipeline views',
      'Priority routing & assignment',
      '1-year full enquiry history',
      'Priority email & chat support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    eyebrow: 'ROOM FOR WHAT’S NEXT',
    desc: 'Handle higher volume with the same clarity and care. For established agencies and distributed sales teams.',
    monthlyPrice: 179,
    yearlyPrice: 143,
    cta: 'Explore Scale',
    ctaHref: '/how-it-works',
    features: [
      '10,000 leads / month included',
      'Unlimited smart capture forms',
      '20 workspace member seats',
      'Advanced routing rules & SLA alerts',
      'Unlimited team pipeline views',
      'Source attribution & team analytics',
      'Permanent audit & activity log',
      'Dedicated onboarding & migration specialist',
    ],
  },
];

interface ComparisonCategory {
  category: string;
  features: {
    name: string;
    starter: string | boolean;
    growth: string | boolean;
    scale: string | boolean;
  }[];
}

const comparisonData: ComparisonCategory[] = [
  {
    category: 'Lead Capture & Intake',
    features: [
      { name: 'Monthly lead allowance', starter: '250 / mo', growth: '2,000 / mo', scale: '10,000 / mo' },
      { name: 'Smart embeddable forms', starter: '3 forms', growth: 'Unlimited', scale: 'Unlimited' },
      { name: 'Original context carryover', starter: true, growth: true, scale: true },
      { name: 'Brief file & document attachments', starter: false, growth: 'Up to 25 MB', scale: 'Up to 100 MB' },
      { name: 'Direct webhook & API intake', starter: false, growth: true, scale: true },
    ],
  },
  {
    category: 'Qualification & Routing',
    features: [
      { name: 'Interactive pipeline stages', starter: true, growth: true, scale: true },
      { name: 'Rule-based lead fit scoring', starter: 'Standard criteria', growth: 'Custom rules', scale: 'Advanced weighted rules' },
      { name: 'Separate team pipeline views', starter: '1 pipeline', growth: '3 pipelines', scale: 'Unlimited' },
      { name: 'Team member assignment', starter: 'Manual', growth: 'Round-robin & manual', scale: 'Skill & capacity rules' },
      { name: 'SLA response time warnings', starter: false, growth: true, scale: true },
    ],
  },
  {
    category: 'Automation & Next Steps',
    features: [
      { name: 'Context-preserved follow-up drafts', starter: true, growth: true, scale: true },
      { name: 'Automated notification sequences', starter: '2 basic flows', growth: '20 custom flows', scale: 'Unlimited flows' },
      { name: 'Two-way calendar sync', starter: 'Standard', growth: 'Integrated', scale: 'Custom booking routes' },
      { name: 'Custom tag & source attribution', starter: 'Up to 5 tags', growth: 'Unlimited', scale: 'Unlimited' },
    ],
  },
  {
    category: 'Team & Security',
    features: [
      { name: 'Workspace member seats', starter: '1 member', growth: '5 members', scale: '20 members' },
      { name: 'Additional seat pricing', starter: '£15 / user / mo', growth: '£12 / user / mo', scale: '£10 / user / mo' },
      { name: 'Role-based permissions', starter: 'Owner only', growth: 'Admin & Member', scale: 'Custom granular roles' },
      { name: 'Interaction & audit history', starter: '30 days', growth: '1 year', scale: 'Permanent' },
      { name: 'Single Sign-On (SSO / SAML)', starter: false, growth: false, scale: true },
    ],
  },
  {
    category: 'Support & Guidance',
    features: [
      { name: 'Help center & product guides', starter: true, growth: true, scale: true },
      { name: 'Support response SLA', starter: 'Within 48 hours', growth: 'Within 4 hours', scale: 'Within 1 hour priority' },
      { name: 'Personal onboarding walkthrough', starter: false, growth: '1-on-1 session', scale: 'Dedicated migration manager' },
    ],
  },
];

const pricingFaqs = [
  [
    'How do monthly lead allowances work?',
    'A lead is counted when a new enquiry is received through a Growora form or connected source. If your team reaches your monthly allowance, your leads are never dropped or hidden—they are queued safely while you choose whether to upgrade.',
  ],
  [
    'Can I change plans or switch between monthly and yearly billing?',
    'Yes, at any time. You can upgrade, downgrade, or switch billing frequency directly from your workspace billing settings. Any remaining credit from an active billing cycle is prorated automatically toward your new plan.',
  ],
  [
    'What is a workspace member seat?',
    'A workspace member is any person on your team who has a login to view enquiries, assign opportunities, and collaborate in Growora. You only pay for active team members who require access.',
  ],
  [
    'Is there a free trial before committing?',
    'Yes! You can explore the interactive product walkthrough without creating an account, or start a 14-day free trial on any plan. No credit card is required upfront to test the workspace.',
  ],
  [
    'How does the ~20% annual discount work?',
    'When you choose yearly billing, you save approximately 20% compared to paying month-to-month. The annual amount is billed as a single upfront invoice for the 12-month period.',
  ],
  [
    'What payment methods are supported?',
    'We accept all major credit and debit cards (Visa, Mastercard, American Express). For annual Scale plans, we can also accommodate electronic invoice payments and bank transfers upon request.',
  ],
  [
    'What happens to our customer data if we decide to cancel?',
    'You retain complete ownership of all your data. You can export your full lead history, customer context, and activity logs in CSV or JSON format at any time before closing your account.',
  ],
];

export function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className={s.pricingPage}>
      {/* Hero Section — ends right after trust badges */}
      <section className={s.heroSection}>
        <div className={s.container}>
          <span className={s.label}>A CLEAR PATH TO GROWTH</span>
          <h1 className={s.heroTitle}>
            Start with what you need.
            <br />
            <em>Grow with intent.</em>
          </h1>
          <p className={s.heroCopy}>
            Transparent, predictable plans built for businesses driven by customer conversations.
            Choose your monthly volume, invite your team, and scale seamlessly.
          </p>

          <div className={s.trustBar} role="list" aria-label="Guarantees">
            <span className={s.trustItem} role="listitem">
              <ShieldCheck size={16} /> 14-day free trial on every tier
            </span>
            <span className={s.trustItem} role="listitem">
              <CreditCard size={16} /> No credit card required upfront
            </span>
            <span className={s.trustItem} role="listitem">
              <Zap size={16} /> Switch or cancel anytime
            </span>
          </div>
        </div>
      </section>

      {/* 2nd Section: Plans & Billing (starts from monthly billing) */}
      <section className={s.plansSection} id="plans">
        <div className={s.container}>
          {/* Billing Switcher */}
          <div className={s.billingWrap}>
            <div className={s.billing} role="group" aria-label="Billing frequency">
              <button
                aria-pressed={!annual}
                onClick={() => setAnnual(false)}
              >
                Monthly billing
              </button>
              <button
                aria-pressed={annual}
                onClick={() => setAnnual(true)}
              >
                Yearly billing <span>Save ~20%</span>
              </button>
            </div>
          </div>
          <div className={s.billing} role="group" aria-label="Billing frequency">
            <button
              aria-pressed={!annual}
              onClick={() => setAnnual(false)}
            >
              Monthly billing
            </button>
            <button
              aria-pressed={annual}
              onClick={() => setAnnual(true)}
            >
              Yearly billing <span>Save ~20%</span>
            </button>
          </div>

          {/* 3 Pricing Cards */}
          <div className={s.pricingGrid}>
            {plans.map((p) => {
              const price = annual ? p.yearlyPrice : p.monthlyPrice;
              const billedTotal = Math.round(p.yearlyPrice * 12);

              return (
                <article
                  key={p.id}
                  className={`${s.card} ${p.popular ? s.growthCard : ''}`}
                >
                  <div className={s.cardTop}>
                    <div className={s.cardLabel}>
                      <span>{p.eyebrow}</span>
                      {p.badge && <span className={s.cardLabelBadge}>{p.badge}</span>}
                    </div>
                    <h2 className={s.cardName}>{p.name}</h2>
                    <p className={s.cardDesc}>{p.desc}</p>
                  </div>

                  <div className={s.priceBlock}>
                    <div className={s.priceRow}>
                      <span className={s.priceAmount}>£{price}</span>
                      <span className={s.pricePeriod}>/ month</span>
                    </div>
                    <span className={s.billingNote}>
                      {annual
                        ? `£${billedTotal} billed annually · per workspace`
                        : 'Billed monthly · per workspace'}
                    </span>
                  </div>

                  <Link href={p.ctaHref} className={s.cardAction}>
                    {p.cta} <ArrowRight size={15} style={{ marginLeft: 6 }} />
                  </Link>

                  <ul className={s.cardFeatures}>
                    {p.features.map((feature) => (
                      <li key={feature}>
                        <Check size={16} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>

          <p className={s.pricingDisclaimer}>
            Lead allowances reflect new enquiries captured per calendar month. Yearly prices display
            the monthly equivalent with the full 12 months billed together. All plans include continuous
            product updates and security patches.
          </p>
        </div>
      </section>

      {/* Feature Comparison Matrix */}
      <section className={s.comparisonSection} aria-label="Feature comparison matrix">
        <div className={s.container}>
          <div className={s.comparisonHeading}>
            <span className={s.label}>FULL PLAN BREAKDOWN</span>
            <h2 className={s.comparisonTitle}>Compare all plan features</h2>
            <p className={s.comparisonSubtitle}>
              A detailed side-by-side view of every capability, limit and inclusion.
            </p>
          </div>

          <div className={s.tableWrap}>
            <table className={s.comparisonTable}>
              <thead>
                <tr>
                  <th scope="col">Capabilities</th>
                  <th scope="col">Starter</th>
                  <th scope="col" className={s.featuredHeader}>Growth</th>
                  <th scope="col">Scale</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((group) => (
                  <FragmentGroup key={group.category} group={group} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section — Exact Homepage Theme with Sticky Dark-Green Dotted Card */}
      <section className={s.faqSection} id="pricing-faq" aria-label="Frequently asked questions">
        <div className={`${s.container} ${s.faqLayout}`}>
          <div className={s.faqStickyCol}>
            <div className={s.faqHeadingGreenCard}>
              <span className={s.faqCardLabel}>PRICING & PLANS FAQ</span>
              <h2>
                A few things
                <br />
                worth knowing.
              </h2>
              <p className={s.bodyCopy}>
                Get complete clarity on billing cycles, plan limits, team allowances, and how
                Growora scales with your business.
              </p>
            </div>
          </div>

          <div className={s.faqList}>
            {pricingFaqs.map(([question, answer], idx) => {
              const isOpen = openFaq === idx;
              return (
                <article key={question} data-open={isOpen}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`pricing-faq-answer-${idx}`}
                      id={`pricing-faq-question-${idx}`}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                    >
                      <span>{question}</span>
                      <Plus size={20} />
                    </button>
                  </h3>
                  <div
                    className={s.faqAnswer}
                    id={`pricing-faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`pricing-faq-question-${idx}`}
                    aria-hidden={!isOpen}
                    inert={!isOpen}
                  >
                    <div>
                      <p>{answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function FragmentGroup({ group }: { group: ComparisonCategory }) {
  return (
    <>
      <tr className={s.categoryRow}>
        <th colSpan={4}>{group.category}</th>
      </tr>
      {group.features.map((feat) => (
        <tr key={feat.name}>
          <th scope="row">{feat.name}</th>
          <td>{renderValue(feat.starter)}</td>
          <td className={s.featuredCell}>{renderValue(feat.growth)}</td>
          <td>{renderValue(feat.scale)}</td>
        </tr>
      ))}
    </>
  );
}

function renderValue(val: string | boolean) {
  if (val === true) {
    return (
      <span className={s.checkCell} aria-label="Included">
        <Check size={18} />
      </span>
    );
  }
  if (val === false) {
    return (
      <span className={s.dashCell} aria-label="Not included">
        <Minus size={14} />
      </span>
    );
  }
  return <span>{val}</span>;
}
