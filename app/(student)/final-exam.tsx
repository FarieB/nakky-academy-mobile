import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
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

type Question = {
  _id: string;
  question: string;
  type:
    | "multiple_choice"
    | "true_false"
    | "short_answer"
    | "long_answer"
    | string;
  options?: string[];
  marks?: number;
};

type FinalExam = {
  enabled?: boolean;
  title?: string;
  description?: string;
  durationMinutes?: number;
  passMark?: number;
  questions?: Question[];
  progression?: {
    unlocked?: boolean;
    status?: string;
    attempts?: number;
    percentage?: number;
  };
};

type Answer = {
  questionId: string;
  answer: string;
};

export default function FinalExamScreen() {
  const router = useRouter();

  const { courseId } =
    useLocalSearchParams<{
      courseId?: string;
    }>();

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [courseTitle, setCourseTitle] =
    useState("");

  const [finalExam, setFinalExam] =
    useState<FinalExam | null>(null);

  const [answers, setAnswers] =
    useState<Record<string, string>>({});

  const loadExam = async () => {
    try {
      if (!courseId) {
        throw new Error(
          "Course ID is missing."
        );
      }

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      if (!token) {
        router.replace(
          "/login" as any
        );
        return;
      }

      API.defaults.headers.common.Authorization =
        `Bearer ${token}`;

      const response =
        await API.get(
          `/courses/${courseId}/content`
        );

      const data =
        response.data;

      const exam =
        data?.finalExam ||
        data?.course?.finalExam ||
        null;

      if (!exam) {
        throw new Error(
          "This course does not have a final exam."
        );
      }

      if (!exam.enabled) {
        throw new Error(
          "The final exam is not enabled for this course."
        );
      }

      setCourseTitle(
        data?.course?.title ||
          "Final Examination"
      );

      setFinalExam(exam);
    } catch (error: any) {
      console.error(
        "FINAL EXAM LOAD ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Final Exam",
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to load the final exam.",
        [
          {
            text: "Go Back",
            onPress: () =>
              router.back(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExam();
  }, [courseId]);

  const setAnswer = (
    questionId: string,
    answer: string
  ) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));
  };

  const getAnsweredCount = () => {
    if (!finalExam?.questions) {
      return 0;
    }

    return finalExam.questions.filter(
      (question) =>
        String(
          answers[
            String(question._id)
          ] ?? ""
        ).trim() !== ""
    ).length;
  };

  const submitExam = async () => {
    if (!courseId || !finalExam) {
      return;
    }

    const questions =
      finalExam.questions || [];

    const unanswered =
      questions.filter(
        (question) =>
          String(
            answers[
              String(question._id)
            ] ?? ""
          ).trim() === ""
      );

    if (unanswered.length > 0) {
      Alert.alert(
        "Incomplete Exam",
        `You have ${unanswered.length} unanswered question${
          unanswered.length === 1
            ? ""
            : "s"
        }. Please answer all questions before submitting.`
      );

      return;
    }

    Alert.alert(
      "Submit Final Exam",
      "Are you sure you want to submit your final exam?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit",
          onPress:
            submitExamConfirmed,
        },
      ]
    );
  };

  const submitExamConfirmed =
    async () => {
      try {
        setSubmitting(true);

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        API.defaults.headers.common.Authorization =
          `Bearer ${token}`;

        const submittedAnswers =
          Object.entries(answers).map(
            ([questionId, answer]) => ({
              questionId,
              answer,
            })
          );

        const response =
          await API.post(
            `/courses/${courseId}/final-exam/submit`,
            {
              answers:
                submittedAnswers,
            }
          );

        const result =
          response.data?.result;

        const status =
          result?.status;

        const percentage =
          result?.percentage ?? 0;

        const passMark =
          result?.passMark ??
          finalExam?.passMark ??
          80;

        if (status === "passed") {
          Alert.alert(
            "Congratulations! 🎉",
            `You passed the final exam with ${percentage}%. The required pass mark is ${passMark}%.`,
            [
              {
                text: "Continue",
                onPress: () => {
                  router.back();
                },
              },
            ]
          );

          return;
        }

        if (
          status ===
          "pending_review"
        ) {
          Alert.alert(
            "Exam Submitted",
            "Your final exam has been submitted and is awaiting manual review.",
            [
              {
                text: "OK",
                onPress: () =>
                  router.back(),
              },
            ]
          );

          return;
        }

        Alert.alert(
          "Exam Not Passed",
          `You scored ${percentage}%. The required pass mark is ${passMark}%.`,
          [
            {
              text: "OK",
              onPress: () =>
                router.back(),
            },
          ]
        );
      } catch (error: any) {
        console.error(
          "FINAL EXAM SUBMIT ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        Alert.alert(
          "Submission Error",
          error?.response?.data
            ?.message ||
            "Unable to submit the final exam. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (loading) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <ActivityIndicator
          size="large"
          color="#E91E63"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Loading final exam...
        </Text>
      </View>
    );
  }

  if (!finalExam) {
    return (
      <View
        style={
          styles.loadingContainer
        }
      >
        <Text
          style={
            styles.errorText
          }
        >
          Final exam could not be loaded.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
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

  const questions =
    finalExam.questions || [];

  const answeredCount =
    getAnsweredCount();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* HEADER */}

        <View
          style={
            styles.header
          }
        >
          <TouchableOpacity
            onPress={() =>
              router.back()
            }
            style={
              styles.backLink
            }
          >
            <Text
              style={
                styles.backLinkText
              }
            >
              ← Back
            </Text>
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Final Examination
          </Text>

          <Text
            style={
              styles.courseTitle
            }
          >
            {courseTitle}
          </Text>
        </View>

        {/* EXAM INFORMATION */}

        <View
          style={
            styles.infoCard
          }
        >
          <Text
            style={
              styles.examTitle
            }
          >
            {finalExam.title ||
              "Final Examination"}
          </Text>

          {finalExam.description ? (
            <Text
              style={
                styles.description
              }
            >
              {
                finalExam.description
              }
            </Text>
          ) : null}

          <View
            style={
              styles.infoRow
            }
          >
            <Text
              style={
                styles.infoText
              }
            >
              Questions:{" "}
              {questions.length}
            </Text>

            {finalExam.durationMinutes ? (
              <Text
                style={
                  styles.infoText
                }
              >
                Time:{" "}
                {
                  finalExam.durationMinutes
                }{" "}
                min
              </Text>
            ) : null}

            <Text
              style={
                styles.infoText
              }
            >
              Pass:{" "}
              {finalExam.passMark ??
                80}
              %
            </Text>
          </View>

          <Text
            style={
              styles.progressText
            }
          >
            {answeredCount} of{" "}
            {questions.length}{" "}
            answered
          </Text>
        </View>

        {/* QUESTIONS */}

        {questions.map(
          (
            question,
            index
          ) => {
            const questionId =
              String(
                question._id
              );

            const selectedAnswer =
              answers[
                questionId
              ] || "";

            return (
              <View
                key={
                  questionId
                }
                style={
                  styles.questionCard
                }
              >
                <Text
                  style={
                    styles.questionNumber
                  }
                >
                  Question{" "}
                  {index + 1}
                </Text>

                <Text
                  style={
                    styles.questionText
                  }
                >
                  {
                    question.question
                  }
                </Text>

                <Text
                  style={
                    styles.marksText
                  }
                >
                  {question.marks ||
                    1}{" "}
                  mark
                  {(question.marks ||
                    1) !==
                  1
                    ? "s"
                    : ""}
                </Text>

                {/* MULTIPLE CHOICE */}

                {question.type ===
                  "multiple_choice" &&
                  (
                    question.options ||
                    []
                  ).map(
                    (
                      option,
                      optionIndex
                    ) => {
                      const selected =
                        selectedAnswer ===
                        option;

                      return (
                        <TouchableOpacity
                          key={
                            `${questionId}-${optionIndex}`
                          }
                          style={[
                            styles.option,
                            selected &&
                              styles.selectedOption,
                          ]}
                          onPress={() =>
                            setAnswer(
                              questionId,
                              option
                            )
                          }
                        >
                          <View
                            style={[
                              styles.radio,
                              selected &&
                                styles.radioSelected,
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
                            {
                              option
                            }
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}

                {/* TRUE / FALSE */}

                {question.type ===
                  "true_false" && (
                  <>
                    {[
                      "true",
                      "false",
                    ].map(
                      (
                        option
                      ) => {
                        const selected =
                          selectedAnswer.toLowerCase() ===
                          option;

                        return (
                          <TouchableOpacity
                            key={
                              `${questionId}-${option}`
                            }
                            style={[
                              styles.option,
                              selected &&
                                styles.selectedOption,
                            ]}
                            onPress={() =>
                              setAnswer(
                                questionId,
                                option
                              )
                            }
                          >
                            <View
                              style={[
                                styles.radio,
                                selected &&
                                  styles.radioSelected,
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
                              {option ===
                              "true"
                                ? "True"
                                : "False"}
                            </Text>
                          </TouchableOpacity>
                        );
                      }
                    )}
                  </>
                )}

                {/* SHORT / LONG ANSWER */}

                {(question.type ===
                  "short_answer" ||
                  question.type ===
                    "long_answer") && (
                  <TextInput
                    style={[
                      styles.answerInput,
                      question.type ===
                        "long_answer" &&
                        styles.longAnswerInput,
                    ]}
                    value={
                      selectedAnswer
                    }
                    onChangeText={(
                      text
                    ) =>
                      setAnswer(
                        questionId,
                        text
                      )
                    }
                    placeholder="Enter your answer..."
                    placeholderTextColor="#999"
                    multiline={
                      question.type ===
                      "long_answer"
                    }
                    textAlignVertical={
                      question.type ===
                      "long_answer"
                        ? "top"
                        : "center"
                    }
                  />
                )}
              </View>
            );
          }
        )}

        {/* SUBMIT */}

        <View
          style={
            styles.submitSection
          }
        >
          <Text
            style={
              styles.submitWarning
            }
          >
            Make sure you have
            answered every question
            before submitting.
          </Text>

          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting &&
                styles.disabledSubmitButton,
            ]}
            disabled={
              submitting
            }
            onPress={
              submitExam
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
                Submit Final Exam
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.bottomSpace
          }
        />
      </ScrollView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#F7F7F7",
    },

    content: {
      padding: 20,
    },

    loadingContainer: {
      flex: 1,
      backgroundColor:
        "#F7F7F7",
      alignItems: "center",
      justifyContent:
        "center",
      padding: 20,
    },

    loadingText: {
      marginTop: 12,
      color: "#666",
      fontSize: 15,
    },

    errorText: {
      color: "#B91C1C",
      fontSize: 16,
      textAlign: "center",
      marginBottom: 20,
    },

    header: {
      marginBottom: 18,
    },

    backLink: {
      alignSelf:
        "flex-start",
      marginBottom: 12,
    },

    backLinkText: {
      color: "#E91E63",
      fontSize: 15,
      fontWeight: "700",
    },

    headerTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: "#222",
    },

    courseTitle: {
      marginTop: 5,
      fontSize: 15,
      color: "#666",
    },

    infoCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 14,
      padding: 18,
      marginBottom: 18,
      elevation: 3,
    },

    examTitle: {
      fontSize: 21,
      fontWeight: "800",
      color: "#222",
      marginBottom: 8,
    },

    description: {
      fontSize: 14,
      color: "#666",
      lineHeight: 21,
      marginBottom: 14,
    },

    infoRow: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap: 10,
    },

    infoText: {
      backgroundColor:
        "#FCE7F3",
      color: "#BE185D",
      fontSize: 13,
      fontWeight: "700",
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
    },

    progressText: {
      marginTop: 14,
      fontSize: 14,
      color: "#555",
      fontWeight: "600",
    },

    questionCard: {
      backgroundColor:
        "#FFFFFF",
      borderRadius: 14,
      padding: 18,
      marginBottom: 15,
      elevation: 2,
    },

    questionNumber: {
      fontSize: 13,
      fontWeight: "800",
      color: "#E91E63",
      marginBottom: 8,
      textTransform:
        "uppercase",
    },

    questionText: {
      fontSize: 17,
      fontWeight: "700",
      color: "#222",
      lineHeight: 24,
      marginBottom: 7,
    },

    marksText: {
      fontSize: 12,
      color: "#777",
      marginBottom: 15,
    },

    option: {
      flexDirection:
        "row",
      alignItems:
        "center",
      borderWidth: 1,
      borderColor:
        "#E5E7EB",
      borderRadius: 10,
      padding: 13,
      marginBottom: 10,
      backgroundColor:
        "#FFFFFF",
    },

    selectedOption: {
      borderColor:
        "#E91E63",
      backgroundColor:
        "#FDF2F8",
    },

    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor:
        "#9CA3AF",
      marginRight: 12,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    radioSelected: {
      borderColor:
        "#E91E63",
    },

    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor:
        "#E91E63",
    },

    optionText: {
      flex: 1,
      fontSize: 15,
      color: "#333",
      lineHeight: 21,
    },

    selectedOptionText: {
      color: "#9D174D",
      fontWeight: "700",
    },

    answerInput: {
      borderWidth: 1,
      borderColor:
        "#D1D5DB",
      borderRadius: 10,
      backgroundColor:
        "#FFFFFF",
      paddingHorizontal: 13,
      paddingVertical: 12,
      fontSize: 15,
      color: "#222",
      minHeight: 48,
    },

    longAnswerInput: {
      minHeight: 130,
      textAlignVertical:
        "top",
    },

    submitSection: {
      marginTop: 8,
      backgroundColor:
        "#FFFFFF",
      borderRadius: 14,
      padding: 18,
      elevation: 2,
    },

    submitWarning: {
      fontSize: 13,
      color: "#666",
      lineHeight: 19,
      marginBottom: 14,
    },

    submitButton: {
      backgroundColor:
        "#E91E63",
      borderRadius: 10,
      paddingVertical: 15,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    disabledSubmitButton: {
      opacity: 0.6,
    },

    submitButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
    },

    backButton: {
      backgroundColor:
        "#E91E63",
      borderRadius: 10,
      paddingHorizontal: 22,
      paddingVertical: 12,
    },

    backButtonText: {
      color: "#FFFFFF",
      fontWeight: "700",
    },

    bottomSpace: {
      height: 40,
    },
  });