export default function TermsOfService() {
  return (
    <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms of Service</h1>
      <p className="text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
      
      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using Posthi, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
      </p>

      <h2>2. User Content & Responsibilities</h2>
      <p>
        You are solely responsible for the content, media, and text you schedule and publish using Posthi. 
        You agree that you will not use Posthi to publish content that violates the terms of service of the target platforms, is illegal, abusive, or infringes on the rights of others.
      </p>

      <h2>3. Third-Party Platforms</h2>
      <p>
        Posthi integrates with third-party platforms such as X (formerly Twitter) and Meta (Instagram). 
        <strong>Posthi is not affiliated, endorsed, or sponsored by X, Instagram, or Meta.</strong>
      </p>
      <p>
        Your use of these integrations is subject to the respective platform&apos;s rules and guidelines. You must follow platform rules at all times.
      </p>

      <h2>4. Service Limitations</h2>
      <p>
        While we strive for high reliability, Posthi&apos;s ability to publish content is dependent on third-party APIs. 
        The service may experience failures, delays, or restrictions due to API rate limits, platform outages, or changes in third-party API policies. We are not liable for any missed publications resulting from these third-party issues.
      </p>

      <h2>5. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your access to the service if you violate these terms or the terms of our integrated partners.
      </p>

      <h2>6. Changes to Terms</h2>
      <p>
        We may modify these terms at any time. Continued use of the service constitutes acceptance of any changes.
      </p>

      <h2>7. Contact Us</h2>
      <p>If you have any questions about these Terms, please contact us at support@posthi.app.</p>
    </div>
  )
}
