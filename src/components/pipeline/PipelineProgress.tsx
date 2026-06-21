import { motion } from "framer-motion";

interface PipelineProgressProps {
  steps: string[];
  currentStep?: number;
  completedSteps?: number;
}

export function PipelineProgress({ steps, currentStep = -1, completedSteps = 0 }: PipelineProgressProps) {
  return (
    <div className="glass-card rounded-lg p-5">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="font-semibold text-white">AI Content Pipeline</span>
        <span className="text-aqua-200">{completedSteps}/{steps.length} completed</span>
      </div>
      <div className="relative">
        <div className="absolute left-3 right-3 top-3 h-px bg-white/12" />
        <div className="relative grid grid-cols-3 gap-4 md:grid-cols-9">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-col items-center gap-2 text-center">
              <motion.div
                initial={{ scale: 0.86, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.04 }}
                className={`z-10 h-6 w-6 rounded-full border transition ${
                  index < completedSteps
                    ? "border-emerald-300 bg-emerald-300 shadow-glow"
                    : index === currentStep
                      ? "animate-pulse border-cyan-200 bg-cyan-400/35 shadow-glow"
                      : "border-white/20 bg-ink-900"
                }`}
              />
              <span className="text-[11px] leading-4 text-slate-400">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
