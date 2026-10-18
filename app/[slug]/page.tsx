import { Metadata } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import VitrineClientView from './VitrineClientView';
import { Couturier, Realisation } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = params?.slug?.toLowerCase().trim();
  if (!slug || slug.includes('.')) {
    return { title: 'Atelier de Couture · Ourlette' };
  }

  try {
    const supabase = createServiceClient();
    if (!supabase) return { title: 'Atelier de Couture · Ourlette' };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
    let query = supabase.from('couturiers').select('nom_atelier, bio, cover_url, logo_url');
    if (isUuid) {
      query = query.or(`id.eq.${slug},slug_vitrine.ilike.${slug}`);
    } else {
      query = query.or(`slug_vitrine.ilike.${slug},id.eq.${slug}`);
    }

    const { data: couturier } = await query.limit(1).maybeSingle();

    const title = couturier?.nom_atelier
      ? `${couturier.nom_atelier} · Atelier de Couture`
      : 'Atelier de Couture · Ourlette';
    const description =
      couturier?.bio || 'Découvrez nos créations de couture sur-mesure et contactez l’atelier directement sur WhatsApp.';
    const image = couturier?.cover_url || couturier?.logo_url;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: image ? [{ url: image }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: image ? [image] : [],
      },
    };
  } catch {
    return { title: 'Atelier de Couture · Ourlette' };
  }
}

export default async function VitrinePubliquePage({ params }: PageProps) {
  const slug = params?.slug?.toLowerCase().trim();
  if (!slug || slug.includes('.')) {
    return <VitrineClientView couturier={null} realisations={[]} slug={slug || ''} />;
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return <VitrineClientView couturier={null} realisations={[]} slug={slug} />;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
  let query = supabase.from('couturiers').select('*');
  if (isUuid) {
    query = query.or(`id.eq.${slug},slug_vitrine.ilike.${slug}`);
  } else {
    query = query.or(`slug_vitrine.ilike.${slug},id.eq.${slug}`);
  }

  let { data: rawCouturier } = await query.limit(1).maybeSingle();

  if (!rawCouturier && slug.startsWith('atelier-')) {
    const stripped = slug.replace(/^atelier-/, '');
    const { data: alt } = await supabase
      .from('couturiers')
      .select('*')
      .or(`slug_vitrine.ilike.${stripped},id.ilike.${stripped}%`)
      .limit(1)
      .maybeSingle();
    if (alt) rawCouturier = alt;
  }

  if (!rawCouturier) {
    return <VitrineClientView couturier={null} realisations={[]} slug={slug} />;
  }

  const { data: rawRealisations } = await supabase
    .from('realisations')
    .select('*')
    .eq('couturier_id', rawCouturier.id)
    .order('date_publication', { ascending: false });

  // Sanitize data according to Invariant 3 (no private email, IP or tokens exposed)
  const sanitizedCouturier: Couturier = {
    id: rawCouturier.id,
    nom: rawCouturier.nom,
    nom_atelier: rawCouturier.nom_atelier || 'Atelier',
    slug_vitrine: rawCouturier.slug_vitrine || slug,
    bio: rawCouturier.bio || '',
    ville: rawCouturier.ville || '',
    pays: rawCouturier.pays || '',
    adresse_atelier: rawCouturier.adresse_atelier || '',
    logo_url: rawCouturier.logo_url || null,
    cover_url: rawCouturier.cover_url || null,
    vitrine_active: rawCouturier.vitrine_active ?? true,
    whatsapp_contact: rawCouturier.whatsapp_contact || rawCouturier.telephone || '',
    telephone: rawCouturier.telephone || rawCouturier.whatsapp_contact || '',
    plan: rawCouturier.plan || 'free',
  };

  const schemaOrgData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: sanitizedCouturier.nom_atelier,
    description: sanitizedCouturier.bio,
    address: {
      '@type': 'PostalAddress',
      addressLocality: sanitizedCouturier.ville,
      addressCountry: sanitizedCouturier.pays,
    },
    ...(sanitizedCouturier.logo_url ? { image: sanitizedCouturier.logo_url } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schemaOrgData).replace(/</g, '\\u003c'),
        }}
      />
      <VitrineClientView
        couturier={sanitizedCouturier}
        realisations={(rawRealisations || []) as Realisation[]}
        slug={slug}
      />
    </>
  );
}
