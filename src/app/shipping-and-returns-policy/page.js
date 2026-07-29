import { PackageCheck } from 'lucide-react';
import EditorialPage, {
  EditorialContact,
  EditorialNotice,
  EditorialSection,
} from '@/components/EditorialPage';

export const metadata = {
  title: 'Shipping & Returns Policy | Maya Herbs Wholesale',
  description: 'Review shipping, delivery, inspection, return, and claim guidelines for Maya Herbs Wholesale orders.',
  alternates: {
    canonical: '/shipping-and-returns-policy',
  },
};

const navigation = [
  { id: 'order-processing', label: 'Order processing' },
  { id: 'shipping-delivery', label: 'Shipping and delivery' },
  { id: 'international-orders', label: 'International orders' },
  { id: 'inspection-claims', label: 'Inspection and claims' },
  { id: 'returns', label: 'Returns' },
  { id: 'cancellations', label: 'Changes and cancellations' },
];

export default function ShippingAndReturnsPolicyPage() {
  return (
    <EditorialPage
      eyebrow="Customer care"
      title="Shipping & Returns Policy"
      description="A clear guide to how wholesale orders are prepared, shipped, inspected and, when eligible, returned."
      icon={PackageCheck}
      updated="July 18, 2026"
      navigation={navigation}
      bannerImage="/banners/editorial/shipping-returns-banner.webp"
      bannerPosition="center right"
    >
      <EditorialNotice title="Wholesale orders">
        <p>
          This policy applies to purchases made through Maya Herbs Wholesale. Specific terms shown in an accepted quote, invoice, or written order confirmation take precedence where they differ from this general policy.
        </p>
      </EditorialNotice>

      <EditorialSection id="order-processing" number="01" title="Order processing">
        <p>
          Orders are reviewed for product availability, account eligibility, delivery details, and payment status before fulfillment begins. An order is considered accepted only after we issue a written confirmation or paid invoice.
        </p>
        <p>
          Estimated processing times may vary according to order size, product availability, seasonal demand, and the handling requirements of individual items. Any known lead time will be communicated during confirmation. Business days exclude weekends and applicable public holidays.
        </p>
      </EditorialSection>

      <EditorialSection id="shipping-delivery" number="02" title="Shipping and delivery">
        <p>
          Available shipping methods and charges are calculated or quoted according to the destination, parcel dimensions, weight, and service level. Unless explicitly stated otherwise, shipping fees are the responsibility of the buyer.
        </p>
        <ul>
          <li>Delivery dates are estimates and are not guaranteed unless a guaranteed service is agreed in writing.</li>
          <li>Tracking details are provided when supported by the selected carrier.</li>
          <li>The buyer is responsible for providing a complete and accurate delivery address.</li>
          <li>Additional carrier costs caused by an incorrect address, refusal, or unsuccessful delivery may be charged to the buyer.</li>
        </ul>
        <p>
          Risk of loss or damage transfers according to the shipping terms stated in the order confirmation and any mandatory rights under applicable law.
        </p>
      </EditorialSection>

      <EditorialSection id="international-orders" number="03" title="International orders">
        <p>
          International shipments may be subject to customs review, import restrictions, duties, taxes, brokerage fees, and local handling charges. Unless an order confirmation says otherwise, these costs are not included in product or shipping prices and are the buyer&apos;s responsibility.
        </p>
        <p>
          Buyers are responsible for confirming that ordered products may be lawfully imported, possessed, and resold in their destination. Customs delays are outside our direct control, but we will provide available shipment documents and reasonable assistance when requested.
        </p>
      </EditorialSection>

      <EditorialSection id="inspection-claims" number="04" title="Inspection and claims">
        <p>
          Please inspect every shipment promptly after delivery. Keep the original packaging, shipping label, packing materials, and affected products while a claim is under review.
        </p>
        <p>
          Visible damage, shortages, or incorrect items should be reported within five business days of delivery. Include the order number, item names and quantities, a description of the issue, and clear photographs of both the products and packaging. This information helps us assess the claim and, where appropriate, work with the carrier.
        </p>
        <EditorialNotice title="Important">
          <p>
            Do not discard damaged goods or packaging and do not return an item before receiving written instructions from our team. An unauthorized return may not be accepted.
          </p>
        </EditorialNotice>
      </EditorialSection>

      <EditorialSection id="returns" number="05" title="Returns">
        <p>
          Because our transactions are business-to-business, returns are accepted only with prior written authorization. Eligible unopened and resaleable items may be requested for return within fourteen calendar days of delivery, unless the order confirmation establishes different terms.
        </p>
        <p>For hygiene, safety, quality, and traceability reasons, we generally cannot accept:</p>
        <ul>
          <li>Opened, used, altered, relabeled, or partially consumed products.</li>
          <li>Custom, made-to-order, clearance, final-sale, or discontinued items.</li>
          <li>Products damaged by improper storage, handling, or transport after delivery.</li>
          <li>Returns requested outside the applicable notice period.</li>
        </ul>
        <p>
          When a discretionary return is approved, the buyer is normally responsible for secure return packaging and tracked shipping. Original shipping charges are non-refundable, and a reasonable restocking fee may apply if disclosed before authorization. Approved refunds or account credits are issued after the returned goods have been received and inspected.
        </p>
        <p>
          Nothing in this policy limits any non-excludable right or remedy available under applicable law.
        </p>
      </EditorialSection>

      <EditorialSection id="cancellations" number="06" title="Changes and cancellations">
        <p>
          Contact us as soon as possible if an order needs to be changed or cancelled. We will try to accommodate the request, but changes cannot be guaranteed after payment, allocation, preparation, or shipment has begun. Costs already incurred for custom work, special sourcing, packaging, or carrier services may remain payable.
        </p>
        <EditorialContact>
          <p>
            For shipping assistance or a return request, email <a href="mailto:info@mayaherbs.com">info@mayaherbs.com</a> with your company name and order number.
          </p>
        </EditorialContact>
      </EditorialSection>
    </EditorialPage>
  );
}
