<?php
// Isolated WordPress hook harness: no database, network or emails.
define( 'ABSPATH', __DIR__ );
if ( in_array( '--rest', $argv, true ) ) { define( 'REST_REQUEST', true ); }
$hooks = array(); $meta = array(); $users = array(); $roles = array(); $events = array();
$admin = false; $can_promote = false;
function add_action( $name, $callback, $priority = 10, $args = 1 ) { $GLOBALS['hooks'][$name][] = $callback; }
function add_filter( $name, $callback, $priority = 10, $args = 1 ) { add_action( $name, $callback, $priority, $args ); }
function register_activation_hook( $file, $callback ) {}
function do_action( $name, ...$args ) {
    if ( 'woocommerce_sacred_wholesale_customer_approved' === $name ) { $GLOBALS['events'][] = $args[0]; }
    foreach ( $GLOBALS['hooks'][$name] ?? array() as $callback ) { $callback( ...$args ); }
}
function get_user_meta( $id, $key, $single = true ) { return $GLOBALS['meta'][$id][$key] ?? ''; }
function update_user_meta( $id, $key, $value ) { $GLOBALS['meta'][$id][$key] = $value; }
function delete_user_meta( $id, $key ) { unset( $GLOBALS['meta'][$id][$key] ); }
function delete_transient( $key ) {}
function get_userdata( $id ) { return $GLOBALS['users'][$id] ?? false; }
function get_users( $args ) { return array_keys( $GLOBALS['users'] ); }
function absint( $value ) { return abs( (int) $value ); }
function sanitize_key( $value ) { return strtolower( $value ); }
function is_admin() { return $GLOBALS['admin']; }
function current_user_can( ...$args ) { return $GLOBALS['can_promote']; }
function __( $text, $domain = '' ) { return $text; }
function get_role( $role ) { return $GLOBALS['roles'][$role] ?? null; }
function add_role( $role, $label, $caps ) { $GLOBALS['roles'][$role] = $caps; }
class TestUser {
    public $ID; public $roles; public $user_pass = "hash-a";
    function __construct( $id, $role ) { $this->ID = $id; $this->roles = array( $role ); }
    function set_role( $role ) {
        if ( array( $role ) === $this->roles ) { return; }
        $old = $this->roles; $this->roles = array( $role );
        do_action( 'set_user_role', $this->ID, $role, $old );
    }
}
class TestCustomer {
    public $id = 0; public $role = 'customer';
    public $meta = array( 'sc_channel' => 'wholesale-portal', 'sc_approval_status' => 'approved' );
    function get_id() { return $this->id; }
    function get_meta( $key ) { return $this->meta[$key] ?? ''; }
    function set_role( $role ) { $this->role = $role; }
    function update_meta_data( $key, $value ) { $this->meta[$key] = $value; }
}
function check( $condition, $message ) { if ( ! $condition ) { throw new RuntimeException( $message ); } }
require $argv[1];
$prefix = $argv[2];
$users[1] = new TestUser( 1, 'customer' );
$meta[1] = array( 'sc_channel' => 'wholesale-portal', 'sc_approval_status' => 'pending', 'maya_account_status' => 'pending_approval' );
// Activation/upgrades must not approve default-role applicants or emit approval events.
call_user_func( $prefix . '_reconcile_portal_accounts' );
check( array('pending') === $users[1]->roles, 'Migration must keep applicant pending' );
check( array() === $events, 'Migration must not send approval events' );
// API/automatic role changes cannot approve.
$users[1]->set_role( 'customer' );
check( array('pending') === $users[1]->roles, 'Automatic role changes must remain pending' );
$admin = true;
$users[1]->set_role( 'customer' );
check( array('pending') === $users[1]->roles, 'Missing capability must not approve' );
$can_promote = true;
$users[1]->set_role( 'customer' );
if ( defined( 'REST_REQUEST' ) ) {
    check( array('pending') === $users[1]->roles, 'Admin API requests must not approve' );
    check( array() === $events, 'REST request must not emit approval' );
    echo "REST approval guard passed\n";
    exit;
}
foreach ( array( 'sc_approval_status', 'maya_account_status', 'pw_user_status' ) as $key ) {
    check( 'approved' === $meta[1][$key], 'Manual approval must synchronize ' . $key );
}
check( array(1) === $events, 'Manual approval must emit exactly one event' );
do_action( 'profile_update', 1 );
call_user_func( $prefix . '_reconcile_portal_accounts' );
check( array('customer') === $users[1]->roles, 'Approved account must remain active' );
check( array(1) === $events, 'Profile saves/upgrades must not repeat approval' );
$users[1]->set_role( 'pending' );
check( 'pending' === $meta[1]['pw_user_status'], 'Revocation must synchronize pending' );
$users[1]->roles = array('customer');
do_action( 'profile_update', 1 );
check( array('pending') === $users[1]->roles, 'Profile save must not approve pending metadata' );
$customer = new TestCustomer();
do_action( 'woocommerce_before_customer_object_save', $customer );
check( 'pending' === $customer->role, 'New customer must be pending before persistence' );
check( 'pending' === $customer->meta['pw_user_status'], 'New customer must have pending metadata' );
$customer->id = 1; $customer->role = 'customer'; $customer->meta['sc_approval_status'] = 'approved';
do_action( 'woocommerce_before_customer_object_save', $customer );
check( 'customer' === $customer->role && 'approved' === $customer->meta['sc_approval_status'], 'Existing customer saves must not reset approval' );
$customer->id = 0; $customer->meta = array();
do_action( 'woocommerce_before_customer_object_save', $customer );
check( 'customer' === $customer->role, 'Ordinary WooCommerce registration must remain unchanged' );
$users[1]->roles = array('customer');
do_action( 'woocommerce_rest_insert_customer', $users[1], null, true );
check( array('pending') === $users[1]->roles, 'REST creation must finish pending' );
check( array(1) === $events, 'Registration must not emit an approval event' );
echo "WordPress approval transitions passed\n";

