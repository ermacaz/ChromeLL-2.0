var $jscomp = {
	scope:
	{},
	checkStringArgs: function (e, t, s)
	{
		if (null == e) throw new TypeError("The 'this' value for String.prototype." + s + " must not be null or undefined");
		if (t instanceof RegExp) throw new TypeError("First argument to String.prototype." + s + " must not be a regular expression");
		return e + ""
	}
};
$jscomp.defineProperty = "function" == typeof Object.defineProperties ? Object.defineProperty : function (e, t, s)
{
	if (s.get || s.set) throw new TypeError("ES3 does not support getters and setters.");
	e != Array.prototype && e != Object.prototype && (e[t] = s.value)
}, $jscomp.getGlobal = function (e)
{
	return "undefined" != typeof window && window === e ? e : "undefined" != typeof global ? global : e
}, $jscomp.global = $jscomp.getGlobal(this), $jscomp.polyfill = function (e, t, s, n)
{
	if (t)
	{
		for (s = $jscomp.global, e = e.split("."), n = 0; n < e.length - 1; n++)
		{
			var a = e[n];
			a in s || (s[a] = {}), s = s[a]
		}(t = t(n = s[e = e[e.length - 1]])) != n && null != t && $jscomp.defineProperty(s, e,
		{
			configurable: !0,
			writable: !0,
			value: t
		})
	}
}, $jscomp.polyfill("String.prototype.includes", function (e)
{
	return e || function (e, t)
	{
		return -1 !== $jscomp.checkStringArgs(this, e, "includes").indexOf(e, t || 0)
	}
}, "es6-impl", "es3"), $jscomp.findInternal = function (e, t, s)
{
	e instanceof String && (e = String(e));
	for (var n = e.length, a = 0; a < n; a++)
	{
		var i = e[a];
		if (t.call(s, i, a, e)) return {
			i: a,
			v: i
		}
	}
	return {
		i: -1,
		v: void 0
	}
}, $jscomp.polyfill("Array.prototype.find", function (e)
{
	return e || function (e, t)
	{
		return $jscomp.findInternal(this, e, t).v
	}
}, "es6-impl", "es3");
var messageList = {
	config: [],
	ignoredUsers: [],
	autoscrolling: !1,
	imagemapDebouncer: "",
	menuDebouncer: "",
	zoomLevel: 1,
	ignorated:
	{
		total_ignored: 0,
		data:
		{
			users:
			{}
		}
	},
	topicCreator: "",
	pm: "",
	tags: [],
	init: function (e)
	{
		this.config = e.data, this.config.tcs = e.tcs ? e.tcs :
		{}, this.prepareIgnoratorArray(), this.globalPort = chrome.runtime.connect(), this.globalPort.onMessage.addListener(this.handleEvent.onReceiveMessage), this.config.reload_on_update && this.globalPort.onDisconnect.addListener(this.handleEvent.onPortDisconnect), "/inboxthread.php" === window.location.pathname && (this.pm = "_pm"), this.config.dramalinks && !this.pm && this.sendMessage(
		{
			need: "dramalinks"
		}, function (e)
		{
			dramalinks.html = e.data, dramalinks.config = messageList.config
		}), this.getZoomLevel(), -1 < window.location.search.indexOf("thread=") && this.handleRepliesPage(), this.config.use_custom_serious_color && this.addCustomSeriousStyle(), this.config.seasonal_css && 11 === (new Date).getMonth() || (this.addChristmasCss = function () {}), "loading" == document.readyState ? document.addEventListener("DOMContentLoaded", function ()
		{
			messageList.applyDomModifications.call(messageList, messageList.pm)
		}) : this.applyDomModifications.call(this, this.pm)
	},
	messageContainerMethods:
	{
		ignorator_messagelist: function (e)
		{
			if (messageList.config.ignorator)
			{
				e = e.getElementsByClassName("message-top");
				for (var t = 0; t < e.length; t++)
					for (var s = e[t], n = s.getElementsByTagName("a")[0].innerHTML.toLowerCase(), a = 0, i = messageList.ignoredUsers.length; a < i; a++)
					{
						var o = messageList.ignoredUsers[a];
						n == o.toLowerCase() && (s.parentNode.classList.add("ignorated"), messageList.ignorated.total_ignored++, messageList.ignorated.data.users[o] ? messageList.ignorated.data.users[o].total++ : (messageList.ignorated.data.users[o] = {}, messageList.ignorated.data.users[o].total = 1), messageList.config.hide_ignorator_badge || messageList.globalPort.postMessage(
						{
							action: "ignorator_update",
							ignorator: messageList.ignorated,
							scope: "messageList"
						}))
					}
			}
		},
		user_notes: function (e, t)
		{
			if (messageList.config.usernote_notes || (messageList.config.usernote_notes = {}), !messageList.tags.includes("Anonymous"))
			{
				var s = document.createElement("a");
				s.id = "notebook";
				var n = t.getElementsByTagName("a")[0].href.match(/user=(\d+)$/i)[1];
				s.innerHTML = null != messageList.config.usernote_notes[n] && "" != messageList.config.usernote_notes[n] ? "Notes*" : "Notes", s.href = "##note" + n, t.appendChild(document.createTextNode(" | ")), t.appendChild(s)
			}
		},
		like_button: function (e, t, s)
		{
			e = document.createElement("a"), s = document.createTextNode(" | "), e.innerHTML = "Like", e.className = "like_button", e.href = "##like", t.appendChild(s), t.appendChild(e), e.addEventListener("mouseenter", messageList.handleEvent.mouseenter.bind(messageList)), e.addEventListener("mouseleave", messageList.handleEvent.mouseleave.bind(messageList))
		},
		number_posts: function (e, t, s)
		{
			(s += 50 * ((window.location.href.match(/page=/) ? window.location.href.match(/page=(\d+)/)[1] : 1) - 1)) < 1e3 && (s = "0" + s), s < 100 && (s = "0" + s), s < 10 && (s = "0" + s), s = document.createTextNode(" | #" + s), t.appendChild(s)
		},
		post_templates: function (e, t, s)
		{
			(e = document.createElement("div")).style.display = "none", e.id = "cdiv", document.body.appendChild(e, null), messageList.postEvent = document.createEvent("Event"), messageList.postEvent.initEvent("postTemplateInsert", !0, !0), (e = document.createElement("span")).innerHTML = " | ", e.className = "post_template_holder";
			var n = document.createElement("span");
			n.className = "post_template_opts", n.innerHTML = "[";
			var a = document.createElement("a");
			a.href = "##" + s, a.innerHTML = "&gt;", a.className = "expand_post_template", n.appendChild(a), n.innerHTML += "]", e.appendChild(n), t.appendChild(e)
		},
		userhl_messagelist: function (e, t, s, n)
		{
			if (messageList.config.enable_user_highlight)
				if (e = e.getElementsByClassName("message-top"), messageList.config.no_user_highlight_quotes)
				{
					if (s = t.getElementsByTagName("a")[0].innerHTML.toLowerCase(), messageList.config.user_highlight_data[s])
					{
						for (t.style.background = "#" + messageList.config.user_highlight_data[s].bg, t.style.color = "#" + messageList.config.user_highlight_data[s].color, o = 0, r = (i = t.getElementsByTagName("a")).length; o < r; o++)(l = i[o]).style.color = "#" + messageList.config.user_highlight_data[s].color;
						n && messageList.config.notify_userhl_post && a.getElementsByTagName("a")[0].href.match(/user=(\d+)$/i)[0] != messageList.config.user_id && messageList.sendMessage(
						{
							need: "notify",
							title: "Post by " + s,
							message: document.title.replace(/End of the Internet - /i, "")
						})
					}
				}
			else
				for (t = 0; t < e.length; t++)
				{
					var a = e[t];
					if (s = a.getElementsByTagName("a")[0].innerHTML.toLowerCase(), messageList.config.user_highlight_data[s])
					{
						a.setAttribute("highlighted", !0), a.style.background = "#" + messageList.config.user_highlight_data[s].bg, a.style.color = "#" + messageList.config.user_highlight_data[s].color;
						for (var i = a.getElementsByTagName("a"), o = 0, r = i.length; o < r; o++)
						{
							var l = i[o];
							l.style.color = "#" + messageList.config.user_highlight_data[s].color
						}
						n && messageList.config.notify_userhl_post && 0 === t && a.getElementsByTagName("a")[0].href.match(/user=(\d+)$/i)[1] != messageList.config.user_id && messageList.sendMessage(
						{
							need: "notify",
							title: "Post by " + a.getElementsByTagName("a")[0].innerHTML,
							message: document.title.replace(/End of the Internet - /i, "")
						})
					}
				}
		},
		label_self_anon: function (e)
		{
			if (messageList.tags.includes("Anonymous"))
			{
				var t = document.getElementsByClassName("quickpost-body")[0];
				if (t && (e = e.getElementsByClassName("message-top"), !/user=(\d+)$/.test(e[0].getElementsByTagName("a")[0]) && -1 != (t = t.getElementsByTagName("a")[0].innerHTML).indexOf("Human #")))
					for (var s = 0, n = e.length; s < n; s++)
					{
						var a, i, o = e[s];
						if (-1 < (a = o.getElementsByTagName("a")[0]).innerHTML.indexOf("Filter"))(i = (i = (a = o.getElementsByTagName("b")[0].nextSibling).nodeValue.substring(1, a.nodeValue.length)).replace(" | ", "")) == t && ((i = document.createElement("span")).innerHTML = "<b>(Me)</b> | ", o.insertBefore(i, a.nextSibling));
						else a.innerHTML == t && ((i = document.createElement("span")).innerHTML = " | <b>(Me)</b>", o.insertBefore(i, a.nextSibling))
					}
			}
		},
		highlight_tc: function (e)
		{
			for (var t = 0, s = (e = e.getElementsByClassName("message-top")).length; t < s; t++)
			{
				var n = e[t].getElementsByTagName("a")[0];
				n.innerHTML.toLowerCase() == messageList.topicCreator && messageList.config.tc_highlight_color && (n.style.color = "#" + messageList.config.tc_highlight_color)
			}
		},
		label_tc: function (e)
		{
			var t, s;
			messageList.config.tc_label_color && "" != messageList.config.tc_label_color && (s = messageList.config.tc_label_color);
			for (var n = 0, a = (e = e.getElementsByClassName("message-top")).length; n < a; n++)
			{
				var i = e[n],
					o = i.firstChild.nextSibling;
				if ((r = (r = o.nodeValue) && " " != r ? (t = !0, r.replace(" | ", "").trim()) : (o = i.getElementsByTagName("a")[0]).innerHTML).toLowerCase() == messageList.topicCreator)
				{
					var r = document.createElement("span"),
						l = document.createElement("b"),
						d = document.createTextNode("TC"),
						m = document.createTextNode(" | ");
					l.appendChild(d), s && (l.style.color = "#" + s), t ? (r.appendChild(l), r.appendChild(m)) : (r.appendChild(m), r.appendChild(l)), i.insertBefore(r, o.nextSibling)
				}
			}
		}
	},
	infobarMethods:
	{
		imagemap_on_infobar: function ()
		{
			if (e = window.location.search.match(/(topic=)([0-9]+)/))
			{
				var e = e[0],
					t = document.getElementsByClassName("infobar")[0],
					s = "";
				(n = window.location.search.match(/(page=)([0-9]+)/)) && (s = "&oldpage=" + n[2]);
				var n = document.createElement("a"),
					a = document.createTextNode(" | ");
				n.href = "/imagemap.php?" + e + s, n.innerHTML = "Imagemap", t.appendChild(a), t.appendChild(n)
			}
		},
		filter_me: function ()
		{
			var e = document.getElementsByClassName("message-top");
			if (/user=(\d+)$/.test(e[0].getElementsByTagName("a")[0].href)) t = "&u=" + document.getElementsByClassName("userbar")[0].getElementsByTagName("a")[0].href.match(/\?user=([0-9]+)/)[1];
			else
			{
				if (!(e = document.getElementsByClassName("quickpost-body")[0]) || !e.getElementsByTagName("a")) return;
				if (e = e.getElementsByTagName("a")[0].innerHTML.replace("Human #", ""), isNaN(e)) return;
				var t = "&u=-" + e
			}
			var s = window.location.href.match(/topic=([0-9]+)/)[1],
				n = (e = document.createElement("a"), document.createTextNode(" | ")); - 1 == window.location.href.indexOf(t) ? (e.href = window.location.href.split("?")[0] + "?topic=" + s + t, e.innerHTML = "Filter Me") : (e.href = window.location.href.replace(t, ""), e.innerHTML = "Unfilter Me"), (t = document.getElementsByClassName("infobar")[0]).appendChild(n), t.appendChild(e)
		},
		expand_spoilers: function ()
		{
			var e = document.getElementsByClassName("infobar")[0];
			document.createElement("span");
			var t = document.createElement("a"),
				s = document.createTextNode(" | ");
			t.id = "chromell_spoilers", t.href = "##", t.innerHTML = "Expand Spoilers", e.appendChild(s), e.appendChild(t), t.addEventListener("click", messageList.spoilers.find)
		}
	},
	quickpostMethods:
	{
		quick_imagemap: function ()
		{
			var e = document.getElementsByClassName("quickpost-body")[0],
				t = document.createElement("button"),
				s = document.createTextNode(" "),
				n = document.createElement("input");
			t.textContent = "Browse Imagemap", t.id = "quick_image", n.placeholder = "Press enter to search", n.id = "image_search", e.appendChild(s), e.appendChild(t), e.appendChild(s), e.appendChild(n)
		},
		post_before_preview: function ()
		{
			for (var e, t, s, n = document.getElementsByClassName("quickpost-body")[0].getElementsByTagName("input"), a = 0, i = n.length; a < i; a++) "preview" == (e = n[a]).name && (t = e), "post" == e.name && (s = e);
			s.parentNode.removeChild(s), t.parentNode.insertBefore(s, t)
		},
		batch_uploader: function ()
		{
			var e = document.getElementsByClassName("quickpost-body")[0],
				t = document.createElement("input"),
				s = document.createElement("input");
			t.type = "file", t.multiple = !0, t.id = "batch_uploads", s.type = "button", s.value = "Batch Upload", s.addEventListener("click", messageList.startBatchUpload), e.insertBefore(t, null), e.insertBefore(s, t)
		},
		quickpost_on_pgbottom: function ()
		{
			messageList.sendMessage(
			{
				need: "insertcss",
				file: "src/css/quickpost_on_pgbottom.css"
			})
		},
		quickpost_tag_buttons: function ()
		{
			var e = document.getElementsByClassName("quickpost-body")[0];
			document.getElementById("u0_13");
			var t = document.createElement("input");
			t.value = "Mod", t.name = "Mod", t.type = "button", t.id = "mod", t.addEventListener("click", messageList.qpTagButton, !1);
			var s = document.createElement("input");
			s.value = "Admin", s.name = "Admin", s.type = "button", s.addEventListener("click", messageList.qpTagButton, !1), s.id = "adm", (s = document.createElement("input")).value = "Quote", s.name = "Quote", s.type = "button", s.addEventListener("click", messageList.qpTagButton, !1), s.id = "quote";
			var n = document.createElement("input");
			n.value = "Spoiler", n.name = "Spoiler", n.type = "button", n.addEventListener("click", messageList.qpTagButton, !1), n.id = "spoiler";
			var a = document.createElement("input");
			a.value = "Preformated", a.name = "Preformated", a.type = "button", a.addEventListener("click", messageList.qpTagButton, !1), a.id = "pre";
			var i = document.createElement("input");
			i.value = "Underline", i.name = "Underline", i.type = "button", i.addEventListener("click", messageList.qpTagButton, !1), i.id = "u";
			var o = document.createElement("input");
			o.value = "Italic", o.name = "Italic", o.type = "button", o.addEventListener("click", messageList.qpTagButton, !1), o.id = "i";
			var r = document.createElement("input");
			r.value = "Bold", r.name = "Bold", r.type = "button", r.addEventListener("click", messageList.qpTagButton, !1), r.id = "b", e.insertBefore(t, e.getElementsByTagName("textarea")[0]), e.insertBefore(s, t), e.insertBefore(n, s), e.insertBefore(a, n), e.insertBefore(i, a), e.insertBefore(o, i), e.insertBefore(r, o), e.insertBefore(document.createElement("br"), r)
		},
		drop_batch_uploader: function ()
		{
			(document.getElementById("message") || document.getElementsByTagName("textarea")[0]).addEventListener("drop", function (e)
			{
				new FileReader;
				if (e.dataTransfer.files.length > 0) {
					for (var t = 0, s = e.dataTransfer.files.length; t < s; t++) {
						allPages.asyncUploadHandler(e.dataTransfer.files[t], function (e) {
							allPages.insertIntoTextarea(e)
						});
					}
				} else {
					for(var k = 0; k < e.dataTransfer.items.length; k++) {
						var item = e.dataTransfer.items[k];
						if (item.type == "text/uri-list") {
							item.getAsString(function(data) {
								chrome.runtime.sendMessage({
									type: 'backGroundUrltoBlob',
									need: 'backGroundUrltoBlob',
									url: data,
								}, function(response) {
									var dataview = new DataView(Uint8Array.from(Object.values(response.fileBytes)).buffer);
									var file = new File([dataview], response.fileType)
									allPages.asyncUploadHandler(file, function (e) {
										allPages.insertIntoTextarea(e)
									});
								})
							});
						}
						
					}
				}
				e.preventDefault()
			})
		},
		snippet_listener: function ()
		{
			var t = document.getElementsByName("message")[0];
			t.addEventListener("keydown", function (e)
			{
				messageList.config.snippet_alt_key ? 1 == e.shiftKey && "Tab" == e.key && (e.preventDefault(), messageList.snippet.handler(t.value, t.selectionStart)) : "Tab" == e.key && (e.preventDefault(), messageList.snippet.handler(t.value, t.selectionStart))
			})
		},
		emoji_menu: function ()
		{
			messageList.emojis.addMenu()
		}
	},
	miscMethods:
	{
		pm_title: function ()
		{
			if (-1 != window.location.href.indexOf("inboxthread.php"))
			{
				for (var e, t = document.getElementsByClassName("userbar")[0].getElementsByTagName("a")[0].innerHTML, s = "", n = document.getElementsByClassName("message-top"), a = 0, i = n.length; a < i; a++)
					if (-1 == (e = n[a]).getElementsByTagName("a")[0].innerHTML.indexOf(t))
					{
						s = e.getElementsByTagName("a")[0].innerHTML;
						break
					} document.title = "PM - " + s
			}
		},
		post_title_notification: function ()
		{
			document.addEventListener("visibilitychange", messageList.clearUnreadPostsFromTitle), document.addEventListener("scroll", messageList.clearUnreadPostsFromTitle), document.addEventListener("mousemove", messageList.clearUnreadPostsFromTitle)
		},
		click_expand_thumbnail: function (e)
		{
			for (var t = 0, s = (e = e && "string" != typeof e ? e.getElementsByClassName("message") : document.getElementsByClassName("message")).length; t < s; t++)
				for (var n = e[t].getElementsByClassName("img-placeholder"), a = 0; a < n.length; a++) messageList.media.imgPlaceholderObserver.observe(n[a],
				{
					attributes: !0,
					childList: !0
				})
		}
	},
	omittedQuoteLoader:
	{
		loadMessage: function (e)
		{
			var t = e.id,
				s = document.createElement("span");
			s.innerHTML = "Loading message...";
			var n = new Image;
			n.src = "data:image/gif;base64,R0lGODlhEAAQAPIAAP///2Zm/9ra/o2N/mZm/6Cg/rOz/r29/iH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA==", e.parentNode.insertBefore(s, e), e.parentNode.replaceChild(n, e);
			var a = new XMLHttpRequest;
			a.open("GET", window.location.protocol + "//boards.endoftheinter.net/message.php?" + t, !0), a.send(null), a.onload = function ()
			{
				200 == a.status ? (messageList.omittedQuoteLoader.processPage(a.responseText, s), n.parentNode.removeChild(n), s.parentNode.removeChild(s)) : alert("An error occurred loading the message. Fuck shit.")
			}
		},
		processPage: function (e, t)
		{
			(s = document.createElement("div")).innerHTML = e;
			for (var s, n = (s = s.getElementsByClassName("message")[0]).getElementsByTagName("script"), a = n.length - 1; 0 <= a; a--)
			{
				var i = n[a];
				if (/ImageLoader/.test(i.text))
				{
					(o = i.text.replace(")})", "").split(",")).shift();
					var o, r = (r = (r = (r = o[0].replace(/\\/g, "")).replace('"//', window.location.protocol + "//")).substring(0, r.length - 1)).replace("i/n", "i/t").substr(0, r.lastIndexOf(".")) + ".jpg";
					(o = document.createElement("img")).src = r, o.onload = function ()
					{
						this.width = this.getBoundingClientRect().width, this.height = this.getBoundingClientRect().height, messageList.media.addDragToResizeListener(this), this.parentNode.className = "img-loaded"
					}, (r = i.previousSibling).style = "", r.appendChild(o), messageList.media.imgPlaceholderObserver.observe(r,
					{
						attributes: !0,
						childList: !0
					}), i.remove()
				}
			}
			for (a = 0, i = (n = s.getElementsByClassName("spoiler_on_close")).length; a < i; a++)(o = n[a]).addEventListener("click", function (e)
			{
				messageList.spoilers.toggle(e.target), e.preventDefault()
			}), o.nextSibling.addEventListener("click", function (e)
			{
				messageList.spoilers.toggle(e.target), e.preventDefault()
			});
			if (-1 != s.innerHTML.indexOf("---"))
				for (a = 0; s.childNodes[a];)
				{
					if (3 == s.childNodes[a].nodeType && -1 != s.childNodes[a].nodeValue.indexOf("---"))
						for (; s.childNodes[a];) s.removeChild(s.childNodes[a]);
					a++
				}
			t.parentNode.appendChild(s)
		}
	},
	livelinksMethods:
	{
		autoscroll_livelinks: function (e, t)
		{
			document.hidden && messageList.autoscrollCheck(e) && e.scrollIntoView()
		},
		autoscroll_livelinks_active: function (e, t)
		{
			!document.hidden && messageList.autoscrollCheck(e) && (setTimeout(function ()
			{
				messageList.autoscrolling = !0, $.scrollTo(e, 800)
			}, 10), setTimeout(function ()
			{
				messageList.autoscrolling = !1
			}, 850))
		},
		post_title_notification: function (e, t)
		{
			if ("none" === e.style.display) messageList.config.debug && console.log("not updating for ignorated post");
			else if (e.getElementsByClassName("message-top")[0].getElementsByTagName("a")[0].innerHTML != document.getElementsByClassName("userbar")[0].getElementsByTagName("a")[0].innerHTML.replace(/ \((\d+)\)$/, ""))
			{
				var s = 1,
					n = "";
				document.getElementsByClassName("message-container")[49] && (n += "+"), /\(\d+\)/.test(document.title) ? (s = parseInt(document.title.match(/\((\d+)\)/)[1]), document.title = "(" + (s + 1) + n + ") " + document.title.replace(/\(\d+\) /, "")) : document.title = "(" + s + n + ") " + document.title
			}
		},
		notify_quote_post: function (e, t)
		{
			if (e.getElementsByClassName("quoted-message") && t.getElementsByTagName("a")[0].innerHTML != document.getElementsByClassName("userbar")[0].getElementsByTagName("a")[0].innerHTML.replace(/ \((\d+)\)$/, ""))
			{
				for (var s = !1, n = e.getElementsByClassName("quoted-message"), a = document.getElementsByClassName("userbar")[0].getElementsByTagName("a")[0].innerHTML.replace(/ \((.*)\)$/, ""), i = 0; i < n.length; i++) n[i].getElementsByClassName("message-top")[0].getElementsByTagName("a")[0].innerHTML == a && "quoted-message" != n[i].parentNode.className && (s = !0);
				s && (s = e.getElementsByClassName("message-top")[0].getElementsByTagName("a")[0].innerHTML, messageList.sendMessage(
				{
					need: "notify",
					title: "Quoted by " + s,
					message: document.title.replace(/End of the Internet - /i, "")
				}))
			}
		}
	},
	readPost: function (e)
	{
		for (var t = "", s = 0, n = (e = e.getElementsByClassName("message")[0].childNodes).length; s < n; s++)
		{
			var a = e[s];
			if (a.nodeValue && "---" === a.nodeValue.replace(/^\s+|\s+$/g, "")) break;
			3 === a.nodeType ? t += a.nodeValue : a.tagName ? "B" !== a.tagName && "I" !== a.tagName && "U" !== a.tagName || (t += a.innerText) : a.className && "pr" === a.className && (t += a.innerText)
		}
		window.speechSynthesis.speak(new SpeechSynthesisUtterance(t))
	},
	handleEvent:
	{
		onReceiveMessage: function (e)
		{
			if ("showIgnorated" === e.action)
			{
				for (var t = document.getElementsByClassName("ignorated"), s = [], n = 0, a = t.length; n < a; n++)
				{
					var i = t[n],
						o = i.getElementsByTagName("a")[0];
					e.value.toLowerCase() == o.innerHTML.toLowerCase() && s.push(i)
				}
				for (n = s.length - 1; 0 <= n; n--)(e = s[n]).classList.remove("ignorated"), e.classList.add("ignorated_post_peek"), 0 === n && $.scrollTo(e)
			}
		},
		onPortDisconnect: function (e)
		{
			0 < document.getElementsByClassName("quickpost").length && (e = document.getElementsByName("message")[0], sessionStorage.setItem("quickpost_value", e.value), sessionStorage.setItem("quickpost_caret_position", e.selectionStart)), sessionStorage.setItem("scrollx", window.scrollX), sessionStorage.setItem("scrolly", window.scrollY), setTimeout(function ()
			{
				window.location.reload()
			}, 2e3)
		},
		newPost: function (t)
		{
			var e = t.getElementsByClassName("message-top")[0],
				s = document.getElementsByClassName("message-container").length,
				n = "";
			for (var a in "/inboxthread.php" === window.location.pathname && (n = "_pm"), this.config.microsoft_sam && this.tags.includes("Microsoft Sam") && window.speechSynthesis && this.readPost(t), this.messageContainerMethods) this.config[a + n] && this.messageContainerMethods[a](t, e, s, !0);
			for (a in this.livelinksMethods) this.config[a + n] && this.livelinksMethods[a](t, e);
			if (this.addListeners(t), this.links.check(t), this.config.click_expand_thumbnail && this.miscMethods.click_expand_thumbnail(t), "Filter" != (t = e.getElementsByTagName("a")[0]).innerHTML && this.config.user_info_popup && (t.className = "username_anchor"), !this.config.hide_ignorator_badge)
			{
				t = {
					action: "ignorator_update",
					ignorator: this.ignorated,
					scope: "messageList"
				};
				try
				{
					this.globalPort.postMessage(t)
				}
				catch (e)
				{
					(this.globalPort = chrome.runtime.connect()) && this.globalPort.onMessage.addListener(this.handleEvent.ignoratorUpdate);
					try
					{
						this.globalPort.postMessage(t), console.log("Warning: content script was disconnected from background page, but recovered")
					}
					catch (e)
					{
						console.log("Error while sending data to background page:", e)
					}
				}
			}
		},
		mouseclick: function (e)
		{
			switch (this.config.post_templates && this.postTemplateAction(e.target), e.target.id)
			{
			case "notebook":
				return this.usernotes.open(e.target), void e.preventDefault();
			case "quick_image":
				return imagemap.init(), void e.preventDefault()
			}
			switch (e.target.className)
			{
			case "l":
				return void(0 === e.target.title.indexOf("/index.php") ? (this.links.fixRelativeUrls(e.target, "wiki"), e.preventDefault()) : 0 === e.target.title.indexOf("/imap/") ? (this.links.fixRelativeUrls(e.target, "imagemap"), e.preventDefault()) : -1 < e.target.innerHTML.indexOf("://archives.endoftheinte") && (this.links.fixRelativeUrls(e.target, "archives"), e.preventDefault()));
			case "emoji_button":
				return this.emojis.toggleMenu(e), void e.preventDefault();
			case "clear_emoji_history":
				return this.emojis.clearHistory(), void e.preventDefault();
			case "like_button":
				return this.likeButton.buildText(e.target), void e.preventDefault();
			case "like_button_custom":
				for (var t = e.target.id, s = 0, n = e.path.length; s < n; s++)
				{
					var a = e.path[s];
					if ("like_button" == a.className)
					{
						this.likeButton.buildText(a, t);
						break
					}
				}
				return void e.preventDefault();
			case "archivequote":
				return this.archiveQuotes.handler(e), void e.preventDefault();
			case "youtube":
				return void("DIV" === e.target.tagName ? e.preventDefault() : this.youtube.hideEmbedLink());
			case "streamable":
				return void("DIV" === e.target.tagName ? e.preventDefault() : this.streamable.hideEmbedLink());
			case "embed_nws_gfy":
				return t = e.target.parentNode.id.replace("_embed", ""), this.gfycat.embed(document.getElementById(t)), void e.preventDefault();
			case "embed_nws_imgur":
				this.imgur.embed(e.target.parentNode), e.preventDefault();
				break;
			case "embed":
				return this.youtube.embed(e.target.parentNode), void e.preventDefault();
			case "embedStreamable":
				return this.streamable.embed(e.target.parentNode),this.streamable.hideEmbedLink(), void e.preventDefault();
			case "hide":
				return this.youtube.hide(e.target.parentNode), this.youtube.hideEmbedLink(), void e.preventDefault();
			case "hideStreamable":
				return this.streamable.hide(e.target.parentNode), this.streamable.hideEmbedLink(), void e.preventDefault();
			case "embed_tweet":
				return this.twitter.embed(e.target.parentNode), void e.preventDefault();
			case "emoji_type":
				return this.emojis.switchType(e), void e.preventDefault();
			case "emoji":
				return this.emojis.selectEmoji(e), void e.preventDefault()
			}
			e.target.parentNode && "img-loaded" === e.target.parentNode.className && e.shiftKey ? e.preventDefault() : messageList.config.loadquotes && "A" === e.target.tagName && "[quoted text omitted]" === e.target.innerHTML && (s = (t = e.target.parentNode.getAttribute("msgid").split(","))[2].split("@"), e.target.id = "id=" + s[0] + "&topic=" + t[1] + "&r=" + s[1], messageList.omittedQuoteLoader.loadMessage(e.target), e.preventDefault())
		},
		mouseenter: function (e)
		{
			switch (e.target.className)
			{
			case "like_button":
				this.config.custom_like_button && 0 < this.config.custom_like_data.length && (this.cachedEvent = e, this.menuDebouncer = setTimeout(this.likeButton.showOptions.bind(this.likeButton), 250));
				break;
			case "username_anchor":
				allPages.cachedEvent = e, this.popupDebouncer = setTimeout(allPages.userInfoPopup.handler.bind(allPages.userInfoPopup), 750);
				break;
			case "youtube":
				this.youtube.debouncerId = setTimeout(this.youtube.showEmbedLink.bind(this.youtube, e), 400)
			case "streamable":
				this.streamable.debouncerId = setTimeout(this.streamable.showEmbedLink.bind(this.streamable, e), 400)
			}
			e.target.className && e.target.classList.contains("nws_gfycat") ? this.gfycat.debouncerId = setTimeout(this.gfycat.showEmbedLink.bind(this.gfycat, e), 400) : e.target.className && e.target.classList.contains("nws_imgur") ? this.imgur.debouncerId = setTimeout(this.imgur.showEmbedLink.bind(this.imgur, e), 400) : e.target.className && e.target.classList.contains("click_embed_tweet") && (this.twitter.debouncerId = setTimeout(this.twitter.showEmbedLink.bind(this.twitter, e), 400))
		},
		mouseleave: function (e)
		{
			clearTimeout(this.youtube.debouncerId), clearTimeout(this.streamable.debouncerId), clearTimeout(this.gfycat.debouncerId), clearTimeout(this.imgur.debouncerId), clearTimeout(this.twitter.debouncerId), clearTimeout(this.menuDebouncer), clearTimeout(this.popupDebouncer), document.getElementById("hold_menu") ? (this.likeButton.hideOptions(), e.preventDefault()) : "youtube" === e.target.className ? this.youtube.hideEmbedLink() : "streamable" === e.target.className ? this.streamable.hideEmbedLink() : "nws_gfycat" === e.target.className ? this.gfycat.hideEmbedLink() : e.target.classList.contains("nws_imgur") ? this.imgur.hideEmbedLink() : e.target.classList.contains("click_embed_tweet") && this.twitter.hideEmbedLink()
		},
		keydown: function (e)
		{
			"image_search" === document.activeElement.id && (13 === e.keyCode && (imagemap.search.init.call(imagemap.search), clearTimeout(this.searchDebouncer), e.preventDefault()), this.config.auto_image_search && (this.searchDebouncer = setTimeout(imagemap.search.init.call(imagemap.search), 400)))
		}
	},
	mediaLoader: function ()
	{
		for (var e = document.getElementsByClassName("media"), t = window.innerHeight, s = [], n = 0, a = e.length; n < a; n++)
		{
			var i = e[n],
				o = i.getBoundingClientRect(),
				r = i.getAttribute("name");
			o.top > t + 200 || o.bottom < 0 ? "embedded" != r && "embedded_thumb" != r || i.getElementsByTagName("video")[0].paused || i.getElementsByTagName("video")[0].pause() : "A" == i.tagName ? (messageList.preventSigEmbeds(i), i.classList.contains("gfycat") ? messageList.gfycat.checkLink(i) : i.classList.contains("imgur") ? messageList.imgur.checkLink(i) : i.classList.contains("twitter") ? messageList.twitter.checkLink(i) : i.classList.contains("ignore") && s.push(i)) : "placeholder" == r ? i.classList.contains("gfycat") ? messageList.gfycat.embed(i) : i.classList.contains("imgur") && messageList.imgur.embed(i) : "embedded" == r && i.getElementsByTagName("video")[0].paused && i.getElementsByTagName("video")[0].play()
		}
		for (n = 0, a = s.length; n < a; n++) s[n].className = "l"
	},
	mediaPauser: function ()
	{
		if (document.hidden)
			for (var e, t = document.getElementsByTagName("video"), s = 0, n = t.length; s < n; s++)(e = t[s]).src && !e.paused && e.pause();
		else messageList.mediaLoader()
	},
	preventSigEmbeds: function (e)
	{
		if (-1 !== (t = e.closest(".message")).innerHTML.indexOf("---"))
			for (var t, s = (t = t.childNodes).length - 1; s--;)
			{
				var n = t[s];
				if (3 === n.nodeType && "---" === n.nodeValue.replace(/^\s+|\s+$/g, ""))
				{
					s = Array.prototype.indexOf.call(t, n), Array.prototype.indexOf.call(t, e) > s && (e.classList.remove("imgur", "gfycat"), e.classList.add("ignore"));
					break
				}
			}
	},
	gfycat:
	{
		debouncerId: "",
		checkLink: function (s)
		{
			var n = s.getAttribute("href");
			if (s.classList.contains("checked") != true) {
				s.classList.add("checked");
				this.getDataFromApi(n, s);
			}
		},
		getDataFromApi: function (e, i)
		{
			var t = e.split("/").slice(-1)[0].split("-")[0];

			var n = document.createElement("iframe");
			n.setAttribute("src", `https://gfycat.com/ifr/${t}?hd=1`);
			n.setAttribute("allowfullscreen", '');
			n.setAttribute("frameborder", "0");
			n.setAttribute("scrolling", "no");
			n.setAttribute("width", "640");
			n.setAttribute("height", "453");

			i.parentNode.insertBefore(n, i), i.style.display = "none";
		},
		createPlaceholder: function (e, t, s)
		{
			var n = document.createElement("div");
			n.classList.add("media", "gfycat"), n.id = s.webm, n.setAttribute("name", "placeholder");
			var a = document.createElement("video");
			a.setAttribute("width", s.width), a.setAttribute("height", s.height), a.setAttribute("loop", !0), n.appendChild(a), messageList.media.addDragToResizeListener(a), messageList.config.show_gfycat_link && ((s = document.createElement("a")).href = t, s.innerHTML = "<br><br>" + t, n.appendChild(s)), e.parentNode.insertBefore(n, e), e.style.display = "none", n.getBoundingClientRect().top > window.innerHeight || messageList.gfycat.embed(n)
		},
		createThumbnail: function (e, t, s, n)
		{
			var a = document.createElement("div");
			a.classList.add("media", "gfycat"), a.id = n.webm;
			var i = document.createElement("img");
			i.setAttribute("src", s), i.setAttribute("width", n.width), i.setAttribute("height", n.height), a.appendChild(i), messageList.media.addDragToResizeListener(i), messageList.config.show_gfycat_link && ((s = document.createElement("a")).href = t, s.innerHTML = "<br><br>" + t, a.appendChild(s)), e.parentNode.insertBefore(a, e), e.style.display = "none";
			var o = a.getElementsByTagName("img")[0];
			o.title = "Click to play", o.addEventListener("click", function (e)
			{
				e.preventDefault();
				var t = document.createElement("video");
				t.setAttribute("width", n.width), t.setAttribute("height", n.height), t.setAttribute("loop", !0), e.target.parentNode.replaceChild(t, o), t = a.getElementsByTagName("video")[0], a.setAttribute("name", "embedded_thumb"), t.src = a.id, t.title = "Click to pause", t.play(), t.addEventListener("click", function ()
				{
					t.title = "Click to play/pause", t.paused ? t.play() : t.pause()
				})
			})
		},
		checkWorkSafe: function (e, t, s)
		{
			if (messageList.tags.includes("NWS") || messageList.tags.includes("NLS")) s(!0);
			else
			{
				var n = e.parentNode;
				"1" === t || n && /(n[wl]s)/i.test(n.innerHTML) ? (e.classList.remove("gfycat"), e.classList.add("nws_gfycat"), s(!1)) : s(!0)
			}
		},
		showEmbedLink: function (e)
		{
			e = e.target;
			var t = document.createElement("a");
			t.id = e.id, t.className = "embed_nws_gfy", t.href = "#embed", t.style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor, t.style.display = "inline", t.style.position = "absolute", t.style.zIndex = 1, t.style.fontWeight = "bold", t.innerHTML = "&nbsp[Embed NWS Gfycat]", e.appendChild(t)
		},
		hideEmbedLink: function ()
		{
			if (0 < document.getElementsByClassName("embed_nws_gfy").length)
			{
				var e = document.getElementsByClassName("embed_nws_gfy")[0];
				e.parentNode.removeChild(e)
			}
		},
		embed: function (e)
		{
			if (e.classList.contains("gfycat"))
			{
				var t = e.getElementsByTagName("video")[0];
				e.setAttribute("name", "embedded"), t.src = e.id, t.play()
			}
			else if (e.classList.contains("nws_gfycat"))
			{
				t = document.createElement("video");
				var s = e.getAttribute("w"),
					n = e.getAttribute("h");
				t.setAttribute("width", s), t.setAttribute("height", n), t.setAttribute("name", "embedded"), t.setAttribute("loop", !0), t.src = e.id, e.parentNode.replaceChild(t, e), t.play()
			}
		}
	},
	imgur:
	{
		debouncerId: "",
		checkLink: function (n)
		{
			var a = n.href;
			n.classList.contains("checked") || (n.classList.add("checked"), this.getDataFromApi(a, function (e)
			{
				if (e.error)
				{
					if (n.classList.contains("imgur"))
					{
						var t = document.createElement("span");
						t.style.display = "inline-block";
						var s = document.createElement("span");
						s.style.textDecoration = "none", s.style.verticalAlign = "super", s.style.fontSize = "smaller", s.style.color = "red", s.innerHTML = "&nbsp" + e.status, s.title = e.error, t.appendChild(s), n.appendChild(t)
					}
					n.className = "l"
				}
				else messageList.config.hide_nws_gfycat && (e.nsfw || messageList.imgur.postContainsNsfw(n)) ? (n.classList.remove("imgur"), n.classList.add("nws_imgur"), n.setAttribute("width", e.width), n.setAttribute("height", e.height), n.id = e.url, n.addEventListener("mouseenter", messageList.handleEvent.mouseenter.bind(messageList)), n.addEventListener("mouseleave", messageList.handleEvent.mouseleave.bind(messageList))) : e.images_count && 0 < e.images_count ? (n.id = a, messageList.imgur.createGallery(n, e)) : "imgur_thumb" == n.getAttribute("name") ? (t = (t = a.split("/").slice(-1).join("/")).split(".")[0], messageList.imgur.createThumbnail(n, window.location.protocol + "//i.imgur.com/" + t + "l.jpg", e)) : e.animated ? messageList.imgur.createPlaceholder(n, e) : messageList.imgur.createThumbnail(n, e.url, e)
			}))
		},
		postContainsNsfw: function (e)
		{
			return /(n(\s*?)[wl](\s*?)s)/i.test(e.parentNode.innerHTML)
		},
		getDataFromApi: function (e, t)
		{
			var s = this,
				n = "https://api.imgur.com/3/" + this.getApiPath(e);
			chrome.runtime.sendMessage(
			{
				need: "xhr",
				url: n,
				auth: "Client-ID 6356976da2dad83"
			}, function (e)
			{
				e = JSON.parse(e), s.handleResponse(e, t)
			})
		},
		getApiPath: function (e)
		{
			var t = (t = e.split("/").slice(-1).join("/")).split(".")[0];
			return -1 < e.indexOf("/a/") ? "album/" + t : -1 < e.indexOf("/gallery/") ? "gallery/album/" + t : "image/" + t
		},
		handleResponse: function (e, t)
		{
			e.success ? e.data.images ? t(this.prepareGalleryData(e.data)) : t(this.prepareImageData(e.data)) : t(
			{
				status: e.status,
				error: e.data.error
			})
		},
		prepareImageData: function (e)
		{
			var t = {};
			return t.nsfw = e.nsfw, t.title = e.title, t.url = e.mp4 || e.link, t.animated = e.animated, t.width = e.width, t.height = e.height, messageList.config.resize_gfys && e.width * messageList.zoomLevel > messageList.config.gfy_max_width && (e = messageList.config.gfy_max_width / (e.width * messageList.zoomLevel), t.width = messageList.config.gfy_max_width / messageList.zoomLevel, t.height *= e), t
		},
		prepareGalleryData: function (e)
		{
			var t = {};
			return t.nsfw = e.nsfw, t.title = e.title, t.description = e.description, t.images = e.images, t.images_count = e.images_count, t
		},
		createGallery: function (e, t)
		{
			var s = this,
				n = 0,
				a = this.prepareImageData(t.images[n]);
			if (1 === t.images_count) this.createPlaceholder(e, a);
			else
			{
				var i = document.createElement("div");
				i.className = "imgur_gallery", i.id = e.id;
				var o = document.createElement("span");
				o.className = "imgur_gallery_title", o.innerHTML = t.title, i.appendChild(o);
				var r = document.createElement("span");
				r.className = "imgur_gallery_index", r.innerText = n + 1 + "/" + t.images_count, i.appendChild(r), o = document.createElement("div"), i.appendChild(o), a.animated ? this.createPlaceholder(o, a) : this.createThumbnail(o, a.url, a), (a = document.createElement("span")).className = "imgur_gallery_left", a.innerText = "‹", (o = document.createElement("span")).className = "imgur_gallery_right", o.innerHTML = "›", i.appendChild(a), i.appendChild(o), e.parentNode.insertBefore(i, e), e.style.display = "none", a.addEventListener("click", function (e)
				{
					0 < n && (n--, r.innerText = n + 1 + "/" + t.images_count, s.displayNewGalleryImage(n, t, e.target.parentNode.children[2]))
				}), o.addEventListener("click", function (e)
				{
					n < t.images_count - 1 && (n++, r.innerText = n + 1 + "/" + t.images_count, s.displayNewGalleryImage(n, t, e.target.parentNode.children[2]))
				})
			}
		},
		displayNewGalleryImage: function (e, t, s)
		{
			e = this.prepareImageData(t.images[e]), t = s.firstChild.height, e.height !== t && (e.width *= t / e.height, e.height = t), e.animated ? this.createPlaceholder(s, e) : this.createThumbnail(s, e.url, e)
		},
		createThumbnail: function (e, t, s)
		{
			var n = document.createElement("div");
			s.title && (n.title = s.title), n.classList.add("media", "imgur"), n.id = s.url;
			var a = document.createElement("img");
			if (a.setAttribute("src", t), a.setAttribute("width", s.width), a.setAttribute("height", s.height), n.appendChild(a), messageList.config.show_gfycat_link && ((t = document.createElement("a")).href = s.url, t.innerHTML = "<br><br>" + s.url, n.appendChild(t)), messageList.media.addDragToResizeListener(a), e.parentNode.insertBefore(n, e), e.style.display = "none", s.animated)
			{
				var i = n.getElementsByTagName("img")[0];
				i.title = "Click to play", i.addEventListener("click", function (e)
				{
					e.preventDefault();
					var t = document.createElement("video");
					t.setAttribute("width", s.width), t.setAttribute("height", s.height), t.setAttribute("loop", !0), e.target.parentNode.replaceChild(t, i), t = n.getElementsByTagName("video")[0], n.setAttribute("name", "embedded_thumb"), t.src = n.id, t.title = "Click to pause", t.play(), t.addEventListener("click", function ()
					{
						t.title = "Click to play/pause", t.paused ? t.play() : t.pause()
					})
				})
			}
		},
		createPlaceholder: function (e, t)
		{
			var s = document.createElement("div");
			s.title = t.title || t.url || t.mp4, s.classList.add("media", "imgur"), s.id = t.url || t.mp4, s.setAttribute("name", "placeholder");
			var n = document.createElement("video");
			n.setAttribute("width", t.width), n.setAttribute("height", t.height), n.setAttribute("loop", !0), s.appendChild(n), messageList.media.addDragToResizeListener(n), messageList.config.show_gfycat_link && ((n = document.createElement("a")).href = t.url, n.innerHTML = "<br><br>" + t.url, s.appendChild(n)), e.parentNode.insertBefore(s, e), e.style.display = "none", s.getBoundingClientRect().top > window.innerHeight || messageList.imgur.embed(s)
		},
		embed: function (e)
		{
			if (e.classList.contains("imgur"))
			{
				var t = e.getElementsByTagName("video")[0];
				e.setAttribute("name", "embedded"), t.src = e.id, t.play()
			}
			else if (e.classList.contains("nws_imgur"))
			{
				t = document.createElement("video");
				var s = e.getAttribute("width"),
					n = e.getAttribute("height");
				t.setAttribute("width", s), t.setAttribute("height", n), t.setAttribute("name", "embedded"), t.setAttribute("loop", !0), t.src = e.id, e.parentNode.replaceChild(t, e), t.play()
			}
		},
		showEmbedLink: function (e)
		{
			e = e.target;
			var t = document.createElement("a");
			t.id = e.id, t.className = "embed_nws_imgur", t.href = "#embed", t.style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor, t.style.display = "inline", t.style.position = "absolute", t.style.zIndex = 1, t.style.fontWeight = "bold", t.innerHTML = "&nbsp[Embed NWS Imgur]", e.appendChild(t)
		},
		hideEmbedLink: function ()
		{
			if (0 < document.getElementsByClassName("embed_nws_imgur").length)
			{
				var e = document.getElementsByClassName("embed_nws_imgur")[0];
				e.parentNode.removeChild(e)
			}
		}
	},
	twitter:
	{
		debouncerId: 0,
		injectWidgets: function ()
		{
			var e = document.createElement("script");
			e.src = chrome.extension.getURL("/lib/widgets.js"), e.onload = function ()
			{
				this.remove()
			}, document.head.appendChild(e)
		},
		injectLoadScript: function (e)
		{
			var t = document.createElement("script");
			t.innerHTML = 'if (window.twttr) { twttr.widgets.load(document.getElementById("' + e + '")) };', t.onload = function ()
			{
				this.remove()
			}, document.head.appendChild(t)
		},
		showEmbedLink: function (e)
		{
			e = e.target;
			var t = document.createElement("span");
			t.id = e.id, t.className = "embed_tweet", t.style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor, t.style.display = "inline", t.style.position = "absolute", t.style.zIndex = 1, t.style.fontWeight = "bold", t.style.textDecoration = "underline", t.style.cursor = "pointer", t.innerHTML = "&nbsp[Embed]", e.appendChild(t)
		},
		hideEmbedLink: function ()
		{
			if (0 < document.getElementsByClassName("embed_tweet").length)
			{
				var e = document.getElementsByClassName("embed_tweet")[0];
				e.parentNode.removeChild(e)
			}
		},
		checkLink: function (e)
		{
			e.classList.contains("checked") || (e.classList.contains("click_embed_tweet") ? (e.addEventListener("mouseenter", messageList.handleEvent.mouseenter.bind(messageList)), e.addEventListener("mouseleave", messageList.handleEvent.mouseleave.bind(messageList))) : this.embed(e), e.classList.add("checked"))
		},
		postContainsNsfw: function (e)
		{
			return !(!messageList.tags.includes("NWS") && !messageList.tags.includes("NLS")) || ("spoiler_on_open" === e.parentNode.className ? /(n(\s*?)[wl](\s*?)s)/i.test(e.parentNode.parentNode.parentNode.innerHTML) : /(n(\s*?)[wl](\s*?)s)/i.test(e.parentNode.innerHTML))
		},
		checkHideMedia: function (e)
		{
			return messageList.config.hide_tweet_media || messageList.config.hide_nws_tweets && this.postContainsNsfw(e)
		},
		getEmbedUrl: function (e)
		{
			return "https://publish.twitter.com/oembed?url=" + encodeURIComponent(e.href) + "&omit_script=true&theme=" + (messageList.config.dark_tweets ? "dark" : "light") + "&hide_media=" + (this.checkHideMedia(e) ? "true" : "false")
		},
		embed: function (t)
		{
			var s = this;
			chrome.runtime.sendMessage(
			{
				need: "xhr",
				url: this.getEmbedUrl(t)
			}, function (e)
			{
				e = JSON.parse(e), s.reallyEmbed(t, s, e)
			})
		},
		reallyEmbed: function (e, t, s)
		{
			var n = document.createElement("div");
			n.className = "embedded_tweet", n.innerHTML = s.html, n.id = e.id, e.parentNode.insertBefore(n, e), e.className = "l", e.style.display = "none", t.injectLoadScript(n.id)
		}
	},
	youtube:
	{
		debouncerId: "",
		showEmbedLink: function (e)
		{
			e = e.target;
			var t = document.createElement("span");
			t.id = e.id, t.className = "embed", t.style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor, t.style.display = "inline", t.style.position = "absolute", t.style.zIndex = 1, t.style.fontWeight = "bold", t.style.textDecoration = "underline", t.style.cursor = "pointer", t.innerHTML = "&nbsp[Embed]", e.appendChild(t)
		},
		hideEmbedLink: function ()
		{
			if (0 < document.getElementsByClassName("embed").length)
			{
				var e = document.getElementsByClassName("embed")[0];
				e.parentNode.removeChild(e)
			}
			else 0 < document.getElementsByClassName("hide").length && (e = document.getElementsByClassName("hide")[0]).parentNode.removeChild(e)
		},
		embed: function (e)
		{
			var t, s, n = document.getElementById(e.id),
				a = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor,
				i = (t = n.href).match(/(\?|\&|#)(t=)/);
			i && (s = t.substring(i.index, t.length).match(/([0-9])+([h|m|s])?/g)), t = (t = e.id.match(/^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/)) && 11 == t[2].length ? t[2] : t, s && (t += this.buildTimeCode(s)), this.hideEmbedLink(), n.className = "hideme", n.appendChild(this.createYouTubeElements(e.id, t, a))
		},
		buildTimeCode: function (e)
		{
			for (var t = 0, s = 0, n = e.length; s < n; s++)
			{
				var a = e[s];
				/([h|m|s])/.test(a) ? -1 < a.indexOf("h") ? t += 3600 * (a = Number(a.replace("h", ""), 10)) : -1 < a.indexOf("m") ? t += 60 * (a = parseInt(a.replace("m", ""), 10)) : -1 < a.indexOf("s") && (t += parseInt(a.replace("s", ""), 10)) : t += a
			}
			return "?start=" + t
		},
		createYouTubeElements: function (e, t, s)
		{
			var n = document.createElement("span");
			n.style.display = "inline", n.style.position = "absolute", n.style.backgroundColor = s, n.style.fontWeight = "bold", n.style.textDecoration = "underline", n.style.cursor = "pointer", n.style.zIndex = 1, n.className = "hide", n.id = e, n.innerHTML = "&nbsp[Hide]", s = document.createElement("br");
			var a = document.createElement("div");
			a.className = "youtube";
			var i = document.createElement("iframe");
			return i.id = "yt" + e, i.src = "https://www.youtube.com/embed/" + t, i.setAttribute("type", "text/html"), i.setAttribute("width", 640), i.setAttribute("height", 390), i.setAttribute("autoplay", 0), i.setAttribute("frameborder", 0), i.setAttribute("allowfullscreen", "allowfullscreen"), e = document.createDocumentFragment(), a.appendChild(i), e.appendChild(n), e.appendChild(s), e.appendChild(a), e
		},
		hide: function (e)
		{
			for (var t, s = (e = document.getElementById(e.id)).childNodes.length; s--;) "#text" !== (t = e.childNodes[s]).nodeName && "SPAN" !== t.tagName && e.removeChild(t);
			e.className = "youtube"
		}
	},
	streamable:
	{
		debouncerId: "",
		showEmbedLink: function (e)
		{
			e = e.target;
			var t = document.createElement("span");
			t.id = e.id, t.className = "embedStreamable", t.style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor, t.style.display = "inline", t.style.position = "absolute", t.style.zIndex = 1, t.style.fontWeight = "bold", t.style.textDecoration = "underline", t.style.cursor = "pointer", t.innerHTML = "&nbsp[Embed]", e.appendChild(t)
		},
		hideEmbedLink: function ()
		{
			if (0 < document.getElementsByClassName("embedStreamable").length)
			{
				var e = document.getElementsByClassName("embedStreamable")[0];
				e.parentNode.removeChild(e)
			}
			else 0 < document.getElementsByClassName("hideStreamable").length && (e = document.getElementsByClassName("hideStreamable")[0]).parentNode.removeChild(e)
		},
		embed: function (e)
		{
			var t, s, n = document.getElementById(e.id),
				a = window.getComputedStyle(document.getElementsByClassName("message")[0]).backgroundColor,
				i = (t = n.href).match(/(\?|\&|#)(t=)/);
			i && (s = t.substring(i.index, t.length).match(/([0-9])+([h|m|s])?/g)), t = (t = e.id.match(/streamable.com\/(.*).*/)) && t[1], s && this.hideEmbedLink(), n.className = "hideme", n.appendChild(this.createStreamableElements(e.id, t, a))
		},
	
		createStreamableElements: function (e, t, s)
		{
			var n = document.createElement("span");
			n.style.display = "inline", n.style.position = "absolute", n.style.backgroundColor = s, n.style.fontWeight = "bold", n.style.textDecoration = "underline", n.style.cursor = "pointer", n.style.zIndex = 1, n.className = "hide", n.id = e, n.innerHTML = "&nbsp[Hide]", s = document.createElement("br");
			var a = document.createElement("div");
			a.className = "streamable";
			var i = document.createElement("iframe");
			return i.id = "st" + e, i.src = "https://www.streamable.com/e/" + t, i.setAttribute("type", "text/html"), i.setAttribute("width", 640), i.setAttribute("height", 390), i.setAttribute("autoplay", 0), i.setAttribute("frameborder", 0), i.setAttribute("allowfullscreen", "allowfullscreen"), e = document.createDocumentFragment(), a.appendChild(i), e.appendChild(n), e.appendChild(s), e.appendChild(a), e
		},
		hide: function (e)
		{
			for (var t, s = (e = document.getElementById(e.id)).childNodes.length; s--;) "#text" !== (t = e.childNodes[s]).nodeName && "SPAN" !== t.tagName && e.removeChild(t);
			e.className = "streamable"
		}
	},
	snippet:
	{
		handler: function (e, t)
		{
			var s, n = e.substring(0, t),
				a = document.getElementsyName("message")[0];
			for (var i in -1 < n.indexOf(" ") ? -1 < (s = (s = n.split(" "))[s.length - 1]).indexOf("\n") && (s = (s = s.split("\n"))[s.length - 1]) : s = -1 < n.indexOf("\n") ? (s = n.split("\n"))[s.length - 1] : n, messageList.config.snippet_data)
				if (i === s)
				{
					var o = messageList.config.snippet_data[i],
						r = n.lastIndexOf(s);
					r = n.substring(0, r);
					e = e.replace(n, r + o), o = (a.value = e).lastIndexOf(o) + o.length, a.setSelectionRange(o, o)
				}
		}
	},
	usernotes:
	{
		open: function (e)
		{
			var t = e.href.match(/note(\d+)$/i)[1];
			document.getElementById("notepage") ? (t = (e = document.getElementById("notepage")).parentNode.getElementsByTagName("a")[0].href.match(/user=(\d+)$/i)[1], messageList.config.usernote_notes[t] = e.value, e.parentNode.removeChild(e), messageList.usernotes.save()) : (t = messageList.config.usernote_notes[t], page = document.createElement("textarea"), page.id = "notepage", page.value = null == t ? "" : t, page.style.width = "100%", page.style.opacity = ".6", e.parentNode.appendChild(page))
		},
		save: function ()
		{
			messageList.sendMessage(
			{
				need: "save",
				name: "usernote_notes",
				data: messageList.config.usernote_notes
			})
		}
	},
	markupBuilder:
	{
		depth: 0,
		build: function (e)
		{
			for (var t = "", s = 0, n = (e = e.childNodes).length; s < n; s++)
			{
				if (3 === (a = e[s]).nodeType)
				{
					if ("---" == a.nodeValue.replace(/^\s+|\s+$/g, "")) break;
					t += a.nodeValue
				}
				if (a.tagName)
					if ("B" == a.tagName || "I" == a.tagName || "U" == a.tagName) t = t + "<" + (i = a.tagName.toLowerCase()) + ">" + a.innerText + "</" + i + ">";
					else "A" == a.tagName && (t += a.href);
				if (a.className) switch (a.className)
				{
				case "pr":
					t += "<pre>" + a.innerHTML.replace(/<br>/g, "") + "</pre>";
					break;
				case "imgs":
					for (var a, i = 0, o = (a = a.getElementsByTagName("A")).length; i < o; i++) t += '<img imgsrc="' + a[i].getAttribute("imgsrc") + '" />\n';
					break;
				case "spoiler_closed":
					t += this.buildSpoiler(a);
					break;
				case "quoted-message":
					this.depth++, t += this.buildQuote(a), this.depth--;
					break;
				case "media gfycat":
				case "media imgur":
				case "imgur_gallery":
					t += a.id
				}
			}
			return t
		},
		buildQuote: function (e)
		{
			var t = "<quote>",
				s = e.attributes.msgid.value;
			return s && (t = '<quote msgid="' + s + '">'), 2 <= this.depth && s ? t + "</quote>" : t + this.build(e) + "</quote>"
		},
		buildSpoiler: function (e)
		{
			var t = "<spoiler>",
				s = e.getElementsByClassName("spoiler_on_open")[0];
			return (e = (e = e.getElementsByClassName("caption")[0].innerText.replace(/<|\/>/g, "")).slice(0, -1)) && "spoiler" !== e && (t = '<spoiler caption="' + e + '">'), s.removeChild(s.firstChild), s.removeChild(s.lastChild), t + this.build(s) + "</spoiler>"
		}
	},
	media:
	{
		expandThumbnail: function (e)
		{
			if (!e.shiftKey)
			{
				var t = e.target.parentNode.parentNode.childNodes.length;
				if (1 == t)
				{
					(t = document.createElement("span")).setAttribute("class", "img-loaded"), t.setAttribute("id", e.target.parentNode.getAttribute("id") + "_expanded");
					var s = e.target.parentNode.parentNode.getAttribute("imgsrc");
					"https:" == window.location.protocol && (s = s.replace(/^http:/i, "https:"));
					var n = document.createElement("img");
					n.src = s, t.insertBefore(n, null), n.onload = function ()
					{
						messageList.media.addDragToResizeListener(this)
					}, e.target.parentNode.parentNode.insertBefore(t, e.target.parentNode), e.target.parentNode.style.display = "none"
				}
				else if (2 == t)
					for (e = e.target.parentNode.parentNode.childNodes, t = 0; t < e.length; t++) e[t].style.display = "none" == e[t].style.display ? "" : "none";
				else messageList.config.debug && console.log("Couldn't expand thumbnail - weird number of siblings")
			}
		},
		resize: function (e)
		{
			e.width * messageList.zoomLevel > messageList.config.img_max_width && (e.height = e.height / (e.width / messageList.config.img_max_width) / messageList.zoomLevel, e.parentNode.style.height = e.height + "px", e.width = messageList.config.img_max_width / messageList.zoomLevel, e.parentNode.style.width = e.width + "px")
		},
		imgPlaceholderObserver: new MutationObserver(function (e)
		{
			for (var t = 0; t < e.length; t++)
			{
				var s = e[t];
				if (messageList.config.resize_imgs && messageList.media.resize(s.target.childNodes[0]), "attributes" === s.type && "class" == s.attributeName && "img-loaded" == s.target.getAttribute("class"))
				{
					var n = s.target;
					/.*\/i\/t\/.*/.test(n.firstChild.src) && (n.parentNode.addEventListener("click", messageList.media.expandThumbnail), n.parentNode.setAttribute("class", "thumbnailed_image"), n.parentNode.setAttribute("oldHref", s.target.parentNode.getAttribute("href")), n.parentNode.removeAttribute("href")), s = n.firstChild, n.style = "", messageList.media.addDragToResizeListener(s)
				}
			}
		}),
		imageDataArray: [],
		shouldDrag: !1,
		lastResized: void 0,
		initDragToResize: function ()
		{
			var l = this;
			document.body.addEventListener("mousemove", function (e)
			{
				if (l.shouldDrag && e.target.isEqualNode(l.lastResized))
					if (e.clientX < e.target.getBoundingClientRect().left) l.shouldDrag = !1;
					else
					{
						var t = l.imageDataArray[e.target.getAttribute("image_index")],
							s = e.target.width,
							n = e.target.height;
						if (s && n)
						{
							var a, i = e.clientX - t.startX,
								o = e.clientY - t.startY,
								r = (i + o) / 2;
							if (0 < i || 0 < o) a = Math.max(i, o, r);
							else
							{
								if (!(i < 0 || a < 0)) return;
								a = Math.min(i, o, r)
							}(i = s + a) >= t.minWidth && ((s = Math.round(i / s * n)) >= t.minHeight && (e.target.width = i, e.target.height = s, t.startX = e.clientX, t.startY = e.clientY))
						}
					}
			}), document.body.addEventListener("mouseup", function (e)
			{
				l.lastResized && l.lastResized.height < l.lastResized.getBoundingClientRect().height && (l.lastResized.height = l.lastResized.getBoundingClientRect().height), l.shouldDrag = !1
			})
		},
		addDragToResizeListener: function (t)
		{
			var s = this,
				e = Math.min(100, t.width),
				n = e / t.width * t.height;
			t.width && t.height || (t.width = t.getBoundingClientRect().width, t.height = t.getBoundingClientRect().height), t.setAttribute("image_index", this.imageDataArray.length), this.imageDataArray.push(
			{
				minWidth: e,
				minHeight: n,
				originalWidth: t.width,
				originalHeight: t.height,
				startX: 0,
				startY: 0
			}), t.addEventListener("mousedown", function (e)
			{
				if ("img-loaded" !== e.target.parentNode.className || e.shiftKey)
				{
					var t = s.imageDataArray[e.target.getAttribute("image_index")];
					t.startX = e.clientX, t.startY = e.clientY, s.lastResized = e.target, s.shouldDrag = !0
				}
			}), t.addEventListener("dblclick", function (e)
			{
				e = s.imageDataArray[e.target.getAttribute("image_index")], t.width = e.originalWidth, t.height = e.originalHeight
			}), t.addEventListener("dragstart", function (e)
			{
				("img-loaded" !== e.target.parentNode.className || e.shiftKey) && e.preventDefault()
			})
		}
	},
	spoilers:
	{
		find: function (e)
		{
			e = document.getElementsByClassName("spoiler_on_close");
			for (var t, s = 0; e[s]; s++) t = e[s].getElementsByTagName("a")[0], messageList.spoilers.toggle(t)
		},
		toggle: function (e)
		{
			for (; !/spoiler_(?:open|close)/.test(e.className);) e = e.parentNode;
			return -1 < e.className.indexOf("closed") ? e.className = e.className.replace("closed", "opened") : e.className = e.className.replace("opened", "closed"), !1
		}
	},
	links:
	{
		uniqueIndex: 0,
		check: function (e)
		{
			var t = {},
				s = !1;
			if (0 != (e = (e || document).getElementsByClassName("l")).length)
			{
				var messageText;
				var linkText;
				var theRegex;

				for (var n = e.length, a = /youtube|youtu.be/, i = /^.*(youtu.be\/|v\/|u\/\w\/\/|watch\?v=|\&v=)([^#\&\?]*).*/; n--;)
				{
					var o = e[n];
					if (messageList.config.embed_on_hover && a.test(o.href) && i.test(o.href)) {
						o.className = "youtube";
						o.id = o.href + "&" + this.uniqueIndex;
						this.uniqueIndex++;
						o.addEventListener("mouseenter", messageList.handleEvent.mouseenter.bind(messageList));
						o.addEventListener("mouseleave", messageList.handleEvent.mouseleave.bind(messageList));
					} else if (messageList.config.embed_streamables && /streamable/.test(o.href)) {
						o.className = "streamable";
						o.id = o.href;
						o.addEventListener("mouseenter", messageList.handleEvent.mouseenter.bind(messageList));
						o.addEventListener("mouseleave", messageList.handleEvent.mouseleave.bind(messageList));
					} else if (messageList.config.embed_gfycat && -1 < o.href.indexOf("gfycat.com/")) {
							o.classList.add("media", "gfycat");
							s = !0;
							(messageList.config.embed_gfycat_thumbs || "quoted-message" == o.parentNode.className) && o.setAttribute("name", "gfycat_thumb");
					} else if (messageList.config.embed_imgur && -1 < o.href.indexOf("imgur.com/")) {
						o.classList.add("media", "imgur");
						s = !0;
						(messageList.config.embed_gfycat_thumbs || "quoted-message" == o.parentNode.className) && o.setAttribute("name", "imgur_thumb");
					} else if (messageList.config.embed_tweets && -1 < o.href.indexOf("twitter.com/") && -1 < o.href.indexOf("status")) {
						messageText = o.parentElement.textContent;
						linkText = o.textContent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
						theRegex = `---\n((.|\n)*)?${linkText}`;

						if (!messageText.match(theRegex)){
							o.classList.add("media", "twitter");
							s = !0;
							o.id = o.href + "&" + this.uniqueIndex, this.uniqueIndex++;
							(t[o.href] || "quoted-message" == o.parentNode.className) && o.classList.add("click_embed_tweet");
							t[o.href] = !0;
						}
					}

					if(messageList.config.embed_youtube && (a.test(o.href) && i.test(o.href)) && ("quoted-message" != o.parentNode.className)) {
						messageText = o.parentElement.textContent;
						linkText = o.textContent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
						theRegex = `---\n((.|\n)*)?${linkText}`;

						if (!messageText.match(theRegex)){
							messageList.youtube.embed(o);
						}
					}
				}
				s && (messageList.mediaLoader(), window.addEventListener("scroll", messageList.mediaLoader), document.addEventListener("visibilitychange", messageList.mediaPauser))
			}
		},
		fixRelativeUrls: function (e, t)
		{
			switch (t)
			{
			case "wiki":
				window.open(e.href.replace("boards", "wiki"));
				break;
			case "imagemap":
				window.open(e.href.replace("boards", "images"));
				break;
			case "archives":
				window.open(e.href.replace("boards", "archives"))
			}
		}
	},
	emojis:
	{
		categories: "🔁 😃 🐻 🍆 ⚽ 🌇 💡 💯 🚩 All".split(" "),
		addMenu: function ()
		{
			var e = document.getElementsByClassName("quickpost-body")[0],
				t = document.createElement("span");
			t.className = "emoji_button", t.innerHTML = " 🙂 ", e.insertBefore(t, e.getElementsByTagName("textarea")[0])
		},
		toggleMenu: function (e)
		{
			var t = document.getElementsByClassName("emoji_menu")[0];
			t ? document.body.removeChild(t) : messageList.emojis.openMenu(e)
		},
		openMenu: function (e)
		{
			e = document.createElement("div");
			var t = window.innerWidth,
				s = window.innerHeight,
				n = document.createElement("div");
			n.id = "close_options", n.className = "close", e.style.width = .95 * t + "px", e.style.height = .4 * s + "px", e.style.left = t - .975 * t + "px", e.style.top = s - .975 * s + "px", e.className = "emoji_menu", (t = document.createElement("div")).className = "emoji_selector", (s = document.createElement("ul")).className = "emoji_selector_container", s.append(document.createElement("br"));
			for (var a = 0, i = this.categories.length; a < i; a++)
			{
				var o = this.categories[a],
					r = document.createElement("li");
				r.innerHTML = o, r.id = o, r.className = "emoji_type", s.appendChild(r)
			}
			t.appendChild(s), (s = document.createElement("div")).className = "emoji_display", s.appendChild(document.createElement("br")), e.appendChild(n), e.appendChild(t), e.appendChild(s), document.body.appendChild(e), !messageList.config.emoji_history || messageList.config.emoji_history.length < 1 ? this.displayCategory("😃") : this.displayCategory("🔁"), document.body.addEventListener("click", this.menuCloseIntentCheck)
		},
		menuCloseIntentCheck: function (e)
		{
			if ("Your message must be at least 5 characters" !== e.target.innerHTML && "Know the rules! Mouse over the tags to learn more." !== e.target.innerHTML)
			{
				var t = e.target.className;
				if (t && !/quickpost/.test(t) && !/emoji/.test(t) && !/tag/.test(t) || "quickpost-nub" === t || "close" === t) messageList.emojis.closeMenuFromListener();
				else
				{
					if (e.target.parentNode)
					{
						var s = e.target.parentNode.className;
						if (s && !/quickpost/.test(s) && !/emoji/.test(s) && !/tag/.test(s)) return void messageList.emojis.closeMenuFromListener()
					}
					"post" === e.target.getAttribute("name") ? messageList.emojis.closeMenuFromListener() : "emoji_button" === t && document.body.removeEventListener("click", messageList.emojis.menuCloseIntentCheck)
				}
			}
		},
		closeMenuFromListener: function ()
		{
			document.body.removeEventListener("click", messageList.emojis.menuCloseIntentCheck), messageList.emojis.toggleMenu()
		},
		selectEmoji: function (e)
		{
			var t = document.getElementsByTagName("textarea")[0];
			e = e.target.innerHTML;
			var s = t.selectionStart;
			t.value = t.value.substring(0, s) + e + t.value.substring(s, t.value.length);
			var n = s + e.length;
			setTimeout(function ()
			{
				t.focus(), t.setSelectionRange(n, n)
			}, 0), -1 === messageList.config.emoji_history.indexOf(e) && (messageList.config.emoji_history.push(e), messageList.sendMessage(
			{
				need: "save",
				name: "emoji_history",
				data: messageList.config.emoji_history
			}))
		},
		clearHistory: function ()
		{
			messageList.config.emoji_history = [], messageList.sendMessage(
			{
				need: "save",
				name: "emoji_history",
				data: []
			});
			var e = document.getElementsByClassName("emoji_display")[0];
			e.innerHTML = "<br>";
			var t = document.createElement("span");
			t.innerHTML = "Clear", t.className = "clear_emoji_history", e.appendChild(t)
		},
		switchType: function (e)
		{
			document.getElementsByClassName("selected")[0].classList.remove("selected"), this.displayCategory(e.target.innerHTML)
		},
		displayAll: function ()
		{
			var e = document.getElementsByClassName("emoji_display")[0];
			e.innerHTML = "<br>";
			for (var t = 0, s = this.categories.length; t < s; t++)
			{
				if ("All" !== (n = this.categories[t]) && "🔁" !== n)
				{
					var n, a = document.createDocumentFragment(),
						i = 0;
					for (s = (n = this.getEmojis(n)).length; i < s; i++)
					{
						var o = n[i],
							r = document.createElement("span");
						r.innerHTML = o, r.className = "emoji", a.appendChild(r)
					}
					e.appendChild(a)
				}
			}
		},
		displayCategory: function (e)
		{
			var t = document.getElementsByClassName("emoji_display")[0];
			t.innerHTML = "<br>", document.getElementById(e).classList.add("selected");
			for (var s = this.getEmojis(e), n = document.createDocumentFragment(), a = 0, i = s.length; a < i; a++)
			{
				var o = s[a],
					r = document.createElement("span");
				r.innerHTML = o, r.id = o, r.className = "emoji", n.appendChild(r)
			}
			"🔁" === e && ((e = document.createElement("span")).innerHTML = "Clear", e.className = "clear_emoji_history", n.appendChild(e)), t.appendChild(n)
		},
		getEmojis: function (e)
		{
			switch (e)
			{
			case "🔁":
				return messageList.config.emoji_history;
			case "😃":
				return "😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 😗 😙 😚 ☺ 🙂 🤗 🤔 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 🤓 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 😬 😰 😱 😳 😵 😡 😠 😇 🤠 🤡 🤥 😷 🤒 🤕 🤢 🤧 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾 👦 👧 👨 👩 👴 👵 👶 👼 👮 🕵 💂 👷 👳 👱 🎅 🤶 👸 🤴 👰 🤰 👲 🙍 🙎 🙅 🙆 💁 🙋 🙇 💆 💇 🚶 🏃 💃 🕺 👯 🕴 🗣 👤 👥 👫 👬 👭 💏 👨‍❤️‍💋‍👨 👩‍❤️‍💋‍👩 💑 👨‍❤️‍👨 👩‍❤️‍👩 👪 👨‍👩‍👦 👨‍👩‍👧 👨‍👩‍👧‍👦 👨‍👩‍👦‍👦 👨‍👩‍👧‍👧 👨‍👨‍👦 👨‍👨‍👧 👨‍👨‍👧‍👦 👨‍👨‍👦‍👦 👨‍👨‍👧‍👧 👩‍👩‍👦 👩‍👩‍👧 👩‍👩‍👧‍👦 👩‍👩‍👦‍👦 👩‍👩‍👧‍👧 👨‍👦 👨‍👦‍👦 👨‍👧 👨‍👧‍👦 👨‍👧‍👧 👩‍👦 👩‍👦‍👦 👩‍👧 👩‍👧‍👦 👩‍👧‍👧 💪 🤳 👈 👉 ☝ 👆 🖕 👇 ✌ 🤞 🖖 🤘 🖐 ✋ 👌 👍 👎 ✊ 👊 🤛 🤜 🤚 👋 👏 ✍ 👐 🙌 🙏 🤝 💅 👂 👃 👣 👀 👁 👅 👄 💋 👓 🕶 👔 👕 👖 👗 👘 👙 👚 👛 👜 👝 🎒 👞 👟 👠 👡 👢 👑 👒 🎩 🎓 ⛑ 💄 💍 🌂 ☂ 💼".split(" ");
			case "🐻":
				return "🙈 🙉 🙊 💥 💦 💨 💫 🐵 🐒 🦍 🐶 🐕 🐩 🐺 🦊 🐱 🐈 🦁 🐯 🐅 🐆 🐴 🐎 🦄 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🐘 🦏 🐭 🐁 🐀 🐹 🐰 🐇 🐿 🦇 🐻 🐨 🐼 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊 🦅 🦆 🦉 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🐳 🐋 🐬 🐟 🐠 🐡 🐙 🐚 🦀 🦐 🦑 🦋 🐌 🐛 🐜 🐝 🐞 🕷 🕸 🦂 💐 🌸 💮 🏵 🌹 🥀 🌺 🌻 🌼 🌷 🌱 🌲 🌳 🌴 🌵 🌾 🌿 ☘ 🍀 🍁 🍂 🍃 🍄 🌰 🌍 🌎 🌏 🌐 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 ☀ 🌝 🌞 ⭐ 🌟 🌠 ☁ ⛅ ⛈ 🌤 🌥 🌦 🌧 🌨 🌩 🌪 🌫 🌬 🌈 ☂ ☔ ⚡ ❄ ☃ ⛄ ☄ 🔥 💧 🌊 🎄 ✨ 🎋 🎍".split(" ");
			case "🍆":
				return "🍇 🍈 🍉 🍊 🍋 🍌 🍍 🍎 🍏 🍐 🍑 🍒 🍓 🥝 🍅 🥑 🍆 🥔 🥕 🌽 🌶 🥒 🍄 🥜 🌰 🍞 🥐 🥖 🥞 🧀 🍖 🍗 🍔 🍟 🍕 🌭 🌮 🌯 🍳 🍲 🥗 🍿 🍱 🍘 🍙 🍚 🍛 🍜 🍝 🍠 🍢 🍣 🍤 🍥 🍡 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🍽 🍴 🥄".split(" ");
			case "⚽":
				return "👾 🕴 🎪 🎭 🎨 🎰 🎗 🎟 🎫 🎖 🏆 🏅 🥇 🥈 🥉 ⚽ ⚾ 🏀 🏐 🏈 🏉 🎾 🎱 🎳 🏏 🏑 🏒 🏓 🏸 🥊 🥋 🎯 ⛳ ⛸ 🎣 🎽 🎿 🏇 ⛷ 🏂 🏌 🏄 🚣 🏊 ⛹ 🏋 🚴 🚵 🤸 🤼 🤽 🤾 🤹 🎮 🎲 🎼 🎤 🎧 🎷 🎸 🎹 🎺 🎻 🥁 🎬 🏹".split(" ");
			case "🌇":
				return "🗾 🏔 ⛰ 🌋 🗻 🏕 🏖 🏜 🏝 🏞 🏟 🏛 🏗 🏘 🏙 🏚 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🕍 ⛩ 🕋 ⛲ ⛺ 🌁 🌃 🌄 🌅 🌆 🌇 🌉 🌌 🎠 🎡 🎢 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚝 🚞 🚋 🚌 🚍 🚎 🚐 🚑 🚒 🚓 🚔 🚕 🚖 🚗 🚘 🚚 🚛 🚜 🚲 🛴 🛵 🏎 🏍 🚏 🛤 ⛽ 🚨 🚥 🚦 🚧 ⚓ ⛵ 🚤 🛳 ⛴ 🛥 🚢 ✈ 🛩 🛫 🛬 💺 🚁 🚟 🚠 🚡 🚀 🛰 🌠 ⛱ 🎆 🎇 🎑 🚣 💴 💵 💶 💷 🗿 🛂 🛃 🛄 🛅".split(" ");
			case "💡":
				return "☠ 💌 💣 🕳 🛍 📿 💎 🔪 🏺 🗺 💈 🖼 🛎 🚪 🛌 🛏 🛋 🚽 🚿 🛀 🛁 ⌛ ⏳ ⌚ ⏰ ⏱ ⏲ 🕰 🌡 ⛱ 🎈 🎉 🎊 🎎 🎏 🎐 🎀 🎁 🕹 📯 🎙 🎚 🎛 📻 📱 📲 ☎ 📞 📟 📠 🔋 🔌 💻 🖥 🖨 ⌨ 🖱 🖲 💽 💾 💿 📀 🎥 🎞 📽 📺 📷 📸 📹 📼 🔍 🔎 🔬 🔭 📡 🕯 💡 🔦 🏮 📔 📕 📖 📗 📘 📙 📚 📓 📃 📜 📄 📰 🗞 📑 🔖 🏷 💰 💴 💵 💶 💷 💸 💳 ✉ 📧 📨 📩 📤 📥 📦 📫 📪 📬 📭 📮 🗳 ✏ ✒ 🖋 🖊 🖌 🖍 📝 📁 📂 🗂 📅 📆 🗒 🗓 📇 📈 📉 📊 📋 📌 📍 📎 🖇 📏 📐 ✂ 🗃 🗄 🗑 🔒 🔓 🔏 🔐 🔑 🗝 🔨 ⛏ ⚒ 🛠 🗡 ⚔ 🔫 🛡 🔧 🔩 ⚙ 🗜 ⚗ ⚖ 🔗 ⛓ 💉 💊 🚬 ⚰ ⚱ 🗿 🛢 🔮 🚰 🏁 🚩 🎌 🏴 🏳 🏳️‍🌈".split(" ");
			case "💯":
				return "💘 ❤ 💓 💔 💕 💖 💗 💙 💚 💛 💜 🖤 💝 💞 💟 ❣ 💤 💢 💬 🗯 💭 💮 ♨ 💈 🛑 🕛 🕧 🕐 🕜 🕑 🕝 🕒 🕞 🕓 🕟 🕔 🕠 🕕 🕡 🕖 🕢 🕗 🕣 🕘 🕤 🕙 🕥 🕚 🕦 🌀 ♠ ♥ ♦ ♣ 🃏 🀄 🎴 🔇 🔈 🔉 🔊 📢 📣 📯 🔔 🔕 🎵 🎶 🏧 🚮 🚰 ♿ 🚹 🚺 🚻 🚼 🚾 ⚠ 🚸 ⛔ 🚫 🚳 🚭 🚯 🚱 🚷 🔞 ☢ ☣ ⬆ ↗ ➡ ↘ ⬇ ↙ ⬅ ↖ ↕ ↔ ↩ ↪ ⤴ ⤵ 🔃 🔄 🔙 🔚 🔛 🔜 🔝 🛐 ⚛ 🕉 ✡ ☸ ☯ ✝ ☦ ☪ ☮ 🕎 🔯 ♻ 📛 🔰 🔱 ⭕ ✅ ☑ ✔ ✖ ❌ ❎ ➕ ➖ ➗ ➰ ➿ 〽 ✳ ✴ ❇ ‼ ⁉ ❓ ❔ ❕ ❗ © ® ™ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎ 🔀 🔁 🔂 ▶ ⏩ ◀ ⏪ 🔼 ⏫ 🔽 ⏬ ⏹ 🎦 🔅 🔆 📶 📳 📴 #️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 💯 🔠 🔡 🔢 🔣 🔤 🅰 🆎 🅱 🆑 🆒 🆓 ℹ 🆔 Ⓜ 🆕 🆖 🅾 🆗 🅿 🆘 🆙 🆚 🈁 🈂 🈷 🈶 🈯 🉐 🈹 🈚 🈲 🉑 🈸 🈴 🈳 ㊗ ㊙ 🈺 🈵 ▪ ▫ ◻ ◼ ◽ ◾ ⬛ ⬜ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔲 🔳 ⚪ ⚫ 🔴 🔵 👁‍🗨".split(" ");
			case "🚩":
				return "🏁 🚩 🎌 🏴 🏳 🏳️‍🌈 🇦🇨 🇦🇩 🇦🇪 🇦🇫 🇦🇬 🇦🇮 🇦🇱 🇦🇲 🇦🇴 🇦🇶 🇦🇷 🇦🇸 🇦🇹 🇦🇺 🇦🇼 🇦🇽 🇦🇿 🇧🇦 🇧🇧 🇧🇩 🇧🇪 🇧🇫 🇧🇬 🇧🇭 🇧🇮 🇧🇯 🇧🇱 🇧🇲 🇧🇳 🇧🇴 🇧🇶 🇧🇷 🇧🇸 🇧🇹 🇧🇻 🇧🇼 🇧🇾 🇧🇿 🇨🇦 🇨🇨 🇨🇩 🇨🇫 🇨🇬 🇨🇭 🇨🇮 🇨🇰 🇨🇱 🇨🇲 🇨🇳 🇨🇴 🇨🇵 🇨🇷 🇨🇺 🇨🇻 🇨🇼 🇨🇽 🇨🇾 🇨🇿 🇩🇪 🇩🇬 🇩🇯 🇩🇰 🇩🇲 🇩🇴 🇩🇿 🇪🇦 🇪🇨 🇪🇪 🇪🇬 🇪🇭 🇪🇷 🇪🇸 🇪🇹 🇪🇺 🇫🇮 🇫🇯 🇫🇰 🇫🇲 🇫🇴 🇫🇷 🇬🇦 🇬🇧 🇬🇩 🇬🇪 🇬🇫 🇬🇬 🇬🇭 🇬🇮 🇬🇱 🇬🇲 🇬🇳 🇬🇵 🇬🇶 🇬🇷 🇬🇸 🇬🇹 🇬🇺 🇬🇼 🇬🇾 🇭🇰 🇭🇲 🇭🇳 🇭🇷 🇭🇹 🇭🇺 🇮🇨 🇮🇩 🇮🇪 🇮🇱 🇮🇲 🇮🇳 🇮🇴 🇮🇶 🇮🇷 🇮🇸 🇮🇹 🇯🇪 🇯🇲 🇯🇴 🇯🇵 🇰🇪 🇰🇬 🇰🇭 🇰🇮 🇰🇲 🇰🇳 🇰🇵 🇰🇷 🇰🇼 🇰🇾 🇰🇿 🇱🇦 🇱🇧 🇱🇨 🇱🇮 🇱🇰 🇱🇷 🇱🇸 🇱🇹 🇱🇺 🇱🇻 🇱🇾 🇲🇦 🇲🇨 🇲🇩 🇲🇪 🇲🇫 🇲🇬 🇲🇭 🇲🇰 🇲🇱 🇲🇲 🇲🇳 🇲🇴 🇲🇵 🇲🇶 🇲🇷 🇲🇸 🇲🇹 🇲🇺 🇲🇻 🇲🇼 🇲🇽 🇲🇾 🇲🇿 🇳🇦 🇳🇨 🇳🇪 🇳🇫 🇳🇬 🇳🇮 🇳🇱 🇳🇴 🇳🇵 🇳🇷 🇳🇺 🇳🇿 🇴🇲 🇵🇦 🇵🇪 🇵🇫 🇵🇬 🇵🇭 🇵🇰 🇵🇱 🇵🇲 🇵🇳 🇵🇷 🇵🇸 🇵🇹 🇵🇼 🇵🇾 🇶🇦 🇷🇪 🇷🇴 🇷🇸 🇷🇺 🇷🇼 🇸🇦 🇸🇧 🇸🇨 🇸🇩 🇸🇪 🇸🇬 🇸🇭 🇸🇮 🇸🇯 🇸🇰 🇸🇱 🇸🇲 🇸🇳 🇸🇴 🇸🇷 🇸🇸 🇸🇹 🇸🇻 🇸🇽 🇸🇾 🇸🇿 🇹🇦 🇹🇨 🇹🇩 🇹🇫 🇹🇬 🇹🇭 🇹🇯 🇹🇰 🇹🇱 🇹🇲 🇹🇳 🇹🇴 🇹🇷 🇹🇹 🇹🇻 🇹🇼 🇹🇿 🇺🇦 🇺🇬 🇺🇲 🇺🇳 🇺🇸 🇺🇾 🇺🇿 🇻🇦 🇻🇨 🇻🇪 🇻🇬 🇻🇮 🇻🇳 🇻🇺 🇼🇫 🇼🇸 🇽🇰 🇾🇪 🇾🇹 🇿🇦 🇿🇲 🇿🇼 🏴‍☠️ 🇽🇼 🇽🇸 🇽🇪".split(" ");
			case "All":
				this.displayAll()
			}
		}
	},
	tcs:
	{
		getTopicCreator: function ()
		{
			var e = new URLSearchParams(window.location.search),
				t = e.get("topic");
			if (messageList.config.tcs[t]) return messageList.config.tcs[t].tc;
			if (!e.has("u"))
			{
				var s = document.getElementsByClassName("message-top");
				if (messageList.tags.includes("Anonymous")) e = "human #1";
				else
				{
					if (e.has("page") && 1 != e.get("page")) return;
					e = s[0].getElementsByTagName("a")[0].innerHTML.toLowerCase()
				}
				return messageList.config.tcs[t] = {}, messageList.config.tcs[t].tc = e, messageList.config.tcs[t].date = (new Date).getTime(), this.save(), e
			}
		},
		save: function ()
		{
			var e, t, s = 1 / 0,
				n = 0;
			for (t in messageList.config.tcs) messageList.config.tcs[t].date < s && (e = t, s = messageList.config.tcs[t].date), n++;
			40 < n && delete messageList.config.tcs[e], messageList.sendMessage(
			{
				need: "save",
				name: "tcs",
				data: messageList.config.tcs
			})
		}
	},
	likeButton:
	{
		buildText: function (e, t)
		{
			var s, n = e.parentNode.parentNode,
				a = e.parentNode.parentNode.getElementsByClassName("message")[0],
				i = document.getElementsByClassName("quickpost-nub")[0];
			if (document.getElementsByTagName("textarea"), messageList.tags.includes("Anonymous"))
			{
				s = !0;
				var o = "Human",
					r = "this"
			}
			else o = document.getElementsByClassName("userbar")[0].getElementsByTagName("a")[0].innerHTML.replace(/ \((-?\d+)\)$/, ""), r = n.getElementsByTagName("a")[0].innerHTML;
			t ? (n = (n = (n = messageList.config.custom_like_data[t].contents).replace("[user]", o)).replace("[poster]", r), s && (n = n.replace("this's", "this"))) : n = s ? '<img src="http://i4.endoftheinter.net/i/n/f818de60196ad15c888b7f2140a77744/like.png" /> Human likes this post' : '<img src="http://i4.endoftheinter.net/i/n/f818de60196ad15c888b7f2140a77744/like.png" /> ' + o + " likes " + r + "'s post", s = '<quote msgid="' + a.getAttribute("msgid") + '">' + messageList.markupBuilder.build(a) + "</quote>", allPages.insertIntoTextarea(s + "\n" + n), 0 == document.getElementsByClassName("regular quickpost-expanded").length && i.click()
		},
		showOptions: function ()
		{
			if (!document.getElementById("hold_menu"))
			{
				var e = messageList.config.custom_like_data,
					t = document.createElement("span");
				for (var s in t.id = "hold_menu", t.style.position = "absolute", t.style.overflow = "auto", t.style.padding = "3px 3px", t.style.borderStyle = "solid", t.style.borderWidth = "2px", t.style.borderRadius = "3px", t.style.backgroundColor = window.getComputedStyle(document.body).backgroundColor, e)
				{
					var n = e[s].name,
						a = s,
						i = t,
						o = document.createElement("span"),
						r = document.createElement("anchor"),
						l = document.createElement("br");
					o.className = "unhigh_span", r.id = a, r.innerHTML = "&nbsp" + n + "&nbsp", r.href = "#like_custom_" + a, r.className = "like_button_custom", o.appendChild(r), i.appendChild(o), i.appendChild(l)
				}
				messageList.cachedEvent.target.appendChild(t)
			}
		},
		hideOptions: function ()
		{
			var e = document.getElementById("hold_menu");
			e && e.remove()
		}
	},
	archiveQuotes:
	{
		addQuoteElements: function ()
		{
			window.location.search.replace("?topic=", "");
			var e, t = [];
			document.getElementsByTagName("a");
			for (var s = document.getElementsByClassName("message"), n = document.getElementsByClassName("message-container"), a = 0, i = n.length; a < i; a++)
			{
				e = n[a], t[a] = e.getElementsByClassName("message-top")[0], e = s[a].getAttribute("msgid");
				var o = document.createElement("a"),
					r = document.createTextNode("Quote"),
					l = document.createTextNode(" | ");
				o.appendChild(r), o.href = "#", o.id = e, o.className = "archivequote", t[a].appendChild(l), t[a].appendChild(o)
			}
		},
		handler: function (e)
		{
			var t = e.target.id,
				s = document.querySelector('[msgid="' + t + '"]');
			t = '<quote msgid="' + t + '">' + messageList.markupBuilder.build(s) + "</quote>";
			messageList.sendMessage(
			{
				need: "copy",
				data: t
			}), this.showNotification(e.target)
		},
		showNotification: function (e)
		{
			var t = document.createElement("span");
			t.id = "copied", t.style.display = "none", t.style.position = "absolute", t.style.zIndex = 1, t.style.left = 100, t.style.backgroundColor = window.getComputedStyle(e.parentNode).backgroundColor, t.style.fontWeight = "bold", t.innerHTML = "&nbsp[copied to clipboard]", e.appendChild(t), $("#copied").fadeIn(200), setTimeout(function ()
			{
				$(e).find("span:last").fadeOut(400)
			}, 1500), setTimeout(function ()
			{
				e.removeChild(t)
			}, 2e3)
		}
	},
	autoscrollCheck: function (e)
	{
		var t = e.getBoundingClientRect();
		return !("none" == e.style.display || t.top > window.innerHeight)
	},
	startBatchUpload: function (e)
	{
		if (0 == (e = document.getElementById("batch_uploads")).files.length) alert('Select files and then click "Batch Upload"');
		else
			for (var t = 0, s = e.files.length; t < s; t++) allPages.asyncUploadHandler(e.files[t], function (e)
			{
				allPages.insertIntoTextarea(e)
			})
	},
	postTemplateAction: function (e)
	{
		if ("expand_post_template" === e.className)
		{
			var t = e.parentNode;
			t.removeChild(e);
			var s = document.createElement("a");
			for (var n in s.innerHTML = "&lt;", s.className = "shrink_post_template", s.href = "##", t.innerHTML = "[", t.insertBefore(s, null), this.config.post_template_data)
			{
				(s = document.createElement("a")).href = "##" + n, s.className = "post_template_title", s.innerHTML = n;
				var a = document.createElement("span");
				a.style.paddingLeft = "3px", a.innerHTML = "[", a.insertBefore(s, null), a.innerHTML += "]", a.className = n, t.insertBefore(a, null)
			}
			t.innerHTML += "]"
		}
		"shrink_post_template" === e.className && (t = e.parentNode, e.parentNode.removeChild(e), (s = document.createElement("a")).innerHTML = "&gt;", s.className = "expand_post_template", s.href = "##", t.innerHTML = "[", t.insertBefore(s, null), t.innerHTML += "]"), "post_template_title" === e.className && (e.id = "post_action", t = document.getElementById("cdiv"), (n = {}).text = this.config.post_template_data[e.parentNode.className].text, t.innerHTML = JSON.stringify(n), t.dispatchEvent(this.postEvent))
	},
	clearUnreadPostsFromTitle: function (e)
	{
		/\(\d+\+?\)/.test(document.title) && 1 != this.autoscrolling && !document.hidden && /\(\d+\+?\)/.test(document.title) && (e = document.title.replace(/\(\d+\+?\) /, ""), document.title = e)
	},
	qpTagButton: function (e)
	{
		if ("INPUT" != e.target.tagName) return 0;
		var t = e.target.id,
			s = document.getElementsByName("message")[0],
			n = s.scrollTop,
			a = s.value.substring(0, s.selectionStart),
			i = s.value.substring(s.selectionEnd, s.value.length),
			o = s.value.substring(s.selectionStart, s.selectionEnd);
		s.selectionStart == s.selectionEnd ? (/\*/m.test(e.target.value) ? (e.target.value = e.target.name, e = s.selectionStart + t.length + 3, s.value = a + "</" + t + ">" + i) : (e.target.value = e.target.name + "*", e = s.selectionStart + t.length + 2, s.value = a + "<" + t + ">" + i), s.selectionStart = e) : (e = s.selectionStart + 2 * t.length + o.length + 5, s.value = a + "<" + t + ">" + o + "</" + t + ">" + i, s.selectionStart = a.length), s.selectionEnd = e, s.scrollTop = n, s.focus()
	},
	addListeners: function (e)
	{
		if (e || (document.body.addEventListener("click", this.handleEvent.mouseclick.bind(this)), document.getElementById("image_search") && document.addEventListener("keydown", this.handleEvent.keydown.bind(this)), this.media.initDragToResize()), this.config.user_info_popup)
			for (var t = 0, s = (e = e ? e.getElementsByClassName("message-top") : document.getElementsByClassName("message-top")).length; t < s; t++)
			{
				var n = e[t].getElementsByTagName("a")[0]; - 1 < n.href.indexOf("endoftheinter.net/profile.php?user=") && (n.className = "username_anchor", n.addEventListener("mouseenter", this.handleEvent.mouseenter.bind(this)), n.addEventListener("mouseleave", this.handleEvent.mouseleave.bind(this)))
			}
	},
	appendScripts: function ()
	{
		var e = document.getElementsByTagName("head")[0];
		if (messageList.config.post_templates)
		{
			var t = document.createElement("script");
			t.type = "text/javascript", t.src = chrome.extension.getURL("src/js/topicPostTemplate.js"), e.appendChild(t)
		}
	},
	sendMessage: function (t, e)
	{
		try
		{
			chrome.runtime.sendMessage(t, e)
		}
		catch (e)
		{
			console.log("Error while sending message to background page:", t, e)
		}
	},
	newPageObserver: new MutationObserver(function (e)
	{
		for (var t = 0, s = e.length; t < s; t++)
		{
			var n = e[t];
			"attributes" === n.type && "block" === n.target.style.display && messageList.sendMessage(
			{
				need: "notify",
				title: "New Page Created",
				message: document.title
			})
		}
	}),
	livelinksObserver: new MutationObserver(function (e)
	{
		for (var t = 0, s = e.length; t < s; t++)
		{
			var n = e[t];
			0 < n.addedNodes.length && 0 < n.addedNodes[0].childNodes.length && "message-container" == n.addedNodes[0].childNodes[0].className && messageList.handleEvent.newPost.call(messageList, n.addedNodes[0])
		}
	}),
	getZoomLevel: function ()
	{
		this.zoomLevel = window.screen.width / document.documentElement.clientWidth
	},
	prepareIgnoratorArray: function ()
	{
		if (this.ignoredUsers = this.config.ignorator_list.split(",").map(function (e)
			{
				return e.trim()
			}), this.config.ignorator_allow_posts && this.config.ignorator_post_whitelist)
		{
			var t = this.config.ignorator_post_whitelist.split(",").map(function (e)
			{
				return e.trim().toLowerCase()
			});
			this.ignoredUsers = this.ignoredUsers.filter(function (e)
			{
				return -1 === t.indexOf(e.toLowerCase())
			})
		}
	},
	appendDramalinksTicker: function ()
	{
		var e = document.getElementsByTagName("h2")[0];
		dramalinks.appendTo(e);
		e = -39 - document.getElementById("dramalinks_ticker").getBoundingClientRect().height;
		var t = document.createElement("style");
		t.innerHTML = 'img[src="//static.endoftheinter.net/pascal.png"] { margin-top: ' + e + "px !important }", document.head.appendChild(t)
	},
	addCustomSeriousStyle: function ()
	{
		var e = document.createElement("style");
		e.innerHTML = 'div[style*="background:#bb2639;color:white;padding:2px 5px;"], div[style*="background:#bb2639;color:white;padding:2px 5px;"] a { background-color: #' + this.config.serious_banner_color + " !important;color: #" + this.config.serious_banner_text_color + " !important; }", document.head.appendChild(e)
	},
	handleRepliesPage: function ()
	{
		this.infobarMethods = {}, delete this.messageContainerMethods.number_posts, this.newPageObserver.observe = function () {}
	},
	handleArchivedAndLockedTopics: function ()
	{
		this.archiveQuotes.addQuoteElements(), delete this.messageContainerMethods.like_button, delete this.messageContainerMethods.post_templates
	},
	addChristmasCss: function ()
	{
		var e, t = document.getElementsByTagName("h1")[0];
		if (/winter|christmas|xmas|santa|snow|holida[a-z]+/i.test(t.innerHTML))
		{
			e = /hup hup/i.test(t.innerHTML) ? "hup_hup" : "snow", document.body.classList.add(e), t = window.getComputedStyle(document.body).getPropertyValue("background-color"), document.getElementById("u0_1").style.backgroundColor = t, document.getElementsByClassName("message-top")[0].style.marginTop = 0, document.getElementsByClassName("message-top")[0].style.borderTop = "1px solid " + t;
			var s = document.createElement("style"),
				n = [];
			n.push("div.userbar, div.infobar, #u0_2 {margin: 0px !important}\n"), n.push("div.userbar{border: 1px solid " + t + "}\n"), n.push("div.userbar{border-bottom: 2px solid " + t + "}\n"), n.push("#u0_2{border-bottom: 1px solid " + t + "}\n"), n.push("#u0_3{border-top: 2px solid " + t + "}\n"), n.push("#u0_3{border-bottom: 1px solid " + t + "}\n"), n.push("#u0_4{border-top: 1px solid " + t + "}\n"), n.push("#u0_4{border-bottom: 2px solid " + t + "}\n"), s.innerHTML = n.join("\n"), document.head.appendChild(s), document.addEventListener("visibilitychange", function ()
			{
				document.hidden ? document.body.classList.remove(e) : document.body.classList.add(e)
			})
		}
	},
	scrapeTags: function ()
	{
		if ((e = document.getElementsByTagName("h2")) && e[0] && e[0].firstChild)
			for (var e, t = 0, s = (e = e[0].firstChild.childNodes).length; t < s; t++)
			{
				var n = e[t];
				"A" === n.tagName && this.tags.push(n.innerHTML)
			}
	},
	applyFoxlinksQuotesCss: function (e)
	{
		const checkValidColorStr = colorStr => colorStr && (colorStr.length === 3 || colorStr.length === 6);
		if (e = e.getElementsByClassName("quoted-message"))
		{
			const top = document.querySelector(".message-top");
			if (!top) return;

			// reference to message list config for simpler access
			const cfg = messageList.config;

			const color = checkValidColorStr(cfg.foxlinks_quotes_custom_color)
				? `#${cfg.foxlinks_quotes_custom_color}`
				: getComputedStyle(top).getPropertyValue("background-color");
			
			const cssStyle = document.createElement("style");

			// for padding-bottom on .quoted-message and margin-bottom on .quoted-message .message-top,
			// makes the quote content spaced from the top and bottom of the border equally
			const quoteContentVerticalPadding = "0.3rem";

			cssStyle.textContent = `
				.quoted-message {
					border: ${color} 0.125rem solid;
					border-radius: 0.3125rem;
					margin: ${cfg.foxlinks_quotes_margin};
					padding-bottom: ${quoteContentVerticalPadding};
				}

				.quoted-message .message-top {
					background-color: ${color};
					margin-top: -0.125rem !important;
					margin-bottom: ${quoteContentVerticalPadding};
					margin-left: -0.375rem !important;
					padding-bottom: 0.125rem;
					border-radius: 0.1875rem 0.1875rem 0 0;
				}
			`;

			document.querySelector("head").appendChild(cssStyle);
		}
	},
	applyDomModifications: function (e)
	{
		for (var t in this.scrapeTags(), this.config.embed_tweets && this.twitter.injectWidgets(), this.config.dramalinks && !this.config.hide_dramalinks_topiclist && this.appendDramalinksTicker(), this.infobarMethods) this.config[t + e] && this.infobarMethods[t]();
		var s = 0 < document.getElementsByClassName("quickpost").length;
		s || this.handleArchivedAndLockedTopics(), this.topicCreator = this.tcs.getTopicCreator();
		var n = document.getElementsByClassName("message-container");
		t = 0;

		// do foxlinks quotes if enabled
		this.config["foxlinks_quotes"] && this.applyFoxlinksQuotesCss(n[t]);

		for (var a = n.length; t < a; t++)
		{
			var i = n[t],
				o = i.getElementsByClassName("message-top")[0];
			for (var r in o.getElementsByTagName("a"), this.messageContainerMethods) this.config[r + e] && this.messageContainerMethods[r](i, o, t + 1);
			this.links.check(i)
		}
		for (t in this.config.hide_ignorator_badge || this.globalPort.postMessage(
			{
				action: "ignorator_update",
				ignorator: this.ignorated,
				scope: "messageList"
			}), this.miscMethods) this.config[t + e] && this.miscMethods[t]();
		if (s)
		{
			for (t in this.quickpostMethods) this.config[t + e] && this.quickpostMethods[t]();
			if (null !== sessionStorage.getItem("quickpost_value"))
			{
				var l = document.getElementsByName("message")[0];
				l.value = sessionStorage.getItem("quickpost_value"), setTimeout(function ()
				{
					var e = sessionStorage.getItem("quickpost_caret_position");
					l.setSelectionRange(e, e)
				}, 0), sessionStorage.removeItem("quickpost_value"), sessionStorage.removeItem("quickpost_caret_position")
			}
		}
		null !== sessionStorage.getItem("scrollx") && (window.scrollX = sessionStorage.getItem("scrollx"), window.scrollY = sessionStorage.getItem("scrolly"), sessionStorage.removeItem("scrollx"), sessionStorage.removeItem("scrolly")), this.addListeners(), this.appendScripts(), this.livelinksObserver.observe(document.getElementById("u0_1"),
		{
			subtree: !0,
			childList: !0
		}), this.config.new_page_notify && this.newPageObserver.observe(document.getElementById("nextpage"),
		{
			attributes: !0
		}), this.addChristmasCss()
	}
};
chrome.runtime.sendMessage(
{
	need: "config",
	tcs: !0
}, function (e)
{
	messageList.init.call(messageList, e)
});