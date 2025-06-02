import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import fallbackAnimation from "@/assets/Celebration.json";
// import emptyAnimation from "@/assets/Empty.json";
import LearningDashboard from "@/assets/LearningDashboard.json";

interface Achievement {
  id: string;
  icon_name: string;
  text: string;
  description: string;
  created_on?: string;
}

interface AchievementShowcaseProps {
  achievements: Achievement[];
  loading?: boolean;
}

const animationMap: Record<string, () => Promise<any>> = {
  Department_master: () => import("@/assets/Department_master.json"),
  "5_Modules": () => import("@/assets/5_Modules.json"),
  Score_100: () => import("@/assets/Score_100.json"),
  Completed_1_module: () => import("@/assets/Completed_1_module.json"),
};

const REVEAL_DURATION = 1000; // ms

export const AchievementShowcase: React.FC<AchievementShowcaseProps> = ({ achievements, loading }) => {
  const [animations, setAnimations] = useState<Record<string, any>>({});
  // Track reveal state for each card: 'revealing' | 'shown'
  const [revealState, setRevealState] = useState<Record<string, 'revealing' | 'shown'>>({});

  // Initial reveal on mount
  useEffect(() => {
    if (achievements.length > 0) {
      const initial: Record<string, 'revealing' | 'shown'> = {};
      achievements.forEach(a => { initial[a.id] = 'revealing'; });
      setRevealState(initial);
      const timer = setTimeout(() => {
        const shown: Record<string, 'revealing' | 'shown'> = {};
        achievements.forEach(a => { shown[a.id] = 'shown'; });
        setRevealState(shown);
      }, REVEAL_DURATION);
      return () => clearTimeout(timer);
    }
  }, [achievements]);

  // Load Lottie animations
  useEffect(() => {
    const loadAnimations = async () => {
      const loaded: Record<string, any> = {};
      for (const ach of achievements) {
        if (animationMap[ach.icon_name]) {
          try {
            const mod = await animationMap[ach.icon_name]();
            loaded[ach.id] = mod.default || mod;
          } catch {
            loaded[ach.id] = fallbackAnimation;
          }
        } else {
          loaded[ach.id] = fallbackAnimation;
        }
      }
      setAnimations(loaded);
    };
    if (achievements.length > 0) loadAnimations();
  }, [achievements]);

  // Handle hover reveal
  const handleHover = (id: string) => {
    setRevealState(prev => ({ ...prev, [id]: 'revealing' }));
    setTimeout(() => {
      setRevealState(prev => ({ ...prev, [id]: 'shown' }));
    }, REVEAL_DURATION);
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading achievements...</div>;
  }

  if (!achievements.length) {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="animate-bounce-slow">
          <Lottie animationData={LearningDashboard} loop style={{ width: 200, height: 200 }} />
        </div>
        <div className="mt-4 text-lg font-semibold" style={{ color: 'var(--theme-accent, #f59e42)' }}>Everyone starts somewhere! Your first achievement is just around the corner.</div>
        <div className="text-muted-foreground text-sm mt-1">Dive into your 1st module and let your journey begin.</div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-2">Your Achievements</h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-6 pb-2">
          {achievements.map((ach) => {
            const state = revealState[ach.id] || 'shown';
            return (
              <Card
                key={ach.id}
                className={`min-w-[240px] max-w-xs flex-shrink-0 flex flex-col items-center p-4 shadow-xl border border-primary/10 transition-all duration-500 relative overflow-hidden`}
                onMouseEnter={() => handleHover(ach.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Full-card animation reveal */}
                <div
                  className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 z-10
                    ${state === 'revealing' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'}
                  `}
                //   style={{ background: 'rgba(255,255,255,0.95)' }}
                >
                  {animations[ach.id] && (
                    <Lottie animationData={animations[ach.id]} loop style={{ width: 180, height: 180 }} />
                  )}
                </div>
                {/* Circle animation + details */}
                <div className={`flex flex-col items-center w-full transition-all duration-500 ${state === 'revealing' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
                  <div className="w-24 h-24 flex items-center justify-center mb-2 rounded-full border-4 border-primary/30 shadow-lg transition-all duration-500">
                    {animations[ach.id] && (
                      <Lottie animationData={animations[ach.id]} loop style={{ width: 80, height: 80 }} />
                    )}
                  </div>
                  <CardContent className="flex flex-col items-center p-0">
                    <div className="font-semibold text-lg text-center mb-1">{ach.text}</div>
                    <div className="text-sm text-muted-foreground text-center mb-1">{ach.description}</div>
                    {ach.created_on && (
                      <div className="text-xs text-muted-foreground mt-1">Earned on {new Date(ach.created_on).toLocaleDateString("en-GB")}</div>
                    )}
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AchievementShowcase; 