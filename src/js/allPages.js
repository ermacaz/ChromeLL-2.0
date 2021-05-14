var allPages = {
	config: {},
	cachedEvent: '',
	
	/**
	 *  Functions in this object are iterated over & executed on every page.
	 */
	
	commonFunctions: {
		image_paste: function() {
			// text area on post message page
			var textArea = document.getElementById("message");
			if (textArea != undefined) {
				textArea.addEventListener('paste', (event) => {
					var items = (event.clipboardData || event.originalEvent.clipboardData).items;
					for (index in items) {
						var item = items[index];
						if (item.kind === 'file') {
							var blob = item.getAsFile();
							allPages.asyncUploadHandler(blob, function (e){
								allPages.insertIntoTextarea(e)
							});
						}
					}
				});
			}
			
			// text area when hitting ~ in topic
			var textArea2 = document.getElementsByClassName('quickpost-body')[0].getElementsByTagName('textarea')[0]
			if (textArea2  != undefined) {
				textArea2.addEventListener('paste', (event) => {
					var items = (event.clipboardData || event.originalEvent.clipboardData).items;
					for (index in items) {
						var item = items[index];
						if (item.kind === 'file') {
							var blob = item.getAsFile();
							allPages.asyncUploadHandler(blob, function (e){
								allPages.insertIntoTextarea(e)
							});
						}
					}
				});
			}
		},
		
		error_check : function() {
			if (document.body.style.backgroundImage.indexOf('errorlinks.png') > -1) {
				var dialog = document.createElement('dialog');
				dialog.style.border = '1px solid rgba(0, 0, 0, 0.3)';
				dialog.style.borderRadius = '6px';
				dialog.style.boxShadow = '0 3px 7px rgba(0, 0, 0, 0.3)';
				
				dialog.style.backgroundImage = "url('" + chrome.extension.getURL('/src/images/popup.png') + "')";
				dialog.style.backgroundColor = 'white';
				dialog.style.backgroundRepeat = 'no-repeat';
				dialog.style.backgroundPosition = 'center bottom';
				
				dialog.innerHTML = 'Error detected... redirect to history.php?' + '<br>'
						+ '(popup generated by ChromeLL)' + '<br>' + '<br>';
				
				var redirect = document.createElement('button');				
				redirect.innerText = 'Redirect';
				
				redirect.addEventListener('click', () => {
					window.location.href = window.location.protocol + '//boards.endoftheinter.net/history.php?b';
				});
				
				var close = document.createElement('button');
				close.innerText = 'Close';
				
				close.addEventListener('click', () => {
					dialog.close();
				});
				
				document.body.style.overflow = "hidden";
				
				dialog.appendChild(redirect);
				dialog.appendChild(close);
				document.body.appendChild(dialog);
				
				dialog.showModal();
				
				// Stop callCommonFunctions() from iterating 
				allPages.commonFunctions = {};
			}
		},
		
		notify_pm : function() {
			var userbar_pms = document.getElementById('userbar_pms');
			
			if (!userbar_pms) {
				return;
			}

			// Check for mutations to userbar_pms element, so we can get current number of unread PMs
			
			var observer = new MutationObserver(() => {
				
				if (userbar_pms.style.display == 'none' && allPages.config.pms != 0) {
					// clear unread message count from config
					allPages.config.pms = 0;
					chrome.runtime.sendMessage({
							need : "save",
							name : "pms",
							data : allPages.config.pms
					});
				}
				
				else if (userbar_pms.style.display != 'none') {
					var pms_text = userbar_pms.innerText;
					var pm_number = parseInt(pms_text.match(/\((\d+)\)/)[1]);
					var notify_title, notify_msg;
					// compare pm_number to last known value for pm_number
					if (pm_number > allPages.config.pms) {
						// you have mail
						if (pm_number == 1) {
							notify_title = 'New PM';
							notify_msg = 'You have 1 unread private message.';
						}
						else {
							notify_title = 'New PMs';
							notify_msg = 'You have ' + pm_number
									+ ' unread private messages.';
						}
						
						// notify user and save current pm_number
						chrome.runtime.sendMessage({
								need: "notify",
								title: notify_title,
								message: notify_msg
						}, null);
						
						allPages.config.pms = pm_number;
						
						chrome.runtime.sendMessage({
								need : "save",
								name : "pms",
								data : allPages.config.pms
						});
					}
					else {
						// user has unread PMs, but no new PMs
						return;
					}
				}
			});
			
			observer.observe(userbar_pms, {
					attributes: true,
					childList: true
			});
		},
		
		history_menubar : function() {
			var link = document.createElement('a');
			link.innerHTML = 'Message History';
			if (allPages.config.history_menubar_classic)
				link.href = '//boards.endoftheinter.net/history.php';
			else
				link.href = '//boards.endoftheinter.net/topics/Posted';
			if (document.body.className === 'regular') {
				var sep = document.createElement('span');
				var menubar = document.getElementsByClassName('menubar')[0];
				sep.innerHTML = ' | ';
				menubar.insertBefore(link, menubar.getElementsByTagName('br')[0]);
				menubar.insertBefore(sep, link);
			} else if (document.body.className === 'classic') {
				var br = document.createElement('br');
				document.getElementsByClassName('classic3')[0].insertBefore(link,
						null);
				document.getElementsByClassName('classic3')[0].insertBefore(br,
						link);
			}
		},
		
		float_userbar : function() {
			var id = document.createElement('div');
			var userbar = document.getElementsByClassName('userbar')[0];
			var menubar = document.getElementsByClassName('menubar')[0];
			document.getElementsByClassName('body')[0].removeChild(userbar);
			document.getElementsByClassName('body')[0].removeChild(menubar);
			id.insertBefore(menubar, null);
			id.insertBefore(userbar, null);
			id.style.position = 'fixed';
			id.style.width = '100%';
			id.style.top = '0';
			userbar.style.marginTop = '-2px';
			userbar.style.borderBottomLeftRadius = '5px';
			userbar.style.borderBottomRightRadius = '5px';
			allPages.config.remove_links ? document.getElementsByTagName('h1')[0].style.paddingTop = '20px'
					: document.getElementsByTagName('h1')[0].style.paddingTop = '40px';
			document.getElementsByClassName('body')[0].insertBefore(id, null);
		},
		
		float_userbar_bottom : function() {
			var menubar = document.getElementsByClassName('menubar')[0];
			var userbar = document.getElementsByClassName('userbar')[0];
			menubar.style.position = "fixed";
			menubar.style.width = "99%";
			menubar.style.bottom = "-2px";
			userbar.style.position = "fixed";
			userbar.style.borderTopLeftRadius = '5px';
			userbar.style.borderTopRightRadius = '5px';
			userbar.style.width = "99%";
			userbar.style.bottom = "33px";
			menubar.style.marginRight = "20px";
			menubar.style.zIndex = '2';
			userbar.style.zIndex = '2';
		},
		
		short_title : function() {
			document.title = document.title.replace(/End of the Internet - /i, '');
		},
		
		user_info_popup : function() {		
			// Create placeholder popup that we can populate later.
			var links = ["PM", "GT", "BT", "HIGHLIGHT", "UNHIGHLIGHT", "IGNORATE"];					
			var popupElement = document.createElement('div');			
			popupElement.className = 'user_info_popup';
			popupElement.id = 'user-popup-div';
			var info = document.createElement('div');
			info.className = 'user_info_popup';
			info.id = 'popup_info';
			var user = document.createElement('div');
			user.className = 'user_info_popup';
			user.id = 'popup_user';

			for (var i = 0, len = links.length; i < len; i++) {
				var span = document.createElement('span');
				span.className = 'popup_link';
				span.innerHTML = links[i];
				span.addEventListener('click', allPages.userInfoPopup.clickHandler);
				info.appendChild(span);
			}
			
			info.style.display = 'none';
			
			popupElement.appendChild(user);
			popupElement.appendChild(info);
			document.body.appendChild(popupElement);				
			
			document.addEventListener('click', (evt) => {
				if (evt.target.className != 'popup_link') {
					allPages.userInfoPopup.hide();
				}
			});
		}
	},
	
	/**
	 *  Methods which create user info popup and populate it with info from user's profile page.
	 */
	
	userInfoPopup: {
		
		handler: function() {
			// Use cached event as this method is called from setTimeout
			var evt = allPages.cachedEvent;			
			var usernameAnchor = evt.target;
			
			var boundingRect = usernameAnchor.getBoundingClientRect();
			var x = (boundingRect.left + (boundingRect.width / 2)) - document.body.scrollLeft + usernameAnchor.clientLeft;
			var y = boundingRect.top + document.body.scrollTop + usernameAnchor.clientTop;
			
			var profileURL = usernameAnchor.href;
			this.username = usernameAnchor.innerHTML;
			this.currentPost = usernameAnchor.parentNode;			
			this.userId = profileURL.match(/user=(\d+)/)[1];
			
			var gs = this.checkAccountAge(this.userId);
			
			var xhr = new XMLHttpRequest();
			xhr.open("GET", profileURL, true);			
			xhr.onload = function() {
				if (this.status == 200) {
					allPages.userInfoPopup.scrapeProfile(this.responseText);
				}
			};		
			xhr.send();
			
			var popup = document.getElementById('popup_user');

			popup.innerHTML = '<div id="username" class="user_info_popup">' + this.username + " " + gs 
					+ ' <span id="popup_uid" class="user_info_popup">' + this.userId + '</span></div>'					
					+ '<div id="namechange" class="user_info_popup"></div>'					
					+ '<div id="rep" class="user_info_popup"><span id="popup_loading" class="user_info_popup">loading...</span></div>'
					+ '<div id="online" class="user_info_popup"></div>' 
					+ '<div id="punish" class="user_info_popup"></div>';
					
			var popupContainer = document.getElementById('user-popup-div');
			document.getElementById('popup_info').style.display = 'block';						
			
			// Modify coordinates so that arrow in popup points to selected username element
			popupContainer.style.left = (x - 35) + "px";
			popupContainer.style.top = (y + 25) + "px";
			popupContainer.style.display = 'block';
			
			// Add mousemove listener to detect when popup should be closed
			document.addEventListener('mousemove', this.mousemoveHandler);			
		},
		
		scrapeProfile: function(responseText) {
			var html = document.createElement('html');
			html.innerHTML = responseText;
			var tds = html.getElementsByTagName('td');
			// var status, aliases, rep;
			for (var i = 0, len = tds.length; i < len; i++) {
				var td = tds[i];
				if (td.innerText.indexOf('Status') > -1) {
					var status = tds[i + 1].innerText;
				}
				if (td.innerText.indexOf('Formerly') > -1) {
					var aliases = tds[i + 1].innerText;
				}
				if (td.innerText.indexOf('Reputation') > -1) {
					var rep = tds[i + 1].innerHTML;
				}
			}
			this.update(html, status, aliases, rep);
		},
		
		update: function(html, status, aliases, rep) {
			var placeholderElement = document.getElementById("popup_loading");			
			var aliasesElement = document.getElementById("namechange");
			var onlineElement = document.getElementById('online');
			var statusElement = document.getElementById('punish');
			var repElement = document.getElementById('rep');
			
			if (placeholderElement) {
				placeholderElement.style.display = 'none';
			}
			
			if (repElement) {
				repElement.innerHTML = rep;
			}
			
			if (allPages.config.show_old_name) {
				if (aliases) {
					aliasesElement.innerHTML = "<br>Formerly known as: <b>" + aliases + '</b>';
				}
			}	
			if (html.innerHTML.indexOf('(online now)') > -1) {
					onlineElement.innerHTML = '(online now)';
			}	
			if (status) {
				if (status.indexOf('Suspended') > -1) {
						statusElement.innerHTML = '<b>Suspended until: </b>' + status.substring(17);
				}
				if (status.indexOf('Banned') > -1) {
						statusElement.innerHTML = '<b>Banned</b>';
				}
			}		
		},
		
		checkAccountAge: function(userID) {
			// Returns appropriate "GS" value for account age. Otherwise, returns empty string
			if (!allPages.config.hide_gs) {
				switch (userID) {
					case (userID > 22682):
							return ' (gs)\u2076';
					case (userID > 21289):
							return ' (gs)\u2075';
					case (userID > 20176):
							return ' (gs)\u2074';
					case (userID > 15258):
							return ' (gs)\u00B3';
					case (userID > 13498):
							return ' (gs)\u00B2';
					case (userID > 10088):
							return ' (gs)';
					default:
							return '';
				}
			}
			else {				
				return '';
			}
		},
		
		hide: function() {
			document.getElementById('user-popup-div').style.display = 'none';			
			document.removeEventListener('mousemove', allPages.userInfoPopup.mousemoveHandler);
		},
		
		mousemoveHandler: function(evt) {			
			// Close popup if user moves mouse outside of popup (triggered after 250ms delay)
			if (!allPages.userInfoPopup.popupBoundaryCheck(evt.target)) {
				if (!allPages.userInfoPopup.waiting) {
					allPages.userInfoPopup.debouncerId = setTimeout(allPages.userInfoPopup.hide, 250);
					allPages.userInfoPopup.waiting = true;
				}
			}
			else {
				clearTimeout(allPages.userInfoPopup.debouncerId);
				allPages.userInfoPopup.waiting = false;
			}
		},
		
		/**
		 *  Returns true if we should continue to display popup after user moves mouse.
		 */
		 
		popupBoundaryCheck: function(target) {
			switch (target.className) {
				case 'user_info_popup':
				case 'username_anchor':
				case 'popup_link':
				case 'popup_user':
				case 'rep_anchor':
					return true;

				default:
					return false;
			}
		},
		
		clickHandler: function(evt) {
				var user = allPages.userInfoPopup.username.toLowerCase();				
				var functions;
				
				if (window.messageList) {
					var containers = document.getElementsByClassName('message-container');
					functions = messageList.messageContainerMethods;
				}
				
				else if (window.topicList) {	
					var trs = document.getElementsByTagName('tr');
					functions = topicList.functions;
				}
				
				var target = allPages.userInfoPopup.currentPost;
				var type = evt.target.innerHTML;
				
				switch (type) {			
					case "IGNORATE?":
						if (!allPages.config.ignorator_list || allPages.config.ignorator_list == '') {
							allPages.config.ignorator_list = allPages.userInfoPopup.username;
						} 
						else {
							allPages.config.ignorator_list += ", " + allPages.userInfoPopup.username;
						}
						
						chrome.runtime.sendMessage({
							need : "save",
							name : "ignorator_list",
							data : allPages.config.ignorator_list
						});
						
						if (window.messageList) {
							messageList.config.ignorator_list = allPages.config.ignorator_list;
							messageList.prepareIgnoratorArray();
							for (var i = 0, len = containers.length; i < len; i++) {
								var container = containers[i];
								functions.ignorator_messagelist(container);
							}
						}
						
						else {
							topicList.config.ignorator_list = allPages.config.ignorator_list;
							topicList.createArrays();
							for (var i = 1, len = trs.length; i < len; i++) {
								var tr = trs[i];
								functions.ignorator_topiclist(tr, i);
							}
						}
						
						evt.target.innerHTML = "IGNORATE";
						allPages.userInfoPopup.hide();
						break;
						
					case "IGNORATE":
						evt.target.innerHTML = "IGNORATE?";
						break;
						
					case "PM":
						chrome.runtime.sendMessage({
							need : "opentab",
							url : "http://endoftheinter.net/postmsg.php?puser=" + allPages.userInfoPopup.userId
						});
						allPages.userInfoPopup.hide();
						break;
						
					case "GT":
						chrome.runtime.sendMessage({
							need : "opentab",
							url : "http://endoftheinter.net/token.php?type=2&user=" + allPages.userInfoPopup.userId
						});
						allPages.userInfoPopup.hide();
						break;
						
					case "BT":
						chrome.runtime.sendMessage({
							need : "opentab",
							url : "http://endoftheinter.net/token.php?type=1&user=" + allPages.userInfoPopup.userId
						});
						allPages.userInfoPopup.hide();
						break;
						
					case "HIGHLIGHT":
						allPages.config.user_highlight_data[user] = {};
						allPages.config.user_highlight_data[user].bg = Math.floor(
								Math.random() * 16777215).toString(16);
						allPages.config.user_highlight_data[user].color = Math.floor(
								Math.random() * 16777215).toString(16);
						chrome.runtime.sendMessage({
							need : "save",
							name : "user_highlight_data",
							data : allPages.config.user_highlight_data
						});
						if (window.messageList) {
							// update config object in messageList script
							messageList.config.user_highlight_data = allPages.config.user_highlight_data;
							var top;
							for (var i = 0, len = containers.length; i < len; i++) {
								container = containers[i];
								functions.userhl_messagelist(container, i);
								if (allPages.config.foxlinks_quotes) {
									 functions.foxlinks_quote(container);
								}
							}
						} else {
							// update config object in topicList script
							topicList.config.user_highlight_data = allPages.config.user_highlight_data;
							for (var i = 1, len = trs.length; i < len; i++) {
								tr = trs[i];
								functions.userhl_topiclist(tr);
							}
						}				
						break;
						
					case "UNHIGHLIGHT":
						delete allPages.config.user_highlight_data[allPages.userInfoPopup.username
								.toLowerCase()];
						chrome.runtime.sendMessage({
							need : "save",
							name : "user_highlight_data",
							data : allPages.config.user_highlight_data
						});
						if (window.messageList) {
							// update config object in messageList scripts
							messageList.config.user_highlight_data = allPages.config.user_highlight_data;
							var message_tops = document.getElementsByClassName('message-top');
							for (var i = 0, len = message_tops.length; i < len; i++) {
								var top = message_tops[i];
								if (top.getElementsByTagName('a')[0]) {
									var userToCheck = top.getElementsByTagName('a')[0].innerHTML;
									if (userToCheck === allPages.userInfoPopup.username) {		
										top.style.background = '';
										top.style.color = '';
										var top_atags = top.getElementsByTagName('a');
										for ( var j = 0; j < top_atags.length; j++) {
											top_atags[j].style.color = '';
										}
									}
								}
							}
						} else {
							// update config object in topicList scripts
							topicList.config.user_highlight_data = allPages.config.user_highlight_data;
							var tds, td, tags;
							for (var i = 1, len = trs.length; i < len; i++) {
								tr = trs[i];
								tds = tr.getElementsByTagName('td');
								if (tds[1].getElementsByTagName('a')[0]) {
									var userToCheck = tds[1].getElementsByTagName('a')[0].innerHTML;
									if (userToCheck === allPages.userInfoPopup.username) {
										for (var j = 0, tds_len = tds.length; j < tds_len; j++) {
											td = tds[j];
											td.style.background = '';
											td.style.color = '';
											tags = td.getElementsByTagName('a');
											for (var k = 0, tags_len = tags.length; k < tags_len; k++) {
												tags[k].style.color = '';
											}
										}
									}
								}
							}
						}
						allPages.userInfoPopup.hide();
						break;
				}
		}
	},
	optionsMenu: {
		show: function() {
			var url = chrome.extension.getURL('options.html');
			var div = document.createElement('div');
			var iframe = document.createElement('iframe');
			var width = window.innerWidth;
			var height = window.innerHeight;
			var close = document.createElement('div');
			var anchorHeight;
			
			div.id = "options_div";
			div.style.width = (width * 0.95) + 'px';
			div.style.height = (height * 0.95) + 'px';
			div.style.left = (width - (width * 0.975)) + 'px';
			div.style.top = (height - (height * 0.975)) + 'px';
			
			close.id = "close_options";

			iframe.style.width = "inherit";
			iframe.src = url;
			iframe.style.backgroundColor = "white";
			iframe.style.border = "none";
			
			document.getElementsByClassName('body')[0].style.opacity = 0.3;
			
			div.appendChild(close);
			div.appendChild(iframe);
			document.body.appendChild(div);
			
			anchorHeight = close.getBoundingClientRect().height * 2;
			iframe.style.height = ((height * 0.95) - anchorHeight) + 'px';
			
			this.addListeners();						
		},
		addListeners: function() {
			const ESCAPE_KEY = 27;
			
			document.body.addEventListener('click', this.hide);
			document.getElementById('close_options').addEventListener('click', this.hide);		
			document.body.addEventListener('keyup', (evt) => {
				if (evt.keyCode === ESCAPE_KEY) {
					this.hide();
				}			
			});
			
			document.body.addEventListener('mousewheel', this.preventScroll);
		},
		hide: function() {			
			var div = document.getElementById('options_div');
			var bodyClass = document.getElementsByClassName('body')[0];
			bodyClass.style.opacity = 1;
			document.body.removeChild(div);
			document.body.removeEventListener('click', allPages.optionsMenu.hide);						
			document.body.removeEventListener('keyup', allPages.optionsMenu.hide);
			document.body.removeEventListener('mousewheel', allPages.optionsMenu.preventScroll);
		},
		preventScroll: function(event) {
			event.preventDefault();
		}
	},
	
	
	/**
	 *  Queue of files to upload to ETI
	 */
	
	asyncUploadQueue: {
		queue: [],
		total: 0,
		index: 0,
		working: false,
		
		push: function(file) {
			this.total++;
			this.queue.push(file);			
		},
		
		next: function() {
			this.index++;
			this.working = true;			
			return this.queue.shift();
		},
		
		clear: function() {
			this.queue = [];
			this.total = 0;
			this.index = 0;
			this.working = false;
		}
	},
	
	
	/**
	 *  Adds file to queue and handles UI update
	 */
	
	asyncUploadHandler: function(file, callback) {
		if (this.asyncUploadQueue.queue.length == 0) {
			this.asyncUploadQueue.working = false;
		}
		this.asyncUploadQueue.push(file);
		newCb = this.handleAsyncUploadResponse
		if (!this.asyncUploadQueue.working) {
			var arrayBuffer;
			var fileReader = new FileReader();
			fileReader.onload = function(event) {
				arrayBuffer = event.target.result;

				// if (allPages.asyncUploadQueue.index >= allPages.asyncUploadQueue.total) {
				// 	// No need to show progress anymore - change type to 'basic' and update title
				// 	if (allPages.asyncUploadQueue.index > 1) {
				// 		chrome.runtime.sendMessage({ need: 'clear_progress_notify', title: 'Uploads complete' });
				// 	}
				// 	else {
				// 		chrome.runtime.sendMessage({ need: 'clear_progress_notify', title: 'Upload complete' });
				// 	}
				// 	allPages.asyncUploadQueue.clear();
				// } else {
				// 	chrome.runtime.sendMessage({ need: 'update_progress_notify', 
				// 		update: {						
				// 			title: 'Uploading: (' + allPages.asyncUploadQueue.index + '/' + allPages.asyncUploadQueue.total + ')',
				// 			progress: 0
				// 		}
				// 	});												
				// }
				// send to background script to upload without hitting CORS error
				chrome.runtime.sendMessage({
					type: 'AsyncUpload',
					need: 'AsyncUpload',
					fileBytes: new Uint8Array(arrayBuffer),
					fileType: file.type,
					fileName: file.name,
				}, function(response) {
					if (response != undefined) {
						newCb(response, callback);
					}
				})
			}
			fileReader.readAsArrayBuffer(file);		
			//this.asyncUpload(this.asyncUploadQueue.next(), callback);
			
			// chrome.runtime.sendMessage({ need: 'progress_notify',
			// 		data: {
			// 				title: 'Uploading: (' + this.asyncUploadQueue.index + '/' + this.asyncUploadQueue.total + ')',
			// 				progress: 0
			// 		}
			// });			
		}			
	},


	/**
	 *  Uploads first item from asyncUploadQueue and is called recursively for any remaining files.
	 * 2021-05 Prevented by CORS, no longer used.   Uploads go through transloader now
	 */
	
	asyncUpload: function(file, callback) {
		const UPLOAD_URL = 'https://u.endoftheinter.net/u.php';
		var xhr = new XMLHttpRequest();
		xhr.open('POST', UPLOAD_URL, true);
		xhr.withCredentials = "true";
		
		var formData = new FormData();
		formData.append('file', file);

		xhr.onload = () => {
			if (xhr.status === 200) {
				
				if (this.asyncUploadQueue.index >= this.asyncUploadQueue.total) {
					// No need to show progress anymore - change type to 'basic' and update title
					if (this.asyncUploadQueue.index > 1) {
						chrome.runtime.sendMessage({ need: 'clear_progress_notify', title: 'Uploads complete' });
					}
					
					else {
						chrome.runtime.sendMessage({ need: 'clear_progress_notify', title: 'Upload complete' });
					}
					
					this.asyncUploadQueue.clear();
				}
				
				else {
					chrome.runtime.sendMessage({ need: 'update_progress_notify', 
							update: {						
									title: 'Uploading: (' + this.asyncUploadQueue.index + '/' + this.asyncUploadQueue.total + ')',
									progress: 0
							}
					});

					this.asyncUpload(this.asyncUploadQueue.next(), callback);
				}		
				
				this.handleAsyncUploadResponse(xhr.responseText, callback);
			}						
		};
		
		xhr.upload.addEventListener('progress', (evt) => {
				
				if (evt.lengthComputable) {
					var percentage = Math.round((evt.loaded / evt.total) * 100);
					
					if (percentage === 100) {
						chrome.runtime.sendMessage({ need: 'update_progress_notify', 
								update: {
										title: 'Uploading: (' + this.asyncUploadQueue.index + '/' + this.asyncUploadQueue.total + ')',
										contextMessage: 'Waiting for response...',
										progress: 100
								}
						});
					} 
					
					else {
						chrome.runtime.sendMessage({ need: 'update_progress_notify', 
								update: {
										title: 'Uploading: (' + this.asyncUploadQueue.index + '/' + this.asyncUploadQueue.total + ')',
										contextMessage: '',
										progress: percentage
								}
						});						
					}
				}
		});
				
		xhr.send(formData);
	},

	
	/**
	 *  Gets <img> code string from image upload response
	 */
	
	handleAsyncUploadResponse: function(responseText, callback) {
		var tmp = document.createElement('div');
		tmp.innerHTML = responseText;
		
		var tmp_input = tmp.getElementsByClassName('img')[0].getElementsByTagName('input')[0];
		
		if (tmp_input.value) {
			if (tmp_input.value.substring(0, 4) == '<img') {						
				callback(tmp_input.value);
			}
		}	
	},	
	
	/**
	 *  Method which copies ETI quoting behaviour when inserting text into textarea
	 */ 
	
	insertIntoTextarea: function(textToInsert) {
		var textarea = document.getElementById('message') || document.getElementsByTagName('textarea')[0];

		// If no other text has been added before sig belt, always insert text at beginning of textarea.
		// Fixes https://github.com/sonicmax/ChromeLL-2.0/issues/74
		var caret;
					
		// Check whether any text has been inserted before sig belt.
		// If user doesn't have a sig, it will always be inserted at caret position
		if (textarea.value) {
			var message = textarea.value.split('\n---')[0];
			if (message[0] === undefined) {
				// Insert at 0
				caret = 0;
			}								
		}
		
		if (caret !== 0) {
			// We can insert like message at caret position
			caret = textarea.selectionStart;
			// Match ETI behaviour for quotes by inserting two linebreaks
			textToInsert = '\n\n' + textToInsert;
		}			
		
		textarea.value = textarea.value.substring(0, caret) 
				+ textToInsert 
				+ textarea.value.substring(caret, textarea.value.length);						
		
		// Move caret to end of inserted text.
		var endOfInsertion = caret + textToInsert.length;
		
		// We have to call setSelectionRange from inside setTimeout because of weird Chrome bug
		setTimeout(() => {
			textarea.focus();
			textarea.setSelectionRange(endOfInsertion, endOfInsertion);
		}, 0);
	},
	
	callCommonFunctions: function() {
		for (var i in this.commonFunctions) {
			if (this.config[i]) {
				this.commonFunctions[i]();
			}
		}
		
		if (window.location.pathname === '/showmessages.php' || window.location.pathname === '/inboxthread.php') {
			addPopupCSS();
		}
	},
	
	init: function(config) {
		this.config = config;
		
		chrome.runtime.sendMessage({
			need: "insertcss",
			file: "src/css/allpages.css"
		});
		
		chrome.runtime.onMessage.addListener((msg) => {
			if (msg.action == 'showOptions') {
				allPages.optionsMenu.show();
			}
		});		
		
		if (document.readyState == 'loading') {
			// wait for DOMContentLoaded to fire before attempting to modify DOM
			document.addEventListener('DOMContentLoaded', () => {
				this.callCommonFunctions();
			});
		}
		
		else {
			this.callCommonFunctions();
		}		
	}
};