// Exercise the new security hooks using isolated WordPress/database doubles.
class WP_REST_Server { const CREATABLE = 'POST'; }
class WP_REST_Response { public $data; public $status; function __construct( $data, $status ) { $this->data = $data; $this->status = $status; } }
class WP_Error { public $code; function __construct( $code, ...$rest ) { $this->code = $code; } }
class TestRequest { private $params; function __construct( $params ) { $this->params = $params; } function get_param( $key ) { return $this->params[$key] ?? null; } }
function register_rest_route( $namespace, $route, $args ) { $GLOBALS['routes'][$route] = $args; }
function wp_generate_uuid4() { static $value = 0; return 'session-version-' . ++$value; }
class TestDatabase {
    public $options = 'wp_options'; public $rows = array(); public $fail = false;
    function prepare( $sql, ...$args ) { return array( $sql, $args ); }
    function query( $statement ) {
        if ( $this->fail ) { return false; }
        list( $sql, $args ) = $statement; $name = $args[0];
        if ( str_starts_with( $sql, 'INSERT IGNORE' ) ) {
            if ( isset( $this->rows[$name] ) ) { return 0; }
            $this->rows[$name] = 1; return 1;
        }
        if ( str_starts_with( $sql, 'UPDATE' ) ) {
            check( str_contains( $sql, 'AND CAST(option_value AS UNSIGNED) < %d' ), 'Counter update must be conditional and atomic' );
            if ( ($this->rows[$name] ?? 0) >= $args[1] ) { return 0; }
            ++$this->rows[$name]; return 1;
        }
        throw new RuntimeException( 'Unexpected SQL' );
    }
}
$wpdb = new TestDatabase();
$consume = $prefix . '_consume_security_bucket';
check( $consume( 'test', 2, 900 ), 'First attempt allowed' );
check( $consume( 'test', 2, 900 ), 'Second attempt allowed' );
check( ! $consume( 'test', 2, 900 ), 'Counter blocks at limit' );
check( $consume( 'different', 2, 900 ), 'Independent bucket allowed' );
$wpdb->fail = true;
check( ! $consume( 'offline', 2, 900 ), 'Database errors fail closed' );
$wpdb->fail = false;
do_action( 'rest_api_init' );
$can_promote = false;
check( ! $routes['/security/rate-limit']['permission_callback'](), 'Public callers cannot consume or probe shared counters' );
if ( isset( $routes['/password/forgot'] ) ) {
    check( ! $routes['/password/forgot']['permission_callback'](), 'Password bridge requires server authentication' );
    check( ! $routes['/password/reset']['permission_callback'](), 'Reset bridge requires server authentication' );
}
$can_promote = true;
check( $routes['/security/rate-limit']['permission_callback'](), 'Admin bridge can consume counters' );
$limit = $prefix . '_rest_security_rate_limit';
$request = new TestRequest( array( 'action' => 'register', 'clientKey' => str_repeat( 'a', 64 ), 'accountKey' => str_repeat( 'b', 64 ) ) );
for ( $i = 0; $i < 3; ++$i ) { check( $limit($request)->data['allowed'], 'Registration attempt allowed' ); }
check( ! $limit($request)->data['allowed'], 'Registration identifier is throttled' );
check( $limit( new TestRequest( array( 'action' => 'invalid' ) ) ) instanceof WP_Error, 'Unknown limit policy rejected' );
do_action( 'after_password_reset', $users[1] );
$version = $meta[1]['sc_session_version'];
check( '' !== $version, 'Password reset revokes sessions' );
$old = clone $users[1]; $users[1]->user_pass = 'hash-b';
do_action( 'profile_update', 1, $old );
check( $version !== $meta[1]['sc_session_version'], 'Admin password change revokes sessions' );
echo "Shared counters, permissions and session revocation passed\n";
