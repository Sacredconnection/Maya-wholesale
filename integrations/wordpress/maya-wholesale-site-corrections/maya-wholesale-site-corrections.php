<?php
/**
 * Plugin Name: Maya Wholesale Site Corrections
 * Description: Invoice-first wholesale confirmations and a private authentication bridge. Complements the existing Maya Core plugin.
 * Version: 1.0.0
 * Author: Maya Herbs
 */
defined( 'ABSPATH' ) || exit;

function maya_site_verify_credentials( $request ) {
    $login = (string) $request->get_param( 'login' );
    $password = (string) $request->get_param( 'password' );
    if ( '' === $login || strlen( $login ) > 254 || '' === $password || strlen( $password ) > 256 ) {
        return new WP_Error( 'invalid_request', 'Invalid authentication request.', array( 'status' => 400 ) );
    }
    $user = wp_authenticate( $login, $password );
    return new WP_REST_Response( array( 'valid' => ! is_wp_error( $user ) ), 200 );
}

add_action( 'rest_api_init', static function () {
    register_rest_route( 'maya-wholesale/v1', '/auth/verify', array(
        'methods' => 'POST',
        'permission_callback' => static function () { return current_user_can( 'manage_options' ); },
        'callback' => 'maya_site_verify_credentials',
    ) );
    // Some deployed Core versions predate the portal's persistent rate-limit route.
    // Register only when absent, preserving any newer Core implementation.
    $routes = rest_get_server()->get_routes();
    if ( ! isset( $routes['/maya-wholesale/v1/security/rate-limit'] ) ) {
        register_rest_route( 'maya-wholesale/v1', '/security/rate-limit', array(
            'methods' => 'POST',
            'permission_callback' => static function () { return current_user_can( 'manage_options' ); },
            'callback' => 'maya_site_rest_security_rate_limit',
        ) );
    }
}, 100 );

function maya_site_invoice_order( $order ) {
    return is_object( $order ) && 'wholesale-portal' === $order->get_meta( 'sc_channel' ) && 'yes' === $order->get_meta( 'sc_invoice_before_payment' );
}

// Scope the replacement to new invoice-first portal confirmations. No historical
// orders, invoices, retail orders or other Core behavior is modified.
add_filter( 'wc_get_template', static function ( $template, $name, $args ) {
    if ( in_array( $name, array( 'emails/customer-on-hold-order.php', 'emails/plain/customer-on-hold-order.php' ), true ) && maya_site_invoice_order( $args['order'] ?? null ) ) {
        return __DIR__ . '/templates/order-received.php';
    }
    return $template;
}, 100, 3 );

function maya_site_consume_security_bucket( $bucket, $limit, $window ) {
    global $wpdb;
    $expires = ( (int) floor( time() / $window ) + 1 ) * $window;
    $name = 'maya_rl_' . $expires . '_' . hash( 'sha256', $bucket );
    $created = $wpdb->query( $wpdb->prepare(
        "INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, '1', 'no')", $name
    ) );
    if ( false === $created ) { return false; }
    if ( 1 === $created ) { return true; }
    return 1 === $wpdb->query( $wpdb->prepare(
        "UPDATE {$wpdb->options} SET option_value = CAST(option_value AS UNSIGNED) + 1 WHERE option_name = %s AND CAST(option_value AS UNSIGNED) < %d", $name, $limit
    ) );
}

function maya_site_rest_security_rate_limit( $request ) {
    $policies = array(
        'register' => array( 10, 3, 900 ),
        'login' => array( 40, 10, 900 ),
        'forgot' => array( 10, 3, 900 ),
        'reset' => array( 30, 10, 900 ),
        'avatar' => array( 30, 10, 900 ),
        'lead-time' => array( 30, 5, 60 ),
        'order' => array( 60, 20, 900 ),
    );
    $action = (string) $request->get_param( 'action' );
    $client = (string) $request->get_param( 'clientKey' );
    $account = (string) $request->get_param( 'accountKey' );
    if ( ! isset( $policies[$action] ) || ! preg_match( '/^[a-f0-9]{64}$/D', $client ) || ! preg_match( '/^[a-f0-9]{64}$/D', $account ) ) {
        return new WP_Error( 'invalid_request', 'Invalid security request.', array( 'status' => 400 ) );
    }
    list( $ip_limit, $account_limit, $window ) = $policies[$action];
    $allowed = maya_site_consume_security_bucket( $action . ':ip:' . $client, $ip_limit, $window );
    if ( $allowed ) {
        $allowed = maya_site_consume_security_bucket( $action . ':account:' . $account, $account_limit, $window );
    }
    return new WP_REST_Response( array( 'allowed' => $allowed, 'retryAfter' => $window - ( time() % $window ) ), 200 );
}


add_action( 'init', static function () {
    if ( ! wp_next_scheduled( 'maya_site_security_cleanup' ) ) wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'maya_site_security_cleanup' );
} );
add_action( 'maya_site_security_cleanup', static function () {
    global $wpdb;
    $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND CAST(SUBSTRING(option_name, 9, 10) AS UNSIGNED) <= %d", $wpdb->esc_like( 'maya_rl_' ) . '%', time() ) );
} );
register_deactivation_hook( __FILE__, static function () { wp_clear_scheduled_hook( 'maya_site_security_cleanup' ); } );
