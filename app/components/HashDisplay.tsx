'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HashDisplayProps {
  hash: string;
  label?: string;
  truncateLength?: number;
  showCopyButton?: boolean;
  className?: string;
}

export default function HashDisplay({
  hash,
  label,
  truncateLength = 10,
  showCopyButton = true,
  className = '',
}: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!hash) return null;

  // Ensure the hash is properly formatted
  const formattedHash = hash.toLowerCase();
  
  // Determine display format based on truncateLength
  const displayHash = truncateLength > 0 && formattedHash.length > truncateLength * 2
    ? `${formattedHash.substring(0, truncateLength)}...${formattedHash.substring(formattedHash.length - truncateLength)}`
    : formattedHash;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>}
      <div className="flex items-center">
        <span className="text-gray-800 dark:text-white font-mono break-all">{displayHash}</span>
        {showCopyButton && (
          <button
            onClick={handleCopy}
            className="ml-2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
            title="Copy to clipboard"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
