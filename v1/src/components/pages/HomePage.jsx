import React from 'react';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Domains } from '../sections/Domains';
import { Projects } from '../sections/Projects';
import { Community } from '../sections/Community';
import { Join } from '../sections/Join';

export function HomePage({ loaded, onNavigate, onOpenApply, onShowProgress }) {
  return (
    <div className="relative z-10">
      <Hero loaded={loaded} />
      <About />
      <Domains onExploreDomains={() => onNavigate('domains')} />
      <Projects onShowProgress={onShowProgress} />
      <Community onExploreTeam={() => onNavigate('team')} />
      <Join onOpenApply={onOpenApply} />
    </div>
  );
}
