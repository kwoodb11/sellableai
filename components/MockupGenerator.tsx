"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import TemplateSelector from "./TemplateSelector";
import ImageUploader from "./ImageUploader";

interface Template {
  id: string;
  name: string;
  canvas: {
    width: number;
    height: number;
  };
  placeholders: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  coverFrame: string;
}

const MockupGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [done, setDone] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const showMessage = (
    text: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(""), 5000);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      showMessage("Please select a template first.", "error");
      return;
    }
    if (files.length === 0) {
      showMessage("Please upload at least one design file.", "error");
      return;
    }

    setProgress(0);
    setIsProcessing(true);
    setMessage("");

    let interval: NodeJS.Timeout | null = null;
    if (files.length > 0) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.ceil(100 / files.length / 2);
        });
      }, 300);
    }

    try {
      const formData = new FormData();
      formData.append("template", JSON.stringify(selectedTemplate));
      files.forEach((file) => formData.append("files", file));

      console.log("🔁 Sending mockup generation request...");
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      const { url } = data;

      showMessage(`Successfully generated ${files.length} mockups!`, "success");
      setProgress(100);
      setDownloadUrl(url);
      setDone(true);
    } catch (error) {
      console.error("❌ Generation failed:", error);
      showMessage("Failed to generate mockups. Please try again.", "error");
    } finally {
      if (interval) clearInterval(interval);
      setIsProcessing(false);
    }
  };

  const handleNewProject = () => {
    setSelectedTemplate(null);
    setFiles([]);
    setMessage("");
    setProgress(0);
    setDownloadUrl(null);
    setDone(false);
  };

  const canGenerate = selectedTemplate && files.length > 0 && !isProcessing;

  if (done) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-brand-text">All Done!</h2>
        <p className="text-gray-600">Your mockups are ready.</p>
        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Download Mockups
          </a>
        )}
        <Button onClick={handleNewProject} className="w-full h-12">
          New Project
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-brand-text mb-2">Bulk Create Templates</h2>
        <p className="text-gray-600">Turn AI images into sellable products and matching mockups — instantly.</p>
      </div>

      <TemplateSelector onSelect={setSelectedTemplate} />
      <ImageUploader onFiles={setFiles} />

      {message && (
        <div
          className={`p-4 rounded-lg ${
            messageType === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : messageType === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
      )}

      {isProcessing && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-200 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="pt-4">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className={`w-full h-12 text-lg font-semibold transition-all duration-200 ${
            canGenerate
              ? "bg-primary hover:bg-primary/90 text-white"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </div>
          ) : (
            "Start Generation"
          )}
        </Button>

        {selectedTemplate && files.length > 0 && (
          <p className="text-sm text-gray-600 text-center mt-3">
            Ready to generate {files.length} mockup{files.length !== 1 ? "s" : ""} using{" "}
            {selectedTemplate.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default MockupGenerator;
