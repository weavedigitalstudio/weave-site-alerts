<?php
/**
 * Remove the plugin's only stored data, the cached release check.
 *
 * @package WeaveSiteAlerts
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

delete_transient( 'weave_site_alerts_github_response' );
