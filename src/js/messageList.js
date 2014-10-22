var config = [];
var t0 = performance.now();
var ignorated = {
	total_ignored : 0,
	data : {
		users : {}
	}
};
var tops_total = 0;

// set up an observer for when img-placeholders get populated
var img_observer = new MutationObserver(function(mutations) {
var mutation;
	for (var i = 0, len = mutations.length; i < len; i++) {
		mutation = mutations[i];
		// find all fullsize imgs
		if (mutation.addedNodes.length > 0
				&& mutation.addedNodes[0].src
					.match(/.*\/i\/n\/.*/)) {
			// pass to resize_imgs method
			messageList.resize_imgs(mutation.target.parentNode);
		}
		if (mutation.type === 'attributes') {
			// once they're loaded, thumbnails have /i/t/ in their
			// url where fullsize have /i/n/
			if (mutation.attributeName == "class"
					&& mutation.target.getAttribute('class') == "img-loaded"
					&& mutation.target.childNodes[0].src
							.match(/.*\/i\/t\/.*/)) {
				if(config.debug) console.log("found thumbnail");
				/*
				 * set up the onclick and do some dom manip that the
				 * script originally did - i think only removing href
				 * actually matters
				 */
				mutation.target.parentNode.addEventListener('click',
						messageListHelper.expandThumbnail);
				mutation.target.parentNode.setAttribute('class',
						'thumbnailed_image');
				mutation.target.parentNode
						.setAttribute('oldHref',
								mutation.target.parentNode
										.getAttribute('href'));
				mutation.target.parentNode.removeAttribute('href');
			}
		}
	}
});

// set up observer to detect mutations to youtube links
var link_observer = new MutationObserver(function(mutations) {
	$("table.message-body").on("click", "a.embed",
		function() {
			// handle "embed" link
			if (!this.embedded) {
				messageListHelper.embedYoutube(this);
			}
		}
	);
	$("table.message-body").on("click", "a.hide",
		function() {
			// handle "hide" link
			if (!this.hidden) {
				messageListHelper.hideYoutube(this);
			}
		}
	);
	$("div.youtube").click(
		function(event) {
			event.preventDefault();
		}
	);
});

