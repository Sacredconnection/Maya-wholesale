<?php
/**
 * Plugin Name: Maya Wholesale Core
 * Description: Provides wholesale approvals, product lead-time controls, registration compatibility, webhooks, and branded password recovery.
 * Version: 1.0.0
 * Author: Maya Herbs
 */

defined( 'ABSPATH' ) || exit;

const MAYA_WHOLESALE_CORE_PORTAL_ORIGIN = 'https://wholesale.mayaherbs.com';

/**
 * Replace the WordPress reset screen in recovery emails with the branded
 * Next.js page while retaining WordPress's native one-time key.
 *
 * @param string $url     Generated network site URL.
 * @param string $path    Requested path.
 * @param string $scheme  URL scheme context.
 * @return string
 */
function maya_wholesale_core_public_recovery_url( $url, $path, $scheme ) {
	if ( ! in_array( $scheme, array( 'login', 'login_post' ), true ) ) {
		return $url;
	}

	$query = wp_parse_url( (string) $path, PHP_URL_QUERY );
	$args  = array();
	parse_str( is_string( $query ) ? $query : '', $args );
	if ( 'rp' !== ( $args['action'] ?? '' ) || empty( $args['key'] ) || empty( $args['login'] ) ) {
		return $url;
	}

	return add_query_arg(
		array(
			'key'   => sanitize_text_field( (string) $args['key'] ),
			'login' => sanitize_text_field( (string) $args['login'] ),
		),
		MAYA_WHOLESALE_CORE_PORTAL_ORIGIN . '/reset-password'
	);
}
add_filter( 'network_site_url', 'maya_wholesale_core_public_recovery_url', 10, 3 );

/** Apply a small persistent throttle to public password-recovery requests. */
function maya_wholesale_core_password_rate_limited( $bucket, $limit, $window ) {
	$key     = 'maya_pw_' . md5( strtolower( (string) $bucket ) );
	$current = (int) get_transient( $key );
	if ( $current >= $limit ) {
		return true;
	}

	set_transient( $key, $current + 1, $window );
	return false;
}

/** Register the private-data-free bridge consumed by the Next.js server. */
add_action(
	'rest_api_init',
	static function () {
		register_rest_route(
			'maya-wholesale/v1',
			'/password/forgot',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'maya_wholesale_core_rest_forgot_password',
			)
		);
		register_rest_route(
			'maya-wholesale/v1',
			'/password/reset',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'permission_callback' => '__return_true',
				'callback'            => 'maya_wholesale_core_rest_reset_password',
			)
		);
	}
);

/** Request the native WordPress reset email without disclosing account state. */
function maya_wholesale_core_rest_forgot_password( WP_REST_Request $request ) {
	$email     = sanitize_email( (string) $request->get_param( 'email' ) );
	$client_ip = sanitize_text_field( (string) $request->get_param( 'clientIp' ) );
	if ( ! is_email( $email ) ) {
		return new WP_Error( 'invalid_email', 'Enter a valid email address.', array( 'status' => 400 ) );
	}
	if (
		maya_wholesale_core_password_rate_limited( 'email:' . $email, 3, HOUR_IN_SECONDS ) ||
		maya_wholesale_core_password_rate_limited( 'ip:' . $client_ip, 10, HOUR_IN_SECONDS )
	) {
		return new WP_Error( 'rate_limited', 'Too many requests. Please wait before trying again.', array( 'status' => 429 ) );
	}

	$result = retrieve_password( $email );
	if ( is_wp_error( $result ) && ! in_array( $result->get_error_code(), array( 'invalidcombo', 'invalid_email', 'invalid_username' ), true ) ) {
		error_log( 'Maya wholesale password email failed: ' . $result->get_error_message() );
	}

	return new WP_REST_Response( array( 'sent' => true ), 200 );
}

