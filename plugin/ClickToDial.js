ININ.registerNamespace('ININ.ClickToDial');

ININ.ClickToDial.DataKeys = {};
ININ.ClickToDial.DataKeys.DATA_KEY_CLICK_TO_DIAL_BUTTON_ID = 'inin_buttonId';
ININ.ClickToDial.DataKeys.DATA_KEY_NUMBER_TO_DIAL = 'inin_numbertodial';

ININ.ClickToDial.Core = function () {

    var __phoneNumberRegex = /(^|\D)((?:(?:\+?1[\s\.-]?)?\(?[2-9]\d\d\)?[\s\.-]?)?[2-9]\d{2}[\s\.-]?\d{4})($|\D)/g;
    var __commentRegex = /\/\*[\W\w]*\*\//;
    var __cssRegex = /[#.][\w -]*\{[\W\w]*\}/;

    var dataKeys = ININ.ClickToDial.DataKeys;
    var isWebClientRunning = false;
    var getHrefFormatMethod = function(isWebClientRunning, number){return "javascript:void(0)"};
    var clickHandlerMethod = function(evt) {
        var elem = ININ.$(evt.currentTarget);
        var number = elem.data(dataKeys.DATA_KEY_NUMBER_TO_DIAL);
        if (number) {

        //    window.location = 'tel:' + number;
            try
            {

                //try to send the number to the web client running in another tab
               var event = new CustomEvent('Event', { 'detail': number });
                event.initEvent('ClickToCall');
                document.dispatchEvent(event);
            //    window.postMessage({ type: "FROM_PAGE", text: "Hello from the webpage!" }, "*");

            }
            catch(err)
            {}


        }

        evt.preventDefault();
        evt.stopImmediatePropagation();
    };

    function ChangeNumbers(doc) {

        if(doc.title == "Interaction Client"){
            //don't update the interaction client
            return;
        }

        // Iterate each node in the body, searching the text for numbers to change to click-to-dial links.
        // We skip script nodes because they could take a long time to parse, and we know they will not
        // contain visible text that needs to be modified.
        // We skip iframe and frame nodes because we may not have permissions to them, and it will cause
        // a JavaScript error to attempt to access them.
        ININ.$("body, body *", doc).not("script,iframe,frame,a,button").textNodesMatching(__phoneNumberRegex).each(
            function (index) {

                var nodeText = ININ.$(this).text();

                if( ININ.$(this).children().length > 0){
                    return;
                }

                if(nodeText.match(__commentRegex) != null){
                    //this number is in a comment, return
                    return;
                }

                if(nodeText.match(__cssRegex) != null){
                    //this number is in a css style, return
                    return;
                }

                var numberMatches = nodeText.match(__phoneNumberRegex);
                if(numberMatches == null){
                    return;
                }

                var number = numberMatches[0].replace(/\W+/g,"");

                console.log("found phone number: " + number)
                console.log(nodeText)
                console.log(ININ.$(this))

                var id = ININ.Utils.generateRandomId();
                var newNode = document.createElement('a');
                newNode.setAttribute("class", 'ininClickToDialLink ininClickToDialElement');

                newNode.setAttribute("href", getHrefFormatMethod(isWebClientRunning, number));
                newNode.setAttribute("title", "Dial " + number);
                newNode.setAttribute("data-" + dataKeys.DATA_KEY_NUMBER_TO_DIAL, number);
                newNode.setAttribute("id",id);


                ININ.$(this).wrap(newNode);
                ININ.$('#' + id).bind('click', clickHandlerMethod);
                ININ.$('#' + id).data(dataKeys.DATA_KEY_NUMBER_TO_DIAL, number);

            });
        }

        function setIsWebClientRunning(isRunning){
            isWebClientRunning = isRunning
        }

        return {
            /*
            Initiate the Click-To-Dial scripts on the provided document.
            */
            Initialize: function (doc) {
                console.log('initialize');
                ChangeNumbers(doc);
            }
        }
    } ();
