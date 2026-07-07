/**
 * AddWordForm.jsx
 * ----------------
 * The "add a new word" form for the management page. Four fields as
 * requested: English word, meaning, example sentence, example meaning
 * — plus a category field (datalist-backed, so picking an existing
 * category is one click but typing a brand-new one still works) since
 * every card needs somewhere to live.
 *
 * Props:
 *  - categories: string[] — existing category names, for the datalist
 *    suggestions (ALL_WORDS_CATEGORY should be filtered out by the
 *    caller, it isn't a real category to file a word under)
 *  - defaultCategory: string — pre-filled category (e.g. the section
 *    the learner currently has expanded/selected)
 *  - onAddCard: (cardData) => void
 */
import React, { useState } from "react";
import { Plus } from "lucide-react";

const EMPTY = { word: "", meaning: "", example: "", exampleMeaning: "", category: "" };

export default function AddWordForm({ categories = [], defaultCategory = "", onAddCard }) {
  const [form, setForm] = useState({ ...EMPTY, category: defaultCategory });

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.word.trim() || !form.meaning.trim()) return;
    onAddCard({ ...form });
    setForm({ ...EMPTY, category: form.category }); // keep category for adding several in a row
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2.5 border border-rule rounded-sm p-3.5 bg-paper"
    >
      <h3 className="font-body text-sm font-medium text-ink flex items-center gap-1.5">
        <Plus size={15} className="text-accent" />
        Add a word
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <Field label="English word" value={form.word} onChange={setField("word")} required />
        <Field label="Meaning" value={form.meaning} onChange={setField("meaning")} required />
        <Field
          label="Example sentence"
          value={form.example}
          onChange={setField("example")}
        />
        <Field
          label="Example meaning"
          value={form.exampleMeaning}
          onChange={setField("exampleMeaning")}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wide text-ink/40">Category</label>
        <input
          type="text"
          list="add-word-category-options"
          value={form.category}
          onChange={setField("category")}
          placeholder="e.g. Travel"
          className="bg-paper border border-rule rounded-sm px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
        />
        <datalist id="add-word-category-options">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <button
        type="submit"
        disabled={!form.word.trim() || !form.meaning.trim()}
        className="self-start px-3 py-1.5 rounded-sm bg-accent text-paper text-sm font-medium hover:bg-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Add word
      </button>
    </form>
  );
}

function Field({ label, value, onChange, required }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wide text-ink/40">
        {label}
        {required && <span className="text-accent"> *</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        className="bg-paper border border-rule rounded-sm px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:border-accent"
      />
    </div>
  );
}