chrome.runtime.sendMessage({
	need: "config"
}, (response) => {
	allPages.init.call(allPages, response.data);
});

var getCustomColors = function() {	
	// (first 'h1' element is either tag name (in topic list), or topic title (in message list)
	var titleText = document.getElementsByTagName('h1')[0];
	var anchor = document.getElementsByTagName('a')[0];
	var userbar = document.getElementsByClassName('userbar')[0];
	// Infobar is not displayed on reply threads, so use message instead
	var infobar = document.getElementsByClassName('infobar')[0] || document.getElementsByClassName('message')[0];
	var message = document.getElementsByClassName('message')[0] || document.getElementsByTagName('th')[0];			

	var customColors = {};
	customColors.text = window.getComputedStyle(titleText).getPropertyValue('color');			
	customColors.anchor = window.getComputedStyle(anchor).getPropertyValue('color');				
	customColors.body = window.getComputedStyle(document.body).getPropertyValue('background-color');
	customColors.message = window.getComputedStyle(message).getPropertyValue('background-color');
	customColors.userbar = window.getComputedStyle(userbar).getPropertyValue('background-color');
	customColors.infobar = window.getComputedStyle(infobar).getPropertyValue('background-color');
	
	// Kludgy fix to improve visiblity of user info popup if user is using custom CSS with rgba values.
	// Browser seems to just ignore the alpha parameter if we change rgba to rgb
	
	for (var color in customColors) {	
		if (customColors[color].indexOf('rgba') > -1) {
			customColors[color] = customColors[color].replace('rgba', 'rgb');
		}
	}
	
	return customColors;
};

