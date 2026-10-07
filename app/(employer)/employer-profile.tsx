import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

const WORKER_TYPES = [
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

const EMPLOYMENT_TYPES = [
  "Full Time",
  "Part Time",
  "Live In",
  "Live Out",
  "Day Shift",
  "Night Shift",
  "Weekends",
  "Temporary",
];

const GENDERS = ["Any", "Male", "Female"];

export default function EmployerProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // ==========================================
  // PROFILE STATUS
  // ==========================================

  const [profileExists, setProfileExists] = useState(false);

  // ==========================================
  // EMPLOYER DETAILS
  // ==========================================

  const [contactPerson, setContactPerson] = useState("");
  const [employerType, setEmployerType] =
    useState("Private Household");
  const [householdName, setHouseholdName] = useState("");

  // ==========================================
  // LOCATION
  // ==========================================

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");

  // ==========================================
  // SEARCH PREFERENCES
  // ==========================================

  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [employmentTypes, setEmploymentTypes] =
    useState<string[]>([]);

  const [preferredGender, setPreferredGender] =
    useState("Any");

  const [preferredAgeMin, setPreferredAgeMin] =
    useState("18");

  const [preferredAgeMax, setPreferredAgeMax] =
    useState("65");

  const [preferredExperience, setPreferredExperience] =
    useState("0");

  const [preferredNationalities, setPreferredNationalities] =
    useState("");

  const [preferredLanguages, setPreferredLanguages] =
    useState("");

  const [salaryOffered, setSalaryOffered] =
    useState("");

  // ==========================================
  // LOAD EXISTING EMPLOYER PROFILE
  // ==========================================

  useEffect(() => {
    loadEmployerProfile();
  }, []);

  const loadEmployerProfile = async () => {
    try {
      setLoadingProfile(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again."
        );
        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      console.log(
        "LOADING EMPLOYER PROFILE..."
      );

      const response = await API.get(
        "/profiles/employer"
      );

      const profile = response.data;

      console.log(
        "EMPLOYER PROFILE LOADED:",
        profile
      );

      if (!profile) {
        setProfileExists(false);
        return;
      }

      // ==========================================
      // PROFILE EXISTS
      // ==========================================

      setProfileExists(true);

      // ==========================================
      // EMPLOYER DETAILS
      // ==========================================

      setContactPerson(
        profile.contactPerson || ""
      );

      setEmployerType(
        profile.employerType ||
          "Private Household"
      );

      setHouseholdName(
        profile.householdName || ""
      );

      // ==========================================
      // LOCATION
      // ==========================================

      setProvince(
        profile.province || ""
      );

      setCity(
        profile.city || ""
      );

      setSuburb(
        profile.suburb || ""
      );

      // ==========================================
      // LOOKING FOR
      // ==========================================

      setLookingFor(
        Array.isArray(profile.lookingFor)
          ? profile.lookingFor
          : []
      );

      // ==========================================
      // EMPLOYMENT TYPES
      // ==========================================

      setEmploymentTypes(
        Array.isArray(profile.employmentTypes)
          ? profile.employmentTypes
          : []
      );

      // ==========================================
      // PREFERRED GENDER
      // ==========================================

      setPreferredGender(
        profile.preferredGender || "Any"
      );

      // ==========================================
      // AGE
      // ==========================================

      setPreferredAgeMin(
        String(
          profile.preferredAgeMin ?? 18
        )
      );

      setPreferredAgeMax(
        String(
          profile.preferredAgeMax ?? 65
        )
      );

      // ==========================================
      // EXPERIENCE
      // ==========================================

      setPreferredExperience(
        String(
          profile.preferredExperience ?? 0
        )
      );

      // ==========================================
      // NATIONALITIES
      // ==========================================

      setPreferredNationalities(
        Array.isArray(
          profile.preferredNationalities
        )
          ? profile.preferredNationalities.join(
              ", "
            )
          : ""
      );

      // ==========================================
      // LANGUAGES
      // ==========================================

      setPreferredLanguages(
        Array.isArray(
          profile.preferredLanguages
        )
          ? profile.preferredLanguages.join(
              ", "
            )
          : ""
      );

      // ==========================================
      // SALARY
      // ==========================================

      setSalaryOffered(
        String(
          profile.salaryOffered ?? 0
        )
      );
    } catch (err: any) {
      console.log(
        "EMPLOYER PROFILE LOAD ERROR:",
        err?.response?.data ||
          err.message
      );

      // A 404 means this employer does not
      // currently have a profile.
      if (
        err?.response?.status === 404
      ) {
        setProfileExists(false);
      } else {
        Alert.alert(
          "Profile Error",
          err?.response?.data?.message ||
            "Unable to load your employer profile."
        );
      }
    } finally {
      setLoadingProfile(false);
    }
  };

  // ==========================================
  // TOGGLE WORKER TYPE
  // ==========================================

  const toggleWorkerType = (
    type: string
  ) => {
    setLookingFor((current) =>
      current.includes(type)
        ? current.filter(
            (item) => item !== type
          )
        : [...current, type]
    );
  };

  // ==========================================
  // TOGGLE EMPLOYMENT TYPE
  // ==========================================

  const toggleEmploymentType = (
    type: string
  ) => {
    setEmploymentTypes((current) =>
      current.includes(type)
        ? current.filter(
            (item) => item !== type
          )
        : [...current, type]
    );
  };

  // ==========================================
  // SAVE / UPDATE PROFILE
  // ==========================================

  const saveProfile = async () => {
    // ==========================================
    // VALIDATION
    // ==========================================

    if (!contactPerson.trim()) {
      Alert.alert(
        "Required",
        "Please enter the name of the contact person."
      );
      return;
    }

    if (!province.trim()) {
      Alert.alert(
        "Required",
        "Please enter your province."
      );
      return;
    }

    if (!city.trim()) {
      Alert.alert(
        "Required",
        "Please enter your city."
      );
      return;
    }

    if (lookingFor.length === 0) {
      Alert.alert(
        "Required",
        "Please select at least one type of candidate you are looking for."
      );
      return;
    }

    try {
      setLoading(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again."
        );
        return;
      }

      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;

      // ==========================================
      // BUILD PAYLOAD
      // ==========================================

      const payload = {
        contactPerson:
          contactPerson.trim(),

        employerType,

        householdName:
          householdName.trim(),

        province:
          province.trim(),

        city:
          city.trim(),

        suburb:
          suburb.trim(),

        lookingFor,

        employmentTypes,

        preferredGender,

        preferredAgeMin:
          Number(preferredAgeMin) || 18,

        preferredAgeMax:
          Number(preferredAgeMax) || 65,

        preferredExperience:
          Number(preferredExperience) || 0,

        preferredNationalities:
          preferredNationalities
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        preferredLanguages:
          preferredLanguages
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean),

        salaryOffered:
          Number(salaryOffered) || 0,
      };

      console.log(
        "EMPLOYER PROFILE PAYLOAD:",
        payload
      );

      // ==========================================
      // UPDATE EXISTING PROFILE
      // OR CREATE IF NONE EXISTS
      // ==========================================

      let response;

      if (profileExists) {
        console.log(
          "UPDATING EXISTING EMPLOYER PROFILE..."
        );

        response = await API.put(
          "/profiles/employer",
          payload
        );

        console.log(
          "EMPLOYER PROFILE UPDATED:",
          response.data
        );
      } else {
        console.log(
          "CREATING NEW EMPLOYER PROFILE..."
        );

        response = await API.post(
          "/profiles/employer",
          payload
        );

        console.log(
          "EMPLOYER PROFILE CREATED:",
          response.data
        );

        // The profile now exists.
        setProfileExists(true);
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      Alert.alert(
        profileExists
          ? "Profile Updated"
          : "Profile Created",
        profileExists
          ? "Your employer profile has been updated successfully."
          : "Your employer profile has been created successfully.",
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace(
                "/(employer)/employer-dashboard"
              ),
          },
        ]
      );
    } catch (err: any) {
      console.log(
        "SAVE EMPLOYER PROFILE ERROR:",
        err?.response?.data ||
          err.message
      );

      Alert.alert(
        "Profile Error",
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to save your employer profile."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING PROFILE
  // ==========================================

  if (loadingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />

        <Text style={styles.loadingText}>
          Loading your employer profile...
        </Text>
      </View>
    );
  }

  // ==========================================
  // MAIN UI
  // ==========================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <Text style={styles.heading}>
        {profileExists
          ? "Employer Profile"
          : "Create Employer Profile"}
      </Text>

      <Text style={styles.subtitle}>
        {profileExists
          ? "Update your information and candidate preferences."
          : "Tell us about yourself and the type of candidate you are looking for."}
      </Text>

      {/* ========================================== */}
      {/* EMPLOYER DETAILS */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Employer Details
      </Text>

      <Text style={styles.label}>
        Contact Person *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Your full name"
        placeholderTextColor="#888888"
        value={contactPerson}
        onChangeText={setContactPerson}
      />

      <Text style={styles.label}>
        Employer Type
      </Text>

      <View style={styles.optionContainer}>
        {[
          "Private Household",
          "Business",
          "Agency",
          "Organisation",
        ].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.option,
              employerType === type &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setEmployerType(type)
            }
          >
            <Text
              style={[
                styles.optionText,
                employerType === type &&
                  styles.optionTextSelected,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>
        Household / Business Name
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Optional"
        placeholderTextColor="#888888"
        value={householdName}
        onChangeText={setHouseholdName}
      />

      {/* ========================================== */}
      {/* LOCATION */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Location
      </Text>

      <Text style={styles.label}>
        Province *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Gauteng"
        placeholderTextColor="#888888"
        value={province}
        onChangeText={setProvince}
      />

      <Text style={styles.label}>
        City *
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Johannesburg"
        placeholderTextColor="#888888"
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.label}>
        Suburb
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Optional"
        placeholderTextColor="#888888"
        value={suburb}
        onChangeText={setSuburb}
      />

      {/* ========================================== */}
      {/* LOOKING FOR */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Who Are You Looking For?
      </Text>

      <Text style={styles.helperText}>
        Select one or more candidate types.
      </Text>

      <View style={styles.checkboxContainer}>
        {WORKER_TYPES.map((type) => {
          const selected =
            lookingFor.includes(type);

          return (
            <TouchableOpacity
              key={type}
              style={styles.checkboxRow}
              onPress={() =>
                toggleWorkerType(type)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  selected &&
                    styles.checkboxSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.checkmark}>
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.checkboxText}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ========================================== */}
      {/* EMPLOYMENT TYPE */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Employment Type
      </Text>

      <Text style={styles.helperText}>
        Select all that apply.
      </Text>

      <View style={styles.checkboxContainer}>
        {EMPLOYMENT_TYPES.map((type) => {
          const selected =
            employmentTypes.includes(type);

          return (
            <TouchableOpacity
              key={type}
              style={styles.checkboxRow}
              onPress={() =>
                toggleEmploymentType(type)
              }
            >
              <View
                style={[
                  styles.checkbox,
                  selected &&
                    styles.checkboxSelected,
                ]}
              >
                {selected && (
                  <Text style={styles.checkmark}>
                    ✓
                  </Text>
                )}
              </View>

              <Text style={styles.checkboxText}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ========================================== */}
      {/* PREFERRED GENDER */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Preferred Gender
      </Text>

      <View style={styles.optionContainer}>
        {GENDERS.map((gender) => (
          <TouchableOpacity
            key={gender}
            style={[
              styles.option,
              preferredGender === gender &&
                styles.optionSelected,
            ]}
            onPress={() =>
              setPreferredGender(gender)
            }
          >
            <Text
              style={[
                styles.optionText,
                preferredGender === gender &&
                  styles.optionTextSelected,
              ]}
            >
              {gender}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ========================================== */}
      {/* AGE */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Preferred Candidate Age
      </Text>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>
            Minimum Age
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={preferredAgeMin}
            onChangeText={
              setPreferredAgeMin
            }
          />
        </View>

        <View style={styles.halfInput}>
          <Text style={styles.label}>
            Maximum Age
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={preferredAgeMax}
            onChangeText={
              setPreferredAgeMax
            }
          />
        </View>
      </View>

      {/* ========================================== */}
      {/* EXPERIENCE */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Minimum Experience
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Years of experience"
        placeholderTextColor="#888888"
        value={preferredExperience}
        onChangeText={
          setPreferredExperience
        }
      />

      {/* ========================================== */}
      {/* NATIONALITY */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Preferred Nationalities
      </Text>

      <Text style={styles.helperText}>
        Separate multiple nationalities with commas.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. South African, Zimbabwean"
        placeholderTextColor="#888888"
        value={preferredNationalities}
        onChangeText={
          setPreferredNationalities
        }
      />

      {/* ========================================== */}
      {/* LANGUAGES */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Preferred Languages
      </Text>

      <Text style={styles.helperText}>
        Separate multiple languages with commas.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. English, Zulu, Sotho"
        placeholderTextColor="#888888"
        value={preferredLanguages}
        onChangeText={
          setPreferredLanguages
        }
      />

      {/* ========================================== */}
      {/* SALARY */}
      {/* ========================================== */}

      <Text style={styles.sectionTitle}>
        Salary Offered
      </Text>

      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Monthly salary in Rands"
        placeholderTextColor="#888888"
        value={salaryOffered}
        onChangeText={setSalaryOffered}
      />

      {/* ========================================== */}
      {/* SAVE / UPDATE BUTTON */}
      {/* ========================================== */}

      <TouchableOpacity
        style={[
          styles.createButton,
          loading &&
            styles.buttonDisabled,
        ]}
        onPress={saveProfile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            color="#FFFFFF"
          />
        ) : (
          <Text
            style={styles.createButtonText}
          >
            {profileExists
              ? "Save / Update Profile"
              : "Create Employer Profile"}
          </Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  content: {
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#666",
    lineHeight: 23,
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222",
    marginTop: 20,
    marginBottom: 12,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#444",
    marginBottom: 7,
  },

  helperText: {
    fontSize: 14,
    color: "#777",
    marginBottom: 12,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: "#222222",
    marginBottom: 15,
  },

  optionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 5,
  },

  option: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 10,
  },

  optionSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },

  optionText: {
    color: "#444",
    fontSize: 14,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  checkboxContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 5,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#CCC",
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  checkboxText: {
    fontSize: 16,
    color: "#333",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  halfInput: {
    width: "48%",
  },

  createButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 30,
    elevation: 3,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});