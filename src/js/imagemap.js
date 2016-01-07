var imagemap = function() {
	var cache = {};
	var currentPage = 1;
	var lastPage = '?';
	
	var init = function() {
		// Called after user clicks Browse Imagemap button
		loadCache(function(cached) {
			cache = cached.imagemap;
			getImagemap(processResponse);
		});
	};
	
	var getImagemap = function(callback) {
		var page;
		(currentPage === 1)
				? page = ''
				: page = '?page=' + currentPage;
		var url = window.location.protocol + '//images.endoftheinter.net/imagemap.php' + page;		
		chrome.runtime.sendMessage({
				need: "xhr",
				url: url,
		}, function(response) {
				var html = document.createElement('html');
				html.innerHTML = response;						
				callback.call(imagemap, html);
		});			
	};
	
	var processResponse = function(imagemap) {
		// Scrape grid of images from imagemap
		var imageGrid = scrape(imagemap);
		var infobar = imagemap.getElementsByClassName('infobar')[1];
		var anchors = infobar.getElementsByTagName('a');
		// Find size of imagemap by checking the page navigation anchor tags
		lastPage = anchors[anchors.length - 1].innerHTML;
		// Now ready to create imagemap popup and cache the thumbnails (if necessary)
		createPopup(imageGrid);
		sendToEncoder(imageGrid);
	};
	
	var scrape = function(imagemap) {
		// Returns modified grid of images from imagemap for popup
		var imageGrid = imagemap.getElementsByClassName('image_grid')[0];
		var imgs = imageGrid.getElementsByTagName('img');
		for (var i = 0, len = imgs.length; i < len; i++) {
			var img = imgs[i];
			var src = img.src;
			// Replace src attribute value with cached base64 strings (if they exist)
			if (cache[src]) {
				img.setAttribute('oldsrc', img.src);
				img.src = cache[src].data;							
			}
		}
		var blockDescs = imageGrid.getElementsByClassName('block_desc');
		var gridBlocks = imageGrid.getElementsByClassName('grid_block');
		for (var i = 0, len = blockDescs.length; i < len; i++) {
			var blockDesc = blockDescs[i];
			blockDesc.style.display = 'none';
		}
		for (var i = 0, len = gridBlocks.length; i < len; i++) {
			var gridBlock = gridBlocks[i];
			gridBlock.title = "Click to copy image code to clipboard";
		}
		return imageGrid;
	};
	
	var createPopup = function(imageGrid, searchResults) {
		// Create div element for popup and style as required	
		var div = document.createElement('div');
		var width = window.innerWidth;
		var height = window.innerHeight;
		var bodyClass = document.getElementsByClassName('body')[0];
		var anchorHeight;	
		div.id = "map_div";
		div.style.position = "fixed";				
		div.style.width = (width * 0.95) + 'px';
		div.style.height = (height * 0.95) / 2 + 'px';
		div.style.left = (width - (width * 0.975)) + 'px';
		div.style.top = (height - (height * 0.975)) + 'px';
		div.style.boxShadow = "5px 5px 7px black";		
		div.style.borderRadius = '6px';	
		div.style.opacity = 1;
		div.style.backgroundColor = 'white';
		div.style.overFlow = 'scroll';
		if (searchResults) {
			var header = document.createElement('div');
			var text = document.createTextNode('Displaying results for query "' + query + '" :');
			header.appendChild(text);
			header.style.color = 'black';
			header.style.position = 'relative';
			header.style.left = '15px';
			header.style.right = '15px';
			header.style.top = '15px';
			header.style.cssFloat = 'left';
			header.style.textAlign = 'left';
			header.style.width = '100%';
			header.style.fontSize = '16px';
			div.appendChild(header);				
			// Account for header's style properties
			imageGrid.style.maxHeight = ((height * 0.95) / 2) - 51 + 'px';
			imageGrid.style.maxWidth = (width * 0.95) - 21 + 'px';
		}
		else {
			// Subtract 6px to prevent scrollbar from overlapping rounded corners
			imageGrid.style.maxWidth = (width * 0.95) - 6 + 'px';
			imageGrid.style.maxHeight = ((height * 0.95) / 2)  - 6 + 'px';
		}
		imageGrid.style.position = 'relative';
		imageGrid.style.top = '5px';
		imageGrid.style.overflow = 'scroll';
		imageGrid.style.overflowX = 'hidden';
		bodyClass.style.opacity = 0.3;
		if (searchResults) {
			header.appendChild(imageGrid);
		}
		else {
			div.appendChild(imageGrid);
		}
		document.body.appendChild(div);
		document.body.style.overflow = 'hidden';
		// Prevent scrolling in imagemap div from affecting the rest of the page
		bodyClass.addEventListener('mousewheel', preventScroll);
		// Add click listeners to close popup/copy img code to clipboard when appropriate
		bodyClass.addEventListener('click', closePopup);
		div.addEventListener('click', function(evt) {
			clickHandler(evt);
			evt.preventDefault();
		});
		if (!searchResults) {
			// Load new page after user has scrolled to bottom of existing page.
			// Uses debouncing to improve performance.
			imageGrid.addEventListener('scroll', debouncer);
		}
	};
	
	var sendToEncoder = function(imageGrid) {
		// Iterate over images and send to encoder method
		var imgs = imageGrid.getElementsByTagName('img');
		for (var i = 0, len = imgs.length; i < len; i++) {
			var img = imgs[i];
			var src = img.src;
			// Images without oldsrc attribute need to be cached
			if (!img.getAttribute('oldsrc')) {
				// We need to look in different places for loaded and placeholder image hrefs
				if (img.parentNode.className === 'img-loaded') {					
					var href = img.parentNode.parentNode.href;
				}
				else {
					var href = img.parentNode.href;
				}
				
				encodeToBase64(src, href);
			}
		}
	};
	
	var encodeToBase64 = function(src, href) {
		// Draw each image to canvas so we can encode it as base64 string	
		var canvas = document.createElement('canvas');
		var context = canvas.getContext('2d');
		var img = new Image;
		img.crossOrigin = "Anonymous";
		img.onload = function() {
			canvas.height = this.height;
			canvas.width = this.width;
			context.drawImage(this, 0, 0);
			var dataURI = canvas.toDataURL();
			var imageData = {
					'dataURI': dataURI, 
					'src': src, 
					'href': href, 
					'index': i
			};
			prepareCacheData(imageData);
		};
		// Use cors-anywhere server to deal with CORS restrictions
		img.src = window.location.protocol + '//cors-for-chromell.herokuapp.com/' + src;
	};
	
	var prepareCacheData = function(imageData) {
		var cacheData = {};
		var dataURI = imageData.dataURI;
		var href = imageData.href;
		var src = imageData.src;
		var i = imageData.index;
		// Thumbnails are always jpgs - fullsize image could have a different file format (found in href)			
		var extension = href.match(/\.(gif|jpg|png)$/i)[0];
		var fullsize = src.replace('.jpg', extension);
		fullsize = fullsize.replace('dealtwith.it/i/t', 'endoftheinter.net/i/n');
		var filename = fullsize.match(/\/([^/]*)$/)[1];						
		filename = decodeURIComponent(filename);
		
		if (!filename || !fullsize || !dataURI) {
			// This probably shouldn't happen
			console.log('Error while caching image: ', '\n', src, filename, fullsize, dataURI);
			return;
		}
		else {		
			cacheData[src] = {"filename": filename, "fullsize": fullsize, "data": dataURI};
			// Finished encoding image - update cache
			updateCache(cacheData);
		}
	};
	
	var updateCache = function(cacheData) {
		if (Object.keys(cache).length === 0) {
			// First time caching 
			cache = cacheData;
		}
		else {
			// Add new image to existing cached data
			for (var i in cacheData) {
				cache[i] = cacheData[i];							
			}
		}
	};
	
	var loadCache = function(callback) {
		chrome.storage.local.get("imagemap", function(cache) {
			if (Object.keys(cache).length === 0) {
				// Return empty imagemap object
				callback({
					"imagemap": {}
				});
			}
			else if (cache) {
				callback(cache);
			}
		});
	};
	
	var saveCache = function() {
		chrome.storage.local.set({"imagemap": cache}, function() {
			// Clear cache object after storage.local.set method has completed
			imagemap.cache = {};
		});
	};
	
	var debounceTimer = '';
	
	var debouncer = function() {
		// Prevents scroll handler from being called repeatedly
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(scrollHandler, 250);
	};
	
	var scrollHandler = function(imageGrid) {
		var imageGrid = document.getElementsByClassName('image_grid')[0]
		// Check whether user is at end of current page - subtract 5 pixels from clientHeight 
		// to account for large zoom levels)
		if (imageGrid.scrollTop >= imageGrid.scrollHeight - imageGrid.clientHeight - 5) {			
			if (currentPage === lastPage) {
				// No more pages to load
				return;
			}
			else {
				// Load next page and append to current grid 
				currentPage++;
				getImagemap(function(imagemap) {
					var newGrid = scrape(imagemap);
					imageGrid.appendChild(newGrid);
					sendToEncoder(newGrid);
				});
			}
		}
	};
	
	var clickHandler = function(evt) {
		if (evt.target.id == 'image_search') {
			return;
		}
		else if (evt.target.tagName === 'IMG') {
			var clipboard = {};	
			if (evt.target.getAttribute('searchresult')) {
				// Use oldsrc attribute as src attribute is data URI
				var src = evt.target.getAttribute('oldsrc'); 
			}
			else {
				if (evt.target.getAttribute('oldsrc')) {
					var src = evt.target.getAttribute('oldsrc'); 
				}
				else {
					var src = evt.target.src;
				}
				var href = evt.target.parentNode.href;
				var regex = /\.(gif|jpg|png)$/i;
				// Make sure that we're using the href extension, not the thumbnail extension
				var extension = href.match(regex);
				var extensionToReplace = src.match(regex);
				src = src.replace(extensionToReplace[0], extension[0]);
			}
			// Create LLML img code string
			var request = {
				need: 'copy',
				data:  '<img src="' + src.replace('dealtwith.it/i/t', 'endoftheinter.net/i/n') + '" />'
			};
			// Pass data to background page so we can copy it to clipboard
			chrome.runtime.sendMessage(request);
		}
		// Always close popup after click event, even if user didn't click on an image
		closePopup();
		document.removeEventListener('click', clickHandler);
		evt.preventDefault();
	};
	
	var closePopup = function() {
		// Remove popup div, style changes and event listeners
		var div = document.getElementById('map_div') || document.getElementById('search_results');
		var bodyClass = document.getElementsByClassName('body')[0];
		if (div) {
			document.body.removeChild(div);
		}
		bodyClass.style.opacity = 1;
		document.body.style.overflow = 'initial';
		bodyClass.removeEventListener('mousewheel', preventScroll);		
		currentPage = 1;
		// Save cache after closing popup - this prevents us from having to continually access the
		// chrome.storage APIs after encoding each image (which would be terrible for performance)
		saveCache();
	};
	
	
	var preventScroll = function(evt) {
		evt.preventDefault();
	};
	
	var search = function() {

		var init = function() {
			var query = document.getElementById('image_search').value;
			// Check that query contains characters other than whitespace
			if (/\S/.test(query)) {
				lookup(query, function(results, query) {
					if (!document.getElementById('search_results')) {
						createPopup(query);
					}
					else {
						var oldGrid = document.getElementById('results_grid') || document.getElementById('no_results_grid');								
						oldGrid.remove();
						// display loading_image element while waiting for results div to update
						document.getElementById('loading_image').style.display = 'block';				
					}
					getMatches(results, query);
				});
			}
			else {
				// Detected empty search box after keyup event - close imagemap popup (if it exists)
				if (document.getElementById('search_results')) {
					closePopup();
				}
			}
		};
	
		var lookup = function(query, callback) {
			// Iterate over imagemap, check for query and push matches to new array
			var results = [];
			loadCache(function(cached) {
				for (var i in cached.imagemap) {
					var filename = cached.imagemap[i].filename;
					if (filename.indexOf(query) > -1) {
						results.push(i);
					}
				}
				callback(results, query);
			});				
		};
		
		var getMatches = function(results, query) {
			var resultsToShow = results;
			if (results.length === 0) {
				// No matches - pass false value instead of data
				updatePopup(false, query);
			}
			else {
				// Get image data for each match from cache
				loadCache(function(cached) {
					var data = {};
					for (var i = 0, len = results.length; i < len; i++) {
						var result = results[i];
						data[result] = cached.imagemap[result];
					}
					formatResults(data, query);
				});
			}
		};
		
		var formatResults = function(data, query) {
			// Format search results to be displayed in popup
			var grid = document.createElement('div');	
			grid.className = 'image_grid';
			grid.id = 'results_grid';
			grid.style.clear = 'left';		
			for (var i in data) {
				var block = document.createElement('div');
				block.className = 'grid_block';
				var img = document.createElement('img');
				img.setAttribute('oldsrc', data[i].fullsize);
				img.setAttribute('searchresult', true);
				img.src = data[i].data;
				block.className = 'grid_block';
				block.style.display = 'inline';
				block.appendChild(img);
				grid.appendChild(block);						
			}
			updatePopup(grid, query);
		};
		
		var createPopup = function(query) {
			var header = document.createElement('div');
			var image = document.createElement('img');
			var imageURL = chrome.extension.getURL('/src/images/loading.png');
			image.id = 'loading_image';
			image.style.display = 'block';
			image.style.marginLeft = 'auto';
			image.style.marginRight = 'auto';
			image.style.marginTop = 'auto';
			image.style.marginBottom = 'auto';
			image.src = imageURL;					
			header.innerHTML = 'Displaying results for query "<span id="query">' + query + '</span>" :';					
			var div = document.createElement('div');
			var width = window.innerWidth;
			var height = window.innerHeight;
			var bodyClass = document.getElementsByClassName('body')[0];		
			div.id = "search_results";
			div.style.position = "fixed";				
			div.style.width = (width * 0.95) + 'px';
			div.style.height = (height * 0.95) / 2 + 'px';
			div.style.left = (width - (width * 0.975)) + 'px';
			div.style.top = (height - (height * 0.975)) + 'px';
			div.style.boxShadow = "5px 5px 7px black";		
			div.style.borderRadius = '6px';	
			div.style.backgroundColor = 'white';
			div.style.overFlow = 'scroll';
			header.style.color = 'black';
			header.style.position = 'relative';
			header.style.left = '15px';
			header.style.right = '15px';
			header.style.top = '15px';
			header.style.cssFloat = 'left';
			header.style.textAlign = 'left';
			header.style.width = '100%';
			header.style.fontSize = '16px';
			header.id = 'results_header';
			div.appendChild(header);
			div.appendChild(image);
			document.body.appendChild(div);					
			document.body.style.overflow = 'hidden';
			bodyClass.addEventListener('mousewheel', preventScroll);
			bodyClass.addEventListener('click', closePopup);
			document.addEventListener('click', clickHandler);
		};
		
		var updatePopup = function(results, query) {
			document.getElementById('loading_image').style.display = 'none';
			var popup = document.getElementById('search_results');
			var oldGrid = document.getElementById('results_grid') || document.getElementById('no_results_grid');
			var header = document.getElementById('results_header');	
			var querySpan = document.getElementById('query');
			var width = window.innerWidth;
			var height = window.innerHeight;					
			if (querySpan.innerHTML != query) {				
				querySpan.innerHTML = query;
			}
			if (!results) {
				var textDiv = document.createElement('div');
				var text = document.createTextNode('No matches found.');
				textDiv.id = 'no_results_grid'
				textDiv.style.position = 'relative';
				textDiv.style.top = '5px';
				textDiv.appendChild(text);
				if (oldGrid) {
					if (oldGrid.id === 'no_results_grid') {
						return;
					}
					else {
						oldGrid.remove();	
						header.appendChild(textDiv);
						return;
					}
				}
				else {
					header.appendChild(textDiv);
					return;
				}
			}
			else {
				results.style.maxHeight = ((height * 0.95) / 2) - 51 + 'px';
				results.style.maxWidth = (width * 0.95) - 21 + 'px';
				results.style.position = 'relative';
				results.style.top = '5px';
				results.style.overflow = 'scroll';
				results.style.overflowX = 'hidden';
				if (oldGrid) {
					oldGrid.remove();
				}
				header.appendChild(results);
			}
		};
		
		return { init: init };
		
	}();
	
	return {
		init: init,
		search : search
	};
	
}();