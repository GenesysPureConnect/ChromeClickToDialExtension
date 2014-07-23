
function initClickToDial() {
    ININ.registerNamespace('ININ.ClickToDial.Plugin');
}

(function inin_autoRun() {
    var basePluginUrl = chrome.extension.getURL('');
    var bootstrapper = new ininPluginBootstrapper(basePluginUrl, basePluginUrl, null, true);
    bootstrapper.ininLoadScripts(initClickToDial);
} ());

//add an event listener to handle the click message from the page
chrome.runtime.onMessage.addListener(function(messageString, sender, sendResponse) {
    //we only want to send the number to the interaction client page
    var message = JSON.parse(messageString);
    if(message.type === "ClickToCall"){
        chrome.tabs.query({title: "Interaction Client"}, function(tabs) {
            for(var x = 0;x<tabs.length;x++)
            {
              chrome.tabs.sendMessage(tabs[x].id, message);
              return;
            }

        });

        //no interaction client tabs found, lets respond back to that tab to issue a click to call.
        sendResponse({number:message.number});
    }
});
