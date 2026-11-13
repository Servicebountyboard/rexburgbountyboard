import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppHeader } from "./ui";
import { previewRepository } from "../data/previewRepository";
import type { AppColors } from "../theme";

type ChatFilter = "Friends" | "Bounties";
type Message = { id: string; text: string; mine: boolean; time: string };
const conversations = previewRepository.listConversations();

export function ChatScreen({ colors, onProfile }: { colors: AppColors; onProfile: () => void }) {
  const [filter, setFilter] = useState<ChatFilter>("Friends");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const selected = conversations.find((item) => item.name === selectedName) ?? null;

  const sendMessage = () => {
    const text = draft.trim();
    if (!selected || !text) return;
    const message: Message = { id: `${Date.now()}`, text, mine: true, time: "now" };
    setMessages((current) => ({ ...current, [selected.name]: [...(current[selected.name] ?? []), message] }));
    setDraft("");
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <AppHeader
      colors={colors}
      title={selected?.name ?? "Bounty Board"}
      subtitle={selected ? `${selected.kind} conversation · demo` : "Your conversations · demo data"}
      onBack={selected ? () => setSelectedName(null) : undefined}
      onProfile={onProfile}
    />

    {selected ? <KeyboardAvoidingView style={styles.thread} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.messageList} keyboardShouldPersistTaps="handled">
        <Text style={[styles.threadNote, { color: colors.muted }]}>Preview messages · stored only on this screen</Text>
        <View style={[styles.bubble, styles.incoming, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={{ color: colors.text, lineHeight: 21 }}>{selected.preview.replace(/…$/, "")}</Text>
          <Text style={[styles.messageTime, { color: colors.muted }]}>{selected.time}</Text>
        </View>
        {(messages[selected.name] ?? []).map((message) => <View key={message.id} style={[styles.bubble, message.mine ? styles.outgoing : styles.incoming, { backgroundColor: message.mine ? colors.accentSoft : colors.surface, borderColor: message.mine ? colors.accent : colors.line }]}>
          <Text style={{ color: colors.text, lineHeight: 21 }}>{message.text}</Text>
          <Text style={[styles.messageTime, { color: colors.muted }]}>{message.time}</Text>
        </View>)}
      </ScrollView>
      <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <TextInput
          accessibilityLabel="Type a message"
          placeholder="Type a message…"
          placeholderTextColor={colors.muted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={!draft.trim()} onPress={sendMessage} style={[styles.sendButton, { backgroundColor: draft.trim() ? colors.accent : colors.surfaceAlt, opacity: draft.trim() ? 1 : 0.65 }]}>
          <Text style={{ color: colors.text, fontWeight: "800" }}>↑</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView> : <>
      <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {(["Friends", "Bounties"] as const).map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.segmentTab, { borderColor: filter === item ? colors.accent : "transparent", backgroundColor: filter === item ? colors.accentSoft : "transparent" }]}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>{item === "Friends" ? "▣" : "✦"}  {item}</Text>
        </Pressable>)}
      </View>
      <ScrollView contentContainerStyle={styles.conversationList}>
        {conversations.filter((conversation) => conversation.kind === filter).map((conversation) => <Pressable key={conversation.name} accessibilityRole="button" accessibilityLabel={`Open conversation with ${conversation.name}`} onPress={() => setSelectedName(conversation.name)} style={({ pressed }) => [styles.conversationRow, { backgroundColor: colors.surface, borderColor: colors.line, opacity: pressed ? 0.8 : 1 }]}>
          <View style={[styles.initials, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: "700" }}>{conversation.initials}</Text>
            <View style={[styles.presence, { backgroundColor: conversation.online ? colors.success : colors.muted }]} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <View style={styles.rowBetween}><Text style={[styles.conversationName, { color: colors.text }]}>{conversation.name}</Text><Text style={{ color: colors.muted, fontSize: 11 }}>{conversation.time}</Text></View>
            <Text numberOfLines={2} style={{ color: colors.muted, fontSize: 13, lineHeight: 18 }}>{conversation.preview}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
        </Pressable>)}
      </ScrollView>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segment: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 13, padding: 3 },
  segmentTab: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  conversationList: { paddingHorizontal: 16, paddingBottom: 18, gap: 8 },
  conversationRow: { minHeight: 88, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  initials: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", position: "relative" },
  presence: { position: "absolute", right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: "white" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  conversationName: { fontSize: 15, fontWeight: "800" },
  thread: { flex: 1, paddingHorizontal: 16, paddingBottom: 12 },
  messageList: { flexGrow: 1, justifyContent: "flex-end", gap: 10, paddingVertical: 16 },
  threadNote: { textAlign: "center", fontSize: 11, marginBottom: 8 },
  bubble: { maxWidth: "84%", borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  incoming: { alignSelf: "flex-start", borderBottomLeftRadius: 5 },
  outgoing: { alignSelf: "flex-end", borderBottomRightRadius: 5 },
  messageTime: { fontSize: 10, textAlign: "right", marginTop: 5 },
  composer: { minHeight: 54, borderWidth: 1, borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, gap: 8 },
  input: { flex: 1, fontSize: 15, paddingHorizontal: 8, paddingVertical: 10 },
  sendButton: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
