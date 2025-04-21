setInterval(setClock, 1000)

const hourHand = document.querySelector('[data-hour-hand]')
const minuteHand = document.querySelector('[data-minute-hand]')
const secondHand = document.querySelector('[data-second-hand]')
const timeDisplay = document.getElementById('time-display');
const alarmForm = document.getElementById('alarm-form');
const alarmTimeInput = document.getElementById('alarm-time');
const alarmLabelInput = document.getElementById('alarm-label');
const alarmList = document.getElementById('alarm-list');
const alarmSound = document.getElementById('alarm-sound');

// Store alarms
let alarms = [];
let alarmTimeout;
let isAlarmRinging = false;

// Stopwatch variables
const stopwatchDisplay = document.getElementById('stopwatch-display');
const lapTimesContainer = document.getElementById('lap-times');
const startStopBtn = document.getElementById('start-stop-btn');
const resetLapBtn = document.getElementById('reset-lap-btn');

let stopwatchRunning = false;
let stopwatchInterval;
let stopwatchStartTime = 0;
let stopwatchElapsedTime = 0;
let lapTimes = [];
let lapCounter = 0;

// Tab functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(`${tabId}-tab`).classList.add('active');
    });
});

function setClock() {
    const currentDate = new Date()
    const secondsRatio = currentDate.getSeconds() / 60
    const minutesRatio = (secondsRatio + currentDate.getMinutes()) / 60
    const hoursRatio = (minutesRatio + currentDate.getHours()) / 12

    setRotation(secondHand, secondsRatio)
    setRotation(minuteHand, minutesRatio)
    setRotation(hourHand, hoursRatio)

    // Update digital time display
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    timeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    
    // Check alarms
    checkAlarms(currentDate);
}

function setRotation(element, rotationRatio) {
    element.style.setProperty('--rotation', rotationRatio * 360);
}

// Alarm functionality
alarmForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const timeValue = alarmTimeInput.value;
    if (!timeValue) return;
    
    const [hours, minutes] = timeValue.split(':');
    const label = alarmLabelInput.value || `Alarm ${alarms.length + 1}`;
    
    const alarm = {
        id: Date.now().toString(),
        hours: parseInt(hours),
        minutes: parseInt(minutes),
        seconds: 0,
        label: label
    };
    
    alarms.push(alarm);
    renderAlarms();
    
    // Reset form
    alarmTimeInput.value = '';
    alarmLabelInput.value = '';
});

function renderAlarms() {
    alarmList.innerHTML = '';
    
    alarms.forEach(alarm => {
        const alarmItem = document.createElement('div');
        alarmItem.classList.add('alarm-item');
        
        // Format time
        const hours = String(alarm.hours).padStart(2, '0');
        const minutes = String(alarm.minutes).padStart(2, '0');
        
        alarmItem.innerHTML = `
            <span>${alarm.label}: ${hours}:${minutes}</span>
            <button data-id="${alarm.id}" class="delete-alarm">Delete</button>
        `;
        
        alarmList.appendChild(alarmItem);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-alarm').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteAlarm(id);
        });
    });
    
    // Save to localStorage
    saveAlarms();
}

function deleteAlarm(id) {
    alarms = alarms.filter(alarm => alarm.id !== id);
    renderAlarms();
}

function checkAlarms(currentDate) {
    const currentHours = currentDate.getHours();
    const currentMinutes = currentDate.getMinutes();
    const currentSeconds = currentDate.getSeconds();
    
    alarms.forEach(alarm => {
        if (alarm.hours === currentHours && 
            alarm.minutes === currentMinutes && 
            currentSeconds === 0) {
            triggerAlarm(alarm);
        }
    });
}

function triggerAlarm(alarm) {
    if (isAlarmRinging) return;
    
    isAlarmRinging = true;
    document.querySelector('.clock').classList.add('alarm-active');
    
    // Play alarm sound
    alarmSound.play();
    alarmSound.loop = true;
    
    // Create notification
    const notification = document.createElement('div');
    notification.classList.add('alarm-item', 'alarm-active');
    notification.innerHTML = `
        <span>⏰ ${alarm.label} is ringing!</span>
        <button id="stop-alarm">Stop</button>
    `;
    
    alarmList.prepend(notification);
    
    // Add event listener to stop button
    document.getElementById('stop-alarm').addEventListener('click', stopAlarm);
    
    // Auto-stop after 60 seconds
    alarmTimeout = setTimeout(stopAlarm, 60000);
}

function stopAlarm() {
    if (!isAlarmRinging) return;
    
    clearTimeout(alarmTimeout);
    isAlarmRinging = false;
    document.querySelector('.clock').classList.remove('alarm-active');
    
    // Stop sound
    alarmSound.pause();
    alarmSound.currentTime = 0;
    
    // Remove notification
    const notification = document.querySelector('.alarm-item.alarm-active');
    if (notification) {
        notification.remove();
    }
}

// Save alarms to localStorage
function saveAlarms() {
    localStorage.setItem('clockAlarms', JSON.stringify(alarms));
}

// Load alarms from localStorage
function loadAlarms() {
    const savedAlarms = localStorage.getItem('clockAlarms');
    if (savedAlarms) {
        alarms = JSON.parse(savedAlarms);
        renderAlarms();
    }
}

// Stopwatch functionality
startStopBtn.addEventListener('click', toggleStopwatch);
resetLapBtn.addEventListener('click', resetOrLap);

