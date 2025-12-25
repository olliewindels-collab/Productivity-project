# Daily Schedule Optimizer

A personal productivity web app that helps you manage your time effectively by generating optimized daily schedules with science-backed focus techniques.

## Features

### Core Features

1. **Priority Management**
   - **Long-term priorities**: Track ongoing goals (e.g., "Learn Spanish", "Exercise regularly")
   - **Today's priorities**: Tasks with deadlines and time estimates
   - Automatic prioritization by deadline urgency

2. **Fixed Obligations**
   - Calendar-style input for commitments that can't be moved
   - Examples: meetings, appointments, family time
   - Automatically integrated into your schedule

3. **Smart Schedule Generation**
   - Uses the **Pomodoro Technique**: 25-minute work blocks with 5-minute breaks
   - Respects **ultradian rhythms**: 15-minute long breaks after every 90 minutes of work
   - Automatically works around your fixed obligations
   - Prioritizes deadline-driven tasks

4. **Time Tracking**
   - Start/stop timer for each scheduled task
   - Tracks actual time vs. estimated time
   - Shows completion summary to improve future estimates
   - Stores task history in localStorage

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework dependencies)
- **Storage**: localStorage (no backend required)
- **Design**: Mobile-first responsive design
- **Performance**: Instant load, no build step

## Project Structure

```
/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── app.js              # UI logic, data management, timers
├── schedule.js         # Schedule generation algorithm
└── README.md           # This file
```

## How to Use

### 1. Getting Started
Simply open `index.html` in any modern web browser. No installation or build process required!

### 2. Add Your Priorities
- **Long-term priorities**: Add ongoing goals you're working toward
- **Today's priorities**: Add tasks with estimated hours and optional deadlines
- **Fixed obligations**: Add commitments with specific start and end times

### 3. Generate Your Schedule
Click the "Generate My Schedule" button. The app will:
- Sort tasks by deadline urgency
- Break work into 25-minute Pomodoro blocks
- Insert 5-minute breaks between blocks
- Add 15-minute breaks after 90 minutes of work
- Work around your fixed obligations

### 4. Track Your Time
- Click "Start" on any task to begin the timer
- Click "Stop" when finished
- View estimated vs. actual time
- Data is saved for future reference

## Science Behind the Schedule

### Pomodoro Technique
Work is divided into 25-minute blocks (called "Pomodoros") with 5-minute breaks in between. This technique:
- Maintains focus and concentration
- Prevents mental fatigue
- Makes large tasks feel manageable
- Provides built-in rest periods

### Ultradian Rhythms
Every 90 minutes, the app schedules a longer 15-minute break. This respects your body's natural ultradian rhythm:
- The human brain naturally cycles every 90-120 minutes
- Taking longer breaks at these intervals prevents burnout
- Helps maintain consistent energy throughout the day

## Data Persistence

All data is automatically saved to localStorage:
- Your priorities and obligations persist between sessions
- Task history is saved for future time estimates
- No account or login required

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Future Enhancements (Stretch Goals)

- Spotify/Apple Music integration for focus playlists
- AI-generated playlist recommendations
- Calendar sync (Google Calendar, Outlook)
- Export schedule to PDF/iCal
- Dark mode
- Task completion analytics
- Weekly/monthly views

## Development

### Making Changes
1. Edit the relevant file:
   - `index.html` - Structure and layout
   - `styles.css` - Styling and design
   - `app.js` - UI interactions and data management
   - `schedule.js` - Schedule generation algorithm

2. Refresh your browser to see changes (no build step!)

### Key Code Locations
- Priority management: `app.js` lines 1-150
- Schedule generation: `schedule.js` lines 1-150
- Timer functionality: `app.js` lines 200-250
- localStorage: `app.js` lines 15-30

## License

Open source - feel free to modify and use as you like!

## Credits

Built with clean, modular code prioritizing user experience and cognitive load reduction.
