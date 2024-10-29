const context = new (window.AudioContext || window.webkitAudioContext)();
const limiter = context.createDynamicsCompressor();
const analyser = context.createAnalyser();
analyser.fftSize = 256;
analyser.smoothingTimeConstant = 0.85;

// Default settings for limiter
limiter.threshold.setValueAtTime(-24, context.currentTime); // Threshold default
limiter.knee.setValueAtTime(0, context.currentTime);        // Hard knee
limiter.ratio.setValueAtTime(20, context.currentTime);      // High ratio for limiting
limiter.attack.setValueAtTime(0.003, context.currentTime);  // Fast attack
limiter.release.setValueAtTime(0.25, context.currentTime);  // Quick release

const gainNode = context.createGain();
gainNode.gain.setValueAtTime(1, context.currentTime); // Default output gain

// Connect analyser to monitor audio level for the meter
function applyLimiterAndAnalyser(mediaElement) {
    const source = context.createMediaElementSource(mediaElement);
    source.connect(limiter);
    limiter.connect(gainNode);
    gainNode.connect(analyser);  // Connect to analyser before final output
    gainNode.connect(context.destination);
    sendAudioData();
}

// Function to send decibel data to popup
function sendAudioData() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const avgAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const dBLevel = Math.max(-100, 20 * Math.log10(avgAmplitude / 255));

    chrome.runtime.sendMessage({ decibelLevel: dBLevel });

    requestAnimationFrame(sendAudioData);
}

sendAudioData();  // Start sending data after setup

// Apply limiter and analyser to any existing audio/video elements on page load
document.querySelectorAll('video, audio').forEach(applyLimiterAndAnalyser);

// Observe for new audio/video elements
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                    applyLimiterAndAnalyser(node);
                }
            });
        }
    }
});
observer.observe(document.body, { childList: true, subtree: true });

// Listener for messages from popup to update limiter settings
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'updateThreshold') {
        limiter.threshold.setValueAtTime(message.value, context.currentTime);
    } else if (message.type === 'updateGain') {
        gainNode.gain.setValueAtTime(message.value, context.currentTime);
    }
});

// Set initial values from storage
chrome.storage.local.get(['threshold', 'outputGain'], (data) => {
    limiter.threshold.setValueAtTime(data.threshold || -24, context.currentTime);
    gainNode.gain.setValueAtTime(data.outputGain || 1, context.currentTime);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.threshold) {
        limiter.threshold.setValueAtTime(changes.threshold.newValue, context.currentTime);
    }
    if (changes.outputGain) {
        gainNode.gain.setValueAtTime(changes.outputGain.newValue, context.currentTime);
    }
});

console.log("Content script loaded and limiter applied to media elements.");
