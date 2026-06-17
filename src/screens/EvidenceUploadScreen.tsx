import React, { useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { useCovenant } from '@/context/CovenantContext';
import { interpretEvidence, estimateWeight } from '@/engine/evidenceInterpreter';
import type { MemoryRecord } from '@/data/memoryGraph';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

const ACCENT = '#34D399';

/**
 * Evidence Experience — giving OATH proof of transformation.
 *
 * Not a gallery. Not a form. A guided proof capture:
 * What happened → What does this prove → OATH interprets.
 *
 * The Proof Stack is the record of every promise kept.
 */
export function EvidenceUploadScreen() {
  const { covenant, memories, addMemory } = useCovenant();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const [capturing, setCapturing] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [hasImage, setHasImage] = useState(false);
  const [whatText, setWhatText] = useState('');
  const [proofText, setProofText] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [editingInterp, setEditingInterp] = useState(false);
  const [customInterp, setCustomInterp] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const evidenceRecords = memories
    .filter((m) => m.type === 'evidence')
    .sort((a, b) => b.date - a.date);

  const openCommunion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Communion');
  };

  const startCapture = () => {
    setStep(0);
    setHasImage(false);
    setWhatText('');
    setProofText('');
    setInterpretation('');
    setEditingInterp(false);
    setCustomInterp('');
    setCapturing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const exitCapture = () => {
    setCapturing(false);
    setStep(0);
    Keyboard.dismiss();
  };

  const goBack = () => {
    if (step === 0) {
      exitCapture();
    } else {
      setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2 | 3);
    }
  };

  const submitWithInterp = (finalInterp: string) => {
    const weight = estimateWeight(whatText, proofText);
    addMemory({
      type: 'evidence',
      title: whatText.trim().slice(0, 60),
      content: whatText.trim(),
      emotionalWeight: weight,
      source: 'evidence_upload',
      linkedPromiseId: covenant?.id,
      oathInterpretation: finalInterp || undefined,
      imageUri: hasImage ? 'placeholder' : undefined,
      tags: ['user-submitted'],
    });
    setStep(3);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const nextStep = () => {
    if (step === 0) {
      if (!whatText.trim()) return;
      Keyboard.dismiss();
      setStep(1);
    } else if (step === 1) {
      const interp = interpretEvidence(whatText, proofText);
      setInterpretation(interp);
      setCustomInterp(interp);
      Keyboard.dismiss();
      setStep(2);
    } else if (step === 2) {
      submitWithInterp(editingInterp ? customInterp : interpretation);
    } else {
      exitCapture();
    }
  };

  if (capturing) {
    return (
      <View style={styles.root}>
        <RealmBackground />
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 110 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Capture nav */}
            <View style={styles.captureNav}>
              {step < 3 ? (
                <TouchableOpacity onPress={goBack} hitSlop={12} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>←</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.backBtn} />
              )}
              <View style={styles.stepDots}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i < step
                        ? { backgroundColor: ACCENT, width: 6 }
                        : i === step
                        ? { backgroundColor: ACCENT, width: 16 }
                        : { backgroundColor: 'rgba(255,255,255,0.14)', width: 6 },
                    ]}
                  />
                ))}
              </View>
              <View style={styles.backBtn} />
            </View>

            {step === 0 && (
              <StepWhat
                hasImage={hasImage}
                onToggleImage={() => setHasImage((v) => !v)}
                text={whatText}
                onChangeText={setWhatText}
                onNext={nextStep}
              />
            )}
            {step === 1 && (
              <StepProof
                whatText={whatText}
                text={proofText}
                onChangeText={setProofText}
                onNext={nextStep}
              />
            )}
            {step === 2 && (
              <StepInterpret
                interpretation={interpretation}
                editing={editingInterp}
                customInterp={customInterp}
                onCustomChange={setCustomInterp}
                onEdit={() => setEditingInterp(true)}
                onAccept={nextStep}
                onReject={() => submitWithInterp('')}
              />
            )}
            {step === 3 && (
              <StepDone
                interpretation={editingInterp ? customInterp : interpretation}
                onDone={exitCapture}
              />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // Proof Stack — the record of transformation.
  return (
    <View style={styles.root}>
      <RealmBackground />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 110 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stackHeader}>
          <Text style={styles.wordmark}>OATH</Text>
          <TouchableOpacity onPress={startCapture} style={styles.addBtn} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>+ Add Proof</Text>
          </TouchableOpacity>
        </View>

        {covenant && (
          <View style={styles.covenantStrip}>
            <Text style={styles.covenantLabel}>YOUR COVENANT</Text>
            <Text style={styles.covenantText}>"{covenant.promise}"</Text>
          </View>
        )}

        {evidenceRecords.length === 0 ? (
          <EmptyState onStart={startCapture} />
        ) : (
          <ProofStack
            records={evidenceRecords}
            covenantId={covenant?.id ?? null}
            activeId={activeId}
            onToggle={(id) => setActiveId((prev) => (prev === id ? null : id))}
            onCommunion={openCommunion}
          />
        )}
      </ScrollView>
    </View>
  );
}

