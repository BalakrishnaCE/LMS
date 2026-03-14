import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Minus } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";

// Types
interface FAQItem {
  question: string;
  answer: string;
}

interface FAQTopic {
  topic_name: string;
  faqs: FAQItem[];
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Fetch FAQ data from the backend
  const { data: faqResponse, isLoading, error } = useFrappeGetCall<{ message: FAQTopic[] }>(
    "novel_lms.novel_lms.api.faq.get_faq_data"
  );

  const faqTopics: FAQTopic[] = faqResponse?.message ?? [];

  // Build a Record for easier lookup
  const FAQ_DATA = useMemo<Record<string, FAQItem[]>>(() => {
    const map: Record<string, FAQItem[]> = {};
    for (const topic of faqTopics) {
      map[topic.topic_name] = topic.faqs;
    }
    return map;
  }, [faqTopics]);

  const CATEGORIES = useMemo(() => faqTopics.map((t) => t.topic_name), [faqTopics]);

  // Auto-select the first category once data loads
  useEffect(() => {
    if (CATEGORIES.length > 0 && !activeCategory) {
      setActiveCategory(CATEGORIES[0]);
    }
  }, [CATEGORIES, activeCategory]);

  // Filter questions based on search query and active category
  const filteredQuestions = useMemo(() => {
    const questions = FAQ_DATA[activeCategory] || [];
    if (!searchQuery.trim()) return questions;
    return questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeCategory, searchQuery, FAQ_DATA]);

  // Also search across all categories when there's a search query
  const allFilteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const results: { category: string; question: string; answer: string }[] = [];
    for (const [category, questions] of Object.entries(FAQ_DATA)) {
      for (const q of questions) {
        if (
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          results.push({ category, ...q });
        }
      }
    }
    return results;
  }, [searchQuery, FAQ_DATA]);

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const displayQuestions = searchQuery.trim() && allFilteredQuestions
    ? allFilteredQuestions
    : filteredQuestions.map((q) => ({ ...q, category: activeCategory }));

  // Strip HTML tags from answers (answers may be stored as HTML from Text Editor)
  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">Frequently Asked Questions</h1>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-2xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setExpandedIndex(null);
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground"
        />
      </div>

      {/* Loading / Error States */}
      {isLoading && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Loading FAQs…</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-16 text-destructive">
          <p className="text-lg">Failed to load FAQs. Please try again later.</p>
        </div>
      )}

      {/* Content area: Questions on left, Categories on right */}
      {!isLoading && !error && (
        <div className="flex gap-8">
          {/* FAQ List */}
          <div className="flex-1 max-w-2xl space-y-1">
            {displayQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No questions found matching your search.</p>
                <p className="text-sm mt-2">Try a different keyword or browse by category.</p>
              </div>
            ) : (
              displayQuestions.map((item, index) => (
                <div
                  key={`${item.category}-${index}`}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full flex items-center justify-between py-4 px-2 text-left hover:bg-muted/30 rounded-lg transition-colors group"
                  >
                    <span className="text-sm font-medium pr-4 group-hover:text-primary transition-colors">
                      {searchQuery.trim() && 'category' in item && (
                        <span className="text-xs text-muted-foreground font-normal mr-2 bg-muted px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      )}
                      Q{index + 1}. {item.question}
                    </span>
                    <span className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                      {expandedIndex === index ? (
                        <Minus className="size-5" />
                      ) : (
                        <Plus className="size-5" />
                      )}
                    </span>
                  </button>
                  {/* Answer */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {stripHtml(item.answer)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Categories - plain text on the right */}
          <nav className="hidden lg:flex flex-col items-end gap-2 pt-1 shrink-0 ml-auto pr-50">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery("");
                  setExpandedIndex(null);
                }}
                className={`text-sm transition-all duration-200 ${
                  activeCategory === category && !searchQuery.trim()
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
