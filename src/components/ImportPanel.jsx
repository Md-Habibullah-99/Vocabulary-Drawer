/**
 * ImportPanel.jsx
 * ----------------
 * The empty-state / import screen. Shown when there are no cards yet
 * (or via a "Add more words" action later). Lets the learner paste raw
 * vocabulary text and parses it client-side using utils/textParser.js —
 * no backend, no file upload required, though a .txt file can also be
 * read directly to fill the text area.
 *
 * Props:
 *  - onImport: (cards: Array) => void — called with the parsed array
 */

import React, { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { parseVocabularyTextOrThrow } from "../utils/textParser";

const PLACEHOLDER = `BASIC TURKISH NOUNS AND ADJECTIVES
21. Evet Yes
Evet, biliyorum. Yes, I know.
22. Hayır No
Hayır, gelmeyeceğim. No, I will not come.`;

export default function ImportPanel({ onImport }) {
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleParse = () => {
    try {
      const cards = parseVocabularyTextOrThrow(text);
      setError(null);
      onImport(cards);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setText(e.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="text-center mb-8">
        <h1 className="font-display font-semibold text-3xl text-ink">
          Build your word drawer
        </h1>
        <p className="font-body text-ink/60 mt-2 text-sm">
          Paste your vocabulary list below in the format shown, or load a .txt file.
        </p>
      </div>

      <div className="bg-paper border border-rule rounded-sm p-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          rows={12}
          className="w-full resize-none bg-transparent px-4 py-3 font-mono text-sm text-ink placeholder:text-ink/30 focus:outline-none"
        />
      </div>

      {error && (
        <p className="font-body text-sm text-accent mt-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={handleParse}
          className="flex items-center gap-2 bg-accent text-paper px-4 py-2 rounded-sm font-body text-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <FileText size={15} />
          Parse into flashcards
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 border border-rule text-ink/70 px-4 py-2 rounded-sm font-body text-sm hover:border-ink/40 transition-colors"
        >
          <Upload size={15} />
          Load .txt file
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
