<?php
/**
 * Plugin Name: Maya Herbs Wholesale Admin Tools
 * Description: Adds wholesale account approval tools and product lead-time controls for the Maya partner portal.
 * Version: 1.4.3
 * Author: Maya Herbs
 */

defined( 'ABSPATH' ) || exit;

const MAYA_WHOLESALE_PORTAL_ORIGIN = 'https://wholesale.mayaherbs.com';
const MAYA_WHOLESALE_ADMIN_TOOLS_VERSION = '1.4.3';

/**
 * Keep customer password-recovery links and form submissions on the public
 * wholesale hostname. Next.js proxies this single path to WordPress.
 *
 * @param string $url     Generated network site URL.
 * @param string $path    Requested path.
 * @param string $scheme  URL scheme context.
 * @return string
 */
function maya_wholesale_public_recovery_url( $url, $path, $scheme ) {
	if (
		in_array( $scheme, array( 'login', 'login_post' ), true ) &&
		preg_match( '#^wp-login\.php(?:\?|$)#', ltrim( (string) $path, '/' ) ) &&
		preg_match( '/(?:^|[?&])action=(?:lostpassword|retrievepassword|rp|resetpass)(?:&|$)/', (string) $path )
	) {
		return esc_url_raw( MAYA_WHOLESALE_PORTAL_ORIGIN . '/' . ltrim( (string) $path, '/' ) );
	}

	return $url;
}
add_filter( 'network_site_url', 'maya_wholesale_public_recovery_url', 10, 3 );

/** Send the recovery screen's "Log in" link back to the portal login modal. */
add_filter(
	'login_url',
	static function ( $login_url ) {
		$action = isset( $_REQUEST['action'] )
			? sanitize_key( wp_unslash( $_REQUEST['action'] ) )
			: '';

		if ( in_array( $action, array( 'lostpassword', 'retrievepassword', 'rp', 'resetpass' ), true ) ) {
			return MAYA_WHOLESALE_PORTAL_ORIGIN . '/my-account?login=1&redirect=%2Fmy-account';
		}

		return $login_url;
	}
);

/** Permit the public portal as a target for WordPress safe redirects. */
add_filter(
	'allowed_redirect_hosts',
	static function ( $hosts ) {
		$hosts[] = wp_parse_url( MAYA_WHOLESALE_PORTAL_ORIGIN, PHP_URL_HOST );
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

		wp_safe_redirect( MAYA_WHOLESALE_PORTAL_ORIGIN, 302, 'Maya Wholesale' );
		exit;
	},
	0
);

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
 * Query arguments for accounts whose WordPress role is pending.
 *
 * @return array<int|string, mixed>
 */
