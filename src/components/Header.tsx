

import React, { useState, useRef, useEffect } from 'react';
import { UserIcon } from './icons/UserIcon';
import GeminiQTube from "../assets/logo.png";
import { UserMenu } from './UserMenu';
import { SearchIcon } from './icons/SearchIcon';
import { SearchBar } from './SearchBar';

interface HeaderProps {
  onSearch: (query: string) => void;
  onSearchClick: () => void;
  onLogoClick: () => void;
  searchInputValue: string;
  onSearchInputChange: (value: string) => void;
  searchHistory: string[];
  onClearHistory: () => void;
  onRemoveHistoryItem: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onSearch, 
    onSearchClick, 
    onLogoClick, 
    searchInputValue, 
    onSearchInputChange,
    searchHistory,
    onClearHistory,
    onRemoveHistoryItem
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 bg-youtube-dark z-50 flex items-center justify-between px-4 py-2 h-16 border-b border-youtube-dark-tertiary">
      {/* Left Side */}
      <div className="flex items-center space-x-4">
        <button onClick={onLogoClick} className="flex items-center space-x-2 focus:outline-none">
          <img src={GeminiQTube} alt="GeminiQTube" className="h-8 w-auto" />
          <span className="text-xl sm:text-2xl font-bold">GeminiQTube</span>
        </button>
      </div>
      
      {/* Center: Desktop Search Bar */}
      <div className="hidden lg:flex flex-1 justify-center px-4">
        <div className="w-full max-w-2xl">
          <SearchBar 
            onSearch={onSearch}
            value={searchInputValue}
            onChange={onSearchInputChange}
            showHistoryDropdown={true}
            searchHistory={searchHistory}
            onClearHistory={onClearHistory}
            onRemoveHistoryItem={onRemoveHistoryItem}
          />
        </div>
      </div>

      {/* Right Side: Icons */}
      <div className="flex items-center space-x-2">
        {/* Mobile Search Icon */}
        <button onClick={onSearchClick} className="lg:hidden p-2 rounded-full hover:bg-youtube-dark-secondary">
          <SearchIcon />
        </button>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 rounded-full hover:bg-youtube-dark-secondary">
            <UserIcon />
          </button>
          <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
        </div>
      </div>
    </header>
  );
};