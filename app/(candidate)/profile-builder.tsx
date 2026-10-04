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

type QualificationItem = {
  title?: string;
  institution?: string;
  yearCompleted?: number;
  certificateFile?: string;
};

type ReferenceItem = {
  file?: string;
};

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

  // These contain either:
  // - a local file:// URI for a newly selected file
  // - a server filename for an existing uploaded file
  const [idDocument, setIdDocument] = useState("");
  const [cv, setCv] = useState("");
  const [policeClearance, setPoliceClearance] = useState("");

  const [qualifications, setQualifications] = useState<
    (string | QualificationItem)[]
  >([]);

  const [references, setReferences] = useState<(string | ReferenceItem)[]>(
    []
  );

  useEffect(() => {
    loadProfile();
  }, []);

  // =====================================
  // FILE HELPERS
  // =====================================

  const getFileName = (uri: string, fallback: string) => {
    const cleanUri = uri.split("?")[0];
    const parts = cleanUri.split("/");
    const name = parts[parts.length - 1];

    return name || fallback;
  };

  const getMimeType = (uri: string) => {
    const cleanUri = uri.split("?")[0];
    const extension = cleanUri
      .split(".")
      .pop()
      ?.toLowerCase();

    switch (extension) {
      case "pdf":
        return "application/pdf";

      case "jpg":
      case "jpeg":
        return "image/jpeg";

      case "png":
        return "image/png";

      case "gif":
        return "image/gif";

      case "webp":
        return "image/webp";

      case "doc":
        return "application/msword";

      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      case "xls":
        return "application/vnd.ms-excel";

      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      case "txt":
        return "text/plain";

      default:
        return "application/octet-stream";
    }
  };

  const isLocalFile = (value: string) => {
    return (
      value.startsWith("file://") ||
      value.startsWith("content://")
    );
  };

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
  // UPLOAD CANDIDATE DOCUMENTS
  // =====================================

  const uploadCandidateDocuments = async (token: string) => {
    const formData = new FormData();

    let hasNewDocuments = false;

    // -------------------------------------
    // ID DOCUMENT
    // -------------------------------------

    if (idDocument && isLocalFile(idDocument)) {
      formData.append("idDocument", {
        uri: idDocument,
        name: getFileName(idDocument, "id-document"),
        type: getMimeType(idDocument),
      } as any);

      hasNewDocuments = true;
    }

    // -------------------------------------
    // CV
    // -------------------------------------

    if (cv && isLocalFile(cv)) {
      formData.append("cv", {
        uri: cv,
        name: getFileName(cv, "cv"),
        type: getMimeType(cv),
      } as any);

      hasNewDocuments = true;
    }

    // -------------------------------------
    // POLICE CLEARANCE
    // -------------------------------------

    if (policeClearance && isLocalFile(policeClearance)) {
      formData.append("policeClearance", {
        uri: policeClearance,
        name: getFileName(
          policeClearance,
          "police-clearance"
        ),
        type: getMimeType(policeClearance),
      } as any);

      hasNewDocuments = true;
    }

    // -------------------------------------
    // QUALIFICATIONS
    // -------------------------------------

    qualifications.forEach((item) => {
      if (typeof item === "string" && isLocalFile(item)) {
        formData.append("qualifications", {
          uri: item,
          name: getFileName(item, "qualification"),
          type: getMimeType(item),
        } as any);

        hasNewDocuments = true;
      }
    });

    // -------------------------------------
    // REFERENCES
    // -------------------------------------

    references.forEach((item) => {
      if (typeof item === "string" && isLocalFile(item)) {
        formData.append("references", {
          uri: item,
          name: getFileName(item, "reference"),
          type: getMimeType(item),
        } as any);

        hasNewDocuments = true;
      }
    });

    if (!hasNewDocuments) {
      return null;
    }

    console.log("Uploading candidate documents...");

    const response = await API.post(
      "/profiles/candidate/profile-documents",
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log(
      "Candidate documents uploaded successfully."
    );

    return response.data;
  };

  // =====================================
  // NAVIGATION
  // =====================================

  const nextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const previousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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

  // =====================================
  // LOAD PROFILE
  // =====================================

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const { data } = await API.get("/profiles/candidate");

      setProfileExists(true);

      if (!data) return;

      // -------------------------------------
      // PERSONAL
      // -------------------------------------

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

      // -------------------------------------
      // LOCATION
      // -------------------------------------

      setProvince(data.province || "");
      setCity(data.city || "");
      setSuburb(data.suburb || "");
      setStreetAddress(data.streetAddress || "");

      // -------------------------------------
      // EMPLOYMENT
      // -------------------------------------

      setWorkerTypes(data.workerTypes || []);
      setSkills(data.skills || []);
      setWorkPreferences(data.workPreferences || []);

      setYearsExperience(
        String(data.yearsExperience || 0)
      );

      setExpectedSalary(
        String(data.expectedSalary || 0)
      );

      setAvailabilityStatus(
        data.availabilityStatus ||
          "Available Immediately"
      );

      // -------------------------------------
      // SHIFT PREFERENCES
      // -------------------------------------

      if (data.shifts) {
        setDayShift(Boolean(data.shifts.day));
        setNightShift(Boolean(data.shifts.night));
      }

      // -------------------------------------
      // DOCUMENTS
      // -------------------------------------

      setQualifications(
        Array.isArray(data.qualifications)
          ? data.qualifications
          : []
      );

      setReferences(
        Array.isArray(data.references)
          ? data.references
          : []
      );

      if (data.documents) {
        setIdDocument(
          data.documents.idDocument || ""
        );

        setCv(data.documents.cv || "");

        setPoliceClearance(
          data.documents.policeClearance || ""
        );
      }
    } catch (err) {
      console.log(
        "No existing profile found."
      );
    }
  };

  // =====================================
  // SAVE PROFILE
  // =====================================

  const saveProfile = async () => {
    console.log(
      "========== SAVE PROFILE =========="
    );

    try {
      setSaving(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Session Error",
          "Your login session has expired. Please log in again."
        );
        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      // -------------------------------------
      // 1. UPLOAD NEW DOCUMENT FILES
      // -------------------------------------

      const uploadedDocuments =
        await uploadCandidateDocuments(token);

      console.log(
        "Uploaded document response:",
        uploadedDocuments
      );

      // -------------------------------------
      // 2. KEEP EXISTING SERVER DOCUMENTS
      // -------------------------------------

      const finalIdDocument =
        uploadedDocuments?.documents?.idDocument ||
        (!isLocalFile(idDocument)
          ? idDocument
          : "");

      const finalCv =
        uploadedDocuments?.documents?.cv ||
        (!isLocalFile(cv) ? cv : "");

      const finalPoliceClearance =
        uploadedDocuments?.documents
          ?.policeClearance ||
        (!isLocalFile(policeClearance)
          ? policeClearance
          : "");

      // -------------------------------------
      // 3. KEEP EXISTING QUALIFICATIONS
      // -------------------------------------

      const existingQualifications =
        qualifications
          .filter(
            (item): item is QualificationItem =>
              typeof item === "object"
          )
          .map((item) => ({
            title:
              item.title || "Qualification",
            institution:
              item.institution || "",
            yearCompleted:
              item.yearCompleted ||
              new Date().getFullYear(),
            certificateFile:
              item.certificateFile || "",
          }));

      const uploadedQualifications =
        uploadedDocuments?.qualifications || [];

      const finalQualifications = [
        ...existingQualifications,
        ...uploadedQualifications
          .filter(
            (item: any) =>
              item?.certificateFile
          )
          .map((item: any) => ({
            title:
              item.title || "Qualification",
            institution:
              item.institution || "",
            yearCompleted:
              item.yearCompleted ||
              new Date().getFullYear(),
            certificateFile:
              item.certificateFile,
          })),
      ];

      // -------------------------------------
      // 4. KEEP EXISTING REFERENCES
      // -------------------------------------

      const existingReferences =
        references
          .filter(
            (item): item is ReferenceItem =>
              typeof item === "object"
          )
          .map((item) => ({
            file: item.file || "",
          }))
          .filter((item) => item.file);

      const uploadedReferences =
        uploadedDocuments?.references || [];

      const finalReferences = [
        ...existingReferences,
        ...uploadedReferences
          .filter(
            (item: any) =>
              item?.file
          )
          .map((item: any) => ({
            file: item.file,
          })),
      ];

      // -------------------------------------
      // 5. BUILD PROFILE PAYLOAD
      // -------------------------------------

      const payload = {
        firstName,
        surname,
        gender,

        dateOfBirth:
          dateOfBirth &&
          dateOfBirth.includes("/")
            ? new Date(
                dateOfBirth
                  .split("/")
                  .reverse()
                  .join("-")
              )
            : undefined,

        nationality,
        bio,

        province,
        city,
        suburb,
        streetAddress,

        workerTypes,
        languages,
        skills,

        yearsExperience:
          Number(yearsExperience) || 0,

        expectedSalary:
          Number(expectedSalary) || 0,

        availabilityStatus,
        workPreferences,

        shifts: {
          day: dayShift,
          night: nightShift,
        },

        profilePhoto,

        qualifications:
          finalQualifications,

        references:
          finalReferences,

        documents: {
          idDocument:
            finalIdDocument,

          policeClearance:
            finalPoliceClearance,

          cv:
            finalCv,
        },
      };

      console.log(
        "Profile payload:",
        payload
      );

      // -------------------------------------
      // 6. SAVE PROFILE
      // -------------------------------------

      if (profileExists) {
        await API.put(
          "/profiles/candidate",
          payload
        );
      } else {
        await API.post(
          "/profiles/candidate",
          payload
        );
      }

      console.log("PROFILE SAVE SUCCESS");

      Alert.alert(
        "Success",
        profileExists
          ? "Profile and documents updated successfully."
          : "Profile and documents uploaded successfully."
      );

      router.replace(
        "/(candidate)/candidate-dashboard"
      );
    } catch (err: any) {
      console.log(
        "========== PROFILE ERROR =========="
      );

      console.log(
        "Status:",
        err.response?.status
      );

      console.log(
        "Response:",
        err.response?.data
      );

      console.log(
        "Message:",
        err.message
      );

      console.log(
        "Full Error:",
        err
      );

      Alert.alert(
        "Profile Error",
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================
  // LOADING STATE
  // =====================================

  if (saving) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#4CAF50"
        />

        <Text style={styles.loadingText}>
          Uploading documents and saving profile...
        </Text>
      </View>
    );
  }

  // =====================================
  // MAIN RENDER
  // =====================================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>
        Candidate Profile Builder
      </Text>

      <Text style={styles.subHeading}>
        Step {step} of 5
      </Text>

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
          <Text style={styles.section}>
            Personal Information
          </Text>

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
                <Text style={styles.photoIcon}>
                  👤
                </Text>

                <Text style={styles.photoText}>
                  Upload Profile Picture
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>
            First Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor="#888888"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text style={styles.fieldLabel}>
            Surname
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your surname"
            placeholderTextColor="#888888"
            value={surname}
            onChangeText={setSurname}
          />

          <Text style={styles.label}>
            Gender
          </Text>

          <View style={styles.optionGrid}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                gender === "Female" &&
                  styles.optionSelected,
              ]}
              onPress={() =>
                setGender("Female")
              }
            >
              <Text
                style={[
                  styles.optionText,
                  gender === "Female" &&
                    styles.optionTextSelected,
                ]}
              >
                Female
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionButton,
                gender === "Male" &&
                  styles.optionSelected,
              ]}
              onPress={() =>
                setGender("Male")
              }
            >
              <Text
                style={[
                  styles.optionText,
                  gender === "Male" &&
                    styles.optionTextSelected,
                ]}
              >
                Male
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>
            Date of Birth
          </Text>

          <TextInput
            style={styles.input}
            placeholder="DD/MM/YYYY"
            placeholderTextColor="#888888"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />

          <Text style={styles.fieldLabel}>
            Nationality
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your nationality"
            placeholderTextColor="#888888"
            value={nationality}
            onChangeText={setNationality}
          />

          <Text style={styles.label}>
            Languages Spoken
          </Text>

          <View style={styles.checkboxContainer}>
            {[
              "English",
              "Zulu",
              "Xhosa",
              "Sotho",
              "Tsonga",
              "Tswana",
              "Venda",
              "Ndebele",
              "Swati",
              "Shona",
            ].map((language) => (
              <View
                key={language}
                style={styles.checkboxRow}
              >
                <CheckBox
                  value={languages.includes(
                    language
                  )}
                  onValueChange={() =>
                    toggleLanguage(language)
                  }
                  color="#4CAF50"
                />

                <Text
                  style={styles.checkboxLabel}
                >
                  {language}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.fieldLabel}>
            About the Candidate
          </Text>

          <Text style={styles.fieldHelp}>
            Briefly describe yourself, your experience,
            personality and the type of work you are
            looking for.
          </Text>

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
            placeholderTextColor="#888888"
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
          <Text style={styles.section}>
            Location
          </Text>

         <Text style={styles.fieldLabel}>
          Street Address
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your street address"
          placeholderTextColor="#888888"
          value={streetAddress}
          onChangeText={setStreetAddress}
        />

          <Text style={styles.label}>
            Province
          </Text>

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
                  province === item &&
                    styles.optionSelected,
                  { marginBottom: 10 },
                ]}
                onPress={() =>
                  setProvince(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    province === item &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>
            City / Town
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your city or town"
            placeholderTextColor="#888888"
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.fieldLabel}>
            Suburb
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your suburb"
            placeholderTextColor="#888888"
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

            <Text
              style={{
                color: "#555",
                lineHeight: 22,
              }}
            >
              Employers often search for candidates
              close to them. Your exact address is
              never shown publicly—only your suburb,
              city and province.
            </Text>
          </View>
        </>
      )}

      {/* ========================= */}
      {/* STEP 3 */}
      {/* ========================= */}

      {step === 3 && (
        <>
          <Text style={styles.section}>
            Employment Information
          </Text>

          <Text style={styles.label}>
            What jobs are you looking for?
          </Text>

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
                  workerTypes.includes(item) &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  toggleWorkerType(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    workerTypes.includes(item) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Years of Experience
          </Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. 5"
            keyboardType="numeric"
            value={yearsExperience}
            onChangeText={setYearsExperience}
          />

          <Text style={styles.label}>
            Expected Monthly Salary (R)
          </Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g. 6500"
            value={expectedSalary}
            onChangeText={setExpectedSalary}
          />

          <Text style={styles.label}>
            Languages Spoken
          </Text>

          <View style={styles.optionGrid}>
            {[
              "English",
              "isiZulu",
              "isiXhosa",
              "Afrikaans",
              "Tsonga",
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
                  languages.includes(item) &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  toggleLanguage(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    languages.includes(item) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Skills
          </Text>

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
                  skills.includes(item) &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  toggleSkill(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    skills.includes(item) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Availability
          </Text>

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
                  availabilityStatus === item &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  setAvailabilityStatus(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    availabilityStatus === item &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Work Preference
          </Text>

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
                  workPreferences.includes(item) &&
                    styles.optionSelected,
                ]}
                onPress={() =>
                  toggleWorkPreference(item)
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    workPreferences.includes(item) &&
                      styles.optionTextSelected,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Preferred Shift
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Day Shift
            </Text>

            <Switch
              value={dayShift}
              onValueChange={setDayShift}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              Night Shift
            </Text>

            <Switch
              value={nightShift}
              onValueChange={setNightShift}
            />
          </View>
        </>
      )}

      {/* ========================= */}
      {/* STEP 4 - DOCUMENTS */}
      {/* ========================= */}

      {step === 4 && (
        <>
          <Text style={styles.section}>
            Verification Documents
          </Text>

          <Text style={styles.infoText}>
            Upload your documents to improve your
            chances of getting hired. Verified
            candidates receive a verification badge
            after review.
          </Text>

          {/* Profile Photo */}

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={pickProfilePhoto}
          >
            <Text style={styles.uploadTitle}>
              📷 Profile Photo
            </Text>

            <Text style={styles.uploadSubtitle}>
              {profilePhoto
                ? "✅ Photo Selected"
                : "Tap to upload a profile picture"}
            </Text>
          </TouchableOpacity>

          {/* ID */}

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() =>
              pickDocument("id")
            }
          >
            <Text style={styles.uploadTitle}>
              🪪 South African ID / Passport
            </Text>

            <Text style={styles.uploadSubtitle}>
              {idDocument
                ? "✅ Document Uploaded"
                : "Upload identification"}
            </Text>
          </TouchableOpacity>

          {/* CV */}

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() =>
              pickDocument("cv")
            }
          >
            <Text style={styles.uploadTitle}>
              📄 Curriculum Vitae (CV)
            </Text>

            <Text style={styles.uploadSubtitle}>
              {cv
                ? "✅ CV Uploaded"
                : "Upload your latest CV"}
            </Text>
          </TouchableOpacity>

          {/* Police Clearance */}

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() =>
              pickDocument("police")
            }
          >
            <Text style={styles.uploadTitle}>
              👮 Police Clearance
            </Text>

            <Text style={styles.uploadSubtitle}>
              {policeClearance
                ? "✅ Uploaded"
                : "Optional but highly recommended"}
            </Text>
          </TouchableOpacity>

          {/* Qualifications */}

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() =>
              pickDocument("qualification")
            }
          >
            <Text style={styles.uploadTitle}>
              🎓 Qualifications
            </Text>

            <Text style={styles.uploadSubtitle}>
              {qualifications.length} file(s)
              uploaded
            </Text>
          </TouchableOpacity>

          {/* References */}

          <TouchableOpacity
            style={styles.uploadCard}
            onPress={() =>
              pickDocument("reference")
            }
          >
            <Text style={styles.uploadTitle}>
              👥 References
            </Text>

            <Text style={styles.uploadSubtitle}>
              {references.length} reference(s)
              uploaded
            </Text>
          </TouchableOpacity>

          <View
            style={styles.verificationBox}
          >
            <Text
              style={styles.verificationTitle}
            >
              ✔ Verification Benefits
            </Text>

            <Text
              style={styles.verificationText}
            >
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
          <Text style={styles.section}>
            Review Your Profile
          </Text>

          <Text style={styles.infoText}>
            Please review all the information below
            before creating your profile.
          </Text>

          {/* Personal */}

          <View style={styles.reviewCard}>
            <Text style={styles.reviewHeading}>
              👤 Personal Information
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Name:
              </Text>{" "}
              {firstName} {surname}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Gender:
              </Text>{" "}
              {gender}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Date of Birth:
              </Text>{" "}
              {dateOfBirth}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Nationality:
              </Text>{" "}
              {nationality}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Languages:
              </Text>{" "}
              {languages.join(", ")}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                About Me:
              </Text>{" "}
              {bio}
            </Text>
          </View>

          {/* Location */}

          <View style={styles.reviewCard}>
            <Text style={styles.reviewHeading}>
              📍 Location
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Province:
              </Text>{" "}
              {province}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                City:
              </Text>{" "}
              {city}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Suburb:
              </Text>{" "}
              {suburb}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Street:
              </Text>{" "}
              {streetAddress}
            </Text>
          </View>

          {/* Employment */}

          <View style={styles.reviewCard}>
            <Text style={styles.reviewHeading}>
              💼 Employment
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Worker Types:
              </Text>{" "}
              {workerTypes.join(", ")}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Skills:
              </Text>{" "}
              {skills.join(", ")}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Experience:
              </Text>{" "}
              {yearsExperience} years
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Expected Salary:
              </Text>{" "}
              R {expectedSalary}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Availability:
              </Text>{" "}
              {availabilityStatus}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Work Preference:
              </Text>{" "}
              {workPreferences.join(", ")}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Day Shift:
              </Text>{" "}
              {dayShift ? "Yes" : "No"}
            </Text>

            <Text style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>
                Night Shift:
              </Text>{" "}
              {nightShift ? "Yes" : "No"}
            </Text>
          </View>

          {/* Documents */}

          <View style={styles.reviewCard}>
            <Text style={styles.reviewHeading}>
              📂 Verification
            </Text>

            <Text style={styles.reviewItem}>
              Profile Photo:{" "}
              {profilePhoto ? "✅" : "❌"}
            </Text>

            <Text style={styles.reviewItem}>
              ID Document:{" "}
              {idDocument ? "✅" : "❌"}
            </Text>

            <Text style={styles.reviewItem}>
              CV: {cv ? "✅" : "❌"}
            </Text>

            <Text style={styles.reviewItem}>
              Police Clearance:{" "}
              {policeClearance
                ? "✅"
                : "❌"}
            </Text>

            <Text style={styles.reviewItem}>
              Qualifications:{" "}
              {qualifications.length}
            </Text>

            <Text style={styles.reviewItem}>
              References:{" "}
              {references.length}
            </Text>
          </View>

          <View style={styles.successBox}>
            <Text style={styles.successTitle}>
              🎉 You're Ready!
            </Text>

            <Text style={styles.successText}>
              Tap "Create Profile" below to publish
              your profile and start receiving
              opportunities from employers.
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
            <Text
              style={styles.previousButtonText}
            >
              ← Previous
            </Text>
          </TouchableOpacity>
        )}

        {step < 5 ? (
          <TouchableOpacity
            style={styles.nextButton}
            onPress={nextStep}
          >
            <Text style={styles.nextButtonText}>
              Next →
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveProfile}
          >
            <Text
              style={styles.saveButtonText}
            >
              {profileExists
                ? "✔ Update Profile"
                : "✔ Create Profile"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// =====================================
// STYLES
// =====================================

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
    textAlign: "center",
    paddingHorizontal: 20,
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
    borderColor: "#D0D0D0",
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    color: "#222222",
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

  fieldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 7,
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

  fieldHelp: {
    fontSize: 13,
    color: "#777777",
    lineHeight: 19,
    marginBottom: 10,
  },
});