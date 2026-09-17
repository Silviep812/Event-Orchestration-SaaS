import { Link } from "react-router-dom";

export function PublicFooter() {
  return (
    <footer className="border-t bg-muted/30 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Ida Event Partners. All rights reserved.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal and support">
          <Link to="/privacy" className="hover:text-foreground hover:underline">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground hover:underline">Terms</Link>
          <Link to="/refund-policy" className="hover:text-foreground hover:underline">Refund Policy</Link>
          <Link to="/contact" className="hover:text-foreground hover:underline">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