var miscFunctions = {
	// order of functions in object has to be maintained
	// for dom elements to be added in correct order
	imagemap_on_infobar : function() {
		function getUrlVars(urlz) {
			var vars = [], hash;
			var hashes = urlz.slice(urlz.indexOf('?') + 1).split('&');
			for (var i = 0, hash; hash = hashes[i]; i++) {
				hash = hash.split('=');
				vars.push(hash[0]);
				vars[hash[0]] = hash[1];
				if (hash[1] != null && hash[1].indexOf("#") >= 0) {
					vars[hash[0]] = hash[1].slice(0, hash[1].indexOf("#"));
				}
			}
			return vars;
		}
		var infobar = document.getElementsByClassName("infobar")[0];
		var get = getUrlVars(window.location.href);
		var page = location.pathname;
		var anchor = document.createElement('a');
		var divider = document.createTextNode(" | ");
		if (page == "/imagemap.php" && get["topic"] != undefined) {
			var as2 = infobar.getElementsByTagName("a");
			for (var j = 0, a; a = as2[j]; j++) {
				if (a.href.indexOf("imagemap.php?") > 0) {
					a.href = a.href + "&board=" + get["board"];
				}
			}
			anchor.href = '/showmessages.php?board=' + get["board"]
					+ '&topic=' + get["topic"];
			anchor.innerText = 'Back to Topic';
			infobar.appendChild(divider);
			infobar.appendChild(anchor);
		} else if (page == "/showmessages.php") {
			anchor.href = '/imagemap.php?board=' + get["board"]
					+ '&topic=' + get["topic"];
			anchor.innerText = 'Imagemap';
			infobar.appendChild(divider);
			infobar.appendChild(anchor);
		}
	},
	filter_me: function() {
		var infobar = document.getElementsByClassName('infobar')[0];
		var tops = document.getElementsByClassName('message-top');
		// handle anonymous topic
		if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
			// anonymous topic - check quickpost-body for human number
			var human = document.getElementsByClassName('quickpost-body')[0]
				.getElementsByTagName('a')[0].innerText.replace('Human #', '');
			if (isNaN(human)) {
				// user hasn't posted in topic
				return;
			}
			var me = '&u=-' + human;
		} 
		else {
			// handle non anonymous topics
			if (config.user_id) {
				// use cached user id
				var me = '&u=' + config.user_id;
			} else {
				// fallback
				var me = '&u=' + document.getElementsByClassName('userbar')[0]
					.getElementsByTagName('a')[0].href
					.match(/\?user=([0-9]+)/)[1];
			}
		}
		var topic = window.location.href.match(/topic=([0-9]+)/)[1];
		var fmh;
		var anchor = document.createElement('a');		
		var divider = document.createTextNode(" | ");		
		if (window.location.href.indexOf(me) == -1) {
			anchor.href = window.location.href.split('?')[0] + '?topic=' + topic + me;
			anchor.innerText = 'Filter Me';
		} else {
			anchor.href = window.location.href.replace(me, '');
			anchor.innerText = 'Unfilter Me';
		}
		infobar.appendChild(divider);
		infobar.appendChild(anchor);
	},	
	batch_uploader : function() {
		var quickpost_body = document.getElementsByClassName('quickpost-body')[0];
		var ulBox = document.createElement('input');
		var ulButton = document.createElement('input');		
		ulBox.type = 'file';
		ulBox.multiple = true;
		ulBox.id = "batch_uploads";
		ulButton.type = "button";
		ulButton.value = "Batch Upload";
		ulButton.addEventListener('click', messageListHelper.startBatchUpload);
		quickpost_body.insertBefore(ulBox, null);
		quickpost_body.insertBefore(ulButton, ulBox);
	},
	post_title_notification : function() {
		document.addEventListener('visibilitychange', messageListHelper.clearUnreadPosts);
		document.addEventListener('scroll', messageListHelper.clearUnreadPosts);
		document.addEventListener('mousemove', messageListHelper.clearUnreadPosts);
	},
	quickpost_on_pgbottom : function() {
		chrome.runtime.sendMessage({
			need : "insertcss",
			file : "src/css/quickpost_on_pgbottom.css"
		});
	},
	loadquotes : function() { // needs examining
		function getElementsByClass(searchClass, node, tag) {
			var classElements = new Array();
			if (node == null)
				node = document;
			if (tag == null)
				tag = '*';
			var els = node.getElementsByTagName(tag);
			var elsLen = els.length;
			for (var i = 0, j = 0; i < elsLen; i++) {
				if (els[i].className == searchClass) {
					classElements[j] = els[i];
					j++;
				}
			}
			return classElements;
		}

		function imagecount() {
			var imgs = document.getElementsByTagName('img').length;
			return imgs;
		}

		if (document.location.href.indexOf("https") == -1) {
			var url = "http";
		} else {
			var url = "https";
		}

		function coolCursor() {
			this.style.cursor = 'pointer';
		}

		function processPage(XML, element) {
			var newPage = document.createElement("div");
			newPage.innerHTML = XML;
			var newmessage = getElementsByClass('message', newPage, null)[0];
			var scripttags = newmessage.getElementsByTagName('script');
			for (var i = 0; i < scripttags.length; i++) {
				var jsSource = scripttags[i].innerHTML
						.replace(
								/onDOMContentLoaded\(function\(\)\{new ImageLoader\(\$\("u0_1"\), "\\\/\\\//gi,
								'').replace(/\\/gi, '').replace(/\)\}\)/gi, '')
						.split(',');
				var replacement = new Image();
				replacement.src = url + '://' + jsSource[0].replace(/"$/gi, '');
				replacement.className = 'expandimagesLOL';
				scripttags[i].parentNode.replaceChild(replacement,
						scripttags[i]);
				i--;
			}
			if (newmessage.innerHTML.indexOf('---') != -1) {
				var j = 0;
				while (newmessage.childNodes[j]) {
					if (newmessage.childNodes[j].nodeType == 3
							&& newmessage.childNodes[j].nodeValue
									.indexOf('---') != -1) {
						while (newmessage.childNodes[j]) {
							newmessage.removeChild(newmessage.childNodes[j]);
						}
					}
					j++;
				}
			}
			element.parentNode.appendChild(newmessage);
		}

		function loadMessage() {
			var mssgurl = this.id;
			var newSpan = document.createElement('span');
			newSpan.innerHTML = 'Loading message...';
			var loadingImg = new Image();
			loadingImg.src = 'data:image/gif;base64,'
					+ 'R0lGODlhEAAQAPIAAP///2Zm/9ra/o2N/mZm/6Cg/rOz/r29/iH/C05FVFNDQVBFMi4wAwEAAAAh/hpD'
					+ 'cmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZ'
					+ 'nAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi6'
					+ '3P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAs'
					+ 'AAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKp'
					+ 'ZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8D'
					+ 'YlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJU'
					+ 'lIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe8'
					+ '2p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAAD'
					+ 'Mgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAA'
					+ 'LAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsR'
					+ 'kAAAOwAAAAAAAAAAAA==';
			this.parentNode.insertBefore(newSpan, this);
			this.parentNode.replaceChild(loadingImg, this);
			var ajax = new XMLHttpRequest();
			ajax.open('GET', url + '://boards.endoftheinter.net/message.php?'
					+ mssgurl, true);
			ajax.send(null);
			ajax.onreadystatechange = function() {
				if (ajax.readyState == 4) {
					if (ajax.status == 200) {
						processPage(ajax.responseText, newSpan);
						loadingImg.parentNode.removeChild(loadingImg);
						newSpan.parentNode.removeChild(newSpan);
					} else {
						alert("An error occurred loading the message. Fuck shit.");
					}
				}
			}
		}

		function findQuotes() {
			var quotes = getElementsByClass('quoted-message', document, 'div');
			for (var i = 0; i < quotes.length; i++) {
				var anchors = quotes[i].getElementsByTagName('a');
				for (var j = 0; j < anchors.length; j++) {
					if (anchors[j].innerHTML == '[quoted text omitted]') {
						anchors[j].removeAttribute('href');
						var parts = anchors[j].parentNode.getAttribute('msgid')
								.split(',');
						var secondsplit = parts[2].split('@');
						anchors[j].id = 'id=' + secondsplit[0] + '&topic='
								+ parts[1] + '&r=' + secondsplit[1];
						anchors[j].addEventListener('click', loadMessage, true);
						anchors[j].style.textDecoration = 'underline';
						anchors[j].title = 'Click to load the omitted message';
						anchors[j].addEventListener('mouseover', coolCursor,
								true);
					}
				}
			}
		}

		var currentMessages = 0;

		function checkMssgs() {
			var mssgs = getElementsByClass('message-container', document
					.getElementById('u0_1'), 'div').length;
			if (mssgs > currentMessages) {
				findQuotes();
				currentMessages = mssgs;
			}
		}
		var interval = window.setInterval(checkMssgs, 1000);
	},
	quickpost_tag_buttons : function() {
		if (!window.location.href.match('archives')) {
			var m = document.getElementsByClassName('quickpost-body')[0];
			var txt = document.getElementById('u0_13');
			var insM = document.createElement('input');
			insM.value = 'Mod';
			insM.name = 'Mod';
			insM.type = 'button';
			insM.id = 'mod';
			insM.addEventListener("click", messageListHelper.qpTagButton, false);
			var insA = document.createElement('input');
			insA.value = 'Admin';
			insA.name = 'Admin';
			insA.type = 'button';
			insA.addEventListener("click", messageListHelper.qpTagButton, false);
			insA.id = 'adm';
			var insQ = document.createElement('input');
			insQ.value = 'Quote';
			insQ.name = 'Quote';
			insQ.type = 'button';
			insQ.addEventListener("click", messageListHelper.qpTagButton, false);
			insQ.id = 'quote';
			var insS = document.createElement('input');
			insS.value = 'Spoiler';
			insS.name = 'Spoiler';
			insS.type = 'button';
			insS.addEventListener("click", messageListHelper.qpTagButton, false);
			insS.id = 'spoiler';
			var insP = document.createElement('input');
			insP.value = 'Preformated';
			insP.name = 'Preformated';
			insP.type = 'button';
			insP.addEventListener("click", messageListHelper.qpTagButton, false);
			insP.id = 'pre';
			var insU = document.createElement('input');
			insU.value = 'Underline';
			insU.name = 'Underline';
			insU.type = 'button';
			insU.addEventListener("click", messageListHelper.qpTagButton, false);
			insU.id = 'u';
			var insI = document.createElement('input');
			insI.value = 'Italic';
			insI.name = 'Italic';
			insI.type = 'button';
			insI.addEventListener("click", messageListHelper.qpTagButton, false);
			insI.id = 'i';
			var insB = document.createElement('input');
			insB.value = 'Bold';
			insB.name = 'Bold';
			insB.type = 'button';
			insB.addEventListener("click", messageListHelper.qpTagButton, false);
			insB.id = 'b';
			m.insertBefore(insM, m.getElementsByTagName('textarea')[0]);
			m.insertBefore(insQ, insM);
			m.insertBefore(insS, insQ);
			m.insertBefore(insP, insS);
			m.insertBefore(insU, insP);
			m.insertBefore(insI, insU);
			m.insertBefore(insB, insI);
			m.insertBefore(document.createElement('br'), insB);
		}
	},
	expand_spoilers : function() {
		var infobar = document.getElementsByClassName('infobar')[0];
		var ains = document.createElement('span');
		var anchor = document.createElement('a');
		var divider = document.createTextNode(' | ');
		anchor.id = 'chromell_spoilers';
		anchor.href = '##';
		anchor.innerText = 'Expand Spoilers';
		infobar.appendChild(divider);
		infobar.appendChild(anchor);
		anchor.addEventListener('click', messageListHelper.toggleSpoilers, false);		
	},
	drop_batch_uploader : function() {
		if (window.location.href.indexOf('postmsg.php') > -1) {
			return;
		}
		var quickreply = document.getElementsByTagName('textarea')[0];
		quickreply
				.addEventListener(
						'drop',
						function(evt) {
							evt.preventDefault();
							if (evt.dataTransfer.files.length == 0) {
								console.log(evt);
								return;
							}
							document.getElementsByClassName('quickpost-body')[0]
									.getElementsByTagName('b')[0].innerHTML += " (Uploading: 1/"
									+ evt.dataTransfer.files.length + ")";
							commonFunctions.asyncUpload(evt.dataTransfer.files);
						});
	},
	highlight_tc : function() {
		var tcs = messageListHelper.getTcMessages();
		var tc;
		if (!tcs) {
			return;
		}
		for (var i = 0, len = tcs.length; i < len; i++) {
			tc = tcs[i];
			if (config.tc_highlight_color) {
				tc.getElementsByTagName('a')[0].style.color = '#'
						+ config.tc_highlight_color;
			}
		}
	},
	label_tc : function() {
		var tcs = messageListHelper.getTcMessages();
		if (!tcs) {
			return;
		}
		var color, tc, span, b, text, divider;
		if (config.tc_label_color && config.tc_label_color != '') {
			color = true;
		}
		for (var i = 0, len = tcs.length; i < len; i++) {
			tc = tcs[i];
			span = document.createElement('span');
			b = document.createElement('b');
			text = document.createTextNode('TC');
			divider = document.createTextNode(' | ');
			b.appendChild(text);
			if (color) {
				b.style.color = '#' + config.tc_label_color;
			}
			span.appendChild(divider);
			span.appendChild(b);			
			username = tc.getElementsByTagName('a')[0];
			tc.insertBefore(span, username.nextSibling);
		}
	},
	post_before_preview : function() {
		var inputs = document.getElementsByClassName('quickpost-body')[0]
				.getElementsByTagName('input');
		var input;
		var preview;
		var post;
		for (var i = 0, len = inputs.length; i < len; i++) {
			input = inputs[i];
			if (input.name == 'preview') {
				preview = input;
			}
			if (input.name == 'post') {
				post = input;
			}
		}
		post.parentNode.removeChild(post);
		preview.parentNode.insertBefore(post, preview);
	},
	load_next_page : function() {
		document.getElementById('u0_3').addEventListener('dblclick',
				messageListHelper.loadNextPage);
	},
	pm_title : function() {
		var me = document.getElementsByClassName('userbar')[0]
				.getElementsByTagName('a')[0].innerText;
		var other = '';
		var tops = document.getElementsByClassName('message-top');
		var top;
		for (var i = 0, len = tops.length; i < len; i++) {
			top = tops[i];
			if (top.getElementsByTagName('a')[0].innerText.indexOf(me) == -1) {
				other = top.getElementsByTagName('a')[0].innerText;
				break;
			}
		}
		document.title = "PM - " + other;
	},
	snippet_listener : function() {
		if (window.location.hostname.indexOf("archives") == -1) {
			var ta = document.getElementsByName('message')[0];
			var caret;
			ta.addEventListener('keydown', function(event) {
				if (config.snippet_alt_key) {
					if (event.shiftKey == true
							&& event.keyIdentifier == 'U+0009') {
						// user has pressed shift & tab together
						event.preventDefault();
						caret = messageListHelper.findCaret(ta);
						messageListHelper.snippetHandler(ta.value, caret);					
					}
				}
				else if (!config.snippet_alt_key) {
					if (event.keyIdentifier == 'U+0009') {
						event.preventDefault();
						caret = messageListHelper.findCaret(ta);
						messageListHelper.snippetHandler(ta.value, caret);
					}
				}			
			});
		}
	}
}

