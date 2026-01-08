interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  const renderMarkdown = (text: string): string => {
    return (
      text
        // Headers
        .replace(
          /^### (.*$)/gm,
          '<h3 class="font-medium text-white mt-2 mb-1">$1</h3>'
        )
        .replace(
          /^## (.*$)/gm,
          '<h2 class="font-medium text-white mt-3 mb-1">$1</h2>'
        )
        .replace(
          /^# (.*$)/gm,
          '<h1 class="font-semibold text-white mt-3 mb-2">$1</h1>'
        )

        // Bold and italic
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-medium text-white">$1</strong>'
        )
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')

        // Code
        .replace(
          /`(.*?)`/g,
          '<code class="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>'
        )

        // Checkboxes
        .replace(
          /- \[x\]/g,
          '<div class="flex items-center gap-2 my-1"><span class="text-green-400 text-sm">✓</span>'
        )
        .replace(
          /- \[ \]/g,
          '<div class="flex items-center gap-2 my-1"><span class="text-gray-500 text-sm">☐</span>'
        )
        .replace(/\[x\]/g, '<span class="text-green-400">✓</span>')
        .replace(/\[ \]/g, '<span class="text-gray-500">☐</span>')

        // Lists
        .replace(/^- (.+)$/gm, '<div class="ml-4 my-1">• $1</div>')
        .replace(/^\d+\. (.+)$/gm, '<div class="ml-4 my-1">$1</div>')

        // Links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
        )

        // Line breaks
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>")

        // Close checkbox divs
        .replace(
          /(<div class="flex items-center gap-2 my-1"><span class="text-[^"]+">.)([^<]+)/g,
          "$1$2</div>"
        )
    );
  };

  return (
    <div
      className={`prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
}
