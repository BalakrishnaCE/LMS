import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Undo2, Check } from "lucide-react";

export interface VideoSettings {
  voiceGender?: string;
  voiceTone?: string;
  speechSpeed?: string;
  narrationLanguage?: string;
}

interface ConvertVideoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chapterTitle: string;
  initialSettings?: VideoSettings;
  onSaveSettings: (settings: VideoSettings) => void;
  onRevertToSlides?: () => void;
  isAlreadyVideo?: boolean;
}

export function ConvertVideoModal({
  isOpen,
  onOpenChange,
  chapterTitle,
  initialSettings,
  onSaveSettings,
  onRevertToSlides,
  isAlreadyVideo = false,
}: ConvertVideoModalProps) {
  const [settings, setSettings] = useState<VideoSettings>({
    voiceGender: initialSettings?.voiceGender || "Female",
    voiceTone: initialSettings?.voiceTone || "Educational",
    speechSpeed: initialSettings?.speechSpeed || "1.25",
    narrationLanguage: initialSettings?.narrationLanguage || "English (US Accent)",
  });

  useEffect(() => {
    if (isOpen) {
      setSettings({
        voiceGender: initialSettings?.voiceGender || "Female",
        voiceTone: initialSettings?.voiceTone || "Educational",
        speechSpeed: initialSettings?.speechSpeed || "1.25",
        narrationLanguage: initialSettings?.narrationLanguage || "English (US Accent)",
      });
    }
  }, [isOpen, initialSettings]);

  const handleSave = () => {
    onSaveSettings(settings);
    onOpenChange(false);
  };

  const handleRevert = () => {
    if (onRevertToSlides) {
      onRevertToSlides();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
            <Video className="w-5 h-5" />
            <span>Convert Slide Chapter to Video Lesson</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Configure AI voice tone, narrator gender, speech rate, and accent to synthesize an MP4 video for <strong className="text-foreground">"{chapterTitle}"</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Voice Gender Selection */}
          <div className="space-y-1.5">
            <label className="font-bold block text-foreground">Voice Gender</label>
            <div className="grid grid-cols-2 gap-2">
              {["Female", "Male"].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, voiceGender: gender }))}
                  className={`p-2.5 rounded-lg border text-center transition-all ${
                    settings.voiceGender === gender
                      ? "border-teal-600 bg-teal-500/10 font-bold text-teal-600 dark:text-teal-400 ring-1 ring-teal-600"
                      : "bg-card hover:bg-accent"
                  }`}
                >
                  {gender} Voice
                </button>
              ))}
            </div>
          </div>

          {/* Voice Tone Selection */}
          <div className="space-y-1.5">
            <label className="font-bold block text-foreground">Voice Tone & Delivery</label>
            <Select
              value={settings.voiceTone}
              onValueChange={(val) => setSettings((prev) => ({ ...prev, voiceTone: val }))}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Voice Tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Professional">Professional & Authoritative</SelectItem>
                <SelectItem value="Conversational">Conversational & Friendly</SelectItem>
                <SelectItem value="Energetic">Energetic & Engaging</SelectItem>
                <SelectItem value="Educational">Educational & Clear</SelectItem>
                <SelectItem value="Calm">Calm & Instructional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speech Rate & Speed */}
          <div className="space-y-1.5">
            <label className="font-bold block text-foreground">Speech Speed / Pace</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "1.25x (Fast)", val: "1.25" },
                { label: "1.50x", val: "1.50" },
                { label: "2.00x", val: "2.00" },
              ].map((sp) => (
                <button
                  key={sp.val}
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, speechSpeed: sp.val }))}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    settings.speechSpeed === sp.val
                      ? "border-teal-600 bg-teal-500/10 font-bold text-teal-600 dark:text-teal-400 ring-1 ring-teal-600"
                      : "bg-card hover:bg-accent"
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language & Accent */}
          <div className="space-y-1.5">
            <label className="font-bold block text-foreground">Narrator Accent & Language</label>
            <Select
              value={settings.narrationLanguage}
              onValueChange={(val) => setSettings((prev) => ({ ...prev, narrationLanguage: val }))}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English (US Accent)">English (US Accent)</SelectItem>
                <SelectItem value="English (UK Accent)">English (UK Accent)</SelectItem>
                <SelectItem value="English (Australian Accent)">English (Australian Accent)</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
            {isAlreadyVideo ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleRevert}
                className="gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Keep as Slides Only</span>
              </Button>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">Default: Pure Interactive Slides</span>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Convert to Video</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
