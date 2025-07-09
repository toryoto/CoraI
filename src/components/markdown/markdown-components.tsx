import React from 'react'
import { Components } from 'react-markdown'

export const markdownComponents: Components = {
  // コードブロックのスタイリング
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '')
    const isInline = !match
    return !isInline ? (
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    )
  },

  // リンクのスタイリング
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // 見出しのスタイリング
  h1: ({ children, ...props }) => (
    <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h1>
  ),

  h2: ({ children, ...props }) => (
    <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h2>
  ),

  h3: ({ children, ...props }) => (
    <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </h3>
  ),

  // リストのスタイリング
  ul: ({ children, ...props }) => (
    <ul className="list-disc list-inside space-y-1 my-4" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }) => (
    <ol className="list-decimal list-inside space-y-1 my-4" {...props}>
      {children}
    </ol>
  ),

  // 引用のスタイリング
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // テーブルのスタイリング
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border border-gray-300 dark:border-gray-600" {...props}>
        {children}
      </table>
    </div>
  ),

  th: ({ children, ...props }) => (
    <th
      className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }) => (
    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>
      {children}
    </td>
  ),
}
