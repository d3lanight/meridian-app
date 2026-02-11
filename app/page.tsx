export default function Home() {
  return (
    <main className="min-h-screen bg-bg p-6">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-4xl font-bold text-accent mb-2">
            Meridian
          </h1>
          <p className="font-body text-textSecondary text-sm">
            Crypto Analyst Agent - Setup Complete! ✅
          </p>
        </div>

        {/* Design System Test Card */}
        <div className="bg-surface border border-accent/10 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-xl font-semibold text-textPrimary">
            Design System Check
          </h2>
          
          {/* Color Tests */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-accent"></div>
              <span className="font-mono text-xs text-textSecondary">
                Accent: #F5B74D
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-positive"></div>
              <span className="font-mono text-xs text-textSecondary">
                Positive: #34D399
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-negative"></div>
              <span className="font-mono text-xs text-textSecondary">
                Negative: #F87171
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-surface border border-accent/20"></div>
              <span className="font-mono text-xs text-textSecondary">
                Surface: #131B2E
              </span>
            </div>
          </div>

          {/* Typography Tests */}
          <div className="pt-4 border-t border-accent/10 space-y-2">
            <p className="font-display font-bold text-textPrimary">
              Display Font (Outfit Bold)
            </p>
            <p className="font-body text-textSecondary">
              Body Font (DM Sans Regular)
            </p>
            <p className="font-mono text-xs text-textMuted">
              Mono Font (DM Mono) - 0x1A2B3C
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <p className="text-xs text-textMuted font-mono">
            Story 10: Next.js Project Setup
          </p>
          <p className="text-sm text-positive mt-1">
            ✓ Ready for Story 11
          </p>
        </div>
      </div>
    </main>
  );
}
