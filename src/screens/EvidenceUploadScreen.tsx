import React, { useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { useCovenant } from '@/context/CovenantContext';
import { useRealm } from '@/context/RealmContext';
import { memoryTypeColor, memoryTypeGlyph } from '@/data/memoryGraph';
import type { MemoryType } from '@/data/memoryGraph';
import { colors, radius, spacing, typography } from '@/design/tokens';

const TYPES: { type: MemoryType; label: string; sub: string }[] = [
  { type: 'evidence', label: 'Evidence', sub: 'Proof of transformation' },
  { type: 'breakthrough', label: 'Breakthrough', sub: 'A moment of breaking through' },
  { type: 'struggle', label: 'Struggle', sub: 'Something hard you faced' },
  { type: 'truth', label: 'Truth', sub: 'Something you realized' },
  { type: 'reflection', label: 'Reflection', sub: 'A thought worth keeping' },
];

function oathInterpretation(text: string, type: MemoryType): string {
  const t = text.toLowerCase();
  if (type === 'evidence') {
    if (t.includes('client') || t.includes('signed') || t.includes('deal')) return 'that you can close when it matters.';
    if (t.includes('finish') || t.includes('complet') || t.includes('done')) return 'that you finish what you start.';
    if (t.includes('show') || t.includes('present') || t.includes('pitch')) return 'that you show up ready.';
    return 'that you are becoming who you said you would.';
  }
  if (type === 'breakthrough') return 'that persistence compiles into clarity.';
  if (type === 'struggle') return 'that you name hard things — and that naming is the beginning.';
  if (type === 'truth') return 'that awareness is already a form of power.';
  return 'that reflection is a discipline you practise.';
}

/**
 * Evidence Upload — adding proof to the Memory Graph.
 *
 * OATH interprets everything. A photo of a signed contract becomes
 * "that I can build something." A note about a hard day becomes
 * "that I face it rather than avoid it." Evidence is not a gallery —
 * it is proof of transformation, read by OATH.
 */
export function EvidenceUploadScreen() {
  const { addMemory, memories } = useCovenant();
  const { realm, realmKey } = useRealm();
  const insets = useSafeAreaInsets();

  const [selectedType, setSelectedType] = useState<MemoryType>('evidence');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  const recentEvidence = memories.filter((m) =>
    ['evidence', 'breakthrough', 'struggle', 'truth', 'reflection'].includes(m.type),
  ).slice(0, 5);

  const interpretation = text.trim().length > 4 ? oathInterpretation(text, selectedType) : null;

  const submit = () => {
    if (!text.trim()) return;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const record = addMemory({
      type: selectedType,
      title: text.trim().slice(0, 60),
      content: text.trim(),
      emotionalWeight: selectedType === 'evidence' || selectedType === 'breakthrough' ? 0.8 : 0.6,
      source: 'evidence_upload',
      realm: realmKey,
    });

    setLastAdded(record.id);
    setSubmitted(true);
    setText('');
  };

  const addAnother = () => {
    setSubmitted(false);
    setLastAdded(null);
  };

  return (
    <View style={styles.root}>
      <RealmBackground />
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 110 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerLabel, { color: 'rgba(255,255,255,0.3)' }]}>OATH</Text>
            <Text style={styles.title}>Add Evidence</Text>
            <Text style={styles.sub}>OATH will interpret what this means.</Text>
          </View>

          {submitted ? (
            <SubmittedState interpretation={interpretation ?? 'that you showed up.'} onAddAnother={addAnother} accent={realm.accent} accentSoft={realm.accentSoft} />
          ) : (
            <>
              {/* Type selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow} contentContainerStyle={styles.typeRowContent}>
                {TYPES.map(({ type, label }) => {
                  const on = type === selectedType;
                  const color = memoryTypeColor[type];
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedType(type)}
                      style={[
                        styles.typeChip,
                        on
                          ? { backgroundColor: color + '18', borderColor: color + '55' }
                          : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
                      ]}
                    >
                      <Text style={{ fontSize: 14, color: on ? color : colors.textSubtle }}>
                        {memoryTypeGlyph[type]}
                      </Text>
                      <Text style={[styles.typeChipLabel, { color: on ? color : colors.textSubtle }]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Input */}
              <View style={[styles.inputBlock, { borderColor: realm.accent + '22' }]}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="What happened?"
                  placeholderTextColor={colors.textSubtle}
                  style={styles.input}
                  multiline
                  autoFocus
                  selectionColor={realm.accent}
                />
              </View>

              {/* OATH's interpretation preview */}
              {interpretation && (
                <View style={styles.interpretationBlock}>
                  <Text style={[styles.interpretationLabel, { color: realm.accentSoft }]}>OATH SEES</Text>
                  <Text style={styles.interpretationText}>"{interpretation}"</Text>
                </View>
              )}

              {/* Submit */}
              {text.trim().length > 2 && (
                <TouchableOpacity
                  onPress={submit}
                  style={[styles.submitBtn, { backgroundColor: realm.accentMuted, borderColor: realm.accent + '55' }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.submitText, { color: realm.accentSoft }]}>Add to Memory</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Recent evidence */}
          {recentEvidence.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentHeader}>Recently Added</Text>
              {recentEvidence.map((m) => {
                const color = memoryTypeColor[m.type];
                const daysAgo = Math.round((Date.now() - m.date) / (24 * 60 * 60 * 1000));
                return (
                  <View key={m.id} style={[styles.recentCard, { borderColor: color + '1A' }]}>
                    <View style={styles.recentCardHeader}>
                      <Text style={[styles.recentGlyph, { color }]}>{memoryTypeGlyph[m.type]}</Text>
                      <Text style={[styles.recentType, { color }]}>{m.type.toUpperCase()}</Text>
                      <Text style={styles.recentDate}>{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</Text>
                    </View>
                    <Text style={styles.recentContent} numberOfLines={2}>{m.content}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function SubmittedState({ interpretation, onAddAnother, accent, accentSoft }: {
  interpretation: string;
  onAddAnother: () => void;
  accent: string;
  accentSoft: string;
}) {
  return (
    <View style={styles.submitted}>
      <Text style={styles.submittedGlyph}>◆</Text>
      <Text style={styles.submittedTitle}>Added to Memory</Text>
      <View style={[styles.submittedInterpret, { borderColor: accent + '22', backgroundColor: accent + '09' }]}>
        <Text style={[styles.submittedLabel, { color: accentSoft }]}>OATH SEES</Text>
        <Text style={styles.submittedText}>"{interpretation}"</Text>
      </View>
      <TouchableOpacity onPress={onAddAnother} style={[styles.addAnotherBtn, { borderColor: accent + '44' }]}>
        <Text style={[styles.addAnotherText, { color: accentSoft }]}>Add another</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  header: { marginBottom: spacing.xl, gap: spacing.xs },
  headerLabel: { ...typography.labelSm, letterSpacing: 3 },
  title: { fontSize: 28, fontWeight: '500', color: colors.text, letterSpacing: -0.6, lineHeight: 34 },
  sub: { ...typography.bodyMd, color: colors.textSecondary },
  typeRow: { marginBottom: spacing.lg },
  typeRowContent: { gap: spacing.sm, paddingRight: spacing.lg },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  typeChipLabel: { ...typography.bodyMd, fontWeight: '500' },
  inputBlock: {
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.md,
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  input: {
    fontSize: 18,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 27,
    letterSpacing: -0.2,
    minHeight: 90,
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
  },
  interpretationBlock: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  interpretationLabel: { ...typography.labelSm, letterSpacing: 1.6 },
  interpretationText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 25,
    letterSpacing: -0.2,
  },
  submitBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  submitText: { ...typography.bodyMd, fontWeight: '600', letterSpacing: 0.2 },
  recentSection: { gap: spacing.sm },
  recentHeader: { ...typography.labelSm, color: colors.textSubtle, letterSpacing: 1.6, marginBottom: spacing.xs },
  recentCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.md,
    gap: 6,
  },
  recentCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recentGlyph: { fontSize: 13 },
  recentType: { ...typography.labelSm, letterSpacing: 1.4 },
  recentDate: { ...typography.labelSm, color: colors.textSubtle, marginLeft: 'auto' },
  recentContent: { ...typography.bodySm, color: colors.textSecondary, lineHeight: 19 },
  submitted: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.lg },
  submittedGlyph: { fontSize: 32, color: '#34D399' },
  submittedTitle: { fontSize: 22, fontWeight: '500', color: colors.text, letterSpacing: -0.3 },
  submittedInterpret: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  submittedLabel: { ...typography.labelSm, letterSpacing: 1.6 },
  submittedText: {
    fontSize: 17,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 25,
    textAlign: 'center',
  },
  addAnotherBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  addAnotherText: { ...typography.bodyMd, fontWeight: '500' },
});
