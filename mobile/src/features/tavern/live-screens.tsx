import React from "react";

import { Empty, Page } from "./ui";

function OfflineFeature({ title }: { title: string }) {
  return (
    <Page back title={title}>
      <Empty
        title="Feature temporarily unavailable"
        body="Database-backed functionality has been removed while the app is rebuilt."
      />
    </Page>
  );
}

export function DetailScreen() {
  return <OfflineFeature title="Bounty" />;
}

export function CreateScreen() {
  return <OfflineFeature title="Post a bounty" />;
}

export function MemberScreen() {
  return <OfflineFeature title="Member" />;
}

export function NotificationsScreen() {
  return <OfflineFeature title="Notifications" />;
}

export function ConversationScreen() {
  return <OfflineFeature title="Messages" />;
}
