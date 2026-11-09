import React from "react";

import { Body, Page, Title } from "@/features/tavern/ui";

export default function AuthCallback() {
  return (
    <Page back title="Account">
      <Title>Authentication is offline.</Title>
      <Body>This callback route is reserved for the future account system.</Body>
    </Page>
  );
}
