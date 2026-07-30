<?php
/**
 * Plugin Name: Maya Herbs Wholesale Admin Tools
 * Description: Adds a Pending approval filter to WordPress Users and notifies WooCommerce when wholesale access is approved.
 * Version: 1.2.0
 * Author: Maya Herbs
 */

defined( 'ABSPATH' ) || exit;

/**
 * Make portal registrations compatible with legacy validation snippets that
 * still read flat form fields from $_POST instead of the WooCommerce REST
 * request. The values remain limited to authenticated customer creation calls.
 */
add_filter(
	'rest_request_before_callbacks',
	static function ( $response, $handler, $request ) {
		if (
			'POST' !== $request->get_method() ||
			'/wc/v3/customers' !== untrailingslashit( $request->get_route() )
		) {
			return $response;
		}

		$billing   = (array) $request->get_param( 'billing' );
		$meta_data = (array) $request->get_param( 'meta_data' );
		$vat       = '';

		foreach ( array( 'vat_number', 'billing_vat', 'maya_vat_number' ) as $vat_key ) {
			$candidate = sanitize_text_field( (string) $request->get_param( $vat_key ) );
			if ( '' !== $candidate ) {
				$vat = $candidate;
				break;
			}
		}

		if ( '' === $vat ) {
			foreach ( $meta_data as $meta ) {
				$meta = (array) $meta;
				$key  = isset( $meta['key'] ) ? sanitize_key( $meta['key'] ) : '';

				if (
					in_array( $key, array( 'vat_number', 'billing_vat', 'maya_vat_number' ), true ) &&
					isset( $meta['value'] )
				) {
					$vat = sanitize_text_field( (string) $meta['value'] );
					if ( '' !== $vat ) {
						break;
					}
				}
			}
		}

		$fields = array(
			'vat_number'         => $vat,
			'billing_vat'        => $vat,
			'maya_vat_number'    => $vat,
			'first_name'         => isset( $billing['first_name'] ) ? $billing['first_name'] : '',
			'last_name'          => isset( $billing['last_name'] ) ? $billing['last_name'] : '',
			'billing_first_name' => isset( $billing['first_name'] ) ? $billing['first_name'] : '',
			'billing_last_name'  => isset( $billing['last_name'] ) ? $billing['last_name'] : '',
			'address'            => isset( $billing['address_1'] ) ? $billing['address_1'] : '',
			'billing_address_1'  => isset( $billing['address_1'] ) ? $billing['address_1'] : '',
			'city'               => isset( $billing['city'] ) ? $billing['city'] : '',
			'billing_city'       => isset( $billing['city'] ) ? $billing['city'] : '',
			'state'              => isset( $billing['state'] ) ? $billing['state'] : '',
			'billing_state'      => isset( $billing['state'] ) ? $billing['state'] : '',
			'postcode'           => isset( $billing['postcode'] ) ? $billing['postcode'] : '',
			'zip'                => isset( $billing['postcode'] ) ? $billing['postcode'] : '',
			'billing_postcode'   => isset( $billing['postcode'] ) ? $billing['postcode'] : '',
			'country'            => isset( $billing['country'] ) ? $billing['country'] : '',
			'billing_country'    => isset( $billing['country'] ) ? $billing['country'] : '',
		);

		foreach ( $fields as $key => $value ) {
			$value = sanitize_text_field( (string) $value );
			if ( '' === $value ) {
				continue;
			}

			$_POST[ $key ]    = $value;
			$_REQUEST[ $key ] = $value;
		}

		return $response;
	},
	5,
	3
);

/**
 * Reusable meta query for both Maya's existing approval field and the
 * wholesale portal compatibility field.
 *
 * @return array<int|string, mixed>
 */
function maya_wholesale_pending_meta_query() {
	return array(
		'relation' => 'OR',
		array(
			'key'     => 'maya_account_status',
			'value'   => 'pending_approval',
			'compare' => '=',
		),
		array(
			'key'     => 'sc_approval_status',
			'value'   => 'pending',
			'compare' => '=',
		),
	);
}

/**
 * Add a first-class "Pending approval" view beside the standard role filters
 * on wp-admin/users.php.
 */
add_filter(
	'views_users',
	static function ( $views ) {
		if ( ! current_user_can( 'list_users' ) ) {
			return $views;
		}

		$count_query = new WP_User_Query(
			array(
				'number'      => 1,
				'fields'      => 'ID',
				'count_total' => true,
				'meta_query'  => maya_wholesale_pending_meta_query(), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
			)
		);
		$count       = (int) $count_query->get_total();
		$is_current  = isset( $_GET['maya_approval_status'] ) &&
			'pending_approval' === sanitize_key( wp_unslash( $_GET['maya_approval_status'] ) );
		$filter_url  = add_query_arg(
			'maya_approval_status',
			'pending_approval',
			admin_url( 'users.php' )
		);

		$views['maya_pending_approval'] = sprintf(
			'<a href="%1$s"%2$s>%3$s <span class="count">(%4$s)</span></a>',
			esc_url( $filter_url ),
			$is_current ? ' class="current" aria-current="page"' : '',
			esc_html__( 'Pending approval', 'maya-wholesale' ),
			esc_html( number_format_i18n( $count ) )
		);

		return $views;
	}
);

/**
 * Apply the selected approval view to the main WordPress users query.
 */
add_action(
	'pre_get_users',
	static function ( $query ) {
		global $pagenow;

		if (
			! is_admin() ||
			'users.php' !== $pagenow ||
			! current_user_can( 'list_users' ) ||
			! isset( $_GET['maya_approval_status'] ) ||
			'pending_approval' !== sanitize_key( wp_unslash( $_GET['maya_approval_status'] ) )
		) {
			return;
		}

		$query->set( 'meta_query', maya_wholesale_pending_meta_query() ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
	}
);

/**
 * Notify the configured WooCommerce action webhook when a user receives an
 * approved wholesale role.
 */
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
