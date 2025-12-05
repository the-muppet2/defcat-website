export default function DeckDetailLoading() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="glass-tinted border-tinted rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Commander image skeleton */}
            <div className="w-full md:w-64 aspect-[5/7] bg-accent-tinted rounded-lg shimmer-tinted" />
            
            {/* Deck info skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-8 w-3/4 bg-accent-tinted rounded shimmer-tinted" />
              <div className="h-6 w-1/2 bg-accent-tinted rounded shimmer-tinted" />
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-accent-tinted shimmer-tinted" />
                ))}
              </div>
              <div className="h-4 w-full bg-accent-tinted rounded shimmer-tinted" />
              <div className="h-4 w-5/6 bg-accent-tinted rounded shimmer-tinted" />
            </div>
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-tinted border-tinted rounded-lg p-4 space-y-2">
              <div className="h-4 w-20 bg-accent-tinted rounded shimmer-tinted" />
              <div className="h-8 w-16 bg-accent-tinted rounded shimmer-tinted" />
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="flex gap-2 border-b border-tinted pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-24 bg-accent-tinted rounded shimmer-tinted" />
          ))}
        </div>

        {/* Card list skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="glass-tinted border-tinted rounded-lg p-3 flex gap-3">
              <div className="w-16 aspect-[5/7] bg-accent-tinted rounded shimmer-tinted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-3/4 bg-accent-tinted rounded shimmer-tinted" />
                <div className="h-4 w-1/2 bg-accent-tinted rounded shimmer-tinted" />
                <div className="h-4 w-1/4 bg-accent-tinted rounded shimmer-tinted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
