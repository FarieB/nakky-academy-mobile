import AsyncStorage from "@react-native-async-storage/async-storage";
import CheckBox from "expo-checkbox";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
  const [profileExists, setProfileExists] = useState(false);
  const [step, setStep] = useState(1);

  // =====================================
  // STEP 1
  // =====================================

  const [profilePhoto, setProfilePhoto] = useState("");

  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");

  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");

  const [languages, setLanguages] = useState<string[]>([]);

  const [bio, setBio] = useState("");

  // =====================================
  // STEP 2
  // =====================================

  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [suburb, setSuburb] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  // =====================================
  // STEP 3
  // =====================================

  const [workerTypes, setWorkerTypes] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [workPreferences, setWorkPreferences] = useState<string[]>([]);

  const [yearsExperience, setYearsExperience] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");

  const [availabilityStatus, setAvailabilityStatus] =
    useState("Available Immediately");

  const [dayShift, setDayShift] = useState(false);
  const [nightShift, setNightShift] = useState(false);

  // =====================================
  // STEP 4
  // =====================================

  const [idDocument, setIdDocument] = useState("");
  const [cv, setCv] = useState("");
  const [policeClearance, setPoliceClearance] = useState("");

  const [qualifications, setQualifications] = useState<string[]>([]);
  const [references, setReferences] = useState<string[]>([]);

    useEffect(() => {
    loadProfile();
  }, []);

  // =====================================
  // PHOTO PICKER
  // =====================================

  const pickProfilePhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setProfilePhoto(result.assets[0].uri);
    } catch {
      Alert.alert("Error", "Unable to select image.");
    }
  };

  // =====================================
  // DOCUMENT PICKER
  // =====================================

  const pickDocument = async (
    type:
      | "id"
      | "cv"
      | "police"
      | "qualification"
      | "reference"
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
          setQualifications((prev) => [...prev, file]);
          break;

        case "reference":
          setReferences((prev) => [...prev, file]);
          break;
      }
    } catch {
      Alert.alert("Error", "Unable to select file.");
    }
  };

  // =====================================
  // NAVIGATION
  // =====================================

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const previousStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // =====================================
  // CHECKBOX HELPERS
  // =====================================

  const toggleWorkerType = (value: string) => {
    setWorkerTypes((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleLanguage = (value: string) => {
    setLanguages((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleSkill = (value: string) => {
    setSkills((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleWorkPreference = (value: string) => {
    setWorkPreferences((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const loadProfile = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    API.defaults.headers.common.Authorization = `Bearer ${token}`;

    const { data } = await API.get("/profiles/candidate");
    setProfileExists(true);

    if (!data) return;

    // Personal
    setProfilePhoto(data.profilePhoto || "");
    setFirstName(data.firstName || "");
    setSurname(data.surname || "");
    setGender(data.gender || "");
    setNationality(data.nationality || "");
    setBio(data.bio || "");

    if (data.dateOfBirth) {
      const date = new Date(data.dateOfBirth);

      const formatted =
        String(date.getDate()).padStart(2, "0") +
        "/" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "/" +
        date.getFullYear();

      setDateOfBirth(formatted);
    }

    setLanguages(data.languages || []);

    // Location
    setProvince(data.province || "");
    setCity(data.city || "");
    setSuburb(data.suburb || "");
    setStreetAddress(data.streetAddress || "");

    // Employment
    setWorkerTypes(data.workerTypes || []);
    setSkills(data.skills || []);
    setWorkPreferences(data.workPreferences || []);

    setYearsExperience(String(data.yearsExperience || 0));
    setExpectedSalary(String(data.expectedSalary || 0));

    setAvailabilityStatus(
      data.availabilityStatus || "Available Immediately"
    );

    // Documents
    setQualifications(data.qualifications || []);
    setReferences(data.references || []);

    if (data.documents) {
      setIdDocument(data.documents.idDocument || "");
      setCv(data.documents.cv || "");
      setPoliceClearance(data.documents.policeClearance || "");
    }
  } catch (err) {
    console.log("No existing profile found.");
  }
};

// ===========================
// SAVE PROFILE
// ===========================

const saveProfile = async () => {
  console.log("========== SAVE PROFILE ==========");

  try {
    setSaving(true);

    const token = await AsyncStorage.getItem("token");

    console.log("Token:", token);

    API.defaults.headers.common.Authorization = `Bearer ${token}`;

    const payload = {
      firstName,
      surname,
      gender,
      dateOfBirth: new Date(
        dateOfBirth.split("/").reverse().join("-")
      ),
      nationality,
      bio,

      province,
      city,
      suburb,
      streetAddress,

      workerTypes,
      languages,
      skills,

      yearsExperience: Number(yearsExperience),
      expectedSalary: Number(expectedSalary),

      availabilityStatus,
      workPreferences,

      shifts: {
        day: dayShift,
        night: nightShift,
      },

      profilePhoto,

      qualifications: qualifications.map((file) => ({
      title: "Qualification",
      institution: "",
      yearCompleted: new Date().getFullYear(),
      certificateFile: file,
    })),

      references: references.map(() => ({
      name: "",
      relationship: "",
      phone: "",
    })),

      documents: {
        idDocument,
        policeClearance,
        cv,
      },
    };

    console.log("Payload:");
    console.log(payload);

    // Dynamic HTTP verb routing based on profile state toggle
    if (profileExists) {
      await API.put("/profiles/candidate", payload);
    } else {
      await API.post("/profiles/candidate", payload);
    }

    console.log("SUCCESS");

    Alert.alert(
    "Success",
    profileExists
      ? "Profile updated successfully."
      : "Profile created successfully."
  ); 

    router.replace("/(candidate)/candidate-dashboard");
  } catch (err: any) {
    console.log("========== PROFILE ERROR ==========");
    console.log("Status:", err.response?.status);
    console.log("Response:", err.response?.data);
    console.log("Message:", err.message);
    console.log("Full Error:", err);

    Alert.alert(
      "Profile Error",
      JSON.stringify(err.response?.data || err.message)
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
              source={{ uri: profilePhoto }}
              style={styles.profileImage}
            />
          ) : (
            <>
              <Text style={styles.photoIcon}>👤</Text>
              <Text style={styles.photoText}>
                Upload Profile Picture
              </Text>
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
          placeholder="Surname"
          value={surname}
          onChangeText={setSurname}
        />

        <Text style={styles.label}>Gender</Text>

        <View style={styles.optionGrid}>

          <TouchableOpacity
            style={[
              styles.optionButton,
              gender === "Female" && styles.optionSelected,
            ]}
            onPress={() => setGender("Female")}
          >
            <Text
              style={[
                styles.optionText,
                gender === "Female" && styles.optionTextSelected,
              ]}
            >
              Female
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              gender === "Male" && styles.optionSelected,
            ]}
            onPress={() => setGender("Male")}
          >
            <Text
              style={[
                styles.optionText,
                gender === "Male" && styles.optionTextSelected,
              ]}
            >
              Male
            </Text>
          </TouchableOpacity>

        </View>

        <TextInput
          style={styles.input}
          placeholder="Date of Birth (DD/MM/YYYY)"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        <TextInput
          style={styles.input}
          placeholder="Nationality"
          value={nationality}
          onChangeText={setNationality}
        />

        <Text style={styles.label}>Languages Spoken</Text>

        <View style={styles.checkboxContainer}>

          {[
            "English",
            "Zulu",
            "Xhosa",
            "Sotho",
            "Xitsonga",
            "Tswana",
            "Venda",
            "Ndebele",
            "Swati",
            "Shona",
          ].map((language) => (
            <View key={language} style={styles.checkboxRow}>
              <CheckBox
                value={languages.includes(language)}
                onValueChange={() => toggleLanguage(language)}
                color="#4CAF50"
              />
              <Text style={styles.checkboxLabel}>
                {language}
              </Text>
            </View>
          ))}

        </View>

        <TextInput
          style={[
            styles.input,
            {
              height: 130,
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
          placeholder="Street Address"
          value={streetAddress}
          onChangeText={setStreetAddress}
        />

        <Text style={styles.label}>Province</Text>

        <View style={styles.checkboxContainer}>

          {[
            "Gauteng",
            "Western Cape",
            "KwaZulu-Natal",
            "Eastern Cape",
            "Free State",
            "Limpopo",
            "Mpumalanga",
            "North West",
            "Northern Cape",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                province === item && styles.optionSelected,
                { marginBottom: 10 },
              ]}
              onPress={() => setProvince(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  province === item && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}

        </View>

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

        <View
          style={{
            backgroundColor: "#E8F5E9",
            padding: 15,
            borderRadius: 12,
            marginTop: 10,
          }}
        >
          <Text
            style={{
              color: "#2E7D32",
              fontWeight: "700",
              marginBottom: 5,
            }}
          >
            Why do we ask for your location?
          </Text>

          <Text style={{ color: "#555", lineHeight: 22 }}>
            Employers often search for candidates close to them. Your exact address
            is never shown publicly—only your suburb, city and province.
          </Text>
        </View>
      </>
    )}

      {/* ========================= */}
      {/* STEP 3 */}
      {/* ========================= */}

          {step === 3 && (
      <>
        <Text style={styles.section}>Employment Information</Text>

        {/* Worker Types */}

        <Text style={styles.label}>What jobs are you looking for?</Text>

        <View style={styles.optionGrid}>
          {[
            "Caregiver",
            "Nanny",
            "Babysitter",
            "Domestic Helper",
            "Housekeeper",
            "Cook",
            "Driver",
            "Gardener",
            "Au Pair",
            "Disability Care",
            "Elderly Care",
            "Cleaner",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                workerTypes.includes(item) && styles.optionSelected,
              ]}
              onPress={() => toggleWorkerType(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  workerTypes.includes(item) && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Experience */}

        <Text style={styles.label}>Years of Experience</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          keyboardType="numeric"
          value={yearsExperience}
          onChangeText={setYearsExperience}
        />

        {/* Salary */}

        <Text style={styles.label}>Expected Monthly Salary (R)</Text>

        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 6500"
          value={expectedSalary}
          onChangeText={setExpectedSalary}
        />

        {/* Languages */}

        <Text style={styles.label}>Languages Spoken</Text>

        <View style={styles.optionGrid}>
          {[
             "English",
              "isiZulu",
              "isiXhosa",
              "Afrikaans",
              "Xitsonga",
              "Sesotho",
              "Setswana",
              "Sepedi",
              "Siswati",
              "Tshivenda",
              "Ndebele",
              "Portuguese",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                languages.includes(item) && styles.optionSelected,
              ]}
              onPress={() => toggleLanguage(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  languages.includes(item) && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Skills */}

        <Text style={styles.label}>Skills</Text>

        <View style={styles.optionGrid}>
          {[
            "Cooking",
            "Cleaning",
            "Laundry",
            "Ironing",
            "Child Care",
            "Infant Care",
            "Homework Help",
            "Elderly Care",
            "Medication",
            "CPR",
            "Driving",
            "Pet Care",
            "First Aid",
            "Housekeeping",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                skills.includes(item) && styles.optionSelected,
              ]}
              onPress={() => toggleSkill(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  skills.includes(item) && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Availability */}

        <Text style={styles.label}>Availability</Text>

        <View style={styles.optionGrid}>
          {[
            "Available Immediately",
            "1 Week Notice",
            "2 Weeks Notice",
            "1 Month Notice",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                availabilityStatus === item && styles.optionSelected,
              ]}
              onPress={() => setAvailabilityStatus(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  availabilityStatus === item && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Work Preference */}

        <Text style={styles.label}>Work Preference</Text>

        <View style={styles.optionGrid}>
          {[
            "Full Time",
            "Part Time",
            "Live In",
            "Live Out",
            "Temporary",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.optionButton,
                workPreferences.includes(item) && styles.optionSelected,
              ]}
              onPress={() => toggleWorkPreference(item)}
            >
              <Text
                style={[
                  styles.optionText,
                  workPreferences.includes(item) && styles.optionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Shifts */}

        <Text style={styles.label}>Preferred Shift</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Day Shift</Text>
          <Switch value={dayShift} onValueChange={setDayShift} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Night Shift</Text>
          <Switch value={nightShift} onValueChange={setNightShift} />
        </View>
      </>
    )}

      {/* ========================= */}
      {/* STEP 4 - DOCUMENTS */}
      {/* ========================= */}

      {step === 4 && (
      <>
        <Text style={styles.section}>Verification Documents</Text>

        <Text style={styles.infoText}>
          Upload your documents to improve your chances of getting hired.
          Verified candidates receive a verification badge after review.
        </Text>

        {/* Profile Photo */}

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={pickProfilePhoto}
        >
          <Text style={styles.uploadTitle}>📷 Profile Photo</Text>

          <Text style={styles.uploadSubtitle}>
            {profilePhoto
              ? "✅ Photo Selected"
              : "Tap to upload a profile picture"}
          </Text>
        </TouchableOpacity>

        {/* ID */}

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => pickDocument("id")}
        >
          <Text style={styles.uploadTitle}>🪪 South African ID / Passport</Text>

          <Text style={styles.uploadSubtitle}>
            {idDocument
              ? "✅ Document Uploaded"
              : "Upload identification"}
          </Text>
        </TouchableOpacity>

        {/* CV */}

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => pickDocument("cv")}
        >
          <Text style={styles.uploadTitle}>📄 Curriculum Vitae (CV)</Text>

          <Text style={styles.uploadSubtitle}>
            {cv
              ? "✅ CV Uploaded"
              : "Upload your latest CV"}
          </Text>
        </TouchableOpacity>

        {/* Police Clearance */}

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => pickDocument("police")}
        >
          <Text style={styles.uploadTitle}>👮 Police Clearance</Text>

          <Text style={styles.uploadSubtitle}>
            {policeClearance
              ? "✅ Uploaded"
              : "Optional but highly recommended"}
          </Text>
        </TouchableOpacity>

        {/* Qualifications */}

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => pickDocument("qualification")}
        >
          <Text style={styles.uploadTitle}>🎓 Qualifications</Text>

          <Text style={styles.uploadSubtitle}>
            {qualifications.length} file(s) uploaded
          </Text>
        </TouchableOpacity>

        {/* References */}

        <TouchableOpacity
          style={styles.uploadCard}
          onPress={() => pickDocument("reference")}
        >
          <Text style={styles.uploadTitle}>👥 References</Text>

          <Text style={styles.uploadSubtitle}>
            {references.length} reference(s) uploaded
          </Text>
        </TouchableOpacity>

        <View style={styles.verificationBox}>
          <Text style={styles.verificationTitle}>
            ✔ Verification Benefits
          </Text>

          <Text style={styles.verificationText}>
            • Verification Badge{"\n"}
            • Higher search ranking{"\n"}
            • More employer trust{"\n"}
            • Better chances of getting hired
          </Text>
        </View>
      </>
    )}

      {/* ========================= */}
      {/* STEP 5 - REVIEW */}
      {/* ========================= */}

      {step === 5 && (
      <>
        <Text style={styles.section}>Review Your Profile</Text>

        <Text style={styles.infoText}>
          Please review all the information below before creating your profile.
        </Text>

        {/* Personal */}

        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>👤 Personal Information</Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Name:</Text> {firstName} {surname}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Gender:</Text> {gender}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Date of Birth:</Text> {dateOfBirth}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Nationality:</Text> {nationality}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Languages:</Text>{" "}
            {languages.join(", ")}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>About Me:</Text> {bio}
          </Text>
        </View>

        {/* Location */}

        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>📍 Location</Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Province:</Text> {province}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>City:</Text> {city}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Suburb:</Text> {suburb}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Street:</Text> {streetAddress}
          </Text>
        </View>

        {/* Employment */}

        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>💼 Employment</Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Worker Types:</Text>{" "}
            {workerTypes.join(", ")}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Skills:</Text>{" "}
            {skills.join(", ")}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Experience:</Text>{" "}
            {yearsExperience} years
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Expected Salary:</Text> R{" "}
            {expectedSalary}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Availability:</Text>{" "}
            {availabilityStatus}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Work Preference:</Text>{" "}
            {workPreferences.join(", ")}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Day Shift:</Text>{" "}
            {dayShift ? "Yes" : "No"}
          </Text>

          <Text style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Night Shift:</Text>{" "}
            {nightShift ? "Yes" : "No"}
          </Text>
        </View>

        {/* Documents */}

        <View style={styles.reviewCard}>
          <Text style={styles.reviewHeading}>📂 Verification</Text>

          <Text style={styles.reviewItem}>
            Profile Photo: {profilePhoto ? "✅" : "❌"}
          </Text>

          <Text style={styles.reviewItem}>
            ID Document: {idDocument ? "✅" : "❌"}
          </Text>

          <Text style={styles.reviewItem}>
            CV: {cv ? "✅" : "❌"}
          </Text>

          <Text style={styles.reviewItem}>
            Police Clearance: {policeClearance ? "✅" : "❌"}
          </Text>

          <Text style={styles.reviewItem}>
            Qualifications: {qualifications.length}
          </Text>

          <Text style={styles.reviewItem}>
            References: {references.length}
          </Text>
        </View>

        <View style={styles.successBox}>
          <Text style={styles.successTitle}>
            🎉 You're Ready!
          </Text>

          <Text style={styles.successText}>
            Tap "Create Profile" below to publish your profile and start receiving opportunities from employers.
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
           <Text style={styles.saveButtonText}>
          {profileExists ? "✔ Update Profile" : "✔ Create Profile"}
        </Text> 
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

  label: {
  fontSize: 17,
  fontWeight: "700",
  color: "#333",
  marginBottom: 15,
  },

  checkboxContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  checkboxLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },

  optionGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  marginBottom: 20,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },

  optionSelected: {
    backgroundColor: "#4CAF50",
  },

  optionText: {
    color: "#4CAF50",
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  infoText: {
  color: "#666",
  fontSize: 15,
  marginBottom: 20,
  lineHeight: 22,
  },

  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  uploadTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },

  uploadSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },

  verificationBox: {
    marginTop: 20,
    backgroundColor: "#E8F5E9",
    borderRadius: 15,
    padding: 18,
  },

  verificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 10,
  },

  verificationText: {
    fontSize: 15,
    color: "#555",
    lineHeight: 24,
  },

  reviewCard: {
  backgroundColor: "#FFFFFF",
  borderRadius: 16,
  padding: 18,
  marginBottom: 18,
  borderWidth: 1,
  borderColor: "#EEEEEE",
  },

  reviewHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4CAF50",
    marginBottom: 15,
  },

  reviewItem: {
    fontSize: 15,
    color: "#444",
    marginBottom: 8,
    lineHeight: 22,
  },

  reviewLabel: {
    fontWeight: "700",
  },

  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    alignItems: "center",
  },

  successTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E7D32",
    marginBottom: 10,
  },

  successText: {
    textAlign: "center",
    color: "#555",
    fontSize: 15,
    lineHeight: 22,
  },
});