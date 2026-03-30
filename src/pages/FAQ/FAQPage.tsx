import { useState, useEffect } from "react";
import { Search, Plus, Minus } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";

// Types
interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface FAQTopic {
  topic_name: string;
  faqs: FAQItem[];
}


interface FAQResponse {
  topics: FAQTopic[];
  faqs: FAQItem[];
  total: number;
  has_more: boolean;
}

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [allLoadedFaqs, setAllLoadedFaqs] = useState<FAQItem[]>([]);
  const PAGE_SIZE = 20;

  const { data: topicsResponse } = useFrappeGetCall<{ message: string[] }>(
    "novel_lms.novel_lms.api.faq.get_faq_topics"
  );

  const { data: faqResponse, isLoading, error } = useFrappeGetCall<{ message: FAQResponse }>(
    "novel_lms.novel_lms.api.faq.get_faq_data",
    activeCategory ? {
      start: page * PAGE_SIZE,
      page_len: PAGE_SIZE,
      topic: activeCategory
    } : undefined
  );


  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const newFaqs = faqResponse?.message?.faqs ?? [];
    if (page === 0) {
      setAllLoadedFaqs(newFaqs);
    } else {
      setAllLoadedFaqs(prev => [...prev, ...newFaqs]);
    }
  }, [faqResponse]);

  // Search call
  const { data: searchResults, isLoading: isSearching } = useFrappeGetCall(
    "novel_lms.novel_lms.api.faq.search_faq_items",
    debouncedQuery.trim().length >= 2 ? {
      txt: debouncedQuery,
      page_len: 20,
    } : undefined
  );

  const CATEGORIES = topicsResponse?.message ?? [];

  // Auto-select the first category once data loads
  useEffect(() => {
    if (CATEGORIES.length > 0 && !activeCategory) {
      setActiveCategory(CATEGORIES[0]);
    }
  }, [CATEGORIES, activeCategory]);

  const toggleQuestion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const displayQuestions = debouncedQuery.trim().length >= 2
    ? (Array.isArray(searchResults?.message) ? searchResults.message : []).map((r: any) => ({
      question: r.value as string,
      answer: r.description as string,
      category: (r.category as string) ?? "",
    }))
    : allLoadedFaqs;


  // Strip HTML tags from answers (answers may be stored as HTML from Text Editor)
  const stripHtml = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };


  return (
    <div className="flex-1 h-full overflow-y-auto p-6 lg:p-8">
      {/* Header row: Title on left, Search on right */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold mb-6">Frequently Asked Questions</h1>
        {/* Search Bar - top right */}
        <div className="relative w-74">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedIndex(null);
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all placeholder:text-muted-foreground"
          />

        </div>

      </div>


      {/* Loading / Error States */}
      {isLoading && page === 0 && (
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
      {!error && (
        <div className="flex gap-8 justify-between">
          {/* FAQ List */}
          <div className="flex-1 max-w-2xl min-w-0">
            <div className="space-y-1">
              {isSearching ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg animate-pulse">Searching...</p>
                </div>
              ) : displayQuestions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">No questions found matching your search.</p>
                  <p className="text-sm mt-2">Try a different keyword or browse by category.</p>
                </div>
              ) : (
                displayQuestions.map((item: any, index: number) => (
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
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
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
            {/* Load More Button */}
            {!debouncedQuery.trim() && faqResponse?.message?.has_more && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={isLoading}
                  className="px-6 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load More"}
                </button>
              </div>
            )}

          </div>
          {/* Categories - plain text on the right */}
          <nav className="hidden lg:flex flex-col items-end gap-2 pt-1 shrink-0 w-48">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery("");
                  setExpandedIndex(null);
                  setPage(0);
                  setAllLoadedFaqs([]);

                }}
                className={`text-sm transition-all duration-200 ${activeCategory === category && !searchQuery.trim()
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