/** Validate the native one-time key and save the new WordPress password. */
function maya_wholesale_core_rest_reset_password( WP_REST_Request $request ) {
	$login    = sanitize_text_field( (string) $request->get_param( 'login' ) );
	$key      = sanitize_text_field( (string) $request->get_param( 'key' ) );
	$password = (string) $request->get_param( 'password' );

	if ( '' === $login || '' === $key || strlen( $password ) < 12 || strlen( $password ) > 256 ) {
		return new WP_Error( 'invalid_reset', 'Use a valid reset link and a password with at least 12 characters.', array( 'status' => 400 ) );
	}
	if ( maya_wholesale_core_password_rate_limited( 'reset:' . $login, 10, HOUR_IN_SECONDS ) ) {
		return new WP_Error( 'rate_limited', 'Too many attempts. Request a new reset link.', array( 'status' => 429 ) );
	}

	$user = check_password_reset_key( $key, $login );
	if ( is_wp_error( $user ) ) {
		return new WP_Error( 'invalid_key', 'This password reset link is invalid or has expired.', array( 'status' => 400 ) );
	}

	reset_password( $user, $password );
	return new WP_REST_Response( array( 'reset' => true ), 200 );
}

/** Permit the public portal as a target for WordPress safe redirects. */
add_filter(
	'allowed_redirect_hosts',
	static function ( $hosts ) {
		$hosts[] = wp_parse_url( MAYA_WHOLESALE_CORE_PORTAL_ORIGIN, PHP_URL_HOST );
		return array_values( array_unique( array_filter( $hosts ) ) );
	}
);

/** Return public storefront requests away from the headless backend hostname. */
add_action(
	'template_redirect',
	static function () {
		if (
			is_admin() ||
			wp_doing_ajax() ||
			wp_doing_cron() ||
			( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
			( defined( 'WP_CLI' ) && WP_CLI ) ||
			( defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST )
		) {
			return;
		}

		wp_safe_redirect( MAYA_WHOLESALE_CORE_PORTAL_ORIGIN, 302, 'Maya Wholesale' );
		exit;
	},
	0
);

const MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY = '_maya_lead_time_mode';

/**
 * Lead-time choices shared by product and variation inventory controls.
 * An empty value keeps the automatic policy: 250g+ is bulk; smaller formats
 * use the short new-batch notice.
 *
 * @return array<string, string>
 */
function maya_wholesale_core_lead_time_options() {
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
function maya_wholesale_core_sanitize_lead_time_mode( $value ) {
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
				'id'          => MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY,
				'label'       => __( 'Portal lead-time policy', 'maya-wholesale' ),
				'description' => __( 'Automatic uses the package weight (250g and above is bulk). Choose an override for forecasting exceptions.', 'maya-wholesale' ),
				'desc_tip'    => true,
				'options'     => maya_wholesale_core_lead_time_options(),
				'value'       => get_post_meta( $post->ID, MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY, true ),
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

		$value = isset( $_POST[ MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY ] )
			? maya_wholesale_core_sanitize_lead_time_mode( wp_unslash( $_POST[ MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY ] ) )
			: '';
		if ( '' === $value ) {
			delete_post_meta( $product_id, MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY );
		} else {
			update_post_meta( $product_id, MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY, $value );
		}
	}
);

/** Add a per-variation override to each variation inventory panel. */
add_action(
	'woocommerce_variation_options_inventory',
	static function ( $loop, $variation_data, $variation ) {
		woocommerce_wp_select(
			array(
				'id'            => MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY . '_' . $loop,
				'name'          => MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY . '[' . $loop . ']',
				'label'         => __( 'Portal lead-time policy', 'maya-wholesale' ),
				'description'   => __( 'Overrides the product policy for this format only.', 'maya-wholesale' ),
				'desc_tip'      => true,
				'wrapper_class' => 'form-row form-row-full',
				'options'       => maya_wholesale_core_lead_time_options(),
				'value'         => get_post_meta( $variation->ID, MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY, true ),
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

		$submitted = isset( $_POST[ MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY ][ $loop ] )
			? wp_unslash( $_POST[ MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY ][ $loop ] )
			: '';
		$value     = maya_wholesale_core_sanitize_lead_time_mode( $submitted );
		if ( '' === $value ) {
			delete_post_meta( $variation_id, MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY );
		} else {
			update_post_meta( $variation_id, MAYA_WHOLESALE_CORE_LEAD_TIME_META_KEY, $value );
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
function maya_wholesale_core_pending_meta_query() {
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
				'meta_query'  => maya_wholesale_core_pending_meta_query(), // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
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

		$query->set( 'meta_query', maya_wholesale_core_pending_meta_query() ); // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
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
