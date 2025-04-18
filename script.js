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

function setRotation(element, rotationRatio){
    element.style.setProperty('--rotation', rotationRatio * 360)
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

// Initialize
setClock();
loadAlarms();