<?php
/** Invoice-first confirmation. Avoids gateway, customer-note and additional-content hooks that repeat bank details. */
defined( 'ABSPATH' ) || exit;
$confirmation = 'Thank you for your wholesale order. Our sales team will confirm product availability and shipping terms, then send your invoice with payment instructions. Please wait for the invoice before making any payment. Once payment is received, we will arrange shipment of your order.';
$steps = array( 'Submit your wholesale order.', 'Our sales team reviews your details and product availability.', 'We confirm your order and shipping terms, then send your invoice.', 'Pay using the instructions on your invoice.', 'We ship your products after receiving payment.' );
$method = 'Manual bank transfer after receiving your invoice';
if ( $plain_text ) {
    echo "ORDER RECEIVED #" . wp_strip_all_tags( $order->get_order_number() ) . "\n\nWe have received your wholesale order.\n\n";
    foreach ( $order->get_items() as $item ) {
        echo wp_strip_all_tags( $item->get_name() ) . ' | Quantity: ' . (int) $item->get_quantity() . ' | ' . html_entity_decode( wp_strip_all_tags( $order->get_formatted_line_subtotal( $item ) ), ENT_QUOTES, 'UTF-8' ) . "\n";
    }
    echo "\nEstimated total: " . html_entity_decode( wp_strip_all_tags( $order->get_formatted_order_total() ), ENT_QUOTES, 'UTF-8' ) . "\n\n" . $confirmation . "\n\n";
    foreach ( $steps as $i => $step ) echo ( $i + 1 ) . '. ' . $step . "\n";
    echo "\nPayment method: " . $method . "\n\nMaya Herbs Wholesale\n";
    return;
}
?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Wholesale order received</title></head><body style="margin:0;background:#f5f5ef;font-family:Arial,sans-serif;color:#262019">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:white"><tr><td style="padding:28px;border-top:6px solid #999933">
<h1 style="color:#984C27;font-size:24px">Order received #<?php echo esc_html( $order->get_order_number() ); ?></h1>
<p>We have received your wholesale order.</p>
<h2 style="font-size:18px;color:#4C4C31 !important">Your order summary</h2>
<table width="100%" cellpadding="10" cellspacing="0" style="border-collapse:collapse;text-align:left;font-size:14px"><thead><tr style="background:#474618;color:white"><th>Product</th><th>Quantity</th><th>Price</th></tr></thead><tbody>
<?php foreach ( $order->get_items() as $item ) : ?>
<tr><td style="border-bottom:1px solid #ddd"><?php echo esc_html( $item->get_name() ); ?><br><small><?php $product = $item->get_product(); if ( $product ) echo 'SKU: ' . esc_html( $product->get_sku() ); ?></small></td><td style="border-bottom:1px solid #ddd"><?php echo (int) $item->get_quantity(); ?></td><td style="border-bottom:1px solid #ddd"><?php echo wp_kses_post( $order->get_formatted_line_subtotal( $item ) ); ?></td></tr>
<?php endforeach; ?>
</tbody></table><p><strong>Estimated total: <?php echo wp_kses_post( $order->get_formatted_order_total() ); ?></strong></p>
<h2 style="font-size:18px;color:#4C4C31 !important">What happens next?</h2><p style="line-height:1.7"><?php echo esc_html( $confirmation ); ?></p><ol style="line-height:1.7"><?php foreach ( $steps as $step ) echo '<li>' . esc_html( $step ) . '</li>'; ?></ol>
<p><strong>Payment method:</strong> <?php echo esc_html( $method ); ?></p>
<p style="margin-top:28px;color:#707026">Maya Herbs Wholesale</p>
</td></tr></table></td></tr></table></body></html>
