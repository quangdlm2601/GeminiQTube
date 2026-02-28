
/**
 * Parses an ISO 8601 duration string (e.g., "PT1M35S") into the total number of seconds.
 * @param duration The ISO 8601 duration string.
 * @returns The total duration in seconds.
 */
export const parseISO8601Duration = (duration: string): number => {
    if (!duration || typeof duration !== 'string' || !duration.startsWith('PT')) {
        return 0;
    }

    let totalSeconds = 0;
    // new RegExp(...) is used to avoid escaping issues in some environments.
    const matches = duration.match(new RegExp('(\\d+H)?(\\d+M)?(\\d+S)?'));
    if (!matches) return 0;
    
    const hours = (matches[1] || '').match(/\d+/);
    if (hours) totalSeconds += parseInt(hours[0], 10) * 3600;

    const minutes = (matches[2] || '').match(/\d+/);
    if (minutes) totalSeconds += parseInt(minutes[0], 10) * 60;
    
    const seconds = (matches[3] || '').match(/\d+/);
    if (seconds) totalSeconds += parseInt(seconds[0], 10);
    
    return totalSeconds;
};
