import type { Metadata } from 'next';
import { Github, BookOpen } from 'lucide-react';

/**
 * Home page for Swarm Tools - framework-agnostic primitives for agentic systems.
 * 
 * SEO Strategy (AI-Optimized Content):
 * - Single clear h1 defining the page topic
 * - Logical heading hierarchy (h1 > h2 > h3)
 * - Self-contained paragraphs (one idea per paragraph)
 * - Front-loaded answers (key info first)
 * - Structured data (JSON-LD SoftwareApplication schema)
 * - Explicit trust signals (author, source links)
 */

export const metadata: Metadata = {
	title: 'Swarm Tools - Multi-Agent Coordination Primitives',
	description: 'Event sourcing, multi-agent coordination, and durable execution patterns for AI coding assistants. TypeScript primitives.',
	alternates: {
		canonical: 'https://swarmtools.ai',
	},
};

const jsonLd = {
	'@context': 'https://schema.org',
	'@type': 'SoftwareApplication',
	name: 'Swarm Tools',
	alternateName: 'opencode-swarm-plugin',
	description: 'framework-agnostic primitives for agentic systems. Event sourcing, multi-agent coordination, and durable execution patterns for AI coding assistants.',
	applicationCategory: 'DeveloperApplication',
	applicationSubCategory: 'AI Development Tools',
	operatingSystem: 'Any',
	offers: {
		'@type': 'Offer',
		price: '0',
		priceCurrency: 'USD',
		availability: 'https://schema.org/InStock',
	},
	author: {
		'@type': 'Person',
		name: 'Joel Hooks',
		url: 'https://github.com/joelhooks',
		sameAs: [
			'https://twitter.com/jhooks',
			'https://github.com/joelhooks',
		],
	},
	maintainer: {
		'@type': 'Person',
		name: 'Joel Hooks',
		url: 'https://github.com/joelhooks',
	},
	url: 'https://swarmtools.ai',
	downloadUrl: 'https://github.com/joelhooks/opencode-swarm-plugin',
	installUrl: 'https://www.npmjs.com/package/opencode-swarm-plugin',
	codeRepository: 'https://github.com/joelhooks/opencode-swarm-plugin',
	programmingLanguage: 'TypeScript',
	runtimePlatform: 'Node.js',
	softwareVersion: '0.1.0',
	license: 'https://opensource.org/licenses/MIT',
	keywords: [
		'swarm',
		'multi-agent',
		'AI',
		'event sourcing',
		'coordination',
		'Effect-TS',
		'OpenCode',
		'agentic systems',
		'AI coding assistant',
		'durable execution',
	],
	featureList: [
		'Swarm Mail - Actor-model messaging for multi-agent coordination',
		'Event Sourcing - Append-only event log with projections',
		'File Reservations - Prevent edit conflicts between agents',
		'Semantic Memory - Persistent learning across sessions',
		'Effect-TS Integration - Type-safe, composable primitives',
	],
};

const organizationJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: 'Swarm Tools',
	url: 'https://swarmtools.ai',
	logo: 'https://swarmtools.ai/icon',
	sameAs: [
		'https://github.com/joelhooks/opencode-swarm-plugin',
	],
	founder: {
		'@type': 'Person',
		name: 'Joel Hooks',
	},
};

const features = [
	{
		emoji: '🐝',
		name: 'Swarm Mail',
		description: 'Actor-model messaging for multi-agent coordination with inbox, reservations, and acknowledgments.',
	},
	{
		emoji: '📦',
		name: 'Event Sourcing',
		description: 'Append-only event log with PGLite. Materialized views for agents, messages, and reservations.',
	},
	{
		emoji: '🔒',
		name: 'File Reservations',
		description: 'Prevent edit conflicts between parallel agents. Reserve files before editing, release when done.',
	},
	{
		emoji: '🧠',
		name: 'Semantic Memory',
		description: 'Persistent learning across sessions. Store discoveries, search by similarity, validate accuracy.',
	},
	{
		emoji: '⚡',
		name: 'Effect-TS',
		description: 'Type-safe, composable primitives. Durable mailbox, cursor, lock, and deferred patterns.',
	},
];

