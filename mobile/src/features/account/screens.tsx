import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button, C, Chip, Icon, Lantern, Logo, serif } from "../tavern/ui";
import { useTavern } from "../tavern/store";
import { passwordError } from "../tavern/model";

type Screen =
  | "signin"
  | "signup"
  | "verify"
  | "verified"
  | "forgot"
  | "sent"
  | "reset"
  | "changed"
  | "signout";
type Preview = "Ready" | "Loading" | "Error" | "Offline";
const copy: Record<Screen, [string, string, string]> = {
  signin: [
    "WELCOME BACK",
    "Your place at the table.",
    "Sign in to find your next good deed and catch up with your neighbors.",
  ],
  signup: [
    "JOIN THE COMMON GOOD",
    "Every story starts somewhere.",
    "A little time. A helping hand. A community made better by you.",
  ],
  verify: [
    "ONE MORE STEP",
    "Check your inbox.",
    "Confirm your email before heading out on your first bounty.",
  ],
  verified: [
    "A WARM WELCOME",
    "You’re on the list.",
    "Your email verification is complete in this preview.",
  ],
  forgot: [
    "LET’S GET YOU BACK IN",
    "Misplaced your password?",
    "It happens. Enter your email and we’ll help you find your way back.",
  ],
  sent: [
    "CHECK YOUR INBOX",
    "A way back is on its way.",
    "If an account matches that email, you would receive a password reset link.",
  ],
  reset: [
    "A FRESH START",
    "Choose a new password.",
    "Make it something only you know.",
  ],
  changed: [
    "ALL SET",
    "A fresh start awaits.",
    "Your password change is complete in this preview. Sign in to continue.",
  ],
  signout: [
    "UNTIL NEXT TIME",
    "Leaving the tavern?",
    "Your demo bounties and progress will stay on this device. You can return any time.",
  ],
};
const previews: Screen[] = [
  "signin",
  "signup",
  "verify",
  "verified",
  "forgot",
  "sent",
  "reset",
  "changed",
  "signout",
];
function navigate(screen: Screen, replace = false) {
  const href = { pathname: "/account" as const, params: { mode: screen } };
  if (replace) router.replace(href);
  else router.push(href);
}
export default function AccountScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const screen = previews.includes(mode as Screen)
    ? (mode as Screen)
    : "signin";
  return <AccountFlow key={screen} screen={screen} />;
}
function AccountFlow({ screen }: { screen: Screen }) {
  const { act } = useTavern();
  const { width } = useWindowDimensions();
  const [values, setValues] = useState({
    email: "",
    username: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(false);
  const [preview, setPreview] = useState<Preview>("Ready");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [controls, setControls] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    if (!cooldown) return;
    const tick = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(tick);
  }, [cooldown]);
  const loading = busy || preview === "Loading";
  const [eyebrow, title, subtitle] = copy[screen];
  const simulatedError =
    screen === "signin"
      ? "That email and password don’t match. Try again."
      : screen === "signup"
        ? "That username is already taken. Try another."
        : screen === "verify" || screen === "reset"
          ? "This link has expired. Request a new email to continue."
          : "We couldn’t finish that request. Please try again.";
  const error =
    preview === "Offline"
      ? "We couldn’t connect. Your entries are still here. Try again when you’re online."
      : preview === "Error"
        ? simulatedError
        : "";
  function run(done: () => void) {
    if (loading) return;
    setMessage("");
    if (preview === "Error" || preview === "Offline") return;
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      done();
    }, 850);
  }
  function submit() {
    const next: Record<string, string> = {};
    if (
      ["signin", "signup", "forgot"].includes(screen) &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
    )
      next.email = "Enter an email like neighbor@example.com.";
    if (
      screen === "signup" &&
      !/^[a-zA-Z0-9_]{3,24}$/.test(values.username.trim())
    )
      next.username = "Use 3–24 letters, numbers, or underscores.";
    if (screen === "signin" && !values.password)
      next.password = "Enter your password.";
    if (screen === "signup" || screen === "reset") {
      const reason = passwordError(values.password);
      if (reason) next.password = reason;
      if (values.confirm !== values.password || !values.confirm)
        next.confirm = "Your passwords must match.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    run(() => {
      setValues((v) => ({ ...v, password: "", confirm: "" }));
      if (screen === "signin") {
        act({ type: "switch", id: "you" });
        router.replace("/");
      }
      if (screen === "signup") navigate("verify", true);
      if (screen === "forgot") navigate("sent", true);
      if (screen === "reset") navigate("changed", true);
    });
  }
  function field(
    key: keyof typeof values,
    label: string,
    placeholder: string,
    secret = false,
  ) {
    return (
      <View style={styles.field} key={key}>
        <Text nativeID={`${key}-label`} style={styles.label}>
          {label}
        </Text>
        <View style={[styles.inputWrap, !!errors[key] && styles.invalid]}>
          <TextInput
            accessibilityLabel={label}
            accessibilityHint={errors[key]}
            editable={!loading}
            value={values[key]}
            placeholder={placeholder}
            placeholderTextColor={C.muted}
            secureTextEntry={secret && !visible}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType={key === "email" ? "email-address" : "default"}
            style={styles.input}
            onChangeText={(text) => {
              setValues((v) => ({ ...v, [key]: text }));
              setErrors((e) => ({ ...e, [key]: "" }));
            }}
          />
          {secret && key === "password" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={visible ? "Hide password" : "Show password"}
              onPress={() => setVisible(!visible)}
              style={styles.reveal}
            >
              <Text style={styles.link}>{visible ? "Hide" : "Show"}</Text>
            </Pressable>
          )}
        </View>
        {!!errors[key] && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {errors[key]}
          </Text>
        )}
      </View>
    );
  }
  function resend() {
    run(() => {
      setCooldown(30);
      setMessage("Resend simulated. No email was sent.");
    });
  }
  function textLink(label: string, to: Screen) {
    return (
      <Pressable
        accessibilityRole="button"
        disabled={loading}
        onPress={() => navigate(to)}
        style={styles.textButton}
      >
        <Text style={styles.link}>{label}</Text>
      </Pressable>
    );
  }
  const form = ["signin", "signup", "forgot", "reset"].includes(screen);
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.top}>
            <View style={styles.brand}>
              <Logo />
              <View>
                <Text style={styles.brandName}>Rexburg Bounty Board</Text>
                <Text style={styles.small}>
                  A gathering place for good deeds.
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/")}
              style={styles.textButton}
            >
              <Text style={styles.link}>Back to board</Text>
            </Pressable>
          </View>
          <View style={[styles.layout, width >= 900 && styles.wide]}>
            {width >= 900 && (
              <View style={styles.story}>
                <Lantern />
                <Text style={styles.storyEyebrow}>THE COMMUNITY LEDGER</Text>
                <Text style={styles.storyTitle}>
                  Small acts.{"\n"}Lasting stories.
                </Text>
                <Text style={styles.storyBody}>
                  Pull up a chair. There’s always room for another neighbor
                  ready to lend a hand.
                </Text>
                <View style={styles.rule} />
                <Text style={styles.storyBody}>
                  01 Find a meaningful bounty{"\n\n"}02 Show up for a neighbor
                  {"\n\n"}03 Leave your community better
                </Text>
                <Text style={styles.storyFooter}>
                  ROOTED IN REXBURG · BUILT ON KINDNESS
                </Text>
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.eyebrow}>{eyebrow}</Text>
                <Icon
                  name={
                    form
                      ? "shield"
                      : screen === "signout"
                        ? "logout"
                        : "message"
                  }
                  color={C.wax}
                  size={26}
                />
              </View>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.body}>{subtitle}</Text>
              <View style={styles.demo}>
                <Text style={styles.demoTitle}>ACCOUNT PREVIEW</Text>
                <Text style={styles.small}>
                  Use fictional details. No accounts are created, no emails are
                  sent, and passwords are never saved.
                </Text>
              </View>
              {!!error && (
                <View accessibilityRole="alert" style={styles.errorBox}>
                  <Text style={styles.error}>{error}</Text>
                  <Button
                    secondary
                    title="Clear simulated error and retry"
                    onPress={() => setPreview("Ready")}
                  />
                </View>
              )}
              {!!message && (
                <Text accessibilityLiveRegion="polite" style={styles.success}>
                  {message}
                </Text>
              )}
              {form && (
                <View style={styles.form}>
                  {screen === "signup" &&
                    field("username", "Username", "your_neighbor_name")}
                  {screen !== "reset" &&
                    field("email", "Email address", "neighbor@example.com")}
                  {screen !== "forgot" &&
                    field(
                      "password",
                      screen === "reset" ? "New password" : "Password",
                      "Enter a sample password",
                      true,
                    )}
                  {(screen === "signup" || screen === "reset") && (
                    <>
                      <View style={styles.requirements}>
                        {[
                          [values.password.length >= 8, "8+ characters"],
                          [
                            (values.password.match(/[0-9]/g) || []).length >= 2,
                            "2+ numbers",
                          ],
                          [
                            /[^a-zA-Z0-9\s]/.test(values.password),
                            "1+ special character",
                          ],
                        ].map(([met, label]) => (
                          <Text
                            key={String(label)}
                            style={[
                              styles.small,
                              { color: met ? C.green : C.muted },
                            ]}
                          >
                            {met ? "✓" : "○"} {label}
                          </Text>
                        ))}
                      </View>
                      {field(
                        "confirm",
                        "Confirm password",
                        "Enter it again",
                        true,
                      )}
                      <Text style={styles.small}>
                        Sample password rules; final rules await the team
                        specification.
                      </Text>
                    </>
                  )}
                  {screen === "signin" &&
                    textLink("Forgot password?", "forgot")}
                  <Button
                    title={
                      loading
                        ? "Please wait…"
                        : screen === "signin"
                          ? "Sign in to demo"
                          : screen === "signup"
                            ? "Preview account creation"
                            : screen === "forgot"
                              ? "Preview reset email"
                              : "Preview password update"
                    }
                    disabled={loading}
                    onPress={submit}
                    icon="arrow"
                  />
                  {screen === "signin" && (
                    <>
                      <Text style={styles.center}>
                        New to the neighborhood?
                      </Text>
                      {textLink("Create an account →", "signup")}
                      <Button
                        secondary
                        title="Fill sample credentials"
                        disabled={loading}
                        onPress={() =>
                          setValues((v) => ({
                            ...v,
                            email: "bridger@example.com",
                            password: "Neighbor12!",
                          }))
                        }
                      />
                    </>
                  )}
                  {screen !== "signin" && textLink("Back to sign in", "signin")}
                </View>
              )}
              {(screen === "verify" || screen === "sent") && (
                <View style={styles.form}>
                  <View style={styles.letter}>
                    <Icon name="message" size={38} color={C.wax} />
                    <Text style={styles.letterTitle}>
                      A note for your inbox
                    </Text>
                    <Text style={styles.body}>
                      In the finished app, follow the link in your email. Check
                      your spam folder if it doesn’t arrive.
                    </Text>
                  </View>
                  <Button
                    title={
                      screen === "verify"
                        ? "Simulate opening verification link"
                        : "Simulate opening reset link"
                    }
                    disabled={loading}
                    onPress={() =>
                      run(() =>
                        navigate(
                          screen === "verify" ? "verified" : "reset",
                          true,
                        ),
                      )
                    }
                  />
                  <Button
                    secondary
                    title={
                      cooldown
                        ? `Resend available in ${cooldown}s`
                        : "Preview resend email"
                    }
                    disabled={loading || cooldown > 0}
                    onPress={resend}
                  />
                  {textLink(
                    "Use a different email",
                    screen === "verify" ? "signup" : "forgot",
                  )}
                  {textLink("Back to sign in", "signin")}
                </View>
              )}
              {(screen === "verified" || screen === "changed") && (
                <View style={styles.form}>
                  <View style={styles.seal}>
                    <Icon name="check" color={C.green} size={36} />
                  </View>
                  <Text style={styles.center}>
                    Preview complete. No real account was changed.
                  </Text>
                  <Button
                    title="Continue to sign in"
                    onPress={() => navigate("signin", true)}
                  />
                </View>
              )}
              {screen === "signout" && (
                <View style={styles.form}>
                  <Button
                    title={loading ? "Signing out…" : "Sign out of demo"}
                    disabled={loading}
                    onPress={() =>
                      run(() => {
                        act({ type: "signout" });
                        navigate("signin", true);
                      })
                    }
                  />
                  <Button
                    title="Stay a little longer"
                    secondary
                    disabled={loading}
                    onPress={() => router.replace("/profile")}
                  />
                </View>
              )}
              {loading && (
                <View accessibilityLiveRegion="polite" style={styles.loading}>
                  <ActivityIndicator color={C.wax} />
                  <Text style={styles.small}>
                    Simulated request in progress…
                  </Text>
                </View>
              )}
            </View>
          </View>
          {__DEV__ && (
            <View style={styles.preview}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: controls }}
                onPress={() => setControls(!controls)}
                style={styles.previewToggle}
              >
                <Text style={styles.link}>
                  {controls ? "−" : "+"} Prototype review controls
                </Text>
                <Text style={styles.small}>Development only</Text>
              </Pressable>
              {controls && (
                <>
                  <Text style={styles.small}>
                    Jump between screens or preview a response. These controls
                    are separate from real account behavior.
                  </Text>
                  <View style={styles.chips}>
                    {previews.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={screen === item}
                        onPress={() => navigate(item, true)}
                      />
                    ))}
                  </View>
                  <View style={styles.chips}>
                    {(
                      ["Ready", "Loading", "Error", "Offline"] as Preview[]
                    ).map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        active={preview === item}
                        onPress={() => {
                          if (timer.current) clearTimeout(timer.current);
                          setBusy(false);
                          setPreview(item);
                        }}
                      />
                    ))}
                  </View>
                  <Button
                    secondary
                    title="Open existing demo account picker"
                    onPress={() => router.push("/demo-accounts")}
                  />
                </>
              )}
            </View>
          )}
          <Text style={styles.footer}>GOOD DEEDS BELONG HERE.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.parchment },
  scroll: { padding: 20, paddingBottom: 40 },
  top: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  brandName: { fontFamily: serif, fontSize: 20, color: C.ink },
  layout: { width: "100%", maxWidth: 520, alignSelf: "center" },
  wide: { maxWidth: 1040, flexDirection: "row", alignItems: "stretch" },
  story: {
    flex: 1,
    backgroundColor: C.ink,
    padding: 42,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    justifyContent: "center",
  },
  storyEyebrow: {
    color: C.brass,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 24,
  },
  storyTitle: {
    fontFamily: serif,
    color: C.paper,
    fontSize: 48,
    lineHeight: 54,
    marginVertical: 22,
  },
  storyBody: { color: C.parchment, fontSize: 16, lineHeight: 25 },
  storyFooter: {
    color: C.brass,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 40,
  },
  rule: {
    height: 1,
    backgroundColor: C.brass,
    opacity: 0.4,
    marginVertical: 30,
  },
  card: {
    flex: 1,
    backgroundColor: C.paper,
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: C.line,
    borderTopWidth: 4,
    borderTopColor: C.brass,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  eyebrow: {
    color: C.wax,
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: "700",
    flex: 1,
  },
  title: {
    fontFamily: serif,
    fontSize: 35,
    lineHeight: 41,
    color: C.ink,
    marginTop: 18,
    marginBottom: 12,
  },
  body: { color: C.muted, fontSize: 15, lineHeight: 23 },
  small: { color: C.muted, fontSize: 12, lineHeight: 19 },
  demo: {
    backgroundColor: C.parchment,
    padding: 13,
    borderRadius: 10,
    marginVertical: 22,
    gap: 4,
  },
  demoTitle: {
    color: C.wax,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  form: { gap: 14 },
  field: { gap: 7 },
  label: { color: C.ink, fontSize: 14, fontWeight: "600" },
  inputWrap: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFCF5",
  },
  invalid: { borderColor: C.wax, borderWidth: 2 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    padding: 13,
    color: C.ink,
    fontSize: 16,
  },
  reveal: { minHeight: 48, paddingHorizontal: 12, justifyContent: "center" },
  link: { color: C.wax, fontWeight: "600", fontSize: 14 },
  textButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  error: { color: C.wax, fontSize: 13, lineHeight: 20 },
  errorBox: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#F6E3DC",
    gap: 12,
    marginBottom: 16,
  },
  success: { color: C.green, padding: 12, marginBottom: 12 },
  requirements: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  center: { color: C.muted, textAlign: "center", fontSize: 14, lineHeight: 22 },
  letter: {
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 22,
    gap: 12,
  },
  letterTitle: { fontFamily: serif, fontSize: 23, color: C.ink },
  seal: {
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E3EBDC",
    alignItems: "center",
    justifyContent: "center",
    margin: 14,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  preview: {
    maxWidth: 1040,
    width: "100%",
    alignSelf: "center",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 14,
  },
  previewToggle: { minHeight: 44, justifyContent: "center", gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footer: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 2,
    color: C.muted,
    marginTop: 26,
  },
});
