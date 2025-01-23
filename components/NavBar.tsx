'use client';

import { Link, Navbar, NavbarBrand, NavbarContent, NavbarItem } from '@nextui-org/react';

import { AigreeLogo } from './Icons';
import LanguageSwitch from './LanguageSwitch';

export default function NavBar() {
  return (
    <Navbar className="w-full">
      <NavbarBrand>
        <Link isExternal aria-label="Aigree" href="">
          <AigreeLogo />
        </Link>
      </NavbarBrand>
      <NavbarContent justify="center">
        <NavbarItem className="flex flex-row items-center gap-4">
          <LanguageSwitch />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
