import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

type Question = {
  _id: string;
  question: string;
  type:
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "long_answer";
  options?: string[];
  correctAnswer?: string;
  marks?: number;
};

type Assignment = {
  enabled?: boolean;
  title?: string;
  instructions?: string;
  passMark?: number;
  questions?: Question[];
};

type Module = {
  _id?: string;
  title?: string;
  lessons?: any[];
  assignment?: Assignment;
};

type Course = {
  _id?: string;
  title?: string;
  modules?: Module[];
};

type Result = {
  totalMarks: number;
  marksAwarded: number;
  percentage: number;
  passMark: number;
  passed: boolean;
  requiresManualReview: boolean;
};

export default function Assignment() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      courseId?: string;
      moduleId?: string;
      moduleIndex?: string;
    }>();

  const courseId =
    params.courseId || "";

  const moduleId =
    params.moduleId || "";

  const moduleIndex =
    Number(params.moduleIndex ?? 0);

  const [loading, setLoading] =
    useState(true);

  const [course, setCourse] =
    useState<Course | null>(null);

  const [assignment, setAssignment] =
    useState<Assignment | null>(null);

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const [submitting, setSubmitting] =
    useState(false);

  const [result, setResult] =
    useState<Result | null>(null);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * LOAD ASSIGNMENT
   * ============================================================
   */

  useEffect(() => {
    loadAssignment();
  }, [courseId, moduleId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {
        Alert.alert(
          "Session Expired",
          "Please log in again."
        );

        router.replace(
          "/login"
        );

        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response = await API.get(
        `/courses/${courseId}/content`
      );

      const data = response.data;

      const loadedCourse =
        data?.course ||
        data?.data?.course ||
        data;

      setCourse(
        loadedCourse
      );

      const modules =
        data?.modules ||
        data?.data?.modules ||
        loadedCourse?.modules ||
        [];

      let selectedModule =
        modules.find(
          (module: Module) =>
            String(module._id) ===
            String(moduleId)
        );

      /*
       * Fallback to module index for older
       * backend responses.
       */

      if (!selectedModule) {
        selectedModule =
          modules[moduleIndex];
      }

      if (!selectedModule) {
        throw new Error(
          "Module could not be found."
        );
      }

      if (
        !selectedModule.assignment
          ?.enabled
      ) {
        throw new Error(
          "This module does not have an assignment."
        );
      }

      setAssignment(
        selectedModule.assignment
      );
    } catch (err: any) {
      console.error(
        "ASSIGNMENT LOAD ERROR:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load assignment."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * QUESTIONS
   * ============================================================
   */

  const questions =
    useMemo(
      () =>
        assignment?.questions ||
        [],
      [assignment]
    );

  /*
   * ============================================================
   * SET ANSWER
   * ============================================================
   */

  const setAnswer = (
    questionId: string,
    answer: string
  ) => {
    setAnswers(
      (previous) => ({
        ...previous,
        [questionId]:
          answer,
      })
    );
  };

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */

  const submitAssignment =
    async () => {
      if (
        !courseId ||
        !moduleId ||
        !assignment
      ) {
        return;
      }

      const unanswered =
        questions.filter(
          (question) =>
            !answers[
              question._id
            ]?.trim()
        );

      if (
        unanswered.length > 0
      ) {
        Alert.alert(
          "Incomplete Assignment",
          `Please answer all questions before submitting.`
        );

        return;
      }

      Alert.alert(
        "Submit Assignment",
        "Are you sure you want to submit your answers?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Submit",
            onPress:
              performSubmit,
          },
        ]
      );
    };

  /*
   * ============================================================
   * PERFORM SUBMISSION
   * ============================================================
   */

  const performSubmit =
    async () => {
      try {
        setSubmitting(true);
        setError("");

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          Alert.alert(
            "Session Expired",
            "Please log in again."
          );

          router.replace(
            "/login"
          );

          return;
        }

        const submission =
          questions.map(
            (question) => ({
              questionId:
                question._id,

              answer:
                answers[
                  question._id
                ] || "",
            })
          );

        API.defaults.headers.common.Authorization =
          `Bearer ${token}`;

        const response = await API.post(
          `/courses/${courseId}/modules/${moduleId}/assignment/submit`,
          {
            answers:
              submission,
          }
        );

        const data = response.data;

        setResult(
          data?.result ||
            null
        );
      } catch (err: any) {
        console.error(
          "ASSIGNMENT SUBMIT ERROR:",
          err
        );

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to submit assignment."
        );
      } finally {
        setSubmitting(false);
      }
    };

  /*
   * ============================================================
   * RETRY
   * ============================================================
   */

  const retryAssignment =
    () => {
      setAnswers({});
      setResult(null);
      setError("");
    };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#1D4ED8"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading assignment...
        </Text>
      </View>
    );
  }

  /*
   * ============================================================
   * ERROR
   * ============================================================
   */

  if (error && !assignment) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <Text
          style={
            styles.errorIcon
          }
        >
          ⚠️
        </Text>

        <Text
          style={
            styles.errorTitle
          }
        >
          Assignment Unavailable
        </Text>

        <Text
          style={
            styles.errorText
          }
        >
          {error}
        </Text>

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /*
   * ============================================================
   * RESULT
   * ============================================================
   */

  if (result) {
    return (
      <View
        style={
          styles.container
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.resultContainer
          }
        >
          <Text
            style={
              styles.resultIcon
            }
          >
            {result.passed
              ? "✓"
              : "!"}
          </Text>

          <Text
            style={
              styles.resultTitle
            }
          >
            {result.passed
              ? "Assignment Passed"
              : "Assignment Not Passed"}
          </Text>

          <Text
            style={
              styles.resultPercentage
            }
          >
            {result.percentage}%
          </Text>

          <Text
            style={
              styles.resultMarks
            }
          >
            {result.marksAwarded} /{" "}
            {result.totalMarks} marks
          </Text>

          <Text
            style={
              styles.resultPassMark
            }
          >
            Pass mark:{" "}
            {result.passMark}%
          </Text>

          {result.requiresManualReview ? (
            <Text
              style={
                styles.resultMessage
              }
            >
              Your assignment has been
              submitted. Some answers
              require manual review.
            </Text>
          ) : (
            <Text
              style={
                styles.resultMessage
              }
            >
              {result.passed
                ? "Congratulations! You have passed this assignment."
                : "You did not reach the required pass mark. Please review the module and try again."}
            </Text>
          )}

          {result.passed ? (
            <TouchableOpacity
              style={
                styles.primaryButton
              }
              onPress={() =>
                router.replace({
                  pathname:
                    "/(student)/course-player",
                  params: {
                    id:
                      courseId,
                  },
                } as any)
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Continue Course
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={
                styles.primaryButton
              }
              onPress={
                retryAssignment
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Retry Assignment
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={
              styles.secondaryButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Back
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  /*
   * ============================================================
   * ASSIGNMENT
   * ============================================================
   */

  return (
    <View
      style={
        styles.container
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.headerLabel
            }
          >
            MODULE ASSIGNMENT
          </Text>

          <Text
            style={
              styles.title
            }
          >
            {assignment?.title ||
              "Module Assignment"}
          </Text>
        </View>

        <View
          style={
            styles.infoCard
          }
        >
          {assignment?.instructions ? (
            <Text
              style={
                styles.instructions
              }
            >
              {
                assignment.instructions
              }
            </Text>
          ) : (
            <Text
              style={
                styles.instructions
              }
            >
              Answer all questions
              and submit your
              assignment.
            </Text>
          )}

          <Text
            style={
              styles.passMark
            }
          >
            Pass Mark:{" "}
            {assignment?.passMark ||
              80}
            %
          </Text>
        </View>

        {questions.map(
          (
            question,
            index
          ) => (
            <QuestionCard
              key={
                question._id
              }
              question={
                question
              }
              index={
                index
              }
              answer={
                answers[
                  question._id
                ] || ""
              }
              onAnswer={(
                answer
              ) =>
                setAnswer(
                  question._id,
                  answer
                )
              }
            />
          )
        )}

        {error ? (
          <Text
            style={
              styles.errorMessage
            }
          >
            {error}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.submitButton,
            submitting &&
              styles.disabledButton,
          ]}
          disabled={
            submitting
          }
          onPress={
            submitAssignment
          }
        >
          {submitting ? (
            <ActivityIndicator
              color="#FFFFFF"
            />
          ) : (
            <Text
              style={
                styles.submitButtonText
              }
            >
              Submit Assignment
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

/*
 * ============================================================
 * QUESTION CARD
 * ============================================================
 */

function QuestionCard({
  question,
  index,
  answer,
  onAnswer,
}: {
  question: Question;
  index: number;
  answer: string;
  onAnswer: (
    answer: string
  ) => void;
}) {
  return (
    <View
      style={
        styles.questionCard
      }
    >
      <View
        style={
          styles.questionHeader
        }
      >
        <Text
          style={
            styles.questionNumber
          }
        >
          Question {index + 1}
        </Text>

        <Text
          style={
            styles.questionMarks
          }
        >
          {question.marks ||
            1}{" "}
          mark
          {(question.marks ||
            1) !== 1
            ? "s"
            : ""}
        </Text>
      </View>

      <Text
        style={
          styles.questionText
        }
      >
        {question.question}
      </Text>

      {question.type ===
        "multiple_choice" && (
        <View
          style={
            styles.optionsContainer
          }
        >
          {(
            question.options ||
            []
          ).map(
            (
              option,
              optionIndex
            ) => {
              if (
                !option?.trim()
              ) {
                return null;
              }

              const selected =
                answer ===
                option;

              return (
                <TouchableOpacity
                  key={
                    optionIndex
                  }
                  style={[
                    styles.option,
                    selected &&
                      styles.selectedOption,
                  ]}
                  onPress={() =>
                    onAnswer(
                      option
                    )
                  }
                >
                  <View
                    style={[
                      styles.radio,
                      selected &&
                        styles.selectedRadio,
                    ]}
                  >
                    {selected && (
                      <View
                        style={
                          styles.radioInner
                        }
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.optionText,
                      selected &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {String.fromCharCode(
                      65 +
                        optionIndex
                    )}
                    .{" "}
                    {option}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      )}

      {question.type ===
        "true_false" && (
        <View
          style={
            styles.trueFalseContainer
          }
        >
          {[
            "true",
            "false",
          ].map(
            (value) => {
              const selected =
                answer ===
                value;

              return (
                <TouchableOpacity
                  key={
                    value
                  }
                  style={[
                    styles.trueFalseButton,
                    selected &&
                      styles.selectedTrueFalse,
                  ]}
                  onPress={() =>
                    onAnswer(
                      value
                    )
                  }
                >
                  <Text
                    style={[
                      styles.trueFalseText,
                      selected &&
                        styles.selectedTrueFalseText,
                    ]}
                  >
                    {value ===
                    "true"
                      ? "True"
                      : "False"}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>
      )}

      {question.type ===
        "short_answer" && (
        <TextInput
          style={
            styles.shortAnswer
          }
          multiline
          numberOfLines={
            4
          }
          placeholder="Enter your answer..."
          value={
            answer
          }
          onChangeText={
            onAnswer
          }
          textAlignVertical="top"
        />
      )}

      {question.type ===
        "long_answer" && (
        <TextInput
          style={
            styles.longAnswer
          }
          multiline
          numberOfLines={
            8
          }
          placeholder="Enter your detailed answer..."
          value={
            answer
          }
          onChangeText={
            onAnswer
          }
          textAlignVertical="top"
        />
      )}
    </View>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FB",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#F5F7FB",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
  },

  header: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  backText: {
    color: "#1D4ED8",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 15,
  },

  headerLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1D4ED8",
    letterSpacing: 1,
    marginBottom: 5,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  infoCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 17,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  instructions: {
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
  },

  passMark: {
    marginTop: 10,
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "800",
  },

  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  questionNumber: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1D4ED8",
  },

  questionMarks: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
    fontWeight: "600",
    marginBottom: 15,
  },

  optionsContainer: {
    gap: 10,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  selectedOption: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  selectedRadio: {
    borderColor: "#1D4ED8",
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1D4ED8",
  },

  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#334155",
  },

  selectedOptionText: {
    color: "#1E3A8A",
    fontWeight: "700",
  },

  trueFalseContainer: {
    flexDirection: "row",
    gap: 10,
  },

  trueFalseButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
  },

  selectedTrueFalse: {
    borderColor: "#1D4ED8",
    backgroundColor: "#EFF6FF",
  },

  trueFalseText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
  },

  selectedTrueFalseText: {
    color: "#1D4ED8",
  },

  shortAnswer: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    padding: 14,
    fontSize: 15,
    color: "#111827",
  },

  longAnswer: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    padding: 14,
    fontSize: 15,
    color: "#111827",
  },

  submitButton: {
    backgroundColor: "#1D4ED8",
    borderRadius: 12,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  disabledButton: {
    opacity: 0.6,
  },

  errorMessage: {
    color: "#DC2626",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },

  errorIcon: {
    fontSize: 45,
    marginBottom: 12,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  errorText: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },

  backButton: {
    backgroundColor: "#1D4ED8",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 10,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  resultContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  resultIcon: {
    fontSize: 60,
    marginBottom: 15,
  },

  resultTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  resultPercentage: {
    fontSize: 52,
    fontWeight: "900",
    color: "#1D4ED8",
    marginVertical: 15,
  },

  resultMarks: {
    fontSize: 17,
    fontWeight: "700",
    color: "#334155",
  },

  resultPassMark: {
    marginTop: 7,
    color: "#64748B",
    fontSize: 14,
  },

  resultMessage: {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 23,
    color: "#475569",
    marginTop: 20,
    marginBottom: 25,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: "#1D4ED8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    width: "100%",
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "700",
  },
});