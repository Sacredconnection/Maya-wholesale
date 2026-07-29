import { Compass, HandHeart, Leaf, Network } from 'lucide-react';
import EditorialPage, {
  EditorialContact,
  EditorialNotice,
  EditorialSection,
} from '@/components/EditorialPage';

export const metadata = {
  title: 'About | Maya Herbs Wholesale',
  description: 'Discover the purpose, values, and partnership approach behind Maya Herbs Wholesale.',
  alternates: {
    canonical: '/about',
  },
};

const navigation = [
  { id: 'our-story', label: 'Our story' },
  { id: 'what-guides-us', label: 'What guides us' },
  { id: 'two-hubs', label: 'Two connected hubs' },
  { id: 'wholesale-partnerships', label: 'Wholesale partnerships' },
];

const values = [
  {
    icon: HandHeart,
    title: 'Respectful relationships',
    text: 'We value long-term relationships built through clear communication, mutual respect, and responsible commercial practices.',
  },
  {
    icon: Leaf,
    title: 'Thoughtful sourcing',
    text: 'We aim to understand origin, handling, and quality so our wholesale partners can make informed purchasing decisions.',
  },
  {
    icon: Network,
    title: 'Shared growth',
    text: 'We believe meaningful growth is collaborative, supporting suppliers, retailers, practitioners, and the communities they serve.',
  },
];

export default function AboutPage() {
  return (
    <EditorialPage
      eyebrow="Our story"
      title="A bridge between plants, people and professional buyers."
      description="Maya has worked with ethnobotanical plants and traditional preparations since 2000, connecting a global supply network with retailers and practitioners who value authenticity and origin."
      icon={Compass}
      navigation={navigation}
      bannerImage="/banners/editorial/about-banner.webp"
      bannerPosition="center right"
    >
      <EditorialSection id="our-story" number="01" title="Our story">
        <p>
          Founded in 2000, Maya was among the early online specialists making
          ethnobotanical plants and traditional tools accessible to an
          international audience. More than two decades of work have built
          long-standing relationships with communities, farmers, artisans and
          wildcrafters across several continents.
        </p>
        <p>
          In 2022, Maya joined forces with Sacred Connection in Brazil,
          deepening its direct relationships with Amazonian producers and
          Indigenous Rapéh partners. Today the wholesale program brings that
          experience together with European logistics, quality control and
          product development.
        </p>
        <EditorialNotice title="A living commitment">
          <p>
            Our standards continue to evolve through practical work with
            suppliers, professional buyers and the communities connected to
            our catalog.
          </p>
        </EditorialNotice>
      </EditorialSection>

      <EditorialSection id="what-guides-us" number="02" title="What guides us">
        <p>
          Our decisions are shaped by respect, traceability, honest communication, and a commitment to doing business with care. These principles guide how we evaluate opportunities and maintain relationships.
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {values.map(({ icon: ValueIcon, title, text }) => (
            <div key={title} className="editorial-value-card rounded-lg border border-white/10 bg-[#131313] p-5">
              <ValueIcon className="mb-5 h-5 w-5 text-[#d8c58f]" aria-hidden="true" />
              <h3 className="mb-3 font-headline text-lg font-semibold leading-snug text-white">{title}</h3>
              <p className="text-sm leading-7 text-white/55">{text}</p>
            </div>
          ))}
        </div>
      </EditorialSection>

      <EditorialSection id="two-hubs" number="03" title="Two connected hubs">
        <p>
          Our Haarlem headquarters is Maya&apos;s logistics, customer support
          and wholesale distribution base for Europe and beyond. It is where
          we coordinate professional accounts, fulfillment, product
          development and collaboration with European partners.
        </p>
        <p>
          In Nova Friburgo, Brazil, our sourcing and production network works
          close to the forest and coordinates relationships with tribes,
          communities and local initiatives. Together, the two hubs connect
          origin, handling and reliable international supply.
        </p>
      </EditorialSection>

      <EditorialSection id="wholesale-partnerships" number="04" title="Wholesale partnerships">
        <p>
          Our wholesale program is designed for retailers, practitioners,
          distributors and aligned organizations. Approved partners receive
          access to live availability, trade pricing, ordering tools and
          support suited to their business.
        </p>
        <p>
          Every partnership begins with understanding. Tell us about your store, your customers, and what you hope to offer; we will help you explore whether our collections are the right fit.
        </p>
        <EditorialContact>
          <p>
            Interested in working together? Visit our <a href="/register">wholesale registration page</a> or email <a href="mailto:info@mayaherbs.com">info@mayaherbs.com</a>.
          </p>
        </EditorialContact>
      </EditorialSection>
    </EditorialPage>
  );
}
