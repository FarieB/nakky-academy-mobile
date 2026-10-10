import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

const JOB_TYPES = ["Caregiver", "Nanny", "Babysitter", "Domestic Helper", "Gardener", "Housekeeper", "Cook", "Driver", "Au Pair", "Disability Care", "Elderly Care"];
const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "Northern Cape", "North West", "Western Cape"];
const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Temporary"];
const ARRANGEMENTS = ["Live In", "Live Out", "Flexible"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SALARY_TYPES = ["Monthly", "Weekly", "Daily", "Hourly", "Negotiable"];
const CARE_TYPES = ["None", "Childcare", "Elderly Care", "Disability Care", "Post Surgery Care", "Palliative Care", "Other"];

type Job = {
  _id: string;
  title: string;
  description?: string;
  jobTypes?: string[];
  province?: string;
  city?: string;
  suburb?: string;
  employmentType?: string;
  workArrangement?: string;
  salaryType?: string;
  salaryAmount?: number;
  salaryMin?: number;
  salaryMax?: number;
  status?: string;
  createdAt?: string;
};

const toggleValue = (values: string[], value: string) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value];

function ChipGroup({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.chip, values.includes(item) && styles.chipActive]}
          onPress={() => onToggle(item)}
        >
          <Text style={[styles.chipText, values.includes(item) && styles.chipTextActive]}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function EmployerJobPostsScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [employmentType, setEmploymentType] = useState("Full Time");
  const [workArrangement, setWorkArrangement] = useState("Live Out");
  const [workingDays, setWorkingDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [salaryType, setSalaryType] = useState("Monthly");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [requiredLanguages, setRequiredLanguages] = useState("");
  const [requiredExperience, setRequiredExperience] = useState("0");
  const [careType, setCareType] = useState("None");
  const [careRequirements, setCareRequirements] = useState("");
  const [childrenDetails, setChildrenDetails] = useState("");
  const [accommodationProvided, setAccommodationProvided] = useState(false);
  const [foodProvided, setFoodProvided] = useState(false);
  const [allowInterviewRequests, setAllowInterviewRequests] = useState(true);

  const loadJobs = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      const response = await API.get("/jobs/employer/my-jobs");
      setJobs(Array.isArray(response.data?.jobs) ? response.data.jobs : []);
    } catch (error: any) {
      Alert.alert("Unable to load job posts", error?.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const resetForm = () => {
    setTitle(""); setJobTypes([]); setDescription(""); setResponsibilities(""); setRequirements("");
    setProvince(""); setCity(""); setSuburb(""); setEmploymentType("Full Time"); setWorkArrangement("Live Out");
    setWorkingDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]); setStartTime("08:00"); setEndTime("17:00");
    setSalaryType("Monthly"); setSalaryAmount(""); setSalaryMin(""); setSalaryMax(""); setRequiredLanguages("");
    setRequiredExperience("0"); setCareType("None"); setCareRequirements(""); setChildrenDetails("");
    setAccommodationProvided(false); setFoodProvided(false); setAllowInterviewRequests(true);
  };

  const createJob = async () => {
    if (!title.trim() || !description.trim() || !province || !city.trim() || !jobTypes.length) {
      Alert.alert("Missing required fields", "Enter a job title, select at least one work type, add a description, province and city.");
      return;
    }
    const amount = salaryAmount.trim() ? Number(salaryAmount) : undefined;
    const min = salaryMin.trim() ? Number(salaryMin) : undefined;
    const max = salaryMax.trim() ? Number(salaryMax) : undefined;
    if ([amount, min, max].some((value) => value !== undefined && (!Number.isFinite(value) || value < 0))) {
      Alert.alert("Invalid salary", "Salary amounts must be valid non-negative numbers.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      Alert.alert("Invalid salary range", "Minimum salary cannot exceed maximum salary.");
      return;
    }
    const experience = Number(requiredExperience || 0);
    if (!Number.isFinite(experience) || experience < 0) {
      Alert.alert("Invalid experience", "Enter a valid number of required experience years.");
      return;
    }

    const splitLines = (value: string) => value.split("\n").map((item) => item.trim()).filter(Boolean);
    const splitComma = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
    const payload: Record<string, any> = {
      title: title.trim(),
      jobTypes,
      description: description.trim(),
      responsibilities: splitLines(responsibilities),
      requirements: splitLines(requirements),
      province,
      city: city.trim(),
      suburb: suburb.trim(),
      employmentType,
      workArrangement,
      workingDays,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      salaryType,
      salaryNegotiable: salaryType === "Negotiable",
      requiredLanguages: splitComma(requiredLanguages),
      requiredExperience: experience,
      careType,
      careRequirements: careRequirements.trim(),
      childrenDetails: childrenDetails.trim(),
      accommodationProvided,
      foodProvided,
      allowInterviewRequests,
      status: "active",
    };
    if (amount !== undefined) payload.salaryAmount = amount;
    if (min !== undefined) payload.salaryMin = min;
    if (max !== undefined) payload.salaryMax = max;

    try {
      setSaving(true);
      await API.post("/jobs", payload);
      Alert.alert("Job published", "Your job post is now available to candidates.");
      resetForm();
      await loadJobs(true);
    } catch (error: any) {
      Alert.alert("Unable to publish job", error?.response?.data?.message || "Please check your employer profile and try again.");
    } finally {
      setSaving(false);
    }
  };

  const changeJobStatus = async (job: Job, action: "pause" | "reactivate") => {
    try {
      await API.patch(`/jobs/${job._id}/${action}`);
      await loadJobs(true);
    } catch (error: any) {
      Alert.alert("Unable to update job", error?.response?.data?.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadJobs(true)} tintColor="#D41472" />}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹ Back</Text></TouchableOpacity>
            <Text style={styles.eyebrow}>NAKKY MARKETPLACE</Text>
            <Text style={styles.title}>My Job Posts</Text>
            <Text style={styles.subtitle}>Create a vacancy with its own salary, duties, hours and requirements.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create a job post</Text>
            <Text style={styles.label}>Job title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Live-out nanny for a toddler" placeholderTextColor="#888" />

            <Text style={styles.label}>Type of work *</Text>
            <ChipGroup options={JOB_TYPES} values={jobTypes} onToggle={(value) => setJobTypes((current) => toggleValue(current, value))} />

            <Text style={styles.label}>Job description *</Text>
            <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="Describe the role and what the successful candidate will do." placeholderTextColor="#888" />
            <Text style={styles.label}>Responsibilities (one per line)</Text>
            <TextInput style={[styles.input, styles.multiline]} value={responsibilities} onChangeText={setResponsibilities} multiline textAlignVertical="top" placeholder="Prepare meals\nSupport daily care\nKeep work area tidy" placeholderTextColor="#888" />
            <Text style={styles.label}>Requirements (one per line)</Text>
            <TextInput style={[styles.input, styles.multiline]} value={requirements} onChangeText={setRequirements} multiline textAlignVertical="top" placeholder="Relevant experience\nReferences available" placeholderTextColor="#888" />

            <Text style={styles.sectionTitle}>Work location</Text>
            <Text style={styles.label}>Province *</Text>
            <ChipGroup options={PROVINCES} values={province ? [province] : []} onToggle={(value) => setProvince(value === province ? "" : value)} />
            <Text style={styles.label}>City or town *</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Johannesburg" placeholderTextColor="#888" />
            <Text style={styles.label}>Suburb or area</Text>
            <TextInput style={styles.input} value={suburb} onChangeText={setSuburb} placeholder="Optional" placeholderTextColor="#888" />

            <Text style={styles.sectionTitle}>Working arrangements</Text>
            <Text style={styles.label}>Employment type *</Text>
            <ChipGroup options={EMPLOYMENT_TYPES} values={[employmentType]} onToggle={setEmploymentType} />
            <Text style={styles.label}>Accommodation arrangement</Text>
            <ChipGroup options={ARRANGEMENTS} values={[workArrangement]} onToggle={setWorkArrangement} />
            <Text style={styles.label}>Working days</Text>
            <ChipGroup options={DAYS} values={workingDays} onToggle={(value) => setWorkingDays((current) => toggleValue(current, value))} />
            <View style={styles.twoColumns}>
              <View style={styles.column}><Text style={styles.label}>Start time</Text><TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="08:00" placeholderTextColor="#888" /></View>
              <View style={styles.column}><Text style={styles.label}>End time</Text><TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="17:00" placeholderTextColor="#888" /></View>
            </View>

            <Text style={styles.sectionTitle}>Salary and requirements</Text>
            <Text style={styles.label}>Salary frequency</Text>
            <ChipGroup options={SALARY_TYPES} values={[salaryType]} onToggle={setSalaryType} />
            <Text style={styles.label}>Advertised salary amount (R)</Text>
            <TextInput style={styles.input} value={salaryAmount} onChangeText={setSalaryAmount} keyboardType="numeric" placeholder="Optional" placeholderTextColor="#888" />
            <View style={styles.twoColumns}>
              <View style={styles.column}><Text style={styles.label}>Salary minimum (R)</Text><TextInput style={styles.input} value={salaryMin} onChangeText={setSalaryMin} keyboardType="numeric" placeholder="Optional" placeholderTextColor="#888" /></View>
              <View style={styles.column}><Text style={styles.label}>Salary maximum (R)</Text><TextInput style={styles.input} value={salaryMax} onChangeText={setSalaryMax} keyboardType="numeric" placeholder="Optional" placeholderTextColor="#888" /></View>
            </View>
            <Text style={styles.label}>Required experience (years)</Text>
            <TextInput style={styles.input} value={requiredExperience} onChangeText={setRequiredExperience} keyboardType="numeric" placeholder="0" placeholderTextColor="#888" />
            <Text style={styles.label}>Required languages (comma separated)</Text>
            <TextInput style={styles.input} value={requiredLanguages} onChangeText={setRequiredLanguages} placeholder="e.g. English, isiZulu" placeholderTextColor="#888" />

            <Text style={styles.sectionTitle}>Care details (where applicable)</Text>
            <Text style={styles.label}>Care type</Text>
            <ChipGroup options={CARE_TYPES} values={[careType]} onToggle={setCareType} />
            <Text style={styles.label}>Care requirements</Text>
            <TextInput style={[styles.input, styles.multiline]} value={careRequirements} onChangeText={setCareRequirements} multiline textAlignVertical="top" placeholder="Mobility, daily support or other care requirements" placeholderTextColor="#888" />
            <Text style={styles.label}>Children details (where applicable)</Text>
            <TextInput style={[styles.input, styles.multiline]} value={childrenDetails} onChangeText={setChildrenDetails} multiline textAlignVertical="top" placeholder="Number and ages of children, routines or special requirements" placeholderTextColor="#888" />
            <View style={styles.switchRow}><Text style={styles.switchLabel}>Accommodation provided</Text><Switch value={accommodationProvided} onValueChange={setAccommodationProvided} trackColor={{ true: "#D41472" }} /></View>
            <View style={styles.switchRow}><Text style={styles.switchLabel}>Food provided</Text><Switch value={foodProvided} onValueChange={setFoodProvided} trackColor={{ true: "#D41472" }} /></View>
            <View style={styles.switchRow}><Text style={styles.switchLabel}>Allow interview requests</Text><Switch value={allowInterviewRequests} onValueChange={setAllowInterviewRequests} trackColor={{ true: "#D41472" }} /></View>

            <TouchableOpacity style={[styles.publishButton, saving && styles.disabled]} onPress={createJob} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishButtonText}>Publish Job</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.jobsSection}>
            <Text style={styles.sectionTitle}>Your existing job posts</Text>
            {loading ? <ActivityIndicator color="#D41472" /> : jobs.length === 0 ? (
              <Text style={styles.emptyText}>You have not posted any jobs yet.</Text>
            ) : jobs.map((job) => (
              <View key={job._id} style={styles.jobCard}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobLocation}>{[job.suburb, job.city, job.province].filter(Boolean).join(", ")}</Text>
                <Text style={styles.jobMeta}>{job.employmentType || "Employment type not set"} · {job.workArrangement || "Arrangement not set"}</Text>
                <Text style={styles.jobSalary}>{job.salaryAmount ? `R${Number(job.salaryAmount).toLocaleString("en-ZA")}` : job.salaryMin || job.salaryMax ? `${job.salaryMin ? `R${Number(job.salaryMin).toLocaleString("en-ZA")}` : ""}${job.salaryMin && job.salaryMax ? " – " : ""}${job.salaryMax ? `R${Number(job.salaryMax).toLocaleString("en-ZA")}` : ""}` : "Salary not specified"}</Text>
                <Text style={styles.status}>Status: {job.status || "unknown"}</Text>
                {job.status === "active" ? (
                  <TouchableOpacity style={styles.outlineButton} onPress={() => changeJobStatus(job, "pause")}><Text style={styles.outlineButtonText}>Pause Job</Text></TouchableOpacity>
                ) : ["paused", "draft"].includes(String(job.status)) ? (
                  <TouchableOpacity style={styles.outlineButton} onPress={() => changeJobStatus(job, "reactivate")}><Text style={styles.outlineButtonText}>Reactivate Job</Text></TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FA" },
  flex: { flex: 1 },
  content: { paddingBottom: 35 },
  header: { backgroundColor: "#171717", padding: 20, paddingTop: 12, paddingBottom: 24 },
  backButton: { marginBottom: 16 },
  backText: { color: "#D41472", fontSize: 16, fontWeight: "800" },
  eyebrow: { color: "#FFD84D", fontSize: 11, fontWeight: "900", letterSpacing: 1.5 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", marginTop: 7 },
  subtitle: { color: "#E5E5E5", fontSize: 14, lineHeight: 21, marginTop: 8 },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 16, margin: 16, padding: 17, borderWidth: 1, borderColor: "#ECECF0" },
  sectionTitle: { color: "#202020", fontSize: 18, fontWeight: "900", marginTop: 9, marginBottom: 7 },
  label: { color: "#333333", fontSize: 13, fontWeight: "800", marginTop: 14, marginBottom: 7 },
  input: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, color: "#222222", fontSize: 14 },
  multiline: { minHeight: 95, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { borderWidth: 1, borderColor: "#DDDDDD", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: "#FFFFFF" },
  chipActive: { backgroundColor: "#D41472", borderColor: "#D41472" },
  chipText: { color: "#444444", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#FFFFFF" },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  switchLabel: { color: "#333333", fontSize: 13, fontWeight: "700", flex: 1, paddingRight: 12 },
  publishButton: { backgroundColor: "#D41472", borderRadius: 12, padding: 15, alignItems: "center", marginTop: 24 },
  publishButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  disabled: { opacity: 0.6 },
  jobsSection: { paddingHorizontal: 16, paddingTop: 2 },
  emptyText: { color: "#777777", fontSize: 13, paddingVertical: 14 },
  jobCard: { backgroundColor: "#FFFFFF", borderRadius: 14, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: "#ECECF0" },
  jobTitle: { color: "#222222", fontSize: 16, fontWeight: "900" },
  jobLocation: { color: "#666666", fontSize: 12, marginTop: 5 },
  jobMeta: { color: "#555555", fontSize: 12, marginTop: 7 },
  jobSalary: { color: "#16804A", fontSize: 14, fontWeight: "900", marginTop: 8 },
  status: { color: "#777777", fontSize: 12, marginTop: 8 },
  outlineButton: { borderWidth: 1, borderColor: "#D41472", borderRadius: 9, padding: 10, alignItems: "center", marginTop: 10 },
  outlineButtonText: { color: "#D41472", fontWeight: "800" },
});
