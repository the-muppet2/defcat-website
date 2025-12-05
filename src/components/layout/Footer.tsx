/**
 * Footer Component
 * Site footer with links and info - updated with accessible tinted styling
 */


export function Footer() {
  return (
    <footer className="glass-tinted-subtle border-t border-tinted mt-6 shadow-tinted-lg">
      <div className="px-8 md:px-16 lg:px-24 py-8">
        <div className="flex flex-col items-center gap-6">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} DefCat's DeckVault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
