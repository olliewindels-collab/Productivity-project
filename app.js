// ===== Data Storage =====
// Store all app data in memory and localStorage
let appData = {
    longTermPriorities: [],
    todayPriorities: [],
    obligations: [],
    generatedSchedule: [],
    taskHistory: [], // Store completed tasks with actual times for future estimates
    exertionRatings: [] // Store exertion ratings with timestamps
};

// Track current task being rated
let currentRatingTaskIndex = null;

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderAll();

    // Initialize time-of-day slider
    const timeSlider = document.getElementById('timeOfDaySlider');
    const timeLabel = document.getElementById('timeOfDayLabel');

    timeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const labels = ['Morning', 'Anytime', 'Evening'];
        timeLabel.textContent = `Preferred time: ${labels[value]}`;
    });

    // Initialize exertion slider
    const exertionSlider = document.getElementById('exertionSlider');
    const exertionValue = document.getElementById('exertionValue');

    exertionSlider.addEventListener('input', (e) => {
        exertionValue.textContent = e.target.value;
    });
});

// ===== LocalStorage Functions =====
function saveToStorage() {
    localStorage.setItem('scheduleAppData', JSON.stringify(appData));
}

function loadFromStorage() {
    const saved = localStorage.getItem('scheduleAppData');
    if (saved) {
        appData = JSON.parse(saved);
    }
}

// ===== Long-term Priority Functions =====
function addLongTermPriority() {
    const input = document.getElementById('longTermInput');
    const value = input.value.trim();

    if (!value) {
        alert('Please enter a priority');
        return;
    }

    appData.longTermPriorities.push({
        id: Date.now(),
        text: value,
        createdAt: new Date().toISOString()
    });

    input.value = '';
    saveToStorage();
    renderLongTermPriorities();
}

function removeLongTermPriority(id) {
    appData.longTermPriorities = appData.longTermPriorities.filter(p => p.id !== id);
    saveToStorage();
    renderLongTermPriorities();
}

function renderLongTermPriorities() {
    const container = document.getElementById('longTermList');

    if (appData.longTermPriorities.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding: 12px;">No long-term priorities yet. Add one above!</p>';
        return;
    }

    container.innerHTML = appData.longTermPriorities.map((priority, index) => `
        <div class="priority-item">
            <div class="priority-order">
                <div class="priority-number">#${index + 1}</div>
                <div class="priority-controls">
                    ${index > 0 ? `<button onclick="moveLongTermPriority(${index}, -1)" class="btn-move">▲</button>` : '<span style="height: 18px;"></span>'}
                    ${index < appData.longTermPriorities.length - 1 ? `<button onclick="moveLongTermPriority(${index}, 1)" class="btn-move">▼</button>` : '<span style="height: 18px;"></span>'}
                </div>
            </div>
            <div class="priority-item-content">
                <div class="priority-item-title">${escapeHtml(priority.text)}</div>
            </div>
            <div class="priority-item-actions">
                <button onclick="removeLongTermPriority(${priority.id})" class="btn btn-danger">Remove</button>
            </div>
        </div>
    `).join('');
}

function moveLongTermPriority(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= appData.longTermPriorities.length) return;

    // Swap items
    [appData.longTermPriorities[index], appData.longTermPriorities[newIndex]] =
        [appData.longTermPriorities[newIndex], appData.longTermPriorities[index]];

    saveToStorage();
    renderLongTermPriorities();
}

