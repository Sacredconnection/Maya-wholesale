<?php
define( 'ABSPATH', __DIR__ );
define( 'HOUR_IN_SECONDS', 3600 );
$actions = array(); $filters = array(); $registered = array();
function add_action( $name, $callback, ...$args ) { global $actions; $actions[$name][] = $callback; }
function add_filter( $name, $callback, ...$args ) { global $filters; $filters[$name][] = $callback; }
function register_deactivation_hook( ...$args ) {}
function current_user_can( $capability ) { return 'manage_options' === $capability; }
function register_rest_route( $namespace, $route, $args ) { global $registered; $registered[$route] = $args; }
function rest_get_server() { return new class { public function get_routes() { return array( '/maya-wholesale/v1/security/rate-limit' => array() ); } }; }
function wp_authenticate( $login, $password ) { return 'valid' === $password ? (object) array( 'ID' => 1 ) : new WP_Error(); }
function is_wp_error( $value ) { return $value instanceof WP_Error; }
class WP_Error { public function __construct( ...$args ) {} }
class WP_REST_Response { public $data; public function __construct( $data, $status ) { $this->data = $data; } }
function esc_html( $value ) { return htmlspecialchars( (string) $value, ENT_QUOTES, 'UTF-8' ); }
function wp_strip_all_tags( $value ) { return strip_tags( $value ); }
function wp_kses_post( $value ) { return $value; }
function check( $condition, $message ) { if ( ! $condition ) throw new Exception( $message ); }
require $argv[1];
foreach ( $actions['rest_api_init'] as $action ) $action();
check( isset( $registered['/auth/verify'] ), 'Authentication route missing' );
check( ! isset( $registered['/security/rate-limit'] ), 'Existing limiter overwritten' );
check( $registered['/auth/verify']['permission_callback'](), 'Private permission callback missing' );
foreach ( array( 'valid' => true, 'wrong' => false ) as $password => $expected ) {
    $request = new class( $password ) {
        public function __construct( private $password ) {}
        public function get_param( $key ) { return 'password' === $key ? $this->password : 'test@example.invalid'; }
    };
    check( maya_site_verify_credentials( $request )->data['valid'] === $expected, 'Credential result incorrect' );
}
$item = new class {
    public function get_name() { return 'Test product'; }
    public function get_quantity() { return 2; }
    public function get_product() { return new class { public function get_sku() { return '001-25'; } }; }
};
$order = new class( $item ) {
    public $portal = true;
    public function __construct( private $item ) {}
    public function get_meta( $key ) { return $this->portal ? ( 'sc_channel' === $key ? 'wholesale-portal' : 'yes' ) : ''; }
    public function get_order_number() { return 'TEST-1'; }
    public function get_items() { return array( $this->item ); }
    public function get_formatted_line_subtotal( $item ) { return 'EUR 16.00'; }
    public function get_formatted_order_total() { return 'EUR 16.00'; }
};
$filter = $filters['wc_get_template'][0];
$template = $filter( 'original.php', 'emails/customer-on-hold-order.php', array( 'order' => $order ) );
check( 'original.php' !== $template, 'Portal template not selected' );
$order->portal = false;
check( 'original.php' === $filter( 'original.php', 'emails/customer-on-hold-order.php', array( 'order' => $order ) ), 'Retail confirmation changed' );
$order->portal = true;
foreach ( array( false, true ) as $plain_text ) {
    ob_start(); include $template; $output = ob_get_clean();
    check( strpos( $output, 'Test product' ) < strpos( $output, 'Our sales team will confirm' ), 'Email sequence incorrect' );
    check( str_contains( $output, 'Manual bank transfer after receiving your invoice' ), 'Invoice instruction missing' );
    check( ! preg_match( '/IBAN|Company Bank Account|Our Bank Details|INGB/', $output ), 'Bank details present' );
}
echo "PASS: private auth, limiter compatibility, scoped confirmation and HTML/plain text email order\n";
