import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">ZigChain Explorer</h3>
            <p className="text-gray-400">
              A comprehensive blockchain explorer for the ZigChain network.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/blocks" className="text-gray-400 hover:text-white">
                  Blocks
                </Link>
              </li>
              <li>
                <Link href="/transactions" className="text-gray-400 hover:text-white">
                  Transactions
                </Link>
              </li>
              <li>
                <Link href="/validators" className="text-gray-400 hover:text-white">
                  Validators
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.zigchain.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://zigchain.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  ZigChain Website
                </a>
              </li>
              <li>
                <a 
                  href="https://faucet.zigchain.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white"
                >
                  Testnet Faucet
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ZigChain Explorer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