// ===== Today's Priority Functions =====
function addTodayPriority() {
    const taskInput = document.getElementById('todayTaskInput');
    const timeInput = document.getElementById('todayTimeInput');
    const timeOfDaySlider = document.getElementById('timeOfDaySlider');
    const deadlineInput = document.getElementById('todayDeadlineInput');

    const task = taskInput.value.trim();
    const estimatedHours = parseFloat(timeInput.value);
    const timeOfDay = parseInt(timeOfDaySlider.value); // 0=Morning, 1=Anytime, 2=Evening
    const deadline = deadlineInput.value;

    if (!task) {
        alert('Please enter a task name');
        return;
    }

    if (!estimatedHours || estimatedHours <= 0) {
        alert('Please enter a valid time estimate');
        return;
    }

    appData.todayPriorities.push({
        id: Date.now(),
        task: task,
        estimatedHours: estimatedHours,
        timeOfDay: timeOfDay,
        deadline: deadline || null,
        createdAt: new Date().toISOString()
    });

    taskInput.value = '';
    timeInput.value = '';
    timeOfDaySlider.value = 1; // Reset to "Anytime"
    document.getElementById('timeOfDayLabel').textContent = 'Preferred time: Anytime';
    deadlineInput.value = '';
    saveToStorage();
    renderTodayPriorities();
}

function removeTodayPriority(id) {
    appData.todayPriorities = appData.todayPriorities.filter(p => p.id !== id);
    saveToStorage();
    renderTodayPriorities();
}

