import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Camera,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Flame,
  Home,
  House,
  MapPin,
  NotebookTabs,
  Play,
  Plus,
  Repeat,
  Ruler,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  User,
  Utensils,
  Weight,
  X,
} from 'lucide-react-native';
import {
  defaultProfile,
  getStored,
  INTRO_KEY,
  localDay,
  MEAL_KEY,
  PROFILE_KEY,
  saveStored,
  SESSION_KEY,
  setIntroComplete as persistIntroComplete,
  type ActiveExercise,
  type ActiveWorkout,
  type Meal,
  type Profile,
  type TrainingLocation,
  type TrainingPlace,
  type Unit,
  type WorkoutSession,
  uid,
} from '../src/storage';
import { createWorkout, plannedKeys, recommendedKey, templates, toKg, type TemplateKey } from '../src/training';
import { exerciseCatalog, findExerciseGuide, guideLocationCounts, searchExerciseGuides, type ExerciseGuide } from '../src/exercises';
import { exerciseVideoCount, findGuideVideo, pickClip, type VideoVariant } from '../src/exercise-videos';

const C = {
  black: '#050505',
  surface: '#101012',
  surfaceRaised: '#19191c',
  surfaceSoft: '#252529',
  red: '#df0925',
  redBright: '#f32942',
  redDeep: '#850417',
  white: '#ffffff',
  text: '#f5f5f7',
  muted: '#a5a5ad',
  dim: '#71717a',
  line: 'rgba(255,255,255,0.11)',
};

const unitLabel = (unit: Unit) => unit.toUpperCase();
const formatNumber = (value: number) => new Intl.NumberFormat().format(Math.max(0, Math.round(value || 0)));
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
const locationTitle = (locations: TrainingLocation | TrainingPlace[]) => {
  const items = Array.isArray(locations) ? locations : [locations];
  const labels: Record<TrainingLocation, string> = { home: 'Home', gym: 'Gym', outdoors: 'Outdoors', studio: 'Private studio', hybrid: 'Home + gym' };
  return items.map((location) => labels[location]).join(' + ');
};
const locationsFromLegacyProfile = (location: TrainingLocation): TrainingPlace[] => location === 'hybrid' ? ['home', 'gym'] : location === 'home' ? ['home'] : location === 'outdoors' ? ['outdoors'] : ['gym'];
const starPoints = [
  [6, 8, 1], [17, 5, 1], [28, 13, 2], [43, 4, 1], [59, 11, 1], [71, 6, 2], [88, 15, 1], [95, 8, 1],
  [4, 20, 1], [12, 28, 2], [24, 23, 1], [38, 31, 1], [53, 22, 2], [66, 29, 1], [80, 25, 1], [91, 34, 2],
  [8, 39, 1], [19, 46, 1], [31, 42, 2], [47, 49, 1], [62, 40, 1], [73, 47, 2], [86, 43, 1], [97, 50, 1],
  [3, 57, 2], [15, 64, 1], [26, 59, 1], [41, 68, 2], [55, 56, 1], [68, 65, 1], [82, 60, 2], [93, 70, 1],
  [7, 76, 1], [22, 82, 2], [34, 75, 1], [49, 86, 1], [64, 78, 2], [76, 88, 1], [89, 80, 1], [98, 91, 2],
] as const;

export default function APEXWorkout() {
  const [fontsLoaded] = useFonts({
    'APEX Sora': require('../assets/fonts/Sora-Variable.ttf'),
    'APEX Manrope': require('../assets/fonts/Manrope-Variable.ttf'),
  });
  const [ready, setReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [editingSetup, setEditingSetup] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [intro, savedProfile, savedSessions, savedMeals] = await Promise.all([
        getStored<boolean>(INTRO_KEY, false),
        getStored<Profile>(PROFILE_KEY, defaultProfile),
        getStored<WorkoutSession[]>(SESSION_KEY, []),
        getStored<Meal[]>(MEAL_KEY, []),
      ]);
      const trainingLocations = Array.isArray(savedProfile.trainingLocations)
        ? savedProfile.trainingLocations
        : locationsFromLegacyProfile(savedProfile.location ?? defaultProfile.location);
      setIntroComplete(intro);
      setProfile({ ...defaultProfile, ...savedProfile, trainingLocations });
      setSessions(savedSessions);
      setMeals(savedMeals);
      setReady(true);
    };
    hydrate();
  }, []);

  const finishIntro = async () => {
    await persistIntroComplete();
    setIntroComplete(true);
  };

  const finishSetup = async (nextProfile: Profile) => {
    const completed = { ...nextProfile, complete: true };
    await saveStored(PROFILE_KEY, completed);
    setProfile(completed);
    setEditingSetup(false);
  };

  const addSession = async (session: WorkoutSession) => {
    const next = [...sessions, session];
    setSessions(next);
    await saveStored(SESSION_KEY, next);
  };

  const updateMeals = async (next: Meal[]) => {
    setMeals(next);
    await saveStored(MEAL_KEY, next);
  };

  if (!ready || !fontsLoaded) return <LoadingScreen />;
  if (!introComplete) return <IntroScreen onContinue={finishIntro} />;
  if (!profile.complete || editingSetup) return <Onboarding initialProfile={profile} onFinish={finishSetup} />;

  return (
    <Dashboard
      profile={profile}
      sessions={sessions}
      meals={meals}
      onSessionsChange={addSession}
      onMealsChange={updateMeals}
      onEditProfile={() => setEditingSetup(true)}
    />
  );
}

function LoadingScreen() {
  return <View style={styles.loading}><Image source={require('../assets/splash-icon.png')} style={styles.loadingMark} /><Text style={styles.loadingWordmark}>APEX WORKOUT</Text></View>;
}

function IntroScreen({ onContinue }: { onContinue: () => void }) {
  const completed = useRef(false);
  const finishOnce = () => {
    if (completed.current) return;
    completed.current = true;
    onContinue();
  };
  const player = useVideoPlayer(require('../assets/intro-app.mp4'), (video) => {
    video.loop = false;
    video.muted = true;
    video.play();
  });

  useEffect(() => {
    const endSubscription = player.addListener('playToEnd', finishOnce);
    const statusSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') finishOnce();
    });
    return () => {
      endSubscription.remove();
      statusSubscription.remove();
    };
  }, [player]);

  return (
    <View style={styles.intro}>
      <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" />
      <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
      <View style={styles.introBrand}><Image source={require('../assets/splash-icon.png')} style={styles.introBrandMark} /><Text style={styles.introBrandText}>APEX WORKOUT</Text></View>
    </View>
  );
}

