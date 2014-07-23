
//In this content script, we will listen for the ClickToCall event and then proxy that to the background
//page so that the background.js can check if the interaction client is running in another tab.
//If it is, then nothing happens, if it isn't the response function will be caled and we will set
//the window.location to the callto uri.
document.addEventListener("ClickToCall", function(data) {

    var callData = {number:data.detail, type:data.type};

    chrome.runtime.sendMessage(JSON.stringify(callData), function(response){
        if(response.number) {
            window.location = 'callto:' + response.number;
        }
    });
});

//if this is the interaction client, register for a listener
if(document.title == "Interaction Client"){
    chrome.runtime.onMessage.addListener(
      function(data, sender, sendResponse) {
          if(!sender.tab && data.number && data.type==="ClickToCall") { //sender is extension
              ININ.$('#myInteractionsPanel_makeCallComboBox_selection').val(data.number);
              ININ.$('#myInteractionsPanel_makeCallButton').prop('disabled', false);
              ININ.$('#myInteractionsPanel_makeCallButton').click();
          }

      });
}
