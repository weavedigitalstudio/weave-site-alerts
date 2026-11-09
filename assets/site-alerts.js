/**
 * Weave Site Alerts: draws a central emergency notice at the top of the page.
 *
 * Asks the service for this site's notice. Nothing active, a slow answer or
 * any error means nothing is drawn and nothing else on the page changes.
 *
 * The notice text arrives as parts (plain text, phone links, email links) and
 * is built with textContent, never innerHTML, so the service cannot put markup
 * on a client site.
 *
 * Preview: add ?alert-preview to any page URL to also see notices that are
 * still in preview on the service.
 */
( function () {
	'use strict';

	var settings = window.weaveSiteAlerts;
	if ( ! settings || ! settings.endpoint || ! window.fetch ) {
		return;
	}

	var TIMEOUT_MS = 5000;
	var STORE_KEY = 'weave-site-alerts-dismissed';
	var preview = /[?&]alert-preview\b/.test( window.location.search );

	var ID = 'weave-site-alert';
	var S = '#' + ID;

	// Scoped to the id and forced, because theme CSS styles bare p, strong
	// and a elements and would otherwise recolour or restyle the notice.
	var css =
		S + '{position:relative;display:block;margin:0;background:#f5c242!important;color:#1a1a1a!important;font-size:16px!important;line-height:1.45!important;text-align:left!important;box-shadow:0 1px 0 rgba(0,0,0,.15)}' +
		S + '.wsa--fixed{position:fixed!important;top:0;left:0;right:0}' +
		S + '.wsa--notice{background:#dde9f0!important;color:#10212b!important;box-shadow:inset 0 -1px 0 #b3c6d2}' +
		S + ' .wsa__inner{display:flex;align-items:flex-start;gap:12px;max-width:1200px;margin:0 auto;padding:12px 16px;box-sizing:border-box}' +
		S + ' .wsa__icon{flex:0 0 auto;width:22px;height:22px;margin-top:1px}' +
		S + ' .wsa__text{flex:1 1 auto;margin:0!important;padding:0!important;font:inherit!important;color:inherit!important;letter-spacing:normal!important;text-transform:none!important}' +
		S + ' .wsa__title{font-weight:700!important;color:inherit!important;letter-spacing:normal!important;text-transform:none!important;margin-right:.35em}' +
		S + ' a{color:inherit!important;background:none!important;text-decoration:underline!important;text-underline-offset:2px;font:inherit!important;font-weight:700!important;white-space:nowrap}' +
		S + ' a:hover,' + S + ' a:focus{text-decoration-thickness:2px!important}' +
		S + ' .wsa__close{flex:0 0 auto;width:44px;height:44px;min-width:0;margin:-10px -12px -10px 0;padding:0;border:0!important;background:transparent!important;color:inherit!important;box-shadow:none!important;font:inherit;font-size:26px!important;line-height:1!important;cursor:pointer;border-radius:4px}' +
		S + ' .wsa__close:focus-visible{outline:2px solid currentColor;outline-offset:-4px}' +
		S + ' .wsa__badge{display:inline-block;margin-right:.5em;padding:0 .4em;border:1px solid currentColor;border-radius:3px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}' +
		'@media (max-width:600px){' + S + '{font-size:15px!important}' + S + ' .wsa__inner{padding:10px 12px;gap:10px}}' +
		'@media print{' + S + ' .wsa__close{display:none}}';

	function dismissed( id ) {
		try {
			return window.sessionStorage.getItem( STORE_KEY ) === id;
		} catch ( e ) {
			return false;
		}
	}

	function remember( id ) {
		try {
			window.sessionStorage.setItem( STORE_KEY, id );
		} catch ( e ) {}
	}

	function el( tag, className, text ) {
		var node = document.createElement( tag );
		if ( className ) {
			node.className = className;
		}
		if ( text ) {
			node.textContent = text;
		}
		return node;
	}

	function safeTel( value ) {
		return typeof value === 'string' && /^\+?[0-9]{5,16}$/.test( value );
	}

	function safeEmail( value ) {
		return typeof value === 'string' && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test( value );
	}

	// "!" in a circle for urgent, "i" in a circle for a notice.
	var ICONS = {
		urgent: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 5a1.25 1.25 0 0 1 1.25 1.25v4.5a1.25 1.25 0 0 1-2.5 0v-4.5A1.25 1.25 0 0 1 12 7Zm0 10.5a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z',
		notice: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8Zm1.25 10.9a1.25 1.25 0 0 1-2.5 0v-5a1.25 1.25 0 0 1 2.5 0v5Z',
	};

	function icon( level ) {
		var ns = 'http://www.w3.org/2000/svg';
		var svg = document.createElementNS( ns, 'svg' );
		svg.setAttribute( 'class', 'wsa__icon' );
		svg.setAttribute( 'viewBox', '0 0 24 24' );
		svg.setAttribute( 'aria-hidden', 'true' );
		svg.setAttribute( 'focusable', 'false' );
		var path = document.createElementNS( ns, 'path' );
		path.setAttribute( 'fill', 'currentColor' );
		path.setAttribute( 'd', ICONS[ level ] || ICONS.urgent );
		svg.appendChild( path );
		return svg;
	}

	function build( alert ) {
		var level = alert.level === 'notice' ? 'notice' : 'urgent';
		var root = el( 'div', 'wsa wsa--' + level );
		root.id = ID;
		root.setAttribute( 'role', 'region' );
		root.setAttribute( 'aria-label', alert.label || 'Important notice' );

		var inner = el( 'div', 'wsa__inner' );
		var text = el( 'p', 'wsa__text' );
		text.setAttribute( 'aria-live', 'polite' );

		inner.appendChild( icon( level ) );
		inner.appendChild( text );

		if ( alert.preview ) {
			text.appendChild( el( 'span', 'wsa__badge', 'Preview' ) );
		}
		if ( alert.title ) {
			text.appendChild( el( 'strong', 'wsa__title', alert.title ) );
		}

		( alert.parts || [] ).forEach( function ( part ) {
			if ( ! part || typeof part.t !== 'string' ) {
				return;
			}
			var node;
			if ( safeTel( part.tel ) ) {
				node = el( 'a', '', part.t );
				node.href = 'tel:' + part.tel;
			} else if ( safeEmail( part.mailto ) ) {
				node = el( 'a', '', part.t );
				node.href = 'mailto:' + part.mailto;
			} else {
				node = document.createTextNode( part.t );
			}
			text.appendChild( node );
		} );

		var close = el( 'button', 'wsa__close', '×' );
		close.type = 'button';
		close.setAttribute( 'aria-label', 'Hide this notice' );
		close.addEventListener( 'click', function () {
			remember( alert.id );
			undo.forEach( function ( fn ) { fn(); } );
			undo = [];
			root.parentNode.removeChild( root );
		} );
		inner.appendChild( close );

		root.appendChild( inner );
		return root;
	}

	// Layout changes made for a pinned header, reversed when the notice is hidden.
	var undo = [];

	// Elements the theme pins to the top of the screen from the start, such as
	// a Beaver Builder fixed header or a top bar. Off-canvas menus (taller than
	// half the screen) and narrow widgets are left alone. A header that only
	// becomes fixed after scrolling is not here, and needs nothing: by then
	// the notice has scrolled away with the page.
	function pinnedHeaders() {
		var found = [];
		var vw = window.innerWidth;
		var vh = window.innerHeight;
		var all = document.body.getElementsByTagName( '*' );
		for ( var i = 0; i < all.length; i++ ) {
			var node = all[ i ];
			var cs = window.getComputedStyle( node );
			if ( cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0' ) {
				continue;
			}
			if ( node.closest( S ) ) {
				continue;
			}
			var r = node.getBoundingClientRect();
			if ( r.height < 10 || r.height > vh * 0.5 || r.width < vw * 0.5 || r.top < -1 || r.top > 250 ) {
				continue;
			}
			found.push( node );
		}
		return found;
	}

	// Pin the notice above the theme's own pinned header: header moved down by
	// the notice's height, page pushed down to match, both kept in step if the
	// notice rewraps on resize.
	function pin( node, headers ) {
		var body = document.body;
		var bodyMargin = parseFloat( window.getComputedStyle( body ).marginTop ) || 0;
		var bodyInline = body.style.getPropertyValue( 'margin-top' );
		var z = 0;
		var saved = headers.map( function ( header ) {
			var cs = window.getComputedStyle( header );
			z = Math.max( z, parseInt( cs.zIndex, 10 ) || 0 );
			return {
				el: header,
				top: parseFloat( cs.top ) || 0,
				inline: header.style.getPropertyValue( 'top' ),
				priority: header.style.getPropertyPriority( 'top' ),
			};
		} );

		node.classList.add( 'wsa--fixed' );
		node.style.zIndex = String( z + 1 );

		function apply() {
			var h = node.offsetHeight;
			saved.forEach( function ( item ) {
				item.el.style.setProperty( 'top', ( item.top + h ) + 'px', 'important' );
			} );
			body.style.setProperty( 'margin-top', ( bodyMargin + h ) + 'px', 'important' );
		}

		apply();
		var observer = window.ResizeObserver ? new window.ResizeObserver( apply ) : null;
		if ( observer ) {
			observer.observe( node );
		} else {
			window.addEventListener( 'resize', apply );
		}

		undo.push( function () {
			if ( observer ) {
				observer.disconnect();
			} else {
				window.removeEventListener( 'resize', apply );
			}
			saved.forEach( function ( item ) {
				item.el.style.removeProperty( 'top' );
				if ( item.inline ) {
					item.el.style.setProperty( 'top', item.inline, item.priority );
				}
			} );
			body.style.removeProperty( 'margin-top' );
			if ( bodyInline ) {
				body.style.setProperty( 'margin-top', bodyInline );
			}
		} );
	}

	// position: "flow" (in the page), "fixed" (pinned) or empty for automatic.
	// insertAfter: a CSS selector to place the notice after, flow only.
	function place( node, alert ) {
		var headers = alert.position === 'flow' ? [] : pinnedHeaders();

		document.body.insertBefore( node, document.body.firstChild );

		if ( headers.length || alert.position === 'fixed' ) {
			pin( node, headers );
			return;
		}

		var anchor = null;
		if ( typeof alert.insertAfter === 'string' && alert.insertAfter ) {
			try {
				anchor = document.querySelector( alert.insertAfter );
			} catch ( e ) {
				anchor = null;
			}
		}
		if ( anchor && anchor.parentNode ) {
			anchor.parentNode.insertBefore( node, anchor.nextSibling );
		}
	}

	// Something that reads as a phone number: optional +, then digits with
	// spaces, brackets or hyphens, at least seven digits in all.
	var NUMBER = /\+?\(?\d[\d\s().-]{5,}\d/g;

	// During a phone outage, point the page's own phone links at the backup
	// number, and show it: any phone number written inside a tel: link
	// (including links with an icon inside) becomes the backup number. Words
	// such as a branch name are left alone.
	function swapPhoneLinks( to, display ) {
		if ( ! safeTel( to ) ) {
			return;
		}
		var links = document.querySelectorAll( 'a[href^="tel:"]' );
		Array.prototype.forEach.call( links, function ( link ) {
			if ( link.closest( S ) ) {
				return;
			}
			link.setAttribute( 'href', 'tel:' + to );
			if ( ! display ) {
				return;
			}
			var walker = document.createTreeWalker( link, NodeFilter.SHOW_TEXT );
			var node;
			while ( ( node = walker.nextNode() ) ) {
				var text = node.nodeValue;
				var next = text.replace( NUMBER, function ( match ) {
					return match.replace( /[^0-9]/g, '' ).length >= 7 ? display : match;
				} );
				if ( next !== text ) {
					node.nodeValue = next;
				}
			}
		} );
	}

	function show( alert ) {
		if ( ! alert || ! alert.active || ! alert.id || dismissed( alert.id ) ) {
			if ( alert && alert.active && alert.swapTel ) {
				swapPhoneLinks( alert.swapTel, alert.swapTelDisplay );
			}
			return;
		}

		if ( ! document.getElementById( 'weave-site-alerts-css' ) ) {
			var style = el( 'style' );
			style.id = 'weave-site-alerts-css';
			style.textContent = css;
			document.head.appendChild( style );
		}

		place( build( alert ), alert );

		if ( alert.swapTel ) {
			swapPhoneLinks( alert.swapTel, alert.swapTelDisplay );
		}
	}

	var controller = window.AbortController ? new AbortController() : null;
	var timer = controller ? window.setTimeout( function () { controller.abort(); }, TIMEOUT_MS ) : null;

	window.fetch( settings.endpoint + ( preview ? '?preview=1' : '' ), {
		credentials: 'omit',
		signal: controller ? controller.signal : undefined,
	} )
		.then( function ( res ) {
			return res.ok ? res.json() : null;
		} )
		.then( function ( alert ) {
			if ( timer ) {
				window.clearTimeout( timer );
			}
			if ( document.readyState === 'loading' ) {
				document.addEventListener( 'DOMContentLoaded', function () { show( alert ); } );
			} else {
				show( alert );
			}
		} )
		.catch( function () {} );
}() );
