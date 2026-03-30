import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function StepsContent({ content }: { content: any }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = content.steps_item || [];
  return (
    <div>
      <div className="font-semibold text-lg mb-2 text-center text-foreground">{content.title}</div>
      <div className="flex gap-6 items-start">
        {/* Stepper */}
        <div className="flex flex-col min-w-[120px] pt-2">
          {steps.map((step: any, idx: number) => (
            <motion.button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              initial={false}
              animate={{
                color: idx === currentStep ? 'var(--primary)' : 'var(--muted-foreground)',
                fontWeight: idx === currentStep ? 700 : 500,
                backgroundColor: idx === currentStep ? 'var(--secondary)' : 'rgba(0,0,0,0)',
                borderRadius: idx === currentStep ? 8 : 0,
              }}
              className="text-left px-3 py-2 mb-1 focus:outline-none transition-colors"
              style={{ fontSize: 18 }}
            >
              {step.item_name}
            </motion.button>
          ))}
        </div>
        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            <div className="font-bold text-lg mb-1 text-foreground">{steps[currentStep]?.item_name}</div>
            <div
              className="prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground"
              dangerouslySetInnerHTML={{ __html: steps[currentStep]?.item_content || "" }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StepsContent; 