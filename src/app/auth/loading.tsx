export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-tinted border-tinted rounded-lg p-8 space-y-6">
        {/* Logo skeleton */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-accent-tinted shimmer-tinted" />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2 text-center">
          <div className="h-8 w-48 mx-auto bg-accent-tinted rounded shimmer-tinted" />
          <div className="h-4 w-64 mx-auto bg-accent-tinted rounded shimmer-tinted" />
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2">
          <div className="flex-1 h-10 bg-accent-tinted rounded shimmer-tinted" />
          <div className="flex-1 h-10 bg-accent-tinted rounded shimmer-tinted" />
        </div>

        {/* Form skeleton */}
        <div className="space-y-4">
          <div className="h-12 w-full bg-accent-tinted rounded shimmer-tinted" />
          <div className="space-y-2">
            <div className="h-4 w-12 bg-accent-tinted rounded shimmer-tinted" />
            <div className="h-10 w-full bg-accent-tinted rounded shimmer-tinted" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-accent-tinted rounded shimmer-tinted" />
            <div className="h-10 w-full bg-accent-tinted rounded shimmer-tinted" />
          </div>
          <div className="h-12 w-full bg-accent-tinted rounded shimmer-tinted" />
        </div>

        {/* Footer skeleton */}
        <div className="h-3 w-48 mx-auto bg-accent-tinted rounded shimmer-tinted" />
      </div>
    </div>
  )
}
