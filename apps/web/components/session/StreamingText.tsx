"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface StreamingTextProps {
  /** SSE endpoint URL to stream text from */
  url: string;
  /** Called with the full parsed teaching data when stream completes */
  onComplete?: (data: {
    explanation: string;
    checkQuestion: string;
    checkAnswer: string;
  }) => void;
  /** Called with accumulated text once enough has loaded (for voice) */
  onFirstSentence?: (text: string) => void;
  /** CSS class for the text container */
  className?: string;
}

export default function StreamingText({
  url,
  onComplete,
  onFirstSentence,
  className = "",
}: StreamingTextProps) {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstSentenceFired = useRef(false);
  const accumulatedRef = useRef("");
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleFirstSentence = useCallback(
    (accumulated: string) => {
      if (firstSentenceFired.current || !onFirstSentence) return;
      // Fire after first sentence (period, exclamation, or question mark followed by space)
      const sentenceEnd = accumulated.match(/[.!?]\s/);
      if (sentenceEnd && accumulated.length > 40) {
        firstSentenceFired.current = true;
        onFirstSentence(accumulated);
      }
    },
    [onFirstSentence]
  );

  useEffect(() => {
    if (!url) return;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "token") {
          accumulatedRef.current += data.text;
          setText(accumulatedRef.current);
          handleFirstSentence(accumulatedRef.current);
        } else if (data.type === "done") {
          setIsStreaming(false);
          // Use the parsed explanation (Claude returns JSON, so the raw
          // stream tokens are the JSON string — the server parses it and
          // sends the clean explanation in the "done" event).
          if (data.explanation) {
            setText(data.explanation);
          }
          onComplete?.({
            explanation: data.explanation ?? accumulatedRef.current,
            checkQuestion:
              data.checkQuestion ?? "Are you ready to practice?",
            checkAnswer: data.checkAnswer ?? "Yes!",
          });
          es.close();
        } else if (data.type === "error") {
          console.warn("StreamingText error event:", data.message);
          // Don't close — server will send a "done" fallback next
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) return;
      setError("Connection lost — loading content...");
      setIsStreaming(false);
      es.close();
    };

    // Safety timeout: if stream takes >30s, close and use what we have
    const timeout = setTimeout(() => {
      if (es.readyState !== EventSource.CLOSED) {
        es.close();
        setIsStreaming(false);
        if (accumulatedRef.current) {
          onComplete?.({
            explanation: accumulatedRef.current,
            checkQuestion: "Are you ready to practice?",
            checkAnswer: "Yes!",
          });
        }
      }
    }, 30000);

    return () => {
      clearTimeout(timeout);
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (error && !text) {
    return (
      <div className={`text-aauti-text-secondary italic ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`whitespace-pre-line ${className}`}>
      {text}
      {isStreaming && (
        <span className="inline-block w-2 h-5 ml-0.5 bg-aauti-primary/70 animate-pulse rounded-sm" />
      )}
    </div>
  );
}
