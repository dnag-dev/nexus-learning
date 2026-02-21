import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-aauti-bg-light to-white">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-aauti-primary/10 flex items-center justify-center">
            <span className="text-3xl">⭐</span>
          </div>
          <h1 className="text-3xl font-bold text-aauti-text-primary">
            Welcome to Aauti Learn
          </h1>
          <p className="text-aauti-text-secondary mt-2">
            Sign in to continue your learning adventure
          </p>
        </div>

        <div className="aauti-card">
          <Link
            href="/api/auth/login"
            className="w-full inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-aauti-primary rounded-xl hover:bg-aauti-primary/90 transition-colors"
          >
            Sign In with Auth0
          </Link>

          <div className="mt-4 text-center">
            <p className="text-sm text-aauti-text-muted">
              New here?{" "}
              <Link
                href="/api/auth/login?screen_hint=signup"
                className="text-aauti-primary hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
