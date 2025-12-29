/** biome-ignore-all lint/a11y/useButtonType: <explanation> */
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, BookOpen, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRef } from "react";
import mermaid from "mermaid";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";

// Initialize mermaid
if (typeof window !== "undefined") {
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
  });
}

interface Doc {
  id: string;
  label: string;
  content: string;
  category: "main" | "diagram";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (ref.current) {
      mermaid
        .render(id.current, chart)
        .then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        })
        .catch((err) => {
          console.error("Mermaid render error:", err);
          if (ref.current) {
            ref.current.innerHTML = `<pre class="text-destructive">Error rendering diagram</pre>`;
          }
        });
    }
  }, [chart]);

  return <div ref={ref} className="my-6 flex justify-center" />;
}

function MarkdownContent({ content }: { content: string }) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A" && target.getAttribute("href")?.startsWith("#")) {
        e.preventDefault();
        const id = target.getAttribute("href")?.substring(1);
        const element = document.getElementById(id || "");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
          window.history.pushState(null, '', `#${id}`)
        }
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, []);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({
          className,
          children,
          ...props
        }: React.ComponentProps<"code">) {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).trim();

          // Fenced code blocks have a language class
          const isFencedBlock = Boolean(match);

          if (isFencedBlock && match?.[1] === "mermaid") {
            return <MermaidDiagram chart={codeStr} />;
          }

          // Fenced code blocks get block styling (handled by pre wrapper)
          if (isFencedBlock) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }

          // Inline code (backticks in text) - no language class
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
              {children}
            </code>
          );
        },
        pre({ children }) {
          // Wrap fenced code blocks
          return (
            <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-4">
              {children}
            </pre>
          );
        },
        h1({ children }) {
          const text = String(children);
          const id = slugify(text)
          return (
            <h1 id={id} className="text-3xl font-bold mb-6 pb-3 border-b border-border scroll-mt-20">
              {children}
            </h1>
          );
        },
        h2({ children }) {
          const text = String(children)
          const id = slugify(text)
          return (
            <h2 id={id} className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
              {children}
            </h2>
          )
        },
        h3({ children }) {
          const text = String(children)
          const id = slugify(text)
          return (
            <h3 id={id} className="text-xl font-semibold mt-6 mb-3 scroll-mt-20">
              {children}
            </h3>
          )
        },
        h4({ children }) {
          const text = String(children)
          const id = slugify(text)
          return (
            <h4 id={id} className="text-lg font-semibold mt-4 mb-2 scroll-mt-20">
              {children}
            </h4>
          )
        },
        p({ children, node }) {
          const hasCodeBlock = node?.children?.some(
            (child: any) => child.tagName === 'pre' || child.tagName === 'code'
          )

          if (hasCodeBlock) {
            return <div className="my-4">{children}</div>
          }

          return <p className="text-muted-foreground leading-7 mb-4">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside space-y-2 text-muted-foreground my-4">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside space-y-2 text-muted-foreground my-4">{children}</ol>
        },
        li({ children }) {
          return <li className="ml-4">{children}</li>
        },
        a({ href, children }) {
          // If it's an anchor link, make it a button to handle scroll
          if (href?.startsWith('#')) {
            return (
              <a
                href={href}
                className="text-primary hover:underline cursor-pointer"
              >
                {children}
              </a>
            )
          }

          return (
            <a
              href={href}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          )
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
              {children}
            </blockquote>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse">{children}</table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-muted/50">{children}</thead>
        },
        th({ children }) {
          return (
            <th className="border border-border px-4 py-2 text-left font-semibold">
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td className="border border-border px-4 py-2 text-muted-foreground">
              {children}
            </td>
          )
        }
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

interface DocumentationViewProps {
  userRole?: string;
}

export function DocumentationView({ userRole }: DocumentationViewProps) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiagram, setSelectedDiagram] = useState<string>("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { theme } = useTheme();

  const isDeveloper = userRole === 'developer';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === "dark" ? "dark" : "neutral",
        securityLevel: 'loose',
        flowchart: {
          defaultRenderer: 'elk',
          curve: 'basis',
          useMaxWidth: true
        }
      })
    }
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    async function fetchDocs() {
      try {
        const mainFiles = [
          { file: "ADMIN_GUIDE.md", label: "Admin Guide" },
          { file: "CONFIGURATION.md", label: "Configuration" },
        ];

        // Developer-only documentation
        if (isDeveloper) {
          mainFiles.push(
            { file: "API.md", label: "API Reference" },
            { file: "SCHEMA_REFERENCE.md", label: "Schema Reference" }
          );
        }

        const mainDocs = await Promise.all(
          mainFiles.map(async ({ file, label }) => {
            const response = await fetch(`/api/docs/${file}`);
            if (!response.ok) throw new Error(`Failed to load ${file}`);
            const content = await response.text();
            return {
              id: file.replace(".md", "").toLowerCase(),
              label,
              content,
              category: "main" as const,
            };
          })
        );

        // Developer-only diagrams
        if (isDeveloper) {
          const diagramFiles = [
            "api-routes-middleware.md",
            "authentication-flow.md",
            "component-hierarchy.md",
            "data-flow.md",
            "database-schema.md",
            "deployment-architecture.md",
            "patreon-oauth-flow.md",
            "system-architecture.md",
          ];

          const diagramDocs = await Promise.all(
            diagramFiles.map(async (file) => {
              const response = await fetch(`/api/docs/diagrams/${file}`);
              if (!response.ok) throw new Error(`Failed to load ${file}`);
              const content = await response.text();
              return {
                id: file.replace(".md", ""),
                label: file
                  .replace(".md", "")
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" "),
                content,
                category: "diagram" as const,
              };
            })
          );

          setDocs([...mainDocs, ...diagramDocs]);
          setSelectedDiagram(diagramDocs[0]?.id || "");
        } else {
          setDocs(mainDocs);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load documentation"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, [isDeveloper]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.slice(1)
        const element = document.getElementById(id)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500)
    }
  }, [docs]);

  if (loading) {
    return (
      <Card className="card-tinted border-tinted">
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading documentation...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="card-tinted border-tinted border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Documentation</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const mainDocs = docs.filter(d => d.category === 'main')
  const diagramDocs = docs.filter(d => d.category === 'diagram')

  return (
    <>
      <div className="space-y-6">
        <Card className="card-tinted border-tinted">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>
              Complete technical documentation for DefCat DeckVault
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Tabs defaultValue={mainDocs[0]?.id} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {mainDocs.map(doc => (
                  <TabsTrigger key={doc.id} value={doc.id}>
                    {doc.label}
                  </TabsTrigger>
                ))}
                {isDeveloper && <TabsTrigger value="diagrams">Diagrams</TabsTrigger>}
              </TabsList>

              {mainDocs.map(doc => (
                <TabsContent key={doc.id} value={doc.id} className="mt-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <MarkdownContent content={doc.content} />
                  </div>
                </TabsContent>
              ))}

              {isDeveloper && (
                <TabsContent value="diagrams" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    <div className="space-y-1 lg:border-r lg:border-border lg:pr-4">
                      {diagramDocs.map(diagram => (
                        <button
                          key={diagram.id}
                          onClick={() => setSelectedDiagram(diagram.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedDiagram === diagram.id
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          {diagram.label}
                        </button>
                      ))}
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {diagramDocs.find(d => d.id === selectedDiagram) && (
                        <MarkdownContent
                          content={diagramDocs.find(d => d.id === selectedDiagram)?.content || ''}
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Back to Top Button */}
      <Button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg transition-all duration-300 z-50 ${showBackToTop
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        size="icon"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </>
  )
}