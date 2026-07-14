import { ArrowLeft, ArrowRight, Sparkles, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocation } from "wouter"
import { ROUTES } from "@/config/routes"
import { motion } from "framer-motion"

export default function QuickCreate() {
  const [, navigate] = useLocation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-6 md:p-12 relative overflow-hidden bg-zinc-50 dark:bg-[#09090b]">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl relative z-10 flex flex-col gap-8 md:gap-12"
      >
        {/* Navigation & Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 items-start">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col gap-2 text-left w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Create a New Module
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg max-w-xl leading-relaxed">
              Choose your path. Build step-by-step with complete manual control, or let AI generate a complete module structure in seconds.
            </p>
          </div>
        </motion.div>

        {/* Selection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card 1: Create Manually */}
          <motion.div
            variants={itemVariants}
            className="relative flex flex-col justify-between overflow-hidden bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-10 shadow-lg transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:border-transparent hover:shadow-[0_20px_40px_var(--color-primary)/20%] hover:scale-[1.02] group flex-1 min-h-[380px] cursor-pointer"
            onClick={() => navigate('/edit')}
          >
            <div className="flex flex-col">
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border border-primary/20 shadow-sm transition-all duration-500 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/10 group-hover:scale-110 group-hover:rotate-6">
                <PenTool className="w-7 h-7" />
              </div>

              {/* Text */}
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white transition-colors duration-500 group-hover:text-white mt-6">
                Create Manually
              </h2>

              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed transition-colors duration-500 group-hover:text-white/90 mt-3 mb-8">
                Build your course curriculum manually from scratch. Take absolute control of layout, media, settings, and question ordering.
              </p>
            </div>

            {/* Action button */}
            <Button
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 rounded-2xl text-base flex items-center justify-center gap-2 shadow-md shadow-primary/10 hover:shadow-primary/25 active:scale-[0.98] transition-all duration-500 group-hover:bg-white group-hover:text-primary group-hover:shadow-xl group-hover:shadow-black/10 cursor-pointer"
            >
              <span>Start from Scratch</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>

          {/* Card 2: Create with AI */}
          <motion.div
            variants={itemVariants}
            className="relative flex flex-col justify-between overflow-hidden bg-white/70 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 md:p-10 shadow-lg transition-all duration-500 ease-out hover:bg-gradient-to-br hover:from-primary hover:to-accent hover:border-transparent hover:shadow-[0_20px_40px_var(--color-primary)/20%] hover:scale-[1.02] group flex-1 min-h-[380px] cursor-pointer"
            onClick={() => navigate(ROUTES.AI_MODULE_WIZARD)}
          >
            <div className="flex flex-col">
              {/* Icon Container */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary border border-primary/20 shadow-sm transition-all duration-500 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/10 group-hover:scale-110 group-hover:-rotate-6 relative">
                <Sparkles className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3 group-hover:hidden">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              </div>

              {/* Text */}
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white transition-colors duration-500 group-hover:text-white mt-6">
                Create with AI
              </h2>

              <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base leading-relaxed transition-colors duration-500 group-hover:text-white/90 mt-3 mb-8">
                Accelerate creation using AI. Prompt a topic, outline a syllabus, or feed files to draft complete modules and interactive quizzes in seconds.
              </p>
            </div>

            {/* Action button */}
            <Button
              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 rounded-2xl text-base flex items-center justify-center gap-2 shadow-md shadow-primary/10 hover:shadow-primary/25 active:scale-[0.98] transition-all duration-500 group-hover:bg-white group-hover:text-primary group-hover:shadow-xl group-hover:shadow-black/10 cursor-pointer"
            >
              <span>Launch AI Wizard</span>
              <Sparkles className="w-4 h-4 animate-pulse group-hover:animate-none" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}



