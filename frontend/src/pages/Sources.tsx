import { useQuery } from '@tanstack/react-query';
import Skeleton from '../components/Skeleton';
import { apiGet } from '../lib/api';

// Wireframe 11. The Bible translations section carries the full citation that
// API.Bible's Acceptable Use requires for each copyrighted translation.
interface Translation {
  code: string;
  name: string;
  source: 'local' | 'api_bible';
  license: string;
  translated_from: string | null;
  copyright_notice: string | null;
  citation: string | null;
}

export default function Sources() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['translations'],
    queryFn: () => apiGet<Translation[]>('/translations'),
    staleTime: 24 * 60 * 60 * 1000,
  });

  return (
    <main style={{ maxWidth: 960 }}>
      <h1>Sources and APIs</h1>
      <p className="lead">Every text, dataset, and service behind the site, with its license.</p>

      <section style={{ marginTop: 40 }}>
        <h2>Bible translations</h2>
        <p>
          Copyrighted translations are provided by <a href="https://api.bible">API.Bible</a> and shown exactly
          as supplied, without changes.
        </p>
        {isPending && <Skeleton height={120} />}
        {isError && <p>The list of translations couldn’t be loaded. Please try again later.</p>}
        {data?.map((t) => (
          <article key={t.code} className="card" style={{ marginTop: 16 }}>
            <h3 style={{ margin: '0 0 6px' }}>
              {t.name} ({t.code})
            </h3>
            <p style={{ margin: 0 }}>
              {t.license}
              {t.translated_from ? `. Translated from ${t.translated_from}.` : '.'}
            </p>
            {t.citation && <p style={{ margin: '10px 0 0', fontSize: 15 }}>{t.citation}</p>}
            {!t.citation && t.copyright_notice && <p style={{ margin: '10px 0 0', fontSize: 15 }}>{t.copyright_notice}</p>}
          </article>
        ))}
      </section>

      <p className="todo" style={{ marginTop: 32 }}>
        To build: the rest of this page (datasets, maps, services) from wireframe 11.
      </p>
    </main>
  );
}
