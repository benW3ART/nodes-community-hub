'use client';

import { Twitter, ExternalLink, Search, Users } from 'lucide-react';

interface QuickLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent?: boolean;
}

function QuickLink({ href, icon, title, description, accent }: QuickLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
        accent 
          ? 'bg-[#00D4FF]/10 border-[#00D4FF]/30 hover:border-[#00D4FF]/50' 
          : 'bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#00D4FF]/30'
      }`}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
        accent ? 'bg-[#00D4FF]/20' : 'bg-[#1a1a1a]'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white truncate">{title}</h3>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-600 flex-shrink-0" />
    </a>
  );
}

export function TwitterFeed() {
  return (
    <section className="mt-10 sm:mt-16">
      <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3 mb-6">
        <Twitter className="w-5 h-5 sm:w-6 sm:h-6 text-[#00D4FF]" />
        Follow on X
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Profiles */}
        <QuickLink
          href="https://x.com/NODESonBase"
          icon={<Twitter className="w-5 h-5 text-[#00D4FF]" />}
          title="@NODESonBase"
          description="Official NODES account"
          accent
        />
        <QuickLink
          href="https://x.com/gmhunterart"
          icon={<Twitter className="w-5 h-5 text-[#4FFFDF]" />}
          title="@gmhunterart"
          description="Creator of NODES"
          accent
        />
        
        {/* Search feeds */}
        <QuickLink
          href="https://x.com/search?q=%40NODESonBase&src=typed_query&f=live"
          icon={<Search className="w-5 h-5 text-gray-400" />}
          title="Mentions @NODESonBase"
          description="Latest tweets mentioning NODES"
        />
        <QuickLink
          href="https://x.com/search?q=%40gmhunterart%20OR%20%23NODES&src=typed_query&f=live"
          icon={<Users className="w-5 h-5 text-gray-400" />}
          title="Community Feed"
          description="@gmhunterart mentions & #NODES"
        />
      </div>
    </section>
  );
}
