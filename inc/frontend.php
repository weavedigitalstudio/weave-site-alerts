<?php
/**
 * Front end: load the notice script on every public page.
 *
 * The page itself never contains the notice. The script asks the central
 * service whether one is active for this site and draws it in the browser.
 * That keeps the notice out of the page cache: switching it on or off needs
 * no cache purge on any site.
 *
 * Filter: weave_site_alerts_enabled (default true) switches the module off.
 *
 * @package WeaveSiteAlerts
 */

declare( strict_types=1 );

namespace WeaveSiteAlerts\Frontend;

use const WeaveSiteAlerts\DEFAULT_ENDPOINT;

defined( 'ABSPATH' ) || exit;

add_action( 'wp_enqueue_scripts', __NAMESPACE__ . '\enqueue' );

/**
 * Enqueue the notice script with its settings.
 */
function enqueue(): void {

	/**
	 * Whether this site shows central notices at all.
	 *
	 * @param bool $enabled Default true.
	 */
	if ( ! apply_filters( 'weave_site_alerts_enabled', true ) ) {
		return;
	}

	$endpoint = endpoint();

	if ( '' === $endpoint ) {
		return;
	}

	wp_enqueue_script(
		'weave-site-alerts',
		WEAVE_SITE_ALERTS_URL . 'assets/site-alerts.js',
		[],
		WEAVE_SITE_ALERTS_VERSION,
		[
			'strategy'  => 'defer',
			'in_footer' => false,
		]
	);

	wp_add_inline_script(
		'weave-site-alerts',
		'window.weaveSiteAlerts = ' . wp_json_encode( [ 'endpoint' => $endpoint ] ) . ';',
		'before'
	);
}

/**
 * The address this site asks for its notice.
 *
 * @return string Full URL, or an empty string when the site has no usable host.
 */
function endpoint(): string {

	$base = defined( 'WEAVE_SITE_ALERTS_ENDPOINT' ) ? (string) WEAVE_SITE_ALERTS_ENDPOINT : DEFAULT_ENDPOINT;
	$site = site_key();

	if ( '' === $base || '' === $site ) {
		return '';
	}

	$url = trailingslashit( $base ) . rawurlencode( $site );

	/**
	 * The full notice address for this site.
	 *
	 * @param string $url  Endpoint plus site key.
	 * @param string $site Site key, the host name without www.
	 */
	return (string) apply_filters( 'weave_site_alerts_endpoint', $url, $site );
}

/**
 * The name the central service knows this site by: its host, without www.
 *
 * WEAVE_SITE_ALERTS_SITE overrides it, so a staging or local copy can show
 * the live site's notice.
 *
 * @return string Lower-case host name.
 */
function site_key(): string {

	if ( defined( 'WEAVE_SITE_ALERTS_SITE' ) ) {
		return strtolower( (string) WEAVE_SITE_ALERTS_SITE );
	}

	$host = (string) wp_parse_url( home_url(), PHP_URL_HOST );

	return preg_replace( '/^www\./', '', strtolower( $host ) ) ?? '';
}
