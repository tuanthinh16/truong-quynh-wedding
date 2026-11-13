"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, type ComponentProps } from "react";
import { invitationHref, normalizeGuestName } from "@/lib/guest-invitation";
import { editable, useWedding } from "./wedding-content";
import "./guest-personalization.css";

type GuestMessageProps = { thanks?: boolean; name?: string };

function GuestMessage({ thanks = false, name = "" }: GuestMessageProps) {
  const copy = useWedding().content.personalization;
  return thanks ? <p className="guest-thanks" {...editable("content", "personalization", name ? "thankYou" : "genericThanks")}>{name ? copy.thankYou.replaceAll("{name}", name) : copy.genericThanks}</p> : <div className="guest-dedication"><span {...editable("content", "personalization", "inviteLabel")}>{copy.inviteLabel}</span><p {...(!name ? editable("content", "personalization", "fallbackName") : {})}>{name || copy.fallbackName}</p></div>;
}

function NamedGuestMessage(props: Omit<GuestMessageProps, "name">) {
  const params = useSearchParams();
  return <GuestMessage {...props} name={normalizeGuestName(params.get("name"))} />;
}

export function GuestDedication(props: Omit<GuestMessageProps, "name">) {
  return <Suspense fallback={<GuestMessage {...props} />}><NamedGuestMessage {...props} /></Suspense>;
}

type InvitationLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

function NamedInvitationLink({ href, ...props }: InvitationLinkProps) {
  const params = useSearchParams();
  return <Link {...props} href={invitationHref(href, params.get("name"))} />;
}

export function PersonalizedInvitationLink(props: InvitationLinkProps) {
  return <Suspense fallback={<Link {...props} />}><NamedInvitationLink {...props} /></Suspense>;
}
