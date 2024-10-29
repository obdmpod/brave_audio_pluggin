chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }).then(() => {
            console.log("Content script injected successfully.");
        }).catch(error => {
            console.error('Error injecting content script:', error);
        });
    }
});