function maya_wholesale_pending_user_query_args() {
	return array(
		'role' => 'pending',
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
			array_merge(
				array(
					'number'      => 1,
					'fields'      => 'ID',
					'count_total' => true,
				),
				maya_wholesale_pending_user_query_args()
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

		$query->set( 'role', 'pending' );
	}
);

/**
 * Ensure that pending approval is available as a real WordPress role.
 */
function maya_wholesale_ensure_pending_role() {
	if ( ! get_role( 'pending' ) ) {
		add_role(
			'pending',
			__( 'Pending approval', 'maya-wholesale' ),
			array()
		);
	}
}

// Register on REST requests too, including after an in-place plugin update.
add_action( 'init', 'maya_wholesale_ensure_pending_role' );

/** Initialize new portal customers before WooCommerce persists their role and meta. */
add_action(
	'woocommerce_before_customer_object_save',
	static function ( $customer ) {
		if ( $customer->get_id() || 'wholesale-portal' !== $customer->get_meta( 'sc_channel' ) ) {
			return;
		}
		maya_wholesale_ensure_pending_role();
		$customer->set_role( 'pending' );
		$customer->update_meta_data( 'sc_approval_status', 'pending' );
		$customer->update_meta_data( 'maya_account_status', 'pending_approval' );
		$customer->update_meta_data( 'maya_account_status_label', 'Pending approval' );
		$customer->update_meta_data( 'pw_user_status', 'pending' );
	},
	999,
	1
);

/** Reassert pending status after REST creation and legacy registration hooks. */
add_action(
	'woocommerce_rest_insert_customer',
	static function ( $user, $request, $creating ) {
		if ( ! $creating || 'wholesale-portal' !== get_user_meta( $user->ID, 'sc_channel', true ) ) {
			return;
		}
		$user->set_role( 'pending' );
		maya_wholesale_sync_approval_status( $user->ID, 'pending', false );
	},
	999,
	3
);

/**
 * Return the primary role currently assigned to a user.
 *
 * @param int $user_id WordPress user ID.
 * @return string
 */
function maya_wholesale_user_role( $user_id ) {
	$user = get_userdata( $user_id );
	if ( ! $user || empty( $user->roles ) ) {
		return '';
	}

	return strtolower( sanitize_key( reset( $user->roles ) ) );
}

/**
 * Keep applications pending until an administrator explicitly changes the role.
 *
 * @param int    $user_id          WordPress user ID.
 * @param string $role             New WordPress role.
 * @param bool   $notify           Whether to dispatch the approval webhook.
 * @param bool   $manual_approval Whether an administrator explicitly approved the account.
 * @return bool Whether a portal account was synchronized.
 */
function maya_wholesale_sync_approval_status( $user_id, $role, $notify = true, $manual_approval = false ) {
	$user_id = absint( $user_id );
	$role    = strtolower( sanitize_key( $role ) );

	if (
		0 === $user_id ||
		'' === $role ||
		'wholesale-portal' !== get_user_meta( $user_id, 'sc_channel', true )
	) {
		return false;
	}

	$sc_status   = strtolower( (string) get_user_meta( $user_id, 'sc_approval_status', true ) );
	$maya_status = strtolower( (string) get_user_meta( $user_id, 'maya_account_status', true ) );
	$pw_status   = strtolower( (string) get_user_meta( $user_id, 'pw_user_status', true ) );

	$statuses = array( $sc_status, $maya_status, $pw_status );
	$blocked = count( array_filter( $statuses, static function ( $status ) {
		return '' !== $status && 'approved' !== $status;
	} ) ) > 0;
	$already_approved = ! $blocked && 'approved' === $sc_status && 'approved' === $maya_status;

	// Profile saves, API requests and upgrades must never grant approval.
	if ( 'pending' !== $role && ! $manual_approval ) {
		if ( $already_approved ) {
			return true;
		}
		$user = get_userdata( $user_id );
		if ( $user ) {
			$user->set_role( 'pending' );
		}
		$role = 'pending';
	}

	if ( 'pending' === $role ) {
		update_user_meta( $user_id, 'sc_approval_status', 'pending' );
		update_user_meta( $user_id, 'maya_account_status', 'pending_approval' );
		update_user_meta( $user_id, 'maya_account_status_label', 'Pending approval' );
		update_user_meta( $user_id, 'pw_user_status', 'pending' );
		delete_user_meta( $user_id, 'sc_approved_role' );
		delete_user_meta( $user_id, 'sc_approved_at' );
		delete_user_meta( $user_id, 'sc_approval_email_role' );
		delete_user_meta( $user_id, 'sc_approval_email_sent_at' );
		delete_transient( 'new_user_approve_user_statuses' );
		delete_transient( 'new_user_approve_user_statuses_count' );
		return true;
	}

	$was_pending = ! $already_approved ||
		'pending' === $sc_status ||
		'pending_approval' === $maya_status ||
		'pending' === $pw_status;

	update_user_meta( $user_id, 'sc_approval_status', 'approved' );
	update_user_meta( $user_id, 'maya_account_status', 'approved' );
	update_user_meta( $user_id, 'maya_account_status_label', 'Approved' );
	update_user_meta( $user_id, 'pw_user_status', 'approved' );
	update_user_meta( $user_id, 'sc_approved_role', $role );
	if ( $was_pending || ! get_user_meta( $user_id, 'sc_approved_at', true ) ) {
		update_user_meta( $user_id, 'sc_approved_at', gmdate( 'c' ) );
	}
	delete_transient( 'new_user_approve_user_statuses' );
	delete_transient( 'new_user_approve_user_statuses_count' );

	if ( $notify && $was_pending ) {
		do_action( 'woocommerce_sacred_wholesale_customer_approved', $user_id );
	}

	return true;
}

/**
 * Reconcile existing portal accounts after installing or upgrading the plugin.
 */
function maya_wholesale_reconcile_portal_accounts() {
	$user_ids = get_users(
		array(
			'fields'     => 'ID',
			'number'     => -1,
			'meta_key'   => 'sc_channel', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value' => 'wholesale-portal', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
		)
	);

	foreach ( $user_ids as $user_id ) {
		maya_wholesale_sync_approval_status(
			$user_id,
			maya_wholesale_user_role( $user_id ),
			false
		);
	}
}

/**
 * Create the role and migrate stale approval metadata once per plugin version.
 */
function maya_wholesale_activate_admin_tools() {
	maya_wholesale_ensure_pending_role();
	maya_wholesale_reconcile_portal_accounts();
	update_option( 'maya_wholesale_admin_tools_version', MAYA_WHOLESALE_ADMIN_TOOLS_VERSION, false );
}
register_activation_hook( __FILE__, 'maya_wholesale_activate_admin_tools' );

add_action(
	'admin_init',
	static function () {
		maya_wholesale_ensure_pending_role();
		if ( MAYA_WHOLESALE_ADMIN_TOOLS_VERSION !== get_option( 'maya_wholesale_admin_tools_version' ) ) {
			maya_wholesale_reconcile_portal_accounts();
			update_option( 'maya_wholesale_admin_tools_version', MAYA_WHOLESALE_ADMIN_TOOLS_VERSION, false );
		}
	}
);

add_action(
	'set_user_role',
	static function ( $user_id, $role, $old_roles ) {
		maya_wholesale_sync_approval_status(
			$user_id,
			$role,
			true,
			! empty( $old_roles ) &&
			is_admin() &&
			! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) &&
			current_user_can( 'promote_user', $user_id )
		);
	},
	999,
	3
);

