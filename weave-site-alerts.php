<?php
/**
 * Plugin Name:       Weave Site Alerts
 * Plugin URI:        https://github.com/weavedigitalstudio/weave-site-alerts
 * Description:       Shows an emergency notice across the top of every page when Weave switches one on centrally. Does nothing the rest of the time.
 * Version:           0.1.1
 * Requires at least: 7.0
 * Requires PHP:      8.1
 * Author:            Weave Digital Studio
 * Author URI:        https://weave.co.nz
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       weave-site-alerts
 * GitHub Plugin URI: weavedigitalstudio/weave-site-alerts
 *
 * @package WeaveSiteAlerts
 */

declare( strict_types=1 );

namespace WeaveSiteAlerts;

defined( 'ABSPATH' ) || exit;

define( 'WEAVE_SITE_ALERTS_VERSION', '0.1.1' );
define( 'WEAVE_SITE_ALERTS_FILE', __FILE__ );
define( 'WEAVE_SITE_ALERTS_DIR', plugin_dir_path( __FILE__ ) );
define( 'WEAVE_SITE_ALERTS_URL', plugin_dir_url( __FILE__ ) );

/*
 * Where the notice comes from. The site's own host name is appended, so one
 * address serves every site and there is nothing to configure per site.
 * Override with WEAVE_SITE_ALERTS_ENDPOINT in wp-config.php, for local
 * testing or a different service.
 */
const DEFAULT_ENDPOINT = 'https://weave-alerts.pages.dev/v1/alert/';

require_once WEAVE_SITE_ALERTS_DIR . 'inc/frontend.php';

// The updater runs in the admin, for the background check (cron) and for
// WP-CLI, so `wp plugin update` sees a release.
if ( is_admin() || wp_doing_cron() || ( defined( 'WP_CLI' ) && WP_CLI ) ) {
	require_once WEAVE_SITE_ALERTS_DIR . 'inc/github-updater.php';
	add_action( 'init', static fn() => Updater::init( WEAVE_SITE_ALERTS_FILE ) );
}
