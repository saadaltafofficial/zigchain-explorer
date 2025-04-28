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
    <header className="z-50 w-full overflow-x-hidden">
      {/* Combined navigation and hero section with black background and blue gradient edges */}
      <div className="relative w-full" style={{ background: 'linear-gradient(90deg, #131e2c 70%, #3F65C1 100%)' }}>
        {/* Dark noisy overlay with configurable opacity */}
        <div className="noise-overlay" style={{ opacity: '0.25' }}></div>
        {/* Navigation bar */}
        <div className="container mx-auto px-6 py-3 relative z-20">
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
                  <Link 
                    href="/" 
                    className="font-normal hover:text-blue-200 transition-colors relative" 
                    style={{ 
                      color: 'white',
                      position: 'relative',
                      display: 'inline-block',
                      paddingBottom: '2px'
                    }}
                    onMouseEnter={(e) => {
                      const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                      if (underline) {
                        underline.style.width = '100%';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                      if (underline) {
                        underline.style.width = '0%';
                      }
                    }}
                  >
                    <span>Home</span>
                    <span 
                      className="nav-underline"
                      style={{
                        position: 'absolute',
                        bottom: '-2px',
                        left: '0',
                        width: '0%',
                        height: '2px',
                        backgroundColor: '#1DB3B0',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </Link>
                )}
                <Link 
                  href="/blocks" 
                  className="font-normal hover:text-blue-200 transition-colors relative" 
                  style={{ 
                    color: 'white',
                    position: 'relative',
                    display: 'inline-block',
                    paddingBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                    if (underline) {
                      underline.style.width = '100%';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                    if (underline) {
                      underline.style.width = '0%';
                    }
                  }}
                >
                  <span>Blocks</span>
                  <span 
                    className="nav-underline"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      width: '0%',
                      height: '2px',
                      backgroundColor: '#1DB3B0',
                      transition: 'width 0.5s ease-in-out'
                    }}
                  />
                </Link>
                <Link 
                  href="/transactions" 
                  className="font-normal hover:text-blue-200 transition-colors relative" 
                  style={{ 
                    color: 'white',
                    position: 'relative',
                    display: 'inline-block',
                    paddingBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                    if (underline) {
                      underline.style.width = '100%';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                    if (underline) {
                      underline.style.width = '0%';
                    }
                  }}
                >
                  <span>Transactions</span>
                  <span 
                    className="nav-underline"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      width: '0%',
                      height: '2px',
                      backgroundColor: '#1DB3B0',
                      transition: 'width 0.5s ease-in-out'
                    }}
                  />
                </Link>
                <Link 
                  href="/network" 
                  className="font-normal hover:text-blue-200 transition-colors relative" 
                  style={{ 
                    color: 'white',
                    position: 'relative',
                    display: 'inline-block',
                    paddingBottom: '2px'
                  }}
                  onMouseEnter={(e) => {
                    const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                    if (underline) {
                      underline.style.width = '100%';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const underline = e.currentTarget.querySelector('.nav-underline') as HTMLElement;
                    if (underline) {
                      underline.style.width = '0%';
                    }
                  }}
                >
                  <span>Network Stats</span>
                  <span 
                    className="nav-underline"
                    style={{
                      position: 'absolute',
                      bottom: '-2px',
                      left: '0',
                      width: '0%',
                      height: '2px',
                      backgroundColor: '#1DB3B0',
                      transition: 'width 0.5s ease-in-out'
                    }}
                  />
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
                  className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200 relative group"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ color: 'white' }}
                >
                  Home
                  <span className="absolute left-3 bottom-1 h-0.5 w-[calc(100%-24px)] bg-blue-200 transition-all duration-500 ease-in-out origin-left transform scale-x-0 group-hover:scale-x-100"></span>
                </Link>
              )}
              <Link 
                href="/blocks" 
                className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200 relative group"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'white' }}
              >
                Blocks
                <span className="absolute left-3 bottom-1 h-0.5 w-[calc(100%-24px)] bg-blue-200 transition-all duration-500 ease-in-out origin-left transform scale-x-0 group-hover:scale-x-100"></span>
              </Link>
              <Link 
                href="/transactions" 
                className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200 relative group"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'white' }}
              >
                Transactions
                <span className="absolute left-3 bottom-1 h-0.5 w-[calc(100%-24px)] bg-blue-200 transition-all duration-500 ease-in-out origin-left transform scale-x-0 group-hover:scale-x-100"></span>
              </Link>
              <Link 
                href="/network" 
                className="block px-3 py-2 rounded-md text-base font-normal hover:text-blue-200 relative group"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: 'white' }}
              >
                Network Stats
                <span className="absolute left-3 bottom-1 h-0.5 w-[calc(100%-24px)] bg-blue-200 transition-all duration-500 ease-in-out origin-left transform scale-x-0 group-hover:scale-x-100"></span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Hero section with search bar */}
        <div className="py-8 sm:py-10 md:py-14 relative w-full overflow-x-hidden">
          {/* Background pattern - responsive version */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute sm:-top-24 -top-12 sm:-left-24 -left-12 sm:w-96 w-64 sm:h-96 h-64 rounded-full bg-blue-400 blur-3xl"></div>
            <div className="absolute sm:top-10 top-5 sm:right-10 right-5 sm:w-64 w-48 sm:h-64 h-48 rounded-full bg-purple-400 blur-3xl"></div>
            <div className="absolute sm:bottom-10 bottom-5 sm:left-1/3 left-1/4 sm:w-80 w-56 sm:h-80 h-56 rounded-full bg-indigo-400 blur-3xl"></div>
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
