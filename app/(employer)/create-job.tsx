
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import API from "../../src/services/api";

const PINK = "#D41472";

const JOB_TYPES = [
  "Caregiver",
  "Nanny",
  "Babysitter",
  "Domestic Helper",
  "Gardener",
  "Housekeeper",
  "Cook",
  "Driver",
  "Au Pair",
  "Disability Care",
  "Elderly Care",
];

const PROVINCES = [
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

const EMPLOYMENT_TYPES = ["Full Time", "Part Time", "Temporary"];
const ARRANGEMENTS = ["Live In", "Live Out", "Flexible"];
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const SALARY_TYPES = ["Monthly", "Weekly", "Daily", "Hourly", "Negotiable"];

function Choice({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CreateJobScreen() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [province, setProvince] = useState("Gauteng");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState("Full Time");
  const [workArrangement, setWorkArrangement] = useState("Live Out");
  const [workingDays, setWorkingDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [salaryType, setSalaryType] = useState("Monthly");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryNegotiable, setSalaryNegotiable] = useState(false);
  const [requiredExperience, setRequiredExperience] = useState("0");
  const [requiredLanguages, setRequiredLanguages] = useState("English");
  const [responsibilities, setResponsibilities] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skills, setSkills] = useState("");
  const [accommodationProvided, setAccommodationProvided] = useState(false);
  const [foodProvided, setFoodProvided] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggleListItem = (
    value: string,
    list: string[],
    setList: (values: string[]) => void
  ) => {
    setList(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value]
    );
  };

  const publishJob = async () => {
    if (!title.trim() || !description.trim() || !city.trim()) {
      Alert.alert(
        "Required information",
        "Please enter the job title, description and city."
      );
      return;
    }

    if (jobTypes.length === 0) {
      Alert.alert(
        "Select a job category",
        "Choose at least one type of work."
      );
      return;
    }

    if (workingDays.length === 0) {
      Alert.alert(
        "Working days required",
        "Select at least one working day."
      );
      return;
    }

    const amount = Number(salaryAmount || 0);
    const min = Number(salaryMin || 0);
    const max = Number(salaryMax || 0);
    const experience = Number(requiredExperience || 0);

    if ([amount, min, max, experience].some((value) => !Number.isFinite(value) || value < 0)) {
      Alert.alert(
        "Invalid number",
        "Salary and experience values cannot be negative or invalid."
      );
      return;
    }

    if (min > 0 && max > 0 && min > max) {
      Alert.alert(
        "Invalid salary range",
        "The minimum salary cannot be higher than the maximum salary."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post("/jobs", {
        title: title.trim(),
        description: description.trim(),
        jobTypes,
        province,
        city: city.trim(),
        suburb: suburb.trim(),
        employmentType,
        workArrangement,
        workingDays,
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        salaryType,
        salaryAmount: amount,
        salaryMin: min,
        salaryMax: max,
        salaryNegotiable,
        requiredExperience: experience,
        requiredLanguages: requiredLanguages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        responsibilities: responsibilities
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        requirements: requirements
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        accommodationProvided,
        foodProvided,
        status: "active",
        isActive: true,
        allowInterviewRequests: true,
      });

      Alert.alert(
        "Job published",
        response.data?.message || "Your job post has been created.",
        [
          {
            text: "View My Jobs",
            onPress: () => router.replace("/(employer)/job-posts"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to publish job",
        error?.response?.data?.message ||
          "The job could not be published. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back to My Jobs</Text>
        </TouchableOpacity>
        <Text style={styles.heroTitle}>Create a Job Post</Text>
        <Text style={styles.heroSubtitle}>
          Tell suitable candidates about the opportunity.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>1. Job information</Text>

        <Text style={styles.label}>Job title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Live-out nanny for a toddler"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Type of work *</Text>
        <View style={styles.choices}>
          {JOB_TYPES.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={jobTypes.includes(item)}
              onPress={() => toggleListItem(item, jobTypes, setJobTypes)}
            />
          ))}
        </View>

        <Text style={styles.label}>Job description *</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the position and what the successful candidate will do."
          placeholderTextColor="#888"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Responsibilities (one per line)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={responsibilities}
          onChangeText={setResponsibilities}
          placeholder={"Prepare meals\nCare for the children\nKeep the home tidy"}
          placeholderTextColor="#888"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Requirements (one per line)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={requirements}
          onChangeText={setRequirements}
          placeholder={"Previous experience\nReferences available"}
          placeholderTextColor="#888"
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Skills (separate with commas)</Text>
        <TextInput
          style={styles.input}
          value={skills}
          onChangeText={setSkills}
          placeholder="Cooking, childcare, first aid"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>2. Location</Text>

        <Text style={styles.label}>Province *</Text>
        <View style={styles.choices}>
          {PROVINCES.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={province === item}
              onPress={() => setProvince(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>City or town *</Text>
        <TextInput
          style={styles.input}
          value={city}
          onChangeText={setCity}
          placeholder="e.g. Johannesburg"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Suburb</Text>
        <TextInput
          style={styles.input}
          value={suburb}
          onChangeText={setSuburb}
          placeholder="e.g. Midrand"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>3. Working arrangements</Text>

        <Text style={styles.label}>Employment type</Text>
        <View style={styles.choices}>
          {EMPLOYMENT_TYPES.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={employmentType === item}
              onPress={() => setEmploymentType(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Accommodation arrangement</Text>
        <View style={styles.choices}>
          {ARRANGEMENTS.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={workArrangement === item}
              onPress={() => setWorkArrangement(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Working days</Text>
        <View style={styles.choices}>
          {DAYS.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={workingDays.includes(item)}
              onPress={() =>
                toggleListItem(item, workingDays, setWorkingDays)
              }
            />
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Start time</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="08:00"
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>End time</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="17:00"
              placeholderTextColor="#888"
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>4. Salary and benefits</Text>

        <Text style={styles.label}>Salary frequency</Text>
        <View style={styles.choices}>
          {SALARY_TYPES.map((item) => (
            <Choice
              key={item}
              label={item}
              selected={salaryType === item}
              onPress={() => setSalaryType(item)}
            />
          ))}
        </View>

        <Text style={styles.label}>Fixed salary amount (R)</Text>
        <TextInput
          style={styles.input}
          value={salaryAmount}
          onChangeText={setSalaryAmount}
          keyboardType="numeric"
          placeholder="e.g. 7500"
          placeholderTextColor="#888"
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>Minimum salary (R)</Text>
            <TextInput
              style={styles.input}
              value={salaryMin}
              onChangeText={setSalaryMin}
              keyboardType="numeric"
              placeholder="e.g. 7000"
              placeholderTextColor="#888"
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Maximum salary (R)</Text>
            <TextInput
              style={styles.input}
              value={salaryMax}
              onChangeText={setSalaryMax}
              keyboardType="numeric"
              placeholder="e.g. 9000"
              placeholderTextColor="#888"
            />
          </View>
        </View>

        <Choice
          label="Salary is negotiable"
          selected={salaryNegotiable}
          onPress={() => setSalaryNegotiable(!salaryNegotiable)}
        />
        <Choice
          label="Accommodation provided"
          selected={accommodationProvided}
          onPress={() => setAccommodationProvided(!accommodationProvided)}
        />
        <Choice
          label="Food provided"
          selected={foodProvided}
          onPress={() => setFoodProvided(!foodProvided)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>5. Candidate requirements</Text>

        <Text style={styles.label}>Minimum years of experience</Text>
        <TextInput
          style={styles.input}
          value={requiredExperience}
          onChangeText={setRequiredExperience}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#888"
        />

        <Text style={styles.label}>Required languages (comma-separated)</Text>
        <TextInput
          style={styles.input}
          value={requiredLanguages}
          onChangeText={setRequiredLanguages}
          placeholder="English, isiZulu"
          placeholderTextColor="#888"
        />
      </View>

      <TouchableOpacity
        style={[styles.publishButton, submitting && styles.disabled]}
        onPress={publishJob}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.publishText}>Publish Job Post</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footerNote}>
        Fields marked * are required. Your existing backend validates employer
        account and profile eligibility.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F8" },
  content: { paddingBottom: 35 },
  hero: { backgroundColor: "#171717", padding: 22, paddingTop: 18 },
  backText: { color: "#F1A7CD", fontWeight: "700", fontSize: 14 },
  heroTitle: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", marginTop: 22 },
  heroSubtitle: { color: "#E1E1E1", marginTop: 8, lineHeight: 20 },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 14,
    marginTop: 15,
    padding: 17,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAF0",
  },
  sectionTitle: { color: "#222222", fontSize: 18, fontWeight: "900", marginBottom: 12 },
  label: { color: "#353535", fontSize: 13, fontWeight: "700", marginTop: 14, marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: "#DADAE0",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#222222",
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    borderWidth: 1,
    borderColor: "#DDDEE4",
    backgroundColor: "#FAFAFC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  choiceSelected: { backgroundColor: "#FCE6F1", borderColor: PINK },
  choiceText: { color: "#444444", fontSize: 12, fontWeight: "700" },
  choiceTextSelected: { color: PINK },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  publishButton: {
    backgroundColor: PINK,
    marginHorizontal: 14,
    marginTop: 20,
    borderRadius: 13,
    padding: 17,
    alignItems: "center",
  },
  publishText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  disabled: { opacity: 0.65 },
  footerNote: { color: "#777777", fontSize: 12, lineHeight: 18, margin: 18, textAlign: "center" },
});
