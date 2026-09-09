<?php
/** Run with: php tests/wordpress-password-links.test.php */
define( 'ABSPATH', __DIR__ );
$registered_actions = array();
function add_action( $hook, $callback, $priority = 10, $accepted_args = 1 ) {
	$GLOBALS['registered_actions'][ $hook ][ $priority ][] = $callback;
}
function add_filter( ...$args ) {}
function get_user_by( $field, $id ) {
	return 42 === $id ? (object) array( 'user_login' => 'buyer+shop@example.com' ) : false;
}
function check_password_reset_key( $key, $login ) {
	return 'valid-key' === $key && 'buyer+shop@example.com' === $login ? (object) array() : 'invalid';
}
function is_wp_error( $result ) { return 'invalid' === $result; }
function add_query_arg( $args, $url ) { return $url . '?' . http_build_query( $args ); }

require __DIR__ . '/../integrations/wordpress/maya-wholesale-core/maya-wholesale-core.php';

function expect_same( $expected, $actual, $label ) {
	if ( $expected !== $actual ) {
		throw new RuntimeException( $label . ': unexpected redirect' );
	}
	echo "PASS: $label\n";
}
$origin = MAYA_WHOLESALE_CORE_PORTAL_ORIGIN;
$url = maya_wholesale_core_account_redirect_url( array(
	'action' => 'newaccount', 'key' => 'valid-key', 'login' => 'buyer+shop@example.com',
	'redirect_to' => 'https://untrusted.example/',
), true, true );
expect_same( $origin . '/reset-password', strtok( $url, '?' ), 'new account goes to reset form' );
parse_str( parse_url( $url, PHP_URL_QUERY ), $query );
expect_same( array( 'key' => 'valid-key', 'login' => 'buyer+shop@example.com' ), $query, 'credentials survive encoding and unrelated parameters are dropped' );
expect_same( $url, maya_wholesale_core_account_redirect_url( array( 'key' => 'valid-key', 'id' => '42' ), true, true ), 'Woo reset ID resolves to login' );
expect_same( $origin . '/reset-password', maya_wholesale_core_account_redirect_url( array( 'key' => 'expired', 'id' => '42' ), true, true ), 'invalid key does not disclose login' );
expect_same( $origin . '/reset-password', maya_wholesale_core_account_redirect_url( array( 'key' => 'valid-key', 'id' => '99' ), true, true ), 'unknown user gets invalid-link page' );
expect_same( $origin . '/forgot-password', maya_wholesale_core_account_redirect_url( array(), true, true ), 'lost password without credentials requests a link' );
expect_same( $origin . '/forgot-password', maya_wholesale_core_account_redirect_url( array( 'action' => 'newaccount' ), true, false ), 'incomplete new-account link offers recovery' );
expect_same( $origin . '/my-account', maya_wholesale_core_account_redirect_url( array(), true, false ), 'ordinary account link opens frontend account' );
expect_same( $origin, maya_wholesale_core_account_redirect_url( array( 'key' => 'valid-key', 'login' => 'buyer' ), false, false ), 'unrelated storefront request retains home redirect' );
expect_same( $origin . '/forgot-password', maya_wholesale_core_account_redirect_url( array( 'key' => array( 'invalid' ), 'login' => array( 'invalid' ) ), true, true ), 'malformed query parameters do not crash' );
expect_same( true, isset( $registered_actions['template_redirect'][-1] ), 'redirect precedes WooCommerce handlers' );
