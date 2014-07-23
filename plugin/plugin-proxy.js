/* REQUIRES:
    common.js
    jquery

    CONTEXT: Plugin Page (per page, access to page DOM, but in its own JavaScript context)
*/
var isWebClientRunning = false;

function inin_initBootStrapper() {
    var basePluginUrl = chrome.extension.getURL('');

   ININ.InjectUtils.ExecuteFunctionByName(document, 'ininPluginBootstrapper.init_bootstrap', basePluginUrl, basePluginUrl, isWebClientRunning);
}

// Insert the bootstrapper into the page context to load the click-to-dial scripts into the page context
function inin_injectBootstrapper() {
    ININ.InjectUtils.InjectScriptRef(document, chrome.extension.getURL('/bootstrapper.js'), inin_initBootStrapper);
}

(function inin_plugin_proxy_autorun() {
    ININ.$ = jQuery.noConflict();
    inin_injectBootstrapper();

}()); // auto-run on load
