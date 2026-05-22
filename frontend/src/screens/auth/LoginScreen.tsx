import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useApp } from "../../context/AppContext";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { colors, spacing, typography } from "../../theme";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { authApi, extractApiError } from "../../api";
import { BrandPanel, styles, type AuthNavProp } from "./_authShared";

// ─── LoginScreen ─────────────────────────────────────────────────────────────

export function LoginScreen({ navigation }: { navigation: AuthNavProp }) {
  const { user, setUser } = useApp();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!email || !pw) return;
    setLoading(true);
    setError("");
    try {
      const res = await authApi.login({ email, password: pw });
      // build updatedUser first so the profileComplete check reads the same
      // object that gets committed — avoids stale-closure bug on user state
      const updatedUser = { ...user, loggedIn: true, email, name: res.user.name };
      setUser(updatedUser);
      const destination = updatedUser.profileComplete ? "Main" : "Onboarding";
      (navigation as any).reset({ index: 0, routes: [{ name: destination as never }] });
    } catch (e) {
      setError(extractApiError(e));
    } finally {
      setLoading(false);
    }
  };

  const { isTabletOrAbove } = useBreakpoint();

  if (isTabletOrAbove) {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <BrandPanel tagline={"처방전 한 장이면,\n오늘의 복약·생활습관 가이드."} desc="의료 문서를 업로드하면 OCR로 약품을 자동 인식하고, 건강 정보를 바탕으로 개인화된 가이드를 제공합니다." features={loginFeatures} />
        <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ maxWidth: 420, width: "100%", alignSelf: "center" }}>
            <Text style={styles.authTitle}>만나서 반가워요 👋</Text>
            <Text style={[styles.authSub, { marginBottom: spacing.s24 }]}>MediPT 계정으로 로그인해주세요.</Text>
            <View style={styles.field}>
              <Input icon="mail" placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" label="이메일" />
            </View>
            <View style={styles.field}>
              <Input label="비밀번호" icon="lock" placeholder="8~20자, 영문/숫자/특수문자 3종류 이상" value={pw} onChangeText={setPw} secureTextEntry />
              <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "flex-end", marginTop: 6 }}>
                <Text style={{ fontSize: typography.fz12, color: colors.accent }}>비밀번호 찾기</Text>
              </TouchableOpacity>
            </View>
            <Button variant="primary" size="lg" loading={loading} disabled={!email || !pw} onPress={submit} fullWidth>
              로그인
            </Button>
            {error ? <Text style={{ fontSize: typography.fz13, color: colors.danger, textAlign: "center", marginTop: spacing.s8 }}>{error}</Text> : null}
            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.s16 }}>
              <Text style={{ fontSize: typography.fz13, color: colors.muted }}>아직 계정이 없으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                <Text style={{ fontSize: typography.fz13, color: colors.accent }}>회원가입</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandLogo}>
            <Icon name="robot" size={18} color={colors.white} />
          </View>
          <Text style={styles.brandName}>MediPT</Text>
        </View>
        <Text style={styles.authTitle}>다시 만나서 반가워요 👋</Text>
        <Text style={styles.authSub}>MediPT 계정으로 로그인해주세요.</Text>

        {/* Email */}
        <View style={styles.field}>
          <Input label="이메일" icon="mail" placeholder="name@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Input label="비밀번호" icon="lock" placeholder="8~20자, 영문/숫자/특수문자 3종류 이상" value={pw} onChangeText={setPw} secureTextEntry />
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")} style={{ alignSelf: "flex-end", marginTop: 6 }}>
            <Text style={{ fontSize: typography.fz12, color: colors.accent }}>비밀번호 찾기</Text>
          </TouchableOpacity>
        </View>

        <Button variant="primary" size="lg" loading={loading} disabled={!email || !pw} onPress={submit} fullWidth>
          로그인
        </Button>
        {error ? <Text style={{ fontSize: typography.fz13, color: colors.danger, textAlign: "center", marginTop: spacing.s8 }}>{error}</Text> : null}

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: spacing.s16 }}>
          <Text style={{ fontSize: typography.fz13, color: colors.muted }}>아직 계정이 없으신가요? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={{ fontSize: typography.fz13, color: colors.accent }}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
