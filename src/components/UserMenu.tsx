import React, { useState, useEffect } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { StarIcon } from './icons/StarIcon';

interface UserMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ isOpen, onClose }) => {
    const [useApiV2, setUseApiV2] = useState(true);

    useEffect(() => {
        const storedSetting = localStorage.getItem('geminiqtube-useApiV2') !== 'false';
        setUseApiV2(storedSetting);
    }, [isOpen]);

    const handleVersionChange = (version: 'v1' | 'v2') => {
        const newSetting = version === 'v2';
        localStorage.setItem('geminiqtube-useApiV2', String(newSetting));
        window.location.reload();
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="absolute top-full right-0 mt-2 w-72 bg-youtube-dark-secondary rounded-xl shadow-lg border border-youtube-dark-tertiary z-50 text-sm">
            <div className="p-2">
                <p className="px-3 py-2 text-xs text-youtube-text-secondary">API Settings</p>
                
                <MenuItem
                    label="V2 - Innertube API"
                    description="Recommended. No API key needed."
                    isActive={useApiV2}
                    onClick={() => handleVersionChange('v2')}
                    isRecommended={true}
                />
                
                <MenuItem
                    label="V1 - Official API"
                    description="Uses YouTube Data API v3 key."
                    isActive={!useApiV2}
                    onClick={() => handleVersionChange('v1')}
                />
            </div>
        </div>
    );
};

interface MenuItemProps {
    label: string;
    description: string;
    isActive: boolean;
    onClick: () => void;
    isRecommended?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ label, description, isActive, onClick, isRecommended }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-youtube-dark-tertiary"
    >
        <div className="flex-grow">
             <div className="flex items-center space-x-1.5">
                <p className="font-semibold text-youtube-text-primary">{label}</p>
                {isRecommended && <StarIcon />}
            </div>
            <p className="text-xs text-youtube-text-secondary">{description}</p>
        </div>
        {isActive && <CheckIcon />}
    </button>
);