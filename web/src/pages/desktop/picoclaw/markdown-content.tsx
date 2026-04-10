import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type MarkdownContentProps = {
  content?: string;
  className?: string;
};

export const MarkdownContent = ({ content, className }: MarkdownContentProps) => {
  if (!content) {
    return null;
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="my-2 whitespace-pre-wrap break-words leading-6 first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          a: ({ children, href }) => (
            <a
              className="text-sky-300 underline decoration-sky-400/40 underline-offset-2 hover:text-sky-200"
              href={href}
              rel="noreferrer"
              target="_blank"
            >
              {children}
            </a>
          ),
          ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
          li: ({ children }) => <li className="my-1 break-words leading-6">{children}</li>,
          h1: ({ children }) => (
            <h1 className="mt-3 text-base font-semibold first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-3 text-sm font-semibold first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="mt-2 text-sm font-medium first:mt-0">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-white/15 pl-3 text-neutral-300">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName, ...props }: any) =>
            !String(codeClassName || '').includes('language-') ? (
              <code
                className="rounded bg-black/25 px-1.5 py-0.5 font-mono text-[0.92em]"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-xl bg-black/30 px-3 py-2 text-xs leading-6 text-neutral-100">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-white/10 px-2 py-1 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-white/5 px-2 py-1 align-top">{children}</td>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
