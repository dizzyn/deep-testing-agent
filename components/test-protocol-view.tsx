"use client";

import { TestViewTemplate } from "./common/test-view-template";

interface TestProtocolData {
  testProtocol: string;
}

export function TestProtocolView({ testProtocol }: TestProtocolData) {
  const content = (
    <pre className="whitespace-pre-wrap text-gray-300 text-xs leading-relaxed">
      {testProtocol}
    </pre>
  );

  return (
    <TestViewTemplate
      title="Test Protocol"
      icon="📋"
      content={content}
      smallFont={true}
    />
  );
}