var addPopupCSS = function() {
	var customColors = getCustomColors();
	
	var sheet = document.createElement('style');
	var rules = [];
	
	rules.push('#user-popup-div' + ' { ' + 'color: ' + customColors.text + ' }' + '\n');
	rules.push('#user-popup-div' + ' { ' + 'background: ' + customColors.message + ' }' + '\n');
	rules.push('#user-popup-div' + ' { ' + 'border-color: ' + customColors.body + ' }' + '\n');
	rules.push('.popup_link' + ' { ' + 'color: ' + customColors.anchor + ' }' + '\n');
	rules.push('.popup_link' + ' { ' + 'background: ' + customColors.userbar + ' }' + '\n');
	rules.push('#username, #popup_uid, #namechange, #online, #punish, #popup_loading, #rep, #rep a' + ' { ' + 'color: ' + customColors.text + ' }' + '\n');
	// #user-popup-div:before should be same colour as #user-popup-div background
	rules.push('#user-popup-div:before' + ' { ' + 'border-bottom-color: ' + customColors.body + ' }' + '\n');
	// #user-popup-div:after should be same colour as #user-popup-div border
	rules.push('#user-popup-div:after' + ' { ' + 'border-bottom-color: ' +   customColors.infobar + ' }' + '\n');
	
	sheet.innerHTML = rules.join('\n');
	
	document.head.appendChild(sheet);	
};
