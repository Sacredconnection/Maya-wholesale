<?php
/**
 * Plugin Name: Maya Herbs Wholesale Admin Tools
 * Description: Adds wholesale account approval tools and product lead-time controls for the Maya partner portal.
 * Version: 1.3.0
 * Author: Maya Herbs
 */

defined( 'ABSPATH' ) || exit;

const MAYA_WHOLESALE_LEAD_TIME_META_KEY = '_maya_lead_time_mode';

/**
 * Lead-time choices shared by product and variation inventory controls.
 * An empty value keeps the automatic policy: 250g+ is bulk; smaller formats
 * use the short new-batch notice.
 *
 * @return array<string, string>
 */
function maya_wholesale_lead_time_options() {
	return array(
		''             => __( 'Automatic by format', 'maya-wholesale' ),
		'bulk_request' => __( 'Bulk request — 1–4 weeks + request button', 'maya-wholesale' ),
		'small_batch'  => __( 'Small batch — 1–3 days, no request button', 'maya-wholesale' ),
	);
}

/**
 * Keep only supported override values. Empty means automatic.
 *
 * @param mixed $value Submitted value.
 * @return string
 */
function maya_wholesale_sanitize_lead_time_mode( $value ) {
	$value = sanitize_key( (string) $value );
	return in_array( $value, array( 'bulk_request', 'small_batch' ), true ) ? $value : '';
}

/** Add the default lead-time policy to the product inventory panel. */
add_action(
	'woocommerce_product_options_inventory_product_data',
	static function () {
		global $post;
		if ( ! $post instanceof WP_Post ) {
			return;
		}

		woocommerce_wp_select(
			array(
				'id'          => MAYA_WHOLESALE_LEAD_TIME_META_KEY,
				'label'       => __( 'Portal lead-time policy', 'maya-wholesale' ),
				'description' => __( 'Automatic uses the package weight (250g and above is bulk). Choose an override for forecasting exceptions.', 'maya-wholesale' ),
				'desc_tip'    => true,
				'options'     => maya_wholesale_lead_time_options(),
				'value'       => get_post_meta( $post->ID, MAYA_WHOLESALE_LEAD_TIME_META_KEY, true ),
			)
		);
	}
);

/** Save the product-level default lead-time policy. */
add_action(
	'woocommerce_process_product_meta',
	static function ( $product_id ) {
		if ( ! current_user_can( 'edit_post', $product_id ) ) {
			return;
		}

		$value = isset( $_POST[ MAYA_WHOLESALE_LEAD_TIME_META_KEY ] )
			? maya_wholesale_sanitize_lead_time_mode( wp_unslash( $_POST[ MAYA_WHOLESALE_LEAD_TIME_META_KEY ] ) )
			: '';
		if ( '' === $value ) {
			delete_post_meta( $product_id, MAYA_WHOLESALE_LEAD_TIME_META_KEY );
		} else {
			update_post_meta( $product_id, MAYA_WHOLESALE_LEAD_TIME_META_KEY, $value );
		}
	}
);

/** Add a per-variation override to each variation inventory panel. */
add_action(
	'woocommerce_variation_options_inventory',
	static function ( $loop, $variation_data, $variation ) {
		woocommerce_wp_select(
			array(
				'id'            => MAYA_WHOLESALE_LEAD_TIME_META_KEY . '_' . $loop,
				'name'          => MAYA_WHOLESALE_LEAD_TIME_META_KEY . '[' . $loop . ']',
				'label'         => __( 'Portal lead-time policy', 'maya-wholesale' ),
				'description'   => __( 'Overrides the product policy for this format only.', 'maya-wholesale' ),
				'desc_tip'      => true,
				'wrapper_class' => 'form-row form-row-full',
				'options'       => maya_wholesale_lead_time_options(),
				'value'         => get_post_meta( $variation->ID, MAYA_WHOLESALE_LEAD_TIME_META_KEY, true ),
			)
		);
	},
	10,
	3
);

/** Save the per-variation lead-time override. */
add_action(
	'woocommerce_save_product_variation',
	static function ( $variation_id, $loop ) {
		if ( ! current_user_can( 'edit_post', $variation_id ) ) {
			return;
		}

		$submitted = isset( $_POST[ MAYA_WHOLESALE_LEAD_TIME_META_KEY ][ $loop ] )
			? wp_unslash( $_POST[ MAYA_WHOLESALE_LEAD_TIME_META_KEY ][ $loop ] )
			: '';
		$value     = maya_wholesale_sanitize_lead_time_mode( $submitted );
		if ( '' === $value ) {
			delete_post_meta( $variation_id, MAYA_WHOLESALE_LEAD_TIME_META_KEY );
		} else {
			update_post_meta( $variation_id, MAYA_WHOLESALE_LEAD_TIME_META_KEY, $value );
		}
	},
	10,
	2
);

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
