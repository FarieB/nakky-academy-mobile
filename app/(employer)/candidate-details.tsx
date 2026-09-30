import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import API from "../../src/services/api";

export default function CandidateDetails() {
  const router = useRouter();

  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [loading, setLoading] =
    useState(true);

  const [candidate, setCandidate] =
    useState<any>(null);

  // Step 1 — Add a new state
  const [subscriptionActive, setSubscriptionActive] =
    useState(false);

  const [saved, setSaved] = useState(false);

    // ==========================================
  // RATING
  // ==========================================

  const [selectedRating, setSelectedRating] =
    useState(0);

  const [reviewComment, setReviewComment] =
    useState("");

  const [submittingReview, setSubmittingReview] =
    useState(false);

  const [hasReviewed, setHasReviewed] =
    useState(false);

  const [myReview, setMyReview] =
    useState<any>(null);

  const loadCandidate = async () => {
    try {
      const token =
        await AsyncStorage.getItem(
          "token"
        );

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get(
        `/profiles/candidate/${id}`
      );

      setCandidate(response.data);

    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.response?.data?.message ||
          "Unable to load candidate."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Check the employer's subscription
  const checkSubscription = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get(
        "/subscriptions/my-subscription"
      );

      console.log(
        "MY SUBSCRIPTION RESPONSE:",
        response.data
      );

      setSubscriptionActive(
        response.data.subscriptionStatus === "active"
      );

      } catch (err: any) {
      console.log(
        "SUBSCRIPTION CHECK ERROR:",
        err?.response?.status,
        err?.response?.data || err?.message
      );

      setSubscriptionActive(false);
    }
  };

    // ==========================================
  // LOAD CANDIDATE REVIEWS
  // ==========================================

  const loadReviews = async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      if (!token || !id) {
        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get(
        `/reviews/candidate/${id}`
      );

      const reviews =
        response.data?.reviews || [];

      const currentUser =
        JSON.parse(
          (await AsyncStorage.getItem("user")) || "{}"
        );

      const existingReview =
        reviews.find(
          (review: any) =>
            String(review.employer?._id) ===
            String(currentUser._id)
        );

      if (existingReview) {
        setHasReviewed(true);
        setMyReview(existingReview);
      } else {
        setHasReviewed(false);
        setMyReview(null);
      }

    } catch (err: any) {
      console.log(
        "LOAD REVIEWS ERROR:",
        err?.response?.data ||
          err?.message
      );
    }
  };

    // ==========================================
  // SUBMIT RATING
  // ==========================================

  const submitReview = async () => {
    if (!candidate?._id) {
      Alert.alert(
        "Error",
        "Candidate information is missing."
      );
      return;
    }

    if (
      selectedRating < 1 ||
      selectedRating > 5
    ) {
      Alert.alert(
        "Rating Required",
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    try {
      setSubmittingReview(true);

      const token =
        await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Error",
          "You are not logged in."
        );
        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.post(
        "/reviews",
        {
          candidateId: candidate._id,
          rating: selectedRating,
          comment: reviewComment.trim(),
        }
      );

      Alert.alert(
        "Rating Submitted",
        "Thank you. Your rating has been submitted successfully."
      );

      setHasReviewed(true);
      setMyReview(response.data?.review || {
        rating: selectedRating,
        comment: reviewComment.trim(),
      });

      // Refresh candidate profile so the
      // new average rating appears immediately.
      await loadCandidate();

    } catch (err: any) {
      console.log(
        "SUBMIT REVIEW ERROR:",
        err?.response?.data ||
          err?.message
      );

      Alert.alert(
        "Unable to Submit Rating",
        err?.response?.data?.message ||
          "Something went wrong while submitting your rating."
      );

    } finally {
      setSubmittingReview(false);
    }
  };

const saveCandidate = async () => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      Alert.alert("Error", "You are not logged in.");
      return;
    }

    if (!candidate?._id) {
      Alert.alert("Error", "Candidate ID is missing.");
      return;
    }

    API.defaults.headers.common.Authorization =
      `Bearer ${token}`;

    await API.post(
      `/profiles/candidate/${candidate._id}/save`
    );

    setSaved(true);

    Alert.alert(
      "Success",
      "Candidate saved successfully."
    );

  } catch (err: any) {
    console.log(
      "SAVE CANDIDATE ERROR:",
      err?.response?.data || err.message
    );

    if (err?.response?.status === 400) {
      setSaved(true);

      Alert.alert(
        "Saved",
        "Candidate is already in your saved list."
      );

      return;
    }

    Alert.alert(
      "Error",
      err?.response?.data?.message ||
        "Unable to save candidate."
    );
  }
};

  // Step 3 — Load it when the screen opens
  useEffect(() => {
    loadCandidate();
    checkSubscription();
    loadReviews();
  }, []);


  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#2E7D32"
        />
      </View>
    );
  }

  // FIXED: Changed from !candidate to candidate so details show when loaded
  if (candidate) {
   return (
  <ScrollView
    style={styles.container}
    showsVerticalScrollIndicator={false}
  >
    {/* ========================= */}
    {/* PROFILE PHOTO */}
    {/* ========================= */}

    <Image
      source={{
        uri:
          candidate.profilePhoto ||
          candidate.user?.profilePhoto,
      }}
      style={styles.profileImage}
    />

    {/* ========================= */}
    {/* NAME */}
    {/* ========================= */}

    <Text style={styles.name}>
      {candidate.firstName}
    </Text>

    {candidate.user?.verifiedBadge && (
      <Text style={styles.verified}>
        ✅ Verified Candidate
      </Text>
    )}

    {/* ========================= */}
    {/* WORKER TYPES */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Worker Types
      </Text>

      <Text style={styles.text}>
        {candidate.workerTypes?.join(", ")}
      </Text>
    </View>

    {/* ========================= */}
    {/* LOCATION */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Location
      </Text>

      <Text style={styles.text}>
        {candidate.suburb}
      </Text>

      <Text style={styles.text}>
        {candidate.city}
      </Text>

      <Text style={styles.text}>
        {candidate.province}
      </Text>
    </View>

    {/* ========================= */}
    {/* EXPERIENCE */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Experience
      </Text>

      <Text style={styles.text}>
        {candidate.yearsExperience} Years
      </Text>
    </View>

    {/* ========================= */}
    {/* WORK PREFERENCE */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Work Preference
      </Text>

      <Text style={styles.text}>
        {candidate.workPreferences?.join(", ") ||
          "Not specified"}
      </Text>

      <Text style={styles.text}>
        {candidate.availabilityStatus}
      </Text>
    </View>

    {/* ========================= */}
    {/* PERSONAL DETAILS */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Personal Details
      </Text>

      <Text style={styles.text}>
        Gender: {candidate.gender}
      </Text>

      <Text style={styles.text}>
        Age: {candidate.age}
      </Text>

      <Text style={styles.text}>
        Nationality: {candidate.nationality}
      </Text>
    </View>

    {/* ========================= */}
    {/* LANGUAGES */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Languages
      </Text>

      <Text style={styles.text}>
        {candidate.languages?.join(", ")}
      </Text>
    </View>

    {/* ========================= */}
    {/* SKILLS */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Skills
      </Text>

      <Text style={styles.text}>
        {candidate.skills?.join(", ")}
      </Text>
    </View>

    {/* ========================= */}
    {/* QUALIFICATIONS */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Qualifications
      </Text>

      {candidate.qualifications?.length ? (
        candidate.qualifications.map(
          (item: any, index: number) => (
            <View
              key={item._id || index}
              style={{
                marginBottom: 15,
                paddingBottom: 15,
                borderBottomWidth:
                  index <
                  candidate.qualifications.length - 1
                    ? 1
                    : 0,
                borderBottomColor: "#E0E0E0",
              }}
            >
              <Text style={styles.text}>
                🎓 {item.title || "Qualification"}
              </Text>

              {item.institution && (
                <Text style={styles.text}>
                  Institution: {item.institution}
                </Text>
              )}

              {item.yearCompleted && (
                <Text style={styles.text}>
                  Year Completed: {item.yearCompleted}
                </Text>
              )}

              {item.certificateFile && (
                <Text
                  style={[
                    styles.text,
                    {
                      color: "#2E7D32",
                      fontWeight: "600",
                    },
                  ]}
                >
                  📄 Certificate available
                </Text>
              )}
            </View>
          )
        )
      ) : (
        <Text style={styles.text}>
          None supplied
        </Text>
      )}
    </View>

    {/* ========================= */}
    {/* SALARY */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Expected Salary
      </Text>

      <Text style={styles.salary}>
        R {candidate.expectedSalary} / month
      </Text>
    </View>

    {/* ========================= */}
    {/* BIO */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        About Me
      </Text>

      <Text style={styles.bio}>
        {candidate.bio ||
          "No biography provided."}
      </Text>
    </View>

        {/* ========================= */}
    {/* RATING */}
    {/* ========================= */}

    <View style={styles.card}>
      <Text style={styles.title}>
        Employer Rating
      </Text>

      <Text style={styles.rating}>
        ⭐ {candidate.averageRating || 0} / 5
      </Text>

      <Text style={styles.text}>
        {candidate.totalReviews || 0} Reviews
      </Text>

      {/* ================================= */}
      {/* EXISTING REVIEW */}
      {/* ================================= */}

      {hasReviewed && myReview ? (
        <View style={styles.myReviewBox}>
          <Text style={styles.myReviewTitle}>
            Your Review
          </Text>

          <Text style={styles.myReviewStars}>
            {"⭐".repeat(myReview.rating || 0)}
          </Text>

          {myReview.comment ? (
            <Text style={styles.myReviewComment}>
              "{myReview.comment}"
            </Text>
          ) : (
            <Text style={styles.noComment}>
              No comment provided.
            </Text>
          )}

          <Text style={styles.reviewSubmitted}>
            You have already rated this candidate.
          </Text>
        </View>
      ) : (
        <>
          {/* ================================= */}
          {/* RATE CANDIDATE */}
          {/* ================================= */}

          <Text style={styles.rateHeading}>
            Rate this Candidate
          </Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() =>
                  setSelectedRating(star)
                }
                style={styles.starButton}
                disabled={submittingReview}
              >
                <Text
                  style={[
                    styles.star,
                    star <= selectedRating &&
                      styles.selectedStar,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingInstruction}>
            {selectedRating === 0
              ? "Select a rating"
              : `${selectedRating} out of 5 stars`}
          </Text>

          <TextInput
            style={styles.reviewInput}
            placeholder="Write an optional comment..."
            placeholderTextColor="#888"
            value={reviewComment}
            onChangeText={setReviewComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            editable={!submittingReview}
          />

          <Text style={styles.characterCount}>
            {reviewComment.length}/500
          </Text>

          <TouchableOpacity
            style={[
              styles.submitReviewButton,
              (selectedRating === 0 ||
                submittingReview) &&
                styles.submitReviewButtonDisabled,
            ]}
            onPress={submitReview}
            disabled={
              selectedRating === 0 ||
              submittingReview
            }
          >
            {submittingReview ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitReviewText}>
                ⭐ Submit Rating
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>

    {/* ========================= */}
    {/* ACTION BUTTONS */}
    {/* ========================= */}

    {/* Step 4 — Replace the Contact Button */}
    {subscriptionActive ? (
      <TouchableOpacity
        style={styles.contactButton}
       onPress={() =>
        router.push({
          pathname: "/messaging/[userId]",
          params: {
            userId: candidate.user?._id || candidate.user,
            name:
              candidate.firstName ||
              candidate.name ||
              "Candidate",
          },
        })
      } 
      >
        <Text style={styles.contactButtonText}>
          💬 Message Candidate
        </Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={styles.subscribeButton}
        onPress={() =>
          router.push("/subscribe")
        }
      >
        <Text
          style={styles.subscribeButtonText}
        >
          🔒 Subscribe to Message Candidate
        </Text>
      </TouchableOpacity>
    )}

    <TouchableOpacity
      style={[
        styles.saveButton,
        saved && styles.savedButton,
      ]}
      disabled={saved}
      onPress={saveCandidate}
    > 
      <Text style={styles.saveButtonText}>
        {saved ? "✓ Saved" : "❤ Save Candidate"}
      </Text> 
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.reportButton}
    >
      <Text
        style={styles.reportButtonText}
      >
        Report Profile
      </Text>
    </TouchableOpacity>

    <View style={{ height: 40 }} />
  </ScrollView>
  );
 }

 return null;
}


// Temporary empty stylesheet wrapper to prevent execution crash
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },

  profileImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignSelf: "center",
    marginTop: 30,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#2E7D32",
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#222",
  },

  verified: {
    textAlign: "center",
    color: "#2E7D32",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 25,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginBottom: 18,
    borderRadius: 16,
    padding: 18,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 3,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
    lineHeight: 24,
  },

  bio: {
    fontSize: 16,
    color: "#555",
    lineHeight: 26,
  },

  salary: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32",
  },

  rating: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F9A825",
    marginBottom: 6,
  },

    rateHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 20,
    marginBottom: 12,
  },

  starRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },

  starButton: {
    paddingHorizontal: 5,
  },

  star: {
    fontSize: 38,
    color: "#D0D0D0",
  },

  selectedStar: {
    color: "#FFC107",
  },

  ratingInstruction: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    marginBottom: 15,
  },

  reviewInput: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    fontSize: 15,
    color: "#333",
    textAlignVertical: "top",
  },

  characterCount: {
    textAlign: "right",
    color: "#888",
    fontSize: 12,
    marginTop: 5,
  },

  submitReviewButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },

  submitReviewButtonDisabled: {
    backgroundColor: "#A5A5A5",
  },

  submitReviewText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  myReviewBox: {
    backgroundColor: "#F6F8FA",
    borderRadius: 12,
    padding: 15,
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  myReviewTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  myReviewStars: {
    fontSize: 24,
    color: "#FFC107",
    marginBottom: 8,
  },

  myReviewComment: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    fontStyle: "italic",
  },

  noComment: {
    fontSize: 14,
    color: "#777",
    fontStyle: "italic",
  },

  reviewSubmitted: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
    marginTop: 10,
  },

  contactButton: {
    backgroundColor: "#2E7D32",
    marginHorizontal: 18,
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  subscribeButton: {
    backgroundColor: "#FF9800",
    marginHorizontal: 18,
    marginTop: 10,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  subscribeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  saveButton: {
   backgroundColor: "#9E9E9E", 
    marginHorizontal: 18,
    marginTop: 15,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

    savedButton: {
    backgroundColor: "#2E7D32",
    marginHorizontal: 18,
    marginTop: 15,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  reportButton: {
    backgroundColor: "#D32F2F",
    marginHorizontal: 18,
    marginTop: 15,
    marginBottom: 40,
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
  },

  reportButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
