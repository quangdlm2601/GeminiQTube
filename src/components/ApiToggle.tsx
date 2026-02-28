import React, { useState, useEffect } from 'react';

export const ApiToggle: React.FC = () => {
    const [useApiV2, setUseApiV2] = useState<boolean>(false);

    useEffect(() => {
        // This effect runs only on the client-side after hydration
        const storedSetting = localStorage.getItem('geminiqtube-useApiV2') === 'true';
        setUseApiV2(storedSetting);
    }, []);

    const handleToggle = () => {
        const newSetting = !useApiV2;
        localStorage.setItem('geminiqtube-useApiV2', String(newSetting));
        // Reload the page to ensure the service worker and all components use the new API URL
        window.location.reload();
    };

    return (
        <div className="flex items-center space-x-2 cursor-pointer" onClick={handleToggle} title="Switch API version">
            <span className={`font-semibold text-xs ${useApiV2 ? 'text-green-400' : 'text-blue-400'}`}>
                {useApiV2 ? 'V2' : 'V1'}
            </span>
            <div
                className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors duration-300 ease-in-out ${
                useApiV2 ? 'bg-green-500' : 'bg-youtube-dark-tertiary'
                }`}
            >
                <span
                className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
                    useApiV2 ? 'translate-x-5' : 'translate-x-1'
                }`}
                />
            </div>
        </div>
    );
};
