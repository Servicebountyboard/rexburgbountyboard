import { Tabs, Redirect } from "expo-router";
import { useTavern } from "@/features/tavern/store";
import { C, Icon, IconName } from "@/features/tavern/ui";
export default function TabsLayout() {
  const { state, ready } = useTavern();
  if (ready && !state.currentId) return <Redirect href="/account" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.wax,
        tabBarInactiveTintColor: C.muted,
        tabBarStyle: {
          backgroundColor: C.paper,
          borderTopColor: C.line,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        sceneStyle: { backgroundColor: C.parchment },
      }}
    >
      {(
        [
          { name: "index", title: "Bounties", icon: "board" },
          { name: "explore", title: "People", icon: "people" },
          { name: "work", title: "My work", icon: "work" },
          { name: "messages", title: "Messages", icon: "message" },
          { name: "profile", title: "Profile", icon: "profile" },
        ] as { name: string; title: string; icon: IconName }[]
      ).map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color }) => (
              <Icon name={t.icon} color={String(color)} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
