import { Text, Title, TitleOrder } from "@mantine/core";
import { Prism } from "@mantine/prism";
import ReactMarkdown from "react-markdown";
import { HeadingProps } from "react-markdown/lib/ast-to-react";
import remarkGfm from "remark-gfm";

type TextRendererProps = {
  content?: string;
};

function CustomHeading({ level, children, ...props }: HeadingProps) {
  return (
    <Title order={level as TitleOrder} {...props}>
      {children}
    </Title>
  );
}

export function TextRenderer({ content }: TextRendererProps) {
  // Renders markdown & also syntax highlights code for code snippets from ChatGPT / GPT-3
  // Note that this may cause errors for some other responses / non-code things from other models potentially
  // so need to test further
  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline ? (
            <Prism
              // Language type from Prism not accessible here so use any
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              language={(match ? match[1] : "") as any}
              {...props}
              style={{ maxWidth: "100%", minWidth: "100%", overflow: "auto" }}
            >
              {String(children).replace(/\n$/, "")}
            </Prism>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
        h1: CustomHeading,
        h2: CustomHeading,
        h3: CustomHeading,
        h4: CustomHeading,
        h5: CustomHeading,
        h6: CustomHeading,
        p({ children }) {
          return <Text style={{ whiteSpace: "pre-wrap" }}>{children}</Text>;
        },
      }}
    >
      {content || ""}
    </ReactMarkdown>
  );
}
