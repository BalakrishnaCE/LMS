import { PenLine, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocation } from "wouter"
import { ROUTES } from "@/config/routes"

export default function QuickCreate() {
  const [, navigate] = useLocation();

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] min-h-[calc(100vh-4rem)] p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Create Manually Card */}
        <div className="flex flex-col items-center justify-center bg-[#141415] rounded-[2rem] p-10 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-xl min-h-[360px]">
          <div className="flex flex-col items-center text-center gap-4 mb-10">
            <div className="flex items-center gap-3 text-3xl font-bold text-white tracking-wide">
              <PenLine className="w-8 h-8 text-white" />
              Create Manually
            </div>
            <div className="text-zinc-400 text-xl mt-2 leading-relaxed font-medium">
              <p>Build courses manually</p>
              <p>entirely from scratch</p>
              <p>with complete control</p>
            </div>
          </div>
          <Button
            className="w-full max-w-[280px] bg-[#00c8b6] hover:bg-[#00c8b6]/90 text-black font-semibold py-7 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-lg shadow-[#00c8b6]/20 transition-all hover:scale-[1.02]"
            onClick={() => navigate('/edit')}
          >
            <PenLine className="w-6 h-6" /> Start
          </Button>
        </div>

        {/* Create with AI Card */}
        <div className="flex flex-col items-center justify-center bg-[#141415] rounded-[2rem] p-10 border border-white/5 hover:border-white/10 transition-all duration-300 shadow-xl min-h-[360px]">
          <div className="flex flex-col items-center text-center gap-4 mb-10">
            <div className="flex items-center gap-3 text-3xl font-bold text-white tracking-wide">
              <FileText className="w-8 h-8 text-white" />
              Create with AI
            </div>
            <div className="text-zinc-400 text-xl mt-2 leading-relaxed font-medium">
              <p>Create with AI</p>
              <p>Generate modules from</p>
              <p>documents and topics</p>
            </div>
          </div>
          <Button
            className="w-full max-w-[280px] bg-[#00c8b6] hover:bg-[#00c8b6]/90 text-black font-semibold py-7 rounded-2xl text-xl flex items-center justify-center gap-3 shadow-lg shadow-[#00c8b6]/20 transition-all hover:scale-[1.02]"
            onClick={() => navigate(ROUTES.AI_MODULE_WIZARD)}
          >
            <FileText className="w-6 h-6" /> Start
          </Button>
        </div>
      </div>
    </div>
  )
}