// ── Capture steps ─────────────────────────────────────────────

function StepWhat({
  hasImage,
  onToggleImage,
  text,
  onChangeText,
  onNext,
}: {
  hasImage: boolean;
  onToggleImage: () => void;
  text: string;
  onChangeText: (s: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={captureStyles.step}>
      <Text style={captureStyles.question}>What happened?</Text>
      <Text style={captureStyles.sub}>
        Tell OATH what you did.{'\n'}Don't explain it — just say what happened.
      </Text>

      {/* Photo / screenshot placeholder */}
      <TouchableOpacity onPress={onToggleImage} activeOpacity={0.8} style={[captureStyles.imagePlaceholder, hasImage && captureStyles.imageAttached]}>
        {hasImage ? (
          <View style={captureStyles.imagePreview}>
            <Text style={captureStyles.imageDoneGlyph}>◆</Text>
            <View>
              <Text style={captureStyles.imageAttachedLabel}>Image attached</Text>
              <Text style={captureStyles.imageRemove}>Tap to remove</Text>
            </View>
          </View>
        ) : (
          <>
            <Text style={captureStyles.cameraGlyph}>⬡</Text>
            <Text style={captureStyles.imagePlaceholderLabel}>Add photo or screenshot</Text>
            <Text style={captureStyles.imagePlaceholderSub}>optional</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={captureStyles.inputBlock}>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={'First client signed.\nFinished the project.\nWoke up at 5am for 7 days.'}
          placeholderTextColor="rgba(255,255,255,0.18)"
          style={captureStyles.input}
          multiline
          autoFocus
          selectionColor={ACCENT}
        />
      </View>

      {text.trim().length > 3 && (
        <TouchableOpacity onPress={onNext} style={captureStyles.nextBtn} activeOpacity={0.8}>
          <Text style={captureStyles.nextBtnText}>Continue →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StepProof({
  whatText,
  text,
  onChangeText,
  onNext,
}: {
  whatText: string;
  text: string;
  onChangeText: (s: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={captureStyles.step}>
      <Text style={captureStyles.echo} numberOfLines={2}>
        "{whatText.trim().slice(0, 100)}{whatText.trim().length > 100 ? '…' : ''}"
      </Text>
      <Text style={captureStyles.question}>
        What does this prove{'\n'}about who you're becoming?
      </Text>
      <Text style={captureStyles.sub}>OATH will listen to this answer. Be honest.</Text>

      <View style={captureStyles.inputBlock}>
        <TextInput
          value={text}
          onChangeText={onChangeText}
          placeholder={'That I can close.\nThat I keep going even when it\'s hard.\nThat I\'m becoming someone I can be proud of.'}
          placeholderTextColor="rgba(255,255,255,0.18)"
          style={captureStyles.input}
          multiline
          autoFocus
          selectionColor={ACCENT}
        />
      </View>

      <TouchableOpacity onPress={onNext} style={captureStyles.nextBtn} activeOpacity={0.8}>
        <Text style={captureStyles.nextBtnText}>
          {text.trim() ? 'Let OATH interpret →' : 'Skip — OATH will decide →'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function StepInterpret({
  interpretation,
  editing,
  customInterp,
  onCustomChange,
  onEdit,
  onAccept,
  onReject,
}: {
  interpretation: string;
  editing: boolean;
  customInterp: string;
  onCustomChange: (s: string) => void;
  onEdit: () => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <View style={captureStyles.step}>
      <Text style={captureStyles.oathSeesLabel}>OATH SEES</Text>

      {editing ? (
        <View style={captureStyles.editBlock}>
          <TextInput
            value={customInterp}
            onChangeText={onCustomChange}
            style={captureStyles.editInput}
            multiline
            autoFocus
            selectionColor={ACCENT}
          />
        </View>
      ) : (
        <View style={[captureStyles.interpBlock, { borderColor: ACCENT + '25', backgroundColor: ACCENT + '09' }]}>
          <Text style={captureStyles.interpText}>"{interpretation}"</Text>
        </View>
      )}

      <View style={captureStyles.interpActions}>
        <TouchableOpacity onPress={onAccept} style={captureStyles.acceptBtn} activeOpacity={0.8}>
          <Text style={captureStyles.acceptText}>◆ That's right</Text>
        </TouchableOpacity>
        {!editing && (
          <TouchableOpacity onPress={onEdit} style={captureStyles.secondaryBtn} activeOpacity={0.7}>
            <Text style={captureStyles.secondaryBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onReject} style={captureStyles.rejectBtn} activeOpacity={0.7}>
          <Text style={captureStyles.rejectText}>I disagree — skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StepDone({ interpretation, onDone }: { interpretation: string; onDone: () => void }) {
  return (
    <View style={captureStyles.doneStep}>
      <Text style={captureStyles.doneGlyph}>◆</Text>
      <Text style={captureStyles.doneTitle}>Proof received.</Text>
      <Text style={captureStyles.doneSub}>
        OATH has added this to your record.{'\n'}
        It will surface this when you need it most.
      </Text>
      {interpretation ? (
        <View style={[captureStyles.interpBlock, { borderColor: ACCENT + '25', backgroundColor: ACCENT + '09', marginTop: spacing.lg }]}>
          <Text style={[captureStyles.oathSeesLabel, { marginBottom: spacing.xs }]}>OATH SEES</Text>
          <Text style={captureStyles.interpText}>"{interpretation}"</Text>
        </View>
      ) : null}
      <TouchableOpacity onPress={onDone} style={captureStyles.doneBtn} activeOpacity={0.8}>
        <Text style={captureStyles.doneBtnText}>Return to Proof Stack</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Proof Stack ───────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyGlyph}>◆</Text>
      <Text style={styles.emptyTitle}>No proof yet.</Text>
      <Text style={styles.emptySub}>
        OATH does not generate inspiration.{'\n'}
        It reads what you have done.{'\n'}
        Give it something to work with.
      </Text>
      <TouchableOpacity onPress={onStart} style={styles.emptyBtn} activeOpacity={0.8}>
        <Text style={styles.emptyBtnText}>Add your first proof</Text>
      </TouchableOpacity>
    </View>
  );
}

function ProofStack({
  records,
  covenantId,
  activeId,
  onToggle,
  onCommunion,
}: {
  records: MemoryRecord[];
  covenantId: string | null;
  activeId: string | null;
  onToggle: (id: string) => void;
  onCommunion: () => void;
}) {
  const linked = records.filter((r) => r.linkedPromiseId === covenantId);

  return (
    <View style={stackStyles.container}>
      {/* Count + stack summary */}
      <View style={stackStyles.summary}>
        <Text style={stackStyles.count}>
          ◆ {records.length} proof{records.length !== 1 ? 's' : ''} of transformation
        </Text>
        {linked.length >= 2 && (
          <Text style={stackStyles.strengthens}>
            {linked.length} strengthen your covenant
          </Text>
        )}
      </View>

      {records.map((record, i) => (
        <ProofCard
          key={record.id}
          record={record}
          covenantId={covenantId}
          isActive={activeId === record.id}
          isFirst={i === 0}
          onToggle={() => onToggle(record.id)}
          onCommunion={onCommunion}
        />
      ))}
    </View>
  );
}

const PROOF_ACTIONS = [
  { label: 'Why did you show me this?', handler: 'explain' as const },
  { label: 'What does this prove?', handler: 'explain' as const },
  { label: 'Connect this to my covenant', handler: 'communion' as const },
  { label: 'Make this part of my story', handler: 'communion' as const },
  { label: 'I disagree with this interpretation', handler: 'communion' as const },
];

function ProofCard({
  record,
  covenantId,
  isActive,
  isFirst,
  onToggle,
  onCommunion,
}: {
  record: MemoryRecord;
  covenantId: string | null;
  isActive: boolean;
  isFirst: boolean;
  onToggle: () => void;
  onCommunion: () => void;
}) {
  const daysAgo = Math.round((Date.now() - record.date) / (24 * 60 * 60 * 1000));
  const linkedToCovenant = Boolean(covenantId && record.linkedPromiseId === covenantId);
  const [showExplain, setShowExplain] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => { onToggle(); setShowExplain(false); }}
      activeOpacity={0.85}
      style={[cardStyles.card, isFirst && cardStyles.firstCard]}
    >
      {/* Evidence accent left border */}
      <View style={cardStyles.accentBar} />

      <View style={cardStyles.body}>
        {/* Image placeholder thumbnail */}
        {record.imageUri && (
          <View style={cardStyles.imageThumbnail}>
            <Text style={cardStyles.imageThumbnailGlyph}>⬡</Text>
          </View>
        )}

        {/* OATH interpretation — primary */}
        {record.oathInterpretation ? (
          <View style={cardStyles.interpRow}>
            <Text style={cardStyles.interpLabel}>OATH SEES</Text>
            <Text style={cardStyles.interpText}>"{record.oathInterpretation}"</Text>
          </View>
        ) : null}

        {/* What happened — secondary */}
        <Text style={cardStyles.content} numberOfLines={isActive ? undefined : 2}>
          {record.content}
        </Text>

        {/* Footer */}
        <View style={cardStyles.footer}>
          <Text style={cardStyles.date}>
            {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
          </Text>
          {linkedToCovenant && (
            <View style={cardStyles.covenantBadge}>
              <Text style={cardStyles.covenantBadgeText}>◈ Strengthens covenant</Text>
            </View>
          )}
        </View>

        {/* Explanation — why OATH shows this */}
        {showExplain && record.oathInterpretation && (
          <View style={cardStyles.explainBlock}>
            <Text style={cardStyles.explainText}>
              This is what OATH read from your evidence: {record.oathInterpretation} It will surface this when calculating your confidence score.
            </Text>
            <TouchableOpacity onPress={() => setShowExplain(false)} hitSlop={8}>
              <Text style={cardStyles.explainClose}>Close ↑</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action pills when expanded */}
        {isActive && (
          <View style={cardStyles.actions}>
            {PROOF_ACTIONS.map(({ label, handler }) => (
              <TouchableOpacity
                key={label}
                style={cardStyles.actionPill}
                activeOpacity={0.7}
                onPress={() => {
                  if (handler === 'explain') setShowExplain((v) => !v);
                  else onCommunion();
                }}
              >
                <Text style={cardStyles.actionPillText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },

  stackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3.5,
    color: 'rgba(255,255,255,0.22)',
  },
  addBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ACCENT + '55',
    backgroundColor: ACCENT + '12',
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: ACCENT, letterSpacing: 0.2 },

  covenantStrip: {
    gap: 6,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    marginBottom: spacing.lg,
  },
  covenantLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8, color: 'rgba(255,255,255,0.25)' },
  covenantText: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, letterSpacing: -0.1, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl * 1.5, gap: spacing.md },
  emptyGlyph: { fontSize: 28, color: ACCENT + '60' },
  emptyTitle: { fontSize: 20, fontWeight: '400', color: colors.text, letterSpacing: -0.3 },
  emptySub: { fontSize: 14, color: colors.textSubtle, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
  emptyBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ACCENT + '55',
    backgroundColor: ACCENT + '12',
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: ACCENT },

  captureNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: 'rgba(255,255,255,0.45)' },
  stepDots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
});

const captureStyles = StyleSheet.create({
  step: { gap: spacing.lg },
  echo: {
    fontSize: 14,
    color: ACCENT + 'BB',
    fontStyle: 'italic',
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  question: {
    fontSize: 26,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 35,
  },
  sub: { fontSize: 14, color: colors.textSubtle, lineHeight: 21, letterSpacing: -0.1 },

  // Image placeholder
  imagePlaceholder: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.12)',
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageAttached: {
    borderStyle: 'solid',
    borderColor: ACCENT + '40',
    backgroundColor: ACCENT + '09',
    height: 72,
  },
  imagePreview: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageDoneGlyph: { fontSize: 20, color: ACCENT },
  imageAttachedLabel: { fontSize: 14, fontWeight: '500', color: ACCENT },
  imageRemove: { fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 },
  cameraGlyph: { fontSize: 22, color: 'rgba(255,255,255,0.2)' },
  imagePlaceholderLabel: { fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
  imagePlaceholderSub: { fontSize: 11, color: 'rgba(255,255,255,0.15)' },

  // Text input
  inputBlock: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ACCENT + '1E',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: spacing.md,
    minHeight: 130,
  },
  input: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 26,
    letterSpacing: -0.2,
    minHeight: 100,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
  },

  nextBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ACCENT + '55',
    backgroundColor: ACCENT + '12',
    alignItems: 'center',
  },
  nextBtnText: { fontSize: 14, fontWeight: '600', color: ACCENT, letterSpacing: 0.2 },

  // Interpretation step
  oathSeesLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8, color: ACCENT },
  interpBlock: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  interpText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 27,
    letterSpacing: -0.2,
  },
  editBlock: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: ACCENT + '30',
    backgroundColor: ACCENT + '08',
    padding: spacing.md,
    minHeight: 80,
  },
  editInput: {
    fontSize: 17,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 26,
    letterSpacing: -0.2,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
  },
  interpActions: { gap: spacing.sm },
  acceptBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ACCENT + '55',
    backgroundColor: ACCENT + '18',
    alignItems: 'center',
  },
  acceptText: { fontSize: 14, fontWeight: '600', color: ACCENT },
  secondaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  rejectBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rejectText: { fontSize: 13, color: colors.textSubtle },

  // Done step
  doneStep: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  doneGlyph: { fontSize: 36, color: ACCENT },
  doneTitle: { fontSize: 26, fontWeight: '400', color: colors.text, letterSpacing: -0.4 },
  doneSub: { fontSize: 14, color: colors.textSubtle, lineHeight: 22, textAlign: 'center', maxWidth: 280 },
  doneBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  doneBtnText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
});

const stackStyles = StyleSheet.create({
  container: { gap: spacing.sm },
  summary: { gap: 4, marginBottom: spacing.sm },
  count: { fontSize: 13, fontWeight: '500', color: ACCENT, letterSpacing: 0.1 },
  strengthens: { fontSize: 11, color: ACCENT + '80', letterSpacing: 0.2 },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.025)',
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  firstCard: {
    borderColor: ACCENT + '22',
    backgroundColor: ACCENT + '06',
  },
  accentBar: {
    width: 3,
    backgroundColor: ACCENT + '60',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  imageThumbnail: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  imageThumbnailGlyph: { fontSize: 16, color: 'rgba(255,255,255,0.25)' },
  interpRow: { gap: 3 },
  interpLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.8, color: ACCENT + 'BB' },
  interpText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  content: {
    fontSize: 13,
    color: colors.textSubtle,
    lineHeight: 19,
    letterSpacing: -0.05,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  date: { fontSize: 11, color: 'rgba(255,255,255,0.22)' },
  covenantBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ACCENT + '30',
    backgroundColor: ACCENT + '0A',
  },
  covenantBadgeText: { fontSize: 10, fontWeight: '500', color: ACCENT, letterSpacing: 0.3 },
  explainBlock: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  explainText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  explainClose: { fontSize: 12, color: colors.textSubtle },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: ACCENT + '30',
    backgroundColor: ACCENT + '0A',
  },
  actionPillText: { fontSize: 12, fontWeight: '500', color: ACCENT, letterSpacing: 0.1 },
});
