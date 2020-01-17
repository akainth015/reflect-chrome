chrome.storage.sync.get('isEnabled', function(data) {
	// check to see if reflect is enabled
	if (data.isEnabled) {
		// check for is blocked
		chrome.storage.sync.get('blockedSites', function(data) {
			data.blockedSites.forEach(function(site) {

				// is blocked
				if (window.location.href.includes(site)) {
					iterWhitelist()
				}
			});
		});
	}
});

function iterWhitelist() {
	console.log("YEET");
	// iterate whitelisted sites
	chrome.storage.sync.get('whitelistedSites', function(data) {
		data.whitelistedSites.forEach(function(whitelistobj) {

			// check if site is whitelisted
			if (window.location.href.includes(whitelistobj.siteURL)) {
				// check if time ok
				if ((new Date) < whitelistobj.expiry) {
					
				} else {
					loadBlockPage()
				}
			}
		});

		// no whitelist pages matched, block
		loadBlockPage()
	})
}

function loadBlockPage() {
	// get prompt page content
	$.get(chrome.runtime.getURL("res/pages/prompt.html"), function(page) {
		// refresh page with our blocker page
        document.open();
	    document.write(page);
	    document.close();

    	// add listener for form submit
		document.forms['inputForm'].addEventListener('submit', (event) => {
			// prevent default submit
		    event.preventDefault();

		    // extract entry
		    intent = (new FormData(event.target)).get('intent')

		    // store in chrome storage
			chrome.storage.sync.set({ 'lastIntent': intent }, function(data) {
				console.log('Intent set to: ' + intent);
			});
		});

	    // load css
		var cssPath = chrome.runtime.getURL('res/common.css');
		$("head").append(
			$('<link rel="stylesheet" type="text/css" />').attr('href', cssPath)
		);

		// add blobs
		$("#top-left-blob").attr("src", chrome.runtime.getURL('res/blob-big-2.svg'))
		$("#bottom-right-blob").attr("src", chrome.runtime.getURL('res/blob-big-1.svg'))
		$("#small-blob1").attr("src", chrome.runtime.getURL('res/blob-med.svg'))
		$("#small-blob2").attr("src", chrome.runtime.getURL('res/blob-small.svg'))

		// save url to cache
	    var url = location.href;
		chrome.storage.sync.set({ 'cachedURL': url}, function() {
			console.log('Set cached url to: ' + url);
		});	
	});
}