function renderTodayPriorities() {
    const container = document.getElementById('todayPriorityList');

    if (appData.todayPriorities.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding: 12px;">No priorities for today. Add one above!</p>';
        return;
    }

    container.innerHTML = appData.todayPriorities.map(priority => {
        const timeLabels = ['Morning', 'Anytime', 'Evening'];
        const timeOfDay = priority.timeOfDay !== undefined ? timeLabels[priority.timeOfDay] : 'Anytime';

        let metaText = `Estimated: ${priority.estimatedHours}h | Preferred: ${timeOfDay}`;
        if (priority.deadline) {
            const deadlineDate = new Date(priority.deadline);
            metaText += ` | Due: ${deadlineDate.toLocaleString()}`;
        }

        return `
            <div class="priority-item">
                <div class="priority-item-content">
                    <div class="priority-item-title">${escapeHtml(priority.task)}</div>
                    <div class="priority-item-meta">${metaText}</div>
                </div>
                <div class="priority-item-actions">
                    <button onclick="removeTodayPriority(${priority.id})" class="btn btn-danger">Remove</button>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Obligation Functions =====
function addObligation() {
    const nameInput = document.getElementById('obligationInput');
    const startInput = document.getElementById('obligationStartTime');
    const endInput = document.getElementById('obligationEndTime');

    const name = nameInput.value.trim();
    const startTime = startInput.value;
    const endTime = endInput.value;

    if (!name || !startTime || !endTime) {
        alert('Please fill in all obligation fields');
        return;
    }

    if (startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }

    appData.obligations.push({
        id: Date.now(),
        name: name,
        startTime: startTime,
        endTime: endTime,
        createdAt: new Date().toISOString()
    });

    nameInput.value = '';
    startInput.value = '';
    endInput.value = '';
    saveToStorage();
    renderObligations();
}

function removeObligation(id) {
    appData.obligations = appData.obligations.filter(o => o.id !== id);
    saveToStorage();
    renderObligations();
}

function renderObligations() {
    const container = document.getElementById('obligationsList');

    if (appData.obligations.length === 0) {
        container.innerHTML = '<p class="text-muted" style="padding: 12px;">No fixed obligations. Add one above!</p>';
        return;
    }

    container.innerHTML = appData.obligations.map(obligation => `
        <div class="obligation-item">
            <div class="priority-item-content">
                <div class="priority-item-title">${escapeHtml(obligation.name)}</div>
                <div class="priority-item-meta">${formatTime(obligation.startTime)} - ${formatTime(obligation.endTime)}</div>
            </div>
            <div class="priority-item-actions">
                <button onclick="removeObligation(${obligation.id})" class="btn btn-danger">Remove</button>
            </div>
        </div>
    `).join('');
}

// ===== Schedule Generation =====
function generateSchedule() {
    if (appData.todayPriorities.length === 0) {
        alert('Please add at least one task to your priorities!');
        return;
    }

    // Call the schedule generation algorithm from schedule.js
    appData.generatedSchedule = createOptimizedSchedule(
        appData.todayPriorities,
        appData.obligations,
        appData.longTermPriorities,
        appData.exertionRatings
    );

    saveToStorage();

    // Show schedule section, hide input section
    document.getElementById('scheduleSection').style.display = 'block';
    renderSchedule();

    // Scroll to schedule
    document.getElementById('scheduleSection').scrollIntoView({ behavior: 'smooth' });
}

function clearSchedule() {
    document.getElementById('scheduleSection').style.display = 'none';
    appData.generatedSchedule = [];
    saveToStorage();
}

function renderSchedule() {
    const container = document.getElementById('scheduleOutput');

    if (appData.generatedSchedule.length === 0) {
        container.innerHTML = '<p class="text-muted">No schedule generated yet.</p>';
        return;
    }

    container.innerHTML = appData.generatedSchedule.map((item, index) => {
        const isBreak = item.type === 'break';
        const isObligation = item.type === 'obligation';

        let timerControls = '';
        if (item.type === 'task' || item.type === 'break') {
            const timerId = `timer-${index}`;
            timerControls = `
                <div class="timer-controls">
                    <div class="timer-display" id="${timerId}-display">00:00</div>
                    <button onclick="toggleTimer(${index})" class="btn btn-timer" id="${timerId}-btn">Start</button>
                </div>
            `;
        }

        // Checklist format - no specific times
        let borderClass = '';
        if (isBreak) borderClass = 'break';
        else if (isObligation) borderClass = 'obligation';

        return `
            <div class="checklist-item schedule-item ${borderClass}">
                <div class="checklist-checkbox" onclick="toggleCheckbox(this)"></div>
                <div class="checklist-content">
                    <div class="checklist-title">${escapeHtml(item.title)}</div>
                    <div class="checklist-meta">
                        ${item.description ? escapeHtml(item.description) : ''}
                        ${item.durationMinutes ? ` • ${item.durationMinutes} min` : ''}
                    </div>
                </div>
                ${timerControls}
            </div>
        `;
    }).join('');
}

function toggleCheckbox(checkbox) {
    const wasChecked = checkbox.classList.contains('checked');
    checkbox.classList.toggle('checked');

    // Add checkmark when checked
    if (checkbox.classList.contains('checked')) {
        checkbox.innerHTML = '✓';

        // Get the task index from the parent element
        const checklistItem = checkbox.closest('.checklist-item');
        const allItems = Array.from(document.querySelectorAll('.checklist-item'));
        const taskIndex = allItems.indexOf(checklistItem);

        // Only show rating modal for actual tasks (not breaks or obligations)
        const item = appData.generatedSchedule[taskIndex];
        if (item && item.type === 'task' && !wasChecked) {
            showRatingModal(taskIndex, item.title);
        }
    } else {
        checkbox.innerHTML = '';
    }
}

// ===== Timer Functions =====
let activeTimers = {}; // Store active timer intervals

function toggleTimer(index) {
    const timerId = `timer-${index}`;
    const btn = document.getElementById(`${timerId}-btn`);
    const display = document.getElementById(`${timerId}-display`);

    // If timer is running, stop it
    if (activeTimers[timerId]) {
        clearInterval(activeTimers[timerId].interval);

        // Calculate actual time spent
        const elapsedSeconds = activeTimers[timerId].elapsed;
        const actualHours = (elapsedSeconds / 3600).toFixed(2);
        const item = appData.generatedSchedule[index];

        // Save to history for future estimates
        appData.taskHistory.push({
            task: item.title,
            estimatedMinutes: item.durationMinutes,
            actualMinutes: Math.round(elapsedSeconds / 60),
            completedAt: new Date().toISOString()
        });
        saveToStorage();

        // Show completion message
        const estimatedMin = item.durationMinutes;
        const actualMin = Math.round(elapsedSeconds / 60);
        alert(`Task completed!\nEstimated: ${estimatedMin} min\nActual: ${actualMin} min\nDifference: ${actualMin - estimatedMin > 0 ? '+' : ''}${actualMin - estimatedMin} min`);

        delete activeTimers[timerId];
        btn.textContent = 'Start';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-timer');
        display.textContent = '00:00:00';
    } else {
        // Start timer
        const startTime = Date.now();
        activeTimers[timerId] = {
            startTime: startTime,
            elapsed: 0,
            interval: setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                activeTimers[timerId].elapsed = elapsed;
                display.textContent = formatElapsedTime(elapsed);
            }, 1000)
        };

        btn.textContent = 'Stop';
        btn.classList.remove('btn-timer');
        btn.classList.add('btn-danger');
    }
}

// ===== Utility Functions =====
function formatElapsedTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${pad(minutes)}:${pad(secs)}`;
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

function formatTime(timeString) {
    // Convert 24h time to 12h format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : (hour > 12 ? hour - 12 : hour);
    return `${displayHour}:${minutes} ${ampm}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderAll() {
    renderLongTermPriorities();
    renderTodayPriorities();
    renderObligations();
    if (appData.generatedSchedule.length > 0) {
        document.getElementById('scheduleSection').style.display = 'block';
        renderSchedule();
    }
}

// ===== Exertion Rating Functions =====
function showRatingModal(taskIndex, taskName) {
    currentRatingTaskIndex = taskIndex;

    // Update modal content
    document.getElementById('ratingTaskName').textContent = `"${taskName}"`;

    // Reset slider to middle value
    document.getElementById('exertionSlider').value = 5;
    document.getElementById('exertionValue').textContent = '5';

    // Show modal with animation
    const overlay = document.getElementById('ratingOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('show'), 10);
}

function hideRatingModal() {
    const overlay = document.getElementById('ratingOverlay');
    overlay.classList.remove('show');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    currentRatingTaskIndex = null;
}

function submitRating() {
    if (currentRatingTaskIndex === null) return;

    const exertion = parseInt(document.getElementById('exertionSlider').value);
    const item = appData.generatedSchedule[currentRatingTaskIndex];

    // Store rating
    const rating = {
        taskName: item.title,
        exertion: exertion,
        timestamp: new Date().toISOString(),
        taskIndex: currentRatingTaskIndex
    };

    appData.exertionRatings.push(rating);
    saveToStorage();

    hideRatingModal();

    // Check for consecutive high exertion
    checkConsecutiveHighExertion();
}

function skipRating() {
    hideRatingModal();
}

function checkConsecutiveHighExertion() {
    // Get last 3 ratings
    const recentRatings = appData.exertionRatings.slice(-3);

    // Check if we have at least 3 ratings
    if (recentRatings.length < 3) return;

    // Check if all 3 are >= 7
    const allHigh = recentRatings.every(r => r.exertion >= 7);

    if (allHigh) {
        // Show break prompt after a short delay
        setTimeout(() => {
            showBreakPrompt();
        }, 500);
    }
}

function showBreakPrompt() {
    // Create a temporary notification
    const scheduleOutput = document.getElementById('scheduleOutput');
    const prompt = document.createElement('div');
    prompt.className = 'break-prompt';
    prompt.innerHTML = `
        <div class="break-prompt-icon">⚠️</div>
        <div class="break-prompt-content">
            <div class="break-prompt-title">You've been working hard!</div>
            <div class="break-prompt-message">You've completed 3 consecutive high-effort tasks. Consider taking a longer break to recharge.</div>
        </div>
    `;

    // Insert at the top of the schedule
    scheduleOutput.insertBefore(prompt, scheduleOutput.firstChild);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        prompt.style.opacity = '0';
        prompt.style.transition = 'opacity 0.5s';
        setTimeout(() => prompt.remove(), 500);
    }, 8000);
}

function getAverageRecentExertion(count = 3) {
    if (appData.exertionRatings.length === 0) return 0;

    const recentRatings = appData.exertionRatings.slice(-count);
    const sum = recentRatings.reduce((acc, r) => acc + r.exertion, 0);
    return sum / recentRatings.length;
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target.id === 'longTermInput') {
        addLongTermPriority();
    }
    if (e.key === 'Enter' && e.target.id === 'todayTaskInput') {
        addTodayPriority();
    }
    if (e.key === 'Enter' && e.target.id === 'obligationInput') {
        addObligation();
    }
});
