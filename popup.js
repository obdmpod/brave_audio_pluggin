document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get(['threshold', 'outputGain'], function(data) {
        document.getElementById('threshold').value = data.threshold !== undefined ? data.threshold : -24;
        document.getElementById('thresholdValue').textContent = data.threshold !== undefined ? data.threshold : -24;

        document.getElementById('outputGain').value = data.outputGain !== undefined ? data.outputGain : 1;
        document.getElementById('outputGainValue').textContent = data.outputGain !== undefined ? data.outputGain : 1;
    });

    document.getElementById('threshold').addEventListener('input', function(event) {
        let thresholdValue = event.target.value;
        document.getElementById('thresholdValue').textContent = thresholdValue;
        chrome.storage.local.set({threshold: parseFloat(thresholdValue)});
    });

    document.getElementById('outputGain').addEventListener('input', function(event) {
        let outputGainValue = event.target.value;
        document.getElementById('outputGainValue').textContent = outputGainValue;
        chrome.storage.local.set({outputGain: parseFloat(outputGainValue)});
    });
});

// Set up the canvas context for the meter
const canvas = document.getElementById('audioMeter');
const ctx = canvas.getContext('2d');

function drawMeter(decibelLevel) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width * (decibelLevel + 100) / 100;
    ctx.fillStyle = '#76FF03';  // Bright green for the meter
    ctx.fillRect(0, 0, barWidth, canvas.height);
}


// Listen for decibel data from content script
chrome.runtime.onMessage.addListener((message) => {
    if (message.decibelLevel !== undefined) {
        console.log("Received decibel level:", message.decibelLevel);  // Add this log
        drawMeter(message.decibelLevel);
    }
});