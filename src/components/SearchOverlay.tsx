import React from 'react';
import { SearchBar } from './SearchBar';
import { BackArrowIcon } from './icons/BackArrowIcon';
import { HistoryIcon } from './icons/HistoryIcon';
import { TrashIcon } from './icons/TrashIcon';
import { RemoveIcon } from './icons/RemoveIcon';
import { ApplyToSearchIcon } from './icons/ApplyToSearchIcon';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    searchHistory: string[];
    onClearHistory: () => void;
    onApplyHistoryItem: (query: string) => void;
    searchInputValue: string;
    onSearchInputChange: (value: string) => void;
    onRemoveHistoryItem: (query: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, onSearch, searchHistory, onClearHistory, onApplyHistoryItem, searchInputValue, onSearchInputChange, onRemoveHistoryItem }) => {
    if (!isOpen) {
        return null;
    }

    const handleSearchAndClose = (query: string) => {
        onSearch(query);
    };

    return (
        <div className="fixed inset-0 bg-youtube-dark z-50 animate-fade-in" role="dialog" aria-modal="true">
            <div className="w-full max-w-3xl mx-auto px-4">
                <div className="h-16 flex items-center space-x-4">
                    <button onClick={onClose} className="p-2 text-youtube-text-primary">
                        <BackArrowIcon />
                    </button>
                    <div className="flex-grow">
                        <SearchBar 
                            onSearch={handleSearchAndClose}
                            value={searchInputValue}
                            onChange={onSearchInputChange} 
                        />
                    </div>
                </div>

                <div className="mt-4">
                    {searchHistory.length > 0 && (
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-youtube-text-primary">Recent</h3>
                             <button onClick={onClearHistory} className="text-sm text-blue-400 hover:text-blue-300 flex items-center space-x-1">
                                <TrashIcon />
                                <span>Clear</span>
                             </button>
                        </div>
                    )}
                    <ul className="space-y-2">
                        {searchHistory.map((item, index) => (
                            <li key={index} className="flex items-center justify-between text-youtube-text-primary p-2 rounded-lg hover:bg-youtube-dark-secondary">
                                <button
                                    onClick={() => onSearch(item)}
                                    className="flex items-center flex-grow text-left"
                                >
                                    <HistoryIcon />
                                    <span className="ml-4">{item}</span>
                                </button>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                    <button
                                        onClick={() => onApplyHistoryItem(item)}
                                        className="p-1 rounded-full hover:bg-youtube-dark-tertiary"
                                        aria-label={`Use "${item}" as search term`}
                                        title="Apply to search bar"
                                    >
                                        <ApplyToSearchIcon />
                                    </button>
                                    <button
                                        onClick={() => onRemoveHistoryItem(item)}
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
            </div>
        </div>
    );
};