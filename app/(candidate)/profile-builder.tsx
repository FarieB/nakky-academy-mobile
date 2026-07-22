import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function ProfileBuilder() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  const [step, setStep] = useState(1);

  // ===========================
  // PERSONAL
  // ===========================

  const [profilePhoto, setProfilePhoto] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [bio, setBio] = useState("");

  // ===========================
  // LOCATION
  // ===========================

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");

  // ===========================
  // EMPLOYMENT
  // ===========================

  const [workerTypes, setWorkerTypes] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [languages, setLanguages] = useState("");
  const [skills, setSkills] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("available-now");
  const [workPreferences, setWorkPreferences] = useState("full-time");
  const [nightShift, setNightShift] = useState(false);
  const [dayShift, setDayShift] = useState(true);

  // ===========================
  // DOCUMENTS
  // ===========================

  const [idDocument, setIdDocument] = useState("");
  const [cv, setCv] = useState("");
  const [policeClearance, setPoliceClearance] = useState("");
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [references, setReferences] = useState<string[]>([]);

  // ===========================
  // PICK PROFILE PHOTO
  // ===========================

  const pickProfilePhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setProfilePhoto(result.assets[0].uri);
    } catch (err) {
      Alert.alert("Error", "Unable to select photo.");
    }
  };

  // ===========================
  // PICK DOCUMENT
  // ===========================

  const pickDocument = async (
    type: "id" | "cv" | "police" | "qualification" | "reference"
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0].uri;

      switch (type) {
        case "id":
          setIdDocument(file);
          break;

        case "cv":
          setCv(file);
          break;

        case "police":
          setPoliceClearance(file);
          break;

        case "qualification":
          setQualifications([...qualifications, file]);
          break;

        case "reference":
          setReferences([...references, file]);
          break;
      }
    } catch {
      Alert.alert("Error", "Unable to select file.");
    }
  };

  // ===========================
  // NEXT STEP
  // ===========================

  const nextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  // ===========================
  // PREVIOUS STEP
  // ===========================

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // ===========================
  // SAVE PROFILE
  // ===========================

  const saveProfile = async () => {
    try {
      setSaving(true);

      const token = await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization = `Bearer ${token}`;

      await API.post("/profile/candidate", {
        firstName,
        lastName,
        gender,
        dateOfBirth,
        nationality,
        bio,

        province,
        city,
        suburb,

        workerTypes: workerTypes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        languages: languages
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        skills: skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        yearsExperience: Number(yearsExperience),

        expectedSalary: Number(expectedSalary),

        availabilityStatus,

        workPreferences: workPreferences
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),

        shifts: {
          day: dayShift,
          night: nightShift,
        },

        uploadedDocuments: {
          profilePhoto,
          idDocument,
          cv,
          policeClearance,
          qualifications,
          references,
        },
      });

      Alert.alert("Success", "Profile created successfully.");

      router.replace("/(candidate)");
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Unable to create profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===========================
  // LOADING STATE
  // ===========================

  if (saving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Saving profile...</Text>
      </View>
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Candidate Profile Builder</Text>

      <Text style={styles.subHeading}>Step {step} of 5</Text>

      {/* Progress Bar */}

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${step * 20}%`,
            },
          ]}
        />
      </View>

      {/* ========================= */}
      {/* STEP 1 */}
      {/* ========================= */}

      {step === 1 && (
        <>
          <Text style={styles.section}>Personal Information</Text>

          <TouchableOpacity
            style={styles.photoContainer}
            onPress={pickProfilePhoto}
          >
            {profilePhoto ? (
              <Image
                source={{
                  uri: profilePhoto,
                }}
                style={styles.profileImage}
              />
            ) : (
              <>
                <Text style={styles.photoIcon}>📷</Text>

                <Text style={styles.photoText}>Upload Profile Photo</Text>
              </>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            style={styles.input}
            placeholder="Gender"
            value={gender}
            onChangeText={setGender}
          />

          <TextInput
            style={styles.input}
            placeholder="Date of Birth"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />

          <TextInput
            style={styles.input}
            placeholder="Nationality"
            value={nationality}
            onChangeText={setNationality}
          />

          <TextInput
            style={[
              styles.input,
              {
                height: 120,
                textAlignVertical: "top",
              },
            ]}
            multiline
            placeholder="Tell employers about yourself..."
            value={bio}
            onChangeText={setBio}
          />
        </>
      )}

      {/* ========================= */}
      {/* STEP 2 */}
      {/* ========================= */}

      {step === 2 && (
        <>
          <Text style={styles.section}>Location</Text>

          <TextInput
            style={styles.input}
            placeholder="Province"
            value={province}
            onChangeText={setProvince}
          />

          <TextInput
            style={styles.input}
            placeholder="City / Town"
            value={city}
            onChangeText={setCity}
          />

          <TextInput
            style={styles.input}
            placeholder="Suburb"
            value={suburb}
            onChangeText={setSuburb}
          />
        </>
      )}

      {/* ========================= */}
      {/* STEP 3 */}
      {/* ========================= */}

      {step === 3 && (
        <>
          <Text style={styles.section}>Employment Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Worker Types (comma separated)"
            value={workerTypes}
            onChangeText={setWorkerTypes}
          />

          <TextInput
            style={styles.input}
            placeholder="Languages"
            value={languages}
            onChangeText={setLanguages}
          />

          <TextInput
            style={styles.input}
            placeholder="Skills"
            value={skills}
            onChangeText={setSkills}
          />

          <TextInput
            style={styles.input}
            placeholder="Years Experience"
            keyboardType="numeric"
            value={yearsExperience}
            onChangeText={setYearsExperience}
          />

          <TextInput
            style={styles.input}
            placeholder="Expected Salary"
            keyboardType="numeric"
            value={expectedSalary}
            onChangeText={setExpectedSalary}
          />

          <TextInput
            style={styles.input}
            placeholder="Availability"
            value={availabilityStatus}
            onChangeText={setAvailabilityStatus}
          />

          <TextInput
            style={styles.input}
            placeholder="Work Preferences"
            value={workPreferences}
            onChangeText={setWorkPreferences}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Available for Day Shift</Text>

            <Switch value={dayShift} onValueChange={setDayShift} />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Available for Night Shift</Text>

            <Switch value={nightShift} onValueChange={setNightShift} />
          </View>
        </>
      )}

      {/* ========================= */}
      {/* STEP 4 - DOCUMENTS */}
      {/* ========================= */}

      {step === 4 && (
        <>
          <Text style={styles.section}>Documents</Text>

          <TouchableOpacity
            style={styles.documentButton}
            onPress={() => pickDocument("id")}
          >
            <Text style={styles.documentButtonText}>
              📄 Upload ID Document
            </Text>
          </TouchableOpacity>

          {idDocument ? (
            <Text style={styles.fileName}>✅ ID Document Selected</Text>
          ) : null}

          <TouchableOpacity
            style={styles.documentButton}
            onPress={() => pickDocument("cv")}
          >
            <Text style={styles.documentButtonText}>📄 Upload CV</Text>
          </TouchableOpacity>

          {cv ? <Text style={styles.fileName}>✅ CV Selected</Text> : null}

          <TouchableOpacity
            style={styles.documentButton}
            onPress={() => pickDocument("police")}
          >
            <Text style={styles.documentButtonText}>
              📄 Upload Police Clearance
            </Text>
          </TouchableOpacity>

          {policeClearance ? (
            <Text style={styles.fileName}>✅ Police Clearance Selected</Text>
          ) : null}

          <TouchableOpacity
            style={styles.documentButton}
            onPress={() => pickDocument("qualification")}
          >
            <Text style={styles.documentButtonText}>
              🎓 Add Qualification
            </Text>
          </TouchableOpacity>

          <Text style={styles.counter}>
            Qualifications: {qualifications.length}
          </Text>

          <TouchableOpacity
            style={styles.documentButton}
            onPress={() => pickDocument("reference")}
          >
            <Text style={styles.documentButtonText}>👥 Add Reference</Text>
          </TouchableOpacity>

          <Text style={styles.counter}>References: {references.length}</Text>
        </>
      )}

      {/* ========================= */}
      {/* STEP 5 - REVIEW */}
      {/* ========================= */}

      {step === 5 && (
        <>
          <Text style={styles.section}>Review Profile</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Personal</Text>

            <Text style={styles.summaryText}>
              {firstName} {lastName}
            </Text>

            <Text style={styles.summaryText}>{gender}</Text>

            <Text style={styles.summaryText}>{nationality}</Text>

            <Text style={styles.summaryTitle}>Location</Text>

            <Text style={styles.summaryText}>{province}</Text>

            <Text style={styles.summaryText}>{city}</Text>

            <Text style={styles.summaryText}>{suburb}</Text>

            <Text style={styles.summaryTitle}>Employment</Text>

            <Text style={styles.summaryText}>{workerTypes}</Text>

            <Text style={styles.summaryText}>
              {yearsExperience} years experience
            </Text>

            <Text style={styles.summaryText}>R {expectedSalary}</Text>

            <Text style={styles.summaryText}>{languages}</Text>

            <Text style={styles.summaryText}>{skills}</Text>

            <Text style={styles.summaryTitle}>Documents</Text>

            <Text style={styles.summaryText}>
              Qualifications: {qualifications.length}
            </Text>

            <Text style={styles.summaryText}>
              References: {references.length}
            </Text>
          </View>
        </>
      )}

      {/* ========================= */}
      {/* NAVIGATION */}
      {/* ========================= */}

      <View style={styles.navigationRow}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.previousButton}
            onPress={previousStep}
          >
            <Text style={styles.previousButtonText}>← Previous</Text>
          </TouchableOpacity>
        )}

        {step < 5 ? (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
            <Text style={styles.saveButtonText}>✔ Save Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
    padding: 20,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
  },

  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 10,
    marginBottom: 5,
  },

  subHeading: {
    fontSize: 16,
    color: "#777",
    marginBottom: 20,
  },

  progressBackground: {
    width: "100%",
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 30,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 20,
  },

  section: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 20,
    marginTop: 10,
  },

  photoContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#4CAF50",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    height: 180,
    marginBottom: 25,
  },

  profileImage: {
    width: 170,
    height: 170,
    borderRadius: 85,
  },

  photoIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  photoText: {
    fontSize: 17,
    color: "#4CAF50",
    fontWeight: "700",
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 15,
  },

  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  switchLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  documentButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },

  documentButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  fileName: {
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 15,
    marginLeft: 5,
  },

  counter: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
    marginLeft: 5,
  },

  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
    marginTop: 12,
    marginBottom: 8,
  },

  summaryText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 5,
  },

  navigationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },

  previousButton: {
    backgroundColor: "#9E9E9E",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    minWidth: 130,
    alignItems: "center",
  },

  previousButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  nextButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    minWidth: 130,
    alignItems: "center",
  },

  nextButtonText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});