chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        if (chrome.scripting && chrome.scripting.executeScript) {
            // Try to inject content script
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            }).then(() => {
                console.log("Content script injected successfully.");
            }).catch(error => {
                console.error('Error injecting content script:', error);
            });
        } else {
            console.error("chrome.scripting.executeScript is not available.");
        }
    }
});
