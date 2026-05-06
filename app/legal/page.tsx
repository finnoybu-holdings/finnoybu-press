import type { Metadata } from 'next'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Legal',
  description: 'Terms, privacy policy, and cookie policy for press.finnoybu.org.',
}

const LAST_UPDATED = 'May 5, 2026'

export default function LegalPage() {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.narrow}`}>
        <p className={styles.eyebrow}>Legal</p>
        <h1>Terms &amp; Policies</h1>
        <p className={styles.lastUpdated}>Last updated: {LAST_UPDATED}</p>

        <nav className={styles.toc}>
          <p className={styles.tocEyebrow}>On this page</p>
          <ul>
            <li><a href="#copyright">Copyright</a></li>
            <li><a href="#terms-of-use">Terms of Use</a></li>
            <li><a href="#privacy-policy">Privacy Policy</a></li>
            <li><a href="#cookie-policy">Cookie Policy</a></li>
            <li><a href="#data-deletion">Data Deletion</a></li>
            <li><a href="#acceptable-use">Acceptable Use</a></li>
            <li><a href="#dmca">DMCA &amp; Takedown</a></li>
            <li><a href="#impressum">Impressum</a></li>
          </ul>
        </nav>

        <div className={`prose ${styles.prose}`}>
          <section id="copyright">
            <h2>Copyright</h2>
            <p>
              © 2026 Finnoybu Press. All rights reserved. The text of every book published by
              Finnoybu Press, the AEGIS Toolkits, and all accompanying illustrations and cover
              designs are the property of Finnoybu Press and may not be reproduced, distributed,
              or transmitted in any form without prior written permission.
            </p>
            <p>
              Product names referenced in our books (ChatGPT, Claude, Gemini, Copilot, Perplexity,
              NotebookLM, DeepSeek, Cursor, OpenClaw, etc.) are trademarks of their respective owners.
              Use of these names is for editorial and educational purposes and does not imply endorsement.
            </p>
          </section>

          <section id="terms-of-use">
            <h2>Terms of Use</h2>
            <p>
              By accessing <strong>press.finnoybu.org</strong> (&ldquo;the Site&rdquo;), operated by
              Finnoybu Press (&ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;), you agree to be
              bound by these Terms of Use. If you do not agree, please do not use the Site. We may
              update these terms at any time by posting a revised version; your continued use after
              changes constitutes acceptance.
            </p>
            <h3>Accounts</h3>
            <p>
              You may create an account using email and password or through a supported third-party
              provider (Google, Apple, GitHub, or Facebook). You are responsible for maintaining the
              confidentiality of your credentials and for all activity under your account. Accounts
              are for personal, non-commercial use only. You must be at least 13 years of age to
              create an account.
            </p>
            <h3>Purchases</h3>
            <p>
              Digital downloads (PDF/ePub) are processed through Stripe. All sales are final. If you
              experience a technical issue with your purchase, contact us at{' '}
              <a href="mailto:ktannenbaum@finnoybu.org">ktannenbaum@finnoybu.org</a> and we will work
              to resolve it.
            </p>
            <h3>Termination</h3>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms or the
              Acceptable Use policy. You may delete your account at any time (see{' '}
              <a href="#data-deletion">Data Deletion</a>).
            </p>
            <h3>Limitation of liability</h3>
            <p>
              The Site is provided &ldquo;as is.&rdquo; To the fullest extent permitted by law,
              Finnoybu Press shall not be liable for any indirect, incidental, or consequential
              damages arising from your use of the Site.
            </p>
            <h3>Governing law</h3>
            <p>
              These terms are governed by the laws of the Commonwealth of Virginia, United States,
              without regard to conflict-of-law principles.
            </p>
          </section>

          <section id="privacy-policy">
            <h2>Privacy Policy</h2>
            <p>
              Finnoybu Press operates <strong>press.finnoybu.org</strong>. This Privacy Policy
              explains what data we collect, how we use it, and your rights regarding that data.
            </p>
            <h3>What we collect</h3>
            <h4>Account information</h4>
            <p>
              When you create an account, we collect your <strong>email address</strong> and, if you
              sign in with a third-party provider, your <strong>name</strong> and{' '}
              <strong>profile picture</strong> as provided by that service. If you create an account
              with email and password, we store a securely hashed version of your password — we
              never store passwords in plain text.
            </p>
            <h4>Library and purchase information</h4>
            <p>
              When you purchase a digital download, we record the <strong>book or toolkit purchased</strong>,{' '}
              <strong>amount paid</strong>, <strong>currency</strong>, and a{' '}
              <strong>Stripe session identifier</strong>. We do not receive or store your payment
              card details — those are handled entirely by Stripe.
            </p>
            <h4>Automatically collected data</h4>
            <p>
              We use <strong>Vercel Web Analytics</strong> to collect anonymous, aggregated page-view
              data including page URL, referrer, browser type, and country. This data is not linked
              to individual users and no cookies are set for this purpose.
            </p>
            <h4>Browser storage</h4>
            <p>
              We store your <strong>cart contents</strong> and{' '}
              <strong>cookie-consent status</strong> in your browser&rsquo;s local storage. This data
              never leaves your device unless you sign in and complete a purchase.
            </p>
            <h3>How we use your data</h3>
            <ul>
              <li>To provide and maintain your account and library access</li>
              <li>To process purchases and deliver digital downloads</li>
              <li>To send transactional emails (account verification, password reset, purchase receipts)</li>
              <li>To understand how readers use the Site in aggregate (anonymous analytics)</li>
            </ul>
            <p>
              We do <strong>not</strong> sell, rent, or share your personal data with third parties
              for advertising or marketing purposes. We do <strong>not</strong> send marketing or
              promotional emails.
            </p>
            <h3>Third-party services</h3>
            <p>We share data with the following services, solely to operate the Site:</p>
            <ul>
              <li>
                <strong>Supabase</strong> (authentication and database) — stores your account
                information and purchase records, and sends transactional emails on our behalf.{' '}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase Privacy Policy</a>
              </li>
              <li>
                <strong>Stripe</strong> (payment processing) — receives your email address and
                processes payment card details directly.{' '}
                <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a>
              </li>
              <li>
                <strong>Google / Apple / GitHub / Meta</strong> (OAuth sign-in) — if you sign in
                with one of these providers, we receive your email, name, and profile picture from
                that provider.
              </li>
              <li>
                <strong>Vercel</strong> (hosting and analytics) — hosts the Site and collects
                anonymous page-view analytics.{' '}
                <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a>
              </li>
              <li>
                <strong>Amazon (KDP)</strong> — Kindle and paperback editions are fulfilled by Amazon.
                Purchases made on Amazon are subject to Amazon&rsquo;s own terms and privacy policy;
                we do not receive your Amazon account data.
              </li>
            </ul>
            <h3>Data retention</h3>
            <p>
              We retain your account data for as long as your account is active. Purchase records
              are retained indefinitely for tax and accounting purposes. If you delete your account,
              all personal data is removed except purchase records, which are anonymized.
            </p>
            <h3>Your rights</h3>
            <p>
              You have the right to access, correct, delete, or export your personal data, and to
              withdraw consent for OAuth-provider access at any time. For GDPR (EEA) and CCPA
              (California) inquiries, contact{' '}
              <a href="mailto:ktannenbaum@finnoybu.org">ktannenbaum@finnoybu.org</a>.
            </p>
            <h3>Children&rsquo;s privacy</h3>
            <p>
              The Site is not directed at children under 13. We do not knowingly collect personal
              data from children under 13.
            </p>
          </section>

          <section id="cookie-policy">
            <h2>Cookie Policy</h2>
            <p>
              This site uses cookies and browser local storage to provide and improve the experience.
              Below is a summary of what we store and why.
            </p>
            <h3>Essential (always active)</h3>
            <ul>
              <li>
                <strong>Authentication cookies</strong> — set by our authentication provider (Supabase)
                to keep you signed in across pages and sessions.
              </li>
              <li>
                <strong>Local storage</strong> — your cart contents and cookie-consent acknowledgement
                are stored in your browser so they persist between visits.
              </li>
            </ul>
            <h3>Analytics (non-identifying)</h3>
            <ul>
              <li>
                <strong>Vercel Web Analytics</strong> — collects anonymous, aggregated page-view data
                (page URL, referrer, browser, country). No cookies are set; data is not linked to
                individual users.
              </li>
            </ul>
            <p>
              We do not use cookies for advertising, retargeting, or cross-site tracking. If our use
              of cookies changes, this policy will be updated and the &ldquo;last updated&rdquo; date
              at the top of this page will reflect the change.
            </p>
          </section>

          <section id="data-deletion">
            <h2>Data Deletion</h2>
            <p>
              You can delete your account at any time from your account settings page. This will
              remove your user account, authentication credentials, and any associated personal data.
              Purchase records are anonymized rather than deleted (retaining only transaction amount
              and date for accounting purposes).
            </p>
            <p>
              If you are unable to sign in or prefer to request deletion by email, contact{' '}
              <a href="mailto:ktannenbaum@finnoybu.org">ktannenbaum@finnoybu.org</a> with the subject
              line &ldquo;Delete my account&rdquo; from the email address associated with your account.
              We will process the request within 30 days.
            </p>
            <p>Data deletion is permanent and cannot be reversed.</p>
          </section>

          <section id="acceptable-use">
            <h2>Acceptable Use</h2>
            <p>When using the Site, you agree not to:</p>
            <ul>
              <li>Copy, reproduce, distribute, or publicly display book content or toolkit content without prior written permission from Finnoybu Press.</li>
              <li>Use automated tools (bots, scrapers, crawlers) to access the Site or download content in bulk.</li>
              <li>Attempt to gain unauthorized access to other users&rsquo; accounts or data.</li>
              <li>Interfere with the operation of the Site, including introducing malware or overloading the server with excessive requests.</li>
              <li>Use the Site for any unlawful purpose.</li>
            </ul>
          </section>

          <section id="dmca">
            <h2>DMCA &amp; Takedown</h2>
            <p>
              If you believe content on this site infringes your copyright, send a written notice to{' '}
              <a href="mailto:ktannenbaum@finnoybu.org">ktannenbaum@finnoybu.org</a> including:
              identification of the copyrighted work, the infringing URL, your contact information,
              and a statement of good-faith belief.
            </p>
          </section>

          <section id="impressum">
            <h2>Impressum</h2>
            <p><strong>Publisher:</strong> Finnoybu Press, an imprint of Finnoybu Holdings LLC</p>
            <p><strong>Responsible person:</strong> Ken Tannenbaum</p>
            <p><strong>Contact:</strong> <a href="mailto:ktannenbaum@finnoybu.org">ktannenbaum@finnoybu.org</a></p>
          </section>
        </div>
      </div>
    </article>
  )
}