export default function Home() {
	return (
		<>
			{/* JSON-LD Structured Data - Server-side rendered for AI crawlers */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
			/>
			
			<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 px-4 py-16">
				{/* Hero Section */}
				<article className="max-w-4xl mx-auto text-center">
					<div className="relative">
						{/* Glow effect */}
						<div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 blur-3xl opacity-50" aria-hidden="true" />
						
						{/* ASCII Art - Decorative, hidden from screen readers */}
						<pre 
							className="relative font-mono text-[0.5rem] leading-tight sm:text-xs md:text-sm lg:text-base text-amber-500/90 select-none"
							aria-hidden="true"
						>
{`
   ███████╗██╗    ██╗ █████╗ ██████╗ ███╗   ███╗
   ██╔════╝██║    ██║██╔══██╗██╔══██╗████╗ ████║
   ███████╗██║ █╗ ██║███████║██████╔╝██╔████╔██║
   ╚════██║██║███╗██║██╔══██║██╔══██╗██║╚██╔╝██║
   ███████║╚███╔███╔╝██║  ██║██║  ██║██║ ╚═╝ ██║
   ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
                                                 
   ████████╗ ██████╗  ██████╗ ██╗     ███████╗   
   ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝   
      ██║   ██║   ██║██║   ██║██║     ███████╗   
      ██║   ██║   ██║██║   ██║██║     ╚════██║   
      ██║   ╚██████╔╝╚██████╔╝███████╗███████║   
      ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝   
`}
						</pre>
					</div>

					{/* Primary H1 - Single, clear topic definition */}
					<h1 className="sr-only">Swarm Tools: framework-agnostic primitives for agentic systems</h1>

					{/* Tagline - Front-loaded key message */}
					<p className="mt-8 text-lg sm:text-xl text-neutral-400 text-center max-w-xl mx-auto">
						🐝 framework-agnostic primitives for{' '}
						<span className="text-amber-500 font-semibold">agentic systems</span>
					</p>

					{/* Key takeaway - Explicit, scannable summary */}
					<p className="mt-4 text-sm text-neutral-500 text-center max-w-lg mx-auto">
						Event sourcing, multi-agent coordination, and durable execution patterns
						for AI coding assistants.
					</p>

					{/* CTA - Clear action */}
					<div className="mt-10 flex flex-wrap gap-4 justify-center items-center">
						<a
							href="https://github.com/joelhooks/opencode-swarm-plugin"
							target="_blank"
							rel="noopener noreferrer"
							className="group relative px-8 py-3 bg-amber-500 text-neutral-950 font-semibold rounded-lg overflow-hidden transition-all hover:bg-amber-400 hover:scale-105 inline-flex items-center gap-2"
						>
							<Github className="relative z-10 w-5 h-5" />
							<span className="relative z-10">View on GitHub</span>
							<div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
						</a>
						<a
							href="/docs"
							className="group relative px-8 py-3 bg-neutral-800 text-amber-500 font-semibold rounded-lg border-2 border-amber-500/30 overflow-hidden transition-all hover:border-amber-500 hover:scale-105 inline-flex items-center gap-2"
						>
							<BookOpen className="relative z-10 w-5 h-5" />
							<span className="relative z-10">Read Docs</span>
							<div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
						</a>
					</div>
				</article>

				{/* Features Section - Structured for scannability */}
				<section className="mt-20 max-w-4xl mx-auto" aria-labelledby="features-heading">
					<h2 id="features-heading" className="sr-only">Key Features</h2>
					
					{/* Feature list - Pre-chunked for AI extraction */}
					<ul className="flex flex-wrap justify-center gap-3">
						{features.map((feature) => (
							<li
								key={feature.name}
								className="px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-full text-sm text-neutral-400"
								title={feature.description}
							>
								<span aria-hidden="true">{feature.emoji}</span>{' '}
								{feature.name}
							</li>
						))}
					</ul>
				</section>

				{/* Trust Signals - Author attribution */}
				<footer className="mt-16 text-center text-neutral-600 text-xs">
					<p>
						Built by{' '}
						<a 
							href="https://github.com/joelhooks" 
							target="_blank" 
							rel="noopener noreferrer author"
							className="text-neutral-500 hover:text-amber-500 transition-colors"
						>
							Joel Hooks
						</a>
						{' '}• Open source under MIT License
					</p>
				</footer>

				{/* Decorative bees - Hidden from accessibility tree */}
				<div className="absolute top-20 left-10 text-4xl animate-bounce opacity-20" aria-hidden="true">
					🐝
				</div>
				<div className="absolute bottom-32 right-16 text-3xl animate-bounce opacity-20" aria-hidden="true" style={{ animationDelay: '500ms' }}>
					🐝
				</div>
				<div className="absolute top-40 right-24 text-2xl animate-bounce opacity-10" aria-hidden="true" style={{ animationDelay: '1000ms' }}>
					🐝
				</div>
			</main>
		</>
	);
}
