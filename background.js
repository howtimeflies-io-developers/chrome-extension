var host = 'http://localhost:51294/how-time-flies'
var url = null;
var os = null;

function getActiveTabUrl() {
    chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
        if (tabs && tabs[0]) {
            console.log('active tab url: ' + tabs[0].url);
            var newUrl = tabs[0].url;
            if (newUrl !== url) {
                url = newUrl;
                sendActiveUrl(url);
            }
        } else {
            console.log('no active tabs');
        }
    });
}

function sendActiveUrl(url) {
    console.log('sending: ' + url);
    var req = new XMLHttpRequest();
    if (req) {
        req.open('POST', host, true);
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    console.log('send active url successfully')
                } else {
                    console.log('send active url failed with code [' + req.status + '] and text: ' + req.statusText)
                }
            }
        };
        if (os === 'win') {
            sendActiveUrlOnWindows(req, url);
        } else {
            sendActiveUrlOnUnix(req, url);
        }
    } else {
        console.log("Failed to create XMLHttpRequest");
    }
}

function sendActiveUrlOnWindows(req, url) {
    var data = new FormData();
    data.append('browser', 'Chrome');
    data.append('website', url);
    req.send(data);
}

function sendActiveUrlOnUnix(req, url) {
    req.setRequestHeader('Content-type', 'text/xml; charset=utf-8');
    req.setRequestHeader('SOAPAction', '"http://service.howtimeflies.talentswork.online/BrowserExtensionService/sendWebsiteRequest"');
    var xml = getXml();
    req.send(xml);
}

function getXml() {
    return '' +
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
        '                  xmlns:ser="http://service.howtimeflies.talentswork.online/">' +
        '   <soapenv:Header/>' +
        '   <soapenv:Body>' +
        '      <ser:sendWebsite>' +
        '         <browser>Chrome</browser>' +
        '         <website><![CDATA[' + url + ']]></website>' +
        '      </ser:sendWebsite>' +
        '   </soapenv:Body>' +
        '</soapenv:Envelope>';
}

chrome.windows.onCreated.addListener(getActiveTabUrl);

chrome.windows.onFocusChanged.addListener(getActiveTabUrl);

chrome.tabs.onUpdated.addListener(getActiveTabUrl);

chrome.tabs.onSelectionChanged.addListener(getActiveTabUrl);


chrome.runtime.getPlatformInfo(function (platformInfo) {
    os = platformInfo.os;

    // run when the extension loads initially
    getActiveTabUrl();
});


// send the active tab url every 5 minutes even it is not updated to ensure we have the latest value
setInterval(function() {
    var lastUrl = url;
    getActiveTabUrl();
    if (lastUrl === url) {
        // send it even unchanged
        sendActiveUrl(url);
    }
}, 1000 * 60 * 5);