// Reconcile users whose profile is saved without changing the role.
add_action(
	'profile_update',
	static function ( $user_id ) {
		maya_wholesale_sync_approval_status(
			$user_id,
			maya_wholesale_user_role( $user_id ),
			true
		);
	},
	999,
	1
);

/**
 * Add an explicit approval action to pending users.
 */
add_filter(
	'user_row_actions',
	static function ( $actions, $user ) {
		if (
			! in_array( 'pending', (array) $user->roles, true ) ||
			! current_user_can( 'promote_user', $user->ID )
		) {
			return $actions;
		}

		$url = wp_nonce_url(
			add_query_arg(
				array(
					'action'  => 'maya_approve_customer',
					'user_id' => $user->ID,
				),
				admin_url( 'users.php' )
			),
			'maya_approve_customer_' . $user->ID
		);
		$actions['maya_approve_customer'] = sprintf(
			'<a href="%1$s">%2$s</a>',
			esc_url( $url ),
			esc_html__( 'Approve as Customer', 'maya-wholesale' )
		);

		return $actions;
	},
	10,
	2
);

add_action(
	'admin_action_maya_approve_customer',
	static function () {
		$user_id = isset( $_GET['user_id'] ) ? absint( $_GET['user_id'] ) : 0;
		if ( ! $user_id || ! current_user_can( 'promote_user', $user_id ) ) {
			wp_die( esc_html__( 'You are not allowed to approve this user.', 'maya-wholesale' ) );
		}
		check_admin_referer( 'maya_approve_customer_' . $user_id );

		$user = get_userdata( $user_id );
		if ( $user ) {
			$user->set_role( 'customer' );
		}

		$redirect = wp_get_referer() ?: admin_url( 'users.php' );
		wp_safe_redirect( add_query_arg( 'maya_approved', 1, $redirect ) );
		exit;
	}
);

add_filter(
	'bulk_actions-users',
	static function ( $actions ) {
		$actions['maya_approve_customer'] = __( 'Approve as Customer', 'maya-wholesale' );
		return $actions;
	}
);

add_filter(
	'handle_bulk_actions-users',
	static function ( $redirect_url, $action, $user_ids ) {
		if ( 'maya_approve_customer' !== $action ) {
			return $redirect_url;
		}

		$approved = 0;
		foreach ( (array) $user_ids as $user_id ) {
			$user_id = absint( $user_id );
			if ( ! $user_id || ! current_user_can( 'promote_user', $user_id ) ) {
				continue;
			}

			$user = get_userdata( $user_id );
			if ( $user ) {
				$user->set_role( 'customer' );
				++$approved;
			}
		}

		return add_query_arg( 'maya_approved', $approved, $redirect_url );
	},
	10,
	3
);

add_action(
	'admin_notices',
	static function () {
		if ( ! isset( $_GET['maya_approved'] ) ) {
			return;
		}

		$count = absint( $_GET['maya_approved'] );
		printf(
			'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
			esc_html(
				sprintf(
					_n( '%d wholesale account approved.', '%d wholesale accounts approved.', $count, 'maya-wholesale' ),
					$count
				)
			)
		);
	}
);

/** Shared, atomic counters across all portal instances. Values contain no raw email/IP. */
function maya_wholesale_consume_security_bucket( $bucket, $limit, $window ) {
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

function maya_wholesale_rest_security_rate_limit( $request ) {
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
    $allowed = maya_wholesale_consume_security_bucket( $action . ':ip:' . $client, $ip_limit, $window );
    if ( $allowed ) {
        $allowed = maya_wholesale_consume_security_bucket( $action . ':account:' . $account, $account_limit, $window );
    }
    return new WP_REST_Response( array( 'allowed' => $allowed, 'retryAfter' => $window - ( time() % $window ) ), 200 );
}

add_action( 'rest_api_init', static function () {
    register_rest_route( 'maya-wholesale/v1', '/security/rate-limit', array(
        'methods' => 'POST',
        'permission_callback' => static function () { return current_user_can( 'manage_options' ); },
        'callback' => 'maya_wholesale_rest_security_rate_limit',
    ) );
} );

add_action( 'init', static function () {
    if ( ! wp_next_scheduled( 'maya_wholesale_security_cleanup' ) ) {
        wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'maya_wholesale_security_cleanup' );
    }
} );
add_action( 'maya_wholesale_security_cleanup', static function () {
    global $wpdb;
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s AND CAST(SUBSTRING(option_name, 9, 10) AS UNSIGNED) <= %d",
        $wpdb->esc_like( 'maya_rl_' ) . '%', time()
    ) );
} );

/** Revoke portal cookies after a password reset or a password change in WordPress. */
add_action( 'after_password_reset', static function ( $user ) {
    update_user_meta( $user->ID, 'sc_session_version', wp_generate_uuid4() );
}, 10, 1 );
add_action( 'profile_update', static function ( $user_id, $old_user_data = null ) {
    $user = get_userdata( $user_id );
    if ( $user && $old_user_data && $user->user_pass !== $old_user_data->user_pass ) {
        update_user_meta( $user_id, 'sc_session_version', wp_generate_uuid4() );
    }
}, 10, 2 );
