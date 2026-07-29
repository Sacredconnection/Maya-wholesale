import { ShieldCheck } from 'lucide-react';
import EditorialPage, {
  EditorialContact,
  EditorialNotice,
  EditorialSection,
} from '@/components/EditorialPage';

export const metadata = {
  title: 'Privacy Policy | Maya Herbs Wholesale',
  description: 'Learn how Maya Herbs Wholesale collects, uses, protects, and shares personal information.',
  alternates: {
    canonical: '/privacy-policy',
  },
};

const navigation = [
  { id: 'scope', label: 'Scope of this policy' },
  { id: 'information-collected', label: 'Information we collect' },
  { id: 'how-we-use-information', label: 'How we use information' },
  { id: 'cookies', label: 'Cookies and sessions' },
  { id: 'sharing', label: 'When information is shared' },
  { id: 'retention-security', label: 'Retention and security' },
  { id: 'rights', label: 'Your privacy rights' },
  { id: 'international', label: 'International processing' },
  { id: 'updates', label: 'Policy updates' },
];

export default function PrivacyPolicyPage() {
  return (
    <EditorialPage
      eyebrow="Privacy and trust"
      title="Privacy Policy"
      description="This policy explains what personal information we handle, why we use it, and the choices available to you."
      icon={ShieldCheck}
      updated="July 18, 2026"
      navigation={navigation}
      bannerImage="/banners/editorial/privacy-policy-banner.webp"
      bannerPosition="center right"
    >
      <EditorialSection id="scope" number="01" title="Scope of this policy">
        <p>
          This Privacy Policy applies when you visit the Maya Herbs Wholesale website, create or use a wholesale account, contact us, request information, or place an order. In this policy, “we,” “us,” and “our” refer to Maya Herbs Wholesale.
        </p>
        <p>
          It does not govern the independent privacy practices of third-party websites or services that may be linked from our website. We encourage you to review their policies before providing information to them.
        </p>
      </EditorialSection>

      <EditorialSection id="information-collected" number="02" title="Information we collect">
        <p>Depending on how you interact with us, we may collect:</p>
        <ul>
          <li><strong>Contact and business details</strong>, such as your name, company, role, email address, telephone number, billing address, and delivery address.</li>
          <li><strong>Account information</strong>, including login details and information provided during wholesale registration.</li>
          <li><strong>Transaction information</strong>, such as ordered products, quantities, invoice details, payment status, shipment details, and order history.</li>
          <li><strong>Communications</strong>, including enquiries, support requests, preferences, and other messages you send to us.</li>
          <li><strong>Technical information</strong>, such as IP address, browser or device type, requested pages, timestamps, and security or diagnostic records generated when you use the website.</li>
        </ul>
        <EditorialNotice title="Payment information">
          <p>
            Payment details may be collected and processed directly by an authorized payment provider. We receive the information needed to confirm and manage the transaction, but we do not intentionally store complete payment-card numbers on this website.
          </p>
        </EditorialNotice>
      </EditorialSection>

      <EditorialSection id="how-we-use-information" number="03" title="How we use information">
        <p>We use personal information where reasonably necessary to:</p>
        <ul>
          <li>Review account applications and manage wholesale access.</li>
          <li>Confirm, fulfill, deliver, and provide support for orders.</li>
          <li>Respond to enquiries and communicate operational updates.</li>
          <li>Maintain website functionality, diagnose errors, and protect accounts and transactions.</li>
          <li>Maintain appropriate business, tax, accounting, fraud-prevention, and compliance records.</li>
          <li>Send marketing communications where you have requested them or where otherwise permitted by applicable law.</li>
          <li>Establish, exercise, or defend legal rights and comply with lawful obligations.</li>
        </ul>
        <p>
          The legal basis for processing depends on the circumstances and applicable law. It may include performing a contract, taking requested pre-contract steps, complying with legal duties, pursuing legitimate business interests, or relying on your consent.
        </p>
      </EditorialSection>

      <EditorialSection id="cookies" number="04" title="Cookies and sessions">
        <p>
          Our website uses essential technology to maintain secure account sessions and provide requested features. For example, a secure session cookie may remember that an approved user has signed in. Disabling essential cookies can prevent account or ordering features from working correctly.
        </p>
        <p>
          If optional analytics, advertising, or preference cookies are introduced, we will provide any notice and choices required by applicable law. You can also manage cookies through your browser settings, although those controls may affect website functionality.
        </p>
      </EditorialSection>

      <EditorialSection id="sharing" number="05" title="When information is shared">
        <p>We may share only the information reasonably needed with:</p>
        <ul>
          <li>Website hosting, infrastructure, ecommerce, security, and technical service providers.</li>
          <li>Payment processors, financial institutions, accountants, and fraud-prevention providers.</li>
          <li>Warehouses, suppliers, delivery carriers, customs brokers, and fulfillment partners involved in an order.</li>
          <li>Professional advisers, regulators, courts, law enforcement, or other parties when legally required or necessary to protect rights and safety.</li>
          <li>A successor or relevant counterparty in a legitimate merger, financing, restructuring, acquisition, or sale of business assets, subject to appropriate safeguards.</li>
        </ul>
        <p>
          We do not sell personal information for money. If an activity is legally treated as a “sale” or “sharing” in a particular jurisdiction, we will provide the notices and controls required there.
        </p>
      </EditorialSection>

      <EditorialSection id="retention-security" number="06" title="Retention and security">
        <p>
          We retain personal information only for as long as reasonably necessary for the purposes described in this policy, including order support, recordkeeping, dispute resolution, fraud prevention, and legal or accounting obligations. Retention periods vary according to the type of record and the law that applies.
        </p>
        <p>
          We use reasonable administrative and technical measures designed to protect information against unauthorized access, alteration, loss, or misuse. However, no internet transmission or storage system can be guaranteed completely secure. You are responsible for protecting your password and notifying us promptly if you suspect unauthorized account activity.
        </p>
      </EditorialSection>

      <EditorialSection id="rights" number="07" title="Your privacy rights">
        <p>
          Depending on your location, you may have the right to request access, correction, deletion, restriction, portability, or objection regarding your personal information. You may also be able to withdraw consent or appeal a decision about a privacy request.
        </p>
        <p>
          To protect your account, we may need to verify your identity before completing a request. Some information may be retained where permitted or required for legal, security, accounting, or contractual reasons. You may also have the right to contact your local data-protection authority.
        </p>
      </EditorialSection>

      <EditorialSection id="international" number="08" title="International processing">
        <p>
          Because wholesale operations and service providers may be located in different countries, information can be processed outside the country where you live. Where required, we use recognized safeguards or another lawful mechanism intended to protect information during international transfers.
        </p>
        <p>
          Our services are intended for business users and are not directed to children. We do not knowingly collect personal information from children through wholesale account registration.
        </p>
      </EditorialSection>

      <EditorialSection id="updates" number="09" title="Policy updates and contact">
        <p>
          We may update this policy when our practices, services, or legal obligations change. The “Last updated” date at the top identifies the current version. Material changes will be communicated through the website or another appropriate channel when required.
        </p>
        <EditorialContact>
          <p>
            For a privacy question or request, email <a href="mailto:info@mayaherbs.com">info@mayaherbs.com</a>. Please include enough detail for us to understand and respond to your request.
          </p>
        </EditorialContact>
      </EditorialSection>
    </EditorialPage>
  );
}
