<?php
/**
 * Maya Herbs Wholesale: notify WooCommerce after a portal account is approved.
 *
 * Paste this code into a PHP snippet in WPCode and enable it everywhere.
 * When a WordPress user receives an approved role, WooCommerce can deliver the
 * `woocommerce_sacred_wholesale_customer_approved` Action webhook.
 */

defined( 'ABSPATH' ) || exit;

add_action(
	'set_user_role',
	static function ( $user_id, $role, $old_roles ) {
		$user_id = absint( $user_id );
		$role    = strtolower( sanitize_key( $role ) );

		if ( 0 === $user_id || in_array( $role, array( 'pending', 'customer' ), true ) ) {
			return;
		}

		do_action( 'woocommerce_sacred_wholesale_customer_approved', $user_id );
	},
	10,
	3
);
