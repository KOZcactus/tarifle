import Link from "next/link";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";
import type { ComponentProps, ReactNode } from "react";

/**
 * MDX component overrides — `<MDXRemote components={mdxComponents}>`
 * ile inject edilir. Default MDX'te h1/h2/ul/a vs. raw HTML olarak
 * render eder; burada Tarifle design system sınıflarıyla değiştiriyoruz.
 *
 * `prose-blog` utility sınıfı globals.css'te tanımlıdır (typography
 * rhythm, code styling, blockquote vs.). MDX içindeki elementleri de
 * aynı sınıfla sarmalamak yerine per-element override yapıyoruz ki
 * Tailwind 4 @apply desteksizliği sorun olmasın.
 */

type HeadingProps = ComponentProps<"h1"> & { children?: ReactNode };
type ParagraphProps = ComponentProps<"p"> & { children?: ReactNode };
type ListProps = ComponentProps<"ul"> & { children?: ReactNode };
type OrderedListProps = ComponentProps<"ol"> & { children?: ReactNode };
type LinkProps = ComponentProps<"a"> & { children?: ReactNode };

function Heading2({ children, ...props }: HeadingProps) {
  return (
    <h2
      className="mb-3 mt-10 font-heading text-2xl font-bold text-text"
      {...props}
    >
      {children}
    </h2>
  );
}

function Heading3({ children, ...props }: HeadingProps) {
  return (
    <h3
      className="mb-2 mt-8 font-heading text-xl font-semibold text-text"
      {...props}
    >
      {children}
    </h3>
  );
}

function Paragraph({ children, ...props }: ParagraphProps) {
  return (
    <p className="mb-5 text-base leading-relaxed text-text-muted" {...props}>
      {children}
    </p>
  );
}

function UnorderedList({ children, ...props }: ListProps) {
  return (
    <ul
      className="mb-5 ml-6 list-disc space-y-2 text-base leading-relaxed text-text-muted"
      {...props}
    >
      {children}
    </ul>
  );
}

function OrderedList({ children, ...props }: OrderedListProps) {
  return (
    <ol
      className="mb-5 ml-6 list-decimal space-y-2 text-base leading-relaxed text-text-muted"
      {...props}
    >
      {children}
    </ol>
  );
}

function Anchor({ href, children, ...props }: LinkProps) {
  if (!href) return <span>{children}</span>;
  if (href.startsWith("/")) {
    return (
      <Link
        href={href}
        className="text-primary underline-offset-4 transition-colors hover:underline"
      >
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-4 transition-colors hover:underline"
      {...props}
    >
      {children}
    </a>
  );
}

function Strong({ children, ...props }: ParagraphProps) {
  return (
    <strong className="font-semibold text-text" {...props}>
      {children}
    </strong>
  );
}

function Emphasis({ children, ...props }: ParagraphProps) {
  return (
    <em className="italic text-text" {...props}>
      {children}
    </em>
  );
}

function InlineCode({ children, ...props }: ParagraphProps) {
  return (
    <code
      className="rounded bg-bg-card px-1.5 py-0.5 font-mono text-sm text-text"
      {...props}
    >
      {children}
    </code>
  );
}

type BlockquoteProps = ComponentProps<"blockquote"> & { children?: ReactNode };
function Blockquote({ children, ...props }: BlockquoteProps) {
  return (
    <blockquote
      className="mb-5 border-l-4 border-primary bg-primary/5 px-4 py-3 text-base italic leading-relaxed text-text-muted"
      {...props}
    >
      {children}
    </blockquote>
  );
}

function HorizontalRule() {
  return <hr className="my-10 border-border" />;
}

export const mdxComponents: MDXRemoteProps["components"] = {
  h2: Heading2,
  h3: Heading3,
  p: Paragraph,
  ul: UnorderedList,
  ol: OrderedList,
  a: Anchor,
  strong: Strong,
  em: Emphasis,
  code: InlineCode,
  blockquote: Blockquote,
  hr: HorizontalRule,
};
