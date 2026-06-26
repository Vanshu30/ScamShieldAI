"use client";

import { jsPDF } from "jspdf";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
export default function Home() {
  const [message, setMessage] = useState("");
  type AnalysisResult = {
  risk_score: number;
  scam_type: string;
  red_flags: string[];
  recommendation: string;
  url_status?: string;
};

type HistoryItem = {
  message: string;
  risk: number;
  type: string;
};

const [result, setResult] = useState<AnalysisResult | null>(null);
const [history, setHistory] = useState<HistoryItem[]>(() => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("scanHistory");
    return saved ? JSON.parse(saved) : [];
  }
  return [];
});
const [uploadedFile, setUploadedFile] = useState<File | null>(null);
const [loading, setLoading] = useState(false);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

useEffect(() => {
  localStorage.setItem("scanHistory", JSON.stringify(history));
}, [history]);

const extractUrls = (text: string) => {
  return text.match(/https?:\/\/[^\s]+|www\.[^\s]+/g) || [];
};

const detectedUrls = extractUrls(message);


const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadedFile(file);

  const reader = new FileReader();

  reader.onload = (event) => {
    const text = event.target?.result as string;
    setMessage(text);
  };

  reader.readAsText(file);
};

const analyzeMessage = async () => {
  if (!message.trim()) return;

  setLoading(true);

  try {
    const response = await fetch("http://127.0.0.1:8000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
      }),
    });

    const data = await response.json();

console.log("API Response:", data);

setResult(data);

setHistory((prev) => [
  {
    message,
    risk: data.risk_score,
    type: data.scam_type,
  },
  ...prev,
]);
  } catch  {
    alert("Backend is not running.");
  }

  setLoading(false);
};

const downloadPDF = () => {
  if (!result) return;

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Sentinel AI - Scam Analysis Report", 20, 20);

  doc.setFontSize(12);
  doc.text(`Risk Score: ${result.risk_score}%`, 20, 40);
  doc.text(`Scam Type: ${result.scam_type}`, 20, 50);

  doc.text("Red Flags:", 20, 70);
  result.red_flags.forEach((flag, index) => {
    doc.text(`- ${flag}`, 20, 80 + index * 10);
  });

  doc.text("Recommendation:", 20, 130);
  doc.text(result.recommendation, 20, 140);

  doc.save("sentinel-ai-report.pdf");
};

