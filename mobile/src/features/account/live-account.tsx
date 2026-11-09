import React from "react";

import { Body, Label, Page, Title } from "../tavern/ui";

export default function AccountScreen() {
  return (
    <Page back title="Account">
      <Label>ACCOUNT SYSTEM OFFLINE</Label>
      <Title>Authentication is being rebuilt.</Title>
      <Body>
        Sign-in, registration, password recovery, and account persistence have
        been intentionally disconnected.
      </Body>
    </Page>
  );
}
