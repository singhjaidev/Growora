import { storyChapters, storyStages } from '@/lib/lead-story';
/** Readable counterpart of the single persistent hero / scroll world. */
export function JourneyTranscript() {
  return (
    <details className="spatial-transcript">
      <summary>One lead, six next steps — read the journey</summary>
      <ol>
        {storyChapters.map((chapter, index) => (
          <li key={chapter.title}>
            <strong>
              {storyStages[index]} — {chapter.title}
            </strong>
            <p>{chapter.description}</p>
          </li>
        ))}
      </ol>
      <p>A product walkthrough: one enquiry, with its context connected at every step.</p>
    </details>
  );
}
