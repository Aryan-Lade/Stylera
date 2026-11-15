// Stylera Background Service Worker (Manifest V3)
import { FetchImageResponse } from '../shared/types';

console.log('[Stylera Background] Service Worker initialized');

// Set up Context Menus
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'stylera-tryon-item',
    title: 'Try on with Stylera',
    contexts: ['image', 'link']
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'stylera-tryon-item' && tab?.id) {
    const imageUrl = info.srcUrl || info.linkUrl;
    if (imageUrl) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'STYLERIA_CONTEXT_TRYON',
        imageUrl
      }).catch((err) => {
        console.warn('[Stylera Background] Failed to send message to content script:', err);
      });
    }
  }
});

// Message listener for cross-origin image fetching (bypassing CORS taint)
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === 'FETCH_IMAGE') {
    fetchImageAsDataUrl(request.url)
      .then((dataUrl) => sendResponse({ success: true, dataUrl } as FetchImageResponse))
      .catch((err) => sendResponse({ success: false, error: err.message } as FetchImageResponse));
    return true; // async sendResponse
  }

  if (request.type === 'TOGGLE_TRYON_WINDOW') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_TRYON_MODAL' }).catch(console.error);
      }
    });
  }
});

// Action click toggles the try-on window
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_TRYON_MODAL' }).catch(console.error);
  }
});

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
