<?php
/**
 * GitHub release updater for a public repository.
 *
 * Same pattern as weave-cache-purge-helper: unauthenticated release checks,
 * cached for four hours, errors cached for one. The repository is public, so
 * sites need no token.
 *
 * @package WeaveSiteAlerts
 */

declare( strict_types=1 );

namespace WeaveSiteAlerts;

defined( 'ABSPATH' ) || exit;

/**
 * Checks GitHub for a newer release and hands it to the WordPress updater.
 */
final class Updater {

	private const REPO        = 'weavedigitalstudio/weave-site-alerts';
	private const CACHE_KEY   = 'weave_site_alerts_github_response';
	private const CACHE_HOURS = 4;
	private const ERROR_HOURS = 1;
	private const ICON_SMALL  = 'https://weave-hk-github.b-cdn.net/weave/icon-128x128.png';
	private const ICON_LARGE  = 'https://weave-hk-github.b-cdn.net/weave/icon-256x256.png';

	/**
	 * The one instance.
	 *
	 * @var Updater|null
	 */
	private static ?Updater $instance = null;

	/**
	 * Main plugin file.
	 *
	 * @var string
	 */
	private string $file;

	/**
	 * Plugin basename, folder/file.php.
	 *
	 * @var string
	 */
	private string $basename;

	/**
	 * Release found this request.
	 *
	 * @var object|null
	 */
	private ?object $release = null;

	/**
	 * Start the updater once.
	 *
	 * @param string $file Main plugin file.
	 */
	public static function init( string $file ): self {
		if ( null === self::$instance ) {
			self::$instance = new self( $file );
		}
		return self::$instance;
	}

	/**
	 * Hook into the plugin update flow.
	 *
	 * @param string $file Main plugin file.
	 */
	private function __construct( string $file ) {
		$this->file     = $file;
		$this->basename = plugin_basename( $file );

		add_filter( 'pre_set_site_transient_update_plugins', [ $this, 'check_update' ] );
		add_filter( 'plugins_api', [ $this, 'plugin_info' ], 20, 3 );
		add_filter( 'upgrader_post_install', [ $this, 'after_install' ], 10, 3 );
	}

	/**
	 * The latest release, from cache or GitHub.
	 *
	 * @return object|null Release with a zip_url, or null.
	 */
	private function release(): ?object {

		if ( null !== $this->release ) {
			return $this->release;
		}

		$cached = get_transient( self::CACHE_KEY );

		if ( is_array( $cached ) && 'error' === ( $cached['status'] ?? '' ) ) {
			return null;
		}

		if ( is_object( $cached ) ) {
			$this->release = $cached;
			return $cached;
		}

		$response = wp_remote_get(
			'https://api.github.com/repos/' . self::REPO . '/releases/latest',
			[
				'timeout' => 10,
				'headers' => [ 'User-Agent' => 'WordPress/' . get_bloginfo( 'version' ) ],
			]
		);

		$body = is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response )
			? null
			: json_decode( wp_remote_retrieve_body( $response ) );

		$zip = is_object( $body ) && ! empty( $body->assets[0]->browser_download_url )
			? (string) $body->assets[0]->browser_download_url
			: '';

		if ( '' === $zip || empty( $body->tag_name ) ) {
			set_transient( self::CACHE_KEY, [ 'status' => 'error' ], self::ERROR_HOURS * HOUR_IN_SECONDS );
			return null;
		}

		$release = (object) [
			'version'   => ltrim( (string) $body->tag_name, 'v' ),
			'zip_url'   => $zip,
			'published' => (string) ( $body->published_at ?? '' ),
		];

		set_transient( self::CACHE_KEY, $release, self::CACHE_HOURS * HOUR_IN_SECONDS );
		$this->release = $release;

		return $release;
	}

	/**
	 * Add or clear the update entry.
	 *
	 * @param mixed $transient The update_plugins transient.
	 * @return mixed
	 */
	public function check_update( $transient ) {

		if ( ! is_object( $transient ) || empty( $transient->checked ) ) {
			return $transient;
		}

		$release = $this->release();

		if ( null === $release ) {
			return $transient;
		}

		$entry = (object) [
			'slug'        => dirname( $this->basename ),
			'plugin'      => $this->basename,
			'new_version' => $release->version,
			'tested'      => get_bloginfo( 'version' ),
			'url'         => 'https://github.com/' . self::REPO,
			'icons'       => [
				'1x' => self::ICON_SMALL,
				'2x' => self::ICON_LARGE,
			],
		];

		if ( version_compare( $release->version, WEAVE_SITE_ALERTS_VERSION, '>' ) ) {
			$entry->package                         = $release->zip_url;
			$transient->response[ $this->basename ] = $entry;
		} else {
			unset( $transient->response[ $this->basename ] );
			$entry->package                          = '';
			$transient->no_update[ $this->basename ] = $entry;
		}

		return $transient;
	}

	/**
	 * Details for the "View details" modal.
	 *
	 * @param mixed  $res    Default result.
	 * @param string $action API action.
	 * @param object $args   Request arguments.
	 * @return mixed
	 */
	public function plugin_info( $res, $action, $args ) {

		if ( 'plugin_information' !== $action || ( $args->slug ?? '' ) !== dirname( $this->basename ) ) {
			return $res;
		}

		$release = $this->release();

		if ( null === $release ) {
			return $res;
		}

		return (object) [
			'name'          => 'Weave Site Alerts',
			'slug'          => dirname( $this->basename ),
			'version'       => $release->version,
			'tested'        => get_bloginfo( 'version' ),
			'last_updated'  => $release->published,
			'download_link' => $release->zip_url,
			'icons'         => [
				'1x' => self::ICON_SMALL,
				'2x' => self::ICON_LARGE,
			],
		];
	}

	/**
	 * Put the unpacked release back in this plugin's folder.
	 *
	 * Only for this plugin's own update: the hook fires for every plugin.
	 *
	 * @param mixed $response   Install response.
	 * @param array $hook_extra Extra arguments, including the plugin basename.
	 * @param array $result     Install result.
	 * @return mixed
	 */
	public function after_install( $response, $hook_extra, $result ) {

		if ( ( $hook_extra['plugin'] ?? '' ) !== $this->basename ) {
			return $result;
		}

		global $wp_filesystem;

		$target = plugin_dir_path( $this->file );

		if ( $result['destination'] !== $target ) {
			$wp_filesystem->move( $result['destination'], $target );
			$result['destination'] = $target;
		}

		delete_transient( self::CACHE_KEY );

		return $result;
	}
}
