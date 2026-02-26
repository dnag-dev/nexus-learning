"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FAQ {
  question: string;
  answer: string;
}

interface AskTabProps {
  faqs: FAQ[];
  sessionId: string;
  onEvent?: (type: string, detail?: string) => void;
}

interface ChatMessage {
  role: "student" | "tutor";
  text: string;
}

export default function AskTab({
  faqs,
  sessionId,
  onEvent,
}: AskTabProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [questionsRemaining, setQuestionsRemaining] = useState(5);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleFaq = useCallback(
    (index: number) => {
      setExpandedFaq((prev) => (prev === index ? null : index));
    },
    []
  );

  const askQuestion = useCallback(async () => {
    const question = inputText.trim();
    if (!question || isAsking || questionsRemaining <= 0) return;

    setInputText("");
    setIsAsking(true);
    setChatMessages((prev) => [...prev, { role: "student", text: question }]);
    onEvent?.("learn_panel_question_asked", question);

    try {
      const res = await fetch("/api/session/learn-more/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "tutor", text: data.answer },
      ]);
      if (data.questionsRemaining !== undefined) {
        setQuestionsRemaining(data.questionsRemaining);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "tutor",
          text: "Hmm, I couldn't think of an answer right now. Try asking again in a moment!",
        },
      ]);
    } finally {
      setIsAsking(false);
      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [inputText, isAsking, questionsRemaining, sessionId, onEvent]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        askQuestion();
      }
    },
    [askQuestion]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toggle between FAQ and Chat */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowChat(false)}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            !showChat
              ? "bg-aauti-primary/20 text-aauti-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ❓ Common Questions
        </button>
        <button
          onClick={() => setShowChat(true)}
          className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
            showChat
              ? "bg-aauti-primary/20 text-aauti-primary"
              : "text-gray-400 hover:text-white"
          }`}
        >
          💬 Ask a Question
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!showChat ? (
          /* ─── FAQ Mode ─── */
          <motion.div
            key="faq"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0 overflow-y-auto space-y-2"
          >
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
                >
                  <span className="text-lg">❓</span>
                  <p className="text-sm text-white/90 flex-1">{faq.question}</p>
                  <motion.span
                    animate={{ rotate: expandedFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400 text-xs"
                  >
                    ▼
                  </motion.span>
                </button>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pl-11">
                        <p className="text-sm text-white/70 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            <div className="pt-2">
              <button
                onClick={() => setShowChat(true)}
                className="w-full py-3 text-sm text-aauti-primary font-medium hover:text-white transition-colors bg-white/5 rounded-xl border border-dashed border-white/10"
              >
                Don&apos;t see your question? Ask me! 💬
              </button>
            </div>
          </motion.div>
        ) : (
          /* ─── Live Q&A Chat Mode ─── */
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Chat messages */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-3xl mb-3">💬</p>
                  <p className="text-sm text-gray-400">
                    Type a question about this concept and I&apos;ll help you
                    understand!
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    {questionsRemaining} questions remaining
                  </p>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm ${
                      msg.role === "student"
                        ? "bg-aauti-primary text-white rounded-br-md"
                        : "bg-white/10 text-white/90 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" />
                      <div
                        className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: "100ms" }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: "200ms" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    questionsRemaining > 0
                      ? "Type your question..."
                      : "No questions remaining"
                  }
                  disabled={questionsRemaining <= 0 || isAsking}
                  maxLength={500}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-aauti-primary/50 disabled:opacity-50"
                />
              </div>
              <button
                onClick={askQuestion}
                disabled={
                  !inputText.trim() || isAsking || questionsRemaining <= 0
                }
                className="px-4 py-2.5 bg-aauti-primary text-white rounded-xl text-sm font-medium hover:bg-aauti-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                Send
              </button>
            </div>

            {questionsRemaining > 0 && questionsRemaining <= 3 && (
              <p className="text-[10px] text-gray-600 mt-1 text-right">
                {questionsRemaining} question{questionsRemaining !== 1 ? "s" : ""}{" "}
                remaining
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
