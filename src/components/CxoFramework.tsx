"use client";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** Interactive seven-step executive framework. Keyboard accessible (tablist semantics). */
export function CxoFramework({ steps }: { steps: { step: string; body: string }[] }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") setI((v) => (v + 1) % steps.length);
    if (e.key === "ArrowLeft") setI((v) => (v - 1 + steps.length) % steps.length);
  };
  return (
    <section className="container-x py-20" aria-labelledby="fw-title">
      <h2 id="fw-title" className="text-3xl font-semibold">The Curiosbot executive framework</h2>
      <p className="mt-2 max-w-2xl text-slate-400">Seven steps from opportunity to measured value. Select a step to see what it delivers.</p>
      <div role="tablist" aria-label="Framework steps" onKeyDown={onKey} className="mt-8 flex flex-wrap items-center gap-2">
        {steps.map((s, idx) => (
          <button key={s.step} role="tab" id={`fw-tab-${idx}`} aria-selected={i === idx} aria-controls="fw-panel" tabIndex={i === idx ? 0 : -1} onClick={() => setI(idx)}
            className={`rounded-full border px-4 py-2 text-sm transition ${i === idx ? "border-transparent bg-brand-gradient text-white shadow-glow" : "border-white/15 text-slate-300 hover:border-white/40"}`}>
            <span className="mr-2 text-xs opacity-70">{idx + 1}</span>{s.step}
          </button>
        ))}
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded bg-white/10" aria-hidden><div className="h-full bg-brand-gradient transition-all duration-500" style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
      <div id="fw-panel" role="tabpanel" aria-labelledby={`fw-tab-${i}`} className="card mt-6 min-h-[8rem]">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <h3 className="text-2xl">{steps[i].step}</h3><p className="mt-2 text-lg text-slate-300">{steps[i].body}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