function toggleStopwatch() {
    if (stopwatchRunning) {
        // Stop the stopwatch
        stopStopwatch();
        startStopBtn.textContent = 'Start';
        startStopBtn.classList.remove('stop');
        startStopBtn.classList.add('start');
        resetLapBtn.textContent = 'Reset';
    } else {
        // Start the stopwatch
        startStopwatch();
        startStopBtn.textContent = 'Stop';
        startStopBtn.classList.remove('start');
        startStopBtn.classList.add('stop');
        resetLapBtn.textContent = 'Lap';
    }
}

function startStopwatch() {
    stopwatchRunning = true;
    
    // If first start or after reset, set the start time
    if (stopwatchElapsedTime === 0) {
        stopwatchStartTime = Date.now();
    } else {
        // If resuming after pause, adjust start time for elapsed time
        stopwatchStartTime = Date.now() - stopwatchElapsedTime;
    }
    
    stopwatchInterval = setInterval(updateStopwatch, 10); // Update every 10ms for better precision
}

function stopStopwatch() {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    // Store elapsed time for resuming later
    stopwatchElapsedTime = Date.now() - stopwatchStartTime;
}

function resetOrLap() {
    if (stopwatchRunning) {
        // Record lap time
        recordLap();
    } else {
        // Reset stopwatch
        resetStopwatch();
    }
}

function updateStopwatch() {
    const currentTime = Date.now();
    stopwatchElapsedTime = currentTime - stopwatchStartTime;
    
    // Convert to hours, minutes, seconds, milliseconds
    const totalMilliseconds = stopwatchElapsedTime;
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);
    const seconds = Math.floor((totalMilliseconds / 1000) % 60);
    const minutes = Math.floor((totalMilliseconds / (1000 * 60)) % 60);
    const hours = Math.floor(totalMilliseconds / (1000 * 60 * 60));
    
    // Format display
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
    stopwatchDisplay.textContent = formattedTime;
}

function resetStopwatch() {
    stopwatchRunning = false;
    clearInterval(stopwatchInterval);
    stopwatchElapsedTime = 0;
    stopwatchDisplay.textContent = '00:00:00.00';
    
    // Clear lap times
    lapTimes = [];
    lapCounter = 0;
    lapTimesContainer.innerHTML = '';
    
    // Reset button text
    resetLapBtn.textContent = 'Reset';
}

function recordLap() {
    lapCounter++;
    
    // Calculate lap time
    const currentTime = Date.now();
    const lapTotalTime = currentTime - stopwatchStartTime;
    
    // For the first lap, previous lap time is 0
    const previousLapTotalTime = lapTimes.length > 0 ? lapTimes[lapTimes.length - 1].totalTime : 0;
    const lapDuration = lapTotalTime - previousLapTotalTime;
    
    // Add to lap times array
    lapTimes.push({
        lapNumber: lapCounter,
        totalTime: lapTotalTime,
        lapTime: lapDuration
    });
    
    // Display lap time
    displayLapTime(lapCounter, lapDuration, lapTotalTime);
}

function displayLapTime(lapNumber, lapTime, totalTime) {
    const lapItem = document.createElement('div');
    lapItem.classList.add('lap-item');
    
    // Format lap time and total time
    const formatTime = (time) => {
        const ms = Math.floor((time % 1000) / 10);
        const sec = Math.floor((time / 1000) % 60);
        const min = Math.floor((time / (1000 * 60)) % 60);
        const hr = Math.floor(time / (1000 * 60 * 60));
        
        return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    };
    
    lapItem.innerHTML = `
        <span>Lap ${lapNumber}</span>
        <span>Lap: ${formatTime(lapTime)}</span>
        <span>Total: ${formatTime(totalTime)}</span>
    `;
    
    // Add to lap times container at the beginning (newest first)
    lapTimesContainer.insertBefore(lapItem, lapTimesContainer.firstChild);
    
    // Save lap times to localStorage
    saveLapTimes();
}

// Save lap times to localStorage
function saveLapTimes() {
    localStorage.setItem('stopwatchLaps', JSON.stringify(lapTimes));
    localStorage.setItem('stopwatchCounter', lapCounter);
    localStorage.setItem('stopwatchElapsed', stopwatchElapsedTime);
    localStorage.setItem('stopwatchRunning', stopwatchRunning);
}

// Load lap times from localStorage
function loadStopwatchData() {
    const savedLapTimes = localStorage.getItem('stopwatchLaps');
    const savedLapCounter = localStorage.getItem('stopwatchCounter');
    const savedElapsedTime = localStorage.getItem('stopwatchElapsed');
    const wasRunning = localStorage.getItem('stopwatchRunning') === 'true';
    
    if (savedLapTimes) {
        lapTimes = JSON.parse(savedLapTimes);
        lapCounter = parseInt(savedLapCounter || '0');
        stopwatchElapsedTime = parseInt(savedElapsedTime || '0');
        
        // Display saved lap times
        lapTimes.forEach(lap => {
            displayLapTime(lap.lapNumber, lap.lapTime, lap.totalTime);
        });
        
        // Update stopwatch display
        if (stopwatchElapsedTime > 0) {
            const ms = Math.floor((stopwatchElapsedTime % 1000) / 10);
            const sec = Math.floor((stopwatchElapsedTime / 1000) % 60);
            const min = Math.floor((stopwatchElapsedTime / (1000 * 60)) % 60);
            const hr = Math.floor(stopwatchElapsedTime / (1000 * 60 * 60));
            
            stopwatchDisplay.textContent = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
        }
        
        // If it was running when page was closed, restart it
        if (wasRunning) {
            startStopBtn.click();
        }
    }
}

// Initialize
setClock();
loadAlarms();
loadStopwatchData();