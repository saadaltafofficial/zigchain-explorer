'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="z-50">
      {/* Combined navigation and hero section with black background and blue gradient edges */}
      <div className="relative overflow-visible" style={{ background: 'linear-gradient(90deg, #131e2c 70%, #3F65C1 100%)' }}>
        {/* Dark noisy overlay with configurable opacity */}
        <div className="noise-overlay" style={{ opacity: '0.25' }}></div>
        {/* Navigation bar */}
        <div className="container mx-auto px-4 py-3 relative z-20">
          {/* Top navigation bar */}
          <div className="flex justify-between items-center">
            <div className="flex items-center bg-transparent">
              <Link href="/" className="flex items-center bg-transparent">
                <div className="bg-transparent">
                  <Image 
                    src="/images/zigchainlogoMainHeader.svg" 
                    alt="ZIGChain Logo" 
                    width={120} 
                    height={40} 
                    className="h-8 w-auto bg-transparent"
                  />
                </div>
                <span className="ml-2 px-2 py-1 text-sm text-white rounded-md">| Testnet</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <nav className="flex space-x-6">
                {!isHomePage && (
                  <Link href="/" className="font-normal hover:text-blue-200 transition-colors" style={{ color: 'white' }}>
                    Home
                  </Link>
                )}
                <Link href="/blocks" className="font-normal hover:text-blue-200 transition-colors" style={{ color: 'white' }}>
                  Blocks
                </Link>
                <Link href="/transactions" className="font-normal hover:text-blue-200 transition-colors" style={{ color: 'white' }}>
                  Transactions
                </Link>
                <Link href="/network" className="font-normal hover:text-blue-200 transition-colors" style={{ color: 'white' }}>
                  Network Stats
                </Link>
              </nav>
            </div>
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="ml-2 p-2 rounded-md text-white hover:text-blue-200 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pb-3 space-y-1">
              {!isHomePage && (
                <Link 
                  href="/" 
                  className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: 'white' }}
                >
                  Home
                </Link>
              )}
              <Link 
                href="/blocks" 
                className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'white' }}
              >
                Blocks
              </Link>
              <Link 
                href="/transactions" 
                className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'white' }}
              >
                Transactions
              </Link>
              <Link 
                href="/network" 
                className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'white' }}
              >
                Network Stats
              </Link>
            </div>
          )}
        </div>
        
        {/* Hero section with search bar */}
        <div className="py-8 sm:py-10 md:py-14 relative overflow-visible">
          {/* Background pattern */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
            <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-purple-400 blur-3xl"></div>
            <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-indigo-400 blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3">Explore ZIGChain</h1>
              <p className="text-blue-100 font-light text-sm sm:text-base md:text-md max-w-2xl mx-auto">Search transactions, blocks, validators</p>
            </div>
            <div className="relative z-30 search-container">
              <Suspense fallback={<div className="h-12 bg-gray-800 rounded-lg animate-pulse"></div>}>
                <SearchBar />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
