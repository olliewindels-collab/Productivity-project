/**
 * Schedule Generation Algorithm
 *
 * This file contains the core algorithm for generating an optimized daily schedule.
 * It uses the Pomodoro Technique (25-min work blocks with 5-min breaks) and
 * respects ultradian rhythms (longer breaks every 90 minutes).
 */

// ===== Constants =====
const WORK_BLOCK_MINUTES = 25;      // Pomodoro work duration
const SHORT_BREAK_MINUTES = 5;      // Pomodoro short break
const LONG_BREAK_MINUTES = 15;      // Break after 90 minutes of work
const ULTRADIAN_CYCLE_MINUTES = 90; // Time before long break
const START_HOUR = 9;               // Default schedule start time (9 AM)

/**
 * Main function to create an optimized schedule
 * @param {Array} priorities - Today's priority tasks with estimates
 * @param {Array} obligations - Fixed time blocks that cannot be moved
 * @param {Array} longTermPriorities - Ordered list of long-term priorities (higher order = more important)
 * @returns {Array} - Scheduled items with start/end times
 */
function createOptimizedSchedule(priorities, obligations, longTermPriorities = []) {
    const schedule = [];

    // Start at 9 AM today
    let currentTime = getTodayAt(START_HOUR, 0);
    let workTimeSinceLastLongBreak = 0; // Track time for ultradian rhythm

    // Sort obligations by start time
    const sortedObligations = [...obligations].sort((a, b) => {
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    // Sort priorities with multiple criteria:
    // 1. Deadline urgency (tasks with imminent deadlines first)
    // 2. Long-term priority alignment (tasks matching higher-priority long-term goals come first)
    // 3. Time of day preference (for better scheduling later)
    const sortedPriorities = [...priorities].sort((a, b) => {
        // First, prioritize by deadline
        if (a.deadline && b.deadline) {
            const timeDiff = new Date(a.deadline) - new Date(b.deadline);
            if (timeDiff !== 0) return timeDiff;
        }
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;

        // Second, check long-term priority alignment
        // Tasks that match higher-priority long-term goals get scheduled earlier
        const aLongTermIndex = findLongTermPriorityMatch(a.task, longTermPriorities);
        const bLongTermIndex = findLongTermPriorityMatch(b.task, longTermPriorities);

        if (aLongTermIndex !== -1 && bLongTermIndex !== -1) {
            // Both match long-term priorities - lower index (higher priority) comes first
            return aLongTermIndex - bLongTermIndex;
        }
        if (aLongTermIndex !== -1) return -1; // a matches, b doesn't
        if (bLongTermIndex !== -1) return 1;  // b matches, a doesn't

        return 0; // Equal priority
    });

    // Track which obligations we've added
    let obligationIndex = 0;

    // Process each priority task
    for (const priority of sortedPriorities) {
        const totalMinutesNeeded = Math.ceil(priority.estimatedHours * 60);
        let minutesScheduled = 0;

        // Schedule this task in Pomodoro blocks until complete
        while (minutesScheduled < totalMinutesNeeded) {
            // Check if we need to insert any obligations before continuing
            while (obligationIndex < sortedObligations.length) {
                const obligation = sortedObligations[obligationIndex];
                const obligationStart = getTodayWithTime(obligation.startTime);

                // If obligation starts before our current time, skip it (already passed)
                if (obligationStart < currentTime) {
                    obligationIndex++;
                    continue;
                }

                // If obligation is coming up, insert it
                if (obligationStart <= currentTime ||
                    (obligationStart - currentTime) < (WORK_BLOCK_MINUTES * 60 * 1000)) {

                    // Add the obligation block
                    const obligationEnd = getTodayWithTime(obligation.endTime);
                    schedule.push({
                        type: 'obligation',
                        title: obligation.name,
                        description: 'Fixed commitment',
                        startTime: formatTimeFromDate(obligationStart),
                        endTime: formatTimeFromDate(obligationEnd),
                        durationMinutes: (obligationEnd - obligationStart) / (60 * 1000)
                    });

                    // Move current time to after the obligation
                    currentTime = new Date(obligationEnd.getTime() + (5 * 60 * 1000)); // 5 min buffer
                    workTimeSinceLastLongBreak = 0; // Reset work timer after obligation
                    obligationIndex++;
                } else {
                    break; // This obligation is far enough away, continue with tasks
                }
            }

            // Calculate work block duration (either WORK_BLOCK_MINUTES or remaining time)
            const remainingMinutes = totalMinutesNeeded - minutesScheduled;
            const blockDuration = Math.min(WORK_BLOCK_MINUTES, remainingMinutes);

            // Add work block
            const blockStart = new Date(currentTime);
            const blockEnd = new Date(currentTime.getTime() + (blockDuration * 60 * 1000));

            schedule.push({
                type: 'task',
                title: priority.task,
                description: `Part of ${priority.estimatedHours}h task`,
                startTime: formatTimeFromDate(blockStart),
                endTime: formatTimeFromDate(blockEnd),
                durationMinutes: blockDuration,
                priorityId: priority.id
            });

            minutesScheduled += blockDuration;
            currentTime = blockEnd;
            workTimeSinceLastLongBreak += blockDuration;

            // Determine break type and duration
            if (minutesScheduled < totalMinutesNeeded) { // Only add break if more work remains
                let breakDuration;
                let breakType;

                // Check if we've hit 90 minutes of work (ultradian rhythm)
                if (workTimeSinceLastLongBreak >= ULTRADIAN_CYCLE_MINUTES) {
                    breakDuration = LONG_BREAK_MINUTES;
                    breakType = 'Long break (90-min cycle complete)';
                    workTimeSinceLastLongBreak = 0;
                } else {
                    breakDuration = SHORT_BREAK_MINUTES;
                    breakType = 'Pomodoro break';
                }

                const breakStart = new Date(currentTime);
                const breakEnd = new Date(currentTime.getTime() + (breakDuration * 60 * 1000));

                schedule.push({
                    type: 'break',
                    title: `Break (${breakDuration} min)`,
                    description: breakType,
                    startTime: formatTimeFromDate(breakStart),
                    endTime: formatTimeFromDate(breakEnd),
                    durationMinutes: breakDuration
                });

                currentTime = breakEnd;
            }
        }
    }

    // Add any remaining obligations at the end
    while (obligationIndex < sortedObligations.length) {
        const obligation = sortedObligations[obligationIndex];
        const obligationStart = getTodayWithTime(obligation.startTime);
        const obligationEnd = getTodayWithTime(obligation.endTime);

        schedule.push({
            type: 'obligation',
            title: obligation.name,
            description: 'Fixed commitment',
            startTime: formatTimeFromDate(obligationStart),
            endTime: formatTimeFromDate(obligationEnd),
            durationMinutes: (obligationEnd - obligationStart) / (60 * 1000)
        });

        obligationIndex++;
    }

    return schedule;
}

// ===== Helper Functions =====

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Get a Date object for today at specific hour and minute
 */
function getTodayAt(hours, minutes) {
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Get a Date object for today with a specific time string (HH:MM)
 */
function getTodayWithTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return getTodayAt(hours, minutes);
}

/**
 * Format a Date object to time string (HH:MM AM/PM)
 */
function formatTimeFromDate(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Add minutes to a Date object
 */
function addMinutes(date, minutes) {
    return new Date(date.getTime() + (minutes * 60 * 1000));
}

/**
 * Find if a task matches any long-term priority
 * Returns the index of the matching long-term priority (lower = higher priority)
 * Returns -1 if no match found
 */
function findLongTermPriorityMatch(taskName, longTermPriorities) {
    if (!longTermPriorities || longTermPriorities.length === 0) return -1;

    const taskLower = taskName.toLowerCase();

    for (let i = 0; i < longTermPriorities.length; i++) {
        const priorityLower = longTermPriorities[i].text.toLowerCase();

        // Check for keyword matches (split by common separators)
        const priorityWords = priorityLower.split(/[\s,]+/).filter(w => w.length > 3);
        const taskWords = taskLower.split(/[\s,]+/);

        // If any significant word from the priority appears in the task, consider it a match
        for (const word of priorityWords) {
            if (taskWords.some(tw => tw.includes(word) || word.includes(tw))) {
                return i; // Return the index (position in priority list)
            }
        }
    }

    return -1; // No match
}
