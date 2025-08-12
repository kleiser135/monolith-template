import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by{" "}
          <Link
            href="https://github.com/kleiser135"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            kleiser135
          </Link>
          . The source code is available on{" "}
          <Link
            href="https://github.com/kleiser135/monolith-template"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4"
          >
            GitHub
          </Link>
          .
        </p>
      </div>
    </footer>
  );
} 