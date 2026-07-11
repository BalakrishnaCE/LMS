
import { Settings, Save, Server, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: settingsDoc, isLoading } = useFrappeGetDoc("Lumi Settings", "Lumi Settings");
  const { updateDoc, loading: isUpdating } = useFrappeUpdateDoc();

  const [formData, setFormData] = useState({
    ollama_url: "oma.novelinfra.com",
    chat_llm_model: "gpt-oss:120b-cloud",
    ingest_llm_model: "glm-5.1:cloud",
    ocr_model: "glm-ocr:latest",
    neo4j_uri: "",
    neo4j_user: "",
    neo4j_password: ""
  });

  useEffect(() => {
    if (settingsDoc) {
      setFormData({
        ollama_url: settingsDoc.ollama_url || "oma.novelinfra.com",
        chat_llm_model: settingsDoc.chat_llm_model || "gpt-oss:120b-cloud",
        ingest_llm_model: settingsDoc.ingest_llm_model || "glm-5.1:cloud",
        ocr_model: settingsDoc.ocr_model || "glm-ocr:latest",
        neo4j_uri: settingsDoc.neo4j_uri || "",
        neo4j_user: settingsDoc.neo4j_user || "",
        neo4j_password: settingsDoc.neo4j_password || ""
      });
    }
  }, [settingsDoc]);

  const handleSave = async () => {
    try {
      await updateDoc("Lumi Settings", "Lumi Settings", formData);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings. Make sure Lumi Settings DocType is created.");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="flex-1 flex flex-col p-6 bg-background space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-8 h-8 text-primary" />
          Lumi Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure the AI engine, LLM models, and Graph Database integrations.
        </p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
            <Server className="w-5 h-5" />
            Ollama Configuration
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ollama URL</label>
              <Input 
                value={formData.ollama_url}
                onChange={(e) => handleChange("ollama_url", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Chat LLM Model</label>
              <Input 
                value={formData.chat_llm_model}
                onChange={(e) => handleChange("chat_llm_model", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ingest LLM Model</label>
              <Input 
                value={formData.ingest_llm_model}
                onChange={(e) => handleChange("ingest_llm_model", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">OCR Model</label>
              <Input 
                value={formData.ocr_model}
                onChange={(e) => handleChange("ocr_model", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
            <Database className="w-5 h-5" />
            Neo4j Configuration
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Neo4j URI</label>
              <Input 
                placeholder="bolt://localhost:7687" 
                value={formData.neo4j_uri}
                onChange={(e) => handleChange("neo4j_uri", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Neo4j User</label>
              <Input 
                placeholder="neo4j" 
                value={formData.neo4j_user}
                onChange={(e) => handleChange("neo4j_user", e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Neo4j Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={formData.neo4j_password}
                onChange={(e) => handleChange("neo4j_password", e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <Button className="flex items-center gap-2" onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
