import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

type EmployerDisplay = {
  contactPerson?: string;
  householdName?: string;
  employerType?: string;
  province?: string;
  city?: string;
  suburb?: string;
};

type Job = {
  _id: string;
  employer: string | { _id: string };
  employerProfile?: EmployerDisplay | string;
  title: string;
  jobTypes?: string[];
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  skills?: string[];
  province: string;
  city: string;
  suburb?: string;
  employmentType: string;
  workArrangement?: string;
  workingDays?: string[];
  startTime?: string;
  endTime?: string;
  salaryType?: string;
  salaryAmount?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryNegotiable?: boolean;
  requiredLanguages?: string[];
  requiredExperience?: number;
  careType?: string;
  careRequirements?: string;
  patientCondition?: string;
  childrenDetails?: string;
  accommodationProvided?: boolean;
  foodProvided?: boolean;
  status?: string;
  allowInterviewRequests?: boolean;
  createdAt?: string;
};

const PROVINCES = [
  "All Provinces",
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const EMPLOYMENT_TYPES = [
  "All Types",
  "Full Time",
  "Part Time",
  "Temporary",
];

const money = (value?: number) =>
  `R${Number(value || 0).toLocaleString("en-ZA")}`;

export default function CandidateJobsScreen() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobType, setJobType] = useState("All Categories");
  const [province, setProvince] = useState("All Provinces");
  const [employmentType, setEmploymentType] = useState("All Types");
  const [workArrangement, setWorkArrangement] = useState("Any Arrangement");
  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  

  const [interviewVisible, setInterviewVisible] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [meetingType, setMeetingType] = useState("In Person");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [interviewMessage, setInterviewMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const loadJobs = useCallback(
    async (
      refresh = false,
      filters: Record<string, string> = {}
    ) => {
      try {
        if (refresh) setRefreshing(true);
        else setLoading(true);

        const response = await API.get("/jobs", {
          params: {
            limit: 100,
            page: 1,
            ...filters,
          },
        });

        setJobs(
          Array.isArray(response.data?.jobs)
            ? response.data.jobs
            : []
        );
      } catch (error: any) {
        Alert.alert(
          "Unable to load jobs",
          error?.response?.data?.message ||
            "Please check your connection and try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // Initial load only. Searches and refreshes pass their filters explicitly.
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Filtering is done server-side now.
  const filteredJobs = jobs;

  const getEmployerId = (job: Job) =>
    typeof job.employer === "string"
      ? job.employer
      : job.employer?._id;

  const salaryLabel = (job: Job) => {
    if (job.salaryNegotiable || job.salaryType === "Negotiable") {
      return "Salary negotiable";
    }

    if (Number(job.salaryMin) > 0 || Number(job.salaryMax) > 0) {
      if (
        Number(job.salaryMin) > 0 &&
        Number(job.salaryMax) > 0
      ) {
        return `${money(job.salaryMin)} – ${money(job.salaryMax)} / ${
          job.salaryType || "Monthly"
        }`;
      }

      return `${money(job.salaryMin || job.salaryMax)} / ${
        job.salaryType || "Monthly"
      }`;
    }

    if (Number(job.salaryAmount) > 0) {
      return `${money(job.salaryAmount)} / ${
        job.salaryType || "Monthly"
      }`;
    }

    return "Salary not specified";
  };

  const openInterviewForm = () => {
    if (!selectedJob) return;

    if (selectedJob.allowInterviewRequests === false) {
      Alert.alert(
        "Interview requests unavailable",
        "This job is not currently accepting interview requests."
      );
      return;
    }

    setInterviewDate("");
    setStartTime("10:00");
    setEndTime("10:30");
    setMeetingType("In Person");
    setMeetingLocation(
      `${selectedJob.city}${selectedJob.suburb ? `, ${selectedJob.suburb}` : ""}`
    );
    setInterviewMessage("");
    setInterviewVisible(true);
  };

  const submitInterviewRequest = async () => {
    if (!selectedJob) return;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(interviewDate.trim())) {
      Alert.alert(
        "Date required",
        "Enter the interview date in YYYY-MM-DD format."
      );
      return;
    }

    const date = new Date(`${interviewDate.trim()}T${startTime}:00`);

    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      Alert.alert(
        "Invalid date",
        "Please select a future date and a valid start time."
      );
      return;
    }

    const employerId = getEmployerId(selectedJob);

    if (!employerId) {
      Alert.alert(
        "Unable to request interview",
        "The employer information for this job is unavailable."
      );
      return;
    }

    try {
      setSendingRequest(true);

      await API.post("/interviews", {
        recipientId: employerId,
        jobId: selectedJob._id,
        proposedDate: date.toISOString(),
        proposedStartTime: startTime,
        proposedEndTime: endTime,
        meetingType,
        location: meetingLocation.trim(),
        message: interviewMessage.trim(),
      });

      setInterviewVisible(false);

      Alert.alert(
        "Request sent",
        "Your interview request has been sent. You can check its status in your Interviews section.",
        [
          {
            text: "View Interviews",
            onPress: () => {
              setSelectedJob(null);
              router.push("/(candidate)/interviews");
            },
          },
          { text: "Done" },
        ]
      );
    } catch (error: any) {
      const data = error?.response?.data;

      if (
        error?.response?.status === 403 ||
        data?.subscriptionRequired ||
        data?.recipientSubscriptionRequired
      ) {
        Alert.alert(
          "Subscription required",
          data?.message ||
            "Both you and the employer need active subscriptions to request an interview."
        );
        return;
      }

      Alert.alert(
        "Interview request failed",
        data?.message ||
          "Please try again later."
      );
    } finally {
      setSendingRequest(false);
    }
  };

  const searchJobs = () => {
  const filters: Record<string, string> = {};

  if (jobType !== "All Categories") {
    filters.jobType = jobType;
  }

  if (province !== "All Provinces") {
    filters.province = province;
  }

  if (employmentType !== "All Types") {
    filters.employmentType = employmentType;
  }

  if (workArrangement !== "Any Arrangement") {
    filters.workArrangement = workArrangement;
  }

  if (minSalary.trim()) {
    filters.minSalary = minSalary.trim();
  }

  if (maxSalary.trim()) {
    filters.maxSalary = maxSalary.trim();
  }

  const min = Number(minSalary || 0);
  const max = Number(maxSalary || 0);

  if (
    (minSalary.trim() && (!Number.isFinite(min) || min < 0)) ||
    (maxSalary.trim() && (!Number.isFinite(max) || max < 0))
  ) {
    Alert.alert("Invalid salary", "Enter valid non-negative salary amounts.");
    return;
  }

  if (min > 0 && max > 0 && min > max) {
    Alert.alert(
      "Invalid salary range",
      "Minimum salary cannot be higher than maximum salary."
    );
    return;
  }

  setAppliedFilters(filters);
  loadJobs(false, filters);
};

const clearFilters = () => {
  setJobType("All Categories");
  setProvince("All Provinces");
  setEmploymentType("All Types");
  setWorkArrangement("Any Arrangement");
  setMinSalary("");
  setMaxSalary("");

  setAppliedFilters({});
  loadJobs(false, {});
};


  const getEmployerLabel = (job: Job) => {
    if (!job.employerProfile || typeof job.employerProfile === "string") {
      return "Nakky Academy employer";
    }
    return (
      job.employerProfile.householdName?.trim() ||
      job.employerProfile.contactPerson?.trim() ||
      job.employerProfile.employerType ||
      "Nakky Academy employer"
    );
  };

  const renderJob = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.jobCard}
      activeOpacity={0.85}
      onPress={() => setSelectedJob(item)}
    >
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.location}>
            {item.city}
            {item.suburb ? `, ${item.suburb}` : ""}
            {item.province ? ` · ${item.province}` : ""}
          </Text>
          <Text style={styles.employerLabel}>
            Posted by {getEmployerLabel(item)}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>

      <View style={styles.tagRow}>
        {(item.jobTypes || []).slice(0, 3).map((type) => (
          <Text key={type} style={styles.tag}>
            {type}
          </Text>
        ))}
        <Text style={styles.tag}>{item.employmentType}</Text>
      </View>

      <Text style={styles.salary}>{salaryLabel(item)}</Text>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {item.description}
      </Text>

      <View style={styles.jobFooter}>
        <Text style={styles.arrangement}>
          {item.workArrangement || "Flexible arrangement"}
        </Text>
        <Text style={styles.viewDetails}>View details →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.screenScroll}
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadJobs(true, appliedFilters)}
            tintColor="#D41472"
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Available Jobs</Text>
          <Text style={styles.subtitle}>
            Find opportunities with Nakky Academy
          </Text>
        </View>

        <View style={styles.filters}>
          <Text style={styles.filterLabel}>Type of work</Text>
          <View style={styles.typeRow}>
            {[
              "All Categories",
              "Nanny",
              "Caregiver",
              "Babysitter",
              "Housekeeper",
              "Domestic Helper",
              "Gardener",
              "Cook",
              "Driver",
              "Au Pair",
              "Disability Care",
              "Elderly Care",
            ].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.typeChip,
                  jobType === item && styles.filterChipActive,
                ]}
                onPress={() => setJobType(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    jobType === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Province</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {PROVINCES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterChip,
                  province === item && styles.filterChipActive,
                ]}
                onPress={() => setProvince(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    province === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>Employment type</Text>
          <View style={styles.typeRow}>
            {EMPLOYMENT_TYPES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.typeChip,
                  employmentType === item && styles.filterChipActive,
                ]}
                onPress={() => setEmploymentType(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    employmentType === item && styles.filterChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Accommodation arrangement</Text>
          <View style={styles.typeRow}>
            {["Any Arrangement", "Live In", "Live Out", "Flexible"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.typeChip,
                  workArrangement === item && styles.filterChipActive,
                ]}
                onPress={() => setWorkArrangement(item)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    workArrangement === item && styles.filterChipTextActive,
                  ]}
                >
                  {item === "Flexible" ? "Flexible / Either" : item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterLabel}>Monthly or advertised salary range (R)</Text>
          <View style={styles.salaryRow}>
            <TextInput
              style={[styles.searchInput, styles.salaryInput]}
              placeholder="Minimum"
              placeholderTextColor="#888"
              value={minSalary}
              onChangeText={setMinSalary}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.searchInput, styles.salaryInput]}
              placeholder="Maximum"
              placeholderTextColor="#888"
              value={maxSalary}
              onChangeText={setMaxSalary}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={searchJobs}>
            <Text style={styles.searchButtonText}>Search Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#D41472" />
              <Text style={styles.muted}>Loading available jobs...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.resultCount}>
                {filteredJobs.length} job{filteredJobs.length === 1 ? "" : "s"} found
              </Text>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <View key={job._id}>{renderJob({ item: job })}</View>
                ))
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No jobs found</Text>
                  <Text style={styles.muted}>
                    Try changing your filters, or pull down to refresh.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedJob}
        animationType="slide"
        onRequestClose={() => setSelectedJob(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedJob(null)}>
              <Text style={styles.backText}>‹ Back to jobs</Text>
            </TouchableOpacity>
          </View>

          {selectedJob && (
            <ScrollView contentContainerStyle={styles.detailsContent}>
              <Text style={styles.detailsTitle}>{selectedJob.title}</Text>
              <Text style={styles.location}>
                {selectedJob.city}
                {selectedJob.suburb ? `, ${selectedJob.suburb}` : ""}
                {selectedJob.province ? ` · ${selectedJob.province}` : ""}
              </Text>
              <Text style={styles.employerLabel}>
                Posted by {getEmployerLabel(selectedJob)}
              </Text>
              {selectedJob.employerProfile && typeof selectedJob.employerProfile !== "string" && selectedJob.employerProfile.employerType ? (
                <Text style={styles.bodyText}>
                  Employer type: {selectedJob.employerProfile.employerType}
                </Text>
              ) : null}

              <Text style={styles.salaryDetails}>
                {salaryLabel(selectedJob)}
              </Text>

              <View style={styles.tagRow}>
                {(selectedJob.jobTypes || []).map((type) => (
                  <Text key={type} style={styles.tag}>
                    {type}
                  </Text>
                ))}
                <Text style={styles.tag}>
                  {selectedJob.employmentType}
                </Text>
                <Text style={styles.tag}>
                  {selectedJob.workArrangement || "Flexible"}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Job description</Text>
              <Text style={styles.bodyText}>
                {selectedJob.description}
              </Text>

              {selectedJob.responsibilities?.length ? (
                <>
                  <Text style={styles.sectionTitle}>Responsibilities</Text>
                  {selectedJob.responsibilities.map((item, index) => (
                    <Text key={index} style={styles.bullet}>
                      • {item}
                    </Text>
                  ))}
                </>
              ) : null}

              {selectedJob.requirements?.length ? (
                <>
                  <Text style={styles.sectionTitle}>Requirements</Text>
                  {selectedJob.requirements.map((item, index) => (
                    <Text key={index} style={styles.bullet}>
                      • {item}
                    </Text>
                  ))}
                </>
              ) : null}

              {selectedJob.skills?.length ? (
                <>
                  <Text style={styles.sectionTitle}>Skills</Text>
                  <Text style={styles.bodyText}>
                    {selectedJob.skills.join(", ")}
                  </Text>
                </>
              ) : null}

              <Text style={styles.sectionTitle}>Working arrangements</Text>
              <Text style={styles.bodyText}>
                Days: {selectedJob.workingDays?.join(", ") || "Not specified"}
              </Text>
              <Text style={styles.bodyText}>
                Hours: {selectedJob.startTime || "Not specified"}
                {selectedJob.endTime ? ` – ${selectedJob.endTime}` : ""}
              </Text>
              <Text style={styles.bodyText}>
                Experience required: {selectedJob.requiredExperience || 0} year(s)
              </Text>
              <Text style={styles.bodyText}>
                Languages: {selectedJob.requiredLanguages?.join(", ") || "Not specified"}
              </Text>
              <Text style={styles.bodyText}>
                Accommodation: {selectedJob.accommodationProvided ? "Provided" : "Not provided"}
              </Text>
              <Text style={styles.bodyText}>
                Food: {selectedJob.foodProvided ? "Provided" : "Not provided"}
              </Text>

              {selectedJob.careType &&
              selectedJob.careType !== "None" ? (
                <>
                  <Text style={styles.sectionTitle}>Care requirements</Text>
                  <Text style={styles.bodyText}>
                    {selectedJob.careType}
                  </Text>
                  {selectedJob.patientCondition ? (
                    <Text style={styles.bodyText}>
                      Patient condition: {selectedJob.patientCondition}
                    </Text>
                  ) : null}
                  {selectedJob.careRequirements ? (
                    <Text style={styles.bodyText}>
                      {selectedJob.careRequirements}
                    </Text>
                  ) : null}
                </>
              ) : null}

              {selectedJob.childrenDetails ? (
                <>
                  <Text style={styles.sectionTitle}>Childcare details</Text>
                  <Text style={styles.bodyText}>
                    {selectedJob.childrenDetails}
                  </Text>
                </>
              ) : null}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={openInterviewForm}
              >
                <Text style={styles.primaryButtonText}>
                  Request an Interview
                </Text>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                Interview requests require active subscriptions for both parties.
              </Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      <Modal
        visible={interviewVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInterviewVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.interviewCard}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.detailsTitle}>Request an Interview</Text>
              <Text style={styles.muted}>
                {selectedJob?.title}
              </Text>

              <Text style={styles.inputLabel}>Interview date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={interviewDate}
                onChangeText={setInterviewDate}
                placeholder="2026-12-15"
                placeholderTextColor="#888"
              />

              <Text style={styles.inputLabel}>Start time (24-hour format)</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="10:00"
                placeholderTextColor="#888"
              />

              <Text style={styles.inputLabel}>End time (24-hour format)</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="10:30"
                placeholderTextColor="#888"
              />

              <Text style={styles.inputLabel}>Meeting type</Text>
              <View style={styles.typeRow}>
                {["In Person", "Online", "Phone"].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.typeChip,
                      meetingType === item && styles.filterChipActive,
                    ]}
                    onPress={() => setMeetingType(item)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        meetingType === item && styles.filterChipTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location or meeting details</Text>
              <TextInput
                style={styles.input}
                value={meetingLocation}
                onChangeText={setMeetingLocation}
                placeholder="Enter meeting location or online details"
                placeholderTextColor="#888"
              />

              <Text style={styles.inputLabel}>Message (optional)</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                value={interviewMessage}
                onChangeText={setInterviewMessage}
                placeholder="Introduce yourself and explain your availability..."
                placeholderTextColor="#888"
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  sendingRequest && styles.disabledButton,
                ]}
                onPress={submitInterviewRequest}
                disabled={sendingRequest}
              >
                {sendingRequest ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Send Interview Request
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setInterviewVisible(false)}
                disabled={sendingRequest}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7FA" },
  screenScroll: { flex: 1 },
  screenContent: { paddingBottom: 35 },
  resultsContainer: { paddingHorizontal: 16, paddingTop: 0 },
  header: { backgroundColor: "#171717", padding: 20, paddingTop: 12 },
  backButton: { marginBottom: 12 },
  backText: { color: "#D41472", fontSize: 16, fontWeight: "700" },
  heading: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  subtitle: { color: "#E5E5E5", marginTop: 6, fontSize: 14 },
  filters: { padding: 16, gap: 10 },
  searchInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#171717",
  },
  filterLabel: { color: "#333333", fontWeight: "700", marginTop: 3 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    marginRight: 7,
  },
  filterChipActive: {
    backgroundColor: "#D41472",
    borderColor: "#D41472",
  },
  filterChipText: { color: "#333333", fontSize: 12, fontWeight: "600" },
  filterChipTextActive: { color: "#FFFFFF" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  typeChip: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  listContent: { padding: 16, paddingTop: 0, paddingBottom: 35 },
  resultCount: { color: "#666666", marginBottom: 12, fontSize: 13 },
  jobCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#ECECF0",
  },
  jobHeader: { flexDirection: "row", alignItems: "flex-start" },
  jobTitleContainer: { flex: 1 },
  jobTitle: { fontSize: 18, fontWeight: "800", color: "#202020" },
  location: { color: "#666666", marginTop: 5, fontSize: 13 },
  employerLabel: { color: "#444444", marginTop: 5, fontSize: 12, fontWeight: "700" },
  arrow: { color: "#D41472", fontSize: 30, marginLeft: 10 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 12 },
  tag: {
    overflow: "hidden",
    backgroundColor: "#FCE8F2",
    color: "#A20D56",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "700",
  },
  salary: { color: "#16804A", fontWeight: "800", fontSize: 15, marginTop: 13 },
  jobDescription: { color: "#555555", fontSize: 14, lineHeight: 21, marginTop: 10 },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
  },
  arrangement: { color: "#777777", fontSize: 12 },
  viewDetails: { color: "#D41472", fontWeight: "800", fontSize: 13 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  muted: { color: "#777777", fontSize: 13, lineHeight: 19 },
  empty: { alignItems: "center", padding: 30, gap: 8 },
  emptyTitle: { fontSize: 19, fontWeight: "800", color: "#222222" },
  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
  detailsContent: { padding: 20, paddingBottom: 40 },
  detailsTitle: { fontSize: 23, fontWeight: "800", color: "#202020" },
  salaryDetails: { fontSize: 18, fontWeight: "800", color: "#16804A", marginTop: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222222",
    marginTop: 23,
    marginBottom: 9,
  },
  bodyText: { color: "#444444", fontSize: 14, lineHeight: 22, marginBottom: 6 },
  bullet: { color: "#444444", fontSize: 14, lineHeight: 22, marginBottom: 5 },
  primaryButton: {
    backgroundColor: "#D41472",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 25,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  disclaimer: { color: "#777777", fontSize: 12, textAlign: "center", marginTop: 12 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  interviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    maxHeight: "92%",
  },
  inputLabel: { color: "#333333", fontSize: 13, fontWeight: "700", marginTop: 15, marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    padding: 12,
    color: "#222222",
    backgroundColor: "#FFFFFF",
  },
  multiline: { minHeight: 90 },
  disabledButton: { opacity: 0.65 },
  cancelButton: { alignItems: "center", padding: 14 },
  cancelButtonText: { color: "#555555", fontWeight: "700" },

  salaryRow: {
  flexDirection: "row",
  gap: 10,
  },
  salaryInput: {
    flex: 1,
  },
  searchButton: {
    backgroundColor: "#D41472",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 8,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  clearButton: {
    alignItems: "center",
    paddingVertical: 11,
  },
  clearButtonText: {
    color: "#555555",
    fontWeight: "700",
  },
});
