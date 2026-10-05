import { qualify, type LeadInput } from './domain';

// This is an illustrative lifecycle, never a stored workspace record.
export const storyInput: LeadInput = {
  name: 'Alex Morgan',
  company: 'Northline Studio',
  email: 'alex.morgan@example.com',
  service: 'Website redesign',
  budget: '£5,000–£10,000',
  timeline: 'Within 30 days',
};
export const storyLead = {
  ...storyInput,
  ...qualify(storyInput),
  reference: 'G / 001',
  owner: 'Jamie Lee',
};
export const storyStages = [
  'Capture',
  'Qualify',
  'Score',
  'Route',
  'Follow up',
  'Convert',
] as const;
export const storyChapters = [
  {
    title: 'A visitor becomes a conversation.',
    description:
      'A name is only the beginning. Growora captures the project behind the enquiry, so the first conversation starts with context.',
    receipt: 'Website enquiry received',
  },
  {
    title: 'Good context. Better decisions.',
    description:
      'Company, budget and timing come together. See who fits your business before your team spends time finding out.',
    receipt: 'Context, budget and timing resolved',
  },
  {
    title: 'Know who’s ready. And why.',
    description:
      'A clear intent score brings the strongest opportunities into focus. Every point has a reason you can see.',
    receipt: '91 / 100 · High intent',
  },
  {
    title: 'The right person. From the start.',
    description:
      'High-intent leads go directly to priority sales. Alex’s score of 91 puts Jamie in charge of the next conversation.',
    receipt: 'Priority sales → Jamie Lee',
  },
  {
    title: 'Keep the conversation moving.',
    description:
      'Prepare the first response and schedule a reminder. A clear next action keeps good opportunities from going quiet.',
    receipt: 'Response prepared · +1 day reminder',
  },
  {
    title: 'From a visit to a real possibility.',
    description:
      'One qualified opportunity, ready for your team. The context, the owner and the next action arrive together.',
    receipt: 'Qualified opportunity · £7,500',
  },
] as const;
export type SceneFrame = {
  progress: number;
  intro: number;
  time: number;
  story: boolean;
  pointerX: number;
  pointerY: number;
};
export type SceneClock = {
  getSnapshot: () => SceneFrame;
  subscribe: (listener: (frame: SceneFrame) => void) => () => void;
};
export const chapterProgress = (progress: number) =>
  Math.max(0, Math.min(1, (progress - 0.1) / 0.9));
