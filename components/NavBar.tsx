"use client";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";

import { AigreeLogo } from "./Icons";
// import { ThemeSwitch } from './ThemeSwitch';

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
          {/* <Link
            isExternal
            color="foreground"
            href="https://labs.heygen.com/interactive-avatar"
          >
            Avatars
          </Link>
          <Link
            isExternal
            color="foreground"
            href="https://docs.heygen.com/reference/list-voices-v2"
          >
            Voices
          </Link>
          <Link
            isExternal
            color="foreground"
            href="https://docs.heygen.com/reference/new-session-copy"
          >
            API Docs
          </Link>
          <Link
            isExternal
            color="foreground"
            href="https://help.heygen.com/en/articles/9182113-interactive-avatar-101-your-ultimate-guide"
          >
            Guide
          </Link>
          <Link
            isExternal
            aria-label="Github"
            href="https://github.com/HeyGen-Official/StreamingAvatarSDK"
            className="flex flex-row justify-center gap-1 text-foreground"
          >
            <GithubIcon className="text-default-500" />
            SDK
          </Link> */}
          {/* <ThemeSwitch /> */}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