var messageList = {
	// order of functions in object has to be maintained
	// for dom elements to be added in correct order
	resize_imgs : function(msg) {
		var imgs = msg.getElementsByTagName('img');
		var img;
		for (var i = 0, len = imgs.length; i < len; i++) {
			img = imgs[i];
			messageListHelper.resizeImg(img);
		}
	},
	user_notes : function(msg) {
		if (!config.usernote_notes) {
			config.usernote_notes = {};
		}
		//var tops = msg.getElementsByClassName('message-top')[0];		
		var top = msg.getElementsByClassName('message-top')[0];
		if (!top.getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {
			return;
		}
		var notebook = document.createElement('a');	
		notebook.id = 'notebook';
		var divider = document.createTextNode(' | ');
		var top, tempID;
		// prevent problems when anon posts are quoted in normal topics
		if (top.getElementsByTagName('a')[0].innerText !== "⇗") {
			top.appendChild(divider);
			tempID = top.getElementsByTagName('a')[0].href
					.match(/user=(\d+)$/i)[1];
			notebook.innerHTML = (config.usernote_notes[tempID] != undefined && config.usernote_notes[tempID] != '') ? 'Notes*'
					: 'Notes';
			notebook.href = "##note" + tempID;
			top.appendChild(notebook);
			notebook.addEventListener('click', function(tgt) {
				messageListHelper.openNote(tgt.target);
			});
		}

	},
	like_button: function(msg, index) {
		if (!window.location.href.match("archives")) {
			var head = document.getElementsByTagName("head")[0];
			var script = document.createElement("script");
			var top = msg.getElementsByClassName('message-top')[0];
			var anchor = document.createElement('a');
			var divider = document.createTextNode(" | ");
			anchor.setAttribute('onclick', 'like(this);');
			anchor.innerText = 'Like';
			script.type = "text/javascript";
			script.src = chrome.extension.getURL("src/js/like.js");
			head.appendChild(script);
			anchor.href = '##like' + index;
			top.appendChild(divider);
			top.appendChild(anchor);
		}
	},	
	number_posts : function(msg, index) {
		var top = msg.getElementsByClassName('message-top')[0];
		var page, id, postnum;
		if (!window.location.href.match(/page=/)) {
			page = 1;
		} else {
			page = window.location.href.match(/page=(\d+)/)[1];
		}
		id = ((index + 1) + (50 * (page - 1)));
		if (id < 1000)
			id = "0" + id;
		if (id < 100)
			id = "0" + id;
		if (id < 10)
			id = "0" + id;
		postnum = document.createTextNode(' | #' + id);
		top.appendChild(postnum);
	},	
	post_templates : function(msg) {
		var top = msg.getElementsByClassName('message-top')[0];
		var sep, sepIns, qr;
		var cDiv = document.createElement('div');
		cDiv.style.display = 'none';
		cDiv.id = 'cdiv';
		document.body.insertBefore(cDiv, null);
		messageListHelper.postEvent = document.createEvent('Event');
		messageListHelper.postEvent.initEvent('postTemplateInsert', true, true);
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.src = chrome.extension.getURL('src/js/topicPostTemplate.js');
		document.getElementsByTagName('head')[0].appendChild(newScript);
		sep = document.createElement('span');
		sep.innerHTML = " | ";
		sep.className = "post_template_holder";
		sepIns = document.createElement('span');
		sepIns.className = 'post_template_opts';
		sepIns.innerHTML = '[';
		qr = document.createElement('a');
		qr.href = "##" + i;
		qr.innerHTML = "&gt;"
		qr.className = "expand_post_template";
		sepIns.addEventListener("click",
				messageListHelper.postTemplateAction);
		sepIns.insertBefore(qr, null);
		sepIns.innerHTML += ']';
		sep.insertBefore(sepIns, null);
		top.insertBefore(sep, null);
	},	
	userhl_messagelist : function(msg, index) {
		if (!config.enable_user_highlight) {
			return;
		}
		var tops = msg.getElementsByClassName('message-top');
		var first_top = msg.getElementsByClassName('message-top')[0];
		var top, anchors, anchor;
		var user;
		if (!config.no_user_highlight_quotes) {
			try {
				for (var k = 0, len = tops.length; k < len; k++) {
					top = tops[k];
						user = top.getElementsByTagName('a')[0].innerHTML
								.toLowerCase();
					if (config.user_highlight_data[user]) {
						if (config.debug) {
							console.log('highlighting post by ' + user);
						}
						top.style.background = '#'
								+ config.user_highlight_data[user].bg;
						top.style.color = '#'
								+ config.user_highlight_data[user].color;
						anchors = top.getElementsByTagName('a');
						for (var j = 0, len = anchors.length; j < len; j++) {
							anchor = anchors[j];
							anchor.style.color = '#'
									+ config.user_highlight_data[user].color;
						}
					}
				}
			} catch (e) {
				// if (config.debug) console.log(e);
			}			
		} else {
			user = first_top.getElementsByTagName('a')[0]
					.innerHTML.toLowerCase();
			if (config.user_highlight_data[user]) {
				if (config.debug) {
					console.log('highlighting post by ' + user);
				}
				first_top.style.background = '#'
						+ config.user_highlight_data[user].bg;
				first_top.style.color = '#'
						+ config.user_highlight_data[user].color;
				anchors = first_top.getElementsByTagName('a');
				for (var j = 0, len = anchors.length; j < len; j++) {
					anchor = anchors[j];
					anchor.style.color = '#'
							+ config.user_highlight_data[user].color;
				}
			}
		}
	},
	foxlinks_quotes : function(msg) {
		var color = "#" + config['foxlinks_quotes_color'];
		var quotes = msg.getElementsByClassName('quoted-message');
		var quote, top;
		for (var i = 0, len = quotes.length; i < len; i++) {
			quote = quotes[i];
			quot_msg_style = quote.style;
			quot_msg_style.borderStyle = 'solid';
			quot_msg_style.borderWidth = '2px';
			quot_msg_style.borderRadius = '5px';
			quot_msg_style.marginRight = '30px';
			quot_msg_style.marginLeft = '10px';
			quot_msg_style.paddingBottom = '10px';
			quot_msg_style.marginTop = '0px';
			quot_msg_style.borderColor = color;
			top = quote.getElementsByClassName('message-top')[0];
			if (top.style.background == '') {
				top.style.background = color;
			} else {
				quot_msg_style.borderColor = top.style.background;
			}
			top.style.marginTop = '0px';
			top.style.paddingBottom = '2px';
			top.style.marginLeft = '-6px';
		}
	},	
	ignorator_messagelist : function(msg, index) {
		if (!config.ignorator) {
			return;
		}
		var tops = msg.getElementsByClassName('message-top');
		var top, username, top_index;
		tops_total += tops.length;
		for (var j = 0, len = tops.length; j < len; j++) {
			top = tops[j];
			if (top) {
				username = top.getElementsByTagName('a')[0].innerHTML.toLowerCase();
				for (var f = 0, len = messageListHelper.ignores.length; f < len; f++) {
					if (username == messageListHelper.ignores[f]) {
						// calculate equivalent index of message-top for
						// show_ignorator function
						if (j == 0 && tops_total > 0) {
							top_index = tops_total - tops.length;
						}
						else {
							top_index = tops_total - j;
						}
						top.parentNode.style.display = 'none';
						if (config.debug) {
							console.log('removed post by '
									+ messageListHelper.ignores[f]);
						}
						ignorated.total_ignored++;
						if (!ignorated.data.users[messageListHelper.ignores[f]]) {
							ignorated.data.users[messageListHelper.ignores[f]] = {};
							ignorated.data.users[messageListHelper.ignores[f]].total = 1; 
							ignorated.data.users[messageListHelper.ignores[f]].trs = [ top_index ];
						} else {
							ignorated.data.users[messageListHelper.ignores[f]].total++;
							ignorated.data.users[messageListHelper.ignores[f]].trs
									.push(top_index);
						}
					}
				}		
			}
		}
	},
	label_self_anon : function(msg) {
		var tags = document.getElementsByTagName('h2')[0].innerHTML;
		if (tags.indexOf('/topics/Anonymous') > -1) {
			if (!window.location.href.match('archives')) {
				var tops = msg.getElementsByClassName('message-top');
				if (!tops[0].getElementsByTagName('a')[0].href.match(/user=(\d+)$/i)) {				
					var self = document.getElementsByClassName('quickpost-body')[0]
							.getElementsByTagName('a')[0].innerHTML;
					if (self.indexOf('Human') == -1) {
						return;
					}
					var top, humanToCheck, span;
					for (var i = 0, len = tops.length; i < len; i++) {
						top = tops[i];
						humanToCheck = top.getElementsByTagName('a')[0];
						if (humanToCheck.innerHTML.indexOf('Filter') > -1) {
							// handle livelinks post
							humanToCheck = top.getElementsByTagName('b')[0].nextSibling;
							if (!humanToCheck.innerHTML 
									&& humanToCheck.nodeValue.indexOf(self) > -1) {
								span = document.createElement('span');
								span.innerHTML = '<b>(Me)</b> | ';
								top.insertBefore(span, humanToCheck.nextSibling);		
							}
						}
						else if (humanToCheck.innerHTML == self) {
								span = document.createElement('span');
								span.innerHTML = ' | <b>(Me)</b>';
								top.insertBefore(span, humanToCheck.nextSibling);
						}
					}
				}
			}
		}
	},
	hide_deleted : function(msg) {
			if (msg.getElementsByClassName('message-top')[0]
					.getElementsByTagName('em')[0]
					&& msg.getElementsByClassName('message-top')[0]
							.getElementsByTagName('em')[0].innerHTML !== 'Moderator') {
				msg.getElementsByClassName('message-body')[0].style.display = 'none';
				var a = document.createElement('a');
				a.href = 'javascript.void(0)';
				a.innerHTML = 'Show Message';
				a.addEventListener('click', function(evt) {
					var hiddenMsg = evt.target.parentNode.parentNode
							.getElementsByClassName('message-body')[0];
					console.log(evt.target);
					hiddenMsg.style.display === 'none' ? hiddenMsg.style.display = 'block'
							: hiddenMsg.style.display = 'none';
				});
				msg.getElementsByClassName('message-top')[0].innerHTML += ' | ';
				msg.getElementsByClassName('message-top')[0].insertBefore(
						a, null);
			}
	},
	click_expand_thumbnail : function(msg) {
		// rewritten by xdrvonscottx
		// find all the placeholders before the images are loaded
		var phold = msg.getElementsByClassName("img-placeholder");

		for ( var i = 0; i < phold.length; i++) {
			if(phold[i].parentNode.parentNode.getAttribute('class') !== 'userpic-holder') {
				img_observer.observe(phold[i], {
					attributes : true,
					childList: true
				});
			}
		}
	},
	autoscroll_livelinks : function(mutation, index, live) {
		// live is undefined unless these functions are called 
		// from messageListHelper.livelinks
		if (live) {
			if (document.hidden 
					&& messageListHelper.autoscrollCheck(mutation) ) {
				// autoscrollCheck returns true if user has scrolled to bottom of page
				$.scrollTo(mutation);
			}
		}
	},
	autoscroll_livelinks_active : function(mutation, index, live) {
		if (live) {
			if (!document.hidden 
					&& messageListHelper.autoscrollCheck(mutation)) {
				// trigger after 10ms delay to prevent undesired 
				// behaviour in post_title_notification
				setTimeout(function() {
					messageListHelper.scrolling = true;
					$.scrollTo((mutation), 800);
				}, 10);
				setTimeout(function() {
					messageListHelper.scrolling = false;
					console.log('set scrolling to false');				
				}, 850);
			}
		}
	},
	post_title_notification : function(mutation, index, live) {
		if (live) {
			if (mutation.style.display === "none") {
				if (config.debug) {
					console.log('not updating for ignorated post');
				}
				return;
			}
			if (mutation.getElementsByClassName('message-top')[0]
					.getElementsByTagName('a')[0].innerHTML == document
					.getElementsByClassName('userbar')[0].getElementsByTagName('a')[0].innerHTML
					.replace(/ \((\d+)\)$/, "")) {
				return;
			}
			var posts = 1;
			var ud = '';
			if (document.getElementsByClassName('message-container')[50]) {
				ud = ud + "+";
			}
			if (document.title.match(/\(\d+\)/)) {
				posts = parseInt(document.title.match(/\((\d+)\)/)[1]);
				document.title = "(" + (posts + 1) + ud + ") "
						+ document.title.replace(/\(\d+\) /, "");
			} else {
				document.title = "(" + posts + ud + ") " + document.title;
			}
		}
	},
	notify_quote_post : function(mutation, index, live) {
		if (live) {
			if (!mutation.getElementsByClassName('quoted-message')) {
				return;
			}
			if (mutation.getElementsByClassName('message-top')[0]
					.getElementsByTagName('a')[0].innerHTML == document
					.getElementsByClassName('userbar')[0].getElementsByTagName('a')[0].innerHTML
					.replace(/ \((\d+)\)$/, "")) {
				// dont notify when quoting own posts
				return;
			}
			var not = false;
			var msg = mutation.getElementsByClassName('quoted-message');
			for (var i = 0, len = msg.length; i < len; i++) {
				if (msg[i].getElementsByClassName('message-top')[0]
						.getElementsByTagName('a')[0].innerHTML == document
						.getElementsByClassName('userbar')[0]
						.getElementsByTagName('a')[0].innerHTML.replace(
						/ \((.*)\)$/, "")) {
					if (msg[i].parentNode.className != 'quoted-message')
						// only display notification if user has been directly quoted
						not = true;
				}
			}
			if (not) {
				chrome.runtime.sendMessage({
					need : "notify",
					title : "Quoted by "
							+ mutation.getElementsByClassName('message-top')[0]
									.getElementsByTagName('a')[0].innerHTML,
					message : document.title.replace(/End of the Internet - /i, '')
				}, function(data) {
					console.log(data);
				});
			}
		}	
	}
}

var messageListHelper = {
	ignores : {},
	scrolling : false,
	gfycatLoader : function() {
		var gfycats = document.getElementsByClassName('gfycat');
		var gfycat, position, height;
		height = window.innerHeight;
		for (var i = 0, len = gfycats.length; i < len; i++) {
			gfycat = gfycats[i];			
			position = gfycat.getBoundingClientRect();
			// use window height + 200 to increase visibility of gfycatLoader
			if (position.top > height + 200 
					|| position.bottom < 0) {
				if (gfycat.getAttribute('name') == 'embedded'
					|| gfycat.getAttribute('name') == 'embedded_thumb')
					if (!gfycat.getElementsByTagName('video')[0].paused) {
					// pause hidden video elements to reduce CPU load
					gfycat.getElementsByTagName('video')[0].pause();
				}
			}
			else if (gfycat.tagName == 'A') {
				if (gfycat.getAttribute('name') == 'gfycat_thumb') {
					messageListHelper.thumbnailGfy(gfycat);
				} else {
					messageListHelper.placeholderGfy(gfycat);
				}
			}
			else if (gfycat.getAttribute('name') == 'placeholder') {
				messageListHelper.embedGfy(gfycat);
			}
			else if (gfycat.getAttribute('name') == 'embedded'
					&& gfycat.getElementsByTagName('video')[0].paused) {
				gfycat.getElementsByTagName('video')[0].play();
			}
		}
	},
	autoscrollCheck : function(mutation) {
		// checks whether user has scrolled to bottom of page
		var position = mutation.getBoundingClientRect();
		if (mutation.style.display == 'none'
				|| position.top > window.innerHeight) {
			return false;
		} else {
			return true;
		}
	},
	findCaret : function(ta) {
		var caret = 0;
		if (ta.selectionStart || ta.selectionStart == '0') {
			caret = ta.selectionStart; 
		}
		return (caret);
	},
	snippetHandler : function(ta, caret) {
		// detects keyword & replaces with snippet
		var text = ta.substring(0, caret);
		var words, word, snippet, temp, index, newCaret;
		var message = document.getElementsByName('message')[0];
		if (text.indexOf(' ') > -1) {
			words = text.split(' ');
			word = words[words.length - 1];
			if (word.indexOf('\n') > -1) {
				// makes sure that line breaks are accounted for
				words = word.split('\n');
				word = words[words.length - 1];
			}
		}
		else if (text.indexOf('\n') > -1) {
			// line break(s) in text - no spaces
			words = text.split('\n');
			word = words[words.length - 1];
		}
		else {
			// first word in post
			word = text;
		}
		for (var key in config.snippet_data) {
			if (key === word) {
				snippet = config.snippet_data[key];
				index = text.lastIndexOf(word);
				temp = text.substring(0, index);
				ta = ta.replace(text, temp + snippet);
				message.value = ta;
				// manually move caret to end of pasted snippet
				// as replacing message.value moves caret to end of input
				newCaret = ta.lastIndexOf(snippet) + snippet.length;
				message.setSelectionRange(newCaret, newCaret);
			}
		}
	},
	link_handler : function(msg) {
		if (msg) {
			var links = msg.getElementsByClassName("l");
		}
		else {
			var links = document.getElementsByClassName("l");
		}
		var link;
		// iterate backwards to prevent errors
		// when modifying live nodelist
		var i = links.length;
		while (i--) {
			link = links[i];
			if (link.title.indexOf("/index.php") == 0) {
				link.addEventListener("click", function(evt) {
					messageListHelper.wikiFix(this);
					evt.preventDefault();
				});
			}
			else if (link.title.indexOf("/imap/") == 0) {
				link.addEventListener("click", function(evt) {
					messageListHelper.imageFix(this);					
					evt.preventDefault();
				});	
			} 			
			else if (config.embed_on_hover 
					&& (link.title.indexOf("youtube.com/") > -1
					|| link.title.indexOf("youtu.be/") > -1)) {
				link.className = "youtube";
				// give each video link a unique id for embed/hide functions
				link.id = link.href + "&" + Math.random().toString(16).slice(2);			
				// attach event listener
				$(link).hoverIntent(
					function() {
						var _this = this;
						var color = $("table.message-body tr td.message").css("background-color");
						if (_this.className == "youtube") {
							$(_this).append($("<span style='display: inline; position: absolute; z-index: 1; left: 100; " 
									+ "background: " + color 
									+ ";'><a id='" + _this.id 
									+ "' class='embed' href='javascript:void(0)'>&nbsp<b>[Embed]</b></a></span>"));
						}
					}, function() {
						var _this = this;
						if (_this.className == "youtube") {
							$(_this).find("span").remove();
						}
					}
				);
				// pass vidLink to mutation observer to handle embed/hide clicks
				link_observer.observe(link, {
						subtree: true,
						characterData: true,
						childList: true,
						attributes: true
				});				
			}
			else if (config.embed_gfycat || config.embed_gfycat_thumbs) {
				if (link.title.indexOf("gfycat.com/") > -1) {
					link.className = "gfycat";
					if (config.embed_gfycat_thumbs 
							|| link.parentNode.className == "quoted-message") {
						link.setAttribute('name', "gfycat_thumb");
					}
				}
			}
		}
		// call gfycatLoader after loop has finished
		if (config.embed_gfycat || config.embed_gfycat_thumbs) {
			messageListHelper.gfycatLoader();
			window.addEventListener('scroll', messageListHelper.gfycatLoader);
			document.addEventListener('visibilitychange', messageListHelper.pauseGfy);
		}
	},	
	startBatchUpload : function(evt) {
		var chosen = document.getElementById('batch_uploads');
		if (chosen.files.length == 0) {
			alert('Select files and then click "Batch Upload"');
			return;
		}
		document.getElementsByClassName('quickpost-body')[0]
				.getElementsByTagName('b')[0].innerHTML += " (Uploading: 1/"
				+ chosen.files.length + ")";
		commonFunctions.asyncUpload(chosen.files, 0);
	},
	postTemplateAction : function(evt) {
		if (evt.target.className === "expand_post_template") {
			var ins = evt.target.parentNode;
			ins.removeChild(evt.target);
			var ia = document.createElement('a');
			ia.innerHTML = "&lt;"
			ia.className = "shrink_post_template";
			ia.href = '##';
			ins.innerHTML = '[';
			ins.insertBefore(ia, null);
			for ( var i in config.post_template_data) {
				var title = document.createElement('a');
				title.href = '##' + i;
				title.className = 'post_template_title';
				title.innerHTML = i;
				var titleS = document.createElement('span');
				titleS.style.paddingLeft = '3px';
				titleS.innerHTML = '[';
				titleS.insertBefore(title, null);
				titleS.innerHTML += ']';
				titleS.className = i;
				ins.insertBefore(titleS, null);
			}
			ins.innerHTML += ']';
		}
		if (evt.target.className === "shrink_post_template") {
			var ins = evt.target.parentNode;
			evt.target.parentNode.removeChild(evt.target);
			var ia = document.createElement('a');
			ia.innerHTML = "&gt;"
			ia.className = "expand_post_template";
			ia.href = '##';
			ins.innerHTML = '[';
			ins.insertBefore(ia, null);
			ins.innerHTML += ']';
		}
		if (evt.target.className === "post_template_title") {
			evt.target.id = 'post_action';
			var cdiv = document.getElementById('cdiv');
			var d = {};
			d.text = config.post_template_data[evt.target.parentNode.className].text;
			cdiv.innerText = JSON.stringify(d);
			cdiv.dispatchEvent(messageListHelper.postEvent);
		}
	},
	getTcMessages : function() {
		if (!config.tcs)
			config.tcs = {};
		var tcs = Array();
		var topic = window.location.href.match(/topic=(\d+)/)[1];
		var heads = document.getElementsByClassName('message-top');
		var tc;
		var haTopic;
		if (document.getElementsByClassName('message-top')[0].innerHTML
				.indexOf("> Human") !== -1) {
			haTopic = true;
			tc = "human #1";
		} else if ((!window.location.href.match('page') || window.location.href
				.match('page=1($|&)'))
				&& !window.location.href.match(/u=(\d+)/))
			tc = heads[0].getElementsByTagName('a')[0].innerHTML.toLowerCase();
		else {
			if (!config.tcs[topic]) {
				console.log('Unknown TC!');
				return;
			}
			tc = config.tcs[topic].tc;
		}
		if (!config.tcs[topic]) {
			config.tcs[topic] = {};
			config.tcs[topic].tc = tc;
			config.tcs[topic].date = new Date().getTime();
		}
		for (var i = 0; i < heads.length; i++) {
			if (haTopic && heads[i].innerHTML.indexOf("\">Human") == -1) {
				heads[i].innerHTML = heads[i].innerHTML.replace(/Human #(\d+)/,
						"<a href=\"#" + i + "\">Human #$1</a>");
			}
			if (heads[i].getElementsByTagName('a')[0].innerHTML.toLowerCase() == tc) {
				tcs.push(heads[i]);
			}
		}
		messageListHelper.saveTcs();
		return tcs;
	},
	toggleSpoilers : function(el) {
		var spans = document.getElementsByClassName('spoiler_on_close');
		var nnode;
		for (var i = 0; spans[i]; i++) {
			nnode = spans[i].getElementsByTagName('a')[0];
			messageListHelper.toggleSpoiler(nnode);
		}
	},
	toggleSpoiler : function(obj) {
		while (!/spoiler_(?:open|close)/.test(obj.className)) {
			obj = obj.parentNode;
		}
		obj.className = obj.className.indexOf('closed') != -1 ? obj.className
				.replace('closed', 'opened') : obj.className.replace('opened',
				'closed');
		return false;
	},
	expandThumbnail : function(evt) {
		if (config.debug)
			console.log("in expandThumbnail");
		var num_children = evt.target.parentNode.parentNode.childNodes.length;
		// first time expanding - only span
		if (num_children == 1) {
			if (config.debug)
				console.log("first time expanding - build span, load img");

			// build new span
			var newspan = document.createElement('span');
			newspan.setAttribute("class", "img-loaded");
			newspan.setAttribute("id", evt.target.parentNode.getAttribute('id')
					+ "_expanded");
			// build new img child for our newspan
			var newimg = document.createElement('img');
			// find fullsize image url
			var fullsize = evt.target.parentNode.parentNode
					.getAttribute('imgsrc');
			// set proper protocol
			if (window.location.protocol == "https:") {
				fullsize = fullsize.replace(/^http:/i, "https:");
			}
			newimg.src = fullsize;
			newspan.insertBefore(newimg, null);
			evt.target.parentNode.parentNode.insertBefore(newspan,
					evt.target.parentNode);
			evt.target.parentNode.style.display = "none"; // hide old img
		}
		// has been expanded before - just switch which node is hidden
		else if (num_children == 2) {
			if (config.debug)
				console.log("not first time expanding - toggle display status");

			// toggle their display statuses
			var children = evt.target.parentNode.parentNode.childNodes
			for (var i = 0; i < children.length; i++) {
				if (children[i].style.display == "none") {
					children[i].style.display = '';
				} else {
					children[i].style.display = "none";
				}
			}
		} else if (config.debug)
			console
					.log("I don't know what's going on with this image - weird number of siblings");
	},
	openNote : function(el) {
		var userID = el.href.match(/note(\d+)$/i)[1];
		if (document.getElementById("notepage")) {
			var pg = document.getElementById('notepage');
			userID = pg.parentNode.getElementsByTagName('a')[0].href
					.match(/user=(\d+)$/i)[1];
			config.usernote_notes[userID] = pg.value;
			pg.parentNode.removeChild(pg);
			messageListHelper.saveNotes();
		} else {
			var note = config.usernote_notes[userID];
			page = document.createElement('textarea');
			page.id = 'notepage';
			page.value = (note == undefined) ? "" : note;
			page.style.width = "100%";
			page.style.opacity = '.6';
			el.parentNode.appendChild(page);
		}
	},
	saveNotes : function() {
		chrome.runtime.sendMessage({
			need : "save",
			name : "usernote_notes",
			data : config.usernote_notes
		}, function(rsp) {
			console.log(rsp);
		});
	},
	resizeImg : function(el) {
		var width = el.width;
		if (width > config.img_max_width) {
			if (config.debug)
				console.log('resizing:', el);
			el.height = (el.height / (el.width / config.img_max_width));
			el.parentNode.style.height = el.height + 'px';
			el.width = config.img_max_width;
			el.parentNode.style.width = config.img_max_width + 'px';
		}
	},
	saveTcs : function() {
		var max = 40;
		var lowest = Infinity;
		var lowestTc;
		var numTcs = 0;
		for ( var i in config.tcs) {
			if (config.tcs[i].date < lowest) {
				lowestTc = i;
				lowest = config.tcs[i].date;
			}
			numTcs++;
		}
		if (numTcs > max)
			delete config.tcs[lowestTc];
		chrome.runtime.sendMessage({
			need : "save",
			name : "tcs",
			data : config.tcs
		});
	},
	clearUnreadPosts : function(evt) {
		if (!document.title.match(/\(\d+\+?\)/)
				|| messageListHelper.scrolling == true
				|| document.hidden) {
			// do nothing
			return;
		}
		if (document.title.match(/\(\d+\+?\)/)) {
			var newTitle = document.title.replace(/\(\d+\+?\) /, "");
			document.title = newTitle;
		}
	},
	quoteHandler: function() {
		var that = this;
		var bgColor = $(event.target.parentNode).css('background-color');
		// create hidden notification so we can use fadeIn() later
		$(that).append($('<span id="copied" style="display: none; position: absolute; z-index: 1; left: 100; ' 
				+ 'background: ' + bgColor 
				+ ';"><a href="javascript.void(0)">&nbsp<b>[copied to clipboard]</b></a></span>'));
		var quoteID = that.id;
		var quotedMsg = document.querySelector('[msgid="' + quoteID + '"]');
		var html = quotedMsg.innerHTML;
		var htmlElements = quotedMsg.getElementsByTagName("*");
		//var htmlElements = $(quotedMsg).find("*").not( 'b, i, u, br, div' );
		var htmlToRemove, htmlElement, imageHandled, first, last, pre;
		var link = {};
		var spoiler = {};
		var quote = {};
		// remove sig from html
		if (html.indexOf('---') > -1) {
			html = '<quote msgid="' + quoteID + '">' + html.substring(0, (html.lastIndexOf('---'))) + '</quote>';
		} else {
			html = '<quote msgid="' + quoteID + '">' + html + '</quote>';
		}
		//console.log(html);
		for (var i = 0, len = htmlElements.length; i < len; i++) {
			// iterate through elements in document and find/replace relevant parts of copied html
			// so that formatting is maintained in quoted post
			htmlElement = htmlElements[i];
			link.content = '';
			imageHandled = false;
			if (htmlElement.className == 'pr') {
				// handle pre tags
				console.log(htmlElement);
				console.log(htmlElement.attributes);
				pre = htmlElement.outerHTML;
				pre = pre.replace('<span class="pr">', '<pre>');
				pre = pre.replace('</span>', '</pre>');
				html = html.replace(htmlElement.outerHTML, pre);
			}
			if (htmlElement.firstChild) {
				//  handle images
				if (htmlElement.firstChild.className == 'img-loaded' 
						&& htmlElement.outerHTML.indexOf('<span class="img-loaded"') !== 0) {
					console.log(htmlElement);
					console.log(htmlElement.attributes);
					link.content = htmlElement.firstChild.innerHTML;
					link.content = link.content.replace('<img src="', '');
					link.first = link.content.indexOf('"');
					link.last = link.content.indexOf('">');
					link.toRemove = link.content.substring(link.first, link.last);
					link.content = link.content.replace(link.toRemove, '');
					link.content = link.content.replace('">', '');
					link.content = link.content.replace('//', 'http://');
					link.content = link.content.replace('dealtwith.it', 'endoftheinter.net');
					link.content = '<img src="' + link.content + '" />' + "\n";
					imageHandled = true;
				} else if (htmlElement.firstChild.className == 'img-placeholder' 
						&& htmlElement.outerHTML.indexOf('<span class="img-placeholder"') !== 0) {
					console.log(htmlElement);
					console.log(htmlElement.attributes);						
					link.content = htmlElement.outerHTML;
					link.first = link.content.indexOf('imgsrc="');
					link.last = link.content.indexOf('" href');
					link.toRemove = link.content.substring(0, link.first);
					link.content = link.content.replace(link.toRemove, '');
					link.toRemove = link.content.substring(link.last, link.content.length);
					link.content = link.content.replace(link.toRemove, '');
					link.content = link.content.replace('imgsrc="', '');
					link.content = link.content.replace(' href="//images.en', '');
					link.content = '<img src="' + link.content + ' />' + "\n";
					imageHandled = true;
				}
			}
			if (htmlElement.tagName == 'A' && !imageHandled) {
				// handle links
				if (htmlElement.title.indexOf("/showmessages.php") > -1) {
					link.content = htmlElement.title.replace('/showmessages.php'
							, 'http://boards.endoftheinter.net/showmessages.php');
				} else if (htmlElement.className == 'jump-arrow' 
						|| htmlElement.id == 'notebook' 
						|| htmlElement.parentElement.attributes.className == 'spoiler_on_close' 
						|| htmlElement.parentElement.attributes.className == 'spoiler_on_open' 
						|| htmlElement.outerHTML.indexOf('<a class="caption" href="#">') == 0) {
					// ignore these elements
					link.content = '';
				} else {
					link.content = htmlElement.href;
				}
			}
			if (link.content) {
				html = html.replace(htmlElement.outerHTML, link.content);
			}
			if (htmlElement.className == 'spoiler_closed') {
				// handle spoiler tagged content
				spoiler.contents = '';
				spoiler.toReplace = htmlElement.outerHTML;
				spoiler.closed = htmlElement.getElementsByClassName('spoiler_on_close');
				spoiler.open = spoiler.closed[0].nextSibling.innerText;
				spoiler.title = spoiler.closed[0].innerText.replace(/<|\/>/g, '');
				first = spoiler.closed[0].innerText.replace(' />', '>');
				last = first.replace('<', '</');
				if (spoiler.closed[0].getElementsByClassName('imgs')) {
					spoiler.imgs = htmlElement.getElementsByClassName('imgs');
					for (var j = 0, l = spoiler.imgs.length; j < l; j++) {
						spoiler.img = spoiler.imgs[j];
						spoiler.imgurl = spoiler.img.firstChild.getAttribute('imgsrc');
						spoiler.contents += '<img src="' + spoiler.imgurl + '" />' + '\n';
					}
					spoiler.finished = '<spoiler caption="' + spoiler.title + '">' + spoiler.contents + '</spoiler>';
				} else {
					spoiler.contents = spoiler.open.replace(first, '');
					spoiler.contents = spoiler.contents.replace(last, '');
					spoiler.finished = '<spoiler caption="' + spoiler.title + '">' + spoiler.contents + '</spoiler>';
				}
				if (html.indexOf(spoiler.toReplace) > -1) {
					html = html.replace(spoiler.toReplace, spoiler.finished);
				}
			}
			if (htmlElement.className == 'quoted-message') {
				quote.msgid = htmlElement.attributes.msgid.value;
				if (!quote.msgid) {
					quote.finished = '<quote>' + htmlElement.innerText + '</quote>';
				} else if (htmlElement.lastChild.data) {
					quote.finished = '<quote msgid="' + quote.msgid + '">' + htmlElement.lastChild.data + '</quote>';
				} else if (htmlElement.getElementsByClassName('thumbnailed_image')) {
					quote.html = htmlElement.lastChild.innerHTML;
					first = quote.html.indexOf('imgsrc="');
					last = quote.html.indexOf('lass="');
					quote.img = quote.html.substring(first, last);
					quote.img = quote.img.replace(/imgsrc/g, '<img src');
					quote.img = quote.img.replace(/" c/g, '" />');
					quote.finished = '<quote msgid="' + quote.msgid + '">' + quote.img + '</quote>';
				}
				// todo - maintain proper html for nested quotes
				quote.finished = quote.finished.replace(/|⇗ | Notes/g, '');
				html = html.replace(htmlElement.outerHTML, quote.finished);
			}
		}
		// clean up html
		html = html.replace(/<div class="imgs">/g, '');
		html = html.replace(/<div style="clear:both">/g, '');
		html = html.replace(/<\/div>/g, '');
		html = html.replace(/<br>/g, '');
		html = html.replace(/&lt;/g, '<');
		html = html.replace(/&gt;/g, '>');
		// plain text quoting - needs separate option
		/*var text = quotedMsg.innerText;
		var quotedText = '<quote msgid="' + quoteID + '">' + text.substring(0, (text.lastIndexOf('---') - 1)) + '</quote>';*/
		var json = {
			"quote": ""
		};
		json.quote = html;
		chrome.runtime.sendMessage(json, function(response) {
			// copies json data to clipboard
			if (config.debug) console.log(response.clipboard);
		});
		// alert user
		$("#copied").fadeIn(200);
		setTimeout(function() {
			$(that).find("span:last").fadeOut(400);
		}, 1500);
		setTimeout(function() {
			$(that).find("span:last").remove();
		}, 2000);
	},
	archiveQuoteButtons: function() {
		var hostname = window.location.hostname;
		var topicId = window.location.search.replace("?topic=", "");
		var links;
		var msgs;
		var containers;
		var container;
		var tops = [];
		var msgID;
		var quote;
		if (hostname.indexOf("archives") > -1) {
			links = document.getElementsByTagName("a");
			msgs = document.getElementsByClassName("message");
			containers = document.getElementsByClassName("message-container");
			for (var i = 0, len = containers.length; i < len; i++) {
				container = containers[i];
				tops[i] = container.getElementsByClassName("message-top")[0];
				msgID = msgs[i].getAttribute("msgid");
				quote = document.createElement("a");
				quoteText = document.createTextNode("Quote");
				space = document.createTextNode(" | ");
				quote.appendChild(quoteText);
				quote.href = "javascript:void(0)";
				quote.setAttribute('onclick', "QuickPost.publish('quote', this);");
				quote.id = msgID;
				quote.className = "archivequote";
				tops[i].appendChild(space);
				tops[i].appendChild(quote);
			}
		}
		$("div.message-top").on("click", "a.archivequote", messageListHelper.quoteHandler);
	},
	init : function() {
		chrome.runtime.sendMessage({
			need : "config",
			tcs : true
		}, function(conf) {
			// set up globalPort so we can communicate with background script
			messageListHelper.globalPort = chrome.runtime.connect();
			config = conf.data;
			config.tcs = conf.tcs;
			// turn ignorator list into array before running messageList functions
			messageListHelper.ignores = config.ignorator_list.split(',');
			var ignore;
			for (var r = 0, len = messageListHelper.ignores.length; r < len; r++) {
				ignore = messageListHelper.ignores[r].toLowerCase().trim();
				messageListHelper.ignores[r] = ignore;
			}
			var msgs = document.getElementsByClassName('message-container');
			var msg, len;
			var pm = '';
			// add _pm to config keys to check for PM config values
			if (window.location.href.match('inboxthread')) {
				pm = "_pm";
			}
			// iterate over miscFunctions and messageList
			// objects & call function if config value is true		
			try {
				for (var k in miscFunctions) {
					if (config[k + pm]) {
							miscFunctions[k]();
					}
				}
			}
			catch (err) {
				console.log("error in " + k + ":", err);
			}		
			// iterate over first 5 message-containers (or fewer)
			if (msgs.length < 4) {
				len = msgs.length;
			}
			else {
				len = 4;
			}
			try {
				for (var j = 0; j < len; j++) {
					msg = msgs[j];
					// iterate over functions in messageList
					for (var k in messageList) {
						if (config[k + pm]) {
								// pass msg and index value to function
								messageList[k](msg, j);
						}
					}
				}
			}
			catch (err) {
				console.log("error in " + k + ":", err);
			}		
			// page will appear to have been fully loaded by this point
			var t1 = performance.now();
			console.log("Processed in " + (t1 - t0) + " milliseconds.");		
			if (len == 4) {
				// iterate over rest of messages
				try {
					for (j = len, msg; msg = msgs[j]; j++) {
						for (var k in messageList) {
							if (config[k + pm]) {
									messageList[k](msg, j);
							}
						}
					}
				}
				catch (err) {
					console.log("error in " + k + ":", err);
				}				
			}
			// send ignorator data to background script
			messageListHelper.globalPort.postMessage({
				action : 'ignorator_update',
				ignorator : ignorated,
				scope : "messageList"
			});		
			// call any functions that don't exist in messageList object
			messageListHelper.archiveQuoteButtons();			
			messageListHelper.link_handler();
			
			messageListHelper.globalPort.onMessage.addListener(function(msg) {
				// ignorator_update action is handled by background script
				if (msg.action !== 'ignorator_update') {			
					switch (msg.action) {
						case "showIgnorated":				
							if (config.debug) {
								console.log("showing hidden msg", msg.ids);
							}
							var tops = document.getElementsByClassName('message-top');
							for (var i = 0; i < msg.ids.length; i++) {
								if (config.debug) {
									console.log(tops[msg.ids[i]]);
								}
								tops[msg.ids[i]].parentNode.style.display = 'block';
								tops[msg.ids[i]].parentNode.style.opacity = '.7';
							}
							break;
						default:
							if (config.debug)
								console.log('invalid action', msg);
							break;
					}
				}
			});
			if (config.new_page_notify) {
				if (config.debug) {
					console.log('listening for new page');
				}
				var target = document.getElementById('nextpage');
				var mutation;
				var observer = new MutationObserver(function(mutations) {
					for (var i = 0, mutation; mutation = mutations[i]; i++) {
						if (mutation.type === 'attributes' && target.style.display === 'block') {
							chrome.runtime.sendMessage({
								need: "notify",
								title: "New Page Created",
								message: document.title
							});
						}
					}
				});
				var obsconfig = {
					attributes: true
				};
				observer.observe(target, obsconfig);
			}
			var t2 = performance.now();
			console.log("Fully processed in " + (t2 - t0) + " milliseconds.");				
		});
	},
	loadNextPage : function() {
		var page = 1;
		if (window.location.href.match('asyncpg')) {
			page = parseInt(window.location.href.match('asyncpg=(\d+)')[1]);
		} else if (window.location.href.match('page')) {
			page = parseInt(window.location.href.match('page=(\d+)')[1]);
		}
		page++;
		var topic = window.location.href.match('topic=(\d+)')[1];
	},
	qpTagButton : function(e) {
		if (e.target.tagName != 'INPUT') {
			return 0;
		}
		// from foxlinks
		var tag = e.target.id;
		var open = new RegExp("\\*", "m");
		var ta = document.getElementsByName('message')[0];
		var st = ta.scrollTop;
		var before = ta.value.substring(0, ta.selectionStart);
		var after = ta.value.substring(ta.selectionEnd, ta.value.length);
		var select = ta.value.substring(ta.selectionStart, ta.selectionEnd);

		if (ta.selectionStart == ta.selectionEnd) {
			if (open.test(e.target.value)) {
				e.target.value = e.target.name;
				var focusPoint = ta.selectionStart + tag.length + 3;
				ta.value = before + "</" + tag + ">" + after;
			} else {
				e.target.value = e.target.name + "*";
				var focusPoint = ta.selectionStart + tag.length + 2;
				ta.value = before + "<" + tag + ">" + after;
			}

			ta.selectionStart = focusPoint;
		} else {
			var focusPoint = ta.selectionStart + (tag.length * 2)
					+ select.length + 5;
			ta.value = before + "<" + tag + ">" + select + "</" + tag + ">"
					+ after;
			ta.selectionStart = before.length;
		}

		ta.selectionEnd = focusPoint;
		ta.scrollTop = st;
		ta.focus();
	},
	livelinks : function(mutation) {
		var index = document.getElementsByClassName('message-container').length -1;
		var live = true;
		var pm = '';
		if (window.location.href.match('inboxthread')) {
			pm = "_pm";
		}
		try {
			for (var i in messageList) {
				if (config[i + pm]) {
						messageList[i](mutation, index, live);
				}
			}
		}		
		catch (err) {
			console.log("error in livelinks " + i + ":", err);
		}
		messageListHelper.link_handler(mutation);
		// send ignorator data to background script
		messageListHelper.globalPort.postMessage({
			action : 'ignorator_update',
			ignorator : ignorated,
			scope : "messageList"
		});				
	},
	wikiFix: function(_this) {
		window.open(_this.href.replace("boards", "wiki"));
	},
	imageFix: function(_this) {
		window.open(_this.href.replace("boards", "images"));
	},
	placeholderGfy: function(gfyLink) {
		var https, placeholder, url, splitURL, code, xhrURL, xhr;
		var temp, width, height, webmUrl, position;
		placeholder = document.createElement('div');
		url = gfyLink.getAttribute('href');
		splitURL = url.split('/').slice(-1);
		code = splitURL.join('/');
		xhrURL = 'http://gfycat.com/cajax/get/' + code;
		if (window.location.protocol == 'https:') {
			https = true;
			xhrURL = xhrURL.replace('http', 'https');
		}
		xhr = new XMLHttpRequest();
		xhr.open("GET", xhrURL, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				// gfycat api provides width, height, & webm url
				temp = JSON.parse(xhr.responseText);
				width = temp.gfyItem.width;
				height = temp.gfyItem.height;
				webmUrl = temp.gfyItem.webmUrl;
				if (https) {
					webmUrl = webmUrl.replace('http', 'https');
				}
				if (config.resize_gfys 
						&& width > config.gfy_max_width) {
					// scale video size to match gfy_max_width value
					height = (height / (width / config.gfy_max_width));
					width = config.gfy_max_width;
				}
				// create placeholder
				placeholder.className = 'gfycat';
				placeholder.id = webmUrl;
				placeholder.setAttribute('name', 'placeholder');
				placeholder.innerHTML = '<video width="' + width + '" height="' + height + '" loop >'
						+ '</video>';
				// prevent "Cannot read property 'replaceChild' of null" error
				if (gfyLink.parentNode) {
					gfyLink.parentNode.replaceChild(placeholder, gfyLink);
					// check if placeholder is visible (some placeholders will be off screen)
					position = placeholder.getBoundingClientRect();
					if (position.top > window.innerHeight) {
						return;
					} else {
						// pass placeholder video element to embed function
						messageListHelper.embedGfy(placeholder);
					}
				}
			}
		}
		xhr.send();
	},
	thumbnailGfy: function(gfyLink) {
		var https, placeholder, url, splitURL, code, xhrURL, xhr;
		var thumbnailURL;
		var temp, width, height, webmUrl;
		var img, video;
		placeholder = document.createElement('div');
		url = gfyLink.getAttribute('href');
		splitURL = url.split('/').slice(-1);
		code = splitURL.join('/');
		thumbnailURL = 'http://thumbs.gfycat.com/' + code + '-poster.jpg';
		xhrURL = 'http://gfycat.com/cajax/get/' + code;
		if (window.location.protocol == 'https:') {
			https = true;
			xhrURL = xhrURL.replace('http', 'https');
			thumbnailURL = thumbnailURL.replace('http', 'https');
		}
		xhr = new XMLHttpRequest();
		xhr.open("GET", xhrURL, true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200) {
				// gfycat api provides width, height, & webm url
				temp = JSON.parse(xhr.responseText);
				width = temp.gfyItem.width;
				height = temp.gfyItem.height;
				webmUrl = temp.gfyItem.webmUrl;
				if (https) {
					webmUrl = webmUrl.replace('http', 'https');
				}
				if (config.resize_gfys 
						&& width > config.gfy_max_width) {
					// scale video size to match gfy_max_width value
					height = (height / (width / config.gfy_max_width));
					width = config.gfy_max_width;
				}
				// create placeholder
				placeholder.className = 'gfycat';
				placeholder.id = webmUrl;
				placeholder.innerHTML = '<img src="' + thumbnailURL 
						+ '" width="' + width + '" height="' + height + '">'
						+ '</img>';
				// prevent "Cannot read property 'replaceChild' of null" error
				if (gfyLink.parentNode) {
					gfyLink.parentNode.replaceChild(placeholder, gfyLink);
					// add click listener to replace img with video
					img = placeholder.getElementsByTagName('img')[0];
					img.title = "Click to play";
					img.addEventListener('click', function(ev) {
						ev.preventDefault();
						placeholder.innerHTML = '<video width="' + width 
								+ '" height="' + height 
								+ '" loop >'
								+ '</video>';
						video = placeholder.getElementsByTagName('video')[0];
						placeholder.setAttribute('name', 'embedded_thumb');
						// placeholder id is webm url
						video.src = placeholder.id;
						video.title = "Click to pause";
						video.play();
						// add click listener to toggle play/pause
						video.addEventListener('click', function(ev) {
							video.title = "Click to play/pause";
							if (!video.paused) {
								video.pause();
							}
							else {
								video.play();
							}
						});
					});
				}
			}
		}
		xhr.send();
	},
	embedGfy: function(placeholder) {
		var video = placeholder.getElementsByTagName('video')[0];
		placeholder.setAttribute('name', 'embedded');
		// placeholder id is webm url
		video.src = placeholder.id;
		video.play();
	},
	pauseGfy: function() {
		// pause all gfycat videos if document is hidden
		if (document.hidden) {
			var videos = document.getElementsByTagName('video');
			var video;
			for (var i = 0, len = videos.length; i < len; i++) {
				video = videos[i];
				if (video.src &&
						!video.paused) {
					video.pause();
				}
			}
		}
		else {
			// call gfycatLoader so that only visible gfycat videos are played
			// if document visibility changes from hidden to visible
			messageListHelper.gfycatLoader();
		}
	},
	embedYoutube: function(_this) {
		if (!_this.embedded) {
			var toEmbed = document.getElementById(_this.id);
			if (toEmbed.className == "youtube") {	
				var color = $("table.message-body tr td.message").css("background-color");		
				var videoCode;
				var embedHTML;
				var href = toEmbed.href;
				var timeEquals = href.match(/(\?|\&|#)(t=)/);
				if (timeEquals) {
					var substring = href.substring(timeEquals.index, href.length);
					var time = substring.match(/([0-9])+([h|m|s])?/g);
				}
				var regExp = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/;
				var match = _this.id.match(regExp);
				if (match && match[2].length == 11) {
					videoCode = match[2];
				} else {
					videoCode = match;
				}
				if (time) {
					// convert into seconds
					var splitTime, temp;
					var seconds = 0;
					for (var i = 0, len = time.length; i < len; i++) {
						splitTime = time[i];
						if (!splitTime.match(/([h|m|s])/)) {
							// timecode is probably in format "#t=xx" 
							seconds += splitTime;
						}
						else if (splitTime.indexOf('h') > -1) {
							temp = Number(splitTime.replace('h', ''), 10);
							seconds += temp * 60 * 60;
						}
						else if (splitTime.indexOf('m') > -1) {
							temp = parseInt(splitTime.replace('m', ''), 10);
							seconds += temp * 60;
						}
						else if (splitTime.indexOf('s') > -1) {
							seconds += parseInt(splitTime.replace('s', ''), 10);
						}
					}
					videoCode += "?start=" + seconds + "'";
				}				
				embedHTML = "<span style='display: inline; position: absolute; z-index: 1; left: 100; background: " + color + ";'>" 
									+ "<a id='" + _this.id + "' class='hide' href='javascript:void(0)'>&nbsp<b>[Hide]</b></a></span>" 
									+ "<br><div class='youtube'>" 
									+ "<iframe id='" + "yt" + _this.id + "' type='text/html' width='640' height='390'" 
									+ "src='https://www.youtube.com/embed/" + videoCode 
									+ "'?autoplay='0' frameborder='0'/>" 
									+ "</div>";
				$(toEmbed).find("span:last").remove();
				toEmbed.className = "hideme";
				toEmbed.innerHTML += embedHTML;
				_this.embedded = true;
			}
		}
	},
	hideYoutube: function(_this) {
		if (!_this.hidden) {
			var toEmbed = document.getElementById(_this.id);
			$(toEmbed).find("iframe:last").remove();
			$(toEmbed).find("br:last").remove();
			$(toEmbed).find("div:last").remove();
			toEmbed.className = "youtube";
			_this.hidden = true;
		}
	}
}

messageListHelper.init();
var livelinks = new MutationObserver(function(mutations) {
	var mutation;
	for (var i = 0, len = mutations.length; i < len; i++) {
		mutation = mutations[i];
		if (!mutation.target.lastChild 
				|| !mutation.target.lastChild.firstChild 
				|| !mutation.target.lastChild.firstChild.className) {
			return;
		}
		if (mutation.target.lastChild.firstChild.getAttribute('class') == 'message-container') {
			// send new message container to livelinks method
			messageListHelper.livelinks(mutation.target.lastChild.firstChild);
		}
	}
});

livelinks.observe(document.getElementById('u0_1'), {
		subtree: true,
		childList: true
});