function Onboarding({ initialProfile, onFinish }: { initialProfile: Profile; onFinish: (profile: Profile) => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(initialProfile);
  const [nameError, setNameError] = useState(false);
  const [frequencyError, setFrequencyError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const pageAnimation = useRef(new Animated.Value(1)).current;

  const transitionTo = (nextStep: number) => {
    Animated.timing(pageAnimation, { toValue: 0, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => {
      setStep(nextStep);
      pageAnimation.setValue(0);
      Animated.timing(pageAnimation, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  };

  const next = () => {
    if (step === 1 && !draft.name.trim()) { setNameError(true); return; }
    if (step === 5 && draft.frequency < 1) { setFrequencyError(true); return; }
    if (step === 6 && !draft.trainingLocations.length) { setLocationError(true); return; }
    if (step < 6) { transitionTo(step + 1); return; }
    onFinish({ ...draft, name: draft.name.trim() });
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.72 });
    if (!result.canceled && result.assets[0]?.uri) setDraft((value) => ({ ...value, photo: result.assets[0].uri }));
  };

  const changeUnit = (unit: Unit) => {
    setDraft((value) => ({
      ...value,
      unit,
      weight: value.unit === unit ? value.weight : unit === 'lb' ? Math.round(value.weight * 2.20462 * 10) / 10 : Math.round((value.weight / 2.20462) * 10) / 10,
    }));
  };

  const stepContent = [
    <View key="welcome" />,
    <NameStep key="name" name={draft.name} error={nameError} onChange={(name) => { setDraft((value) => ({ ...value, name })); setNameError(false); }} />,
    <PhotoStep key="photo" photo={draft.photo} onPick={pickPhoto} />, 
    <UnitStep key="unit" profile={draft} onSelect={changeUnit} />,
    <MetricsStep key="metrics" profile={draft} onChange={(update) => setDraft((value) => ({ ...value, ...update }))} />, 
    <TrainingFrequencyStep key="frequency" frequency={draft.frequency} error={frequencyError} onChange={(frequency) => { setDraft((value) => ({ ...value, frequency })); setFrequencyError(false); }} />,
    <TrainingLocationStep key="location" locations={draft.trainingLocations} error={locationError} onChange={(trainingLocations) => { const location = trainingLocations.includes('gym') ? 'gym' : trainingLocations.includes('home') ? 'home' : trainingLocations[0] ?? draft.location; setDraft((value) => ({ ...value, location, trainingLocations })); setLocationError(false); }} />,
  ];

  if (step === 0) {
    return <WelcomeLanding onNext={next} onSkip={() => onFinish({ ...draft, name: draft.name.trim() || 'Athlete' })} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <OnboardingBackdrop />
      <View style={styles.formStoryHeader}><View style={styles.formStorySegments}>{Array.from({ length: 7 }, (_, index) => <View key={index} style={[styles.formStorySegment, index <= step && styles.formStorySegmentActive]} />)}</View><Pressable onPress={() => onFinish({ ...draft, name: draft.name.trim() || 'Athlete' })} hitSlop={12}><Text style={styles.skipWelcome}>SKIP</Text></Pressable></View>
      <Animated.View style={[styles.onboardingPage, { opacity: pageAnimation, transform: [{ translateX: pageAnimation.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>{stepContent[step]}</Animated.View>
      <View style={styles.formFooter}><Pressable onPress={() => transitionTo(step - 1)} style={styles.formBackButton}><ArrowLeft size={23} color={C.muted} /></Pressable><Pressable onPress={next} style={styles.formNextButton}><Text style={styles.formNextText}>{step === 2 ? 'LATER' : step === 6 ? 'GET STARTED' : 'NEXT'}</Text>{step === 2 ? null : step === 6 ? <Check size={19} color={C.white} /> : <ArrowRight size={19} color={C.white} />}</Pressable></View>
    </SafeAreaView>
  );
}

function OnboardingBackdrop() {
  return <View pointerEvents="none" style={styles.backdrop}><LinearGradient colors={['#070707', '#050505', '#110707']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />{starPoints.map(([left, top, size], index) => <View key={index} style={[styles.star, { left: `${left}%`, top: `${top}%`, width: size, height: size, opacity: size === 2 ? 0.46 : 0.26 }]} />)}<View style={styles.backdropGlowTop} /><View style={styles.backdropGlowBottom} /></View>;
}

function NameStep({ name, error, onChange }: { name: string; error: boolean; onChange: (name: string) => void }) {
  return <View style={styles.nameStep}><View><Text style={styles.stepCounter}>STEP 1 OF 6</Text><Text style={styles.nameTitle}>What should we call you?</Text><Text style={styles.nameLead}>Only used to greet you. It stays in your APEX profile.</Text><View style={[styles.nameInputShell, error && styles.inputError]}><User size={25} color={C.muted} strokeWidth={1.75} /><TextInput value={name} onChangeText={onChange} placeholder="Your name" placeholderTextColor={C.dim} autoCapitalize="words" style={styles.nameInput} maxLength={32} /></View></View></View>;
}

function PhotoStep({ photo, onPick }: { photo: string; onPick: () => void }) {
  return <View style={styles.photoStep}><View><Text style={styles.stepCounter}>STEP 2 OF 6</Text><Text style={styles.photoTitle}>Put a face to your profile</Text><Text style={styles.photoLead}>Optional. It stays on your phone and you can change it any time from your profile.</Text><Pressable style={styles.photoUploadCard} onPress={onPick}><View style={styles.photoAvatar}>{photo ? <Image source={{ uri: photo }} style={styles.photoAvatarImage} /> : <User size={56} color={C.dim} strokeWidth={1.45} />}<View style={styles.photoCamera}><Camera size={19} color={C.white} strokeWidth={2.2} /></View></View><Text style={styles.addPhotoText}>{photo ? 'Change photo' : 'Add a photo'}</Text></Pressable></View></View>;
}

function UnitStep({ profile, onSelect }: { profile: Profile; onSelect: (unit: Unit) => void }) {
  const selection = useRef(new Animated.Value(profile.unit === 'kg' ? 0 : 1)).current;
  const weightFor = (unit: Unit) => {
    const raw = unit === profile.unit ? profile.weight : unit === 'lb' ? profile.weight * 2.20462 : profile.weight / 2.20462;
    return unit === 'lb' ? (Math.round(raw * 10) / 10).toFixed(1) : String(Math.round(raw * 10) / 10);
  };
  const heightFor = (unit: Unit) => {
    if (unit === 'kg') return `${profile.height} cm`;
    const inches = Math.round(profile.height / 2.54);
    return `${Math.floor(inches / 12)}'${inches % 12}\"`;
  };
  const chooseUnit = (unit: Unit) => {
    Animated.spring(selection, { toValue: unit === 'kg' ? 0 : 1, friction: 7, tension: 100, useNativeDriver: true }).start();
    onSelect(unit);
  };
  return <View style={styles.unitStep}><View><Text style={styles.stepCounter}>STEP 3 OF 6</Text><Text style={styles.unitTitle}>Kilos or pounds?</Text><Text style={styles.unitLead}>Sets your workout weights and body-metric units.</Text><View style={styles.unitCards}>{(['kg', 'lb'] as Unit[]).map((unit, index) => { const selected = profile.unit === unit; const scale = selection.interpolate({ inputRange: [0, 1], outputRange: index === 0 ? [1.025, 1] : [1, 1.025] }); return <Animated.View key={unit} style={[styles.unitCardAnimation, { transform: [{ scale }] }]}><Pressable onPress={() => chooseUnit(unit)} style={[styles.unitCard, selected && styles.unitCardSelected]}>{selected && <View style={styles.unitCheck}><Check size={15} color={C.black} strokeWidth={3} /></View>}<Text style={[styles.unitSymbol, selected && styles.unitSymbolSelected]}>{unit}</Text><Text style={styles.unitDetail}>{weightFor(unit)} {unit} · {heightFor(unit)}</Text></Pressable></Animated.View>; })}</View></View></View>;
}

function MetricsStep({ profile, onChange }: { profile: Profile; onChange: (update: Partial<Profile>) => void }) {
  const [field, setField] = useState<'age' | 'height' | 'weight' | null>(null);
  const heightLabel = profile.unit === 'kg' ? `${profile.height} cm` : (() => { const inches = Math.round(profile.height / 2.54); return `${Math.floor(inches / 12)}'${inches % 12}\"`; })();
  const weightLabel = profile.unit === 'lb' ? `${Number(profile.weight).toFixed(1)} lb` : `${profile.weight} kg`;
  const rows = [{ field: 'age' as const, icon: CalendarDays, label: 'Age', value: `${profile.age}` }, { field: 'height' as const, icon: Ruler, label: 'Height', value: heightLabel }, { field: 'weight' as const, icon: Weight, label: 'Weight', value: weightLabel }];
  const saveMetric = (value: number) => { if (field) onChange({ [field]: value } as Partial<Profile>); setField(null); };
  return <View style={styles.metricsStep}><View><Text style={styles.stepCounter}>STEP 4 OF 6</Text><Text style={styles.metricsTitle}>A few numbers</Text><Text style={styles.metricsLead}>They personalize your plan. You can change them any time in your profile.</Text><View style={styles.metricsCard}><View style={styles.sexRow}><View style={styles.metricRowStart}><User size={23} color={C.muted} strokeWidth={1.7} /><Text style={styles.metricLabelText}>Sex</Text></View><View style={styles.sexToggle}>{(['male', 'female'] as const).map((sex) => <Pressable key={sex} onPress={() => onChange({ sex })} style={[styles.sexOption, profile.sex === sex && styles.sexOptionActive]}><Text style={[styles.sexOptionText, profile.sex === sex && styles.sexOptionTextActive]}>{sex === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}</View></View>{rows.map(({ field: rowField, icon: Icon, label, value }) => <Pressable key={rowField} onPress={() => setField(rowField)} style={styles.metricSelectRow}><View style={styles.metricRowStart}><Icon size={23} color={C.muted} strokeWidth={1.7} /><Text style={styles.metricLabelText}>{label}</Text></View><View style={styles.metricRowEnd}><Text style={styles.metricValueText}>{value}</Text><ChevronRight size={21} color={C.dim} /></View></Pressable>)}</View></View>{field && <MetricPickerSheet field={field} profile={profile} onSet={saveMetric} onClose={() => setField(null)} />}</View>;
}

function TrainingFrequencyStep({ frequency, error, onChange }: { frequency: number; error: boolean; onChange: (frequency: number) => void }) {
  const buttonScales = useRef(Array.from({ length: 7 }, () => new Animated.Value(1))).current;
  const selectFrequency = (value: number, index: number) => {
    Animated.sequence([
      Animated.timing(buttonScales[index], { toValue: 0.9, duration: 70, useNativeDriver: true }),
      Animated.spring(buttonScales[index], { toValue: 1, friction: 5, tension: 135, useNativeDriver: true }),
    ]).start();
    onChange(value === frequency ? 0 : value);
  };
  const goalText = frequency === 1 ? '1 session a week' : `${frequency} sessions a week`;

  return <View style={styles.frequencyStep}><View><Text style={styles.stepCounter}>STEP 5 OF 6</Text><Text style={styles.frequencyTitle}>How often do you train?</Text><Text style={styles.frequencyLead}>Sets your weekly goal ring. Be honest, not ambitious.</Text><View style={[styles.frequencyCard, error && styles.frequencyCardError]}><Text style={styles.frequencyEyebrow}>WEEKLY GOAL</Text><Text style={[styles.frequencyValue, !frequency && styles.frequencyValueMuted]}>{frequency ? goalText : 'Choose your weekly goal'}</Text><View style={styles.frequencyButtons}>{Array.from({ length: 7 }, (_, index) => { const value = index + 1; const selected = value <= frequency; return <Animated.View key={value} style={{ transform: [{ scale: buttonScales[index] }] }}><Pressable accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${value} ${value === 1 ? 'session' : 'sessions'} a week`} onPress={() => selectFrequency(value, index)} style={[styles.frequencyButton, selected && styles.frequencyButtonSelected]}><Text style={[styles.frequencyButtonText, selected && styles.frequencyButtonTextSelected]}>{value}</Text></Pressable></Animated.View>; })}</View></View>{error ? <Text style={styles.frequencyError}>Select at least one session to continue.</Text> : null}</View></View>;
}

function TrainingLocationStep({ locations, error, onChange }: { locations: TrainingPlace[]; error: boolean; onChange: (locations: TrainingPlace[]) => void }) {
  const pressScales = useRef(Array.from({ length: 3 }, () => new Animated.Value(1))).current;
  const options: { key: TrainingPlace; title: string; detail: string; icon: typeof Dumbbell }[] = [
    { key: 'gym', title: 'Gym', detail: `${guideLocationCounts.gym} equipment-matched exercise guides`, icon: Dumbbell },
    { key: 'home', title: 'Home', detail: `${guideLocationCounts.home} home-friendly exercise guides`, icon: House },
    { key: 'outdoors', title: 'Outdoors', detail: `${guideLocationCounts.outdoors} open-air exercise guides`, icon: MapPin },
  ];
  const toggleLocation = (location: TrainingPlace, index: number) => {
    Animated.sequence([
      Animated.timing(pressScales[index], { toValue: 0.985, duration: 65, useNativeDriver: true }),
      Animated.spring(pressScales[index], { toValue: 1, friction: 5, tension: 150, useNativeDriver: true }),
    ]).start();
    onChange(locations.includes(location) ? locations.filter((item) => item !== location) : [...locations, location]);
  };

  return <View style={styles.locationStep}><View><Text style={styles.stepCounter}>STEP 6 OF 6</Text><Text style={styles.locationStepTitle}>Where do you train?</Text><Text style={styles.locationStepLead}>Pick every place you train. We’ll only recommend sessions that fit each space.</Text><View style={[styles.locationListCard, error && styles.locationListCardError]}>{options.map(({ key, title, detail, icon: Icon }, index) => { const selected = locations.includes(key); return <Animated.View key={key} style={[styles.locationRowWrap, index !== options.length - 1 && styles.locationRowDivider, { transform: [{ scale: pressScales[index] }] }]}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={`${title}, ${selected ? 'selected' : 'not selected'}`} onPress={() => toggleLocation(key, index)} style={[styles.locationOption, selected && styles.locationOptionSelected]}><View style={[styles.locationOptionIcon, selected && styles.locationOptionIconSelected]}><Icon size={24} color={selected ? C.redBright : C.muted} strokeWidth={1.65} /></View><View style={styles.locationOptionCopy}><Text style={styles.locationOptionTitle}>{title}</Text><Text style={styles.locationOptionDetail}>{detail}</Text></View>{selected ? <View style={styles.locationOptionCheck}><Check size={15} color={C.white} strokeWidth={2.7} /></View> : null}</Pressable></Animated.View>; })}</View>{error ? <Text style={styles.locationError}>Pick at least one training space to continue.</Text> : null}</View></View>;
}

function MetricPickerSheet({ field, profile, onSet, onClose }: { field: 'age' | 'height' | 'weight'; profile: Profile; onSet: (value: number) => void; onClose: () => void }) {
  const initial = field === 'age' ? profile.age : field === 'height' ? profile.height : profile.weight;
  const [value, setValue] = useState(initial);
  const values = field === 'age' ? Array.from({ length: 71 }, (_, index) => index + 10) : field === 'height' ? Array.from({ length: 91 }, (_, index) => index + 130).reverse() : Array.from({ length: profile.unit === 'kg' ? 291 : 3201 }, (_, index) => profile.unit === 'kg' ? 35 + index * 0.5 : Number((77 + index * 0.1).toFixed(1)));
  const title = field === 'age' ? 'AGE' : field === 'height' ? 'Height' : 'Weight';
  const suffix = field === 'weight' ? profile.unit : field === 'height' ? 'cm' : '';
  const display = field === 'weight' ? value.toFixed(1) : String(Math.round(value));
  return <Modal visible transparent animationType="slide" onRequestClose={onClose}><View style={styles.metricPickerOverlay}><Pressable style={StyleSheet.absoluteFill} onPress={onClose} /><View style={styles.metricPickerSheet}><View style={styles.metricPickerHandle} /><View style={styles.metricPickerHeader}><Text style={styles.metricPickerLabel}>{title}</Text><Ruler size={23} color={C.muted} strokeWidth={1.7} /></View>{field === 'height' ? <View style={styles.heightPickerArea}><View style={styles.heightDisplay}><Text style={styles.metricPickerValue}>{display}</Text><Text style={styles.metricPickerSuffix}>{suffix}</Text></View><VerticalRuler values={values} value={value} onChange={setValue} /></View> : <View style={styles.horizontalPickerArea}><View style={styles.metricPickerDisplay}><Text style={styles.metricPickerValue}>{display}</Text>{suffix ? <Text style={styles.metricPickerSuffix}>{suffix}</Text> : null}</View><HorizontalRuler values={values} value={value} onChange={setValue} showLabels /></View>}<Pressable style={styles.metricPickerSet} onPress={() => onSet(value)}><Text style={styles.metricPickerSetText}>SET</Text></Pressable></View></View></Modal>;
}

function HorizontalRuler({ values, value, onChange, showLabels }: { values: number[]; value: number; onChange: (value: number) => void; showLabels?: boolean }) {
  const itemWidth = 17;
  const list = useRef<FlatList<number>>(null);
  const inset = Math.max(100, Math.floor(Dimensions.get('window').width / 2 - itemWidth / 2));
  const selectedIndex = Math.max(0, values.findIndex((item) => Math.abs(item - value) < 0.01));
  useEffect(() => { const timeout = setTimeout(() => list.current?.scrollToOffset({ offset: selectedIndex * itemWidth, animated: false }), 80); return () => clearTimeout(timeout); }, []);
  return <View style={styles.horizontalRuler}><View pointerEvents="none" style={styles.horizontalRulerMarker} /><FlatList ref={list} horizontal data={values} keyExtractor={(item) => String(item)} showsHorizontalScrollIndicator={false} snapToInterval={itemWidth} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: inset }} onMomentumScrollEnd={(event) => { const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.x / itemWidth))); onChange(values[index]); }} renderItem={({ item }) => { const rounded = Math.round(item); const major = fieldMajor(item); const label = showLabels && major ? String(rounded) : ''; return <View style={styles.horizontalTickWrap}><View style={[styles.horizontalTick, major && styles.horizontalTickMajor]} /><Text style={styles.horizontalTickLabel}>{label}</Text></View>; }} /></View>;
}

function VerticalRuler({ values, value, onChange }: { values: number[]; value: number; onChange: (value: number) => void }) {
  const itemHeight = 17;
  const list = useRef<FlatList<number>>(null);
  const selectedIndex = Math.max(0, values.findIndex((item) => item === value));
  useEffect(() => { const timeout = setTimeout(() => list.current?.scrollToOffset({ offset: selectedIndex * itemHeight, animated: false }), 80); return () => clearTimeout(timeout); }, []);
  return <View style={styles.verticalRuler}><View pointerEvents="none" style={styles.verticalRulerMarker} /><FlatList ref={list} data={values} keyExtractor={(item) => String(item)} showsVerticalScrollIndicator={false} snapToInterval={itemHeight} decelerationRate="fast" contentContainerStyle={{ paddingVertical: 145 }} onMomentumScrollEnd={(event) => { const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.y / itemHeight))); onChange(values[index]); }} renderItem={({ item }) => { const major = item % 10 === 0; return <View style={styles.verticalTickWrap}><Text style={styles.verticalTickLabel}>{major ? item : ''}</Text><View style={[styles.verticalTick, major && styles.verticalTickMajor]} /></View>; }} /></View>;
}

function fieldMajor(value: number): boolean {
  return Number.isInteger(value) && Math.round(value) % 5 === 0;
}

function WelcomeLanding({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const benefits = [
    { icon: Target, title: 'Built around your training', copy: 'Shape every session around your schedule, gym space, and strength goals.' },
    { icon: House, title: 'Online or offline', copy: 'Train without a signal, then go online whenever you want to stay connected.' },
    { icon: CircleUserRound, title: 'Share your progress', copy: 'Celebrate milestones with the APEX community while keeping your private logs in your control.' },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.welcomeScroll} contentContainerStyle={styles.welcomeScrollContent} showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.welcomeHero}>
          <Image source={require('../assets/onboarding-hero.jpg')} style={styles.welcomeHeroImage} resizeMode="cover" />
          <LinearGradient colors={['rgba(5,5,5,0.04)', 'rgba(5,5,5,0.04)', C.black]} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.storyHeader}><View style={styles.storySegments}>{Array.from({ length: 7 }, (_, index) => <View key={index} style={[styles.storySegment, index === 0 && styles.storySegmentActive]} />)}</View><Pressable onPress={onSkip} hitSlop={12}><Text style={styles.skipWelcome}>SKIP</Text></Pressable></View>
        </View>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeEyebrow}>WELCOME TO.</Text>
          <Text style={styles.welcomeTitle}>APEX Workout</Text>
          <Text style={styles.welcomeLead}>Train your way — offline wherever you are, online when you want to connect, share wins, and keep moving forward.</Text>
          <View style={styles.welcomeBenefits}>{benefits.map(({ icon: Icon, title, copy }, index) => <View key={title} style={[styles.welcomeBenefit, index !== benefits.length - 1 && styles.welcomeBenefitBorder]}><View style={styles.welcomeBenefitIcon}><Icon size={22} color={C.muted} strokeWidth={1.8} /></View><View style={styles.flex}><Text style={styles.welcomeBenefitTitle}>{title}</Text><Text style={styles.welcomeBenefitCopy}>{copy}</Text></View></View>)}</View>
        </View>
      </ScrollView>
      <View style={styles.welcomeFooter}><Pressable style={styles.welcomeNext} onPress={onNext}><Text style={styles.welcomeNextText}>NEXT</Text><ArrowRight size={19} color={C.white} /></Pressable></View>
    </SafeAreaView>
  );
}

function NumberWheel({ label, suffix, values, value, onChange }: { label: string; suffix: string; values: number[]; value: number; onChange: (value: number) => void }) {
  const itemHeight = 44;
  const list = useRef<FlatList<number>>(null);
  useEffect(() => { const index = Math.max(0, values.indexOf(value)); const timeout = setTimeout(() => list.current?.scrollToOffset({ offset: index * itemHeight, animated: false }), 100); return () => clearTimeout(timeout); }, []);
  return <View style={styles.wheelBox}><Text style={styles.wheelLabel}>{label}</Text><View style={styles.wheelClip}><View pointerEvents="none" style={styles.wheelLines} /><FlatList ref={list} data={values} keyExtractor={(item) => String(item)} showsVerticalScrollIndicator={false} snapToInterval={itemHeight} decelerationRate="fast" contentContainerStyle={{ paddingVertical: itemHeight }} onMomentumScrollEnd={(event) => { const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.y / itemHeight))); onChange(values[index]); }} renderItem={({ item }) => <View style={[styles.wheelItem, item === value && styles.wheelItemSelected]}><Text style={[styles.wheelText, item === value && styles.wheelTextSelected]}>{item}</Text></View>} /></View><Text style={styles.wheelSuffix}>{suffix}</Text></View>;
}

function Dashboard({ profile, sessions, meals, onSessionsChange, onMealsChange, onEditProfile }: { profile: Profile; sessions: WorkoutSession[]; meals: Meal[]; onSessionsChange: (session: WorkoutSession) => void; onMealsChange: (meals: Meal[]) => void; onEditProfile: () => void }) {
  const [tab, setTab] = useState<'home' | 'plan' | 'progress' | 'profile'>('home');
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [fuelOpen, setFuelOpen] = useState(false);
  const today = localDay();
  const todaySessions = sessions.filter((session) => localDay(new Date(session.finishedAt)) === today);
  const todayVolumeKg = todaySessions.reduce((sum, session) => sum + session.volumeKg, 0);
  const todayCalories = meals.filter((meal) => meal.day === today).reduce((sum, meal) => sum + meal.calories, 0);
  const target = Math.round((profile.unit === 'lb' ? profile.weight / 2.20462 : profile.weight) * 33 / 25) * 25;
  const templateKey = recommendedKey(profile, todaySessions.length);
  const startWorkout = (key: TemplateKey = templateKey) => setActiveWorkout(createWorkout(key, profile));
  const finishWorkout = (session: WorkoutSession) => { onSessionsChange(session); setActiveWorkout(null); setTab('home'); };

  const content = tab === 'home'
    ? <HomePage profile={profile} todaySessions={todaySessions.length} todayVolumeKg={todayVolumeKg} todayCalories={todayCalories} target={target} templateKey={templateKey} onStart={() => startWorkout()} onFuel={() => setFuelOpen(true)} onProfile={onEditProfile} />
    : tab === 'plan'
      ? <PlanPage profile={profile} sessions={sessions} onStart={startWorkout} />
      : tab === 'progress'
        ? <ProgressPage profile={profile} sessions={sessions} />
        : <ProfilePage profile={profile} onEdit={onEditProfile} />;

  return <SafeAreaView style={styles.screen}><View style={styles.dashboard}>{content}</View><View style={styles.tabBar}>{([{ key: 'home', label: 'HOME', icon: Home }, { key: 'plan', label: 'PLAN', icon: NotebookTabs }, { key: 'progress', label: 'PROGRESS', icon: BarChart3 }, { key: 'profile', label: 'PROFILE', icon: CircleUserRound }] as const).map(({ key, label, icon: Icon }) => <Pressable key={key} style={styles.tabButton} onPress={() => setTab(key)}><Icon size={22} color={tab === key ? C.redBright : C.dim} /><Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text></Pressable>)}</View><WorkoutModal profile={profile} workout={activeWorkout} onClose={() => setActiveWorkout(null)} onFinish={finishWorkout} /><FuelModal visible={fuelOpen} profile={profile} meals={meals} target={target} onClose={() => setFuelOpen(false)} onChange={onMealsChange} /></SafeAreaView>;
}

function HomePage({ profile, todaySessions, todayVolumeKg, todayCalories, target, templateKey, onStart, onFuel, onProfile }: { profile: Profile; todaySessions: number; todayVolumeKg: number; todayCalories: number; target: number; templateKey: TemplateKey; onStart: () => void; onFuel: () => void; onProfile: () => void }) {
  const template = templates[templateKey];
  const displayVolume = profile.unit === 'lb' ? todayVolumeKg * 2.20462 : todayVolumeKg;
  const date = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}><View style={styles.homeHeader}><View><Text style={styles.dateText}>{date}</Text><Text style={styles.greeting}>Good to see you,{`\n`}<Text style={styles.redText}>{profile.name || 'Athlete'}</Text></Text></View><Pressable style={styles.profileButton} onPress={onProfile}>{profile.photo ? <Image source={{ uri: profile.photo }} style={styles.profileButtonImage} /> : <User size={21} color={C.white} />}</Pressable></View><LinearGradient colors={[C.red, C.redDeep]} style={styles.focusCard}><View style={styles.cardTop}><Text style={styles.cardEyebrowLight}>TODAY'S FOCUS</Text><Target size={20} color={C.white} /></View><Text style={styles.focusTitle}>{todaySessions ? 'Session complete.\nRecover with intent.' : `${template.title.replace(' ', '\n')}.`}</Text><Text style={styles.focusCopy}>{todaySessions ? 'Your work is saved on this device. Review your next training day in the plan.' : template.description}</Text><Pressable style={styles.lightButton} onPress={onStart}><Play size={17} color={C.black} fill={C.black} /><Text style={styles.lightButtonText}>{todaySessions ? 'START ANOTHER SESSION' : 'START WORKOUT'}</Text></Pressable></LinearGradient><SectionTitle title="Today at a glance" action={<Pressable onPress={onFuel}><Utensils size={20} color={C.redBright} /></Pressable>} /><View style={styles.metricsRow}><Metric icon={Dumbbell} value={String(todaySessions)} label="SESSIONS" /><Metric icon={TrendingUp} value={formatNumber(displayVolume)} label={`VOLUME ${unitLabel(profile.unit)}`} /><Metric icon={Flame} value={formatNumber(todayCalories)} label="CALORIES" /></View><SectionTitle title="Daily fuel" action={<Pressable onPress={onFuel}><Text style={styles.textAction}>LOG</Text></Pressable>} /><Pressable style={styles.fuelCard} onPress={onFuel}><View style={styles.smallIconBox}><Flame size={21} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.fuelValue}>{formatNumber(todayCalories)} of {formatNumber(target)} kcal</Text><Text style={styles.fuelCopy}>{todayCalories ? `${formatNumber(Math.max(0, target - todayCalories))} kcal left in your flexible daily guide.` : 'Keep the work supported.'}</Text></View><ChevronRight size={18} color={C.muted} /></Pressable><SectionTitle title="Your foundation" action={<Pressable onPress={onProfile}><Text style={styles.textAction}>EDIT</Text></Pressable>} /><Pressable style={styles.foundationCard} onPress={onProfile}><View style={styles.smallIconBox}><TrendingUp size={20} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.foundationTitle}>{profile.frequency} training days. {locationTitle(profile.trainingLocations)}.</Text><Text style={styles.foundationCopy}>Using {unitLabel(profile.unit)}, {profile.height} cm, and {profile.weight} {profile.unit}. Everything stays local.</Text></View><ChevronRight size={18} color={C.muted} /></Pressable></ScrollView>;
}

function PlanPage({ profile, sessions, onStart }: { profile: Profile; sessions: WorkoutSession[]; onStart: (key: TemplateKey) => void }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const plan = plannedKeys(profile);
  const weeklySessions = sessions.filter((session) => Date.now() - new Date(session.finishedAt).getTime() < 7 * 86400000).length;
  return <><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}><PageHeader eyebrow="YOUR ROUTINE" title="Training plan." action={<Pressable style={styles.headerAction} onPress={() => onStart(plan[0])}><Play size={19} color={C.white} fill={C.white} /></Pressable>} /><View style={styles.planHero}><Text style={styles.cardEyebrow}>WEEKLY RHYTHM</Text><Text style={styles.planNumber}>{profile.frequency}</Text><Text style={styles.planSubtitle}>training days, built for consistency.</Text><View style={styles.weekDots}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <View key={`${day}-${index}`} style={[styles.dayDot, index < profile.frequency && styles.dayDotTraining, index === new Date().getDay() && styles.dayDotToday]}><Text style={[styles.dayDotText, index < profile.frequency && styles.dayDotTextTraining]}>{day}</Text></View>)}</View></View><Pressable style={styles.guideLaunchCard} onPress={() => setGuideOpen(true)}><View style={styles.guideLaunchIcon}><Dumbbell size={22} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.guideLaunchEyebrow}>EXERCISE GUIDE</Text><Text style={styles.guideLaunchTitle}>{exerciseCatalog.length} movement guides</Text><Text style={styles.guideLaunchCopy}>Muscles, setup, cues and step-by-step form.</Text></View><ChevronRight size={20} color={C.muted} /></Pressable><SectionTitle title="This week's sessions" action={<Text style={styles.sectionCount}>{weeklySessions} / {profile.frequency}</Text>} /><View style={styles.stack}>{plan.map((key, index) => { const template = templates[key]; return <View key={`${key}-${index}`} style={styles.planCard}><Text style={styles.planIndex}>{String(index + 1).padStart(2, '0')}</Text><View style={styles.flex}><Text style={styles.planLabel}>{index === 0 ? 'NEXT UP' : `SESSION ${index + 1}`}</Text><Text style={styles.planTitle}>{template.title}</Text><Text numberOfLines={1} style={styles.planCopy}>{template.exercises.slice(0, 2).map((exercise) => exercise[0]).join(' · ')}</Text></View><Pressable style={styles.playCircle} onPress={() => onStart(key)}><Play size={15} color={C.redBright} fill={C.redBright} /></Pressable></View>; })}</View><SectionTitle title="Templates" action={<Text style={styles.sectionCount}>START ANY TIME</Text>} /><View style={styles.templateGrid}>{(['full', 'upper', 'lower', profile.trainingLocations.includes('gym') ? 'push' : 'home'] as TemplateKey[]).map((key) => <Pressable key={key} style={styles.templateCard} onPress={() => onStart(key)}><Dumbbell size={24} color={C.redBright} /><Text style={styles.templateTitle}>{templates[key].title}</Text><Text style={styles.templateCopy}>{templates[key].exercises.length} exercises</Text></Pressable>)}</View></ScrollView><ExerciseGuideLibraryModal visible={guideOpen} onClose={() => setGuideOpen(false)} /></>;
}

function ProgressPage({ profile, sessions }: { profile: Profile; sessions: WorkoutSession[] }) {
  const totalKg = sessions.reduce((sum, session) => sum + session.volumeKg, 0);
  const displayTotal = profile.unit === 'lb' ? totalKg * 2.20462 : totalKg;
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return date; });
  const volumes = days.map((date) => sessions.filter((session) => localDay(new Date(session.finishedAt)) === localDay(date)).reduce((sum, session) => sum + session.volumeKg, 0));
  const max = Math.max(1, ...volumes);
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}><PageHeader eyebrow="TRAINING DATA" title="Progress." action={<Text style={styles.localPill}>LOCAL</Text>} /><View style={styles.progressHero}><Text style={styles.cardEyebrow}>ALL-TIME VOLUME</Text><Text style={styles.progressNumber}>{formatNumber(displayTotal)} <Text style={styles.volumeUnit}>{unitLabel(profile.unit)}</Text></Text><Text style={styles.progressCopy}>{sessions.length ? `${sessions.length} completed ${sessions.length === 1 ? 'session' : 'sessions'} stored on this device.` : 'Your logged volume will build here.'}</Text></View><SectionTitle title="Last 7 days" action={<Text style={styles.sectionCount}>{sessions.filter((session) => Date.now() - new Date(session.finishedAt).getTime() < 7 * 86400000).length} SESSIONS</Text>} /><View style={styles.chart}>{days.map((day, index) => <View key={day.toISOString()} style={styles.chartColumn}><Text style={styles.chartValue}>{volumes[index] ? formatNumber(profile.unit === 'lb' ? volumes[index] * 2.20462 : volumes[index]) : ''}</Text><View style={styles.chartTrack}><View style={[styles.chartBar, { height: `${Math.max(6, Math.round((volumes[index] / max) * 100))}%` }]} /></View><Text style={styles.chartDay}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(day)}</Text></View>)}</View><SectionTitle title="Training history" action={null} /><View style={styles.stack}>{sessions.length ? [...sessions].sort((a, b) => new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime()).slice(0, 12).map((session) => <View key={session.id} style={styles.historyCard}><View style={styles.historyIcon}><Check size={18} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.historyTitle}>{session.title}</Text><Text style={styles.historyCopy}>{formatDate(session.finishedAt)} · {session.completedSets} completed sets</Text></View><Text style={styles.historyVolume}>{formatNumber(profile.unit === 'lb' ? session.volumeKg * 2.20462 : session.volumeKg)} {unitLabel(profile.unit)}</Text></View>) : <EmptyState icon={TrendingUp} title="Your history starts with one set." copy="Complete a session and your training volume will appear here." />}</View></ScrollView>;
}

function ProfilePage({ profile, onEdit }: { profile: Profile; onEdit: () => void }) {
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}><PageHeader eyebrow="ATHLETE PROFILE" title="Your setup." action={<Pressable style={styles.headerAction} onPress={onEdit}><User size={19} color={C.white} /></Pressable>} /><View style={styles.profileHero}><View style={styles.profilePortrait}>{profile.photo ? <Image source={{ uri: profile.photo }} style={styles.profilePortraitImage} /> : <User size={29} color={C.redBright} />}</View><View><Text style={styles.profileName}>{profile.name || 'Athlete'}</Text><Text style={styles.profileContext}>{profile.frequency} days / {locationTitle(profile.trainingLocations)}</Text></View></View><View style={styles.profileStats}>{[['BODY WEIGHT', `${profile.weight} ${unitLabel(profile.unit)}`], ['HEIGHT', `${profile.height} CM`], ['AGE', String(profile.age)]].map(([label, value]) => <View key={label} style={styles.profileStat}><Text style={styles.profileStatLabel}>{label}</Text><Text style={styles.profileStatValue}>{value}</Text></View>)}</View><SectionTitle title="Data & privacy" action={null} /><View style={styles.stack}><View style={styles.settingRow}><View style={styles.smallIconBox}><CircleUserRound size={20} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.settingTitle}>Stored on this device</Text><Text style={styles.settingCopy}>Profile, sessions, and meals stay local.</Text></View></View><Pressable style={styles.settingRow} onPress={onEdit}><View style={styles.smallIconBox}><Target size={20} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.settingTitle}>Update training setup</Text><Text style={styles.settingCopy}>Units, body metrics, schedule, and location.</Text></View><ChevronRight size={18} color={C.muted} /></Pressable></View></ScrollView>;
}

function WorkoutModal({ profile, workout, onClose, onFinish }: { profile: Profile; workout: ActiveWorkout | null; onClose: () => void; onFinish: (session: WorkoutSession) => void }) {
  const [rest, setRest] = useState(0);
  const [guide, setGuide] = useState<ExerciseGuide | null>(null);
  const [, setClock] = useState(0);
  useEffect(() => { if (!workout) return; const id = setInterval(() => setClock((value) => value + 1), 1000); return () => clearInterval(id); }, [workout]);
  useEffect(() => { if (!rest) return; const id = setInterval(() => setRest((value) => Math.max(0, value - 1)), 1000); return () => clearInterval(id); }, [rest]);
  if (!workout) return null;
  const elapsed = Math.max(0, Math.floor((Date.now() - new Date(workout.startedAt).getTime()) / 1000));
  const completedSets = workout.exercises.flatMap((exercise) => exercise.sets.filter((set) => set.complete));
  const mutateExercise = (exerciseId: string, transform: (exercise: ActiveExercise) => ActiveExercise) => { const next = workout.exercises.map((exercise) => exercise.id === exerciseId ? transform(exercise) : exercise); Object.assign(workout, { exercises: next }); setClock((value) => value + 1); };
  const toggleSet = (exerciseId: string, setId: string) => mutateExercise(exerciseId, (exercise) => ({ ...exercise, sets: exercise.sets.map((set) => set.id === setId ? { ...set, complete: !set.complete } : set) }));
  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => mutateExercise(exerciseId, (exercise) => ({ ...exercise, sets: exercise.sets.map((set) => set.id === setId ? { ...set, [field]: Math.max(0, Number(value.replace(',', '.')) || 0) } : set) }));
  const addSet = (exerciseId: string) => mutateExercise(exerciseId, (exercise) => ({ ...exercise, sets: [...exercise.sets, { id: uid('set'), weight: exercise.sets.at(-1)?.weight ?? 0, reps: exercise.sets.at(-1)?.reps ?? 10, complete: false }] }));
  const finish = () => { const volumeKg = completedSets.reduce((sum, set) => sum + toKg(set.weight, profile.unit) * set.reps, 0); onFinish({ id: workout.id, title: workout.title, finishedAt: new Date().toISOString(), completedSets: completedSets.length, volumeKg }); };
  const openGuide = (exerciseName: string) => { const match = findExerciseGuide(exerciseName); if (match) { setGuide(match); return; } Alert.alert('Guide coming soon', `We have not matched ${exerciseName} to the local guide catalog yet.`); };
  return <Modal visible animationType="slide" presentationStyle="fullScreen"><SafeAreaView style={styles.workoutScreen}><View style={styles.workoutHeader}><Pressable style={styles.modalBack} onPress={onClose}><ChevronDown size={22} color={C.white} /></Pressable><View style={styles.workoutHeaderMiddle}><Text style={styles.workoutStatus}>ACTIVE SESSION</Text><Text style={styles.workoutTimer}>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</Text></View><Pressable onPress={() => Alert.alert('Discard workout?', 'This unfinished session will not be saved.', [{ text: 'Keep training', style: 'cancel' }, { text: 'Discard', style: 'destructive', onPress: onClose }])}><Text style={styles.discardText}>DISCARD</Text></Pressable></View><ScrollView contentContainerStyle={styles.workoutScroll}><Eyebrow>{workout.label}</Eyebrow><Title>{workout.title}</Title><Text style={styles.workoutIntro}>{completedSets.length} completed sets · {unitLabel(profile.unit)} selected</Text>{workout.exercises.map((exercise, exerciseIndex) => <View key={exercise.id} style={styles.exerciseCard}><Pressable style={styles.exerciseHeader} onPress={() => openGuide(exercise.name)}><Text style={styles.exerciseNumber}>{String(exerciseIndex + 1).padStart(2, '0')}</Text><View style={styles.flex}><Text style={styles.exerciseTitle}>{exercise.name}</Text><Text style={styles.exerciseTarget}>{exercise.target}</Text></View><View style={styles.exerciseGuidePill}><Text style={styles.exerciseGuidePillText}>GUIDE</Text><ChevronRight size={15} color={C.redBright} /></View></Pressable><View style={styles.setHead}><Text style={styles.setHeadText}>SET</Text><Text style={[styles.setHeadText, styles.alignCenter]}>WEIGHT</Text><Text style={[styles.setHeadText, styles.alignCenter]}>REPS</Text><Text style={[styles.setHeadText, styles.alignCenter]}>DONE</Text></View>{exercise.sets.map((set, index) => <View key={set.id} style={styles.setRow}><Text style={[styles.setNumber, set.complete && styles.setCompleteNumber]}>{index + 1}</Text><TextInput keyboardType="decimal-pad" value={String(set.weight)} onChangeText={(value) => updateSet(exercise.id, set.id, 'weight', value)} style={styles.setInput} /><TextInput keyboardType="number-pad" value={String(set.reps)} onChangeText={(value) => updateSet(exercise.id, set.id, 'reps', value)} style={styles.setInput} /><Pressable onPress={() => toggleSet(exercise.id, set.id)} style={[styles.setCheck, set.complete && styles.setCheckComplete]}><Check size={17} color={set.complete ? C.white : 'transparent'} /></Pressable></View>)}<Pressable style={styles.addSetButton} onPress={() => addSet(exercise.id)}><Plus size={15} color={C.muted} /><Text style={styles.addSetText}>ADD SET</Text></Pressable></View>)}</ScrollView><View style={styles.workoutFooter}><Pressable style={styles.restButton} onPress={() => setRest(90)}><Timer size={18} color={C.redBright} /><Text style={styles.restText}>{rest ? `REST ${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, '0')}` : 'REST 90S'}</Text></Pressable><Pressable style={styles.primaryButton} onPress={finish}><Text style={styles.primaryButtonText}>FINISH WORKOUT</Text><Check size={18} color={C.white} /></Pressable></View><ExerciseGuideLibraryModal visible={Boolean(guide)} initialGuide={guide} onClose={() => setGuide(null)} /></SafeAreaView></Modal>;
}

function ExerciseGuideLibraryModal({ visible, onClose, initialGuide = null }: { visible: boolean; onClose: () => void; initialGuide?: ExerciseGuide | null }) {
  const [query, setQuery] = useState('');
  const [selectedGuide, setSelectedGuide] = useState<ExerciseGuide | null>(initialGuide);
  useEffect(() => { if (visible) { setQuery(''); setSelectedGuide(initialGuide); } }, [visible, initialGuide]);
  const guides = useMemo(() => searchExerciseGuides(query), [query]);
  const closeOrReturn = () => { if (initialGuide || !selectedGuide) onClose(); else setSelectedGuide(null); };

  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}><SafeAreaView style={styles.guideScreen}>{selectedGuide ? <ExerciseGuideDetail guide={selectedGuide} onBack={closeOrReturn} /> : <><View style={styles.guideHeader}><View><Text style={styles.guideHeaderEyebrow}>LOCAL EXERCISE GUIDE</Text><Text style={styles.guideHeaderTitle}>Move better.</Text></View><Pressable style={styles.modalBack} onPress={onClose}><X size={20} color={C.white} /></Pressable></View><View style={styles.guideSearch}><TextInput value={query} onChangeText={setQuery} placeholder="Search exercise, muscle, or equipment" placeholderTextColor={C.dim} style={styles.guideSearchInput} autoCapitalize="none" /><Text style={styles.guideSearchCount}>{query ? `${guides.length} RESULTS` : `${exerciseCatalog.length} GUIDES`}</Text></View><FlatList data={guides} keyExtractor={(guide) => guide.id} contentContainerStyle={styles.guideList} showsVerticalScrollIndicator={false} renderItem={({ item: guide }) => <Pressable style={styles.guideListRow} onPress={() => setSelectedGuide(guide)}><View style={styles.guideListMark}><Dumbbell size={19} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.guideListTitle}>{guide.name}</Text><Text style={styles.guideListCopy}>{guide.target} · {guide.equipment}</Text></View><ChevronRight size={19} color={C.dim} /></Pressable>} ListEmptyComponent={<EmptyState icon={Dumbbell} title="No guide found." copy="Try an exercise, muscle, or equipment name." />} ListFooterComponent={<Text style={styles.guideSourceNote}>{`${exerciseCatalog.length} guides · ${exerciseVideoCount} demo videos · MIT`}</Text>} /></>}</SafeAreaView></Modal>;
}

function ExerciseDemo({ guide }: { guide: ExerciseGuide }) {
  const entry = useMemo(() => findGuideVideo(guide), [guide]);
  const [variant, setVariant] = useState<VideoVariant>('male');
  const clip = entry ? pickClip(entry, variant) : null;
  const player = useVideoPlayer(clip?.url ?? null, (instance) => {
    // Silent looping preview: no controls, no audio, no fullscreen.
    instance.loop = true;
    instance.muted = true;
    instance.volume = 0;
    instance.timeUpdateEventInterval = 0;
  });
  const url = clip?.url ?? null;
  useEffect(() => {
    if (!url) return;
    const start = async () => {
      try {
        // expo-video exposes replaceAsync (newer) / replace (older SDKs).
        const handle = player as unknown as { replaceAsync?: (source: string) => Promise<void>; replace?: (source: string) => void };
        if (typeof handle.replaceAsync === 'function') await handle.replaceAsync(url);
        else if (typeof handle.replace === 'function') handle.replace(url);
        player.loop = true;
        player.muted = true;
        player.volume = 0;
        player.play();
      } catch (_) {}
    };
    start();
  }, [url, player]);

  const hasBoth = Boolean(entry?.videos.male && entry?.videos.female);

  if (!clip) {
    return <View style={styles.guideDemoPanel}><View style={styles.guideDemoIcon}><Play size={23} color={C.redBright} fill={C.redBright} /></View><Text style={styles.guideDemoEyebrow}>DEMO MEDIA</Text><Text style={styles.guideDemoTitle}>No demo clip yet</Text><Text style={styles.guideDemoCopy}>This movement is not in the bundled demo library, so no unverified media is loaded.</Text></View>;
  }

  return (
    <View style={styles.demoCard}>
      <View style={styles.demoFrame}>
        <VideoView player={player} style={styles.demoVideo} nativeControls={false} contentFit="contain" allowsFullscreen={false} />
        <View style={styles.demoLoopBadge}><Repeat size={11} color={C.redBright} /><Text style={styles.demoLoopText}>LOOP</Text></View>
      </View>
      <View style={styles.demoFooter}>
        <View style={styles.demoMeta}>
          <Text style={styles.guideDemoEyebrow}>DEMO MEDIA</Text>
          <Text style={styles.demoCaption}>{clip.variant === 'female' ? 'Female demonstration' : 'Male demonstration'}</Text>
        </View>
        {hasBoth ? (
          <View style={styles.demoVariants}>
            {(['male', 'female'] as VideoVariant[]).map((key) => (
              <Pressable key={key} onPress={() => setVariant(key)} style={[styles.demoVariant, variant === key && styles.demoVariantActive]}>
                <Text style={[styles.demoVariantText, variant === key && styles.demoVariantTextActive]}>{key === 'male' ? 'HIM' : 'HER'}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ExerciseGuideDetail({ guide, onBack }: { guide: ExerciseGuide; onBack: () => void }) {
  return <><View style={styles.guideHeader}><Pressable style={styles.modalBack} onPress={onBack}><ArrowLeft size={21} color={C.white} /></Pressable><Text style={styles.guideHeaderEyebrow}>EXERCISE GUIDE</Text><View style={styles.guideHeaderSpacer} /></View><ScrollView contentContainerStyle={styles.guideDetailScroll} showsVerticalScrollIndicator={false}><ExerciseDemo guide={guide} /><Text style={styles.guideDetailTitle}>{guide.name}</Text><Text style={styles.guideDetailDescription}>{guide.shortDescription}</Text><View style={styles.guideFacts}><View style={styles.guideFact}><Text style={styles.guideFactLabel}>PRIMARY TARGET</Text><Text style={styles.guideFactValue}>{guide.target}</Text></View><View style={styles.guideFact}><Text style={styles.guideFactLabel}>EQUIPMENT</Text><Text style={styles.guideFactValue}>{guide.equipment}</Text></View><View style={styles.guideFact}><Text style={styles.guideFactLabel}>LEVEL</Text><Text style={styles.guideFactValue}>{guide.difficulty}</Text></View></View><Text style={styles.guideSectionLabel}>SECONDARY MUSCLES</Text><View style={styles.guideChips}>{guide.secondaryMuscles.map((muscle) => <View key={muscle} style={styles.guideChip}><Text style={styles.guideChipText}>{muscle}</Text></View>)}</View><Text style={styles.guideSectionLabel}>HOW TO DO IT</Text><View style={styles.guideSteps}>{guide.steps.map((step, index) => <View key={`${guide.id}-${index}`} style={styles.guideStep}><Text style={styles.guideStepNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={styles.guideStepText}>{step}</Text></View>)}</View><Text style={styles.guideSectionLabel}>FORM CUES</Text><View style={styles.guideCueCard}>{guide.formCues.map((cue) => <View key={cue} style={styles.guideCue}><Check size={16} color={C.redBright} strokeWidth={2.5} /><Text style={styles.guideCueText}>{cue}</Text></View>)}</View><Text style={styles.guideSectionLabel}>BREATHING</Text><Text style={styles.guideBreathing}>{guide.breathing}</Text><Text style={styles.guideSourceNote}>Exercise metadata bundled locally under the MIT license.</Text></ScrollView></>;
}

function FuelModal({ visible, profile, meals, target, onClose, onChange }: { visible: boolean; profile: Profile; meals: Meal[]; target: number; onClose: () => void; onChange: (next: Meal[]) => void }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const todayMeals = meals.filter((meal) => meal.day === localDay());
  const total = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const add = () => { const parsed = Math.round(Number(calories)); if (!name.trim() || parsed < 1) { Alert.alert('Add a meal name and calorie estimate.'); return; } onChange([...meals, { id: uid('meal'), name: name.trim(), calories: parsed, day: localDay() }]); setName(''); setCalories(''); };
  return <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen"><View style={styles.sheetShell}><Pressable style={styles.sheetScrim} onPress={onClose} /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetPanel}><View style={styles.sheetHandle} /><View style={styles.sheetHeader}><View><Eyebrow>DAILY FUEL</Eyebrow><Title>Fuel the work.</Title></View><Pressable style={styles.modalBack} onPress={onClose}><X size={20} color={C.white} /></Pressable></View><View style={styles.fuelTarget}><Text style={styles.fuelTargetLabel}>DAILY GUIDE</Text><Text style={styles.fuelTargetNumber}>{formatNumber(total)} / {formatNumber(target)} kcal</Text><Text style={styles.fuelTargetCopy}>{formatNumber(Math.max(0, target - total))} kcal remain in this flexible, local guide.</Text></View><ScrollView style={styles.mealList}>{todayMeals.length ? todayMeals.map((meal) => <View key={meal.id} style={styles.mealRow}><View style={styles.mealIcon}><Utensils size={18} color={C.redBright} /></View><View style={styles.flex}><Text style={styles.mealTitle}>{meal.name}</Text><Text style={styles.mealCopy}>Added today</Text></View><Text style={styles.mealCalories}>{formatNumber(meal.calories)} kcal</Text><Pressable onPress={() => onChange(meals.filter((item) => item.id !== meal.id))}><Trash2 size={18} color={C.dim} /></Pressable></View>) : <View style={styles.noMeals}><Utensils size={22} color={C.redBright} /><Text style={styles.noMealsText}>Nothing logged yet. Add a meal or snack below.</Text></View>}</ScrollView><Text style={styles.fieldLabel}>MEAL OR SNACK</Text><TextInput style={styles.textInputSmall} placeholder="Example: Post-workout meal" placeholderTextColor={C.dim} value={name} onChangeText={setName} maxLength={42} /><Text style={styles.fieldLabel}>ESTIMATED CALORIES</Text><TextInput style={styles.textInputSmall} placeholder="0" placeholderTextColor={C.dim} value={calories} onChangeText={setCalories} keyboardType="number-pad" /><Pressable style={styles.primaryButton} onPress={add}><Text style={styles.primaryButtonText}>ADD TO TODAY</Text><Plus size={18} color={C.white} /></Pressable></KeyboardAvoidingView></View></Modal>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Dumbbell; value: string; label: string }) { return <View style={styles.metric}><Icon size={18} color={C.redBright} /><Text style={styles.metricValue} numberOfLines={1}>{value}</Text><Text style={styles.metricLabel} numberOfLines={1}>{label}</Text></View>; }
function Eyebrow({ children }: { children: string }) { return <Text style={styles.eyebrow}>{children}</Text>; }
function Title({ children }: { children: React.ReactNode }) { return <Text style={styles.title}>{children}</Text>; }
function SectionTitle({ title, action }: { title: string; action: React.ReactNode }) { return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text>{action}</View>; }
function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action: React.ReactNode }) { return <View style={styles.pageHeader}><View><Eyebrow>{eyebrow}</Eyebrow><Text style={styles.pageTitle}>{title}</Text></View>{action}</View>; }
function SelectRow({ selected, onPress, title, detail }: { selected: boolean; onPress: () => void; title: string; detail: string }) { return <Pressable onPress={onPress} style={[styles.selectRow, selected && styles.selectRowActive]}><Text style={[styles.selectTitle, selected && styles.whiteText]}>{title}</Text><Text style={[styles.selectDetail, selected && styles.redText]}>{detail}</Text></Pressable>; }
function EmptyState({ icon: Icon, title, copy }: { icon: typeof TrendingUp; title: string; copy: string }) { return <View style={styles.emptyState}><Icon size={27} color={C.redBright} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.black }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.black, gap: 12 }, loadingMark: { width: 70, height: 70, borderRadius: 20 }, loadingWordmark: { color: C.white, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 2 },
  intro: { flex: 1, backgroundColor: C.black }, introBrand: { position: 'absolute', top: 58, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(0,0,0,0.30)' }, introBrandMark: { width: 28, height: 28, borderRadius: 8 }, introBrandText: { color: C.white, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.8 },
  welcomeScroll: { flex: 1 }, welcomeScrollContent: { paddingBottom: 100 }, welcomeHero: { height: 438, overflow: 'hidden', backgroundColor: C.surface }, welcomeHeroImage: { width: '100%', height: '100%' }, storyHeader: { position: 'absolute', top: 16, right: 24, left: 24, flexDirection: 'row', alignItems: 'center', gap: 24 }, storySegments: { flex: 1, flexDirection: 'row', gap: 8 }, storySegment: { flex: 1, height: 4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.18)' }, storySegmentActive: { backgroundColor: C.white }, skipWelcome: { color: 'rgba(255,255,255,0.62)', fontSize: 11, fontFamily: 'APEX Manrope', fontWeight: '700' }, welcomeContent: { marginTop: -88, paddingHorizontal: 28 }, welcomeEyebrow: { color: C.muted, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 2.0, marginBottom: 13 }, welcomeTitle: { color: C.white, fontSize: 41, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.9, lineHeight: 45, marginBottom: 14 }, welcomeLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', fontWeight: '600', lineHeight: 23, marginBottom: 28 }, welcomeBenefits: { overflow: 'hidden', borderRadius: 24, backgroundColor: '#171719', paddingHorizontal: 18 }, welcomeBenefit: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 13 }, welcomeBenefitBorder: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.11)' }, welcomeBenefitIcon: { width: 33, alignItems: 'center' }, welcomeBenefitTitle: { color: C.white, fontSize: 15, fontFamily: 'APEX Manrope', fontWeight: '700', marginBottom: 4 }, welcomeBenefitCopy: { color: C.muted, fontSize: 11, fontFamily: 'APEX Manrope', lineHeight: 15 }, welcomeFooter: { position: 'absolute', right: 0, bottom: 0, left: 0, paddingHorizontal: 28, paddingTop: 13, paddingBottom: 18, backgroundColor: C.black }, welcomeNext: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 30, backgroundColor: C.red }, welcomeNextText: { color: C.white, fontSize: 12, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2 },
  backdrop: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' }, star: { position: 'absolute', borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.9)' }, backdropGlowTop: { position: 'absolute', top: -80, right: -65, width: 330, height: 360, borderRadius: 180, backgroundColor: 'rgba(125,10,22,0.18)', transform: [{ rotate: '-28deg' }] }, backdropGlowBottom: { position: 'absolute', bottom: -135, left: -140, width: 390, height: 290, borderRadius: 195, backgroundColor: 'rgba(126,10,21,0.15)', transform: [{ rotate: '22deg' }] }, formStoryHeader: { zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 25, paddingHorizontal: 38, paddingTop: 16 }, formStorySegments: { flex: 1, flexDirection: 'row', gap: 9 }, formStorySegment: { flex: 1, height: 4, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.14)' }, formStorySegmentActive: { backgroundColor: C.white }, nameStep: { flex: 1, justifyContent: 'center', paddingHorizontal: 38, paddingBottom: 56 }, stepCounter: { color: C.muted, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.8, marginBottom: 18 }, nameTitle: { color: C.white, fontSize: 36, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.4, lineHeight: 43, marginBottom: 13 }, nameLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', lineHeight: 22, marginBottom: 42 }, nameInputShell: { height: 88, flexDirection: 'row', alignItems: 'center', gap: 17, paddingHorizontal: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.025)', borderRadius: 27, backgroundColor: '#161617' }, nameInput: { flex: 1, height: '100%', color: C.white, fontSize: 17, fontFamily: 'APEX Manrope', fontWeight: '600' }, photoStep: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 55 }, photoTitle: { color: C.white, fontSize: 35, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.55, lineHeight: 42, marginBottom: 12 }, photoLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', lineHeight: 22, marginBottom: 42 }, photoUploadCard: { height: 282, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#161617' }, photoAvatar: { width: 164, height: 164, alignItems: 'center', justifyContent: 'center', overflow: 'visible', borderWidth: 2, borderColor: '#55555a', borderRadius: 82 }, photoAvatarImage: { width: '100%', height: '100%', borderRadius: 82 }, photoCamera: { position: 'absolute', right: -3, bottom: -3, width: 51, height: 51, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#161617', borderRadius: 26, backgroundColor: '#f44b53', shadowColor: '#000', shadowOpacity: 0.42, shadowRadius: 10, elevation: 5 }, addPhotoText: { color: '#f05b63', fontSize: 15, fontFamily: 'APEX Manrope', fontWeight: '700', marginTop: 17 }, unitStep: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 65 }, unitTitle: { color: C.white, fontSize: 36, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.6, lineHeight: 43, marginBottom: 11 }, unitLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', lineHeight: 22, marginBottom: 43 }, unitCards: { flexDirection: 'row', gap: 18 }, unitCardAnimation: { flex: 1 }, unitCard: { flex: 1, minHeight: 184, justifyContent: 'flex-end', padding: 29, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.025)', borderRadius: 29, backgroundColor: '#161617' }, unitCardSelected: { borderWidth: 2, borderColor: '#e72a31' }, unitCheck: { position: 'absolute', top: 25, right: 25, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e72a31' }, unitSymbol: { color: C.white, fontSize: 37, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -2 }, unitSymbolSelected: { color: '#ed343d' }, unitDetail: { color: C.dim, fontSize: 11, fontFamily: 'APEX Manrope', marginTop: 9 }, metricsStep: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 63 }, metricsTitle: { color: C.white, fontSize: 36, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.6, lineHeight: 43, marginBottom: 11 }, metricsLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', lineHeight: 22, marginBottom: 40 }, metricsCard: { overflow: 'hidden', borderRadius: 29, backgroundColor: '#161617', paddingHorizontal: 25 }, sexRow: { minHeight: 89, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, metricSelectRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.11)' }, metricRowStart: { flexDirection: 'row', alignItems: 'center', gap: 24 }, metricLabelText: { color: C.white, fontSize: 17, fontFamily: 'APEX Manrope', fontWeight: '600' }, metricRowEnd: { flexDirection: 'row', alignItems: 'center', gap: 8 }, metricValueText: { color: C.white, fontSize: 18, fontFamily: 'APEX Sora', fontWeight: '800', letterSpacing: -0.3 }, sexToggle: { flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 24, backgroundColor: '#28282a' }, sexOption: { minWidth: 75, minHeight: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }, sexOptionActive: { backgroundColor: '#ef1c25' }, sexOptionText: { color: C.muted, fontSize: 13, fontFamily: 'APEX Manrope', fontWeight: '600' }, sexOptionTextActive: { color: C.white }, metricSheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.58)' }, metricSheet: { alignItems: 'center', padding: 24, paddingBottom: 34, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#151517' }, metricSheetLabel: { color: C.redBright, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 }, metricSheetTitle: { color: C.white, fontSize: 24, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -0.8, marginBottom: 18 }, metricSheetDone: { width: '100%', minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 20, borderRadius: 27, backgroundColor: '#ef1c25' }, metricSheetDoneText: { color: C.white, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2 }, metricPickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.63)' }, metricPickerSheet: { minHeight: 470, paddingHorizontal: 30, paddingTop: 15, paddingBottom: 28, borderTopLeftRadius: 33, borderTopRightRadius: 33, backgroundColor: '#151516' }, metricPickerHandle: { width: 62, height: 5, alignSelf: 'center', borderRadius: 4, backgroundColor: '#2b2b2c', marginBottom: 36 }, metricPickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, metricPickerLabel: { color: C.muted, fontSize: 17, fontFamily: 'APEX Manrope', fontWeight: '600' }, horizontalPickerArea: { marginTop: 35 }, metricPickerDisplay: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 9, minHeight: 102 }, metricPickerValue: { color: C.white, fontSize: 68, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -3 }, metricPickerSuffix: { color: C.muted, fontSize: 21, fontFamily: 'APEX Manrope', fontWeight: '600' }, horizontalRuler: { height: 104, marginHorizontal: -30 }, horizontalRulerMarker: { position: 'absolute', zIndex: 2, top: 6, bottom: 26, left: '50%', width: 4, marginLeft: -2, borderRadius: 2, backgroundColor: '#f04750' }, horizontalTickWrap: { width: 17, height: 100, alignItems: 'center', justifyContent: 'flex-start' }, horizontalTick: { width: 2, height: 24, borderRadius: 1, backgroundColor: '#3e3e40' }, horizontalTickMajor: { width: 3, height: 51, backgroundColor: '#a8a8ab' }, horizontalTickLabel: { color: C.muted, fontSize: 11, fontFamily: 'APEX Manrope', fontWeight: '600', marginTop: 9 }, heightPickerArea: { height: 298, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heightDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginLeft: 92 }, verticalRuler: { width: 116, height: 298, marginRight: -10 }, verticalRulerMarker: { position: 'absolute', zIndex: 2, top: 146, right: 0, width: 70, height: 4, borderRadius: 2, backgroundColor: '#f04750' }, verticalTickWrap: { width: '100%', height: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }, verticalTickLabel: { width: 36, color: C.muted, fontSize: 11, fontFamily: 'APEX Manrope', fontWeight: '600', textAlign: 'right' }, verticalTick: { width: 28, height: 2, borderRadius: 1, backgroundColor: '#3e3e40' }, verticalTickMajor: { width: 54, height: 3, backgroundColor: '#a8a8ab' }, metricPickerSet: { minHeight: 58, alignItems: 'center', justifyContent: 'center', marginTop: 18, borderRadius: 29, backgroundColor: '#ef1c25' }, metricPickerSetText: { color: C.white, fontSize: 12, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.1 }, formFooter: { zIndex: 2, flexDirection: 'row', gap: 14, paddingHorizontal: 38, paddingTop: 13, paddingBottom: 20 }, formBackButton: { width: 70, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: '#18191a' }, formNextButton: { minHeight: 58, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 29, backgroundColor: '#ef1c25' }, formNextText: { color: C.white, fontSize: 12, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.1 },
  locationStep: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 63 }, locationStepTitle: { color: C.white, fontSize: 36, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.6, lineHeight: 43, marginBottom: 11 }, locationStepLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', lineHeight: 22, marginBottom: 42 }, locationListCard: { overflow: 'hidden', borderRadius: 29, backgroundColor: '#161617' }, locationListCardError: { borderWidth: 1, borderColor: 'rgba(239,28,37,0.8)' }, locationRowWrap: { overflow: 'hidden' }, locationRowDivider: { borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.11)' }, locationOption: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 25 }, locationOptionSelected: { backgroundColor: 'rgba(223,9,37,0.12)' }, locationOptionIcon: { width: 40, alignItems: 'center', justifyContent: 'center' }, locationOptionIconSelected: { transform: [{ scale: 1.04 }] }, locationOptionCopy: { flex: 1 }, locationOptionTitle: { color: C.white, fontSize: 17, fontFamily: 'APEX Manrope', fontWeight: '700', marginBottom: 3 }, locationOptionDetail: { color: C.muted, fontSize: 12, fontFamily: 'APEX Manrope', lineHeight: 16 }, locationOptionCheck: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#ef1c25' }, locationError: { color: '#ff747b', fontSize: 12, fontFamily: 'APEX Manrope', fontWeight: '600', marginTop: 12, marginLeft: 4 },
  frequencyStep: { flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 63 }, frequencyTitle: { color: C.white, fontSize: 36, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.6, lineHeight: 43, marginBottom: 11 }, frequencyLead: { color: C.muted, fontSize: 15, fontFamily: 'APEX Manrope', lineHeight: 22, marginBottom: 42 }, frequencyCard: { minHeight: 214, padding: 28, borderRadius: 29, backgroundColor: '#161617' }, frequencyCardError: { borderWidth: 1, borderColor: 'rgba(239,28,37,0.8)' }, frequencyEyebrow: { color: C.dim, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.55, marginBottom: 13 }, frequencyValue: { color: C.white, fontSize: 26, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -0.8, marginBottom: 31 }, frequencyValueMuted: { color: C.muted, fontSize: 20, letterSpacing: -0.5 }, frequencyButtons: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, frequencyButton: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#272729' }, frequencyButtonSelected: { backgroundColor: '#ef1c25' }, frequencyButtonText: { color: '#77777c', fontSize: 15, fontFamily: 'APEX Sora', fontWeight: '900' }, frequencyButtonTextSelected: { color: C.white }, frequencyError: { color: '#ff747b', fontSize: 12, fontFamily: 'APEX Manrope', fontWeight: '600', marginTop: 12, marginLeft: 4 },
  onboardingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12 }, wordmark: { flexDirection: 'row', alignItems: 'center', gap: 8 }, wordmarkMark: { width: 28, height: 28, borderRadius: 8 }, wordmarkText: { color: C.white, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.4 }, localPill: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '800', letterSpacing: 1.1 }, progressTrack: { height: 3, marginHorizontal: 24, marginTop: 24, borderRadius: 99, overflow: 'hidden', backgroundColor: C.surfaceSoft }, progressFill: { height: '100%', borderRadius: 99, backgroundColor: C.red, }, onboardingPage: { flex: 1 }, onboardingBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 18 }, centeredOnboarding: { alignItems: 'center', textAlign: 'center' }, eyebrow: { color: C.redBright, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 }, title: { color: C.white, fontSize: 37, fontFamily: 'APEX Sora', fontWeight: '900', lineHeight: 40, letterSpacing: -1.8, marginBottom: 14 }, redText: { color: C.redBright }, whiteText: { color: C.white }, lead: { color: C.muted, fontSize: 15, lineHeight: 23, marginBottom: 28 }, fieldLabel: { color: C.dim, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2, marginBottom: 9 }, textInput: { height: 62, borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.surface, color: C.white, paddingHorizontal: 17, fontSize: 17, fontFamily: 'APEX Manrope', fontWeight: '600' }, inputError: { borderColor: C.redBright }, textInputSmall: { height: 52, borderWidth: 1, borderColor: C.line, borderRadius: 14, backgroundColor: C.surface, color: C.white, paddingHorizontal: 16, marginBottom: 14, fontSize: 14 }, avatarPicker: { width: 154, height: 154, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 77, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderStyle: 'dashed', backgroundColor: C.surface, marginTop: 2, marginBottom: 18 }, avatarImage: { width: '100%', height: '100%' }, avatarEdit: { position: 'absolute', right: 9, bottom: 9, width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: C.red, borderWidth: 3, borderColor: C.black }, skipText: { color: C.muted, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2 }, heroMark: { width: 88, height: 88, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(243,41,66,0.5)', borderRadius: 25, marginBottom: 24 }, heroMarkImage: { width: '100%', height: '100%' }, heroStats: { flexDirection: 'row', gap: 8 }, heroStat: { flex: 1, minHeight: 77, justifyContent: 'center', padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.025)' }, heroStatLabel: { color: C.white, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.5 }, heroStatText: { color: C.dim, fontSize: 10, marginTop: 4 }, stack: { gap: 10 }, selectRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 19, borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.surface }, selectRowActive: { borderColor: C.redBright, backgroundColor: 'rgba(223,9,37,0.20)' }, selectTitle: { color: C.muted, fontSize: 13, fontFamily: 'APEX Sora', fontWeight: '800', letterSpacing: 0.5 }, selectDetail: { color: C.dim, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900' }, wheelRow: { flexDirection: 'row', gap: 8 }, wheelBox: { flex: 1, alignItems: 'center', paddingVertical: 13, borderWidth: 1, borderColor: C.line, borderRadius: 17, backgroundColor: C.surface }, wheelLabel: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1 }, wheelClip: { height: 132, width: '100%', marginVertical: 9, overflow: 'hidden' }, wheelLines: { position: 'absolute', top: 44, right: 7, left: 7, height: 44, zIndex: 2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(243,41,66,0.7)' }, wheelItem: { height: 44, alignItems: 'center', justifyContent: 'center' }, wheelText: { color: '#5e5e65', fontSize: 15, fontFamily: 'APEX Sora', fontWeight: '800' }, wheelTextSelected: { color: C.white, fontSize: 17 }, wheelItemSelected: {}, wheelSuffix: { color: C.redBright, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.8 }, choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, choiceCard: { width: '48.4%', minHeight: 95, justifyContent: 'center', padding: 16, borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.surface }, choiceCardActive: { borderColor: C.redBright, backgroundColor: 'rgba(223,9,37,0.22)' }, choiceNumber: { color: C.white, fontSize: 28, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.5 }, choiceCaption: { color: C.muted, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1, marginTop: 4 }, locationCard: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: C.line, borderRadius: 17, backgroundColor: C.surface }, locationCardActive: { borderColor: C.redBright, backgroundColor: 'rgba(223,9,37,0.20)' }, locationCopy: { flex: 1 }, locationTitle: { color: C.white, fontSize: 14, fontFamily: 'APEX Manrope', fontWeight: '700' }, locationDetail: { color: C.dim, fontSize: 10, marginTop: 3 }, emptyCheck: { width: 19 }, onboardingFooter: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 20 }, backButton: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.surface }, backPlaceholder: { width: 0 }, primaryButton: { minHeight: 56, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, borderRadius: 16, backgroundColor: C.red }, primaryButtonText: { color: C.white, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2 },
  guideScreen: { flex: 1, backgroundColor: C.black }, guideHeader: { minHeight: 74, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderColor: C.line }, guideHeaderSpacer: { width: 40 }, guideHeaderEyebrow: { color: C.redBright, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.3 }, guideHeaderTitle: { color: C.white, fontSize: 27, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.25, marginTop: 3 }, guideSearch: { gap: 10, padding: 20, paddingBottom: 11 }, guideSearchInput: { height: 56, borderWidth: 1, borderColor: C.line, borderRadius: 17, backgroundColor: C.surface, color: C.white, paddingHorizontal: 16, fontSize: 14, fontFamily: 'APEX Manrope', fontWeight: '600' }, guideSearchCount: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1 }, guideList: { padding: 20, paddingTop: 4, paddingBottom: 34, gap: 9 }, guideListRow: { minHeight: 75, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.surface }, guideListMark: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: 'rgba(223,9,37,0.13)' }, guideListTitle: { color: C.white, fontSize: 13, fontFamily: 'APEX Manrope', fontWeight: '700' }, guideListCopy: { color: C.dim, fontSize: 10, fontFamily: 'APEX Manrope', marginTop: 4, textTransform: 'capitalize' }, guideDetailScroll: { padding: 20, paddingBottom: 42 }, guideDemoPanel: { minHeight: 205, alignItems: 'center', justifyContent: 'center', padding: 24, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(243,41,66,0.32)', borderRadius: 23, backgroundColor: '#121214' }, guideDemoIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderRadius: 26, backgroundColor: 'rgba(223,9,37,0.15)' }, guideDemoEyebrow: { color: C.redBright, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2, marginBottom: 7 }, guideDemoTitle: { color: C.white, fontSize: 16, fontFamily: 'APEX Sora', fontWeight: '800', textAlign: 'center' }, guideDemoCopy: { maxWidth: 280, color: C.muted, fontSize: 11, fontFamily: 'APEX Manrope', lineHeight: 16, textAlign: 'center', marginTop: 7 }, guideDetailTitle: { color: C.white, fontSize: 31, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.4, lineHeight: 37 }, guideDetailDescription: { color: C.muted, fontSize: 13, fontFamily: 'APEX Manrope', lineHeight: 20, marginTop: 10 }, guideFacts: { flexDirection: 'row', gap: 8, marginTop: 22 }, guideFact: { minHeight: 78, flex: 1, justifyContent: 'space-between', padding: 10, borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: C.surface }, guideFactLabel: { color: C.dim, fontSize: 7, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.65 }, guideFactValue: { color: C.white, fontSize: 11, fontFamily: 'APEX Manrope', fontWeight: '700', textTransform: 'capitalize' }, guideSectionLabel: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.15, marginTop: 28, marginBottom: 11 }, guideChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, guideChip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(223,9,37,0.13)' }, guideChipText: { color: '#ff9aa0', fontSize: 10, fontFamily: 'APEX Manrope', fontWeight: '700', textTransform: 'capitalize' }, guideSteps: { gap: 9 }, guideStep: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13, borderRadius: 16, backgroundColor: C.surface }, guideStepNumber: { color: C.redBright, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.6, paddingTop: 2 }, guideStepText: { flex: 1, color: C.text, fontSize: 12, fontFamily: 'APEX Manrope', lineHeight: 18 }, guideCueCard: { gap: 11, padding: 15, borderRadius: 18, backgroundColor: C.surface }, guideCue: { flexDirection: 'row', alignItems: 'center', gap: 10 }, guideCueText: { flex: 1, color: C.text, fontSize: 12, fontFamily: 'APEX Manrope', lineHeight: 17 }, guideBreathing: { color: C.white, fontSize: 14, fontFamily: 'APEX Manrope', fontWeight: '600', lineHeight: 21 }, demoCard: { overflow: 'hidden', marginBottom: 18, borderWidth: 1, borderColor: C.line, borderRadius: 20, backgroundColor: C.surface }, demoFrame: { position: 'relative' }, demoVideo: { width: '100%', aspectRatio: 16 / 10, backgroundColor: '#000' }, demoLoopBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(5,5,5,0.72)' }, demoLoopText: { color: C.white, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.8 }, demoFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderColor: C.line }, demoMeta: { flex: 1 }, demoCaption: { color: C.muted, fontSize: 10, fontFamily: 'APEX Manrope', marginTop: 3 }, demoVariants: { flexDirection: 'row', padding: 3, borderWidth: 1, borderColor: C.line, borderRadius: 11, backgroundColor: C.black }, demoVariant: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }, demoVariantActive: { backgroundColor: C.red }, demoVariantText: { color: C.dim, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.8 }, demoVariantTextActive: { color: C.white }, guideSourceNote: { color: C.dim, fontSize: 9, fontFamily: 'APEX Manrope', textAlign: 'center', lineHeight: 14, marginTop: 26 },
  dashboard: { flex: 1 }, pageScroll: { padding: 20, paddingTop: 14, paddingBottom: 106 }, homeHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 25 }, dateText: { color: C.dim, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 7 }, greeting: { color: C.white, fontSize: 29, fontFamily: 'APEX Sora', fontWeight: '900', lineHeight: 34, letterSpacing: -1.3 }, profileButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: C.surface }, profileButtonImage: { width: '100%', height: '100%' }, focusCard: { overflow: 'hidden', padding: 24, borderWidth: 1, borderColor: 'rgba(243,41,66,0.55)', borderRadius: 25 }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardEyebrowLight: { color: 'rgba(255,255,255,0.82)', fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.3 }, focusTitle: { color: C.white, fontSize: 31, fontFamily: 'APEX Sora', fontWeight: '900', lineHeight: 34, letterSpacing: -1.5, marginTop: 37, marginBottom: 10 }, focusCopy: { maxWidth: 270, color: 'rgba(255,255,255,0.80)', fontSize: 13, lineHeight: 19, marginBottom: 24 }, lightButton: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 15, backgroundColor: C.white }, lightButtonText: { color: C.black, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1 }, sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 12 }, sectionHeading: { color: C.white, fontSize: 16, fontFamily: 'APEX Sora', fontWeight: '800', letterSpacing: -0.3 }, textAction: { color: C.redBright, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.1 }, metricsRow: { flexDirection: 'row', gap: 9 }, metric: { flex: 1, minHeight: 120, justifyContent: 'space-between', padding: 13, borderWidth: 1, borderColor: C.line, borderRadius: 17, backgroundColor: C.surface }, metricValue: { color: C.white, fontSize: 24, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.2 }, metricLabel: { color: C.dim, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.7 }, fuelCard: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.surface }, smallIconBox: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: 'rgba(223,9,37,0.15)' }, flex: { flex: 1 }, fuelValue: { color: C.white, fontSize: 13, fontFamily: 'APEX Manrope', fontWeight: '700' }, fuelCopy: { color: C.dim, fontSize: 10, lineHeight: 14, marginTop: 4 }, foundationCard: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.surface }, foundationTitle: { color: C.white, fontSize: 13, fontFamily: 'APEX Manrope', fontWeight: '700' }, foundationCopy: { color: C.dim, fontSize: 10, lineHeight: 14, marginTop: 4 }, tabBar: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 76, flexDirection: 'row', borderTopWidth: 1, borderColor: C.line, backgroundColor: 'rgba(8,8,9,0.98)' }, tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 }, tabLabel: { color: C.dim, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.7 }, tabLabelActive: { color: C.redBright },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }, pageTitle: { color: C.white, fontSize: 33, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.5 }, headerAction: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: C.surface }, planHero: { padding: 20, borderWidth: 1, borderColor: C.line, borderRadius: 22, backgroundColor: C.surface }, guideLaunchCard: { minHeight: 87, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, marginTop: 10, borderWidth: 1, borderColor: 'rgba(243,41,66,0.34)', borderRadius: 19, backgroundColor: 'rgba(223,9,37,0.08)' }, guideLaunchIcon: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(223,9,37,0.13)' }, guideLaunchEyebrow: { color: C.redBright, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1, marginBottom: 3 }, guideLaunchTitle: { color: C.white, fontSize: 14, fontFamily: 'APEX Sora', fontWeight: '800' }, guideLaunchCopy: { color: C.muted, fontSize: 10, fontFamily: 'APEX Manrope', marginTop: 3 }, cardEyebrow: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.2, marginBottom: 7 }, planNumber: { color: C.redBright, fontSize: 49, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -3 }, planSubtitle: { color: C.muted, fontSize: 12, marginTop: 2 }, weekDots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 21 }, dayDot: { width: 32, height: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 9 }, dayDotTraining: { borderColor: 'rgba(243,41,66,0.6)', backgroundColor: 'rgba(223,9,37,0.17)' }, dayDotToday: { borderColor: C.white, borderWidth: 1.5 }, dayDotText: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900' }, dayDotTextTraining: { color: C.white }, sectionCount: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.9 }, planCard: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderWidth: 1, borderColor: C.line, borderRadius: 17, backgroundColor: C.surface }, planIndex: { alignSelf: 'stretch', color: C.redBright, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.7 }, planLabel: { color: C.dim, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1, marginBottom: 3 }, planTitle: { color: C.white, fontSize: 14, fontFamily: 'APEX Manrope', fontWeight: '700' }, planCopy: { color: C.dim, fontSize: 10, marginTop: 4 }, playCircle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(223,9,37,0.15)' }, templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, templateCard: { width: '48.5%', minHeight: 126, justifyContent: 'flex-end', padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 18, backgroundColor: C.surface }, templateTitle: { color: C.white, fontSize: 13, fontFamily: 'APEX Sora', fontWeight: '800', marginTop: 27 }, templateCopy: { color: C.dim, fontSize: 10, marginTop: 5 }, progressHero: { padding: 22, borderWidth: 1, borderColor: C.line, borderRadius: 22, backgroundColor: C.surface }, progressNumber: { color: C.white, fontSize: 35, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -1.8 }, volumeUnit: { color: C.redBright, fontSize: 13, letterSpacing: 0 }, progressCopy: { color: C.muted, fontSize: 12, marginTop: 7 }, chart: { height: 175, flexDirection: 'row', alignItems: 'stretch', gap: 8, paddingTop: 8, borderBottomWidth: 1, borderColor: C.line }, chartColumn: { flex: 1, alignItems: 'center' }, chartValue: { height: 20, color: C.muted, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '800' }, chartTrack: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' }, chartBar: { width: 21, maxHeight: '100%', borderTopLeftRadius: 7, borderTopRightRadius: 7, backgroundColor: C.red }, chartDay: { color: C.dim, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', marginTop: 7 }, historyCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.surface }, historyIcon: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: 'rgba(223,9,37,0.15)' }, historyTitle: { color: C.white, fontSize: 13, fontFamily: 'APEX Manrope', fontWeight: '700' }, historyCopy: { color: C.dim, fontSize: 10, marginTop: 3 }, historyVolume: { color: C.white, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '800' }, emptyState: { minHeight: 145, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed', borderRadius: 18 }, emptyTitle: { color: C.white, fontSize: 13, fontFamily: 'APEX Manrope', fontWeight: '700' }, emptyCopy: { maxWidth: 250, color: C.dim, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  profileHero: { flexDirection: 'row', alignItems: 'center', gap: 15, padding: 18, borderWidth: 1, borderColor: C.line, borderRadius: 21, backgroundColor: C.surface }, profilePortrait: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 19, backgroundColor: 'rgba(223,9,37,0.15)' }, profilePortraitImage: { width: '100%', height: '100%' }, profileName: { color: C.white, fontSize: 19, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -0.6 }, profileContext: { color: C.dim, fontSize: 11, marginTop: 4 }, profileStats: { flexDirection: 'row', gap: 8, marginTop: 9 }, profileStat: { flex: 1, minHeight: 82, justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.surface }, profileStatLabel: { color: C.dim, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.6 }, profileStatValue: { color: C.white, fontSize: 13, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -0.5 }, settingRow: { minHeight: 71, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderWidth: 1, borderColor: C.line, borderRadius: 17, backgroundColor: C.surface }, settingTitle: { color: C.white, fontSize: 12, fontFamily: 'APEX Manrope', fontWeight: '700' }, settingCopy: { color: C.dim, fontSize: 10, marginTop: 3 },
  workoutScreen: { flex: 1, backgroundColor: C.black }, workoutHeader: { height: 67, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: C.line }, modalBack: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: C.surface }, workoutHeaderMiddle: { alignItems: 'center' }, workoutStatus: { color: C.redBright, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.1 }, workoutTimer: { color: C.white, fontSize: 16, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.8, marginTop: 2 }, discardText: { color: C.muted, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.8 }, workoutScroll: { padding: 20, paddingBottom: 110 }, workoutIntro: { color: C.muted, fontSize: 12, marginBottom: 20 }, exerciseCard: { overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: C.line, borderRadius: 20, backgroundColor: C.surface }, exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 }, exerciseGuidePill: { flexDirection: 'row', alignItems: 'center', gap: 1, paddingLeft: 8 }, exerciseGuidePillText: { color: C.redBright, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.7 }, exerciseNumber: { alignSelf: 'stretch', color: C.redBright, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.7 }, exerciseTitle: { color: C.white, fontSize: 15, fontFamily: 'APEX Sora', fontWeight: '800' }, exerciseTarget: { color: C.dim, fontSize: 10, marginTop: 3 }, setHead: { height: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }, setHeadText: { width: '23%', color: C.dim, fontSize: 8, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.5 }, alignCenter: { textAlign: 'center' }, setRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }, setNumber: { width: '19%', color: C.muted, fontSize: 11, fontFamily: 'APEX Sora', fontWeight: '900', textAlign: 'center' }, setCompleteNumber: { color: C.redBright }, setInput: { width: '26%', height: 32, borderWidth: 1, borderColor: C.line, borderRadius: 9, backgroundColor: C.black, color: C.white, fontSize: 12, fontFamily: 'APEX Manrope', fontWeight: '700', textAlign: 'center' }, setCheck: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', borderRadius: 10 }, setCheckComplete: { borderColor: C.redBright, backgroundColor: C.red }, addSetButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderTopWidth: 1, borderColor: C.line }, addSetText: { color: C.muted, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 0.8 }, workoutFooter: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderColor: C.line, backgroundColor: C.black }, restButton: { width: 58, alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderColor: C.line, borderRadius: 16, backgroundColor: C.surface }, restText: { color: C.white, fontSize: 7, fontFamily: 'APEX Sora', fontWeight: '900' },
  sheetShell: { flex: 1, justifyContent: 'flex-end' }, sheetScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.67)' }, sheetPanel: { maxHeight: '89%', padding: 20, paddingBottom: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.line, backgroundColor: '#101012' }, sheetHandle: { width: 40, height: 4, alignSelf: 'center', borderRadius: 5, backgroundColor: C.surfaceSoft, marginTop: -12, marginBottom: 18 }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between' }, fuelTarget: { gap: 5, marginVertical: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(243,41,66,0.32)', borderRadius: 17, backgroundColor: 'rgba(223,9,37,0.08)' }, fuelTargetLabel: { color: C.redBright, fontSize: 9, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: 1.1 }, fuelTargetNumber: { color: C.white, fontSize: 21, fontFamily: 'APEX Sora', fontWeight: '900', letterSpacing: -0.7 }, fuelTargetCopy: { color: C.muted, fontSize: 10, lineHeight: 14 }, mealList: { maxHeight: 190, marginBottom: 13 }, mealRow: { minHeight: 61, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8, padding: 10, borderWidth: 1, borderColor: C.line, borderRadius: 15, backgroundColor: C.surface }, mealIcon: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: 'rgba(223,9,37,0.15)' }, mealTitle: { color: C.white, fontSize: 12, fontFamily: 'APEX Manrope', fontWeight: '700' }, mealCopy: { color: C.dim, fontSize: 9, marginTop: 2 }, mealCalories: { color: C.white, fontSize: 10, fontFamily: 'APEX Sora', fontWeight: '900' }, noMeals: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 13, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed', borderRadius: 15 }, noMealsText: { flex: 1, color: C.dim, fontSize: 11, lineHeight: 15 },
});