const copyResults = () => {
  if (!result) return;

  const text = `
Risk Score: ${result.risk_score}%
Scam Type: ${result.scam_type}

Red Flags:
${result.red_flags?.join("\n")}

Recommendation:
${result.recommendation}
`;

  navigator.clipboard.writeText(text);
  alert("Results copied to clipboard!");
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <main className="mx-auto flex w-full max-w-3xl flex-col items-center">
        {/* Header */}
        <header className="mb-10 text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-300 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
            AI Cybersecurity
          </div>
          <div className="flex items-center justify-center gap-3">
  <ShieldCheck
    size={42}
    className="text-blue-400"
  />

  <h1 className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
    Sentinel AI
  </h1>
</div>
          <p className="mt-4 text-base text-slate-400 sm:text-lg">
            Your Personal Digital Safety Assistant
          </p>
        </header>

        {/* Input Section */}
        <section className="w-full">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste suspicious message here..."
            rows={8}
            className="w-full resize-none rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 shadow-lg shadow-black/20 backdrop-blur-sm transition-colors focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/30 sm:px-5 sm:py-5 sm:text-base"
          />

<div className="mt-4">
  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-500/50 bg-slate-900/60 p-6 text-center hover:bg-slate-800/80 transition">
    <span className="text-3xl">📂</span>
    <span className="mt-2 font-semibold text-blue-300">
      Upload TXT File
    </span>
    <span className="mt-1 text-sm text-slate-400">
      Click to select a suspicious message file
    </span>

    <input
      type="file"
      accept=".txt"
      onChange={handleFileUpload}
      className="hidden"
    />
  </label>

  {uploadedFile && (
    <p className="mt-2 text-sm text-green-400">
      📄 {uploadedFile.name} loaded successfully
    </p>
  )}
</div>

       {detectedUrls.length > 0 && (
  <div className="mt-3 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
    <p className="font-semibold text-yellow-300">
      🔗 Detected URL{detectedUrls.length > 1 ? "s" : ""}
    </p>

    <ul className="mt-2 space-y-1">
      {detectedUrls.map((url, index) => (
        <li
          key={index}
          className="break-all text-sm text-yellow-200"
        >
          {url}
        </li>
      ))}
    </ul>
  </div>
)}



<div className="mt-4 flex gap-4">
  <button
    onClick={analyzeMessage}
    className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-500 transition"
  >
    {loading ? (
  <span className="flex items-center justify-center gap-2">
    <Loader2 className="h-5 w-5 animate-spin" />
    Analyzing...
  </span>
) : (
  "🔍 Analyze"
)}
  </button>

  <button
    onClick={() => {
      setMessage("");
      setResult(null);
    }}
    className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-500 transition"
  >
    🗑️ Clear
  </button>

  <button
  onClick={() =>
    setMessage(
      "URGENT! Your bank account has been suspended. Click http://fake-bank-login.com and verify your OTP immediately."
    )
  }
  className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-500 transition"
>
  ⚡ Demo
</button>
</div>


        </section>

        {/* Results Card */}
        <section className="mb-8 grid grid-cols-2 gap-4 w-full md:grid-cols-4">

  <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-5">
    <p className="text-slate-400 text-sm">Total Scans</p>
    <h2 className="text-3xl font-bold text-white">
      {mounted ? history.length : 0}
    </h2>
  </div>

  <div className="rounded-xl bg-red-900/20 border border-red-700 p-5">
    <p className="text-red-300 text-sm">High Risk</p>
    <h2 className="text-3xl font-bold text-red-400">
      {mounted ? history.filter(item => item.risk >= 70).length : 0}
    </h2>
  </div>

  <div className="rounded-xl bg-yellow-900/20 border border-yellow-700 p-5">
    <p className="text-yellow-300 text-sm">Suspicious</p>
    <h2 className="text-3xl font-bold text-yellow-400">
      {mounted ? history.filter(item => item.risk >= 40 && item.risk < 70).length : 0}
    </h2>
  </div>

  <div className="rounded-xl bg-green-900/20 border border-green-700 p-5">
    <p className="text-green-300 text-sm">Safe</p>
    <h2 className="text-3xl font-bold text-green-400">
      {mounted ? history.filter(item => item.risk < 40).length : 0}
    </h2>
  </div>

</section>
        <section className="mt-8 w-full rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 shadow-xl shadow-black/30 backdrop-blur-sm sm:mt-10 sm:p-6 lg:p-8">
          <h2 className="mb-5 text-sm font-semibold tracking-wide text-slate-300 uppercase sm:mb-6">
            Analysis Results
          </h2>

          <div className="space-y-5 sm:space-y-6">
            <div>
  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
    Risk Score
  </p>

  <div className="mt-2 h-4 w-full rounded-full bg-slate-700">
    <div
      className={`h-4 rounded-full ${
        (result?.risk_score ?? 0) >= 70
          ? "bg-red-500"
          : (result?.risk_score ?? 0) >= 40
          ? "bg-yellow-400"
          : "bg-green-500"
      }`}
      style={{ width: `${result?.risk_score ?? 0}%` }}
    />
  </div>

  <div className="mt-2 flex items-center gap-4">

  <p className="text-lg font-semibold text-slate-200">
    {result?.risk_score !== undefined ? `${result.risk_score}%` : "--"}
  </p>

  {result && (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        result.risk_score >= 90
          ? "bg-red-700 text-white"
          : result.risk_score >= 70
          ? "bg-orange-600 text-white"
          : result.risk_score >= 40
          ? "bg-yellow-500 text-black"
          : "bg-green-600 text-white"
      }`}
    >
      {result.risk_score >= 90
        ? "🔴 Critical"
        : result.risk_score >= 70
        ? "🟠 High"
        : result.risk_score >= 40
        ? "🟡 Medium"
        : "🟢 Low"}
    </span>
  )}

</div>
</div>

            

<div>
  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
    Scam Type
  </p>
  <p className="mt-1 text-lg font-semibold text-slate-200">
    {result?.scam_type ?? "--"}
  </p>
</div>

<div>
  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
    Scam Status
  </p>

  <span
    className={`mt-2 inline-block rounded-full px-4 py-2 font-semibold ${
      (result?.risk_score ?? 0) >= 70
        ? "bg-red-600 text-white"
        : (result?.risk_score ?? 0) >= 40
        ? "bg-yellow-500 text-black"
        : "bg-green-600 text-white"
    }`}
  >
    {result?.risk_score === undefined
      ? "--"
      : (result?.risk_score ?? 0) >= 70
      ? "🚨 High Risk Scam"
      : (result?.risk_score ?? 0) >= 40
      ? "⚠️ Suspicious Message"
      : "✅ Safe Message"}
  </span>
</div>

<div>
  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
    URL Status
  </p>

  <p className="mt-1 text-lg font-semibold text-slate-200">
    {result?.url_status ?? "--"}
  </p>
</div>



            <div>
              <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Red Flags
              </p>
              <ul className="mt-2 text-slate-300">
  {result?.red_flags?.map((flag: string, index: number) => (
    <li key={index}>• {flag}</li>
  )) || <li>--</li>}
</ul>
            </div>

          
<div>
  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
    Recommendation
  </p>
  <p className="mt-2 text-slate-300">
    {result?.recommendation ?? "--"}
  </p>
</div>

<button
  onClick={copyResults}
  disabled={!result}
  className="mt-4 w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
>
  📋 Copy Results
</button>
<button
  onClick={downloadPDF}
  disabled={!result}
  className="mt-3 w-full rounded-xl bg-purple-600 py-3 font-semibold text-white hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
>
  📄 Download PDF Report
</button>

          </div>
        </section>

{mounted && history.length > 0 && (
  <section className="mt-8 w-full rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5">
    <div className="mb-4 flex items-center justify-between">
  <h2 className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
    Recent Scans
  </h2>

  <button
  onClick={() => {
    if (confirm("Are you sure you want to clear all scan history?")) {
      setHistory([]);
      localStorage.removeItem("scanHistory");
    }
  }}
  className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-500 transition"
>
  🗑️ Clear History
</button>
</div>

    <div className="space-y-3">
      {history.map((item, index) => (
        <div key={index} className="rounded-xl bg-slate-800/70 p-4 text-slate-200">
          <p className="font-semibold">{item.type}</p>
          <p className="text-sm text-slate-400">Risk: {item.risk}%</p>
          <p className="mt-1 text-sm text-slate-300">{item.message}</p>
        </div>
      ))}
    </div>
  </section>
)}

</main>
    </div>
  );
}
