import Link from 'next/link'
import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Finnoybu Press publishes practical guides to AI tools and governance toolkits — written by Ken Tannenbaum for the people actually using AI at work.',
}

export default function AboutPage() {
  return (
    <article className={styles.about}>
      <header className={`${styles.pageHero} container`}>
        <Link href="/" className={styles.breadcrumb}>← Home</Link>
        <span className="eyebrow">About</span>
        <h1>Finnoybu Press</h1>
        <p className="lede">
          We publish clear, practical books on the AI tools shaping how people work — and governance toolkits for the teams adopting them.
        </p>
      </header>

      <section className={`${styles.manifesto} container`}>
        <div className={styles.manifestoInner}>
          <span className="eyebrow">The Publisher&rsquo;s Note</span>
          <p className={styles.manifestoQuote}>
            Most writing about AI is either selling you the future or warning you about it.
            We wanted something else: <em>clear, practical books for the people who actually have to use these tools at work.</em>
          </p>
          <p className={styles.manifestoAttr}>— Ken Tannenbaum, founder</p>
        </div>
      </section>

      <section className={`section container ${styles.authorSection}`} id="author">
        <div className={styles.sectionHead}>
          <span className="eyebrow">The Author</span>
          <h2>Ken Tannenbaum.</h2>
        </div>

        <div className={styles.authorBlock}>
          <img
            className={styles.authorPhoto}
            src="/images/ken-tannenbaum.png"
            alt="Ken Tannenbaum"
            width={320}
            height={320}
            loading="lazy"
          />
          <div className={styles.authorBio}>
            <p className={styles.authorRole}>
              Founder, Finnoybu Press · Author of all twenty-one titles in the AI for Everyone series
            </p>
            <div className="prose">
              <p>
                Ken writes practical books on the AI tools shaping today&rsquo;s work — and builds governance frameworks for the small and midsize businesses adopting them. He founded Finnoybu Press in 2026 to publish the kind of clear, useful AI writing he wished existed when he started the work.
              </p>
              <p>
                He also founded the AEGIS Initiative, an open framework for AI safety and accountability used by SMBs adopting AI without an in-house governance team. The Finnoybu Press AEGIS Toolkits — Starter, Standard, and Pro — translate AEGIS into ready-to-use templates, policies, and operating procedures.
              </p>
              <p>
                Before Finnoybu Press, Ken spent two decades building software and leading technology teams across financial services, healthcare, and B2B SaaS. The pattern he kept seeing — capable people drowning in unclear documentation — is what the press exists to fix.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={`section container ${styles.thesisSection}`} id="series-thesis">
        <div className={styles.sectionHead}>
          <span className="eyebrow">About the Series</span>
          <h2>Twenty-one books. One thesis.</h2>
        </div>
        <div className="prose">
          <p>The AI for Everyone series began with a simple observation: most teams using AI today have no shared baseline for what these tools are, what they can do, or where they end. The books that exist are either hype, panic, or dense academic work — none of them what you&rsquo;d hand to a coworker on Monday morning.</p>
          <p>Each book in the series is written to be useful on day one and to serve as a reference you come back to. Whether you&rsquo;re opening ChatGPT for the first time or building enterprise workflows with Copilot, the goal is the same: clear writing that helps you get real work done.</p>
          <p>The thread running through all twenty-one titles is that AI tooling is genuinely useful, genuinely limited, and genuinely worth learning — and that none of those statements requires turning the volume up to eleven.</p>
        </div>
      </section>

      <section className={`section container ${styles.contactSection}`} id="contact">
        <div className={styles.sectionHead}>
          <span className="eyebrow">Get in touch</span>
          <h2>Contact.</h2>
        </div>
        <div className="prose">
          <p>
            For press, partnership, or bulk-licensing inquiries:{' '}
            <a href="mailto:ktannenbaum@finnoybu.org">ktannenbaum@finnoybu.org</a>
          </p>
          <p>For questions about a specific book, mention the title in the subject line.</p>
        </div>
      </section>
    </article>
  )
}
