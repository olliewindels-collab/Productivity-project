// ===== Data Storage =====
// Store all app data in memory and localStorage
let appData = {
    longTermPriorities: [],
    todayPriorities: [],
    obligations: [],
    generatedSchedule: [],
    taskHistory: [] // Store completed tasks with actual times for future estimates
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    renderAll();
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

    container.innerHTML = appData.longTermPriorities.map(priority => `
        <div class="priority-item">
            <div class="priority-item-content">
                <div class="priority-item-title">${escapeHtml(priority.text)}</div>
            </div>
            <div class="priority-item-actions">
                <button onclick="removeLongTermPriority(${priority.id})" class="btn btn-danger">Remove</button>
            </div>
        </div>
    `).join('');
}

// ===== Today's Priority Functions =====
function addTodayPriority() {
    const taskInput = document.getElementById('todayTaskInput');
    const timeInput = document.getElementById('todayTimeInput');
    const deadlineInput = document.getElementById('todayDeadlineInput');

    const task = taskInput.value.trim();
    const estimatedHours = parseFloat(timeInput.value);
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
        deadline: deadline || null,
        createdAt: new Date().toISOString()
    });

    taskInput.value = '';
    timeInput.value = '';
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
        let metaText = `Estimated: ${priority.estimatedHours}h`;
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
        appData.obligations
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
        const itemClass = isBreak ? 'break' : (isObligation ? 'obligation' : '');

        let timerControls = '';
        if (item.type === 'task') {
            const timerId = `timer-${index}`;
            timerControls = `
                <div class="timer-controls">
                    <div class="timer-display" id="${timerId}-display">00:00:00</div>
                    <button onclick="toggleTimer(${index})" class="btn btn-timer" id="${timerId}-btn">Start</button>
                </div>
            `;
        }

        return `
            <div class="schedule-item ${itemClass}">
                <div class="schedule-time">${item.startTime} - ${item.endTime}</div>
                <div class="schedule-task">
                    <div class="schedule-task-title">${escapeHtml(item.title)}</div>
                    ${item.description ? `<div class="schedule-task-meta">${escapeHtml(item.description)}</div>` : ''}
                </div>
                ${timerControls}
            </div>
        `;
    }).join('');
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
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
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
