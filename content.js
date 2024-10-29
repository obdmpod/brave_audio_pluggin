const context = new (window.AudioContext || window.webkitAudioContext)();
const limiter = context.createDynamicsCompressor();
const analyser = context.createAnalyser();  // Create an AnalyserNode
analyser.fftSize = 256;
analyser.smoothingTimeConstant = 0.85;

limiter.threshold.setValueAtTime(-24, context.currentTime);
limiter.knee.setValueAtTime(0, context.currentTime);
limiter.ratio.setValueAtTime(20, context.currentTime);
limiter.attack.setValueAtTime(0.003, context.currentTime);
limiter.release.setValueAtTime(0.25, context.currentTime);

const gainNode = context.createGain();
gainNode.gain.setValueAtTime(1, context.currentTime);

chrome.storage.local.get(['threshold', 'outputGain'], function(data) {
    limiter.threshold.setValueAtTime(data.threshold !== undefined ? data.threshold : -24, context.currentTime);
    gainNode.gain.setValueAtTime(data.outputGain !== undefined ? data.outputGain : 1, context.currentTime);
});

function applyLimiterToMediaElement(mediaElement) {
    const source = context.createMediaElementSource(mediaElement);
    source.connect(limiter);
    limiter.connect(gainNode);
    gainNode.connect(analyser);  // Connect to analyser before output
    gainNode.connect(context.destination);
}

// Function to send decibel data to popup
function sendAudioMeterData() {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    
    const avgAmplitude = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const dBLevel = Math.max(-100, 20 * Math.log10(avgAmplitude / 255));
    
    chrome.runtime.sendMessage({ decibelLevel: dBLevel });
    
    requestAnimationFrame(sendAudioMeterData);
}

document.querySelectorAll('video, audio').forEach(applyLimiterToMediaElement);

const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                    applyLimiterToMediaElement(node);
                }
            });
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });

sendAudioMeterData();  // Start sending audio meter data to the popup
