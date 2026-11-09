import React from "react";

import { Body, Empty, Label, Page, Title } from "./ui";

export function BoardScreen() {
  return (
    <Page title="Bounty board">
      <Label>REXBURG BOUNTY BOARD</Label>
      <Title>A cleaner foundation is underway.</Title>
      <Body>
        The previous database implementation has been disconnected while the
        application is rebuilt.
      </Body>
      <Empty
        title="No connected data"
        body="Bounties will return after the new data model and workflows are ready."
      />
    </Page>
  );
}

export function PeopleScreen() {
  return <Page title="People"><Empty title="No connected profiles" body="Profile data is currently offline." /></Page>;
}

export function WorkScreen() {
  return <Page title="My work"><Empty title="No connected work" body="Service workflows are currently offline." /></Page>;
}

export function MessagesScreen() {
  return <Page title="Messages"><Empty title="No connected messages" body="Messaging is currently offline." /></Page>;
}

export function ProfileScreen() {
  return <Page title="Profile"><Empty title="No connected account" body="Authentication and profile data are currently offline." /></Page>;
}
