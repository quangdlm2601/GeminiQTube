import React, { useEffect, useRef, useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { RemoveIcon } from './icons/RemoveIcon';
import { ApplyToSearchIcon } from './icons/ApplyToSearchIcon';


interface SearchBarProps {
  onSearch: (query: string) => void;
  value: string;
  onChange: (value: string) => void;
  showHistoryDropdown?: boolean;
  searchHistory?: string[];
  onClearHistory?: () => void;
  onRemoveHistoryItem?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
    onSearch, 
    value, 
    onChange, 
    showHistoryDropdown = false, 
    searchHistory = [],
    onClearHistory,
    onRemoveHistoryItem
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsHistoryVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setIsHistoryVisible(false);
      inputRef.current?.blur();
    }
  };

  const handleHistorySelect = (historyQuery: string) => {
    onChange(historyQuery);
    onSearch(historyQuery);
    setIsHistoryVisible(false);
    inputRef.current?.blur();
  };
  
  const handleApplyText = (e: React.MouseEvent, historyQuery: string) => {
      e.preventDefault();
      e.stopPropagation();
      onChange(historyQuery);
      inputRef.current?.focus();
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClearHistory?.();
  }

  const showDropdown = showHistoryDropdown && isHistoryVisible && searchHistory.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <form onSubmit={handleSubmit} className="flex w-full">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsHistoryVisible(true)}
          placeholder="Search"
          className="w-full bg-youtube-dark-secondary border border-youtube-dark-tertiary rounded-l-full px-4 py-2 focus:outline-none focus:border-blue-500 text-youtube-text-primary"
        />
        <button type="submit" className="bg-youtube-dark-tertiary px-5 py-2 rounded-r-full hover:bg-youtube-dark-tertiary/80">
          <SearchIcon />
        </button>
      </form>
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-youtube-dark-secondary rounded-xl shadow-lg border border-youtube-dark-tertiary z-50 py-2">
            <div className="flex justify-between items-center px-4 pb-2">
                 <h3 className="text-base font-semibold text-youtube-text-primary">Recent</h3>
                 <button onClick={handleClearHistory} className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                    <TrashIcon />
                    <span>Clear</span>
                 </button>
            </div>
            <ul className="space-y-1">
                {searchHistory.map((item, index) => (
                    <li key={index} className="flex items-center justify-between px-4 py-2 hover:bg-youtube-dark-tertiary">
                        <button
                            onMouseDown={() => handleHistorySelect(item)}
                            className="flex items-center flex-grow text-left"
                        >
                            <HistoryIcon />
                            <span className="ml-4 text-youtube-text-primary">{item}</span>
                        </button>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                                onMouseDown={(e) => handleApplyText(e, item)}
                                className="p-1 rounded-full hover:bg-youtube-dark-tertiary"
                                aria-label={`Use "${item}" as search term`}
                                title="Apply to search bar"
                            >
                                <ApplyToSearchIcon />
                            </button>
                            <button
                                onMouseDown={(e) => {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    onRemoveHistoryItem?.(item);
                                }}
                                className="p-1 rounded-full hover:bg-youtube-dark-tertiary"
                                aria-label={`Remove "${item}" from history`}
                            >
                                <RemoveIcon />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};