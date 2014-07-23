
// Find all text nodes.
ININ.$.fn.textNodes = function () {
    return ININ.$(this).contents().filter(function () { return this.nodeType == 3 });
};

// Find all text nodes with text matching the provided RegExp object.
ININ.$.fn.textNodesMatching = function (regexp) {
    return ININ.$(this).contents().filter(function () {
        // NOTE: Do NOT use RegExp.test() here, because the regexp could be using a global search, and the
        // RegEx object maintains the last match index and will not properly return whether a
        // match exists or not. Instead we'll use string.search(). For more details see:
        // http://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
        // and http://blog.stevenlevithan.com/archives/fixing-javascript-regexp
        return this.nodeType == 3 && ININ.$(this).text().search(regexp) != -1;
    });
};
