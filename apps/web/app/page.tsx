import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-aauti-bg-light to-white">
      <div className="text-center max-w-2xl px-6">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-aauti-primary/10 flex items-center justify-center">
            <span className="text-5xl">⭐</span>
          </div>
          <h1 className="text-5xl font-bold text-aauti-text-primary mb-4 tracking-tight">
            Aauti Learn
          </h1>
          <p className="text-xl text-aauti-text-secondary leading-relaxed">
            AI-powered adaptive tutoring that meets every child exactly where
            they are. Powered by Cosmo the Bear and friends.
          </p>
        </div>

        {/* Entry Points */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/api/auth/login"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-aauti-primary rounded-xl hover:bg-aauti-primary/90 transition-colors"
          >
            🎓 I&apos;m a Parent
          </Link>
          <Link
            href="/kid-login"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20"
          >
            🚀 I&apos;m a Kid
          </Link>
        </div>

        {/* Secondary sign-in */}
        <div className="mt-4">
          <Link
            href="/api/auth/login"
            className="text-sm text-aauti-text-secondary hover:text-aauti-text-primary transition-colors"
          >
            Already have an account? Sign in →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-aauti-primary">K-12</div>
            <div className="text-sm text-aauti-text-secondary mt-1">
              Grade Range
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-aauti-secondary">
              200+
            </div>
            <div className="text-sm text-aauti-text-secondary mt-1">
              Learning Concepts
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-aauti-accent">6</div>
            <div className="text-sm text-aauti-text-secondary mt-1">
              AI Tutors
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-emerald-500">GPS</div>
            <div className="text-sm text-aauti-text-secondary mt-1">
              Learning Roadmap
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
